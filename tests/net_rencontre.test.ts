/**
 * Deux joueurs se rencontrent dans la ville : ce que l'un voit de l'autre.
 * Mouvement lissé (src/net/interp.ts), tenue complète transmise (save v26), état « occupé »
 * (fenêtre ou cinématique) qui ne bloque pas l'autre, sauvegarde immédiate après un prêt,
 * montants à la française. Partie réseau : vrai relais (tools/net-relay.mjs) sur un serveur local.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { attachRelay } from '../tools/net-relay.mjs';
import { createWorld } from '../src/core/store';
import { DEFAULT_PLAYER_APPEARANCE, type PlayerAppearance, type WorldState } from '../src/core/types';
import { HOST_BUSY_SLACK, MultiplayerSession, guestClockSpeed } from '../src/net/session';
import { INTERP_DELAY_MS, MAX_EXTRAPOLATE_MS, pushSample, samplePose, wrapAngle, type PoseSample } from '../src/net/interp';
import { cleanAppearance } from '../src/net/protocol';
import { actOn, deNom, euros, respondToOffer } from '../src/simulation/multiplayer';

describe('mouvement lissé des autres joueurs', () => {
  it('interpole entre deux poses reçues, avec un léger retard', () => {
    const track: PoseSample[] = [];
    pushSample(track, { t: 1000, x: 0, z: 0, h: 0, s: 2 });
    pushSample(track, { t: 1100, x: 1, z: 0, h: 0, s: 2 });
    const p = samplePose(track, 1050 + INTERP_DELAY_MS)!;
    expect(p.x).toBeCloseTo(0.5);
    // Avant la première pose : on reste dessus (pas de recul).
    expect(samplePose(track, 900)!.x).toBe(0);
  });

  it('prolonge brièvement le mouvement si les poses s’arrêtent, puis s’immobilise', () => {
    const track: PoseSample[] = [];
    pushSample(track, { t: 0, x: 0, z: 0, h: 0, s: 2 });
    pushSample(track, { t: 100, x: 1, z: 0, h: 0, s: 2 });
    const short = samplePose(track, 100 + INTERP_DELAY_MS + 50)!;
    expect(short.x).toBeCloseTo(1.5);
    const late = samplePose(track, 100 + INTERP_DELAY_MS + 5000)!;
    expect(late.x).toBeCloseTo(1 + MAX_EXTRAPOLATE_MS / 100);
    expect(late.s).toBe(0);
  });

  it('téléporte au lieu de glisser à travers la ville (bus, entrée dans un bâtiment)', () => {
    const track: PoseSample[] = [];
    pushSample(track, { t: 0, x: 0, z: 0, h: 0, s: 1 });
    pushSample(track, { t: 100, x: 80, z: 40, h: 0, s: 1 });
    expect(track).toHaveLength(1);
    expect(samplePose(track, 120)!.x).toBe(80);
  });

  it('tourne par le plus court chemin', () => {
    expect(wrapAngle(Math.PI * 2 + 0.1)).toBeCloseTo(0.1);
    const track: PoseSample[] = [];
    pushSample(track, { t: 0, x: 0, z: 0, h: 3, s: 0 });
    pushSample(track, { t: 100, x: 0, z: 0, h: -3, s: 0 });
    // De 3 à −3 rad : on passe par π (≈ 3,14), pas par 0.
    expect(Math.abs(samplePose(track, 50 + INTERP_DELAY_MS)!.h)).toBeGreaterThan(3);
  });
});

describe('horloge d’un invité', () => {
  it('rattrape l’hôte, l’attend, mais n’est pas bloqué par sa cinématique au-delà d’une heure', () => {
    expect(guestClockSpeed(10, 30, false, 1)).toBe(900);
    expect(guestClockSpeed(28, 30, false, 1)).toBe(90);
    expect(guestClockSpeed(30, 30, false, 1)).toBe(0);
    expect(guestClockSpeed(30, 30, true, 1)).toBe(1);
    expect(guestClockSpeed(30 + HOST_BUSY_SLACK, 30, true, 1)).toBe(0);
  });
});

describe('textes à la française', () => {
  it('montants et élisions', () => {
    expect(euros(100)).toBe('100 €');
    expect(euros(12.5)).toBe('12,50 €');
    expect(deNom('Alex')).toBe('d’Alex');
    expect(deNom('Bilal')).toBe('de Bilal');
  });
  it('la tenue complète (v26) passe le réseau, les valeurs hostiles non', () => {
    const a = cleanAppearance({ ...DEFAULT_PLAYER_APPEARANCE, model: 'L019_jeune', bottomColor: 'noir', shoesColor: 'blanc', gear: ['casquette', 'casquette', '<b>'], gearColors: { casquette: 'coral', x: 'noir' } });
    expect(a.model).toBe('L019_jeune');
    expect(a.bottomColor).toBe('noir');
    expect(a.shoesColor).toBe('blanc');
    expect(a.gear).toEqual(['casquette']);
    expect(a.gearColors).toEqual({ casquette: 'coral' });
    expect(cleanAppearance({ model: '../../x<script>' }).model).toBeUndefined();
  });
});

// ---------- Rencontre par le réseau (vrai relais) ----------

let server: Server;
let relay: ReturnType<typeof attachRelay>;
let port = 0;

beforeAll(async () => {
  server = createServer((_q, r) => r.end('ok'));
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

interface Player { w: WorldState; s: MultiplayerSession; pose: { x: number; z: number; heading: number; speed: number }; busy: boolean; saves: number; stop(): void }

let idn = 0;
function player(name: string, addr: string, seed: number, appearance: PlayerAppearance, model?: string): Player {
  const w = createWorld({ seed });
  w.player.firstName = name;
  w.player.money = 1000;
  const store = new Map<string, string>();
  const p: Player = { w, s: null as unknown as MultiplayerSession, pose: { x: 100, z: 200, heading: 0, speed: 0 }, busy: false, saves: 0, stop: () => {} };
  p.s = new MultiplayerSession(w, {
    notify: () => {}, skip: () => {}, paceRequest: () => {}, changed: () => {},
    me: () => ({ appearance, heightM: 1.5, model }),
    persist: () => { p.saves += 1; },
  }, { storage: { get: (k) => store.get(k) ?? '', set: (k, v) => { store.set(k, v); } }, newId: () => `r${++idn}` });
  p.s.connect(addr, 'libre');
  const timer = setInterval(() => p.s.update(performance.now(), p.pose, false, 'lent', p.busy), 30);
  p.stop = () => { clearInterval(timer); p.s.disconnect(); };
  return p;
}

describe('deux joueurs se rencontrent (relais réel)', () => {
  it('chacun voit l’autre avec sa tenue, son modèle, son mouvement et son état occupé', async () => {
    const addr = `127.0.0.1:${port}/net?room=rencontre`;
    const tenue: PlayerAppearance = { ...DEFAULT_PLAYER_APPEARANCE, model: 'dessin', bottomColor: 'noir', gear: ['casquette'] };
    const A = player('Alex', addr, 1, DEFAULT_PLAYER_APPEARANCE, 'L019_jeune');
    const B = player('Bilal', addr, 2, tenue);
    try {
      await until(() => A.s.remotes.size === 1 && B.s.remotes.size === 1 && B.s.hostTick !== null);
      const alexVuParBilal = [...B.s.remotes.values()][0]!;
      expect(alexVuParBilal.model).toBe('L019_jeune');
      const bilalVuParAlex = [...A.s.remotes.values()][0]!;
      expect(bilalVuParAlex.appearance.gear).toEqual(['casquette']);
      expect(bilalVuParAlex.appearance.bottomColor).toBe('noir');

      // Bilal marche : Alex le voit avancer sans à-coups (positions intermédiaires, pas de recul).
      B.pose = { x: 100, z: 200, heading: 0, speed: 2 };
      const xs: number[] = [];
      const t0 = Date.now();
      while (Date.now() - t0 < 900) {
        B.pose = { ...B.pose, x: 100 + (Date.now() - t0) / 100 };
        const seen = A.s.visibleRemotes()[0];
        if (seen) xs.push(seen.x);
        await new Promise((r) => setTimeout(r, 16));
      }
      const moved = xs.filter((x, i) => i > 0 && x > xs[i - 1]! + 1e-6).length;
      expect(moved).toBeGreaterThan(20); // bien plus que les ≈ 9 poses reçues : c'est lissé
      // Jamais de recul visible (une légère correction après une courte extrapolation est tolérée).
      expect(Math.min(...xs.slice(1).map((x, i) => x - xs[i]!))).toBeGreaterThan(-0.2);
      expect(Math.max(...xs.slice(1).map((x, i) => x - xs[i]!))).toBeLessThan(1.5);

      // Alex (l'hôte) ouvre une fenêtre : Bilal voit 💬 et son horloge n'est pas bloquée.
      expect(B.s.clockSpeed(A.w.time.tick, 1)).toBe(0);
      A.busy = true;
      await until(() => [...B.s.remotes.values()][0]!.busy);
      expect(B.s.hostBusy).toBe(true);
      expect(B.s.clockSpeed(A.w.time.tick, 1)).toBe(1);
      A.busy = false;
      await until(() => !B.s.hostBusy);

      // Prêt de 100 € accepté : arrivé chez Bilal, et enregistré aussitôt des deux côtés.
      const savesA = A.saves;
      const savesB = B.saves;
      expect(actOn(A.w, 'libre', 'pret', B.w.multiplayer!.selfId, { amount: 100, rate: 0.1 }).ok).toBe(true);
      await until(() => B.w.multiplayer!.offers.length === 1);
      // Une deuxième proposition de prêt serait ignorée chez Bilal : elle est refusée dès le départ.
      A.w.multiplayer!.cooldowns = {};
      const again = actOn(A.w, 'libre', 'pret', B.w.multiplayer!.selfId, { amount: 50, rate: 0 });
      expect(again.ok).toBe(false);
      expect(again.message).toBe('Ta proposition attend encore la réponse de Bilal.');
      respondToOffer(B.w, B.w.multiplayer!.offers[0]!.id, true);
      await until(() => B.w.player.money === 1100 && A.w.multiplayer!.debts.length === 1);
      expect(B.saves).toBeGreaterThan(savesB);
      expect(A.saves).toBeGreaterThan(savesA);

      // Présentation perdue (chargement, reconnexion) : on l'entend sans le connaître, on se
      // représente, il répond, et il réapparaît sans que personne ne recharge.
      A.s.remotes.clear();
      await until(() => A.s.remotes.size === 1 && A.s.visibleRemotes().length === 1);
      expect([...A.s.remotes.values()][0]!.name).toBe('Bilal');
    } finally {
      A.stop();
      B.stop();
    }
  }, 15000);
});
