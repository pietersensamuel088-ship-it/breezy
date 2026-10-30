import fs from 'fs';
import path from 'path';

const MAX_CACHE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export function touchLru(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const now = new Date();
      fs.utimesSync(filePath, now, now);
    }
  } catch {
    // ignore
  }
}

export function cleanLruCache(dir, maxBytes = MAX_CACHE_BYTES) {
  try {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name.endsWith('.tmp') || entry.name.endsWith('.part')) continue;
        try {
          const stat = fs.statSync(fullPath);
          files.push({ path: fullPath, name: entry.name, size: stat.size, mtime: stat.mtimeMs });
        } catch {
          // ignore
        }
      }
    }

    let totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > maxBytes) {
      console.log(`[LRU Cache] Total storage ${Math.round(totalSize / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit. Pruning least recently used songs...`);
      // Sort oldest first
      files.sort((a, b) => a.mtime - b.mtime);
      for (const f of files) {
        if (totalSize <= maxBytes * 0.75) break; // Prune to 75%
        try {
          fs.unlinkSync(f.path);
          totalSize -= f.size;
          console.log(`[LRU Cache] Evicted: ${f.name} (${Math.round(f.size / 1024 / 1024)}MB)`);
        } catch (err) {
          console.warn(`[LRU Cache] Could not unlink ${f.name}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.warn('[LRU Cache Note]', err.message);
  }
}
