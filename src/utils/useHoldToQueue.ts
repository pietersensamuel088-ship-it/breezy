import { useState, useRef, useCallback } from 'react';
import { Song } from '../types';

interface UseHoldToQueueProps {
  onQueue: (song: Song) => void;
  onClick: (song: Song) => void;
  onHover?: (song: Song) => void;
  holdDurationMs?: number;
}

export function useHoldToQueue({
  onQueue,
  onClick,
  onHover,
  holdDurationMs = 3000,
}: UseHoldToQueueProps) {
  const [holdingSongId, setHoldingSongId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef<boolean>(false);
  const currentSongRef = useRef<Song | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setHoldingSongId(null);
    setHoldProgress(0);
    currentSongRef.current = null;
    startPosRef.current = null;
  }, []);

  const startHold = useCallback(
    (e: React.PointerEvent, song: Song) => {
      // Only primary mouse button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      cleanup();
      triggeredRef.current = false;
      currentSongRef.current = song;
      setHoldingSongId(song.id);
      setHoldProgress(0);

      startTimeRef.current = performance.now();
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const updateProgress = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const progress = Math.min(1, elapsed / holdDurationMs);
        setHoldProgress(progress);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateProgress);

      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        onQueue(song);
        cleanup();
      }, holdDurationMs);
    },
    [holdDurationMs, onQueue, cleanup]
  );

  const endHold = useCallback(
    (e: React.PointerEvent, song: Song) => {
      const elapsed = performance.now() - startTimeRef.current;
      const wasTriggered = triggeredRef.current;

      cleanup();

      // If released quickly without triggering hold-to-queue, treat as normal play click!
      if (!wasTriggered && elapsed < 350) {
        onClick(song);
      }
    },
    [cleanup, onClick]
  );

  const cancelHold = useCallback(
    (e: React.PointerEvent) => {
      if (startPosRef.current) {
        const dist = Math.hypot(
          e.clientX - startPosRef.current.x,
          e.clientY - startPosRef.current.y
        );
        // Only cancel if dragged more than 12px
        if (dist > 12) {
          cleanup();
        }
      }
    },
    [cleanup]
  );

  return {
    holdingSongId,
    holdProgress,
    bindHold: (song: Song) => ({
      onMouseEnter: () => onHover?.(song),
      onPointerDown: (e: React.PointerEvent) => startHold(e, song),
      onPointerUp: (e: React.PointerEvent) => endHold(e, song),
      onPointerLeave: () => cleanup(),
      onPointerCancel: () => cleanup(),
      onPointerMove: (e: React.PointerEvent) => cancelHold(e),
    }),
  };
}
