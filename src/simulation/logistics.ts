/**
 * NEURAPOLIS — Logistique Douce Multi-Modale (Axis 4).
 * Couche : simulation/ (Moteur pur, déterministe, sans dépendances DOM).
 *
 * Exigences Axis 4 :
 * - Flotte : Triporteurs, portage à pied, relais citoyens, péniche fluviale
 * - Formule déterministe de livraison :
 *     Temps_Ticks = ceil( (Distance / Vitesse) * Facteur_Relais * Facteur_Météo )
 * - Économie carbone certifiée (kg CO2 économisés vs camionnette diesel)
 * - Satisfaction citoyenne et impact systémique sur le Drive HyperVal
 */

import type {
  DeliveryOrder,
  DeliveryOrderStatus,
  LogisticsVehicle,
  RelayPoint,
  SoftDeliveryMode,
  SoftLogisticsState,
} from '../core/simulation_extended_types';
import type { Meteo, PlaceId } from '../core/types';

// ============================================================================
// 1. Constantes et Spécifications des Véhicules et Relais
// ============================================================================

export const VEHICLE_SPECS: Record<
  SoftDeliveryMode,
  {
    capacityKg: number;
    baseSpeedTilesPerTick: number; // 1 tick = 10 minutes
    rainSpeedMultiplier: number;
    rainWearPenalty: number;
    label: string;
  }
> = {
  triporteur: {
    capacityKg: 60,
    baseSpeedTilesPerTick: 2.5,
    rainSpeedMultiplier: 0.7, // -30% sous la pluie
    rainWearPenalty: 2.5,
    label: 'Triporteur à Assistance Musculaire',
  },
  pied: {
    capacityKg: 10,
    baseSpeedTilesPerTick: 1.0,
    rainSpeedMultiplier: 0.9, // -10% sous la pluie
    rainWearPenalty: 0.5,
    label: 'Portage à Pied & Chariot Léger',
  },
  relais_citoyen: {
    capacityKg: 25,
    baseSpeedTilesPerTick: 1.5,
    rainSpeedMultiplier: 0.85,
    rainWearPenalty: 1.0,
    label: 'Navette Inter-Relais Habitants',
  },
  peniche: {
    capacityKg: 500,
    baseSpeedTilesPerTick: 3.0,
    rainSpeedMultiplier: 0.95,
    rainWearPenalty: 0.8,
    label: 'Péniche Associative Fluviale',
  },
};

export const WEATHER_DELIVERY_FACTORS: Record<Meteo, number> = {
  soleil: 1.0,
  nuages: 1.05,
  pluie: 1.35,
};

// ============================================================================
// 2. Initialisation d'État
// ============================================================================

export function createInitialLogisticsState(): SoftLogisticsState {
  const initialFleet: LogisticsVehicle[] = [
    {
      id: 'triporteur_01',
      mode: 'triporteur',
      condition: 90,
      capacityKg: 60,
      baseSpeedTilesPerTick: 2.5,
      inUse: false,
      totalDistanceKm: 12.5,
    },
    {
      id: 'triporteur_02',
      mode: 'triporteur',
      condition: 85,
      capacityKg: 60,
      baseSpeedTilesPerTick: 2.5,
      inUse: false,
      totalDistanceKm: 8.0,
    },
    {
      id: 'coursier_pied_01',
      mode: 'pied',
      condition: 100,
      capacityKg: 10,
      baseSpeedTilesPerTick: 1.0,
      inUse: false,
      totalDistanceKm: 25.0,
    },
    {
      id: 'peniche_canal_01',
      mode: 'peniche',
      condition: 95,
      capacityKg: 500,
      baseSpeedTilesPerTick: 3.0,
      inUse: false,
      totalDistanceKm: 42.0,
    },
  ];

  const initialRelays: Record<string, RelayPoint> = {
    relais_bertin: {
      id: 'relais_bertin',
      name: 'Épicerie des Roses (Mme Bertin)',
      location: 'epicerie',
      hostName: 'Mme Bertin',
      capacitySlots: 15,
      occupiedSlots: 3,
      active: true,
    },
    relais_friche: {
      id: 'relais_friche',
      name: 'Fablab Friche Taret (Samir)',
      location: 'friche',
      hostName: 'Samir Ould-Ali',
      capacitySlots: 20,
      occupiedSlots: 5,
      active: true,
    },
    relais_monique: {
      id: 'relais_monique',
      name: 'Porche des Aînés (Monique)',
      location: 'parc',
      hostName: 'Monique Petitjean',
      capacitySlots: 8,
      occupiedSlots: 1,
      active: true,
    },
  };

  return {
    active: true,
    fleet: initialFleet,
    relayPoints: initialRelays,
    orders: [],
    completedOrdersCount: 0,
    onTimeReliability: 92,
    totalCo2SavedKg: 14.8,
    averageSatisfaction: 88,
    driveDeliverySlowdownFactor: 0.12,
    groceryVitalityGain: 4.5,
  };
}

