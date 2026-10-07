/**
 * L'Ascension (docs/ASCENSION.md) : six paliers d'échelle, des idées de business au choix
 * libre, des fantômes « double face » qui se disputent chaque décision, un carnet d'économie.
 * Save v17.
 */

export type TierId = 1 | 2 | 3 | 4 | 5 | 6;
export type StrategyKey = 'A' | 'B' | 'C';

/** Un univers de simulation : l'entreprise telle qu'elle tourne sous une stratégie. */
export interface VentureUniverse {
  /** Part du marché de l'idée (0-1). */
  share: number;
  /** Qualité perçue (0-100) : service, motivation, image. */
  quality: number;
  /** Bénéfice cumulé dans cet univers (sert au verdict). */
  profit: number;
  /** Dette restante (stratégie d'emprunt). */
  loan: number;
}

export interface VentureDayStats {
  day: number;
  demand: number;
  revenue: number;
  costs: number;
  profit: number;
  /** Production invendue (€ au coût). */
  unsold: number;
  /** Ventes manquées faute de stock ou de capacité (€). */
  missed: number;
}

export interface VentureRun {
  ideaId: string;
  launchedDay: number;
  strategy: StrategyKey;
  /** Niveau d'investissement (1-5) : portée du marché et coûts fixes. */
  level: number;
  cash: number;
  revenueTotal: number;
  profitTotal: number;
  /** Univers simulés en parallèle jusqu'au verdict (A, B, C) ; ensuite seul l'univers réel reste. */
  universes: Partial<Record<StrategyKey, VentureUniverse>>;
  verdictDay: number;
  verdictDone: boolean;
  /** Jours consécutifs de caisse négative (faillite à 10). */
  redDays: number;
  last?: VentureDayStats;
  closed?: boolean;
}

export interface ThinkerTrust {
  right: number;
  wrong: number;
  followed: number;
  ignored: number;
}

export interface VerdictRecord {
  day: number;
  ideaId: string;
  duelId: string;
  chosen: StrategyKey;
  best: StrategyKey;
  /** Bénéfices des trois univers au verdict. */
  profits: Partial<Record<StrategyKey, number>>;
}

export interface PendingDecision {
  duelId: string;
  ideaId: string;
}

export interface AscensionState {
  tier: TierId;
  ventures: Record<string, VentureRun>;
  /** Carnet d'économie : concept → jour d'apprentissage. */
  concepts: Record<string, number>;
  /** Connexions : personne → jour de rencontre utile. */
  contacts: Record<string, number>;
  /** Crédit de chaque penseur auprès du joueur. */
  trust: Record<string, ThinkerTrust>;
  pending?: PendingDecision;
  verdicts: VerdictRecord[];
  /** Bénéfices cumulés de toutes les entreprises de l'Ascension. */
  totalProfit: number;
}

export function createAscensionState(): AscensionState {
  return { tier: 1, ventures: {}, concepts: {}, contacts: {}, trust: {}, verdicts: [], totalProfit: 0 };
}
