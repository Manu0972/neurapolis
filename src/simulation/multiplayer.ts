/**
 * Multijoueur en LAN : règles des interactions entre joueurs (mondes parallèles reliés).
 *
 * Chaque joueur garde sa simulation. Ce module ne connaît pas le réseau : il reçoit des
 * événements (`receiveMultiEvent`), en produit dans `w.multiplayer.outbox` (vidée par la
 * présentation), et expose des effets que l'économie consulte (demande, fournisseurs, locaux
 * tenus par l'autre joueur, concurrence). Tout est déterministe : les tirages (découverte d'un
 * sabotage, contrôle d'une entente) viennent d'un hachage partagé par les deux mondes.
 *
 * Méfiance par défaut : un événement reçu n'est appliqué que s'il est cohérent avec ce que ton
 * monde sait déjà (proposition réellement envoyée, dette réellement due, accord en cours, mode de
 * la partie, délais entre deux coups). Un autre joueur ne peut ni inventer de l'argent, ni t'en
 * prendre, ni t'imposer un accord que tu n'as pas accepté.
 */
import type { Notification, WorldState } from '../core/types';
import type { ProductCategory } from '../core/economy_types';
import {
  createMultiplayerState, type MultiEffect, type MultiEvent, type MultiMechanicId, type MultiMode, type MultiplayerState, type MultiSent, type PeerState, type RemoteShop,
} from '../core/multiplayer_types';
import { createAscensionState } from '../core/ascension_types';
import { dayIndexOf } from '../core/clock';
import { CITY } from '../data/map';
import { BUSINESS_TYPE_BY_ID, BUSINESS_TYPES } from '../data/economy';
import { CONCEPT_BY_ID } from '../data/ascension/concepts';
import { MULTI_MECHANIC_BY_ID, mechanicAllowed, type MultiMechanicDef } from '../data/multi_mechanics';
import { notify } from './events';
import { addXp } from './skills';

const round2 = (v: number): number => Math.round(v * 100) / 100;
/** Montant à la française : « 100 € », « 12,50 € » (jamais « 100.00 € »). */
export function euros(v: number): string {
  const r = round2(v);
  return `${Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',')} €`;
}
/** « de Bilal », « d’Alex » : élision devant une voyelle. */
export function deNom(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(name) ? `d’${name}` : `de ${name}`;
}
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

/** Bornes du multijoueur : ce qu'un autre joueur peut te demander ou t'envoyer, au plus. */
export const MULTI_LIMITS = {
  /** Prêt : de 10 € à… */
  loanMax: 50000,
  loanRateMax: 0.2,
  loanDays: 14,
  /** Propositions en attente venant d'un même joueur. */
  offersPerPeer: 3,
  /** Une proposition envoyée sans réponse est annulée (l'argent revient) après ce délai. */
  offerExpiryDays: 5,
  /** Un sabotage envoyé attend un éventuel retour pendant ce délai. */
  actExpiryDays: 3,
  /** Une acceptation attend la confirmation du proposant (elle peut arriver après une coupure). */
  acceptedExpiryDays: 60,
  /** Part de bénéfices (coentreprise) reçue en une fois, au plus. */
  shareMax: 5000,
  /** Événements gardés pour l'envoi (au-delà, les plus anciens tombent). */
  outboxMax: 300,
  sentMax: 100,
} as const;

export function ensureMultiplayer(w: WorldState, selfId?: string): MultiplayerState {
  if (!w.multiplayer) w.multiplayer = createMultiplayerState(selfId ?? '');
  if (selfId && !w.multiplayer.selfId) w.multiplayer.selfId = selfId;
  if (!Array.isArray(w.multiplayer.sent)) w.multiplayer.sent = [];
  return w.multiplayer;
}

/**
 * Change ton identifiant de joueur (même sauvegarde chargée deux fois : deux joueurs avaient le
 * même). Les événements pas encore envoyés partent sous le nouveau nom.
 */
