import React, { useState } from 'react';
import {
  ListMusic,
  Play,
  Shuffle,
  Trash2,
  Plus,
  ArrowLeft,
  Music,
  Clock,
  Sparkles,
  Heart,
  Volume2
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { deletePlaylist, removeSongFromPlaylist } from '../utils/playlistManager';

interface PlaylistsViewProps {
  playlists: Playlist[];
  currentSong: Song;
  isPlaying: boolean;
  onPlaySong: (song: Song, contextList?: Song[]) => void;
  onBack: () => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
}

export function PlaylistsView({
  playlists,
  currentSong,
  isPlaying,
  onPlaySong,
  onBack,
  onOpenCreate,
  onRefresh,
}: PlaylistsViewProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const handlePlayAll = (songs: Song[], shuffle = false) => {
    if (!songs || songs.length === 0) return;
    const list = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    onPlaySong(list[0], list);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (window.confirm('Delete this playlist permanently?')) {
      deletePlaylist(playlistId);
      setSelectedPlaylistId(null);
      onRefresh();
    }
  };

  const handleRemoveTrack = (e: React.MouseEvent, playlistId: string, songId: string) => {
    e.stopPropagation();
    removeSongFromPlaylist(playlistId, songId);
    onRefresh();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full h-full max-w-6xl mx-auto px-6 sm:px-8 py-6 flex flex-col overflow-y-auto animate-fadeIn select-none z-10">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <button
          onClick={() => {
            if (selectedPlaylist) {
              setSelectedPlaylistId(null);
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{selectedPlaylist ? 'Back to All Playlists' : 'Return to Exhibition'}</span>
        </button>

        {!selectedPlaylist && (
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* VIEW A: PLAYLIST DETAIL VIEW */}
      {selectedPlaylist ? (
        <div className="pt-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
            <div
              className="w-36 h-36 rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl flex items-center justify-center shrink-0"
              style={{ boxShadow: `0 20px 50px -10px ${selectedPlaylist.accentColor}50` }}
            >
              {selectedPlaylist.coverUrl ? (
                <img src={selectedPlaylist.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-10 h-10 text-zinc-600" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
                USER PLAYLIST
              </span>
              <h1 className="text-3xl sm:text-4xl font-unbounded font-black tracking-tight text-white">
                {selectedPlaylist.name}
              </h1>
              <p className="text-xs text-zinc-400 max-w-lg font-sans">
                {selectedPlaylist.description || 'Custom Breezy music mixtape.'}
              </p>
              <p className="text-[11px] font-mono text-zinc-500 pt-1">
                {selectedPlaylist.songs.length} tracks &bull;{' '}
                {Math.round(selectedPlaylist.songs.reduce((acc, s) => acc + s.duration, 0) / 60)} mins total
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
                <button
                  disabled={selectedPlaylist.songs.length === 0}
                  onClick={() => handlePlayAll(selectedPlaylist.songs, false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-mono font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>PLAY ALL</span>
                </button>

                <button
                  disabled={selectedPlaylist.songs.length === 0}
                  onClick={() => handlePlayAll(selectedPlaylist.songs, true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>SHUFFLE</span>
                </button>

                <button
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                  className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer ml-auto"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tracklist Table */}
          <div className="space-y-1.5 pb-20">
            {selectedPlaylist.songs.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ListMusic className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-mono text-zinc-400">This playlist is currently empty.</p>
                <p className="text-xs font-sans text-zinc-600">
                  Click the "+" button on any album or search track to add songs here!
                </p>
              </div>
            ) : (
              selectedPlaylist.songs.map((song, idx) => {
                const isCurrent = currentSong.id === song.id;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => onPlaySong(song, selectedPlaylist?.songs)}
                    className={`group flex items-center justify-between p-3 sm:px-4 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-white/10 border-white/25 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white">
                        {isCurrent && isPlaying ? (
                          <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse mx-auto" />
                        ) : (
                          idx + 1
                        )}
                      </span>

                      <img
                        src={song.coverUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                      />

                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-mono font-bold truncate ${
                            isCurrent ? 'text-blue-400' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-[11px] font-mono text-zinc-400 truncate">
                          {song.artist} &bull; {song.album}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                        {formatDuration(song.duration)}
                      </span>
                      <button
                        onClick={(e) => handleRemoveTrack(e, selectedPlaylist.id, song.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* VIEW B: ALL PLAYLISTS GRID */
        <div className="pt-6 space-y-6 pb-20">
          <div>
            <h1 className="text-2xl sm:text-3xl font-unbounded font-black tracking-tight text-white">
              YOUR MIXTAPES & PLAYLISTS
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-widest">
              Custom Lossless Collections &bull; {playlists.length} Created
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {/* Create Card Shortcut */}
            <div
              onClick={onOpenCreate}
              className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.02] hover:bg-white/[0.06] border border-dashed border-white/15 hover:border-white/30 transition-all cursor-pointer min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-all mb-3 group-hover:scale-110">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-unbounded font-bold text-xs text-white">CREATE PLAYLIST</span>
              <span className="text-[10px] font-mono text-zinc-500 mt-1">Start fresh mixtape</span>
            </div>

            {/* Existing Playlists */}
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className="group relative flex flex-col p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1"
                style={{
                  boxShadow: `0 15px 35px -10px ${playlist.accentColor}25`,
                }}
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/50 border border-white/10 mb-3.5 flex items-center justify-center">
                  {playlist.coverUrl ? (
                    <img
                      src={playlist.coverUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Music className="w-12 h-12 text-zinc-600" />
                  )}

                  {/* Play Button Overlay on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAll(playlist.songs, false);
                    }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </button>
                </div>

                <h3 className="font-unbounded font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5 truncate">
                  {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'} &bull;{' '}
                  {playlist.description || 'Mixtape'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
