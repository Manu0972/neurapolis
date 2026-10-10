/**
 * NEURAPOLIS — Moteur de simulation macro sur 100 ans (2020 - 2120).
 * Architecture multi-échelle :
 * - Niveau N0 : Macro-économie & tendances nationales (WORLD_TIMELINE + chocs procéduraux).
 * - Niveau N1 : Métropole / Val-Ferrand (attractivité, capacité d'accueil, dynamiques de quartier).
 * - Niveau N2 : Individus & Entreprises (naissances, décès, migrations, créations & faillites d'entreprises, biographies).
 *
 * Déterministe : utilise exclusivement le PRNG mulberry32 de WorldState.
 * Sans DOM, sans Math.random(), sans Date.now().
 */

import type { WorldState } from '../core/types';
import {
  createMacroWorldState,
  type MacroBiography,
  type MacroBusinessRecord,
  type MacroCitizenRecord,
  type MacroWorldPerformance,
  type MacroWorldState,
  type MacroYearHistory,
} from '../core/macro_world_types';
import { rngChance, rngInt, rngNext, rngPick } from '../core/rng';
import { PEDESTRIAN_FIRST_NAMES, PEDESTRIAN_LAST_NAMES } from '../data/lore/pedestrian_names';
import { WORLD_TIMELINE } from '../data/lore/world_timeline';

export const DISTRICTS: readonly string[] = [
  'gare_est',
  'hyperval',
  'industrie',
  'collines',
  'berges',
  'faubourg',
  'grand_ensemble',
  'friche_sud',
  'bellevue',
];

export const BUSINESS_SECTORS: readonly string[] = [
  'Boulangerie & Snack',
  'Épicerie de quartier',
  'Café & Restauration',
  'Atelier & Vélo',
  'Friperie & Mode',
  'Librairie & Presse',
  'Service & Logistique',
  'Fleuriste & Horticulture',
  'Artisanat du Bois',
  'Coopérative & Énergie',
];

export const PROFESSIONS: readonly string[] = [
  'Ouvrier·e métallurgiste',
  'Épicier·e',
  'Boulanger·e',
  'Artisan·e réparateur·rice',
  'Commerçant·e',
  'Enseignant·e',
  'Infirmier·e',
  'Ingénieur·e',
  'Chauffeur·se de bus',
  'Cadre logistique',
  'Maraîcher·e',
  'Architecte urbaniste',
];

export const POST_2045_TRENDS: readonly string[] = [
  'croissance_verte',
  'transition_cooperative',
  'recession_ressources',
  'stabilite_territoriale',
  'essor_technologique',
];

/**
 * Initialise l'état macroWorld s'il n'existe pas encore.
 */
export function ensureMacroWorld(w: WorldState): MacroWorldState {
  if (!w.macroWorld) {
    w.macroWorld = createMacroWorldState(2020);
  }
  return w.macroWorld;
}

/**
 * Génère une population initiale de départ en 2020 (~400 habitants).
 */
export function initMacroPopulation(w: WorldState): void {
  const mw = ensureMacroWorld(w);
  if (mw.citizens.length > 0) return;

  const initialCount = 400;
  for (let i = 0; i < initialCount; i++) {
    const firstName = rngPick(w, PEDESTRIAN_FIRST_NAMES);
    const lastName = rngPick(w, PEDESTRIAN_LAST_NAMES);
    const genderRoll = rngNext(w);
    const gender = genderRoll < 0.48 ? 'fille' : genderRoll < 0.96 ? 'garcon' : 'non-binaire';

    // Répartition d'âge en 2020 (entre 0 et 85 ans)
    const age = rngInt(w, 0, 85);
    const birthYear = 2020 - age;
    const district = rngPick(w, DISTRICTS);
    const profession = age >= 65 ? 'Retraité·e' : age >= 18 ? rngPick(w, PROFESSIONS) : 'Élève / Étudiant·e';

    const citizen: MacroCitizenRecord = {
      id: `cit_${mw.citizens.length + 1}`,
      firstName,
      lastName,
      gender,
      birthYear,
      district,
      profession,
      lifeEvents: [
        { year: birthYear, label: `Naissance à Val-Ferrand (${district}).` },
      ],
    };

    if (age >= 18) {
      citizen.lifeEvents.push({ year: birthYear + 18, label: `Début d'activité professionnelle : ${profession}.` });
    }

    mw.citizens.push(citizen);
  }

  // Initialiser quelques entreprises existantes en 2020 (~30 entreprises)
  const initialBusinesses = 30;
  for (let i = 0; i < initialBusinesses; i++) {
    const sector = rngPick(w, BUSINESS_SECTORS);
    const district = rngPick(w, DISTRICTS);
    const founder = rngPick(w, mw.citizens.filter((c) => 2020 - c.birthYear >= 20 && !c.deathYear));
    const founderName = founder ? `${founder.firstName} ${founder.lastName}` : 'Anonyme';
    const foundedYear = rngInt(w, 2005, 2020);

    const b: MacroBusinessRecord = {
      id: `biz_${mw.businesses.length + 1}`,
      name: `${sector} ${founderName.split(' ')[1] ?? 'du Taret'}`,
      type: sector,
      district,
      founderId: founder?.id ?? 'cit_1',
      foundedYear,
      status: 'actif',
    };

    mw.businesses.push(b);
  }
}

