import { Playlist, Song } from '../types';
import { ALL_SONGS } from '../mockData';

const PLAYLISTS_STORAGE_KEY = 'breezy_user_playlists';

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-late-night',
    name: 'Late Night Audiophile',
    description: 'Silky smooth studio masters curated for midnight listening.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    accentColor: '#8b5cf6',
    createdAt: Date.now() - 86400000 * 3,
    songs: ALL_SONGS.slice(0, 5),
  },
  {
    id: 'playlist-rnb-vibes',
    name: 'Pure R&B Sessions',
    description: 'Deep basslines, vocal harmonies, and timeless records.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    accentColor: '#ec4899',
    createdAt: Date.now() - 86400000 * 7,
    songs: ALL_SONGS.slice(5, 10),
  },
];

export function getStoredPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return DEFAULT_PLAYLISTS;
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) {
      savePlaylists(DEFAULT_PLAYLISTS);
      return DEFAULT_PLAYLISTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    savePlaylists(DEFAULT_PLAYLISTS);
    return DEFAULT_PLAYLISTS;
  } catch {
    return DEFAULT_PLAYLISTS;
  }
}

export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new CustomEvent('breezy-playlists-updated', { detail: playlists }));
  } catch (err) {
    console.warn('[Playlist Storage Error]', err);
  }
}

export function createPlaylist(name: string, description: string = '', accentColor: string = '#3b82f6'): Playlist {
  const playlists = getStoredPlaylists();
  const newPlaylist: Playlist = {
    id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || 'Untitled Playlist',
    description: description.trim() || 'Custom user playlist',
    accentColor,
    createdAt: Date.now(),
    songs: [],
  };

  const updated = [newPlaylist, ...playlists];
  savePlaylists(updated);
  return newPlaylist;
}

export function deletePlaylist(playlistId: string): void {
  const playlists = getStoredPlaylists();
  const updated = playlists.filter((p) => p.id !== playlistId);
  savePlaylists(updated);
}

export function addSongToPlaylist(playlistId: string, song: Song): boolean {
  const playlists = getStoredPlaylists();
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return false;

  // Prevent duplicate track
  if (target.songs.some((s) => s.id === song.id)) {
    return false;
  }

  target.songs.push(song);
  if (!target.coverUrl && song.coverUrl) {
    target.coverUrl = song.coverUrl;
  }

  savePlaylists([...playlists]);
  return true;
}

export function removeSongFromPlaylist(playlistId: string, songId: string): void {
  const playlists = getStoredPlaylists();
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return;

  target.songs = target.songs.filter((s) => s.id !== songId);
  savePlaylists([...playlists]);
}

export function reorderPlaylist(playlistId: string, startIndex: number, endIndex: number): void {
  const playlists = getStoredPlaylists();
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return;

  const [removed] = target.songs.splice(startIndex, 1);
  target.songs.splice(endIndex, 0, removed);
  savePlaylists([...playlists]);
}
