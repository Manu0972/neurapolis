/**
 * Relations à quatre dimensions — amitié / confiance / respect / rivalité,
 * jamais une jauge unique (Bible §7). Les événements les font bouger via
 * applyRelation ; « meilleur ami » sert les conséquences d'état (irritabilité, §5).
 */
import type { NpcId, Rel4, WorldState } from '../core/types';
import { ZERO_REL } from '../core/types';
import { NPCS } from '../data/npcs';

const DIMS: ReadonlyArray<keyof Rel4> = ['amitie', 'confiance', 'respect', 'rivalite'];
const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/** Applique un delta 4D (borné 0-100) et renvoie la relation résultante. */
export function applyRelation(w: WorldState, npcId: NpcId, delta: Partial<Rel4>): Rel4 {
  const cur: Rel4 = w.player.relations[npcId] ?? { ...ZERO_REL };
  for (const dim of DIMS) {
    const d = delta[dim];
    if (d !== undefined) cur[dim] = clamp(cur[dim] + d);
  }
  w.player.relations[npcId] = cur;
  return cur;
}

/** L'ami le plus proche (amitié max ; ordre des données en cas d'égalité). */
export function bestFriendId(w: WorldState): NpcId | null {
  let best: NpcId | null = null;
  let bestAmitie = -1;
  for (const def of NPCS) {
    const r = w.player.relations[def.id];
    if (r && r.amitie > bestAmitie) {
      bestAmitie = r.amitie;
      best = def.id;
    }
  }
  return best;
}
