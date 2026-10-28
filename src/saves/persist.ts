/**
 * Persistance : 3 slots + auto dans localStorage, export/import fichier JSON.
 * Aucune corruption tolérée : échec de parsing → erreur claire, jamais d’état corrompu silencieux.
 */
import type { WorldState } from '../core/types';
import { migrateSave } from './migrations';

const PREFIX = 'neurapolis.save.';
const VALID_SLOT_REGEX = /^[a-zA-Z0-9_-]{1,32}$/;

function validateSlot(slot: string): void {
  if (typeof slot !== 'string' || !VALID_SLOT_REGEX.test(slot)) {
    throw new Error('Identifiant d’emplacement invalide.');
  }
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveToSlot(slot: string, w: WorldState): void {
  validateSlot(slot);
  const ls = storage();
  if (!ls) throw new Error('localStorage indisponible.');
  ls.setItem(PREFIX + slot, JSON.stringify(w));
}

export function loadFromSlot(slot: string): WorldState {
  validateSlot(slot);
  const ls = storage();
  if (!ls) throw new Error('localStorage indisponible.');
  const raw = ls.getItem(PREFIX + slot);
  if (!raw) throw new Error(`Emplacement « ${slot} » vide.`);
  return migrateSave(JSON.parse(raw));
}

export function deleteSlot(slot: string): void {
  validateSlot(slot);
  storage()?.removeItem(PREFIX + slot);
}

export interface SlotSummary {
  slot: string;
  exists: boolean;
  /** Prénom et nom du personnage. */
  name?: string;
  age?: number;
  money?: number;
  /** Jour de jeu (index) — l'interface le convertit en date. */
  tick?: number;
  businesses?: number;
  error?: string;
}

/** Résumé d'un emplacement, sans migrer ni charger tout le monde (lecture légère du JSON). */
export function slotSummary(slot: string): SlotSummary {
  if (typeof slot !== 'string' || !VALID_SLOT_REGEX.test(slot)) {
    return { slot, exists: false, error: 'Identifiant d’emplacement invalide.' };
  }
  const raw = storage()?.getItem(PREFIX + slot);
  if (!raw) return { slot, exists: false };
  try {
    const s = JSON.parse(raw) as {
      player?: { name?: string; age?: number; money?: number };
      time?: { tick?: number };
      economy?: { businesses?: Record<string, unknown> };
    };
    return {
      slot,
      exists: true,
      name: s.player?.name,
      age: s.player?.age,
      money: s.player?.money,
      tick: s.time?.tick,
      businesses: Object.keys(s.economy?.businesses ?? {}).length,
    };
  } catch {
    return { slot, exists: true, error: 'sauvegarde illisible' };
  }
}

/** Demande de chargement transmise à l'écran d'accueil après rechargement de la page. */
export const PENDING_LOAD_KEY = 'neurapolis.chargement';

export function listSlots(): string[] {
  const ls = storage();
  if (!ls) return [];
  const out: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
  }
  return out;
}

export type AutoSaveInspection =
  | { kind: 'unavailable' }
  | { kind: 'missing' }
  | { kind: 'ready'; world: WorldState }
  | { kind: 'invalid'; message: string };

/** Lit et migre l’auto-save sans masquer une sauvegarde corrompue. */
export function inspectAutoSave(): AutoSaveInspection {
  if (!storage()) return { kind: 'unavailable' };
  if (!listSlots().includes('auto')) return { kind: 'missing' };
  try {
    return { kind: 'ready', world: loadFromSlot('auto') };
  } catch (error) {
    return {
      kind: 'invalid',
      message: error instanceof Error ? error.message : 'La sauvegarde automatique est illisible.',
    };
  }
}

export function exportSave(w: WorldState): string {
  return JSON.stringify(w, null, 2);
}

export function importSave(text: string): WorldState {
  return migrateSave(JSON.parse(text));
}
