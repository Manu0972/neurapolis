/**
 * Famille et collège (vision du 2026-10-07).
 *
 * - Cours : 8 h 30 – 12 h et 13 h 30 – 16 h 30 (pas le mercredi après-midi). On y va en
 *   entrant au collège ; la séance passe en accéléré avec un « moment de classe ».
 * - Absence : une séance manquée est notée ; excusée si un arrangement avec la principale la
 *   couvre. Deux absences injustifiées en sept jours : convocation des parents.
 * - Parents : Nora et Thierry ont chacun confiance, inquiétude et fierté. Dîner à 19 h 30 si tu
 *   es à la maison ; note du vendredi ; argent de poche s'ils sont fiers ; punition s'ils sont
 *   trop inquiets. Sans leur confiance, ils ne se portent plus garants pour tes baux.
 *
 * Aucune notification n'est émise ici : tout passe par les dîners et le bureau de la principale
 * (présentation). Aléa : hachage déterministe (`econRand`).
 */
import type { WorldState } from '../core/types';
import {
  createFamilyState, type FamilyLine, type FamilyMoment, type FamilyState, type ParentId, type SessionId,
} from '../core/family_types';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay } from '../core/clock';
import { TICKS_PER_DAY } from '../core/types';
import { PLACE_ANCHORS } from '../data/map';
import { CLASS_MOMENTS, SESSION_SUBJECT, SCHOOL_STAFF } from '../data/family_starter';
import { FAMILY_LINES, FAMILY_LINE_BY_ID } from '../data/family_registry';
import { econRand } from './economy';
import { pushEvent } from './events';
import { attendSchoolClass, ensureSchoolLifeState } from './school_life';
import { rollSchoolEvent } from './school_events';

export const SESSIONS: Record<SessionId, { start: number; end: number }> = {
  matin: { start: 8 * 60 + 30, end: 12 * 60 },
  apres: { start: 13 * 60 + 30, end: 16 * 60 + 30 },
};
const DINNER = 19 * 60 + 30;
const CURFEW = 18 * 60;
const HOME_RADIUS = 8;
/** Confiance moyenne en dessous de laquelle les parents ne se portent plus garants. */
export const COSIGN_TRUST = 35;

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function ensureFamily(w: WorldState): FamilyState {
  if (!w.family) w.family = createFamilyState();
  return w.family;
}

const tickAt = (day: number, minutes: number): number => day * TICKS_PER_DAY + Math.floor(minutes / 10);

export function sessionsOf(day: number): SessionId[] {
  if (!isSchoolDay(day)) return [];
  return dateOf(day).weekday === 3 ? ['matin'] : ['matin', 'apres'];
}

/** Séance qu'on peut encore rejoindre maintenant (de 30 min avant à 1 h avant la fin). */
export function classWindow(w: WorldState): SessionId | null {
  const f = ensureFamily(w);
  const day = dayIndexOf(w.time.tick);
  const m = minutesOfDay(w.time.tick);
  for (const s of sessionsOf(day)) {
    const { start, end } = SESSIONS[s];
    if (m >= start - 30 && m <= end - 60 && !f.attended.includes(`${day}:${s}`)) return s;
  }
  return null;
}

export function isInClass(w: WorldState): boolean {
  const c = w.family?.inClass;
  return !!c && w.time.tick < c.untilTick;
}

export function isHome(w: WorldState): boolean {
  const a = PLACE_ANCHORS.maison;
  return Math.max(Math.abs(w.player.pos.x - a.x), Math.abs(w.player.pos.y - a.y)) <= HOME_RADIUS;
}

export function familyTrust(w: WorldState): number {
  const p = ensureFamily(w).parents;
  return (p.nora.trust + p.thierry.trust) / 2;
}

export function parentsCosign(w: WorldState): { ok: boolean; reason: string } {
  return familyTrust(w) >= COSIGN_TRUST
    ? { ok: true, reason: '' }
    : { ok: false, reason: `Tes parents refusent de se porter garants : leur confiance est trop basse (${Math.round(familyTrust(w))}/100). Regagne-la : cours, vérité, dîners.` };
}

