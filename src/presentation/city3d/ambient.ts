/**
 * Vie d'ambiance de la ville (présentation pure, n'écrit jamais l'état du monde) :
 *  - voitures qui roulent à droite sur la trame des rues, tournent aux carrefours et
 *    s'arrêtent devant un piéton ;
 *  - passants qui font le tour des îlots sur les trottoirs.
 * Le hasard vient de `visualRng`, jamais du PRNG du monde.
 */
import * as THREE from 'three';
import { CITY, CITY_W, ROAD_W } from '../../data/city/layout';
import {
  VALID_HAIR_COLORS, VALID_HAIR_STYLES, VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES, type PlayerAppearance,
} from '../../core/types';
import { createCharacter, type Character3D } from './simpleCharacter';
import { visualRng } from './textures';

const VX = [...new Set(CITY.roads.filter((r) => r.axis === 'v').map((r) => r.x))].sort((a, b) => a - b);
const HY = [...new Set(CITY.roads.filter((r) => r.axis === 'h').map((r) => r.y))].sort((a, b) => a - b);
const ROAD_END_Z = Math.max(...CITY.roads.filter((r) => r.axis === 'v').map((r) => r.y + r.h));

// Voies : on roule à droite. Route horizontale à hy : vers l'est z = hy + 5.8, vers l'ouest z = hy + 2.2.
// Route verticale à vx : vers le sud x = vx + 2.2, vers le nord x = vx + 5.8.
const laneZ = (hy: number, dir: number): number => hy + (dir > 0 ? ROAD_W - 2.2 : 2.2);
const laneX = (vx: number, dir: number): number => vx + (dir > 0 ? 2.2 : ROAD_W - 2.2);

interface Car {
  axis: 'h' | 'v';
  dir: 1 | -1;
  /** Route courante : hy si axis = h, vx si axis = v. */
  road: number;
  /** Position le long de l'axe. */
  s: number;
  speed: number;
  cruise: number;
  /** Dernier carrefour franchi (évite de décider deux fois). */
  lastCross: number;
  mesh: THREE.Group;
  shown: THREE.Vector3;
  heading: number;
  headlights: THREE.MeshStandardMaterial;
  rnd: () => number;
}

const CAR_COLORS = ['#b8352c', '#2f5d8a', '#e8e2d4', '#2b2b2e', '#6a7a3a', '#c9a227', '#8c8f94', '#4a2f5e', '#d9733a'];

function carMesh(color: string, shared: { body: THREE.BufferGeometry; cabin: THREE.BufferGeometry; wheel: THREE.BufferGeometry; glass: THREE.Material; tire: THREE.Material; mats: Map<string, THREE.MeshStandardMaterial> }, van: boolean): { g: THREE.Group; lights: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  let paint = shared.mats.get(color);
  if (!paint) {
    paint = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 });
    shared.mats.set(color, paint);
  }
  const body = new THREE.Mesh(shared.body, paint);
  body.position.y = 0.55;
  if (van) body.scale.set(1.05, 1.1, 1.15);
  const cabin = new THREE.Mesh(shared.cabin, shared.glass);
  cabin.position.set(0, van ? 1.35 : 1.15, van ? -0.3 : 0.15);
  if (van) cabin.scale.set(1.02, 1.5, 1.6);
  const lights = new THREE.MeshStandardMaterial({ color: '#fff6dd', emissive: new THREE.Color('#ffe9b0'), emissiveIntensity: 0 });
  for (const side of [-0.6, 0.6]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), lights);
    l.position.set(side, 0.65, -2.13);
    g.add(l);
  }
  g.add(body, cabin);
  for (const [x, z] of [[-0.8, -1.35], [0.8, -1.35], [-0.8, 1.35], [0.8, 1.35]] as const) {
    const w = new THREE.Mesh(shared.wheel, shared.tire);
    w.position.set(x, 0.33, z);
    g.add(w);
  }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  return { g, lights };
}

export interface Ambient {
  group: THREE.Group;
  update(dt: number, player: { x: number; z: number }, night: number): void;
  dispose(): void;
}

