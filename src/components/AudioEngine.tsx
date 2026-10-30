import React, { useEffect, useRef } from 'react';

interface AudioEngineProps {
  isPlaying: boolean;
  accentColor: string;
  width?: number;
  height?: number;
  numBars?: number;
  audioElement?: HTMLAudioElement | null;
}

// Global WeakMap to prevent "MediaElementAudioSourceNode already connected" error
const audioSourceMap = new WeakMap<HTMLAudioElement, { analyser: AnalyserNode; dataArray: Uint8Array }>();

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

    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (audioElement) {
      try {
        if (audioSourceMap.has(audioElement)) {
          const cached = audioSourceMap.get(audioElement)!;
          analyser = cached.analyser;
          dataArray = cached.dataArray;
        } else {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const source = audioCtx.createMediaElementSource(audioElement);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            audioSourceMap.set(audioElement, { analyser, dataArray });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isActuallyAudible = isPlaying && audioElement && !audioElement.paused && audioElement.currentTime > 0;

      if (analyser && dataArray && isActuallyAudible) {
        analyser.getByteFrequencyData(dataArray as any);
      }

      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 2; // Flat line when silent

        if (isActuallyAudible && dataArray) {
          const rawVal = dataArray[i % dataArray.length] || 0;
          barHeight = Math.max(2, (rawVal / 255) * canvas.height * 0.95);
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, accentColor || '#ffffff');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = isActuallyAudible ? accentColor : 'transparent';
        ctx.shadowBlur = isActuallyAudible ? 10 : 0;

        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, [2, 2, 0, 0]);
        ctx.fill();
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
