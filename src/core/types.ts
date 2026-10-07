/**
 * NEURAPOLIS — Schémas de l'état du monde (contrat unique simulation ↔ présentation).
 * Règle d'or : TOUT ce qui est simulé vit ici ; le rendu ne fait que lire.
 * Identifiants stables : jamais renommer un id une fois publié.
 */

// ---------- Identifiants ----------
export type PlaceId = 'maison' | 'college' | 'epicerie' | 'friche' | 'parc' | 'place';
export type SkillId =
  | 'negociation' | 'comptabilite' | 'communication'
  | 'organisation' | 'technique' | 'recherche';
export type NeedId = 'fatigue' | 'faim' | 'stress' | 'moral';
export type GhostId = string; // 'smith', 'marx', … (stables)
export type NpcId = string;   // 'noah', 'lina', … (stables)

// ---------- Temps ----------
export type Speed = 0 | 1 | 5 | 20;
export interface TimeState { tick: number; speed: Speed }
export const MINUTES_PER_TICK = 10;
export const TICKS_PER_DAY = 144; // 24h × 6 ticks/h
export const GAME_START_ISO = '2020-09-01'; // mardi 1er septembre 2020, rentrée
export const STARTING_PLAYER_AGE = 12;

export interface GameDate { y: number; m: number; d: number; weekday: number; iso: string; label: string }

// ---------- Joueur ----------
/** Les six caractéristiques fondamentales de la Bible de game design (0-100). */
export interface Characteristics {
  comprehension: number; // capacité à analyser et apprendre
  creativite: number;    // imaginer des solutions
  influence: number;     // convaincre, rassembler
  discipline: number;    // tenir un engagement
  adaptabilite: number;  // réagir aux imprévus
  confiance: number;     // confiance en soi
}
export type CharacteristicsId = keyof Characteristics;

export interface Needs { fatigue: number; faim: number; stress: number; moral: number }

export interface Skill { level: 0 | 1 | 2 | 3; xp: number }

/** Apparence persistée du joueur, choisie à la création de partie. */
export type PlayerGender = 'fille' | 'garcon' | 'non-binaire';
export type PlayerSkinTone =
  | 'porcelaine' | 'claire' | 'rosee' | 'doree' | 'olive' | 'chaude' | 'ambree' | 'cuivree' | 'brune' | 'ebene';
export type PlayerHairColor =
  | 'brun' | 'chatain' | 'blond' | 'roux' | 'noir' | 'platine' | 'gris' | 'bleu' | 'rose' | 'vert';
export type PlayerHairStyle =
  | 'court' | 'mi-long' | 'boucle' | 'tresse' | 'couettes' | 'rase' | 'degrade' | 'long' | 'afro' | 'locks'
  | 'chignon' | 'queue' | 'frange' | 'crete';
/** Tenues : les quatre de départ, puis celles qui se gagnent avec les paliers de l'Ascension. */
export type PlayerOutfitStyle =
  | 'ecolier' | 'artisan' | 'sportif' | 'citoyen' | 'streetwear' | 'entrepreneur' | 'dirigeant' | 'magnat';
export type PlayerOutfitColor =
  | 'denim' | 'coral' | 'vert' | 'ocre' | 'indigo' | 'noir' | 'blanc' | 'bordeaux' | 'moutarde' | 'ciel';
export type PlayerBody = 'fine' | 'moyenne' | 'sportive' | 'ronde';
export type PlayerEyes = 'ronds' | 'amande' | 'tombants' | 'rieurs';
export type PlayerEyeColor = 'brun' | 'noisette' | 'vert' | 'bleu' | 'gris';
export type PlayerGlasses = 'aucune' | 'rondes' | 'carrees' | 'ecaille' | 'fines' | 'soleil';
export type PlayerBeard = 'aucune' | 'duvet' | 'moustache' | 'courte' | 'pleine';
export type PlayerAccessory = 'aucun' | 'casquette' | 'bonnet' | 'ecouteurs' | 'montre' | 'echarpe' | 'sac_dos' | 'sacoche';
export type BodyShapeKey = 'epaules' | 'poitrine' | 'taille' | 'hanches' | 'fessier' | 'ventre' | 'muscles' | 'cuisses';
export type BodyShape = Partial<Record<BodyShapeKey, number>>;
export const BODY_SHAPE_KEYS: readonly BodyShapeKey[] = ['epaules', 'poitrine', 'taille', 'hanches', 'fessier', 'ventre', 'muscles', 'cuisses'];
export const BODY_SHAPE_INFO: Record<BodyShapeKey, { label: string; low: string; high: string }> = {
  epaules: { label: 'Épaules', low: 'étroites', high: 'larges' },
  poitrine: { label: 'Poitrine / pectoraux', low: 'plate', high: 'volumineuse' },
  taille: { label: 'Tour de taille', low: 'marqué', high: 'droit' },
  hanches: { label: 'Hanches', low: 'étroites', high: 'larges' },
  fessier: { label: 'Fessier', low: 'plat', high: 'rond' },
  ventre: { label: 'Ventre', low: 'plat', high: 'rond' },
  muscles: { label: 'Musculature', low: 'menue', high: 'très musclée' },
  cuisses: { label: 'Cuisses', low: 'fines', high: 'fortes' },
};

