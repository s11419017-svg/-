import { triggerHaptic } from './haptics';

// ========================================================================
// 🎭 2026 TheatreAudioEngine - 慈大附中演藝廳真實劇場聲學 Web Audio 引擎
// Features: 
// - DynamicsCompressorNode (母帶動態壓限與防削波失真)
// - ConvolverNode (慈大附中演藝廳真實木質鏡框式劇場脈衝響應 IR 模擬與外部 IR 載入)
// - StereoPannerNode (2D/3D 空間立體聲向定位)
// - Auxiliary Wet/Dry Reverb Send Bus
// - Multi-Layer Symphonic Synthesizer & Zero-Click Envelopes
// ========================================================================

export type MusicTheme = 'overture' | 'people_sing' | 'dream';

export interface SpatialAudioOptions {
  pan?: number;            // -1.0 (極左) ~ +1.0 (極右)
  reverbSend?: number;     // 0.0 (乾聲) ~ 1.0 (全濕演藝廳殘響)
  pitchMultiplier?: number;
  volume?: number;
}

export class TheatreAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTheme: MusicTheme = 'overture';
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private isDucked: boolean = false;
  private bgmTimer: number | null = null;

  // Web Audio Graph Master Nodes
  private masterGain: GainNode | null = null;
  private dynamicsCompressor: DynamicsCompressorNode | null = null;
  private masterConvolver: ConvolverNode | null = null;
  private dryBus: GainNode | null = null;
  private wetBus: GainNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;

  // Custom IR state
  private isIRLoaded: boolean = false;
  private irName: string = '慈大附中演藝廳 (TCUSH Proscenium Hall)';

  // 2026 Spatial Ambient Soundscape Nodes
  private isSoundscapePlaying: boolean = false;
  private soundscapeGain: GainNode | null = null;
  private soundscapeFilter: BiquadFilterNode | null = null;
  private soundscapeOsc1: OscillatorNode | null = null;
  private soundscapeOsc2: OscillatorNode | null = null;
  private soundscapeNoiseNode: AudioBufferSourceNode | null = null;

  constructor() {
    // Lazy initialization on first user gesture
  }

  /**
   * 初始化 Web Audio 上下文與完整的演藝廳聲學母帶鏈
   */
  public initAudio(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMasterAudioGraph();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * 建立專業演藝廳聲學音訊圖 (Audio Graph)
   * 
   * [Source Node] ──┬─► [Dry Bus (0.8)] ──────────────────────┬─► [Highpass 30Hz] ─► [Lowpass 14.5kHz] ─► [DynamicsCompressor] ─► [Master Gain] ─► [Destination]
   *                 └─► [ConvolverNode (IR)] ─► [Wet Bus (0.25)] ┘
   */
  private setupMasterAudioGraph() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Master Output Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);

      // 2. 母帶級動態壓限器 (DynamicsCompressorNode)
      // 消除多重音效疊加產生的數位爆音 (Pops/Clicks) 與削波失真 (Clipping)
      this.dynamicsCompressor = this.ctx.createDynamicsCompressor();
      this.dynamicsCompressor.threshold.setValueAtTime(-14, now);  // -14dB 開始平滑壓限
      this.dynamicsCompressor.knee.setValueAtTime(8, now);         // 8dB 軟拐點過渡
      this.dynamicsCompressor.ratio.setValueAtTime(5, now);        // 5:1 緊實動態控制
      this.dynamicsCompressor.attack.setValueAtTime(0.003, now);   // 3ms 極速瞬態捕捉
      this.dynamicsCompressor.release.setValueAtTime(0.18, now);   // 180ms 自然回彈釋放

      // 3. 聲學濾波器 (過濾次低頻隆隆聲與刺耳高頻超音波)
      this.highpassFilter = this.ctx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.setValueAtTime(30, now);

      this.lowpassFilter = this.ctx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.setValueAtTime(14500, now);
      this.lowpassFilter.Q.setValueAtTime(0.707, now);

      // 4. 乾聲母線 (Dry Bus)
      this.dryBus = this.ctx.createGain();
      this.dryBus.gain.setValueAtTime(0.82, now);

      // 5. 濕聲母線 (Wet Bus) 與 卷積殘響器 (ConvolverNode)
      this.wetBus = this.ctx.createGain();
      this.wetBus.gain.setValueAtTime(0.24, now); // 預設 24% 演藝廳殘響比例

      this.masterConvolver = this.ctx.createConvolver();
      // 生成慈大附中演藝廳專屬空間脈衝響應 (TCUSH Auditorium IR)
      this.generateHallImpulseResponse(1.35, 2.75);

      // 連接音訊鏈
      // Convolver -> WetBus
      this.masterConvolver.connect(this.wetBus);

      // DryBus & WetBus -> Highpass -> Lowpass -> Compressor -> MasterGain -> Destination
      this.dryBus.connect(this.highpassFilter);
      this.wetBus.connect(this.highpassFilter);

      this.highpassFilter.connect(this.lowpassFilter);
      this.lowpassFilter.connect(this.dynamicsCompressor);
      this.dynamicsCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio graph initialization fallback
    }
  }

  /**
   * 根據「慈大附中演藝廳」鏡框式舞台（Proscenium）、木質擴散壁與絨布座椅物理聲學，
   * 演算法合成高度逼真的立體聲空間脈衝響應 (Synthetic Auditorium Impulse Response)
   * 
   * @param durationSec 殘響衰減時間 (RT60)，預設 1.35s
   * @param decayRate 指數衰減率，預設 2.75
   */
  public generateHallImpulseResponse(durationSec: number = 1.35, decayRate: number = 2.75): AudioBuffer | null {
    if (!this.ctx) return null;
    try {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * durationSec);
      const impulseBuffer = this.ctx.createBuffer(2, length, sampleRate);
      const leftChannel = impulseBuffer.getChannelData(0);
      const rightChannel = impulseBuffer.getChannelData(1);

      // 模擬演藝廳空間：早期離散反射 (Early Reflections) + 擴散混響尾音 (Diffuse Late Field)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * decayRate);

        // 早期反射聲 (模拟舞台兩側反射板與後牆回波)
        let earlyReflections = 0;
        if (i < sampleRate * 0.08) {
          const delayTaps = [0.012, 0.023, 0.038, 0.054, 0.071];
          delayTaps.forEach((tapTime, idx) => {
            const tapSample = Math.floor(tapTime * sampleRate);
            if (i === tapSample) {
              earlyReflections += (idx % 2 === 0 ? 0.45 : -0.35) * Math.pow(0.7, idx);
            }
          });
        }

        // 高頻吸音阻尼 (Air Absorption & Wood Wall High Damping)
        const highDamp = Math.exp(-t * 1.8);
        const noiseL = (Math.random() * 2 - 1) * highDamp;
        const noiseR = (Math.random() * 2 - 1) * highDamp;

        leftChannel[i] = (noiseL * 0.85 + earlyReflections * 0.5) * envelope;
        rightChannel[i] = (noiseR * 0.85 + earlyReflections * -0.5) * envelope;
      }

      if (this.masterConvolver) {
        this.masterConvolver.buffer = impulseBuffer;
        this.isIRLoaded = true;
        this.irName = `慈大附中演藝廳 (${durationSec}s RT60)`;
      }

      return impulseBuffer;
    } catch {
      return null;
    }
  }

  /**
   * 支援外部載入真實測量錄製的演藝廳 IR 音訊檔 (.wav / .mp3)
   */
  public async loadImpulseResponse(audioSource: string | ArrayBuffer): Promise<boolean> {
    this.initAudio();
    if (!this.ctx || !this.masterConvolver) return false;

    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof audioSource === 'string') {
        const response = await fetch(audioSource);
        arrayBuffer = await response.arrayBuffer();
      } else {
        arrayBuffer = audioSource;
      }

      const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.masterConvolver.buffer = decodedBuffer;
      this.isIRLoaded = true;
      this.irName = '自定義外部演藝廳 IR 檔案';
      return true;
    } catch {
      // 若載入失敗，降級使用演算法生成的演藝廳 IR
      this.generateHallImpulseResponse(1.35, 2.75);
      return false;
    }
  }

  /**
   * 取得殘響狀態與目前 IR 名稱
   */
  public getAcousticInfo() {
    return {
      isLoaded: this.isIRLoaded,
      hallName: this.irName,
      wetLevel: this.wetBus?.gain.value ?? 0.24,
      dryLevel: this.dryBus?.gain.value ?? 0.82,
      compressorThreshold: this.dynamicsCompressor?.threshold.value ?? -14,
    };
  }

  /**
   * 設定演藝廳空間殘響濕度比例 (0.0 ~ 1.0)
   */
  public setReverbWetLevel(wetLevel: number) {
    const clamped = Math.max(0, Math.min(1, wetLevel));
    if (this.wetBus && this.ctx) {
      this.wetBus.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * 建立具備立體聲向定位與演藝廳殘響發送的音效通道節點
   */
  public createSpatialVoice(options?: SpatialAudioOptions): {
    input: GainNode;
    panner: StereoPannerNode | null;
  } | null {
    this.initAudio();
    if (!this.ctx || !this.dryBus || !this.masterConvolver) return null;

    try {
      const now = this.ctx.currentTime;
      const inputGain = this.ctx.createGain();
      inputGain.gain.setValueAtTime(options?.volume ?? 1.0, now);

      let pannerNode: StereoPannerNode | null = null;
      if (typeof this.ctx.createStereoPanner === 'function') {
        pannerNode = this.ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, options?.pan ?? 0)), now);
        inputGain.connect(pannerNode);
      }

      const outputSource: AudioNode = pannerNode || inputGain;

      // 乾聲發送
      outputSource.connect(this.dryBus);

      // 演藝廳殘響發送
      const sendGain = this.ctx.createGain();
      const reverbAmount = Math.max(0, Math.min(1, options?.reverbSend ?? 0.35));
      sendGain.gain.setValueAtTime(reverbAmount, now);

      outputSource.connect(sendGain);
      sendGain.connect(this.masterConvolver);

      return { input: inputGain, panner: pannerNode };
    } catch {
      return null;
    }
  }

  // ========================================================================
  // 🔊 系統音量與動態避讓 (Ducking)
  // ========================================================================

  public getCurrentTheme(): MusicTheme {
    return this.currentTheme;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public duck(targetVol: number = 0.25) {
    this.isDucked = true;
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(targetVol * this.volume, this.ctx.currentTime, 0.15);
    }
  }

  public unduck() {
    this.isDucked = false;
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.2);
    }
  }

  public toggle(theme?: MusicTheme): boolean {
    triggerHaptic('medium');
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      if (theme) this.currentTheme = theme;
      this.start();
      return true;
    }
  }

  // ========================================================================
  // 🎼 交響樂劇院配樂引擎 (Theatrical BGM)
  // ========================================================================

  public start(theme?: MusicTheme) {
    this.initAudio();
    if (!this.ctx) return;
    if (theme) this.currentTheme = theme;

    this.stop();
    this.isPlaying = true;

    if (this.currentTheme === 'overture') {
      this.playOvertureLoop();
    } else if (this.currentTheme === 'people_sing') {
      this.playPeopleSingLoop();
    } else {
      this.playDreamLoop();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playOvertureLoop() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.3 });
    if (!voice) return;

    // Prologue / Look Down motif (D Minor)
    const notes = [
      { f: 293.66, dur: 0.45, b: 73.42 },  // D4 / D2
      { f: 349.23, dur: 0.45, b: 73.42 },  // F4
      { f: 392.00, dur: 0.50, b: 98.00 },  // G4 / G2
      { f: 440.00, dur: 0.90, b: 110.00 }, // A4 / A2
      { f: 392.00, dur: 0.45, b: 98.00 },  // G4
      { f: 349.23, dur: 0.45, b: 87.31 },  // F4 / F2
      { f: 293.66, dur: 1.10, b: 73.42 },  // D4 / D2
    ];

    let t = now;
    notes.forEach((n) => {
      // Lead Horn
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur * 0.95);
      osc.connect(g);
      g.connect(voice.input);
      osc.start(t);
      osc.stop(t + n.dur);

      // Sub Bass
      if (n.b) {
        const bOsc = this.ctx!.createOscillator();
        const bG = this.ctx!.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(n.b, t);
        bG.gain.setValueAtTime(0.0001, t);
        bG.gain.linearRampToValueAtTime(0.09, t + 0.03);
        bG.gain.exponentialRampToValueAtTime(0.0001, t + n.dur * 0.9);
        bOsc.connect(bG);
        bG.connect(voice.input);
        bOsc.start(t);
        bOsc.stop(t + n.dur);
      }

      t += n.dur;
    });

    const totalDur = notes.reduce((acc, curr) => acc + curr.dur, 0);
    this.bgmTimer = window.setTimeout(() => this.playOvertureLoop(), (totalDur + 0.5) * 1000);
  }

  private playPeopleSingLoop() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.35 });
    if (!voice) return;

    // "Do You Hear the People Sing" (F Major Cadence)
    const melody = [
      { f: 349.23, dur: 0.28, b: 87.31 },  // F4 / F2
      { f: 440.00, dur: 0.28, b: 87.31 },  // A4
      { f: 523.25, dur: 0.38, b: 130.81 }, // C5 / C3
      { f: 523.25, dur: 0.28, b: 130.81 }, // C5
      { f: 587.33, dur: 0.42, b: 110.00 }, // D5 / A2
      { f: 523.25, dur: 0.32, b: 130.81 }, // C5 / C3
      { f: 440.00, dur: 0.32, b: 87.31 },  // A4 / F2
      { f: 349.23, dur: 0.32, b: 87.31 },  // F4
      { f: 392.00, dur: 0.28, b: 98.00 },  // G4 / G2
      { f: 440.00, dur: 0.28, b: 98.00 },  // A4
      { f: 466.16, dur: 0.36, b: 116.54 }, // Bb4 / Bb2
      { f: 440.00, dur: 0.36, b: 110.00 }, // A4 / A2
      { f: 392.00, dur: 0.38, b: 98.00 },  // G4 / G2
      { f: 349.23, dur: 0.65, b: 87.31 },  // F4 / F2 (Full hold)
    ];

    let t = now;
    melody.forEach((m) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + m.dur * 0.95);
      osc.connect(g);
      g.connect(voice.input);
      osc.start(t);
      osc.stop(t + m.dur);

      if (m.b) {
        const bOsc = this.ctx!.createOscillator();
        const bG = this.ctx!.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(m.b, t);
        bG.gain.setValueAtTime(0.0001, t);
        bG.gain.linearRampToValueAtTime(0.08, t + 0.03);
        bG.gain.exponentialRampToValueAtTime(0.0001, t + m.dur * 0.9);
        bOsc.connect(bG);
        bG.connect(voice.input);
        bOsc.start(t);
        bOsc.stop(t + m.dur);
      }

      t += m.dur;
    });

    const totalDur = melody.reduce((acc, curr) => acc + curr.dur, 0);
    this.bgmTimer = window.setTimeout(() => this.playPeopleSingLoop(), (totalDur + 0.6) * 1000);
  }

  private playDreamLoop() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.45 });
    if (!voice) return;

    // "I Dreamed a Dream" (Gb Major -> Eb Minor Theme)
    const melody = [
      { f: 369.99, dur: 0.65, b: 92.50 },  // F#4 / F#2
      { f: 415.30, dur: 0.65, b: 92.50 },  // G#4
      { f: 466.16, dur: 0.90, b: 116.54 }, // A#4 / A#2
      { f: 415.30, dur: 0.65, b: 92.50 },  // G#4
      { f: 369.99, dur: 0.65, b: 92.50 },  // F#4
      { f: 311.13, dur: 1.30, b: 77.78 },  // D#4 / D#2
    ];

    let t = now;
    melody.forEach((m) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(m.f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + m.dur * 0.95);
      osc.connect(g);
      g.connect(voice.input);
      osc.start(t);
      osc.stop(t + m.dur);

      if (m.b) {
        const bOsc = this.ctx!.createOscillator();
        const bG = this.ctx!.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(m.b, t);
        bG.gain.setValueAtTime(0.0001, t);
        bG.gain.linearRampToValueAtTime(0.07, t + 0.06);
        bG.gain.exponentialRampToValueAtTime(0.0001, t + m.dur * 0.9);
        bOsc.connect(bG);
        bG.connect(voice.input);
        bOsc.start(t);
        bOsc.stop(t + m.dur);
      }

      t += m.dur;
    });

    const totalDur = melody.reduce((acc, curr) => acc + curr.dur, 0);
    this.bgmTimer = window.setTimeout(() => this.playDreamLoop(), (totalDur + 1.0) * 1000);
  }

  // ========================================================================
  // 🔔 劇院級互動音效 (Theatrical Interactive SFX)
  // ========================================================================

  // 1. Button Click (Woodblock Resonance)
  public playButtonClickSFX() {
    triggerHaptic('light');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.15, volume: 0.14 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(voice.input);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // 2. Card / Poster Click (Velvet Stage Curtain Thud)
  public playCardClickSFX() {
    triggerHaptic('selection');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.25, volume: 0.16 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(voice.input);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  // 3. Page Flip (Stage Script Paper Rustle)
  public playPageFlipSFX() {
    triggerHaptic('light');
    const voice = this.createSpatialVoice({ pan: 0.1, reverbSend: 0.2, volume: 0.12 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(1.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(voice.input);

      noise.start(now);
    } catch {}
  }

  // 4. Grand Gong / Curtains Open (Cathedral Bell & Gong Resonance)
  public playGongSFX() {
    triggerHaptic('heavy');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.5, volume: 0.26 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [110, 164.81, 220, 329.63]; // A2, E3, A3, E4

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24 / (idx + 1), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.connect(gain);
        gain.connect(voice.input);

        osc.start(now);
        osc.stop(now + 1.7);
      });
    } catch {}
  }

  // 5. Theme Switch (Parisian Accordion Chime)
  public playThemeSwitchSFX(theme?: string | boolean) {
    triggerHaptic('medium');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.35, volume: 0.16 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      let notes = [440, 554.37, 659.25]; // A Major

      if (theme === false || theme === 'dark' || theme === 'midnight') {
        notes = [329.63, 392.00, 493.88]; // E Minor
      } else if (theme === 'barricade') {
        notes = [349.23, 440.00, 523.25]; // F Major
      }

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.28);

        osc.connect(gain);
        gain.connect(voice.input);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.3);
      });
    } catch {}
  }

  // 6. Character Intro SFX (Orchestral Harp Pluck)
  public playCharacterIntroSFX() {
    triggerHaptic('medium');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.4, volume: 0.18 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const arpeggio = [293.66, 369.99, 440.00, 587.33]; // D Major Harp Sweep
      arpeggio.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.001, now + idx * 0.045);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.045 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.55);

        osc.connect(gain);
        gain.connect(voice.input);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.6);
      });
    } catch {}
  }

  // 7. Success SFX (Major Triad Shimmer & Stage Fanfare)
  public playSuccessSFX() {
    triggerHaptic('success');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.42, volume: 0.2 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major Triumph
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);

        gain.gain.setValueAtTime(0.001, now + idx * 0.035);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.035 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(voice.input);

        osc.start(now + idx * 0.035);
        osc.stop(now + 0.9);
      });
    } catch {}
  }

  // 8. Revolutionary Drum Roll (Marching Timpani Cadence)
  public playRevolutionDrumRoll() {
    triggerHaptic('heavy');
    const voice = this.createSpatialVoice({ pan: 0, reverbSend: 0.35, volume: 0.22 });
    if (!voice || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const t = now + i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(105, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.05);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18 * (1 + i * 0.1), t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

        osc.connect(gain);
        gain.connect(voice.input);

        osc.start(t);
        osc.stop(t + 0.06);
      }
    } catch {}
  }

  // ========================================================================
  // 9. Spatial Ambient Audio Drone & Scroll Cross-Fade Engine
  // ========================================================================
  public isSpatialSoundscapeActive(): boolean {
    return this.isSoundscapePlaying;
  }

  public toggleSpatialSoundscape(): boolean {
    if (this.isSoundscapePlaying) {
      this.stopSpatialSoundscape();
      return false;
    } else {
      this.startSpatialSoundscape();
      return true;
    }
  }

  public startSpatialSoundscape() {
    this.initAudio();
    if (!this.ctx || this.isSoundscapePlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.isSoundscapePlaying = true;

      // 1. Dynamic Cutoff Filter
      this.soundscapeFilter = this.ctx.createBiquadFilter();
      this.soundscapeFilter.type = 'lowpass';
      this.soundscapeFilter.frequency.setValueAtTime(650, now);
      this.soundscapeFilter.Q.setValueAtTime(1.8, now);

      // 2. Gain Envelope
      this.soundscapeGain = this.ctx.createGain();
      this.soundscapeGain.gain.setValueAtTime(0.0001, now);
      this.soundscapeGain.gain.exponentialRampToValueAtTime(0.18, now + 2.5);

      // 3. Dual Warm Analog Oscillators (65.4Hz C2 & 98.0Hz G2 fifth harmonic)
      this.soundscapeOsc1 = this.ctx.createOscillator();
      this.soundscapeOsc1.type = 'sawtooth';
      this.soundscapeOsc1.frequency.setValueAtTime(65.41, now);

      this.soundscapeOsc2 = this.ctx.createOscillator();
      this.soundscapeOsc2.type = 'sine';
      this.soundscapeOsc2.frequency.setValueAtTime(97.99, now);

      // Detune slightly for subtle analog chorus beating
      this.soundscapeOsc1.detune.setValueAtTime(-4, now);
      this.soundscapeOsc2.detune.setValueAtTime(4, now);

      // 4. Subtle Wind Atmosphere Noise Layer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.04;
      }

      this.soundscapeNoiseNode = this.ctx.createBufferSource();
      this.soundscapeNoiseNode.buffer = noiseBuffer;
      this.soundscapeNoiseNode.loop = true;

      // Connect graph: Oscs & Noise -> Filter -> Gain -> (Dry & Reverb)
      this.soundscapeOsc1.connect(this.soundscapeFilter);
      this.soundscapeOsc2.connect(this.soundscapeFilter);
      this.soundscapeNoiseNode.connect(this.soundscapeFilter);

      this.soundscapeFilter.connect(this.soundscapeGain);
      if (this.dryBus) this.soundscapeGain.connect(this.dryBus);
      if (this.wetBus) this.soundscapeGain.connect(this.wetBus);

      this.soundscapeOsc1.start(now);
      this.soundscapeOsc2.start(now);
      this.soundscapeNoiseNode.start(now);
    } catch (e) {
      console.warn('Failed to start spatial soundscape:', e);
      this.isSoundscapePlaying = false;
    }
  }

  public stopSpatialSoundscape() {
    if (!this.ctx || !this.isSoundscapePlaying) return;
    try {
      const now = this.ctx.currentTime;
      if (this.soundscapeGain) {
        this.soundscapeGain.gain.setValueAtTime(this.soundscapeGain.gain.value, now);
        this.soundscapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      }
      setTimeout(() => {
        try {
          this.soundscapeOsc1?.stop();
          this.soundscapeOsc2?.stop();
          this.soundscapeNoiseNode?.stop();
          this.soundscapeOsc1?.disconnect();
          this.soundscapeOsc2?.disconnect();
          this.soundscapeNoiseNode?.disconnect();
        } catch {}
        this.isSoundscapePlaying = false;
      }, 1250);
    } catch {}
  }

  /**
   * Modulates soundscape cutoff filter and wet/dry balance based on normalized page scroll progress (0.0 ~ 1.0)
   */
  public updateScrollSpatialAcoustics(progress: number) {
    if (!this.ctx || !this.isSoundscapePlaying || !this.soundscapeFilter) return;
    try {
      const now = this.ctx.currentTime;
      // Progress 0.0 (Hero top) -> 1200Hz airy presence
      // Progress 0.4 (Story/Cast) -> 750Hz focused resonance
      // Progress 1.0 (Tickets/Venue) -> 320Hz deep acoustic body
      const clamped = Math.max(0, Math.min(1, progress));
      const targetFreq = 1200 - clamped * 850;
      this.soundscapeFilter.frequency.setTargetAtTime(targetFreq, now, 0.2);

      if (this.wetBus && this.dryBus) {
        // Deeper in the page = more cathedral proscenium reverb
        const targetWet = 0.2 + clamped * 0.35;
        this.wetBus.gain.setTargetAtTime(targetWet, now, 0.3);
      }
    } catch {}
  }

  public cleanup() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

// 導出向後相容別名與實例
export const TheatricalAudioEngine = TheatreAudioEngine;
export const theatreAudio = new TheatreAudioEngine();
export const ambientSynth = theatreAudio;
