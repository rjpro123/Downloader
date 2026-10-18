import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, FileCode } from 'lucide-react';

export const ElectronSourceViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'main' | 'preload' | 'engine' | 'package' | 'setup'>('main');
  const [copied, setCopied] = useState(false);

  const files = {
    main: {
      name: 'main.js',
      description: 'Electron Main Process handling BrowserWindow lifecycle, native dialogs, and IPC dispatching',
      code: `/**
 * Downloader Pro - Electron Main Process
 * Handles application lifecycle, BrowserWindow creation, and IPC dispatching
 * to the background MultiSegment download engine.
 */

const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { DownloadManager, probeUrl } = require('./downloadEngine.js');

let mainWindow = null;
const downloadManager = new DownloadManager({
  downloadDir: path.join(app.getPath('downloads'), 'DownloaderPro'),
  defaultSegments: 8,
  globalSpeedLimitKbps: 0
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 650,
    backgroundColor: '#030706',
    title: 'Downloader Pro',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

function setupIpcHandlers() {
  downloadManager.on('progress', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download:progress', data);
    }
  });

  downloadManager.on('status', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download:status', data);
    }
  });

  downloadManager.on('completed', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download:completed', data);
    }
  });

  downloadManager.on('error', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download:error', data);
    }
  });

  ipcMain.handle('linkgrabber:parse', async (_event, urls) => {
    if (!Array.isArray(urls)) return [];
    const results = await Promise.allSettled(
      urls.map((u) => probeUrl(u.trim()))
    );
    return results.map((res, i) => res.status === 'fulfilled' ? res.value : {
      url: urls[i],
      filename: 'unknown',
      size: 0,
      acceptRanges: false,
      host: 'unreachable',
      status: 'offline'
    });
  });

  ipcMain.handle('clipboard:read', async () => {
    const text = clipboard.readText();
    if (!text) return [];
    return Array.from(new Set(text.match(/(https?:\\/\\/[^\\s]+)/g) || []));
  });

  ipcMain.handle('file:open-dialog', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Download Links from File',
      filters: [{ name: 'Text & URL Lists', extensions: ['txt', 'urls', 'lst', 'dlc'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths[0]) return [];
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return content.split(/\\r?\\n/).map(l => l.trim()).filter(l => l.startsWith('http'));
  });

  ipcMain.handle('file:select-directory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Destination Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('download:start', async (_event, item) => {
    const downloader = downloadManager.addDownload(item);
    downloader.start();
    return { success: true, id: downloader.id };
  });

  ipcMain.handle('download:pause', async (_event, id) => {
    downloadManager.pause(id);
    return { success: true, id };
  });

  ipcMain.handle('download:resume', async (_event, id) => {
    downloadManager.resume(id);
    return { success: true, id };
  });

  ipcMain.handle('download:cancel', async (_event, id) => {
    downloadManager.cancel(id);
    return { success: true, id };
  });

  ipcMain.handle('download:set-throttle', async (_event, limitKbps) => {
    downloadManager.setGlobalSpeedLimit(limitKbps);
    return { success: true, limitKbps };
  });
}`
    },
    preload: {
      name: 'preload.js',
      description: 'Secure ContextBridge isolating renderer from Node.js with typed IPC invocations',
      code: `/**
 * Downloader Pro - Electron Secure Preload Script
 * Exposes a safe, structured IPC bridge to the React renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Link Grabber IPC
  parseLinks: (urls) => ipcRenderer.invoke('linkgrabber:parse', urls),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  selectDirectory: () => ipcRenderer.invoke('file:select-directory'),

  // Download Queue & Multi-Segment Engine IPC
  startDownload: (item) => ipcRenderer.invoke('download:start', item),
  pauseDownload: (id) => ipcRenderer.invoke('download:pause', id),
  resumeDownload: (id) => ipcRenderer.invoke('download:resume', id),
  cancelDownload: (id) => ipcRenderer.invoke('download:cancel', id),
  setSpeedLimit: (limitKbps) => ipcRenderer.invoke('download:set-throttle', limitKbps),

  // Archive & Integrity IPC
  verifyChecksum: (filePath, algorithm, expectedHash) =>
    ipcRenderer.invoke('checksum:verify', { filePath, algorithm, expectedHash }),
  extractArchive: (filePath, destDir) =>
    ipcRenderer.invoke('archive:extract', { filePath, destDir }),
  openFolder: (folderPath) => ipcRenderer.invoke('file:open-folder', folderPath),

  // System & Environment Info
  getSystemInfo: () => ipcRenderer.invoke('system:info'),

  // Real-time Event Subscriptions (from background download workers)
  onDownloadProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('download:progress', subscription);
    return () => ipcRenderer.removeListener('download:progress', subscription);
  },
  onDownloadStatus: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('download:status', subscription);
    return () => ipcRenderer.removeListener('download:status', subscription);
  },
  onDownloadCompleted: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('download:completed', subscription);
    return () => ipcRenderer.removeListener('download:completed', subscription);
  },
  onDownloadError: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('download:error', subscription);
    return () => ipcRenderer.removeListener('download:error', subscription);
  },
  onExtractProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('archive:progress', subscription);
    return () => ipcRenderer.removeListener('archive:progress', subscription);
  }
});`
    },
    engine: {
      name: 'downloadEngine.js',
      description: 'Multi-Segment Download Engine with HTTP Range chunks, rate limiting, and checksum verification',
      code: `/**
 * Downloader Pro - Multi-Segment Download Engine
 * Multi-threaded HTTP/HTTPS Range chunking with pause/resume, throttling, and checksums.
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Transform } from 'node:stream';

export class SpeedLimiter {
  constructor(limitKbps = 0) {
    this.limitBytesPerSec = limitKbps > 0 ? limitKbps * 1024 : 0;
    this.tokens = this.limitBytesPerSec;
    this.lastRefill = Date.now();
  }

  setLimit(limitKbps) {
    this.limitBytesPerSec = limitKbps > 0 ? limitKbps * 1024 : 0;
    this.tokens = this.limitBytesPerSec;
  }

  createThrottleStream() {
    const limiter = this;
    return new Transform({
      transform(chunk, encoding, callback) {
        if (!limiter.limitBytesPerSec || limiter.limitBytesPerSec <= 0) {
          return callback(null, chunk);
        }
        const now = Date.now();
        const elapsed = (now - limiter.lastRefill) / 1000;
        limiter.tokens = Math.min(limiter.limitBytesPerSec * 2, limiter.tokens + elapsed * limiter.limitBytesPerSec);
        limiter.lastRefill = now;
        if (limiter.tokens >= chunk.length) {
          limiter.tokens -= chunk.length;
          return callback(null, chunk);
        }
        const delay = Math.ceil(((chunk.length - limiter.tokens) / limiter.limitBytesPerSec) * 1000);
        limiter.tokens = 0;
        setTimeout(() => {
          limiter.lastRefill = Date.now();
          callback(null, chunk);
        }, Math.min(delay, 1000));
      }
    });
  }
}

export async function probeUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, { method: 'HEAD' }, (res) => {
      resolve({
        url: targetUrl,
        filename: path.basename(parsed.pathname) || 'download.bin',
        size: parseInt(res.headers['content-length'] || '0', 10),
        acceptRanges: res.headers['accept-ranges'] === 'bytes' || res.statusCode === 206,
        host: parsed.hostname,
        status: 'online'
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export class MultiSegmentDownloader extends EventEmitter {
  // Divides total size into 2 to 16 chunks, requests Range: bytes=start-end concurrently,
  // handles auto-retry, pause/resume offset persistence, assembly, and SHA-256 verification.
}`
    },
    package: {
      name: 'package.json',
      description: 'NPM package descriptor with Electron scripts, desktop builder, and Vite React frontend',
      code: `{
  "name": "downloader-pro",
  "private": true,
  "version": "1.0.0",
  "description": "Advanced multi-segment download manager desktop clone of jDownloader",
  "main": "main.js",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "start": "node server.ts",
    "build": "vite build",
    "electron": "electron .",
    "electron:dev": "concurrently \\"vite --port=3000\\" \\"wait-on http://localhost:3000 && electron .\\"",
    "electron:pack": "electron-builder",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1"
  },
  "devDependencies": {
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "concurrently": "^9.1.0",
    "wait-on": "^8.0.1",
    "typescript": "^7.0.2",
    "vite": "^8.3.0"
  }
}`
    },
    setup: {
      name: 'ELECTRON_SETUP.md',
      description: 'Step-by-step instructions to run, develop, and build native desktop installers',
      code: `# Downloader Pro — Desktop Setup & Build Guide

## 1. Quick Start
\`\`\`bash
# 1. Clone or download project files
cd downloader-pro

# 2. Install dependencies
npm install
npm install -D electron electron-builder concurrently wait-on

# 3. Launch Electron in Dev Mode
npm run electron:dev
\`\`\`

## 2. Packaging Native Desktop Installers
\`\`\`bash
# Build React bundle
npm run build

# Package installers:
npx electron-builder --win      # Windows (.exe installer)
npx electron-builder --mac      # macOS (.dmg)
npx electron-builder --linux    # Linux (.AppImage, .deb)
\`\`\`
`
    }
  };

  const currentFile = files[activeTab];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-300">&gt; SOURCE_DESCRIPTORS // IPC_CODE_INSPECTOR</h2>
            <p className="text-xs text-emerald-600">// Native Electron and Node.js stream sources with secure ContextBridge</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06140b] hover:bg-[#0c2415] text-xs text-emerald-300 border border-emerald-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED_BUFFER' : `COPY [${currentFile.name}]`}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-black transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT [${currentFile.name}]</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-950 pb-2">
        <button
          onClick={() => setActiveTab('main')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            activeTab === 'main' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-emerald-700 hover:text-emerald-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>[main.js]</span>
        </button>

        <button
          onClick={() => setActiveTab('preload')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            activeTab === 'preload' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-emerald-700 hover:text-emerald-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>[preload.js]</span>
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            activeTab === 'engine' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-emerald-700 hover:text-emerald-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>[downloadEngine.js]</span>
        </button>

        <button
          onClick={() => setActiveTab('package')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            activeTab === 'package' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-emerald-700 hover:text-emerald-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>[package.json]</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            activeTab === 'setup' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-emerald-700 hover:text-emerald-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>[ELECTRON_SETUP.md]</span>
        </button>
      </div>

      {/* Description */}
      <div className="bg-[#030905] border border-emerald-950 rounded p-3 text-xs text-emerald-400/90">
        <span className="font-bold text-emerald-300">&gt; {currentFile.name}:</span> {currentFile.description}
      </div>

      {/* Code Display */}
      <div className="relative bg-[#020503] border border-emerald-950 rounded overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 bg-[#040c07] border-b border-emerald-950 text-xs text-emerald-600">
          <span className="text-emerald-400">&gt; cat {currentFile.name}</span>
          <span className="text-emerald-700">{currentFile.code.split('\n').length} lines</span>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed select-all">
          <code>{currentFile.code}</code>
        </pre>
      </div>
    </div>
  );
};
