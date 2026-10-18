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
        'torrent:error'
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
    return data.items || [];
  }

  async readClipboard(): Promise<string[]> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.readClipboard();
    }
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const matches = text.match(/(https?:\/\/[^\s]+)/g) || [];
        return Array.from(new Set(matches));
      }
    } catch (_) {}
    return [];
  }

  async openFileDialog(): Promise<string[]> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.openFileDialog();
    }
    // Web fallback: Prompt file input
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
          .filter((l) => l.startsWith('http://') || l.startsWith('https://'));
        resolve(lines);
      };
      input.click();
    });
  }

  async selectDirectory(): Promise<string | null> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.selectDirectory();
    }
    // In web environment, mock folder selection path
    const folder = prompt('Enter destination directory path:', '~/Downloads/DownloaderPro');
    return folder;
  }

  async startDownload(item: Partial<DownloadItem>): Promise<{ success: boolean; id: string }> {
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

  async verifyChecksum(filePath: string, algorithm: string, expectedHash: string): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.verifyChecksum(filePath, algorithm, expectedHash);
    }
    const res = await fetch('/api/checksum/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, algorithm, expectedHash })
    });
    return res.json();
  }

  async extractArchive(filePath: string, destDir?: string): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.extractArchive(filePath, destDir);
    }
    const res = await fetch('/api/archive/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, destDir })
    });
    return res.json();
  }

  async openFolder(folderPath: string): Promise<boolean> {
    if (this.isElectron && window.electronAPI) {
      return window.electronAPI.openFolder(folderPath);
    }
    alert(`Destination folder: ${folderPath}`);
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
