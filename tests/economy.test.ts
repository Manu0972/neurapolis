/**
 * Économie « Big Ambitions » : baux, commerces, logistique physique, clients, employés, banque.
 * Les parcours suivent ce qu'un joueur fait vraiment : louer, aller chercher les cartons, ouvrir…
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import {
  UNIT_BY_ID, buyFurniture, economyDay, ensureEconomy, hire, leaseEligibility, listUnits, loanOffer, openBusiness,
  orderStock, pickUpOrder, pickupPoint, readiness, refreshJobMarket, setOpen, setPrice, signLease, stockUnits,
  takeLoan, transferCash, unloadAt, endLease,
} from '../src/simulation/economy';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';
import { minutesOfDay } from '../src/core/clock';

const STALL = 'etal_1';
const SHOP = (): string => listUnits(createWorld()).find((l) => l.unit.street === 'Avenue Jean-Jaurès')!.unit.id;

/** Avance jusqu'à une heure donnée (dans la journée en cours ou la suivante). */
function advanceTo(w: WorldState, hour: number): void {
  let guard = 0;
  while (Math.floor(minutesOfDay(w.time.tick) / 60) !== hour && guard++ < TICKS_PER_DAY) runTicks(w, 1);
}

/** Étal prêt à vendre : bail, commerce, cartons achetés chez Bertin, retirés et déposés. */
function stallReady(seed = 7): { w: WorldState; biz: string } {
  const w = createWorld({ seed });
  w.player.money = 200;
  expect(signLease(w, STALL).ok).toBe(true);
  expect(openBusiness(w, STALL, 't_etal_marche', 'Les Goûters de Camille').ok).toBe(true);
  const biz = Object.keys(w.economy!.businesses)[0]!;
  expect(transferCash(w, biz, 80).ok).toBe(true);
  const order = orderStock(w, biz, 'g_bertin_depannage', [
    { productId: 'p_gouter_biscuits', qty: 15 }, { productId: 'p_jus_pomme', qty: 10 }, { productId: 'p_pomme', qty: 15 },
  ]);
  expect(order.ok, order.message).toBe(true);
  const orderId = w.economy!.orders[0]!.id;
  w.player.pos = { ...pickupPoint('g_bertin_depannage')! };
  expect(pickUpOrder(w, orderId).ok).toBe(true);
  w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
  expect(unloadAt(w, biz).ok).toBe(true);
  return { w, biz };
}

describe('immobilier commercial', () => {
  it('liste plus de 20 locaux avec loyer et dépôt', () => {
    const w = createWorld();
    const units = listUnits(w);
    expect(units.length).toBeGreaterThan(20);
    for (const l of units) {
      expect(l.status).toBe('libre');
      expect(l.deposit).toBeCloseTo(l.rentPerDay * 7, 1);
    }
  });

  it('à 12 ans : l’étal avec l’accord des parents, pas encore un vrai local', () => {
    const w = createWorld();
    expect(leaseEligibility(w, STALL)).toMatchObject({ allowed: true, coSigner: 'parent' });
    const shop = leaseEligibility(w, SHOP());
    expect(shop.allowed).toBe(false);
    expect(shop.reason).toMatch(/preuves/);
  });

  it('le bac à sable et la majorité débloquent tout', () => {
    expect(leaseEligibility(createWorld({ sandbox: true }), SHOP()).allowed).toBe(true);
    const adult = createWorld();
    adult.player.age = 19;
    expect(leaseEligibility(adult, SHOP())).toMatchObject({ allowed: true, coSigner: null });
  });

  it('le dépôt de garantie est prélevé, et refusé sans argent', () => {
    const w = createWorld();
    w.player.money = 1;
    expect(signLease(w, STALL).ok).toBe(false);
    w.player.money = 100;
    const rent = listUnits(w).find((l) => l.unit.id === STALL)!.rentPerDay;
    expect(signLease(w, STALL).ok).toBe(true);
    expect(w.player.money).toBeCloseTo(100 - rent * 7, 2);
  });
});

