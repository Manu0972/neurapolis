/**
 * Construction de la scène statique de la ville à partir de src/data/city (lecture seule).
 * Sols par revêtement (RLE de la grille), bordures de trottoir, marquages, bâtiments à façades
 * texturées en modules, toits, enseignes, mobilier instancié. Repère : X = est, Z = sud, Y = haut,
 * 1 unité = 1 m = 1 tuile.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CITY, CITY_H, CITY_W } from '../../data/city/layout';
import { surfaceAt, surfaceFast, type Surface } from '../../data/map';
import { BUS_STOPS } from '../../data/city/transit';
import { buildLotProps } from './lotProps';
import { CHUNK, chunkify, type CityChunk } from './chunks';
import { buildCityBuildings } from './cityBuildings';
import {
  asphaltTexture, cobbleTexture, dirtTexture, glowTexture, grassTexture, gravelTexture, parkingTexture,
  groundBumpTexture, playgroundTexture, sidewalkTexture, skylineTexture, visualRng,
} from './textures';
import { makeFoliageOccludable } from './occlusion';
import { applyGroundPhoto, enhanceFacadeMaterial, enhanceGroundMaterial, setFacadePhoto, shapeCrownGeometry, type GroundKind } from './materials';
import { isGenericHouse, textureVariation, varyUv } from './assetsPlan';
import { loadPhoto } from './assetsPolyhaven';
import { buildKenneyDecor } from './skyline';
import { freezeStatic } from './lodScene';
import type { LodView } from './lod';

export const SURFACE_HEIGHT: Record<Surface, number> = {
  chaussee: 0, passage: 0, parking: 0.02,
  trottoir: 0.15, pave: 0.15, batiment: 0.15, cour: 0.15, aire_jeux: 0.16,
  herbe: 0.14, terre: 0.12, gravier: 0.13,
  eau: -0.55,
};

/** Hauteur du sol sous un point du monde (pour poser les personnages). */
export function groundHeightAt(x: number, z: number): number {
  const s = surfaceAt(Math.floor(x), Math.floor(z));
  return s ? SURFACE_HEIGHT[s] : 0;
}

export interface CityScene {
  group: THREE.Group;
  /** Matériaux dont l'émission suit la nuit (fenêtres, vitrines, ampoules). */
  nightMaterials: { mat: THREE.MeshStandardMaterial; strength: number }[];
  /** Positions des lampadaires (pour les lumières dynamiques et les halos). */
  lampPositions: THREE.Vector3[];
  glowSprites: THREE.Sprite[];
  /** Maillages des bâtiments (collision de caméra). */
  buildingMeshes: THREE.Mesh[];
  /** Enseignes des locaux commerciaux, modifiables quand un commerce ouvre. */
  setUnitSign(unitId: string, text: string, color: string): void;
  water: THREE.Mesh;
  /** Blocs de 128 m (grande carte) : visibilité selon la distance à la caméra. */
  chunks: CityChunk[];
  /** Niveaux de détail des modèles Kenney (maisons, décor lointain) selon la caméra (skyline.ts). */
  updateLod(view: LodView, houseNear: number, skylineNear: number, far: number): void;
  /** Instances Kenney dessinées en version complète / simplifiée (QA). */
  lodCounts(): { full: number; proxy: number };
  dispose(): void;
}

// ---------- Outillage de géométrie ----------

class GeoBuilder {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: number[] = [];
  /** Quadrilatère a-b-c-d (sens trigonométrique vu de la face visible). */
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, uvs: number[], color: THREE.Color = WHITE): void {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
    const base = this.pos.length / 3;
    for (const p of [a, b, c, d]) {
      this.pos.push(p.x, p.y, p.z);
      this.nor.push(n.x, n.y, n.z);
      this.col.push(color.r, color.g, color.b);
    }
    this.uv.push(...uvs);
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, uvs: number[], color: THREE.Color = WHITE): void {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const base = this.pos.length / 3;
    for (const p of [a, b, c]) {
      this.pos.push(p.x, p.y, p.z);
      this.nor.push(n.x, n.y, n.z);
      this.col.push(color.r, color.g, color.b);
    }
    this.uv.push(...uvs);
    this.idx.push(base, base + 1, base + 2);
  }
  build(): THREE.BufferGeometry | null {
    if (this.idx.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}
const WHITE = new THREE.Color(1, 1, 1);
const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** Mur vertical de (x0,z0) à (x1,z1), de y0 à y1, face extérieure à droite du sens de parcours. */
function wall(g: GeoBuilder, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, uScale: number, vScale: number, vOff = 0, color?: THREE.Color, uOff = 0): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const u0 = uOff;
  const u1 = uOff + len / uScale;
  const v0 = vOff + y0 / vScale;
  const v1 = vOff + y1 / vScale;
  g.quad(V(x0, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z0), [u0, v0, u1, v0, u1, v1, u0, v1], color);
}

