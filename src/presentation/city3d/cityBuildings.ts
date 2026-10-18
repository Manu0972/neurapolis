/**
 * Bâtiments de la ville en pixel art (2026-10-12) : volumes simples + façades de l'atlas
 * (facadeAtlas.ts), toits à deux pans en tuiles, corniches, stores rayés, enseignes.
 *
 * Budget : un seul matériau pour tous les murs et toits ; chaque mur reste un petit nombre de
 * quadrilatères (rez-de-chaussée découpé autour de la porte, étages d'un seul tenant, corniche) ;
 * la géométrie est construite directement par bloc de 128 m (pas de redécoupage), et les murs
 * collés à un voisin plus haut ne sont pas dessinés. Les vitrines des locaux sont modifiables :
 * un local à louer est passé au blanc, un commerce ouvert montre sa marchandise.
 */
import * as THREE from 'three';
import { CITY, CITY_H, CITY_W, FLOOR_H, type CityBuilding, type Face } from '../../data/city/layout';
import { COMPETITOR_BY_UNIT } from '../../data/city/competitors';
import { CHUNK } from './chunks';
import {
  CORNICE_M, CORNICE_PX, FLOOR_PX, GROUND_PX, MOD_W, SHEET_COLS, UPPER_ROWS, WALL_H, WALL_W,
  awningFor, facadeAtlas, shopKindFor, variantFor, type AtlasTile, type ShopKind,
} from './facadeAtlas';
import { hash2, hashString } from './pixelArt';
import { atlasTile, createFacadeMaterial } from './facadeMaterial';
import { SignAtlas } from './signAtlas';

/** Hauteur du rez-de-chaussée (le trottoir est à 0,15 m). */
export const GROUND_TOP = FLOOR_H + 0.15;
const WALL_U_M = WALL_W / 32; // 4 m
const WALL_V_M = WALL_H / 32; // 3 m

// ---------- Géométrie ----------

class Geo {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  tile: number[] = [];
  idx: number[] = [];
  constructor(readonly ox: number, readonly oz: number, readonly tiled = true) {}

  get vertices(): number { return this.pos.length / 3; }

