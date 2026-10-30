import React, { useState, useEffect, useRef } from 'react';
import { FEATURED_ALBUMS, ALL_SONGS } from './mockData';
import { Album, Song } from './types';
import { CircularCarousel, CarouselItem } from './components/CircularCarousel';
import { CometDial } from './components/CometDial';
import { OptionWheel } from './components/OptionWheel';
import { AudioVisualizer } from './components/AudioEngine';
import { MusicDownloaderModal } from './components/MusicDownloaderModal';
import { SyncedLyricsModal } from './components/SyncedLyricsModal';
import { audioSynth } from './utils/audioSynthesizer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic2,
  Download,
  Search,
  Sparkles,
  ArrowLeft,
  Pin,
  PinOff,
  X,
  GripHorizontal,
  History,
  Music2
} from 'lucide-react';

export function App() {
  const [albums] = useState<Album[]>(FEATURED_ALBUMS);
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<Song>(FEATURED_ALBUMS[0].songs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FEATURED_ALBUMS[0].songs[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Recently Listened History Queue for OptionWheel
  const [historySongs, setHistorySongs] = useState<Song[]>([
    FEATURED_ALBUMS[0].songs[0], // Under the Influence
    FEATURED_ALBUMS[0].songs[1], // Call Me Every Day
    FEATURED_ALBUMS[1].songs[0], // Knife Talk
    FEATURED_ALBUMS[2].songs[0], // No Guidance
    FEATURED_ALBUMS[3].songs[0], // Rich Flex
    FEATURED_ALBUMS[4].songs[0], // Sensational
  ]);

  // Draggable & Pinnable Volume State
  const [isVolumeOpen, setIsVolumeOpen] = useState<boolean>(false);
  const [isVolumePinned, setIsVolumePinned] = useState<boolean>(false);
  const [volumePos, setVolumePos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const volumeLeaveTimeout = useRef<number | null>(null);

  // View state: 'home' (Pure Fullscreen Carousel) vs 'album' (Split detail track view)
  const [viewMode, setViewMode] = useState<'home' | 'album'>('home');

  // Modals
  const [isDownloaderOpen, setIsDownloaderOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);

  const selectedAlbum = albums[selectedAlbumIndex] || albums[0];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map albums to React Bits CircularCarousel items
  const carouselItems: CarouselItem[] = albums.map((alb) => ({
    src: alb.coverUrl,
    alt: alb.title,
    title: alb.title,
    subtitle: `${alb.artist} • ${alb.year}`,
    albumId: alb.id
  }));

  // Format labels for OptionWheel: "Song Title — Album"
  const historyLabels = historySongs.map((s) => `${s.title} — ${s.album}`);

  // Playback volume handling
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    audioSynth.setVolume(effectiveVol);
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
  }, [volume, isMuted]);

  // Track timer loop
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioSynth.stopRhythm();
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      audioSynth.startRhythm(currentSong.genre);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration);
    setIsPlaying(true);

    // Add to history list at the top (avoid duplicates)
    setHistorySongs((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      return [song, ...filtered];
    });

    // Also match the carousel to the song's album
    const matchingAlbumIdx = albums.findIndex((a) => a.title === song.album || a.id.includes(song.album.toLowerCase()));
    if (matchingAlbumIdx !== -1) {
      setSelectedAlbumIndex(matchingAlbumIdx);
    }

    audioSynth.startRhythm(song.genre);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Hover & Drag handling for Volume Dial
  const handleVolumeMouseEnter = () => {
    if (volumeLeaveTimeout.current) {
      clearTimeout(volumeLeaveTimeout.current);
      volumeLeaveTimeout.current = null;
    }
    setIsVolumeOpen(true);
  };

  const handleVolumeMouseLeave = () => {
    if (!isVolumePinned) {
      volumeLeaveTimeout.current = window.setTimeout(() => {
        setIsVolumeOpen(false);
      }, 500);
    }
  };

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    const currentX = volumePos?.x ?? (window.innerWidth - 260);
    const currentY = volumePos?.y ?? (window.innerHeight - 340);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY
    };

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolume || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(16, Math.min(window.innerWidth - 240, dragStartRef.current.startX + dx));
    const newY = Math.max(16, Math.min(window.innerHeight - 320, dragStartRef.current.startY + dy));

    setVolumePos({ x: newX, y: newY });
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingVolume(false);
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Filter songs if searching
  const filteredSongs = searchQuery.trim() !== ''
    ? ALL_SONGS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div
      className="relative w-screen h-screen flex flex-col bg-[#050608] text-white overflow-hidden transition-colors duration-1000"
      style={{
        '--glow-color': currentSong.accentColor,
      } as React.CSSProperties}
    >
      {/* Background Cinematic Aura */}
      <div
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-[180px] opacity-25 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: currentSong.accentColor }}
      />
      <div
        className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: selectedAlbum.accentColor }}
      />

      {/* TOP BAR / MINIMALIST LINE HEADER */}
      <header className="relative z-30 h-20 px-8 flex items-center justify-between shrink-0">
        {/* Bold Squishy BREEZY Brand */}
        <div
          onClick={() => { setViewMode('home'); setSearchQuery(''); }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <span className="font-unbounded font-black text-2xl md:text-3xl tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform">
            BREEZY
          </span>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 hidden sm:inline">
            // MASTER AUDIO
          </span>
        </div>

        {/* Minimalist Search Underline */}
        <div className="flex items-center w-72 md:w-96 relative group">
          <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors absolute left-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks or artists..."
            className="w-full pl-7 pr-3 py-1.5 text-xs font-sans text-white placeholder-zinc-500 minimal-search-input focus:outline-hidden"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {viewMode === 'album' && (
            <button
              onClick={() => setViewMode('home')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CAROUSEL</span>
            </button>
          )}

          <button
            onClick={() => setIsDownloaderOpen(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-white group-hover:text-luxury-blue transition-colors" />
            <span>GET MUSIC</span>
          </button>
        </div>
      </header>

      {/* MAIN SCREEN STAGE */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col justify-center pb-24">
        {/* VIEW 1: HOME PAGE — PURE CAROUSEL + OPTIONWHEEL ON THE SIDE */}
        {viewMode === 'home' && !filteredSongs && (
          <div className="relative w-full h-full flex items-center justify-between px-6 lg:px-12 select-none animate-fadeIn">
            {/* LEFT SIDE: REACT BITS OPTIONWHEEL (RECENT LISTENING HISTORY) */}
            <aside className="hidden lg:flex flex-col justify-center w-72 h-[480px] z-30 pointer-events-auto">
              <div className="flex items-center gap-2 px-6 mb-3 text-zinc-400 font-mono text-[10px] tracking-[0.2em] uppercase">
                <History className="w-3.5 h-3.5 text-luxury-gold" />
                <span>Last Listened</span>
              </div>

              <div className="w-full h-[400px] relative">
                <OptionWheel
                  items={historyLabels}
                  defaultSelected={0}
                  side="left"
                  textColor="rgba(255, 255, 255, 0.28)"
                  activeColor={currentSong.accentColor || '#ffffff'}
                  fontSize={1.05}
                  spacing={2.2}
                  curve={1.25}
                  tilt={8.5}
                  blur={1.2}
                  fade={0.32}
                  smoothing={240}
                  inset={24}
                  draggable={true}
                  onSelect={(index) => {
                    const selected = historySongs[index];
                    if (selected) playSong(selected);
                  }}
                  className="w-full h-full"
                />
              </div>

              <div className="px-6 mt-2 text-[9px] font-mono text-zinc-600 tracking-wider">
                Scroll &bull; Click track to play
              </div>
            </aside>

            {/* CENTER: THE 3D CIRCULAR CAROUSEL */}
            <div className="relative flex-1 h-full flex flex-col items-center justify-center">
              {/* Elevated Table Pedestal Under-Shadow */}
              <div
                className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[680px] max-w-[70vw] h-12 rounded-full blur-2xl opacity-60 pointer-events-none transition-colors duration-700"
                style={{
                  backgroundColor: '#000000',
                  boxShadow: `0 40px 100px 30px rgba(0,0,0,0.98), 0 0 50px 10px ${selectedAlbum.accentColor}20`
                }}
              />

              {/* Top Spotlight Fixture & Cone */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 w-52 h-2 rounded-full blur-md opacity-80 z-20 pointer-events-none transition-colors duration-700"
                style={{
                  backgroundColor: selectedAlbum.accentColor,
                  boxShadow: `0 0 70px 20px ${selectedAlbum.accentColor}`
                }}
              />

              {/* The Big React Bits CircularCarousel */}
              <div className="w-full h-[580px] max-h-[75vh] flex items-center justify-center">
                <CircularCarousel
                  items={carouselItems}
                  preset="cylinder"
                  intro="assemble"
                  cardWidth={290}
                  aspectRatio={1}
                  speed={8}
                  captions={true}
                  gap={50}
                  tilt={-4}
                  perspective={2200}
                  momentum={0.65}
                  snap={true}
                  parallax={0.35}
                  stretch={0.4}
                  fadeColor="#050608"
                  cornerRadius={28}
                  onChange={(index) => {
                    setSelectedAlbumIndex(index);
                    if (albums[index] && albums[index].songs.length > 0) {
                      setCurrentSong(albums[index].songs[0]);
                    }
                  }}
                  onItemClick={(item, index) => {
                    setSelectedAlbumIndex(index);
                    setViewMode('album');
                  }}
                  className="w-full h-full"
                />
              </div>

              {/* Interactive Invitation Badge */}
              <div
                onClick={() => setViewMode('album')}
                className="group cursor-pointer inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 backdrop-blur-md text-xs font-mono tracking-wider text-zinc-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 z-30 -mt-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-luxury-gold group-hover:rotate-12 transition-transform" />
                <span>CLICK ALBUM TO EXPLORE TRACKS</span>
              </div>
            </div>

            {/* RIGHT SIDE: SYMMETRICAL SPACER / QUICK STATS */}
            <aside className="hidden lg:flex flex-col justify-center items-end w-72 h-[480px] z-30 pointer-events-none pr-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md text-right space-y-3 pointer-events-auto">
                <div className="flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
                  <span>AUDIO FIDELITY</span>
                  <Music2 className="w-3.5 h-3.5 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-sm font-unbounded font-bold text-white tracking-tight">
                    STUDIO MASTER
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    24-Bit / 96.0 kHz FLAC
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                    &bull; ZERO LATENCY STREAM
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* VIEW 2: ALBUM DETAIL VIEW (SLIDES TO SIDE & DISPLAYS TRACKS) */}
        {(viewMode === 'album' || filteredSongs) && (
          <div className="relative w-full h-full max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-10 overflow-y-auto pt-4 pb-12 animate-fadeIn">
            {/* Left: Showcase Pedestal of Active Album */}
            <div className="w-full md:w-80 shrink-0 flex flex-col items-center md:items-start space-y-5 text-center md:text-left">
              <button
                onClick={() => setViewMode('home')}
                className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Exhibition</span>
              </button>

              <div
                className="relative w-64 h-64 md:w-76 md:h-76 rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-white/15 group"
                style={{
                  boxShadow: `0 35px 80px -15px rgba(0,0,0,0.95), 0 0 35px ${selectedAlbum.accentColor}35`
                }}
              >
                <img
                  src={selectedAlbum.coverUrl}
                  alt={selectedAlbum.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <button
                  onClick={() => {
                    if (selectedAlbum.songs.length > 0) {
                      playSong(selectedAlbum.songs[0]);
                    }
                  }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-7 h-7 fill-black ml-1" />
                  </div>
                </button>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-unbounded font-bold tracking-tight text-white">
                  {selectedAlbum.title}
                </h2>
                <p className="text-sm font-sans text-zinc-400 mt-1">
                  {selectedAlbum.artist} &bull; {selectedAlbum.year}
                </p>
                <p className="text-xs text-zinc-500 font-sans mt-2 line-clamp-3 leading-relaxed">
                  {selectedAlbum.description}
                </p>
              </div>
            </div>

            {/* Right: Smooth Sliding Tracklist */}
            <div className="flex-1 w-full max-h-[68vh] overflow-y-auto space-y-2 pr-2">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                  {filteredSongs ? `Search Results (${filteredSongs.length})` : 'Master Studio Tracks'}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {filteredSongs ? '' : `${selectedAlbum.songs.length} Tracks`}
                </span>
              </div>

              {(filteredSongs || selectedAlbum.songs).map((song, index) => {
                const isCurrent = currentSong.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song)}
                    className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                      isCurrent
                        ? 'bg-white/10 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md'
                        : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white transition-colors">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-3.5">
                            <span className="w-0.5 h-full bg-white animate-pulse" />
                            <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                            <span className="w-0.5 h-3 bg-white animate-pulse delay-150" />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </span>

                      <img
                        src={song.coverUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover shadow-md border border-white/10 transition-transform duration-300 group-hover:scale-105"
                      />

                      <div>
                        <h4
                          className={`text-sm font-semibold tracking-wide transition-colors ${
                            isCurrent ? 'text-white font-bold' : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono tracking-wider bg-white/5 text-zinc-400 border border-white/5">
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
        )}
      </main>

      {/* DRAGGABLE & PINNABLE COMETDIAL VOLUME HUD */}
      {isVolumeOpen && (
        <div
          className={`fixed p-5 rounded-3xl bg-[#0b0e14]/95 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center z-50 transition-shadow duration-300 ${
            isDraggingVolume ? 'cursor-grabbing select-none' : ''
          }`}
          style={{
            left: volumePos ? `${volumePos.x}px` : undefined,
            top: volumePos ? `${volumePos.y}px` : undefined,
            right: volumePos ? undefined : '28px',
            bottom: volumePos ? undefined : '100px',
            boxShadow: `0 25px 60px -10px rgba(0,0,0,0.95), 0 0 35px ${currentSong.accentColor}30`,
          }}
          onMouseEnter={handleVolumeMouseEnter}
          onMouseLeave={handleVolumeMouseLeave}
        >
          {/* Draggable Top Bar with Drag Handle, Pin and Close Button */}
          <div
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <GripHorizontal className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-zinc-300">
                STUDIO GAIN
              </span>
            </div>

            <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
              {/* Pin / Unpin Button */}
              <button
                onClick={() => setIsVolumePinned(!isVolumePinned)}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  isVolumePinned
                    ? 'bg-luxury-blue/20 text-luxury-blue border border-luxury-blue/40'
                    : 'text-zinc-500 hover:text-white hover:bg-white/10'
                }`}
                title={isVolumePinned ? 'Pinned in place (Click to unpin)' : 'Pin in place'}
              >
                {isVolumePinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              {/* Close 'X' Button */}
              <button
                onClick={() => {
                  setIsVolumeOpen(false);
                  setIsVolumePinned(false);
                }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Close volume dial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CometDial Dial Engine */}
          <CometDial
            value={Math.round(volume * 100)}
            defaultValue={85}
            min={0}
            max={100}
            step={1}
            unit="%"
            label="Volume"
            accent={currentSong.accentColor || '#ffffff'}
            ink="#ffffff"
            size={170}
            sweep={310}
            thickness={5}
            speed={28}
            tapBounce={0.25}
            flickBounce={0.25}
            momentum={1.1}
            cometReach={180}
            cometWidth={10}
            onChange={(val) => {
              setVolume(val / 100);
              setIsMuted(false);
            }}
          />

          <div className="text-[9px] font-mono text-zinc-500 mt-2 tracking-wide">
            Drag header to move anywhere &bull; Pin to keep open
          </div>
        </div>
      )}

      {/* BOTTOM MASTER AUDIOPHILE PLAYER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-22 px-8 flex items-center justify-between border-t border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl">
        {/* Left: Now Playing Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
            <img
              src={currentSong.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div
                className="absolute inset-0 opacity-40 blur-xs pointer-events-none"
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
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
                {currentSong.bitrate}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Controls, Scrubber & Visualizer */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-4 space-y-1">
          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={handlePrev}
              className="text-zinc-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="text-zinc-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Synced Lyrics */}
            <button
              onClick={() => setIsLyricsOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Karaoke Lyrics"
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
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Visualizer */}
          <div className="hidden md:block w-full">
            <AudioVisualizer isPlaying={isPlaying} accentColor={currentSong.accentColor} />
          </div>
        </div>

        {/* Right: Trigger Volume Button & Pill */}
        <div
          className="relative flex items-center justify-end gap-3 w-1/4 min-w-[180px]"
          onMouseEnter={handleVolumeMouseEnter}
          onMouseLeave={handleVolumeMouseLeave}
        >
          {/* Trigger Icon & Mini Volume Pill in footer */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 active:scale-95"
            title="Mute / Unmute"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:bg-white/[0.08]"
            onClick={() => {
              setIsVolumeOpen(!isVolumeOpen);
              if (!isVolumeOpen) setIsVolumePinned(true);
            }}
            title="Click to toggle & pin draggable volume dial"
          >
            <span className="text-xs font-mono font-semibold tracking-wider text-white">
              {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
            </span>
            <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-150"
                style={{
                  width: `${isMuted ? 0 : volume * 100}%`,
                  backgroundColor: currentSong.accentColor
                }}
              />
            </div>
          </div>
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
    </div>
  );
}

export default App;
