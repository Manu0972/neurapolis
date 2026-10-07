/**
 * Intérieurs praticables (façon Big Ambitions) : une pièce 3D dans laquelle on marche,
 * avec du mobilier interactif (points d'interaction), une porte de sortie et, pour les
 * commerces, des rayons qui se remplissent selon le stock réel.
 * Repère local : x de 0 à w (gauche → droite), z de 0 (mur du fond) à d (façade, porte).
 */
import * as THREE from 'three';
import type { PlaceId } from '../../core/types';
import type { BusinessState } from '../../core/economy_types';
import { INTERIOR_PLACES } from '../../data/interiors';
import { FURNITURE_BY_ID } from '../../data/economy';
import { UNIT_BY_ID, furnitureFootprint, shopRoomSize, storageCapacity, stockUnits } from '../../simulation/economy';
import { visualRng } from './textures';

export type ItemKind =
  | 'lit' | 'bureau' | 'etagere' | 'fenetre' | 'frigo' | 'canape' | 'table' | 'radio' | 'tableau'
  | 'comptoir' | 'rayon' | 'etabli' | 'machine' | 'ferraille' | 'plante' | 'caisse_bois' | 'machine_cafe' | 'pupitre';

export interface InteriorItem {
  id: string;
  kind: ItemKind;
  label: string;
  icon: string;
  x: number;
  z: number;
  /** Rotation : 0 = face au sud (vers la porte). */
  rot: number;
  w: number;
  d: number;
  /** Taux de remplissage des rayons (0-1) pour les commerces. */
  fill?: number;
  /** Couleur dominante (rayons : produits). */
  tint?: string;
  /** Indice du meuble dans le commerce (aménagement). */
  slot?: number;
  /** Surbrillance (meuble sélectionné en mode « Aménager »). */
  highlight?: boolean;
}

export interface Hotspot {
  id: string;
  label: string;
  icon: string;
  x: number;
  z: number;
  kind: 'mobilier' | 'sortie' | 'piece' | 'gestion' | 'decharger' | 'travail' | 'amenager';
  /** Pièce de destination (kind = piece) ou identifiant de mobilier (kind = mobilier). */
  target?: string;
}

export interface InteriorSpec {
  key: string;
  title: string;
  w: number;
  d: number;
  floor: 'parquet' | 'carrelage' | 'beton' | 'lino';
  wall: string;
  items: InteriorItem[];
  hotspots: Hotspot[];
  /** Places où se tiennent les habitants présents (devant le mobilier principal). */
  npcSlots: { x: number; z: number; face: number }[];
  placeId?: PlaceId;
  roomId?: string;
  businessId?: string;
}

export interface BuiltInterior {
  spec: InteriorSpec;
  group: THREE.Group;
  /** Collision sur une grille de 50 cm : (cx, cz) en cases. */
  walkable(cx: number, cz: number): boolean;
  spawn: { x: number; z: number; heading: number };
  walls: { mesh: THREE.Mesh; normal: THREE.Vector3 }[];
  dispose(): void;
}

export const INTERIOR_CELL = 0.5;
const WALL_H = 2.9;

// ---------- Mobilier : correspondances et dimensions ----------

const SIZES: Record<ItemKind, [number, number]> = {
  lit: [1.6, 2.1], bureau: [1.5, 0.8], etagere: [1.8, 0.45], fenetre: [1.6, 0.2], frigo: [0.9, 0.75], canape: [2.1, 0.9],
  table: [1.6, 1.0], radio: [0.6, 0.5], tableau: [3.2, 0.15], comptoir: [2.4, 0.8], rayon: [2.0, 0.6], etabli: [2.2, 0.9],
  machine: [1.2, 1.2], ferraille: [1.8, 1.6], plante: [0.6, 0.6], caisse_bois: [1.0, 1.0], machine_cafe: [0.9, 0.6], pupitre: [1.1, 0.7],
};

