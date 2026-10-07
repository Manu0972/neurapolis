/**
 * Grille de la ville (1 tuile = 1 mètre), dérivée de la description de Val-Ferrand
 * (src/data/city/layout.ts). La simulation ne raisonne qu'en tuiles entières : collisions,
 * entrées des lieux, ancres des PNJ. L'API publique est inchangée depuis la carte 48×32.
 *
 * Deux couches par tuile :
 *  - `kind` : la sémantique de simulation (franchissable ou non, entrée de lieu, mobilier) ;
 *  - `surface` : le revêtement, lu par le rendu (chaussée, trottoir, herbe, eau…).
 */
import type { PlaceId } from '../core/types';
import { CITY, CITY_H, CITY_W, type CityPropKind } from './city/layout';

export { CITY } from './city/layout';

export const MAP_W = CITY_W;
export const MAP_H = CITY_H;
/** Taille d'une tuile en pixels pour le rendu 2D de secours. */
export const TILE_PX = 32;

export type WorldPropId = 'arbre' | 'banc' | 'lampadaire' | 'fontaine' | 'jardiniere';
export type TileKind = 'sol' | 'herbe' | 'terre' | 'mur' | 'entree' | 'decor';
export type Surface =
  | 'chaussee' | 'passage' | 'trottoir' | 'pave' | 'herbe' | 'terre' | 'gravier' | 'parking'
  | 'eau' | 'cour' | 'batiment' | 'aire_jeux';

export interface Tile {
  kind: TileKind;
  surface: Surface;
  place?: PlaceId;     // présent si kind === 'entree' d'un lieu
  unitId?: string;     // porte d'un local commercial
  buildingId?: string; // tuile occupée par un bâtiment
  decoration?: WorldPropId;
  prop?: CityPropKind;
}

const SURFACES: readonly Surface[] = [
  'chaussee', 'passage', 'trottoir', 'pave', 'herbe', 'terre', 'gravier', 'parking', 'eau', 'cour', 'batiment', 'aire_jeux',
];
const S = (s: Surface): number => SURFACES.indexOf(s);

// Couches compactes : surface (index), et franchissabilité de base.
const surface = new Uint8Array(CITY_W * CITY_H).fill(S('trottoir'));
const special = new Map<number, Tile>();
const idx = (x: number, y: number): number => y * CITY_W + x;

function fill(x: number, y: number, w: number, h: number, s: Surface): void {
  for (let yy = Math.max(0, y); yy < Math.min(CITY_H, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(CITY_W, x + w); xx++) surface[idx(xx, yy)] = S(s);
  }
}

// 1. Chaussées, puis passages piétons.
for (const r of CITY.roads) fill(r.x, r.y, r.w, r.h, 'chaussee');
for (const c of CITY.crossings) fill(c.x, c.y, c.w, c.h, 'passage');
// 2. Zones (cours, parcs, friche, places, eau) : l'ordre de déclaration fait foi.
const ZONE_SURFACE: Record<string, Surface> = {
  herbe: 'herbe', terre: 'terre', pave: 'pave', parking: 'parking', eau: 'eau', cour: 'cour', aire_jeux: 'aire_jeux', gravier: 'gravier',
};
for (const z of CITY.zones) fill(z.x, z.y, z.w, z.h, ZONE_SURFACE[z.kind] ?? 'pave');
// Ponts : la chaussée enjambe le canal (après les zones, donc après l'eau).
for (const b of CITY.bridges) fill(b.x, b.y, b.w, b.h, 'chaussee');
// 3. Bâtiments.
// Grande carte : un indice de bâtiment par tuile dans un tableau compact (pas une Map par tuile).
const buildingIds: string[] = CITY.buildings.map((b) => b.id);
const buildingOf = new Int32Array(CITY_W * CITY_H).fill(-1);
CITY.buildings.forEach((b, bi) => {
  fill(b.x, b.y, b.w, b.d, 'batiment');
  for (let yy = Math.max(0, b.y); yy < Math.min(CITY_H, b.y + b.d); yy++) {
    for (let xx = Math.max(0, b.x); xx < Math.min(CITY_W, b.x + b.w); xx++) buildingOf[idx(xx, yy)] = bi;
  }
});
// 4. Portes : entrées des lieux et des locaux (franchissables), portes d'immeubles (décor).
for (const b of CITY.buildings) {
  for (const d of b.doors) {
    if (d.residential) continue;
    special.set(idx(d.x, d.y), Object.freeze({
      kind: 'entree', surface: 'batiment', place: d.place, unitId: d.unitId, buildingId: b.id,
    }) as Tile);
  }
}
// Étals du marché : entrée d'un local sans bâtiment, sur la place pavée.
for (const u of CITY.units) {
  if (!u.buildingId.startsWith('etal_')) continue;
  special.set(idx(u.door.x, u.door.y), Object.freeze({ kind: 'entree', surface: 'pave', unitId: u.id }) as Tile);
}
// 5. Mobilier bloquant.
const PROP_AS_DECORATION: Partial<Record<CityPropKind, WorldPropId>> = {
  arbre: 'arbre', banc: 'banc', lampadaire: 'lampadaire', fontaine: 'fontaine', jardiniere: 'jardiniere',
};
export const DECORATIONS: { x: number; y: number; id: WorldPropId }[] = [];
for (const p of CITY.props) {
  if (!p.blocks) continue;
  const decoration = PROP_AS_DECORATION[p.kind];
  // Grands objets (voitures, conteneurs, haies) : toute leur emprise bloque, sans écraser une porte.
  for (let yy = p.y; yy < p.y + (p.h ?? 1); yy++) {
    for (let xx = p.x; xx < p.x + (p.w ?? 1); xx++) {
      if (xx < 0 || yy < 0 || xx >= CITY_W || yy >= CITY_H) continue;
      const i = idx(xx, yy);
      if (special.get(i)?.kind === 'entree') continue;
      special.set(i, Object.freeze({ kind: 'decor', surface: SURFACES[surface[i]!]!, prop: p.kind, decoration }) as Tile);
    }
  }
  if (decoration) DECORATIONS.push({ x: p.x, y: p.y, id: decoration });
}

