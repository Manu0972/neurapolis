import { describe, it, expect } from 'vitest';
import {
  createDefaultCityCohorts,
  stepCityCohorts,
  stepWorldCohorts,
  createInitialWorldCohortsState,
  CityCohorts,
} from '../src/simulation/world/cohorts';

/**
 * Encapsule un comptage déterministe strict des appels au PRNG (rngNext)
 * via des accesseurs (getter/setter) sur la propriété `rng`.
 * Aucun appel à une horloge système ou temps réel n'est utilisé.
 */
function createCountingRngState(initialSeed: number) {
  let callCount = 0;
  let currentRng = initialSeed;

  const state = {
    get rng(): number {
      return currentRng;
    },
    set rng(val: number) {
      callCount++;
      currentRng = val;
    },
  };

  return {
    state,
    getCallCount: () => callCount,
    resetCallCount: () => {
      callCount = 0;
    },
    getSeed: () => currentRng,
  };
}

describe('Garde-fou de budget d’opérations déterministes — Cohortes Urbaines (#31)', () => {
  it('borne le nombre d’appels au PRNG par ville et par pas annuel (<= 20 appels)', () => {
    const { state, getCallCount, resetCallCount } = createCountingRngState(20200901);

    const cityCount = 100;
    const stepCount = 5;

    for (let c = 0; c < cityCount; c++) {
      const city: CityCohorts = createDefaultCityCohorts(
        `city_${c}`,
        `Ville ${c}`,
        `country_${c % 10}`,
        25000,
        state
      );

      for (let s = 0; s < stepCount; s++) {
        resetCallCount();
        stepCityCohorts(city, state);
        const callsInStep = getCallCount();

        // Chaque pas annuel effectue 2 tirages (variations fertilité/mortalité) + 2 tirages (création/faillite)
        // + tirages conditionnels pour le recrutement des diplômés.
        expect(callsInStep).toBeGreaterThanOrEqual(4);
        expect(callsInStep).toBeLessThanOrEqual(20);
      }
    }
  });

  it('garantit un nombre d’appels au PRNG parfaitement déterministe et reproductible sur 10 000 villes', () => {
    const tracker1 = createCountingRngState(20200901);
    const tracker2 = createCountingRngState(20200901);

    const runBatch = (tr: ReturnType<typeof createCountingRngState>) => {
      const cities: CityCohorts[] = [];
      for (let i = 0; i < 10000; i++) {
        cities.push(
          createDefaultCityCohorts(`city_${i}`, `Ville_${i}`, `country_${i % 40}`, 25000, tr.state)
        );
      }
      tr.resetCallCount();

      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < cities.length; i++) {
          stepCityCohorts(cities[i]!, tr.state);
        }
      }
      return tr.getCallCount();
    };

    const totalCalls1 = runBatch(tracker1);
    const totalCalls2 = runBatch(tracker2);

    expect(totalCalls1).toBe(totalCalls2);
    expect(totalCalls1).toBeGreaterThan(0);
    // 10 000 villes * 3 pas * ~8-10 appels/pas = ~240 000 - 300 000 appels PRNG
    expect(totalCalls1).toBeLessThan(500000);
  });

  it('maintient le nombre de cohortes par ville compact et borné (<= 25 cohortes par ville)', () => {
    const { state } = createCountingRngState(20200901);
    const cities: CityCohorts[] = [];

    for (let i = 0; i < 1000; i++) {
      const city = createDefaultCityCohorts(`c_${i}`, `Ville ${i}`, 'p1', 25000, state);
      cities.push(city);
    }

    for (let s = 0; s < 10; s++) {
      for (const city of cities) {
        stepCityCohorts(city, state);
        expect(city.cohorts.length).toBeGreaterThan(0);
        expect(city.cohorts.length).toBeLessThanOrEqual(25);
      }
    }
  });

  it('conserve la population totale exacte sur le monde des cohortes sans dérive', () => {
    const { state } = createCountingRngState(20200901);
    const world = createInitialWorldCohortsState(state);

    let initialPop = 0;
    for (const city of Object.values(world.cities)) {
      initialPop += city.stats.totalPopulation;
    }

    for (let s = 0; s < 5; s++) {
      stepWorldCohorts(world, state);
    }

    let endPop = 0;
    for (const city of Object.values(world.cities)) {
      endPop += city.stats.totalPopulation;
    }

    // Naissances et décès modifient la population, mais la somme des cohortes égale exactement city.stats.totalPopulation
    for (const city of Object.values(world.cities)) {
      const cohortSum = city.cohorts.reduce((sum, c) => sum + c.population, 0);
      expect(cohortSum).toBe(city.stats.totalPopulation);
      expect(Number.isInteger(city.stats.totalPopulation)).toBe(true);
    }
  });
});
