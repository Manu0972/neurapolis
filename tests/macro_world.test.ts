/**
 * Tests unitaires pour la simulation macro de 100 ans (niveaux N0-N2).
 * Vérifie :
 * - Le déroulement sur 100 ans (2020 → 2120).
 * - Le déterminisme strict (PRNG mulberry32).
 * - L'extraction reproductible de 20 biographies.
 * - L'enregistrement des indicateurs démographiques, économiques et migratoires.
 * - L'exécution de tools/monde/simuler.ts.
 */

import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { extract20Biographies, simulate100Years, simulateMacroWorldYear } from '../src/simulation/macro_world';
import { runSimulationAndWriteReport } from '../tools/monde/simuler';
import * as fs from 'node:fs';

describe('Simulation Macro 100 ans (Niveaux N0 - N2)', () => {
  it('exécute 100 ans de simulation et complète macroWorld', () => {
    const world = createWorld({ seed: 20200901 });
    const mw = simulate100Years(world);

    expect(mw.totalYearsSimulated).toBe(100);
    expect(mw.startYear).toBe(2020);
    expect(mw.currentYear).toBe(2120);
    expect(mw.history).toHaveLength(100);
    expect(mw.citizens.length).toBeGreaterThan(300);
    expect(mw.businesses.length).toBeGreaterThan(50);
    expect(mw.biographies).toHaveLength(20);
    expect(mw.performance).toBeDefined();
    expect(mw.performance?.runtimeMs).toBeGreaterThanOrEqual(0);
  });

  it('est strictement déterministe (2 simulations avec la même seed donnent un résultat identique)', () => {
    const world1 = createWorld({ seed: 777123 });
    const world2 = createWorld({ seed: 777123 });

    const mw1 = simulate100Years(world1);
    const mw2 = simulate100Years(world2);

    expect(mw1.totalBirths).toBe(mw2.totalBirths);
    expect(mw1.totalDeaths).toBe(mw2.totalDeaths);
    expect(mw1.totalImmigrants).toBe(mw2.totalImmigrants);
    expect(mw1.totalEmigrants).toBe(mw2.totalEmigrants);
    expect(mw1.totalBusinessesCreated).toBe(mw2.totalBusinessesCreated);
    expect(mw1.totalBusinessesClosed).toBe(mw2.totalBusinessesClosed);
    expect(mw1.history).toEqual(mw2.history);
    expect(mw1.biographies).toEqual(mw2.biographies);
  });

  it('des seeds différentes produisent des évolutions distinctes', () => {
    const world1 = createWorld({ seed: 101010 });
    const world2 = createWorld({ seed: 909090 });

    const mw1 = simulate100Years(world1);
    const mw2 = simulate100Years(world2);

    expect(mw1.history).not.toEqual(mw2.history);
    expect(mw1.citizens[0]?.firstName).not.toBe(mw2.citizens[0]?.firstName);
  });

  it('simulateMacroWorldYear avance d’un an et enregistre les indicateurs', () => {
    const world = createWorld({ seed: 55555 });
    const year1 = simulateMacroWorldYear(world);

    expect(year1.year).toBe(2020);
    expect(year1.populationTotal).toBeGreaterThan(0);
    expect(world.macroWorld?.currentYear).toBe(2021);

    const year2 = simulateMacroWorldYear(world);
    expect(year2.year).toBe(2021);
    expect(world.macroWorld?.currentYear).toBe(2022);
  });

  it('extract20Biographies extrait 20 biographies reproductibles avec chronologies', () => {
    const world = createWorld({ seed: 123456 });
    simulate100Years(world);

    const bios = extract20Biographies(world);
    expect(bios).toHaveLength(20);

    for (const bio of bios) {
      expect(bio.citizenId).toBeDefined();
      expect(bio.name).toBeDefined();
      expect(bio.birthYear).toBeGreaterThan(1900);
      expect(bio.profession).toBeDefined();
      expect(bio.summary.length).toBeGreaterThan(10);
      expect(bio.timeline.length).toBeGreaterThan(0);
    }
  });

  it('runSimulationAndWriteReport génère le rapport docs/monde/RAPPORT-SIMULATION.md', () => {
    const { reportPath } = runSimulationAndWriteReport();
    expect(fs.existsSync(reportPath)).toBe(true);

    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('RAPPORT DE SIMULATION DE MONDE SUR 100 ANS');
    expect(content).toContain('Mesures de Performance');
    expect(content).toContain('Courbes et Évolution de la Population');
    expect(content).toContain('Dynamique des Entreprises');
    expect(content).toContain('Flux Migratoires');
    expect(content).toContain('20 Biographies Tirées de Façon Reproductible');
  });
});
