/**
 * Multijoueur en LAN : règles des interactions entre joueurs (mondes parallèles reliés).
 *
 * Chaque joueur garde sa simulation. Ce module ne connaît pas le réseau : il reçoit des
 * événements (`receiveMultiEvent`), en produit dans `w.multiplayer.outbox` (vidée par la
 * présentation), et expose des effets que l'économie consulte (demande, fournisseurs, locaux
 * tenus par l'autre joueur, concurrence). Tout est déterministe : les tirages (découverte d'un
 * sabotage, contrôle d'une entente) viennent d'un hachage partagé par les deux mondes.
 */
import type { Notification, WorldState } from '../core/types';
import type { ProductCategory } from '../core/economy_types';
import {
  createMultiplayerState, type MultiEffect, type MultiEvent, type MultiMechanicId, type MultiMode, type MultiplayerState, type PeerState, type RemoteShop,
} from '../core/multiplayer_types';
import { createAscensionState } from '../core/ascension_types';
import { dayIndexOf } from '../core/clock';
import { CITY } from '../data/map';
import { BUSINESS_TYPE_BY_ID } from '../data/economy';
import { CONCEPT_BY_ID } from '../data/ascension/concepts';
import { MULTI_MECHANIC_BY_ID, mechanicAllowed, type MultiMechanicDef } from '../data/multi_mechanics';
import { notify } from './events';
import { addXp } from './skills';

const round2 = (v: number): number => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const today = (w: WorldState): number => dayIndexOf(w.time.tick);
const UNIT_DOOR: Readonly<Record<string, { x: number; y: number }>> = Object.fromEntries(CITY.units.map((u) => [u.id, u.door]));

/** Hachage partagé (indépendant de la graine du monde) : les deux joueurs tirent le même nombre. */
export function sharedRand(...keys: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const k of keys) {
    const s = String(k);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 2246822519) >>> 0;
  }
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function ensureMultiplayer(w: WorldState, selfId?: string): MultiplayerState {
  if (!w.multiplayer) w.multiplayer = createMultiplayerState(selfId ?? '');
  if (selfId && !w.multiplayer.selfId) w.multiplayer.selfId = selfId;
  return w.multiplayer;
}

/** Fabrique un événement à envoyer (identifiant unique : joueur + compteur). */
function outgoing(w: WorldState, ev: Omit<MultiEvent, 'id' | 'from' | 'fromName' | 'day'>): MultiEvent {
  const m = ensureMultiplayer(w);
  const e: MultiEvent = { ...ev, id: `${m.selfId}:${m.nextId++}`, from: m.selfId, fromName: w.player.firstName || w.player.name, day: today(w) };
  m.outbox.push(e);
  return e;
}

function log(w: WorldState, peer: string, mechanic: MultiMechanicId, text: string, tone: 'bien' | 'mal' | 'info'): void {
  const m = ensureMultiplayer(w);
  m.log.unshift({ day: today(w), peer, mechanic, text, tone });
  if (m.log.length > 60) m.log.length = 60;
}

function addEffect(w: WorldState, e: Omit<MultiEffect, 'id'>): void {
  const m = ensureMultiplayer(w);
  m.effects.push({ ...e, id: `fx${m.nextId++}` });
}

const fill = (text: string, other: string): string => text.split('{autre}').join(other);

function peerName(w: WorldState, id: string): string {
  return w.multiplayer?.peers[id]?.name ?? 'l’autre joueur';
}

function bumpTrust(w: WorldState, peer: string, d: number): void {
  const p = w.multiplayer?.peers[peer];
  if (p) p.trust = clamp(p.trust + d, -100, 100);
}

// ---------- Profil public et autres joueurs ----------

export interface PeerProfile {
  id: string;
  name: string;
  age: number;
  reputation: number;
  tier: number;
  shops: RemoteShop[];
}

