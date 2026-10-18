/**
 * Choix de l'animation d'un personnage riggé (logique pure, sans Three.js) :
 * allure selon la vitesse (repos, marche, petite course, course) avec hystérésis pour ne pas
 * clignoter entre deux clips, cadence des clips calée sur la vitesse réelle (pas de pieds qui
 * glissent), et activités à l'arrêt (assis, parler).
 */

export type Gait = 'idle' | 'walk' | 'jog' | 'run';
/** Activité demandée par le jeu ; `auto` = la locomotion seule décide. */
export type CharacterActivity = 'auto' | 'idle' | 'sit' | 'talk';
/** Clips de la bibliothèque UAL utilisés par le jeu (noms de `public/assets/anim/neurapolis_anims.glb`). */
export type RigClip = 'idle' | 'walk' | 'jog' | 'run' | 'sit' | 'talk';
export const RIG_CLIPS: readonly RigClip[] = ['idle', 'walk', 'jog', 'run', 'sit', 'talk'];

/**
 * Vitesse au sol (m/s) de chaque clip à cadence 1 pour le mannequin UAL (bassin à 0,92 m),
 * mesurée sur le pied d'appui dans le jeu (2026-10-12 : marche 0,87, petite course ≈ 5,2,
 * course ≈ 7,7 ; les deux dernières sont bruitées, arrondies vers le bas). Un personnage plus
 * petit fait des pas plus courts : on multiplie par `legScale` (bassin du modèle / mannequin).
 */
export const NATURAL_SPEED: Record<Exclude<Gait, 'idle'>, number> = { walk: 0.9, jog: 4.0, run: 7.0 };

// ---------- Fondu d'allures calé sur le sol (v6) ----------
//
// Mesure faite sur les clips UAL (pied d'appui, cadence 1, mannequin à bassin 0,92 m) :
//   marche 0,8 m/s (cycle 1,33 s) · petite course 5,4 m/s (0,93 s) · course ≈ 7,4 m/s (0,67 s).
// Les clips ne couvrent donc pas 1 à 5 m/s (la marche du joueur est à 3 m/s) : avec un seul clip
// le pied patinait de 30 à 270 %. On fond deux clips voisins (même phase de pas) et on choisit la
// cadence pour que la vitesse du pied d'appui égale la vitesse au sol.

export interface LocoClipSpec { /** Longueur du cycle (s). */ dur: number; /** Vitesse du pied d'appui (m/s). */ v: number; /** Décalage de phase du 1er contact. */ phase: number }
export const LOCO_SPEC: Record<'walk' | 'jog' | 'run', LocoClipSpec> = {
  walk: { dur: 1.3333, v: 0.8, phase: 0 },
  jog: { dur: 0.9333, v: 5.4, phase: 0 },
  run: { dur: 0.6667, v: 7.4, phase: -0.1 },
};

export interface LocoBlend {
  walk: number;
  jog: number;
  run: number;
  /** Cycles de pas par seconde (commun aux clips fondus). */
  cadence: number;
}

/** Longueur (m) et cadence (cycles/s) d'un clip à cadence naturelle. */
const stride = (c: 'walk' | 'jog' | 'run'): { L: number; f: number } => ({ L: LOCO_SPEC[c].v * LOCO_SPEC[c].dur, f: 1 / LOCO_SPEC[c].dur });

/** Vitesse au sol atteinte en fondant `a` vers `b` d'un poids w. */
function blendedSpeed(a: 'walk' | 'jog' | 'run', b: 'walk' | 'jog' | 'run', w: number): number {
  const A = stride(a);
  const B = stride(b);
  return (A.L + (B.L - A.L) * w) * (A.f + (B.f - A.f) * w);
}