/**
 * Simule une année complète de monde (niveaux N0 - N2).
 */
export function simulateMacroWorldYear(w: WorldState): MacroYearHistory {
  const mw = ensureMacroWorld(w);
  if (mw.citizens.length === 0) {
    initMacroPopulation(w);
  }

  const currentYear = mw.currentYear;

  // --- Niveau N0 : Tendance Macro ---
  let macroTrend = 'stabilite';
  const timelineEvent = WORLD_TIMELINE.find((ev) => ev.year === currentYear);
  if (timelineEvent) {
    macroTrend = timelineEvent.id;
  } else if (currentYear > 2045) {
    macroTrend = rngPick(w, POST_2045_TRENDS);
  }

  // --- Niveau N1 : Attractivité régionale & capacité de la ville ---
  const activeBusinessesCount = mw.businesses.filter((b) => b.status === 'actif').length;
  const activeCitizens = mw.citizens.filter((c) => !c.deathYear && !c.migratedOutYear);
  const cityPopulation = activeCitizens.length;

  let birthRate = 0.022; // ~2.2%
  let deathBaseRate = 0.012; // ~1.2%
  let immigrationRate = 0.03; // ~3%
  let emigrationRate = 0.025; // ~2.5%

  if (macroTrend.includes('recession') || macroTrend.includes('choc') || macroTrend.includes('fermeture')) {
    emigrationRate += 0.015;
    immigrationRate -= 0.01;
  } else if (macroTrend.includes('croissance') || macroTrend.includes('renaissance') || macroTrend.includes('accord')) {
    immigrationRate += 0.015;
    birthRate += 0.003;
  }

  let yearBirths = 0;
  let yearDeaths = 0;
  let yearImmigrants = 0;
  let yearEmigrants = 0;
  let yearBusinessesCreated = 0;
  let yearBusinessesClosed = 0;

  // --- Niveau N2 : Démographie individuelle & Événements de vie ---
  for (const citizen of activeCitizens) {
    const age = currentYear - citizen.birthYear;

    // 1. Décès (probabilité selon l'âge)
    let deathChance = 0.0005;
    if (age > 60) deathChance = 0.012;
    if (age > 75) deathChance = 0.045;
    if (age > 85) deathChance = 0.12;
    if (age > 95) deathChance = 0.35;

    if (deathBaseRate > 0.015) deathChance *= 1.2;

    if (rngChance(w, deathChance)) {
      citizen.deathYear = currentYear;
      citizen.lifeEvents.push({ year: currentYear, label: `Décès à l'âge de ${age} ans.` });
      yearDeaths++;
      continue;
    }

    // 2. Événements de vie selon l'âge
    if (age === 6) {
      citizen.lifeEvents.push({ year: currentYear, label: `Entrée à l'école primaire de ${citizen.district}.` });
    } else if (age === 12) {
      citizen.lifeEvents.push({ year: currentYear, label: 'Entrée au Collège des Roses à Val-Ferrand.' });
    } else if (age === 18) {
      citizen.profession = rngPick(w, PROFESSIONS);
      citizen.lifeEvents.push({ year: currentYear, label: `Obtention du diplôme et choix de carrière : ${citizen.profession}.` });
    } else if (age === 65) {
      citizen.profession = 'Retraité·e';
      citizen.lifeEvents.push({ year: currentYear, label: `Départ à la retraite à 65 ans.` });
    }

    // 3. Émigration (départ de la ville)
    if (age >= 18 && age <= 35 && rngChance(w, emigrationRate * 0.4)) {
      citizen.migratedOutYear = currentYear;
      citizen.lifeEvents.push({ year: currentYear, label: `Départ de Val-Ferrand vers une autre région.` });
      yearEmigrants++;
      continue;
    }

    // 4. Naissances (femmes/couples en âge d'avoir des enfants)
    if (age >= 20 && age <= 42 && rngChance(w, birthRate * 0.25)) {
      const childFirstName = rngPick(w, PEDESTRIAN_FIRST_NAMES);
      const childGenderRoll = rngNext(w);
      const childGender = childGenderRoll < 0.48 ? 'fille' : childGenderRoll < 0.96 ? 'garcon' : 'non-binaire';

      const child: MacroCitizenRecord = {
        id: `cit_${mw.citizens.length + 1}`,
        firstName: childFirstName,
        lastName: citizen.lastName,
        gender: childGender,
        birthYear: currentYear,
        district: citizen.district,
        profession: 'Élève / Étudiant·e',
        lifeEvents: [
          { year: currentYear, label: `Naissance à Val-Ferrand (${citizen.district}).` },
        ],
      };

      mw.citizens.push(child);
      citizen.lifeEvents.push({ year: currentYear, label: `Naissance d'un enfant (${childFirstName}).` });
      yearBirths++;
    }

    // 5. Création d'entreprise par des adultes entre 22 et 58 ans
    if (age >= 22 && age <= 58 && rngChance(w, 0.018)) {
      const sector = rngPick(w, BUSINESS_SECTORS);
      const district = citizen.district;
      const b: MacroBusinessRecord = {
        id: `biz_${mw.businesses.length + 1}`,
        name: `${sector} ${citizen.lastName}`,
        type: sector,
        district,
        founderId: citizen.id,
        foundedYear: currentYear,
        status: 'actif',
      };
      mw.businesses.push(b);
      citizen.lifeEvents.push({ year: currentYear, label: `Fondation de l'entreprise « ${b.name} » à ${district}.` });
      yearBusinessesCreated++;
    }
  }

  // --- Niveau N2 : Immigration (Nouveaux arrivants) ---
  const newImmigrantsCount = Math.floor(cityPopulation * immigrationRate * 0.15) + rngInt(w, 2, 8);
  for (let i = 0; i < newImmigrantsCount; i++) {
    const firstName = rngPick(w, PEDESTRIAN_FIRST_NAMES);
    const lastName = rngPick(w, PEDESTRIAN_LAST_NAMES);
    const genderRoll = rngNext(w);
    const gender = genderRoll < 0.48 ? 'fille' : genderRoll < 0.96 ? 'garcon' : 'non-binaire';

    const age = rngInt(w, 18, 50);
    const birthYear = currentYear - age;
    const district = rngPick(w, DISTRICTS);
    const profession = rngPick(w, PROFESSIONS);

    const immigrant: MacroCitizenRecord = {
      id: `cit_${mw.citizens.length + 1}`,
      firstName,
      lastName,
      gender,
      birthYear,
      district,
      profession,
      migratedInYear: currentYear,
      lifeEvents: [
        { year: birthYear, label: `Naissance.` },
        { year: currentYear, label: `Installation à Val-Ferrand dans le quartier ${district} (${profession}).` },
      ],
    };

    mw.citizens.push(immigrant);
    yearImmigrants++;
  }

  // --- Niveau N2 : Faillites & Fermetures d'entreprises ---
  const activeBusinesses = mw.businesses.filter((b) => b.status === 'actif');
  for (const biz of activeBusinesses) {
    const ageBiz = currentYear - biz.foundedYear;
    let closureChance = 0.035; // 3.5% par an
    if (ageBiz < 3) closureChance = 0.07; // PME vulnérables au début
    if (macroTrend.includes('recession') || macroTrend.includes('choc')) closureChance *= 1.8;

    if (rngChance(w, closureChance)) {
      biz.status = 'ferme';
      biz.closedYear = currentYear;
      yearBusinessesClosed++;

      const founder = mw.citizens.find((c) => c.id === biz.founderId);
      if (founder && !founder.deathYear) {
        founder.lifeEvents.push({ year: currentYear, label: `Cessation d'activité de l'entreprise « ${biz.name} ».` });
      }
    }
  }

  // Recalculer la population globale
  const finalPopulation = mw.citizens.filter((c) => !c.deathYear && !c.migratedOutYear).length;
  const finalActiveBusinesses = mw.businesses.filter((b) => b.status === 'actif').length;

  const yearHist: MacroYearHistory = {
    year: currentYear,
    populationTotal: finalPopulation,
    births: yearBirths,
    deaths: yearDeaths,
    immigrants: yearImmigrants,
    emigrants: yearEmigrants,
    netMigration: yearImmigrants - yearEmigrants,
    businessesActive: finalActiveBusinesses,
    businessesCreated: yearBusinessesCreated,
    businessesClosed: yearBusinessesClosed,
    macroTrend,
  };

  mw.history.push(yearHist);
  mw.totalBirths += yearBirths;
  mw.totalDeaths += yearDeaths;
  mw.totalImmigrants += yearImmigrants;
  mw.totalEmigrants += yearEmigrants;
  mw.totalBusinessesCreated += yearBusinessesCreated;
  mw.totalBusinessesClosed += yearBusinessesClosed;
  mw.totalYearsSimulated += 1;
  mw.currentYear += 1;

  return yearHist;
}