/** Ce que ton monde montre aux autres : nom, âge, réputation, palier, commerces. */
export function publicProfile(w: WorldState): PeerProfile {
  const m = ensureMultiplayer(w);
  const shops: RemoteShop[] = Object.values(w.economy?.businesses ?? {}).map((b) => ({
    unitId: b.unitId,
    name: b.name,
    categories: [...(BUSINESS_TYPE_BY_ID[b.typeId]?.productCategories ?? [])] as ProductCategory[],
    strength: round2(clamp(0.7 + w.player.reputation / 166, 0.7, 1.3)),
  }));
  return { id: m.selfId, name: w.player.firstName || w.player.name, age: w.player.age, reputation: Math.round(w.player.reputation), tier: w.ascension?.tier ?? 1, shops };
}

/** Met à jour (ou crée) un autre joueur à partir de son profil. */
export function upsertPeer(w: WorldState, p: PeerProfile): PeerState {
  const m = ensureMultiplayer(w);
  const cur = m.peers[p.id];
  const next: PeerState = {
    id: p.id, name: p.name, age: p.age, reputation: p.reputation, tier: p.tier, shops: p.shops,
    trust: cur?.trust ?? 0, lastSeenDay: today(w), allianceDays: cur?.allianceDays ?? 0,
  };
  m.peers[p.id] = next;
  return next;
}

/** Local tenu par un autre joueur. */
export function peerShopAt(w: WorldState, unitId: string): { shop: RemoteShop; peer: PeerState } | undefined {
  for (const peer of Object.values(w.multiplayer?.peers ?? {})) {
    const shop = peer.shops.find((s) => s.unitId === unitId);
    if (shop) return { shop, peer };
  }
  return undefined;
}

/** Concurrence des commerces des autres joueurs (même règle que les commerçants de la ville). */
export function peerCompetitionFactor(w: WorldState, unitId: string, categories: readonly string[]): number {
  const door = UNIT_DOOR[unitId];
  if (!door) return 1;
  let f = 1;
  for (const peer of Object.values(w.multiplayer?.peers ?? {})) {
    for (const s of peer.shops) {
      const d = UNIT_DOOR[s.unitId];
      if (!d || s.unitId === unitId || !s.categories.some((c) => categories.includes(c))) continue;
      if (Math.hypot(d.x - door.x, d.y - door.y) > 80) continue;
      f *= 1 - 0.12 * s.strength;
    }
  }
  return f;
}

// ---------- Effets consultés par l'économie ----------

function activeEffects(w: WorldState): MultiEffect[] {
  const d = today(w);
  return (w.multiplayer?.effects ?? []).filter((e) => e.untilDay > d);
}

/** Multiplicateur de demande (recommandations, guerre des prix, rumeurs, entente, inspection). */
export function multiDemand(w: WorldState): number {
  let m = 1;
  for (const e of activeEffects(w)) if (e.kind === 'demande' || e.kind === 'entente' || e.kind === 'fermeture') m *= e.value;
  return clamp(m, 0.1, 2.5);
}

/** Écart de prix chez les grossistes (−0,08 achats groupés, +0,12 stocks raflés…). */
export function multiSupplierDelta(w: WorldState): number {
  let d = 0;
  for (const e of activeEffects(w)) if (e.kind === 'fournisseur') d += e.value;
  return clamp(d, -0.3, 0.5);
}

/** Un autre joueur signe pour toi (garant mutuel). */
export function peerGuarantee(w: WorldState): boolean {
  return activeEffects(w).some((e) => e.kind === 'garant');
}

// ---------- Agir ----------

export interface ActParams {
  amount?: number;
  rate?: number;
  concept?: string;
}

