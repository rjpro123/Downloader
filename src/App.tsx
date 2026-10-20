import React, { useState, useEffect } from 'react';
import { bridge } from './services/electronBridge';
import { DownloadItem, StagedLink, SpeedSample, AppSettings, TorrentItem } from './types';
import { Header, TabType } from './components/Header';
import { DownloadsView } from './components/DownloadsView';
import { TorrentsView } from './components/TorrentsView';
import { LinkGrabberView } from './components/LinkGrabberView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { SettingsModal } from './components/SettingsModal';
import { ElectronSourceViewer } from './components/ElectronSourceViewer';
import { AddLinksModal } from './components/AddLinksModal';
import { ChecksumModal } from './components/ChecksumModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('downloads');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [stagedLinks, setStagedLinks] = useState<StagedLink[]>([]);
  const [speedSamples, setSpeedSamples] = useState<SpeedSample[]>([]);
  const [globalSpeed, setGlobalSpeed] = useState(0);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    defaultSegments: 4,
    globalSpeedLimitKbps: 0,
    defaultSaveDir: '~/Downloads/DownloaderPro',
    autoExtractArchives: true,
    maxConcurrentDownloads: 3,
    autoStartAfterGrab: false,
    disableLanPeerDiscovery: true,
    quarantineExecutables: true
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checksumModalItem, setChecksumModalItem] = useState<DownloadItem | null>(null);

  // Non-blocking toast notification banner
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isDesktop = bridge.isNativeDesktop();

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const sysInfo = await bridge.getSystemInfo();
        if (sysInfo && sysInfo.defaultDownloadDir) {
          setSettings((prev) => ({
            ...prev,
            defaultSaveDir: sysInfo.defaultDownloadDir,
            globalSpeedLimitKbps: sysInfo.globalSpeedLimitKbps || prev.globalSpeedLimitKbps
          }));
        }

        const initialDownloads = await bridge.getDownloads();
        if (initialDownloads && initialDownloads.length > 0) {
          setDownloads(initialDownloads);
        }

        const initialTorrents = await bridge.getTorrents();
        if (initialTorrents && initialTorrents.length > 0) {
          setTorrents(initialTorrents);
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    }
    init();
  }, []);

  // Real-time Event Listeners
  useEffect(() => {
    const unsubProgress = bridge.onDownloadProgress((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
    });

    const unsubStatus = bridge.onDownloadStatus((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, ...data } : item))
      );
    });

    const unsubCompleted = bridge.onDownloadCompleted((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? {
          ...item,
          ...data,
          status: 'completed',
          percent: 100,
          downloadedBytes: data.totalBytes || item.size,
          speedBytesPerSec: 0,
          etaSeconds: 0
        } : item))
      );
      addToast(`Download Complete: ${data.filename || 'File'}`, 'success');
    });

    const unsubError = bridge.onDownloadError((data) => {
      setDownloads((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, status: 'error', error: data.error } : item))
      );
      addToast(`Download Failed: ${data.error}`, 'error');
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
      addToast(`Torrent Stream Complete: ${data.name || 'Torrent'}`, 'success');
    });

    const unsubTorrentStatus = bridge.onTorrentStatus((data) => {
      setTorrents((prev) =>
        prev.map((t) => (t.infoHash === data.infoHash ? { ...t, ...data } : t))
      );
    });

    const unsubSecurityAlert = bridge.onSecurityAlert((data) => {
      addToast(`Security Alert: ${data.warning || 'Threat signature detected'}`, 'warning');
    });

    return () => {
      unsubProgress();
      unsubStatus();
      unsubCompleted();
      unsubError();
      unsubTorrentProgress();
      unsubTorrentCompleted();
      unsubTorrentStatus();
      unsubSecurityAlert();
    };
  }, []);

  // Speed telemetry sampler
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((current) => {
        const active = current.filter((d) => d.status === 'downloading' || d.status === 'connecting');
        const dlSpeedSum = active.reduce((acc, d) => acc + (d.speedBytesPerSec || 0), 0);
        
        let torrentSpeedSum = 0;
        setTorrents((torr) => {
          torrentSpeedSum = torr.reduce((acc, t) => acc + (t.status === 'downloading' ? (t.downloadSpeed || 0) : 0), 0);
          return torr;
        });

        const totalSpeed = dlSpeedSum + torrentSpeedSum;
        setGlobalSpeed(totalSpeed);
        setSpeedSamples((prev) => [...prev.slice(-39), { timestamp: Date.now(), speed: totalSpeed }]);
        return current;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  const handleStartAll = () => {
    downloads.forEach((item) => {
      if (item.status === 'paused' || item.status === 'idle') {
        bridge.resumeDownload(item.id);
      }
    });
    torrents.forEach((t) => {
      if (t.status === 'paused') {
        bridge.resumeTorrent(t.infoHash);
      }
    });
    addToast('Starting all downloads and torrent streams', 'info');
  };

  const handlePauseAll = () => {
    downloads.forEach((item) => {
      if (item.status === 'downloading' || item.status === 'connecting') {
        bridge.pauseDownload(item.id);
      }
    });
    torrents.forEach((t) => {
      if (t.status === 'downloading') {
        bridge.pauseTorrent(t.infoHash);
      }
    });
    addToast('Paused all active downloads and torrent streams', 'info');
  };

  const handleSetSpeedLimit = async (limitKbps: number) => {
    setSettings((prev) => ({ ...prev, globalSpeedLimitKbps: limitKbps }));
    await bridge.setSpeedLimit(limitKbps);
    if (limitKbps === 0) {
      addToast('Bandwidth speed limit removed: UNLIMITED', 'success');
    } else {
      addToast(`Bandwidth speed clamp set to ${limitKbps >= 1024 ? limitKbps / 1024 + ' MB/s' : limitKbps + ' KB/s'}`, 'info');
    }
  };

  const handleSetItemSpeedLimit = async (id: string, limitKbps: number) => {
    await bridge.setDownloadSpeedLimit(id, limitKbps);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, speedLimitKbps: limitKbps } : d))
    );
    addToast(`Per-download speed clamp set to ${limitKbps === 0 ? 'Unlimited' : limitKbps + ' KB/s'}`, 'info');
  };

  const handlePlayDownload = async (id: string) => {
    await bridge.resumeDownload(id);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'downloading' } : d))
    );
  };

  const handlePauseDownload = async (id: string) => {
    await bridge.pauseDownload(id);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'paused', speedBytesPerSec: 0 } : d))
    );
  };

  const handleRetryDownload = async (id: string) => {
    const item = downloads.find((d) => d.id === id);
    if (!item) return;
    await bridge.resumeDownload(id);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'connecting', error: undefined } : d))
    );
  };

  const handleDeleteDownload = async (id: string) => {
    await bridge.cancelDownload(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
    addToast('Download removed and partial files pruned', 'info');
  };

  const handleAuthorizeDownload = async (id: string) => {
    await bridge.authorizeDownload(id);
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, quarantined: false, authorized: true } : d))
    );
    addToast('Security Clearance: Executable payload unlocked for execution', 'success');
  };

  const handleAuthorizeTorrent = async (infoHash: string) => {
    await bridge.authorizeTorrent(infoHash);
    setTorrents((prev) =>
      prev.map((t) => (t.infoHash === infoHash ? { ...t, quarantined: false } : t))
    );
    addToast('Security Clearance: Torrent payload authorized', 'success');
  };

  // Add Torrent
  const handleAddTorrent = async (magnetURI: string) => {
    const res = await bridge.addTorrent(magnetURI);
    if (res.success && res.torrent) {
      setTorrents((prev) => [res.torrent, ...prev]);
      addToast(`Torrent Ingested: ${res.torrent.name}`, 'success');
    } else {
      addToast(`Torrent Error: ${res.error || 'Failed to ingest magnet link'}`, 'error');
    }
  };

  const handlePauseTorrent = async (infoHash: string) => {
    await bridge.pauseTorrent(infoHash);
    setTorrents((prev) =>
      prev.map((t) => (t.infoHash === infoHash ? { ...t, status: 'paused' } : t))
    );
  };

  const handleResumeTorrent = async (infoHash: string) => {
    await bridge.resumeTorrent(infoHash);
    setTorrents((prev) =>
      prev.map((t) => (t.infoHash === infoHash ? { ...t, status: 'downloading' } : t))
    );
  };

  const handleRemoveTorrent = async (infoHash: string, deleteFiles = false) => {
    await bridge.removeTorrent(infoHash, deleteFiles);
    setTorrents((prev) => prev.filter((t) => t.infoHash !== infoHash));
    addToast('Torrent session pruned', 'info');
  };

  // Link Grabber Submissions
  const handleAddLinksSubmit = async (data: {
    urls: string[];
    packageGroup: string;
    segments: number;
    autoExtract: boolean;
    startNow: boolean;
  }) => {
    addToast(`Probing ${data.urls.length} link(s) for Range support and metadata...`, 'info');

    try {
      const probedItems = await bridge.parseLinks(data.urls);

      const newStaged: StagedLink[] = probedItems.map((probed) => ({
        id: probed.id || `staged_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rawUrl: probed.url,
        url: probed.url,
        filename: probed.filename || probed.name || 'download.bin',
        size: probed.size || 0,
        host: probed.host || 'unknown',
        contentType: probed.contentType,
        acceptRanges: probed.acceptRanges !== false,
        status: probed.status === 'blocked' ? 'blocked' : probed.status === 'offline' ? 'offline' : 'online',
        selected: probed.status !== 'blocked',
        packageGroup: data.packageGroup,
        segments: data.segments,
        autoExtract: data.autoExtract,
        riskLevel: probed.riskLevel,
        isExecutable: probed.isExecutable,
        quarantined: probed.quarantined,
        securityWarning: probed.securityWarning
      }));

      // Check for blocked SSRF resources
      const blocked = newStaged.filter((s) => s.status === 'blocked');
      if (blocked.length > 0) {
        addToast(`Security Warning: ${blocked.length} link(s) blocked by SSRF & Private IP Firewall`, 'warning');
      }

      if (data.startNow) {
        // Direct start without staging
        const validLinks = newStaged.filter((s) => s.status !== 'blocked');
        for (const item of validLinks) {
          await handleStartDownloadFromStaged(item);
        }
        setActiveTab('downloads');
      } else {
        setStagedLinks((prev) => [...newStaged, ...prev]);
        setActiveTab('linkgrabber');
        addToast(`Staged ${newStaged.length} links in LinkGrabber`, 'success');
      }
    } catch (err: any) {
      addToast(`Link Probe Failed: ${err.message}`, 'error');
    }
  };

  const handleStartDownloadFromStaged = async (item: StagedLink) => {
    const newItem: DownloadItem = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: item.url,
      filename: item.filename,
      saveDir: settings.defaultSaveDir,
      size: item.size,
      downloadedBytes: 0,
      percent: 0,
      status: 'connecting',
      segments: item.segments,
      chunks: [],
      speedBytesPerSec: 0,
      etaSeconds: 0,
      host: item.host,
      acceptRanges: item.acceptRanges,
      autoExtract: item.autoExtract,
      expectedChecksum: item.expectedChecksum
        ? { algorithm: item.checksumType || 'sha256', hash: item.expectedChecksum }
        : undefined,
      addedAt: Date.now(),
      riskLevel: item.riskLevel,
      isExecutable: item.isExecutable,
      quarantined: item.quarantined
    };

    setDownloads((prev) => [newItem, ...prev]);

    const res = await bridge.startDownload({
      id: newItem.id,
      url: newItem.url,
      filename: newItem.filename,
      saveDir: newItem.saveDir,
      size: newItem.size,
      segments: newItem.segments,
      speedLimitKbps: settings.globalSpeedLimitKbps,
      autoExtract: newItem.autoExtract,
      expectedChecksum: newItem.expectedChecksum
    });

    if (res && res.error) {
      addToast(`Security block: ${res.error}`, 'error');
    }
  };

  const handleLoadSamples = async () => {
    const samples = await bridge.getTestFiles();
    if (samples && samples.length > 0) {
      await handleAddLinksSubmit({
        urls: [samples[0].url],
        packageGroup: 'BENCHMARK_PROBE',
        segments: 4,
        autoExtract: true,
        startNow: true
      });
    }
  };

  const totalDownloaded = downloads.reduce((acc, d) => acc + (d.downloadedBytes || 0), 0);
  const totalSize = downloads.reduce((acc, d) => acc + (d.size || 0), 0);
  const activeConnections = downloads
    .filter((d) => d.status === 'downloading')
    .reduce((acc, d) => acc + (d.segments || 4), 0);

  const quarantinedCount = downloads.filter((d) => d.quarantined).length + torrents.filter((t) => t.quarantined).length;

  return (
    <div className="min-h-screen bg-[#030706] text-emerald-100 flex flex-col font-mono selection:bg-emerald-500/30">
      {/* Toast Notifications Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg border text-xs shadow-2xl flex items-start justify-between gap-3 backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-700 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-600 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#06140b]/90 border-emerald-800 text-emerald-300'
            }`}
          >
            <div className="flex items-start gap-2 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              <span className="break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-emerald-500 hover:text-emerald-200 p-0.5 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        downloadsCount={downloads.length}
        torrentsCount={torrents.length}
        linkGrabberCount={stagedLinks.length}
        quarantinedCount={quarantinedCount}
        globalSpeed={globalSpeed}
        totalDownloaded={totalDownloaded}
        totalSize={totalSize}
        activeConnections={activeConnections}
        speedLimitKbps={settings.globalSpeedLimitKbps}
        onSetSpeedLimit={handleSetSpeedLimit}
        onStartAll={handleStartAll}
        onPauseAll={handlePauseAll}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isDesktop={isDesktop}
      />

      {/* View Switcher */}
      <main className="flex-1 w-full">
        {activeTab === 'downloads' && (
          <DownloadsView
            downloads={downloads}
            speedSamples={speedSamples}
            globalSpeed={globalSpeed}
            onPlay={handlePlayDownload}
            onPause={handlePauseDownload}
            onRetry={handleRetryDownload}
            onDelete={handleDeleteDownload}
            onOpenFolder={(dir) => {
              bridge.openFolder(dir);
              addToast(`Sandbox Destination Directory: ${dir}`, 'info');
            }}
            onOpenChecksum={(item) => setChecksumModalItem(item)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onLoadSamples={handleLoadSamples}
            onAuthorizeDownload={handleAuthorizeDownload}
            onSetItemSpeedLimit={handleSetItemSpeedLimit}
          />
        )}

        {activeTab === 'torrents' && (
          <div className="p-6 max-w-7xl mx-auto">
            <TorrentsView
              torrents={torrents}
              onAddTorrent={handleAddTorrent}
              onPauseTorrent={handlePauseTorrent}
              onResumeTorrent={handleResumeTorrent}
              onRemoveTorrent={handleRemoveTorrent}
              onAuthorizeTorrent={handleAuthorizeTorrent}
            />
          </div>
        )}

        {activeTab === 'linkgrabber' && (
          <LinkGrabberView
            stagedLinks={stagedLinks}
            onAddLinksModal={() => setIsAddModalOpen(true)}
            onReadClipboard={async () => {
              const urls = await bridge.readClipboard();
              if (urls && urls.length > 0) {
                handleAddLinksSubmit({
                  urls,
                  packageGroup: 'CLIPBOARD_STREAM',
                  segments: 4,
                  autoExtract: true,
                  startNow: false
                });
              } else {
                addToast('No URLs detected in clipboard', 'warning');
              }
            }}
            onImportBatchFile={async () => {
              const urls = await bridge.openFileDialog();
              if (urls && urls.length > 0) {
                handleAddLinksSubmit({
                  urls,
                  packageGroup: 'FILE_STREAM',
                  segments: 4,
                  autoExtract: true,
                  startNow: false
                });
              }
            }}
            onStartAll={() => {
              const valid = stagedLinks.filter((s) => s.status !== 'blocked');
              valid.forEach((item) => handleStartDownloadFromStaged(item));
              setStagedLinks([]);
              setActiveTab('downloads');
              addToast(`Transferred ${valid.length} items to active download pipeline`, 'success');
            }}
            onAddToQueuePaused={() => {
              const valid = stagedLinks.filter((s) => s.status !== 'blocked');
              valid.forEach((item) => handleStartDownloadFromStaged(item));
              setStagedLinks([]);
              setActiveTab('downloads');
              addToast(`Added ${valid.length} items to standby queue`, 'info');
            }}
            onRemoveSelected={() => {
              setStagedLinks((prev) => prev.filter((l) => !l.selected));
            }}
            onClearAll={() => setStagedLinks([])}
            onToggleSelect={(id) => {
              setStagedLinks((prev) =>
                prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
              );
            }}
            onSelectAll={(select) => {
              setStagedLinks((prev) => prev.map((l) => ({ ...l, selected: select })));
            }}
            onUpdateLink={(id, updates) => {
              setStagedLinks((prev) =>
                prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
              );
            }}
            onRecheckStatus={async () => {
              addToast('Re-verifying link status...', 'info');
            }}
            onSelectDirectory={async () => {
              const dir = await bridge.selectDirectory();
              if (dir) setSettings((prev) => ({ ...prev, defaultSaveDir: dir }));
            }}
            saveDirectory={settings.defaultSaveDir}
          />
        )}

        {activeTab === 'security' && (
          <div className="p-6 max-w-7xl mx-auto">
            <SecurityAuditView
              downloads={downloads}
              torrents={torrents}
              onAuthorizeDownload={handleAuthorizeDownload}
              onAuthorizeTorrent={handleAuthorizeTorrent}
              onDeleteDownload={handleDeleteDownload}
            />
          </div>
        )}

        {activeTab === 'source' && (
          <div className="p-6 max-w-7xl mx-auto">
            <ElectronSourceViewer />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={(updates) => {
              setSettings((prev) => ({ ...prev, ...updates }));
              if (updates.globalSpeedLimitKbps !== undefined) {
                handleSetSpeedLimit(updates.globalSpeedLimitKbps);
              }
              if (updates.disableLanPeerDiscovery !== undefined || updates.quarantineExecutables !== undefined) {
                bridge.updateSecurityPolicy(updates);
              }
              addToast('Configuration updated', 'success');
            }}
          />
        )}
      </main>

      {/* Add Links Modal */}
      <AddLinksModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLinksSubmit}
        saveDirectory={settings.defaultSaveDir}
      />

      {/* Checksum Verification Modal */}
      <ChecksumModal
        isOpen={Boolean(checksumModalItem)}
        item={checksumModalItem}
        onClose={() => setChecksumModalItem(null)}
        onVerify={async (filePath, algorithm, expectedHash) => {
          return await bridge.verifyChecksum(filePath, algorithm, expectedHash, checksumModalItem?.id);
        }}
      />
    </div>
  );
}
