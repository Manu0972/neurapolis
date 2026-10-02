/**
 * NEURAPOLIS — Dynamic City Modification & Participatory Governance Type Contracts.
 * Couche : core/ (Types stricts, 100% sérialisables, sans fonctions ni dépendances DOM).
 *
 * Exigences Axis 3 :
 * - Cohortes citoyennes : jeunes, commerçants, retraités, écologistes
 * - 4 Doctrines d'aménagement : libérale/marché, socialiste/commune, communs/ostrom, productiviste/taylor
 * - Phases de budget participatif : délibération, vote, allocation, réalisation
 * - Chantiers de rénovation urbaine : façades, toits végétalisés, friches, voies piétonnes, canal
 * - Déverrouillage progressif de quartiers : roses, docks, hauts, bassin, caves, tramway
 */

// ============================================================================
// 1. Identifiants et Clés Fondamentales
// ============================================================================

/** Identifiants des quartiers de Val-Ferrand. */
export type DistrictId = 'roses' | 'docks' | 'hauts' | 'bassin' | 'caves' | 'tramway';

/** Identifiants des cohortes citoyennes votantes. */
export type CohortId = 'jeunes' | 'commercants' | 'retraites' | 'ecologistes';

/**
 * 4 Doctrines d'aménagement urbain influençant la ville et les votes :
 * - liberale_marche : Vitalité commerciale, étals libres, attractivité marchande (Smith)
 * - socialiste_commune : Espaces publics partagés, gratuité, bien-être ouvrier (Marx)
 * - communs_ostrom : Gestion collective des ressources, écologie, autogestion (Ostrom)
 * - productiviste_taylor : Optimisation des flux, standardisation, efficience (Taylor)
 */
export type UrbanDoctrineKey =
  | 'liberale_marche'
  | 'socialiste_commune'
  | 'communs_ostrom'
  | 'productiviste_taylor';

/** Typologies de chantiers de rénovation urbaine. */
export type RenovationType =
  | 'facades'
  | 'toits_vegetalises'
  | 'friches'
  | 'voies_pietonnes'
  | 'canal';

/** États du cycle de vie d'un chantier. */
export type WorksiteStatus = 'planifie' | 'en_cours' | 'termine' | 'suspendu';

/** Phases du cycle de budget participatif. */
export type BudgetPhase = 'deliberation' | 'vote' | 'allocation' | 'realisation';

/** Catégories de projets citoyens soumis au vote. */
export type ProjectCategory =
  | 'environnement'
  | 'patrimoine'
  | 'mobilites'
  | 'solidarite'
  | 'economie'
  | 'enfance';

// ============================================================================
// 2. Cohortes Citoyennes & Délibération
// ============================================================================

/** Structure d'une cohorte citoyenne votante. */
export interface CitizenCohort {
  readonly id: CohortId;
  name: string;
  size: number; // Volume de citoyens représentés (poids électoral)
  mobilizationRate: number; // Taux de participation au vote [0.0, 1.0]
  preferences: Record<UrbanDoctrineKey, number>; // Affinité doctrinale [-1.0, +1.0]
  concerns: string[]; // Thématiques prioritaires (ex: 'climat', 'loyers', 'circulation')
  satisfaction: number; // Satisfaction globale actuelle de la cohorte [0, 100]
}

/** Types d'actions de délibération citoyenne. */
export type DeliberationActionType =
  | 'reunion_publique'
  | 'tracts_citoyens'
  | 'radio_debat'
  | 'plaidoirie_fantome'
  | 'atelier_concertation';

/** Historique d'une délibération citoyenne. */
export interface DeliberationLogEntry {
  day: number;
  actionType: DeliberationActionType;
  description: string;
  targetCohort?: CohortId;
  targetProjectId?: string;
  ghostId?: string;
  mobilizationDelta: Partial<Record<CohortId, number>>;
  preferenceDelta: Partial<Record<CohortId, Partial<Record<UrbanDoctrineKey, number>>>>;
}

