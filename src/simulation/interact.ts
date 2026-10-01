/**
 * Cibles d'interaction autour du joueur : entrées de lieux adjacentes et PNJ proches.
 * La présentation lit ces cibles pour afficher l'invite et les panneaux.
 */
import type { NpcState, PlaceId, WorldState } from '../core/types';
import { entranceAt } from '../data/map';
import { npcPosition } from './npc';

const ADJACENT: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
];

/** Lieu dont l'entrée est sur la tuile du joueur ou adjacente. */
export function placeAtAdjacent(w: WorldState): PlaceId | undefined {
  const { x, y } = w.player.pos;
  for (const [dx, dy] of ADJACENT) {
    const place = entranceAt(x + dx, y + dy);
    if (place) return place;
  }
  return undefined;
}

/** PNJ dont la position (ancre de lieu + décalage stable) est à portée de dialogue. */
export function npcsNearby(w: WorldState, dist = 2): NpcState[] {
  const { x, y } = w.player.pos;
  return Object.values(w.npcs).filter((n) => {
    const p = npcPosition(w, n.id);
    return Math.abs(p.x - x) <= dist && Math.abs(p.y - y) <= dist;
  });
}