export interface PlayerAppearance {
  skinTone: PlayerSkinTone;
  hairColor: PlayerHairColor;
  hairStyle: PlayerHairStyle;
  outfitStyle: PlayerOutfitStyle;
  outfitColor: PlayerOutfitColor;
  /** Personnalisation approfondie (save v23) ; absentes = valeurs par défaut. */
  body?: PlayerBody;
  /** Ancienne échelle de taille (−2 … +2), remplacée par `adultHeightCm` (save v25). */
  heightAdj?: number;
  /** Taille adulte visée, en cm (145 – 205) : la taille réelle suit la croissance (save v25). */
  adultHeightCm?: number;
  /**
   * Silhouette adulte (save v25) : chaque trait de −1 à +1, 0 = moyen. Elle ne s'applique qu'à
   * partir de 18 ans ; avant, le corps suit l'âge.
   */
  physique?: BodyShape;
  eyes?: PlayerEyes;
  eyeColor?: PlayerEyeColor;
  glasses?: PlayerGlasses;
  freckles?: boolean;
  /** Disponible à partir de 16 ans. */
  beard?: PlayerBeard;
  accessory?: PlayerAccessory;
}
/** Valeurs permises — source unique pour la création de personnage et les migrations. */
export const VALID_GENDERS: readonly PlayerGender[] = ['fille', 'garcon', 'non-binaire'];
export const VALID_SKIN_TONES: readonly PlayerSkinTone[] = ['porcelaine', 'claire', 'rosee', 'doree', 'olive', 'chaude', 'ambree', 'cuivree', 'brune', 'ebene'];
export const VALID_HAIR_COLORS: readonly PlayerHairColor[] = ['brun', 'chatain', 'blond', 'roux', 'noir', 'platine', 'gris', 'bleu', 'rose', 'vert'];
export const VALID_HAIR_STYLES: readonly PlayerHairStyle[] = ['court', 'mi-long', 'boucle', 'tresse', 'couettes', 'rase', 'degrade', 'long', 'afro', 'locks', 'chignon', 'queue', 'frange', 'crete'];
export const VALID_OUTFIT_STYLES: readonly PlayerOutfitStyle[] = ['ecolier', 'artisan', 'sportif', 'citoyen', 'streetwear', 'entrepreneur', 'dirigeant', 'magnat'];
export const VALID_OUTFIT_COLORS: readonly PlayerOutfitColor[] = ['denim', 'coral', 'vert', 'ocre', 'indigo', 'noir', 'blanc', 'bordeaux', 'moutarde', 'ciel'];
export const VALID_BODIES: readonly PlayerBody[] = ['fine', 'moyenne', 'sportive', 'ronde'];
export const VALID_EYES: readonly PlayerEyes[] = ['ronds', 'amande', 'tombants', 'rieurs'];
export const VALID_EYE_COLORS: readonly PlayerEyeColor[] = ['brun', 'noisette', 'vert', 'bleu', 'gris'];
export const VALID_GLASSES: readonly PlayerGlasses[] = ['aucune', 'rondes', 'carrees', 'ecaille', 'fines', 'soleil'];
export const VALID_BEARDS: readonly PlayerBeard[] = ['aucune', 'duvet', 'moustache', 'courte', 'pleine'];
export const VALID_ACCESSORIES: readonly PlayerAccessory[] = ['aucun', 'casquette', 'bonnet', 'ecouteurs', 'montre', 'echarpe', 'sac_dos', 'sacoche'];
export const DEFAULT_PLAYER_APPEARANCE: PlayerAppearance = {
  skinTone: 'claire',
  hairColor: 'chatain',
  hairStyle: 'court',
  outfitStyle: 'ecolier',
  outfitColor: 'coral',
  body: 'moyenne',
  heightAdj: 0,
  eyes: 'ronds',
  eyeColor: 'brun',
  glasses: 'aucune',
  freckles: false,
  beard: 'aucune',
  accessory: 'aucun',
};

