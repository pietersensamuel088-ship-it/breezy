import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FEATURED_ALBUMS, ALL_SONGS } from './mockData';
import { Album, Song } from './types';
import { CircularCarousel, CarouselItem } from './components/CircularCarousel';
import { CometDial } from './components/CometDial';
import { LineSidebar } from './components/LineSidebar';
import { AudioVisualizer } from './components/AudioEngine';
import { MusicDownloaderModal } from './components/MusicDownloaderModal';
import { SyncedLyricsModal } from './components/SyncedLyricsModal';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { SongDetailModal } from './components/SongDetailModal';
import { UserHubModal } from './components/UserHubModal';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { QueuePopover } from './components/QueuePopover';
import { LightningEffect } from './components/LightningEffect';
import { LikedSongsView, LikedSongItem } from './components/LikedSongsView';
import { useHoldToQueue } from './utils/useHoldToQueue';
import { checkForGitHubUpdate, GitHubCommitInfo } from './utils/githubUpdater';
import { audioSynth } from './utils/audioSynthesizer';
import { fuzzySearchSongs, searchCloudMusic } from './utils/songSearchEngine';
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
  Music2,
  Maximize2,
  User,
  GitBranch,
  Globe,
  Loader2,
  Radio,
  ListMusic,
  Heart
} from 'lucide-react';

