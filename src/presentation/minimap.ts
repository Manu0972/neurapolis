/**
 * Mini-carte (coin inférieur gauche) et grand plan de la ville (touche M).
 * Le fond est peint une fois depuis la grille ; seuls le joueur et les repères bougent.
 */
import type { WorldState } from '../core/types';
import { CITY, MAP_H, MAP_W, surfaceFast, type Surface } from '../data/map';
import { CITY_AREAS } from '../data/city/layout';
import { lockedAreas } from '../simulation/areas';
import { PLACE_ANCHORS } from '../data/map';
import { PLACE_BY_ID } from '../data/places';
import { pickupPoint, UNIT_BY_ID } from '../simulation/economy';

const COLORS: Record<Surface, string> = {
  chaussee: '#55565c', passage: '#8c8c90', parking: '#6a6a70', trottoir: '#c9c2b4', pave: '#b9ab94',
  herbe: '#6f9a4c', aire_jeux: '#b5523e', terre: '#8c7656', gravier: '#c4b394', eau: '#4f7f94',
  cour: '#a39a8a', batiment: '#d8b98f',
};
const STYLE_COLORS: Record<string, string> = {
  hlm: '#e6dccb', ecole: '#c99a6a', industriel: '#7a5244', civique: '#e2cfa6', hyper: '#a9c2dc', brique: '#b8664e',
};

let base: HTMLCanvasElement | null = null;

/** Image de fond (1 pixel par mètre), calculée une seule fois. */
function baseImage(): HTMLCanvasElement {
  if (base) return base;
  const c = document.createElement('canvas');
  c.width = MAP_W;
  c.height = MAP_H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(MAP_W, MAP_H);
  const rgb = (hex: string): [number, number, number] => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const cache = new Map<string, [number, number, number]>();
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const s = surfaceFast(x, y);
      const hex = COLORS[s];
      let v = cache.get(hex);
      if (!v) { v = rgb(hex); cache.set(hex, v); }
      const i = (y * MAP_W + x) * 4;
      img.data[i] = v[0]; img.data[i + 1] = v[1]; img.data[i + 2] = v[2]; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  for (const b of CITY.buildings) {
    ctx.fillStyle = STYLE_COLORS[b.style] ?? COLORS.batiment;
    ctx.fillRect(b.x, b.y, b.w, b.d);
    ctx.strokeStyle = 'rgba(60,40,30,0.55)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(b.x + 0.3, b.y + 0.3, b.w - 0.6, b.d - 0.6);
  }
  base = c;
  return c;
}

