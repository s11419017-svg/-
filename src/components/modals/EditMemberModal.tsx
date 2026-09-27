import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  Check, 
  User, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon, 
  Wand2, 
  RotateCcw, 
  AlertTriangle,
  History,
  BookOpen,
  Quote,
  Music
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { CastMember } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { checkStringEncoding, sanitizeObjectToUtf8 } from '../../utils/textEncoding';
import { EncodingWarningNotice } from '../common/EncodingWarningNotice';
import { FieldEditTip, PlaceholderNoticeCard } from '../common/FieldEditTip';
import { FocusEditModalWrapper } from '../common/FocusEditModalWrapper';
import { CHARACTER_PRESETS, CharacterPreset } from '../../data/castPresets';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ambientSynth } from '../../utils/audioSynth';

// Known initial demo placeholder values to assist users in detecting unmodified templates
const KNOWN_PLACEHOLDER_NAMES = ['游承翰', '陳奕霖', '林芷安', '張佑廷', '黃品睿', '許雅筑', '廖冠宇', '簡廷修', '知足班全體同學', '高二知足班劇組'];
const KNOWN_PLACEHOLDER_IMAGE_PREFIX = 'https://images.unsplash.com';

interface EditMemberModalProps {
  member: CastMember | null; // Null if adding new
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: CastMember) => void;
  onLiveChange?: (member: CastMember) => void;
  onCancel?: () => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
  onLiveChange,
  onCancel,
}) => {
  const initialDataRef = useRef<CastMember | null>(null);

  const [formData, setFormData] = useState<CastMember>(() => {
    const initial = member || {
      id: `cast-${Date.now()}`,
      name: '',
      classYear: '高二知足班',
      roleName: '',
      roleNameEn: '',
      category: 'principal',
      quote: '',
      reflection: '',
      characterBio: '',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      spokenLine: '',
      favoriteQuote: '',
    };
    initialDataRef.current = JSON.parse(JSON.stringify(initial));
    return initial;
  });

  const [imagePreview, setImagePreview] = useState<string>(formData.image);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [selectedPreset, setSelectedPreset] = useState<CharacterPreset | null>(null);
  const [showPresetDetail, setShowPresetDetail] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [savedDraft, setSavedDraft] = useState<CastMember | null>(null);

  // Unsaved changes confirmation dialog state
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Storage key for local draft persistence
  const draftStorageKey = useMemo(() => {
    return `tcsh_cast_draft_${member?.id || 'new'}`;
  }, [member?.id]);

  // Check draft on mount or when member changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = sessionStorage.getItem(draftStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CastMember;
        if (JSON.stringify(parsed) !== JSON.stringify(formData)) {
          setSavedDraft(parsed);
          setHasDraftNotice(true);
        }
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, [isOpen, draftStorageKey]);

  // Track if user has modified anything compared to opening state
  const isDirty = useMemo(() => {
    if (!initialDataRef.current) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  }, [formData]);

  // Detection of unmodified prototype/placeholder values
  const placeholderAnalysis = useMemo(() => {
    const isImagePlaceholder = formData.image.startsWith(KNOWN_PLACEHOLDER_IMAGE_PREFIX);
    const isNamePlaceholder = !formData.name.trim() || KNOWN_PLACEHOLDER_NAMES.includes(formData.name.trim());
    const isQuotePlaceholder = !formData.quote.trim() || formData.quote.includes('三十遍') || formData.quote.includes('真心告白');
    const isReflectionPlaceholder = !formData.reflection?.trim() || formData.reflection.includes('詮釋尚萬強從苦役犯') || formData.reflection.includes('收穫與感動');
    const isSpokenLinePlaceholder = Boolean(formData.spokenLine?.includes('二十年來') || formData.spokenLine?.includes('示範') || (formData.spokenLine && formData.spokenLine.length > 5 && !formData.name.trim()));

    const unmodifiedFields: string[] = [];
    if (isImagePlaceholder) unmodifiedFields.push('示範頭像照片');
    if (isNamePlaceholder) unmodifiedFields.push('學生真實姓名');
    if (isQuotePlaceholder) unmodifiedFields.push('座右銘/真心告白');
    if (isReflectionPlaceholder) unmodifiedFields.push('排練心得感想');
    if (isSpokenLinePlaceholder) unmodifiedFields.push('英文試聽口白');

    return {
      isImagePlaceholder,
      isNamePlaceholder,
      isQuotePlaceholder,
      isReflectionPlaceholder,
      isSpokenLinePlaceholder,
      unmodifiedCount: unmodifiedFields.length,
      unmodifiedFields,
    };
  }, [formData]);

  // Real-time UTF-8 and Encoding inspection
  const combinedTextForCheck = useMemo(() => {
    return [
      formData.name,
      formData.roleName,
      formData.roleNameEn,
      formData.quote,
      formData.reflection,
      formData.characterBio,
      formData.spokenLine,
      formData.favoriteQuote,
    ].filter(Boolean).join(' ');
  }, [formData]);

  const encodingCheck = useMemo(() => {
    return checkStringEncoding(combinedTextForCheck);
  }, [combinedTextForCheck]);

  // Sync internal state if target member prop changes
  useEffect(() => {
    if (member) {
      setFormData(member);
      setImagePreview(member.image);
      setValidationError(null);
      initialDataRef.current = JSON.parse(JSON.stringify(member));
    }
  }, [member]);

  // Update form data and save to session draft
  const updateFormData = (updated: CastMember) => {
    setFormData(updated);
    if (validationError) setValidationError(null);
    if (onLiveChange) {
      onLiveChange(updated);
    }
    // Autosave draft to session
    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Restore draft
  const handleRestoreDraft = () => {
    if (savedDraft) {
      updateFormData(savedDraft);
      setImagePreview(savedDraft.image);
      setHasDraftNotice(false);
      ambientSynth.playButtonClickSFX();
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    setHasDraftNotice(false);
    setSavedDraft(null);
    try {
      sessionStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
  };

  // One-click Auto Fix all fields to strict UTF-8
  const handleAutoFixAllFields = () => {
    const fixed = sanitizeObjectToUtf8(formData);
    updateFormData(fixed);
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save, Esc to handle cancel with unsaved guard
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDirectSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, isDirty]);

  // Quick select preset character
  const handleSelectPreset = (preset: CharacterPreset) => {
    setSelectedPreset(preset);
    setShowPresetDetail(true);
  };

  // Apply complete preset (role, english, quotes, bio, avatar) keeping student name intact
  const handleApplyFullPreset = (preset: CharacterPreset) => {
    const updated: CastMember = {
      ...formData,
      roleName: preset.roleName,
      roleNameEn: preset.roleNameEn,
      category: preset.category,
      characterBio: preset.characterBio,
      quote: preset.classicQuote,
      spokenLine: preset.spokenLine,
      favoriteQuote: preset.vocalPart,
      image: preset.defaultImage,
    };
    setImagePreview(preset.defaultImage);
    updateFormData(updated);
    setShowPresetDetail(false);
    ambientSynth.playSuccessSFX();
  };

  // Apply only role and bio
  const handleApplyRoleAndBioOnly = (preset: CharacterPreset) => {
    const updated: CastMember = {
      ...formData,
      roleName: preset.roleName,
      roleNameEn: preset.roleNameEn,
      category: preset.category,
      characterBio: preset.characterBio,
    };
    updateFormData(updated);
    setShowPresetDetail(false);
    ambientSynth.playButtonClickSFX();
  };

  // Apply only quotes and spoken lines
  const handleApplyQuotesOnly = (preset: CharacterPreset) => {
    const updated: CastMember = {
      ...formData,
      quote: preset.classicQuote,
      spokenLine: preset.spokenLine,
    };
    updateFormData(updated);
    setShowPresetDetail(false);
    ambientSynth.playButtonClickSFX();
  };

  // Apply reflection starter template
  const handleApplyReflectionStarter = (preset: CharacterPreset) => {
    const updated: CastMember = {
      ...formData,
      reflection: preset.reflectionStarter,
    };
    updateFormData(updated);
    setShowPresetDetail(false);
    ambientSynth.playButtonClickSFX();
  };

  // Typographic quotation fixer: turns "" or '' into 「」 and clears excess whitespace
  const handleFormatQuoteTypography = () => {
    let clean = formData.quote.trim();
    // Replace outer quotes if present
    clean = clean.replace(/^["'“”]/, '「').replace(/["'“”]$/, '」');
    if (!clean.startsWith('「') && !clean.startsWith('『')) {
      clean = `「${clean}」`;
    }
    updateFormData({ ...formData, quote: clean });
    ambientSynth.playButtonClickSFX();
  };

  const handleClearDemoPlaceholders = () => {
    const updated = {
      ...formData,
      quote: placeholderAnalysis.isQuotePlaceholder ? '' : formData.quote,
      reflection: placeholderAnalysis.isReflectionPlaceholder ? '' : formData.reflection,
      spokenLine: placeholderAnalysis.isSpokenLinePlaceholder ? '' : formData.spokenLine,
    };
    updateFormData(updated);
  };

  // Process and compressed image file
  const processImageFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 800, 800, 0.85);
      setImagePreview(compressedBase64);
      const updated = { ...formData, image: compressedBase64 };
      updateFormData(updated);
    } catch (err) {
      console.error('Image compression failed:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        updateFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // Safe direct save logic
  const handleDirectSave = () => {
    if (!formData.name.trim() || !formData.roleName.trim()) {
      setValidationError('請填寫學生姓名與角色中文名稱，以便觀眾辨識演職人員。');
      return;
    }
    setValidationError(null);
    const strictUtf8Member = sanitizeObjectToUtf8(formData);
    // Clear draft on successful save
    try {
      sessionStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
    ambientSynth.playSuccessSFX();
    onSave(strictUtf8Member);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDirectSave();
  };

  // Guard closing with unsaved changes confirmation
  const handleSafeClose = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
    } else {
      handleFinalCancel();
    }
  };

  const handleFinalCancel = () => {
    setIsDiscardConfirmOpen(false);
    setValidationError(null);
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <FocusEditModalWrapper
          isOpen={isOpen}
          onClose={handleSafeClose}
          title={member ? '編輯同學與角色資料' : '新增演職人員資料'}
        >
          <div className="p-4 sm:p-7 space-y-5 overflow-y-auto max-h-[85vh] text-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#8c2d2d] font-sans text-xs tracking-widest font-bold uppercase">
                  <User className="w-4 h-4 text-[#8c2d2d]" aria-hidden="true" />
                  <span id="edit-member-dialog-title">{member ? '編輯演職人員資料' : '新增演職人員資料'}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-sans font-bold">
                  <Sparkles className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  <span>即時預覽同步</span>
                </span>
              </div>
              <button
                onClick={handleSafeClose}
                aria-label="關閉視窗 (Esc)"
                className="p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900 border border-stone-800 focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div role="alert" className="p-3 bg-red-950/80 border border-red-500 rounded text-red-200 text-xs font-sans space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>表單資料尚未完整：</span>
                </p>
                <p>{validationError}</p>
              </div>
            )}

            {/* Draft Found Notification */}
            {hasDraftNotice && (
              <div className="p-3 bg-amber-950/70 border border-amber-500/60 rounded-md flex items-center justify-between gap-3 text-xs text-amber-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>系統偵測到此條目先前編輯但未儲存的暫存草稿。</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
                  >
                    還原草稿
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-2 py-1 text-stone-400 hover:text-stone-200 text-[11px] transition-colors cursor-pointer"
                  >
                    捨棄
                  </button>
                </div>
              </div>
            )}

            {/* Smart Character Preset Bar */}
            <div className="space-y-2 p-3 bg-stone-900/90 border border-stone-800 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>《悲慘世界》角色智慧帶入庫 (1-Click Presets)</span>
                </span>
                <span className="text-[10px] text-stone-400">點擊快速代入角色設定、名言與定裝</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CHARACTER_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id || formData.roleName === preset.roleName;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded text-xs border transition-all cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                        isSelected
                          ? 'bg-[#8c2d2d] text-white border-amber-400 font-bold shadow-md'
                          : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                      }`}
                    >
                      <span>{preset.roleName}</span>
                      <span className="text-[10px] opacity-70 font-mono">({preset.roleNameEn})</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Preset Details & Action Drawer */}
              {showPresetDetail && selectedPreset && (
                <div className="mt-3 p-3 bg-stone-950 border border-amber-500/40 rounded-md space-y-3 animate-fadeIn">
                  <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-amber-200 font-serif-tc">{selectedPreset.roleName}</span>
                        <span className="text-xs text-stone-400 font-cinzel">{selectedPreset.roleNameEn}</span>
                        <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] text-amber-300 font-mono">
                          {selectedPreset.vocalPart}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">{selectedPreset.characterBio}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPresetDetail(false)}
                      className="text-stone-500 hover:text-stone-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyFullPreset(selectedPreset)}
                      className="px-3 py-1.5 bg-[#8c2d2d] hover:bg-[#a63535] text-white font-bold rounded flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>一鍵完整套用 (含自白、台詞、劇本簡介與肖像)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRoleAndBioOnly(selectedPreset)}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 border border-stone-700 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                      <span>僅套用角色名與簡介</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuotesOnly(selectedPreset)}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 border border-stone-700 cursor-pointer"
                    >
                      <Quote className="w-3.5 h-3.5 text-stone-400" />
                      <span>僅套用經典名言與口白</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyReflectionStarter(selectedPreset)}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded flex items-center gap-1 border border-amber-900/60 cursor-pointer"
                    >
                      <span>帶入心得感想範本</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Encoding Warning & Prototype Detection */}
            <EncodingWarningNotice
              result={encodingCheck}
              onAutoFix={handleAutoFixAllFields}
              fieldName="演職員資料表單"
            />

            <div className="space-y-2">
              <PlaceholderNoticeCard
                unmodifiedCount={placeholderAnalysis.unmodifiedCount}
                totalCheckable={5}
                fieldNames={placeholderAnalysis.unmodifiedFields}
              />
              {placeholderAnalysis.unmodifiedCount > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearDemoPlaceholders}
                    className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-600/40 rounded text-[11px] font-sans transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>一鍵清空示範文字（直接輸入真實感言）</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-stone-950/90 border border-stone-800 rounded space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>卡片即時呈現效果 (Live Card Preview)</span>
                </span>
                <span className="text-[10px] text-stone-500">修改輸入框即刻同步呈現於此與網頁背景</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 items-center bg-[#121214] p-3 border border-stone-800/80 rounded">
                <div className="w-20 h-24 shrink-0 bg-stone-900 rounded overflow-hidden relative border border-stone-700">
                  <img
                    src={imagePreview}
                    alt="Live Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans text-[#8c2d2d] uppercase tracking-widest font-bold">
                      {formData.classYear || '高二知足班'}
                    </span>
                    <span className="text-stone-600">•</span>
                    <span className="text-[11px] text-amber-200 font-serif-tc font-bold">
                      {formData.roleNameEn || 'Role English'} ({formData.roleName || '角色中文'})
                    </span>
                  </div>
                  <h4 className="font-serif-tc text-base font-bold text-[#f5f5f4]">
                    {formData.name || '同學姓名未輸入'}
                  </h4>
                  <p className="text-xs text-stone-400 font-serif-tc italic line-clamp-1">
                    {formData.quote || '演職人員真心告白與準備對口白...'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Input Mode: Upload / URL / Theatrical Preset Gallery */}
              <div className="space-y-3 p-4 bg-stone-900/80 border border-stone-800 rounded">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldEditTip
                    label="同學個人肖像照"
                    sublabel="Photo"
                    tip="支援本機上傳自動輕量壓縮、貼上網路網址、或由《悲慘世界》預設肖像庫中任選"
                    isPlaceholder={placeholderAnalysis.isImagePlaceholder}
                    isCustomized={!placeholderAnalysis.isImagePlaceholder}
                    required
                  />
                  <div className="flex gap-1.5 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        imageInputMode === 'upload'
                          ? 'bg-[#8c2d2d] text-white font-bold'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      電腦上傳照片
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        imageInputMode === 'url'
                          ? 'bg-[#8c2d2d] text-white font-bold'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      網路圖片網址
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('preset')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                        imageInputMode === 'preset'
                          ? 'bg-[#8c2d2d] text-white font-bold'
                          : 'bg-stone-800 text-amber-300 hover:text-amber-200'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>劇組肖像庫</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Thumbnail */}
                  <div className="w-24 h-28 shrink-0 bg-stone-950 border border-stone-700 rounded overflow-hidden relative shadow-inner">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {imageInputMode === 'upload' && (
                      <div className="space-y-2">
                        <label
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className="flex items-center justify-center gap-2 w-full p-3.5 border-2 border-dashed border-stone-700 hover:border-[#8c2d2d] bg-stone-950/60 hover:bg-stone-900 rounded cursor-pointer text-xs font-sans text-stone-300 hover:text-white transition-all group"
                        >
                          {isCompressing ? (
                            <div className="flex items-center gap-2 text-amber-300">
                              <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                              <span>正在自動優化與壓縮照片中...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-[#8c2d2d] group-hover:scale-110 transition-transform" />
                              <span>點擊或拖曳同學照片至此 (自動最高規格壓縮)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-stone-500 font-sans">
                          ⚡ 上傳相片將經過 HTML5 Canvas 自動高畫質輕量壓縮 (壓縮率高達 90%)，完全避免 LocalStorage 容量爆滿問題。
                        </p>
                      </div>
                    )}

                    {imageInputMode === 'url' && (
                      <div>
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => {
                            const url = e.target.value;
                            setImagePreview(url);
                            updateFormData({ ...formData, image: url });
                          }}
                          placeholder="請貼上照片網址 https://..."
                          className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                        />
                      </div>
                    )}

                    {imageInputMode === 'preset' && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-stone-400">點選即可快速套用經典角色定裝寫真：</div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-stone-950/80 rounded border border-stone-800">
                          {CHARACTER_PRESETS.flatMap(p => p.avatarOptions).map((opt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setImagePreview(opt.url);
                                updateFormData({ ...formData, image: opt.url });
                                ambientSynth.playButtonClickSFX();
                              }}
                              className={`group relative rounded overflow-hidden aspect-square border transition-all cursor-pointer ${
                                formData.image === opt.url
                                  ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                                  : 'border-stone-800 hover:border-stone-500'
                              }`}
                              title={opt.label}
                            >
                              <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                              <span className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-stone-200 truncate px-1 text-center">
                                {opt.label.split(' ')[0]}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="同學真實姓名"
                      tip="請輸入參與公演的知足班同學全名"
                      isPlaceholder={placeholderAnalysis.isNamePlaceholder}
                      isCustomized={!placeholderAnalysis.isNamePlaceholder}
                      required
                    />
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formData.name.length} 字
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：游承翰"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <FieldEditTip
                    label="班級 / 團隊身分"
                    tip="預設為「高二知足班」，亦可填寫導演組/舞台組等"
                    isCustomized={Boolean(formData.classYear)}
                  />
                  <input
                    type="text"
                    value={formData.classYear}
                    onChange={(e) => updateFormData({ ...formData, classYear: e.target.value })}
                    placeholder="例如：高二知足班"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <FieldEditTip
                    label="角色中文名稱"
                    sublabel="Role Zh"
                    tip="劇本中文譯名，例如 尚萬強、芳婷、珂賽特"
                    required
                  />
                  <input
                    type="text"
                    required
                    value={formData.roleName}
                    onChange={(e) => updateFormData({ ...formData, roleName: e.target.value })}
                    placeholder="例如：尚萬強"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>

                <div className="space-y-1">
                  <FieldEditTip
                    label="角色英文名稱"
                    sublabel="Role En"
                    tip="劇本對應之英文角色名，例如 Jean Valjean、Javert"
                    required
                  />
                  <input
                    type="text"
                    required
                    value={formData.roleNameEn}
                    onChange={(e) => updateFormData({ ...formData, roleNameEn: e.target.value })}
                    placeholder="例如：Jean Valjean"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-cinzel"
                  />
                </div>

                <div className="space-y-1">
                  <FieldEditTip
                    label="團隊分類群組"
                    tip="決定在演職人員卡片區的分頁分類"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none cursor-pointer"
                  >
                    <option value="principal">主要演員 (Principals)</option>
                    <option value="ensemble">歌隊 / 合唱群 (Ensemble)</option>
                    <option value="crew">幕後團隊 / 導演 (Crew)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <FieldEditTip
                    label="代表曲目 / 聲部"
                    sublabel="Favorite Song / Part"
                    tip="該角色最知名歌曲或演唱聲部（如：男高音、女中音）"
                  />
                  <input
                    type="text"
                    value={formData.favoriteQuote || ''}
                    onChange={(e) => updateFormData({ ...formData, favoriteQuote: e.target.value })}
                    placeholder="例如：Bring Him Home 或 男高音"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <FieldEditTip
                    label="試聽英文口白"
                    sublabel="Spoken Line"
                    tip="卡片上供觀眾點擊試聽發音的經典英文對白語句"
                  />
                  <input
                    type="text"
                    value={formData.spokenLine || ''}
                    onChange={(e) => updateFormData({ ...formData, spokenLine: e.target.value })}
                    placeholder="例如：To love another person is to see the face of God."
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                  />
                </div>
              </div>

              {/* Text Areas Section with Character Counters */}
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="演職真心告白"
                      sublabel="一至兩句話"
                      tip="顯示於首頁卡片正面的座右銘或練習金句"
                      isPlaceholder={placeholderAnalysis.isQuotePlaceholder}
                      isCustomized={!placeholderAnalysis.isQuotePlaceholder}
                      required
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleFormatQuoteTypography}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        title="將引號轉為標準戲劇引號「」並清理空格"
                      >
                        <Quote className="w-3 h-3" />
                        <span>套用標準引號「」</span>
                      </button>
                      <span className={`text-[10px] font-mono ${formData.quote.length > 80 ? 'text-amber-400' : 'text-stone-500'}`}>
                        {formData.quote.length} 字 (建議 20-80 字)
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.quote}
                    onChange={(e) => updateFormData({ ...formData, quote: e.target.value })}
                    placeholder="例如：「背這句台詞我們在語言教室練了三十遍...」"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="角色劇本設定描述"
                      tip="向觀眾介紹劇中這個角色的性格背景與心路歷程"
                      isCustomized={Boolean(formData.characterBio)}
                    />
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formData.characterBio.length} 字
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.characterBio}
                    onChange={(e) => updateFormData({ ...formData, characterBio: e.target.value })}
                    placeholder="介紹劇中這個角色的個性或故事概要..."
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="知足班排練心得感想"
                      sublabel="詳細專屬彈窗中展示"
                      tip="記錄同學從讀本、排戲、發音矯正到舞台演繹的真實心得"
                      isPlaceholder={placeholderAnalysis.isReflectionPlaceholder}
                      isCustomized={!placeholderAnalysis.isReflectionPlaceholder}
                    />
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formData.reflection.length} 字 (建議 60-250 字)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.reflection}
                    onChange={(e) => updateFormData({ ...formData, reflection: e.target.value })}
                    placeholder="例如：從過稿、英語音節矯正到舞台合唱過程中的收穫與感動..."
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
                <div className="text-[11px] text-stone-500 font-mono hidden sm:flex items-center gap-2">
                  <span>快捷鍵：Ctrl+S / ⌘S 儲存 • Esc 安全退出</span>
                  {isDirty && (
                    <span className="text-amber-400 font-sans">• 編輯中 (未儲存)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={handleSafeClose}
                    className="px-4 py-2 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs rounded transition-colors cursor-pointer touch-manipulation"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#8c2d2d] hover:bg-[#a63535] text-white font-bold text-xs rounded transition-colors flex items-center gap-2 shadow-lg cursor-pointer touch-manipulation"
                  >
                    <Check className="w-4 h-4" />
                    <span>確認儲存變更</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Unsaved Changes Confirmation Dialog */}
          <ConfirmDialog
            isOpen={isDiscardConfirmOpen}
            title="您有尚未儲存的修改內容"
            message="您剛才所做的編輯尚未存檔。若現在退出，這些修改將會遺失（但已暫存至本地瀏覽器）。確定要放棄變更嗎？"
            confirmLabel="放棄變更並退出"
            cancelLabel="繼續編輯"
            variant="warning"
            onConfirm={handleFinalCancel}
            onCancel={() => setIsDiscardConfirmOpen(false)}
          />
        </FocusEditModalWrapper>
      )}
    </AnimatePresence>,
    document.body
  );
};
