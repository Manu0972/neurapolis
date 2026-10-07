/**
 * Stand des Roses — premier projet (contrat M5 §3) : achat de stock (15 €),
 * prix 0,5-2 €, demande = f(prix, réputation, jour de semaine, météo), sessions
 * de vente d'1 h (récré ou place), service de courses (2 €, 20 min), équipe
 * Noah + Lina (communication ≥ 2), échecs possibles (stock invendu, rivalité > 60
 * → départ d'un membre), livre de comptes (Σ entrées − sorties = solde, toujours)
 * et répartition de fin de semaine — égalité / équité / incitation — aux effets
 * relationnels 4D distincts et aux compteurs Conseil marche / communs / solidarite.
 * M6 §3 : règles partagées (collectif), règle imposée, optimisation, données,
 * choix écologique, incidents, prévisions comparées, coopérative du week-end
 * (fusion), Contrat de Sécurité (rendement +20 %) et sabotage de Taylor (−15 %).
 * Données : src/data/project.ts. État : w.project (types.ts).
 */
import { MAX_PENDING_DELIVERIES, type Meteo, type NpcId, type Notification, type PlaceId, type ProjectState, type RepartitionMode, type WorldState } from '../core/types';
import { dateOf, dayIndexOf, weekIndexOf } from '../core/clock';
import { rngChance, rngPick } from '../core/rng';
import {
  DATA_SALE, DEMAND_CONFIG, ECO_CHOICE, INCIDENT_CONFIG, OPTIMIZE, REGLE_IMPOSE,
  REPARTITION_CONFIG, STAND_CONFIG, STAND_EVENTS, WEEK_HOURS_LIMIT,
} from '../data/project';
import { SKILLS_LABELS } from '../data/actions';
import { NPC_BY_ID } from '../data/npcs';
import { REPARTITION_MODE_LABELS } from '../data/texts';
import { bump, notify, pushEvent } from './events';
import { applyRelation } from './relations';
import { addXp, skillLevel } from './skills';
import { applyNotion } from './notions';
import { checkVitaliteEvents } from './district';
import { councilKeyDecision } from './council';
import { securityYieldFactor, weeklySecurityCost } from './security';
import { taylorChronoDay, taylorSabotageFactor } from './antagonists';
import { calculateMarketShares, recordMarketSession } from './rival';

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const round2 = (v: number): number => Math.round(v * 100) / 100;

export interface ProjectAction { ok: boolean; message: string }

// ---------- Création ----------

export function createProject(w: WorldState): ProjectAction {
  if (w.project?.active) return { ok: false, message: 'Le Stand des Roses est déjà ouvert.' };
  const day = dayIndexOf(w.time.tick);
  w.project = {
    id: 'stand_des_roses',
    active: true,
    stock: 0,
    price: STAND_CONFIG.defaultPrice,
    members: [],
    rules: { collectif: false, contratSecurite: false },
    sessionsDone: 0,
    coursesDone: 0,
    ledger: [],
    balance: 0,
    week: { index: weekIndexOf(day), revenue: 0, expenses: 0, distributed: false },
    work: { player: 0 },
  };
  pushEvent(w, {
    type: 'vie',
    title: 'Le Stand des Roses ouvre',
    text: 'Ton premier projet : un stand de goûters. Il faudra du stock (15 €), une équipe, et des choix de prix qui feront la différence.',
    causes: [{ facteur: 'choix du joueur : entreprendre', poids: 2 }],
  });
  return { ok: true, message: 'Le Stand des Roses est ouvert.' };
}

// ---------- Livre de comptes (invariant : Σ(entrées − sorties) = solde) ----------

/** Écriture comptable unique : le livre et la caisse bougent ensemble, toujours. */
function post(w: WorldState, label: string, amount: number): void {
  const p = w.project;
  if (!p) return;
  const a = round2(amount);
  const day = dayIndexOf(w.time.tick);
  p.ledger.push({ day, date: dateOf(day).iso, label, amount: a });
  p.balance = round2(p.balance + a);
}

/** Σ(entrées − sorties) du livre — doit toujours égaler project.balance. */
export function ledgerBalance(p: ProjectState): number {
  return round2(p.ledger.reduce((sum, e) => sum + e.amount, 0));
}

/** Résultat de la semaine en cours — distinct de la trésorerie (le solde est cumulé). */
export function weeklyResult(p: ProjectState): number {
  return round2(p.week.revenue - p.week.expenses);
}

export function ledgerInvariantHolds(p: ProjectState): boolean {
  return ledgerBalance(p) === p.balance;
}

// ---------- Stock & prix ----------

