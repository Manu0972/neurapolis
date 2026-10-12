/**
 * Session multijoueur (sans DOM) : relie le monde local aux autres joueurs à travers le relais.
 *
 * Mondes parallèles reliés : chaque joueur garde sa simulation ; la session échange la présence
 * (avatars dans la ville), l'horloge (l'hôte pilote le temps partagé), les sauts de temps et les
 * interactions (src/simulation/multiplayer.ts). Le premier connecté au salon est l'hôte ; s'il
 * part, le suivant reprend la main.
 *
 * Fiabilité : chaque connexion est liée à un seul joueur (identifiant annoncé à sa présentation) ;
 * un message qui prétend venir d'un autre est ignoré. Les événements de jeu restent dans la boîte
 * d'envoi du monde (sauvegardée) jusqu'à l'accusé de réception et sont renvoyés après une coupure.
 * Chaque joueur a un débit borné : un pair qui inonde la partie est mis en sourdine.
 */
import type { Notification, PlayerAppearance, PlayerGender, WorldState } from '../core/types';
import type { MultiMode } from '../core/multiplayer_types';
import {
  acknowledgeEvents, ensureMultiplayer, publicProfile, receiveMultiEvent, renameSelf, upsertPeer,
} from '../simulation/multiplayer';
import { connectRelay, type NetClient, type NetStatus } from './client';
import { NET_PROTOCOL, cleanText, displayAddress, normalizeRelayUrl, parseGameMsg, type GameMsg, type RelayMsg, type SkipKind } from './protocol';

export interface RemotePlayer {
  conn: number;
  id: string;
  name: string;
  appearance: PlayerAppearance;
  gender?: PlayerGender;
  heightM: number;
  x: number;
  z: number;
  h: number;
  s: number;
  inside: boolean;
  /** Dernière position reçue (ms, horloge locale). */
  seenAt: number;
}

export interface SessionHooks {
  /** Notifications de jeu à afficher (toasts, fantômes). */
  notify(list: Notification[]): void;
  /** L'hôte a lancé un saut de temps : on fait le même. */
  skip(kind: SkipKind, target: number): void;
  /** (Hôte) un joueur demande une autre allure. */
  paceRequest(pace: string): void;
  /** Quelque chose a changé (panneau, HUD). */
  changed(): void;
  /** Apparence et taille du joueur local. */
  me(): { appearance: PlayerAppearance; gender?: PlayerGender; heightM: number };
}

/** Ce que la session emprunte à son environnement (remplaçable dans les tests). */
export interface SessionEnv {
  connect: typeof connectRelay;
  storage: { get(key: string): string; set(key: string, value: string): void };
  newId(): string;
  now(): number;
}

export const MP_KEYS = { address: 'neurapolis.multijoueur.adresse', resume: 'neurapolis.multijoueur.reprendre', mode: 'neurapolis.multijoueur.mode' } as const;

function browserEnv(): SessionEnv {
  return {
    connect: connectRelay,
    storage: {
      get: (k) => { try { return globalThis.localStorage?.getItem(k) ?? ''; } catch { return ''; } },
      set: (k, v) => { try { globalThis.localStorage?.setItem(k, v); } catch { /* préférence perdue : sans gravité */ } },
    },
    newId: () => {
      const a = new Uint32Array(2);
      globalThis.crypto.getRandomValues(a);
      return `j${a[0]!.toString(36)}${a[1]!.toString(36)}`;
    },
    now: () => globalThis.performance.now(),
  };
}

/** Débit permis par joueur et par type de message : [réserve, recharge par seconde]. */
const RATE: Record<string, readonly [number, number]> = {
  pose: [40, 20], profile: [5, 1], hello: [6, 1], clock: [10, 5], pace: [4, 0.5], skip: [3, 0.5],
  event: [60, 20], ack: [60, 20], chat: [5, 1], version: [3, 0.2],
};
/** Messages refusés au-delà desquels un joueur est mis en sourdine. */
const MUTE_AFTER = 300;
/** Un événement sans accusé de réception est renvoyé après ce délai. */
const RESEND_MS = 4000;
/** Une connexion silencieuse depuis ce délai peut être reprise par le même joueur (reconnexion). */
const TAKEOVER_MS = 3000;

