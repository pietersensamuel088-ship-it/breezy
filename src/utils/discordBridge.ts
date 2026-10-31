import { Song } from '../types';

let lastSentTrackId = '';
let lastSentPlayState = false;
let lastSentTime = 0;
let throttleTimer: NodeJS.Timeout | null = null;

export function isDiscordRpcEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('breezy_discord_rpc_enabled');
  return val === null ? true : val === 'true'; // Enabled by default
}

export function setDiscordRpcEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('breezy_discord_rpc_enabled', String(enabled));
  if (!enabled) {
    clearDiscordPresence();
  }
}

/**
 * Updates Discord Rich Presence for the current track
 * Dispatches to /api/discord/presence on local backend
 */
export function updateDiscordPresence(
  song: Song | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number
) {
  if (!isDiscordRpcEnabled()) return;
  if (!song) {
    clearDiscordPresence();
    return;
  }

  const now = Date.now();
  const trackChanged = lastSentTrackId !== song.id;
  const playStateChanged = lastSentPlayState !== isPlaying;

  // Immediate send on track change or play/pause; otherwise throttle to once every 4 seconds
  if (trackChanged || playStateChanged || now - lastSentTime >= 4000) {
    if (throttleTimer) clearTimeout(throttleTimer);
    sendPresencePayload(song, isPlaying, currentTime, duration);
    lastSentTrackId = song.id;
    lastSentPlayState = isPlaying;
    lastSentTime = now;
  } else {
    if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        sendPresencePayload(song, isPlaying, currentTime, duration);
        lastSentTime = Date.now();
        throttleTimer = null;
      }, 4000);
    }
  }
}

export function getDiscordClientId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('breezy_discord_client_id') || '';
}

export function setDiscordClientId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('breezy_discord_client_id', id.trim());
}

async function sendPresencePayload(
  song: Song,
  isPlaying: boolean,
  currentTime: number,
  duration: number
) {
  try {
    const customClientId = getDiscordClientId();
    const payload = {
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: duration || song.duration || 0,
      position: Math.round(currentTime || 0),
      isPlaying,
      coverUrl: song.coverUrl,
      ...(customClientId ? { clientId: customClientId } : {}),
    };

    // Use current origin if http, or localhost:5173 / custom backend
    const host = typeof window !== 'undefined' && window.location.origin.includes('http')
      ? window.location.origin
      : 'http://127.0.0.1:5173';

    await fetch(`${host}/api/discord/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
}

export async function clearDiscordPresence() {
  try {
    const host = typeof window !== 'undefined' && window.location.origin.includes('http')
      ? window.location.origin
      : 'http://127.0.0.1:5173';

    await fetch(`${host}/api/discord/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPlaying: false }),
    }).catch(() => {});
  } catch {}
}

export async function checkDiscordRpcStatus(): Promise<boolean> {
  try {
    const host = typeof window !== 'undefined' && window.location.origin.includes('http')
      ? window.location.origin
      : 'http://127.0.0.1:5173';

    const res = await fetch(`${host}/api/discord/status`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.connected);
    }
  } catch {}
  return false;
}
