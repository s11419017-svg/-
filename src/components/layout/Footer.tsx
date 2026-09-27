import React, { memo } from 'react';
import { ArrowUp } from 'lucide-react';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';

interface FooterProps {
  onOpenChronicle?: () => void;
}

export const Footer: React.FC<FooterProps> = memo(({ onOpenChronicle }) => {
  const scrollToTop = () => {
    ambientSynth.playButtonClickSFX();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[var(--theme-card-bg)] border-t border-[var(--theme-card-border)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--theme-text-muted)] font-sans text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[var(--theme-card-border)] pb-8">
          {/* Left Title */}
          <div className="text-center md:text-left space-y-1">
            <h4 className="font-cinzel text-lg font-bold text-[var(--theme-text-primary)] tracking-wider">
              LES MISÉRABLES
            </h4>
            <p className="font-serif-tc text-xs text-[var(--theme-text-secondary)]">
              2026 慈濟大學實驗高級中學 高二知足班（雙語班）表演英文公演
            </p>
            <p className="text-[11px] text-[var(--theme-text-muted)]">
              指導單位：慈大附中教務處外語組 • 主辦單位：高二知足雙語班演職團隊
            </p>
          </div>

          {/* Back to top button */}
          <MagneticWrapper strength={0.25}>
            <button
              onClick={scrollToTop}
              className="p-3 border border-[var(--theme-card-border)] hover:border-[#8c2d2d] rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
              title="回到頂端"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </MagneticWrapper>
        </div>

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--theme-text-muted)]">
          <div>
            © 2026 Tzu Chi Senior High School Senior English Play. All Rights Reserved.
          </div>
          <div className="flex items-center gap-2">
            <span>Victor Hugo’s Original Masterpiece Adaptation</span>
            <span>•</span>
            <span className="text-[var(--theme-text-secondary)]">12/19 慈大附中演藝廳</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

