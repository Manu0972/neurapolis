/**
 * Terrains de la grande carte : parkings garnis, cours d'entrepôts, friches, jardins, stade.
 * Les grands objets bloquent toute leur emprise, sans jamais boucher une porte ou un arrêt.
 */
import { describe, expect, it } from 'vitest';
import { CITY, CITY_H, CITY_W } from '../src/data/city/layout';
import { BUS_STOPS } from '../src/data/city/transit';
import { isWalkable } from '../src/data/map';

const count = (kind: string): number => CITY.props.filter((p) => p.kind === kind).length;

describe('terrains embellis', () => {
  it('garnit parkings, cours, friches, jardins et stade', () => {
    expect(count('voiture')).toBeGreaterThan(300);
    expect(count('conteneur')).toBeGreaterThan(40);
    expect(count('camion')).toBeGreaterThan(10);
    expect(count('gravats')).toBeGreaterThan(30);
    expect(count('haie')).toBeGreaterThan(100);
    expect(count('but')).toBe(2);
    expect(CITY.props.filter((p) => p.variant === 'ambulance')).toHaveLength(2);
  });

  it('les grands objets restent dans la carte et bloquent leur emprise', () => {
    for (const p of CITY.props) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + (p.w ?? 1)).toBeLessThanOrEqual(CITY_W);
      expect(p.y + (p.h ?? 1)).toBeLessThanOrEqual(CITY_H);
    }
    const truck = CITY.props.find((p) => p.kind === 'camion')!;
    expect(isWalkable(truck.x + 1, truck.y + 5)).toBe(false);
  });

  it('ne bouche ni les arrêts de bus ni les portes des locaux', () => {
    for (const s of BUS_STOPS) expect(isWalkable(s.x, s.y)).toBe(true);
    for (const u of CITY.units) expect(isWalkable(u.door.x, u.door.y)).toBe(true);
  });
});
