import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';

describe('Bolt Performance Benchmarking - Simulation Ticks & Allocations', () => {
  it('executes 5,000 continuous simulation ticks within performance budget', () => {
    const world = createWorld({ seed: 20261002, playerName: 'BoltBench' });

    const startTime = performance.now();
    const notifications = runTicks(world, 5000);
    const endTime = performance.now();

    const durationMs = endTime - startTime;

    expect(world.time.tick).toBe(43 + 5000);
    expect(notifications).toBeDefined();
    // Budget check: 5000 ticks should execute under 1500ms
    expect(durationMs).toBeLessThan(1500);

    console.log(`[Bolt Benchmark] 5,000 Ticks Execution Time: ${durationMs.toFixed(2)}ms`);
  });
});
