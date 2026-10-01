/**
 * NEURAPOLIS — Rendu Canvas 2.5D du quartier :
 * - Façades et volumes 2.5D avec fenêtres chaudes le soir et ombres portées
 * - Entrées en retrait avec auvents et lanternes de lieu
 * - Reliefs de sol (pavés de la place, herbes/fleurs oscillantes, gravats friche)
 * - Éclairage temporel (aube, zénith, heure dorée, nuit étoilée) et halos dynamiques
 * - Tri de profondeur Y pour l'occlusion naturelle des personnages
 * Ne fait que lire l'état (simulation ↔ rendu pur).
 */
import type { PlaceId, WorldState } from '../core/types';
import { MAP_H, MAP_W, tileAt } from '../data/map';
import { minutesOfDay } from '../core/clock';
import { NPC_BY_ID } from '../data/npcs';
import { npcPosition } from '../simulation/npc';
import { TOKENS } from './tokens';
import { drawCharacter, drawShadow, SPRITE_W } from './sprite';

const TILE_COLORS = {
  sol: ['#b9b4a3', '#c0bcab', '#b5b09f', '#c3beac'],
  herbe: ['#78ad69', '#7eb46f', '#72a763', '#83b873'],
  terre: ['#ad8a5e', '#b59164', '#a88356', '#b38f61'],
  mur: '#373c4f',
} as const;

const ENTRY_COLORS: Record<string, string> = {
  maison: '#f2c94c',
  college: '#6ba7d6',
  epicerie: '#e89a56',
  friche: '#8f96a3',
  parc: '#5d9e57',
  place: '#d9c39a',
};

// Emplacements des lanternes / sources de lumière in-world (coordonnées tuiles)
const LIGHT_SOURCES: ReadonlyArray<{ x: number; y: number; color: string; radiusFactor: number }> = [
  { x: 23.5, y: 7.5, color: 'rgba(255,190,99,', radiusFactor: 3.8 },   // Épicerie Bertin
  { x: 15.5, y: 14.5, color: 'rgba(255,210,130,', radiusFactor: 3.5 }, // Place du marché
  { x: 7.5, y: 8.5, color: 'rgba(180,215,255,', radiusFactor: 3.2 },   // Collège des Roses
  { x: 37.5, y: 15.5, color: 'rgba(255,200,110,', radiusFactor: 3.0 }, // Chez Camille
  { x: 21.5, y: 22.5, color: 'rgba(180,240,160,', radiusFactor: 2.8 }, // Entrée Parc
  { x: 4.5, y: 21.5, color: 'rgba(255,170,110,', radiusFactor: 2.6 },  // Entrée Friche Taret
];

export interface Camera { ts: number; ox: number; oy: number }

function tileColor(kind: 'sol' | 'herbe' | 'terre' | 'mur', x: number, y: number): string {
  const palette = TILE_COLORS[kind];
  if (typeof palette === 'string') return palette;
  return palette[(x * 7 + y * 11 + x * y) % palette.length] ?? palette[0];
}

