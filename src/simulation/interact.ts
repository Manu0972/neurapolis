/**
 * Cibles d'interaction autour du joueur : entrées de lieux adjacentes et PNJ proches.
 * La présentation lit ces cibles pour afficher l'invite et les panneaux.
 */
import type { NpcState, PlaceId, WorldState } from '../core/types';
import { PLACE_ANCHORS, entranceAt } from '../data/map';
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

/** Portée (tuiles) autour du parvis d'un lieu : la même que celle des missions (MISSION_REACH). */
export const PLACE_REACH = 2;

/**
 * Le joueur est-il devant ce lieu : entrée adjacente, ou parvis (case devant la porte) à moins de
 * PLACE_REACH tuiles ? Sert à « aller en cours » : avant, seule la case collée à la porte comptait,
 * et à deux pas E ouvrait la discussion du camarade posté devant le collège au lieu du cours.
 */
export function nearPlace(w: WorldState, place: PlaceId, reach = PLACE_REACH): boolean {
  if (placeAtAdjacent(w) === place) return true;
  const a = PLACE_ANCHORS[place];
  return Math.max(Math.abs(a.x - w.player.pos.x), Math.abs(a.y - w.player.pos.y)) <= reach;
}

/** PNJ dont la position (ancre de lieu + décalage stable) est à portée de dialogue. */
export function npcsNearby(w: WorldState, dist = 2): NpcState[] {
  const { x, y } = w.player.pos;
  return Object.values(w.npcs).filter((n) => {
    const p = npcPosition(w, n.id);
    return Math.abs(p.x - x) <= dist && Math.abs(p.y - y) <= dist;
  });
}
