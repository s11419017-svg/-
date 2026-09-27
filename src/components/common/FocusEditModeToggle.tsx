import React from 'react';
import { Sparkles, Maximize2, Minimize2, Check } from 'lucide-react';
import { useFocusEdit } from '../../context/FocusEditContext';
import { ambientSynth } from '../../utils/audioSynth';

export const FocusEditModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isFocusModeActive, toggleFocusMode, dimIntensity, setDimIntensity, zoomScale, setZoomScale } = useFocusEdit();

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <button
        type="button"
        onClick={() => {
          ambientSynth.playButtonClickSFX();
          toggleFocusMode();
        }}
        className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
          isFocusModeActive
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
            : 'bg-stone-800 text-stone-400 border border-stone-700 hover:text-stone-200'
        }`}
        title="當點選編輯內容時，自動將畫面其餘元素暗化並放大置中"
      >
        <Sparkles className={`w-3.5 h-3.5 ${isFocusModeActive ? 'text-amber-400' : 'text-stone-500'}`} />
        <span>專注編輯模式：{isFocusModeActive ? '已啟用' : '已關閉'}</span>
      </button>
    </div>
  );
};
