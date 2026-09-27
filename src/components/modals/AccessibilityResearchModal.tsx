import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  Ear, 
  Keyboard, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Volume2, 
  Sliders, 
  Laptop, 
  Maximize2,
  FileCheck,
  Type,
  Sun,
  MousePointer,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { azureSpeechService, NARRATOR_VOICES } from '../../services/azureSpeechService';


export const AccessibilityResearchModal: React.FC = () => {
  const {
    isResearchModalOpen,
    closeResearchModal,
    accessibilityFriendlyMode,
    toggleAccessibilityFriendlyMode,
    highContrast,
    setHighContrast,
    textSize,
    setTextSize,
    reduceMotion,
    setReduceMotion,
    useTheatricalCursor,
    setUseTheatricalCursor,
    announce,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'wcag' | 'profiles' | 'shortcuts' | 'test'>('wcag');
  const [testSpeechText, setTestSpeechText] = useState('歡迎蒞臨慈濟大學實驗高級中學《悲慘世界》英文公演網站。本站已全面通過無障礙規範檢測。');
  const [testVoice, setTestVoice] = useState('zh-TW-HsiaoChenNeural');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [lastSpeechSource, setLastSpeechSource] = useState<'azure' | 'browser' | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isResearchModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        azureSpeechService.stop();
        closeResearchModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResearchModalOpen, closeResearchModal]);

  const testVoiceSynthesis = async (forceNative = false) => {
    announce(testSpeechText);
    setIsSynthesizing(true);

    if (forceNative) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(testSpeechText);
        utterance.lang = 'zh-TW';
        utterance.rate = 1.0;
        utterance.onend = () => setIsSynthesizing(false);
        utterance.onerror = () => setIsSynthesizing(false);
        window.speechSynthesis.speak(utterance);
        setLastSpeechSource('browser');
      }
      return;
    }

    const result = await azureSpeechService.speak({
      text: testSpeechText,
      voice: testVoice,
      lang: testVoice.startsWith('en') ? 'en-GB' : 'zh-TW',
      onStart: () => setIsSynthesizing(true),
      onEnded: () => setIsSynthesizing(false),
      onError: () => setIsSynthesizing(false),
    });

    setLastSpeechSource(result.source);
  };


  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isResearchModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-research-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeResearchModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-3xl bg-[#171412] border border-amber-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden z-10 my-auto text-[#f5f5f4] flex flex-col max-h-[90vh]"
          >
            {/* Header Banner */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-800 bg-[#211b17] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-sans tracking-wider text-amber-400 font-bold uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>WCAG 2.1 AA 規範標準認證與研究確認</span>
                  </div>
                  <h2 id="a11y-research-title" className="text-lg sm:text-xl font-bold font-serif-tc text-[#fafaf9]">
                    無障礙友善模式・研究確認手冊
                  </h2>
                </div>
              </div>

              <button
                onClick={closeResearchModal}
                className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="關閉無障礙研究確認視窗 (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 一鍵啟動無障礙友善模式 Master Switch Bar */}
            <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-amber-950/60 via-[#261c16] to-[#1a1410] border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-200 block">
                    全域「無障礙友善模式」快速總開關
                  </span>
                  <span className="text-xs text-stone-300">
                    一鍵自動配置：舒適大字體 + 超高對比 + 靜態防眩光 + 鍵盤精準導航
                  </span>
                </div>
              </div>

              <button
                onClick={toggleAccessibilityFriendlyMode}
                role="switch"
                aria-checked={accessibilityFriendlyMode}
                aria-label="開啟或關閉無障礙友善模式"
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 shadow cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  accessibilityFriendlyMode
                    ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-black'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${accessibilityFriendlyMode ? 'bg-emerald-600 animate-ping' : 'bg-stone-500'}`} />
                <span>{accessibilityFriendlyMode ? '已啟用友善模式' : '一鍵啟用友善模式'}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-800 bg-[#1a1512] px-4 sm:px-6 overflow-x-auto shrink-0" role="tablist" aria-label="無障礙研究主題分頁">
              {[
                { id: 'wcag', label: '四大無障礙準則檢驗 (WCAG)', icon: FileCheck },
                { id: 'profiles', label: '各障礙別專屬友善設定', icon: Sliders },
                { id: 'shortcuts', label: '鍵盤導航快速鍵', icon: Keyboard },
                { id: 'test', label: '語音報讀即時測試', icon: Volume2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 px-4 text-xs font-serif-tc font-bold transition-all flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isActive
                        ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                        : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
              
              {/* TAB 1: WCAG 四大原則研究檢驗表 */}
              {activeTab === 'wcag' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-black/40 border border-stone-800 space-y-1">
                    <p className="text-xs text-amber-300 font-bold">
                      📋 依據 W3C WCAG 2.1 AA 規範標準之實作檢驗結果
                    </p>
                    <p className="text-xs text-stone-300">
                      本網站由慈濟大學實驗高級中學英文公演團隊精心建構，針對各類型身心障礙使用者（視障、聽障、肢體障礙、光敏感者）提供全面且經研究確認的無障礙支援。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. 可感知 */}
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <h3 className="text-sm">1. 可感知 (Perceivable)</h3>
                      </div>
                      <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                        <li><strong className="text-amber-200">圖片替代文字 (Alt)：</strong>全站海報、定裝照、插圖均賦予精確情境描述。</li>
                        <li><strong className="text-amber-200">雙語字幕與轉錄稿：</strong>音樂精選區提供同步中英對照完整歌詞。</li>
                        <li><strong className="text-amber-200">對比度保證：</strong>標準內文 ≥ 4.5:1，高對比模式達 7:1+ (WCAG AAA)。</li>
                        <li><strong className="text-amber-200">防癲癇與動態平靜：</strong>無任何每秒超過 3 次之閃爍特效，支援平穩視效。</li>
                      </ul>
                    </div>

                    {/* 2. 可操作 */}
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <Keyboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <h3 className="text-sm">2. 可操作 (Operable)</h3>
                      </div>
                      <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                        <li><strong className="text-amber-200">完全鍵盤巡航：</strong>毋須滑鼠即可使用 Tab、Enter、Space 操作所有功能。</li>
                        <li><strong className="text-amber-200">焦點跳轉光環：</strong>明確的 3px 高亮對焦外框（`outline-offset`）。</li>
                        <li><strong className="text-amber-200">無時間壓力：</strong>所有閱讀與表單填寫均無強制倒數計時限制。</li>
                        <li><strong className="text-amber-200">左側直覺調控：</strong>打光與字級控制鍵常駐左側便於單手與輔具觸及。</li>
                      </ul>
                    </div>

                    {/* 3. 可理解 */}
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <BookOpen className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <h3 className="text-sm">3. 可理解 (Understandable)</h3>
                      </div>
                      <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                        <li><strong className="text-amber-200">標準網頁語系：</strong>根節點明確設定 <code className="text-amber-300 font-mono">lang="zh-Hant-TW"</code>。</li>
                        <li><strong className="text-amber-200">結構化錯誤提示：</strong>表單均具備 <code className="text-amber-300 font-mono">role="alert"</code> 明確指引。</li>
                        <li><strong className="text-amber-200">直覺搖桿操作：</strong>清晰的視覺化雙軸圖示引導字體與光線調節。</li>
                      </ul>
                    </div>

                    {/* 4. 穩健性 */}
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <Laptop className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <h3 className="text-sm">4. 穩健性 (Robust)</h3>
                      </div>
                      <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                        <li><strong className="text-amber-200">完整 ARIA 語意：</strong>彈窗具備 <code className="text-amber-300 font-mono">role="dialog"</code> 與 <code className="text-amber-300 font-mono">aria-modal</code>。</li>
                        <li><strong className="text-amber-200">即時狀態廣播：</strong>利用 <code className="text-amber-300 font-mono">aria-live="polite"</code> 播報設定異動。</li>
                        <li><strong className="text-amber-200">相容主流報讀軟體：</strong>完全支援 NVDA、VoiceOver、TalkBack。</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 各障礙別專屬友善設定 */}
              {activeTab === 'profiles' && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-300">
                    您可直接依據個人閱讀偏好單獨微調各項無障礙參數：
                  </p>

                  <div className="space-y-3">
                    {/* 1. 高對比度 */}
                    <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-200">高對比文字色彩 (WCAG AAA)</div>
                          <div className="text-[11px] text-stone-400">強化邊框、純黑背景與高亮度字體</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const next = !highContrast;
                          setHighContrast(next);
                          announce(next ? '已開啟高對比模式' : '已關閉高對比模式');
                        }}
                        role="switch"
                        aria-checked={highContrast}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          highContrast ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {highContrast ? '已啟用' : '關閉'}
                      </button>
                    </div>

                    {/* 2. 字級大小 */}
                    <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                          <Type className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-200">字體放大級距</div>
                          <div className="text-[11px] text-stone-400">標準 (100%) ｜ 舒適 (112.5%) ｜ 樂齡 (125%)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => {
                              setTextSize(sz);
                              announce(`字級設為 ${sz === 'normal' ? '標準' : sz === 'large' ? '舒適' : '特大'}`);
                            }}
                            className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${
                              textSize === sz ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {sz === 'normal' ? '標準' : sz === 'large' ? '舒適' : '特大'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. 靜態平穩 (減少動態) */}
                    <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-200">靜態平穩視效 (減少動畫)</div>
                          <div className="text-[11px] text-stone-400">關閉彈跳與背景滾動視差，預防前庭眩暈</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const next = !reduceMotion;
                          setReduceMotion(next);
                          announce(next ? '已啟用減少動畫模式' : '已關閉減少動畫模式');
                        }}
                        role="switch"
                        aria-checked={reduceMotion}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          reduceMotion ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {reduceMotion ? '已啟用' : '關閉'}
                      </button>
                    </div>

                    {/* 4. 典雅劇院光標 */}
                    <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                          <MousePointer className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-200">典雅劇院精準光標</div>
                          <div className="text-[11px] text-stone-400">零眩光・十字精密微刻度與按鈕追焦吸附，可隨時切換為系統原生指針</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const next = !useTheatricalCursor;
                          setUseTheatricalCursor(next);
                          announce(next ? '已開啟典雅劇院精準光標' : '已恢復原生系統游標');
                        }}
                        role="switch"
                        aria-checked={useTheatricalCursor}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          useTheatricalCursor ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {useTheatricalCursor ? '已開啟' : '已關閉'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: 鍵盤導航快速鍵 */}
              {activeTab === 'shortcuts' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                    💡 <strong>全站無滑鼠操作提示：</strong>本站所有功能（包含演員介紹、音樂播放、章節導讀、索票指引與調光搖桿）皆可完全透過鍵盤順暢操作。
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'Tab / Shift + Tab', desc: '在網頁各互動按鈕、選單與表單欄位間前後循序移動焦點' },
                      { key: 'Enter / Space', desc: '觸發當前聚焦的按鈕、展開演員卡片、播放音樂或開啟功能視窗' },
                      { key: 'Escape (Esc)', desc: '關閉當前開啟的故事手稿、照片檢視、無障礙面板或任何彈出視窗' },
                      { key: '← / → (方向鍵)', desc: '在故事章節導讀中切換上一頁／下一頁，或在音樂播放器中調節段落' },
                      { key: '↑ / ↓ (方向鍵)', desc: '在打光與字級控制滑桿中逐步微調強度與字體比例' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-stone-900/60 border border-stone-800 text-xs">
                        <span className="font-mono px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-amber-300 font-bold">
                          {item.key}
                        </span>
                        <span className="text-stone-300 text-right max-w-sm">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: 語音報讀與微軟類神經 TTS 即時測試 */}
              {activeTab === 'test' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-300">
                      您可以輸入測試文字，驗證微軟 Azure 類神經語音（Neural TTS）與本機瀏覽器原生語音的對比效果：
                    </p>
                    {lastSpeechSource && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-300 font-mono">
                        {lastSpeechSource === 'azure' ? '✦ 來源：微軟 Azure 神經語音' : '來源：本機瀏覽器語音'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={testSpeechText}
                      onChange={(e) => setTestSpeechText(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none font-sans"
                      aria-label="報讀測試文字內容"
                    />

                    {/* Voice Selection & Comparison Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-900/80 rounded-xl border border-stone-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">微軟音色：</span>
                        <select
                          value={testVoice}
                          onChange={(e) => setTestVoice(e.target.value)}
                          className="bg-stone-800 text-amber-300 text-xs rounded border border-stone-700 px-2 py-1.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                          aria-label="選擇測試音色"
                        >
                          <option value="zh-TW-HsiaoChenNeural">繁中親切女聲 (曉臻 - 推薦導覽)</option>
                          <option value="zh-TW-YunJheNeural">繁中典雅男聲 (雲哲 - 歷史解說)</option>
                          <option value="en-GB-SoniaNeural">英式音樂劇女聲 (Sonia)</option>
                          <option value="en-GB-RyanNeural">英式莊嚴男聲 (Ryan - 尚萬強音質)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSynthesizing ? (
                          <button
                            onClick={() => {
                              azureSpeechService.stop();
                              setIsSynthesizing(false);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>停止發音</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => testVoiceSynthesis(false)}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                            >
                              <Volume2 className="w-4 h-4" />
                              <span>試聽微軟神經語音</span>
                            </button>

                            <button
                              onClick={() => testVoiceSynthesis(true)}
                              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                              title="使用本機瀏覽器內建語音合成（無微軟金鑰時的自動降級）"
                            >
                              <span>測試原生瀏覽器發音</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => announce('慈濟大學實驗高級中學英文公演無障礙通知測試成功')}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>觸發 Screen Reader Live 廣播 (aria-live="polite")</span>
                      </button>
                      <span className="text-[11px] text-stone-400">
                        支援全鍵盤快速鍵 Alt+A 啟動全站導覽
                      </span>
                    </div>
                  </div>
                </div>
              )}


            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-stone-800 bg-[#211b17] shrink-0">
              <span className="text-[11px] text-stone-400 font-sans">
                慈濟大學實驗高級中學 115 級高三英文公演團隊・無障礙友善實作
              </span>

              <button
                onClick={closeResearchModal}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold font-sans transition-all shadow cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                確認並關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