/** Devine la forme 3D d'un meuble de données à partir de son identifiant. */
export function kindForFurnitureId(id: string): ItemKind {
  const m: [RegExp, ItemKind][] = [
    [/lit|canap/, 'lit'], [/bureau_prof|bureau/, 'bureau'], [/pupitre/, 'pupitre'], [/biblio|panneau|registre/, 'etagere'],
    [/fenetre/, 'fenetre'], [/frigo/, 'frigo'], [/table/, 'table'], [/radio/, 'radio'], [/tableau/, 'tableau'],
    [/caisse|comptoir|etal/, 'comptoir'], [/rayon|bocal|palette|vrac/, 'rayon'], [/etabli|diagnostic|banc_diag/, 'etabli'],
    [/tour|machine/, 'machine'], [/ferraille|tas/, 'ferraille'],
  ];
  for (const [re, k] of m) if (re.test(id)) return k;
  return 'caisse_bois';
}
// « canape » doit rester un canapé : correction après coup.
const fixKind = (id: string): ItemKind => (/canap/.test(id) ? 'canape' : kindForFurnitureId(id));

/**
 * Placement automatique : objets muraux au fond, puis le long des murs gauche et droit,
 * le reste au centre. Laisse toujours une allée libre devant la porte.
 */
function arrange(kinds: { id: string; kind: ItemKind; label: string; icon: string }[], w: number, d: number): InteriorItem[] {
  const out: InteriorItem[] = [];
  let backX = 0.8;
  let leftZ = 1.2;
  let rightZ = 1.2;
  let centerI = 0;
  for (const k of kinds) {
    const [iw, id] = SIZES[k.kind];
    const wallish = k.kind === 'fenetre' || k.kind === 'tableau' || k.kind === 'etagere' || k.kind === 'rayon' || k.kind === 'lit' || k.kind === 'frigo' || k.kind === 'etabli' || k.kind === 'bureau';
    if (wallish && backX + iw <= w - 0.6) {
      out.push({ ...k, x: backX + iw / 2, z: 0.15 + id / 2, rot: 0, w: iw, d: id });
      backX += iw + 0.5;
    } else if (wallish && leftZ + iw <= d - 2.2) {
      out.push({ ...k, x: 0.15 + id / 2, z: leftZ + iw / 2, rot: -Math.PI / 2, w: id, d: iw });
      leftZ += iw + 0.5;
    } else if (wallish && rightZ + iw <= d - 2.2) {
      out.push({ ...k, x: w - 0.15 - id / 2, z: rightZ + iw / 2, rot: Math.PI / 2, w: id, d: iw });
      rightZ += iw + 0.5;
    } else {
      const cols = Math.max(1, Math.floor((w - 2) / 2.6));
      const cx = 1.4 + (centerI % cols) * 2.6 + iw / 2;
      const cz = 2.4 + Math.floor(centerI / cols) * 2.2;
      out.push({ ...k, x: Math.min(w - 1, cx), z: Math.min(d - 2.6, cz), rot: 0, w: iw, d: id });
      centerI++;
    }
  }
  return out;
}

function frontOf(it: InteriorItem): { x: number; z: number } {
  // Point d'accès devant l'objet, côté pièce.
  const off = 0.75;
  if (Math.abs(it.rot) < 0.01) return { x: it.x, z: it.z + it.d / 2 + off };
  if (it.rot < 0) return { x: it.x + it.w / 2 + off, z: it.z };
  return { x: it.x - it.w / 2 - off, z: it.z };
}

// ---------- Spécifications : lieux et commerces ----------

const PLACE_ROOM_STYLE: Partial<Record<PlaceId, { floor: InteriorSpec['floor']; wall: string; w: number; d: number }>> = {
  maison: { floor: 'parquet', wall: '#e8d9c0', w: 8, d: 7 },
  college: { floor: 'lino', wall: '#dfe3d2', w: 11, d: 9 },
  epicerie: { floor: 'carrelage', wall: '#f0e2c4', w: 10, d: 8 },
  friche: { floor: 'beton', wall: '#9a8a7a', w: 13, d: 10 },
};

