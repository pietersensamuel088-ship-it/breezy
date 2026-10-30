import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  LogOut,
  RefreshCw,
  Download,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { checkForGitHubUpdate, CURRENT_COMMIT_SHA, GITHUB_REPO, GitHubCommitInfo } from '../utils/githubUpdater';

interface UserHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onSwitchUser: () => void;
}

export function UserHubModal({ isOpen, onClose, currentUser, onSwitchUser }: UserHubModalProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    latestCommit: GitHubCommitInfo | null;
    error?: string;
  } | null>(null);

  // Check GitHub when modal opens
  useEffect(() => {
    if (isOpen) {
      handleCheckUpdate();
    }
  }, [isOpen]);

  const handleCheckUpdate = async () => {
    setChecking(true);
    const res = await checkForGitHubUpdate();
    setUpdateInfo({
      hasUpdate: res.hasUpdate,
      latestCommit: res.latestCommit,
      error: res.error,
    });
    setChecking(false);
  };

  const handleApplyUpdate = () => {
    // In web/desktop, reloads the application to get newest cache
    window.location.reload();
  };

  const downloadLauncher = () => {
    const launcherScript = `@echo off
title Breezy - Master Audio Launcher
color 0b
echo ========================================================
echo          B R E E Z Y   D E S K T O P   L A U N C H E R
echo ========================================================
echo.
echo [1/3] Checking GitHub for new updates...
git pull origin main
if %errorlevel% neq 0 (
    echo [Notice] Operating in offline mode or git not in PATH.
)
echo.
echo [2/3] Checking dependencies...
call npm install --prefer-offline --no-audit
echo.
echo [3/3] Launching Breezy High-Fidelity Stage...
start "" msedge --app=http://127.0.0.1:5173 --name="Breezy"
call npm run dev
pause
`;
    const blob = new Blob([launcherScript], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Breezy-Launcher.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a0d14]/95 border border-white/10 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-unbounded font-bold text-sm text-white">ACCOUNT & UPDATES</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Breezy Master System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                ACTIVE AUDIOPHILE
              </span>
            </div>
            <h2 className="text-xl font-unbounded font-black text-white mt-0.5">
              {currentUser}
            </h2>
            <p className="text-[11px] font-mono text-zinc-500">24-Bit Lossless Stream Privileges</p>
          </div>

          <button
            onClick={() => {
              onClose();
              onSwitchUser();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Switch User / Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>
        </div>

        {/* GitHub Auto-Updater Section */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-luxury-blue" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                GitHub Auto-Updater
              </span>
            </div>

            <button
              onClick={handleCheckUpdate}
              disabled={checking}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Now'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
            <span>Installed Build:</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white font-bold border border-white/10">
              #{CURRENT_COMMIT_SHA}
            </span>
          </div>

          {updateInfo && (
            <div className="pt-2">
              {updateInfo.hasUpdate ? (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>New GitHub Push Detected (#{updateInfo.latestCommit?.shortSha})</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans italic line-clamp-2">
                    "{updateInfo.latestCommit?.message}"
                  </p>
                  <button
                    onClick={handleApplyUpdate}
                    className="w-full py-2 px-3 rounded-lg bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-md"
                  >
                    Pull & Apply Update Now
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Up to date with GitHub main branch.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Downloadable App Hub */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
              Desktop Download & Auto-Sync
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Download the 1-click Windows Desktop Launcher. It checks GitHub for new pushes on every launch, automatically updates, and opens Breezy in standalone desktop window mode.
          </p>

          <button
            onClick={downloadLauncher}
            className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-mono text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4 text-luxury-gold" />
            <span className="font-semibold">Download Breezy-Launcher.bat</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserHubModal;
