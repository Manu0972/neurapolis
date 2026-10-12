/**
 * Façades en pixel art de la ville 3D (direction retenue le 2026-10-12, prototype « village ») :
 * 32 px = 1 m, palette chaude fermée, contour #2a1a14, ni noir ni blanc purs.
 *
 * Tout est généré ici, sans image externe et sans DOM : un ATLAS unique (un seul matériau pour
 * tous les bâtiments) qui contient, pour chaque variante de style, une planche d'étages
 * (4 travées × 2 étages qui se répètent), une planche de rez-de-chaussée, une corniche, un mur
 * aveugle et une porte ; puis les vitrines par commerce, les stores, les toits. Le canal alpha
 * porte le masque des fenêtres allumées la nuit (voir pixelArt.ts).
 *
 * Déterministe : mêmes entrées → mêmes pixels (aucun Math.random).
 */
import type { FacadeStyle } from '../../data/city/layout';
import { PixelBuffer, hash2, hashString, pack, rgb, type Rgb } from './pixelArt';

// ---------- Mesures (32 px = 1 m) ----------

export const PX_PER_M = 32;
/** Travée : 3 m de large. */
export const MOD_W = 96;
/** Étage courant : 3,2 m (102 px). */
export const FLOOR_PX = 102;
/** Rez-de-chaussée : 3,35 m (102 px + la marche du trottoir). */
export const GROUND_PX = 107;
/** Planches répétées : 4 travées de large, 2 étages de haut. */
export const SHEET_COLS = 4;
export const UPPER_ROWS = 2;
/** Corniche / acrotère : 0,5 m. */
export const CORNICE_PX = 16;
export const CORNICE_M = CORNICE_PX / PX_PER_M;
/** Mur aveugle, toits : carreaux de 4 m × 3 m (mur) ou 4 m × 4 m (toit). */
export const WALL_W = 128;
export const WALL_H = 96;
export const ROOF_PX = 128;
export const AWNING_W = 128;
export const AWNING_H = 48;
/** Marge recopiée autour de chaque carreau de l'atlas (filtrage et mipmaps sans fuite). */
const GUTTER = 8;
const ATLAS_W = 2048;

// ---------- Palette fermée (docs/guide-style-da-2.5d.md, GUIDE-DA.md) ----------

export const PALETTE = {
  contour: '#2a1a14',
  ivoire: '#f9ecd0',
  creme_o: '#cfa97f', creme: '#efd9ac',
  ocre_o: '#a8744a', ocre: '#d6a25e', ocre_l: '#ecc488',
  rose_o: '#a8746f', rose: '#d9a291', rose_l: '#efc4b0',
  pierre_o: '#9c9284', pierre: '#cbbd9f', pierre_l: '#e2d6bb',
  brique_o: '#8f3a34', brique: '#c15f4a', brique_l: '#d97a5f',
  bjaune_o: '#a06a4a', bjaune: '#d39a62', bjaune_l: '#e8b886',
  bnoire_o: '#4a2f2c', bnoire: '#6e4a3a', bnoire_l: '#8a604a',
  beton_o: '#b0a89c', beton: '#e0d7c6', beton_l: '#f1eadb',
  bardage_o: '#8e8a84', bardage: '#c9c5bc', bardage_l: '#e2ded4',
  mortier: '#d8c6a4',
  bois_o: '#4a3424', bois: '#8a5a3a', bois_l: '#d8a878',
  vitre_o: '#243250', vitre: '#4a5a7a', vitre_l: '#8fa7c0',
  metal_o: '#454a59', metal: '#7b8499', metal_l: '#b8c3d9',
  sauge_o: '#3f5a4a', sauge: '#5f7f6a', sauge_l: '#8aa88f',
  bleu_o: '#34465e', bleu: '#4e6a84', bleu_l: '#7d97ad',
  bordeaux_o: '#5a2a2e', bordeaux: '#7a3b3b', bordeaux_l: '#a35a52',
  moutarde_o: '#9a7428', moutarde: '#c99a3a', moutarde_l: '#e6c06a',
  corail_o: '#c25a40', corail: '#f48c5d', corail_l: '#ffb08a',
  tuile_o: '#7a3436', tuile: '#b0503a', tuile_l: '#d4734f',
  tuile2_o: '#5e2e2a', tuile2: '#8c4632', tuile2_l: '#ad6146',
  ardoise_o: '#2e3446', ardoise: '#46506a', ardoise_l: '#6b7690',
  gravier_o: '#7d756b', gravier: '#9a9184', gravier_l: '#b6ad9e',
  feuille_o: '#3d5e3a', feuille: '#5a8a46', feuille_l: '#8fb25a',
  fleur_r: '#d0503e', fleur_j: '#f2c14e', fleur_p: '#e58aa0',
  kraft_o: '#b79f76', kraft: '#d8c49a',
  lumiere: '#ffd98a',
  marque: '#3a6a9a',
} as const;
type PalKey = keyof typeof PALETTE;
const C = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, rgb(v)])) as Record<PalKey, Rgb>;

interface Ramp { o: Rgb; b: Rgb; l: Rgb }
const ramp = (name: string): Ramp => ({
  o: C[`${name}_o` as PalKey] ?? C[name as PalKey],
  b: C[name as PalKey],
  l: C[`${name}_l` as PalKey] ?? C.ivoire,
});

// ---------- Variantes de style ----------

type WallTex = 'crepi' | 'brique' | 'pierre' | 'beton' | 'bardage';
type WinKind = 'classique' | 'haute' | 'large' | 'atelier' | 'loggia' | 'aucune';

export interface FacadeVariant {
  id: string;
  style: FacadeStyle;
  wall: Ramp;
  tex: WallTex;
  trim: Ramp;
  shutter?: Ramp;
  win: WinKind;
  plinth: Ramp;
  door: Ramp;
  band?: Rgb;
  /** Porte particulière (lieux publics, chez soi, zone commerciale). */
  doorKind: 'simple' | 'hyper' | 'quai';
  /** Toit en pente : tuiles rouges, tuiles brunes ou ardoise. */
  roof: 'tuile' | 'tuile2' | 'ardoise';
}

const V = (v: Omit<FacadeVariant, 'doorKind' | 'roof'> & Partial<Pick<FacadeVariant, 'doorKind' | 'roof'>>): FacadeVariant =>
  ({ doorKind: 'simple', roof: 'tuile', ...v });

