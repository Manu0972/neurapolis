/**
 * Fenêtres allumées des modèles Kenney : logique pure, sans Three.js ni DOM (testée à part).
 * - courbe d'allumage selon l'heure (liée à `lamps` de sky.ts : le soir, tout s'allume au même
 *   moment que les lampadaires et les vitrines pixel art, puis les logements s'éteignent un à un) ;
 * - choix déterministe des fenêtres allumées : même lot, même fenêtre, même résultat à chaque session ;
 * - repérage des fenêtres dans la colormap des kits (carreau bleu clair ou panneau gris) ;
 * - miroir en TypeScript du hachage entier du shader (windows.ts), pour le tester sans GPU.
 */
import { dayPhase } from './sky';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const smooth = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * Part des fenêtres allumées (0 → 1) à une heure décimale. `overcast` (0-1) : un jour très gris
 * (pluie), quelques lampes restent allumées dans la journée.
 *
 * Le soir, la courbe suit `lamps` (allumage au crépuscule) ; ensuite les logements s'éteignent
 * (≈ 70 % à 22 h, ≈ 12 % vers 3 h) et quelques lève-tôt rallument avant l'aube (≈ 40 % vers 6 h).
 */
export function windowLitFraction(hour: number, overcast = 0): number {
  const h = ((hour % 24) + 24) % 24;
  const { lamps } = dayPhase(h);
  // Axe de la nuit continu : 0 h-12 h → 24 h-36 h, pour une seule courbe de soirée à matin.
  const x = h < 12 ? h + 24 : h;
  const occupancy = 0.72 - 0.62 * smooth(22.5, 27, x) + 0.3 * smooth(28.3, 30.3, x);
  const grey = clamp01(overcast) * 0.2 * (1 - lamps) * smooth(7.5, 9, h) * (1 - smooth(17, 19, h));
  return clamp01(lamps * occupancy + grey);
}

/** Intensité d'une fenêtre (0 → 1) : elle s'allume quand la part allumée dépasse son seuil. */
export function windowOn(fraction: number, threshold: number): number {
  return smooth(threshold, threshold + 0.12, fraction * 1.12);
}

/** Seuil d'une fenêtre : mélange son tirage et celui du logement (certains logements s'éclairent plus). */
export function windowThreshold(houseRand: number, windowRand: number): number {
  return windowRand + (houseRand - windowRand) * 0.4;
}

// ---------- Hachage entier (miroir exact du GLSL de windows.ts) ----------

/** Hachage 32 bits non signé de trois entiers (mêmes opérations que `hashU` du shader). */
export function hashU(a: number, b: number, c: number): number {
  let x = (Math.imul(a >>> 0, 747796405) + Math.imul(b >>> 0, 2891336453 | 0) + Math.imul(c >>> 0, 277803737)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 2246822519 | 0) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 3266489917 | 0) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

/** Réel [0, 1[ d'un hachage (24 bits, exact en flottant 32 bits comme dans le shader). */
export function rand24(h: number): number {
  return (h >>> 8) / 16777216;
}

/**
 * Graine d'un lot (maison, immeuble) d'après la position de son instance (x et z à 0,5 m près),
 * sur 24 bits : exacte en flottant 32 bits, elle voyage dans la couleur d'instance (rouge) du maillage.
 */
export function lotSeed(x: number, z: number): number {
  return hashU(Math.floor(x * 2 + 0.5) + 100000, Math.floor(z * 2 + 0.5) + 100000, 7) >>> 8;
}

/** Tirage de la fenêtre `id` du lot `seed` (salt : usage du tirage). */
export function windowRand(seed: number, id: number, salt: number): number {
  return rand24(hashU(seed, id, salt));
}

/** Tirage propre au logement (partagé par toutes ses fenêtres). */
export function houseRand(seed: number): number {
  return rand24(hashU(seed, 0, 11));
}

/** La fenêtre `id` du lot `seed` est-elle allumée (intensité 0-1) pour cette part allumée ? */
export function lotWindowOn(seed: number, id: number, fraction: number): number {
  return windowOn(fraction, windowThreshold(houseRand(seed), windowRand(seed, id, 3)));
}

/** Teinte chaude d'une fenêtre (RVB linéaire approché) selon un tirage 0-1 : ambre, jaune, orangé, un peu de télé bleutée. */
export function windowTint(r: number): [number, number, number] {
  if (r < 0.5) return [1.0, 0.76, 0.4];
  if (r < 0.8) return [1.0, 0.64, 0.3];
  if (r < 0.92) return [1.0, 0.5, 0.2];
  return [0.62, 0.76, 1.0];
}

// ---------- Repérage des fenêtres dans la colormap des kits ----------

/** Carreau de la colormap (16 colonnes de 32 px × 4 rangées de 128 px : 8 teintes × (aplat, dégradé)). */
export function colormapCell(u: number, v: number): { col: number; row: number } {
  return { col: Math.floor(u * 8), row: Math.floor(v * 4) };
}