// ============================================================================
// 3. Formules Mathématiques Pures Déterministes
// ============================================================================

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

/**
 * Calcul du facteur de réduction de distance permis par le maillage des relais citoyens.
 * Plus il y a de relais actifs, plus le dernier kilomètre est raccourci (plancher à 0.60).
 */
export function calculateRelayFactor(activeRelayCount: number): number {
  return Math.max(0.6, 1.0 - 0.08 * Math.max(0, activeRelayCount));
}

/**
 * Calcul de la vitesse effective d'un véhicule compte tenu de son état mécanique et de la météo :
 * VitesseEffective = BaseSpeed * (Condition / 100) * MeteoMultiplier
 */
export function calculateEffectiveSpeed(
  mode: SoftDeliveryMode,
  vehicleCondition: number,
  meteo: Meteo,
): number {
  const specs = VEHICLE_SPECS[mode];
  const conditionFactor = Math.max(0.4, Math.min(1.0, vehicleCondition / 100));
  const weatherMult = meteo === 'pluie' ? specs.rainSpeedMultiplier : 1.0;
  return specs.baseSpeedTilesPerTick * conditionFactor * weatherMult;
}

/**
 * Formule déterministe principale de durée de livraison :
 * Temps_Ticks = ceil( (Distance / VitesseEffective) * Facteur_Relais * Facteur_Météo )
 */
export function calculateDeliveryTimeTicks(
  distanceTiles: number,
  mode: SoftDeliveryMode,
  vehicleCondition: number,
  meteo: Meteo,
  activeRelayCount: number,
): number {
  if (distanceTiles <= 0) return 1;

  const effectiveSpeed = calculateEffectiveSpeed(mode, vehicleCondition, meteo);
  const relayFactor = calculateRelayFactor(activeRelayCount);
  const weatherFactor = WEATHER_DELIVERY_FACTORS[meteo];

  const rawTime = (distanceTiles / effectiveSpeed) * relayFactor * weatherFactor;
  return Math.max(1, Math.ceil(rawTime));
}

/**
 * Économie d'émissions de carbone certifiée (kg CO2) vs une camionnette diesel urbaine standard
 * (0.35 kg CO2 par km, 1 tuile = ~0.05 km).
 */
export function calculateCo2SavedKg(distanceTiles: number, weightKg: number): number {
  const distanceKm = distanceTiles * 0.05;
  const weightFactor = 1 + Math.min(2.0, weightKg / 50);
  const co2Kg = distanceKm * 0.35 * weightFactor;
  return Math.round(co2Kg * 1000) / 1000;
}

/**
 * Calcul de la satisfaction du client selon le respect du délai imparti :
 * - À l'heure : 80 + 20 * (marge / délai)
 * - En retard : max(10, 80 - 15 * retard)
 */
export function calculateCustomerSatisfaction(durationTicks: number, urgencyTicks: number): number {
  if (durationTicks <= urgencyTicks) {
    const marginRatio = (urgencyTicks - durationTicks) / Math.max(1, urgencyTicks);
    return Math.min(100, Math.round(80 + 20 * marginRatio));
  }
  const delayTicks = durationTicks - urgencyTicks;
  return Math.max(10, Math.round(80 - 15 * delayTicks));
}

// ============================================================================
// 4. Moteur de Gestion des Commandes et de Flotte
// ============================================================================

