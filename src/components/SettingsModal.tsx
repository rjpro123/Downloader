import React from 'react';
import { AppSettings } from '../types';
import { Settings, FolderOpen, Gauge, Layers, Archive, HardDrive, Terminal } from 'lucide-react';
import { bridge } from '../services/electronBridge';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings
}) => {
  const handlePickFolder = async () => {
    const dir = await bridge.selectDirectory();
    if (dir) {
      onUpdateSettings({ defaultSaveDir: dir });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 font-mono">
      <div className="flex items-center gap-3 pb-4 border-b border-emerald-950">
        <div className="w-10 h-10 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-emerald-300">&gt; SYSTEM_CONFIG // RUNTIME_ENGINE_PARAMETERS</h2>
          <p className="text-xs text-emerald-600">// Configure socket concurrency, rate throttles, and disk mount paths</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Parallel Sockets / Segments */}
        <div className="bg-[#040c07] border border-emerald-950 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Layers className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-200">&gt; DEFAULT_PARALLEL_SOCKETS</h3>
              <p className="text-[11px] text-emerald-600">
                Number of simultaneous HTTP Range chunk workers per download (2 to 16). Multi-threading mitigates server-side bandwidth caps.
              </p>
            </div>
          </div>
          <select
            value={settings.defaultSegments}
            onChange={(e) => onUpdateSettings({ defaultSegments: parseInt(e.target.value, 10) })}
            className="bg-[#020503] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-300 focus:outline-none"
          >
            <option value="2">02_SOCKETS [LIGHTWEIGHT]</option>
            <option value="4">04_SOCKETS [STANDARD]</option>
            <option value="8">08_SOCKETS [TURBO_PERFORMANCE]</option>
            <option value="16">16_SOCKETS [MAXIMUM_AGGRESSIVE]</option>
          </select>
        </div>

        {/* Global Speed Limiter */}
        <div className="bg-[#040c07] border border-emerald-950 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Gauge className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-200">&gt; GLOBAL_BANDWIDTH_RATE_THROTTLE</h3>
              <p className="text-[11px] text-emerald-600">
                Token-bucket rate limiter distributed across active streams. Set to 0 for unlimited throughput.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="500"
              value={settings.globalSpeedLimitKbps}
              onChange={(e) => onUpdateSettings({ globalSpeedLimitKbps: parseInt(e.target.value, 10) || 0 })}
              className="w-28 bg-[#020503] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 focus:outline-none"
            />
            <span className="text-xs text-emerald-500">KB/s (0 = OFF)</span>
          </div>
        </div>

        {/* Default Destination Directory */}
        <div className="bg-[#040c07] border border-emerald-950 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-200">&gt; DEFAULT_TARGET_MOUNT_DIRECTORY</h3>
              <p className="text-[11px] text-emerald-600">
                Local filesystem directory where assembled binary payloads are mounted.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-300 bg-[#020503] border border-emerald-950 px-3 py-1.5 rounded max-w-[220px] truncate">
              {settings.defaultSaveDir}
            </span>
            <button
              onClick={handlePickFolder}
              className="px-3 py-1.5 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
            >
              BROWSE
            </button>
          </div>
        </div>

        {/* Auto-Extract Archives */}
        <div className="bg-[#040c07] border border-emerald-950 rounded p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Archive className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-200">&gt; AUTO_EXTRACT_COMPRESSED_PAYLOADS</h3>
              <p className="text-[11px] text-emerald-600">
                Automatically unpack archive blocks (.zip / .rar) immediately following verification.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoExtractArchives}
            onChange={(e) => onUpdateSettings({ autoExtractArchives: e.target.checked })}
            className="w-4 h-4 rounded bg-[#020503] border-emerald-800 text-emerald-500 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Max Concurrent Downloads */}
        <div className="bg-[#040c07] border border-emerald-950 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-200">&gt; MAX_CONCURRENT_QUEUE_PIPELINES</h3>
              <p className="text-[11px] text-emerald-600">
                Number of files concurrently executed in parallel. Excess items queue in standby.
              </p>
            </div>
          </div>
          <select
            value={settings.maxConcurrentDownloads}
            onChange={(e) => onUpdateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
            className="bg-[#020503] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-300 focus:outline-none"
          >
            <option value="1">01_FILE (Sequential)</option>
            <option value="2">02_FILES</option>
            <option value="3">03_FILES (Standard)</option>
            <option value="5">05_FILES</option>
            <option value="10">10_FILES (Gigabit Matrix)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
