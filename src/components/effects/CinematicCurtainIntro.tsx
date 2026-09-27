import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { ambientSynth } from '../../utils/audioSynth';

interface CinematicCurtainIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
  onCloseForceShow?: () => void;
  isLightMode?: boolean;
}

const STORAGE_KEY = 'lesmis_has_seen_curtain_intro_v1';

/**
 * 殿堂級・70mm 電影光學鏡頭耀斑與奧賽調色開場
 * (70mm Master Optical Lens Flare & Chiseled Gilt Overture)
 * 
 * 精緻度革命 (Precision Craftsmanship):
 * 1. 【膠片菲林微顆粒 (Cinema Film Grain)】：內建無損 SVG 微顆粒濾鏡，杜絕任何 CSS 漸層色階斷層。
 * 2. 【真實 70mm 變形鏡頭光學 (Anamorphic Optics)】：
 *    - 1.5px 水平高亮雷射光軸 (Horizontal Laser Beam)
 *    - 中心 8 角璀璨微晶星芒 (Chandelier Starburst Glint)
 *    - 鏡片折射鬼影環 (Orbital Ghost Orbs & Caustics)
 * 3. 【雕版金石字體 (Chiseled Gilt Typography)】：
 *    - 告別純白文字，賦予大理石古董金屬切面光澤與微弱落影。
 * 4. 【幾何幾近物理錐形光束 (Volumetric Stage God Rays)】：
 *    - 替代粗糙的大模糊塊，以 3 道交織錐形光柱模擬真實大劇院追光燈穿透空氣的質感。
 */
