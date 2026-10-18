// Ressources libres (Kenney, Poly Haven) : logique pure du choix des modèles et des textures.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  fitScale, hashInts, isGenericHouse, LOW_DETAIL_BUILDINGS, OUTER_RING, pickModel, skylinePlan, SKYLINE_TOWERS,
  SUBURBAN_HOUSES, textureVariation, varyUv,
} from '../src/presentation/city3d/assetsPlan';
import { headingFor } from '../src/presentation/city3d/skyline';
import { CITY, CITY_H, CITY_W } from '../src/data/city/layout';

describe('choix déterministe des modèles Kenney', () => {
  it('même graine et même lot → même modèle ; les lots se répartissent sur tout le catalogue', () => {
    expect(pickModel(11, 120, 340, SUBURBAN_HOUSES)).toBe(pickModel(11, 120, 340, SUBURBAN_HOUSES));
    expect(hashInts(1, 2, 3)).toBe(hashInts(1, 2, 3));
    expect(hashInts(1, 2, 3)).not.toBe(hashInts(1, 2, 4));
    const seen = new Set<string>();
    for (let x = 0; x < 600; x += 15) for (let z = 0; z < 160; z += 16) seen.add(pickModel(11, x, z, SUBURBAN_HOUSES)!);
    expect(seen.size).toBe(SUBURBAN_HOUSES.length);
  });

  it('repli : un modèle manquant est remplacé par un modèle disponible, ou rien', () => {
    const avail = new Set<string>(['building-type-c', 'building-type-p']);
    for (let i = 0; i < 50; i++) expect(avail.has(pickModel(11, i * 15, i * 7, SUBURBAN_HOUSES, avail)!)).toBe(true);
    expect(pickModel(11, 0, 0, SUBURBAN_HOUSES, new Set())).toBeNull();
  });

  it('mise à l’échelle : la maison tient dans l’emprise du pavillon (rotation d’un quart de tour comprise)', () => {
    const size = { x: 1.3, y: 0.83, z: 1.03 };
    const s = fitScale(size, 9, 8);
    expect(size.x * s).toBeLessThanOrEqual(9);
    expect(size.z * s).toBeLessThanOrEqual(8);
    expect(Math.max(size.x * s / 9, size.z * s / 8)).toBeGreaterThan(0.95);
    const q = fitScale(size, 8, 9, 0.02, true);
    expect(size.z * q).toBeLessThanOrEqual(8);
    expect(size.x * q).toBeLessThanOrEqual(9);
  });

  it('cap : la porte du modèle (+Z) regarde la façade principale du pavillon', () => {
    const normals = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] } as const;
    for (const f of ['n', 's', 'e', 'w'] as const) {
      const v = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), headingFor(f));
      expect(v.x).toBeCloseTo(normals[f][0], 6);
      expect(v.z).toBeCloseTo(normals[f][1], 6);
    }
  });
});

describe('variation des textures par bloc', () => {
  it('déterministe, dans [0, 1[, et différente d’un bloc à l’autre', () => {
    expect(textureVariation(3, 4)).toEqual(textureVariation(3, 4));
    const vs = [];
    for (let i = 0; i < 13; i++) for (let j = 0; j < 10; j++) vs.push(textureVariation(i, j));
    for (const v of vs) { expect(v.du).toBeGreaterThanOrEqual(0); expect(v.du).toBeLessThan(1); expect(v.dv).toBeLessThan(1); }
    expect(new Set(vs.map((v) => v.du.toFixed(3))).size).toBeGreaterThan(100);
    const flips = vs.filter((v) => v.flip).length;
    expect(flips).toBeGreaterThan(30);
    expect(flips).toBeLessThan(100);
  });

  it('décalage et miroir appliqués aux coordonnées', () => {
    expect(varyUv(2, 5, { du: 0.5, dv: 0.25, flip: false }, 12)).toEqual([8, 8]);
    expect(varyUv(2, 5, { du: 0, dv: 0, flip: true }, 12)).toEqual([-2, 5]);
  });
});

describe('décor lointain et lotissements', () => {
  it('plan déterministe, hors de la carte, avec des modèles des catalogues', () => {
    const a = skylinePlan(CITY_W, CITY_H);
    expect(a).toEqual(skylinePlan(CITY_W, CITY_H));
    expect(a.length).toBeGreaterThan(250);
    const all = new Set<string>([...LOW_DETAIL_BUILDINGS, ...SKYLINE_TOWERS]);
    for (const p of a) {
      expect(all.has(p.model)).toBe(true);
      const outside = p.x < -OUTER_RING / 2 || p.z < -OUTER_RING / 2 || p.x > CITY_W + OUTER_RING / 2 || p.z > CITY_H + OUTER_RING / 2;
      expect(outside).toBe(true);
    }
    expect(a.filter((p) => (SKYLINE_TOWERS as readonly string[]).includes(p.model)).length).toBe(32);
  });

  it('seuls les pavillons génériques sont remplacés : lieux, enseignes et locaux restent', () => {
    const houses = CITY.buildings.filter(isGenericHouse);
    expect(houses.length).toBeGreaterThan(100);
    for (const b of houses) { expect(b.place).toBeUndefined(); expect(b.label).toBeUndefined(); expect(b.unitId).toBeUndefined(); }
    const home = CITY.buildings.find((b) => b.place === 'maison');
    expect(home && isGenericHouse(home)).toBe(false);
  });
});
