import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function findLocalSong(title: string): string | null {
  const songsDir = path.resolve(__dirname, 'nicsongs');
  if (!fs.existsSync(songsDir)) return null;

  const cleanQuery = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  function scan(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = scan(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a')) {
          const cleanName = lower.replace(/[^a-z0-9]/g, '');
          if (cleanName.includes(cleanQuery)) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }

  return scan(songsDir);
}

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

        console.log(`[Breezy Stream] Request for: "${artist} - ${title}"`);

        // 1. Check local nicsongs library
        let filePath = findLocalSong(title);

        // 2. If not yet downloaded on PC, autonomously download full master track via yt-dlp!
        if (!filePath || !fs.existsSync(filePath)) {
          console.log(`[Breezy Stream] Auto-downloading full studio track: "${artist} - ${title}"...`);
          const cleanName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
          const targetMp3 = path.resolve(__dirname, 'nicsongs', `${cleanName}.mp3`);

          try {
            await new Promise<void>((resolve, reject) => {
              const query = `${artist} ${title} official audio`;
              exec(`yt-dlp -x --audio-format mp3 --audio-quality 0 "ytsearch1:${query}" -o "${targetMp3}"`, { timeout: 35000 }, (error) => {
                if (!error && fs.existsSync(targetMp3)) {
                  resolve();
                } else {
                  reject(error || new Error('Download failed'));
                }
              });
            });

            if (fs.existsSync(targetMp3)) {
              filePath = targetMp3;
              console.log(`[Breezy Stream] Download complete: ${filePath}`);
            }
          } catch (err: any) {
            console.warn(`[Breezy Stream] Autonomous download notice:`, err?.message);
          }
        }

        // 3. Fallback check
        if (!filePath || !fs.existsSync(filePath)) {
          // If still missing, check first available track so the user ALWAYS hears music
          const fallback = findLocalSong('Summer Too Hot') || findLocalSong('Heat');
          if (fallback) filePath = fallback;
        }

        if (!filePath || !fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Track not found.' }));
          return;
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');

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
