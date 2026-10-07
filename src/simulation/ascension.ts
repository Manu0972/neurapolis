/**
 * L'Ascension (docs/ASCENSION.md) : idées de business au choix, décisions disputées par un
 * fantôme double face, entreprises simulées chaque jour, verdict après trois semaines.
 *
 * Pédagogie : jusqu'au verdict, l'entreprise tourne dans trois univers parallèles (stratégie A,
 * B et « à ma façon ») avec la même demande ; le verdict compare leurs bénéfices réels et dit
 * qui avait raison, ici et maintenant. Aucune voix n'a toujours raison : la taille du marché,
 * les aléas et le temps décident.
 *
 * Aléa : hachage déterministe (`econRand`), jamais le PRNG du monde.
 */
import type { Notification, WorldState } from '../core/types';
import {
  createAscensionState, type AscensionState, type StrategyKey, type TierId, type VentureRun, type VentureUniverse,
} from '../core/ascension_types';
import { dayIndexOf } from '../core/clock';
import { CONCEPT_BY_ID } from '../data/ascension/concepts';
import { CONTACTS, CONTACT_BY_ID } from '../data/ascension/contacts';
import { DUEL_BY_ID, type StrategyEffects } from '../data/ascension/duels';
import { IDEAS, IDEA_BY_ID, TIERS, TIER_REQUIREMENTS, type IdeaDef } from '../data/ascension/ideas';
import { econRand } from './economy';
import { notify, pushEvent } from './events';
import { sectorDemand } from './happenings_effects';

/** Jours avant le verdict d'une décision. */
export const VERDICT_DAYS = 21;
/** Faillite après tant de jours de caisse négative. */
export const BANKRUPTCY_DAYS = 10;
export const MAX_LEVEL = 5;
const LOAN_DAILY_RATE = 0.08 / 365;
const LOAN_TERM_DAYS = 365;

const round2 = (v: number): number => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function ensureAscension(w: WorldState): AscensionState {
  if (!w.ascension) w.ascension = createAscensionState();
  return w.ascension;
}

// ---------- Connexions, carnet, paliers ----------

/** Met à jour les connexions gagnées ; renvoie les nouvelles. */
export function refreshContacts(w: WorldState): string[] {
  const a = ensureAscension(w);
  const day = dayIndexOf(w.time.tick);
  const fresh: string[] = [];
  for (const c of CONTACTS) {
    if (a.contacts[c.id] === undefined && c.met(w)) {
      a.contacts[c.id] = day;
      fresh.push(c.id);
    }
  }
  return fresh;
}

export function learnConcept(w: WorldState, id: string): boolean {
  const a = ensureAscension(w);
  if (a.concepts[id] !== undefined || !CONCEPT_BY_ID[id]) return false;
  a.concepts[id] = dayIndexOf(w.time.tick);
  return true;
}

/** Bénéfices cumulés qui comptent comme preuve : entreprises de l'Ascension + commerces. */
export function provenProfit(w: WorldState): number {
  const a = ensureAscension(w);
  let shops = 0;
  for (const b of Object.values(w.economy?.businesses ?? {})) {
    for (const h of b.history) shops += h.revenue - h.costOfGoods - h.wages - h.rent - h.other;
  }
  return round2(a.totalProfit + Math.max(0, shops) + (w.flags['gainsBoulot'] ?? 0));
}

export interface TierCheck { label: string; ok: boolean }

export function tierChecks(w: WorldState, tier: Exclude<TierId, 1>): TierCheck[] {
  const a = ensureAscension(w);
  const r = TIER_REQUIREMENTS[tier];
  const fmt = (n: number): string => n.toLocaleString('fr-FR');
  const out: TierCheck[] = [
    { label: `${fmt(r.profit)} € de bénéfices cumulés (${fmt(Math.floor(provenProfit(w)))} €)`, ok: provenProfit(w) >= r.profit },
    { label: `${r.concepts} concept(s) au carnet d’économie (${Object.keys(a.concepts).length})`, ok: Object.keys(a.concepts).length >= r.concepts },
  ];
  if (r.contacts > 0) out.push({ label: `${r.contacts} connexions (${Object.keys(a.contacts).length})`, ok: Object.keys(a.contacts).length >= r.contacts });
  if (r.reputation) out.push({ label: `réputation ${r.reputation} (${Math.round(w.player.reputation)})`, ok: w.player.reputation >= r.reputation });
  if (r.age) out.push({ label: `${r.age} ans`, ok: w.player.age >= r.age || !!w.economy?.sandbox });
  return out;
}

