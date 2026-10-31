export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl: string;
  bitrate: string; // e.g., 'FLAC 24-bit / 96kHz' or '320 kbps MP3'
  format: 'FLAC' | 'ALAC' | 'MP3' | 'WAV';
  year: number;
  genre: string;
  lyrics?: { time: number; text: string }[];
  accentColor: string; // Hex color for the dynamic spotlight and ambient glow
  nicheTexture?: string; // Custom stone backdrop
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  accentColor: string;
  tracksCount: number;
  songs: Song[];
  description: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  accentColor: string;
  createdAt: number;
  songs: Song[];
}

export interface ProxmoxConfig {
  host: string;
  port: number;
  libraryPath: string;
  isConnected: boolean;
  cachedBytes: number;
  streamLatencyMs: number;
}
