import React, { useState, useEffect, useCallback, memo } from 'react';
import { Volume2, Bookmark, BookmarkCheck, HelpCircle, Eye, EyeOff, BookOpen, Share2, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayQuote } from '../../types';
import { SHOW_DETAILS } from '../../data/showData';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';

export type ExtendedPlayQuote = PlayQuote & {
  id: string;
  song?: string;
  vocab?: { word: string; pos: string; def: string }[];
  grammarNote?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
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

const EXTENDED_QUOTES: ExtendedPlayQuote[] = [
  {
    id: 'q1',
    quoteEn: "Even the darkest night will end and the sun will rise.",
    quoteZh: "即便是最黑暗的長夜終將結束，太陽必將升起。",
    character: "Victor Hugo / Finale Chorus",
    context: "高二知足雙語班英文公演主題典範，象徵青春與希望的堅持",
    song: "Finale / Epilogue",
    vocab: [
      { word: "darkest", pos: "adj.", def: "最黑暗的（最高級）" },
      { word: "rise", pos: "v.", def: "升起；復活" }
    ],
    grammarNote: "Future tense with 'will' expressing absolute hope and certainty."
  },
  {
    id: 'q2',
    quoteEn: "To love another person is to see the face of God.",
    quoteZh: "去愛一個人，就是看見上帝的容顏。",
    character: "Jean Valjean (尚萬強)",
    context: "劇末靈魂救贖與愛的終極宣示",
    song: "Epilogue",
    vocab: [
      { word: "another", pos: "pron.", def: "另一個人" },
      { word: "God", pos: "n.", def: "上帝；神聖的信仰" }
    ],
    grammarNote: "Infinitive as subject ('To love...') paired with infinitive complement ('is to see...')."
  },
  {
    id: 'q3',
    quoteEn: "Do you hear the people sing? Singing a song of angry men?",
    quoteZh: "你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌。",
    character: "Enjolras & Students (恩佐拉與革命青年)",
    context: "排練過程中最具震撼力的青年合唱經典",
    song: "Do You Hear the People Sing?",
    vocab: [
      { word: "angry", pos: "adj.", def: "憤怒的；不甘受屈的" },
      { word: "singing", pos: "v.part.", def: "分詞修飾（正在吟唱著...）" }
    ],
    grammarNote: "Present participle clause ('Singing...') modifying the people's collective voice."
  },
  {
    id: 'q4',
    quoteEn: "Who am I? Can I condemn this man to slavery? Pretend I do not feel his agony?",
    quoteZh: "我是誰？我能眼睜睜看著無辜者受罪，假裝聽不見他的痛苦嗎？",
    character: "Jean Valjean (尚萬強)",
    context: "經典獨白曲《Who Am I》，展現道德抉擇的高峰",
    song: "Who Am I?",
    vocab: [
      { word: "condemn", pos: "v.", def: "宣告…有罪；判處" },
      { word: "slavery", pos: "n.", def: "奴役；苦役" },
      { word: "agony", pos: "n.", def: "極度痛苦" }
    ],
    grammarNote: "Rhetorical questions highlighting inner moral conflict."
  },
  {
    id: 'q5',
    quoteEn: "I dreamed that love would never die... I dreamed that God would be forgiving.",
    quoteZh: "我曾夢想愛情永不凋零…我曾夢想上帝滿懷寬恕。",
    character: "Fantine (芳婷)",
    context: "芳婷悲歌《I Dreamed a Dream》，訴說對美好的嚮往",
    song: "I Dreamed a Dream",
    vocab: [
      { word: "forgiving", pos: "adj.", def: "寬容的；慈悲的" },
      { word: "dreamed", pos: "v.past", def: "夢想；憧憬" }
    ],
    grammarNote: "Subordinate clause with past conditional ('would never die')."
  },
  {
    id: 'q6',
    quoteEn: "There is nothing on earth that we share. It is either the law or the flaw!",
    quoteZh: "這世上我們無可共享之處。非法律即為瑕疵，絕無妥協！",
    character: "Inspector Javert (沙威督察)",
    context: "沙威執念對白，展現冷酷無情的律法信仰",
    song: "The Confrontation",
    vocab: [
      { word: "either...or", pos: "conj.", def: "不是…就是…" },
      { word: "flaw", pos: "n.", def: "瑕疵；罪惡" }
    ],
    grammarNote: "Correlative conjunctions 'either...or' creating stark contrast."
  }
];

interface QuizFlashcardCardProps {
  quote: ExtendedPlayQuote;
  isRevealed: boolean;
  onToggle: (id: string) => void;
}

const QuizFlashcardCard = memo<QuizFlashcardCardProps>(({
  quote: q,
  isRevealed,
  onToggle,
}) => {
  return (
    <motion.div
      layout
      variants={itemVariants}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(q.id)}
      className="cursor-pointer p-6 smoked-card smoked-card-hover rounded-sm min-h-[220px] flex flex-col justify-between group relative overflow-hidden jelly-spring shadow-lg"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-500 font-sans">
          <span className="uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{q.song || 'Classic Dialogue'}</span>
          </span>
          <span className="flex items-center gap-1 text-stone-400">
            {isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isRevealed ? '已揭曉' : '點擊翻牌'}</span>
          </span>
        </div>

        <p className="font-garamond text-stone-200 text-lg leading-relaxed italic font-medium group-hover:text-amber-100 transition-colors">
          "{q.quoteEn}"
        </p>
      </div>

      {/* Revealed Character / Answer */}
      <div className="pt-4 border-t border-stone-800/80">
        {isRevealed ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <div className="font-serif-tc font-bold text-amber-300 text-sm">
              說話角色：{q.character}
            </div>
            <div className="text-xs text-stone-400 font-serif-tc">
              {q.quoteZh}
            </div>
          </motion.div>
        ) : (
          <div className="text-xs font-sans text-stone-500 text-center py-2 bg-stone-900/60 rounded border border-dashed border-stone-800 group-hover:border-amber-500/30 transition-colors">
            ❓ 這句名言出自劇中哪一位角色？(點擊查看)
          </div>
        )}
      </div>
    </motion.div>
  );
});

