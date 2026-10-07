/**
 * Registre des répliques de famille : le premier jeu de Claude Code et le grand lot
 * d'Antigravity (src/data/story/family.ts, branché le 2026-10-07).
 */
import type { FamilyLine } from '../core/family_types';
import { STARTER_FAMILY_LINES } from './family_starter';
import { FAMILY_LINES as AG_LINES } from './story/family';

const seen = new Set<string>();
export const FAMILY_LINES: readonly FamilyLine[] = [...STARTER_FAMILY_LINES, ...AG_LINES].filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
export const FAMILY_LINE_BY_ID: Readonly<Record<string, FamilyLine>> = Object.fromEntries(FAMILY_LINES.map((l) => [l.id, l]));
