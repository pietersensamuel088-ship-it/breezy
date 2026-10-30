import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';
import { GitHubCommitInfo } from '../utils/githubUpdater';

interface UpdateNotificationBannerProps {
  hasUpdate: boolean;
  latestCommit: GitHubCommitInfo | null;
  onDismiss: () => void;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      pullUpdate: () => Promise<{ success: boolean; output?: string; error?: string }>;
      autoUpdateAndRestart: () => Promise<{ success: boolean; output?: string; error?: string }>;
    };
  }
}

export function UpdateNotificationBanner({
  hasUpdate,
  latestCommit,
  onDismiss,
}: UpdateNotificationBannerProps) {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!hasUpdate) return null;

  const handle1ClickUpdate = async () => {
    setIsUpdating(true);
    setStatusMessage('Pulling newest version from GitHub...');

    try {
      if (window.electronAPI?.autoUpdateAndRestart) {
        // Native Electron Desktop Mode: Pulls and restarts with 0 commands!
        const res = await window.electronAPI.autoUpdateAndRestart();
        if (!res.success) {
          setStatusMessage('Refreshing...');
          window.location.reload();
        }
      } else {
        // Web / Standalone Browser Mode: Reloads with cache bust
        setStatusMessage('Applying update...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xl px-4 animate-slide-up">
      <div className="relative p-4 rounded-2xl bg-[#0b0e14]/95 border border-blue-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between gap-4">
        {/* Glow */}
        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg pointer-events-none" />

        <div className="relative flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                NEW UPDATE AVAILABLE
              </span>
              {latestCommit?.shortSha && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10 text-zinc-300">
                  #{latestCommit.shortSha}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-200 font-sans truncate mt-0.5 font-medium">
              {statusMessage || latestCommit?.message || 'A new version of Breezy is ready to install.'}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 shrink-0">
          <button
            onClick={handle1ClickUpdate}
            disabled={isUpdating}
            className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 hover:bg-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update App'}</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateNotificationBanner;
