/**
 * Bus du Taret : on monte à un arrêt, on paie un ticket (tarif jeune avant 18 ans) valable avec
 * correspondance, et on descend à un autre arrêt du réseau. Le trajet suit le sens de chaque
 * boucle ; s'il faut changer de ligne, c'est à un arrêt partagé (Gare, Laminoir, Forges).
 * On ne descend pas dans un quartier encore fermé (src/simulation/areas.ts).
 * État : `w.flags.busArrivee` (tick d'arrivée), `w.flags.busTrajets` — pas de champ de sauvegarde ajouté.
 */
import type { WorldState } from '../core/types';
import { minutesOfDay } from '../core/clock';
import { BUS_LINES, BUS_STOPS, BUS_STOP_BY_ID, linePathMeters, pathIndexOf, type BusLine, type BusStop } from '../data/city/transit';
import { areaAt } from '../data/city/layout';
import { areaUnlocked } from './areas';

export const BUS_FARE = 1.6;
export const BUS_FARE_YOUTH = 0.8;
/** Service de 6 h à 22 h. */
export const BUS_HOURS: readonly [number, number] = [6, 22];
/** Mètres parcourus par tick de 10 minutes, arrêts et feux compris (≈ 4 m/s). */
const METERS_PER_TICK = 2400;
/** Attente à une correspondance (ticks). */
const TRANSFER_TICKS = 1;
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

/** Itinéraire : les lignes empruntées, l'arrêt de correspondance éventuel et la durée. */
export interface BusRoute {
  lines: string[];
  transfer?: string;
  ticks: number;
}

function legMeters(line: BusLine, from: string, to: string): number {
  const i = pathIndexOf(line, from);
  const j = pathIndexOf(line, to);
  if (i < 0 || j < 0) return Infinity;
  return linePathMeters(line, i, j);
}

/** Meilleur itinéraire (une correspondance au plus), ou undefined si aucun. */
export function busRoute(fromId: string, toId: string): BusRoute | undefined {
  if (fromId === toId || !BUS_STOP_BY_ID[fromId] || !BUS_STOP_BY_ID[toId]) return undefined;
  let best: { meters: number; lines: string[]; transfer?: string } | undefined;
  for (const l of BUS_LINES) {
    const m = legMeters(l, fromId, toId);
    if (m < (best?.meters ?? Infinity)) best = { meters: m, lines: [l.id] };
  }
  for (const a of BUS_LINES) {
    if (!a.stops.includes(fromId)) continue;
    for (const b of BUS_LINES) {
      if (b === a || !b.stops.includes(toId)) continue;
      for (const hub of a.stops) {
        if (hub === fromId || hub === toId || !b.stops.includes(hub)) continue;
        // La correspondance coûte un peu de temps : elle doit vraiment raccourcir le trajet.
        const m = legMeters(a, fromId, hub) + legMeters(b, hub, toId) + TRANSFER_TICKS * METERS_PER_TICK;
        if (m < (best?.meters ?? Infinity)) best = { meters: m, lines: [a.id, b.id], transfer: hub };
      }
    }
  }
  if (!best || !Number.isFinite(best.meters)) return undefined;
  return { lines: best.lines, transfer: best.transfer, ticks: 1 + Math.ceil(best.meters / METERS_PER_TICK) };
}

/** Durée du trajet (en ticks), attente et correspondance comprises ; 0 si même arrêt. */
export function busRideTicks(fromId: string, toId: string): number {
  return busRoute(fromId, toId)?.ticks ?? 0;
}

export function busRunning(w: WorldState): boolean {
  const h = Math.floor(minutesOfDay(w.time.tick) / 60);
  return h >= BUS_HOURS[0] && h < BUS_HOURS[1];
}

/** L'arrêt est-il dans un quartier ouvert ? Sinon, la raison. */
export function stopOpen(w: WorldState, stopId: string): { open: boolean; reason: string } {
  const s = BUS_STOP_BY_ID[stopId];
  if (!s) return { open: false, reason: 'Arrêt inconnu.' };
  const a = areaAt(s.x, s.y);
  if (areaUnlocked(w, a)) return { open: true, reason: '' };
  return { open: false, reason: `${a.name} : ${a.lock} (palier ${a.tier} de l’Ascension).` };
}

export function takeBus(w: WorldState, toId: string): { ok: boolean; message: string } {
  const from = stopNear(w);
  const to = BUS_STOP_BY_ID[toId];
  if (!from) return { ok: false, message: 'Il faut être à un arrêt de bus.' };
  if (!to || to.id === from.id) return { ok: false, message: 'Choisis un autre arrêt.' };
  if (isOnBus(w)) return { ok: false, message: 'Tu es déjà dans le bus.' };
  if (!busRunning(w)) return { ok: false, message: `Le bus circule de ${BUS_HOURS[0]} h à ${BUS_HOURS[1]} h.` };
  const gate = stopOpen(w, to.id);
  if (!gate.open) return { ok: false, message: `Le bus ne s’arrête pas encore là. ${gate.reason}` };
  const route = busRoute(from.id, to.id);
  if (!route) return { ok: false, message: 'Aucune ligne ne relie ces deux arrêts.' };
  const fare = busFare(w);
  if (w.player.money < fare) return { ok: false, message: `Le ticket coûte ${fare.toFixed(2)} € (tu as ${w.player.money.toFixed(2)} €).` };
  w.player.money = Math.round((w.player.money - fare) * 100) / 100;
  w.player.pos.x = to.x;
  w.player.pos.y = to.y;
  w.flags['busArrivee'] = w.time.tick + route.ticks;
  w.flags['busTrajets'] = (w.flags['busTrajets'] ?? 0) + 1;
  const via = route.transfer ? `, correspondance à ${BUS_STOP_BY_ID[route.transfer]!.name}` : '';
  return { ok: true, message: `Ligne ${route.lines.join(' puis ')} → ${to.name}${via} (${fare.toFixed(2)} €).` };
}
