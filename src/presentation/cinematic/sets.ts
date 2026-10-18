/**
 * Décors 3D des cinématiques (Three.js, entièrement procéduraux, aucune image externe) :
 * - « bibliotheque » : la bibliothèque de la Maison du Peuple la nuit de l'orage (rayonnages,
 *   lampe de bureau, cône de lumière plein de poussière, éclairs à la fenêtre, chute des livres,
 *   carnet qui s'illumine, petits fantômes kawaii translucides) ;
 * - « toits » : les toits de la Cité des Roses au crépuscule (fin du chapitre 1).
 * Le décor lit le plan (plan.ts) : chaque repère (cue) allume ou anime une partie de la scène.
 */
import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../../core/types';
import { createCharacter, createProceduralCharacter, type Character3D } from '../city3d/simpleCharacter';
import { playerRigModel } from '../city3d/rigged/playerModel';
import { ghostSvgMarkup, thinkerMeta } from '../ghost-avatar';
import { cueAge, type CinematicPlan, type Vec3 } from './plan';

export interface SetOptions {
  appearance: PlayerAppearance;
  gender: PlayerGender;
  heightM: number;
  age: number;
}

export interface CineSet {
  scene: THREE.Scene;
  /** Avance le décor à l'instant t (s). `mouthOpen` : bouche du fantôme qui parle. */
  update(t: number, dt: number, speaker: string | null, mouthOpen: boolean): void;
  dispose(): void;
}

/** Petit générateur pseudo-aléatoire stable (décor identique à chaque lecture). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const BOOK_COLORS = ['#6e2c28', '#2f4766', '#3d5638', '#7a5034', '#a3813f', '#563a56', '#a84e3a', '#c9b48a', '#38423f', '#8c3b2e'];

function radialTexture(inner: string, outer = 'rgba(0,0,0,0)'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Texture d'un fantôme kawaii (le même dessin SVG que l'interface), bouche ouverte ou fermée. */
function ghostTexture(id: string, open: boolean, onReady: () => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const markup = ghostSvgMarkup(id, 'calme', 256, { standalone: true, open });
  const img = new Image();
  img.onload = () => {
    c.getContext('2d')!.drawImage(img, 0, 0, 256, 256);
    tex.needsUpdate = true;
    onReady();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return tex;
}

interface GhostSprite {
  id: string;
  sprite: THREE.Sprite;
  halo: THREE.Sprite;
  closed: THREE.CanvasTexture;
  open: THREE.CanvasTexture;
  home: Vec3;
  delay: number;
}

function makeGhosts(ids: string[], homes: Vec3[], disposables: { dispose(): void }[]): GhostSprite[] {
  return ids.map((id, i) => {
    const closed = ghostTexture(id, false, () => undefined);
    const open = ghostTexture(id, true, () => undefined);
    const mat = new THREE.SpriteMaterial({ map: closed, transparent: true, opacity: 0, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.5, 0.5, 0.5);
    const haloTex = radialTexture(thinkerMeta(id).color + 'aa');
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.9, 0.9, 0.9);
    disposables.push(closed, open, mat, haloTex, halo.material);
    return { id, sprite, halo, closed, open, home: homes[i] ?? { x: 0, y: 1.4, z: 1.4 }, delay: i * 0.7 };
  });
}

function animateGhosts(
  gs: GhostSprite[], plan: CinematicPlan, t: number, speaker: string | null, mouthOpen: boolean,
  focus: { id: string; at: Vec3; age: number | null } | null,
): void {
  const voix = cueAge(plan, 'voix', t);
  for (const g of gs) {
    const age = voix === null ? -1 : voix - g.delay;
    const a = Math.max(0, Math.min(1, age / 1.2));
    const m = g.sprite.material as THREE.SpriteMaterial;
    m.opacity = 0.88 * a;
    (g.halo.material as THREE.SpriteMaterial).opacity = 0.55 * a;
    const bob = Math.sin(t * 1.7 + g.delay * 2) * 0.05;
    const swirl = Math.sin(t * 0.5 + g.delay) * 0.08;
    let p = { x: g.home.x + swirl, y: g.home.y + bob + (1 - a) * -0.25, z: g.home.z };
    let s = 0.5 * (0.7 + 0.3 * a);
    if (focus && focus.id === g.id && focus.age !== null && focus.age >= 0) {
      const k = Math.min(1, focus.age / 1.5);
      const e = k * k * (3 - 2 * k);
      p = { x: p.x + (focus.at.x - p.x) * e, y: p.y + (focus.at.y - p.y) * e, z: p.z + (focus.at.z - p.z) * e };
      s *= 1 + 0.45 * e;
    }
    g.sprite.position.set(p.x, p.y, p.z);
    g.halo.position.set(p.x, p.y, p.z + 0.02);
    g.sprite.scale.setScalar(s);
    g.halo.scale.setScalar(s * 1.9);
    const talking = speaker === g.id && mouthOpen;
    const want = talking ? g.open : g.closed;
    if (m.map !== want) { m.map = want; m.needsUpdate = true; }
  }
}

/** Personnage du joueur, comme en jeu (modèle riggé du studio s'il existe, sinon procédural). */
function child(opts: SetOptions): Character3D {
  return createCharacter({
    appearance: opts.appearance, gender: opts.gender, heightM: opts.heightM,
    rig: { key: 'joueur', role: 'joueur', age: opts.age, model: playerRigModel() }, rigRecolor: 'joueur',
  });
}

function box(w: number, h: number, d: number, color: string, rough = 0.9): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: rough }));
}

