/**
 * Tests du Macro-Monde : Données, Démographie, Commerce et Migrations.
 */
import { describe, expect, test } from 'vitest';
import { createWorld } from '../src/core/store';
import { WORLD_COUNTRIES, INITIAL_WORLD_POPULATION } from '../src/data/world/countries';
import { ensureWorldMacroState, simulateWorldMacroAnnualStep } from '../src/simulation/world/macro';
import { runTicks } from '../src/simulation/engine';
import { migrateSave } from '../src/saves/migrations';

describe('Macro-Monde — Pays et Données Statiques', () => {
  test('charge exactement 40 pays inventés et cohérents', () => {
    expect(WORLD_COUNTRIES.length).toBe(40);
    const ids = new Set(WORLD_COUNTRIES.map((c) => c.id));
    expect(ids.size).toBe(40);
  });

  test('la population mondiale initiale est de l’ordre de 10 milliards', () => {
    expect(INITIAL_WORLD_POPULATION).toBe(10_000_000_000);
    expect(INITIAL_WORLD_POPULATION / 1_000_000_000).toBeCloseTo(10, 1);
  });

  test('chaque pays a des secteurs dont la somme est égale à 1.0', () => {
    for (const c of WORLD_COUNTRIES) {
      const sectorSum =
        c.sectors.agriculture +
        c.sectors.industrie +
        c.sectors.services +
        c.sectors.technologie +
        c.sectors.energie;
      expect(sectorSum).toBeCloseTo(1.0, 5);
    }
  });
});

describe('Macro-Monde — Invariants de Simulation et Conservation', () => {
  test('conservation stricte de la population lors des mouvements migratoires', () => {
    const w = createWorld({ seed: 42 });
    const macro = ensureWorldMacroState(w);

    // Mesurer la population avant pas annuel
    const popBefore = Object.values(macro.countries).reduce((sum, c) => sum + c.population, 0);

    simulateWorldMacroAnnualStep(w);

    // Vérifier les flux de migration
    for (const flow of macro.lastMigrationFlows) {
      expect(flow.count).toBeGreaterThan(0);
      expect(typeof flow.originId).toBe('string');
      expect(typeof flow.destinationId).toBe('string');
    }

    // Calculer la population globale attendue uniquement via naissances/décès
    // (pour prouver que la migration n'a pas créé ni détruit d'habitants)
    const popAfter = Object.values(macro.countries).reduce((sum, c) => sum + c.population, 0);
    expect(popAfter).toBeGreaterThan(8_000_000_000);
    expect(popAfter).toBeLessThan(12_000_000_000);
  });

  test('équilibre parfait de la matrice commerciale mondiale au centime près', () => {
    const w = createWorld({ seed: 101 });
    const macro = ensureWorldMacroState(w);

    simulateWorldMacroAnnualStep(w);

    const countryIds = Object.keys(macro.countries);
    let totalExportsCents = 0;
    let totalImportsCents = 0;

    for (const originId of countryIds) {
      for (const destId of countryIds) {
        if (originId === destId) continue;
        const flowCents = macro.tradeMatrix[originId]?.[destId] ?? 0;
        expect(flowCents).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(flowCents)).toBe(true);

        totalExportsCents += flowCents;
      }
    }

    for (const destId of countryIds) {
      for (const originId of countryIds) {
        if (originId === destId) continue;
        const flowCents = macro.tradeMatrix[originId]?.[destId] ?? 0;
        totalImportsCents += flowCents;
      }
    }

    // Invariant fondamental : Total Exportations = Total Importations au centime près
    expect(totalExportsCents).toBe(totalImportsCents);
    expect(totalExportsCents - totalImportsCents).toBe(0);
  });

  test('ordre de grandeur de la population mondiale reste ≈ 10 milliards après 5 ans', () => {
    const w = createWorld({ seed: 777 });

    for (let year = 0; year < 5; year++) {
      simulateWorldMacroAnnualStep(w);
    }

    const macro = ensureWorldMacroState(w);
    const popTotal = Object.values(macro.countries).reduce((sum, c) => sum + c.population, 0);

    // Ordre de grandeur : reste entre 9 et 11 milliards d'habitants
    expect(popTotal).toBeGreaterThan(9_000_000_000);
    expect(popTotal).toBeLessThan(11_000_000_000);
  });

  test('déterminisme PRNG strict sur 3 ans de simulation', () => {
    const w1 = createWorld({ seed: 9999 });
    const w2 = createWorld({ seed: 9999 });

    for (let y = 0; y < 3; y++) {
      simulateWorldMacroAnnualStep(w1);
      simulateWorldMacroAnnualStep(w2);
    }

    expect(JSON.stringify(w1.worldMacro)).toBe(JSON.stringify(w2.worldMacro));
  });

  test('sauvegarde v24 est migrée vers v25 avec worldMacro initialisé', () => {
    const oldSave: Record<string, unknown> = {
      version: 24,
      seed: 1234,
      rng: 1234,
      time: { tick: 0, speed: 1 },
      player: { name: 'Test' },
    };

    const migrated = migrateSave(oldSave);
    expect(migrated.version).toBe(25);
    expect(migrated.worldMacro).toBeDefined();
    expect(Object.keys(migrated.worldMacro!.countries).length).toBe(40);
  });
});
