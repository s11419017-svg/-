import React, { useState, memo, lazy, Suspense, startTransition, useEffect, useRef } from 'react';
import { Users, Edit3, Trash2, Plus, MessageSquareQuote, Camera, LayoutGrid, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CastMember } from '../../types';
import { ambientSynth } from '../../utils/audioSynth';
import { LazyImage } from '../common/LazyImage';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Lazy-loaded D3 Character Relationship Network: detached from critical initial render path
const CharacterNetwork = lazy(() =>
  import('./CharacterNetwork').then((m) => ({ default: m.CharacterNetwork }))
);

interface CastSectionProps {
  members: CastMember[];
  isEditMode: boolean;
  onSelectMember: (member: CastMember) => void;
  onEditMember: (member: CastMember) => void;
  onDeleteMember: (id: string) => void;
  onAddNewMember: () => void;
  onConsultAi?: (characterId?: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

interface CastMemberCardProps {
  member: CastMember;
  isEditMode: boolean;
  onSelectMember: (member: CastMember) => void;
  onEditMember: (member: CastMember) => void;
  onDeleteMember: (id: string) => void;
}

const CastMemberCard = memo<CastMemberCardProps>(({
  member,
  isEditMode,
  onSelectMember,
  onEditMember,
  onDeleteMember,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleCardClick = () => {
    if (!isEditMode && member) {
      ambientSynth.playCardClickSFX();
      onSelectMember(member);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (member) onEditMember(member);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!member?.id) return;
    if (confirm(`確定要刪除 ${member?.name || '此成員'} 的資料嗎？`)) {
      onDeleteMember(member.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditMode || !cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9.5;
    const rotateY = ((x - centerX) / centerX) * 9.5;
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80';

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      whileTap={!isEditMode ? { scale: 0.98 } : undefined}
      key={member?.id || 'unknown'}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      tabIndex={!isEditMode ? 0 : undefined}
      role={!isEditMode ? 'button' : undefined}
      aria-label={!isEditMode ? `查看 ${member?.name || '演員'} 飾演 ${member?.roleName || '角色'} (${member?.roleNameEn || ''}) 的詳細自白與角色介紹` : undefined}
      className={`group smoked-card rounded-xl border overflow-hidden p-6 flex flex-col justify-between space-y-5 relative h-full transform-gpu focus-visible:ring-2 focus-visible:ring-amber-400 transition-transform duration-150 ease-out will-change-transform ${
        isEditMode
          ? 'border-[#8c2d2d]/70 bg-[#121214]'
          : 'border-[var(--theme-card-border)] hover:border-amber-500/50 cursor-pointer smoked-card-hover shadow-lg'
      }`}
    >
      {/* Quick Edit Overlay Bar in Edit Mode */}
      {isEditMode && (
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs font-sans">
          <span className="text-xs text-amber-300 font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
            <span>演職樣板編輯</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditClick}
              className="px-3 py-1.5 bg-[#8c2d2d] hover:bg-[#a33535] text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={`編輯 ${member?.name || '演職人員'} 的照片與資訊`}
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>換照片/修改</span>
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-stone-400 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400 rounded"
              aria-label={`刪除 ${member?.name || '此成員'}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Portrait & Role Hierarchy */}
      <div className="space-y-4">
        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-900/90 relative border border-stone-800/80 group shadow-md">
          <LazyImage
            src={member?.image || fallbackImage}
            fallbackSrc={fallbackImage}
            alt={`${member?.name || '演職人員'} 飾演 ${member?.roleName || '角色'} (${member?.roleNameEn || ''}) 的定裝照`}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-95" />
          
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-amber-200/90 font-serif-tc tracking-widest block font-medium">
                {member?.classYear ?? '高二知足雙語班'}
              </span>
              <h3 className="font-serif-tc text-xl sm:text-2xl font-bold text-white group-hover:text-amber-200 transition-colors drop-shadow-sm">
                {member?.name || '姓名未輸入'}
              </h3>
            </div>
          </div>

          {/* Hover Upload Hint in Edit Mode */}
          {isEditMode && (
            <button
              onClick={handleEditClick}
              aria-label={`點擊上傳 ${member?.name || '演員'} 的真實照片`}
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-sans text-xs focus-visible:opacity-100 backdrop-blur-xs"
            >
              <Camera className="w-7 h-7 text-amber-400" aria-hidden="true" />
              <span className="font-bold">點擊更換演出定裝照</span>
            </button>
          )}
        </div>

        {/* Editorial Role Typography Lockup */}
        <div className="space-y-1 pt-1">
          <div className="font-cinzel text-lg sm:text-xl font-bold text-[var(--theme-text-primary)] tracking-wide group-hover:text-amber-300 transition-colors leading-snug">
            {member?.roleNameEn || 'Role Name'}
          </div>
          <div className="font-serif-tc text-sm sm:text-base text-amber-400 font-semibold tracking-wide">
            {member?.roleName || '角色名稱'}
          </div>
        </div>
      </div>

      {/* Teaser Heartfelt Quote Snippet */}
      <div className="pt-4 border-t border-[var(--theme-card-border)] space-y-3">
        <blockquote className="border-l-2 border-[#8c2d2d] pl-3.5 py-0.5 font-serif-tc text-xs sm:text-sm text-[var(--theme-text-secondary)] italic line-clamp-2 leading-relaxed">
          "{member?.quote || '尚未填寫演員真心話...'}"
        </blockquote>

        <div className="flex items-center justify-between text-xs text-[#8c2d2d] dark:text-amber-400 group-hover:translate-x-1 transition-transform pt-1 font-medium">
          <span className="flex items-center gap-1.5 font-serif-tc">
            <MessageSquareQuote className="w-4 h-4 text-amber-500" />
            <span>{isEditMode ? '點擊編輯演職全貌' : '閱讀演員自白與角色'}</span>
          </span>
          <span className="text-base leading-none">→</span>
        </div>
      </div>
    </motion.div>
  );
});

CastMemberCard.displayName = 'CastMemberCard';

export const CastSection: React.FC<CastSectionProps> = memo(({
  members,
  isEditMode,
  onSelectMember,
  onEditMember,
  onDeleteMember,
  onAddNewMember,
  onConsultAi,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'network'>('cards');
  const [filterCategory, setFilterCategory] = useState<'all' | 'principal' | 'ensemble' | 'crew'>('all');

  const safeMembers: CastMember[] = Array.isArray(members) ? members : [];

  const filteredMembers: CastMember[] =
    filterCategory === 'all'
      ? safeMembers
      : safeMembers.filter((m: CastMember) => (m?.category ?? 'ensemble') === filterCategory);

  const handleSelectCardsView = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setViewMode('cards');
    });
  };

  const handleSelectNetworkView = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setViewMode('network');
    });
  };

  const handleFilterAll = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setFilterCategory('all');
    });
  };

  const handleFilterPrincipal = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setFilterCategory('principal');
    });
  };

  const handleFilterEnsemble = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setFilterCategory('ensemble');
    });
  };

  const handleFilterCrew = () => {
    ambientSynth.playButtonClickSFX();
    startTransition(() => {
      setFilterCategory('crew');
    });
  };

  // GSAP 2.5D Parallax on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ctx = gsap.context(() => {
      gsap.to('.cast-parallax-decor', {
        scrollTrigger: {
          trigger: '#cast',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
        y: 80,
        ease: 'none',
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="cast" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-stone-800/60 overflow-hidden">
      {/* 2.5D Parallax Floating Crest Layer */}
      <div className="cast-parallax-decor absolute -top-12 -right-12 w-96 h-96 rounded-full bg-radial from-[#d4b589]/10 via-[#8c2d2d]/10 to-transparent blur-3xl pointer-events-none transform-gpu" aria-hidden="true" />
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase">
            <Users className="w-3.5 h-3.5" />
            <span>Cast & Production Crew</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            演員群像與角色關係圖
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            點擊卡片聆聽演員真心告白，或切換至「角色關係圖」探索《悲慘世界》角色間的交織宿命與經典英文對話。
          </p>

          {isEditMode && (
            <div className="pt-2">
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  onAddNewMember();
                }}
                className="inline-flex items-center gap-2 px-5 py-2 border border-[#8c2d2d] bg-[#8c2d2d]/20 hover:bg-[#8c2d2d] text-white text-xs font-sans font-bold rounded-sm transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>新增一位演職同學卡片</span>
              </button>
            </div>
          )}

          <div className="w-12 h-[1px] bg-[#8c2d2d] mx-auto mt-4" />
        </div>

        {/* View Mode Switcher (Card Gallery vs Relationship Graph) */}
        <div className="flex justify-center border-b border-stone-800 pb-6">
          <div className="inline-flex p-1 bg-stone-900 border border-stone-800 rounded-lg font-sans text-xs shadow-inner">
            <button
              onClick={handleSelectCardsView}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md transition-all ${
                viewMode === 'cards'
                  ? 'bg-[#8c2d2d] text-white font-bold shadow-lg'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>演職名單卡片 (Card Gallery)</span>
            </button>
            <button
              onClick={handleSelectNetworkView}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md transition-all ${
                viewMode === 'network'
                  ? 'bg-[#8c2d2d] text-white font-bold shadow-lg'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>《悲慘世界》角色關係圖 (D3 Relationship Graph)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content View Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'network' ? (
            <motion.div
              key="network-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense
                fallback={
                  <div className="h-[550px] w-full bg-[#0c0c0e] border border-stone-800 rounded-sm flex flex-col items-center justify-center gap-3 text-stone-400">
                    <div className="w-8 h-8 border-2 border-stone-700 border-t-[#8c2d2d] rounded-full animate-spin" />
                    <span className="text-xs font-sans tracking-wide">正在載入《悲慘世界》人物關係圖譜模組...</span>
                  </div>
                }
              >
                <CharacterNetwork />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="cards-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Category Segmented Control Tabs (Anti-Slop Clean Architecture) */}
              <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-stone-200/90 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-800 rounded-xl font-sans text-xs flex-wrap justify-center gap-1.5 shadow-inner">
                  <button
                    onClick={handleFilterAll}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                      filterCategory === 'all'
                        ? 'bg-[#8c2d2d] text-white font-bold shadow-md'
                        : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-300/60 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    全體團隊 ({safeMembers.length})
                  </button>
                  <button
                    onClick={handleFilterPrincipal}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                      filterCategory === 'principal'
                        ? 'bg-[#8c2d2d] text-white font-bold shadow-md'
                        : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-300/60 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    主要領銜演員
                  </button>
                  <button
                    onClick={handleFilterEnsemble}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                      filterCategory === 'ensemble'
                        ? 'bg-[#8c2d2d] text-white font-bold shadow-md'
                        : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-300/60 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    歌隊與合唱群
                  </button>
                  <button
                    onClick={handleFilterCrew}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                      filterCategory === 'crew'
                        ? 'bg-[#8c2d2d] text-white font-bold shadow-md'
                        : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-300/60 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    導演與幕後團隊
                  </button>
                </div>
              </div>

              {/* Cast Card Grid Matrix - Roomy 3-column layout with generous breathing room */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '150px 0px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredMembers.map((member) => (
                  <CastMemberCard
                    key={member.id}
                    member={member}
                    isEditMode={isEditMode}
                    onSelectMember={onSelectMember}
                    onEditMember={onEditMember}
                    onDeleteMember={onDeleteMember}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

CastSection.displayName = 'CastSection';
