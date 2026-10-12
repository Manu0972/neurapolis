/**
 * Textures procédurales de la ville (Canvas 2D → THREE.CanvasTexture), générées une seule fois.
 * Aucune image externe : le jeu reste léger et chaque matériau garde la palette chaude de la DA.
 * Convention d'UV des sols : 1 unité de texture = 1 m.
 */
import * as THREE from 'three';
import { moduleBuffer } from './facadeAtlas';

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

// ---------- Immeubles lointains ----------

/**
 * Une travée de façade en pixel art (générateur de facadeAtlas.ts), en texture répétée, pour la
 * couronne d'immeubles au-delà des limites de la carte. Les façades de la ville elle-même
 * utilisent l'atlas complet (facadeMaterial.ts).
 */
export function skylineTexture(variantId: string): THREE.Texture {
  return cached(`skyline_${variantId}`, () => {
    const px = moduleBuffer(variantId).flipped();
    const data = px.data;
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    const t = new THREE.DataTexture(data, px.width, px.height, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.repeat.set(4, 4);
    t.needsUpdate = true;
    return t;
  });
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
