import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  FileCode,
  Check,
  Trash2,
  Lock,
  Unlock,
  Cpu,
  Fingerprint,
  Info
} from 'lucide-react';
import { DownloadItem, TorrentItem, QuarantineRecord } from '../types';
import { formatBytes } from '../utils/formatters';

interface SecurityInterstitialModalProps {
  isOpen: boolean;
  item: DownloadItem | TorrentItem | QuarantineRecord | null;
  onClose: () => void;
  onApproveAndMove: (idOrHash: string) => Promise<void>;
  onQuarantineIsolate?: (idOrHash: string) => Promise<void>;
  onPurgeDelete?: (idOrHash: string) => Promise<void>;
}

export const SecurityInterstitialModal: React.FC<SecurityInterstitialModalProps> = ({
  isOpen,
  item,
  onClose,
  onApproveAndMove,
  onQuarantineIsolate,
  onPurgeDelete
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  if (!isOpen || !item) return null;

  const filename = (item as any).filename || (item as any).name || (item as any).originalFilename || 'unnamed_file';
  const size = (item as any).size || (item as any).length || (item as any).fileSize || 0;
  const sha256 = (item as any).checksums?.sha256 || (item as any).sha256 || 'Calculated post-download';
  const isCamouflaged = Boolean((item as any).isCamouflaged);
  const securityWarning = (item as any).securityWarning || (item as any).reason;
  const headerInspection = (item as any).headerInspection;
  const staticAnalysis = (item as any).staticAnalysis;
  const threatIntel = (item as any).threatIntelligence;
  const threatScore = staticAnalysis?.threatScore || (item as any).threatScore || (isCamouflaged ? 95 : 65);
  const itemId = (item as any).id || (item as any).infoHash;

  const handleApprove = async () => {
    if (!acknowledged) return;
    setActionInProgress(true);
    try {
      await onApproveAndMove(itemId);
      onClose();
    } finally {
      setActionInProgress(false);
    }
  };

  const handleQuarantine = async () => {
    setActionInProgress(true);
    try {
      if (onQuarantineIsolate) {
        await onQuarantineIsolate(itemId);
      }
      onClose();
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePurge = async () => {
    setActionInProgress(true);
    try {
      if (onPurgeDelete) {
        await onPurgeDelete(itemId);
      }
      onClose();
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono selection:bg-amber-500/30">
      <div className="bg-[#050c08] border-2 border-amber-600/90 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Danger Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-rose-950/50 to-amber-950/80 px-6 py-4 border-b border-amber-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50 uppercase tracking-wider">
                  SECURITY INTERSTITIAL
                </span>
                <span className="text-[11px] text-rose-400 font-bold uppercase">
                  Execution Gate Active
                </span>
              </div>
              <h2 className="text-sm font-bold text-amber-100 tracking-wide mt-0.5">
                Potential Executable Payload Quarantined
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-400/80 hover:text-amber-200 p-1.5 rounded-lg hover:bg-amber-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-emerald-200">
          {/* Critical Camouflage Alert Banner */}
          {isCamouflaged && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-600 rounded-xl flex items-start gap-3 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="font-bold text-rose-300 uppercase tracking-wide">
                  CRITICAL THREAT: Disguised File Extension Spoofing
                </div>
                <div className="text-[11px] text-rose-200 mt-1">
                  This file claims to be a harmless media/document file, but header magic bytes analysis confirmed it is an executable binary!
                </div>
              </div>
            </div>
          )}

          {/* Warning summary */}
          <div className="p-3 bg-[#0a180e] border border-amber-800/80 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-relaxed">
              Downloader Pro operates in Zero-Execution Mode. Executables, installer packages, scripts, or camouflaged files are held in an isolated sandbox staging directory and cannot interact with the host system without manual authorization.
            </div>
          </div>

          {/* File Metadata Card */}
          <div className="bg-[#030905] border border-emerald-950 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950 text-[10px] text-emerald-600 uppercase font-bold">
              <span>Target Payload Attributes</span>
              <span className="text-amber-400">Threat Score: {threatScore}/100</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Filename</span>
                <span className="text-emerald-200 font-bold truncate block" title={filename}>
                  {filename}
                </span>
              </div>

              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Filesize</span>
                <span className="text-emerald-200 block font-mono">
                  {formatBytes(size)} ({size.toLocaleString()} bytes)
                </span>
              </div>

              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Header Magic Bytes (MIME)</span>
                <span className="text-amber-300 font-mono block">
                  {headerInspection?.matchedSignature || 'Detected via signature table'}
                </span>
              </div>

              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Sandbox State</span>
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Staging Vault (Non-executable 0o400)</span>
                </span>
              </div>
            </div>

            {/* SHA-256 Digest */}
            <div className="pt-2 border-t border-emerald-950/80">
              <span className="text-emerald-700 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Fingerprint className="w-3 h-3 text-emerald-400" />
                <span>SHA-256 Cryptographic Digest</span>
              </span>
              <code className="text-[11px] text-emerald-300 block font-mono break-all bg-[#010402] p-2 rounded border border-emerald-900/60 mt-1">
                {sha256}
              </code>
            </div>
          </div>

          {/* Static Analysis Findings */}
          <div className="bg-[#030905] border border-emerald-950 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950 text-[10px] text-emerald-600 uppercase font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>YARA / Static Signature Checks</span>
              </span>
              <span className="text-emerald-500">Heuristic Engine v2.4</span>
            </div>

            {staticAnalysis?.triggers && staticAnalysis.triggers.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {staticAnalysis.triggers.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#09150d] border border-amber-900/60 rounded flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-amber-300 block">{t.rule}</span>
                      <span className="text-emerald-400/80 text-[10px]">{t.description}</span>
                    </div>
                    <span className="px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-bold rounded uppercase shrink-0">
                      {t.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-emerald-500 py-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Payload passed static inspection: No packed headers, suspicious API imports, or macros detected.</span>
              </div>
            )}

            {/* Threat Intelligence Feed Status */}
            {threatIntel && (
              <div className="pt-2 border-t border-emerald-950/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600">Threat Intelligence:</span>
                <span className={`font-bold ${threatIntel.status === 'MALICIOUS' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {threatIntel.source} · {threatIntel.detectionRate}
                </span>
              </div>
            )}
          </div>

          {/* Mandatory User Confirmation Checkbox */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/80 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-amber-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-[#020503] cursor-pointer"
              />
              <span className="text-[11px] text-amber-200">
                I acknowledge that executing or opening files downloaded from the internet carries risk. I have verified the SHA-256 digest and explicitly approve moving this file to my system Downloads directory.
              </span>
            </label>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="bg-[#030805] px-6 py-4 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePurge}
              disabled={actionInProgress}
              className="px-3 py-2 bg-[#120507] hover:bg-rose-950 text-rose-400 border border-rose-900 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              title="Delete quarantined file from disk"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge File</span>
            </button>

            <button
              onClick={handleQuarantine}
              disabled={actionInProgress}
              className="px-3 py-2 bg-[#06140b] hover:bg-[#0c2415] text-amber-300 border border-amber-800/80 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              title="Hold securely in isolated ./data/quarantine/ vault"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Keep in Vault</span>
            </button>
          </div>

          <button
            onClick={handleApprove}
            disabled={!acknowledged || actionInProgress}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4 stroke-[2.5]" />
            <span>{actionInProgress ? 'Unlocking Payload...' : 'Approve & Move to Downloads'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
