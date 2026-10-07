/**
 * Textures procédurales de la ville (Canvas 2D → THREE.CanvasTexture), générées une seule fois.
 * Aucune image externe : le jeu reste léger et chaque matériau garde la palette chaude de la DA.
 * Convention d'UV : 1 unité de texture = 1 « module » de façade (3 m × 1 étage) ou 1 m de sol.
 */
import * as THREE from 'three';
import type { FacadeStyle } from '../../data/city/layout';

/** Hasard visuel déterministe (présentation uniquement, jamais le PRNG du monde). */
export function visualRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible pour les textures.');
  return [c, ctx];
}

function finish(c: HTMLCanvasElement, opts: { repeat?: boolean; srgb?: boolean; aniso?: number } = {}): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (opts.repeat !== false) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = opts.aniso ?? 8;
  t.needsUpdate = true;
  return t;
}

/** Bruit grenu (asphalte, crépi, terre). */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], rnd: () => number, size = 1.5): void {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)]!;
    const s = size * (0.5 + rnd());
    ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

const cache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture): THREE.Texture {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

// ---------- Sols (1 unité UV = 1 m, la texture couvre 4 m) ----------

export function asphaltTexture(): THREE.Texture {
  return cached('asphalt', () => {
    const [c, ctx] = canvas(512, 512);
    const rnd = visualRng(11);
    ctx.fillStyle = '#4a4a4f';
    ctx.fillRect(0, 0, 512, 512);
    speckle(ctx, 512, 512, 26000, ['#3f3f44', '#55555a', '#5d5c60', '#47464b', '#6a6966'], rnd, 2);
    // Réparations et fissures discrètes.
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rnd() > 0.5 ? '#38383c' : '#58585c';
      ctx.fillRect(rnd() * 512, rnd() * 512, 40 + rnd() * 120, 20 + rnd() * 60);
    }
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#2f2f33';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      let x = rnd() * 512;
      let y = rnd() * 512;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (rnd() - 0.5) * 40;
        y += (rnd() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function sidewalkTexture(): THREE.Texture {
  return cached('sidewalk', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(23);
    // Dalles de 1 m (64 px) légèrement irrégulières.
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const v = 168 + Math.floor(rnd() * 22);
        ctx.fillStyle = `rgb(${v + 6},${v + 2},${v - 6})`;
        ctx.fillRect(x * 64, y * 64, 64, 64);
      }
    }
    speckle(ctx, 256, 256, 5000, ['#a9a49a', '#c4bfb4', '#9d978c'], rnd, 1.4);
    ctx.strokeStyle = '#8c867c';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(256, i * 64); ctx.stroke();
    }
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function cobbleTexture(): THREE.Texture {
  return cached('cobble', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(37);
    ctx.fillStyle = '#7d7468';
    ctx.fillRect(0, 0, 256, 256);
    // Pavés de 25 cm, rangs décalés.
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? 8 : 0;
      for (let col = -1; col < 16; col++) {
        const v = 130 + Math.floor(rnd() * 45);
        ctx.fillStyle = `rgb(${v + 10},${v},${v - 14})`;
        ctx.beginPath();
        ctx.roundRect(col * 16 + off + 1, row * 16 + 1, 14, 14, 3);
        ctx.fill();
      }
    }
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function grassTexture(): THREE.Texture {
  return cached('grass', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(41);
    ctx.fillStyle = '#5f8a3e';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 14000, ['#557d36', '#6b9946', '#4d7231', '#78a650', '#668f40'], rnd, 2.2);
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function dirtTexture(): THREE.Texture {
  return cached('dirt', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(53);
    ctx.fillStyle = '#7a6448';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 12000, ['#6c5840', '#8a7354', '#5e4c36', '#93806a', '#6f6a5a'], rnd, 2.5);
    // Touffes d'herbe folle de la friche.
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = rnd() > 0.5 ? '#6d7a3e' : '#5d6a34';
      ctx.beginPath();
      ctx.arc(rnd() * 256, rnd() * 256, 3 + rnd() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function gravelTexture(): THREE.Texture {
  return cached('gravel', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(59);
    ctx.fillStyle = '#b8a888';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 16000, ['#a89878', '#c9baa0', '#9b8b6c', '#d4c6aa'], rnd, 2);
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function parkingTexture(): THREE.Texture {
  return cached('parking', () => {
    const [c, ctx] = canvas(512, 512);
    const rnd = visualRng(61);
    ctx.fillStyle = '#56565a';
    ctx.fillRect(0, 0, 512, 512);
    speckle(ctx, 512, 512, 20000, ['#4c4c50', '#626266', '#5a5a5e'], rnd, 2);
    // Places de 2,5 m (texture = 10 m).
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 230); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, 282); ctx.lineTo(x, 512); ctx.stroke();
    }
    const t = finish(c);
    t.repeat.set(0.1, 0.1);
    return t;
  });
}

export function playgroundTexture(): THREE.Texture {
  return cached('playground', () => {
    const [c, ctx] = canvas(128, 128);
    const rnd = visualRng(67);
    ctx.fillStyle = '#b5523e';
    ctx.fillRect(0, 0, 128, 128);
    speckle(ctx, 128, 128, 3000, ['#a64a38', '#c25e48'], rnd, 1.5);
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

// ---------- Façades (1 unité UV = 1 module de 3 m × 1 étage) ----------

interface FacadePalette { wall: string; wall2: string; frame: string; shutter?: string; brick?: boolean; band?: string }

const FACADE_PALETTES: Record<FacadeStyle, FacadePalette> = {
  brique: { wall: '#9a4f3a', wall2: '#874433', frame: '#efe6d6', brick: true },
  enduit_creme: { wall: '#e6d6b8', wall2: '#d8c6a4', frame: '#f6efe2', shutter: '#5f7f6a' },
  enduit_ocre: { wall: '#d6a25e', wall2: '#c6924f', frame: '#f4ead8', shutter: '#7a4a2c' },
  enduit_rose: { wall: '#d9a291', wall2: '#c98f7e', frame: '#f5ece0', shutter: '#4e6a84' },
  pierre: { wall: '#cbbd9f', wall2: '#bcae8f', frame: '#efe5d0', band: '#b3a483' },
  hlm: { wall: '#e0d7c6', wall2: '#cfc5b2', frame: '#f1ece2', band: '#c96d4f' },
  ecole: { wall: '#c99a6a', wall2: '#b98a5b', frame: '#f3ead9', brick: true, band: '#e8dcc4' },
  industriel: { wall: '#6e4a3a', wall2: '#5a3c30', frame: '#3b3633', brick: true },
  civique: { wall: '#ddc9a2', wall2: '#cfb990', frame: '#f6eedd', band: '#b58f5c' },
  hyper: { wall: '#d6dbe0', wall2: '#c3c9cf', frame: '#9aa3ab', band: '#2f6db0' },
};

/** Texture d'un module de façade : mur + fenêtre (cadre, allège, volets selon le style). */
export function facadeTexture(style: FacadeStyle): THREE.Texture {
  return cached(`facade_${style}`, () => {
    const W = 192; // 3 m
    const H = 205; // 3,2 m
    const [c, ctx] = canvas(W, H);
    const p = FACADE_PALETTES[style];
    const rnd = visualRng(style.length * 97 + 3);
    ctx.fillStyle = p.wall;
    ctx.fillRect(0, 0, W, H);
    if (p.brick) {
      // Briques de 24 × 8 cm environ (15 × 5 px).
      for (let y = 0; y < H; y += 5) {
        const off = (y / 5) % 2 ? 7 : 0;
        for (let x = -off; x < W; x += 15) {
          const k = rnd();
          ctx.fillStyle = k > 0.66 ? p.wall2 : k > 0.33 ? p.wall : shade(p.wall, 0.92);
          ctx.fillRect(x, y, 14, 4);
        }
      }
    } else {
      speckle(ctx, W, H, 2200, [p.wall2, shade(p.wall, 1.04), shade(p.wall, 0.96)], rnd, 1.6);
    }
    if (p.band) {
      ctx.fillStyle = p.band;
      ctx.fillRect(0, H - 8, W, 8); // bandeau d'étage
    }
    if (style === 'hyper') {
      // Bardage métallique à nervures, sans fenêtre.
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      for (let x = 0; x < W; x += 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      return finish(c);
    }
    // Fenêtre : 1,2 m × 1,6 m centrée, allège à 0,9 m.
    const ww = style === 'industriel' ? 120 : style === 'hlm' ? 96 : 78;
    const wh = style === 'industriel' ? 120 : 104;
    const wx = (W - ww) / 2;
    const wy = H - 58 - wh;
    ctx.fillStyle = p.frame;
    ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 14);
    ctx.fillStyle = '#2b3442';
    ctx.fillRect(wx, wy, ww, wh);
    // Reflet du ciel dans la vitre.
    const g = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    g.addColorStop(0, 'rgba(170,200,230,0.55)');
    g.addColorStop(0.5, 'rgba(90,120,150,0.25)');
    g.addColorStop(1, 'rgba(40,50,70,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = p.frame;
    ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh); // meneau
    ctx.fillRect(wx, wy + wh * 0.33, ww, 3);  // traverse
    // Allège / appui.
    ctx.fillStyle = shade(p.frame, 0.85);
    ctx.fillRect(wx - 10, wy + wh + 4, ww + 20, 6);
    if (p.shutter) {
      ctx.fillStyle = p.shutter;
      ctx.fillRect(wx - 34, wy - 4, 26, wh + 8);
      ctx.fillRect(wx + ww + 8, wy - 4, 26, wh + 8);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = wy; y < wy + wh; y += 7) {
        ctx.fillRect(wx - 34, y, 26, 2);
        ctx.fillRect(wx + ww + 8, y, 26, 2);
      }
    }
    if (style === 'hlm') {
      // Garde-corps de loggia.
      ctx.fillStyle = 'rgba(60,60,60,0.55)';
      ctx.fillRect(wx - 10, wy + wh * 0.62, ww + 20, 3);
      for (let x = wx - 10; x < wx + ww + 10; x += 8) ctx.fillRect(x, wy + wh * 0.62, 2, wh * 0.38);
    }
    if (style === 'industriel') {
      // Vitres brisées et suie.
      ctx.fillStyle = 'rgba(20,20,20,0.6)';
      for (let i = 0; i < 6; i++) ctx.fillRect(wx + rnd() * ww, wy + rnd() * wh, 10 + rnd() * 14, 8 + rnd() * 12);
    }
    return finish(c);
  });
}

/** Carte d'émission des fenêtres la nuit : 4 × 4 modules, environ 45 % de fenêtres allumées. */
export function facadeEmissiveTexture(style: FacadeStyle): THREE.Texture {
  return cached(`facade_em_${style}`, () => {
    const W = 192;
    const H = 205;
    const [c, ctx] = canvas(W * 4, H * 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W * 4, H * 4);
    if (style === 'hyper' || style === 'industriel') return finish(c);
    const rnd = visualRng(style.length * 131 + 7);
    const ww = style === 'hlm' ? 96 : 78;
    const wh = 104;
    for (let my = 0; my < 4; my++) {
      for (let mx = 0; mx < 4; mx++) {
        if (rnd() > 0.45) continue;
        const wx = mx * W + (W - ww) / 2;
        const wy = my * H + H - 58 - wh;
        const warm = rnd();
        ctx.fillStyle = warm > 0.25 ? '#ffc477' : '#d8e6ff';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      }
    }
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

/** Vitrine de rez-de-chaussée (un module de 3 m) : grande baie, store, soubassement. */
export function shopfrontTexture(awning: string): THREE.Texture {
  return cached(`shop_${awning}`, () => {
    const W = 192;
    const H = 205;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#3a2f2a';
    ctx.fillRect(0, 0, W, H);
    // Soubassement.
    ctx.fillStyle = '#5a4a40';
    ctx.fillRect(0, H - 22, W, 22);
    // Baie vitrée.
    const g = ctx.createLinearGradient(0, 40, 0, H - 22);
    g.addColorStop(0, '#9fb8c9');
    g.addColorStop(1, '#4c5d6b');
    ctx.fillStyle = g;
    ctx.fillRect(10, 52, W - 20, H - 80);
    ctx.fillStyle = 'rgba(255,240,210,0.18)';
    ctx.fillRect(10, 52, W - 20, H - 80);
    ctx.fillStyle = '#2a211c';
    ctx.fillRect(W / 2 - 2, 52, 4, H - 80);
    // Store banne rayé.
    for (let x = 0; x < W; x += 24) {
      ctx.fillStyle = (x / 24) % 2 ? awning : '#f4ead8';
      ctx.fillRect(x, 18, 24, 26);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 42, W, 6);
    return finish(c);
  });
}

export function shopfrontEmissiveTexture(): THREE.Texture {
  return cached('shop_em', () => {
    const [c, ctx] = canvas(192, 205);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 192, 205);
    ctx.fillStyle = '#ffd59a';
    ctx.fillRect(10, 52, 172, 125);
    return finish(c);
  });
}

export function roofTileTexture(): THREE.Texture {
  return cached('roof_tiles', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(71);
    ctx.fillStyle = '#a4533b';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      const off = (y / 16) % 2 ? 10 : 0;
      for (let x = -off; x < 256; x += 20) {
        const v = rnd();
        ctx.fillStyle = v > 0.6 ? '#b45f44' : v > 0.3 ? '#9a4a34' : '#8c432f';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, 18, 14, 5);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y + 13, 256, 3);
    }
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

export function flatRoofTexture(): THREE.Texture {
  return cached('roof_flat', () => {
    const [c, ctx] = canvas(256, 256);
    const rnd = visualRng(73);
    ctx.fillStyle = '#7d7a74';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 9000, ['#6f6c66', '#8a8780', '#75726c', '#94918a'], rnd, 2);
    const t = finish(c);
    t.repeat.set(0.25, 0.25);
    return t;
  });
}

/** Enseigne : texte clair sur bandeau coloré. Une texture par enseigne (non partagée). */
export function signTexture(text: string, bg: string, fg = '#fbf3e2'): THREE.CanvasTexture {
  const [c, ctx] = canvas(512, 96);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 84);
  ctx.fillStyle = fg;
  let size = 50;
  ctx.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
  while (ctx.measureText(text).width > 470 && size > 18) {
    size -= 2;
    ctx.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 50);
  return finish(c, { repeat: false }) as THREE.CanvasTexture;
}

/** Halo doux pour les lampadaires (sprite additif). */
export function glowTexture(): THREE.Texture {
  return cached('glow', () => {
    const [c, ctx] = canvas(128, 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,220,160,1)');
    g.addColorStop(0.25, 'rgba(255,200,130,0.55)');
    g.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return finish(c, { repeat: false });
  });
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
}
