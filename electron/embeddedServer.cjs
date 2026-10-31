const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.js': return 'application/javascript';
    case '.css': return 'text/css';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.mp3': return 'audio/mpeg';
    case '.flac': return 'audio/flac';
    case '.m4a': return 'audio/mp4';
    case '.wav': return 'audio/wav';
    case '.webm': return 'audio/webm';
    default: return 'application/octet-stream';
  }
}

function findLocalSong(songsDir, title, artist, songId) {
  if (!fs.existsSync(songsDir)) return null;

  if (songId) {
    const cleanId = songId.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    for (const ext of ['.mp3', '.flac', '.m4a', '.wav']) {
      const idPath = path.join(songsDir, `${cleanId}${ext}`);
      if (fs.existsSync(idPath)) return idPath;
    }
  }

  const cleanArtist = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseTitle = (title || '').replace(/\s*[\(\[](?:feat\.?|ft\.?|with)[\s\S]*?[\)\]]/gi, '').trim();
  const cleanBaseTitle = baseTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseArtist = (artist || '').replace(/\s+(?:feat\.?|ft\.?|with|&|\band\b)\s+.*$/i, '').trim();
  const cleanBaseArtist = baseArtist.toLowerCase().replace(/[^a-z0-9]/g, '');

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

  return null;
}

function serveAudioRange(filePath, req, res) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = getMimeType(filePath);

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
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
}

const inFlightDownloads = new Map();

function startEmbeddedStreamer(port = 5173, distDir, songsDir) {
  if (!fs.existsSync(songsDir)) {
    try { fs.mkdirSync(songsDir, { recursive: true }); } catch {}
  }

  const server = http.createServer(async (req, res) => {
    // 1. Health check
    if (req.url.startsWith('/api/health')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({
        status: 'online',
        service: 'Breezy Embedded Master Streamer',
        version: '1.0.0',
        mode: 'standalone-lossless',
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // 2. Stream audio
    if (req.url.startsWith('/api/stream')) {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        });
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url, `http://127.0.0.1:${port}`);
      const songId = parsedUrl.searchParams.get('id') || '';
      const title = parsedUrl.searchParams.get('title') || 'Under the Influence';
      const artist = parsedUrl.searchParams.get('artist') || 'Chris Brown';
      const trackKey = `${songId ? songId + '_' : ''}${artist}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check local cache
      const local = findLocalSong(songsDir, title, artist, songId);
      if (local && fs.existsSync(local)) {
        serveAudioRange(local, req, res);
        return;
      }

      // Download on-demand
      const cleanArtist = artist.replace(/[/\\"'`$]/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanTitle = title.replace(/[/\\"'`$]/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanName = `${artist}_${title}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
      const targetMp3 = path.resolve(songsDir, `${cleanName}.mp3`);
      const query = `"${cleanArtist}" "${cleanTitle}" Topic`;

      if (inFlightDownloads.has(trackKey)) {
        await inFlightDownloads.get(trackKey);
        if (fs.existsSync(targetMp3)) {
          serveAudioRange(targetMp3, req, res);
          return;
        }
      }

      const dlPromise = new Promise((resolve) => {
        const dlProc = spawn('yt-dlp', [
          '--no-check-certificates',
          '--extractor-args', 'youtube:player_client=android,web',
          '-f', 'ba[ext=m4a][abr<=160]/ba[abr<=160]/ba/b',
          '-o', targetMp3,
          `ytsearch1:${query}`,
        ]);

        const timeout = setTimeout(() => {
          try { dlProc.kill(); } catch {}
          resolve(null);
        }, 45000);

        dlProc.on('close', (code) => {
          clearTimeout(timeout);
          inFlightDownloads.delete(trackKey);
          if (code === 0 && fs.existsSync(targetMp3)) {
            resolve(targetMp3);
          } else {
            resolve(findLocalSong(songsDir, title, artist));
          }
        });

        dlProc.on('error', () => {
          clearTimeout(timeout);
          inFlightDownloads.delete(trackKey);
          resolve(null);
        });
      });

      inFlightDownloads.set(trackKey, dlPromise);
      const saved = await dlPromise;

      if (saved && fs.existsSync(saved)) {
        serveAudioRange(saved, req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('Audio track not found.');
      }
      return;
    }

    // 3. Static asset delivery for packaged desktop mode
    if (distDir && fs.existsSync(distDir)) {
      const parsedPath = req.url.split('?')[0];
      let targetFile = path.join(distDir, parsedPath === '/' ? 'index.html' : parsedPath);
      if (!fs.existsSync(targetFile)) {
        targetFile = path.join(distDir, 'index.html');
      }

      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        res.writeHead(200, {
          'Content-Type': getMimeType(targetFile),
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(targetFile).pipe(res);
        return;
      }
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Embedded Server] Port ${port} is already in use (dev server active).`);
    } else {
      console.error('[Embedded Server Error]', err.message);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[Embedded Server] Breezy standalone streamer active on http://127.0.0.1:${port}`);
  });

  return server;
}

module.exports = { startEmbeddedStreamer };
