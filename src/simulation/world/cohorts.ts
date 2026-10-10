/**
 * NEURAPOLIS — Simulation mondiale des cohortes urbaines (Monde 4/6).
 *
 * Chaque ville est représentée par une agrégation de cohortes :
 *   (âge × métier × revenu × études)
 *
 * Pas annuel : naissances, vieillissement, études, emploi,
 * créations et faillites d'entreprises, décès.
 *
 * Déterminisme strict via PRNG du projet (mulberry32). Sans DOM.
 */

import { rngNext } from '../../core/rng';

export type AgeGroup = 'enfant' | 'jeune_actif' | 'actif' | 'senior_actif' | 'retraite';
export type Metier = 'sans_emploi' | 'ouvrier_employe' | 'cadre_technicien' | 'artisan_commercant' | 'profession_liberale';
export type RevenuLevel = 'faible' | 'moyen' | 'eleve';
export type EtudesLevel = 'primaire' | 'secondaire' | 'superieur';

export interface Cohort {
  ageGroup: AgeGroup;
  metier: Metier;
  revenu: RevenuLevel;
  etudes: EtudesLevel;
  population: number;
}

export interface CityCohortsStats {
  totalPopulation: number;
  birthsLastYear: number;
  deathsLastYear: number;
  businessesCreatedLastYear: number;
  businessesBankruptLastYear: number;
  unemploymentRate: number; // 0..1
}

export interface CityCohorts {
  id: string;
  name: string;
  countryId: string;
  cohorts: Cohort[];
  stats: CityCohortsStats;
}

export interface CountryCohortsStats {
  totalPopulation: number;
  birthsLastYear: number;
  deathsLastYear: number;
  businessesCreatedLastYear: number;
  businessesBankruptLastYear: number;
  unemploymentRate: number; // 0..1
}

export interface CountryCohorts {
  id: string;
  name: string;
  cityIds: string[];
  stats: CountryCohortsStats;
}

export interface WorldCohortsState {
  countries: Record<string, CountryCohorts>;
  cities: Record<string, CityCohorts>;
  lastSimulatedYear: number;
}

/**
 * Crée ou retrouve une cohorte spécifique dans la liste.
 */
export function findOrCreateCohort(
  cohorts: Cohort[],
  ageGroup: AgeGroup,
  metier: Metier,
  revenu: RevenuLevel,
  etudes: EtudesLevel
): Cohort {
  let c = cohorts.find(
    (item) =>
      item.ageGroup === ageGroup &&
      item.metier === metier &&
      item.revenu === revenu &&
      item.etudes === etudes
  );
  if (!c) {
    c = { ageGroup, metier, revenu, etudes, population: 0 };
    cohorts.push(c);
  }
  return c;
}

/**
 * Recalcule les statistiques consolidées d'une ville.
 */
export function recalculateCityStats(city: CityCohorts): void {
  let totalPop = 0;
  let activeWorkforce = 0;
  let unemployedCount = 0;

  for (const c of city.cohorts) {
    const pop = Math.max(0, Math.round(c.population));
    c.population = pop;
    totalPop += pop;

    if (c.ageGroup === 'jeune_actif' || c.ageGroup === 'actif' || c.ageGroup === 'senior_actif') {
      activeWorkforce += pop;
      if (c.metier === 'sans_emploi') {
        unemployedCount += pop;
      }
    }
  }

  // Élimine les cohortes vides pour garder un objet compact
  city.cohorts = city.cohorts.filter((c) => c.population > 0);

  city.stats.totalPopulation = totalPop;
  city.stats.unemploymentRate =
    activeWorkforce > 0 ? Math.min(1, Math.max(0, unemployedCount / activeWorkforce)) : 0;
}

/**
 * Synchronise les statistiques globales des pays à partir des villes qu'ils englobent.
 * Garantit l'invariant de conservation des totaux.
 */