// ---------- Sols ----------

function groundMaterials(): Record<Surface, THREE.MeshStandardMaterial | null> {
  // Relief procédural, flaques sous la pluie et variation lente de teinte (materials.ts).
  const m = (map: THREE.Texture, rough = 0.95, color = '#ffffff', kind: GroundKind = 'dur', bump?: THREE.Texture, bumpScale = 1): THREE.MeshStandardMaterial => {
    const mat = new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, color });
    enhanceGroundMaterial(mat, kind, bump, bumpScale);
    return mat;
  };
  const side = m(sidewalkTexture(), 0.9, '#ffffff', 'dur', groundBumpTexture('dalles'), 1.2);
  const asphalt = m(asphaltTexture(), 0.88, '#ffffff', 'dur', groundBumpTexture('asphalte'), 0.6);
  return {
    chaussee: asphalt,
    passage: asphalt,
    parking: m(parkingTexture(), 0.9, '#ffffff', 'dur', groundBumpTexture('asphalte'), 0.6),
    trottoir: side,
    batiment: side,
    cour: m(cobbleTexture(), 0.95, '#cfc6b8', 'dur', groundBumpTexture('paves'), 1.6),
    pave: m(cobbleTexture(), 0.92, '#ffffff', 'dur', groundBumpTexture('paves'), 1.6),
    herbe: m(grassTexture(), 1, '#ffffff', 'herbe', groundBumpTexture('herbe'), 0.8),
    aire_jeux: m(playgroundTexture(), 0.95, '#ffffff', 'meuble', groundBumpTexture('grain'), 0.4),
    terre: m(dirtTexture(), 1, '#ffffff', 'meuble', groundBumpTexture('grain'), 0.9),
    gravier: m(gravelTexture(), 1, '#ffffff', 'meuble', groundBumpTexture('grain'), 1.1),
    eau: null, // l'eau a son propre maillage
  };
}

