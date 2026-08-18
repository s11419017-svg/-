import React, { useState } from 'react';
import { MapPin, Navigation, Clock, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Bus, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SHOW_DETAILS, FAQS } from '../../data/showData';

export const VenueInfo: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section id="venue" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#1a1a1c] border-t border-stone-800/60">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase">
            <MapPin className="w-3.5 h-3.5" />
            <span>Venue & Visitor Guide</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            觀演須知與劇場資訊
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            為了提供每一位觀眾最完美的劇場沉浸體驗，請留意以下入場資訊與指引。
          </p>
          <div className="w-12 h-[1px] bg-[#8c2d2d] mx-auto mt-4" />
        </div>

        {/* 2-Column Layout: Venue details & FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Venue Location & Schedule (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="smoked-card p-6 sm:p-8 border border-stone-800 rounded-sm space-y-6">
              <h3 className="font-serif-tc text-xl font-bold text-[#f5f5f4] flex items-center gap-2 border-b border-stone-800 pb-3">
                <Navigation className="w-5 h-5 text-[#8c2d2d]" />
                <span>演出地點與交通方式</span>
              </h3>

              <div className="space-y-4 text-sm font-sans">
                <div className="space-y-1">
                  <span className="text-xs text-stone-500 uppercase tracking-widest block font-bold">
                    演出地點 (VENUE)
                  </span>
                  <p className="font-serif-tc text-base text-stone-200 font-semibold">
                    {SHOW_DETAILS.venue}
                  </p>
                  <p className="text-xs text-stone-400">
                    {SHOW_DETAILS.venueAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-stone-500 uppercase tracking-widest block font-bold">
                    關鍵時間點 (TIMELINE)
                  </span>
                  <ul className="text-xs text-stone-300 space-y-1.5 pt-1">
                    <li className="flex items-center justify-between border-b border-stone-800/60 pb-1">
                      <span>大廳驗票入場</span>
                      <span className="text-[#8c2d2d] font-bold">18:30</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-stone-800/60 pb-1">
                      <span>觀眾席座無虛席封門</span>
                      <span className="text-stone-300">18:55</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-stone-800/60 pb-1">
                      <span>大幕正式拉開 (Show Start)</span>
                      <span className="text-[#8c2d2d] font-bold">19:00</span>
                    </li>
                  </ul>
                </div>

                {/* Driving & Parking Advice */}
                <div className="pt-2 space-y-2 border-t border-stone-800">
                  <div className="flex items-center gap-2 text-xs text-stone-300 font-semibold">
                    <Car className="w-4 h-4 text-[#2b3a4a]" />
                    <span>自行開車與來賓停車</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    校內設有來賓專用停車場，請由中央路校門口進出大愛樓周邊，並配合指引專員方向引導。
                  </p>
                </div>

                <div className="pt-2 space-y-2 border-t border-stone-800">
                  <div className="flex items-center gap-2 text-xs text-stone-300 font-semibold">
                    <Bus className="w-4 h-4 text-[#2b3a4a]" />
                    <span>大眾運輸指引</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    搭乘市區公車或客運至「慈濟大學中央校區」或「慈濟醫院」站下車，步行至大愛樓 3F 演藝廳。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Frequently Asked Questions FAQ (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif-tc text-xl font-bold text-[#f5f5f4] flex items-center gap-2 border-b border-stone-800 pb-3">
              <HelpCircle className="w-5 h-5 text-[#8c2d2d]" />
              <span>常見問題解答 (FAQ)</span>
            </h3>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="smoked-card border border-stone-800/80 rounded-sm overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none hover:bg-stone-800/30 transition-colors"
                    >
                      <span className="font-serif-tc text-sm sm:text-base font-semibold text-stone-200">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#8c2d2d] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
                      )}
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
                          <div className="px-4 pb-5 pt-1 text-xs sm:text-sm text-stone-400 font-sans leading-relaxed border-t border-stone-800/50 bg-[#121214]/50">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Note on etiquette */}
            <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-sm text-xs font-sans text-stone-400 flex items-start gap-3 mt-4">
              <ShieldCheck className="w-4 h-4 text-[#8c2d2d] shrink-0 mt-0.5" />
              <span>
                演出期間敬請將行動電話調整為靜音或關機模式。演出中未經許可請勿進行閃光燈攝影，感謝您的尊重與配合。
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
