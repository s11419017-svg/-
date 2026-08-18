import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Download, FileCode, Upload, RefreshCw, Share2, ShieldCheck, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CastMember, RehearsalPhoto } from '../../types';
import {
  createSafeUtf8JsonBlob,
  createSafeUtf8TextBlob,
  readUploadedJsonFile,
  safeEncodeSharePayload,
  safeDecodeSharePayload,
  sanitizeObjectToUtf8,
} from '../../utils/textEncoding';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  castMembers: CastMember[];
  rehearsalPhotos: RehearsalPhoto[];
  onImportData?: (castMembers: CastMember[], rehearsalPhotos: RehearsalPhoto[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  castMembers,
  rehearsalPhotos,
  onImportData,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'export-ts' | 'export-json' | 'export-share' | 'import-json'>('export-ts');
  const [importStatus, setImportStatus] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  // Strict UTF-8 sanitized data structures
  const cleanCast = sanitizeObjectToUtf8(castMembers);
  const cleanPhotos = sanitizeObjectToUtf8(rehearsalPhotos);

  const formattedTS = `// 您自訂匯出的演職人員名單與照片資料 (可貼回 src/data/showData.ts)
// UTF-8 标准字符集编码
export const CAST_MEMBERS = ${JSON.stringify(cleanCast, null, 2)};

export const REHEARSAL_PHOTOS = ${JSON.stringify(cleanPhotos, null, 2)};
`;

  const handleCopy = () => {
    const textToCopy = activeTab === 'export-ts' ? formattedTS : JSON.stringify({ castMembers: cleanCast, rehearsalPhotos: cleanPhotos }, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe UTF-8 Download with BOM to completely prevent Excel/Notepad garbled Chinese
  const handleDownload = () => {
    let blob: Blob;
    if (activeTab === 'export-ts') {
      blob = createSafeUtf8TextBlob(formattedTS);
    } else {
      blob = createSafeUtf8JsonBlob({ castMembers: cleanCast, rehearsalPhotos: cleanPhotos });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcsh_les_mis_roster_${new Date().toISOString().slice(0, 10)}.${activeTab === 'export-ts' ? 'ts' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate URL with safe encoded payload using encodeURIComponent
  const generateShareLink = () => {
    try {
      const payload = safeEncodeSharePayload({ castMembers: cleanCast, rehearsalPhotos: cleanPhotos });
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('roster_data', payload);
      return currentUrl.toString();
    } catch (e) {
      console.error('Failed to generate share link:', e);
      return window.location.href;
    }
  };

  const handleCopyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2500);
  };

  // Safe file reader with UTF-8 BOM removal and decodeURIComponent validation
  const handleJsonFileUpload = async (file: File) => {
    setImportStatus('');
    setImportError('');
    try {
      const parsed = await readUploadedJsonFile(file);
      if (parsed && (Array.isArray(parsed.castMembers) || Array.isArray(parsed.rehearsalPhotos))) {
        const newCast = parsed.castMembers || castMembers;
        const newPhotos = parsed.rehearsalPhotos || rehearsalPhotos;
        if (onImportData) {
          onImportData(newCast, newPhotos);
        }
        setImportStatus(`成功以 UTF-8 格式匯入 ${newCast.length} 位演職人員與 ${newPhotos.length} 張排練相片！已徹底消除亂碼。`);
      } else {
        setImportError('JSON 格式不符：必須包含 castMembers 或 rehearsalPhotos 陣列');
      }
    } catch (err: any) {
      setImportError(err?.message || '無法解析 JSON 檔案，請確認檔案為標準 UTF-8 編碼');
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#1a1a1c] border border-stone-700 rounded-sm shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 text-sky-400 font-sans text-xs tracking-widest font-bold uppercase">
                <FileCode className="w-4 h-4" />
                <span>名單資料匯出與 UTF-8 備份中心 (Export Roster)</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900 border border-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-stone-900 rounded border border-stone-800 flex items-center justify-between text-stone-300">
                <p className="leading-relaxed">
                  管理員可在此下載 UTF-8 備份檔、產生防亂碼分享網址，或匯入 JSON 資料進行跨裝置同步。
                </p>
                <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>UTF-8 BOM 防亂碼保證</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setActiveTab('export-ts')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      activeTab === 'export-ts' ? 'bg-[#8c2d2d] text-white font-bold' : 'bg-stone-900 text-stone-400'
                    }`}
                  >
                    TypeScript (.ts)
                  </button>
                  <button
                    onClick={() => setActiveTab('export-json')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      activeTab === 'export-json' ? 'bg-[#8c2d2d] text-white font-bold' : 'bg-stone-900 text-stone-400'
                    }`}
                  >
                    JSON 備份檔 (.json)
                  </button>
                  <button
                    onClick={() => setActiveTab('export-share')}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                      activeTab === 'export-share' ? 'bg-[#8c2d2d] text-white font-bold' : 'bg-stone-900 text-sky-400'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>防亂碼分享連結</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('import-json')}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                      activeTab === 'import-json' ? 'bg-amber-700 text-white font-bold' : 'bg-stone-900 text-amber-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>匯入 JSON</span>
                  </button>
                </div>

                {activeTab !== 'import-json' && activeTab !== 'export-share' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '已複製' : '複製代碼'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 rounded text-xs flex items-center gap-1.5 transition-colors font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下載 UTF-8 檔案</span>
                    </button>
                  </div>
                )}
              </div>

              {activeTab === 'import-json' ? (
                <div className="space-y-4 p-4 bg-stone-950 border border-stone-800 rounded">
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleJsonFileUpload(file);
                    }}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-700 hover:border-amber-400 bg-stone-900/50 hover:bg-stone-900 rounded cursor-pointer transition-all group"
                  >
                    <Upload className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-stone-200 font-bold">點擊上傳或將 JSON 備份檔拖拽至此</span>
                    <span className="text-[11px] text-stone-400 mt-1">
                      自動檢測 UTF-8 編碼、移除 BOM 並以 decodeURIComponent 安全解析
                    </span>
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleJsonFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>

                  {importStatus && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{importStatus}</span>
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 bg-red-950/80 border border-red-700/60 rounded text-red-300 text-xs flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              ) : activeTab === 'export-share' ? (
                <div className="space-y-4 p-4 bg-stone-950 border border-stone-800 rounded">
                  <div className="space-y-2">
                    <span className="text-stone-300 font-bold block flex items-center gap-1.5 text-xs">
                      <Share2 className="w-4 h-4 text-sky-400" />
                      <span>跨裝置直接載入專用分享網址 (UTF-8 URL-Safe Encoded)</span>
                    </span>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      本分享連結透過 <code className="text-amber-300">encodeURIComponent</code> 與 Base64 雙層保護將演職名單安全編碼於 URL 參數中。在任何瀏覽器開啟此連結時，皆會自動解碼並無縫載入完整的中文姓名與排練相片，完全不產生任何亂碼或網址解析錯誤。
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generateShareLink()}
                      className="flex-1 bg-[#121214] border border-stone-800 rounded px-3 py-2 text-[11px] text-stone-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-2 bg-[#8c2d2d] hover:bg-[#a63535] text-white font-bold rounded text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow"
                    >
                      {shareLinkCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{shareLinkCopied ? '連結已複製！' : '複製分享連結'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative bg-stone-950 border border-stone-800 rounded p-4 font-mono text-[11px] text-stone-300 max-h-80 overflow-y-auto whitespace-pre">
                  {activeTab === 'export-ts' ? formattedTS : JSON.stringify({ castMembers: cleanCast, rehearsalPhotos: cleanPhotos }, null, 2)}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-800">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded transition-colors font-sans"
              >
                關閉視窗
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};