/** Les lieux couverts ont un intérieur 3D ; le parc et la place restent en plein air. */
export function placeHasInterior(place: PlaceId): boolean {
  return !!PLACE_ROOM_STYLE[place];
}

/** Pièces couvertes d'un lieu (les pièces extérieures — cour, allées, halle — sont exclues). */
export function indoorRooms(place: PlaceId): string[] {
  const outdoor = /cour|allee|kiosque|halle|hangar_recup/;
  return (INTERIOR_PLACES[place]?.rooms ?? []).filter((r) => !outdoor.test(r.id)).map((r) => r.id);
}

export function placeInteriorSpec(place: PlaceId, roomId?: string): InteriorSpec | null {
  const style = PLACE_ROOM_STYLE[place];
  const def = INTERIOR_PLACES[place];
  if (!style || !def) return null;
  const rooms = indoorRooms(place);
  const rid = roomId && rooms.includes(roomId) ? roomId : rooms[0];
  const room = def.rooms.find((r) => r.id === rid);
  if (!room) return null;
  const items = arrange(room.furniture.map((f) => ({ id: f.id, kind: fixKind(f.id), label: f.name, icon: f.icon })), style.w, style.d);
  const hotspots: Hotspot[] = items.map((it) => ({ id: it.id, label: `${it.label} — ${room.furniture.find((f) => f.id === it.id)?.actionLabel ?? ''}`, icon: it.icon, ...frontOf(it), kind: 'mobilier', target: it.id }));
  hotspots.push({ id: 'sortie', label: 'Sortir', icon: '🚪', x: style.w / 2, z: style.d - 0.6, kind: 'sortie' });
  if (place === 'epicerie' && rid === rooms[0]) {
    hotspots.push({ id: 'travail', label: 'Proposer ton aide à Mme Bertin (petit boulot, 4,50 €/h)', icon: '🧺', x: 1.2, z: style.d - 2.4, kind: 'travail' });
  }
  const others = rooms.filter((r) => r !== rid);
  others.forEach((r, i) => {
    const rr = def.rooms.find((x) => x.id === r)!;
    hotspots.push({ id: `piece_${r}`, label: `Aller : ${rr.name}`, icon: '➡️', x: i % 2 === 0 ? style.w - 0.6 : 0.6, z: style.d - 2.2, kind: 'piece', target: r });
  });
  const npcSlots = items.slice(0, 4).map((it) => ({ ...frontOf(it), face: Math.PI }));
  return { key: `${place}:${rid}`, title: `${def.title} — ${room.name}`, ...style, items, hotspots, npcSlots, placeId: place, roomId: rid };
}

const CAT_KIND: Record<string, ItemKind> = {
  rayonnage: 'rayon', frigo: 'frigo', caisse: 'comptoir', comptoir: 'comptoir', table: 'table', machine: 'machine_cafe',
  deco: 'plante', stockage: 'rayon',
};

/** Intérieur d'un commerce du joueur, construit à partir de son mobilier et de son stock réels. */
/**
 * Intérieur d'un commerce du joueur, construit à partir de son mobilier, de son stock et de
 * son aménagement réels. `selected` met un meuble en surbrillance (mode « Aménager »).
 */