export function buyStock(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  const cost = STAND_CONFIG.stockCost;
  // La caisse paie d'abord, la poche complète (équilibrage M7 : un goûter à 1 €
  // ne doit pas verrouiller le stand toute une semaine).
  if (p.balance + w.player.money < cost) {
    return {
      ok: false,
      message: `Pas assez d'argent : le stock coûte ${cost} € (caisse ${p.balance.toFixed(2)} € · toi ${w.player.money.toFixed(2)} €).`,
    };
  }
  const fromCaisse = Math.min(p.balance, cost);
  const fromPoche = round2(cost - fromCaisse);
  if (fromCaisse > 0) post(w, 'Achat de stock (20 unités)', -fromCaisse);
  if (fromPoche > 0) {
    w.player.money = round2(w.player.money - fromPoche);
    post(w, 'Apport de capital', fromPoche); // le joueur met la main à la poche
    post(w, 'Achat de stock (20 unités)', -fromPoche);
  }
  p.stock += STAND_CONFIG.stockUnits;
  p.week.expenses = round2(p.week.expenses + cost);
  bump(w, 'depenses');
  bump(w, 'achatsStock');
  if (!p.pendingDeliveries) p.pendingDeliveries = [];
  const day = dayIndexOf(w.time.tick);
  p.pendingDeliveries.push({
    // Compteur monotone : l'identifiant reste unique même après troncature de la liste.
    id: `cmd_${day}_${w.flags.achatsStock}`,
    orderDay: day,
    arrivalDay: day,
    units: STAND_CONFIG.stockUnits,
    cost,
    supplier: 'Épicerie Bertin',
    delivered: true,
  });
  if (p.pendingDeliveries.length > MAX_PENDING_DELIVERIES) {
    p.pendingDeliveries.splice(0, p.pendingDeliveries.length - MAX_PENDING_DELIVERIES);
  }
  return {
    ok: true,
    message: `Réapprovisionnement auprès de Mme Bertin (+${STAND_CONFIG.stockUnits} unités, −${cost} €). Cartons réceptionnés.`,
  };
}

export function setPrice(w: WorldState, price: number): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  p.price = round2(clamp(price, STAND_CONFIG.priceMin, STAND_CONFIG.priceMax));
  return { ok: true, message: `Prix fixé à ${p.price.toFixed(2)} €.` };
}

// ---------- Équipe ----------

export function recruitMember(w: WorldState, npcId: NpcId): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  if (!(STAND_CONFIG.recruitables as readonly string[]).includes(npcId)) {
    return { ok: false, message: 'Seuls Noah et Lina peuvent rejoindre l’équipe.' };
  }
  if (p.members.includes(npcId)) return { ok: false, message: 'Déjà dans l’équipe.' };
  const level = skillLevel(w, STAND_CONFIG.recruitSkill);
  if (level < STAND_CONFIG.recruitMinLevel) {
    return {
      ok: false,
      message: `Convaincre demande ${SKILLS_LABELS[STAND_CONFIG.recruitSkill]} niveau ${STAND_CONFIG.recruitMinLevel} (actuel : ${level}).`,
    };
  }
  const rel = w.player.relations[npcId];
  if (rel && rel.rivalite > 60) {
    return { ok: false, message: 'Trop de rivalité entre vous pour travailler ensemble.' };
  }
  const name = NPC_BY_ID[npcId]?.name ?? npcId;
  p.members.push(npcId);
  p.work[npcId] = 0;
  applyRelation(w, npcId, { respect: 2 });
  addXp(w, STAND_CONFIG.recruitSkill, 3);
  applyNotion(w, 'confiance_incitations', true);
  bump(w, 'recrutements');
  pushEvent(w, {
    type: 'vie',
    title: `${name} rejoint le stand`,
    text: `${name} a dit oui. À plusieurs, le stand change de visage — et les gains devront se partager.`,
    causes: [
      { facteur: `${SKILLS_LABELS[STAND_CONFIG.recruitSkill]} niveau ${STAND_CONFIG.recruitMinLevel}`, seuil: String(STAND_CONFIG.recruitMinLevel), poids: 2 },
    ],
  });
  return { ok: true, message: `${name} a rejoint l’équipe.` };
}

// ---------- Demande & sessions de vente ----------

/** Demande (unités) d'une session — pure et déterministe (prévision, tests). */
export function demandAt(price: number, reputation: number, weekday: number, meteo: Meteo): number {
  const base = DEMAND_CONFIG.baseAtZero - DEMAND_CONFIG.slope * price;
  const dayFactor = DEMAND_CONFIG.weekdayFactor[weekday] ?? 1;
  const weatherFactor = DEMAND_CONFIG.weatherFactor[meteo];
  return Math.max(0, Math.floor(base * (reputation / DEMAND_CONFIG.reputationDivisor) * dayFactor * weatherFactor));
}