/** Peut-on lancer cette mécanique vers ce joueur ? (null = oui) */
export function actBlocker(w: WorldState, mode: MultiMode, id: MultiMechanicId, peer: string, params: ActParams = {}): string | null {
  const def = MULTI_MECHANIC_BY_ID[id];
  const m = ensureMultiplayer(w);
  if (!def) return 'Mécanique inconnue.';
  if (!m.peers[peer]) return 'Ce joueur n’est pas dans la partie.';
  if (!mechanicAllowed(mode, def.kind)) return 'Interdit dans ce mode de partie.';
  if (id === 'bail_coupe') return 'Automatique : louer un local le retire du marché pour l’autre.';
  const d = today(w);
  const last = m.cooldowns[`${id}:${peer}`];
  if (last !== undefined && d - last < def.cooldownDays) return `Encore ${def.cooldownDays - (d - last)} jour(s) avant de recommencer.`;
  if (def.kind === 'sabotage' && m.cooldowns['sabotage'] === d) return 'Un seul sabotage par jour.';
  if (w.player.money < def.cost) return `Il te faut ${def.cost} €.`;
  if (id === 'pret') {
    const a = params.amount ?? 0;
    if (!(a >= 10)) return 'Prête au moins 10 €.';
    if (a > w.player.money) return 'Tu n’as pas cette somme.';
  }
  if (id === 'formation') {
    const known = Object.keys(w.ascension?.concepts ?? {});
    if (!known.length) return 'Ton carnet est vide : apprends d’abord un concept.';
    if (params.concept && !known.includes(params.concept)) return 'Tu ne connais pas ce concept.';
  }
  if (id === 'garant_mutuel' && w.player.age < 18 && !w.economy?.sandbox && !(w.flags['mandat'] ?? 0)) return 'Il faut toi-même pouvoir signer (18 ans ou un prête-nom).';
  return null;
}

/** Lance une mécanique : coût et effets de ton côté, événement dans la boîte d'envoi. */
export function actOn(w: WorldState, mode: MultiMode, id: MultiMechanicId, peer: string, params: ActParams = {}): { ok: boolean; message: string; notifications: Notification[] } {
  const block = actBlocker(w, mode, id, peer, params);
  if (block) return { ok: false, message: block, notifications: [] };
  const def = MULTI_MECHANIC_BY_ID[id];
  const m = ensureMultiplayer(w);
  const d = today(w);
  const other = peerName(w, peer);
  m.cooldowns[`${id}:${peer}`] = d;
  if (def.kind === 'sabotage') m.cooldowns['sabotage'] = d;
  if (def.cost) w.player.money = round2(w.player.money - def.cost);
  const notes: Notification[] = [notify('fantome', def.kind === 'coop' ? def.ghostFor.text : def.ghostAgainst.text, def.kind === 'coop' ? def.ghostFor.ghost : def.ghostAgainst.ghost)];
  if (def.needsAccept) {
    let amount = 0;
    let rate = 0;
    if (id === 'pret') {
      amount = round2(params.amount ?? 0);
      rate = clamp(params.rate ?? 0, 0, 0.2);
      // Séquestre : l'argent part tout de suite, il revient si l'autre refuse.
      w.player.money = round2(w.player.money - amount);
    }
    outgoing(w, { to: peer, mechanic: id, phase: 'offer', amount, rate, days: id === 'pret' ? 14 : undefined });
    log(w, peer, id, `Proposition envoyée à ${other} : ${def.label.toLowerCase()}.`, 'info');
    return { ok: true, message: `Proposition envoyée à ${other}.`, notifications: notes };
  }
  // Actions directes.
  const ev: Omit<MultiEvent, 'id' | 'from' | 'fromName' | 'day'> = { to: peer, mechanic: id, phase: 'act' };
  if (id === 'recommandation') {
    w.player.reputation = clamp(w.player.reputation + 2, 0, 100);
    bumpTrust(w, peer, 5);
  }
  if (id === 'formation') {
    const known = Object.keys(w.ascension?.concepts ?? {});
    ev.concept = params.concept && known.includes(params.concept) ? params.concept : known[0];
    addXp(w, 'communication', 10);
    bumpTrust(w, peer, 5);
  }
  outgoing(w, ev);
  log(w, peer, id, fill(def.toActor, other), def.kind === 'coop' ? 'bien' : 'info');
  return { ok: true, message: fill(def.toActor, other), notifications: notes };
}

