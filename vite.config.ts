import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { Readable } from 'stream';

let currentGitSha = '3fa3f5c';
try {
  currentGitSha = execSync('git rev-parse HEAD').toString().trim();
} catch {}

const MAX_LRU_CACHE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

function touchLru(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const now = new Date();
      fs.utimesSync(filePath, now, now);
    }
  } catch {}
}

function cleanLruCache(songsDir: string, maxBytes = MAX_LRU_CACHE_BYTES) {
  try {
    if (!fs.existsSync(songsDir)) return;
    const entries = fs.readdirSync(songsDir, { withFileTypes: true });
    const files: { path: string; name: string; size: number; mtime: number }[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(songsDir, entry.name);
        if (entry.name.endsWith('.tmp') || entry.name.endsWith('.part')) continue;
        try {
          const stat = fs.statSync(fullPath);
          files.push({ path: fullPath, name: entry.name, size: stat.size, mtime: stat.mtimeMs });
        } catch {}
      }
    }

    let totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > maxBytes) {
      console.log(`[LRU Cache] Storage ${Math.round(totalSize / 1024 / 1024)}MB exceeds limit. Pruning oldest songs...`);
      files.sort((a, b) => a.mtime - b.mtime);
      for (const f of files) {
        if (totalSize <= maxBytes * 0.75) break;
        try {
          fs.unlinkSync(f.path);
          totalSize -= f.size;
          console.log(`[LRU Cache] Evicted: ${f.name}`);
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[LRU Cache Note]', err);
  }
}

function findLocalSong(title: string, artist: string, songId?: string): string | null {
  const songsDir = path.resolve(__dirname, 'nicsongs');
  if (!fs.existsSync(songsDir)) return null;

  // If specific ID is provided, check direct ID file first
  if (songId) {
    const cleanId = songId.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    for (const ext of ['.mp3', '.flac', '.m4a', '.wav']) {
      const idPath = path.join(songsDir, `${cleanId}${ext}`);
      if (fs.existsSync(idPath)) return idPath;
    }
  }

  const cleanArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseTitle = title.replace(/\s*[\(\[](?:feat\.?|ft\.?|with)[\s\S]*?[\)\]]/gi, '').trim();
  const cleanBaseTitle = baseTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseArtist = artist.replace(/\s+(?:feat\.?|ft\.?|with|&|\band\b)\s+.*$/i, '').trim();
  const cleanBaseArtist = baseArtist.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct exact filename check (Artist + Title)
  const candidates = [
    `${artist}_${title}`,
    `${artist}_${baseTitle}`,
    `${baseArtist}_${title}`,
    `${baseArtist}_${baseTitle}`,
  ];

  for (const c of candidates) {
    const sanitizedName = c.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
    for (const ext of ['.mp3', '.flac', '.m4a', '.wav']) {
      const directPath = path.join(songsDir, `${sanitizedName}${ext}`);
      if (fs.existsSync(directPath)) return directPath;
    }
  }

  // 2. Strict file scan (MUST have at least 3 chars match for BOTH artist and title to prevent collision)
  const rootEntries = fs.readdirSync(songsDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
        const cleanName = lower.replace(/[^a-z0-9]/g, '');
        const artistMatch = (cleanArtist.length >= 3 && cleanName.includes(cleanArtist)) ||
                            (cleanBaseArtist.length >= 3 && cleanName.includes(cleanBaseArtist));
        const titleMatch = (cleanTitle.length >= 3 && cleanName.includes(cleanTitle)) ||
                           (cleanBaseTitle.length >= 3 && cleanName.includes(cleanBaseTitle));
        if (artistMatch && titleMatch) {
          return path.join(songsDir, entry.name);
        }
      }
    }
  }

  // 3. Scan subdirectories (excluding any known corrupt/mislabeled rip directories)
  function scanSubdirs(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.includes('Indigo (Extended)')) continue;
        const found = scanSubdirs(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
          const cleanName = lower.replace(/[^a-z0-9]/g, '');
          const artistMatch = (cleanArtist.length >= 3 && cleanName.includes(cleanArtist)) ||
                              (cleanBaseArtist.length >= 3 && cleanName.includes(cleanBaseArtist));
          const titleMatch = (cleanTitle.length >= 3 && cleanName.includes(cleanTitle)) ||
                             (cleanBaseTitle.length >= 3 && cleanName.includes(cleanBaseTitle));
          if (artistMatch && titleMatch) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }

  return scanSubdirs(songsDir);
}

