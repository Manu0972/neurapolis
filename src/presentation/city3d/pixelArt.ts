/**
 * Outillage de pixel art pur (aucun DOM, aucun Three.js) : un tampon RGBA, des rectangles, un
 * hachage déterministe. Sert au générateur de façades (facadeAtlas.ts) et reste testable sous Node.
 *
 * Convention : lignes de haut en bas (comme un canevas). Le canal alpha porte un MASQUE
 * D'ÉMISSION (255 = rien ne s'allume, 0 = s'allume pleinement la nuit), pas de transparence.
 */

export type Rgb = readonly [number, number, number];

/** Couleur « #rrggbb » → triplet. */
export function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hachage entier stable de 2 coordonnées et d'une graine → [0, 1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Hachage d'une chaîne (identifiant de bâtiment) → entier non signé. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const little = new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 0x04;

/** Couleur empaquetée sur 32 bits (ordre mémoire R, G, B, A), pour `set32`. */
export function pack(c: Rgb, a = 255): number {
  return little
    ? ((a << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0
    : ((c[0] << 24) | (c[1] << 16) | (c[2] << 8) | a) >>> 0;
}

export class PixelBuffer {
  readonly data: Uint8Array;
  private readonly d32: Uint32Array;

  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint8Array(width * height * 4);
    this.d32 = new Uint32Array(this.data.buffer);
  }

  /** Rectangle plein (coupé aux bords) ; l'alpha (masque d'émission) est remis à `a`. */
  rect(x: number, y: number, w: number, h: number, c: Rgb, a = 255): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
    if (x1 <= x0 || y1 <= y0) return;
    const v = pack(c, a);
    for (let yy = y0; yy < y1; yy++) this.d32.fill(v, yy * this.width + x0, yy * this.width + x1);
  }

  px(x: number, y: number, c: Rgb, a = 255): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.d32[(y | 0) * this.width + (x | 0)] = pack(c, a);
  }

  /** Cadre d'un pixel d'épaisseur. */
  frame(x: number, y: number, w: number, h: number, c: Rgb): void {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }

  /** Masque d'émission (0 = éteint, 1 = pleinement allumé la nuit) sur une zone, sans toucher aux couleurs. */
  glow(x: number, y: number, w: number, h: number, m: number): void {
    const a = 255 - Math.round(Math.max(0, Math.min(1, m)) * 255);
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.width, Math.round(x + w));
    const y1 = Math.min(this.height, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.data[(yy * this.width + xx) * 4 + 3] = a;
  }

  /** Copie d'une zone (y compris le masque) d'un autre tampon, ligne par ligne. */
  blit(src: PixelBuffer, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void {
    let x0 = 0;
    let x1 = w;
    x0 = Math.max(x0, -sx, -dx);
    x1 = Math.min(x1, src.width - sx, this.width - dx);
    if (x1 <= x0) return;
    for (let y = 0; y < h; y++) {
      const ys = sy + y;
      const yd = dy + y;
      if (ys < 0 || ys >= src.height || yd < 0 || yd >= this.height) continue;
      const s = ys * src.width + sx;
      this.d32.set(src.d32.subarray(s + x0, s + x1), yd * this.width + dx + x0);
    }
  }

  /** Remplit une zone en répétant un motif (coordonnées du motif = coordonnées de la zone + décalage). */
  tile(src: PixelBuffer, x: number, y: number, w: number, h: number, ox = 0, oy = 0): void {
    for (let yy = 0; yy < h; yy++) {
      const yd = y + yy;
      if (yd < 0 || yd >= this.height) continue;
      const ys = (((yd + oy) % src.height) + src.height) % src.height;
      let xx = 0;
      while (xx < w) {
        const xs = (((x + xx + ox) % src.width) + src.width) % src.width;
        const run = Math.min(w - xx, src.width - xs);
        const xd = x + xx;
        const a = Math.max(0, -xd);
        const b = Math.min(run, this.width - xd);
        if (b > a) this.d32.set(src.d32.subarray(ys * src.width + xs + a, ys * src.width + xs + b), yd * this.width + xd + a);
        xx += run;
      }
    }
  }

  /** Valeur brute d'un pixel (couleur + masque), pour les copies rapides. */
  get32(x: number, y: number): number {
    return this.d32[y * this.width + x]!;
  }

  set32(x: number, y: number, v: number): void {
    this.d32[y * this.width + x] = v;
  }

  /** Lignes inversées (le haut devient le bas) : pour une texture dont v = 0 est en bas. */
  flipped(): PixelBuffer {
    const out = new PixelBuffer(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      out.d32.set(this.d32.subarray(y * this.width, (y + 1) * this.width), (this.height - 1 - y) * this.width);
    }
    return out;
  }
}
