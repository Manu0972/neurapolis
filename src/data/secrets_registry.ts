/**
 * Registre des secrets : premier jeu de Claude Code, plus ceux d'Antigravity
 * (src/data/secrets/secrets.ts, workflow AG-2) quand ils seront livrés.
 */
import type { SecretDef } from '../core/secret_types';
import { STARTER_SECRETS } from './secrets_starter';
import { SECRETS as AG_SECRETS } from './secrets/secrets';

export const SECRETS: readonly SecretDef[] = [...STARTER_SECRETS, ...AG_SECRETS.filter((s) => !STARTER_SECRETS.some((x) => x.id === s.id))];
export const SECRET_BY_ID: Readonly<Record<string, SecretDef>> = Object.fromEntries(SECRETS.map((s) => [s.id, s]));
