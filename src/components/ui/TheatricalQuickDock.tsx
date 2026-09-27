import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Type,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  MousePointer,
  ShieldCheck,
  BookOpen,
  Clapperboard,
  Gamepad2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility, TextSizeMode } from '../../context/AccessibilityContext';
import { TheatricalJoystick } from './TheatricalJoystick';

interface TheatricalQuickDockProps {
  isLightMode: boolean;
  toggleTheme?: () => void;
  onOpenChronicle?: () => void;
  onReplayCurtainIntro?: () => void;
  onOpenGame?: () => void;
}

export const TheatricalQuickDock: React.FC<TheatricalQuickDockProps> = ({ isLightMode, onReplayCurtainIntro, onOpenGame }) => {
  const {
    accessibilityFriendlyMode,
    toggleAccessibilityFriendlyMode,
    openResearchModal,
    openSettings,
    spotlightIntensity,
    setSpotlightIntensity,
    textSize,
    setTextSize,
    stepTextSize,
    useTheatricalCursor,
    setUseTheatricalCursor,
    resetToDefaults,
    isSideDockExpanded,
    setIsSideDockExpanded,
    announce,
  } = useAccessibility();

  const [isRailFolded, setIsRailFolded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tcsh_quick_dock_folded');
      return saved !== null ? saved === 'true' : true; // Default folded for a clean, non-intrusive layout
    }
    return true;
  });

  const drawerRef = useRef<HTMLDivElement | null>(null);

  const handleToggleFold = () => {
    setIsRailFolded((prev) => {
      const next = !prev;
      localStorage.setItem('tcsh_quick_dock_folded', String(next));
      return next;
    });
  };

  // Adjust brightness in steps
  const stepBrightness = (delta: number) => {
    const current = spotlightIntensity;
    const next = Math.min(1, Math.max(0, Math.round((current + delta) * 20) / 20));
    setSpotlightIntensity(next);
    announce(`打光亮度調整為：${Math.round(next * 100)}%`);
  };

  // Keyboard shortcut: ESC to collapse drawer
  useEffect(() => {
    if (!isSideDockExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSideDockExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSideDockExpanded, setIsSideDockExpanded]);

  const brightnessPercent = Math.round(spotlightIntensity * 100);

  return (
    <aside
      aria-label="劇院觀演舒適設定與快速打光微調"
      className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center select-none"
    >
      {/* 1. 簡潔吸附式側邊條 (Compact Floating Rocker Dock) */}
      {isRailFolded ? (
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={handleToggleFold}
          className="flex flex-col items-center py-3 px-1.5 rounded-r-xl bg-stone-100/95 dark:bg-stone-900/95 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border-y border-r border-amber-500/50 shadow-[6px_0_20px_rgba(0,0,0,0.15)] dark:shadow-[6px_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-amber-400"
          title="展開觀演舒適與閱讀微調列"
          aria-label="展開觀演舒適與閱讀微調列"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-serif-tc font-bold tracking-widest [writing-mode:vertical-rl] text-amber-700 dark:text-amber-300 py-1.5">
            觀演舒適
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400/80 animate-pulse mt-0.5" />
        </motion.button>
      ) : (
        <div
          className={`flex flex-col items-center bg-stone-100/95 dark:bg-stone-900/95 hover:bg-stone-200/95 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 border-y border-r border-amber-500/40 rounded-r-2xl shadow-[6px_0_24px_rgba(0,0,0,0.15)] dark:shadow-[6px_0_24px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 py-2.5 px-1.5 gap-2 ${
            isSideDockExpanded ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
          }`}
        >
          {/* 主展開按鈕：直接打開觀演舒適主設定彈窗 */}
          <button
            onClick={() => openSettings()}
            className="group flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-amber-400"
            title="開啟觀演舒適與閱讀設定 (字級・打光・對比)"
            aria-label="開啟觀演舒適設定"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:scale-110 transition-transform">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-serif-tc font-bold tracking-widest [writing-mode:vertical-rl] text-amber-700 dark:text-amber-300/95 py-0.5">
              觀演設定
            </span>
          </button>

          <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700/60 my-0.5" />

          {/* 🌟 一鍵無障礙友善模式快捷鈕 */}
          <button
            onClick={toggleAccessibilityFriendlyMode}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col items-center ${
              accessibilityFriendlyMode
                ? 'bg-amber-400 border-amber-300 text-stone-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-stone-200/80 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700/60 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
            }`}
            title={accessibilityFriendlyMode ? '已啟用無障礙友善模式（點擊關閉）' : '一鍵開啟無障礙友善模式（大字體+高對比+平穩動態）'}
            aria-label="一鍵切換無障礙友善模式"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[8.5px] mt-0.5 font-sans font-bold">
              友善
            </span>
          </button>

          <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700/60 my-0.5" />

          {/* 亮度直覺微調搖桿鈕 (Vertical Brightness Stepper) */}
          <div className="flex flex-col items-center bg-stone-200/90 dark:bg-stone-800/80 rounded-xl p-1 border border-stone-300 dark:border-stone-700/60 gap-1">
            <button
              onClick={() => stepBrightness(0.1)}
              disabled={spotlightIntensity >= 1}
              className="p-1 rounded-md text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="亮度調高 10%"
              aria-label="亮度調高"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setIsSideDockExpanded(true)}
              title="點擊展開調光面板"
            >
              <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-200 mt-0.5">
                {brightnessPercent}%
              </span>
            </div>
            <button
              onClick={() => stepBrightness(-0.1)}
              disabled={spotlightIntensity <= 0}
              className="p-1 rounded-md text-stone-400 hover:text-amber-300 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="亮度調低 10%"
              aria-label="亮度調低"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-4 h-[1px] bg-stone-700/60 my-0.5" />

          {/* 字體大小快調 (Horizontal Font Stepper) */}
          <div className="flex flex-col items-center bg-stone-200/90 dark:bg-stone-800/80 rounded-xl p-1 border border-stone-300 dark:border-stone-700/60 gap-1">
            <button
              onClick={() => stepTextSize('up')}
              disabled={textSize === 'xlarge'}
              className="p-1 rounded-md text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="字體放大"
              aria-label="字體放大"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setIsSideDockExpanded(true)}
              title="點擊展開字體面板"
            >
              <Type className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-200 mt-0.5">
                {textSize === 'normal' ? '100%' : textSize === 'medium' ? '110%' : textSize === 'large' ? '122%' : '135%'}
              </span>
            </div>
            <button
              onClick={() => stepTextSize('down')}
              disabled={textSize === 'normal'}
              className="p-1 rounded-md text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="字體縮小"
              aria-label="字體縮小"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700/60 my-0.5" />

          {/* 鼠標光效果簡易開關 (Cursor Light Toggle) */}
          <button
            onClick={() => {
              const next = !useTheatricalCursor;
              setUseTheatricalCursor(next);
              announce(next ? '已開啟典雅劇院光標（精準十字微刻度）' : '已切換為原生系統游標');
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col items-center ${
              useTheatricalCursor
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-stone-200/80 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            title={useTheatricalCursor ? '劇院精準光標：已開啟（點擊切換為原生游標）' : '劇院精準光標：已關閉（點擊開啟）'}
            aria-label="切換劇院精準光標"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="text-[8.5px] mt-0.5 font-sans font-medium">
              {useTheatricalCursor ? '劇光標' : '原生標'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                useTheatricalCursor ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-stone-400 dark:bg-stone-600'
              }`}
            />
          </button>

          <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700/60 my-0.5" />

          {/* 2026 24601 Escape Game Quick Trigger */}
          {onOpenGame && (
            <>
              <button
                onClick={onOpenGame}
                className="p-1.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col items-center bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                title="開啟《悲慘世界：24601 街壘逃脫》小遊戲"
                aria-label="開啟街壘逃脫小遊戲"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                <span className="text-[8.5px] mt-0.5 font-sans font-bold">遊戲</span>
              </button>
              <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700/60 my-0.5" />
            </>
          )}

          {/* 隱藏至邊緣按鈕 */}
          <button
            onClick={handleToggleFold}
            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 transition-all cursor-pointer"
            title="暫時縮至左側邊緣"
            aria-label="暫時收合側邊列"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. 展開式雙軸搖桿與極簡控制抽屜 (Expanded Intuitive Joystick Console) */}
      <AnimatePresence>
        {isSideDockExpanded && (
          <>
            {/* 遮罩背景 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSideDockExpanded(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
              aria-hidden="true"
            />

            {/* 抽屜本體 */}
            <motion.div
              ref={drawerRef}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-84 sm:w-92 bg-[var(--theme-card-bg)] text-[var(--theme-text-primary)] border-r border-amber-500/40 shadow-2xl backdrop-blur-2xl z-50 flex flex-col overflow-y-auto"
            >
              {/* 頂部標題與工具欄 */}
              <div className="p-4 border-b border-stone-800/80 flex items-center justify-between sticky top-0 bg-stone-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-serif-tc font-bold text-amber-300">
                      觀演舒適與動態控制
                    </h2>
                    <p className="text-[11px] text-stone-400">
                      上下推調亮度・左右推調字體
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      resetToDefaults();
                      announce('已復位為標準設置 (標準字體 100%、劇院打光 75%)');
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-all cursor-pointer"
                    title="重設為預設值 (字體 100%、打光 75%)"
                    aria-label="重設為預設值"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsSideDockExpanded(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all cursor-pointer"
                    title="關閉面板 (ESC)"
                    aria-label="關閉控制面板"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 內容區：直觀搖桿 + 兩大純粹無障礙功能 */}
              <div className="p-4 space-y-4 flex-1">

                {/* 🌟 無障礙友善模式 Master Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  accessibilityFriendlyMode 
                    ? 'bg-amber-950/50 border-amber-500/80 shadow-md' 
                    : 'bg-stone-800/60 border-stone-700/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        accessibilityFriendlyMode ? 'bg-amber-400 text-stone-950' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-200">無障礙友善模式</div>
                        <div className="text-[10px] text-stone-400">大字體・高對比・平穩視效</div>
                      </div>
                    </div>

                    <button
                      onClick={toggleAccessibilityFriendlyMode}
                      role="switch"
                      aria-checked={accessibilityFriendlyMode}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        accessibilityFriendlyMode
                          ? 'bg-amber-400 text-stone-950 font-black'
                          : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                      }`}
                    >
                      {accessibilityFriendlyMode ? '已開啟' : '開啟'}
                    </button>
                  </div>
                </div>

                {/* ═══ 核心模組：金屬觸感雙軸搖桿 ═══ */}
                <section className="bg-stone-950/60 p-4 rounded-2xl border border-amber-500/30 shadow-inner flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>直觀雙軸微調盤</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">
                      支援拖曳 / 點擊 / 鍵盤方向鍵
                    </span>
                  </div>

                  {/* 搖桿組件 */}
                  <TheatricalJoystick />

                  <div className="mt-3 text-[11px] text-stone-400 text-center leading-relaxed">
                    💡 <span className="text-amber-200">上下推</span> 調光度 ｜ 🔤 <span className="text-amber-200">左右推</span> 調大小 ｜ 鬆手自動彈回
                  </div>
                </section>

                {/* ═══ 功能一：字體大小直選尺規 ═══ */}
                <section className="space-y-2.5 bg-stone-800/40 p-3.5 rounded-xl border border-stone-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-stone-200">字體大小快速直選</span>
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                      {textSize === 'normal' ? '標準 100%' : textSize === 'large' ? '舒適 112%' : '特大 125%'}
                    </span>
                  </div>

                  {/* 三段直選按鈕 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mode: 'normal' as TextSizeMode, label: '標準', scale: '100%' },
                      { mode: 'large' as TextSizeMode, label: '舒適', scale: '112%' },
                      { mode: 'xlarge' as TextSizeMode, label: '特大', scale: '125%' },
                    ].map((item) => {
                      const isActive = textSize === item.mode;
                      return (
                        <button
                          key={item.mode}
                          onClick={() => {
                            setTextSize(item.mode);
                            announce(`字體已設為：${item.label} (${item.scale})`);
                          }}
                          className={`py-2 px-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isActive
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                              : 'bg-stone-800/80 border-stone-700/60 text-stone-300 hover:border-stone-500 hover:text-stone-100'
                          }`}
                        >
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-[10px] text-stone-400 font-mono mt-0.5">{item.scale}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 即時排版文字預覽框 */}
                  <div className="mt-1 p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80">
                    <p className="font-serif-tc text-amber-100/90 leading-relaxed text-sm">
                      「即使在最黑的夜，黎明也終將降臨。」
                    </p>
                  </div>
                </section>

                {/* ═══ 功能二：打光與亮度調整 ═══ */}
                <section className="space-y-2.5 bg-stone-800/40 p-3.5 rounded-xl border border-stone-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-stone-200">打光亮度快速直選</span>
                    </div>
                    <span className="font-mono text-amber-300 font-bold text-xs">
                      {brightnessPercent}%
                    </span>
                  </div>

                  {/* 滑桿調節 */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={spotlightIntensity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSpotlightIntensity(val);
                    }}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-700 rounded-lg"
                    aria-label="追光燈亮度強度滑桿"
                  />

                  {/* 常用檔位直選 */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { label: '關閉', val: 0 },
                      { label: '柔和', val: 0.35 },
                      { label: '劇院', val: 0.75 },
                      { label: '全亮', val: 1.0 },
                    ].map((preset) => {
                      const isMatch = Math.abs(spotlightIntensity - preset.val) < 0.08;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            setSpotlightIntensity(preset.val);
                            announce(`打光亮度已設為：${preset.label} (${Math.round(preset.val * 100)}%)`);
                          }}
                          className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : 'bg-stone-800/80 border-stone-700/60 text-stone-300 hover:text-stone-100 hover:border-stone-500'
                          }`}
                        >
                          <div className="text-xs">{preset.label}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {Math.round(preset.val * 100)}%
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ═══ 典雅劇院光標開關 ═══ */}
                <section className="bg-stone-800/40 p-3.5 rounded-xl border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <MousePointer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-200">典雅劇院光標</div>
                      <p className="text-[11px] text-stone-400">零眩光・十字精密微刻度光環</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const next = !useTheatricalCursor;
                      setUseTheatricalCursor(next);
                      announce(next ? '已開啟典雅劇院光標' : '已恢復原生系統游標');
                    }}
                    role="switch"
                    aria-checked={useTheatricalCursor}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useTheatricalCursor ? 'bg-amber-500' : 'bg-stone-700'
                    }`}
                    title={useTheatricalCursor ? '點擊關閉劇院光標（恢復原生游標）' : '點擊開啟劇院光標'}
                    aria-label="切換典雅劇院光標"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        useTheatricalCursor ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </section>

                {/* ═══ 檢視 WCAG 2.1 AA 研究確認手冊 ═══ */}
                <button
                  onClick={() => {
                    setIsSideDockExpanded(false);
                    openResearchModal();
                  }}
                  className="w-full p-3 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 border border-amber-500/30 text-stone-200 flex items-center justify-between text-xs font-serif-tc font-bold transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>查看 WCAG 2.1 AA 無障礙研究手冊</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* ═══ 重現劇院大幕開場與電影光芒 ═══ */}
                {onReplayCurtainIntro && (
                  <button
                    onClick={() => {
                      setIsSideDockExpanded(false);
                      onReplayCurtainIntro();
                    }}
                    className="w-full p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 flex items-center justify-between text-xs font-serif-tc font-bold transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>重現大幕開場與電影光芒</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* ═══ 隱藏彩蛋：尚萬強大逃亡 24601 ═══ */}
                {onOpenGame && (
                  <button
                    onClick={() => {
                      setIsSideDockExpanded(false);
                      onOpenGame();
                    }}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-600/25 via-amber-500/20 to-red-950/30 hover:from-amber-600/40 hover:to-red-900/40 border border-amber-500/50 text-amber-200 flex items-center justify-between text-xs font-serif-tc font-bold transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                      <span>🎮 隱藏遊戲：尚萬強大逃亡 (24601 Run)</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                      ARCADE
                    </span>
                  </button>
                )}

              </div>

              {/* 底部說明 */}
              <div className="p-3.5 border-t border-stone-800/80 bg-stone-900/90 text-center">
                <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>純粹專注直覺設定・即調即生效</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </aside>
  );
};