export interface SessionResult { ok: boolean; message: string; demand: number; sold: number; revenue: number }

/** Session de vente d'1 h — à la récré (collège) ou sur la place. */
export function runSalesSession(w: WorldState, place: string): SessionResult {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.', demand: 0, sold: 0, revenue: 0 };
  if (!(STAND_CONFIG.sessionPlaces as readonly string[]).includes(place)) {
    return { ok: false, message: 'Le stand se tient à la récré (collège) ou sur la place.', demand: 0, sold: 0, revenue: 0 };
  }
  if (w.player.asleep) return { ok: false, message: 'Tu dors.', demand: 0, sold: 0, revenue: 0 };
  if (p.stock <= 0) return { ok: false, message: 'Plus de stock — achète avant de vendre.', demand: 0, sold: 0, revenue: 0 };

  const day = dayIndexOf(w.time.tick);
  const placeId: PlaceId = (place === 'collège' || place === 'college') ? 'college' : 'place';
  const { playerShare, rival } = calculateMarketShares(w, placeId);
  const baseDemand = demandAt(p.price, w.player.reputation, dateOf(day).weekday, w.district.meteo);
  // DEMAND_CONFIG représente la demande de référence au partage égal; l'autre moitié revient au rival.
  const marketPotential = baseDemand * 2;
  const demand = Math.max(0, Math.round(marketPotential * playerShare / 100));
  const sold = Math.min(p.stock, demand);
  recordMarketSession(w, placeId, marketPotential, sold);

  // Prévision en attente (action « prévision ») : comparée à cette session (Simon, §6).
  if (p.lastForecast) {
    if (demand < p.lastForecast.expected) {
      bump(w, 'previsionsRatees');
      pushEvent(w, {
        type: 'consequence',
        title: 'Prévision ratée',
        text: `Tu avais prévu ${p.lastForecast.expected} acheteurs : ${demand} sont venus. La fourmi traverse la plage — la complexité venait du sable.`,
      causes: [
        { facteur: 'prévision de demande', seuil: `${p.lastForecast.expected}`, poids: 2 },
        { facteur: 'demande réelle', seuil: `${demand}`, poids: 3 },
        ...(rival ? [{ facteur: `projection d'attractivité face à ${rival.name}`, seuil: `${playerShare}%`, poids: 2 }] : []),
        ],
      });
    } else {
      bump(w, 'previsionsJustes');
    }
    p.lastForecast = undefined;
  }

  const yieldFactor = securityYieldFactor(w) * taylorSabotageFactor(w); // contrat +20 %, sabotage −15 %
  const revenue = round2(sold * p.price * yieldFactor);

  p.sessionsDone += 1;
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 8, 0, 100);
  p.work.player = (p.work['player'] ?? 0) + 3; // 1 h = 3 unités de 20 min
  for (const m of p.members) p.work[m] = (p.work[m] ?? 0) + 3;

  if (sold === 0) {
    // Échec : le stock reste sur les bras (prix, météo, réputation) — le stress du groupe monte.
    w.player.needs.stress = clamp(w.player.needs.stress + 5, 0, 100);
    w.player.needs.moral = clamp(w.player.needs.moral - 5, 0, 100);
    for (const m of p.members) {
      const npc = w.npcs[m];
      if (npc) npc.stress = clamp(npc.stress + 5, 0, 100);
    }
    bump(w, 'echecsVente');
    pushEvent(w, {
      type: 'consequence',
      title: 'Stand désert',
      text: `Une heure au stand, personne ne s’arrête. Le stock ne bouge pas. Le prix (${p.price.toFixed(2)} €) ? La météo ?`,
      causes: [
        { facteur: 'prix de vente', seuil: `${p.price.toFixed(2)} €`, poids: 2 },
        { facteur: 'météo', seuil: w.district.meteo, poids: 2 },
        { facteur: 'réputation dans le quartier', seuil: `${w.player.reputation}/100`, poids: 1 },
      ],
    });
    return { ok: false, message: 'Aucune vente — le stock reste sur les bras.', demand, sold: 0, revenue: 0 };
  }

  p.stock -= sold;
  post(w, `Vente — ${sold} unité(s) à ${p.price.toFixed(2)} €`, revenue);
  p.week.revenue = round2(p.week.revenue + revenue);
  w.player.reputation = clamp(w.player.reputation + 2, 0, 100);
  bump(w, 'ventes');
  bump(w, 'echanges'); // une revente = un échange vécu (déclencheurs du Conseil)
  bump(w, 'sessionsReussies'); // 3 sessions réussies : déclencheur Ohno (§6)
  const chapter2CollectiveSale = w.campaign.currentChapter === 2
    && (w.flags['chapitre2ConversationCoopSamir'] ?? 0) > 0
    && p.rules.collectif;
  if (chapter2CollectiveSale) bump(w, 'chapitre2VentesCollectives');
  addXp(w, 'comptabilite', 1);
  pushEvent(w, {
    type: 'vie',
    title: `Vente au stand — ${sold} unités`,
    text: `${sold} clients s’arrêtent en une heure : ${revenue.toFixed(2)} € dans la caisse. Réputation +2.${chapter2CollectiveSale ? ' L’équipe a tenu cette vente avec les règles décidées ensemble.' : ''}`,
    causes: [
      { facteur: 'prix de vente', seuil: `${p.price.toFixed(2)} €`, poids: 2 },
      { facteur: 'réputation dans le quartier', seuil: `${w.player.reputation - 2}/100`, poids: 1 },
      { facteur: 'météo', seuil: w.district.meteo, poids: 1 },
      ...(rival ? [{ facteur: `projection d'attractivité face à ${rival.name}`, seuil: `${playerShare}%`, poids: 2 }] : []),
      ...(chapter2CollectiveSale ? [{ facteur: 'règles collectives adoptées et conversation avec Samir', poids: 2 }] : []),
    ],
  });

  // Tout vendu : qui pouvait se payer quoi ? (déclencheur Bourdieu, §6).
  if (STAND_EVENTS.distinctionWhenSoldOut && p.stock === 0) {
    bump(w, 'distinctions');
    pushEvent(w, {
      type: 'vie',
      title: 'Distinction remarquée',
      text: 'Tout le stock est parti. Certains paient sans même regarder le prix ; d’autres attendent la fin du marché pour oser demander un rabais. Tu remarques qui peut se permettre quoi.',
      causes: [
        { facteur: 'session où tout s’est vendu', poids: 2 },
        { facteur: 'réputation dans le quartier', seuil: `${w.player.reputation}/100`, poids: 1 },
      ],
    });
  }

  // La paperasse s'invente toute seule (déclencheur Graeber, §6).
  if (p.sessionsDone % STAND_EVENTS.corveeEveryNSessions === 0) {
    bump(w, 'corveesAbsurdes');
    w.player.needs.fatigue = clamp(w.player.needs.fatigue + 2, 0, 100);
    pushEvent(w, {
      type: 'consequence',
      title: 'Corvée absurde',
      text: 'On te tend une feuille de comptage que personne ne lira, pour un inventaire que personne n’a demandé. Une heure de vie envolée en cases à cocher.',
      causes: [{ facteur: `sessions réussies`, seuil: String(p.sessionsDone), poids: 2 }],
    });
  }
  return { ok: true, message: `${sold} vente(s) — +${revenue.toFixed(2)} €.`, demand, sold, revenue };
}

