import React, { useState } from 'react';
import { Server, Wifi, Database, Check, ShieldCheck, X } from 'lucide-react';
import { ProxmoxConfig } from '../types';

interface ProxmoxBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProxmoxConfig;
  onUpdateConfig: (config: ProxmoxConfig) => void;
}

export const ProxmoxBridgeModal: React.FC<ProxmoxBridgeModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(config.port.toString());
  const [path, setPath] = useState(config.libraryPath);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      host,
      port: parseInt(port) || 8080,
      libraryPath: path,
      isConnected: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0b0e14] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Proxmox Server Bridge</h3>
              <p className="text-xs text-zinc-400">Custom High-Speed Audio Stream Connector</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-400 block mb-1.5">PROXMOX HOST / IP ADDRESS</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. 192.168.1.150 or proxmox.local"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-hidden focus:border-luxury-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1.5">STREAM PORT</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8080"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-hidden focus:border-luxury-blue"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1.5">LATENCY (LAN)</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-emerald-400 font-mono flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5" />
                ~4ms ultra-low
              </div>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1.5">REMOTE MUSIC FOLDER</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/mnt/storage/music"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-hidden focus:border-luxury-blue"
            />
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-luxury-gold" />
              <span>Direct Chunked Stream Mode</span>
            </div>
            <span className="text-emerald-400 text-[10px] uppercase font-bold">Enabled</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-mono"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-wider flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Connect & Save
          </button>
        </div>
      </div>
    </div>
  );
};