export function syncCountryTotals(world: WorldCohortsState): void {
  for (const country of Object.values(world.countries)) {
    let totalPop = 0;
    let births = 0;
    let deaths = 0;
    let created = 0;
    let bankrupt = 0;
    let weightedUnemployment = 0;

    for (const cityId of country.cityIds) {
      const city = world.cities[cityId];
      if (!city) continue;
      totalPop += city.stats.totalPopulation;
      births += city.stats.birthsLastYear;
      deaths += city.stats.deathsLastYear;
      created += city.stats.businessesCreatedLastYear;
      bankrupt += city.stats.businessesBankruptLastYear;
      weightedUnemployment += city.stats.unemploymentRate * city.stats.totalPopulation;
    }

    country.stats = {
      totalPopulation: totalPop,
      birthsLastYear: births,
      deathsLastYear: deaths,
      businessesCreatedLastYear: created,
      businessesBankruptLastYear: bankrupt,
      unemploymentRate: totalPop > 0 ? weightedUnemployment / totalPop : 0,
    };
  }
}

/**
 * Génère une ville initiale plausible avec sa répartition en cohortes.
 */
export function createDefaultCityCohorts(
  id: string,
  name: string,
  countryId: string,
  initialPopulation: number = 25000,
  _rngState?: { rng: number }
): CityCohorts {
  const cohorts: Cohort[] = [];
  const pop = Math.max(100, Math.round(initialPopulation));

  // Répartition démographique type (%)
  // Enfants: 20%, Jeunes actifs: 18%, Actifs: 35%, Seniors actifs: 12%, Retraités: 15%
  const distribution = [
    { ageGroup: 'enfant' as const, pct: 0.2, metier: 'sans_emploi' as const, revenu: 'faible' as const, etudes: 'primaire' as const },
    { ageGroup: 'jeune_actif' as const, pct: 0.1, metier: 'ouvrier_employe' as const, revenu: 'moyen' as const, etudes: 'secondaire' as const },
    { ageGroup: 'jeune_actif' as const, pct: 0.08, metier: 'sans_emploi' as const, revenu: 'faible' as const, etudes: 'secondaire' as const },
    { ageGroup: 'actif' as const, pct: 0.2, metier: 'ouvrier_employe' as const, revenu: 'moyen' as const, etudes: 'secondaire' as const },
    { ageGroup: 'actif' as const, pct: 0.1, metier: 'cadre_technicien' as const, revenu: 'eleve' as const, etudes: 'superieur' as const },
    { ageGroup: 'actif' as const, pct: 0.03, metier: 'artisan_commercant' as const, revenu: 'moyen' as const, etudes: 'secondaire' as const },
    { ageGroup: 'actif' as const, pct: 0.02, metier: 'profession_liberale' as const, revenu: 'eleve' as const, etudes: 'superieur' as const },
    { ageGroup: 'senior_actif' as const, pct: 0.08, metier: 'ouvrier_employe' as const, revenu: 'moyen' as const, etudes: 'secondaire' as const },
    { ageGroup: 'senior_actif' as const, pct: 0.04, metier: 'cadre_technicien' as const, revenu: 'eleve' as const, etudes: 'superieur' as const },
    { ageGroup: 'retraite' as const, pct: 0.15, metier: 'sans_emploi' as const, revenu: 'moyen' as const, etudes: 'secondaire' as const },
  ];

  let assigned = 0;
  for (let i = 0; i < distribution.length; i++) {
    const item = distribution[i]!;
    const cPop = i === distribution.length - 1 ? pop - assigned : Math.round(pop * item.pct);
    assigned += cPop;

    const c = findOrCreateCohort(cohorts, item.ageGroup, item.metier, item.revenu, item.etudes);
    c.population += cPop;
  }

  const city: CityCohorts = {
    id,
    name,
    countryId,
    cohorts,
    stats: {
      totalPopulation: pop,
      birthsLastYear: 0,
      deathsLastYear: 0,
      businessesCreatedLastYear: 0,
      businessesBankruptLastYear: 0,
      unemploymentRate: 0,
    },
  };

  recalculateCityStats(city);
  return city;
}

/**
 * Simule un pas annuel pour une ville (naissances, vieillissement, études, emploi, entreprises, décès).
 */