// ---------- Répondre à une proposition ----------

function applyAgreement(w: WorldState, id: MultiMechanicId, peer: string, days?: number): void {
  const d = today(w);
  if (id === 'coentreprise') {
    addEffect(w, { mechanic: id, fromPeer: peer, kind: 'partage', value: 0.15, untilDay: d + 14 });
    addEffect(w, { mechanic: id, fromPeer: peer, kind: 'demande', value: 1.06, untilDay: d + 14 });
  } else if (id === 'achats_groupes') {
    addEffect(w, { mechanic: id, fromPeer: peer, kind: 'fournisseur', value: -0.08, untilDay: d + 7 });
  } else if (id === 'entente_prix') {
    addEffect(w, { mechanic: id, fromPeer: peer, kind: 'entente', value: 1.12, untilDay: d + (days || 10) });
  }
}

export function respondToOffer(w: WorldState, offerId: string, accept: boolean): { ok: boolean; message: string } {
  const m = ensureMultiplayer(w);
  const i = m.offers.findIndex((o) => o.id === offerId);
  if (i < 0) return { ok: false, message: 'Cette proposition n’existe plus.' };
  const o = m.offers[i]!;
  m.offers.splice(i, 1);
  const def = MULTI_MECHANIC_BY_ID[o.mechanic];
  const d = today(w);
  if (accept) {
    if (o.mechanic === 'pret') {
      w.player.money = round2(w.player.money + o.amount);
      m.debts.push({ id: o.id, peer: o.fromPeer, side: 'owe', amount: round2(o.amount * (1 + o.rate)), dueDay: d + o.days });
    } else if (o.mechanic === 'garant_mutuel') {
      addEffect(w, { mechanic: o.mechanic, fromPeer: o.fromPeer, kind: 'garant', value: 1, untilDay: d + 30 });
    } else {
      applyAgreement(w, o.mechanic, o.fromPeer, o.days);
    }
    bumpTrust(w, o.fromPeer, 10);
  } else {
    bumpTrust(w, o.fromPeer, -3);
  }
  outgoing(w, { to: o.fromPeer, mechanic: o.mechanic, phase: 'reply', ref: o.id, accepted: accept, amount: o.amount, rate: o.rate, days: o.days });
  const msg = accept ? `Accepté : ${def.label.toLowerCase()} avec ${o.fromName}.` : `Refusé : ${def.label.toLowerCase()} de ${o.fromName}.`;
  log(w, o.fromPeer, o.mechanic, msg, accept ? 'bien' : 'info');
  return { ok: true, message: msg };
}

// ---------- Recevoir ----------

