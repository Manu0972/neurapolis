/**
 * Carte du quartier — 48×32 tuiles (32 px), données pures interprétées par le moteur.
 * Chaque ligne intérieure fait 46 caractères ; les bords (#) sont ajoutés ici.
 * Légende : '#' mur · '.' trottoir · 'g' herbe (parc) · 'd' terre (friche)
 * · 'm' entrée maison · 'c' entrée collège · 'e' entrée épicerie
 * · 'f' entrée friche · 'p' entrée parc · 'q' entrée place.
 */
import type { PlaceId } from '../core/types';

export const MAP_W = 48;
export const MAP_H = 32;
export const TILE_PX = 32;

const INNER: readonly string[] = [
  '##############################################',
  '..............................................',
  '.#############................................',
  '.#...........#.....#######....................',
  '.#...........#.....#.....#....................',
  '.#...........#.....#.....#....................',
  '.#...........#.....#.....#....................',
  '.#...........#.....###e###....................',
  '.######c######................................',
  '..............................................',
  '................................###########...',
  '................................#.........#...',
  '................................#.........#...',
  '................................#.........#...',
  '...............q................#.........#...',
  '................................#####m#####...',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '...................gggggggggggggggggggggggggg#',
  'dddfdddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggpgggggggggggggggggggggggg',
  'dd#ddddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggggg#ggggggggggggggggggggg',
  'dddddddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggggggggggggggggggggg#ggggg',
  'dddddddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggggggggggggggggggggggggggg',
  'dddddddddddddddddd#ggggggggggggggggggggggggggg',
  '##############################################',
];

export type TileKind = 'sol' | 'herbe' | 'terre' | 'mur' | 'entree';

export interface Tile {
  kind: TileKind;
  place?: PlaceId; // présent si kind === 'entree'
}

const ENTRY: Record<string, PlaceId> = {
  m: 'maison', c: 'college', e: 'epicerie', f: 'friche', p: 'parc', q: 'place',
};

function kindOf(ch: string): TileKind {
  if (ch === '#') return 'mur';
  if (ch === 'g') return 'herbe';
  if (ch === 'd') return 'terre';
  if (ch in ENTRY) return 'entree';
  return 'sol';
}

function buildTiles(): Tile[][] {
  const tiles: Tile[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: Tile[] = [];
    const inner = INNER[y] ?? '';
    for (let x = 0; x < MAP_W; x++) {
      const ch = x === 0 || x === MAP_W - 1 ? '#' : (inner[x - 1] ?? '#');
      const tile: Tile = { kind: kindOf(ch) };
      if (tile.kind === 'entree') tile.place = ENTRY[ch];
      row.push(tile);
    }
    tiles.push(row);
  }
  return tiles;
}

const TILES: Tile[][] = buildTiles();

export function tileAt(x: number, y: number): Tile | null {
  const row = TILES[y];
  if (!row) return null;
  return row[x] ?? null;
}

export function isWalkable(x: number, y: number): boolean {
  const t = tileAt(x, y);
  return t !== null && t.kind !== 'mur';
}

export function entranceAt(x: number, y: number): PlaceId | undefined {
  const t = tileAt(x, y);
  return t && t.kind === 'entree' ? t.place : undefined;
}

/** Tuile représentative de chaque lieu : ancre des PNJ et point d'ancrage du rendu. */
export const PLACE_ANCHORS: Record<PlaceId, { x: number; y: number }> = {
  maison: { x: 38, y: 13 },
  college: { x: 8, y: 5 },
  epicerie: { x: 23, y: 5 },
  friche: { x: 9, y: 25 },
  parc: { x: 33, y: 25 },
  place: { x: 14, y: 14 },
};

/** Validation des données : dimensions, caractères connus, une entrée par lieu, ancres franchissables. */
export function assertMapValid(): void {
  if (INNER.length !== MAP_H) {
    throw new Error(`Carte : ${INNER.length} lignes au lieu de ${MAP_H}.`);
  }
  INNER.forEach((row, i) => {
    if (row.length !== MAP_W - 2) {
      throw new Error(`Carte ligne ${i} : ${row.length} caractères au lieu de ${MAP_W - 2}.`);
    }
    for (const ch of row) {
      if (!'#.gdmcefpq'.includes(ch)) throw new Error(`Carte ligne ${i} : caractère inconnu « ${ch} ».`);
    }
  });
  for (const [ch, place] of Object.entries(ENTRY)) {
    const found = INNER.some((row) => row.includes(ch));
    if (!found) throw new Error(`Carte : aucune entrée « ${ch} » pour ${place}.`);
    const anchor = PLACE_ANCHORS[place];
    if (!isWalkable(anchor.x, anchor.y)) {
      throw new Error(`Carte : l'ancre de ${place} (${anchor.x},${anchor.y}) est un mur.`);
    }
  }
}

assertMapValid();