function buildGround(group: THREE.Group, disposables: { dispose(): void }[]): THREE.Mesh {
  const mats = groundMaterials();
  const builders = new Map<Surface, GeoBuilder>();
  const get = (s: Surface): GeoBuilder => {
    let b = builders.get(s);
    if (!b) { b = new GeoBuilder(); builders.set(s, b); }
    return b;
  };
  // Dalles : bandes par rangée, fusionnées verticalement en rectangles (sans franchir un bloc
  // de 128 m), pour une grande carte légère à construire et à dessiner.
  type Rect = { x0: number; x1: number; z0: number; s: Surface };
  const emit = (r: Rect, z1: number): void => {
    if (r.s === 'eau') return;
    const h = SURFACE_HEIGHT[r.s];
    // Variation par bloc de 128 m (décalage entier en mètres, miroir) : la répétition des
    // textures ne s'aligne pas d'un bloc à l'autre. Un rectangle ne franchit jamais un bloc.
    const tv = textureVariation(Math.floor(r.x0 / CHUNK), Math.floor(r.z0 / CHUNK));
    const off = { ...tv, du: Math.round(tv.du * 12) / 12, dv: Math.round(tv.dv * 12) / 12 };
    const uv = (x: number, z: number): [number, number] => varyUv(x, -z, off, 12);
    get(r.s).quad(V(r.x0, h, z1), V(r.x1, h, z1), V(r.x1, h, r.z0), V(r.x0, h, r.z0), [...uv(r.x0, z1), ...uv(r.x1, z1), ...uv(r.x1, r.z0), ...uv(r.x0, r.z0)]);
  };
  let open = new Map<string, Rect>();
  for (let z = 0; z < CITY_H; z++) {
    const next = new Map<string, Rect>();
    let x = 0;
    while (x < CITY_W) {
      const s = surfaceFast(x, z);
      const limit = Math.min(CITY_W, (Math.floor(x / CHUNK) + 1) * CHUNK);
      let x1 = x + 1;
      while (x1 < limit && surfaceFast(x1, z) === s) x1++;
      const key = `${x}|${x1}|${s}`;
      const prev = open.get(key);
      if (prev && Math.floor(prev.z0 / CHUNK) === Math.floor(z / CHUNK)) {
        open.delete(key);
        next.set(key, prev);
      } else {
        next.set(key, { x0: x, x1, z0: z, s });
      }
      x = x1;
    }
    for (const r of open.values()) emit(r, z);
    open = next;
  }
  for (const r of open.values()) emit(r, CITY_H);
  // Bordures : faces verticales entre deux tuiles de hauteurs différentes.
  const curb = new GeoBuilder();
  const curbMat = new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.85 });
  const quayMat = new THREE.MeshStandardMaterial({ color: '#8f8577', roughness: 0.95 });
  const quay = new GeoBuilder();
  // Bordures et quais : faces verticales entre deux hauteurs, fusionnées en longs segments
  // (sans franchir un bloc de 128 m).
  const hAt = (x: number, z: number): number => SURFACE_HEIGHT[surfaceFast(x, z)];
  const isEau = (x: number, z: number): boolean => surfaceFast(x, z) === 'eau';
  // Limites verticales (entre les colonnes x et x + 1).
  for (let x = 0; x + 1 < CITY_W; x++) {
    let z = 0;
    while (z < CITY_H) {
      const h = hAt(x, z);
      const h2 = hAt(x + 1, z);
      if (h === h2) { z++; continue; }
      const q = isEau(x, z) || isEau(x + 1, z);
      const limit = Math.min(CITY_H, (Math.floor(z / CHUNK) + 1) * CHUNK);
      let z1 = z + 1;
      while (z1 < limit && hAt(x, z1) === h && hAt(x + 1, z1) === h2 && (isEau(x, z1) || isEau(x + 1, z1)) === q) z1++;
      const target = q ? quay : curb;
      if (h > h2) wall(target, x + 1, z, x + 1, z1, h2, h, 1, 1);
      else wall(target, x + 1, z1, x + 1, z, h, h2, 1, 1);
      z = z1;
    }
  }
  // Limites horizontales (entre les rangées z et z + 1).
  for (let z = 0; z + 1 < CITY_H; z++) {
    let x = 0;
    while (x < CITY_W) {
      const h = hAt(x, z);
      const h2 = hAt(x, z + 1);
      if (h === h2) { x++; continue; }
      const q = isEau(x, z) || isEau(x, z + 1);
      const limit = Math.min(CITY_W, (Math.floor(x / CHUNK) + 1) * CHUNK);
      let x1 = x + 1;
      while (x1 < limit && hAt(x1, z) === h && hAt(x1, z + 1) === h2 && (isEau(x1, z) || isEau(x1, z + 1)) === q) x1++;
      const target = q ? quay : curb;
      if (h > h2) wall(target, x1, z + 1, x, z + 1, h2, h, 1, 1);
      else wall(target, x, z + 1, x1, z + 1, h, h2, 1, 1);
      x = x1;
    }
  }
  for (const [s, b] of builders) {
    const geo = b.build();
    const mat = mats[s];
    if (!geo || !mat) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
    disposables.push(geo);
  }
  for (const [b, mat] of [[curb, curbMat], [quay, quayMat]] as const) {
    const geo = b.build();
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
    disposables.push(geo);
  }
  for (const m of Object.values(mats)) if (m) disposables.push(m);
  disposables.push(curbMat, quayMat);
  // Photos Poly Haven (asynchrones) : trottoirs en briques, places et cours pavées. Teintes
  // ramenées vers la palette (crème, brun) ; tant qu'elles n'ont pas chargé, sols procéduraux.
  void loadPhoto('briquesSol').then((p) => {
    if (!p) return;
    const side = mats.trottoir!;
    applyGroundPhoto(side, p, 1 / 2.2, '#ab9784', 0.8, 0.9);
    disposables.push(side.map!, side.normalMap!);
  });
  void loadPhoto('paves').then((p) => {
    if (!p) return;
    applyGroundPhoto(mats.pave!, p, 1 / 2.6, '#b6a891', 0.75, 1.1);
    applyGroundPhoto(mats.cour!, p, 1 / 2.6, '#9d917f', 0.6, 1.1);
    disposables.push(mats.pave!.map!, mats.pave!.normalMap!, mats.cour!.map!, mats.cour!.normalMap!);
  });

  // Eau du canal et du bassin : plan légèrement transparent, animé par la présentation.
  const waterMat = new THREE.MeshStandardMaterial({ color: '#3f6f7a', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(CITY_W + 400, 60), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(CITY_W / 2, -0.35, CITY.canal.y + 25);
  group.add(water);
  for (const z of CITY.zones) {
    if (z.kind !== 'eau' || z.y === CITY.canal.y) continue;
    const pond = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.h), waterMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(z.x + z.w / 2, -0.2, z.y + z.h / 2);
    group.add(pond);
  }
  disposables.push(waterMat);
  return water;
}

