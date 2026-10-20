import { StagedLink, DownloadItem } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      parseLinks: (urls: string[]) => Promise<any[]>;
      readClipboard: () => Promise<string[]>;
      openFileDialog: () => Promise<string[]>;
      selectDirectory: () => Promise<string | null>;
      startDownload: (item: any) => Promise<{ success: boolean; id: string }>;
      pauseDownload: (id: string) => Promise<{ success: boolean; id: string }>;
      resumeDownload: (id: string) => Promise<{ success: boolean; id: string }>;
      cancelDownload: (id: string) => Promise<{ success: boolean; id: string }>;
      setSpeedLimit: (limitKbps: number) => Promise<{ success: boolean; limitKbps: number }>;
      verifyChecksum: (filePath: string, algorithm: string, expectedHash: string) => Promise<any>;
      extractArchive: (filePath: string, destDir?: string) => Promise<any>;
      openFolder: (folderPath: string) => Promise<boolean>;
      getSystemInfo: () => Promise<any>;
      onDownloadProgress: (cb: (data: any) => void) => () => void;
      onDownloadStatus: (cb: (data: any) => void) => () => void;
      onDownloadCompleted: (cb: (data: any) => void) => () => void;
      onDownloadError: (cb: (data: any) => void) => () => void;
      onExtractProgress: (cb: (data: any) => void) => () => void;
    };
  }
}

class UniversalBridge {
  private isElectron: boolean;
  private sseSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