/** Apprentissage en 4 étapes (Bible §5) : 1 découverte, 2 explication, 3 application, 4 maîtrise. */
export type NotionStage = 1 | 2 | 3 | 4;
export interface Notion { id: string; stage: NotionStage; applications: number }

/** Relations à quatre dimensions (Bible §7) — jamais une jauge unique. */
export interface Rel4 { amitie: number; confiance: number; respect: number; rivalite: number }
export const ZERO_REL: Rel4 = { amitie: 0, confiance: 0, respect: 0, rivalite: 0 };

export interface Player {
  name: string;
  firstName: string;
  lastName: string;
  gender: PlayerGender;
  appearance: PlayerAppearance;
  age: number;
  characteristics: Characteristics;
  needs: Needs;
  skills: Record<SkillId, Skill>;
  notions: Record<string, Notion>;
  money: number;          // trésorerie personnelle (€)
  reputation: number;     // 0-100, réputation dans le quartier
  relations: Record<NpcId, Rel4>;
  pos: { x: number; y: number }; // position tuiles sur la carte
  asleep: boolean;
}

// ---------- PNJ ----------
export interface RoutineSlot {
  from: string; // 'HH:MM'
  to: string;   // 'HH:MM'
  place: PlaceId;
  activity: string; // libellé court affiché
  weekends?: boolean; // true si ce créneau s'applique aussi le week-end
}

export interface NpcDef {
  id: NpcId;
  name: string;
  age: number;
  role: string;
  traits: string[];
  color: string;
  routine: RoutineSlot[];
  /** Phares de dialogue : thème → répliques (choix multiples gérés côté présentation). */
  topics: Record<string, string[]>;
}

export interface NpcState {
  id: NpcId;
  place: PlaceId;
  activity: string;
  stress: number;   // simplifié niveau A/B
  moral: number;
  memory: string[]; // ids d'événements vécus (mémoire sélective, Bible §6)
  opinion: number;  // -100..100 opinion sur le joueur
}

// ---------- Fantômes (Conseil) ----------
export type GhostStatus =
  | 'inconnu'    // pas encore apparu (silhouette)
  | 'refuse'     // repoussé à son arrivée ; reviendra plus tard à condition majorée
  | 'actif'      // voix écoutée (max 4)
  | 'endormi'    // présent mais silencieux (loyauté −1/jour)
  | 'hostile'    // loyauté < 20 : perturbe au lieu de conseiller
  | 'mort'       // oublié (loyauté 0 pendant 3 jours) — silhouette grise
  | 'fusionne';  // absorbé dans un fantôme composite

export interface GhostAdviceRecord {
  day: number;
  adviceId: string;
  text: string;
  veracite: 'vraie' | 'exageree' | 'mensonge';
  followed: boolean;
  outcome?: 'bien' | 'mal' | 'neutre';
  /** Véracité secrète : jour de la rétrospection et révélation faite au joueur. */
  revealDay?: number;
  revealed?: boolean;
  /** Le joueur a-t-il répondu au conseil (suivre / ignorer) ? */
  answered?: boolean;
}

export interface GhostState {
  id: GhostId;
  status: GhostStatus;
  loyalty: number;      // 0-100, départ 50
  fiabilite: number;    // 0-100 « fiabilité perçue » (baisse si mensonge révélé)
  lastWords: string;
  history: GhostAdviceRecord[];
  loyaltyZeroDays: number;
  /** Scène d'arrivée en attente du choix du joueur (écouter / repousser). */
  arrivalPending?: boolean;
  /** Refus : jour (index) à partir duquel la voix peut revenir. */
  returnDay?: number;
  /** Refus : compteurs au moment du refus — la voix ne revient qu'en ayant avancé. */
  refusalSnapshot?: RefusalSnapshot;
  /** Jour du prochain conseil spontané (voix actives). */
  nextAdviceDay?: number;
}

