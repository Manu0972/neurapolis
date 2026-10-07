/**
 * Vie au collège : un événement peut survenir à la sortie d'un cours suivi ; chacun une seule
 * fois ; les choix changent amitiés, moyenne, stress, fierté des parents.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { TICKS_PER_DAY } from '../src/core/types';
import { minutesOfDay } from '../src/core/clock';
import { runTicks } from '../src/simulation/engine';
import { attendClass } from '../src/simulation/family';
import { SCHOOL_EVENTS, pendingSchoolEvent, resolveSchoolEvent } from '../src/simulation/school_events';
import { GHOST_DEFS_BY_ID } from '../src/data/ghosts/registry';
import { DUELS } from '../src/data/ascension/duels';

const DUEL_THINKERS = new Set(DUELS.flatMap((d) => [d.a.thinker, d.b.thinker]));

function until(w: WorldState, minutes: number): void {
  let guard = 0;
  while (minutesOfDay(w.time.tick) !== minutes && guard++ < TICKS_PER_DAY) runTicks(w, 1);
}

describe('vie au collège', () => {
  it('données : 2 ou 3 options, conseillers connus', () => {
    for (const e of SCHOOL_EVENTS) {
      expect([2, 3]).toContain(e.options.length);
      for (const o of e.options) expect(!!GHOST_DEFS_BY_ID[o.ghost] || DUEL_THINKERS.has(o.ghost)).toBe(true);
    }
  });

  it('en suivant les cours, des événements arrivent ; chacun ne se joue qu’une fois', () => {
    const w = createWorld();
    const seen = new Set<string>();
    for (let d = 0; d < 20; d++) {
      until(w, 8 * 60 + 20);
      attendClass(w);
      until(w, 12 * 60 + 20);
      const e = pendingSchoolEvent(w);
      if (e) {
        expect(seen.has(e.id)).toBe(false);
        seen.add(e.id);
        const lina = w.player.relations['lina']!.amitie;
        expect(resolveSchoolEvent(w, 0).ok).toBe(true);
        expect(pendingSchoolEvent(w)).toBeUndefined();
        if (e.id === 'delegue') expect(w.player.relations['lina']!.amitie).toBeLessThan(lina);
      }
      runTicks(w, 6);
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  it('sans aller en cours, pas d’événement de collège', () => {
    const w = createWorld();
    runTicks(w, 5 * TICKS_PER_DAY);
    expect(pendingSchoolEvent(w)).toBeUndefined();
  });
});
