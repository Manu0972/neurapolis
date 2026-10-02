/**
 * NEURAPOLIS — Dynamic City Modification & Participatory Governance Simulation Engine.
 * Couche : simulation/ (Moteur pur, déterministe, headless, testable sous Vitest).
 *
 * Exigences Axis 3 :
 * 1. Formule déterministe de scrutin annuel pondéré :
 *    Score = sum(Cohorte * Poids * Préférence) - Coût
 * 2. 4 Doctrines d'aménagement influençant les priorités et les votes :
 *    - Libérale / Marché (Smith)
 *    - Socialiste / Commune (Marx)
 *    - Communs / Ostrom (Ostrom)
 *    - Productiviste / Taylorienne (Taylor)
 * 3. Cycle complet en 4 phases :
 *    - Délibération citoyenne (assemblées, tracts, radio pirate, plaidoiries fantômes)
 *    - Vote (scrutin pondéré par cohortes)
 *    - Allocation budgétaire (sélection gloutonne sous contrainte de budget)
 *    - Réalisation / Transformation (impacts sur le moral, l'engagement et l'attractivité)
 */

import type {
  BudgetCycleSummary,
  BudgetPhase,
  BudgetSummaryReport,
  CitizenCohort,
  CityGovernanceState,
  CityMetrics,
  CohortId,
  CohortSatisfactionReport,
  DeliberationActionType,
  DeliberationLogEntry,
  DistrictId,
  ParticipatoryBudgetState,
  ParticipatoryProjectDef,
  UrbanDoctrineKey,
  UrbanDoctrineMeta,
} from '../core/governance_types';
import type { WorldState } from '../core/types';
import { rngNext, rngRange } from '../core/rng';
import { pushEvent } from './events';

// ============================================================================
// 1. Constantes et Métadonnées des 4 Doctrines
// ============================================================================

export const URBAN_DOCTRINES: Record<UrbanDoctrineKey, UrbanDoctrineMeta> = {
  liberale_marche: {
    key: 'liberale_marche',
    name: 'Libérale / Dynamique Marchande',
    thinker: 'Adam Smith',
    philosophy: "Vitalité par l'initiative marchande, suppression des barrières, concurrence loyale et attractivité pour les chalands.",
    aestheticStyle: 'Boutiques ouvertes, étals modulaires en bois verni, vitrines étincelantes et lumière chaleureuse 1800K.',
    primaryBonusDescription: '+Vitalité de l’épicerie et des commerces de proximité, afflux de chalands extérieurs.',
    coreValues: ['commerce', 'attractivité', 'initiative_privée', 'concurrence'],
  },
  socialiste_commune: {
    key: 'socialiste_commune',
    name: 'Socialiste / Bien Communautaire',
    thinker: 'Karl Marx',
    philosophy: 'Réappropriation collective des espaces, cantines populaires, gratuité d’accès et dignité des travailleurs.',
    aestheticStyle: 'Briques rouges industrielles patinées, tables de banquet partagées, affiches sérigraphiées et auvents protecteurs.',
    primaryBonusDescription: '+Cohésion sociale, bien-être ouvrier, réduction du stress et accès solidaire aux biens essentiels.',
    coreValues: ['égalité', 'solidarité', 'foyer_ouvrier', 'gratuité'],
  },
  communs_ostrom: {
    key: 'communs_ostrom',
    name: 'Communs & Autogestion Citoyenne',
    thinker: 'Elinor Ostrom',
    philosophy: 'Gestion polycentrique par les usagers, préservation des ressources partagées, toitures vertes et chartes locales.',
    aestheticStyle: 'Végétalisation foisonnante, tonnelles en bois de réemploi, nichoirs, bacs potagers et composteurs de quartier.',
    primaryBonusDescription: '+Transition écologique, confiance citoyenne, préservation de l’eau et souveraineté nourricière.',
    coreValues: ['autogestion', 'biodiversité', 'charte_commune', 'écologie'],
  },
  productiviste_taylor: {
    key: 'productiviste_taylor',
    name: 'Productiviste & Organisation Rationnelle',
    thinker: 'Frederick Winslow Taylor',
    philosophy: 'Optimisation millimétrée des flux urbains, élimination des temps morts, logistique douce et standardisation.',
    aestheticStyle: 'Lignes au sol cannelées, mobilier urbain ergonomique et standardisé, quais de transbordement vélo-cargo ultra-efficaces.',
    primaryBonusDescription: '+Vitesse des livraisons locales, réduction des coûts d’infrastructure et ponctualité des services.',
    coreValues: ['efficience', 'standardisation', 'ponctualité', 'zéro_gaspillage'],
  },
};

/** Durée des phases en jours de jeu (Cycle complet = 30 jours). */
export const DEFAULT_PHASE_DURATIONS: Record<BudgetPhase, number> = {
  deliberation: 10,
  vote: 3,
  allocation: 2,
  realisation: 15,
};

/** Enveloppe annuelle citoyenne de départ (en euros). */
export const DEFAULT_ANNUAL_ENVELOPE = 500;

/** Coefficient de pénalité de coût dans la formule de scrutin. */
export const DEFAULT_COST_PENALTY_RATIO = 0.20;