export function stepCityCohorts(city: CityCohorts, rngState: { rng: number }): void {
  const nextCohorts: Cohort[] = [];

  let totalBirths = 0;
  let totalDeaths = 0;
  let businessesCreated = 0;
  let businessesBankrupt = 0;

  // Calcul du taux de fertilité et mortalité avec petite variation PRNG
  const birthRateModifier = 1 + (rngNext(rngState) * 0.1 - 0.05); // ±5%
  const deathRateModifier = 1 + (rngNext(rngState) * 0.1 - 0.05);

  // 1. Traitement cohorte par cohorte
  for (const c of city.cohorts) {
    if (c.population <= 0) continue;

    let pop = c.population;

    // --- Décès ---
    let mortalityRate = 0.0005; // Enfant
    if (c.ageGroup === 'jeune_actif') mortalityRate = 0.001;
    else if (c.ageGroup === 'actif') mortalityRate = 0.002;
    else if (c.ageGroup === 'senior_actif') mortalityRate = 0.008;
    else if (c.ageGroup === 'retraite') mortalityRate = 0.035;

    mortalityRate *= deathRateModifier;
    const deaths = Math.min(pop, Math.round(pop * mortalityRate));
    pop -= deaths;
    totalDeaths += deaths;

    if (pop <= 0) continue;

    // --- Naissances ---
    // Les cohortes en âge de procréer (jeune_actif, actif, senior_actif)
    if (c.ageGroup === 'jeune_actif' || c.ageGroup === 'actif' || c.ageGroup === 'senior_actif') {
      const fertilityRate = (c.ageGroup === 'actif' ? 0.028 : 0.015) * birthRateModifier;
      const births = Math.round(pop * fertilityRate);
      totalBirths += births;
    }

    // --- Vieillissement & Transitions ---
    if (c.ageGroup === 'enfant') {
      // ~1/18 des enfants deviennent jeunes actifs chaque année (à 18 ans)
      const agingFraction = 1 / 18;
      const agingPop = Math.round(pop * agingFraction);
      const remainingEnfant = pop - agingPop;

      if (remainingEnfant > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'enfant', 'sans_emploi', c.revenu, 'primaire');
        dest.population += remainingEnfant;
      }

      if (agingPop > 0) {
        // Études : 60% diplôme secondaire, 30% diplôme supérieur, 10% primaire
        const supPop = Math.round(agingPop * 0.3);
        const secPop = Math.round(agingPop * 0.6);
        const primPop = agingPop - supPop - secPop;

        if (supPop > 0) {
          const dest = findOrCreateCohort(nextCohorts, 'jeune_actif', 'sans_emploi', 'moyen', 'superieur');
          dest.population += supPop;
        }
        if (secPop > 0) {
          const dest = findOrCreateCohort(nextCohorts, 'jeune_actif', 'sans_emploi', 'moyen', 'secondaire');
          dest.population += secPop;
        }
        if (primPop > 0) {
          const dest = findOrCreateCohort(nextCohorts, 'jeune_actif', 'sans_emploi', 'faible', 'primaire');
          dest.population += primPop;
        }
      }
    } else if (c.ageGroup === 'jeune_actif') {
      // ~1/12 passage vers actif
      const agingFraction = 1 / 12;
      const agingPop = Math.round(pop * agingFraction);
      const remaining = pop - agingPop;

      if (remaining > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'jeune_actif', c.metier, c.revenu, c.etudes);
        dest.population += remaining;
      }
      if (agingPop > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'actif', c.metier, c.revenu, c.etudes);
        dest.population += agingPop;
      }
    } else if (c.ageGroup === 'actif') {
      // ~1/25 passage vers senior actif
      const agingFraction = 1 / 25;
      const agingPop = Math.round(pop * agingFraction);
      const remaining = pop - agingPop;

      if (remaining > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'actif', c.metier, c.revenu, c.etudes);
        dest.population += remaining;
      }
      if (agingPop > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'senior_actif', c.metier, c.revenu, c.etudes);
        dest.population += agingPop;
      }
    } else if (c.ageGroup === 'senior_actif') {
      // ~1/10 passage vers retraite
      const agingFraction = 1 / 10;
      const agingPop = Math.round(pop * agingFraction);
      const remaining = pop - agingPop;

      if (remaining > 0) {
        const dest = findOrCreateCohort(nextCohorts, 'senior_actif', c.metier, c.revenu, c.etudes);
        dest.population += remaining;
      }
      if (agingPop > 0) {
        // En retraite, le métier devient sans_emploi et le revenu devient moyen
        const dest = findOrCreateCohort(nextCohorts, 'retraite', 'sans_emploi', 'moyen', c.etudes);
        dest.population += agingPop;
      }
    } else {
      // Retraité stay retraite
      const dest = findOrCreateCohort(nextCohorts, 'retraite', 'sans_emploi', c.revenu, c.etudes);
      dest.population += pop;
    }
  }

  // Ajouter les nouveau-nés
  if (totalBirths > 0) {
    const dest = findOrCreateCohort(nextCohorts, 'enfant', 'sans_emploi', 'faible', 'primaire');
    dest.population += totalBirths;
  }

  // 2. Économie, Emploi & Entreprises sur les cohortes actives
  let activePop = 0;
  for (const c of nextCohorts) {
    if (c.ageGroup === 'jeune_actif' || c.ageGroup === 'actif' || c.ageGroup === 'senior_actif') {
      activePop += c.population;
    }
  }

  // Embauche des sans-emploi vers un métier approprié
  for (const c of nextCohorts) {
    if (
      (c.ageGroup === 'jeune_actif' || c.ageGroup === 'actif' || c.ageGroup === 'senior_actif') &&
      c.metier === 'sans_emploi' &&
      c.population > 0
    ) {
      // Taux d'insertion ~70%
      const hiredCount = Math.round(c.population * 0.7);
      if (hiredCount > 0) {
        c.population -= hiredCount;
        let newMetier: Metier = 'ouvrier_employe';
        let newRevenu: RevenuLevel = 'moyen';

        if (c.etudes === 'superieur') {
          newMetier = rngNext(rngState) < 0.8 ? 'cadre_technicien' : 'profession_liberale';
          newRevenu = 'eleve';
        } else if (c.etudes === 'secondaire') {
          newMetier = rngNext(rngState) < 0.85 ? 'ouvrier_employe' : 'artisan_commercant';
          newRevenu = 'moyen';
        }

        const hiredCohort = findOrCreateCohort(nextCohorts, c.ageGroup, newMetier, newRevenu, c.etudes);
        hiredCohort.population += hiredCount;
      }
    }
  }

  // Création & faillites d'entreprises
  const creationRate = 0.008 + rngNext(rngState) * 0.004; // ~0.8% - 1.2% des actifs créent une entreprise
  businessesCreated = Math.round(activePop * creationRate);

  const bankruptcyRate = 0.003 + rngNext(rngState) * 0.002; // ~0.3% - 0.5%
  businessesBankrupt = Math.round(activePop * bankruptcyRate);

  // Applique les modifications sur la liste de la ville
  city.cohorts = nextCohorts.filter((c) => c.population > 0);
  city.stats.birthsLastYear = totalBirths;
  city.stats.deathsLastYear = totalDeaths;
  city.stats.businessesCreatedLastYear = businessesCreated;
  city.stats.businessesBankruptLastYear = businessesBankrupt;

  recalculateCityStats(city);
}

