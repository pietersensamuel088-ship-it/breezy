import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  GripHorizontal,
  X,
  Heart
} from 'lucide-react';
import { Song } from '../types';

interface MiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export function MiniPlayer({
  isOpen,
  onClose,
  song,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isLiked,
  onToggleLike,
}: MiniPlayerProps) {
  // Draggable state
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(20, window.innerWidth - 380),
        y: Math.max(20, window.innerHeight - 170),
      };
    }
    return { x: 50, y: 50 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: pos.x,
      startY: pos.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.mouseX;
    const dy = e.clientY - dragRef.current.mouseY;

    const newX = Math.max(10, Math.min(window.innerWidth - 360, dragRef.current.startX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 150, dragRef.current.startY + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        boxShadow: `0 25px 60px -10px rgba(0,0,0,0.95), 0 0 30px ${song.accentColor}30`,
      }}
      className="fixed top-0 left-0 z-50 w-[350px] rounded-3xl bg-[#07090e]/95 border border-white/15 backdrop-blur-2xl p-4 select-none animate-fadeIn transition-shadow duration-300"
    >
      {/* Top Handle / Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        className="flex items-center justify-between pb-2 cursor-grab active:cursor-grabbing border-b border-white/[0.06] mb-3"
      >
        <div className="flex items-center gap-1.5 text-zinc-500">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400 font-bold">
            BREEZY MINI
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Expand to Full App"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track & Controls Area */}
      <div className="flex items-center gap-3.5">
        {/* Album Artwork */}
        <div
          className={`relative w-14 h-14 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shrink-0 shadow-lg ${
            isPlaying ? 'ring-2 ring-white/20' : ''
          }`}
        >
          <img
            src={song.coverUrl}
            alt=""
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        {/* Title, Artist, & Controls */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-mono font-bold text-white truncate max-w-[190px]">
              {song.title}
            </h4>
            {onToggleLike && (
              <button
                onClick={onToggleLike}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'
                  }`}
                />
              </button>
            )}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 truncate max-w-[190px]">
            {song.artist}
          </p>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={onPrev}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-black" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleMute}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-auto"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar & Seek Slider */}
      <div className="pt-2.5 space-y-1">
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = (e.clientX - rect.left) / rect.width;
            onSeek(Math.max(0, Math.min(duration, clickRatio * duration)));
          }}
          className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer group"
        >
          <div
            className="h-full bg-white transition-all duration-100 rounded-full"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: song.accentColor || '#3b82f6',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
