/**
 * Générateur de façades en pixel art (src/presentation/city3d/facadeAtlas.ts) :
 * déterminisme, dimensions des carreaux, palette fermée sans noir ni blanc purs.
 */
import { describe, expect, it } from 'vitest';
import {
  FACADE_VARIANTS, FLOOR_PX, GROUND_PX, MOD_W, PALETTE, SHEET_COLS, SHOP_KINDS, UPPER_ROWS,
  buildFacadeAtlas, shopKindFor, variantFor,
} from '../src/presentation/city3d/facadeAtlas';
import { shopStateFor } from '../src/presentation/city3d/cityBuildings';
import { CITY } from '../src/data/city/layout';

const atlas = buildFacadeAtlas();

describe('atlas de façades', () => {
  it('est déterministe (mêmes pixels à chaque génération)', () => {
    const again = buildFacadeAtlas();
    expect(again.width).toBe(atlas.width);
    expect(again.height).toBe(atlas.height);
    expect(Buffer.from(again.data).equals(Buffer.from(atlas.data))).toBe(true);
  });

  it('tient dans une texture raisonnable et a les carreaux attendus aux bonnes dimensions', () => {
    expect(atlas.width).toBe(2048);
    expect(atlas.height).toBeLessThanOrEqual(4096);
    const px = (key: string): [number, number] => {
      const t = atlas.tiles[key]!;
      expect(t, key).toBeDefined();
      return [Math.round(t.du * atlas.width), Math.round(t.dv * atlas.height)];
    };
    for (const v of FACADE_VARIANTS) {
      expect(px(`upper:${v.id}`)).toEqual([MOD_W * SHEET_COLS, FLOOR_PX * UPPER_ROWS]);
      expect(px(`ground:${v.id}`)).toEqual([MOD_W * SHEET_COLS, GROUND_PX]);
      expect(px(`door:${v.id}`)).toEqual([MOD_W, GROUND_PX]);
    }
    for (const k of SHOP_KINDS) {
      expect(px(`shop:${k}`)).toEqual([MOD_W * SHEET_COLS, GROUND_PX]);
      expect(px(`shopdoor:${k}`)).toEqual([MOD_W, GROUND_PX]);
    }
    for (const t of Object.values(atlas.tiles)) {
      expect(t.u).toBeGreaterThanOrEqual(0);
      expect(t.v).toBeGreaterThanOrEqual(0);
      expect(t.u + t.du).toBeLessThanOrEqual(1);
      expect(t.v + t.dv).toBeLessThanOrEqual(1);
    }
  });

  it("n'emploie que la palette fermée, sans noir ni blanc purs", () => {
    const allowed = new Set(Object.values(PALETTE).map((h) => parseInt(h.slice(1), 16)));
    expect(allowed.has(0x000000)).toBe(false);
    expect(allowed.has(0xffffff)).toBe(false);
    const d = atlas.data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4) seen.add((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!);
    seen.delete(0); // fond non utilisé de l'atlas (hors carreaux)
    const outside = [...seen].filter((c) => !allowed.has(c)).map((c) => `#${c.toString(16).padStart(6, '0')}`);
    expect(outside).toEqual([]);
  });

  it('porte un masque de fenêtres allumées (alpha) sur une partie seulement', () => {
    let lit = 0;
    for (let i = 3; i < atlas.data.length; i += 4) if (atlas.data[i]! < 255) lit++;
    const ratio = lit / (atlas.data.length / 4);
    expect(ratio).toBeGreaterThan(0.02);
    expect(ratio).toBeLessThan(0.5);
  });
});

describe('choix par bâtiment et par commerce', () => {
  it('donne à chaque bâtiment une variante stable de son style', () => {
    for (const b of CITY.buildings.slice(0, 300)) {
      const v = variantFor(b);
      expect(v.style).toBe(b.style);
      expect(variantFor(b)).toBe(v);
    }
  });

  it('montre la marchandise du métier et passe une vitrine à louer au blanc', () => {
    expect(shopKindFor(['boulangerie'])).toBe('pain');
    expect(shopKindFor(['fleur'])).toBe('fleurs');
    expect(shopKindFor(['livre', 'papeterie'])).toBe('livres');
    expect(shopKindFor(undefined)).toBe('generique');
    expect(shopStateFor('À LOUER', 'pain')).toBe('libre');
    expect(shopStateFor('BIENTÔT OUVERT', null)).toBe('bientot');
    expect(shopStateFor('Le Fournil des Roses', 'pain')).toBe('pain');
    expect(shopStateFor('🥖 Chez Camille', null)).toBe('generique');
  });
});
