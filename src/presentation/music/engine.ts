/**
 * Musique adaptative — moteur : séquenceur à la croche, fondus entre états, tempo qui glisse.
 *
 * Programmation « à l'avance » (lookahead) : un minuteur léger (60 ms) place les notes des
 * 300 prochaines millisecondes sur l'horloge audio, qui reste précise même si l'image saccade.
 * Le même code rend la musique hors ligne (OfflineAudioContext) pour mesurer son coût CPU.
 *
 * Reproductible : tous les choix (notes, présence, nuances) viennent d'un PRNG à graine
 * (mulberry32 du projet, état local : celui de la simulation n'est jamais touché).
 */
import { mulberry32, rngNext } from '../../core/rng';
import { dayPartOf, resolveMood, type MusicMood, type ResolvedMood, type TrackMix } from './moods';
import { PluckBank, makeHat, makeImpulse, playBass, playHat, playKick, playPad, playPluck, type Rand } from './synth';

/** Horizon de programmation (s). */
export const LOOKAHEAD_S = 0.3;
/** Période du minuteur de programmation (ms). */
export const TIMER_MS = 60;
/** Glissement de tempo lors d'un changement d'état (s). */
export const TEMPO_GLIDE_S = 3;
/** Glissement plus lent quand seule la couleur (quartier, heure) change (s). */
export const COLOR_GLIDE_S = 6;
/** Fondu des pistes (constante de temps, s) : ~3 s pour atteindre le nouveau mixage. */
const MIX_TAU_S = 1.0;
const TONE_TAU_S = 1.5;
/** Niveau de base des pistes, avant le mixage propre à chaque état. */
const TRACK_LEVEL: Readonly<TrackMix> = { melody: 1, pad: 1, bass: 0.9, perc: 0.9 };
const TRACKS = ['melody', 'pad', 'bass', 'perc'] as const;

export interface MusicEvent { kind: 'pluck' | 'bass' | 'pad' | 'kick' | 'hat'; t: number; midi?: number; step: number }

export interface MusicStats {
  running: boolean;
  mood: MusicMood;
  bpm: number;
  /** Croches programmées depuis le début. */
  steps: number;
  /** Notes déclenchées depuis le début. */
  notes: number;
  /** Temps total passé dans le séquenceur sur le fil principal (ms). */
  schedulerMs: number;
  /** Tampons de corde en cache. */
  pluckBuffers: number;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : 0);

export class MusicEngine {
  readonly ctx: BaseAudioContext;
  /** Gain de fondu d'entrée / sortie du moteur. */
  private readonly out: GainNode;
  private readonly tone: BiquadFilterNode;
  private readonly tracks: Record<keyof TrackMix, GainNode>;
  private readonly rand: Rand;
  private readonly bank: PluckBank;
  private readonly hats: AudioBuffer[];
  private mood: MusicMood;
  private district = 'centre';
  private hour = 12;
  private cur: ResolvedMood;
  private pending: { r: ResolvedMood; at: 'beat' | 'bar' } | null = null;
  private step = 0;
  private nextTime = 0;
  private bpmFrom: number;
  private bpmTo: number;
  private glideStart = 0;
  private glideDur = 0;
  private melodyIdx = 3;
  private padDue = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private notes = 0;
  private schedulerMs = 0;
  /** Journal des événements programmés (tests, débogage) : null = désactivé. */
  trace: MusicEvent[] | null = null;

  constructor(ctx: BaseAudioContext, destination: AudioNode, seed: number, mood: MusicMood = 'exploration') {
    this.ctx = ctx;
    const state = mulberry32(seed);
    this.rand = () => rngNext(state);
    this.mood = mood;
    this.cur = resolveMood(mood, this.district, this.hour);
    this.bpmFrom = this.bpmTo = this.cur.bpm;
    this.bank = new PluckBank(ctx, this.rand);
    this.hats = [makeHat(ctx, this.rand), makeHat(ctx, this.rand), makeHat(ctx, this.rand)];

    const t = ctx.currentTime;
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0, t);
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.setValueAtTime(this.cur.brightness, t);
    this.tone.Q.setValueAtTime(0.5, t);

