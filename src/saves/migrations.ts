/**
 * Chaîne de migrations de sauvegardes — non destructive, versionnée, testée.
 * Règle : chaque changement de schéma => version +1 et un migrateur ici.
 */
import { createMultiplayerState } from '../core/multiplayer_types';
import {
  DEFAULT_PLAYER_APPEARANCE, MAX_PENDING_DELIVERIES, VALID_GENDERS, VALID_HAIR_COLORS, VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES, type WorldState,
} from '../core/types';
import { SAVE_VERSION } from '../core/store';
import { PLACE_ANCHORS } from '../data/map';
import { createEconomyState } from '../core/economy_types';
import { createAscensionState } from '../core/ascension_types';
import { createHappeningsState } from '../core/happenings_types';
import { createRewindState } from '../core/rewind_types';
import { createFamilyState } from '../core/family_types';
import { createRoomState } from '../core/room_types';
import { createStoryState } from '../core/story_types';
import { createMacroWorldState } from '../core/macro_world_types';
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
  // 7 → 8 : observation quotidienne des ventes par lieu pour une concurrence fondée sur les transactions
  7: (s) => {
    const initial = structuredClone(INITIAL_RIVALS) as unknown as Record<string, AnySave>;
    const rivals = (s.rivals ?? {}) as Record<string, AnySave>;
    const time = s.time as AnySave | undefined;
    const day = dayIndexOf(Number(time?.tick ?? 0));
    for (const [id, defaultRival] of Object.entries(initial)) {
      const rival = rivals[id] ?? defaultRival;
      const observation = rival.marketObservation;
      if (typeof observation !== 'object' || observation === null) {
        rival.marketObservation = { day, playerUnitsSold: 0, rivalUnitsServed: 0, sessions: 0, lastClosed: null };
      } else {
        const market = observation as AnySave;
        rival.marketObservation = {
          day: typeof market.day === 'number' ? market.day : day,
          playerUnitsSold: typeof market.playerUnitsSold === 'number' ? market.playerUnitsSold : 0,
          rivalUnitsServed: typeof market.rivalUnitsServed === 'number' ? market.rivalUnitsServed : 0,
          sessions: typeof market.sessions === 'number' ? market.sessions : 0,
          lastClosed: null,
        };
      }
      rivals[id] = rival;
    }
    s.rivals = rivals;
    s.version = 8;
    return s;
  },
  // 8 → 9 : séparer la période en cours du dernier bilan réellement clôturé
  8: (s) => {
    const rivals = (s.rivals ?? {}) as Record<string, AnySave>;
    const time = s.time as AnySave | undefined;
    const day = dayIndexOf(Number(time?.tick ?? 0));
    for (const rival of Object.values(rivals)) {
      const raw = rival.marketObservation as AnySave | undefined;
      rival.marketObservation = {
        day: typeof raw?.day === 'number' ? raw.day : day,
        playerUnitsSold: typeof raw?.playerUnitsSold === 'number' ? raw.playerUnitsSold : 0,
        rivalUnitsServed: typeof raw?.rivalUnitsServed === 'number' ? raw.rivalUnitsServed : 0,
        sessions: typeof raw?.sessions === 'number' ? raw.sessions : 0,
        lastClosed: null,
      };
    }
    s.rivals = rivals;
    s.version = 9;
    return s;
  },
  // 9 → 10 : identité et apparence persistées à la création du personnage
  9: (s) => {
    const player = (s.player ?? {}) as AnySave;
    const name = typeof player.name === 'string' && player.name.trim() ? player.name.trim() : 'Camille';
    player.firstName = typeof player.firstName === 'string' && player.firstName.trim()
      ? player.firstName.trim()
      : name;
    player.lastName = typeof player.lastName === 'string' ? player.lastName.trim() : '';

    player.gender = typeof player.gender === 'string' && (VALID_GENDERS as readonly string[]).includes(player.gender)
      ? player.gender
      : 'non-binaire';

    const sourceAppearance = typeof player.appearance === 'object' && player.appearance !== null
      ? player.appearance as AnySave
      : {};
    player.appearance = {
      skinTone: typeof sourceAppearance.skinTone === 'string' && (VALID_SKIN_TONES as readonly string[]).includes(sourceAppearance.skinTone)
        ? sourceAppearance.skinTone
        : DEFAULT_PLAYER_APPEARANCE.skinTone,
      hairColor: typeof sourceAppearance.hairColor === 'string' && (VALID_HAIR_COLORS as readonly string[]).includes(sourceAppearance.hairColor)
        ? sourceAppearance.hairColor
        : DEFAULT_PLAYER_APPEARANCE.hairColor,
      hairStyle: typeof sourceAppearance.hairStyle === 'string' && (VALID_HAIR_STYLES as readonly string[]).includes(sourceAppearance.hairStyle)
        ? sourceAppearance.hairStyle
        : DEFAULT_PLAYER_APPEARANCE.hairStyle,
      outfitStyle: typeof sourceAppearance.outfitStyle === 'string' && (VALID_OUTFIT_STYLES as readonly string[]).includes(sourceAppearance.outfitStyle)
        ? sourceAppearance.outfitStyle
        : DEFAULT_PLAYER_APPEARANCE.outfitStyle,
      outfitColor: typeof sourceAppearance.outfitColor === 'string' && (VALID_OUTFIT_COLORS as readonly string[]).includes(sourceAppearance.outfitColor)
        ? sourceAppearance.outfitColor
        : DEFAULT_PLAYER_APPEARANCE.outfitColor,
    };
    s.player = player;
    s.version = 10;
    return s;
  },
  // 10 → 11 : historique des commandes du Stand (pendingDeliveries), validé et borné
  10: (s) => {
    const project = s.project as AnySave | undefined;
    if (typeof project === 'object' && project !== null) {
      const raw = Array.isArray(project.pendingDeliveries) ? project.pendingDeliveries as unknown[] : [];
      const valid = raw.filter((d): d is AnySave =>
        typeof d === 'object' && d !== null
        && typeof (d as AnySave).id === 'string'
        && typeof (d as AnySave).orderDay === 'number'
        && typeof (d as AnySave).arrivalDay === 'number'
        && typeof (d as AnySave).units === 'number'
        && typeof (d as AnySave).cost === 'number'
        && typeof (d as AnySave).supplier === 'string'
        && typeof (d as AnySave).delivered === 'boolean');
      project.pendingDeliveries = valid.slice(-MAX_PENDING_DELIVERIES);
    }
    s.version = 11;
    return s;
  },
  // 11 → 12 : nouvelle ville à l'échelle 1 m (docs/VISION.md §6). Les coordonnées de l'ancienne
  // carte 48×32 n'ont plus de sens : le joueur se réveille devant chez lui.
  11: (s) => {
    const player = (s.player ?? {}) as AnySave;
    player.pos = { ...PLACE_ANCHORS.maison };
    s.player = player;
    s.version = 12;
    return s;
  },
  // 12 → 13 : économie « Big Ambitions » (baux, commerces, employés, prêts) — état vide.
  12: (s) => {
    if (typeof s.economy !== 'object' || s.economy === null) s.economy = createEconomyState();
    s.version = 13;
    return s;
  },
  // 13 → 14 : aménagement manuel des commerces (positions des meubles) — vide par défaut.
  13: (s) => {
    const eco = s.economy as AnySave | undefined;
    const businesses = (eco?.businesses ?? {}) as Record<string, AnySave>;
    for (const b of Object.values(businesses)) {
      if (typeof b.layout !== 'object' || b.layout === null) b.layout = {};
    }
    s.version = 14;
    return s;
  },
  // 14 → 15 : propriété des murs (achat de locaux, locataires) — vide par défaut.
  14: (s) => {
    const eco = s.economy as AnySave | undefined;
    if (eco && (typeof eco.owned !== 'object' || eco.owned === null)) eco.owned = {};
    s.version = 15;
    return s;
  },
  // 15 → 16 : habitués des commerces — aucun au départ.
  15: (s) => {
    const eco = s.economy as AnySave | undefined;
    const businesses = (eco?.businesses ?? {}) as Record<string, AnySave>;
    for (const b of Object.values(businesses)) {
      if (typeof b.regulars !== 'number') b.regulars = 0;
    }
    s.version = 16;
    return s;
  },
  // 16 → 17 : l'Ascension (paliers, idées, doubles faces, carnet) — palier 1, rien de lancé.
  16: (s) => {
    if (typeof s.ascension !== 'object' || s.ascension === null) s.ascension = createAscensionState();
    s.version = 17;
    return s;
  },
  // 17 → 18 : fil d'infos du monde et surprises — rien de publié, aucun effet en cours.
  17: (s) => {
    if (typeof s.happenings !== 'object' || s.happenings === null) s.happenings = createHappeningsState();
    s.version = 18;
    return s;
  },
  // 18 → 19 : retours en arrière (leçons, sacrifices) — aucun pour l'instant.
  18: (s) => {
    if (typeof s.rewind !== 'object' || s.rewind === null) s.rewind = createRewindState();
    s.version = 19;
    return s;
  },
  // 19 → 20 : famille et collège (Nora, Thierry, cours, absences) — départ neutre.
  19: (s) => {
    if (typeof s.family !== 'object' || s.family === null) s.family = createFamilyState();
    s.version = 20;
    return s;
  },
  // 20 → 21 : la chambre-QG (objets, plans) — la photo de Lucien, aucun plan.
  20: (s) => {
    if (typeof s.room !== 'object' || s.room === null) s.room = createRoomState();
    s.version = 21;
    return s;
  },
  // 21 → 22 : le récit. Une partie déjà commencée ne rejoue pas la scène d'origine (relisible
  // dans les Carnets) ; les cahiers se découvriront selon la progression.
  21: (s) => {
    if (typeof s.story !== 'object' || s.story === null) s.story = { ...createStoryState(), originDone: true };
    s.version = 22;
    return s;
  },
  // 22 → 23 : personnalisation approfondie (morphologie, taille, yeux, lunettes, taches de
  // rousseur, barbe, accessoire) — valeurs par défaut pour une apparence plus ancienne.
  22: (s) => {
    const player = s.player as AnySave | undefined;
    if (player && typeof player.appearance === 'object' && player.appearance !== null) {
      const a = player.appearance as AnySave;
      for (const [k, v] of Object.entries(DEFAULT_PLAYER_APPEARANCE)) if (a[k] === undefined) a[k] = v;
    }
    s.version = 23;
    return s;
  },
  // 23 → 24 : multijoueur en LAN. Une partie solo n'a pas encore d'état multijoueur ; un état
  // partiel (version de développement) est complété champ par champ.
  23: (s) => {
    const m = s.multiplayer as AnySave | undefined;
    if (m && typeof m === 'object') {
      const base = createMultiplayerState(typeof m.selfId === 'string' ? m.selfId : '') as unknown as AnySave;
      for (const [k, v] of Object.entries(base)) if (m[k] === undefined) m[k] = v;
    } else {
      delete s.multiplayer;
    }
    s.version = 24;
    return s;
  },
  // 24 → 25 : simulation macro 100 ans N0-N2 (macroWorld)
  24: (s) => {
    if (typeof s.macroWorld !== 'object' || s.macroWorld === null) {
      s.macroWorld = createMacroWorldState();
    }
    s.version = 25;
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
