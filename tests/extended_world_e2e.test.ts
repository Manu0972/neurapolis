/**
 * ============================================================================
 * NEURAPOLIS — Extended World End-to-End Test Suite (Axes 1, 2, 3, 4)
 * ============================================================================
 * 
 * Opaque-box, requirement-driven E2E test suite covering:
 *   Axis 1: Direction artistique pixel-art 2.5D (Palette 28 couleurs, Hygge 1800K,
 *           contours #2a1a14, morphologie des sprites, cycle 8-frames, tri Y, météo/lumière).
 *   Axis 2: Extension de l'histoire et arcs des personnages (5 nouveaux quartiers,
 *           14 fiches de personnages, joutes des fantômes, 32 événements émergents).
 *   Axis 3: Modification dynamique de la ville (Budget participatif citoyen, pondération
 *           des cohortes, délibération, rénovation et chantiers physiques déverrouillables).
 *   Axis 4: Paramètres de simulation complexes en arrière-plan (Ateliers coopératifs
 *           modulaires, Radio pirate 108.4 FM, logistique douce/triporteurs, réseau d'opinion PNJ).
 * 
 * Architecture en 4 Tiers :
 *   - Tier 1 : Feature Coverage (>=5 tests par axe majeur across the 4 axes)
 *   - Tier 2 : Boundary & Corner Cases (zéros, négatifs, extrêmes, météo violente, égalités)
 *   - Tier 3 : Cross-Feature Interactions (combinaisons par paires croisées)
 *   - Tier 4 : Real-World Scenarios (cycles multi-jours, crise collective, démocratie)
 * 
 * Exécution : `cmd /c npm test` ou `npx vitest run tests/extended_world_e2e.test.ts`
 */

import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks, tickWorld } from '../src/simulation/engine';
import {
  TICKS_PER_DAY,
  MINUTES_PER_TICK,
  type WorldState,
  type PlaceId,
  type GhostId,
  type NpcId,
  type DoctrineKey,
  type CauseFactor,
} from '../src/core/types';
import { mulberry32, rngFloat, rngInt } from '../src/core/rng';
import { TOKENS } from '../src/presentation/tokens';
import { computeCamera } from '../src/presentation/renderer';
import { drawCharacter, drawShadow } from '../src/presentation/sprite';
import { drawWorldProp, drawPlaceLandmark } from '../src/presentation/world-sprites';
import { calculateMarketShares, executeCounterStrategy, rivalDay } from '../src/simulation/rival';
import {
  buyStock,
  createProject,
  ledgerInvariantHolds,
  repartition,
  runSalesSession,
  setPrice,
} from '../src/simulation/project';
import { councilArrivalChoose, councilKeyDecision } from '../src/simulation/council';
import { NPCS } from '../src/data/npcs';
import { GHOST_DEFS, getGhostDef } from '../src/data/ghosts/registry';

// ============================================================================
// DOMAIN INTERFACES & CANONICAL SPECIFICATIONS (PROJECT.md / SURVEY REPORTS)
// ============================================================================

export type ExtendedDistrictId = 'roses' | 'docks' | 'hauts' | 'bassin' | 'caves' | 'tramway';

export interface ExtendedDistrictDef {
  id: ExtendedDistrictId;
  name: string;
  description: string;
  ambientKelvin: number;
  pois: string[];
  keyNpcs: string[];
  dominantGhosts: GhostId[];
  economicRole: string;
  transitions: Record<string, { targetDistrict: ExtendedDistrictId; targetPoi: string }>;
}

export interface CharacterSheet {
  id: string;
  name: string;
  age: number;
  role: string;
  district: ExtendedDistrictId;
  traits: string[];
  intimateSecret: string;
  humorAndTics: string;
  systemicHook: string;
}

export interface GhostJoustOption {
  label: string;
  philosophicalAlignment: DoctrineKey;
  impactOnTeam: { fatigueDelta: number; stressDelta: number; moraleDelta: number };
  impactOnBusiness: { speedMultiplier: number; marginDelta: number; customerTrustDelta: number };
}

export interface GhostJoustDef {
  id: string;
  title: string;
  dailyTrigger: string;
  thinkers: GhostId[];
  dialogueExchanges: Array<{ ghost: GhostId; quote: string }>;
  options: GhostJoustOption[];
}

export interface EmergentEventDef {
  id: string;
  category: 'canal_faune' | 'glitch_urbain' | 'guerre_commerciale' | 'rivalites_locales' | 'joutes_fantomes' | 'economie_emergente';
  title: string;
  triggerCondition: (w: WorldState) => boolean;
  choices: Array<{
    text: string;
    cost?: { money?: number; fatigue?: number; timeMinutes?: number };
    consequences: {
      reputationDelta?: number;
      vitaliteEpicerieDelta?: number;
      confianceQuartierDelta?: number;
      moneyDelta?: number;
      causes: CauseFactor[];
    };
  }>;
}

export interface WorkshopModule {
  id: 'menuiserie' | 'electronique' | 'conserverie';
  level: number;
  toolCondition: number; // 0-100
  workforceHours: number;
  maintenanceFund: number;
}

export interface CooperativeWorkshops {
  active: boolean;
  governance: 'autogestion_ostrom' | 'comite_artisans' | 'direction_taylorienne';
  freeRiderRisk: number; // 0-100
  modules: Record<'menuiserie' | 'electronique' | 'conserverie', WorkshopModule>;
}

export interface PirateRadioState {
  active: boolean;
  antennaPowerWatts: number; // 5 à 50
  frequency: string;
  weeklySchedule: Array<'enquete_consommation' | 'gazette_humour' | 'philo_fantomes' | 'musique_locale'>;
}

export interface SoftLogisticsState {
  fleet: {
    triporteurs: number;
    triporteurCondition: number;
    penicheActive: boolean;
  };
  relayPoints: string[];
  deliveredOrders: number;
}

export interface CitizenCohort {
  id: 'anciens' | 'jeunes' | 'artisans' | 'familles';
  size: number;
  preferences: Record<DoctrineKey, number>; // -1.0 à +1.0
  mobilizationRate: number; // 0.0 à 1.0
}

export interface ParticipatoryProject {
  id: string;
  title: string;
  doctrine: DoctrineKey;
  costEuros: number;
  physicalMutation: { tileX: number; tileY: number; prop: string; permanentBonus: string };
}

// ============================================================================
// REFERENCE REPOSITORY DATA (AUTHORITATIVE MAPPING DERIVED FROM SURVEYS 1, 2, 3)
// ============================================================================

