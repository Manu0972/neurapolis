/**
 * Création et clonage de l'état du monde. Valeurs initiales = Bible de game design.
 */
import { STARTING_PLAYER_AGE, type GhostState, type NpcState, type Rel4, type WorldState, type SkillId } from './types';
import { makeSeed } from './rng';
import { NPCS } from '../data/npcs';
import { ALL_GHOST_IDS } from '../data/ghosts/registry';
import { INITIAL_RIVALS } from '../data/rivals';
import { INITIAL_CAMPAIGN_STAGES } from '../data/campaign';

export const SAVE_VERSION = 5;

const SKILL_IDS: SkillId[] = ['negociation', 'comptabilite', 'communication', 'organisation', 'technique', 'recherche'];

export function rel(amitie: number, confiance: number, respect: number, rivalite: number): Rel4 {
  return { amitie, confiance, respect, rivalite };
}

export interface CreateWorldOptions { seed?: number; playerName?: string }

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

  return {
    version: SAVE_VERSION,
    seed,
    rng: makeSeed(seed),
    time: { tick: 43, speed: 1 }, // mardi 1er septembre 2020, 07:10 — réveil
    player: {
      name,
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
      pos: { x: 23, y: 17 },
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
