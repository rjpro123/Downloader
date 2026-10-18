import React, { useState } from 'react';
import {
  DownloadItem,
  SpeedSample
} from '../types';
import {
  formatBytes,
  formatSpeed,
  formatEta,
  getFileExtension
} from '../utils/formatters';
import {
  Play,
  Pause,
  Trash2,
  RotateCw,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Archive,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Terminal
} from 'lucide-react';
import { SpeedGraph } from './SpeedGraph';
import { SegmentVisualizer } from './SegmentVisualizer';

interface DownloadsViewProps {
  downloads: DownloadItem[];
  speedSamples: SpeedSample[];
  globalSpeed: number;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFolder: (folderPath: string) => void;
  onOpenChecksum: (item: DownloadItem) => void;
  onOpenAddModal: () => void;
  onLoadSamples: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  speedSamples,
  globalSpeed,
  onPlay,
  onPause,
  onRetry,
  onDelete,
  onOpenFolder,
  onOpenChecksum,
  onOpenAddModal,
  onLoadSamples
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate overall metrics
  const totalBytes = downloads.reduce((acc, d) => acc + (d.size || 0), 0);
  const downloadedBytes = downloads.reduce((acc, d) => acc + (d.downloadedBytes || 0), 0);
  const totalPercent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
  const activeCount = downloads.filter((d) => d.status === 'downloading' || d.status === 'connecting').length;
  const completedCount = downloads.filter((d) => d.status === 'completed').length;

  const filteredDownloads = downloads.filter((item) => {
    if (statusFilter === 'active') {
      if (item.status !== 'downloading' && item.status !== 'connecting') return false;
    } else if (statusFilter === 'completed') {
      if (item.status !== 'completed') return false;
    } else if (statusFilter === 'paused') {
      if (item.status !== 'paused') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.filename.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (item: DownloadItem) => {
    switch (item.status) {
      case 'downloading':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
            [EXTRACTING: {item.segments}x_SOCKETS]
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <Clock className="w-3 h-3 animate-spin text-emerald-400" />
            [SYN_ACK_PROBING]
          </span>
        );
      case 'assembling':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-mono">
            <Layers className="w-3 h-3 animate-bounce" />
            [SPLICING_BYTE_STRIPES]
          </span>
        );
      case 'verifying':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            [BITWISE_AUDIT_SHA256]
          </span>
        );
      case 'extracting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
            <Archive className="w-3 h-3 animate-pulse" />
            [UNPACKING_CONTAINER]
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            [HARVEST_COMPLETE]
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-mono">
            <Pause className="w-3 h-3" />
            [CONDUIT_FROZEN]
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            [SOCKET_ABORT]
          </span>
        );
      default:
        return <span className="text-xs text-emerald-700 font-mono">[{item.status.toUpperCase()}]</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono">
      {/* Top Section: Live Transfer Speed & Global Progress Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Speed Chart */}
        <div className="lg:col-span-1">
          <SpeedGraph samples={speedSamples} currentSpeed={globalSpeed} />
        </div>

        {/* Global Progress Panel */}
        <div className="lg:col-span-2 bg-[#050e09]/90 border border-emerald-900/80 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-500/80 font-bold">&gt; QUEUE_STREAM_BUFFER</span>
            <span className="text-emerald-300 tabular-nums">
              {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)} [{totalPercent}%]
            </span>
          </div>

