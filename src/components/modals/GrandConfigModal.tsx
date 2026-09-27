import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Quote, 
  Accessibility, 
  Sparkles, 
  Check, 
  AlertCircle,
  ExternalLink,
  Car,
  Phone,
  BookOpen,
  Eye
} from 'lucide-react';
import { ShowGeneralConfig } from '../../types';
import { DEFAULT_SHOW_GENERAL_CONFIG } from '../../data/showData';
import { ambientSynth } from '../../utils/audioSynth';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FocusEditModalWrapper } from '../common/FocusEditModalWrapper';

interface GrandConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShowGeneralConfig;
  onSaveConfig: (newConfig: ShowGeneralConfig) => void;
  onResetConfig: () => void;
}

export const GrandConfigModal: React.FC<GrandConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'schedule' | 'tickets' | 'taglines' | 'accessibility'>('schedule');
  const [formData, setFormData] = useState<ShowGeneralConfig>(() => ({ ...config }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Keep synced if prop changes
  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  const handleChange = (field: keyof ShowGeneralConfig, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    ambientSynth.playSuccessSFX();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    ambientSynth.playButtonClickSFX();
    setFormData({ ...DEFAULT_SHOW_GENERAL_CONFIG });
    onResetConfig();
    setIsResetConfirmOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Live preview countdown calculation
  const targetTime = new Date(formData.eventDateIso).getTime();
  const now = new Date().getTime();
  const diff = targetTime - now;
  const isPast = diff <= 0 || isNaN(diff);
  const previewDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const previewHours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const previewMinutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <>
      <FocusEditModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title="全站文案與日程倒數總控中心"
        maxWidthClass="max-w-4xl"
      >
        <div className="flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-[#121215] border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#8c2d2d]/20 border border-[#8c2d2d]/50 flex items-center justify-center text-[#8c2d2d] dark:text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif-tc text-lg font-bold text-stone-100 flex items-center gap-2">
                  全站文案與日程倒數總控中心
                  <span className="text-[11px] font-sans px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full font-normal">
                    Grand CMS
                  </span>
                </h2>
                <p className="text-xs text-stone-400 font-sans">
                  修改全站公演時間、倒數目標、索票表單連結、大劇標語與無障礙交通說明
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                onClose();
              }}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-sm transition-colors cursor-pointer"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#161619] border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
          <button
            onClick={() => {
              ambientSynth.playButtonClickSFX();
              setActiveTab('schedule');
            }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-serif-tc font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-[#8c2d2d] text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>時間倒數與場地</span>
          </button>

          <button
            onClick={() => {
              ambientSynth.playButtonClickSFX();
              setActiveTab('tickets');
            }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-serif-tc font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-[#8c2d2d] text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>索票與票務管理</span>
          </button>

          <button
            onClick={() => {
              ambientSynth.playButtonClickSFX();
              setActiveTab('taglines');
            }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-serif-tc font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'taglines'
                ? 'bg-[#8c2d2d] text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>全站標語與導言</span>
          </button>

          <button
            onClick={() => {
              ambientSynth.playButtonClickSFX();
              setActiveTab('accessibility');
            }}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-serif-tc font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'accessibility'
                ? 'bg-[#8c2d2d] text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>交通與無障礙指引</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-200">
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-sm text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>變更已成功套用，並即時同步至全站所有訪客裝置與雲端！</span>
            </div>
          )}

          {/* TAB 1: SCHEDULE & VENUE */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Countdown Live Preview Box */}
              <div className="p-4 bg-[#121215] border border-amber-500/30 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans text-amber-300 font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    首頁倒數計時即時模擬 (Live Preview)
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    目標 ISO: {formData.eventDateIso || '未設定'}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-cinzel text-lg sm:text-2xl text-stone-100 tabular-nums">
                  {isPast ? (
                    <span className="text-stone-400 text-sm font-serif-tc">
                      時間已過（將顯示「公演已隆重登場／感謝全體蒞臨觀賞」）
                    </span>
                  ) : (
                    <>
                      <div>
                        <span className="font-bold text-amber-400">{previewDays}</span>{' '}
                        <span className="text-xs text-stone-400 font-sans">天</span>
                      </div>
                      <span className="text-stone-600">:</span>
                      <div>
                        <span className="font-bold text-stone-200">{previewHours}</span>{' '}
                        <span className="text-xs text-stone-400 font-sans">小時</span>
                      </div>
                      <span className="text-stone-600">:</span>
                      <div>
                        <span className="font-bold text-amber-400/90">{previewMinutes}</span>{' '}
                        <span className="text-xs text-stone-400 font-sans">分</span>
                      </div>
                      <span className="text-stone-500 text-xs font-sans ml-2">（秒數將於前台秒級即時遞減）</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    倒數計時目標時間 (ISO / Datetime) *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.eventDateIso.substring(0, 16)}
                    onChange={(e) => handleChange('eventDateIso', e.target.value ? e.target.value + ':00' : '')}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-stone-500 block mt-1">
                    倒數計時器將精確對齊此時間點
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    公演日期顯示文字 (Formatted Date)
                  </label>
                  <input
                    type="text"
                    value={formData.eventDateFormatted}
                    onChange={(e) => handleChange('eventDateFormatted', e.target.value)}
                    placeholder="2026 年 12 月 19 日 (星期五)"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-serif-tc"
                  />
                  <span className="text-[11px] text-stone-500 block mt-1">
                    顯示於票券與場地頁卡
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    開放入場時間 (Door Time)
                  </label>
                  <input
                    type="text"
                    value={formData.doorTime}
                    onChange={(e) => handleChange('doorTime', e.target.value)}
                    placeholder="18:30 開放入場"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    正式開演時間 (Show Time)
                  </label>
                  <input
                    type="text"
                    value={formData.showTime}
                    onChange={(e) => handleChange('showTime', e.target.value)}
                    placeholder="19:00 正式開演"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8c2d2d]" />
                    演出場地名稱 (Venue Name)
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => handleChange('venueName', e.target.value)}
                    placeholder="慈濟大學中央校區 大愛樓3樓演藝廳"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-serif-tc"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    場地詳細地址 (Venue Address)
                  </label>
                  <input
                    type="text"
                    value={formData.venueAddress}
                    onChange={(e) => handleChange('venueAddress', e.target.value)}
                    placeholder="花蓮縣花蓮市中央路三段701號 (大愛樓 3F)"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    劇目中文名稱 (Title Zh)
                  </label>
                  <input
                    type="text"
                    value={formData.titleZh}
                    onChange={(e) => handleChange('titleZh', e.target.value)}
                    placeholder="悲慘世界"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-serif-tc font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    劇目英文名稱 (Title En)
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => handleChange('titleEn', e.target.value)}
                    placeholder="Les Misérables"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-cinzel font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TICKETS & ADMISSION */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    索票狀態 (Ticket Status)
                  </label>
                  <select
                    value={formData.ticketStatus}
                    onChange={(e) => handleChange('ticketStatus', e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option value="open">開放登記中 (Open)</option>
                    <option value="coming_soon">即將開放 (Coming Soon)</option>
                    <option value="closed">索票已截止 (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    索票按鈕文案 (Button Text)
                  </label>
                  <input
                    type="text"
                    value={formData.ticketButtonText}
                    onChange={(e) => handleChange('ticketButtonText', e.target.value)}
                    placeholder="免費索票登記 (Free Admission)"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  線上索票登記表單網址 (Google Forms / Ticket URL)
                </label>
                <input
                  type="url"
                  value={formData.ticketUrl}
                  onChange={(e) => handleChange('ticketUrl', e.target.value)}
                  placeholder="https://forms.gle/your-form-url"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[11px] text-stone-500 block mt-1">
                  點擊索票按鈕時將直接跳轉此 Google 表單或索票系統
                </span>
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                  開放索票日程說明 (Release Date)
                </label>
                <input
                  type="text"
                  value={formData.ticketReleaseDate}
                  onChange={(e) => handleChange('ticketReleaseDate', e.target.value)}
                  placeholder="2026 年 11 月 01 日 中午 12:00 正式開放"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                  索票重要提醒與入場須知 (Notice)
                </label>
                <textarea
                  value={formData.ticketNotice}
                  onChange={(e) => handleChange('ticketNotice', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                  placeholder="一人一票，憑實體邀請函或電子登記 QR Code 入座..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: TAGLINES & COPYWRITING */}
          {activeTab === 'taglines' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                  公演副標題 (Subhead)
                </label>
                <input
                  type="text"
                  value={formData.subhead}
                  onChange={(e) => handleChange('subhead', e.target.value)}
                  placeholder="2026 慈大附中高二知足班（雙語班）表演英文公演｜English Drama Production"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-serif-tc"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    學校全稱 (School Name)
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => handleChange('schoolName', e.target.value)}
                    placeholder="慈濟大學實驗高級中學 (慈大附中)"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                    演職班級名稱 (Grade/Class Name)
                  </label>
                  <input
                    type="text"
                    value={formData.gradeName}
                    onChange={(e) => handleChange('gradeName', e.target.value)}
                    placeholder="高二知足班（雙語班）演職團隊"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                  <Quote className="w-3.5 h-3.5 text-amber-400" />
                  首頁大劇核心標語（中文）
                </label>
                <input
                  type="text"
                  value={formData.heroTagline}
                  onChange={(e) => handleChange('heroTagline', e.target.value)}
                  placeholder="即便是最黑暗的長夜終將結束，太陽必將升起。"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none font-serif-tc"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                  首頁大劇核心標語（英文）
                </label>
                <input
                  type="text"
                  value={formData.heroTaglineEn}
                  onChange={(e) => handleChange('heroTaglineEn', e.target.value)}
                  placeholder="Even the darkest night will end and the sun will rise."
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none italic font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1">
                  公演導言介紹 (Hero Lead Text)
                </label>
                <textarea
                  value={formData.heroLeadText}
                  onChange={(e) => handleChange('heroLeadText', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY & TRANSPORTATION */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-sky-400" />
                  來賓停車與自駕指引 (Parking Guide)
                </label>
                <textarea
                  value={formData.parkingGuide}
                  onChange={(e) => handleChange('parkingGuide', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                  placeholder="校內備有地下停車場與機車停車棚..."
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-amber-400" />
                  無障礙設施與輪椅席位支援 (Accessibility Support)
                </label>
                <textarea
                  value={formData.accessibilitySupport}
                  onChange={(e) => handleChange('accessibilitySupport', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none leading-relaxed"
                  placeholder="演藝廳備有無障礙電梯與專用輪椅席位..."
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-300 font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  前台服務與諮詢電話 (Contact Info)
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => handleChange('contactInfo', e.target.value)}
                  placeholder="慈大附中雙語教學組 (03) 857-2823 分機 123"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-stone-100 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2 border border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-sm text-xs font-serif-tc flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>還原官方預設值</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  ambientSynth.playButtonClickSFX();
                  onClose();
                }}
                className="px-4 py-2 border border-stone-700 text-stone-300 hover:text-white rounded-sm text-xs font-serif-tc transition-colors cursor-pointer"
              >
                取消
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white rounded-sm text-xs font-serif-tc font-bold flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-300" />
                <span>儲存並同步全站</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </FocusEditModalWrapper>

    <ConfirmDialog
      isOpen={isResetConfirmOpen}
      title="確定要還原全站文案與日程嗎？"
      message="這將把公演日期、時間倒數、場地與所有全站標語還原為初始官方預設值。"
      confirmLabel="確認還原"
      variant="warning"
      onConfirm={handleReset}
      onCancel={() => setIsResetConfirmOpen(false)}
    />
  </>
);
};