export class MultiplayerSession {
  private client: NetClient | null = null;
  private readonly env: SessionEnv;
  status: NetStatus = 'deconnecte';
  detail = '';
  me: number | null = null;
  host: number | null = null;
  mode: MultiMode = 'libre';
  /** Mode choisi localement (appliqué si l'on devient hôte). */
  wantedMode: MultiMode = 'libre';
  readonly remotes = new Map<number, RemotePlayer>();
  /** Horloge de l'hôte (pour les autres joueurs). */
  hostTick: number | null = null;
  hostPace = 'lent';
  /** Adresses du serveur (cartes réseau de l'hôte) et port, envoyés par le relais. */
  addresses: string[] = [];
  port: number | undefined;
  maxPlayers = 4;
  readonly chat: { name: string; text: string; mine: boolean }[] = [];
  private lastPose = -1e9;
  private lastProfile = -1e9;
  private lastClock = -1e9;
  private lastOffers = 0;
  private lastSweep = 0;
  private wasConnected = false;
  private readonly lastSent = new Map<string, number>();
  private readonly buckets = new Map<string, { tokens: number; at: number }>();
  private readonly drops = new Map<number, number>();
  private readonly muted = new Set<number>();
  private readonly warned = new Set<number>();
  private readonly lastHeard = new Map<number, number>();

  constructor(private world: WorldState, private hooks: SessionHooks, env: Partial<SessionEnv> = {}) {
    this.env = { ...browserEnv(), ...env };
    const m = this.env.storage.get(MP_KEYS.mode);
    if (m === 'cooperation' || m === 'libre' || m === 'rivalite') this.wantedMode = this.mode = m;
  }

  get connected(): boolean { return this.status === 'connecte' && this.me !== null; }
  get isHost(): boolean { return this.connected && this.me === this.host; }
  /** Un autre joueur pilote le temps : on suit son horloge. */
  get followsHost(): boolean { return this.connected && !this.isHost && this.hostTick !== null; }
  get playerCount(): number { return this.connected ? this.remotes.size + 1 : 0; }
  /** Avance de ton monde sur l'horloge de l'hôte (en ticks ; > 0 : tu l'attends). */
  get aheadOfHost(): number { return this.followsHost ? this.world.time.tick - (this.hostTick ?? 0) : 0; }
  /** Adresses à donner aux amis (http://…:port). */
  get shareAddresses(): string[] { return this.addresses.map((a) => displayAddress(a, this.port)); }

  setWorld(w: WorldState): void { this.world = w; }

  /** Joueurs connus de la sauvegarde mais absents en ce moment. */
  offlinePeers(): string[] {
    const online = new Set([...this.remotes.values()].map((r) => r.id));
    return Object.values(this.world.multiplayer?.peers ?? {}).filter((p) => !online.has(p.id)).map((p) => p.name);
  }

  connect(address: string, mode: MultiMode): void {
    this.close();
    ensureMultiplayer(this.world, this.world.multiplayer?.selfId || this.env.newId());
    this.wantedMode = mode;
    this.mode = mode;
    this.env.storage.set(MP_KEYS.mode, mode);
    let url: string;
    try {
      url = normalizeRelayUrl(address);
    } catch {
      this.detail = `Adresse invalide : « ${address.trim()} ». Exemple : 192.168.1.20:8765.`;
      this.hooks.changed();
      return;
    }
    if (!url) {
      this.detail = 'Indique l’adresse de l’hôte (par exemple 192.168.1.20:8765).';
      this.hooks.changed();
      return;
    }
    this.env.storage.set(MP_KEYS.address, address.trim());
    this.env.storage.set(MP_KEYS.resume, '1');
    this.client = this.env.connect(url, {
      onMessage: (msg) => this.onRelay(msg),
      onStatus: (s, detail) => {
        this.status = s;
        this.detail = detail ?? '';
        if (s === 'connecte') this.wasConnected = true;
        if (s !== 'connecte') {
          const lost = this.wasConnected && this.client !== null;
          this.reset();
          if (lost) this.hooks.notify([{ kind: 'alerte', text: `📡 ${this.detail || 'Connexion perdue.'} Ta partie continue en solo en attendant.` }]);
          this.wasConnected = false;
        }
        this.hooks.changed();
      },
    });
  }

