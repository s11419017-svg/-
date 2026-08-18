import React, { useState } from 'react';
import { Quote, Camera, BookOpen, Layers, Maximize2, Plus, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAMOUS_QUOTES } from '../../data/showData';
import { RehearsalPhoto } from '../../types';
import { ambientSynth } from '../../utils/audioSynth';
import { LazyImage } from '../common/LazyImage';

interface JourneySectionProps {
  photos: RehearsalPhoto[];
  isEditMode: boolean;
  onSelectPhoto: (photo: RehearsalPhoto) => void;
  onEditPhoto: (photo: RehearsalPhoto) => void;
  onDeletePhoto: (id: string) => void;
  onAddPhoto: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
};

export const JourneySection: React.FC<JourneySectionProps> = ({
  photos,
  isEditMode,
  onSelectPhoto,
  onEditPhoto,
  onDeletePhoto,
  onAddPhoto,
}) => {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  return (
    <section id="journey" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-stone-800/60 bg-[#161618]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Journey & Story</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            Behind the Scenes
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            排練紀實與文學探索：紀錄慈大附中 115 級同學從英文文本研讀到舞台語言鍛造的百餘日苦練。
          </p>
          <div className="w-12 h-[1px] bg-[#8c2d2d] mx-auto mt-4" />
        </div>

        {/* Core Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* LEFT: Classic Script Quote & Literary Manuscripts (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between smoked-card p-8 sm:p-10 border border-stone-800 rounded-sm relative overflow-hidden">
            {/* Subtle background watermarked quote icon */}
            <Quote className="absolute -top-6 -right-6 w-36 h-36 text-stone-800/30 -z-0 pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <span className="text-xs font-sans tracking-widest text-[#8c2d2d] uppercase font-semibold">
                  Script Manuscript • 劇本經典摘錄
                </span>
                <span className="text-[10px] text-stone-500 font-sans">Act I & II</span>
              </div>

              {/* Featured Quote Box with AnimatePresence */}
              <div className="min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeQuoteIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <blockquote className="font-garamond text-2xl sm:text-3xl text-[#f5f5f4] leading-relaxed italic border-l-2 border-[#8c2d2d] pl-5 py-1">
                      “{FAMOUS_QUOTES[activeQuoteIndex].quoteEn}”
                    </blockquote>
                    
                    <div className="pl-5 space-y-1">
                      <p className="font-serif-tc text-stone-300 text-sm sm:text-base">
                        「{FAMOUS_QUOTES[activeQuoteIndex].quoteZh}」
                      </p>
                      <p className="text-xs font-sans text-stone-400">
                        — {FAMOUS_QUOTES[activeQuoteIndex].character}
                      </p>
                      <p className="text-[11px] font-sans text-stone-500 pt-1">
                        {FAMOUS_QUOTES[activeQuoteIndex].context}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Quote Nav Pills */}
              <div className="flex gap-2 pt-2">
                {FAMOUS_QUOTES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      ambientSynth.playCardClickSFX();
                      setActiveQuoteIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeQuoteIndex === idx ? 'w-8 bg-[#8c2d2d]' : 'w-2 bg-stone-700 hover:bg-stone-500'
                    }`}
                    aria-label={`Switch quote ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Rehearsal Essay Context */}
              <div className="pt-6 border-t border-stone-800/80 space-y-3">
                <h3 className="font-serif-tc text-sm font-semibold text-stone-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2b3a4a]" />
                  <span>從單字讀音到心靈共鳴</span>
                </h3>
                <p className="text-xs text-stone-400 font-sans leading-relaxed">
                  《悲慘世界》不僅是英文口語的極致考驗，更是一堂深刻的生命課。從 1830 年代法語辭彙的英語轉譯，到角色眼神中的絕望與救贖，高三學生們在課餘時間進行了無數次劇本對詞與歷史背景剖析。
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 text-[11px] text-stone-500 font-sans flex items-center justify-between border-t border-stone-800/60">
              <span>慈大附中英文科 115 級公演籌備小組</span>
              <span>1832 Paris Barricades</span>
            </div>
          </div>

          {/* RIGHT: Black & White Documentary Rehearsal Photo Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#8c2d2d]" />
                <span className="font-cinzel text-sm text-stone-300 tracking-wider">
                  REHEARSAL ARCHIVE (黑白排練紀實)
                </span>
              </div>

              {isEditMode ? (
                <button
                  onClick={onAddPhoto}
                  className="px-3 py-1 bg-[#8c2d2d] hover:bg-[#8c2d2d]/80 text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增實景排練照</span>
                </button>
              ) : (
                <span className="text-[11px] text-stone-500 font-sans">點擊相片可檢視高畫質細節</span>
              )}
            </div>

            <motion.div
              layout
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1"
            >
              <AnimatePresence>
                {photos.map((photo) => (
                  <motion.div
                    layout
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={!isEditMode ? { y: -4 } : {}}
                    key={photo.id}
                    onClick={() => {
                      if (!isEditMode) {
                        ambientSynth.playCardClickSFX();
                        onSelectPhoto(photo);
                      }
                    }}
                    className={`group relative smoked-card border overflow-hidden aspect-[4/3] ${
                      isEditMode
                        ? 'border-[#8c2d2d]/60 bg-[#121214]'
                        : 'border-stone-800 cursor-pointer smoked-card-hover'
                    }`}
                  >
                    <LazyImage
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                    />
                    
                    {/* Subtle Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Edit Controls Badge Overlay */}
                    {isEditMode && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                        <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] text-amber-300 font-bold border border-amber-500/40 mr-1">
                          [排練樣板]
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPhoto(photo);
                          }}
                          className="p-1.5 bg-[#8c2d2d] hover:bg-[#8c2d2d]/80 text-white rounded shadow text-xs font-sans font-bold flex items-center gap-1"
                          title="換相片或標題"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>換照/編輯</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`確定要刪除這張相片紀錄嗎？`)) {
                              onDeletePhoto(photo.id);
                            }
                          }}
                          className="p-1.5 bg-black/80 text-stone-400 hover:text-red-400 rounded shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Photo Info Badge */}
                    <div className="absolute bottom-0 inset-x-0 p-4 text-left space-y-1">
                      <span className="text-[10px] text-stone-400 font-sans tracking-widest block">
                        {photo.date} • {photo.category.toUpperCase()}
                      </span>
                      <h4 className="font-serif-tc text-sm font-semibold text-[#f5f5f4] group-hover:text-amber-200/90 transition-colors">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-sans line-clamp-1 opacity-90">
                        {photo.caption}
                      </p>
                    </div>

                    {!isEditMode && (
                      <div className="absolute top-3 right-3 p-1.5 rounded-full bg-[#1a1a1c]/80 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

