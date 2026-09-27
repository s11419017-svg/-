import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  Music,
  Play,
  Pause,
  Disc,
  Sparkles,
  Volume2,
  User,
  Edit3,
  Plus,
  Trash2,
  FileAudio,
  Radio,
  ExternalLink,
  Headphones,
  FileText,
  Eye,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MusicalTrack } from '../../types';
import { MUSICAL_TRACKS as DEFAULT_TRACKS } from '../../data/showData';
import { MagneticWrapper } from '../ui/MagneticWrapper';
import { useAccessibility } from '../../context/AccessibilityContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.03,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

interface TrackListItemProps {
  track: MusicalTrack;
  isSelected: boolean;
  isPlaying: boolean;
  isEditMode?: boolean;
  onSelect: (track: MusicalTrack) => void;
  onPlay: (track: MusicalTrack) => void;
  onEdit?: (track: MusicalTrack) => void;
  onDelete?: (id: string) => void;
}

const TrackListItem = memo<TrackListItemProps>(({
  track,
  isSelected,
  isPlaying,
  isEditMode,
  onSelect,
  onPlay,
  onEdit,
  onDelete,
}) => {
  const handleSelect = useCallback(() => {
    onSelect(track);
  }, [onSelect, track]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(track);
      }
    },
    [onSelect, track]
  );

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay(track);
    },
    [onPlay, track]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit) onEdit(track);
    },
    [onEdit, track]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`確定要刪除曲目「${track.titleEn || track.titleZh}」嗎？`)) {
        if (onDelete) onDelete(track.id);
      }
    },
    [onDelete, track]
  );

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${track.titleZh} (${track.titleEn || '無英文名'})，演唱角色：${track.character || '全體'}`}
      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between group relative transform-gpu focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none min-h-[56px] ${
        isSelected
          ? 'bg-[#1a1a1c] border-amber-500/60 shadow-lg'
          : 'bg-[#161618]/80 border-stone-800/80 hover:border-stone-700'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <MagneticWrapper strength={0.25}>
          <button
            onClick={handlePlay}
            aria-label={isPlaying ? `暫停播放 ${track.titleZh}` : `播放 ${track.titleZh} 唱段`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isPlaying
                ? 'bg-amber-500 text-black animate-pulse shadow-md shadow-amber-500/20'
                : isSelected
                ? 'bg-[#8c2d2d] text-white hover:bg-[#a33535]'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
            title={isPlaying ? '暫停播放' : track.audioUrl ? '播放現場音檔' : '檢視曲目賞析與正版串流'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>
        </MagneticWrapper>

        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h4
              lang="en"
              className={`font-serif-tc text-sm font-bold truncate transition-colors ${
                isSelected ? 'text-amber-300' : 'text-stone-200 group-hover:text-stone-100'
              }`}
            >
              {track.titleEn || track.titleZh}
            </h4>
            {track.audioUrl && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0 font-sans">
                <FileAudio className="w-2.5 h-2.5" />
                <span>音檔</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-sans truncate">
            <span lang="zh-Hant-TW">{track.titleZh}</span>
            <span aria-hidden="true">•</span>
            <span className="text-stone-400 truncate">{track.character ? track.character.split(' ')[0] : '全體'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPlaying && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-[10px] font-sans">
            <Volume2 className="w-3 h-3 animate-pulse" aria-hidden="true" />
            <span className="hidden sm:inline">播放中</span>
          </div>
        )}

        {isEditMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              aria-label={`編輯曲目 ${track.titleZh}`}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              title="編輯曲目與更換音檔"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                aria-label={`刪除曲目 ${track.titleZh}`}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                title="刪除此曲目"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

TrackListItem.displayName = 'TrackListItem';

interface TrackDetailPanelProps {
  activeTrack: MusicalTrack;
  isPlaying: boolean;
  isEditMode?: boolean;
  audioProgress: number;
  currentTime: number;
  duration: number;
  onPlay: (track: MusicalTrack) => void;
  onSeek?: (percentage: number) => void;
  onEdit?: (track: MusicalTrack) => void;
}

const TrackDetailPanel = memo<TrackDetailPanelProps>(({
  activeTrack,
  isPlaying,
  isEditMode,
  audioProgress,
  currentTime,
  duration,
  onPlay,
  onSeek,
  onEdit,
}) => {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !activeTrack.audioUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    onSeek(pct);
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek || !activeTrack.audioUrl) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(100, audioProgress + 5);
      onSeek(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(0, audioProgress - 5);
      onSeek(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek(100);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPlay(activeTrack);
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-[#1a1a1c] border border-stone-800 rounded-sm space-y-6 relative overflow-hidden h-full flex flex-col justify-between jelly-spring">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-amber-400 uppercase tracking-widest font-bold block">
                {activeTrack.tempo || 'SYMPHONIC MASTERPIECE'}
              </span>
              {activeTrack.audioUrl && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-sans">
                  自訂演繹音檔
                </span>
              )}
            </div>
            <h3 lang="en" className="font-cinzel text-2xl font-bold text-stone-100 mt-1">
              {activeTrack.titleEn || activeTrack.titleZh}
            </h3>
            <p lang="zh-Hant-TW" className="font-serif-tc text-stone-300 text-sm">
              {activeTrack.titleZh}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode && onEdit && (
              <button
                onClick={() => onEdit(activeTrack)}
                aria-label="更換音檔或編輯曲目"
                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-sans font-bold rounded-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>更換音檔 / 編輯曲目</span>
              </button>
            )}

            {activeTrack.audioUrl && (
              <MagneticWrapper strength={0.22}>
                <button
                  onClick={() => onPlay(activeTrack)}
                  aria-label={isPlaying ? '暫停播放自訂公演錄音' : '播放自訂公演錄音'}
                  className="px-4 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-sans font-bold rounded-sm transition-all flex items-center gap-2 shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {isPlaying ? (
                    <>
                      <Disc className="w-4 h-4 animate-spin" />
                      <span>暫停播放</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>播放自訂公演錄音</span>
                    </>
                  )}
                </button>
              </MagneticWrapper>
            )}
          </div>
        </div>

        {/* Accessible Audio Player Scrubber for Uploaded Live Tracks */}
        {activeTrack.audioUrl && (
          <div className="p-4 bg-stone-900/80 rounded border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-sans text-stone-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                <span>公演音訊播放中</span>
              </span>
              <span aria-live="off">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Keyboard & Screen Reader Accessible Progress Bar */}
            <div
              role="slider"
              tabIndex={0}
              aria-label={`${activeTrack.titleZh} 播放進度`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(audioProgress)}
              aria-valuetext={`${formatTime(currentTime)} 共 ${formatTime(duration)}`}
              onClick={handleProgressClick}
              onKeyDown={handleSliderKeyDown}
              className="w-full h-3 bg-stone-800 rounded-full cursor-pointer overflow-hidden relative focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-500 font-sans">
              鍵盤提示：使用鍵盤左右方向鍵（← / →）快進或倒退 5 秒，空白鍵切換播放 / 暫停。
            </p>
          </div>
        )}

        {/* Official Symphonic Streaming Gateways */}
        <div className="pt-4 border-t border-[var(--theme-card-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif-tc font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span>官方交響原聲帶串流入口</span>
            </span>
            <span className="text-xs text-[var(--theme-text-muted)] font-serif-tc hidden sm:inline">百老匯與倫敦西區官方原版音源</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={activeTrack.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(activeTrack.titleEn + ' Les Miserables')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 Spotify 搜尋並聆聽 ${activeTrack.titleEn || activeTrack.titleZh} 官方原聲帶（開新視窗）`}
              className="px-3.5 py-2.5 bg-black/20 dark:bg-white/5 hover:bg-[#1DB954]/15 border border-stone-700/40 hover:border-[#1DB954] text-[#1DB954] text-xs font-sans font-medium rounded-lg flex items-center justify-between transition-all group focus-visible:ring-2 focus-visible:ring-[#1DB954]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1DB954]" aria-hidden="true" />
                <span className="font-semibold">Spotify 原聲帶</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" aria-hidden="true" />
            </a>

            <a
              href={activeTrack.appleMusicUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(activeTrack.titleEn + ' Les Miserables')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 Apple Music 搜尋並聆聽 ${activeTrack.titleEn || activeTrack.titleZh} 官方專輯（開新視窗）`}
              className="px-3.5 py-2.5 bg-black/20 dark:bg-white/5 hover:bg-[#FA243C]/15 border border-stone-700/40 hover:border-[#FA243C] text-[#FA243C] text-xs font-sans font-medium rounded-lg flex items-center justify-between transition-all group focus-visible:ring-2 focus-visible:ring-[#FA243C]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FA243C]" aria-hidden="true" />
                <span className="font-semibold">Apple Music 專輯</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" aria-hidden="true" />
            </a>

            <a
              href={activeTrack.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(activeTrack.titleEn + ' Les Miserables Official Soundtrack')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 YouTube 觀看 ${activeTrack.titleEn || activeTrack.titleZh} 官方交響影音（開新視窗）`}
              className="px-3.5 py-2.5 bg-black/20 dark:bg-white/5 hover:bg-[#FF0000]/15 border border-stone-700/40 hover:border-[#FF0000] text-[#FF4E4E] text-xs font-sans font-medium rounded-lg flex items-center justify-between transition-all group focus-visible:ring-2 focus-visible:ring-[#FF0000]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF0000]" aria-hidden="true" />
                <span className="font-semibold">YouTube 官方交響</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Song Description & Performer Details */}
        <div className="pt-4 border-t border-[var(--theme-card-border)] grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-serif-tc">
          <div className="space-y-1.5">
            <span className="text-xs font-serif-tc text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>演繹角色與演唱名冊</span>
            </span>
            <p className="font-bold text-sm text-[var(--theme-text-primary)]">{activeTrack.character || '全體角色'}</p>
            <p className="text-[var(--theme-text-secondary)] text-xs">{activeTrack.performer || '高二知足雙語班演職群'}</p>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-serif-tc text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>曲目劇情背景與藝術詮釋</span>
            </span>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed text-xs sm:text-sm">
              {activeTrack.desc || '《悲慘世界》傳世經典唱段，融合戲劇張力與心靈叩問。'}
            </p>
          </div>
        </div>

        {/* Lyrics & Accessible Transcript Section */}
        {(activeTrack.lyricsEn || activeTrack.lyricsZh) && (
          <div className="pt-4 border-t border-[var(--theme-card-border)] space-y-4" role="region" aria-label="經典雙語歌詞與唱段轉錄手冊">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif-tc font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span>經典唱段雙語歌詞對照</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                aria-expanded={showFullTranscript}
                className="text-xs font-serif-tc text-amber-500 hover:text-amber-400 underline cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {showFullTranscript ? '收合無障礙註解' : '展開完整背景轉錄'}
              </button>
            </div>

            <div className="space-y-3 border-l-2 border-[#8c2d2d] pl-4 py-1">
              {activeTrack.lyricsEn && (
                <p lang="en" className="font-garamond text-[var(--theme-text-primary)] text-lg sm:text-xl leading-relaxed italic">
                  "{activeTrack.lyricsEn}"
                </p>
              )}
              {activeTrack.lyricsZh && (
                <p lang="zh-Hant-TW" className="font-serif-tc text-[var(--theme-text-secondary)] text-sm sm:text-base tracking-wide leading-relaxed">
                  「{activeTrack.lyricsZh}」
                </p>
              )}
            </div>

            {/* Expanded Accessible Transcript for Hearing-Impaired Readers */}
            {showFullTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="p-4 bg-black/10 dark:bg-white/5 rounded-lg border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold font-serif-tc">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>無障礙劇本唱段背景與情境轉錄：</span>
                  </div>
                  <p className="text-[var(--theme-text-secondary)] font-serif-tc text-xs sm:text-sm leading-relaxed">
                    本曲目為高二知足雙語班英文公演代表性選段，歌詞透過英語對稱韻腳與法文原著精神，呈現角色在風雨飄搖時代中的命運抉擇與靈魂昇華。聽障或需要文字輔助之讀者可透過上方歌詞對照進行閱讀。
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-stone-800/60 text-[11px] font-sans text-stone-400 flex items-center justify-between">
        <span>慈大附中 115 級高二英文公演紀念曲目庫</span>
        <span className="text-stone-300 flex items-center gap-1">
          <Headphones className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>Symphonic Streaming & Archival Audio</span>
        </span>
      </div>
    </div>
  );
});

