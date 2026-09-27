import React, { memo } from 'react';
import { Ticket, BookOpen, Users2, Sparkles, CheckCircle2, Info, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useShowGeneralConfig } from '../../context/ShowDataContext';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';

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

export const TicketInfoSection: React.FC = memo(() => {
  const config = useShowGeneralConfig();

  return (
    <section id="tickets" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-stone-800/80 overflow-hidden">
      {/* Ambient Lighting & Backdrop Flares */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#8c2d2d]/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[300px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.25em] text-[#8c2d2d] uppercase font-bold">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Admission & Ticketing Guide</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            門票索取與入場指引
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            本次《{config.titleZh}》{config.gradeName}英文公演全場免費！{config.ticketNotice}
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </motion.div>

        {/* 2-Column Main Content Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch"
        >
          {/* Left Column: 3 Ways to Get Tickets (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-serif-tc text-xl font-bold text-[#f5f5f4] flex items-center gap-2 border-b border-stone-800 pb-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>三大索票途徑 (How to Get Your Tickets)</span>
              </h3>

              {/* Way 1: Online / Bookstore */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                onClick={() => ambientSynth.playCardClickSFX()}
                className="p-6 sm:p-7 smoked-card smoked-card-hover rounded-xl border border-[var(--theme-card-border)] space-y-4 group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#8c2d2d]/15 border border-[#8c2d2d]/40 text-[#8c2d2d] dark:text-amber-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-[var(--theme-text-primary)] group-hover:text-[#8c2d2d] dark:group-hover:text-amber-300 transition-colors">
                        1. 線上表單登記與在地書局索取
                      </h4>
                      <span className="text-xs font-sans text-[var(--theme-text-muted)] uppercase tracking-widest block font-medium">
                        Online Registration & Bookstore Pickup
                      </span>
                    </div>
                  </div>
                  <MagneticWrapper strength={0.2}>
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-600/30 text-amber-800 dark:text-amber-300 text-xs font-serif-tc font-bold rounded-lg shrink-0 shadow-sm">
                      {config.ticketStatus === 'open' ? '開放登記中' : config.ticketStatus === 'coming_soon' ? '即將開放' : '已截止'}
                    </span>
                  </MagneticWrapper>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] leading-relaxed font-sans sm:pl-14 pl-0">
                  {config.ticketReleaseDate}。亦可至花蓮合作書局門市（政大書城、文化書局等）服務櫃檯免費索取《{config.titleZh}》紀念紙本門票，數量有限，索完為止。
                </p>
                {config.ticketUrl && (
                  <div className="sm:pl-14 pt-1">
                    <a
                      href={config.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-serif-tc font-bold rounded-lg shadow-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        ambientSynth.playButtonClickSFX();
                      }}
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-300" />
                      <span>{config.ticketButtonText}</span>
                      <ExternalLink className="w-3 h-3 text-white/80" />
                    </a>
                  </div>
                )}
              </motion.div>

              {/* Way 2: High School Students Distribution */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                onClick={() => ambientSynth.playCardClickSFX()}
                className="p-6 sm:p-7 smoked-card smoked-card-hover rounded-xl border border-[var(--theme-card-border)] space-y-4 group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-[var(--theme-text-primary)] group-hover:text-[#8c2d2d] dark:group-hover:text-amber-300 transition-colors">
                        2. {config.gradeName}同學親送索取
                      </h4>
                      <span className="text-xs font-sans text-[var(--theme-text-muted)] uppercase tracking-widest block font-medium">
                        Direct Student Distribution
                      </span>
                    </div>
                  </div>
                  <MagneticWrapper strength={0.2}>
                    <span className="px-3 py-1 bg-sky-500/10 border border-sky-600/30 text-sky-800 dark:text-sky-300 text-xs font-serif-tc font-bold rounded-lg shrink-0 shadow-sm">
                      校內直拿
                    </span>
                  </MagneticWrapper>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] leading-relaxed font-sans sm:pl-14 pl-0">
                  {config.gradeName}全體演職團隊同學將直接領取門票帶回家，親自發放給家人、親友與師長，歡迎直接向認識的同學索取。
                </p>
              </motion.div>

              {/* Way 3: On-Site Standby */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                onClick={() => ambientSynth.playCardClickSFX()}
                className="p-6 sm:p-7 smoked-card smoked-card-hover rounded-xl border border-[var(--theme-card-border)] space-y-4 group cursor-pointer shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-stone-500/15 border border-stone-500/30 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif-tc text-base sm:text-lg font-bold text-[var(--theme-text-primary)] group-hover:text-[#8c2d2d] dark:group-hover:text-amber-300 transition-colors">
                        3. 開演前現場候補 (18:50)
                      </h4>
                      <span className="text-xs font-sans text-[var(--theme-text-muted)] uppercase tracking-widest block font-medium">
                        On-Site Standby Entry
                      </span>
                    </div>
                  </div>
                  <MagneticWrapper strength={0.2}>
                    <span className="px-3 py-1 bg-stone-500/10 border border-stone-600/30 text-stone-700 dark:text-stone-300 text-xs font-serif-tc font-bold rounded-lg shrink-0 shadow-sm">
                      現場候補
                    </span>
                  </MagneticWrapper>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] leading-relaxed font-sans sm:pl-14 pl-0">
                  開演前 10 分鐘（18:50），若演藝廳內仍有空餘座椅，將開放無票民眾依序現場排隊候補入場，額滿為止。
                </p>
              </motion.div>
            </div>

            {/* Notice Box */}
            <motion.div
              variants={itemVariants}
              className="p-5 bg-[#8c2d2d]/10 border border-[#8c2d2d]/30 rounded-xl text-xs font-sans text-[var(--theme-text-secondary)] flex items-start gap-3.5 shadow-md"
            >
              <Info className="w-5 h-5 text-[#8c2d2d] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm text-[#8c2d2d] dark:text-amber-200">免費公益提醒：</span>
                <p className="text-[var(--theme-text-secondary)] text-xs leading-relaxed">
                  本場公演為免費公益自由入場項目，門票不得用於商業買賣。憑實體門票或登記證明可於 {config.doorTime} 起優先驗票入場，自由選座。
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Physical Ticket Preview Card Showcase (5 cols) with 3D Tilt & Sheen */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 flex flex-col justify-center perspective-[1000px]"
          >
            <motion.div
              whileHover={{ scale: 1.02, rotateY: 3, rotateX: -2, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              onClick={() => ambientSynth.playCardClickSFX()}
              className="commemorative-ticket relative p-6 sm:p-8 rounded-xl space-y-6 group cursor-pointer overflow-hidden shadow-2xl border border-amber-500/40"
            >
              {/* Gold light sheen sweep effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              {/* Corner Gold Flourish */}
              <div className="ticket-flourish absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 pointer-events-none" />
              <div className="ticket-flourish absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 pointer-events-none" />
              <div className="ticket-flourish absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 pointer-events-none" />
              <div className="ticket-flourish absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 pointer-events-none" />

              {/* Header Badge */}
              <div className="ticket-divider text-center space-y-1 border-b pb-4">
                <span className="ticket-header-badge font-cinzel text-xs font-bold tracking-[0.2em] uppercase block">
                  COMMEMORATIVE ADMISSION TICKET
                </span>
                <h4 className="ticket-header-title font-cinzel text-2xl font-bold tracking-wider">
                  {config.titleEn}
                </h4>
                <p className="ticket-subtitle font-serif-tc text-xs">
                  {config.subhead}
                </p>
              </div>

              {/* Vintage Ticket Details */}
              <div className="space-y-3 text-xs font-serif-tc">
                <div className="ticket-divider flex justify-between items-center border-b pb-2">
                  <span className="ticket-row-label font-sans text-[11px]">演出日期 (Date)</span>
                  <span className="ticket-row-value">{config.eventDateFormatted}</span>
                </div>
                <div className="ticket-divider flex justify-between items-center border-b pb-2">
                  <span className="ticket-row-label font-sans text-[11px]">開演時間 (Time)</span>
                  <span className="ticket-row-value">{config.doorTime} / {config.showTime}</span>
                </div>
                <div className="ticket-divider flex justify-between items-center border-b pb-2">
                  <span className="ticket-row-label font-sans text-[11px]">演出地點 (Venue)</span>
                  <span className="ticket-row-value">{config.venueName}</span>
                </div>
                <div className="ticket-divider flex justify-between items-center border-b pb-2">
                  <span className="ticket-row-label font-sans text-[11px]">座位規則 (Seating)</span>
                  <span className="ticket-row-value">自由入座 / 輪椅席位洽前台</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="ticket-row-label font-sans text-[11px]">門票性質 (Ticket Type)</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 font-serif-tc">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>全場免費 (Free Admission)</span>
                  </span>
                </div>
              </div>

              {/* Decorative Ticket Stub Barcode / Stamp */}
              <div className="ticket-stub-border pt-4 border-t-2 border-dashed flex items-center justify-between">
                <div>
                  <span className="ticket-row-label text-[10px] font-sans uppercase tracking-widest block font-medium">
                    TICKET STUB CODE
                  </span>
                  <span className="ticket-stub-code font-mono text-xs font-bold tracking-widest">
                    LM2026-TCSH-PASS
                  </span>
                </div>
                <div className="ticket-stamp w-12 h-12 rounded-full border-2 font-cinzel text-[10px] font-bold flex items-center justify-center text-center p-1 leading-tight uppercase shadow-md rotate-[-12deg] group-hover:rotate-0 transition-transform duration-300">
                  OFFICIAL TICKET
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

TicketInfoSection.displayName = 'TicketInfoSection';

