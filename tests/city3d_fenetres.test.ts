// Fenêtres allumées des modèles Kenney : courbe d'allumage, choix déterministe, repérage dans les GLB.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assignDoorHeights, assignWindowIds, hashU, houseRand, lotSeed, lotWindowOn, plasterOf, PLASTER_TINTS, rand24,
  windowLitFraction, windowOn, windowSpec, windowThreshold, windowTint,
} from '../src/presentation/city3d/windowsPlan';
import { dayPhase, SUNRISE, SUNSET } from '../src/presentation/city3d/sky';

/** Lit le premier maillage d'un GLB (positions, UV, index) sans Three.js (lecture en latin1 → octets). */
function readGlb(path: string): { pos: Float32Array; uv: Float32Array; idx: Uint32Array } {
  const txt = readFileSync(path, 'latin1');
  const bytes = new Uint8Array(txt.length);
  for (let i = 0; i < txt.length; i++) bytes[i] = txt.charCodeAt(i) & 255;
  const dv = new DataView(bytes.buffer);
  const jl = dv.getUint32(12, true);
  const j = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jl)));
  const bin = 20 + jl + 8;
  const p = j.meshes[0].primitives[0];
  const read = (ai: number, comps: number): number[] => {
    const a = j.accessors[ai];
    const bv = j.bufferViews[a.bufferView];
    const o0 = bin + (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const size = a.componentType === 5126 || a.componentType === 5125 ? 4 : a.componentType === 5123 ? 2 : 1;
    const stride = bv.byteStride ?? comps * size;
    const out: number[] = [];
    for (let i = 0; i < a.count; i++) for (let k = 0; k < comps; k++) {
      const o = o0 + i * stride + k * size;
      out.push(a.componentType === 5126 ? dv.getFloat32(o, true) : a.componentType === 5125 ? dv.getUint32(o, true) : a.componentType === 5123 ? dv.getUint16(o, true) : dv.getUint8(o));
    }
    return out;
  };
  return {
    pos: Float32Array.from(read(p.attributes.POSITION, 3)),
    uv: Float32Array.from(read(p.attributes.TEXCOORD_0, 2)),
    idx: Uint32Array.from(read(p.indices, 1)),
  };
}
const GLB = 'public/assets/libre';

describe("courbe d'allumage des fenêtres", () => {
  it('éteintes en plein jour, allumées au crépuscule avec les lampadaires, puis moins nombreuses la nuit', () => {
    expect(windowLitFraction(13)).toBe(0);
    expect(windowLitFraction(10)).toBe(0);
    // Le soir, la courbe suit `lamps` : même début que l'allumage des lampadaires et des vitrines.
    expect(windowLitFraction(SUNSET - 1.2)).toBe(0);
    expect(windowLitFraction(SUNSET - 0.4)).toBeGreaterThan(0);
    expect(windowLitFraction(SUNSET + 0.2)).toBeGreaterThan(0.6 * dayPhase(SUNSET + 0.2).lamps);
    expect(windowLitFraction(21)).toBeGreaterThan(0.6);
    expect(windowLitFraction(21)).toBeGreaterThan(windowLitFraction(0));
    expect(windowLitFraction(0)).toBeGreaterThan(windowLitFraction(3));
    expect(windowLitFraction(3)).toBeLessThan(0.2);
    // Les lève-tôt rallument avant l'aube, puis tout s'éteint au lever du jour.
    expect(windowLitFraction(SUNRISE - 0.9)).toBeGreaterThan(windowLitFraction(3));
    expect(windowLitFraction(SUNRISE + 1)).toBe(0);
  });
  it('est continue, bornée à [0, 1] et périodique sur 24 h', () => {
    let prev = windowLitFraction(0);
    for (let h = 0; h <= 24.0001; h += 0.05) {
      const f = windowLitFraction(h);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
      expect(Math.abs(f - prev)).toBeLessThan(0.06);
      prev = f;
    }
    expect(windowLitFraction(25.5)).toBeCloseTo(windowLitFraction(1.5), 10);
    expect(windowLitFraction(-2)).toBeCloseTo(windowLitFraction(22), 10);
  });
  it("un jour de pluie laisse quelques lampes allumées, jamais plus qu'au soir", () => {
    expect(windowLitFraction(14, 1)).toBeGreaterThan(0);
    expect(windowLitFraction(14, 1)).toBeLessThan(0.25);
    expect(windowLitFraction(14, 0.5)).toBeLessThan(windowLitFraction(14, 1));
    expect(windowLitFraction(3, 1)).toBe(windowLitFraction(3, 0));
  });
});

