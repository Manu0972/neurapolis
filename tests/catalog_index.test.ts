/**
 * Catalogue fusionné (base + étendu) : identifiants uniques, références valides, chaque
 * grossiste « à retirer » a un point de retrait physique, chaque type de commerce est ouvrable.
 */
import { describe, expect, it } from 'vitest';
import { BUSINESS_TYPES, FURNITURE, PICKUP_BUILDINGS, PRODUCTS, PRODUCT_BY_ID, WHOLESALERS } from '../src/data/economy';
import { CITY } from '../src/data/city/layout';

describe('catalogue économique fusionné', () => {
  it('aucun identifiant en double entre la base et le catalogue étendu', () => {
    for (const list of [PRODUCTS, WHOLESALERS, FURNITURE, BUSINESS_TYPES] as readonly (readonly { id: string }[])[]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
    expect(BUSINESS_TYPES.length).toBeGreaterThanOrEqual(10);
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(70);
  });

  it('les grossistes ne référencent que des produits existants', () => {
    for (const g of WHOLESALERS) for (const id of g.productIds) expect(PRODUCT_BY_ID[id], `${g.id} → ${id}`).toBeDefined();
  });

  it('chaque grossiste « à retirer » a un bâtiment de retrait dans la ville', () => {
    for (const g of WHOLESALERS.filter((x) => x.deliveryDays === 0)) {
      const b = PICKUP_BUILDINGS[g.id];
      expect(b, g.id).toBeDefined();
      expect(CITY.buildings.some((x) => x.id === b), `${g.id} → ${b}`).toBe(true);
    }
  });

  it('chaque type de commerce a ses meubles requis disponibles et au moins un produit vendable', () => {
    const cats = new Set(FURNITURE.map((f) => f.category));
    for (const t of BUSINESS_TYPES) {
      for (const req of t.requiredFurniture) expect(cats.has(req), `${t.id} : ${req}`).toBe(true);
      const sellable = PRODUCTS.some((p) => t.productCategories.includes(p.category));
      expect(sellable, t.id).toBe(true);
    }
  });
});
