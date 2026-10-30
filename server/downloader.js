import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const MUSIC_DIR = process.env.MUSIC_DIR || (fs.existsSync(path.join(process.cwd(), '..', 'nicsongs')) ? path.join(process.cwd(), '..', 'nicsongs') : path.join(process.cwd(), 'data', 'music'));

// Ensure music storage directory exists on Proxmox
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
}

/**
 * Searches local directory for an existing full song by BOTH title and artist
 */
function findExistingTrack(dir, title, artist) {
  if (!fs.existsSync(dir)) return null;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const nameLower = entry.name.toLowerCase();
        if (nameLower.endsWith('.mp3') || nameLower.endsWith('.flac') || nameLower.endsWith('.m4a') || nameLower.endsWith('.wav')) {
          const cleanName = nameLower.replace(/[^a-z0-9]/g, '');
          const artistMatch = cleanArtist.length < 3 || cleanName.includes(cleanArtist);
          const titleMatch = cleanName.includes(cleanTitle);
          if (artistMatch && titleMatch) {
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
  if (fs.existsSync(targetFlac)) return { type: 'file', path: targetFlac };
  if (fs.existsSync(targetMp3)) return { type: 'file', path: targetMp3 };

  // 2. Search local storage / nicsongs subdirectories (requiring BOTH artist and title)
  const localMatch = findExistingTrack(MUSIC_DIR, title, artist);
  if (localMatch) {
    console.log(`[Proxmox Storage] Found local master track: ${localMatch}`);
    return { type: 'file', path: localMatch };
  }

  console.log(`[Proxmox Downloader] Instant CDN Lookahead for: "${artist} - ${title}"...`);
  const cleanArtist = artist.replace(/["'$`\\]/g, '');
  const cleanTitle = title.replace(/["'$`\\]/g, '');
  const query = `${cleanArtist} ${cleanTitle} official audio`;

  // Start background download of permanent high-bitrate master MP3
  const downloadCmd = `yt-dlp --no-check-certificates --extractor-args "youtube:player_client=android,web" -x --audio-format mp3 --audio-quality 0 "ytsearch1:${query}" -o "${targetMp3}"`;
  exec(downloadCmd, { timeout: 60000 }, (error) => {
    if (!error && fs.existsSync(targetMp3)) {
      console.log(`[Proxmox Storage] Master MP3 cached: ${targetMp3}`);
    }
  });

  // Fetch direct streaming URL for instant sub-second playback
  return new Promise((resolve) => {
    const directCmd = `yt-dlp --no-check-certificates --extractor-args "youtube:player_client=android,web" -f "ba/b" -g "ytsearch1:${query}"`;
    exec(directCmd, { timeout: 12000 }, (err, stdout) => {
      if (!err && stdout) {
        const url = stdout.trim().split('\n').filter((l) => l.startsWith('http'))[0];
        if (url) {
          return resolve({ type: 'redirect', url });
        }
      }
      if (fs.existsSync(targetMp3)) {
        return resolve({ type: 'file', path: targetMp3 });
      }
      resolve({ type: 'not_found' });
    });
  });
}
