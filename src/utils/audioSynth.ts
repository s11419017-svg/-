// Web Audio API Ambient Musical Synth & Theater Sound Effects Engine
export type MusicTheme = 'overture' | 'people_sing' | 'dream';

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private currentTheme: MusicTheme = 'overture';
  private masterGainNode: GainNode | null = null;
  private volume: number = 0.3; // 0.0 to 1.0

  public getCurrentTheme(): MusicTheme {
    return this.currentTheme;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public toggle(theme?: MusicTheme): boolean {
    if (this.isPlaying && (!theme || theme === this.currentTheme)) {
      this.stop();
      return false;
    } else {
      if (theme) this.currentTheme = theme;
      this.start();
      return true;
    }
  }

  public switchTheme(theme: MusicTheme) {
    this.currentTheme = theme;
    if (this.isPlaying) {
      if (this.timer) window.clearInterval(this.timer);
      this.playThemeSequence();
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGainNode) {
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public start() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      this.isPlaying = true;
      if (this.timer) window.clearInterval(this.timer);
      this.playThemeSequence();
    } catch (e) {
      console.warn('AudioContext failed to start:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGainNode = null;
    }
  }

  private playThemeSequence() {
    if (!this.isPlaying || !this.ctx || !this.masterGainNode) return;

    if (this.currentTheme === 'people_sing') {
      this.playPeopleSingMotif();
    } else if (this.currentTheme === 'dream') {
      this.playDreamMotif();
    } else {
      this.playOvertureMotif();
    }
  }

  // 1. Overture & Look Down Motif (Dramatic D Minor)
  private playOvertureMotif() {
    const chords = [
      [146.83, 220.00, 261.63, 293.66], // Dm (D3, A3, C4, D4)
      [116.54, 233.08, 293.66, 349.23], // Bb (Bb2, Bb3, D4, F4)
      [130.81, 196.00, 261.63, 329.63], // C/E (C3, G3, C4, E4)
      [146.83, 220.00, 293.66, 349.23], // Dm (D3, A3, D4, F4)
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGainNode) return;

      const currentNotes = chords[step % chords.length];
      const now = this.ctx.currentTime;

      currentNotes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sawtooth' : idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };

        osc.start(now + idx * 0.12);
        osc.stop(now + 4.5);
      });

      step++;
    };

    playStep();
    this.timer = window.setInterval(playStep, 4200);
  }

  // 2. "Do You Hear the People Sing?" Anthem Motif (Bright F Major)
  private playPeopleSingMotif() {
    const melody = [
      { notes: [174.61, 349.23, 440.00], duration: 1.0 }, // F4, A4
      { notes: [196.00, 392.00, 493.88], duration: 1.0 }, // G4, B4
      { notes: [220.00, 440.00, 523.25], duration: 1.2 }, // A4, C5
      { notes: [233.08, 466.16, 587.33], duration: 1.2 }, // Bb4, D5
      { notes: [261.63, 523.25, 659.25], duration: 1.6 }, // C5, E5
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGainNode) return;

      const item = melody[step % melody.length];
      const now = this.ctx.currentTime;

      item.notes.forEach((freq) => {
        if (!this.ctx || !this.masterGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + item.duration + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };

        osc.start(now);
        osc.stop(now + item.duration + 0.6);
      });

      step++;
    };

    playStep();
    this.timer = window.setInterval(playStep, 2400);
  }

  // 3. "I Dreamed a Dream" Lyrical Arpeggio Motif (Gentle C Major)
  private playDreamMotif() {
    const arpeggios = [
      [261.63, 329.63, 392.00, 523.25], // C
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 220.00, 261.63, 349.23], // F
      [196.00, 246.94, 293.66, 392.00], // G
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGainNode) return;

      const notes = arpeggios[step % arpeggios.length];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.3);

        gain.gain.setValueAtTime(0.001, now + idx * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.018, now + idx * 0.3 + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.3 + 3.0);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };

        osc.start(now + idx * 0.3);
        osc.stop(now + idx * 0.3 + 3.2);
      });

      step++;
    };

    playStep();
    this.timer = window.setInterval(playStep, 3800);
  }

  // ==========================================
  // UI INTERACTIVE SOUND EFFECTS (SFX)
  // ==========================================

  // Seat Select SFX: Crisp velvet seat click tone
  public playSeatSelectSFX() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Ticket Booking Confirmed Fanfare SFX
  public playTicketSuccessSFX() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Major triad fanfare: C4 -> E4 -> G4 -> C5
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.4);
      });
    } catch (e) {}
  }

  // Card Open / Parchment Flip Chime SFX
  public playCardClickSFX() {
    this.playPageFlipSFX();
  }

  // Realistic Paper Page Flip / Parchment Rustle Acoustic Sound Effect
  public playPageFlipSFX() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const duration = 0.28;

      // 1. Create White Noise Buffer for paper friction texture
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // 2. Bandpass filter for paper frequency texture (sweeping from high to mid-low)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2800, now);
      bandpass.frequency.exponentialRampToValueAtTime(700, now + duration);
      bandpass.Q.setValueAtTime(1.8, now);

      // 3. Lowpass filter to soften harsh high-end noise
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(4500, now);
      lowpass.frequency.linearRampToValueAtTime(1800, now + duration);

      // 4. Envelope gain for realistic paper sliding
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // 5. Soft parchment landing thump & gentle melodic chime
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(180, now + 0.06);
      thump.frequency.exponentialRampToValueAtTime(60, now + duration);

      thumpGain.gain.setValueAtTime(0.0001, now);
      thumpGain.gain.setValueAtTime(0.02, now + 0.06);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);

      // High-pitched subtle chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(523.25, now);
      chime.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      chimeGain.gain.setValueAtTime(0.015, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      noiseSource.onended = () => {
        try {
          noiseSource.disconnect();
          bandpass.disconnect();
          lowpass.disconnect();
          noiseGain.disconnect();
        } catch (e) {}
      };

      thump.onended = () => {
        try {
          thump.disconnect();
          thumpGain.disconnect();
        } catch (e) {}
      };

      chime.onended = () => {
        try {
          chime.disconnect();
          chimeGain.disconnect();
        } catch (e) {}
      };

      noiseSource.start(now);
      noiseSource.stop(now + duration);
      thump.start(now + 0.06);
      thump.stop(now + duration);
      chime.start(now);
      chime.stop(now + 0.22);
    } catch (e) {}
  }

  // General Tactile Micro-Click SFX
  public playButtonClickSFX() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }
}

export const ambientSynth = new AudioSynthEngine();
