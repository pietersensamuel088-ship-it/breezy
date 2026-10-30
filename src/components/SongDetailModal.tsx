import React, { useState, useEffect } from 'react';
import { Song, Album } from '../types';
import HoloCard from './HoloCard';
import { AudioVisualizer } from './AudioEngine';
import { audioSynth } from '../utils/audioSynthesizer';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  FileText,
  Activity,
  Disc3,
  Layers
} from 'lucide-react';

interface SongDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  album: Album;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const HOLO_PRESETS = [
  { id: 'bursts', label: 'Starburst' },
  { id: 'gold', label: 'Gold Foil' },
  { id: 'cosmos', label: 'Cosmos' },
  { id: 'rainbow', label: 'Prism' },
  { id: 'shards', label: 'Diamond' },
  { id: 'stars', label: 'Galaxy' },
  { id: 'glitter', label: 'Glitter' },
] as const;

export function SongDetailModal({
  isOpen,
  onClose,
  song,
  album,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
}: SongDetailModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<typeof HOLO_PRESETS[number]['id']>('gold');
  const [activeTab, setActiveTab] = useState<'synth' | 'specs' | 'lyrics'>('synth');
  const [synthGain, setSynthGain] = useState<number>(0.85);
  const [bassWarmth, setBassWarmth] = useState<number>(0.9);
  const [spatialWidth, setSpatialWidth] = useState<number>(1.0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl overflow-y-auto p-4 sm:p-6 lg:p-10 animate-fadeIn">
      {/* Dynamic Ambient Glow matching Song Accent */}
      <div
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full blur-[190px] opacity-30 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: song.accentColor }}
      />
      <div
        className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-20 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: album.accentColor }}
      />

      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#080b11]/90 border border-white/10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Top Bar with Audiophile Tag & Close Button */}
        <div className="h-16 px-6 sm:px-8 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-300 font-semibold">
              STUDIO MASTER PLAYBACK // 24-BIT 96KHZ FLAC
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            title="Close song view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
          {/* Left Column: Interactive HoloCard Foil Exhibition */}
          <div className="w-full lg:w-[420px] flex flex-col items-center shrink-0">
            {/* The HoloCard Component from React Bits */}
            <div className="relative group p-2">
              <HoloCard
                image={song.coverUrl}
                alt={`${song.title} by ${song.artist}`}
                preset={selectedPreset}
                width={330}
                radius={24}
                shadow={true}
                intensity={1.1}
                scale={1.05}
                className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform duration-300"
              />
            </div>

            <p className="text-[10px] font-mono text-zinc-500 mt-4 tracking-wider text-center">
              Move cursor over card to shift 3D holographic foil reflection
            </p>

            {/* Holo Shader Presets Selector */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5">
              {HOLO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all duration-200 ${
                    selectedPreset === preset.id
                      ? 'bg-white text-black font-bold shadow-md scale-105'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Track Info, Controls, DSP Synthesizer & Specs */}
          <div className="flex-1 w-full flex flex-col justify-between space-y-6">
            {/* Song Meta Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest bg-white/10 text-white border border-white/15">
                  {song.genre}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {album.title} ({album.year})
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-unbounded font-black tracking-tight text-white drop-shadow-sm">
                {song.title}
              </h1>
              <p className="text-base sm:text-lg font-sans text-zinc-300 font-semibold mt-1">
                {song.artist}
              </p>
            </div>

            {/* Audio Engine Visualizer Waveform */}
            <div className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                <span>Real-time Dynamic Spectrum</span>
                <span className="text-emerald-400">DSP Synthesizer Live</span>
              </div>
              <AudioVisualizer isPlaying={isPlaying} accentColor={song.accentColor} />
            </div>

            {/* Scrubber & Master Controls */}
            <div className="w-full space-y-3">
              {/* Timeline Scrubber */}
              <div className="w-full flex items-center gap-4 text-xs font-mono text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span>{formatTime(duration)}</span>
              </div>

              {/* Playback Buttons */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <button
                  onClick={onPrev}
                  className="p-3 text-zinc-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black ml-1" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="p-3 text-zinc-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs: Synthesizer Console, Specs, Lyrics */}
            <div className="w-full pt-4 border-t border-white/10">
              {/* Tab Navigation */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setActiveTab('synth')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                    activeTab === 'synth'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>DSP SYNTH</span>
                </button>

                <button
                  onClick={() => setActiveTab('specs')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                    activeTab === 'specs'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>STREAM SPECS</span>
                </button>

                <button
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                    activeTab === 'lyrics'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>LYRICS PREVIEW</span>
                </button>
              </div>

              {/* Tab Panels */}
              {activeTab === 'synth' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>R&B CHORD HARMONICS</span>
                      <span className="text-white">{Math.round(synthGain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(synthGain * 100)}
                      onChange={(e) => setSynthGain(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>808 SUB-BASS DRIVE</span>
                      <span className="text-white">{Math.round(bassWarmth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(bassWarmth * 100)}
                      onChange={(e) => setBassWarmth(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>SPATIAL STEREO FIELD</span>
                      <span className="text-white">{spatialWidth.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={Math.round(spatialWidth * 100)}
                      onChange={(e) => setSpatialWidth(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">CONTAINER</span>
                    <span className="text-zinc-200 font-semibold">FLAC / Lossless</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">BIT DEPTH & RATE</span>
                    <span className="text-zinc-200 font-semibold">24-Bit / 96,000 Hz</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">DYNAMIC RANGE</span>
                    <span className="text-emerald-400 font-semibold">DR14 (High Fidelity)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">SERVER NODE</span>
                    <span className="text-zinc-200 font-semibold">Proxmox NAS (10 GbE)</span>
                  </div>
                </div>
              )}

              {activeTab === 'lyrics' && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs space-y-2 max-h-36 overflow-y-auto font-sans">
                  {song.lyrics && song.lyrics.length > 0 ? (
                    (() => {
                      const lyricsList = song.lyrics;
                      return lyricsList.map((line, i) => {
                        const nextLine = lyricsList[i + 1];
                        const isActive = currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
                        return (
                          <p
                            key={i}
                            className={`transition-colors ${
                              isActive
                                ? 'text-white font-bold text-sm drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                                : 'text-zinc-500'
                            }`}
                          >
                            {line.text}
                          </p>
                        );
                      });
                    })()
                  ) : (
                    <p className="text-zinc-500 font-mono text-center py-2">
                      Studio synchronized lyrics loading...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SongDetailModal;
