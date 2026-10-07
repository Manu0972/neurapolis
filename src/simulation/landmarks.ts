/**
 * Activités des lieux remarquables (src/data/city/landmarks.ts) : horaires, une fois par jour
 * ou par semaine, effets (argent, besoins, compétences, réputation, confiance des parents,
 * concept du carnet, moyenne). La durée est rendue à la présentation, qui fait avancer
 * l'horloge (« les actions prennent du temps »).
 * État : drapeau `repere:<activité>` = jour + 1 de la dernière fois — pas de changement de schéma.
 */
import type { WorldState } from '../core/types';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay, weekIndexOf } from '../core/clock';
import { LANDMARK_BY_ID, type LandmarkActivity, type LandmarkDef } from '../data/city/landmarks';
import { landmarkAt } from '../data/map';
import { learnConcept } from './ascension';
import { ensureFamily } from './family';
import { econAge } from './proxy';
import { ensureSchoolLifeState } from './school_life';
import { addXp } from './skills';

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
const hhmm = (m: number): string => `${Math.floor(m / 60)} h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const ADJACENT: ReadonlyArray<readonly [number, number]> = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];

/** Lieu remarquable dont la porte touche le joueur. */
export function landmarkAdjacent(w: WorldState): LandmarkDef | undefined {
  const { x, y } = w.player.pos;
  for (const [dx, dy] of ADJACENT) {
    const id = landmarkAt(x + dx, y + dy);
    if (id) return LANDMARK_BY_ID[id];
  }
  return undefined;
}

/** Peut-on faire cette activité maintenant ? Sinon, pourquoi. */
export function activityBlocker(w: WorldState, a: LandmarkActivity): string | null {
  const day = dayIndexOf(w.time.tick);
  const m = minutesOfDay(w.time.tick);
  const wd = dateOf(day).weekday;
  if (a.schoolDays && !isSchoolDay(day)) return 'Seulement les jours d’école.';
  if (a.weekdays && !a.weekdays.includes(wd)) return `Seulement le ${a.weekdays.map((d) => DAYS[d]).join(' et le ')}.`;
  if (m < a.hours[0] || m >= a.hours[1]) return `De ${hhmm(a.hours[0])} à ${hhmm(a.hours[1])}.`;
  if (a.minEconAge && econAge(w) < a.minEconAge) return `À partir de ${a.minEconAge} ans — ou avec un prête-nom.`;
  const last = (w.flags[`repere:${a.id}`] ?? 0) - 1;
  if (last >= 0) {
    if ((a.per ?? 'jour') === 'jour' && last === day) return 'Déjà fait aujourd’hui.';
    if (a.per === 'semaine' && weekIndexOf(last) === weekIndexOf(day)) return 'Déjà fait cette semaine.';
  }
  const money = a.effects.money ?? 0;
  if (money < 0 && w.player.money < -money) return `Il te faut ${(-money).toFixed(2)} €.`;
  return null;
}

export function doLandmarkActivity(w: WorldState, landmarkId: string, activityId: string): { ok: boolean; message: string; minutes: number } {
  const lm = LANDMARK_BY_ID[landmarkId];
  const a = lm?.activities.find((x) => x.id === activityId);
  if (!lm || !a) return { ok: false, message: 'Rien à faire ici.', minutes: 0 };
  const block = activityBlocker(w, a);
  if (block) return { ok: false, message: block, minutes: 0 };
  const e = a.effects;
  const gain = (e.money ?? 0) + (e.moneyPerRep ?? 0) * w.player.reputation;
  w.player.money = Math.round(Math.max(0, w.player.money + gain) * 100) / 100;
  for (const [k, d] of Object.entries(e.needs ?? {})) {
    const key = k as keyof typeof w.player.needs;
    w.player.needs[key] = clamp(w.player.needs[key] + (d ?? 0));
  }
  for (const [skill, xp] of e.xp ?? []) addXp(w, skill, xp);
  if (e.reputation) w.player.reputation = clamp(w.player.reputation + e.reputation);
  if (e.trust) {
    const f = ensureFamily(w);
    f.parents.nora.trust = clamp(f.parents.nora.trust + e.trust);
    f.parents.thierry.trust = clamp(f.parents.thierry.trust + e.trust);
  }
  if (e.average) {
    const sl = ensureSchoolLifeState(w);
    sl.academicAverage = Math.min(20, Math.round((sl.academicAverage + e.average) * 10) / 10);
  }
  let learned = '';
  if (e.concept && learnConcept(w, e.concept)) learned = ' 📒 Nouveau concept au carnet.';
  w.flags[`repere:${a.id}`] = dayIndexOf(w.time.tick) + 1;
  const money = Math.abs(gain) >= 0.01 ? ` (${gain >= 0 ? '+' : '−'}${Math.abs(gain).toFixed(2)} €)` : '';
  return { ok: true, message: `${a.text}${money}${learned}`, minutes: a.minutes };
}