/* ------------------------------------------------------------------------------------------ */

function buildLibrary(plan: CinematicPlan, opts: SetOptions): CineSet {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120c14');
  scene.fog = new THREE.Fog('#120c14', 7, 22);
  const disposables: { dispose(): void }[] = [];
  const rnd = lcg(1958);

  // Salle : parquet, murs, plafond.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 20), new THREE.MeshStandardMaterial({ color: '#4a301f', roughness: 0.8 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -1;
  scene.add(floor);
  const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4.4, 20), new THREE.MeshStandardMaterial({ color: '#3a2a2c', roughness: 1, side: THREE.BackSide }));
  room.position.set(0, 2.2, -1);
  scene.add(room);

  // Rayonnages des deux côtés de l'allée, pleins de livres (un seul maillage instancié).
  const wood = new THREE.MeshStandardMaterial({ color: '#5b3a24', roughness: 0.85 });
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
  const books: { p: THREE.Vector3; s: THREE.Vector3; r: number; c: string }[] = [];
  for (const side of [-1, 1]) {
    const x = side * 3.1;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.3, 12.4), wood);
    back.position.set(x + side * 0.22, 1.65, -3);
    scene.add(back);
    for (let lvl = 0; lvl < 6; lvl += 1) {
      const y = 0.12 + lvl * 0.55;
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 12.4), wood);
      board.position.set(x, y, -3);
      scene.add(board);
      let z = -9.1;
      while (z < 3.1) {
        const w = 0.035 + rnd() * 0.06;
        if (rnd() < 0.05) { z += 0.15 + rnd() * 0.3; continue; }
        const h = 0.26 + rnd() * 0.18;
        const lean = rnd() < 0.04 ? (rnd() - 0.5) * 0.5 : 0;
        books.push({ p: new THREE.Vector3(x - side * 0.02, y + 0.02 + h / 2, z + w / 2), s: new THREE.Vector3(0.24 + rnd() * 0.06, h, w), r: lean, c: BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)]! });
        z += w + 0.004;
      }
    }
    for (let z = -9.2; z <= 3.2; z += 2.06) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.3, 0.06), wood);
      up.position.set(x, 1.65, z);
      scene.add(up);
    }
  }
  const inst = new THREE.InstancedMesh(bookGeo, bookMat, books.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  books.forEach((b, i) => {
    q.setFromEuler(new THREE.Euler(b.r, 0, 0));
    m4.compose(b.p, q, b.s);
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.set(b.c));
  });
  scene.add(inst);
  disposables.push(bookGeo, bookMat, wood);

  // Bureau du bibliothécaire et sa lampe verte.
  const desk = box(1.7, 0.08, 0.85, '#6b4428', 0.6);
  desk.position.set(0.2, 0.78, 5.6);
  scene.add(desk);
  for (const [dx, dz] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]] as const) {
    const leg = box(0.06, 0.78, 0.06, '#4e301c');
    leg.position.set(0.2 + dx, 0.39, 5.6 + dz);
    scene.add(leg);
  }
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#2f5a3a', side: THREE.DoubleSide, roughness: 0.4 }));
  shade.position.set(0.55, 1.18, 5.5);
  scene.add(shade);
  const stem = box(0.02, 0.36, 0.02, '#b08a4a', 0.3);
  stem.position.set(0.55, 0.99, 5.5);
  scene.add(stem);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' }));
  bulb.position.set(0.55, 1.13, 5.5);
  scene.add(bulb);
  const deskLight = new THREE.PointLight('#ffc978', 6, 7, 1.6);
  deskLight.position.set(0.55, 1.1, 5.5);
  scene.add(deskLight);
  for (let i = 0; i < 4; i += 1) {
    const b = box(0.3 - i * 0.02, 0.055, 0.22 - i * 0.01, BOOK_COLORS[(i * 3) % BOOK_COLORS.length]!, 0.7);
    b.position.set(-0.25, 0.85 + i * 0.056, 5.5);
    b.rotation.y = (i % 2 ? 0.12 : -0.08) * (i + 1);
    scene.add(b);
  }

  // Grande fenêtre au fond : la nuit d'orage, les éclairs.
  const winMat = new THREE.MeshBasicMaterial({ color: '#1a2238' });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), winMat);
  win.position.set(0.2, 2.2, 8.95);
  win.rotation.y = Math.PI;
  scene.add(win);
  const mullV = box(0.06, 2.6, 0.05, '#2a1a14');
  mullV.position.set(0.2, 2.2, 8.9);
  const mullH = box(2.4, 0.06, 0.05, '#2a1a14');
  mullH.position.set(0.2, 2.4, 8.9);
  scene.add(mullV, mullH);
  const flashLight = new THREE.DirectionalLight('#b8ccff', 0);
  flashLight.position.set(0.2, 3, 12);
  flashLight.target.position.set(0, 0, 0);
  scene.add(flashLight, flashLight.target);

  // Lumière d'ambiance (nuit froide) et plafonnier : cône de lumière où danse la poussière.
  const hemi = new THREE.HemisphereLight('#6a6a9a', '#3a2a1c', 0.9);
  scene.add(hemi);
  const ceiling = new THREE.SpotLight('#ffd98a', 30, 9, 0.55, 0.6, 1.4);
  ceiling.position.set(0, 4.2, 1.2);
  ceiling.target.position.set(0, 0, 1.4);
  scene.add(ceiling, ceiling.target);
  const coneMat = new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.2, 32, 1, true), coneMat);
  cone.position.set(0, 2.1, 1.3);
  scene.add(cone);
  const dustN = 420;
  const dustPos = new Float32Array(dustN * 3);
  const dustSeed: number[] = [];
  for (let i = 0; i < dustN; i += 1) {
    const h = rnd();
    const r = Math.sqrt(rnd()) * (0.15 + (1 - h) * 1.25);
    const a = rnd() * Math.PI * 2;
    dustPos.set([Math.cos(a) * r, 0.2 + h * 3.8, 1.3 + Math.sin(a) * r], i * 3);
    dustSeed.push(rnd() * 10);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dotTex = radialTexture('rgba(255,236,190,1)');
  const dustMat = new THREE.PointsMaterial({ size: 0.035, map: dotTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe8b8' });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  disposables.push(dustGeo, dustMat, dotTex, coneMat, winMat);

  // L'escabeau, l'enfant, le carnet.
  for (const s of [-1, 1]) {
    const leg = box(0.05, 1.6, 0.05, '#9a8a70', 0.5);
    leg.position.set(-2.3, 0.78, 0.6 + s * 0.22);
    leg.rotation.x = s * 0.18;
    scene.add(leg);
  }
  const kid = child(opts);
  kid.root.position.set(0, 0, 1.45);
  kid.setHeading(0);
  scene.add(kid.root);
  const flash = new THREE.SpotLight('#fff1cf', 0, 4, 0.45, 0.5, 1.2);
  flash.position.set(0.25, 0.9, 1.25);
  flash.target.position.set(0.35, 0, 0.9);
  scene.add(flash, flash.target);

  const notebook = new THREE.Group();
  const cover = box(0.22, 0.025, 0.3, '#7a2f2a', 0.7);
  const pages = box(0.2, 0.012, 0.28, '#efe2c4', 0.9);
  pages.position.y = 0.018;
  notebook.add(cover, pages);
  notebook.position.set(0.35, 0.014, 0.95);
  notebook.rotation.y = 0.4;
  notebook.visible = false;
  scene.add(notebook);
  const glowTex = radialTexture('rgba(255,226,150,0.95)');
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0.35, 0.12, 0.95);
  scene.add(glow);
  const glowLight = new THREE.PointLight('#ffd98a', 0, 5, 1.5);
  glowLight.position.set(0.35, 0.35, 0.95);
  scene.add(glowLight);
  const sparkN = 160;
  const sparkPos = new Float32Array(sparkN * 3);
  const sparkSeed = Array.from({ length: sparkN }, () => [rnd(), rnd(), rnd()] as const);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({ size: 0.05, map: dotTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe39a' });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);
  disposables.push(glowTex, glow.material, sparkGeo, sparkMat);

  // Livres qui tombent (repère « chute »).
  const fallen: { mesh: THREE.Mesh; from: number; to: THREE.Vector3; rot: THREE.Euler; delay: number }[] = [];
  for (let i = 0; i < 46; i += 1) {
    const b = box(0.26 + rnd() * 0.06, 0.04 + rnd() * 0.04, 0.18 + rnd() * 0.08, BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)]!, 0.75);
    const a = rnd() * Math.PI * 2;
    const r = 0.35 + rnd() * 1.1;
    const to = new THREE.Vector3(-0.6 + Math.cos(a) * r * 0.9, 0.03 + rnd() * 0.06, 1.3 + Math.sin(a) * r * 0.7);
    if (Math.hypot(to.x - 0.35, to.z - 0.95) < 0.22) to.x -= 0.4;
    b.visible = false;
    scene.add(b);
    fallen.push({ mesh: b, from: 1.4 + rnd() * 1.4, to, rot: new THREE.Euler(rnd() * 0.3, rnd() * Math.PI, rnd() * 0.3), delay: rnd() * 0.7 });
  }

  const ghosts = makeGhosts(plan.ghosts, [
    { x: 0.6, y: 1.55, z: 1.75 }, { x: -0.7, y: 1.3, z: 1.8 }, { x: 0.95, y: 1.0, z: 2.1 }, { x: -1.0, y: 1.75, z: 2.2 },
  ], disposables);
  for (const g of ghosts) scene.add(g.halo, g.sprite);

  // Éclairs : instants fixes (le grand éclair du plan « chute » compris).
  const bigFlash = cueAge(plan, 'eclair', 0);
  const flashes = [1.4, 4.6, 10.2, 16.4, ...(bigFlash !== null ? [-bigFlash + 0.15] : []), 31.5, 43];
  const lightningAt = (t: number): number => flashes.reduce((m, f) => (t >= f ? Math.max(m, Math.exp(-(t - f) * 6) * (Math.sin((t - f) * 40) > -0.3 ? 1 : 0.4)) : m), 0);

  function update(t: number, dt: number, speaker: string | null, mouthOpen: boolean): void {
    const eclair = cueAge(plan, 'eclair', t);
    // Le courant saute 0,4 s après le grand éclair (avec un petit grésillement).
    const powerOn = eclair === null || eclair < 0.4 || (eclair < 0.9 && Math.sin(eclair * 60) > 0.2);
    const lit = powerOn ? 1 : 0;
    deskLight.intensity = 6 * lit;
    (bulb.material as THREE.MeshBasicMaterial).color.set(powerOn ? '#ffe2a0' : '#3a2e22');
    ceiling.intensity = 30 * lit;
    coneMat.opacity = 0.045 * lit;
    const dustOn = cueAge(plan, 'poussiere', t);
    dustMat.opacity = (dustOn !== null && dustOn >= 0 ? Math.min(1, dustOn / 1.5) : 0.25) * (powerOn ? 0.9 : 0.15);
    for (let i = 0; i < dustN; i += 1) {
      const sd = dustSeed[i]!;
      dustPos[i * 3 + 1] = 0.2 + (((dustPos[i * 3 + 1]! - 0.2 + 0.0016 * (0.5 + Math.sin(sd + t))) % 3.8) + 3.8) % 3.8;
      dustPos[i * 3] = dustPos[i * 3]! + Math.sin(t * 0.7 + sd) * 0.0006;
    }
    dustGeo.attributes.position!.needsUpdate = true;
    hemi.intensity = powerOn ? 0.9 : 0.45;
    flash.intensity = powerOn ? 0 : 7;

    const L = lightningAt(t);
    winMat.color.set('#1a2238').lerp(new THREE.Color('#dbe6ff'), L);
    flashLight.intensity = L * 4;

    // Chute des livres.
    const chute = cueAge(plan, 'chute', t);
    for (const f of fallen) {
      const age = chute === null ? -1 : chute - 0.35 - f.delay;
      f.mesh.visible = age >= 0;
      if (age < 0) continue;
      const k = Math.min(1, age / 0.45);
      f.mesh.position.set(f.to.x, f.to.y + (1 - k * k) * f.from, f.to.z);
      f.mesh.rotation.set(f.rot.x * k + (1 - k) * 1.2, f.rot.y, f.rot.z * k);
    }

    const carnet = cueAge(plan, 'carnet', t);
    notebook.visible = chute !== null && chute > 0.9;
    const lueur = cueAge(plan, 'lueur', t);
    const g0 = carnet !== null && carnet >= 0 ? Math.min(0.5, carnet / 3) : 0;
    const g1 = lueur !== null && lueur >= 0 ? Math.min(1, lueur / 2.5) : 0;
    const pulse = 0.85 + 0.15 * Math.sin(t * 3);
    const gl = Math.max(g0, g1) * pulse;
    (glow.material as THREE.SpriteMaterial).opacity = gl;
    glow.scale.setScalar(0.5 + g1 * 1.6);
    glowLight.intensity = gl * 9;
    sparkMat.opacity = g1 * 0.9;
    for (let i = 0; i < sparkN; i += 1) {
      const [a, b, c] = sparkSeed[i]!;
      const life = ((t * (0.25 + a * 0.3) + b) % 1);
      const r = 0.05 + life * (0.3 + c * 0.6);
      sparkPos.set([0.35 + Math.cos(a * 40 + life * 3) * r, 0.05 + life * 2.2, 0.95 + Math.sin(a * 40 + life * 3) * r], i * 3);
    }
    sparkGeo.attributes.position!.needsUpdate = true;

    const smith = cueAge(plan, 'smith', t);
    animateGhosts(ghosts, plan, t, speaker, mouthOpen, { id: 'smith', at: { x: 0.6, y: 1.5, z: 1.5 }, age: smith });
    kid.update(dt, 0);
  }

  return {
    scene,
    update,
    dispose() {
      kid.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose()); else mat?.dispose();
        }
      });
      for (const d of disposables) d.dispose();
    },
  };
}

