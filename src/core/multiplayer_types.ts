/**
 * Multijoueur en LAN (save v24) : ce que le monde d'un joueur retient des autres joueurs.
 *
 * Mondes parallèles reliés : chaque joueur garde sa propre simulation ; le réseau apporte des
 * événements (prêts, alliances, sabotages…) appliqués par des fonctions pures
 * (src/simulation/multiplayer.ts). Rien ici ne dépend du réseau : sans session, le champ reste
 * vide et le jeu solo est inchangé.
 */
import type { ProductCategory } from './economy_types';

/** Les 14 mécaniques (identifiants partagés avec les textes d'AG-3, src/data/multi/flavor.ts). */
export type MultiMechanicId =
  | 'pret' | 'coentreprise' | 'achats_groupes' | 'recommandation' | 'formation' | 'garant_mutuel'
  | 'entente_prix'
  | 'guerre_des_prix' | 'rumeur' | 'debauchage' | 'signalement' | 'rachat_fournisseur' | 'espionnage' | 'bail_coupe';

/** Règles de la partie, choisies par l'hôte. */
export type MultiMode = 'cooperation' | 'libre' | 'rivalite';

/** Commerce d'un autre joueur, vu comme un concurrent dans ton monde. */
export interface RemoteShop {
  unitId: string;
  name: string;
  categories: ProductCategory[];
  /** Force commerciale 0,7–1,3 (réputation de son propriétaire). */
  strength: number;
}

/** Ce que l'on sait d'un autre joueur. */
export interface PeerState {
  id: string;
  name: string;
  /** Relation −100 (ennemi juré) … +100 (associé de toujours). */
  trust: number;
  shops: RemoteShop[];
  reputation: number;
  tier: number;
  age: number;
  lastSeenDay: number;
  /** Jours consécutifs de coopération (moments des fantômes). */
  allianceDays: number;
}

/** Effet temporaire sur ton monde (demande, fournisseurs, revenus, âge économique). */
export interface MultiEffect {
  id: string;
  mechanic: MultiMechanicId;
  fromPeer: string;
  kind: 'demande' | 'fournisseur' | 'partage' | 'garant' | 'fermeture' | 'entente';
  /** Multiplicateur (demande, fournisseur) ou part (partage des bénéfices). */
  value: number;
  untilDay: number;
}

/** Proposition reçue qui attend ta réponse. */
export interface MultiOffer {
  id: string;
  mechanic: MultiMechanicId;
  fromPeer: string;
  fromName: string;
  /** Montant (prêt), taux (prêt), durée en jours… selon la mécanique. */
  amount: number;
  rate: number;
  days: number;
  receivedDay: number;
}

/** Dette envers un autre joueur (prêt accepté). */
export interface MultiDebt {
  id: string;
  peer: string;
  /** Tu dois (`owe`) ou on te doit (`owed`). */
  side: 'owe' | 'owed';
  amount: number;
  dueDay: number;
}

/** Ligne du journal des interactions. */
export interface MultiLogEntry {
  day: number;
  peer: string;
  mechanic: MultiMechanicId;
  text: string;
  /** Pour l'interface : bonne nouvelle, mauvaise, neutre. */
  tone: 'bien' | 'mal' | 'info';
}

/**
 * Message de jeu entre deux mondes. `from`/`to` sont des identifiants de joueur ;
 * `id` est unique (dédoublonnage) ; `day` est le jour de l'émetteur.
 */
export interface MultiEvent {
  id: string;
  from: string;
  fromName: string;
  to: string;
  day: number;
  mechanic: MultiMechanicId;
  /** offer : proposition ; act : action directe ; reply : réponse à une proposition ; settle : remboursement. */
  phase: 'offer' | 'act' | 'reply' | 'settle';
  amount?: number;
  rate?: number;
  days?: number;
  accepted?: boolean;
  /** Proposition à laquelle on répond. */
  ref?: string;
  /** Concept transmis (formation). */
  concept?: string;
  /** Infos renvoyées (espionnage). */
  report?: string;
  /** Réponse à un sabotage : la cible a découvert qui l'a visée. */
  discovered?: boolean;
}

export interface MultiplayerState {
  /** Ton identifiant de joueur (fixé par la présentation à la première session). */
  selfId: string;
  peers: Record<string, PeerState>;
  effects: MultiEffect[];
  offers: MultiOffer[];
  debts: MultiDebt[];
  log: MultiLogEntry[];
  /** Événements à envoyer (produits par la simulation, vidés par la présentation). */
  outbox: MultiEvent[];
  /** Événements déjà traités (dédoublonnage), bornés. */
  seen: string[];
  /** Dernier jour d'utilisation de chaque mécanique (délais entre deux sabotages). */
  cooldowns: Record<string, number>;
  /** Compteur pour fabriquer des identifiants stables. */
  nextId: number;
}

export function createMultiplayerState(selfId = ''): MultiplayerState {
  return { selfId, peers: {}, effects: [], offers: [], debts: [], log: [], outbox: [], seen: [], cooldowns: {}, nextId: 1 };
}