/** Franchit les paliers dont toutes les preuves sont réunies. */
export function checkTier(w: WorldState): Notification[] {
  const a = ensureAscension(w);
  const out: Notification[] = [];
  while (a.tier < 6) {
    const next = (a.tier + 1) as Exclude<TierId, 1>;
    if (!tierChecks(w, next).every((c) => c.ok)) break;
    a.tier = next;
    const t = TIERS[next - 1]!;
    out.push(notify('journal', `🚀 Nouveau palier : ${t.name} (${t.scale}).`));
    pushEvent(w, {
      type: 'opportunite',
      title: `Palier ${next} — ${t.name}`,
      text: `${t.lore} De nouvelles idées de business t’attendent dans l’application Ascension.`,
      causes: [
        { facteur: 'bénéfices cumulés', seuil: `${Math.floor(provenProfit(w)).toLocaleString('fr-FR')} €`, poids: 3 },
        { facteur: 'carnet d’économie', seuil: `${Object.keys(a.concepts).length} concepts`, poids: 2 },
        { facteur: 'connexions', seuil: `${Object.keys(a.contacts).length}`, poids: 2 },
      ],
      once: `palier:${next}`,
    });
  }
  return out;
}

// ---------- Idées : disponibilité et lancement ----------

export interface IdeaStatus { available: boolean; reasons: string[]; cost: number; eased: boolean }

export function launchCost(w: WorldState, idea: IdeaDef): number {
  const a = ensureAscension(w);
  const eased = (idea.eases ?? []).some((c) => a.contacts[c] !== undefined);
  return round2(idea.startCost * (eased ? 0.75 : 1));
}

export function ideaStatus(w: WorldState, id: string): IdeaStatus {
  const a = ensureAscension(w);
  const idea = IDEA_BY_ID[id];
  if (!idea) return { available: false, reasons: ['Idée inconnue.'], cost: 0, eased: false };
  const reasons: string[] = [];
  if (idea.tier > a.tier) reasons.push(`Palier ${idea.tier} (${TIERS[idea.tier - 1]!.name}) requis.`);
  for (const c of idea.needs ?? []) {
    if (a.contacts[c] === undefined) reasons.push(`Connexion requise : ${CONTACT_BY_ID[c]?.name ?? c}. ${CONTACT_BY_ID[c]?.how ?? ''}`);
  }
  if (idea.minAge && w.player.age < idea.minAge && !w.economy?.sandbox) reasons.push(`À partir de ${idea.minAge} ans.`);
  if (idea.flag && (w.flags[idea.flag.id] ?? 0) !== idea.flag.value) reasons.push(idea.flag.text);
  const v = a.ventures[id];
  if (v && !v.closed) reasons.push('Déjà lancée.');
  const cost = launchCost(w, idea);
  const keynesBorrow = DUEL_BY_ID[idea.duel]?.effects.A.borrow ?? 0;
  const minCash = cost * (1 - keynesBorrow);
  if (w.player.money < minCash) reasons.push(`Il faut au moins ${minCash.toLocaleString('fr-FR')} € (tu as ${w.player.money.toFixed(2)} €).`);
  return { available: reasons.length === 0, reasons, cost, eased: cost < idea.startCost };
}

/** Le joueur veut lancer une idée : le double face apparaît et attend sa décision. */
export function requestLaunch(w: WorldState, id: string): { ok: boolean; message: string } {
  const a = ensureAscension(w);
  const st = ideaStatus(w, id);
  if (!st.available) return { ok: false, message: st.reasons[0] ?? 'Indisponible.' };
  const idea = IDEA_BY_ID[id]!;
  a.pending = { duelId: idea.duel, ideaId: id };
  return { ok: true, message: DUEL_BY_ID[idea.duel]?.question ?? '' };
}

