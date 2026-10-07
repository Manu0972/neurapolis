/**
 * Vie d'ambiance de la ville (présentation pure, n'écrit jamais l'état du monde) :
 *  - voitures qui roulent à droite sur la trame des rues, tournent aux carrefours et
 *    s'arrêtent devant un piéton ;
 *  - passants qui font le tour des îlots sur les trottoirs ;
 *  - bus des trois lignes TVT qui suivent leur boucle et marquent l'arrêt.
 * Grande carte : voitures et passants trop loin du joueur reviennent autour de lui (la ville
 * reste animée là où l'on regarde) ; une voiture fait demi-tour où la chaussée s'arrête (canal).
 * Le hasard vient de `visualRng`, jamais du PRNG du monde.
 */
import * as THREE from 'three';
import { generateLook } from '../../core/human_variety';
import { CITY, CITY_W, ROAD_W } from '../../data/city/layout';
import { surfaceFast } from '../../data/map';
import { BUS_LINES, BUS_STOP_BY_ID, type BusLine } from '../../data/city/transit';
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

/** La chaussée continue-t-elle en (x, z) ? (le canal coupe les rues qui n'ont pas de pont) */
function onRoad(x: number, z: number): boolean {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  if (ix < 0 || iz < 0 || ix >= CITY_W || iz >= ROAD_END_Z) return false;
  const s = surfaceFast(ix, iz);
  return s === 'chaussee' || s === 'passage';
}

/** Rayon autour du joueur où vit l'ambiance ; au-delà, voitures et passants sont replacés. */
const LIVE_RADIUS = 320;

interface Bus {
  line: BusLine;
  pts: { x: number; z: number }[];
  cum: number[];
  total: number;
  stops: number[];
  s: number;
  speed: number;
  dwell: number;
  mesh: THREE.Group;
  heading: number;
  lights: THREE.MeshStandardMaterial;
}

/** Tracé d'une ligne sur la voie de droite (carrefours décalés de 1,9 m vers la droite). */
function busLane(line: BusLine): { pts: { x: number; z: number }[]; cum: number[]; total: number; stops: number[] } {
  const c = line.path.map((p) => ({ x: p.x + ROAD_W / 2, z: p.y + ROAD_W / 2 }));
  const n = c.length;
  const dirOf = (a: { x: number; z: number }, b: { x: number; z: number }): { x: number; z: number } => {
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
  };
  const pts = c.map((p, k) => {
    const din = dirOf(c[(k - 1 + n) % n]!, p);
    const dout = dirOf(p, c[(k + 1) % n]!);
    const rin = { x: -din.z, z: din.x };
    const rout = { x: -dout.z, z: dout.x };
    const same = Math.abs(din.x - dout.x) + Math.abs(din.z - dout.z) < 1e-6;
    return same ? { x: p.x + rin.x * 1.9, z: p.z + rin.z * 1.9 } : { x: p.x + (rin.x + rout.x) * 1.9, z: p.z + (rin.z + rout.z) * 1.9 };
  });
  const cum = [0];
  for (let k = 1; k <= n; k++) cum.push(cum[k - 1]! + Math.hypot(pts[k % n]!.x - pts[k - 1]!.x, pts[k % n]!.z - pts[k - 1]!.z));
  const total = cum[n]!;
  // Arrêt : point du tracé le plus proche de l'abri (le bus s'arrête à sa hauteur).
  const stops = line.stops.map((id) => {
    const st = BUS_STOP_BY_ID[id]!;
    const px = st.x + 0.5;
    const pz = st.y + 0.5;
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < n; k++) {
      const a = pts[k]!;
      const b = pts[(k + 1) % n]!;
      const len2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1;
      const u = Math.max(0, Math.min(1, ((px - a.x) * (b.x - a.x) + (pz - a.z) * (b.z - a.z)) / len2));
      const d = Math.hypot(a.x + (b.x - a.x) * u - px, a.z + (b.z - a.z) * u - pz);
      if (d < bd) { bd = d; best = cum[k]! + u * (cum[k + 1]! - cum[k]!); }
    }
    return best % total;
  }).sort((a, b) => a - b);
  return { pts, cum, total, stops };
}

