/**
 * NEURAPOLIS — Rendu Canvas 2.5D avec assets pixel-art (claude-assets-v1).
 *
 * Pipeline de rendu (conforme au GUIDE-DA §3) :
 * 1. Rendu natif 480×270 dans un OffscreenCanvas
 * 2. Ciel → nuages (parallaxe) → skyline → tuiles 32 px (variante par hash)
 * 3. Façades ancrées bas-gauche, variante jour/allumée selon l'heure
 * 4. Ombres portées → props + personnages triés par Y
 * 5. Étalonnage couleur (grading.json : multiply + alpha)
 * 6. Halos de lumière (screen/lighter) + vignette
 * 7. Zoom entier ×k vers le canvas visible
 *
 * Fallback : si les assets ne sont pas encore chargés, utilise le rendu procédural.
 */
import type { PlaceId, WorldState } from '../core/types';
import { MAP_H, MAP_W, tileAt } from '../data/map';
import { minutesOfDay } from '../core/clock';
import { NPC_BY_ID } from '../data/npcs';
import { npcPosition } from '../simulation/npc';
import { TOKENS } from './tokens';
import { drawCharacter, drawShadow, SPRITE_W } from './sprite';
import { getAssetKit, type AssetKit } from './asset-loader';

/* ── Constants ───────────────────────────────────────────────── */

const NATIVE_W = 480;
const NATIVE_H = 270;
const TILE = 32; // taille native d'une tuile en px

/** Grading par heure (issu de grading.json). */
const GRADING = {
  jour:  { mul: [255, 255, 255], k: 0.0, shadow: 0.22, lamp: 0.0, win: 0.0 },
  soir:  { mul: [255, 196, 150], k: 0.55, shadow: 0.42, lamp: 0.55, win: 0.6 },
  nuit:  { mul: [84, 104, 180],  k: 0.8, shadow: 0.0, lamp: 0.95, win: 0.95 },
} as const;

const SHADOW_COLOR = 'rgba(90,74,120,';  // violet froid
const WINDOW_COLOR = [255, 214, 138] as const;

/** Variantes de tuiles sol (pave_a..e → colonnes 0..4 dans la ligne 0). */
const TILE_VARIANTS: Record<string, { row: number; count: number }> = {
  sol:   { row: 0, count: 5 },  // pave_a..e
  herbe: { row: 0, count: 4 },  // herbe_a..d (colonnes 4..7)
  terre: { row: 1, count: 2 },  // terre_a..b
};
const TILE_OFFSETS: Record<string, number> = {
  sol: 0,    // column 0..4
  herbe: 4,  // column 4..7
  terre: 0,  // row 1, column 0..1
};
const TILE_ROWS: Record<string, number> = {
  sol: 0,
  herbe: 0,
  terre: 1,
};

/* ── Offscreen canvas (réutilisé entre frames) ───────────────── */

let offCanvas: OffscreenCanvas | null = null;
let offCtx: OffscreenCanvasRenderingContext2D | null = null;

function getOffscreen(): { off: OffscreenCanvas; g: OffscreenCanvasRenderingContext2D } {
  if (!offCanvas || !offCtx) {
    offCanvas = new OffscreenCanvas(NATIVE_W, NATIVE_H);
    offCtx = offCanvas.getContext('2d')!;
    offCtx.imageSmoothingEnabled = false;
  }
  return { off: offCanvas, g: offCtx };
}

/* ── Hash stable pour variante de tuile ──────────────────────── */

function hash2(x: number, y: number): number {
  return ((x * 2654435761) ^ (y * 2246822519)) >>> 0;
}

/* ── Détermination de la période du jour ─────────────────────── */

type TimeOfDay = 'jour' | 'soir' | 'nuit';

function timeOfDay(hour: number): TimeOfDay {
  if (hour < 6.5 || hour >= 21) return 'nuit';
  if (hour >= 17.5 && hour < 21) return 'soir';
  return 'jour';
}

function gradingLerp(hour: number): { mul: readonly number[]; k: number; lamp: number; win: number } {
  const tod = timeOfDay(hour);
  return GRADING[tod];
}

