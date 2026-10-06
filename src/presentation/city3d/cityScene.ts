/**
 * Construction de la scène statique de la ville à partir de src/data/city (lecture seule).
 * Sols par revêtement (RLE de la grille), bordures de trottoir, marquages, bâtiments à façades
 * texturées en modules, toits, enseignes, mobilier instancié. Repère : X = est, Z = sud, Y = haut,
 * 1 unité = 1 m = 1 tuile.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CITY, CITY_H, CITY_W, FLOOR_H, type CityBuilding, type Face, type FacadeStyle } from '../../data/city/layout';
import { surfaceAt, type Surface } from '../../data/map';
import {
  asphaltTexture, cobbleTexture, dirtTexture, facadeEmissiveTexture, facadeTexture, flatRoofTexture, glowTexture,
  grassTexture, gravelTexture, parkingTexture, playgroundTexture, roofTileTexture, shopfrontEmissiveTexture,
  shopfrontTexture, sidewalkTexture, signTexture, visualRng,
} from './textures';

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
  const m = (map: THREE.Texture, rough = 0.95, color = '#ffffff'): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, color });
  const side = m(sidewalkTexture(), 0.9);
  return {
    chaussee: m(asphaltTexture(), 0.88),
    passage: m(asphaltTexture(), 0.88),
    parking: m(parkingTexture(), 0.9),
    trottoir: side,
    batiment: side,
    cour: m(cobbleTexture(), 0.95, '#cfc6b8'),
    pave: m(cobbleTexture(), 0.92),
    herbe: m(grassTexture(), 1),
    aire_jeux: m(playgroundTexture(), 0.95),
    terre: m(dirtTexture(), 1),
    gravier: m(gravelTexture(), 1),
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
  // Dalles par rangées (RLE).
  for (let z = 0; z < CITY_H; z++) {
    let x = 0;
    while (x < CITY_W) {
      const s = surfaceAt(x, z)!;
      let x1 = x + 1;
      while (x1 < CITY_W && surfaceAt(x1, z) === s) x1++;
      if (s !== 'eau') {
        const h = SURFACE_HEIGHT[s];
        get(s).quad(V(x, h, z + 1), V(x1, h, z + 1), V(x1, h, z), V(x, h, z), [x, -z - 1, x1, -z - 1, x1, -z, x, -z]);
      }
      x = x1;
    }
  }
  // Bordures : faces verticales entre deux tuiles de hauteurs différentes.
  const curb = new GeoBuilder();
  const curbMat = new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.85 });
  const quayMat = new THREE.MeshStandardMaterial({ color: '#8f8577', roughness: 0.95 });
  const quay = new GeoBuilder();
  for (let z = 0; z < CITY_H; z++) {
    for (let x = 0; x < CITY_W; x++) {
      const s = surfaceAt(x, z)!;
      const h = SURFACE_HEIGHT[s];
      if (x + 1 < CITY_W) {
        const s2 = surfaceAt(x + 1, z)!;
        const h2 = SURFACE_HEIGHT[s2];
        if (h !== h2) {
          const target = s === 'eau' || s2 === 'eau' ? quay : curb;
          if (h > h2) wall(target, x + 1, z, x + 1, z + 1, h2, h, 1, 1);
          else wall(target, x + 1, z + 1, x + 1, z, h, h2, 1, 1);
        }
      }
      if (z + 1 < CITY_H) {
        const s2 = surfaceAt(x, z + 1)!;
        const h2 = SURFACE_HEIGHT[s2];
        if (h !== h2) {
          const target = s === 'eau' || s2 === 'eau' ? quay : curb;
          if (h > h2) wall(target, x + 1, z + 1, x, z + 1, h2, h, 1, 1);
          else wall(target, x, z + 1, x + 1, z + 1, h, h2, 1, 1);
        }
      }
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

const AWNINGS = ['#b5523e', '#3f6f5a', '#2f5d8a', '#c08a2e', '#7a3f6a', '#4f7a3a'];
const SIGN_COLORS = ['#7a3b2a', '#2f4f3f', '#2c3f5e', '#6b4a1f', '#4a2f4f'];

interface BuildingMats {
  facade: Map<FacadeStyle, THREE.MeshStandardMaterial>;
  shop: THREE.MeshStandardMaterial[];
  roofTiles: THREE.MeshStandardMaterial;
  roofFlat: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
}

function buildingMaterials(): BuildingMats {
  const facade = new Map<FacadeStyle, THREE.MeshStandardMaterial>();
  const styles: FacadeStyle[] = ['brique', 'enduit_creme', 'enduit_ocre', 'enduit_rose', 'pierre', 'hlm', 'ecole', 'industriel', 'civique', 'hyper'];
  for (const s of styles) {
    facade.set(s, new THREE.MeshStandardMaterial({
      map: facadeTexture(s),
      emissiveMap: facadeEmissiveTexture(s),
      emissive: new THREE.Color('#ffb866'),
      emissiveIntensity: 0,
      roughness: s === 'hyper' ? 0.5 : 0.92,
      metalness: s === 'hyper' ? 0.3 : 0,
      vertexColors: true,
    }));
  }
  const shop = AWNINGS.map((a) => new THREE.MeshStandardMaterial({
    map: shopfrontTexture(a),
    emissiveMap: shopfrontEmissiveTexture(),
    emissive: new THREE.Color('#ffcf8a'),
    emissiveIntensity: 0,
    roughness: 0.6,
  }));
  return {
    facade,
    shop,
    roofTiles: new THREE.MeshStandardMaterial({ map: roofTileTexture(), roughness: 0.85, vertexColors: true }),
    roofFlat: new THREE.MeshStandardMaterial({ map: flatRoofTexture(), roughness: 1 }),
    door: new THREE.MeshStandardMaterial({ color: '#4a3326', roughness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: '#7d97a8', roughness: 0.1, metalness: 0.4 }),
  };
}

/** Coins du bâtiment parcourus dans le sens horaire vu de dessus, avec la face extérieure. */
function faces(b: CityBuilding): { face: Face; x0: number; z0: number; x1: number; z1: number }[] {
  const { x, y, w, d } = b;
  return [
    { face: 'n', x0: x + w, z0: y, x1: x, z1: y },
    { face: 'w', x0: x, z0: y, x1: x, z1: y + d },
    { face: 's', x0: x, z0: y + d, x1: x + w, z1: y + d },
    { face: 'e', x0: x + w, z0: y + d, x1: x + w, z1: y },
  ];
}

