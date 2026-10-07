/**
 * Objets des terrains de la grande carte (2026-10-07) : voitures garées, ambulances, épaves,
 * semi-remorques, conteneurs, palettes, gravats, buissons, haies, buts du stade, parapets des ponts.
 * Tout est instancié (une poignée d'appels de dessin pour des milliers d'objets) puis redécoupé
 * en blocs de 128 m par `chunkify`. Le hasard vient de `visualRng`.
 */
import * as THREE from 'three';
import { CITY, type CityProp } from '../../data/city/layout';
import { visualRng } from './textures';

const CAR_COLORS = ['#b8352c', '#2f5d8a', '#e8e2d4', '#2b2b2e', '#6a7a3a', '#c9a227', '#8c8f94', '#4a2f5e', '#d9733a', '#1f4a46'];
const CONTAINER_COLORS = ['#b5482f', '#2d5f8b', '#2f6b4a', '#c98a2b', '#7d2f2f', '#5b6770', '#c2c2bc'];
const TRAILER_COLORS = ['#e9e6de', '#d8d4ca', '#3a5f8a', '#b8352c'];

function ribTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 64);
  for (let x = 0; x < 128; x += 8) {
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(x, 0, 3, 64);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(x + 3, 0, 1, 64);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(0, 0, 128, 3);
  g.fillRect(0, 61, 128, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ajoute à `group` les objets des terrains ; `groundAt` donne la hauteur du sol. */
export function buildLotProps(group: THREE.Group, disposables: { dispose(): void }[], groundAt: (x: number, z: number) => number): void {
  const rnd = visualRng(5151);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const M = (x: number, y: number, z: number, ry: number, sx = 1, sy = 1, sz = 1): THREE.Matrix4 =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
  /** Décalage local (dx, dz) tourné du cap `ry`. */
  const at = (cx: number, cz: number, ry: number, dx: number, dz: number): [number, number] =>
    [cx + dx * Math.cos(ry) + dz * Math.sin(ry), cz - dx * Math.sin(ry) + dz * Math.cos(ry)];

  const buckets = new Map<string, { m: THREE.Matrix4[]; c: THREE.Color[] }>();
  const put = (key: string, m: THREE.Matrix4, color?: THREE.ColorRepresentation): void => {
    let b = buckets.get(key);
    if (!b) { b = { m: [], c: [] }; buckets.set(key, b); }
    b.m.push(m);
    b.c.push(new THREE.Color(color ?? '#ffffff'));
  };
  const goals: THREE.Object3D[] = [];
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.5 });

  const center = (p: CityProp): [number, number] => [p.cx ?? p.x + (p.w ?? 1) / 2, p.cy ?? p.y + (p.h ?? 1) / 2];

  for (const p of CITY.props) {
    const [cx, cz] = center(p);
    const ry = p.ry ?? 0;
    const gy = groundAt(cx, cz);
    switch (p.kind) {
      case 'voiture': {
        const amb = p.variant === 'ambulance';
        const rust = p.variant === 'rouille';
        const color = amb ? '#f4f2ec' : rust ? '#7a4a2e' : CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)]!;
        const s = amb ? 1.12 : 1;
        put('carBody', M(cx, gy + 0.55, cz, ry, s, amb ? 1.5 : 1, amb ? 1.15 : 1), color);
        const [kx, kz] = at(cx, cz, ry, 0, amb ? -0.9 : 0.15);
        put('carCabin', M(kx, gy + (amb ? 1.45 : 1.15), kz, ry, s, amb ? 1.4 : 1, amb ? 1.5 : 1), rust ? '#3a2f28' : undefined);
        if (!rust) {
          for (const [dx, dz] of [[-0.8, -1.35], [0.8, -1.35], [-0.8, 1.35], [0.8, 1.35]] as const) {
            const [wx, wz] = at(cx, cz, ry, dx * s, dz * (amb ? 1.15 : 1));
            put('wheel', M(wx, gy + 0.33, wz, ry));
          }
        } else {
          put('carBody', M(cx, gy + 0.2, cz, ry, 1, 0.5, 1), '#4a3326');
        }
        if (amb) {
          put('stripe', M(cx, gy + 1.0, cz, ry, 1.13, 1, 1.2), '#c8352c');
          const [lx, lz] = at(cx, cz, ry, 0, -1.6);
          put('beacon', M(lx, gy + 2.15, lz, ry), '#3a7bd5');
        }
        break;
      }
      case 'camion': {
        const [tx, tz] = at(cx, cz, ry, 0, 1.0);
        put('trailer', M(tx, gy + 2.3, tz, ry), TRAILER_COLORS[Math.floor(rnd() * TRAILER_COLORS.length)]!);
        const [hx, hz] = at(cx, cz, ry, 0, -3.9);
        put('cab', M(hx, gy + 1.65, hz, ry), CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)]!);
        put('chassis', M(cx, gy + 0.55, cz, ry), '#2a2a2c');
        for (const dz of [-3.9, 2.2, 3.6]) {
          for (const dx of [-1.05, 1.05]) {
            const [wx, wz] = at(cx, cz, ry, dx, dz);
            put('wheelBig', M(wx, gy + 0.5, wz, ry));
          }
        }
        break;
      }
      case 'conteneur': {
        const rust = p.variant === 'rouille';
        const color = rust ? '#8a4a2e' : CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)]!;
        put('container', M(cx, gy + 1.3, cz, ry), color);
        if (p.variant === 'empile') put('container', M(cx + (rnd() - 0.5) * 0.3, gy + 3.9, cz, ry + (rnd() - 0.5) * 0.06), CONTAINER_COLORS[Math.floor(rnd() * CONTAINER_COLORS.length)]!);
        break;
      }
      case 'palettes': {
        const r = rnd() * Math.PI;
        put('pallet', M(cx, gy + 0.07, cz, r), '#b08a5a');
        const n = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) put('carton', M(cx + (rnd() - 0.5) * 0.15, gy + 0.15 + 0.35 + k * 0.7, cz + (rnd() - 0.5) * 0.15, r + (rnd() - 0.5) * 0.2), k % 2 ? '#a7835a' : '#c49a68');
        break;
      }
      case 'gravats': {
        put('rubble', M(cx, gy + 0.2, cz, rnd() * 6, 1.7, 0.9, 1.5), rnd() > 0.5 ? '#8c8478' : '#7a6e60');
        put('rubble', M(cx + 0.9, gy + 0.1, cz - 0.6, rnd() * 6, 0.8, 0.5, 0.9), '#9a8f80');
        put('rubble', M(cx - 0.8, gy + 0.05, cz + 0.7, rnd() * 6, 0.6, 0.35, 0.7), '#6e6458');
        break;
      }
      case 'buisson': {
        const s = 0.6 + rnd() * 0.5;
        put('bush', M(cx, gy + s * 0.6, cz, rnd() * 6, s * 1.2, s, s * 1.1), new THREE.Color().setHSL(0.24 + rnd() * 0.07, 0.4, 0.22 + rnd() * 0.08));
        break;
      }
      case 'haie': {
        const len = Math.max(p.w ?? 1, p.h ?? 1);
        put('hedge', M(cx, gy + 0.55, cz, ry, 1, 1, len), new THREE.Color().setHSL(0.27, 0.42, 0.2 + rnd() * 0.05));
        break;
      }
      case 'but': {
        // Cage de but : deux poteaux, une barre, un filet tendu en arrière.
        const g = new THREE.Group();
        const post = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 8);
        for (const dz of [-1.83, 1.83]) {
          const m = new THREE.Mesh(post, whiteMat);
          m.position.set(0, 1.22, dz);
          g.add(m);
        }
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.66, 8).rotateX(Math.PI / 2), whiteMat);
        bar.position.y = 2.44;
        g.add(bar);
        const net = new THREE.Mesh(new THREE.PlaneGeometry(3.66, 2.6), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
        net.rotation.set(0, Math.PI / 2, 0.35);
        net.position.set(-0.6, 1.2, 0);
        g.add(net);
        g.position.set(cx, gy, cz);
        g.rotation.y = ry;
        g.traverse((o) => { o.castShadow = true; });
        goals.push(g);
        break;
      }
      case 'terrain_foot': {
        // Tracé du terrain : ligne de touche, médiane, rond central, surfaces de réparation.
        const W = p.w ?? 1;
        const H = p.h ?? 1;
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = Math.round((512 * H) / W);
        const g = c.getContext('2d')!;
        const k = 512 / W;
        g.strokeStyle = 'rgba(245,245,240,0.92)';
        g.lineWidth = Math.max(2, 0.12 * k);
        g.strokeRect(g.lineWidth, g.lineWidth, c.width - 2 * g.lineWidth, c.height - 2 * g.lineWidth);
        g.beginPath(); g.moveTo(c.width / 2, 0); g.lineTo(c.width / 2, c.height); g.stroke();
        g.beginPath(); g.arc(c.width / 2, c.height / 2, 7 * k, 0, Math.PI * 2); g.stroke();
        const bw = Math.min(14, W / 4) * k;
        const bh = Math.min(30, H * 0.6) * k;
        g.strokeRect(0, (c.height - bh) / 2, bw, bh);
        g.strokeRect(c.width - bw, (c.height - bh) / 2, bw, bh);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 1 });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(-Math.PI / 2), mat);
        plane.position.set(cx, gy + 0.04, cz);
        plane.receiveShadow = true;
        goals.push(plane);
        disposables.push(tex, mat, plane.geometry);
        break;
      }
      default:
        break;
    }
  }

  const ribs = ribTexture();
  const paint = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45, metalness: 0.12 });
  const matte = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: '#2b3846', roughness: 0.15, metalness: 0.5 });
  const steel = new THREE.MeshStandardMaterial({ color: '#ffffff', map: ribs, roughness: 0.6, metalness: 0.35 });
  const leaf = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
  const tire = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.9 });
  const beacon = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#2a5fd0'), emissiveIntensity: 0.8 });
  const geos: Record<string, [THREE.BufferGeometry, THREE.Material, boolean]> = {
    carBody: [new THREE.BoxGeometry(1.8, 0.75, 4.2), paint, true],
    carCabin: [new THREE.BoxGeometry(1.6, 0.55, 2.1), glass, true],
    wheel: [new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10).rotateZ(Math.PI / 2), tire, false],
    stripe: [new THREE.BoxGeometry(1.82, 0.16, 4.22), matte, false],
    beacon: [new THREE.BoxGeometry(1.0, 0.14, 0.3), beacon, false],
    trailer: [new THREE.BoxGeometry(2.55, 2.9, 7.8), steel, true],
    cab: [new THREE.BoxGeometry(2.45, 2.3, 2.1), paint, true],
    chassis: [new THREE.BoxGeometry(2.2, 0.45, 10), matte, false],
    wheelBig: [new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10).rotateZ(Math.PI / 2), tire, false],
    container: [new THREE.BoxGeometry(2.44, 2.6, 6.06), steel, true],
    pallet: [new THREE.BoxGeometry(1.2, 0.15, 1.0), matte, false],
    carton: [new THREE.BoxGeometry(1.0, 0.7, 0.8), matte, true],
    rubble: [new THREE.IcosahedronGeometry(1, 0), leaf, true],
    bush: [new THREE.IcosahedronGeometry(1, 0), leaf, true],
    hedge: [new THREE.BoxGeometry(0.8, 1.1, 1), leaf, true],
  };
  // Les flancs des conteneurs et remorques portent les nervures dans le sens de la longueur.
  ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping;
  for (const [key, b] of buckets) {
    const [geo, mat, shadow] = geos[key]!;
    const im = new THREE.InstancedMesh(geo, mat, b.m.length);
    b.m.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, b.c[i]!); });
    im.castShadow = shadow;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  }
  for (const g of goals) group.add(g);
  for (const [geo] of Object.values(geos)) disposables.push(geo);
  disposables.push(ribs, paint, matte, glass, steel, leaf, tire, beacon, whiteMat);

  // Parapets des ponts : murets de pierre au-dessus de l'eau, avec une corniche.
  const stone = new THREE.MeshStandardMaterial({ color: '#b3a894', roughness: 0.9 });
  const coping = new THREE.MeshStandardMaterial({ color: '#d2c8b4', roughness: 0.8 });
  disposables.push(stone, coping);
  const { y: cy0, h: ch } = CITY.canal;
  for (const b of CITY.bridges) {
    const z0 = Math.max(b.y, cy0);
    const z1 = Math.min(b.y + b.h, cy0 + ch);
    const len = z1 - z0;
    if (len <= 0) continue;
    for (const x of [b.x + 0.2, b.x + b.w - 0.2]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, len + 1.2), stone);
      wall.position.set(x, -0.25, (z0 + z1) / 2);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, len + 1.4), coping);
      top.position.set(x, 0.8, (z0 + z1) / 2);
      for (const m of [wall, top]) { m.castShadow = true; m.receiveShadow = true; group.add(m); disposables.push(m.geometry); }
    }
    // Tablier vu de côté : une arche plate sous la chaussée.
    const deck = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.9, len), stone);
    deck.position.set(b.x + b.w / 2, -0.5, (z0 + z1) / 2);
    deck.receiveShadow = true;
    group.add(deck);
    disposables.push(deck.geometry);
  }
}
