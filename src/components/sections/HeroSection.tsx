import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowDown, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { SHOW_DETAILS } from '../../data/showData';
import { ambientSynth } from '../../utils/audioSynth';
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
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenChronicle, onOpenAiLounge }) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const targetDate = new Date(SHOW_DETAILS.eventDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
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
  }, []);

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
          alt="Les Misérables Stage Backdrop"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-20 transform-gpu scale-105"
        />
        {/* Layered Gradient Overlays to preserve dark manuscript aesthetic (#1a1a1c) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-[#1a1a1c]/80 to-[#1a1a1c]/60" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#1a1a1c]/70 to-[#1a1a1c]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
      >
        {/* Top Literary Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-700/80 bg-[#1a1a1c]/80 text-stone-300 text-xs tracking-widest uppercase shadow-md"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#8c2d2d]" />
          <span>Victor Hugo's Masterpiece • High School English Play</span>
        </motion.div>

        {/* Subtitle */}
        <div className="space-y-1">
          <p className="text-sm sm:text-base tracking-[0.25em] text-amber-200/90 font-sans uppercase font-medium">
            {SHOW_DETAILS.subhead}
          </p>
          <p className="text-xs text-stone-400 tracking-widest font-serif-tc italic">
            慈濟大學實驗高級中學 高二知足班（雙語班）演繹經典
          </p>
        </div>

        {/* Main Title - Classical Large Serif Font */}
        <div className="py-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-cinzel text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-[#f5f5f4] leading-none drop-shadow-md"
          >
            Les Misérables
          </motion.h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#8c2d2d]" />
            <span className="font-serif-tc text-lg sm:text-2xl tracking-[0.3em] text-[#8c2d2d] font-bold">
              《悲慘世界》
            </span>
            <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#8c2d2d]" />
          </div>
        </div>

        {/* Event Info Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-stone-300 font-sans border-y border-stone-800/80 py-4 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8c2d2d]" />
            <span>2026 年 12 月 19 日 (五)</span>
          </div>
          <span className="hidden sm:inline text-stone-600">|</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>18:30 開放 ｜ 19:00 開演</span>
          </div>
          <span className="hidden sm:inline text-stone-600">|</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2b3a4a]" />
            <span>慈大附中演藝廳</span>
          </div>
        </motion.div>

        {/* Countdown Timer - Simple, restrained typography without glowing borders */}
        <div className="pt-2 pb-4">
          <p className="text-[11px] text-stone-400 tracking-widest uppercase mb-3 font-sans">
            距大幕拉開倒數 • Countdown to Curtain Rise
          </p>
          {timeLeft.isPast ? (
            <div className="text-stone-300 font-serif-tc text-lg">
              公演已隆重登場／感謝全體蒞臨觀賞
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-6 font-cinzel">
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <span className="text-3xl sm:text-5xl font-bold text-[#f5f5f4] block leading-none">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-stone-400 font-sans tracking-widest uppercase mt-1 block">
                  天 (Days)
                </span>
              </div>
              <span className="text-stone-600 text-2xl sm:text-3xl font-light mb-4">:</span>
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <span className="text-3xl sm:text-5xl font-bold text-[#f5f5f4] block leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-stone-400 font-sans tracking-widest uppercase mt-1 block">
                  時 (Hours)
                </span>
              </div>
              <span className="text-stone-600 text-2xl sm:text-3xl font-light mb-4">:</span>
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <span className="text-3xl sm:text-5xl font-bold text-[#f5f5f4] block leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-stone-400 font-sans tracking-widest uppercase mt-1 block">
                  分 (Mins)
                </span>
              </div>
              <span className="text-stone-600 text-2xl sm:text-3xl font-light mb-4">:</span>
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <span className="text-3xl sm:text-5xl font-bold text-[#8c2d2d] block leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-stone-400 font-sans tracking-widest uppercase mt-1 block">
                  秒 (Secs)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap"
        >
          {onOpenAiLounge && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                onOpenAiLounge();
              }}
              className="group relative inline-block px-7 py-3.5 bg-gradient-to-r from-[#8c2d2d] via-[#a33535] to-[#732222] border-2 border-amber-400 text-white font-serif-tc text-sm tracking-widest font-bold transition-all duration-300 shadow-2xl cursor-pointer rounded-sm hover:shadow-amber-500/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI 觀劇對話與靈魂館 (AI Lounge)</span>
              </span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              ambientSynth.playPageFlipSFX();
              onOpenChronicle?.();
            }}
            className="group relative inline-block px-6 py-3.5 bg-stone-900 border border-amber-500/50 text-[#f5f5f4] font-sans text-sm tracking-widest uppercase font-bold transition-all duration-300 shadow-xl cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>故事篇章大綱</span>
            </span>
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="#tickets"
            className="group relative inline-block px-6 py-3.5 border border-stone-400 text-[#f5f5f4] font-sans text-sm tracking-widest uppercase font-medium transition-all duration-300 overflow-hidden shadow-lg"
          >
            <span className="absolute inset-0 bg-[#8c2d2d] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out -z-10" />
            <span className="relative z-10 flex items-center gap-2">
              <span>索票指引</span>
            </span>
          </motion.a>
        </motion.div>

        {/* Quote Teaser */}
        <div className="pt-8">
          <blockquote className="font-garamond italic text-stone-400 text-base sm:text-lg max-w-xl mx-auto">
            “Even the darkest night will end and the sun will rise.”
          </blockquote>
          <p className="text-[11px] text-stone-500 font-serif-tc mt-1">
            — Victor Hugo 《悲慘世界》
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-6">
          <a
            href="#journey"
            className="inline-flex flex-col items-center text-stone-500 hover:text-stone-300 text-xs tracking-widest uppercase transition-colors"
          >
            <span className="mb-1">Scroll</span>
            <ArrowDown className="w-4 h-4 animate-bounce text-stone-500" />
          </a>
        </div>
      </motion.div>
    </section>
  );
};