describe('choix déterministe des fenêtres allumées', () => {
  it("même lot, même fenêtre, même fraction → même résultat ; l'ordre d'appel ne change rien", () => {
    const seed = lotSeed(123.5, 456);
    const a = [0, 1, 2, 3, 4, 5].map((id) => lotWindowOn(seed, id, 0.5));
    const b = [5, 4, 3, 2, 1, 0].map((id) => lotWindowOn(seed, id, 0.5)).reverse();
    expect(a).toEqual(b);
    expect(lotSeed(123.5, 456)).toBe(seed);
    expect(lotSeed(124, 456)).not.toBe(seed);
  });
  it('une fenêtre allumée le reste quand la part allumée augmente', () => {
    const seed = lotSeed(10, 20);
    for (let id = 1; id <= 40; id++) {
      let last = 0;
      for (let f = 0; f <= 1; f += 0.05) {
        const on = lotWindowOn(seed, id, f);
        expect(on).toBeGreaterThanOrEqual(last - 1e-12);
        last = on;
      }
    }
    expect(windowOn(0, 0.3)).toBe(0);
    expect(windowOn(1, 0.3)).toBe(1);
  });
  it("à la fraction visée, la part de fenêtres allumées de la ville est proche d'elle, avec des logements très différents", () => {
    const frac = 0.5;
    let on = 0;
    let total = 0;
    const perHouse: number[] = [];
    for (let h = 0; h < 300; h++) {
      const seed = lotSeed(h * 7, h * 3);
      let n = 0;
      for (let id = 1; id <= 6; id++) { if (lotWindowOn(seed, id, frac) > 0.5) n++; total++; }
      on += n;
      perHouse.push(n);
    }
    expect(on / total).toBeGreaterThan(frac - 0.12);
    expect(on / total).toBeLessThan(frac + 0.12);
    expect(perHouse.some((n) => n === 0)).toBe(true);
    expect(perHouse.some((n) => n === 6)).toBe(true);
    // Le seuil mélange le tirage de la fenêtre et celui du logement.
    expect(windowThreshold(0, 1)).toBeCloseTo(0.6, 10);
    expect(windowThreshold(0.3, 0.3)).toBeCloseTo(0.3, 10);
    expect(houseRand(lotSeed(5, 5))).toBeGreaterThanOrEqual(0);
  });
  it('le hachage entier est stable (garde-fou contre une dérive du miroir GLSL) et réparti', () => {
    expect(hashU(1, 2, 3)).toBe(hashU(1, 2, 3));
    expect(hashU(1, 2, 3)).not.toBe(hashU(1, 2, 4));
    expect(rand24(0xffffffff)).toBeLessThan(1);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(Math.floor(rand24(hashU(i, 7, 3)) * 10));
    expect(seen.size).toBe(10);
  });
  it('teintes chaudes variées, quelques logements bleutés ; enduit stable par lot', () => {
    expect(windowTint(0.1)[0]).toBe(1);
    expect(windowTint(0.99)[2]).toBeGreaterThan(windowTint(0.99)[0]);
    const tints = new Set<string>();
    for (let h = 0; h < 200; h++) tints.add(plasterOf(lotSeed(h, h * 2)).join(','));
    expect(tints.size).toBe(PLASTER_TINTS.length);
    expect(plasterOf(lotSeed(9, 9))).toBe(plasterOf(lotSeed(9, 9)));
  });
});

describe('repérage des fenêtres dans les modèles', () => {
  it('numérote chaque vitre soudée par sa position, même si les UV la coupent en sommets séparés', () => {
    // Deux triangles dans le carreau bleu clair (5, 1), un mur ailleurs, un sommet de vitre isolé.
    const pos = [0, 0, 0, 1, 0, 0, 0, 1, 0, 5, 0, 0, 6, 0, 0, 5, 1, 0, 9, 0, 0, 10, 0, 0, 9, 1, 0, 0, 0, 0];
    const win = [0.72, 0.35];
    const wall = [0.4, 0.9];
    const uv = [...win, ...win, ...win, ...win, ...win, ...win, ...wall, ...wall, ...wall, ...win];
    const ids = assignWindowIds(pos, uv, [0, 1, 2, 3, 4, 5, 6, 7, 8], 'suburban', 'building-type-a');
    expect(Array.from(ids.slice(0, 3))).toEqual([1, 1, 1]);
    expect(Array.from(ids.slice(3, 6))).toEqual([2, 2, 2]);
    expect(Array.from(ids.slice(6, 9))).toEqual([0, 0, 0]);
    // Le dernier sommet (même position que le premier, même carreau) rejoint la première vitre.
    expect(ids[9]).toBe(1);
  });
  it("les maisons Kenney ont des vitres individuelles ; les tours et l'horizon, des panneaux en grille", () => {
    expect(windowSpec('suburban', 'building-type-a')!.kind).toBe('discrete');
    expect(windowSpec('commercial', 'low-detail-building-a')!.kind).toBe('grid');
    expect(windowSpec('commercial', 'building-skyscraper-b')!.kind).toBe('grid');
    expect(windowSpec('commercial', 'building-l')!.kind).toBe('discrete');
  });
  it('les 8 maisons de banlieue ont chacune plusieurs fenêtres distinctes et une porte', () => {
    for (const m of ['a', 'c', 'e', 'i', 'o', 'p', 's', 'u']) {
      const g = readGlb(`${GLB}/kenney-suburban/glb/building-type-${m}.glb`);
      const ids = assignWindowIds(g.pos, g.uv, g.idx, 'suburban', `building-type-${m}`);
      const n = new Set(Array.from(ids).filter((x) => x > 0)).size;
      expect(n, `fenêtres de type-${m}`).toBeGreaterThanOrEqual(3);
      expect(n, `fenêtres de type-${m}`).toBeLessThan(40);
      const d = assignDoorHeights(g.pos, g.uv, 'suburban');
      expect(Array.from(d).some((x) => x >= 0), `porte de type-${m}`).toBe(true);
      expect(Array.from(d).every((x) => x === -1 || (x >= 0 && x <= 1))).toBe(true);
    }
  });
  it("les immeubles de l'horizon ont des panneaux vitrés à découper", () => {
    for (const m of ['low-detail-building-a', 'low-detail-building-wide-b', 'building-skyscraper-c']) {
      const g = readGlb(`${GLB}/kenney-commercial/glb/${m}.glb`);
      const ids = assignWindowIds(g.pos, g.uv, g.idx, 'commercial', m);
      expect(Array.from(ids).filter((x) => x === -1).length, m).toBeGreaterThan(8);
    }
  });
});
