/**
 * Multijoueur de bout en bout : vrai relais (tools/net-relay.mjs) sur un vrai serveur HTTP local,
 * 2 à 4 vraies sessions (src/net/session.ts) avec leurs mondes, et un client WebSocket hostile.
 * Rejoindre/quitter, présence, prêt et coentreprise par le réseau, coupure et reprise (renvoi des
 * événements), départ de l'hôte, sauvegarde ouverte deux fois, salon plein, messages hostiles.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import { attachRelay } from '../tools/net-relay.mjs';
import { createWorld } from '../src/core/store';
import { DEFAULT_PLAYER_APPEARANCE, type Notification, type WorldState } from '../src/core/types';
import { MultiplayerSession } from '../src/net/session';
import { actOn, multiDemand, respondToOffer } from '../src/simulation/multiplayer';
import { parseGameMsg } from '../src/net/protocol';

let server: Server;
let relay: ReturnType<typeof attachRelay>;
let port = 0;
const sockets: Socket[] = [];
let room = 0;

beforeAll(async () => {
  server = createServer((_q, r) => r.end('ok'));
  server.on('upgrade', (_req, socket: Socket) => sockets.push(socket));
  relay = attachRelay(server);
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  port = (server.address() as AddressInfo).port;
});
afterAll(async () => {
  relay.close();
  await new Promise<void>((done) => server.close(() => done()));
});

const until = async (pred: () => boolean, ms = 5000): Promise<void> => {
  const t0 = Date.now();
  while (!pred()) {
    if (Date.now() - t0 > ms) throw new Error('condition non atteinte');
    await new Promise((r) => setTimeout(r, 20));
  }
};

interface Player { w: WorldState; s: MultiplayerSession; notes: Notification[]; stop(): void }

let idn = 0;
function player(name: string, addr: string, seed: number, w = createWorld({ seed })): Player {
  w.player.firstName = name;
  w.player.money = 1000;
  const notes: Notification[] = [];
  const store = new Map<string, string>();
  const s = new MultiplayerSession(w, {
    notify: (l) => notes.push(...l), skip: () => {}, paceRequest: () => {}, changed: () => {},
    me: () => ({ appearance: DEFAULT_PLAYER_APPEARANCE, heightM: 1.5 }),
  }, { storage: { get: (k) => store.get(k) ?? '', set: (k, v) => { store.set(k, v); } }, newId: () => `p${++idn}` });
  s.connect(addr, 'libre');
  const timer = setInterval(() => s.update(performance.now(), { x: 100 + seed, z: 200, heading: 0, speed: 1 }, false, 'lent'), 30);
  return { w, s, notes, stop: () => { clearInterval(timer); s.disconnect(); } };
}

const addr = (): string => `127.0.0.1:${port}/net?room=t${++room}`;

describe('multijoueur en réseau (relais réel)', () => {
  it('2 à 4 joueurs se voient, s’échangent un prêt et une coentreprise ; le départ est signalé', async () => {
    const a0 = addr();
    const ps = [player('Alex', a0, 1), player('Bilal', a0, 2), player('Chloé', a0, 3), player('Dana', a0, 4)];
    try {
      await until(() => ps.every((p) => p.s.connected && p.s.remotes.size === 3));
      const [A, B, C] = ps as [Player, Player, Player, Player];
      expect(A.s.isHost).toBe(true);
      expect(B.s.isHost).toBe(false);
      await until(() => B.s.visibleRemotes(performance.now()).some((r) => r.name === 'Alex' && r.x === 101));
      expect(B.s.hostTick).toBe(A.w.time.tick);
      // Prêt de A à B.
      const bId = B.w.multiplayer!.selfId;
      expect(actOn(A.w, 'libre', 'pret', bId, { amount: 200, rate: 0.1 }).ok).toBe(true);
      await until(() => B.w.multiplayer!.offers.length === 1);
      respondToOffer(B.w, B.w.multiplayer!.offers[0]!.id, true);
      await until(() => B.w.player.money === 1200 && A.w.multiplayer!.debts.length === 1);
      expect(A.w.player.money + B.w.player.money).toBe(2000);
      // Coentreprise de C avec A : la demande monte des deux côtés.
      actOn(C.w, 'libre', 'coentreprise', A.w.multiplayer!.selfId);
      await until(() => A.w.multiplayer!.offers.length === 1);
      respondToOffer(A.w, A.w.multiplayer!.offers[0]!.id, true);
      await until(() => multiDemand(A.w) > 1 && multiDemand(C.w) > 1);
      // Accusés de réception : plus rien n'attend dans les boîtes d'envoi.
      await until(() => ps.every((p) => p.w.multiplayer!.outbox.length === 0));
      // Un joueur s'en va : les autres le savent.
      ps[3]!.stop();
      await until(() => A.s.remotes.size === 2);
      expect(A.notes.some((n) => n.text.includes('Dana a quitté'))).toBe(true);
    } finally { for (const p of ps) p.stop(); }
  }, 20000);

  it('l’hôte part : le suivant prend l’horloge ; un 5e joueur est refusé avec un message clair', async () => {
    const a0 = addr();
    const ps = [player('H', a0, 5), player('I', a0, 6), player('J', a0, 7), player('K', a0, 8)];
    try {
      await until(() => ps.every((p) => p.s.connected && p.s.remotes.size === 3));
      const fifth = player('L', a0, 9);
      await until(() => fifth.s.detail.includes('complète'));
      expect(fifth.s.connected).toBe(false);
      fifth.stop();
      ps[0]!.stop();
      await until(() => ps[1]!.s.isHost);
      ps[1]!.w.time.tick += 5;
      await until(() => ps[2]!.s.hostTick === ps[1]!.w.time.tick);
    } finally { for (const p of ps) p.stop(); }
  }, 20000);

  it('coupure réseau : reconnexion automatique, et ce qui a été fait pendant la coupure arrive', async () => {
    const a0 = addr();
    const before = sockets.length;
    const A = player('Alex', a0, 10);
    await until(() => A.s.connected);
    const B = player('Bilal', a0, 11);
    try {
      await until(() => A.s.remotes.size === 1 && B.s.remotes.size === 1);
      const bSock = sockets[before + 1]!;
      bSock.destroy();
      await until(() => A.s.remotes.size === 0);
      // A recommande B pendant que B est hors ligne : l'événement attend dans la boîte d'envoi.
      actOn(A.w, 'libre', 'recommandation', B.w.multiplayer!.selfId);
      await until(() => B.s.connected && A.s.remotes.size === 1, 8000);
      await until(() => multiDemand(B.w) > 1.1);
      await until(() => A.w.multiplayer!.outbox.length === 0);
    } finally { A.stop(); B.stop(); }
  }, 20000);

  it('même sauvegarde ouverte deux fois : le dernier arrivé prend un autre identifiant', async () => {
    const a0 = addr();
    const w1 = createWorld({ seed: 12 });
    const A = player('Alex', a0, 12, w1);
    await until(() => A.s.connected);
    const copy = structuredClone(w1);
    const B = player('Alex', a0, 13, copy);
    try {
      await until(() => A.s.remotes.size === 1 && B.s.remotes.size === 1);
      expect(B.w.multiplayer!.selfId).not.toBe(A.w.multiplayer!.selfId);
    } finally { A.stop(); B.stop(); }
  }, 20000);

  it('un client hostile ne corrompt rien : usurpation, messages illisibles, HTML, inondation', async () => {
    const a0 = addr();
    const A = player('Alex', a0, 14);
    await until(() => A.s.connected);
    const ws = new WebSocket(`ws://${a0}`);
    await new Promise<void>((r) => { ws.onopen = () => r(); });
    try {
      const hello = { t: 'hello', v: 2, player: { id: 'mechant', name: '<img src=x onerror=alert(1)>‮Éve', age: 13, reputation: 50, tier: 1, shops: [] }, appearance: { skinTone: '"><script>' }, heightM: 99 };
      ws.send(JSON.stringify(hello));
      await until(() => A.s.remotes.size === 1);
      const r = [...A.s.remotes.values()][0]!;
      expect(r.name).not.toMatch(/[‮]/);
      expect(r.appearance.skinTone).toBe(DEFAULT_PLAYER_APPEARANCE.skinTone);
      expect(r.heightM).toBe(1.5);
      const self = A.w.multiplayer!.selfId;
      const money = A.w.player.money;
      // Usurpation d'un autre joueur, argent inventé, JSON cassé, types absurdes.
      ws.send(JSON.stringify({ t: 'event', ev: { id: 'x1', from: 'autre', to: self, day: 0, mechanic: 'rumeur', phase: 'act', fromName: 'x' } }));
      ws.send(JSON.stringify({ t: 'event', ev: { id: 'x2', from: 'mechant', to: self, day: 0, mechanic: 'pret', phase: 'settle', amount: 1e6, ref: 'z', fromName: 'x' } }));
      ws.send('{pas du json');
      ws.send(JSON.stringify({ t: 'pose', x: 'NaN', z: null }));
      ws.send(JSON.stringify({ t: 'skip', kind: 'mois', target: 1e12 }));
      for (let i = 0; i < 400; i++) ws.send(JSON.stringify({ t: 'chat', text: `spam ${i}` }));
      await new Promise((res) => setTimeout(res, 400));
      expect(A.w.player.money).toBe(money);
      expect(A.s.chat.length).toBeLessThanOrEqual(30);
      expect(A.notes.filter((n) => n.text.startsWith('💬')).length).toBeLessThan(20);
      expect(A.s.connected).toBe(true);
    } finally { ws.close(); A.stop(); }
  }, 20000);
});

describe('protocole : validation des messages', () => {
  it('rejette les formes invalides, borne les textes, signale une autre version', () => {
    expect(parseGameMsg(null)).toBeNull();
    expect(parseGameMsg({ t: 'inconnu' })).toBeNull();
    expect(parseGameMsg({ t: 'pose', x: 1, z: 2, h: 0, s: 1e9 })).toBeNull();
    expect(parseGameMsg({ t: 'hello', v: 1, player: { name: 'Vieux' } })).toEqual({ t: 'version', v: 1, name: 'Vieux' });
    const chat = parseGameMsg({ t: 'chat', text: `a\u0000b${'x'.repeat(500)}` }) as { text: string };
    expect(chat.text.length).toBe(200);
    expect(chat.text).not.toContain('\u0000');
    expect(parseGameMsg({ t: 'event', ev: { id: 'a b', from: 'x', to: 'y', day: 0, mechanic: 'pret', phase: 'act' } })).toBeNull();
    expect(parseGameMsg({ t: 'event', ev: { id: 'a', from: 'x', to: 'y', day: 0, mechanic: '__proto__', phase: 'act' } })).toBeNull();
  });
});
