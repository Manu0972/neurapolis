/**
 * NEURAPOLIS — Définitions des types du Monde Étendu (N0 à N4) & Budgets.
 *
 * Ce fichier définit les contrats de données TypeScript purs pour la modélisation
 * multi-échelle à 5 niveaux, les invariants de conservation et les budgets de simulation.
 *
 * Note : Conformément aux spécifications du lot Monde 1/6, ces types ne sont PAS
 * branchés directement sur WorldState afin d'éviter toute rupture de schéma ou migration prématurée.
 */

// ============================================================================
// 1. NIVEAU N0 — MONDE (MACRO-ENVIRONNEMENT & CHRONOLOGIE 2025–2045)
// ============================================================================

export type CommodityType = 'energie' | 'cereales' | 'composants' | 'materiaux';

export interface WorldCommodityMarket {
  commodity: CommodityType;
  basePrice: number;
  currentPrice: number;
  volatility: number; // 0.00 to 1.00
  trend: 'hausse' | 'baisse' | 'stable';
}

export interface MacroWorldEvent {
  id: string;
  year: number; // 2025 à 2045
  title: string;
  description: string;
  impacts: {
    inflationRateDelta: number;
    commodityPriceModifiers: Partial<Record<CommodityType, number>>;
    globalDemandModifier: number;
  };
}

export interface MacroWorldState {
  currentYear: number;
  globalInflationRate: number; // e.g. 0.025 pour 2.5%
  markets: Record<CommodityType, WorldCommodityMarket>;
  activeWorldEvents: MacroWorldEvent[];
}

// ============================================================================
// 2. NIVEAU N1 — PAYS (INSTITUTIONS, FISCALITÉ & SOUVERAINETÉ)
// ============================================================================

export interface TaxPolicy {
  corporateTaxRate: number;     // Impôt sur les sociétés (ex. 0.25)
  vatRate: number;               // TVA (ex. 0.20)
  socialContributionRate: number;// Cotisations sociales (ex. 0.35)
  carbonTaxPerTon: number;       // Taxe carbone (€/tonne)
}

export interface CentralBankPolicy {
  keyInterestRate: number;       // Taux directeur (ex. 0.035)
  reserveRequirementRatio: number;// Taux de réserve obligatoire
  inflationTarget: number;       // Cible d'inflation (ex. 0.02)
}

export interface CountryState {
  id: string;
  name: string;
  currencySymbol: string;
  taxPolicy: TaxPolicy;
  centralBank: CentralBankPolicy;
  publicInfrastructuresLevel: number; // 0-100
}

// ============================================================================
// 3. NIVEAU N2 — VILLES & COHORTES (AGRÉGATS STATISTIQUES URBAINS)
// ============================================================================

export type SocioEconomicCategory =
  | 'etudiants'
  | 'ouvriers'
  | 'artisans_commercants'
  | 'cadres_professionnels'
  | 'retraites';

export interface DemographicCohort {
  id: string;
  districtId: string;
  category: SocioEconomicCategory;
  populationCount: number;
  averageIncome: number;          // Revenu moyen mensuel (€)
  purchasingPowerIndex: number;   // 0.0 à 2.0 (1.0 = baseline)
  employmentRate: number;         // 0.0 à 1.0
  satisfactionIndex: number;      // 0 à 100
}

export interface CityState {
  id: string;
  name: string;
  totalPopulation: number;
  unemploymentRate: number;
  averageQualityOfLife: number;
  cohorts: DemographicCohort[];
}

// ============================================================================
// 4. NIVEAU N3 — AGENTS PROCHES DU JOUEUR (PNJ NOMMÉS)
// ============================================================================

export interface AgentRelation4D {
  amitie: number;    // -100 à 100
  confiance: number;  // 0 à 100
  respect: number;    // 0 à 100
  rivalite: number;   // 0 à 100
}

export interface AgentRoutineSlot {
  startHour: number;  // 0 à 23
  endHour: number;    // 0 à 23
  locationId: string;
  activityLabel: string;
}

export interface DetailedAgentState {
  id: string;
  fullName: string;
  age: number;
  role: string;
  assignedDistrictId: string;
  cohortId: string;
  relationsWithPlayer: AgentRelation4D;
  needs: {
    fatigue: number;
    faim: number;
    stress: number;
    moral: number;
  };
  routine: AgentRoutineSlot[];
  memoryEvents: string[]; // IDs des événements récents vécus
}

