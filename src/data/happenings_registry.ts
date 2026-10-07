/**
 * Registre des dépêches et des surprises : le premier jeu de Claude Code et le grand lot
 * d'Antigravity (src/data/happenings/, branché le 2026-10-07). Les doublons d'id sont écartés.
 */
import type { NewsTemplate, SurpriseDef } from '../core/happenings_types';
import { STARTER_NEWS, STARTER_SURPRISES } from './happenings_starter';
import { NEWS_TEMPLATES } from './happenings/news';
import { SURPRISES as AG_SURPRISES } from './happenings/surprises';

function unique<T extends { id: string }>(list: readonly T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

export const NEWS: readonly NewsTemplate[] = unique([...STARTER_NEWS, ...NEWS_TEMPLATES]);
export const SURPRISES: readonly SurpriseDef[] = unique([...STARTER_SURPRISES, ...AG_SURPRISES]);

export const NEWS_BY_ID: Readonly<Record<string, NewsTemplate>> = Object.fromEntries(NEWS.map((n) => [n.id, n]));
export const SURPRISE_BY_ID: Readonly<Record<string, SurpriseDef>> = Object.fromEntries(SURPRISES.map((s) => [s.id, s]));
