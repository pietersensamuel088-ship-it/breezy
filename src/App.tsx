import React, { useState, useEffect, useRef } from 'react';
import { FEATURED_ALBUMS, ALL_SONGS } from './mockData';
import { Album, Song, ProxmoxConfig } from './types';
import { StoneNicheGallery } from './components/StoneNicheGallery';
import { AudioVisualizer } from './components/AudioEngine';
import { MusicDownloaderModal } from './components/MusicDownloaderModal';
import { SyncedLyricsModal } from './components/SyncedLyricsModal';
import { ProxmoxBridgeModal } from './components/ProxmoxBridgeModal';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic2,
  Download,
  Server,
  Search,
  Radio,
  Flame,
  Disc3,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';

export function App() {
  const [albums] = useState<Album[]>(FEATURED_ALBUMS);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(FEATURED_ALBUMS[0]);
  const [currentSong, setCurrentSong] = useState<Song>(FEATURED_ALBUMS[0].songs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FEATURED_ALBUMS[0].songs[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isDownloaderOpen, setIsDownloaderOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isProxmoxOpen, setIsProxmoxOpen] = useState<boolean>(false);

  // Proxmox Configuration State
  const [proxmoxConfig, setProxmoxConfig] = useState<ProxmoxConfig>({
    host: '192.168.1.180',
    port: 8080,
    libraryPath: '/mnt/storage/breezy-music',
    isConnected: true,
    cachedBytes: 4184920,
    streamLatencyMs: 3.8,
  });

  // Audio Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Audio playback
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        // Fallback for autoplay policies
      });
      setIsPlaying(true);
    }
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleNext = () => {
    const currentIndex = selectedAlbum.songs.findIndex(s => s.id === currentSong.id);
    const nextSong = selectedAlbum.songs[(currentIndex + 1) % selectedAlbum.songs.length];
    playSong(nextSong);
  };

  const handlePrev = () => {
    const currentIndex = selectedAlbum.songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + selectedAlbum.songs.length) % selectedAlbum.songs.length;
    playSong(selectedAlbum.songs[prevIndex]);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter songs based on search
  const filteredSongs = ALL_SONGS.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="relative w-screen h-screen flex flex-col bg-[#050608] text-white overflow-hidden transition-colors duration-700"
      style={{
        '--glow-color': currentSong.accentColor,
      } as React.CSSProperties}
    >
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      {/* Dynamic Background Atmospheric Lighting */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: currentSong.accentColor }}
      />
      <div
        className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: selectedAlbum.accentColor }}
      />

      {/* TOP BAR / NAVIGATION */}
      <header className="relative z-30 h-18 px-6 flex items-center justify-between border-b border-white/[0.07] bg-black/40 backdrop-blur-xl shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-luxury-blue to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              <Disc3 className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-[0.2em] text-lg text-white">
                  BREEZY
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest bg-luxury-blue/20 text-luxury-blue border border-luxury-blue/40 uppercase">
                  Hi-Res
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-zinc-400 font-mono">
                CHRIS BROWN TRIBUTE &bull; PROXMOX AUDIO VAULT
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center w-80 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Chris Brown, Drake, tracks..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-hidden focus:border-luxury-blue transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Download Songs Assistant Button */}
          <button
            onClick={() => setIsDownloaderOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all hover:scale-105"
          >
            <Download className="w-3.5 h-3.5 text-luxury-gold" />
            <span>Download Music</span>
          </button>

          {/* Proxmox Bridge Status Button */}
          <button
            onClick={() => setIsProxmoxOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Server className="w-3.5 h-3.5" />
            <span>Proxmox: {proxmoxConfig.host}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Exhibition Spotlight Stage (From reference photo) */}
        <StoneNicheGallery
          albums={albums}
          selectedAlbum={selectedAlbum}
          onSelectAlbum={(album) => {
            setSelectedAlbum(album);
            if (album.songs.length > 0) {
              playSong(album.songs[0]);
            }
          }}
          onPlaySong={(album) => {
            setSelectedAlbum(album);
            if (album.songs.length > 0) {
              playSong(album.songs[0]);
            }
          }}
          isPlaying={isPlaying}
        />

        {/* TRACKLIST & AUDIO SPECS TABLE */}
        <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xl font-display font-medium text-white flex items-center gap-2">
                <span>{selectedAlbum.title}</span>
                <span className="text-xs font-mono text-zinc-400 font-normal">
                  ({selectedAlbum.songs.length} Tracks)
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {selectedAlbum.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-luxury-gold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Bit-Perfect FLAC
              </span>
            </div>
          </div>

          {/* Songs List */}
          <div className="space-y-1.5">
            {selectedAlbum.songs.map((song, index) => {
              const isCurrent = currentSong.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-white/10 border border-white/15 shadow-lg'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3.5">
                          <span className="w-0.5 h-full bg-luxury-blue animate-pulse" />
                          <span className="w-0.5 h-2 bg-luxury-blue animate-pulse delay-75" />
                          <span className="w-0.5 h-3 bg-luxury-blue animate-pulse delay-150" />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </span>

                    <img
                      src={song.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shadow-md"
                    />

                    <div>
                      <h4
                        className={`text-sm font-semibold tracking-wide ${
                          isCurrent ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Audiophile badge */}
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-white/5 text-zinc-400 border border-white/5">
                      {song.bitrate}
                    </span>

                    <span className="text-xs font-mono text-zinc-400">
                      {formatTime(song.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* BOTTOM MASTER AUDIOPHILE PLAYER BAR */}
      <footer className="relative z-30 h-22 px-6 flex items-center justify-between border-t border-white/[0.08] bg-[#07090f]/90 backdrop-blur-2xl shrink-0">
        {/* Left: Now Playing Metadata */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10 shrink-0">
            <img
              src={currentSong.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div
                className="absolute inset-0 opacity-40 blur-sm pointer-events-none"
                style={{ backgroundColor: currentSong.accentColor }}
              />
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate tracking-wide">
              {currentSong.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate font-mono">{currentSong.artist}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
                {currentSong.bitrate}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Controls, Scrub Bar & Audio Visualizer */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-4 space-y-1.5">
          {/* Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={handlePrev}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Synced Lyrics toggle */}
            <button
              onClick={() => setIsLyricsOpen(true)}
              className="text-zinc-400 hover:text-luxury-blue transition-colors relative"
              title="Synced Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>
          </div>

          {/* Scrubber Bar */}
          <div className="w-full flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-luxury-blue"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Real-time Dynamic Audio Visualizer */}
          <div className="hidden md:block w-full">
            <AudioVisualizer isPlaying={isPlaying} accentColor={currentSong.accentColor} />
          </div>
        </div>

        {/* Right: Volume & Proxmox Latency Indicator */}
        <div className="flex items-center justify-end gap-4 w-1/4 min-w-[180px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <button
            onClick={() => setIsProxmoxOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-emerald-400"
            title="Stream Latency to Proxmox"
          >
            <span>{proxmoxConfig.streamLatencyMs}ms</span>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <MusicDownloaderModal
        isOpen={isDownloaderOpen}
        onClose={() => setIsDownloaderOpen(false)}
      />

      <SyncedLyricsModal
        song={currentSong}
        currentTime={currentTime}
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
      />

      <ProxmoxBridgeModal
        isOpen={isProxmoxOpen}
        onClose={() => setIsProxmoxOpen(false)}
        config={proxmoxConfig}
        onUpdateConfig={setProxmoxConfig}
      />
    </div>
  );
}
export default App;
