/**
 * Écran d'accueil : « Reprendre la partie » charge la sauvegarde automatique (faite chaque nuit).
 * Si le joueur a sauvegardé à la main plus tard dans la journée, on lui propose aussi cet
 * emplacement, sinon sa soirée de jeu serait perdue sans qu'il le sache. Fonction pure.
 */
import type { SlotSummary } from '../saves/persist';

/** Les emplacements manuels proposés au chargement. */
export const MANUAL_SLOTS: readonly string[] = ['slot1', 'slot2', 'slot3'];

/** « slot2 » → « 2 » (numéro affiché au joueur). */
export function slotNumber(slot: string): string {
  return slot.replace(/^slot/, '');
}

/** L'emplacement manuel le plus récent, s'il est plus avancé que la sauvegarde automatique (sinon null). */
export function newerManualSlot(autoTick: number | undefined, slots: readonly SlotSummary[]): SlotSummary | null {
  let best: SlotSummary | null = null;
  for (const s of slots) {
    if (!s.exists || s.error || s.tick === undefined) continue;
    if (autoTick !== undefined && s.tick <= autoTick) continue;
    if (!best || s.tick > (best.tick ?? -1)) best = s;
  }
  return best;
}