  /** Quadrilatère a-b-c-d (a en bas à gauche vu de dehors), UV a=(u0,v0) … c=(u1,v1). */
  quad(
    ax: number, ay: number, az: number, bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number, dx: number, dy: number, dz: number,
    u0: number, v0: number, u1: number, v1: number, t: AtlasTile | null, k = 1,
  ): void {
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = dx - ax, e2y = dy - ay, e2z = dz - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const n = Math.hypot(nx, ny, nz) || 1;
    nx /= n; ny /= n; nz /= n;
    const base = this.vertices;
    this.pos.push(ax - this.ox, ay, az - this.oz, bx - this.ox, by, bz - this.oz, cx - this.ox, cy, cz - this.oz, dx - this.ox, dy, dz - this.oz);
    for (let i = 0; i < 4; i++) { this.nor.push(nx, ny, nz); this.col.push(k, k, k); }
    this.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    if (this.tiled && t) for (let i = 0; i < 4; i++) this.tile.push(t.u, t.v, t.du, t.dv);
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  tri(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, uvs: readonly number[], t: AtlasTile, k = 1): void {
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const n = Math.hypot(nx, ny, nz) || 1;
    nx /= n; ny /= n; nz /= n;
    const base = this.vertices;
    this.pos.push(ax - this.ox, ay, az - this.oz, bx - this.ox, by, bz - this.oz, cx - this.ox, cy, cz - this.oz);
    for (let i = 0; i < 3; i++) { this.nor.push(nx, ny, nz); this.col.push(k, k, k); this.tile.push(t.u, t.v, t.du, t.dv); }
    this.uv.push(...uvs);
    this.idx.push(base, base + 1, base + 2);
  }

  build(): THREE.BufferGeometry | null {
    if (!this.idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.tiled) g.setAttribute('aTile', new THREE.Float32BufferAttribute(this.tile, 4));
    g.setIndex(this.vertices > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    return g;
  }
}

/** Mur vertical de (x0,z0) à (x1,z1), face extérieure à droite du sens de parcours. */
function wall(g: Geo, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, u0: number, u1: number, v0: number, v1: number, t: AtlasTile, k = 1): void {
  g.quad(x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0, u0, v0, u1, v1, t, k);
}

/** Les quatre faces, parcourues pour que l'extérieur soit à droite (u croît de gauche à droite vu de dehors). */
function faces(b: CityBuilding): { face: Face; x0: number; z0: number; x1: number; z1: number; nx: number; nz: number }[] {
  const { x, y, w, d } = b;
  return [
    { face: 'n', x0: x + w, z0: y, x1: x, z1: y, nx: 0, nz: -1 },
    { face: 'w', x0: x, z0: y, x1: x, z1: y + d, nx: -1, nz: 0 },
    { face: 's', x0: x, z0: y + d, x1: x + w, z1: y + d, nx: 0, nz: 1 },
    { face: 'e', x0: x + w, z0: y + d, x1: x + w, z1: y, nx: 1, nz: 0 },
  ];
}

// ---------- Vitrines modifiables ----------

interface UnitView {
  geo: Geo;
  shopRanges: [number, number][];
  doorRanges: [number, number][];
  slot: number;
  kind: ShopKind;
  /** Métier connu d'avance (concurrent installé), sinon vitrine générique une fois ouvert. */
  trade: ShopKind | null;
}

/** État de vitrine d'après le texte d'enseigne posé par la boucle de jeu. */
export function shopStateFor(text: string, trade: ShopKind | null): ShopKind {
  if (/^À LOUER$/i.test(text.trim())) return 'libre';
  if (/^BIENTÔT OUVERT$/i.test(text.trim())) return 'bientot';
  return trade ?? 'generique';
}

export interface CityBuildings {
  meshes: THREE.Mesh[];
  /** Maillages sans collision de caméra (stores, enseignes). */
  decor: THREE.Object3D[];
  facadeMaterial: THREE.MeshStandardMaterial;
  signs: SignAtlas;
  setUnitSign(unitId: string, text: string, color: string): void;
  stats: { quads: number; signs: number; chunks: number; atlas: string };
  dispose(): void;
}

const SIGN_COLORS = ['#7a3b2a', '#2f4f3f', '#2c3f5e', '#6b4a1f', '#4a2f4f'];

/**
 * `only` : ne construit que les bâtiments retenus (les autres comptent quand même comme voisins
 * pour les murs mitoyens). Sert à isoler les pavillons génériques, remplaçables par des modèles.
 */
export function buildCityBuildings(only?: (b: CityBuilding) => boolean): CityBuildings {
  const facadeMaterial = createFacadeMaterial();
  const T = (key: string): AtlasTile => atlasTile(key);
  const buildings = CITY.buildings;

  // Emprises au sol : quel bâtiment occupe chaque tuile (murs mitoyens, voisins plus hauts).
  const grid = new Int32Array(CITY_W * CITY_H);
  const wallTop = new Float32Array(buildings.length);
  buildings.forEach((b, i) => {
    wallTop[i] = b.floors * FLOOR_H + 0.15 + CORNICE_M;
    for (let z = Math.max(0, b.y); z < Math.min(CITY_H, b.y + b.d); z++) grid.fill(i + 1, z * CITY_W + Math.max(0, b.x), z * CITY_W + Math.min(CITY_W, b.x + b.w));
  });
  const neighborTop = (x: number, z: number, self: number): number => {
    const tx = Math.floor(x);
    const tz = Math.floor(z);
    if (tx < 0 || tz < 0 || tx >= CITY_W || tz >= CITY_H) return 0;
    const j = grid[tz * CITY_W + tx]! - 1;
    return j >= 0 && j !== self ? wallTop[j]! : 0;
  };

  const blocks = new Map<string, { facade: Geo; decor: Geo; signs: Geo }>();
  const blockOf = (x: number, z: number): { facade: Geo; decor: Geo; signs: Geo } => {
    const i = Math.floor(x / CHUNK);
    const j = Math.floor(z / CHUNK);
    const key = `${i},${j}`;
    let c = blocks.get(key);
    if (!c) {
      const ox = (i + 0.5) * CHUNK;
      const oz = (j + 0.5) * CHUNK;
      c = { facade: new Geo(ox, oz), decor: new Geo(ox, oz), signs: new Geo(ox, oz, false) };
      blocks.set(key, c);
    }
    return c;
  };

  const signCount = buildings.filter((b) => (b.label || b.unitId) && (!only || only(b))).length;
  const signs = new SignAtlas(signCount);
  const units = new Map<string, UnitView>();
  let quads = 0;
  const eps = (px: number): number => 0.5 / px;

  buildings.forEach((b, bi) => {
    if (only && !only(b)) return;
    const v = variantFor(b);
    const seed = hashString(b.id);
    const blk = blockOf(b.x + b.w / 2, b.y + b.d / 2);
    const g = blk.facade;
    const k = 0.94 + b.tint * 0.1;
    const H = b.floors * FLOOR_H + 0.15;
    const G = Math.min(GROUND_TOP, H);
    const Hw = H + CORNICE_M;
    const offU = seed % SHEET_COLS;
    const offV = (seed >> 3) % UPPER_ROWS;
    const upper = T(`upper:${v.id}`);
    const ground = T(`ground:${v.id}`);
    const cornice = T(`cornice:${v.id}`);
    const blind = T(`wall:${v.id}`);
    const trade = b.unitId ? (COMPETITOR_BY_UNIT[b.unitId] ? shopKindFor(COMPETITOR_BY_UNIT[b.unitId]!.categories) : null)
      : b.shopfront ? 'primeur' : null;
    const shopKind: ShopKind = b.unitId ? (trade ?? 'libre') : (trade ?? 'generique');
    const portail = !!b.label && !b.shopfront && v.style !== 'hyper' && v.style !== 'industriel' && v.style !== 'hlm';
    const doorKey = b.place === 'maison' ? 'porte:maison' : portail ? 'porte:portail' : `door:${v.id}`;
    const unit: UnitView | null = b.unitId ? { geo: g, shopRanges: [], doorRanges: [], slot: -1, kind: shopKind, trade } : null;

    for (const f of faces(b)) {
      const L = Math.hypot(f.x1 - f.x0, f.z1 - f.z0);
      const dx = (f.x1 - f.x0) / L;
      const dz = (f.z1 - f.z0) / L;
      // Mur collé à un voisin : seul ce qui dépasse du voisin est dessiné (pignon aveugle).
      const nTop = neighborTop((f.x0 + f.x1) / 2 + f.nx * 0.5, (f.z0 + f.z1) / 2 + f.nz * 0.5, bi);
      if (nTop > 0) {
        if (nTop >= Hw - 0.01) continue;
        if (nTop < H) {
          wall(g, f.x0, f.z0, f.x1, f.z1, nTop, H, 0, L / WALL_U_M, nTop / WALL_V_M, H / WALL_V_M, blind, k);
          quads++;
        }
        const c0 = Math.max(nTop, H);
        wall(g, f.x0, f.z0, f.x1, f.z1, c0, Hw, offU / SHEET_COLS, (offU + L / 3) / SHEET_COLS, eps(CORNICE_PX) + (c0 - H) / CORNICE_M, 1 - eps(CORNICE_PX), cornice, k);
        quads++;
        continue;
      }
      const n = Math.max(1, Math.round(L / 3));
      const mw = L / n;
      const at = (i: number): [number, number] => [f.x0 + dx * i * mw, f.z0 + dz * i * mw];
      const isFront = f.face === b.front;
      const shop = isFront && !!b.shopfront;
      // Rez-de-chaussée : travées regroupées, la porte prend sa travée.
      const doorCols = new Set<number>();
      if (isFront) {
        for (const d of b.doors) {
          if (d.face !== f.face) continue;
          const t = ((d.x + 0.5 - f.x0) * dx + (d.y + 0.5 - f.z0) * dz) / L;
          doorCols.add(Math.max(0, Math.min(n - 1, Math.floor(t * n))));
        }
      }
      const groundTile = shop ? T(`shop:${shopKind}`) : ground;
      let i = 0;
      while (i < n) {
        const [ax, az] = at(i);
        if (doorCols.has(i)) {
          const [bx, bz] = at(i + 1);
          const start = g.vertices;
          wall(g, ax, az, bx, bz, 0, G, eps(MOD_W), 1 - eps(MOD_W), eps(GROUND_PX), 1 - eps(GROUND_PX), shop ? T(`shopdoor:${shopKind}`) : T(doorKey), k);
          if (unit && shop) unit.doorRanges.push([start, 4]);
          quads++;
          i++;
          continue;
        }
        let j = i + 1;
        while (j < n && !doorCols.has(j)) j++;
        const [bx, bz] = at(j);
        const start = g.vertices;
        wall(g, ax, az, bx, bz, 0, G, (offU + i) / SHEET_COLS, (offU + j) / SHEET_COLS, eps(GROUND_PX), 1 - eps(GROUND_PX), groundTile, k);
        if (unit && shop) unit.shopRanges.push([start, 4]);
        quads++;
        i = j;
      }
      // Étages : un seul quadrilatère, la planche de 4 × 2 travées se répète.
      if (H > G + 0.01) {
        wall(g, f.x0, f.z0, f.x1, f.z1, G, H, offU / SHEET_COLS, (offU + n) / SHEET_COLS, offV / UPPER_ROWS, (offV + (H - G) / FLOOR_H) / UPPER_ROWS, upper, k);
        quads++;
      }
      wall(g, f.x0, f.z0, f.x1, f.z1, H, Hw, offU / SHEET_COLS, (offU + n) / SHEET_COLS, eps(CORNICE_PX), 1 - eps(CORNICE_PX), cornice, k);
      quads++;
      // Store rayé au-dessus de la vitrine (85 % des commerces).
      if (shop && hash2(seed, 5, 17) < 0.85) {
        const awn = T(`awning:${awningFor(shopKind, seed)}`);
        const inset = Math.min(0.5, L * 0.05);
        const [ax, az] = [f.x0 + dx * inset, f.z0 + dz * inset];
        const [bx, bz] = [f.x1 - dx * inset, f.z1 - dz * inset];
        const out = 1.25;
        const yTop = 2.45;
        const yLow = 1.95;
        blk.decor.quad(ax + f.nx * out, yLow, az + f.nz * out, bx + f.nx * out, yLow, bz + f.nz * out, bx, yTop, bz, ax, yTop, az,
          0, eps(48), (L - 2 * inset) / 4, 1 - eps(48), awn, 1);
        quads++;
      }
    }

    // ---------- Toits ----------
    const kr = 0.92 + hash2(seed, 1, 3) * 0.14;
    if (b.roof === 'plat') {
      const flat = T('flat');
      g.quad(b.x, H, b.y + b.d, b.x + b.w, H, b.y + b.d, b.x + b.w, H, b.y, b.x, H, b.y, b.x / 4, -(b.y + b.d) / 4, (b.x + b.w) / 4, -b.y / 4, flat, kr);
      quads++;
      // Acrotère vu d'en haut : face intérieure et couvertine (0,2 m d'épaisseur).
      for (const f of faces(b)) {
        const L = Math.hypot(f.x1 - f.x0, f.z1 - f.z0);
        const ix0 = f.x0 - f.nx * 0.2;
        const iz0 = f.z0 - f.nz * 0.2;
        const ix1 = f.x1 - f.nx * 0.2;
        const iz1 = f.z1 - f.nz * 0.2;
        wall(g, ix1, iz1, ix0, iz0, H, Hw, 0, L / WALL_U_M, 0, CORNICE_M / WALL_V_M, blind, k * 0.85);
        g.quad(f.x0, Hw, f.z0, f.x1, Hw, f.z1, ix1, Hw, iz1, ix0, Hw, iz0, 0, 0, L / WALL_U_M, 0.05, blind, k * 1.05);
        quads += 2;
      }
      if (!b.ruined && b.w * b.d > 300) {
        boxInto(g, b.x + b.w * 0.3, H, b.y + b.d * 0.4, 3, 2.2, 2.5, T('wall:hlm_a'), flat, k);
        quads += 5;
      }
    } else if (b.roof === 'deux_pans') {
      const roof = T(`roof:${v.roof}`);
      const ridge = T(`ridge:${v.roof}`);
      const alongX = b.w >= b.d;
      const span = alongX ? b.d : b.w;
      const len = alongX ? b.w : b.d;
      const rh = Math.min(4, span * 0.35);
      const ov = 0.35;
      const slope = Math.hypot(span / 2 + ov, rh * (1 + ov / (span / 2)));
      const y0 = Hw - rh * (ov / (span / 2));
      const top = Hw + rh;
      const ru = (len + 2 * ov) / 4;
      const rv = slope / 4;
      if (alongX) {
        const zm = b.y + b.d / 2;
        g.quad(b.x - ov, y0, b.y + b.d + ov, b.x + b.w + ov, y0, b.y + b.d + ov, b.x + b.w + ov, top, zm, b.x - ov, top, zm, 0, 0, ru, rv, roof, kr);
        g.quad(b.x + b.w + ov, y0, b.y - ov, b.x - ov, y0, b.y - ov, b.x - ov, top, zm, b.x + b.w + ov, top, zm, 0, 0, ru, rv, roof, kr);
        g.quad(b.x - ov, top - 0.17, zm + 0.28, b.x + b.w + ov, top - 0.17, zm + 0.28, b.x + b.w + ov, top + 0.06, zm, b.x - ov, top + 0.06, zm, 0, eps(8), ru, 1 - eps(8), ridge, kr);
        g.quad(b.x + b.w + ov, top - 0.17, zm - 0.28, b.x - ov, top - 0.17, zm - 0.28, b.x - ov, top + 0.06, zm, b.x + b.w + ov, top + 0.06, zm, 0, eps(8), ru, 1 - eps(8), ridge, kr);
        gable(g, b.x, b.y, b.x, b.y + b.d, Hw, rh, blind, k);
        gable(g, b.x + b.w, b.y + b.d, b.x + b.w, b.y, Hw, rh, blind, k);
      } else {
        const xm = b.x + b.w / 2;
        g.quad(b.x - ov, y0, b.y - ov, b.x - ov, y0, b.y + b.d + ov, xm, top, b.y + b.d + ov, xm, top, b.y - ov, 0, 0, ru, rv, roof, kr);
        g.quad(b.x + b.w + ov, y0, b.y + b.d + ov, b.x + b.w + ov, y0, b.y - ov, xm, top, b.y - ov, xm, top, b.y + b.d + ov, 0, 0, ru, rv, roof, kr);
        g.quad(xm - 0.28, top - 0.17, b.y - ov, xm - 0.28, top - 0.17, b.y + b.d + ov, xm, top + 0.06, b.y + b.d + ov, xm, top + 0.06, b.y - ov, 0, eps(8), ru, 1 - eps(8), ridge, kr);
        g.quad(xm + 0.28, top - 0.17, b.y + b.d + ov, xm + 0.28, top - 0.17, b.y - ov, xm, top + 0.06, b.y - ov, xm, top + 0.06, b.y + b.d + ov, 0, eps(8), ru, 1 - eps(8), ridge, kr);
        gable(g, b.x + b.w, b.y, b.x, b.y, Hw, rh, blind, k);
        gable(g, b.x, b.y + b.d, b.x + b.w, b.y + b.d, Hw, rh, blind, k);
      }
      quads += 8;
      // Souches de cheminée sur les toits d'habitation.
      const homely = v.style !== 'civique' && v.style !== 'ecole' && !b.label;
      const chimneys = homely ? Math.floor(hash2(seed, 2, 9) * 3) : 0;
      for (let c = 0; c < chimneys; c++) {
        const along = (c + 1) / (chimneys + 1) + (hash2(seed, c, 4) - 0.5) * 0.15;
        const side = hash2(seed, c, 6) < 0.5 ? -1 : 1;
        const off = span * 0.18;
        const yBase = Hw + rh * (1 - off / (span / 2)) - 0.3;
        const cx = alongX ? b.x + b.w * along : b.x + b.w / 2 + side * off;
        const cz = alongX ? b.y + b.d / 2 + side * off : b.y + b.d * along;
        boxInto(g, cx, yBase, cz, 0.7, top + 0.9 - yBase, 0.7, T('wall:brique_a'), T('flat'), k);
        quads += 5;
      }
    } else {
      // Sheds industriels : dents de scie de 6 m, vitrage au nord.
      const shed = T('shed');
      const glass = T('glass');
      const teeth = Math.max(1, Math.floor(b.w / 6));
      const tw = b.w / teeth;
      const rh = 2.2;
      for (let t = 0; t < teeth; t++) {
        if (b.ruined && t % 3 === 1) continue;
        const x0 = b.x + t * tw;
        const x1 = x0 + tw;
        g.quad(x0, Hw, b.y + b.d, x1, Hw + rh, b.y + b.d, x1, Hw + rh, b.y, x0, Hw, b.y, 0, 0, Math.hypot(tw, rh) / 4, b.d / 4, shed, kr);
        g.quad(x1, Hw, b.y + b.d, x1, Hw, b.y, x1, Hw + rh, b.y, x1, Hw + rh, b.y + b.d, 0, 0, b.d / 4, rh / 4, glass, 1);
        quads += 2;
        // Pignons triangulaires des dents (côtés nord et sud).
        g.tri(x0, Hw, b.y + b.d, x1, Hw, b.y + b.d, x1, Hw + rh, b.y + b.d, [x0 / WALL_U_M, Hw / WALL_V_M, x1 / WALL_U_M, Hw / WALL_V_M, x1 / WALL_U_M, (Hw + rh) / WALL_V_M], blind, k);
        g.tri(x1, Hw, b.y, x0, Hw, b.y, x1, Hw + rh, b.y, [x1 / WALL_U_M, Hw / WALL_V_M, x0 / WALL_U_M, Hw / WALL_V_M, x1 / WALL_U_M, (Hw + rh) / WALL_V_M], blind, k);
      }
    }

    // ---------- Enseignes ----------
    const label = b.label ?? (b.unitId ? 'À LOUER' : undefined);
    if (label) {
      const f = faces(b).find((ff) => ff.face === b.front)!;
      const L = Math.hypot(f.x1 - f.x0, f.z1 - f.z0);
      const dx = (f.x1 - f.x0) / L;
      const dz = (f.z1 - f.z0) / L;
      const big = v.style === 'hyper' || v.style === 'ecole' || v.style === 'civique' || v.style === 'industriel' || b.floors >= 5 || L >= 30;
      let sw: number;
      let sh: number;
      let cy: number;
      let t = 0.5;
      if (b.unitId || b.shopfront) {
        sw = Math.min(L - 0.8, 6.4);
        sh = 0.66;
        cy = 2.85;
      } else {
        sw = Math.min(L - 1, big ? 9 : 4.2);
        sh = big ? 0.95 : 0.7;
        cy = (doorKey === 'porte:portail' ? 2.95 : 2.75) + sh / 2;
        const d = b.doors[0];
        if (d) t = Math.max(sw / 2 / L, Math.min(1 - sw / 2 / L, ((d.x + 0.5 - f.x0) * dx + (d.y + 0.5 - f.z0) * dz) / L));
        if (b.floors === 1) cy = Math.min(cy, H + CORNICE_M - sh / 2 - 0.05);
      }
      sh = Math.max(sh, sw / 8);
      const slot = signs.add(sw, sh);
      const color = b.unitId ? '#5b5249' : SIGN_COLORS[Math.floor(b.tint * SIGN_COLORS.length) % SIGN_COLORS.length]!;
      signs.set(slot, label, color);
      const [u0, v0, u1, v1] = signs.uv(slot);
      const mx = f.x0 + dx * L * t + f.nx * 0.06;
      const mz = f.z0 + dz * L * t + f.nz * 0.06;
      const ax = mx - dx * sw / 2;
      const az = mz - dz * sw / 2;
      const bx = mx + dx * sw / 2;
      const bz = mz + dz * sw / 2;
      blk.signs.quad(ax, cy - sh / 2, az, bx, cy - sh / 2, bz, bx, cy + sh / 2, bz, ax, cy + sh / 2, az, u0, v0, u1, v1, null, 1);
      if (unit) unit.slot = slot;
    }
    if (unit && b.unitId) units.set(b.unitId, unit);
  });

  // ---------- Maillages par bloc ----------
  const meshes: THREE.Mesh[] = [];
  const decor: THREE.Object3D[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const geoOf = new Map<Geo, THREE.BufferGeometry>();
  const place = (gb: Geo, mat: THREE.Material, list: THREE.Object3D[], shadow: boolean): void => {
    const geo = gb.build();
    if (!geo) return;
    geoOf.set(gb, geo);
    geos.push(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(gb.ox, 0, gb.oz);
    m.castShadow = shadow;
    m.receiveShadow = true;
    m.userData.prechunked = true;
    list.push(m);
  };
  for (const blk of blocks.values()) {
    place(blk.facade, facadeMaterial, meshes as THREE.Object3D[], true);
    place(blk.decor, facadeMaterial, decor, true);
    place(blk.signs, signs.material, decor, false);
  }

  const setShop = (u: UnitView, kind: ShopKind): void => {
    if (u.kind === kind) return;
    u.kind = kind;
    const geo = geoOf.get(u.geo);
    const attr = geo?.getAttribute('aTile') as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const shopT = atlasTile(`shop:${kind}`);
    const doorT = atlasTile(`shopdoor:${kind}`);
    for (const [ranges, t] of [[u.shopRanges, shopT], [u.doorRanges, doorT]] as const) {
      for (const [start, count] of ranges) {
        for (let vtx = start; vtx < start + count; vtx++) attr.setXYZW(vtx, t.u, t.v, t.du, t.dv);
        attr.addUpdateRange(start * 4, count * 4);
      }
    }
    attr.needsUpdate = true;
  };

  return {
    meshes,
    decor,
    facadeMaterial,
    signs,
    setUnitSign(unitId: string, text: string, color: string): void {
      const u = units.get(unitId);
      if (!u) return;
      if (u.slot >= 0) signs.set(u.slot, text, color);
      setShop(u, shopStateFor(text, u.trade));
    },
    stats: { quads, signs: signs.count, chunks: blocks.size, atlas: `${facadeAtlas().width}×${facadeAtlas().height}` },
    dispose(): void {
      for (const g of geos) g.dispose();
      facadeMaterial.dispose();
      signs.dispose();
    },
  };
}

/** Pignon triangulaire au-dessus du mur, de (x0,z0) à (x1,z1), extérieur à droite. */
function gable(g: Geo, x0: number, z0: number, x1: number, z1: number, y: number, rh: number, t: AtlasTile, k: number): void {
  const L = Math.hypot(x1 - x0, z1 - z0);
  g.tri(x0, y, z0, x1, y, z1, (x0 + x1) / 2, y + rh, (z0 + z1) / 2, [0, y / WALL_V_M, L / WALL_U_M, y / WALL_V_M, L / 2 / WALL_U_M, (y + rh) / WALL_V_M], t, k);
}

/** Petit volume (édicule, souche de cheminée) : quatre murs et un dessus. */
function boxInto(g: Geo, cx: number, y0: number, cz: number, w: number, h: number, d: number, side: AtlasTile, topT: AtlasTile, k: number): void {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const y1 = y0 + h;
  const u = (l: number): number => l / WALL_U_M;
  wall(g, x1, z0, x0, z0, y0, y1, 0, u(w), y0 / WALL_V_M, y1 / WALL_V_M, side, k);
  wall(g, x0, z0, x0, z1, y0, y1, 0, u(d), y0 / WALL_V_M, y1 / WALL_V_M, side, k);
  wall(g, x0, z1, x1, z1, y0, y1, 0, u(w), y0 / WALL_V_M, y1 / WALL_V_M, side, k);
  wall(g, x1, z1, x1, z0, y0, y1, 0, u(d), y0 / WALL_V_M, y1 / WALL_V_M, side, k);
  g.quad(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0, 0, 0, u(w), u(d), topT, k * 0.8);
}

