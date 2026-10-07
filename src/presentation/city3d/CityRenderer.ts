/**
 * Moteur de rendu de la ville 3D à la troisième personne (Three.js).
 * Lit l'état du monde, ne le modifie jamais directement : le déplacement du joueur passe par
 * le rappel `onPlayerTile`, que la boucle de jeu relie à la simulation (`moveToTile`).
 * Voir docs/VISION.md §5.
 */
import * as THREE from 'three';
import type { NpcId, WorldState } from '../../core/types';
import { minutesOfDay } from '../../core/clock';
import { NPC_BY_ID } from '../../data/npcs';
import { GHOST_DEFS_BY_ID } from '../../data/ghosts/registry';
import { MAP_H, MAP_W, isWalkable } from '../../data/map';
import { npcPosition } from '../../simulation/npc';
import {
  VALID_HAIR_COLORS, VALID_HAIR_STYLES, VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES,
  type PlayerAppearance,
} from '../../core/types';
import { buildCityScene, groundHeightAt, type CityScene } from './cityScene';
import { createSkyDome, skyAt } from './sky';
import { createAmbient, type Ambient } from './ambient';
import { createCharacter, type Character3D } from './simpleCharacter';
import { findPath, stepBody, tileOf, type BodyState } from './locomotion';
import { INTERIOR_CELL, buildInterior, nearestHotspot, type BuiltInterior, type Hotspot, type InteriorSpec } from './interior3d';

export interface CityFrameInput {
  /** Direction demandée (clavier/joystick), x vers la droite, y vers le bas de l'écran. */
  move: { x: number; y: number };
  running: boolean;
  /** Le joueur peut-il bouger (pas de dialogue ouvert, pas endormi) ? */
  canMove: boolean;
}

interface NpcView {
  id: NpcId;
  ch: Character3D;
  x: number;
  z: number;
  target: string;
  path: { x: number; z: number }[];
  speed: number;
  tag: THREE.Sprite;
}

const NPC_SPEED_MIN = 1.4;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function npcAppearance(id: string): PlayerAppearance {
  const h = hash(id);
  return {
    skinTone: VALID_SKIN_TONES[h % VALID_SKIN_TONES.length]!,
    hairColor: VALID_HAIR_COLORS[(h >>> 3) % VALID_HAIR_COLORS.length]!,
    hairStyle: VALID_HAIR_STYLES[(h >>> 6) % VALID_HAIR_STYLES.length]!,
    outfitStyle: VALID_OUTFIT_STYLES[(h >>> 9) % VALID_OUTFIT_STYLES.length]!,
    outfitColor: VALID_OUTFIT_COLORS[(h >>> 12) % VALID_OUTFIT_COLORS.length]!,
  };
}

/** Taille selon l'âge : environ 1,52 m à 12 ans, jusqu'à 1,75 m adulte. */
export function heightForAge(age: number): number {
  if (age >= 18) return 1.72;
  return Math.min(1.75, 1.52 + Math.max(0, age - 12) * 0.035);
}

function textSprite(text: string, color = '#fbf3e2', bg = 'rgba(42,26,20,0.78)'): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = '600 28px system-ui, sans-serif';
  const w = Math.min(248, ctx.measureText(text).width + 28);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect((256 - w) / 2, 10, w, 44, 14);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sp.scale.set(1.6, 0.4, 1);
  sp.renderOrder = 10;
  return sp;
}

