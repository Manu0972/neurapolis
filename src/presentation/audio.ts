/**
 * NEURAPOLIS — Moteur de synthèse procédurale Web Audio.
 * 100% procédural : aucun asset audio externe (mp3/wav/ogg).
 * Bruits de pas selon la surface, bips d'interface, encaissement,
 * nappes d'ambiance selon le lieu, et jingles fantômes / chapitres.
 *
 * Résilient : no-op propre en environnement sans AudioContext (Node.js/Vitest).
 */

export type SurfaceType = 'pave' | 'herbe' | 'parquet' | 'terre' | 'sol';
export type AmbientLocation = 'maison' | 'ville' | 'parc' | 'atelier' | 'college' | 'epicerie' | 'place' | 'silence';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private currentAmbientLocation: AmbientLocation = 'silence';
  private ambientNodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    filters: BiquadFilterNode[];
    noiseSource?: AudioBufferSourceNode;
    intervalId?: number;
  } = { oscillators: [], gains: [], filters: [] };

  private muted = false;
  private masterVolume = 0.6;
  private sfxVolume = 0.7;
  private ambientVolume = 0.4;
  private initialized = false;

  public init(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);
      }
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.initialized || !this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMasterVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * BRUITS DE PAS SELON SURFACE (synthèse granulaire/filtrée)
   * ───────────────────────────────────────────────────────────── */
  public playFootstep(surface: SurfaceType = 'pave'): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;

    if (surface === 'parquet') {
      // Résonance bois chaleureuse (triangles accordés + impact feutré)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 20, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } else if (surface === 'herbe') {
      // Froissement végétal doux (bruit passe-bande)
      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 200, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(t);
    } else if (surface === 'terre') {
      // Impact sourd et granuleux
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100 + Math.random() * 15, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    } else {
      // 'pave' / 'sol' : claquement sec sur pierre
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * BIPS ET EFFETS D'INTERFACE & ÉCONOMIE
   * ───────────────────────────────────────────────────────────── */
  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.03);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  public playCoin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    // Carillon doré 2 notes (B5 -> E6)
    const tones = [987.77, 1318.51];
    tones.forEach((freq, idx) => {
      const start = t + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  public playGhostArrival(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    // Accord mystique & spectral (La mineur 9 éthéré : A3, C4, E4, B4)
    const chord = [220.0, 261.63, 329.63, 493.88];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // subtil vibrato spectral
      osc.frequency.setValueCurveAtTime(new Float32Array([freq, freq + 3, freq - 2, freq]), t, 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300 + i * 150, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
      filter.frequency.exponentialRampToValueAtTime(200, t + 1.4);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16 / (i + 1), t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  public playGhostDebate(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    // Pulsation d'idées : 3 accords rapides résonnants
    const freqs = [349.23, 440.0, 523.25]; // F4, A4, C5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.3);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  public playChapterComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    // Fanfare chaleureuse et réconfortante Hygge (C4 - E4 - G4 - C5 arpeggiated)
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.24, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (idx === notes.length - 1 ? 0.9 : 0.4));

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(noteTime);
      osc.stop(noteTime + (idx === notes.length - 1 ? 1.0 : 0.45));
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * NAPPES D'AMBIANCE PROCÉDURALES PAR LIEU
   * ───────────────────────────────────────────────────────────── */
  public setAmbient(location: AmbientLocation): void {
    if (this.currentAmbientLocation === location) return;
    this.stopAmbient();
    this.currentAmbientLocation = location;
    if (location === 'silence') return;

    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;

    const t = ctx.currentTime;

    if (location === 'maison') {
      // Sérénité Hygge : bourdonnement doux, harmoniques chaleureuses (~1800K)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, t); // A2

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, t); // E3 (quinte douce)

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 1.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc1.start(t);
      osc2.start(t);

      this.ambientNodes.oscillators.push(osc1, osc2);
      this.ambientNodes.gains.push(gain);
      this.ambientNodes.filters.push(filter);
    } else if (location === 'parc') {
      // Brise de vent douce dans les arbres
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const val = (lastOut + 0.02 * white) / 1.02; // bruit rose/brun
        data[i] = val;
        lastOut = val;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.Q.setValueAtTime(1.2, t);

      // Modulation lente du vent
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2, t);
      lfoGain.gain.setValueAtTime(150, t);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 2.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      lfo.start(t);
      noise.start(t);

      this.ambientNodes.oscillators.push(lfo);
      this.ambientNodes.noiseSource = noise;
      this.ambientNodes.gains.push(gain, lfoGain);
      this.ambientNodes.filters.push(filter);
    } else if (location === 'atelier' || location === 'friche' as any) {
      // Atelier en activité : vibration mécanique basse + cliquetis périodiques
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, t); // A1

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 1.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(t);

      this.ambientNodes.oscillators.push(osc);
      this.ambientNodes.gains.push(gain);
      this.ambientNodes.filters.push(filter);
    } else if (location === 'college' || location === 'epicerie' || location === 'place' || location === 'ville') {
      // Rumeur de vie urbaine et de quartier
      const osc1 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(130.81, t); // C3

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 1.5);

      osc1.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);
      osc1.start(t);

      this.ambientNodes.oscillators.push(osc1);
      this.ambientNodes.gains.push(gain);
      this.ambientNodes.filters.push(filter);
    }
  }

  public stopAmbient(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const g of this.ambientNodes.gains) {
      try {
        g.gain.setTargetAtTime(0, t, 0.4);
      } catch {}
    }
    const nodes = { ...this.ambientNodes };
    this.ambientNodes = { oscillators: [], gains: [], filters: [] };

    setTimeout(() => {
      for (const osc of nodes.oscillators) {
        try { osc.stop(); osc.disconnect(); } catch {}
      }
      if (nodes.noiseSource) {
        try { nodes.noiseSource.stop(); nodes.noiseSource.disconnect(); } catch {}
      }
      if (nodes.intervalId) {
        clearInterval(nodes.intervalId);
      }
    }, 600);

    this.currentAmbientLocation = 'silence';
  }
}

export const audio = new SoundEngine();
