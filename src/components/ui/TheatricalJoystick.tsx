import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sun, SunDim, Type, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAccessibility, TextSizeMode } from '../../context/AccessibilityContext';
import { triggerHaptic } from '../../utils/haptics';

interface TheatricalJoystickProps {
  className?: string;
  onActionAnnounce?: (msg: string) => void;
}

export const TheatricalJoystick: React.FC<TheatricalJoystickProps> = ({ className = '', onActionAnnounce }) => {
  const {
    spotlightIntensity,
    setSpotlightIntensity,
    textSize,
    setTextSize,
    stepTextSize,
    resetToDefaults,
    announce,
  } = useAccessibility();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeDirection, setActiveDirection] = useState<'up' | 'down' | 'left' | 'right' | 'center' | null>(null);

  // Maximum joystick throw radius in pixels
  const MAX_RADIUS = 36;
  const holdTimerRef = useRef<number | null>(null);
  const lastHorizontalStepRef = useRef<number>(0);
  const latestIntensityRef = useRef<number>(spotlightIntensity);

  useEffect(() => {
    latestIntensityRef.current = spotlightIntensity;
  }, [spotlightIntensity]);

  const handleAnnounce = useCallback((msg: string) => {
    announce(msg);
    if (onActionAnnounce) onActionAnnounce(msg);
  }, [announce, onActionAnnounce]);

  // Adjust brightness
  const adjustBrightness = useCallback((delta: number) => {
    setSpotlightIntensity(Math.min(1.0, Math.max(0, Math.round((spotlightIntensity + delta) * 20) / 20)));
    triggerHaptic('light');
  }, [spotlightIntensity, setSpotlightIntensity]);

  // Handle dragging math
  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS;
      dy = (dy / dist) * MAX_RADIUS;
    }

    setKnobPos({ x: dx, y: dy });

    // Normalized direction ratios (-1 to 1)
    const normX = dx / MAX_RADIUS;
    const normY = dy / MAX_RADIUS;

    // Detect dominant direction
    if (Math.abs(normY) > 0.45 && Math.abs(normY) >= Math.abs(normX)) {
      setActiveDirection(normY < 0 ? 'up' : 'down');
    } else if (Math.abs(normX) > 0.45) {
      setActiveDirection(normX > 0 ? 'right' : 'left');
    } else {
      setActiveDirection('center');
    }
  }, [MAX_RADIUS]);

  // Continuous hold loop while joystick is pushed in a direction
  useEffect(() => {
    if (!isDragging) {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      return;
    }

    // Horizontal trigger for font size (debounced step)
    const normX = knobPos.x / MAX_RADIUS;
    const now = Date.now();
    if (Math.abs(normX) > 0.55 && now - lastHorizontalStepRef.current > 420) {
      lastHorizontalStepRef.current = now;
      if (normX > 0) {
        stepTextSize('up');
        triggerHaptic('selection');
      } else {
        stepTextSize('down');
        triggerHaptic('selection');
      }
    }

    // Vertical continuous adjustment for brightness
    const normY = knobPos.y / MAX_RADIUS;
    if (Math.abs(normY) > 0.4) {
      if (!holdTimerRef.current) {
        holdTimerRef.current = window.setInterval(() => {
          const delta = normY < 0 ? 0.05 : -0.05;
          const current = latestIntensityRef.current;
          const next = Math.min(1.0, Math.max(0, Math.round((current + delta) * 20) / 20));
          setSpotlightIntensity(next);
          triggerHaptic('light');
        }, 120);
      }
    } else if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, [isDragging, knobPos, MAX_RADIUS, stepTextSize, setSpotlightIntensity]);

  // Pointer events on the Joystick Base
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    triggerHaptic('medium');
    updateJoystick(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setActiveDirection(null);
    setKnobPos({ x: 0, y: 0 }); // Spring back to center
    triggerHaptic('light');
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Keyboard accessibility support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        adjustBrightness(0.1);
        handleAnnounce(`亮度調高至 ${Math.round(Math.min(1, spotlightIntensity + 0.1) * 100)}%`);
        break;
      case 'ArrowDown':
        e.preventDefault();
        adjustBrightness(-0.1);
        handleAnnounce(`亮度調低至 ${Math.round(Math.max(0, spotlightIntensity - 0.1) * 100)}%`);
        break;
      case 'ArrowRight':
        e.preventDefault();
        stepTextSize('up');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        stepTextSize('down');
        break;
      case ' ':
      case 'Enter':
      case 'r':
      case 'R':
        e.preventDefault();
        resetToDefaults();
        handleAnnounce('已復位至標準字體與打光');
        break;
      default:
        break;
    }
  };

  const currentBrightnessPct = Math.round(spotlightIntensity * 100);

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      aria-label="劇院雙軸調控搖桿"
    >
      {/* 搖桿本體與外環引導 */}
      <div className="relative flex items-center justify-center p-3">
        {/* 外環方向導引標示 */}
        {/* 頂部：亮度增加 */}
        <button
          onClick={() => {
            adjustBrightness(0.1);
            handleAnnounce(`亮度調高至 ${Math.round(Math.min(1, spotlightIntensity + 0.1) * 100)}%`);
          }}
          className={`absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
            activeDirection === 'up'
              ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-stone-800/90 border-stone-700/80 text-amber-300/90 hover:bg-stone-700 hover:text-amber-200'
          }`}
          title="往上推或點擊：亮度增加 (▲ / 方向鍵上)"
          aria-label="亮度增加"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span className="font-mono">光+</span>
        </button>

        {/* 底部：亮度減弱 */}
        <button
          onClick={() => {
            adjustBrightness(-0.1);
            handleAnnounce(`亮度調低至 ${Math.round(Math.max(0, spotlightIntensity - 0.1) * 100)}%`);
          }}
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
            activeDirection === 'down'
              ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-stone-800/90 border-stone-700/80 text-amber-300/90 hover:bg-stone-700 hover:text-amber-200'
          }`}
          title="往下推或點擊：亮度減弱 (▼ / 方向鍵下)"
          aria-label="亮度減弱"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span className="font-mono">光-</span>
        </button>

        {/* 左側：字級縮小 */}
        <button
          onClick={() => stepTextSize('down')}
          disabled={textSize === 'normal'}
          className={`absolute top-1/2 -left-3 -translate-y-1/2 flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
            textSize === 'normal'
              ? 'opacity-30 border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed'
              : activeDirection === 'left'
              ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-stone-800/90 border-stone-700/80 text-amber-300/90 hover:bg-stone-700 hover:text-amber-200'
          }`}
          title="往左推或點擊：字體縮小 (◀ / 方向鍵左)"
          aria-label="字體縮小"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="font-mono">A-</span>
        </button>

        {/* 右側：字級放大 */}
        <button
          onClick={() => stepTextSize('up')}
          disabled={textSize === 'xlarge'}
          className={`absolute top-1/2 -right-3 -translate-y-1/2 flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
            textSize === 'xlarge'
              ? 'opacity-30 border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed'
              : activeDirection === 'right'
              ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold scale-105 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-stone-800/90 border-stone-700/80 text-amber-300/90 hover:bg-stone-700 hover:text-amber-200'
          }`}
          title="往右推或點擊：字體放大 (▶ / 方向鍵右)"
          aria-label="字體放大"
        >
          <span className="font-mono">A+</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* 搖桿底盤 (Interactive Joystick Basin) */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="slider"
          aria-label="直觀雙軸搖桿：上下調整亮度，左右調整字體大小"
          aria-valuetext={`亮度 ${currentBrightnessPct}%，字體 ${textSize}`}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-28 h-28 rounded-full bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-2 border-amber-500/40 shadow-[inset_0_4px_16px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none focus:outline-none focus:ring-2 focus:ring-amber-400/80"
        >
          {/* 十字十字刻度導引軌道 */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
          <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent pointer-events-none" />

          {/* 刻度同心圓環 */}
          <div className="absolute w-16 h-16 rounded-full border border-dashed border-stone-700/40 pointer-events-none" />

          {/* 搖桿握柄 (The 3D Tactile Rocker Knob) */}
          <motion.div
            animate={{
              x: isDragging ? knobPos.x : 0,
              y: isDragging ? knobPos.y : 0,
              scale: isDragging ? 1.08 : 1,
            }}
            transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', damping: 18, stiffness: 320 }}
            className="relative w-12 h-12 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #fef3c7 0%, #d97706 65%, #78350f 100%)',
              border: '2px solid #fbbf24',
            }}
          >
            {/* 握柄中央防滑同心雕花紋 */}
            <div className="w-6 h-6 rounded-full border border-amber-900/40 bg-gradient-to-b from-amber-400/30 to-amber-800/40 flex items-center justify-center shadow-inner">
              <div className="w-2 h-2 rounded-full bg-amber-200/90 shadow-[0_0_6px_#fef08a]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* 搖桿下方：直觀狀態反饋與單鍵復位 */}
      <div className="w-full mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 text-stone-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-amber-300 font-bold">{currentBrightnessPct}%</span>
          <span className="text-stone-500">|</span>
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-amber-300 font-bold">
            {textSize === 'normal' ? '100%' : textSize === 'large' ? '112%' : '125%'}
          </span>
        </div>

        <button
          onClick={() => {
            resetToDefaults();
            handleAnnounce('已復位為標準設置 (字體 100%、打光 75%)');
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-all cursor-pointer"
          title="中央復位：還原為標準 100% 字體與 75% 舞台打光"
          aria-label="復位為標準設置"
        >
          <RotateCcw className="w-3 h-3" />
          <span>復位</span>
        </button>
      </div>
    </div>
  );
};
