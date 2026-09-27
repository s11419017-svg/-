import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  CheckCircle2,
  Copy,
  Undo2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Camera,
  Filter,
  Wand2,
  Layers
} from 'lucide-react';
import { CastMember } from '../../types';
import { CAST_MEMBERS as INITIAL_CAST_DATA } from '../../data/showData';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { computeCastMetricsSinglePass } from '../../utils/mathUtils';
import { parseRFC4180CSV } from '../../utils/textEncoding';
import { compressImage } from '../../utils/imageCompressor';
import { FocusEditModalWrapper } from '../common/FocusEditModalWrapper';

interface QuickTableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  castMembers: CastMember[];
  onSaveCast: (newCast: CastMember[]) => void;
  onResetCast: () => void;
}

interface HistoryItem {
  list: CastMember[];
  description: string;
  timestamp: string;
}

export const QuickTableEditModal: React.FC<QuickTableEditModalProps> = ({
  isOpen,
  onClose,
  castMembers,
  onSaveCast,
  onResetCast,
}) => {
  if (!isOpen) return null;

  const [list, setList] = useState<CastMember[]>(() => JSON.parse(JSON.stringify(castMembers)));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'principal' | 'ensemble' | 'crew' | 'issues'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [showBatchTools, setShowBatchTools] = useState(false);
  const [batchClassInput, setBatchClassInput] = useState('高二知足班');
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Avatar Quick Edit State
  const [editingAvatarIndex, setEditingAvatarIndex] = useState<number | null>(null);
  const [avatarInputUrl, setAvatarInputUrl] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Error-proofing dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single-pass O(N) sanity metrics calculation using mathUtils
  const { duplicateNames, emptyNameCount, emptyRoleCount } = useMemo(
    () => computeCastMetricsSinglePass(list),
    [list]
  );

  // Category counts and issues count calculation
  const categoryCounts = useMemo(() => {
    let principal = 0;
    let ensemble = 0;
    let crew = 0;
    let issues = 0;
    list.forEach((m) => {
      if (m.category === 'ensemble') ensemble++;
      else if (m.category === 'crew') crew++;
      else principal++;

      const trimmedName = (m.name || '').trim();
      const isDuplicate = trimmedName ? duplicateNames.has(trimmedName) : false;
      const isNameEmpty = !trimmedName;
      const isRoleEmpty = !(m.roleName || '').trim();
      if (isDuplicate || isNameEmpty || isRoleEmpty) {
        issues++;
      }
    });
    return { principal, ensemble, crew, issues };
  }, [list, duplicateNames]);

  const recordHistory = (description: string) => {
    const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory((prev) => [{ list: list.map(item => ({ ...item })), description, timestamp: time }, ...prev.slice(0, 9)]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const [previous, ...rest] = history;
      setList(previous.list);
      setHistory(rest);
      setImportNotice({ type: 'success', message: `已成功復原：「${previous.description}」` });
    }
  };

  const handleFieldChange = (index: number, field: keyof CastMember, val: string) => {
    setList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddRow = () => {
    recordHistory('新增一位演職同學');
    const newMember: CastMember = {
      id: `custom-cast-${Date.now()}`,
      name: `同學${list.length + 1}`,
      classYear: '高二知足',
      roleName: '新角色',
      roleNameEn: 'New Character',
      category: 'principal',
      quote: '',
      reflection: '',
      characterBio: '',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    };
    setList((prev) => [newMember, ...prev]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = list[index];
    recordHistory(`複製同學「${target.name || '未命名'}」`);
    const duplicated: CastMember = {
      ...target,
      id: `custom-cast-${Date.now()}`,
      name: `${target.name} (副本)`,
    };
    setList((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
  };

  const handleDeleteRow = (index: number) => {
    const target = list[index];
    setConfirmDialog({
      isOpen: true,
      title: '確認刪除此演員？',
      message: `即將從名冊中移除「${target.name || '未命名'}」（飾演 ${target.roleName || '未定'}）。此動作可於儲存前點擊「復原」按鈕取回。`,
      confirmLabel: '確認刪除',
      variant: 'danger',
      action: () => {
        recordHistory(`刪除同學「${target.name || '未命名'}」`);
        setList((prev) => prev.filter((_, i) => i !== index));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Move row up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const target = list[index];
    recordHistory(`上移「${target.name || '同學'}」順序`);
    setList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Move row down
  const handleMoveDown = (index: number) => {
    if (index >= list.length - 1) return;
    const target = list[index];
    recordHistory(`下移「${target.name || '同學'}」順序`);
    setList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Batch class setter
  const handleBatchSetClass = () => {
    if (!batchClassInput.trim()) return;
    recordHistory(`批次統一班級為「${batchClassInput.trim()}」`);
    setList((prev) => prev.map((m) => ({ ...m, classYear: batchClassInput.trim() })));
    setImportNotice({ type: 'success', message: `已成功將全班 ${list.length} 位同學的班級統一為「${batchClassInput.trim()}」！` });
    setShowBatchTools(false);
  };

  // Batch clean spaces & symbols
  const handleCleanAllSpaces = () => {
    recordHistory('一鍵淨化全班文字前後空白');
    setList((prev) =>
      prev.map((m) => ({
        ...m,
        name: (m.name || '').trim(),
        roleName: (m.roleName || '').trim(),
        roleNameEn: (m.roleNameEn || '').trim(),
        classYear: (m.classYear || '').trim(),
        quote: (m.quote || '').trim(),
      }))
    );
    setImportNotice({ type: 'success', message: '已完成全班欄位文字前後空白淨化！' });
    setShowBatchTools(false);
  };

  // Smart Role Category Auto-Classifier based on keywords
  const handleSmartCategorize = () => {
    recordHistory('依角色關鍵字智慧分類');
    setList((prev) =>
      prev.map((m) => {
        const role = (m.roleName || '').toLowerCase();
        let category = m.category;
        if (
          role.includes('合唱') ||
          role.includes('歌隊') ||
          role.includes('群演') ||
          role.includes('市民') ||
          role.includes('學生') ||
          role.includes('暴民') ||
          role.includes('市民')
        ) {
          category = 'ensemble';
        } else if (
          role.includes('後台') ||
          role.includes('導演') ||
          role.includes('燈光') ||
          role.includes('音響') ||
          role.includes('音效') ||
          role.includes('道具') ||
          role.includes('服裝') ||
          role.includes('總監') ||
          role.includes('劇組')
        ) {
          category = 'crew';
        } else {
          category = 'principal';
        }
        return { ...m, category };
      })
    );
    setImportNotice({ type: 'success', message: '已成功依角色關鍵字智慧自動分類（主演 / 群演 / 幕後）！' });
    setShowBatchTools(false);
  };

  // Sort list by category (principal -> ensemble -> crew)
  const handleSortByCategory = () => {
    recordHistory('依「主演 → 歌隊 → 幕後」順序重排');
    const order: Record<string, number> = { principal: 1, ensemble: 2, crew: 3 };
    setList((prev) => [...prev].sort((a, b) => (order[a.category] || 99) - (order[b.category] || 99)));
    setImportNotice({ type: 'success', message: '已成功依「主要演員 → 歌隊群演 → 幕後團隊」順序重排全班名冊！' });
    setShowBatchTools(false);
  };

  // Detect unsaved changes
  const isDirty = useMemo(() => {
    return JSON.stringify(list) !== JSON.stringify(castMembers);
  }, [list, castMembers]);

  // Guard against closing with unsaved changes
  const handleSafeClose = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: '名冊修改尚未儲存',
        message: '您在此次表格編輯中已調整了資料。如果現在離開，未儲存的內容將不會套用至網站。確定要捨棄變更離開嗎？',
        confirmLabel: '捨棄變更並離開',
        variant: 'warning',
        action: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // Safe Save with Validation
  const handleSave = () => {
    if (emptyNameCount > 0 || emptyRoleCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: '名冊欄位尚未填寫完整',
        message: `目前發現有 ${emptyNameCount > 0 ? `${emptyNameCount} 處學生姓名為空` : ''}${emptyNameCount > 0 && emptyRoleCount > 0 ? '、' : ''}${emptyRoleCount > 0 ? `${emptyRoleCount} 處角色名稱為空` : ''}。是否仍要直接儲存？`,
        confirmLabel: '仍要儲存',
        variant: 'warning',
        action: () => {
          onSaveCast(list);
          setSaveSuccess(true);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setTimeout(() => {
            setSaveSuccess(false);
            onClose();
          }, 800);
        },
      });
      return;
    }

    onSaveCast(list);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  // Keyboard Shortcuts: Ctrl+S to save, Ctrl+Z to undo, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape') {
        if (editingAvatarIndex !== null) {
          setEditingAvatarIndex(null);
        } else {
          handleSafeClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [list, history, editingAvatarIndex, emptyNameCount, emptyRoleCount]);

  // Avatar Quick Updater
  const handleOpenAvatarEditor = (index: number) => {
    setEditingAvatarIndex(index);
    setAvatarInputUrl(list[index].image || '');
  };

  const handleSaveAvatarUrl = () => {
    if (editingAvatarIndex === null) return;
    const target = list[editingAvatarIndex];
    recordHistory(`更換「${target.name || '同學'}」照片網址`);
    handleFieldChange(editingAvatarIndex, 'image', avatarInputUrl);
    setEditingAvatarIndex(null);
  };

  const handleUploadAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingAvatarIndex === null) return;
    try {
      setIsCompressingAvatar(true);
      const compressed = await compressImage(file, 600, 600, 0.85);
      const target = list[editingAvatarIndex];
      recordHistory(`上傳「${target.name || '同學'}」的新肖像照`);
      handleFieldChange(editingAvatarIndex, 'image', compressed);
      setEditingAvatarIndex(null);
    } catch (err) {
      console.error(err);
      setImportNotice({ type: 'error', message: '照片壓縮失敗，請改用貼上網址方式。' });
    } finally {
      setIsCompressingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  // Safe 1-Click Reset to Initial Demo Data
  const handleOneClickReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: '一鍵重置為初始示範名冊？',
      message: '這將會將當前表格內容完全重設為官方《悲慘世界》全班標準示範名單（包含游承翰、江承諺等經典主演與群演）。您已做的修改將被覆蓋。',
      confirmLabel: '確認重置為預設',
      variant: 'warning',
      action: () => {
        recordHistory('一鍵重置為初始示範名冊');
        const defaultData = JSON.parse(JSON.stringify(INITIAL_CAST_DATA));
        setList(defaultData);
        onResetCast();
        setImportNotice({ type: 'success', message: '已成功一鍵重置為官方初始示範名冊！點擊「儲存並同步」即可套用至全站。' });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Safe Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['姓名', '飾演角色(中)', '飾演角色(英)', '班級', '身分組別(principal/ensemble/crew)', '金句/台詞', '照片網址'];
      const rows = list.map((m) => [
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.roleName || '').replace(/"/g, '""')}"`,
        `"${(m.roleNameEn || '').replace(/"/g, '""')}"`,
        `"${(m.classYear || '高二知足').replace(/"/g, '""')}"`,
        `"${m.category || 'principal'}"`,
        `"${(m.quote || '').replace(/"/g, '""')}"`,
        `"${(m.image || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `高二知足雙語班_悲慘世界演職名冊_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setImportNotice({ type: 'error', message: '匯出失敗，請檢查瀏覽器安全性設定。' });
    }
  };

  // Safe CSV Import with Format Validation
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('檔案內容為空');

        const allRows = parseRFC4180CSV(text);
        if (allRows.length <= 1) {
          throw new Error('CSV 內容缺少資料行');
        }

        const newParsedList: CastMember[] = [];
        // Skip header row
        for (let i = 1; i < allRows.length; i++) {
          const cols = allRows[i];
          if (cols.length >= 2) {
            const name = cols[0] || `同學${i}`;
            const roleName = cols[1] || '未定角色';
            const roleNameEn = cols[2] || 'Character';
            const classYear = cols[3] || '高二知足';
            const rawCat = (cols[4] || 'principal').toLowerCase();
            const category = rawCat.includes('ensemble') ? 'ensemble' : rawCat.includes('crew') ? 'crew' : 'principal';
            const quote = cols[5] || '';
            const image = cols[6] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';

            newParsedList.push({
              id: `imported-cast-${Date.now()}-${i}`,
              name,
              roleName,
              roleNameEn,
              classYear,
              category,
              quote,
              reflection: '',
              characterBio: '',
              image,
            });
          }
        }

        if (newParsedList.length === 0) {
          throw new Error('無法辨識 CSV 格式，請確保欄位順序符合標準');
        }

        recordHistory(`匯入 CSV 名冊 (${newParsedList.length} 人)`);
        setList(newParsedList);
        setImportNotice({ type: 'success', message: `成功匯入 ${newParsedList.length} 筆演員名冊！請檢視後點擊「儲存並同步」以生效。` });
      } catch (err: any) {
        setImportNotice({ type: 'error', message: `匯入失敗：${err.message || '檔案格式不符'}` });
      }
    };
    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <FocusEditModalWrapper
        isOpen={isOpen}
        onClose={handleSafeClose}
        title="全班演職名冊快速試算表"
        maxWidthClass="max-w-6xl"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-stone-300">
          
          {/* Modal Header */}
          <div className="p-4 sm:p-5 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
                <h2 className="text-base sm:text-xl font-bold text-stone-900 font-sans flex items-center gap-2">
                  <span>全班演職名冊快速試算表</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-medium rounded-full border border-amber-300">
                    Excel 式雙向同步
                  </span>
                  {isDirty && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-800 border border-amber-500/40 text-[11px] font-bold rounded">
                      ● 編輯中 (未儲存)
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-stone-600">
                點擊表格直接修改演員與角色資料，支援隨時還原、CSV 匯入匯出與重名防呆校驗。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOneClickReset}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                title="一鍵將所有名單重設回官方標準悲慘世界示範名單"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>重置示範資料</span>
              </button>

              <button
                onClick={handleSafeClose}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors cursor-pointer"
                title="關閉編輯器 (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Validation & Alert Notices */}
          {importNotice && (
            <div className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
              importNotice.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {importNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{importNotice.message}</span>
              </div>
              <button 
                onClick={() => setImportNotice(null)}
                className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
              >
                關閉
              </button>
            </div>
          )}

          {/* Real-time Sanity Checks Summary */}
          {(emptyNameCount > 0 || emptyRoleCount > 0) && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                防呆提示：目前名冊有 {emptyNameCount > 0 ? `「${emptyNameCount} 筆學生姓名空白」` : ''} 
                {emptyRoleCount > 0 ? `「${emptyRoleCount} 筆角色名稱空白」` : ''}，儲存前請記得補充。
              </span>
            </div>
          )}

          {/* Collapsible Field Guide / 欄位說明標籤 */}
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFieldGuide((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>欄位填寫說明（老師與同學快速指引）</span>
                {showFieldGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 md:hidden">
                <MoveHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>表格支援左右滑動</span>
              </div>
            </div>

            {showFieldGuide && (
              <div className="mt-2.5 pt-2.5 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px] text-stone-600">
                <div className="bg-white p-2 rounded border border-stone-200">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    學生姓名 (必填)
                  </div>
                  <p className="text-stone-500 mt-0.5">演員同學真實全名，重複同名時系統會跳出醒目標籤。</p>
                </div>

                <div className="bg-white p-2 rounded border border-stone-200">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    飾演角色 (中 / 英)
                  </div>
                  <p className="text-stone-500 mt-0.5">中文名（如：尚萬強）與英文名（如：Jean Valjean）。</p>
                </div>

                <div className="bg-white p-2 rounded border border-stone-200">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    所屬班級
                  </div>
                  <p className="text-stone-500 mt-0.5">預設「高二知足」，亦可填寫「雙語戲劇組」等自訂組別。</p>
                </div>

                <div className="bg-white p-2 rounded border border-stone-200">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    組別類別
                  </div>
                  <p className="text-stone-500 mt-0.5">主要主角 (Principal) / 群演歌隊 (Ensemble) / 幕後團隊 (Crew)。</p>
                </div>

                <div className="bg-white p-2 rounded border border-stone-200 sm:col-span-2 lg:col-span-1">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    角色台詞 / 心聲簡介
                  </div>
                  <p className="text-stone-500 mt-0.5">呈現在前台角色卡片與角色訪談的代表台詞或排練感言。</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-medium rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增一位同學</span>
              </button>

              {history.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="復原上一步修改 (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>復原 ({history.length})</span>
                </button>
              )}

              <button
                onClick={() => setShowBatchTools((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  showBatchTools 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300'
                }`}
                title="展開班級批次統一工具"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                <span>批次工具</span>
                {showBatchTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                title="匯出為 Excel CSV 檔案"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>匯出 CSV</span>
              </button>

              <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                <span>匯入 CSV</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleOneClickReset}
                className="sm:hidden px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="重置回初始名冊"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>重置預設</span>
              </button>
            </div>

            {/* Live Search in Table */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋姓名或角色..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:border-amber-500 w-32 sm:w-44"
                />
              </div>

              <div className="text-xs text-stone-500 whitespace-nowrap hidden sm:block font-mono">
                共 <strong className="text-stone-800">{list.length}</strong> 位
              </div>
            </div>
          </div>

          {/* Batch Tools Panel (Collapsible) */}
          {showBatchTools && (
            <div className="p-3 bg-amber-50/80 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>批次維護工具：</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={batchClassInput}
                    onChange={(e) => setBatchClassInput(e.target.value)}
                    placeholder="如：高二知足班"
                    className="px-2 py-1 bg-white border border-amber-300 rounded text-xs w-28 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    onClick={handleBatchSetClass}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    一鍵統一全班班級
                  </button>
                </div>

                <div className="h-4 w-px bg-amber-300 mx-1 hidden sm:block" />

                <button
                  onClick={handleSmartCategorize}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                  title="依角色關鍵字自動判定分類 (如:合唱/市民→歌隊, 導演/燈光/道具→幕後, 其他→主角)"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>依角色名智慧分類</span>
                </button>

                <button
                  onClick={handleSortByCategory}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-xs font-medium cursor-pointer transition-colors"
                  title="依「主要演員 → 歌隊群演 → 幕後團隊」順序重排名冊"
                >
                  依主演/群演/幕後重排
                </button>

                <button
                  onClick={handleCleanAllSpaces}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-white text-stone-800 border border-stone-300 rounded text-xs font-medium cursor-pointer transition-colors"
                  title="自動去除所有文字欄位前後的多餘空白"
                >
                  一鍵文字前後空白淨化
                </button>
              </div>

              <button
                onClick={() => setShowBatchTools(false)}
                className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
              >
                收合工具
              </button>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="px-3 sm:px-4 py-2 bg-stone-100/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-500 text-[11px] mr-1 hidden sm:inline-flex items-center gap-1">
                <Filter className="w-3 h-3 text-stone-400" />
                <span>檢視篩選:</span>
              </span>

              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                全部 ({list.length})
              </button>

              <button
                onClick={() => setCategoryFilter('principal')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'principal'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                主要主角 ({categoryCounts.principal})
              </button>

              <button
                onClick={() => setCategoryFilter('ensemble')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'ensemble'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                群演歌隊 ({categoryCounts.ensemble})
              </button>

              <button
                onClick={() => setCategoryFilter('crew')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'crew'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                幕後團隊 ({categoryCounts.crew})
              </button>

              {categoryCounts.issues > 0 && (
                <button
                  onClick={() => setCategoryFilter('issues')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    categoryFilter === 'issues'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                  }`}
                >
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>待補/疑慮 ({categoryCounts.issues})</span>
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-500 font-mono">
              <span className="px-1.5 py-0.5 bg-stone-200 rounded text-stone-700">Ctrl+S / ⌘S 儲存</span>
              <span className="px-1.5 py-0.5 bg-stone-200 rounded text-stone-700">Ctrl+Z / ⌘Z 復原</span>
            </div>
          </div>

          {/* Spreadsheet Editable Table with Responsive Horizontal Scroll */}
          <div className="flex-1 overflow-auto p-2 sm:p-4 bg-stone-50/50">
            <div className="overflow-x-auto rounded border border-stone-300 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[880px]">
                <thead className="bg-stone-200 sticky top-0 z-10 text-stone-700 font-semibold shadow-xs">
                  <tr>
                    <th className="p-2.5 border border-stone-300 w-12 text-center">序號</th>
                    <th className="p-2.5 border border-stone-300 w-14 text-center">照片</th>
                    <th className="p-2.5 border border-stone-300 w-36">學生姓名 (必填)</th>
                    <th className="p-2.5 border border-stone-300 w-32">角色 (中文)</th>
                    <th className="p-2.5 border border-stone-300 w-36">角色 (英文)</th>
                    <th className="p-2.5 border border-stone-300 w-28">班級</th>
                    <th className="p-2.5 border border-stone-300 w-36">組別類別</th>
                    <th className="p-2.5 border border-stone-300 min-w-[200px]">角色台詞 / 心聲簡介</th>
                    <th className="p-2.5 border border-stone-300 w-28 text-center sticky right-0 bg-stone-200 z-10">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {list.map((m, idx) => {
                    const isMatch = !searchFilter || 
                      (m.name || '').includes(searchFilter) || 
                      (m.roleName || '').includes(searchFilter) || 
                      (m.roleNameEn || '').toLowerCase().includes(searchFilter.toLowerCase());

                    const trimmedName = (m.name || '').trim();
                    const isDuplicate = trimmedName ? duplicateNames.has(trimmedName) : false;
                    const isNameEmpty = !trimmedName;
                    const isRoleEmpty = !(m.roleName || '').trim();

                    const isCategoryMatch =
                      categoryFilter === 'all' ||
                      (categoryFilter === 'principal' && m.category === 'principal') ||
                      (categoryFilter === 'ensemble' && m.category === 'ensemble') ||
                      (categoryFilter === 'crew' && m.category === 'crew') ||
                      (categoryFilter === 'issues' && (isDuplicate || isNameEmpty || isRoleEmpty));

                    if (!isMatch || !isCategoryMatch) return null;

                    return (
                      <tr key={m.id || idx} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-2 border border-stone-300 text-center font-mono text-stone-400">
                          {idx + 1}
                        </td>
                        <td className="p-1 border border-stone-300 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAvatarEditor(idx)}
                            className="relative group w-8 h-8 rounded-full overflow-hidden border border-stone-300 mx-auto block hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                            title="點擊更換照片或貼上網址"
                          >
                            <img
                              src={m.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                              alt={m.name || '照片'}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        </td>
                        <td className="p-1 border border-stone-300">
                          <div className="relative">
                            <input
                              type="text"
                              value={m.name}
                              onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                              placeholder="請填入姓名"
                              className={`w-full px-2 py-1.5 bg-white border rounded font-medium focus:bg-amber-50 focus:outline-none ${
                                isNameEmpty 
                                  ? 'border-rose-400 bg-rose-50/50' 
                                  : isDuplicate 
                                  ? 'border-amber-400 bg-amber-50/30' 
                                  : 'border-stone-300 focus:border-amber-500'
                              }`}
                            />
                            {isDuplicate && (
                              <span 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-700 bg-amber-100 px-1 rounded" 
                                title="發現有重複同名的同學"
                              >
                                重名
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-1 border border-stone-300">
                          <input
                            type="text"
                            value={m.roleName}
                            onChange={(e) => handleFieldChange(idx, 'roleName', e.target.value)}
                            placeholder="例如: 尚萬強"
                            className={`w-full px-2 py-1.5 bg-white border rounded focus:bg-amber-50 focus:outline-none ${
                              isRoleEmpty ? 'border-amber-300 bg-amber-50/30' : 'border-stone-300 focus:border-amber-500'
                            }`}
                          />
                        </td>
                        <td className="p-1 border border-stone-300">
                          <input
                            type="text"
                            value={m.roleNameEn}
                            onChange={(e) => handleFieldChange(idx, 'roleNameEn', e.target.value)}
                            placeholder="e.g. Jean Valjean"
                            className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-stone-700 font-mono text-[11px] focus:bg-amber-50 focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 border border-stone-300">
                          <input
                            type="text"
                            value={m.classYear || '高二知足'}
                            onChange={(e) => handleFieldChange(idx, 'classYear', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-stone-700 focus:bg-amber-50 focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 border border-stone-300">
                          <select
                            value={m.category}
                            onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-stone-800 text-xs focus:bg-amber-50 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="principal">主要主角 (Principal)</option>
                            <option value="ensemble">群演歌隊 (Ensemble)</option>
                            <option value="crew">幕後團隊 (Crew)</option>
                          </select>
                        </td>
                        <td className="p-1 border border-stone-300">
                          <input
                            type="text"
                            value={m.quote || m.characterBio || ''}
                            onChange={(e) => handleFieldChange(idx, 'quote', e.target.value)}
                            placeholder="輸入一句角色的代表台詞或簡介..."
                            className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-stone-700 focus:bg-amber-50 focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-1 border border-stone-300 text-center sticky right-0 bg-white shadow-xs">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="上移順序"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === list.length - 1}
                              className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="下移順序"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateRow(idx)}
                              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                              title="複製此列"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleOneClickReset}
              className="px-3 py-2 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded border border-transparent hover:border-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>一鍵重置為初始示範資料</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleSafeClose}
                className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-5 sm:px-6 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white rounded-md text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>已成功儲存並同步！</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>儲存並同步全站</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </FocusEditModalWrapper>

      {/* Quick Avatar Edit Sub-Dialog */}
      {editingAvatarIndex !== null && list[editingAvatarIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-stone-300 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>更換「{list[editingAvatarIndex].name || '演職員'}」的照片</span>
              </h3>
              <button
                onClick={() => setEditingAvatarIndex(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500 shadow-md">
                <img
                  src={avatarInputUrl || list[editingAvatarIndex].image}
                  alt="預覽"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full space-y-2">
                <label className="block text-xs font-semibold text-stone-700">
                  相片網址 (URL)：
                </label>
                <input
                  type="text"
                  value={avatarInputUrl}
                  onChange={(e) => setAvatarInputUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="w-full text-center text-xs text-stone-400 my-1">
                ── 或從電腦上傳 ──
              </div>

              <label className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isCompressingAvatar ? '壓縮相片中...' : '選擇本地圖檔 (自動輕量壓縮)'}</span>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={isCompressingAvatar}
                  onChange={handleUploadAvatarFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingAvatarIndex(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded text-xs font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAvatarUrl}
                className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                確認套用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error-Proofing Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