function buildMarkings(group: THREE.Group, disposables: { dispose(): void }[]): void {
  const g = new GeoBuilder();
  const y = 0.012;
  const isRoad = (x: number, z: number): boolean => surfaceAt(x, z) === 'chaussee';
  for (const r of CITY.roads) {
    if (r.axis === 'h') {
      const zc = r.y + r.h / 2;
      for (let x = r.x; x < r.x + r.w; x += 6) {
        if (!isRoad(x, Math.floor(zc)) || !isRoad(x + 3, Math.floor(zc))) continue;
        g.quad(V(x, y, zc + 0.08), V(x + 3, y, zc + 0.08), V(x + 3, y, zc - 0.08), V(x, y, zc - 0.08), [0, 0, 1, 0, 1, 1, 0, 1]);
      }
    } else {
      const xc = r.x + r.w / 2;
      for (let z = r.y; z < r.y + r.h; z += 6) {
        if (!isRoad(Math.floor(xc), z) || !isRoad(Math.floor(xc), z + 3)) continue;
        g.quad(V(xc - 0.08, y, z + 3), V(xc + 0.08, y, z + 3), V(xc + 0.08, y, z), V(xc - 0.08, y, z), [0, 0, 1, 0, 1, 1, 0, 1]);
      }
    }
  }
  // Passages piétons : bandes de 50 cm, perpendiculaires à la marche.
  for (const c of CITY.crossings) {
    const alongX = c.w > c.h; // le passage traverse une route verticale
    if (alongX) {
      for (let z = c.y + 0.25; z < c.y + c.h; z += 1) {
        g.quad(V(c.x + 0.4, y, z + 0.5), V(c.x + c.w - 0.4, y, z + 0.5), V(c.x + c.w - 0.4, y, z), V(c.x + 0.4, y, z), [0, 0, 1, 0, 1, 1, 0, 1]);
      }
    } else {
      for (let x = c.x + 0.25; x < c.x + c.w; x += 1) {
        g.quad(V(x, y, c.y + c.h - 0.4), V(x + 0.5, y, c.y + c.h - 0.4), V(x + 0.5, y, c.y + 0.4), V(x, y, c.y + 0.4), [0, 0, 1, 0, 1, 1, 0, 1]);
      }
    }
  }
  const geo = g.build();
  if (!geo) return;
  const mat = new THREE.MeshStandardMaterial({ color: '#eeeae0', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  group.add(mesh);
  disposables.push(geo, mat);
}

// ---------- Bâtiments ----------
// Façades en pixel art, toits, stores et enseignes : voir cityBuildings.ts.

/** Couleurs des bâches d'étal du marché. */
const AWNINGS = ['#b5523e', '#3f6f5a', '#2f5d8a', '#c08a2e', '#7a3f6a', '#4f7a3a'];

// ---------- Mobilier instancié ----------

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[], colors?: THREE.Color[], shadow = true): THREE.InstancedMesh | null {
  if (mats.length === 0) return null;
  const im = new THREE.InstancedMesh(geo, mat, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => im.setColorAt(i, c));
  im.castShadow = shadow;
  im.receiveShadow = true;
  im.instanceMatrix.needsUpdate = true;
  return im;
}

function buildProps(group: THREE.Group, disposables: { dispose(): void }[], nightMaterials: CityScene['nightMaterials']): { lamps: THREE.Vector3[]; glows: THREE.Sprite[] } {
  const rnd = visualRng(4242);
  const M = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0): THREE.Matrix4 =>
    new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(sx, sy, sz));

  const trunks: THREE.Matrix4[] = [];
  const crowns: THREE.Matrix4[] = [];
  const crownColors: THREE.Color[] = [];
  const poles: THREE.Matrix4[] = [];
  const heads: THREE.Matrix4[] = [];
  const benches: THREE.Matrix4[] = [];
  const lamps: THREE.Vector3[] = [];
  const stalls: THREE.Matrix4[] = [];
  const stallRoofs: THREE.Matrix4[] = [];
  const stallColors: THREE.Color[] = [];
  const stallPoles: THREE.Matrix4[] = [];
  const stallGoods: THREE.Matrix4[] = [];
  const stallGoodsColors: THREE.Color[] = [];
  const special: THREE.Object3D[] = [];
  const seenFountain = new Set<string>();

  for (const p of CITY.props) {
    const cx = p.x + 0.5;
    const cz = p.y + 0.5;
    const gy = groundHeightAt(cx, cz);
    switch (p.kind) {
      case 'arbre': {
        const s = 0.8 + rnd() * 0.5;
        trunks.push(M(cx, gy, cz, s, s, s));
        const hue = 0.22 + rnd() * 0.08;
        for (let k = 0; k < 3; k++) {
          const cs = (1.6 + rnd() * 0.8) * s;
          crowns.push(M(cx + (rnd() - 0.5) * 1.2 * s, gy + (3.2 + k * 0.9) * s, cz + (rnd() - 0.5) * 1.2 * s, cs, cs * 0.85, cs, rnd() * 6));
          crownColors.push(new THREE.Color().setHSL(hue, 0.42, 0.28 + rnd() * 0.1));
        }
        break;
      }
      case 'lampadaire':
        poles.push(M(cx, gy, cz));
        heads.push(M(cx, gy + 4.6, cz));
        lamps.push(V(cx, gy + 4.5, cz));
        break;
      case 'banc':
        benches.push(M(cx, gy, cz, 1, 1, 1, (p.x + p.y) % 2 ? 0 : Math.PI / 2));
        break;
      case 'etal':
        stalls.push(M(cx, gy, cz));
        stallRoofs.push(M(cx, gy + 2.3, cz));
        stallColors.push(new THREE.Color(AWNINGS[Math.floor(rnd() * AWNINGS.length)]!));
        // Quatre montants qui portent la bâche, et des cagettes colorées sur le comptoir.
        for (const [dx, dz] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]] as const) stallPoles.push(M(cx + dx, gy, cz + dz));
        for (let k = 0; k < 5; k++) {
          stallGoods.push(M(cx - 1.0 + k * 0.5, gy + 0.98, cz + 0.2));
          stallGoodsColors.push(new THREE.Color(['#c25a40', '#e0b04a', '#4f7a3a', '#d98a3a', '#7a3f6a'][k]!));
        }
        break;
      case 'fontaine': {
        // La fontaine occupe 2 × 2 tuiles : un seul objet, posé au coin commun des quatre tuiles.
        if (seenFountain.has('fontaine')) break;
        seenFountain.add('fontaine');
        const tiles = CITY.props.filter((q) => q.kind === 'fontaine');
        const fx = Math.max(...tiles.map((q) => q.x));
        const fz = Math.max(...tiles.map((q) => q.y));
        special.push(fountain(fx, gy, fz));
        break;
      }
      case 'cheminee':
        special.push(chimney(cx, gy, cz));
        break;
      case 'grue':
        special.push(crane(cx, gy, cz));
        break;
      case 'jeux':
        special.push(playground(cx, gy, cz, rnd));
        break;
      case 'arret_bus':
        special.push(busStop(cx, gy, cz));
        break;
      default:
        break;
    }
  }

  // Abris de la ligne 1 (src/data/city/transit.ts), sauf là où un abri existe déjà.
  for (const s of BUS_STOPS) {
    if (CITY.props.some((p) => p.kind === 'arret_bus' && Math.abs(p.x - s.x) <= 3 && Math.abs(p.y - s.y) <= 3)) continue;
    special.push(busStop(s.x + 0.5, groundHeightAt(s.x + 0.5, s.y + 0.5), s.y + 0.5));
  }

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 3.4, 7).translate(0, 1.7, 0);
  const crownGeo = shapeCrownGeometry(new THREE.IcosahedronGeometry(1, 1), 3);
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 4.6, 6).translate(0, 2.3, 0);
  const headGeo = new THREE.CylinderGeometry(0.28, 0.12, 0.35, 8);
  const benchGeo = benchGeometry();
  const stallGeo = new THREE.BoxGeometry(2.6, 0.9, 1.3).translate(0, 0.45, 0);
  const stallRoofGeo = new THREE.ConeGeometry(2.1, 0.8, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.55).translate(0, 0.4, 0);
  const stallPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.35, 6).translate(0, 1.17, 0);
  const stallGoodsGeo = new THREE.BoxGeometry(0.42, 0.16, 0.32).translate(0, 0.08, 0);
  const barkMat = new THREE.MeshStandardMaterial({ color: '#5b4231', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true, vertexColors: true });
  makeFoliageOccludable(leafMat);
  const metalMat = new THREE.MeshStandardMaterial({ color: '#2f3a36', roughness: 0.5, metalness: 0.6 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff1d0', emissive: new THREE.Color('#ffc46b'), emissiveIntensity: 0, roughness: 0.4 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#8a5a3a', roughness: 0.8 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  nightMaterials.push({ mat: bulbMat, strength: 3 });

  for (const im of [
    instanced(trunkGeo, barkMat, trunks),
    instanced(crownGeo, leafMat, crowns, crownColors),
    instanced(poleGeo, metalMat, poles),
    instanced(headGeo, bulbMat, heads, undefined, false),
    instanced(benchGeo, woodMat, benches),
    instanced(stallGeo, woodMat, stalls),
    instanced(stallRoofGeo, canvasMat, stallRoofs, stallColors),
    instanced(stallPoleGeo, metalMat, stallPoles),
    instanced(stallGoodsGeo, canvasMat, stallGoods, stallGoodsColors),
  ]) if (im) group.add(im);
  for (const o of special) group.add(o);
  disposables.push(stallPoleGeo, stallGoodsGeo);
  disposables.push(trunkGeo, crownGeo, poleGeo, headGeo, benchGeo, stallGeo, stallRoofGeo, barkMat, leafMat, metalMat, bulbMat, woodMat, canvasMat);

  // Halos des lampadaires (visibles la nuit).
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffcf8f', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const glows: THREE.Sprite[] = [];
  for (const l of lamps) {
    const s = new THREE.Sprite(glowMat);
    s.position.copy(l);
    s.scale.set(3.2, 3.2, 1);
    group.add(s);
    glows.push(s);
  }
  disposables.push(glowMat);
  return { lamps, glows };
}

function benchGeometry(): THREE.BufferGeometry {
  const seat = new THREE.BoxGeometry(1.6, 0.08, 0.45).translate(0, 0.45, 0);
  const back = new THREE.BoxGeometry(1.6, 0.4, 0.06).translate(0, 0.72, -0.2);
  const l1 = new THREE.BoxGeometry(0.08, 0.45, 0.4).translate(-0.7, 0.22, 0);
  const l2 = new THREE.BoxGeometry(0.08, 0.45, 0.4).translate(0.7, 0.22, 0);
  return mergeGeometries([seat, back, l1, l2])!;
}

function fountain(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#b8ad9a', roughness: 0.9 });
  const water = new THREE.MeshStandardMaterial({ color: '#5d8fa0', roughness: 0.1, metalness: 0.2 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.6, 20), stone);
  basin.position.y = 0.3;
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.05, 20), water);
  pool.position.y = 0.55;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 10), stone);
  col.position.y = 1.1;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 0.3, 14), stone);
  bowl.position.y = 1.9;
  for (const m of [basin, pool, col, bowl]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.position.set(x, y, z);
  return g;
}

