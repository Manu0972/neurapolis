/**
 * Secrets du monde (docs/ASCENSION.md §3.3, lot ASC-5). Interface identique à celle confiée à
 * Antigravity (src/data/secrets/secrets.ts, workflow AG-2) pour un branchement direct.
 * Pas d'état de sauvegarde dédié : indices et découvertes sont des drapeaux du monde.
 */
import type { PlaceId } from './types';

export interface SecretDef {
  id: string;
  title: string;
  where: { place?: PlaceId; street?: string; hint: string };
  when?: { hour?: [number, number]; weekday?: number[]; weather?: 'pluie' | 'soleil' | 'nuages' };
  requires?: { tier?: number; concepts?: number; contact?: string; flag?: string };
  /** Indice laissé au joueur (carnet, dépêche, réplique). */
  clue: string;
  reward: { kind: 'concept' | 'contact' | 'objet' | 'argent' | 'idee'; value: string | number };
  lore: string;
}
