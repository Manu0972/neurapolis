/**
 * La chambre, quartier général (vision du 2026-10-07).
 *
 * - Objets : ils arrivent quand le joueur a vraiment fait quelque chose (cours suivis, palier,
 *   voyage, parents fiers…). Certains aident : moins de stress au réveil, un plan de plus,
 *   un peu de savoir-faire chaque lundi.
 * - Plans : l'objectif (une idée de l'Ascension, même d'un palier pas encore atteint), ses
 *   besoins, ce qui manque et comment l'obtenir ; quand tout est prêt, on exécute.
 */
import type { Notification, SkillId, WorldState } from '../core/types';
import { createRoomState, type Plan, type RoomState } from '../core/room_types';
import { dateOf, dayIndexOf } from '../core/clock';
import { ROOM_ITEMS, ROOM_ITEM_BY_ID } from '../data/room_registry';
import { CONTACT_BY_ID } from '../data/ascension/contacts';
import { IDEA_BY_ID, TIERS } from '../data/ascension/ideas';
import { DUEL_BY_ID } from '../data/ascension/duels';
import { ensureAscension, launchCost, requestLaunch, tierChecks } from './ascension';
import { addXp } from './skills';
import { notify } from './events';

export const BASE_PLANS = 1;

export function ensureRoom(w: WorldState): RoomState {
  if (!w.room) w.room = createRoomState();
  return w.room;
}

function bonusSum(w: WorldState, kind: string): number {
  const r = ensureRoom(w);
  return Object.keys(r.owned).reduce((s, id) => {
    const b = ROOM_ITEM_BY_ID[id]?.bonus;
    return s + (b && b.kind === kind ? b.value : 0);
  }, 0);
}

export function maxPlans(w: WorldState): number {
  return BASE_PLANS + bonusSum(w, 'plan');
}

/** Clôture du jour : objets gagnés, jours calmes, avantages des objets. */
export function roomDay(w: WorldState): Notification[] {
  const r = ensureRoom(w);
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  w.flags['joursCalmes'] = w.player.needs.stress <= 60 ? (w.flags['joursCalmes'] ?? 0) + 1 : 0;
  // Plans réalisés : l'affaire tourne, le post-it quitte le tableau.
  const ventures = w.ascension?.ventures ?? {};
  r.plans = r.plans.filter((p) => !(ventures[p.ideaId] && !ventures[p.ideaId]!.closed));
  for (const item of ROOM_ITEMS) {
    if (r.owned[item.id] !== undefined || !item.unlock(w)) continue;
    r.owned[item.id] = day;
    out.push(notify('journal', `🎁 Nouvel objet dans ta chambre : ${item.icon} ${item.name}. ${item.lore}`));
  }
  const calm = bonusSum(w, 'stress');
  if (calm > 0) w.player.needs.stress = Math.max(0, w.player.needs.stress - calm);
  if (dateOf(day).weekday === 1) {
    for (const [kind, skill] of [['negociation', 'negociation'], ['organisation', 'organisation'], ['recherche', 'recherche']] as const) {
      const v = bonusSum(w, kind);
      if (v > 0) addXp(w, skill as SkillId, v);
    }
  }
  return out;
}

// ---------- Plans ----------

export interface CheckItem { label: string; ok: boolean; hint?: string; /** Facultatif : ne compte pas dans l'avancement. */ optional?: boolean }

