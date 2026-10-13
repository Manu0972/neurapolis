/**
 * Famille et collège (vision du 2026-10-07).
 *
 * - Cours : 8 h 30 – 12 h et 13 h 30 – 16 h 30 (pas le mercredi après-midi). On y va en
 *   entrant au collège ; la séance passe en accéléré avec un « moment de classe ».
 * - Absence : une séance manquée est notée ; excusée si un arrangement avec la principale la
 *   couvre. Deux absences injustifiées en sept jours : convocation des parents.
 * - Parents : Nora et Thierry ont chacun confiance, inquiétude et fierté, qui reviennent
 *   doucement vers leur humeur de fond chaque jour (rien ne reste bloqué à 0 ou 100). Dîner à
 *   19 h 30 si tu es à la maison ; note du vendredi ; punition s'ils sont trop inquiets. Sans
 *   leur confiance, ils ne se portent plus garants pour tes baux.
 * - Argent de poche (vague 2, vie quotidienne) : chaque semaine, un montant selon l'âge
 *   (5 € à 12 ans → 7 € à 15 ans), réduit de moitié après une absence ou si la confiance est
 *   fragile, suspendu pendant une punition. Prime de bulletin à la rentrée.
 * - Années scolaires : rentrée le 1er septembre (5e → 4e → 3e → 2de → 1re), bilan de l'année,
 *   brevet à la sortie de 3e ; les contrôles se corsent chaque année.
 *
 * Aucune notification n'est émise ici : tout passe par les dîners et le bureau de la principale
 * (présentation). Aléa : hachage déterministe (`econRand`).
 */
import type { Notification, WorldState } from '../core/types';
import {
  createFamilyState, type FamilyLine, type FamilyMoment, type FamilyState, type ParentId, type SessionId,
} from '../core/family_types';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay } from '../core/clock';
import { TICKS_PER_DAY } from '../core/types';
import { PLACE_ANCHORS } from '../data/map';
import { CLASS_MOMENTS as STARTER_CLASS_MOMENTS, SESSION_SUBJECT, SCHOOL_STAFF } from '../data/family_starter';
import { CLASS_MOMENTS_EXT } from '../data/school/events';

/** Moments de classe : premiers de Claude, puis les 30 d'Antigravity (workflow AG-2). */
const CLASS_MOMENTS = [...STARTER_CLASS_MOMENTS, ...CLASS_MOMENTS_EXT];
import { FAMILY_LINES, FAMILY_LINE_BY_ID } from '../data/family_registry';
import { econRand } from './economy';
import { pushEvent } from './events';
import { attendSchoolClass, classeScolaire, difficulteClasse, ensureSchoolLifeState, etablissementScolaire } from './school_life';
import { notify } from './events';
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

/** Humeur de fond des parents, vers laquelle les jauges reviennent (2 % de l'écart par jour). */
export const PARENT_BASELINE = { trust: 60, worry: 30, pride: 50 } as const;
const DRIFT = 0.02;

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

const TOPIC_PRIORITY: FamilyMoment[] = ['convocation', 'absence', 'nuit_blanche', 'mauvaise_note', 'echec_business', 'anniversaire', 'bonne_note', 'reussite_business', 'fatigue'];
/**
 * Sujets qui reviennent souvent : on n'en reparle pas avant ce nombre de jours (sans ça, un
 * joueur fatigué entendait parler de sa fatigue à presque tous les dîners pendant quatre ans).
 */
const TOPIC_COOLDOWN: Partial<Record<FamilyMoment, number>> = { fatigue: 7, bonne_note: 6, reussite_business: 10 };
/** Une même réplique ne revient pas avant ce nombre de jours (si le choix le permet). */
export const DINNER_LINE_GAP = 21;
/** Sans sujet particulier, on ne se parle vraiment qu'un soir sur deux ou trois (sinon, les infos). */
const PLAIN_DINNER_CHANCE = 0.45;

const sinceFlag = (w: WorldState, key: string, day: number): number => {
  const v = w.flags[key] ?? 0;
  return v > 0 ? day - (v - 1) : Infinity;
};

