/**
 * Chaîne de migrations de sauvegardes — non destructive, versionnée, testée.
 * Règle : chaque changement de schéma => version +1 et un migrateur ici.
 */
import type { WorldState } from '../core/types';
import { SAVE_VERSION } from '../core/store';
import { INITIAL_RIVALS } from '../data/rivals';
import { INITIAL_CAMPAIGN_STAGES } from '../data/campaign';
import { COUNTER_STRATEGIES } from '../data/rivals';
import { dayIndexOf } from '../core/clock';

type AnySave = Record<string, unknown>;

const MIGRATIONS: Record<number, (s: AnySave) => AnySave> = {
  // 0 → 1 : ajout de la météo du district
  0: (s) => {
    const district = (s.district ?? {}) as AnySave;
    district.meteo = district.meteo ?? 'soleil';
    s.district = district;
    s.version = 1;
    return s;
  },
  // 1 → 2 : champs du moteur Conseil (arrivées en attente, refus, compteurs de loyauté)
  1: (s) => {
    const council = (s.council ?? {}) as AnySave;
    const ghosts = (council.ghosts ?? {}) as Record<string, AnySave>;
    for (const g of Object.values(ghosts)) {
      if (typeof g !== 'object' || g === null) continue;
      g.arrivalPending = g.arrivalPending ?? false;
      g.loyaltyZeroDays = g.loyaltyZeroDays ?? 0;
      g.fiabilite = g.fiabilite ?? 60;
      if (Array.isArray(g.history)) {
        for (const rec of g.history as AnySave[]) {
          rec.revealDay = rec.revealDay ?? undefined;
          rec.revealed = rec.revealed ?? false;
          rec.answered = rec.answered ?? true; // conseils d'avant M4 : déjà passés
        }
      }
    }
    council.ghosts = ghosts;
    s.council = council;
    s.version = 2;
    return s;
  },
  // 2 → 3 : M6 — affinités par paire, progression de fusion structurée, contrat de sécurité
  2: (s) => {
    const council = (s.council ?? {}) as AnySave;
    council.affinities = council.affinities ?? {};
    const fp = (council.fusionProgress ?? {}) as Record<string, AnySave>;
    for (const [k, v] of Object.entries(fp)) {
      // v2 stockait un compteur unique jamais incrémenté : la progression repart structurée.
      if (typeof v === 'number') fp[k] = { marches: 0, communs: 0 };
    }
    council.fusionProgress = fp;
    const cs = council.contratSecurite as AnySave | null | undefined;
    if (cs && typeof cs === 'object') cs.proposedDay = cs.proposedDay ?? undefined;
    s.council = council;
    s.version = 3;
    return s;
  },
  // 3 → 4 : ajout des rivaux économiques et de la campagne narrative
  3: (s) => {
    s.rivals = s.rivals ?? structuredClone(INITIAL_RIVALS);
    s.campaign = s.campaign ?? {
      currentChapter: 1,
      stages: structuredClone(INITIAL_CAMPAIGN_STAGES),
      completedChapters: [],
      delayedConsequences: [],
    };
    s.version = 4;
    return s;
  },
  // 4 → 5 : échéances persistées des contre-stratégies économiques
  4: (s) => {
    const rivals = (s.rivals ?? structuredClone(INITIAL_RIVALS)) as Record<string, AnySave>;
    const time = s.time as AnySave | undefined;
    const today = dayIndexOf(Number(time?.tick ?? 0));
    for (const rival of Object.values(rivals)) {
      const active = Array.isArray(rival.activeCounterActions) ? rival.activeCounterActions : [];
      rival.activeCounterActions = active.flatMap((entry) => {
        if (typeof entry === 'string') {
          const strategy = COUNTER_STRATEGIES.find((candidate) => candidate.id === entry);
          return strategy ? [{ strategyId: entry, expiresDay: today + strategy.durationDays }] : [];
        }
        if (typeof entry !== 'object' || entry === null) return [];
        const action = entry as AnySave;
        return typeof action.strategyId === 'string' && typeof action.expiresDay === 'number'
          ? [{ strategyId: action.strategyId, expiresDay: action.expiresDay }]
          : [];
      });
    }
    s.rivals = rivals;
    s.version = 5;
    return s;
  },
  // 5 → 6 : conclusion du chapitre 5 et enregistrement de fin
  5: (s) => {
    const campaign = (s.campaign ?? {}) as AnySave;
    campaign.ending = campaign.ending ?? undefined;
    s.campaign = campaign;
    s.version = 6;
    return s;
  },
};

export const CURRENT_SAVE_VERSION = SAVE_VERSION;

export function migrateSave(raw: unknown): WorldState {
  if (typeof raw !== 'object' || raw === null) throw new Error('Sauvegarde illisible (pas un objet).');
  let s = raw as AnySave;
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > CURRENT_SAVE_VERSION) {
    throw new Error(`Sauvegarde trop récente (v${v} > v${CURRENT_SAVE_VERSION}).`);
  }
  while (v < CURRENT_SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Migration manquante depuis v${v}.`);
    s = step(s);
    v = typeof s.version === 'number' ? s.version : v + 1;
  }
  return s as unknown as WorldState;
}
