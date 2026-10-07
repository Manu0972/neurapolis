/**
 * Multijoueur (mondes parallèles reliés) : deux mondes échangent leurs événements sans réseau.
 * Prêts, coentreprise, achats groupés, entente (et son amende), formation, garant, sabotages
 * (découverte, protection par la réputation), commerces de l'autre joueur, sauvegarde v24.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import {
  actBlocker, actOn, ensureMultiplayer, multiDemand, multiSupplierDelta, peerShopAt, publicProfile, receiveMultiEvent, respondToOffer, sharedRand, upsertPeer,
} from '../src/simulation/multiplayer';
import { leaseEligibility, signLease } from '../src/simulation/economy';
import { econAge } from '../src/simulation/proxy';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';
import { CITY } from '../src/data/map';

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

/** Livre tous les événements en attente de `from` vers `to`. */
function deliver(from: WorldState, to: WorldState): number {
  const box = from.multiplayer!.outbox.splice(0);
  for (const ev of box) receiveMultiEvent(to, ev);
  return box.length;
}

function exchange(a: WorldState, b: WorldState): void {
  for (let i = 0; i < 4; i++) if (deliver(a, b) + deliver(b, a) === 0) break;
}

describe('multijoueur : coopération', () => {
  it('prêt : séquestre, acceptation, remboursement avec intérêts à l’échéance', () => {
    const [a, b] = pair();
    expect(actOn(a, 'libre', 'pret', 'B', { amount: 200, rate: 0.1 }).ok).toBe(true);
    expect(a.player.money).toBe(800);
    deliver(a, b);
    const offer = b.multiplayer!.offers[0]!;
    expect(offer.amount).toBe(200);
    respondToOffer(b, offer.id, true);
    expect(b.player.money).toBe(1200);
    expect(b.multiplayer!.debts[0]).toMatchObject({ side: 'owe', amount: 220 });
    exchange(a, b);
    expect(a.multiplayer!.debts[0]).toMatchObject({ side: 'owed', amount: 220 });
    runTicks(b, 15 * TICKS_PER_DAY);
    exchange(a, b);
    expect(b.multiplayer!.debts).toHaveLength(0);
    expect(a.player.money).toBe(1020);
    expect(a.multiplayer!.debts).toHaveLength(0);
  });

  it('un prêt refusé revient à son prêteur', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 150 });
    deliver(a, b);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, false);
    deliver(b, a);
    expect(a.player.money).toBe(1000);
  });

  it('achats groupés : −8 % chez les grossistes pour les deux', () => {
    const [a, b] = pair();
    actOn(a, 'cooperation', 'achats_groupes', 'B');
    deliver(a, b);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    deliver(b, a);
    expect(multiSupplierDelta(a)).toBeCloseTo(-0.08);
    expect(multiSupplierDelta(b)).toBeCloseTo(-0.08);
  });

  it('recommandation et formation : la demande monte, un concept passe d’un carnet à l’autre', () => {
    const [a, b] = pair();
    a.ascension!.concepts['marge'] = 0;
    actOn(a, 'libre', 'recommandation', 'B');
    actOn(a, 'libre', 'formation', 'B', { concept: 'marge' });
    deliver(a, b);
    expect(multiDemand(b)).toBeCloseTo(1.15);
    expect(b.ascension!.concepts['marge']).toBeDefined();
  });

  it('garant mutuel : seul qui peut signer propose ; l’autre signe alors en adulte', () => {
    const [a, b] = pair();
    expect(actBlocker(a, 'libre', 'garant_mutuel', 'B')).toContain('18 ans');
    a.economy!.sandbox = true;
    actOn(a, 'libre', 'garant_mutuel', 'B');
    deliver(a, b);
    expect(econAge(b)).toBe(12);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    expect(econAge(b)).toBe(18);
  });
});