/* ── Camera (compatible avec l'ancien export) ────────────────── */

export interface Camera { ts: number; ox: number; oy: number }

/** Caméra pour rendu natif (toujours ts=32, centré sur le joueur). */
function nativeCamera(px: number, py: number): Camera {
  const mw = MAP_W * TILE;
  const mh = MAP_H * TILE;
  const clamp = (v: number, size: number, world: number): number =>
    Math.max(0, Math.min(world - size, v));
  const ox = mw <= NATIVE_W ? (mw - NATIVE_W) / 2 : clamp(px * TILE + TILE / 2 - NATIVE_W / 2, NATIVE_W, mw);
  const oy = mh <= NATIVE_H ? (mh - NATIVE_H) / 2 : clamp(py * TILE + TILE / 2 - NATIVE_H / 2, NATIVE_H, mh);
  return { ts: TILE, ox, oy };
}

/** Caméra pour le fallback procédural (ancien comportement, zoom variable). */
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

/* ── Couleurs procédurales (fallback) ────────────────────────── */

const TILE_COLORS = {
  sol: ['#b9b4a3', '#c0bcab', '#b5b09f', '#c3beac'],
  herbe: ['#78ad69', '#7eb46f', '#72a763', '#83b873'],
  terre: ['#ad8a5e', '#b59164', '#a88356', '#b38f61'],
  mur: '#373c4f',
} as const;

const ENTRY_COLORS: Record<string, string> = {
  maison: '#f2c94c', college: '#6ba7d6', epicerie: '#e89a56',
  friche: '#8f96a3', parc: '#5d9e57', place: '#d9c39a',
};

function tileColor(kind: 'sol' | 'herbe' | 'terre' | 'mur', x: number, y: number): string {
  const palette = TILE_COLORS[kind];
  if (typeof palette === 'string') return palette;
  return palette[(x * 7 + y * 11 + x * y) % palette.length] ?? palette[0];
}

/* ── Rendu avec assets PNG ───────────────────────────────────── */