/* ------------------------------------------------------------------------------------------ */

function skyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#1d1830');
  grd.addColorStop(0.38, '#4a3350');
  grd.addColorStop(0.5, '#c25a40');
  grd.addColorStop(0.56, '#ffb46a');
  grd.addColorStop(0.62, '#3a2630');
  grd.addColorStop(1, '#2a1a14');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowsTexture(rnd: () => number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 128, 256);
  for (let y = 4; y < 256; y += 9) {
    for (let x = 3; x < 128; x += 8) {
      if (rnd() < 0.3) { g.fillStyle = rnd() < 0.8 ? '#ffcf7a' : '#9fc3dc'; g.fillRect(x, y, 3, 4); }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function buildRooftops(plan: CinematicPlan, opts: SetOptions): CineSet {
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const rnd = lcg(2020);
  const skyTex = skyTexture();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  scene.fog = new THREE.Fog('#5a3a44', 30, 140);
  disposables.push(skyTex);

  const roof = box(12, 0.3, 9, '#6b5a52');
  roof.position.set(0, -0.15, 0);
  scene.add(roof);
  const parapet = box(12, 0.55, 0.25, '#7a6a5e');
  parapet.position.set(0, 0.27, 4.4);
  scene.add(parapet);
  const vent = box(0.8, 0.9, 0.8, '#5a4a44');
  vent.position.set(-3.5, 0.45, -1.5);
  scene.add(vent);
  const antenna = box(0.05, 2.2, 0.05, '#3a2a2a');
  antenna.position.set(3.8, 1.1, -2.6);
  scene.add(antenna);

  // La ville au loin : immeubles aux fenêtres allumées, cheminées de Taret-Acier.
  const winTex = windowsTexture(rnd);
  const cityMat = new THREE.MeshStandardMaterial({ color: '#4a3644', emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.6, roughness: 1 });
  const cityGeo = new THREE.BoxGeometry(1, 1, 1);
  const N = 90;
  const city = new THREE.InstancedMesh(cityGeo, cityMat, N);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i += 1) {
    const h = 3 + rnd() * 16;
    const w = 3 + rnd() * 6;
    m4.compose(new THREE.Vector3(-70 + rnd() * 140, h / 2 - 9, 26 + rnd() * 90), new THREE.Quaternion(), new THREE.Vector3(w, h, 3 + rnd() * 5));
    city.setMatrixAt(i, m4);
  }
  scene.add(city);
  disposables.push(winTex, cityMat, cityGeo);
  for (const dx of [0, 6, 12]) {
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 34, 12), new THREE.MeshStandardMaterial({ color: '#1e1418', roughness: 1 }));
    ch.position.set(18 + dx, 9, 70);
    scene.add(ch);
    const red = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5a3a' }));
    red.position.set(18 + dx, 26.5, 70);
    scene.add(red);
  }
  const starN = 220;
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i += 1) {
    const a = rnd() * Math.PI * 2;
    const e = 0.35 + rnd() * 1.0;
    starPos.set([Math.cos(a) * Math.cos(e) * 180, Math.sin(e) * 180, Math.sin(a) * Math.cos(e) * 180], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.1, color: '#fff3d6', transparent: true, opacity: 0, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));
  disposables.push(starGeo, starMat);

  scene.add(new THREE.HemisphereLight('#7a6a9a', '#3a2420', 1.0));
  const sun = new THREE.DirectionalLight('#ffb070', 2.2);
  sun.position.set(-10, 6, 40);
  scene.add(sun);

  const kid = child(opts);
  kid.root.position.set(0, 0, 3.6);
  kid.setHeading(Math.PI);
  scene.add(kid.root);
  const friends = [
    createProceduralCharacter({ appearance: { ...opts.appearance }, gender: 'garcon', heightM: opts.heightM, bodyColor: '#4ea1ff' }),
    createProceduralCharacter({ appearance: { ...opts.appearance }, gender: 'fille', heightM: opts.heightM * 0.98, bodyColor: '#5cd6e8' }),
  ];
  friends[0]!.root.position.set(-0.8, 0, 3.4);
  friends[1]!.root.position.set(0.85, 0, 3.45);
  for (const f of friends) { f.setHeading(Math.PI); f.root.visible = false; scene.add(f.root); }

  const ghosts = makeGhosts(plan.ghosts, [{ x: 0.5, y: 2.1, z: 3.9 }, { x: -1.4, y: 1.9, z: 3.8 }, { x: 1.6, y: 1.6, z: 3.6 }], disposables);
  for (const g of ghosts) scene.add(g.halo, g.sprite);

  function update(t: number, dt: number, speaker: string | null, mouthOpen: boolean): void {
    const dusk = Math.min(1, t / 15);
    sun.intensity = 2.2 * (1 - dusk * 0.7);
    starMat.opacity = dusk * 0.9;
    cityMat.emissiveIntensity = 0.4 + dusk * 0.5;
    const amis = cueAge(plan, 'amis', t);
    for (const f of friends) { f.root.visible = amis !== null && amis >= 0; f.update(dt, 0); }
    animateGhosts(ghosts, plan, t, speaker, mouthOpen, null);
    kid.update(dt, 0);
  }

  return {
    scene,
    update,
    dispose() {
      kid.dispose();
      for (const f of friends) f.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose()); else mat?.dispose();
        }
      });
      for (const d of disposables) d.dispose();
    },
  };
}

export function buildSet(plan: CinematicPlan, opts: SetOptions): CineSet {
  return plan.set === 'toits' ? buildRooftops(plan, opts) : buildLibrary(plan, opts);
}
