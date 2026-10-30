import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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

function findLocalSong(title: string, artist: string): string | null {
  const songsDir = path.resolve(__dirname, 'nicsongs');
  if (!fs.existsSync(songsDir)) return null;

  const cleanArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct specific file check: e.g. "jhene_aiko_guidance.mp3"
  const sanitizedName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
  for (const ext of ['.mp3', '.flac', '.m4a', '.wav']) {
    const directPath = path.join(songsDir, `${sanitizedName}${ext}`);
    if (fs.existsSync(directPath)) return directPath;
  }

  // 2. Scan recursively requiring BOTH artist and title to match
  function scan(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = scan(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
          const cleanName = lower.replace(/[^a-z0-9]/g, '');
          
          // Require ARTIST to match if artist has more than 2 alphanumeric chars
          const artistMatch = cleanArtist.length < 3 || cleanName.includes(cleanArtist);
          // Require EXACT full TITLE string to match
          const titleMatch = cleanName.includes(cleanTitle);

          if (artistMatch && titleMatch) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }

  return scan(songsDir);
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
        const title = url.searchParams.get('title') || 'Under the Influence';
        const artist = url.searchParams.get('artist') || 'Chris Brown';
        const trackKey = `${artist}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '');

        console.log(`[Breezy Stream] Request for: "${artist} - ${title}"`);

        // 1. Check local LRU cache in nicsongs
        let filePath = findLocalSong(title, artist);
        if (filePath && fs.existsSync(filePath)) {
          touchLru(filePath);
          serveLocalRange(filePath, req, res);
          return;
        }

        // 2. If not yet cached, stream directly while saving to local LRU cache
        const songsDir = path.resolve(__dirname, 'nicsongs');
        if (!fs.existsSync(songsDir)) {
          fs.mkdirSync(songsDir, { recursive: true });
        }

        const cleanArtist = artist.replace(/["'$`\\]/g, '');
        const cleanTitle = title.replace(/["'$`\\]/g, '');
        const cleanName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
        const targetMp3 = path.resolve(songsDir, `${cleanName}.mp3`);
        const targetTemp = path.resolve(songsDir, `${cleanName}.tmp`);
        const query = `"${cleanArtist}" "${cleanTitle}" official audio`;

        console.log(`[Breezy Stream] Real-time HTTP chunked pipe: "${artist} - ${title}"...`);

        // Fast native stream (AAC 128k-160k for instant first-chunk startup)
        const proc = spawn('yt-dlp', [
          '--no-check-certificates',
          '--extractor-args', 'youtube:player_client=android,web',
          '-f', 'ba[ext=m4a][abr<=160]/ba[abr<=160]/ba/b',
          '-o', '-',
          `ytsearch1:${query}`
        ]);

        const fileStream = fs.createWriteStream(targetTemp);
        let headersSent = false;

        proc.stdout.on('data', (chunk) => {
          fileStream.write(chunk);

          if (!headersSent && !res.headersSent) {
            headersSent = true;
            res.writeHead(200, {
              'Content-Type': 'audio/mp4',
              'Transfer-Encoding': 'chunked',
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
              'Cache-Control': 'no-cache',
            });
          }

          if (!res.writableEnded) {
            res.write(chunk);
          }
        });

        proc.stdout.on('end', () => {
          fileStream.end();
          if (!res.writableEnded) {
            res.end();
          }
        });

        proc.on('close', (code) => {
          if (code === 0 && fs.existsSync(targetTemp)) {
            try {
              if (fs.existsSync(targetMp3)) {
                fs.unlinkSync(targetMp3);
              }
              fs.renameSync(targetTemp, targetMp3);
              touchLru(targetMp3);
              cleanLruCache(songsDir);
              console.log(`[Breezy Stream] Master audio cached to disk: ${targetMp3}`);
            } catch (err: any) {
              console.warn('[Cache Rename Note]', err.message);
            }
          }
        });

        proc.on('error', (err) => {
          console.error('[Breezy Stream Error]', err);
          if (!headersSent && !res.headersSent) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        req.on('close', () => {
          // If client disconnects or aborts, let proc finish saving file in background!
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), breezyAudioStreamerPlugin()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/release/**', '**/public/music/**', '**/nicsongs/**']
    }
  }
});