export function cancelLaunch(w: WorldState): void {
  ensureAscension(w).pending = undefined;
}

function newUniverse(idea: IdeaDef, eff: StrategyEffects, cost: number, eased: boolean): VentureUniverse {
  return { share: idea.baseShare * 0.4 * (eased ? 1.1 : 1), quality: 50, profit: 0, loan: round2(cost * (eff.borrow ?? 0)) };
}

/** Décision prise : l'entreprise démarre avec la stratégie choisie. */
export function resolveLaunch(w: WorldState, choice: StrategyKey): { ok: boolean; message: string } {
  const a = ensureAscension(w);
  const p = a.pending;
  if (!p) return { ok: false, message: 'Aucune décision en attente.' };
  const idea = IDEA_BY_ID[p.ideaId]!;
  const duel = DUEL_BY_ID[p.duelId]!;
  const st = ideaStatus(w, idea.id);
  if (!st.available) { a.pending = undefined; return { ok: false, message: st.reasons[0] ?? 'Indisponible.' }; }
  const eff = duel.effects[choice];
  const borrowed = round2(st.cost * (eff.borrow ?? 0));
  const own = round2(st.cost - borrowed);
  if (w.player.money < own) return { ok: false, message: `Il faut ${own.toLocaleString('fr-FR')} € d’apport.` };
  w.player.money = round2(w.player.money - own);
  const day = dayIndexOf(w.time.tick);
  const universes: Partial<Record<StrategyKey, VentureUniverse>> = {};
  for (const k of ['A', 'B', 'C'] as const) universes[k] = newUniverse(idea, duel.effects[k], st.cost, st.eased);
  const run: VentureRun = {
    ideaId: idea.id, launchedDay: day, strategy: choice, level: eff.startLevel ?? 1,
    // Trésorerie de départ : un fonds de roulement prélevé sur la mise.
    cash: round2(st.cost * 0.2),
    revenueTotal: 0, profitTotal: 0, universes, verdictDay: day + VERDICT_DAYS, verdictDone: false, redDays: 0,
  };
  a.ventures[idea.id] = run;
  a.pending = undefined;
  const face = choice === 'A' ? duel.a : choice === 'B' ? duel.b : undefined;
  for (const f of [duel.a, duel.b]) {
    const t = (a.trust[f.thinker] ??= { right: 0, wrong: 0, followed: 0, ignored: 0 });
    if (f === face) t.followed += 1; else t.ignored += 1;
  }
  pushEvent(w, {
    type: 'opportunite',
    title: `Lancement — ${idea.name}`,
    text: `${idea.pitch} Stratégie : ${face ? `${face.strategy} (conseil de ${face.name})` : `à ta façon : ${duel.ownWay}`}.${borrowed > 0 ? ` Emprunt : ${borrowed.toLocaleString('fr-FR')} €.` : ''} Verdict dans ${VERDICT_DAYS} jours.`,
    causes: [
      { facteur: `${duel.a.name} : ${duel.a.strategy}`, poids: 2 },
      { facteur: `${duel.b.name} : ${duel.b.strategy}`, poids: 2 },
      { facteur: 'mise de départ', seuil: `${st.cost.toLocaleString('fr-FR')} €${st.eased ? ' (connexion : −25 %)' : ''}`, poids: 1 },
    ],
  });
  return { ok: true, message: `${idea.name} est lancée.` };
}

// ---------- Simulation quotidienne ----------

function levelReach(level: number): number {
  return 1 + 0.6 * (level - 1);
}

/** Demande du jour (€) au niveau du marché, commune à tous les univers. */
function marketDemand(w: WorldState, idea: IdeaDef, day: number, eff: StrategyEffects): number {
  // Cycle économique propre au marché de l'idée (période de deux mois, phase tirée par hachage).
  const phase = econRand(w, 'asc-phase', idea.id) * 60;
  const cycle = Math.sin((2 * Math.PI * (day + phase)) / 60);
  const noise = econRand(w, 'asc-demande', idea.id, day) - 0.5;
  // Le fil d'infos et les surprises pèsent sur le secteur et sur l'entreprise elle-même.
  return Math.max(0, (1 + 0.15 * cycle * (eff.cycle ?? 1) + 0.35 * noise * eff.volatility) * sectorDemand(w, idea.sector, idea.id));
}

