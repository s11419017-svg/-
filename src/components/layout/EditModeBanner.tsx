import React, { useState, memo } from 'react';
import { Info, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { FocusEditModeToggle } from '../common/FocusEditModeToggle';

interface EditModeBannerProps {
  isEditMode: boolean;
  onExitEditMode: () => void;
  onOpenQuickGuide?: () => void;
}

export const EditModeBanner: React.FC<EditModeBannerProps> = memo(({
  isEditMode,
  onExitEditMode,
  onOpenQuickGuide,
}) => {
  const [showMobileTip, setShowMobileTip] = useState(false);

  if (!isEditMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="sticky top-14 sm:top-20 z-40 bg-gradient-to-r from-[#241212] via-[#351515] to-[#1f0f0f] border-y border-amber-500/50 shadow-2xl px-3 sm:px-4 py-2 sm:py-3 text-stone-200 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-3 text-xs">
          {/* Top / Left Section */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="font-bold text-amber-200 font-sans text-[11px] sm:text-xs truncate">
                  演職資料編輯模式中
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#8c2d2d] text-white text-[9px] sm:text-[10px] font-mono font-bold">
                  DEMO
                </span>
              </div>
            </div>

            {/* Mobile Expand Tip Button */}
            <button
              onClick={() => setShowMobileTip(!showMobileTip)}
              className="md:hidden text-[10px] text-amber-300/80 hover:text-amber-200 flex items-center gap-0.5 px-2 py-1 rounded bg-stone-900/60 border border-stone-800 shrink-0"
            >
              <span>{showMobileTip ? '收起' : '提示'}</span>
              {showMobileTip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Collapsible / Desktop Notice text */}
          <div className={`${showMobileTip ? 'block' : 'hidden'} md:block flex-1 max-w-2xl px-1`}>
            <p className="text-stone-300/90 leading-relaxed font-sans text-[10px] sm:text-[11px]">
              💡 <strong className="text-amber-100">特別說明：</strong>示範照片與心得為<strong>暫時樣板</strong>，點擊卡片旁的「換照/編輯」即可置換為真實資料。
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-1 md:pt-0 border-t md:border-t-0 border-stone-800/60">
            <FocusEditModeToggle />
            {onOpenQuickGuide && (
              <MagneticWrapper strength={0.2}>
                <button
                  onClick={onOpenQuickGuide}
                  className="hidden sm:flex px-2.5 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-[11px] font-sans items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-amber-400" />
                  <span>指引</span>
                </button>
              </MagneticWrapper>
            )}
            <MagneticWrapper strength={0.2}>
              <button
                onClick={onExitEditMode}
                className="px-3 py-1 rounded bg-[#8c2d2d] hover:bg-[#a63535] text-white font-bold transition-all text-[11px] font-sans shadow flex items-center gap-1 cursor-pointer touch-manipulation"
              >
                <X className="w-3 h-3" />
                <span>退出編輯</span>
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

EditModeBanner.displayName = 'EditModeBanner';

