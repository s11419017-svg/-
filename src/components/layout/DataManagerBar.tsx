import React, { useState } from 'react';
import { Settings, Plus, Download, RotateCcw, Edit3, ShieldCheck, Lock, Key, LogOut, Check, X } from 'lucide-react';

interface DataManagerBarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddCastMember: () => void;
  onAddRehearsalPhoto: () => void;
  onExportJSON: () => void;
  onResetData: () => void;
}

export const DataManagerBar: React.FC<DataManagerBarProps> = ({
  isEditMode,
  onToggleEditMode,
  onAddCastMember,
  onAddRehearsalPhoto,
  onExportJSON,
  onResetData,
}) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  
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
      {/* Floating Quick Manager Toggle Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {isEditMode && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8c2d2d] text-white text-xs font-sans font-bold shadow-lg animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>演職管理員模式已啟用</span>
          </div>
        )}

        <button
          onClick={handleOpenManager}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-2xl transition-all duration-300 ${
            isEditMode
              ? 'border-[#8c2d2d] bg-[#8c2d2d] text-white'
              : 'border-stone-700 bg-[#1a1a1c]/95 text-stone-300 hover:text-white hover:border-stone-500'
          }`}
          title="演職團隊資料維護與權限鎖"
        >
          {isUnlocked ? (
            <Settings className={`w-4 h-4 ${isEditMode ? 'rotate-90' : 'group-hover:rotate-45'} transition-transform duration-300`} />
          ) : (
            <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-sans font-semibold tracking-wider">
            {isEditMode ? '管理維護中' : isUnlocked ? '維護同學名單' : '後台資料管理'}
          </span>
        </button>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-xl bg-[#1a1a1c] border border-stone-700 rounded-sm p-6 space-y-6 shadow-2xl text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 text-stone-100 font-serif-tc text-base font-bold">
                <Settings className="w-5 h-5 text-[#8c2d2d]" />
                <span>同學名單與排練照片維護中心</span>
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
              {pinSuccessMsg && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-sans flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              {/* Notice to Teachers, Directors and Students */}
              <div className="p-3.5 rounded bg-[#241717] border border-amber-500/40 text-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-[#8c2d2d] text-white text-[10px] uppercase font-mono">
                    DEMO PLACEHOLDER
                  </span>
                  <span>關於樣板文案與照片特別說明</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                  目前網站上預設的同學頭像、感言與排練側拍，皆為<strong>初始示範佔位樣板（Placeholder）</strong>，以便團隊預覽排版效果。老師與導演可放心交由各組幹部自由替換、輸入本班真實的演職資訊！
                </p>
              </div>

              <p className="text-stone-300 leading-relaxed">
                您目前已通過管理員驗證。可在此直接上傳同學的大頭照、更換演出成員名單或上傳排練活動實影。變更將自動儲存於本機。
              </p>

              {/* Main Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    onToggleEditMode();
                    setOpenDrawer(false);
                  }}
                  className={`p-3 border rounded-sm flex items-center gap-3 transition-colors ${
                    isEditMode
                      ? 'border-[#8c2d2d] bg-[#8c2d2d]/20 text-white font-bold'
                      : 'border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-[#8c2d2d]" />
                  <div className="text-left">
                    <div className="font-bold">
                      {isEditMode ? '關閉畫面編輯模式 (Exit)' : '開啟畫面編輯模式 (Edit Mode)'}
                    </div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      啟用後可在各卡片上點擊「編輯」更換同學照片或文字
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAddCastMember();
                    setOpenDrawer(false);
                  }}
                  className="p-3 border border-stone-700 bg-stone-900 hover:bg-stone-800 rounded-sm flex items-center gap-3 transition-colors text-stone-200"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-bold">新增演職人員 / 同學</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      新增主要演員、合唱群或幕後工作人員
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onAddRehearsalPhoto();
                    setOpenDrawer(false);
                  }}
                  className="p-3 border border-stone-700 bg-stone-900 hover:bg-stone-800 rounded-sm flex items-center gap-3 transition-colors text-stone-200"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="font-bold">新增排練實景照片</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      上傳學校演藝廳或語言教室排練畫面
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportJSON();
                    setOpenDrawer(false);
                  }}
                  className="p-3 border border-stone-700 bg-stone-900 hover:bg-stone-800 rounded-sm flex items-center gap-3 transition-colors text-stone-200"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <div className="text-left">
                    <div className="font-bold">匯出名單 JSON 備份</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      下檔完整同學與照片資料 JSON 代碼
                    </div>
                  </div>
                </button>
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
                  onClick={() => {
                    onResetData();
                    setOpenDrawer(false);
                  }}
                  className="px-3 py-1.5 border border-stone-800 hover:border-red-900 text-stone-400 hover:text-red-300 rounded text-[11px] transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>還原預設資料</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
