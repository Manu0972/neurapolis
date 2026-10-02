import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { buyVendorSpecialGood, ensureVendorsState, getVendorDiscountRate, recordVendorTrade } from '../src/simulation/vendors';
import { VENDOR_DEFS } from '../src/data/vendors';

describe('Marchands & Niveaux de Relation (Tiers)', () => {
  it('initialise correctement l’état des marchands avec Palier 0 et 0% de remise', () => {
    const w = createWorld();
    const vendors = ensureVendorsState(w);
    expect(vendors.bertin).toBeDefined();
    expect(vendors.bertin.tier).toBe(0);
    expect(vendors.bertin.spentTotal).toBe(0);
    expect(vendors.bertin.discountRate).toBe(0);
    expect(getVendorDiscountRate(w, 'bertin')).toBe(0);
  });

  it('progresse du Palier 0 au Palier 1 chez Mme Bertin après le seuil de dépenses et transactions', () => {
    const w = createWorld();
    const r1 = recordVendorTrade(w, 'bertin', 20);
    expect(r1.ok).toBe(true);
    expect(r1.tierUpgraded).toBe(false);

    // Faire 3 transactions supplémentaires pour atteindre 4 transactions et >= 40 €
    recordVendorTrade(w, 'bertin', 10);
    recordVendorTrade(w, 'bertin', 5);
    const r4 = recordVendorTrade(w, 'bertin', 10);

    expect(r4.tierUpgraded).toBe(true);
    const vendors = ensureVendorsState(w);
    expect(vendors.bertin.tier).toBe(1);
    expect(vendors.bertin.discountRate).toBe(0.05);
    expect(vendors.bertin.specialStockAvailable).toBe(true);
    expect(getVendorDiscountRate(w, 'bertin')).toBe(0.05);
  });

  it('progresse jusqu’au Palier 3 chez Karim et débloque la remise maximale de 22%', () => {
    const w = createWorld();
    // Paliers Karim : Tier 1 (30€ / 3 trades), Tier 2 (90€ / 8 trades), Tier 3 (220€ / 18 trades)
    for (let i = 0; i < 18; i++) {
      recordVendorTrade(w, 'karim', 15);
    }
    const vendors = ensureVendorsState(w);
    expect(vendors.karim.tier).toBe(3);
    expect(vendors.karim.discountRate).toBe(0.22);
    expect(vendors.karim.friendshipDialogueUnlocked).toBe(true);
  });

  it('permet l’achat d’un article spécial avec application de la remise de palier', () => {
    const w = createWorld();
    w.player.money = 100;
    // Amener Bertin au Tier 1
    for (let i = 0; i < 4; i++) recordVendorTrade(w, 'bertin', 15);

    const good = VENDOR_DEFS.bertin.specialGoods[0]!;
    const res = buyVendorSpecialGood(w, 'bertin', good.id);
    expect(res.ok).toBe(true);
    // 18 € avec 5% de remise = 17.10 €
    expect(w.player.money).toBeCloseTo(100 - 17.10, 2);
  });

  it('refuse l’achat si le palier requis n’est pas atteint ou si les fonds sont insuffisants', () => {
    const w = createWorld();
    w.player.money = 5;
    // Tentative d’achat d’un article Tier 3 sans palier suffisant
    const goodTier3 = VENDOR_DEFS.bertin.specialGoods[2]!;
    const res = buyVendorSpecialGood(w, 'bertin', goodTier3.id);
    expect(res.ok).toBe(false);
    expect(res.message).toContain('insuffisant');
  });
});
