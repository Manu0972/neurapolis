/**
 * Chronique : un instantané du monde chaque matin, les sept derniers jours, pour permettre
 * un retour en arrière après une très grosse erreur (src/simulation/rewind.ts).
 * Stockage local ; si la place manque, les plus anciens instantanés sont abandonnés.
 */
import type { WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { migrateSave } from './migrations';

const KEY = 'neurapolis.chronique';
export const CHRONICLE_DAYS = 7;

interface Entry { day: number; label: string; data: string }

function read(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Entry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Entry[]): void {
  let keep = list.slice(-CHRONICLE_DAYS);
  while (keep.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify(keep));
      return;
    } catch {
      keep = keep.slice(1); // plus de place : on lâche le plus ancien
    }
  }
}

/** Garde l'instantané du jour (un seul par jour). */
export function recordDay(w: WorldState): void {
  const day = dayIndexOf(w.time.tick);
  const list = read().filter((e) => e.day !== day && e.day < day);
  list.push({ day, label: dateOf(day).label, data: JSON.stringify(w) });
  write(list);
}

export function listChronicle(): { day: number; label: string }[] {
  return read().map(({ day, label }) => ({ day, label }));
}

export function loadChronicle(day: number): WorldState {
  const e = read().find((x) => x.day === day);
  if (!e) throw new Error('Ce jour n’est plus dans la chronique.');
  return migrateSave(JSON.parse(e.data));
}

/** Après un retour, les jours « effacés » ne doivent plus être proposés. */
export function truncateAfter(day: number): void {
  write(read().filter((e) => e.day <= day));
}
