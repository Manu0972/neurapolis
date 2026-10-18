import { describe, it, expect } from 'vitest';
import {
  createDefaultCityCohorts,
  stepCityCohorts,
  recalculateCityStats,
  syncCountryTotals,
  CityCohorts,
  WorldCohortsState,
} from '../../src/simulation/world/cohorts';

describe('Cohortes — Cas Limites (30 ans)', () => {
  // Helper pour vérifier les invariants
  function assertInvariants(city: CityCohorts, countryWorld?: WorldCohortsState) {
    let sumCohorts = 0;
    for (const c of city.cohorts) {
      expect(Number.isInteger(c.population)).toBe(true);
      expect(c.population).toBeGreaterThanOrEqual(0);
      sumCohorts += c.population;
    }
    expect(city.stats.totalPopulation).toBe(sumCohorts);
    expect(Number.isNaN(city.stats.unemploymentRate)).toBe(false);
    expect(city.stats.unemploymentRate).toBeGreaterThanOrEqual(0);
    expect(city.stats.unemploymentRate).toBeLessThanOrEqual(1);

    if (countryWorld) {
      syncCountryTotals(countryWorld);
      const country = countryWorld.countries[city.countryId];
      if (country) {
        expect(Number.isNaN(country.stats.unemploymentRate)).toBe(false);
        expect(country.stats.unemploymentRate).toBeGreaterThanOrEqual(0);
        expect(country.stats.unemploymentRate).toBeLessThanOrEqual(1);
        expect(country.stats.totalPopulation).toBeGreaterThanOrEqual(0);
      }
    }
  }

  it('1. ville à population nulle (aucune naissance spontanée, aucun NaN)', () => {
    const rngState = { rng: 123456 };
    const city: CityCohorts = {
      id: 'empty_city',
      name: 'Ville Fantôme',
      countryId: 'test_country',
      cohorts: [],
      stats: {
        totalPopulation: 0,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };
    const world: WorldCohortsState = {
      countries: {
        test_country: {
          id: 'test_country',
          name: 'Pays Test',
          cityIds: ['empty_city'],
          stats: {
            totalPopulation: 0,
            birthsLastYear: 0,
            deathsLastYear: 0,
            businessesCreatedLastYear: 0,
            businessesBankruptLastYear: 0,
            unemploymentRate: 0,
          },
        },
      },
      cities: { empty_city: city },
      lastSimulatedYear: 2020,
    };

    recalculateCityStats(city);
    assertInvariants(city, world);

    for (let year = 0; year < 30; year++) {
      stepCityCohorts(city, rngState);
      assertInvariants(city, world);
      expect(city.stats.totalPopulation).toBe(0);
      expect(city.stats.birthsLastYear).toBe(0);
      expect(city.cohorts.length).toBe(0);
    }
  });

  it('2. ville d\'une seule personne adulte', () => {
    const rngState = { rng: 123456 };
    const city: CityCohorts = {
      id: 'solo_city',
      name: 'Solo Ville',
      countryId: 'test_country',
      cohorts: [
        {
          ageGroup: 'actif',
          metier: 'ouvrier_employe',
          revenu: 'moyen',
          etudes: 'secondaire',
          population: 1,
        },
      ],
      stats: {
        totalPopulation: 1,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };
    const world: WorldCohortsState = {
      countries: {
        test_country: {
          id: 'test_country',
          name: 'Pays Test',
          cityIds: ['solo_city'],
          stats: {
            totalPopulation: 1,
            birthsLastYear: 0,
            deathsLastYear: 0,
            businessesCreatedLastYear: 0,
            businessesBankruptLastYear: 0,
            unemploymentRate: 0,
          },
        },
      },
      cities: { solo_city: city },
      lastSimulatedYear: 2020,
    };

    recalculateCityStats(city);
    assertInvariants(city, world);

    for (let year = 0; year < 30; year++) {
      stepCityCohorts(city, rngState);
      assertInvariants(city, world);
    }
  });

  it('3. ville où toutes les personnes ont le même âge (vieillissement en bloc)', () => {
    const rngState = { rng: 123456 };
    const city: CityCohorts = {
      id: 'same_age_city',
      name: 'Ville Même Âge',
      countryId: 'test_country',
      cohorts: [
        {
          ageGroup: 'enfant',
          metier: 'sans_emploi',
          revenu: 'moyen',
          etudes: 'primaire',
          population: 50,
        },
      ],
      stats: {
        totalPopulation: 50,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };
    const world: WorldCohortsState = {
      countries: {
        test_country: {
          id: 'test_country',
          name: 'Pays Test',
          cityIds: ['same_age_city'],
          stats: {
            totalPopulation: 50,
            birthsLastYear: 0,
            deathsLastYear: 0,
            businessesCreatedLastYear: 0,
            businessesBankruptLastYear: 0,
            unemploymentRate: 0,
          },
        },
      },
      cities: { same_age_city: city },
      lastSimulatedYear: 2020,
    };

    recalculateCityStats(city);
    assertInvariants(city, world);

    for (let year = 0; year < 30; year++) {
      stepCityCohorts(city, rngState);
      assertInvariants(city, world);
    }
  });

  it('4. ville sans aucune entreprise (le taux d\'emploi reste défini)', () => {
    const rngState = { rng: 123456 };
    const city: CityCohorts = {
      id: 'no_biz_city',
      name: 'Ville Sans Entreprise',
      countryId: 'test_country',
      cohorts: [
        {
          ageGroup: 'actif',
          metier: 'sans_emploi',
          revenu: 'faible',
          etudes: 'primaire',
          population: 20,
        },
      ],
      stats: {
        totalPopulation: 20,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 1,
      },
    };
    const world: WorldCohortsState = {
      countries: {
        test_country: {
          id: 'test_country',
          name: 'Pays Test',
          cityIds: ['no_biz_city'],
          stats: {
            totalPopulation: 20,
            birthsLastYear: 0,
            deathsLastYear: 0,
            businessesCreatedLastYear: 0,
            businessesBankruptLastYear: 0,
            unemploymentRate: 1,
          },
        },
      },
      cities: { no_biz_city: city },
      lastSimulatedYear: 2020,
    };

    recalculateCityStats(city);
    assertInvariants(city, world);

    for (let year = 0; year < 30; year++) {
      stepCityCohorts(city, rngState);
      assertInvariants(city, world);
    }
  });

  it('5. ville dont tous les effectifs sont petits (1 à 3) pour vérifier que les arrondis ne créent ni ne détruisent de personnes', () => {
    const rngState = { rng: 123456 };
    const city: CityCohorts = {
      id: 'small_city',
      name: 'Micro Ville',
      countryId: 'test_country',
      cohorts: [
        { ageGroup: 'enfant', metier: 'sans_emploi', revenu: 'faible', etudes: 'primaire', population: 1 },
        { ageGroup: 'jeune_actif', metier: 'sans_emploi', revenu: 'faible', etudes: 'secondaire', population: 2 },
        { ageGroup: 'actif', metier: 'ouvrier_employe', revenu: 'moyen', etudes: 'secondaire', population: 3 },
        { ageGroup: 'senior_actif', metier: 'cadre_technicien', revenu: 'eleve', etudes: 'superieur', population: 1 },
        { ageGroup: 'retraite', metier: 'sans_emploi', revenu: 'moyen', etudes: 'secondaire', population: 2 },
      ],
      stats: {
        totalPopulation: 9,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };
    const world: WorldCohortsState = {
      countries: {
        test_country: {
          id: 'test_country',
          name: 'Pays Test',
          cityIds: ['small_city'],
          stats: {
            totalPopulation: 9,
            birthsLastYear: 0,
            deathsLastYear: 0,
            businessesCreatedLastYear: 0,
            businessesBankruptLastYear: 0,
            unemploymentRate: 0,
          },
        },
      },
      cities: { small_city: city },
      lastSimulatedYear: 2020,
    };

    recalculateCityStats(city);
    assertInvariants(city, world);

    for (let year = 0; year < 30; year++) {
      const popBefore = city.stats.totalPopulation;
      stepCityCohorts(city, rngState);
      assertInvariants(city, world);

      // Le changement de population doit s'expliquer EXACTEMENT par naissances - décès
      const expectedPop = popBefore + city.stats.birthsLastYear - city.stats.deathsLastYear;
      expect(city.stats.totalPopulation).toBe(expectedPop);
    }
  });

  it('6. cas des effectifs fractionnaires : la méthode du plus grand reste garantit la conservation déterministe', () => {
    const city: CityCohorts = {
      id: 'frac_city',
      name: 'Ville Fractional',
      countryId: 'test_country',
      cohorts: [
        { ageGroup: 'enfant', metier: 'sans_emploi', revenu: 'faible', etudes: 'primaire', population: 1.4 },
        { ageGroup: 'actif', metier: 'ouvrier_employe', revenu: 'moyen', etudes: 'secondaire', population: 1.4 },
        { ageGroup: 'retraite', metier: 'sans_emploi', revenu: 'moyen', etudes: 'secondaire', population: 1.2 },
      ],
      stats: {
        totalPopulation: 4,
        birthsLastYear: 0,
        deathsLastYear: 0,
        businessesCreatedLastYear: 0,
        businessesBankruptLastYear: 0,
        unemploymentRate: 0,
      },
    };

    recalculateCityStats(city);
    assertInvariants(city);
    expect(city.stats.totalPopulation).toBe(4);
  });
});