/** État des compteurs au refus d'un fantôme (condition de retour majorée). */
export interface RefusalSnapshot {
  flags: Record<string, number>;
  characteristics: Record<string, number>;
  npcStress: Record<string, number>;
}

/** Fiche §6.2 du prompt maître — données statiques (src/data/ghosts). */
export interface GhostDef {
  id: GhostId;
  name: string;
  era: string;                 // époque / tradition
  generation: 1 | 2 | 3;
  color: string;               // teinte de présence
  emoji: string;
  identity: { portrait: string; life: string; became: string };
  voice: {
    favorable: string; neutre: string; hostile: string; victoire: string; echec: string;
    tics: string[];             // 3 tics de langage
    sujetsSerieux: string[];    // 3 sujets où il ne plaisante pas
    sujetsExageres: string[];   // 3 sujets où il exagère
  };
  projet: { veut: string; pourquoi: string; cacher: string };
  faille: { angleMort: string; hypocrisie: string; contradiction: string };
  arcs: { fidelite: string; rupture: string; fusion: string };
  mecanique: {
    debloque: string[];         // actions/options ouvertes
    bloque: string[];
    signature80: string;        // capacité à loyauté > 80
    hostile20: string;          // comportement à loyauté < 20
  };
  relations: { allies: GhostId[]; rivaux: GhostId[] };
  apparition: { declencheur: string; condition: (w: WorldState) => boolean; sceneId: string };
}

export interface FusionDef {
  id: string;                   // 'marche_des_communs'
  name: string;
  from: [GhostId, GhostId];
  conditions: { marches: number; communs: number }; // décisions cumulées requises
  affinite: number;             // affinité minimale de la paire (contrat M6 : 6)
  sceneId: string;
  debloque: string;
}

// ---------- Projet ----------
export interface LedgerEntry { day: number; date: string; label: string; amount: number } // amount>0 entrée, <0 sortie

export type RepartitionMode = 'egalite' | 'equite' | 'incitation';

/** Historique de commandes conservé dans la sauvegarde (les plus récentes). */
export const MAX_PENDING_DELIVERIES = 50;

export interface ProjectState {
  id: 'stand_des_roses';
  active: boolean;
  stock: number;              // unités en stock
  price: number;              // prix de vente €/unité
  members: NpcId[];           // coéquipiers recrutés
  rules: { collectif: boolean; contratSecurite: boolean };
  sessionsDone: number;
  coursesDone: number;        // services de courses pour l'épicerie
  ledger: LedgerEntry[];
  lastRepartition?: RepartitionMode; // mode choisi pour la prochaine répartition (défaut : égalité)
  balance: number;            // caisse du stand (€) — invariant : Σ(entrées − sorties) = balance
  /** Résultat hebdomadaire en cours (trésorerie ≠ résultat : le solde est cumulé, la semaine se répartit). */
  week: { index: number; revenue: number; expenses: number; distributed: boolean };
  /** Travail fourni dans la semaine, en unités de 20 min — clé 'player' + un clé par membre (équité). */
  work: Record<string, number>;
  /** Prévision de demande en attente, comparée à la prochaine session (déclencheur Simon). */
  lastForecast?: { expected: number; day: number };
  /** Commandes logistiques (Big Ambitions), bornées aux MAX_PENDING_DELIVERIES plus récentes (save v11). */
  // Champ optionnel : les ateliers créés hors du Stand n'ont pas de commandes.
  pendingDeliveries?: Array<{ id: string; orderDay: number; arrivalDay: number; units: number; cost: number; supplier: string; delivered: boolean }>;
}

// ---------- Atelier de la Friche (J5) ----------
export type SolidarityTariff = 'solidaire' | 'standard' | 'soutien';
export type RepairOrderStatus = 'disponible' | 'en_cours' | 'repare' | 'livre';

export interface RepairOrder {
  id: string;
  clientNpc: NpcId;
  clientName: string;
  item: string;
  description: string;
  difficulty: 1 | 2 | 3;
  partsRequired: number;
  basePrice: number;
  appliedTariff: SolidarityTariff;
  finalPrice: number;
  status: RepairOrderStatus;
  receivedDay: number;
  deadlineDay?: number;
}

