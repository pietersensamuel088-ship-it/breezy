import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle, ExternalLink, X, FolderCheck, HardDrive, Music } from 'lucide-react';

interface MusicDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicDownloaderModal: React.FC<MusicDownloaderModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nicotine' | 'web' | 'proxmox'>('nicotine');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-luxury-blue/20 border border-luxury-blue/40 flex items-center justify-center text-luxury-blue">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-wide">
                Music Acquisition & Studio Masters
              </h3>
              <p className="text-xs text-zinc-400">
                How to download Chris Brown, Drake & all your favorite tracks in bit-perfect FLAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 text-xs font-mono">
          <button
            onClick={() => setActiveTab('nicotine')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all ${
              activeTab === 'nicotine'
                ? 'border-luxury-blue text-white bg-white/5 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Nicotine+ (Installed on PC)
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all ${
              activeTab === 'web'
                ? 'border-luxury-blue text-white bg-white/5 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Instant Web Ripper
          </button>
          <button
            onClick={() => setActiveTab('proxmox')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all ${
              activeTab === 'proxmox'
                ? 'border-luxury-blue text-white bg-white/5 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Proxmox Server Sync
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4 text-sm text-zinc-300">
          {activeTab === 'nicotine' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Nicotine+ is ready on your PC!</p>
                  <p className="text-xs text-blue-200/80 mt-1">
                    Installed in <code className="bg-black/30 px-1 py-0.5 rounded">C:\Program Files\Nicotine+\Nicotine+.exe</code>
                  </p>
                </div>
              </div>

              <h4 className="text-white font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-luxury-gold" />
                How to get full Discographies in 3 steps:
              </h4>

              <ol className="list-decimal list-inside space-y-3 pl-2 text-xs text-zinc-300 leading-relaxed font-sans">
                <li>
                  <strong className="text-white">Launch Nicotine+</strong> from your Start Menu or desktop.
                </li>
                <li>
                  Go to the <strong className="text-white">Search tab</strong> and type:
                  <div className="my-1.5 flex flex-wrap gap-2">
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-luxury-gold">
                      Chris Brown FLAC
                    </span>
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-luxury-gold">
                      Drake Discography FLAC
                    </span>
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md font-mono text-[11px] text-luxury-gold">
                      Chris Brown 11:11 2023
                    </span>
                  </div>
                </li>
                <li>
                  Right-click the album folder and choose <strong className="text-white">Download Folder</strong>. 
                  It downloads all tracks with high-res album covers, lyric tags, and studio quality.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'web' && (
            <div className="space-y-4">
              <p>
                Don't want to use peer-to-peer? You can copy any Spotify or Apple Music album link and paste it into a web ripper to get studio FLACs immediately:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="https://doubledouble.top"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-luxury-blue transition-colors">
                        DoubleDouble
                      </span>
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Paste a Spotify, Deezer, or Qobuz link &bull; Direct download FLAC/MP3 studio files.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-3 font-mono">Recommended &bull; Fast</span>
                </a>

                <a
                  href="https://lucida.to"
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-luxury-blue transition-colors">
                        Lucida
                      </span>
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Lossless streaming ripper with multi-service support (Tidal, Apple Music, Qobuz).
                    </p>
                  </div>
                  <span className="text-[10px] text-blue-400 mt-3 font-mono">High Quality FLAC</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'proxmox' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <p>
                Once you have your downloaded albums, you will simply place them into your Proxmox server music share:
              </p>
              <div className="p-3 bg-black/40 rounded-xl font-mono text-[11px] text-zinc-400 border border-white/5 space-y-1">
                <div>📁 /mnt/storage/music/</div>
                <div className="pl-4">├── 📁 Chris Brown/</div>
                <div className="pl-8">├── 📁 [2022] BREEZY (Deluxe) [FLAC]/</div>
                <div className="pl-8">└── 📁 [2023] 11-11 [FLAC]/</div>
                <div className="pl-4">└── 📁 Drake/</div>
                <div className="pl-8">├── 📁 [2021] Certified Lover Boy [FLAC]/</div>
                <div className="pl-8">└── 📁 [2022] Her Loss [FLAC]/</div>
              </div>
              <p className="text-zinc-400">
                The Breezy backend automatically detects new albums instantly and makes them streamable to your PC.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs tracking-wider hover:bg-zinc-200 transition-colors"
          >
            Got it, Let's Listen
          </button>
        </div>
      </div>
    </div>
  );
};