/** Hachures sombres sur les quartiers encore fermés. */
function shadeLocked(ctx: CanvasRenderingContext2D, w: WorldState, ox: number, oy: number, scale: number): void {
  const locked = lockedAreas(w);
  if (!locked.length) return;
  ctx.save();
  for (const a of locked) {
    const x = ox + a.x * scale;
    const y = oy + a.y * scale;
    const ww = a.w * scale;
    const hh = a.h * scale;
    ctx.fillStyle = 'rgba(28, 22, 30, 0.5)';
    ctx.fillRect(x, y, ww, hh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, ww, hh);
    ctx.clip();
    ctx.strokeStyle = 'rgba(242, 194, 48, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let d = -hh; d < ww; d += 14) { ctx.moveTo(x + d, y + hh); ctx.lineTo(x + d + hh, y); }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** Autres joueurs (multijoueur), posés par la boucle de jeu. */
let extraMarkers: { x: number; y: number; label: string }[] = [];
export function setPlayerMarkers(list: { x: number; y: number; label: string }[]): void {
  extraMarkers = list;
}

interface Marker { x: number; y: number; color: string; label?: string; ring?: boolean }

function markers(w: WorldState): Marker[] {
  const out: Marker[] = extraMarkers.map((m) => ({ x: m.x, y: m.y, color: '#ffb347', label: `🎮 ${m.label}`, ring: true }));
  for (const [id, a] of Object.entries(PLACE_ANCHORS)) {
    out.push({ x: a.x, y: a.y, color: '#ffd98a', label: PLACE_BY_ID[id as keyof typeof PLACE_ANCHORS]?.name ?? id });
  }
  const e = w.economy;
  if (e) {
    for (const b of Object.values(e.businesses)) {
      const u = UNIT_BY_ID[b.unitId];
      if (u) out.push({ x: u.door.x, y: u.door.y, color: b.open ? '#5fd17a' : '#d9a441', label: b.name, ring: true });
    }
    for (const o of e.orders) {
      if (o.status !== 'a_retirer') continue;
      const p = pickupPoint(o.wholesalerId);
      if (p) out.push({ x: p.x, y: p.y, color: '#ffef5a', label: 'Cartons à retirer', ring: true });
    }
  }
  return out;
}

/**
 * Mini-carte centrée sur le joueur, nord en haut. `heading` est le cap du joueur
 * (0 = nord), `pos` sa position continue en mètres.
 */
export function drawMinimap(ctx: CanvasRenderingContext2D, size: number, w: WorldState, pos: { x: number; z: number }, heading: number, cameraYaw: number): void {
  const img = baseImage();
  const scale = 1.6; // pixels par mètre
  const half = size / 2;
  ctx.save();
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(half, half, half - 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#3e5a64';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, half - pos.x * scale, half - pos.z * scale, MAP_W * scale, MAP_H * scale);
  shadeLocked(ctx, w, half - pos.x * scale, half - pos.z * scale, scale);
  // Cône de vision de la caméra.
  ctx.fillStyle = 'rgba(255, 240, 200, 0.16)';
  ctx.beginPath();
  ctx.moveTo(half, half);
  // La caméra, placée à l'azimut `cameraYaw`, regarde dans la direction (−sin, −cos).
  const look = Math.atan2(-Math.cos(cameraYaw), -Math.sin(cameraYaw));
  ctx.arc(half, half, half, look - 0.6, look + 0.6);
  ctx.closePath();
  ctx.fill();
  for (const m of markers(w)) {
    const mx = half + (m.x + 0.5 - pos.x) * scale;
    const my = half + (m.y + 0.5 - pos.z) * scale;
    const d = Math.hypot(mx - half, my - half);
    const r = half - 8;
    // Les repères hors champ restent collés au bord, dans leur direction.
    const k = d > r ? r / d : 1;
    const px = half + (mx - half) * k;
    const py = half + (my - half) * k;
    ctx.fillStyle = m.color;
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, m.ring ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  drawHome(ctx, half, pos, scale);
  drawMissionMarker(ctx, half, pos, scale);
  // Joueur : flèche orientée.
  ctx.translate(half, half);
  ctx.rotate(-heading);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c25a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 6);
  ctx.lineTo(0, 3);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // Liseré et nord.
  ctx.strokeStyle = 'rgba(42,26,20,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(half, half, half - 2, 0, Math.PI * 2);
  ctx.stroke();
  // Boussole : pastille « N » lisible (la mini-carte est orientée nord en haut).
  ctx.fillStyle = '#4a3220';
  ctx.strokeStyle = '#ffd98a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(half, 20, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', half, 21);
  ctx.textBaseline = 'alphabetic';
}

/** Grand plan de la ville avec légende des repères (touche M). */
/**
 * Cadre du grand plan : les quartiers ouverts (et le joueur), avec une marge. Au palier 1, le plan
 * montre le centre en grand au lieu d'une ville entière où les lieux tiennent dans un coin.
 */
export function mapFrame(
  open: readonly { x: number; y: number; w: number; h: number }[], pos: { x: number; z: number },
  mapW: number, mapH: number, margin = 12,
): { x: number; y: number; w: number; h: number } {
  if (!open.length) return { x: 0, y: 0, w: mapW, h: mapH };
  const x0 = Math.max(0, Math.floor(Math.min(pos.x, ...open.map((a) => a.x)) - margin));
  const y0 = Math.max(0, Math.floor(Math.min(pos.z, ...open.map((a) => a.y)) - margin));
  const x1 = Math.min(mapW, Math.ceil(Math.max(pos.x, ...open.map((a) => a.x + a.w)) + margin));
  const y1 = Math.min(mapH, Math.ceil(Math.max(pos.z, ...open.map((a) => a.y + a.h)) + margin));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function renderCityMap(w: WorldState, pos: { x: number; z: number }): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'city-map';
  const c = document.createElement('canvas');
  const shut = new Set(lockedAreas(w).map((a) => a.id));
  // Grande carte : les quartiers ouverts tiennent dans ~1 600 × 1 100 pixels.
  const frame = mapFrame(CITY_AREAS.filter((a) => !shut.has(a.id)), pos, MAP_W, MAP_H);
  const scale = Math.min(4, 1600 / frame.w, 1100 / frame.h);
  c.width = Math.round(frame.w * scale);
  c.height = Math.round(frame.h * scale);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(-frame.x * scale, -frame.y * scale);
  ctx.drawImage(baseImage(), frame.x, frame.y, frame.w, frame.h, frame.x * scale, frame.y * scale, frame.w * scale, frame.h * scale);
  shadeLocked(ctx, w, 0, 0, scale);
  // Le plan s'affiche plus petit que sa taille réelle : textes et repères grossis d'autant
  // pour rester lisibles à l'écran (sinon ~5 px de haut).
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
  const shown = Math.min(1, (vw - 80) / c.width, (vh - 150) / c.height);
  const k = Math.min(3, Math.max(1, 1 / shown));
  // Noms des quartiers (cadenas et palier pour ceux encore fermés).
  ctx.save();
  ctx.textAlign = 'center';
  for (const a of CITY_AREAS) {
    const cx = (a.x + a.w / 2) * scale;
    const cy = (a.y + a.h / 2) * scale;
    ctx.font = `800 ${15 * k}px system-ui, sans-serif`;
    ctx.lineWidth = 4 * k;
    ctx.strokeStyle = 'rgba(20,14,10,0.85)';
    ctx.fillStyle = shut.has(a.id) ? '#f2c230' : '#fbf3e2';
    const label = shut.has(a.id) ? `🔒 ${a.name}` : a.name;
    ctx.strokeText(label, cx, cy);
    ctx.fillText(label, cx, cy);
    if (shut.has(a.id)) {
      ctx.font = `600 ${11 * k}px system-ui, sans-serif`;
      ctx.strokeText(`palier ${a.tier}`, cx, cy + 15 * k);
      ctx.fillText(`palier ${a.tier}`, cx, cy + 15 * k);
    }
  }
  ctx.restore();
  ctx.font = `600 ${11 * k}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  for (const r of CITY.roads) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (r.axis === 'h') ctx.fillText(r.name, (r.x + Math.min(r.w, 160) / 2 + 40) * scale, (r.y + r.h / 2 + 1.5) * scale);
    else {
      ctx.translate((r.x + r.w / 2 + 1.5) * scale, (r.y + 60) * scale);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(r.name, 0, 0);
    }
    ctx.restore();
  }
  for (const m of markers(w)) {
    ctx.fillStyle = m.color;
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.arc((m.x + 0.5) * scale, (m.y + 0.5) * scale, (m.ring ? 7 : 5) * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (m.label) {
      // Étiquette sur fond clair : lisible sur les toits comme sur la chaussée.
      ctx.lineWidth = 3 * k;
      ctx.strokeStyle = 'rgba(251,243,226,0.9)';
      ctx.strokeText(m.label, (m.x + 0.5) * scale, (m.y + 0.5) * scale - 9 * k);
      ctx.fillStyle = '#2a1a14';
      ctx.fillText(m.label, (m.x + 0.5) * scale, (m.y + 0.5) * scale - 9 * k);
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c25a40';
  ctx.lineWidth = 3 * k;
  ctx.beginPath();
  ctx.arc(pos.x * scale, pos.z * scale, 8 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  wrap.appendChild(c);
  const legend = document.createElement('p');
  legend.className = 'panel-note';
  legend.textContent = '● jaune : lieux · ● vert : tes commerces ouverts (orange : fermés) · ● jaune vif : cartons à retirer · cercle blanc : toi';
  wrap.appendChild(legend);
  return wrap;
}

// ---------- Repère de mission (vague 5) ----------
// Drapeau (mât + fanion + halo) et flèche de bord quand la cible sort du cadre : idée reprise de
// CubeGO (MiniMap.drawMarker, © 2024 Portalyze, licence MIT), redessinée aux couleurs de la DA.
let missionMarker: { x: number; y: number } | null = null;
/** Cible de la mission active (tuile), ou null. */
export function setMissionMarker(t: { x: number; y: number } | null): void {
  missionMarker = t;
}

function drawMissionMarker(ctx: CanvasRenderingContext2D, half: number, pos: { x: number; z: number }, scale: number): void {
  if (!missionMarker) return;
  const mx = half + (missionMarker.x + 0.5 - pos.x) * scale;
  const my = half + (missionMarker.y + 0.5 - pos.z) * scale;
  const dx = mx - half;
  const dy = my - half;
  const d = Math.hypot(dx, dy);
  const r = half - 30;
  ctx.save();
  if (d <= r) {
    ctx.translate(mx, my);
    ctx.scale(1.7, 1.7);
    // Halo, mât, fanion or.
    ctx.fillStyle = 'rgba(255, 217, 138, 0.28)';
    ctx.beginPath();
    ctx.arc(0, -14, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    ctx.strokeStyle = '#f9ecd0';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    ctx.fillStyle = '#ffd98a';
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, -26); ctx.lineTo(17, -19.5); ctx.lineTo(1, -13);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c25a40';
    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  } else {
    // Flèche collée au bord, pointée vers la cible.
    const a = Math.atan2(dy, dx);
    const ex = half + Math.cos(a) * r;
    const ey = half + Math.sin(a) * r;
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ctx.scale(1.7, 1.7);
    ctx.fillStyle = 'rgba(255, 217, 138, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** Icône « maison » permanente : chez toi (Cité des Roses, bâtiment A), collée au bord si loin. */
function drawHome(ctx: CanvasRenderingContext2D, half: number, pos: { x: number; z: number }, scale: number): void {
  const a = PLACE_ANCHORS.maison;
  let hx = half + (a.x + 0.5 - pos.x) * scale;
  let hy = half + (a.y + 0.5 - pos.z) * scale;
  const d = Math.hypot(hx - half, hy - half);
  const r = half - 24;
  if (d > r) { hx = half + (hx - half) * r / d; hy = half + (hy - half) * r / d; }
  ctx.save();
  ctx.translate(hx, hy);
  ctx.fillStyle = '#f9ecd0';
  ctx.strokeStyle = '#2a1a14';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c25a40';
  ctx.beginPath();
  ctx.moveTo(-9, -1); ctx.lineTo(0, -9); ctx.lineTo(9, -1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(-6, -1, 12, 9);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(-2, 3, 4, 5);
  ctx.restore();
}