export interface WorkshopState {
  id: 'atelier_friche';
  active: boolean;
  partner: 'karim';
  members: NpcId[];
  partsStock: number;
  toolCondition: number; // 0-100 % (100 = neuf, s'use à chaque réparation)
  orders: RepairOrder[];
  tariffMode: SolidarityTariff;
  solidarityRate: number; // taux de prélèvement pour le fonds solidaire (ex 0.20)
  solidarityFund: number; // montant de la réserve solidaire (€)
  balance: number;        // caisse d'exploitation (€) — invariant : Σ(entrées − sorties) = balance
  ledger: LedgerEntry[];
  week: {
    index: number;
    revenue: number;
    expenses: number;
    repairsCount: number;
    distributed: boolean;
  };
  work: Record<string, number>; // heures de travail investies ('player', 'karim')
  completedRepairsCount: number;
}

// ---------- Territoire ----------
export type Meteo = 'soleil' | 'nuages' | 'pluie';

export interface DistrictState {
  vitaliteEpicerie: number;   // 0-100 (départ 45 ; <35 fermeture envisagée ; >60 embauche)
  confianceQuartier: number;  // 0-100
  frequentationParc: number;  // 0-100
  meteo: Meteo;
}

// ---------- Événements & journaux ----------
export interface CauseFactor { facteur: string; seuil?: string; poids: number } // poids 1-3

export type EventType =
  | 'vie' | 'opportunite' | 'conflit' | 'decouverte' | 'consequence'
  | 'conseil' | 'fusion' | 'antagonisme' | 'quartier' | 'systeme';

export interface GameEvent {
  id: string;
  day: number;
  date: string;
  type: EventType;
  title: string;
  text: string;
  causes: CauseFactor[];      // journal des causes — « pourquoi ceci ? »
}

export interface LifeJournalEntry { day: number; date: string; title: string; text: string }

export interface Notification {
  kind: 'info' | 'bien' | 'alerte' | 'fantome' | 'journal';
  text: string;
  ghost?: GhostId;
}

// ---------- Conseil ----------
/** Doctrine d'une décision clé : marché, communs, autorité, solidarité. */
export type DoctrineKey = 'marche' | 'communs' | 'autorite' | 'solidarite';

/** Progression d'une fusion : décisions prises avec les deux voix actives. */
export interface FusionProgress { marches: number; communs: number }

export interface CouncilState {
  ghosts: Record<GhostId, GhostState>;
  /** Compteurs de décisions alignées par doctrine, pour les apparitions et fusions. */
  decisions: { marche: number; communs: number; autorite: number; solidarite: number };
  fusionProgress: Record<string, FusionProgress>; // ex. 'smith+ostrom'
  fusionsDone: string[];
  /** Affinité par paire de voix (clé triée 'a+b') : +1 quand les deux approuvent la même décision. */
  affinities: Record<string, number>;
  /** Fusion prête : id du FusionDef dont la scène attend le joueur. */
  pendingFusion?: string;
  contratSecurite: { active: boolean; sinceDay?: number; proposedDay?: number } | null;
  allianceDesOmbres: number;   // jauge teaser super-antagoniste
}

// ---------- Concurrence & Rivaux ----------
export type RivalId = 'drive_hyper' | 'distributeur_college';

export type RivalStrategy = 'prix_casse' | 'campagne_com' | 'fidelite' | 'standard';

/** Résultat des transactions d'un lieu pendant une journée de marché. */
export interface RivalMarketObservation {
  day: number;
  playerUnitsSold: number;
  rivalUnitsServed: number;
  sessions: number;
  /** Dernière journée réellement observée; null tant qu'aucune session n'a été clôturée. */
  lastClosed: {
    day: number;
    playerUnitsSold: number;
    rivalUnitsServed: number;
    sessions: number;
  } | null;
}

export interface RivalState {
  id: RivalId;
  name: string;
  place: PlaceId;
  marketShare: number;       // 0-100, part de marché sur son secteur
  price: number;             // prix de son offre (€)
  quality: number;           // 0-100 qualité perçue
  aggressiveness: number;    // 0-100 agressivité commerciale
  strategy: RivalStrategy;
  activeCounterActions: ActiveCounterAction[]; // contre-stratégies actives et date d'expiration (jour exclusif)
  reactionCooldown: number;  // jours avant prochaine réaction tactique
  /** Unités réellement vendues par le joueur; le rival sert la demande restante (stock abstrait illimité). */
  marketObservation: RivalMarketObservation;
}

export interface ActiveCounterAction {
  strategyId: string;
  expiresDay: number;
}

