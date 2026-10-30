import React, { useEffect, useRef } from 'react';

interface AudioEngineProps {
  isPlaying: boolean;
  accentColor: string;
  width?: number;
  height?: number;
  numBars?: number;
}

export const AudioVisualizer: React.FC<AudioEngineProps> = ({
  isPlaying,
  accentColor,
  width = 340,
  height = 50,
  numBars = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef<number>(isPlaying ? 1.0 : 0.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      // Gentle spring/lerp interpolation so synthesizer levels rise & fall gracefully
      const targetLevel = isPlaying ? 1.0 : 0.0;
      levelRef.current += (targetLevel - levelRef.current) * 0.065;
      const level = levelRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        // Continuous wave physics scaled by gentle rising/falling level
        const wave1 = Math.sin(i * 0.2 + step * 0.07) * 0.5 + 0.5;
        const wave2 = Math.cos(i * 0.15 - step * 0.04) * 0.5 + 0.5;
        const bassBoost = i < 14 ? Math.sin(step * 0.1) * 12 + 14 : 0;

        const dynamicHeight = (wave1 * wave2 * (canvas.height * 0.72) + bassBoost) * level;
        const barHeight = Math.max(3, dynamicHeight + 2 * (1 - level));

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, accentColor || '#ffffff');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.04)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = level > 0.1 ? accentColor : 'transparent';
        ctx.shadowBlur = Math.round(12 * level);

        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      step++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, accentColor, numBars]);

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
