import React from 'react';
import { ChunkInfo } from '../types';
import { formatBytes } from '../utils/formatters';

interface SegmentVisualizerProps {
  chunks: ChunkInfo[];
  totalSize: number;
}

export const SegmentVisualizer: React.FC<SegmentVisualizerProps> = ({ chunks, totalSize }) => {
  if (!chunks || chunks.length === 0) {
    return (
      <div className="py-2 text-xs text-emerald-700 font-mono">
        &gt; SOCKET_SINGLE_STREAM: Range headers bypassed or unhandled by remote host
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 font-mono">
      <div className="flex items-center justify-between text-xs text-emerald-500/80">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-xs bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
          <span className="text-emerald-300 font-bold">&gt; PARALLEL_SOCKET_ALLOCATION [{chunks.length} WORKERS]</span>
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-xs bg-emerald-400"></span> [STREAMING]
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-xs bg-emerald-500/30"></span> [LOCKED]
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-xs bg-amber-400"></span> [RETRY]
          </span>
        </div>
      </div>

      {/* Aggregate segment visualizer ribbon (Terminal Memory Ribbon) */}
      <div className="h-6 w-full bg-[#020503] border border-emerald-900 rounded-xs overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
        {chunks.map((chunk) => {
          const widthPercent = totalSize > 0 ? (chunk.total / totalSize) * 100 : 100 / chunks.length;
          return (
            <div
              key={chunk.index}
              style={{ width: `${widthPercent}%` }}
              className="relative h-full bg-[#050f09] rounded-xs overflow-hidden group cursor-pointer border-r border-[#030a05]"
              title={`SOCKET_${String(chunk.index).padStart(2, '0')}: ${formatBytes(chunk.downloaded)}/${formatBytes(chunk.total)} (${chunk.percent}%) [${chunk.state.toUpperCase()}]`}
            >
              {/* Fill indicator */}
              <div
                style={{ width: `${chunk.percent}%` }}
                className={`h-full transition-all duration-300 ${
                  chunk.state === 'finished'
                    ? 'bg-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                    : chunk.state === 'retrying'
                    ? 'bg-amber-500 animate-pulse'
                    : chunk.state === 'downloading'
                    ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
                    : 'bg-emerald-950/60'
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-emerald-200/90 font-bold select-none pointer-events-none drop-shadow">
                S{chunk.index}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid of detailed chunk indicators (Memory Blocks) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {chunks.map((chunk) => {
          const hexStart = `0x${chunk.start.toString(16).toUpperCase().padStart(6, '0')}`;
          const hexEnd = `0x${chunk.end.toString(16).toUpperCase().padStart(6, '0')}`;

          return (
            <div
              key={chunk.index}
              className="p-2 rounded bg-[#030906] border border-emerald-950 hover:border-emerald-800 text-[10px] font-mono flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center justify-between text-emerald-600">
                <span className="font-bold text-emerald-300">SOCK_{String(chunk.index).padStart(2, '0')}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded uppercase font-semibold ${
                  chunk.state === 'finished' ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/60' :
                  chunk.state === 'downloading' ? 'text-emerald-300 bg-emerald-900/60 border border-emerald-600/80 animate-pulse' :
                  chunk.state === 'retrying' ? 'text-amber-400 bg-amber-950/80' : 'text-emerald-700'
                }`}>
                  {chunk.state}
                </span>
              </div>

              <div className="my-1.5 h-1.5 w-full bg-[#020503] rounded-xs overflow-hidden border border-emerald-950">
                <div
                  style={{ width: `${chunk.percent}%` }}
                  className={`h-full transition-all duration-300 ${
                    chunk.state === 'finished' ? 'bg-emerald-500/70' :
                    chunk.state === 'retrying' ? 'bg-amber-500' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-emerald-500/80 text-[9px] tabular-nums">
                <span>{chunk.percent}%</span>
                <span>{formatBytes(chunk.downloaded)}</span>
              </div>

              <div className="text-[8px] text-emerald-700/80 mt-1 truncate" title={`${hexStart}..${hexEnd}`}>
                {hexStart.slice(-4)}..{hexEnd.slice(-4)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