function buildBuildings(group: THREE.Group, disposables: { dispose(): void }[], nightMaterials: CityScene['nightMaterials']): {
  meshes: THREE.Mesh[];
  signs: Map<string, THREE.Mesh>;
} {
  const mats = buildingMaterials();
  const facadeB = new Map<FacadeStyle, GeoBuilder>();
  const shopB = mats.shop.map(() => new GeoBuilder());
  const tilesB = new GeoBuilder();
  const flatB = new GeoBuilder();
  const doorB = new GeoBuilder();
  const glassB = new GeoBuilder();
  const fb = (s: FacadeStyle): GeoBuilder => {
    let b = facadeB.get(s);
    if (!b) { b = new GeoBuilder(); facadeB.set(s, b); }
    return b;
  };
  const signs = new Map<string, THREE.Mesh>();
  const BASE = 0;

  for (const b of CITY.buildings) {
    const H = b.floors * FLOOR_H + 0.15;
    const tint = new THREE.Color().setHSL(0, 0, 0.88 + b.tint * 0.2);
    const facadeG = fb(b.style);
    const shopIndex = Math.floor(b.tint * mats.shop.length) % mats.shop.length;
    // Décalage d'UV par bâtiment : les fenêtres allumées varient d'un immeuble à l'autre.
    const uOff = Math.floor(b.tint * 4);
    for (const f of faces(b)) {
      const isFront = f.face === b.front;
      if (isFront && b.shopfront) {
        wall(shopB[shopIndex]!, f.x0, f.z0, f.x1, f.z1, BASE, FLOOR_H + 0.15, 3, FLOOR_H + 0.15, 0);
        wall(facadeG, f.x0, f.z0, f.x1, f.z1, FLOOR_H + 0.15, H, 3, FLOOR_H, 0, tint, uOff);
      } else {
        wall(facadeG, f.x0, f.z0, f.x1, f.z1, BASE, H, 3, FLOOR_H, 0, tint, uOff);
      }
    }
    // Portes : un retrait sombre de 1,2 × 2,2 m sur la façade.
    for (const d of b.doors) {
      if (b.shopfront && d.unitId) continue; // la vitrine fait office de porte
      const dw = b.style === 'hyper' ? 4 : b.style === 'ecole' || b.style === 'civique' ? 2.4 : 1.2;
      const dh = b.style === 'hyper' ? 2.8 : 2.3;
      const e = 0.04;
      const cx = d.x + 0.5;
      const cz = d.y + 0.5;
      const target = b.style === 'hyper' ? glassB : doorB;
      if (d.face === 'n') target.quad(V(cx + dw / 2, 0.15, b.y - e), V(cx - dw / 2, 0.15, b.y - e), V(cx - dw / 2, 0.15 + dh, b.y - e), V(cx + dw / 2, 0.15 + dh, b.y - e), [0, 0, 1, 0, 1, 1, 0, 1]);
      if (d.face === 's') target.quad(V(cx - dw / 2, 0.15, b.y + b.d + e), V(cx + dw / 2, 0.15, b.y + b.d + e), V(cx + dw / 2, 0.15 + dh, b.y + b.d + e), V(cx - dw / 2, 0.15 + dh, b.y + b.d + e), [0, 0, 1, 0, 1, 1, 0, 1]);
      if (d.face === 'w') target.quad(V(b.x - e, 0.15, cz - dw / 2), V(b.x - e, 0.15, cz + dw / 2), V(b.x - e, 0.15 + dh, cz + dw / 2), V(b.x - e, 0.15 + dh, cz - dw / 2), [0, 0, 1, 0, 1, 1, 0, 1]);
      if (d.face === 'e') target.quad(V(b.x + b.w + e, 0.15, cz + dw / 2), V(b.x + b.w + e, 0.15, cz - dw / 2), V(b.x + b.w + e, 0.15 + dh, cz - dw / 2), V(b.x + b.w + e, 0.15 + dh, cz + dw / 2), [0, 0, 1, 0, 1, 1, 0, 1]);
    }
    // Toits.
    if (b.roof === 'plat') {
      flatB.quad(V(b.x, H, b.y + b.d), V(b.x + b.w, H, b.y + b.d), V(b.x + b.w, H, b.y), V(b.x, H, b.y), [b.x, -b.y - b.d, b.x + b.w, -b.y - b.d, b.x + b.w, -b.y, b.x, -b.y]);
      // Acrotère de 40 cm.
      for (const f of faces(b)) {
        wall(facadeG, f.x0, f.z0, f.x1, f.z1, H, H + 0.4, 3, FLOOR_H, 0, tint);
      }
      if (!b.ruined) {
        // Édicules techniques sur les grands toits.
        if (b.w * b.d > 300) {
          const cx = b.x + b.w * 0.3;
          const cz = b.y + b.d * 0.4;
          boxInto(flatB, cx, H, cz, 3, 2.2, 2.5);
        }
      }
    } else if (b.roof === 'deux_pans') {
      const alongX = b.w >= b.d;
      const span = alongX ? b.d : b.w;
      const rh = Math.min(4, span * 0.35);
      const ov = 0.35; // débord
      if (alongX) {
        const zm = b.y + b.d / 2;
        tilesB.quad(V(b.x - ov, H, b.y + b.d + ov), V(b.x + b.w + ov, H, b.y + b.d + ov), V(b.x + b.w + ov, H + rh, zm), V(b.x - ov, H + rh, zm), [0, 0, b.w / 4, 0, b.w / 4, span / 6, 0, span / 6], tint);
        tilesB.quad(V(b.x + b.w + ov, H, b.y - ov), V(b.x - ov, H, b.y - ov), V(b.x - ov, H + rh, zm), V(b.x + b.w + ov, H + rh, zm), [0, 0, b.w / 4, 0, b.w / 4, span / 6, 0, span / 6], tint);
        facadeG.tri(V(b.x, H, b.y), V(b.x, H, b.y + b.d), V(b.x, H + rh, zm), [0, 0, b.d / 3, 0, b.d / 6, rh / FLOOR_H], tint);
        facadeG.tri(V(b.x + b.w, H, b.y + b.d), V(b.x + b.w, H, b.y), V(b.x + b.w, H + rh, zm), [0, 0, b.d / 3, 0, b.d / 6, rh / FLOOR_H], tint);
      } else {
        const xm = b.x + b.w / 2;
        tilesB.quad(V(b.x - ov, H, b.y - ov), V(b.x - ov, H, b.y + b.d + ov), V(xm, H + rh, b.y + b.d + ov), V(xm, H + rh, b.y - ov), [0, 0, b.d / 4, 0, b.d / 4, span / 6, 0, span / 6], tint);
        tilesB.quad(V(b.x + b.w + ov, H, b.y + b.d + ov), V(b.x + b.w + ov, H, b.y - ov), V(xm, H + rh, b.y - ov), V(xm, H + rh, b.y + b.d + ov), [0, 0, b.d / 4, 0, b.d / 4, span / 6, 0, span / 6], tint);
        facadeG.tri(V(b.x + b.w, H, b.y), V(b.x, H, b.y), V(xm, H + rh, b.y), [0, 0, b.w / 3, 0, b.w / 6, rh / FLOOR_H], tint);
        facadeG.tri(V(b.x, H, b.y + b.d), V(b.x + b.w, H, b.y + b.d), V(xm, H + rh, b.y + b.d), [0, 0, b.w / 3, 0, b.w / 6, rh / FLOOR_H], tint);
      }
    } else {
      // Sheds industriels : dents de scie de 6 m, vitrage au nord.
      const teeth = Math.max(1, Math.floor(b.w / 6));
      const tw = b.w / teeth;
      const rh = 2.2;
      for (let i = 0; i < teeth; i++) {
        if (b.ruined && i % 3 === 1) continue; // toiture effondrée
        const x0 = b.x + i * tw;
        const x1 = x0 + tw;
        flatB.quad(V(x0, H, b.y + b.d), V(x1, H + rh, b.y + b.d), V(x1, H + rh, b.y), V(x0, H, b.y), [0, 0, 1, 0, 1, 1, 0, 1]);
        glassB.quad(V(x1, H + rh, b.y + b.d), V(x1, H, b.y + b.d), V(x1, H, b.y), V(x1, H + rh, b.y), [0, 0, 1, 0, 1, 1, 0, 1]);
      }
    }
    // Enseigne au-dessus du rez-de-chaussée.
    const label = b.label ?? (b.unitId ? 'À LOUER' : undefined);
    if (label) {
      const front = faces(b).find((f) => f.face === b.front)!;
      const len = Math.hypot(front.x1 - front.x0, front.z1 - front.z0);
      // Vitrine : bandeau sur la largeur du local. Lieu ou immeuble : plaque au-dessus de la porte.
      const big = b.style === 'hyper' || b.style === 'ecole' || b.style === 'civique' || b.style === 'industriel';
      const sw = b.unitId || b.shopfront ? Math.min(len - 1, 6) : Math.min(len - 1, big ? 7 : 3.4);
      const sh = sw * (96 / 512);
      const door = b.doors[0];
      const tex = signTexture(label, b.unitId ? '#5b5249' : SIGN_COLORS[Math.floor(b.tint * SIGN_COLORS.length) % SIGN_COLORS.length]!);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0 });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat);
      const alongDoor = door && !b.shopfront;
      const mx = alongDoor && (b.front === 'n' || b.front === 's') ? door.x + 0.5 : (front.x0 + front.x1) / 2;
      const mz = alongDoor && (b.front === 'w' || b.front === 'e') ? door.y + 0.5 : (front.z0 + front.z1) / 2;
      const off = 0.12;
      const y = b.floors === 1 ? Math.min(H - sh / 2 - 0.1, 2.6)
        : alongDoor ? 2.75 + sh / 2 : FLOOR_H + 0.15 + sh / 2 + 0.1;
      if (b.front === 'n') { sign.position.set(mx, y, mz - off); sign.rotation.y = Math.PI; }
      if (b.front === 's') { sign.position.set(mx, y, mz + off); }
      if (b.front === 'w') { sign.position.set(mx - off, y, mz); sign.rotation.y = -Math.PI / 2; }
      if (b.front === 'e') { sign.position.set(mx + off, y, mz); sign.rotation.y = Math.PI / 2; }
      group.add(sign);
      nightMaterials.push({ mat, strength: 0.35 });
      if (b.unitId) signs.set(b.unitId, sign);
    }
  }

  const meshes: THREE.Mesh[] = [];
  const add = (gb: GeoBuilder, mat: THREE.Material, castShadow = true): void => {
    const geo = gb.build();
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push(mesh);
    disposables.push(geo);
  };
  for (const [s, gb] of facadeB) {
    const mat = mats.facade.get(s)!;
    add(gb, mat);
    nightMaterials.push({ mat, strength: 1.1 });
  }
  shopB.forEach((gb, i) => {
    add(gb, mats.shop[i]!);
    nightMaterials.push({ mat: mats.shop[i]!, strength: 0.9 });
  });
  add(tilesB, mats.roofTiles);
  add(flatB, mats.roofFlat);
  add(doorB, mats.door, false);
  add(glassB, mats.glass, false);
  disposables.push(...mats.facade.values(), ...mats.shop, mats.roofTiles, mats.roofFlat, mats.door, mats.glass);
  return { meshes, signs };
}

