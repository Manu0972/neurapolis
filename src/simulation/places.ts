/**
 * Actions contextuelles des lieux : chaque action applique ses conséquences
 * chiffrées (besoins bornés 0-100, argent) et renvoie un message de résultat.
 */
import type { PlaceId, WorldState } from '../core/types';
import { NEED_LABELS, PLACE_BY_ID } from '../data/places';
import { addXp } from './skills';
import { bump } from './events';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export interface ActionOutcome {
  ok: boolean;
  message: string;
}

export function applyPlaceAction(w: WorldState, placeId: PlaceId, actionId: string): ActionOutcome {
  const def = PLACE_BY_ID[placeId];
  if (!def) return { ok: false, message: 'Lieu inconnu.' };
  const action = def.actions.find((a) => a.id === actionId);
  if (!action) return { ok: false, message: 'Action inconnue.' };
  if (action.money !== undefined && w.player.money + action.money < 0) {
    return { ok: false, message: 'Pas assez d’argent pour ça.' };
  }
  const parts: string[] = [];
  if (action.needs) {
    for (const [key, delta] of Object.entries(action.needs)) {
      if (delta === undefined) continue;
      const need = key as keyof typeof NEED_LABELS;
      w.player.needs[need] = clamp(w.player.needs[need] + delta);
      parts.push(`${NEED_LABELS[need]} ${delta >= 0 ? '+' : ''}${delta}`);
    }
  }
  if (action.money !== undefined && action.money !== 0) {
    w.player.money += action.money;
    parts.push(`${action.money >= 0 ? '+' : ''}${action.money} €`);
    if (action.money < 0) {
      bump(w, 'depenses'); // chaque dépense compte (découvertes de notions)
      if (placeId === 'epicerie') bump(w, 'echanges'); // un achat = un échange vécu (déclencheur Smith, M4)
    }
  }
  if (placeId === 'maison' && actionId === 'telephone') bump(w, 'distractions'); // déclencheur Stiegler (§6)
  if (action.skill) addXp(w, action.skill, action.xp ?? 1); // XP par pratique
  return { ok: true, message: parts.join(' · ') };
}