export interface CounterStrategyDef {
  id: string;
  rivalId: RivalId;
  label: string;
  description: string;
  costMoney: number;
  costTimeMinutes: number;
  durationDays: number;
  playerShareBonus: number;
  rivalSharePenalty: number;
  reputationBonus: number;
}

// ---------- Campagne & Vie (Progression 12 ans → suite) ----------
export interface CampaignStage {
  id: string;
  chapter: number;
  title: string;
  targetAge: number;
  objective: string;
  completed: boolean;
}

export interface DelayedConsequence {
  id: string;
  triggerDay: number;
  title: string;
  text: string;
  impactType: 'reputation' | 'money' | 'relation' | 'quartier';
  value: number;
  targetNpc?: NpcId;
}

export interface CampaignState {
  currentChapter: number;
  stages: CampaignStage[];
  completedChapters: number[];
  delayedConsequences: DelayedConsequence[];
}

// ---------- Marchands & Niveaux de profondeur (Tiers) ----------
export type VendorId = 'bertin' | 'karim' | 'friche_scrap' | 'docks_grossiste' | 'tramway_express';
export type VendorTier = 0 | 1 | 2 | 3;

export interface VendorRelationship {
  vendorId: VendorId;
  name: string;
  location: PlaceId | string;
  tier: VendorTier;
  spentTotal: number;
  tradeCount: number;
  discountRate: number; // e.g. 0.05, 0.12, 0.20
  unlockedPerks: string[];
  friendshipDialogueUnlocked: boolean;
  specialStockAvailable: boolean;
}

export interface VendorsState {
  vendors: Record<VendorId, VendorRelationship>;
}

// ---------- Plans d’Action & Cartographie Stratégique ----------
export type ActionPlanCategory =
  | 'approvisionnement'
  | 'optimisation_reseau'
  | 'expansion_territoire'
  | 'contre_offensive'
  | 'diplomatie_locale';

export interface ActionPlanStepState {
  id: string;
  label: string;
  completed: boolean;
}

export interface ActionPlanState {
  id: string;
  title: string;
  category: ActionPlanCategory;
  description: string;
  ghostAdvisorId?: GhostId;
  ghostInsight: string;
  steps: ActionPlanStepState[];
  active: boolean;
  completed: boolean;
  unlockedDay: number;
  rewardDescription: string;
}

export type TerritorialZoneId =
  | 'roses'
  | 'bassin'
  | 'caves'
  | 'hauts'
  | 'tramway'
  | 'docks'
  | 'ville_voisine'
  | 'metropole_regionale'
  | 'national';

export interface TerritoryNodeState {
  id: TerritorialZoneId;
  name: string;
  unlocked: boolean;
  marketPotential: number; // 0-100
  ourPresence: number;      // 0-100
  competitorPresence: number; // 0-100
  activeArrangement: boolean;
  concessionCost: number;
}

export interface ActionPlanningState {
  plans: Record<string, ActionPlanState>;
  activePlanId?: string;
  territory: Record<TerritorialZoneId, TerritoryNodeState>;
  expansionLevel: 'quartier' | 'inter_quartiers' | 'ville' | 'regionale' | 'nationale';
}

// ---------- Multi-Activités & Attribution des Rôles ----------
export type VentureId =
  | 'stand_roses'
  | 'atelier_friche'
  | 'coursiers_doux'
  | 'gazette_citoyenne'
  | 'grossiste_regional';

export type VentureRole =
  | 'directeur'
  | 'logistique'
  | 'negociateur'
  | 'tresorier'
  | 'qualite';

export interface VentureState {
  id: VentureId;
  name: string;
  active: boolean;
  roles: Partial<Record<VentureRole, NpcId>>;
  dailyRevenue: number;
  dailyExpenses: number;
  level: number;
}

export interface EconomicHazard {
  id: string;
  ventureId: VentureId;
  title: string;
  description: string;
  type: 'vol_gouters' | 'erreur_marge' | 'rupture_fournisseur' | 'guerre_prix' | 'controle_concession';
  severity: number;
  resolved: boolean;
  costToResolve: number;
  ghostAdviceText: string;
  ghostAdvisorId: GhostId;
}

export interface MultiVentureState {
  ventures: Record<VentureId, VentureState>;
  hazards: EconomicHazard[];
  synergiesActive: string[];
}

// ---------- Actualités Macroéconomiques & Chocs de Marché ----------
export type MacroTrend =
  | 'inflation'
  | 'deflation'
  | 'penurie'
  | 'greve_transports'
  | 'croissance_locale'
  | 'stabilite';

