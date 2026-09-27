/**
 * Microsoft Azure Speech & Accessible Audio Tour Client Service
 * 
 * Provides unified Text-to-Speech playback with:
 * 1. Microsoft Azure Cognitive Services Speech (Neural Voices: en-GB & zh-TW)
 * 2. Automatic, seamless fallback to HTML5 Web Speech API (window.speechSynthesis)
 * 3. Audio instance lifecycle management (singleton playback, pause, stop)
 * 4. Character voice & theatrical emotional style mapping
 */

export interface SpeechOptions {
  text: string;
  voice?: string;
  lang?: string;
  rate?: string; // e.g., '0%', '-10%', '+15%'
  pitch?: string; // e.g., '0%', '+5Hz', '-5%'
  style?: string; // e.g., 'sad', 'cheerful', 'serious', 'hopeful'
  onStart?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
}

export interface CharacterVoiceProfile {
  id: string;
  name: string;
  azureVoice: string;
  lang: string;
  style?: string;
  pitch?: string;
  description: string;
}

// Pre-configured character voice profiles for Les Misérables
export const CHARACTER_VOICES: Record<string, CharacterVoiceProfile> = {
  valjean: {
    id: 'valjean',
    name: 'Jean Valjean (尚萬強)',
    azureVoice: 'en-GB-RyanNeural',
    lang: 'en-GB',
    pitch: '-4%',
    style: 'serious',
    description: '深沉威嚴、歷經滄桑後的慈悲救贖',
  },
  javert: {
    id: 'javert',
    name: 'Javert (沙威)',
    azureVoice: 'en-GB-OliverNeural',
    lang: 'en-GB',
    pitch: '-2%',
    style: 'strict',
    description: '剛正嚴峻、鐵面無私的執法者執念',
  },
  fantine: {
    id: 'fantine',
    name: 'Fantine (芳婷)',
    azureVoice: 'en-GB-SoniaNeural',
    lang: 'en-GB',
    style: 'sad',
    description: '溫柔脆弱、為母則剛的悲憫哀傷',
  },
  cosette: {
    id: 'cosette',
    name: 'Cosette (柯賽特)',
    azureVoice: 'en-GB-MaisieNeural',
    lang: 'en-GB',
    pitch: '+3%',
    style: 'cheerful',
    description: '純真甜美、象徵風暴後的晨曦希望',
  },
  eponine: {
    id: 'eponine',
    name: 'Éponine (艾波妮)',
    azureVoice: 'en-GB-LibbyNeural',
    lang: 'en-GB',
    style: 'sorrowful',
    description: '歷經風霜、街頭深情的孤獨告白',
  },
  marius: {
    id: 'marius',
    name: 'Marius (馬里歐)',
    azureVoice: 'en-GB-AlfieNeural',
    lang: 'en-GB',
    pitch: '+1%',
    style: 'passionate',
    description: '革命理想與深情相戀的青年學子',
  },
  enjolras: {
    id: 'enjolras',
    name: 'Enjolras (恩佐拉)',
    azureVoice: 'en-GB-ThomasNeural',
    lang: 'en-GB',
    pitch: '+2%',
    style: 'hopeful',
    description: '熱血澎湃、無畏犧牲的青年領袖',
  },
  thenardier: {
    id: 'thenardier',
    name: 'Thénardier (德納第)',
    azureVoice: 'en-GB-RyanNeural',
    lang: 'en-GB',
    pitch: '+6%',
    style: 'cheerful',
    description: '市儈狡詐、滑稽自私的底層客棧老闆',
  },
};

// Accessibility Narrator Voice Defaults
export const NARRATOR_VOICES = {
  zhTW_Female: {
    id: 'zhTW_Female',
    name: '繁體中文親切導覽女聲 (曉臻)',
    azureVoice: 'zh-TW-HsiaoChenNeural',
    lang: 'zh-TW',
  },
  zhTW_Male: {
    id: 'zhTW_Male',
    name: '繁體中文典雅導覽男聲 (雲哲)',
    azureVoice: 'zh-TW-YunJheNeural',
    lang: 'zh-TW',
  },
  enGB_Female: {
    id: 'enGB_Female',
    name: '英式音樂劇劇目導讀 (Sonia)',
    azureVoice: 'en-GB-SoniaNeural',
    lang: 'en-GB',
  },
};

