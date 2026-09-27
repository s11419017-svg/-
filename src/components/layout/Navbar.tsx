import React, { useState, useEffect, memo } from 'react';
import { Volume2, VolumeX, Menu, X, Ticket, Music, MessageSquare, Sun, Moon, LayoutGrid, FileText, FileSpreadsheet, Sliders, Headphones, Glasses, Clapperboard, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ambientSynth, MusicTheme } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { rafThrottle } from '../../utils/throttle';
import { useAccessibility } from '../../context/AccessibilityContext';

interface NavbarProps {
  isLightMode: boolean;
  toggleTheme: () => void;
  viewMode: 'rich' | 'simple';
  onToggleViewMode: () => void;
  onOpenQuickTable?: () => void;
  onOpenChronicle?: () => void;
  onOpenAiLounge?: () => void;
  onOpenAccessibility?: () => void;
  onOpenAudioTour?: () => void;
  isAudioTourActive?: boolean;
  onReplayCurtainIntro?: () => void;
  onToggleSpatialSoundscape?: () => void;
  isSpatialSoundscapeActive?: boolean;
  onOpenGame?: () => void;
}

/**
 * 2026 Micro-State Isolated Scroll Progress Indicator
 * Renders independently to guarantee zero re-render overhead on the main Navbar tree.
 */
const ScrollProgressBar = memo(() => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let lastProgress = 0;

    const throttledProgress = rafThrottle(() => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      const totalHeight = (document.documentElement?.scrollHeight ?? 0) - window.innerHeight;
      const currentScroll = window.scrollY || 0;
      if (totalHeight > 0) {
        const newProgress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
        if (Math.abs(newProgress - lastProgress) >= 0.5) {
          lastProgress = newProgress;
          setProgress(newProgress);
        }
      }
    });

    window.addEventListener('scroll', throttledProgress, { passive: true });
    throttledProgress();

    return () => {
      throttledProgress.cancel();
      window.removeEventListener('scroll', throttledProgress);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900/60 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-[#8c2d2d] via-amber-400 to-[#c4a77d] transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: `scaleX(${progress / 100})`, transformOrigin: 'left' }}
      />
    </div>
  );
});

ScrollProgressBar.displayName = 'ScrollProgressBar';