export function businessInteriorSpec(b: BusinessState, selected?: number): InteriorSpec {
  const u = UNIT_BY_ID[b.unitId]!;
  const { w, d } = shopRoomSize(u);
  const cap = storageCapacity(b);
  const totalCap = cap.ambiant + cap.froid;
  const fill = totalCap > 0 ? Math.min(1, stockUnits(b) / totalCap) : 0;
  const isCounter = (f: string): boolean => ['caisse', 'comptoir'].includes(FURNITURE_BY_ID[f]?.category ?? '');
  const iconOf = (cat: string | undefined): string => (cat === 'frigo' ? '🧊' : cat === 'table' ? '🪑' : cat === 'deco' ? '🪴' : cat === 'caisse' || cat === 'comptoir' ? '💶' : '🧺');
  const layout = b.layout ?? {};
  const items: InteriorItem[] = [];
  // 1. Meubles placés par le joueur.
  b.furniture.forEach((f, i) => {
    const p = layout[String(i)];
    if (!p) return;
    const def = FURNITURE_BY_ID[f];
    const fp = furnitureFootprint(f, p.rot);
    items.push({ id: `${f}_${i}`, slot: i, kind: CAT_KIND[def?.category ?? ''] ?? 'caisse_bois', label: def?.name ?? f, icon: iconOf(def?.category), x: p.x, z: p.z, rot: p.rot, w: fp.w, d: fp.d, fill, highlight: i === selected });
  });
  // 2. Les autres : comptoirs près de l'entrée, le reste rangé le long des murs.
  let counterN = 0;
  b.furniture.forEach((f, i) => {
    if (layout[String(i)] || !isCounter(f)) return;
    const [iw, id] = SIZES.comptoir;
    items.push({ id: `${f}_${i}`, slot: i, kind: 'comptoir', label: FURNITURE_BY_ID[f]?.name ?? 'Caisse', icon: '💶', x: w - 1.6 - counterN * (iw + 0.4), z: d - 2.6, rot: Math.PI, w: iw, d: id, highlight: i === selected });
    counterN += 1;
  });
  const autoIdx = b.furniture.map((f, i) => i).filter((i) => !layout[String(i)] && !isCounter(b.furniture[i]!));
  const arranged = arrange(autoIdx.map((i) => {
    const f = b.furniture[i]!;
    const def = FURNITURE_BY_ID[f];
    return { id: `${f}_${i}`, kind: CAT_KIND[def?.category ?? ''] ?? 'caisse_bois', label: def?.name ?? f, icon: iconOf(def?.category) };
  }), w, d);
  arranged.forEach((it, k) => items.push({ ...it, slot: autoIdx[k], fill, highlight: autoIdx[k] === selected }));
  const counter = items.find((it) => it.kind === 'comptoir');
  const hotspots: Hotspot[] = [
    { id: 'gestion', label: `Gérer ${b.name}`, icon: '📱', x: counter ? counter.x : w / 2, z: counter ? Math.min(d - 1.2, counter.z + 1) : d - 2, kind: 'gestion' },
    { id: 'decharger', label: 'Décharger les cartons', icon: '📦', x: 1.2, z: d - 1.2, kind: 'decharger' },
    { id: 'amenager', label: 'Aménager la boutique (Tab : choisir, flèches : déplacer, R : tourner, Entrée : valider)', icon: '🛠️', x: w - 1.0, z: d - 1.0, kind: 'amenager' },
    { id: 'sortie', label: 'Sortir', icon: '🚪', x: w / 2, z: d - 0.6, kind: 'sortie' },
  ];
  return {
    key: `biz:${b.id}:${b.furniture.join(',')}:${JSON.stringify(layout)}:${selected ?? ''}:${Math.round(fill * 10)}`,
    title: b.name,
    w, d, floor: 'carrelage', wall: '#efe4cf', items, hotspots,
    npcSlots: counter ? [{ x: counter.x, z: counter.z - 0.9, face: 0 }] : [],
    businessId: b.id,
  };
}

// ---------- Construction de la scène ----------

function floorTexture(kind: InteriorSpec['floor']): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const rnd = visualRng(kind.length * 31);
  if (kind === 'parquet') {
    for (let y = 0; y < 256; y += 32) {
      for (let x = (y / 32) % 2 ? -64 : 0; x < 256; x += 128) {
        const v = 120 + Math.floor(rnd() * 40);
        ctx.fillStyle = `rgb(${v + 50},${v + 10},${v - 30})`;
        ctx.fillRect(x, y, 127, 31);
      }
    }
  } else if (kind === 'carrelage') {
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
      ctx.fillStyle = (x + y) % 128 === 0 ? '#e9e2d4' : '#cdbfa8';
      ctx.fillRect(x + 1, y + 1, 62, 62);
    }
  } else if (kind === 'lino') {
    ctx.fillStyle = '#b8c4b0';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = rnd() > 0.5 ? '#aab7a2' : '#c4cfbd'; ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  } else {
    ctx.fillStyle = '#8a8580';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) { ctx.fillStyle = rnd() > 0.5 ? '#7a756f' : '#97928b'; ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(0.5, 0.5);
  return t;
}

