import React, { memo } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { ambientSynth } from '../../utils/audioSynth';

export const StoryChronicleTrigger: React.FC<{ onOpen?: () => void; onClick?: () => void }> = memo(({
  onOpen,
  onClick,
}) => {
  const handleTrigger = () => {
    ambientSynth.playPageFlipSFX();
    if (onOpen) onOpen();
    else if (onClick) onClick();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleTrigger}
      className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#8c2d2d]/95 hover:bg-[#8c2d2d] text-amber-100 hover:text-white px-2.5 py-3 rounded-l-lg border-l border-y border-amber-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md flex-col items-center justify-center gap-1.5 transition-all group select-none cursor-pointer touch-manipulation opacity-90 hover:opacity-100"
      title="開啟《悲慘世界》故事大綱與歷史篇章導讀"
      aria-label="開啟故事大綱與歷史篇章"
    >
      <BookOpen className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
      <span className="[writing-mode:vertical-lr] text-[11px] font-serif-tc tracking-widest font-bold text-amber-200">
        故事大綱
      </span>
      <ArrowRight className="w-3 h-3 text-amber-400 rotate-180 opacity-70 group-hover:opacity-100" />
    </motion.button>
  );
});

StoryChronicleTrigger.displayName = 'StoryChronicleTrigger';

