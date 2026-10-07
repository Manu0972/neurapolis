import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MAP_W, MAP_H, entranceAt, isWalkable } from '../src/data/map';
import {
  convertMapToWorld3D,
  BUILDING_SPECS,
  GENERIC_WALL_HEIGHT,
  LINTEL_CLEARANCE_HEIGHT,
  ROOF_THICKNESS,
  isDoorPassageFree,
  getBuildingRoofTop,
  getBuildingWallHeight,
} from '../src/rendering/mapToWorld3d';
import { WorldBuilder } from '../src/rendering/WorldBuilder';

describe('Real Grid 3D Integration J3D-2 (mapToWorld3d)', () => {
  const world = convertMapToWorld3D();

  it('1. ground tiles count exceeds 960 and 1200 thresholds', () => {
    expect(world.ground.length).toBeGreaterThanOrEqual(960);
    expect(world.ground.length).toBeGreaterThanOrEqual(1200);
    // 48 x 32 = 1536 total tiles minus 253 wall tiles = exactly 1283 tiles
    expect(world.ground.length).toBe(1283);
  });

  it('2. ground tiles contain sol, herbe, terre, and entree types', () => {
    const kinds = new Set(world.ground.map((g) => g.kind));
    expect(kinds.has('sol')).toBe(true);
    expect(kinds.has('herbe')).toBe(true);
    expect(kinds.has('terre')).toBe(true);
    expect(kinds.has('entree')).toBe(true);

    const counts = world.ground.reduce<Record<string, number>>((acc, g) => {
      const k = g.kind ?? 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    expect(counts['sol']).toBe(806);
    expect(counts['herbe']).toBeGreaterThan(100);
    expect(counts['terre']).toBeGreaterThan(100);
    expect(counts['entree']).toBe(6); // m, c, e, f, p, q
  });

  it('3. grid dimensions strictly match MAP_W (48) and MAP_H (32)', () => {
    expect(MAP_W).toBe(48);
    expect(MAP_H).toBe(32);

    for (const tile of world.ground) {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThan(MAP_W);
      expect(tile.z).toBeGreaterThanOrEqual(0);
      expect(tile.z).toBeLessThan(MAP_H);
    }

    // Ground tiles are internal to perimeter boundary walls (x: 1..46, z: 1..30)
    const groundMaxX = Math.max(...world.ground.map((g) => g.x));
    const groundMinX = Math.min(...world.ground.map((g) => g.x));
    expect(groundMinX).toBe(1);
    expect(groundMaxX).toBe(MAP_W - 2); // 46

    // Total 3D world (ground + boundary wall blocks) spans exactly [0, 47] x [0, 31]
    const allX = [...world.ground.map((g) => g.x), ...world.blocks.map((b) => b.x)];
    const allZ = [...world.ground.map((g) => g.z), ...world.blocks.map((b) => b.z)];
    expect(Math.min(...allX)).toBe(0);
    expect(Math.max(...allX)).toBe(MAP_W - 1); // 47
    expect(Math.min(...allZ)).toBe(0);
    expect(Math.max(...allZ)).toBe(MAP_H - 1); // 31
  });

  it('4. Collège wall height is 3.2 and roof top height is 3.7', () => {
    const collegeWalls = world.blocks.filter(
      (b) => b.placeId === 'college' && b.role === 'mur'
    );
    expect(collegeWalls.length).toBe(35);
    for (const wall of collegeWalls) {
      expect(wall.h).toBe(3.2);
      expect(wall.y).toBe(0);
    }

    const collegeRoof = world.blocks.find(
      (b) => b.placeId === 'college' && b.role === 'toit'
    );
    expect(collegeRoof).toBeDefined();
    expect(collegeRoof!.y).toBe(3.2);
    expect(collegeRoof!.h).toBe(0.5);
    expect(collegeRoof!.y + collegeRoof!.h).toBe(3.7);

    expect(getBuildingWallHeight('college')).toBe(3.2);
    expect(getBuildingRoofTop('college')).toBe(3.7);
  });

  it('5. Épicerie wall height is 2.6 and roof top height is 3.1', () => {
    const epicerieWalls = world.blocks.filter(
      (b) => b.placeId === 'epicerie' && b.role === 'mur'
    );
    expect(epicerieWalls.length).toBe(19);
    for (const wall of epicerieWalls) {
      expect(wall.h).toBe(2.6);
      expect(wall.y).toBe(0);
    }

    const epicerieRoof = world.blocks.find(
      (b) => b.placeId === 'epicerie' && b.role === 'toit'
    );
    expect(epicerieRoof).toBeDefined();
    expect(epicerieRoof!.y).toBe(2.6);
    expect(epicerieRoof!.h).toBe(0.5);
    expect(epicerieRoof!.y + epicerieRoof!.h).toBe(3.1);

    expect(getBuildingWallHeight('epicerie')).toBe(2.6);
    expect(getBuildingRoofTop('epicerie')).toBe(3.1);
  });

  it('6. Maison wall height is 3.6 and roof top height is 4.1', () => {
    const maisonWalls = world.blocks.filter(
      (b) => b.placeId === 'maison' && b.role === 'mur'
    );
    expect(maisonWalls.length).toBe(29);
    for (const wall of maisonWalls) {
      expect(wall.h).toBe(3.6);
      expect(wall.y).toBe(0);
    }

    const maisonRoof = world.blocks.find(
      (b) => b.placeId === 'maison' && b.role === 'toit'
    );
    expect(maisonRoof).toBeDefined();
    expect(maisonRoof!.y).toBe(3.6);
    expect(maisonRoof!.h).toBe(0.5);
    expect(maisonRoof!.y + maisonRoof!.h).toBe(4.1);

    expect(getBuildingWallHeight('maison')).toBe(3.6);
    expect(getBuildingRoofTop('maison')).toBe(4.1);
  });

  it('7. generic boundary walls have wall height 3.0', () => {
    const genericWalls = world.blocks.filter(
      (b) => b.role === 'mur' && !b.placeId
    );
    expect(genericWalls.length).toBe(170);
    for (const wall of genericWalls) {
      expect(wall.h).toBe(GENERIC_WALL_HEIGHT);
      expect(wall.h).toBe(3.0);
      expect(wall.y).toBe(0);
    }
  });

  it('8. door lintels exist at Y >= 1.7 for all three buildings', () => {
    const lintels = world.blocks.filter((b) => b.role === 'linteau');
    expect(lintels.length).toBe(3);

    const collegeLintel = lintels.find((b) => b.placeId === 'college');
    expect(collegeLintel).toBeDefined();
    expect(collegeLintel!.x).toBe(8);
    expect(collegeLintel!.z).toBe(8);
    expect(collegeLintel!.y).toBe(1.7);
    expect(collegeLintel!.h).toBe(1.5); // 3.2 - 1.7 = 1.5
    expect(collegeLintel!.y + collegeLintel!.h).toBe(3.2);

    const epicerieLintel = lintels.find((b) => b.placeId === 'epicerie');
    expect(epicerieLintel).toBeDefined();
    expect(epicerieLintel!.x).toBe(23);
    expect(epicerieLintel!.z).toBe(7);
    expect(epicerieLintel!.y).toBe(1.7);
    expect(epicerieLintel!.h).toBe(0.9); // 2.6 - 1.7 = 0.9
    expect(epicerieLintel!.y + epicerieLintel!.h).toBe(2.6);

    const maisonLintel = lintels.find((b) => b.placeId === 'maison');
    expect(maisonLintel).toBeDefined();
    expect(maisonLintel!.x).toBe(38);
    expect(maisonLintel!.z).toBe(15);
    expect(maisonLintel!.y).toBe(1.7);
    expect(maisonLintel!.h).toBe(1.9); // 3.6 - 1.7 = 1.9
    expect(maisonLintel!.y + maisonLintel!.h).toBeCloseTo(3.6);
  });

  it('9. passage is completely free for Y in [0, 1.7] at door coordinates', () => {
    // Collège door 'c' in (8, 8)
    expect(isDoorPassageFree(world, 8, 8, LINTEL_CLEARANCE_HEIGHT)).toBe(true);
    // Épicerie door 'e' in (23, 7)
    expect(isDoorPassageFree(world, 23, 7, LINTEL_CLEARANCE_HEIGHT)).toBe(true);
    // Maison door 'm' in (38, 15)
    expect(isDoorPassageFree(world, 38, 15, LINTEL_CLEARANCE_HEIGHT)).toBe(true);

    // Verify manually that no block intersects the walking clearance volume
    for (const [place, spec] of Object.entries(BUILDING_SPECS)) {
      const { x: dx, y: dz } = spec.door;
      const blockingBelow17 = world.blocks.filter((b) => {
        const inX = dx >= b.x && dx < b.x + b.w;
        const inZ = dz >= b.z && dz < b.z + b.d;
        return inX && inZ && b.y < 1.7;
      });
      expect(
        blockingBelow17.length,
        `Door for ${place} at (${dx}, ${dz}) must have 0 blocking blocks below 1.7m`
      ).toBe(0);
    }
  });

  it('10. building roofs cover exact architectural footprints', () => {
    const collegeRoof = world.blocks.find(
      (b) => b.role === 'toit' && b.placeId === 'college'
    );
    expect(collegeRoof).toMatchObject({
      x: 2,
      z: 2,
      w: 13,
      d: 7,
      h: ROOF_THICKNESS,
    });

    const epicerieRoof = world.blocks.find(
      (b) => b.role === 'toit' && b.placeId === 'epicerie'
    );
    expect(epicerieRoof).toMatchObject({
      x: 20,
      z: 3,
      w: 7,
      d: 5,
      h: ROOF_THICKNESS,
    });

    const maisonRoof = world.blocks.find(
      (b) => b.role === 'toit' && b.placeId === 'maison'
    );
    expect(maisonRoof).toMatchObject({
      x: 33,
      z: 10,
      w: 11,
      d: 6,
      h: ROOF_THICKNESS,
    });
  });

  it('11. door locations match map.ts entrance declarations and are walkable', () => {
    expect(entranceAt(8, 8)).toBe('college');
    expect(entranceAt(23, 7)).toBe('epicerie');
    expect(entranceAt(38, 15)).toBe('maison');
    expect(entranceAt(4, 21)).toBe('friche');
    expect(entranceAt(22, 22)).toBe('parc');
    expect(entranceAt(16, 14)).toBe('place');

    expect(isWalkable(8, 8)).toBe(true);
    expect(isWalkable(23, 7)).toBe(true);
    expect(isWalkable(38, 15)).toBe(true);
  });

  it('12. converter output is 100% deterministic and pure across multiple calls', () => {
    const run1 = convertMapToWorld3D();
    const run2 = convertMapToWorld3D();

    expect(run1.ground.length).toBe(run2.ground.length);
    expect(run1.blocks.length).toBe(run2.blocks.length);

    expect(run1.ground).toEqual(run2.ground);
    expect(run1.blocks).toEqual(run2.blocks);
  });

  it('13. WorldBuilder can instantiate Three.js scene from converted World3D', () => {
    const scene = new THREE.Scene();
    WorldBuilder.buildWorld(scene, world);

    const worldGroup = scene.getObjectByName('WorldGroup');
    expect(worldGroup).toBeDefined();
    expect(worldGroup instanceof THREE.Group).toBe(true);

    // Group should contain meshes for all ground tiles (1283) + blocks (259) = 1542 meshes
    const children = (worldGroup as THREE.Group).children;
    expect(children.length).toBe(1283 + 259);
  });
});