/** Applique un événement venu d'un autre joueur. Renvoie les notifications à afficher. */
export function receiveMultiEvent(w: WorldState, ev: MultiEvent): Notification[] {
  const m = ensureMultiplayer(w);
  if (ev.to !== m.selfId || m.seen.includes(ev.id)) return [];
  m.seen.push(ev.id);
  if (m.seen.length > 300) m.seen.splice(0, m.seen.length - 300);
  const def: MultiMechanicDef | undefined = MULTI_MECHANIC_BY_ID[ev.mechanic];
  if (!def) return [];
  const other = ev.fromName || peerName(w, ev.from);
  const d = today(w);
  const out: Notification[] = [];
  const protectedRep = w.player.reputation >= 70;

  if (ev.phase === 'offer') {
    m.offers.push({ id: ev.id, mechanic: ev.mechanic, fromPeer: ev.from, fromName: other, amount: ev.amount ?? 0, rate: ev.rate ?? 0, days: ev.days ?? 0, receivedDay: d });
    out.push(notify('journal', `📨 ${fill(def.toTarget, other)}`));
    return out;
  }

  if (ev.phase === 'reply') {
    // Réponse à ta proposition, ou retour d'un sabotage (découverte, espionnage, débauchage).
    if (def.needsAccept) {
      if (ev.accepted) {
        if (ev.mechanic === 'pret') m.debts.push({ id: ev.ref ?? ev.id, peer: ev.from, side: 'owed', amount: round2((ev.amount ?? 0) * (1 + (ev.rate ?? 0))), dueDay: d + (ev.days ?? 14) });
        else if (ev.mechanic !== 'garant_mutuel') applyAgreement(w, ev.mechanic, ev.from, ev.days);
        bumpTrust(w, ev.from, 10);
        out.push(notify('bien', `✅ ${fill(def.toActor, other)}`));
        log(w, ev.from, ev.mechanic, fill(def.toActor, other), 'bien');
      } else {
        if (ev.mechanic === 'pret') w.player.money = round2(w.player.money + (ev.amount ?? 0));
        out.push(notify('info', `${other} a refusé : ${def.label.toLowerCase()}.`));
        log(w, ev.from, ev.mechanic, `${other} a refusé : ${def.label.toLowerCase()}.`, 'info');
      }
      return out;
    }
    if (ev.report) {
      out.push(notify('journal', `🔍 Comptes de ${other} : ${ev.report}`));
      log(w, ev.from, ev.mechanic, `Comptes de ${other} : ${ev.report}`, 'info');
    }
    if (ev.mechanic === 'debauchage') {
      if (ev.accepted) { addXp(w, 'organisation', 20); out.push(notify('bien', `🧲 L’employé·e de ${other} a accepté ton offre.`)); }
      else out.push(notify('info', `🧲 L’employé·e de ${other} est resté·e : bien payé·e, fidèle.`));
    }
    if (ev.discovered) {
      w.player.reputation = clamp(w.player.reputation - 4, 0, 100);
      out.push(notify('alerte', `😬 ${other} sait que c’était toi (${def.label.toLowerCase()}). Ta réputation en prend un coup.`));
      log(w, ev.from, ev.mechanic, `${other} a découvert ton ${def.label.toLowerCase()}.`, 'mal');
    }
    return out;
  }

  if (ev.phase === 'settle') {
    const amount = round2(ev.amount ?? 0);
    w.player.money = round2(w.player.money + amount);
    if (ev.mechanic === 'pret') {
      const debt = m.debts.find((x) => x.side === 'owed' && x.peer === ev.from && x.id === ev.ref);
      if (debt) {
        debt.amount = round2(debt.amount - amount);
        if (debt.amount <= 0.01) m.debts.splice(m.debts.indexOf(debt), 1);
      }
      out.push(notify('bien', `💶 ${other} te rembourse ${amount.toFixed(2)} €.`));
    } else {
      out.push(notify('bien', `🏗️ Part des bénéfices de ${other} (coentreprise) : +${amount.toFixed(2)} €.`));
    }
    log(w, ev.from, ev.mechanic, `+${amount.toFixed(2)} € de ${other}.`, 'bien');
    return out;
  }

  // Actions directes subies (ou reçues, pour la coopération).
  const k = protectedRep ? 0.5 : 1;
  const discovered = def.kind === 'sabotage' && sharedRand(ev.id, 'decouverte') < def.discovery;
  let reply: Omit<MultiEvent, 'id' | 'from' | 'fromName' | 'day'> | null = null;
  switch (ev.mechanic) {
    case 'recommandation':
      addEffect(w, { mechanic: ev.mechanic, fromPeer: ev.from, kind: 'demande', value: 1.15, untilDay: d + 5 });
      bumpTrust(w, ev.from, 8);
      break;
    case 'formation': {
      const c = ev.concept;
      if (c && CONCEPT_BY_ID[c]) {
        if (!w.ascension) w.ascension = createAscensionState();
        if (w.ascension.concepts[c] === undefined) w.ascension.concepts[c] = d;
      }
      addXp(w, 'recherche', 20);
      bumpTrust(w, ev.from, 8);
      break;
    }
    case 'guerre_des_prix':
      addEffect(w, { mechanic: ev.mechanic, fromPeer: ev.from, kind: 'demande', value: 1 - 0.15 * k, untilDay: d + 7 });
      break;
    case 'rumeur':
      w.player.reputation = clamp(w.player.reputation - 6 * k, 0, 100);
      addEffect(w, { mechanic: ev.mechanic, fromPeer: ev.from, kind: 'demande', value: 1 - 0.08 * k, untilDay: d + 4 });
      break;
    case 'debauchage': {
      const e = w.economy;
      const staff = Object.values(e?.employees ?? {}).filter((x) => x.businessId).sort((a, b) => a.wage - b.wage || a.id.localeCompare(b.id));
      const target = staff[0];
      const leaves = !!target && target.wage < 12;
      if (leaves && e && target) {
        const b = target.businessId ? e.businesses[target.businessId] : undefined;
        if (b) b.employeeIds = b.employeeIds.filter((id) => id !== target.id);
        delete e.employees[target.id];
        out.push(notify('alerte', `🧲 ${target.name} démissionne : une meilleure offre ailleurs.`));
      }
      reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', accepted: leaves, discovered };
      break;
    }
    case 'signalement':
      if (!protectedRep) addEffect(w, { mechanic: ev.mechanic, fromPeer: ev.from, kind: 'fermeture', value: 0.2, untilDay: d + 1 });
      break;
    case 'rachat_fournisseur':
      addEffect(w, { mechanic: ev.mechanic, fromPeer: ev.from, kind: 'fournisseur', value: 0.12 * k, untilDay: d + 5 });
      break;
    case 'espionnage': {
      const revenue = Object.values(w.economy?.businesses ?? {}).reduce((s, b) => s + (b.history.at(-1)?.revenue ?? 0), 0);
      reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', discovered, report: `${Math.round(w.player.money)} € en caisse, ${Math.round(revenue)} € de ventes hier, palier ${w.ascension?.tier ?? 1}, ${Object.keys(w.economy?.businesses ?? {}).length} commerce(s).` };
      break;
    }
    default:
      break;
  }
  if (def.kind === 'sabotage') {
    if (discovered) {
      bumpTrust(w, ev.from, -25);
      out.push(notify('alerte', `🕵️ ${fill(def.discovered || def.toTarget, other)}`));
      log(w, ev.from, ev.mechanic, fill(def.discovered || def.toTarget, other), 'mal');
    } else {
      out.push(notify('alerte', fill(def.toTarget, other)));
      log(w, ev.from, ev.mechanic, fill(def.toTarget, other), 'mal');
    }
    out.push(notify('fantome', def.ghostAgainst.text, def.ghostAgainst.ghost));
    if (!reply && discovered) reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', discovered: true };
  } else {
    out.push(notify('bien', fill(def.toTarget, other)));
    out.push(notify('fantome', def.ghostFor.text, def.ghostFor.ghost));
    log(w, ev.from, ev.mechanic, fill(def.toTarget, other), 'bien');
  }
  if (reply) outgoing(w, reply);
  return out;
}

