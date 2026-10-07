import { describe, it, expect } from 'vitest';
import {
  EXTENDED_PRODUCTS,
  EXTENDED_WHOLESALERS,
  EXTENDED_FURNITURE,
  EXTENDED_BUSINESS_TYPES,
} from '../src/data/economy/catalog_extended';

describe('Catalogue économique étendu (A-2 Suite de tests)', () => {
  describe('Produits étendus (EXTENDED_PRODUCTS)', () => {
    it('doit contenir au minimum 60 produits', () => {
      expect(EXTENDED_PRODUCTS.length).toBeGreaterThanOrEqual(60);
    });

    it('tous les identifiants de produits sont uniques et au format snake_case', () => {
      const ids = EXTENDED_PRODUCTS.map((p) => p.id);
      expect(new Set(ids).size).toBe(EXTENDED_PRODUCTS.length);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9_]+$/);
        expect(id.startsWith('prod_')).toBe(true);
      }
    });

    it('les prix de référence sont cohérents (retailRef entre 1.3x et 3x wholesaleBase, 8x pour café et services)', () => {
      for (const p of EXTENDED_PRODUCTS) {
        expect(p.wholesaleBase).toBeGreaterThan(0);
        expect(p.retailRef).toBeGreaterThan(p.wholesaleBase);
        const marginRatio = p.retailRef / p.wholesaleBase;
        expect(marginRatio).toBeGreaterThanOrEqual(1.3);
        // Boissons préparées et forfaits de service : la matière première ne pèse qu'une petite
        // part du prix (main-d'œuvre, machine) — marge plafonnée à 8× au lieu de 3×.
        // (Ajustement E — Claude Code, 2026-10-07, consigné au tableau.)
        const cap = p.category === 'cafe' || p.category === 'service' ? 8.0 : 3.0;
        expect(marginRatio).toBeLessThanOrEqual(cap);
      }
    });

    it('les saisonnalités déclarées comportent exactement 12 mois', () => {
      for (const p of EXTENDED_PRODUCTS) {
        if (p.seasonality) {
          expect(p.seasonality.length).toBe(12);
          for (const mult of p.seasonality) {
            expect(mult).toBeGreaterThan(0);
            expect(mult).toBeLessThan(3.0);
          }
        }
      }
    });
  });

  describe('Grossistes étendus (EXTENDED_WHOLESALERS)', () => {
    it('doit contenir au moins 6 grossistes', () => {
      expect(EXTENDED_WHOLESALERS.length).toBeGreaterThanOrEqual(6);
    });

    it('tous les identifiants de grossistes sont uniques et en snake_case', () => {
      const ids = EXTENDED_WHOLESALERS.map((w) => w.id);
      expect(new Set(ids).size).toBe(EXTENDED_WHOLESALERS.length);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9_]+$/);
      }
    });

    it('chaque grossiste ne référence que des produits existants dans EXTENDED_PRODUCTS', () => {
      const validProductIds = new Set(EXTENDED_PRODUCTS.map((p) => p.id));
      for (const w of EXTENDED_WHOLESALERS) {
        expect(w.productIds.length).toBeGreaterThan(0);
        for (const prodId of w.productIds) {
          expect(validProductIds.has(prodId)).toBe(true);
        }
        expect(w.priceMult).toBeGreaterThan(0.5);
        expect(w.priceMult).toBeLessThanOrEqual(1.0);
        expect(w.reliability).toBeGreaterThanOrEqual(0.7);
        expect(w.reliability).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Meubles étendus (EXTENDED_FURNITURE)', () => {
    it('doit contenir au moins 25 meubles', () => {
      expect(EXTENDED_FURNITURE.length).toBeGreaterThanOrEqual(25);
    });

    it('tous les identifiants de meubles sont uniques et en snake_case', () => {
      const ids = EXTENDED_FURNITURE.map((f) => f.id);
      expect(new Set(ids).size).toBe(EXTENDED_FURNITURE.length);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9_]+$/);
      }
    });

    it('chaque meuble possède un coût, une emprise au sol et une catégorie valide', () => {
      const validCategories = new Set([
        'rayonnage',
        'frigo',
        'caisse',
        'comptoir',
        'table',
        'machine',
        'deco',
        'stockage',
      ]);
      for (const f of EXTENDED_FURNITURE) {
        expect(validCategories.has(f.category)).toBe(true);
        expect(f.cost).toBeGreaterThan(0);
        expect(f.footprintM2).toBeGreaterThan(0);
      }
    });
  });

  describe('Types de commerces (EXTENDED_BUSINESS_TYPES)', () => {
    it('doit contenir au moins 8 types de commerces', () => {
      expect(EXTENDED_BUSINESS_TYPES.length).toBeGreaterThanOrEqual(8);
    });

    it('tous les meubles requis pour chaque type de commerce peuvent être satisfaits', () => {
      const availableFurnitureCategories = new Set(EXTENDED_FURNITURE.map((f) => f.category));
      for (const b of EXTENDED_BUSINESS_TYPES) {
        expect(b.productCategories.length).toBeGreaterThan(0);
        expect(b.requiredFurniture.length).toBeGreaterThan(0);
        for (const reqCat of b.requiredFurniture) {
          expect(availableFurnitureCategories.has(reqCat)).toBe(true);
        }
      }
    });
  });
});
