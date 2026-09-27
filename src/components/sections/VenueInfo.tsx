import React, { useState, memo, useCallback } from 'react';
import { MapPin, Navigation, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Bus, Car, ExternalLink, Sparkles, Clock, Accessibility, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQS } from '../../data/showData';
import { useShowGeneralConfig } from '../../context/ShowDataContext';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { CampusWayfindingMap } from './CampusWayfindingMap';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

interface FaqItemProps {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItem = memo<FaqItemProps>(({ faq, isOpen, onToggle }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`smoked-card border rounded-xl overflow-hidden transition-all transform-gpu shadow-sm ${
        isOpen ? 'border-[#8c2d2d]/60 shadow-md' : 'border-[var(--theme-card-border)] hover:border-[#8c2d2d]/40'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none hover:bg-stone-500/10 transition-colors cursor-pointer min-h-[48px]"
      >
        <span className={`font-serif-tc text-sm sm:text-base font-semibold transition-colors ${
          isOpen ? 'text-[#8c2d2d] dark:text-amber-200' : 'text-[var(--theme-text-primary)]'
        }`}>
          {faq.q}
        </span>
        <div className={`p-1 rounded-full transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#8c2d2d] dark:text-amber-400 bg-amber-400/10' : 'text-[var(--theme-text-muted)]'}`}>
          <ChevronDown className="w-4 h-4 shrink-0" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-[var(--theme-text-secondary)] font-sans leading-relaxed border-t border-[var(--theme-card-border)] bg-[var(--theme-bg-canvas)]/40">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

FaqItem.displayName = 'FaqItem';

export const VenueInfo: React.FC = memo(() => {
  const config = useShowGeneralConfig();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = useCallback((idx: number) => {
    ambientSynth.playPageFlipSFX();
    setOpenFaq((prev) => (prev === idx ? null : idx));
  }, []);

  const openGoogleMaps = useCallback(() => {
    ambientSynth.playButtonClickSFX();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.venueAddress + ' ' + config.venueName)}`,
      '_blank'
    );
  }, [config.venueAddress, config.venueName]);

  return (
    <section id="venue" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-stone-800/60 overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#8c2d2d]/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase font-bold">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Venue & Visitor Guide</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] tracking-tight">
            觀演須知與劇場資訊
          </h2>
          <p className="font-serif-tc text-[var(--theme-text-secondary)] text-sm sm:text-base max-w-2xl mx-auto">
            為了提供每一位觀眾最完美的劇場沉浸體驗，請留意以下入場資訊與指引。
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </motion.div>

        {/* 2-Column Layout: Venue details & FAQ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* Left: Venue Location & Schedule (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
              className="smoked-card p-6 sm:p-8 border border-[var(--theme-card-border)] rounded-xl space-y-6 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3">
                <h3 className="font-serif-tc text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-[#8c2d2d]" />
                  <span>演出地點與交通方式</span>
                </h3>

                <MagneticWrapper strength={0.25}>
                  <button
                    onClick={openGoogleMaps}
                    title="在 Google 地圖開啟路線導航"
                    className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-sm border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <span>地圖導航</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </MagneticWrapper>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <div className="space-y-1">
                  <span className="text-xs text-stone-500 uppercase tracking-widest block font-bold">
                    演出地點 (VENUE)
                  </span>
                  <p className="font-serif-tc text-base text-[var(--theme-text-primary)] font-semibold">
                    {config.venueName}
                  </p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">
                    {config.venueAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-stone-500 uppercase tracking-widest block font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>關鍵時間點 (TIMELINE)</span>
                  </span>
                  <ul className="text-xs text-[var(--theme-text-secondary)] space-y-1.5 pt-1">
                    <li className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-1">
                      <span>大廳驗票入場</span>
                      <span className="text-[#8c2d2d] font-bold">{config.doorTime}</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-1">
                      <span>觀眾席座無虛席封門</span>
                      <span className="text-[var(--theme-text-secondary)]">開演前 5 分鐘</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-1">
                      <span>大幕正式拉開 (Show Start)</span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">{config.showTime}</span>
                    </li>
                  </ul>
                </div>

                {/* Driving & Parking Advice */}
                <div className="pt-2 space-y-2 border-t border-[var(--theme-card-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-primary)] font-semibold">
                    <Car className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>自行開車與來賓停車</span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                    {config.parkingGuide}
                  </p>
                </div>

                {/* Accessibility Support */}
                <div className="pt-2 space-y-2 border-t border-[var(--theme-card-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-primary)] font-semibold">
                    <Accessibility className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>無障礙與輪椅席位支援</span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                    {config.accessibilitySupport}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="pt-2 space-y-1 border-t border-[var(--theme-card-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-primary)] font-semibold">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>前台諮詢與聯絡方式</span>
                  </div>
                  <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                    {config.contactInfo}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Frequently Asked Questions FAQ (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif-tc text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2 border-b border-[var(--theme-card-border)] pb-3">
              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>常見問題解答 (FAQ)</span>
            </h3>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <FaqItem
                  key={idx}
                  faq={faq}
                  isOpen={openFaq === idx}
                  onToggle={() => toggleFaq(idx)}
                />
              ))}
            </div>

            {/* Note on etiquette */}
            <motion.div
              variants={itemVariants}
              className="p-4 bg-stone-200/60 dark:bg-stone-900/60 border border-[var(--theme-card-border)] rounded-sm text-xs font-sans text-[var(--theme-text-secondary)] flex items-start gap-3 mt-4 shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-[#8c2d2d] shrink-0 mt-0.5" />
              <span>
                演出期間敬請將行動電話調整為靜音或關機模式。演出中未經許可請勿進行閃光燈攝影，感謝您的尊重與配合。
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Dedicated Campus Interactive Wayfinding & Floorplan Map System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-6"
        >
          <CampusWayfindingMap />
        </motion.div>
      </div>
    </section>
  );
});

VenueInfo.displayName = 'VenueInfo';