/**
 * Extrait 20 biographies de citoyens de façon reproductible (déterministe).
 */
export function extract20Biographies(w: WorldState): MacroBiography[] {
  const mw = ensureMacroWorld(w);
  const citizens = mw.citizens;
  if (citizens.length === 0) return [];

  const biographies: MacroBiography[] = [];

  // Sélectionner 20 citoyens régulièrement espacés à travers la liste complète
  const count = 20;
  const step = Math.max(1, Math.floor(citizens.length / count));

  for (let i = 0; i < count; i++) {
    const idx = Math.min((i * step + rngInt(w, 0, Math.max(0, step - 1))) % citizens.length, citizens.length - 1);
    const citizen = citizens[idx]!;
    const name = `${citizen.firstName} ${citizen.lastName}`;

    const summaryParts = [
      `${name}, né·e en ${citizen.birthYear}, habitant·e du quartier ${citizen.district}.`,
      `Metier exercé : ${citizen.profession}.`,
    ];

    if (citizen.migratedInYear) {
      summaryParts.push(`Installé·e à Val-Ferrand en ${citizen.migratedInYear}.`);
    }
    if (citizen.migratedOutYear) {
      summaryParts.push(`A quitté la ville en ${citizen.migratedOutYear}.`);
    }
    if (citizen.deathYear) {
      summaryParts.push(`Décédé·e en ${citizen.deathYear} à l'âge de ${citizen.deathYear - citizen.birthYear} ans.`);
    } else {
      summaryParts.push(`Toujours présent·e dans la mémoire de Val-Ferrand.`);
    }

    biographies.push({
      citizenId: citizen.id,
      name,
      birthYear: citizen.birthYear,
      deathYear: citizen.deathYear,
      profession: citizen.profession,
      summary: summaryParts.join(' '),
      timeline: [...citizen.lifeEvents].sort((a, b) => a.year - b.year),
    });
  }

  mw.biographies = biographies;
  return biographies;
}

