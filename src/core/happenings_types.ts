/**
 * Le monde bouge (vision du 2026-10-07) : un fil d'infos qui change la demande par secteur,
 * et des surprises, bonnes ou terribles, qui frappent le joueur, ses entreprises ou ses
 * commerces. Save v18. Les gabarits de contenu reprennent les interfaces confiées à
 * Antigravity (src/data/happenings/), pour qu'ils se branchent sans adaptation.
 */

export type Sector =
  | 'alimentation' | 'commerce' | 'services' | 'logistique' | 'mode' | 'tech'
  | 'immobilier' | 'culture' | 'industrie' | 'finance' | 'energie' | 'medias';

export type NewsCategory = 'geopolitique' | 'economie' | 'tech' | 'social' | 'climat' | 'local';
export type TierNum = 1 | 2 | 3 | 4 | 5 | 6;

export interface NewsTemplate {
  id: string;
  category: NewsCategory;
  minTier: TierNum;
  headline: string;
  body: string;
  effects: { sector: Sector; mult: number; days: number }[];
  reaction: { ghost: string; text: string };
}

export interface SurpriseOption {
  label: string;
  ghost: string;
  advice: string;
  outcome: string;
  cashFactor: number;
  risk?: number;
  failOutcome?: string;
  failCashFactor?: number;
  demandMult?: number;
  demandDays?: number;
  reputation?: number;
  stress?: number;
}

export interface SurpriseDef {
  id: string;
  tone: 'bon' | 'mauvais' | 'catastrophe';
  minTier: TierNum;
  target: 'joueur' | 'entreprise' | 'commerce';
  title: string;
  /** `{cible}` est remplacé par le nom de l'entreprise ou du commerce visé. */
  text: string;
  options?: SurpriseOption[];
  cashFactor?: number;
  demandMult?: number;
  demandDays?: number;
  reputation?: number;
  stress?: number;
  concept?: string;
}

/** Effet en cours sur la demande : un secteur entier, ou une seule cible. */
export interface DemandEffect {
  sector?: Sector;
  /** Identifiant d'une entreprise de l'Ascension ou d'un commerce. */
  target?: string;
  mult: number;
  untilDay: number;
  label: string;
}

export interface NewsItem {
  id: string;
  templateId: string;
  day: number;
  tick: number;
  headline: string;
  body: string;
  category: NewsCategory;
  effects: { sector: Sector; mult: number; days: number }[];
  ghost: string;
  reaction: string;
}

export interface PendingSurprise {
  surpriseId: string;
  day: number;
  /** Cible tirée (id d'entreprise ou de commerce), absente si la surprise vise le joueur. */
  target?: string;
  targetName?: string;
}

export interface SurpriseRecord {
  day: number;
  surpriseId: string;
  title: string;
  tone: SurpriseDef['tone'];
  /** Variation d'argent constatée (€). */
  cash: number;
  text: string;
}

export interface HappeningsState {
  news: NewsItem[];
  effects: DemandEffect[];
  pending?: PendingSurprise;
  history: SurpriseRecord[];
  lastSurpriseDay: number;
  seq: number;
}

export function createHappeningsState(): HappeningsState {
  return { news: [], effects: [], history: [], lastSurpriseDay: -1, seq: 0 };
}
