/**
 * Lissage du mouvement des autres joueurs (sans DOM, testable).
 *
 * Les positions arrivent environ 10 fois par seconde, à intervalles irréguliers. Les afficher telles
 * quelles fait sautiller l'avatar ; les poursuivre par un rattrapage exponentiel le fait traîner puis
 * accélérer. On affiche donc l'autre joueur légèrement dans le passé (`INTERP_DELAY_MS`), interpolé
 * entre les deux poses reçues qui encadrent cet instant : le mouvement est continu, à vitesse
 * régulière. Si les poses s'interrompent, une courte extrapolation évite l'arrêt net, puis l'avatar
 * s'immobilise. Un grand saut (bus, entrée dans un bâtiment, chargement) téléporte au lieu de glisser
 * à travers la ville.
 */

/** Pose reçue, datée à l'arrivée (ms, horloge locale). */
export interface PoseSample { t: number; x: number; z: number; h: number; s: number }
export type Pose = Omit<PoseSample, 't'>;

/** Retard d'affichage : un peu plus d'un intervalle d'envoi (100 ms), pour encaisser la gigue. */
export const INTERP_DELAY_MS = 150;
/** Au-delà de la dernière pose reçue, on prolonge le mouvement au plus ce temps-là. */
export const MAX_EXTRAPOLATE_MS = 200;
/** Écart (m) au-delà duquel on téléporte au lieu d'interpoler. */
export const TELEPORT_M = 12;
/** Poses gardées par joueur (≈ 1 s). */
export const TRACK_LEN = 12;

/** Angle ramené dans ]−π, π]. */
export function wrapAngle(a: number): number {
  const t = Math.PI * 2;
  let r = ((a + Math.PI) % t + t) % t - Math.PI;
  if (r <= -Math.PI) r += t;
  return r;
}

/** Ajoute une pose à la piste d'un joueur (gardée triée et bornée). */
export function pushSample(track: PoseSample[], p: PoseSample): void {
  const last = track[track.length - 1];
  // Téléportation : on n'interpole pas à travers la ville.
  if (last && Math.hypot(p.x - last.x, p.z - last.z) > TELEPORT_M) track.length = 0;
  else if (last && p.t <= last.t) { track[track.length - 1] = p; return; }
  track.push(p);
  if (track.length > TRACK_LEN) track.splice(0, track.length - TRACK_LEN);
}

function lerpPose(a: PoseSample, b: PoseSample, k: number): Pose {
  return {
    x: a.x + (b.x - a.x) * k,
    z: a.z + (b.z - a.z) * k,
    h: a.h + wrapAngle(b.h - a.h) * k,
    s: a.s + (b.s - a.s) * k,
  };
}

/** Pose à afficher à l'instant `now` (null si rien n'a été reçu). */
export function samplePose(track: readonly PoseSample[], now: number, delay = INTERP_DELAY_MS): Pose | null {
  const first = track[0];
  const last = track[track.length - 1];
  if (!first || !last) return null;
  const t = now - delay;
  if (t <= first.t) return { x: first.x, z: first.z, h: first.h, s: first.s };
  for (let i = track.length - 1; i > 0; i--) {
    const a = track[i - 1]!;
    const b = track[i]!;
    if (t >= a.t && t <= b.t) return lerpPose(a, b, b.t > a.t ? (t - a.t) / (b.t - a.t) : 1);
  }
  // Après la dernière pose : on prolonge brièvement le mouvement, puis on s'arrête.
  const prev = track[track.length - 2];
  const span = prev ? last.t - prev.t : 0;
  if (!prev || span <= 0 || last.s <= 0) return { x: last.x, z: last.z, h: last.h, s: last.s };
  const over = Math.min(t - last.t, MAX_EXTRAPOLATE_MS);
  const k = over / span;
  const stale = t - last.t > MAX_EXTRAPOLATE_MS * 2;
  return { x: last.x + (last.x - prev.x) * k, z: last.z + (last.z - prev.z) * k, h: last.h, s: stale ? 0 : last.s };
}
