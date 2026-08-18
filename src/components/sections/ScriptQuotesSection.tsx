import React, { useState, useEffect } from 'react';
import { Volume2, Bookmark, BookmarkCheck, Sparkles, HelpCircle, Eye, EyeOff, BookOpen, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayQuote } from '../../types';
import { FAMOUS_QUOTES, SHOW_DETAILS } from '../../data/showData';
import { ambientSynth } from '../../utils/audioSynth';

const EXTENDED_QUOTES: (PlayQuote & {
  id: string;
  song?: string;
  vocab?: { word: string; pos: string; def: string }[];
  grammarNote?: string;
})[] = [
  {
    id: 'q1',
    quoteEn: "Even the darkest night will end and the sun will rise.",
    quoteZh: "即便是最黑暗的長夜終將結束，太陽必將升起。",
    character: "Victor Hugo / Finale Chorus",
    context: "高三英文公演主題典範，象徵青春與希望的堅持",
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
    character: "Enjolras & Students (安喬拉與革命青年)",
    context: "高三排練過程中最具震撼力的合唱經典",
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
    character: "Inspector Javert (賈維爾督察)",
    context: "賈維爾執念對白，展現冷酷無情的律法信仰",
    song: "The Confrontation",
    vocab: [
      { word: "either...or", pos: "conj.", def: "不是…就是…" },
      { word: "flaw", pos: "n.", def: "瑕疵；罪惡" }
    ],
    grammarNote: "Correlative conjunctions 'either...or' creating stark contrast."
  }
];

export const ScriptQuotesSection: React.FC = () => {
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
  const [quizCardState, setQuizCardState] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('tcsh_les_mis_quote_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {}
  }, [bookmarks]);

  const toggleBookmark = (id: string) => {
    ambientSynth.playButtonClickSFX();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSpeak = (id: string, text: string) => {
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
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const toggleQuizCard = (id: string) => {
    ambientSynth.playPageFlipSFX();
    setQuizCardState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyQuote = (q: typeof EXTENDED_QUOTES[0]) => {
    ambientSynth.playButtonClickSFX();
    const textToCopy = `"${q.quoteEn}"\n${q.quoteZh}\n— ${q.character} (${SHOW_DETAILS.subhead})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedQuotes = EXTENDED_QUOTES.filter((q) => {
    if (activeTab === 'bookmarks') return bookmarks.includes(q.id);
    return true;
  });

  return (
    <section id="script-quotes" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#161618] border-t border-stone-800/80 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#8c2d2d]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.25em] text-[#8c2d2d] uppercase font-bold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Classic Script Quotes & English Learning</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            劇本名言佳句與雙語學習對照
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            體驗高三同學精湛英文口白的語言之美，隨時進行單字語法學習、語音朗讀練習，或珍藏您最喜愛的劇本經典對白。
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-[#1a1a1c] border border-stone-800 rounded-lg text-xs font-sans shadow-inner">
            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('all');
              }}
              className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#8c2d2d] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>全部經典佳句 ({EXTENDED_QUOTES.length})</span>
            </button>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('bookmarks');
              }}
              className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 ${
                activeTab === 'bookmarks'
                  ? 'bg-[#8c2d2d] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>我的典藏句子 ({bookmarks.length})</span>
            </button>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('quiz');
              }}
              className={`px-5 py-2.5 rounded-md font-bold transition-all flex items-center gap-2 ${
                activeTab === 'quiz'
                  ? 'bg-[#8c2d2d] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>角色對白翻牌測驗 (Flashcard)</span>
            </button>
          </div>
        </div>

        {/* Cards Grid Container */}
        {activeTab === 'quiz' ? (
          /* Quiz / Flashcard Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXTENDED_QUOTES.map((q) => {
              const isRevealed = quizCardState[q.id];
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuizCard(q.id)}
                  className="cursor-pointer p-6 bg-[#1e1e21] border border-stone-800 rounded-sm hover:border-amber-500/50 transition-all min-h-[220px] flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-sans">
                      <span className="uppercase tracking-widest text-amber-400 font-bold">
                        {q.song || 'Classic Dialogue'}
                      </span>
                      <span className="flex items-center gap-1 text-stone-400">
                        {isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? '已揭曉' : '點擊翻牌'}</span>
                      </span>
                    </div>

                    <p className="font-serif-tc text-stone-200 text-base leading-relaxed italic">
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
                </div>
              );
            })}
          </div>
        ) : (
          /* Normal Dual-language Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedQuotes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-stone-500 font-serif-tc">
                您尚未收藏任何名言佳句，點擊卡片右上角的書籤圖示即可加入典藏！
              </div>
            ) : (
              displayedQuotes.map((q) => {
                const isBookmarked = bookmarks.includes(q.id);
                const isSpeaking = speakingId === q.id;

                return (
                  <div
                    key={q.id}
                    className="p-6 bg-[#1a1a1c] border border-stone-800 rounded-sm hover:border-stone-700 transition-all flex flex-col justify-between space-y-6 group relative"
                  >
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-sans text-amber-400/90 font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                          {q.song || 'Classic Quote'}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Speak Audio Button */}
                          <button
                            onClick={() => handleSpeak(q.id, q.quoteEn)}
                            title="聆聽英文標準口音發音"
                            className={`p-2 rounded-full transition-colors ${
                              isSpeaking
                                ? 'bg-amber-500 text-black animate-pulse'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => copyQuote(q)}
                            title="複製名言佳句"
                            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-full transition-colors"
                          >
                            {copiedId === q.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Bookmark Button */}
                          <button
                            onClick={() => toggleBookmark(q.id)}
                            title={isBookmarked ? '取消收藏' : '收藏此句'}
                            className={`p-2 rounded-full transition-colors ${
                              isBookmarked
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-stone-500 hover:text-stone-300'
                            }`}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4 fill-amber-400" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Main English Quote & Translation */}
                      <div className="space-y-2">
                        <p className="font-serif-tc text-stone-100 text-base leading-relaxed font-semibold">
                          "{q.quoteEn}"
                        </p>
                        <p className="font-serif-tc text-stone-400 text-sm">
                          {q.quoteZh}
                        </p>
                      </div>

                      {/* Vocabulary Breakdown if available */}
                      {q.vocab && q.vocab.length > 0 && (
                        <div className="p-3 bg-stone-900/80 rounded border border-stone-800/80 space-y-1.5">
                          <span className="text-[10px] font-sans font-bold text-amber-300 uppercase tracking-widest block">
                            KEY VOCABULARY (重點字彙)
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs font-sans">
                            {q.vocab.map((v, i) => (
                              <span key={i} className="text-stone-300">
                                <span className="font-bold text-stone-100">{v.word}</span>{' '}
                                <span className="text-stone-500 text-[10px]">{v.pos}</span>{' '}
                                <span className="text-stone-400">{v.def}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer / Context */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-serif-tc text-stone-400">
                      <span className="font-bold text-stone-300">角色：{q.character}</span>
                      <span className="text-[11px] text-stone-500 truncate max-w-[180px]">
                        {q.context}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};