QuizFlashcardCard.displayName = 'QuizFlashcardCard';

interface ScriptQuoteCardProps {
  quote: ExtendedPlayQuote;
  isBookmarked: boolean;
  isSpeaking: boolean;
  isCopied: boolean;
  onSpeak: (id: string, text: string) => void;
  onCopy: (quote: ExtendedPlayQuote) => void;
  onToggleBookmark: (id: string) => void;
}

const ScriptQuoteCard = memo<ScriptQuoteCardProps>(({
  quote: q,
  isBookmarked,
  isSpeaking,
  isCopied,
  onSpeak,
  onCopy,
  onToggleBookmark,
}) => {
  return (
    <motion.div
      layout
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.22 } }}
      whileTap={{ scale: 0.99 }}
      className="p-7 sm:p-8 smoked-card rounded-xl border border-[var(--theme-card-border)] hover:border-amber-500/50 flex flex-col justify-between space-y-6 group relative shadow-lg transition-all duration-300 h-full"
    >
      {/* Header */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-3.5">
          <span className="text-xs font-serif-tc text-amber-600 dark:text-amber-400 font-semibold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{q.song || '經典名言對白'}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {/* Speak Audio Button */}
            <MagneticWrapper strength={0.25}>
              <button
                onClick={() => onSpeak(q.id, q.quoteEn)}
                title="聆聽英文標準口音發音"
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-500 text-black animate-pulse shadow-md'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </MagneticWrapper>

            {/* Copy Button */}
            <MagneticWrapper strength={0.25}>
              <button
                onClick={() => onCopy(q)}
                title="複製名言佳句"
                className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-lg transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </MagneticWrapper>

            {/* Bookmark Button */}
            <MagneticWrapper strength={0.25}>
              <button
                onClick={() => onToggleBookmark(q.id)}
                title={isBookmarked ? '取消收藏' : '收藏此句'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 fill-amber-400" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </MagneticWrapper>
          </div>
        </div>

        {/* Main English Quote & Translation */}
        <div className="space-y-3">
          <p className="font-garamond text-[var(--theme-text-primary)] text-xl sm:text-2xl leading-relaxed italic font-medium group-hover:text-amber-700 dark:group-hover:text-amber-100 transition-colors">
            "{q.quoteEn}"
          </p>
          <p className="font-serif-tc text-[var(--theme-text-secondary)] text-sm sm:text-base leading-relaxed tracking-wide">
            「{q.quoteZh}」
          </p>
        </div>

        {/* Editorial Vocabulary Footnote List */}
        {q.vocab && q.vocab.length > 0 && (
          <div className="pt-3 border-t border-[var(--theme-card-border)] space-y-2">
            <span className="text-xs font-serif-tc font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>✦ 重點英文詞彙賞析</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              {q.vocab.map((v, i) => (
                <div key={i} className="flex items-baseline gap-1.5 py-1.5 px-3 rounded-lg bg-black/10 dark:bg-white/5 border border-stone-700/30">
                  <span className="font-bold text-[var(--theme-text-primary)]">{v.word}</span>
                  <span className="text-stone-400 text-[11px] font-mono">[{v.pos}]</span>
                  <span className="text-[var(--theme-text-secondary)] text-xs">{v.def}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Context */}
      <div className="pt-4 border-t border-[var(--theme-card-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-serif-tc text-[var(--theme-text-muted)]">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-400 font-bold">角色：</span>
          <span className="font-bold text-[var(--theme-text-primary)]">{q.character}</span>
        </div>
        <span className="text-xs text-stone-400 max-w-[260px] truncate">
          {q.context}
        </span>
      </div>
    </motion.div>
  );
});

