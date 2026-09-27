import React, { useState, useMemo, memo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'motion/react';
import { CastMember, MusicalTrack } from '../../types';
import { useShowGeneralConfig } from '../../context/ShowDataContext';
import { MagneticWrapper } from '../ui/MagneticWrapper';

interface SimpleGuideViewProps {
  castMembers: CastMember[];
  tracks: MusicalTrack[];
  onOpenCastDetail?: (member: CastMember) => void;
  onOpenQuickTableEdit?: () => void;
}

export const SimpleGuideView: React.FC<SimpleGuideViewProps> = memo(({
  castMembers,
  tracks,
  onOpenCastDetail,
  onOpenQuickTableEdit,
}) => {
  const config = useShowGeneralConfig();
  const [activeTab, setActiveTab] = useState<'info' | 'roster' | 'tracks' | 'faq'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'principal' | 'ensemble' | 'crew'>('all');

  const safeCast = useMemo(() => (Array.isArray(castMembers) ? castMembers : []), [castMembers]);
  const safeTracks = useMemo(() => (Array.isArray(tracks) ? tracks : []), [tracks]);

  // Precomputed search index to avoid repetitive lowercasing on every keystroke
  const castSearchIndex = useMemo(() => {
    return safeCast.map((member) => ({
      member,
      normalizedStr: `${member?.name ?? ''} ${member?.roleName ?? ''} ${member?.roleNameEn ?? ''}`.toLowerCase(),
      category: member?.category ?? 'ensemble',
    }));
  }, [safeCast]);

  const filteredCast = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return castSearchIndex
      .filter((entry) => {
        const matchesFilter = roleFilter === 'all' || entry.category === roleFilter;
        if (!matchesFilter) return false;
        return !query || entry.normalizedStr.includes(query);
      })
      .map((entry) => entry.member);
  }, [castSearchIndex, searchQuery, roleFilter]);

  const fallbackImage = 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=150&q=80';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#292524] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#8c2d2d] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Top Header with spacious margin & clean branding */}
        <header className="text-center space-y-4 pt-6 border-b border-stone-300/80 pb-8">
          <div className="flex items-center justify-center gap-2 text-stone-600 text-xs tracking-wider uppercase font-medium">
            <span>慈濟大學附屬高級中學 115 級</span>
            <span aria-hidden="true" className="text-[#8c2d2d] font-bold">·</span>
            <span>高二知足雙語班 英文公演</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif-tc font-bold tracking-tight text-stone-900 leading-tight">
            《悲慘世界》戲劇手冊與觀演指南
          </h1>
          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Les Misérables 演出資訊、卡司名冊、經典曲目與觀演問答一覽
          </p>

          {/* Quick Action Buttons for Teachers & Students */}
          {onOpenQuickTableEdit && (
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onOpenQuickTableEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-medium shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>開啟全班演職名冊快速編輯表（免程式碼）</span>
              </button>
            </div>
          )}
        </header>

        {/* Tab Navigation Pill Bar */}
        <nav 
          role="tablist" 
          aria-label="手冊章節分類"
          className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 bg-stone-200/80 rounded-lg max-w-xl mx-auto"
        >
          {[
            { id: 'info', label: '演出速覽', icon: Calendar },
            { id: 'roster', label: '演員名冊', icon: Users, count: safeCast.length },
            { id: 'tracks', label: '曲目一覽', icon: BookOpen, count: safeTracks.length },
            { id: 'faq', label: '常見問題', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#8c2d2d]' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-stone-100 text-stone-700' : 'bg-stone-300 text-stone-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Core Performance Quick Info */}
        {activeTab === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* 3 Core Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#8c2d2d]">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">公演時間</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{config.eventDateFormatted}</div>
                <p className="text-xs text-stone-600">{config.doorTime} 入場 / {config.showTime} 正式開演</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#8c2d2d]">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">演出場館</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{config.venueName}</div>
                <p className="text-xs text-stone-600">{config.venueAddress}</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#8c2d2d]">
                  <Ticket className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">入場方式</span>
                </div>
                <div className="text-xl font-bold text-stone-900">{config.admissionFee}</div>
                <p className="text-xs text-stone-600">{config.ticketNotice}</p>
              </div>
            </div>

            {/* Simple Synopsis (100 words) */}
            <section className="bg-white p-6 sm:p-8 rounded-lg border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-stone-900 font-serif-tc text-lg font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h2>100 秒讀懂《悲慘世界》劇情</h2>
              </div>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                十九世紀初的法國，十九年牢獄的<strong>尚萬強</strong>因主教的慈悲而洗心革面，成為熱心助人的市長。然而，剛正不阿的警官<strong>賈維爾</strong>依舊對他窮追不捨。在動盪的巴黎革命街壘上，尚萬強為了收養的孤女<strong>珂賽特</strong>及其愛人<strong>馬禮斯</strong>付出一切，在愛、救贖與尊嚴中寫下史詩般的生命樂章。
              </p>
              <div className="p-4 bg-stone-50 rounded border border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">✨ 本次公演特色：</p>
                <p>• 由高二知足雙語班全體同學以<strong>全英文台詞與百老匯經典唱段</strong>挑戰演出。</p>
                <p>• 融合戲劇表演、現場合唱、舞台美術、服裝道具與雙語字幕投影。</p>
              </div>
            </section>

            {/* Quick Ticket Action */}
            <section className="bg-stone-900 text-white p-6 sm:p-8 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-bold">準備好前來觀賞了嗎？</h3>
                <p className="text-xs sm:text-sm text-stone-300">
                  {config.ticketReleaseDate}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={config.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#8c2d2d] hover:bg-[#a33535] text-white rounded-md text-sm font-medium transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>立即線上索票劃位</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </section>
          </motion.div>
        )}

        {/* TAB 2: Clean Cast & Crew Directory */}
        {activeTab === 'roster' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋同學姓名、飾演角色..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'principal', label: '主要演員' },
                  { id: 'ensemble', label: '合唱群像' },
                  { id: 'crew', label: '幕後製作' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRoleFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      roleFilter === f.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Clean Table Roster */}
            <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">飾演角色</th>
                      <th className="py-3 px-4">演出同學</th>
                      <th className="py-3 px-4 hidden sm:table-cell">班級</th>
                      <th className="py-3 px-4">角色定位 / 一句話</th>
                      <th className="py-3 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {filteredCast.map((member) => (
                      <tr key={member?.id || Math.random().toString()} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900">
                          <div>{member?.roleName || '未定角色'}</div>
                          <div className="text-[11px] text-stone-500 font-normal">{member?.roleNameEn || ''}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-900">
                          <div className="flex items-center gap-2">
                            <img
                              src={member?.image || fallbackImage}
                              alt={member?.name || '演出同學'}
                              className="w-6 h-6 rounded-full object-cover border border-stone-300 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = fallbackImage;
                              }}
                            />
                            <span>{member?.name || '姓名未輸入'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-xs hidden sm:table-cell">
                          {member?.classYear ?? '高二知足'}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-600 max-w-xs truncate">
                          {member?.quote || member?.characterBio || '暫無描述'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {onOpenCastDetail && (
                            <button
                              onClick={() => onOpenCastDetail(member)}
                              className="text-xs text-[#8c2d2d] hover:text-[#a33535] font-medium underline cursor-pointer"
                            >
                              檢視詳情
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCast.length === 0 && (
                <div className="text-center py-12 text-stone-500 text-xs">
                  找不到符合條件的演員名單
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: Clean Tracks Overview */}
        {activeTab === 'tracks' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold text-stone-900">公演精選曲目表</h3>
                <p className="text-xs text-stone-500">百老匯原版經典唱段與主要演出者對照</p>
              </div>

              <div className="divide-y divide-stone-200">
                {safeTracks.map((t, idx) => (
                  <div key={t?.id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-400">{idx + 1}.</span>
                        <h4 className="text-sm font-bold text-stone-900">{t?.titleEn || 'Untitled Track'}</h4>
                        <span className="text-xs text-stone-500">（{t?.titleZh || ''}）</span>
                      </div>
                      <p className="text-xs text-stone-600 pl-4">{t?.desc || ''}</p>
                      <div className="text-[11px] text-stone-400 pl-4">
                        演唱：<span className="text-stone-700 font-medium">{t?.performer || t?.character || '全體演員'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {t?.spotifyUrl && (
                        <a
                          href={t.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>原聲串流</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: Audience FAQ */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white p-6 sm:p-8 rounded-lg border border-stone-200 shadow-sm space-y-6"
          >
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">觀演常見問題（FAQ）</h3>
              <p className="text-xs text-stone-500">提供老師、家長與校外貴賓的觀演指引</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">Q1. 請問演出需要購票嗎？</p>
                <p className="text-stone-700">A：完全免費！本場公演為花蓮慈大附中高二知足雙語班英文成果發表，採線上免費預約登記索票。</p>
              </div>

              <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">Q2. 全程英文演出，會有中文字幕嗎？</p>
                <p className="text-stone-700">A：現場舞台兩側均設有同步繁體中文字幕投影，不論長輩、學生或各年齡層皆能輕鬆理解劇情與經典唱詞。</p>
              </div>

              <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900">Q3. 開車前往該如何停車？</p>
                <p className="text-stone-700">A：慈濟大學校本部設有校內地下停車場與周邊路邊停車格，當晚憑演出票券證明即可於大門換證入校停車。</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Footer Note */}
        <footer className="text-center pt-8 border-t border-stone-300/80 text-xs text-stone-500 space-y-1">
          <p>© 2026 慈濟大學附屬高級中學 115 級高二知足雙語班 英文成果展演</p>
          <p>指導老師：雙語外語科教學團隊 ｜ 演出場地：慈濟大學演藝廳</p>
        </footer>

      </div>
    </div>
  );
});

SimpleGuideView.displayName = 'SimpleGuideView';