/** État du sous-système de délibération. */
export interface DeliberationState {
  logs: DeliberationLogEntry[];
  consensusScore: number; // Degré de consensus citoyen [0, 100]
  activeDebateTopics: string[];
}

// ============================================================================
// 3. Projets et Budget Participatif
// ============================================================================

/** Impacts systémiques promis par un projet lauréat. */
export interface ProjectImpacts {
  moraleDelta: number; // Impact sur le moral du quartier (-20 à +30)
  attractivenessDelta: number; // Impact sur l'attractivité (-20 à +30)
  civicEngagementDelta: number; // Impact sur l'engagement civique (+1 à +25)
  vitaliteBonus?: number; // Bonus direct à la vitalité des commerces
  confianceBonus?: number; // Bonus direct à la confiance citoyenne
  parkBonus?: number; // Fréquentation du parc / espaces publics
}

/** Définition d'un projet soumis au budget participatif. */
export interface ParticipatoryProjectDef {
  readonly id: string;
  title: string;
  description: string;
  districtId: DistrictId;
  category: ProjectCategory;
  costEuros: number; // Coût d'investissement en euros
  workHoursNeeded: number; // Heures de chantier requises
  materialsNeeded: number; // Unités de matériaux requises
  doctrine: UrbanDoctrineKey;
  authorCohort?: CohortId;
  proponentGhost?: string; // Fantôme soutenant le projet (smith, marx, ostrom, taylor, keynes)
  impacts: ProjectImpacts;
  votesReceived: Record<CohortId, number>; // Voix récoltées par cohorte lors du scrutin
  advocacyBonus: Record<CohortId, number>; // Bonus de campagne accumulé par cohorte [0, 100]
  computedScore: number; // Score net final calculé selon la formule déterministe
  status: 'soumis' | 'delibere' | 'laureat' | 'rejete';
}

/** Résumé archivé d'un cycle budgétaire annuel. */
export interface BudgetCycleSummary {
  cycleNumber: number;
  year: number;
  totalVotesCast: number;
  envelopeAllocated: number;
  envelopeSpent: number;
  winningProjectIds: string[];
  winningDoctrine: UrbanDoctrineKey;
  cohortParticipation: Record<CohortId, number>;
}

/** État complet du Budget Participatif. */
export interface ParticipatoryBudgetState {
  cycleNumber: number;
  phase: BudgetPhase;
  daysRemainingInPhase: number;
  phaseDurationDays: Record<BudgetPhase, number>;
  totalEnvelopeEuros: number; // Enveloppe financière globale allouée pour l'année
  spentEnvelopeEuros: number;
  submittedProjects: ParticipatoryProjectDef[];
  winningProjectIds: string[];
  history: BudgetCycleSummary[];
}

// ============================================================================
// 4. Chantiers de Rénovation et Déverrouillage de Quartiers
// ============================================================================

/** Détails esthétiques et visuels d'une rénovation. */
export interface AestheticDetails {
  primaryPalette: string[];
  visualFlags: string[]; // ex: ['facade_brique_terracotta', 'lampions_dores', 'fresque_murale']
  summaryDescription: string;
}

/** État d'un chantier de rénovation urbaine. */
export interface WorksiteState {
  readonly id: string;
  name: string;
  description: string;
  districtId: DistrictId;
  type: RenovationType;
  status: WorksiteStatus;
  progressPct: number; // [0, 100]
  workHoursInvested: number;
  workHoursNeeded: number;
  materialsSupplied: number;
  materialsNeeded: number;
  craftSkillsApplied: Record<string, number>; // ex: { technique: 2, organisation: 1 }
  volunteersActive: number; // Citoyens bénévoles actifs sur le chantier
  doctrineAffinity: UrbanDoctrineKey;
  associatedProjectId?: string; // Lien optionnel vers un projet du budget participatif
  startedDay?: number;
  completedDay?: number;
  aesthetic: AestheticDetails;
  permanentBonus: {
    vitaliteBonus: number;
    confianceBonus: number;
    moralBonus: number;
    parkBonus: number;
    attractivenessBonus: number;
  };
}

