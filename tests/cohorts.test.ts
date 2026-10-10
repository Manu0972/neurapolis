/**
 * NEURAPOLIS — Tests unitaires et de performance du module de cohortes (Monde 4/6).
 */

import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';
import {
  createDefaultCityCohorts,
  createInitialWorldCohortsState,
  stepCityCohorts,
  stepWorldCohorts,
  syncCountryTotals,
  type WorldCohortsState,
  type CountryCohorts,
  type CityCohorts,
} from '../src/simulation/world/cohorts';

describe('Simulation des cohortes urbaines (Monde 4/6)', () => {
  it('garantit la conservation stricte des totaux de population et d’indicateurs avec les pays', () => {
    const rngState = { rng: 12345 };
    const worldCohorts = createInitialWorldCohortsState(rngState);

    // Vérification initiale
    syncCountryTotals(worldCohorts);
    for (const country of Object.values(worldCohorts.countries)) {
      let expectedPop = 0;
      let expectedBirths = 0;
      let expectedDeaths = 0;
      for (const cityId of country.cityIds) {
        const city = worldCohorts.cities[cityId]!;
        expectedPop += city.stats.totalPopulation;
        expectedBirths += city.stats.birthsLastYear;
        expectedDeaths += city.stats.deathsLastYear;
      }
      expect(country.stats.totalPopulation).toBe(expectedPop);
      expect(country.stats.birthsLastYear).toBe(expectedBirths);
      expect(country.stats.deathsLastYear).toBe(expectedDeaths);
    }

    // Simulation sur 5 ans et vérification de l'invariant à chaque année
    for (let year = 0; year < 5; year++) {
      stepWorldCohorts(worldCohorts, rngState);

      for (const country of Object.values(worldCohorts.countries)) {
        let expectedPop = 0;
        let expectedBirths = 0;
        let expectedDeaths = 0;
        let expectedCreated = 0;
        let expectedBankrupt = 0;

        for (const cityId of country.cityIds) {
          const city = worldCohorts.cities[cityId]!;
          expectedPop += city.stats.totalPopulation;
          expectedBirths += city.stats.birthsLastYear;
          expectedDeaths += city.stats.deathsLastYear;
          expectedCreated += city.stats.businessesCreatedLastYear;
          expectedBankrupt += city.stats.businessesBankruptLastYear;
        }

        expect(country.stats.totalPopulation).toBe(expectedPop);
        expect(country.stats.birthsLastYear).toBe(expectedBirths);
        expect(country.stats.deathsLastYear).toBe(expectedDeaths);
        expect(country.stats.businessesCreatedLastYear).toBe(expectedCreated);
        expect(country.stats.businessesBankruptLastYear).toBe(expectedBankrupt);
      }
    }
  });

  it('produit des distributions démographiques et socio-économiques plausibles', () => {
    const rngState = { rng: 999 };
    const city = createDefaultCityCohorts('v_test', 'Ville Test', 'pays_test', 50000, rngState);

    // Simule 10 ans de vie urbaine
    for (let i = 0; i < 10; i++) {
      stepCityCohorts(city, rngState);
    }

    // Vérifications de plausibilité
    expect(city.stats.totalPopulation).toBeGreaterThan(30000);
    expect(city.stats.totalPopulation).toBeLessThan(80000);

    for (const c of city.cohorts) {
      expect(c.population).toBeGreaterThanOrEqual(0);

      // Les enfants sont sans emploi et au niveau primaire
      if (c.ageGroup === 'enfant') {
        expect(c.metier).toBe('sans_emploi');
        expect(c.etudes).toBe('primaire');
      }

      // Les retraités sont sans emploi
      if (c.ageGroup === 'retraite') {
        expect(c.metier).toBe('sans_emploi');
      }

      // Les diplômés du supérieur occupent des postes qualifiés s'ils travaillent
      if (c.etudes === 'superieur' && c.metier !== 'sans_emploi') {
        expect(['cadre_technicien', 'profession_liberale']).toContain(c.metier);
      }
    }

    // Taux de chômage compris dans une fourchette réaliste (0% à 30%)
    expect(city.stats.unemploymentRate).toBeGreaterThanOrEqual(0);
    expect(city.stats.unemploymentRate).toBeLessThanOrEqual(0.3);
  });

  it('garantit un déterminisme strict pour deux simulations partageant la même seed', () => {
    const worldA = createInitialWorldCohortsState({ rng: 424242 });
    const worldB = createInitialWorldCohortsState({ rng: 424242 });

    const rngA = { rng: 424242 };
    const rngB = { rng: 424242 };

    for (let i = 0; i < 7; i++) {
      stepWorldCohorts(worldA, rngA);
      stepWorldCohorts(worldB, rngB);
    }

    expect(worldA).toEqual(worldB);
  });

  it('gère l’aller-retour de sauvegarde JSON v25 et la migration depuis v24', () => {
    const w = createWorld({ seed: 777 });
    expect(w.version).toBe(CURRENT_SAVE_VERSION);
    expect(w.worldCohorts).toBeDefined();

    // Export & Import roundtrip
    const json = exportSave(w);
    const restored = importSave(json);
    expect(restored.version).toBe(CURRENT_SAVE_VERSION);
    expect(restored.worldCohorts).toEqual(w.worldCohorts);

    // Migration depuis v24
    const rawV24 = JSON.parse(json) as Record<string, unknown>;
    rawV24.version = 24;
    delete rawV24.worldCohorts;

    const migrated = migrateSave(rawV24);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.worldCohorts).toBeDefined();
    expect(migrated.worldCohorts?.cities['val_ferrand']).toBeDefined();
  });

  it('simule 10 000 villes sur un pas annuel en quelques secondes (< 5 secondes)', () => {
    const rngState = { rng: 20261010 };
    const cities: Record<string, CityCohorts> = {};
    const cityIds: string[] = [];

    const numCities = 10000;
    for (let i = 0; i < numCities; i++) {
      const id = `city_${i}`;
      cityIds.push(id);
      cities[id] = createDefaultCityCohorts(id, `Ville ${i}`, 'grand_pays', 10000 + (i % 50000), rngState);
    }

    const country: CountryCohorts = {
      id: 'grand_pays',
      name: 'Grand Pays',
      cityIds,
      stats: {
        totalPopulation: 0,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };

    const bigWorld: WorldCohortsState = {
      countries: { grand_pays: country },
      cities,
      lastSimulatedYear: 2020,
    };

    syncCountryTotals(bigWorld);
    const initialTotalPop = country.stats.totalPopulation;
    expect(initialTotalPop).toBeGreaterThan(100000000); // > 100M d'habitants

    const startTime = Date.now();

    // Exécution d'un pas annuel sur 10 000 villes
    stepWorldCohorts(bigWorld, rngState);

    const elapsedMs = Date.now() - startTime;
    // Doit être exécuté en moins de 5000 ms (généralement < 1000 ms)
    expect(elapsedMs).toBeLessThan(5000);

    // Vérification que les totaux du pays sont conservés
    let sumPop = 0;
    for (const city of Object.values(bigWorld.cities)) {
      sumPop += city.stats.totalPopulation;
    }
    expect(country.stats.totalPopulation).toBe(sumPop);
    expect(bigWorld.lastSimulatedYear).toBe(2021);
  });
});