ScriptQuoteCard.displayName = 'ScriptQuoteCard';

export const ScriptQuotesSection: React.FC = memo(() => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tcsh_les_mis_quote_bookmarks');
      return saved ? JSON.parse(saved) : ['q1', 'q3'];
    } catch {
      return ['q1', 'q3'];
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'quiz'>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechAccent, setSpeechAccent] = useState<'en-US' | 'en-GB'>('en-GB');
  const [speechRate, setSpeechRate] = useState<number>(0.88);
  const [quizCardState, setQuizCardState] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('tcsh_les_mis_quote_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {}
  }, [bookmarks]);

  const toggleBookmark = useCallback((id: string) => {
    ambientSynth.playButtonClickSFX();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSpeak = useCallback((id: string, text: string) => {
    ambientSynth.playButtonClickSFX();
    if (!('speechSynthesis' in window)) {
      alert('您的瀏覽器暫不支援語音朗讀功能');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechAccent;
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  }, [speakingId, speechAccent, speechRate]);

  const toggleQuizCard = useCallback((id: string) => {
    ambientSynth.playPageFlipSFX();
    setQuizCardState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const copyQuote = useCallback((q: ExtendedPlayQuote) => {
    ambientSynth.playButtonClickSFX();
    const textToCopy = `"${q.quoteEn}"\n${q.quoteZh}\n— ${q.character} (${SHOW_DETAILS.subhead})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const displayedQuotes = EXTENDED_QUOTES.filter((q) => {
    if (activeTab === 'bookmarks') return bookmarks.includes(q.id);
    return true;
  });

  return (
    <section id="script-quotes" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-800/80 relative overflow-hidden">
      {/* Ambient Lighting & Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#8c2d2d]/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.25em] text-[#8c2d2d] uppercase font-bold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Classic Script Quotes & English Learning</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[var(--theme-text-primary)] tracking-tight">
            劇本名言佳句與雙語學習對照
          </h2>
          <p className="font-serif-tc text-[var(--theme-text-secondary)] text-sm sm:text-base max-w-2xl mx-auto">
            體驗高二知足雙語班同學精湛英文口白的語言之美，隨時進行單字語法學習、語音朗讀練習，或珍藏您最喜愛的劇本經典對白。
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </motion.div>

        {/* Audio Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-sans">
          <span className="text-stone-600 dark:text-stone-400 font-serif-tc flex items-center gap-1">
            <span>🎧 英文朗讀口音：</span>
          </span>
          <div className="inline-flex rounded bg-stone-200/90 dark:bg-[#1a1a1c] border border-stone-300 dark:border-stone-800 p-0.5 shadow-md">
            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setSpeechAccent('en-GB');
                }}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  speechAccent === 'en-GB' ? 'bg-[#8c2d2d] text-white font-bold shadow' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                英式劇場口音 (British)
              </button>
            </MagneticWrapper>
            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setSpeechAccent('en-US');
                }}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  speechAccent === 'en-US' ? 'bg-[#8c2d2d] text-white font-bold shadow' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                美式標準口音 (American)
              </button>
            </MagneticWrapper>
          </div>

          <div className="inline-flex rounded bg-stone-200/90 dark:bg-[#1a1a1c] border border-stone-300 dark:border-stone-800 p-0.5 ml-2 shadow-md">
            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setSpeechRate(0.85);
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  speechRate === 0.85 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                清晰 0.85x
              </button>
            </MagneticWrapper>
            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setSpeechRate(1.0);
                }}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  speechRate === 1.0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                原速 1.0x
              </button>
            </MagneticWrapper>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-stone-200/90 dark:bg-[#1a1a1c] border border-stone-300 dark:border-stone-800 rounded-lg text-xs font-sans shadow-inner">
            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setActiveTab('all');
                }}
                className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#8c2d2d] text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>全部經典佳句 ({EXTENDED_QUOTES.length})</span>
              </button>
            </MagneticWrapper>

            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setActiveTab('bookmarks');
                }}
                className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'bookmarks'
                    ? 'bg-[#8c2d2d] text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>我的典藏句子 ({bookmarks.length})</span>
              </button>
            </MagneticWrapper>

            <MagneticWrapper strength={0.15}>
              <button
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  setActiveTab('quiz');
                }}
                className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-[#8c2d2d] text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>角色對白翻牌測驗 (Flashcard)</span>
              </button>
            </MagneticWrapper>
          </div>
        </div>

        {/* Cards Grid Container with Motion Stagger */}
        <AnimatePresence mode="wait">
          {activeTab === 'quiz' ? (
            /* Quiz / Flashcard Mode */
            <motion.div
              key="quiz-tab"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
            >
              {EXTENDED_QUOTES.map((q) => (
                <QuizFlashcardCard
                  key={q.id}
                  quote={q}
                  isRevealed={!!quizCardState[q.id]}
                  onToggle={toggleQuizCard}
                />
              ))}
            </motion.div>
          ) : (
            /* Normal Dual-language Cards View - Roomy 2-column layout */
            <motion.div
              key={`cards-${activeTab}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {displayedQuotes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-stone-500 font-serif-tc bg-stone-900/40 border border-dashed border-stone-800 rounded-sm">
                  您尚未收藏任何名言佳句，點擊卡片右上角的書籤圖示即可加入典藏！
                </div>
              ) : (
                displayedQuotes.map((q) => (
                  <ScriptQuoteCard
                    key={q.id}
                    quote={q}
                    isBookmarked={bookmarks.includes(q.id)}
                    isSpeaking={speakingId === q.id}
                    isCopied={copiedId === q.id}
                    onSpeak={handleSpeak}
                    onCopy={copyQuote}
                    onToggleBookmark={toggleBookmark}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

ScriptQuotesSection.displayName = 'ScriptQuotesSection';

