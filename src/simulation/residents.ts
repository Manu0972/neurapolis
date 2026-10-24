/**
 * Habitants nommés des nouveaux quartiers (AG-3, src/data/residents/residents.ts) : chacun a sa
 * place sur le trottoir de sa rue, ses heures, ses répliques et ses rumeurs. Une rumeur par jour
 * et par habitant ; celle qui pointe vers un secret en donne l'indice (drapeau `indice:<id>`).
 * Tout est déterministe : position et réplique viennent de l'identifiant et du jour.
 *
 * Vague 14 : au moins 12 répliques et 5 rumeurs chacun (src/data/residents/residents_contexte.ts),
 * selon le moment, la météo, la saison, le chapitre, la réputation, les fêtes de la place et les
 * faits récents. Une réplique ne revient pas avant que les autres possibles aient été dites
 * (drapeau `repliques:<id>` : répliques déjà dites + dernière dite).
 */
import type { WorldState } from '../core/types';
import { dateOf, dayIndexOf, minutesOfDay } from '../core/clock';
import { CITY_AREAS } from '../data/city/layout';
import { CITY, isWalkable, surfaceAt } from '../data/map';
import { seasonOfMonth, type SeasonKey } from '../data/district';
import { RESIDENTS, type ResidentDef } from '../data/residents/residents';
import {
  RESIDENT_CONTEXT, type MomentJournee, type QuandReplique, type RepliqueHabitant, type RumeurHabitant,
} from '../data/residents/residents_contexte';
import { areaUnlocked } from './areas';
import { feteDuJour } from './happenings_saison';
import { personalize } from './story';

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

/** Une vieille rumeur ne revient pas avant ce délai, une fois toutes racontées. */
export const RUMOR_REPEAT_DAYS = 120;
/** Un fait du journal reste « récent » pour les habitants pendant ce délai (comme pour les PNJ). */
export const RECENT_DAYS = 21;
/** Réputation à partir de laquelle on parle du joueur en bien, et en dessous de laquelle on l'ignore. */
export const REPUTATION_HAUTE = 65;
export const REPUTATION_BASSE = 30;
/** Répliques au plus par habitant (mémoire sur 24 bits). */
export const MAX_REPLIQUES = 24;
const MEMOIRE = 1 << MAX_REPLIQUES;

const LINES = new Map<string, readonly RepliqueHabitant[]>();
const RUMORS = new Map<string, readonly RumeurHabitant[]>();

/** Toutes les répliques d'un habitant : les cinq d'origine, puis celles de circonstance. */
export function residentLines(r: ResidentDef): readonly RepliqueHabitant[] {
  let l = LINES.get(r.id);
  if (!l) {
    l = [...r.lines.map((text) => ({ text })), ...(RESIDENT_CONTEXT[r.id]?.lines ?? [])];
    LINES.set(r.id, l);
  }
  return l;
}

/** Toutes les rumeurs d'un habitant (les deux d'origine gardent leur rang : mémoire des sauvegardes). */
export function residentRumors(r: ResidentDef): readonly RumeurHabitant[] {
  let l = RUMORS.get(r.id);
  if (!l) {
    l = [...r.rumors, ...(RESIDENT_CONTEXT[r.id]?.rumors ?? [])];
    RUMORS.set(r.id, l);
  }
  return l;
}

export function momentOf(minutes: number): MomentJournee {
  if (minutes < 5 * 60 || minutes >= 22 * 60) return 'nuit';
  if (minutes < 11 * 60) return 'matin';
  if (minutes < 14 * 60) return 'midi';
  if (minutes < 18 * 60) return 'apresmidi';
  return 'soir';
}

/** Ce qui entoure une conversation. */
export interface ContexteConversation {
  day: number;
  moment: MomentJournee;
  saison: SeasonKey;
  fete: string | null;
}

export function contexteDe(w: WorldState): ContexteConversation {
  const day = dayIndexOf(w.time.tick);
  return {
    day, moment: momentOf(minutesOfDay(w.time.tick)), saison: seasonOfMonth(dateOf(day).m), fete: feteDuJour(day)?.id ?? null,
  };
}

