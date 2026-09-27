import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import { useFocusEdit } from '../../context/FocusEditContext';
import { ambientSynth } from '../../utils/audioSynth';

export interface FocusEditModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: 'red' | 'amber' | 'emerald';
  children: React.ReactNode;
  maxWidthClass?: string; // fallback max width if not in focus mode or custom
  className?: string;
}

export const FocusEditModalWrapper: React.FC<FocusEditModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText,
  badgeColor = 'amber',
  children,
  maxWidthClass,
  className = '',
}) => {
  const {
    isFocusModeActive,
    toggleFocusMode,
    dimIntensity,
    zoomScale,
    ambientSound,
    setAmbientSound,
  } = useFocusEdit();

  const prevOpenRef = useRef(false);

  // Play subtle calming focus chime when opened if focus mode is active
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && isFocusModeActive && ambientSound) {
      // Soft audio feedback
      ambientSynth.playCardClickSFX();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, isFocusModeActive, ambientSound]);

  // Determine Backdrop class based on dim intensity
  const backdropBgClass = !isFocusModeActive
    ? 'bg-black/75 backdrop-blur-sm'
    : dimIntensity === 'deep'
    ? 'bg-black/94 backdrop-blur-xl'
    : dimIntensity === 'medium'
    ? 'bg-black/88 backdrop-blur-md'
    : 'bg-black/80 backdrop-blur-sm';

  // Determine Dialog max-width and scale based on zoom scale
  const modalWidthClass = !isFocusModeActive
    ? (maxWidthClass || 'max-w-3xl')
    : zoomScale === 'comfortable'
    ? 'max-w-4xl sm:scale-[1.03] origin-center'
    : zoomScale === 'standard'
    ? 'max-w-3xl'
    : 'max-w-2xl';

  const badgeBg =
    badgeColor === 'emerald'
      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
      : badgeColor === 'red'
      ? 'bg-red-950/80 text-red-300 border-red-700/60'
      : 'bg-amber-950/80 text-amber-300 border-amber-700/60';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* 1. Deep Atmospheric Darkening Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={onClose}
        className={`fixed inset-0 transition-all duration-500 cursor-pointer ${backdropBgClass}`}
        aria-hidden="true"
      >
        {/* Theatrical Vignette & Stage Glow focused on modal center */}
        {isFocusModeActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[70rem] h-[45rem] bg-gradient-to-b from-[#8c2d2d]/25 via-amber-900/10 to-transparent blur-[100px] rounded-full opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
          </div>
        )}
      </motion.div>

      {/* 2. Top-Floating Focus Mode Switcher Bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-55 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-stone-900/95 border border-stone-700/80 shadow-2xl backdrop-blur-md text-[11px] sm:text-xs font-sans max-w-[95vw]"
      >
        <button
          type="button"
          onClick={() => {
            ambientSynth.playButtonClickSFX();
            toggleFocusMode();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer touch-manipulation ${
            isFocusModeActive
              ? 'bg-[#8c2d2d] text-white shadow-md shadow-red-950'
              : 'bg-stone-800 text-stone-300 hover:text-white'
          }`}
          title={isFocusModeActive ? '點擊切換為一般編輯視窗' : '點擊切換為專注編輯模式 (暗化背景＋放大置中)'}
        >
          {isFocusModeActive ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow shrink-0" />
              <span>專注編輯模式</span>
              <span className="text-[10px] opacity-80 font-mono hidden sm:inline">(放大置中)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>開啟專注編輯</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-3.5 bg-stone-700" />

        <button
          type="button"
          onClick={() => setAmbientSound(!ambientSound)}
          className={`p-1 rounded-full text-stone-400 hover:text-stone-200 transition-colors cursor-pointer touch-manipulation ${
            ambientSound ? 'text-amber-400' : 'opacity-60'
          }`}
          title={ambientSound ? '已開啟沉浸音效引導' : '已關閉沉浸音效'}
          aria-label={ambientSound ? '關閉音效' : '開啟音效'}
        >
          {ambientSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[10px] text-stone-500 font-mono hidden md:inline-block">
          Esc 退出 • Ctrl+S 儲存
        </span>
      </motion.div>

      {/* 3. Enlarged & Centered Modal Dialog Window */}
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: isFocusModeActive ? 0.94 : 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={`relative w-full ${modalWidthClass} bg-[#18181b] border ${
          isFocusModeActive
            ? 'border-amber-500/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(212,175,55,0.25)] ring-1 ring-amber-400/20'
            : 'border-stone-700 shadow-2xl'
        } rounded-t-xl sm:rounded-sm overflow-hidden z-50 my-2 sm:my-8 max-h-[88dvh] sm:max-h-[92vh] flex flex-col text-stone-200 transition-all duration-300 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
};
