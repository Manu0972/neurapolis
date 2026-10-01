/**
 * Déplacement du joueur sur la carte : collisions murs + bords de carte.
 * L'entrée (clavier/tactile) appelle tryMove ; la simulation valide et applique.
 */
import type { WorldState } from '../core/types';
import { isWalkable } from '../data/map';

export function canStand(x: number, y: number): boolean {
  return isWalkable(x, y);
}

/** Tente un pas d'une tuile (dx, dy ∈ {-1,0,1}) ; renvoie true si appliqué. */
export function tryMove(w: WorldState, dx: number, dy: number): boolean {
  const nx = w.player.pos.x + dx;
  const ny = w.player.pos.y + dy;
  if (!isWalkable(nx, ny)) return false;
  w.player.pos.x = nx;
  w.player.pos.y = ny;
  return true;
}
