/**
 * Habitants nommés des nouveaux quartiers (AG-3, src/data/residents/residents.ts) : chacun a sa
 * place sur le trottoir de sa rue, ses heures, ses répliques et ses rumeurs. Une rumeur par jour
 * et par habitant ; celle qui pointe vers un secret en donne l'indice (drapeau `indice:<id>`).
 * Tout est déterministe : position et réplique viennent de l'identifiant et du jour.
 */
import type { WorldState } from '../core/types';
import { dayIndexOf, minutesOfDay } from '../core/clock';
import { CITY_AREAS } from '../data/city/layout';
import { CITY, isWalkable, surfaceAt } from '../data/map';
import { RESIDENTS, type ResidentDef } from '../data/residents/residents';
import { areaUnlocked } from './areas';

const hashOf = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

/** Trottoir libre le plus proche (rayon 12). */
function sidewalkNear(x0: number, y0: number): { x: number; y: number } | null {
  for (let r = 0; r <= 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = x0 + dx;
        const y = y0 + dy;
        if (isWalkable(x, y) && surfaceAt(x, y) === 'trottoir') return { x, y };
      }
    }
  }
  return null;
}

const SPOTS = new Map<string, { x: number; y: number } | null>();

/** Place de l'habitant : sur sa rue, dans son quartier, à un endroit propre à lui. */
export function residentSpot(r: ResidentDef): { x: number; y: number } | null {
  if (SPOTS.has(r.id)) return SPOTS.get(r.id)!;
  const area = CITY_AREAS.find((a) => a.id === r.district);
  let spot: { x: number; y: number } | null = null;
  if (area) {
    const roads = CITY.roads.filter((rd) => rd.name === r.street);
    for (const rd of roads) {
      const x0 = Math.max(rd.x, area.x);
      const x1 = Math.min(rd.x + rd.w, area.x + area.w);
      const y0 = Math.max(rd.y, area.y);
      const y1 = Math.min(rd.y + rd.h, area.y + area.h);
      if (x1 - x0 < 1 || y1 - y0 < 1) continue;
      const t = 0.15 + (hashOf(r.id) % 1000) / 1000 * 0.7;
      const side = hashOf(`${r.id}:cote`) % 2 === 0 ? -2 : 2;
      const px = rd.axis === 'h' ? Math.floor(x0 + (x1 - x0) * t) : (side < 0 ? x0 - 2 : x1 + 1);
      const py = rd.axis === 'v' ? Math.floor(y0 + (y1 - y0) * t) : (side < 0 ? y0 - 2 : y1 + 1);
      spot = sidewalkNear(px, py);
      if (spot) break;
    }
  }
  SPOTS.set(r.id, spot);
  return spot;
}

/** Habitants dans la rue maintenant (heures de présence, quartier ouvert). */
export function residentsPresent(w: WorldState): { def: ResidentDef; x: number; y: number }[] {
  const m = minutesOfDay(w.time.tick);
  const out: { def: ResidentDef; x: number; y: number }[] = [];
  for (const r of RESIDENTS) {
    const [a, b] = r.hours;
    const here = a <= b ? m >= a && m < b : m >= a || m < b;
    if (!here) continue;
    const area = CITY_AREAS.find((x) => x.id === r.district);
    if (area && !areaUnlocked(w, area)) continue;
    const s = residentSpot(r);
    if (s) out.push({ def: r, x: s.x, y: s.y });
  }
  return out;
}

/** Habitant à portée de dialogue. */
export function residentNear(w: WorldState, dist = 2): ResidentDef | undefined {
  const { x, y } = w.player.pos;
  return residentsPresent(w).find((r) => Math.abs(r.x - x) <= dist && Math.abs(r.y - y) <= dist)?.def;
}

/** Une conversation : salut, une réplique du jour, et une rumeur par jour. */
export function talkToResident(w: WorldState, id: string): { greeting: string; line: string; rumor?: string; clue?: boolean } {
  const r = RESIDENTS.find((x) => x.id === id);
  if (!r) return { greeting: '', line: '' };
  const day = dayIndexOf(w.time.tick);
  const line = r.lines[(day + hashOf(r.id)) % r.lines.length] ?? '';
  const key = `habitant:${r.id}`;
  if ((w.flags[key] ?? 0) === day + 1 || !r.rumors.length) return { greeting: r.greeting, line };
  w.flags[key] = day + 1;
  const rumor = r.rumors[(day + hashOf(`${r.id}:rumeur`)) % r.rumors.length]!;
  let clue = false;
  if (rumor.secretId && !w.flags[`indice:${rumor.secretId}`]) {
    w.flags[`indice:${rumor.secretId}`] = 1;
    clue = true;
  }
  w.flags['rumeursEntendues'] = (w.flags['rumeursEntendues'] ?? 0) + 1;
  return { greeting: r.greeting, line, rumor: rumor.text, clue };
}
