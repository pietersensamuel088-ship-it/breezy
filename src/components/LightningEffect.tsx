import React, { useEffect, useRef } from 'react';

interface LightningEffectProps {
  active: boolean;
  onComplete?: () => void;
  trackTitle?: string;
}

export const LightningEffect: React.FC<LightningEffectProps> = ({
  active,
  onComplete,
  trackTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;
    let completed = false;
    const startTime = performance.now();
    const duration = 450; // ms

    // Safety timeout: ensure effect ends and resets in 500ms max
    const timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onCompleteRef.current?.();
      }
    }, 500);

    // Generate random branched lightning bolt points
    interface Point {
      x: number;
      y: number;
    }

    interface Bolt {
      points: Point[];
      branches: Point[][];
    }

    const startX = Math.random() * (canvas.width * 0.3) + canvas.width * 0.1;
    const startY = 0;
    const endX = Math.random() * (canvas.width * 0.4) + canvas.width * 0.5;
    const endY = canvas.height;

    function createLightningSegment(
      p1: Point,
      p2: Point,
      displace: number,
      minDisplace = 5
    ): Point[] {
      if (displace < minDisplace) {
        return [p1, p2];
      }
      const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * displace;
      const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * (displace * 0.6);
      const mid: Point = { x: midX, y: midY };

      const left = createLightningSegment(p1, mid, displace / 2, minDisplace);
      const right = createLightningSegment(mid, p2, displace / 2, minDisplace);

      return left.slice(0, left.length - 1).concat(right);
    }

    const mainPoints = createLightningSegment(
      { x: startX, y: startY },
      { x: endX, y: endY },
      canvas.width * 0.18,
      12
    );

    // Create 3-4 subtle branches
    const branches: Point[][] = [];
    for (let i = 0; i < 4; i++) {
      const branchIdx = Math.floor(Math.random() * (mainPoints.length - 10)) + 5;
      const origin = mainPoints[branchIdx];
      const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
      const length = Math.random() * 180 + 80;
      const target: Point = {
        x: origin.x + Math.sin(angle) * length + (Math.random() - 0.5) * 50,
        y: origin.y + Math.cos(angle) * length,
      };
      branches.push(createLightningSegment(origin, target, 35, 8));
    }

    const bolt: Bolt = { points: mainPoints, branches };

    const render = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (progress < 1) {
        // Opacity envelope: quick flash, then smooth fade
        let opacity = 0;
        if (progress < 0.15) {
          opacity = progress / 0.15;
        } else {
          opacity = Math.pow(1 - (progress - 0.15) / 0.85, 2);
        }

        // Draw ambient screen glow (subtle, luxury dark mode)
        const glowGrad = ctx.createRadialGradient(
          (startX + endX) / 2,
          canvas.height * 0.4,
          20,
          (startX + endX) / 2,
          canvas.height * 0.4,
          canvas.width * 0.6
        );
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${0.12 * opacity})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw lightning bolt path helper
        const drawPath = (points: Point[], lineWidth: number, color: string, blur: number) => {
          if (points.length < 2) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = blur;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.restore();
        };

        // Outer soft cyan glow
        drawPath(bolt.points, 4.5, `rgba(56, 189, 248, ${0.45 * opacity})`, 18);

        // Core bright ice-blue beam
        drawPath(bolt.points, 1.8, `rgba(224, 242, 254, ${0.9 * opacity})`, 8);

        // Branches
        for (const branch of bolt.branches) {
          drawPath(branch, 2.5, `rgba(96, 165, 250, ${0.35 * opacity})`, 10);
          drawPath(branch, 1.0, `rgba(255, 255, 255, ${0.75 * opacity})`, 4);
        }

        animationFrameId = requestAnimationFrame(render);
      } else {
        if (!completed) {
          completed = true;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onCompleteRef.current?.();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-start pt-16">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
      />

      {/* Sleek Toast Pill */}
      {trackTitle && (
        <div className="relative z-10 px-5 py-2.5 rounded-2xl bg-black/80 border border-cyan-400/40 shadow-[0_10px_35px_rgba(56,189,248,0.35)] backdrop-blur-xl flex items-center gap-3 animate-slide-up">
          <div className="w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide">
              Added to Queue
            </span>
            <span className="text-[11px] font-mono text-cyan-300 truncate max-w-xs">
              {trackTitle} &bull; Pre-downloading master
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
