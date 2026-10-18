import React, { useState } from 'react';
import { StagedLink } from '../types';
import { formatBytes, getFileExtension } from '../utils/formatters';
import {
  Link2,
  FolderOpen,
  Play,
  Plus,
  Trash2,
  Clipboard,
  FileText,
  RotateCw,
  CheckSquare,
  Square,
  Terminal
} from 'lucide-react';

interface LinkGrabberViewProps {
  stagedLinks: StagedLink[];
  onAddLinksModal: () => void;
  onReadClipboard: () => void;
  onImportBatchFile: () => void;
  onStartAll: () => void;
  onAddToQueuePaused: () => void;
  onRemoveSelected: () => void;
  onClearAll: () => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onUpdateLink: (id: string, updates: Partial<StagedLink>) => void;
  onRecheckStatus: () => void;
  onSelectDirectory: () => void;
  saveDirectory: string;
}

export const LinkGrabberView: React.FC<LinkGrabberViewProps> = ({
  stagedLinks,
  onAddLinksModal,
  onReadClipboard,
  onImportBatchFile,
  onStartAll,
  onAddToQueuePaused,
  onRemoveSelected,
  onClearAll,
  onToggleSelect,
  onSelectAll,
  onUpdateLink,
  onRecheckStatus,
  onSelectDirectory,
  saveDirectory
}) => {
  const [filterExtension, setFilterExtension] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedCount = stagedLinks.filter((l) => l.selected).length;
  const allSelected = stagedLinks.length > 0 && selectedCount === stagedLinks.length;
  const totalStagedSize = stagedLinks.reduce((acc, l) => acc + (l.size || 0), 0);

  const filteredLinks = stagedLinks.filter((l) => {
    if (filterExtension === 'all') return true;
    const ext = getFileExtension(l.filename).toLowerCase();
    return ext === filterExtension.toLowerCase();
  });

  const extensions = Array.from(
    new Set(stagedLinks.map((l) => getFileExtension(l.filename).toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono">
      {/* Top Action Bar (Terminal Command Header) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#040b07] border border-emerald-900/80 rounded p-3">
        {/* Left: Input Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddLinksModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ INGEST_TARGETS</span>
          </button>

          <button
            onClick={onReadClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2617] border border-emerald-800 rounded transition-colors"
            title="Scan system clipboard buffer"
          >
            <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>SNIFF_CLIPBOARD</span>
          </button>

          <button
            onClick={onImportBatchFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2617] border border-emerald-800 rounded transition-colors"
            title="Import lines from .txt or .dlc batch list"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>PARSE_MANIFEST_TXT</span>
          </button>

          <button
            onClick={onRecheckStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-300 bg-[#030905] hover:bg-[#06140b] border border-emerald-950 rounded transition-colors"
            title="Probe HTTP HEAD status"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>PROBE_ENDPOINTS</span>
          </button>
        </div>

        {/* Right: Path & Execute */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSelectDirectory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-emerald-500 bg-[#020503] border border-emerald-950 rounded hover:border-emerald-800 transition-colors"
            title="Change default target directory"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[160px]">{saveDirectory}</span>
          </button>

          <button
            onClick={onStartAll}
            disabled={stagedLinks.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:pointer-events-none rounded transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 stroke-[3]" />
            <span>IGNITE_STAGED_CONDUITS</span>
          </button>

          <button
            onClick={onAddToQueuePaused}
            disabled={stagedLinks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-[#06140b] hover:bg-[#0c2617] disabled:opacity-40 disabled:pointer-events-none border border-emerald-800 rounded transition-colors"
          >
            <span>STAGE_DORMANT</span>
          </button>
        </div>
      </div>

      {/* Sub Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-600 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-200"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-emerald-800" />
            )}
            <span>SELECT_ALL [{selectedCount}/{stagedLinks.length}]</span>
          </button>

          {selectedCount > 0 && (
            <button
              onClick={onRemoveSelected}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PURGE_SELECTED</span>
            </button>
          )}

          {stagedLinks.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-emerald-800 hover:text-emerald-500 ml-2"
            >
              CLEAR_ALL
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {extensions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700">EXT_FILTER:</span>
              <select
                value={filterExtension}
                onChange={(e) => setFilterExtension(e.target.value)}
                className="bg-[#020503] border border-emerald-950 rounded px-2 py-1 text-emerald-300 text-xs focus:outline-none"
              >
                <option value="all">ALL [{stagedLinks.length}]</option>
                {extensions.map((ext) => (
                  <option key={ext} value={ext}>
                    .{ext.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-emerald-400 tabular-nums font-bold">
            BUFFER_SIZE: {formatBytes(totalStagedSize)}
          </div>
        </div>
      </div>

      {/* Staged Links Grid / Table */}
      {filteredLinks.length === 0 ? (
        <div className="border border-dashed border-emerald-900/60 rounded p-12 text-center bg-[#030805]">
          <div className="w-12 h-12 rounded border border-emerald-800 bg-[#06120a] flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Link2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-emerald-300 mb-1">&gt; SIGNAL_INTERCEPTOR_QUIESCENT // 0_TARGETS_STAGED</h3>
          <p className="text-xs text-emerald-600 max-w-md mx-auto mb-5">
            // Interceptor buffer awaiting remote addresses. Sniff clipboard byte streams, ingest batch manifests, or probe network endpoints.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onAddLinksModal}
              className="px-4 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              + INGEST_TARGETS_MANUAL
            </button>
            <button
              onClick={onReadClipboard}
              className="px-4 py-2 text-xs text-emerald-300 bg-[#06130b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
            >
              $ SNIFF_CLIPBOARD_STREAM
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#040b07] border border-emerald-950 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#020503] border-b border-emerald-950 text-emerald-700 uppercase text-[10px]">
                <tr>
                  <th className="p-3 w-8"></th>
                  <th className="p-3">PAYLOAD_NAME / PACKAGE</th>
                  <th className="p-3">REMOTE_HOST</th>
                  <th className="p-3 text-right">CONTENT_LENGTH</th>
                  <th className="p-3 text-center">RANGE_HDR</th>
                  <th className="p-3 text-center">SOCKETS</th>
                  <th className="p-3 text-center">AUTO_EXTRACT</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right w-12">PURGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60">
                {filteredLinks.map((link) => {
                  const isEditing = editingId === link.id;

                  return (
                    <tr
                      key={link.id}
                      className={`hover:bg-[#07170e]/40 transition-colors ${
                        link.selected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => onToggleSelect(link.id)}
                          className="text-emerald-600 hover:text-emerald-300"
                        >
                          {link.selected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-emerald-900" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 min-w-[240px]">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={link.filename}
                              onChange={(e) => onUpdateLink(link.id, { filename: e.target.value })}
                              className="bg-[#020503] border border-emerald-500 rounded px-2 py-1 text-xs text-emerald-200 w-full font-mono"
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-emerald-500 text-black font-bold rounded text-[10px]"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span
                              onClick={() => setEditingId(link.id)}
                              className="font-bold text-emerald-200 hover:text-emerald-400 cursor-pointer block truncate max-w-sm"
                              title="Click to rename"
                            >
                              {link.filename}
                            </span>
                            <span className="text-[10px] text-emerald-700 block truncate max-w-sm">
                              {link.packageGroup || 'DEFAULT_PKG'} · {link.url}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-emerald-400">
                        <span className="bg-[#020503] border border-emerald-950 px-1.5 py-0.5 rounded text-[11px]">
                          {link.host}
                        </span>
                      </td>

                      <td className="p-3 text-right text-emerald-300 tabular-nums">
                        {link.size > 0 ? formatBytes(link.size) : 'DYNAMIC'}
                      </td>

                      <td className="p-3 text-center">
                        {link.acceptRanges ? (
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-1 py-0.5 rounded">
                            206_OK
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-400 bg-amber-950/80 border border-amber-800 px-1 py-0.5 rounded">
                            SINGLE
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <select
                          value={link.segments}
                          onChange={(e) => onUpdateLink(link.id, { segments: parseInt(e.target.value, 10) })}
                          className="bg-[#020503] border border-emerald-900 rounded px-1.5 py-0.5 text-xs text-emerald-300 focus:outline-none"
                        >
                          <option value="2">2_CHUNKS</option>
                          <option value="4">4_CHUNKS</option>
                          <option value="8">8_CHUNKS</option>
                          <option value="16">16_CHUNKS</option>
                        </select>
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={link.autoExtract}
                          onChange={(e) => onUpdateLink(link.id, { autoExtract: e.target.checked })}
                          className="rounded bg-[#020503] border-emerald-800 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3">
                        {link.status === 'online' ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
                            ONLINE_READY
                          </span>
                        ) : link.status === 'checking' ? (
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            PROBING...
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-xs bg-rose-400"></span>
                            OFFLINE
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => onToggleSelect(link.id)}
                          className="text-emerald-800 hover:text-rose-400 p-1 transition-colors"
                          title="Purge link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
