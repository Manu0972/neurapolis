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

/**
 * Déplacement continu (ville 3D) : la présentation propose la tuile où se trouve désormais le
 * centre du personnage. Acceptée seulement si elle est franchissable et voisine (8 directions)
 * de la tuile actuelle : aucune téléportation possible par l'interface.
 */
export function moveToTile(w: WorldState, x: number, y: number): boolean {
  const dx = x - w.player.pos.x;
  const dy = y - w.player.pos.y;
  if (dx === 0 && dy === 0) return true;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
  if (!Number.isInteger(x) || !Number.isInteger(y) || !isWalkable(x, y)) return false;
  w.player.pos.x = x;
  w.player.pos.y = y;
  return true;
}