export function App() {
  const [albums] = useState<Album[]>(FEATURED_ALBUMS);
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<Song>(FEATURED_ALBUMS[0].songs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FEATURED_ALBUMS[0].songs[0].duration);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Identity & Welcome State
  const [currentUser, setCurrentUser] = useState<string>(
    () => localStorage.getItem('breezy_username') || 'Guest'
  );
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true);
  const [isUserHubOpen, setIsUserHubOpen] = useState<boolean>(false);
  const [hasGitHubUpdate, setHasGitHubUpdate] = useState<boolean>(false);
  const [latestGitHubCommit, setLatestGitHubCommit] = useState<GitHubCommitInfo | null>(null);
  const [isUpdateBannerDismissed, setIsUpdateBannerDismissed] = useState<boolean>(false);

  // Background GitHub Update Check (Only for standalone Electron Desktop app)
  useEffect(() => {
    // Only prompt for updates in Electron desktop app where 1-click update is native!
    // Never annoy or loop reload in standard web browsers.
    if (typeof window === 'undefined' || !window.electronAPI?.isElectron) {
      return;
    }
    const checkUpdate = async () => {
      const res = await checkForGitHubUpdate();
      if (res.hasUpdate) {
        setHasGitHubUpdate(true);
        setLatestGitHubCommit(res.latestCommit);
      }
    };
    checkUpdate();
    const interval = setInterval(checkUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  // Song Detail View Modal with React Bits HoloCard
  const [isSongDetailOpen, setIsSongDetailOpen] = useState<boolean>(false);

  // Recently Listened History Queue for LineSidebar (Maintains stable positions while playing)
  const [historySongs, setHistorySongs] = useState<Song[]>([
    FEATURED_ALBUMS[0]?.songs[0] || ALL_SONGS[0],
    FEATURED_ALBUMS[1]?.songs[0] || ALL_SONGS[1],
    FEATURED_ALBUMS[2]?.songs[0] || ALL_SONGS[2],
    FEATURED_ALBUMS[7]?.songs[0] || ALL_SONGS[3],
    FEATURED_ALBUMS[9]?.songs[0] || ALL_SONGS[4],
    FEATURED_ALBUMS[11]?.songs[0] || ALL_SONGS[5],
  ]);

  // Draggable & Pinnable Volume State
  const [isVolumeOpen, setIsVolumeOpen] = useState<boolean>(false);
  const [isVolumePinned, setIsVolumePinned] = useState<boolean>(false);
  const [volumePos, setVolumePos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const volumeLeaveTimeout = useRef<number | null>(null);

  // View state: 'home' (Pure Fullscreen Carousel) vs 'album' (Split detail track view) vs 'liked' (Spotify Liked Songs List)
  const [viewMode, setViewMode] = useState<'home' | 'album' | 'liked'>('home');

  // Spotify-style Play History Stack for true historical rewind
  const [playHistoryStack, setPlayHistoryStack] = useState<Song[]>([]);

  // Spotify Liked Songs collection with persistent LocalStorage
  const [likedSongs, setLikedSongs] = useState<LikedSongItem[]>(() => {
    try {
      const saved = localStorage.getItem('breezy_liked_songs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse breezy_liked_songs', e);
    }
    // High-energy starter favorites so list is never blank out of the box
    return [
      { ...(FEATURED_ALBUMS[0]?.songs[0] || ALL_SONGS[0]), likedAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { ...(FEATURED_ALBUMS[1]?.songs[0] || ALL_SONGS[1]), likedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
      { ...(FEATURED_ALBUMS[2]?.songs[0] || ALL_SONGS[2]), likedAt: new Date(Date.now() - 86400000 * 4).toISOString() },
      { ...(FEATURED_ALBUMS[7]?.songs[0] || ALL_SONGS[3]), likedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    ];
  });

  const isSongLiked = useCallback((songId: string) => {
    return likedSongs.some((s) => s.id === songId);
  }, [likedSongs]);

  const toggleLikeSong = useCallback((song: Song) => {
    setLikedSongs((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      let updated: LikedSongItem[];
      if (exists) {
        updated = prev.filter((s) => s.id !== song.id);
      } else {
        updated = [{ ...song, likedAt: new Date().toISOString() }, ...prev];
      }
      try {
        localStorage.setItem('breezy_liked_songs', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save breezy_liked_songs', e);
      }
      return updated;
    });
  }, []);

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

  // Format labels for LineSidebar: "Song Title • Album"
  const historyLabels = historySongs.map((s) => `${s.title} • ${s.album}`);

  // Which index in history matches the current playing song
  const activeHistoryIndex = historySongs.findIndex((s) => s.id === currentSong.id);

  // Playback volume handling
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    audioSynth.setVolume(effectiveVol);
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
  }, [volume, isMuted]);

  // Commit a song to #1 in recently played (called when completed or finished)
  const commitSongToHistory = (song: Song) => {
    setHistorySongs((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      return [song, ...filtered];
    });
  };



  // Master Audio Sync Effect: Handles song loading and playing reliably without React reconciliation clashes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetUrl = currentSong.audioUrl;
    let needsSourceChange = false;
    try {
      const parsedDesired = new URL(targetUrl, window.location.origin).href;
      needsSourceChange = audio.src !== parsedDesired;
    } catch {
      needsSourceChange = !audio.src.includes(encodeURIComponent(currentSong.title));
    }

    if (needsSourceChange) {
      setIsBuffering(true);
      audio.src = targetUrl;
      audio.load();
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Breezy Audio Play Notice]', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [currentSong.id, currentSong.audioUrl, isPlaying]);

  // Interactive Spotify-Tier Play Queue State
  const [queue, setQueue] = useState<Song[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [lightningActive, setLightningActive] = useState<boolean>(false);
  const [lightningTrack, setLightningTrack] = useState<string>('');

  // Track which song IDs have already been prefetched to avoid duplicate background requests
  const prefetchedIdsRef = useRef<Set<string>>(new Set());

  // Prefetch a track to Proxmox/server disk and browser cache immediately in the background
  const prefetchSong = useCallback((song: Song) => {
    if (!song || !song.id || prefetchedIdsRef.current.has(song.id)) return;
    prefetchedIdsRef.current.add(song.id);

    try {
      fetch(song.audioUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-131071' },
      }).catch(() => {});
    } catch {
      // silent
    }
  }, []);

  const handleLightningComplete = useCallback(() => {
    setLightningActive(false);
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    setLightningTrack(song.title);
    setLightningActive(true);
    // Automatically trigger Proxmox/server headless background download!
    prefetchSong(song);
  }, [prefetchSong]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveQueueUp = useCallback((index: number) => {
    if (index <= 0) return;
    setQueue((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  }, []);

  const moveQueueDown = useCallback((index: number) => {
    setQueue((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const playSong = (song: Song, shouldNavigateToAlbum = false, fromHistory = false) => {
    // Spotify history stack: push current song if navigating to a new track and not from rewind
    if (!fromHistory && currentSong && currentSong.id !== song.id) {
      setPlayHistoryStack((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].id === currentSong.id) return prev;
        return [...prev, currentSong];
      });
    }

    // If we've listened to the previous song for more than 10 seconds, move previous to #1
    if (currentTime > 10 && currentSong.id !== song.id) {
      commitSongToHistory(currentSong);
    }

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration);
    setIsBuffering(true);
    setIsPlaying(true);

    // Automatically navigate to the song's album
    const matchingAlbumIdx = albums.findIndex(
      (a) => a.title.toLowerCase() === song.album.toLowerCase() ||
             a.id.toLowerCase().includes(song.album.toLowerCase()) ||
             song.album.toLowerCase().includes(a.title.toLowerCase())
    );

    if (matchingAlbumIdx !== -1) {
      setSelectedAlbumIndex(matchingAlbumIdx);
    }

    // Go to album view if requested or clicked from recently played
    if (shouldNavigateToAlbum) {
      setViewMode('album');
    }
  };

  // Hold-to-Queue hook with automatic Hover-to-Prefetch for all interactive track lists
  const { holdingSongId, holdProgress, bindHold } = useHoldToQueue({
    onQueue: addToQueue,
    onClick: (song) => playSong(song),
    onHover: (song) => prefetchSong(song),
    holdDurationMs: 3000,
  });

  // Upcoming Song Calculation (Prioritizes Queue, then Album Sequence, then Library)
  const upcomingSong = useMemo(() => {
    if (queue.length > 0) return queue[0];
    const albumWithSong = albums.find((a) => a.songs.some((s) => s.id === currentSong.id)) || selectedAlbum;
    if (!albumWithSong || albumWithSong.songs.length === 0) return null;
    const curIdx = albumWithSong.songs.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (curIdx + 1) % albumWithSong.songs.length;
    return albumWithSong.songs[nextIdx];
  }, [queue, albums, selectedAlbum, currentSong.id]);

  const handleNext = () => {
    if (upcomingSong) {
      if (queue.length > 0) {
        setQueue((prev) => prev.slice(1));
      }
      playSong(upcomingSong);
      return;
    }
    const currentIndex = selectedAlbum.songs.findIndex(s => s.id === currentSong.id);
    const nextSong = selectedAlbum.songs[(currentIndex + 1) % selectedAlbum.songs.length];
    playSong(nextSong);
  };

  // Spotify-Tier Predictive Lookahead Engine: Prefetches next upcoming song into browser cache & local proxy
  useEffect(() => {
    if (upcomingSong && upcomingSong.id !== currentSong.id) {
      prefetchSong(upcomingSong);
    }
  }, [upcomingSong, currentSong.id, prefetchSong]);

  const handlePrev = () => {
    // Spotify Rule 1: If audio has played for more than 3 seconds, rewind current track to 0:00
    const currentAudioTime = audioRef.current?.currentTime ?? currentTime;
    if (currentAudioTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      return;
    }

    // Spotify Rule 2: If <= 3 seconds, play the most recent track from session play history
    if (playHistoryStack.length > 0) {
      const prevSong = playHistoryStack[playHistoryStack.length - 1];
      setPlayHistoryStack((prev) => prev.slice(0, -1));
      playSong(prevSong, false, true);
      return;
    }

    // Spotify Fallback: If no history exists, go to previous track in album or restart
    const currentIndex = selectedAlbum.songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + selectedAlbum.songs.length) % selectedAlbum.songs.length;
    playSong(selectedAlbum.songs[prevIndex], false, true);
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

  // Smart Typo-Tolerant Fuzzy Search & Cloud Music Fetcher
  const [cloudSearchResults, setCloudSearchResults] = useState<Song[]>([]);
  const [isSearchingCloud, setIsSearchingCloud] = useState<boolean>(false);

  const fuzzyResult = useMemo(() => {
    if (!searchQuery.trim()) return { matches: [], didYouMean: null };
    return fuzzySearchSongs(searchQuery, ALL_SONGS);
  }, [searchQuery]);

  const filteredSongs = searchQuery.trim() !== '' ? fuzzyResult.matches : null;

  // Spotify Pre-buffer Engine: As soon as search results load, pre-buffer top track in the background
  useEffect(() => {
    if (cloudSearchResults.length > 0) {
      prefetchSong(cloudSearchResults[0]);
    }
  }, [cloudSearchResults, prefetchSong]);

  useEffect(() => {
    if (filteredSongs && filteredSongs.length > 0) {
      prefetchSong(filteredSongs[0]);
    }
  }, [filteredSongs, prefetchSong]);

  // Cloud API Search Debounce (Auto-corrects typos & fetches official studio metadata)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setCloudSearchResults([]);
      setIsSearchingCloud(false);
      return;
    }

    setIsSearchingCloud(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await searchCloudMusic(searchQuery, controller.signal);
        setCloudSearchResults(res.songs);
      } catch {
        setCloudSearchResults([]);
      } finally {
        setIsSearchingCloud(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  return (
    <div
      className="relative w-screen h-screen flex flex-col bg-[#050608] text-white overflow-hidden transition-colors duration-1000"
      style={{
        '--glow-color': currentSong.accentColor,
      } as React.CSSProperties}
    >
      {/* DYNAMIC FULL-SCREEN ACTIVE SONG ARTWORK BACKGROUND (CLEARLY VISIBLE & TURNS WHILE PLAYING) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none flex items-center justify-center">
        {/* Layer 1: Ambient High-Clarity Full-Screen Backdrop */}
        <img
          key={`ambient-${currentSong.id}`}
          src={currentSong.coverUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105 opacity-40 blur-xs transition-all duration-1000 ease-out"
        />

        {/* Layer 2: Majestic Turning Center Artwork (Clearly visible, scaled, turns smoothly in the background) */}
        <div
          className={`relative w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] md:w-[740px] md:h-[740px] rounded-full overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.95)] border border-white/20 opacity-75 transition-opacity duration-700 ${
            isPlaying ? 'animate-vinyl-turn' : 'animate-vinyl-turn animate-vinyl-turn-paused'
          }`}
          style={{
            boxShadow: `0 0 100px 20px ${currentSong.accentColor}35, 0 0 160px rgba(0,0,0,0.9)`
          }}
        >
          {/* Crisp, clearly visible cover artwork of the CURRENT PLAYING song that turns */}
          <img
            key={`turning-${currentSong.id}`}
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover scale-105 transition-all duration-700"
          />

          {/* Luxury Vinyl Center Spindle & Grooves overlay */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,0.4)_75%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
          <div className="absolute inset-0 rounded-full border-[18px] border-white/5 pointer-events-none" />
          <div className="absolute inset-0 rounded-full border-[36px] border-black/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/85 border border-white/25 shadow-2xl flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/70 shadow-[0_0_10px_white]" />
          </div>
        </div>

        {/* Layer 3: Contrast Shield - Soft radial vignette to ensure UI texts and controls remain crisp & readable */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#050608]/40 to-[#050608]/85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-[#050608]/70 pointer-events-none" />
      </div>

      {/* Background Cinematic Aura - Soft, Organic, Seamless Blur */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-[180px] opacity-25 pointer-events-none transition-all duration-1000 z-0"
        style={{ backgroundColor: currentSong.accentColor }}
      />
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[190px] opacity-15 pointer-events-none transition-all duration-1000 z-0"
        style={{ backgroundColor: currentSong.accentColor }}
      />

      {/* TOP BAR / SEAMLESS FLOATING HEADER */}
      <header className="relative z-30 h-20 px-8 flex items-center justify-between shrink-0 bg-transparent">
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

        {/* Minimalist Search Underline with Typo & Cloud Indicator */}
        <div className="flex items-center w-72 md:w-96 relative group">
          <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors absolute left-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any song, artist, or typo..."
            className="w-full pl-7 pr-12 py-1.5 text-xs font-sans text-white placeholder-zinc-500 minimal-search-input focus:outline-hidden"
          />
          <div className="absolute right-0 flex items-center gap-1.5">
            {isSearchingCloud && (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={() => setIsUserHubOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer group"
              title="Open User Profile & GitHub Updates"
            >
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                {hasGitHubUpdate && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                )}
              </div>
              <span className="font-semibold">{currentUser}</span>
              {hasGitHubUpdate && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold animate-pulse">
                  UPDATE
                </span>
              )}
            </button>
          )}

          {/* Spotify Liked Songs Library Quick-Track Pill */}
          <button
            onClick={() => {
              setViewMode((prev) => (prev === 'liked' ? 'home' : 'liked'));
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              viewMode === 'liked'
                ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-500/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.35)]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Open Spotify Liked Songs Library"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                viewMode === 'liked'
                  ? 'fill-purple-400 text-purple-400'
                  : 'text-purple-400 group-hover:text-purple-300'
              }`}
            />
            <span className="font-semibold">LIKED</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono font-bold">
              {likedSongs.length}
            </span>
          </button>

          {(viewMode === 'album' || viewMode === 'liked' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setViewMode('home');
                setSearchQuery('');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CAROUSEL</span>
            </button>
          )}

          <button
            onClick={() => setIsDownloaderOpen(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white group-hover:text-luxury-blue transition-colors" />
            <span>GET MUSIC</span>
          </button>
        </div>
      </header>

      {/* MAIN SCREEN STAGE */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col justify-center pb-24">
        {/* VIEW 1: HOME PAGE — EXPANDED 3D CAROUSEL + REACT BITS LINESIDEBAR ON THE SIDE */}
        {viewMode === 'home' && !filteredSongs && (
          <div className="relative w-full h-full flex items-center justify-between px-4 lg:px-8 select-none animate-exhibition-glide">
            {/* LEFT SIDE: REACT BITS LINESIDEBAR (RECENT LISTENING HISTORY) */}
            <aside className="hidden lg:flex flex-col justify-center w-80 h-[520px] z-30 pointer-events-auto shrink-0 pl-4">
              <div className="flex items-center gap-2 px-2 mb-4 text-zinc-400 font-mono text-[10px] tracking-[0.2em] uppercase">
                <History className="w-3.5 h-3.5 text-luxury-gold" />
                <span>Recently Played</span>
              </div>

              <div className="w-full">
                <LineSidebar
                  items={historyLabels.slice(0, 6)}
                  accentColor={currentSong.accentColor || '#3b82f6'}
                  textColor="#a1a1aa"
                  markerColor="#3f3f46"
                  showIndex={true}
                  showMarker={true}
                  proximityRadius={95}
                  maxShift={26}
                  falloff="smooth"
                  markerLength={42}
                  tickScale={0.5}
                  scaleTick={true}
                  itemGap={22}
                  fontSize={0.9}
                  smoothing={110}
                  defaultActive={activeHistoryIndex !== -1 ? activeHistoryIndex : 0}
                  onItemClick={(index) => {
                    const selected = historySongs[index];
                    if (selected) {
                      // Stays at this index while playing, and automatically navigates to the album!
                      playSong(selected, true);
                    }
                  }}
                />
              </div>

              <div className="px-2 mt-4 text-[9px] font-mono text-zinc-600 tracking-wider">
                Hover to trace &bull; Click to open album & play
              </div>
            </aside>

            {/* CENTER: EXPANDED 3D CIRCULAR CAROUSEL (Wrapped wider across stage without right box) */}
            <div className="relative flex-1 h-full flex flex-col items-center justify-center overflow-visible">
              {/* Elevated Table Pedestal Under-Shadow */}
              <div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[900px] max-w-[85vw] h-14 rounded-full blur-3xl opacity-70 pointer-events-none transition-colors duration-700"
                style={{
                  backgroundColor: '#000000',
                  boxShadow: `0 45px 120px 40px rgba(0,0,0,0.98), 0 0 60px 15px ${selectedAlbum.accentColor}25`
                }}
              />

              {/* Majestic CircularCarousel Wrapping Across the Stage - Bigger & High Performance */}
              <div className="w-full h-[700px] max-h-[85vh] flex items-center justify-center">
                <CircularCarousel
                  items={carouselItems}
                  preset="cylinder"
                  intro="assemble"
                  cardWidth={390}
                  aspectRatio={1}
                  speed={8}
                  captions={true}
                  gap={75}
                  curve={0}
                  backfaces={false}
                  tilt={-3.5}
                  perspective={2600}
                  momentum={0.7}
                  snap={true}
                  parallax={0.25}
                  stretch={0.4}
                  fadeColor="#050608"
                  cornerRadius={32}
                  onChange={(index) => {
                    setSelectedAlbumIndex(index);
                  }}
                  onItemClick={(item, index) => {
                    setSelectedAlbumIndex(index);
                    setViewMode('album');
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SPOTIFY LIKED SONGS VIEW WITH SMOOTH ZOOM-IN ANIMATION */}
        {viewMode === 'liked' && !filteredSongs && (
          <LikedSongsView
            likedSongs={likedSongs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentUser={currentUser}
            onPlaySong={(song) => playSong(song)}
            onTogglePlay={togglePlay}
            onToggleLike={toggleLikeSong}
            onBack={() => setViewMode('home')}
            bindHold={bindHold}
            holdingSongId={holdingSongId}
            holdProgress={holdProgress}
          />
        )}

        {/* VIEW 2: ALBUM DETAIL VIEW (SLIDES TO SIDE & DISPLAYS TRACKS SMOOTHLY) */}
        {(viewMode === 'album' || (filteredSongs && viewMode !== 'liked')) && (
          <div className="relative w-full h-full max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-10 overflow-y-auto pt-4 pb-12 animate-album-glide">
            {/* Left: Showcase Pedestal of Active Album with bottom-up fade */}
            <div className="w-full md:w-80 shrink-0 flex flex-col items-center md:items-start space-y-5 text-center md:text-left animate-slide-up">
              <button
                onClick={() => {
                  setViewMode('home');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors py-1 cursor-pointer"
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
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
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

            {/* Right: Smooth Sliding Tracklist - Cascades from bottom-up */}
            <div className="flex-1 w-full max-h-[68vh] overflow-y-auto space-y-2 pr-2">
              {/* "Did you mean?" Typo Auto-Correct Suggestion */}
              {searchQuery.trim() !== '' && fuzzyResult.didYouMean && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md animate-fadeIn mb-2">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <Sparkles className="w-4 h-4 text-luxury-gold shrink-0 animate-pulse" />
                    <span>Did you mean:</span>
                    <button
                      onClick={() => setSearchQuery(fuzzyResult.didYouMean!)}
                      className="font-bold text-white underline underline-offset-4 hover:text-luxury-blue transition-colors cursor-pointer"
                    >
                      "{fuzzyResult.didYouMean}"
                    </button>
                  </div>
                  <button
                    onClick={() => setSearchQuery(fuzzyResult.didYouMean!)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white transition-all cursor-pointer"
                  >
                    Auto-Correct
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3 animate-slide-up">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                  {filteredSongs ? `Search Results (${filteredSongs.length})` : 'Master Studio Tracks'}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {filteredSongs ? '' : `${selectedAlbum.songs.length} Tracks`}
                </span>
              </div>

              {filteredSongs && filteredSongs.length === 0 && (
                <div className="p-4 text-center text-xs font-mono text-zinc-500">
                  No matching tracks found in featured albums. Checking global cloud...
                </div>
              )}

              {(filteredSongs || selectedAlbum.songs).map((song, index) => {
                const isCurrent = currentSong.id === song.id;
                const isHolding = holdingSongId === song.id;
                return (
                  <div
                    key={song.id}
                    {...bindHold(song)}
                    style={{ animationDelay: `${index * 45}ms` }}
                    className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 animate-slide-up select-none ${
                      isCurrent
                        ? 'bg-white/10 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md'
                        : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                  >
                    {/* Hold-to-Queue Progress Glow Overlay */}
                    {isHolding && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-20">
                        <div
                          className="h-full bg-cyan-400/15 border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all ease-linear"
                          style={{ width: `${Math.round(holdProgress * 100)}%` }}
                        />
                        <div className="absolute top-2 right-4 text-[10px] font-mono text-cyan-300 font-bold tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>HOLD TO QUEUE ({Math.max(1, 3 - Math.floor(holdProgress * 3))}s)</span>
                        </div>
                      </div>
                    )}
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

                    <div className="flex items-center gap-4">
                      {/* Heart Quick-Like Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(song);
                        }}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isSongLiked(song.id)
                            ? 'text-purple-400 hover:scale-110 active:scale-90'
                            : 'text-zinc-600 hover:text-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100'
                        }`}
                        title={isSongLiked(song.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                      >
                        <Heart className={`w-4 h-4 ${isSongLiked(song.id) ? 'fill-purple-400' : ''}`} />
                      </button>

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

              {/* GLOBAL MUSIC CLOUD (Live iTunes / Apple Music / Proxmox Stream) */}
              {searchQuery.trim() !== '' && (cloudSearchResults.length > 0 || isSearchingCloud) && (
                <div className="pt-6 mt-4 border-t border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-luxury-blue" />
                      <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-300">
                        Global Music Cloud (Stream On-Demand via Proxmox)
                      </span>
                    </div>
                    {isSearchingCloud ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Fetching...</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {cloudSearchResults.length} Cloud Masters Found
                      </span>
                    )}
                  </div>

                  {cloudSearchResults.map((song, index) => {
                    const isCurrent = currentSong.id === song.id;
                    const isHolding = holdingSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        {...bindHold(song)}
                        style={{ animationDelay: `${index * 40}ms` }}
                        className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 animate-slide-up select-none ${
                          isCurrent
                            ? 'bg-blue-500/15 border border-blue-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md'
                            : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                        }`}
                      >
                        {/* Hold-to-Queue Progress Glow Overlay */}
                        {isHolding && (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-20">
                            <div
                              className="h-full bg-cyan-400/15 border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all ease-linear"
                              style={{ width: `${Math.round(holdProgress * 100)}%` }}
                            />
                            <div className="absolute top-2 right-4 text-[10px] font-mono text-cyan-300 font-bold tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              <span>HOLD TO QUEUE ({Math.max(1, 3 - Math.floor(holdProgress * 3))}s)</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white transition-colors">
                            {isCurrent && isBuffering ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin mx-auto" />
                            ) : isCurrent && isPlaying ? (
                              <div className="flex items-end justify-center gap-0.5 h-3.5">
                                <span className="w-0.5 h-full bg-blue-400 animate-pulse" />
                                <span className="w-0.5 h-2 bg-blue-400 animate-pulse delay-75" />
                                <span className="w-0.5 h-3 bg-blue-400 animate-pulse delay-150" />
                              </div>
                            ) : (
                              <Radio className="w-3.5 h-3.5 text-luxury-blue mx-auto" />
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
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">
                              {song.artist} &bull; <span className="text-zinc-400">{song.album}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Heart Quick-Like Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeSong(song);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isSongLiked(song.id)
                                ? 'text-purple-400 hover:scale-110 active:scale-90'
                                : 'text-zinc-600 hover:text-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isSongLiked(song.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                          >
                            <Heart className={`w-4 h-4 ${isSongLiked(song.id) ? 'fill-purple-400' : ''}`} />
                          </button>

                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            Proxmox Stream
                          </span>

                          <span className="text-xs font-mono text-zinc-400">
                            {formatTime(song.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
        {/* Left: Now Playing Info (Clickable to open HoloCard Master View) */}
        <div
          onClick={() => setIsSongDetailOpen(true)}
          className="flex items-center gap-4 w-1/4 min-w-[220px] cursor-pointer group"
          title="Click to view full master song stage with 3D Holographic Card"
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 group-hover:scale-105 transition-transform duration-300">
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
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-sm font-bold text-white truncate tracking-wide group-hover:text-blue-300 transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate font-mono">{currentSong.artist}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isBuffering ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 text-blue-400 animate-spin" />
                  <span className="text-[10px] text-blue-400 font-mono tracking-wider animate-pulse">
                    Streaming master on-demand...
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
                    {currentSong.bitrate}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">&bull; Click to expand</span>
                </>
              )}
            </div>
          </div>

          {/* Quick-Like Heart Button (Spotify style) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeSong(currentSong);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isSongLiked(currentSong.id)
                ? 'text-purple-400 hover:scale-115 active:scale-90'
                : 'text-zinc-500 hover:text-purple-400 hover:scale-115 active:scale-90'
            }`}
            title={isSongLiked(currentSong.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart
              className={`w-4.5 h-4.5 transition-colors ${
                isSongLiked(currentSong.id)
                  ? 'fill-purple-400 text-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                  : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Controls, Scrubber & Visualizer */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-4 space-y-1">
          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={handlePrev}
              className="text-zinc-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
              title={currentTime > 3 ? "Restart song (0:00)" : "Play previous song from history"}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : isPlaying ? (
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
            <div className="flex items-center gap-2 shrink-0">
              <span>{formatTime(duration)}</span>

              {/* Special Spotify Queue Button right next to end audio seconds! */}
              <button
                onClick={() => setIsQueueOpen((prev) => !prev)}
                className={`relative p-1.5 rounded-lg transition-all cursor-pointer ${
                  isQueueOpen || queue.length > 0
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Next in Queue"
              >
                <ListMusic className="w-4 h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1.5 px-1 py-0.2 min-w-3.5 text-[9px] font-bold font-mono bg-cyan-400 text-black rounded-full flex items-center justify-center shadow-lg">
                    {queue.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Visualizer: Gently rises up when playing, and gently sinks down when paused */}
          <div
            className={`flex items-center justify-center w-full transition-all duration-700 ease-out overflow-hidden ${
              isPlaying
                ? 'max-h-12 opacity-100 translate-y-0 mt-1'
                : 'max-h-0 opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            <AudioVisualizer
              isPlaying={isPlaying}
              accentColor={currentSong.accentColor}
              audioElement={audioRef.current}
            />
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

      {/* MODALS & OVERLAYS */}
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

      {/* FULLSCREEN SONG DETAIL MASTER STAGE WITH HOLOCARD */}
      <SongDetailModal
        isOpen={isSongDetailOpen}
        onClose={() => setIsSongDetailOpen(false)}
        song={currentSong}
        album={selectedAlbum}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        currentTime={currentTime}
        duration={duration}
        onSeek={(val) => {
          setCurrentTime(val);
          if (audioRef.current) {
            audioRef.current.currentTime = val;
          }
        }}
        volume={volume}
        onVolumeChange={(val) => {
          setVolume(val);
          setIsMuted(false);
        }}
      />

      {/* USER PROFILE & GITHUB AUTO-UPDATER MODAL */}
      <UserHubModal
        isOpen={isUserHubOpen}
        onClose={() => setIsUserHubOpen(false)}
        currentUser={currentUser}
        onSwitchUser={() => {
          localStorage.removeItem('breezy_username');
          setCurrentUser('Guest');
          setIsWelcomeOpen(true);
        }}
      />

      {/* 1-CLICK AUTOMATIC UPDATE PROMPT BANNER */}
      {!isUpdateBannerDismissed && (
        <UpdateNotificationBanner
          hasUpdate={hasGitHubUpdate}
          latestCommit={latestGitHubCommit}
          onDismiss={() => setIsUpdateBannerDismissed(true)}
        />
      )}

      {/* APPLE-STYLE CURSIVE WELCOME SIGN-IN OVERLAY */}
      <WelcomeOverlay
        isOpen={isWelcomeOpen}
        onComplete={(name) => {
          setCurrentUser(name);
          setIsWelcomeOpen(false);
        }}
      />

      {/* SPOTIFY-TIER PLAY QUEUE POPOVER */}
      <QueuePopover
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentSong={currentSong}
        queue={queue}
        onPlaySong={(song) => {
          setQueue((prev) => prev.filter((s) => s.id !== song.id));
          playSong(song);
        }}
        onRemoveFromQueue={removeFromQueue}
        onMoveUp={moveQueueUp}
        onMoveDown={moveQueueDown}
        onClearQueue={clearQueue}
      />

      {/* LIGHTNING BOLT ANIMATION & TOAST */}
      <LightningEffect
        active={lightningActive}
        trackTitle={lightningTrack}
        onComplete={handleLightningComplete}
      />

      {/* Hidden Zero-Latency Audio Preloader for Upcoming Song */}
      {upcomingSong && (
        <audio
          key={`preload-${upcomingSong.id}`}
          src={upcomingSong.audioUrl}
          preload="auto"
          className="hidden pointer-events-none"
        />
      )}

      {/* REAL HIGH-FIDELITY HTML5 AUDIO ENGINE */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          commitSongToHistory(currentSong);
          handleNext();
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onError={(e) => {
          console.error('[Breezy Audio Player Error]', e);
          setIsBuffering(false);
        }}
      />
    </div>
  );
}

export default App;