function bump(f: FamilyState, who: ParentId | 'les_deux', d: { trust?: number; worry?: number; pride?: number }): void {
  for (const id of who === 'les_deux' ? (['nora', 'thierry'] as const) : [who]) {
    const p = f.parents[id];
    p.trust = clamp(p.trust + (d.trust ?? 0));
    p.worry = clamp(p.worry + (d.worry ?? 0));
    p.pride = clamp(p.pride + (d.pride ?? 0));
  }
}

function topic(f: FamilyState, t: FamilyMoment): void {
  if (!f.topics.includes(t)) f.topics.push(t);
}

function syncSchoolLife(w: WorldState): void {
  const f = ensureFamily(w);
  const sl = ensureSchoolLifeState(w);
  const unexcused = f.absences.filter((a) => !a.excused).length;
  const total = f.attended.length + f.absences.length;
  sl.skippedClassesCount = unexcused;
  if (total > 0) sl.attendanceRate = Math.round((f.attended.length / total) * 100);
  sl.teacherWarningActive = !!f.convocation;
  sl.negotiatedExemption = !!f.arrangement && f.arrangement.untilDay > dayIndexOf(w.time.tick);
  const worry = (f.parents.nora.worry + f.parents.thierry.worry) / 2;
  const pride = (f.parents.nora.pride + f.parents.thierry.pride) / 2;
  sl.parentSentiment = worry >= 80 ? 'tres_inquiet' : worry >= 60 ? 'inquiet' : pride >= 75 ? 'tres_fier' : pride >= 58 ? 'satisfait' : 'neutre';
}

// ---------- Cours ----------

export function attendClass(w: WorldState): { ok: boolean; message: string } {
  const f = ensureFamily(w);
  const s = classWindow(w);
  if (!s) return { ok: false, message: 'Pas de cours à rejoindre maintenant.' };
  const day = dayIndexOf(w.time.tick);
  const subjects = SESSION_SUBJECT[s];
  const subject = subjects[Math.floor(econRand(w, 'matiere', day, s) * subjects.length)]!;
  const moment = CLASS_MOMENTS[Math.floor(econRand(w, 'moment', day, s) * CLASS_MOMENTS.length)]!;
  f.attended.push(`${day}:${s}`);
  if (f.attended.length > 120) f.attended.splice(0, f.attended.length - 120);
  f.inClass = { session: s, day, untilTick: tickAt(day, SESSIONS[s].end), moment: `${subject} — ${moment.text}` };
  attendSchoolClass(w);
  w.player.characteristics.comprehension = Math.min(100, w.player.characteristics.comprehension + moment.comprehension);
  w.player.needs.moral = clamp(w.player.needs.moral + moment.mood);
  bump(f, 'les_deux', { worry: -1 });
  syncSchoolLife(w);
  return { ok: true, message: `${subject}. ${moment.text}` };
}

function recordAbsence(w: WorldState, day: number, s: SessionId): void {
  const f = ensureFamily(w);
  const weekStart = day - ((dateOf(day).weekday + 6) % 7);
  const excusedThisWeek = f.absences.filter((a) => a.excused && a.day >= weekStart).length;
  const sl = ensureSchoolLifeState(w);
  const a = f.arrangement;
  const excused = !!a && a.untilDay > day && sl.academicAverage >= a.minAverage && excusedThisWeek < a.perWeek;
  f.absences.push({ day, session: s, excused });
  if (f.absences.length > 60) f.absences.splice(0, f.absences.length - 60);
  if (excused) return;
  sl.academicAverage = Math.max(0, Math.round((sl.academicAverage - 0.3) * 10) / 10);
  bump(f, 'les_deux', { worry: 7, pride: -1 });
  if (f.promised) {
    bump(f, 'les_deux', { trust: -15 });
    f.promised = false;
  }
  topic(f, 'absence');
  const recent = f.absences.filter((x) => !x.excused && x.day > day - 7).length;
  if (recent >= 2 && !f.convocation) {
    f.convocation = { day, reason: `${recent} demi-journées d’absence injustifiée cette semaine` };
    topic(f, 'convocation');
  }
}

// ---------- Dîners ----------

const TOPIC_PRIORITY: FamilyMoment[] = ['convocation', 'absence', 'mauvaise_note', 'echec_business', 'bonne_note', 'reussite_business', 'fatigue'];

