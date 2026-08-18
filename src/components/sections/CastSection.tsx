import React, { useState } from 'react';
import { User, Users, Edit3, Trash2, Plus, MessageSquareQuote, Camera, LayoutGrid, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CastMember } from '../../types';
import { CharacterNetwork } from './CharacterNetwork';
import { ambientSynth } from '../../utils/audioSynth';
import { LazyImage } from '../common/LazyImage';

interface CastSectionProps {
  members: CastMember[];
  isEditMode: boolean;
  onSelectMember: (member: CastMember) => void;
  onEditMember: (member: CastMember) => void;
  onDeleteMember: (id: string) => void;
  onAddNewMember: () => void;
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
  hidden: { opacity: 0, y: 24, scale: 0.96 },
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

export const CastSection: React.FC<CastSectionProps> = ({
  members,
  isEditMode,
  onSelectMember,
  onEditMember,
  onDeleteMember,
  onAddNewMember,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'network'>('cards');
  const [filterCategory, setFilterCategory] = useState<'all' | 'principal' | 'ensemble' | 'crew'>('all');

  const filteredMembers = members.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  return (
    <section id="cast" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#1a1a1c] border-t border-stone-800/60">
      <div className="max-w-7xl mx-auto space-y-10">
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
                onClick={onAddNewMember}
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
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setViewMode('cards');
              }}
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
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setViewMode('network');
              }}
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
              <CharacterNetwork />
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
              {/* Category Filter Pills */}
              <div className="flex justify-center gap-3 font-sans text-xs">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-4 py-2 border rounded-full transition-all ${
                    filterCategory === 'all'
                      ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-[#f5f5f4]'
                      : 'border-stone-800 bg-[#1a1a1c] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  全體團隊 ({members.length})
                </button>
                <button
                  onClick={() => setFilterCategory('principal')}
                  className={`px-4 py-2 border rounded-full transition-all ${
                    filterCategory === 'principal'
                      ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-[#f5f5f4]'
                      : 'border-stone-800 bg-[#1a1a1c] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  主要演員
                </button>
                <button
                  onClick={() => setFilterCategory('ensemble')}
                  className={`px-4 py-2 border rounded-full transition-all ${
                    filterCategory === 'ensemble'
                      ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-[#f5f5f4]'
                      : 'border-stone-800 bg-[#1a1a1c] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  歌隊 / 合唱群
                </button>
                <button
                  onClick={() => setFilterCategory('crew')}
                  className={`px-4 py-2 border rounded-full transition-all ${
                    filterCategory === 'crew'
                      ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-[#f5f5f4]'
                      : 'border-stone-800 bg-[#1a1a1c] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  幕後團隊 / 導演
                </button>
              </div>

              {/* Cast Card Grid Matrix */}
              <motion.div
                layout
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {filteredMembers.map((member) => (
                    <motion.div
                      layout
                      variants={itemVariants}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={!isEditMode ? { y: -4 } : {}}
                      key={member.id}
                      onClick={() => {
                        if (!isEditMode) {
                          ambientSynth.playCardClickSFX();
                          onSelectMember(member);
                        }
                      }}
                      className={`group smoked-card rounded-sm border overflow-hidden p-5 flex flex-col justify-between space-y-4 relative ${
                        isEditMode
                          ? 'border-[#8c2d2d]/60 bg-[#121214]'
                          : 'border-stone-800/80 cursor-pointer smoked-card-hover'
                      }`}
                    >
                      {/* Quick Edit Overlay Bar in Edit Mode */}
                      {isEditMode && (
                        <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs font-sans">
                          <span className="text-[10px] text-amber-300 font-bold tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>[樣板/可修改]</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMember(member);
                              }}
                              className="px-2.5 py-1 bg-[#8c2d2d] hover:bg-[#8c2d2d]/80 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow"
                              title="替換照片或修改姓名"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>換照片/修改</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`確定要刪除 ${member.name} 的資料嗎？`)) {
                                  onDeleteMember(member.id);
                                }
                              }}
                              className="p-1 text-stone-500 hover:text-red-400"
                              title="刪除成員"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Photo & Role Header */}
                      <div className="space-y-3">
                        <div className="aspect-[4/5] rounded-sm overflow-hidden bg-stone-900 relative border border-stone-800 group">
                          <LazyImage
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent opacity-90" />
                          
                          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                            <div>
                              <span className="text-[10px] text-stone-400 font-sans tracking-widest block">
                                {member.classYear}
                              </span>
                              <h3 className="font-serif-tc text-lg font-bold text-[#f5f5f4] group-hover:text-amber-100 transition-colors">
                                {member.name || '姓名未輸入'}
                              </h3>
                            </div>
                          </div>

                          {/* Hover Upload Hint in Edit Mode */}
                          {isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMember(member);
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-sans text-xs"
                            >
                              <Camera className="w-6 h-6 text-[#8c2d2d]" />
                              <span>點擊上傳真實大頭照</span>
                            </button>
                          )}
                        </div>

                        {/* Role Titles */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-sans text-[#8c2d2d] uppercase tracking-widest font-bold">
                            飾演 • ROLE
                          </span>
                          <div className="font-cinzel text-base font-bold text-[#f5f5f4]">
                            {member.roleNameEn || 'Role Name'}
                          </div>
                          <div className="font-serif-tc text-xs text-stone-400">
                            {member.roleName || '角色名稱'}
                          </div>
                        </div>
                      </div>

                      {/* Teaser Heartfelt Quote Snippet */}
                      <div className="pt-3 border-t border-stone-800/80 space-y-2">
                        <p className="font-serif-tc text-xs text-stone-300 italic line-clamp-2">
                          {member.quote || '尚未填寫演員真心話...'}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-[#8c2d2d] group-hover:text-[#8c2d2d]/80 pt-1">
                          <span className="flex items-center gap-1 font-sans">
                            <MessageSquareQuote className="w-3.5 h-3.5" />
                            <span>{isEditMode ? '點擊編輯查看全貌' : '讀演員真心話'}</span>
                          </span>
                          <span>→</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
