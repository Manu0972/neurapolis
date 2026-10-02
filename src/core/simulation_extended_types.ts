/**
 * NEURAPOLIS — Background Simulation Extended Type Contracts (Axis 4).
 * Couche : core/ (Types stricts, 100% sérialisables, sans dépendances DOM).
 *
 * Exigences Axis 4 :
 * 1. Ateliers Coopératifs Modulaires (menuiserie, électronique, conserverie)
 * 2. Journal Local & Radio Pirate Citoyenne (108.4 FM, audience, audace, risque CSA, érosion Drive)
 * 3. Logistique Douce (triporteurs, portage à pied, relais citoyens, empreinte carbone)
 * 4. Réseau Social des PNJ (graphe d'affinités, propagation de rumeurs, entraide spontanée)
 */

import type { PlaceId, SkillId } from './types';

// ============================================================================
// 1. Ateliers Coopératifs Modulaires (Workshops)
// ============================================================================

/** Identifiants des filières modulaires de la friche Taret. */
export type WorkshopModuleId = 'menuiserie' | 'electronique' | 'conserverie';

/** Modes de gouvernance de l'atelier coopératif. */
export type WorkshopGovernanceMode =
  | 'autogestion_ostrom'   // Règle des Communs : équilibre, pérennité, bonus si faible resquille
  | 'comite_artisans'      // Démocratie de métier : stabilité, régularité
  | 'direction_taylorienne'; // Productivisme : haut rendement à court terme, usure accélérée et stress

/** Définition d'une recette ou projet de confection artisanale. */
export interface WorkshopRecipe {
  id: string;
  name: string;
  moduleId: WorkshopModuleId;
  description: string;
  requiredLevel: number;             // Niveau requis du module (1..3)
  requiredHours: number;             // Heures de travail requises par lot
  requiredMaterials: number;         // Unités de matières premières de réemploi
  outputUnits: number;               // Quantité d'articles produits
  durabilityScore: number;           // 1 à 5 (durabilité comparée au standard industriel)
  valueEuros: number;                // Valeur marchande ou d'usage unitaire (€)
  skillTarget: SkillId;              // Compétence développée par cette recette
  skillXpGain: number;               // Points d'expérience citoyenne conférés
}

/** État d'un module d'atelier. */
export interface WorkshopModuleState {
  id: WorkshopModuleId;
  unlocked: boolean;
  level: number;                     // 1 à 3
  toolCondition: number;             // 0 à 100 (usure de l'outillage)
  stockMaterials: number;            // Unités de matières premières en stock
  workforceHours: number;            // Heures investies dans le cycle courant
  maintenanceFund: number;           // Caisse dédiée à la révision des outils (€)
  lastOutputUnits: number;           // Production du dernier cycle
  cumulativeProduced: number;        // Total historique d'unités produites
  activeRecipeId?: string;           // Recette actuellement travaillée
}

/** Enregistrement d'apprentissage et de formation citoyenne par habitant. */
export interface CitizenTrainingRecord {
  npcId: string;
  hoursTrained: number;
  skillsAcquired: Partial<Record<SkillId, number>>;
  civicAwareness: number;            // 0 à 100 (conscience civique et solidarité)
}

/** État global des Ateliers Coopératifs. */
export interface WorkshopsState {
  active: boolean;
  governanceMode: WorkshopGovernanceMode;
  modules: Record<WorkshopModuleId, WorkshopModuleState>;
  sharedTreasury: number;            // Fonds de réserve commun (€)
  freeRiderRisk: number;             // 0 à 100 (risque de resquille / négligence d'entretien)
  citizenTraining: Record<string, CitizenTrainingRecord>;
  surplusReserve: number;            // Fonds citoyen pour projets de quartier (20% surplus)
  workerDividends: number;           // Rémunération / partage des coopérateurs (30% surplus)
  communityRepairsCompleted: number; // Réparations citoyennes effectuées
  driveCompetitivenessPenalty: number; // Pénalité infligée au Drive grâce aux alternatives durables
}

// ============================================================================
// 2. Journal Local & Radio Pirate Citoyenne (Media)
// ============================================================================

