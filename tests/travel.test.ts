/**
 * Voyages depuis la gare : vacances obligatoires avant 18 ans, coût, durée, retour avec
 * savoir-faire, notion découverte et entrée au journal.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { DESTINATION_BY_ID, canTravel, isTraveling, startTravel } from '../src/simulation/travel';

describe('voyages', () => {
  it('un collégien ne part pas un jour de classe', () => {
    const w = createWorld();
    w.player.money = 200;
    const c = canTravel(w, 'plateaublanc');
    expect(c.ok).toBe(false);
    expect(c.message).toMatch(/vacances/);
  });

  it('un adulte part, le temps passe, et il revient grandi', () => {
    const w = createWorld();
    w.player.age = 19;
    w.player.money = 200;
    const d = DESTINATION_BY_ID['plateaublanc']!;
    const xp0 = w.player.skills[d.skill]!.xp;
    expect(startTravel(w, 'plateaublanc').ok).toBe(true);
    expect(w.player.money).toBe(200 - d.cost);
    expect(isTraveling(w)).toBe(true);
    runTicks(w, d.days * TICKS_PER_DAY + 1);
    expect(isTraveling(w)).toBe(false);
    expect(w.flags['voyagesFaits']).toBe(1);
    expect(w.player.notions[d.notion!]).toBeDefined();
    expect(w.player.skills[d.skill]!.xp + w.player.skills[d.skill]!.level).toBeGreaterThan(xp0);
    expect(w.events.some((e) => e.title === `Retour de ${d.name}`)).toBe(true);
  });

  it('refuse sans argent', () => {
    const w = createWorld();
    w.player.age = 20;
    w.player.money = 5;
    expect(startTravel(w, 'ilesaphir').ok).toBe(false);
  });
});