// ============================================================================
// 5. NIVEAU N4 — INDIVIDUS GÉNÉRÉS À LA DEMANDE (PASSANTS ÉPHÉMÈRES)
// ============================================================================

export interface OnDemandAgentDef {
  ephemeralId: string;
  seed: number;
  derivedCohortId: string;
  visualAppearance: {
    skinTone: string;
    clothingStyle: string;
    primaryColor: string;
  };
  currentActivity: string;
  spendingBudget: number; // Budget disponible pour un achat impulsif (€)
}

export interface AgentGenerationContext {
  districtId: string;
  timeOfDayTick: number;
  rngSeed: number;
  densityFactor: number; // Multiplicateur de fréquentation
}

// ============================================================================
// 6. INVARIANTS DE CONSERVATION
// ============================================================================

export interface PopulationLedger {
  totalCityPopulation: number;
  cohortSum: number;
  namedAgentCount: number;
  instantiatedEphemeralCount: number;
  birthsToday: number;
  deathsToday: number;
  netMigrationToday: number;
  isBalanced: boolean;
}

export interface CurrencyLedgerEntry {
  timestampTick: number;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  category: 'transaction' | 'salaire' | 'taxe' | 'pret' | 'injection_banque_centrale';
}

export interface CurrencyLedger {
  totalMoneySupply: number;
  playerBalance: number;
  namedNpcBalanceSum: number;
  businessTreasurySum: number;
  cohortSavingsSum: number;
  publicSectorBalance: number;
  unbalancedDiscrepancy: number; // Doit rester strictement égal à 0
}

export interface CommodityLedger {
  commodity: CommodityType;
  initialStock: number;
  producedUnits: number;
  importedUnits: number;
  consumedUnits: number;
  wastedUnits: number;
  exportedUnits: number;
  finalStock: number;
  conservationError: number; // Doit être 0
}

export interface ConservationInvariants {
  population: PopulationLedger;
  currency: CurrencyLedger;
  commodities: Record<CommodityType, CommodityLedger>;
}

// ============================================================================
// 7. BUDGETS DE PERFORMANCE & STRATÉGIES MÉMOIRE
// ============================================================================

export interface SimulationTimeBudgets {
  maxTickDurationMs: number;          // Target: < 0.8ms, Max: 2.0ms
  maxDailyAggregationDurationMs: number; // Target: < 8.0ms, Max: 15.0ms
}

export interface MemoryBudgets {
  maxHeapMemoryMb: number;            // Target: < 90MB, Max: 150MB
  maxSaveFileSizeKb: number;          // Target: < 300KB, Max: 1000KB (1MB)
  maxEphemeralAgentPoolSize: number;  // Max agents N4 concourants en mémoire (ex. 50)
}

export interface WorldPerformanceBudget {
  timeLimits: SimulationTimeBudgets;
  memoryLimits: MemoryBudgets;
}

// ============================================================================
// 8. INTERFACE JEU PALIERS 5 ET 6 (CONGLOMÉRAT & EXPANSION)
// ============================================================================

export interface ConglomerateSubsidiary {
  id: string;
  name: string;
  targetCityId: string;
  sector: 'commerce' | 'industrie' | 'services' | 'infrastructures';
  marketShare: number;      // 0.0 à 1.0 (0% à 100%)
  valuation: number;        // Valeur estimée de la filiale (€)
  monthlyRevenue: number;
  employeeCohortCount: number;
}

export interface Tier5RegionalState {
  conglomerateName: string;
  holdingTreasury: number;
  subsidiaries: ConglomerateSubsidiary[];
  unlockedCities: string[]; // ['neo_baie', 'plateau_blanc', 'ile_saphir', 'delta_9']
  activeMarketingCampaigns: Array<{
    targetCohortId: string;
    budgetMonthly: number;
    impactOnDemand: number;
  }>;
}

export interface Tier6GlobalState {
  globalInfluenceScore: number; // 0 à 100
  activeLobbyingDirectives: Array<{
    targetPolicyKey: keyof TaxPolicy;
    desiredDirection: 'hausse' | 'baisse';
    allocatedBudget: number;
  }>;
  macroDoctrinalStance: 'marche' | 'communs' | 'autorite' | 'solidarite';
  rawMaterialConscessions: CommodityType[];
}

export interface Tier5_6_WorldInterface {
  tier5: Tier5RegionalState;
  tier6: Tier6GlobalState;
}