    // Bus : pistes → brillance → fondu. Pas de compresseur (mesuré ~1,5 % d'un cœur pour rien :
    // les niveaux des voix sont bornés). Réverbération à convolution mono, 30 % de signal réverbéré.
    const bus = ctx.createGain();
    bus.connect(this.tone);
    this.tone.connect(this.out);
    this.out.connect(destination);
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 1.8, 3, this.rand);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.3, t);
    wet.connect(reverb);
    reverb.connect(bus);

    const mk = (k: keyof TrackMix): GainNode => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(this.cur.mix[k] * TRACK_LEVEL[k], t);
      g.connect(bus);
      if (k === 'melody' || k === 'pad') g.connect(wet);
      return g;
    };
    this.tracks = { melody: mk('melody'), pad: mk('pad'), bass: mk('bass'), perc: mk('perc') };
  }

  get currentMood(): MusicMood { return this.mood; }
  get isRunning(): boolean { return this.running; }

  /** Tempo (BPM) à l'instant audio `t`, glissement compris. */
  bpmAt(t: number): number {
    if (this.glideDur <= 0 || t >= this.glideStart + this.glideDur) return this.bpmTo;
    if (t <= this.glideStart) return this.bpmFrom;
    return this.bpmFrom + (this.bpmTo - this.bpmFrom) * ((t - this.glideStart) / this.glideDur);
  }

  /** Change d'état musical : tempo qui glisse, mixage et brillance en fondu, gamme au temps suivant. */
  setMood(mood: MusicMood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    this.retarget('beat', TEMPO_GLIDE_S);
  }

  /** Couleur du moment : quartier (tonalité, allure) et partie de la journée. Appliquée à la mesure. */
  setColor(district: string, hour: number): void {
    const same = district === this.district && dayPartOf(hour) === dayPartOf(this.hour);
    this.district = district;
    this.hour = hour;
    if (!same) this.retarget('bar', COLOR_GLIDE_S);
  }

  private retarget(at: 'beat' | 'bar', glide: number): void {
    const r = resolveMood(this.mood, this.district, this.hour);
    const t = this.ctx.currentTime;
    const from = Math.max(t, this.nextTime);
    this.bpmFrom = this.bpmAt(from);
    this.bpmTo = r.bpm;
    this.glideStart = from;
    this.glideDur = glide;
    // Un changement d'état déjà en attente garde sa priorité (au temps plutôt qu'à la mesure).
    this.pending = { r, at: this.pending?.at === 'beat' ? 'beat' : at };
    for (const k of TRACKS) this.tracks[k].gain.setTargetAtTime(r.mix[k] * TRACK_LEVEL[k], t, MIX_TAU_S);
    this.tone.frequency.setTargetAtTime(r.brightness, t, TONE_TAU_S);
  }

  /** Démarre (ou reprend) la programmation ; `autoTimer` false : l'appelant appelle `pump()`. */
  start(autoTimer = true, fadeIn = 2.5): void {
    if (this.running) return;
    this.running = true;
    const t = this.ctx.currentTime;
    if (this.nextTime < t + 0.05) this.nextTime = t + 0.1;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(1, t + fadeIn);
    if (autoTimer) this.timer = setInterval(() => this.pump(), TIMER_MS);
    this.pump();
  }

  /** Suspend la programmation (onglet caché, son coupé) : plus aucune note, plus aucun calcul. */
  pause(fadeOut = 0.4): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + fadeOut);
  }

  /** Programme les notes jusqu'à l'horizon (appelé par le minuteur). */
  pump(): void {
    if (!this.running) return;
    const t0 = now();
    const t = this.ctx.currentTime;
    // Retard important (minuteur bridé) : on rattrape sans rafale de notes.
    if (this.nextTime < t - 0.2) this.nextTime = t + 0.05;
    this.scheduleUntil(t + LOOKAHEAD_S);
    this.schedulerMs += now() - t0;
  }

  /** Programme toutes les croches qui commencent avant `until` (rendu hors ligne compris). */
  scheduleUntil(until: number): void {
    while (this.nextTime < until) {
      const t = this.nextTime;
      const stepDur = 60 / this.bpmAt(t) / 2;
      this.scheduleStep(t, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private emit(kind: MusicEvent['kind'], t: number, midi?: number): void {
    this.notes++;
    if (this.trace) this.trace.push({ kind, t, midi, step: this.step });
  }

  private scheduleStep(t: number, stepDur: number): void {
    const s = this.step;
    // Changement en attente : appliqué sur le temps (état) ou la mesure (couleur).
    if (this.pending && (this.pending.at === 'beat' ? s % 2 === 0 : s % 8 === 0)) {
      this.cur = this.pending.r;
      this.pending = null;
      this.padDue = true;
    }
    const r = this.cur;
    const ctx = this.ctx;

    // Corde pincée : marche aléatoire dans la gamme (mélodie plutôt que notes isolées).
    if (this.rand() < r.density) {
      const len = r.scale.length;
      const roll = this.rand();
      let move = roll < 0.15 ? -2 : roll < 0.4 ? -1 : roll < 0.55 ? 0 : roll < 0.8 ? 1 : roll < 0.92 ? 2 : 0;
      if (roll >= 0.92) move = Math.floor(this.rand() * len) - this.melodyIdx; // saut occasionnel
      let idx = this.melodyIdx + move;
      if (idx < 0) idx = -idx;
      if (idx > len - 1) idx = 2 * (len - 1) - idx;
      this.melodyIdx = Math.max(0, Math.min(len - 1, idx));
      const midi = r.scale[this.melodyIdx]!;
      const vel = s % 8 === 0 ? 1 : 0.6 + 0.35 * this.rand();
      playPluck(ctx, this.bank, this.tracks.melody, midi, t, vel);
      this.emit('pluck', t, midi);
    }
    // Basse : une noire par mesure.
    if (s % 8 === 0) {
      playBass(ctx, this.tracks.bass, r.bass, t, stepDur * 2);
      this.emit('bass', t, r.bass);
    }
    // Nappe : toutes les deux mesures, ou à la mesure suivant un changement.
    if (s % 16 === 0 || (this.padDue && s % 8 === 0)) {
      playPad(ctx, this.tracks.pad, r.pad, t, stepDur * 8);
      this.padDue = false;
      this.emit('pad', t, r.pad[0]);
    }
    // Percussions (absentes en résonance).
    if (r.kick && s % 4 === 0) {
      playKick(ctx, this.tracks.perc, t);
      this.emit('kick', t);
    }
    if (r.hat > 0 && this.rand() < r.hat) {
      const hat = this.hats[Math.floor(this.rand() * this.hats.length)] ?? this.hats[0]!;
      playHat(ctx, this.tracks.perc, hat, t, s % 2 === 0 ? 1 : 0.6 + 0.3 * this.rand());
      this.emit('hat', t);
    }
  }

  stats(): MusicStats {
    return {
      running: this.running,
      mood: this.mood,
      bpm: Math.round(this.bpmAt(this.ctx.currentTime)),
      steps: this.step,
      notes: this.notes,
      schedulerMs: Math.round(this.schedulerMs * 100) / 100,
      pluckBuffers: this.bank.size,
    };
  }

  /** Arrêt définitif : coupe le minuteur et détache la sortie. */
  dispose(): void {
    this.pause(0.05);
    try { this.out.disconnect(); } catch { /* déjà détaché */ }
  }
}

/**
 * Mesure du coût audio : rend `seconds` de musique hors ligne et chronomètre le rendu.
 * `realtimeFactor` = temps de calcul / durée jouée (0,01 = 1 % d'un cœur pour le fil audio).
 */
export async function benchMusicOffline(seconds = 20, mood: MusicMood = 'climax', seed = 7): Promise<{
  seconds: number; mood: MusicMood; renderMs: number; realtimeFactor: number; notes: number; scheduleMs: number;
}> {
  const rate = 44100;
  const Offline = (globalThis as unknown as { OfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext;
  if (!Offline) throw new Error('OfflineAudioContext indisponible');
  const ctx = new Offline(2, Math.floor(rate * seconds), rate);
  const engine = new MusicEngine(ctx, ctx.destination, seed, mood);
  const s0 = now();
  engine.start(false, 0.01);
  engine.scheduleUntil(seconds);
  const scheduleMs = now() - s0;
  // Pauses régulières : comme en temps réel, les voix terminées sont libérées (événements
  // « ended ») au lieu de s'accumuler dans le graphe pendant tout le rendu.
  let paused = 0;
  for (let s = 0.5; s < seconds; s += 0.5) {
    ctx.suspend(s).then(() => {
      const p0 = now();
      setTimeout(() => { paused += now() - p0; void ctx.resume(); }, 0);
    }).catch(() => { /* instant déjà rendu */ });
  }
  const r0 = now();
  await ctx.startRendering();
  const renderMs = now() - r0 - paused;
  return { seconds, mood, renderMs: Math.round(renderMs), realtimeFactor: renderMs / (seconds * 1000), notes: engine.stats().notes, scheduleMs: Math.round(scheduleMs) };
}