function busMesh(color: string): { g: THREE.Group; lights: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: '#1f2a33', roughness: 0.1, metalness: 0.6 });
  const tire = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.9 });
  const lights = new THREE.MeshStandardMaterial({ color: '#fff6dd', emissive: new THREE.Color('#ffe9b0'), emissiveIntensity: 0 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): void => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
  };
  add(new THREE.BoxGeometry(2.5, 1.3, 11), paint, 0, 0.95, 0);
  add(new THREE.BoxGeometry(2.52, 0.95, 10.2), glass, 0, 2.05, 0.25);
  add(new THREE.BoxGeometry(2.5, 0.35, 11), white, 0, 2.7, 0);
  add(new THREE.BoxGeometry(2.3, 1.35, 0.06), glass, 0, 1.95, -5.52);
  add(new THREE.BoxGeometry(1.6, 0.3, 0.08), new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#f2b33a'), emissiveIntensity: 0.9 }), 0, 2.75, -5.53);
  for (const side of [-0.85, 0.85]) add(new THREE.BoxGeometry(0.35, 0.16, 0.05), lights, side, 0.7, -5.53);
  const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12).rotateZ(Math.PI / 2);
  for (const z of [-3.6, 3.4]) for (const x of [-1.15, 1.15]) add(wheel, tire, x, 0.5, z);
  return { g, lights };
}

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
  /** Distance (m) entre le joueur et la voiture la plus proche (pour le son de circulation). */
  nearestCar(player: { x: number; z: number }): number;
  /** Position des bus (QA). */
  buses(): { line: string; x: number; z: number; speed: number }[];
  dispose(): void;
}

