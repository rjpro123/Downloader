import React, { useState } from 'react';
import {
  Magnet,
  Play,
  Pause,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Unlock,
  Radio,
  EyeOff,
  Layers,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  Users
} from 'lucide-react';
import { formatBytes, formatSpeed } from '../utils/formatters';
import { TorrentItem } from '../types';
import { SecurityInterstitialModal } from './SecurityInterstitialModal';

interface TorrentsViewProps {
  torrents: TorrentItem[];
  onAddTorrent: (magnetURI: string) => Promise<void>;
  onPauseTorrent: (infoHash: string) => void;
  onResumeTorrent: (infoHash: string) => void;
  onRemoveTorrent: (infoHash: string, deleteFiles?: boolean) => void;
  onAuthorizeTorrent: (infoHash: string) => void;
}

export const TorrentsView: React.FC<TorrentsViewProps> = ({
  torrents,
  onAddTorrent,
  onPauseTorrent,
  onResumeTorrent,
  onRemoveTorrent,
  onAuthorizeTorrent
}) => {
  const [magnetInput, setMagnetInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [interstitialTorrent, setInterstitialTorrent] = useState<TorrentItem | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uri = magnetInput.trim();
    if (!uri) return;
    setIsAdding(true);
    try {
      await onAddTorrent(uri);
      setMagnetInput('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleLoadSample = (sampleUri: string) => {
    setMagnetInput(sampleUri);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Magnet Ingestion Bar */}
      <div className="bg-[#040b07] border border-emerald-900/80 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Magnet className="w-4 h-4 text-emerald-400" />
            <span>// P2P Magnet Link & Torrent Ingestion</span>
          </h2>

          <div className="flex items-center gap-2 text-[11px] text-emerald-600">
            <span className="flex items-center gap-1 text-emerald-400">
              <EyeOff className="w-3.5 h-3.5" />
              <span>LAN Peer Discovery: Disabled</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Sequential Chunk Priority: Active</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={magnetInput}
              onChange={(e) => setMagnetInput(e.target.value)}
              placeholder="magnet:?xt=urn:btih:... or paste infohash"
              className="w-full bg-[#020503] border border-emerald-900 rounded-lg px-4 py-3 text-xs text-emerald-200 placeholder-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isAdding || !magnetInput.trim()}
            className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
          >
            <Magnet className="w-4 h-4 stroke-[2.5]" />
            <span>{isAdding ? 'Parsing DHT...' : 'Add Torrent'}</span>
          </button>
        </form>

        {/* Quick sample magnets for instant evaluation */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-950 text-xs">
          <span className="text-[10px] text-emerald-700 uppercase font-bold">Quick Verified Torrents:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('magnet:?xt=urn:btih:2b2cf69e38ec296541f531f9b3b85d39ff4e2f9d&dn=Ubuntu_24.04_LTS_Server_amd64.iso&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337')}
            className="px-2 py-1 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800/80 rounded text-[11px] text-emerald-300 transition-colors"
          >
            Ubuntu 24.04 Server ISO
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('magnet:?xt=urn:btih:08a806048a1da9843640d5e7f9545e98b8b282d7&dn=Sintel_Blender_OpenMovie_4K.mkv&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337')}
            className="px-2 py-1 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800/80 rounded text-[11px] text-emerald-300 transition-colors"
          >
            Sintel 4K Stream (Media Priority)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('magnet:?xt=urn:btih:a3b5c7e90123456789abcdef0123456789abcdef&dn=Software_Patch_Installer.exe&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337')}
            className="px-2 py-1 bg-[#06140b] hover:bg-amber-950/60 border border-amber-800/80 rounded text-[11px] text-amber-300 transition-colors"
          >
            Test Executable (.exe Quarantine Test)
          </button>
        </div>
      </div>

      {/* Torrents List */}
      <div className="space-y-4">
        {torrents.length === 0 ? (
          <div className="border border-dashed border-emerald-900/60 rounded-xl p-12 text-center bg-[#030805]">
            <div className="w-12 h-12 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <Magnet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-300 mb-1">No active torrent sessions</h3>
            <p className="text-xs text-emerald-600 max-w-sm mx-auto mb-4">
              Ingest a magnet link above or click one of the quick verified torrents to initiate secure, isolated P2P downloading.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {torrents.map((torrent) => (
              <div
                key={torrent.infoHash}
                className="bg-[#040b07] border border-emerald-950 rounded-xl p-5 space-y-4 shadow-md font-mono"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-xs text-emerald-300 shrink-0">
                      TOR
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-emerald-200 truncate" title={torrent.name}>
                          {torrent.name}
                        </h4>
                        {torrent.quarantined && (
                          <button
                            onClick={() => setInterstitialTorrent(torrent)}
                            className="px-1.5 py-0.2 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded text-[9px] font-bold cursor-pointer transition-colors"
                            title="Quarantined Payload: Click to inspect"
                          >
                            QUARANTINED PAYLOAD
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-600 mt-0.5">
                        <span>{formatBytes(torrent.downloaded || 0)} of {formatBytes(torrent.size || 0)}</span>
                        <span>·</span>
                        <span className="text-emerald-300 font-bold">{torrent.progress || 0}%</span>
                        <span>·</span>
                        <span className="text-emerald-300 flex items-center gap-1">
                          <ArrowDownCircle className="w-3 h-3" />
                          {formatSpeed(torrent.downloadSpeed || 0)}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-500 flex items-center gap-1">
                          <ArrowUpCircle className="w-3 h-3" />
                          {formatSpeed(torrent.uploadSpeed || 0)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-500" />
                          Peers: {torrent.peers || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {torrent.quarantined && (
                      <button
                        onClick={() => setInterstitialTorrent(torrent)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-700/80 rounded text-xs transition-colors cursor-pointer font-bold"
                        title="Mandatory Security Gate Interstitial"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>Security Gate</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (torrent.status === 'paused') {
                          onResumeTorrent(torrent.infoHash);
                        } else {
                          onPauseTorrent(torrent.infoHash);
                        }
                      }}
                      className="p-2 bg-[#06140b] hover:bg-[#0c2415] text-emerald-400 border border-emerald-800 rounded-md transition-colors"
                      title={torrent.status === 'paused' ? 'Resume' : 'Pause'}
                    >
                      {torrent.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onRemoveTorrent(torrent.infoHash, false)}
                      className="p-2 bg-[#06140b] hover:bg-rose-950/80 text-rose-400 border border-emerald-950 rounded-md transition-colors"
                      title="Remove Torrent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-emerald-500 uppercase">
                      {torrent.status === 'completed'
                        ? 'Torrent Completed 100%'
                        : torrent.status === 'paused'
                        ? 'Paused'
                        : `Streaming DHT Chunks (${torrent.peers || 0} peers)...`}
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

                {/* Sequential Pieces Visualizer */}
                {torrent.pieces && (
                  <div className="space-y-1.5 pt-2 border-t border-emerald-950">
                    <div className="flex items-center justify-between text-[10px] text-emerald-600">
                      <span>Sequential Chunk Map (Head & Tail Prioritized for Media Streaming):</span>
                      <span>{torrent.pieces.filter((p) => p.downloaded).length} / {torrent.pieces.length} Chunks</span>
                    </div>
                    <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-2 bg-[#020503] border border-emerald-950 rounded">
                      {torrent.pieces.map((piece) => (
                        <div
                          key={piece.index}
                          title={`Piece #${piece.index} [${piece.priority} priority] - ${piece.downloaded ? 'Downloaded' : 'Waiting'}`}
                          className={`h-3 rounded-xs border transition-colors ${
                            piece.downloaded
                              ? 'bg-emerald-400 border-emerald-300'
                              : piece.priority === 'high'
                              ? 'bg-emerald-950/80 border-emerald-700/80'
                              : 'bg-[#040906] border-emerald-950'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Interstitial Modal for Torrent Payloads */}
      {interstitialTorrent && (
        <SecurityInterstitialModal
          isOpen={Boolean(interstitialTorrent)}
          item={interstitialTorrent}
          onClose={() => setInterstitialTorrent(null)}
          onApproveAndMove={async (infoHash) => {
            onAuthorizeTorrent(infoHash);
            setInterstitialTorrent(null);
          }}
          onQuarantineIsolate={async () => {
            setInterstitialTorrent(null);
          }}
          onPurgeDelete={async (infoHash) => {
            onRemoveTorrent(infoHash, true);
            setInterstitialTorrent(null);
          }}
        />
      )}
    </div>
  );
};
