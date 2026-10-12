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
