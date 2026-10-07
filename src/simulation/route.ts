/**
 * GPS (V1.1, lot B) : itinéraire à pied sur la grille de la ville et destinations proposées.
 * Fonctions pures, déterministes, sans DOM : la présentation trace le chemin et les flèches.
 *
 * Recherche A* en 8 directions (pas de coupe d'angle contre un mur), quartiers fermés évités
 * comme pour la marche (`areaPassable`). Les tableaux de travail (≈ 1,8 M tuiles) sont alloués
 * une seule fois puis réutilisés.
 */
import type { PlaceId, WorldState } from '../core/types';
import { CITY, CITY_H, CITY_W } from '../data/city/layout';
import { LANDMARKS } from '../data/city/landmarks';
import { BUS_STOPS } from '../data/city/transit';
import { isWalkable, PLACE_ANCHORS } from '../data/map';
import { PLACE_BY_ID } from '../data/places';
import { areaOpen, areaPassable } from './areas';
import { businessDoor } from './economy';
import { busRoute } from './transit';

export interface Point {
  x: number;
  y: number;
}

export interface Route {
  /** Points de passage : départ, chaque changement de direction, arrivée (centres de tuiles). */
  points: Point[];
  /** Longueur à pied, en mètres (1 tuile = 1 m). */
  meters: number;
}

/** Au-delà, on renonce (destination enclavée) plutôt que de figer le jeu. */
const MAX_EXPANSIONS = 900_000;
const SQRT2 = Math.SQRT2;
const DIRS: readonly [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2],
];

let walkMask: Uint8Array | null = null;
let gScore: Float32Array | null = null;
let cameFrom: Int32Array | null = null;
let stamp: Uint32Array | null = null;
let closedStamp: Uint32Array | null = null;
let run = 0;

function mask(): Uint8Array {
  if (!walkMask) {
    walkMask = new Uint8Array(CITY_W * CITY_H);
    for (let y = 0; y < CITY_H; y++) for (let x = 0; x < CITY_W; x++) if (isWalkable(x, y)) walkMask[y * CITY_W + x] = 1;
  }
  return walkMask;
}

function walkable(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < CITY_W && y < CITY_H && mask()[y * CITY_W + x] === 1;
}

/** Tas binaire minimal (indices de tuiles triés par f). */
class Heap {
  private ids: number[] = [];
  private fs: number[] = [];
  get size(): number { return this.ids.length; }
  push(id: number, f: number): void {
    const ids = this.ids, fs = this.fs;
    let i = ids.length;
    ids.push(id); fs.push(f);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (fs[p]! <= f) break;
      ids[i] = ids[p]!; fs[i] = fs[p]!;
      i = p;
    }
    ids[i] = id; fs[i] = f;
  }
  pop(): number {
    const ids = this.ids, fs = this.fs;
    const top = ids[0]!;
    const lastId = ids.pop()!, lastF = fs.pop()!;
    const n = ids.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mf = lastF;
        if (l < n && fs[l]! < mf) { m = l; mf = fs[l]!; }
        if (r < n && fs[r]! < mf) { m = r; mf = fs[r]!; }
        if (m === i) break;
        ids[i] = ids[m]!; fs[i] = fs[m]!;
        i = m;
      }
      ids[i] = lastId; fs[i] = lastF;
    }
    return top;
  }
}

/** Tuile franchissable la plus proche (départ un peu décalé, porte, arrêt de bus). */
export function nearestWalkable(p: Point, radius = 6): Point | null {
  const cx = Math.floor(p.x), cy = Math.floor(p.y);
  if (walkable(cx, cy)) return { x: cx, y: cy };
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (walkable(cx + dx, cy + dy)) return { x: cx + dx, y: cy + dy };
      }
    }
  }
  return null;
}