// ---------- Service de courses ----------

/** Course rendue pour l'épicerie (20 min, 2 €) — vitalité du quartier +1. */
export function runCourse(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  if (w.player.asleep) return { ok: false, message: 'Tu dors.' };
  p.coursesDone += 1;
  p.work.player = (p.work['player'] ?? 0) + 1; // 20 min
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 5, 0, 100);
  post(w, 'Course pour l’épicerie (2 €)', STAND_CONFIG.courseFee);
  p.week.revenue = round2(p.week.revenue + STAND_CONFIG.courseFee);
  w.player.reputation = clamp(w.player.reputation + 1, 0, 100);
  w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 1, 0, 100);
  bump(w, 'courses');
  checkVitaliteEvents(w); // une course peut franchir le seuil d'embauche (60)
  return { ok: true, message: `Course livrée : +${STAND_CONFIG.courseFee} € pour le stand · vitalité de l’épicerie +1.` };
}

// ---------- Répartition de fin de semaine ----------

/** Partage exact en cents (méthode du plus grand reste) : Σ parts === total, toujours. */
function splitCents(totalCents: number, weights: ReadonlyArray<number>): number[] {
  const n = weights.length;
  const parts = new Array<number>(n).fill(0);
  const totalW = weights.reduce((sum, x) => sum + x, 0);
  if (totalW <= 0) return parts;
  const remainders: Array<{ idx: number; rem: number }> = [];
  let given = 0;
  for (let i = 0; i < n; i++) {
    const exact = (totalCents * (weights[i] ?? 0)) / totalW;
    const floor = Math.floor(exact);
    parts[i] = floor;
    given += floor;
    remainders.push({ idx: i, rem: exact - floor });
  }
  remainders.sort((a, b) => b.rem - a.rem); // tri stable (ES2019+) : ordre d'origine en cas d'égalité
  for (const r of remainders) {
    if (given >= totalCents) break;
    parts[r.idx] = (parts[r.idx] ?? 0) + 1;
    given += 1;
  }
  return parts;
}

