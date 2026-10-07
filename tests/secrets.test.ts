/**
 * Secrets du monde : indice qui arrive après la première semaine, fouille au bon endroit et au
 * bon moment, récompense, et rien d'autre ailleurs.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { TICKS_PER_DAY } from '../src/core/types';
import { minutesOfDay } from '../src/core/clock';
import { PLACE_ANCHORS, isWalkable, streetNameAt } from '../src/data/map';
import { CITY } from '../src/data/map';
import { runTicks } from '../src/simulation/engine';
import { CLUE_GRACE_DAYS, clueKnown, searchSecret, secretFound, secretHere } from '../src/simulation/secrets';
import { SECRETS } from '../src/data/secrets_registry';
import { CONCEPT_BY_ID } from '../src/data/ascension/concepts';
import { ensureAscension } from '../src/simulation/ascension';

function until(w: WorldState, minutes: number): void {
  let guard = 0;
  while (minutesOfDay(w.time.tick) !== minutes && guard++ < TICKS_PER_DAY) runTicks(w, 1);
}

describe('données des secrets', () => {
  it('lieux, rues et récompenses valides', () => {
    const streets = new Set(CITY.roads.map((r) => r.name));
    for (const s of SECRETS) {
      if (s.where.place) expect(PLACE_ANCHORS[s.where.place]).toBeDefined();
      if (s.where.street) expect(streets.has(s.where.street)).toBe(true);
      if (s.reward.kind === 'concept') expect(CONCEPT_BY_ID[s.reward.value as string]).toBeDefined();
    }
  });
});

describe('secrets', () => {
  it('pas d’indice la première semaine ; puis un indice arrive le soir', () => {
    const w = createWorld();
    runTicks(w, (CLUE_GRACE_DAYS - 1) * TICKS_PER_DAY);
    expect(SECRETS.some((s) => clueKnown(w, s.id))).toBe(false);
    const out = runTicks(w, 2 * TICKS_PER_DAY);
    expect(clueKnown(w, 'cave_malterie')).toBe(true);
    expect(out.some((n) => n.text.startsWith('📜'))).toBe(true);
  });

  it('la cave de la Malterie se fouille le soir, sur le quai, et apprend le coût du stock', () => {
    const w = createWorld();
    w.flags['indice:cave_malterie'] = 1;
    // Une tuile franchissable du quai.
    let spot: { x: number; y: number } | undefined;
    for (let y = 0; y < 268 && !spot; y++) for (let x = 0; x < 414 && !spot; x++) if (isWalkable(x, y) && streetNameAt(x, y) === 'Quai de la Malterie') spot = { x, y };
    w.player.pos = { ...spot! };
    until(w, 10 * 60);
    expect(secretHere(w)).toBeUndefined(); // trop tôt
    until(w, 20 * 60);
    expect(secretHere(w)?.id).toBe('cave_malterie');
    expect(searchSecret(w, 'cave_malterie').ok).toBe(true);
    expect(secretFound(w, 'cave_malterie')).toBe(true);
    expect(ensureAscension(w).concepts['cout_stock']).toBeDefined();
    expect(secretHere(w)).toBeUndefined();
    expect(searchSecret(w, 'cave_malterie').ok).toBe(false);
  });

  it('sans l’indice, rien à fouiller', () => {
    const w = createWorld();
    const a = PLACE_ANCHORS.friche;
    w.player.pos = { ...a };
    until(w, 20 * 60);
    expect(secretHere(w)).toBeUndefined();
  });
});