export function createAmbient(opts: { cars?: number; pedestrians?: number; buses?: boolean; anchor?: { x: number; z: number } } = {}): Ambient {
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
  const nCars = opts.cars ?? 30;
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

  /** Replace une voiture sur une rue à 150–240 m du point suivi (hors de la vue rapprochée). */
  function respawnCar(c: Car, focus: { x: number; z: number }): void {
    for (let tries = 0; tries < 12; tries++) {
      const axis: 'h' | 'v' = c.rnd() > 0.5 ? 'h' : 'v';
      const dir: 1 | -1 = c.rnd() > 0.5 ? 1 : -1;
      const near = (axis === 'h' ? HY : VX).filter((v) => Math.abs(v + ROAD_W / 2 - (axis === 'h' ? focus.z : focus.x)) < 220);
      if (!near.length) continue;
      const road = near[Math.floor(c.rnd() * near.length)]!;
      const along = (axis === 'h' ? focus.x : focus.z) + (c.rnd() > 0.5 ? 1 : -1) * (150 + c.rnd() * 90);
      const p = axis === 'h' ? { x: along, z: laneZ(road, dir) } : { x: laneX(road, dir), z: along };
      if (!onRoad(p.x, p.z)) continue;
      Object.assign(c, { axis, dir, road, s: along, lastCross: -1 });
      c.shown.set(p.x, 0, p.z);
      return;
    }
  }

  // ----- Bus -----
  const buses: Bus[] = [];
  if (opts.buses !== false) {
    for (const line of BUS_LINES) {
      const lane = busLane(line);
      for (let k = 0; k < 2; k++) {
        const { g, lights } = busMesh(line.color);
        group.add(g);
        buses.push({ line, ...lane, s: (lane.total * k) / 2, speed: 0, dwell: 0, mesh: g, heading: 0, lights });
      }
    }
  }
  const busPos = (b: Bus, s: number): { x: number; z: number; dx: number; dz: number } => {
    const t = ((s % b.total) + b.total) % b.total;
    let k = 0;
    while (k < b.pts.length - 1 && b.cum[k + 1]! <= t) k++;
    const a = b.pts[k]!;
    const c = b.pts[(k + 1) % b.pts.length]!;
    const len = b.cum[k + 1]! - b.cum[k]! || 1;
    const u = (t - b.cum[k]!) / len;
    return { x: a.x + (c.x - a.x) * u, z: a.z + (c.z - a.z) * u, dx: (c.x - a.x) / len, dz: (c.z - a.z) / len };
  };

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
    // Passants : toute la variété humaine (teintes, cheveux, corpulences, âges, tailles).
    const look = generateLook(`passant:${i}`);
    const coatColors = ['#5a6b7a', '#7a5a4a', '#3f4f3f', '#8a7a6a', '#4a4a5a', '#a0522d', '#6b4e71', '#2e4a62'];
    const ch = createCharacter({ appearance: look.appearance, gender: look.gender, heightM: look.heightM, bodyColor: coatColors[Math.floor(r() * coatColors.length)], detail: 'low' });
    group.add(ch.root);
    walkers.push({ ch, loop, seg: Math.floor(r() * 4), t: r(), speed: 1.1 + r() * 0.45, pos: new THREE.Vector3() });
  }
  const blockCenters = blocks.map((b) => ({ b, x: b.x + b.w / 2, z: b.y + b.h / 2 }));
  const wrnd = visualRng(4711);
  /** Replace un passant autour d'un îlot à 70–200 m du point suivi. */
  function respawnWalker(w: Walker, focus: { x: number; z: number }): void {
    const near = blockCenters.filter((c) => {
      const d = Math.hypot(c.x - focus.x, c.z - focus.z);
      return d > 70 && d < 200;
    });
    if (!near.length) return;
    const b = near[Math.floor(wrnd() * near.length)]!.b;
    const inset = 1.9 + wrnd() * 0.4;
    const pts = [
      { x: b.x + inset, z: b.y + inset }, { x: b.x + b.w - inset, z: b.y + inset },
      { x: b.x + b.w - inset, z: b.y + b.h - inset }, { x: b.x + inset, z: b.y + b.h - inset },
    ];
    w.loop = wrnd() > 0.5 ? pts : pts.reverse();
    w.seg = Math.floor(wrnd() * 4);
    w.t = wrnd();
  }
  let recycleTick = 0;

  return {
    group,
    update(dt: number, player: { x: number; z: number }, night: number): void {
      const focus = opts.anchor ?? player;
      // Grande carte : toutes les demi-secondes, ce qui est trop loin revient près du joueur.
      recycleTick += dt;
      if (recycleTick > 0.5) {
        recycleTick = 0;
        for (const c of cars) {
          const p = carPos(c);
          if (Math.hypot(p.x - focus.x, p.z - focus.z) > LIVE_RADIUS) respawnCar(c, focus);
        }
        for (const w of walkers) {
          const a = w.loop[w.seg]!;
          if (Math.hypot(a.x - focus.x, a.z - focus.z) > LIVE_RADIUS - 60) respawnWalker(w, focus);
        }
      }
      // Bus : vitesse de croisière, ralentit aux virages et aux arrêts, attend 6 s, cède au piéton.
      for (const b of buses) {
        if (b.dwell > 0) {
          b.dwell -= dt;
          if (b.dwell <= 0) b.s += 0.8; // repart sans re-marquer le même arrêt
        } else {
          const t = ((b.s % b.total) + b.total) % b.total;
          let dStop = Infinity;
          for (const st of b.stops) dStop = Math.min(dStop, ((st - t) % b.total + b.total) % b.total);
          let dTurn = Infinity;
          for (let k = 0; k < b.pts.length; k++) dTurn = Math.min(dTurn, ((b.cum[k]! - t) % b.total + b.total) % b.total);
          let target = 9;
          if (dTurn < 12) target = Math.min(target, 3.5 + dTurn * 0.4);
          if (dStop < 20) target = Math.min(target, 0.8 + dStop * 0.45);
          const here = busPos(b, b.s);
          const along = (player.x - here.x) * here.dx + (player.z - here.z) * here.dz;
          const side = Math.abs((player.x - here.x) * here.dz - (player.z - here.z) * here.dx);
          if (along > 0 && along < 9 && side < 1.8) target = 0;
          b.speed += Math.sign(target - b.speed) * Math.min(Math.abs(target - b.speed), (target < b.speed ? 6 : 2.5) * dt);
          const step = b.speed * dt;
          if (dStop < 0.6 || (dStop < step + 0.05 && dStop !== Infinity)) {
            b.s += dStop;
            b.speed = 0;
            b.dwell = 6;
          } else {
            b.s += step;
          }
        }
        const p = busPos(b, b.s);
        const h = Math.atan2(-p.dx, -p.dz);
        let dh = h - b.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        b.heading += dh * Math.min(1, dt * 4);
        b.mesh.position.set(p.x, 0, p.z);
        b.mesh.rotation.y = b.heading;
        b.mesh.visible = Math.hypot(p.x - focus.x, p.z - focus.z) < LIVE_RADIUS + 140;
        b.lights.emissiveIntensity = night * 2.5;
      }
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
        // Fin de la chaussée devant (canal sans pont, bord de carte) : demi-tour.
        {
          const q = carPos(c);
          const fx = c.axis === 'h' ? q.x + c.dir * 2.5 : q.x;
          const fz = c.axis === 'v' ? q.z + c.dir * 2.5 : q.z;
          if (!onRoad(fx, fz)) { c.s = prevS; c.dir = (c.dir * -1) as 1 | -1; }
        }
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
    nearestCar(player: { x: number; z: number }): number {
      let best = Infinity;
      for (const c of cars) best = Math.min(best, Math.hypot(c.shown.x - player.x, c.shown.z - player.z));
      for (const b of buses) best = Math.min(best, Math.hypot(b.mesh.position.x - player.x, b.mesh.position.z - player.z));
      return best;
    },
    buses(): { line: string; x: number; z: number; speed: number }[] {
      return buses.map((b) => ({ line: b.line.id, x: b.mesh.position.x, z: b.mesh.position.z, speed: b.speed }));
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
