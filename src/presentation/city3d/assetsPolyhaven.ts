/**
 * Textures Poly Haven (CC0, 1k, couleur + normales OpenGL) de public/assets/libre/polyhaven/.
 * Chargement asynchrone et mis en cache : les matériaux démarrent avec leurs textures
 * procédurales et basculent sur les photos à l'arrivée ; si un fichier manque, rien ne change.
 */
import * as THREE from 'three';
import { assetUrl } from '../asset-loader';

export const PHOTO_FILES = {
  paves: { diff: 'cobblestone_floor_001_diff_1k.jpg', nor: 'cobblestone_floor_001_nor_gl_1k.jpg' },
  briquesSol: { diff: 'brick_floor_003_diffuse_1k.jpg', nor: 'brick_floor_003_nor_gl_1k.jpg' },
  brique: { diff: 'brick_4_diff_1k.jpg', nor: 'brick_4_nor_gl_1k.jpg' },
  enduit: { diff: 'beige_wall_001_diff_1k.jpg', nor: 'beige_wall_001_nor_gl_1k.jpg' },
  tuiles: { diff: 'clay_roof_tiles_02_diff_1k.jpg', nor: 'clay_roof_tiles_02_nor_gl_1k.jpg' },
} as const;
export type PhotoId = keyof typeof PHOTO_FILES;

export interface PhotoSet {
  map: THREE.Texture;
  normal: THREE.Texture;
  /** Couleur moyenne de la photo (linéaire) : sert à la ramener vers la palette. */
  mean: THREE.Color;
}

const cache = new Map<PhotoId, Promise<PhotoSet | null>>();
let loader: THREE.TextureLoader | null = null;

function meanColor(img: CanvasImageSource): THREE.Color {
  const c = new THREE.Color(0.5, 0.5, 0.5);
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 16;
    const ctx = cv.getContext('2d');
    if (!ctx) return c;
    ctx.drawImage(img, 0, 0, 16, 16);
    const d = ctx.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]!; g += d[i + 1]!; b += d[i + 2]!; }
    const n = (d.length / 4) * 255;
    c.setRGB(r / n, g / n, b / n, THREE.SRGBColorSpace);
  } catch { /* image illisible : moyenne neutre */ }
  return c;
}

/** Charge une paire couleur + normales ; `null` si l'un des deux fichiers manque. */
export function loadPhoto(id: PhotoId): Promise<PhotoSet | null> {
  let p = cache.get(id);
  if (p) return p;
  loader ??= new THREE.TextureLoader();
  const f = PHOTO_FILES[id];
  const prep = (t: THREE.Texture, srgb: boolean): THREE.Texture => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  p = Promise.all([
    loader.loadAsync(assetUrl(`libre/polyhaven/${f.diff}`)),
    loader.loadAsync(assetUrl(`libre/polyhaven/${f.nor}`)),
  ]).then(([map, normal]) => ({
    map: prep(map, true),
    normal: prep(normal, false),
    mean: meanColor(map.image as CanvasImageSource),
  })).catch((err: unknown) => {
    console.warn(`[ville] texture Poly Haven indisponible : ${id}`, err);
    return null;
  });
  cache.set(id, p);
  return p;
}

/** Copie d'une texture partagée (même image) avec sa propre répétition. */
export function withRepeat(t: THREE.Texture, repeat: number): THREE.Texture {
  const c = t.clone();
  c.repeat.set(repeat, repeat);
  c.needsUpdate = true;
  return c;
}