function maxWorkers(p: ProjectState, ids: string[]): string[] {
  let top = -1;
  for (const id of ids) top = Math.max(top, p.work[id] ?? 0);
  return ids.filter((id) => (p.work[id] ?? 0) === top);
}

function conflictTarget(w: WorldState, m: RepartitionMode, p: ProjectState, tops: string[]): string | null {
  if (p.members.length === 0) return null;
  if (m === 'egalite' && tops.length === 1 && tops.length < p.members.length) {
    return tops[0] ?? null;
  }
  if (m === 'incitation') {
    const others = p.members.filter((id) => !tops.includes(id));
    if (others.length > 0) return rngPick(w, others);
  }
  return rngPick(w, p.members);
}

export interface Share { who: string; label: string; amount: number }
export interface RepartitionResult { ok: boolean; message: string; shares: Share[] }

/**
 * Répartition des gains de la semaine selon le mode choisi :
 * égalité (solidarite) / équité selon le travail fourni (communs) /
 * incitation, prime au plus gros travailleur (marche).
 * Effets relationnels 4D distincts par mode ; conflit possible (stress, rivalité).
 */
export function repartition(w: WorldState, mode?: RepartitionMode): RepartitionResult {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.', shares: [] };
  if (p.members.length === 0) {
    return { ok: false, message: 'Pas d’équipe : recrute Noah ou Lina pour répartir les gains.', shares: [] };
  }
  if (p.week.distributed) return { ok: false, message: 'Les gains de la semaine sont déjà répartis.', shares: [] };
  const m: RepartitionMode = mode ?? p.lastRepartition ?? 'egalite';
  const result = weeklyResult(p);
  if (result <= 0) {
    bump(w, 'semainesPerte'); // première semaine de perte : déclencheur Keynes (§6)
    pushEvent(w, {
      type: 'consequence',
      title: 'Semaine de perte',
      text: `La semaine se termine en dessous de zéro (${result.toFixed(2)} €). Pas de gains à répartir — il faudra ajuster le prix, les coûts ou la météo.`,
      causes: [
        { facteur: 'résultat hebdomadaire', seuil: `${result.toFixed(2)} €`, poids: 3 },
        { facteur: 'fin de semaine', poids: 1 },
      ],
      once: 'semainesPerte_event',
    });
    return { ok: false, message: `Semaine à perte (${result.toFixed(2)} €) : rien à répartir.`, shares: [] };
  }
  const pool = round2(Math.min(result, Math.max(0, p.balance)));
  if (pool <= 0) return { ok: false, message: 'La caisse est vide : rien à répartir.', shares: [] };

  const recipients: string[] = ['player', ...p.members];
  const cents = Math.round(pool * 100);
  let centsParts: number[];
  if (m === 'equite') {
    const weights = recipients.map((id) => p.work[id] ?? 0);
    centsParts = weights.some((x) => x > 0)
      ? splitCents(cents, weights)
      : splitCents(cents, recipients.map(() => 1));
  } else if (m === 'incitation') {
    // 50 % en base égale, 50 % en prime au(x) plus gros travailleur(s).
    const baseCents = Math.floor(cents / 2);
    const bonusCents = cents - baseCents;
    const base = splitCents(baseCents, recipients.map(() => 1));
    const tops = maxWorkers(p, recipients);
    const bonus = splitCents(bonusCents, recipients.map((id) => (tops.includes(id) ? 1 : 0)));
    centsParts = recipients.map((_, i) => (base[i] ?? 0) + (bonus[i] ?? 0));
  } else {
    centsParts = splitCents(cents, recipients.map(() => 1));
  }

  const shares: Share[] = [];
  for (let i = 0; i < recipients.length; i++) {
    const id = recipients[i];
    if (id === undefined) continue;
    const amount = round2((centsParts[i] ?? 0) / 100);
    if (amount <= 0) continue;
    const name = id === 'player' ? w.player.name : (NPC_BY_ID[id]?.name ?? id);
    shares.push({ who: id, label: name, amount });
    if (id === 'player') w.player.money = round2(w.player.money + amount);
    post(w, `Répartition — part de ${name}`, -amount);
  }
  p.week.distributed = true;
  p.lastRepartition = m;

  // Effets relationnels 4D distincts par mode (contrat M5).
  const tops = maxWorkers(p, p.members);
  if (m === 'egalite') {
    for (const mem of p.members) applyRelation(w, mem, { amitie: 2 });
    const seulTop = tops.length === 1 && tops.length < p.members.length ? tops[0] : undefined;
    if (seulTop !== undefined) applyRelation(w, seulTop, { rivalite: 1 }); // il a travaillé plus, reçoit pareil
  } else if (m === 'equite') {
    for (const mem of p.members) applyRelation(w, mem, { confiance: 3, respect: 2 });
  } else {
    for (const mem of p.members) {
      if (tops.includes(mem)) applyRelation(w, mem, { respect: 3 });
      else applyRelation(w, mem, { rivalite: 3, amitie: -2 });
    }
  }

  // La répartition est une décision clé du Conseil : doctrines, loyautés, affinités (M4/M6)
  // et un dilemme de justice tranché (déclencheur Rousseau, §6).
  councilKeyDecision(w, REPARTITION_CONFIG.councilKey[m]);
  bump(w, 'dilemmesJustice');
  bump(w, 'partages');
  applyNotion(w, 'egalite_equite_incitation', true);

  let conflict = false;
  if (rngChance(w, REPARTITION_CONFIG.conflictChance[m])) {
    conflict = true;
    bump(w, 'conflitsRepartition'); // premier conflit de répartition : déclencheur Marx (§6)
    w.player.needs.stress = clamp(w.player.needs.stress + 10, 0, 100);
    const target = conflictTarget(w, m, p, tops);
    if (target) {
      applyRelation(w, target, { rivalite: 2 });
      const npc = w.npcs[target];
      if (npc) npc.stress = clamp(npc.stress + 10, 0, 100); // le conflit éprouve (déclencheur Dejours)
    }
    pushEvent(w, {
      type: 'conflit',
      title: 'Conflit de répartition',
      text: `Le partage passe mal : on se dispute autour de la caisse. Stress +10${target ? ` · rivalité +2 avec ${NPC_BY_ID[target]?.name ?? target}` : ''}.`,
      causes: [
        { facteur: 'mode de répartition', seuil: REPARTITION_MODE_LABELS[m], poids: 2 },
        { facteur: 'tensions autour de l’argent', poids: 2 },
      ],
    });
  }

  pushEvent(w, {
    type: 'consequence',
    title: `Répartition — ${REPARTITION_MODE_LABELS[m]}`,
    text: `Les gains de la semaine (${pool.toFixed(2)} €) sont partagés${conflict ? ' — non sans cris' : ''}. ${shares.map((s) => `${s.label} ${s.amount.toFixed(2)} €`).join(' · ')}.`,
    causes: [
      { facteur: 'résultat de la semaine', seuil: `${result.toFixed(2)} €`, poids: 3 },
      { facteur: 'mode de répartition', seuil: REPARTITION_MODE_LABELS[m], poids: 2 },
    ],
  });
  return { ok: true, message: `Répartition (${REPARTITION_MODE_LABELS[m]}) : ${pool.toFixed(2)} € partagés.`, shares };
}

