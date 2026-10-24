/**
 * PNJ niveau A : routine horaire → lieu + activité. Les PNJ vivent leur vie
 * même sans observation (Principe 1). Niveau C (agrégats) géré par district.
 */
import type { GameEvent, NpcDef, NpcId, NpcState, RoutineSlot, WorldState } from '../core/types';
import { isSchoolDay, minutesOfDay, dayIndexOf, dateOf } from '../core/clock';
import { NPCS } from '../data/npcs';
import { NPC_EVENT_REACTIONS } from '../data/npc-events';
import { CITY, PLACE_ANCHORS, isWalkable } from '../data/map';
import { estLyceen } from './school_life';
import { LYCEE_MERCREDI_FIN, ROUTINES_LYCEE } from '../data/school/routines_lycee';

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

import { isVacances } from '../core/clock';

function slotFor(def: NpcDef, minutes: number, schoolDay: boolean, weekday: number, vacances: boolean): RoutineSlot | undefined {
  const isWednesdayPm = schoolDay && weekday === 3 && minutes >= 13 * 60 + 30;
  return def.routine.find((s) => {
    if (s.place === 'college' && (vacances || !schoolDay || isWednesdayPm)) return false;
    return toMin(s.from) <= minutes && minutes < toMin(s.to) && (schoolDay || s.weekends === true);
  });
}

/**
 * Créneau d'un camarade quand le joueur est lycéen (src/data/school/routines_lycee.ts) :
 * cours de 8 h à 12 h et de 14 h à 17 h, mercredi matin seulement. `null` : pas de routine lycée.
 */
export function slotLycee(id: NpcId, minutes: number, schoolDay: boolean, weekday: number): RoutineSlot | undefined | null {
  const r = ROUTINES_LYCEE[id];
  if (!r) return null;
  const within = (s: RoutineSlot): boolean => toMin(s.from) <= minutes && minutes < toMin(s.to);
  if (schoolDay && weekday === 3 && minutes >= LYCEE_MERCREDI_FIN) return r.mercredi.find(within);
  return r.semaine.find((s) => within(s) && (schoolDay || (s.weekends === true && s.place !== 'lycee')));
}

export function npcTick(w: WorldState): void {
  const day = dayIndexOf(w.time.tick);
  const minutes = minutesOfDay(w.time.tick);
  const school = isSchoolDay(day);
  const dateInfo = dateOf(day);
  const vacances = isVacances(day);
  const weekend = dateInfo.weekday === 0 || dateInfo.weekday === 6;
  const lyceen = estLyceen(w);

  for (const def of NPCS) {
    const st: NpcState | undefined = w.npcs[def.id];
    if (!st) continue;
    const lycee = lyceen ? slotLycee(def.id, minutes, school, dateInfo.weekday) : null;
    const slot = lycee === null ? slotFor(def, minutes, school, dateInfo.weekday, vacances) : lycee;
    if (slot) {
      // Le joueur est lycéen : la bande et les profs du collège ont suivi au lycée (même emploi du temps).
      st.place = slot.place === 'college' && lyceen ? 'lycee' : slot.place;
      st.activity = slot.activity;
    } else {
      // Hors créneaux (nuit, ou week-end sans créneau marqué) : à la maison
      st.place = 'maison';
      st.activity = minutes < 7 * 60 || minutes >= 21 * 60 ? 'dort' : weekend ? 'se repose' : 'rentre';
    }
  }
  rememberNeighborhoodEvents(w, day);
}

/** Chaque fait est mémorisé une seule fois par témoin, le jour où il survient. */
function rememberNeighborhoodEvents(w: WorldState, day: number): void {
  const todaysEvents = w.events.filter((event) => event.day === day).reverse();
  for (const event of todaysEvents) {
    for (const reaction of NPC_EVENT_REACTIONS) {
      if (!event.title.startsWith(reaction.eventTitlePrefix)) continue;
      const npc = w.npcs[reaction.npcId];
      if (!npc || npc.memory.includes(event.id)) continue;
      npc.memory.push(event.id);
      if (npc.memory.length > 50) npc.memory.splice(0, npc.memory.length - 50);
    }
  }
}

/** Un souvenir se raconte dans les trois semaines qui suivent le fait… */
export const RECALL_DAYS = 21;
/** … et la même réaction ne revient pas avant un mois (sinon : la même phrase pendant 4 ans). */
export const RECALL_GAP_DAYS = 30;

/**
 * Réaction liée au dernier fait mémorisé par ce PNJ, si le sujet correspond. La dire la
 * « consomme » (drapeau `souvenir:<pnj>:<réaction>` = jour + 1) : elle ne revient que pour un
 * fait plus récent, et pas avant un mois. Au-delà, le PNJ reprend ses répliques habituelles.
 */
export function rememberedNpcLine(w: WorldState, npcId: NpcId, topic: string): string | null {
  const npc = w.npcs[npcId];
  if (!npc) return null;
  const today = dayIndexOf(w.time.tick);
  for (const eventId of [...npc.memory].reverse()) {
    const event: GameEvent | undefined = w.events.find((candidate) => candidate.id === eventId);
    if (!event || today - event.day > RECALL_DAYS) continue;
    const idx = NPC_EVENT_REACTIONS.findIndex((candidate) =>
      candidate.npcId === npcId && candidate.topic === topic && event.title.startsWith(candidate.eventTitlePrefix));
    if (idx < 0) continue;
    const key = `souvenir:${npcId}:${idx}`;
    const last = (w.flags[key] ?? 0) - 1;
    if (last >= 0 && (last >= event.day || today - last < RECALL_GAP_DAYS)) continue;
    w.flags[key] = today + 1;
    return NPC_EVENT_REACTIONS[idx]!.line;
  }
  return null;
}

/** PNJ présents à un lieu donné (pour interactions sur la carte). */
export function npcsAt(w: WorldState, place: string): NpcState[] {
  return Object.values(w.npcs).filter((n) => n.place === place);
}

const NPC_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [2, 0], [-2, 0],
];

function npcHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Position tuile déterministe d'un PNJ : ancre de son lieu actuel + décalage
 * stable dérivé de son id (jamais aléatoire, identique rendu/simulation).
 * « maison » désigne le domicile propre de chaque habitant, pas celui du joueur.
 */
export function npcPosition(w: WorldState, id: string): { x: number; y: number } {
  const st = w.npcs[id];
  const home = CITY.npcHomes[id];
  const anchor = !st ? PLACE_ANCHORS['place'] : st.place === 'maison' && home ? home : PLACE_ANCHORS[st.place];
  const [ox, oy] = NPC_OFFSETS[npcHash(id) % NPC_OFFSETS.length] ?? [0, 0];
  const pos = { x: anchor.x + ox, y: anchor.y + oy };
  return isWalkable(pos.x, pos.y) ? pos : anchor;
}
