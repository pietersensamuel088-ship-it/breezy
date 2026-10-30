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

  const baseTitle = title.replace(/\s*[\(\[](feat|ft|with)[\s\S]*?[\)\]]/gi, '').trim();
  const baseArtist = artist.replace(/\s*(&|feat\.|ft\.|and).*$/i, '').trim();

  const cleanArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBaseArtist = baseArtist.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanBaseTitle = baseTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct specific file checks in root of dir
  const candidates = [
    `${artist}_${title}`,
    `${artist}_${baseTitle}`,
    `${baseArtist}_${title}`,
    `${baseArtist}_${baseTitle}`,
  ];

  for (const c of candidates) {
    const sanitizedName = c.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
    for (const ext of ['.mp3', '.flac', '.m4a', '.wav']) {
      const directPath = path.join(dir, `${sanitizedName}${ext}`);
      if (fs.existsSync(directPath)) return directPath;
    }
  }

  // 2. Scan direct root files first (verified downloads)
  const rootEntries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
        const cleanName = lower.replace(/[^a-z0-9]/g, '');
        const artistMatch = cleanName.includes(cleanArtist) || cleanName.includes(cleanBaseArtist);
        const titleMatch = cleanName.includes(cleanTitle) || cleanName.includes(cleanBaseTitle);
        if (artistMatch && titleMatch) {
          return path.join(dir, entry.name);
        }
      }
    }
  }

  // 3. Scan subdirectories (skipping known corrupt rip folders)
  function scanSubdirs(subDir) {
    const entries = fs.readdirSync(subDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(subDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.includes('Indigo (Extended)')) continue;
        const found = scanSubdirs(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
          const cleanName = lower.replace(/[^a-z0-9]/g, '');
          const artistMatch = cleanArtist.length < 3 || cleanName.includes(cleanArtist) || cleanName.includes(cleanBaseArtist);
          const titleMatch = cleanName.includes(cleanTitle) || cleanName.includes(cleanBaseTitle);
          if (artistMatch && titleMatch) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }

  return scanSubdirs(dir);
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
  const query = `"${cleanArtist}" "${cleanTitle}" official audio`;

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