  /** Quitter la partie (le joueur l'a demandé) : pas de reprise automatique. */
  disconnect(): void {
    this.env.storage.set(MP_KEYS.resume, '');
    this.close();
    this.detail = '';
    this.hooks.changed();
  }

  /** La sauvegarde vient d'une partie à plusieurs, quittée sans « Se déconnecter » : on la reprend. */
  wantsResume(): boolean {
    return this.env.storage.get(MP_KEYS.resume) === '1' && Object.keys(this.world.multiplayer?.peers ?? {}).length > 0;
  }

  resume(): void { this.connect(this.savedAddress(), this.wantedMode); }

  private close(): void {
    const c = this.client;
    this.client = null;
    c?.close();
    this.status = 'deconnecte';
    this.wasConnected = false;
    this.reset();
  }

  private reset(): void {
    this.me = null;
    this.host = null;
    this.hostTick = null;
    this.remotes.clear();
    this.lastSent.clear();
    this.buckets.clear();
    this.drops.clear();
    this.muted.clear();
    this.warned.clear();
    this.lastHeard.clear();
  }

  private send(msg: GameMsg): boolean { return this.client?.send(msg) ?? false; }

  private hello(reply = false): GameMsg {
    const me = this.hooks.me();
    return { t: 'hello', v: NET_PROTOCOL, player: publicProfile(this.world), appearance: me.appearance, gender: me.gender, heightM: me.heightM, mode: this.isHost ? this.mode : undefined, reply };
  }

  private allow(conn: number, kind: string): boolean {
    const [burst, perSec] = RATE[kind] ?? [10, 2];
    const now = this.env.now();
    const key = `${conn}:${kind}`;
    const b = this.buckets.get(key) ?? { tokens: burst, at: now };
    b.tokens = Math.min(burst, b.tokens + ((now - b.at) / 1000) * perSec);
    b.at = now;
    this.buckets.set(key, b);
    if (b.tokens >= 1) { b.tokens -= 1; return true; }
    const n = (this.drops.get(conn) ?? 0) + 1;
    this.drops.set(conn, n);
    if (n >= MUTE_AFTER && !this.muted.has(conn)) {
      this.muted.add(conn);
      const name = this.remotes.get(conn)?.name ?? 'Un joueur';
      this.hooks.notify([{ kind: 'alerte', text: `📡 ${name} envoie beaucoup trop de messages : ses messages sont ignorés jusqu’à sa reconnexion.` }]);
    }
    return false;
  }

  private nameOf(conn: number): string { return this.remotes.get(conn)?.name ?? 'Un joueur'; }

  private onRelay(msg: RelayMsg): void {
    switch (msg.t) {
      case 'welcome':
        this.me = msg.you;
        this.host = msg.host;
        this.addresses = msg.addresses ?? [];
        this.port = msg.port;
        if (msg.max) this.maxPlayers = msg.max;
        if (this.isHost) { this.mode = this.wantedMode; this.hostTick = null; }
        this.lastSent.clear();
        this.send(this.hello());
        break;
      case 'host': {
        const was = this.host;
        this.host = msg.conn;
        if (this.isHost) {
          this.hostTick = null;
          this.send(this.hello(true));
          if (was !== msg.conn) this.hooks.notify([{ kind: 'info', text: '📡 L’hôte est parti : c’est toi l’hôte maintenant, le temps suit ton horloge.' }]);
        } else if (was !== msg.conn) {
          this.hostTick = null;
          this.hooks.notify([{ kind: 'info', text: `📡 ${this.nameOf(msg.conn)} devient l’hôte : le temps suit son horloge.` }]);
        }
        break;
      }
      case 'leave': {
        const r = this.remotes.get(msg.conn);
        this.remotes.delete(msg.conn);
        this.muted.delete(msg.conn);
        this.drops.delete(msg.conn);
        this.lastHeard.delete(msg.conn);
        if (r) this.hooks.notify([{ kind: 'info', text: `📡 ${r.name} a quitté la partie. Vos accords et vos dettes restent dans vos sauvegardes.` }]);
        break;
      }
      case 'join':
        break;
      case 'error':
        if (msg.text) this.detail = msg.text;
        break;
      case 'relay':
        this.onGameRaw(msg.conn, msg.msg);
        break;
      default:
        break;
    }
    this.hooks.changed();
  }