/**
 * Simule un pas annuel pour tout le monde des cohortes (toutes les villes de tous les pays).
 */
export function stepWorldCohorts(world: WorldCohortsState, rngState: { rng: number }): void {
  for (const city of Object.values(world.cities)) {
    stepCityCohorts(city, rngState);
  }
  world.lastSimulatedYear += 1;
  syncCountryTotals(world);
}

/**
 * Crée l'état initial par défaut pour le monde des cohortes.
 */
export function createInitialWorldCohortsState(rngState?: { rng: number }): WorldCohortsState {
  const rs = rngState ?? { rng: 20200901 };

  const cityValFerrand = createDefaultCityCohorts('val_ferrand', 'Val-Ferrand', 'france_fictive', 35000, rs);
  const cityNeoLutece = createDefaultCityCohorts('neo_lutece', 'Néo-Lutèce', 'france_fictive', 120000, rs);
  const citySolaria = createDefaultCityCohorts('solaria', 'Solaria', 'solaria_land', 85000, rs);

  const world: WorldCohortsState = {
    countries: {
      france_fictive: {
        id: 'france_fictive',
        name: 'France Fictive',
        cityIds: ['val_ferrand', 'neo_lutece'],
        stats: {
          totalPopulation: 0,
          birthsLastYear: 0,
          deathsLastYear: 0,
          businessesCreatedLastYear: 0,
          businessesBankruptLastYear: 0,
          unemploymentRate: 0,
        },
      },
      solaria_land: {
        id: 'solaria_land',
        name: 'Solaria Land',
        cityIds: ['solaria'],
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
    cities: {
      val_ferrand: cityValFerrand,
      neo_lutece: cityNeoLutece,
      solaria: citySolaria,
    },
    lastSimulatedYear: 2020,
  };

  syncCountryTotals(world);
  return world;
}