/**
 * Nature des fenêtres d'un modèle : `discrete` = chaque vitre est un petit maillage à part (maisons,
 * petits immeubles) ; `grid` = grands panneaux vitrés, découpés en cellules par le shader
 * (tours, immeubles simplifiés de l'horizon).
 */
export type WindowKind = 'discrete' | 'grid';

/** Carreau et nature des fenêtres d'un modèle Kenney ; `null` si le modèle n'en a pas. */
export function windowSpec(kit: 'commercial' | 'suburban', model: string): { cell: { col: number; row: number }; kind: WindowKind } | null {
  if (kit === 'suburban') return { cell: { col: 5, row: 1 }, kind: 'discrete' };
  if (model.startsWith('low-detail-')) return { cell: { col: 0, row: 2 }, kind: 'grid' };
  if (model.startsWith('building-skyscraper')) return { cell: { col: 5, row: 1 }, kind: 'grid' };
  return { cell: { col: 5, row: 1 }, kind: 'discrete' };
}

/**
 * Identifiants de fenêtre par sommet (attribut `aWin` du shader) : 0 = pas une fenêtre ;
 * > 0 = fenêtre individuelle (numéro de composante connexe) ; −1 = panneau à découper en grille.
 * Les sommets d'une même vitre sont soudés par leur position (les coutures d'UV les séparent).
 */
export function assignWindowIds(
  positions: ArrayLike<number>,
  uvs: ArrayLike<number>,
  index: ArrayLike<number> | null,
  kit: 'commercial' | 'suburban',
  model: string,
): Float32Array {
  const n = positions.length / 3;
  const out = new Float32Array(n);
  const spec = windowSpec(kit, model);
  if (!spec) return out;
  const isWin = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const c = colormapCell(uvs[i * 2]!, uvs[i * 2 + 1]!);
    isWin[i] = c.col === spec.cell.col && c.row === spec.cell.row ? 1 : 0;
  }
  if (spec.kind === 'grid') {
    for (let i = 0; i < n; i++) if (isWin[i]) out[i] = -1;
    return out;
  }
  // Composantes connexes (union-find) sur les triangles dont les trois sommets sont des vitres.
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]!]!; a = parent[a]!; } return a; };
  const union = (a: number, b: number): void => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[ra] = rb; };
  const byPos = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    if (!isWin[i]) continue;
    const key = `${Math.round(positions[i * 3]! * 1000)},${Math.round(positions[i * 3 + 1]! * 1000)},${Math.round(positions[i * 3 + 2]! * 1000)}`;
    const o = byPos.get(key);
    if (o === undefined) byPos.set(key, i); else union(i, o);
  }
  const tri = index ? index.length : n;
  for (let t = 0; t + 2 < tri; t += 3) {
    const a = index ? index[t]! : t;
    const b = index ? index[t + 1]! : t + 1;
    const c = index ? index[t + 2]! : t + 2;
    if (isWin[a] && isWin[b] && isWin[c]) { union(a, b); union(b, c); }
  }
  // Numérotation stable : par ordre d'apparition de la racine dans les sommets.
  const ids = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    if (!isWin[i]) continue;
    const r = find(i);
    let id = ids.get(r);
    if (id === undefined) { id = ids.size + 1; ids.set(r, id); }
    out[i] = id;
  }
  return out;
}

/**
 * Hauteur relative (0 = bas, 1 = haut) de chaque sommet de porte d'une maison (attribut `aDoor`), −1 ailleurs :
 * le shader allume l'imposte (haut de la porte) de quelques logements la nuit. La porte est le carreau
 * sombre (1, 2) de la colormap du kit Suburban, sur le rez-de-chaussée seulement.
 */
export function assignDoorHeights(positions: ArrayLike<number>, uvs: ArrayLike<number>, kit: 'commercial' | 'suburban'): Float32Array {
  const n = positions.length / 3;
  const out = new Float32Array(n).fill(-1);
  if (kit !== 'suburban') return out;
  let top = -Infinity;
  for (let i = 0; i < n; i++) top = Math.max(top, positions[i * 3 + 1]!);
  const door: number[] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    const c = colormapCell(uvs[i * 2]!, uvs[i * 2 + 1]!);
    const y = positions[i * 3 + 1]!;
    if (c.col === 1 && c.row === 2 && y < top * 0.36) { door.push(i); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  }
  for (const i of door) out[i] = hi > lo ? (positions[i * 3 + 1]! - lo) / (hi - lo) : 1;
  return out;
}

/** Teintes d'enduit des murs (multiplicateurs sur la couleur crème du kit), une par logement. */
export const PLASTER_TINTS: readonly (readonly [number, number, number])[] = [
  [1.0, 1.0, 1.0],
  [1.0, 0.9, 0.72],
  [1.0, 0.88, 0.86],
  [0.88, 0.95, 0.86],
  [0.88, 0.92, 1.0],
  [0.97, 0.97, 0.97],
];

/** Teinte d'enduit du lot `seed` (même lot → même couleur). */
export function plasterOf(seed: number): readonly [number, number, number] {
  return PLASTER_TINTS[hashU(seed, 0, 13) % PLASTER_TINTS.length]!;
}