export function renameSelf(w: WorldState, newId: string): void {
  const m = ensureMultiplayer(w);
  const old = m.selfId;
  m.selfId = newId;
  for (const e of m.outbox) if (e.from === old) e.from = newId;
}

/** Accusé de réception : le destinataire a bien reçu ces événements, on cesse de les renvoyer. */
export function acknowledgeEvents(w: WorldState, peer: string, ids: readonly string[]): number {
  const m = w.multiplayer;
  if (!m || !ids.length) return 0;
  const set = new Set(ids);
  const before = m.outbox.length;
  m.outbox = m.outbox.filter((e) => !(e.to === peer && set.has(e.id)));
  return before - m.outbox.length;
}

/** Fabrique un événement à envoyer (identifiant unique : joueur + compteur). */
function outgoing(w: WorldState, ev: Omit<MultiEvent, 'id' | 'from' | 'fromName' | 'day'>): MultiEvent {
  const m = ensureMultiplayer(w);
  const e: MultiEvent = { ...ev, id: `${m.selfId}:${m.nextId++}`, from: m.selfId, fromName: w.player.firstName || w.player.name, day: today(w) };
  m.outbox.push(e);
  if (m.outbox.length > MULTI_LIMITS.outboxMax) m.outbox.splice(0, m.outbox.length - MULTI_LIMITS.outboxMax);
  return e;
}

function remember(w: WorldState, s: MultiSent): void {
  const m = ensureMultiplayer(w);
  m.sent.push(s);
  if (m.sent.length > MULTI_LIMITS.sentMax) m.sent.splice(0, m.sent.length - MULTI_LIMITS.sentMax);
}

/** Retire et renvoie l'envoi qui correspond exactement à cette suite (ou rien). */
function takeSent(w: WorldState, ref: string | undefined, peer: string, mechanic: MultiMechanicId, phase: MultiSent['phase']): MultiSent | undefined {
  const m = ensureMultiplayer(w);
  if (!ref) return undefined;
  const i = m.sent.findIndex((s) => s.id === ref && s.peer === peer && s.mechanic === mechanic && s.phase === phase);
  if (i < 0) return undefined;
  return m.sent.splice(i, 1)[0];
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

const KNOWN_CATEGORIES = new Set<string>(BUSINESS_TYPES.flatMap((t) => [...t.productCategories]));
const num = (v: unknown, lo: number, hi: number, dflt: number): number => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : dflt);

/** Profil reçu du réseau, ramené à des valeurs possibles (locaux connus, catégories connues, bornes). */
export function boundedProfile(p: PeerProfile): PeerProfile {
  const shops: RemoteShop[] = [];
  for (const s of Array.isArray(p.shops) ? p.shops : []) {
    if (shops.length >= 12 || !s || typeof s.unitId !== 'string' || !UNIT_DOOR[s.unitId]) continue;
    if (shops.some((x) => x.unitId === s.unitId)) continue;
    const categories = (Array.isArray(s.categories) ? s.categories : []).filter((c) => KNOWN_CATEGORIES.has(c)).slice(0, 8) as ProductCategory[];
    shops.push({ unitId: s.unitId, name: String(s.name ?? '').slice(0, 40), categories, strength: round2(num(s.strength, 0.7, 1.3, 1)) });
  }
  return {
    id: String(p.id).slice(0, 64),
    name: String(p.name ?? '').slice(0, 24) || 'Joueur',
    age: Math.round(num(p.age, 10, 99, 12)),
    reputation: Math.round(num(p.reputation, 0, 100, 50)),
    tier: Math.round(num(p.tier, 1, 6, 1)),
    shops,
  };
}

