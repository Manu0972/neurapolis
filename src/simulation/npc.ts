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

/** Ajoute un souvenir unique et borné (cap 10) à un PNJ. */
export function addNpcMemory(st: NpcState, memoryId: string): boolean {
  if (st.memory.includes(memoryId)) return false;
  st.memory.push(memoryId);
  if (st.memory.length > 10) {
    st.memory.shift();
  }
  return true;
}

function updateNpcMemoriesAndEmotions(w: WorldState): void {
  // Mme Bertin
  const bertin = w.npcs['bertin'];
  if (bertin) {
    if (w.district.vitaliteEpicerie < 35) {
      if (addNpcMemory(bertin, 'mem_epicerie_difficulte')) {
        bertin.moral = Math.max(0, bertin.moral - 15);
        bertin.stress = Math.min(100, bertin.stress + 20);
        bertin.opinion = Math.max(-100, bertin.opinion - 10);
      }
    } else if (w.district.vitaliteEpicerie > 60) {
      if (addNpcMemory(bertin, 'mem_epicerie_embauche')) {
        bertin.moral = Math.min(100, bertin.moral + 20);
        bertin.stress = Math.max(0, bertin.stress - 15);
        bertin.opinion = Math.min(100, bertin.opinion + 15);
      }
    }

    if (w.project && w.project.coursesDone > 0) {
      if (addNpcMemory(bertin, 'mem_soutien_courses')) {
        bertin.moral = Math.min(100, bertin.moral + 15);
        bertin.stress = Math.max(0, bertin.stress - 10);
        bertin.opinion = Math.min(100, bertin.opinion + 20);
      }
    }

    // Activité visible contextualisée
    if (bertin.place === 'epicerie' && bertin.activity !== 'dort') {
      if (bertin.memory.includes('mem_epicerie_difficulte') && w.district.vitaliteEpicerie < 35) {
        bertin.activity = 'inquiète pour la boutique (crise)';
      } else if (bertin.memory.includes('mem_epicerie_embauche') && w.district.vitaliteEpicerie > 60) {
        bertin.activity = 'prépare une embauche à l’épicerie';
      } else if (bertin.memory.includes('mem_soutien_courses')) {
        bertin.activity = 'maintient les rayons avec élan';
      }
    }
  }

  // Noah
  const noah = w.npcs['noah'];
  if (noah) {
    if (w.project && w.project.active && w.project.sessionsDone >= 1 && w.project.rules.collectif) {
      if (addNpcMemory(noah, 'mem_stand_reussite_collective')) {
        noah.moral = Math.min(100, noah.moral + 20);
        noah.stress = Math.max(0, noah.stress - 10);
        noah.opinion = Math.min(100, noah.opinion + 25);
      }
    }

    if (w.district.confianceQuartier >= 60 || w.player.reputation >= 60) {
      if (addNpcMemory(noah, 'mem_soutien_quartier')) {
        noah.moral = Math.min(100, noah.moral + 10);
        noah.opinion = Math.min(100, noah.opinion + 15);
      }
    }

    if (noah.place !== 'college' && noah.activity !== 'dort') {
      if (noah.memory.includes('mem_stand_reussite_collective')) {
        noah.activity = 'dessine des affiches pour le stand';
      }
    }
  }

  // Samir
  const samir = w.npcs['samir'];
  if (samir) {
    if (w.project && w.project.active && w.project.sessionsDone >= 1 && w.project.rules.collectif) {
      if (addNpcMemory(samir, 'mem_stand_reussite_collective')) {
        samir.moral = Math.min(100, samir.moral + 25);
        samir.stress = Math.max(0, samir.stress - 15);
        samir.opinion = Math.min(100, samir.opinion + 25);
      }
    }

    if (w.district.confianceQuartier >= 60) {
      if (addNpcMemory(samir, 'mem_soutien_quartier')) {
        samir.moral = Math.min(100, samir.moral + 15);
        samir.opinion = Math.min(100, samir.opinion + 20);
      }
    }

    if (w.district.vitaliteEpicerie < 35) {
      if (addNpcMemory(samir, 'mem_epicerie_difficulte')) {
        samir.stress = Math.min(100, samir.stress + 10);
      }
    }

    if (samir.place !== 'maison' && samir.activity !== 'dort') {
      if (samir.memory.includes('mem_stand_reussite_collective')) {
        samir.activity = 'vante la réussite collective du stand';
      } else if (samir.memory.includes('mem_soutien_quartier')) {
        samir.activity = 'organise un atelier citoyen';
      }
    }
  }
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

  updateNpcMemoriesAndEmotions(w);
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