export interface DispatchDeliveryResult {
  orderId: string;
  assignedVehicleId: string;
  mode: SoftDeliveryMode;
  estimatedDurationTicks: number;
  co2SavedKg: number;
  success: boolean;
  reason?: string;
}

export interface CompleteDeliveryResult {
  orderId: string;
  actualDurationTicks: number;
  urgencyTicks: number;
  onTime: boolean;
  satisfactionScore: number;
  rewardEuros: number;
  co2SavedKg: number;
  groceryVitalityGain: number;
  driveSlowdownApplied: number;
  vehicleWear: number;
}

/**
 * Crée et enregistre une nouvelle commande de livraison citoyenne.
 */
export function createDeliveryOrder(
  state: SoftLogisticsState,
  orderDef: {
    id: string;
    source: PlaceId | string;
    destination: PlaceId | string;
    weightKg: number;
    distanceTiles: number;
    urgencyTicks: number;
    rewardEuros: number;
    preferredMode?: SoftDeliveryMode;
  },
  currentTick: number,
): DeliveryOrder {
  const preferredMode = orderDef.preferredMode ?? (orderDef.weightKg > 60 ? 'peniche' : orderDef.weightKg > 10 ? 'triporteur' : 'pied');
  const co2 = calculateCo2SavedKg(orderDef.distanceTiles, orderDef.weightKg);

  const order: DeliveryOrder = {
    id: orderDef.id,
    source: orderDef.source,
    destination: orderDef.destination,
    weightKg: orderDef.weightKg,
    urgencyTicks: orderDef.urgencyTicks,
    createdTick: currentTick,
    rewardEuros: orderDef.rewardEuros,
    assignedMode: preferredMode,
    status: 'en_attente',
    distanceTiles: orderDef.distanceTiles,
    co2SavedKg: co2,
    satisfactionScore: 0,
  };

  state.orders.push(order);
  return order;
}

/**
 * Assigne le véhicule le plus adapté et lance la livraison.
 */
export function dispatchDeliveryOrder(
  state: SoftLogisticsState,
  orderId: string,
  meteo: Meteo,
  currentTick: number,
): DispatchDeliveryResult {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'en_attente') {
    return {
      orderId,
      assignedVehicleId: '',
      mode: 'pied',
      estimatedDurationTicks: 0,
      co2SavedKg: 0,
      success: false,
      reason: 'Commande introuvable ou déjà traitée.',
    };
  }

  // Trouver un véhicule disponible compatible avec la charge
  const candidateVehicles = state.fleet.filter(
    (v) => !v.inUse && v.capacityKg >= order.weightKg && v.condition >= 20,
  );

  if (candidateVehicles.length === 0) {
    return {
      orderId,
      assignedVehicleId: '',
      mode: order.assignedMode,
      estimatedDurationTicks: 0,
      co2SavedKg: 0,
      success: false,
      reason: 'Aucun véhicule disponible en état de transporter cette charge.',
    };
  }

  // Priorité au mode préféré de la commande, sinon premier compatible
  const selectedVehicle = (candidateVehicles.find((v) => v.mode === order.assignedMode) ?? candidateVehicles[0])!;

  selectedVehicle.inUse = true;
  order.assignedMode = selectedVehicle.mode;
  order.status = 'en_cours';
  order.startedTick = currentTick;

  const activeRelays = Object.values(state.relayPoints).filter((r) => r.active).length;
  const estimatedTicks = calculateDeliveryTimeTicks(
    order.distanceTiles,
    selectedVehicle.mode,
    selectedVehicle.condition,
    meteo,
    activeRelays,
  );

  return {
    orderId,
    assignedVehicleId: selectedVehicle.id,
    mode: selectedVehicle.mode,
    estimatedDurationTicks: estimatedTicks,
    co2SavedKg: order.co2SavedKg,
    success: true,
  };
}

/**
 * Conclut une livraison, applique l'usure, crédite l'économie carbone et la satisfaction.
 */