/** Met à jour (ou crée) un autre joueur à partir de son profil. */
export function upsertPeer(w: WorldState, raw: PeerProfile): PeerState {
  const m = ensureMultiplayer(w);
  const p = boundedProfile(raw);
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
  if (last !== undefined && d - last < def.cooldownDays) {
    const left = def.cooldownDays - (d - last);
    return `Encore ${left} jour${left > 1 ? 's' : ''} avant de recommencer.`;
  }
  // L'autre n'accepte qu'une proposition de chaque sorte à la fois : une deuxième serait ignorée à
  // l'arrivée, et la somme resterait bloquée jusqu'à l'expiration de la première.
  if (def.needsAccept && m.sent.some((s) => s.peer === peer && s.mechanic === id && s.phase === 'offer')) {
    return `Ta proposition attend encore la réponse ${deNom(peerName(w, peer))}.`;
  }
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
      amount = round2(Math.min(params.amount ?? 0, MULTI_LIMITS.loanMax));
      rate = clamp(params.rate ?? 0, 0, MULTI_LIMITS.loanRateMax);
      // Séquestre : l'argent part tout de suite, il revient si l'autre refuse (ou ne répond pas).
      w.player.money = round2(w.player.money - amount);
    }
    const days = id === 'pret' ? MULTI_LIMITS.loanDays : id === 'entente_prix' ? 10 : 0;
    const e = outgoing(w, { to: peer, mechanic: id, phase: 'offer', amount, rate, days: days || undefined });
    remember(w, { id: e.id, peer, mechanic: id, phase: 'offer', amount, rate, days, day: d });
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
  const sentEv = outgoing(w, ev);
  // Un sabotage peut revenir (découverte, rapport d'espionnage, réponse de l'employé·e).
  if (def.kind === 'sabotage') remember(w, { id: sentEv.id, peer, mechanic: id, phase: 'act', amount: 0, rate: 0, days: 0, day: d });
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
    addEffect(w, { mechanic: id, fromPeer: peer, kind: 'entente', value: 1.12, untilDay: d + clamp(days || 10, 1, 10) });
  }
}

/**
 * Réponse à une proposition reçue. Une acceptation ne prend effet qu'à la confirmation du
 * proposant (l'argent d'un prêt arrive à ce moment-là) : si sa proposition a expiré entre-temps,
 * rien ne bouge, et personne ne perd ni ne gagne d'argent.
 */
export function respondToOffer(w: WorldState, offerId: string, accept: boolean): { ok: boolean; message: string } {
  const m = ensureMultiplayer(w);
  const i = m.offers.findIndex((o) => o.id === offerId);
  if (i < 0) return { ok: false, message: 'Cette proposition n’existe plus.' };
  const o = m.offers[i]!;
  m.offers.splice(i, 1);
  const def = MULTI_MECHANIC_BY_ID[o.mechanic];
  const d = today(w);
  if (accept) {
    remember(w, { id: o.id, peer: o.fromPeer, mechanic: o.mechanic, phase: 'accepted', amount: o.amount, rate: o.rate, days: o.days, day: d });
    bumpTrust(w, o.fromPeer, 10);
  } else {
    bumpTrust(w, o.fromPeer, -3);
  }
  outgoing(w, { to: o.fromPeer, mechanic: o.mechanic, phase: 'reply', ref: o.id, accepted: accept });
  const msg = accept ? `Accepté : ${def.label.toLowerCase()} avec ${o.fromName} (en attente de sa confirmation).` : `Refusé : ${def.label.toLowerCase()} ${deNom(o.fromName)}.`;
  log(w, o.fromPeer, o.mechanic, msg, accept ? 'bien' : 'info');
  return { ok: true, message: msg };
}

// ---------- Recevoir ----------