export const CinematicCurtainIntro: React.FC<CinematicCurtainIntroProps> = memo(({
  onComplete,
  forceShow = false,
  onCloseForceShow,
  isLightMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (forceShow) return true;
    try {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      return !seen;
    } catch {
      return true;
    }
  });

  const [phase, setPhase] = useState<'reveal' | 'flare' | 'expand' | 'dissolve' | 'finished'>('reveal');

  const handleFinish = useCallback(() => {
    setPhase('finished');
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // safe fallback
    }
    if (onCloseForceShow) onCloseForceShow();
    if (onComplete) onComplete();
  }, [onCloseForceShow, onComplete]);

  // 同步 forceShow 屬性
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setPhase('reveal');
    }
  }, [forceShow]);

  // 電影級光學時序時脈 (Cinematic Sequence Timeline)
  useEffect(() => {
    if (!isOpen) return;

    try {
      ambientSynth.playGongSFX();
    } catch {
      // safe fallback
    }

    // Phase 2: 0.45s 寬銀幕變形鏡頭耀斑掠過
    const flareTimer = setTimeout(() => {
      setPhase('flare');
    }, 450);

    // Phase 3: 1.1s 追光燈圓形光圈綻放
    const expandTimer = setTimeout(() => {
      setPhase('expand');
    }, 1100);

    // Phase 4: 1.75s 劇院照明完全融入底層網頁
    const dissolveTimer = setTimeout(() => {
      setPhase('dissolve');
    }, 1750);

    // Phase 5: 2.1s 卸載並完成
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 2100);

    // 鍵盤快捷鍵 (ESC / Space / Enter)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(flareTimer);
      clearTimeout(expandTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleFinish]);

  if (!isOpen && !forceShow) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cinematic-stage-intro-master-optical"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'dissolve' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleFinish}
          className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto select-none transition-colors duration-500 cursor-pointer"
          style={{
            backgroundColor: isLightMode ? '#f8f5ee' : '#0b0b0e'
          }}
          aria-live="polite"
          aria-label="電影級開場動畫 (點擊任意處可跳過)"
        >
          {/* ══════════════════════════════════════════════════════════════
              1. 膠片菲林顆粒 (Film Grain Overlayer) - 抹平漸層階梯，賦予高級質感
              ══════════════════════════════════════════════════════════════ */}
          <div className="absolute inset-0 theatrical-film-grain opacity-40 mix-blend-overlay z-20 pointer-events-none" />

          {/* ══════════════════════════════════════════════════════════════
              2. 頂部細緻典雅的金芒時脈線 (Golden Overture Progress Line)
              ══════════════════════════════════════════════════════════════ */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.0, ease: 'linear' }}
            className="absolute top-0 left-0 right-0 h-[1.5px] origin-left z-30 pointer-events-none"
            style={{
              background: isLightMode
                ? 'linear-gradient(90deg, transparent, #8b252b 30%, #9c6f28 70%, transparent)'
                : 'linear-gradient(90deg, transparent, #3b82f6 20%, #e6ca65 50%, #a62d35 80%, transparent)'
            }}
          />

          {/* ══════════════════════════════════════════════════════════════
              3. 精密立體錐形體積光束 (Volumetric Conical God Rays)
              ══════════════════════════════════════════════════════════════ */}
          {/* 左側：普魯士夜藍錐形氛圍束 */}
          <div 
            className="absolute -top-10 left-[10%] w-[380px] h-[90vh] pointer-events-none origin-top -rotate-[18deg] opacity-25"
            style={{
              background: isLightMode
                ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 58, 138, 0.02) 65%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(37, 99, 235, 0.28) 0%, rgba(30, 27, 75, 0.08) 70%, transparent 100%)',
              filter: 'blur(35px)'
            }}
          />

          {/* 右側：自由緋紅錐形氛圍束 */}
          <div 
            className="absolute -top-10 right-[10%] w-[380px] h-[90vh] pointer-events-none origin-top rotate-[18deg] opacity-25"
            style={{
              background: isLightMode
                ? 'linear-gradient(180deg, rgba(139, 37, 43, 0.14) 0%, rgba(158, 42, 48, 0.02) 65%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(166, 45, 53, 0.32) 0%, rgba(120, 20, 30, 0.08) 70%, transparent 100%)',
              filter: 'blur(35px)'
            }}
          />

          {/* 中央垂直主聚光燈 (Sacred Center Spotlight) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: phase === 'expand' ? 0.9 : (phase === 'dissolve' ? 0 : 0.75),
              scale: phase === 'expand' ? 1.05 : 1
            }}
            transition={{ duration: 0.9 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70vw] max-w-4xl h-[450px] pointer-events-none blur-[60px]"
            style={{
              background: isLightMode
                ? 'radial-gradient(ellipse at 50% 25%, rgba(255, 255, 255, 0.98) 0%, rgba(212, 178, 111, 0.3) 45%, transparent 75%)'
                : 'radial-gradient(ellipse at 50% 25%, rgba(255, 248, 220, 0.5) 0%, rgba(212, 178, 111, 0.28) 48%, transparent 80%)'
            }}
          />

          {/* ══════════════════════════════════════════════════════════════
              4. 追光燈圓形光圈膨脹中介層 (Iris Aperture Bloom)
              ══════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ scale: 0.65, opacity: 0.3 }}
            animate={{
              scale: phase === 'expand' || phase === 'dissolve' ? 3.4 : 1,
              opacity: phase === 'expand' ? [0.4, 0.95, 0.2] : (phase === 'dissolve' ? 0 : 0.45)
            }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[480px] sm:w-[960px] sm:h-[700px] rounded-full pointer-events-none blur-3xl"
            style={{
              background: isLightMode
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(212, 178, 111, 0.35) 40%, rgba(139, 37, 43, 0.08) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(255, 248, 220, 0.45) 0%, rgba(212, 178, 111, 0.35) 40%, rgba(166, 45, 53, 0.16) 70%, transparent 100%)'
            }}
          />

          {/* ══════════════════════════════════════════════════════════════
              5. 與 HeroSection 100% 幾何對齊的排版版心 (Zero-Pixel Shift)
              ══════════════════════════════════════════════════════════════ */}
          <div className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
            <motion.div 
              className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
              animate={{
                scale: phase === 'expand' ? 1.01 : 1,
                filter: phase === 'expand' ? 'blur(1px)' : 'blur(0px)'
              }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* 上標：對齊 HeroSection 的頂部標籤高度與樣式 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ 
                  opacity: phase === 'expand' || phase === 'dissolve' ? 0.35 : 1, 
                  y: 0 
                }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs tracking-widest uppercase transition-colors ${
                  isLightMode 
                    ? 'text-[#8b252b] bg-[#ede8dc]/85 border border-[#8b252b]/25 shadow-xs' 
                    : 'text-[#d4b26f] bg-black/65 border border-[#d4b26f]/35 shadow-md backdrop-blur-sm'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#a62d35] animate-pulse" />
                <span className="font-serif-tc font-semibold">慈大附中 • 2026 英文戲劇公演</span>
              </motion.div>

              {/* 主標：完全對齊 HeroSection 的 py-2 與字體規格 */}
              <div className="py-2 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    filter: 'blur(0px)' 
                  }}
                  transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="relative inline-block"
                >
                  {/* 雕版燙金浮雕字體 (Chiseled Gilt) */}
                  <h1 className="font-cinzel text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight leading-none text-chiseled-gold">
                    LES MISÉRABLES
                  </h1>

                  {/* ══════════════════════════════════════════════════════════════
                      6. 殿堂級 70mm 光學變形鏡頭耀斑套件 (Master Optical Suite)
                      ══════════════════════════════════════════════════════════════ */}
                  {(phase === 'flare' || phase === 'expand') && (
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                      {/* (1) 核心極細水平雷射光軸 (1.5px Horizontal Laser Streak) */}
                      <motion.div
                        initial={{ left: '-60%', opacity: 0, scaleX: 0.3 }}
                        animate={{ left: '100%', opacity: [0, 1, 1, 0], scaleX: [0.5, 1.2, 1, 0.4] }}
                        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 -translate-y-1/2 w-48 sm:w-80 h-[1.5px]"
                        style={{
                          background: isLightMode
                            ? 'linear-gradient(90deg, transparent, rgba(212, 167, 70, 0.8) 25%, #ffffff 50%, rgba(212, 167, 70, 0.8) 75%, transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8) 20%, #ffffff 50%, rgba(255, 235, 180, 0.9) 70%, transparent)',
                          boxShadow: isLightMode 
                            ? '0 0 10px rgba(212, 167, 70, 0.8)' 
                            : '0 0 16px rgba(255, 255, 255, 1), 0 0 30px rgba(59, 130, 246, 0.6)'
                        }}
                      />

                      {/* (2) 中心 8 角璀璨微晶星芒 (Chandelier Starburst Glint) */}
                      <motion.div
                        initial={{ left: '-60%', opacity: 0, rotate: 0 }}
                        animate={{ left: '100%', opacity: [0, 0.95, 0.95, 0], rotate: 45 }}
                        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 -translate-y-1/2 w-8 h-8 -ml-4 flex items-center justify-center pointer-events-none"
                      >
                        {/* 十字主星芒 */}
                        <div className="absolute w-7 h-[1.5px] bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                        <div className="absolute h-7 w-[1.5px] bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                        {/* 45度副星芒 */}
                        <div className="absolute w-4 h-[1px] bg-amber-200 rotate-45" />
                        <div className="absolute h-4 w-[1px] bg-amber-200 rotate-45" />
                      </motion.div>

                      {/* (3) 鏡片折射鬼影微光環 (Optical Ghost Orbs) */}
                      <motion.div
                        initial={{ left: '-40%', opacity: 0 }}
                        animate={{ left: '80%', opacity: [0, 0.6, 0] }}
                        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 -translate-y-1/2 w-14 h-14 -ml-7 rounded-full border border-sky-400/40 blur-[1px] pointer-events-none"
                      />

                      {/* (4) 斜角主光幕 (Subtle Sweeping Flare Ribbon) */}
                      <motion.div
                        initial={{ left: '-120%', opacity: 0 }}
                        animate={{ left: '160%', opacity: [0, 0.85, 0.85, 0] }}
                        transition={{ duration: 0.92, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-0 bottom-0 w-28 sm:w-44 pointer-events-none"
                        style={{
                          transform: 'skewX(-22deg)',
                          background: isLightMode
                            ? 'linear-gradient(90deg, transparent 0%, rgba(212, 167, 70, 0.35) 45%, rgba(255, 255, 255, 0.85) 50%, rgba(212, 167, 70, 0.35) 55%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.12) 20%, rgba(255, 255, 255, 0.8) 50%, rgba(212, 178, 111, 0.35) 65%, transparent 100%)',
                          mixBlendMode: isLightMode ? 'hard-light' : 'screen'
                        }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* 下標：對齊 HeroSection 的法式裝飾微線與尺寸 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: phase === 'expand' || phase === 'dissolve' ? 0.35 : 1 
                  }}
                  transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center gap-4 mt-3"
                >
                  <div 
                    className="h-[1px] w-12 sm:w-20"
                    style={{
                      background: isLightMode
                        ? 'linear-gradient(to right, transparent, #8b252b)'
                        : 'linear-gradient(to right, transparent, #a62d35)'
                    }}
                  />
                  <span 
                    className="font-serif-tc text-lg sm:text-2xl tracking-[0.25em] font-semibold"
                    style={{
                      color: isLightMode ? '#8b252b' : '#a62d35',
                      textShadow: isLightMode 
                        ? '0 1px 2px rgba(139, 37, 43, 0.15)' 
                        : '0 0 16px rgba(166, 45, 53, 0.45)'
                    }}
                  >
                    《悲慘世界》
                  </span>
                  <div 
                    className="h-[1px] w-12 sm:w-20"
                    style={{
                      background: isLightMode
                        ? 'linear-gradient(to left, transparent, #8b252b)'
                        : 'linear-gradient(to left, transparent, #a62d35)'
                    }}
                  />
                </motion.div>
              </div>

              {/* 預告提示微字 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase === 'expand' || phase === 'dissolve' ? 0 : 0.65 
                }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="text-xs tracking-[0.2em] uppercase font-sans text-stone-500 dark:text-stone-400"
              >
                <span>點擊任意處立即進入 • Press ESC to Skip</span>
              </motion.div>
            </motion.div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              7. 【中間過渡專屬】舞台地燈柔和光幕 (Stage Footlights Ramp)
              ══════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase === 'expand' ? 0.75 : (phase === 'dissolve' ? 0 : 0),
              y: phase === 'expand' ? 0 : 10
            }}
            transition={{ duration: 0.55 }}
            className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
            style={{
              background: isLightMode
                ? 'linear-gradient(to top, rgba(212, 178, 111, 0.2) 0%, transparent 100%)'
                : 'linear-gradient(to top, rgba(166, 45, 53, 0.28) 0%, rgba(212, 178, 111, 0.1) 40%, transparent 100%)'
            }}
          />

          {/* ══════════════════════════════════════════════════════════════
              8. 右上角跳過按鈕
              ══════════════════════════════════════════════════════════════ */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'expand' || phase === 'dissolve' ? 0 : 1 }}
            transition={{ delay: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            className={`absolute top-5 right-5 sm:top-7 sm:right-7 z-30 px-3.5 py-1.5 rounded-full border text-xs font-sans tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-sm ${
              isLightMode
                ? 'border-[#8b252b]/25 bg-[#ede8dc]/80 text-[#34302b] hover:bg-[#ede8dc] hover:text-[#141210]'
                : 'border-[#d4b26f]/35 bg-stone-950/80 text-stone-200 hover:text-white hover:border-[#d4b26f]/70'
            }`}
            title="跳過開場 (快速鍵: ESC / 點擊任意處)"
            aria-label="跳過開場動畫"
          >
            <span>跳過</span>
            <span className="text-[10px] opacity-75 border border-current rounded px-1 font-mono">ESC</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
