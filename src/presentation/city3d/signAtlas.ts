/**
 * Enseignes de la ville sur une seule page de texture (2026-10-12).
 *
 * Avant : une texture 512 × 96 et un maillage par enseigne (≈ 650 textures, ≈ 170 Mo de
 * mémoire graphique, un appel de dessin chacune). Ici : des cases de 256 × 32 px (40 px/m pour
 * une enseigne de 6,4 m) dans un canevas partagé, dessinées en pixel art (planche bordée de
 * brun, lettres nettes sans anticrénelage, ombre portée d'un pixel) et redessinées à la demande
 * quand un commerce change de nom. Le dessin est différé jusqu'au rendu suivant.
 */
import * as THREE from 'three';

export const SIGN_SLOT_W = 256;
export const SIGN_SLOT_H = 32;
const PAGE_W = 2048;
const PER_ROW = PAGE_W / SIGN_SLOT_W;
const OUTLINE = '#2a1a14';
const INK = '#f9ecd0';

interface Slot { x: number; y: number; w: number; text: string; bg: string; drawn: string }

function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number): number => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export class SignAtlas {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  readonly material: THREE.MeshStandardMaterial;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scratch: CanvasRenderingContext2D;
  private readonly slots: Slot[] = [];
  private readonly pending = new Set<number>();

  constructor(capacity: number) {
    const rows = Math.max(1, Math.ceil(capacity / PER_ROW));
    this.canvas = document.createElement('canvas');
    this.canvas.width = PAGE_W;
    this.canvas.height = rows * SIGN_SLOT_H;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    const sc = document.createElement('canvas');
    sc.width = SIGN_SLOT_W;
    sc.height = SIGN_SLOT_H;
    const scratch = sc.getContext('2d', { willReadFrequently: true });
    if (!ctx || !scratch) throw new Error('Canvas 2D indisponible pour les enseignes.');
    this.ctx = ctx;
    this.scratch = scratch;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.anisotropy = 8;
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      emissiveMap: this.texture,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0,
      roughness: 0.75,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });
    // Dessin différé : les enseignes changées depuis l'image précédente sont peintes juste avant l'envoi.
    this.material.onBeforeRender = () => { if (this.pending.size) this.flush(); };
  }

  get count(): number { return this.slots.length; }

  /** Réserve une case pour une enseigne de proportions w/h (en mètres). */
  add(widthM: number, heightM: number): number {
    const i = this.slots.length;
    const w = Math.max(48, Math.min(SIGN_SLOT_W, Math.round((SIGN_SLOT_H * widthM) / heightM)));
    this.slots.push({ x: (i % PER_ROW) * SIGN_SLOT_W, y: Math.floor(i / PER_ROW) * SIGN_SLOT_H, w, text: '', bg: '', drawn: '' });
    return i;
  }

  /** UV de la case (u0, v0, u1, v1) ; v = 0 en bas de la page. */
  uv(slot: number): [number, number, number, number] {
    const s = this.slots[slot]!;
    const H = this.canvas.height;
    return [s.x / PAGE_W, 1 - (s.y + SIGN_SLOT_H) / H, (s.x + s.w) / PAGE_W, 1 - s.y / H];
  }

  set(slot: number, text: string, bg: string): void {
    const s = this.slots[slot];
    if (!s) return;
    s.text = text;
    s.bg = bg;
    if (s.drawn !== `${text}|${bg}`) this.pending.add(slot);
  }

  /** Peint les enseignes en attente et envoie la page à la carte graphique. */
  flush(): void {
    for (const i of this.pending) this.draw(this.slots[i]!);
    this.pending.clear();
    this.texture.needsUpdate = true;
  }

  private draw(s: Slot): void {
    const g = this.ctx;
    const { x, y, w } = s;
    const h = SIGN_SLOT_H;
    // Planche : contour brun, biseau clair en haut, ombre en bas, deux vis.
    g.fillStyle = OUTLINE;
    g.fillRect(x, y, w, h);
    g.fillStyle = s.bg;
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = shadeHex(s.bg, 1.35);
    g.fillRect(x + 1, y + 1, w - 2, 1);
    g.fillStyle = shadeHex(s.bg, 0.7);
    g.fillRect(x + 1, y + h - 3, w - 2, 2);
    g.fillStyle = shadeHex(s.bg, 1.6);
    g.fillRect(x + 3, y + 3, 2, 2);
    g.fillRect(x + w - 5, y + 3, 2, 2);
    // Lettres : tracées sur un brouillon puis seuillées (pixels pleins, sans flou).
    const sc = this.scratch;
    sc.clearRect(0, 0, SIGN_SLOT_W, SIGN_SLOT_H);
    let size = 22;
    const font = (n: number): string => `700 ${n}px Georgia, 'Times New Roman', serif`;
    sc.font = font(size);
    while (size > 9 && sc.measureText(s.text).width > w - 12) sc.font = font((size -= 1));
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';
    sc.fillStyle = INK;
    sc.fillText(s.text, w / 2, h / 2 + 1);
    const glyphs = sc.getImageData(0, 0, w, h);
    const board = g.getImageData(x, y, w, h);
    const src = glyphs.data;
    const dst = board.data;
    const shadow = [0x2a, 0x1a, 0x14];
    // Ombre portée (décalée d'un pixel), puis les lettres.
    for (let py = 0; py < h - 1; py++) {
      for (let px = 0; px < w - 1; px++) {
        const i = (py * w + px) * 4;
        if (src[i + 3]! < 115) continue;
        const j = ((py + 1) * w + px + 1) * 4;
        dst[j] = shadow[0]!; dst[j + 1] = shadow[1]!; dst[j + 2] = shadow[2]!;
      }
    }
    for (let i = 0; i < src.length; i += 4) {
      if (src[i + 3]! < 115) continue;
      dst[i] = src[i]!; dst[i + 1] = src[i + 1]!; dst[i + 2] = src[i + 2]!; dst[i + 3] = 255;
    }
    g.putImageData(board, x, y);
    s.drawn = `${s.text}|${s.bg}`;
  }

  dispose(): void {
    this.texture.dispose();
    this.material.dispose();
  }
}