function chimney(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const brick = new THREE.MeshStandardMaterial({ color: '#7b4434', roughness: 0.95 });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.8, 34, 14), brick);
  c.position.y = 17;
  c.castShadow = true;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.6, 14), new THREE.MeshStandardMaterial({ color: '#3a2a24' }));
  ring.position.y = 33.5;
  g.add(c, ring);
  g.position.set(x, y, z);
  return g;
}

function crane(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const rust = new THREE.MeshStandardMaterial({ color: '#8a4a2a', roughness: 0.9, metalness: 0.4 });
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 18, 0.8), rust);
  mast.position.y = 9;
  const jib = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.6), rust);
  jib.position.set(4, 18, 0);
  for (const m of [mast, jib]) { m.castShadow = true; g.add(m); }
  g.position.set(x, y, z);
  g.rotation.y = 0.7;
  return g;
}

function playground(x: number, y: number, z: number, rnd: () => number): THREE.Group {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: rnd() > 0.5 ? '#c4553f' : '#3f7ac4', roughness: 0.6 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), red);
  frame.position.y = 2.2;
  const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), red);
  l1.position.set(-1.2, 1.1, 0);
  const l2 = l1.clone();
  l2.position.x = 1.2;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.25), red);
  seat.position.y = 0.6;
  for (const m of [frame, l1, l2, seat]) { m.castShadow = true; g.add(m); }
  g.position.set(x, y, z);
  return g;
}