export function completeDeliveryOrder(
  state: SoftLogisticsState,
  orderId: string,
  meteo: Meteo,
  completedTick: number,
): CompleteDeliveryResult {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'en_cours') {
    throw new Error(`Impossible de finaliser la commande ${orderId} (statut: ${order?.status})`);
  }

  const startedTick = order.startedTick ?? order.createdTick;
  const actualDurationTicks = Math.max(1, completedTick - startedTick);
  const onTime = actualDurationTicks <= order.urgencyTicks;

  order.completedTick = completedTick;
  order.status = onTime ? 'livree' : 'en_retard';

  const satisfaction = calculateCustomerSatisfaction(actualDurationTicks, order.urgencyTicks);
  order.satisfactionScore = satisfaction;

  // Libération du véhicule et calcul d'usure mécanique
  const vehicle = state.fleet.find((v) => v.inUse && v.mode === order.assignedMode);
  let wear = 1.0;
  if (vehicle) {
    vehicle.inUse = false;
    const distanceKm = order.distanceTiles * 0.05;
    vehicle.totalDistanceKm += distanceKm;

    const specs = VEHICLE_SPECS[vehicle.mode];
    wear = (order.distanceTiles * 0.1) + (meteo === 'pluie' ? specs.rainWearPenalty : 0);
    vehicle.condition = clamp(vehicle.condition - wear);
  }

  // Métriques globales de logistique douce
  state.completedOrdersCount += 1;
  state.totalCo2SavedKg = Math.round((state.totalCo2SavedKg + order.co2SavedKg) * 1000) / 1000;

  // Calcul du taux cumulé de fiabilité à l'heure
  const allCompleted = state.orders.filter((o) => o.status === 'livree' || o.status === 'en_retard');
  const onTimeCount = allCompleted.filter((o) => o.status === 'livree').length;
  state.onTimeReliability = Math.round((onTimeCount / allCompleted.length) * 100);

  // Mise à jour de la satisfaction moyenne
  const avgSat = allCompleted.reduce((acc, o) => acc + o.satisfactionScore, 0) / allCompleted.length;
  state.averageSatisfaction = Math.round(avgSat);

  // Bonus territorial : chaque livraison à l'heure renforce l'épicerie et ralentit le Drive
  let groceryGain = 0;
  let driveSlowdown = 0;
  if (onTime) {
    groceryGain = 0.2;
    driveSlowdown = 0.02;
    state.groceryVitalityGain = Math.round((state.groceryVitalityGain + groceryGain) * 10) / 10;
    state.driveDeliverySlowdownFactor = Math.min(0.4, state.driveDeliverySlowdownFactor + driveSlowdown);
  }

  return {
    orderId,
    actualDurationTicks,
    urgencyTicks: order.urgencyTicks,
    onTime,
    satisfactionScore: satisfaction,
    rewardEuros: order.rewardEuros,
    co2SavedKg: order.co2SavedKg,
    groceryVitalityGain: groceryGain,
    driveSlowdownApplied: driveSlowdown,
    vehicleWear: Math.round(wear * 10) / 10,
  };
}

/**
 * Entretien et réparation d'un véhicule de la flotte de logistique douce.
 */
export function repairFleetVehicle(
  state: SoftLogisticsState,
  vehicleId: string,
  repairPoints: number,
  costEuros: number,
  treasuryMoney: number,
): { success: boolean; newCondition: number; remainingTreasury: number; reason?: string } {
  const vehicle = state.fleet.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return { success: false, newCondition: 0, remainingTreasury: treasuryMoney, reason: 'Véhicule introuvable.' };
  }
  if (treasuryMoney < costEuros) {
    return {
      success: false,
      newCondition: vehicle.condition,
      remainingTreasury: treasuryMoney,
      reason: `Fonds insuffisants (${treasuryMoney} € / ${costEuros} €).`,
    };
  }

  vehicle.condition = clamp(vehicle.condition + repairPoints);
  return {
    success: true,
    newCondition: vehicle.condition,
    remainingTreasury: treasuryMoney - costEuros,
  };
}

/**
 * Déploiement ou activation d'un nouveau relais citoyen chez l'habitant.
 */
export function registerRelayPoint(
  state: SoftLogisticsState,
  relay: RelayPoint,
): void {
  state.relayPoints[relay.id] = relay;
}