  private onGameRaw(conn: number, raw: unknown): void {
    if (conn === this.me || this.muted.has(conn)) return;
    const msg = parseGameMsg(raw);
    if (!msg || !this.allow(conn, msg.t)) return;
    this.lastHeard.set(conn, this.env.now());
    this.onGame(conn, msg);
  }

  private onGame(conn: number, msg: NonNullable<ReturnType<typeof parseGameMsg>>): void {
    const now = this.env.now();
    const m = ensureMultiplayer(this.world);
    switch (msg.t) {
      case 'version':
        if (!this.warned.has(conn)) {
          this.warned.add(conn);
          this.hooks.notify([{ kind: 'alerte', text: `📡 ${msg.name} joue avec une autre version du jeu (protocole ${msg.v}, toi ${NET_PROTOCOL}) : mettez-vous à jour tous les deux.` }]);
        }
        return;
      case 'hello': {
        const p = msg.player;
        if (p.id === m.selfId) {
          // Même sauvegarde ouverte deux fois : le dernier arrivé change d'identifiant.
          if (this.me !== null && this.me > conn) {
            renameSelf(this.world, this.env.newId());
            this.hooks.notify([{ kind: 'info', text: '📡 Cette sauvegarde est déjà dans la partie (ouverte deux fois ?) : tu y entres comme un autre joueur.' }]);
            this.send(this.hello());
          } else if (!msg.reply) {
            // Premier arrivé : on se présente pour que l'autre voie le doublon et change d'identifiant.
            this.send(this.hello(true));
          }
          return;
        }
        // Un identifiant déjà pris par une autre connexion : reprise seulement si l'ancienne s'est tue.
        for (const r of [...this.remotes.values()]) {
          if (r.id !== p.id || r.conn === conn) continue;
          if (now - (this.lastHeard.get(r.conn) ?? 0) < TAKEOVER_MS) return;
          this.remotes.delete(r.conn);
        }
        const prev = this.remotes.get(conn);
        if (prev && prev.id !== p.id) return; // une connexion = un joueur
        upsertPeer(this.world, p);
        const name = m.peers[p.id]?.name ?? p.name;
        this.remotes.set(conn, {
          conn, id: p.id, name, appearance: msg.appearance, gender: msg.gender, heightM: msg.heightM,
          x: prev?.x ?? 0, z: prev?.z ?? 0, h: prev?.h ?? 0, s: 0, inside: prev?.inside ?? true, seenAt: prev?.seenAt ?? now,
        });
        if (conn === this.host && msg.mode) this.mode = msg.mode;
        if (!prev) {
          // Nouveau venu (ou retour) : ce qui l'attend dans la boîte d'envoi part tout de suite.
          for (const e of m.outbox) if (e.to === p.id) this.lastSent.delete(e.id);
          this.hooks.notify([{ kind: 'bien', text: `📡 ${name} est dans la partie.` }]);
        }
        if (!msg.reply) this.send(this.hello(true));
        return;
      }
      case 'profile': {
        const r = this.remotes.get(conn);
        if (!r || r.id !== msg.player.id) return;
        upsertPeer(this.world, msg.player);
        r.name = m.peers[r.id]?.name ?? r.name;
        return;
      }
      case 'pose': {
        const r = this.remotes.get(conn);
        if (r) Object.assign(r, { x: msg.x, z: msg.z, h: msg.h, s: msg.s, inside: msg.inside, seenAt: now });
        return;
      }
      case 'clock':
        if (conn === this.host && !this.isHost) { this.hostTick = msg.tick; this.hostPace = msg.pace; this.mode = msg.mode; }
        return;
      case 'pace':
        if (this.isHost && this.remotes.has(conn)) this.hooks.paceRequest(msg.pace);
        return;
      case 'skip':
        if (conn === this.host && !this.isHost) this.hooks.skip(msg.kind, msg.target);
        return;
      case 'event': {
        const r = this.remotes.get(conn);
        if (!r || msg.ev.from !== r.id) return; // usurpation : ignoré
        const notes = receiveMultiEvent(this.world, msg.ev, this.mode);
        this.send({ t: 'ack', ids: [msg.ev.id], to: conn });
        if (notes.length) this.hooks.notify(notes);
        return;
      }
      case 'ack': {
        const r = this.remotes.get(conn);
        if (!r) return;
        acknowledgeEvents(this.world, r.id, msg.ids);
        for (const id of msg.ids) this.lastSent.delete(id);
        return;
      }
      case 'chat': {
        const r = this.remotes.get(conn);
        if (!r) return;
        this.chat.push({ name: r.name, text: msg.text, mine: false });
        if (this.chat.length > 30) this.chat.shift();
        this.hooks.notify([{ kind: 'info', text: `💬 ${r.name} : ${msg.text}` }]);
        return;
      }
      default:
        return;
    }
  }