function iconSprite(icon: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(42,26,20,0.82)';
  ctx.beginPath();
  ctx.arc(48, 48, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd98a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = '46px system-ui, "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, 48, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.45, 0.45, 1);
  return s;
}

function box(w: number, h: number, d: number, color: string, y = h / 2, rough = 0.8): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: rough }));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const PRODUCT_COLORS = ['#c25a40', '#e0b04a', '#4f7a3a', '#2f5d8a', '#d98a3a', '#7a3f6a', '#e6dccb', '#3f8a7a'];

/** Meuble ouvert : panneau du fond, deux montants et des tablettes. */
function openShelf(g: THREE.Group, w: number, h: number, d: number, color: string, levels: number): void {
  const back = box(w, h, 0.04, color, h / 2);
  back.position.z = -d / 2 + 0.02;
  g.add(back);
  for (const sx of [-w / 2 + 0.03, w / 2 - 0.03]) {
    const side = box(0.05, h, d, color, h / 2);
    side.position.x = sx;
    g.add(side);
  }
  for (let i = 0; i <= levels; i++) {
    const board = box(w, 0.04, d, color, 0.12 + i * ((h - 0.16) / levels));
    g.add(board);
  }
}

function itemMesh(it: InteriorItem, rnd: () => number): THREE.Group {
  const g = new THREE.Group();
  const wood = '#8a5a3a';
  switch (it.kind) {
    case 'lit': {
      g.add(box(1.5, 0.35, 2.0, wood, 0.2));
      g.add(box(1.4, 0.18, 1.9, '#f4ead8', 0.46));
      const blanket = box(1.42, 0.08, 1.2, '#c25a40', 0.58);
      blanket.position.z = 0.35;
      g.add(blanket);
      const pillow = box(0.9, 0.12, 0.35, '#ffffff', 0.62);
      pillow.position.z = -0.75;
      g.add(pillow);
      const head = box(1.5, 0.9, 0.08, wood, 0.45);
      head.position.z = -1.0;
      g.add(head);
      break;
    }
    case 'bureau': case 'pupitre': {
      g.add(box(it.kind === 'bureau' ? 1.4 : 1.0, 0.05, 0.7, wood, 0.75));
      for (const [x, z] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]] as const) {
        const leg = box(0.05, 0.75, 0.05, '#3b2a20', 0.375);
        leg.position.set(it.kind === 'bureau' ? x : x * 0.7, 0.375, z);
        g.add(leg);
      }
      const chair = box(0.45, 0.45, 0.45, '#4f6a8a', 0.23);
      chair.position.z = 0.65;
      g.add(chair);
      const papers = box(0.35, 0.02, 0.25, '#f4ead8', 0.79);
      papers.position.x = -0.2;
      g.add(papers);
      break;
    }
    case 'etagere': {
      openShelf(g, 1.8, 2.0, 0.4, wood, 4);
      for (let s = 0; s < 4; s++) {
        for (let k = 0; k < 9; k++) {
          const book = box(0.12 + rnd() * 0.06, 0.32, 0.25, PRODUCT_COLORS[Math.floor(rnd() * PRODUCT_COLORS.length)]!, 0.2 + s * 0.48 + 0.17);
          book.position.set(-0.75 + k * 0.18, book.position.y, 0.05);
          g.add(book);
        }
      }
      break;
    }
    case 'fenetre': {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), new THREE.MeshStandardMaterial({ color: '#bfe0ff', emissive: new THREE.Color('#9cc8f0'), emissiveIntensity: 0.6 }));
      glass.position.set(0, 1.6, 0.11);
      g.add(glass);
      g.add(box(1.6, 0.08, 0.2, '#f4ead8', 0.92));
      break;
    }
    case 'frigo': {
      g.add(box(0.85, 1.9, 0.7, '#e8ecef', 0.95, 0.3));
      const door = box(0.8, 1.2, 0.02, '#cfe6f5', 1.2, 0.1);
      door.position.z = 0.36;
      g.add(door);
      if ((it.fill ?? 0) > 0) for (let k = 0; k < Math.round((it.fill ?? 0) * 12); k++) {
        const bottle = box(0.08, 0.22, 0.08, PRODUCT_COLORS[k % PRODUCT_COLORS.length]!, 0.5 + Math.floor(k / 4) * 0.45);
        bottle.position.set(-0.3 + (k % 4) * 0.2, bottle.position.y, 0.2);
        g.add(bottle);
      }
      break;
    }
    case 'canape': {
      g.add(box(2.0, 0.45, 0.85, '#6b4a6a', 0.25));
      const back = box(2.0, 0.55, 0.2, '#6b4a6a', 0.7);
      back.position.z = -0.32;
      g.add(back);
      break;
    }
    case 'table': {
      g.add(box(1.4, 0.06, 0.9, wood, 0.75));
      const leg = box(0.1, 0.75, 0.1, '#3b2a20', 0.375);
      g.add(leg);
      for (const [x, z] of [[-0.9, 0], [0.9, 0]] as const) {
        const ch = box(0.42, 0.45, 0.42, '#8a5a3a', 0.23);
        ch.position.set(x, 0.23, z);
        g.add(ch);
      }
      break;
    }
    case 'radio': {
      g.add(box(0.6, 0.7, 0.45, wood, 0.35));
      const r = box(0.4, 0.22, 0.2, '#3b3633', 0.82);
      g.add(r);
      break;
    }
    case 'tableau': {
      const board = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.2), new THREE.MeshStandardMaterial({ color: '#2f4a3a', roughness: 0.9 }));
      board.position.set(0, 1.55, 0.09);
      g.add(board);
      const frame = box(3.15, 0.08, 0.12, wood, 0.9);
      g.add(frame);
      break;
    }
    case 'comptoir': {
      g.add(box(it.w - 0.1, 1.0, 0.75, '#6b4a2f', 0.5));
      const top = box(it.w, 0.06, 0.85, '#d8c4a0', 1.03);
      g.add(top);
      const reg = box(0.4, 0.25, 0.35, '#3b3633', 1.2, 0.4);
      reg.position.x = it.w / 2 - 0.5;
      g.add(reg);
      break;
    }
    case 'rayon': {
      openShelf(g, 1.9, 1.8, 0.5, '#b8b2a8', 4);
      const levels = 4;
      const fill = it.fill ?? 0.6;
      for (let s = 0; s < levels; s++) {
        const count = Math.round(8 * Math.min(1, fill * 1.15));
        for (let k = 0; k < count; k++) {
          const p = box(0.18, 0.24, 0.3, PRODUCT_COLORS[(k + s * 3) % PRODUCT_COLORS.length]!, 0.18 + s * 0.42 + 0.13, 0.7);
          p.position.set(-0.8 + k * 0.22, p.position.y, 0.08);
          g.add(p);
        }
      }
      break;
    }
    case 'etabli': {
      g.add(box(2.1, 0.9, 0.85, '#7a5a3a', 0.45));
      const vice = box(0.25, 0.2, 0.25, '#3f4a52', 1.0, 0.4);
      vice.position.x = 0.7;
      g.add(vice);
      for (let k = 0; k < 5; k++) {
        const tool = box(0.05, 0.4, 0.04, '#5a5f66', 1.6, 0.4);
        tool.position.set(-0.8 + k * 0.3, 1.6, -0.38);
        g.add(tool);
      }
      break;
    }
    case 'machine': case 'machine_cafe': {
      if (it.kind === 'machine_cafe') {
        g.add(box(0.85, 0.9, 0.55, '#6b4a2f', 0.45));
        g.add(box(0.6, 0.45, 0.45, '#b8b2a8', 1.12, 0.3));
      } else {
        g.add(box(1.0, 1.1, 1.0, '#4a5a52', 0.55, 0.5));
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12), new THREE.MeshStandardMaterial({ color: '#8a9096', metalness: 0.6, roughness: 0.4 }));
        cyl.rotation.z = Math.PI / 2;
        cyl.position.set(0, 1.25, 0);
        g.add(cyl);
      }
      break;
    }
    case 'ferraille': {
      for (let k = 0; k < 9; k++) {
        const s = box(0.3 + rnd() * 0.5, 0.15 + rnd() * 0.3, 0.3 + rnd() * 0.5, rnd() > 0.5 ? '#7a5a4a' : '#5a5f66', 0.2 + rnd() * 0.4);
        s.position.set((rnd() - 0.5) * 1.2, s.position.y, (rnd() - 0.5) * 1.0);
        s.rotation.y = rnd() * 3;
        g.add(s);
      }
      break;
    }
    case 'plante': {
      g.add(box(0.4, 0.4, 0.4, '#b5523e', 0.2));
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshStandardMaterial({ color: '#4f7a3a', flatShading: true }));
      leaves.position.y = 0.8;
      leaves.castShadow = true;
      g.add(leaves);
      break;
    }
    default:
      g.add(box(0.9, 0.9, 0.9, '#9a7a52', 0.45));
  }
  g.position.set(it.x, 0, it.z);
  g.rotation.y = it.rot;
  return g;
}