/** Atmosphère, cycle circadien et éclairage directionnel 2.5D. */
function drawAtmosphere(ctx: CanvasRenderingContext2D, w: WorldState, cam: Camera, cw: number, ch: number, now: number): void {
  const hour = minutesOfDay(w.time.tick) / 60;

  // Calcul des intensités d'ambiance
  const night = hour < 5 ? 0.44 : hour < 7 ? 0.44 * (7 - hour) / 2 : hour >= 21 ? 0.44 : hour > 19 ? 0.44 * (hour - 19) / 2 : 0;
  const dawn = hour >= 5 && hour < 7.5 ? 0.14 * Math.sin(((hour - 5) / 2.5) * Math.PI) : 0;
  const golden = hour >= 17 && hour < 20 ? 0.16 * Math.sin(((hour - 17) / 3) * Math.PI) : 0;

  // Teintes globales
  if (night > 0) {
    ctx.fillStyle = `rgba(8,14,38,${night})`;
    ctx.fillRect(0, 0, cw, ch);

    // Étoiles subtiles dans les zones dégagées la nuit
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

  if (dawn > 0) {
    ctx.fillStyle = `rgba(255,175,130,${dawn})`;
    ctx.fillRect(0, 0, cw, ch);
  }

  if (golden > 0) {
    ctx.fillStyle = `rgba(255,148,65,${golden})`;
    ctx.fillRect(0, 0, cw, ch);
  }

  // Halos de lumière des lanternes et commerces à la nuit tombée
  if (night > 0.05) {
    for (const light of LIGHT_SOURCES) {
      const cx = light.x * cam.ts - cam.ox;
      const cy = light.y * cam.ts - cam.oy;
      if (cx < -cam.ts * 5 || cx > cw + cam.ts * 5 || cy < -cam.ts * 5 || cy > ch + cam.ts * 5) continue;

      const flicker = Math.sin(now * 0.004 + light.x * 5) * 0.08;
      const r = cam.ts * (light.radiusFactor + flicker);

      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      glow.addColorStop(0, `${light.color}${night * 0.52})`);
      glow.addColorStop(0.5, `${light.color}${night * 0.20})`);
      glow.addColorStop(1, `${light.color}0)`);

      ctx.fillStyle = glow;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  // Météo et particules
  if (w.district.meteo === 'nuages') {
    ctx.fillStyle = 'rgba(32,44,64,0.14)';
    ctx.fillRect(0, 0, cw, ch);
  } else if (w.district.meteo === 'pluie') {
    ctx.fillStyle = 'rgba(28,42,62,0.22)';
    ctx.fillRect(0, 0, cw, ch);

    // Gouttes de pluie obliques
    ctx.strokeStyle = 'rgba(205,228,250,0.28)';
    ctx.lineWidth = 1;
    const phase = now * 0.22;
    for (let i = 0; i < Math.ceil(cw / 16); i++) {
      const x = (i * 43 + phase) % (cw + 24) - 12;
      const y = (i * 79 + phase * 2.4) % ch;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 12);
      ctx.stroke();

      // Cercles d'impacts au sol
      if (i % 4 === 0) {
        const ripple = (now * 0.003 + i) % 1;
        ctx.strokeStyle = `rgba(205,228,250,${(1 - ripple) * 0.18})`;
        ctx.beginPath();
        ctx.ellipse(x, (y + 12) % ch, ripple * 6, ripple * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (w.district.meteo === 'soleil') {
    // Particules de pollen / feuilles flottant dans la brise
    ctx.fillStyle = golden > 0 ? 'rgba(255,215,140,0.25)' : 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 14; i++) {
      const mx = ((now * 0.02 * (1 + i * 0.1) + i * 83) % (cw + 20)) - 10;
      const my = ((now * 0.01 * (1 + i * 0.05) + i * 127 + Math.sin(now * 0.002 + i) * 15) % ch);
      ctx.fillRect(mx, my, 2, 2);
    }
  }

  // Vignette douce sur les bords pour accentuer la profondeur
  const vignette = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cw, ch);
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

  const hour = minutesOfDay(w.time.tick) / 60;
  const isDark = hour < 6.5 || hour >= 19.5;

  // 1. RENDU DU SOL ET DES FACADES DE BATIMENTS (2.5D)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(x, y);
      if (!t) continue;
      const sx = Math.round(x * cam.ts - cam.ox);
      const sy = Math.round(y * cam.ts - cam.oy);

      // Fond de base de la tuile
      ctx.fillStyle = tileColor(t.kind === 'entree' || t.kind === 'decor' ? 'sol' : t.kind, x, y);
      ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);

      // Détails de sol 2.5D
      if (t.kind === 'sol') {
        // Trame de pavés discrets
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(sx, sy, cam.ts + 0.5, 1);
        ctx.fillStyle = 'rgba(15,19,26,0.06)';
        ctx.fillRect(sx, sy + cam.ts - 1, cam.ts + 0.5, 1);
        if ((x + y) % 3 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.035)';
          ctx.fillRect(sx + cam.ts * 0.5, sy, 1, cam.ts);
        }
      } else if (t.kind === 'herbe') {
        // Brins d'herbe et fleurs oscillantes
        const wind = Math.sin(now * 0.0025 + x * 0.8 + y * 0.4) * 1.5;
        const speck = (x * 19 + y * 31) % 4;
        ctx.fillStyle = 'rgba(215,245,160,0.24)';
        ctx.fillRect(sx + cam.ts * 0.3 + wind, sy + cam.ts * 0.35, 1.5, cam.ts * 0.3);
        ctx.fillRect(sx + cam.ts * 0.65 + wind, sy + cam.ts * 0.55, 1.5, cam.ts * 0.25);
        if (speck === 0) {
          // Petite fleur discrète
          ctx.fillStyle = (x + y) % 2 === 0 ? '#fffae0' : '#ffa8b8';
          ctx.fillRect(sx + cam.ts * 0.5 + wind, sy + cam.ts * 0.3, 2, 2);
        }
      } else if (t.kind === 'terre') {
        // Sol industriel de la friche (gravats, éclats de pierre)
        const rubble = (x * 23 + y * 37) % 5;
        ctx.fillStyle = 'rgba(60,40,24,0.18)';
        ctx.fillRect(sx + cam.ts * 0.25, sy + cam.ts * 0.6, 3, 2);
        ctx.fillStyle = 'rgba(240,210,170,0.12)';
        ctx.fillRect(sx + cam.ts * 0.7, sy + cam.ts * 0.35, 2, 2);
        if (rubble === 1) {
          ctx.fillStyle = 'rgba(75,80,95,0.26)'; // vestige d'écrou / brique
          ctx.fillRect(sx + cam.ts * 0.4, sy + cam.ts * 0.75, 4, 3);
        }
      } else if (t.kind === 'entree' && t.place) {
        // ENTRÉE 2.5D : Encastrement architectural avec auvent et seuil
        const inset = cam.ts * 0.18;
        // Seuil d'ombre
        ctx.fillStyle = 'rgba(12,16,24,0.38)';
        ctx.fillRect(sx + inset, sy + inset, cam.ts * 0.64, cam.ts * 0.64);
        // Panneau de couleur du lieu
        const entryColor = ENTRY_COLORS[t.place] ?? '#d9c39a';
        ctx.fillStyle = entryColor;
        ctx.fillRect(sx + inset + 1, sy + inset + 1, cam.ts * 0.64 - 2, cam.ts * 0.64 - 2);
        // Auvent supérieur en relief
        ctx.fillStyle = 'rgba(255,255,255,0.40)';
        ctx.fillRect(sx + inset, sy + inset, cam.ts * 0.64, Math.max(1, cam.ts * 0.08));
        // Petit liseré d'ombre sous l'auvent
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(sx + inset, sy + inset + cam.ts * 0.08, cam.ts * 0.64, Math.max(1, cam.ts * 0.06));
      } else if (t.kind === 'mur') {
        // VOLUME 2.5D DU BÂTIMENT
        const tileBelow = y < MAP_H - 1 ? tileAt(x, y + 1) : null;
        const isFacadeSouth = tileBelow !== null && tileBelow.kind !== 'mur';

        if (isFacadeSouth) {
          // Façade sud visible en 2.5D : appareil de maçonnerie, corniche et fenêtres
          ctx.fillStyle = '#2d3345'; // mur de façade plus soutenu
          ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);

          // Corniche supérieure éclairée
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fillRect(sx, sy, cam.ts + 0.5, Math.max(1, cam.ts * 0.08));

          // Assises de briques / pierres horizontales
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(sx, sy + cam.ts * 0.32, cam.ts + 0.5, 1);
          ctx.fillRect(sx, sy + cam.ts * 0.68, cam.ts + 0.5, 1);

          // Fenêtre architecturale sur la façade
          const winW = cam.ts * 0.34;
          const winH = cam.ts * 0.38;
          const winX = sx + (cam.ts - winW) / 2;
          const winY = sy + cam.ts * 0.18;

          // Cadre de fenêtre
          ctx.fillStyle = '#171b26';
          ctx.fillRect(winX - 1, winY - 1, winW + 2, winH + 2);

          // Vitre : allumée le soir/la nuit, reflets en journée
          if (isDark) {
            const flick = (Math.sin(now * 0.003 + x * 7 + y) > 0.88) ? 0.8 : 1;
            ctx.fillStyle = `rgba(255,214,120,${0.85 * flick})`;
            ctx.fillRect(winX, winY, winW, winH);
            // Croisillon de fenêtre
            ctx.fillStyle = 'rgba(23,27,38,0.7)';
            ctx.fillRect(winX + winW / 2 - 0.5, winY, 1, winH);
            ctx.fillRect(winX, winY + winH / 2 - 0.5, winW, 1);
          } else {
            ctx.fillStyle = '#5c7894';
            ctx.fillRect(winX, winY, winW, winH);
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(winX, winY, winW * 0.45, winH * 0.45);
          }

          // Ombre projetée de la façade sur le sol en contrebas
          ctx.fillStyle = 'rgba(7,11,18,0.30)';
          ctx.fillRect(sx, sy + cam.ts - 1, cam.ts + 0.5, Math.max(2, cam.ts * 0.18));
        } else {
          // Toit / mur intérieur : texture de tuiles/dalle
          ctx.fillStyle = '#373c4f';
          ctx.fillRect(sx, sy, cam.ts + 0.5, cam.ts + 0.5);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(sx, sy, cam.ts + 0.5, 1);
          ctx.fillStyle = 'rgba(10,13,20,0.18)';
          ctx.fillRect(sx, sy + cam.ts - 1, cam.ts + 0.5, 1);
        }
      }
    }
  }

  // 2. RENDU DES PERSONNAGES TRIÉS PAR PROFONDEUR Y (OCCLUSION NATURELLE 2.5D)
  interface RenderEntity {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    hair: string;
    isPlayer: boolean;
  }

  const entities: RenderEntity[] = [];

  const HAIRS = ['#6b4a2f', '#3a2c22', '#8a6240', '#2c2c33', '#a3542a'];
  const hairOf = (id: string): string => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h += id.charCodeAt(i);
    return HAIRS[h % HAIRS.length]!;
  };

  // Ajout des PNJ dans le champ de vision
  for (const def of Object.values(NPC_BY_ID)) {
    const st = w.npcs[def.id];
    if (!st) continue;
    const p = npcPosition(w, def.id);
    entities.push({
      id: def.id,
      name: def.name,
      x: p.x,
      y: p.y,
      color: def.color,
      hair: hairOf(def.id),
      isPlayer: false,
    });
  }

  // Ajout du Joueur
  entities.push({
    id: 'player',
    name: w.player.name,
    x: w.player.pos.x,
    y: w.player.pos.y,
    color: TOKENS.or,
    hair: '#3a2c22',
    isPlayer: true,
  });

  // Tri par position Y pour respecter l'ordre de profondeur (les personnages au nord sont derrière)
  entities.sort((a, b) => a.y - b.y);

  const s = cam.ts / SPRITE_W;

  for (const ent of entities) {
    const cx = ent.x * cam.ts + cam.ts / 2 - cam.ox;
    const cy = ent.y * cam.ts + cam.ts / 2 - cam.oy;

    // Culling hors écran
    if (cx < -cam.ts * 2 || cx > cw + cam.ts * 2 || cy < -cam.ts * 2 || cy > ch + cam.ts * 2) continue;

    // Ombre au sol orientée
    drawShadow(ctx, cx, cy + cam.ts * 0.12, s);

    // Sprite de personnage
    drawCharacter(ctx, cx, cy + cam.ts * 0.12, s, { hair: ent.hair, shirt: ent.color }, now, false);

    // Nom au-dessus du joueur
    if (ent.isPlayer) {
      ctx.font = `bold ${Math.max(10, Math.floor(cam.ts * 0.36))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      // Ombre portée du texte
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(ent.name, cx + 1, cy - cam.ts * 1.55 + 1);
      ctx.fillStyle = TOKENS.or;
      ctx.fillText(ent.name, cx, cy - cam.ts * 1.55);
    }
  }

  // 3. AMBIANCE LUMINEUSE GLOBALE & MÉTÉO (COUCHES DE LUMIÈRE 2.5D)
  drawAtmosphere(ctx, w, cam, cw, ch, now);
}
