import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Sun, 
  Type, 
  RotateCcw, 
  Check, 
  Sparkles, 
  MousePointer, 
  ShieldCheck, 
  ChevronRight, 
  Glasses,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility, TextSizeMode } from '../../context/AccessibilityContext';
import { TheatricalJoystick } from '../ui/TheatricalJoystick';

interface AccessibilitySettingsModalProps {
  isLightMode: boolean;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = () => {
  const {
    isSettingsOpen,
    closeSettings,
    openResearchModal,
    accessibilityFriendlyMode,
    toggleAccessibilityFriendlyMode,
    seniorFriendlyMode,
    toggleSeniorFriendlyMode,
    spotlightIntensity,
    setSpotlightIntensity,
    textSize,
    setTextSize,
    useTheatricalCursor,
    setUseTheatricalCursor,
    resetToDefaults,
    announce,
  } = useAccessibility();

  const [showAdvancedJoystick, setShowAdvancedJoystick] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  const currentBrightnessPct = Math.round(spotlightIntensity * 100);

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-[var(--theme-card-bg)] border border-[var(--theme-card-border)] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-[var(--theme-text-primary)]"
          >
            {/* Header: Respectful, Theatrical & Clear */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-card-border)] bg-stone-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="a11y-modal-title" className="text-base font-bold font-serif-tc text-[var(--theme-text-primary)]">
                    觀演輔助與閱讀舒適設定
                  </h2>
                  <p className="text-xs text-[var(--theme-text-muted)] font-sans">
                    依個人視力與偏好自訂・字級放大與打光調節
                  </p>
                </div>
              </div>

              <button
                onClick={closeSettings}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="關閉觀演舒適設定"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* 1. 字體大小快速選擇 (最實用核心功能置頂) */}
              <div className="p-4 rounded-xl bg-black/20 border border-[var(--theme-card-border)] space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-[var(--theme-text-primary)]">
                    <Type className="w-4 h-4 text-amber-400" />
                    <span>字體大小調整</span>
                  </div>
                  <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {textSize === 'normal' ? '標準 (100%)' : textSize === 'medium' ? '舒適 (110%)' : textSize === 'large' ? '清晰大字 (122%)' : '樂齡尊榮 (135%)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '標準 100%', val: 'normal' as TextSizeMode },
                    { label: '微調 110%', val: 'medium' as TextSizeMode },
                    { label: '清晰 122%', val: 'large' as TextSizeMode },
                    { label: '尊榮 135%', val: 'xlarge' as TextSizeMode },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setTextSize(item.val);
                        announce(`字體大小已設定為 ${item.label}`);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                        textSize === item.val
                          ? 'bg-amber-500/25 border-2 border-amber-400 text-amber-300 font-bold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border border-stone-700/50 text-stone-300'
                      }`}
                    >
                      {textSize === item.val && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 🌟 友善閱讀與大字尊榮模式 (Respectful Presentation) */}
              <div className={`p-4 rounded-xl border transition-all ${
                seniorFriendlyMode 
                  ? 'bg-amber-900/30 border-amber-400 shadow-md ring-1 ring-amber-400/30' 
                  : 'bg-black/20 border-[var(--theme-card-border)]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      seniorFriendlyMode ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      <Glasses className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-200">樂齡友善・尊榮閱讀模式</div>
                      <p className="text-[11px] text-stone-400">125%特大字、加大按鈕觸控區、安定防眩光</p>
                    </div>
                  </div>

                  <button
                    onClick={toggleSeniorFriendlyMode}
                    role="switch"
                    aria-checked={seniorFriendlyMode}
                    aria-label="切換樂齡友善尊榮閱讀模式"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      seniorFriendlyMode ? 'bg-amber-400' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                        seniorFriendlyMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 3. 劇場追光與舞台氛圍打光亮度 */}
              <div className="p-4 rounded-xl bg-black/20 border border-[var(--theme-card-border)] space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-[var(--theme-text-primary)]">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>舞台追光打光亮度</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {currentBrightnessPct}%
                  </span>
                </div>

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
                  className="w-full h-2 bg-stone-700/60 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  aria-label="追光燈強度滑桿"
                />

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '關閉', val: 0 },
                    { label: '柔和', val: 0.35 },
                    { label: '劇院 (預設)', val: 0.75 },
                    { label: '全亮', val: 1.0 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => {
                        setSpotlightIntensity(preset.val);
                        announce(`追光燈設為 ${preset.label}`);
                      }}
                      className={`py-1.5 px-1 text-[11px] rounded transition-all cursor-pointer text-center truncate ${
                        Math.abs(spotlightIntensity - preset.val) < 0.08
                          ? 'bg-amber-500 text-stone-950 font-bold shadow'
                          : 'bg-white/5 hover:bg-white/10 text-stone-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 典雅劇院精準光標 */}
              <div className="p-3.5 rounded-xl bg-black/20 border border-[var(--theme-card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <MousePointer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-200">典雅劇院精準光標</div>
                    <p className="text-[10px] text-stone-400">零眩光・十字刻度追焦微光環與按鈕吸附</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const next = !useTheatricalCursor;
                    setUseTheatricalCursor(next);
                    announce(next ? '已開啟典雅劇院精準光標' : '已切換為原生系統游標');
                  }}
                  role="switch"
                  aria-checked={useTheatricalCursor}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    useTheatricalCursor ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                  title={useTheatricalCursor ? '點擊切換為原生系統游標' : '點擊開啟典雅劇院光標'}
                  aria-label="切換劇院精準光標"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      useTheatricalCursor ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 5. 可選的進階搖桿控制器 (以摺疊形式存在，不突兀) */}
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-black/30">
                <button
                  onClick={() => setShowAdvancedJoystick(!showAdvancedJoystick)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer font-sans"
                >
                  <span>進階微調：雙軸即時感應控制器</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvancedJoystick ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {showAdvancedJoystick && (
                  <div className="p-4 border-t border-stone-800 flex flex-col items-center bg-stone-950/80">
                    <TheatricalJoystick />
                    <p className="text-[11px] text-stone-400 text-center mt-2">
                      💡 上下推動調節亮度 ｜ 🔤 左右推動調節字級
                    </p>
                  </div>
                )}
              </div>

              {/* 6. 查看 WCAG 2.1 AA 無障礙檢驗標準 */}
              <button
                onClick={() => {
                  closeSettings();
                  openResearchModal();
                }}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-stone-900 to-[#221c17] hover:from-stone-800 hover:to-[#2d241e] border border-amber-500/25 text-stone-300 flex items-center justify-between text-xs font-serif-tc font-bold transition-all cursor-pointer group shadow"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>檢視本站 WCAG 2.1 AA 友善觀演承諾與檢驗</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--theme-card-border)] bg-stone-900/40">
              <button
                onClick={() => {
                  resetToDefaults();
                  announce('已復位至標準設置');
                }}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重設回預設值</span>
              </button>

              <button
                onClick={closeSettings}
                className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold font-sans transition-all shadow-md cursor-pointer"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

