import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { touchLru, cleanLruCache } from './lruCache.js';

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

const inFlightDownloads = new Map();

/**
 * Autonomously fetches and saves FULL master tracks directly on Proxmox disk (NO 30-second previews)
 */
export async function getOrDownloadTrack(title, artist) {
  const cleanName = sanitizeFilename(`${artist}_${title}`);
  const targetMp3 = path.join(MUSIC_DIR, `${cleanName}.mp3`);
  const targetFlac = path.join(MUSIC_DIR, `${cleanName}.flac`);
  const trackKey = `${artist}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. If already saved on Proxmox disk, return immediately!
  if (fs.existsSync(targetFlac)) {
    touchLru(targetFlac);
    return { type: 'file', path: targetFlac };
  }
  if (fs.existsSync(targetMp3)) {
    touchLru(targetMp3);
    return { type: 'file', path: targetMp3 };
  }

  // 2. Search local storage / nicsongs subdirectories (requiring BOTH artist and title)
  const localMatch = findExistingTrack(MUSIC_DIR, title, artist);
  if (localMatch) {
    touchLru(localMatch);
    console.log(`[Proxmox Storage] Found local master track: ${localMatch}`);
    return { type: 'file', path: localMatch };
  }

  // 3. Await if already being downloaded by another request
  if (inFlightDownloads.has(trackKey)) {
    console.log(`[Proxmox Downloader] Awaiting in-flight download for: "${artist} - ${title}"...`);
    const path = await inFlightDownloads.get(trackKey);
    if (path && fs.existsSync(path)) return { type: 'file', path };
  }

  console.log(`[Proxmox Downloader] Fast native stream download: "${artist} - ${title}"...`);
  const cleanArtist = artist.replace(/["'$`\\]/g, '');
  const cleanTitle = title.replace(/["'$`\\]/g, '');
  const query = `${cleanArtist} ${cleanTitle} official audio`;

  const downloadPromise = new Promise((resolve) => {
    // Fast native audio download without slow ffmpeg transcoding delay (128-160k AAC for instant buffering)
    const downloadCmd = `yt-dlp --no-check-certificates --extractor-args "youtube:player_client=android,web" -f "ba[ext=m4a][abr<=160]/ba[abr<=160]/ba/b" "ytsearch1:${query}" -o "${targetMp3}"`;
    exec(downloadCmd, { timeout: 45000 }, (error) => {
      inFlightDownloads.delete(trackKey);
      if (!error && fs.existsSync(targetMp3)) {
        touchLru(targetMp3);
        cleanLruCache(MUSIC_DIR);
        console.log(`[Proxmox Storage] Master audio cached: ${targetMp3}`);
        resolve(targetMp3);
      } else {
        const local = findExistingTrack(MUSIC_DIR, title, artist);
        if (local) touchLru(local);
        resolve(local);
      }
    });
  });

  inFlightDownloads.set(trackKey, downloadPromise);
  const downloadedPath = await downloadPromise;

  if (downloadedPath && fs.existsSync(downloadedPath)) {
    return { type: 'file', path: downloadedPath };
  }

  return { type: 'not_found' };
}
