/**
 * Chaîne de migrations de sauvegardes — non destructive, versionnée, testée.
 * Règle : chaque changement de schéma => version +1 et un migrateur ici.
 */
import type { WorldState } from '../core/types';
import { DEFAULT_PLAYER_APPEARANCE, DEFAULT_PLAYER_GENDER, SAVE_VERSION } from '../core/store';
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
    const campaign = s.campaign as AnySave | undefined;
    if (campaign && Array.isArray(campaign.stages)) {
      for (const initStage of INITIAL_CAMPAIGN_STAGES) {
        if (!campaign.stages.some((st: AnySave) => (st as { chapter?: number }).chapter === initStage.chapter)) {
          campaign.stages.push(structuredClone(initStage));
        }
      }
    }
    s.version = 5;
    return s;
  },
  // 5 → 6 : Atelier de la Friche (J5) — second projet avec Karim
  5: (s) => {
    if (s.workshop && typeof s.workshop === 'object') {
      const ws = s.workshop as AnySave;
      ws.id = ws.id ?? 'atelier_friche';
      ws.active = ws.active ?? true;
      ws.partner = ws.partner ?? 'karim';
      ws.members = Array.isArray(ws.members) ? ws.members : ['karim'];
      ws.partsStock = typeof ws.partsStock === 'number' ? ws.partsStock : 4;
      ws.toolCondition = typeof ws.toolCondition === 'number' ? ws.toolCondition : 100;
      ws.orders = Array.isArray(ws.orders) ? ws.orders : [];
      ws.tariffMode = ws.tariffMode ?? 'standard';
      ws.solidarityRate = typeof ws.solidarityRate === 'number' ? ws.solidarityRate : 0.20;
      ws.solidarityFund = typeof ws.solidarityFund === 'number' ? ws.solidarityFund : 0;
      ws.balance = typeof ws.balance === 'number' ? ws.balance : 0;
      ws.ledger = Array.isArray(ws.ledger) ? ws.ledger : [];
      ws.work = (typeof ws.work === 'object' && ws.work !== null) ? ws.work : { player: 0, karim: 0 };
      ws.completedRepairsCount = typeof ws.completedRepairsCount === 'number' ? ws.completedRepairsCount : 0;
    }
    s.version = 6;
    return s;
  },
  // 6 → 7 : Tiers marchands, Cartographie & Plans, Multi-Entreprises, News Macro, École/Famille, Compagnon Kawaii
  6: (s) => {
    s.vendors = s.vendors ?? {
      vendors: {
        bertin: {
          vendorId: 'bertin',
          name: 'Mme Bertin (Épicerie des Roses)',
          location: 'epicerie',
          tier: 0,
          spentTotal: 0,
          tradeCount: 0,
          discountRate: 0,
          unlockedPerks: ['Accès au rayon standard.'],
          friendshipDialogueUnlocked: false,
          specialStockAvailable: false,
        },
        karim: {
          vendorId: 'karim',
          name: 'Karim (Récup & Atelier Friche)',
          location: 'friche',
          tier: 0,
          spentTotal: 0,
          tradeCount: 0,
          discountRate: 0,
          unlockedPerks: ['Pièces détachées au détail.'],
          friendshipDialogueUnlocked: false,
          specialStockAvailable: false,
        },
      },
    };
    s.actionPlanning = s.actionPlanning ?? {
      plans: {},
      territory: {},
      expansionLevel: 'quartier',
    };
    s.multiVentures = s.multiVentures ?? {
      ventures: {},
      hazards: [],
      synergiesActive: [],
    };
    s.macroNews = s.macroNews ?? {
      currentTrend: 'stabilite',
      costModifier: 0,
      demandModifier: 0.05,
      feed: [],
    };
    s.schoolLife = s.schoolLife ?? {
      attendanceRate: 90,
      consecutiveClassesAttended: 3,
      skippedClassesCount: 0,
      academicAverage: 14,
      parentSentiment: 'satisfait',
      parentCongratulatedCount: 0,
      teacherWarningActive: false,
      negotiatedExemption: false,
      lastParentInteractionDay: 0,
      lastParentMessage: 'Prends soin de toi !',
    };
    s.streetRecognition = s.streetRecognition ?? {
      streetReputationLevel: 50,
      spontaneousEncounterPending: false,
      lastEncounterDay: 0,
      hiddenSynergiesUnlocked: [],
    };
    s.tutorials = s.tutorials ?? { tutorials: {} };
    s.ghostCompanion = s.ghostCompanion ?? {
      activeGhostId: 'smith',
      mood: 'curieux',
      speechBubble: 'Observe le marché et les besoins du quartier.',
      lastAdviceTick: 0,
      unlockedThinkers: ['smith'],
    };
    s.version = 7;
    return s;
  },
  // 7 → 8 : identité et apparence du personnage personnalisables.
  7: (s) => {
    const player = (s.player ?? {}) as AnySave;
    const allowedGenders = ['fille', 'garcon', 'non-binaire'];
    if (typeof player.gender !== 'string' || !allowedGenders.includes(player.gender)) {
      player.gender = DEFAULT_PLAYER_GENDER;
    }

    const appearance = (player.appearance && typeof player.appearance === 'object'
      ? player.appearance
      : {}) as AnySave;
    const hexColor = (value: unknown): value is string =>
      typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
    player.appearance = {
      ...appearance,
      skinTone: hexColor(appearance.skinTone) ? appearance.skinTone : DEFAULT_PLAYER_APPEARANCE.skinTone,
      hairStyle: typeof appearance.hairStyle === 'string' && appearance.hairStyle.length > 0
        ? appearance.hairStyle
        : DEFAULT_PLAYER_APPEARANCE.hairStyle,
      hairColor: hexColor(appearance.hairColor) ? appearance.hairColor : DEFAULT_PLAYER_APPEARANCE.hairColor,
      outfit: typeof appearance.outfit === 'string' && appearance.outfit.length > 0
        ? appearance.outfit
        : DEFAULT_PLAYER_APPEARANCE.outfit,
      outfitColor: hexColor(appearance.outfitColor) ? appearance.outfitColor : DEFAULT_PLAYER_APPEARANCE.outfitColor,
    };
    s.player = player;
    s.version = 8;
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
