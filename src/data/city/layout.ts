/**
 * Val-Ferrand, centre-ville — description de la ville à l'échelle 1 tuile = 1 mètre.
 * Données pures et déterministes (aucun hasard du monde) : rues, îlots, bâtiments, portes,
 * zones et mobilier. src/data/map.ts en dérive la grille de tuiles de la simulation ;
 * src/presentation/city3d/ en dérive la scène 3D. Voir docs/VISION.md §3.3 et §6.
 *
 * Repère : x vers l'est, y vers le sud (comme la grille), origine au nord-ouest.
 */
import type { PlaceId } from '../../core/types';
import type { CityDistrict, CommercialUnitDef } from '../../core/economy_types';

/**
 * Grande carte (2026-10-07) : la ville historique (414 × 266 m, au nord-ouest) est entourée
 * de nouveaux quartiers à l'est et au sud du canal ; 1 562 × 1 154 m au total.
 */
export const CITY_W = 1562;
export const CITY_H = 1154;
export const ROAD_W = 8;
export const SIDEWALK_W = 3;
export const FLOOR_H = 3.2;

export type Face = 'n' | 's' | 'e' | 'w';

export type FacadeStyle =
  | 'brique'       // brique rouge ouvrière
  | 'enduit_creme'
  | 'enduit_ocre'
  | 'enduit_rose'
  | 'pierre'       // pierre de taille, immeubles de rapport
  | 'hlm'          // béton peint des années 1960
  | 'ecole'
  | 'industriel'   // hangars, briques noircies
  | 'civique'      // Maison du Peuple, mairie
  | 'hyper';       // bardage métallique de la zone commerciale

export type RoofKind = 'plat' | 'deux_pans' | 'sheds';

export interface CityDoor {
  x: number;
  y: number;
  /** Façade sur laquelle s'ouvre la porte (vers la rue). */
  face: Face;
  place?: PlaceId;
  unitId?: string;
  /** Porte d'immeuble non interactive (logements). */
  residential?: boolean;
}

export interface CityBuilding {
  id: string;
  x: number;
  y: number;
  w: number;
  d: number;
  floors: number;
  style: FacadeStyle;
  roof: RoofKind;
  /** Façade principale (côté rue). */
  front: Face;
  /** Nom affiché sur l'enseigne ou le fronton. */
  label?: string;
  /** Rez-de-chaussée commercial (vitrine) sur la façade principale. */
  shopfront?: boolean;
  place?: PlaceId;
  unitId?: string;
  doors: CityDoor[];
  /** Variation de teinte stable (0-1), pour éviter les clones. */
  tint: number;
  /** Bâtiment en ruine (friche) : toit percé, vitres brisées. */
  ruined?: boolean;
}

export type ZoneKind = 'herbe' | 'terre' | 'pave' | 'parking' | 'eau' | 'cour' | 'aire_jeux' | 'gravier';

export interface CityZone {
  kind: ZoneKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Une zone franchissable (sinon : cour fermée, bassin…). */
  walkable: boolean;
}

export type CityPropKind =
  | 'arbre' | 'lampadaire' | 'banc' | 'fontaine' | 'jardiniere' | 'arret_bus' | 'poubelle'
  | 'cheminee' | 'etal' | 'jeux' | 'feu' | 'kiosque' | 'grue' | 'bollard' | 'velo'
  // Terrains de la grande carte (2026-10-07) : parkings, cours d'entrepôts, friches, jardins, stade.
  | 'voiture' | 'camion' | 'conteneur' | 'palettes' | 'gravats' | 'buisson' | 'haie' | 'but' | 'terrain_foot';

export interface CityProp {
  kind: CityPropKind;
  x: number;
  y: number;
  /** Les petits objets (bollards, vélos) ne bloquent pas le passage. */
  blocks: boolean;
  /** Grands objets : emprise en tuiles à partir de (x, y) (1 × 1 par défaut). */
  w?: number;
  h?: number;
  /** Centre exact (mètres) et cap (radians ; 0 = grand axe nord-sud) pour le rendu. */
  cx?: number;
  cy?: number;
  ry?: number;
  /** Variante de rendu : 'ambulance', 'rouille' (épave), 'empile' (conteneurs sur deux niveaux). */
  variant?: string;
}

