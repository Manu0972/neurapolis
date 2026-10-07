/**
 * Registre des dépêches et des surprises : le premier jeu de Claude Code, plus le grand lot
 * d'Antigravity (src/data/happenings/news.ts et surprises.ts) quand il sera livré.
 */
import type { NewsTemplate, SurpriseDef } from '../core/happenings_types';
import { STARTER_NEWS, STARTER_SURPRISES } from './happenings_starter';

export const NEWS: readonly NewsTemplate[] = [...STARTER_NEWS];
export const SURPRISES: readonly SurpriseDef[] = [...STARTER_SURPRISES];

export const NEWS_BY_ID: Readonly<Record<string, NewsTemplate>> = Object.fromEntries(NEWS.map((n) => [n.id, n]));
export const SURPRISE_BY_ID: Readonly<Record<string, SurpriseDef>> = Object.fromEntries(SURPRISES.map((s) => [s.id, s]));
