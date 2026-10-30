import React from 'react';
import { Song } from '../types';
import { X, Mic2, Sparkles } from 'lucide-react';

interface SyncedLyricsModalProps {
  song: Song | null;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SyncedLyricsModal: React.FC<SyncedLyricsModalProps> = ({
  song,
  currentTime,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-xl h-[80vh] flex flex-col justify-between p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${song.accentColor}25 0%, #07090e 85%)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Mic2 className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-white tracking-wide text-base">{song.title}</h3>
              <p className="text-xs text-zinc-400 font-mono">{song.artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Lyrics Display */}
        <div className="flex-1 overflow-y-auto py-8 space-y-6 text-center select-none scroll-smooth">
          {song.lyrics && song.lyrics.length > 0 ? (
            song.lyrics.map((line, idx) => {
              const isCurrent = currentTime >= line.time && (idx === song.lyrics!.length - 1 || currentTime < song.lyrics![idx + 1].time);
              const isPast = currentTime > line.time;

              return (
                <p
                  key={idx}
                  className={`text-xl md:text-2xl font-display transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'text-white font-bold scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                      : isPast
                      ? 'text-zinc-500 opacity-60'
                      : 'text-zinc-600 opacity-40'
                  }`}
                >
                  {line.text}
                </p>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <Sparkles className="w-8 h-8 text-luxury-gold animate-pulse" />
              <p className="font-mono text-sm">Instrumental or fetching LRCLIB studio lyrics...</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center pt-4 border-t border-white/10">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
            LRCLIB Synced Engine &bull; Zero Delay
          </span>
        </div>
      </div>
    </div>
  );
};
