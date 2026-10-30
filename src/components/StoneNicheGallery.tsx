import React, { useRef, useState, useEffect } from 'react';
import { Album } from '../types';
import { Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface StoneNicheGalleryProps {
  albums: Album[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onPlayAlbum: (album: Album) => void;
  isPlaying: boolean;
}

export const StoneNicheGallery: React.FC<StoneNicheGalleryProps> = ({
  albums,
  selectedIndex,
  onSelectIndex,
  onPlayAlbum,
  isPlaying,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const selectedAlbum = albums[selectedIndex] || albums[0];

  // Mouse wheel horizontal cylinder rotation
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 20 && selectedIndex < albums.length - 1) {
        onSelectIndex(selectedIndex + 1);
      } else if (e.deltaX < -20 && selectedIndex > 0) {
        onSelectIndex(selectedIndex - 1);
      }
    } else {
      if (e.deltaY > 30 && selectedIndex < albums.length - 1) {
        onSelectIndex(selectedIndex + 1);
      } else if (e.deltaY < -30 && selectedIndex > 0) {
        onSelectIndex(selectedIndex - 1);
      }
    }
  };

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50 && selectedIndex < albums.length - 1) {
      onSelectIndex(selectedIndex + 1);
    } else if (diff < -50 && selectedIndex > 0) {
      onSelectIndex(selectedIndex - 1);
    }
    setTouchStart(null);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-[460px] md:min-h-[520px] flex flex-col items-center justify-center pt-4 pb-8 select-none overflow-visible"
    >
      {/* Dynamic Fluid Atmospheric Aura */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] rounded-full blur-[140px] opacity-30 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: selectedAlbum.accentColor }}
      />

      {/* 3D CYLINDER STAGE */}
      <div className="relative w-full max-w-6xl h-[380px] md:h-[440px] cylinder-stage flex items-center justify-center">
        {/* Navigation arrow buttons - elegant & minimal */}
        <button
          onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
          className="absolute left-6 md:left-12 z-40 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white disabled:opacity-0 transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSelectIndex(Math.min(albums.length - 1, selectedIndex + 1))}
          disabled={selectedIndex === albums.length - 1}
          className="absolute right-6 md:right-12 z-40 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white disabled:opacity-0 transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* The Cylindrical Carousel Items */}
        <div className="relative w-full h-full flex items-center justify-center">
          {albums.map((album, index) => {
            const offset = index - selectedIndex;
            const isCenter = offset === 0;

            // Mathematical 3D Cylindrical coordinates
            const rotateY = offset * -26; // Curves inward along the cylinder
            const translateX = offset * 260; // Spacing along the circumference
            const translateZ = -Math.abs(offset) * 110; // Pushes distant cards deeper into the cylinder
            const scale = Math.max(0.7, 1 - Math.abs(offset) * 0.16);
            const opacity = Math.abs(offset) > 2 ? 0 : Math.max(0.2, 1 - Math.abs(offset) * 0.38);

            return (
              <div
                key={album.id}
                onClick={() => onSelectIndex(index)}
                className="absolute cylinder-item cursor-pointer flex flex-col items-center"
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: 30 - Math.abs(offset),
                  pointerEvents: Math.abs(offset) > 2 ? 'none' : 'auto',
                }}
              >
                {/* Curved Organic Stone Alcove Frame */}
                <div
                  className={`relative w-56 md:w-68 h-80 md:h-96 curved-stone-niche flex flex-col items-center justify-between p-5 overflow-hidden transition-all duration-700 ${
                    isCenter ? 'border-white/25 ring-1 ring-white/20' : 'border-white/5'
                  }`}
                  style={{
                    boxShadow: isCenter
                      ? `0 30px 80px -20px ${album.accentColor}50, inset 0 20px 40px rgba(0,0,0,0.95)`
                      : 'inset 0 20px 40px rgba(0,0,0,0.95)',
                  }}
                >
                  {/* Overhead Spotlight (Only intense on center item) */}
                  <div
                    className="spotlight-source transition-all duration-700"
                    style={{
                      boxShadow: isCenter
                        ? `0 0 35px 8px #ffffff, 0 0 70px 24px ${album.accentColor}`
                        : '0 0 10px 2px rgba(255,255,255,0.2)',
                    }}
                  />

                  <div
                    className="spotlight-cone transition-opacity duration-700"
                    style={{
                      opacity: isCenter ? 1 : 0.25,
                      background: `radial-gradient(ellipse at 50% 0%, ${
                        isCenter ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.1)'
                      } 0%, rgba(255, 255, 255, 0.08) 50%, transparent 80%)`,
                    }}
                  />

                  {/* Artwork Showcase on Floating Pedestal */}
                  <div className="relative mt-7 z-20 flex flex-col items-center group">
                    <div className="relative w-44 md:w-54 h-44 md:h-54 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-white/10">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />

                      {/* Play Button Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayAlbum(album);
                        }}
                        className="absolute inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform transition-transform hover:scale-110 active:scale-95">
                          <Play className="w-6 h-6 fill-black ml-1" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Album Plate */}
                  <div className="z-20 text-center pb-2">
                    <h3 className="text-sm md:text-base font-display font-bold tracking-tight text-white line-clamp-1">
                      {album.title}
                    </h3>
                    <p className="text-[11px] tracking-widest text-zinc-400 uppercase font-mono mt-0.5">
                      {album.artist} &bull; {album.year}
                    </p>
                  </div>
                </div>

                {/* Cylindrical Inverted Floor Reflection */}
                <div
                  className="w-56 md:w-68 h-28 reflection-surface overflow-hidden pointer-events-none mt-2"
                >
                  <div className="w-full h-full flex flex-col items-center justify-start opacity-35 blur-[1.5px]">
                    <img
                      src={album.coverUrl}
                      alt=""
                      className="w-40 md:w-48 h-40 md:h-48 object-cover rounded-xl"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle Cylinder Navigation Dots */}
      <div className="flex items-center gap-2 mt-4 z-20">
        {albums.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelectIndex(i)}
            className={`transition-all duration-300 rounded-full ${
              selectedIndex === i
                ? 'w-6 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
