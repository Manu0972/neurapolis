/**
 * NEURAPOLIS — Moteur de synthèse procédurale Web Audio.
 * 100% procédural : aucun asset audio externe (mp3/wav/ogg).
 * Bruits de pas selon la surface, bips d'interface, encaissement,
 * nappes d'ambiance selon le lieu, et jingles fantômes / chapitres.
 *
 * Résilient : no-op propre en environnement sans AudioContext (Node.js/Vitest).
 *
 * Musique adaptative (src/presentation/music/) : elle suit la situation du jeu (exploration,
 * tension, climax, résonance), passe d'un état à l'autre en fondu, sur son propre bus de volume.
 * Réglages séparés musique / effets et coupure, mémorisés ; démarrage après la première
 * interaction (règles d'autoplay) ; tout se met en pause quand l'onglet est caché.
 */
import type { WorldState } from '../core/types';
import { MusicEngine, type MusicStats } from './music/engine';
import { createDirector, stepDirector, type DirectorState } from './music/director';
import { MOODS, type MusicMood } from './music/moods';
import { readMusicSignals, type MusicScene } from './music/signals';
import { DEFAULT_AUDIO_PREFS, loadAudioPrefs, saveAudioPrefs, type AudioPrefs } from './music/prefs';
import { VoiceLimiter, runFactor, type SfxKind } from './sfx/logic';
import { WALK_SPEED } from './city3d/locomotion';

/** État musical affiché dans le panneau Son. */
export interface MusicStatus {
  mood: MusicMood;
  label: string;
  bpm: number;
  reason: string;
  running: boolean;
}

