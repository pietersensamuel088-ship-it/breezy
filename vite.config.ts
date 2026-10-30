import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Readable } from 'stream';

const MAX_LRU_CACHE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const previewCache = new Map<string, string>();

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

  const baseTitle = title.replace(/\s*[\(\[](feat|ft|with)[\s\S]*?[\)\]]/gi, '').trim();
  const baseArtist = artist.replace(/\s*(&|feat\.|ft\.|and).*$/i, '').trim();

  const cleanArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBaseArtist = baseArtist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBaseTitle = baseTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct specific file checks in root of nicsongs
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

  // 2. Scan direct root files first (verified downloads)
  const rootEntries = fs.readdirSync(songsDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
        const cleanName = lower.replace(/[^a-z0-9]/g, '');
        const artistMatch = cleanName.includes(cleanArtist) || cleanName.includes(cleanBaseArtist);
        const titleMatch = cleanName.includes(cleanTitle) || cleanName.includes(cleanBaseTitle);
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
          const artistMatch = cleanName.includes(cleanArtist) || cleanName.includes(cleanBaseArtist);
          const titleMatch = cleanName.includes(cleanTitle) || cleanName.includes(cleanBaseTitle);
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

        // 2. Ultra-Fast Instant Audio Handoff: Akamai/Apple Preview CDN (<50ms startup)
        let instantPreviewUrl = previewCache.get(trackKey);
        if (!instantPreviewUrl) {
          try {
            const searchRes = await fetch(
              `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}&entity=song&limit=1`,
              { signal: AbortSignal.timeout(600) }
            );
            if (searchRes.ok) {
              const data = await searchRes.json() as any;
              if (data.results?.[0]?.previewUrl) {
                instantPreviewUrl = data.results[0].previewUrl;
                previewCache.set(trackKey, instantPreviewUrl);
              }
            }
          } catch (err: any) {
            console.log(`[Preview Cache Miss] ${err?.message || err}`);
          }
        }

        // Trigger background download of full master track if not already downloading
        if (!inFlightDownloads.has(trackKey) && !fs.existsSync(targetMp3)) {
          const bgPromise = new Promise<void>((resolve) => {
            console.log(`[Breezy Stream] Starting background master download: "${artist} - ${title}"...`);
            const bgProc = spawn('yt-dlp', [
              '--no-check-certificates',
              '--extractor-args', 'youtube:player_client=android,web',
              '-f', 'ba[ext=m4a][abr<=160]/ba[abr<=160]/ba/b',
              '-o', targetTemp,
              `ytsearch1:${query}`
            ]);

            bgProc.on('close', (code) => {
              inFlightDownloads.delete(trackKey);
              if (code === 0 && fs.existsSync(targetTemp)) {
                try {
                  if (fs.existsSync(targetMp3)) fs.unlinkSync(targetMp3);
                  fs.renameSync(targetTemp, targetMp3);
                  touchLru(targetMp3);
                  cleanLruCache(songsDir);
                  console.log(`[Breezy Stream] Master audio saved to disk in background: ${targetMp3}`);
                } catch {}
              }
              resolve();
            });

            bgProc.on('error', (err) => {
              console.warn('[Breezy Background Download Error]', err.message);
              inFlightDownloads.delete(trackKey);
              resolve();
            });
          });

          inFlightDownloads.set(trackKey, bgPromise as any);
        }

        // If instant preview is available, stream it immediately with HTTP 206 Range support!
        if (instantPreviewUrl) {
          try {
            const previewHeaders: Record<string, string> = {};
            if (req.headers.range) {
              previewHeaders['Range'] = req.headers.range;
            }

            const previewRes = await fetch(instantPreviewUrl, {
              headers: previewHeaders,
              signal: AbortSignal.timeout(5000),
            });

            res.writeHead(previewRes.status, {
              'Content-Type': previewRes.headers.get('content-type') || 'audio/mp4',
              'Content-Length': previewRes.headers.get('content-length') || '',
              'Content-Range': previewRes.headers.get('content-range') || '',
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
              'Cache-Control': 'public, max-age=86400',
            });

            if (previewRes.body) {
              Readable.fromWeb(previewRes.body as any).pipe(res);
              return;
            }
          } catch (err: any) {
            console.warn('[Breezy Preview Pipe Fallback]', err?.message || err);
          }
        }

        // 3. Fallback: Direct real-time yt-dlp chunked pipe if preview not found
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