TrackDetailPanel.displayName = 'TrackDetailPanel';

interface MusicalShowcaseSectionProps {
  tracks?: MusicalTrack[];
  isEditMode?: boolean;
  onEditTrack?: (track: MusicalTrack) => void;
  onAddTrack?: () => void;
  onDeleteTrack?: (id: string) => void;
}

export const MusicalShowcaseSection: React.FC<MusicalShowcaseSectionProps> = memo(({
  tracks = DEFAULT_TRACKS,
  isEditMode = false,
  onEditTrack,
  onAddTrack,
  onDeleteTrack,
}) => {
  const currentTracks = tracks.length > 0 ? tracks : DEFAULT_TRACKS;
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<MusicalTrack>(() => currentTracks[0]);
  const { announce } = useAccessibility();

  // Audio Player States for Real Uploaded Audio
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Sync active track if tracks prop updates
  useEffect(() => {
    if (!currentTracks.some((t) => t.id === activeTrack.id)) {
      setActiveTrack(currentTracks[0] || DEFAULT_TRACKS[0]);
    }
  }, [currentTracks, activeTrack.id]);

  // Cleanup all audio resources on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    setPlayingTrackId(null);
    setAudioProgress(0);
  }, []);

  const handleSelectTrack = useCallback((track: MusicalTrack) => {
    setActiveTrack(track);
    announce(`已選取曲目：${track.titleZh} ${track.titleEn || ''}`);
  }, [announce]);

  const handlePlayTrack = useCallback((track: MusicalTrack) => {
    // If already playing this track, toggle pause
    if (playingTrackId === track.id) {
      stopAllAudio();
      announce(`已暫停播放：${track.titleZh}`);
      return;
    }

    stopAllAudio();
    setActiveTrack(track);

    // If custom audio URL is attached, play it directly
    if (track.audioUrl) {
      setPlayingTrackId(track.id);
      announce(`正在播放：${track.titleZh}`);
      try {
        const audio = new Audio(track.audioUrl);
        audioElementRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration);
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        audio.onended = () => {
          stopAllAudio();
          announce(`曲目播放完畢：${track.titleZh}`);
        };

        audio.onerror = () => {
          console.warn('Audio playback encountered error.');
          stopAllAudio();
        };

        audio.play().catch((e) => {
          console.warn('Autoplay blocked or audio failed:', e);
          stopAllAudio();
        });
      } catch (err) {
        stopAllAudio();
      }
    } else {
      announce(`已選取曲目：${track.titleZh}，可點擊下方正版串流平台聆聽完整交響樂演繹。`);
    }
  }, [playingTrackId, stopAllAudio, announce]);

  const handleSeek = useCallback((percentage: number) => {
    if (audioElementRef.current && audioElementRef.current.duration) {
      const newTime = (percentage / 100) * audioElementRef.current.duration;
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setAudioProgress(percentage);
    }
  }, []);

  return (
    <section
      id="music-showcase"
      role="region"
      aria-labelledby="music-showcase-title"
      className="py-24 relative overflow-hidden bg-[#121214] text-stone-200"
    >
      {/* Background Decorative Ambient */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#8c2d2d] rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-sans uppercase tracking-widest font-bold">
            <Music className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Masterpiece Musical Themes</span>
          </div>

          <h2 id="music-showcase-title" className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-100 tracking-wide">
            經典曲目賞析與正版原聲
          </h2>

          <p className="font-serif-tc text-stone-300 text-sm sm:text-base leading-relaxed">
            深入探尋《悲慘世界》傳世經典唱段的雙語歌詞、角色戲劇張力與心靈叩問。您可直接點擊下方官方原聲串流，沉浸於世界級交響樂團與百老匯歌手的震撼演繹。
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Track List (5 cols) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-between" role="region" aria-label="曲目導覽選單">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <span className="text-xs font-sans font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>曲目清單 ({currentTracks.length})</span>
              </span>

              {isEditMode && onAddTrack && (
                <button
                  onClick={onAddTrack}
                  aria-label="新增曲目"
                  className="px-2.5 py-1 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-sans rounded flex items-center gap-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增曲目</span>
                </button>
              )}
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-stone-700"
            >
              {currentTracks.map((track) => (
                <TrackListItem
                  key={track.id}
                  track={track}
                  isSelected={activeTrack.id === track.id}
                  isPlaying={playingTrackId === track.id}
                  isEditMode={isEditMode}
                  onSelect={handleSelectTrack}
                  onPlay={handlePlayTrack}
                  onEdit={onEditTrack}
                  onDelete={onDeleteTrack}
                />
              ))}
            </motion.div>
          </div>

          {/* Right Column: Track Detail & Player Panel (7 cols) */}
          <div className="lg:col-span-7" role="region" aria-label="目前選取曲目賞析與歌詞轉錄">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrack.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <TrackDetailPanel
                  activeTrack={activeTrack}
                  isPlaying={playingTrackId === activeTrack.id}
                  isEditMode={isEditMode}
                  audioProgress={audioProgress}
                  currentTime={currentTime}
                  duration={duration}
                  onPlay={handlePlayTrack}
                  onSeek={handleSeek}
                  onEdit={onEditTrack}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
});

MusicalShowcaseSection.displayName = 'MusicalShowcaseSection';

