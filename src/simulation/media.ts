/**
 * NEURAPOLIS — Journal Local & Radio Pirate Citoyenne (Axis 4).
 * Couche : simulation/ (Moteur pur, déterministe, sans dépendances DOM).
 *
 * Exigences Axis 4 :
 * - Fréquence 108.4 FM & Gazette imprimée "La Feuille des Roses"
 * - Formule déterministe d'audience modulée par l'audace et la programmation
 * - Risque CSA / réglementaire, avertissements, amendes et saisie d'antenne
 * - Contre-pouvoir citoyen et érosion mathématique des parts de marché du Drive
 * - Amélioration du moral et de la confiance territoriale
 */

import type {
  JournalArticle,
  JournalEdition,
  MediaState,
  RadioBroadcastEntry,
  RadioProgramType,
} from '../core/simulation_extended_types';

// ============================================================================
// 1. Constantes et Coefficients Déterministes
// ============================================================================

export const RADIO_PROGRAM_COEFFICIENTS: Record<
  RadioProgramType,
  {
    multiplier: number;
    moraleDelta: number;
    trustDelta: number;
    driveErosionWeight: number;
    csaRiskBonus: number;
    counterPowerDelta: number;
    label: string;
  }
> = {
  enquete_consommation: {
    multiplier: 1.25,
    moraleDelta: 0.2,
    trustDelta: 0.5,
    driveErosionWeight: 1.8,
    csaRiskBonus: 3.5,
    counterPowerDelta: 2.0,
    label: 'Enquête Consommation : Marges Cachées & Gaspillage du Drive',
  },
  gazette_humour: {
    multiplier: 1.3,
    moraleDelta: 1.2,
    trustDelta: 0.6,
    driveErosionWeight: 0.3,
    csaRiskBonus: 0.5,
    counterPowerDelta: 0.8,
    label: 'Gazette Satirique : Les Chroniques de Val-Ferrand',
  },
  philo_fantomes: {
    multiplier: 1.1,
    moraleDelta: 0.4,
    trustDelta: 0.8,
    driveErosionWeight: 0.6,
    csaRiskBonus: -0.5,
    counterPowerDelta: 1.5,
    label: 'Joutes Spectrales : Smith, Marx & Ostrom au Micro',
  },
  musique_locale: {
    multiplier: 1.15,
    moraleDelta: 0.9,
    trustDelta: 1.2,
    driveErosionWeight: 0.1,
    csaRiskBonus: -1.0,
    counterPowerDelta: 0.5,
    label: 'Scène Ouverte des Docks & Voix Ouvrières',
  },
  meteo_poetique: {
    multiplier: 1.05,
    moraleDelta: 0.7,
    trustDelta: 0.4,
    driveErosionWeight: 0.0,
    csaRiskBonus: -1.5,
    counterPowerDelta: 0.3,
    label: 'Bulletin Météo Poétique de Solange',
  },
  alerte_citoyenne: {
    multiplier: 1.2,
    moraleDelta: 0.3,
    trustDelta: 1.5,
    driveErosionWeight: 1.2,
    csaRiskBonus: 2.0,
    counterPowerDelta: 2.5,
    label: 'Alerte Citoyenne : Solidarité Commerces de Proximité',
  },
};

// ============================================================================
// 2. Initialisation d'État
// ============================================================================

export function createInitialMediaState(): MediaState {
  return {
    active: true,
    stationName: 'Radio Val-Ferrand',
    frequency: '108.4 FM',
    antennaPowerWatts: 15,
    audacityLevel: 2,
    audienceRate: 28,
    csaInterventionRisk: 10,
    csaWarningIssued: false,
    stationSeized: false,
    accumulatedFines: 0,
    currentSchedule: ['enquete_consommation', 'gazette_humour', 'philo_fantomes'],
    broadcastHistory: [],
    journalSubscribers: 45,
    journalEditions: [],
    totalDriveErosion: 0,
    neighborhoodMoraleBonus: 0,
    counterPowerIndex: 20,
  };
}

// ============================================================================
// 3. Formules Mathématiques Pures Déterministes
// ============================================================================

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

/**
 * Calcul déterministe du taux d'audience de Radio Val-Ferrand :
 * Base = 15 + 0.8 * Watts + 0.4 * RéputationJoueur
 * Multiplicateur Audace = 1 + (audacity - 1) * 0.15
 * Multiplicateur Programme = mu_prog
 * Facteur Réglementaire = max(0.2, 1 - RisqueCSA / 200)
 *
 * Audience = min(95, max(0, Base * AudaceMult * ProgMult * CSAFacteur))
 */
