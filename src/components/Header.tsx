import React, { useState } from 'react';
import { Terminal, HardDrive, Settings, FileCode, Play, Pause, Plus, Gauge, Activity } from 'lucide-react';
import { formatSpeed, formatBytes } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'downloads' | 'linkgrabber' | 'settings' | 'source';
  setActiveTab: (tab: 'downloads' | 'linkgrabber' | 'settings' | 'source') => void;
  downloadsCount: number;
  linkGrabberCount: number;
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
  linkGrabberCount,
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
  const queuePercent = totalSize > 0 ? Math.round((totalDownloaded / totalSize) * 100) : 0;

  const speedPresets = [
    { label: 'OVERCLOCK [UNCAPPED]', value: 0 },
    { label: 'CLAMP: 500 KB/s', value: 500 },
    { label: 'CLAMP: 1.0 MB/s', value: 1024 },
    { label: 'CLAMP: 5.0 MB/s', value: 5120 },
    { label: 'CLAMP: 10.0 MB/s', value: 10240 },
    { label: 'CLAMP: 25.0 MB/s', value: 25600 }
  ];

  return (
    <header className="bg-[#040906]/95 border-b border-emerald-950 sticky top-0 z-30 font-mono backdrop-blur-md">
      {/* Top Bar Matrix Contract */}
      <div className="flex items-center justify-between gap-6 px-6 py-2.5 border-b border-emerald-900/40">
        {/* Zone 1: Terminal Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded border border-emerald-500/40 bg-emerald-950/60 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-emerald-300 matrix-glow">
              &gt;_ CONDUIT_PRO // BITSTREAM_DAEMON
            </span>
            <span className="text-[10px] text-emerald-500/80 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
              {isDesktop ? 'DESKTOP_IPC' : 'KERNEL.v2.4'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Matrix Terminal Style) */}
        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
              activeTab === 'downloads'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>[BIT_PIPELINE]</span>
            {downloadsCount > 0 && (
              <span className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded">
                {downloadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('linkgrabber')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
              activeTab === 'linkgrabber'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>[SIGNAL_INTERCEPTOR]</span>
            {linkGrabberCount > 0 && (
              <span className="px-1 text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded">
                {linkGrabberCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
              activeTab === 'source'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>[BYTECODE_KERNEL]</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
                : 'text-emerald-500/70 border-transparent hover:text-emerald-300 hover:border-emerald-900/60 hover:bg-emerald-950/30'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>[DAEMON_CONFIG]</span>
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
                {speedLimitKbps > 0 ? `GOV: ${formatBytes(speedLimitKbps * 1024)}/s` : 'OVERCLOCK'}
              </span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#040a06] border border-emerald-700/80 rounded shadow-2xl py-1 z-50 text-xs font-mono">
                <div className="px-3 py-1 text-[10px] text-emerald-600 uppercase border-b border-emerald-950 font-bold">
                  // BANDWIDTH_GOVERNOR_LEVEL
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
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ INGEST_TARGETS</span>
          </button>
        </div>
      </div>

      {/* Terminal Telemetry Sub-Bar */}
      <div className="px-6 py-1.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono bg-[#020503] border-b border-emerald-950 text-emerald-500/80">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; BITSTREAM_THROUGHPUT:</span>
            <span className="text-emerald-300 font-bold tabular-nums matrix-glow">
              {formatSpeed(globalSpeed)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; ACTIVE_SOCKETS:</span>
            <span className="text-emerald-400 tabular-nums">
              {String(activeConnections).padStart(2, '0')} CHUNKS_ENGAGED
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700">&gt; PAYLOAD_SINK:</span>
            <span className="text-emerald-300 tabular-nums">
              {formatBytes(totalDownloaded)} / {formatBytes(totalSize)}
            </span>
            {totalSize > 0 && (
              <span className="text-emerald-500 font-bold">[{queuePercent}% HARVESTED]</span>
            )}
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStartAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#07170e] hover:bg-[#0c2617] border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 transition-colors text-[11px]"
            title="Resume all active sockets"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>IGNITE_ALL</span>
          </button>

          <button
            onClick={onPauseAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#07170e] hover:bg-[#0c2617] border border-emerald-800/80 text-emerald-300 hover:text-emerald-200 transition-colors text-[11px]"
            title="Pause all background threads"
          >
            <Pause className="w-3 h-3 text-amber-400" />
            <span>FREEZE_ALL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
