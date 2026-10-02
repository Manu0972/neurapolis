/**
 * NEURAPOLIS — Ateliers Coopératifs Modulaires de la Friche Taret (Axis 4).
 * Couche : simulation/ (Moteur pur, déterministe, sans dépendances DOM).
 *
 * Exigences Axis 4 :
 * - 3 Modules : menuiserie, électronique, conserverie artisanale
 * - Formules déterministes de production :
 *     Production = f(heures, qualité_outils, solidarité, niveau_atelier, gouvernance)
 * - Usure des outils et maintenance déterministe
 * - Formation citoyenne et acquisition de compétences
 * - Répartition des surplus (règle Ostrom 50/30/20)
 * - Érosion de l'emprise du Drive par la durabilité et la réparation
 */

import type {
  CitizenTrainingRecord,
  WorkshopGovernanceMode,
  WorkshopModuleId,
  WorkshopModuleState,
  WorkshopRecipe,
  WorkshopsState,
} from '../core/simulation_extended_types';
import type { SkillId } from '../core/types';

// ============================================================================
// 1. Catalogue des Recettes et Projets Modulaires
// ============================================================================

export const WORKSHOP_RECIPES: Record<string, WorkshopRecipe> = {
  // --- Menuiserie ---
  banc_public: {
    id: 'banc_public',
    name: 'Banc Public en Bois de Réemploi',
    moduleId: 'menuiserie',
    description: 'Banc d’assise chaleureux pour les squares et venelles, assemblé sans clou jetable.',
    requiredLevel: 1,
    requiredHours: 6,
    requiredMaterials: 4,
    outputUnits: 1,
    durabilityScore: 4,
    valueEuros: 45,
    skillTarget: 'technique',
    skillXpGain: 20,
  },
  bacs_potagers: {
    id: 'bacs_potagers',
    name: 'Bacs Potagers Auto-Irrigués',
    moduleId: 'menuiserie',
    description: 'Jardinières de balcon et de trottoir avec réserve de pluie pour la verdure citoyenne.',
    requiredLevel: 1,
    requiredHours: 4,
    requiredMaterials: 3,
    outputUnits: 2,
    durabilityScore: 3,
    valueEuros: 30,
    skillTarget: 'organisation',
    skillXpGain: 15,
  },
  etals_marche: {
    id: 'etals_marche',
    name: 'Étal Forain Modulaire Pliant',
    moduleId: 'menuiserie',
    description: 'Comptoir de vente démontable en pin traité aux huiles naturelles pour le Stand des Roses.',
    requiredLevel: 2,
    requiredHours: 10,
    requiredMaterials: 8,
    outputUnits: 1,
    durabilityScore: 5,
    valueEuros: 90,
    skillTarget: 'technique',
    skillXpGain: 35,
  },
  huisseries_isolantes: {
    id: 'huisseries_isolantes',
    name: 'Double-Fenêtres Artisanales Thermiques',
    moduleId: 'menuiserie',
    description: 'Cadres isolants pour calfeutrer les vieilles bâtisses de la cité ouvrière.',
    requiredLevel: 3,
    requiredHours: 16,
    requiredMaterials: 12,
    outputUnits: 1,
    durabilityScore: 5,
    valueEuros: 160,
    skillTarget: 'technique',
    skillXpGain: 55,
  },

  // --- Électronique ---
  repair_petit_electromenager: {
    id: 'repair_petit_electromenager',
    name: 'Repair-Café : Grille-pain & Mixeurs',
    moduleId: 'electronique',
    description: 'Diagnostic, ressoudage des câbles et remplacement des condensateurs grillés.',
    requiredLevel: 1,
    requiredHours: 3,
    requiredMaterials: 2,
    outputUnits: 2,
    durabilityScore: 4,
    valueEuros: 25,
    skillTarget: 'technique',
    skillXpGain: 18,
  },
  reconditionnement_batteries: {
    id: 'reconditionnement_batteries',
    name: 'Pack Batteries Triporteur Reconditionné',
    moduleId: 'electronique',
    description: 'Tri des cellules lithium 18650 saines récupérées sur de vieilles trottinettes.',
    requiredLevel: 2,
    requiredHours: 8,
    requiredMaterials: 6,
    outputUnits: 1,
    durabilityScore: 4,
    valueEuros: 75,
    skillTarget: 'technique',
    skillXpGain: 30,
  },
  sauvetage_ordinateurs: {
    id: 'sauvetage_ordinateurs',
    name: 'PC Éco-Linux pour Écoliers',
    moduleId: 'electronique',
    description: 'Remise à neuf d’unités centrales bureautiques équipées de logiciels libres.',
    requiredLevel: 2,
    requiredHours: 7,
    requiredMaterials: 5,
    outputUnits: 1,
    durabilityScore: 4,
    valueEuros: 80,
    skillTarget: 'recherche',
    skillXpGain: 32,
  },
  stations_mesure_citoyennes: {
    id: 'stations_mesure_citoyennes',
    name: 'Balises Environnementales & Radio 108.4',
    moduleId: 'electronique',
    description: 'Sondes Arduino de qualité d’air et transmetteurs d’ondes libres pour la radio pirate.',
    requiredLevel: 3,
    requiredHours: 12,
    requiredMaterials: 9,
    outputUnits: 2,
    durabilityScore: 5,
    valueEuros: 130,
    skillTarget: 'recherche',
    skillXpGain: 50,
  },

  // --- Conserverie ---
  bocaux_legumes_invendus: {
    id: 'bocaux_legumes_invendus',
    name: 'Bocaux de Ratatouille Solidaire',
    moduleId: 'conserverie',
    description: 'Stérilisation des légumes maraîchers rescapés de l’épicerie Bertin.',
    requiredLevel: 1,
    requiredHours: 4,
    requiredMaterials: 3,
    outputUnits: 6,
    durabilityScore: 5,
    valueEuros: 18,
    skillTarget: 'organisation',
    skillXpGain: 16,
  },
  tisanes_bertin: {
    id: 'tisanes_bertin',
    name: 'Tisanes Séchées Prodigieuses',
    moduleId: 'conserverie',
    description: 'Mélange secret de menthe sauvage et racines des berges séchées à basse température.',
    requiredLevel: 1,
    requiredHours: 3,
    requiredMaterials: 2,
    outputUnits: 8,
    durabilityScore: 5,
    valueEuros: 20,
    skillTarget: 'recherche',
    skillXpGain: 18,
  },
  confitures_solidaires: {
    id: 'confitures_solidaires',
    name: 'Confitures Châtaignes & Baies Rouges',
    moduleId: 'conserverie',
    description: 'Chaudron en cuivre et sucre de canne équitable, le trésor du dimanche matin.',
    requiredLevel: 2,
    requiredHours: 6,
    requiredMaterials: 5,
    outputUnits: 8,
    durabilityScore: 4,
    valueEuros: 32,
    skillTarget: 'organisation',
    skillXpGain: 28,
  },
  conserves_longue_duree: {
    id: 'conserves_longue_duree',
    name: 'Réserves Alimentaires d’Hivernage',
    moduleId: 'conserverie',
    description: 'Compotes et soupes appertisées garantissant l’autonomie du quartier en saison froide.',
    requiredLevel: 3,
    requiredHours: 12,
    requiredMaterials: 10,
    outputUnits: 15,
    durabilityScore: 5,
    valueEuros: 65,
    skillTarget: 'organisation',
    skillXpGain: 45,
  },
};

