/**
 * Registre des répliques de famille : le premier jeu de Claude Code, plus le grand lot
 * d'Antigravity (src/data/story/family.ts) quand il sera livré.
 */
import type { FamilyLine } from '../core/family_types';
import { STARTER_FAMILY_LINES } from './family_starter';

export const FAMILY_LINES: readonly FamilyLine[] = [...STARTER_FAMILY_LINES];
export const FAMILY_LINE_BY_ID: Readonly<Record<string, FamilyLine>> = Object.fromEntries(FAMILY_LINES.map((l) => [l.id, l]));
