/**
 * Création et clonage de l'état du monde. Valeurs initiales = Bible de game design.
 */
import { DEFAULT_PLAYER_APPEARANCE, STARTING_PLAYER_AGE, type GhostState, type NpcState, type Rel4, type WorldState, type SkillId, type ActionPlanState, type VentureId, type VentureState, type MacroNewsItem } from './types';
import { makeSeed } from './rng';
import { NPCS } from '../data/npcs';
import { ALL_GHOST_IDS } from '../data/ghosts/registry';
import { INITIAL_RIVALS } from '../data/rivals';
import { INITIAL_CAMPAIGN_STAGES } from '../data/campaign';
import { createInitialVendorsState } from '../data/vendors';
import { INITIAL_ACTION_PLANS, INITIAL_TERRITORY_NODES } from '../data/action_plans';
import { INITIAL_ECONOMIC_HAZARDS, VENTURE_DEFS } from '../data/multi_ventures';
import { MACRO_NEWS_TEMPLATES } from '../data/macro_news';
import { INITIAL_TUTORIALS } from '../data/tutorials';
import { PLACE_ANCHORS } from '../data/map';
import { createAscensionState } from './ascension_types';
import { createHappeningsState } from './happenings_types';
import { createRewindState } from './rewind_types';
import { createFamilyState } from './family_types';
import { createRoomState } from './room_types';
import { createStoryState } from './story_types';
import { createEconomyState } from './economy_types';

export const SAVE_VERSION = 23;

const SKILL_IDS: SkillId[] = ['negociation', 'comptabilite', 'communication', 'organisation', 'technique', 'recherche'];

export function rel(amitie: number, confiance: number, respect: number, rivalite: number): Rel4 {
  return { amitie, confiance, respect, rivalite };
}

export interface CreateWorldOptions {
  seed?: number;
  playerName?: string;
  /** Mode bac à sable : économie entièrement débloquée dès le départ (docs/VISION.md §4.2). */
  sandbox?: boolean;
}

