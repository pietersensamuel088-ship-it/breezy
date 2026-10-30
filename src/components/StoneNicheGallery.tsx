import React from 'react';
import { Album } from '../types';
import { Play, Disc3, Sparkles } from 'lucide-react';

interface StoneNicheGalleryProps {
  albums: Album[];
  selectedAlbum: Album;
  onSelectAlbum: (album: Album) => void;
  onPlaySong: (album: Album) => void;
  isPlaying: boolean;
}

export const StoneNicheGallery: React.FC<StoneNicheGalleryProps> = ({
  albums,
  selectedAlbum,
  onSelectAlbum,
  onPlaySong,
  isPlaying,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-8 pb-12 overflow-hidden select-none">
      {/* Cinematic Ambient Backlight */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[120px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: selectedAlbum.accentColor }}
      />

      {/* Luxury Collection Header */}
      <div className="text-center z-10 mb-8 space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs tracking-[0.25em] uppercase text-zinc-400 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
          The Exhibition
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-medium tracking-wide text-white">
          THE BREEZY ARCHIVES
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 tracking-widest uppercase font-mono">
          Master Audio Vault &bull; Bit-Perfect Studio Masters
        </p>
      </div>

      {/* The Gallery Niches Row */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex items-end justify-center gap-4 md:gap-8 overflow-x-auto py-6">
        {albums.map((album) => {
          const isSelected = selectedAlbum.id === album.id;

          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
              className="group relative flex flex-col items-center cursor-pointer transition-all duration-500 shrink-0"
              style={{
                transform: isSelected ? 'scale(1.05)' : 'scale(0.92)',
                opacity: isSelected ? 1 : 0.65,
              }}
            >
              {/* Stone Niche Alcove Frame */}
              <div
                className={`relative w-44 md:w-56 h-72 md:h-84 rounded-t-2xl stone-niche flex flex-col items-center justify-between p-4 overflow-hidden transition-all duration-500 ${
                  isSelected ? 'border-white/20' : 'border-white/5'
                }`}
                style={{
                  boxShadow: isSelected
                    ? `0 20px 50px -10px ${album.accentColor}40, inset 0 20px 30px rgba(0,0,0,0.9)`
                    : 'inset 0 20px 30px rgba(0,0,0,0.95)',
                }}
              >
                {/* Overhead Spotlight Fixture */}
                <div
                  className="spotlight-bulb transition-all duration-500"
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : '#a1a1aa',
                    boxShadow: isSelected
                      ? `0 0 24px 6px #fff, 0 0 50px 16px ${album.accentColor}`
                      : '0 0 10px 2px rgba(255,255,255,0.4)',
                  }}
                />

                {/* Overhead Spotlight Light Beam Cone */}
                <div
                  className="spotlight-beam transition-opacity duration-500"
                  style={{
                    opacity: isSelected ? 0.9 : 0.35,
                    background: `radial-gradient(ellipse at 50% 0%, ${
                      isSelected ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)'
                    } 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`,
                  }}
                />

                {/* Floating Pedestal / Album Art */}
                <div className="relative mt-8 z-20 flex flex-col items-center">
                  <div className="relative w-36 md:w-44 h-36 md:h-44 rounded-lg overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-white/10">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Quick Play Overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySong(album);
                      }}
                      className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Niche Base Plate & Plaque */}
                <div className="z-20 text-center pb-2">
                  <h3 className="text-xs md:text-sm font-semibold tracking-wider text-white line-clamp-1">
                    {album.title}
                  </h3>
                  <p className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono mt-0.5">
                    {album.artist} &bull; {album.year}
                  </p>
                </div>
              </div>

              {/* Glossy Floor Reflection Effect */}
              <div
                className="w-44 md:w-56 h-28 floor-reflection overflow-hidden pointer-events-none mt-1"
                style={{
                  transform: 'scaleY(-1)',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)',
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-start opacity-40 blur-[1px]">
                  <img
                    src={album.coverUrl}
                    alt=""
                    className="w-32 md:w-40 h-32 md:h-40 object-cover rounded-md"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wet Glossy Floor Gradient Base */}
      <div className="w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-2" />
    </div>
  );
};