function pickLine(w: WorldState, day: number): FamilyLine | undefined {
  const f = ensureFamily(w);
  const when = TOPIC_PRIORITY.find((t) => f.topics.includes(t)) ?? 'diner';
  const pool = FAMILY_LINES.filter((l) => l.when === when);
  const list = pool.length > 0 ? pool : FAMILY_LINES.filter((l) => l.when === 'diner');
  return list[Math.floor(econRand(w, 'diner', day) * list.length)];
}

export function pendingDinner(w: WorldState): FamilyLine | undefined {
  const id = w.family?.pendingDinner;
  return id ? FAMILY_LINE_BY_ID[id] : undefined;
}

export function resolveDinner(w: WorldState, index: number): { ok: boolean; message: string } {
  const f = ensureFamily(w);
  const line = pendingDinner(w);
  const reply = line?.replies[index];
  if (!line || !reply) return { ok: false, message: 'Pas de dîner en cours.' };
  bump(f, line.speaker, reply.effect);
  if (line.when === 'absence' && reply.label.toLowerCase().includes('promettre')) f.promised = true;
  f.pendingDinner = undefined;
  syncSchoolLife(w);
  return { ok: true, message: reply.answer };
}

// ---------- Convocation ----------

export type ConvocationChoice = 'verite' | 'promesse' | 'mensonge';

export function resolveConvocation(w: WorldState, choice: ConvocationChoice): { ok: boolean; message: string } {
  const f = ensureFamily(w);
  const c = f.convocation;
  if (!c) return { ok: false, message: 'Pas de convocation.' };
  const day = dayIndexOf(w.time.tick);
  const sl = ensureSchoolLifeState(w);
  const p = SCHOOL_STAFF.principal.name;
  let message: string;
  if (choice === 'verite') {
    if (sl.academicAverage >= 12 && familyTrust(w) >= 45) {
      f.arrangement = { with: p, untilDay: day + 60, perWeek: 2, minAverage: 13 };
      bump(f, 'les_deux', { trust: 6, worry: -8, pride: 3 });
      message = `${p} écoute, longtemps. « Une convention jeune entrepreneur : deux demi-journées par semaine, pendant deux mois, tant que ta moyenne tient au-dessus de 13. Tes parents signent. » Thierry signe le premier.`;
    } else {
      f.promised = true;
      bump(f, 'les_deux', { trust: 3, worry: -2 });
      message = `${p} apprécie ta franchise, mais ta moyenne (${sl.academicAverage}/20) ne permet pas d’aménagement. « Remontez d’abord vos notes. » Tu promets d’être en cours.`;
    }
  } else if (choice === 'promesse') {
    f.promised = true;
    bump(f, 'les_deux', { trust: 4, worry: -6 });
    message = `Tu promets devant ${p} et tes parents. Nora te serre la main sous la table. La prochaine absence coûtera cher.`;
  } else {
    const caught = econRand(w, 'mensonge', c.day) < 0.55;
    if (caught) {
      bump(f, 'les_deux', { trust: -25, worry: 15, pride: -5 });
      f.groundedUntil = day + 5;
      message = `${p} sort le registre : tes absences tombent les jours de marché. Le mensonge s’effondre devant tes parents. Puni cinq jours : retour avant 18 h.`;
    } else {
      bump(f, 'les_deux', { worry: -4 });
      message = 'Ton histoire de rendez-vous médical passe. Pour cette fois. Tu sens pourtant le regard de Nora, qui connaît tous les médecins de la ville.';
    }
  }
  f.convocation = undefined;
  f.topics = f.topics.filter((t) => t !== 'convocation');
  pushEvent(w, {
    type: 'vie',
    title: `Convocation chez ${p}`,
    text: message,
    causes: [
      { facteur: 'absences injustifiées', seuil: c.reason, poids: 3 },
      { facteur: 'moyenne', seuil: `${sl.academicAverage}/20`, poids: 2 },
      { facteur: 'confiance des parents', seuil: `${Math.round(familyTrust(w))}/100`, poids: 2 },
    ],
  });
  syncSchoolLife(w);
  return { ok: true, message };
}

// ---------- Horloge ----------

