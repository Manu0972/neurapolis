import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/core/store';
import { tickWorld } from '../src/simulation/engine';

describe('Infinite Engine Loop & Stability Benchmark', () => {
  it('runs 10,000 continuous simulation ticks without crashing or degrading state', () => {
    const world = createWorld({ seed: 20261001 });
    const initialTick = world.time.tick;
    const TOTAL_TICKS = 10000;

    for (let i = 0; i < TOTAL_TICKS; i++) {
      tickWorld(world);
    }

    expect(world.time.tick).toBe(initialTick + TOTAL_TICKS);
    expect(world.player.needs.fatigue).toBeGreaterThanOrEqual(0);
    expect(world.player.needs.fatigue).toBeLessThanOrEqual(100);
    expect(world.rng).toBeDefined();
    expect(world.lifeJournal.length).toBeGreaterThan(0);
  });
});