// ---------- Chaque jour ----------

/**
 * Clôture du jour : effets expirés, propositions périmées, remboursements, partage des
 * bénéfices d'une coentreprise, contrôle des ententes, alliances au long cours.
 * `provenProfitNow` : bénéfices cumulés prouvés (src/simulation/ascension.ts).
 */
export function multiplayerDay(w: WorldState, provenProfitNow: number): Notification[] {
  const m = w.multiplayer;
  if (!m) return [];
  const d = today(w);
  const out: Notification[] = [];
  // Propositions sans réponse depuis deux jours : refusées.
  for (const o of [...m.offers]) if (d - o.receivedDay >= 2) respondToOffer(w, o.id, false);
  // Partage des bénéfices (coentreprise) : une part des bénéfices nouveaux part chez l'associé·e.
  const base = w.flags['mpProfitBase'] ?? provenProfitNow;
  const gain = provenProfitNow - base;
  w.flags['mpProfitBase'] = Math.max(base, provenProfitNow);
  for (const e of m.effects) {
    if (e.kind !== 'partage' || e.untilDay <= d || gain <= 0) continue;
    const part = round2(Math.min(w.player.money, gain * e.value));
    if (part <= 0) continue;
    w.player.money = round2(w.player.money - part);
    outgoing(w, { to: e.fromPeer, mechanic: 'coentreprise', phase: 'settle', amount: part });
  }
  // Entente : chaque jour, l'Autorité de la concurrence peut tomber dessus (même tirage chez les deux).
  for (const e of m.effects) {
    if (e.kind !== 'entente' || e.untilDay <= d) continue;
    const pair = [m.selfId, e.fromPeer].sort().join('|');
    if (sharedRand(pair, 'controle', d) < 0.08) {
      const fine = round2(Math.max(300, w.player.money * 0.1));
      w.player.money = round2(Math.max(0, w.player.money - fine));
      w.player.reputation = clamp(w.player.reputation - 10, 0, 100);
      e.untilDay = d;
      out.push(notify('alerte', `⚖️ L’Autorité de la concurrence a découvert l’entente avec ${peerName(w, e.fromPeer)} : ${fine.toFixed(0)} € d’amende et la réputation en berne.`));
      out.push(notify('fantome', MULTI_MECHANIC_BY_ID.entente_prix.ghostAgainst.text, MULTI_MECHANIC_BY_ID.entente_prix.ghostAgainst.ghost));
      log(w, e.fromPeer, 'entente_prix', `Amende de ${fine.toFixed(0)} € pour entente.`, 'mal');
    }
  }
  // Dettes arrivées à échéance : on rembourse ce qu'on peut ; le reste attend une semaine.
  for (const debt of [...m.debts]) {
    if (debt.side !== 'owe' || debt.dueDay > d) continue;
    const pay = round2(Math.min(w.player.money, debt.amount));
    if (pay > 0) {
      w.player.money = round2(w.player.money - pay);
      outgoing(w, { to: debt.peer, mechanic: 'pret', phase: 'settle', amount: pay, ref: debt.id });
    }
    debt.amount = round2(debt.amount - pay);
    if (debt.amount <= 0.01) {
      m.debts.splice(m.debts.indexOf(debt), 1);
      bumpTrust(w, debt.peer, 5);
      out.push(notify('bien', `💶 Prêt de ${peerName(w, debt.peer)} remboursé.`));
    } else {
      debt.dueDay = d + 7;
      bumpTrust(w, debt.peer, -10);
      out.push(notify('alerte', `💸 Tu n’as pas pu tout rembourser à ${peerName(w, debt.peer)} : il reste ${debt.amount.toFixed(2)} €, dans 7 jours.`));
    }
  }
  // Alliances au long cours.
  for (const peer of Object.values(m.peers)) {
    const allied = m.effects.some((e) => e.fromPeer === peer.id && e.untilDay > d && (e.kind === 'partage' || e.kind === 'fournisseur' && e.value < 0 || e.kind === 'garant'));
    peer.allianceDays = allied ? peer.allianceDays + 1 : 0;
    if (peer.allianceDays === 14) out.push(notify('fantome', `Deux semaines d’alliance avec ${peer.name}. La confiance qui dure est le plus rare des capitaux.`, 'ostrom'));
  }
  m.effects = m.effects.filter((e) => e.untilDay > d);
  return out;
}