export function calculateRadioAudience(
  antennaPowerWatts: number,
  playerReputation: number,
  audacityLevel: number,
  program: RadioProgramType,
  csaRisk: number,
  stationSeized: boolean,
): number {
  if (stationSeized) return 0;

  const baseAudience = 15 + 0.8 * antennaPowerWatts + 0.4 * clamp(playerReputation);
  const clampedAudacity = Math.max(1, Math.min(5, Math.floor(audacityLevel)));
  const audacityMultiplier = 1 + (clampedAudacity - 1) * 0.15;
  const programMultiplier = RADIO_PROGRAM_COEFFICIENTS[program].multiplier;
  const csaFactor = Math.max(0.2, 1 - clamp(csaRisk) / 200);

  const rawAudience = baseAudience * audacityMultiplier * programMultiplier * csaFactor;
  return Math.min(95, Math.max(0, Math.round(rawAudience * 10) / 10));
}

/**
 * Calcul déterministe de la variation du risque réglementaire CSA :
 * Delta = max(0, (Watts - 15) / 5) + (Audace - 2) * 1.5 + ProgBonus - 0.5 * Diplomatie
 */
export function calculateCsaRiskDelta(
  antennaPowerWatts: number,
  audacityLevel: number,
  program: RadioProgramType,
  playerDiplomacySkill: number,
): number {
  const powerPenalty = Math.max(0, (antennaPowerWatts - 15) / 5);
  const audacityPenalty = (Math.max(1, Math.min(5, audacityLevel)) - 2) * 1.5;
  const programBonus = RADIO_PROGRAM_COEFFICIENTS[program].csaRiskBonus;
  const diplomacyDefense = clamp(playerDiplomacySkill) * 0.5;

  const netDelta = powerPenalty + audacityPenalty + programBonus - diplomacyDefense;
  return Math.round(netDelta * 10) / 10;
}

/**
 * Calcul de l'érosion commerciale infligée au Drive HyperVal :
 * Erosion = 0.15 * (Audience / 10) * (1 + Audace / 5) * WeightProg
 */
export function calculateDriveErosion(
  audienceRate: number,
  audacityLevel: number,
  program: RadioProgramType,
): number {
  const progCoeff = RADIO_PROGRAM_COEFFICIENTS[program];
  if (progCoeff.driveErosionWeight <= 0 || audienceRate <= 0) return 0;

  const clampedAudacity = Math.max(1, Math.min(5, audacityLevel));
  const baseRate = 0.15 * (audienceRate / 10);
  const audacityFactor = 1 + clampedAudacity / 5;
  const erosion = baseRate * audacityFactor * progCoeff.driveErosionWeight;

  return Math.round(erosion * 100) / 100;
}

// ============================================================================
// 4. Moteur de Diffusion et Actions
// ============================================================================

export interface BroadcastResult {
  day: number;
  program: RadioProgramType;
  audienceReached: number;
  driveErosion: number;
  csaRiskBefore: number;
  csaRiskAfter: number;
  csaWarningTriggered: boolean;
  csaFineLevied: number;
  stationSeized: boolean;
  moraleGain: number;
  trustGain: number;
  counterPowerGain: number;
  summary: string;
}

/**
 * Exécute une émission quotidienne de radio pirate.
 */
export function broadcastRadioDaily(
  state: MediaState,
  day: number,
  program: RadioProgramType,
  playerReputation = 50,
  playerDiplomacy = 1,
): BroadcastResult {
  if (state.stationSeized) {
    return {
      day,
      program,
      audienceReached: 0,
      driveErosion: 0,
      csaRiskBefore: state.csaInterventionRisk,
      csaRiskAfter: state.csaInterventionRisk,
      csaWarningTriggered: false,
      csaFineLevied: 0,
      stationSeized: true,
      moraleGain: 0,
      trustGain: 0,
      counterPowerGain: 0,
      summary: 'Émetteur confisqué par les autorités. Aucune émission possible.',
    };
  }

  const riskBefore = state.csaInterventionRisk;
  const riskDelta = calculateCsaRiskDelta(
    state.antennaPowerWatts,
    state.audacityLevel,
    program,
    playerDiplomacy,
  );
  state.csaInterventionRisk = clamp(riskBefore + riskDelta);

  const audience = calculateRadioAudience(
    state.antennaPowerWatts,
    playerReputation,
    state.audacityLevel,
    program,
    state.csaInterventionRisk,
    state.stationSeized,
  );
  state.audienceRate = audience;

  const erosion = calculateDriveErosion(audience, state.audacityLevel, program);
  state.totalDriveErosion = Math.round((state.totalDriveErosion + erosion) * 100) / 100;

  const progCoeff = RADIO_PROGRAM_COEFFICIENTS[program];
  const moraleGain = Math.round(progCoeff.moraleDelta * (audience / 50) * 10) / 10;
  const trustGain = Math.round(progCoeff.trustDelta * (audience / 50) * 10) / 10;
  const counterPowerGain = Math.round(progCoeff.counterPowerDelta * (audience / 50) * 10) / 10;

  state.neighborhoodMoraleBonus = clamp(state.neighborhoodMoraleBonus + moraleGain);
  state.counterPowerIndex = clamp(state.counterPowerIndex + counterPowerGain);

  // Gestion des seuils réglementaires CSA
  let fineLevied = 0;
  let warningTriggered = false;

  if (state.csaInterventionRisk >= 70 && !state.csaWarningIssued) {
    state.csaWarningIssued = true;
    warningTriggered = true;
  }

  if (state.csaInterventionRisk >= 90) {
    fineLevied = 35;
    state.accumulatedFines += fineLevied;
  }

  if (state.csaInterventionRisk >= 100) {
    state.stationSeized = true;
    state.active = false;
  }

  const logEntry: RadioBroadcastEntry = {
    day,
    program,
    audienceReached: audience,
    driveErosionAchieved: erosion,
    notes: `${progCoeff.label} — ${audience}% d'audience, -${erosion} pts Drive.`,
  };
  state.broadcastHistory.unshift(logEntry);
  if (state.broadcastHistory.length > 50) state.broadcastHistory.length = 50;

  return {
    day,
    program,
    audienceReached: audience,
    driveErosion: erosion,
    csaRiskBefore: riskBefore,
    csaRiskAfter: state.csaInterventionRisk,
    csaWarningTriggered: warningTriggered,
    csaFineLevied: fineLevied,
    stationSeized: state.stationSeized,
    moraleGain,
    trustGain,
    counterPowerGain,
    summary: logEntry.notes,
  };
}

