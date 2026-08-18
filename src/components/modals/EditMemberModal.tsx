import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, Check, User, Sparkles, Eye, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CastMember } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { checkStringEncoding, sanitizeObjectToUtf8 } from '../../utils/textEncoding';
import { EncodingWarningNotice } from '../common/EncodingWarningNotice';
import { FieldEditTip, PlaceholderNoticeCard } from '../common/FieldEditTip';

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
  const [formData, setFormData] = useState<CastMember>(() => {
    return member || {
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
  });

  const [imagePreview, setImagePreview] = useState<string>(formData.image);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  // Detection of unmodified prototype/placeholder values
  const placeholderAnalysis = useMemo(() => {
    const isImagePlaceholder = formData.image.startsWith(KNOWN_PLACEHOLDER_IMAGE_PREFIX);
    const isNamePlaceholder = !formData.name.trim() || KNOWN_PLACEHOLDER_NAMES.includes(formData.name.trim());
    const isQuotePlaceholder = !formData.quote.trim() || formData.quote.includes('三十遍') || formData.quote.includes('真心告白');
    const isReflectionPlaceholder = !formData.reflection?.trim() || formData.reflection.includes('詮釋尚萬強從苦役犯') || formData.reflection.includes('收穫與感動');

    const unmodifiedFields: string[] = [];
    if (isImagePlaceholder) unmodifiedFields.push('同學照片 (目前為 Unsplash 示範圖)');
    if (isNamePlaceholder) unmodifiedFields.push('同學真實姓名');
    if (isQuotePlaceholder) unmodifiedFields.push('演職真心告白');
    if (isReflectionPlaceholder) unmodifiedFields.push('排練心得感想');

    return {
      isImagePlaceholder,
      isNamePlaceholder,
      isQuotePlaceholder,
      isReflectionPlaceholder,
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
    }
  }, [member]);

  // Helper to update state and trigger live preview in real time
  const updateFormData = (updated: CastMember) => {
    setFormData(updated);
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  // One-click Auto Fix all fields to strict UTF-8
  const handleAutoFixAllFields = () => {
    const fixed = sanitizeObjectToUtf8(formData);
    updateFormData(fixed);
  };

  const [isCompressing, setIsCompressing] = useState(false);

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
      // Fallback read
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

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.roleName.trim()) {
      alert('請填寫學生姓名與角色名稱');
      return;
    }
    // Force strict UTF-8 sanitization on all fields before saving
    const strictUtf8Member = sanitizeObjectToUtf8(formData);
    onSave(strictUtf8Member);
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
            className="relative w-full max-w-3xl bg-[#1a1a1c] border border-stone-700 rounded-sm shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#8c2d2d] font-sans text-xs tracking-widest font-bold uppercase">
              <User className="w-4 h-4 text-[#8c2d2d]" />
              <span>{member ? '編輯同學與角色資料' : '新增演職人員資料'}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-[10px] font-sans font-bold animate-pulse">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>背景畫面即時預覽中</span>
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
            <span className="flex items-center gap-1.5">📌 給老師、導演與同學們的提示：</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>UTF-8 編碼安全防護中</span>
            </span>
          </div>
          <p className="leading-relaxed">
            目前預設的肖像照、感言與台詞皆為<strong>示範用排版佔位符號（Placeholder）</strong>。您可以放心直接填寫本班同學的真實姓名、心得與上傳個人照片，隨時可按「儲存資料」確認更新。
          </p>
        </div>

        {/* Real-time UTF-8 & Encoding Anomaly Warning Component */}
        <EncodingWarningNotice
          result={encodingCheck}
          onAutoFix={handleAutoFixAllFields}
          fieldName="演職員資料表單"
        />

        {/* Prototype / Unmodified Placeholder Detection Notice */}
        <PlaceholderNoticeCard
          unmodifiedCount={placeholderAnalysis.unmodifiedCount}
          totalCheckable={4}
          fieldNames={placeholderAnalysis.unmodifiedFields}
        />

        {/* Live Preview Card Box inside Modal */}
        <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-sans text-stone-400">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>卡片即時呈現效果 (Live Card Preview)</span>
            </span>
            <span className="text-[10px] text-stone-500">修改輸入框即刻同步呈現於此與背景網頁</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#121214] p-3 border border-stone-800/80 rounded">
            <div className="w-20 h-24 shrink-0 bg-stone-900 rounded overflow-hidden relative border border-stone-700">
              <img
                src={imagePreview}
                alt="Live Preview"
                className="w-full h-full object-cover grayscale contrast-110"
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
                「{formData.quote || '演職人員真心告白與準備對口白...'}」
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload / URL Section */}
          <div className="space-y-3 p-4 bg-stone-900/80 border border-stone-800 rounded-sm">
            <div className="flex items-center justify-between">
              <FieldEditTip
                label="同學個人肖像照"
                sublabel="Photo"
                tip="支援電腦上傳與相片自動壓縮，或貼上網路圖片網址"
                isPlaceholder={placeholderAnalysis.isImagePlaceholder}
                isCustomized={!placeholderAnalysis.isImagePlaceholder}
                required
              />
              <div className="flex gap-2 text-[11px] font-sans">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-[#8c2d2d] text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  電腦上傳照片
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-[#8c2d2d] text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  網路圖片網址
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Thumbnail */}
              <div className="w-24 h-28 shrink-0 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover grayscale contrast-110"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
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
                ) : (
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
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <FieldEditTip
                label="同學真實姓名"
                tip="請輸入參與公演的知足班同學全名"
                isPlaceholder={placeholderAnalysis.isNamePlaceholder}
                isCustomized={!placeholderAnalysis.isNamePlaceholder}
                required
              />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateFormData({ ...formData, name: e.target.value })}
                placeholder="例如：王小明"
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
                label="團隊分類群組"
                tip="決定在演職人員卡片區的分頁分類"
              />
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none"
              >
                <option value="principal">主要演員 (Principals)</option>
                <option value="ensemble">歌隊 / 合唱群 (Ensemble)</option>
                <option value="crew">幕後團隊 / 導演 (Crew)</option>
              </select>
            </div>

            <div className="space-y-1">
              <FieldEditTip
                label="代表曲目 / 經典歌名"
                sublabel="Favorite Song"
                tip="該角色最知名或最喜愛的音樂劇詠嘆調"
              />
              <input
                type="text"
                value={formData.favoriteQuote || ''}
                onChange={(e) => updateFormData({ ...formData, favoriteQuote: e.target.value })}
                placeholder="例如：Bring Him Home / On My Own"
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

          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <FieldEditTip
                label="演職真心告白"
                sublabel="一至兩句話"
                tip="顯示於首頁卡片正面的座右銘或練習金句"
                isPlaceholder={placeholderAnalysis.isQuotePlaceholder}
                isCustomized={!placeholderAnalysis.isQuotePlaceholder}
                required
              />
              <textarea
                rows={2}
                value={formData.quote}
                onChange={(e) => updateFormData({ ...formData, quote: e.target.value })}
                placeholder="例如：背這句台詞我們在語言教室練了三十遍..."
                className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
              />
            </div>

            <div className="space-y-1">
              <FieldEditTip
                label="角色劇本設定描述"
                tip="向觀眾介紹劇中這個角色的性格背景與心路歷程"
                isCustomized={Boolean(formData.characterBio)}
              />
              <textarea
                rows={2}
                value={formData.characterBio}
                onChange={(e) => updateFormData({ ...formData, characterBio: e.target.value })}
                placeholder="介紹劇中這個角色的個性或故事概要..."
                className="w-full bg-[#121214] border border-stone-800 rounded px-3 py-2 text-stone-200 focus:border-[#8c2d2d] focus:outline-none font-serif-tc"
              />
            </div>

            <div className="space-y-1">
              <FieldEditTip
                label="知足班排練心得感想"
                sublabel="詳細專屬彈窗中展示"
                tip="記錄同學從讀本、排戲、發音矯正到舞台演繹的真實心得"
                isPlaceholder={placeholderAnalysis.isReflectionPlaceholder}
                isCustomized={!placeholderAnalysis.isReflectionPlaceholder}
              />
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
              <span>確認儲存變更</span>
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
