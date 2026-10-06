/**
 * Ville de Val-Ferrand (1 tuile = 1 m) : cohérence des données de la ville et de la grille.
 * Ces invariants protègent la simulation (collisions, entrées) et le rendu 3D (aucun chevauchement).
 */
import { describe, expect, it } from 'vitest';
import { CITY, CITY_W, CITY_H } from '../src/data/city/layout';
import { PLACE_ANCHORS, entranceAt, isWalkable, tileAt, unitAt, surfaceAt, streetNameAt, MAP_W, MAP_H } from '../src/data/map';
import type { PlaceId } from '../src/core/types';

const PLACES: PlaceId[] = ['maison', 'college', 'epicerie', 'friche', 'parc', 'place'];

/** Tuiles franchissables atteignables depuis un point (4-connexité). */
function reachableFrom(x0: number, y0: number): Set<number> {
  const seen = new Set<number>([y0 * CITY_W + x0]);
  const stack = [[x0, y0]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x! + dx!;
      const ny = y! + dy!;
      const k = ny * CITY_W + nx;
      if (seen.has(k) || !isWalkable(nx, ny)) continue;
      seen.add(k);
      stack.push([nx, ny]);
    }
  }
  return seen;
}

describe('Ville — grille et lieux', () => {
  it('la carte fait plusieurs centaines de mètres (échelle Big Ambitions)', () => {
    expect(MAP_W).toBe(CITY_W);
    expect(MAP_H).toBe(CITY_H);
    expect(MAP_W * MAP_H).toBeGreaterThan(60_000);
  });

  it('chaque lieu a une ancre franchissable devant son entrée', () => {
    for (const p of PLACES) {
      const a = PLACE_ANCHORS[p];
      expect(isWalkable(a.x, a.y), p).toBe(true);
      const doors = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dx, dy]) => entranceAt(a.x + dx!, a.y + dy!) === p);
      expect(doors.length, p).toBe(1);
    }
  });

  it('tous les lieux et tous les locaux sont reliés à pied depuis la maison', () => {
    const home = PLACE_ANCHORS.maison;
    const reach = reachableFrom(home.x, home.y);
    for (const p of PLACES) {
      const a = PLACE_ANCHORS[p];
      expect(reach.has(a.y * CITY_W + a.x), `lieu ${p}`).toBe(true);
    }
    for (const u of CITY.units) {
      expect(reach.has(u.door.y * CITY_W + u.door.x), `local ${u.id}`).toBe(true);
    }
  });

  it('les bâtiments ne se chevauchent pas et restent hors de la chaussée', () => {
    const occ = new Map<number, string>();
    for (const b of CITY.buildings) {
      for (let y = b.y; y < b.y + b.d; y++) {
        for (let x = b.x; x < b.x + b.w; x++) {
          const k = y * CITY_W + x;
          expect(occ.get(k), `${b.id} chevauche ${occ.get(k)} en (${x},${y})`).toBeUndefined();
          occ.set(k, b.id);
        }
      }
      for (const r of CITY.roads) {
        const overlap = b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.d > r.y;
        expect(overlap, `${b.id} empiète sur ${r.name}`).toBe(false);
      }
    }
  });

  it('propose au moins 20 locaux commerciaux, avec loyer et trafic cohérents', () => {
    expect(CITY.units.length).toBeGreaterThanOrEqual(20);
    const ids = new Set(CITY.units.map((u) => u.id));
    expect(ids.size).toBe(CITY.units.length);
    for (const u of CITY.units) {
      expect(unitAt(u.door.x, u.door.y)).toBe(u.id);
      expect(u.sizeM2).toBeGreaterThan(60);
      expect(u.baseRentPerDay).toBeGreaterThan(0);
      expect(u.address).toMatch(/^\d+ /);
    }
    // L'avenue Jean-Jaurès est plus passante, donc plus chère au m², qu'une rue calme.
    const jaures = CITY.units.filter((u) => u.street === 'Avenue Jean-Jaurès');
    const calmes = CITY.units.filter((u) => u.footTraffic <= 40);
    expect(jaures.length).toBeGreaterThan(3);
    if (calmes.length > 0) {
      const perM2 = (us: typeof CITY.units): number => us.reduce((s, u) => s + u.baseRentPerDay / u.sizeM2, 0) / us.length;
      expect(perM2(jaures)).toBeGreaterThan(perM2(calmes));
    }
  });

  it('les revêtements sont renseignés : chaussée, trottoir, eau du canal', () => {
    const road = CITY.roads.find((r) => r.name === 'Avenue Jean-Jaurès')!;
    expect(surfaceAt(road.x + 20, road.y + 4)).toBe('chaussee');
    expect(isWalkable(road.x + 20, road.y + 4)).toBe(true);
    expect(surfaceAt(10, CITY.canal.y + 2)).toBe('eau');
    expect(isWalkable(10, CITY.canal.y + 2)).toBe(false);
    expect(streetNameAt(road.x + 20, road.y + 4)).toBe('Avenue Jean-Jaurès');
    expect(tileAt(-1, 0)).toBeNull();
    expect(tileAt(CITY_W, 0)).toBeNull();
  });
});
