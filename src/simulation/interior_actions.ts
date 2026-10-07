/**
 * Actions sur le mobilier des intérieurs (lit, bureau, caisse de l'épicerie, établi…).
 * Une seule source de vérité pour le panneau d'intérieur et pour les intérieurs 3D :
 * la présentation demande, la simulation valide et applique.
 */
import type { PlaceId, WorldState } from '../core/types';
import { INTERIOR_PLACES, type InteractiveFurniture } from '../data/interiors';
import { addXp } from './skills';
import { applyPlaceAction } from './places';

export interface FurnitureActionResult {
  ok: boolean;
  message: string;
  /** Effet spécial à déclencher côté interface (atelier, débat urbain). */
  special?: 'open_workshop' | 'open_debate';
}

export function findFurniture(placeId: PlaceId, furnitureId: string): InteractiveFurniture | undefined {
  for (const room of INTERIOR_PLACES[placeId]?.rooms ?? []) {
    const f = room.furniture.find((x) => x.id === furnitureId);
    if (f) return f;
  }
  return undefined;
}

export function useFurniture(w: WorldState, placeId: PlaceId, furnitureId: string): FurnitureActionResult {
  const furn = findFurniture(placeId, furnitureId);
  if (!furn) return { ok: false, message: 'Rien à faire ici.' };
  if (furn.customEffect === 'open_workshop' || furn.customEffect === 'open_debate') {
    return { ok: true, message: furn.actionLabel, special: furn.customEffect };
  }
  if (furn.money !== undefined && furn.money < 0 && w.player.money < Math.abs(furn.money)) {
    return { ok: false, message: `Fonds insuffisants : il te faut ${Math.abs(furn.money).toFixed(2)} €.` };
  }
  if (furn.money !== undefined) w.player.money = Math.max(0, Math.round((w.player.money + furn.money) * 100) / 100);
  if (furn.needs) {
    for (const [k, d] of Object.entries(furn.needs)) {
      if (d === undefined || !(k in w.player.needs)) continue;
      const key = k as keyof typeof w.player.needs;
      w.player.needs[key] = Math.max(0, Math.min(100, w.player.needs[key] + d));
    }
  }
  if (furn.skill && furn.xp) addXp(w, furn.skill, furn.xp);
  // Certaines actions existent aussi comme actions de lieu (achat de goûter, courses…).
  const placeResult = applyPlaceAction(w, placeId, furn.actionId);
  return { ok: true, message: placeResult.ok && placeResult.message ? placeResult.message : `✓ ${furn.actionLabel}` };
}
