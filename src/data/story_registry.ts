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
export const BEATS: readonly StoryBeat[] = LUCIEN_BEATS.map((b) => {
  if (!b.trigger.flag?.startsWith('palier_')) return b;
  const { flag: _flag, ...trigger } = b.trigger;
  return { ...b, trigger };
});
export const BEAT_BY_ID: Readonly<Record<string, StoryBeat>> = Object.fromEntries([ORIGIN, ...BEATS].map((b) => [b.id, b]));
