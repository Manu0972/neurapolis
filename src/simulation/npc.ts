/**
 * PNJ niveau A : routine horaire → lieu + activité. Les PNJ vivent leur vie
 * même sans observation (Principe 1). Niveau C (agrégats) géré par district.
 */
import type { NpcDef, NpcState, RoutineSlot, WorldState } from '../core/types';
import { isSchoolDay, minutesOfDay, dayIndexOf, dateOf } from '../core/clock';
import { NPCS } from '../data/npcs';
import { PLACE_ANCHORS, isWalkable } from '../data/map';

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
 */
export function npcPosition(w: WorldState, id: string): { x: number; y: number } {
  const st = w.npcs[id];
  const anchor = st ? PLACE_ANCHORS[st.place] : PLACE_ANCHORS['place'];
  const [ox, oy] = NPC_OFFSETS[npcHash(id) % NPC_OFFSETS.length] ?? [0, 0];
  const pos = { x: anchor.x + ox, y: anchor.y + oy };
  return isWalkable(pos.x, pos.y) ? pos : anchor;
}