/** Types de programmes diffusés sur Radio Val-Ferrand 108.4 FM. */
export type RadioProgramType =
  | 'enquete_consommation'  // Dénonce les marges du Drive, érode sa part de marché
  | 'gazette_humour'        // Chroniques décalées, remonte le moral du quartier
  | 'philo_fantomes'        // Joutes philosophiques citoyennes, sensibilise aux communs
  | 'musique_locale'        // Artistes du cru, renforce la confiance territoriale
  | 'meteo_poetique'        // Poésie urbaine, réduit le stress général
  | 'alerte_citoyenne';     // Mobilisation d'urgence pour les commerces en difficulté

/** Catégories d'articles du journal papier "La Feuille des Roses". */
export type JournalCategory =
  | 'investigation'
  | 'culture_populaire'
  | 'tribune_citoyenne'
  | 'chronique_pratique';

/** Fiche d'un article de la gazette locale. */
export interface JournalArticle {
  title: string;
  category: JournalCategory;
  author: string;
  summary: string;
}

/** Édition publiée du journal papier. */
export interface JournalEdition {
  issueNumber: number;
  dayPublished: number;
  headline: string;
  articles: JournalArticle[];
  printRun: number;                  // Nombre d'exemplaires tirés
  costEuros: number;                 // Coût d'impression engagé
  impactMorale: number;              // Bonus moral quartier conféré
  impactTrust: number;               // Bonus confiance quartier conféré
}

/** Entrée du registre de diffusion radio. */
export interface RadioBroadcastEntry {
  day: number;
  program: RadioProgramType;
  audienceReached: number;           // Pourcentage d'habitants à l'écoute (0-100)
  driveErosionAchieved: number;      // Points de part de marché arrachés au Drive
  notes: string;
}

/** État complet du système Médias & Radio Pirate. */
export interface MediaState {
  active: boolean;
  stationName: string;               // 'Radio Val-Ferrand'
  frequency: string;                 // '108.4 FM'
  antennaPowerWatts: number;         // 5 à 50 Watts
  audacityLevel: number;             // 1 (sage) à 5 (provocateur sans filtre)
  audienceRate: number;              // 0 à 100 %
  csaInterventionRisk: number;       // 0 à 100 % (risque légal / saisie / amende)
  csaWarningIssued: boolean;         // Mise en demeure formelle reçue
  stationSeized: boolean;            // Émetteur saisi / coupé par les autorités
  accumulatedFines: number;          // Montant des amendes cumulées (€)
  currentSchedule: RadioProgramType[];
  broadcastHistory: RadioBroadcastEntry[];
  journalSubscribers: number;        // Nombre d'abonnés à la gazette papier
  journalEditions: JournalEdition[]; // Archives des journaux publiés
  totalDriveErosion: number;         // Érosion totale de marché infligée au Drive
  neighborhoodMoraleBonus: number;   // Bonus permanent ou rémanent de moral
  counterPowerIndex: number;         // 0 à 100 : jauge de contre-pouvoir citoyen
}

// ============================================================================
// 3. Logistique Douce (Soft Logistics)
// ============================================================================

/** Modes de transport éco-responsables disponibles. */
export type SoftDeliveryMode = 'pied' | 'triporteur' | 'relais_citoyen' | 'peniche';

/** Statut d'une commande de livraison douce. */
export type DeliveryOrderStatus =
  | 'en_attente'
  | 'en_cours'
  | 'livree'
  | 'en_retard'
  | 'annulee';

/** Commande de transport citoyen. */
export interface DeliveryOrder {
  id: string;
  source: PlaceId | string;
  destination: PlaceId | string;
  weightKg: number;
  urgencyTicks: number;              // Délai imparti en ticks de simulation
  createdTick: number;
  startedTick?: number;
  completedTick?: number;
  rewardEuros: number;
  assignedMode: SoftDeliveryMode;
  status: DeliveryOrderStatus;
  distanceTiles: number;             // Distance Manhattan ou euclidienne en tuiles
  co2SavedKg: number;                // Économie carbone certifiée vs camionnette thermique
  satisfactionScore: number;         // 0 à 100
}

/** Point de relais citoyen chez un commerçant ou habitant. */
export interface RelayPoint {
  id: string;
  name: string;
  location: PlaceId | string;
  hostName: string;
  capacitySlots: number;
  occupiedSlots: number;
  active: boolean;
}