/** Délai entre deux coups reçus d'un même joueur (ton calendrier ; un jour de tolérance pour le décalage d'horloge). */
function receivedTooSoon(w: WorldState, from: string, def: MultiMechanicDef): boolean {
  const m = ensureMultiplayer(w);
  const d = today(w);
  const key = `recu:${def.id}:${from}`;
  const last = m.cooldowns[key];
  if (last !== undefined && d - last < Math.max(1, def.cooldownDays) - 1) return true;
  if (def.kind === 'sabotage') {
    // Un seul sabotage par jour et par joueur (deux tolérés le même jour : horloges décalées).
    const dayKey = `recu:sabotage:${from}`;
    const countKey = `recu:sabotage_n:${from}`;
    const n = m.cooldowns[dayKey] === d ? (m.cooldowns[countKey] ?? 0) : 0;
    if (n >= 2) return true;
    m.cooldowns[dayKey] = d;
    m.cooldowns[countKey] = n + 1;
  }
  m.cooldowns[key] = d;
  return false;
}

/**
 * Applique un événement venu d'un autre joueur. Renvoie les notifications à afficher.
 * `mode` : règles de la partie (un coup interdit par le mode est ignoré, même s'il arrive).
 */
export function receiveMultiEvent(w: WorldState, ev: MultiEvent, mode?: MultiMode): Notification[] {
  const m = ensureMultiplayer(w);
  if (!ev || typeof ev.id !== 'string' || ev.to !== m.selfId || ev.from === m.selfId || m.seen.includes(ev.id)) return [];
  const def: MultiMechanicDef | undefined = MULTI_MECHANIC_BY_ID[ev.mechanic];
  // On ne traite que les joueurs qui se sont présentés (profil connu).
  if (!def || !m.peers[ev.from]) return [];
  m.seen.push(ev.id);
  if (m.seen.length > 300) m.seen.splice(0, m.seen.length - 300);
  const other = peerName(w, ev.from);
  const d = today(w);
  const out: Notification[] = [];
  const protectedRep = w.player.reputation >= 70;
  const money = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? round2(v) : 0);
  const modeOk = !mode || mechanicAllowed(mode, def.kind);

  if (ev.phase === 'offer') {
    if (!def.needsAccept || !modeOk) return [];
    const fromPeer = m.offers.filter((o) => o.fromPeer === ev.from);
    if (fromPeer.length >= MULTI_LIMITS.offersPerPeer || fromPeer.some((o) => o.mechanic === ev.mechanic)) return [];
    let amount = 0;
    let rate = 0;
    let days = 0;
    if (ev.mechanic === 'pret') {
      amount = money(ev.amount);
      if (!(amount >= 10 && amount <= MULTI_LIMITS.loanMax)) return [];
      rate = clamp(money(ev.rate), 0, MULTI_LIMITS.loanRateMax);
      days = MULTI_LIMITS.loanDays;
    } else if (ev.mechanic === 'entente_prix') {
      days = 10;
    }
    m.offers.push({ id: ev.id, mechanic: ev.mechanic, fromPeer: ev.from, fromName: other, amount, rate, days, receivedDay: d });
    out.push(notify('journal', `📨 ${fill(def.toTarget, other)}`));
    return out;
  }

  if (ev.phase === 'reply' && def.needsAccept) {
    // Réponse à TA proposition : elle doit exister (sinon, on prévient l'autre qu'elle a expiré).
    const s = takeSent(w, ev.ref, ev.from, ev.mechanic, 'offer');
    if (!s) {
      if (ev.accepted && ev.ref) outgoing(w, { to: ev.from, mechanic: ev.mechanic, phase: 'confirm', ref: ev.ref, accepted: false });
      return [];
    }
    if (ev.accepted) {
      if (s.mechanic === 'pret') m.debts.push({ id: s.id, peer: ev.from, side: 'owed', amount: round2(s.amount * (1 + s.rate)), dueDay: d + s.days });
      else if (s.mechanic !== 'garant_mutuel') applyAgreement(w, s.mechanic, ev.from, s.days);
      outgoing(w, { to: ev.from, mechanic: s.mechanic, phase: 'confirm', ref: s.id, accepted: true });
      bumpTrust(w, ev.from, 10);
      out.push(notify('bien', `✅ ${fill(def.toActor, other)}`));
      log(w, ev.from, ev.mechanic, fill(def.toActor, other), 'bien');
    } else {
      if (s.mechanic === 'pret') w.player.money = round2(w.player.money + s.amount);
      out.push(notify('info', `${other} a refusé : ${def.label.toLowerCase()}.`));
      log(w, ev.from, ev.mechanic, `${other} a refusé : ${def.label.toLowerCase()}.`, 'info');
    }
    return out;
  }

  if (ev.phase === 'confirm') {
    // Le proposant confirme l'accord que tu as accepté : il prend effet maintenant.
    const s = takeSent(w, ev.ref, ev.from, ev.mechanic, 'accepted');
    if (!s) return [];
    if (!ev.accepted) {
      out.push(notify('info', `La proposition ${deNom(other)} avait expiré : rien n’a été signé.`));
      log(w, ev.from, ev.mechanic, `Proposition ${deNom(other)} expirée : ${def.label.toLowerCase()} annulé.`, 'info');
      return out;
    }
    if (s.mechanic === 'pret') {
      w.player.money = round2(w.player.money + s.amount);
      m.debts.push({ id: s.id, peer: ev.from, side: 'owe', amount: round2(s.amount * (1 + s.rate)), dueDay: d + s.days });
      out.push(notify('bien', `💶 Prêt ${deNom(other)} reçu : +${euros(s.amount)}, à rendre ${euros(s.amount * (1 + s.rate))} dans ${s.days} jours.`));
    } else if (s.mechanic === 'garant_mutuel') {
      addEffect(w, { mechanic: s.mechanic, fromPeer: ev.from, kind: 'garant', value: 1, untilDay: d + 30 });
      out.push(notify('bien', `✍️ ${other} se porte garant·e pour toi pendant 30 jours.`));
    } else {
      applyAgreement(w, s.mechanic, ev.from, s.days);
      out.push(notify('bien', `✅ ${def.label} avec ${other} : c’est signé.`));
    }
    log(w, ev.from, ev.mechanic, `${def.label} avec ${other} : signé.`, 'bien');
    return out;
  }

  if (ev.phase === 'reply') {
    // Retour d'un sabotage que TU as lancé (découverte, espionnage, débauchage).
    const s = takeSent(w, ev.ref, ev.from, ev.mechanic, 'act');
    if (!s) return [];
    if (ev.mechanic === 'espionnage' && typeof ev.report === 'string' && ev.report) {
      const report = ev.report.slice(0, 240);
      out.push(notify('journal', `🔍 Comptes ${deNom(other)} : ${report}`));
      log(w, ev.from, ev.mechanic, `Comptes ${deNom(other)} : ${report}`, 'info');
    }
    if (ev.mechanic === 'debauchage') {
      if (ev.accepted) { addXp(w, 'organisation', 20); out.push(notify('bien', `🧲 L’employé·e ${deNom(other)} a accepté ton offre.`)); }
      else out.push(notify('info', `🧲 L’employé·e ${deNom(other)} est resté·e : bien payé·e, fidèle.`));
    }
    if (ev.discovered) {
      w.player.reputation = clamp(w.player.reputation - 4, 0, 100);
      out.push(notify('alerte', `😬 ${other} sait que c’était toi (${def.label.toLowerCase()}). Ta réputation en prend un coup.`));
      log(w, ev.from, ev.mechanic, `${other} a découvert ton ${def.label.toLowerCase()}.`, 'mal');
    }
    return out;
  }

  if (ev.phase === 'settle') {
    const raw = money(ev.amount);
    if (!(raw > 0)) return [];
    if (ev.mechanic === 'pret') {
      // Remboursement : seulement d'une dette réellement due, et jamais plus que le reste dû.
      const debt = m.debts.find((x) => x.side === 'owed' && x.peer === ev.from && x.id === ev.ref);
      if (!debt) return [];
      const amount = round2(Math.min(raw, debt.amount));
      w.player.money = round2(w.player.money + amount);
      debt.amount = round2(debt.amount - amount);
      if (debt.amount <= 0.01) m.debts.splice(m.debts.indexOf(debt), 1);
      out.push(notify('bien', `💶 ${other} te rembourse ${euros(amount)}.`));
      log(w, ev.from, ev.mechanic, `+${euros(amount)} ${deNom(other)}.`, 'bien');
      return out;
    }
    if (ev.mechanic === 'coentreprise') {
      // Part des bénéfices : seulement pendant une coentreprise en cours, une fois par jour de l'autre.
      const share = m.effects.find((e) => e.kind === 'partage' && e.fromPeer === ev.from && e.untilDay > d);
      const dayKey = `recu:partage:${ev.from}`;
      const evDay = typeof ev.day === 'number' && Number.isFinite(ev.day) ? Math.floor(ev.day) : -1;
      const lastDay = m.cooldowns[dayKey];
      if (!share || (lastDay !== undefined && evDay <= lastDay)) return [];
      m.cooldowns[dayKey] = evDay;
      const amount = round2(Math.min(raw, MULTI_LIMITS.shareMax));
      w.player.money = round2(w.player.money + amount);
      out.push(notify('bien', `🏗️ Part des bénéfices ${deNom(other)} (coentreprise) : +${euros(amount)}.`));
      log(w, ev.from, ev.mechanic, `+${euros(amount)} ${deNom(other)}.`, 'bien');
      return out;
    }
    return [];
  }

  if (ev.phase !== 'act' || def.needsAccept || ev.mechanic === 'bail_coupe' || !modeOk) return [];
  if (receivedTooSoon(w, ev.from, def)) return [];

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
      reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', ref: ev.id, accepted: leaves, discovered };
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
      reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', ref: ev.id, discovered, report: `${Math.round(w.player.money)} € en caisse, ${Math.round(revenue)} € de ventes hier, palier ${w.ascension?.tier ?? 1}, ${Object.keys(w.economy?.businesses ?? {}).length} commerce(s).` };
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
    if (!reply && discovered) reply = { to: ev.from, mechanic: ev.mechanic, phase: 'reply', ref: ev.id, discovered: true };
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
  // Tes envois restés sans suite : une proposition expire (l'argent d'un prêt revient), un
  // sabotage n'attend plus de retour, une acceptation finit par être oubliée.
  if (!Array.isArray(m.sent)) m.sent = [];
  for (const s of [...m.sent]) {
    const age = d - s.day;
    const limit = s.phase === 'offer' ? MULTI_LIMITS.offerExpiryDays : s.phase === 'act' ? MULTI_LIMITS.actExpiryDays : MULTI_LIMITS.acceptedExpiryDays;
    if (age < limit) continue;
    m.sent.splice(m.sent.indexOf(s), 1);
    if (s.phase === 'offer') {
      const label = MULTI_MECHANIC_BY_ID[s.mechanic]?.label.toLowerCase() ?? s.mechanic;
      if (s.mechanic === 'pret' && s.amount > 0) w.player.money = round2(w.player.money + s.amount);
      out.push(notify('info', `📨 Pas de réponse ${deNom(peerName(w, s.peer))} : proposition annulée (${label})${s.mechanic === 'pret' ? ', l’argent te revient' : ''}.`));
      log(w, s.peer, s.mechanic, `Sans réponse : ${label} annulé.`, 'info');
    }
  }
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
      out.push(notify('bien', `💶 Prêt ${deNom(peerName(w, debt.peer))} remboursé.`));
    } else {
      debt.dueDay = d + 7;
      bumpTrust(w, debt.peer, -10);
      out.push(notify('alerte', `💸 Tu n’as pas pu tout rembourser à ${peerName(w, debt.peer)} : il reste ${euros(debt.amount)}, dans 7 jours.`));
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