/** Choisit le mode de la prochaine répartition (appliqué en fin de semaine). */
export function setRepartitionMode(w: WorldState, mode: RepartitionMode): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  p.lastRepartition = mode;
  return { ok: true, message: `Mode de répartition : ${REPARTITION_MODE_LABELS[mode]}.` };
}

// ---------- M6 : règles, optimisation, données, écologie ----------

/** Règles partagées : le stand devient collectif (déclencheurs Ostrom et Weber, §6). */
export function adoptSharedRules(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  if (p.members.length < 2) {
    return { ok: false, message: 'Il faut au moins deux membres pour écrire des règles partagées.' };
  }
  p.rules.collectif = true;
  bump(w, 'procedures');
  for (const m of p.members) applyRelation(w, m, { confiance: 2 });
  pushEvent(w, {
    type: 'vie',
    title: 'Règles partagées adoptées',
    text: 'L’équipe écrit ses propres règles : qui tient la caisse, qui réapprovisionne, comment on décide. Chacun les a choisies — chacun les défendra.',
    causes: [
      { facteur: 'équipe du stand', seuil: '2 membres', poids: 2 },
      { facteur: 'choix : écrire les règles ensemble', poids: 3 },
    ],
  });
  return { ok: true, message: 'Règles partagées adoptées : le stand est collectif.' };
}

