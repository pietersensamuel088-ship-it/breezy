import fs from 'fs';

/**
 * Streams audio to client with HTTP 206 Byte-Range Seeking support
 * (Just like Spotify - streams into memory with zero disk saving on client PC)
 */
export function streamAudioFile(filePath, req, res) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio track not found on server.');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const contentType = filePath.endsWith('.flac')
    ? 'audio/flac'
    : filePath.endsWith('.wav')
    ? 'audio/wav'
    : 'audio/mpeg';

  if (range) {
    // Client wants to seek to a specific position
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Normal stream playback from start
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}
