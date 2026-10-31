import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Music2, X } from 'lucide-react';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onComplete: (username: string) => void;
  savedUsername?: string;
}

export function WelcomeOverlay({ isOpen, onComplete, savedUsername }: WelcomeOverlayProps) {
  const [stage, setStage] = useState<'input' | 'writing' | 'fading'>('input');
  const [username, setUsername] = useState<string>(savedUsername || '');
  const [displayedText, setDisplayedText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const hasCompletedRef = useRef(false);

  const finish = (name: string) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setStage('fading');
    setTimeout(() => {
      onCompleteRef.current(name.trim() || 'Guest');
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      hasCompletedRef.current = false;
      const stored = localStorage.getItem('breezy_username');
      if (stored && stored.trim()) {
        setUsername(stored.trim());
        setStage('writing');
      } else {
        setStage('input');
        setUsername('');
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);

  // Cursive handwriting animation with guaranteed termination and safety timeout
  useEffect(() => {
    if (!isOpen || stage !== 'writing') return;

    const isReturning = Boolean(localStorage.getItem('breezy_username'));
    const activeName = (username || localStorage.getItem('breezy_username') || 'Guest').trim();
    const fullText = isReturning ? `Welcome back, ${activeName}` : `Welcome, ${activeName}`;

    let index = 0;
    setDisplayedText('');

    // Safety fallback: if anything stalls, force finish in 2.2 seconds max!
    const safetyTimer = setTimeout(() => {
      finish(activeName);
    }, 2200);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          finish(activeName);
        }, 600);
      }
    }, 45);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [isOpen, stage]);

  // Keyboard shortcut: Esc or Enter instantly dismisses
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeName = (username || localStorage.getItem('breezy_username') || 'Guest').trim();
        finish(activeName);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, username]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = username.trim() || 'Guest';
    try {
      localStorage.setItem('breezy_username', finalName);
    } catch {}
    setUsername(finalName);
    setStage('writing');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={() => {
        if (stage === 'writing') {
          const activeName = (username || localStorage.getItem('breezy_username') || 'Guest').trim();
          finish(activeName);
        }
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#040507] transition-all duration-500 cursor-pointer ${
        stage === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-red-600/10 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-white/[0.04] rounded-full blur-[130px] pointer-events-none" />

      {/* Skip Button in Top Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const activeName = (username || localStorage.getItem('breezy_username') || 'Guest').trim();
          finish(activeName);
        }}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
        title="Skip intro"
      >
        <span>Skip</span>
        <X className="w-3.5 h-3.5" />
      </button>

      {/* STAGE 1: REAL PRODUCTION SIGN IN */}
      {stage === 'input' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md mx-4 p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col items-center text-center animate-fadeIn cursor-default"
        >
          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
            <Music2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-unbounded font-black tracking-tight text-white mb-2">
            BREEZY
          </h2>
          <p className="text-xs text-zinc-400 font-sans mb-8">
            Master Audio Stream &bull; Enter your username to begin
          </p>

          <form onSubmit={handleSignIn} className="w-full flex flex-col items-center gap-4">
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. Pieter)..."
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/15 focus:border-white text-sm font-sans text-white placeholder-zinc-500 focus:outline-hidden transition-all duration-300 text-center shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="group w-full py-4 px-6 rounded-2xl bg-white text-black font-semibold text-xs tracking-wider uppercase font-mono flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer"
            >
              <span>Launch Breezy</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
              Press Enter ↵ to enter your audio library
            </span>
          </form>
        </div>
      )}

      {/* STAGE 2: APPLE-STYLE CURSIVE HANDWRITING WRITE-OUT */}
      {(stage === 'writing' || stage === 'fading') && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 select-none">
          <div className="relative">
            <h1
              className="font-cursive text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-wide transition-all duration-300"
              style={{
                textShadow:
                  '0 0 25px rgba(255,255,255,0.95), 0 0 50px rgba(255,255,255,0.7), 0 0 95px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.85))',
              }}
            >
              {displayedText || 'Welcome to Breezy'}
              {stage === 'writing' && (
                <span className="inline-block w-1.5 h-12 sm:h-16 md:h-20 bg-white ml-2 align-middle animate-pulse rounded-full shadow-[0_0_15px_#ffffff]" />
              )}
            </h1>
          </div>

          <p className="mt-8 text-xs font-mono tracking-[0.3em] uppercase text-zinc-400 opacity-80 animate-pulse">
            // MASTER AUDIO STAGE ONLINE
          </p>
          <span className="mt-3 text-[10px] font-mono text-zinc-600">
            Click anywhere or press Esc to enter
          </span>
        </div>
      )}
    </div>
  );
}

export default WelcomeOverlay;