/** Petit volume (édicule, caisson) ajouté à un GeoBuilder. */
function boxInto(g: GeoBuilder, cx: number, y0: number, cz: number, w: number, h: number, d: number): void {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const y1 = y0 + h;
  wall(g, x1, z0, x0, z0, y0, y1, 1, 1);
  wall(g, x0, z0, x0, z1, y0, y1, 1, 1);
  wall(g, x0, z1, x1, z1, y0, y1, 1, 1);
  wall(g, x1, z1, x1, z0, y0, y1, 1, 1);
  g.quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), [0, 0, 1, 0, 1, 1, 0, 1]);
}

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

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 3.4, 7).translate(0, 1.7, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 4.6, 6).translate(0, 2.3, 0);
  const headGeo = new THREE.CylinderGeometry(0.28, 0.12, 0.35, 8);
  const benchGeo = benchGeometry();
  const stallGeo = new THREE.BoxGeometry(2.6, 0.9, 1.3).translate(0, 0.45, 0);
  const stallRoofGeo = new THREE.ConeGeometry(2.1, 0.8, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.55).translate(0, 0.4, 0);
  const barkMat = new THREE.MeshStandardMaterial({ color: '#5b4231', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true });
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
  ]) if (im) group.add(im);
  for (const o of special) group.add(o);
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
  const mats = (['brique', 'enduit_creme', 'pierre', 'hlm', 'enduit_ocre'] as FacadeStyle[]).map((s) =>
    new THREE.MeshStandardMaterial({ map: facadeTexture(s).clone(), roughness: 0.95, color: '#d8d0c4' }));
  for (const m of mats) { if (m.map) { m.map.repeat.set(4, 4); m.map.needsUpdate = true; } }
  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const ring: [number, number][] = [];
  for (let x = -60; x < CITY_W + 60; x += 14) { ring.push([x, -30]); }
  for (let z = -30; z < CITY.canal.y; z += 14) { ring.push([-30, z]); ring.push([CITY_W + 30, z]); }
  for (const [x, z] of ring) {
    const h = 8 + rnd() * 18;
    const w = 10 + rnd() * 6;
    const d = 10 + rnd() * 8;
    const m = new THREE.Mesh(geo, mats[Math.floor(rnd() * mats.length)]!);
    m.scale.set(w, h, d);
    m.position.set(x, 0, z);
    group.add(m);
  }
  // Collines de la Vallée du Taret au loin.
  const hillMat = new THREE.MeshStandardMaterial({ color: '#6f7f5a', roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(80 + rnd() * 60, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.y = 0.35 + rnd() * 0.2;
    const a = (i / 9) * Math.PI * 2;
    hill.position.set(CITY_W / 2 + Math.cos(a) * 420, -2, CITY_H / 2 + Math.sin(a) * 380);
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
  const water = buildGround(group, disposables);
  buildMarkings(group, disposables);
  const { meshes, signs } = buildBuildings(group, disposables, nightMaterials);
  const { lamps, glows } = buildProps(group, disposables, nightMaterials);
  buildSkyline(group, disposables);

  return {
    group,
    nightMaterials,
    lampPositions: lamps,
    glowSprites: glows,
    buildingMeshes: meshes,
    water,
    setUnitSign(unitId: string, text: string, color: string): void {
      const sign = signs.get(unitId);
      if (!sign) return;
      const mat = sign.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      const tex = signTexture(text, color);
      mat.map = tex;
      mat.emissiveMap = tex;
      mat.needsUpdate = true;
    },
    dispose(): void {
      for (const d of disposables) d.dispose();
      for (const s of signs.values()) {
        (s.material as THREE.MeshStandardMaterial).map?.dispose();
        (s.material as THREE.Material).dispose();
        s.geometry.dispose();
      }
    },
  };
}