function serveLocalRange(filePath: string, req: any, res: any) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = filePath.endsWith('.flac')
    ? 'audio/flac'
    : filePath.endsWith('.m4a') || filePath.endsWith('.mp4')
    ? 'audio/mp4'
    : filePath.endsWith('.webm')
    ? 'audio/webm'
    : 'audio/mpeg';

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    stream.pipe(res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
}

const inFlightDownloads = new Map<string, Promise<string | null>>();

function breezyAudioStreamerPlugin(): Plugin {
  return {
    name: 'breezy-audio-streamer',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/health')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            status: 'online',
            service: 'Breezy Master Streamer',
            version: '1.0.0',
            mode: 'on-demand-autonomous',
            timestamp: new Date().toISOString()
          }));
          return;
        }

        if (!req.url?.startsWith('/api/stream')) {
          return next();
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
          res.end();
          return;
        }

        const url = new URL(req.url, 'http://127.0.0.1:5173');
        const songId = url.searchParams.get('id') || '';
        const title = url.searchParams.get('title') || 'Under the Influence';
        const artist = url.searchParams.get('artist') || 'Chris Brown';
        const trackKey = `${songId ? songId + '_' : ''}${artist}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '');

        console.log(`[Breezy Stream] Request for: "${artist} - ${title}" (ID: ${songId || 'none'})`);

        // 1. Check local LRU cache in nicsongs
        let filePath = findLocalSong(title, artist, songId);
        if (filePath && fs.existsSync(filePath)) {
          touchLru(filePath);
          serveLocalRange(filePath, req, res);
          return;
        }

        const songsDir = path.resolve(__dirname, 'nicsongs');
        if (!fs.existsSync(songsDir)) {
          fs.mkdirSync(songsDir, { recursive: true });
        }

        const cleanArtist = artist.replace(/[/\\"'`$]/g, ' ').replace(/\s+/g, ' ').trim();
        const cleanTitle = title.replace(/[/\\"'`$]/g, ' ').replace(/\s+/g, ' ').trim();
        const cleanName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
        const targetMp3 = path.resolve(songsDir, `${cleanName}.mp3`);
        const targetTemp = path.resolve(songsDir, `${cleanName}.tmp`);
        const query = `"${cleanArtist}" "${cleanTitle}" Topic`;

        // 2. Await in-flight download if already downloading
        if (inFlightDownloads.has(trackKey)) {
          console.log(`[Breezy Stream] Awaiting in-flight master download for: "${artist} - ${title}"...`);
          await inFlightDownloads.get(trackKey);
          if (fs.existsSync(targetMp3)) {
            touchLru(targetMp3);
            serveLocalRange(targetMp3, req, res);
            return;
          }
        }

        // 3. Download and stream FULL studio master track (NO 30s previews)
        console.log(`[Breezy Stream] Fetching FULL master track on-demand: "${artist} - ${title}"...`);
        const downloadPromise = new Promise<string | null>((resolve) => {
          const dlProc = spawn('yt-dlp', [
            '--no-check-certificates',
            '--extractor-args', 'youtube:player_client=android,web',
            '-f', 'ba[ext=m4a][abr<=160]/ba[abr<=160]/ba/b',
            '-o', targetMp3,
            `ytsearch1:${query}`
          ]);

          dlProc.on('close', (code) => {
            inFlightDownloads.delete(trackKey);
            if (code === 0 && fs.existsSync(targetMp3)) {
              touchLru(targetMp3);
              cleanLruCache(songsDir);
              console.log(`[Breezy Stream] FULL master track saved: ${targetMp3}`);
              resolve(targetMp3);
            } else {
              const local = findLocalSong(title, artist);
              resolve(local);
            }
          });

          dlProc.on('error', (err) => {
            console.error('[Breezy Stream Download Error]', err.message);
            inFlightDownloads.delete(trackKey);
            resolve(null);
          });
        });

        inFlightDownloads.set(trackKey, downloadPromise);
        const savedPath = await downloadPromise;

        if (savedPath && fs.existsSync(savedPath)) {
          serveLocalRange(savedPath, req, res);
        } else {
          res.statusCode = 404;
          res.end(`Full track for "${artist} - ${title}" could not be downloaded.`);
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_COMMIT_SHA__: JSON.stringify(currentGitSha),
  },
  plugins: [react(), breezyAudioStreamerPlugin()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/release/**', '**/public/music/**', '**/nicsongs/**']
    }
  }
});
