/**
 * Actions contextuelles des lieux : chaque action applique ses conséquences
 * chiffrées (besoins bornés 0-100, argent) et renvoie un message de résultat.
 */
import type { PlaceId, WorldState } from '../core/types';
import { NEED_LABELS, PLACE_BY_ID } from '../data/places';
import { addXp } from './skills';
import { bump } from './events';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export interface PlaceOpeningConfig {
  openMin: number;
  closeMin: number;
  lunchCloseMin?: number;
  lunchOpenMin?: number;
  schoolOnly?: boolean;
  wednesdayCloseMin?: number;
}

export const PLACE_OPENING_HOURS: Record<string, PlaceOpeningConfig> = {
  college: { openMin: 7 * 60 + 30, closeMin: 18 * 60, schoolOnly: true, wednesdayCloseMin: 13 * 60 + 30 },
  epicerie: { openMin: 7 * 60 + 30, closeMin: 19 * 60 + 30, lunchCloseMin: 13 * 60, lunchOpenMin: 14 * 60 + 30 },
  parc: { openMin: 6 * 60, closeMin: 21 * 60 },
  friche: { openMin: 7 * 60, closeMin: 21 * 60 },
  place: { openMin: 6 * 60, closeMin: 22 * 60 },
  maison: { openMin: 0, closeMin: 24 * 60 },
};

export function isPlaceOpen(
  placeId: string,
  minutes: number,
  schoolDay: boolean,
  isWeekend: boolean,
  isVacances: boolean,
  weekday: number,
): boolean {
  const config = PLACE_OPENING_HOURS[placeId];
  if (!config) return true;
  if (config.schoolOnly && (!schoolDay || isWeekend || isVacances)) return false;
  if (weekday === 3 && config.wednesdayCloseMin !== undefined && minutes >= config.wednesdayCloseMin) return false;
  if (minutes < config.openMin || minutes >= config.closeMin) return false;
  if (config.lunchCloseMin !== undefined && config.lunchOpenMin !== undefined) {
    if (minutes >= config.lunchCloseMin && minutes < config.lunchOpenMin) return false;
  }
  return true;
}

export interface ActionOutcome {
  ok: boolean;
  message: string;
}

export function applyPlaceAction(w: WorldState, placeId: PlaceId, actionId: string): ActionOutcome {
  const def = PLACE_BY_ID[placeId];
  if (!def) return { ok: false, message: 'Lieu inconnu.' };
  const action = def.actions.find((a) => a.id === actionId);
  if (!action) return { ok: false, message: 'Action inconnue.' };
  if (placeId === 'place' && actionId === 'debat') {
    return { ok: false, message: 'Ouvre le débat citoyen pour choisir un projet et en voir le coût.' };
  }
  if (placeId === 'friche' && actionId === 'atelier') {
    return { ok: true, message: 'Accès à l’Atelier de la Friche.' };
  }
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
