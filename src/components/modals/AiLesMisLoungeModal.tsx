import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  Bot,
  User,
  Send,
  X,
  Compass,
  HeartHandshake,
  PenTool,
  Loader2,
  RefreshCw,
  Quote,
  Music,
  ChevronRight,
  BookOpen,
  Award,
  Share2,
  Check,
  HelpCircle
} from 'lucide-react';
import { ambientSynth } from '../../utils/audioSynth';

interface AiLesMisLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacterId?: string;
}

// Iconic Characters Configuration
const CHARACTERS = [
  {
    id: 'valjean',
    name: '尚萬強 (Jean Valjean)',
    role: '救贖與恩慈的靈魂',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    quote: 'To love another person is to see the face of God.',
    promptSuggestion: '尚萬強先生，您在救起馬里歐的那一夜，心裡思考著什麼？'
  },
  {
    id: 'javert',
    name: '沙威 (Javert)',
    role: '嚴法與正義的執法者',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    quote: 'There is nothing on earth that we cannot forgive, except an act of betraying the law.',
    promptSuggestion: '沙威警官，當尚萬強選擇放走你時，你的世界觀發生了什麼震盪？'
  },
  {
    id: 'fantine',
    name: '芳婷 (Fantine)',
    role: '偉大而悲劇的母愛',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    quote: 'I dreamed a dream in time gone by...',
    promptSuggestion: '芳婷，在黑暗困頓的歲月裡，是什麼支持著你對柯賽特的希望？'
  },
  {
    id: 'marius',
    name: '馬里歐 (Marius Pontmercy)',
    role: '熱血革命與熾熱愛情的青年',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
    quote: 'A heart full of love, a heart full of song...',
    promptSuggestion: '馬里歐，面對街壘上的生死革命與對柯賽特的愛，你如何選擇？'
  },
  {
    id: 'eponine',
    name: '艾波妮 (Éponine)',
    role: '孤獨而深情的奉獻',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    quote: 'And I know it\'s only in my mind, that I\'m talking to myself and not to him...',
    promptSuggestion: '艾波妮，唱出《On My Own》那一刻，你心中最真實的情感是什麼？'
  },
  {
    id: 'cosette',
    name: '柯賽特 (Cosette)',
    role: '純真與光明未來',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop',
    quote: 'There is a castle on a cloud, I like to go there in my sleep...',
    promptSuggestion: '柯賽特，當你得知父親尚萬強的真實身世與付出，你最想對他說什麼？'
  },
  {
    id: 'enjolras',
    name: '恩佐拉 (Enjolras)',
    role: '革命之火領袖',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop',
    quote: 'Do you hear the people sing? Singing the song of angry men!',
    promptSuggestion: '恩佐拉，六月起義的信念核心是什麼？你如何看待理想與代價？'
  },
  {
    id: 'thenardier',
    name: '德納第 (Thénardier)',
    role: '市井梟雄與荒謬黑幽默',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    quote: 'Welcome, Sir, to the Master of the House!',
    promptSuggestion: '德納第先生，在混亂動盪的世界裡，你的生存之道是什麼？'
  }
];

// Presets for Drama Analysis
const DRAMA_PRESETS = [
  '請解析《悲慘世界》中「尚萬強」與「沙威」兩種正義觀點的對比與哲學衝突。',
  '為什麼音樂劇中《Look Down》與《Do You Hear The People Sing》能引起如此廣泛的共鳴？',
  '請說明 1832 年巴黎六月起義（June Rebellion）的歷史背景與雨果的文學關懷。',
  '剖析《On My Own》與《A Heart Full of Love》在音樂主題上的對比與意境美感。',
  '慈大附中高三學生以全英文公演《悲慘世界》，主要看點與舞台語言突破有哪些？'
];

// Presets for Mood Matcher
const MOOD_CATEGORIES = [
  { id: 'redemption', name: '尋求救贖／迷茫沉思', desc: '面對過往錯誤，尋找內心平靜', icon: Compass },
  { id: 'justice', name: '堅守原則／渴望正義', desc: '在現實與道德規則間奮鬥', icon: Award },
  { id: 'lonely', name: '孤獨單戀／默默付出', desc: '無聲的思念，深沉而珍貴', icon: HeartHandshake },
  { id: 'passion', name: '熱血理想／勇於追夢', desc: '為了心中的光芒而無畏前行', icon: Sparkles }
];

