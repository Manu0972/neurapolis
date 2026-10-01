/**
 * Rendu Canvas du quartier : tuiles colorées par type, entrées de lieux,
 * PNJ en pastilles de leur couleur, joueur distinct. Ne fait que lire l'état.
 */
import type { WorldState } from '../core/types';
import { MAP_H, MAP_W, tileAt } from '../data/map';
import { minutesOfDay } from '../core/clock';
import { NPC_BY_ID } from '../data/npcs';
import { npcPosition } from '../simulation/npc';
import { TOKENS } from './tokens';
import { drawCharacter, drawShadow, SPRITE_W } from './sprite';

const TILE_COLORS = {
  sol: ['#b9b4a3', '#c0bcab', '#b5b09f', '#c3beac'],
  herbe: ['#7cb36d', '#82b874', '#75ad67', '#86ba78'],
  terre: ['#b38f61', '#ba9668', '#ae895c', '#b99466'],
  mur: '#3f4459',
} as const;

const ENTRY_COLORS: Record<string, string> = {
  maison: '#f2c94c',
  college: '#6ba7d6',
  epicerie: '#e89a56',
  friche: '#8f96a3',
  parc: '#5d9e57',
  place: '#d9c39a',
};

export interface Camera { ts: number; ox: number; oy: number }

function tileColor(kind: 'sol' | 'herbe' | 'terre' | 'mur', x: number, y: number): string {
  const palette = TILE_COLORS[kind];
  if (typeof palette === 'string') return palette;
  return palette[(x * 7 + y * 11 + x * y) % palette.length] ?? palette[0];
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, w: WorldState, cam: Camera, cw: number, ch: number, now: number): void {
  const hour = minutesOfDay(w.time.tick) / 60;
  const night = hour < 5 ? 0.42 : hour < 7 ? 0.42 * (7 - hour) / 2 : hour >= 21 ? 0.42 : hour > 19 ? 0.42 * (hour - 19) / 2 : 0;
  const golden = hour >= 17 && hour < 20
    ? 0.12 * Math.sin(((hour - 17) / 3) * Math.PI)
    : hour >= 5 && hour < 8
      ? 0.08 * Math.sin(((hour - 5) / 3) * Math.PI)
      : 0;

  if (night > 0) {
    ctx.fillStyle = `rgba(9,17,45,${night})`;
    ctx.fillRect(0, 0, cw, ch);
  }
  if (golden > 0) {
    ctx.fillStyle = `rgba(255,151,79,${golden})`;
    ctx.fillRect(0, 0, cw, ch);
  }

  // L’épicerie reste un repère chaleureux quand la rue s’assombrit.
  if (night > 0.06) {
    const anchor = { x: 23.5, y: 7.5 };
    const cx = anchor.x * cam.ts - cam.ox;
    const cy = anchor.y * cam.ts - cam.oy;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, cam.ts * 3.2);
    glow.addColorStop(0, `rgba(255,190,99,${night * 0.42})`);
    glow.addColorStop(1, 'rgba(255,190,99,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - cam.ts * 3.2, cy - cam.ts * 3.2, cam.ts * 6.4, cam.ts * 6.4);
  }

  if (w.district.meteo === 'nuages') {
    ctx.fillStyle = 'rgba(34,48,68,0.12)';
    ctx.fillRect(0, 0, cw, ch);
  } else if (w.district.meteo === 'pluie') {
    ctx.fillStyle = 'rgba(31,47,69,0.19)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(204,224,244,0.22)';
    ctx.lineWidth = 1;
    const phase = now * 0.16;
    for (let i = 0; i < Math.ceil(cw / 18); i++) {
      const x = (i * 47 + phase) % (cw + 16) - 8;
      const y = (i * 83 + phase * 2.1) % ch;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 9);
      ctx.stroke();
    }
  }
}

