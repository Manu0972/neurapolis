/**
 * Musique adaptative — instruments synthétisés en Web Audio natif (aucun fichier, aucune dépendance).
 *
 * - Corde pincée : algorithme de Karplus-Strong calculé une fois par note en JavaScript
 *   (quelques dizaines de milliers d'échantillons, < 1 ms), mis en cache, puis rejoué par une
 *   simple source de tampon : bien moins coûteux qu'un filtre en peigne bouclé en temps réel
 *   et sans AudioWorklet (indisponible hors contexte sécurisé, ex. partie en LAN sur http://).
 * - Nappe, basse, grosse caisse et charleston : oscillateurs et bruit natifs, enveloppes programmées.
 *
 * Tous les tirages passent par un générateur à graine (reproductible), jamais Math.random().
 */
import { midiToHz } from './moods';

export type Rand = () => number;

/** Durée d'une note de corde (s) : elle est à −60 dB à la fin. */
export const PLUCK_SECONDS = 1.4;

/**
 * Karplus-Strong accordé : ligne à retard fractionnaire (interpolation linéaire) + filtre moyenneur.
 * Pur (aucun Web Audio) : testable sous Node.
 */
export function renderPluck(freq: number, sampleRate: number, seconds: number, rand: Rand): Float32Array {
  const n = Math.max(1, Math.floor(sampleRate * seconds));
  const y = new Float32Array(n);
  // Retard total voulu = période ; le moyenneur en ajoute 0,5, l'interpolation `frac`.
  const delay = Math.max(2.5, sampleRate / freq - 0.5);
  const m = Math.floor(delay);
  const frac = delay - m;
  // Excitation : bruit adouci (passe-bas à un pôle) → attaque moins métallique.
  let lp = 0;
  const excite = Math.min(n, m + 2);
  for (let i = 0; i < excite; i++) {
    lp += 0.55 * ((rand() * 2 - 1) - lp);
    y[i] = lp;
  }
  // Retrait de la composante continue de l'excitation (sinon un « pouf » sourd).
  let mean = 0;
  for (let i = 0; i < excite; i++) mean += y[i]!;
  mean /= excite;
  for (let i = 0; i < excite; i++) y[i] = y[i]! - mean;
  // Perte par période pour atteindre −60 dB en `seconds`.
  const g = Math.pow(0.001, 1 / (freq * seconds));
  for (let i = excite; i < n; i++) {
    const a = y[i - m] ?? 0;
    const b = y[i - m - 1] ?? 0;
    const c = y[i - m - 2] ?? 0;
    y[i] = g * 0.5 * ((1 - frac) * a + b + frac * c);
  }
  // Fondu de sortie (30 ms) : pas de clic en fin de tampon.
  const fade = Math.min(n, Math.floor(sampleRate * 0.03));
  for (let i = 0; i < fade; i++) y[n - 1 - i] = y[n - 1 - i]! * (i / fade);
  return y;
}

/**
 * Réponse impulsionnelle de réverbération (bruit à décroissance exponentielle), en mono :
 * mesure hors ligne, une réponse stéréo coûtait ~4× plus cher (deux convolutions au lieu d'une).
 */
export function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number, rand: Rand): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, decay);
  return buf;
}

/**
 * Charleston précalculé : bruit filtré passe-haut 7 kHz (biquad RBJ calculé en JavaScript) et
 * enveloppe de 50 ms, cuits dans le tampon. Mesure (rendu hors ligne) : un filtre Web Audio par
 * coup coûtait ~10× plus qu'une simple source de tampon.
 */
export function makeHat(ctx: BaseAudioContext, rand: Rand): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * 0.06));
  const buf = ctx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  const w0 = (2 * Math.PI * Math.min(7000, rate * 0.45)) / rate;
  const alpha = Math.sin(w0) / (2 * 0.707);
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  const b0 = (1 + cos) / 2 / a0, b1 = -(1 + cos) / a0, b2 = (1 + cos) / 2 / a0;
  const a1 = (-2 * cos) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < len; i++) {
    const x = rand() * 2 - 1;
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    d[i] = y * Math.exp(-i / (rate * 0.012));
  }
  return buf;
}

/** Libère les nœuds d'une voix quand sa source s'arrête (le ramasse-miettes fait le reste). */
function releaseOnEnd(src: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  src.onended = () => {
    for (const nd of nodes) {
      try { nd.disconnect(); } catch { /* déjà libéré */ }
    }
  };
}