// ============================================================================
// 2. Initialisation des Cohortes et Projets
// ============================================================================

/** Crée le panel représentatif des 4 cohortes citoyennes de Val-Ferrand. */
export function createDefaultCohorts(): Record<CohortId, CitizenCohort> {
  return {
    jeunes: {
      id: 'jeunes',
      name: 'Jeunesse & Collégiens',
      size: 120,
      mobilizationRate: 0.45,
      preferences: {
        liberale_marche: 0.15,
        socialiste_commune: 0.70,
        communs_ostrom: 0.60,
        productiviste_taylor: -0.35,
      },
      concerns: ['espaces_autonomes', 'stages_équitables', 'climat', 'culture_alternative'],
      satisfaction: 60,
    },
    commercants: {
      id: 'commercants',
      name: 'Commerçants & Artisans',
      size: 85,
      mobilizationRate: 0.65,
      preferences: {
        liberale_marche: 0.85,
        socialiste_commune: -0.45,
        communs_ostrom: 0.10,
        productiviste_taylor: 0.50,
      },
      concerns: ['chalandise', 'livraisons', 'stationnement_triporteurs', 'vitalite_epicerie'],
      satisfaction: 55,
    },
    retraites: {
      id: 'retraites',
      name: 'Retraités & Aînés des Cités',
      size: 140,
      mobilizationRate: 0.75,
      preferences: {
        liberale_marche: 0.15,
        socialiste_commune: 0.35,
        communs_ostrom: 0.45,
        productiviste_taylor: 0.30,
      },
      concerns: ['bancs_propres', 'tranquillité', 'mémoire_ouvrière', 'sécurité_piétonne'],
      satisfaction: 65,
    },
    ecologistes: {
      id: 'ecologistes',
      name: 'Collectifs Écologistes & Maraîchers',
      size: 95,
      mobilizationRate: 0.55,
      preferences: {
        liberale_marche: -0.55,
        socialiste_commune: 0.40,
        communs_ostrom: 0.95,
        productiviste_taylor: -0.65,
      },
      concerns: ['corridors_écologiques', 'zéro_pesticides', 'toitures_vertes', 'eau_du_canal'],
      satisfaction: 50,
    },
  };
}

