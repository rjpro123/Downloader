import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  Cpu,
  EyeOff,
  Server,
  Trash2,
  FileText,
  Clock,
  Fingerprint,
  Archive,
  Layers,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { bridge } from '../services/electronBridge';
import { SecurityAuditReport, DownloadItem, TorrentItem, QuarantineRecord, SecurityLogEntry } from '../types';
import { formatBytes } from '../utils/formatters';
import { SecurityInterstitialModal } from './SecurityInterstitialModal';

interface SecurityAuditViewProps {
  downloads: DownloadItem[];
  torrents: TorrentItem[];
  onAuthorizeDownload: (id: string) => void;
  onAuthorizeTorrent: (infoHash: string) => void;
  onDeleteDownload: (id: string) => void;
}

type SubTab = 'diagnostics' | 'vault' | 'logs';

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  downloads,
  torrents,
  onAuthorizeDownload,
  onAuthorizeTorrent,
  onDeleteDownload
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('diagnostics');
  const [isRunning, setIsRunning] = useState(false);
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [vaultItems, setVaultItems] = useState<QuarantineRecord[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'CRITICAL' | 'WARN' | 'INFO'>('ALL');
  const [selectedInterstitialItem, setSelectedInterstitialItem] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const report = await bridge.runSecurityAudit();
      setAuditReport(report);
    } catch (err: any) {
      console.error('Audit failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const loadVault = async () => {
    try {
      const list = await bridge.getQuarantineVault();
      setVaultItems(list);
    } catch (_) {}
  };

  const loadLogs = async () => {
    try {
      const logs = await bridge.getSecurityLogs(150);
      setSecurityLogs(logs);
    } catch (_) {}
  };

  useEffect(() => {
    runAudit();
    loadVault();
    loadLogs();

    // Listen for real-time security alerts
    const unsubAlert = bridge.onSecurityAlert((data) => {
      showFeedback(`Security Alert: ${data.warning || 'Threat signature detected'}`);
      loadLogs();
      loadVault();
    });

    return () => {
      unsubAlert();
    };
  }, []);

  const handleRestoreFromVault = async (quarantineId: string) => {
    try {
      const res = await bridge.restoreFromQuarantine(quarantineId);
      if (res && res.success) {
        showFeedback('Payload restored from vault into Downloads directory');
        await loadVault();
        await loadLogs();
      }
    } catch (err: any) {
      showFeedback(`Restore failed: ${err.message}`);
    }
  };

  const handleDeleteFromVault = async (quarantineId: string) => {
    try {
      const res = await bridge.deleteQuarantinedFile(quarantineId);
      if (res && res.success) {
        showFeedback('Payload purged permanently from Quarantine Vault');
        await loadVault();
        await loadLogs();
      }
    } catch (err: any) {
      showFeedback(`Purge failed: ${err.message}`);
    }
  };

  const handleAutomatedCleanup = async () => {
    try {
      const res = await bridge.cleanupQuarantineVault(30);
      showFeedback(`Vault cleanup complete: Purged ${res.purgedCount || 0} expired payloads`);
      await loadVault();
      await loadLogs();
    } catch (err: any) {
      showFeedback(`Cleanup error: ${err.message}`);
    }
  };

  const handleClearLogs = async () => {
    await bridge.clearSecurityLogs();
    await loadLogs();
    showFeedback('Security log trail cleared');
  };

  const filteredLogs = securityLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  const quarantinedDownloads = downloads.filter((d) => d.quarantined);
  const quarantinedTorrents = torrents.filter((t) => t.quarantined);
  const totalQuarantinedCount = quarantinedDownloads.length + quarantinedTorrents.length + vaultItems.filter(v => !v.restored).length;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="bg-[#040b07] border border-emerald-900/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/60 rounded text-[11px] text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SECURITY_HARDENING: ZERO-EXECUTION SANDBOX</span>
            </div>
            <h1 className="text-xl font-bold text-emerald-200">
              Downloader Pro Multi-Layered Security Core
            </h1>
            <p className="text-xs text-emerald-500/90 leading-relaxed">
              Multi-layer security pipeline enforcing active staging isolation (<code className="text-emerald-400">./data/staging/</code>),
              magic bytes camouflage detection, YARA static signature analysis, execution blocks, and an isolated Quarantine Vault (<code className="text-emerald-400">./data/quarantine/</code>).
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <div className="text-left md:text-right">
              <div className="text-3xl font-extrabold text-emerald-300">
                {auditReport ? `${auditReport.auditScore}%` : '---'}
              </div>
              <div className="text-[10px] text-emerald-600 uppercase">
                Safety Trust Index ({auditReport?.checks.filter((c) => c.passed).length || 0}/{auditReport?.checks.length || 8} Checks Passing)
              </div>
            </div>

            <button
              onClick={() => {
                runAudit();
                loadVault();
                loadLogs();
              }}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Auditing Engine...' : 'Run Diagnostics'}</span>
            </button>
          </div>
        </div>

        {/* Feedback pill */}
        {actionMessage && (
          <div className="mt-4 p-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs rounded flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-emerald-950 pb-2">
        <button
          onClick={() => setActiveSubTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'diagnostics'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'text-emerald-600 hover:text-emerald-300 hover:bg-[#061208]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Diagnostics ({auditReport?.checks.length || 8})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('vault');
            loadVault();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'vault'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'text-emerald-600 hover:text-amber-300 hover:bg-[#061208]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Quarantine Vault ({totalQuarantinedCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('logs');
            loadLogs();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : 'text-emerald-600 hover:text-emerald-300 hover:bg-[#061208]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Security Lifecycle Log ({securityLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Security Diagnostics */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Grid: 6 Real Protection Vectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>SSRF & Private IP Armor</span>
                </div>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
                  ENFORCED
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Socket-level DNS lookup blocks loopback, cloud metadata (169.254.169.254), and RFC 1918 internal subnets from being probed.
              </p>
            </div>

            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Staging Extension Isolation</span>
                </div>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
                  STAGING_DIR
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Active downloads write into <code className="text-emerald-400">./data/staging/</code> with safe placeholder extensions (<code className="text-emerald-400">.download</code>, <code className="text-emerald-400">.part</code>).
              </p>
            </div>

            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Header Magic Bytes Validation</span>
                </div>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Inspects initial stream chunk bytes (MZ, ELF, Mach-O, PK) to catch disguised executables spoofing media/document extensions.
              </p>
            </div>

            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                  <span>YARA Static Signature Checks</span>
                </div>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
                  ARMED
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Flags packed executable headers (UPX, ASPack), suspicious DLL imports (CreateRemoteThread), and embedded script macros.
              </p>
            </div>

            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Isolated Quarantine Vault</span>
                </div>
                <span className="text-[10px] bg-amber-950 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded">
                  VAULT_0o400
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Flagged or unauthorized payloads move into <code className="text-emerald-400">./data/quarantine/</code> with 0o400 non-executable read-only permissions.
              </p>
            </div>

            <div className="bg-[#040906] border border-emerald-950 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Audit Trail Lifecycle Logging</span>
                </div>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
                  SECURITY.LOG
                </span>
              </div>
              <p className="text-[11px] text-emerald-600">
                Logs all staging actions, magic byte checks, static scans, execution blocks, and user clearance overrides into <code className="text-emerald-400">./data/security.log</code>.
              </p>
            </div>
          </div>

          {/* Live Diagnostic Audit Checks Log */}
          {auditReport && (
            <div className="bg-[#040906] border border-emerald-950 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>// Live Diagnostic Verification Logs</span>
                </h3>
                <span className="text-[10px] text-emerald-600">
                  Audit completed in {auditReport.durationMs}ms ({new Date(auditReport.auditedAt).toLocaleTimeString()})
                </span>
              </div>

              <div className="space-y-2">
                {auditReport.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-2.5 rounded bg-[#020503] border border-emerald-950 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-emerald-200">{check.name}</div>
                        <div className="text-[11px] text-emerald-500/80">{check.detail}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        check.passed
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800'
                      }`}>
                        {check.passed ? 'PASSED' : 'FLAGGED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Quarantine Vault Management */}
      {activeSubTab === 'vault' && (
        <div className="space-y-4">
          <div className="bg-[#040906] border border-amber-900/80 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950 pb-3">
              <div>
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>// Isolated Quarantine Vault (./data/quarantine/)</span>
                </h3>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Files in this vault are stripped of execution rights (0o400 read-only mode) and cannot be launched by OS shell hooks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutomatedCleanup}
                  className="px-3 py-1.5 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 text-emerald-300 text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Purge items quarantined for more than 30 days"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Run 30-Day Cleanup</span>
                </button>
                <button
                  onClick={loadVault}
                  className="p-1.5 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 text-emerald-400 rounded transition-colors cursor-pointer"
                  title="Refresh Vault Manifest"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Quarantined Payloads from active queue */}
            {(quarantinedDownloads.length > 0 || quarantinedTorrents.length > 0) && (
              <div className="space-y-2">
                <div className="text-[10px] text-amber-400 uppercase font-bold">
                  Active Queue Payloads Awaiting Operator Authorization ({quarantinedDownloads.length + quarantinedTorrents.length}):
                </div>
                {quarantinedDownloads.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#061208] border border-amber-900/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-200 truncate">{item.filename}</span>
                        <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-bold rounded">
                          QUEUED EXECUTABLE
                        </span>
                        {item.isCamouflaged && (
                          <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold rounded">
                            SPOOFED EXTENSION
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-1 flex flex-wrap items-center gap-2">
                        <span>{formatBytes(item.size)}</span>
                        <span>·</span>
                        <span>SHA256: {item.checksums?.sha256 ? item.checksums.sha256.substring(0, 16) + '...' : 'Calculating'}</span>
                        <span>·</span>
                        <span className="text-rose-400 font-bold">Execution Blocked</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedInterstitialItem(item)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-700/80 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Inspect & Clear</span>
                      </button>
                    </div>
                  </div>
                ))}

                {quarantinedTorrents.map((t) => (
                  <div
                    key={t.infoHash}
                    className="p-3 bg-[#061208] border border-amber-900/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-200 truncate">{t.name}</span>
                        <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-bold rounded">
                          TORRENT PAYLOAD
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-1">
                        InfoHash: {t.infoHash.substring(0, 24)}... · Status: Execution Blocked
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onAuthorizeTorrent(t.infoHash)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-700/80 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Persistent Vault Records from vault_manifest.json */}
            <div className="pt-2">
              <div className="text-[10px] text-emerald-600 uppercase font-bold mb-2">
                Quarantined Files Stored in Isolated Vault ({vaultItems.length}):
              </div>

              {vaultItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-emerald-600 border border-dashed border-emerald-950 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mx-auto mb-2" />
                  Quarantine vault is empty. No files are currently isolated.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vaultItems.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        record.restored
                          ? 'bg-[#030805] border-emerald-950 opacity-60'
                          : 'bg-[#07130a] border-amber-900/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-200 truncate">{record.originalFilename}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            record.restored
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {record.restored ? 'RESTORED' : 'ISOLATED_VAULT'}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            Threat Score: {record.threatScore || 65}/100
                          </span>
                        </div>

                        <div className="text-[11px] text-emerald-600 mt-1 flex flex-wrap items-center gap-2">
                          <span>{formatBytes(record.fileSize)}</span>
                          <span>·</span>
                          <span>Quarantined: {new Date(record.quarantinedAt).toLocaleString()}</span>
                          <span>·</span>
                          <span className="font-mono text-emerald-400/80">SHA: {record.sha256 ? record.sha256.substring(0, 16) + '...' : 'N/A'}</span>
                        </div>

                        <div className="text-[10px] text-amber-300/80 mt-1 italic">
                          Reason: {record.reason}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!record.restored && (
                          <>
                            <button
                              onClick={() => setSelectedInterstitialItem(record)}
                              className="px-2.5 py-1.5 bg-[#0a1f11] hover:bg-[#10301b] text-emerald-300 border border-emerald-800 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Inspect full static analysis findings"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect</span>
                            </button>

                            <button
                              onClick={() => handleRestoreFromVault(record.id)}
                              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-700/80 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-bold"
                              title="Restore to Downloads folder (User Approval Override)"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteFromVault(record.id)}
                          className="p-1.5 bg-[#140608] hover:bg-rose-950 text-rose-400 border border-rose-900 rounded transition-colors cursor-pointer"
                          title="Purge file permanently from disk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Trail / Lifecycle Log */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#040906] border border-emerald-950 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950 pb-3">
            <div>
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>// Lifecycle Security Log Trail (./data/security.log)</span>
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Immutable chronological record of staging actions, magic byte checks, and operator clearance overrides.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#020503] p-1 rounded border border-emerald-950 text-[10px]">
                {(['ALL', 'CRITICAL', 'WARN', 'INFO'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      logFilter === lvl
                        ? 'bg-emerald-900 text-emerald-200 font-bold'
                        : 'text-emerald-600 hover:text-emerald-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={loadLogs}
                className="p-1.5 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 text-emerald-400 rounded transition-colors cursor-pointer"
                title="Refresh Logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearLogs}
                className="p-1.5 bg-[#140608] hover:bg-rose-950 text-rose-400 border border-rose-900 rounded transition-colors cursor-pointer"
                title="Clear Security Log File"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-emerald-600">
              No security log entries found matching filter '{logFilter}'.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const isCrit = log.level === 'CRITICAL' || log.level === 'ALERT' || log.level === 'SECURITY_ALERT';
                const isWarn = log.level === 'WARN' || log.level === 'SECURITY_WARN';

                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded border text-[11px] font-mono flex flex-col sm:flex-row sm:items-start justify-between gap-2 ${
                      isCrit
                        ? 'bg-rose-950/30 border-rose-800 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                        : 'bg-[#020603] border-emerald-950 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 mt-0.5 ${
                        isCrit
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : isWarn
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {log.level}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span className="font-bold mr-2 text-emerald-200">{log.eventType}</span>
                        <span className="text-[10px] opacity-80 break-all">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details)}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-emerald-700 shrink-0 self-end sm:self-start">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mandatory Security Interstitial Modal */}
      {selectedInterstitialItem && (
        <SecurityInterstitialModal
          isOpen={Boolean(selectedInterstitialItem)}
          item={selectedInterstitialItem}
          onClose={() => setSelectedInterstitialItem(null)}
          onApproveAndMove={async (idOrHash) => {
            if ((selectedInterstitialItem as any).vaultFilename) {
              await handleRestoreFromVault(idOrHash);
            } else if ((selectedInterstitialItem as any).infoHash) {
              onAuthorizeTorrent(idOrHash);
            } else {
              onAuthorizeDownload(idOrHash);
            }
            setSelectedInterstitialItem(null);
          }}
          onQuarantineIsolate={async () => {
            setSelectedInterstitialItem(null);
            showFeedback('File secured in Quarantine Vault');
            await loadVault();
          }}
          onPurgeDelete={async (idOrHash) => {
            if ((selectedInterstitialItem as any).vaultFilename) {
              await handleDeleteFromVault(idOrHash);
            } else {
              onDeleteDownload(idOrHash);
            }
            setSelectedInterstitialItem(null);
          }}
        />
      )}
    </div>
  );
};
