import React, { useEffect, useRef } from 'react';

interface AudioEngineProps {
  isPlaying: boolean;
  accentColor: string;
}

export const AudioVisualizer: React.FC<AudioEngineProps> = ({ isPlaying, accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        // Generate dynamic organic wave movement reacting to play state
        let barHeight = 6;
        if (isPlaying) {
          const wave1 = Math.sin((i * 0.2) + (step * 0.08)) * 0.5 + 0.5;
          const wave2 = Math.cos((i * 0.15) - (step * 0.05)) * 0.5 + 0.5;
          const bassBoost = (i < 12) ? Math.sin(step * 0.12) * 12 + 14 : 0;
          barHeight = Math.max(6, (wave1 * wave2 * 38) + bassBoost);
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = isPlaying ? accentColor : 'transparent';
        ctx.shadowBlur = isPlaying ? 10 : 0;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      step++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, accentColor]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={340}
        height={50}
        className="opacity-90 transition-opacity duration-300"
      />
    </div>
  );
};
