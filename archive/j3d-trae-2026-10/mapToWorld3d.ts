// src/rendering/mapToWorld3d.ts
/**
 * Convertisseur pur et déterministe de la grille logique 48×32 (src/data/map.ts)
 * vers le contrat 3D World3D (src/rendering/world3d.ts).
 *
 * Loi 1 : lecture seule de map.ts, aucune mutation d'état de simulation.
 * Hauteurs de référence HD-2D :
 * - Collège : murs 3.2 m, toit +0.5 = 3.7 m, porte 'c' en (8,8) libre [0, 1.7] avec linteau [1.7, 3.2]
 * - Épicerie : murs 2.6 m, toit +0.5 = 3.1 m, porte 'e' en (23,7) libre [0, 1.7] avec linteau [1.7, 2.6]
 * - Maison : murs 3.6 m, toit +0.5 = 4.1 m, porte 'm' en (38,15) libre [0, 1.7] avec linteau [1.7, 3.6]
 * - Murs génériques de bordure / murets : hauteur 3.0 m
 */

import { MAP_W, MAP_H, tileAt } from '../data/map';
import type { World3D, GroundTile, Block3D } from './world3d';

export interface BuildingSpec {
  readonly placeId: string;
  readonly name: string;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly wallHeight: number;
  readonly roofExtra: number;
  readonly roofHeight: number;
  readonly door: { readonly x: number; readonly y: number; readonly char: string };
  readonly lintelBottom: number;
}

export const LINTEL_CLEARANCE_HEIGHT = 1.7;
export const GENERIC_WALL_HEIGHT = 3.0;
export const ROOF_THICKNESS = 0.5;

export const BUILDING_SPECS: Record<string, BuildingSpec> = {
  college: {
    placeId: 'college',
    name: 'Collège',
    minX: 2,
    maxX: 14,
    minY: 2,
    maxY: 8,
    wallHeight: 3.2,
    roofExtra: ROOF_THICKNESS,
    roofHeight: 3.7,
    door: { x: 8, y: 8, char: 'c' },
    lintelBottom: LINTEL_CLEARANCE_HEIGHT,
  },
  epicerie: {
    placeId: 'epicerie',
    name: 'Épicerie',
    minX: 20,
    maxX: 26,
    minY: 3,
    maxY: 7,
    wallHeight: 2.6,
    roofExtra: ROOF_THICKNESS,
    roofHeight: 3.1,
    door: { x: 23, y: 7, char: 'e' },
    lintelBottom: LINTEL_CLEARANCE_HEIGHT,
  },
  maison: {
    placeId: 'maison',
    name: 'Maison',
    minX: 33,
    maxX: 43,
    minY: 10,
    maxY: 15,
    wallHeight: 3.6,
    roofExtra: ROOF_THICKNESS,
    roofHeight: 4.1,
    door: { x: 38, y: 15, char: 'm' },
    lintelBottom: LINTEL_CLEARANCE_HEIGHT,
  },
};

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function findBuildingAt(x: number, y: number): BuildingSpec | undefined {
  for (const spec of Object.values(BUILDING_SPECS)) {
    if (x >= spec.minX && x <= spec.maxX && y >= spec.minY && y <= spec.maxY) {
      return spec;
    }
  }
  return undefined;
}

/**
 * Convertit la carte 48×32 en une structure World3D.
 */
export function convertMapToWorld3D(): World3D {
  const ground: GroundTile[] = [];
  const blocks: Block3D[] = [];

  // 1. Dalles de sol (toutes les tuiles praticables de la grille)
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = tileAt(x, y);
      if (!tile) continue;

      if (tile.kind !== 'mur') {
        let kind: string = tile.kind;
        if (kind === 'decor') {
          // Si c'est un décor, le revêtement au sol correspond au terrain d'assise
          kind = (y >= 20 && x >= 19) ? 'herbe' : 'sol';
        }
        ground.push({
          x,
          z: y,
          kind,
        });
      }
    }
  }

  // 2. Murs et volumes de bâtiments
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = tileAt(x, y);
      if (!tile) continue;

      if (tile.kind === 'mur') {
        const building = findBuildingAt(x, y);
        if (building) {
          blocks.push({
            x,
            y: 0,
            z: y,
            w: 1,
            h: building.wallHeight,
            d: 1,
            role: 'mur',
            placeId: building.placeId,
          });
        } else {
          // Murs d'enceinte et murets extérieurs
          blocks.push({
            x,
            y: 0,
            z: y,
            w: 1,
            h: GENERIC_WALL_HEIGHT,
            d: 1,
            role: 'mur',
          });
        }
      }
    }
  }

  // 3. Linteaux de porte et toits architecturaux pour chaque bâtiment
  for (const spec of Object.values(BUILDING_SPECS)) {
    // Linteau au-dessus de la porte : passage libre [0, 1.7], bloc de 1.7 à wallHeight
    const lintelHeight = round2(spec.wallHeight - LINTEL_CLEARANCE_HEIGHT);
    if (lintelHeight > 0) {
      blocks.push({
        x: spec.door.x,
        y: LINTEL_CLEARANCE_HEIGHT,
        z: spec.door.y,
        w: 1,
        h: lintelHeight,
        d: 1,
        role: 'linteau',
        placeId: spec.placeId,
      });
    }

    // Volume du toit couvrant l'empreinte du bâtiment
    const buildingWidth = spec.maxX - spec.minX + 1;
    const buildingDepth = spec.maxY - spec.minY + 1;
    blocks.push({
      x: spec.minX,
      y: spec.wallHeight,
      z: spec.minY,
      w: buildingWidth,
      h: spec.roofExtra,
      d: buildingDepth,
      role: 'toit',
      placeId: spec.placeId,
    });
  }

  return { ground, blocks };
}

/**
 * Vérifie si le passage à une coordonnée de porte est libre sous une hauteur donnée (défaut 1.7 m).
 */
export function isDoorPassageFree(world: World3D, doorX: number, doorZ: number, maxHeight = LINTEL_CLEARANCE_HEIGHT): boolean {
  const blockingBlocks = world.blocks.filter((b) => {
    const insideX = doorX >= b.x && doorX < b.x + b.w;
    const insideZ = doorZ >= b.z && doorZ < b.z + b.d;
    if (!insideX || !insideZ) return false;
    // Vérifie si le bloc s'étend dans l'intervalle [0, maxHeight)
    return b.y < maxHeight;
  });
  return blockingBlocks.length === 0;
}

/**
 * Retourne la hauteur sommital du toit d'un bâtiment (wallHeight + roofExtra).
 */
export function getBuildingRoofTop(placeId: string): number | undefined {
  const spec = BUILDING_SPECS[placeId];
  return spec ? spec.roofHeight : undefined;
}

/**
 * Retourne la hauteur des murs d'un bâtiment.
 */
export function getBuildingWallHeight(placeId: string): number | undefined {
  const spec = BUILDING_SPECS[placeId];
  return spec ? spec.wallHeight : undefined;
}
