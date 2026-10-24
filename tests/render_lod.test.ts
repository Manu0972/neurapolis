import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  FrameMonitor, RENDER_BUDGETS, adaptRenderScale, autoQualityStep, chooseLod, distanceToBox, instanceLevel,
  nearestWithin, partitionLod, robustAverage, viewCone, type LodView,
} from '../src/presentation/city3d/lod';
import { buildProxyGeometry, triangleCount } from '../src/presentation/city3d/lodSimplify';
import { lowerQuality } from '../src/presentation/city3d/quality';

const view = (over: Partial<LodView> = {}): LodView => ({ x: 0, z: 0, dirX: 0, dirZ: -1, cosHalf: viewCone(55, 16 / 9), keep: 48, ...over });

describe('niveaux de détail (lod.ts)', () => {
  it('chooseLod : seuil et hystérésis (pas de clignotement à la limite)', () => {
    expect(chooseLod(40, 55)).toBe(0);
    expect(chooseLod(60, 55)).toBe(1);
    // Déjà simplifié : on ne repasse en complet qu'un peu en deçà du seuil.
    expect(chooseLod(50, 55, 1)).toBe(1);
    expect(chooseLod(46, 55, 1)).toBe(0);
  });

  it('distanceToBox : nulle dedans, au bord dehors', () => {
    expect(distanceToBox(5, 5, 0, 0, 10, 10)).toBe(0);
    expect(distanceToBox(13, 14, 0, 0, 10, 10)).toBeCloseTo(5);
  });

  it('nearestWithin : les plus proches dans le rayon, dans la limite du budget', () => {
    const pts = [{ x: 50, z: 0 }, { x: 5, z: 0 }, { x: 500, z: 0 }, { x: 20, z: 0 }];
    expect([...nearestWithin(pts, 0, 0, 2, 100)].sort()).toEqual([1, 3]);
    expect(nearestWithin(pts, 0, 0, 10, 100).has(2)).toBe(false);
  });

  it('instanceLevel : complet près, maquette au loin, rien au-delà de la portée ou derrière', () => {
    expect(instanceLevel(10, true, 55, 300, 48, 0)).toBe(0);
    expect(instanceLevel(100, true, 55, 300, 48, 0)).toBe(1);
    expect(instanceLevel(400, true, 55, 300, 48, 1)).toBe(2);
    expect(instanceLevel(100, false, 55, 300, 48, 1)).toBe(2);
    // Derrière la caméra mais tout près : gardé (son ombre peut tomber dans le champ).
    expect(instanceLevel(20, false, 55, 300, 48, 2)).toBe(0);
  });

  it('partitionLod : répartit les instances et signale les changements', () => {
    // Quatre maisons : devant tout près, devant loin, derrière loin, devant hors portée.
    const xz = new Float32Array([0, -10, 0, -120, 0, 150, 0, -900]);
    const levels = new Uint8Array(4);
    const a = partitionLod(xz, levels, view(), 55, 400, 4);
    expect([...levels]).toEqual([0, 1, 2, 2]);
    expect(a).toEqual({ full: 1, proxy: 1, changed: true });
    // Même caméra : rien ne change, les tampons ne sont pas réécrits.
    expect(partitionLod(xz, levels, view(), 55, 400, 4).changed).toBe(false);
    // Vue plongeante (cône complet) : la maison de derrière revient en maquette.
    partitionLod(xz, levels, view({ cosHalf: -1 }), 55, 400, 4);
    expect(levels[2]).toBe(1);
  });

  it('viewCone : champ de la caméra élargi d\'une marge', () => {
    const c = viewCone(55, 16 / 9);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(Math.cos((42 * Math.PI) / 180));
    expect(viewCone(170, 3)).toBeLessThan(0);
  });
});

describe('budgets par qualité', () => {
  it('la qualité basse est la plus légère, la haute la plus riche', () => {
    const { bas, moyen, haut } = RENDER_BUDGETS;
    for (const k of ['houseLodNear', 'cars', 'pedestrians', 'ambientRadius', 'shoppers', 'crowdLod', 'detailFar', 'viewScale'] as const) {
      expect(bas[k]).toBeLessThanOrEqual(moyen[k]);
      expect(moyen[k]).toBeLessThanOrEqual(haut[k]);
    }
    expect(bas.rimLight).toBe(false);
    expect(bas.basicShadows).toBe(true);
    expect(bas.minRenderScale).toBeLessThan(1);
    expect(haut.minRenderScale).toBe(1);
    // Le cadre d'ombre du soleil reste en deçà du seuil des maquettes (elles ne portent pas d'ombre).
    expect(bas.houseLodNear).toBeGreaterThan(32);
  });

  it('lowerQuality : garde le niveau le plus bas', () => {
    expect(lowerQuality('haut', 'bas')).toBe('bas');
    expect(lowerQuality('bas', 'haut')).toBe('bas');
    expect(lowerQuality('moyen', null)).toBe('moyen');
  });
});

