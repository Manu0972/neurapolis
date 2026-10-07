/**
 * Registre des secrets : premier jeu de Claude Code, plus ceux d'Antigravity
 * (src/data/secrets/secrets.ts, workflow AG-2) quand ils seront livrés.
 */
import type { SecretDef } from '../core/secret_types';
import { STARTER_SECRETS } from './secrets_starter';

export const SECRETS: readonly SecretDef[] = [...STARTER_SECRETS];
export const SECRET_BY_ID: Readonly<Record<string, SecretDef>> = Object.fromEntries(SECRETS.map((s) => [s.id, s]));
