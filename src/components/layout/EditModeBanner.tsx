import React from 'react';
import { Info, HelpCircle, ShieldAlert, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditModeBannerProps {
  isEditMode: boolean;
  onExitEditMode: () => void;
  onOpenQuickGuide?: () => void;
}

export const EditModeBanner: React.FC<EditModeBannerProps> = ({
  isEditMode,
  onExitEditMode,
  onOpenQuickGuide,
}) => {
  if (!isEditMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="sticky top-16 sm:top-20 z-40 bg-gradient-to-r from-[#2a1717] via-[#3d1818] to-[#241515] border-y border-amber-500/50 shadow-2xl px-4 py-3 text-stone-200"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Left notice */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5 md:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-200 font-sans tracking-wide">
                  演職資料維護與即時編輯模式已開啟
                </span>
                <span className="px-2 py-0.5 rounded bg-[#8c2d2d] text-white text-[10px] font-mono font-bold tracking-wider">
                  DEMO PLACEHOLDER
                </span>
              </div>
              <p className="text-stone-300/90 leading-relaxed font-sans text-[11px]">
                💡 <strong className="text-amber-100">特別說明：</strong>目前網站上的示範相片、感言引言皆為<strong>暫時代理樣板（Placeholder）</strong>，方便預覽舞台視覺版型。各位老師、導演與同學們可隨時點擊卡片旁的「編輯」或「換照片」置換為班級真實資料，不用擔心直接發布！
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {onOpenQuickGuide && (
              <button
                onClick={onOpenQuickGuide}
                className="px-3 py-1.5 rounded bg-stone-900/80 hover:bg-stone-800 border border-amber-500/40 text-amber-200 hover:text-white transition-colors text-xs font-sans flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>樣板說明與指引</span>
              </button>
            )}
            <button
              onClick={onExitEditMode}
              className="px-3.5 py-1.5 rounded bg-[#8c2d2d] hover:bg-[#a63535] text-white font-bold transition-all text-xs font-sans shadow flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>退出編輯模式</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
