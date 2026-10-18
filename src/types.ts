export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  downloaded: number;
  total: number;
  percent: number;
  state: 'waiting' | 'downloading' | 'paused' | 'retrying' | 'finished' | 'failed';
  retries: number;
  speed?: number;
}

export type DownloadStatus =
  | 'idle'
  | 'connecting'
  | 'downloading'
  | 'paused'
  | 'assembling'
  | 'verifying'
  | 'extracting'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  saveDir: string;
  size: number;
  downloadedBytes: number;
  percent: number;
  status: DownloadStatus;
  segments: number;
  chunks: ChunkInfo[];
  speedBytesPerSec: number;
  speedLimitKbps?: number;
  etaSeconds: number;
  host: string;
  contentType?: string;
  acceptRanges: boolean;
  expectedChecksum?: {
    algorithm: 'sha256' | 'md5';
    hash: string;
  };
  checksums?: {
    md5: string;
    sha256: string;
  };
  verified?: boolean;
  verificationError?: string | null;
  autoExtract?: boolean;
  extracted?: boolean;
  extractPath?: string;
  addedAt: number;
  completedAt?: number;
  error?: string;
}

export interface StagedLink {
  id: string;
  rawUrl: string;
  url: string;
  filename: string;
  size: number;
  host: string;
  contentType?: string;
  acceptRanges: boolean;
  status: 'unchecked' | 'checking' | 'online' | 'offline';
  selected: boolean;
  packageGroup: string;
  segments: number;
  autoExtract: boolean;
  expectedChecksum?: string;
  checksumType?: 'sha256' | 'md5';
  error?: string;
}

export interface SpeedSample {
  timestamp: number;
  speed: number;
}

export interface AppSettings {
  defaultSegments: number;
  globalSpeedLimitKbps: number;
  defaultSaveDir: string;
  autoExtractArchives: boolean;
  maxConcurrentDownloads: number;
  autoStartAfterGrab: boolean;
}