// ============================================================================
// 2. Initialisation d'État
// ============================================================================

export function createInitialModuleState(id: WorkshopModuleId): WorkshopModuleState {
  return {
    id,
    unlocked: true,
    level: 1,
    toolCondition: 85,
    stockMaterials: 20,
    workforceHours: 0,
    maintenanceFund: 15,
    lastOutputUnits: 0,
    cumulativeProduced: 0,
  };
}

export function createInitialWorkshopsState(): WorkshopsState {
  return {
    active: true,
    governanceMode: 'autogestion_ostrom',
    modules: {
      menuiserie: createInitialModuleState('menuiserie'),
      electronique: createInitialModuleState('electronique'),
      conserverie: createInitialModuleState('conserverie'),
    },
    sharedTreasury: 60,
    freeRiderRisk: 12,
    citizenTraining: {},
    surplusReserve: 25,
    workerDividends: 35,
    communityRepairsCompleted: 0,
    driveCompetitivenessPenalty: 0,
  };
}

// ============================================================================
// 3. Formules Mathématiques Pures Déterministes
// ============================================================================

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

/**
 * Multiplicateur d'efficacité lié à l'état des outils (eta_outil).
 * Plafonné à 1.0, ne descend jamais sous 0.2 (même avec outils abîmés, un artisan se débrouille).
 */