class AzureSpeechService {
  private activeAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private isAzureConfigured: boolean | null = null;
  private cachedBlobs = new Map<string, string>();

  /**
   * Check if the backend Azure Speech API is configured with an active key
   */
  async checkStatus(): Promise<{ configured: boolean; region?: string }> {
    try {
      const res = await fetch('/api/speech/status');
      if (res.ok) {
        const data = await res.json();
        this.isAzureConfigured = !!data.configured;
        return { configured: this.isAzureConfigured, region: data.region };
      }
    } catch {
      this.isAzureConfigured = false;
    }
    return { configured: false };
  }

  /**
   * Resolve best character voice profile from character name or ID
   */
  resolveCharacterVoice(nameOrId: string): CharacterVoiceProfile {
    const key = nameOrId.toLowerCase();
    for (const [id, profile] of Object.entries(CHARACTER_VOICES)) {
      if (key.includes(id) || key.includes(profile.name.toLowerCase()) || profile.name.includes(nameOrId)) {
        return profile;
      }
    }
    // Default fallback
    return CHARACTER_VOICES.valjean;
  }

  /**
   * Stop any currently playing speech audio (both Azure stream and window.speechSynthesis)
   */
  stop(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio.src = '';
      } catch (e) {
        console.warn('Audio pause warning:', e);
      }
      this.activeAudio = null;
    }

    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch {}
      this.currentObjectUrl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Speak text with Azure Speech API, falling back automatically to browser synthesis
   */
  async speak(options: SpeechOptions): Promise<{ source: 'azure' | 'browser' }> {
    const {
      text,
      voice = NARRATOR_VOICES.zhTW_Female.azureVoice,
      lang = 'zh-TW',
      rate = '0%',
      pitch = '0%',
      style,
      onStart,
      onEnded,
      onError,
    } = options;

    if (!text || !text.trim()) {
      return { source: 'browser' };
    }

    // Stop previous playback
    this.stop();

    // Check cached object URL in frontend session
    const cacheKey = `${voice}_${rate}_${pitch}_${style || 'none'}_${text.trim()}`;
    let audioUrl = this.cachedBlobs.get(cacheKey);

    // 1. Attempt Azure Neural TTS Synthesis via backend
    try {
      if (!audioUrl) {
        const response = await fetch('/api/speech/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice,
            lang,
            rate,
            pitch,
            style,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
          this.cachedBlobs.set(cacheKey, audioUrl);
        }
      }

      if (audioUrl) {
        this.currentObjectUrl = audioUrl;
        const audio = new Audio(audioUrl);
        this.activeAudio = audio;

        audio.onplay = () => {
          onStart?.();
        };

        audio.onended = () => {
          this.activeAudio = null;
          onEnded?.();
        };

        audio.onerror = (e) => {
          console.warn('Azure audio playback error, falling back to browser:', e);
          this.fallbackBrowserSpeech(text, lang, onStart, onEnded, onError);
        };

        await audio.play();
        return { source: 'azure' };
      }
    } catch (azureErr) {
      console.warn('Azure Speech API failed, seamlessly switching to browser speech:', azureErr);
    }

    // 2. Seamless Graceful Fallback: Browser Web Speech API
    this.fallbackBrowserSpeech(text, lang, onStart, onEnded, onError);
    return { source: 'browser' };
  }

  /**
   * Fallback implementation using window.speechSynthesis
   */
  private fallbackBrowserSpeech(
    text: string,
    lang: string,
    onStart?: () => void,
    onEnded?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.(new Error('語音合成功能在目前瀏覽器中不可用'));
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        onStart?.();
      };
      utterance.onend = () => {
        onEnded?.();
      };
      utterance.onerror = (err) => {
        console.warn('Browser SpeechSynthesis error:', err);
        onError?.(err);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      onError?.(err);
    }
  }
}

export const azureSpeechService = new AzureSpeechService();
