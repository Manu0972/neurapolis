/**
 * Musique adaptative — lecture de la situation dans l'état du monde.
 *
 * Lecture seule : aucune fonction `ensure*` (qui créerait des sous-états), aucun tirage du PRNG
 * de la simulation. La présentation fournit en plus ce qu'elle seule connaît (fenêtre ouverte,
 * intérieur 3D où se trouve le joueur).
 */
import type { WorldState } from '../../core/types';
import { dayIndexOf, minutesOfDay } from '../../core/clock';
import { SURPRISE_BY_ID } from '../../data/happenings_registry';
import { PLACE_ANCHORS } from '../../data/map';
import { areaAt } from '../../data/city/layout';
import { moodForModal, type MusicSignals } from './director';

/** Ce que la présentation sait et que le monde ignore. */
export interface MusicScene {
  /** Titre de la fenêtre ouverte (null si aucune). */
  modalTitle?: string | null;
  /** Intérieur 3D où se trouve le joueur : lieu et pièce. */
  interiorPlace?: string;
  interiorRoom?: string;
  /** Lieu d'ambiance courant (panneau de lieu en 2D). */
  location?: string;
}

/** Rayon (cases) dans lequel on est « près » d'un lieu. */
const NEAR_PLACE_RADIUS = 24;

function nearestPlace(w: WorldState): string | null {
  const { x, y } = w.player.pos;
  let best: string | null = null;
  let bestD = NEAR_PLACE_RADIUS + 1;
  for (const [id, a] of Object.entries(PLACE_ANCHORS)) {
    const d = Math.max(Math.abs(a.x - x), Math.abs(a.y - y));
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

/** Offensive d'un rival (0-1) : seulement pendant une contre-attaque, plus forte sur son terrain. */
function rivalPressure(w: WorldState, near: string | null): number {
  let p = 0;
  for (const r of Object.values(w.rivals ?? {})) {
    if (!r || r.strategy === 'standard' || r.reactionCooldown <= 0) continue;
    let v = 0.4 + (r.aggressiveness - 60) / 100;
    if (near && r.place === near) v += 0.25;
    p = Math.max(p, v);
  }
  return Math.max(0, Math.min(1, p));
}

/** Coup dur (0-1) : surprise en attente, très grosse erreur du jour ou de la veille. */
function gravity(w: WorldState, today: number): number {
  let g = 0;
  const pending = w.happenings?.pending;
  const tone = pending ? SURPRISE_BY_ID[pending.surpriseId]?.tone : undefined;
  if (tone === 'catastrophe') g = 1;
  else if (tone === 'mauvais') g = 0.7;
  const last = w.rewind?.last;
  if (last) {
    const age = today - last.day;
    if (age <= 0) g = Math.max(g, 0.9);
    else if (age === 1) g = Math.max(g, 0.5);
  }
  return g;
}

function convocationWeight(w: WorldState, today: number): number {
  const c = w.family?.convocation;
  if (!c) return 0;
  return today - c.day <= 0 ? 0.7 : 0.45;
}

/** Entreprise dans le rouge (faillite à 10 jours consécutifs) : 0,6 dès 3 jours, puis plus fort. */
function redVentureWeight(w: WorldState): number {
  let worst = 0;
  for (const v of Object.values(w.ascension?.ventures ?? {})) {
    if (!v || v.closed) continue;
    worst = Math.max(worst, v.redDays);
  }
  return worst >= 3 ? Math.min(1, 0.6 + 0.04 * (worst - 3)) : 0;
}

function totalDebt(w: WorldState): number {
  let d = 0;
  for (const l of w.economy?.loans ?? []) d += Math.max(0, l.remaining);
  return d;
}

/** Extrait les signaux musicaux du monde (lecture seule) et de la scène de présentation. */
export function readMusicSignals(w: WorldState, scene: MusicScene = {}): MusicSignals {
  const today = dayIndexOf(w.time.tick);
  const near = nearestPlace(w);
  const insideHome = scene.interiorPlace === 'maison' || (!scene.interiorPlace && scene.location === 'maison');
  const inBedroom = scene.interiorPlace === 'maison' && (scene.interiorRoom ?? 'chambre') === 'chambre';
  let district = 'centre';
  try { district = areaAt(w.player.pos.x, w.player.pos.y).district; } catch { /* hors carte : centre */ }
  return {
    hour: minutesOfDay(w.time.tick) / 60,
    asleep: !!w.player.asleep,
    insideHome,
    inBedroom,
    nearPlace: near,
    district,
    stress: w.player.needs?.stress ?? 0,
    moral: w.player.needs?.moral ?? 50,
    money: w.player.money,
    debt: totalDebt(w),
    rival: rivalPressure(w, near),
    grave: gravity(w, today),
    convocation: convocationWeight(w, today),
    redVenture: redVentureWeight(w),
    chapters: w.campaign?.completedChapters?.length ?? 0,
    tier: w.ascension?.tier ?? 1,
    rewinds: w.rewind?.count ?? 0,
    sales: (w.flags?.['ventes'] ?? 0) + (w.flags?.['ventesEtal'] ?? 0),
    scene: moodForModal(scene.modalTitle),
  };
}
