/**
 * Registre du récit : la version courte de Claude Code, remplacée par « Les Carnets de
 * Lucien » d'Antigravity (src/data/story/lucien.ts) quand il sera livré.
 */
import type { StoryBeat } from '../core/story_types';
import { STARTER_BEATS, STARTER_ORIGIN } from './story_starter';

export const ORIGIN: StoryBeat = STARTER_ORIGIN;
export const BEATS: readonly StoryBeat[] = [...STARTER_BEATS];
export const BEAT_BY_ID: Readonly<Record<string, StoryBeat>> = Object.fromEntries([ORIGIN, ...BEATS].map((b) => [b.id, b]));
