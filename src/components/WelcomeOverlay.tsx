import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Music2 } from 'lucide-react';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onComplete: (username: string) => void;
}

export function WelcomeOverlay({ isOpen, onComplete }: WelcomeOverlayProps) {
  const [stage, setStage] = useState<'input' | 'writing' | 'fading'>('input');
  const [username, setUsername] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStage('input');
      setUsername('');
      setDisplayedText('');
      // Auto focus input
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cursive handwriting typing & stroke reveal effect
  useEffect(() => {
    if (stage === 'writing') {
      const fullText = username.trim() ? `Welcome, ${username.trim()}` : 'Welcome';
      let index = 0;
      setDisplayedText('');

      const interval = setInterval(() => {
        index++;
        setDisplayedText(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(interval);
          // Pause to admire the glowing cursive handwriting like Apple setup
          setTimeout(() => {
            setStage('fading');
            setTimeout(() => {
              onComplete(username.trim() || 'Guest');
            }, 750);
          }, 1400);
        }
      }, 70); // Smooth fluid handwriting speed

      return () => clearInterval(interval);
    }
  }, [stage, username, onComplete]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setStage('writing');
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#040507] transition-all duration-700 ${
        stage === 'fading' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* STAGE 1: SIGN IN PROMPT */}
      {stage === 'input' && (
        <div className="relative z-10 w-full max-w-md mx-4 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col items-center text-center animate-fadeIn">
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
            <Music2 className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl md:text-2xl font-unbounded font-black tracking-tight text-white mb-2">
            BREEZY STUDIO
          </h2>
          <p className="text-xs text-zinc-400 font-sans mb-8">
            Master Audio Stream &bull; Enter your name to sign in
          </p>

          <form onSubmit={handleSignIn} className="w-full flex flex-col items-center gap-4">
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username..."
                className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/15 focus:border-white text-sm font-sans text-white placeholder-zinc-500 focus:outline-hidden transition-all duration-300 text-center shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="group w-full py-3.5 px-6 rounded-2xl bg-white text-black font-semibold text-xs tracking-wider uppercase font-mono flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
              Press Enter ↵ to enter exhibition
            </span>
          </form>
        </div>
      )}

      {/* STAGE 2: APPLE-STYLE CURSIVE HANDWRITING WRITE-OUT */}
      {(stage === 'writing' || stage === 'fading') && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 select-none">
          {/* Glowing Cursive Text */}
          <div className="relative">
            <h1
              className="font-cursive text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-wide transition-all duration-300"
              style={{
                textShadow:
                  '0 0 20px rgba(255,255,255,0.95), 0 0 45px rgba(255,255,255,0.7), 0 0 90px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.8))',
              }}
            >
              {displayedText}
              {stage === 'writing' && (
                <span className="inline-block w-1.5 h-12 sm:h-16 md:h-20 bg-white ml-2 align-middle animate-pulse rounded-full shadow-[0_0_15px_#ffffff]" />
              )}
            </h1>
          </div>

          <p className="mt-8 text-xs font-mono tracking-[0.3em] uppercase text-zinc-400 opacity-80 animate-pulse">
            // INITIALIZING HIGH FIDELITY AUDIO STAGE
          </p>
        </div>
      )}
    </div>
  );
}
