/**
 * NEURAPOLIS — Tests Économie, Crédit Marchand & Chocs Macroéconomiques.
 * Vérification des fonctionnalités R4 :
 * - Paliers de fidélité marchande Mme Bertin (0, 1, 2, 3) et remises (0%, 5%, 12%, 20%)
 * - Lignes de crédit marchandes dynamiques par palier (0 €, 25 €, 50 €, 100 €)
 * - Emprunt (`borrowVendorCredit`) et remboursement (`repayVendorCredit`) avec traçabilité causale
 * - Achats de stock avec application des remises et report de fidélité chez Mme Bertin
 * - Repli automatique sur le crédit marchand quand la trésorerie est insuffisante
 * - Impact des chocs de conjoncture macroéconomique sur la demande
 * - Préservation stricte de l'invariant comptable du livre de comptes (ledgerInvariantHolds)
 * - Déterminisme strict PRNG (zéro Math.random, zéro Date.now)
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { type WorldState } from '../src/core/types';
import { createProject, ledgerBalance, ledgerInvariantHolds } from '../src/simulation/project';
import {
  borrowVendorCredit,
  calculateMacroAdjustedDemand,
  calculateStockPurchaseWithVendor,
  ensureVendorsState,
  executeVendorStockPurchase,
  getVendorCreditAvailable,
  getVendorCreditLineLimit,
  getVendorDiscountRate,
  getVendorRelationship,
  recordVendorTrade,
  repayVendorCredit,
} from '../src/simulation/vendors';
import { VENDOR_DEFS } from '../src/data/vendors';
import {
  getCurrentDemandModifier,
  macroNewsDayTick,
  triggerCustomMarketShock,
} from '../src/simulation/macro_news';

describe('Économie, Crédit Marchand & Chocs Macroéconomiques', () => {
  it('1. initialise l’état des marchands avec des limites de crédit et une dette à zéro', () => {
    const w = createWorld();
    const vendors = ensureVendorsState(w);

    expect(vendors.bertin).toBeDefined();
    expect(vendors.bertin.tier).toBe(0);
    expect(vendors.bertin.creditLineLimit).toBe(0);
    expect(vendors.bertin.creditBalance).toBe(0);
    expect(vendors.bertin.discountRate).toBe(0);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(0);

    const rel = getVendorRelationship(w, 'bertin');
    expect(rel.vendorId).toBe('bertin');
    expect(rel.creditLineLimit).toBe(0);
    expect(rel.creditBalance).toBe(0);
  });

  it('2. fait progresser la fidélité de Mme Bertin et applique les remises par palier (5%, 12%, 20%)', () => {
    const w = createWorld();

    // Palier 1 : 40 € dépensés & 4 transactions -> Remise 5%
    for (let i = 0; i < 4; i++) {
      recordVendorTrade(w, 'bertin', 10);
    }
    const relTier1 = getVendorRelationship(w, 'bertin');
    expect(relTier1.tier).toBe(1);
    expect(relTier1.discountRate).toBe(0.05);
    expect(getVendorDiscountRate(w, 'bertin')).toBe(0.05);

    // Palier 2 : 120 € dépensés & 10 transactions -> Remise 12%
    for (let i = 0; i < 6; i++) {
      recordVendorTrade(w, 'bertin', 15);
    }
    const relTier2 = getVendorRelationship(w, 'bertin');
    expect(relTier2.tier).toBe(2);
    expect(relTier2.discountRate).toBe(0.12);
    expect(getVendorDiscountRate(w, 'bertin')).toBe(0.12);

    // Palier 3 : 280 € dépensés & 22 transactions -> Remise 20%
    for (let i = 0; i < 12; i++) {
      recordVendorTrade(w, 'bertin', 15);
    }
    const relTier3 = getVendorRelationship(w, 'bertin');
    expect(relTier3.tier).toBe(3);
    expect(relTier3.discountRate).toBe(0.20);
    expect(getVendorDiscountRate(w, 'bertin')).toBe(0.20);
  });

  it('3. débloque dynamiquement les lignes de crédit de Mme Bertin selon le palier (25 €, 50 €, 100 €)', () => {
    const w = createWorld();
    expect(getVendorCreditLineLimit(w, 'bertin')).toBe(0);

    // Atteindre le Palier 1
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);
    expect(getVendorCreditLineLimit(w, 'bertin')).toBe(25);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(25);

    // Atteindre le Palier 2
    for (let i = 0; i < 6; i++) recordVendorTrade(w, 'bertin', 15);
    expect(getVendorCreditLineLimit(w, 'bertin')).toBe(50);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(50);

    // Atteindre le Palier 3
    for (let i = 0; i < 12; i++) recordVendorTrade(w, 'bertin', 15);
    expect(getVendorCreditLineLimit(w, 'bertin')).toBe(100);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(100);
  });

  it('4. permet d’emprunter sur la ligne de crédit avec traçabilité causale et mise à jour de la dette', () => {
    const w = createWorld();
    // Débloquer Tier 1 (25 € de crédit)
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);

    const initialMoney = w.player.money;
    const ok = borrowVendorCredit(w, 'bertin', 18.50);
    expect(ok).toBe(true);
    expect(w.player.money).toBeCloseTo(initialMoney + 18.50, 2);

    const rel = getVendorRelationship(w, 'bertin');
    expect(rel.creditBalance).toBe(18.50);
    expect(getVendorCreditAvailable(w, 'bertin')).toBeCloseTo(25 - 18.50, 2);

    // Vérifier l'événement causal consigné
    const borrowEvent = w.events.find((e) => e.id.startsWith('vendor_borrow_bertin'));
    expect(borrowEvent).toBeDefined();
    expect(borrowEvent?.title).toContain('Crédit marchand');
    expect(borrowEvent?.text).toContain('18.50 €');
    expect(borrowEvent?.causes.length).toBeGreaterThan(0);
  });

  it('5. rejette tout emprunt supérieur à la limite disponible ou de montant non valide', () => {
    const w = createWorld();
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10); // Limite 25 €

    // Emprunt négatif ou nul
    expect(borrowVendorCredit(w, 'bertin', 0)).toBe(false);
    expect(borrowVendorCredit(w, 'bertin', -5)).toBe(false);

    // Emprunt dépassant le plafond
    expect(borrowVendorCredit(w, 'bertin', 26)).toBe(false);

    // Emprunt valide puis tentative de dépassement cumulé
    expect(borrowVendorCredit(w, 'bertin', 20)).toBe(true);
    expect(borrowVendorCredit(w, 'bertin', 10)).toBe(false); // Il ne reste que 5 €
  });

  it('6. permet le remboursement partiel ou total de la dette marchand', () => {
    const w = createWorld();
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);
    borrowVendorCredit(w, 'bertin', 20);

    w.player.money = 50;
    // Remboursement partiel de 12 €
    const okPartiel = repayVendorCredit(w, 'bertin', 12);
    expect(okPartiel).toBe(true);
    expect(w.player.money).toBe(38);
    const rel = getVendorRelationship(w, 'bertin');
    expect(rel.creditBalance).toBe(8);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(17);

    // Remboursement du solde
    const okTotal = repayVendorCredit(w, 'bertin', 8);
    expect(okTotal).toBe(true);
    expect(w.player.money).toBe(30);
    expect(rel.creditBalance).toBe(0);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(25);

    // Événement causal de remboursement
    const repayEvent = w.events.find((e) => e.id.startsWith('vendor_repay_bertin'));
    expect(repayEvent).toBeDefined();
    expect(repayEvent?.title).toContain('Remboursement');
  });

  it('7. gère les cas limites du remboursement (capé à la dette, fonds joueur insuffisants, dette nulle)', () => {
    const w = createWorld();
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);
    borrowVendorCredit(w, 'bertin', 15);

    // Joueur n'a pas assez d'argent pour rembourser
    w.player.money = 5;
    expect(repayVendorCredit(w, 'bertin', 10)).toBe(false);

    // Remboursement avec montant excédant la dette réelle : doit limiter au solde dû (15 €)
    w.player.money = 50;
    const okCap = repayVendorCredit(w, 'bertin', 30);
    expect(okCap).toBe(true);
    expect(w.player.money).toBe(35); // 50 - 15 = 35
    expect(getVendorRelationship(w, 'bertin').creditBalance).toBe(0);

    // Dette déjà nulle : rejet
    expect(repayVendorCredit(w, 'bertin', 10)).toBe(false);
  });

  it('8. calcule la remise marchande sur les coûts d’achat de stock', () => {
    const w = createWorld();
    createProject(w);

    // Tier 0 : 0%
    const calc0 = calculateStockPurchaseWithVendor(w, 'bertin', 15, 20);
    expect(calc0.discountRate).toBe(0);
    expect(calc0.finalCost).toBe(15);
    expect(calc0.canAfford).toBe(true);

    // Tier 1 : 5% sur 15 € = 14.25 €
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);
    const calc1 = calculateStockPurchaseWithVendor(w, 'bertin', 15, 20);
    expect(calc1.discountRate).toBe(0.05);
    expect(calc1.finalCost).toBe(14.25);

    // Tier 2 : 12% sur 15 € = 13.20 €
    for (let i = 0; i < 6; i++) recordVendorTrade(w, 'bertin', 15);
    const calc2 = calculateStockPurchaseWithVendor(w, 'bertin', 15, 20);
    expect(calc2.discountRate).toBe(0.12);
    expect(calc2.finalCost).toBe(13.20);

    // Tier 3 : 20% sur 15 € = 12.00 €
    for (let i = 0; i < 12; i++) recordVendorTrade(w, 'bertin', 15);
    const calc3 = calculateStockPurchaseWithVendor(w, 'bertin', 15, 20);
    expect(calc3.discountRate).toBe(0.20);
    expect(calc3.finalCost).toBe(12.00);
  });

  it('9. exécute un achat de stock avec remise et enregistre l’échange chez Mme Bertin', () => {
    const w = createWorld();
    createProject(w);
    // Monter Tier 1 chez Bertin
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);

    w.player.money = 30;
    const spentBefore = getVendorRelationship(w, 'bertin').spentTotal;
    const tradesBefore = getVendorRelationship(w, 'bertin').tradeCount;

    const res = executeVendorStockPurchase(w, 'bertin', 15, 20);
    expect(res.ok).toBe(true);
    expect(res.finalCost).toBe(14.25); // 15 € - 5% = 14.25 €
    expect(w.project?.stock).toBe(20);
    expect(w.player.money).toBeCloseTo(30 - 14.25, 2);

    // La transaction a bien fait progresser la fidélité de Mme Bertin
    const relAfter = getVendorRelationship(w, 'bertin');
    expect(relAfter.spentTotal).toBeCloseTo(spentBefore + 14.25, 2);
    expect(relAfter.tradeCount).toBe(tradesBefore + 1);
  });

  it('10. active le repli automatique sur le crédit marchand lorsque la trésorerie est courte', () => {
    const w = createWorld();
    createProject(w);
    // Bertin Tier 1 (25 € de crédit dispo, remise 5% -> stock 14.25 €)
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);

    // Le joueur n'a que 4.25 € en poche et 0 € en caisse (déficit de 10 €)
    w.player.money = 4.25;
    w.project!.balance = 0;

    const res = executeVendorStockPurchase(w, 'bertin', 15, 20);
    expect(res.ok).toBe(true);
    expect(res.borrowedCredit).toBe(10);
    expect(res.finalCost).toBe(14.25);
    expect(w.project?.stock).toBe(20);

    // Le crédit marchand a absorbé les 10 € manquants
    const rel = getVendorRelationship(w, 'bertin');
    expect(rel.creditBalance).toBe(10);
    expect(getVendorCreditAvailable(w, 'bertin')).toBe(15);
    expect(w.player.money).toBe(0);
  });

  it('11. ajuste le potentiel de vente et la demande selon les chocs macroéconomiques', () => {
    const w = createWorld();
    const baseDemand = 10;

    // Conjoncture neutre / initiale
    const neutralModifier = getCurrentDemandModifier(w);
    const neutral = calculateMacroAdjustedDemand(baseDemand, neutralModifier, 50);
    expect(neutral.marketPotential).toBeGreaterThan(0);

    // Choc de croissance (+20% de demande)
    const growthDemand = calculateMacroAdjustedDemand(baseDemand, 0.20, 50);
    expect(growthDemand.marketPotential).toBe(24); // 10 * 2 * 1.20 = 24
    expect(growthDemand.demand).toBe(12); // 24 * 50% = 12

    // Choc de récession (-30% de demande)
    const crisisDemand = calculateMacroAdjustedDemand(baseDemand, -0.30, 50);
    expect(crisisDemand.marketPotential).toBe(14); // 10 * 2 * 0.70 = 14
    expect(crisisDemand.demand).toBe(7); // 14 * 50% = 7
  });

  it('12. garantit l’inviolabilité de l’invariant comptable ledgerInvariantHolds à travers tous les flux', () => {
    const w = createWorld();
    createProject(w);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);

    // Tier 1 Bertin
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);

    // Achat de stock payé de la poche
    w.player.money = 20;
    executeVendorStockPurchase(w, 'bertin', 15, 20);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
    expect(ledgerBalance(w.project!)).toBe(w.project!.balance);

    // Achat de stock avec recours partiel au crédit marchand
    w.player.money = 2;
    executeVendorStockPurchase(w, 'bertin', 15, 20);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
    expect(ledgerBalance(w.project!)).toBe(w.project!.balance);

    // Multiples écritures
    w.project!.balance += 50;
    w.project!.ledger.push({
      day: 1,
      date: '2020-09-02',
      label: 'Recette exceptionnelle',
      amount: 50,
    });
    expect(ledgerInvariantHolds(w.project!)).toBe(true);

    // Achat payé par la caisse
    executeVendorStockPurchase(w, 'bertin', 15, 20);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('13. respecte le déterminisme strict du PRNG sans appel à Math.random ni Date.now', () => {
    const runSequence = (seed: number) => {
      const w = createWorld({ seed });
      createProject(w);
      for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 10);
      borrowVendorCredit(w, 'bertin', 15);
      repayVendorCredit(w, 'bertin', 5);
      executeVendorStockPurchase(w, 'bertin', 15, 20);
      macroNewsDayTick(w);
      return {
        money: w.player.money,
        creditBalance: getVendorRelationship(w, 'bertin').creditBalance,
        stock: w.project!.stock,
        ledgerLen: w.project!.ledger.length,
        macroModifier: getCurrentDemandModifier(w),
      };
    };

    const run1 = runSequence(20200901);
    const run2 = runSequence(20200901);

    expect(run1).toEqual(run2);
  });
});
