import React, { useState, useEffect, useCallback, memo } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ambientSynth } from '../../utils/audioSynth';
import { rafThrottle } from '../../utils/throttle';

export const ScrollToTopButton: React.FC = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let lastProgress = -1;
    let lastVisible = false;

    const throttledScroll = rafThrottle(() => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      const docEl = document.documentElement;
      const totalHeight = (docEl?.scrollHeight ?? 0) - window.innerHeight;
      const currentScroll = window.scrollY || 0;

      if (totalHeight > 0) {
        const progress = Math.round(Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100));
        if (progress !== lastProgress) {
          lastProgress = progress;
          setScrollProgress(progress);
        }
      }

      const visible = currentScroll > 400;
      if (visible !== lastVisible) {
        lastVisible = visible;
        setIsVisible(visible);
      }
    });

    window.addEventListener('scroll', throttledScroll, { passive: true });
    // Initial run
    throttledScroll();

    return () => {
      throttledScroll.cancel();
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    ambientSynth.playButtonClickSFX();
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={scrollToTop}
          className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+3.25rem)] sm:bottom-24 left-3 sm:left-5 z-40 group flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#1a1a1c]/90 hover:bg-[#8c2d2d] text-stone-300 hover:text-white border border-stone-700/80 hover:border-amber-400 shadow-2xl transition-all duration-300 cursor-pointer select-none touch-manipulation"
          title={`返回頂部 (${Math.round(scrollProgress)}%)`}
          aria-label="Scroll to top"
        >
          {/* Circular Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5" viewBox="0 0 36 36">
            <path
              className="text-stone-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-400 group-hover:text-amber-200 transition-colors"
              strokeDasharray={`${scrollProgress}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';