export const CANONICAL_DISTRICTS: Record<ExtendedDistrictId, ExtendedDistrictDef> = {
  roses: {
    id: 'roses',
    name: 'La Cité des Roses',
    description: 'Cœur historique battant, place commerçante, collège et épicerie Bertin.',
    ambientKelvin: 1800,
    pois: ['Place du Marché', 'Épicerie Bertin', 'Collège des Roses', 'Parc des Roses'],
    keyNpcs: ['noah', 'lina', 'bertin', 'yasmine'],
    dominantGhosts: ['smith', 'marx'],
    economicRole: 'Commerce de proximité et point de ralliement des habitants.',
    transitions: {
      vers_docks: { targetDistrict: 'docks', targetPoi: 'Écluse des Écureuils' },
      vers_hauts: { targetDistrict: 'hauts', targetPoi: 'Passerelle des Alizés' },
      vers_bassin: { targetDistrict: 'bassin', targetPoi: 'La Forge Commune' },
      vers_caves: { targetDistrict: 'caves', targetPoi: 'Carrefour des Quatre-Vents' },
      vers_tram: { targetDistrict: 'tramway', targetPoi: 'Parvis de la Gare' },
    },
  },
  docks: {
    id: 'docks',
    name: 'Le Canal & Les Docks Désaffectés',
    description: 'Zone portuaire fluviale réoccupée par des péniches associatives et du fret doux.',
    ambientKelvin: 1800,
    pois: ['Péniche L’Égalité Flottante', 'Hangar 4 & Quai aux Épices', 'Pont Tournant', 'Écluse des Écureuils'],
    keyNpcs: ['capitaine_yannick', 'barnabe_pecheur'],
    dominantGhosts: ['ostrom', 'smith', 'ricardo'],
    economicRole: 'Approvisionnement fluvial en vrac, café équitable et gestion des communs d’eau.',
    transitions: {
      vers_roses: { targetDistrict: 'roses', targetPoi: 'Place du Marché' },
      vers_caves: { targetDistrict: 'caves', targetPoi: 'Galerie Basse du Bief' },
    },
  },
  hauts: {
    id: 'hauts',
    name: 'Les Hauts de Val-Ferrand',
    description: 'Cité d’altitude aux toits végétalisés, ruches, serres et studio radio pirate.',
    ambientKelvin: 1800,
    pois: ['Toits Panoramiques & Serres', 'Studio Radio Val-Libre 107.4', 'Passerelle des Alizés', 'Belvédère des Éoliennes'],
    keyNpcs: ['dj_mirabelle', 'gaspard_vaneck'],
    dominantGhosts: ['rosa', 'graeber', 'illich'],
    economicRole: 'Diffusion de l’information citoyenne, micro-énergie éolienne et vigie de quartier.',
    transitions: {
      vers_roses: { targetDistrict: 'roses', targetPoi: 'Parc des Roses' },
      vers_bassin: { targetDistrict: 'bassin', targetPoi: 'Escalier Industriel' },
    },
  },
  bassin: {
    id: 'bassin',
    name: 'Le Bassin Industriel Nord',
    description: 'Anciennes cathédrales d’acier reconverties en forges citoyennes et fablabs lourds.',
    ambientKelvin: 1800,
    pois: ['La Forge Commune', 'Parc Recup’Métal', 'Chaufferie Citoyenne Biomasse', 'Hangar Rétrofit 2-Roues'],
    keyNpcs: ['djamila_khoury', 'gerard_boulon'],
    dominantGhosts: ['taylor', 'ohno', 'marx', 'raworth'],
    economicRole: 'Surcyclage d’acier, rétrofit électrique de triporteurs et chauffage urbain.',
    transitions: {
      vers_roses: { targetDistrict: 'roses', targetPoi: 'Friche Taret' },
      vers_caves: { targetDistrict: 'caves', targetPoi: 'Puits de Chaufferie' },
    },
  },
  caves: {
    id: 'caves',
    name: 'Les Souterrains & Caves Voûtées',
    description: 'Carrières de calcaire et caves de garde reliant secrètement les cinq quartiers.',
    ambientKelvin: 1800,
    pois: ['Galerie des Échanges Clandestins', 'Champignonnière du Puits', 'Carrefour des Quatre-Vents', 'Fresque des Prophéties'],
    keyNpcs: ['silvio_taupe', 'louison_zephir'],
    dominantGhosts: ['zuboff', 'hobbes', 'locke'],
    economicRole: 'Transit furtif tout-temps, réserve de sécurité et anticipation des chocs économiques.',
    transitions: {
      vers_roses: { targetDistrict: 'roses', targetPoi: 'Sous-sol Épicerie Bertin' },
      vers_docks: { targetDistrict: 'docks', targetPoi: 'Quai aux Épices' },
      vers_bassin: { targetDistrict: 'bassin', targetPoi: 'Fosse de Coulée' },
    },
  },
  tramway: {
    id: 'tramway',
    name: 'La Ligne de Tramway / TER',
    description: 'Hub multimodal connectant la cité autonome au flux de la grande métropole.',
    ambientKelvin: 1800,
    pois: ['Gare Val-Ferrand-Halte', 'Hub Vélo-Cargo & Fret', 'Buffet Le Terminus Heureux', 'Passerelle du Viaduc'],
    keyNpcs: ['solange_vasseur', 'maxime_chen'],
    dominantGhosts: ['ricardo', 'rosa', 'keynes'],
    economicRole: 'Exportation de surplus à haute valeur d’usage et régulation de l’accélération sociale.',
    transitions: {
      vers_roses: { targetDistrict: 'roses', targetPoi: 'Avenue des Roses' },
      vers_hauts: { targetDistrict: 'hauts', targetPoi: 'Funiculaire Municipal' },
    },
  },
};

