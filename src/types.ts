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
  // Security fields
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isExecutable?: boolean;
  isCamouflaged?: boolean;
  quarantined?: boolean;
  authorized?: boolean;
  securityWarning?: string;
  headerInspection?: HeaderInspectionResult;
  staticAnalysis?: StaticAnalysisResult;
  threatIntelligence?: ThreatIntelligenceResult;
  quarantineRecord?: QuarantineRecord;
}

export interface HeaderInspectionResult {
  inspected: boolean;
  matchedSignature: string;
  detectedMime: string;
  isExecutable: boolean;
  isArchive?: boolean;
  isCamouflaged: boolean;
  camouflageWarning?: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StaticAnalysisTrigger {
  category: string;
  rule: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StaticAnalysisResult {
  scanned: boolean;
  sha256?: string;
  threatScore: number;
  riskRating: 'CLEAN' | 'LOW' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
  triggers: StaticAnalysisTrigger[];
  summary: string;
}

export interface ThreatIntelligenceEngine {
  name: string;
  result: string;
  category: string;
}

export interface ThreatIntelligenceResult {
  sha256: string;
  scannedAt: string;
  source: string;
  positives: number;
  totalEngines: number;
  detectionRate: string;
  status: 'CLEAN' | 'MALICIOUS' | 'SUSPICIOUS';
  threatName?: string;
  engines: ThreatIntelligenceEngine[];
}

export interface QuarantineRecord {
  id: string;
  originalFilename: string;
  vaultFilename: string;
  vaultPath: string;
  fileSize: number;
  quarantinedAt: string;
  sha256: string;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatScore: number;
  triggers?: StaticAnalysisTrigger[];
  sourceUrl?: string;
  isExecutable: boolean;
  restored: boolean;
  restoredAt?: string;
  restoredPath?: string;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  level: string;
  eventType: string;
  details: any;
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
  status: 'unchecked' | 'checking' | 'online' | 'offline' | 'blocked';
  selected: boolean;
  packageGroup: string;
  segments: number;
  autoExtract: boolean;
  expectedChecksum?: string;
  checksumType?: 'sha256' | 'md5';
  error?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  isExecutable?: boolean;
  quarantined?: boolean;
  securityWarning?: string;
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
  disableLanPeerDiscovery: boolean;
  quarantineExecutables: boolean;
}

export interface TorrentFile {
  id: number;
  name: string;
  length: number;
  path: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  isExecutable?: boolean;
  quarantined?: boolean;
}

export interface TorrentItem {
  infoHash: string;
  magnetURI: string;
  name: string;
  size: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  peers: number;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  isExecutable?: boolean;
  quarantined?: boolean;
  files?: TorrentFile[];
  pieces?: { index: number; priority: 'high' | 'normal'; downloaded: boolean }[];
}

export interface SecurityCheckResult {
  name: string;
  category: string;
  passed: boolean;
  detail: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityAuditReport {
  success: boolean;
  safeForRealDownloading: boolean;
  auditScore: number;
  checks: SecurityCheckResult[];
  durationMs: number;
  auditedAt: string;
}
