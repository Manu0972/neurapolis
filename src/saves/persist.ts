/**
 * Persistance : 3 slots + auto dans localStorage, export/import fichier JSON.
 * Aucune corruption tolérée : échec de parsing → erreur claire, jamais d’état corrompu silencieux.
 */
import type { WorldState } from '../core/types';
import { migrateSave } from './migrations';

const PREFIX = 'neurapolis.save.';

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveToSlot(slot: string, w: WorldState): void {
  const ls = storage();
  if (!ls) throw new Error('localStorage indisponible.');
  ls.setItem(PREFIX + slot, JSON.stringify(w));
}

export function loadFromSlot(slot: string): WorldState {
  const ls = storage();
  if (!ls) throw new Error('localStorage indisponible.');
  const raw = ls.getItem(PREFIX + slot);
  if (!raw) throw new Error(`Emplacement « ${slot} » vide.`);
  return migrateSave(JSON.parse(raw));
}

export function deleteSlot(slot: string): void {
  storage()?.removeItem(PREFIX + slot);
}

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

export function exportSave(w: WorldState): string {
  return JSON.stringify(w, null, 2);
}

export function importSave(text: string): WorldState {
  return migrateSave(JSON.parse(text));
}