/**
 * Lance la simulation sur 100 ans complets (2020 → 2120) et mesure le temps et la mémoire.
 */
export function simulate100Years(w: WorldState): MacroWorldState {
  const startMs = typeof performance !== 'undefined' ? performance.now() : 0;
  const getMem = () => {
    if (typeof process !== 'undefined' && 'memoryUsage' in process && typeof (process as unknown as { memoryUsage: () => { heapUsed: number; rss: number } }).memoryUsage === 'function') {
      return (process as unknown as { memoryUsage: () => { heapUsed: number; rss: number } }).memoryUsage();
    }
    return { heapUsed: 0, rss: 0 };
  };
  const startMem = getMem();

  const mw = ensureMacroWorld(w);
  mw.citizens = [];
  mw.businesses = [];
  mw.history = [];
  mw.biographies = [];
  mw.totalBirths = 0;
  mw.totalDeaths = 0;
  mw.totalImmigrants = 0;
  mw.totalEmigrants = 0;
  mw.totalBusinessesCreated = 0;
  mw.totalBusinessesClosed = 0;
  mw.totalYearsSimulated = 0;
  mw.currentYear = 2020;
  mw.startYear = 2020;

  initMacroPopulation(w);

  for (let year = 2020; year < 2120; year++) {
    simulateMacroWorldYear(w);
  }

  extract20Biographies(w);

  const endMs = typeof performance !== 'undefined' ? performance.now() : 0;
  const endMem = getMem();

  const performanceMetrics: MacroWorldPerformance = {
    runtimeMs: Math.round(Math.max(0, endMs - startMs) * 100) / 100,
    heapUsedMB: Math.round((Math.max(0, endMem.heapUsed - startMem.heapUsed) / (1024 * 1024)) * 100) / 100,
    rssMB: Math.round((endMem.rss / (1024 * 1024)) * 100) / 100,
  };

  mw.performance = performanceMetrics;
  return mw;
}
