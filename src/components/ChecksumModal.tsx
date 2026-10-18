import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, AlertTriangle, Terminal } from 'lucide-react';
import { DownloadItem } from '../types';

interface ChecksumModalProps {
  item: DownloadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (filePath: string, algorithm: string, expectedHash: string) => Promise<any>;
}

export const ChecksumModal: React.FC<ChecksumModalProps> = ({
  item,
  isOpen,
  onClose,
  onVerify
}) => {
  const [expectedHash, setExpectedHash] = useState('');
  const [algorithm, setAlgorithm] = useState<'sha256' | 'md5'>('sha256');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ match: boolean | null; calculated?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !item) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunVerify = async () => {
    if (!expectedHash.trim()) {
      alert('Please enter an expected checksum hash to compare.');
      return;
    }
    setIsVerifying(true);
    try {
      const fullPath = `${item.saveDir}/${item.filename}`;
      const res = await onVerify(fullPath, algorithm, expectedHash.trim());
      setVerifyResult(res);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const sha256Value = item.checksums?.sha256 || 'CALCULATING_POST_ASSEMBLY_HASH...';
  const md5Value = item.checksums?.md5 || 'CALCULATING_POST_ASSEMBLY_HASH...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono">
      <div className="bg-[#040c07] border border-emerald-800/90 rounded max-w-lg w-full overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.2)]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-950 bg-[#020503]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-emerald-300">&gt; CRYPTO_DIGEST // INTEGRITY_PROVER</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-emerald-600 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[10px] text-emerald-600 uppercase block font-bold">&gt; TARGET_FILE_DESCRIPTOR</span>
            <span className="text-xs font-bold text-emerald-200 block truncate" title={item.filename}>
              {item.filename}
            </span>
          </div>

          {/* SHA-256 Card */}
          <div className="bg-[#020503] border border-emerald-950 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-emerald-400 font-bold">&gt; SHA256_DIGEST</span>
              {item.checksums?.sha256 && (
                <button
                  onClick={() => handleCopy(item.checksums!.sha256, 'sha256')}
                  className="text-emerald-600 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                >
                  {copiedField === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'sha256' ? 'COPIED' : 'COPY'}</span>
                </button>
              )}
            </div>
            <div className="text-xs text-emerald-300 break-all select-all font-mono">
              {sha256Value}
            </div>
          </div>

          {/* MD5 Card */}
          <div className="bg-[#020503] border border-emerald-950 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-emerald-400 font-bold">&gt; MD5_DIGEST</span>
              {item.checksums?.md5 && (
                <button
                  onClick={() => handleCopy(item.checksums!.md5, 'md5')}
                  className="text-emerald-600 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                >
                  {copiedField === 'md5' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'md5' ? 'COPIED' : 'COPY'}</span>
                </button>
              )}
            </div>
            <div className="text-xs text-emerald-300 break-all select-all font-mono">
              {md5Value}
            </div>
          </div>

          {/* Compare Against Expected Checksum */}
          <div className="pt-2 border-t border-emerald-950">
            <label className="block text-[11px] text-emerald-500 mb-1.5 font-bold">
              // COMPARE_EXPECTED_PUBLISHER_HASH
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as any)}
                className="bg-[#020503] border border-emerald-950 rounded px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none"
              >
                <option value="sha256">SHA-256</option>
                <option value="md5">MD5</option>
              </select>
              <input
                type="text"
                placeholder="0x9a8b7c..."
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                className="flex-1 bg-[#020503] border border-emerald-950 rounded px-3 py-1.5 text-xs text-emerald-200 placeholder-emerald-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleRunVerify}
              disabled={isVerifying || !expectedHash.trim() || item.status !== 'completed'}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded text-xs transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              {isVerifying ? 'CALCULATING_STREAM_HASH...' : 'EXECUTE_BITWISE_VERIFICATION'}
            </button>

            {/* Result banner */}
            {verifyResult && (
              <div className={`mt-3 p-3 rounded border text-xs flex items-center gap-2 ${
                verifyResult.match
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-950/80 border-rose-700 text-rose-300'
              }`}>
                {verifyResult.match ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>[INTEGRITY_VERIFIED_100%]: Cryptographic hash matches byte-for-byte.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>[INTEGRITY_MISMATCH]: Digest differs from expected publisher hash.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-2.5 bg-[#020503] border-t border-emerald-950">
          <button
            onClick={onClose}
            className="px-4 py-1 text-xs text-emerald-500 hover:text-emerald-200 transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
