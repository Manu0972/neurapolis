/**
 * Recettes de bruitages synthétisés (Web Audio, aucun fichier externe).
 * Chaque recette reçoit le contexte, la sortie (bus « Effets »), un tampon de bruit partagé et
 * l'instant de départ ; elle renvoie sa durée (s) pour le limiteur de voix. Peu de nœuds par son.
 * (Les pas sont dans audio.ts : trois nœuds par pas.)
 */
export interface Kit {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: AudioBuffer;
}

/** Enveloppe percussive : attaque `a`, décroissance exponentielle jusqu'à `end`. */
function env(g: GainNode, t: number, peak: number, end: number, a = 0.004): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
}

/** Relie les nœuds en série (sans compter sur la valeur de retour de connect()). */
function chain(...nodes: AudioNode[]): void {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.connect(nodes[i + 1]!);
}

/** Le tampon de bruit partagé (audio.ts) est à 0,25 d'amplitude : on compense dans les rafales. */
const NOISE_COMP = 2.4;

/** Rafale de bruit filtrée. */
function burst(k: Kit, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, peak: number, rate = 1, freqEnd?: number): void {
  const src = k.ctx.createBufferSource();
  src.buffer = k.noise;
  if (src.playbackRate && rate !== 1) src.playbackRate.value = rate;
  const f = k.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  f.Q.value = q;
  const g = k.ctx.createGain();
  env(g, t, peak * NOISE_COMP, t + dur);
  chain(src, f, g, k.out);
  const offset = Math.random() * Math.max(0, k.noise.duration - dur - 0.05);
  src.start(t, offset, dur + 0.02);
}

/** Note brève (oscillateur) avec glissando optionnel. */
function tone(k: Kit, t: number, dur: number, type: OscillatorType, f0: number, peak: number, f1?: number, a = 0.004): void {
  const o = k.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.9);
  const g = k.ctx.createGain();
  env(g, t, peak, t + dur, a);
  chain(o, g, k.out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Porte qui s'ouvre : grincement court puis loquet. */
export function doorOpen(k: Kit, t: number): number {
  burst(k, t, 0.02, 'highpass', 3200, 1, 0.16); // loquet
  const o = k.ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(170, t + 0.04);
  o.frequency.linearRampToValueAtTime(240, t + 0.18);
  o.frequency.linearRampToValueAtTime(195, t + 0.36);
  const f = k.ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 950;
  f.Q.value = 7;
  const g = k.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t + 0.04);
  g.gain.linearRampToValueAtTime(0.055, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  chain(o, f, g, k.out);
  o.start(t + 0.04);
  o.stop(t + 0.42);
  return 0.42;
}

/** Porte qui se ferme : coup sourd du battant et clic du pêne. */
export function doorClose(k: Kit, t: number): number {
  tone(k, t, 0.16, 'sine', 95, 0.32, 46);
  burst(k, t, 0.09, 'lowpass', 420, 0.8, 0.3);
  burst(k, t + 0.05, 0.02, 'highpass', 3000, 1, 0.12);
  return 0.18;
}

/** Caisse enregistreuse : tiroir qui glisse puis « ding » de la sonnette. */
export function cashRegister(k: Kit, t: number): number {
  burst(k, t, 0.11, 'bandpass', 2200, 2, 0.1, 1, 700); // tiroir
  tone(k, t + 0.04, 0.06, 'square', 180, 0.04, 120); // butée
  const bell = t + 0.1;
  tone(k, bell, 0.7, 'sine', 2093, 0.12, undefined, 0.002); // do7
  tone(k, bell, 0.5, 'sine', 2637, 0.07, undefined, 0.002); // mi7
  tone(k, bell, 0.25, 'sine', 5650, 0.025, undefined, 0.002); // partiel métallique
  return 0.82;
}

/** Pièces qui tintent : `n` petits chocs métalliques décalés. */
export function coins(k: Kit, t: number, n = 4): number {
  let at = t;
  for (let i = 0; i < n; i++) {
    const f = 3200 + Math.random() * 2400;
    tone(k, at, 0.09, 'sine', f, 0.05, undefined, 0.001);
    tone(k, at, 0.05, 'sine', f * 1.51, 0.02, undefined, 0.001);
    at += 0.045 + Math.random() * 0.035;
  }
  return at - t + 0.1;
}

/** Fenêtre d'interface qui s'ouvre (souffle montant) ou se ferme (souffle descendant). */
export function panel(k: Kit, t: number, open: boolean): number {
  burst(k, t, 0.12, 'bandpass', open ? 600 : 2400, 1.2, 0.05, 1, open ? 2400 : 600);
  tone(k, t + 0.01, 0.07, 'sine', open ? 660 : 880, 0.06, open ? 990 : 587);
  return 0.13;
}

/** Téléphone : petit carillon à deux notes (montant à l'ouverture, descendant à la fermeture). */
export function phone(k: Kit, t: number, open: boolean): number {
  const [a, b] = open ? [1046.5, 1568] : [1568, 1046.5];
  burst(k, t, 0.015, 'highpass', 4000, 1, 0.06); // tapotement
  tone(k, t + 0.01, 0.12, 'sine', a, 0.08);
  tone(k, t + 0.01, 0.08, 'triangle', a * 2, 0.02);
  tone(k, t + 0.09, 0.16, 'sine', b, 0.08);
  tone(k, t + 0.09, 0.1, 'triangle', b * 2, 0.02);
  return 0.26;
}

/** Petit clic de bouton (accompagne le rebond). */
export function tick(k: Kit, t: number): number {
  tone(k, t, 0.02, 'sine', 1700, 0.05, 1150, 0.001);
  return 0.03;
}

/** « Mission accomplie » : arpège do-mi-sol-do joyeux, la dernière note tenue. */
export function missionJingle(k: Kit, t: number): number {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const at = t + i * 0.085;
    const last = i === notes.length - 1;
    tone(k, at, last ? 0.6 : 0.16, 'triangle', f, last ? 0.13 : 0.1, undefined, 0.006);
    tone(k, at, last ? 0.45 : 0.12, 'sine', f * 2, 0.03, undefined, 0.006);
  });
  burst(k, t + 0.26, 0.4, 'highpass', 6000, 0.7, 0.02); // scintillement
  return 0.9;
}

/** Arrivée sur la balise : deux notes douces. */
export function arrival(k: Kit, t: number): number {
  tone(k, t, 0.3, 'sine', 783.99, 0.06, undefined, 0.01);
  tone(k, t + 0.08, 0.38, 'sine', 1174.66, 0.05, undefined, 0.01);
  return 0.46;
}

/** Bruits lointains de la rue (klaxon étouffé, sonnette de vélo, porte métallique). */
export function distant(k: Kit, t: number, which: number): number {
  if (which < 0.4) {
    // klaxon lointain
    for (const f of [311, 370]) {
      const o = k.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const lp = k.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 650;
      const g = k.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.018, t + 0.03);
      g.gain.setValueAtTime(0.018, t + 0.26);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      chain(o, lp, g, k.out);
      o.start(t);
      o.stop(t + 0.42);
    }
    return 0.42;
  }
  if (which < 0.75) {
    // sonnette de vélo
    tone(k, t, 0.22, 'sine', 2350, 0.02, undefined, 0.002);
    tone(k, t + 0.12, 0.25, 'sine', 2350, 0.018, undefined, 0.002);
    return 0.4;
  }
  // rideau métallique / porte lointaine
  burst(k, t, 0.35, 'bandpass', 700, 1.5, 0.025, 0.7, 300);
  return 0.36;
}