export function createWorld(opts: CreateWorldOptions = {}): WorldState {
  const seed = opts.seed ?? 20200901;
  const name = opts.playerName ?? 'Camille';

  const npcs: Record<string, NpcState> = {};
  for (const def of NPCS) {
    npcs[def.id] = {
      id: def.id, place: 'maison', activity: 'dort',
      stress: 25, moral: 60, memory: [], opinion: 0,
    };
  }

  const ghosts: Record<string, GhostState> = {};
  for (const id of ALL_GHOST_IDS) {
    ghosts[id] = {
      id, status: 'inconnu', loyalty: 50, fiabilite: 60,
      lastWords: '', history: [], loyaltyZeroDays: 0,
    };
  }

  // Initialisation des plans d'action
  const plans: Record<string, ActionPlanState> = {};
  for (const t of INITIAL_ACTION_PLANS) {
    plans[t.id] = {
      id: t.id,
      title: t.title,
      category: t.category,
      description: t.description,
      ghostAdvisorId: t.ghostAdvisorId,
      ghostInsight: t.ghostInsight,
      steps: t.steps.map((s) => ({ id: s.id, label: s.label, completed: false })),
      active: t.id === INITIAL_ACTION_PLANS[0]?.id,
      completed: false,
      unlockedDay: t.unlockedDay,
      rewardDescription: t.rewardDescription,
    };
  }

  // Initialisation des entreprises
  const ventures: Partial<Record<VentureId, VentureState>> = {};
  for (const [id, def] of Object.entries(VENTURE_DEFS) as [VentureId, typeof VENTURE_DEFS[VentureId]][]) {
    ventures[id] = {
      id,
      name: def.name,
      active: def.unlockedByDefault,
      roles: {},
      dailyRevenue: def.baseRevenuePerDay,
      dailyExpenses: def.baseExpensesPerDay,
      level: 1,
    };
  }

  // Initialisation du fil d'actualités macroéconomiques
  const initialNewsTpl = MACRO_NEWS_TEMPLATES[5] ?? MACRO_NEWS_TEMPLATES[0] ?? {
    headline: 'Stabilité économique et reprise de la consommation',
    summary: 'Le climat des affaires reste serein à Val-Ferrand. Les échanges commerciaux suivent leur cours régulier.',
    trend: 'stabilite' as const,
    costModifier: 0,
    demandModifier: 0.05,
    durationDays: 5,
  };
  const initialNews: MacroNewsItem = {
    id: 'news_init_0',
    day: 0,
    date: '2020-09-01',
    headline: initialNewsTpl.headline,
    summary: initialNewsTpl.summary,
    trend: initialNewsTpl.trend,
    costModifier: initialNewsTpl.costModifier,
    demandModifier: initialNewsTpl.demandModifier,
    activeUntilDay: initialNewsTpl.durationDays,
  };

  return {
    version: SAVE_VERSION,
    seed,
    rng: makeSeed(seed),
    time: { tick: 43, speed: 1 }, // mardi 1er septembre 2020, 07:10 — réveil
    player: {
      name,
      firstName: name,
      lastName: '',
      gender: 'non-binaire',
      appearance: { ...DEFAULT_PLAYER_APPEARANCE },
      age: STARTING_PLAYER_AGE,
      characteristics: { comprehension: 42, creativite: 65, influence: 35, discipline: 48, adaptabilite: 58, confiance: 44 },
      needs: { fatigue: 20, faim: 30, stress: 25, moral: 65 },
      skills: Object.fromEntries(SKILL_IDS.map((s) => [s, { level: 0, xp: 0 }])) as Record<SkillId, { level: 0 | 1 | 2 | 3; xp: number }>,
      notions: {},
      money: 15,
      reputation: 45,
      relations: {
        noah: rel(78, 65, 48, 18),   // valeurs exactes de la Bible §7
        lina: rel(55, 50, 50, 10),
        yasmine: rel(45, 40, 42, 12),
        karim: rel(30, 25, 35, 5),
        monique: rel(40, 50, 45, 0),
        samir: rel(25, 30, 40, 0),
        bertin: rel(35, 40, 45, 0),
        moreau: rel(40, 45, 55, 5),
      },
      pos: { ...PLACE_ANCHORS.maison }, // devant la porte de la Cité des Roses, bâtiment A
      asleep: false,
    },
    npcs,
    council: {
      ghosts,
      decisions: { marche: 0, communs: 0, autorite: 0, solidarite: 0 },
      fusionProgress: { marche_des_communs: { marches: 0, communs: 0 } },
      fusionsDone: [],
      affinities: {},
      contratSecurite: null,
      allianceDesOmbres: 0,
    },
    district: { vitaliteEpicerie: 45, confianceQuartier: 50, frequentationParc: 55, meteo: 'soleil' },
    rivals: structuredClone(INITIAL_RIVALS),
    campaign: {
      currentChapter: 1,
      stages: structuredClone(INITIAL_CAMPAIGN_STAGES),
      completedChapters: [],
      delayedConsequences: [],
    },
    vendors: { vendors: createInitialVendorsState() },
    actionPlanning: {
      plans,
      activePlanId: INITIAL_ACTION_PLANS[0]?.id,
      territory: structuredClone(INITIAL_TERRITORY_NODES),
      expansionLevel: 'quartier',
    },
    multiVentures: {
      ventures: ventures as Record<VentureId, VentureState>,
      hazards: structuredClone(INITIAL_ECONOMIC_HAZARDS),
      synergiesActive: [],
    },
    macroNews: {
      currentTrend: initialNewsTpl.trend,
      costModifier: initialNewsTpl.costModifier,
      demandModifier: initialNewsTpl.demandModifier,
      feed: [initialNews],
    },
    schoolLife: {
      attendanceRate: 92,
      consecutiveClassesAttended: 3,
      skippedClassesCount: 0,
      academicAverage: 14.5,
      parentSentiment: 'satisfait',
      parentCongratulatedCount: 0,
      teacherWarningActive: false,
      negotiatedExemption: false,
      lastParentInteractionDay: 0,
      lastParentMessage: 'Tes parents sont contents de tes débuts au collège : « Travaille bien et ne te disperse pas trop avec tes projets ! »',
    },
    streetRecognition: {
      streetReputationLevel: 45,
      spontaneousEncounterPending: false,
      lastEncounterDay: 0,
      hiddenSynergiesUnlocked: [],
    },
    tutorials: {
      tutorials: structuredClone(INITIAL_TUTORIALS),
    },
    economy: createEconomyState(opts.sandbox ?? false),
    ascension: createAscensionState(),
    happenings: createHappeningsState(),
    rewind: createRewindState(),
    family: createFamilyState(),
    room: createRoomState(),
    story: createStoryState(),
    ghostCompanion: {
      activeGhostId: 'smith',
      mood: 'curieux',
      speechBubble: 'Observe le marché et les besoins du quartier.',
      lastAdviceTick: 0,
      unlockedThinkers: ['smith'],
    },
    events: [],
    lifeJournal: [
      {
        day: 0, date: '2020-09-01', title: 'La rentrée',
        text: `Septembre 2020. ${name} a douze ans. Nouveau collège, nouvelles têtes, et l’envie tranquille que quelque chose commence.`,
      },
    ],
    flags: {},
    seen: {},
  };
}

export function cloneWorld(w: WorldState): WorldState {
  return structuredClone(w);
}
