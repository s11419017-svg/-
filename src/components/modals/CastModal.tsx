import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Quote, Sparkles, UserCheck, Heart, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CastMember } from '../../types';

interface CastModalProps {
  member: CastMember | null;
  onClose: () => void;
}

export const CastModal: React.FC<CastModalProps> = ({ member, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (member) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [member, onClose]);

  const playSpokenLine = () => {
    if ('speechSynthesis' in window && member?.spokenLine) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(member.spokenLine);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return createPortal(
    <AnimatePresence>
      {member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md"
        >
          {/* Modal Container with Smoked Glass Aesthetic */}
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#1a1a1c] border border-stone-700/80 rounded-sm shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#1a1a1c]/80 text-stone-400 hover:text-white border border-stone-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-12">
              {/* Left Photo & Character Title */}
              <div className="sm:col-span-5 relative bg-stone-900 border-b sm:border-b-0 sm:border-r border-stone-800 flex flex-col justify-between p-6">
                <div className="aspect-[3/4] relative rounded-sm overflow-hidden mb-4 border border-stone-800">
                  <img
                    src={member.image}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale contrast-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <span className="text-[10px] font-sans tracking-widest text-stone-400 uppercase block">
                      {member.classYear}
                    </span>
                    <span className="font-serif-tc text-lg font-bold text-[#f5f5f4] block">
                      {member.name}
                    </span>
                  </div>
                </div>

                {/* Role Title Badge */}
                <div className="text-center space-y-1">
                  <span className="text-xs text-[#8c2d2d] font-sans font-bold uppercase tracking-widest">
                    演出角色 • ROLE
                  </span>
                  <h3 className="font-cinzel text-xl font-bold text-[#f5f5f4]">
                    {member.roleNameEn}
                  </h3>
                  <p className="font-serif-tc text-sm text-stone-300">
                    {member.roleName}
                  </p>
                </div>
              </div>

              {/* Right Heartfelt Quote & Reflection Details */}
              <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  {/* Top Label */}
                  <div className="flex items-center gap-2 text-xs text-[#8c2d2d] font-sans uppercase tracking-widest">
                    <Heart className="w-3.5 h-3.5 fill-[#8c2d2d]" />
                    <span>演員真心告白 • Actor's Voice</span>
                  </div>

                  {/* Heartfelt Student Quote */}
                  <div className="space-y-2">
                    <blockquote className="font-serif-tc text-base sm:text-lg text-amber-100/90 leading-relaxed italic border-l-2 border-[#8c2d2d] pl-4 py-1">
                      {member.quote}
                    </blockquote>
                  </div>

                  {/* Character Background in Play */}
                  <div className="space-y-1 pt-2 border-t border-stone-800/80">
                    <span className="text-[11px] font-sans tracking-wider text-stone-400 uppercase block">
                      角色劇本設定 (Character Profile)
                    </span>
                    <p className="text-xs text-stone-300 leading-relaxed font-sans">
                      {member.characterBio}
                    </p>
                  </div>

                  {/* Student Reflection */}
                  <div className="space-y-1 pt-2 border-t border-stone-800/80">
                    <span className="text-[11px] font-sans tracking-wider text-stone-400 uppercase block">
                      排練心得與體會 (Rehearsal Journey)
                    </span>
                    <p className="text-xs text-stone-300 leading-relaxed font-sans">
                      {member.reflection}
                    </p>
                  </div>

                  {/* Favorite Quote / Song Badge */}
                  {member.favoriteQuote && (
                    <div className="flex items-center gap-2 text-xs font-sans text-amber-200/90 pt-1">
                      <Music className="w-3.5 h-3.5 text-[#8c2d2d]" />
                      <span className="text-stone-400">代表曲目：</span>
                      <span className="font-serif-tc font-semibold">《{member.favoriteQuote}》</span>
                    </div>
                  )}

                  {/* Audio spoken line preview if available */}
                  {member.spokenLine && (
                    <div className="pt-2">
                      <button
                        onClick={playSpokenLine}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-xs font-sans transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#8c2d2d]" />
                        <span>試聽經典英文口白朗讀</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Modal Bottom Tag */}
                <div className="pt-4 border-t border-stone-800 text-right">
                  <span className="text-[10px] text-stone-500 font-sans tracking-widest uppercase">
                    慈大附中高三英文公演《Les Misérables》
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

