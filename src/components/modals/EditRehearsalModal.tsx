import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  Check, 
  Camera, 
  Sparkles, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon, 
  History, 
  AlertTriangle,
  Calendar,
  Layers,
  Wand2
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { RehearsalPhoto } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { checkStringEncoding, sanitizeObjectToUtf8 } from '../../utils/textEncoding';
import { EncodingWarningNotice } from '../common/EncodingWarningNotice';
import { FieldEditTip, PlaceholderNoticeCard } from '../common/FieldEditTip';
import { FocusEditModalWrapper } from '../common/FocusEditModalWrapper';
import { REHEARSAL_TEMPLATES } from '../../data/castPresets';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ambientSynth } from '../../utils/audioSynth';

const KNOWN_REHEARSAL_PLACEHOLDER_TITLES = ['全體大合唱排練', '主要演員對手戲走位', '安喬拉與革命青年組', '音樂指導與聲樂分部練習', '道具與服裝初次定裝', '慈大演藝廳舞台燈光走位'];
const KNOWN_PLACEHOLDER_IMAGE_PREFIX = 'https://images.unsplash.com';

const CURATED_REHEARSAL_GALLERY = [
  { label: '大合唱齊唱', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  { label: '演員走位對詞', url: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80' },
  { label: '街壘道具舞台', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80' },
  { label: '演藝廳燈光現場', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80' },
  { label: '幕後化妝定裝', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80' },
  { label: '劇本歷史研討', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80' },
];

interface EditRehearsalModalProps {
  photo: RehearsalPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: RehearsalPhoto) => void;
  onLiveChange?: (photo: RehearsalPhoto) => void;
  onCancel?: () => void;
}

export const EditRehearsalModal: React.FC<EditRehearsalModalProps> = ({
  photo,
  isOpen,
  onClose,
  onSave,
  onLiveChange,
  onCancel,
}) => {
  const initialDataRef = useRef<RehearsalPhoto | null>(null);

  const [formData, setFormData] = useState<RehearsalPhoto>(() => {
    const initial: RehearsalPhoto = photo || {
      id: `r-${Date.now()}`,
      title: '',
      caption: '',
      date: new Date().toLocaleDateString('zh-TW').replace(/\//g, '.'),
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      category: 'rehearsal',
    };
    initialDataRef.current = JSON.parse(JSON.stringify(initial));
    return initial;
  });

  const [imagePreview, setImagePreview] = useState<string>(formData.image);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [savedDraft, setSavedDraft] = useState<RehearsalPhoto | null>(null);

  // Storage key for local draft persistence
  const draftStorageKey = useMemo(() => {
    return `tcsh_rehearsal_draft_${photo?.id || 'new'}`;
  }, [photo?.id]);

  // Check draft on mount or when photo changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = sessionStorage.getItem(draftStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as RehearsalPhoto;
        if (JSON.stringify(parsed) !== JSON.stringify(formData)) {
          setSavedDraft(parsed);
          setHasDraftNotice(true);
        }
      }
    } catch {
      // Ignore
    }
  }, [isOpen, draftStorageKey]);

  // Track if modified
  const isDirty = useMemo(() => {
    if (!initialDataRef.current) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  }, [formData]);

  // Detection of unmodified prototype/placeholder values
  const placeholderAnalysis = useMemo(() => {
    const isImagePlaceholder = formData.image.startsWith(KNOWN_PLACEHOLDER_IMAGE_PREFIX);
    const isTitlePlaceholder = !formData.title.trim() || KNOWN_REHEARSAL_PLACEHOLDER_TITLES.includes(formData.title.trim());
    const isCaptionPlaceholder = !formData.caption?.trim() || formData.caption.includes('高二知足雙語班') || formData.caption.includes('排練紀錄說明');

    const unmodifiedFields: string[] = [];
    if (isImagePlaceholder) unmodifiedFields.push('排練相片');
    if (isTitlePlaceholder) unmodifiedFields.push('相片標題');
    if (isCaptionPlaceholder) unmodifiedFields.push('排練紀錄說明');

    return {
      isImagePlaceholder,
      isTitlePlaceholder,
      isCaptionPlaceholder,
      unmodifiedCount: unmodifiedFields.length,
      unmodifiedFields,
    };
  }, [formData]);

  // Real-time UTF-8 and Encoding inspection
  const combinedTextForCheck = useMemo(() => {
    return [formData.title, formData.caption, formData.date].filter(Boolean).join(' ');
  }, [formData]);

  const encodingCheck = useMemo(() => {
    return checkStringEncoding(combinedTextForCheck);
  }, [combinedTextForCheck]);

  // Sync internal state if target photo prop changes
  useEffect(() => {
    if (photo) {
      setFormData(photo);
      setImagePreview(photo.image);
      setValidationError(null);
      initialDataRef.current = JSON.parse(JSON.stringify(photo));
    }
  }, [photo]);

  // Update state and trigger live preview
  const updateFormData = (updated: RehearsalPhoto) => {
    setFormData(updated);
    if (validationError) setValidationError(null);
    if (onLiveChange) {
      onLiveChange(updated);
    }
    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleRestoreDraft = () => {
    if (savedDraft) {
      updateFormData(savedDraft);
      setImagePreview(savedDraft.image);
      setHasDraftNotice(false);
      ambientSynth.playButtonClickSFX();
    }
  };

  const handleDiscardDraft = () => {
    setHasDraftNotice(false);
    setSavedDraft(null);
    try {
      sessionStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
  };

  const handleAutoFixAllFields = () => {
    const fixed = sanitizeObjectToUtf8(formData);
    updateFormData(fixed);
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save, Esc to handle safe close
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

  // Process and compress photo file
  const processImageFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 1200, 900, 0.82);
      setImagePreview(compressedBase64);
      const updated = { ...formData, image: compressedBase64 };
      updateFormData(updated);
    } catch (err) {
      console.error('Photo compression failed:', err);
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

  // Apply template
  const handleApplyTemplate = (tmpl: typeof REHEARSAL_TEMPLATES[0]) => {
    const updated = {
      ...formData,
      title: tmpl.title,
      caption: tmpl.caption,
      category: tmpl.category,
      image: tmpl.image,
    };
    setImagePreview(tmpl.image);
    updateFormData(updated);
    ambientSynth.playSuccessSFX();
  };

  const handleClearDemoPlaceholders = () => {
    updateFormData({
      ...formData,
      title: placeholderAnalysis.isTitlePlaceholder ? '' : formData.title,
      caption: placeholderAnalysis.isCaptionPlaceholder ? '' : formData.caption,
    });
  };

  const handleDirectSave = () => {
    if (!formData.title.trim()) {
      setValidationError('請輸入排練照片標題，以供觀眾了解活動場景。');
      return;
    }
    setValidationError(null);
    try {
      sessionStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
    const strictUtf8Photo = sanitizeObjectToUtf8(formData);
    ambientSynth.playSuccessSFX();
    onSave(strictUtf8Photo);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDirectSave();
  };

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
          title={photo ? '編輯排練照片與說明' : '新增現場排練照片'}
          maxWidthClass="max-w-xl"
        >
          <div className="p-4 sm:p-7 space-y-5 overflow-y-auto max-h-[85vh] text-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#8c2d2d] font-sans text-xs tracking-widest font-bold uppercase">
                  <Camera className="w-4 h-4 text-[#8c2d2d]" aria-hidden="true" />
                  <span id="edit-rehearsal-modal-title">{photo ? '編輯排練花絮紀錄' : '新增排練花絮紀錄'}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-sans font-bold">
                  <Sparkles className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  <span>即時同步預覽</span>
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
                  <span>表單內容尚未填寫完整：</span>
                </p>
                <p>{validationError}</p>
              </div>
            )}

            {/* Draft Found Notification */}
            {hasDraftNotice && (
              <div className="p-3 bg-amber-950/70 border border-amber-500/60 rounded-md flex items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>系統偵測到先前未儲存的暫存草稿。</span>
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

            {/* Rehearsal Scene Templates Selector */}
            <div className="p-3 bg-stone-900/90 border border-stone-800 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>排練情境範本一鍵套用 (Templates)：</span>
                </span>
                <span className="text-[10px] text-stone-400">點擊代入標題、類別與說明</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {REHEARSAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="p-2 text-left bg-stone-950 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-amber-200 group-hover:text-amber-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{tmpl.title}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{tmpl.caption}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Encoding Warning & Prototype Detection */}
            <EncodingWarningNotice
              result={encodingCheck}
              onAutoFix={handleAutoFixAllFields}
              fieldName="排練相片紀錄表單"
            />

            <div className="space-y-2">
              <PlaceholderNoticeCard
                unmodifiedCount={placeholderAnalysis.unmodifiedCount}
                totalCheckable={3}
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
                    <span>一鍵清空示範文字（直接輸入實際場景花絮）</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-stone-950/90 border border-stone-800 rounded space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>排練卡片即時預覽 (Live Card Preview)</span>
                </span>
                <span className="text-[10px] text-stone-500">修改輸入框即刻呈現在此</span>
              </div>

              <div className="bg-[#121214] p-3 border border-stone-800/80 rounded space-y-2">
                <div className="aspect-video w-full bg-stone-900 rounded overflow-hidden relative border border-stone-700">
                  <img
                    src={imagePreview}
                    alt="Live Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-stone-700 text-[10px] font-mono text-amber-300">
                    {formData.date || '2026.12.19'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif-tc text-sm font-bold text-[#f5f5f4]">
                      {formData.title || '尚未輸入相片標題'}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] text-stone-300 font-sans">
                      {formData.category}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-sans line-clamp-2">
                    {formData.caption || '排練紀錄說明與幕後花絮...'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Input Mode: Upload / URL / Curated Gallery */}
              <div className="space-y-3 p-4 bg-stone-900/80 border border-stone-800 rounded">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldEditTip
                    label="排練花絮相片"
                    sublabel="Rehearsal Photo"
                    tip="支援本機拖曳上傳 (自動高畫質壓縮)、貼上網址、或由精選排練庫選用"
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
                      <span>精選劇照庫</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  {imageInputMode === 'upload' && (
                    <div className="space-y-2">
                      <label
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-stone-700 hover:border-[#8c2d2d] bg-stone-950/60 hover:bg-stone-900 rounded cursor-pointer text-xs font-sans text-stone-300 hover:text-white transition-all group"
                      >
                        {isCompressing ? (
                          <div className="flex items-center gap-2 text-amber-300">
                            <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                            <span>正在自動輕量壓縮排練照片中...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-[#8c2d2d] group-hover:scale-110 transition-transform" />
                            <span>點擊或拖曳現場排練照片至此 (最高支援高解析度壓縮)</span>
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
                        ⚡ 自動輕量優化處理，避免瀏覽器儲存空間不足。
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
                      <div className="text-[11px] text-stone-400">點擊挑選精美劇照範本：</div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {CURATED_REHEARSAL_GALLERY.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImagePreview(item.url);
                              updateFormData({ ...formData, image: item.url });
                              ambientSynth.playButtonClickSFX();
                            }}
                            className={`group relative rounded overflow-hidden aspect-video border transition-all cursor-pointer ${
                              formData.image === item.url
                                ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                                : 'border-stone-800 hover:border-stone-500'
                            }`}
                          >
                            <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-stone-200 truncate px-1 text-center">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="相片標題"
                      tip="例如：演藝廳舞台燈光走位、主要演員對手戲"
                      isPlaceholder={placeholderAnalysis.isTitlePlaceholder}
                      isCustomized={!placeholderAnalysis.isTitlePlaceholder}
                      required
                    />
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formData.title.length} 字
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => updateFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：演藝廳舞台燈光試演"
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FieldEditTip
                        label="拍攝/紀錄日期"
                        tip="格式例如 2026.11.18"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toLocaleDateString('zh-TW').replace(/\//g, '.');
                          updateFormData({ ...formData, date: today });
                        }}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        設為今日
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => updateFormData({ ...formData, date: e.target.value })}
                      placeholder="2026.11.18"
                      className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldEditTip
                      label="排練專區分類"
                      tip="選擇排練活動所屬類別"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) => updateFormData({ ...formData, category: e.target.value as any })}
                      className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none cursor-pointer"
                    >
                      <option value="rehearsal">排練紀錄 (Rehearsal)</option>
                      <option value="stage">舞台現場 (Stage)</option>
                      <option value="script">劇本研讀 (Script)</option>
                      <option value="costume">服裝道具 (Costume)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FieldEditTip
                      label="排練照片敘述與花絮心得"
                      tip="詳細記錄排練當天的趣味幕後花絮或團隊體會"
                      isPlaceholder={placeholderAnalysis.isCaptionPlaceholder}
                      isCustomized={!placeholderAnalysis.isCaptionPlaceholder}
                    />
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formData.caption.length} 字 (建議 20-120 字)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.caption}
                    onChange={(e) => updateFormData({ ...formData, caption: e.target.value })}
                    placeholder="紀錄同學在排練現場的點滴..."
                    className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
                <div className="text-[11px] text-stone-500 font-mono hidden sm:flex items-center gap-2">
                  <span>快捷鍵：Ctrl+S / ⌘S 儲存 • Esc 退出</span>
                  {isDirty && <span className="text-amber-400 font-sans">• 未儲存修改</span>}
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
                    <span>確認儲存相片紀錄</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Unsaved Changes Confirmation Dialog */}
          <ConfirmDialog
            isOpen={isDiscardConfirmOpen}
            title="您有尚未儲存的排練紀錄"
            message="您剛才所做的排練照片修改尚未存檔。確定要捨棄變更並退出嗎？"
            confirmLabel="放棄修改並退出"
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