export function computeToolEfficiency(toolCondition: number): number {
  return Math.max(0.2, Math.min(1.0, toolCondition / 100));
}

/**
 * Multiplicateur de gouvernance (gamma_gouvernance) :
 * - Ostrom : 1.20 si le risque de resquille est maîtrisé (<25), sinon 0.85 (démotivation collective).
 * - Artisans : 1.00 constant (démocratie de métier équilibrée).
 * - Taylor : 1.35 en cadence brute immédiate (au prix d'une forte usure ultérieure).
 */
export function computeGovernanceMultiplier(mode: WorkshopGovernanceMode, freeRiderRisk: number): number {
  switch (mode) {
    case 'autogestion_ostrom':
      return freeRiderRisk < 25 ? 1.2 : 0.85;
    case 'comite_artisans':
      return 1.0;
    case 'direction_taylorienne':
      return 1.35;
  }
}

/**
 * Formule déterministe de production d'un module d'atelier :
 * Production = floor( workforceHours * eta_outil * (1 + 0.25 * (level - 1)) * gamma_gouvernance * (1 + solidariteFactor) )
 *
 * Contrainte de matière : bornée par le stock de matériaux disponibles.
 */
export function calculateModuleProduction(
  module: WorkshopModuleState,
  governanceMode: WorkshopGovernanceMode,
  freeRiderRisk: number,
  solidarityIndex: number,
  recipe: WorkshopRecipe,
  hoursProvided: number,
): {
  unitsProduced: number;
  materialsConsumed: number;
  theoreticalOutput: number;
  toolEfficiency: number;
  governanceMultiplier: number;
} {
  if (module.level < recipe.requiredLevel || hoursProvided <= 0) {
    return {
      unitsProduced: 0,
      materialsConsumed: 0,
      theoreticalOutput: 0,
      toolEfficiency: computeToolEfficiency(module.toolCondition),
      governanceMultiplier: computeGovernanceMultiplier(governanceMode, freeRiderRisk),
    };
  }

  const etaOutil = computeToolEfficiency(module.toolCondition);
  const gammaGov = computeGovernanceMultiplier(governanceMode, freeRiderRisk);
  const levelMult = 1 + 0.25 * (module.level - 1);
  const solidariteFactor = Math.min(0.5, Math.max(0, solidarityIndex / 200));

  // Cadence théorique en ratio de complétion de la recette
  const batchRatio = hoursProvided / Math.max(1, recipe.requiredHours);
  const rawOutput = batchRatio * recipe.outputUnits * etaOutil * levelMult * gammaGov * (1 + solidariteFactor);
  const theoreticalOutput = Math.max(0, Math.floor(rawOutput));

  // Matériaux nécessaires proportionnels aux unités
  const materialsPerUnit = recipe.requiredMaterials / Math.max(1, recipe.outputUnits);
  const maxPossibleByMaterials = Math.floor(module.stockMaterials / Math.max(0.1, materialsPerUnit));

  const unitsProduced = Math.min(theoreticalOutput, maxPossibleByMaterials);
  const materialsConsumed = Math.ceil(unitsProduced * materialsPerUnit);

  return {
    unitsProduced,
    materialsConsumed,
    theoreticalOutput,
    toolEfficiency: etaOutil,
    governanceMultiplier: gammaGov,
  };
}