/** Catalogue de projets d'aménagement soumis au vote du budget participatif. */
export function createDefaultProjectProposals(): ParticipatoryProjectDef[] {
  return [
    {
      id: 'proj_kiosque_musique',
      title: 'Kiosque à Musique & Lampions de la Place',
      description: 'Édification d’un kiosque hexagonal en chêne sur la place des Roses avec lampions dorés et bancs circulaires.',
      districtId: 'roses',
      category: 'patrimoine',
      costEuros: 180,
      workHoursNeeded: 120,
      materialsNeeded: 45,
      doctrine: 'communs_ostrom',
      authorCohort: 'retraites',
      proponentGhost: 'ostrom',
      impacts: {
        moraleDelta: 15,
        attractivenessDelta: 12,
        civicEngagementDelta: 8,
        confianceBonus: 10,
        parkBonus: 15,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
    {
      id: 'proj_rampe_triporteurs',
      title: 'Corridor Doux & Rampe de Triporteurs',
      description: 'Piste pavée dédiée aux vélos-cargos et triporteurs reliant l’épicerie Bertin aux venelles piétonnes sans encombrement.',
      districtId: 'roses',
      category: 'mobilites',
      costEuros: 210,
      workHoursNeeded: 140,
      materialsNeeded: 60,
      doctrine: 'productiviste_taylor',
      authorCohort: 'commercants',
      proponentGhost: 'taylor',
      impacts: {
        moraleDelta: 8,
        attractivenessDelta: 14,
        civicEngagementDelta: 10,
        vitaliteBonus: 12,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
    {
      id: 'proj_halles_marche_fermier',
      title: 'Auvent Marchand & Étals Libres des Roses',
      description: 'Installation d’un auvent crépi et bois accueillant les producteurs régionaux sans intermédiaire commercial.',
      districtId: 'roses',
      category: 'economie',
      costEuros: 230,
      workHoursNeeded: 150,
      materialsNeeded: 65,
      doctrine: 'liberale_marche',
      authorCohort: 'commercants',
      proponentGhost: 'smith',
      impacts: {
        moraleDelta: 10,
        attractivenessDelta: 18,
        civicEngagementDelta: 6,
        vitaliteBonus: 15,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
    {
      id: 'proj_toits_maraichers_hauts',
      title: 'Toitures Végétalisées & Bacs Partagés des Hauts',
      description: 'Aménagement des toits-terrasses des Hauts de Val-Ferrand avec potagers communautaires et ruches citoyennes.',
      districtId: 'hauts',
      category: 'environnement',
      costEuros: 250,
      workHoursNeeded: 160,
      materialsNeeded: 70,
      doctrine: 'communs_ostrom',
      authorCohort: 'ecologistes',
      proponentGhost: 'ostrom',
      impacts: {
        moraleDelta: 14,
        attractivenessDelta: 20,
        civicEngagementDelta: 15,
        parkBonus: 10,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
    {
      id: 'proj_cantine_populaire_friche',
      title: 'Cantine Solidaire & Four à Pain de la Friche',
      description: 'Réhabilitation de l’ancienne chaufferie en cuisine collective à prix libre pour les apprentis et les anciens.',
      districtId: 'bassin',
      category: 'solidarite',
      costEuros: 270,
      workHoursNeeded: 180,
      materialsNeeded: 85,
      doctrine: 'socialiste_commune',
      authorCohort: 'jeunes',
      proponentGhost: 'marx',
      impacts: {
        moraleDelta: 20,
        attractivenessDelta: 10,
        civicEngagementDelta: 18,
        confianceBonus: 15,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
    {
      id: 'proj_refection_berges_canal',
      title: 'Berges Vivantes & Quai des Péniches Solidaires',
      description: 'Rénovation des quais en blocs de granit avec anneaux d’amarrage, ponton associatif et éclairage nocturne doux.',
      districtId: 'docks',
      category: 'environnement',
      costEuros: 290,
      workHoursNeeded: 200,
      materialsNeeded: 90,
      doctrine: 'communs_ostrom',
      authorCohort: 'ecologistes',
      proponentGhost: 'ostrom',
      impacts: {
        moraleDelta: 16,
        attractivenessDelta: 22,
        civicEngagementDelta: 12,
        vitaliteBonus: 8,
      },
      votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
      computedScore: 0,
      status: 'soumis',
    },
  ];
}

/** Crée un état initial complet de gouvernance participative. */
export function createInitialGovernanceState(customEnvelope = DEFAULT_ANNUAL_ENVELOPE): CityGovernanceState {
  const cohorts = createDefaultCohorts();
  const submittedProjects = createDefaultProjectProposals();

  return {
    budget: {
      cycleNumber: 1,
      phase: 'deliberation',
      daysRemainingInPhase: DEFAULT_PHASE_DURATIONS.deliberation,
      phaseDurationDays: { ...DEFAULT_PHASE_DURATIONS },
      totalEnvelopeEuros: customEnvelope,
      spentEnvelopeEuros: 0,
      submittedProjects,
      winningProjectIds: [],
      history: [],
    },
    cohorts,
    deliberation: {
      logs: [],
      consensusScore: 50,
      activeDebateTopics: ['partage_espace_public', 'priorite_climat_vs_commerce'],
    },
    districts: {
      roses: {
        districtId: 'roses',
        name: 'Place des Roses & Centre Ancien',
        description: 'Cœur historique de Val-Ferrand, abritant l’épicerie Bertin, le collège et le Stand.',
        unlocked: true,
        unlockedDay: 0,
        requirements: {
          minReputation: 0,
          minConfianceQuartier: 0,
          minVitaliteEpicerie: 0,
          costEuros: 0,
          requiredCompletedWorksites: [],
        },
        vitality: 60,
        attractiveness: 55,
        civicEngagement: 50,
        ambientKelvin: 1800,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
      docks: {
        districtId: 'docks',
        name: 'Le Canal & Les Docks Désaffectés',
        description: 'Ancien port fluvial, berges moussues, péniches associatives et contrebande douce de café équitable.',
        unlocked: false,
        requirements: {
          minReputation: 50,
          minConfianceQuartier: 55,
          minVitaliteEpicerie: 45,
          costEuros: 80,
          requiredCompletedWorksites: [],
        },
        vitality: 35,
        attractiveness: 40,
        civicEngagement: 45,
        ambientKelvin: 2200,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
      hauts: {
        districtId: 'hauts',
        name: 'Les Hauts de Val-Ferrand',
        description: 'Cité résidentielle perchée, toits-terrasses, antennes de radio pirate et vue panoramique.',
        unlocked: false,
        requirements: {
          minReputation: 55,
          minConfianceQuartier: 60,
          minVitaliteEpicerie: 50,
          costEuros: 100,
          requiredCompletedWorksites: [],
        },
        vitality: 40,
        attractiveness: 48,
        civicEngagement: 55,
        ambientKelvin: 1900,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
      bassin: {
        districtId: 'bassin',
        name: 'Le Bassin Industriel Nord',
        description: 'Usines de briques reconverties, fablabs d’artisanat lourd, recycleries et friche Taret.',
        unlocked: false,
        requirements: {
          minReputation: 65,
          minConfianceQuartier: 60,
          minVitaliteEpicerie: 52,
          costEuros: 140,
          requiredCompletedWorksites: [],
          requiredSkill: { skillId: 'technique', minLevel: 2 },
        },
        vitality: 45,
        attractiveness: 38,
        civicEngagement: 60,
        ambientKelvin: 1750,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
      caves: {
        districtId: 'caves',
        name: 'Les Souterrains & Caves Voûtées',
        description: 'Passages secrets maçonnés reliant l’école, l’épicerie et les caves, marché clandestin de graines rares.',
        unlocked: false,
        requirements: {
          minReputation: 60,
          minConfianceQuartier: 65,
          minVitaliteEpicerie: 55,
          costEuros: 90,
          requiredCompletedWorksites: [],
          requiredSkill: { skillId: 'recherche', minLevel: 2 },
        },
        vitality: 30,
        attractiveness: 35,
        civicEngagement: 40,
        ambientKelvin: 1600,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
      tramway: {
        districtId: 'tramway',
        name: 'Ligne de Tramway / TER & Pôle d’Échange',
        description: 'Porte d’entrée ferroviaire de la métropole, navetteurs, fret vélo-cargo et transit rapide.',
        unlocked: false,
        requirements: {
          minReputation: 75,
          minConfianceQuartier: 70,
          minVitaliteEpicerie: 60,
          costEuros: 180,
          requiredCompletedWorksites: [],
        },
        vitality: 50,
        attractiveness: 65,
        civicEngagement: 50,
        ambientKelvin: 2000,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
      },
    },
    worksites: {},
    metrics: {
      overallCivicEngagement: 52,
      globalAttractiveness: 50,
      collectiveMorale: 60,
      ecologicalTransition: 45,
      socialCohesion: 55,
      dominantDoctrine: 'communs_ostrom',
    },
  };
}

// ============================================================================
// 3. Formule Déterministe de Scrutin Annuel Pondéré
// ============================================================================

/**
 * Calcule le soutien électoral d'une cohorte pour un projet donné.
 *
 * Déterminisme strict :
 * Voix = Cohorte.size * Cohorte.mobilization * PréférencePondérée * (1 + Campagne / 100)
 */
export function calculateCohortProjectSupport(
  cohort: CitizenCohort,
  project: ParticipatoryProjectDef,
): number {
  const doctrineAffinity = cohort.preferences[project.doctrine] ?? 0;
  // Affinité d'auteur : si le projet émane de la cohorte elle-même, bonus d'adhésion (+0.20)
  const authorBonus = project.authorCohort === cohort.id ? 0.20 : 0.0;
  const rawPreference = Math.max(-1.0, Math.min(1.0, doctrineAffinity + authorBonus));

  // Normalisation de la préférence [-1.0, +1.0] -> [0.0, 1.0]
  const normalizedPreference = (1.0 + rawPreference) / 2.0;

  // Bonus de campagne / plaidoyer accumulé pendant la délibération [0, 100] -> [1.0, 2.0]
  const advocacyFactor = 1.0 + Math.max(0, Math.min(100, project.advocacyBonus[cohort.id] ?? 0)) / 100.0;

  // Poids effectif de la cohorte (citoyens mobilisés)
  const mobilizedCitizens = cohort.size * Math.max(0.0, Math.min(1.0, cohort.mobilizationRate));

  // Voix attribuées
  const supportPoints = mobilizedCitizens * normalizedPreference * advocacyFactor;
  return Math.round(supportPoints * 10) / 10;
}

/**
 * Calcule le score global d'un projet selon la formule déterministe exigée :
 * Score = sum(Cohorte * Poids * Préférence) - Coût
 */
export function calculateProjectVoteScore(
  project: ParticipatoryProjectDef,
  cohorts: Record<CohortId, CitizenCohort>,
  costPenaltyRatio = DEFAULT_COST_PENALTY_RATIO,
): { totalScore: number; votesByCohort: Record<CohortId, number>; costPenalty: number } {
  const votesByCohort: Record<CohortId, number> = {
    jeunes: 0,
    commercants: 0,
    retraites: 0,
    ecologistes: 0,
  };

  let totalCohortSupport = 0;
  const cohortIds: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];

  for (const cid of cohortIds) {
    const cohort = cohorts[cid];
    if (cohort) {
      const support = calculateCohortProjectSupport(cohort, project);
      votesByCohort[cid] = support;
      totalCohortSupport += support;
    }
  }

  // Pénalité déterministe proportionnelle au coût
  const costPenalty = Math.round(project.costEuros * costPenaltyRatio * 10) / 10;
  const totalScore = Math.round((totalCohortSupport - costPenalty) * 10) / 10;

  return { totalScore, votesByCohort, costPenalty };
}

// ============================================================================
// 4. Délibération Citoyenne
// ============================================================================

/**
 * Action de Délibération : Assemblée publique / Réunion citoyenne de quartier.
 * Rapproche les citoyens, augmente le consensus et la mobilisation globale.
 */
export function holdTownHallMeeting(
  state: CityGovernanceState,
  currentDay: number,
  topic = 'Aménagement durable du quartier',
  prng?: { rng: number },
): DeliberationLogEntry {
  const variance = prng ? (rngNext(prng) - 0.5) * 0.02 : 0;
  const deltaMob = 0.05 + variance;

  const mobDelta: Partial<Record<CohortId, number>> = {};
  const cohortIds: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];

  for (const cid of cohortIds) {
    const cohort = state.cohorts[cid];
    if (cohort) {
      cohort.mobilizationRate = Math.max(0.1, Math.min(1.0, cohort.mobilizationRate + deltaMob));
      mobDelta[cid] = Math.round(deltaMob * 100) / 100;
    }
  }

  state.deliberation.consensusScore = Math.min(100, state.deliberation.consensusScore + 5);

  const entry: DeliberationLogEntry = {
    day: currentDay,
    actionType: 'reunion_publique',
    description: `Assemblée citoyenne sur le thème : « ${topic} ». Hausse de mobilisation générale (+5%).`,
    mobilizationDelta: mobDelta,
    preferenceDelta: {},
  };

  state.deliberation.logs.unshift(entry);
  if (state.deliberation.logs.length > 50) state.deliberation.logs.length = 50;

  return entry;
}

/**
 * Action de Délibération : Campagne de tracts citoyens ciblée sur une cohorte.
 * Augmente le bonus d'adhésion pour un projet et infléchit légèrement la doctrine.
 */
export function distributeCitizenPamphlets(
  state: CityGovernanceState,
  projectId: string,
  targetCohortId: CohortId,
  currentDay: number,
): DeliberationLogEntry | null {
  const project = state.budget.submittedProjects.find((p) => p.id === projectId);
  const cohort = state.cohorts[targetCohortId];
  if (!project || !cohort) return null;

  // Augmente le bonus d'adhésion pour ce projet auprès de la cohorte ciblée
  const currentAdvocacy = project.advocacyBonus[targetCohortId] ?? 0;
  project.advocacyBonus[targetCohortId] = Math.min(100, currentAdvocacy + 25);

  // Infléchit positivement la doctrine du projet chez la cohorte
  const currentPref = cohort.preferences[project.doctrine] ?? 0;
  cohort.preferences[project.doctrine] = Math.max(-1.0, Math.min(1.0, currentPref + 0.08));

  const entry: DeliberationLogEntry = {
    day: currentDay,
    actionType: 'tracts_citoyens',
    targetCohort: targetCohortId,
    targetProjectId: projectId,
    description: `Distribution de tracts pour « ${project.title} » auprès des ${cohort.name} (+25% d'adhésion).`,
    mobilizationDelta: { [targetCohortId]: 0.02 },
    preferenceDelta: {
      [targetCohortId]: { [project.doctrine]: 0.08 },
    },
  };

  cohort.mobilizationRate = Math.min(1.0, cohort.mobilizationRate + 0.02);
  state.deliberation.logs.unshift(entry);
  if (state.deliberation.logs.length > 50) state.deliberation.logs.length = 50;

  return entry;
}

/**
 * Action de Délibération : Émission de débat sur Radio Val-Ferrand 108.4 FM.
 * Fait progresser une doctrine dans l'opinion publique de toute la ville.
 */
export function broadcastPirateRadioDebate(
  state: CityGovernanceState,
  doctrine: UrbanDoctrineKey,
  currentDay: number,
): DeliberationLogEntry {
  const docMeta = URBAN_DOCTRINES[doctrine];
  const cohortIds: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];
  const prefDelta: Partial<Record<CohortId, Partial<Record<UrbanDoctrineKey, number>>>> = {};

  for (const cid of cohortIds) {
    const cohort = state.cohorts[cid];
    if (cohort) {
      const shift = cid === 'jeunes' || cid === 'ecologistes' ? 0.10 : 0.06;
      cohort.preferences[doctrine] = Math.max(-1.0, Math.min(1.0, (cohort.preferences[doctrine] ?? 0) + shift));
      prefDelta[cid] = { [doctrine]: shift };
    }
  }

  state.metrics.overallCivicEngagement = Math.min(100, state.metrics.overallCivicEngagement + 3);

  const entry: DeliberationLogEntry = {
    day: currentDay,
    actionType: 'radio_debat',
    description: `Grand débat diffusé sur 108.4 FM : « ${docMeta.name} — Penseur de référence : ${docMeta.thinker} ».`,
    mobilizationDelta: { jeunes: 0.03, ecologistes: 0.03 },
    preferenceDelta: prefDelta,
  };

  state.deliberation.logs.unshift(entry);
  if (state.deliberation.logs.length > 50) state.deliberation.logs.length = 50;

  return entry;
}

/**
 * Action de Délibération : Intervention et plaidoirie d'un Fantôme Conseiller.
 * Chaque penseur mobilise sa base naturelle et oriente le débat public.
 */
export function invokeGhostAdvocacy(
  state: CityGovernanceState,
  ghostId: string,
  targetProjectId: string,
  currentDay: number,
): DeliberationLogEntry | null {
  const project = state.budget.submittedProjects.find((p) => p.id === targetProjectId);
  if (!project) return null;

  let description = '';
  const mobDelta: Partial<Record<CohortId, number>> = {};
  const prefDelta: Partial<Record<CohortId, Partial<Record<UrbanDoctrineKey, number>>>> = {};

  switch (ghostId) {
    case 'smith': {
      // Smith séduit les commerçants et prône l'efficacité commerciale
      const c = state.cohorts.commercants;
      if (c) {
        c.mobilizationRate = Math.min(1.0, c.mobilizationRate + 0.10);
        c.preferences.liberale_marche = Math.min(1.0, (c.preferences.liberale_marche ?? 0) + 0.15);
        mobDelta.commercants = 0.10;
        prefDelta.commercants = { liberale_marche: 0.15 };
      }
      project.advocacyBonus.commercants = Math.min(100, (project.advocacyBonus.commercants ?? 0) + 30);
      description = `Adam Smith s’exprime : « La main invisible prospère là où les étals sont libres ! » Soutien massif des commerçants.`;
      break;
    }
    case 'marx': {
      // Marx enflamme la jeunesse et les ouvriers pour les biens communs collectifs
      const c = state.cohorts.jeunes;
      if (c) {
        c.mobilizationRate = Math.min(1.0, c.mobilizationRate + 0.12);
        c.preferences.socialiste_commune = Math.min(1.0, (c.preferences.socialiste_commune ?? 0) + 0.18);
        mobDelta.jeunes = 0.12;
        prefDelta.jeunes = { socialiste_commune: 0.18 };
      }
      project.advocacyBonus.jeunes = Math.min(100, (project.advocacyBonus.jeunes ?? 0) + 35);
      description = `Karl Marx harangue la jeunesse : « L’espace urbain appartient à ceux qui y vivent et travaillent ! »`;
      break;
    }
    case 'ostrom': {
      // Ostrom rallie écologistes et aînés autour des règles d'autogestion
      const cEco = state.cohorts.ecologistes;
      const cRet = state.cohorts.retraites;
      if (cEco) {
        cEco.mobilizationRate = Math.min(1.0, cEco.mobilizationRate + 0.12);
        cEco.preferences.communs_ostrom = Math.min(1.0, (cEco.preferences.communs_ostrom ?? 0) + 0.15);
        mobDelta.ecologistes = 0.12;
        prefDelta.ecologistes = { communs_ostrom: 0.15 };
      }
      if (cRet) {
        cRet.mobilizationRate = Math.min(1.0, cRet.mobilizationRate + 0.08);
        mobDelta.retraites = 0.08;
      }
      project.advocacyBonus.ecologistes = Math.min(100, (project.advocacyBonus.ecologistes ?? 0) + 30);
      project.advocacyBonus.retraites = Math.min(100, (project.advocacyBonus.retraites ?? 0) + 20);
      description = `Elinor Ostrom présente ses 8 principes : « Pas besoin de choisir entre l’État et le marché quand les habitants coopèrent. »`;
      break;
    }
    case 'taylor': {
      // Taylor optimise la rationalité du chantier et abaisse les surcoûts
      const c = state.cohorts.commercants;
      if (c) {
        c.preferences.productiviste_taylor = Math.min(1.0, (c.preferences.productiviste_taylor ?? 0) + 0.12);
        prefDelta.commercants = { productiviste_taylor: 0.12 };
      }
      // Taylor réduit le besoin en heures de 15% grâce à l'organisation
      project.workHoursNeeded = Math.max(20, Math.round(project.workHoursNeeded * 0.85));
      description = `Frederick Taylor analyse les flux : « En éliminant les gestes superflus, ce chantier économise 15% de temps ! »`;
      break;
    }
    case 'keynes': {
      // Keynes injecte un multiplicateur d'investissement citoyen (+50 € au budget)
      state.budget.totalEnvelopeEuros += 50;
      description = `John Maynard Keynes stimule la demande : « Investir aujourd’hui débloque la richesse de demain ! » Enveloppe +50 €.`;
      break;
    }
    default:
      return null;
  }

  const entry: DeliberationLogEntry = {
    day: currentDay,
    actionType: 'plaidoirie_fantome',
    ghostId,
    targetProjectId,
    description,
    mobilizationDelta: mobDelta,
    preferenceDelta: prefDelta,
  };

  state.deliberation.logs.unshift(entry);
  if (state.deliberation.logs.length > 50) state.deliberation.logs.length = 50;

  return entry;
}

// ============================================================================
// 5. Scrutin et Dépouillement
// ============================================================================

/**
 * Exécute la phase de vote annuel déterministe.
 * 1. Calcule les scores nets de chaque projet via la formule de scrutin pondéré.
 * 2. Ordonne les projets par score décroissant.
 * 3. Sélectionne les lauréats selon l'algorithme glouton sous contrainte d'enveloppe budgétaire.
 */
export function executeVotingPhase(
  state: CityGovernanceState,
  costPenaltyRatio = DEFAULT_COST_PENALTY_RATIO,
): ParticipatoryProjectDef[] {
  const projects = state.budget.submittedProjects;

  for (const project of projects) {
    const { totalScore, votesByCohort } = calculateProjectVoteScore(
      project,
      state.cohorts,
      costPenaltyRatio,
    );
    project.computedScore = totalScore;
    project.votesReceived = votesByCohort;
  }

  // Tri par score décroissant (en cas d'égalité, le moins cher passe d'abord)
  projects.sort((a, b) => {
    if (b.computedScore !== a.computedScore) {
      return b.computedScore - a.computedScore;
    }
    return a.costEuros - b.costEuros;
  });

  // Sélection gloutonne (Knapsack)
  let remainingBudget = state.budget.totalEnvelopeEuros;
  const winners: ParticipatoryProjectDef[] = [];
  const winningIds: string[] = [];

  for (const project of projects) {
    if (project.computedScore > 0 && remainingBudget >= project.costEuros) {
      project.status = 'laureat';
      remainingBudget -= project.costEuros;
      winners.push(project);
      winningIds.push(project.id);
    } else {
      project.status = 'rejete';
    }
  }

  state.budget.winningProjectIds = winningIds;
  state.budget.spentEnvelopeEuros = state.budget.totalEnvelopeEuros - remainingBudget;
  state.budget.phase = 'allocation';
  state.budget.daysRemainingInPhase = state.budget.phaseDurationDays.allocation;

  return winners;
}

// ============================================================================
// 6. Allocation Budgétaire et Impacts Systémiques
// ============================================================================

/**
 * Applique les impacts de l'allocation budgétaire :
 * - Ajuste la satisfaction et la fidélité de chaque cohorte
 * - Met à jour l'engagement civique et l'attractivité de la ville
 * - Détermine la doctrine dominante issue des urnes
 * - Crée l'archive historique du cycle
 */
export function executeAllocationPhase(
  state: CityGovernanceState,
  currentDay: number,
  worldState?: WorldState,
): BudgetCycleSummary {
  const winners = state.budget.submittedProjects.filter((p) => p.status === 'laureat');
  const cohortIds: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];

  // 1. Calcul du total des voix et de la participation
  let totalVotes = 0;
  const cohortPart: Record<CohortId, number> = {
    jeunes: 0,
    commercants: 0,
    retraites: 0,
    ecologistes: 0,
  };

  for (const cid of cohortIds) {
    const c = state.cohorts[cid];
    if (c) {
      const votes = c.size * c.mobilizationRate;
      cohortPart[cid] = Math.round(votes);
      totalVotes += votes;
    }
  }

  // 2. Détermination de la doctrine triomphante
  const doctrineVoteScores: Record<UrbanDoctrineKey, number> = {
    liberale_marche: 0,
    socialiste_commune: 0,
    communs_ostrom: 0,
    productiviste_taylor: 0,
  };

  for (const p of winners) {
    doctrineVoteScores[p.doctrine] += p.computedScore;
  }

  let topDoctrine: UrbanDoctrineKey = 'communs_ostrom';
  let maxDoctrineScore = -Infinity;
  for (const [key, score] of Object.entries(doctrineVoteScores)) {
    if (score > maxDoctrineScore) {
      maxDoctrineScore = score;
      topDoctrine = key as UrbanDoctrineKey;
    }
  }
  state.metrics.dominantDoctrine = topDoctrine;

  // 3. Impact sur la satisfaction des cohortes
  for (const cid of cohortIds) {
    const c = state.cohorts[cid];
    if (!c) continue;

    // A-t-elle vu l'un de ses projets de prédilection retenu ?
    const cohortWinner = winners.find((p) => p.authorCohort === cid || (c.preferences[p.doctrine] ?? 0) > 0.4);
    if (cohortWinner) {
      c.satisfaction = Math.min(100, c.satisfaction + 15);
      c.mobilizationRate = Math.min(1.0, c.mobilizationRate + 0.05);
    } else {
      c.satisfaction = Math.max(10, c.satisfaction - 8);
      c.mobilizationRate = Math.max(0.2, c.mobilizationRate - 0.03);
    }
  }

  // 4. Métriques globales de la ville
  const totalMoraleDelta = winners.reduce((acc, p) => acc + p.impacts.moraleDelta, 0);
  const totalAttractivenessDelta = winners.reduce((acc, p) => acc + p.impacts.attractivenessDelta, 0);
  const totalCivicDelta = winners.reduce((acc, p) => acc + p.impacts.civicEngagementDelta, 0);

  state.metrics.collectiveMorale = Math.max(0, Math.min(100, state.metrics.collectiveMorale + totalMoraleDelta));
  state.metrics.globalAttractiveness = Math.max(0, Math.min(100, state.metrics.globalAttractiveness + totalAttractivenessDelta));
  state.metrics.overallCivicEngagement = Math.max(0, Math.min(100, state.metrics.overallCivicEngagement + totalCivicDelta));

  // 5. Synchronisation WorldState optionnelle
  if (worldState) {
    worldState.district.confianceQuartier = Math.min(100, worldState.district.confianceQuartier + Math.round(totalCivicDelta / 2));
    worldState.player.needs.moral = Math.min(100, worldState.player.needs.moral + Math.round(totalMoraleDelta / 2));

    pushEvent(worldState, {
      type: 'quartier',
      title: 'Scrutin du Budget Participatif proclamé',
      text: `${winners.length} projet(s) lauréat(s) financé(s) pour ${state.budget.spentEnvelopeEuros} €. Doctrine triomphante : ${URBAN_DOCTRINES[topDoctrine].name}.`,
      causes: [
        { facteur: 'participation citoyenne', seuil: `${Math.round(totalVotes)} voix`, poids: 3 },
        { facteur: `doctrine ${topDoctrine}`, poids: 2 },
      ],
    });
  }

  // 6. Enregistrement de l'archive historique
  const summary: BudgetCycleSummary = {
    cycleNumber: state.budget.cycleNumber,
    year: 2020 + state.budget.cycleNumber - 1,
    totalVotesCast: Math.round(totalVotes),
    envelopeAllocated: state.budget.totalEnvelopeEuros,
    envelopeSpent: state.budget.spentEnvelopeEuros,
    winningProjectIds: [...state.budget.winningProjectIds],
    winningDoctrine: topDoctrine,
    cohortParticipation: cohortPart,
  };

  state.budget.history.unshift(summary);
  state.budget.phase = 'realisation';
  state.budget.daysRemainingInPhase = state.budget.phaseDurationDays.realisation;

  return summary;
}

// ============================================================================
// 7. Progression et Ticks du Cycle de Gouvernance
// ============================================================================

/**
 * Fait avancer le cycle de gouvernance urbaine d'un ou plusieurs jours.
 * Assure les transitions automatiques déterministes entre les 4 phases.
 */
export function tickGovernanceCycle(
  state: CityGovernanceState,
  daysElapsed: number,
  currentDay: number,
  worldState?: WorldState,
  prng?: { rng: number },
): { phaseChanged: boolean; newPhase: BudgetPhase } {
  let phaseChanged = false;
  state.budget.daysRemainingInPhase -= daysElapsed;

  if (state.budget.daysRemainingInPhase <= 0) {
    phaseChanged = true;
    switch (state.budget.phase) {
      case 'deliberation': {
        executeVotingPhase(state);
        break;
      }
      case 'vote': {
        executeAllocationPhase(state, currentDay, worldState);
        break;
      }
      case 'allocation': {
        state.budget.phase = 'realisation';
        state.budget.daysRemainingInPhase = state.budget.phaseDurationDays.realisation;
        break;
      }
      case 'realisation': {
        // Démarrage du cycle suivant (cycle annuel réinitialisé)
        state.budget.cycleNumber += 1;
        state.budget.phase = 'deliberation';
        state.budget.daysRemainingInPhase = state.budget.phaseDurationDays.deliberation;
        state.budget.spentEnvelopeEuros = 0;
        state.budget.winningProjectIds = [];

        // Réinitialisation des statuts de projets pour le nouveau scrutin
        for (const p of state.budget.submittedProjects) {
          p.status = 'soumis';
          p.computedScore = 0;
          p.votesReceived = { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 };
          p.advocacyBonus = { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 };
        }
        break;
      }
    }
  }

  return { phaseChanged, newPhase: state.budget.phase };
}

// ============================================================================
// 8. Fonctions de Consultation Pures
// ============================================================================

export function getGovernanceBudgetSummary(state: CityGovernanceState): BudgetSummaryReport {
  const totalPopulation = Object.values(state.cohorts).reduce((acc, c) => acc + c.size, 0);
  const totalVoters = Object.values(state.cohorts).reduce((acc, c) => acc + c.size * c.mobilizationRate, 0);
  const turnout = totalPopulation > 0 ? Math.round((totalVoters / totalPopulation) * 100) : 0;

  return {
    cycleNumber: state.budget.cycleNumber,
    currentPhase: state.budget.phase,
    daysRemainingInPhase: state.budget.daysRemainingInPhase,
    envelopeTotal: state.budget.totalEnvelopeEuros,
    envelopeSpent: state.budget.spentEnvelopeEuros,
    submittedProjectsCount: state.budget.submittedProjects.length,
    winningProjectsCount: state.budget.winningProjectIds.length,
    voterTurnoutPct: turnout,
  };
}

export function getCohortOpinions(state: CityGovernanceState): Record<CohortId, CohortSatisfactionReport> {
  const result: Record<CohortId, CohortSatisfactionReport> = {
    jeunes: {
      cohortId: 'jeunes',
      name: '',
      satisfaction: 0,
      mobilizationRate: 0,
      topPreferredDoctrine: 'socialiste_commune',
      topConcern: '',
    },
    commercants: {
      cohortId: 'commercants',
      name: '',
      satisfaction: 0,
      mobilizationRate: 0,
      topPreferredDoctrine: 'liberale_marche',
      topConcern: '',
    },
    retraites: {
      cohortId: 'retraites',
      name: '',
      satisfaction: 0,
      mobilizationRate: 0,
      topPreferredDoctrine: 'communs_ostrom',
      topConcern: '',
    },
    ecologistes: {
      cohortId: 'ecologistes',
      name: '',
      satisfaction: 0,
      mobilizationRate: 0,
      topPreferredDoctrine: 'communs_ostrom',
      topConcern: '',
    },
  };

  const cohortIds: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];

  for (const cid of cohortIds) {
    const c = state.cohorts[cid];
    if (!c) continue;

    let bestDoctrine: UrbanDoctrineKey = 'communs_ostrom';
    let maxAffinity = -Infinity;

    for (const [doc, val] of Object.entries(c.preferences)) {
      if (val > maxAffinity) {
        maxAffinity = val;
        bestDoctrine = doc as UrbanDoctrineKey;
      }
    }

    result[cid] = {
      cohortId: cid,
      name: c.name,
      satisfaction: Math.round(c.satisfaction),
      mobilizationRate: Math.round(c.mobilizationRate * 100) / 100,
      topPreferredDoctrine: bestDoctrine,
      topConcern: c.concerns[0] ?? 'vie_de_quartier',
    };
  }

  return result;
}
