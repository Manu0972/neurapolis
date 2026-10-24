/**
 * Protocole du multijoueur entre navigateurs (via le relais `tools/net-relay.mjs`).
 *
 * Le relais enveloppe chaque message de jeu : { t: 'relay', conn, msg }. Il envoie aussi
 * welcome / join / leave / host / error. Les messages de jeu ci-dessous sont des données simples :
 * aucune logique ici, seulement des formes (la simulation reste dans src/simulation).
 *
 * Tout ce qui arrive du réseau passe par `parseGameMsg` : un message mal formé, trop long ou
 * hostile est rejeté ou ramené à des valeurs sûres (textes sans caractères de contrôle et bornés,
 * nombres finis et bornés, apparence prise dans les valeurs permises) avant d'atteindre le jeu.
 */
import type { MultiEvent, MultiMechanicId, MultiMode } from '../core/multiplayer_types';
import {
  DEFAULT_PLAYER_APPEARANCE, VALID_ACCESSORIES, VALID_BEARDS, VALID_BODIES, VALID_EYE_COLORS, VALID_EYES, VALID_GENDERS, VALID_GLASSES,
  VALID_GEAR, VALID_HAIR_COLORS, VALID_HAIR_STYLES, VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES,
  type PlayerAppearance, type PlayerGear, type PlayerGearColorKey, type PlayerGender, type PlayerOutfitColor,
} from '../core/types';
import type { PeerProfile } from '../simulation/multiplayer';
import { MULTI_MECHANIC_BY_ID } from '../data/multi_mechanics';

/** Version du protocole : deux versions différentes refusent de jouer ensemble. */
export const NET_PROTOCOL = 2;

/** Allures de temps qu'un joueur peut demander (les mêmes que les boutons du jeu). */
export const PACE_IDS = ['pause', 'reel', 'lent', 'normal', 'rapide', 'tres_rapide'] as const;

export type SkipKind = 'jour' | 'semaine' | 'mois' | 'vacances';

export type RelayMsg =
  | { t: 'welcome'; you: number; host: number; peers: number[]; addresses?: string[]; port?: number; max?: number }
  | { t: 'join'; conn: number }
  | { t: 'leave'; conn: number }
  | { t: 'host'; conn: number }
  /** Refus du relais (salon plein, trop de messages…) : la connexion va être fermée. */
  | { t: 'error'; code: string; text?: string }
  /** Message d'un autre joueur, brut : à passer par `parseGameMsg`. */
  | { t: 'relay'; conn: number; msg: unknown };

export type GameMsg =
  /** Présentation : profil, apparence ; l'hôte y joint le mode de la partie. */
  | { t: 'hello'; v: number; player: PeerProfile; appearance: PlayerAppearance; gender?: PlayerGender; heightM: number; mode?: MultiMode; reply?: boolean; model?: string }
  /** Profil à jour (commerces, réputation, palier), quelques fois par minute. */
  | { t: 'profile'; player: PeerProfile }
  /** Position dans la ville (≈ 10 fois par seconde). */
  | { t: 'pose'; x: number; z: number; h: number; s: number; inside: boolean; busy?: boolean }
  /** Horloge partagée, envoyée par l'hôte. */
  | { t: 'clock'; tick: number; pace: string; mode: MultiMode }
  /** Demande d'allure envoyée à l'hôte par un autre joueur. */
  | { t: 'pace'; pace: string }
  /** L'hôte passe le temps : les autres font le même saut. */
  | { t: 'skip'; kind: SkipKind; target: number }
  /** Interaction de jeu (prêt, sabotage…), adressée à un joueur (`to` : sa connexion). */
  | { t: 'event'; ev: MultiEvent; to?: number }
  /** Accusé de réception d'événements (l'émetteur cesse de les renvoyer). */
  | { t: 'ack'; ids: string[]; to?: number }
  /** Message libre entre joueurs. */
  | { t: 'chat'; text: string };

// ---------- Adresses ----------