function busStop(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#2f4a5e', roughness: 0.5, metalness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: '#a8c4d4', roughness: 0.05, transparent: true, opacity: 0.35 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), metal);
  roof.position.y = 2.5;
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.05), glass);
  back.position.set(0, 1.3, -0.6);
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), metal);
  p1.position.set(-1.55, 1.25, -0.6);
  const p2 = p1.clone();
  p2.position.x = 1.55;
  for (const m of [roof, back, p1, p2]) { m.castShadow = true; g.add(m); }
  g.position.set(x, y, z);
  return g;
}

// ---------- Décor lointain (au-delà des limites de la carte) ----------

function buildSkyline(group: THREE.Group, disposables: { dispose(): void }[]): void {
  const rnd = visualRng(777);
  // Immeubles lointains : une travée de façade en pixel art répétée (4 × 4 par face).
  const mats = ['brique_a', 'creme_a', 'pierre_a', 'hlm_a', 'ocre_a'].map((id) =>
    new THREE.MeshStandardMaterial({ map: skylineTexture(id), roughness: 0.95, color: '#d8d0c4' }));
  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const ring: [number, number][] = [];
  for (let x = -60; x < CITY_W + 60; x += 14) { ring.push([x, -30]); }
  for (let x = -60; x < CITY_W + 60; x += 14) { ring.push([x, CITY_H + 30]); }
  for (let z = -30; z < CITY_H + 30; z += 14) { ring.push([-30, z]); ring.push([CITY_W + 30, z]); }
  // Grande carte : ~400 immeubles lointains, instanciés par façade (5 appels de dessin).
  const perMat: THREE.Matrix4[][] = mats.map(() => []);
  for (const [x, z] of ring) {
    const h = 8 + rnd() * 18;
    const w = 10 + rnd() * 6;
    const d = 10 + rnd() * 8;
    perMat[Math.floor(rnd() * mats.length)]!.push(new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion(), V(w, h, d)));
  }
  perMat.forEach((list, i) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mats[i]!, list.length);
    list.forEach((m, k) => im.setMatrixAt(k, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  });
  // Collines de la Vallée du Taret au loin, toujours au-delà des bords de la grande carte.
  const hillMat = new THREE.MeshStandardMaterial({ color: '#6f7f5a', roughness: 1, flatShading: true });
  const HILLS = 18;
  for (let i = 0; i < HILLS; i++) {
    const r = 80 + rnd() * 60;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.y = 0.2 + rnd() * 0.12;
    const a = (i / HILLS) * Math.PI * 2;
    // Loin au-delà des bords (le centre historique touche le bord ouest) : silhouettes basses dans la brume.
    hill.position.set(CITY_W / 2 + Math.cos(a) * (CITY_W / 2 + 320 + r), -2, CITY_H / 2 + Math.sin(a) * (CITY_H / 2 + 320 + r));
    group.add(hill);
    disposables.push(hill.geometry);
  }
  // Rive sud et sol au-delà de la carte.
  const farMat = new THREE.MeshStandardMaterial({ color: '#7b8a62', roughness: 1 });
  const far = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), farMat);
  far.rotation.x = -Math.PI / 2;
  far.position.set(CITY_W / 2, -0.6, CITY_H / 2);
  far.receiveShadow = true;
  group.add(far);
  disposables.push(geo, hillMat, farMat, far.geometry, ...mats);
}

