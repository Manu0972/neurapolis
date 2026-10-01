import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/core/store';
import { calculateMoodProbability, evaluateDynamicMood, getSpecialProbabilisticResponse } from '../src/simulation/mood';

describe('Mood Superposition & Probabilistic Model', () => {
  it('calculates probability based on temperament and environmental modifiers', () => {
    const w = createWorld({ seed: 12345 });
    w.district.meteo = 'pluie';
    w.rivals.drive_hyper.marketShare = 60;

    const prob = calculateMoodProbability('audacieux', 'serein', w);
    expect(prob.temperament).toBe('audacieux');
    expect(prob.weatherModifier).toBeGreaterThan(0);
    expect(prob.rivalryModifier).toBeGreaterThan(0);
    expect(prob.combinedProbability).toBeGreaterThan(prob.baseProbability);
  });

  it('evaluates dynamic mood deterministically', () => {
    const w1 = createWorld({ seed: 9999 });
    const mood1 = evaluateDynamicMood(w1, 'smith', true);

    const w2 = createWorld({ seed: 9999 });
    const mood2 = evaluateDynamicMood(w2, 'smith', true);

    expect(mood1).toBe(mood2);
  });

  it('generates probabilistic special responses', () => {
    const w = createWorld({ seed: 42 });
    const res = getSpecialProbabilisticResponse(w, 'marx', true);
    expect(res.mood).toBeDefined();
    if (res.special) {
      expect(res.text).toContain('MARX');
    }
  });
});
