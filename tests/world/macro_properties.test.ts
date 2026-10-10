import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/core/store';
import { mulberry32, rngNext } from '../../src/core/rng';
import {
  ensureWorldMacroState,
  simulateWorldMacroAnnualStep,
} from '../../src/simulation/world/macro';
import type { WorldMacroState } from '../../src/core/world_macro_types';

function computeWorldPopulation(macro: WorldMacroState): number {
  let total = 0;
  const countries = macro.countries;
  for (const k in countries) {
    total += countries[k]!.population;
  }
  return total;
}

function computeTotalExportsAndImports(macro: WorldMacroState): { exportsCents: number; importsCents: number } {
  let exportsCents = 0;
  let importsCents = 0;
  const matrix = macro.tradeMatrix;

  for (const originId in matrix) {
    const row = matrix[originId];
    if (!row) continue;
    for (const destId in row) {
      const amount = row[destId] || 0;
      exportsCents += amount;
      importsCents += amount;
    }
  }

  return { exportsCents, importsCents };
}

function assertNoNegativeOrNaNOrInfinite(macro: WorldMacroState): void {
  for (const cId in macro.countries) {
    const c = macro.countries[cId]!;
    if (!Number.isFinite(c.population) || c.population < 0) {
      throw new Error(`Population invalide pour ${c.id}: ${c.population}`);
    }
    if (!Number.isFinite(c.gdpPerCapita) || c.gdpPerCapita < 0) {
      throw new Error(`PIB par hab. invalide pour ${c.id}: ${c.gdpPerCapita}`);
    }
    if (!Number.isFinite(c.birthRate) || !Number.isFinite(c.deathRate) || !Number.isFinite(c.attractiveness)) {
      throw new Error(`Taux démographiques invalides pour ${c.id}`);
    }
    const sectorsRecord = c.sectors as unknown as Record<string, number>;
    for (const sKey in sectorsRecord) {
      const val = sectorsRecord[sKey]!;
      if (!Number.isFinite(val) || val < 0) {
        throw new Error(`Secteur invalide pour ${c.id}: ${val}`);
      }
    }
  }

  for (const originId in macro.tradeMatrix) {
    const row = macro.tradeMatrix[originId]!;
    for (const destId in row) {
      const flow = row[destId]!;
      if (!Number.isInteger(flow) || flow < 0) {
        throw new Error(`Flux commercial invalide ${originId}->${destId}: ${flow}`);
      }
    }
  }

  for (let i = 0; i < macro.lastMigrationFlows.length; i++) {
    const flow = macro.lastMigrationFlows[i]!;
    if (!Number.isInteger(flow.count) || flow.count < 0) {
      throw new Error(`Flux migratoire invalide ${flow.originId}->${flow.destinationId}: ${flow.count}`);
    }
  }
}

describe('Moteur Macro Météorologique & Commercial — Tests de propriété sur 200 graines', () => {
  it('respecte tous les invariants sur 200 graines et 50 pas annuels', () => {
    const masterRng = mulberry32(20261010);
    const seeds: number[] = [];
    for (let i = 0; i < 200; i++) {
      seeds.push(Math.floor(rngNext(masterRng) * 1_000_000_000));
    }

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]!;
      const world = createWorld({ seed });
      const macro = ensureWorldMacroState(world);

      for (let step = 0; step < 50; step++) {
        const popBefore = computeWorldPopulation(macro);
        const { totalBirths, totalDeaths } = simulateWorldMacroAnnualStep(world);
        const popAfter = computeWorldPopulation(macro);

        if (popAfter !== popBefore + totalBirths - totalDeaths) {
          throw new Error(`Invariance démographique violée à la graine ${seed}, pas ${step}`);
        }

        const { exportsCents, importsCents } = computeTotalExportsAndImports(macro);
        if (exportsCents !== importsCents) {
          throw new Error(`Balance commerciale déséquilibrée à la graine ${seed}, pas ${step}`);
        }

        assertNoNegativeOrNaNOrInfinite(macro);
      }

      if (i % 20 === 0) {
        const worldA = createWorld({ seed });
        const worldB = createWorld({ seed });

        for (let step = 0; step < 50; step++) {
          simulateWorldMacroAnnualStep(worldA);
          simulateWorldMacroAnnualStep(worldB);
        }

        if (JSON.stringify(worldA.worldMacro) !== JSON.stringify(worldB.worldMacro)) {
          throw new Error(`Reproductibilité échouée pour la graine ${seed}`);
        }
      }
    }

    expect(true).toBe(true);
  });

  it('cas limite 1 : gère correctement un pays à population nulle', () => {
    const world = createWorld({ seed: 12345 });
    const macro = ensureWorldMacroState(world);

    const countryKey = Object.keys(macro.countries)[0]!;
    macro.countries[countryKey]!.population = 0;

    for (let step = 0; step < 10; step++) {
      const popBefore = computeWorldPopulation(macro);
      const { totalBirths, totalDeaths } = simulateWorldMacroAnnualStep(world);
      const popAfter = computeWorldPopulation(macro);

      expect(popAfter).toBe(popBefore + totalBirths - totalDeaths);
      expect(macro.countries[countryKey]!.population).toBeGreaterThanOrEqual(0);

      const { exportsCents, importsCents } = computeTotalExportsAndImports(macro);
      expect(exportsCents).toBe(importsCents);
      assertNoNegativeOrNaNOrInfinite(macro);
    }
  });

  it('cas limite 2 : gère un pays sans aucun partenaire commercial', () => {
    const world = createWorld({ seed: 67890 });
    const macro = ensureWorldMacroState(world);

    const isolatedId = Object.keys(macro.countries)[0]!;
    macro.countries[isolatedId]!.population = 0;
    macro.countries[isolatedId]!.gdpPerCapita = 0;

    simulateWorldMacroAnnualStep(world);

    const exportsFromIsolated = Object.values(macro.tradeMatrix[isolatedId] || {}).reduce((a, b) => a + b, 0);
    let importsToIsolated = 0;
    for (const cId in macro.tradeMatrix) {
      importsToIsolated += macro.tradeMatrix[cId]?.[isolatedId] || 0;
    }

    expect(exportsFromIsolated).toBe(0);
    expect(importsToIsolated).toBe(0);

    const { exportsCents, importsCents } = computeTotalExportsAndImports(macro);
    expect(exportsCents).toBe(importsCents);
    assertNoNegativeOrNaNOrInfinite(macro);
  });

  it('cas limite 3 : gère une matrice de commerce entièrement nulle', () => {
    const world = createWorld({ seed: 11223 });
    const macro = ensureWorldMacroState(world);

    macro.tradeMatrix = {};

    const { exportsCents, importsCents } = computeTotalExportsAndImports(macro);
    expect(exportsCents).toBe(0);
    expect(importsCents).toBe(0);
    expect(exportsCents).toBe(importsCents);

    simulateWorldMacroAnnualStep(world);

    const { exportsCents: expAfter, importsCents: impAfter } = computeTotalExportsAndImports(macro);
    expect(expAfter).toBe(impAfter);
    assertNoNegativeOrNaNOrInfinite(macro);
  });
});
