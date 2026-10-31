import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ListMusic, Music, Sparkles } from 'lucide-react';
import { Song, Playlist } from '../types';
import { getStoredPlaylists, createPlaylist, addSongToPlaylist } from '../utils/playlistManager';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

const ACCENT_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export function AddToPlaylistModal({ isOpen, onClose, song }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(ACCENT_COLORS[5]);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredPlaylists();
      setPlaylists(stored);
      setIsCreating(false);
      setNewName('');

      if (song) {
        const containing = stored
          .filter((p) => p.songs.some((s) => s.id === song.id))
          .map((p) => p.id);
        setAddedIds(new Set(containing));
      }
    }
  }, [isOpen, song]);

  if (!isOpen || !song) return null;

  const handleToggle = (playlistId: string) => {
    if (addedIds.has(playlistId)) return;
    const ok = addSongToPlaylist(playlistId, song);
    if (ok) {
      setAddedIds((prev) => new Set([...prev, playlistId]));
      setPlaylists(getStoredPlaylists());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = createPlaylist(newName.trim(), newDesc.trim(), newColor);
    addSongToPlaylist(created.id, song);
    setAddedIds((prev) => new Set([...prev, created.id]));
    setPlaylists(getStoredPlaylists());
    setIsCreating(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0a0d14]/95 border border-white/10 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-unbounded font-bold text-sm text-white">ADD TO PLAYLIST</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate max-w-[200px]">
                {song.title} &bull; {song.artist}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Toggle / Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 animate-fadeIn">
            <div className="text-xs font-mono font-semibold text-white">New Playlist Details</div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name (e.g. Chill Session)..."
              autoFocus
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-sans text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
            />
            
            {/* Color selection */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-zinc-500">Accent:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-5 h-5 rounded-full transition-transform ${newColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs font-mono transition-transform hover:scale-105 active:scale-95"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-white transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span>Create New Playlist</span>
          </button>
        )}

        {/* Existing Playlists List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="text-center text-xs font-mono text-zinc-500 py-6">
              No playlists found. Create one above!
            </p>
          ) : (
            playlists.map((playlist) => {
              const isAdded = addedIds.has(playlist.id);
              return (
                <div
                  key={playlist.id}
                  onClick={() => handleToggle(playlist.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0"
                      style={{ boxShadow: `0 0 15px ${playlist.accentColor}30` }}
                    >
                      {playlist.coverUrl ? (
                        <img src={playlist.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white truncate max-w-[200px]">
                        {playlist.name}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