export interface MacroNewsItem {
  id: string;
  day: number;
  date: string;
  headline: string;
  summary: string;
  trend: MacroTrend;
  costModifier: number;   // +0.20 pour +20% coût intrants
  demandModifier: number; // +0.15 pour +15% demande
  activeUntilDay: number;
}

export interface MacroNewsState {
  currentTrend: MacroTrend;
  costModifier: number;
  demandModifier: number;
  feed: MacroNewsItem[];
}

// ---------- Études, École & Dynamique Familiale ----------
export interface SchoolLifeState {
  attendanceRate: number;              // 0-100 %
  consecutiveClassesAttended: number;
  skippedClassesCount: number;
  academicAverage: number;             // Note sur 20
  parentSentiment: 'tres_inquiet' | 'inquiet' | 'neutre' | 'satisfait' | 'tres_fier';
  parentCongratulatedCount: number;
  teacherWarningActive: boolean;
  negotiatedExemption: boolean;
  lastParentInteractionDay: number;
  lastParentMessage: string;
}

// ---------- Combinaisons Cachées & Reconnaissance de Rue ----------
export interface StreetRecognitionState {
  streetReputationLevel: number;       // 0-100
  spontaneousEncounterPending: boolean;
  lastEncounterDay: number;
  hiddenSynergiesUnlocked: string[];
  lastEncounterDialogue?: string;
}

// ---------- Tutoriels Mini & Accessibilité ----------
export interface TutorialItem {
  id: string;
  title: string;
  body: string;
  unlocked: boolean;
  seen: boolean;
}

export interface TutorialState {
  tutorials: Record<string, TutorialItem>;
  pendingTutorialId?: string;
}

// ---------- Compagnon Fantôme Kawaii / Mini-Widget ----------
export interface GhostCompanionState {
  activeGhostId?: GhostId;
  mood: 'curieux' | 'enthousiaste' | 'inquiet' | 'tactique' | 'malicieux';
  speechBubble?: string;
  lastAdviceTick: number;
  unlockedThinkers: GhostId[];
}

// ---------- Monde ----------
import type { EconomyState } from './economy_types';
import type { AscensionState } from './ascension_types';
import type { HappeningsState } from './happenings_types';
import type { RewindState } from './rewind_types';
import type { FamilyState } from './family_types';
import type { RoomState } from './room_types';
import type { StoryState } from './story_types';
import type { MultiplayerState } from './multiplayer_types';

export interface WorldState {
  version: number;
  seed: number;
  rng: number;                // état courant du PRNG (mulberry32)
  time: TimeState;
  player: Player;
  npcs: Record<NpcId, NpcState>;
  council: CouncilState;
  project?: ProjectState;
  workshop?: WorkshopState;
  district: DistrictState;
  rivals: Record<RivalId, RivalState>;
  campaign: CampaignState;
  vendors?: VendorsState;
  actionPlanning?: ActionPlanningState;
  multiVentures?: MultiVentureState;
  macroNews?: MacroNewsState;
  schoolLife?: SchoolLifeState;
  streetRecognition?: StreetRecognitionState;
  tutorials?: TutorialState;
  ghostCompanion?: GhostCompanionState;
  /** Économie « Big Ambitions » : baux, commerces, employés, prêts (save v13). */
  economy?: EconomyState;
  /** L'Ascension : paliers, idées de business, doubles faces, carnet d'économie (save v17). */
  ascension?: AscensionState;
  /** Fil d'infos du monde et surprises (save v18). */
  happenings?: HappeningsState;
  /** Retours en arrière : leçons, sacrifices, dernière très grosse erreur (save v19). */
  rewind?: RewindState;
  /** Parents, cours, absences, convocations, dîners (save v20). */
  family?: FamilyState;
  /** Chambre-quartier général : objets et plans (save v21). */
  room?: RoomState;
  /** Récit : origine des voix, cahiers de Lucien (save v22). */
  story?: StoryState;
  /** Multijoueur en LAN : autres joueurs, alliances, sabotages, dettes (save v24). */
  multiplayer?: MultiplayerState;
  events: GameEvent[];        // journal des événements (cap 250)
  lifeJournal: LifeJournalEntry[];
  flags: Record<string, number>; // compteurs libres (ventes, conflits, prévisions ratées…)
  seen: Record<string, boolean>; // événements déjà déclenchés (once)
}
