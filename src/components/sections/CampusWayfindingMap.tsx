import React, { useState, useCallback, memo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Accessibility, 
  Car, 
  Bus, 
  Footprints, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowRight,
  Compass,
  Building,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useShowGeneralConfig } from '../../context/ShowDataContext';
import { ambientSynth } from '../../utils/audioSynth';
import { MagneticWrapper } from '../ui/MagneticWrapper';

export type RouteType = 'walking' | 'accessible' | 'parking' | 'transit';

interface RouteStep {
  title: string;
  desc: string;
  duration: string;
  icon: string;
  accessibilityNote?: string;
  highlightSpotId: string;
}

interface WayfindingRoute {
  id: RouteType;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  totalTime: string;
  color: string;
  steps: RouteStep[];
  audioGuideText: string;
}

const ROUTES: WayfindingRoute[] = [
  {
    id: 'walking',
    name: '校門步行景觀動線',
    subtitle: '中央路正門 ➔ 林蔭大道 ➔ 大愛樓 3F 演藝廳',
    icon: Footprints,
    tag: '常規觀演推薦',
    totalTime: '約 3~4 分鐘',
    color: '#8c2d2d',
    steps: [
      {
        title: '1. 抵達中央路校門正門',
        desc: '由中央路三段校門口進入，兩側有公演專屬旗幟與迎賓指引牌。',
        duration: '1 分鐘',
        icon: 'gate',
        highlightSpotId: 'spot-gate',
      },
      {
        title: '2. 穿過林蔭大道迎賓走廊',
        desc: '沿著綠意步道直行約 100 公尺，迎面即為大愛樓挑高中庭。',
        duration: '1.5 分鐘',
        icon: 'walkway',
        highlightSpotId: 'spot-avenue',
      },
      {
        title: '3. 進入大愛樓 1F 迎賓大廳',
        desc: '由大愛樓正門大廳進入，右側為服務接待諮詢台與靜態展區。',
        duration: '30 秒',
        icon: 'lobby',
        highlightSpotId: 'spot-daai-1f',
      },
      {
        title: '4. 搭乘景觀階梯或電梯至 3F 演藝廳',
        desc: '可由中庭大階梯漫步直上，或搭乘中央客梯直達 3 樓驗票大廳。',
        duration: '1 分鐘',
        icon: 'hall',
        highlightSpotId: 'spot-auditorium-3f',
      },
    ],
    audioGuideText:
      '歡迎蒞臨慈大附中英文公演！您目前選擇的是校門步行景觀動線。從中央路正門進入後，請沿著林蔭步道直行約一百公尺抵達大愛樓，接著由一樓迎賓大廳搭乘中央客梯或景觀階梯直上三樓演藝廳驗票入場。全程約三至四分鐘。',
  },
  {
    id: 'accessible',
    name: '無障礙・長者平整無階梯動線',
    subtitle: '無階梯坡道 ➔ 1F 無障礙直達電梯 ➔ 3F 輪椅專席',
    icon: Accessibility,
    tag: '長輩／輪椅／推車優先',
    totalTime: '約 2~3 分鐘 (全平緩路段)',
    color: '#d97706',
    steps: [
      {
        title: '1. 無障礙專用停車位 / 接駁停靠區',
        desc: '大愛樓旁設有無障礙專用汽車位與斜坡引導道，下車即有無階梯步道。',
        duration: '30 秒',
        icon: 'parking',
        accessibilityNote: '輪椅下車處路面完全平整，防滑鋪面',
        highlightSpotId: 'spot-accessible-parking',
      },
      {
        title: '2. 大愛樓無障礙平緩斜坡道',
        desc: '沿 1:12 國際標準緩坡道平順進入大愛樓側門，避免任何台階。',
        duration: '1 分鐘',
        icon: 'ramp',
        accessibilityNote: '坡度平緩，設有雙層防滑扶手',
        highlightSpotId: 'spot-daai-ramp',
      },
      {
        title: '3. 搭乘 1F 無障礙語音專用電梯',
        desc: '直達電梯內設有点字面板、低位操作按鈕與語音樓層提示，直上 3 樓。',
        duration: '1 分鐘',
        icon: 'elevator',
        accessibilityNote: '電梯門寬度大於 90cm，可容納大型輪椅與推車',
        highlightSpotId: 'spot-elevator',
      },
      {
        title: '4. 3F 輪椅專屬通道與前台接待席',
        desc: '出電梯即有志工同學專人導引，直通演藝廳兩側平坦專屬輪椅席位。',
        duration: '30 秒',
        icon: 'seat',
        accessibilityNote: '輪椅席位視野開闊，無任何高低落差',
        highlightSpotId: 'spot-auditorium-3f',
      },
    ],
    audioGuideText:
      '您好，這是為長者、行動不便朋友及推嬰兒車家長特別設計的無障礙全平緩動線。在大愛樓旁設有無障礙專用停車位與坡道，請順著平緩斜坡進入側門，搭乘設有點字與語音提示的直達電梯直上三樓。出電梯後現場志工將引導您進入輪椅專用席位。若需輪椅借用或專人協助，請洽前台志工。',
  },
  {
    id: 'parking',
    name: '自駕來賓停車與地下直通動線',
    subtitle: '中央路車道 ➔ 來賓地下/平面停車場 ➔ 室內電梯直達',
    icon: Car,
    tag: '自行開車家長推薦',
    totalTime: '約 3 分鐘 (室內免日曬雨淋)',
    color: '#0284c7',
    steps: [
      {
        title: '1. 駕車抵達中央路校門警衛室',
        desc: '依警衛人員指揮，右轉進入來賓車道（演出日免收停車費）。',
        duration: '1 分鐘',
        icon: 'gate',
        highlightSpotId: 'spot-gate',
      },
      {
        title: '2. 停放於大愛樓地下停車場 (B1) 或平面車位',
        desc: '地下停車場車位充足，並設有顯眼劇場引導標誌。',
        duration: '1 分鐘',
        icon: 'parking',
        highlightSpotId: 'spot-parking',
      },
      {
        title: '3. 搭乘 B1 停車場直達電梯直上 3F',
        desc: '由地下室電梯廳直接搭乘電梯直升 3 樓演藝廳，全程室內不受天候影響。',
        duration: '1 分鐘',
        icon: 'elevator',
        highlightSpotId: 'spot-auditorium-3f',
      },
    ],
    audioGuideText:
      '自駕前來的來賓與家長您好！請由中央路校門警衛室進入來賓專屬車道，將車輛停放在大愛樓地下停車場或平面停車區。停妥後可直接走入地下電梯廳，搭乘電梯直達三樓演藝廳大廳，全程室內防雨防曬。',
  },
  {
    id: 'transit',
    name: '大眾運輸・公車站直達動線',
    subtitle: '花蓮火車站 ➔ 市區公車 ➔ 慈濟大學站 ➔ 步行抵達',
    icon: Bus,
    tag: '外縣市校友／學生推薦',
    totalTime: '公車 12 分鐘 + 步行 2 分鐘',
    color: '#059669',
    steps: [
      {
        title: '1. 花蓮火車站搭乘公車',
        desc: '於花蓮火車站前站搭乘統聯/花蓮客運 1121、1122 或市區公車至「慈濟大學中央校區」站。',
        duration: '10~15 分鐘',
        icon: 'bus',
        highlightSpotId: 'spot-bus-stop',
      },
      {
        title: '2. 慈濟大學站下車',
        desc: '公車站牌正位於學校大門旁，下車步行 30 公尺即抵校門。',
        duration: '1 分鐘',
        icon: 'stop',
        highlightSpotId: 'spot-bus-stop',
      },
      {
        title: '3. 沿迎賓步道直抵大愛樓 3F 演藝廳',
        desc: '步入校園後依指標前進，搭乘電梯至 3F 演藝廳驗票入場。',
        duration: '3 分鐘',
        icon: 'hall',
        highlightSpotId: 'spot-auditorium-3f',
      },
    ],
    audioGuideText:
      '搭乘大眾運輸前來的觀眾您好！從花蓮火車站出發，可搭乘市區公車直達慈濟大學中央校區站。下車後步行約三十公尺即可由大門進入校園，順著迎賓大道步行進入大愛樓搭乘電梯直達三樓演藝廳。',
  },
];