export function createAmbient(opts: { cars?: number; pedestrians?: number } = {}): Ambient {
  const group = new THREE.Group();
  group.name = 'ambiance';
  const rnd = visualRng(9001);
  const shared = {
    body: new THREE.BoxGeometry(1.8, 0.75, 4.2),
    cabin: new THREE.BoxGeometry(1.6, 0.55, 2.1),
    wheel: new THREE.CylinderGeometry(0.33, 0.33, 0.24, 12).rotateZ(Math.PI / 2),
    glass: new THREE.MeshStandardMaterial({ color: '#2b3846', roughness: 0.1, metalness: 0.6 }),
    tire: new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.9 }),
    mats: new Map<string, THREE.MeshStandardMaterial>(),
  };

  // ----- Voitures -----
  const cars: Car[] = [];
  const nCars = opts.cars ?? 26;
  for (let i = 0; i < nCars; i++) {
    const r = visualRng(500 + i * 17);
    const axis: 'h' | 'v' = r() > 0.5 ? 'h' : 'v';
    const dir: 1 | -1 = r() > 0.5 ? 1 : -1;
    const road = axis === 'h' ? HY[Math.floor(r() * HY.length)]! : VX[Math.floor(r() * VX.length)]!;
    const s = axis === 'h' ? 10 + r() * (CITY_W - 20) : 10 + r() * (ROAD_END_Z - 20);
    const { g, lights } = carMesh(CAR_COLORS[Math.floor(r() * CAR_COLORS.length)]!, shared, r() > 0.85);
    group.add(g);
    const cruise = 8 + r() * 4;
    cars.push({ axis, dir, road, s, speed: cruise, cruise, lastCross: -1, mesh: g, shown: new THREE.Vector3(), heading: 0, headlights: lights, rnd: r });
  }

  const carPos = (c: Car): { x: number; z: number } =>
    c.axis === 'h' ? { x: c.s, z: laneZ(c.road, c.dir) } : { x: laneX(c.road, c.dir), z: c.s };

  /** Au centre d'un carrefour, la voiture choisit : tout droit, à droite, à gauche (ou demi-tour en impasse). */
  function decide(c: Car, crossAt: number): void {
    const options: { axis: 'h' | 'v'; dir: 1 | -1; road: number; s: number }[] = [];
    if (c.axis === 'h') {
      const vx = crossAt;
      const iV = VX.indexOf(vx);
      if ((c.dir > 0 && iV < VX.length - 1) || (c.dir < 0 && iV > 0)) options.push({ axis: 'h', dir: c.dir, road: c.road, s: c.s });
      const iH = HY.indexOf(c.road);
      if (iH < HY.length - 1) options.push({ axis: 'v', dir: 1, road: vx, s: laneZ(c.road, c.dir) });
      if (iH > 0) options.push({ axis: 'v', dir: -1, road: vx, s: laneZ(c.road, c.dir) });
    } else {
      const hy = crossAt;
      const iH = HY.indexOf(hy);
      if ((c.dir > 0 && iH < HY.length - 1) || (c.dir < 0 && iH > 0)) options.push({ axis: 'v', dir: c.dir, road: c.road, s: c.s });
      const iV = VX.indexOf(c.road);
      if (iV < VX.length - 1) options.push({ axis: 'h', dir: 1, road: hy, s: laneX(c.road, c.dir) });
      if (iV > 0) options.push({ axis: 'h', dir: -1, road: hy, s: laneX(c.road, c.dir) });
    }
    // Tout droit plus probable.
    const straight = options.find((o) => o.axis === c.axis);
    const pick = straight && c.rnd() < 0.55 ? straight : options[Math.floor(c.rnd() * options.length)];
    if (!pick) { c.dir = (c.dir * -1) as 1 | -1; return; }
    c.axis = pick.axis;
    c.dir = pick.dir;
    c.road = pick.road;
    c.s = pick.s;
  }

  // ----- Passants -----
  interface Walker { ch: Character3D; loop: { x: number; z: number }[]; seg: number; t: number; speed: number; pos: THREE.Vector3 }
  const walkers: Walker[] = [];
  const nPed = opts.pedestrians ?? 34;
  const blocks = CITY.blocks;
  for (let i = 0; i < nPed; i++) {
    const r = visualRng(7000 + i * 31);
    const b = blocks[Math.floor(r() * blocks.length)]!;
    const inset = 1.9 + r() * 0.4;
    const pts = [
      { x: b.x + inset, z: b.y + inset }, { x: b.x + b.w - inset, z: b.y + inset },
      { x: b.x + b.w - inset, z: b.y + b.h - inset }, { x: b.x + inset, z: b.y + b.h - inset },
    ];
    const loop = r() > 0.5 ? pts : pts.reverse();
    const appearance: PlayerAppearance = {
      skinTone: VALID_SKIN_TONES[Math.floor(r() * VALID_SKIN_TONES.length)]!,
      hairColor: VALID_HAIR_COLORS[Math.floor(r() * VALID_HAIR_COLORS.length)]!,
      hairStyle: VALID_HAIR_STYLES[Math.floor(r() * VALID_HAIR_STYLES.length)]!,
      outfitStyle: VALID_OUTFIT_STYLES[Math.floor(r() * VALID_OUTFIT_STYLES.length)]!,
      outfitColor: VALID_OUTFIT_COLORS[Math.floor(r() * VALID_OUTFIT_COLORS.length)]!,
    };
    const coatColors = ['#5a6b7a', '#7a5a4a', '#3f4f3f', '#8a7a6a', '#4a4a5a', '#a0522d', '#6b4e71', '#2e4a62'];
    const ch = createCharacter({ appearance, heightM: 1.55 + r() * 0.35, bodyColor: coatColors[Math.floor(r() * coatColors.length)] });
    group.add(ch.root);
    walkers.push({ ch, loop, seg: Math.floor(r() * 4), t: r(), speed: 1.1 + r() * 0.45, pos: new THREE.Vector3() });
  }

  return {
    group,
    update(dt: number, player: { x: number; z: number }, night: number): void {
      // Voitures.
      for (const c of cars) {
        const p = carPos(c);
        // Obstacle devant : autre voiture dans la même voie, ou piéton sur la chaussée.
        let blocked = false;
        const ahead = (q: { x: number; z: number }, lane: number, dist: number): boolean => {
          const along = c.axis === 'h' ? (q.x - p.x) * c.dir : (q.z - p.z) * c.dir;
          const side = c.axis === 'h' ? Math.abs(q.z - lane) : Math.abs(q.x - lane);
          return along > 0 && along < dist && side < 1.6;
        };
        const lane = c.axis === 'h' ? p.z : p.x;
        if (ahead(player, lane, 7)) blocked = true;
        if (!blocked) {
          for (const o of cars) {
            if (o === c || o.axis !== c.axis || o.dir !== c.dir || o.road !== c.road) continue;
            if (ahead(carPos(o), lane, 7.5)) { blocked = true; break; }
          }
        }
        const target = blocked ? 0 : c.cruise;
        c.speed += Math.sign(target - c.speed) * Math.min(Math.abs(target - c.speed), (blocked ? 14 : 4) * dt);
        const prevS = c.s;
        c.s += c.dir * c.speed * dt;
        // Franchissement du centre d'un carrefour.
        const centers = (c.axis === 'h' ? VX : HY).map((v) => v + ROAD_W / 2);
        for (const cc of centers) {
          if ((prevS - cc) * (c.s - cc) <= 0 && cc !== c.lastCross) {
            c.lastCross = cc;
            decide(c, cc - ROAD_W / 2);
            break;
          }
        }
        if (Math.abs(c.s - (c.lastCross)) > ROAD_W) c.lastCross = c.lastCross; // conserve
        // Hors des limites : demi-tour.
        const maxS = c.axis === 'h' ? CITY_W : ROAD_END_Z;
        if (c.s < 1 || c.s > maxS - 1) { c.dir = (c.dir * -1) as 1 | -1; c.s = Math.max(1, Math.min(maxS - 1, c.s)); }
        const np = carPos(c);
        // Rendu lissé (les virages sont des sauts de voie : on les adoucit).
        const tgt = new THREE.Vector3(np.x, 0, np.z);
        if (c.shown.lengthSq() === 0) c.shown.copy(tgt);
        c.shown.lerp(tgt, Math.min(1, dt * 6));
        const dirVec = c.axis === 'h' ? { x: c.dir, z: 0 } : { x: 0, z: c.dir };
        const h = Math.atan2(-dirVec.x, -dirVec.z);
        let dh = h - c.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        c.heading += dh * Math.min(1, dt * 5);
        c.mesh.position.copy(c.shown);
        c.mesh.rotation.y = c.heading;
        c.headlights.emissiveIntensity = night * 2.5;
      }
      // Passants.
      for (const w of walkers) {
        const a = w.loop[w.seg]!;
        const b = w.loop[(w.seg + 1) % w.loop.length]!;
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        w.t += (w.speed * dt) / len;
        if (w.t >= 1) { w.t -= 1; w.seg = (w.seg + 1) % w.loop.length; }
        const a2 = w.loop[w.seg]!;
        const b2 = w.loop[(w.seg + 1) % w.loop.length]!;
        w.pos.set(a2.x + (b2.x - a2.x) * w.t, 0.15, a2.z + (b2.z - a2.z) * w.t);
        // Ralentit près du joueur pour ne pas le traverser.
        const close = Math.hypot(w.pos.x - player.x, w.pos.z - player.z) < 0.9;
        w.ch.root.position.copy(w.pos);
        w.ch.setHeading(Math.atan2(-(b2.x - a2.x), -(b2.z - a2.z)));
        w.ch.update(dt, close ? 0 : w.speed);
        if (close) w.t -= (w.speed * dt) / len;
      }
    },
    dispose(): void {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.geometry && !Object.values(shared).includes(m.geometry as never)) m.geometry.dispose();
      });
      shared.body.dispose();
      shared.cabin.dispose();
      shared.wheel.dispose();
      shared.glass.dispose();
      shared.tire.dispose();
      for (const m of shared.mats.values()) m.dispose();
      for (const w of walkers) w.ch.dispose();
      group.removeFromParent();
    },
  };
}
