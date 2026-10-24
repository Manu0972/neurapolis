/**
 * Niveaux de détail et budgets de rendu par qualité (logique pure, testée).
 *
 * Mesures de référence (2026-10-24, GPU intégré AMD Radeon 610M, 1280×720) : le coût d'une image
 * se partage entre le remplissage des pixels (lumières, ombres), le processeur (mise à jour des
 * matrices de ~10 000 objets, appels de dessin) et les triangles des maisons Kenney et de l'horizon.
 * Les budgets ci-dessous coupent ces postes en qualité basse sans toucher au rendu de près.
 */
import type { QualityLevel } from './quality';

export interface RenderBudget {
  /** Distance (m, bord du groupe le plus proche) au-delà de laquelle les maisons Kenney passent en version simplifiée. */
  houseLodNear: number;
  /** Idem pour la ceinture lointaine et les tours de l'horizon. */
  skylineLodNear: number;
  /** Voitures et passants animés (les plus proches du joueur d'abord). */
  cars: number;
  pedestrians: number;
  /** Rayon (m) au-delà duquel voitures et passants ne sont plus dessinés ni animés. */
  ambientRadius: number;
  /** Chalands de la place du marché. */
  shoppers: number;
  /** Distance (m) au-delà de laquelle un personnage est dessiné d'un seul tenant (simpleCharacter). */
  crowdLod: number;
  /** Distance (m) au-delà de laquelle le petit mobilier instancié n'est plus dessiné (chunks.ts). */
  detailFar: number;
  /** Facteur sur la distance du brouillard (portée de vue) : moins de blocs dessinés au loin. */
  viewScale: number;
  /** Contre-jour (lumière directionnelle sans ombre) : une lumière de moins par pixel s'il est coupé. */
  rimLight: boolean;
  /** Ombres « nettes » (un échantillon) plutôt que filtrées (cinq). */
  basicShadows: boolean;
  /** Résolution dynamique : échelle minimale du rendu (1 = jamais réduite). */
  minRenderScale: number;
}

export const RENDER_BUDGETS: Record<QualityLevel, RenderBudget> = {
  bas: { houseLodNear: 55, skylineLodNear: 60, cars: 12, pedestrians: 14, ambientRadius: 170, shoppers: 10, crowdLod: 14, detailFar: 100, viewScale: 0.72, rimLight: false, basicShadows: true, minRenderScale: 0.7 },
  moyen: { houseLodNear: 95, skylineLodNear: 110, cars: 22, pedestrians: 26, ambientRadius: 260, shoppers: 16, crowdLod: 20, detailFar: 130, viewScale: 0.9, rimLight: true, basicShadows: false, minRenderScale: 1 },
  haut: { houseLodNear: 150, skylineLodNear: 170, cars: 30, pedestrians: 34, ambientRadius: 340, shoppers: 22, crowdLod: 26, detailFar: 150, viewScale: 1, rimLight: true, basicShadows: false, minRenderScale: 1 },
};

/** Niveau de détail d'un groupe : 0 = complet, 1 = simplifié. */
export type LodLevel = 0 | 1;

/**
 * Choix du niveau de détail d'un groupe d'instances d'après la distance de la caméra au bord de
 * sa boîte (0 si la caméra est dedans). Hystérésis : un groupe déjà simplifié ne repasse en
 * détail complet qu'un peu en deçà du seuil (pas de clignotement à la limite).
 */
export function chooseLod(edgeDistance: number, near: number, current: LodLevel = 0, hysteresis = 8): LodLevel {
  if (current === 1) return edgeDistance < near - hysteresis ? 0 : 1;
  return edgeDistance > near ? 1 : 0;
}

/** Distance (m, plan horizontal) d'un point au bord d'une boîte alignée ; 0 à l'intérieur. */
export function distanceToBox(x: number, z: number, minX: number, minZ: number, maxX: number, maxZ: number): number {
  const dx = Math.max(minX - x, 0, x - maxX);
  const dz = Math.max(minZ - z, 0, z - maxZ);
  return Math.hypot(dx, dz);
}

/**
 * Indices des éléments à garder visibles : les `budget` plus proches de (x, z) dans `radius`.
 * Pur et sans allocation superflue (trié par distance au carré).
 */
export function nearestWithin(points: readonly { x: number; z: number }[], x: number, z: number, budget: number, radius: number): Set<number> {
  const r2 = radius * radius;
  const cand: { i: number; d: number }[] = [];
  points.forEach((p, i) => {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d <= r2) cand.push({ i, d });
  });
  cand.sort((a, b) => a.d - b.d);
  return new Set(cand.slice(0, Math.max(0, budget)).map((c) => c.i));
}

/**
 * Résolution dynamique (qualité basse) : réduit l'échelle du rendu par pas de 0,1 quand les images
 * sont trop lentes, la remonte quand il reste de la marge. `avgMs` : durée moyenne d'une image.
 */
export function adaptRenderScale(scale: number, avgMs: number, targetMs: number, min: number): number {
  if (min >= 1) return 1;
  let next = scale;
  if (avgMs > targetMs * 1.08) next = scale - 0.1;
  else if (avgMs < targetMs * 0.8) next = scale + 0.1;
  next = Math.round(Math.min(1, Math.max(min, next)) * 10) / 10;
  return next;
}

const ORDER: QualityLevel[] = ['bas', 'moyen', 'haut'];

/**
 * Qualité « Auto » fiable : après la détection, on mesure les vraies images. Si la moyenne reste
 * sous `minFps`, on descend d'un cran (jamais en dessous de « bas », jamais au-dessus de la détection).
 * Renvoie le niveau à appliquer (le même si rien ne change).
 */
