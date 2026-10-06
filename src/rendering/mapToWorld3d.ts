// src/rendering/mapToWorld3d.ts
// J3D-2 — Pont logique → 3D (Pôle Rendu 3D, Trae).
// Convertit la grille 48×32 de src/data/map.ts (lecture SEULE, LOI 1) vers le contrat
// World3D (world3d.ts) consommé par WorldBuilder. Aucune écriture dans la simulation.
import { MAP_W, MAP_H, tileAt, type Tile } from '../data/map';
import type { GroundTile, Block3D, World3D } from './world3d';

// Hauteurs de référence — LOI 2 (charte HD-2D).
const H = {
  mur: 3.0,        // Mur générique
  maison: 3.6,     // Maison
  college: 3.2,    // Collège
  epicerie: 2.6,   // Épicerie
  toit: 0.5,       // Épaisseur de toit
} as const;

/** Hauteur de bâti pour le lieu associé à une entrée (m/c/e/f/p/q). */
function heightForPlace(place: Tile['place']): number {
  switch (place) {
    case 'maison': return H.maison;
    case 'college': return H.college;
    case 'epicerie': return H.epicerie;
    default: return H.mur; // friche / parc / place : bâti générique
  }
}

const NEIGHBOURS: ReadonlyArray<[number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

/** Hauteur du bâti d'une tuile mur : son lieu si une entrée est adjacente, sinon mur générique. */
function buildingHeightAt(x: number, y: number): number {
  for (const [dx, dy] of NEIGHBOURS) {
    const t = tileAt(x + dx, y + dy);
    if (t && t.kind === 'entree' && t.place) {
      return heightForPlace(t.place);
    }
  }
  return H.mur;
}

export function hashMap(): string {
  // Identique à la grille : on ne rebuild que si la carte change.
  let h = MAP_W + 'x' + MAP_H;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = tileAt(x, y);
      if (t) h += ';' + x + ',' + y + ':' + t.kind + (t.place ?? '');
    }
  }
  return h;
}

/**
 * Convertit la grille logique en monde 3D (conforme charte HD-2D, LOI 2).
 * - Sol : toutes les tuiles franchissables (sol/herbe/terre/entrée/décor).
 * - Murs : un bloc par tuile `#`, hauteur selon le bâtiment adjacent (maison 3.6, collège 3.2,
 *   épicerie 2.6, mur générique 3.0) — LOI 2.
 * - Toit : bloc plat `role:'toit'` (épaisseur 0.5) au-dessus des murs qui appartiennent à un bâtiment.
 * - Entrées (« m/c/e/f/p/q ») : trou laissé ouvert (passage), seul le sol est posé.
 */
export function mapToWorld3D(): World3D {
  const ground: GroundTile[] = [];
  const blocks: Block3D[] = [];

  // Passe 1 — sol.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = tileAt(x, y);
      if (!tile) continue;
      if (tile.kind === 'mur') continue; // pas de sol sous un mur
      ground.push({ x, z: y });
    }
  }

  // Passe 2 — murs (+ toits sur les bâtiments).
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = tileAt(x, y);
      if (!tile || tile.kind !== 'mur') continue;

      const h = buildingHeightAt(x, y);
      blocks.push({ x, y: 0, z: y, w: 1, h, d: 1, role: 'mur' });

      // Toit plat au-dessus du mur si celui-ci fait partie d'un bâtiment (h > mur générique).
      if (h > H.mur) {
        blocks.push({ x, y: h, z: y, w: 1, h: H.toit, d: 1, role: 'toit' });
      }
    }
  }

  return { ground, blocks };
}