/**
 * Horloge : temps simulé ↔ date réelle (calendrier scolaire français, zone A, 2020 → 2025 puis type).
 * 1 tick = 10 minutes simulées ; 144 ticks = 1 jour. Départ : mardi 1er septembre 2020.
 */
import { GAME_START_ISO, TICKS_PER_DAY, type GameDate } from './types';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Période de vacances scolaires : premier et dernier jour sans cours (ISO, bornes incluses). */
export interface PeriodeVacances {
  nom: 'Toussaint' | 'Noël' | 'hiver' | 'printemps' | 'été';
  debut: string;
  fin: string;
}

/**
 * Calendrier scolaire officiel (Éducation nationale), **zone A** — celle de l'académie de
 * Clermont-Ferrand, dont Val-Ferrand (ville inventée) emprunte le nom et la géographie.
 * Les dates officielles donnent le jour de fin des cours et le jour de reprise ; ici, `debut`
 * est le premier jour libre et `fin` la veille de la reprise. Les grandes vacances courent
 * jusqu'à la veille de la rentrée suivante. Printemps 2021 : zones unifiées (crise sanitaire).
 */
const CALENDRIER_ZONE_A: ReadonlyArray<PeriodeVacances> = [
  // 2020-2021 (rentrée mardi 1er septembre 2020)
  { nom: 'Toussaint', debut: '2020-10-17', fin: '2020-11-01' },
  { nom: 'Noël', debut: '2020-12-19', fin: '2021-01-03' },
  { nom: 'hiver', debut: '2021-02-06', fin: '2021-02-21' },
  { nom: 'printemps', debut: '2021-04-10', fin: '2021-04-25' },
  { nom: 'été', debut: '2021-07-07', fin: '2021-09-01' },
  // 2021-2022 (rentrée jeudi 2 septembre 2021)
  { nom: 'Toussaint', debut: '2021-10-23', fin: '2021-11-07' },
  { nom: 'Noël', debut: '2021-12-18', fin: '2022-01-02' },
  { nom: 'hiver', debut: '2022-02-12', fin: '2022-02-27' },
  { nom: 'printemps', debut: '2022-04-16', fin: '2022-05-01' },
  { nom: 'été', debut: '2022-07-08', fin: '2022-08-31' },
  // 2022-2023 (rentrée jeudi 1er septembre 2022)
  { nom: 'Toussaint', debut: '2022-10-22', fin: '2022-11-06' },
  { nom: 'Noël', debut: '2022-12-17', fin: '2023-01-02' },
  { nom: 'hiver', debut: '2023-02-04', fin: '2023-02-19' },
  { nom: 'printemps', debut: '2023-04-08', fin: '2023-04-23' },
  { nom: 'été', debut: '2023-07-08', fin: '2023-09-03' },
  // 2023-2024 (rentrée lundi 4 septembre 2023)
  { nom: 'Toussaint', debut: '2023-10-21', fin: '2023-11-05' },
  { nom: 'Noël', debut: '2023-12-23', fin: '2024-01-07' },
  { nom: 'hiver', debut: '2024-02-17', fin: '2024-03-03' },
  { nom: 'printemps', debut: '2024-04-13', fin: '2024-04-28' },
  { nom: 'été', debut: '2024-07-06', fin: '2024-09-01' },
  // 2024-2025 (rentrée lundi 2 septembre 2024)
  { nom: 'Toussaint', debut: '2024-10-19', fin: '2024-11-03' },
  { nom: 'Noël', debut: '2024-12-21', fin: '2025-01-05' },
  { nom: 'hiver', debut: '2025-02-22', fin: '2025-03-09' },
  { nom: 'printemps', debut: '2025-04-19', fin: '2025-05-04' },
  { nom: 'été', debut: '2025-07-05', fin: '2025-08-31' },
];
/** Dernière année scolaire couverte par le calendrier officiel (2024-2025). */
const DERNIERE_ANNEE_OFFICIELLE = 2024;

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

/** Indice de jour d'une date ISO (AAAA-MM-JJ), depuis le 1er septembre 2020. */
export function dayOfIso(iso: string): number {
  return Math.round((Date.parse(iso + 'T00:00:00Z') - START_MS) / DAY_MS);
}

/** Même quantième le mois suivant (31 janvier → 28 ou 29 février), en indice de jour. */
export function sameDateNextMonth(day: number): number {
  const d = dateOf(day);
  const y = d.m === 12 ? d.y + 1 : d.y;
  const m = d.m === 12 ? 1 : d.m + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Math.round((Date.UTC(y, m - 1, Math.min(d.d, last)) - START_MS) / DAY_MS);
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

const isoOfMs = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Premier samedi à partir du jour (ISO) donné. */
function samediDes(iso: string): number {
  let ms = Date.parse(iso + 'T00:00:00Z');
  while (new Date(ms).getUTCDay() !== 6) ms += DAY_MS;
  return ms;
}

/** Deux semaines de vacances : du samedi au dimanche de la semaine suivante (16 jours). */
function quinzaine(nom: PeriodeVacances['nom'], samediMs: number): PeriodeVacances {
  return { nom, debut: isoOfMs(samediMs), fin: isoOfMs(samediMs + 15 * DAY_MS) };
}

/**
 * Au-delà du calendrier officiel (la vie continue après la campagne) : un calendrier type,
 * déterministe, calqué sur les régularités du calendrier français — Toussaint à partir du
 * 3e samedi d'octobre, Noël à partir du samedi entre le 17 et le 23 décembre, hiver et
 * printemps de zone A mi-février et mi-avril, été du premier samedi de juillet au 31 août.
 */
function calendrierType(anneeRentree: number): PeriodeVacances[] {
  const y = anneeRentree;
  const n = y + 1;
  return [
    quinzaine('Toussaint', samediDes(`${y}-10-17`)),
    quinzaine('Noël', samediDes(`${y}-12-17`)),
    quinzaine('hiver', samediDes(`${n}-02-11`)),
    quinzaine('printemps', samediDes(`${n}-04-12`)),
    { nom: 'été', debut: isoOfMs(samediDes(`${n}-07-04`)), fin: `${n}-08-31` },
  ];
}

const cacheAnnees = new Map<number, ReadonlyArray<PeriodeVacances>>();

/** Vacances de l'année scolaire qui commence en septembre `anneeRentree`. */
export function vacancesDeLAnnee(anneeRentree: number): ReadonlyArray<PeriodeVacances> {
  let v = cacheAnnees.get(anneeRentree);
  if (!v) {
    v = anneeRentree <= DERNIERE_ANNEE_OFFICIELLE
      ? CALENDRIER_ZONE_A.filter((p) => p.debut >= `${anneeRentree}-09-01` && p.debut < `${anneeRentree + 1}-09-01`)
      : calendrierType(anneeRentree);
    cacheAnnees.set(anneeRentree, v);
  }
  return v;
}

/** La période de vacances qui contient ce jour, ou null (jour de classe ou simple week-end). */
export function periodeVacances(day: number): PeriodeVacances | null {
  const date = dateOf(day);
  const iso = date.iso;
  // L'été déborde sur septembre : on regarde l'année scolaire courante et la précédente.
  const rentree = date.m >= 9 ? date.y : date.y - 1;
  for (const y of [rentree, rentree - 1]) {
    for (const p of vacancesDeLAnnee(y)) if (iso >= p.debut && iso <= p.fin) return p;
  }
  return null;
}

export function isVacances(day: number): boolean {
  return periodeVacances(day) !== null;
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