/**
 * Calcul déterministe de l'usure de l'outillage et application du fonds d'entretien :
 * Delta = -(baseWear + 0.4 * hours + extraTaylor) + floor(maintenanceFund / 2)
 */
export function calculateToolConditionDelta(
  toolCondition: number,
  hoursWorked: number,
  governanceMode: WorkshopGovernanceMode,
  maintenanceFund: number,
): {
  wearPoints: number;
  repairedPoints: number;
  netDelta: number;
  newCondition: number;
  maintenanceFundConsumed: number;
} {
  const baseWear = 8;
  const variableWear = 0.4 * hoursWorked;
  const taylorWearPenalty = governanceMode === 'direction_taylorienne' ? 15 : 0;
  const totalWear = baseWear + variableWear + taylorWearPenalty;

  // Chaque 2 € dans le fonds d'entretien réparent 1 point de condition d'outil
  const maxRepairPossible = Math.floor(maintenanceFund / 2);
  const deficit = 100 - (toolCondition - totalWear);
  const pointsToRepair = Math.min(maxRepairPossible, Math.max(0, deficit));
  const fundConsumed = pointsToRepair * 2;

  const netDelta = -totalWear + pointsToRepair;
  const newCondition = clamp(toolCondition + netDelta);

  return {
    wearPoints: totalWear,
    repairedPoints: pointsToRepair,
    netDelta,
    newCondition,
    maintenanceFundConsumed: fundConsumed,
  };
}

/**
 * Répartition des surplus selon la règle Elinor Ostrom (50/30/20) :
 * - 50 % réinvestis dans le fonds d'entretien et trésorerie partagée
 * - 30 % versés aux travailleurs/coopérateurs (dividendes solidaires)
 * - 20 % versés au fonds citoyen pour les projets de quartier
 */
export function calculateOstromSurplusSplit(grossValueEuros: number): {
  maintenanceShare: number;
  workerDividendsShare: number;
  neighborhoodSurplusShare: number;
} {
  const maintenanceShare = Math.round(grossValueEuros * 0.5 * 100) / 100;
  const workerDividendsShare = Math.round(grossValueEuros * 0.3 * 100) / 100;
  const neighborhoodSurplusShare = Math.round((grossValueEuros - maintenanceShare - workerDividendsShare) * 100) / 100;

  return {
    maintenanceShare,
    workerDividendsShare,
    neighborhoodSurplusShare,
  };
}

// ============================================================================
// 4. Moteur d'Exécution et Cycles de Production
// ============================================================================

export interface WorkshopCycleReport {
  moduleId: WorkshopModuleId;
  recipeId: string;
  hoursWorked: number;
  unitsProduced: number;
  materialsConsumed: number;
  grossValueEuros: number;
  toolConditionBefore: number;
  toolConditionAfter: number;
  maintenanceFundUsed: number;
  freeRiderRiskDelta: number;
  driveCompetitivenessPenaltyDelta: number;
  groceryVitalityDelta: number;
  surplusSplit: {
    maintenanceShare: number;
    workerDividendsShare: number;
    neighborhoodSurplusShare: number;
  };
}

/**
 * Exécute un cycle de production complet et met à jour l'état de manière atomique.
 */
