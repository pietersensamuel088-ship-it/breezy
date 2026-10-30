import React, { useEffect } from 'react';
import { Song, Album } from '../types';
import { AudioVisualizer } from './AudioEngine';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown
} from 'lucide-react';

interface SongDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  album: Album;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export function SongDetailModal({
  isOpen,
  onClose,
  song,
  album,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
}: SongDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden animate-fadeIn">
      {/* Dynamic Stretched Album Artwork Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={song.coverUrl || album.coverUrl}
          alt=""
          className="w-full h-full object-cover scale-110 blur-2xl opacity-40 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-[#050608]/75 backdrop-blur-3xl" />
        <div
          className="absolute inset-0 opacity-30 blur-[160px] pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: song.accentColor }}
        />
      </div>

      {/* ONE BIG MINIMALIST CARD COVERING ALMOST ALL THE SCREEN */}
      <div
        className="relative z-10 w-full max-w-4xl h-[90vh] max-h-[820px] rounded-3xl bg-[#0a0d14]/70 border border-white/10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col justify-between p-6 sm:p-8 md:p-10 overflow-hidden animate-album-glide"
        style={{
          boxShadow: `0 35px 100px -15px rgba(0,0,0,0.98), 0 0 50px ${song.accentColor}25`,
        }}
      >
        {/* Top Minimalist Bar: Down Arrow / Close */}
        <div className="w-full flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: song.accentColor || '#ffffff' }}
            />
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-400">
              NOW PLAYING // {song.genre}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Minimize player"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Giant High-Res Front Cover Card */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto min-h-0 py-4">
          <div
            className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-84 md:h-84 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/15 transition-transform duration-700 hover:scale-[1.02]"
            style={{
              boxShadow: `0 30px 80px -10px rgba(0,0,0,0.95), 0 0 45px ${song.accentColor}35`,
            }}
          >
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundColor: song.accentColor }}
              />
            )}
          </div>

          {/* Song Info */}
          <div className="text-center mt-6 max-w-lg px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-unbounded font-black tracking-tight text-white drop-shadow-md truncate">
              {song.title}
            </h1>
            <p className="text-sm sm:text-base font-sans text-zinc-400 mt-1 font-semibold truncate">
              {song.artist} &bull; <span className="text-zinc-500 font-normal">{album.title}</span>
            </p>
          </div>

          {/* Synthesizer Waveform Display */}
          <div className="w-full max-w-md mt-4 px-4">
            <AudioVisualizer
              isPlaying={isPlaying}
              accentColor={song.accentColor || '#ffffff'}
              width={420}
              height={44}
              numBars={54}
            />
          </div>
        </div>

        {/* Bottom Audio Slider & Master Controls */}
        <div className="w-full max-w-xl mx-auto space-y-4 shrink-0 pt-2">
          {/* Audio Scrubber Timeline */}
          <div className="w-full flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/15 hover:bg-white/25 rounded-lg appearance-none cursor-pointer accent-white transition-colors"
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          {/* Controls: Skip Back, Play/Pause, Skip Forward, Volume */}
          <div className="w-full flex items-center justify-between px-2">
            <div className="w-16" />

            {/* Central Playback Controls */}
            <div className="flex items-center gap-6 sm:gap-8">
              <button
                onClick={onPrev}
                className="text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer p-2"
                title="Previous track"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-15 h-15 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black ml-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer p-2"
                title="Next track"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-28 justify-end">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
                className="text-zinc-400 hover:text-white transition-colors p-1.5"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SongDetailModal;
