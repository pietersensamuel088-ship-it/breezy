import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const MUSIC_DIR = process.env.MUSIC_DIR || path.join(process.cwd(), 'data', 'music');

// Ensure music storage directory exists on Proxmox
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
}

/**
 * Searches local directory for an existing full song by title
 */
function findExistingTrack(dir, title) {
  if (!fs.existsSync(dir)) return null;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const nameLower = entry.name.toLowerCase();
        if (nameLower.endsWith('.mp3') || nameLower.endsWith('.flac') || nameLower.endsWith('.m4a')) {
          const cleanName = nameLower.replace(/[^a-z0-9]/g, '');
          if (cleanName.includes(cleanTitle)) {
            const parent = entry.parentPath || dir;
            return path.join(parent, entry.name);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Finder Note]', err.message);
  }
  return null;
}

/**
 * Autonomously fetches and saves FULL master tracks directly on Proxmox disk (NO 30-second previews)
 */
export async function getOrDownloadTrack(title, artist) {
  const cleanName = sanitizeFilename(`${artist}_${title}`);
  const targetMp3 = path.join(MUSIC_DIR, `${cleanName}.mp3`);
  const targetFlac = path.join(MUSIC_DIR, `${cleanName}.flac`);

  // 1. If already saved on Proxmox disk, return immediately!
  if (fs.existsSync(targetFlac)) return targetFlac;
  if (fs.existsSync(targetMp3)) return targetMp3;

  // 2. Search local storage / nicsongs subdirectories
  const localMatch = findExistingTrack(MUSIC_DIR, title);
  if (localMatch) {
    console.log(`[Proxmox Storage] Found local master track: ${localMatch}`);
    return localMatch;
  }

  console.log(`[Proxmox Downloader] Auto-fetching FULL studio master track: "${artist} - ${title}"...`);

  // 3. Headless Download via yt-dlp (Downloads 100% FULL UNABRIDGED SONG in high-bitrate)
  return new Promise((resolve) => {
    // Download full studio song directly from high-quality audio source
    const query = `${artist} ${title} official audio`;
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 "ytsearch1:${query}" -o "${targetMp3}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      if (!error && fs.existsSync(targetMp3)) {
        console.log(`[Proxmox Downloader] Successfully saved FULL track to Proxmox: ${targetMp3}`);
        resolve(targetMp3);
      } else {
        console.error(`[Proxmox Downloader] yt-dlp notice:`, stderr || error?.message);
        resolve(targetMp3);
      }
    });
  });
}
