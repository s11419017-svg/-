import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronDown,
  ChevronUp,
  X,
  Headphones,
  Eye,
  Subtitles,
  Gauge,
  UserCheck,
  Minimize2,
  Maximize2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ACCESSIBLE_TOUR_STOPS, TourStop } from '../../data/accessibleTourData';
import { azureSpeechService, NARRATOR_VOICES } from '../../services/azureSpeechService';

interface AccessibleAudioTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const AccessibleAudioTour: React.FC<AccessibleAudioTourProps> = ({
  isOpen,
  onClose,
  onOpen,
}) => {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'0.8x' | '1.0x' | '1.25x' | '1.5x'>('1.0x');
  const [selectedVoice, setSelectedVoice] = useState<string>(NARRATOR_VOICES.zhTW_Female.azureVoice);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  const currentStop: TourStop = ACCESSIBLE_TOUR_STOPS[currentStopIndex] || ACCESSIBLE_TOUR_STOPS[0];
  const containerRef = useRef<HTMLDivElement>(null);

  // Announce status changes to Screen Readers
  const announce = useCallback((message: string) => {
    setStatusAnnouncement(message);
    const timer = setTimeout(() => setStatusAnnouncement(''), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to targeted page section smoothly
  const scrollToStopSection = useCallback((sectionId: string) => {
    try {
      let targetEl = document.getElementById(sectionId);
      if (!targetEl) {
        targetEl = document.querySelector(`[data-section="${sectionId}"]`);
      }
      if (!targetEl && sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetEl.classList.add(
          'ring-2',
          'ring-amber-400/80',
          'ring-offset-2',
          'ring-offset-stone-950',
          'transition-all',
          'duration-500'
        );
        setTimeout(() => {
          targetEl?.classList.remove('ring-2', 'ring-amber-400/80', 'ring-offset-2', 'ring-offset-stone-950');
        }, 3000);
      }
    } catch (e) {
      console.warn('Scroll navigation warning:', e);
    }
  }, []);

  // Stop playback cleanly
  const handleStop = useCallback(() => {
    azureSpeechService.stop();
    setIsPlaying(false);
    announce('已暫停語音導覽');
  }, [announce]);

  // Play current tour stop
  const handlePlay = useCallback(
    async (stopIndexToPlay = currentStopIndex) => {
      const stop = ACCESSIBLE_TOUR_STOPS[stopIndexToPlay];
      if (!stop) return;

      setIsPlaying(true);
      scrollToStopSection(stop.targetSectionId);
      announce(`正在播報第 ${stop.stepNumber} 站：${stop.title}`);

      const rateMap = {
        '0.8x': '-20%',
        '1.0x': '0%',
        '1.25x': '+25%',
        '1.5x': '+50%',
      };

      await azureSpeechService.speak({
        text: stop.audioNarration,
        voice: selectedVoice,
        lang: 'zh-TW',
        rate: rateMap[playbackSpeed],
        onStart: () => {
          setIsPlaying(true);
        },
        onEnded: () => {
          setIsPlaying(false);
          announce(`第 ${stop.stepNumber} 站導覽播報結束`);
        },
        onError: (err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
          announce('語音播放已中斷');
        },
      });
    },
    [currentStopIndex, playbackSpeed, selectedVoice, scrollToStopSection, announce]
  );

  // Jump to Next Stop
  const handleNextStop = useCallback(() => {
    const nextIdx = (currentStopIndex + 1) % ACCESSIBLE_TOUR_STOPS.length;
    setCurrentStopIndex(nextIdx);
    if (isPlaying) {
      handlePlay(nextIdx);
    } else {
      scrollToStopSection(ACCESSIBLE_TOUR_STOPS[nextIdx].targetSectionId);
      announce(`切換至第 ${nextIdx + 1} 站：${ACCESSIBLE_TOUR_STOPS[nextIdx].title}`);
    }
  }, [currentStopIndex, isPlaying, handlePlay, scrollToStopSection, announce]);

  // Jump to Previous Stop
  const handlePrevStop = useCallback(() => {
    const prevIdx = (currentStopIndex - 1 + ACCESSIBLE_TOUR_STOPS.length) % ACCESSIBLE_TOUR_STOPS.length;
    setCurrentStopIndex(prevIdx);
    if (isPlaying) {
      handlePlay(prevIdx);
    } else {
      scrollToStopSection(ACCESSIBLE_TOUR_STOPS[prevIdx].targetSectionId);
      announce(`切換至第 ${prevIdx + 1} 站：${ACCESSIBLE_TOUR_STOPS[prevIdx].title}`);
    }
  }, [currentStopIndex, isPlaying, handlePlay, scrollToStopSection, announce]);

  // Close tour handler
  const handleClose = useCallback(() => {
    handleStop();
    onClose();
    announce('已關閉語音導覽');
  }, [handleStop, onClose, announce]);

  // Global accessibility keyboard navigation (Alt+A, Space, [, ], Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.getAttribute('contenteditable')) {
        return;
      }

      // Alt + A: Toggle Audio Tour
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          onOpen();
          announce('已開啟語音導覽');
        }
        return;
      }

      if (!isOpen) return;

      // Space: Toggle Play/Pause
      if (e.code === 'Space' && (e.target === document.body || e.target === containerRef.current)) {
        e.preventDefault();
        if (isPlaying) {
          handleStop();
        } else {
          handlePlay(currentStopIndex);
        }
        return;
      }

      // Bracket keys: Prev/Next
      if (e.key === '[') {
        e.preventDefault();
        handlePrevStop();
      } else if (e.key === ']') {
        e.preventDefault();
        handleNextStop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, currentStopIndex, handlePlay, handleStop, handleNextStop, handlePrevStop, handleClose, onOpen, announce]);

  // When tour is completely closed, do NOT render floating sticky buttons that block the page!
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Hidden ARIA Live region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {statusAnnouncement}
      </div>

      {/* Floating Audio Tour Player */}
      <div
        ref={containerRef}
        id="accessible-audio-tour-console"
        role="region"
        aria-label="全劇口述語音導覽播放器"
        className={`fixed z-50 transition-all duration-300 select-none ${
          isMinimized
            ? 'bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-80 shadow-2xl'
            : 'bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] max-w-full sm:max-w-[calc(100vw-3rem)] shadow-2xl'
        }`}
      >
        <div className={`bg-stone-950/95 border-2 border-amber-500/60 backdrop-blur-2xl text-stone-100 font-sans ${
          isMinimized 
            ? 'rounded-2xl p-3' 
            : 'rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto pb-safe'
        }`}>

          {/* 1. Header Bar: Chapter Title, Minimize & Clean Close Button */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-300 truncate">
                    全劇口述語音導覽
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                    {currentStop.stepNumber}/{ACCESSIBLE_TOUR_STOPS.length}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate">
                  {currentStop.title}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label={isMinimized ? '展開導覽面板' : '縮小為浮動播放列'}
                title={isMinimized ? '展開' : '縮小'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleClose}
                className="p-2 text-stone-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="完全關閉語音導覽 (Esc)"
                title="關閉語音導覽 (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Minimized Compact Player View */}
          {isMinimized ? (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="truncate flex-1">
                <span className="text-xs text-amber-200 font-medium block truncate">
                  {currentStop.title}
                </span>
                <span className="text-[10px] text-stone-400">{currentStop.durationApprox}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handlePrevStop}
                  className="p-2 text-stone-300 hover:text-amber-300 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors touch-manipulation cursor-pointer"
                  aria-label="上一章"
                  title="上一章"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => (isPlaying ? handleStop() : handlePlay(currentStopIndex))}
                  className="p-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow-md transition-transform active:scale-95 touch-manipulation cursor-pointer"
                  aria-label={isPlaying ? '暫停' : '播放'}
                  title={isPlaying ? '暫停' : '播放'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-stone-950" /> : <Play className="w-4 h-4 fill-stone-950" />}
                </button>
                <button
                  onClick={handleNextStop}
                  className="p-2 text-stone-300 hover:text-amber-300 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors touch-manipulation cursor-pointer"
                  aria-label="下一章"
                  title="下一章"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* 3. Full Expanded Elegant Player */
            <div className="space-y-3.5">
              {/* Progress Stations Dots */}
              <div>
                <div className="grid grid-cols-6 gap-1.5">
                  {ACCESSIBLE_TOUR_STOPS.map((stop, idx) => (
                    <button
                      key={stop.id}
                      onClick={() => {
                        setCurrentStopIndex(idx);
                        if (isPlaying) {
                          handlePlay(idx);
                        } else {
                          scrollToStopSection(stop.targetSectionId);
                          announce(`切換至第 ${idx + 1} 站：${stop.title}`);
                        }
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer touch-manipulation ${
                        idx === currentStopIndex
                          ? 'bg-amber-400 ring-2 ring-amber-500/50 scale-105'
                          : idx < currentStopIndex
                          ? 'bg-amber-600/70 hover:bg-amber-500'
                          : 'bg-stone-800 hover:bg-stone-700'
                      }`}
                      aria-label={`第 ${idx + 1} 站：${stop.title}`}
                      title={`第 ${idx + 1} 站：${stop.title}`}
                    />
                  ))}
                </div>
              </div>

              {/* Current Chapter Info Card */}
              <div className="bg-stone-900/60 border border-stone-800/90 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                      <span>{currentStop.title}</span>
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {currentStop.shortSummary}
                    </p>
                  </div>
                  <button
                    onClick={() => scrollToStopSection(currentStop.targetSectionId)}
                    className="px-2 py-1 text-[11px] bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-md border border-stone-700 flex items-center gap-1 shrink-0 transition-colors touch-manipulation cursor-pointer"
                    title="滾動頁面至該展區"
                    aria-label="頁面捲動至此展區"
                  >
                    <Eye className="w-3 h-3" />
                    <span>畫面定位</span>
                  </button>
                </div>

                {/* Subtitle Toggle & Content */}
                {showSubtitles && (
                  <div className="mt-2 pt-2 border-t border-stone-800 text-xs text-stone-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-stone-800/80 select-text max-h-32 overflow-y-auto">
                    {currentStop.audioNarration}
                  </div>
                )}
              </div>

              {/* Main Playback Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Previous Button */}
                <button
                  onClick={handlePrevStop}
                  className="p-3 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl border border-stone-800 transition-colors cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="上一站 ([)"
                  title="上一站 ([)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={() => (isPlaying ? handleStop() : handlePlay(currentStopIndex))}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-bold text-stone-950 shadow-lg transition-all transform active:scale-95 cursor-pointer touch-manipulation min-h-[44px] ${
                    isPlaying
                      ? 'bg-amber-400 hover:bg-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300'
                  }`}
                  aria-label={isPlaying ? '暫停播報 (空白鍵)' : '開始播放 (空白鍵)'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-stone-950" />
                      <span className="text-sm">暫停播報</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-stone-950" />
                      <span className="text-sm">播放導覽</span>
                    </>
                  )}
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextStop}
                  className="p-3 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl border border-stone-800 transition-colors cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="下一站 (])"
                  title="下一站 (])"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Quick Tools: Subtitle Toggle & Speed & Voice Settings */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2 text-xs">
                {/* Subtitles Button */}
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`py-1.5 px-2.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation min-h-[36px] ${
                    showSubtitles
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                  aria-label={showSubtitles ? '隱藏導覽文稿' : '顯示導覽文稿'}
                  title={showSubtitles ? '隱藏字幕' : '顯示字幕'}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>{showSubtitles ? '文稿已開' : '導覽文稿'}</span>
                </button>

                {/* Playback Speed Segment */}
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
                  {(['0.8x', '1.0x', '1.25x'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        if (isPlaying) {
                          handlePlay(currentStopIndex);
                        }
                      }}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer touch-manipulation ${
                        playbackSpeed === spd
                          ? 'bg-amber-500 text-stone-950 font-bold shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      aria-label={`語速 ${spd}`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>

                {/* Voice Selection Trigger */}
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className={`py-1.5 px-2 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer touch-manipulation min-h-[36px] ${
                    showVoiceSettings
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                  aria-label="切換音色"
                  title="選擇朗讀音色"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px]">音色</span>
                </button>
              </div>

              {/* Expandable Voice Selector Panel */}
              {showVoiceSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-1.5"
                >
                  <div className="text-[11px] text-stone-400 font-medium">選擇導覽員音色：</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: '曉臻女聲', val: NARRATOR_VOICES.zhTW_Female.azureVoice },
                      { label: '雲哲男聲', val: NARRATOR_VOICES.zhTW_Male.azureVoice },
                      { label: 'Sonia英文', val: NARRATOR_VOICES.enGB_Female.azureVoice },
                    ].map((v) => (
                      <button
                        key={v.val}
                        onClick={() => {
                          setSelectedVoice(v.val);
                          setShowVoiceSettings(false);
                          if (isPlaying) {
                            handlePlay(currentStopIndex);
                          }
                          announce(`已切換音色為 ${v.label}`);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-xs transition-all cursor-pointer touch-manipulation truncate ${
                          selectedVoice === v.val
                            ? 'bg-amber-500 text-stone-950 font-bold shadow'
                            : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
