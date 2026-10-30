import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

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
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/stream')) {
          return next();
        }

        const url = new URL(req.url, 'http://127.0.0.1:5173');
        const title = url.searchParams.get('title') || 'Under the Influence';
        const artist = url.searchParams.get('artist') || 'Chris Brown';

        console.log(`[Breezy Stream] Request for: "${artist} - ${title}"`);

        // Check local nicsongs library
        const filePath = findLocalSong(title);

        if (!filePath || !fs.existsSync(filePath)) {
          console.warn(`[Breezy Stream] Track "${title}" not found in local library.`);
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Track not found in local library' }));
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