describe('résolution dynamique et qualité « Auto »', () => {
  it('adaptRenderScale : descend si trop lent, remonte avec de la marge, bornée', () => {
    expect(adaptRenderScale(1, 30, 22.2, 0.7)).toBe(0.9);
    expect(adaptRenderScale(0.7, 40, 22.2, 0.7)).toBe(0.7);
    expect(adaptRenderScale(0.8, 16.7, 22.2, 0.7)).toBe(0.9);
    expect(adaptRenderScale(0.9, 30, 22.2, 1)).toBe(1);
  });

  it('autoQualityStep : un cran plus bas sous 40 i/s, jamais sous « bas »', () => {
    expect(autoQualityStep('moyen', 20)).toBe('moyen');
    expect(autoQualityStep('moyen', 1000 / 30)).toBe('bas');
    expect(autoQualityStep('haut', 30)).toBe('moyen');
    expect(autoQualityStep('bas', 100)).toBe('bas');
    expect(autoQualityStep('haut', 0)).toBe('haut');
  });

  it('robustAverage : écarte les à-coups', () => {
    expect(robustAverage([10, 10, 10, 10, 10, 10, 10, 10, 10, 500])).toBe(10);
    expect(robustAverage([])).toBe(0);
  });

  it('FrameMonitor : ignore le démarrage et les pauses, puis décide sur une fenêtre complète', () => {
    const m = new FrameMonitor(5, 10);
    const push = (ms: number, auto = true) => m.push(ms, 'moyen', auto, RENDER_BUDGETS.moyen);
    for (let i = 0; i < 5; i++) expect(push(50).quality).toBeNull();
    // Onglet masqué : intervalles aberrants ignorés.
    expect(push(5000).quality).toBeNull();
    let v = { quality: null as string | null, scale: null as number | null };
    for (let i = 0; i < 10; i++) v = push(33);
    expect(v.quality).toBe('bas');
    // Sans « Auto », la qualité choisie par le joueur est respectée.
    const fixed = new FrameMonitor(0, 10);
    let w = { quality: null as string | null, scale: null as number | null };
    for (let i = 0; i < 10; i++) w = fixed.push(33, 'moyen', false, RENDER_BUDGETS.moyen);
    expect(w).toEqual({ quality: null, scale: null });
  });

  it('FrameMonitor : en qualité basse, réduit la résolution plutôt que de saccader', () => {
    const m = new FrameMonitor(0, 10);
    let v = { quality: null as string | null, scale: null as number | null };
    for (let i = 0; i < 10; i++) v = m.push(30, 'bas', true, RENDER_BUDGETS.bas);
    expect(v).toEqual({ quality: null, scale: 0.9 });
  });
});

describe('maquettes lointaines (lodSimplify.ts)', () => {
  /** Maison simplifiée : corps 6 × 4 × 3 m, toit à deux pans jusqu'à 5 m, beaucoup de petits triangles. */
  function house(): THREE.BufferGeometry {
    const body = new THREE.BoxGeometry(6, 3, 4, 12, 6, 8).translate(0, 1.5, 0);
    const roof = new THREE.CylinderGeometry(0.01, 3.6, 2, 4, 1).rotateY(Math.PI / 4).translate(0, 4, 0);
    const parts = [body, roof].map((g) => g.toNonIndexed());
    const n = parts.reduce((t, g) => t + g.getAttribute('position').count, 0);
    const pos = new Float32Array(n * 3);
    const nrm = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of parts) {
      pos.set(g.getAttribute('position').array as Float32Array, o * 3);
      nrm.set(g.getAttribute('normal').array as Float32Array, o * 3);
      uv.set(g.getAttribute('uv').array as Float32Array, o * 2);
      o += g.getAttribute('position').count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('aWin', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    return geo;
  }

  it('garde la silhouette avec quelques dizaines de triangles et les mêmes attributs', () => {
    const src = house();
    const proxy = buildProxyGeometry(src, 'discrete');
    expect(triangleCount(proxy)).toBeLessThan(triangleCount(src) / 4);
    expect(triangleCount(proxy)).toBeLessThan(80);
    for (const a of ['position', 'normal', 'uv', 'aWin']) expect(proxy.getAttribute(a)).toBeTruthy();
    proxy.computeBoundingBox();
    const bb = proxy.boundingBox!;
    expect(bb.min.y).toBeCloseTo(0);
    expect(bb.max.y).toBeCloseTo(5, 0);
    expect(bb.max.x - bb.min.x).toBeCloseTo(6, 0);
    // Des vitres numérotées (allumées la nuit comme les vraies).
    const win = proxy.getAttribute('aWin');
    let lit = 0;
    for (let i = 0; i < win.count; i++) if (win.getX(i) > 0) lit++;
    expect(lit).toBeGreaterThan(0);
  });

  it('tours : murs vitrés en grille, sans vitres posées', () => {
    const proxy = buildProxyGeometry(new THREE.BoxGeometry(10, 40, 10).translate(0, 20, 0), 'grid');
    expect(triangleCount(proxy)).toBeLessThanOrEqual(12);
  });
});
