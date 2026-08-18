import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, Check, Camera, Sparkles, Eye, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RehearsalPhoto } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { checkStringEncoding, sanitizeObjectToUtf8 } from '../../utils/textEncoding';
import { EncodingWarningNotice } from '../common/EncodingWarningNotice';
import { FieldEditTip, PlaceholderNoticeCard } from '../common/FieldEditTip';

const KNOWN_REHEARSAL_PLACEHOLDER_TITLES = ['全體大合唱排練', '主要演員對手戲走位', '安喬拉與革命青年組', '音樂指導與聲樂分部練習', '道具與服裝初次定裝', '慈大演藝廳舞台燈光走位'];
const KNOWN_PLACEHOLDER_IMAGE_PREFIX = 'https://images.unsplash.com';

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
  const [formData, setFormData] = useState<RehearsalPhoto>(() => {
    return photo || {
      id: `r-${Date.now()}`,
      title: '',
      caption: '',
      date: new Date().toLocaleDateString('zh-TW').replace(/\//g, '.'),
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      category: 'rehearsal',
    };
  });

  const [imagePreview, setImagePreview] = useState<string>(formData.image);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  // Detection of unmodified prototype/placeholder values
  const placeholderAnalysis = useMemo(() => {
    const isImagePlaceholder = formData.image.startsWith(KNOWN_PLACEHOLDER_IMAGE_PREFIX);
    const isTitlePlaceholder = !formData.title.trim() || KNOWN_REHEARSAL_PLACEHOLDER_TITLES.includes(formData.title.trim());
    const isCaptionPlaceholder = !formData.caption?.trim() || formData.caption.includes('高二知足雙語班') || formData.caption.includes('排練紀錄說明');

    const unmodifiedFields: string[] = [];
    if (isImagePlaceholder) unmodifiedFields.push('排練相片 (目前為 Unsplash 網路圖)');
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
    }
  }, [photo]);

  // Helper to update state and trigger live preview in real time
  const updateFormData = (updated: RehearsalPhoto) => {
    setFormData(updated);
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  const handleAutoFixAllFields = () => {
    const fixed = sanitizeObjectToUtf8(formData);
    updateFormData(fixed);
  };

  const [isCompressing, setIsCompressing] = useState(false);

  // Process and compress photo file
  const processImageFile = async (file: File) => {
    try {
      setIsCompressing(true);
      // Rehearsal photos compressed to 1200 max width with high quality
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('請填寫照片標題');
      return;
    }
    // Force strict UTF-8 sanitization on all fields before saving
    const strictUtf8Photo = sanitizeObjectToUtf8(formData);
    onSave(strictUtf8Photo);
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-[#1a1a1c] border border-stone-700 rounded-sm shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#8c2d2d] font-sans text-xs tracking-widest font-bold uppercase">
              <Camera className="w-4 h-4 text-[#8c2d2d]" />
              <span>{photo ? '編輯排練照片與說明' : '新增現場排練照片'}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-[10px] font-sans font-bold animate-pulse">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>即時同步預覽</span>
            </span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-stone-400 hover:text-white rounded-full bg-stone-900 border border-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative placeholder notice */}
        <div className="p-3 bg-stone-900/90 border-l-2 border-amber-400 rounded-r text-[11px] text-stone-300 space-y-1">
          <div className="text-amber-300 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">📌 給老師與團隊的提示：</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>UTF-8 安全編碼檢測中</span>
            </span>
          </div>
          <p className="leading-relaxed">
            目前排練專區的照片為<strong>示範預覽佔位（Placeholder）</strong>。您可以上傳學校演藝廳、知足班教室或語言中心的實際排練側拍照，並編輯相應的排練心得與日期。
          </p>
        </div>

        {/* Real-time UTF-8 & Encoding Anomaly Warning Component */}
        <EncodingWarningNotice
          result={encodingCheck}
          onAutoFix={handleAutoFixAllFields}
          fieldName="排練相片紀錄表單"
        />

        {/* Prototype / Unmodified Placeholder Detection Notice */}
        <PlaceholderNoticeCard
          unmodifiedCount={placeholderAnalysis.unmodifiedCount}
          totalCheckable={3}
          fieldNames={placeholderAnalysis.unmodifiedFields}
        />

        {/* Live Preview Box inside Modal */}
        <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-sans text-stone-400">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>相片即時呈現效果 (Live Photo Preview)</span>
            </span>
            <span className="text-[10px] text-stone-500">輸入標題與網址即刻同步</span>
          </div>

          <div className="relative aspect-[16/9] w-full bg-stone-900 border border-stone-700 rounded overflow-hidden">
            <img
              src={imagePreview}
              alt="Live Photo Preview"
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-2 left-3 right-3 text-left space-y-0.5">
              <span className="text-[10px] text-stone-400 font-sans tracking-widest block">
                {formData.date || '日期'} • {(formData.category || 'REHEARSAL').toUpperCase()}
              </span>
              <h4 className="font-serif-tc text-sm font-semibold text-[#f5f5f4]">
                {formData.title || '照片標題未輸入'}
              </h4>
              <p className="text-[11px] text-stone-400 font-sans line-clamp-1">
                {formData.caption || '排練紀錄說明...'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo upload section */}
          <div className="space-y-3 p-4 bg-stone-900/80 border border-stone-800 rounded-sm">
            <div className="flex items-center justify-between">
              <FieldEditTip
                label="現場排練相片"
                sublabel="Rehearsal Photo"
                tip="支援電腦上傳或貼上相片網址，將自動高畫質輕量壓縮"
                isPlaceholder={placeholderAnalysis.isImagePlaceholder}
                isCustomized={!placeholderAnalysis.isImagePlaceholder}
                required
              />
              <div className="flex gap-2 text-[11px] font-sans">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'upload' ? 'bg-[#8c2d2d] text-white' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  電腦上傳相片
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'url' ? 'bg-[#8c2d2d] text-white' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  網址貼上
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {imageInputMode === 'upload' ? (
                <div className="space-y-2">
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex items-center justify-center gap-2 w-full p-3.5 border-2 border-dashed border-stone-700 hover:border-[#8c2d2d] bg-stone-950/60 hover:bg-stone-900 rounded-sm cursor-pointer text-xs font-sans text-stone-300 hover:text-white transition-all group"
                  >
                    {isCompressing ? (
                      <div className="flex items-center gap-2 text-amber-300">
                        <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                        <span>正在自動優化與壓縮高解析度照片中...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-[#8c2d2d] group-hover:scale-110 transition-transform" />
                        <span>點擊或拖曳學校演藝廳/排練現場照片至此 (自動最高規格壓縮)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-stone-500 font-sans">
                    ⚡ 自動優化 1080P/4K 高畫質現場相片，壓縮後載入極速且完全不佔據過多空間。
                  </p>
                </div>
              ) : (
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
              )}
            </div>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <FieldEditTip
                label="相片標題"
                tip="例如：演藝廳舞台燈光走位、主要演員對手戲"
                isPlaceholder={placeholderAnalysis.isTitlePlaceholder}
                isCustomized={!placeholderAnalysis.isTitlePlaceholder}
                required
              />
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => updateFormData({ ...formData, title: e.target.value })}
                placeholder="例如：演藝廳舞台燈光試演"
                className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <FieldEditTip
                  label="拍攝/紀錄日期"
                  tip="格式例如 2026.11.18"
                />
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
                  className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
                >
                  <option value="rehearsal">排練紀錄 (Rehearsal)</option>
                  <option value="stage">舞台現場 (Stage)</option>
                  <option value="script">劇本研讀 (Script)</option>
                  <option value="costume">服裝道具 (Costume)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <FieldEditTip
                label="排練照片敘述與花絮心得"
                tip="詳細記錄排練當天的趣味幕後花絮或團隊體會"
                isPlaceholder={placeholderAnalysis.isCaptionPlaceholder}
                isCustomized={!placeholderAnalysis.isCaptionPlaceholder}
              />
              <textarea
                rows={3}
                value={formData.caption}
                onChange={(e) => updateFormData({ ...formData, caption: e.target.value })}
                placeholder="紀錄同學在排練現場的點滴..."
                className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs rounded transition-colors"
            >
              取消並復原
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#8c2d2d] hover:bg-[#8c2d2d]/80 text-white font-bold text-xs rounded transition-colors flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>確認儲存相片紀錄</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>,
document.body
);
};