/** Cache des tampons de corde par note MIDI (taille bornée). */
export class PluckBank {
  private cache = new Map<number, AudioBuffer>();
  constructor(private ctx: BaseAudioContext, private rand: Rand, private max = 32) {}

  get size(): number { return this.cache.size; }

  buffer(midi: number): AudioBuffer {
    const hit = this.cache.get(midi);
    if (hit) {
      // Rafraîchit l'ordre (le plus ancien est évincé en premier).
      this.cache.delete(midi);
      this.cache.set(midi, hit);
      return hit;
    }
    // À la fréquence du contexte : un tampon rééchantillonné coûtait ~2,5× plus cher au rendu.
    const rate = this.ctx.sampleRate;
    const data = renderPluck(midiToHz(midi), rate, PLUCK_SECONDS, this.rand);
    const buf = this.ctx.createBuffer(1, data.length, rate);
    buf.getChannelData(0).set(data);
    this.cache.set(midi, buf);
    if (this.cache.size > this.max) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    return buf;
  }
}

export function playPluck(ctx: BaseAudioContext, bank: PluckBank, out: AudioNode, midi: number, t: number, velocity: number): void {
  const src = ctx.createBufferSource();
  src.buffer = bank.buffer(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.55 * velocity, t);
  src.connect(g);
  g.connect(out);
  src.start(t);
  releaseOnEnd(src, [src, g]);
}

/**
 * Nappe : un triangle par note dans un passe-bas fixe, attaque 2 s, relâchement 4 s.
 * (Une seconde couche désaccordée doublait le coût pour un gain d'épaisseur peu audible.)
 */
export function playPad(ctx: BaseAudioContext, out: AudioNode, notes: readonly number[], t: number, hold: number): void {
  const attack = 2;
  const release = 4;
  const sustainEnd = t + Math.max(attack, hold);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1100; // valeur fixe, sans automation : filtre moins coûteux
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.09, t + attack);
  env.gain.setValueAtTime(0.09, sustainEnd);
  env.gain.exponentialRampToValueAtTime(0.0001, sustainEnd + release);
  lp.connect(env);
  env.connect(out);
  const end = sustainEnd + release + 0.05;
  const nodes: AudioNode[] = [lp, env];
  let last: OscillatorNode | null = null;
  for (let i = 0; i < notes.length; i++) {
    const midi = notes[i]!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = midiToHz(midi);
    // Léger désaccord entre les notes : la nappe « respire » sans oscillateur de plus.
    o.detune.value = (i - 1) * 4;
    o.connect(lp);
    o.start(t);
    o.stop(end);
    nodes.push(o);
    last = o;
  }
  // Toutes les notes s'arrêtent ensemble : la dernière libère l'ensemble.
  if (last) releaseOnEnd(last, nodes);
}

/** Basse : triangle filtré, enveloppe de filtre (80 Hz × 4 → 80 Hz), comme le MonoSynth du prototype. */
export function playBass(ctx: BaseAudioContext, out: AudioNode, midi: number, t: number, dur: number): void {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(midiToHz(midi), t);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(320, t);
  lp.frequency.exponentialRampToValueAtTime(80, t + 0.3);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.5, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.2, t + 0.32);
  env.gain.setValueAtTime(0.2, t + Math.max(0.32, dur));
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.32, dur) + 0.8);
  osc.connect(lp);
  lp.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + Math.max(0.32, dur) + 0.85);
  releaseOnEnd(osc, [osc, lp, env]);
}

/** Grosse caisse douce : sinus à chute de hauteur rapide (membrane). */
export function playKick(ctx: BaseAudioContext, out: AudioNode, t: number): void {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.035);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.5, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + 0.4);
  releaseOnEnd(osc, [osc, env]);
}

/** Charleston : tampon précalculé (voir `makeHat`), nuance par un gain fixe. */
export function playHat(ctx: BaseAudioContext, out: AudioNode, hat: AudioBuffer, t: number, velocity: number): void {
  const src = ctx.createBufferSource();
  src.buffer = hat;
  const g = ctx.createGain();
  g.gain.value = 0.12 * velocity;
  src.connect(g);
  g.connect(out);
  src.start(t);
  releaseOnEnd(src, [src, g]);
}
