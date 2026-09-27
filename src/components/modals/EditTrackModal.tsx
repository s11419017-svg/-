import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Check, Music, Sparkles, Volume2, Play, Disc, Trash2, Link, FileAudio, ShieldCheck } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { MusicalTrack } from '../../types';
import { checkStringEncoding, sanitizeObjectToUtf8 } from '../../utils/textEncoding';
import { EncodingWarningNotice } from '../common/EncodingWarningNotice';
import { FieldEditTip, PlaceholderNoticeCard } from '../common/FieldEditTip';
import { FocusEditModalWrapper } from '../common/FocusEditModalWrapper';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ambientSynth } from '../../utils/audioSynth';

interface EditTrackModalProps {
  track: MusicalTrack | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (track: MusicalTrack) => void;
  onLiveChange?: (track: MusicalTrack) => void;
  onCancel?: () => void;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  isOpen,
  onClose,
  onSave,
  onLiveChange,
  onCancel,
}) => {
  const initialDataRef = useRef<MusicalTrack | null>(null);

  const [formData, setFormData] = useState<MusicalTrack>(() => {
    const initial = track || {
      id: `track-${Date.now()}`,
      titleEn: '',
      titleZh: '',
      character: '',
      performer: '',
      tempo: 'Lyrical / Ballad',
      desc: '',
      lyricsEn: '',
      lyricsZh: '',
      freqPattern: [261.63, 329.63, 392.00, 523.25],
    };
    initialDataRef.current = JSON.parse(JSON.stringify(initial));
    return initial;
  });

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [audioInputMode, setAudioInputMode] = useState<'upload' | 'url' | 'synth'>('upload');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  // Track if modified
  const isDirty = useMemo(() => {
    if (!initialDataRef.current) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  }, [formData]);

  // Real-time UTF-8 and Encoding inspection
  const combinedTextForCheck = useMemo(() => {
    return [
      formData.titleEn,
      formData.titleZh,
      formData.character,
      formData.performer,
      formData.desc,
      formData.lyricsEn,
      formData.lyricsZh,
    ]
      .filter(Boolean)
      .join(' ');
  }, [formData]);

  const encodingCheck = useMemo(() => {
    return checkStringEncoding(combinedTextForCheck);
  }, [combinedTextForCheck]);

  const KNOWN_TRACK_PLACEHOLDER_PERFORMERS = ['林思涵 同學獨唱', '高二知足雙語班合唱'];
  const placeholderAnalysis = useMemo(() => {
    const isPerformerPlaceholder = !formData.performer?.trim() || KNOWN_TRACK_PLACEHOLDER_PERFORMERS.some(p => formData.performer?.includes(p));
    const isDescPlaceholder = !formData.desc?.trim() || formData.desc?.includes('請輸入這首曲目') || formData.desc?.includes('劇情脈絡');
    const isLyricsZhPlaceholder = !formData.lyricsZh?.trim() || formData.lyricsZh?.includes('那是屬於不屈者的昂揚之歌');

    const unmodifiedFields: string[] = [];
    if (isPerformerPlaceholder) unmodifiedFields.push('演唱同學姓名/聲部分配');
    if (isDescPlaceholder) unmodifiedFields.push('本班曲目簡介與藝術詮釋');
    if (isLyricsZhPlaceholder) unmodifiedFields.push('中文譯詞意境');

    return {
      isPerformerPlaceholder,
      isDescPlaceholder,
      isLyricsZhPlaceholder,
      unmodifiedCount: unmodifiedFields.length,
      unmodifiedFields,
    };
  }, [formData]);

  const CLASSIC_TRACK_PRESETS = [
    {
      titleEn: 'Do You Hear the People Sing?',
      titleZh: '你可聽見人民的歌聲',
      character: 'Enjolras & Students (安喬拉與革命青年)',
      tempo: 'March / Anthem (激昂進行曲)',
      desc: '象徵巴黎青年與市民對自由與公義的吶喊，知足班全體澎湃大合唱。',
      lyricsEn: 'Do you hear the people sing? Singing a song of angry men?',
      lyricsZh: '你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌。',
    },
    {
      titleEn: 'I Dreamed a Dream',
      titleZh: '我曾有夢',
      character: 'Fantine (芳婷)',
      tempo: 'Lyrical / Ballad (抒情悲歌)',
      desc: '芳婷身處絕境中對過往青春與美好未來的深情回憶與控訴。',
      lyricsEn: 'I dreamed a dream in time gone by, when hope was high and life worth living.',
      lyricsZh: '往昔時光我曾有夢，那時希望滿懷，生命多麼值得期待。',
    },
    {
      titleEn: 'One Day More',
      titleZh: '只待明日',
      character: 'Full Company (全體主要演員與群演)',
      tempo: 'Grand Ensemble (多聲部史詩複調)',
      desc: '第一幕終曲，所有角色各自懷抱不同心願迎向起義清晨的震撼多部合唱。',
      lyricsEn: 'One day more! Another day, another destiny.',
      lyricsZh: '只待明日！又是一天，又是未知的命運。',
    },
    {
      titleEn: 'On My Own',
      titleZh: '形單影隻',
      character: 'Éponine (愛波寧)',
      tempo: 'Melancholic (孤寂哀歌)',
      desc: '愛波寧獨步在巴黎微雨街頭，傾訴對馬里歐未竟心意的心碎獨白。',
      lyricsEn: 'On my own, pretending he\'s beside me. All alone, I walk with him till morning.',
      lyricsZh: '形單影隻，假想他就在身旁；獨自一人，與他漫步直到天明。',
    },
    {
      titleEn: 'Stars',
      titleZh: '繁星',
      character: 'Javert (賈維)',
      tempo: 'Dramatic / Solemn (莊嚴誓詞)',
      desc: '警探賈維凝視夜空繁星，向神明立誓終生不懈追捕尚萬強。',
      lyricsEn: 'Stars in your multitudes, scarce to be counted, filling the darkness with order and light.',
      lyricsZh: '繁星浩瀚不可計數，在幽暗中注入秩序與光明。',
    },
    {
      titleEn: 'Bring Him Home',
      titleZh: '帶他回家',
      character: 'Jean Valjean (尚萬強)',
      tempo: 'Tender Prayer (慈父祈禱)',
      desc: '尚萬強在革命街壘暗夜中，為青年馬里歐向天虔敬祈禱的溫柔心聲。',
      lyricsEn: 'God on high, hear my prayer. In my need you have always been there.',
      lyricsZh: '在天的主啊，俯聽我的祈禱；在困厄時，你總與我同在。',
    },
  ];

  const handleQuickSelectPresetTrack = (p: typeof CLASSIC_TRACK_PRESETS[0]) => {
    updateFormData({
      ...formData,
      titleEn: p.titleEn,
      titleZh: p.titleZh,
      character: p.character,
      tempo: p.tempo,
      desc: p.desc,
      lyricsEn: p.lyricsEn,
      lyricsZh: p.lyricsZh,
    });
  };

  const handleClearDemoPlaceholders = () => {
    updateFormData({
      ...formData,
      performer: placeholderAnalysis.isPerformerPlaceholder ? '' : formData.performer,
      desc: placeholderAnalysis.isDescPlaceholder ? '' : formData.desc,
      lyricsZh: placeholderAnalysis.isLyricsZhPlaceholder ? '' : formData.lyricsZh,
    });
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  // Keyboard shortcut listener: Ctrl+S / Cmd+S to save, Esc to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ambientSynth.playButtonClickSFX();
        if (!formData.titleEn.trim() && !formData.titleZh.trim()) {
          setValidationError('請輸入曲目英文名稱或中文譯名，以供節目冊呈現。');
          return;
        }
        setValidationError(null);
        const cleanData = sanitizeObjectToUtf8(formData);
        onSave(cleanData);
      } else if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, isDirty, onSave]);

  // Sync internal state if target track prop changes
  useEffect(() => {
    if (track) {
      setFormData(track);
      setValidationError(null);
      if (track.audioUrl) {
        if (track.audioUrl.startsWith('data:audio')) {
          setAudioInputMode('upload');
          setAudioFileName('已上傳自訂音檔 (Audio Data)');
        } else {
          setAudioInputMode('url');
        }
      } else {
        setAudioInputMode('synth');
      }
    }
  }, [track]);

  // Stop preview audio on unmount or close
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
    };
  }, [previewAudio]);

  const updateFormData = (updated: MusicalTrack) => {
    setFormData(updated);
    if (validationError) setValidationError(null);
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  const handleAutoFixAllFields = () => {
    const fixed = sanitizeObjectToUtf8(formData);
    updateFormData(fixed);
  };

  // Process and read audio file (MP3 / WAV / M4A / AAC)
  const processAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      setValidationError('請選擇有效的音訊檔案格式 (MP3, WAV, M4A, AAC, OGG)。');
      return;
    }

    // Limit base64 audio to 15MB to prevent memory exhaustion
    if (file.size > 15 * 1024 * 1024) {
      setValidationError('音訊檔案建議小於 15MB，以確保在不同瀏覽器與裝置順暢載入。');
      return;
    }

    setValidationError(null);
    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        updateFormData({
          ...formData,
          audioUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleAudioFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  const togglePreview = () => {
    if (isPlayingPreview) {
      if (previewAudio) {
        previewAudio.pause();
      }
      setIsPlayingPreview(false);
      return;
    }

    if (formData.audioUrl) {
      const audio = new Audio(formData.audioUrl);
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => {
        setValidationError('音訊播放失敗，請確認檔案或連結格式是否正確。');
        setIsPlayingPreview(false);
      };
      setPreviewAudio(audio);
      audio.play().catch(() => setIsPlayingPreview(false));
      setIsPlayingPreview(true);
    } else {
      // Play synth preview
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const pattern = formData.freqPattern || [261.63, 329.63, 392.00, 523.25];

        pattern.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.35);
          gain.gain.setValueAtTime(0.001, now + idx * 0.35);
          gain.gain.exponentialRampToValueAtTime(0.05, now + idx * 0.35 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.35);
          osc.stop(now + idx * 0.35 + 0.7);
        });

        setIsPlayingPreview(true);
        setTimeout(() => {
          setIsPlayingPreview(false);
          try {
            ctx.close();
          } catch (e) {}
        }, pattern.length * 350 + 600);
      } catch (e) {
        setIsPlayingPreview(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ambientSynth.playButtonClickSFX();

    if (!formData.titleEn.trim() && !formData.titleZh.trim()) {
      setValidationError('請輸入曲目英文名稱或中文譯名，以供節目冊呈現。');
      return;
    }
    setValidationError(null);

    const cleanData = sanitizeObjectToUtf8(formData);
    onSave(cleanData);
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
    if (previewAudio) {
      previewAudio.pause();
    }
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <FocusEditModalWrapper
        isOpen={isOpen}
        onClose={handleSafeClose}
        title={track ? '編輯曲目與音檔資訊' : '新增公演曲目'}
        maxWidthClass="max-w-3xl"
      >
        <div className="flex flex-col max-h-[88vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-[#141416] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Music className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="edit-track-modal-title" className="font-serif-tc text-lg font-bold text-stone-100 flex items-center gap-2">
                  <span>{track ? '編輯曲目與音檔資訊' : '新增公演曲目'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    即時預覽
                  </span>
                  {isDirty && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      ● 編輯中 (未儲存)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-stone-400 font-sans">
                  支援上傳同學演唱/排練音檔 (MP3/WAV) 或自訂雙語歌詞與曲目賞析
                </p>
              </div>
            </div>

            <button
              onClick={handleSafeClose}
              aria-label="關閉視窗 (Esc)"
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            {/* Validation Error Banner */}
            {validationError && (
              <div role="alert" className="p-3 bg-red-950/80 border border-red-500 rounded text-red-200 text-xs font-sans space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>⚠️ 表單內容未完成：</span>
                </p>
                <p>{validationError}</p>
              </div>
            )}
            {/* Encoding Safety Check Notice */}
            <EncodingWarningNotice
              result={encodingCheck}
              onAutoFix={handleAutoFixAllFields}
              fieldName="曲目資訊"
            />

            {/* Prototype / Unmodified Placeholder Detection Notice */}
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
                    <span>一鍵清空示範文字（方便填寫本班實際演唱同學與意境）</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Classic Track Presets */}
            <div className="space-y-1.5 p-3 bg-stone-900/60 border border-stone-800 rounded">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>悲慘世界著名選曲快速套用：</span>
                </span>
                <span className="text-[10px] text-stone-500">點擊即自動帶入雙語曲名、角色與經典歌詞</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {CLASSIC_TRACK_PRESETS.map((preset) => (
                  <button
                    key={preset.titleEn}
                    type="button"
                    onClick={() => handleQuickSelectPresetTrack(preset)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
                      formData.titleEn === preset.titleEn
                        ? 'bg-amber-900/60 text-amber-200 border-amber-500 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {preset.titleZh} <span className="font-mono text-[9px] text-stone-500">({preset.titleEn})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Track Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldEditTip
                  label="曲目英文名稱"
                  sublabel="Title EN"
                  tip="百老匯或西區原版曲名，例如 Do You Hear the People Sing?"
                  required
                />
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => updateFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="e.g. Do You Hear the People Sing?"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <FieldEditTip
                  label="曲目中文譯名"
                  sublabel="Title ZH"
                  tip="中文曲目翻譯，例如 你可聽見人民的歌聲"
                />
                <input
                  type="text"
                  value={formData.titleZh}
                  onChange={(e) => updateFormData({ ...formData, titleZh: e.target.value })}
                  placeholder="e.g. 你可聽見人民的歌聲"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Character & Performer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldEditTip
                  label="登場角色 / 聲部"
                  sublabel="Character / Vocal"
                  tip="曲目對應之劇中人物或聲部組合"
                />
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => updateFormData({ ...formData, character: e.target.value })}
                  placeholder="e.g. Enjolras & Students (安喬拉與革命青年)"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <FieldEditTip
                  label="演唱/演繹同學或團隊"
                  sublabel="Performer"
                  tip="填寫本班實際演唱同學姓名或合唱團"
                  isPlaceholder={placeholderAnalysis.isPerformerPlaceholder}
                  isCustomized={!placeholderAnalysis.isPerformerPlaceholder}
                />
                <input
                  type="text"
                  value={formData.performer}
                  onChange={(e) => updateFormData({ ...formData, performer: e.target.value })}
                  placeholder="e.g. 林思涵 同學獨唱 / 高二知足雙語班合唱"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tempo & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <FieldEditTip
                  label="曲風 / 節奏"
                  sublabel="Tempo & Style"
                  tip="例如 March / Anthem、Lyrical / Ballad"
                />
                <input
                  type="text"
                  value={formData.tempo}
                  onChange={(e) => updateFormData({ ...formData, tempo: e.target.value })}
                  placeholder="e.g. March / Anthem (四四拍戰歌)"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <FieldEditTip
                  label="曲目簡介與藝術詮釋"
                  sublabel="Description"
                  tip="本曲在劇中劇情脈絡與知足班排練詮釋"
                  isPlaceholder={placeholderAnalysis.isDescPlaceholder}
                  isCustomized={!placeholderAnalysis.isDescPlaceholder}
                />
                <textarea
                  rows={2}
                  value={formData.desc}
                  onChange={(e) => updateFormData({ ...formData, desc: e.target.value })}
                  placeholder="請輸入這首曲目在公演中的劇情脈絡與情感意境..."
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bilingual Lyrics */}
            <div className="space-y-3 p-4 bg-stone-900/60 rounded border border-stone-800">
              <span className="text-xs font-sans font-bold text-amber-400 uppercase tracking-wider block">
                經典歌詞摘錄 (FEATURED LYRICS)
              </span>

              <div className="space-y-1.5">
                <label className="text-[11px] font-sans text-stone-400">
                  英文原版歌詞 (English Lyrics)
                </label>
                <textarea
                  rows={2}
                  value={formData.lyricsEn}
                  onChange={(e) => updateFormData({ ...formData, lyricsEn: e.target.value })}
                  placeholder="e.g. Do you hear the people sing? Singing a song of angry men..."
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none font-serif"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-sans text-stone-400">
                  中文譯詞意境 (Chinese Translation)
                </label>
                <textarea
                  rows={2}
                  value={formData.lyricsZh}
                  onChange={(e) => updateFormData({ ...formData, lyricsZh: e.target.value })}
                  placeholder="e.g. 你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌..."
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none font-serif-tc"
                />
              </div>
            </div>

            {/* Audio Source / File Upload */}
            <div className="space-y-3 p-4 bg-[#141416] rounded border border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4" />
                  <span>音源設定 (自訂 MP3 錄音 / 線上連結 / Web Audio 合成)</span>
                </span>

                <div className="flex items-center gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => setAudioInputMode('upload')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      audioInputMode === 'upload'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    上傳本機音檔
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioInputMode('url')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      audioInputMode === 'url'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    輸入音訊網址
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioInputMode('synth')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      audioInputMode === 'synth'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    合成主題旋律
                  </button>
                </div>
              </div>

              {audioInputMode === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAudioDrop}
                  className="border-2 border-dashed border-stone-700 hover:border-amber-500/60 p-5 rounded text-center transition-colors bg-stone-900/40"
                >
                  <Upload className="w-7 h-7 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs text-stone-300 font-sans">
                    拖曳 MP3 / WAV 檔案至此，或點擊下方按鈕選取同學錄音
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    支援 MP3, WAV, M4A, AAC 等主流音訊格式
                  </p>
                  <label className="inline-block mt-3 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded text-xs font-sans cursor-pointer transition-colors">
                    <span>瀏覽選擇音訊檔案</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                      onChange={handleAudioFileInput}
                      className="hidden"
                    />
                  </label>
                  {audioFileName && (
                    <div className="mt-2 text-xs text-amber-300 font-sans flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{audioFileName}</span>
                    </div>
                  )}
                </div>
              )}

              {audioInputMode === 'url' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.audioUrl || ''}
                      onChange={(e) => updateFormData({ ...formData, audioUrl: e.target.value })}
                      placeholder="https://example.com/audio/song.mp3"
                      className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-sm text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    可輸入指向 MP3 / 音訊串流的直接 URL 網址。
                  </p>
                </div>
              )}

              {audioInputMode === 'synth' && (
                <div className="p-3 bg-stone-900/60 rounded border border-stone-800 text-xs text-stone-400 space-y-1">
                  <p className="text-stone-300 font-semibold">Web Audio 聲學合成主題模式</p>
                  <p>
                    若無實際音訊檔，系統將自動使用劇院合成器演算專屬的主題旋律與琶音，保證全平台隨選隨播。
                  </p>
                </div>
              )}

              {/* Audio Test / Preview Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={togglePreview}
                  className={`px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1.5 transition-all ${
                    isPlayingPreview
                      ? 'bg-amber-500 text-black animate-pulse'
                      : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Disc className="w-3.5 h-3.5 animate-spin" />
                      <span>停止試聽</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>試聽當前音源設定</span>
                    </>
                  )}
                </button>

                {formData.audioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData({ ...formData, audioUrl: undefined });
                      setAudioFileName('');
                    }}
                    className="text-xs text-stone-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清除自訂音檔 (恢復合成器)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-stone-500 font-mono hidden sm:flex items-center gap-2">
                <span>快捷鍵：Ctrl+S / ⌘S 儲存 • Esc 退出</span>
                {isDirty && <span className="text-amber-400 font-sans">• 未儲存修改</span>}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-sans font-bold rounded-sm transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-sans font-bold rounded-sm transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>儲存曲目設定</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Unsaved Changes Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDiscardConfirmOpen}
          title="您有尚未儲存的曲目修改"
          message="您剛才所做的曲目資訊或歌詞調整尚未存檔。確定要捨棄變更並退出嗎？"
          confirmLabel="放棄修改並退出"
          cancelLabel="繼續編輯"
          variant="warning"
          onConfirm={handleFinalCancel}
          onCancel={() => setIsDiscardConfirmOpen(false)}
        />
      </FocusEditModalWrapper>
    </AnimatePresence>,
    document.body
  );
};
