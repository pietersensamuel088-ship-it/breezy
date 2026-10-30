import React, { useEffect, useRef } from 'react';

interface AudioEngineProps {
  isPlaying: boolean;
  accentColor: string;
  width?: number;
  height?: number;
  numBars?: number;
  audioElement?: HTMLAudioElement | null;
}

export const AudioVisualizer: React.FC<AudioEngineProps> = ({
  isPlaying,
  accentColor,
  width = 340,
  height = 50,
  numBars = 48,
  audioElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;
    let currentLevel = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only animate if audio is ACTUALLY playing and not paused
      const isActuallyPlaying = isPlaying && audioElement && !audioElement.paused && audioElement.currentTime > 0;
      const targetLevel = isActuallyPlaying ? 1.0 : 0.0;
      currentLevel += (targetLevel - currentLevel) * 0.1;

      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 2; // Flat subtle line when paused/buffering

        if (currentLevel > 0.05) {
          // Dynamic frequency waves simulating real audio spectrum
          const freq1 = Math.sin(i * 0.25 + step * 0.09) * 0.5 + 0.5;
          const freq2 = Math.cos(i * 0.18 - step * 0.06) * 0.5 + 0.5;
          const bass = i < 14 ? Math.sin(step * 0.12) * 16 + 18 : 0;
          const mids = i >= 14 && i < 32 ? Math.cos(step * 0.08 + i * 0.2) * 10 + 12 : 0;

          const dynamicH = (freq1 * freq2 * (canvas.height * 0.7) + bass + mids) * currentLevel;
          barHeight = Math.max(2, Math.min(canvas.height - 2, dynamicH));
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, accentColor || '#ffffff');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = currentLevel > 0.2 ? accentColor : 'transparent';
        ctx.shadowBlur = Math.round(10 * currentLevel);

        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      if (currentLevel > 0.01) {
        step++;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, accentColor, numBars, audioElement]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="opacity-95 transition-opacity duration-500"
      />
    </div>
  );
};
