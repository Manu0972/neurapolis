/**
 * Registre du récit. L'origine reste la version neutre en genre de Claude Code ; les cahiers
 * sont « Les Carnets de Lucien » d'Antigravity (src/data/story/lucien.ts, branchés le
 * 2026-10-07). Les drapeaux de déclenchement qui n'existent pas dans le monde (`palier_*`) sont
 * remplacés par le palier, déjà présent dans le déclencheur.
 */
import type { StoryBeat } from '../core/story_types';
import { STARTER_ORIGIN } from './story_starter';
import { LUCIEN_BEATS } from './story/lucien';

export const ORIGIN: StoryBeat = STARTER_ORIGIN;

/**
 * Les cahiers des paliers 1 à 3 suivent aussi la campagne (12 → 16 ans) : un joueur qui fait
 * l'histoire sans monter l'Ascension les découvre au fil des chapitres, un par jour au plus.
 * Choix d'accord avec le texte : les reliures ennemies à la Friche (règles à écrire ensemble),
 * la grève de 1982 et l'épicerie Bertin au Réseau Solidaire, la flamme éteinte de 2014 quand le
 * quartier refuse les décisions venues d'ailleurs, la friche-terreau pour l'Héritage.
 */
const CAMPAIGN_CHAPTER_OF: Readonly<Record<string, number>> = {
  beat_lucien_1_le_premier_cahier: 2,
  beat_lucien_2_les_reliures_doubles: 2,
  beat_lucien_3_la_greve_de_1982: 3,
  beat_lucien_4_le_boulanger_et_le_credit: 3,
  beat_lucien_5_le_chronometre_du_docteur_taylor: 4,
  beat_lucien_6_la_nuit_du_verre_casse_2014: 4,
  beat_lucien_7_la_renaissance_sous_les_ronces: 5,
};

export const BEATS: readonly StoryBeat[] = LUCIEN_BEATS.map((b) => {
  let trigger: StoryBeat['trigger'] = b.trigger;
  if (trigger.flag?.startsWith('palier_')) {
    const { flag: _flag, ...rest } = trigger;
    trigger = rest;
  }
  const chapter = CAMPAIGN_CHAPTER_OF[b.id];
  return chapter === undefined && trigger === b.trigger ? b : { ...b, trigger: chapter === undefined ? trigger : { ...trigger, chapter } };
});
export const BEAT_BY_ID: Readonly<Record<string, StoryBeat>> = Object.fromEntries([ORIGIN, ...BEATS].map((b) => [b.id, b]));
