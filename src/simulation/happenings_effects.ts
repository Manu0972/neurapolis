/**
 * Effets en cours du fil d'infos et des surprises sur la demande. Module sans dépendance
 * vers l'économie ni l'Ascension (qui le lisent), pour éviter les imports circulaires.
 */
import type { WorldState } from '../core/types';
import type { Sector } from '../core/happenings_types';
import type { BusinessTypeDef } from '../core/economy_types';
import { dayIndexOf } from '../core/clock';

/** Multiplicateur de demande pour un secteur, et éventuellement une cible précise. */
export function sectorDemand(w: WorldState, sector: Sector, target?: string): number {
  const h = w.happenings;
  if (!h || h.effects.length === 0) return 1;
  const day = dayIndexOf(w.time.tick);
  let m = 1;
  for (const e of h.effects) {
    if (e.untilDay <= day) continue;
    if (e.target ? e.target === target : e.sector === sector) m *= e.mult;
  }
  return Math.max(0, Math.min(3, m));
}

/** Secteur d'un type de commerce physique, d'après ce qu'il vend. */
export function sectorOfBusinessType(t: BusinessTypeDef): Sector {
  const c = t.productCategories as readonly string[];
  if (c.includes('vetement')) return 'mode';
  if (c.includes('livre') || c.includes('papeterie')) return 'culture';
  if (c.includes('fleur')) return 'commerce';
  return 'alimentation';
}
