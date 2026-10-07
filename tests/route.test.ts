/**
 * GPS (V1.1, lot B) : itinéraires à pied, destinations, conseil bus.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { isWalkable, PLACE_ANCHORS } from '../src/data/map';
import { busHint, findRoute, gpsDestinations, remainingMeters, searchDestinations } from '../src/simulation/route';

describe('GPS', () => {
  it('trouve un chemin praticable de chez toi au collège, sans traverser de mur', () => {
    const w = createWorld();
    const r = findRoute(w, PLACE_ANCHORS.maison, PLACE_ANCHORS.college);
    expect(r).not.toBeNull();
    const pts = r!.points;
    expect(pts.length).toBeGreaterThan(1);
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i]!, b = pts[i + 1]!;
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (let k = 0; k <= n; k++) {
        const x = a.x + ((b.x - a.x) * k) / Math.max(1, n), y = a.y + ((b.y - a.y) * k) / Math.max(1, n);
        expect(isWalkable(Math.floor(x), Math.floor(y))).toBe(true);
      }
    }
    // Au moins la distance à vol d'oiseau, et pas un détour absurde.
    const crow = Math.hypot(PLACE_ANCHORS.college.x - PLACE_ANCHORS.maison.x, PLACE_ANCHORS.college.y - PLACE_ANCHORS.maison.y);
    expect(r!.meters).toBeGreaterThanOrEqual(Math.floor(crow));
    expect(r!.meters).toBeLessThan(crow * 3 + 50);
    expect(remainingMeters(r!, PLACE_ANCHORS.maison).meters).toBeGreaterThan(r!.meters - 3);
  });

  it('est déterministe et rapide sur la grande carte', () => {
    const w = createWorld();
    w.economy!.sandbox = true; // toute la ville ouverte : le trajet le plus long possible
    const dest = gpsDestinations(w);
    const far = dest.filter((d) => d.kind === 'repere').sort((p, q) => Math.hypot(q.x - PLACE_ANCHORS.maison.x, q.y - PLACE_ANCHORS.maison.y) - Math.hypot(p.x - PLACE_ANCHORS.maison.x, p.y - PLACE_ANCHORS.maison.y));
    expect(far.length).toBeGreaterThan(0);
    const t0 = performance.now();
    const a = findRoute(w, PLACE_ANCHORS.maison, far[0]!);
    const b = findRoute(w, PLACE_ANCHORS.maison, far[0]!);
    const ms = (performance.now() - t0) / 2;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    console.log(`GPS : ${far[0]!.name} ${a ? `${a.meters} m, ${a.points.length} virages` : 'inaccessible (quartier fermé)'}, ${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(2000);
  });

  it('propose les lieux, les lieux remarquables et les arrêts, et la recherche ignore les accents', () => {
    const w = createWorld();
    const dest = gpsDestinations(w);
    expect(dest.some((d) => d.name === 'Chez toi')).toBe(true);
    expect(dest.some((d) => d.kind === 'arret')).toBe(true);
    expect(searchDestinations(dest, 'hopital').some((d) => d.name.includes('Hôpital'))).toBe(true);
    expect(searchDestinations(dest, '').length).toBe(dest.length);
    // Au départ, les quartiers des paliers suivants sont fermés : leurs repères sont marqués.
    expect(dest.some((d) => d.locked)).toBe(true);
    expect(dest.find((d) => d.name === 'Chez toi')!.locked).toBe(false);
  });

  it('ne propose pas le bus pour un trajet court', () => {
    expect(busHint({ x: 10, y: 10 }, { x: 20, y: 10 }, 12)).toBeNull();
  });
});
