/**
 * PNJ niveau A : routine horaire → lieu + activité. Les PNJ vivent leur vie
 * même sans observation (Principe 1). Niveau C (agrégats) géré par district.
 */
import type { GameEvent, NpcDef, NpcId, NpcState, RoutineSlot, WorldState } from '../core/types';
import { isSchoolDay, minutesOfDay, dayIndexOf, dateOf } from '../core/clock';
import { NPCS } from '../data/npcs';
import { NPC_EVENT_REACTIONS } from '../data/npc-events';
import { CITY, PLACE_ANCHORS, isWalkable } from '../data/map';

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

function slotFor(def: NpcDef, minutes: number, schoolDay: boolean): RoutineSlot | undefined {
  return def.routine.find(
    (s) => toMin(s.from) <= minutes && minutes < toMin(s.to) && (schoolDay || s.weekends === true),
  );
}

export function npcTick(w: WorldState): void {
  const day = dayIndexOf(w.time.tick);
  const minutes = minutesOfDay(w.time.tick);
  const school = isSchoolDay(day);
  const weekend = dateOf(day).weekday === 0 || dateOf(day).weekday === 6;

  for (const def of NPCS) {
    const st: NpcState | undefined = w.npcs[def.id];
    if (!st) continue;
    const slot = slotFor(def, minutes, school);
    if (slot) {
      st.place = slot.place;
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

/** Réaction liée au dernier fait mémorisé par ce PNJ, si le sujet correspond. */
export function rememberedNpcLine(w: WorldState, npcId: NpcId, topic: string): string | null {
  const npc = w.npcs[npcId];
  if (!npc) return null;
  for (const eventId of [...npc.memory].reverse()) {
    const event: GameEvent | undefined = w.events.find((candidate) => candidate.id === eventId);
    if (!event) continue;
    const reaction = NPC_EVENT_REACTIONS.find((candidate) =>
      candidate.npcId === npcId && candidate.topic === topic && event.title.startsWith(candidate.eventTitlePrefix));
    if (reaction) return reaction.line;
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