/** Adresse du relais par défaut : le serveur qui a servi la page. */
export function defaultRelayUrl(room = 'neurapolis'): string {
  if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return '';
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/net?room=${encodeURIComponent(room)}`;
}

/** Accepte « 192.168.1.20:8765 », « http://… », « ws://… » et en fait une adresse de relais. */
export function normalizeRelayUrl(input: string, room = 'neurapolis'): string {
  const raw = input.trim();
  if (!raw) return defaultRelayUrl(room);
  let u = raw;
  if (!/^[a-z]+:\/\//i.test(u)) u = `ws://${u}`;
  u = u.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const url = new URL(u);
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error('adresse invalide');
  // Adresse tapée sans port (ex. « 192.168.1.20 ») : port du serveur LAN de NEURAPOLIS.
  if (!url.port && !/:\d+/.test(raw.replace(/^[a-z]+:\/\//i, ''))) url.port = '8765';
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/net';
  if (!url.searchParams.get('room')) url.searchParams.set('room', room);
  return url.toString();
}

/** Adresse lisible d'un serveur (ce que l'hôte donne à ses amis). */
export function displayAddress(host: string, port?: number): string {
  return `http://${host}${port ? `:${port}` : ''}`;
}

// ---------- Validation de ce qui arrive du réseau ----------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Texte venu d'un autre joueur : caractères de contrôle et d'inversion de sens retirés, espaces
 * resserrés, longueur bornée. Il est ensuite toujours affiché comme du texte (jamais du HTML).
 */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.slice(0, max);
}

const ID_RE = /^[A-Za-z0-9_:.-]{1,64}$/;
const cleanId = (v: unknown): string | null => (typeof v === 'string' && ID_RE.test(v) ? v : null);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const bounded = (v: unknown, lo: number, hi: number): number | null => (finite(v) && v >= lo && v <= hi ? v : null);
const MODES: readonly MultiMode[] = ['cooperation', 'libre', 'rivalite'];
const SKIPS: readonly SkipKind[] = ['jour', 'semaine', 'mois', 'vacances'];
const PHASES: readonly MultiEvent['phase'][] = ['offer', 'act', 'reply', 'confirm', 'settle'];
const oneOf = <T extends string>(list: readonly T[], v: unknown): T | undefined => (list as readonly unknown[]).includes(v) ? v as T : undefined;

/** Apparence reçue : chaque trait doit être une valeur permise, sinon celle par défaut. */
export function cleanAppearance(v: unknown): PlayerAppearance {
  const a = isObj(v) ? v : {};
  const d = DEFAULT_PLAYER_APPEARANCE;
  return {
    skinTone: oneOf(VALID_SKIN_TONES, a.skinTone) ?? d.skinTone,
    hairColor: oneOf(VALID_HAIR_COLORS, a.hairColor) ?? d.hairColor,
    hairStyle: oneOf(VALID_HAIR_STYLES, a.hairStyle) ?? d.hairStyle,
    outfitStyle: oneOf(VALID_OUTFIT_STYLES, a.outfitStyle) ?? d.outfitStyle,
    outfitColor: oneOf(VALID_OUTFIT_COLORS, a.outfitColor) ?? d.outfitColor,
    body: oneOf(VALID_BODIES, a.body) ?? d.body,
    heightAdj: bounded(a.heightAdj, -2, 2) ?? d.heightAdj,
    eyes: oneOf(VALID_EYES, a.eyes) ?? d.eyes,
    eyeColor: oneOf(VALID_EYE_COLORS, a.eyeColor) ?? d.eyeColor,
    glasses: oneOf(VALID_GLASSES, a.glasses) ?? d.glasses,
    freckles: typeof a.freckles === 'boolean' ? a.freckles : d.freckles,
    beard: oneOf(VALID_BEARDS, a.beard) ?? d.beard,
    accessory: oneOf(VALID_ACCESSORIES, a.accessory) ?? d.accessory,
    // Personnalisation v26 : silhouette, bas, chaussures, accessoires portés et leurs couleurs.
    // Sans eux, l'autre joueur apparaissait avec la tenue par défaut au lieu de la sienne.
    ...cleanCustomization(a),
  };
}

/** Champs de personnalisation (save v26), recopiés seulement s'ils sont valides. */
function cleanCustomization(a: Record<string, unknown>): Partial<PlayerAppearance> {
  const out: Partial<PlayerAppearance> = {};
  if (typeof a.model === 'string' && /^[\p{L}\p{N}_.-]{1,64}$/u.test(a.model)) out.model = a.model;
  const bottom = oneOf(VALID_OUTFIT_COLORS, a.bottomColor);
  if (bottom) out.bottomColor = bottom;
  const shoes = oneOf(VALID_OUTFIT_COLORS, a.shoesColor);
  if (shoes) out.shoesColor = shoes;
  if (Array.isArray(a.gear)) {
    const gear = [...new Set(a.gear.filter((g): g is PlayerGear => VALID_GEAR.includes(g as PlayerGear)))].slice(0, VALID_GEAR.length);
    if (gear.length) out.gear = gear;
  }
  if (isObj(a.gearColors)) {
    const gc: Partial<Record<PlayerGearColorKey, PlayerOutfitColor>> = {};
    for (const [k, v] of Object.entries(a.gearColors)) {
      const color = oneOf(VALID_OUTFIT_COLORS, v);
      if (color && (k === 'lunettes' || VALID_GEAR.includes(k as PlayerGear))) gc[k as PlayerGearColorKey] = color;
    }
    if (Object.keys(gc).length) out.gearColors = gc;
  }
  return out;
}

/** Profil public reçu (la simulation le borne encore : locaux et catégories connus). */
export function cleanProfile(v: unknown): PeerProfile | null {
  if (!isObj(v)) return null;
  const id = cleanId(v.id);
  const name = cleanText(v.name, 24);
  if (!id || !name) return null;
  const shops = Array.isArray(v.shops) ? v.shops.slice(0, 12).filter(isObj).map((s) => ({
    unitId: cleanId(s.unitId) ?? '',
    name: cleanText(s.name, 40) ?? '',
    categories: (Array.isArray(s.categories) ? s.categories : []).filter((c): c is string => typeof c === 'string' && c.length <= 40).slice(0, 8),
    strength: bounded(s.strength, 0, 2) ?? 1,
  })).filter((s) => s.unitId) : [];
  return {
    id, name,
    age: bounded(v.age, 0, 120) ?? 12,
    reputation: bounded(v.reputation, 0, 100) ?? 50,
    tier: bounded(v.tier, 1, 6) ?? 1,
    shops: shops as PeerProfile['shops'],
  };
}

/** Événement de jeu reçu : forme stricte (la simulation vérifie ensuite qu'il a un sens). */
export function cleanEvent(v: unknown): MultiEvent | null {
  if (!isObj(v)) return null;
  const id = cleanId(v.id);
  const from = cleanId(v.from);
  const to = cleanId(v.to);
  const mechanic = typeof v.mechanic === 'string' && Object.prototype.hasOwnProperty.call(MULTI_MECHANIC_BY_ID, v.mechanic) ? v.mechanic as MultiMechanicId : null;
  const phase = oneOf(PHASES, v.phase);
  const day = bounded(v.day, -1, 1e6);
  if (!id || !from || !to || !mechanic || !phase || day === null) return null;
  const ev: MultiEvent = { id, from, to, mechanic, phase, day: Math.floor(day), fromName: cleanText(v.fromName, 24) ?? '' };
  if (v.amount !== undefined) { const a = bounded(v.amount, 0, 1e7); if (a === null) return null; ev.amount = a; }
  if (v.rate !== undefined) { const r = bounded(v.rate, 0, 1); if (r === null) return null; ev.rate = r; }
  if (v.days !== undefined) { const d = bounded(v.days, 0, 365); if (d === null) return null; ev.days = Math.floor(d); }
  if (typeof v.accepted === 'boolean') ev.accepted = v.accepted;
  if (typeof v.discovered === 'boolean') ev.discovered = v.discovered;
  if (v.ref !== undefined) { const r = cleanId(v.ref); if (!r) return null; ev.ref = r; }
  if (v.concept !== undefined) { const c = cleanId(v.concept); if (c) ev.concept = c; }
  if (v.report !== undefined) { const r = cleanText(v.report, 240); if (r) ev.report = r; }
  return ev;
}

/**
 * Message de jeu reçu d'un autre joueur, validé. `null` : illisible ou hostile (ignoré).
 * Une présentation d'une autre version du protocole revient sous la forme `{ t: 'version' }`.
 */
export function parseGameMsg(raw: unknown): GameMsg | { t: 'version'; v: number; name: string } | null {
  if (!isObj(raw) || typeof raw.t !== 'string') return null;
  switch (raw.t) {
    case 'hello': {
      if (raw.v !== NET_PROTOCOL) {
        const p = isObj(raw.player) ? raw.player : {};
        return { t: 'version', v: finite(raw.v) ? raw.v : 0, name: cleanText(p.name, 24) || 'Un joueur' };
      }
      const player = cleanProfile(raw.player);
      if (!player) return null;
      return {
        t: 'hello', v: NET_PROTOCOL, player, appearance: cleanAppearance(raw.appearance),
        gender: oneOf(VALID_GENDERS, raw.gender), heightM: bounded(raw.heightM, 1, 2.2) ?? 1.5,
        mode: oneOf(MODES, raw.mode), reply: raw.reply === true,
        // Modèle 3D choisi dans le créateur : identifiant court ; inconnu du manifeste, il est ignoré à l'affichage.
        model: typeof raw.model === 'string' && /^[\w-]{1,48}$/.test(raw.model) ? raw.model : undefined,
      };
    }
    case 'profile': {
      const player = cleanProfile(raw.player);
      return player ? { t: 'profile', player } : null;
    }
    case 'pose': {
      // Coordonnées de la ville (1562 × 1154 cases) : au-delà, la position est fausse.
      const x = bounded(raw.x, -200, 1800);
      const z = bounded(raw.z, -200, 1400);
      const h = bounded(raw.h, -100, 100);
      const s = bounded(raw.s, 0, 50);
      if (x === null || z === null || h === null || s === null) return null;
      // `busy` : le joueur est dans une fenêtre ou une cinématique (son horloge est en pause).
      return { t: 'pose', x, z, h, s, inside: raw.inside === true, busy: raw.busy === true };
    }
    case 'clock': {
      const tick = bounded(raw.tick, 0, 1e9);
      const mode = oneOf(MODES, raw.mode);
      const pace = oneOf(PACE_IDS, raw.pace);
      if (tick === null || !mode) return null;
      return { t: 'clock', tick: Math.floor(tick), pace: pace ?? 'lent', mode };
    }
    case 'pace': {
      const pace = oneOf(PACE_IDS, raw.pace);
      return pace ? { t: 'pace', pace } : null;
    }
    case 'skip': {
      const kind = oneOf(SKIPS, raw.kind);
      const target = bounded(raw.target, 0, 1e9);
      return kind && target !== null ? { t: 'skip', kind, target: Math.floor(target) } : null;
    }
    case 'event': {
      const ev = cleanEvent(raw.ev);
      return ev ? { t: 'event', ev } : null;
    }
    case 'ack': {
      if (!Array.isArray(raw.ids)) return null;
      const ids = raw.ids.slice(0, 50).map(cleanId).filter((x): x is string => !!x);
      return ids.length ? { t: 'ack', ids } : null;
    }
    case 'chat': {
      const text = cleanText(raw.text, 200);
      return text ? { t: 'chat', text } : null;
    }
    default:
      return null;
  }
}

/** Message du relais, validé (le relais est de confiance, mais la page peut être servie par n'importe qui). */
export function parseRelayMsg(raw: unknown): RelayMsg | null {
  if (!isObj(raw) || typeof raw.t !== 'string') return null;
  const conn = (v: unknown): number | null => (Number.isInteger(v) && (v as number) > 0 ? v as number : null);
  switch (raw.t) {
    case 'welcome': {
      const you = conn(raw.you);
      const host = conn(raw.host);
      if (!you || !host) return null;
      const peers = Array.isArray(raw.peers) ? raw.peers.map(conn).filter((x): x is number => !!x) : [];
      const addresses = Array.isArray(raw.addresses) ? raw.addresses.filter((a): a is string => typeof a === 'string' && /^[0-9a-fA-F:.]{3,45}$/.test(a)).slice(0, 8) : [];
      return { t: 'welcome', you, host, peers, addresses, port: bounded(raw.port, 1, 65535) ?? undefined, max: bounded(raw.max, 1, 64) ?? undefined };
    }
    case 'join':
    case 'leave':
    case 'host': {
      const c = conn(raw.conn);
      return c ? { t: raw.t, conn: c } : null;
    }
    case 'error':
      return { t: 'error', code: cleanText(raw.code, 32) ?? 'inconnu', text: cleanText(raw.text, 200) ?? undefined };
    case 'relay': {
      const c = conn(raw.conn);
      return c ? { t: 'relay', conn: c, msg: raw.msg } : null;
    }
    default:
      return null;
  }
}
