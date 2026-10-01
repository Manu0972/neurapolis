/**
 * Modèle de superposition probabiliste des tempéraments et des humeurs pour PNJ et Fantômes.
 * Calcule la probabilité d'événements spéciaux, de réactions émotionnelles et d'humeurs dynamiques.
 */
import type { CharacterTemperament, DynamicMood, GhostId, NpcId, WorldState } from '../core/types';
import { rngNext } from '../core/rng';
import { GHOST_BY_ID } from '../data/ghosts/registry';
import { NPC_BY_ID } from '../data/npcs';

export const GHOST_TEMPERAMENTS: Record<GhostId, CharacterTemperament> = {
  smith: 'pragmatique',
  marx: 'militant',
  keynes: 'analytique',
  schumpeter: 'audacieux',
  ostrom: 'empathique',
  polanyi: 'militant',
  hayek: 'pragmatique',
  walras: 'analytique',
  taylor: 'pragmatique',
  ford: 'audacieux',
  malthus: 'pessimiste',
  ricardo: 'analytique',
  simon: 'analytique',
  veblen: 'militant',
  sen: 'empathique',
  graeber: 'militant',
};

export const NPC_TEMPERAMENTS: Record<NpcId, CharacterTemperament> = {
  noah: 'audacieux',
  lina: 'analytique',
  yasmine: 'empathique',
  karim: 'pessimiste',
  monique: 'pragmatique',
  samir: 'militant',
  bertin: 'pessimiste',
  moreau: 'analytique',
};

export interface MoodSuperpositionFactors {
  temperament: CharacterTemperament;
  baseProbability: number;
  weatherModifier: number;     // ex: pluie = +pessimisme/tension
  financialModifier: number;   // ex: baisse solde = +tension
  rivalryModifier: number;     // ex: rival puissant = +indignation/audace
  combinedProbability: number;
}

/**
 * Superposition de modèles probabilistes : calcule la probabilité combinée d'un événement ou réaction spéciale.
 */
export function calculateMoodProbability(
  temperament: CharacterTemperament,
  currentMood: DynamicMood | undefined,
  world: WorldState,
): MoodSuperpositionFactors {
  let baseProb = 0.20;

  // Ajustement selon le tempérament
  if (temperament === 'audacieux') baseProb += 0.15;
  if (temperament === 'militant') baseProb += 0.10;
  if (temperament === 'pessimiste') baseProb += 0.05;

  // Ajustement selon l'humeur
  if (currentMood === 'enthousiaste' || currentMood === 'indigne') baseProb += 0.10;
  if (currentMood === 'tendu') baseProb += 0.05;

  // Facteurs environnementaux
  let weatherMod = 0;
  if (world.district.meteo === 'pluie') weatherMod = 0.08;

  let financialMod = 0;
  const projectBalance = world.project?.balance ?? 0;
  if (projectBalance < 10) financialMod = 0.12;

  let rivalryMod = 0;
  const driveShare = world.rivals.drive_hyper?.marketShare ?? 0;
  if (driveShare > 50) rivalryMod = 0.15;

  const combined = Math.min(0.95, Math.max(0.05, baseProb + weatherMod + financialMod + rivalryMod));

  return {
    temperament,
    baseProbability: baseProb,
    weatherModifier: weatherMod,
    financialModifier: financialMod,
    rivalryModifier: rivalryMod,
    combinedProbability: combined,
  };
}

/**
 * Met à jour dynamiquement l'humeur d'un PNJ ou Fantôme via le PRNG déterministe.
 */
export function evaluateDynamicMood(world: WorldState, characterId: string, isGhost: boolean): DynamicMood {
  const temperament = isGhost
    ? (GHOST_TEMPERAMENTS[characterId] ?? 'pragmatique')
    : (NPC_TEMPERAMENTS[characterId] ?? 'empathique');

  const currentMood = isGhost
    ? world.council.ghosts[characterId]?.mood
    : world.npcs[characterId]?.mood;

  const { combinedProbability } = calculateMoodProbability(temperament, currentMood, world);
  const rngValue = rngNext(world);

  if (rngValue < combinedProbability * 0.3) {
    return 'enthousiaste';
  } else if (rngValue < combinedProbability * 0.6) {
    return 'indigne';
  } else if (rngValue < combinedProbability) {
    return 'tendu';
  } else if (rngValue < combinedProbability + 0.2) {
    return 'inspire';
  }

  return 'serein';
}

/**
 * Génère une réponse spéciale probabiliste enrichie selon l'humeur et le tempérament.
 */
export function getSpecialProbabilisticResponse(
  world: WorldState,
  characterId: string,
  isGhost: boolean,
): { special: boolean; text?: string; mood: DynamicMood } {
  const mood = evaluateDynamicMood(world, characterId, isGhost);
  const temperament = isGhost
    ? (GHOST_TEMPERAMENTS[characterId] ?? 'pragmatique')
    : (NPC_TEMPERAMENTS[characterId] ?? 'empathique');

  const { combinedProbability } = calculateMoodProbability(temperament, mood, world);
  const rngValue = rngNext(world);

  if (rngValue <= combinedProbability) {
    const name = isGhost ? GHOST_BY_ID[characterId]?.name ?? characterId : NPC_BY_ID[characterId]?.name ?? characterId;
    let text = `[Humeur: ${mood.toUpperCase()}] ${name} observe la situation avec intensité.`;
    if (mood === 'indigne') text += ` "La pression du marché est inacceptable, il faut agir !"`;
    if (mood === 'enthousiaste') text += ` "Les perspectives sont formidables si nous saisissons l'occasion !"`;
    if (mood === 'tendu') text += ` "Un peu de prudence, le risque d'échec est très élevé."`;
    if (mood === 'inspire') text += ` "J'ai une vision claire de ce que nous devrions construire."`;
    return { special: true, text, mood };
  }

  return { special: false, mood };
}
