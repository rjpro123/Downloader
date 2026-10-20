import React, { useState } from 'react';
import {
  Download,
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
    { label: 'Uncapped', value: 0 },
    { label: '500 KB/s', value: 500 },
    { label: '1.0 MB/s', value: 1024 },
    { label: '2.5 MB/s', value: 2560 },
    { label: '5.0 MB/s', value: 5120 },
    { label: '10.0 MB/s', value: 10240 },
    { label: '25.0 MB/s', value: 25600 },
    { label: '50.0 MB/s', value: 51200 }
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
    <header className="bg-[#0b0f19]/90 border-b border-[#212631] sticky top-0 z-30 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-[#212631]">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#2ea043]/10 border border-[#2ea043]/30 flex items-center justify-center text-[#2ea043]">
            <Download className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              Downloader Pro
            </span>
            <span className="text-[10px] text-[#8b949e] bg-[#161b22] border border-[#30363d] px-2 py-0.5 rounded-full font-medium">
              {isDesktop ? 'Desktop' : 'Web Client'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'downloads'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Downloads</span>
            {downloadsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#212631] text-white rounded-full">
                {downloadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('torrents')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'torrents'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Torrents</span>
            {torrentsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#212631] text-white rounded-full">
                {torrentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('linkgrabber')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'linkgrabber'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Link Grabber</span>
            {linkGrabberCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#212631] text-white rounded-full">
                {linkGrabberCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'security'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Vault</span>
            {quarantinedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                {quarantinedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'source'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Desktop Source</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all shrink-0 font-medium ${
              activeTab === 'settings'
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40'
                : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Speed Throttle Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#c9d1d9] bg-[#161b22] border border-[#30363d] rounded-md hover:border-[#8b949e] transition-colors"
            >
              <Gauge className="w-3.5 h-3.5 text-[#8b949e]" />
              <span>
                {speedLimitKbps > 0 ? `Limit: ${formatBytes(speedLimitKbps * 1024)}/s` : 'Speed: Uncapped'}
              </span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#8b949e] border-b border-[#212631]">
                  Speed Governor
                </div>
                {speedPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      onSetSpeedLimit(preset.value);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#212631] flex items-center justify-between transition-colors ${
                      speedLimitKbps === preset.value
                        ? 'text-[#58a6ff] font-medium'
                        : 'text-[#c9d1d9]'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {speedLimitKbps === preset.value && <span className="text-[#58a6ff]">✓</span>}
                  </button>
                ))}

                <div className="p-2 border-t border-[#212631] bg-[#0d1117]">
                  <form onSubmit={handleApplyCustomSpeed} className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(e.target.value)}
                      placeholder="KB/s limit..."
                      className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1f6feb]"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[#2ea043] text-white font-medium rounded text-xs hover:bg-[#2c974b]"
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
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#2ea043] hover:bg-[#2c974b] rounded-md transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Download</span>
          </button>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs bg-[#0d1117] border-b border-[#212631] text-[#8b949e]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#6e7681]">Speed:</span>
            <span className="text-white font-semibold tabular-nums">
              {formatSpeed(globalSpeed)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6e7681]">Active Threads:</span>
            <span className="text-[#c9d1d9] tabular-nums font-medium">
              {activeConnections}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6e7681]">Transferred:</span>
            <span className="text-white tabular-nums font-medium">
              {formatBytes(totalDownloaded)} / {formatBytes(totalSize)}
            </span>
            {totalSize > 0 && (
              <span className="text-[#58a6ff] font-medium">({queuePercent}%)</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#212631] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors text-xs font-medium"
          >
            <Play className="w-3 h-3 text-[#2ea043]" />
            <span>Start All</span>
          </button>

          <button
            onClick={onPauseAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#212631] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors text-xs font-medium"
          >
            <Pause className="w-3 h-3 text-amber-400" />
            <span>Pause All</span>
          </button>
        </div>
      </div>
    </header>
  );
};