export class CityRenderer {
  readonly isWebGLAvailable: boolean;
  onContextLost?: () => void;
  /** Rappel vers la simulation : renvoie false si la tuile est refusée. */
  onPlayerTile?: (x: number, y: number) => boolean;

  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 1500);
  private city?: CityScene;
  private ambient?: Ambient;
  private sky = createSkyDome();
  private hemi = new THREE.HemisphereLight('#bcd4ff', '#8a7a62', 0.8);
  private sun = new THREE.DirectionalLight('#fff4e0', 2.5);
  private lampLights: THREE.PointLight[] = [];
  private lampRefresh = 0;
  private player?: Character3D;
  private playerKey = '';
  private body: BodyState = { x: 0, z: 0, heading: Math.PI, speed: 0 };
  private bodyReady = false;
  private lastSimTile = { x: -1, y: -1 };
  private npcs = new Map<string, NpcView>();
  private pathQueue: string[] = [];
  private ghost?: THREE.Sprite;
  private ghostKey = '';
  private rain?: THREE.LineSegments;
  private raycaster = new THREE.Raycaster();
  private camTarget = new THREE.Vector3();
  private frameCount = 0;
  // Caméra orbitale.
  private yaw = 0;
  private pitch = 0.42;
  private dist = 9;
  private yawTarget = 0;
  private distTarget = 9;
  private pitchTarget = 0.42;
  private topDown = false;
  private dragging: { id: number; x: number; y: number } | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    let ok = false;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      ok = true;
    } catch (err) {
      console.warn('WebGL indisponible, rendu 3D désactivé.', err);
    }
    this.isWebGLAvailable = ok;
    if (!ok) return;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.onContextLost?.();
    });
    this.setupScene();
    this.attachControls();
  }

  /** Azimut de la caméra autour du joueur (0 = caméra au sud). */
  get cameraYaw(): number { return this.yaw; }
  get isTopDown(): boolean { return this.topDown; }
  /** Position continue et cap du joueur (mini-carte, repères). */
  get playerPose(): { x: number; z: number; heading: number } { return { x: this.body.x, z: this.body.z, heading: this.body.heading }; }

  private setupScene(): void {
    this.city = buildCityScene();
    this.scene.add(this.city.group);
    this.scene.add(this.sky.mesh);
    this.scene.add(this.hemi);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 400;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    this.scene.fog = new THREE.Fog('#cfe2f0', 70, 460);
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PointLight('#ffc27a', 0, 16, 1.6);
      this.lampLights.push(l);
      this.scene.add(l);
    }
    this.ambient = createAmbient();
    this.scene.add(this.ambient.group);
    // Pluie : segments recyclés dans un volume qui suit la caméra.
    const N = 2400;
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const z = (Math.sin(i * 78.233) * 12345.678) % 1;
      const y = (Math.sin(i * 3.17) * 999.1) % 1;
      pos.set([x * 40, Math.abs(y) * 25, z * 40, x * 40, Math.abs(y) * 25 - 0.5, z * 40], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#a9bdd0', transparent: true, opacity: 0.45 }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  private attachControls(): void {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      this.dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.dragging || this.dragging.id !== e.pointerId) return;
      const dx = e.clientX - this.dragging.x;
      const dy = e.clientY - this.dragging.y;
      this.dragging.x = e.clientX;
      this.dragging.y = e.clientY;
      this.yawTarget -= dx * 0.006;
      if (!this.topDown) this.pitchTarget = Math.max(0.12, Math.min(1.25, this.pitchTarget + dy * 0.004));
    });
    const end = (e: PointerEvent): void => {
      if (this.dragging?.id === e.pointerId) this.dragging = null;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distTarget = Math.max(3.2, Math.min(this.topDown ? 120 : 40, this.distTarget * (1 + Math.sign(e.deltaY) * 0.12)));
    }, { passive: false });
  }

  rotateLeft(): void { this.yawTarget += Math.PI / 4; }
  rotateRight(): void { this.yawTarget -= Math.PI / 4; }
  zoomIn(): void { this.distTarget = Math.max(3.2, this.distTarget * 0.8); }
  zoomOut(): void { this.distTarget = Math.min(this.topDown ? 120 : 40, this.distTarget * 1.25); }
  toggleTopDown(): void {
    this.topDown = !this.topDown;
    this.pitchTarget = this.topDown ? 1.35 : 0.42;
    this.distTarget = this.topDown ? 60 : 9;
  }

  setUnitSign(unitId: string, text: string, color: string): void {
    this.city?.setUnitSign(unitId, text, color);
  }

  // ---------- Repères de destination (colonne lumineuse + flèche) ----------
  private waypointGroup = new THREE.Group();
  private waypointKey = '';

  /** Affiche des repères au-dessus des tuiles données (retrait de cartons, boutique à livrer…). */
  setWaypoints(points: { x: number; y: number; color: string }[]): void {
    const key = JSON.stringify(points);
    if (key === this.waypointKey) return;
    this.waypointKey = key;
    for (const c of [...this.waypointGroup.children]) {
      c.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
      this.waypointGroup.remove(c);
    }
    if (!this.waypointGroup.parent) this.scene.add(this.waypointGroup);
    for (const p of points) {
      const g = new THREE.Group();
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.6, 14, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
      );
      beam.position.y = 7;
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.9, 4),
        new THREE.MeshBasicMaterial({ color: p.color }),
      );
      arrow.rotation.x = Math.PI;
      arrow.position.y = 3.2;
      arrow.userData.bob = true;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.95, 32),
        new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.2;
      g.add(beam, arrow, ring);
      g.position.set(p.x + 0.5, groundHeightAt(p.x + 0.5, p.y + 0.5), p.y + 0.5);
      this.waypointGroup.add(g);
    }
  }

  // ---------- Files de clients devant les étals ouverts du joueur ----------
  private stallCrowds = new Map<string, Character3D[]>();

  /** Nombre de clients à afficher devant chaque étal (clé : tuile de l'étal). */
  setStallCustomers(stalls: { x: number; y: number; count: number }[]): void {
    const wanted = new Map(stalls.map((s) => [`${s.x},${s.y}`, s]));
    for (const [key, chars] of this.stallCrowds) {
      const want = wanted.get(key)?.count ?? 0;
      while (chars.length > want) chars.pop()!.dispose();
      if (chars.length === 0) this.stallCrowds.delete(key);
    }
    for (const [key, s] of wanted) {
      const chars = this.stallCrowds.get(key) ?? [];
      while (chars.length < Math.min(5, s.count)) {
        const i = chars.length;
        const ch = createCharacter({
          appearance: npcAppearance(`etal${key}_${i}`),
          heightM: i % 3 === 0 ? 1.4 : 1.6 + (i % 2) * 0.12,
          bodyColor: ['#5a6b7a', '#7a5a4a', '#3f4f3f', '#a0522d', '#6b4e71'][i % 5],
        });
        // En file devant l'étal (côté sud), légèrement décalés.
        const x = s.x + 0.5 + (i % 2 === 0 ? -0.5 : 0.5) * (1 + Math.floor(i / 2) * 0.3);
        const z = s.y + 1.6 + Math.floor(i / 2) * 0.9;
        ch.root.position.set(x, groundHeightAt(x, z), z);
        ch.setHeading(Math.atan2(-(s.x + 0.5 - x), -(s.y + 0.5 - z)));
        this.scene.add(ch.root);
        chars.push(ch);
      }
      this.stallCrowds.set(key, chars);
    }
  }

  private animateCrowds(dt: number): void {
    for (const chars of this.stallCrowds.values()) for (const c of chars) c.update(dt, 0);
  }

  private animateWaypoints(): void {
    const t = performance.now() / 1000;
    for (const g of this.waypointGroup.children) {
      for (const c of g.children) {
        if (c.userData.bob) {
          c.position.y = 3.2 + Math.sin(t * 2.4) * 0.25;
          c.rotation.y = t * 1.5;
        }
      }
    }
  }

  /** Avance la présentation d'une image : déplacement du joueur, PNJ, ambiance, rendu. */
  frame(world: WorldState, dt: number, input: CityFrameInput, cw: number, ch: number): void {
    if (!this.renderer || !this.city) return;
    this.frameCount++;
    if (this.interior) {
      this.frameInterior(world, dt, input, cw, ch);
      return;
    }
    this.syncPlayer(world, dt, input);
    this.syncNpcs(world, dt);
    this.syncGhost(world, dt);

    // Lumière selon l'heure et la météo.
    const hour = minutesOfDay(world.time.tick) / 60;
    const s = skyAt(hour, world.district.meteo);
    this.sky.update(s);
    this.sky.mesh.position.copy(this.camera.position);
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiIntensity;
    this.sun.color.copy(s.sunColor);
    this.sun.intensity = s.sunIntensity;
    const focus = new THREE.Vector3(this.body.x, 0, this.body.z);
    this.sun.position.copy(focus).addScaledVector(s.sunDir, 150);
    this.sun.target.position.copy(focus);
    (this.scene.fog as THREE.Fog).color.copy(s.fogColor);
    const rainy = world.district.meteo === 'pluie';
    (this.scene.fog as THREE.Fog).far = rainy ? 230 : 460;
    this.renderer.toneMappingExposure = s.exposure;
    for (const { mat, strength } of this.city.nightMaterials) mat.emissiveIntensity = s.night * strength;
    for (const g of this.city.glowSprites) (g.material as THREE.SpriteMaterial).opacity = s.night * 0.85;
    // Lampadaires proches éclairés par de vraies lumières (les autres par leur halo).
    this.lampRefresh -= dt;
    if (this.lampRefresh <= 0) {
      this.lampRefresh = 0.4;
      const near = [...this.city.lampPositions]
        .sort((a, b) => a.distanceToSquared(focus) - b.distanceToSquared(focus))
        .slice(0, this.lampLights.length);
      this.lampLights.forEach((l, i) => { const p = near[i]; if (p) l.position.copy(p); });
    }
    for (const l of this.lampLights) l.intensity = s.night * 22;
    // Eau qui ondule doucement.
    (this.city.water.material as THREE.MeshStandardMaterial).color.setHSL(0.53, 0.3, 0.32 + Math.sin(performance.now() / 1300) * 0.015 - s.night * 0.15);

    this.ambient?.update(dt, { x: this.body.x, z: this.body.z }, s.night);
    this.animateWaypoints();
    this.animateCrowds(dt);
    if (this.rain) {
      this.rain.visible = rainy;
      if (rainy) {
        const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < arr.length; i += 6) {
          arr[i + 1]! -= 22 * dt;
          arr[i + 4]! -= 22 * dt;
          if (arr[i + 4]! < 0) { arr[i + 1]! += 25; arr[i + 4]! += 25; }
        }
        pos.needsUpdate = true;
        this.rain.position.set(this.body.x - 20, 0, this.body.z - 20);
      }
    }

    this.updateCamera(dt, cw, ch);
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.warn('Rendu 3D interrompu.', err);
      this.onContextLost?.();
    }
  }

  private syncPlayer(world: WorldState, dt: number, input: CityFrameInput): void {
    const p = world.player;
    const key = JSON.stringify(p.appearance) + p.age;
    if (!this.player || key !== this.playerKey) {
      this.player?.dispose();
      this.player = createCharacter({ appearance: p.appearance, gender: p.gender, heightM: heightForAge(p.age) });
      this.scene.add(this.player.root);
      this.playerKey = key;
    }
    // La simulation a déplacé le joueur (chargement, sommeil, téléportation) : on suit.
    if (!this.bodyReady || p.pos.x !== this.lastSimTile.x || p.pos.y !== this.lastSimTile.y) {
      const t = tileOf(this.body);
      if (!this.bodyReady || t.x !== p.pos.x || t.y !== p.pos.y) {
        this.body = { ...this.body, x: p.pos.x + 0.5, z: p.pos.y + 0.5, speed: 0 };
      }
      if (!this.bodyReady) this.pickOpenYaw();
      this.bodyReady = true;
      this.lastSimTile = { ...p.pos };
    }
    const move = input.canMove ? input.move : { x: 0, y: 0 };
    const next = stepBody(this.body, move, this.yaw, Math.min(dt, 0.05), input.running, isWalkable);
    const nt = tileOf(next);
    if (nt.x !== p.pos.x || nt.y !== p.pos.y) {
      const accepted = this.onPlayerTile ? this.onPlayerTile(nt.x, nt.y) : false;
      if (accepted) {
        this.body = next;
        this.lastSimTile = { x: nt.x, y: nt.y };
      } else {
        this.body = { ...this.body, speed: 0 };
      }
    } else {
      this.body = next;
    }
    this.player.root.position.set(this.body.x, groundHeightAt(this.body.x, this.body.z), this.body.z);
    this.player.setHeading(this.body.heading);
    this.player.update(dt, this.body.speed);
    this.player.root.visible = !p.asleep;
  }

  private syncNpcs(world: WorldState, dt: number): void {
    for (const id of Object.keys(world.npcs)) {
      const def = NPC_BY_ID[id];
      const target = npcPosition(world, id);
      const tkey = `${target.x},${target.y}`;
      let v = this.npcs.get(id);
      if (!v) {
        const ch = createCharacter({
          appearance: npcAppearance(id),
          heightM: heightForAge(def?.age ?? 30),
          bodyColor: def?.color,
        });
        this.scene.add(ch.root);
        const tag = textSprite(def?.name ?? id);
        this.scene.add(tag);
        v = { id, ch, x: target.x + 0.5, z: target.y + 0.5, target: tkey, path: [], speed: NPC_SPEED_MIN, tag };
        this.npcs.set(id, v);
      }
      if (v.target !== tkey) {
        v.target = tkey;
        if (!this.pathQueue.includes(id)) this.pathQueue.push(id);
      }
    }
    // Une recherche de chemin par image au plus : jamais d'à-coup.
    const next = this.pathQueue.shift();
    if (next) {
      const v = this.npcs.get(next)!;
      const [tx, ty] = v.target.split(',').map(Number) as [number, number];
      const path = findPath({ x: Math.floor(v.x), y: Math.floor(v.z) }, { x: tx, y: ty }, isWalkable, MAP_W, MAP_H);
      if (path.length === 0) {
        v.x = tx + 0.5; v.z = ty + 0.5; v.path = [];
      } else {
        v.path = path;
        let len = 0;
        let px = v.x;
        let pz = v.z;
        for (const p of path) { len += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; }
        // Les trajets longs sont un peu pressés pour arriver avant le prochain créneau.
        v.speed = Math.min(5, Math.max(NPC_SPEED_MIN, len / 50));
      }
    }
    for (const v of this.npcs.values()) {
      let speed = 0;
      const wp = v.path[0];
      if (wp) {
        const dx = wp.x - v.x;
        const dz = wp.z - v.z;
        const d = Math.hypot(dx, dz);
        const step = v.speed * dt;
        if (d <= step) { v.x = wp.x; v.z = wp.z; v.path.shift(); }
        else { v.x += (dx / d) * step; v.z += (dz / d) * step; }
        speed = v.speed;
        if (d > 0.01) v.ch.setHeading(Math.atan2(-dx, -dz));
      } else {
        // À l'arrêt : se tourne vers le joueur s'il est proche.
        const dx = this.body.x - v.x;
        const dz = this.body.z - v.z;
        if (Math.hypot(dx, dz) < 4) v.ch.setHeading(Math.atan2(-dx, -dz));
      }
      const y = groundHeightAt(v.x, v.z);
      // Chez lui (ou endormi), un habitant est à l'intérieur : on ne le voit plus une fois arrivé.
      const st = world.npcs[v.id];
      const indoors = !!st && (st.place === 'maison' || st.activity === 'dort') && v.path.length === 0 && !this.pathQueue.includes(v.id);
      v.ch.root.visible = !indoors;
      v.ch.root.position.set(v.x, y, v.z);
      v.ch.update(dt, speed);
      const near = Math.hypot(this.body.x - v.x, this.body.z - v.z);
      v.tag.visible = near < 14 && !indoors;
      v.tag.position.set(v.x, y + 2.15, v.z);
    }
  }

  /** Compagnon fantôme « kawaii » qui flotte près de l'épaule du joueur. */
  private syncGhost(world: WorldState, _dt: number): void {
    const gid = world.ghostCompanion?.activeGhostId;
    const def = gid ? GHOST_DEFS_BY_ID[gid] : undefined;
    const key = def ? `${gid}` : '';
    if (key !== this.ghostKey) {
      this.ghost?.removeFromParent();
      this.ghost = undefined;
      this.ghostKey = key;
      if (def) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d')!;
        const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
        g.addColorStop(0, `${def.color}ee`);
        g.addColorStop(1, `${def.color}00`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        ctx.font = '64px system-ui, "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', 64, 66);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        this.ghost.scale.set(0.42, 0.42, 1);
        this.scene.add(this.ghost);
      }
    }
    if (this.ghost) {
      const t = performance.now() / 1000;
      const side = this.yaw + Math.PI / 2;
      this.ghost.position.set(
        this.body.x + Math.sin(side) * 0.85,
        groundHeightAt(this.body.x, this.body.z) + 1.95 + Math.sin(t * 2.2) * 0.1,
        this.body.z + Math.cos(side) * 0.85,
      );
    }
  }

  /** Au démarrage, place la caméra du côté le plus dégagé (jamais dans un mur). */
  private pickOpenYaw(): void {
    if (!this.city) return;
    const origin = new THREE.Vector3(this.body.x, groundHeightAt(this.body.x, this.body.z) + 1.35, this.body.z);
    const freeAt = (yaw: number): number => {
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(0.42), Math.sin(0.42), Math.cos(yaw) * Math.cos(0.42));
      this.raycaster.set(origin, dir);
      this.raycaster.far = 30;
      const hit = this.raycaster.intersectObjects(this.city!.buildingMeshes, false)[0];
      return hit ? hit.distance : 30;
    };
    // On note un cône autour de chaque direction : un rayon qui longe un mur est pénalisé.
    let best = { yaw: this.yaw, free: -1 };
    for (let i = 0; i < 16; i++) {
      const yaw = (i / 16) * Math.PI * 2;
      const free = Math.min(freeAt(yaw - 0.45), freeAt(yaw), freeAt(yaw + 0.45));
      if (free > best.free) best = { yaw, free };
    }
    this.yaw = this.yawTarget = best.yaw;
  }

  private updateCamera(dt: number, cw: number, ch: number): void {
    const k = Math.min(1, dt * 7);
    this.yaw += (this.yawTarget - this.yaw) * k;
    this.pitch += (this.pitchTarget - this.pitch) * k;
    this.dist += (this.distTarget - this.dist) * k;
    const gy = groundHeightAt(this.body.x, this.body.z);
    const target = new THREE.Vector3(this.body.x, gy + 1.35, this.body.z);
    if (this.camTarget.lengthSq() === 0) this.camTarget.copy(target);
    this.camTarget.lerp(target, Math.min(1, dt * 10));
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    let d = this.dist;
    // La caméra ne traverse pas les murs : on la rapproche si un bâtiment s'interpose.
    if (!this.topDown && this.city && this.frameCount % 2 === 0) {
      this.raycaster.set(this.camTarget, dir);
      this.raycaster.far = this.dist;
      const hit = this.raycaster.intersectObjects(this.city.buildingMeshes, false)[0];
      this.lastCamClip = hit ? Math.max(1.2, hit.distance - 0.35) : this.dist;
    }
    if (!this.topDown) d = Math.min(d, this.lastCamClip ?? d);
    this.camera.position.copy(this.camTarget).addScaledVector(dir, d);
    this.camera.lookAt(this.camTarget);
    const w = Math.max(1, cw);
    const h = Math.max(1, ch);
    if (this.camera.aspect !== w / h) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    const size = this.renderer!.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) this.renderer!.setSize(w, h, false);
  }
  private lastCamClip?: number;

  // ---------- Intérieurs praticables ----------
  private interior?: BuiltInterior;
  private interiorScene = new THREE.Scene();
  private cityBody?: BodyState;
  private cityCam?: { yaw: number; pitch: number; dist: number };
  private interiorNpcs: { id: string; ch: Character3D }[] = [];
  private customers: { ch: Character3D; path: { x: number; z: number }[]; i: number; t: number; speed: number; pos: THREE.Vector3 }[] = [];

  get inInterior(): boolean { return !!this.interior; }
  get interiorSpec(): InteriorSpec | undefined { return this.interior?.spec; }

  /** Point d'interaction à portée dans l'intérieur courant. */
  get interiorHotspot(): Hotspot | null {
    return this.interior ? nearestHotspot(this.interior.spec, this.body.x, this.body.z) : null;
  }

  /** Entre dans un intérieur : la ville est mise en pause visuelle, le joueur apparaît sur le seuil. */
  enterInterior(spec: InteriorSpec, world: WorldState, opts: { customers?: number } = {}): void {
    if (!this.player) return;
    const same = this.interior?.spec.key === spec.key;
    if (same) return;
    const wasInside = !!this.interior;
    // Même commerce reconstruit (aménagement, stock) : le joueur et la caméra ne bougent pas.
    const keepPose = wasInside && !!spec.businessId && this.interior?.spec.businessId === spec.businessId;
    const pose = { ...this.body };
    const cam = { yaw: this.yawTarget, pitch: this.pitchTarget, dist: this.distTarget };
    this.clearInterior();
    if (!wasInside) {
      this.cityBody = { ...this.body };
      this.cityCam = { yaw: this.yawTarget, pitch: this.pitchTarget, dist: this.distTarget };
    }
    this.interior = buildInterior(spec);
    this.interiorScene.add(this.interior.group);
    this.interiorScene.background = new THREE.Color('#1c140f');
    this.interiorScene.add(this.player.root);
    if (this.ghost) this.interiorScene.add(this.ghost);
    if (keepPose) {
      this.body = pose;
      this.yawTarget = cam.yaw;
      this.pitchTarget = cam.pitch;
      this.distTarget = cam.dist;
    } else {
      this.body = { x: this.interior.spawn.x, z: this.interior.spawn.z, heading: this.interior.spawn.heading, speed: 0 };
      this.yaw = this.yawTarget = 0;
      this.pitch = this.pitchTarget = 0.95;
      this.dist = this.distTarget = Math.max(7, Math.max(spec.w, spec.d) * 0.85);
      this.camTarget.set(this.body.x, 1.2, this.body.z);
    }
    // Habitants présents dans ce lieu : chacun à son poste.
    if (spec.placeId) {
      const present = Object.values(world.npcs).filter((n) => n.place === spec.placeId && n.activity !== 'dort');
      present.slice(0, spec.npcSlots.length).forEach((n, i) => {
        const def = NPC_BY_ID[n.id];
        const ch = createCharacter({ appearance: npcAppearance(n.id), heightM: heightForAge(def?.age ?? 30), bodyColor: def?.color });
        const slot = spec.npcSlots[i]!;
        ch.root.position.set(slot.x, 0, slot.z);
        ch.setHeading(slot.face);
        this.interiorScene.add(ch.root);
        this.interiorNpcs.push({ id: n.id, ch });
      });
    }
    // Clients d'un commerce ouvert : ils flânent entre les rayons et la caisse.
    for (let i = 0; i < (opts.customers ?? 0); i++) {
      const r = (k: number): number => ((Math.sin((i + 1) * 91.7 + k * 12.3) * 43758.5) % 1 + 1) % 1;
      const ch = createCharacter({
        appearance: npcAppearance(`client${i}`),
        heightM: 1.55 + r(1) * 0.3,
        bodyColor: ['#5a6b7a', '#7a5a4a', '#3f4f3f', '#a0522d', '#6b4e71'][i % 5],
      });
      const pts = [
        { x: spec.w / 2, z: spec.d - 1.2 },
        ...spec.hotspots.filter((h) => h.kind !== 'sortie').map((h) => ({ x: h.x, z: h.z })),
        ...spec.items.slice(0, 3).map((it) => ({ x: it.x, z: Math.min(spec.d - 1.5, it.z + it.d / 2 + 0.8) })),
      ];
      this.interiorScene.add(ch.root);
      this.customers.push({ ch, path: pts, i: i % pts.length, t: r(2), speed: 0.9 + r(3) * 0.4, pos: new THREE.Vector3(pts[0]!.x, 0, pts[0]!.z) });
    }
  }

  /** Ressort dans la rue, devant la porte. */
  exitInterior(): void {
    if (!this.interior) return;
    this.clearInterior();
    if (this.player) this.scene.add(this.player.root);
    if (this.ghost) this.scene.add(this.ghost);
    if (this.cityBody) this.body = { ...this.cityBody, speed: 0, heading: this.cityBody.heading + Math.PI };
    if (this.cityCam) {
      this.yaw = this.yawTarget = this.cityCam.yaw;
      this.pitch = this.pitchTarget = this.cityCam.pitch;
      this.dist = this.distTarget = this.cityCam.dist;
    }
    this.camTarget.set(this.body.x, 1.3, this.body.z);
  }

  private clearInterior(): void {
    if (!this.interior) return;
    for (const n of this.interiorNpcs) n.ch.dispose();
    for (const c of this.customers) c.ch.dispose();
    this.interiorNpcs = [];
    this.customers = [];
    this.interiorScene.remove(this.interior.group);
    this.interior.dispose();
    this.interior = undefined;
  }

  private frameInterior(world: WorldState, dt: number, input: CityFrameInput, cw: number, ch: number): void {
    const it = this.interior!;
    const move = input.canMove ? input.move : { x: 0, y: 0 };
    this.body = stepBody(this.body, move, this.yaw, Math.min(dt, 0.05), input.running, it.walkable, INTERIOR_CELL, 0.75);
    if (this.player) {
      this.player.root.position.set(this.body.x, 0, this.body.z);
      this.player.setHeading(this.body.heading);
      this.player.update(dt, this.body.speed);
      this.player.root.visible = true;
    }
    for (const n of this.interiorNpcs) {
      // Les habitants regardent le joueur quand il s'approche.
      const dx = this.body.x - n.ch.root.position.x;
      const dz = this.body.z - n.ch.root.position.z;
      if (Math.hypot(dx, dz) < 3) n.ch.setHeading(Math.atan2(-dx, -dz));
      n.ch.update(dt, 0);
    }
    for (const c of this.customers) {
      const a = c.path[c.i]!;
      const b = c.path[(c.i + 1) % c.path.length]!;
      const len = Math.max(0.01, Math.hypot(b.x - a.x, b.z - a.z));
      c.t += (c.speed * dt) / len;
      let speed = c.speed;
      if (c.t >= 1) {
        // Pause devant chaque rayon (le client choisit).
        if (c.t < 1 + 2.5 / len * c.speed) { speed = 0; } else { c.t = 0; c.i = (c.i + 1) % c.path.length; }
      }
      const t = Math.min(1, c.t);
      const a2 = c.path[c.i]!;
      const b2 = c.path[(c.i + 1) % c.path.length]!;
      c.pos.set(a2.x + (b2.x - a2.x) * t, 0, a2.z + (b2.z - a2.z) * t);
      c.ch.root.position.copy(c.pos);
      if (speed > 0) c.ch.setHeading(Math.atan2(-(b2.x - a2.x), -(b2.z - a2.z)));
      c.ch.update(dt, speed);
    }
    this.syncGhost(world, dt);
    // Caméra : plongée douce, murs côté caméra escamotés (vue en coupe).
    const k = Math.min(1, dt * 7);
    this.yaw += (this.yawTarget - this.yaw) * k;
    this.pitch += (Math.max(0.55, this.pitchTarget) - this.pitch) * k;
    this.dist += (Math.min(14, this.distTarget) - this.dist) * k;
    const target = new THREE.Vector3(this.body.x, 1.1, this.body.z);
    this.camTarget.lerp(target, Math.min(1, dt * 8));
    const dir = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.position.copy(this.camTarget).addScaledVector(dir, this.dist);
    this.camera.lookAt(this.camTarget);
    const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    for (const wl of it.walls) {
      const facing = wl.normal.dot(flat) > 0.25;
      wl.mesh.scale.y = facing ? 0.12 : 1;
      wl.mesh.position.y = (facing ? 0.12 : 1) * 2.9 / 2;
    }
    const w = Math.max(1, cw);
    const h = Math.max(1, ch);
    if (this.camera.aspect !== w / h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    const size = this.renderer!.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) this.renderer!.setSize(w, h, false);
    this.renderer!.toneMappingExposure = 1.05;
    try {
      this.renderer!.render(this.interiorScene, this.camera);
    } catch (err) {
      console.warn('Rendu intérieur interrompu.', err);
      this.onContextLost?.();
    }
  }

  /**
   * Outil de QA (inspection) : rend `frames` images d'affilée sans boucle d'animation, puis
   * renvoie la capture JPEG. Sert aux vérifications visuelles quand la fenêtre est masquée.
   */
  snapshot(world: WorldState, cw: number, ch: number, opts: { frames?: number; yaw?: number; pitch?: number; dist?: number; move?: { x: number; y: number }; running?: boolean } = {}): string {
    if (opts.yaw !== undefined) { this.yaw = this.yawTarget = opts.yaw; }
    if (opts.pitch !== undefined) { this.pitch = this.pitchTarget = opts.pitch; }
    if (opts.dist !== undefined) { this.dist = this.distTarget = opts.dist; }
    const n = opts.frames ?? 30;
    const move = opts.move ?? { x: 0, y: 0 };
    for (let i = 0; i < n; i++) this.frame(world, 1 / 30, { move, running: !!opts.running, canMove: true }, cw, ch);
    return this.canvas.toDataURL('image/jpeg', 0.82);
  }

  dispose(): void {
    this.ambient?.dispose();
    this.city?.dispose();
    this.player?.dispose();
    for (const v of this.npcs.values()) { v.ch.dispose(); v.tag.removeFromParent(); }
    this.renderer?.dispose();
  }
}