/** Caméra centrée sur le joueur, bornée à la carte (tuile logique, zoom adapté à l'écran). */
export function computeCamera(cw: number, ch: number, px: number, py: number): Camera {
  const ts = Math.min(48, Math.max(20, Math.floor(Math.min(cw / 16, ch / 12))));
  const mw = MAP_W * ts;
  const mh = MAP_H * ts;
  const clamp = (v: number, size: number, world: number): number =>
    Math.max(0, Math.min(world - size, v));
  const ox = mw <= cw ? (mw - cw) / 2 : clamp(px * ts + ts / 2 - cw / 2, cw, mw);
  const oy = mh <= ch ? (mh - ch) / 2 : clamp(py * ts + ts / 2 - ch / 2, ch, mh);
  return { ts, ox, oy };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  w: WorldState,
  cw: number,
  ch: number,
  now: number,
): void {
  const cam = computeCamera(cw, ch, w.player.pos.x, w.player.pos.y);
  ctx.fillStyle = TOKENS.bg;
  ctx.fillRect(0, 0, cw, ch);

  const x0 = Math.max(0, Math.floor(cam.ox / cam.ts));
  const y0 = Math.max(0, Math.floor(cam.oy / cam.ts));
  const x1 = Math.min(MAP_W - 1, Math.floor((cam.ox + cw) / cam.ts));
  const y1 = Math.min(MAP_H - 1, Math.floor((cam.oy + ch) / cam.ts));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (!t) continue;
      const sx = Math.round(x * cam.ts - cam.ox);
      const sy = Math.round(y * cam.ts - cam.oy);
      ctx.fillStyle = tileColor(t.kind === 'entree' ? 'sol' : t.kind, x, y);
      ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);
      // Reflets et ombres de bord : donnent du relief sans changer la grille logique.
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.fillRect(sx, sy, cam.ts + 0.5, Math.max(1, cam.ts * 0.045));
      ctx.fillStyle = 'rgba(15,19,26,0.07)';
      ctx.fillRect(sx, sy + cam.ts * 0.91, cam.ts + 0.5, cam.ts * 0.09);
      if (t.kind === 'herbe' || t.kind === 'terre') {
        const speck = (x * 17 + y * 29) % 5;
        ctx.fillStyle = t.kind === 'herbe' ? 'rgba(228,247,173,0.20)' : 'rgba(80,49,30,0.15)';
        ctx.fillRect(sx + cam.ts * (0.2 + speck * 0.11), sy + cam.ts * (0.28 + (speck % 2) * 0.24), Math.max(1, cam.ts * 0.045), Math.max(1, cam.ts * 0.045));
      }
      if (t.kind === 'entree' && t.place) {
        const inset = cam.ts * 0.2;
        ctx.fillStyle = 'rgba(25,25,35,0.24)';
        ctx.fillRect(sx + inset, sy + inset + cam.ts * 0.06, cam.ts * 0.6, cam.ts * 0.6);
        ctx.fillStyle = ENTRY_COLORS[t.place] ?? '#e0d0a8';
        ctx.fillRect(sx + inset, sy + inset, cam.ts * 0.6, cam.ts * 0.58);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(sx + inset, sy + inset, cam.ts * 0.6, Math.max(1, cam.ts * 0.05));
      } else if (t.kind === 'mur') {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(sx, sy, cam.ts + 0.5, 2);
        ctx.fillStyle = 'rgba(9,12,20,0.23)';
        ctx.fillRect(sx, sy + cam.ts * 0.76, cam.ts + 0.5, cam.ts * 0.24);
      }
    }
  }

  const s = cam.ts / SPRITE_W;
  const HAIRS = ['#6b4a2f', '#3a2c22', '#8a6240', '#2c2c33', '#a3542a'];
  const hairOf = (id: string): string => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h += id.charCodeAt(i);
    return HAIRS[h % HAIRS.length]!;
  };

  // PNJ : personnages pixel (silhouette complète), teintés par leur couleur.
  for (const def of Object.values(NPC_BY_ID)) {
    const st = w.npcs[def.id];
    if (!st) continue;
    const p = npcPosition(w, def.id);
    const cx = p.x * cam.ts + cam.ts / 2 - cam.ox;
    const cy = p.y * cam.ts + cam.ts / 2 - cam.oy;
    if (cx < -cam.ts * 2 || cy < -cam.ts * 2 || cx > cw + cam.ts * 2 || cy > ch + cam.ts * 2) continue;
    drawShadow(ctx, cx, cy + cam.ts * 0.12, s);
    drawCharacter(ctx, cx, cy + cam.ts * 0.12, s, { hair: hairOf(def.id), shirt: def.color }, now, false);
  }

  // Joueur : personnage distinct (haut or), nom au-dessus.
  const px = w.player.pos.x * cam.ts + cam.ts / 2 - cam.ox;
  const py = w.player.pos.y * cam.ts + cam.ts / 2 - cam.oy;
  drawShadow(ctx, px, py + cam.ts * 0.12, s);
  drawCharacter(ctx, px, py + cam.ts * 0.12, s, { hair: '#3a2c22', shirt: TOKENS.or }, now, false);
  ctx.font = `${Math.max(9, Math.floor(cam.ts * 0.34))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = TOKENS.bg;
  ctx.fillText(w.player.name, px, py - cam.ts * 1.6);
  drawAtmosphere(ctx, w, cam, cw, ch, now);
}
