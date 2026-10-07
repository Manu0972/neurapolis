/**
 * Secrets du monde (docs/ASCENSION.md §3.3, lot ASC-5).
 *
 * - Indice : quand les conditions d'un secret sont réunies, un indice arrive le soir (jamais
 *   pendant la première semaine, au plus un tous les trois jours), porté par un fantôme.
 * - Découverte : au bon endroit (lieu ou rue), à la bonne heure, le bon jour, par le bon temps,
 *   le joueur fouille (touche E) et obtient la récompense : concept, connexion, objet, argent.
 * État : drapeaux `indice:<id>` et `secret:<id>` (jour + 1) — pas de champ de sauvegarde ajouté.
 */
import type { Notification, WorldState } from '../core/types';
import type { SecretDef } from '../core/secret_types';
import { dateOf, dayIndexOf, minutesOfDay } from '../core/clock';
import { PLACE_ANCHORS, streetNameAt } from '../data/map';
import { SECRETS, SECRET_BY_ID } from '../data/secrets_registry';
import { ensureAscension, learnConcept } from './ascension';
import { ensureRoom } from './room';
import { notify, pushEvent } from './events';

export const CLUE_GRACE_DAYS = 7;
const CLUE_GAP_DAYS = 3;
const PLACE_REACH = 4;

const has = (w: WorldState, key: string): boolean => (w.flags[key] ?? 0) > 0;

export function clueKnown(w: WorldState, id: string): boolean {
  return has(w, `indice:${id}`);
}

export function secretFound(w: WorldState, id: string): boolean {
  return has(w, `secret:${id}`);
}

function requirementsMet(w: WorldState, s: SecretDef): boolean {
  const r = s.requires;
  if (!r) return true;
  const a = w.ascension;
  if (r.tier !== undefined && (a?.tier ?? 1) < r.tier) return false;
  if (r.concepts !== undefined && Object.keys(a?.concepts ?? {}).length < r.concepts) return false;
  if (r.contact !== undefined && a?.contacts[r.contact] === undefined) return false;
  if (r.flag !== undefined && !has(w, r.flag)) return false;
  return true;
}

function atPlace(w: WorldState, s: SecretDef): boolean {
  const { x, y } = w.player.pos;
  if (s.where.place) {
    const a = PLACE_ANCHORS[s.where.place];
    return Math.max(Math.abs(a.x - x), Math.abs(a.y - y)) <= PLACE_REACH;
  }
  if (s.where.street) return streetNameAt(x, y) === s.where.street;
  return false;
}

function rightMoment(w: WorldState, s: SecretDef): boolean {
  const t = s.when;
  if (!t) return true;
  const hour = Math.floor(minutesOfDay(w.time.tick) / 60);
  if (t.hour && (hour < t.hour[0] || hour >= t.hour[1])) return false;
  if (t.weekday && !t.weekday.includes(dateOf(dayIndexOf(w.time.tick)).weekday)) return false;
  if (t.weather && w.district.meteo !== t.weather) return false;
  return true;
}

/** Secret qu'on peut fouiller ici et maintenant (indice connu, pas encore trouvé). */
export function secretHere(w: WorldState): SecretDef | undefined {
  return SECRETS.find((s) => clueKnown(w, s.id) && !secretFound(w, s.id) && requirementsMet(w, s) && atPlace(w, s) && rightMoment(w, s));
}

export function searchSecret(w: WorldState, id: string): { ok: boolean; message: string } {
  const s = SECRET_BY_ID[id];
  if (!s || secretFound(w, id) || !clueKnown(w, id)) return { ok: false, message: 'Il n’y a rien à trouver ici.' };
  if (!atPlace(w, s) || !rightMoment(w, s) || !requirementsMet(w, s)) return { ok: false, message: 'Pas ici, ou pas maintenant.' };
  const day = dayIndexOf(w.time.tick);
  w.flags[`secret:${id}`] = day + 1;
  w.flags['secretsTrouves'] = (w.flags['secretsTrouves'] ?? 0) + 1;
  let gain = '';
  const v = s.reward.value;
  if (s.reward.kind === 'concept' && typeof v === 'string') { learnConcept(w, v); gain = 'une page de plus au carnet'; }
  if (s.reward.kind === 'contact' && typeof v === 'string') { ensureAscension(w).contacts[v] ??= day; gain = 'une nouvelle connexion'; }
  if (s.reward.kind === 'objet' && typeof v === 'string') { ensureRoom(w).owned[v] ??= day; gain = 'un objet pour ta chambre'; }
  if (s.reward.kind === 'argent' && typeof v === 'number') { w.player.money = Math.round((w.player.money + v) * 100) / 100; gain = `${v} €`; }
  if (s.reward.kind === 'idee' && typeof v === 'string') { w.flags[`idee:${v}`] = day + 1; gain = 'une idée de business'; }
  pushEvent(w, {
    type: 'decouverte',
    title: `Secret — ${s.title}`,
    text: s.lore,
    causes: [
      { facteur: 'indice suivi', seuil: s.where.hint, poids: 3 },
      { facteur: 'récompense', seuil: gain, poids: 2 },
    ],
  });
  return { ok: true, message: `🔎 ${s.title} : ${s.lore}${gain ? ` (${gain})` : ''}` };
}

/** Clôture du jour : un indice de temps en temps, porté par une voix. */
export function secretsDay(w: WorldState): Notification[] {
  const day = dayIndexOf(w.time.tick);
  if (day < CLUE_GRACE_DAYS) return [];
  if (day - (w.flags['dernierIndice'] ?? -CLUE_GAP_DAYS) < CLUE_GAP_DAYS) return [];
  const next = SECRETS.find((s) => !clueKnown(w, s.id) && requirementsMet(w, s));
  if (!next) return [];
  w.flags[`indice:${next.id}`] = day + 1;
  w.flags['dernierIndice'] = day;
  return [notify('fantome', `📜 Un indice : ${next.clue} (${next.where.hint})`, 'smith')];
}

export interface SecretStatus { def: SecretDef; found: boolean; clue: boolean }

export function secretsList(w: WorldState): SecretStatus[] {
  return SECRETS.map((def) => ({ def, found: secretFound(w, def.id), clue: clueKnown(w, def.id) }));
}