export function autoQualityStep(level: QualityLevel, avgMs: number, minFps = 40): QualityLevel {
  if (!(avgMs > 0)) return level;
  const fps = 1000 / avgMs;
  if (fps >= minFps) return level;
  const i = ORDER.indexOf(level);
  return ORDER[Math.max(0, i - 1)]!;
}

/** Moyenne glissante de durées d'image, robuste aux à-coups (on écarte le dixième le plus lent). */
export function robustAverage(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const s = [...samples].sort((a, b) => a - b);
  const keep = s.slice(0, Math.max(1, Math.ceil(s.length * 0.9)));
  return keep.reduce((a, b) => a + b, 0) / keep.length;
}

/** Caméra vue du dessus pour le tri des instances : position, direction au sol, demi-angle utile. */
export interface LodView {
  x: number;
  z: number;
  /** Direction de visée projetée au sol (normée). */
  dirX: number;
  dirZ: number;
  /** Cosinus du demi-angle horizontal gardé (champ de la caméra + marge). */
  cosHalf: number;
  /** En deçà de cette distance (m), tout est gardé, même derrière la caméra (ombres portées). */
  keep: number;
}

/** Niveau d'une instance : 0 = complet, 1 = maquette, 2 = non dessinée (trop loin ou hors champ). */
export type InstanceLevel = 0 | 1 | 2;

/** Cône de vue horizontal d'une caméra perspective (champ vertical en degrés, rapport largeur/hauteur). */
export function viewCone(fovDeg: number, aspect: number, marginDeg = 22): number {
  const half = Math.atan(Math.tan((fovDeg * Math.PI) / 360) * aspect) + (marginDeg * Math.PI) / 180;
  return half >= Math.PI ? -1 : Math.cos(half);
}

/** Niveau d'une instance à `d` m (bord) de la caméra ; `ahead` : elle est dans le cône de vue. */
export function instanceLevel(d: number, ahead: boolean, near: number, far: number, keep: number, current: InstanceLevel): InstanceLevel {
  if (d > far || (!ahead && d > keep)) return 2;
  return chooseLod(d, near, current === 2 ? (d > near ? 1 : 0) : current);
}

/**
 * Niveau de détail par instance : `xz` = positions (x, z) des instances à plat, `levels` = niveaux
 * courants (modifiés sur place ; hystérésis de `chooseLod` entre complet et maquette).
 * `radius` : demi-taille d'une instance (la distance se mesure à son bord, pas à son centre).
 * Renvoie le nombre d'instances par niveau et `true` si un niveau a changé (tampons à réécrire).
 */
export function partitionLod(xz: ArrayLike<number>, levels: Uint8Array, view: LodView, near: number, far: number, radius = 0): { full: number; proxy: number; changed: boolean } {
  let full = 0;
  let proxy = 0;
  let changed = false;
  for (let i = 0; i < levels.length; i++) {
    const dx = xz[i * 2]! - view.x;
    const dz = xz[i * 2 + 1]! - view.z;
    const c = Math.hypot(dx, dz);
    const d = Math.max(0, c - radius);
    // Dans le cône si l'angle au centre, élargi de la taille de l'instance, reste sous le demi-angle.
    const ahead = c <= radius || (dx * view.dirX + dz * view.dirZ) / c >= view.cosHalf - radius / c;
    const next = instanceLevel(d, ahead, near, far, view.keep, levels[i] as InstanceLevel);
    if (next !== levels[i]) { levels[i] = next; changed = true; }
    if (next === 0) full++;
    else if (next === 1) proxy++;
  }
  return { full, proxy, changed };
}

/**
 * Surveillance du temps d'image réel (boucle de jeu) : résolution dynamique et qualité « Auto ».
 * On ignore les intervalles aberrants (onglet masqué, fenêtre modale, chargement) et l'on attend
 * une fenêtre complète d'échantillons avant toute décision.
 */
export interface FrameVerdict {
  /** Qualité à appliquer si « Auto » doit descendre d'un cran (sinon null). */
  quality: QualityLevel | null;
  /** Nouvelle échelle de rendu (résolution dynamique), si elle change (sinon null). */
  scale: number | null;
}

export class FrameMonitor {
  private samples: number[] = [];
  private warm = 0;
  scale = 1;
  constructor(
    /** Images à écarter au départ (compilation des shaders, chargement des modèles). */
    private warmup = 90,
    /** Taille de la fenêtre d'analyse (images). */
    private window = 90,
  ) {}

  /** Remet à zéro après un changement de qualité ou un chargement (les mesures repartent). */
  reset(scale = this.scale): void { this.samples = []; this.warm = 0; this.scale = scale; }

  /**
   * Ajoute l'intervalle (ms) entre deux images. `auto` : la préférence est « Auto ».
   * `budget` : budget de la qualité courante ; `minFps` : seuil de la qualité « Auto ».
   */
  push(dtMs: number, level: QualityLevel, auto: boolean, budget: Pick<RenderBudget, 'minRenderScale'>, targetFps = 45, minFps = 40): FrameVerdict {
    const none: FrameVerdict = { quality: null, scale: null };
    if (!(dtMs > 0) || dtMs > 250) return none;
    if (this.warm < this.warmup) { this.warm++; return none; }
    this.samples.push(dtMs);
    if (this.samples.length < this.window) return none;
    const avg = robustAverage(this.samples);
    this.samples = [];
    if (auto) {
      const q = autoQualityStep(level, avg, minFps);
      if (q !== level) { this.reset(1); return { quality: q, scale: null }; }
    }
    const s = adaptRenderScale(this.scale, avg, 1000 / targetFps, budget.minRenderScale);
    if (s !== this.scale) { this.scale = s; return { quality: null, scale: s }; }
    return none;
  }
}
