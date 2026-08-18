import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Menu, X, Ticket, Disc, Music, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SHOW_DETAILS } from '../../data/showData';
import { ambientSynth, MusicTheme } from '../../utils/audioSynth';

interface NavbarProps {
  isMuted: boolean;
  toggleAudio: () => void;
  onOpenChronicle?: () => void;
  onOpenAiLounge?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMuted, toggleAudio, onOpenChronicle, onOpenAiLounge }) => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [musicMenuOpen, setMusicMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<MusicTheme>('overture');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          
          if (totalHeight > 0) {
            const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
            setScrollProgress(progress);
          }

          const isScrolled = currentScroll > 40;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));

          // Calculate active section for highlight
          const sections = ['hero', 'journey', 'cast', 'script-quotes', 'music-showcase', 'tickets', 'venue'];
          for (const sectionId of sections) {
            const el = document.getElementById(sectionId);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 200 && rect.bottom >= 200) {
                setActiveSection(sectionId);
                break;
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const themeOptions: { id: MusicTheme; title: string; desc: string }[] = [
    { id: 'overture', title: '序曲 / 俯瞰大地', desc: 'Look Down Dramatic Overture' },
    { id: 'people_sing', title: '你可聽到人民在歌唱？', desc: 'Do You Hear the People Sing?' },
    { id: 'dream', title: '我曾有夢', desc: 'I Dreamed a Dream Lyrical Motif' },
  ];

  const handleSelectTheme = (themeId: MusicTheme) => {
    setCurrentTheme(themeId);
    ambientSynth.switchTheme(themeId);
    ambientSynth.playButtonClickSFX();
    setMusicMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#161618]/95 border-b border-stone-800/80 py-3 shadow-xl transform-gpu'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Title */}
        <a
          href="#hero"
          onClick={() => ambientSynth.playButtonClickSFX()}
          className="group flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full border border-[#8c2d2d]/60 flex items-center justify-center bg-[#8c2d2d]/10 group-hover:border-[#8c2d2d] transition-colors">
            <span className="font-cinzel text-xs font-bold text-[#f5f5f4]">LM</span>
          </div>
          <div>
            <span className="font-cinzel tracking-widest text-sm sm:text-base font-bold text-[#f5f5f4] block leading-tight">
              LES MISÉRABLES
            </span>
            <span className="text-[10px] text-amber-200/90 tracking-wider block font-sans uppercase">
              慈大附中 高二知足雙語班
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const sectionTarget = link.href.replace('#', '');
            const isActive = activeSection === sectionTarget;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  ambientSynth.playButtonClickSFX();
                  if ((link.name === '故事大綱' || link.name === '典藏手稿') && onOpenChronicle) {
                    e.preventDefault();
                    onOpenChronicle();
                  }
                }}
                className={`text-xs tracking-widest transition-all uppercase relative py-1 ${
                  isActive
                    ? 'text-amber-200 font-bold'
                    : 'text-stone-300 hover:text-stone-100'
                } after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-[#8c2d2d] ${
                  isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                } after:transition-all after:duration-300`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4 relative">
          {/* Subtle Ambient Audio Toggle & Motif Selector */}
          <div className="relative">
            <div className="flex items-center border border-stone-800 bg-[#1a1a1c]/80 rounded-full p-1 gap-1 shadow-lg">
              <button
                onClick={() => {
                  toggleAudio();
                  ambientSynth.playButtonClickSFX();
                }}
                title={isMuted ? '開啟經典管弦樂音效' : '關閉音樂'}
                className="px-3 py-1.5 rounded-full text-stone-300 hover:text-white transition-all flex items-center gap-2 text-xs font-sans"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[11px] font-sans text-stone-500">背景樂：關</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#8c2d2d] animate-pulse" />
                    <span className="text-[11px] font-sans text-amber-200 font-bold">背景樂：開</span>
                  </>
                )}
              </button>

              {!isMuted && (
                <button
                  onClick={() => setMusicMenuOpen(!musicMenuOpen)}
                  className="px-2 py-1.5 rounded-full border-l border-stone-800 text-stone-400 hover:text-amber-200 transition-colors text-[11px] font-sans flex items-center gap-1"
                  title="選擇《悲慘世界》主題曲動機"
                >
                  <Music className="w-3 h-3 text-[#8c2d2d]" />
                  <span>切換曲目</span>
                </button>
              )}
            </div>

            {/* Music Motif Dropdown Menu */}
            <AnimatePresence>
              {musicMenuOpen && !isMuted && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1c] border border-stone-700 rounded-sm shadow-2xl p-3 z-50 space-y-2"
                >
                  <div className="text-[10px] font-sans tracking-widest text-[#8c2d2d] uppercase font-bold px-2 pb-1 border-b border-stone-800">
                    選擇背景經典曲目動機
                  </div>
                  <div className="space-y-1">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectTheme(opt.id)}
                        className={`w-full text-left p-2 rounded-sm text-xs transition-colors flex items-center justify-between ${
                          currentTheme === opt.id
                            ? 'bg-[#8c2d2d]/20 text-white font-bold border border-[#8c2d2d]/50'
                            : 'hover:bg-stone-800 text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="font-serif-tc">{opt.title}</div>
                          <div className="text-[10px] text-stone-500 font-sans">{opt.desc}</div>
                        </div>
                        {currentTheme === opt.id && (
                          <span className="text-[#8c2d2d] text-xs font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Les Mis Lounge Button */}
          {onOpenAiLounge && (
            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                onOpenAiLounge();
              }}
              className="px-3 py-2 bg-gradient-to-r from-[#8c2d2d] to-[#6b2222] border border-amber-400/50 hover:border-amber-400 text-amber-200 hover:text-white text-xs font-serif-tc font-bold tracking-wider rounded transition-all shadow-md flex items-center gap-1.5 hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI 觀劇對話館</span>
            </button>
          )}

          {/* Ghost Button for Ticket Guide */}
          <a
            href="#tickets"
            onClick={() => ambientSynth.playButtonClickSFX()}
            className="group relative inline-flex items-center gap-2 px-4 py-2 border border-stone-600 hover:border-[#8c2d2d] text-stone-200 hover:text-white text-xs tracking-wider uppercase transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-[#8c2d2d] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out -z-10" />
            <Ticket className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
            <span>索票指引 (Free)</span>
          </a>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => {
              toggleAudio();
              ambientSynth.playButtonClickSFX();
            }}
            className="p-2 text-stone-400 hover:text-stone-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#8c2d2d]" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-[#1a1a1c]/95 border-b border-stone-800 px-4 pt-4 pb-6 mt-2 space-y-3 backdrop-blur-xl overflow-hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  ambientSynth.playButtonClickSFX();
                  setMobileMenuOpen(false);
                  if ((link.name === '故事大綱' || link.name === '典藏手稿') && onOpenChronicle) {
                    e.preventDefault();
                    onOpenChronicle();
                  }
                }}
                className="block text-sm tracking-widest text-stone-300 hover:text-white py-2 border-b border-stone-800/50"
              >
                {link.name}
              </a>
            ))}
            {onOpenAiLounge && (
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setMobileMenuOpen(false);
                  onOpenAiLounge();
                }}
                className="mt-3 w-full py-3 bg-[#8c2d2d] border border-amber-400/50 text-amber-200 font-serif-tc font-bold text-xs tracking-wider rounded flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI 悲慘世界觀劇與角色對話館</span>
              </button>
            )}

            <a
              href="#tickets"
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setMobileMenuOpen(false);
              }}
              className="mt-2 block w-full text-center py-3 border border-[#8c2d2d] text-stone-200 hover:bg-[#8c2d2d] transition-colors text-xs tracking-widest uppercase"
            >
              索票指引 (Free Tickets)
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theatrical Velvet & Gold Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900/60 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#8c2d2d] via-amber-400 to-[#c4a77d] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </header>
  );
};