function renderWithAssets(
  ctx: CanvasRenderingContext2D,
  w: WorldState,
  cw: number,
  ch: number,
  now: number,
  kit: AssetKit,
): void {
  const { off, g } = getOffscreen();
  const cam = nativeCamera(w.player.pos.x, w.player.pos.y);
  const hour = minutesOfDay(w.time.tick) / 60;
  const tod = timeOfDay(hour);
  const grade = gradingLerp(hour);

  // Effacer
  g.clearRect(0, 0, NATIVE_W, NATIVE_H);

  // 1. Ciel
  const skyImg = tod === 'soir' ? kit.backdrop['ciel_soir_480x128'] : kit.backdrop['ciel_jour_480x128'];
  if (skyImg) {
    if (tod === 'nuit') {
      // Nuit : fond bleu profond
      g.fillStyle = '#0c1428';
      g.fillRect(0, 0, NATIVE_W, NATIVE_H);
    } else {
      g.drawImage(skyImg, 0, 0, NATIVE_W, 128);
      g.fillStyle = tod === 'soir' ? '#c8a070' : '#b8c8d8';
      g.fillRect(0, 128, NATIVE_W, NATIVE_H - 128);
    }
  }

  // 1b. Nuages (parallaxe)
  const clouds = kit.backdrop['nuages_200x40'];
  if (clouds) {
    const cx = -(now * 0.005) % 200;
    g.globalAlpha = tod === 'nuit' ? 0.15 : 0.7;
    for (let i = -1; i < 4; i++) {
      g.drawImage(clouds, cx + i * 200, 20);
    }
    g.globalAlpha = 1;
  }

  // 1c. Skyline
  const skyline = kit.backdrop['skyline_cite_480x80'];
  if (skyline) {
    const skyY = 60;
    g.globalAlpha = tod === 'nuit' ? 0.3 : 0.6;
    g.drawImage(skyline, 0, skyY);
    g.globalAlpha = 1;
  }

  // 2. Tuiles
  const x0 = Math.max(0, Math.floor(cam.ox / TILE));
  const y0 = Math.max(0, Math.floor(cam.oy / TILE));
  const x1 = Math.min(MAP_W - 1, Math.floor((cam.ox + NATIVE_W) / TILE));
  const y1 = Math.min(MAP_H - 1, Math.floor((cam.oy + NATIVE_H) / TILE));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (!t) continue;
      const sx = Math.round(x * TILE - cam.ox);
      const sy = Math.round(y * TILE - cam.oy);

      const tileKind = t.kind === 'entree' || t.kind === 'decor' ? 'sol' : t.kind;

      if (tileKind === 'mur') {
        // Murs : couleur unie (les façades PNG gèrent les bâtiments)
        g.fillStyle = '#373c4f';
        g.fillRect(sx, sy, TILE, TILE);
        continue;
      }

      // Tuile PNG depuis la spritesheet
      const variant = TILE_VARIANTS[tileKind];
      if (variant && kit.tiles) {
        const vIdx = hash2(x, y) % variant.count;
        const col = (TILE_OFFSETS[tileKind] ?? 0) + vIdx;
        const row = TILE_ROWS[tileKind] ?? 0;
        g.drawImage(kit.tiles, col * TILE, row * TILE, TILE, TILE, sx, sy, TILE, TILE);
      } else {
        g.fillStyle = tileColor(tileKind as 'sol' | 'herbe' | 'terre' | 'mur', x, y);
        g.fillRect(sx, sy, TILE, TILE);
      }
    }
  }

  // 3. Façades — positionnées sur les tuiles 'mur' qui bordent le sol
  // Placer les façades de bâtiments sur les lignes de mur adjacentes au sol
  const isDark = tod === 'nuit' || tod === 'soir';
  const buildingSuffix = isDark ? '_allume' : '_jour';

  // Épicerie : ancre tuiles (20,7) = entrée 'e', façade couvre ~5 tuiles de large
  const epicImg = kit.buildings['epicerie' + buildingSuffix];
  if (epicImg) {
    const bx = 20 * TILE - cam.ox;
    const by = 8 * TILE - cam.oy - 128 + TILE; // bas de la façade = haut de la ligne de sol (y=8)
    g.drawImage(epicImg, bx, by);
  }

  // Maison : ancre tuiles (33,15) = entrée 'm', façade ~3.5 tuiles
  const maisonImg = kit.buildings['maison' + buildingSuffix];
  if (maisonImg) {
    const bx = 33 * TILE - cam.ox;
    const by = 16 * TILE - cam.oy - 128 + TILE;
    g.drawImage(maisonImg, bx, by);
  }

  // Immeuble : près de l'épicerie ou maison
  const immeubleImg = kit.buildings['immeuble' + buildingSuffix];
  if (immeubleImg) {
    const bx = 25 * TILE - cam.ox;
    const by = 8 * TILE - cam.oy - 128 + TILE;
    g.drawImage(immeubleImg, bx, by);
  }

  // 4. Props (décorations de la carte)
  // TODO: itérer les tuiles 'decor' et placer les props PNG correspondants

  // 5. Personnages triés par Y
  interface RenderEntity {
    id: string; name: string; x: number; y: number;
    color: string; hair: string; isPlayer: boolean;
  }

  const entities: RenderEntity[] = [];
  const HAIRS = ['#6b4a2f', '#3a2c22', '#8a6240', '#2c2c33', '#a3542a'];
  const hairOf = (id: string): string => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h += id.charCodeAt(i);
    return HAIRS[h % HAIRS.length]!;
  };

  for (const def of Object.values(NPC_BY_ID)) {
    const st = w.npcs[def.id];
    if (!st) continue;
    const p = npcPosition(w, def.id);
    entities.push({ id: def.id, name: def.name, x: p.x, y: p.y, color: def.color, hair: hairOf(def.id), isPlayer: false });
  }
  entities.push({ id: 'player', name: w.player.name, x: w.player.pos.x, y: w.player.pos.y, color: TOKENS.or, hair: '#3a2c22', isPlayer: true });
  entities.sort((a, b) => a.y - b.y);

  const s = TILE / SPRITE_W; // échelle sprite = 2 (32/16)

  for (const ent of entities) {
    const cx = ent.x * TILE + TILE / 2 - cam.ox;
    const cy = ent.y * TILE + TILE / 2 - cam.oy;
    if (cx < -TILE * 2 || cx > NATIVE_W + TILE * 2 || cy < -TILE * 2 || cy > NATIVE_H + TILE * 2) continue;

    drawShadow(g as unknown as CanvasRenderingContext2D, cx, cy + TILE * 0.12, s);
    drawCharacter(g as unknown as CanvasRenderingContext2D, cx, cy + TILE * 0.12, s, { hair: ent.hair, shirt: ent.color }, now, false);

    if (ent.isPlayer) {
      g.font = 'bold 8px monospace';
      g.textAlign = 'center';
      g.fillStyle = '#2a1a14';
      g.fillText(ent.name, cx + 1, cy - TILE * 0.8 + 1);
      g.fillStyle = TOKENS.or;
      g.fillText(ent.name, cx, cy - TILE * 0.8);
    }
  }

  // 6. Étalonnage couleur (grading multiply)
  if (grade.k > 0) {
    g.globalCompositeOperation = 'multiply';
    const [mr, mg, mb] = grade.mul;
    g.fillStyle = `rgba(${mr},${mg},${mb},${grade.k})`;
    g.fillRect(0, 0, NATIVE_W, NATIVE_H);
    g.globalCompositeOperation = 'source-over';
  }

  // 6b. Halos de lumière (lampadaires, fenêtres)
  if (grade.lamp > 0) {
    const halo = kit.light['halo_chaud_96'];
    if (halo) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = grade.lamp * 0.6;
      // Lampadaires de la carte
      const lampPositions = [
        { x: 21, y: 14 }, { x: 28, y: 16 },
      ];
      for (const lp of lampPositions) {
        const lx = lp.x * TILE + TILE / 2 - cam.ox - 48;
        const ly = lp.y * TILE - cam.oy - 48;
        g.drawImage(halo, lx, ly);
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
  }

  // 6c. Vignette
  const vignette = kit.light['vignette_480x270'];
  if (vignette) {
    g.globalAlpha = tod === 'nuit' ? 0.55 : tod === 'soir' ? 0.45 : 0.3;
    g.drawImage(vignette, 0, 0);
    g.globalAlpha = 1;
  }

  // 7. Blit vers le canvas visible avec zoom entier
  const k = Math.max(1, Math.floor(Math.min(cw / NATIVE_W, ch / NATIVE_H)));
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = TOKENS.bg;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(
    off,
    ((cw - NATIVE_W * k) / 2) | 0,
    ((ch - NATIVE_H * k) / 2) | 0,
    NATIVE_W * k,
    NATIVE_H * k,
  );
}

