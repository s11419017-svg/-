import React from 'react';
import { BookOpen, Heart, ArrowUp } from 'lucide-react';
import { SHOW_DETAILS } from '../../data/showData';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#121214] border-t border-stone-800 py-12 px-4 sm:px-6 lg:px-8 text-stone-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-800/80 pb-8">
          {/* Left Title */}
          <div className="text-center md:text-left space-y-1">
            <h4 className="font-cinzel text-lg font-bold text-[#f5f5f4] tracking-wider">
              LES MISÉRABLES
            </h4>
            <p className="font-serif-tc text-xs text-stone-300">
              2026 慈濟大學實驗高級中學 高二知足班（雙語班）表演英文公演
            </p>
            <p className="text-[11px] text-stone-500">
              指導單位：慈大附中教務處外語組 • 主辦單位：高二知足雙語班演職團隊
            </p>
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="p-3 border border-stone-800 hover:border-stone-600 rounded-full text-stone-400 hover:text-white transition-colors"
            title="回到頂端"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <div>
            © 2026 Tzu Chi Senior High School Senior English Play. All Rights Reserved.
          </div>
          <div className="flex items-center gap-2">
            <span>Victor Hugo’s Original Masterpiece Adaptation</span>
            <span>•</span>
            <span className="text-stone-400">12/19 慈大附中演藝廳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