export function buildInterior(spec: InteriorSpec): BuiltInterior {
  const group = new THREE.Group();
  group.name = `interieur:${spec.key}`;
  const rnd = visualRng(spec.key.length * 977 + spec.w * 31);
  const { w, d } = spec;

  const floorTex = floorTexture(spec.floor);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(w / 2, 0, d / 2);
  floorTex.repeat.set(w / 2, d / 2);
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: spec.wall, roughness: 0.95, side: THREE.DoubleSide });
  const walls: BuiltInterior['walls'] = [];
  const addWall = (cx: number, cz: number, len: number, rotY: number, normal: THREE.Vector3): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, WALL_H, 0.15), wallMat);
    m.position.set(cx, WALL_H / 2, cz);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    m.castShadow = true;
    group.add(m);
    walls.push({ mesh: m, normal });
  };
  addWall(w / 2, 0, w, 0, new THREE.Vector3(0, 0, -1));
  addWall(0, d / 2, d, Math.PI / 2, new THREE.Vector3(-1, 0, 0));
  addWall(w, d / 2, d, Math.PI / 2, new THREE.Vector3(1, 0, 0));
  // Façade avec la porte au milieu (deux pans).
  const doorW = 1.6;
  addWall((w / 2 - doorW / 2) / 2, d, w / 2 - doorW / 2, 0, new THREE.Vector3(0, 0, 1));
  addWall(w - (w / 2 - doorW / 2) / 2, d, w / 2 - doorW / 2, 0, new THREE.Vector3(0, 0, 1));
  // Plinthes.
  const skirt = new THREE.MeshStandardMaterial({ color: '#6b4a2f' });
  for (const [cx, cz, len, r] of [[w / 2, 0.09, w, 0], [0.09, d / 2, d, Math.PI / 2], [w - 0.09, d / 2, d, Math.PI / 2]] as const) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.03), skirt);
    s.position.set(cx, 0.06, cz);
    s.rotation.y = r;
    group.add(s);
  }
  // Tapis d'entrée.
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshStandardMaterial({ color: '#7a3b2a' }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(w / 2, 0.01, d - 0.6);
  group.add(mat);

  for (const it of spec.items) {
    group.add(itemMesh(it, rnd));
    if (it.highlight) {
      // Liseré doré et socle lumineux autour du meuble sélectionné.
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(it.w + 0.1, 2.2, it.d + 0.1)),
        new THREE.LineBasicMaterial({ color: '#ffd98a' }),
      );
      edges.position.set(it.x, 1.1, it.z);
      group.add(edges);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(it.w + 0.2, it.d + 0.2), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.25 }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(it.x, 0.015, it.z);
      group.add(pad);
    }
  }
  // Icônes flottantes des points d'interaction.
  for (const h of spec.hotspots) {
    const sp = iconSprite(h.icon);
    sp.position.set(h.x, 2.0, h.z);
    sp.userData.hotspot = h.id;
    group.add(sp);
  }
  // Éclairage intérieur chaud.
  const hemi = new THREE.HemisphereLight('#fff1d8', '#6b5a48', 0.9);
  group.add(hemi);
  const lamp = new THREE.PointLight('#ffd39a', 30, 18, 1.5);
  lamp.position.set(w / 2, WALL_H - 0.2, d / 2);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  group.add(lamp);
  const fill = new THREE.PointLight('#ffe6c4', 10, 14, 1.8);
  fill.position.set(w * 0.25, WALL_H - 0.3, d * 0.3);
  group.add(fill);
  // Habillage : tapis central et plante dans un angle libre.
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(3.2, w * 0.4), Math.min(2.2, d * 0.3)), new THREE.MeshStandardMaterial({ color: spec.floor === 'beton' ? '#5a5f66' : '#a4533b', roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(w / 2, 0.012, d * 0.55);
  rug.receiveShadow = true;
  group.add(rug);
  if (spec.floor !== 'beton') {
    const pot = itemMesh({ id: 'deco_plante', kind: 'plante', label: '', icon: '', x: w - 0.6, z: d - 0.7, rot: 0, w: 0.6, d: 0.6 }, rnd);
    group.add(pot);
  }

  // Grille de collision (cases de 50 cm).
  const gw = Math.ceil(w / INTERIOR_CELL);
  const gd = Math.ceil(d / INTERIOR_CELL);
  const blocked = new Uint8Array(gw * gd);
  const block = (x0: number, z0: number, x1: number, z1: number): void => {
    for (let cz = Math.max(0, Math.floor(z0 / INTERIOR_CELL)); cz < Math.min(gd, Math.ceil(z1 / INTERIOR_CELL)); cz++) {
      for (let cx = Math.max(0, Math.floor(x0 / INTERIOR_CELL)); cx < Math.min(gw, Math.ceil(x1 / INTERIOR_CELL)); cx++) blocked[cz * gw + cx] = 1;
    }
  };
  for (const it of spec.items) {
    if (it.kind === 'fenetre' || it.kind === 'tableau') continue;
    block(it.x - it.w / 2, it.z - it.d / 2, it.x + it.w / 2, it.z + it.d / 2);
  }
  const walkable = (cx: number, cz: number): boolean => {
    if (cx < 0 || cz < 0 || cx >= gw || cz >= gd) return false;
    // Murs : bande de 25 cm (la porte, au milieu de la façade, laisse sortir jusqu'au seuil).
    const x = (cx + 0.5) * INTERIOR_CELL;
    const z = (cz + 0.5) * INTERIOR_CELL;
    if (x < 0.25 || x > w - 0.25 || z < 0.25) return false;
    if (z > d - 0.25 && Math.abs(x - w / 2) > doorW / 2) return false;
    return blocked[cz * gw + cx] === 0;
  };

  return {
    spec,
    group,
    walkable,
    spawn: { x: w / 2, z: d - 1.7, heading: 0 },
    walls,
    dispose(): void {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mt = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mt)) mt.forEach((x) => x.dispose());
        else mt?.dispose();
      });
      floorTex.dispose();
    },
  };
}

/** Point d'interaction le plus proche à moins de `reach` mètres. */
export function nearestHotspot(spec: InteriorSpec, x: number, z: number, reach = 1.3): Hotspot | null {
  let best: Hotspot | null = null;
  let bd = reach;
  for (const h of spec.hotspots) {
    const dd = Math.hypot(h.x - x, h.z - z);
    if (dd < bd) { bd = dd; best = h; }
  }
  return best;
}