export function runWorkshopCycle(
  state: WorkshopsState,
  moduleId: WorkshopModuleId,
  recipeId: string,
  hoursInvested: number,
  options?: {
    solidarityIndex?: number;
    npcTrainerId?: string;
  },
): WorkshopCycleReport {
  const mod = state.modules[moduleId];
  const recipe = WORKSHOP_RECIPES[recipeId];
  if (!recipe || recipe.moduleId !== moduleId) {
    throw new Error(`Recette inconnue ou incompatible avec le module ${moduleId}: ${recipeId}`);
  }

  const solidarity = options?.solidarityIndex ?? 50;
  const prod = calculateModuleProduction(
    mod,
    state.governanceMode,
    state.freeRiderRisk,
    solidarity,
    recipe,
    hoursInvested,
  );

  // Déduction des matériaux et mise à jour des compteurs
  mod.stockMaterials = Math.max(0, mod.stockMaterials - prod.materialsConsumed);
  mod.workforceHours += hoursInvested;
  mod.lastOutputUnits = prod.unitsProduced;
  mod.cumulativeProduced += prod.unitsProduced;

  // Usure et entretien
  const conditionBefore = mod.toolCondition;
  const wear = calculateToolConditionDelta(
    conditionBefore,
    hoursInvested,
    state.governanceMode,
    mod.maintenanceFund,
  );
  mod.toolCondition = wear.newCondition;
  mod.maintenanceFund = Math.max(0, mod.maintenanceFund - wear.maintenanceFundConsumed);

  // Valorisation économique et partage Ostrom
  const grossValue = prod.unitsProduced * recipe.valueEuros;
  const split = calculateOstromSurplusSplit(grossValue);

  mod.maintenanceFund += split.maintenanceShare;
  state.workerDividends += split.workerDividendsShare;
  state.surplusReserve += split.neighborhoodSurplusShare;
  state.sharedTreasury += Math.round(grossValue * 0.1 * 100) / 100;

  // Formation citoyenne si travailleur désigné
  let freeRiderDelta = 0;
  if (options?.npcTrainerId && hoursInvested > 0) {
    const trainRecord = trainCitizenInWorkshop(
      state,
      options.npcTrainerId,
      moduleId,
      hoursInvested,
      recipe.skillTarget,
      recipe.skillXpGain,
    );
    freeRiderDelta = trainRecord.freeRiderDelta;
  }

  // Érosion de la compétitivité du Drive (produits durables & réparations)
  let drivePenaltyDelta = 0;
  if (moduleId === 'electronique' && prod.unitsProduced > 0) {
    state.communityRepairsCompleted += prod.unitsProduced;
    drivePenaltyDelta = Math.floor(prod.unitsProduced / 2) * 1.5;
    state.driveCompetitivenessPenalty += drivePenaltyDelta;
  } else if (moduleId === 'menuiserie' && prod.unitsProduced > 0) {
    drivePenaltyDelta = prod.unitsProduced * 1.0;
    state.driveCompetitivenessPenalty += drivePenaltyDelta;
  }

  // Vitalité de l'épicerie Bertin (conserverie rescapant les fruits et légumes)
  let groceryVitalityDelta = 0;
  if (moduleId === 'conserverie' && prod.unitsProduced > 0) {
    groceryVitalityDelta = Math.min(5, prod.unitsProduced * 0.4);
  }

  return {
    moduleId,
    recipeId,
    hoursWorked: hoursInvested,
    unitsProduced: prod.unitsProduced,
    materialsConsumed: prod.materialsConsumed,
    grossValueEuros: grossValue,
    toolConditionBefore: conditionBefore,
    toolConditionAfter: mod.toolCondition,
    maintenanceFundUsed: wear.maintenanceFundConsumed,
    freeRiderRiskDelta: freeRiderDelta,
    driveCompetitivenessPenaltyDelta: drivePenaltyDelta,
    groceryVitalityDelta,
    surplusSplit: split,
  };
}

/**
 * Enregistre et calcule la formation citoyenne au sein de l'atelier.
 */
export function trainCitizenInWorkshop(
  state: WorkshopsState,
  npcId: string,
  moduleId: WorkshopModuleId,
  hours: number,
  targetSkill?: SkillId,
  customXpGain?: number,
): { record: CitizenTrainingRecord; freeRiderDelta: number } {
  let record = state.citizenTraining[npcId];
  if (!record) {
    record = {
      npcId,
      hoursTrained: 0,
      skillsAcquired: {},
      civicAwareness: 20,
    };
    state.citizenTraining[npcId] = record;
  }

  record.hoursTrained += hours;
  const skill: SkillId = targetSkill ?? (moduleId === 'electronique' ? 'technique' : 'organisation');
  const xp = customXpGain ?? Math.max(5, Math.floor(hours * 3));
  record.skillsAcquired[skill] = (record.skillsAcquired[skill] ?? 0) + xp;

  // Augmentation déterministe de la conscience civique
  const awarenessGain = Math.min(30, Math.floor(hours * 1.5));
  record.civicAwareness = clamp(record.civicAwareness + awarenessGain);

  // La formation réduit la déresponsabilisation (free rider risk)
  let freeRiderDelta = 0;
  if (state.governanceMode !== 'direction_taylorienne') {
    freeRiderDelta = -Math.min(8, Math.floor(hours * 0.4));
    state.freeRiderRisk = clamp(state.freeRiderRisk + freeRiderDelta);
  }

  return { record, freeRiderDelta };
}