interface DayOutcome { revenue: number; costs: number; profit: number; unsold: number; missed: number; interest: number; repay: number }

function simulateUniverse(w: WorldState, idea: IdeaDef, level: number, u: VentureUniverse, eff: StrategyEffects, day: number, eased: boolean): DayOutcome {
  // Part visée : qualité, stratégie, connexion.
  const target = clamp(idea.baseShare * (0.5 + u.quality / 100) * eff.share * (eased ? 1.1 : 1), 0, 0.95);
  u.share = clamp(u.share + (target - u.share) * 0.1, 0, 0.95);
  const reach = idea.market * eff.market * levelReach(level);
  const mood = marketDemand(w, idea, day, eff);
  const expected = reach * u.share;
  // Clients fidèles : une prime de prix fait peu fuir (élasticité modérée).
  const demand = expected * mood * eff.price ** -0.6;
  let sold = demand;
  let unsold = 0;
  let missed = 0;
  const unitCostRate = (1 - idea.margin) * eff.unitCost;
  if (eff.stock === 'masse') {
    // La chaîne produit un volume fixe, calé un peu au-dessus de la demande attendue.
    const produced = expected * 1.08;
    sold = Math.min(demand, produced);
    missed = Math.max(0, demand - produced);
    unsold = Math.max(0, produced - demand) * unitCostRate;
  } else if (eff.stock === 'flux') {
    const cap = expected * 1.1;
    if (demand > cap) { missed = (demand - cap) * 0.4; sold = demand - missed; }
  }
  // Incidents (arrêts, conflits) : une journée de ventes perdue, plus probable si la qualité baisse.
  if (eff.incident && econRand(w, 'asc-incident', idea.id, day, eff.incident) < eff.incident * (1.5 - u.quality / 100)) {
    missed += sold;
    sold = 0;
  }
  const revenue = sold * eff.price;
  const fixed = idea.fixed * eff.fixed * levelReach(level);
  const interest = u.loan * LOAN_DAILY_RATE;
  const repay = Math.min(u.loan, (idea.startCost * (eff.borrow ?? 0)) / LOAN_TERM_DAYS);
  u.loan = Math.max(0, u.loan - repay);
  const costs = sold * unitCostRate + unsold + fixed + interest;
  const profit = revenue - costs;
  // Qualité : dérive de la stratégie, usure quand on manque des clients, retour lent vers 50.
  u.quality = clamp(u.quality + eff.qualityDrift - (missed > demand * 0.25 ? 0.4 : 0) + (50 - u.quality) * 0.01, 0, 100);
  u.profit = round2(u.profit + profit - repay);
  return { revenue: round2(revenue), costs: round2(costs), profit: round2(profit), unsold: round2(unsold), missed: round2(missed), interest, repay };
}

