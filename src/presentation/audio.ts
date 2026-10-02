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

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private sharedNoiseBuffer: AudioBuffer | null = null;

  private currentAmbientLocation: AmbientLocation = 'silence';
  private currentAmbientHour = 12;
  private currentAmbientMeteo?: string;
  private currentIsNight = false;
  private currentIsGoldenHour = false;
  private currentIsRain = false;

  private ambientNodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    filters: BiquadFilterNode[];
    noiseSources: AudioBufferSourceNode[];
    noiseSource?: AudioBufferSourceNode;
    intervalId?: number;
  } = { oscillators: [], gains: [], filters: [], noiseSources: [] };

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

      // Pré-allocation du buffer de bruit partagé (1 seconde) pour les pas d'herbe et ambiances
      if (!this.sharedNoiseBuffer) {
        const noiseDuration = 1.0;
        const bufferSize = Math.floor(this.ctx.sampleRate * noiseDuration);
        this.sharedNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.sharedNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.25;
        }
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

  private getOrCreateSharedNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.sharedNoiseBuffer || this.sharedNoiseBuffer.sampleRate !== ctx.sampleRate) {
      const bufferSize = Math.floor(ctx.sampleRate * 1.0);
      this.sharedNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = this.sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
    }
    return this.sharedNoiseBuffer;
  }

  public getSharedNoiseBuffer(): AudioBuffer | null {
    return this.sharedNoiseBuffer;
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
      // Résonance bois chaleureuse (triangle 140 Hz -> 70 Hz, lowpass 450 Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + (Math.random() * 10 - 5), t);
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
      // Froissement végétal doux (bruit partagé pré-alloué passe-bande 1100-1500 Hz, centré ~1300 Hz)
      const buffer = this.getOrCreateSharedNoiseBuffer(ctx);
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const offset = Math.random() * Math.max(0, buffer.duration - 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100 + Math.random() * 400, t); // 1100 - 1500 Hz
      filter.Q.setValueAtTime(2.0, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(t, offset, 0.07);
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
      // 'pave' / 'sol' : claquement sec sur pierre (triangle 340 Hz -> 90 Hz, highpass 200 Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + (Math.random() * 20 - 10), t);
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

  /** Validation d'objectif ou d'étape stratégique (carillon ascendant 3 notes : Sol4 392.00 Hz, Do5 523.25 Hz, Sol5 783.99 Hz avec décroissance exponentielle). */
  public playObjectiveComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    const notes = [392.00, 523.25, 783.99]; // G4, C5, G5
    notes.forEach((freq, i) => {
      const st = t + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.22, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(st);
      osc.stop(st + 0.28);
    });
  }

  /** Alerte de marché / choc macroéconomique (2 impulsions descendantes triton D5 587.33 Hz -> Bb4 466.16 Hz avec balayage passe-bas 900 Hz -> 300 Hz). */
  public playMarketAlert(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;

    const t = ctx.currentTime;
    const tones = [587.33, 466.16]; // D5 -> Bb4 (impulsions descendantes)
    tones.forEach((freq, i) => {
      const st = t + i * 0.12;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, st);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, st);
      filter.frequency.exponentialRampToValueAtTime(300, st + 0.18);

      gain.gain.setValueAtTime(0.18, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(st);
      osc.stop(st + 0.2);
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * NAPPES D'AMBIANCE PROCÉDURALES PAR LIEU, HEURE ET MÉTÉO
   * ───────────────────────────────────────────────────────────── */
  public setAmbient(location: AmbientLocation): void {
    this.updateAmbient(location, this.currentAmbientHour, this.currentAmbientMeteo);
  }

  public updateAmbient(location: AmbientLocation, hour: number = 12, meteo?: string): void {
    const isNight = hour < 6 || hour >= 21;
    const isGoldenHour = hour >= 17 && hour <= 20;
    const isRain = meteo === 'pluie';

    // Optimisation : si la configuration d'ambiance n'a pas varié, ne pas reconstruire les oscillateurs
    if (
      this.currentAmbientLocation === location &&
      this.currentIsNight === isNight &&
      this.currentIsGoldenHour === isGoldenHour &&
      this.currentIsRain === isRain
    ) {
      this.currentAmbientHour = hour;
      this.currentAmbientMeteo = meteo;
      return;
    }

    this.stopAmbient();
    this.currentAmbientLocation = location;
    this.currentAmbientHour = hour;
    this.currentAmbientMeteo = meteo;
    this.currentIsNight = isNight;
    this.currentIsGoldenHour = isGoldenHour;
    this.currentIsRain = isRain;

    if (location === 'silence') return;

    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;

    const t = ctx.currentTime;

    // 1. Couche de base selon le lieu
    if (location === 'maison') {
      // Sérénité Hygge : bourdonnement doux, harmoniques chaleureuses (~1800K)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, t); // A2

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, t); // E3 (quinte douce 1800K)

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isGoldenHour ? 320 : 280, t);

      const targetGain = isGoldenHour ? 0.18 : 0.12;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(targetGain, t + 1.5);

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
      this.ambientNodes.noiseSources.push(noise);
      this.ambientNodes.gains.push(gain, lfoGain);
      this.ambientNodes.filters.push(filter);
    } else if (location === 'atelier' || (location as string) === 'friche') {
      // Atelier en activité : vibration mécanique basse + cliquetis
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
      // Si nuit (< 6h ou >= 21h), filtre passe-bas atténué sur le drone de quartier
      const droneCutoff = isNight ? 135 : 220;
      filter.frequency.setValueAtTime(droneCutoff, t);

      const droneGain = isNight ? 0.05 : 0.07;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(droneGain, t + 1.5);

      osc1.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);
      osc1.start(t);

      this.ambientNodes.oscillators.push(osc1);
      this.ambientNodes.gains.push(gain);
      this.ambientNodes.filters.push(filter);
    }

    // 2. Harmonique chaude 1800K au crépuscule (17h - 20h)
    if (isGoldenHour && location !== 'maison') {
      const warmOsc = ctx.createOscillator();
      const warmFilter = ctx.createBiquadFilter();
      const warmGain = ctx.createGain();

      warmOsc.type = 'triangle';
      warmOsc.frequency.setValueAtTime(164.81, t); // E3 (quinte douce 1800K)

      warmFilter.type = 'lowpass';
      warmFilter.frequency.setValueAtTime(320, t);

      warmGain.gain.setValueAtTime(0.001, t);
      warmGain.gain.linearRampToValueAtTime(0.10, t + 1.5);

      warmOsc.connect(warmFilter);
      warmFilter.connect(warmGain);
      warmGain.connect(this.ambientGain);

      warmOsc.start(t);

      this.ambientNodes.oscillators.push(warmOsc);
      this.ambientNodes.gains.push(warmGain);
      this.ambientNodes.filters.push(warmFilter);
    }

    // 3. Nuit (< 6h ou >= 21h) : pulsation haute fréquence discrète (grillons à 4500 Hz)
    if (isNight) {
      const cricketOsc = ctx.createOscillator();
      const cricketFilter = ctx.createBiquadFilter();
      const cricketGain = ctx.createGain();

      cricketOsc.type = 'sine';
      cricketOsc.frequency.setValueAtTime(4500, t);

      cricketFilter.type = 'bandpass';
      cricketFilter.frequency.setValueAtTime(4500, t);
      cricketFilter.Q.setValueAtTime(4.0, t);

      // LFO pulsé pour stridulation périodique discrète (5 Hz)
      const cricketLfo = ctx.createOscillator();
      const cricketLfoGain = ctx.createGain();
      cricketLfo.type = 'square';
      cricketLfo.frequency.setValueAtTime(5.0, t);
      cricketLfoGain.gain.setValueAtTime(0.015, t);

      cricketGain.gain.setValueAtTime(0.018, t);

      cricketLfo.connect(cricketLfoGain);
      cricketLfoGain.connect(cricketGain.gain);

      cricketOsc.connect(cricketFilter);
      cricketFilter.connect(cricketGain);
      cricketGain.connect(this.ambientGain);

      cricketOsc.start(t);
      cricketLfo.start(t);

      this.ambientNodes.oscillators.push(cricketOsc, cricketLfo);
      this.ambientNodes.gains.push(cricketGain, cricketLfoGain);
      this.ambientNodes.filters.push(cricketFilter);
    }

    // 4. Météo Pluie : sous-couche procédurale de bruit de pluie
    if (isRain) {
      const rainNoise = ctx.createBufferSource();
      rainNoise.buffer = this.getOrCreateSharedNoiseBuffer(ctx);
      rainNoise.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(850, t);
      rainFilter.Q.setValueAtTime(1.2, t);

      // Modulation lente simulant les averses
      const rainLfo = ctx.createOscillator();
      const rainLfoGain = ctx.createGain();
      rainLfo.type = 'sine';
      rainLfoGain.gain.setValueAtTime(150, t);
      rainLfo.frequency.setValueAtTime(0.3, t);
      rainLfo.connect(rainLfoGain);
      rainLfoGain.connect(rainFilter.frequency);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.001, t);
      rainGain.gain.linearRampToValueAtTime(0.12, t + 1.0);

      rainNoise.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.ambientGain);

      rainNoise.start(t);
      rainLfo.start(t);

      this.ambientNodes.noiseSources.push(rainNoise);
      this.ambientNodes.oscillators.push(rainLfo);
      this.ambientNodes.gains.push(rainGain, rainLfoGain);
      this.ambientNodes.filters.push(rainFilter);
    }
  }

  public stopAmbient(): void {
    this.currentAmbientLocation = 'silence';
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const g of this.ambientNodes.gains) {
      try {
        g.gain.setTargetAtTime(0, t, 0.4);
      } catch {}
    }
    const nodes = { ...this.ambientNodes };
    this.ambientNodes = { oscillators: [], gains: [], filters: [], noiseSources: [] };

    setTimeout(() => {
      for (const osc of nodes.oscillators) {
        try { osc.stop(); osc.disconnect(); } catch {}
      }
      for (const src of nodes.noiseSources) {
        try { src.stop(); src.disconnect(); } catch {}
      }
      if (nodes.noiseSource) {
        try { nodes.noiseSource.stop(); nodes.noiseSource.disconnect(); } catch {}
      }
      if (nodes.intervalId) {
        clearInterval(nodes.intervalId);
      }
    }, 600);
  }
}

export const audio = new SoundEngine();