// Tuiles partagées (immuables) par revêtement.
const KIND_OF: Record<Surface, TileKind> = {
  chaussee: 'sol', passage: 'sol', trottoir: 'sol', pave: 'sol', parking: 'sol', gravier: 'sol', aire_jeux: 'herbe',
  herbe: 'herbe', terre: 'terre', eau: 'mur', cour: 'mur', batiment: 'mur',
};
const SHARED: Tile[] = SURFACES.map((s) => Object.freeze({ kind: KIND_OF[s], surface: s }) as Tile);
const buildingTiles = new Map<string, Tile>();

export function tileAt(x: number, y: number): Tile | null {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= CITY_W || y >= CITY_H) return null;
  const i = idx(x, y);
  const sp = special.get(i);
  if (sp) return sp;
  const s = surface[i]!;
  if (SURFACES[s] === 'batiment') {
    const bi = buildingOf[i]!;
    const id = bi >= 0 ? buildingIds[bi] : undefined;
    if (id) {
      let t = buildingTiles.get(id);
      if (!t) {
        t = Object.freeze({ kind: 'mur', surface: 'batiment', buildingId: id }) as Tile;
        buildingTiles.set(id, t);
      }
      return t;
    }
  }
  return SHARED[s]!;
}

export function isWalkable(x: number, y: number): boolean {
  const t = tileAt(x, y);
  return t !== null && t.kind !== 'mur' && t.kind !== 'decor';
}

export function entranceAt(x: number, y: number): PlaceId | undefined {
  const t = tileAt(x, y);
  return t && t.kind === 'entree' ? t.place : undefined;
}

/** Local commercial dont la porte est sur cette tuile. */
export function unitAt(x: number, y: number): string | undefined {
  const t = tileAt(x, y);
  return t && t.kind === 'entree' ? t.unitId : undefined;
}

/** Accès rapide au revêtement (construction de la scène 3D de la grande carte). */
export function surfaceFast(x: number, y: number): Surface {
  return SURFACES[surface[y * CITY_W + x]!]!;
}

export function surfaceAt(x: number, y: number): Surface | null {
  return tileAt(x, y)?.surface ?? null;
}

/** Nom de la rue la plus proche (chaussée ou trottoir qui la borde). */
export function streetNameAt(x: number, y: number): string | undefined {
  let best: { name: string; d: number } | undefined;
  for (const r of CITY.roads) {
    const dx = Math.max(r.x - x, 0, x - (r.x + r.w - 1));
    const dy = Math.max(r.y - y, 0, y - (r.y + r.h - 1));
    const d = dx + dy;
    if (!best || d < best.d) best = { name: r.name, d };
  }
  return best && best.d <= 6 ? best.name : undefined;
}

/** Tuile franchissable devant l'entrée de chaque lieu : ancre des PNJ et point de départ. */
export const PLACE_ANCHORS: Record<PlaceId, { x: number; y: number }> = CITY.anchors;

/** Validation des données : chaque lieu a une entrée, chaque ancre est franchissable. */
export function assertMapValid(): void {
  for (const [place, anchor] of Object.entries(PLACE_ANCHORS) as [PlaceId, { x: number; y: number }][]) {
    if (!isWalkable(anchor.x, anchor.y)) {
      throw new Error(`Carte : l'ancre de ${place} (${anchor.x},${anchor.y}) n'est pas franchissable.`);
    }
    const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => entranceAt(anchor.x + dx!, anchor.y + dy!) === place);
    if (!near) throw new Error(`Carte : l'ancre de ${place} n'est pas devant son entrée.`);
  }
  for (const u of CITY.units) {
    if (unitAt(u.door.x, u.door.y) !== u.id) throw new Error(`Carte : la porte du local ${u.id} est introuvable.`);
  }
}

assertMapValid();
