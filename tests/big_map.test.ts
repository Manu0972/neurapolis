/**
 * Grande carte (1 562 × 1 154 m) : quartiers qui pavent la carte, ville d'un seul tenant,
 * quartiers fermés jusqu'à leur palier (déplacement, bail), barrières à chaque passage.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { CITY_AREAS, CITY_H, CITY_W, areaAt } from '../src/data/city/layout';
import { CITY, PLACE_ANCHORS, isWalkable } from '../src/data/map';
import { ensureAscension } from '../src/simulation/ascension';
import { areaOpen, areaPassable, lockedAreas } from '../src/simulation/areas';
import { leaseEligibility } from '../src/simulation/economy';
import { moveToTile } from '../src/simulation/movement';
import { barrierRuns } from '../src/presentation/city3d/barriers';

/** Une tuile praticable au bord ouest d'un quartier dont la voisine (côté ouest) l'est aussi. */
function entryOf(id: string): { inX: number; inY: number; outX: number; outY: number } {
  const a = CITY_AREAS.find((ar) => ar.id === id)!;
  for (let y = a.y; y < a.y + a.h; y++) {
    if (isWalkable(a.x, y) && isWalkable(a.x - 1, y)) return { inX: a.x, inY: y, outX: a.x - 1, outY: y };
  }
  throw new Error(`pas d'entrée ouest pour ${id}`);
}

describe('grande carte', () => {
  it('fait 1 562 × 1 154 m et ses quartiers la pavent sans chevauchement', () => {
    expect(CITY_W).toBe(1562);
    expect(CITY_H).toBe(1154);
    expect(CITY_AREAS.reduce((s, a) => s + a.w * a.h, 0)).toBe(CITY_W * CITY_H);
    for (let y = 0; y < CITY_H; y += 7) {
      for (let x = 0; x < CITY_W; x += 7) {
        const inside = CITY_AREAS.filter((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h);
        expect(inside.length).toBe(1);
      }
    }
    expect(areaAt(10, 10).id).toBe('centre');
  });

  it('a des locaux aux identifiants uniques, chacun devant une porte praticable', () => {
    const ids = CITY.units.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(500);
    for (const u of CITY.units) expect(isWalkable(u.door.x, u.door.y)).toBe(true);
  });

  it('est d’un seul tenant : depuis la maison, on atteint chaque quartier à pied', () => {
    const start = PLACE_ANCHORS.maison;
    const seen = new Uint8Array(CITY_W * CITY_H);
    const reached = new Set<string>();
    const queue: number[] = [start.y * CITY_W + start.x];
    seen[queue[0]!] = 1;
    while (queue.length) {
      const i = queue.pop()!;
      const x = i % CITY_W;
      const y = (i - x) / CITY_W;
      reached.add(areaAt(x, y).id);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= CITY_W || ny >= CITY_H) continue;
        const j = ny * CITY_W + nx;
        if (seen[j] || !isWalkable(nx, ny)) continue;
        seen[j] = 1;
        queue.push(j);
      }
    }
    expect([...reached].sort()).toEqual(CITY_AREAS.map((a) => a.id).sort());
  });

  it('ferme les quartiers jusqu’à leur palier ; le bac à sable ouvre tout', () => {
    const w = createWorld();
    expect(lockedAreas(w).map((a) => a.id)).not.toContain('centre');
    expect(lockedAreas(w).length).toBe(CITY_AREAS.length - 1);
    const e = entryOf('gare_est');
    expect(areaOpen(w, e.inX, e.inY)).toBe(false);
    w.player.pos = { x: e.outX, y: e.outY };
    expect(moveToTile(w, e.inX, e.inY)).toBe(false);
    ensureAscension(w).tier = 2;
    expect(moveToTile(w, e.inX, e.inY)).toBe(true);
    const sandbox = createWorld({ sandbox: true });
    expect(lockedAreas(sandbox)).toEqual([]);
  });

  it('laisse sortir d’un quartier fermé si l’on s’y trouve déjà, et un drapeau ouvre en avance', () => {
    const w = createWorld();
    const e = entryOf('gare_est');
    expect(areaPassable(w, e.inX, e.inY, e.inX, e.inY + 1)).toBe(true);
    expect(areaPassable(w, e.inX, e.inY, e.outX, e.outY)).toBe(true);
    w.flags['quartier:gare_est'] = 1;
    expect(areaOpen(w, e.inX, e.inY)).toBe(true);
  });

  it('refuse un bail dans un quartier fermé et dit pourquoi', () => {
    const w = createWorld();
    w.player.age = 18;
    const far = CITY.units.find((u) => areaAt(u.door.x, u.door.y).id === 'faubourg')!;
    const res = leaseEligibility(w, far.id);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Faubourg Saint-Éloi');
    ensureAscension(w).tier = 3;
    expect(leaseEligibility(w, far.id).reason).not.toContain('pas encore ouvert');
  });

  it('pose des barrières à chaque quartier fermable', () => {
    const runs = barrierRuns();
    for (const a of CITY_AREAS.filter((ar) => ar.tier > 1)) {
      expect(runs.some((r) => r.inside === a.id)).toBe(true);
    }
    for (const r of runs) expect(r.inside).not.toBe(r.outside);
  });
});