/**
 * Réglage du niveau d'audace éditoriale (1 à 5).
 */
export function setMediaAudacity(state: MediaState, level: number): void {
  state.audacityLevel = Math.max(1, Math.min(5, Math.floor(level)));
}

/**
 * Augmentation de la puissance de l'antenne radio (5W à 50W).
 */
export function upgradeAntennaPower(
  state: MediaState,
  wattsToAdd: number,
  costEuros: number,
  playerMoney: number,
): { success: boolean; newPower: number; remainingMoney: number; reason?: string } {
  if (state.antennaPowerWatts + wattsToAdd > 50) {
    return {
      success: false,
      newPower: state.antennaPowerWatts,
      remainingMoney: playerMoney,
      reason: 'Puissance maximale atteinte (50W).',
    };
  }
  if (playerMoney < costEuros) {
    return {
      success: false,
      newPower: state.antennaPowerWatts,
      remainingMoney: playerMoney,
      reason: `Fonds insuffisants (${playerMoney} € / ${costEuros} € requis).`,
    };
  }

  state.antennaPowerWatts += wattsToAdd;
  return {
    success: true,
    newPower: state.antennaPowerWatts,
    remainingMoney: playerMoney - costEuros,
  };
}

/**
 * Relocalisation clandestine de l'émetteur radio (échappe à la saisie et purge le risque CSA).
 */
export function relocateRadioAntenna(
  state: MediaState,
  costEuros = 25,
  playerMoney = 50,
): { success: boolean; newRisk: number; remainingMoney: number; reason?: string } {
  if (playerMoney < costEuros) {
    return {
      success: false,
      newRisk: state.csaInterventionRisk,
      remainingMoney: playerMoney,
      reason: `Fonds insuffisants (${playerMoney} € / ${costEuros} €).`,
    };
  }

  state.stationSeized = false;
  state.active = true;
  state.csaWarningIssued = false;
  state.csaInterventionRisk = Math.max(0, state.csaInterventionRisk - 45);

  return {
    success: true,
    newRisk: state.csaInterventionRisk,
    remainingMoney: playerMoney - costEuros,
  };
}

/**
 * Règlement des amendes accumulées auprès du régulateur.
 */
export function payRegulatoryFines(
  state: MediaState,
  amountToPay: number,
  treasuryMoney: number,
): { amountPaid: number; remainingFines: number; remainingTreasury: number } {
  const payable = Math.min(state.accumulatedFines, Math.min(amountToPay, treasuryMoney));
  state.accumulatedFines = Math.max(0, state.accumulatedFines - payable);
  return {
    amountPaid: payable,
    remainingFines: state.accumulatedFines,
    remainingTreasury: treasuryMoney - payable,
  };
}

/**
 * Publication d'une nouvelle édition du journal papier "La Feuille des Roses".
 */
export function publishJournalEdition(
  state: MediaState,
  dayPublished: number,
  headline: string,
  articles: JournalArticle[],
  printRun: number,
  costPerCopy = 0.08,
): JournalEdition {
  const costEuros = Math.round(printRun * costPerCopy * 100) / 100;
  const newSubscribers = Math.floor(printRun * 0.06);
  state.journalSubscribers += newSubscribers;

  const investigationCount = articles.filter((a) => a.category === 'investigation').length;
  const impactMorale = Math.round((articles.length * 0.8 + printRun * 0.005) * 10) / 10;
  const impactTrust = Math.round((articles.length * 0.5 + investigationCount * 1.5) * 10) / 10;

  state.neighborhoodMoraleBonus = clamp(state.neighborhoodMoraleBonus + impactMorale);
  state.counterPowerIndex = clamp(state.counterPowerIndex + impactTrust * 1.2);

  const edition: JournalEdition = {
    issueNumber: state.journalEditions.length + 1,
    dayPublished,
    headline,
    articles,
    printRun,
    costEuros,
    impactMorale,
    impactTrust,
  };

  state.journalEditions.unshift(edition);
  return edition;
}
