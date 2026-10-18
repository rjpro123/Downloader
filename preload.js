/**
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
});
