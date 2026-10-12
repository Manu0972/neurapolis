/**
 * Multijoueur : un autre joueur ne peut pas corrompre ton monde. Réponses inventées, montants
 * absurdes (NaN, négatifs, géants), coups interdits par le mode, rafales de sabotages, propositions
 * en masse, accords expirés… Et l'argent se conserve : ce qui sort d'un monde entre dans l'autre.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import type { MultiEvent } from '../src/core/multiplayer_types';
import { runTicks } from '../src/simulation/engine';
import {
  MULTI_LIMITS, acknowledgeEvents, actOn, ensureMultiplayer, multiDemand, multiSupplierDelta, publicProfile, receiveMultiEvent, respondToOffer, upsertPeer,
} from '../src/simulation/multiplayer';

function pair(): [WorldState, WorldState] {
  const a = createWorld({ seed: 11 });
  const b = createWorld({ seed: 22 });
  a.player.firstName = 'Alex';
  b.player.firstName = 'Bilal';
  ensureMultiplayer(a, 'A');
  ensureMultiplayer(b, 'B');
  upsertPeer(a, publicProfile(b));
  upsertPeer(b, publicProfile(a));
  a.player.money = 1000;
  b.player.money = 1000;
  return [a, b];
}

function deliver(from: WorldState, to: WorldState): number {
  const box = from.multiplayer!.outbox.splice(0);
  for (const ev of box) receiveMultiEvent(to, ev);
  return box.length;
}
function exchange(a: WorldState, b: WorldState): void {
  for (let i = 0; i < 6; i++) if (deliver(a, b) + deliver(b, a) === 0) break;
}

let n = 0;
/** Événement fabriqué par un pair hostile (« B » qui triche, vers « A »). */
function forged(p: Partial<MultiEvent>): MultiEvent {
  n += 1;
  return { id: `B:x${n}`, from: 'B', fromName: 'Bilal', to: 'A', day: 0, mechanic: 'pret', phase: 'act', ...p } as MultiEvent;
}

describe('multijoueur hostile : l’argent ne s’invente pas', () => {
  it('un remboursement ou un refus de prêt inventé ne crée ni ne prend d’argent', () => {
    const [a] = pair();
    receiveMultiEvent(a, forged({ phase: 'settle', amount: 1e6, ref: 'A:1' }));
    receiveMultiEvent(a, forged({ phase: 'reply', accepted: false, amount: 5000, ref: 'A:1' }));
    receiveMultiEvent(a, forged({ phase: 'settle', mechanic: 'coentreprise', amount: 1e6 }));
    receiveMultiEvent(a, forged({ phase: 'settle', amount: -800, ref: 'A:1' }));
    receiveMultiEvent(a, forged({ phase: 'settle', amount: Number.NaN, ref: 'A:1' }));
    expect(a.player.money).toBe(1000);
    expect(a.multiplayer!.debts).toEqual([]);
  });

  it('une acceptation inventée n’impose aucun accord (pas de partage des bénéfices forcé)', () => {
    const [a] = pair();
    receiveMultiEvent(a, forged({ phase: 'reply', mechanic: 'coentreprise', accepted: true, ref: 'A:99' }));
    receiveMultiEvent(a, forged({ phase: 'confirm', mechanic: 'coentreprise', accepted: true, ref: 'A:98' }));
    expect(a.multiplayer!.effects).toEqual([]);
    // On prévient seulement le tricheur que « sa » proposition n'existe pas.
    expect(a.multiplayer!.outbox.map((e) => e.phase)).toEqual(['confirm']);
    expect(a.multiplayer!.outbox[0]!.accepted).toBe(false);
  });

  it('un remboursement ne dépasse jamais la dette réelle', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 100, rate: 0.1 });
    deliver(a, b);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    exchange(a, b);
    const debt = a.multiplayer!.debts[0]!;
    expect(debt.amount).toBe(110);
    receiveMultiEvent(a, forged({ phase: 'settle', amount: 10000, ref: debt.id }));
    expect(a.player.money).toBe(1010);
    expect(a.multiplayer!.debts).toEqual([]);
    receiveMultiEvent(a, forged({ phase: 'settle', amount: 10000, ref: debt.id }));
    expect(a.player.money).toBe(1010);
  });

  it('propositions de prêt absurdes ignorées ; trois propositions au plus par joueur', () => {
    const [a] = pair();
    for (const amount of [-50, 0, 5, Number.NaN, Number.POSITIVE_INFINITY, 1e9]) receiveMultiEvent(a, forged({ phase: 'offer', amount, rate: 0 }));
    expect(a.multiplayer!.offers).toEqual([]);
    receiveMultiEvent(a, forged({ phase: 'offer', amount: 100, rate: 5 }));
    expect(a.multiplayer!.offers[0]).toMatchObject({ amount: 100, rate: MULTI_LIMITS.loanRateMax, days: MULTI_LIMITS.loanDays });
    receiveMultiEvent(a, forged({ phase: 'offer', amount: 100 }));
    for (const mechanic of ['coentreprise', 'achats_groupes', 'entente_prix', 'garant_mutuel'] as const) receiveMultiEvent(a, forged({ phase: 'offer', mechanic, days: 9999 }));
    expect(a.multiplayer!.offers).toHaveLength(MULTI_LIMITS.offersPerPeer);
    expect(a.multiplayer!.offers.every((o) => o.days <= 14)).toBe(true);
  });

  it('les comptes de l’argent : un prêt accepté puis remboursé, rien ne se perd ni ne se crée', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 300, rate: 0.05 });
    deliver(a, b);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    exchange(a, b);
    expect(a.player.money + b.player.money).toBe(2000);
    b.player.money += 100; // B gagne de quoi payer les intérêts
    runTicks(b, 15 * TICKS_PER_DAY);
    const before = b.player.money;
    exchange(a, b);
    expect(a.player.money).toBeCloseTo(700 + 315, 2);
    expect(before).toBeLessThan(2000);
  });
});