describe('multijoueur : zone grise et sabotage', () => {
  it('entente : +12 % de demande, et le contrôle tombe le même jour dans les deux mondes', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'entente_prix', 'B');
    deliver(a, b);
    respondToOffer(b, b.multiplayer!.offers[0]!.id, true);
    deliver(b, a);
    expect(multiDemand(a)).toBeCloseTo(1.12);
    expect(multiDemand(b)).toBeCloseTo(1.12);
    let fineA = -1;
    let fineB = -1;
    for (let d = 1; d <= 10; d++) {
      const ma = a.player.money;
      const mb = b.player.money;
      runTicks(a, TICKS_PER_DAY);
      runTicks(b, TICKS_PER_DAY);
      if (fineA < 0 && a.player.money < ma - 250) fineA = d;
      if (fineB < 0 && b.player.money < mb - 250) fineB = d;
    }
    expect(fineA).toBe(fineB);
  });

  it('guerre des prix : la demande de la cible chute, la cible découvre le coupable', () => {
    const [a, b] = pair();
    expect(actOn(a, 'libre', 'guerre_des_prix', 'B').ok).toBe(true);
    expect(a.player.money).toBe(880);
    deliver(a, b);
    expect(multiDemand(b)).toBeCloseTo(0.85);
    expect(b.multiplayer!.peers['A']!.trust).toBe(-25);
    const repA = a.player.reputation;
    deliver(b, a);
    expect(a.player.reputation).toBe(repA - 4);
  });

  it('une bonne réputation (70+) amortit les coups ; un seul sabotage par jour', () => {
    const [a, b] = pair();
    b.player.reputation = 80;
    actOn(a, 'libre', 'rumeur', 'B');
    deliver(a, b);
    expect(b.player.reputation).toBe(77);
    expect(actBlocker(a, 'libre', 'rachat_fournisseur', 'B')).toContain('Un seul sabotage');
  });

  it('débauchage : un employé payé au SMIC part', () => {
    const [a, b] = pair();
    b.economy!.employees['e1'] = { id: 'e1', name: 'Paul', age: 30, role: 'vendeur', skill: 50, wage: 10.15, satisfaction: 60, businessId: 'x', hiredDay: 0 } as never;
    actOn(a, 'libre', 'debauchage', 'B');
    deliver(a, b);
    expect(b.economy!.employees['e1']).toBeUndefined();
    deliver(b, a);
    expect(a.multiplayer!.log.length).toBeGreaterThan(0);
  });

  it('les modes filtrent : pas de sabotage en coopération, pas de coopération en rivalité', () => {
    const [a] = pair();
    expect(actBlocker(a, 'cooperation', 'rumeur', 'B')).toContain('mode');
    expect(actBlocker(a, 'rivalite', 'pret', 'B', { amount: 50 })).toContain('mode');
  });

  it('le tirage partagé est le même partout', () => {
    expect(sharedRand('A|B', 'controle', 12)).toBe(sharedRand('A|B', 'controle', 12));
  });
});

describe('multijoueur : la ville partagée', () => {
  it('un local loué par l’autre joueur n’est plus à louer chez toi', () => {
    const [a, b] = pair();
    a.player.age = 18;
    const unit = CITY.units.find((u) => u.id.startsWith('local_') && leaseEligibility(a, u.id).allowed)!;
    expect(signLease(a, unit.id).ok).toBe(true);
    a.economy!.businesses['b1'] = { id: 'b1', name: 'Chez Alex', typeId: 't_epicerie_quartier', unitId: unit.id, history: [] } as never;
    upsertPeer(b, publicProfile(a));
    expect(peerShopAt(b, unit.id)?.peer.name).toBe('Alex');
    b.player.age = 18;
    expect(leaseEligibility(b, unit.id).allowed).toBe(false);
  });

  it('sauvegarde v24 : l’état multijoueur fait l’aller-retour ; une v23 solo migre sans état', () => {
    const [a, b] = pair();
    actOn(a, 'libre', 'pret', 'B', { amount: 100 });
    const back = importSave(exportSave(a));
    expect(back.version).toBe(CURRENT_SAVE_VERSION);
    expect(CURRENT_SAVE_VERSION).toBe(24);
    expect(back.multiplayer!.outbox).toHaveLength(1);
    expect(back.multiplayer!.peers['B']!.name).toBe('Bilal');
    const old = JSON.parse(exportSave(b));
    old.version = 23;
    delete old.multiplayer;
    expect(migrateSave(old).multiplayer).toBeUndefined();
    const partial = JSON.parse(exportSave(b));
    partial.version = 23;
    partial.multiplayer = { selfId: 'B', peers: {} };
    const m = migrateSave(partial).multiplayer!;
    expect(m.outbox).toEqual([]);
    expect(m.selfId).toBe('B');
  });
});