export const Navbar: React.FC<NavbarProps> = memo(({
  isLightMode,
  toggleTheme,
  viewMode,
  onToggleViewMode,
  onOpenQuickTable,
  onOpenChronicle,
  onOpenAiLounge,
  onOpenAccessibility,
  onOpenAudioTour,
  isAudioTourActive,
  onReplayCurtainIntro,
  onToggleSpatialSoundscape,
  isSpatialSoundscapeActive,
  onOpenGame,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { seniorFriendlyMode, toggleSeniorFriendlyMode, textSize } = useAccessibility();

  // Prevent background page scrolling when mobile menu drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let lastScrolled = false;

    const throttledScroll = rafThrottle(() => {
      if (typeof window === 'undefined') return;
      const isScrolled = (window.scrollY || 0) > 40;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    });

    window.addEventListener('scroll', throttledScroll, { passive: true });
    throttledScroll();

    // Zero-overhead IntersectionObserver for Section detection
    const sections = ['hero', 'journey', 'cast', 'script-quotes', 'music-showcase', 'tickets', 'venue'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target?.id) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: 0,
      }
    );

    sections.forEach((sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    });

    return () => {
      throttledScroll.cancel();
      window.removeEventListener('scroll', throttledScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: '首頁', href: '#hero' },
    { name: '故事大綱', href: '#story-chronicle' },
    { name: '排練紀實', href: '#journey' },
    { name: '角色群像', href: '#cast' },
    { name: '名言對白', href: '#script-quotes' },
    { name: '曲目賞析', href: '#music-showcase' },
    { name: '索票指引', href: '#tickets' },
    { name: '觀演須知', href: '#venue' },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    href: string,
    linkName?: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if ((linkName === '故事大綱' || linkName === '典藏手稿' || href === '#story-chronicle') && onOpenChronicle) {
      onOpenChronicle();
      return;
    }

    const targetId = href.replace('#', '');
    if (!targetId) return;

    // Small delay ensures mobile drawer collapse doesn't disrupt scroll offset calculation
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        const navHeight = 72;
        const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = Math.max(0, elementPosition - navHeight);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 40);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 py-3.5 transform-gpu transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'bg-[var(--theme-nav-bg)] border-b border-[var(--theme-nav-border)] shadow-xl backdrop-blur-xl'
          : isLightMode
          ? 'bg-gradient-to-b from-[#faf7f2]/95 via-[#faf7f2]/60 to-transparent backdrop-blur-[2px]'
          : 'bg-gradient-to-b from-[#121215]/95 via-[#121215]/50 to-transparent backdrop-blur-[2px]'
      }`}
    >
      {/* WCAG 2.1 AA Bypass Blocks: Accessible Screen Reader & Keyboard Skip Links */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] px-4 py-2.5 bg-[#8c2d2d] text-white font-bold text-xs rounded shadow-2xl ring-2 ring-amber-400 focus:outline-none"
      >
        跳至主要演出內容 (Skip to Main Content)
      </a>
      <a
        href="#tickets"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-52 focus:z-[9999] px-4 py-2.5 bg-amber-600 text-stone-950 font-bold text-xs rounded shadow-2xl ring-2 ring-white focus:outline-none"
      >
        跳至索票與觀演場次 (Skip to Tickets)
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Title */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero', '首頁')}
          className="group flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full border border-[#8c2d2d]/60 flex items-center justify-center bg-[#8c2d2d]/10 group-hover:border-[#8c2d2d] transition-colors">
            <span className="font-cinzel text-xs font-bold text-[var(--theme-text-primary)]">LM</span>
          </div>
          <div>
            <span className="font-cinzel tracking-widest text-sm sm:text-base font-bold text-[var(--theme-text-primary)] block leading-tight">
              LES MISÉRABLES
            </span>
            <span className="text-[10px] text-[#c4a77d] tracking-wider block font-sans uppercase font-medium">
              慈大附中 高二知足雙語班
            </span>
          </div>
        </a>

        {/* Desktop Nav Links (Responsive step-down to prevent crowding) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navLinks.map((link) => {
            const sectionTarget = link.href.replace('#', '');
            const isActive = activeSection === sectionTarget;
            // On lg screens, only show the most prominent sections to keep generous breathing space
            const isSecondaryOnLg = ['rehearsal', 'script-quotes', 'venue'].includes(sectionTarget);
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.name)}
                className={`text-xs tracking-wider transition-all uppercase relative py-1 ${
                  isSecondaryOnLg ? 'hidden xl:inline-block' : 'inline-block'
                } ${
                  isActive
                    ? 'text-[#c4a77d] font-bold'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-[#8c2d2d] ${
                  isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                } after:transition-all after:duration-300`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right Actions: Clean, Structured & Conflict-Free 3-Zone Layout */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 relative shrink-0">
          {/* Dual View Mode Segmented Control: Rich Theatrical Flagship <-> Clean Editorial Guide */}
          <MagneticWrapper strength={0.15}>
            <button
              onClick={onToggleViewMode}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === 'simple'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'bg-stone-200/80 dark:bg-stone-900/60 border-stone-300 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:border-stone-400 dark:hover:border-stone-500'
              }`}
              title={viewMode === 'rich' ? '切換為【留白極簡・老師家長觀演手冊】' : '切換回【90分旗艦・劇院沉浸模式】'}
            >
              {viewMode === 'rich' ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-sans">觀演手冊</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-sans">典藏劇院</span>
                </>
              )}
            </button>
          </MagneticWrapper>

          {/* Quick Table Editor Trigger (Visible on 2XL screens) */}
          {onOpenQuickTable && (
            <div className="hidden 2xl:block">
              <MagneticWrapper strength={0.15}>
                <button
                  onClick={onOpenQuickTable}
                  className="px-2.5 py-1.5 border border-stone-300 dark:border-stone-700/60 hover:border-amber-500/50 bg-stone-200/80 dark:bg-stone-900/40 hover:bg-stone-300 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white text-xs font-sans transition-all rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="開啟如 Excel 般直覺的名冊修改表（老師/同學輕鬆改）"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>名冊編輯</span>
                </button>
              </MagneticWrapper>
            </div>
          )}

          {/* Character Voices Dialogue Button (Visible on 2XL screens) */}
          {onOpenAiLounge && viewMode === 'rich' && (
            <div className="hidden 2xl:block">
              <MagneticWrapper strength={0.15}>
                <button
                  onClick={onOpenAiLounge}
                  className="px-2.5 py-1.5 border border-stone-300 dark:border-stone-700/60 hover:border-amber-500/50 bg-stone-200/80 dark:bg-stone-900/40 hover:bg-stone-300 dark:hover:bg-stone-800/60 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-serif-tc transition-all rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="探尋雨果筆下八大主角的心靈歷程與對話"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  <span>角色訪談</span>
                </button>
              </MagneticWrapper>
            </div>
          )}

          {/* Clean Theatrical Settings & Theme Controls Group */}
          <div className="flex items-center bg-stone-200/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-700/70 rounded-lg p-0.5 gap-0.5">
            {/* Theatrical Theme Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-800 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-all cursor-pointer flex items-center justify-center touch-manipulation"
              title={isLightMode ? '切換為【劇院黑夜・燭光瓦斯燈模式】' : '切換為【19世紀手稿・羊皮紙古籍模式】'}
              aria-label="切換劇院主題"
            >
              {isLightMode ? (
                <Moon className="w-4 h-4 text-amber-800 fill-amber-700/20" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              )}
            </button>

            {/* Viewing Comfort & Accessibility Modal Trigger */}
            {onOpenAccessibility && (
              <button
                onClick={onOpenAccessibility}
                className={`px-2 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-sans touch-manipulation ${
                  seniorFriendlyMode || textSize !== 'normal'
                    ? 'bg-amber-500/25 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/60 font-medium'
                    : 'text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-stone-300/70 dark:hover:bg-stone-800/80'
                }`}
                title="開啟觀演舒適設定（字級大小放大、高對比、打光調節）"
                aria-label="開啟觀演輔助與舒適設定"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden xl:inline text-[11px] font-medium tracking-wide">
                  {seniorFriendlyMode ? '大字模式' : '觀演舒適'}
                </span>
              </button>
            )}

            {/* Accessible Audio Tour */}
            {onOpenAudioTour && (
              <button
                onClick={onOpenAudioTour}
                className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center touch-manipulation ${
                  isAudioTourActive
                    ? 'bg-amber-500/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/60'
                    : 'text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-stone-300/70 dark:hover:bg-stone-800'
                }`}
                title="開啟全劇語音口述導覽 (快捷鍵 Alt+A)"
                aria-label="開啟全劇語音口述導覽"
              >
                <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </button>
            )}

            {/* 2026 Spatial Ambient Audio Soundscape Toggle */}
            {onToggleSpatialSoundscape && (
              <button
                onClick={onToggleSpatialSoundscape}
                className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center touch-manipulation relative ${
                  isSpatialSoundscapeActive
                    ? 'bg-amber-500/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-stone-300/70 dark:hover:bg-stone-800'
                }`}
                title={isSpatialSoundscapeActive ? '巴黎1832動態多軌聲景：播放中（點擊關閉）' : '開啟巴黎1832多軌沉浸式動態聲景 (隨頁面滾動位置濾鏡混音)'}
                aria-label="切換沉浸式動態聲景"
              >
                <Music className={`w-4 h-4 ${isSpatialSoundscapeActive ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                {isSpatialSoundscapeActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </button>
            )}

            {/* Replay Cinematic Curtain Intro */}
            {onReplayCurtainIntro && (
              <button
                onClick={onReplayCurtainIntro}
                className="p-1.5 rounded-md hover:bg-stone-300/70 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-all cursor-pointer flex items-center justify-center touch-manipulation"
                title="重溫大幕開場與電影光芒動畫"
                aria-label="重溫大幕開場"
              >
                <Clapperboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </button>
            )}
          </div>

          {/* Primary Call-to-Action Button for Free Tickets */}
          <MagneticWrapper strength={0.2}>
            <a
              href="#tickets"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-serif-tc font-semibold tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap rounded-lg border border-amber-400/40"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-300" />
              <span>即刻索票</span>
            </a>
          </MagneticWrapper>
        </div>

        {/* Mobile Hamburger Menu & Essential Toggles */}
        <div className="flex md:hidden items-center gap-1">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-stone-800/50 cursor-pointer touch-manipulation"
            title={isLightMode ? '切換為深色劇院模式' : '切換為羊皮紙模式'}
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Moon className="w-4 h-4 text-amber-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-stone-200 hover:text-white hover:bg-stone-800/60 focus:outline-none cursor-pointer touch-manipulation"
            aria-label={mobileMenuOpen ? '關閉目錄選單' : '開啟觀演目錄選單'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-amber-400" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Native smooth scrolling & elegant decluttered directory) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden bg-[var(--theme-card-bg)]/98 border-b border-[var(--theme-card-border)] px-4 pt-3 pb-8 backdrop-blur-2xl shadow-2xl max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain flex flex-col divide-y divide-stone-800/40"
          >
            {/* 1. Core Theatrical Navigation Links (Clean & Spacious) */}
            <div className="py-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-sans font-bold tracking-widest text-[#8c2d2d] uppercase">
                劇目導覽章節 • Program Sections
              </div>
              <nav className="space-y-0.5">
                {navLinks.map((link, idx) => {
                  const sectionTarget = link.href.replace('#', '');
                  const isActive = activeSection === sectionTarget;
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => {
                        handleNavClick(e, link.href, link.name);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm tracking-wider font-serif-tc transition-colors touch-manipulation cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 font-bold'
                          : 'text-[var(--theme-text-primary)] hover:bg-stone-800/40 active:bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-cinzel text-xs text-stone-500 w-4">
                          0{idx + 1}
                        </span>
                        <span>{link.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* 2. Key Audience Action Buttons */}
            <div className="py-3 space-y-2">
              <a
                href="#tickets"
                onClick={(e) => {
                  handleNavClick(e, '#tickets', '索票指引');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-[#8c2d2d] hover:bg-[#a33535] active:bg-[#732222] text-white rounded text-xs font-sans font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-md transition-colors touch-manipulation"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>實體門票索取指引 (Free Tickets)</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onToggleViewMode();
                  }}
                  className="py-2 px-3 rounded border border-amber-500/40 bg-stone-900/60 hover:bg-stone-800 text-amber-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
                >
                  {viewMode === 'rich' ? (
                    <>
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>切換簡約手冊</span>
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                      <span>切換典藏劇院</span>
                    </>
                  )}
                </button>

                {onOpenAiLounge && viewMode === 'rich' && (
                  <button
                    onClick={() => {
                      ambientSynth.playButtonClickSFX();
                      setMobileMenuOpen(false);
                      onOpenAiLounge();
                    }}
                    className="py-2 px-3 rounded border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-stone-200 text-xs font-serif-tc flex items-center justify-center gap-1.5 transition-colors touch-manipulation"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>角色心聲訪談</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. Compact Preferences & Accessibility Capsule */}
            <div className="pt-3 pb-2 space-y-2">
              <div className="px-2 text-[10px] font-sans text-stone-400 tracking-wider">
                觀演舒適與閱讀偏好 (Viewing Comfort & Audio)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Senior & Large Text Mode */}
                <button
                  onClick={toggleSeniorFriendlyMode}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors touch-manipulation min-h-[44px] ${
                    seniorFriendlyMode
                      ? 'border-amber-400 bg-amber-500/25 text-amber-300 font-bold'
                      : 'border-stone-700/80 bg-stone-900/40 text-stone-300'
                  }`}
                  aria-pressed={seniorFriendlyMode}
                >
                  <Glasses className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {seniorFriendlyMode ? '尊榮大字: 開啟' : '樂齡尊榮大字'}
                  </span>
                </button>

                {/* Display & Spotlight Settings */}
                {onOpenAccessibility && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAccessibility();
                    }}
                    className="py-2 px-2.5 rounded-lg border border-stone-700/80 bg-stone-900/40 text-stone-300 text-xs font-medium flex items-center gap-2 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">字級與打光設定</span>
                  </button>
                )}

                {/* Accessible Audio Tour */}
                {onOpenAudioTour && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAudioTour();
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors touch-manipulation min-h-[44px] col-span-2 ${
                      isAudioTourActive
                        ? 'border-amber-400 bg-amber-500/25 text-amber-300 font-bold'
                        : 'border-stone-700/80 bg-stone-900/40 text-stone-300'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">全劇口述語音導覽 (朗讀解說)</span>
                  </button>
                )}

                {/* Quick Table Editor */}
                {onOpenQuickTable && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenQuickTable();
                    }}
                    className="py-2 px-2.5 rounded-lg border border-stone-700/80 bg-stone-900/40 text-stone-300 text-xs font-medium flex items-center gap-2 transition-colors touch-manipulation"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">演職名冊試算表</span>
                  </button>
                )}

                {/* Replay Theatrical Curtain Intro (Mobile) */}
                {onReplayCurtainIntro && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onReplayCurtainIntro();
                    }}
                    className="py-2 px-2.5 rounded-lg border border-stone-700/80 bg-stone-900/40 text-stone-300 text-xs font-medium flex items-center gap-2 transition-colors touch-manipulation"
                  >
                    <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">重溫大幕開場</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theatrical Velvet & Gold Scroll Progress Bar (Isolated Component) */}
      <ScrollProgressBar />
    </header>
  );
});

Navbar.displayName = 'Navbar';