/**
 * Réparation manuelle d'urgence d'un outillage d'atelier par apport financier.
 */
export function repairWorkshopTools(
  state: WorkshopsState,
  moduleId: WorkshopModuleId,
  repairFundInjectedEuros: number,
): {
  pointsRestored: number;
  newCondition: number;
  remainingFund: number;
} {
  const mod = state.modules[moduleId];
  mod.maintenanceFund += repairFundInjectedEuros;

  const pointsRestored = Math.min(100 - mod.toolCondition, Math.floor(mod.maintenanceFund / 2));
  const fundConsumed = pointsRestored * 2;

  mod.toolCondition = clamp(mod.toolCondition + pointsRestored);
  mod.maintenanceFund = Math.max(0, mod.maintenanceFund - fundConsumed);

  return {
    pointsRestored,
    newCondition: mod.toolCondition,
    remainingFund: mod.maintenanceFund,
  };
}

/**
 * Amélioration d'un module d'atelier au niveau supérieur (1 -> 2 -> 3).
 */
export function upgradeWorkshopModule(
  state: WorkshopsState,
  moduleId: WorkshopModuleId,
): { success: boolean; newLevel: number; costEuros: number; costMaterials: number; reason?: string } {
  const mod = state.modules[moduleId];
  if (mod.level >= 3) {
    return { success: false, newLevel: mod.level, costEuros: 0, costMaterials: 0, reason: 'Niveau maximum atteint (3).' };
  }

  const costEuros = mod.level === 1 ? 40 : 100;
  const costMaterials = mod.level === 1 ? 25 : 50;

  if (state.sharedTreasury < costEuros) {
    return {
      success: false,
      newLevel: mod.level,
      costEuros,
      costMaterials,
      reason: `Trésorerie insuffisante (${state.sharedTreasury} € / ${costEuros} € requis).`,
    };
  }

  if (mod.stockMaterials < costMaterials) {
    return {
      success: false,
      newLevel: mod.level,
      costEuros,
      costMaterials,
      reason: `Matériaux insuffisants (${mod.stockMaterials} / ${costMaterials} requis).`,
    };
  }

  state.sharedTreasury -= costEuros;
  mod.stockMaterials -= costMaterials;
  mod.level += 1;
  mod.toolCondition = Math.min(100, mod.toolCondition + 15); // Outils neufs installés

  return {
    success: true,
    newLevel: mod.level,
    costEuros,
    costMaterials,
  };
}

/**
 * Approvisionnement en matières premières recyclées.
 */
export function restockWorkshopMaterials(
  state: WorkshopsState,
  moduleId: WorkshopModuleId,
  quantity: number,
  costEuros: number,
): boolean {
  if (state.sharedTreasury < costEuros) return false;
  state.sharedTreasury -= costEuros;
  state.modules[moduleId].stockMaterials += quantity;
  return true;
}

/**
 * Changement du mode de gouvernance de l'atelier coopératif.
 */
export function setWorkshopGovernance(state: WorkshopsState, mode: WorkshopGovernanceMode): void {
  state.governanceMode = mode;
  if (mode === 'direction_taylorienne') {
    state.freeRiderRisk = clamp(state.freeRiderRisk + 15);
  } else if (mode === 'autogestion_ostrom') {
    state.freeRiderRisk = clamp(state.freeRiderRisk - 5);
  }
}