export type SurfaceType = 'pave' | 'brique' | 'herbe' | 'parquet' | 'terre' | 'sol' | 'asphalte';
export type AmbientLocation = 'maison' | 'ville' | 'parc' | 'atelier' | 'college' | 'epicerie' | 'place' | 'silence';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  /** Limiteur en sortie des bruitages : plusieurs sons simultanés ne saturent pas. */
  private sfxLimiter: DynamicsCompressorNode | null = null;
  /** Pool de voix : borne les bruitages simultanés (total et par famille). */
  public readonly voices = new VoiceLimiter();

  private sharedNoiseBuffer: AudioBuffer | null = null;

  private currentAmbientLocation: AmbientLocation = 'silence';
  private currentAmbientHour = 12;
  private currentAmbientMeteo?: string;
  private currentIsNight = false;
  private currentIsGoldenHour = false;
  private currentIsRain = false;
  /** Le joueur est dans un intérieur : la pluie passe derrière les murs. */
  private indoor = false;
  private rainGain: GainNode | null = null;

  // Gestion du bruit de trafic routier urbain (0..1)
  private trafficGainNode: GainNode | null = null;
  private trafficSourceNode: AudioBufferSourceNode | null = null;
  private trafficFilterNode: BiquadFilterNode | null = null;

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

  // ---- Musique adaptative et réglages joueur ----
  private musicGain: GainNode | null = null;
  private music: MusicEngine | null = null;
  private director: DirectorState = createDirector();
  /** Réglage joueur : volume musique (0-1). */
  private musicLevel = DEFAULT_AUDIO_PREFS.music;
  /** Réglage joueur : volume des effets, bruitages et ambiances (0-1). */
  private effectsLevel = DEFAULT_AUDIO_PREFS.effects;
  /** La musique a été demandée (après une interaction du joueur). */
  private musicWanted = false;
  /** Onglet caché : tout est suspendu. */
  private hidden = false;
  private sceneTitle: string | null = null;
  private listeners = new Set<() => void>();
  /** Volume de base de la musique sous le maître (le réglage joueur s'y multiplie). */
  private static readonly MUSIC_BASE = 0.55;

  public init(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended' && !this.hidden) {
        this.ctx.resume().catch(() => {});
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume * this.effectsLevel, this.ctx.currentTime);
        if (typeof this.ctx.createDynamicsCompressor === 'function') {
          const lim = this.ctx.createDynamicsCompressor();
          lim.threshold.value = -10;
          lim.knee.value = 6;
          lim.ratio.value = 12;
          lim.attack.value = 0.003;
          lim.release.value = 0.15;
          this.sfxGain.connect(lim);
          lim.connect(this.masterGain);
          this.sfxLimiter = lim;
        } else {
          this.sfxGain.connect(this.masterGain);
        }

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVolume * this.effectsLevel, this.ctx.currentTime);
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
    if (this.ctx && this.ctx.state === 'suspended' && !this.hidden) {
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
    this.savePrefs();
    this.syncMusicRunning();
    this.notify();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Bus des bruitages pour src/presentation/sfx : seulement après la première interaction
   * (le contexte n'est jamais créé ici), et rien quand le son est coupé ou l'onglet caché.
   */
  public sfxBus(): { ctx: AudioContext; sfx: GainNode; ambient: GainNode; noise: AudioBuffer } | null {
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.ambientGain || this.muted || this.hidden) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return { ctx: this.ctx, sfx: this.sfxGain, ambient: this.ambientGain, noise: this.getOrCreateSharedNoiseBuffer(this.ctx) };
  }

  /** Réserve une voix dans le pool ; faux si la famille ou le total est saturé. */
  private voice(kind: SfxKind, duration: number): boolean {
    return !!this.ctx && this.voices.tryStart(kind, this.ctx.currentTime, duration);
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
  /**
   * Pas selon le sol ; `speed` (m/s) règle la force et la hauteur (la course frappe plus fort).
   * Trois nœuds par pas au plus (source, filtre, gain) : la cadence est déjà bornée par
   * l'horloge des pas (sfx/logic.ts), le pas ne passe donc pas par le pool de voix.
   */
  public playFootstep(surface: SurfaceType = 'pave', speed = WALK_SPEED): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const t = ctx.currentTime;
    const run = runFactor(speed);
    const force = 0.72 + 0.4 * run; // la course frappe plus fort…
    const up = 1 + 0.07 * run; // …et un peu plus haut
    const jitter = (w: number): number => (Math.random() * 2 - 1) * w;

    if (surface === 'herbe') {
      // Froissement végétal (bruit partagé, passe-bande 1100-1500 Hz)
      const buffer = this.getOrCreateSharedNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const offset = Math.random() * Math.max(0, buffer.duration - 0.08);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(Math.min(1500, (1100 + Math.random() * 400) * up), t);
      filter.Q.setValueAtTime(2.0, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2 * force, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(t, offset, 0.08);
      return;
    }

    // Les autres sols : impact (oscillateur qui chute) à travers un filtre propre au matériau.
    const spec: Record<Exclude<SurfaceType, 'herbe'>, { wave: OscillatorType; f0: number; f1: number; dur: number; filter?: BiquadFilterType; ff: number; q: number; g: number }> = {
      parquet: { wave: 'triangle', f0: 140, f1: 70, dur: 0.07, filter: 'lowpass', ff: 450, q: 1, g: 0.35 }, // bois chaleureux
      terre: { wave: 'sine', f0: 107, f1: 40, dur: 0.06, ff: 0, q: 1, g: 0.25 }, // impact sourd
      asphalte: { wave: 'triangle', f0: 220, f1: 75, dur: 0.055, filter: 'bandpass', ff: 380, q: 1.4, g: 0.28 }, // macadam mat
      brique: { wave: 'triangle', f0: 265, f1: 85, dur: 0.05, filter: 'bandpass', ff: 900, q: 1.1, g: 0.27 }, // trottoir de briques
      sol: { wave: 'triangle', f0: 420, f1: 120, dur: 0.04, filter: 'highpass', ff: 300, q: 0.8, g: 0.24 }, // carrelage, lino
      pave: { wave: 'triangle', f0: 340, f1: 90, dur: 0.045, filter: 'highpass', ff: 200, q: 1, g: 0.3 }, // pierre
    };
    const sp = spec[surface] ?? spec.pave;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sp.wave;
    osc.frequency.setValueAtTime(sp.f0 * up + jitter(sp.f0 * 0.028), t);
    osc.frequency.exponentialRampToValueAtTime(sp.f1, t + sp.dur * 0.9);
    gain.gain.setValueAtTime(sp.g * force, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + sp.dur);
    if (sp.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = sp.filter;
      filter.frequency.setValueAtTime(sp.ff, t);
      if (sp.q !== 1) filter.Q.setValueAtTime(sp.q, t);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + sp.dur + 0.01);
  }

  /* ─────────────────────────────────────────────────────────────
   * BIPS ET EFFETS D'INTERFACE & ÉCONOMIE
   * ───────────────────────────────────────────────────────────── */
  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted || !this.voice('ui', 0.04)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('piece', 0.3)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('jingle', 0.8)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('alerte', 0.5)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('jingle', 1.2)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('jingle', 0.8)) return;

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
    if (!ctx || !this.sfxGain || this.muted || !this.voice('alerte', 0.5)) return;

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

    // 4. Météo Pluie : sous-couche procédurale de bruit de pluie (assourdie à l'intérieur, voir setIndoor ;
    //    le grain fin de la pluie et le vent sont des nappes de src/presentation/sfx/beds.ts)
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
      rainGain.gain.linearRampToValueAtTime(this.indoor ? 0.02 : 0.12, t + 1.0);
      this.rainGain = rainGain;

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

  /** Intérieur / extérieur : la couche de pluie baisse derrière les murs (fondu d'une seconde). */
  public setIndoor(inside: boolean): void {
    if (this.indoor === inside) return;
    this.indoor = inside;
    if (this.rainGain && this.ctx) this.rainGain.gain.setTargetAtTime(inside ? 0.02 : 0.12, this.ctx.currentTime, 0.4);
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
      if (nodes.intervalId) {
        clearInterval(nodes.intervalId);
      }
    }, 600);
  }

  /* ─────────────────────────────────────────────────────────────
   * AMBIANCE & SONS DE VILLE 3D (Tâche A-4)
   * ───────────────────────────────────────────────────────────── */

  /**
   * Sonnette de porte de boutique (ding-dong en clochettte de laiton).
   */
  public playDoorBell(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted || !this.voice('porte', 0.6)) return;

    const t = ctx.currentTime;
    // Cloche d'entrée de boutique en deux notes harmoniques (E6 = 1318.5 Hz, C6 = 1046.5 Hz)
    const bellNotes = [
      { freq: 1318.5, start: t, duration: 0.35, gain: 0.25 },
      { freq: 1046.5, start: t + 0.12, duration: 0.45, gain: 0.22 },
    ];

    for (const note of bellNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, note.start);
      // Légère modulation pour le scintillement métallique de clochette
      osc.frequency.exponentialRampToValueAtTime(note.freq * 0.99, note.start + note.duration);

      gain.gain.setValueAtTime(note.gain, note.start);
      gain.gain.exponentialRampToValueAtTime(0.0005, note.start + note.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(note.start);
      osc.stop(note.start + note.duration + 0.05);
    }
  }

  /**
   * Contrôle dynamique du volume de trafic routier urbain lointain (0..1).
   * Rumeur sourde continue de pneus et moteurs filtrée à basse fréquence.
   */
  public setTrafficLevel(level: number): void {
    const targetLevel = Math.max(0, Math.min(1, level));
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;

    const t = ctx.currentTime;

    // Si le niveau est à 0 et aucun noeud actif, ne rien faire
    if (targetLevel === 0 && !this.trafficGainNode) return;

    // Création du générateur de trafic si absent
    if (!this.trafficSourceNode && targetLevel > 0) {
      const buffer = this.getOrCreateSharedNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, t); // grondement sourd de route
      filter.Q.setValueAtTime(1.2, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      source.start(t);

      this.trafficSourceNode = source;
      this.trafficFilterNode = filter;
      this.trafficGainNode = gain;
    }

    if (this.trafficGainNode) {
      // Ajustement fluide du volume (max 0.22 pour ne pas écraser la musique ou les pas)
      const targetGain = targetLevel * 0.22;
      this.trafficGainNode.gain.setTargetAtTime(this.muted ? 0 : targetGain, t, 0.3);
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * RÉGLAGES JOUEUR (mémorisés) — musique / effets / coupure
   * ───────────────────────────────────────────────────────────── */

  /** Relit les réglages mémorisés (à l'ouverture du jeu, avant tout son). */
  public loadPrefs(): AudioPrefs {
    const p = loadAudioPrefs();
    this.musicLevel = p.music;
    this.effectsLevel = p.effects;
    this.muted = p.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    this.applyLevels();
    this.syncMusicRunning();
    this.notify();
    return p;
  }

  private savePrefs(): void {
    saveAudioPrefs({ music: this.musicLevel, effects: this.effectsLevel, muted: this.muted });
  }

  private applyLevels(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxGain?.gain.setTargetAtTime(this.sfxVolume * this.effectsLevel, t, 0.05);
    this.ambientGain?.gain.setTargetAtTime(this.ambientVolume * this.effectsLevel, t, 0.05);
    this.musicGain?.gain.setTargetAtTime(SoundEngine.MUSIC_BASE * this.musicLevel, t, 0.08);
  }

  public getMusicVolume(): number { return this.musicLevel; }
  public getEffectsVolume(): number { return this.effectsLevel; }

  /** Volume de la musique (0-1). À 0, la musique s'arrête (aucun calcul). */
  public setMusicVolume(v: number): void {
    this.musicLevel = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    this.applyLevels();
    this.savePrefs();
    this.syncMusicRunning();
    this.notify();
  }

  /** Volume des effets : bruitages et ambiances (0-1). */
  public setEffectsVolume(v: number): void {
    this.effectsLevel = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    this.applyLevels();
    this.savePrefs();
    this.notify();
  }

  /** Abonnement aux changements (réglages, état musical) — renvoie la fonction de désabonnement. */
  public onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    for (const cb of this.listeners) {
      try { cb(); } catch { /* un abonné défaillant ne bloque pas le son */ }
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * MUSIQUE ADAPTATIVE
   * ───────────────────────────────────────────────────────────── */

  /**
   * Lance la musique (à appeler après une interaction du joueur : règles d'autoplay).
   * `seed` : graine musicale (celle de la partie : même partie, même musique).
   */
  public startMusic(seed: number): boolean {
    this.musicWanted = true;
    if (!this.music) {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return false;
      try {
        this.musicGain = ctx.createGain();
        this.musicGain.gain.setValueAtTime(SoundEngine.MUSIC_BASE * this.musicLevel, ctx.currentTime);
        this.musicGain.connect(this.masterGain);
        this.music = new MusicEngine(ctx, this.musicGain, seed >>> 0, this.director.mood);
      } catch {
        // Contexte audio incomplet : le jeu continue sans musique.
        this.music = null;
        return false;
      }
    }
    this.syncMusicRunning();
    this.notify();
    return true;
  }

  /** La musique tourne seulement si elle est voulue, audible et l'onglet visible. */
  private syncMusicRunning(): void {
    if (!this.music) return;
    const shouldRun = this.musicWanted && !this.muted && !this.hidden && this.musicLevel > 0;
    if (shouldRun && !this.music.isRunning) this.music.start();
    else if (!shouldRun && this.music.isRunning) this.music.pause();
  }

  /** Fenêtre ouverte (titre) ou fermée (null) : certaines imposent un état musical. */
  public setMusicScene(modalTitle: string | null): void {
    this.sceneTitle = modalTitle;
  }

  /**
   * Fait suivre la situation à la musique (lecture seule du monde). `nowMs` : temps réel
   * (performance.now()) pour les fondus et l'anti va-et-vient.
   */
  public updateMusic(world: WorldState, scene: Omit<MusicScene, 'modalTitle'>, nowMs: number): void {
    const signals = readMusicSignals(world, { ...scene, modalTitle: this.sceneTitle });
    const prev = this.director.mood;
    this.director = stepDirector(this.director, signals, nowMs);
    if (this.music) {
      this.music.setColor(signals.district, signals.hour);
      this.music.setMood(this.director.mood);
    }
    if (this.director.mood !== prev) this.notify();
  }

  public musicStatus(): MusicStatus {
    const mood = this.director.mood;
    return {
      mood,
      label: MOODS[mood].label,
      bpm: this.music ? this.music.stats().bpm : MOODS[mood].bpm,
      reason: this.director.reason,
      running: !!this.music?.isRunning,
    };
  }

  public musicStats(): MusicStats | null {
    return this.music ? this.music.stats() : null;
  }

  /**
   * Onglet caché : on suspend tout le contexte audio (plus aucun calcul) ; retour : reprise.
   */
  public setHidden(hidden: boolean): void {
    if (this.hidden === hidden) return;
    this.hidden = hidden;
    if (this.ctx) {
      try {
        if (hidden) this.ctx.suspend?.().catch(() => {});
        else if (this.initialized) this.ctx.resume().catch(() => {});
      } catch { /* contexte fermé */ }
    }
    this.syncMusicRunning();
  }
}

export const audio = new SoundEngine();
