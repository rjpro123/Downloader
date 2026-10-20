import React, { useState } from 'react';
import {
  Terminal,
  HardDrive,
  Settings,
  FileCode,
  Play,
  Pause,
  Plus,
  Gauge,
  Activity,
  Magnet,
  ShieldCheck
} from 'lucide-react';
import { formatSpeed, formatBytes } from '../utils/formatters';

export type TabType = 'downloads' | 'torrents' | 'linkgrabber' | 'security' | 'settings' | 'source';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  downloadsCount: number;
  torrentsCount: number;
  linkGrabberCount: number;
  quarantinedCount: number;
  globalSpeed: number;
  totalDownloaded: number;
  totalSize: number;
  activeConnections: number;
  speedLimitKbps: number;
  onSetSpeedLimit: (limitKbps: number) => void;
  onStartAll: () => void;
  onPauseAll: () => void;
  onOpenAddModal: () => void;
  isDesktop: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  downloadsCount,
  torrentsCount,
  linkGrabberCount,
  quarantinedCount,
  globalSpeed,
  totalDownloaded,
  totalSize,
  activeConnections,
  speedLimitKbps,
  onSetSpeedLimit,
  onStartAll,
  onPauseAll,
  onOpenAddModal,
  isDesktop
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [customSpeed, setCustomSpeed] = useState('');
  const queuePercent = totalSize > 0 ? Math.round((totalDownloaded / totalSize) * 100) : 0;

  const speedPresets = [
    { label: 'OVERCLOCK [UNCAPPED]', value: 0 },
    { label: 'CLAMP: 500 KB/s', value: 500 },
    { label: 'CLAMP: 1.0 MB/s', value: 1024 },
    { label: 'CLAMP: 2.5 MB/s', value: 2560 },
    { label: 'CLAMP: 5.0 MB/s', value: 5120 },
    { label: 'CLAMP: 10.0 MB/s', value: 10240 },
    { label: 'CLAMP: 25.0 MB/s', value: 25600 },
    { label: 'CLAMP: 50.0 MB/s', value: 51200 }
  ];

  const handleApplyCustomSpeed = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customSpeed, 10);
    if (!isNaN(val) && val >= 0) {
      onSetSpeedLimit(val);
      setShowSpeedMenu(false);
      setCustomSpeed('');
    }
  };

  return (
    <header className="bg-[#040906]/95 border-b border-emerald-950 sticky top-0 z-30 font-mono backdrop-blur-md">
      {/* Top Bar Matrix Contract */}
      <div className="flex items-center justify-between gap-4 px-6 py-2.5 border-b border-emerald-900/40">
        {/* Zone 1: Terminal Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded border border-emerald-500/40 bg-emerald-950/60 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-emerald-300">
              DOWNLOADER_PRO
            </span>
            <span className="text-[10px] text-emerald-500/80 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
              {isDesktop ? 'DESKTOP_IPC' : 'KERNEL.v2.4'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'downloads'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>[DOWNLOADS]</span>
            {downloadsCount > 0 && (
              <span className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded">
                {downloadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('torrents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'torrents'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <Magnet className="w-3.5 h-3.5 text-emerald-400" />
            <span>[TORRENTS]</span>
            {torrentsCount > 0 && (
              <span className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded">
                {torrentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('linkgrabber')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'linkgrabber'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>[LINK_GRABBER]</span>
            {linkGrabberCount > 0 && (
              <span className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded">
                {linkGrabberCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'security'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>[SECURITY_AUDIT]</span>
            {quarantinedCount > 0 && (
              <span className="px-1 text-[10px] bg-amber-900/80 text-amber-300 border border-amber-700/60 rounded animate-pulse">
                {quarantinedCount} LOCK
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'source'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>[ELECTRON]</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>[CONFIG]</span>
          </button>
        </nav>

        {/* Zone 3: Throttle Selector & Add Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Rate Limiter */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-emerald-300 bg-[#06120b] border border-emerald-800/80 rounded hover:border-emerald-500/60 transition-colors"
              title="Matrix Bandwidth Throttle"
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {speedLimitKbps > 0 ? `GOV: ${formatBytes(speedLimitKbps * 1024)}/s` : 'UNLIMITED SPEED'}
              </span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#040a06] border border-emerald-700/80 rounded shadow-2xl py-1 z-50 text-xs font-mono">
                <div className="px-3 py-1 text-[10px] text-emerald-600 uppercase border-b border-emerald-950 font-bold">
                  // SET SPEED LIMIT (TOKEN BUCKET)
                </div>
                {speedPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      onSetSpeedLimit(preset.value);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-emerald-950 flex items-center justify-between transition-colors ${
                      speedLimitKbps === preset.value
                        ? 'text-emerald-300 bg-emerald-950/70 font-semibold'
                        : 'text-emerald-400/80'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {speedLimitKbps === preset.value && <span className="text-emerald-400">[*]</span>}
                  </button>
                ))}

                {/* Custom Input */}
                <div className="p-2 border-t border-emerald-950 bg-[#020503]">
                  <form onSubmit={handleApplyCustomSpeed} className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(e.target.value)}
                      placeholder="Custom KB/s..."
                      className="w-full bg-[#040906] border border-emerald-900 rounded px-2 py-1 text-[11px] text-emerald-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-emerald-500 text-black font-bold rounded text-[11px] hover:bg-emerald-400"
                    >
                      Set
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ ADD DOWNLOAD</span>
          </button>
        </div>
      </div>

      {/* Telemetry Sub-Bar */}
      <div className="px-6 py-1.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono bg-[#020503] border-b border-emerald-950 text-emerald-500/80">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; CURRENT SPEED:</span>
            <span className="text-emerald-300 font-bold tabular-nums">
              {formatSpeed(globalSpeed)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; CHUNK THREADS:</span>
            <span className="text-emerald-400 tabular-nums">
              {String(activeConnections).padStart(2, '0')} ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; QUEUE HARVEST:</span>
            <span className="text-emerald-300 tabular-nums">
              {formatBytes(totalDownloaded)} / {formatBytes(totalSize)}
            </span>
            {totalSize > 0 && (
              <span className="text-emerald-500 font-bold">[{queuePercent}%]</span>
            )}
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStartAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#07170e] hover:bg-[#0c2617] border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 transition-colors text-[11px]"
            title="Resume all active downloads"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>START ALL</span>
          </button>

          <button
            onClick={onPauseAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#07170e] hover:bg-[#0c2617] border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 transition-colors text-[11px]"
            title="Pause all active downloads"
          >
            <Pause className="w-3 h-3 text-amber-400" />
            <span>PAUSE ALL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
