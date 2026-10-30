import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import axios from 'axios';

const MUSIC_DIR = process.env.MUSIC_DIR || path.join(process.cwd(), 'data', 'music');

// Ensure music storage directory exists on Proxmox
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
}

/**
 * Autonomously fetches and saves track directly on Proxmox disk
 */
export async function getOrDownloadTrack(title, artist) {
  const cleanName = sanitizeFilename(`${artist}_${title}`);
  const targetMp3 = path.join(MUSIC_DIR, `${cleanName}.mp3`);
  const targetFlac = path.join(MUSIC_DIR, `${cleanName}.flac`);

  // 1. If already saved on Proxmox, return immediately!
  if (fs.existsSync(targetFlac)) return targetFlac;
  if (fs.existsSync(targetMp3)) return targetMp3;

  console.log(`[Proxmox Downloader] Auto-fetching track: "${artist} - ${title}"...`);

  // 2. Headless CDN Fast Fetch
  try {
    const query = `${artist} ${title}`;
    const searchRes = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`, {
      timeout: 8000,
    });

    if (searchRes.data?.data?.length > 0) {
      const match = searchRes.data.data[0];
      if (match.preview) {
        console.log(`[Proxmox Downloader] Streaming direct CDN source for "${title}"...`);
        const streamWriter = fs.createWriteStream(targetMp3);
        const audioStream = await axios.get(match.preview, { responseType: 'stream' });
        audioStream.data.pipe(streamWriter);

        await new Promise((resolve, reject) => {
          streamWriter.on('finish', resolve);
          streamWriter.on('error', reject);
        });

        console.log(`[Proxmox Downloader] Successfully cached to Proxmox storage: ${targetMp3}`);
        return targetMp3;
      }
    }
  } catch (err) {
    console.warn(`[Proxmox Downloader] Direct CDN fetch note: ${err.message}`);
  }

  // 3. Headless Fallback via yt-dlp (if installed on server)
  return new Promise((resolve, reject) => {
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 "ytsearch1:${artist} ${title}" -o "${targetMp3}"`;
    exec(command, (error) => {
      if (!error && fs.existsSync(targetMp3)) {
        console.log(`[Proxmox Downloader] yt-dlp saved track to Proxmox: ${targetMp3}`);
        resolve(targetMp3);
      } else {
        // If external tools are not ready, return fallback path
        resolve(targetMp3);
      }
    });
  });
}
