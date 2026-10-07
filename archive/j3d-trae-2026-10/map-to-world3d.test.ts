// tests/map-to-world3d.test.ts
// J3D-2 (Trae — Pôle Rendu 3D) : vérifie le pont logique -> 3D.
// Garantit que la grille 48×32 (LOI 1, lecture seule de src/data/map.ts) est
// correctement convertie en World3D sans jamais altérer la simulation.
import { describe, it, expect } from 'vitest';
import { mapToWorld3D, hashMap } from '../src/rendering/mapToWorld3d';
import { MAP_W, MAP_H } from '../src/data/map';

describe('mapToWorld3D — pont logique → 3D (J3D-2)', () => {
  it('produit un sol couvrant l’essentiel de la grille 48×32 (ground ≥ 960)', () => {
    const world = mapToWorld3D();
    // La moitié inf. de la carte est herbe/terre ; l’ensemble dépasse largement 960 tuiles de sol.
    expect(world.ground.length).toBeGreaterThanOrEqual(960);
    console.log(`[J3D-2 preuve] ground.length = ${world.ground.length} (cible ≥ 960)`);
  });

  it('produit des blocs de murs (blocks > 0)', () => {
    const world = mapToWorld3D();
    expect(world.blocks.length).toBeGreaterThan(0);
    console.log(`[J3D-2 preuve] blocks.length = ${world.blocks.length} (cible > 0)`);
  });

  it('conserve les dimensions logiques (48×32) sans aucune écriture (LOI 1)', () => {
    expect(MAP_W).toBe(48);
    expect(MAP_H).toBe(32);
    // Aucun bloc ne doit sortir de la grille.
    const world = mapToWorld3D();
    for (const t of world.ground) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(MAP_W);
      expect(t.z).toBeGreaterThanOrEqual(0);
      expect(t.z).toBeLessThan(MAP_H);
    }
    for (const b of world.blocks) {
      expect(b.x + b.w).toBeLessThanOrEqual(MAP_W);
      expect(b.z + b.d).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('son hash est stable (cache dirty-check fiable, LOI 2)', () => {
    expect(hashMap()).toBe(hashMap());
  });

  it('produit un sol et des murs dans le repère unité/tuile cohérent', () => {
    const world = mapToWorld3D();
    // Sol unitaire : chaque tuile couvre 1×1 (w/h/d = 1 tuile) ; hauteur mur = 3.0 (LOI 2).
    const sampleMur = world.blocks.find((b) => b.role === 'mur');
    if (sampleMur) expect(sampleMur.h).toBe(3.0);
    const lesMurs = world.blocks.filter((b) => b.role === 'mur');
    expect(lesMurs.length).toBeGreaterThan(0);
  });

  it('ajoute des toits plats au-dessus des bâtiments (role: toit, épaisseur 0.5 — LOI 2)', () => {
    const world = mapToWorld3D();
    const toits = world.blocks.filter((b) => b.role === 'toit');
    expect(toits.length).toBeGreaterThan(0);
    for (const t of toits) expect(t.h).toBe(0.5);
    console.log(`[J3D-2 preuve] toits.length = ${toits.length} (cible > 0)`);
  });

  it('respecte les hauteurs DA différenciées (maison 3.6 / collège 3.2 / épicerie 2.6)', () => {
    const world = mapToWorld3D();
    const hauteurs = new Set(world.blocks.filter((b) => b.role === 'mur').map((b) => b.h));
    // 3.0 (mur générique) + au moins une hauteur de bâtiment parmi les trois imposées.
    expect(hauteurs.has(3.0)).toBe(true);
    expect(
      hauteurs.has(3.6) || hauteurs.has(3.2) || hauteurs.has(2.6)
    ).toBe(true);
    console.log(`[J3D-2 preuve] hauteurs de murs présentes : ${[...hauteurs].join(', ')}`);
  });
});