/**
 * Persistance : 3 slots + auto dans localStorage, export/import fichier JSON.
 * Aucune corruption tolérée : échec de parsing → erreur claire, jamais d’état corrompu silencieux.
 * Securité Sentinel : Sanitisation anti-Prototype Pollution & Injections JSON.
 */
import type { WorldState } from '../core/types';
import { migrateSave } from './migrations';

const PREFIX = 'neurapolis.save.';

/**
 * Nettoie récursivement tout objet JSON pour éliminer les propriétés toxiques
 * (__proto__, constructor, prototype) empêchant la prototype pollution.
 */
export function sanitizeJsonObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJsonObject(item)) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = {};

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    const val = (obj as Record<string, unknown>)[key];
    cleanObj[key] = sanitizeJsonObject(val);
  }

  return cleanObj as T;
}

/**
 * Parse de manière sécurisée une chaîne JSON tout en éliminant les clés polluantes.
 */
export function safeJsonParse(jsonString: string): unknown {
  const parsed = JSON.parse(jsonString, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
  return sanitizeJsonObject(parsed);
}

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
  return migrateSave(safeJsonParse(raw));
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
  return migrateSave(safeJsonParse(text));
}