function solveWeight(a: 'walk' | 'jog' | 'run', b: 'walk' | 'jog' | 'run', v: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (blendedSpeed(a, b, mid) < v) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Poids des clips de marche/course et cadence pour une vitesse au sol `speed` (m/s) : le pied
 * d'appui avance à la vitesse du sol (pas de patinage). `legScale` : longueur de jambe relative
 * au mannequin (un enfant fait des pas plus courts, donc à vitesse égale une cadence plus haute).
 */
export function locoBlend(speed: number, legScale = 1): LocoBlend {
  const v = (Number.isFinite(speed) && speed > 0 ? speed : 0) / Math.max(0.3, legScale);
  const vWalk = blendedSpeed('walk', 'walk', 0);
  const vJog = blendedSpeed('jog', 'jog', 0);
  const vRun = blendedSpeed('run', 'run', 0);
  if (v <= vWalk) {
    const s = stride('walk');
    return { walk: 1, jog: 0, run: 0, cadence: Math.max(0.3, v / s.L) };
  }
  if (v < vJog) {
    const w = solveWeight('walk', 'jog', v);
    return { walk: 1 - w, jog: w, run: 0, cadence: v / (stride('walk').L + (stride('jog').L - stride('walk').L) * w) };
  }
  if (v < vRun) {
    const w = solveWeight('jog', 'run', v);
    return { walk: 0, jog: 1 - w, run: w, cadence: v / (stride('jog').L + (stride('run').L - stride('jog').L) * w) };
  }
  return { walk: 0, jog: 0, run: 1, cadence: v / stride('run').L };
}

/** Proportion « en marche » (0 à 1) selon la vitesse : fondu doux entre repos et marche, sans à-coup. */
export function movingAmount(speed: number): number {
  const t = Math.max(0, Math.min(1, ((Number.isFinite(speed) ? speed : 0) - 0.12) / 0.4));
  return t * t * (3 - 2 * t);
}

/**
 * Lissage de la vitesse affichée : on accélère en douceur (`up`) mais on s'arrête plus franchement
 * (`down`), pour qu'un personnage ne glisse pas après avoir atteint sa cible.
 */
export function smoothSpeed(cur: number, target: number, dt: number, up = 8, down = 18): number {
  const rate = target >= cur ? up : down;
  const next = cur + (target - cur) * (1 - Math.exp(-rate * Math.max(0, dt)));
  return next < 0.02 && target <= 0 ? 0 : next;
}

/** Seuils (m/s, à l'échelle du mannequin) : on monte d'allure au-dessus de UP, on redescend sous DOWN. */
const UP: Record<Exclude<Gait, 'idle'>, number> = { walk: 0.3, jog: 1.9, run: 6.0 };
const DOWN: Record<Exclude<Gait, 'idle'>, number> = { walk: 0.15, jog: 1.6, run: 5.4 };
const ORDER: readonly Gait[] = ['idle', 'walk', 'jog', 'run'];

/** Allure suivante, avec hystérésis (une vitesse entre deux seuils garde l'allure en cours). */
export function nextGait(prev: Gait, speed: number, legScale = 1): Gait {
  const v = (Number.isFinite(speed) && speed > 0 ? speed : 0) / Math.max(0.3, legScale);
  let i = ORDER.indexOf(prev);
  if (i < 0) i = 0;
  while (i < ORDER.length - 1 && v > UP[ORDER[i + 1] as Exclude<Gait, 'idle'>]) i++;
  while (i > 0 && v < DOWN[ORDER[i] as Exclude<Gait, 'idle'>]) i--;
  return ORDER[i]!;
}

/** Cadence de lecture du clip d'allure pour coller à la vitesse réelle (bornée). */
export function gaitRate(gait: Gait, speed: number, legScale = 1): number {
  if (gait === 'idle') return 1;
  const r = (Number.isFinite(speed) ? speed : 0) / (NATURAL_SPEED[gait] * Math.max(0.3, legScale));
  return Math.max(0.5, Math.min(2, r));
}

/** Clip à jouer : en mouvement, l'allure l'emporte toujours ; à l'arrêt, l'activité demandée. */
export function chooseClip(gait: Gait, activity: CharacterActivity): RigClip {
  if (gait !== 'idle') return gait;
  if (activity === 'sit') return 'sit';
  if (activity === 'talk') return 'talk';
  return 'idle';
}

const TALKING = /discut|bavard|papot|n[ée]goci|interview|accueill|enseign|r[ée]unit|raconte|contes?\b|d[ée]bat|parle|explique|d[ée]march|conseill|anime|harangu|vend\b/i;

/**
 * Activité visible d'un PNJ à l'arrêt, d'après le libellé de sa routine (« discute avec tout le
 * monde », « enseigne »…). On ne renvoie jamais « assis » : la ville n'expose pas encore la
 * position de ses bancs, et un personnage assis dans le vide serait pire que debout.
 */
export function activityFromLabel(label: string | undefined): CharacterActivity {
  if (!label) return 'idle';
  return TALKING.test(label) ? 'talk' : 'idle';
}

/** Intervalle (s) entre deux mises à jour d'animation selon la distance au point de vue (LOD). */
export function animInterval(distance: number): number {
  if (!Number.isFinite(distance) || distance < 22) return 0;
  if (distance < 50) return 1 / 20;
  if (distance < 110) return 1 / 8;
  return 0.5;
}
