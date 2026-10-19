/**
 * Actions sur le mobilier des intérieurs (lit, bureau, caisse de l'épicerie, établi…).
 * Une seule source de vérité pour le panneau d'intérieur et pour les intérieurs 3D :
 * la présentation demande, la simulation valide et applique.
 */
import type { PlaceId, WorldState } from '../core/types';
import { minutesOfDay } from '../core/clock';
import { INTERIOR_PLACES, type InteractiveFurniture } from '../data/interiors';
import { addXp } from './skills';
import { applyPlaceAction } from './places';
import { studyEveningHomework } from './school_life';

export interface FurnitureActionResult {
  ok: boolean;
  message: string;
  /** Effet spécial à déclencher côté interface (atelier, débat urbain). */
  special?: 'open_workshop' | 'open_debate';
  /** Temps de jeu que prend l'action (minutes) ; la présentation le fait passer. */
  minutes?: number;
}

/** Heure à partir de laquelle le lit propose de se coucher pour la nuit (le sommeil commence à 22 h). */
export const BEDTIME_FROM = 20 * 60;
const NIGHT_START = 22 * 60;
const MORNING = 7 * 60;
const SIESTE_MINUTES = 60;
const DEVOIRS_MINUTES = 60;

export function findFurniture(placeId: PlaceId, furnitureId: string): InteractiveFurniture | undefined {
  for (const room of INTERIOR_PLACES[placeId]?.rooms ?? []) {
    const f = room.furniture.find((x) => x.id === furnitureId);
    if (f) return f;
  }
  return undefined;
}

function isBedtime(w: WorldState): boolean {
  const m = minutesOfDay(w.time.tick);
  return m >= BEDTIME_FROM || m < MORNING;
}

/** Libellé qui dépend de l'heure (le lit : se coucher le soir, sieste le jour), sinon null. */
export function furnitureActionLabel(w: WorldState, placeId: PlaceId, furnitureId: string): string | null {
  const furn = findFurniture(placeId, furnitureId);
  if (!furn) return null;
  if (furn.actionId === 'dormir') {
    return isBedtime(w) ? `${furn.name} — te coucher (dormir jusqu’au matin)` : `${furn.name} — faire une sieste (1 h)`;
  }
  return null;
}

function addNeeds(w: WorldState, needs: Partial<WorldState['player']['needs']>): void {
  for (const [k, d] of Object.entries(needs)) {
    if (d === undefined || !(k in w.player.needs)) continue;
    const key = k as keyof typeof w.player.needs;
    w.player.needs[key] = Math.max(0, Math.min(100, w.player.needs[key] + d));
  }
}

export function useFurniture(w: WorldState, placeId: PlaceId, furnitureId: string): FurnitureActionResult {
  const furn = findFurniture(placeId, furnitureId);
  if (!furn) return { ok: false, message: 'Rien à faire ici.' };
  if (furn.customEffect === 'open_workshop' || furn.customEffect === 'open_debate') {
    return { ok: true, message: furn.actionLabel, special: furn.customEffect };
  }
  // Le lit : le soir on se couche (le temps file jusqu'à 22 h, puis la nuit répare la fatigue) ;
  // dans la journée, une sieste d'une heure.
  if (furn.actionId === 'dormir') {
    if (isBedtime(w)) {
      const m = minutesOfDay(w.time.tick);
      const minutes = m >= BEDTIME_FROM && m < NIGHT_START ? NIGHT_START - m : 10;
      addNeeds(w, { stress: -5 });
      return { ok: true, message: 'Tu te couches. Bonne nuit ! Le sommeil répare ta fatigue jusqu’au matin.', minutes };
    }
    addNeeds(w, { fatigue: -25, stress: -5, faim: 5 });
    return { ok: true, message: 'Une heure de sieste : tu te sens reposé·e (Fatigue −25).', minutes: SIESTE_MINUTES };
  }
  // Le bureau de la chambre : les devoirs du soir (une séance comptée par jour).
  if (furn.actionId === 'devoirs') {
    const r = studyEveningHomework(w);
    if (r.ok) addXp(w, 'organisation', 1);
    return { ok: r.ok, message: r.message, minutes: r.ok ? DEVOIRS_MINUTES : 0 };
  }
  if (furn.money !== undefined && furn.money < 0 && w.player.money < Math.abs(furn.money)) {
    return { ok: false, message: `Fonds insuffisants : il te faut ${Math.abs(furn.money).toFixed(2).replace('.', ',')} €.` };
  }
  if (furn.money !== undefined) w.player.money = Math.max(0, Math.round((w.player.money + furn.money) * 100) / 100);
  if (furn.needs) addNeeds(w, furn.needs);
  if (furn.skill && furn.xp) addXp(w, furn.skill, furn.xp);
  // Certaines actions existent aussi comme actions de lieu (achat de goûter, courses…).
  const placeResult = applyPlaceAction(w, placeId, furn.actionId);
  // Sans message de lieu, on raconte ce que le joueur découvre (la description du meuble).
  const told = furn.description ? `✓ ${furn.actionLabel.replace(/\s*\([^)]*\)\s*$/, '')}. ${furn.description}` : `✓ ${furn.actionLabel}`;
  return { ok: true, message: placeResult.ok && placeResult.message ? placeResult.message : told, minutes: furn.minutes };
}