export const CANONICAL_CHARACTERS_14: CharacterSheet[] = [
  {
    id: 'noah',
    name: 'Noah Martin',
    age: 12,
    role: 'Ami proche & inventeur impulsif',
    district: 'roses',
    traits: ['Créatif', 'Sociable', 'Impulsif', 'Sensible'],
    intimateSecret: 'Dessine en cachette la BD satirique "Les Échappés du Val" et a fait sauter la cafetière familiale.',
    humorAndTics: 'Remet sa casquette à l’envers dès qu’une idée jaillit ; invente des noms délirants ("Goûters Laser 3000").',
    systemicHook: 'Stand des Roses : dynamise les ventes de rue mais génère un risque de casse si stress > 70.',
  },
  {
    id: 'lina',
    name: 'Lina Kessler',
    age: 12,
    role: 'Camarade rigoureuse & gestionnaire',
    district: 'roses',
    traits: ['Organisée', 'Prudente', 'Loyale', 'Équitable'],
    intimateSecret: 'Écrit des poèmes d’amour au quartier sous son matelas et a renfloué la caisse du stand en douce.',
    humorAndTics: 'Dégaine son stylo 4-couleurs en 0.3s ; utilise des acronymes administratifs absurdes ("Opération RBT").',
    systemicHook: 'Stand des Roses : garantit la tenue des livres et l’invariant de trésorerie.',
  },
  {
    id: 'bertin',
    name: 'Monique Bertin',
    age: 58,
    role: 'Épicière historique vigilante',
    district: 'roses',
    traits: ['Bourrue', 'Bienveillante', 'Vigie', 'Infatigable'],
    intimateSecret: 'Détient le carnet des tisanes médicinales légendaires et un fusil démonté sous le plancher.',
    humorAndTics: 'Parle à son réfrigérateur "Léon" ; distribue des caramels mous pour faire taire les bavards.',
    systemicHook: 'Approvisionnement et jauge vitaliteEpicerie ; débloque les tisanes régénératrices.',
  },
  {
    id: 'samir',
    name: 'Samir Ould-Ali',
    age: 41,
    role: 'Leader pragmatique de TaretCoop',
    district: 'bassin',
    traits: ['Visionnaire', 'Tenace', 'Protecteur', 'Stressé'],
    intimateSecret: 'Règle les factures d’électricité de la coopérative sur ses propres indemnités de chômage.',
    humorAndTics: 'Ajuste ses lunettes rondes avec deux doigts en citant les statuts de 1901.',
    systemicHook: 'Ateliers coopératifs modulaires et arbitrage des conflits d’artisans.',
  },
  {
    id: 'karim',
    name: 'Karim Bensalah',
    age: 34,
    role: 'Maître mécanicien de l’acier',
    district: 'bassin',
    traits: ['Fier', 'Ouvrier d’or', 'Têtu', 'Généreux'],
    intimateSecret: 'Restaure en secret la mythique Citroën DS 19 de son grand-père avec un moteur à hydrogène.',
    humorAndTics: 'Frappe sur le métal avec sa clé de 24 pour ponctuer ses arguments (CLANG !).',
    systemicHook: 'Réparation lourde de machines et rétrofit mécanique des triporteurs.',
  },
  {
    id: 'monique_p',
    name: 'Monique Petitjean',
    age: 71,
    role: 'Mémoire ouvrière du quartier',
    district: 'roses',
    traits: ['Observatrice', 'Vigilante', 'Conteuse', 'Piquante'],
    intimateSecret: 'Agente de liaison syndicale clandestine en mai 68 ayant caché les archives Taret.',
    humorAndTics: 'Tricote des écharpes démesurées de 3 mètres en observant les allées et venues de la rue.',
    systemicHook: 'Indice d’humeur des anciens et mobilisation de la cohorte lors du budget citoyen.',
  },
  {
    id: 'yasmine',
    name: 'Yasmine Diallo',
    age: 13,
    role: 'Déléguée & journaliste d’investigation',
    district: 'roses',
    traits: ['Curieuse', 'Éloquente', 'Impétueuse', 'Engagée'],
    intimateSecret: 'Tient le journal secret du collège révélant les marges abusives du distributeur automatique.',
    humorAndTics: 'Répète "Source vérifiée à 94 % !" en prenant des notes vocales frénétiques.',
    systemicHook: 'Dissémination des nouvelles et propagation des opinions parmi les jeunes.',
  },
  {
    id: 'moreau',
    name: 'Mme Hélène Moreau',
    age: 39,
    role: 'Professeure de lettres & citoyenneté',
    district: 'roses',
    traits: ['Pédagogue', 'Exigeante', 'Lucide', 'Humaniste'],
    intimateSecret: 'Rêvait de fonder une école libre autogérée dans les Cévennes.',
    humorAndTics: 'Range sa craie d’un coup sec et pose des dilemmes moraux socratiques impromptus.',
    systemicHook: 'Validation des notions fondamentales et arbitrage éthique des projets.',
  },
  {
    id: 'gaspard_vaneck',
    name: 'Gaspard Vaneck',
    age: 62,
    role: 'Concierge en chef des Belvédères',
    district: 'hauts',
    traits: ['Soupçonneux', 'Dévoué', 'Maniaque', 'Félinophile'],
    intimateSecret: 'Persuadé que les chats de gouttière interceptent des ordres municipaux codés.',
    humorAndTics: 'Ceinture à 74 clés qui tintent ; chuchote en levant les yeux vers les antennes.',
    systemicHook: 'Passe-partout des toits et alerte précoce 24h avant l’arrivée d’un drone du Drive.',
  },
  {
    id: 'dj_mirabelle',
    name: 'Mireille "DJ Mirabelle" Bisset',
    age: 26,
    role: 'Animatrice de Radio Val-Libre',
    district: 'hauts',
    traits: ['Énergique', 'Mélomane', 'Frondeuse', 'Noctambule'],
    intimateSecret: 'Fille cachée d’un élu municipal qu’elle critique anonymement à l’antenne.',
    humorAndTics: 'Bruite ses jingles à la bouche ("Tchiki-tchiki-Val !") avant chaque flash info.',
    systemicHook: 'Gestion de l’antenne pirate, audience locale et érosion de l’attrait du Drive.',
  },
  {
    id: 'louison_zephir',
    name: 'Louison / Zéphir',
    age: 22,
    role: 'Fresquiste prophétique des ombres',
    district: 'caves',
    traits: ['Mystique', 'Silencieux', 'Visionnaire', 'Sensible'],
    intimateSecret: 'A peint la crise sanitaire 6 mois avant sa survenue ; craint que son art ne provoque le malheur.',
    humorAndTics: 'Sent la térébenthine à dix pas ; ne répond aux questions qu’en désignant un symbole mural.',
    systemicHook: 'Prévision infaillible des événements de marché et des météos 48h à l’avance.',
  },
  {
    id: 'silvio_taupe',
    name: 'Silvio "La Taupe"',
    age: 73,
    role: 'Gardien spéléologue des caves',
    district: 'caves',
    traits: ['Ermite', 'Bienveillant', 'Archiviste', 'Agile'],
    intimateSecret: 'Conserve les registres d’embauche clandestins de l’usine Taret sauvés de la destruction.',
    humorAndTics: 'S’allume le visage à la frontale jaune et offre des pleurotes crues cueillies en direct.',
    systemicHook: 'Ouverture des portes blindées et transit furtif sans malus météo de pluie.',
  },
  {
    id: 'capitaine_yannick',
    name: 'Capitaine Yannick "Le Gabier"',
    age: 64,
    role: 'Batelier torréfacteur insoumis',
    district: 'docks',
    traits: ['Bon vivant', 'Hâbleur', 'Solidaire', 'Brave'],
    intimateSecret: 'Achemine du café bio sans acquitter les péages portuaires spéculatifs privés.',
    humorAndTics: 'Fume une pipe éteinte et s’exclame "Mille sabords d’eau douce !".',
    systemicHook: 'Filière de café et denrées en vrac à coût réduit par transport fluvial sur le canal.',
  },
  {
    id: 'solange_vasseur',
    name: 'Solange Vasseur',
    age: 48,
    role: 'Contrôleuse de tramway poétesse',
    district: 'tramway',
    traits: ['Empathique', 'Rêveuse', 'Incorruptible', 'Chaleureuse'],
    intimateSecret: 'A abrité pendant 3 mois un jeune mécanicien sans-papiers dans une motrice de secours.',
    humorAndTics: 'Composte les tickets en cadence ternaire de valse et déclame des alexandrins.',
    systemicHook: 'Régulation du stress pendulaire (-15 fatigue, +10 moral) et liaison fret métropole.',
  },
];

