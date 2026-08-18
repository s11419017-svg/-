import React, { useState } from 'react';
import { Sparkles, Heart, Music, Quote, Award, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ambientSynth } from '../../utils/audioSynth';

interface CurtainCallSecretProps {
  onOpenAiLounge?: () => void;
  onOpenChronicle?: () => void;
}

const LES_MIS_EASTER_QUOTES = [
  {
    quote: "To love or have loved, that is enough. Ask nothing further. There is no other pearl to be found in the dark folds of life.",
    translate: "愛過或正在愛著，這便足夠了。生命幽暗的褶皺中，再沒有其他明珠。",
    author: "Victor Hugo 《悲慘世界》",
    role: "尚萬強的臨終告白 (Valjean's Final Soliloquy)"
  },
  {
    quote: "Even the darkest night will end and the sun will rise.",
    translate: "即使是最黑暗的長夜也終將結束，太陽終會升起。",
    author: "Victor Hugo 《悲慘世界》",
    role: "終曲合唱 (Finale Motto)"
  },
  {
    quote: "To love another person is to see the face of God.",
    translate: "愛另一個人，便是看見了上帝的容顏。",
    author: "Victor Hugo 《悲慘世界》",
    role: "救贖之聲 (Theme of Grace)"
  },
  {
    quote: "Do you hear the people sing, lost in the valley of the night? It is the music of a people who are climbing to the light.",
    translate: "你可聽見人民在歌唱？在黑夜的山谷中，那是向著光芒攀登的人們之樂章。",
    author: "Revolutionary Anthem",
    role: "ABC 之友革命號角 (The Barricade)"
  },
  {
    quote: "I dreamed that love would never die... I dreamed that God would be forgiving.",
    translate: "我曾夢想愛情永不凋零……我曾夢想上帝會無盡寬恕。",
    author: "Fantine",
    role: "芳婷的悲歌 (I Dreamed a Dream)"
  }
];

export const CurtainCallSecret: React.FC<CurtainCallSecretProps> = ({
  onOpenAiLounge,
  onOpenChronicle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [applauseCount, setApplauseCount] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  const handleNextQuote = () => {
    ambientSynth.playPageFlipSFX();
    setQuoteIndex((prev) => (prev + 1) % LES_MIS_EASTER_QUOTES.length);
  };

  const handleApplause = () => {
    ambientSynth.playButtonClickSFX();
    setApplauseCount((c) => c + 1);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1200);
  };

  const currentQuote = LES_MIS_EASTER_QUOTES[quoteIndex];

  return (
    <div className="border-t border-stone-800/80 bg-gradient-to-b from-[#121214] via-[#0d0d0f] to-[#08080a] py-8 px-4 text-center select-none overflow-hidden relative">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-radial from-[#8c2d2d]/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-xl mx-auto space-y-4 relative z-10">
        {/* Toggle Button for Easter Egg */}
        {!isOpen ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              ambientSynth.playButtonClickSFX();
              setIsOpen(true);
            }}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-800 hover:border-amber-500/50 bg-[#161618]/60 hover:bg-[#1a1a1c] text-stone-500 hover:text-amber-200 text-xs font-serif-tc tracking-widest transition-all duration-300 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>✨ 揭開大幕底下的謝幕彩蛋 • Curtain Call Secret</span>
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-sm bg-[#16161a] border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-5 text-left relative"
            >
              {/* Corner Gold Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-amber-400/60 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-amber-400/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-amber-400/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-amber-400/60 pointer-events-none" />

              {/* Title & Close */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-cinzel text-xs font-bold tracking-widest text-amber-200 uppercase">
                    Curtain Call & Director’s Note
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-stone-500 hover:text-stone-300 text-xs font-sans px-2 py-0.5 rounded hover:bg-stone-800 transition-colors"
                >
                  收起
                </button>
              </div>

              {/* Secret Dedication Text */}
              <div className="space-y-2 text-xs text-stone-300 font-serif-tc leading-relaxed">
                <p>
                  致每一位劃過黑暗、勇敢歌唱的靈魂：
                </p>
                <p className="text-stone-400 italic">
                  「這是一場由慈大附中高二知足班（雙語班）全體同學、幕後燈光音效、道具梳化與外語組師長共同鑄就的奇蹟。在 24601 的編號與巴黎街壘的烽火背後，願我們都能在愛與寬恕中找到救贖的光芒。」
                </p>
              </div>

              {/* Random Les Mis French/English Soul Quote */}
              <div className="bg-[#101012] p-4 rounded border border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-400/90 font-sans">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Quote className="w-3 h-3" />
                    <span>{currentQuote.role}</span>
                  </span>
                  <button
                    onClick={handleNextQuote}
                    className="flex items-center gap-1 text-stone-400 hover:text-amber-200 transition-colors text-[11px]"
                    title="切換下一句雨果經典名言"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>換一句</span>
                  </button>
                </div>
                <blockquote className="text-xs text-stone-200 font-garamond italic leading-relaxed">
                  “{currentQuote.quote}”
                </blockquote>
                <p className="text-[11px] text-stone-400 font-serif-tc">
                  — {currentQuote.translate}
                </p>
              </div>

              {/* Interactive Virtual Applause & Quick Portals */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/80">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleApplause}
                    className="px-3 py-1.5 bg-[#8c2d2d]/30 hover:bg-[#8c2d2d]/60 border border-[#8c2d2d] rounded text-xs font-serif-tc text-stone-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Heart className={`w-3.5 h-3.5 ${showSparkles ? 'text-red-400 fill-red-400 scale-125' : 'text-stone-400'} transition-all`} />
                    <span>為高二知足雙語班同學喝采！</span>
                    {applauseCount > 0 && (
                      <span className="font-mono font-bold text-amber-300 ml-1">+{applauseCount}</span>
                    )}
                  </motion.button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {onOpenAiLounge && (
                    <button
                      onClick={() => {
                        ambientSynth.playButtonClickSFX();
                        onOpenAiLounge();
                      }}
                      className="px-2.5 py-1.5 text-amber-300/80 hover:text-amber-200 hover:bg-stone-800 rounded transition-colors flex items-center gap-1 font-serif-tc"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>與角色對話</span>
                    </button>
                  )}
                  {onOpenChronicle && (
                    <button
                      onClick={() => {
                        ambientSynth.playPageFlipSFX();
                        onOpenChronicle();
                      }}
                      className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors flex items-center gap-1 font-serif-tc"
                    >
                      <span>翻閱手稿</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* The End Text */}
        <p className="text-[10px] text-stone-600 font-cinzel tracking-[0.2em] uppercase">
          — FIN DE L'HISTOIRE • LES MISÉRABLES 2026 —
        </p>
      </div>
    </div>
  );
};
