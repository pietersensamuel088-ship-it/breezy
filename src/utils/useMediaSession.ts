import { useEffect } from 'react';
import { Song } from '../types';

interface UseMediaSessionProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
}

export function useMediaSession({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeek,
}: UseMediaSessionProps) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: [
          {
            src: currentSong.coverUrl,
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: currentSong.coverUrl,
            sizes: '256x256',
            type: 'image/jpeg',
          },
        ],
      });
    } catch (e) {
      console.warn('[MediaSession Metadata Error]', e);
    }
  }, [currentSong]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {}
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration || isNaN(duration) || duration <= 0) return;

    try {
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      }
    } catch {}
  }, [currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', onPlay],
      ['pause', onPause],
      ['previoustrack', onPrev],
      ['nexttrack', onNext],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) {
            onSeek(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const skip = details.seekOffset || 10;
          onSeek(Math.max(0, currentTime - skip));
        },
      ],
      [
        'seekforward',
        (details) => {
          const skip = details.seekOffset || 10;
          onSeek(Math.min(duration || 0, currentTime + skip));
        },
      ],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [onPlay, onPause, onNext, onPrev, onSeek, currentTime, duration]);
}