const crossed = (prev: number, now: number, at: number): boolean => prev < at && now >= at;

/** Chaque tick : fin des séances (absences), note du vendredi, dîner, couvre-feu, argent de poche. */
export function familyTick(w: WorldState, prevTick: number): void {
  const f = ensureFamily(w);
  const day = dayIndexOf(w.time.tick);
  if (dayIndexOf(prevTick) !== day) {
    // Nouveau jour : la punition se lève peut-être, l'inquiétude trop haute punit.
    const worry = Math.max(f.parents.nora.worry, f.parents.thierry.worry);
    if (worry >= 85 && f.groundedUntil <= day) f.groundedUntil = day + 3;
    // Ce que les parents ont appris de tes affaires depuis hier.
    const closed = Object.values(w.ascension?.ventures ?? {}).filter((v) => v.closed).length;
    if (closed > (w.flags['famFaillites'] ?? 0)) topic(f, 'echec_business');
    w.flags['famFaillites'] = closed;
    const tier = w.ascension?.tier ?? 1;
    if (tier > (w.flags['famPalier'] ?? 1)) { topic(f, 'reussite_business'); bump(f, 'les_deux', { pride: 6 }); }
    w.flags['famPalier'] = tier;
  }
  const pm = dayIndexOf(prevTick) === day ? minutesOfDay(prevTick) : -1;
  const m = minutesOfDay(w.time.tick);
  if (f.inClass && w.time.tick >= f.inClass.untilTick) {
    // À la sortie du cours, la vie du collège peut s'inviter.
    rollSchoolEvent(w, `${f.inClass.day}:${f.inClass.session}`);
    f.inClass = undefined;
  }
  for (const s of sessionsOf(day)) {
    if (crossed(pm, m, SESSIONS[s].end) && !f.attended.includes(`${day}:${s}`)) recordAbsence(w, day, s);
  }
  // Note du vendredi.
  if (dateOf(day).weekday === 5 && crossed(pm, m, SESSIONS.apres.end)) {
    const sl = ensureSchoolLifeState(w);
    const week = f.attended.filter((k) => Number(k.split(':')[0]) > day - 7).length;
    const note = Math.round(Math.max(0, Math.min(20, 6 + week * 1.1 + w.player.characteristics.comprehension / 20 + econRand(w, 'note', day) * 4 - 2)) * 2) / 2;
    f.grades.push({ day, subject: 'Contrôle de la semaine', note });
    if (f.grades.length > 30) f.grades.splice(0, f.grades.length - 30);
    sl.academicAverage = Math.round(((sl.academicAverage * 3 + note) / 4) * 10) / 10;
    if (note >= 14) { topic(f, 'bonne_note'); bump(f, 'les_deux', { pride: 4, worry: -3 }); }
    if (note < 10) { topic(f, 'mauvaise_note'); bump(f, 'les_deux', { pride: -2, worry: 5 }); }
  }
  // Couvre-feu de la punition.
  if (f.groundedUntil > day && crossed(pm, m, CURFEW) && !isHome(w)) bump(f, 'les_deux', { worry: 5, trust: -3 });
  // Dîner.
  if (crossed(pm, m, DINNER)) {
    if (w.player.needs.fatigue > 80) topic(f, 'fatigue');
    if (isHome(w)) {
      const line = pickLine(w, day);
      f.pendingDinner = line?.id;
      f.lastDinnerDay = day;
      f.topics = f.topics.filter((t) => t === 'convocation' && !!f.convocation);
    } else if (isSchoolDay(day + 1)) {
      bump(f, 'les_deux', { worry: 4 });
      if (f.groundedUntil > day) bump(f, 'les_deux', { trust: -5 });
    }
  }
  // Argent de poche du dimanche, quand ils sont fiers et confiants.
  if (dateOf(day).weekday === 0 && crossed(pm, m, 10 * 60)) {
    const pride = (f.parents.nora.pride + f.parents.thierry.pride) / 2;
    if (pride >= 65 && familyTrust(w) >= 55) {
      w.player.money = Math.round((w.player.money + 5) * 100) / 100;
      w.flags['argentDePoche'] = (w.flags['argentDePoche'] ?? 0) + 5;
    }
  }
  syncSchoolLife(w);
}
