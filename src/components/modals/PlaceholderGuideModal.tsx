import React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceholderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaceholderGuideModal: React.FC<PlaceholderGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="relative w-full max-w-2xl bg-[#1a1a1c] border border-amber-500/40 rounded-sm shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-stone-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2 text-amber-300 font-serif-tc text-base sm:text-lg font-bold">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>網站樣板資料與自由編輯指引（給老師、導演與同學們）</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Content */}
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-stone-300 font-sans">
            <div className="p-4 bg-[#241717] border-l-4 border-amber-400 rounded-r space-y-2">
              <h4 className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>為什麼頁面上目前有照片和文案？</span>
              </h4>
              <p className="text-stone-300/90 text-xs sm:text-xs">
                本站目前呈現的照片、演員真心告白與排練側記，均為<strong>「示範用佔位樣板（Placeholder）」</strong>，主要目的是為了讓舞台總監、指導老師與導演能先看到完成後的<strong>古典劇院排版效果、字體排印與互動動畫</strong>，並不是官方已定稿或私自發布的內容。
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h5 className="font-bold text-stone-200 text-xs sm:text-sm border-b border-stone-800 pb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>如何替換成全班真實的公演資料？</span>
              </h5>
              
              <ul className="space-y-2 text-xs text-stone-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>1. 演職名單與大頭照：</strong>開啟編輯模式後，在演員卡片點選「換照片/修改」，即可上傳同學真實排練劇照或生活大頭貼，並填寫英文角色名與心得。</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>2. 排練紀實照片：</strong>可上傳高二知足班在演藝廳或英語教室的真實彩排瞬間，記錄專屬於本班的奮鬥足跡。</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>3. 本地安全儲存與匯出：</strong>所有修改均即時儲存於您的瀏覽器中，並可透過「匯出 JSON」備份給幹部整合，不會隨意更動雲端定稿。</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-stone-900 rounded border border-stone-800 text-stone-400 text-xs space-y-1">
              <p>
                🔒 <strong>密碼保護：</strong>右上角與右下角的管理入口設有專屬 PIN 碼防護（預設：<span className="font-mono text-amber-300 font-bold">2026</span>），一般校外訪客無法隨意修改。
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-stone-800">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#8c2d2d] hover:bg-[#a63535] text-white rounded text-xs font-sans font-bold shadow transition-colors"
            >
              我知道了，關閉說明
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