describe('multijoueur hostile : les règles et les délais tiennent côté cible', () => {
  it('un sabotage reçu dans une partie en coopération est ignoré', () => {
    const [a] = pair();
    const rep = a.player.reputation;
    expect(receiveMultiEvent(a, forged({ mechanic: 'rumeur' }), 'cooperation')).toEqual([]);
    expect(a.player.reputation).toBe(rep);
    expect(multiDemand(a)).toBe(1);
    // Et une coopération dans une partie en rivalité.
    receiveMultiEvent(a, forged({ mechanic: 'recommandation' }), 'rivalite');
    expect(multiDemand(a)).toBe(1);
  });

  it('une rafale de sabotages ne passe pas : au plus deux le même jour, délai de la mécanique respecté', () => {
    const [a] = pair();
    a.player.reputation = 50;
    for (let i = 0; i < 50; i++) receiveMultiEvent(a, forged({ mechanic: 'rumeur' }), 'libre');
    expect(a.player.reputation).toBe(44);
    for (let i = 0; i < 50; i++) receiveMultiEvent(a, forged({ mechanic: 'guerre_des_prix' }), 'libre');
    expect(multiDemand(a)).toBeCloseTo(0.92 * 0.85);
    for (let i = 0; i < 50; i++) receiveMultiEvent(a, forged({ mechanic: 'rachat_fournisseur' }), 'libre');
    expect(multiSupplierDelta(a)).toBe(0);
  });

  it('une « découverte » ou un rapport d’espionnage inventés ne coûtent rien', () => {
    const [a] = pair();
    const rep = a.player.reputation;
    for (let i = 0; i < 20; i++) receiveMultiEvent(a, forged({ mechanic: 'rumeur', phase: 'reply', discovered: true, ref: `A:${i}` }));
    receiveMultiEvent(a, forged({ mechanic: 'espionnage', phase: 'reply', report: 'faux', ref: 'A:3' }));
    expect(a.player.reputation).toBe(rep);
    expect(a.multiplayer!.log).toEqual([]);
  });

  it('un événement d’un inconnu, ou qui prétend venir de toi, est ignoré', () => {
    const [a] = pair();
    expect(receiveMultiEvent(a, forged({ from: 'Z', mechanic: 'rumeur' }))).toEqual([]);
    expect(receiveMultiEvent(a, forged({ from: 'A', mechanic: 'rumeur' }))).toEqual([]);
    expect(a.multiplayer!.seen).toEqual([]);
  });

  it('un profil hostile est ramené à des valeurs possibles', () => {
    const [a] = pair();
    upsertPeer(a, { id: 'B', name: 'x'.repeat(500), age: 1e9, reputation: -50, tier: 99, shops: [
      { unitId: 'inexistant', name: 'Faux', categories: ['alimentaire'], strength: 50 },
      ...Array.from({ length: 40 }, () => ({ unitId: 'local_1', name: 'Doublon', categories: ['n_importe_quoi'], strength: 9 })),
    ] } as never);
    const p = a.multiplayer!.peers['B']!;
    expect(p.name.length).toBeLessThanOrEqual(24);
    expect(p.age).toBe(99);
    expect(p.reputation).toBe(0);
    expect(p.tier).toBe(6);
    expect(p.shops.length).toBeLessThanOrEqual(1);
    for (const s of p.shops) { expect(s.strength).toBeLessThanOrEqual(1.3); expect(s.categories).toEqual([]); }
  });
});

describe('multijoueur : accords qui se croisent avec le temps', () => {
  it('une proposition sans réponse expire et l’argent du prêt revient', () => {
    const [a] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 200 });
    expect(a.player.money).toBe(800);
    const money = a.player.money;
    runTicks(a, (MULTI_LIMITS.offerExpiryDays + 1) * TICKS_PER_DAY);
    expect(a.multiplayer!.sent).toEqual([]);
    expect(a.player.money).toBeGreaterThanOrEqual(money + 200 - 50); // le quotidien coûte un peu
  });

  it('accepter une proposition expirée ne crée pas d’argent : le prêteur répond « expiré »', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 200 });
    deliver(a, b);
    a.multiplayer!.sent = []; // la proposition a expiré chez A (l'argent lui est revenu)
    a.player.money = 1000;
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    exchange(a, b);
    expect(a.player.money).toBe(1000);
    expect(b.player.money).toBe(1000);
    expect(b.multiplayer!.debts).toEqual([]);
    expect(b.multiplayer!.sent).toEqual([]);
    expect(b.multiplayer!.log[0]!.text).toContain('expirée');
  });

  it('un événement livré deux fois (renvoi après coupure) ne compte qu’une fois ; l’accusé vide la boîte d’envoi', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'recommandation', 'B');
    const ev = a.multiplayer!.outbox[0]!;
    receiveMultiEvent(b, ev);
    receiveMultiEvent(b, ev);
    expect(multiDemand(b)).toBeCloseTo(1.15);
    expect(acknowledgeEvents(a, 'C', [ev.id])).toBe(0);
    expect(acknowledgeEvents(a, 'B', [ev.id])).toBe(1);
    expect(a.multiplayer!.outbox).toEqual([]);
  });
});
