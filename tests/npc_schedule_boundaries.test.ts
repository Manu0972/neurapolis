/**
 * Tests d'intégration des PNJ aux bascules de calendrier (moteur réel + 3 graines).
 * Vérifie qu'aucun enfant n'est à l'école la nuit, le week-end, pendant les vacances ou le mercredi après-midi,
 * et qu'aucun PNJ n'est placé dans un lieu inexistant.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay, phaseOfDay } from '../src/core/clock';
import { NPCS } from '../src/data/npcs';
import { PLACE_ANCHORS, isWalkable } from '../src/data/map';
import { npcPosition } from '../src/simulation/npc';

const SEEDS = [1, 42, 123];

const dayOfIso = (iso: string): number =>
  Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse('2020-09-01T00:00:00Z')) / 86_400_000);

describe('npc_schedule_boundaries — bascules temporelles et cohérence des PNJ', () => {
  const BOUNDARIES = [
    {
      name: 'bascule de minuit (jour ordinaire)',
      startTick: 143, // Mardi 23:50 -> Mercredi 00:10 (2 ticks)
    },
    {
      name: 'changement de semaine (dimanche minuit -> lundi)',
      startTick: 5 * 144 + 143, // Dimanche 23:50 -> Lundi 00:10
    },
    {
      name: 'mercredi après-midi (fin des cours 13:30)',
      startTick: 1 * 144 + 80, // Mercredi 13:20 -> Mercredi 13:40
    },
    {
      name: 'premier jour des vacances de Toussaint (16 oct 23:50 -> 17 oct 00:10)',
      startTick: dayOfIso('2020-10-16') * 144 + 143,
    },
    {
      name: 'dernier jour des vacances de Toussaint (2 nov 23:50 -> 3 nov 00:10)',
      startTick: dayOfIso('2020-11-02') * 144 + 143,
    },
    {
      name: 'premier jour des vacances de Noël (18 déc 23:50 -> 19 déc 00:10)',
      startTick: dayOfIso('2020-12-18') * 144 + 143,
    },
    {
      name: 'dernier jour des vacances de Noël (4 janv 23:50 -> 5 janv 00:10)',
      startTick: dayOfIso('2021-01-04') * 144 + 143,
    },
    {
      name: 'passage d’année (31 déc 2020 23:50 -> 1er janv 2021 00:10)',
      startTick: dayOfIso('2020-12-31') * 144 + 143,
    },
  ];

  for (const seed of SEEDS) {
    describe(`avec le seed ${seed}`, () => {
      for (const boundary of BOUNDARIES) {
        it(`vérifie les PNJ lors de : ${boundary.name}`, () => {
          const w = createWorld({ seed });
          w.time.tick = boundary.startTick;

          // Avance de 2 ticks
          runTicks(w, 2);

          const currentDay = dayIndexOf(w.time.tick);
          const currentMinutes = minutesOfDay(w.time.tick);
          const currentDate = dateOf(currentDay);
          const schoolDay = isSchoolDay(currentDay);
          const isWedAfternoon = currentDate.weekday === 3 && currentMinutes >= 13 * 60 + 30;
          const currentPhase = phaseOfDay(currentMinutes, schoolDay, currentDate.weekday === 3);

          for (const npcDef of NPCS) {
            const st = w.npcs[npcDef.id];
            expect(st).toBeDefined();

            // 1. Tous les PNJ sont dans un lieu existant dans PLACE_ANCHORS
            expect(st!.place in PLACE_ANCHORS).toBe(true);

            // Position physique franchissable
            const pos = npcPosition(w, npcDef.id);
            expect(isWalkable(pos.x, pos.y)).toBe(true);

            // 2. Aucun enfant (age < 18) n’est à l’école un jour non scolaire, la nuit, ou le mercredi après-midi
            if (npcDef.age < 18) {
              const atSchool = st!.place === 'college';
              if (!schoolDay || currentPhase === 'nuit' || isWedAfternoon) {
                expect(atSchool).toBe(false);
              }
            }
          }
        });
      }
    });
  }
});
