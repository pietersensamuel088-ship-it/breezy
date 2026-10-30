import React, { useState, useEffect, useRef } from 'react';
import { FEATURED_ALBUMS, ALL_SONGS } from './mockData';
import { Album, Song } from './types';
import { CircularCarousel, CarouselItem } from './components/CircularCarousel';
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
  Disc3
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

  // Playback volume handling
  useEffect(() => {
    audioSynth.setVolume(isMuted ? 0 : volume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
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

  // Filter songs based on search
  const displayedSongs = searchQuery.trim() === ''
    ? selectedAlbum.songs
    : ALL_SONGS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div
      className="relative w-screen h-screen flex flex-col bg-[#050608] text-white overflow-hidden transition-colors duration-1000"
      style={{
        '--glow-color': currentSong.accentColor,
      } as React.CSSProperties}
    >
      {/* Background Ambience */}
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
        {/* Bold Squishy BREEZY Brand (Unbounded font) */}
        <div className="flex items-center gap-3">
          <span className="font-unbounded font-black text-2xl md:text-3xl tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
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
          <button
            onClick={() => setIsDownloaderOpen(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-white group-hover:text-luxury-blue transition-colors" />
            <span>GET MUSIC</span>
          </button>
        </div>
      </header>

      {/* MAIN SCROLLABLE BODY */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-28">
        {/* REACT BITS CIRCULAR CAROUSEL STAGE */}
        <div className="relative w-full h-[520px] md:h-[560px] flex flex-col items-center justify-center overflow-visible select-none">
          {/* Spotlight Source & Cone */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-2 rounded-full blur-md opacity-80 z-20 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: selectedAlbum.accentColor, boxShadow: `0 0 60px 15px ${selectedAlbum.accentColor}` }}
          />

          <CircularCarousel
            items={carouselItems}
            preset="cylinder"
            intro="assemble"
            cardWidth={240}
            aspectRatio={1}
            speed={10}
            captions={true}
            gap={45}
            tilt={-3}
            perspective={2100}
            momentum={0.65}
            snap={true}
            parallax={0.35}
            stretch={0.45}
            fadeColor="#050608"
            cornerRadius={22}
            onChange={(index) => {
              setSelectedAlbumIndex(index);
              if (albums[index] && albums[index].songs.length > 0) {
                // Preload song
                setCurrentSong(albums[index].songs[0]);
              }
            }}
            onItemClick={(item, index) => {
              setSelectedAlbumIndex(index);
              if (albums[index] && albums[index].songs.length > 0) {
                playSong(albums[index].songs[0]);
              }
            }}
            className="w-full h-full"
          />
        </div>

        {/* TRACKLIST CONTAINER */}
        <div className="w-full max-w-4xl mx-auto px-6 pt-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-xl md:text-2xl font-unbounded font-bold tracking-tight text-white">
                {selectedAlbum.title}
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                {selectedAlbum.artist} &bull; {selectedAlbum.tracksCount} Master Tracks &bull; {selectedAlbum.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/80 tracking-wider">
                FLAC 24-Bit / 96kHz
              </span>
            </div>
          </div>

          {/* Songs List */}
          <div className="space-y-2">
            {displayedSongs.map((song, index) => {
              const isCurrent = currentSong.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`group relative flex items-center justify-between px-5 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
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
      </main>

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

        {/* Right: Volume */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
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
            className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
          />
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