/** Itinéraire à pied le plus court, ou null si la destination est inaccessible. */
export function findRoute(w: WorldState, from: Point, to: Point): Route | null {
  const s = nearestWalkable(from);
  const t = nearestWalkable(to);
  if (!s || !t) return null;
  const N = CITY_W * CITY_H;
  if (!gScore) {
    gScore = new Float32Array(N);
    cameFrom = new Int32Array(N);
    stamp = new Uint32Array(N);
    closedStamp = new Uint32Array(N);
  }
  const g = gScore, came = cameFrom!, seen = stamp!, closed = closedStamp!;
  run = (run + 1) >>> 0;
  if (run === 0) { seen.fill(0); closed.fill(0); run = 1; }
  const start = s.y * CITY_W + s.x;
  const goal = t.y * CITY_W + t.x;
  const h = (x: number, y: number): number => {
    const dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
    return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
  };
  const open = new Heap();
  g[start] = 0; came[start] = -1; seen[start] = run;
  open.push(start, h(s.x, s.y));
  let expansions = 0;
  while (open.size > 0) {
    const cur = open.pop();
    if (closed[cur] === run) continue;
    closed[cur] = run;
    if (cur === goal) break;
    if (++expansions > MAX_EXPANSIONS) return null;
    const cx = cur % CITY_W, cy = (cur - cx) / CITY_W;
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!walkable(nx, ny)) continue;
      // En diagonale, les deux tuiles d'angle doivent être libres (on ne traverse pas un coin de mur).
      if (dx !== 0 && dy !== 0 && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      if (!areaPassable(w, cx, cy, nx, ny)) continue;
      const ni = ny * CITY_W + nx;
      if (closed[ni] === run) continue;
      const ng = g[cur]! + cost;
      if (seen[ni] === run && ng >= g[ni]!) continue;
      seen[ni] = run; g[ni] = ng; came[ni] = cur;
      open.push(ni, ng + h(nx, ny));
    }
  }
  if (closed[goal] !== run) return null;
  // Remontée du chemin, puis seuls les changements de direction sont gardés.
  const tiles: number[] = [];
  for (let i = goal; i !== -1; i = came[i]!) tiles.push(i);
  tiles.reverse();
  const xy = (i: number): [number, number] => { const x = i % CITY_W; return [x, (i - x) / CITY_W]; };
  const points: Point[] = [];
  for (let k = 0; k < tiles.length; k++) {
    const [x, y] = xy(tiles[k]!);
    if (k > 0 && k < tiles.length - 1) {
      const [px, py] = xy(tiles[k - 1]!);
      const [nx, ny] = xy(tiles[k + 1]!);
      if (x - px === nx - x && y - py === ny - y) continue;
    }
    points.push({ x: x + 0.5, y: y + 0.5 });
  }
  return { points: smooth(points), meters: Math.round(g[goal]!) };
}

/** Ligne droite praticable entre deux points (échantillonnée tous les 0,25 m, avec marge latérale). */
function clearLine(a: Point, b: Point): boolean {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(len * 4));
  const ox = ((b.y - a.y) / (len || 1)) * 0.3, oy = (-(b.x - a.x) / (len || 1)) * 0.3;
  for (let k = 0; k <= n; k++) {
    const x = a.x + ((b.x - a.x) * k) / n, y = a.y + ((b.y - a.y) * k) / n;
    if (!walkable(Math.floor(x), Math.floor(y))) return false;
    if (!walkable(Math.floor(x + ox), Math.floor(y + oy)) || !walkable(Math.floor(x - ox), Math.floor(y - oy))) return false;
  }
  return true;
}

/** Tracé tiré au cordeau : on saute les virages tant que la ligne droite reste praticable. */
function smooth(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const out: Point[] = [points[0]!];
  let i = 0;
  while (i < points.length - 1) {
    let j = points.length - 1;
    while (j > i + 1 && !clearLine(points[i]!, points[j]!)) j--;
    out.push(points[j]!);
    i = j;
  }
  return out;
}

/** Distance restante le long d'un itinéraire, depuis le point le plus proche de `p`. */
export function remainingMeters(route: Route, p: Point): { meters: number; offRoute: number } {
  let best = Infinity, bestSeg = 0, bestT = 0;
  const pts = route.points;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
    const d = Math.hypot(a.x + vx * t - p.x, a.y + vy * t - p.y);
    if (d < best) { best = d; bestSeg = i; bestT = t; }
  }
  if (pts.length < 2) return { meters: 0, offRoute: pts[0] ? Math.hypot(pts[0].x - p.x, pts[0].y - p.y) : 0 };
  const a = pts[bestSeg]!, b = pts[bestSeg + 1]!;
  let m = Math.hypot(b.x - a.x, b.y - a.y) * (1 - bestT);
  for (let i = bestSeg + 1; i + 1 < pts.length; i++) m += Math.hypot(pts[i + 1]!.x - pts[i]!.x, pts[i + 1]!.y - pts[i]!.y);
  return { meters: Math.round(m), offRoute: best };
}