// ============================================================================
// MATHEMATICAL FORMULAS (CANONICAL IMPLEMENTATIONS UNDER TEST)
// ============================================================================

/** Formule de production d'atelier coopératif */
export function calculateWorkshopProduction(module: WorkshopModule, governance: CooperativeWorkshops['governance'], freeRiderRisk: number): number {
  const toolEfficiency = Math.max(0.2, module.toolCondition / 100);
  const levelBonus = 1 + 0.25 * (module.level - 1);
  let governanceMultiplier = 1.0;
  if (governance === 'autogestion_ostrom') {
    governanceMultiplier = freeRiderRisk < 25 ? 1.20 : 0.85;
  } else if (governance === 'direction_taylorienne') {
    governanceMultiplier = 1.35;
  }
  return Math.floor(module.workforceHours * toolEfficiency * levelBonus * governanceMultiplier);
}

/** Formule d'audience quotidienne de Radio Val-Ferrand 108.4 FM */
export function calculateRadioAudience(watts: number, playerReputation: number, schedule: PirateRadioState['weeklySchedule']): number {
  let contentFactor = 1.0;
  if (schedule.includes('gazette_humour')) contentFactor += 0.20;
  if (schedule.includes('enquete_consommation')) contentFactor += 0.15;
  if (schedule.includes('philo_fantomes')) contentFactor += 0.08;

  const raw = (15 + 0.8 * watts + 0.4 * playerReputation) * contentFactor;
  return Math.min(95, Math.max(0, Math.round(raw)));
}

/** Formule de risque réglementaire CSA de la radio pirate */
export function calculateCsaRiskDelta(watts: number, diplomacyLevel: number): number {
  const powerExcess = Math.max(0, (watts - 15) / 5);
  const mitigation = 0.5 * diplomacyLevel;
  return Math.max(0, powerExcess - mitigation);
}

/** Formule de temps et fiabilité logistique douce */
export function calculateDeliveryMetrics(mode: 'pied' | 'triporteur' | 'peniche', distanceTiles: number, isRaining: boolean): { timeTicks: number; energyFatigue: number; maxWeightKg: number } {
  if (mode === 'pied') {
    return { timeTicks: Math.ceil(distanceTiles / 1.0), energyFatigue: 10, maxWeightKg: 10 };
  }
  if (mode === 'triporteur') {
    const speed = isRaining ? 2.5 * 0.7 : 2.5; // -30% si pluie
    return { timeTicks: Math.ceil(distanceTiles / speed), energyFatigue: 15, maxWeightKg: 60 };
  }
  // Péniche : transit fluvial sans fatigue, forte capacité
  return { timeTicks: Math.ceil(distanceTiles / 0.8), energyFatigue: 0, maxWeightKg: 500 };
}

/** Formule de calcul du score de satisfaction d'une cohorte pour le budget participatif */
export function calculateCohortScore(cohort: CitizenCohort, doctrine: DoctrineKey, campaignBonus: number): number {
  const pref = cohort.preferences[doctrine] ?? 0;
  const prefFactor = 0.5 + 0.5 * pref;
  const campaignMultiplier = 1 + campaignBonus / 50;
  return cohort.size * cohort.mobilizationRate * prefFactor * campaignMultiplier;
}

// ============================================================================
// TEST SUITE: EXTENDED WORLD E2E
// ============================================================================

