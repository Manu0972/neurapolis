/**
 * Protocole du multijoueur entre navigateurs (via le relais `tools/net-relay.mjs`).
 *
 * Le relais enveloppe chaque message de jeu : { t: 'relay', conn, msg }. Il envoie aussi
 * welcome / join / leave / host. Les messages de jeu ci-dessous sont des données simples :
 * aucune logique ici, seulement des formes (la simulation reste dans src/simulation).
 */
import type { MultiEvent, MultiMode } from '../core/multiplayer_types';
import type { PlayerAppearance, PlayerGender } from '../core/types';
import type { PeerProfile } from '../simulation/multiplayer';

/** Version du protocole : deux versions différentes refusent de jouer ensemble. */
export const NET_PROTOCOL = 1;

export type RelayMsg =
  | { t: 'welcome'; you: number; host: number; peers: number[] }
  | { t: 'join'; conn: number }
  | { t: 'leave'; conn: number }
  | { t: 'host'; conn: number }
  | { t: 'relay'; conn: number; msg: GameMsg };

export type GameMsg =
  /** Présentation : profil, apparence ; l'hôte y joint le mode de la partie. */
  | { t: 'hello'; v: number; player: PeerProfile; appearance: PlayerAppearance; gender?: PlayerGender; heightM: number; mode?: MultiMode; reply?: boolean }
  /** Profil à jour (commerces, réputation, palier), quelques fois par minute. */
  | { t: 'profile'; player: PeerProfile }
  /** Position dans la ville (≈ 10 fois par seconde). */
  | { t: 'pose'; p: string; x: number; z: number; h: number; s: number; inside: boolean }
  /** Horloge partagée, envoyée par l'hôte. */
  | { t: 'clock'; tick: number; pace: string; mode: MultiMode }
  /** Demande d'allure envoyée à l'hôte par un autre joueur. */
  | { t: 'pace'; pace: string }
  /** L'hôte passe le temps : les autres font le même saut. */
  | { t: 'skip'; kind: 'jour' | 'semaine' | 'mois' | 'vacances'; target: number }
  /** Interaction de jeu (prêt, sabotage…) — filtrée par `ev.to`. */
  | { t: 'event'; ev: MultiEvent }
  /** Message libre entre joueurs. */
  | { t: 'chat'; p: string; name: string; text: string };

/** Adresse du relais par défaut : le serveur qui a servi la page. */
export function defaultRelayUrl(room = 'neurapolis'): string {
  if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return '';
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/net?room=${encodeURIComponent(room)}`;
}

/** Accepte « 100.64.1.2:8765 », « http://… », « ws://… » et en fait une adresse de relais. */
export function normalizeRelayUrl(input: string, room = 'neurapolis'): string {
  const raw = input.trim();
  if (!raw) return defaultRelayUrl(room);
  let u = raw;
  if (!/^[a-z]+:\/\//i.test(u)) u = `ws://${u}`;
  u = u.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const url = new URL(u);
  // Adresse tapée sans port (ex. « 100.64.12.34 ») : port du serveur LAN de NEURAPOLIS.
  if (!url.port && !/:\d+/.test(raw.replace(/^[a-z]+:\/\//i, ''))) url.port = '8765';
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/net';
  if (!url.searchParams.get('room')) url.searchParams.set('room', room);
  return url.toString();
}
