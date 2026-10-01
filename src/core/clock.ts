/**
 * Horloge : temps simulé ↔ date réelle du calendrier 2020-21.
 * 1 tick = 10 minutes simulées ; 144 ticks = 1 jour. Départ : mardi 1er septembre 2020.
 */
import { GAME_START_ISO, TICKS_PER_DAY, type GameDate } from './types';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Vacances scolaires 2020-21 (bornes incluses) — périmètre de la slice : Toussaint + Noël. */
const VACANCES: ReadonlyArray<readonly [string, string]> = [
  ['2020-10-17', '2020-11-02'],
  ['2020-12-19', '2021-01-04'],
];

const START_MS = Date.parse(GAME_START_ISO + 'T00:00:00Z');
const DAY_MS = 86_400_000;

export function dayIndexOf(tick: number): number {
  return Math.floor(tick / TICKS_PER_DAY);
}
export function tickOfDay(tick: number): number {
  return tick % TICKS_PER_DAY;
}
export function minutesOfDay(tick: number): number {
  return tickOfDay(tick) * 10;
}

export function dateOf(day: number): GameDate {
  const d = new Date(START_MS + day * DAY_MS);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const dd = d.getUTCDate();
  const wd = d.getUTCDay();
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  return { y, m, d: dd, weekday: wd, iso, label: `${DAYS[wd]} ${dd} ${MONTHS[m - 1]} ${y}` };
}

export function dateLabelOfTick(tick: number): string {
  return dateOf(dayIndexOf(tick)).label;
}

export function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hhmmOfTick(tick: number): string {
  return hhmm(minutesOfDay(tick));
}

function isoBetween(iso: string, from: string, to: string): boolean {
  return iso >= from && iso <= to;
}

export function isVacances(day: number): boolean {
  const iso = dateOf(day).iso;
  return VACANCES.some(([a, b]) => isoBetween(iso, a, b));
}

/** École les lundi-vendredi hors vacances (le mercredi après-midi est libre). */
export function isSchoolDay(day: number): boolean {
  const wd = dateOf(day).weekday;
  return wd >= 1 && wd <= 5 && !isVacances(day);
}

export type DayPhase =
  | 'nuit' | 'matin' | 'coursMatin' | 'cantine' | 'coursApresMidi'
  | 'apresEcole' | 'devoirs' | 'soir';

/** Phase du jour pour un jour d'école. */
export function phaseOfDay(minutes: number, schoolDay: boolean, wednesday: boolean): DayPhase {
  if (minutes < 7 * 60) return 'nuit';
  if (minutes >= 22 * 60) return 'nuit';
  if (!schoolDay) {
    if (minutes < 11 * 60) return 'matin';
    if (minutes < 14 * 60) return 'coursApresMidi'; // week-end : milieu de journée
    if (minutes < 17 * 60) return 'apresEcole';
    return 'soir';
  }
  if (minutes < 8 * 60 + 30) return 'matin';
  if (minutes < 12 * 60) return 'coursMatin';
  if (minutes < 13 * 60 + 30) return 'cantine';
  if (wednesday ? minutes < 13 * 60 + 30 : minutes < 16 * 60 + 30) return 'coursApresMidi';
  if (minutes < 18 * 60) return 'devoirs';
  return 'soir';
}

export function weekIndexOf(day: number): number {
  return Math.floor(day / 7);
}