/** Véhicule ou moyen de transport de la flotte douce. */
export interface LogisticsVehicle {
  id: string;
  mode: SoftDeliveryMode;
  condition: number;                 // 0 à 100 (usure mécanique)
  capacityKg: number;
  baseSpeedTilesPerTick: number;     // Vitesse nominale
  inUse: boolean;
  totalDistanceKm: number;
}

/** État complet de la Logistique Douce. */
export interface SoftLogisticsState {
  active: boolean;
  fleet: LogisticsVehicle[];
  relayPoints: Record<string, RelayPoint>;
  orders: DeliveryOrder[];
  completedOrdersCount: number;
  onTimeReliability: number;         // 0 à 100 % (taux de livraison à l'heure)
  totalCo2SavedKg: number;           // Bilan carbone total économisé (kg)
  averageSatisfaction: number;       // 0 à 100
  driveDeliverySlowdownFactor: number; // Ralentissement relatif imposé au Drive
  groceryVitalityGain: number;       // Vitalité apportée à l'épicerie Bertin
}

// ============================================================================
// 4. Réseau Social des PNJ (Social Graph & Emergent Behavior)
// ============================================================================

/** Relation bilatérale entre deux habitants. */
export interface SocialEdge {
  npcA: string;                      // Id premier habitant (trié alphabétiquement)
  npcB: string;                      // Id second habitant
  affinity: number;                  // -100 à +100 (sympathie / antipathie)
  trust: number;                     // 0 à 100 (confiance mutuelle)
  interactionCount: number;          // Nombre d'échanges vécus
  mutualAidCount: number;            // Actes de solidarité mutuelle
  lastInteractionDay: number;
}

/** Typologies de rumeurs et nouvelles circulant dans le quartier. */
export type RumorCategory =
  | 'drive_scandale'        // Produits avariés ou marges abusives chez HyperVal
  | 'atelier_besoin'        // Appel à récupération de bois, vélos ou pièces
  | 'solidarite_locale'     // Fête solidaire, banquet ou initiative d'entraide
  | 'tresor_roses'          // Rumeur populaire de trésor ou mystère souterrain
  | 'csa_patrouille';       // Contrôle de l'antenne radio pirate

/** Rumeur ou nouvelle active dans le réseau social. */
export interface SocialRumor {
  id: string;
  category: RumorCategory;
  headline: string;
  originNpc: string;
  createdDay: number;
  intensity: number;                 // 0 à 100 (force de propagation)
  credibility: number;               // 0 à 100 (taux de véracité perçu)
  knownByNpcs: Record<string, { belief: number; dayHeard: number }>;
  systemicTriggered: boolean;        // Effet déclenché quand le seuil critique est atteint
}

/** Type de difficulté déclenchant une entraide citoyenne spontanée. */
export type MutualAidNeedType =
  | 'bris_outillage'        // Outils cassés à l'atelier
  | 'penurie_matiere'       // Manque de bois ou pièces pour une commande
  | 'surmenage_epicerie'    // Afflux imprévu de clients chez Mme Bertin
  | 'colis_urgent'          // Livraison volumineuse impossible en solo
  | 'tresse_fatigue';       // Stress ou épuisement d'un camarade

/** Enregistrement d'un acte d'entraide spontané. */
export interface MutualAidEvent {
  id: string;
  day: number;
  recipientId: string;
  helperId: string;
  needType: MutualAidNeedType;
  description: string;
  resolutionEffect: string;
  affinityDelta: number;
}

/** État complet du Réseau Social des PNJ. */
export interface SocialNetworkState {
  active: boolean;
  nodes: string[];                   // Liste des IDs d'habitants dans le graphe
  edges: Record<string, SocialEdge>; // Clé "idA:idB" avec idA < idB
  rumors: SocialRumor[];
  mutualAidHistory: MutualAidEvent[];
  spontaneousAidReadiness: number;   // 0 à 100 : disponibilité globale pour aider
  communitySolidarityIndex: number;  // 0 à 100 : cohésion globale du quartier
}

// ============================================================================
// 5. État Global Composite de Simulation Arrière-Plan
// ============================================================================

export interface BackgroundSimulationState {
  workshops: WorkshopsState;
  media: MediaState;
  logistics: SoftLogisticsState;
  socialNetwork: SocialNetworkState;
}
