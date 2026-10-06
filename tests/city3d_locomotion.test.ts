/**
 * Locomotion continue à la troisième personne et chemins des PNJ (logique pure, sans WebGL).
 */
import { describe, expect, it } from 'vitest';
import { BODY_RADIUS, RUN_SPEED, WALK_SPEED, cameraRelative, findPath, fits, headingOf, stepBody, tileOf, type BodyState } from '../src/presentation/city3d/locomotion';
import { CITY, MAP_H, MAP_W, PLACE_ANCHORS, isWalkable } from '../src/data/map';

const start = (): BodyState => ({ x: PLACE_ANCHORS.maison.x + 0.5, z: PLACE_ANCHORS.maison.y + 0.5, heading: 0, speed: 0 });

describe('caméra relative', () => {
  it('« haut » avance dans la direction regardée par la caméra', () => {
    // Caméra au sud (yaw 0) : haut = nord (-z).
    const n = cameraRelative(0, -1, 0);
    expect(n.x).toBeCloseTo(0);
    expect(n.z).toBeCloseTo(-1);
    // Caméra à l'est (yaw π/2) : elle regarde vers l'ouest.
    const w = cameraRelative(0, -1, Math.PI / 2);
    expect(w.x).toBeCloseTo(-1);
    expect(w.z).toBeCloseTo(0);
    // Droite avec caméra au sud = est.
    const e = cameraRelative(1, 0, 0);
    expect(e.x).toBeCloseTo(1);
    expect(e.z).toBeCloseTo(0);
  });

  it('les diagonales ne vont pas plus vite', () => {
    const d = cameraRelative(1, -1, 0.7);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });

  it('le cap regarde dans la direction du mouvement', () => {
    expect(headingOf(0, -1)).toBeCloseTo(0);
    expect(Math.abs(headingOf(0, 1))).toBeCloseTo(Math.PI);
  });
});

describe('marche continue', () => {
  it('accélère jusqu’à la vitesse de marche puis de course', () => {
    let b = start();
    // Le joueur sort de chez lui vers le nord (la rue) : on avance quelques images.
    for (let i = 0; i < 30; i++) b = stepBody(b, { x: 0, y: -1 }, 0, 1 / 60, false, isWalkable);
    expect(b.speed).toBeGreaterThan(WALK_SPEED * 0.8);
    expect(b.speed).toBeLessThanOrEqual(WALK_SPEED + 0.05);
    for (let i = 0; i < 60; i++) b = stepBody(b, { x: 1, y: 0 }, 0, 1 / 60, true, isWalkable);
    expect(b.speed).toBeGreaterThan(WALK_SPEED);
    expect(b.speed).toBeLessThanOrEqual(RUN_SPEED + 0.05);
  });

  it('ne traverse jamais un mur et glisse le long', () => {
    const college = CITY.buildings.find((b) => b.id === 'college')!;
    let b: BodyState = { x: college.x + 5.5, z: college.y + college.d + 1.2, heading: 0, speed: 0 };
    for (let i = 0; i < 240; i++) {
      b = stepBody(b, { x: 0.4, y: -1 }, 0, 1 / 60, true, isWalkable);
      expect(fits(b.x, b.z, isWalkable)).toBe(true);
    }
    expect(b.z).toBeGreaterThanOrEqual(college.y + college.d + BODY_RADIUS - 1e-6);
    expect(b.x).toBeGreaterThan(college.x + 5.5); // a glissé vers l'est
  });

  it('10 000 pas aléatoires restent sur des tuiles franchissables', () => {
    let b = start();
    let s = 12345;
    const rnd = (): number => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < 10_000; i++) {
      b = stepBody(b, { x: rnd() * 2 - 1, y: rnd() * 2 - 1 }, rnd() * 6.28, 1 / 30, rnd() > 0.5, isWalkable);
      const t = tileOf(b);
      expect(isWalkable(t.x, t.y)).toBe(true);
    }
  });
});

describe('chemins des PNJ', () => {
  it('relie la maison au collège par les rues, sans traverser de bâtiment', () => {
    const path = findPath(PLACE_ANCHORS.maison, PLACE_ANCHORS.college, isWalkable, MAP_W, MAP_H);
    expect(path.length).toBeGreaterThan(0);
    const last = path[path.length - 1]!;
    expect(Math.floor(last.x)).toBe(PLACE_ANCHORS.college.x);
    expect(Math.floor(last.z)).toBe(PLACE_ANCHORS.college.y);
    let prev = { x: PLACE_ANCHORS.maison.x + 0.5, z: PLACE_ANCHORS.maison.y + 0.5 };
    for (const p of path) {
      const steps = Math.ceil(Math.hypot(p.x - prev.x, p.z - prev.z) / 0.25);
      for (let k = 0; k <= steps; k++) {
        const x = prev.x + ((p.x - prev.x) * k) / steps;
        const z = prev.z + ((p.z - prev.z) * k) / steps;
        expect(isWalkable(Math.floor(x), Math.floor(z))).toBe(true);
      }
      prev = p;
    }
  });

  it('renvoie un chemin vide vers une tuile inaccessible', () => {
    const college = CITY.buildings.find((b) => b.id === 'college')!;
    expect(findPath(PLACE_ANCHORS.maison, { x: college.x + 3, y: college.y + 3 }, isWalkable, MAP_W, MAP_H)).toEqual([]);
  });
});