/** Conditions requises pour déverrouiller un quartier. */
export interface DistrictUnlockRequirements {
  minReputation: number;
  minConfianceQuartier: number;
  minVitaliteEpicerie: number;
  costEuros: number;
  requiredCompletedWorksites: string[];
  requiredSkill?: { skillId: string; minLevel: number };
}

/** État d'un quartier au sein de la gouvernance urbaine. */
export interface DistrictUnlockState {
  readonly districtId: DistrictId;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedDay?: number;
  requirements: DistrictUnlockRequirements;
  vitality: number; // [0, 100]
  attractiveness: number; // [0, 100]
  civicEngagement: number; // [0, 100]
  ambientKelvin: number; // Température lumineuse (ex: 1800)
  activeWorksiteIds: string[];
  completedWorksiteIds: string[];
}

// ============================================================================
// 5. Métriques Globales et Conteneur d'État
// ============================================================================

/** Métriques agrégées de la ville. */
export interface CityMetrics {
  overallCivicEngagement: number; // Engagement civique moyen [0, 100]
  globalAttractiveness: number; // Attractivité touristique et résidentielle [0, 100]
  collectiveMorale: number; // Moral moyen de la population [0, 100]
  ecologicalTransition: number; // Niveau de transition écologique [0, 100]
  socialCohesion: number; // Cohésion et solidarité entre cohortes [0, 100]
  dominantDoctrine: UrbanDoctrineKey;
}

/**
 * Conteneur d'état complet de la gouvernance et de la transformation urbaine.
 * Sérialisable dans WorldState ou manipulable en module headless indépendant.
 */
export interface CityGovernanceState {
  budget: ParticipatoryBudgetState;
  cohorts: Record<CohortId, CitizenCohort>;
  deliberation: DeliberationState;
  districts: Record<DistrictId, DistrictUnlockState>;
  worksites: Record<string, WorksiteState>;
  metrics: CityMetrics;
}

// ============================================================================
// 6. Métadonnées et Rapports Pures de Consultation
// ============================================================================

export interface UrbanDoctrineMeta {
  readonly key: UrbanDoctrineKey;
  readonly name: string;
  readonly thinker: string;
  readonly philosophy: string;
  readonly aestheticStyle: string;
  readonly primaryBonusDescription: string;
  readonly coreValues: string[];
}

export interface CityAestheticReport {
  dominantDoctrine: UrbanDoctrineKey;
  activeVisualFlags: string[];
  unlockedDistrictsCount: number;
  totalWorksitesCompleted: number;
  totalWorksitesInProgress: number;
  districtSummaries: Array<{
    districtId: DistrictId;
    name: string;
    unlocked: boolean;
    attractiveness: number;
    aestheticSummary: string;
  }>;
}

export interface DistrictRenovationSummary {
  districtId: DistrictId;
  name: string;
  unlocked: boolean;
  attractiveness: number;
  civicEngagement: number;
  vitality: number;
  activeWorksites: WorksiteState[];
  completedWorksites: WorksiteState[];
  overallProgressPct: number;
}

export interface CohortSatisfactionReport {
  cohortId: CohortId;
  name: string;
  satisfaction: number;
  mobilizationRate: number;
  topPreferredDoctrine: UrbanDoctrineKey;
  topConcern: string;
}

export interface BudgetSummaryReport {
  cycleNumber: number;
  currentPhase: BudgetPhase;
  daysRemainingInPhase: number;
  envelopeTotal: number;
  envelopeSpent: number;
  submittedProjectsCount: number;
  winningProjectsCount: number;
  voterTurnoutPct: number;
}