// ---------- Assemblage ----------

export function buildCityScene(): CityScene {
  const group = new THREE.Group();
  group.name = 'ville';
  const disposables: { dispose(): void }[] = [];
  const nightMaterials: CityScene['nightMaterials'] = [];
  const tm: Record<string, number> = {};
  let t0 = performance.now();
  const lap = (k: string): void => { const t = performance.now(); tm[k] = Math.round(t - t0); t0 = t; };
  const water = buildGround(group, disposables);
  lap('sol');
  buildMarkings(group, disposables);
  lap('marquages');
  // Les pavillons génériques sont construits à part : ils s'effacent devant les maisons Kenney
  // quand celles-ci ont chargé (et restent en place sinon).
  const city = buildCityBuildings((b) => !isGenericHouse(b));
  const pavs = buildCityBuildings(isGenericHouse);
  for (const c of [city, pavs]) {
    enhanceFacadeMaterial(c.facadeMaterial);
    for (const m of [...c.meshes, ...c.decor]) group.add(m);
    nightMaterials.push({ mat: c.facadeMaterial, strength: 1.1 }, { mat: c.signs.material, strength: 0.35 });
  }
  const pavMeshes: THREE.Object3D[] = [...pavs.meshes, ...pavs.decor];
  const meshes = city.meshes;
  // Photos des murs aveugles, pignons et toits (uniformes partagés par toutes les façades).
  for (const [id, kind] of [['tuiles', 'tuiles'], ['brique', 'brique'], ['enduit', 'enduit']] as const) {
    void loadPhoto(id).then((p) => { if (p) setFacadePhoto(kind, p.map, p.normal, p.mean); });
  }
  lap('batiments');
  (globalThis as { __cityStats?: unknown }).__cityStats = city.stats;
  const { lamps, glows } = buildProps(group, disposables, nightMaterials);
  lap('mobilier');
  buildLotProps(group, disposables, groundHeightAt);
  lap('terrains');
  (globalThis as { __cityLaps?: Record<string, number> }).__cityLaps = tm;
  // Grande carte : la ville est redécoupée en blocs de 128 m ; l'eau et le décor lointain restent entiers.
  const keep = new Set<THREE.Object3D>([water]);
  const before = group.children.length;
  buildSkyline(group, disposables);
  for (const o of group.children.slice(before)) keep.add(o);
  const tChunk = performance.now();
  const { chunks, remapped } = chunkify(group, keep);
  (globalThis as { __cityChunkMs?: number }).__cityChunkMs = Math.round(performance.now() - tChunk);
  const buildingMeshes = meshes.flatMap((m) => remapped.get(m) ?? [m]);
  // Modèles Kenney (asynchrones) : ceinture lointaine, tours à l'horizon, maisons des lotissements.
  const skylineGroup = new THREE.Group();
  skylineGroup.name = 'décor Kenney';
  group.add(skylineGroup);
  const kenney = buildKenneyDecor({
    skylineGroup,
    chunks,
    houses: CITY.buildings.filter(isGenericHouse),
    houseMeshes: pavMeshes,
    groundAt: groundHeightAt,
    cityW: CITY_W,
    cityH: CITY_H,
  });
  (globalThis as { __kenneyReady?: Promise<unknown> }).__kenneyReady = kenney.ready;
  // La ville ne bouge plus : ses ~5 000 matrices sont calculées une fois pour toutes (lodScene.ts).
  freezeStatic(group);

  return {
    group,
    nightMaterials,
    lampPositions: lamps,
    glowSprites: glows,
    buildingMeshes,
    water,
    chunks,
    setUnitSign(unitId: string, text: string, color: string): void {
      city.setUnitSign(unitId, text, color);
    },
    updateLod(view: LodView, houseNear: number, skylineNear: number, far: number): void {
      kenney.updateLod(view, houseNear, skylineNear, far);
    },
    lodCounts: () => kenney.lodCounts(),
    dispose(): void {
      kenney.dispose();
      for (const d of disposables) d.dispose();
      city.dispose();
      pavs.dispose();
    },
  };
}