/** Ce que demande une idée, ce qui est déjà là, et comment obtenir le reste. */
export function planChecklist(w: WorldState, ideaId: string): CheckItem[] {
  const a = ensureAscension(w);
  const idea = IDEA_BY_ID[ideaId];
  if (!idea) return [];
  const out: CheckItem[] = [];
  if (idea.tier > a.tier) {
    const missing = [];
    for (let t = a.tier + 1; t <= idea.tier; t++) missing.push(...tierChecks(w, t as 2 | 3 | 4 | 5 | 6).filter((c) => !c.ok).map((c) => c.label));
    out.push({ label: `Palier ${idea.tier} — ${TIERS[idea.tier - 1]!.name}`, ok: false, hint: `Il te manque : ${missing.join(' ; ')}.` });
  } else {
    out.push({ label: `Palier ${idea.tier} — ${TIERS[idea.tier - 1]!.name}`, ok: true });
  }
  for (const c of idea.needs ?? []) {
    const def = CONTACT_BY_ID[c];
    out.push({ label: `Connexion : ${def?.name ?? c}`, ok: a.contacts[c] !== undefined, hint: def?.how });
  }
  if (idea.minAge) out.push({ label: `Avoir ${idea.minAge} ans`, ok: w.player.age >= idea.minAge || !!w.economy?.sandbox, hint: `Tu as ${w.player.age} ans.` });
  if (idea.flag) out.push({ label: idea.flag.text, ok: (w.flags[idea.flag.id] ?? 0) === idea.flag.value });
  const cost = launchCost(w, idea);
  const borrow = DUEL_BY_ID[idea.duel]?.effects.A.borrow ?? 0;
  const minCash = Math.round(cost * (1 - borrow) * 100) / 100;
  out.push({
    label: `Apport : ${minCash.toLocaleString('fr-FR')} €${borrow > 0 ? ` (mise ${cost.toLocaleString('fr-FR')} €, le reste empruntable)` : ''}`,
    ok: w.player.money >= minCash,
    hint: `Tu as ${Math.floor(w.player.money).toLocaleString('fr-FR')} €, il manque ${Math.max(0, Math.ceil(minCash - w.player.money)).toLocaleString('fr-FR')} €.`,
  });
  const eases = (idea.eases ?? []).filter((c) => a.contacts[c] === undefined).map((c) => CONTACT_BY_ID[c]?.name ?? c);
  if (eases.length > 0) out.push({ label: `Bonus possible : ${eases.join(', ')} (−25 % sur la mise)`, ok: false, optional: true, hint: 'Facultatif : une connexion rend la mise moins chère.' });
  const run = a.ventures[ideaId];
  if (run && !run.closed) out.push({ label: 'Pas déjà lancée', ok: false, hint: 'Cette affaire tourne déjà.' });
  return out;
}

export function planReady(w: WorldState, ideaId: string): boolean {
  return planChecklist(w, ideaId).every((c) => c.ok || c.optional);
}

export function addPlan(w: WorldState, ideaId: string): { ok: boolean; message: string } {
  const r = ensureRoom(w);
  if (!IDEA_BY_ID[ideaId]) return { ok: false, message: 'Idée inconnue.' };
  if (r.plans.some((p) => p.ideaId === ideaId)) return { ok: false, message: 'Ce plan est déjà au tableau.' };
  if (r.plans.length >= maxPlans(w)) return { ok: false, message: `Ton tableau ne tient que ${maxPlans(w)} plan(s). Un objet de chambre peut t’en donner plus.` };
  r.seq += 1;
  r.plans.push({ id: `pl${r.seq}`, ideaId, createdDay: dayIndexOf(w.time.tick) } satisfies Plan);
  w.flags['plansFaits'] = (w.flags['plansFaits'] ?? 0) + 1;
  return { ok: true, message: `Plan affiché : ${IDEA_BY_ID[ideaId]!.name}.` };
}

export function removePlan(w: WorldState, planId: string): void {
  const r = ensureRoom(w);
  r.plans = r.plans.filter((p) => p.id !== planId);
}

/** Exécuter un plan prêt : le double face de l'idée surgit pour la décision de lancement. */
export function executePlan(w: WorldState, planId: string): { ok: boolean; message: string } {
  const r = ensureRoom(w);
  const p = r.plans.find((x) => x.id === planId);
  if (!p) return { ok: false, message: 'Plan introuvable.' };
  if (!planReady(w, p.ideaId)) return { ok: false, message: 'Il manque encore des éléments au plan.' };
  // Le plan reste au tableau tant que l'affaire n'est pas réellement lancée (voir roomDay).
  return requestLaunch(w, p.ideaId);
}
