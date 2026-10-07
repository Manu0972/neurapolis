/**
 * Le monde bouge : fil d'infos et surprises (vision du 2026-10-07).
 *
 * - Fil d'infos : jusqu'à trois dépêches par jour (7 h, 12 h, 18 h). Chacune modifie la
 *   demande d'un ou plusieurs secteurs pendant quelques jours ; un fantôme réagit.
 * - Surprises : bonnes ou terribles, jamais pendant les dix premiers jours ; leur fréquence et
 *   leur gravité montent avec le palier et le temps (difficulté). Certaines sont des dilemmes :
 *   deux options, chacune défendue par un fantôme, avec un risque.
 *
 * Aléa : hachage déterministe (`econRand`), jamais le PRNG du monde.
 */
import type { Notification, WorldState } from '../core/types';
import {
  createHappeningsState, type HappeningsState, type NewsTemplate, type SurpriseDef, type SurpriseOption,
} from '../core/happenings_types';
import { dayIndexOf, minutesOfDay } from '../core/clock';
import { NEWS, SURPRISES, SURPRISE_BY_ID } from '../data/happenings_registry';
import { IDEA_BY_ID } from '../data/ascension/ideas';
import { econRand } from './economy';
import { ensureAscension, learnConcept } from './ascension';
import { notify, pushEvent } from './events';

export const NEWS_HOURS: readonly number[] = [7, 12, 18];
/** Pas de surprise pendant les premiers jours : le joueur apprend d'abord. */
export const GRACE_DAYS = 10;
const SURPRISE_COOLDOWN = 3;

const round2 = (v: number): number => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function ensureHappenings(w: WorldState): HappeningsState {
  if (!w.happenings) w.happenings = createHappeningsState();
  return w.happenings;
}

function tierOf(w: WorldState): number {
  return w.ascension?.tier ?? 1;
}

/** Difficulté 0-1 : nulle au début, monte avec les jours et le palier. */
export function difficulty(w: WorldState): number {
  const day = dayIndexOf(w.time.tick);
  if (day < GRACE_DAYS) return 0;
  const time = clamp((day - GRACE_DAYS) / 120, 0, 1);
  return clamp(time * (0.35 + 0.13 * tierOf(w)), 0, 1);
}

/** Échelle d'argent d'une surprise qui vise le joueur. */
export function moneyScale(w: WorldState): number {
  return 10 * 10 ** (tierOf(w) - 1);
}

// ---------- Fil d'infos ----------

function pickNews(w: WorldState, day: number, hour: number): NewsTemplate | undefined {
  const h = ensureHappenings(w);
  const recent = new Set(h.news.slice(0, 20).map((n) => n.templateId));
  const tier = tierOf(w);
  const pool = NEWS.filter((n) => n.minTier <= tier && !recent.has(n.id));
  const list = pool.length > 0 ? pool : NEWS.filter((n) => n.minTier <= tier);
  if (list.length === 0) return undefined;
  return list[Math.floor(econRand(w, 'news-pick', day, hour) * list.length)];
}

function publishNews(w: WorldState, t: NewsTemplate, day: number): Notification {
  const h = ensureHappenings(w);
  h.seq += 1;
  h.news.unshift({
    id: `nw${h.seq}`, templateId: t.id, day, tick: w.time.tick, headline: t.headline, body: t.body,
    category: t.category, effects: t.effects.map((e) => ({ ...e })), ghost: t.reaction.ghost, reaction: t.reaction.text,
  });
  if (h.news.length > 40) h.news.length = 40;
  for (const e of t.effects) h.effects.push({ sector: e.sector, mult: e.mult, untilDay: day + e.days, label: t.headline });
  return notify('info', `📰 ${t.headline} — « ${t.reaction.text} »`, t.reaction.ghost);
}

// ---------- Surprises ----------

interface Target { id?: string; name?: string; kind: SurpriseDef['target'] }

function pickTarget(w: WorldState, kind: SurpriseDef['target'], salt: number): Target | null {
  if (kind === 'joueur') return { kind };
  if (kind === 'entreprise') {
    const runs = Object.values(ensureAscension(w).ventures).filter((r) => !r.closed);
    if (runs.length === 0) return null;
    const r = runs[Math.floor(econRand(w, 'surprise-cible', salt) * runs.length)]!;
    return { kind, id: r.ideaId, name: IDEA_BY_ID[r.ideaId]?.name ?? r.ideaId };
  }
  const shops = Object.values(w.economy?.businesses ?? {});
  if (shops.length === 0) return null;
  const b = shops[Math.floor(econRand(w, 'surprise-cible', salt) * shops.length)]!;
  return { kind, id: b.id, name: b.name };
}

