/**
 * Rendu Canvas du quartier : tuiles colorées par type, entrées de lieux,
 * PNJ en pastilles de leur couleur, joueur distinct. Ne fait que lire l'état.
 */
import type { WorldState } from '../core/types';
import { MAP_H, MAP_W, tileAt } from '../data/map';
import { NPC_BY_ID } from '../data/npcs';
import { npcPosition } from '../simulation/npc';
import { TOKENS } from './tokens';
import { drawCharacter, drawShadow, SPRITE_W } from './sprite';

const TILE_COLORS = {
  sol: '#b9b4a3',
  herbe: '#7cb36d',
  terre: '#b38f61',
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
      ctx.fillStyle =
        t.kind === 'mur' ? TILE_COLORS.mur
        : t.kind === 'herbe' ? TILE_COLORS.herbe
        : t.kind === 'terre' ? TILE_COLORS.terre
        : TILE_COLORS.sol;
      ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);
      if (t.kind === 'entree' && t.place) {
        ctx.fillStyle = ENTRY_COLORS[t.place] ?? '#e0d0a8';
        ctx.fillRect(sx + cam.ts * 0.24, sy + cam.ts * 0.24, cam.ts * 0.52, cam.ts * 0.52);
      } else if (t.kind === 'mur') {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(sx, sy, cam.ts + 0.5, 2);
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
}