  /** Chaque image : position, profil, horloge (hôte), événements à envoyer ou à renvoyer. */
  update(nowMs: number, pose: { x: number; z: number; heading: number; speed: number }, inside: boolean, pace: string): void {
    if (!this.connected) return;
    const m = ensureMultiplayer(this.world);
    if (nowMs - this.lastPose > 100) {
      this.lastPose = nowMs;
      const r2 = (v: number): number => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
      this.send({ t: 'pose', x: r2(pose.x), z: r2(pose.z), h: r2(pose.heading), s: Math.round((Number.isFinite(pose.speed) ? pose.speed : 0) * 10) / 10, inside });
    }
    if (nowMs - this.lastProfile > 5000) {
      this.lastProfile = nowMs;
      this.send({ t: 'profile', player: publicProfile(this.world) });
    }
    if (this.isHost && nowMs - this.lastClock > 500) {
      this.lastClock = nowMs;
      this.send({ t: 'clock', tick: this.world.time.tick, pace, mode: this.mode });
    }
    this.flush(nowMs);
    const offers = m.offers.length;
    if (offers !== this.lastOffers) { this.lastOffers = offers; this.hooks.changed(); }
  }

  /** Envoie (ou renvoie) les événements aux joueurs présents ; les absents les recevront à leur retour. */
  flush(nowMs = this.env.now()): void {
    if (!this.connected) return;
    const m = ensureMultiplayer(this.world);
    const connOf = new Map<string, number>();
    for (const r of this.remotes.values()) connOf.set(r.id, r.conn);
    let budget = 20;
    for (const ev of m.outbox) {
      const conn = connOf.get(ev.to);
      if (conn === undefined) continue;
      const t = this.lastSent.get(ev.id);
      if (t !== undefined && nowMs - t < RESEND_MS) continue;
      if (!this.send({ t: 'event', ev, to: conn })) break;
      this.lastSent.set(ev.id, nowMs);
      if (--budget <= 0) break;
    }
    if (nowMs - this.lastSweep > 10000) {
      this.lastSweep = nowMs;
      const live = new Set(m.outbox.map((e) => e.id));
      for (const id of [...this.lastSent.keys()]) if (!live.has(id)) this.lastSent.delete(id);
    }
  }

  /** L'hôte saute le temps : tout le monde suit. */
  broadcastSkip(kind: SkipKind, target: number): void {
    if (this.isHost) this.send({ t: 'skip', kind, target });
  }

  requestPace(pace: string): void {
    this.send({ t: 'pace', pace });
  }

  say(text: string): boolean {
    const t = cleanText(text, 200);
    if (!t || !this.connected) return false;
    const name = this.world.player.firstName || this.world.player.name;
    if (!this.send({ t: 'chat', text: t })) return false;
    this.chat.push({ name, text: t, mine: true });
    if (this.chat.length > 30) this.chat.shift();
    return true;
  }

  /** Autres joueurs visibles dehors (position récente). */
  visibleRemotes(nowMs: number): RemotePlayer[] {
    return [...this.remotes.values()].filter((r) => !r.inside && nowMs - r.seenAt < 60000);
  }

  pendingOffers(): number { return this.world.multiplayer?.offers.length ?? 0; }

  savedAddress(): string { return this.env.storage.get(MP_KEYS.address); }
}