export const AiLesMisLoungeModal: React.FC<AiLesMisLoungeModalProps> = ({
  isOpen,
  onClose,
  initialCharacterId
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'guide' | 'mood' | 'review'>('chat');
  
  // Character Chat state
  const [selectedCharId, setSelectedCharId] = useState<string>(initialCharacterId || 'valjean');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; time: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Guide state
  const [guideQuery, setGuideQuery] = useState('');
  const [guideResponse, setGuideResponse] = useState<string | null>(null);
  const [isGuideLoading, setIsGuideLoading] = useState(false);

  // Mood Matcher state
  const [selectedMoodCat, setSelectedMoodCat] = useState('redemption');
  const [customMoodInput, setCustomMoodInput] = useState('');
  const [moodResult, setMoodResult] = useState<any>(null);
  const [isMoodLoading, setIsMoodLoading] = useState(false);

  // Review Generator state
  const [userNotes, setUserNotes] = useState('');
  const [favChar, setFavChar] = useState('Jean Valjean');
  const [rating, setRating] = useState(5);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const selectedChar = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];

  useEffect(() => {
    if (initialCharacterId) {
      setSelectedCharId(initialCharacterId);
    }
  }, [initialCharacterId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  // Send message to character
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || inputMessage.trim();
    if (!textToSend || isChatLoading) return;

    ambientSynth.playButtonClickSFX();

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInputMessage('');
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          characterId: selectedChar.id,
          characterName: selectedChar.name,
          history: historyPayload
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(data.error || '無法取得回應');
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `【系統提示】AI 連線發生微小波動：${err.message || '請確認網路後重試'}。`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Drama Guide Query
  const handleGuideSubmit = async (queryText?: string) => {
    const q = queryText || guideQuery.trim();
    if (!q || isGuideLoading) return;

    ambientSynth.playButtonClickSFX();
    setGuideQuery(q);
    setIsGuideLoading(true);
    setGuideResponse(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setGuideResponse(data.reply);
      } else {
        throw new Error(data.error || '導覽解析失敗');
      }
    } catch (err: any) {
      setGuideResponse(`解析連線異常：${err.message}`);
    } finally {
      setIsGuideLoading(false);
    }
  };

  // Mood Matcher Submit
  const handleMoodSubmit = async () => {
    if (isMoodLoading) return;
    ambientSynth.playButtonClickSFX();
    setIsMoodLoading(true);

    try {
      const catObj = MOOD_CATEGORIES.find((m) => m.id === selectedMoodCat);
      const res = await fetch('/api/ai/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodCategory: catObj?.name,
          moodText: customMoodInput || catObj?.desc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMoodResult(data);
      } else {
        throw new Error(data.error || '心境解析失敗');
      }
    } catch (err: any) {
      alert(`分析失敗：${err.message}`);
    } finally {
      setIsMoodLoading(false);
    }
  };

  // Review Generator Submit
  const handleReviewSubmit = async () => {
    if (isReviewLoading) return;
    ambientSynth.playButtonClickSFX();
    setIsReviewLoading(true);

    try {
      const res = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userNotes,
          favoriteCharacter: favChar,
          rating
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewResult(data);
      } else {
        throw new Error(data.error || '生成劇評失敗');
      }
    } catch (err: any) {
      alert(`生成失敗：${err.message}`);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (reviewResult?.socialCaption) {
      navigator.clipboard.writeText(reviewResult.socialCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-5xl bg-[#111114] border border-amber-500/30 rounded-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1c1414] via-[#2a1313] to-[#141822] p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#8c2d2d]/30 border border-[#8c2d2d] rounded-lg text-amber-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif-tc text-stone-100 flex items-center gap-2">
                  <span>悲慘世界 AI 觀劇導覽與靈魂角色館</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono uppercase tracking-wider">
                    Gemini 3.6
                  </span>
                </h2>
                <p className="text-xs text-stone-400 font-sans">
                  2026 慈大附中英文公演專屬智能對話、心境共鳴與靈魂創作助助手
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white bg-stone-900/60 hover:bg-stone-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-[#161619] border-b border-stone-800 px-4 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('chat');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-serif-tc border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'border-amber-400 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>角色對話靈魂問答</span>
            </button>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('guide');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-serif-tc border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'border-amber-400 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>觀劇主題與哲學導覽</span>
            </button>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('mood');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-serif-tc border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'mood'
                  ? 'border-amber-400 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>心境共鳴與曲目配對</span>
            </button>

            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setActiveTab('review');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-serif-tc border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'review'
                  ? 'border-amber-400 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>觀劇心得與精選社群文案</span>
            </button>
          </div>

          {/* Modal Content Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0d0d0f]">
            {/* TAB 1: Character Roleplay Chat */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[480px]">
                {/* Character Selector Sidebar */}
                <div className="md:col-span-1 bg-[#141417] border border-stone-800 rounded-lg p-3 space-y-2 overflow-y-auto max-h-[220px] md:max-h-none">
                  <span className="text-[11px] font-sans text-amber-400 uppercase tracking-wider block font-bold px-1">
                    選擇對話角色 (Character)：
                  </span>
                  <div className="space-y-1.5">
                    {CHARACTERS.map((char) => {
                      const isSelected = char.id === selectedChar.id;
                      return (
                        <button
                          key={char.id}
                          onClick={() => {
                            ambientSynth.playButtonClickSFX();
                            setSelectedCharId(char.id);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded text-left transition-all border ${
                            isSelected
                              ? 'bg-[#8c2d2d] border-amber-400 text-white font-bold shadow-md'
                              : 'bg-stone-900/60 border-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white'
                          }`}
                        >
                          <img
                            src={char.avatar}
                            alt={char.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-600"
                          />
                          <div className="truncate min-w-0">
                            <div className="text-xs font-serif-tc truncate">{char.name}</div>
                            <div className="text-[10px] text-stone-400 truncate opacity-80">{char.role}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Chat Interface */}
                <div className="md:col-span-3 bg-[#141417] border border-stone-800 rounded-lg flex flex-col h-[480px]">
                  {/* Selected Character Header */}
                  <div className="p-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedChar.avatar}
                        alt={selectedChar.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/60"
                      />
                      <div>
                        <h3 className="text-sm font-serif-tc font-bold text-amber-200">
                          {selectedChar.name}
                        </h3>
                        <p className="text-[11px] text-stone-400 italic font-serif">
                          "{selectedChar.quote}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Window */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                        <Bot className="w-10 h-10 text-amber-400/60 animate-bounce" />
                        <div>
                          <p className="font-serif-tc text-stone-200 font-bold text-base">
                            開始與【{selectedChar.name}】進行跨越時空的問答
                          </p>
                          <p className="text-xs text-stone-400 mt-1 max-w-md">
                            您可詢問角色關於劇中命運、道德抉擇、心路歷程或對愛與信仰的看法。
                          </p>
                        </div>

                        {/* Preset Suggestion */}
                        <button
                          onClick={() => handleSendChatMessage(selectedChar.promptSuggestion)}
                          className="mt-2 text-xs bg-stone-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-amber-500/10"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>嘗試問一問：「{selectedChar.promptSuggestion}」</span>
                        </button>
                      </div>
                    )}

                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'ai' && (
                          <img
                            src={selectedChar.avatar}
                            alt={selectedChar.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-amber-400/50"
                          />
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-xs sm:text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#8c2d2d] text-white rounded-tr-none'
                              : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-none font-serif-tc'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span className="text-[9px] text-stone-400 block text-right mt-1 opacity-60">
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex items-center gap-2 text-amber-400 text-xs italic p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{selectedChar.name} 正在深刻思索並準備回答...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="p-3 bg-stone-900/90 border-t border-stone-800 flex gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`輸入對【${selectedChar.name}】的提問或心得...`}
                      className="flex-1 bg-black/60 border border-stone-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !inputMessage.trim()}
                      className="bg-[#8c2d2d] hover:bg-[#a33535] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>發送</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: Drama Guide & Philosophy */}
            {activeTab === 'guide' && (
              <div className="space-y-5">
                <div className="bg-[#141417] p-4 border border-stone-800 rounded-lg space-y-3">
                  <h3 className="text-sm font-serif-tc font-bold text-amber-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>經典觀劇提問 (點擊直接解析)：</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DRAMA_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGuideSubmit(p)}
                        className="text-xs bg-stone-900 border border-stone-800 hover:border-amber-400/60 hover:text-amber-200 text-stone-300 px-3 py-2 rounded-lg text-left transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Search */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guideQuery}
                    onChange={(e) => setGuideQuery(e.target.value)}
                    placeholder="例如：請解析悲慘世界中的『贖罪』與『慈悲』主題..."
                    className="flex-1 bg-stone-900 border border-stone-700 focus:border-amber-400 rounded-lg px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 outline-none"
                  />
                  <button
                    onClick={() => handleGuideSubmit()}
                    disabled={isGuideLoading || !guideQuery.trim()}
                    className="bg-[#8c2d2d] hover:bg-[#a33535] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                    {isGuideLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>AI 深度導覽</span>
                  </button>
                </div>

                {/* Response Display */}
                {guideResponse && (
                  <div className="bg-[#141417] border border-amber-500/30 rounded-lg p-5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-serif-tc font-bold text-base border-b border-stone-800 pb-2">
                      <Sparkles className="w-5 h-5" />
                      <span>【Gemini 觀劇深度剖析】</span>
                    </div>
                    <div className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap font-serif-tc">
                      {guideResponse}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Mood Matcher */}
            {activeTab === 'mood' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MOOD_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedMoodCat === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          ambientSynth.playButtonClickSFX();
                          setSelectedMoodCat(cat.id);
                        }}
                        className={`p-4 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#8c2d2d]/30 border-amber-400 text-amber-200 shadow-lg'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-serif-tc font-bold text-sm">{cat.name}</span>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-stone-500'}`} />
                        </div>
                        <p className="text-xs text-stone-400">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-serif-tc text-stone-300 block">
                    補充說明您此刻的心境或近期經歷（可選）：
                  </label>
                  <textarea
                    rows={2}
                    value={customMoodInput}
                    onChange={(e) => setCustomMoodInput(e.target.value)}
                    placeholder="例如：最近在準備大型英文發表，既期待又有點焦慮，渴望找到信念與力量..."
                    className="w-full bg-stone-900 border border-stone-700 focus:border-amber-400 rounded-lg p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleMoodSubmit}
                  disabled={isMoodLoading}
                  className="w-full bg-[#8c2d2d] hover:bg-[#a33535] disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  {isMoodLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  <span>產生心境角色共鳴與靈魂歌曲配對</span>
                </button>

                {moodResult && (
                  <div className="bg-gradient-to-br from-[#1a1414] to-[#12141c] border border-amber-500/40 rounded-lg p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-800 pb-3 gap-2">
                      <div>
                        <span className="text-xs font-sans text-amber-400 uppercase tracking-widest font-bold block">
                          Your Les Mis Soul Companion
                        </span>
                        <h4 className="text-lg font-serif-tc font-bold text-stone-100">
                          共鳴角色：{moodResult.characterName} ({moodResult.characterEnglish})
                        </h4>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-serif-tc font-bold flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5" />
                        <span>推薦曲目：{moodResult.matchedSong}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-stone-200">
                      <div>
                        <span className="text-amber-400 font-bold block mb-1">【靈魂心境連結】</span>
                        <p className="leading-relaxed text-stone-300">{moodResult.empathyInsight}</p>
                      </div>

                      <div className="p-3 bg-black/50 border-l-2 border-amber-400 rounded-r-lg italic font-serif">
                        <Quote className="w-4 h-4 text-amber-400/60 inline mr-2" />
                        <span>{moodResult.bilingualQuote}</span>
                      </div>

                      <div>
                        <span className="text-amber-400 font-bold block mb-1">【來自悲慘世界的明晨祝福】</span>
                        <p className="leading-relaxed text-stone-300">{moodResult.encouragementMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Review & Social Post Assistant */}
            {activeTab === 'review' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-serif-tc text-stone-300 block">
                      觀劇感受或簡短評語筆記：
                    </label>
                    <textarea
                      rows={4}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="例如：舞台發音非常地道，特別是《Do You Hear The People Sing》的大合唱讓人熱淚盈眶..."
                      className="w-full bg-stone-900 border border-stone-700 focus:border-amber-400 rounded-lg p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none"
                    />
                  </div>

                  <div className="space-y-4 bg-[#141417] p-4 border border-stone-800 rounded-lg">
                    <div className="space-y-1.5">
                      <label className="text-xs font-serif-tc text-stone-300 block">最受感動的角色：</label>
                      <select
                        value={favChar}
                        onChange={(e) => setFavChar(e.target.value)}
                        className="w-full bg-black/60 border border-stone-700 focus:border-amber-400 rounded-lg p-2 text-xs sm:text-sm text-stone-200 outline-none"
                      >
                        {CHARACTERS.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-serif-tc text-stone-300 block">演出綜合評分：</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-lg transition-transform ${
                              star <= rating ? 'text-amber-400 scale-110' : 'text-stone-600'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={isReviewLoading}
                  className="w-full bg-[#8c2d2d] hover:bg-[#a33535] disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  {isReviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  <span>生成精美劇評與 IG/FB 打卡社群文案</span>
                </button>

                {reviewResult && (
                  <div className="bg-[#141417] border border-amber-500/40 rounded-lg p-5 space-y-4">
                    <div className="border-b border-stone-800 pb-2">
                      <h4 className="text-base font-serif-tc font-bold text-amber-300">
                        {reviewResult.title}
                      </h4>
                    </div>

                    <div className="text-sm text-stone-200 leading-relaxed font-serif-tc whitespace-pre-wrap">
                      {reviewResult.reviewBody}
                    </div>

                    <div className="bg-black/60 border border-stone-800 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-sans text-amber-400 font-bold flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>一鍵複製社群分享貼文 (Instagram / Facebook)：</span>
                        </span>
                        <button
                          onClick={handleCopyCaption}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-serif-tc flex items-center gap-1 transition-all"
                        >
                          {copiedCaption ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{copiedCaption ? '已複製！' : '複製貼文'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-stone-300 font-mono bg-stone-900 p-3 rounded border border-stone-800 select-all">
                        {reviewResult.socialCaption}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
