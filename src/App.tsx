import React, { useState, useEffect } from 'react';
import { bridge } from './services/electronBridge';
import { DownloadItem, SpeedSample } from './types';
import { formatBytes, formatSpeed, formatEta, getFileExtension } from './utils/formatters';
import {
  Download,
  Plus,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  Clipboard,
  Magnet,
  Activity,
  ShieldCheck,
  Terminal
} from 'lucide-react';

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [segments, setSegments] = useState(4);
  const [speedLimitKbps, setSpeedLimitKbps] = useState(0);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [torrents, setTorrents] = useState<any[]>([]);
  const [magnetInput, setMagnetInput] = useState('');
  const [speedSamples, setSpeedSamples] = useState<SpeedSample[]>([]);
  const [globalSpeed, setGlobalSpeed] = useState(0);
  const [saveDir, setSaveDir] = useState('~/Downloads/DownloaderPro');
  const [isProbing, setIsProbing] = useState(false);
  const [isAddingTorrent, setIsAddingTorrent] = useState(false);
  const [activeTab, setActiveTab] = useState<'downloads' | 'torrents' | 'source'>('downloads');

  const isDesktop = bridge.isNativeDesktop();

  useEffect(() => {
    async function init() {
      try {
        const info = await bridge.getSystemInfo();
        if (info && info.defaultDownloadDir) {
          setSaveDir(info.defaultDownloadDir);
        }
        const activeTorrents = await bridge.getTorrents();
        setTorrents(activeTorrents);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  // Listen to real-time events for downloads & torrents
  useEffect(() => {
    const unsubProgress = bridge.onDownloadProgress((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
    });

    const unsubStatus = bridge.onDownloadStatus((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, status: data.status } : item))
      );
    });

    const unsubCompleted = bridge.onDownloadCompleted((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? {
          ...item,
          status: 'completed',
          percent: 100,
          downloadedBytes: data.totalBytes || item.size,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          checksums: data.checksums,
          verified: data.verified
        } : item))
      );
    });

    const unsubTorrentProgress = bridge.onTorrentProgress((data) => {
      setTorrents((prev) => {
        const index = prev.findIndex((t) => t.infoHash === data.infoHash);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        } else {
          return [data, ...prev];
        }
      });
    });

    const unsubTorrentCompleted = bridge.onTorrentCompleted((data) => {
      setTorrents((prev) =>
        prev.map((t) => (t.infoHash === data.infoHash ? { ...t, ...data, status: 'completed', progress: 100 } : t))
      );
    });

    return () => {
      unsubProgress();
      unsubStatus();
      unsubCompleted();
      unsubTorrentProgress();
      unsubTorrentCompleted();
    };
  }, []);

  // Speed graph sample generator
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((current) => {
        const active = current.filter((d) => d.status === 'downloading' || d.status === 'connecting');
        const speedSum = active.reduce((acc, d) => acc + (d.speedBytesPerSec || 0), 0);
        setGlobalSpeed(speedSum);
        setSpeedSamples((prev) => [...prev.slice(-39), { timestamp: Date.now(), speed: speedSum }]);
        return current;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStartDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      alert('Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    setIsProbing(true);
    try {
      const probedList = await bridge.parseLinks([cleanUrl]);
      const probed = probedList[0] || {
        url: cleanUrl,
        filename: cleanUrl.split('/').pop()?.split('?')[0] || 'download.bin',
        size: 0,
        host: new URL(cleanUrl).hostname,
        acceptRanges: true
      };

      const newItem: DownloadItem = {
        id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: cleanUrl,
        filename: probed.filename || 'download.bin',
        saveDir: saveDir,
        size: probed.size || 0,
        downloadedBytes: 0,
        percent: 0,
        status: 'connecting',
        segments: segments,
        chunks: [],
        speedBytesPerSec: 0,
        etaSeconds: 0,
        host: probed.host || 'unknown',
        acceptRanges: probed.acceptRanges !== false,
        addedAt: Date.now()
      };

      setDownloads((prev) => [newItem, ...prev]);
      setUrlInput('');

      await bridge.setSpeedLimit(speedLimitKbps);
      await bridge.startDownload({
        id: newItem.id,
        url: newItem.url,
        filename: newItem.filename,
        saveDir: newItem.saveDir,
        size: newItem.size,
        segments: newItem.segments,
        speedLimitKbps: speedLimitKbps,
        autoExtract: true
      });
    } catch (err: any) {
      alert(`Failed to start download: ${err.message}`);
    } finally {
      setIsProbing(false);
    }
  };

  const handleAddTorrent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const uri = magnetInput.trim();
    if (!uri || (!uri.startsWith('magnet:?') && !uri.endsWith('.torrent'))) {
      alert('Please enter a valid magnet link or torrent URI.');
      return;
    }

    setIsAddingTorrent(true);
    try {
      const res = await bridge.addTorrent(uri);
      if (res.success && res.torrent) {
        setTorrents((prev) => [res.torrent, ...prev]);
        setMagnetInput('');
        setActiveTab('torrents');
      } else {
        alert(res.error || 'Failed to add torrent');
      }
    } catch (err: any) {
      alert(`Torrent error: ${err.message}`);
    } finally {
      setIsAddingTorrent(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const urls = await bridge.readClipboard();
      if (urls && urls.length > 0) {
        setUrlInput(urls[0]);
      } else {
        alert('No URL found in clipboard.');
      }
    } catch (_) {}
  };

  const handleLoadSample = async () => {
    const files = await bridge.getTestFiles();
    if (files && files.length > 0) {
      const sample = files[0];
      setUrlInput(sample.url);
    }
  };

  const totalQueueSize = downloads.reduce((acc, d) => acc + (d.size || 0), 0);
  const totalQueueDownloaded = downloads.reduce((acc, d) => acc + (d.downloadedBytes || 0), 0);

  return (
    <div className="min-h-screen bg-[#030706] text-emerald-100 flex flex-col font-mono selection:bg-emerald-500/30">
      {/* Navigation Header */}
      <header className="bg-[#040906] border-b border-emerald-950 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-emerald-500/40 bg-emerald-950/60 flex items-center justify-center text-emerald-400">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-emerald-300">Downloader Pro</span>
            <span className="text-[10px] text-emerald-600 block">HTTP Range & Secure Torrent Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'downloads' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-emerald-600 hover:text-emerald-300'}`}
          >
            Downloads ({downloads.length})
          </button>
          <button
            onClick={() => setActiveTab('torrents')}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'torrents' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-emerald-600 hover:text-emerald-300'}`}
          >
            Torrents ({torrents.length})
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'source' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-emerald-600 hover:text-emerald-300'}`}
          >
            Desktop Setup
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {activeTab === 'source' ? (
          <div className="bg-[#040b07] border border-emerald-950 rounded p-6 space-y-4">
            <h2 className="text-sm font-bold text-emerald-300">&gt; Desktop Setup & Electron Integration</h2>
            <p className="text-xs text-emerald-600">
              Downloader Pro runs as both a web preview and a native desktop app via Electron. To run locally or package installers:
            </p>
            <pre className="p-4 bg-[#020503] border border-emerald-950 rounded text-xs text-emerald-300 overflow-x-auto">
{`# 1. Install dependencies
npm install
npm install -D electron electron-builder concurrently wait-on

# 2. Run in Desktop Electron Mode
npm run electron:dev

# 3. Build native installers (.exe / .dmg / .AppImage)
npm run build
npx electron-builder`}
            </pre>
          </div>
        ) : activeTab === 'torrents' ? (
          <>
            {/* Magnet Link Input Box */}
            <div className="bg-[#040b07] border border-emerald-900/80 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Magnet className="w-4 h-4 text-emerald-400" />
                  <span>// Secure Magnet Link / Torrent Ingestion</span>
                </h2>
              </div>

              <form onSubmit={handleAddTorrent} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={magnetInput}
                    onChange={(e) => setMagnetInput(e.target.value)}
                    placeholder="magnet:?xt=urn:btih:... or .torrent URL"
                    className="w-full bg-[#020503] border border-emerald-900 rounded-lg px-4 py-3 text-xs text-emerald-200 placeholder-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingTorrent || !magnetInput.trim()}
                  className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Magnet className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAddingTorrent ? 'Parsing DHT...' : 'Add Torrent'}</span>
                </button>
              </form>
            </div>

            {/* Torrents List */}
            <div className="space-y-4">
              {torrents.length === 0 ? (
                <div className="border border-dashed border-emerald-900/60 rounded-xl p-12 text-center bg-[#030805]">
                  <div className="w-12 h-12 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <Magnet className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-emerald-300 mb-1">No active torrent sessions</h3>
                  <p className="text-xs text-emerald-600 max-w-sm mx-auto">
                    Paste a magnet link above to initialize WebTorrent DHT peer discovery and secure streaming download.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {torrents.map((torrent) => (
                    <div
                      key={torrent.infoHash}
                      className="bg-[#040b07] border border-emerald-950 rounded-lg p-4 space-y-3 shadow-md font-mono"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center font-mono text-xs font-bold text-emerald-300 shrink-0">
                            TOR
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-emerald-200 truncate" title={torrent.name}>
                              {torrent.name || torrent.infoHash}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-emerald-600 mt-0.5">
                              <span>{formatBytes(torrent.downloaded || 0)} of {formatBytes(torrent.size || 0)}</span>
                              <span>·</span>
                              <span>{torrent.progress || 0}%</span>
                              <span>·</span>
                              <span className="text-emerald-300">↓ {formatSpeed(torrent.downloadSpeed || 0)}</span>
                              <span>·</span>
                              <span className="text-emerald-400">↑ {formatSpeed(torrent.uploadSpeed || 0)}</span>
                              <span>·</span>
                              <span>Peers: {torrent.peers || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={async () => {
                              if (torrent.status === 'paused') {
                                await bridge.resumeTorrent(torrent.infoHash);
                              } else {
                                await bridge.pauseTorrent(torrent.infoHash);
                              }
                              const list = await bridge.getTorrents();
                              setTorrents(list);
                            }}
                            className="p-2 bg-[#06140b] hover:bg-[#0c2415] text-emerald-400 border border-emerald-800 rounded-md transition-colors"
                          >
                            {torrent.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={async () => {
                              await bridge.removeTorrent(torrent.infoHash, false);
                              const list = await bridge.getTorrents();
                              setTorrents(list);
                            }}
                            className="p-2 bg-[#06140b] hover:bg-rose-950/80 text-rose-400 border border-emerald-950 rounded-md transition-colors"
                            title="Remove Torrent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-emerald-500 uppercase">
                            {torrent.status === 'completed' ? 'Torrent Complete 100%' : `Downloading via DHT (${torrent.peers || 0} peers)...`}
                          </span>
                          <span className="text-emerald-300 font-bold">{torrent.progress || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#020503] rounded-full overflow-hidden border border-emerald-950">
                          <div
                            style={{ width: `${torrent.progress || 0}%` }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-[#00ff66] transition-all duration-300 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Simple Insert Link Box */}
            <div className="bg-[#040b07] border border-emerald-900/80 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  // Insert Download Link
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Paste Clipboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
                  >
                    <span>Load 10MB Test File</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleStartDownload} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/file.zip or video.mp4..."
                    className="w-full bg-[#020503] border border-emerald-900 rounded-lg px-4 py-3 text-xs text-emerald-200 placeholder-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="w-full sm:w-36">
                  <select
                    value={segments}
                    onChange={(e) => setSegments(parseInt(e.target.value, 10))}
                    className="w-full h-full bg-[#020503] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="2">2 Chunks</option>
                    <option value="4">4 Chunks</option>
                    <option value="8">8 Chunks</option>
                    <option value="16">16 Chunks</option>
                  </select>
                </div>

                <div className="w-full sm:w-40">
                  <select
                    value={speedLimitKbps}
                    onChange={(e) => setSpeedLimitKbps(parseInt(e.target.value, 10))}
                    className="w-full h-full bg-[#020503] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="0">Speed: Unlimited</option>
                    <option value="500">500 KB/s</option>
                    <option value="1024">1 MB/s</option>
                    <option value="5120">5 MB/s</option>
                    <option value="10240">10 MB/s</option>
                    <option value="25600">25 MB/s</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProbing || !urlInput.trim()}
                  className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>{isProbing ? 'Probing...' : 'Download'}</span>
                </button>
              </form>
            </div>

            {/* Active Downloads & Status Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-emerald-500 px-1">
                <span>Active Speed: <strong className="text-emerald-300">{formatSpeed(globalSpeed)}</strong></span>
                <span>Total Queue: <strong className="text-emerald-300">{formatBytes(totalQueueDownloaded)} / {formatBytes(totalQueueSize)}</strong></span>
              </div>

              {downloads.length === 0 ? (
                <div className="border border-dashed border-emerald-900/60 rounded-xl p-12 text-center bg-[#030805]">
                  <div className="w-12 h-12 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-emerald-300 mb-1">No downloads active</h3>
                  <p className="text-xs text-emerald-600 max-w-sm mx-auto">
                    Paste any direct download link above or click "Load 10MB Test File" to test the multi-segment download engine instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((item) => {
                    const ext = getFileExtension(item.filename);

                    return (
                      <div
                        key={item.id}
                        className="bg-[#040b07] border border-emerald-950 rounded-lg p-4 space-y-3 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center font-mono text-xs font-bold text-emerald-300 shrink-0">
                              {ext.substring(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-emerald-200 truncate" title={item.filename}>
                                {item.filename}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-emerald-600 mt-0.5">
                                <span>{formatBytes(item.downloadedBytes)} of {formatBytes(item.size)}</span>
                                <span>·</span>
                                <span>{item.percent}%</span>
                                {item.status === 'downloading' && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-300 font-bold">{formatSpeed(item.speedBytesPerSec)}</span>
                                    <span>·</span>
                                    <span>ETA {formatEta(item.etaSeconds)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {item.status === 'downloading' ? (
                              <button
                                onClick={async () => {
                                  await bridge.pauseDownload(item.id);
                                  setDownloads((prev) => prev.map((d) => d.id === item.id ? { ...d, status: 'paused', speedBytesPerSec: 0 } : d));
                                }}
                                className="p-2 bg-[#06140b] hover:bg-[#0c2415] text-amber-400 border border-emerald-800 rounded-md transition-colors"
                                title="Pause"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            ) : item.status === 'paused' || item.status === 'error' ? (
                              <button
                                onClick={async () => {
                                  await bridge.resumeDownload(item.id);
                                  setDownloads((prev) => prev.map((d) => d.id === item.id ? { ...d, status: 'downloading' } : d));
                                }}
                                className="p-2 bg-[#06140b] hover:bg-[#0c2415] text-emerald-400 border border-emerald-800 rounded-md transition-colors"
                                title="Resume"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => bridge.openFolder(item.saveDir)}
                              className="p-2 bg-[#06140b] hover:bg-[#0c2415] text-emerald-400 border border-emerald-800 rounded-md transition-colors"
                              title="Open Folder"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={async () => {
                                await bridge.cancelDownload(item.id);
                                setDownloads((prev) => prev.filter((d) => d.id !== item.id));
                              }}
                              className="p-2 bg-[#06140b] hover:bg-rose-950/80 text-rose-400 border border-emerald-950 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className="text-emerald-500 uppercase">
                              {item.status === 'completed' ? 'Download Complete 100%' : item.status === 'downloading' ? `Downloading (${item.segments} chunks)...` : item.status}
                            </span>
                            <span className="text-emerald-300 font-bold">{item.percent}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#020503] rounded-full overflow-hidden border border-emerald-950">
                            <div
                              style={{ width: `${item.percent}%` }}
                              className={`h-full transition-all duration-300 rounded-full ${
                                item.status === 'completed'
                                  ? 'bg-emerald-400'
                                  : 'bg-gradient-to-r from-emerald-600 to-[#00ff66]'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
