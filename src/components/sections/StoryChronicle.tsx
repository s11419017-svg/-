import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronLeft, ChevronRight, Bookmark, Sparkles, Feather, Quote, Compass, X, Volume2, ArrowRight } from 'lucide-react';
import { BOOK_PAGES, BookPage } from '../../data/storyChronicleData';
import { ambientSynth } from '../../utils/audioSynth';

interface StoryChronicleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryChronicleDrawer: React.FC<StoryChronicleDrawerProps> = ({ isOpen, onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const currentPage: BookPage = BOOK_PAGES[currentPageIndex];

  // Touch Swipe Gesture Handlers for Mobile Manuscript Reading
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    setTouchStartX(null);

    // Swipe Threshold: 50px
    if (deltaX < -50) {
      handleNextPage();
    } else if (deltaX > 50) {
      handlePrevPage();
    }
  };

  // Lock background scroll when drawer is open & enable keyboard shortcuts
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => {
          if (prev < BOOK_PAGES.length - 1) {
            ambientSynth.playPageFlipSFX();
            return prev + 1;
          }
          return prev;
        });
      } else if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => {
          if (prev > 0) {
            ambientSynth.playPageFlipSFX();
            return prev - 1;
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNextPage = () => {
    if (currentPageIndex < BOOK_PAGES.length - 1) {
      ambientSynth.playPageFlipSFX();
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      ambientSynth.playPageFlipSFX();
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleSelectChapter = (index: number) => {
    if (index !== currentPageIndex) {
      ambientSynth.playPageFlipSFX();
      setCurrentPageIndex(index);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 cursor-pointer"
          />

          {/* Slide-Over Drawer Panel (Hardware Accelerated) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-chronicle-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-[#171412] text-[#f5f5f4] border-l-2 border-[#8c2d2d] shadow-2xl z-50 flex flex-col overflow-hidden transform-gpu"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 bg-[#211b17] border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#8c2d2d]/30 border border-[#8c2d2d] text-amber-300 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-sans tracking-[0.2em] text-amber-400 uppercase font-bold">
                    <Feather className="w-3 h-3 text-[#8c2d2d]" aria-hidden="true" />
                    <span>Story Chronicle & Historical Guide</span>
                  </div>
                  <h3 id="story-chronicle-title" className="font-cinzel text-lg sm:text-xl font-bold text-[#f5f5f4] tracking-tight">
                    《悲慘世界》故事大綱與歷史篇章導讀
                  </h3>
                </div>
              </div>

              {/* Close Button & Sound Indicator */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => ambientSynth.playPageFlipSFX()}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition-colors hidden sm:flex items-center gap-1 text-xs font-sans focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="試聽紙張翻頁擬真音效"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span className="text-[11px] text-stone-300">紙張音效</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-stone-800/80 hover:bg-[#8c2d2d] text-stone-300 hover:text-white transition-all border border-stone-700 focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="關閉故事篇章導讀視窗 (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Chapter Selector Bar */}
            <div className="px-4 py-2 bg-[#1a1512] border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin shrink-0" role="tablist" aria-label="章節選擇分頁">
              <span className="text-[11px] font-sans text-amber-400/90 font-bold tracking-wider shrink-0 mr-1">
                章節選擇：
              </span>
              {BOOK_PAGES.map((page, idx) => (
                <button
                  key={page.pageNumber}
                  role="tab"
                  aria-selected={currentPageIndex === idx}
                  aria-label={`切換至第 ${page.pageNumber} 頁：${page.chapterTitleZh}`}
                  onClick={() => handleSelectChapter(idx)}
                  className={`px-3 py-1 text-xs font-serif-tc font-bold rounded-sm transition-all whitespace-nowrap flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    currentPageIndex === idx
                      ? 'bg-[#8c2d2d] text-amber-100 border-amber-400/60 shadow-md'
                      : 'bg-[#261f1a] text-stone-300 hover:text-white border-stone-800'
                  }`}
                >
                  <Bookmark className={`w-3 h-3 ${currentPageIndex === idx ? 'text-amber-300' : 'text-stone-400'}`} aria-hidden="true" />
                  <span>{page.chapterTitleEn}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Drawer Body with Vintage Leather Book Cover */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 touch-scroll"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative rounded-lg p-3 sm:p-6 bg-gradient-to-b from-[#2a1d17] via-[#1f1510] to-[#150d0a] border-2 border-[#523d2f] shadow-2xl">
                {/* Brass Corner Decorative Accents */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-500/60 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-500/60 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-500/60 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-500/60 rounded-br-sm pointer-events-none" />

                {/* Aged Parchment Book Spread */}
                <div className="relative min-h-[520px] bg-[#f2ebd9] text-stone-900 rounded-sm p-5 sm:p-8 border border-[#d6c7a7] overflow-hidden shadow-inner">
                  {/* Parchment Texture Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#8c2d2d_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage.pageNumber}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10"
                    >
                      {/* Left Side: Chapter Title, Quote, Drop Cap Story */}
                      <div className="space-y-5 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-[#d6c7a7]/80 pb-6 md:pb-0">
                        <div className="space-y-3">
                          <div className="border-b-2 border-[#8c2d2d]/30 pb-2.5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-sans tracking-[0.2em] text-[#8c2d2d] uppercase font-bold">
                                {currentPage.chapterTitleEn} • PAGE {currentPage.pageNumber}
                              </span>
                              <h4 className="font-serif-tc text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
                                {currentPage.chapterTitleZh}
                              </h4>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[#8c2d2d] text-amber-200 border border-amber-400/60 shadow-md flex items-center justify-center font-cinzel text-xs font-bold shrink-0">
                              24601
                            </div>
                          </div>

                          <div className="text-xs font-sans text-stone-600 font-bold flex items-center gap-1.5 bg-[#e6ddc5] px-2.5 py-1 rounded-sm border border-[#d6c7a7]">
                            <Compass className="w-3.5 h-3.5 text-[#8c2d2d]" />
                            <span>年代與地點：{currentPage.yearSetting}</span>
                          </div>

                          <div className="p-3 bg-[#e8e0ca] border-l-4 border-l-[#8c2d2d] rounded-r-sm space-y-1 shadow-sm">
                            <div className="flex items-center gap-1 text-stone-700 text-xs italic font-serif">
                              <Quote className="w-3 h-3 text-[#8c2d2d] shrink-0" />
                              <span>"{currentPage.quoteEn}"</span>
                            </div>
                            <p className="text-xs font-serif-tc font-semibold text-stone-800">
                              「{currentPage.quoteZh}」
                            </p>
                          </div>

                          <div className="space-y-2.5 font-serif-tc text-xs sm:text-sm text-stone-800 leading-relaxed text-justify">
                            {currentPage.contentZh.map((paragraph, pIdx) => {
                              if (pIdx === 0) {
                                return (
                                  <p key={pIdx} className="first-letter:float-left first-letter:text-3xl first-letter:font-bold first-letter:font-serif-tc first-letter:text-[#8c2d2d] first-letter:mr-2 first-letter:px-2 first-letter:bg-[#e6ddc5] first-letter:border first-letter:border-[#8c2d2d]/40 first-letter:rounded-sm">
                                    {paragraph}
                                  </p>
                                );
                              }
                              return <p key={pIdx}>{paragraph}</p>;
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-sans font-bold text-stone-500 uppercase tracking-widest block mb-1">
                            核心主題 (Key Themes)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentPage.keyThemes.map((theme, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 bg-[#8c2d2d]/15 text-[#8c2d2d] border border-[#8c2d2d]/30 text-[11px] font-serif-tc font-bold rounded-sm"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Illustration & Historical Context */}
                      <div className="space-y-5 flex flex-col justify-between pl-0 md:pl-2">
                        <div className="space-y-4">
                          {currentPage.illustrationUrl && (
                            <div className="space-y-1.5">
                              <div className="aspect-[16/10] rounded-sm overflow-hidden border border-[#d6c7a7] shadow-md relative bg-stone-900">
                                <img
                                  src={currentPage.illustrationUrl}
                                  alt={currentPage.illustrationCaption ? `《悲慘世界》${currentPage.chapterTitleZh}插圖：${currentPage.illustrationCaption}` : `《悲慘世界》${currentPage.chapterTitleZh}歷史經典插圖`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover sepia-[0.35] contrast-105"
                                />
                              </div>
                              {currentPage.illustrationCaption && (
                                <p className="text-[11px] font-serif-tc text-stone-700 text-center italic font-medium">
                                  ▲ {currentPage.illustrationCaption}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="p-3 bg-[#e6ddc5] border border-[#d6c7a7] rounded-sm space-y-1 shadow-inner">
                            <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[#8c2d2d] uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>雨果原著歷史背景</span>
                            </div>
                            <p className="text-xs font-serif-tc text-stone-800 leading-relaxed">
                              {currentPage.historicalContext}
                            </p>
                          </div>
                        </div>

                        {/* Pagination Footer Controls */}
                        <div className="pt-3 border-t border-[#d6c7a7] flex items-center justify-between">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPageIndex === 0}
                            aria-label="閱讀上一頁篇章"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-sm font-sans text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              currentPageIndex === 0
                                ? 'opacity-30 cursor-not-allowed text-stone-500'
                                : 'bg-[#e6ddc5] text-stone-900 hover:bg-[#8c2d2d] hover:text-white border border-[#d6c7a7]'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>上一頁</span>
                          </button>

                          <div className="text-xs font-serif-tc font-bold text-stone-800">
                            第 {currentPage.pageNumber} / {BOOK_PAGES.length} 頁
                          </div>

                          <button
                            onClick={handleNextPage}
                            disabled={currentPageIndex === BOOK_PAGES.length - 1}
                            aria-label="閱讀下一頁篇章"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-sm font-sans text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              currentPageIndex === BOOK_PAGES.length - 1
                                ? 'opacity-30 cursor-not-allowed text-stone-500'
                                : 'bg-[#8c2d2d] text-white hover:bg-[#a13535] shadow-md'
                            }`}
                          >
                            <span>下一頁</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StoryChronicleDrawer;
