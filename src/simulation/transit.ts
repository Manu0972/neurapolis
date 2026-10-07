/**
 * Bus de la ligne 1 : on monte à un arrêt, on paie (tarif jeune avant 18 ans) et on descend
 * à un autre arrêt de la boucle. Le trajet prend du temps de jeu (ellipse côté présentation).
 * État : `w.flags.busArrivee` (tick d'arrivée), `w.flags.busTrajets` — pas de champ de sauvegarde ajouté.
 */
import type { WorldState } from '../core/types';
import { minutesOfDay } from '../core/clock';
import { BUS_STOPS, BUS_STOP_BY_ID, type BusStop } from '../data/city/transit';

export const BUS_FARE = 1.6;
export const BUS_FARE_YOUTH = 0.8;
/** Service de 6 h à 22 h. */
export const BUS_HOURS: readonly [number, number] = [6, 22];
/** Mètres parcourus par tick de 10 minutes, arrêts et feux compris (≈ 4 m/s). */
const METERS_PER_TICK = 2400;
/** Distance à laquelle on est « à l'arrêt ». */
export const STOP_REACH = 3;

export function busFare(w: WorldState): number {
  return w.player.age < 18 ? BUS_FARE_YOUTH : BUS_FARE;
}

export function isOnBus(w: WorldState): boolean {
  return (w.flags['busArrivee'] ?? 0) > w.time.tick;
}

export function stopNear(w: WorldState, reach = STOP_REACH): BusStop | undefined {
  const { x, y } = w.player.pos;
  return BUS_STOPS.find((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) <= reach);
}

/** Durée du trajet (en ticks) dans le sens de la boucle, attente comprise. */
export function busRideTicks(fromId: string, toId: string): number {
  const i = BUS_STOPS.findIndex((s) => s.id === fromId);
  const j = BUS_STOPS.findIndex((s) => s.id === toId);
  if (i < 0 || j < 0 || i === j) return 0;
  let meters = 0;
  for (let k = i; k !== j; k = (k + 1) % BUS_STOPS.length) {
    const a = BUS_STOPS[k]!;
    const b = BUS_STOPS[(k + 1) % BUS_STOPS.length]!;
    meters += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  return 1 + Math.ceil(meters / METERS_PER_TICK);
}

export function busRunning(w: WorldState): boolean {
  const h = Math.floor(minutesOfDay(w.time.tick) / 60);
  return h >= BUS_HOURS[0] && h < BUS_HOURS[1];
}

export function takeBus(w: WorldState, toId: string): { ok: boolean; message: string } {
  const from = stopNear(w);
  const to = BUS_STOP_BY_ID[toId];
  if (!from) return { ok: false, message: 'Il faut être à un arrêt de bus.' };
  if (!to || to.id === from.id) return { ok: false, message: 'Choisis un autre arrêt.' };
  if (isOnBus(w)) return { ok: false, message: 'Tu es déjà dans le bus.' };
  if (!busRunning(w)) return { ok: false, message: `Le bus circule de ${BUS_HOURS[0]} h à ${BUS_HOURS[1]} h.` };
  const fare = busFare(w);
  if (w.player.money < fare) return { ok: false, message: `Le ticket coûte ${fare.toFixed(2)} € (tu as ${w.player.money.toFixed(2)} €).` };
  w.player.money = Math.round((w.player.money - fare) * 100) / 100;
  w.player.pos.x = to.x;
  w.player.pos.y = to.y;
  w.flags['busArrivee'] = w.time.tick + busRideTicks(from.id, to.id);
  w.flags['busTrajets'] = (w.flags['busTrajets'] ?? 0) + 1;
  return { ok: true, message: `Ligne 1 → ${to.name} (${fare.toFixed(2)} €).` };
}
