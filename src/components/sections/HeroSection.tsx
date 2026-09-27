import React, { useState, useEffect, memo } from 'react';
import { Calendar, MapPin, Clock, ArrowDown, BookOpen, MessageSquare, Gamepad2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useShowGeneralConfig } from '../../context/ShowDataContext';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { WebGPUVolumetricHeroCanvas } from '../effects/WebGPUVolumetricHeroCanvas';
import lesMisPosterImg from '../../assets/images/les_mis_poster_1785560972972.jpg';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

interface HeroSectionProps {
  onOpenChronicle?: () => void;
  onOpenAiLounge?: () => void;
  onOpenGame?: () => void;
}

/**
 * 2026 Micro-State Isolated Countdown Component
 * Automatically adapts whenever administrator updates eventDateIso in DataManager.
 */
const HeroCountdown = memo(({ targetDateIso }: { targetDateIso: string }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() => {
    const targetDate = new Date(targetDateIso).getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;
    if (difference <= 0 || isNaN(difference)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isPast: false,
    };
  });

  useEffect(() => {
    const targetDate = new Date(targetDateIso).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0 || isNaN(difference)) {
        setTimeLeft((prev) => (prev.isPast ? prev : { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }));
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDateIso]);

  return (
    <div className="pt-2 pb-4">
      <p className="text-[11px] text-stone-500 dark:text-stone-400 tracking-widest uppercase mb-3 font-sans">
        距大幕拉開倒數 • Countdown to Curtain Rise
      </p>
      {timeLeft.isPast ? (
        <div className="text-[var(--theme-text-primary)] font-serif-tc text-lg">
          公演已隆重登場／感謝全體蒞臨觀賞
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 sm:gap-5 font-cinzel tabular-nums">
          <div className="text-center min-w-[54px] sm:min-w-[76px] shrink-0">
            <span className="text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] block leading-none tabular-nums tracking-normal">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans tracking-wider uppercase mt-1 block">
              天 (Days)
            </span>
          </div>
          <span className="text-stone-400 dark:text-stone-600 text-xl sm:text-3xl font-light mb-3 select-none">:</span>
          <div className="text-center min-w-[54px] sm:min-w-[76px] shrink-0">
            <span className="text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] block leading-none tabular-nums tracking-normal">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans tracking-wider uppercase mt-1 block">
              時 (Hours)
            </span>
          </div>
          <span className="text-stone-400 dark:text-stone-600 text-xl sm:text-3xl font-light mb-3 select-none">:</span>
          <div className="text-center min-w-[54px] sm:min-w-[76px] shrink-0">
            <span className="text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] block leading-none tabular-nums tracking-normal">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans tracking-wider uppercase mt-1 block">
              分 (Mins)
            </span>
          </div>
          <span className="text-stone-400 dark:text-stone-600 text-xl sm:text-3xl font-light mb-3 select-none">:</span>
          <div className="text-center min-w-[54px] sm:min-w-[76px] shrink-0">
            <span className="text-3xl sm:text-5xl font-bold text-[#8c2d2d] block leading-none tabular-nums tracking-normal">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans tracking-wider uppercase mt-1 block">
              秒 (Secs)
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

HeroCountdown.displayName = 'HeroCountdown';

export const HeroSection: React.FC<HeroSectionProps> = memo(({ onOpenChronicle, onOpenAiLounge, onOpenGame }) => {
  const config = useShowGeneralConfig();

  const scrollTo = (targetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    ambientSynth.playButtonClickSFX();
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 72;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - navOffset);
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background Poster Artwork with Cinematic Dark Vignette & Paper Grain */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <img
          src={lesMisPosterImg}
          alt="慈大附中悲慘世界英文公演經典海報主視覺"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-20 dark:opacity-20 opacity-15 transform-gpu scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg-main)] via-[var(--theme-bg-main)]/85 to-[var(--theme-bg-main)]/60" />
        <div className="absolute inset-0 bg-radial from-transparent via-[var(--theme-bg-main)]/70 to-[var(--theme-bg-main)]" />
      </motion.div>

      {/* WebGPU / WGSL 10,000+ Revolutionary Ash Particles & Fluid Stream */}
      <WebGPUVolumetricHeroCanvas className="z-0" />

      {/* Theatrical Hero Stage Spotlight & Atmospheric Beams */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden transform-gpu" aria-hidden="true">
        <div className="absolute -top-12 w-[42rem] sm:w-[58rem] h-[30rem] bg-radial from-[#d4b589]/20 via-[#8c2d2d]/20 to-transparent blur-3xl rounded-full animate-ambient-pulse transform-gpu" />
        <div className="absolute top-1/3 -left-12 w-[30rem] h-[22rem] bg-gradient-to-r from-blue-900/20 via-purple-900/15 to-transparent blur-3xl rounded-full transform-gpu" />
        <div className="absolute top-1/3 -right-12 w-[30rem] h-[22rem] bg-gradient-to-l from-amber-600/20 via-[#8c2d2d]/20 to-transparent blur-3xl rounded-full transform-gpu" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-5 sm:space-y-8 px-2 sm:px-4 w-full overflow-hidden"
      >
        {/* Top Editorial Kicker & Secret Easter Egg (Clean Anti-Slop Typography) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 tracking-wider uppercase font-sans flex-wrap"
        >
          <span className="font-medium text-[#8c2d2d] dark:text-amber-400">Victor Hugo's Masterpiece</span>
          <span aria-hidden="true" className="text-stone-400 dark:text-stone-600">·</span>
          <span className="font-medium">High School English Play</span>
          {onOpenGame && (
            <>
              <span aria-hidden="true" className="text-stone-400 dark:text-stone-600">·</span>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  onOpenGame();
                }}
                className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 hover:text-[#8c2d2d] dark:hover:text-amber-200 font-mono text-xs cursor-pointer transition-colors group"
                title="點擊開啟隱藏小遊戲：尚萬強大逃亡 (24601 Run)"
              >
                <Gamepad2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-amber-500" />
                <span className="font-bold underline decoration-amber-500/40 underline-offset-4">24601 逃亡小遊戲</span>
              </button>
            </>
          )}
        </motion.div>

        {/* Subtitle */}
        <div className="space-y-1.5 px-1">
          <p className="text-xs sm:text-sm md:text-base tracking-normal sm:tracking-[0.2em] text-amber-800 dark:text-amber-200/90 font-sans uppercase font-medium break-words leading-relaxed">
            {config.subhead}
          </p>
          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 tracking-wider sm:tracking-widest font-serif-tc italic">
            {config.schoolName} {config.gradeName}
          </p>
        </div>

        {/* Main Title - Classical Large Serif Font */}
        <div className="py-1 sm:py-2 max-w-full overflow-hidden">
          <div className="cinematic-flare-wrapper inline-block max-w-full">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-cinzel text-[clamp(2.4rem,8vw,7.5rem)] font-extrabold tracking-tight text-chiseled-gold leading-tight break-words max-w-full"
            >
              {config.titleEn}
            </motion.h1>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-2 sm:mt-3">
            <div className="h-[1px] w-8 sm:w-20 bg-gradient-to-r from-transparent to-[#8c2d2d]" />
            <span className="font-serif-tc text-base sm:text-2xl tracking-widest sm:tracking-[0.25em] text-[#8c2d2d] font-semibold">
              《{config.titleZh}》
            </span>
            <div className="h-[1px] w-8 sm:w-20 bg-gradient-to-l from-transparent to-[#8c2d2d]" />
          </div>
        </div>

        {/* Event Info Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[var(--theme-text-secondary)] font-sans border-y border-stone-300 dark:border-stone-800/80 py-4 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8c2d2d]" />
            <span>{config.eventDateFormatted}</span>
          </div>
          <span className="hidden sm:inline text-stone-400 dark:text-stone-600">|</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <span>{config.doorTime} ｜ {config.showTime}</span>
          </div>
          <span className="hidden sm:inline text-stone-400 dark:text-stone-600">|</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2b3a4a] dark:text-[#8ba7c7]" />
            <span>{config.venueName}</span>
          </div>
        </motion.div>

        {/* Isolated Countdown Timer dynamically hooked to config.eventDateIso */}
        <HeroCountdown targetDateIso={config.eventDateIso} />

        {/* Action Buttons with Magnetic Elastic Physics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap"
        >
          {onOpenAiLounge && (
            <MagneticWrapper strength={0.2}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  onOpenAiLounge();
                }}
                className="group relative inline-flex items-center justify-center px-6 sm:px-7 py-3.5 bg-gradient-to-r from-[#8c2d2d] via-[#a33535] to-[#732222] border-2 border-amber-400/80 text-white font-serif-tc text-sm tracking-wider font-bold transition-all duration-300 shadow-xl cursor-pointer rounded-xl hover:shadow-amber-500/20 whitespace-nowrap min-h-[48px] w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-300" />
                  <span>走進 1832：角色心聲訪談</span>
                </span>
              </motion.button>
            </MagneticWrapper>
          )}

          {onOpenChronicle && (
            <MagneticWrapper strength={0.2}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  onOpenChronicle();
                }}
                className="group relative inline-flex items-center justify-center px-6 sm:px-7 py-3.5 bg-[#2b3a4a] hover:bg-[#344558] border border-amber-400/50 text-stone-200 font-serif-tc text-sm tracking-wider font-bold transition-all duration-300 shadow-md cursor-pointer rounded-xl whitespace-nowrap min-h-[48px] w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>歷史紀事與劇讀原典</span>
                </span>
              </motion.button>
            </MagneticWrapper>
          )}

          <MagneticWrapper strength={0.2}>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#tickets"
              onClick={(e) => scrollTo('tickets', e)}
              className="group relative inline-flex items-center justify-center px-6 sm:px-7 py-3.5 bg-stone-200/90 hover:bg-stone-300 dark:bg-stone-900/90 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white font-serif-tc text-sm tracking-wider transition-all duration-300 shadow-sm cursor-pointer rounded-xl whitespace-nowrap min-h-[48px] w-full sm:w-auto"
            >
              <span className="relative z-10">線上索票與場地指南</span>
            </motion.a>
          </MagneticWrapper>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="pt-8"
        >
          <a
            href="#journey"
            onClick={(e) => scrollTo('journey', e)}
            className="inline-flex flex-col items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors group"
            aria-label="向下捲動探索演出歷程"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans">Scroll to Discover</span>
            <ArrowDown className="w-4 h-4 animate-bounce text-stone-400 group-hover:text-amber-300" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