/** Les circonstances d'une réplique sont-elles réunies ? */
export function quandOk(w: WorldState, ctx: ContexteConversation, q?: QuandReplique): boolean {
  if (!q) return true;
  if (q.moment && !q.moment.includes(ctx.moment)) return false;
  if (q.meteo && !q.meteo.includes(w.district.meteo)) return false;
  if (q.saison && !q.saison.includes(ctx.saison)) return false;
  if (q.chapitre) {
    const ch = w.campaign?.currentChapter ?? 1;
    if (ch < q.chapitre[0] || ch > q.chapitre[1]) return false;
  }
  if (q.reputation === 'haute' && w.player.reputation < REPUTATION_HAUTE) return false;
  if (q.reputation === 'basse' && w.player.reputation > REPUTATION_BASSE) return false;
  if (q.fete && ctx.fete !== q.fete) return false;
  if (q.recent) {
    const prefix = q.recent;
    if (!w.events.some((e) => ctx.day - e.day <= RECENT_DAYS && e.title.startsWith(prefix))) return false;
  }
  return true;
}

const bitCount = (n: number): number => {
  let c = 0;
  for (let v = n; v; v &= v - 1) c++;
  return c;
};

/**
 * Réplique de la conversation : une de circonstance si possible, sinon une réplique de fond, et
 * jamais une déjà dite tant qu'il en reste d'autres possibles (puis on repart, sans redire la dernière).
 */
function pickLine(w: WorldState, r: ResidentDef, ctx: ContexteConversation): string {
  const lines = residentLines(r);
  const key = `repliques:${r.id}`;
  const v = w.flags[key] ?? 0;
  let said = v % MEMOIRE;
  const last = Math.floor(v / MEMOIRE) - 1;
  const eligible = lines.map((_, i) => i).filter((i) => i < MAX_REPLIQUES && quandOk(w, ctx, lines[i]!.quand));
  if (eligible.length === 0) return '';
  let fresh = eligible.filter((i) => (said & (1 << i)) === 0);
  if (fresh.length === 0) {
    said = 0;
    fresh = eligible.length > 1 ? eligible.filter((i) => i !== last) : eligible;
  }
  const circonstance = fresh.filter((i) => lines[i]!.quand);
  const pool = circonstance.length > 0 ? circonstance : fresh;
  const index = pool[(ctx.day + hashOf(r.id) + bitCount(said)) % pool.length]!;
  said |= 1 << index;
  w.flags[key] = said + (index + 1) * MEMOIRE;
  return personalize(w, lines[index]!.text);
}

/** Une conversation : salut, une réplique, et au plus une rumeur par jour. */
export function talkToResident(w: WorldState, id: string): { greeting: string; line: string; rumor?: string; clue?: boolean } {
  const r = RESIDENTS.find((x) => x.id === id);
  if (!r) return { greeting: '', line: '' };
  const ctx = contexteDe(w);
  const day = ctx.day;
  const greeting = personalize(w, r.greeting);
  const line = pickLine(w, r, ctx);
  const rumors = residentRumors(r);
  const key = `habitant:${r.id}`;
  const last = (w.flags[key] ?? 0) - 1;
  const eligible = rumors.map((_, i) => i).filter((i) => quandOk(w, ctx, rumors[i]!.quand));
  if (last === day || eligible.length === 0) return { greeting, line };
  // Chaque rumeur se raconte d'abord une fois ; quand tout est dit, l'habitant ne ressort une
  // vieille histoire qu’au bout de quatre mois (sinon, les mêmes rumeurs un jour sur deux).
  const toldKey = `rumeursDites:${r.id}`;
  const told = w.flags[toldKey] ?? 0;
  const fresh = eligible.filter((i) => (told & (1 << i)) === 0);
  if (fresh.length === 0 && last >= 0 && day - last < RUMOR_REPEAT_DAYS) return { greeting, line };
  const pool = fresh.length > 0 ? fresh : eligible;
  const index = pool[(day + hashOf(`${r.id}:rumeur`)) % pool.length]!;
  w.flags[key] = day + 1;
  w.flags[toldKey] = told | (1 << index);
  const rumor = rumors[index]!;
  let clue = false;
  if (rumor.secretId && !w.flags[`indice:${rumor.secretId}`]) {
    w.flags[`indice:${rumor.secretId}`] = 1;
    clue = true;
  }
  w.flags['rumeursEntendues'] = (w.flags['rumeursEntendues'] ?? 0) + 1;
  return { greeting, line, rumor: personalize(w, rumor.text), clue };
}
