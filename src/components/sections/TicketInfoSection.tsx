import React from 'react';
import { Ticket, BookOpen, Users2, Sparkles, MapPin, CheckCircle2, Info, Clock, Building } from 'lucide-react';
import { motion } from 'motion/react';
import { SHOW_DETAILS } from '../../data/showData';
import { ambientSynth } from '../../utils/audioSynth';

export const TicketInfoSection: React.FC = () => {
  return (
    <section id="tickets" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#121214] border-t border-stone-800/80 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8c2d2d]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.25em] text-[#8c2d2d] uppercase font-bold">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Physical Ticket Distribution Guide</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            實體門票索取與入場指引
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            本次《悲慘世界》高三英文公演全程免費！全場憑實體精美紙本門票自由入場，歡迎向合作書局或參演學生索取。
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </div>

        {/* 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: 3 Ways to Get Tickets (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-serif-tc text-xl font-bold text-[#f5f5f4] flex items-center gap-2 border-b border-stone-800 pb-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>三大實體索票途徑 (How to Get Your Tickets)</span>
              </h3>

              {/* Way 1: Bookstore Pickup */}
              <div className="p-5 sm:p-6 bg-[#1a1a1c]/90 border border-stone-800 rounded-sm hover:border-amber-500/40 transition-all space-y-3 group shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8c2d2d]/20 border border-[#8c2d2d]/60 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                        1. 花蓮在地合作書局免費索取
                      </h4>
                      <span className="text-[11px] font-sans text-stone-500 uppercase tracking-widest block">
                        Cooperating Bookstores
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-serif-tc font-bold rounded-sm shrink-0">
                    合作地點
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans sm:pl-13 pl-0">
                  即日起可至花蓮合作書局門市（如政大書城、文化書局等）服務櫃檯免費索取《悲慘世界》紀念紙本門票，數量有限，索完為止。
                </p>
              </div>

              {/* Way 2: High School Students Distribution */}
              <div className="p-5 sm:p-6 bg-[#1a1a1c]/90 border border-stone-800 rounded-sm hover:border-amber-500/40 transition-all space-y-3 group shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2b3a4a]/40 border border-[#2b3a4a] text-sky-300 flex items-center justify-center shrink-0 shadow-inner">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                        2. 高二知足班同學親送索取
                      </h4>
                      <span className="text-[11px] font-sans text-stone-500 uppercase tracking-widest block">
                        Direct Student Distribution
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-serif-tc font-bold rounded-sm shrink-0">
                    校內直拿
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans sm:pl-13 pl-0">
                  高二知足班（雙語班）全體演員與製作團隊同學將直接領取門票帶回家，親自發放給家人、親友與師長，歡迎直接向認識的同學索取。
                </p>
              </div>

              {/* Way 3: On-Site Standby */}
              <div className="p-5 sm:p-6 bg-[#1a1a1c]/90 border border-stone-800 rounded-sm hover:border-amber-500/40 transition-all space-y-3 group shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center shrink-0 shadow-inner">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                        3. 開演前現場候補 (18:50)
                      </h4>
                      <span className="text-[11px] font-sans text-stone-500 uppercase tracking-widest block">
                        On-Site Standby Entry
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-stone-800 border border-stone-700 text-stone-300 text-xs font-serif-tc font-bold rounded-sm shrink-0">
                    現場候補
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans sm:pl-13 pl-0">
                  開演前 10 分鐘（18:50），若演藝廳內仍有空餘座椅，將開放無票民眾依序現場排隊候補入場，額滿為止。
                </p>
              </div>
            </div>

            {/* Notice Box */}
            <div className="p-4 bg-[#8c2d2d]/10 border border-[#8c2d2d]/40 rounded-sm text-xs font-sans text-stone-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#8c2d2d] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-200">免費公益提醒：</span>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  本場公演為免費公益自由入場項目，門票不得用於商業買賣。憑實體門票可於 18:30 起優先驗票入場，自由選座。
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Ticket Preview Card Showcase (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="relative p-6 sm:p-8 bg-gradient-to-b from-[#251d18] via-[#1c1511] to-[#140e0b] border-2 border-amber-600/50 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
              {/* Corner Gold Flourish */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

              {/* Header Badge */}
              <div className="text-center space-y-1 border-b border-amber-500/30 pb-4">
                <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-amber-400 uppercase block">
                  COMMEMORATIVE ADMISSION TICKET
                </span>
                <h4 className="font-cinzel text-2xl font-bold text-amber-100 tracking-wider">
                  LES MISÉRABLES
                </h4>
                <p className="font-serif-tc text-xs text-stone-300">
                  2026 慈大附中高二知足班（雙語班）公演實體門票樣式
                </p>
              </div>

              {/* Vintage Ticket Details */}
              <div className="space-y-3 text-xs font-serif-tc">
                <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
                  <span className="text-stone-400 font-sans text-[11px]">演出日期 (Date)</span>
                  <span className="text-amber-200 font-bold">{SHOW_DETAILS.eventDateFormatted}</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
                  <span className="text-stone-400 font-sans text-[11px]">開演時間 (Time)</span>
                  <span className="text-amber-200 font-bold">18:30 入場 / 19:00 開演</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
                  <span className="text-stone-400 font-sans text-[11px]">演出地點 (Venue)</span>
                  <span className="text-amber-200 font-bold">{SHOW_DETAILS.venue}</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
                  <span className="text-stone-400 font-sans text-[11px]">座位規則 (Seating)</span>
                  <span className="text-amber-200 font-bold">憑實體門票自由入座</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-sans text-[11px]">門票性質 (Ticket Type)</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>全場免費 (Free Admission)</span>
                  </span>
                </div>
              </div>

              {/* Decorative Ticket Stub Barcode / Stamp */}
              <div className="pt-4 border-t-2 border-dashed border-amber-600/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-sans text-stone-500 uppercase tracking-widest block">
                    TICKET STUB CODE
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold tracking-widest">
                    LM2026-TCSH-PASS
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 bg-[#8c2d2d] text-amber-200 font-cinzel text-[10px] font-bold flex items-center justify-center text-center p-1 leading-tight uppercase shadow-md rotate-[-12deg]">
                  OFFICIAL TICKET
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