    if (!this.isElectron && typeof window !== 'undefined') {
      this._initSse();
    }
  }

  private _initSse() {
    try {
      this.sseSource = new EventSource('/api/downloads/events');

      const eventTypes = [
        'download:progress',
        'download:status',
        'download:completed',
        'download:error',
        'archive:progress',
        'torrent:progress',
        'torrent:completed',
        'torrent:error',
        'torrent:status',
        'security:alert'
      ];

      eventTypes.forEach((evt) => {
        this.sseSource?.addEventListener(evt, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const subs = this.listeners.get(evt);
            if (subs) {
              subs.forEach((cb) => cb(data));
            }
          } catch (_) {}
        });
      });
    } catch (err) {
      console.warn('Failed to connect to SSE events stream:', err);
    }
  }

  isNativeDesktop(): boolean {
    return this.isElectron;
  }

  async parseLinks(urls: string[]): Promise<any[]> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.parseLinks(urls);
    }
    const res = await fetch('/api/linkgrabber/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    const data = await res.json();
    return data.items || data.links || [];
  }

  async readClipboard(): Promise<string[]> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.readClipboard();
    }
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const matches = text.match(/(https?:\/\/[^\s]+|magnet:\?[^\s]+)/g) || [];
        return Array.from(new Set(matches));
      }
    } catch (_) {}
    return [];
  }

  async openFileDialog(): Promise<string[]> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.openFileDialog();
    }
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.urls,.lst,.dlc';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve([]);
        const text = await file.text();
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.startsWith('http://') || l.startsWith('https://') || l.startsWith('magnet:?'));
        resolve(lines);
      };
      input.click();
    });
  }

  async selectDirectory(): Promise<string | null> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.selectDirectory();
    }
    return '~/Downloads/DownloaderPro';
  }

  async startDownload(item: Partial<DownloadItem>): Promise<{ success: boolean; id: string; error?: string }> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.startDownload(item);
    }
    const res = await fetch('/api/downloads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  }

  async getDownloads(): Promise<DownloadItem[]> {
    try {
      const res = await fetch('/api/downloads/list');
      const data = await res.json();
      return data.downloads || [];
    } catch (_) {
      return [];
    }
  }

  async pauseDownload(id: string): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.pauseDownload(id);
    }
    const res = await fetch(`/api/downloads/${id}/pause`, { method: 'POST' });
    return res.json();
  }

  async resumeDownload(id: string): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.resumeDownload(id);
    }
    const res = await fetch(`/api/downloads/${id}/resume`, { method: 'POST' });
    return res.json();
  }

  async cancelDownload(id: string): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.cancelDownload(id);
    }
    const res = await fetch(`/api/downloads/${id}/cancel`, { method: 'POST' });
    return res.json();
  }

  async setSpeedLimit(limitKbps: number): Promise<{ success: boolean; limitKbps: number }> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.setSpeedLimit(limitKbps);
    }
    const res = await fetch('/api/downloads/speed-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitKbps })
    });
    return res.json();
  }

  async setDownloadSpeedLimit(id: string, limitKbps: number): Promise<any> {
    const res = await fetch(`/api/downloads/${id}/speed-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitKbps })
    });
    return res.json();
  }

  async verifyChecksum(filePath: string, algorithm = 'sha256', expectedHash = '', id?: string): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.verifyChecksum(filePath, algorithm, expectedHash);
    }
    const res = await fetch('/api/checksum/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, algorithm, expectedHash, id })
    });
    return res.json();
  }

  async extractArchive(filePath: string, destDir?: string, id?: string): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.extractArchive(filePath, destDir);
    }
    const res = await fetch('/api/archive/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, destDir, id })
    });
    return res.json();
  }

  async openFolder(folderPath: string): Promise<boolean> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.openFolder(folderPath);
    }
    return true;
  }

  async getSystemInfo(): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.getSystemInfo();
    }
    const res = await fetch('/api/system/info');
    return res.json();
  }

  async getTestFiles(): Promise<any[]> {
    try {
      const res = await fetch('/api/test-files');
      const data = await res.json();
      return data.files || [];
    } catch (_) {
      return [];
    }
  }

  // --- Security Methods ---
  async runSecurityAudit(): Promise<any> {
    const res = await fetch('/api/security/audit', { method: 'POST' });
    return res.json();
  }

  async getSecurityPolicy(): Promise<any> {
    const res = await fetch('/api/security/policy');
    return res.json();
  }

  async updateSecurityPolicy(policy: any): Promise<any> {
    const res = await fetch('/api/security/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
    return res.json();
  }

  async authorizeDownload(id: string): Promise<any> {
    const res = await fetch('/api/security/authorize-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return res.json();
  }

  async authorizeTorrent(infoHash: string): Promise<any> {
    const res = await fetch('/api/security/authorize-torrent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ infoHash })
    });
    return res.json();
  }

  // --- Multi-Layered Security Pipeline Methods ---
  async getSecurityLogs(limit = 120): Promise<any[]> {
    try {
      const res = await fetch(`/api/security/logs?limit=${limit}`);
      const data = await res.json();
      return data.logs || [];
    } catch (_) {
      return [];
    }
  }

  async clearSecurityLogs(): Promise<any> {
    const res = await fetch('/api/security/logs/clear', { method: 'POST' });
    return res.json();
  }

  async getQuarantineVault(): Promise<any[]> {
    try {
      const res = await fetch('/api/security/quarantine/vault');
      const data = await res.json();
      return data.vault || [];
    } catch (_) {
      return [];
    }
  }

  async restoreFromQuarantine(quarantineId: string, destinationDir?: string): Promise<any> {
    const res = await fetch('/api/security/quarantine/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarantineId, destinationDir })
    });
    return res.json();
  }

  async deleteQuarantinedFile(quarantineId: string): Promise<any> {
    const res = await fetch('/api/security/quarantine/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarantineId })
    });
    return res.json();
  }

  async cleanupQuarantineVault(olderThanDays = 30): Promise<any> {
    const res = await fetch('/api/security/quarantine/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ olderThanDays })
    });
    return res.json();
  }

  async scanFileOnDemand(id?: string, filePath?: string): Promise<any> {
    const res = await fetch('/api/security/scan-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, filePath })
    });
    return res.json();
  }

  async queryThreatIntelligence(hash: string, filename?: string): Promise<any> {
    const res = await fetch('/api/security/threat-intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash, filename })
    });
    return res.json();
  }

  async openFile(id?: string, filePath?: string): Promise<any> {
    const res = await fetch('/api/file/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, filePath })
    });
    return res.json();
  }

  onSecurityAlert(callback: (data: any) => void): () => void {
    return this._subscribe('security:alert', callback);
  }

  // --- Torrent Methods ---
  async addTorrent(magnetURI: string): Promise<any> {
    const res = await fetch('/api/torrents/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ magnetURI })
    });
    return res.json();
  }

  async getTorrents(): Promise<any[]> {
    try {
      const res = await fetch('/api/torrents/list');
      const data = await res.json();
      return data.torrents || [];
    } catch (_) {
      return [];
    }
  }

  async pauseTorrent(infoHash: string): Promise<any> {
    const res = await fetch(`/api/torrents/${infoHash}/pause`, { method: 'POST' });
    return res.json();
  }

  async resumeTorrent(infoHash: string): Promise<any> {
    const res = await fetch(`/api/torrents/${infoHash}/resume`, { method: 'POST' });
    return res.json();
  }

  async removeTorrent(infoHash: string, deleteFiles = false): Promise<any> {
    const res = await fetch(`/api/torrents/${infoHash}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteFiles })
    });
    return res.json();
  }

  onTorrentProgress(callback: (data: any) => void): () => void {
    return this._subscribe('torrent:progress', callback);
  }

  onTorrentCompleted(callback: (data: any) => void): () => void {
    return this._subscribe('torrent:completed', callback);
  }

  onTorrentStatus(callback: (data: any) => void): () => void {
    return this._subscribe('torrent:status', callback);
  }

  // Event subscriptions
  onDownloadProgress(callback: (data: any) => void): () => void {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.onDownloadProgress(callback);
    }
    return this._subscribe('download:progress', callback);
  }

  onDownloadStatus(callback: (data: any) => void): () => void {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.onDownloadStatus(callback);
    }
    return this._subscribe('download:status', callback);
  }

  onDownloadCompleted(callback: (data: any) => void): () => void {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.onDownloadCompleted(callback);
    }
    return this._subscribe('download:completed', callback);
  }

  onDownloadError(callback: (data: any) => void): () => void {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.onDownloadError(callback);
    }
    return this._subscribe('download:error', callback);
  }

  private _subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
}

export const bridge = new UniversalBridge();
