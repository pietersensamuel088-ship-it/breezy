import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

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

        // 1. Check local nicsongs library
        let filePath = findLocalSong(title, artist);

        // 2. If not yet downloaded, check if already being fetched or start fast native download
        if (!filePath || !fs.existsSync(filePath)) {
          const cleanArtist = artist.replace(/["'$`\\]/g, '');
          const cleanTitle = title.replace(/["'$`\\]/g, '');
          const cleanName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
          const targetMp3 = path.resolve(__dirname, 'nicsongs', `${cleanName}.mp3`);
          const query = `${cleanArtist} ${cleanTitle} official audio`;

          if (inFlightDownloads.has(trackKey)) {
            console.log(`[Breezy Stream] Awaiting in-flight prefetch for: "${artist} - ${title}"...`);
            filePath = await inFlightDownloads.get(trackKey)!;
          } else {
            console.log(`[Breezy Stream] Fast native stream download: "${artist} - ${title}"...`);

            const downloadPromise = new Promise<string | null>((resolve) => {
              // Fast native download (without slow ffmpeg transcoding delay)
              const downloadCmd = `yt-dlp --no-check-certificates --extractor-args "youtube:player_client=android,web" -f "ba/b" "ytsearch1:${query}" -o "${targetMp3}"`;
              exec(downloadCmd, { timeout: 45000 }, (err) => {
                inFlightDownloads.delete(trackKey);
                if (!err && fs.existsSync(targetMp3)) {
                  console.log(`[Breezy Stream] Master audio saved to disk: ${targetMp3}`);
                  resolve(targetMp3);
                } else {
                  // Check if local file exists
                  const local = findLocalSong(title, artist);
                  resolve(local);
                }
              });
            });

            inFlightDownloads.set(trackKey, downloadPromise);
            filePath = await downloadPromise;
          }
        }

        // 3. Fallback check for exact song
        if (!filePath || !fs.existsSync(filePath)) {
          filePath = findLocalSong(title, artist);
        }

        if (!filePath || !fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Track "${title}" by "${artist}" not found.` }));
          return;
        }

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