/** Règle imposée d'en haut : peut être contournée (déclencheur Hayek, §6). */
export function imposeRule(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  if (rngChance(w, REGLE_IMPOSE.failChance)) {
    bump(w, 'reglesEchouees');
    w.player.needs.stress = clamp(w.player.needs.stress + 8, 0, 100);
    for (const m of p.members) applyRelation(w, m, { rivalite: 1 });
    pushEvent(w, {
      type: 'conflit',
      title: 'Règle contournée',
      text: 'Ta règle, posée sans demander, ne tient pas une journée : on la contourne en cachette, on la moque tout bas. Stress +8.',
      causes: [
        { facteur: 'règle imposée d’en haut', poids: 3 },
        { facteur: 'équipe non consultée', poids: 2 },
      ],
    });
    return { ok: false, message: 'La règle est contournée — elle ne tient pas.' };
  }
  for (const m of p.members) applyRelation(w, m, { respect: 1 });
  pushEvent(w, {
    type: 'vie',
    title: 'Règle acceptée',
    text: 'Ta règle, claire et annoncée, est acceptée sans histoires. Cette fois.',
    causes: [{ facteur: 'règle imposée d’en haut', poids: 2 }],
  });
  return { ok: true, message: 'La règle tient. Cette fois.' };
}

/** Tenter une optimisation du rendement (déclencheur Taylor ; échec : Illich, §6). */
export function optimizeStand(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  bump(w, 'optimisations');
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + OPTIMIZE.fatigue, 0, 100);
  if (rngChance(w, OPTIMIZE.failChance)) {
    bump(w, 'outilsContreProductifs');
    w.player.needs.fatigue = clamp(w.player.needs.fatigue + OPTIMIZE.fatigueEchec, 0, 100);
    pushEvent(w, {
      type: 'consequence',
      title: 'Optimisation ratée',
      text: 'Le « rangement optimisé » t’a coûté deux fois le temps qu’il devait gagner. L’outil contre-productif, c’était lui.',
      causes: [
        { facteur: 'optimisation tentée', poids: 2 },
        { facteur: 'échec de l’outil', poids: 2 },
      ],
    });
    return { ok: false, message: 'Raté : l’outil coûte plus de temps qu’il n’en rend.' };
  }
  addXp(w, 'organisation', 2);
  pushEvent(w, {
    type: 'vie',
    title: 'Optimisation réussie',
    text: 'Un geste en moins, une file qui avance : la cadence y gagne un peu, sans casser personne.',
    causes: [{ facteur: 'optimisation tentée', poids: 2 }],
  });
  return { ok: true, message: 'Optimisation réussie — organisation +2 XP.' };
}

/** Vendre le fichier clients : argent rapide, réputation en berne (déclencheur Zuboff, §6). */
export function sellCustomerData(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  bump(w, 'donneesExploitees');
  post(w, 'Vente du fichier clients', DATA_SALE.gain);
  p.week.revenue = round2(p.week.revenue + DATA_SALE.gain);
  w.player.reputation = clamp(w.player.reputation - DATA_SALE.reputationPenalty, 0, 100);
  pushEvent(w, {
    type: 'consequence',
    title: 'Fichier clients vendu',
    text: `Le drive paie bien pour savoir qui achète quoi au stand. ${DATA_SALE.gain} € dans la caisse — et ta réputation en prend un coup (−${DATA_SALE.reputationPenalty}). Le quartier finira par le savoir.`,
    causes: [{ facteur: 'choix : vendre les données du stand', poids: 3 }],
  });
  return { ok: true, message: `Fichier vendu : +${DATA_SALE.gain} € · réputation −${DATA_SALE.reputationPenalty}.` };
}

/** Choix écologique coûteux : payer plus pour abîmer moins (déclencheur Raworth, §6). */
export function makeEcoChoice(w: WorldState): ProjectAction {
  const p = w.project;
  if (!p?.active) return { ok: false, message: 'Pas de projet actif.' };
  if (p.balance >= ECO_CHOICE.cost) {
    post(w, 'Choix écologique (emballages, circuits courts)', -ECO_CHOICE.cost);
  } else if (w.player.money >= ECO_CHOICE.cost) {
    w.player.money = round2(w.player.money - ECO_CHOICE.cost);
    post(w, 'Apport de capital (choix écologique)', ECO_CHOICE.cost);
    post(w, 'Choix écologique (emballages, circuits courts)', -ECO_CHOICE.cost);
  } else {
    return { ok: false, message: `Pas assez d’argent pour le choix écologique (${ECO_CHOICE.cost} €).` };
  }
  p.week.expenses = round2(p.week.expenses + ECO_CHOICE.cost);
  bump(w, 'choixEcoCouteux');
  w.player.reputation = clamp(w.player.reputation + ECO_CHOICE.reputation, 0, 100);
  pushEvent(w, {
    type: 'consequence',
    title: 'Choix écologique coûteux',
    text: `Emballages réutilisables, goûters locaux : ça coûte ${ECO_CHOICE.cost} € de plus, et le quartier le remarque (+${ECO_CHOICE.reputation} réputation). Aucun retour immédiat — c’est le prix du choix.`,
    causes: [{ facteur: 'choix : payer plus pour abîmer moins', poids: 3 }],
  });
  return { ok: true, message: `Choix écologique : −${ECO_CHOICE.cost} € · réputation +${ECO_CHOICE.reputation}.` };
}

