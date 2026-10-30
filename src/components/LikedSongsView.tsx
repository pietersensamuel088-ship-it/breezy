import React, { useState, useMemo } from 'react';
import { Song } from '../types';
import {
  Heart,
  Play,
  Pause,
  Shuffle,
  Clock3,
  Search,
  ArrowLeft,
  Music2,
  ListPlus,
  Sparkles,
  Calendar,
  Disc3,
  Trash2
} from 'lucide-react';

export interface LikedSongItem extends Song {
  likedAt?: string;
}

interface LikedSongsViewProps {
  likedSongs: LikedSongItem[];
  currentSong: Song;
  isPlaying: boolean;
  currentUser: string;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onToggleLike: (song: Song) => void;
  onBack: () => void;
  bindHold?: (song: Song) => any;
  holdingSongId?: string | null;
  holdProgress?: number;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({
  likedSongs,
  currentSong,
  isPlaying,
  currentUser,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  onBack,
  bindHold,
  holdingSongId,
  holdProgress = 0,
}) => {
  const [filterText, setFilterText] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter songs by title, artist, or album
  const filteredList = useMemo(() => {
    if (!filterText.trim()) return likedSongs;
    const query = filterText.toLowerCase();
    return likedSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        s.album.toLowerCase().includes(query)
    );
  }, [likedSongs, filterText]);

  // Total duration formatted (e.g. "42 min 18 sec")
  const totalDurationFormatted = useMemo(() => {
    const totalSecs = likedSongs.reduce((acc, s) => acc + s.duration, 0);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  }, [likedSongs]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDateAdded = (isoStr?: string) => {
    if (!isoStr) return 'Recently added';
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently added';
    }
  };

  const isCurrentPlaylistPlaying = useMemo(() => {
    return isPlaying && likedSongs.some((s) => s.id === currentSong.id);
  }, [isPlaying, likedSongs, currentSong.id]);

  const handleMasterPlay = () => {
    if (likedSongs.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      onTogglePlay();
    } else {
      onPlaySong(filteredList[0] || likedSongs[0]);
    }
  };

  const handleShufflePlay = () => {
    if (likedSongs.length === 0) return;
    const randomIdx = Math.floor(Math.random() * likedSongs.length);
    onPlaySong(likedSongs[randomIdx]);
  };