/* ── Rendu procédural (fallback) ─────────────────────────────── */

const LIGHT_SOURCES: ReadonlyArray<{ x: number; y: number; color: string; radiusFactor: number }> = [
  { x: 23.5, y: 7.5, color: 'rgba(255,190,99,', radiusFactor: 3.8 },
  { x: 15.5, y: 14.5, color: 'rgba(255,210,130,', radiusFactor: 3.5 },
  { x: 7.5, y: 8.5, color: 'rgba(180,215,255,', radiusFactor: 3.2 },
  { x: 37.5, y: 15.5, color: 'rgba(255,200,110,', radiusFactor: 3.0 },
  { x: 21.5, y: 22.5, color: 'rgba(180,240,160,', radiusFactor: 2.8 },
  { x: 4.5, y: 21.5, color: 'rgba(255,170,110,', radiusFactor: 2.6 },
];

function drawAtmosphere(ctx: CanvasRenderingContext2D, w: WorldState, cam: Camera, cw: number, ch: number, now: number): void {
  const hour = minutesOfDay(w.time.tick) / 60;
  const night = hour < 5 ? 0.44 : hour < 7 ? 0.44 * (7 - hour) / 2 : hour >= 21 ? 0.44 : hour > 19 ? 0.44 * (hour - 19) / 2 : 0;
  const dawn = hour >= 5 && hour < 7.5 ? 0.14 * Math.sin(((hour - 5) / 2.5) * Math.PI) : 0;
  const golden = hour >= 17 && hour < 20 ? 0.16 * Math.sin(((hour - 17) / 3) * Math.PI) : 0;

  if (night > 0) {
    ctx.fillStyle = `rgba(8,14,38,${night})`;
    ctx.fillRect(0, 0, cw, ch);
    if (night > 0.25 && w.district.meteo === 'soleil') {
      ctx.fillStyle = 'rgba(235,245,255,0.45)';
      for (let i = 0; i < 28; i++) {
        const starX = (i * 97 + 13) % cw;
        const starY = (i * 53 + 7) % Math.floor(ch * 0.4);
        const twinkle = (Math.sin(now * 0.003 + i) + 1) * 0.5;
        ctx.fillRect(starX, starY, twinkle > 0.4 ? 1.5 : 1, twinkle > 0.4 ? 1.5 : 1);
      }
    }
  }
  if (dawn > 0) { ctx.fillStyle = `rgba(255,175,130,${dawn})`; ctx.fillRect(0, 0, cw, ch); }
  if (golden > 0) { ctx.fillStyle = `rgba(255,148,65,${golden})`; ctx.fillRect(0, 0, cw, ch); }

  if (night > 0.05) {
    for (const light of LIGHT_SOURCES) {
      const lx = light.x * cam.ts - cam.ox;
      const ly = light.y * cam.ts - cam.oy;
      if (lx < -cam.ts * 5 || lx > cw + cam.ts * 5 || ly < -cam.ts * 5 || ly > ch + cam.ts * 5) continue;
      const flicker = Math.sin(now * 0.004 + light.x * 5) * 0.08;
      const r = cam.ts * (light.radiusFactor + flicker);
      const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, r);
      glow.addColorStop(0, `${light.color}${night * 0.52})`);
      glow.addColorStop(0.5, `${light.color}${night * 0.20})`);
      glow.addColorStop(1, `${light.color}0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
  }

  if (w.district.meteo === 'nuages') {
    ctx.fillStyle = 'rgba(32,44,64,0.14)';
    ctx.fillRect(0, 0, cw, ch);
  } else if (w.district.meteo === 'pluie') {
    ctx.fillStyle = 'rgba(28,42,62,0.22)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(205,228,250,0.28)';
    ctx.lineWidth = 1;
    const phase = now * 0.22;
    for (let i = 0; i < Math.ceil(cw / 16); i++) {
      const rx = (i * 43 + phase) % (cw + 24) - 12;
      const ry = (i * 79 + phase * 2.4) % ch;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 12); ctx.stroke();
    }
  } else if (w.district.meteo === 'soleil') {
    ctx.fillStyle = golden > 0 ? 'rgba(255,215,140,0.25)' : 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 14; i++) {
      const mx = ((now * 0.02 * (1 + i * 0.1) + i * 83) % (cw + 20)) - 10;
      const my = ((now * 0.01 * (1 + i * 0.05) + i * 127 + Math.sin(now * 0.002 + i) * 15) % ch);
      ctx.fillRect(mx, my, 2, 2);
    }
  }

  const vig = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cw, ch);
}

function renderFallback(ctx: CanvasRenderingContext2D, w: WorldState, cw: number, ch: number, now: number): void {
  const cam = computeCamera(cw, ch, w.player.pos.x, w.player.pos.y);
  ctx.fillStyle = TOKENS.bg;
  ctx.fillRect(0, 0, cw, ch);

  const x0 = Math.max(0, Math.floor(cam.ox / cam.ts));
  const y0 = Math.max(0, Math.floor(cam.oy / cam.ts));
  const x1 = Math.min(MAP_W - 1, Math.floor((cam.ox + cw) / cam.ts));
  const y1 = Math.min(MAP_H - 1, Math.floor((cam.oy + ch) / cam.ts));
  const hour = minutesOfDay(w.time.tick) / 60;
  const isDark = hour < 6.5 || hour >= 19.5;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (!t) continue;
      const sx = Math.round(x * cam.ts - cam.ox);
      const sy = Math.round(y * cam.ts - cam.oy);
      ctx.fillStyle = tileColor(t.kind === 'entree' || t.kind === 'decor' ? 'sol' : t.kind as 'sol' | 'herbe' | 'terre' | 'mur', x, y);
      ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);

      if (t.kind === 'sol') {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(sx, sy, cam.ts + 0.5, 1);
        ctx.fillStyle = 'rgba(15,19,26,0.06)';
        ctx.fillRect(sx, sy + cam.ts - 1, cam.ts + 0.5, 1);
      } else if (t.kind === 'entree' && t.place) {
        const inset = cam.ts * 0.18;
        ctx.fillStyle = 'rgba(12,16,24,0.38)';
        ctx.fillRect(sx + inset, sy + inset, cam.ts * 0.64, cam.ts * 0.64);
        ctx.fillStyle = ENTRY_COLORS[t.place] ?? '#d9c39a';
        ctx.fillRect(sx + inset + 1, sy + inset + 1, cam.ts * 0.64 - 2, cam.ts * 0.64 - 2);
      } else if (t.kind === 'mur') {
        const tileBelow = y < MAP_H - 1 ? tileAt(x, y + 1) : null;
        const isFacade = tileBelow !== null && tileBelow.kind !== 'mur';
        if (isFacade) {
          ctx.fillStyle = '#2d3345';
          ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);
          if (isDark) {
            const winW = cam.ts * 0.34, winH = cam.ts * 0.38;
            const winX = sx + (cam.ts - winW) / 2, winY = sy + cam.ts * 0.18;
            ctx.fillStyle = '#171b26';
            ctx.fillRect(winX - 1, winY - 1, winW + 2, winH + 2);
            ctx.fillStyle = 'rgba(255,214,120,0.85)';
            ctx.fillRect(winX, winY, winW, winH);
          }
        }
      }
    }
  }

  // Personnages
  interface RE { id: string; name: string; x: number; y: number; color: string; hair: string; isPlayer: boolean }
  const entities: RE[] = [];
  const HAIRS = ['#6b4a2f', '#3a2c22', '#8a6240', '#2c2c33', '#a3542a'];
  const hairOf = (id: string): string => { let h = 0; for (let i = 0; i < id.length; i++) h += id.charCodeAt(i); return HAIRS[h % HAIRS.length]!; };

  for (const def of Object.values(NPC_BY_ID)) {
    const st = w.npcs[def.id];
    if (!st) continue;
    const p = npcPosition(w, def.id);
    entities.push({ id: def.id, name: def.name, x: p.x, y: p.y, color: def.color, hair: hairOf(def.id), isPlayer: false });
  }
  entities.push({ id: 'player', name: w.player.name, x: w.player.pos.x, y: w.player.pos.y, color: TOKENS.or, hair: '#3a2c22', isPlayer: true });
  entities.sort((a, b) => a.y - b.y);

  const s = cam.ts / SPRITE_W;
  for (const ent of entities) {
    const cx = ent.x * cam.ts + cam.ts / 2 - cam.ox;
    const cy = ent.y * cam.ts + cam.ts / 2 - cam.oy;
    if (cx < -cam.ts * 2 || cx > cw + cam.ts * 2 || cy < -cam.ts * 2 || cy > ch + cam.ts * 2) continue;
    drawShadow(ctx, cx, cy + cam.ts * 0.12, s);
    drawCharacter(ctx, cx, cy + cam.ts * 0.12, s, { hair: ent.hair, shirt: ent.color }, now, false);
    if (ent.isPlayer) {
      ctx.font = `bold ${Math.max(10, Math.floor(cam.ts * 0.36))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(ent.name, cx + 1, cy - cam.ts * 1.55 + 1);
      ctx.fillStyle = TOKENS.or;
      ctx.fillText(ent.name, cx, cy - cam.ts * 1.55);
    }
  }

  drawAtmosphere(ctx, w, cam, cw, ch, now);
}

/* ── Point d'entrée principal ────────────────────────────────── */

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  w: WorldState,
  cw: number,
  ch: number,
  now: number,
): void {
  const kit = getAssetKit();
  if (kit) {
    renderWithAssets(ctx, w, cw, ch, now, kit);
  } else {
    renderFallback(ctx, w, cw, ch, now);
  }
}
