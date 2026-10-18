# Downloader Pro — Desktop Setup & Build Guide

"Downloader Pro" is a desktop clone of jDownloader engineered with Electron, Node.js streams, and React.

---

## 1. Project Architecture Overview

```text
downloader-pro/
├── main.js                  # Electron Main Process (Window lifecycle, IPC handlers, native dialogs)
├── preload.js               # ContextBridge IPC (Safe bridge exposing window.electronAPI)
├── downloadEngine.js        # Multi-Segment Download Engine (Node.js HTTP Range streams, throttling, checksums)
├── server.ts                # Express + Vite Full-stack backend for web preview & headless server
├── package.json             # NPM package scripts and desktop packaging config
├── src/
│   ├── App.tsx              # Main React Application shell
│   ├── types.ts             # TypeScript interfaces for Downloads, Links, Chunks, Metrics
│   ├── services/
│   │   └── electronBridge.ts# Universal IPC bridge (Electron native + Web preview fallback)
│   ├── components/
│   │   ├── Header.tsx       # Top Bar with Speed Limiter & Queue Controls
│   │   ├── DownloadsView.tsx# Active Downloads Table with Segment Visualizer
│   │   ├── LinkGrabberView.tsx # Link Grabber staging, batch parser & packages
│   │   ├── SpeedGraph.tsx   # Live transfer bandwidth waveform chart
│   │   ├── SegmentVisualizer.tsx # Multi-connection 2–16 chunk progress bar
│   │   ├── AddLinksModal.tsx# Bulk URL / Clipboard / Batch file importer
│   │   ├── ChecksumModal.tsx# MD5 / SHA-256 integrity verifier
│   │   └── SettingsModal.tsx# Max connections, default path, auto-extract settings
```

---

## 2. Quick Start for Local Desktop Development

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Step 1: Install Dependencies
```bash
npm install
npm install -D electron electron-builder concurrently wait-on
```

### Step 2: Run in Desktop Mode (Electron + Vite)
```bash
npm run electron:dev
```
Or run the dev server and launch Electron:
```bash
npm run dev
# in a separate terminal:
npx electron .
```

---

## 3. Packaging into Native Desktop Installers

To package Downloader Pro for Windows (.exe), macOS (.dmg), and Linux (.AppImage):

```bash
# Build React bundle first
npm run build

# Package with electron-builder
npx electron-builder --win      # Builds Windows installer (.exe)
npx electron-builder --mac      # Builds macOS disk image (.dmg)
npx electron-builder --linux    # Builds Linux AppImage & deb
```

### Recommended `electron-builder` configuration in `package.json`:
```json
{
  "build": {
    "appId": "com.downloaderpro.app",
    "productName": "Downloader Pro",
    "files": [
      "dist/**/*",
      "main.js",
      "preload.js",
      "downloadEngine.js"
    ],
    "directories": {
      "output": "release"
    },
    "mac": {
      "category": "public.app-category.utilities",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

---

## 4. Key Engine Capabilities

1. **Multi-Segment HTTP Range Chunking**:
   - Files are split into 2, 4, 8, or 16 parallel chunks with `Range: bytes=start-end` headers.
   - If a host server does not send `Accept-Ranges: bytes`, it safely falls back to single connection.

2. **Pause & Resume with Byte-Level Resumption**:
   - Pausing closes active HTTP streams and persists byte offsets (`downloadedBytes` per chunk).
   - Resuming sends `Range: bytes=(start + downloadedBytes)-(end)` to pick up exactly where it left off.

3. **Speed Throttling**:
   - Token-bucket algorithm regulates stream bandwidth across all chunk workers in real-time.

4. **Checksum Verification**:
   - Streams assembled files through Node's `crypto` module to verify SHA-256 or MD5 integrity against publisher hashes.

5. **Archive Auto-Extraction**:
   - Detects completed `.zip` / `.rar` files and automatically extracts contents into a dedicated folder.