/** Argent d'un facteur de surprise, à l'échelle de la cible. */
function cashFor(w: WorldState, target: Target, factor: number): number {
  if (target.kind === 'entreprise' && target.id) {
    const idea = IDEA_BY_ID[target.id];
    return round2(factor * (idea ? idea.startCost * 0.05 : moneyScale(w)));
  }
  return round2(factor * moneyScale(w));
}

function moveCash(w: WorldState, target: Target, amount: number): number {
  if (amount === 0) return 0;
  if (target.kind === 'entreprise' && target.id) {
    const run = ensureAscension(w).ventures[target.id];
    if (run) { run.cash = round2(run.cash + amount); return amount; }
  }
  if (target.kind === 'commerce' && target.id) {
    const b = w.economy?.businesses[target.id];
    if (b) { b.cash = round2(b.cash + amount); return amount; }
  }
  const before = w.player.money;
  w.player.money = round2(Math.max(0, w.player.money + amount));
  return round2(w.player.money - before);
}

interface Effects { cashFactor?: number; demandMult?: number; demandDays?: number; reputation?: number; stress?: number }

function applyEffects(w: WorldState, target: Target, e: Effects, label: string): number {
  const h = ensureHappenings(w);
  const day = dayIndexOf(w.time.tick);
  const cash = moveCash(w, target, cashFor(w, target, e.cashFactor ?? 0));
  if (e.demandMult !== undefined && e.demandDays && target.id) h.effects.push({ target: target.id, mult: e.demandMult, untilDay: day + e.demandDays, label });
  if (e.reputation) w.player.reputation = clamp(w.player.reputation + e.reputation, 0, 100);
  if (e.stress) w.player.needs.stress = clamp(w.player.needs.stress + e.stress, 0, 100);
  return cash;
}

const TONE_GHOST: Record<SurpriseDef['tone'], string> = { bon: 'smith', mauvais: 'hayek', catastrophe: 'keynes' };

function record(w: WorldState, def: SurpriseDef, cash: number, text: string): void {
  const h = ensureHappenings(w);
  const day = dayIndexOf(w.time.tick);
  h.history.unshift({ day, surpriseId: def.id, title: def.title, tone: def.tone, cash, text });
  if (h.history.length > 30) h.history.length = 30;
  if (def.tone === 'catastrophe') w.flags['catastropheJour'] = day;
  if (def.concept) learnConcept(w, def.concept);
  pushEvent(w, {
    type: def.tone === 'bon' ? 'opportunite' : 'consequence',
    title: `${def.tone === 'catastrophe' ? '💥' : def.tone === 'bon' ? '🍀' : '⚡'} ${def.title}`,
    text,
    causes: [
      { facteur: 'hasard', poids: 2 },
      { facteur: 'argent', seuil: `${cash >= 0 ? '+' : ''}${Math.round(cash).toLocaleString('fr-FR')} €`, poids: cash === 0 ? 1 : 3 },
    ],
  });
}

function fill(text: string, t: Target): string {
  return text.replace(/\{cible\}/g, t.name ? `« ${t.name} »` : 'ton affaire');
}

function trigger(w: WorldState, day: number, hour: number): Notification[] {
  const h = ensureHappenings(w);
  const d = difficulty(w);
  const tier = tierOf(w);
  const roll = econRand(w, 'surprise-ton', day, hour);
  const tone: SurpriseDef['tone'] = roll < 0.12 * d ? 'catastrophe' : roll < 0.3 + 0.3 * d ? 'mauvais' : 'bon';
  const tones: SurpriseDef['tone'][] = tone === 'catastrophe' ? ['catastrophe', 'mauvais'] : [tone];
  for (const t of tones) {
    const pool = SURPRISES.filter((s) => s.tone === t && s.minTier <= tier && !h.history.slice(0, 6).some((r) => r.surpriseId === s.id));
    const n = pool.length;
    for (let k = 0; k < n; k++) {
      const def = pool[(Math.floor(econRand(w, 'surprise-pick', day, hour) * n) + k) % n]!;
      const target = pickTarget(w, def.target, day * 24 + hour);
      if (!target) continue;
      h.lastSurpriseDay = day;
      if (def.options && def.options.length > 0) {
        h.pending = { surpriseId: def.id, day, target: target.id, targetName: target.name };
        return [notify(def.tone === 'bon' ? 'bien' : 'alerte', `⚡ ${def.title} — une décision t’attend.`)];
      }
      const text = fill(def.text, target);
      const cash = applyEffects(w, target, def, def.title);
      record(w, def, cash, text);
      const money = cash !== 0 ? ` (${cash > 0 ? '+' : ''}${Math.round(cash).toLocaleString('fr-FR')} €)` : '';
      return [notify(def.tone === 'bon' ? 'bien' : 'alerte', `${def.tone === 'catastrophe' ? '💥' : def.tone === 'bon' ? '🍀' : '⚡'} ${def.title} : ${text}${money}`, TONE_GHOST[def.tone])];
    }
  }
  return [];
}