function verdict(w: WorldState, run: VentureRun): Notification[] {
  const a = ensureAscension(w);
  const idea = IDEA_BY_ID[run.ideaId]!;
  const duel = DUEL_BY_ID[idea.duel]!;
  const profits: Partial<Record<StrategyKey, number>> = {};
  for (const k of ['A', 'B', 'C'] as const) profits[k] = round2(run.universes[k]?.profit ?? 0);
  const best = (['A', 'B', 'C'] as const).reduce((m, k) => ((profits[k] ?? -Infinity) > (profits[m] ?? -Infinity) ? k : m), 'A' as StrategyKey);
  // Entre les deux moitiés, qui avait raison ?
  const winner = (profits.A ?? 0) >= (profits.B ?? 0) ? duel.a : duel.b;
  const loser = winner === duel.a ? duel.b : duel.a;
  (a.trust[winner.thinker] ??= { right: 0, wrong: 0, followed: 0, ignored: 0 }).right += 1;
  (a.trust[loser.thinker] ??= { right: 0, wrong: 0, followed: 0, ignored: 0 }).wrong += 1;
  // Le Conseil retient qui avait raison.
  const gw = w.council.ghosts[winner.thinker];
  if (gw) gw.fiabilite = clamp(gw.fiabilite + 4, 0, 100);
  const gl = w.council.ghosts[loser.thinker];
  if (gl) gl.fiabilite = clamp(gl.fiabilite - 2, 0, 100);
  const learned = learnConcept(w, winner.concept);
  run.verdictDone = true;
  // Seul l'univers réel continue.
  run.universes = { [run.strategy]: run.universes[run.strategy]! };
  a.verdicts.push({ day: dayIndexOf(w.time.tick), ideaId: idea.id, duelId: duel.id, chosen: run.strategy, best, profits });
  if (a.verdicts.length > 30) a.verdicts.splice(0, a.verdicts.length - 30);
  const fmt = (v: number | undefined): string => `${(v ?? 0) >= 0 ? '+' : ''}${Math.round(v ?? 0).toLocaleString('fr-FR')} €`;
  const yours = run.strategy === best;
  const concept = CONCEPT_BY_ID[winner.concept];
  pushEvent(w, {
    type: 'consequence',
    title: `Verdict — ${idea.name} : ${winner.name} avait raison`,
    text: `« ${winner.right} » ${loser.name} : « ${loser.wrong} » Sur ${VERDICT_DAYS} jours : ${duel.a.strategy} ${fmt(profits.A)}, ${duel.b.strategy} ${fmt(profits.B)}, à ta façon ${fmt(profits.C)}. ${yours ? 'Ta décision était la meilleure.' : 'Tu as choisi une autre voie.'}${learned && concept ? ` Carnet : « ${concept.name} » — ${concept.summary}` : ''}`,
    causes: [
      { facteur: `${duel.a.name} — ${duel.a.strategy}`, seuil: fmt(profits.A), poids: 3 },
      { facteur: `${duel.b.name} — ${duel.b.strategy}`, seuil: fmt(profits.B), poids: 3 },
      { facteur: 'à ta façon', seuil: fmt(profits.C), poids: 1 },
    ],
  });
  return [notify('journal', `⚖️ ${winner.name} avait raison pour « ${idea.name} » : ${winner.right}${learned ? ' (nouveau concept au carnet)' : ''}`, winner.thinker)];
}

function ventureDay(w: WorldState, run: VentureRun, day: number): Notification[] {
  const a = ensureAscension(w);
  const idea = IDEA_BY_ID[run.ideaId];
  const duel = idea ? DUEL_BY_ID[idea.duel] : undefined;
  if (!idea || !duel || run.closed) return [];
  const eased = (idea.eases ?? []).some((c) => a.contacts[c] !== undefined);
  let real: DayOutcome | undefined;
  // Les univers parallèles partent chacun de leur propre niveau (l'emprunt de Keynes ouvre plus grand).
  const chosenStart = duel.effects[run.strategy].startLevel ?? 1;
  for (const k of ['A', 'B', 'C'] as const) {
    const u = run.universes[k];
    if (!u) continue;
    const level = clamp(run.level + (duel.effects[k].startLevel ?? 1) - chosenStart, 1, MAX_LEVEL);
    const o = simulateUniverse(w, idea, level, u, duel.effects[k], day, eased);
    if (k === run.strategy) real = o;
  }
  if (!real) return [];
  run.cash = round2(run.cash + real.profit - real.repay);
  run.revenueTotal = round2(run.revenueTotal + real.revenue);
  run.profitTotal = round2(run.profitTotal + real.profit);
  a.totalProfit = round2(a.totalProfit + real.profit);
  run.last = { day, demand: round2(real.revenue + real.missed), revenue: real.revenue, costs: real.costs, profit: real.profit, unsold: real.unsold, missed: real.missed };
  const out: Notification[] = [];
  if (!run.verdictDone && day >= run.verdictDay) out.push(...verdict(w, run));
  run.redDays = run.cash < 0 ? run.redDays + 1 : 0;
  if (run.redDays >= BANKRUPTCY_DAYS) {
    run.closed = true;
    learnConcept(w, 'faillite');
    out.push(notify('alerte', `💥 ${idea.name} fait faillite après ${BANKRUPTCY_DAYS} jours dans le rouge.`));
    pushEvent(w, {
      type: 'consequence',
      title: `Faillite — ${idea.name}`,
      text: `La caisse est restée vide trop longtemps. Les fournisseurs ne livrent plus, l’équipe part. Ce que tu as appris, toi, reste. Carnet : « ${CONCEPT_BY_ID['faillite']!.name} ».`,
      causes: [{ facteur: 'jours de caisse négative', seuil: `${BANKRUPTCY_DAYS}`, poids: 3 }],
    });
  }
  return out;
}

