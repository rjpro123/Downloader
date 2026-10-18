import React, { useState } from 'react';
import { X, Clipboard, FileText, Sparkles, Terminal } from 'lucide-react';
import { bridge } from '../services/electronBridge';

interface AddLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    urls: string[];
    packageGroup: string;
    segments: number;
    autoExtract: boolean;
    startNow: boolean;
  }) => void;
  saveDirectory: string;
}

export const AddLinksModal: React.FC<AddLinksModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  saveDirectory
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [packageName, setPackageName] = useState('PKG_MATRIX_01');
  const [segments, setSegments] = useState(4);
  const [autoExtract, setAutoExtract] = useState(true);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const urls = await bridge.readClipboard();
      if (urls && urls.length > 0) {
        setUrlInput((prev) => (prev ? `${prev}\n${urls.join('\n')}` : urls.join('\n')));
      } else {
        alert('No URLs detected in clipboard.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportBatch = async () => {
    try {
      const urls = await bridge.openFileDialog();
      if (urls && urls.length > 0) {
        setUrlInput((prev) => (prev ? `${prev}\n${urls.join('\n')}` : urls.join('\n')));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadSamples = async () => {
    const samples = await bridge.getTestFiles();
    if (samples.length > 0) {
      const sampleUrls = samples.map((s) => s.url);
      setUrlInput(sampleUrls.join('\n'));
      setPackageName('PKG_BENCHMARK_STREAMS');
    }
  };

  const handleSubmit = (startNow: boolean) => {
    const lines = urlInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http://') || l.startsWith('https://'));

    if (lines.length === 0) {
      alert('Please enter at least one valid HTTP or HTTPS download URL.');
      return;
    }

    onSubmit({
      urls: lines,
      packageGroup: packageName.trim() || 'PKG_DEFAULT',
      segments,
      autoExtract,
      startNow
    });

    setUrlInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono">
      <div className="bg-[#040c07] border border-emerald-800/90 rounded max-w-xl w-full overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.2)]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-950 bg-[#020503]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-emerald-300">&gt; BUFFER_INGESTION // PARSE_URL_STREAM</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-emerald-600 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Quick source actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePasteClipboard}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06140b] hover:bg-[#0c2415] text-xs text-emerald-300 border border-emerald-800 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>[PASTE_CLIPBOARD]</span>
            </button>

            <button
              onClick={handleImportBatch}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06140b] hover:bg-[#0c2415] text-xs text-emerald-300 border border-emerald-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>[LOAD_TXT_BATCH]</span>
            </button>

            <button
              onClick={handleLoadSamples}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900/60 text-xs text-emerald-300 border border-emerald-700/80 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>[BENCHMARK_SAMPLES]</span>
            </button>
          </div>

          {/* URLs Textarea */}
          <div>
            <label className="block text-[11px] text-emerald-500 mb-1.5 font-bold">
              // RAW_URL_INPUT_STREAM (1_URL_PER_LINE)
            </label>
            <textarea
              rows={6}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://speedtest.tele2.net/10MB.zip&#10;https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              className="w-full bg-[#020503] border border-emerald-950 rounded p-3 text-xs font-mono text-emerald-200 placeholder-emerald-900 focus:outline-none focus:border-emerald-500 resize-none shadow-inner"
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-emerald-500 mb-1.5 font-bold">// PACKAGE_IDENTIFIER</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full bg-[#020503] border border-emerald-950 rounded px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-emerald-500 mb-1.5 font-bold">// SOCKET_CONNECTIONS</label>
              <select
                value={segments}
                onChange={(e) => setSegments(parseInt(e.target.value, 10))}
                className="w-full bg-[#020503] border border-emerald-950 rounded px-3 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="2">02_PARALLEL_SOCKETS</option>
                <option value="4">04_PARALLEL_SOCKETS (Standard)</option>
                <option value="8">08_PARALLEL_SOCKETS (Turbo)</option>
                <option value="16">16_PARALLEL_SOCKETS (Max Force)</option>
              </select>
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="flex items-center gap-4 text-xs text-emerald-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoExtract}
                onChange={(e) => setAutoExtract(e.target.checked)}
                className="rounded bg-[#020503] border-emerald-800 text-emerald-500 focus:ring-0"
              />
              <span>AUTO_EXTRACT_COMPRESSED_BLOCKS (.zip / .rar)</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 bg-[#020503] border-t border-emerald-950">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 text-xs text-emerald-600 hover:text-emerald-300 transition-colors"
          >
            ABORT
          </button>

          <button
            onClick={() => handleSubmit(false)}
            type="button"
            className="px-4 py-1.5 text-xs text-emerald-300 bg-[#06140b] hover:bg-[#0c2415] border border-emerald-800 rounded transition-colors"
          >
            STAGE_TO_LINKGRABBER
          </button>

          <button
            onClick={() => handleSubmit(true)}
            type="button"
            className="px-4 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded transition-all shadow-[0_0_10px_rgba(16,185,129,0.35)]"
          >
            EXECUTE_SOCKETS_NOW
          </button>
        </div>
      </div>
    </div>
  );
};
