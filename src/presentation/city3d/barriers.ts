/**
 * Barrières de chantier aux entrées des quartiers fermés (grande carte, 2026-10-07).
 *
 * Chaque passage praticable qui franchit la limite d'un quartier est fermé : barrières rouges et
 * blanches en travers des rues, palissade de chantier le long des pelouses et des cours. Des
 * panneaux jaunes disent pourquoi c'est fermé et à quel palier de l'Ascension ça ouvre. Une barrière n'est visible que du côté ouvert : quand deux
 * quartiers fermés se touchent, on ne double pas la clôture.
 */
import * as THREE from 'three';
import type { WorldState } from '../../core/types';
import { TIERS } from '../../data/ascension/ideas';
import { areaAt, CITY_AREAS, type CityArea } from '../../data/city/layout';
import { isWalkable } from '../../data/map';
import { areaUnlocked } from '../../simulation/areas';
import { groundHeightAt } from './cityScene';

/** Un passage à fermer : `axis` 'h' = la clôture suit l'axe x (limite nord ou sud). */
export interface BarrierRun {
  inside: string;
  outside: string;
  axis: 'h' | 'v';
  /** Coordonnée fixe de la clôture (z pour 'h', x pour 'v'), en mètres. */
  at: number;
  /** Début et longueur du passage le long de la clôture, en tuiles. */
  from: number;
  len: number;
}

/** Tous les passages entre deux quartiers (calcul pur, une fois par carte). */
export function barrierRuns(): BarrierRun[] {
  const runs: BarrierRun[] = [];
  const scan = (a: CityArea, axis: 'h' | 'v', fixedIn: number, fixedOut: number, at: number, start: number, end: number): void => {
    let cur: BarrierRun | null = null;
    for (let t = start; t < end; t++) {
      const [ix, iy, ox, oy] = axis === 'h' ? [t, fixedIn, t, fixedOut] : [fixedIn, t, fixedOut, t];
      const open = isWalkable(ix, iy) && isWalkable(ox, oy);
      const outside = open ? areaAt(ox, oy).id : '';
      if (open && outside !== a.id && cur && cur.outside === outside && cur.from + cur.len === t) {
        cur.len++;
        continue;
      }
      if (cur) runs.push(cur);
      cur = open && outside !== a.id ? { inside: a.id, outside, axis, at, from: t, len: 1 } : null;
    }
    if (cur) runs.push(cur);
  };
  for (const a of CITY_AREAS) {
    if (a.tier <= 1) continue;
    if (a.y > 0) scan(a, 'h', a.y, a.y - 1, a.y + 0.3, a.x, a.x + a.w);
    scan(a, 'h', a.y + a.h - 1, a.y + a.h, a.y + a.h - 0.3, a.x, a.x + a.w);
    if (a.x > 0) scan(a, 'v', a.x, a.x - 1, a.x + 0.3, a.y, a.y + a.h);
    scan(a, 'v', a.x + a.w - 1, a.x + a.w, a.x + a.w - 0.3, a.y, a.y + a.h);
  }
  return runs;
}

function stripeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#d23a2a';
  for (let x = -16; x < 128; x += 32) {
    g.beginPath();
    g.moveTo(x, 16); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, 16);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hoardingTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#2f5b48';
  g.fillRect(0, 0, 128, 128);
  // Lames verticales et bandeau clair en haut, comme les palissades de chantier de la mairie.
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 2, 128);
  g.fillStyle = '#e9e3d2';
  g.fillRect(0, 6, 128, 12);
  g.fillStyle = '#f2c230';
  g.fillRect(0, 18, 128, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Au-delà de cette longueur (tuiles), un passage n'est plus une rue mais un bord de parcelle. */
const HOARDING_MIN = 17;

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxW && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function signTexture(a: CityArea): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2c230';
  g.fillRect(0, 0, 512, 320);
  g.strokeStyle = '#1d1a16';
  g.lineWidth = 14;
  g.strokeRect(7, 7, 498, 306);
  g.fillStyle = '#1d1a16';
  g.textAlign = 'center';
  g.font = '800 40px system-ui, sans-serif';
  g.fillText('🚧 ACCÈS FERMÉ', 256, 62);
  g.font = '700 32px system-ui, sans-serif';
  g.fillText(a.name, 256, 108);
  g.font = '500 23px system-ui, sans-serif';
  wrap(g, a.lock, 440).slice(0, 4).forEach((l, i) => g.fillText(l, 256, 150 + i * 29));
  g.font = '800 26px system-ui, sans-serif';
  g.fillText(`Ouverture : palier ${a.tier} · ${TIERS[a.tier - 1]?.name ?? ''}`, 256, 292);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

interface RunView { run: BarrierRun; group: THREE.Group; cx: number; cz: number; reach: number }

export interface Barriers {
  group: THREE.Group;
  /** Met à jour ce qui est fermé et ce qui est à portée de vue. */
  update(w: WorldState, camX: number, camZ: number, radius: number): void;
}

export function createBarriers(): Barriers {
  const root = new THREE.Group();
  root.name = 'barrières de quartier';
  const plankGeo = new THREE.BoxGeometry(1.9, 0.22, 0.04);
  const legGeo = new THREE.BoxGeometry(0.06, 1.05, 0.06);
  const footGeo = new THREE.BoxGeometry(0.08, 0.06, 0.55);
  const plankMat = new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#8b8f94', roughness: 0.5, metalness: 0.4 });
  const postMat = new THREE.MeshStandardMaterial({ color: '#4a4a4a', roughness: 0.7 });
  const signMats = new Map<string, THREE.MeshStandardMaterial>();
  const signMat = (a: CityArea): THREE.MeshStandardMaterial => {
    let m = signMats.get(a.id);
    if (!m) { m = new THREE.MeshStandardMaterial({ map: signTexture(a), roughness: 0.8 }); signMats.set(a.id, m); }
    return m;
  };
  const signGeo = new THREE.PlaneGeometry(1.6, 1.0);
  const panelGeo = new THREE.BoxGeometry(2.0, 1.9, 0.06);
  const panelMat = new THREE.MeshStandardMaterial({ map: hoardingTexture(), roughness: 0.85 });
  const hpostGeo = new THREE.BoxGeometry(0.09, 2.0, 0.09);
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);

  const views: RunView[] = [];
  for (const run of barrierRuns()) {
    const area = CITY_AREAS.find((a) => a.id === run.inside)!;
    const group = new THREE.Group();
    const n = Math.max(1, Math.ceil(run.len / 2));
    const step = run.len / n;
    const hoarding = run.len >= HOARDING_MIN;
    q.setFromAxisAngle(up, run.axis === 'h' ? 0 : Math.PI / 2);
    const place = (along: number, y: number, off = 0): THREE.Vector3 => {
      const x = run.axis === 'h' ? along + off : run.at;
      const z = run.axis === 'h' ? run.at : along + off;
      return new THREE.Vector3(x, groundHeightAt(x, z) + y, z);
    };
    const facing = run.axis === 'h' ? (run.at < area.y + area.h / 2 ? Math.PI : 0) : (run.at < area.x + area.w / 2 ? -Math.PI / 2 : Math.PI / 2);
    const out = run.axis === 'h' ? new THREE.Vector3(0, 0, Math.cos(facing)) : new THREE.Vector3(Math.sin(facing), 0, 0);
    if (hoarding) {
      // Palissade : panneaux pleins de 2 m et poteaux ; un panneau jaune tous les 60 m.
      const panels = new THREE.InstancedMesh(panelGeo, panelMat, n);
      const posts = new THREE.InstancedMesh(hpostGeo, postMat, n + 1);
      for (let i = 0; i < n; i++) {
        panels.setMatrixAt(i, m4.compose(place(run.from + step * (i + 0.5), 0.95), q, one));
        posts.setMatrixAt(i, m4.compose(place(run.from + step * i, 1.0), q, one));
      }
      posts.setMatrixAt(n, m4.compose(place(run.from + run.len, 1.0), q, one));
      for (const im of [panels, posts]) {
        im.castShadow = true;
        im.receiveShadow = true;
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        group.add(im);
      }
      const signs = Math.max(1, Math.round(run.len / 60));
      for (let k = 0; k < signs; k++) {
        const sign = new THREE.Mesh(signGeo, signMat(area));
        sign.position.copy(place(run.from + (run.len * (k + 0.5)) / signs, 1.2)).addScaledVector(out, 0.05);
        sign.rotation.y = facing;
        group.add(sign);
      }
      group.visible = false;
      root.add(group);
      const c = place(run.from + run.len / 2, 0);
      views.push({ run, group, cx: c.x, cz: c.z, reach: run.len / 2 });
      continue;
    }
    const planks = new THREE.InstancedMesh(plankGeo, plankMat, n * 2);
    const legs = new THREE.InstancedMesh(legGeo, metalMat, n * 2);
    const feet = new THREE.InstancedMesh(footGeo, metalMat, n * 2);
    for (let i = 0; i < n; i++) {
      const mid = run.from + step * (i + 0.5);
      planks.setMatrixAt(i * 2, m4.compose(place(mid, 0.55), q, one));
      planks.setMatrixAt(i * 2 + 1, m4.compose(place(mid, 0.92), q, one));
      for (const [k, off] of [[0, -0.88], [1, 0.88]] as const) {
        legs.setMatrixAt(i * 2 + k, m4.compose(place(mid, 0.52, off), q, one));
        feet.setMatrixAt(i * 2 + k, m4.compose(place(mid, 0.03, off), q, one));
      }
    }
    for (const im of [planks, legs, feet]) {
      im.castShadow = true;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      group.add(im);
    }
    // Panneau jaune au milieu des passages assez larges (face au côté ouvert).
    if (run.len >= 3) {
      const mid = run.from + run.len / 2;
      const sign = new THREE.Mesh(signGeo, signMat(area));
      const base = place(mid, 0);
      sign.position.copy(base).add(new THREE.Vector3(0, 1.75, 0)).addScaledVector(out, 0.12);
      sign.rotation.y = facing;
      sign.castShadow = true;
      group.add(sign);
      for (const off of [-0.7, 0.7]) {
        const p = new THREE.Mesh(postGeo, postMat);
        p.position.copy(place(mid, 1.1, off)).addScaledVector(out, 0.08);
        group.add(p);
      }
    }
    group.visible = false;
    root.add(group);
    const c = place(run.from + run.len / 2, 0);
    views.push({ run, group, cx: c.x, cz: c.z, reach: run.len / 2 });
  }

  let key = '';
  let locked = new Set<string>();
  return {
    group: root,
    update(w, camX, camZ, radius): void {
      const k = CITY_AREAS.map((a) => (areaUnlocked(w, a) ? '1' : '0')).join('');
      if (k !== key) {
        key = k;
        locked = new Set(CITY_AREAS.filter((_, i) => k[i] === '0').map((a) => a.id));
      }
      for (const v of views) {
        const shown = locked.has(v.run.inside) && !locked.has(v.run.outside);
        v.group.visible = shown && (v.cx - camX) ** 2 + (v.cz - camZ) ** 2 <= (radius + 40 + v.reach) ** 2;
      }
    },
  };
}