export interface CityRoad {
  id: string;
  name: string;
  axis: 'h' | 'v';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CityBlock {
  id: string;
  name: string;
  district: CityDistrict;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CityLayout {
  roads: CityRoad[];
  blocks: CityBlock[];
  buildings: CityBuilding[];
  zones: CityZone[];
  props: CityProp[];
  units: CommercialUnitDef[];
  /** Tuile franchissable devant l'entrée de chaque lieu : ancre des PNJ et du joueur. */
  anchors: Record<PlaceId, { x: number; y: number }>;
  /** Domicile de chaque habitant nommé (trottoir devant sa porte d'immeuble). */
  npcHomes: Record<string, { x: number; y: number }>;
  /** Passages piétons (rendu + ralentissement des voitures). */
  crossings: { x: number; y: number; w: number; h: number }[];
  canal: { x: number; y: number; w: number; h: number };
  /** Ponts : chaussée au-dessus du canal (grande carte). */
  bridges: { x: number; y: number; w: number; h: number }[];
}

// ---------- Trame ----------

const VX = [0, 82, 164, 246, 322, 406] as const;
const HY = [0, 80, 160, 242] as const;
const V_NAMES = ['Rue des Houillères', 'Rue Ambroise-Croizat', 'Rue de la Verrerie', 'Rue Louise-Michel', "Boulevard de l'Est", 'Rue du Laminoir'];
const H_NAMES = ['Rue de la Mine', 'Avenue Jean-Jaurès', 'Rue des Forges', 'Quai de la Malterie'];
const ROAD_BOTTOM = HY[3] + ROAD_W; // 250

// Grande carte : rues de l'est (prolongent la trame) et du sud (au-delà du canal).
const EAST_VX = [488, 570, 652, 734, 816, 898, 980, 1062, 1144, 1226, 1308, 1390, 1472, 1554] as const;
const EAST_V_NAMES = [
  'Rue de la Gare', 'Avenue des Grossistes', 'Rue Henri-Barbusse', 'Rue des Entrepôts', 'Boulevard Taret', 'Rue de la Coulée',
  'Rue des Fondeurs', 'Rue du Haut-Fourneau', 'Chemin des Collines', 'Rue de Bellevue', 'Rue des Vergers', 'Allée des Hauts-Tilleuls',
  'Rue du Belvédère', 'Route de Néo-Baie',
];
const ALL_VX: readonly number[] = [...VX, ...EAST_VX];
const ALL_V_NAMES: readonly string[] = [...V_NAMES, ...EAST_V_NAMES];
const SOUTH_HY = [266, 346, 426, 506, 586, 666, 746, 826, 906, 986, 1066, 1146] as const;
const SOUTH_H_NAMES = [
  'Quai Sud de la Malterie', 'Rue de la Brasserie', 'Avenue Salvador-Allende', 'Rue Ambroise-Paré', 'Rue des Écluses',
  'Boulevard du Grand Ensemble', 'Rue Pierre-Mendès-France', 'Avenue de l’Hôpital', 'Rue du Lycée', 'Rue des Glycines',
  'Chemin du Cimetière', 'Route du Plateau Blanc',
];
/** Colonnes de rues qui franchissent le canal par un pont. */
const BRIDGE_COLS = [0, 2, 4, 6, 9, 12, 15, 19];

/**
 * Quartiers de la grande carte : chacun s'ouvre à un palier de l'Ascension.
 * Les limites passent derrière les trottoirs (rue + 11 m) et au bord nord du canal : une rue
 * appartient entière à un quartier, et seules les entrées (rues, ponts) reçoivent une barrière.
 */
export interface CityArea {
  id: string;
  name: string;
  district: CityDistrict;
  tier: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pourquoi c'est encore fermé (panneau de chantier). */
  lock: string;
}

export const CITY_AREAS: readonly CityArea[] = [
  { id: 'centre', name: 'Centre de Val-Ferrand', district: 'centre', tier: 1, x: 0, y: 0, w: 417, h: 253, lock: '' },
  { id: 'gare_est', name: 'Gare Est', district: 'gare', tier: 2, x: 417, y: 0, w: 164, h: 253, lock: 'Rénovation du quartier de la gare : ouverture prochaine.' },
  { id: 'hyperval', name: 'Zone HyperVal', district: 'hyperval', tier: 3, x: 581, y: 0, w: 246, h: 253, lock: 'Zone commerciale réservée aux professionnels : carte de grossiste exigée.' },
  { id: 'industrie', name: 'Zone industrielle du Taret', district: 'industrie', tier: 4, x: 827, y: 0, w: 328, h: 253, lock: 'Site industriel : accès réservé aux entreprises partenaires.' },
  { id: 'collines', name: 'Les Hauts du Taret', district: 'collines', tier: 3, x: 1155, y: 0, w: 407, h: 253, lock: 'Lotissement privé : on n’y entre qu’invité·e.' },
  { id: 'berges', name: 'Berges de la Malterie', district: 'berges', tier: 2, x: 0, y: 253, w: 581, h: 264, lock: 'Pont en travaux depuis la crue de 2019.' },
  { id: 'faubourg', name: 'Faubourg Saint-Éloi', district: 'faubourg', tier: 3, x: 581, y: 253, w: 981, h: 264, lock: 'Quartier en travaux : le tram n’y passe pas encore.' },
  { id: 'grand_ensemble', name: 'Grand Ensemble des Roses Sud', district: 'grand_ensemble', tier: 2, x: 0, y: 517, w: 827, h: 320, lock: 'Réhabilitation des barres : chantier en cours.' },
  { id: 'friche_sud', name: 'Friche Taret Sud', district: 'friche_sud', tier: 4, x: 827, y: 517, w: 735, h: 320, lock: 'Site Taret-Acier : dépollution en cours depuis 2014.' },
  { id: 'bellevue', name: 'Bellevue', district: 'bellevue', tier: 3, x: 0, y: 837, w: 1562, h: 317, lock: 'Quartier résidentiel éloigné : il faudra le bus ou le vélo… et une raison d’y aller.' },
];

/** Quartier d'une tuile (le centre par défaut). */
export function areaAt(x: number, y: number): CityArea {
  return CITY_AREAS.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) ?? CITY_AREAS[0]!;
}

/** Hachage entier stable (aucun PRNG du monde n'est consommé). */
function hash(a: number, b: number, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function streetTraffic(street: string): number {
  if (street === 'Avenue Jean-Jaurès') return 140;
  if (street === 'Place du Marché') return 110;
  if (street === 'Rue de la Verrerie' || street === 'Rue des Forges') return 70;
  if (street === 'Quai de la Malterie') return 55;
  if (street === 'Avenue Salvador-Allende' || street === 'Avenue de l’Hôpital') return 90;
  if (street === 'Avenue des Grossistes' || street === 'Boulevard Taret' || street === 'Rue de la Gare') return 65;
  return 40;
}

// ---------- Construction ----------

export function buildCityLayout(): CityLayout {
  const roads: CityRoad[] = [];
  const blocks: CityBlock[] = [];
  const buildings: CityBuilding[] = [];
  const zones: CityZone[] = [];
  const props: CityProp[] = [];
  const units: CommercialUnitDef[] = [];
  const crossings: CityLayout['crossings'] = [];
  const bridges: CityLayout['bridges'] = [];
  const anchors: Partial<Record<PlaceId, { x: number; y: number }>> = {};

  VX.forEach((x, i) => roads.push({ id: `v${i}`, name: V_NAMES[i]!, axis: 'v', x, y: 0, w: ROAD_W, h: ROAD_BOTTOM }));
  HY.forEach((y, i) => roads.push({ id: `h${i}`, name: H_NAMES[i]!, axis: 'h', x: 0, y, w: CITY_W, h: ROAD_W }));

  // Passages piétons à chaque carrefour (sur les quatre branches).
  for (const vx of VX) {
    for (const hy of HY) {
      if (hy - 3 >= 0) crossings.push({ x: vx, y: hy - 3, w: ROAD_W, h: 3 });
      if (hy + ROAD_W + 3 <= ROAD_BOTTOM) crossings.push({ x: vx, y: hy + ROAD_W, w: ROAD_W, h: 3 });
      if (vx - 3 >= 0) crossings.push({ x: vx - 3, y: hy, w: 3, h: ROAD_W });
      if (vx + ROAD_W + 3 <= CITY_W) crossings.push({ x: vx + ROAD_W, y: hy, w: 3, h: ROAD_W });
    }
  }

  const BLOCK_DEFS: { name: string; district: CityDistrict }[][] = [
    [
      { name: 'Îlot du Collège', district: 'centre' },
      { name: 'Îlot Bertin', district: 'centre' },
      { name: 'Îlot de la Maison du Peuple', district: 'centre' },
      { name: 'Îlot des Tilleuls', district: 'gare' },
    ],
    [
      { name: 'Cité des Roses', district: 'roses' },
      { name: 'Place du Marché', district: 'centre' },
      { name: 'Îlot Jaurès', district: 'centre' },
      { name: 'Îlot des Verriers', district: 'gare' },
    ],
    [
      { name: 'Friche Taret — Ouest', district: 'friche' },
      { name: 'Friche Taret — Halles', district: 'friche' },
      { name: 'Parc des Roses', district: 'canal' },
      { name: 'Zone HyperVal', district: 'hyperval' },
    ],
  ];
  const EAST_DEFS: { name: string; district: CityDistrict }[] = [
    { name: 'Parvis de la Gare', district: 'gare' },
    { name: 'Laminoir Taret', district: 'gare' },
    { name: 'Cité ouvrière du Laminoir', district: 'gare' },
  ];
  const blockAt = (row: number, col: number): CityBlock => {
    const x = VX[col]! + ROAD_W;
    const y = HY[row]! + ROAD_W;
    const w = VX[col + 1]! - x;
    const h = HY[row + 1]! - y;
    const def = col < 4 ? BLOCK_DEFS[row]![col]! : EAST_DEFS[row]!;
    return { id: `b${row}${col}`, name: def.name, district: def.district, x, y, w, h };
  };
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) blocks.push(blockAt(r, c));
  const B = (r: number, c: number): CityBlock => blocks[r * 4 + c]!;

  // Nom de la rue qui borde un îlot sur une face donnée.
  const streetOf = (b: CityBlock, face: Face): string => {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const road = roads.find((r) => {
      if (face === 'n') return r.axis === 'h' && r.y + ROAD_W === b.y && cx >= r.x && cx < r.x + r.w;
      if (face === 's') return r.axis === 'h' && r.y === b.y + b.h && cx >= r.x && cx < r.x + r.w;
      if (face === 'w') return r.axis === 'v' && r.x + ROAD_W === b.x && cy >= r.y && cy < r.y + r.h;
      return r.axis === 'v' && r.x === b.x + b.w && cy >= r.y && cy < r.y + r.h;
    });
    return road?.name ?? 'Rue sans nom';
  };

  let unitCounter = 0;
  let unitPrefix = 'local';
  const addUnit = (b: CityBlock, building: CityBuilding, door: CityDoor, street: string): void => {
    unitCounter += 1;
    const id = `${unitPrefix}_${String(unitCounter).padStart(2, '0')}`;
    const num = 2 * Math.round((face(door) === 'n' || face(door) === 's' ? door.x : door.y) / 6) + (door.face === 's' || door.face === 'e' ? 1 : 0);
    const sizeM2 = building.w * building.d;
    const traffic = streetTraffic(street);
    units.push({
      id,
      address: `${num} ${street}`,
      street,
      district: b.district,
      sizeM2,
      baseRentPerDay: Math.round(sizeM2 * 0.32 * (0.6 + traffic / 200) * 100) / 100,
      footTraffic: traffic,
      door: { x: door.x, y: door.y },
      buildingId: building.id,
    });
    building.unitId = id;
    building.shopfront = true;
    door.unitId = id;
  };
  const face = (d: CityDoor): Face => d.face;

  /**
   * Îlot fermé « à la française » : bandes de bâtiments le long des rues, cour au centre.
   * `shops` liste les faces dont les rez-de-chaussée sont des locaux commerciaux.
   */
  function perimeter(
    b: CityBlock,
    opts: { faces?: Face[]; shops?: Face[]; depth?: number; floors?: [number, number]; styles?: FacadeStyle[]; skip?: (x: number, y: number, w: number, d: number) => boolean },
  ): void {
    const faces = opts.faces ?? ['n', 's', 'e', 'w'];
    const D = opts.depth ?? 12;
    const [fMin, fMax] = opts.floors ?? [3, 5];
    const styles = opts.styles ?? ['brique', 'enduit_creme', 'enduit_ocre', 'pierre', 'enduit_rose'];
    const zx = b.x + SIDEWALK_W;
    const zy = b.y + SIDEWALK_W;
    const zw = b.w - 2 * SIDEWALK_W;
    const zh = b.h - 2 * SIDEWALK_W;
    zones.push({ kind: 'cour', x: zx, y: zy, w: zw, h: zh, walkable: false });

    const strip = (f: Face, sx: number, sy: number, len: number): void => {
      let off = 0;
      let i = 0;
      while (off < len) {
        const remaining = len - off;
        let lw = 9 + Math.floor(hash(b.x + i, b.y + off, f.charCodeAt(0)) * 8);
        if (remaining - lw < 9) lw = remaining;
        const horizontal = f === 'n' || f === 's';
        const x = horizontal ? sx + off : (f === 'w' ? sx : sx);
        const y = horizontal ? sy : sy + off;
        const w = horizontal ? lw : D;
        const d = horizontal ? D : lw;
        off += lw;
        i += 1;
        if (opts.skip?.(x, y, w, d)) continue;
        const h = hash(x, y, 7);
        const building: CityBuilding = {
          id: `bat_${b.id}_${f}${i}`,
          x, y, w, d,
          floors: fMin + Math.floor(h * (fMax - fMin + 1)),
          style: styles[Math.floor(hash(x, y, 3) * styles.length)]!,
          roof: h > 0.7 ? 'deux_pans' : 'plat',
          front: f,
          doors: [],
          tint: hash(x, y, 11),
        };
        const door = doorOn(building, f, 0.5);
        building.doors.push(door);
        if (opts.shops?.includes(f)) addUnit(b, building, door, streetOf(b, f));
        else door.residential = true;
        buildings.push(building);
      }
    };
    if (faces.includes('n')) strip('n', zx, zy, zw);
    if (faces.includes('s')) strip('s', zx, zy + zh - D, zw);
    const innerY = zy + (faces.includes('n') ? D : 0);
    const innerH = zh - (faces.includes('n') ? D : 0) - (faces.includes('s') ? D : 0);
    if (faces.includes('w')) strip('w', zx, innerY, innerH);
    if (faces.includes('e')) strip('e', zx + zw - D, innerY, innerH);
  }

  /** Porte sur la façade `f`, à la fraction `t` de sa longueur ; la tuile est le bord du bâtiment. */
  function doorOn(bd: CityBuilding, f: Face, t: number): CityDoor {
    if (f === 'n') return { x: bd.x + Math.floor(bd.w * t), y: bd.y, face: 'n' };
    if (f === 's') return { x: bd.x + Math.floor(bd.w * t), y: bd.y + bd.d - 1, face: 's' };
    if (f === 'w') return { x: bd.x, y: bd.y + Math.floor(bd.d * t), face: 'w' };
    return { x: bd.x + bd.w - 1, y: bd.y + Math.floor(bd.d * t), face: 'e' };
  }
  /** Tuile de trottoir juste devant une porte. */
  const outside = (d: CityDoor): { x: number; y: number } =>
    d.face === 'n' ? { x: d.x, y: d.y - 1 } : d.face === 's' ? { x: d.x, y: d.y + 1 } : d.face === 'w' ? { x: d.x - 1, y: d.y } : { x: d.x + 1, y: d.y };

  function special(bd: Omit<CityBuilding, 'doors' | 'tint'> & { doorAt?: number; place?: PlaceId }): CityBuilding {
    const b: CityBuilding = { ...bd, doors: [], tint: hash(bd.x, bd.y, 5) };
    const door = doorOn(b, bd.front, bd.doorAt ?? 0.5);
    if (bd.place) {
      door.place = bd.place;
      anchors[bd.place] = outside(door);
    } else {
      door.residential = true;
    }
    b.doors.push(door);
    buildings.push(b);
    return b;
  }

  /** Rangées d'arbres et de lampadaires sur les trottoirs d'un îlot. */
  function streetFurniture(b: CityBlock, faces: Face[] = ['n', 's', 'e', 'w']): void {
    const inset = 1; // milieu du trottoir côté chaussée
    for (const f of faces) {
      const horizontal = f === 'n' || f === 's';
      const len = horizontal ? b.w : b.h;
      for (let o = 6; o < len - 5; o += 12) {
        const x = horizontal ? b.x + o : (f === 'w' ? b.x + inset - 1 : b.x + b.w - inset);
        const y = horizontal ? (f === 'n' ? b.y + inset - 1 : b.y + b.h - inset) : b.y + o;
        const isLamp = Math.floor(o / 12) % 2 === 0;
        props.push({ kind: isLamp ? 'lampadaire' : 'arbre', x, y, blocks: true });
      }
    }
  }

  // ===== Ligne nord =====
  // Collège du Taret : grand bâtiment face à l'avenue, cour et gymnase derrière.
  {
    const b = B(0, 0);
    perimeter(b, { faces: ['n'], styles: ['brique', 'enduit_creme'], floors: [3, 4] });
    special({ id: 'college', x: b.x + 6, y: b.y + b.h - 3 - 22, w: b.w - 12, d: 22, floors: 3, style: 'ecole', roof: 'deux_pans', front: 's', label: 'Collège du Taret', place: 'college' });
    zones.push({ kind: 'pave', x: b.x + 6, y: b.y + 18, w: b.w - 12, h: b.h - 3 - 22 - 18, walkable: false });
    streetFurniture(b);
  }
  // Îlot Bertin : l'épicerie et des locaux sur l'avenue.
  {
    const b = B(0, 1);
    const epX = b.x + 14;
    const epW = 16;
    const D = 12;
    const sy = b.y + b.h - SIDEWALK_W - D;
    perimeter(b, {
      shops: ['s', 'e'],
      skip: (x, y, w, d) => y === sy && x < epX + epW && x + w > epX,
    });
    special({ id: 'epicerie', x: epX, y: sy, w: epW, d: D, floors: 3, style: 'enduit_ocre', roof: 'plat', front: 's', label: 'Épicerie Bertin', place: 'epicerie', shopfront: true });
    streetFurniture(b);
  }
  // Îlot de la Maison du Peuple : bâtiment civique + mairie.
  {
    const b = B(0, 2);
    perimeter(b, { faces: ['n', 'e'], shops: ['e'] });
    special({ id: 'maison_du_peuple', x: b.x + 8, y: b.y + b.h - 3 - 20, w: 34, d: 20, floors: 3, style: 'civique', roof: 'deux_pans', front: 's', label: 'Maison du Peuple' });
    special({ id: 'mairie', x: b.x + 45, y: b.y + b.h - 3 - 16, w: 13, d: 16, floors: 3, style: 'pierre', roof: 'deux_pans', front: 's', label: 'Mairie' });
    zones.push({ kind: 'herbe', x: b.x + 8, y: b.y + 18, w: 56, h: b.h - 3 - 20 - 18, walkable: false });
    streetFurniture(b);
  }
  // Îlot des Tilleuls : immeubles de rapport, commerces sur l'avenue.
  {
    const b = B(0, 3);
    perimeter(b, { shops: ['s', 'w'], styles: ['pierre', 'enduit_creme', 'enduit_rose'], floors: [4, 6] });
    streetFurniture(b);
  }

  // ===== Ligne centrale =====
  // Cité des Roses : barres et tour de 1965, pelouses, aire de jeux. Le joueur habite la barre A.
  {
    const b = B(1, 0);
    zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    special({ id: 'barre_a', x: b.x + 6, y: b.y + 8, w: 60, d: 12, floors: 5, style: 'hlm', roof: 'plat', front: 'n', label: 'Cité des Roses — Bâtiment A', place: 'maison', doorAt: 0.42 });
    special({ id: 'barre_b', x: b.x + 6, y: b.y + 32, w: 12, d: 32, floors: 6, style: 'hlm', roof: 'plat', front: 'e', label: 'Bâtiment B' });
    special({ id: 'tour_c', x: b.x + 46, y: b.y + 34, w: 18, d: 18, floors: 10, style: 'hlm', roof: 'plat', front: 'w', label: 'Tour C' });
    zones.push({ kind: 'aire_jeux', x: b.x + 26, y: b.y + 36, w: 14, h: 12, walkable: true });
    props.push({ kind: 'jeux', x: b.x + 30, y: b.y + 40, blocks: true });
    props.push({ kind: 'jeux', x: b.x + 35, y: b.y + 44, blocks: true });
    for (const [dx, dy] of [[24, 28], [42, 28], [24, 56], [40, 60], [70, 30], [70, 58], [22, 66]] as const) {
      props.push({ kind: 'arbre', x: b.x + dx, y: b.y + dy, blocks: true });
    }
    props.push({ kind: 'banc', x: b.x + 28, y: b.y + 34, blocks: true });
    props.push({ kind: 'banc', x: b.x + 36, y: b.y + 34, blocks: true });
    streetFurniture(b);
  }
  // Place du Marché : grande place pavée, fontaine, kiosque, étals ; commerces au sud.
  {
    const b = B(1, 1);
    const D = 12;
    perimeter(b, { faces: ['s'], shops: ['s'] });
    zones.push({ kind: 'pave', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6 - D, walkable: true });
    const cx = b.x + Math.floor(b.w / 2);
    const cy = b.y + 3 + Math.floor((b.h - 6 - D) / 2);
    props.push({ kind: 'fontaine', x: cx, y: cy, blocks: true });
    props.push({ kind: 'fontaine', x: cx - 1, y: cy, blocks: true });
    props.push({ kind: 'fontaine', x: cx, y: cy - 1, blocks: true });
    props.push({ kind: 'fontaine', x: cx - 1, y: cy - 1, blocks: true });
    // Kiosque du marché : l'entrée du lieu « place ».
    special({ id: 'kiosque_marche', x: cx - 3, y: cy - 16, w: 6, d: 5, floors: 1, style: 'civique', roof: 'deux_pans', front: 's', label: 'Kiosque du marché', place: 'place' });
    // Étals du marché : emplacements loués à la journée (premier pas après le stand).
    // On se tient sur la tuile de l'étal pour vendre ; elle reste donc franchissable.
    for (let i = 0; i < 6; i++) {
      const x = b.x + 12 + i * 9;
      const y = cy + 12;
      props.push({ kind: 'etal', x, y, blocks: false });
      unitCounter += 1;
      units.push({
        id: `etal_${i + 1}`,
        address: `Étal n° ${i + 1}, place du Marché`,
        street: 'Place du Marché',
        district: 'centre',
        sizeM2: 6,
        baseRentPerDay: 4 + (i % 3),
        footTraffic: streetTraffic('Place du Marché'),
        door: { x, y },
        buildingId: `etal_${i + 1}`,
      });
    }
    for (const [dx, dy] of [[8, 8], [b.w - 9, 8], [8, 40], [b.w - 9, 40], [20, 20], [b.w - 21, 20]] as const) {
      props.push({ kind: 'arbre', x: b.x + dx, y: b.y + dy, blocks: true });
    }
    for (const [dx, dy] of [[cx - b.x - 6, cy - b.y + 4], [cx - b.x + 5, cy - b.y + 4], [cx - b.x - 6, cy - b.y - 6], [cx - b.x + 5, cy - b.y - 6]] as const) {
      props.push({ kind: 'banc', x: b.x + dx, y: b.y + dy, blocks: true });
    }
    for (const [dx, dy] of [[14, 14], [b.w - 15, 14], [14, 44], [b.w - 15, 44]] as const) {
      props.push({ kind: 'lampadaire', x: b.x + dx, y: b.y + dy, blocks: true });
    }
    props.push({ kind: 'arret_bus', x: b.x + 30, y: b.y, blocks: true });
  }
  // Îlot Jaurès : le cœur commerçant — locaux à louer sur l'avenue et la rue de la Verrerie.
  {
    const b = B(1, 2);
    perimeter(b, { shops: ['n', 'w', 'e'], floors: [3, 5] });
    streetFurniture(b);
  }
  // Îlot des Verriers.
  {
    const b = B(1, 3);
    perimeter(b, { shops: ['n'], styles: ['brique', 'enduit_ocre', 'pierre'] });
    streetFurniture(b);
  }

  // ===== Ligne sud =====
  // Friche Taret — Ouest : hangars en ruine, cheminée ; l'atelier occupe la halle principale.
  {
    const b = B(2, 0);
    zones.push({ kind: 'terre', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    special({ id: 'atelier_friche', x: b.x + 8, y: b.y + 10, w: 30, d: 20, floors: 2, style: 'industriel', roof: 'sheds', front: 'n', label: 'Atelier de la Friche', place: 'friche' });
    special({ id: 'hangar_ouest', x: b.x + 10, y: b.y + 42, w: 40, d: 22, floors: 3, style: 'industriel', roof: 'sheds', front: 'n', label: 'Halle des laminoirs', ruined: true });
    props.push({ kind: 'cheminee', x: b.x + 60, y: b.y + 20, blocks: true });
    props.push({ kind: 'grue', x: b.x + 58, y: b.y + 50, blocks: true });
    streetFurniture(b, ['n', 'e']);
  }
  // Friche Taret — Halles : grande halle effondrée.
  {
    const b = B(2, 1);
    zones.push({ kind: 'terre', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    special({ id: 'halle_taret', x: b.x + 12, y: b.y + 14, w: 50, d: 30, floors: 4, style: 'industriel', roof: 'sheds', front: 'n', label: 'Taret-Acier — Haut-fourneau n° 2', ruined: true });
    zones.push({ kind: 'gravier', x: b.x + 8, y: b.y + 50, w: 58, h: 18, walkable: true });
    streetFurniture(b, ['n', 'w']);
  }
  // Parc des Roses : pelouses, bassin, allées ; grille d'entrée sur la rue des Forges.
  {
    const b = B(2, 2);
    zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    zones.push({ kind: 'gravier', x: b.x + Math.floor(b.w / 2) - 2, y: b.y + 3, w: 4, h: b.h - 6, walkable: true });
    zones.push({ kind: 'gravier', x: b.x + 3, y: b.y + Math.floor(b.h / 2) - 2, w: b.w - 6, h: 4, walkable: true });
    zones.push({ kind: 'eau', x: b.x + 46, y: b.y + 44, w: 18, h: 14, walkable: false });
    special({ id: 'pavillon_parc', x: b.x + Math.floor(b.w / 2) - 4, y: b.y + 8, w: 8, d: 6, floors: 1, style: 'civique', roof: 'deux_pans', front: 'n', label: 'Parc des Roses', place: 'parc' });
    for (let i = 0; i < 18; i++) {
      const tx = b.x + 6 + Math.floor(hash(i, 3, 9) * (b.w - 12));
      const ty = b.y + 18 + Math.floor(hash(i, 5, 9) * (b.h - 24));
      const inPath = Math.abs(tx - (b.x + b.w / 2)) < 4 || Math.abs(ty - (b.y + b.h / 2)) < 4;
      const inPond = tx >= b.x + 44 && tx < b.x + 66 && ty >= b.y + 42 && ty < b.y + 60;
      if (!inPath && !inPond) props.push({ kind: 'arbre', x: tx, y: ty, blocks: true });
    }
    for (const [dx, dy] of [[30, 30], [44, 30], [30, 52], [20, 40]] as const) {
      props.push({ kind: 'banc', x: b.x + dx, y: b.y + dy, blocks: true });
    }
    streetFurniture(b, ['n', 'w', 'e']);
  }
  // Zone HyperVal : le Drive (rival) et son parking.
  {
    const b = B(2, 3);
    zones.push({ kind: 'parking', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: 30, walkable: true });
    special({ id: 'drive_hyperval', x: b.x + 6, y: b.y + 36, w: b.w - 12, d: 30, floors: 2, style: 'hyper', roof: 'plat', front: 'n', label: 'Drive HyperVal' });
    for (let i = 0; i < 6; i++) props.push({ kind: 'lampadaire', x: b.x + 8 + i * 11, y: b.y + 18, blocks: true });
  }

  // ===== Quartier de la Gare et du laminoir (colonne est, ajoutée en 2026-10-07) =====
  // Construit après les îlots historiques : leurs identifiants (locaux, bâtiments) ne bougent pas.
  unitPrefix = 'gare';
  unitCounter = 0;
  const east = [0, 1, 2].map((r) => blockAt(r, 4));
  blocks.push(...east);
  // Parvis de la Gare : la gare au sud, face à l'avenue ; commerces sur la rue de la Mine.
  {
    const b = east[0]!;
    perimeter(b, { faces: ['n'], shops: ['n'], styles: ['pierre', 'enduit_creme'] });
    zones.push({ kind: 'pave', x: b.x + 3, y: b.y + 18, w: b.w - 6, h: 26, walkable: true });
    special({ id: 'gare', x: b.x + 8, y: b.y + b.h - 3 - 22, w: b.w - 16, d: 22, floors: 2, style: 'civique', roof: 'deux_pans', front: 's', label: 'Gare de Val-Ferrand' });
    props.push({ kind: 'arret_bus', x: b.x + 12, y: b.y + b.h - 1, blocks: true });
    for (const dx of [10, 24, 38, 52, 66]) props.push({ kind: 'lampadaire', x: b.x + dx, y: b.y + 30, blocks: true });
    streetFurniture(b, ['e', 'w']);
  }
  // Laminoir Taret : encore en activité en 2020 (fermeture programmée en 2032, VISION §3.2).
  {
    const b = east[1]!;
    zones.push({ kind: 'gravier', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    special({ id: 'laminoir', x: b.x + 6, y: b.y + 14, w: b.w - 12, d: 40, floors: 4, style: 'industriel', roof: 'sheds', front: 'n', label: 'Taret Laminage' });
    props.push({ kind: 'cheminee', x: b.x + b.w - 8, y: b.y + 60, blocks: true });
    props.push({ kind: 'grue', x: b.x + 10, y: b.y + 62, blocks: true });
    streetFurniture(b, ['n', 'w']);
  }
  // Cité ouvrière du laminoir : maisons de brique, commerces sur la rue des Forges.
  {
    const b = east[2]!;
    perimeter(b, { shops: ['n'], styles: ['brique'], floors: [2, 3] });
    streetFurniture(b);
  }

  // Canal de la Malterie, au sud du quai.
  const canal = { x: 0, y: ROAD_BOTTOM + 3, w: CITY_W, h: 10 };
  zones.push({ kind: 'eau', ...canal, walkable: false });
  zones.push({ kind: 'pave', x: 0, y: ROAD_BOTTOM, w: CITY_W, h: 3, walkable: true });
  for (let x = 6; x < 414; x += 14) props.push({ kind: x % 28 === 6 ? 'lampadaire' : 'banc', x, y: ROAD_BOTTOM + 2, blocks: true });

  // ===== Grande carte (2026-10-07) : l'est au-delà de la Gare, le sud au-delà du canal =====
  // Tout est généré APRÈS la ville historique : ses identifiants et coordonnées ne bougent pas.
  // Les quartiers s'ouvrent avec l'Ascension (CITY_AREAS) ; on les voit dès le début.
  const southBank = { x: 0, y: canal.y + canal.h, w: CITY_W, h: SOUTH_HY[0]! - (canal.y + canal.h) };
  zones.push({ kind: 'pave', ...southBank, walkable: true });
  // Rues de l'est (prolongent la trame nord) et rues du sud (au-delà du quai sud).
  EAST_VX.forEach((x, i) => roads.push({ id: `v${VX.length + i}`, name: EAST_V_NAMES[i]!, axis: 'v', x, y: 0, w: ROAD_W, h: ROAD_BOTTOM }));
  SOUTH_HY.forEach((y, i) => roads.push({ id: `hs${i}`, name: SOUTH_H_NAMES[i]!, axis: 'h', x: 0, y, w: CITY_W, h: ROAD_W }));
  ALL_VX.forEach((x, i) => {
    const bridge = BRIDGE_COLS.includes(i);
    const y0 = bridge ? ROAD_BOTTOM : SOUTH_HY[0]!;
    roads.push({ id: `vs${i}`, name: ALL_V_NAMES[i]!, axis: 'v', x, y: y0, w: ROAD_W, h: CITY_H - y0 });
    if (bridge) bridges.push({ x, y: ROAD_BOTTOM, w: ROAD_W, h: SOUTH_HY[0]! - ROAD_BOTTOM });
  });
  // Passages piétons des nouveaux carrefours.
  const addCrossings = (vxs: readonly number[], hys: readonly number[], yMin: number): void => {
    for (const vx of vxs) {
      for (const hy of hys) {
        if (hy - 3 >= yMin) crossings.push({ x: vx, y: hy - 3, w: ROAD_W, h: 3 });
        if (hy + ROAD_W + 3 <= CITY_H) crossings.push({ x: vx, y: hy + ROAD_W, w: ROAD_W, h: 3 });
        if (vx - 3 >= 0) crossings.push({ x: vx - 3, y: hy, w: 3, h: ROAD_W });
        if (vx + ROAD_W + 3 <= CITY_W) crossings.push({ x: vx + ROAD_W, y: hy, w: 3, h: ROAD_W });
      }
    }
  };
  addCrossings(EAST_VX, HY, 0);
  addCrossings(ALL_VX, SOUTH_HY, SOUTH_HY[0]!);

  // Îlots : nord-est (3 rangées) puis sud (11 rangées), colonne par colonne.
  const areaOfBlock = (x: number, y: number): CityArea => CITY_AREAS.find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h)!;
  const newBlock = (x0: number, x1: number, y0: number, y1: number, id: string): CityBlock => {
    const area = areaOfBlock(x0 + 1, y0 + 1);
    const x = x0 + ROAD_W;
    const y = y0 + ROAD_W;
    return { id, name: `${area.name} ${id.slice(1)}`, district: area.district, x, y, w: x1 - x, h: y1 - y };
  };
  const newBlocks: CityBlock[] = [];
  for (let c = 0; c < EAST_VX.length - 1 + 1; c++) {
    const xa = c === 0 ? VX[VX.length - 1]! : EAST_VX[c - 1]!;
    const xb = EAST_VX[c]!;
    for (let r = 0; r < HY.length - 1; r++) newBlocks.push(newBlock(xa, xb, HY[r]!, HY[r + 1]!, `e${r}${String(c).padStart(2, '0')}`));
  }
  for (let r = 0; r < SOUTH_HY.length - 1; r++) {
    for (let c = 0; c < ALL_VX.length - 1; c++) newBlocks.push(newBlock(ALL_VX[c]!, ALL_VX[c + 1]!, SOUTH_HY[r]!, SOUTH_HY[r + 1]!, `s${String(r).padStart(2, '0')}${String(c).padStart(2, '0')}`));
  }
  blocks.push(...newBlocks);

  /**
   * Grand objet posé au mètre près : `len` le long du cap (`along` = 'z' : nord-sud), `wid` en
   * travers ; l'emprise bloquante couvre les tuiles touchées.
   */
  const bigProp = (kind: CityPropKind, cx: number, cy: number, wid: number, len: number, along: 'x' | 'z', variant?: string): void => {
    const w = along === 'z' ? wid : len;
    const h = along === 'z' ? len : wid;
    const x = Math.floor(cx - w / 2 + 0.01);
    const y = Math.floor(cy - h / 2 + 0.01);
    props.push({ kind, x, y, w: Math.ceil(cx + w / 2 - 0.01) - x, h: Math.ceil(cy + h / 2 - 0.01) - y, cx, cy, ry: along === 'z' ? 0 : Math.PI / 2, blocks: true, variant });
  };
  /** Voitures garées sur un parking (places de 2,5 m, rangées de 4,5 m tous les 10 m) ; une colonne sur cinq reste libre. */
  const parkCars = (zx: number, zy: number, zw: number, zh: number, fill: number, seed: number): void => {
    for (let k = Math.ceil((zx + 1) / 2.5); (k + 1) * 2.5 <= zx + zw - 1; k++) {
      if (k % 5 === 0) continue;
      for (let m = Math.floor(zy / 10); m * 10 < zy + zh; m++) {
        for (const off of [2.25, 7.75]) {
          const cy = m * 10 + off;
          if (cy - 2.2 < zy || cy + 2.2 > zy + zh) continue;
          if (hash(k, m * 2 + (off > 5 ? 1 : 0), seed) < fill) bigProp('voiture', k * 2.5 + 1.25, cy, 2, 4, 'z');
        }
      }
    }
  };

  /** Pavillons avec jardin : maisons individuelles en grille, haie au fond, voiture dans l'allée. */
  const pavillons = (b: CityBlock): void => {
    zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    for (let yy = b.y + 6; yy + 9 < b.y + b.h - 4; yy += 16) {
      for (let xx = b.x + 6; xx + 9 < b.x + b.w - 4; xx += 15) {
        const hh = hash(xx, yy, 21);
        special({ id: `pav_${xx}_${yy}`, x: xx, y: yy, w: 9, d: 8, floors: hh > 0.6 ? 2 : 1, style: hh > 0.5 ? 'enduit_creme' : 'enduit_rose', roof: 'deux_pans', front: 'n' });
        if (hh > 0.4) props.push({ kind: 'arbre', x: xx + 11, y: yy + 3, blocks: true });
        else bigProp('voiture', xx + 11.5, yy + 3, 2, 4, 'z');
        // Haie au fond du jardin (un passage d'un mètre entre deux voisins).
        if (yy + 14 < b.y + b.h - 4) props.push({ kind: 'haie', x: xx - 2, y: yy + 13, w: 13, h: 1, cx: xx + 4.5, cy: yy + 13.5, ry: Math.PI / 2, blocks: true });
        if (hash(xx, yy, 22) > 0.55) props.push({ kind: 'buisson', x: xx - 2, y: yy + 10, blocks: true });
      }
    }
    streetFurniture(b, ['n', 's']);
  };
  /** Grand ensemble : barres et tours sur pelouse, comme la Cité des Roses. */
  const grandEnsemble = (b: CityBlock): void => {
    zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    const tower = hash(b.x, b.y, 31) > 0.5;
    if (tower) {
      special({ id: `tour_${b.id}`, x: b.x + 10, y: b.y + 12, w: 18, d: 18, floors: 9 + Math.floor(hash(b.x, b.y, 32) * 5), style: 'hlm', roof: 'plat', front: 's' });
      special({ id: `barre_${b.id}`, x: b.x + 36, y: b.y + 20, w: Math.min(34, b.w - 42), d: 12, floors: 5, style: 'hlm', roof: 'plat', front: 's' });
    } else {
      special({ id: `barre_${b.id}`, x: b.x + 8, y: b.y + 10, w: b.w - 16, d: 12, floors: 5 + Math.floor(hash(b.x, b.y, 33) * 3), style: 'hlm', roof: 'plat', front: 'n' });
      zones.push({ kind: 'aire_jeux', x: b.x + 12, y: b.y + 32, w: 14, h: 12, walkable: true });
      props.push({ kind: 'jeux', x: b.x + 17, y: b.y + 37, blocks: true });
    }
    for (let i = 0; i < 5; i++) props.push({ kind: 'arbre', x: b.x + 8 + Math.floor(hash(i, b.x, 34) * (b.w - 16)), y: b.y + b.h - 10 - Math.floor(hash(i, b.y, 35) * 8), blocks: true });
    streetFurniture(b);
  };
  /** Entrepôts et ateliers : zone industrielle et Allée des Grossistes. */
  const entrepots = (b: CityBlock, labels?: string[]): void => {
    zones.push({ kind: 'gravier', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    const half = Math.floor((b.w - 14) / 2);
    special({ id: `entrepot_${b.id}_a`, x: b.x + 5, y: b.y + 10, w: half, d: Math.min(34, b.h - 22), floors: 2, style: 'industriel', roof: 'sheds', front: 'n', label: labels?.[0] });
    special({ id: `entrepot_${b.id}_b`, x: b.x + 9 + half, y: b.y + 10, w: half, d: Math.min(34, b.h - 22), floors: 2, style: 'industriel', roof: hash(b.x, b.y, 41) > 0.5 ? 'plat' : 'sheds', front: 'n', label: labels?.[1] });
    const crane = hash(b.x, b.y, 42) > 0.6;
    if (crane) props.push({ kind: 'grue', x: b.x + b.w - 8, y: b.y + b.h - 8, blocks: true });
    // Cour arrière : semi-remorques à quai, conteneurs alignés, palettes devant les portes.
    const y0 = b.y + 10 + Math.min(34, b.h - 22) + 1;
    const y1 = b.y + b.h - 4;
    if (y1 - y0 >= 18) {
      for (const [i, hx] of [b.x + 5 + 4, b.x + 9 + half + 4].entries()) {
        if (hash(b.x, b.y, 43 + i) > 0.35) bigProp('camion', hx + 1.5, y0 + 5.5, 3, 10, 'z');
      }
    }
    if (y1 - y0 >= 6) {
      const cy = y1 - 2;
      const xEnd = crane ? b.x + b.w - 14 : b.x + b.w - 5;
      for (let cx = b.x + 18 + half / 2; cx + 3.2 < xEnd; cx += 7) {
        if (hash(cx, cy, 44) > 0.25) bigProp('conteneur', cx, cy, 2.6, 6.2, 'x', hash(cx, cy, 45) > 0.6 ? 'empile' : undefined);
      }
    }
    for (let i = 0; i < 6; i++) {
      const px = b.x + 6 + Math.floor(hash(i, b.x, 46) * (b.w - 12));
      if (y0 + 1 < y1) props.push({ kind: 'palettes', x: px, y: y0, blocks: true });
    }
    streetFurniture(b, ['n', 'w']);
  };
  /** Grande surface et son parking. */
  const grandeSurface = (b: CityBlock, label: string): void => {
    zones.push({ kind: 'parking', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: 28, walkable: true });
    special({ id: `magasin_${b.id}`, x: b.x + 6, y: b.y + 34, w: b.w - 12, d: Math.min(30, b.h - 40), floors: 2, style: 'hyper', roof: 'plat', front: 'n', label });
    for (let i = 0; i < 5; i++) props.push({ kind: 'lampadaire', x: b.x + 8 + i * 13, y: b.y + 16, blocks: true });
    parkCars(b.x + 3, b.y + 3, b.w - 6, 28, 0.55, b.x + b.y);
    // Arbres d'alignement devant le magasin.
    for (let x = b.x + 6; x < b.x + b.w - 6; x += 9) props.push({ kind: 'arbre', x, y: b.y + 32, blocks: true });
  };
  /** Friche : halles en ruine, terre et bouleaux. */
  const friche = (b: CityBlock): void => {
    zones.push({ kind: 'terre', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
    if (hash(b.x, b.y, 51) > 0.35) special({ id: `ruine_${b.id}`, x: b.x + 10, y: b.y + 12, w: b.w - 24, d: Math.min(30, b.h - 26), floors: 3, style: 'industriel', roof: 'sheds', front: 'n', ruined: true });
    if (hash(b.x, b.y, 52) > 0.7) props.push({ kind: 'cheminee', x: b.x + b.w - 10, y: b.y + b.h - 12, blocks: true });
    for (let i = 0; i < 4; i++) props.push({ kind: 'arbre', x: b.x + 6 + Math.floor(hash(i, b.x, 53) * (b.w - 12)), y: b.y + b.h - 8, blocks: true });
    // Ce que la friche garde : tas de gravats, broussailles, une épave, un conteneur rouillé.
    for (let i = 0; i < 3; i++) bigProp('gravats', b.x + 8 + hash(i, b.y, 54) * (b.w - 16), b.y + b.h - 16 + hash(i, b.x, 55) * 6, 3, 3, 'z');
    for (let i = 0; i < 9; i++) props.push({ kind: 'buisson', x: b.x + 5 + Math.floor(hash(i, b.x, 56) * (b.w - 10)), y: b.y + 5 + Math.floor(hash(i, b.y, 57) * (b.h - 10)), blocks: true });
    if (hash(b.x, b.y, 58) > 0.5) bigProp('voiture', b.x + 6.5, b.y + b.h - 7, 2, 4, 'x', 'rouille');
    if (hash(b.x, b.y, 59) > 0.45) bigProp('conteneur', b.x + b.w - 9, b.y + 7, 2.6, 6.2, 'x', 'rouille');
  };
  /** Quartier d'immeubles : bandes sur rue, commerces sur les avenues. */
  const immeubles = (b: CityBlock, shops: Face[], styles: FacadeStyle[], floors: [number, number]): void => {
    perimeter(b, { shops, styles, floors });
    streetFurniture(b);
  };

  // Bâtiments de lore, posés sur des îlots précis (colonne, rangée).
  const LORE: Record<string, (b: CityBlock) => void> = {
    // Hôpital de Val-Ferrand : là où Nora fait ses gardes de nuit.
    s0803: (b) => {
      zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
      special({ id: 'hopital', x: b.x + 6, y: b.y + 8, w: b.w - 12, d: 40, floors: 6, style: 'enduit_creme', roof: 'plat', front: 's', label: 'Hôpital de Val-Ferrand' });
      // Parvis des urgences : parking des visiteurs et deux ambulances.
      zones.push({ kind: 'parking', x: b.x + 6, y: b.y + 50, w: b.w - 12, h: b.h - 56, walkable: true });
      parkCars(b.x + 16, b.y + 50, b.w - 22, b.h - 56, 0.6, 803);
      bigProp('voiture', b.x + 9.5, b.y + 53, 2.2, 5, 'z', 'ambulance');
      bigProp('voiture', b.x + 12.5, b.y + 53, 2.2, 5, 'z', 'ambulance');
    },
    // Lycée Louise-Michel : après le collège, à quinze ans.
    s0806: (b) => {
      special({ id: 'lycee', x: b.x + 6, y: b.y + 10, w: b.w - 12, d: 26, floors: 3, style: 'ecole', roof: 'deux_pans', front: 's', label: 'Lycée Louise-Michel' });
      zones.push({ kind: 'pave', x: b.x + 6, y: b.y + 40, w: b.w - 12, h: b.h - 46, walkable: true });
      // Cour : platanes en quinconce, un banc à l'ombre de chacun.
      for (let x = b.x + 12, i = 0; x < b.x + b.w - 10; x += 12, i++) {
        props.push({ kind: 'arbre', x, y: b.y + 46 + (i % 2) * 8, blocks: true });
        props.push({ kind: 'banc', x: x + 2, y: b.y + 46 + (i % 2) * 8, blocks: true });
      }
    },
    // Stade Marcel-Cerdan : pelouse et tribune.
    s0809: (b) => {
      // Piste en cendrée autour de la pelouse, buts aux deux bouts.
      zones.push({ kind: 'terre', x: b.x + 4, y: b.y + 12, w: b.w - 8, h: b.h - 16, walkable: true });
      zones.push({ kind: 'herbe', x: b.x + 9, y: b.y + 17, w: b.w - 18, h: b.h - 26, walkable: true });
      special({ id: 'tribune', x: b.x + 10, y: b.y + 4, w: b.w - 20, d: 6, floors: 2, style: 'civique', roof: 'plat', front: 's', label: 'Stade Marcel-Cerdan' });
      const midY = b.y + 17 + (b.h - 26) / 2;
      props.push({ kind: 'terrain_foot', x: b.x + 10, y: b.y + 18, w: b.w - 20, h: b.h - 28, blocks: false });
      props.push({ kind: 'but', x: b.x + 10, y: Math.floor(midY) - 2, w: 1, h: 4, cx: b.x + 10.2, cy: midY, ry: 0, blocks: true });
      props.push({ kind: 'but', x: b.x + b.w - 11, y: Math.floor(midY) - 2, w: 1, h: 4, cx: b.x + b.w - 10.2, cy: midY, ry: Math.PI, blocks: true });
    },
    // Cimetière du Taret : là où repose Lucien.
    s1001: (b) => {
      zones.push({ kind: 'herbe', x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6, walkable: true });
      for (let yy = b.y + 10; yy < b.y + b.h - 8; yy += 5) for (let xx = b.x + 8; xx < b.x + b.w - 8; xx += 4) props.push({ kind: 'bollard', x: xx, y: yy, blocks: false });
      special({ id: 'chapelle', x: b.x + Math.floor(b.w / 2) - 4, y: b.y + 4, w: 8, d: 6, floors: 1, style: 'pierre', roof: 'deux_pans', front: 's', label: 'Cimetière du Taret' });
    },
    // Brasserie de la Malterie : la fabrique qui a donné son nom au canal.
    s0002: (b) => { special({ id: 'brasserie_malterie', x: b.x + 6, y: b.y + 6, w: b.w - 12, d: 28, floors: 3, style: 'brique', roof: 'sheds', front: 'n', label: 'Brasserie de la Malterie' }); zones.push({ kind: 'pave', x: b.x + 6, y: b.y + 38, w: b.w - 12, h: b.h - 44, walkable: true }); },
    // Allée des Grossistes (zone HyperVal).
    e102: (b) => entrepots(b, ['Grossiste Malterie Boissons', 'Cash Fruits du Taret']),
    e103: (b) => entrepots(b, ['Allée des Grossistes — Frais', 'Dépôt Papeterie Vallée']),
  };

  // Un compteur de locaux par quartier (les quartiers alternent dans le parcours des îlots) ;
  // « gare_est » pour ne pas recouvrir les locaux « gare_* » historiques.
  const counters = new Map<string, number>();
  for (const b of newBlocks) {
    const prefix = b.district === 'gare' ? 'gare_est' : b.district;
    unitPrefix = prefix;
    unitCounter = counters.get(prefix) ?? 0;
    const lore = LORE[b.id];
    if (lore) { lore(b); counters.set(prefix, unitCounter); continue; }
    const k = hash(b.x, b.y, 61);
    switch (b.district) {
      case 'gare': immeubles(b, ['n', 's'], ['pierre', 'enduit_creme', 'brique'], [3, 5]); break;
      case 'hyperval': if (k > 0.55) grandeSurface(b, k > 0.8 ? 'Brico Taret' : k > 0.68 ? 'Meubles Val-Ferrand' : 'Hyper Discount'); else entrepots(b); break;
      case 'industrie': if (k > 0.25) entrepots(b); else friche(b); break;
      case 'collines': pavillons(b); break;
      case 'berges': if (k > 0.5) immeubles(b, ['n'], ['brique', 'enduit_ocre'], [2, 4]); else pavillons(b); break;
      case 'faubourg': immeubles(b, k > 0.5 ? ['n', 'w'] : ['n'], ['enduit_creme', 'enduit_rose', 'pierre', 'enduit_ocre'], [3, 5]); break;
      case 'grand_ensemble': grandEnsemble(b); break;
      case 'friche_sud': friche(b); break;
      default: if (k > 0.45) pavillons(b); else immeubles(b, ['n'], ['enduit_creme', 'pierre'], [2, 3]);
    }
    counters.set(prefix, unitCounter);
  }

  // Domiciles des habitants nommés : une porte d'immeuble dans leur quartier.
  const homeIn = (blockId: string, index = 0): { x: number; y: number } => {
    const doors = buildings
      .filter((bd) => bd.id === blockId || bd.id.startsWith(`bat_${blockId}_`))
      .flatMap((bd) => bd.doors.filter((d) => d.residential));
    const d = doors[index % Math.max(1, doors.length)];
    if (!d) throw new Error(`Ville : aucune porte d'immeuble dans ${blockId}.`);
    return outside(d);
  };
  const doorOfBuilding = (id: string): { x: number; y: number } => {
    const d = buildings.find((bd) => bd.id === id)?.doors[0];
    if (!d) throw new Error(`Ville : bâtiment ${id} introuvable.`);
    return outside(d);
  };
  const npcHomes: Record<string, { x: number; y: number }> = {
    noah: doorOfBuilding('barre_b'),
    yasmine: doorOfBuilding('barre_b'),
    lina: doorOfBuilding('tour_c'),
    monique: doorOfBuilding('barre_a'),
    bertin: homeIn('b01', 1),
    moreau: homeIn('b03', 2),
    karim: homeIn('b13', 0),
    samir: homeIn('b12', 3),
  };

  const required: PlaceId[] = ['maison', 'college', 'epicerie', 'friche', 'parc', 'place'];
  for (const p of required) {
    if (!anchors[p]) throw new Error(`Ville : le lieu ${p} n'a pas d'entrée.`);
  }
  return { roads, blocks, buildings, zones, props, units, anchors: anchors as Record<PlaceId, { x: number; y: number }>, npcHomes, crossings, canal, bridges };
}

export const CITY: CityLayout = buildCityLayout();