describe('logistique physique (pas de stock téléporté)', () => {
  it('il faut aller chez le fournisseur, puis devant sa boutique', () => {
    const w = createWorld();
    w.player.money = 200;
    signLease(w, STALL);
    openBusiness(w, STALL, 't_etal_marche', 'Test');
    const biz = Object.keys(w.economy!.businesses)[0]!;
    transferCash(w, biz, 50);
    expect(orderStock(w, biz, 'g_bertin_depannage', [{ productId: 'p_gouter_biscuits', qty: 10 }]).ok).toBe(true);
    const id = w.economy!.orders[0]!.id;
    // Loin du fournisseur : refusé.
    w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
    expect(pickUpOrder(w, id).ok).toBe(false);
    w.player.pos = { ...pickupPoint('g_bertin_depannage')! };
    expect(pickUpOrder(w, id).ok).toBe(true);
    expect(w.economy!.carried.reduce((s, c) => s + c.qty, 0)).toBe(10);
    // Loin de la boutique : refusé.
    expect(unloadAt(w, biz).ok).toBe(false);
    w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
    expect(unloadAt(w, biz).ok).toBe(true);
    expect(stockUnits(w.economy!.businesses[biz]!)).toBe(10);
    expect(w.economy!.carried).toEqual([]);
  });

  it('les bras ont une capacité limitée : plusieurs voyages', () => {
    const w = createWorld({ sandbox: true });
    w.player.money = 2000;
    signLease(w, SHOP());
    const unit = SHOP();
    openBusiness(w, unit, 't_epicerie_quartier', 'Épicerie');
    const biz = Object.keys(w.economy!.businesses)[0]!;
    transferCash(w, biz, 1500);
    buyFurniture(w, biz, 'f_rayonnage');
    expect(orderStock(w, biz, 'g_cash_hyperval', [{ productId: 'p_pates', qty: 60 }, { productId: 'p_riz', qty: 45 }]).ok).toBe(true);
    const id = w.economy!.orders[0]!.id;
    w.player.pos = { ...pickupPoint('g_cash_hyperval')! };
    const first = pickUpOrder(w, id);
    expect(first.ok).toBe(true);
    expect(first.message).toMatch(/reste/);
    expect(w.economy!.carried.reduce((s, c) => s + c.qty, 0)).toBe(40);
  });

  it('un grossiste livre le jour prévu (selon sa fiabilité)', () => {
    const w = createWorld({ sandbox: true });
    w.player.money = 3000;
    const unit = SHOP();
    signLease(w, unit);
    openBusiness(w, unit, 't_epicerie_quartier', 'Épicerie');
    const biz = Object.keys(w.economy!.businesses)[0]!;
    transferCash(w, biz, 2000);
    buyFurniture(w, biz, 'f_rayonnage');
    buyFurniture(w, biz, 'f_reserve');
    expect(orderStock(w, biz, 'g_docks_canal', [{ productId: 'p_pates', qty: 210 }, { productId: 'p_conserve', qty: 140 }]).ok).toBe(true);
    runTicks(w, TICKS_PER_DAY * 4);
    expect(stockUnits(w.economy!.businesses[biz]!)).toBeGreaterThan(0);
    expect(w.economy!.orders).toEqual([]);
  });
});

describe('ventes heure par heure', () => {
  it('l’étal vend quand le joueur est présent, pas quand il est absent', () => {
    const { w, biz } = stallReady();
    const b = w.economy!.businesses[biz]!;
    expect(readiness(b).ready).toBe(true);
    expect(setOpen(w, biz, true).ok).toBe(true);
    // Absent (à la maison) de 8 h à 11 h : aucune vente.
    w.player.pos = { x: 39, y: 95 };
    advanceTo(w, 8);
    advanceTo(w, 11);
    expect(b.today.revenue).toBe(0);
    // Présent derrière l'étal.
    w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
    advanceTo(w, 13);
    expect(b.today.customers).toBeGreaterThan(0);
    expect(b.today.revenue).toBeGreaterThan(0);
    expect(w.flags['ventesEtal']).toBeGreaterThan(0);
  });

  it('des prix abusifs font fuir les clients', () => {
    const run = (mult: number): number => {
      const { w, biz } = stallReady(11);
      const b = w.economy!.businesses[biz]!;
      for (const pid of Object.keys(b.stock)) setPrice(w, biz, pid, (b.prices[pid] ?? 1) * mult);
      setOpen(w, biz, true);
      w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
      advanceTo(w, 8);
      advanceTo(w, 13);
      return b.today.customers;
    };
    expect(run(1)).toBeGreaterThan(run(3));
  });

  it('le loyer est payé chaque nuit ; trois impayés entraînent l’expulsion', () => {
    const { w, biz } = stallReady();
    const b = w.economy!.businesses[biz]!;
    const rent = w.economy!.leases[STALL]!.rentPerDay;
    const cash0 = b.cash;
    economyDay(w, 0);
    expect(b.cash).toBeCloseTo(cash0 - rent, 2);
    // Caisse et poche vides : impayés.
    b.cash = 0;
    w.player.money = 0;
    economyDay(w, 1);
    economyDay(w, 2);
    economyDay(w, 3);
    expect(w.economy!.leases[STALL]).toBeUndefined();
    expect(w.economy!.businesses[biz]).toBeUndefined();
  });

  it('les produits frais périment', () => {
    const { w, biz } = stallReady();
    const b = w.economy!.businesses[biz]!;
    const pommes = stockUnits(b, 'p_pomme');
    expect(pommes).toBeGreaterThan(0);
    for (let d = 0; d < 13; d++) economyDay(w, d);
    expect(stockUnits(b, 'p_pomme')).toBe(0);
    expect(stockUnits(b, 'p_gouter_biscuits')).toBe(0); // 10 jours de conservation
  });

  it('même graine, mêmes actions : mêmes ventes (déterminisme)', () => {
    const play = (): number => {
      const { w, biz } = stallReady(5);
      setOpen(w, biz, true);
      w.player.pos = { ...UNIT_BY_ID[STALL]!.door };
      advanceTo(w, 8);
      advanceTo(w, 13);
      return w.economy!.businesses[biz]!.today.revenue;
    };
    expect(play()).toBe(play());
  });

  it('l’économie ne décale pas le PRNG partagé du monde', () => {
    const a = createWorld({ seed: 99 });
    const { w: b } = stallReady(99);
    b.time.tick = a.time.tick;
    runTicks(a, 50);
    const rngBefore = b.rng;
    void rngBefore;
    runTicks(b, 50);
    expect(b.district.meteo).toBe(a.district.meteo);
  });
});