// ---------- Destinations ----------

export type DestinationKind = 'lieu' | 'repere' | 'arret' | 'commerce';

export interface GpsDestination {
  id: string;
  kind: DestinationKind;
  icon: string;
  name: string;
  x: number;
  y: number;
  /** Dans un quartier encore fermé : visible, mais pas d'itinéraire. */
  locked: boolean;
}

const KIND_ICON: Record<DestinationKind, string> = { lieu: '📍', repere: '🏛️', arret: '🚏', commerce: '🏪' };

/** Tout ce qu'on peut choisir comme destination (lieux, lieux remarquables, arrêts, tes commerces). */
export function gpsDestinations(w: WorldState): GpsDestination[] {
  const out: Omit<GpsDestination, 'locked'>[] = [];
  for (const [id, a] of Object.entries(PLACE_ANCHORS) as [PlaceId, Point][]) {
    out.push({ id: `lieu:${id}`, kind: 'lieu', icon: id === 'maison' ? '🏠' : KIND_ICON.lieu, name: id === 'maison' ? 'Chez toi' : PLACE_BY_ID[id]?.name ?? id, x: a.x, y: a.y });
  }
  for (const lm of LANDMARKS) {
    const b = CITY.buildings.find((bb) => bb.id === lm.buildingId);
    const d = b?.doors[0];
    if (d) out.push({ id: `repere:${lm.id}`, kind: 'repere', icon: KIND_ICON.repere, name: lm.name, x: d.x, y: d.y });
  }
  for (const s of BUS_STOPS) out.push({ id: `arret:${s.id}`, kind: 'arret', icon: KIND_ICON.arret, name: `Arrêt ${s.name}`, x: s.x, y: s.y });
  for (const b of Object.values(w.economy?.businesses ?? {})) {
    const d = businessDoor(b);
    out.push({ id: `commerce:${b.id}`, kind: 'commerce', icon: KIND_ICON.commerce, name: b.name, x: d.x, y: d.y });
  }
  return out.map((d) => ({ ...d, locked: !areaOpen(w, d.x, d.y) }));
}

/** Recherche sans accents ni majuscules : « boulangerie », « gare », un prénom… */
export function searchDestinations(list: readonly GpsDestination[], query: string): GpsDestination[] {
  const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(query.trim());
  if (!q) return [...list];
  return list.filter((d) => norm(d.name).includes(q));
}

// ---------- Bus : est-ce plus rapide ? ----------

export interface BusHint {
  board: string;
  alight: string;
  lines: string[];
  transfer?: string;
  /** Marche jusqu'à l'arrêt + marche depuis l'arrêt (mètres, à vol d'oiseau ×1,3). */
  walkMeters: number;
}

/**
 * Conseil bus : arrêt le plus proche du départ et de l'arrivée, si le bus évite une longue marche.
 * Estimation volontairement simple (à vol d'oiseau), seulement pour proposer, jamais pour décider.
 */
export function busHint(from: Point, to: Point, walkMeters: number): BusHint | null {
  if (walkMeters < 450) return null;
  const near = (p: Point): { id: string; d: number } | null => {
    let best: { id: string; d: number } | null = null;
    for (const s of BUS_STOPS) {
      const d = Math.hypot(s.x - p.x, s.y - p.y) * 1.3;
      if (!best || d < best.d) best = { id: s.id, d };
    }
    return best;
  };
  const a = near(from), b = near(to);
  if (!a || !b || a.id === b.id) return null;
  const walk = a.d + b.d;
  if (walk > walkMeters * 0.6) return null;
  const r = busRoute(a.id, b.id);
  if (!r) return null;
  return { board: a.id, alight: b.id, lines: r.lines, transfer: r.transfer, walkMeters: Math.round(walk) };
}