function pickLine(w: WorldState, day: number): FamilyLine | undefined {
  const f = ensureFamily(w);
  const topics = TOPIC_PRIORITY.filter((t) => f.topics.includes(t) && sinceFlag(w, `dinerSujet:${t}`, day) >= (TOPIC_COOLDOWN[t] ?? 0));
  const when: FamilyMoment = topics.find((t) => FAMILY_LINES.some((l) => l.when === t)) ?? 'diner';
  if (when === 'diner' && econRand(w, 'diner-calme', day) >= PLAIN_DINNER_CHANCE) return undefined;
  const pool = FAMILY_LINES.filter((l) => l.when === when);
  const all = pool.length > 0 ? pool : FAMILY_LINES.filter((l) => l.when === 'diner');
  const fresh = all.filter((l) => sinceFlag(w, `diner:${l.id}`, day) >= DINNER_LINE_GAP);
  const oldest = all.reduce<FamilyLine | undefined>((a, l) => (!a || sinceFlag(w, `diner:${l.id}`, day) > sinceFlag(w, `diner:${a.id}`, day) ? l : a), undefined);
  const list = fresh.length > 0 ? fresh : oldest ? [oldest] : [];
  const line = list[Math.floor(econRand(w, 'diner', day) * list.length)];
  if (line) {
    w.flags[`diner:${line.id}`] = day + 1;
    w.flags[`dinerSujet:${when}`] = day + 1;
  }
  return line;
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

/** Chaque tick : fin des séances (absences), note du vendredi, dîner, couvre-feu, rentrée. */
export function familyTick(w: WorldState, prevTick: number): void {
  const f = ensureFamily(w);
  const day = dayIndexOf(w.time.tick);
  if (dayIndexOf(prevTick) !== day) {
    // Nouveau jour : les humeurs reviennent doucement vers leur fond (rien ne reste figé).
    for (const id of ['nora', 'thierry'] as const) {
      const p = f.parents[id];
      p.trust = clamp(p.trust + (PARENT_BASELINE.trust - p.trust) * DRIFT);
      p.worry = clamp(p.worry + (PARENT_BASELINE.worry - p.worry) * DRIFT);
      p.pride = clamp(p.pride + (PARENT_BASELINE.pride - p.pride) * DRIFT);
    }
    // L'inquiétude trop haute punit — une fois la punition finie seulement, jamais en chaîne.
    const worry = Math.max(f.parents.nora.worry, f.parents.thierry.worry);
    if (worry >= 85 && f.groundedUntil < day) f.groundedUntil = day + 3;
    // Ce que les parents ont appris de tes affaires depuis hier.
    const closed = Object.values(w.ascension?.ventures ?? {}).filter((v) => v.closed).length;
    if (closed > (w.flags['famFaillites'] ?? 0)) topic(f, 'echec_business');
    w.flags['famFaillites'] = closed;
    const tier = w.ascension?.tier ?? 1;
    if (tier > (w.flags['famPalier'] ?? 1)) { topic(f, 'reussite_business'); bump(f, 'les_deux', { pride: 6 }); }
    w.flags['famPalier'] = tier;
  }
  // Rentrée : l'âge change le 1er septembre (campagne) ; la nouvelle classe suit.
  const classeAge = w.flags['classeAge'] ?? 0;
  if (classeAge === 0) w.flags['classeAge'] = w.player.age;
  else if (w.player.age > classeAge) {
    w.flags['classeAge'] = w.player.age;
    rentree(w, day);
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
  if (dateOf(day).weekday === 5 && crossed(pm, m, SESSIONS.apres.end)) fridayGrade(w, day);
  // Couvre-feu de la punition : le respecter apaise, le braver inquiète.
  if (f.groundedUntil > day && crossed(pm, m, CURFEW)) {
    if (isHome(w)) bump(f, 'les_deux', { worry: -2, trust: 1 });
    else bump(f, 'les_deux', { worry: 5, trust: -3 });
  }
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
  // Pas rentré à 23 h : la nuit blanche sera au menu du prochain dîner.
  if (crossed(pm, m, 23 * 60) && !isHome(w)) {
    topic(f, 'nuit_blanche');
    bump(f, 'les_deux', { worry: 3 });
  }
  syncSchoolLife(w);
}

// ---------- Notes ----------

/** Demi-journées de cours prévues sur les sept derniers jours (jusqu'à `day` inclus). */
function scheduledLastWeek(day: number): number {
  let n = 0;
  for (let d = day - 6; d <= day; d++) if (d >= 0) n += sessionsOf(d).length;
  return n;
}

/**
 * Note du vendredi : la présence pèse le plus (7 points), puis la compréhension (4 points) ;
 * la fatigue coûte, la classe se corse chaque année, et le hasard du contrôle joue ±3 points.
 * Un élève assidu tourne autour de 13-16, un élève qui sèche la moitié des cours autour de 9-11.
 */
export function fridayGrade(w: WorldState, day: number): number {
  const f = ensureFamily(w);
  const sl = ensureSchoolLifeState(w);
  const planned = scheduledLastWeek(day);
  const attended = f.attended.filter((k) => Number(k.split(':')[0]) > day - 7).length;
  const presence = planned > 0 ? Math.min(1, attended / planned) : 1;
  const raw = 4 + 7 * presence + 4 * (w.player.characteristics.comprehension / 100)
    - difficulteClasse(w.player.age) - (w.player.needs.fatigue > 70 ? 1.5 : 0)
    + econRand(w, 'note', day) * 6 - 3;
  const note = Math.round(Math.max(0, Math.min(20, raw)) * 2) / 2;
  f.grades.push({ day, subject: 'Contrôle de la semaine', note });
  if (f.grades.length > 30) f.grades.splice(0, f.grades.length - 30);
  sl.academicAverage = Math.round(((sl.academicAverage * 3 + note) / 4) * 10) / 10;
  if (note >= 14) { topic(f, 'bonne_note'); bump(f, 'les_deux', { pride: 3, worry: -2 }); }
  if (note < 10) { topic(f, 'mauvaise_note'); bump(f, 'les_deux', { pride: -2, worry: 4 }); }
  // Une semaine complète, sans une absence : la confiance se gagne aussi comme ça.
  if (planned > 0 && presence >= 1) bump(f, 'les_deux', { trust: 2 });
  return note;
}

// ---------- Rentrée ----------

/** Brevet à la sortie de 3e : jamais d'échec sec (le jeu suit le joueur jusqu'en 2de). */
export function brevetMention(average: number): { label: string; pride: number } {
  if (average >= 16) return { label: 'mention très bien', pride: 10 };
  if (average >= 14) return { label: 'mention bien', pride: 7 };
  if (average >= 12) return { label: 'mention assez bien', pride: 4 };
  if (average >= 10) return { label: 'admis·e sans mention', pride: 1 };
  return { label: 'admis·e de justesse, après l’oral de rattrapage', pride: -3 };
}

/** Prime de bulletin versée à la rentrée selon la moyenne de l'année écoulée. */
export function bulletinBonus(average: number): number {
  return average >= 16 ? 30 : average >= 14 ? 20 : 0;
}

function rentree(w: WorldState, day: number): void {
  const f = ensureFamily(w);
  const sl = ensureSchoolLifeState(w);
  const age = w.player.age;
  const avg = sl.academicAverage;
  const absences = f.absences.filter((a) => !a.excused && a.day > day - 365).length;
  const bonus = bulletinBonus(avg);
  const parts: string[] = [`Bulletin de l’an dernier : ${avg}/20 de moyenne, ${absences} demi-journée(s) d’absence injustifiée.`];
  if (age === 15) {
    const b = brevetMention(avg);
    parts.push(`Brevet des collèges : ${b.label}.`);
    bump(f, 'les_deux', { pride: b.pride });
  }
  if (bonus > 0) {
    w.player.money = Math.round((w.player.money + bonus) * 100) / 100;
    w.flags['primesBulletin'] = (w.flags['primesBulletin'] ?? 0) + bonus;
    parts.push(`Thierry glisse ${bonus} € dans ta trousse neuve : « Pour le bulletin. »`);
    bump(f, 'les_deux', { pride: 3 });
  } else if (avg < 10) {
    parts.push('Nora a encadré au feutre rouge les remarques des profs. On en reparlera au dîner.');
    bump(f, 'les_deux', { worry: 6 });
  }
  topic(f, 'anniversaire');
  // Nouvelle année, nouvelles règles : l'aménagement et la promesse ne se reportent pas.
  f.arrangement = undefined;
  f.promised = false;
  pushEvent(w, {
    type: 'vie',
    title: `Rentrée en ${classeScolaire(age)}`,
    text: `${age === 15 ? 'Premier jour au ' : 'Retour au '}${etablissementScolaire(age)}, en ${classeScolaire(age)}. ${parts.join(' ')}`,
    causes: [
      { facteur: 'rentrée scolaire', seuil: dateOf(day).iso, poids: 3 },
      { facteur: 'moyenne de l’année', seuil: `${avg}/20`, poids: 2 },
    ],
  });
}

// ---------- Argent de poche ----------

/** Argent de poche hebdomadaire selon l'âge (versé au changement de semaine). */
export const POCKET_MONEY_BY_AGE: Readonly<Record<number, number>> = { 12: 5, 13: 5, 14: 6, 15: 7, 16: 8 };

export function pocketMoneyStatus(w: WorldState): { amount: number; full: number; reason: string } {
  const f = ensureFamily(w);
  const day = dayIndexOf(w.time.tick);
  const full = POCKET_MONEY_BY_AGE[Math.max(12, Math.min(16, w.player.age))]!;
  if (f.groundedUntil >= day) return { amount: 0, full, reason: 'tu es puni·e, il est suspendu' };
  const trust = familyTrust(w);
  if (trust < COSIGN_TRUST) return { amount: 0, full, reason: `leur confiance est trop basse (${Math.round(trust)}/100)` };
  const absent = f.absences.some((a) => !a.excused && a.day > day - 7);
  if (absent) return { amount: Math.floor(full / 2), full, reason: 'moitié seulement : une absence cette semaine' };
  if (trust < 50) return { amount: Math.floor(full / 2), full, reason: 'moitié seulement : leur confiance est fragile' };
  return { amount: full, full, reason: '' };
}

/** Versement de la semaine (appelé par le moteur au changement de semaine). */
export function weeklyPocketMoney(w: WorldState): Notification[] {
  const st = pocketMoneyStatus(w);
  if (st.amount > 0) {
    w.player.money = Math.round((w.player.money + st.amount) * 100) / 100;
    w.flags['argentDePoche'] = (w.flags['argentDePoche'] ?? 0) + st.amount;
  }
  if (st.amount === st.full) return [notify('info', `Argent de poche de la semaine : +${st.amount} €.`)];
  return [notify('info', `Argent de poche de la semaine : ${st.amount > 0 ? `+${st.amount} € (${st.reason})` : `rien — ${st.reason}`}.`)];
}


// ---------- Coup de pouce d'urgence ----------

/** En dessous de cette somme, tes parents peuvent te dépanner. */
export const EMERGENCY_BELOW = 5;
/** Une aide au plus tous les 14 jours. */
export const EMERGENCY_GAP_DAYS = 14;

/**
 * Les parents dépannent quand l'argent manque : 40 € s'ils ont confiance, 20 € si elle est
 * moyenne, rien en dessous de 35. Ça coûte un peu de leur confiance et de leur fierté, et ça
 * inquiète : c'est un filet de sécurité, pas un salaire.
 */
export function emergencyHelpStatus(w: WorldState): { available: boolean; amount: number; reason: string } {
  const day = dayIndexOf(w.time.tick);
  const last = (w.flags['aideParents'] ?? 0) - 1;
  if (w.player.money >= EMERGENCY_BELOW) return { available: false, amount: 0, reason: `Tu as encore ${w.player.money.toFixed(2)} €.` };
  if (last >= 0 && day - last < EMERGENCY_GAP_DAYS) return { available: false, amount: 0, reason: `Ils t’ont déjà dépanné·e il y a ${day - last} jour(s). Encore ${EMERGENCY_GAP_DAYS - (day - last)} jour(s).` };
  const trust = familyTrust(w);
  if (trust < 35) return { available: false, amount: 0, reason: `Confiance trop basse (${Math.round(trust)}/100) : « Commence par revenir à l’heure et aller en cours. »` };
  return { available: true, amount: trust >= 50 ? 40 : 20, reason: '' };
}

export function askParentsHelp(w: WorldState): { ok: boolean; message: string } {
  const st = emergencyHelpStatus(w);
  if (!st.available) return { ok: false, message: st.reason };
  const f = ensureFamily(w);
  w.player.money = Math.round((w.player.money + st.amount) * 100) / 100;
  w.flags['aideParents'] = dayIndexOf(w.time.tick) + 1;
  w.flags['aidesParentsTotal'] = (w.flags['aidesParentsTotal'] ?? 0) + st.amount;
  bump(f, 'les_deux', { trust: -6, pride: -4, worry: 5 });
  return { ok: true, message: `Nora glisse ${st.amount} € sur la table de la cuisine. Thierry ne dit rien, mais il a vu. « On compte sur toi pour qu’on n’ait pas à recommencer. »` };
}