describe('équipe et banque', () => {
  it('un employé fait tourner la boutique en l’absence du joueur, et coûte son salaire', () => {
    const w = createWorld({ sandbox: true });
    w.player.money = 5000;
    const unit = SHOP();
    signLease(w, unit);
    openBusiness(w, unit, 't_epicerie_quartier', 'Épicerie Jaurès');
    const biz = Object.keys(w.economy!.businesses)[0]!;
    transferCash(w, biz, 3000);
    buyFurniture(w, biz, 'f_rayonnage');
    buyFurniture(w, biz, 'f_caisse');
    const b = w.economy!.businesses[biz]!;
    b.stock = { p_pates: [{ qty: 100, receivedDay: 0, unitCost: 0.5 }], p_riz: [{ qty: 60, receivedDay: 0, unitCost: 0.8 }], p_conserve: [{ qty: 60, receivedDay: 0, unitCost: 0.5 }] };
    refreshJobMarket(w);
    const cand = w.economy!.jobMarket.candidateIds[0]!;
    expect(hire(w, cand, biz).ok).toBe(true);
    expect(setOpen(w, biz, true).ok).toBe(true);
    w.player.pos = { x: 39, y: 95 }; // le joueur est ailleurs
    advanceTo(w, 9);
    advanceTo(w, 13);
    expect(b.today.customers).toBeGreaterThan(0);
    expect(b.today.wages).toBeGreaterThan(0);
  });

  it('le site d’emploi propose 6 candidats payés au moins au SMIC', () => {
    const w = createWorld();
    refreshJobMarket(w);
    const e = ensureEconomy(w);
    expect(e.jobMarket.candidateIds).toHaveLength(6);
    for (const id of e.jobMarket.candidateIds) expect(e.employees[id]!.wage).toBeGreaterThanOrEqual(10.15);
  });

  it('prêt : plafonné pour un mineur, remboursé chaque jour', () => {
    const w = createWorld();
    const offer = loanOffer(w);
    expect(offer.max).toBeLessThanOrEqual(3000);
    expect(takeLoan(w, offer.max + 1).ok).toBe(false);
    const m0 = w.player.money;
    expect(takeLoan(w, 300, 60).ok).toBe(true);
    expect(w.player.money).toBe(m0 + 300);
    const before = w.economy!.loans[0]!.remaining;
    economyDay(w, 0);
    expect(w.economy!.loans[0]!.remaining).toBeLessThan(before);
  });

  it('rendre un local rembourse le dépôt et revend le mobilier', () => {
    const w = createWorld({ sandbox: true });
    w.player.money = 3000;
    const unit = SHOP();
    signLease(w, unit);
    openBusiness(w, unit, 't_epicerie_quartier', 'Éphémère');
    const biz = Object.keys(w.economy!.businesses)[0]!;
    transferCash(w, biz, 500);
    buyFurniture(w, biz, 'f_rayonnage');
    const before = w.player.money;
    expect(endLease(w, unit).ok).toBe(true);
    expect(w.player.money).toBeGreaterThan(before);
  });
});

describe('sauvegarde de l’économie (v13)', () => {
  it('aller-retour : bail, commerce, stock et cartons survivent', () => {
    const { w } = stallReady();
    const back = importSave(exportSave(w));
    expect(back.version).toBe(CURRENT_SAVE_VERSION);
    expect(back.economy).toEqual(w.economy);
  });

  it('une sauvegarde v12 reçoit une économie vide', () => {
    const w = createWorld();
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 12;
    delete raw.economy;
    const migrated = migrateSave(raw);
    expect(migrated.economy).toMatchObject({ sandbox: false, leases: {}, businesses: {}, carryCapacity: 40 });
  });
});