/** Prévision de demande (action « prévision ») : comparée à la prochaine session. */
export function registerForecast(w: WorldState): void {
  const p = w.project;
  if (!p?.active) return;
  const day = dayIndexOf(w.time.tick);
  p.lastForecast = {
    expected: demandAt(p.price, w.player.reputation, dateOf(day + 1).weekday, w.district.meteo),
    day,
  };
}

// ---------- Boucle de simulation (appelée par engine.ts) ----------

/** Chaque jour : départs, incidents, chronométrage de Taylor, coopérative du week-end. */
export function projectDay(w: WorldState): void {
  const p = w.project;
  if (!p?.active) return;
  const day = dayIndexOf(w.time.tick);
  for (const id of [...p.members]) {
    const rel = w.player.relations[id];
    if (!rel || rel.rivalite <= 60) continue;
    const name = NPC_BY_ID[id]?.name ?? id;
    p.members = p.members.filter((x) => x !== id);
    delete p.work[id];
    bump(w, 'departsMembres');
    w.player.needs.stress = clamp(w.player.needs.stress + 5, 0, 100);
    pushEvent(w, {
      type: 'conflit',
      title: `${name} quitte le stand`,
      text: `La rivalité était trop forte : ${name} claque la porte du stand et s’en va. L’équipe perd un membre.`,
      causes: [{ facteur: `rivalité avec ${name}`, seuil: '60', poids: 3 }],
    });
  }

  // Incident de discipline (vol, bagarre) : déclencheurs Hobbes et Locke (§6).
  if (p.members.length >= 2 && rngChance(w, INCIDENT_CONFIG.dailyChance)) {
    bump(w, 'incidents');
    bump(w, 'injustices');
    w.player.needs.stress = clamp(w.player.needs.stress + INCIDENT_CONFIG.stressJoueur, 0, 100);
    for (const m of p.members) {
      const npc = w.npcs[m];
      if (npc) npc.stress = clamp(npc.stress + INCIDENT_CONFIG.stressMembres, 0, 100);
    }
    const target = rngPick(w, p.members);
    applyRelation(w, target, { rivalite: INCIDENT_CONFIG.rivalite });
    pushEvent(w, {
      type: 'conflit',
      title: 'Incident au stand',
      text: `Deux unités de stock ont disparu — ou ont été « empruntées ». Tout le monde s’accuse. Stress +${INCIDENT_CONFIG.stressJoueur} · rivalité +${INCIDENT_CONFIG.rivalite} avec ${NPC_BY_ID[target]?.name ?? target}.`,
      causes: [
        { facteur: 'incident au stand (bagarre, vol)', poids: 3 },
        { facteur: 'équipe du stand', seuil: '2 membres', poids: 1 },
      ],
    });
  }

  // Taylor hostile : chronométrage des coéquipiers (stress +, contrat M6).
  taylorChronoDay(w);

  // Fusion « Le Marché des Communs » : coopérative pérenne — ventes du week-end sans présence.
  if (w.council.fusionsDone.includes('marche_des_communs') && p.stock > 0) {
    const weekday = dateOf(day).weekday;
    if (weekday === 0 || weekday === 6) {
      const demand = demandAt(p.price, w.player.reputation, weekday, w.district.meteo);
      const sold = Math.min(p.stock, demand);
      if (sold > 0) {
        const revenue = round2(sold * p.price * securityYieldFactor(w) * taylorSabotageFactor(w));
        p.stock -= sold;
        post(w, 'Coopérative — vente du week-end (sans toi)', revenue);
        p.week.revenue = round2(p.week.revenue + revenue);
        bump(w, 'ventesCoop');
      }
    }
  }
}

/** Fin de semaine : répartition automatique des gains, puis la semaine repart à zéro. */
export function projectWeek(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const p = w.project;
  if (!p?.active) return out;
  if (p.members.length > 0 && !p.week.distributed) {
    const r = repartition(w);
    if (r.ok) out.push(notify('journal', r.message));
  }
  // Semaine > 40 h d'activités cumulées : déclencheur Rosa (§6).
  const hours = Object.values(p.work).reduce((sum, u) => sum + (u ?? 0), 0) / 3;
  if (hours > WEEK_HOURS_LIMIT) bump(w, 'semaines40h');
  // Contrat de Sécurité : amitié du groupe −2/semaine (M6).
  weeklySecurityCost(w, out);
  p.week = { index: weekIndexOf(dayIndexOf(w.time.tick)), revenue: 0, expenses: 0, distributed: false };
  p.work = { player: 0 };
  for (const m of p.members) p.work[m] = 0;
  return out;
}
