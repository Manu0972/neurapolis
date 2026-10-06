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

export const CITY_W = 330;
export const CITY_H = 268;
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
  | 'cheminee' | 'etal' | 'jeux' | 'feu' | 'kiosque' | 'grue' | 'bollard' | 'velo';

export interface CityProp {
  kind: CityPropKind;
  x: number;
  y: number;
  /** Les petits objets (bollards, vélos) ne bloquent pas le passage. */
  blocks: boolean;
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
  /** Passages piétons (rendu + ralentissement des voitures). */
  crossings: { x: number; y: number; w: number; h: number }[];
  canal: { x: number; y: number; w: number; h: number };
}

// ---------- Trame ----------

const VX = [0, 82, 164, 246, 322] as const;
const HY = [0, 80, 160, 242] as const;
const V_NAMES = ['Rue des Houillères', 'Rue Ambroise-Croizat', 'Rue de la Verrerie', 'Rue Louise-Michel', "Boulevard de l'Est"];
const H_NAMES = ['Rue de la Mine', 'Avenue Jean-Jaurès', 'Rue des Forges', 'Quai de la Malterie'];
const ROAD_BOTTOM = HY[3] + ROAD_W; // 250

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
  const blockAt = (row: number, col: number): CityBlock => {
    const x = VX[col]! + ROAD_W;
    const y = HY[row]! + ROAD_W;
    const w = VX[col + 1]! - x;
    const h = HY[row + 1]! - y;
    const def = BLOCK_DEFS[row]![col]!;
    return { id: `b${row}${col}`, name: def.name, district: def.district, x, y, w, h };
  };
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) blocks.push(blockAt(r, c));
  const B = (r: number, c: number): CityBlock => blocks[r * 4 + c]!;

  // Nom de la rue qui borde un îlot sur une face donnée.
  const streetOf = (b: CityBlock, face: Face): string => {
    const col = VX.findIndex((x) => x + ROAD_W === b.x);
    const row = HY.findIndex((y) => y + ROAD_W === b.y);
    if (face === 'n') return H_NAMES[row]!;
    if (face === 's') return H_NAMES[row + 1]!;
    if (face === 'w') return V_NAMES[col]!;
    return V_NAMES[col + 1]!;
  };

  let unitCounter = 0;
  const addUnit = (b: CityBlock, building: CityBuilding, door: CityDoor, street: string): void => {
    unitCounter += 1;
    const id = `local_${String(unitCounter).padStart(2, '0')}`;
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
    for (let i = 0; i < 6; i++) {
      props.push({ kind: 'etal', x: b.x + 12 + i * 9, y: cy + 12, blocks: true });
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

  // Canal de la Malterie, au sud du quai.
  const canal = { x: 0, y: ROAD_BOTTOM + 3, w: CITY_W, h: 10 };
  zones.push({ kind: 'eau', ...canal, walkable: false });
  zones.push({ kind: 'pave', x: 0, y: ROAD_BOTTOM, w: CITY_W, h: 3, walkable: true });
  for (let x = 6; x < CITY_W; x += 14) props.push({ kind: x % 28 === 6 ? 'lampadaire' : 'banc', x, y: ROAD_BOTTOM + 2, blocks: true });

  const required: PlaceId[] = ['maison', 'college', 'epicerie', 'friche', 'parc', 'place'];
  for (const p of required) {
    if (!anchors[p]) throw new Error(`Ville : le lieu ${p} n'a pas d'entrée.`);
  }
  return { roads, blocks, buildings, zones, props, units, anchors: anchors as Record<PlaceId, { x: number; y: number }>, crossings, canal };
}

export const CITY: CityLayout = buildCityLayout();
