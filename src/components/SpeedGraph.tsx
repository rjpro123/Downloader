import React, { useMemo } from 'react';
import { SpeedSample } from '../types';
import { formatSpeed } from '../utils/formatters';

interface SpeedGraphProps {
  samples: SpeedSample[];
  currentSpeed: number;
}

export const SpeedGraph: React.FC<SpeedGraphProps> = ({ samples, currentSpeed }) => {
  const { maxSpeed, pathPoints, areaPath } = useMemo(() => {
    if (!samples || samples.length === 0) {
      return { maxSpeed: 1024 * 1024, pathPoints: '', areaPath: '' };
    }

    const speeds = samples.map((s) => s.speed);
    const max = Math.max(...speeds, currentSpeed, 1024 * 512);

    const width = 300;
    const height = 48;
    const count = samples.length;

    const points = samples.map((s, index) => {
      const x = (index / (count - 1 || 1)) * width;
      const y = height - (s.speed / max) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathPoints = points.join(' ');
    const areaPath = `${points.join(' ')} ${width},${height} 0,${height}`;

    return { maxSpeed: max, pathPoints, areaPath };
  }, [samples, currentSpeed]);

  return (
    <div className="flex items-center gap-4 bg-[#050d08]/90 border border-emerald-900/80 rounded px-3.5 py-2 font-mono relative overflow-hidden">
      {/* Background oscilloscope grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      <div className="flex flex-col text-xs font-mono shrink-0 relative z-10">
        <span className="text-[10px] text-emerald-600 font-bold tracking-wider">&gt; RX_BANDWIDTH</span>
        <span className="text-sm font-bold text-emerald-300 tabular-nums matrix-glow">
          {formatSpeed(currentSpeed)}
        </span>
        <span className="text-[10px] text-emerald-600 tabular-nums">
          MAX_BURST: {formatSpeed(maxSpeed)}
        </span>
      </div>

      <div className="relative w-44 sm:w-56 h-10 overflow-hidden relative z-10">
        <svg
          viewBox="0 0 300 48"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="matrixWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="matrixLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Area fill */}
          {areaPath && (
            <polygon points={areaPath} fill="url(#matrixWaveGradient)" />
          )}

          {/* Line stroke with phosphor glow */}
          {pathPoints && (
            <polyline
              points={pathPoints}
              fill="none"
              stroke="#00ff66"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#matrixLineGlow)"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
