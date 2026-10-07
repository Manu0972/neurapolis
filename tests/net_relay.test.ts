/**
 * Relais WebSocket du multijoueur (tools/net-relay.mjs) : de vrais clients WebSocket sur un vrai
 * serveur HTTP local. Accueil, hôte, relais des messages, départ et passation d'hôte.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { attachRelay } from '../tools/net-relay.mjs';

let server: Server;
let relay: ReturnType<typeof attachRelay>;
let url = '';

beforeAll(async () => {
  server = createServer((_q, r) => r.end('ok'));
  relay = attachRelay(server);
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/net?room=test`;
});

afterAll(async () => {
  relay.close();
  await new Promise<void>((done) => server.close(() => done()));
});

/** Client qui range les messages reçus et sait en attendre un. */
function client() {
  const ws = new WebSocket(url);
  const inbox: Record<string, unknown>[] = [];
  const waiters: { pred: (m: Record<string, unknown>) => boolean; done: (m: Record<string, unknown>) => void }[] = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data)) as Record<string, unknown>;
    inbox.push(m);
    for (const w of [...waiters]) if (w.pred(m)) { waiters.splice(waiters.indexOf(w), 1); w.done(m); }
  };
  const wait = (pred: (m: Record<string, unknown>) => boolean): Promise<Record<string, unknown>> => {
    const hit = inbox.find(pred);
    if (hit) return Promise.resolve(hit);
    return new Promise((done, fail) => {
      waiters.push({ pred, done });
      setTimeout(() => fail(new Error('message attendu non reçu')), 3000);
    });
  };
  const open = new Promise<void>((done) => { ws.onopen = () => done(); });
  return { ws, inbox, wait, open };
}

describe('relais du multijoueur', () => {
  it('accueille, relaie dans les deux sens, désigne et transmet l’hôte', async () => {
    const a = client();
    await a.open;
    const wa = await a.wait((m) => m.t === 'welcome');
    expect(wa.host).toBe(wa.you);
    const b = client();
    await b.open;
    const wb = await b.wait((m) => m.t === 'welcome');
    expect(wb.host).toBe(wa.you);
    expect(wb.peers).toEqual([wa.you]);
    await a.wait((m) => m.t === 'join' && m.conn === wb.you);

    a.ws.send(JSON.stringify({ t: 'hello', name: 'Alex' }));
    const got = await b.wait((m) => m.t === 'relay');
    expect(got.conn).toBe(wa.you);
    expect((got.msg as { name: string }).name).toBe('Alex');

    // Un long message (trame de plus de 65 535 octets) passe aussi.
    const big = 'x'.repeat(70000);
    b.ws.send(JSON.stringify({ t: 'big', big }));
    const gotBig = await a.wait((m) => m.t === 'relay' && (m.msg as { t: string }).t === 'big');
    expect(((gotBig.msg as { big: string }).big).length).toBe(70000);

    expect(relay.rooms()).toEqual([{ room: 'test', players: 2 }]);
    a.ws.close();
    await b.wait((m) => m.t === 'leave' && m.conn === wa.you);
    const h = await b.wait((m) => m.t === 'host');
    expect(h.conn).toBe(wb.you);
    b.ws.close();
  });
});