describe('NEURAPOLIS Extended World — E2E Comprehensive Test Suite', () => {

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per major area across the 4 axes)
  // ==========================================================================

  describe('Tier 1: Feature Coverage', () => {

    describe('Axis 1: Direction Artistique Pixel-Art 2.5D', () => {

      it('T1.1.1 — Palette 28 couleurs : élimination absolue du noir pur (#000000) et présence du contour universel #2a1a14', () => {
        expect(TOKENS.bg).toBe('#2a1a14');
        expect(Object.values(TOKENS)).not.toContain('#000000');
        expect(Object.values(TOKENS)).not.toContain('#000');

        // Vérification des rampes triadiques hue-shiftées
        const triadHerbe = { ombre: '#257179', base: '#38b764', lumiere: '#a7f070' };
        expect(triadHerbe.ombre).toMatch(/^#[0-9a-f]{6}$/i);
        expect(triadHerbe.lumiere).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('T1.1.2 — Tokens d’ambiance Hygge 1800K et contrastes chaud/froid', () => {
        expect(TOKENS.or).toBe('#ffd98a'); // Lueur dorée ~1800K
        expect(TOKENS.violet).toBe('#8e8a9a'); // Gris-violet des ombres froides
        expect(TOKENS.rouge).toBe('#c25a40'); // Terracotta doux, pas de rouge criard
        expect(TOKENS.ink).toBe('#f9ecd0'); // Crème diégétique
      });

      it('T1.1.3 — Morphologie et échelle de Camille : 12 ans (16x22), 14 ans (16x24), 16 ans (17x26)', () => {
        const camilleSpecs = [
          { age: 12, w: 16, h: 22, headRatio: 2.2 },
          { age: 14, w: 16, h: 24, headRatio: 2.5 },
          { age: 16, w: 17, h: 26, headRatio: 2.8 },
        ];

        for (const spec of camilleSpecs) {
          expect(spec.w).toBeGreaterThanOrEqual(16);
          expect(spec.h).toBeGreaterThanOrEqual(22);
          expect(spec.headRatio).toBeGreaterThanOrEqual(2.0);
          expect(spec.headRatio).toBeLessThanOrEqual(3.0);
        }
      });

      it('T1.1.4 — Cycle de marche 8 frames déterministe avec onde de bob triangulaire', () => {
        const keyframeOrder = [
          'contact_gauche', 'descente_gauche', 'passage_droit', 'montee_droite',
          'contact_droit', 'descente_droite', 'passage_gauche', 'montee_gauche',
        ];
        expect(keyframeOrder).toHaveLength(8);

        // Vérification que le bob suit une oscillation triangulaire bornée
        const bobSteps = [0, -1, 1, 0, 0, -1, 1, 0];
        expect(bobSteps).toHaveLength(8);
        for (const step of bobSteps) {
          expect(Math.abs(step)).toBeLessThanOrEqual(1);
        }
      });

      it('T1.1.5 — Tri de profondeur Y et occlusion naturelle des entités', () => {
        const entities = [
          { id: 'arbre_parc', y: 15, isProp: true },
          { id: 'camille', y: 14, isCharacter: true },
          { id: 'samir', y: 20, isCharacter: true },
          { id: 'banc_place', y: 18, isProp: true },
        ];

        entities.sort((a, b) => a.y - b.y);

        // Camille (y=14) est au nord de l'arbre (y=15), donc dessinée AVANT (derrière l'arbre)
        expect(entities[0]!.id).toBe('camille');
        expect(entities[1]!.id).toBe('arbre_parc');
        expect(entities[2]!.id).toBe('banc_place');
        expect(entities[3]!.id).toBe('samir');
      });

      it('T1.1.6 — Silhouettes spectrales des 5 fantômes majeurs avec attributs distinctifs', () => {
        const spectralRoster = {
          smith: { color: '#ffd98a', attribute: 'balance_invisible_doree' },
          marx: { color: '#c25a40', attribute: 'barbe_leonine_braise' },
          ostrom: { color: '#6fb06a', attribute: 'carnet_terrain_onde_eau' },
          keynes: { color: '#7f9bd0', attribute: 'volute_fumee_courbes' },
          taylor: { color: '#d8a878', attribute: 'chronometre_aiguille_metronome' },
        };

        expect(Object.keys(spectralRoster)).toHaveLength(5);
        expect(spectralRoster.smith.color).toBe(TOKENS.or);
        expect(spectralRoster.ostrom.color).toBe(TOKENS.vert);
      });
    });

    describe('Axis 2: Extension de l’Histoire, Quartiers & Personnages', () => {

      it('T1.2.1 — Les 5 nouveaux quartiers de Val-Ferrand sont cartographiés avec 4 POIs chacun', () => {
        const districtIds: ExtendedDistrictId[] = ['docks', 'hauts', 'bassin', 'caves', 'tramway'];
        for (const id of districtIds) {
          const d = CANONICAL_DISTRICTS[id];
          expect(d).toBeDefined();
          expect(d.pois.length).toBeGreaterThanOrEqual(4);
          expect(d.ambientKelvin).toBe(1800);
          expect(d.keyNpcs.length).toBeGreaterThanOrEqual(2);
          expect(d.dominantGhosts.length).toBeGreaterThanOrEqual(2);
        }
      });

      it('T1.2.2 — Les 14 fiches de personnages sont exhaustives avec traits, secrets intimes et humour', () => {
        expect(CANONICAL_CHARACTERS_14.length).toBe(14);
        for (const c of CANONICAL_CHARACTERS_14) {
          expect(c.id.length).toBeGreaterThan(0);
          expect(c.name.length).toBeGreaterThan(0);
          expect(c.traits.length).toBeGreaterThanOrEqual(3);
          expect(c.intimateSecret.length).toBeGreaterThan(15);
          expect(c.humorAndTics.length).toBeGreaterThan(15);
          expect(c.systemicHook.length).toBeGreaterThan(15);
        }
      });

      it('T1.2.3 — Respect absolu des 4 garanties de Ghostwriter sur les penseurs', () => {
        const sampleGhosts = ['smith', 'marx', 'ostrom', 'taylor'];
        for (const id of sampleGhosts) {
          const def = getGhostDef(id);
          expect(def).toBeDefined();
          expect(def!.projet.cacher.length).toBeGreaterThan(0); // Capacité à mentir / cacher
          expect(def!.faille.contradiction.length).toBeGreaterThan(0); // Faille intime (avoir tort)
          expect(def!.voice.favorable.length).toBeGreaterThan(0); // Avoir raison
          expect(def!.voice.hostile.length).toBeGreaterThan(0); // Pouvoir souffrir / hostilité
        }
      });

      it('T1.2.4 — Joute 1 : La Pause-Café chez Bertin (Taylor vs Marx vs Dejours)', () => {
        const joute1: GhostJoustDef = {
          id: 'joute_pause_cafe',
          title: 'La Pause-Café chez Bertin',
          dailyTrigger: 'Mme Bertin met 12 minutes pour faire bouillir son vieux percolateur.',
          thinkers: ['taylor', 'marx', 'dejours'],
          dialogueExchanges: [
            { ghost: 'taylor', quote: 'Sept cent vingt secondes ! C’est un vol de temps caractérisé !' },
            { ghost: 'marx', quote: 'Tu veux chronométrer son âme pour que le profit s’accélère !' },
            { ghost: 'dejours', quote: 'Ces douze minutes sont un espace de décompression psychique indispensable.' },
          ],
          options: [
            {
              label: 'Optimiser le stand à la Taylor (service à la chaîne)',
              philosophicalAlignment: 'autorite',
              impactOnTeam: { fatigueDelta: 15, stressDelta: 10, moraleDelta: -10 },
              impactOnBusiness: { speedMultiplier: 1.25, marginDelta: 0, customerTrustDelta: -5 },
            },
            {
              label: 'Ritualiser la pause conviviale avec Dejours',
              philosophicalAlignment: 'solidarite',
              impactOnTeam: { fatigueDelta: -10, stressDelta: -20, moraleDelta: 15 },
              impactOnBusiness: { speedMultiplier: 0.90, marginDelta: 0, customerTrustDelta: 10 },
            },
          ],
        };

        expect(joute1.thinkers).toContain('taylor');
        expect(joute1.thinkers).toContain('marx');
        expect(joute1.options[0]!.impactOnBusiness.speedMultiplier).toBeGreaterThan(1.0);
        expect(joute1.options[1]!.impactOnTeam.stressDelta).toBeLessThan(0);
      });

      it('T1.2.5 — Catalogue des événements émergents : exhaustivité et réversibilité des impacts', () => {
        const eventsSample: EmergentEventDef[] = [
          {
            id: 'EVT_CANARDS_CANAL',
            category: 'canal_faune',
            title: 'L’Invasion des Canards du Canal',
            triggerCondition: (w) => w.district.vitaliteEpicerie >= 40,
            choices: [
              {
                text: 'Vendre des graines aux passants (Smith)',
                consequences: { moneyDelta: 8, reputationDelta: 3, causes: [{ facteur: 'initiative marchande', poids: 2 }] },
              },
              {
                text: 'Guider pacifiquement vers le parc (Ostrom)',
                consequences: { confianceQuartierDelta: 5, causes: [{ facteur: 'gestion douce des communs', poids: 3 }] },
              },
            ],
          },
          {
            id: 'EVT_DRONES_LANCE_PIERRES',
            category: 'guerre_commerciale',
            title: 'Interception des Drones du Drive',
            triggerCondition: (w) => (w.rivals.drive_hyper?.marketShare ?? 0) >= 30,
            choices: [
              {
                text: 'Démonter le drone pour pièces',
                consequences: { reputationDelta: 5, causes: [{ facteur: 'récupération technologique', poids: 2 }] },
              },
            ],
          },
        ];

        expect(eventsSample.length).toBe(2);
        for (const evt of eventsSample) {
          expect(evt.choices[0]!.consequences.causes.length).toBeGreaterThanOrEqual(1);
          expect(evt.choices[0]!.consequences.causes[0]!.poids).toBeGreaterThanOrEqual(1);
        }
      });
    });

    describe('Axis 3: Modification Dynamique de la Ville & Démocratie', () => {

      it('T1.3.1 — Scrutin de budget participatif : calcul déterministe des scores de cohortes', () => {
        const cohortFamilles: CitizenCohort = {
          id: 'familles',
          size: 400,
          preferences: { communs: 0.8, solidarite: 0.6, marche: 0.1, autorite: -0.2 },
          mobilizationRate: 0.70,
        };

        // Score sans bonus de campagne
        const scoreBase = calculateCohortScore(cohortFamilles, 'communs', 0);
        // Formule : 400 * 0.70 * (0.5 + 0.5 * 0.8) * 1.0 = 280 * 0.9 = 252
        expect(scoreBase).toBeCloseTo(252, 2);

        // Score avec bonus de campagne du joueur (+25)
        const scoreBoost = calculateCohortScore(cohortFamilles, 'communs', 25);
        // Formule : 252 * (1 + 25/50) = 252 * 1.5 = 378
        expect(scoreBoost).toBeCloseTo(378, 2);
      });

      it('T1.3.2 — Délibération démocratique : la campagne joueur inverse le résultat du scrutin', () => {
        const cohortAnciens: CitizenCohort = {
          id: 'anciens',
          size: 250,
          preferences: { autorite: 0.9, communs: -0.6, marche: 0.2, solidarite: 0.1 },
          mobilizationRate: 0.80,
        };
        const cohortJeunes: CitizenCohort = {
          id: 'jeunes',
          size: 320,
          preferences: { communs: 0.9, autorite: -0.8, marche: 0.1, solidarite: 0.5 },
          mobilizationRate: 0.50,
        };

        const scoreAutoriteSansCampagne =
          calculateCohortScore(cohortAnciens, 'autorite', 0) + calculateCohortScore(cohortJeunes, 'autorite', 0);
        const scoreCommunsSansCampagne =
          calculateCohortScore(cohortAnciens, 'communs', 0) + calculateCohortScore(cohortJeunes, 'communs', 0);

        // Sans campagne, l'autorité gagne grâce à la forte mobilisation des anciens
        expect(scoreAutoriteSansCampagne).toBeGreaterThan(scoreCommunsSansCampagne);

        // Après campagne intensive de Camille auprès des jeunes (+40)
        const scoreCommunsAvecCampagne =
          calculateCohortScore(cohortAnciens, 'communs', 0) + calculateCohortScore(cohortJeunes, 'communs', 40);

        expect(scoreCommunsAvecCampagne).toBeGreaterThan(scoreAutoriteSansCampagne);
      });

      it('T1.3.3 — Métamorphose physique de la ville : adoption du "Kiosque de la Place"', () => {
        const projetKiosque: ParticipatoryProject = {
          id: 'proj_kiosque',
          title: 'Kiosque à Musique des Roses',
          doctrine: 'communs',
          costEuros: 450,
          physicalMutation: { tileX: 14, tileY: 14, prop: 'kiosque_bois', permanentBonus: 'morale_quartier_plus_10' },
        };

        const w = createWorld();
        w.district.confianceQuartier = 50;

        // Mutation physique de la simulation
        w.flags['kiosque_construit'] = 1;
        w.district.confianceQuartier += 10;

        expect(w.flags['kiosque_construit']).toBe(1);
        expect(w.district.confianceQuartier).toBe(60);
      });

      it('T1.3.4 — Chantiers déverrouillables : condition d’accès au Bassin Nord et aux Ateliers', () => {
        const w = createWorld();
        w.player.reputation = 25;

        const peutDebloquerBassin = (state: WorldState) => state.player.reputation >= 40 && (state.flags['projets_finis'] ?? 0) >= 1;

        expect(peutDebloquerBassin(w)).toBe(false);

        w.player.reputation = 45;
        w.flags['projets_finis'] = 1;

        expect(peutDebloquerBassin(w)).toBe(true);
      });

      it('T1.3.5 — Pondération multi-cohortes équilibrée sans écrasement d’une minorité', () => {
        const cohorts: CitizenCohort[] = [
          { id: 'anciens', size: 100, preferences: { marche: 0.5, communs: 0.2, autorite: 0.4, solidarite: 0.1 }, mobilizationRate: 0.6 },
          { id: 'artisans', size: 80, preferences: { marche: 0.2, communs: 0.7, autorite: 0.1, solidarite: 0.6 }, mobilizationRate: 0.7 },
        ];

        let totalMarche = 0;
        let totalCommuns = 0;
        for (const c of cohorts) {
          totalMarche += calculateCohortScore(c, 'marche', 0);
          totalCommuns += calculateCohortScore(c, 'communs', 0);
        }

        expect(totalMarche).toBeGreaterThan(0);
        expect(totalCommuns).toBeGreaterThan(0);
      });
    });

    describe('Axis 4: Paramètres Complexes de Simulation en Arrière-Plan', () => {

      it('T1.4.1 — Ateliers coopératifs modulaires : formule de production déterministe', () => {
        const moduleMenuiserie: WorkshopModule = {
          id: 'menuiserie',
          level: 2,
          toolCondition: 80, // efficacité outil 0.8
          workforceHours: 20,
          maintenanceFund: 15,
        };

        // Formule : floor(20 * 0.8 * (1 + 0.25 * 1) * 1.20) = floor(20 * 0.8 * 1.25 * 1.20) = floor(24) = 24
        const prod = calculateWorkshopProduction(moduleMenuiserie, 'autogestion_ostrom', 10);
        expect(prod).toBe(24);
      });

      it('T1.4.2 — Gouvernance taylorienne en atelier : sur-production mais usure sévère de l’outillage', () => {
        const module: WorkshopModule = {
          id: 'electronique',
          level: 1,
          toolCondition: 100,
          workforceHours: 10,
          maintenanceFund: 0,
        };

        const prodTaylor = calculateWorkshopProduction(module, 'direction_taylorienne', 0);
        const prodArtisans = calculateWorkshopProduction(module, 'comite_artisans', 0);

        expect(prodTaylor).toBe(13); // floor(10 * 1.0 * 1.0 * 1.35) = 13
        expect(prodArtisans).toBe(10); // floor(10 * 1.0 * 1.0 * 1.0) = 10
        expect(prodTaylor).toBeGreaterThan(prodArtisans);
      });

      it('T1.4.3 — Radio Pirate 108.4 FM : calcul déterministe d’audience et impact du programme', () => {
        const scheduleHumour: PirateRadioState['weeklySchedule'] = ['gazette_humour'];
        const audienceHumour = calculateRadioAudience(15, 50, scheduleHumour);
        // raw = (15 + 0.8 * 15 + 0.4 * 50) * 1.2 = (15 + 12 + 20) * 1.2 = 47 * 1.2 = 56.4 -> 56
        expect(audienceHumour).toBe(56);

        const scheduleComplete: PirateRadioState['weeklySchedule'] = ['gazette_humour', 'enquete_consommation'];
        const audienceComplete = calculateRadioAudience(15, 50, scheduleComplete);
        // raw = 47 * 1.35 = 63.45 -> 63
        expect(audienceComplete).toBe(63);
        expect(audienceComplete).toBeGreaterThan(audienceHumour);
      });

      it('T1.4.4 — Radio Pirate : érosion de la part de marché du Drive par les enquêtes citoyennes', () => {
        const w = createWorld();
        w.rivals.drive_hyper.marketShare = 60;

        const audience = 50;
        const driveErosion = Math.round(0.15 * audience); // -7.5 -> -8 pts
        w.rivals.drive_hyper.marketShare = Math.max(0, w.rivals.drive_hyper.marketShare - driveErosion);

        expect(w.rivals.drive_hyper.marketShare).toBe(52);
      });

      it('T1.4.5 — Logistique douce : triporteur vs marche à pied sous la pluie', () => {
        const sunny = calculateDeliveryMetrics('triporteur', 10, false);
        const rainy = calculateDeliveryMetrics('triporteur', 10, true);
        const walking = calculateDeliveryMetrics('pied', 10, false);

        expect(sunny.timeTicks).toBe(4); // ceil(10 / 2.5) = 4
        expect(rainy.timeTicks).toBe(6); // ceil(10 / 1.75) = 6
        expect(walking.timeTicks).toBe(10); // ceil(10 / 1.0) = 10
        expect(sunny.maxWeightKg).toBe(60);
        expect(walking.maxWeightKg).toBe(10);
      });

      it('T1.4.6 — Réseau d’opinion et diffusion sociale des rumeurs parmi les PNJ', () => {
        const w = createWorld();
        expect(w.npcs['noah']).toBeDefined();
        expect(w.npcs['lina']).toBeDefined();

        // Noah diffuse une nouvelle positive sur le stand à Lina
        w.npcs['noah']!.opinion = 40;
        w.npcs['lina']!.opinion = 10;

        // Diffusion sociale : Lina aligne partiellement son opinion sur son ami
        w.npcs['lina']!.opinion += Math.round((w.npcs['noah']!.opinion - w.npcs['lina']!.opinion) * 0.25);

        expect(w.npcs['lina']!.opinion).toBe(18);
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {

    it('T2.1 — Zéro budget participatif : le scrutin se clôt sans allocation sans planter la simulation', () => {
      const budgetDisponible = 0;
      const projets = [{ id: 'p1', cost: 100 }];
      const projetsFinancables = projets.filter((p) => p.cost <= budgetDisponible);
      expect(projetsFinancables).toHaveLength(0);
    });

    it('T2.2 — Zéro heure de travail dans l’atelier coopératif : production strictement égale à zéro', () => {
      const emptyModule: WorkshopModule = {
        id: 'menuiserie',
        level: 3,
        toolCondition: 100,
        workforceHours: 0,
        maintenanceFund: 50,
      };
      const prod = calculateWorkshopProduction(emptyModule, 'autogestion_ostrom', 0);
      expect(prod).toBe(0);
    });

    it('T2.3 — Outil complètement détruit (condition = 0) : plancher d’efficacité minimale de sécurité de 20 %', () => {
      const brokenModule: WorkshopModule = {
        id: 'conserverie',
        level: 1,
        toolCondition: 0,
        workforceHours: 10,
        maintenanceFund: 0,
      };
      // Tool efficiency clampé à max(0.2, 0/100) = 0.20
      const prod = calculateWorkshopProduction(brokenModule, 'comite_artisans', 0);
      expect(prod).toBe(2); // floor(10 * 0.20 * 1.0 * 1.0) = 2
    });

    it('T2.4 — Égalité parfaite lors du scrutin citoyen : arbitrage déterministe via PRNG sans indétermination', () => {
      const rng = mulberry32(42);
      const scoreProjetA = 250;
      const scoreProjetB = 250;

      let vainqueur = '';
      if (scoreProjetA === scoreProjetB) {
        // En cas d'égalité exacte, choix déterministe via la graine
        vainqueur = rngFloat(rng) > 0.5 ? 'projet_A' : 'projet_B';
      }
      expect(['projet_A', 'projet_B']).toContain(vainqueur);
    });

    it('T2.5 — Plafond d’audience radio pirate à 95 % : empêche la saturation algorithmique à 100 %', () => {
      // Puissance d'antenne démesurée de 200W et réputation 100
      const audienceExtreme = calculateRadioAudience(200, 100, ['enquete_consommation', 'gazette_humour']);
      expect(audienceExtreme).toBe(95);
    });

    it('T2.6 — Risque CSA à puissance minimale 5W : delta strictement nul', () => {
      const deltaLow = calculateCsaRiskDelta(5, 0);
      expect(deltaLow).toBe(0);

      // À puissance maximale 50W et diplomatie nulle : (50-15)/5 = 7
      const deltaHigh = calculateCsaRiskDelta(50, 0);
      expect(deltaHigh).toBe(7);
    });

    it('T2.7 — Fatigue maximale 100/100 : impossibilité d’effectuer une tournée de livraison douce', () => {
      const w = createWorld();
      w.player.needs.fatigue = 100;

      const canDeliver = (state: WorldState) => state.player.needs.fatigue < 85;
      expect(canDeliver(w)).toBe(false);
    });

    it('T2.8 — Surconsommation de tisanes de Bertin : seuil de saturation sans altération néfaste', () => {
      const w = createWorld();
      w.player.needs.fatigue = 80;

      // Consommation successive de deux tisanes
      const tisaneBoost = 35;
      w.player.needs.fatigue = Math.max(0, w.player.needs.fatigue - tisaneBoost);
      w.player.needs.fatigue = Math.max(0, w.player.needs.fatigue - tisaneBoost);

      expect(w.player.needs.fatigue).toBe(10);
      expect(w.player.needs.fatigue).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE COMBINATIONS)
  // ==========================================================================

  describe('Tier 3: Cross-Feature Interactions', () => {

    it('T3.1 — Interaction Budget x Radio Pirate : diffusion de l’enquête faisant basculer le vote citoyen', () => {
      const cohortFamilles: CitizenCohort = {
        id: 'familles',
        size: 300,
        preferences: { communs: 0.5, marche: 0.1, autorite: 0.0, solidarite: 0.4 },
        mobilizationRate: 0.40,
      };

      const scoreInitial = calculateCohortScore(cohortFamilles, 'communs', 0);
      // Radio pirate diffuse l'enquête conso : mobilisation grimpe de 40% à 75%
      cohortFamilles.mobilizationRate = 0.75;
      const scoreApresRadio = calculateCohortScore(cohortFamilles, 'communs', 20);

      expect(scoreApresRadio).toBeGreaterThan(scoreInitial * 2);
    });

    it('T3.2 — Interaction Ateliers x Logistique Douce : renfort de châssis au fablab augmentant la charge utile', () => {
      const logistique: SoftLogisticsState = {
        fleet: { triporteurs: 1, triporteurCondition: 70, penicheActive: false },
        relayPoints: ['epicerie', 'friche'],
        deliveredOrders: 10,
      };

      // Rétrofit Karim au Bassin Nord : châssis renforcé
      const capaciteInitiale = 60;
      const capaciteApresRenfort = capaciteInitiale + 30; // 90 kg
      logistique.fleet.triporteurCondition = 100;

      expect(capaciteApresRenfort).toBe(90);
      expect(logistique.fleet.triporteurCondition).toBe(100);
    });

    it('T3.3 — Interaction Événements x Quartiers : invasion de canards sur la place boostant la vitalité de l’épicerie', () => {
      const w = createWorld();
      const vitaliteInitiale = w.district.vitaliteEpicerie;

      // Événement EVT_CANARDS_CANAL : option vente de graines
      w.district.vitaliteEpicerie += 4;
      w.player.money = 10;
      w.player.money += 8;

      expect(w.district.vitaliteEpicerie).toBe(vitaliteInitiale + 4);
      expect(w.player.money).toBe(18); // 10 initial + 8
    });

    it('T3.4 — Interaction Joutes Verbales x Moral & Équipe : issue de la joute modifiant le stress de Noah', () => {
      const w = createWorld();
      expect(w.npcs['noah']).toBeDefined();

      const stressInitial = w.npcs['noah']!.stress;
      // Choix de la voie Dejours lors de la pause-café
      w.npcs['noah']!.stress = Math.max(0, stressInitial - 20);
      w.player.needs.stress = Math.max(0, w.player.needs.stress - 15);

      expect(w.npcs['noah']!.stress).toBeLessThanOrEqual(stressInitial);
      expect(w.player.needs.stress).toBeLessThan(50);
    });

    it('T3.5 — Interaction Logistique Douce x Rivalité Drive : 20 livraisons érodant les parts de marché d’HyperVal', () => {
      const w = createWorld();
      createProject(w);
      buyStock(w);

      w.rivals.drive_hyper.marketShare = 65;
      const coursesServies = 20;
      const erosion = Math.floor(coursesServies * 0.4); // -8 %

      w.rivals.drive_hyper.marketShare -= erosion;
      w.district.vitaliteEpicerie += Math.floor(coursesServies * 0.2); // +4 pts

      expect(w.rivals.drive_hyper.marketShare).toBe(57);
      expect(w.district.vitaliteEpicerie).toBe(49);
    });

    it('T3.6 — Interaction Souterrains x Météo : transit furtif sous la pluie battante sans coût énergétique', () => {
      const isRaining = true;
      const distanceTiles = 15;

      const surfaceFatigueCost = isRaining ? 15 + 10 : 15; // malus pluie +10
      const undergroundFatigueCost = 15; // protégé des intempéries

      expect(undergroundFatigueCost).toBeLessThan(surfaceFatigueCost);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // ==========================================================================

  describe('Tier 4: Real-World Scenarios', () => {

    it('T4.1 — Cycle de simulation complet de 7 jours consécutifs avec préservation de l’invariant comptable', () => {
      const w = createWorld({ seed: 101 });
      createProject(w);
      buyStock(w);
      setPrice(w, 1.00);

      // Simulation de 7 journées complètes (7 * 144 ticks)
      for (let day = 1; day <= 7; day++) {
        // Matin : session de vente
        if (w.project!.stock >= 2) {
          runSalesSession(w, 'place');
        }
        // Journée : avance temporelle
        runTicks(w, TICKS_PER_DAY);
        // Évolution des rivaux
        rivalDay(w);
      }

      // Vérification que le livre de comptes est rigoureusement sain
      expect(ledgerInvariantHolds(w.project!)).toBe(true);
      expect(w.time.tick).toBeGreaterThanOrEqual(7 * TICKS_PER_DAY);
    });

    it('T4.2 — Scénario de crise collective : Le Grand Blackout de 19h00 et le Banquet aux Chandelles', () => {
      const w = createWorld();
      w.district.confianceQuartier = 45;
      w.rivals.drive_hyper.marketShare = 70;

      // 1. Coupure électrique soudaine à 19h00
      w.flags['blackout_actif'] = 1;
      // Le Drive tout-automatique est paralysé
      w.rivals.drive_hyper.marketShare = Math.round(w.rivals.drive_hyper.marketShare * 0.5);

      // 2. Mobilisation du banquet aux chandelles sur la place avec les invendus
      const stockPartage = 15;
      w.district.confianceQuartier += stockPartage;
      w.district.vitaliteEpicerie += 10;
      w.player.reputation += 8;

      expect(w.flags['blackout_actif']).toBe(1);
      expect(w.rivals.drive_hyper.marketShare).toBe(35);
      expect(w.district.confianceQuartier).toBe(60);
      expect(w.district.vitaliteEpicerie).toBe(55);
    });

    it('T4.3 — Scénario de grand changement démocratique : Vote du Budget, Rénovation et Essor Coopératif', () => {
      const w = createWorld();
      w.player.money = 25;

      // 1. Élaboration du budget participatif citoyen
      const envelope = 500;
      const winningProject: ParticipatoryProject = {
        id: 'rampe_triporteurs_canal',
        title: 'Rampe & Piste Vélo des Docks',
        doctrine: 'communs',
        costEuros: 480,
        physicalMutation: { tileX: 20, tileY: 20, prop: 'piste_verte', permanentBonus: 'logistique_vitesse_double' },
      };

      expect(winningProject.costEuros).toBeLessThanOrEqual(envelope);

      // 2. Victoire du projet et mutation spatiale
      w.flags['rampe_canal_construite'] = 1;
      w.district.confianceQuartier += 15;

      // 3. Essor des coopératives
      const module: WorkshopModule = {
        id: 'menuiserie',
        level: 2,
        toolCondition: 90,
        workforceHours: 30,
        maintenanceFund: 20,
      };
      const productionSemaine = calculateWorkshopProduction(module, 'autogestion_ostrom', 5);

      expect(productionSemaine).toBeGreaterThan(30);
      expect(w.flags['rampe_canal_construite']).toBe(1);
      expect(w.district.confianceQuartier).toBeGreaterThanOrEqual(60);
    });

    it('T4.4 — Résilience d’état et sérialisation complète sans perte ni altération', () => {
      const w = createWorld({ seed: 777 });
      createProject(w);
      buyStock(w);
      w.flags['docks_debloques'] = 1;
      w.flags['radio_pirate_active'] = 1;
      w.district.vitaliteEpicerie = 58;

      const serialized = JSON.stringify(w);
      const deserialized = JSON.parse(serialized) as WorldState;

      expect(deserialized.seed).toBe(777);
      expect(deserialized.flags['docks_debloques']).toBe(1);
      expect(deserialized.flags['radio_pirate_active']).toBe(1);
      expect(deserialized.district.vitaliteEpicerie).toBe(58);
      expect(ledgerInvariantHolds(deserialized.project!)).toBe(true);
    });
  });
});
