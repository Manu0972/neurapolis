/**
 * Passer le temps (2026-10-07) : « Finir la journée », « Passer la semaine », « Passer le mois ».
 *
 * Ce n'est pas un saut d'horloge : chaque tick est vraiment simulé (commerces, entreprises,
 * loyers, fil d'infos, famille, collège), avec une routine raisonnable pour le joueur — il va en
 * cours quand il y en a, mange à la cantine et au dîner, rentre dormir à la maison. À la fin,
 * un bilan compare l'avant et l'après. Le saut s'arrête net si une très grosse erreur ouvre un
 * retour en arrière, ou si un voyage commence.
 * Aléa : aucun ici ; tout vient des systèmes déjà déterministes.
 */
import type { Notification, WorldState } from '../core/types';
import { TICKS_PER_DAY } from '../core/types';
import { dateOf, dayIndexOf, isVacances, minutesOfDay } from '../core/clock';
import { PLACE_ANCHORS } from '../data/map';
import { provenProfit } from './ascension';
import { tickWorld } from './engine';
import { attendClass, classWindow, ensureFamily, familyTrust, isInClass } from './family';
import { rewindOffer } from './rewind';
import { ensureSchoolLifeState } from './school_life';
import { isTraveling } from './travel';
import { isOnBus } from './transit';

export type SkipKind = 'jour' | 'semaine' | 'mois' | 'vacances';

export const SKIP_LABELS: Record<SkipKind, string> = {
  jour: 'Finir la journée',
  semaine: 'Passer la semaine',
  mois: 'Passer le mois',
  vacances: 'Passer les vacances',
};

const WAKE = 7 * 60;
const tickOf = (day: number, minutes: number): number => day * TICKS_PER_DAY + Math.floor(minutes / 10);

/** Tick d'arrivée : toujours un réveil à 7 h. */
export function skipTarget(w: WorldState, kind: SkipKind): number {
  const day = dayIndexOf(w.time.tick);
  const next = minutesOfDay(w.time.tick) < WAKE ? day : day + 1;
  if (kind === 'jour') return tickOf(next, WAKE);
  if (kind === 'semaine') {
    let d = next;
    while (dateOf(d).weekday !== 1) d++;
    return tickOf(d, WAKE);
  }
  if (kind === 'vacances') {
    let d = next;
    while (isVacances(d) && d < day + 120) d++;
    return tickOf(d, WAKE);
  }
  return tickOf(next + 27, WAKE);
}

/** Pourquoi on ne peut pas passer le temps maintenant (ou null). */
export function skipBlocker(w: WorldState, kind: SkipKind): string | null {
  if (isTraveling(w)) return 'Tu es en voyage : le temps y passe déjà au rythme des activités.';
  if (isOnBus(w)) return 'Attends d’être descendu du bus.';
  if (isInClass(w)) return 'Le cours n’est pas fini.';
  if (kind === 'vacances' && !isVacances(dayIndexOf(w.time.tick))) return 'Ce n’est pas les vacances.';
  return null;
}

interface Snap {
  tick: number;
  money: number;
  profit: number;
  reputation: number;
  trust: number;
  average: number;
  attended: number;
  absences: number;
  grades: number;
  concepts: number;
  contacts: number;
  tier: number;
}

const snap = (w: WorldState): Snap => {
  const f = ensureFamily(w);
  return {
    tick: w.time.tick,
    money: w.player.money,
    profit: provenProfit(w),
    reputation: w.player.reputation,
    trust: familyTrust(w),
    average: ensureSchoolLifeState(w).academicAverage,
    attended: f.attended.length,
    absences: f.absences.filter((a) => !a.excused).length,
    grades: f.grades.length,
    concepts: Object.keys(w.ascension?.concepts ?? {}).length,
    contacts: Object.keys(w.ascension?.contacts ?? {}).length,
    tier: w.ascension?.tier ?? 1,
  };
};

export interface SkipSession {
  kind: SkipKind;
  target: number;
  before: Snap;
  /** Faits marquants (journal, alertes, bonnes nouvelles), dans l'ordre. */
  highlights: Notification[];
  stopped?: string;
}