/** Clôture du jour : entreprises, connexions, paliers. */
export function ascensionDay(w: WorldState, closedDay: number): Notification[] {
  const a = ensureAscension(w);
  const out: Notification[] = [];
  for (const id of refreshContacts(w)) {
    const c = CONTACT_BY_ID[id]!;
    learnConcept(w, 'capital_social');
    out.push(notify('journal', `🤝 Nouvelle connexion : ${c.name}.`));
    pushEvent(w, {
      type: 'opportunite',
      title: `Connexion — ${c.name}`,
      text: `${c.name} : ${c.role}. Certaines idées de l’Ascension te seront plus faciles grâce à cette personne.`,
      causes: [{ facteur: 'ce que vous avez vécu ensemble', poids: 3 }],
      once: `contact:${id}`,
    });
  }
  for (const run of Object.values(a.ventures)) out.push(...ventureDay(w, run, closedDay));
  out.push(...checkTier(w));
  return out;
}

// ---------- Gestion ----------

export function investCost(run: VentureRun): number {
  const idea = IDEA_BY_ID[run.ideaId]!;
  return round2(idea.startCost * 0.8 * run.level);
}

/** Investir : plus de marché atteint, plus de coûts fixes. */
export function investVenture(w: WorldState, id: string): { ok: boolean; message: string } {
  const run = ensureAscension(w).ventures[id];
  if (!run || run.closed) return { ok: false, message: 'Entreprise introuvable.' };
  if (run.level >= MAX_LEVEL) return { ok: false, message: 'Niveau maximal atteint.' };
  const cost = investCost(run);
  if (w.player.money < cost) return { ok: false, message: `Il faut ${cost.toLocaleString('fr-FR')} €.` };
  w.player.money = round2(w.player.money - cost);
  run.level += 1;
  return { ok: true, message: `${IDEA_BY_ID[id]!.name} passe au niveau ${run.level}.` };
}

export function withdrawVenture(w: WorldState, id: string): { ok: boolean; message: string } {
  const run = ensureAscension(w).ventures[id];
  if (!run || run.closed || run.cash <= 0) return { ok: false, message: 'Rien à retirer.' };
  const amount = run.cash;
  w.player.money = round2(w.player.money + amount);
  run.cash = 0;
  return { ok: true, message: `${amount.toLocaleString('fr-FR')} € retirés.` };
}

export function injectVenture(w: WorldState, id: string, amount: number): { ok: boolean; message: string } {
  const run = ensureAscension(w).ventures[id];
  if (!run || run.closed) return { ok: false, message: 'Entreprise introuvable.' };
  const a = Math.min(amount, w.player.money);
  if (a <= 0) return { ok: false, message: 'Pas d’argent à verser.' };
  w.player.money = round2(w.player.money - a);
  run.cash = round2(run.cash + a);
  return { ok: true, message: `${a.toLocaleString('fr-FR')} € versés dans la caisse.` };
}

export function sellVenture(w: WorldState, id: string): { ok: boolean; message: string } {
  const run = ensureAscension(w).ventures[id];
  if (!run || run.closed) return { ok: false, message: 'Entreprise introuvable.' };
  const idea = IDEA_BY_ID[id]!;
  const recent = run.last ? Math.max(0, run.last.profit) : 0;
  const price = round2(Math.max(0, run.cash) + recent * 120 + idea.startCost * 0.3 * run.level);
  w.player.money = round2(w.player.money + price);
  run.closed = true;
  run.cash = 0;
  return { ok: true, message: `${idea.name} vendue ${price.toLocaleString('fr-FR')} €.` };
}

export function ideasOfTier(tier: TierId): IdeaDef[] {
  return IDEAS.filter((i) => i.tier === tier);
}
