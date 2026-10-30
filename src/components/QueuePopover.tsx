import React from 'react';
import { Song } from '../types';
import {
  X,
  Play,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  Music2,
  ListMusic,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface QueuePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song;
  queue: Song[];
  onPlaySong: (song: Song) => void;
  onRemoveFromQueue: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearQueue: () => void;
}

export const QueuePopover: React.FC<QueuePopoverProps> = ({
  isOpen,
  onClose,
  currentSong,
  queue,
  onPlaySong,
  onRemoveFromQueue,
  onMoveUp,
  onMoveDown,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-zinc-950/90 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-5 text-white animate-slide-up flex flex-col max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-white">
            Play Queue
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {queue.length} upcoming
          </span>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-[11px] font-mono text-zinc-400 hover:text-red-400 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/5"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Now Playing Banner */}
      <div className="pt-3 pb-4 border-b border-white/10 shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block mb-2">
          Now Playing
        </span>
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
          <img
            src={currentSong.coverUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono truncate">
              {currentSong.artist}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Lossless Stream Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 min-h-[160px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
            Next Up
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            Hold any track 3s to queue
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-2 text-zinc-500">
            <Music2 className="w-8 h-8 stroke-1 text-zinc-600 mb-1" />
            <p className="text-xs font-mono">Your queue is empty</p>
            <p className="text-[10px] font-sans text-zinc-600 max-w-xs">
              Click &amp; hold any song for 3 seconds anywhere in Breezy to queue &amp; auto-download it!
            </p>
          </div>
        ) : (
          queue.map((song, idx) => (
            <div
              key={`${song.id}-${idx}`}
              className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all duration-200"
            >
              {/* Left Track Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <span className="text-[11px] font-mono text-zinc-500 w-4 text-center shrink-0">
                  {idx + 1}
                </span>

                <img
                  src={song.coverUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {song.title}
                  </h5>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {song.artist}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400/90 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Auto-buffered on Server</span>
                  </div>
                </div>
              </div>

              {/* Right Action Controls: Reorder & Remove */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Scale Up / Move Higher */}
                <button
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                {/* Scale Down / Move Lower */}
                <button
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === queue.length - 1}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Play Immediately */}
                <button
                  onClick={() => onPlaySong(song)}
                  className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-sm"
                  title="Play Now"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => onRemoveFromQueue(idx)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                  title="Remove from Queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/10 text-center shrink-0">
        <p className="text-[10px] font-mono text-zinc-500">
          ⚡ Proxmox Zero-Latency Pipeline active
        </p>
      </div>
    </div>
  );
};