          <div className="my-2 h-2.5 w-full bg-[#020503] rounded-xs overflow-hidden border border-emerald-950 p-0.5">
            <div
              style={{ width: `${totalPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-[#00ff66] transition-all duration-300 rounded-xs shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-600">
            <span>&gt; PROC_STATS: {activeCount} RUNNING · {completedCount} FINISHED · {downloads.length} TOTAL</span>
            <span className="text-emerald-400">&gt; HTTP/1.1_RANGE_CHUNKS [READY]</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Terminal Flag Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#040a06] border border-emerald-900/80 p-2.5 rounded">
        {/* Flag Selectors */}
        <div className="flex items-center gap-1 p-1 bg-[#020503] rounded border border-emerald-950 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              statusFilter === 'all'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            --all [{downloads.length}]
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            --active [{activeCount}]
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              statusFilter === 'completed'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            --completed [{completedCount}]
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              statusFilter === 'paused'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-emerald-600 hover:text-emerald-300'
            }`}
          >
            --halted
          </button>
        </div>

        {/* Grep search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="grep -i [file | host]..."
            className="w-full bg-[#020503] border border-emerald-950 rounded pl-8 pr-3 py-1.5 text-xs text-emerald-200 placeholder-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Downloads List / Table */}
      {filteredDownloads.length === 0 ? (
        <div className="border border-dashed border-emerald-900/60 rounded p-12 text-center bg-[#030805]">
          <div className="w-12 h-12 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-emerald-300 mb-1">&gt; PIPELINE_QUIESCENT // 0_PAYLOADS_IN_TRANSIT</h3>
          <p className="text-xs text-emerald-600 max-w-md mx-auto mb-5">
            // Transmission buffer idle. Inject endpoint URIs, intercept clipboard memory, or deploy synthetic benchmark bitstreams.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              + INGEST_NEW_TARGETS
            </button>
            <button
              onClick={onLoadSamples}
              className="px-4 py-2 text-xs text-emerald-300 bg-[#06130b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
            >
              $ IGNITE_SYNTHETIC_BENCHMARKS
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDownloads.map((item) => {
            const isExpanded = expandedId === item.id;
            const ext = getFileExtension(item.filename);

            return (
              <div
                key={item.id}
                className="bg-[#040b07] border border-emerald-950 hover:border-emerald-800/80 rounded overflow-hidden transition-all"
              >
                {/* Main Row */}
                <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Expand toggle, extension badge, filename & host */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-0.5 text-emerald-600 hover:text-emerald-300 p-0.5 rounded transition-colors"
                      title="Inspect memory sockets"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-[10px] font-bold border border-emerald-700/80 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)] shrink-0">
                      {ext.substring(0, 3)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-200 truncate" title={item.filename}>
                          {item.filename}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400/90 bg-[#020503] px-1.5 py-0.2 rounded border border-emerald-900/60">
                          {item.host}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-emerald-600 mt-1">
                        <span>{formatBytes(item.downloadedBytes)} / {formatBytes(item.size)}</span>
                        <span>·</span>
                        <span className="text-emerald-400">{item.percent}%</span>
                        {item.status === 'downloading' && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-300 font-bold matrix-glow">{formatSpeed(item.speedBytesPerSec)}</span>
                            <span>·</span>
                            <span>ETA {formatEta(item.etaSeconds)}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>[{item.segments}_SOCKETS]</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Progress Bar and Status */}
                  <div className="w-full md:w-56 shrink-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs mb-1">
                      {getStatusBadge(item)}
                      <span className="text-xs text-emerald-400 tabular-nums font-bold">{item.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#020503] rounded-xs overflow-hidden border border-emerald-950">
                      <div
                        style={{ width: `${item.percent}%` }}
                        className={`h-full transition-all duration-300 rounded-xs ${
                          item.status === 'completed'
                            ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                            : item.status === 'error'
                            ? 'bg-rose-500'
                            : item.status === 'paused'
                            ? 'bg-emerald-900'
                            : 'bg-gradient-to-r from-emerald-600 to-[#00ff66] shadow-[0_0_8px_#10b981]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Right: Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {item.status === 'downloading' || item.status === 'connecting' ? (
                      <button
                        onClick={() => onPause(item.id)}
                        className="p-1.5 rounded bg-[#061209] hover:bg-[#0c2415] text-amber-400 border border-emerald-900 transition-colors"
                        title="Halt Download"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : item.status === 'paused' || item.status === 'idle' ? (
                      <button
                        onClick={() => onPlay(item.id)}
                        className="p-1.5 rounded bg-[#061209] hover:bg-[#0c2415] text-emerald-400 border border-emerald-900 transition-colors shadow-[0_0_6px_rgba(16,185,129,0.2)]"
                        title="Resume Sockets"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : item.status === 'error' ? (
                      <button
                        onClick={() => onRetry(item.id)}
                        className="p-1.5 rounded bg-[#061209] hover:bg-[#0c2415] text-emerald-400 border border-emerald-900 transition-colors"
                        title="Re-execute Sockets"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    {/* Verify Checksum button */}
                    <button
                      onClick={() => onOpenChecksum(item)}
                      className="p-1.5 rounded bg-[#061209] hover:bg-[#0c2415] text-emerald-300 border border-emerald-900 transition-colors"
                      title="Inspect SHA-256 / MD5 Hash"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </button>

                    {/* Open folder button */}
                    <button
                      onClick={() => onOpenFolder(item.saveDir)}
                      className="p-1.5 rounded bg-[#061209] hover:bg-[#0c2415] text-emerald-600 hover:text-emerald-300 border border-emerald-900 transition-colors"
                      title="Inspect Destination Target"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded bg-[#061209] hover:bg-rose-950/80 text-emerald-800 hover:text-rose-400 border border-emerald-950 transition-colors"
                      title="Purge Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details: SegmentVisualizer and Checksums */}
                {isExpanded && (
                  <div className="border-t border-emerald-950 bg-[#020603] p-4 space-y-4">
                    {/* Multi-segment chunk connection visualizer */}
                    <SegmentVisualizer chunks={item.chunks || []} totalSize={item.size} />

                    {/* Technical metadata drawer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono text-emerald-600 border-t border-emerald-950">
                      <div>
                        <span className="text-emerald-700 block text-[9px] font-bold">&gt; SOURCE_ENDPOINT</span>
                        <span className="text-emerald-300 truncate block text-[10px]" title={item.url}>
                          {item.url}
                        </span>
                      </div>

                      <div>
                        <span className="text-emerald-700 block text-[9px] font-bold">&gt; DISK_DESTINATION</span>
                        <span className="text-emerald-300 truncate block text-[10px]" title={`${item.saveDir}/${item.filename}`}>
                          {item.saveDir}/{item.filename}
                        </span>
                      </div>

                      <div>
                        <span className="text-emerald-700 block text-[9px] font-bold">&gt; INTEGRITY_DIGEST (SHA256)</span>
                        <span className="text-emerald-300 truncate block text-[10px]">
                          {item.checksums?.sha256 ? item.checksums.sha256.substring(0, 24) + '...' : 'Awaiting assembly...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