  return (
    <div className="relative w-full h-full max-w-6xl mx-auto px-6 md:px-10 py-4 flex flex-col overflow-y-auto animate-zoom-in z-20 pb-32">
      {/* Return to Exhibition / Carousel Button */}
      <div className="shrink-0 mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors py-1 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Exhibition</span>
        </button>
      </div>

      {/* SPOTIFY HERO HEADER */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-8 pt-2 border-b border-white/10 shrink-0">
        {/* Iconic Spotify Purple-Indigo Gradient Heart Tile */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#450af5] via-[#652cd3] to-[#8c52ff] flex items-center justify-center shadow-[0_25px_60px_rgba(69,10,245,0.45)] border border-white/20 shrink-0 group">
          <Heart className="w-20 h-20 md:w-24 md:h-24 text-white fill-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-radial from-white/20 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Playlist Metadata Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/80 font-bold mb-1">
            Playlist &bull; Private
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-unbounded font-black tracking-tight text-white drop-shadow-xl my-1">
            Liked Songs
          </h1>
          <p className="text-xs sm:text-sm font-sans text-zinc-300 mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="font-semibold text-white">{currentUser || 'Guest'}</span>
            <span className="text-zinc-500">&bull;</span>
            <span className="text-zinc-300 font-mono font-medium">
              {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
            </span>
            {likedSongs.length > 0 && (
              <>
                <span className="text-zinc-500">&bull;</span>
                <span className="text-zinc-400 font-mono">{totalDurationFormatted}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ACTION BAR: Play Button, Shuffle & In-Playlist Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6 shrink-0">
        <div className="flex items-center gap-4">
          {/* Big Spotify Neon Green / Electric Cyan Play Button */}
          <button
            onClick={handleMasterPlay}
            disabled={likedSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] disabled:opacity-40 text-black flex items-center justify-center shadow-[0_10px_30px_rgba(30,215,96,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isCurrentPlaylistPlaying ? 'Pause' : 'Play Liked Songs'}
          >
            {isCurrentPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-1" />
            )}
          </button>

          {/* Shuffle Button */}
          <button
            onClick={handleShufflePlay}
            disabled={likedSongs.length === 0}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Shuffle Play"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Search / Filter Input inside Liked Songs */}
        <div className="flex items-center w-64 md:w-80 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search in liked songs..."
            className="w-full pl-9 pr-4 py-2 text-xs font-sans text-white bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/30 rounded-full placeholder-zinc-500 focus:outline-hidden transition-all"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-3 text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SPOTIFY-STYLE TRACK LIST TABLE */}
      <div className="w-full flex-1 min-h-[300px]">
        {/* Table Column Header */}
        <div className="grid grid-cols-[36px_1fr_120px] sm:grid-cols-[40px_1fr_180px_100px] md:grid-cols-[48px_4fr_3fr_2fr_90px] px-4 py-2.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="hidden md:block">Album</span>
          <span className="hidden sm:block">Date Added</span>
          <span className="text-right flex items-center justify-end pr-2">
            <Clock3 className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Empty State */}
        {likedSongs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 text-zinc-500">
            <Heart className="w-12 h-12 stroke-1 text-zinc-600 mb-1" />
            <h3 className="text-base font-bold text-zinc-400 font-sans">
              Songs you like will appear here
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Save songs by clicking the heart icon on any track or player bar for instant 1-click access!
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-zinc-500">
            No matching liked songs found for "{filterText}".
          </div>
        ) : (
          filteredList.map((song, idx) => {
            const isCurrent = currentSong.id === song.id;
            const isHovered = hoveredIdx === idx;
            const isHolding = holdingSongId === song.id;
            const holdHandlers = bindHold ? bindHold(song) : null;

            return (
              <div
                key={song.id}
                {...(holdHandlers || { onClick: () => onPlaySong(song) })}
                onMouseEnter={(e) => {
                  setHoveredIdx(idx);
                  holdHandlers?.onMouseEnter?.(e);
                }}
                onMouseLeave={(e) => {
                  setHoveredIdx(null);
                  holdHandlers?.onPointerLeave?.(e);
                }}
                className={`group relative grid grid-cols-[36px_1fr_120px] sm:grid-cols-[40px_1fr_180px_100px] md:grid-cols-[48px_4fr_3fr_2fr_90px] items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                  isCurrent
                    ? 'bg-white/10 border border-white/15 shadow-md'
                    : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                }`}
              >
                {/* Hold-to-Queue Progress Glow Overlay */}
                {isHolding && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-20">
                    <div
                      className="h-full bg-cyan-400/20 border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all ease-linear"
                      style={{ width: `${Math.round(holdProgress * 100)}%` }}
                    />
                    <div className="absolute top-2 right-4 text-[10px] font-mono text-cyan-300 font-bold tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>HOLD TO QUEUE ({Math.max(1, 3 - Math.floor(holdProgress * 3))}s)</span>
                    </div>
                  </div>
                )}

                {/* Col 1: Index / Play Icon / Equalizer */}
                <div className="flex items-center justify-center text-xs font-mono text-zinc-500">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end justify-center gap-0.5 h-3.5">
                      <span className="w-0.5 h-full bg-[#1ed760] animate-pulse" />
                      <span className="w-0.5 h-2 bg-[#1ed760] animate-pulse delay-75" />
                      <span className="w-0.5 h-3 bg-[#1ed760] animate-pulse delay-150" />
                    </div>
                  ) : isHovered ? (
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Col 2: Title & Artist (with Artwork thumbnail) */}
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <img
                    src={song.coverUrl}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate tracking-wide ${
                        isCurrent ? 'text-[#1ed760] font-bold' : 'text-white group-hover:text-white'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Col 3: Album Name */}
                <div className="hidden md:block min-w-0 pr-3">
                  <span className="text-xs text-zinc-400 font-sans truncate block hover:text-white transition-colors">
                    {song.album}
                  </span>
                </div>

                {/* Col 4: Date Added */}
                <div className="hidden sm:block min-w-0 pr-3">
                  <span className="text-xs text-zinc-400 font-mono truncate block">
                    {formatDateAdded(song.likedAt)}
                  </span>
                </div>

                {/* Col 5: Heart Icon & Duration */}
                <div className="flex items-center justify-end gap-3 text-xs font-mono text-zinc-400 pr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(song);
                    }}
                    className="p-1 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                    title="Remove from Liked Songs"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500 hover:opacity-80" />
                  </button>
                  <span>{formatDuration(song.duration)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