export const CampusWayfindingMap: React.FC = memo(() => {
  const config = useShowGeneralConfig();
  const [activeRouteId, setActiveRouteId] = useState<RouteType>('walking');
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'map' | 'floorplan'>('map');

  const currentRoute = ROUTES.find((r) => r.id === activeRouteId) || ROUTES[0];

  const handleSelectRoute = useCallback((id: RouteType) => {
    ambientSynth.playButtonClickSFX();
    setActiveRouteId(id);
    setSelectedStepIdx(0);
    // Stop any speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  }, []);

  const handleStepClick = useCallback((idx: number) => {
    ambientSynth.playButtonClickSFX();
    setSelectedStepIdx(idx);
  }, []);

  const toggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentRoute.audioGuideText);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.95; // Gentle and clear for seniors

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    ambientSynth.playButtonClickSFX();
  }, [currentRoute.audioGuideText, isPlayingAudio]);

  const openGoogleMaps = useCallback(() => {
    ambientSynth.playButtonClickSFX();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.venueAddress + ' ' + config.venueName)}`,
      '_blank'
    );
  }, [config.venueAddress, config.venueName]);

  return (
    <div className="space-y-8">
      {/* Top Header Card with Mode Toggle & Voice Button */}
      <div className="p-6 sm:p-8 bg-[#18181b] border border-stone-800 rounded-sm shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-sans font-bold text-amber-400 uppercase tracking-widest">
              <Compass className="w-4 h-4 text-[#8c2d2d]" />
              <span>Campus & Auditorium Wayfinding System</span>
            </div>
            <h3 className="font-serif-tc text-2xl sm:text-3xl font-bold text-stone-100 mt-1">
              校園實境動線與演藝廳導引
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 font-sans mt-1">
              專為家長、長輩、校友打造的全方位無階梯友善引導・隨選路徑與語音指引
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Audio Voice Guide Button */}
            <button
              onClick={toggleSpeech}
              className={`px-3.5 py-2 rounded-sm text-xs font-serif-tc font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg animate-pulse'
                  : 'bg-stone-900 text-amber-300 border-amber-500/30 hover:border-amber-400 hover:bg-stone-800'
              }`}
              title="長輩與視障語音動線朗讀"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>停止語音播報</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>朗讀此路線指引</span>
                </>
              )}
            </button>

            {/* Google Map Navigation */}
            <MagneticWrapper strength={0.2}>
              <button
                onClick={openGoogleMaps}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-sm text-xs font-serif-tc border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google 地圖導航</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </button>
            </MagneticWrapper>
          </div>
        </div>

        {/* Route Selector Tabs (4 Distinct Roles / Needs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROUTES.map((route) => {
            const Icon = route.icon;
            const isSelected = route.id === activeRouteId;
            return (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                className={`p-3.5 rounded-sm border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'border-[#8c2d2d] bg-[#8c2d2d]/15 shadow-md ring-1 ring-[#8c2d2d]/50'
                    : 'border-stone-800 bg-stone-900/60 hover:bg-stone-900 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center ${
                      isSelected ? 'bg-[#8c2d2d] text-white' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {route.tag}
                  </span>
                </div>
                <div className="font-serif-tc text-sm font-bold text-stone-100">{route.name}</div>
                <div className="text-[11px] text-stone-400 font-sans flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{route.totalTime}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage: Left (Steps Guide & Audio) | Right (Interactive Map & 3F Floorplan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Step-by-Step Wayfinding Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 bg-[#18181b] border border-stone-800 rounded-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-sans text-amber-400 font-bold uppercase tracking-wider block">
                  ROUTE BREAKDOWN
                </span>
                <h4 className="font-serif-tc text-lg font-bold text-stone-100 flex items-center gap-2">
                  <span>{currentRoute.name}</span>
                </h4>
              </div>
              <span className="text-xs font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded border border-stone-800">
                共 {currentRoute.steps.length} 個步驟
              </span>
            </div>

            <p className="text-xs text-stone-300 font-sans leading-relaxed">
              {currentRoute.subtitle}
            </p>

            {/* Turn-by-Turn Steps */}
            <div className="space-y-3 pt-1">
              {currentRoute.steps.map((step, idx) => {
                const isSelected = selectedStepIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleStepClick(idx)}
                    className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-md'
                        : 'border-stone-800/80 bg-stone-900/40 hover:bg-stone-900/80 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-serif-tc text-xs font-bold text-stone-200 flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{step.title}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-sans shrink-0 bg-stone-950 px-1.5 py-0.5 rounded">
                        {step.duration}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 font-sans mt-2 leading-relaxed pl-7">
                      {step.desc}
                    </p>

                    {step.accessibilityNote && (
                      <div className="mt-2.5 ml-7 p-2 rounded bg-amber-950/40 border border-amber-600/30 text-[11px] text-amber-200 flex items-start gap-1.5">
                        <Accessibility className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>友善提示：</strong>{step.accessibilityNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Care Tip Notice */}
            <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-sm text-[11px] text-stone-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                演藝廳前台設有<strong>輪椅免費借用處</strong>與<strong>老花眼鏡/放大節目冊</strong>，如需協助請隨時告知身著背心的前台志工同學。
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Visual Map & 3F Lobby Floorplan (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 bg-[#18181b] border border-stone-800 rounded-sm shadow-xl space-y-4">
            {/* View Tab Switcher: Campus Schematic vs 3F Floorplan */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    ambientSynth.playButtonClickSFX();
                    setActiveViewTab('map');
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-serif-tc font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeViewTab === 'map'
                      ? 'bg-[#8c2d2d] text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>校園立體動線示意圖</span>
                </button>

                <button
                  onClick={() => {
                    ambientSynth.playButtonClickSFX();
                    setActiveViewTab('floorplan');
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-serif-tc font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeViewTab === 'floorplan'
                      ? 'bg-[#8c2d2d] text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>3F 演藝廳前台平面圖</span>
                </button>
              </div>

              <span className="text-[11px] text-amber-400 font-mono hidden sm:inline-block">
                {activeViewTab === 'map' ? '動態路徑發光模擬' : '前台服務站指引'}
              </span>
            </div>

            {/* TAB 1: Visual Vector Campus Map */}
            {activeViewTab === 'map' && (
              <div className="relative w-full aspect-[16/10] bg-[#121215] border border-stone-800 rounded-sm overflow-hidden p-4 flex flex-col justify-between select-none">
                {/* SVG Decorative Grid & Compass Mark */}
                <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-stone-900/80 border border-stone-700 text-[10px] text-stone-300 font-mono">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>北 (North) 慈濟大學中央校區</span>
                </div>

                {/* Campus Interactive Vector Canvas */}
                <svg className="w-full h-full" viewBox="0 0 600 360" fill="none">
                  {/* Road: Central Road (中央路) */}
                  <path d="M 40 330 L 560 330" stroke="#3f3f46" strokeWidth="24" strokeLinecap="round" />
                  <text x="300" y="334" fill="#a1a1aa" fontSize="11" textAnchor="middle" fontFamily="sans-serif">
                    中央路三段 (Main Boulevard)
                  </text>

                  {/* Campus Gate */}
                  <rect x="250" y="295" width="100" height="24" rx="2" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
                  <text x="300" y="311" fill="#f4f4f5" fontSize="10" textAnchor="middle" fontWeight="bold">
                    校門正門 (Gate)
                  </text>

                  {/* Bus Stop Point */}
                  <circle cx="120" cy="330" r="14" fill="#059669" opacity="0.8" />
                  <text x="120" y="334" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">公車</text>
                  <text x="120" y="354" fill="#34d399" fontSize="9" textAnchor="middle">慈濟大學站</text>

                  {/* Parking Lot Area */}
                  <rect x="420" y="180" width="140" height="90" rx="4" fill="#182234" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="490" y="215" fill="#38bdf8" fontSize="11" textAnchor="middle" fontWeight="bold">
                    來賓專屬停車場
                  </text>
                  <text x="490" y="235" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    地下 (B1) & 平面停車區
                  </text>

                  {/* Green Avenue (林蔭迎賓步道) */}
                  <path d="M 300 290 L 300 160" stroke="#22c55e" strokeWidth="14" strokeOpacity="0.2" strokeLinecap="round" />
                  <path d="M 300 290 L 300 160" stroke="#52525b" strokeWidth="4" strokeDasharray="4 4" />
                  <text x="315" y="230" fill="#a1a1aa" fontSize="10" fontFamily="serif">
                    林蔭迎賓大道
                  </text>

                  {/* Main Building: Da-Ai Building (大愛樓) */}
                  <rect x="180" y="50" width="240" height="110" rx="4" fill="#201717" stroke="#8c2d2d" strokeWidth="2" />
                  <text x="300" y="80" fill="#fca5a5" fontSize="14" textAnchor="middle" fontWeight="bold" fontFamily="serif">
                    大愛樓 (Da-Ai Building)
                  </text>

                  {/* 3F Auditorium Inside Da-Ai Building */}
                  <rect x="200" y="95" width="200" height="50" rx="3" fill="#8c2d2d" opacity="0.8" />
                  <text x="300" y="125" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold" fontFamily="serif">
                    ★ 3F 演藝廳 (Auditorium)
                  </text>

                  {/* Elevator Mark */}
                  <circle cx="215" cy="120" r="10" fill="#d97706" />
                  <text x="215" y="124" fill="#000" fontSize="9" textAnchor="middle" fontWeight="bold">電梯</text>

                  {/* Accessible Ramp Mark */}
                  <path d="M 160 140 L 195 140" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <text x="140" y="144" fill="#fbbf24" fontSize="9" textAnchor="middle">無障礙坡道</text>

                  {/* DYNAMIC ACTIVE ROUTE GLOW PATH */}
                  {activeRouteId === 'walking' && (
                    <motion.path
                      d="M 300 300 L 300 130"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
                    />
                  )}

                  {activeRouteId === 'accessible' && (
                    <motion.path
                      d="M 440 220 L 380 220 L 190 220 L 190 140 L 215 120"
                      stroke="#f59e0b"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8 }}
                    />
                  )}

                  {activeRouteId === 'parking' && (
                    <motion.path
                      d="M 300 320 L 480 320 L 480 220 L 390 120 L 300 120"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8 }}
                    />
                  )}

                  {activeRouteId === 'transit' && (
                    <motion.path
                      d="M 120 320 L 300 320 L 300 130"
                      stroke="#34d399"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8 }}
                    />
                  )}
                </svg>

                {/* Legend Bar */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8c2d2d]" />
                      <span>3F 演藝廳</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>無障礙電梯/坡道</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span>來賓停車場</span>
                    </span>
                  </div>
                  <span className="text-stone-500">點擊左側步驟可查看詳細說明</span>
                </div>
              </div>
            )}

            {/* TAB 2: 3F Auditorium Lobby Floorplan */}
            {activeViewTab === 'floorplan' && (
              <div className="relative w-full aspect-[16/10] bg-[#121215] border border-stone-800 rounded-sm p-4 flex flex-col justify-between select-none overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif-tc text-sm font-bold text-stone-100 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#8c2d2d]" />
                      <span>大愛樓 3F 演藝廳前台空間配置圖</span>
                    </h5>
                    <span className="text-[10px] font-sans px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded">
                      冷氣空調・無障礙友善
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans">
                    出電梯後右轉即為驗票口與節目冊索取處，兩側均設有洗手間與飲水機
                  </p>
                </div>

                {/* Visual Lobby Layout Grid */}
                <div className="grid grid-cols-3 gap-2.5 my-auto">
                  <div className="p-3 bg-stone-900 border border-stone-700 rounded-sm text-center space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold block">1. 驗票與服務處</span>
                    <p className="text-xs font-serif-tc text-stone-200 font-semibold">電子 QR / 實體邀請函</p>
                    <span className="text-[10px] text-stone-500 block">志工同學協助指引入座</span>
                  </div>

                  <div className="p-3 bg-[#8c2d2d]/30 border border-[#8c2d2d] rounded-sm text-center space-y-1">
                    <span className="text-[10px] text-amber-300 font-bold block">★ 演藝廳大門</span>
                    <p className="text-xs font-serif-tc text-white font-bold">觀眾席正門入口</p>
                    <span className="text-[10px] text-amber-200/80 block">18:30 開放入場</span>
                  </div>

                  <div className="p-3 bg-stone-900 border border-stone-700 rounded-sm text-center space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block">2. 紀念品與節目冊</span>
                    <p className="text-xs font-serif-tc text-stone-200 font-semibold">精美雙語特刊</p>
                    <span className="text-[10px] text-stone-500 block">自由免費索取</span>
                  </div>

                  <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-sm text-center">
                    <span className="text-[10px] text-sky-400 font-bold block">♿ 無障礙洗手間</span>
                    <span className="text-[10px] text-stone-400">大廳左側走廊</span>
                  </div>

                  <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-sm text-center">
                    <span className="text-[10px] text-amber-400 font-bold block">🛗 無障礙電梯口</span>
                    <span className="text-[10px] text-stone-400">直通 1F 與地下停車場</span>
                  </div>

                  <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-sm text-center">
                    <span className="text-[10px] text-emerald-400 font-bold block">💧 溫熱飲水機</span>
                    <span className="text-[10px] text-stone-400">大廳右側備有環保杯槽</span>
                  </div>
                </div>

                <div className="p-2 bg-stone-900/60 border border-stone-800 rounded text-[10px] text-stone-400 flex items-center justify-between">
                  <span>場內禁止攜帶外食與含糖飲料（礦泉水與保溫瓶除外）</span>
                  <span className="text-amber-400">慈大附中演職團隊敬祝觀演愉快</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CampusWayfindingMap.displayName = 'CampusWayfindingMap';
