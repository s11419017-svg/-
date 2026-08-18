import React, { useState } from 'react';
import { Music, Play, Square, Disc, Sparkles, Volume2, User, Mic2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ambientSynth } from '../../utils/audioSynth';

export interface MusicalTrack {
  id: string;
  titleEn: string;
  titleZh: string;
  character: string;
  performer: string;
  tempo: string;
  desc: string;
  lyricsEn: string;
  lyricsZh: string;
  freqPattern: number[];
}

const MUSICAL_TRACKS: MusicalTrack[] = [
  {
    id: 'people-sing',
    titleEn: 'Do You Hear the People Sing?',
    titleZh: '你可聽見人民的歌聲',
    character: 'Enjolras & Students (安喬拉與革命青年)',
    performer: '高三英文公演群戲大合唱',
    tempo: 'March / Anthem (四四拍戰歌昂揚)',
    desc: '《悲慘世界》最著名的革命進行曲，象徵對自由與尊嚴的不屈追求。在本次公演中，由高三全體演員共同獻唱，氣勢恢弘。',
    lyricsEn: "Do you hear the people sing? Singing a song of angry men? It is the music of a people who will not be slaves again!",
    lyricsZh: "你可聽見人民的歌聲？那是屬於不屈者的昂揚之歌。那是絕不再甘為奴隸的人民，發自靈魂深處的吼聲！",
    freqPattern: [261.63, 329.63, 392.00, 523.25, 392.00, 523.25]
  },
  {
    id: 'dreamed-a-dream',
    titleEn: 'I Dreamed a Dream',
    titleZh: '我曾有夢',
    character: 'Fantine (芳婷)',
    performer: '林思涵 同學獨唱',
    tempo: 'Lyrical Ballad (抒情悲歌)',
    desc: '芳婷在苦難命運中的經典獨唱，細緻刻畫對美好生活的眷戀與現實折磨下的絕望，音域寬廣，極富情感渲染力。',
    lyricsEn: "I dreamed that love would never die, I dreamed that God would be forgiving... But there are dreams that cannot be, and there are storms we cannot weather.",
    lyricsZh: "我曾夢想愛情永遠不會凋零，我曾夢想上帝滿懷寬恕... 但有些夢想注定無法實現，有些風暴我們無法抵擋。",
    freqPattern: [329.63, 392.00, 440.00, 523.25, 440.00, 392.00]
  },
  {
    id: 'bring-him-home',
    titleEn: 'Bring Him Home',
    titleZh: '帶他回家',
    character: 'Jean Valjean (尚萬強)',
    performer: '游承翰 同學獨唱',
    tempo: 'Sacred Prayer (虔誠高音祈禱曲)',
    desc: '尚萬強在街壘決戰前夜，向上帝為年輕的馬禮斯祈求平安的崇高禱告曲。高音極為飄逸深情。',
    lyricsEn: "God on high, hear my prayer. In my need you have always been there. He is young, he's just a boy... Bring him home.",
    lyricsZh: "至高無上的上帝，請傾聽我的禱告。在我最困頓之刻您從未離去。他還年輕，他只是一個孩子... 請帶他平安回家。",
    freqPattern: [440.00, 523.25, 659.25, 783.99, 659.25, 523.25]
  },
  {
    id: 'stars',
    titleEn: 'Stars',
    titleZh: '繁星',
    character: 'Inspector Javert (賈維爾)',
    performer: '陳奕霖 同學獨唱',
    tempo: 'Staccato Anthem (堅毅威嚴)',
    desc: '賈維爾督察在巴黎夜空繁星下宣誓的獨白曲，將律法與星辰運行相提並論，展現對絕對正義與追捕的狂熱信仰。',
    lyricsEn: "There out in the darkness, a fugitive running, fallen from God... Lord let me find him, that I may see him safe behind bars!",
    lyricsZh: "在那漫漫夜色深處，逃犯正狂奔逃竄，偏離了神的正道... 主啊，求您讓我找到他，親眼看見他深鎖於鐵窗之後！",
    freqPattern: [220.00, 277.18, 329.63, 440.00, 329.63, 220.00]
  },
  {
    id: 'one-day-more',
    titleEn: 'One Day More',
    titleZh: '明日再臨',
    character: 'Ensemble (全體主要角色重唱)',
    performer: '高三英文公演第一幕終曲大合唱',
    tempo: 'Polyphonic March (多聲部重唱進行曲)',
    desc: '第一幕終曲最為震撼的多聲部交織重唱，尚萬強、賈維爾、馬禮斯、珂賽特、愛波妮、安喬拉與泰納第夫婦各自唱出命運交會前的最後心聲。',
    lyricsEn: "One day more! Another day, another destiny! This never-ending road to Calvary; These men who seem to know my crime will surely come again...",
    lyricsZh: "明日再臨！新的一天，全新的宿命！這條通往受難地的漫漫長路；那些深知我過去的人，明日必定會再度襲來...",
    freqPattern: [261.63, 329.63, 392.00, 440.00, 523.25, 659.25]
  }
];

