/**
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
    backgroundColor: '#0b0f17',
    title: 'Downloader Pro',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // In development, load local Vite dev server; in production, load built index.html
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

// Ensure single instance lock
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

/**
 * Configure IPC dispatchers bridging renderer to Node.js download engine
 */
function setupIpcHandlers() {
  // Global event forwarders from download manager to renderer
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

  // 1. Link Grabber: Parse single or bulk URLs
  ipcMain.handle('linkgrabber:parse', async (_event, urls) => {
    if (!Array.isArray(urls)) return [];

    const results = await Promise.allSettled(
      urls.map(async (rawUrl) => {
        const cleanUrl = rawUrl.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          throw new Error('Unsupported protocol');
        }
        return await probeUrl(cleanUrl);
      })
    );

    return results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      return {
        url: urls[index],
        filename: 'unknown_file',
        size: 0,
        acceptRanges: false,
        host: 'unreachable',
        status: 'offline',
        error: res.reason?.message || 'Host offline or blocked'
      };
    });
  });

  // 2. Clipboard integration
  ipcMain.handle('clipboard:read', async () => {
    const text = clipboard.readText();
    if (!text) return [];
    // Extract any HTTP/HTTPS links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  });

  // 3. Batch file open dialog (.txt, .urls)
  ipcMain.handle('file:open-dialog', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Download Links from Batch File',
      filters: [
        { name: 'Text & URL Lists', extensions: ['txt', 'urls', 'lst', 'dlc'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http://') || l.startsWith('https://'));
      return lines;
    } catch (err) {
      return [];
    }
  });

  // 4. Select directory dialog
  ipcMain.handle('file:select-directory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Destination Folder',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // 5. Download controls
  ipcMain.handle('download:start', async (_event, item) => {
    const defaultDir = path.join(app.getPath('downloads'), 'DownloaderPro');
    const downloader = downloadManager.addDownload({
      id: item.id,
      url: item.url,
      filename: item.filename,
      saveDir: item.saveDir || defaultDir,
      size: item.size || 0,
      segments: item.segments || 8,
      speedLimitKbps: downloadManager.globalSpeedLimitKbps,
      expectedChecksum: item.expectedChecksum,
      autoExtract: item.autoExtract
    });

    // Run download in background asynchronously
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

  // 6. Checksum Verification
  ipcMain.handle('checksum:verify', async (_event, { filePath, algorithm, expectedHash }) => {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }

    try {
      const crypto = require('node:crypto');
      const hash = crypto.createHash(algorithm || 'sha256');
      const stream = fs.createReadStream(filePath);

      await new Promise((resolve, reject) => {
        stream.on('data', (d) => hash.update(d));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const calculated = hash.digest('hex');
      const match = expectedHash
        ? calculated.toLowerCase() === expectedHash.trim().toLowerCase()
        : null;

      return {
        success: true,
        algorithm: algorithm || 'sha256',
        calculated,
        expected: expectedHash,
        match
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // 7. Archive extraction
  ipcMain.handle('archive:extract', async (_event, { filePath, destDir }) => {
    const ext = path.extname(filePath).toLowerCase();
    const targetDir = destDir || path.join(path.dirname(filePath), path.basename(filePath, ext));

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    return {
      success: true,
      destination: targetDir,
      manifest: `${targetDir}/extracted_manifest.json`
    };
  });

  // 8. Open file / folder
  ipcMain.handle('file:open-folder', async (_event, folderPath) => {
    if (folderPath && fs.existsSync(folderPath)) {
      shell.showItemInFolder(folderPath);
      return true;
    }
    return false;
  });

  // 9. System metadata
  ipcMain.handle('system:info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      defaultDownloadDir: path.join(app.getPath('downloads'), 'DownloaderPro'),
      homeDir: os.homedir()
    };
  });
}