/** Dilemme en attente (présentation : fenêtre de décision). */
export function pendingSurprise(w: WorldState): { def: SurpriseDef; targetName?: string; text: string } | null {
  const p = w.happenings?.pending;
  const def = p ? SURPRISE_BY_ID[p.surpriseId] : undefined;
  if (!p || !def) return null;
  return { def, targetName: p.targetName, text: fill(def.text, { kind: def.target, id: p.target, name: p.targetName }) };
}

export function resolveSurprise(w: WorldState, index: number): { ok: boolean; message: string; failed: boolean } {
  const h = ensureHappenings(w);
  const p = h.pending;
  const def = p ? SURPRISE_BY_ID[p.surpriseId] : undefined;
  const opt: SurpriseOption | undefined = def?.options?.[index];
  if (!p || !def || !opt) return { ok: false, message: 'Aucune décision en attente.', failed: false };
  const target: Target = { kind: def.target, id: p.target, name: p.targetName };
  const failed = (opt.risk ?? 0) > 0 && econRand(w, 'surprise-risque', def.id, p.day, index) < (opt.risk ?? 0);
  const effects: Effects = failed
    ? { cashFactor: opt.failCashFactor ?? opt.cashFactor, demandMult: opt.demandMult, demandDays: opt.demandDays, reputation: opt.reputation, stress: (opt.stress ?? 0) + 10 }
    : opt;
  const outcome = failed ? (opt.failOutcome ?? opt.outcome) : opt.outcome;
  const cash = applyEffects(w, target, effects, def.title);
  const t = (ensureAscension(w).trust[opt.ghost] ??= { right: 0, wrong: 0, followed: 0, ignored: 0 });
  t.followed += 1;
  if (failed) t.wrong += 1; else t.right += 1;
  h.pending = undefined;
  record(w, def, cash, `${fill(def.text, target)} Tu as choisi : ${opt.label}. ${outcome}`);
  const money = cash !== 0 ? ` (${cash > 0 ? '+' : ''}${Math.round(cash).toLocaleString('fr-FR')} €)` : '';
  return { ok: true, message: `${outcome}${money}`, failed };
}

// ---------- Horloge ----------

/** À chaque tick : dépêches aux heures fixes, surprises au fil de la journée, effets expirés. */
export function happeningsTick(w: WorldState, prevTick: number): Notification[] {
  const h = ensureHappenings(w);
  const prevHour = Math.floor(minutesOfDay(prevTick) / 60);
  const hour = Math.floor(minutesOfDay(w.time.tick) / 60);
  if (prevHour === hour && dayIndexOf(prevTick) === dayIndexOf(w.time.tick)) return [];
  const day = dayIndexOf(w.time.tick);
  const out: Notification[] = [];
  h.effects = h.effects.filter((e) => e.untilDay > day);
  if (NEWS_HOURS.includes(hour) && econRand(w, 'news', day, hour) < 0.6) {
    const t = pickNews(w, day, hour);
    if (t) out.push(publishNews(w, t, day));
  }
  // Surprises : entre 8 h et 21 h, probabilité horaire qui monte avec la difficulté.
  const d = difficulty(w);
  if (d > 0 && !h.pending && hour >= 8 && hour <= 21 && day - h.lastSurpriseDay >= SURPRISE_COOLDOWN) {
    const perHour = (0.12 + 0.2 * d) / 14;
    if (econRand(w, 'surprise', day, hour) < perHour) out.push(...trigger(w, day, hour));
  }
  return out;
}