export const MusicalShowcaseSection: React.FC = () => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<MusicalTrack>(MUSICAL_TRACKS[0]);

  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const handlePlaySynthTheme = (track: MusicalTrack) => {
    ambientSynth.playButtonClickSFX();

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      return;
    }

    setPlayingTrackId(track.id);
    setActiveTrack(track);

    // Play synthesized melody preview through Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const now = audioCtx.currentTime;

      track.freqPattern.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.35);

        gain.gain.setValueAtTime(0.001, now + idx * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.35 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 0.7);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.35);
        osc.stop(now + idx * 0.35 + 0.75);
      });

      const totalTime = track.freqPattern.length * 350 + 800;
      setTimeout(() => {
        setPlayingTrackId((curr) => (curr === track.id ? null : curr));
        if (audioCtxRef.current === audioCtx) {
          try {
            audioCtx.close();
          } catch (e) {}
          audioCtxRef.current = null;
        }
      }, totalTime);
    } catch (e) {
      setPlayingTrackId(null);
    }
  };

  return (
    <section id="music-showcase" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#121214] border-t border-stone-800/80 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#8c2d2d]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.25em] text-[#8c2d2d] uppercase font-bold">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Famous Musical Songs & Audio Themes</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#f5f5f4] tracking-tight">
            經典曲目與主題旋律賞析
          </h2>
          <p className="font-serif-tc text-stone-400 text-sm sm:text-base max-w-2xl mx-auto">
            精選《悲慘世界》公演中最具震撼力的五大經典樂章，點擊試聽 Web Audio 樂章主題導引，細細品味歌詞雙語意境。
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#8c2d2d] to-transparent mx-auto mt-4" />
        </div>

        {/* 2-Column Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Track Selection List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-sans text-stone-400 uppercase tracking-widest block font-bold px-1">
              Select Song Track (選擇曲目)
            </span>

            {MUSICAL_TRACKS.map((track) => {
              const isSelected = activeTrack.id === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    ambientSynth.playButtonClickSFX();
                    setActiveTrack(track);
                  }}
                  className={`p-4 rounded-sm border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#1a1a1c] border-amber-500/60 shadow-lg'
                      : 'bg-[#161618]/80 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySynthTheme(track);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        isPlaying
                          ? 'bg-amber-500 text-black animate-spin'
                          : isSelected
                          ? 'bg-[#8c2d2d] text-white hover:bg-[#a33535]'
                          : 'bg-stone-800 text-stone-300 hover:text-white'
                      }`}
                    >
                      {isPlaying ? <Disc className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div>
                      <h4 className={`font-serif-tc text-sm font-bold transition-colors ${
                        isSelected ? 'text-amber-300' : 'text-stone-200 group-hover:text-stone-100'
                      }`}>
                        {track.titleEn}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 font-sans">
                        <span>{track.titleZh}</span>
                        <span>•</span>
                        <span className="text-stone-500">{track.character.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {isPlaying && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-[10px] font-sans">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      <span>試聽中</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Song Lyrics & Interpretation Panel (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="p-6 sm:p-8 bg-[#1a1a1c] border border-stone-800 rounded-sm space-y-6 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
                  <div>
                    <span className="text-xs font-sans text-amber-400 uppercase tracking-widest font-bold block">
                      {activeTrack.tempo}
                    </span>
                    <h3 className="font-cinzel text-2xl font-bold text-stone-100 mt-1">
                      {activeTrack.titleEn}
                    </h3>
                    <p className="font-serif-tc text-stone-300 text-sm">
                      {activeTrack.titleZh}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlaySynthTheme(activeTrack)}
                    className="px-4 py-2 bg-[#8c2d2d] hover:bg-[#a33535] text-white text-xs font-sans font-bold rounded-sm transition-all flex items-center gap-2 shadow-md"
                  >
                    {playingTrackId === activeTrack.id ? (
                      <>
                        <Disc className="w-4 h-4 animate-spin" />
                        <span>播放聲學導引中</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>試聽樂曲主題旋律</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Song Description & Character */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-serif-tc bg-stone-900/60 p-4 rounded border border-stone-800/80">
                  <div className="space-y-1">
                    <span className="text-[10px] font-sans text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>演譯角色與演唱同學</span>
                    </span>
                    <p className="font-bold text-stone-200">{activeTrack.character}</p>
                    <p className="text-stone-400 text-[11px]">{activeTrack.performer}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-sans text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>曲目簡介與藝術詮釋</span>
                    </span>
                    <p className="text-stone-300 leading-relaxed text-[11px]">{activeTrack.desc}</p>
                  </div>
                </div>

                {/* Lyrics Quote Box */}
                <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-sm space-y-3">
                  <span className="text-[10px] font-sans font-bold text-amber-400 uppercase tracking-widest block">
                    FEATURED LYRICS (經典雙語歌詞摘錄)
                  </span>
                  <p className="font-serif-tc text-stone-100 text-sm sm:text-base leading-relaxed italic border-l-2 border-amber-500/60 pl-3">
                    "{activeTrack.lyricsEn}"
                  </p>
                  <p className="font-serif-tc text-stone-400 text-xs sm:text-sm pl-3">
                    {activeTrack.lyricsZh}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800/60 text-[11px] font-sans text-stone-500 flex items-center justify-between">
                <span>慈大附中 115 級高三英文公演紀念專輯</span>
                <span className="text-stone-400">Audio Synth Engine Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
