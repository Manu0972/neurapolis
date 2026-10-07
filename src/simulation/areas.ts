/**
 * Quartiers de la grande carte : chacun s'ouvre à un palier de l'Ascension (CITY_AREAS).
 * Le centre est ouvert dès le départ ; le bac à sable ouvre tout. Un drapeau `quartier:<id>`
 * peut ouvrir un quartier en avance (secret, événement, invitation).
 */
import type { WorldState } from '../core/types';
import { areaAt, CITY_AREAS, type CityArea } from '../data/city/layout';

export function areaUnlocked(w: WorldState, area: CityArea): boolean {
  if (area.tier <= 1 || w.economy?.sandbox) return true;
  if ((w.flags[`quartier:${area.id}`] ?? 0) > 0) return true;
  return (w.ascension?.tier ?? 1) >= area.tier;
}

/** La tuile (x, y) est-elle dans un quartier ouvert ? */
export function areaOpen(w: WorldState, x: number, y: number): boolean {
  return areaUnlocked(w, areaAt(x, y));
}

/** Quartiers encore fermés (pour la carte et les barrières). */
export function lockedAreas(w: WorldState): CityArea[] {
  return CITY_AREAS.filter((a) => !areaUnlocked(w, a));
}

/** Quartiers qui ouvrent à ce palier (annonce de palier). */
export function areasOfTier(tier: number): CityArea[] {
  return CITY_AREAS.filter((a) => a.tier === tier);
}

/**
 * Peut-on passer de (fx, fy) à (tx, ty) ? On n'entre pas dans un quartier fermé ; si l'on s'y
 * trouve déjà (vieille sauvegarde, téléportation), on peut s'y déplacer et en sortir.
 */
export function areaPassable(w: WorldState, fx: number, fy: number, tx: number, ty: number): boolean {
  const to = areaAt(tx, ty);
  if (areaUnlocked(w, to)) return true;
  return areaAt(fx, fy).id === to.id;
}
