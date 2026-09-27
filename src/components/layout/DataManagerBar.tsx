import React, { useState, memo } from 'react';
import { 
  Settings, 
  Plus, 
  Download, 
  RotateCcw, 
  Edit3, 
  ShieldCheck, 
  Lock, 
  Key, 
  LogOut, 
  Check, 
  X, 
  Music,
  History,
  Undo2,
  Clock,
  User,
  Image as ImageIcon,
  FileSpreadsheet,
  Info,
  HelpCircle,
  Sparkles,
  Cloud,
  CloudCheck,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ChangeRecord } from '../../types';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useShowCloudStatus, useShowDataActions } from '../../context/ShowDataContext';

interface DataManagerBarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddCastMember: () => void;
  onAddRehearsalPhoto: () => void;
  onAddTrack?: () => void;
  onOpenGrandConfig?: () => void;
  onOpenQuickTable?: () => void;
  onExportJSON: () => void;
  onResetData: () => void;
  recentChanges?: ChangeRecord[];
  onUndoChange?: (recordId: string) => void;
  isCloudSynced?: boolean;
  isCloudSaving?: boolean;
  lastCloudUpdate?: string;
}

export const DataManagerBar: React.FC<DataManagerBarProps> = memo(({
  isEditMode,
  onToggleEditMode,
  onAddCastMember,
  onAddRehearsalPhoto,
  onAddTrack,
  onOpenGrandConfig,
  onOpenQuickTable,
  onExportJSON,
  onResetData,
  recentChanges: propRecentChanges,
  onUndoChange,
  isCloudSynced: propIsCloudSynced,
  isCloudSaving: propIsCloudSaving,
  lastCloudUpdate: propLastCloudUpdate,
}) => {
  const cloudStatus = useShowCloudStatus();
  const showActions = useShowDataActions();
  const isCloudSynced = propIsCloudSynced !== undefined ? propIsCloudSynced : cloudStatus.isCloudSynced;
  const isCloudSaving = propIsCloudSaving !== undefined ? propIsCloudSaving : cloudStatus.isCloudSaving;
  const isOnline = cloudStatus.isOnline;
  const lastCloudUpdate = propLastCloudUpdate !== undefined ? propLastCloudUpdate : cloudStatus.lastCloudUpdate;
  const recentChanges = propRecentChanges !== undefined ? propRecentChanges : cloudStatus.recentChanges;

  const [openDrawer, setOpenDrawer] = useState(false);
  const [undoToast, setUndoToast] = useState<{ message: string; timestamp: string } | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  // Security PIN Auth States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Get or set stored PIN (default: 2026)
  const getStoredPin = (): string => {
    try {
      return localStorage.getItem('tcsh_admin_pin') || '2026';
    } catch {
      return '2026';
    }
  };

  // Session authentication status
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('tcsh_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const handleOpenManager = () => {
    if (isUnlocked) {
      setOpenDrawer(true);
    } else {
      setIsPinModalOpen(true);
      setInputPin('');
      setPinError(false);
    }
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentPin = getStoredPin();
    if (inputPin.trim() === currentPin) {
      setIsUnlocked(true);
      try {
        sessionStorage.setItem('tcsh_admin_unlocked', 'true');
      } catch (err) {
        console.warn('SessionStorage failed:', err);
      }
      setIsPinModalOpen(false);
      setInputPin('');
      setPinError(false);
      setOpenDrawer(true);
    } else {
      setPinError(true);
    }
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem('tcsh_admin_unlocked');
    } catch (err) {
      console.warn('SessionStorage failed:', err);
    }
    if (isEditMode) {
      onToggleEditMode();
    }
    setOpenDrawer(false);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      try {
        localStorage.setItem('tcsh_admin_pin', newPin.trim());
        setPinSuccessMsg('PIN 碼已成功修改！');
        setTimeout(() => setPinSuccessMsg(''), 3000);
        setIsChangingPin(false);
        setNewPin('');
      } catch {
        alert('無權限寫入 LocalStorage');
      }
    } else {
      alert('新 PIN 碼長度至少需 4 位數');
    }
  };

  return (
    <>
      {/* Floating Quick Manager Toggle Button (Bottom-Left, avoiding Audio Tour in bottom-right) */}
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3 sm:left-6 z-40 flex items-center gap-2 sm:gap-3">
        {isEditMode && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8c2d2d] text-white text-xs font-sans font-bold shadow-lg animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>演職管理員模式已啟用</span>
          </div>
        )}

        <MagneticWrapper strength={0.25}>
          <button
            onClick={handleOpenManager}
            className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border shadow-2xl transition-all duration-300 cursor-pointer touch-manipulation backdrop-blur-md ${
              isEditMode
                ? 'border-[#8c2d2d] bg-[#8c2d2d] text-white'
                : 'border-stone-700 bg-[#1a1a1c]/95 text-stone-300 hover:text-white hover:border-stone-500'
            }`}
            title="演職團隊資料維護與權限鎖"
          >
            {isUnlocked ? (
              <Settings className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isEditMode ? 'rotate-90' : 'group-hover:rotate-45'} transition-transform duration-300`} />
            ) : (
              <Lock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[11px] sm:text-xs font-sans font-semibold tracking-wider">
              {isEditMode ? '管理中' : isUnlocked ? '維護名單' : '後台管理'}
            </span>
          </button>
        </MagneticWrapper>
      </div>

      {/* Security PIN Lock Verification Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#1a1a1c] border border-stone-700 rounded-lg p-6 space-y-5 shadow-2xl text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-amber-200 font-serif-tc text-base font-bold">
                <ShieldCheck className="w-5 h-5 text-[#8c2d2d]" />
                <span>演職團隊管理員權限驗證</span>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              為防止校外一般訪客隨意更動公演資訊與同學資料，欲啟用編輯或新增資料請輸入管理員解鎖密碼。
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans text-stone-400 mb-1.5 uppercase tracking-wider">
                  管理員解鎖密碼 (PIN)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={inputPin}
                    onChange={(e) => {
                      setInputPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="請輸入密碼 (預設: 2026)"
                    className={`w-full bg-stone-900/90 border ${
                      pinError ? 'border-red-500 focus:ring-red-500' : 'border-stone-700 focus:border-amber-400'
                    } rounded-md pl-9 pr-4 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none transition-all font-mono`}
                    autoFocus
                  />
                </div>
                {pinError && (
                  <p className="text-[11px] text-red-400 mt-1 font-sans">
                    ⚠️ 解鎖密碼不正確，請重新確認。（預設密碼為 2026）
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">提示：</span>
                <span>學校演職幹部預設安全密碼為 <strong className="text-stone-200 font-mono">2026</strong>（解鎖後可在管理面板內自行修改密碼）。</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 border border-stone-700 hover:border-stone-500 text-stone-300 rounded text-xs font-sans transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8c2d2d] hover:bg-[#a63535] text-white rounded text-xs font-sans font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>驗證並開啟管理權限</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Control Drawer / Modal */}
      {openDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-2xl max-h-[88dvh] sm:max-h-[90vh] overflow-y-auto bg-[#1a1a1c] border border-stone-700 rounded-t-xl sm:rounded-lg p-4 sm:p-6 space-y-5 shadow-2xl text-stone-200 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 text-stone-100 font-serif-tc text-base font-bold">
                <Settings className="w-5 h-5 text-[#8c2d2d]" />
                <span>演職名單與排練實景維護中心</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLockAdmin}
                  title="登出管理員身份"
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-sans flex items-center gap-1 transition-colors border border-stone-700"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span>鎖定並登出</span>
                </button>
                <button
                  onClick={() => setOpenDrawer(false)}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Cloud Database Connection Indicator */}
              <div className={`p-3 rounded bg-stone-900/80 border ${
                !isOnline
                  ? 'border-amber-700/60 bg-amber-950/20'
                  : !isCloudSynced
                  ? 'border-yellow-700/50'
                  : 'border-sky-900/50'
              } flex items-center justify-between gap-3 text-stone-200`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-full shrink-0 ${
                    !isOnline
                      ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                      : !isCloudSynced
                      ? 'bg-yellow-950 text-yellow-400 border border-yellow-700/50'
                      : 'bg-sky-950 text-sky-400 border border-sky-700/50'
                  }`}>
                    {!isOnline ? (
                      <WifiOff className="w-4 h-4" />
                    ) : (
                      <Cloud className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sky-300">Firebase 雲端資料庫：</span>
                      {!isOnline ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          離線防護模式（本機安全儲存，連線後自動補傳）
                        </span>
                      ) : isCloudSaving ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                          雲端資料同步更新中...
                        </span>
                      ) : !isCloudSynced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          連線稍有延遲（自動重試中）
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          全校連線已就緒 (Real-time Live)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">
                      {lastCloudUpdate
                        ? `最後雲端同步時間：${new Date(lastCloudUpdate).toLocaleTimeString('zh-TW')}（修改對所有裝置即時生效）`
                        : '任何同學或老師在試算表編輯儲存，全校觀眾打開網頁均會即時同步！'}
                    </p>
                  </div>
                </div>

                {(!isCloudSynced || !isOnline) && (
                  <button
                    type="button"
                    onClick={() => showActions.retryPendingSync()}
                    disabled={isCloudSaving}
                    className="shrink-0 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-[11px] font-sans flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    title="立即重試連線並補傳資料"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCloudSaving ? 'animate-spin' : ''}`} />
                    <span>手動重試</span>
                  </button>
                )}
              </div>

              {pinSuccessMsg && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-sans flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              {/* Notice & Editing / Permission Guide for Teachers & Students */}
              <div className="space-y-2">
                <div className="p-3.5 rounded bg-[#241717] border border-amber-500/40 text-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-[#8c2d2d] text-white text-[10px] uppercase font-mono">
                        DEMO PLACEHOLDER
                      </span>
                      <span>關於示範資料與正式填寫說明</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPermissionGuide((prev) => !prev)}
                      className="text-[11px] text-amber-400 hover:text-amber-200 underline flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showPermissionGuide ? '收起指引' : '查看權限與編輯指引'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                    目前網站上預設的同學頭像、感言與排練側拍，皆為<strong>初始示範佔位樣板（Placeholder）</strong>，以便團隊預覽排版效果。老師與導演可放心交由各組幹部自由替換、輸入本班真實的演職資訊！
                  </p>
                </div>

                {showPermissionGuide && (
                  <div className="p-3.5 rounded bg-stone-900/90 border border-stone-700 text-stone-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 border-b border-stone-800 pb-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span>演職管理權限層級與分工指引</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-2.5 rounded bg-stone-950/70 border border-stone-800 space-y-1">
                        <div className="font-bold text-stone-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          <span>指導老師 / 導演組 (管理員)</span>
                        </div>
                        <p className="text-stone-400 leading-relaxed">
                          擁有解鎖 PIN 碼（預設 2026），可開啟畫面編輯模式、重置資料庫、匯出完整備份或自訂安全密碼。
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-stone-950/70 border border-stone-800 space-y-1">
                        <div className="font-bold text-stone-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>宣傳 / 總務 / 班級幹部</span>
                        </div>
                        <p className="text-stone-400 leading-relaxed">
                          建議直接使用「全班試算表」匯入 CSV 或貼上全班名單；若不想填台詞與照片可留空，系統自動美化。
                        </p>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-200/90 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>💡 編輯小撇步：所有更動均自動存於瀏覽器；若不小心改錯，隨時可在下方「最近更改記錄」點擊【復原】！</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-stone-300 leading-relaxed">
                您目前已通過管理員驗證。可在此直接上傳同學的大頭照、更換演出成員名單或上傳排練活動實影。變更將自動儲存於本機。
              </p>

              {/* Prominent Grand CMS Card for Dates, Countdowns & Copywriting */}
              {onOpenGrandConfig && (
                <div className="p-3.5 bg-gradient-to-r from-[#8c2d2d]/30 via-stone-900 to-amber-950/30 border border-amber-500/40 rounded-sm space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-sm bg-amber-400 text-stone-950 font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-serif-tc text-sm font-bold text-stone-100 flex items-center gap-1.5">
                          <span>全站文案與日程倒數總控</span>
                          <span className="text-[10px] font-sans px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded">
                            Grand CMS
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          修改公演日期目標、倒數計時器、索票 Google 表單網址、標語與交通指引
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenGrandConfig();
                        setOpenDrawer(false);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-serif-tc font-bold rounded-sm shadow-md transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>設定文案與倒數</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Actions Grouped by Category */}
              <div className="space-y-4 pt-1">
                {/* Section 1: Direct Content Creation & Batch Editing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5 font-sans">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>內容維護與名冊速編</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">隨點即改・全班同仁共編</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Visual Card Edit Mode Toggle */}
                    <button
                      onClick={() => {
                        onToggleEditMode();
                        setOpenDrawer(false);
                      }}
                      className={`p-3 border rounded-md flex items-center gap-3 transition-all text-left cursor-pointer ${
                        isEditMode
                          ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-white font-bold ring-1 ring-[#8c2d2d]'
                          : 'border-stone-700 bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:border-stone-500'
                      }`}
                    >
                      <div className={`p-2 rounded ${isEditMode ? 'bg-[#8c2d2d] text-white' : 'bg-stone-800 text-[#8c2d2d]'}`}>
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sans">
                          {isEditMode ? '關閉卡片懸浮編輯 (Exit)' : '開啟卡片懸浮編輯 (Edit Mode)'}
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                          直接在網頁卡片上點選「編輯」快速換照或修改文案
                        </div>
                      </div>
                    </button>

                    {/* Quick Spreadsheet Table Batch Editor */}
                    {onOpenQuickTable && (
                      <button
                        onClick={() => {
                          onOpenQuickTable();
                          setOpenDrawer(false);
                        }}
                        className="p-3 border border-amber-600/40 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-500 rounded-md flex items-center gap-3 transition-all text-left cursor-pointer"
                      >
                        <div className="p-2 rounded bg-amber-500/20 text-amber-400">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-200 font-sans flex items-center gap-1.5">
                            <span>全班名冊速查試算表</span>
                            <span className="text-[9px] px-1 py-0.2 bg-amber-500/30 text-amber-300 rounded font-mono">
                              批量維護
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                            如 Excel 般快速批次更名、防呆查重與 CSV 匯入匯出
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Add Cast Member */}
                    <button
                      onClick={() => {
                        onAddCastMember();
                        setOpenDrawer(false);
                      }}
                      className="p-3 border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-stone-500 rounded-md flex items-center gap-3 transition-all text-stone-200 text-left cursor-pointer"
                    >
                      <div className="p-2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sans">新增演職人員 / 同學</div>
                        <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                          新增主要演員、合唱群或幕後工作人員個人專頁
                        </div>
                      </div>
                    </button>

                    {/* Add Rehearsal Photo */}
                    <button
                      onClick={() => {
                        onAddRehearsalPhoto();
                        setOpenDrawer(false);
                      }}
                      className="p-3 border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-stone-500 rounded-md flex items-center gap-3 transition-all text-stone-200 text-left cursor-pointer"
                    >
                      <div className="p-2 rounded bg-sky-950/80 text-sky-400 border border-sky-800/40">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sans">新增排練實景照片</div>
                        <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                          上傳學校演藝廳或教室排練現場高清側拍照片
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Audio & Data Backup */}
                <div className="space-y-2 pt-1 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5 font-sans">
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>公演曲目與檔案備份</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">音訊管理・完整資料庫匯出</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Add Track */}
                    {onAddTrack && (
                      <button
                        onClick={() => {
                          onAddTrack();
                          setOpenDrawer(false);
                        }}
                        className="p-3 border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-stone-500 rounded-md flex items-center gap-3 transition-all text-stone-200 text-left cursor-pointer"
                      >
                        <div className="p-2 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40">
                          <Music className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-sans">新增公演音樂曲目</div>
                          <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                            上傳同學演唱錄音 (MP3) 或自訂雙語歌詞
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Export JSON */}
                    <button
                      onClick={() => {
                        onExportJSON();
                        setOpenDrawer(false);
                      }}
                      className="p-3 border border-stone-700 bg-stone-900/90 hover:bg-stone-800 hover:border-stone-500 rounded-md flex items-center gap-3 transition-all text-stone-200 text-left cursor-pointer"
                    >
                      <div className="p-2 rounded bg-stone-800 text-sky-400">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-sans">匯出名單與曲目備份</div>
                        <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                          下載包含名單、照片與曲目的完整 JSON 備份檔
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Changes History & Instant Undo Panel */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>最近更改操作記錄（最後 3 項）</span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    誤改可隨時單擊復原
                  </span>
                </div>

                {undoToast && (
                  <div className="p-3 rounded bg-emerald-950/85 border border-emerald-500/70 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-full bg-emerald-800/80 text-emerald-200 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-emerald-100 truncate">
                          {undoToast.message}
                        </p>
                        <span className="text-[10px] text-emerald-400/90 font-mono">
                          已安全回滾至 {undoToast.timestamp} 之前的狀態
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUndoToast(null)}
                      className="p-1 text-emerald-400 hover:text-emerald-100 transition-colors"
                      title="關閉提示"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {recentChanges.length === 0 ? (
                  <div className="p-3 rounded bg-stone-900/60 border border-stone-800 text-[11px] text-stone-500 flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-600" />
                    <span>尚無最近操作記錄（任何演職編輯或試算表儲存均會自動記錄並防呆）</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentChanges.map((change, idx) => {
                      const icon = change.targetType === 'cast' 
                        ? <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        : change.targetType === 'photo'
                        ? <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        : change.targetType === 'track'
                        ? <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;

                      return (
                        <div
                          key={change.id || idx}
                          className="p-2 rounded bg-stone-900/90 border border-stone-800 hover:border-stone-700 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {icon}
                            <div className="min-w-0">
                              <p className="text-[11px] text-stone-200 font-medium truncate">
                                {change.description}
                              </p>
                              <span className="text-[10px] text-stone-500 font-mono">
                                {change.timestamp}
                              </span>
                            </div>
                          </div>

                          {onUndoChange && (
                            <button
                              onClick={() => {
                                onUndoChange(change.id);
                                setUndoToast({
                                  message: `已成功復原：「${change.description}」`,
                                  timestamp: change.timestamp || new Date().toLocaleTimeString('zh-TW')
                                });
                                setTimeout(() => setUndoToast(null), 4500);
                              }}
                              className="shrink-0 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-stone-700 hover:border-amber-500/50 rounded text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="復原此項修改"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>復原</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Security PIN code customization */}
              <div className="pt-3 border-t border-stone-800">
                {!isChangingPin ? (
                  <button
                    onClick={() => setIsChangingPin(true)}
                    className="text-stone-400 hover:text-amber-200 text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>修改管理員解鎖密碼 (Current PIN: {getStoredPin()})</span>
                  </button>
                ) : (
                  <form onSubmit={handleChangePinSubmit} className="space-y-2 bg-stone-900 p-3 rounded border border-stone-800">
                    <div className="text-[11px] font-bold text-amber-200 flex items-center justify-between">
                      <span>設定新的管理員密碼 (至少 4 位數)</span>
                      <button
                        type="button"
                        onClick={() => setIsChangingPin(false)}
                        className="text-stone-500 hover:text-stone-300 text-[10px]"
                      >
                        取消
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="請輸入新 PIN 碼"
                        className="flex-1 bg-stone-950 border border-stone-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#8c2d2d] hover:bg-[#a63535] text-white text-xs font-bold rounded"
                      >
                        儲存新密碼
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Reset Warning */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">
                  若想還原為初始預設樣板資料：
                </span>
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3 py-1.5 border border-stone-800 hover:border-red-900 text-stone-400 hover:text-red-300 rounded text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>還原預設資料</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dangerous Reset Full Data Confirmation Modal */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="確認還原為初始預設樣板資料？"
        message="這將會重設所有自訂的演職人員名單、排練花絮照片與公演曲目，還原為《悲慘世界》官方示範樣板，並同步至雲端。此動作無法輕易復原，請確認是否繼續執行。"
        confirmLabel="確認重設全站資料"
        cancelLabel="取消保留現有內容"
        variant="danger"
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          setOpenDrawer(false);
          onResetData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
});

DataManagerBar.displayName = 'DataManagerBar';