export function beginSkip(w: WorldState, kind: SkipKind): SkipSession | { error: string } {
  const block = skipBlocker(w, kind);
  if (block) return { error: block };
  // La routine commence à la maison (les affaires tournent sans toi).
  const home = PLACE_ANCHORS.maison;
  w.player.pos.x = home.x;
  w.player.pos.y = home.y;
  return { kind, target: skipTarget(w, kind), before: snap(w), highlights: [] };
}

/** Simule au plus `maxTicks` ticks ; renvoie true quand le saut est terminé. */
export function stepSkip(w: WorldState, s: SkipSession, maxTicks: number): boolean {
  for (let i = 0; i < maxTicks && w.time.tick < s.target; i++) {
    // Routine : en cours dès que la séance ouvre, repas à la cantine et au dîner.
    if (classWindow(w) && !isInClass(w)) attendClass(w);
    const m = minutesOfDay(w.time.tick);
    if (m === 12 * 60 || m === 19 * 60) w.player.needs.faim = Math.max(0, w.player.needs.faim - 55);
    const out = tickWorld(w).notifications;
    for (const n of out) if (n.kind === 'journal' || n.kind === 'alerte' || n.kind === 'bien') s.highlights.push(n);
    if (s.highlights.length > 40) s.highlights.splice(0, s.highlights.length - 40);
    if (rewindOffer(w)) { s.stopped = 'Une très grosse erreur vient d’arriver : le temps s’arrête pour que tu décides.'; return true; }
    if (isTraveling(w)) { s.stopped = 'Un voyage commence.'; return true; }
  }
  return w.time.tick >= s.target;
}

export interface SkipReport {
  title: string;
  days: number;
  lines: string[];
  highlights: string[];
  stopped?: string;
}

const eur = (v: number): string => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v)).toLocaleString('fr-FR')} €`;

export function skipReport(w: WorldState, s: SkipSession): SkipReport {
  const a = s.before;
  const b = snap(w);
  const days = Math.round((b.tick - a.tick) / TICKS_PER_DAY);
  const lines: string[] = [];
  lines.push(`💶 Argent : ${eur(b.money - a.money)} (tu as ${Math.round(b.money).toLocaleString('fr-FR')} €)`);
  if (Math.abs(b.profit - a.profit) >= 1) lines.push(`📈 Bénéfices de tes affaires : ${eur(b.profit - a.profit)}`);
  const classes = b.attended - a.attended;
  if (classes > 0 || b.absences > a.absences) lines.push(`🏫 Cours suivis : ${classes} demi-journée(s)${b.absences > a.absences ? ` · absences : ${b.absences - a.absences}` : ''}`);
  const f = ensureFamily(w);
  const newGrades = f.grades.slice(-(b.grades - a.grades > 0 ? b.grades - a.grades : 0));
  if (newGrades.length) lines.push(`📝 Notes : ${newGrades.map((g) => `${g.note}/20`).join(', ')} · moyenne ${b.average}/20`);
  if (Math.round(b.trust) !== Math.round(a.trust)) lines.push(`👪 Confiance de tes parents : ${Math.round(a.trust)} → ${Math.round(b.trust)}`);
  if (Math.round(b.reputation) !== Math.round(a.reputation)) lines.push(`⭐ Réputation : ${Math.round(a.reputation)} → ${Math.round(b.reputation)}`);
  if (b.concepts > a.concepts) lines.push(`📒 Concepts appris : +${b.concepts - a.concepts}`);
  if (b.contacts > a.contacts) lines.push(`🤝 Nouvelles connexions : +${b.contacts - a.contacts}`);
  if (b.tier > a.tier) lines.push(`🚀 Nouveau palier d’Ascension : ${b.tier}`);
  return {
    title: `${SKIP_LABELS[s.kind]} — ${days} jour${days > 1 ? 's' : ''}`,
    days,
    lines,
    highlights: s.highlights.slice(-12).map((n) => n.text),
    stopped: s.stopped,
  };
}

/** Saut complet d'un coup (tests, outils). */
export function skipTime(w: WorldState, kind: SkipKind): SkipReport | { error: string } {
  const s = beginSkip(w, kind);
  if ('error' in s) return s;
  while (!stepSkip(w, s, TICKS_PER_DAY)) { /* jour après jour */ }
  return skipReport(w, s);
}