export const FACADE_VARIANTS: readonly FacadeVariant[] = [
  V({ id: 'brique_a', style: 'brique', wall: ramp('brique'), tex: 'brique', trim: ramp('pierre'), win: 'classique', plinth: ramp('pierre'), door: ramp('sauge'), roof: 'tuile2' }),
  V({ id: 'brique_b', style: 'brique', wall: ramp('brique'), tex: 'brique', trim: ramp('creme'), shutter: ramp('bleu'), win: 'classique', plinth: ramp('bnoire'), door: ramp('bleu'), roof: 'tuile' }),
  V({ id: 'creme_a', style: 'enduit_creme', wall: ramp('creme'), tex: 'crepi', trim: { o: C.creme_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('sauge'), win: 'classique', plinth: ramp('pierre'), door: ramp('bois') }),
  V({ id: 'creme_b', style: 'enduit_creme', wall: ramp('creme'), tex: 'crepi', trim: { o: C.creme_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('bleu'), win: 'classique', plinth: ramp('pierre'), door: ramp('bordeaux') }),
  V({ id: 'creme_c', style: 'enduit_creme', wall: ramp('creme'), tex: 'crepi', trim: ramp('pierre'), shutter: ramp('bois'), win: 'classique', plinth: ramp('gravier'), door: ramp('sauge'), roof: 'tuile2' }),
  V({ id: 'ocre_a', style: 'enduit_ocre', wall: ramp('ocre'), tex: 'crepi', trim: { o: C.ocre_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('bois'), win: 'classique', plinth: ramp('pierre'), door: ramp('sauge') }),
  V({ id: 'ocre_b', style: 'enduit_ocre', wall: ramp('ocre'), tex: 'crepi', trim: { o: C.ocre_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('sauge'), win: 'classique', plinth: ramp('gravier'), door: ramp('bleu'), roof: 'tuile2' }),
  V({ id: 'rose_a', style: 'enduit_rose', wall: ramp('rose'), tex: 'crepi', trim: { o: C.rose_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('bleu'), win: 'classique', plinth: ramp('pierre'), door: ramp('bois') }),
  V({ id: 'rose_b', style: 'enduit_rose', wall: ramp('rose'), tex: 'crepi', trim: { o: C.rose_o, b: C.ivoire, l: C.ivoire }, shutter: ramp('sauge'), win: 'classique', plinth: ramp('pierre'), door: ramp('moutarde') }),
  V({ id: 'pierre_a', style: 'pierre', wall: ramp('pierre'), tex: 'pierre', trim: ramp('pierre'), win: 'haute', plinth: ramp('gravier'), door: ramp('bois'), band: C.pierre_o, roof: 'ardoise' }),
  V({ id: 'pierre_b', style: 'pierre', wall: ramp('pierre'), tex: 'pierre', trim: ramp('pierre'), shutter: ramp('bleu'), win: 'haute', plinth: ramp('gravier'), door: ramp('bleu'), band: C.pierre_o, roof: 'ardoise' }),
  V({ id: 'hlm_a', style: 'hlm', wall: ramp('beton'), tex: 'beton', trim: ramp('beton'), win: 'loggia', plinth: ramp('gravier'), door: ramp('metal'), band: C.corail_o }),
  V({ id: 'hlm_b', style: 'hlm', wall: ramp('beton'), tex: 'beton', trim: ramp('beton'), win: 'loggia', plinth: ramp('gravier'), door: ramp('metal'), band: C.sauge }),
  V({ id: 'ecole', style: 'ecole', wall: ramp('bjaune'), tex: 'brique', trim: ramp('creme'), win: 'large', plinth: ramp('pierre'), door: ramp('bleu'), band: C.creme, roof: 'tuile' }),
  V({ id: 'industriel', style: 'industriel', wall: ramp('bnoire'), tex: 'brique', trim: ramp('metal'), win: 'atelier', plinth: ramp('bnoire'), door: ramp('metal'), doorKind: 'quai' }),
  V({ id: 'civique', style: 'civique', wall: ramp('creme'), tex: 'pierre', trim: ramp('pierre'), win: 'haute', plinth: ramp('pierre'), door: ramp('bois'), band: C.moutarde_o, roof: 'ardoise' }),
  V({ id: 'hyper', style: 'hyper', wall: ramp('bardage'), tex: 'bardage', trim: ramp('metal'), win: 'aucune', plinth: ramp('metal'), door: ramp('metal'), band: C.marque, doorKind: 'hyper' }),
];

const VARIANTS_BY_STYLE = new Map<FacadeStyle, FacadeVariant[]>();
for (const v of FACADE_VARIANTS) {
  const l = VARIANTS_BY_STYLE.get(v.style) ?? [];
  l.push(v);
  VARIANTS_BY_STYLE.set(v.style, l);
}

/** Variante d'un bâtiment : stable, tirée de son identifiant. */
export function variantFor(b: { id: string; style: FacadeStyle }): FacadeVariant {
  const list = VARIANTS_BY_STYLE.get(b.style) ?? FACADE_VARIANTS;
  return list[hashString(b.id) % list.length]!;
}

// ---------- Commerces ----------

export const SHOP_KINDS = ['pain', 'cafe', 'fleurs', 'livres', 'primeur', 'mode', 'atelier', 'generique', 'libre', 'bientot'] as const;
export type ShopKind = typeof SHOP_KINDS[number];

/** Ce que montre la vitrine selon les catégories vendues (la première décide). */
export function shopKindFor(categories: readonly string[] | undefined): ShopKind {
  const c = categories?.[0];
  switch (c) {
    case 'boulangerie': case 'snack': return 'pain';
    case 'cafe': case 'boisson': return 'cafe';
    case 'fleur': return 'fleurs';
    case 'livre': case 'papeterie': return 'livres';
    case 'frais': case 'epicerie': return 'primeur';
    case 'vetement': return 'mode';
    case 'velo': return 'atelier';
    default: return 'generique';
  }
}

const SHOP_PAINT: Record<ShopKind, string> = {
  pain: 'bois', cafe: 'bordeaux', fleurs: 'sauge', livres: 'bleu', primeur: 'sauge',
  mode: 'moutarde', atelier: 'bleu', generique: 'bois', libre: 'pierre', bientot: 'bois',
};
export const AWNING_COLORS = ['corail', 'sauge', 'bleu', 'moutarde', 'bordeaux'] as const;
export type AwningColor = typeof AWNING_COLORS[number];
const SHOP_AWNING: Record<ShopKind, AwningColor> = {
  pain: 'moutarde', cafe: 'bordeaux', fleurs: 'sauge', livres: 'bleu', primeur: 'corail',
  mode: 'corail', atelier: 'bleu', generique: 'corail', libre: 'moutarde', bientot: 'sauge',
};
/** Couleur de store d'un commerce : celle de son métier, ou une teinte stable par local. */
export function awningFor(kind: ShopKind, seed: number): AwningColor {
  if (kind === 'generique' || kind === 'libre' || kind === 'bientot') return AWNING_COLORS[seed % AWNING_COLORS.length]!;
  return SHOP_AWNING[kind];
}

/** Portes particulières (lisibilité des lieux importants). */
export const SPECIAL_DOORS = ['portail', 'maison'] as const;
export type SpecialDoor = typeof SPECIAL_DOORS[number];

// ---------- Atlas ----------

/** Rectangle d'un carreau dans l'atlas, en coordonnées UV (v = 0 en bas). */
export interface AtlasTile { u: number; v: number; du: number; dv: number }

export interface FacadeAtlas {
  width: number;
  height: number;
  /** RGBA, ligne 0 = bas de la texture (prêt pour une DataTexture sans retournement). */
  data: Uint8Array;
  tiles: Record<string, AtlasTile>;
}

interface Item { key: string; w: number; h: number; wrapX: boolean; wrapY: boolean; paint: (b: PixelBuffer) => void }

let cachedAtlas: FacadeAtlas | null = null;

/** Atlas complet (généré une fois, puis gardé en mémoire). */
export function facadeAtlas(): FacadeAtlas {
  if (!cachedAtlas) cachedAtlas = buildFacadeAtlas();
  return cachedAtlas;
}

export function buildFacadeAtlas(): FacadeAtlas {
  const items: Item[] = [];
  for (const v of FACADE_VARIANTS) {
    items.push({ key: `upper:${v.id}`, w: MOD_W * SHEET_COLS, h: FLOOR_PX * UPPER_ROWS, wrapX: true, wrapY: true, paint: (b) => paintUpperSheet(b, v) });
    items.push({ key: `ground:${v.id}`, w: MOD_W * SHEET_COLS, h: GROUND_PX, wrapX: true, wrapY: false, paint: (b) => paintGroundSheet(b, v) });
    items.push({ key: `cornice:${v.id}`, w: MOD_W * SHEET_COLS, h: CORNICE_PX, wrapX: true, wrapY: false, paint: (b) => paintCornice(b, v) });
    items.push({ key: `wall:${v.id}`, w: WALL_W, h: WALL_H, wrapX: true, wrapY: true, paint: (b) => paintWall(b, 0, 0, WALL_W, WALL_H, v) });
    items.push({ key: `door:${v.id}`, w: MOD_W, h: GROUND_PX, wrapX: false, wrapY: false, paint: (b) => paintDoor(b, v, v.doorKind) });
  }
  const civ = FACADE_VARIANTS.find((v) => v.id === 'civique')!;
  const hlm = FACADE_VARIANTS.find((v) => v.id === 'hlm_a')!;
  items.push({ key: 'porte:portail', w: MOD_W, h: GROUND_PX, wrapX: false, wrapY: false, paint: (b) => paintDoor(b, civ, 'portail') });
  items.push({ key: 'porte:maison', w: MOD_W, h: GROUND_PX, wrapX: false, wrapY: false, paint: (b) => paintDoor(b, hlm, 'maison') });
  for (const k of SHOP_KINDS) {
    items.push({ key: `shop:${k}`, w: MOD_W * SHEET_COLS, h: GROUND_PX, wrapX: true, wrapY: false, paint: (b) => paintShopSheet(b, k) });
    items.push({ key: `shopdoor:${k}`, w: MOD_W, h: GROUND_PX, wrapX: false, wrapY: false, paint: (b) => paintShopDoor(b, k) });
  }
  for (const a of AWNING_COLORS) items.push({ key: `awning:${a}`, w: AWNING_W, h: AWNING_H, wrapX: true, wrapY: false, paint: (b) => paintAwning(b, a) });
  for (const r of ['tuile', 'tuile2', 'ardoise'] as const) {
    items.push({ key: `roof:${r}`, w: ROOF_PX, h: ROOF_PX, wrapX: true, wrapY: true, paint: (b) => paintRoof(b, r) });
    items.push({ key: `ridge:${r}`, w: ROOF_PX, h: 8, wrapX: true, wrapY: false, paint: (b) => paintRidge(b, r) });
  }
  items.push({ key: 'flat', w: ROOF_PX, h: ROOF_PX, wrapX: true, wrapY: true, paint: paintFlatRoof });
  items.push({ key: 'shed', w: ROOF_PX, h: ROOF_PX, wrapX: true, wrapY: true, paint: paintShedRoof });
  items.push({ key: 'glass', w: ROOF_PX, h: ROOF_PX, wrapX: true, wrapY: true, paint: paintGlassRoof });

  // Rangement en étagères (ordre stable : hauteur décroissante, puis clé).
  const order = items.slice().sort((a, b) => b.h - a.h || a.key.localeCompare(b.key));
  const placed: { item: Item; x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const it of order) {
    const w = it.w + 2 * GUTTER;
    const h = it.h + 2 * GUTTER;
    if (x + w > ATLAS_W) { x = 0; y += shelf; shelf = 0; }
    placed.push({ item: it, x, y });
    x += w;
    shelf = Math.max(shelf, h);
  }
  const height = Math.ceil((y + shelf) / 64) * 64;
  const atlas = new PixelBuffer(ATLAS_W, height);
  const tiles: Record<string, AtlasTile> = {};
  for (const { item, x: px, y: py } of placed) {
    const tile = new PixelBuffer(item.w, item.h);
    item.paint(tile);
    // Carreau + marges recopiées (en boucle si le carreau se répète, sinon bord prolongé).
    for (let gy = -GUTTER; gy < item.h + GUTTER; gy++) {
      const sy = item.wrapY ? ((gy % item.h) + item.h) % item.h : Math.max(0, Math.min(item.h - 1, gy));
      atlas.blit(tile, 0, sy, item.w, 1, px + GUTTER, py + GUTTER + gy);
      for (let g = 1; g <= GUTTER; g++) {
        atlas.set32(px + GUTTER - g, py + GUTTER + gy, tile.get32(item.wrapX ? item.w - g : 0, sy));
        atlas.set32(px + GUTTER + item.w - 1 + g, py + GUTTER + gy, tile.get32(item.wrapX ? g - 1 : item.w - 1, sy));
      }
    }
    const top = py + GUTTER;
    tiles[item.key] = { u: (px + GUTTER) / ATLAS_W, v: (height - top - item.h) / height, du: item.w / ATLAS_W, dv: item.h / height };
  }
  return { width: ATLAS_W, height, data: atlas.flipped().data, tiles };
}

// ---------- Matières ----------

const PATTERN_W = MOD_W * SHEET_COLS;
const PATTERN_H = FLOOR_PX * UPPER_ROWS;
const patterns = new Map<string, PixelBuffer>();

/** Matière du mur d'une variante, peinte une fois sur une planche (384 × 204 px) puis répétée. */
function wallPattern(v: FacadeVariant): PixelBuffer {
  let p = patterns.get(v.id);
  if (p) return p;
  p = new PixelBuffer(PATTERN_W, PATTERN_H);
  const W = v.wall;
  const o = pack(W.o);
  const base = pack(W.b);
  const l = pack(W.l);
  const mortar = pack(C.mortier);
  const seed = hashString(v.id);
  for (let y = 0; y < PATTERN_H; y++) {
    for (let x = 0; x < PATTERN_W; x++) {
      let c = base;
      switch (v.tex) {
        case 'crepi': {
          const k = hash2(x, y, seed);
          c = k < 0.08 ? o : k > 0.94 ? l : base;
          break;
        }
        case 'beton': {
          const k = hash2(x, y, seed);
          c = k < 0.05 ? o : k > 0.96 ? l : base;
          break;
        }
        case 'brique': {
          // Rangs de 3 px (2 de brique, 1 de joint), briques de 8 px décalées d'un rang à l'autre.
          const row = (y / 3) | 0;
          const bx = x + (row % 2) * 4;
          if (y % 3 === 2 || bx % 8 === 7) { c = mortar; break; }
          const k = hash2(bx >> 3, row, seed);
          c = k < 0.18 ? o : k > 0.85 ? l : base;
          break;
        }
        case 'pierre': {
          // Assises de 12 px, blocs de 32 px décalés : joints en ombre froide.
          const row = (y / 12) | 0;
          const bx = x + (row % 2) * 16;
          if (y % 12 === 11 || bx % 32 === 31) { c = o; break; }
          c = hash2((bx >> 5) % (PATTERN_W / 32), row, seed) > 0.8 ? l : hash2(x, y, seed) < 0.04 ? o : base;
          break;
        }
        case 'bardage': {
          const m = x % 8;
          c = m === 0 ? o : m === 1 ? l : base;
          break;
        }
      }
      p.set32(x, y, c);
    }
  }
  patterns.set(v.id, p);
  return p;
}

function paintWall(b: PixelBuffer, x0: number, y0: number, w: number, h: number, v: FacadeVariant): void {
  b.tile(wallPattern(v), x0, y0, w, h);
}

/** Soubassement (pierre ou enduit sombre) au pied d'un rez-de-chaussée. */
function paintPlinth(b: PixelBuffer, x0: number, w: number, top: number, v: FacadeVariant): void {
  const P = v.plinth;
  b.rect(x0, top, w, GROUND_PX - top, P.b);
  b.rect(x0, top, w, 1, P.l);
  b.rect(x0, top + 1, w, 1, P.b);
  b.rect(x0, GROUND_PX - 2, w, 2, P.o);
  for (let x = x0 + 11; x < x0 + w; x += 24) b.rect(x, top + 2, 1, GROUND_PX - top - 4, P.o);
}

// ---------- Fenêtres ----------

interface ModState { shutters: 'ouverts' | 'fermes' | 'aucun'; curtain: number; flowers: boolean; lit: number; linge: boolean; broken: boolean }

function moduleState(v: FacadeVariant, col: number, row: number, ground: boolean): ModState {
  const s = hashString(v.id) + (ground ? 7919 : 0);
  const k = (n: number): number => hash2(col, row, s + n);
  const hasShutter = !!v.shutter;
  return {
    shutters: !hasShutter ? 'aucun' : k(1) < (ground ? 0.45 : 0.22) ? 'fermes' : 'ouverts',
    curtain: Math.floor(k(2) * 4),
    flowers: !ground && k(3) < 0.35,
    lit: k(4) < 0.45 ? 0.75 + k(5) * 0.25 : 0,
    linge: k(6) < 0.4,
    broken: k(7) < 0.5,
  };
}

/** Une fenêtre à deux battants, cadre, appui et volets. (x, y) = coin haut gauche du vitrage. */
function paintWindow(b: PixelBuffer, x: number, y: number, ww: number, wh: number, v: FacadeVariant, st: ModState, opts: { transoms?: number; grille?: boolean } = {}): void {
  const T = v.trim;
  // Encadrement et contour.
  b.rect(x - 3, y - 3, ww + 6, wh + 6, C.contour);
  b.rect(x - 2, y - 2, ww + 4, wh + 4, T.b);
  b.rect(x - 2, y + wh + 1, ww + 4, 1, T.o);
  // Vitrage : reflet du ciel en diagonale, ombre du linteau en haut.
  b.rect(x, y, ww, wh, C.vitre);
  b.rect(x, y, ww, 3, C.vitre_o);
  for (let i = 0; i < wh; i++) {
    const dx = Math.floor(i * 0.6);
    if (dx + 3 < ww) b.rect(x + ww - 4 - dx, y + i, 2, 1, C.vitre_l);
  }
  // Rideaux (0 : aucun, 1 : à gauche, 2 : à droite, 3 : voilage complet).
  const fabric = st.curtain === 3 ? C.ivoire : (st.curtain % 2 ? C.corail_l : C.creme);
  if (st.curtain === 1 || st.curtain === 3) b.rect(x, y + 3, Math.max(4, Math.floor(ww * 0.3)), wh - 3, fabric);
  if (st.curtain === 2 || st.curtain === 3) b.rect(x + ww - Math.max(4, Math.floor(ww * 0.3)), y + 3, Math.max(4, Math.floor(ww * 0.3)), wh - 3, fabric);
  // Lumière la nuit (le rideau tamise).
  if (st.lit > 0) {
    b.glow(x, y, ww, wh, st.lit);
    if (st.curtain) b.glow(x, y + 3, ww, wh - 3, st.lit * 0.75);
  }
  // Meneau et traverses.
  b.rect(x + Math.floor(ww / 2) - 1, y, 2, wh, T.b);
  b.glow(x + Math.floor(ww / 2) - 1, y, 2, wh, 0);
  const n = opts.transoms ?? 2;
  for (let i = 1; i <= n; i++) {
    const ty = y + Math.floor((wh * i) / (n + 1));
    b.rect(x, ty, ww, 1, T.b);
    b.glow(x, ty, ww, 1, 0);
  }
  if (opts.grille) {
    for (let gx = x + 2; gx < x + ww; gx += 5) b.rect(gx, y, 1, wh, C.metal_o);
    b.glow(x, y, ww, wh, 0);
  }
  // Appui saillant et son ombre froide.
  b.rect(x - 5, y + wh + 3, ww + 10, 2, T.l);
  b.rect(x - 5, y + wh + 5, ww + 10, 1, C.contour);
  b.rect(x - 4, y + wh + 6, ww + 8, 1, v.wall.o);
  // Volets battants.
  if (st.shutters !== 'aucun' && v.shutter) {
    const S = v.shutter;
    const sw = Math.floor(ww / 2) + 1;
    const panel = (px: number, py: number, w: number, h: number): void => {
      b.rect(px - 1, py - 1, w + 2, h + 2, C.contour);
      b.rect(px, py, w, h, S.b);
      for (let yy = py + 1; yy < py + h; yy += 3) b.rect(px + 1, yy, w - 2, 1, S.o);
      b.rect(px, py, 1, h, S.l);
      b.glow(px - 1, py - 1, w + 2, h + 2, 0);
    };
    if (st.shutters === 'ouverts') {
      panel(x - 4 - sw, y - 1, sw, wh + 2);
      panel(x + ww + 4, y - 1, sw, wh + 2);
    } else {
      panel(x, y, sw - 1, wh);
      panel(x + ww - sw + 1, y, sw - 1, wh);
    }
  }
  // Jardinière fleurie sur l'appui.
  if (st.flowers) {
    b.rect(x - 3, y + wh - 5, ww + 6, 6, C.contour);
    b.rect(x - 2, y + wh - 4, ww + 4, 4, C.bois);
    b.rect(x - 2, y + wh - 4, ww + 4, 1, C.bois_l);
    for (let fx = x - 1; fx < x + ww + 1; fx += 3) {
      const k = hash2(fx, y, 77);
      b.rect(fx, y + wh - 7, 2, 3, C.feuille);
      b.px(fx, y + wh - 8, k < 0.33 ? C.fleur_r : k < 0.66 ? C.fleur_p : C.fleur_j);
      b.px(fx + 1, y + wh - 7, C.feuille_l);
    }
    b.glow(x - 3, y + wh - 9, ww + 6, 10, 0);
  }
}

function paintUpperModule(b: PixelBuffer, mx: number, my: number, v: FacadeVariant, st: ModState): void {
  paintWall(b, mx, my, MOD_W, FLOOR_PX, v);
  if (v.band) b.rect(mx, my + FLOOR_PX - 3, MOD_W, 3, v.band);
  switch (v.win) {
    case 'classique': {
      // Linteau : briques sur chant ou bandeau d'enduit.
      if (v.tex === 'brique') {
        b.rect(mx + 28, my + 16, 40, 4, v.wall.o);
        for (let x = mx + 29; x < mx + 67; x += 3) b.rect(x, my + 16, 1, 4, C.mortier);
      }
      paintWindow(b, mx + 33, my + 22, 30, 50, v, st);
      break;
    }
    case 'haute': {
      // Clé de linteau et porte-fenêtre à balconnet de fer.
      b.rect(mx + 28, my + 9, 40, 4, v.trim.l);
      b.rect(mx + 45, my + 7, 6, 7, v.trim.l);
      b.rect(mx + 45, my + 13, 6, 1, v.trim.o);
      paintWindow(b, mx + 33, my + 18, 30, 66, v, st, { transoms: 3 });
      b.rect(mx + 28, my + 70, 40, 2, C.contour);
      for (let x = mx + 29; x < mx + 67; x += 3) b.rect(x, my + 72, 1, 12, C.metal_o);
      b.rect(mx + 28, my + 84, 40, 2, C.contour);
      b.glow(mx + 28, my + 70, 40, 16, 0);
      break;
    }
    case 'large': {
      b.rect(mx + 8, my + 10, 80, 4, v.trim.b);
      paintWindow(b, mx + 12, my + 17, 72, 56, { ...v, shutter: undefined }, { ...st, curtain: 0, flowers: false }, { transoms: 1 });
      for (let x = mx + 30; x < mx + 84; x += 18) { b.rect(x, my + 17, 2, 56, v.trim.b); b.glow(x, my + 17, 2, 56, 0); }
      break;
    }
    case 'atelier': {
      // Verrière d'usine : grille d'acier, carreaux cassés.
      const x = mx + 10;
      const y = my + 12;
      b.rect(x - 2, y - 2, 80, 72, C.contour);
      b.rect(x, y, 76, 68, C.vitre);
      for (let gy = 0; gy < 68; gy += 11) {
        for (let gx = 0; gx < 76; gx += 12) {
          const k = hash2(mx + gx, my + gy, hashString(v.id));
          const pw = Math.min(12, 76 - gx);
          const ph = Math.min(11, 68 - gy);
          if (st.broken && k < 0.22) b.rect(x + gx, y + gy, pw, ph, C.contour);
          else if (k > 0.8) b.rect(x + gx, y + gy, pw, ph, C.vitre_l);
        }
      }
      for (let gx = 0; gx <= 76; gx += 12) b.rect(x + gx - 1, y, 2, 68, C.metal_o);
      for (let gy = 0; gy <= 68; gy += 11) b.rect(x, y + gy - 1, 76, 2, C.metal_o);
      b.rect(x - 4, y + 70, 84, 3, v.wall.l);
      if (st.lit > 0.9) b.glow(x, y, 76, 68, 0.35);
      break;
    }
    case 'loggia': {
      // Loggia en retrait, rambarde, bandeau de dalle coloré ; linge qui sèche.
      b.rect(mx + 8, my + 10, 80, 76, C.contour);
      b.rect(mx + 9, my + 11, 78, 74, v.wall.o);
      paintWindow(b, mx + 24, my + 20, 48, 56, { ...v, shutter: undefined }, { ...st, flowers: false }, { transoms: 0 });
      if (st.linge) {
        b.rect(mx + 12, my + 30, 72, 1, C.metal_o);
        const cloth = [C.corail, C.bleu_l, C.ivoire, C.moutarde_l, C.sauge_l];
        for (let i = 0; i < 4; i++) b.rect(mx + 16 + i * 17, my + 31, 7, 9 + (i % 2) * 3, cloth[(i + st.curtain) % cloth.length]!);
        b.glow(mx + 12, my + 30, 72, 14, 0);
      }
      b.rect(mx + 9, my + 62, 78, 2, C.metal);
      for (let x = mx + 11; x < mx + 86; x += 4) b.rect(x, my + 64, 1, 20, C.metal_o);
      b.glow(mx + 9, my + 62, 78, 24, 0);
      b.rect(mx, my + 86, MOD_W, 6, v.band ?? v.wall.o);
      b.rect(mx, my + 92, MOD_W, 1, C.contour);
      break;
    }
    case 'aucune': {
      if (v.band) b.rect(mx, my + 40, MOD_W, 6, v.band);
      break;
    }
  }
}

function paintUpperSheet(b: PixelBuffer, v: FacadeVariant): void {
  for (let row = 0; row < UPPER_ROWS; row++) {
    for (let col = 0; col < SHEET_COLS; col++) paintUpperModule(b, col * MOD_W, row * FLOOR_PX, v, moduleState(v, col, row, false));
  }
}

function paintGroundSheet(b: PixelBuffer, v: FacadeVariant): void {
  for (let col = 0; col < SHEET_COLS; col++) {
    const mx = col * MOD_W;
    const st = moduleState(v, col, 9, true);
    paintWall(b, mx, 0, MOD_W, GROUND_PX, v);
    switch (v.win) {
      case 'aucune': {
        // Rez-de-chaussée vitré de la zone commerciale, sous le bandeau de l'enseigne.
        b.rect(mx, 10, MOD_W, 8, v.band ?? C.marque);
        b.rect(mx, 18, MOD_W, 1, C.contour);
        b.rect(mx, 19, MOD_W, 72, C.vitre);
        for (let i = 0; i < 72; i += 2) b.rect(mx + 70 - Math.floor(i / 3), 19 + i, 3, 2, C.vitre_l);
        b.rect(mx, 19, 2, 72, C.metal_o);
        b.rect(mx + 47, 19, 2, 72, C.metal_o);
        b.glow(mx + 2, 19, 45, 72, 0.9);
        b.glow(mx + 49, 19, 47, 72, 0.9);
        break;
      }
      case 'atelier':
        paintWindow(b, mx + 24, 16, 48, 30, v, { ...st, shutters: 'aucun', curtain: 0, flowers: false, lit: 0 }, { transoms: 1, grille: true });
        break;
      case 'large':
        paintWindow(b, mx + 12, 22, 72, 52, { ...v, shutter: undefined }, { ...st, curtain: 0, flowers: false }, { transoms: 1 });
        break;
      case 'loggia':
        paintWindow(b, mx + 18, 24, 60, 50, { ...v, shutter: undefined }, { ...st, flowers: false }, { transoms: 0 });
        break;
      default:
        paintWindow(b, mx + 33, 28, 30, 46, v, { ...st, flowers: false }, { grille: hash2(col, 3, hashString(v.id)) < 0.4 });
    }
    paintPlinth(b, mx, MOD_W, 91, v);
  }
}

// ---------- Portes ----------

function paintDoor(b: PixelBuffer, v: FacadeVariant, kind: 'simple' | 'hyper' | 'quai' | 'portail' | 'maison'): void {
  paintWall(b, 0, 0, MOD_W, GROUND_PX, v);
  paintPlinth(b, 0, MOD_W, 91, v);
  const D = kind === 'maison' ? ramp('moutarde') : v.door;
  const lamp = (x: number, y: number): void => {
    b.rect(x, y, 5, 7, C.contour);
    b.rect(x + 1, y + 1, 3, 5, C.lumiere);
    b.glow(x + 1, y + 1, 3, 5, 1);
  };
  if (kind === 'hyper') {
    b.rect(10, 12, 76, 8, v.band ?? C.marque);
    b.rect(14, 22, 68, 85, C.contour);
    b.rect(16, 24, 64, 83, C.metal);
    b.rect(18, 26, 29, 81, C.vitre);
    b.rect(49, 26, 29, 81, C.vitre);
    for (let i = 0; i < 70; i += 2) { b.rect(40 - Math.floor(i / 3), 30 + i, 2, 2, C.vitre_l); b.rect(72 - Math.floor(i / 3), 30 + i, 2, 2, C.vitre_l); }
    b.glow(18, 26, 60, 81, 1);
    return;
  }
  if (kind === 'quai') {
    // Porte sectionnelle de quai de chargement.
    b.rect(8, 18, 80, 89, C.contour);
    b.rect(10, 20, 76, 87, C.metal);
    for (let y = 24; y < GROUND_PX; y += 7) { b.rect(10, y, 76, 1, C.metal_o); b.rect(10, y + 1, 76, 1, C.metal_l); }
    b.rect(10, GROUND_PX - 6, 76, 4, C.moutarde);
    lamp(88, 10);
    return;
  }
  if (kind === 'portail') {
    // Grande porte à deux vantaux sous arc, marches de pierre : lieux publics.
    b.rect(18, 14, 60, 93, C.contour);
    b.rect(20, 16, 56, 91, v.trim.l);
    for (let i = 0; i < 6; i++) b.rect(24 + i * 2, 20 - i, 48 - i * 4, 1, v.trim.o);
    b.rect(24, 22, 48, 82, C.bois_o);
    b.rect(25, 23, 22, 80, D.b);
    b.rect(49, 23, 22, 80, D.b);
    for (const x of [27, 51]) {
      b.rect(x, 26, 18, 28, C.vitre);
      b.rect(x + 8, 26, 2, 28, D.o);
      b.glow(x, 26, 18, 28, 0.9);
      b.rect(x, 60, 18, 18, D.o);
      b.rect(x + 1, 61, 16, 16, D.l);
      b.rect(x + 2, 62, 14, 14, D.b);
      b.rect(x, 82, 18, 18, D.o);
      b.rect(x + 2, 84, 14, 14, D.b);
    }
    b.rect(46, 66, 2, 4, C.moutarde_l);
    b.rect(10, 101, 76, 3, v.plinth.l);
    b.rect(6, 104, 84, 3, v.plinth.b);
    lamp(8, 30);
    lamp(83, 30);
    return;
  }
  // Porte d'immeuble ou de maison : imposte vitrée, deux panneaux, poignée, numéro, applique.
  b.rect(25, 20, 46, 87, C.contour);
  b.rect(26, 21, 44, 86, v.trim.b);
  b.rect(29, 24, 38, 9, C.vitre);
  for (let x = 33; x < 67; x += 8) b.rect(x, 24, 1, 9, v.trim.b);
  b.glow(29, 24, 38, 9, 0.8);
  b.rect(29, 34, 38, 70, C.contour);
  b.rect(30, 35, 36, 69, D.b);
  b.rect(30, 35, 1, 69, D.l);
  if (v.win === 'loggia' || kind === 'maison') {
    b.rect(34, 39, 28, 36, C.vitre);
    b.rect(47, 39, 2, 36, D.o);
    b.glow(34, 39, 28, 36, 0.85);
  } else {
    b.rect(34, 39, 28, 30, D.o);
    b.rect(35, 40, 26, 28, D.b);
    b.rect(35, 40, 26, 1, D.l);
  }
  b.rect(34, 74, 28, 26, D.o);
  b.rect(35, 75, 26, 24, D.b);
  b.rect(35, 75, 26, 1, D.l);
  b.rect(60, 70, 3, 3, C.moutarde_l);
  b.rect(26, 104, 44, 3, v.plinth.l);
  b.rect(16, 40, 6, 5, C.bleu);
  b.rect(18, 41, 2, 3, C.ivoire);
  lamp(74, 26);
  if (kind === 'maison') {
    // Chez soi : porte jaune, paillasson, deux pots de fleurs. On la reconnaît de loin.
    b.rect(30, 103, 36, 3, C.corail);
    for (const px of [8, 76]) {
      b.rect(px, 92, 12, 15, C.contour);
      b.rect(px + 1, 93, 10, 13, C.corail_o);
      b.rect(px - 1, 80, 14, 13, C.feuille_o);
      b.rect(px, 79, 12, 11, C.feuille);
      b.px(px + 3, 82, C.fleur_r);
      b.px(px + 8, 84, C.fleur_j);
      b.px(px + 5, 86, C.fleur_p);
      b.px(px + 2, 80, C.feuille_l);
    }
  }
}

// ---------- Commerces ----------

function shopFrame(b: PixelBuffer, x0: number, k: ShopKind): Ramp {
  const P = ramp(SHOP_PAINT[k]);
  b.rect(x0, 0, MOD_W, 1, C.contour);
  b.rect(x0, 1, MOD_W, 2, P.l);
  b.rect(x0, 3, MOD_W, 1, P.o);
  // Bandeau d'enseigne (recouvert par l'enseigne du commerce).
  b.rect(x0, 4, MOD_W, 24, P.b);
  b.rect(x0, 4, MOD_W, 1, P.l);
  b.rect(x0, 27, MOD_W, 1, P.o);
  // Coffre du store.
  b.rect(x0, 28, MOD_W, 1, C.contour);
  b.rect(x0, 29, MOD_W, 4, P.o);
  b.rect(x0, 33, MOD_W, 1, C.contour);
  // Pilastres.
  b.rect(x0, 34, 5, 62, P.b);
  b.rect(x0, 34, 1, 62, P.l);
  b.rect(x0 + 5, 34, 1, 62, C.contour);
  b.rect(x0 + 90, 34, 1, 62, C.contour);
  b.rect(x0 + 91, 34, 5, 62, P.b);
  b.rect(x0 + 95, 34, 1, 62, P.o);
  // Soubassement à panneaux.
  b.rect(x0, 92, MOD_W, 15, P.o);
  b.rect(x0, 92, MOD_W, 1, C.contour);
  for (let x = x0 + 4; x < x0 + MOD_W - 4; x += 30) { b.rect(x, 95, 26, 9, P.b); b.rect(x, 95, 26, 1, P.l); }
  return P;
}

/** Vitrine : verre, reflet, étagère, marchandises selon le métier. */
function paintDisplay(b: PixelBuffer, x: number, y: number, w: number, h: number, k: ShopKind, seed: number): void {
  b.rect(x, y, w, h, C.vitre);
  b.rect(x, y, w, 3, C.vitre_o);
  if (k === 'libre') {
    // Vitrine passée au blanc d'Espagne, affiche « À LOUER ».
    b.rect(x, y, w, h, C.creme);
    for (let i = 0; i < 9; i++) {
      const cx = x + 4 + Math.floor(hash2(i, seed, 3) * (w - 16));
      const cy = y + 4 + Math.floor(hash2(seed, i, 4) * (h - 12));
      b.rect(cx, cy, 10, 2, C.ivoire);
      b.rect(cx + 2, cy + 3, 8, 1, C.creme_o);
    }
    if (seed % 2 === 0) {
      b.rect(x + w / 2 - 12, y + 12, 24, 18, C.contour);
      b.rect(x + w / 2 - 11, y + 13, 22, 16, C.corail);
      b.rect(x + w / 2 - 8, y + 16, 16, 2, C.ivoire);
      b.rect(x + w / 2 - 8, y + 21, 16, 2, C.ivoire);
    }
    return;
  }
  if (k === 'bientot') {
    b.rect(x, y, w, h, C.kraft);
    for (let i = 0; i < w + h; i += 12) for (let t = 0; t < 4; t++) b.rect(x + i - t * 2, y + t * 6, 4, 1, C.kraft_o);
    b.rect(x, y + Math.floor(h / 2), w, 4, C.moutarde);
    b.glow(x, y, w, h, 0.25);
    return;
  }
  for (let i = 0; i < h; i += 2) {
    const dx = Math.floor(i * 0.5);
    if (dx + 6 < w) b.rect(x + w - 10 - dx, y + i, 3, 2, C.vitre_l);
  }
  // Étagère du bas.
  b.rect(x, y + h - 7, w, 7, C.bois);
  b.rect(x, y + h - 7, w, 1, C.bois_l);
  const shelfY = y + h - 7;
  const r = (n: number, i: number): number => hash2(i, seed, n);
  switch (k) {
    case 'pain':
      for (let i = 0; i < 6; i++) {
        const bx = x + 4 + i * Math.floor((w - 8) / 6);
        b.rect(bx, shelfY - 5, 10, 5, C.bois_o);
        b.rect(bx + 1, shelfY - 4, 8, 3, i % 2 ? C.moutarde : C.bois_l);
        b.rect(bx + 2, shelfY - 4, 1, 1, C.ivoire);
      }
      for (let i = 0; i < 5; i++) {
        const bx = x + 6 + i * Math.floor((w - 12) / 5);
        b.rect(bx, y + 10, 3, 20, C.moutarde_o);
        b.rect(bx + 1, y + 10, 1, 20, C.moutarde_l);
      }
      break;
    case 'cafe':
      // Brise-bise sur tringle de laiton, tasses sur l'étagère.
      b.rect(x, y + Math.floor(h / 2), w, 1, C.moutarde_l);
      b.rect(x, y + Math.floor(h / 2) + 1, w, Math.ceil(h / 2) - 8, C.ivoire);
      for (let cx = x + 2; cx < x + w; cx += 6) b.rect(cx, y + Math.floor(h / 2) + 1, 1, Math.ceil(h / 2) - 8, C.creme);
      for (let i = 0; i < 4; i++) {
        const cx = x + 8 + i * Math.floor((w - 16) / 4);
        b.rect(cx, y + 14, 6, 5, C.ivoire);
        b.rect(cx + 6, y + 15, 2, 2, C.ivoire);
      }
      break;
    case 'fleurs':
      for (let i = 0; i < 9; i++) {
        const fx = x + 3 + i * Math.floor((w - 6) / 9);
        const hh = 8 + Math.floor(r(1, i) * 14);
        b.rect(fx, shelfY - 6, 7, 6, C.corail_o);
        b.rect(fx + 1, shelfY - 6 - hh, 5, hh, C.feuille);
        b.rect(fx + 2, shelfY - 6 - hh, 1, hh, C.feuille_l);
        const fc = [C.fleur_r, C.fleur_j, C.fleur_p, C.ivoire][Math.floor(r(2, i) * 4)]!;
        b.rect(fx, shelfY - 8 - hh, 7, 4, fc);
      }
      break;
    case 'livres': {
      const spines = [C.bordeaux, C.bleu, C.sauge, C.moutarde, C.ivoire, C.corail_o];
      for (const sy of [y + 8, y + 26, shelfY - 14]) {
        b.rect(x, sy + 13, w, 2, C.bois);
        for (let bx = x + 2; bx < x + w - 2; bx += 3) b.rect(bx, sy + 2 + Math.floor(r(3, bx) * 4), 2, 11 - Math.floor(r(3, bx) * 4), spines[Math.floor(r(4, bx) * spines.length)]!);
      }
      break;
    }
    case 'primeur':
      for (let i = 0; i < 4; i++) {
        const cx = x + 2 + i * Math.floor((w - 4) / 4);
        const cw = Math.floor((w - 4) / 4) - 2;
        b.rect(cx, shelfY - 9, cw, 9, C.bois_o);
        b.rect(cx + 1, shelfY - 8, cw - 2, 3, C.bois_l);
        const fruit = [C.fleur_r, C.corail, C.feuille_l, C.moutarde_l][i % 4]!;
        for (let fx = cx + 1; fx < cx + cw - 1; fx += 3) b.rect(fx, shelfY - 11 - (fx % 2), 2, 2, fruit);
      }
      break;
    case 'mode':
      b.rect(x + 4, y + 8, w - 8, 1, C.metal_o);
      for (let i = 0; i < 5; i++) {
        const cx = x + 7 + i * Math.floor((w - 14) / 5);
        const cc = [C.corail, C.bleu, C.moutarde, C.sauge_l, C.bordeaux_l][(i + seed) % 5]!;
        b.rect(cx + 3, y + 9, 1, 2, C.metal_o);
        b.rect(cx, y + 11, 8, 18, cc);
        b.rect(cx, y + 11, 8, 1, C.contour);
      }
      b.rect(x + w - 16, y + 30, 8, 4, C.creme);
      b.rect(x + w - 18, y + 34, 12, 14, C.creme_o);
      break;
    case 'atelier':
      // Panneau à outils et vélo en vitrine.
      b.rect(x + 4, y + 6, w - 8, 18, C.kraft_o);
      for (let i = 0; i < 6; i++) b.rect(x + 8 + i * Math.floor((w - 16) / 6), y + 9, 2, 10, C.metal_o);
      for (const wx of [x + 12, x + 34]) {
        b.frame(wx, shelfY - 18, 14, 14, C.contour);
        b.px(wx + 7, shelfY - 11, C.metal);
      }
      b.rect(x + 19, shelfY - 13, 22, 2, C.corail_o);
      break;
    case 'generique':
      for (const sy of [y + 18, shelfY - 12]) {
        b.rect(x, sy + 10, w, 2, C.bois);
        for (let bx = x + 3; bx < x + w - 6; bx += 8) {
          const cc = [C.corail, C.bleu_l, C.moutarde_l, C.sauge_l, C.ivoire, C.bordeaux_l][Math.floor(r(5, bx + sy) * 6)]!;
          b.rect(bx, sy + 2, 6, 8, cc);
          b.rect(bx, sy + 2, 6, 1, C.contour);
        }
      }
      break;
  }
  b.glow(x, y, w, h, 0.95);
}

function paintShopSheet(b: PixelBuffer, k: ShopKind): void {
  for (let col = 0; col < SHEET_COLS; col++) {
    const x0 = col * MOD_W;
    shopFrame(b, x0, k);
    paintDisplay(b, x0 + 6, 34, 84, 58, k, col + 1);
  }
}

function paintShopDoor(b: PixelBuffer, k: ShopKind): void {
  const P = shopFrame(b, 0, k);
  if (k === 'libre') {
    // Rideau métallique baissé.
    b.rect(6, 34, 84, 73, C.metal);
    for (let y = 36; y < GROUND_PX; y += 3) b.rect(6, y, 84, 1, C.metal_o);
    b.rect(44, 98, 8, 6, C.contour);
    b.rect(45, 99, 6, 4, C.moutarde_o);
    return;
  }
  paintDisplay(b, 6, 34, 18, 58, k, 9);
  paintDisplay(b, 72, 34, 18, 58, k, 11);
  b.rect(24, 34, 48, 73, C.contour);
  b.rect(26, 35, 44, 72, P.b);
  b.rect(30, 39, 36, 50, C.vitre);
  for (let i = 0; i < 50; i += 2) b.rect(58 - Math.floor(i / 3), 39 + i, 2, 2, C.vitre_l);
  b.glow(30, 39, 36, 50, k === 'bientot' ? 0.2 : 0.9);
  b.rect(30, 92, 36, 12, P.o);
  b.rect(62, 70, 2, 6, C.moutarde_l);
  b.rect(22, GROUND_PX - 3, 52, 3, C.pierre_l);
}

function paintAwning(b: PixelBuffer, color: AwningColor): void {
  const S = ramp(color);
  for (let x = 0; x < AWNING_W; x++) {
    const stripe = Math.floor(x / 16) % 2 === 0;
    for (let y = 0; y < AWNING_H; y++) {
      // Lumière chaude en haut du store, ombre froide vers le bas ; festons au bord.
      let c: Rgb = stripe ? S.b : C.ivoire;
      if (y < 3) c = stripe ? S.l : C.ivoire;
      else if (y > 30) c = stripe ? S.o : C.creme;
      if (y >= 38) {
        const local = x % 16;
        const inset = y >= 46 ? 6 : y >= 44 ? 4 : y >= 42 ? 2 : 0;
        if (local < inset || local >= 16 - inset) c = C.contour;
        else if (y === 38) c = C.contour;
      }
      b.px(x, y, c);
    }
  }
  b.rect(0, 0, AWNING_W, 1, C.contour);
}

// ---------- Corniches et toits ----------

function paintCornice(b: PixelBuffer, v: FacadeVariant): void {
  const w = MOD_W * SHEET_COLS;
  paintWall(b, 0, 0, w, CORNICE_PX, v);
  if (v.style === 'hyper') {
    b.rect(0, 0, w, 3, C.metal_l);
    b.rect(0, 3, w, 1, C.metal_o);
    b.rect(0, 4, w, 8, v.band ?? C.marque);
    b.rect(0, 12, w, 1, C.contour);
    return;
  }
  const T = v.tex === 'brique' ? v.wall : v.trim;
  b.rect(0, 0, w, 3, T.l);
  b.rect(0, 3, w, 1, C.contour);
  b.rect(0, 4, w, 6, T.b);
  if (v.style !== 'hlm') for (let x = 2; x < w; x += 8) b.rect(x, 7, 4, 3, T.o);
  else b.rect(0, 6, w, 3, v.band ?? T.o);
  b.rect(0, 10, w, 1, T.o);
  b.rect(0, 11, w, 1, C.contour);
  b.rect(0, 12, w, 2, v.wall.o);
}

function paintRoof(b: PixelBuffer, kind: 'tuile' | 'tuile2' | 'ardoise'): void {
  const R = ramp(kind);
  const seed = hashString(kind);
  const rowH = kind === 'ardoise' ? 6 : 8;
  const colW = kind === 'ardoise' ? 10 : 8;
  // Rangs de tuiles : la ligne 0 est le faîtage (haut), le bas de la texture est l'égout.
  for (let y = 0; y < ROOF_PX; y++) {
    const row = Math.floor(y / rowH);
    const ly = y % rowH;
    for (let x = 0; x < ROOF_PX; x++) {
      const bx = (x + (row % 2) * Math.floor(colW / 2)) % ROOF_PX;
      const lx = bx % colW;
      const k = hash2(Math.floor(bx / colW), row, seed);
      let c: Rgb = k < 0.15 ? R.o : k > 0.88 ? R.l : R.b;
      if (ly >= rowH - 2) c = R.o;
      else if (ly === 0 && lx < colW - 2) c = R.l;
      if (lx === colW - 1) c = kind === 'ardoise' ? C.contour : R.o;
      if (ly === rowH - 1) c = C.contour;
      if (kind !== 'ardoise' && k > 0.97 && ly > 1 && ly < rowH - 2) c = C.feuille_o; // mousse
      b.px(x, y, c);
    }
  }
}

function paintRidge(b: PixelBuffer, kind: 'tuile' | 'tuile2' | 'ardoise'): void {
  const R = kind === 'ardoise' ? ramp('metal') : ramp(kind);
  for (let x = 0; x < ROOF_PX; x++) {
    const lx = x % 16;
    for (let y = 0; y < 8; y++) {
      let c: Rgb = y < 2 ? R.l : y > 5 ? R.o : R.b;
      if (lx === 15 || y === 7) c = C.contour;
      b.px(x, y, c);
    }
  }
}

function paintFlatRoof(b: PixelBuffer): void {
  b.rect(0, 0, ROOF_PX, ROOF_PX, C.gravier);
  for (let y = 0; y < ROOF_PX; y++) {
    for (let x = 0; x < ROOF_PX; x++) {
      const k = hash2(x, y, 4242);
      if (k < 0.12) b.px(x, y, C.gravier_o);
      else if (k > 0.9) b.px(x, y, C.gravier_l);
    }
  }
  b.rect(0, 63, ROOF_PX, 1, C.gravier_o);
  b.rect(63, 0, 1, ROOF_PX, C.gravier_o);
}

function paintShedRoof(b: PixelBuffer): void {
  for (let x = 0; x < ROOF_PX; x++) {
    const m = x % 8;
    b.rect(x, 0, 1, ROOF_PX, m === 0 ? C.metal_o : m < 3 ? C.metal_l : C.metal);
  }
  for (let y = 0; y < ROOF_PX; y += 32) b.rect(0, y, ROOF_PX, 1, C.metal_o);
}

function paintGlassRoof(b: PixelBuffer): void {
  b.rect(0, 0, ROOF_PX, ROOF_PX, C.vitre);
  for (let y = 0; y < ROOF_PX; y++) for (let x = 0; x < ROOF_PX; x++) if ((x + y) % 32 < 3) b.px(x, y, C.vitre_l);
  for (let x = 0; x < ROOF_PX; x += 16) b.rect(x, 0, 2, ROOF_PX, C.metal_o);
  for (let y = 0; y < ROOF_PX; y += 32) b.rect(0, y, ROOF_PX, 2, C.metal_o);
}

/** Une travée d'étage seule (texture répétée des immeubles lointains). */
export function moduleBuffer(variantId: string): PixelBuffer {
  const v = FACADE_VARIANTS.find((f) => f.id === variantId) ?? FACADE_VARIANTS[0]!;
  const b = new PixelBuffer(MOD_W, FLOOR_PX);
  paintUpperModule(b, 0, 0, v, moduleState(v, 1, 0, false));
  return b;
}
