/**
 * Recolorage des modèles riggés (partie Three.js). Voir `recolorLogic.ts` pour la méthode et ses
 * limites : masque reconstruit zone + couleur (un seul matériau texturé), teinte appliquée dans le
 * shader en gardant le relief de lumière de la texture peinte.
 */
import * as THREE from 'three';
import { hexToRgb, luminance, regionOf, REGIONS, zoneOf, ZONE_CODE, ZONE_NAMES, type RecolorSpec, type Rgb } from './recolorLogic';

export interface RecolorMask {
  /** Peau / cheveux / haut (canaux R, V, B). */
  texture: THREE.Texture;
  /** Bas / chaussures (canaux R, V). */
  texture2: THREE.Texture;
  /** Luminance moyenne des texels de chaque région, dans l'ordre de `REGIONS` (garde les ombres peintes). */
  ref: number[];
  /** Quelles régions existent vraiment (évite de teinter du vide). */
  has: boolean[];
}

const MAX_SIDE = 1024;

/** Masque d'un modèle (une fois par modèle), ou `null` si la texture n'est pas lisible. */
export function buildRecolorMask(template: THREE.Object3D): RecolorMask | null {
  if (typeof document === 'undefined') return null;
  let found: THREE.SkinnedMesh | null = null;
  template.traverse((o) => { if (!found && (o as THREE.SkinnedMesh).isSkinnedMesh) found = o as THREE.SkinnedMesh; });
  const m = found as THREE.SkinnedMesh | null;
  const mat = m?.material as THREE.MeshStandardMaterial | undefined;
  const img = mat?.map?.image as (CanvasImageSource & { width?: number; height?: number }) | undefined;
  const geo = m?.geometry;
  const uv = geo?.getAttribute('uv');
  const pos = geo?.getAttribute('position');
  if (!m || !geo || !uv || !pos || !img || !img.width || !img.height) return null;
  try {
    const w = Math.min(MAX_SIDE, img.width);
    const h = Math.min(MAX_SIDE, img.height);
    const tex = document.createElement('canvas');
    tex.width = w;
    tex.height = h;
    const tctx = tex.getContext('2d', { willReadFrequently: true })!;
    tctx.drawImage(img, 0, 0, w, h);
    const pix = tctx.getImageData(0, 0, w, h).data;

    // Hauteur relative et centre de la tête (z) en pose de repos.
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const H = Math.max(1e-6, bb.max.y - bb.min.y);
    let headZ = 0;
    let headN = 0;
    for (let i = 0; i < pos.count; i++) {
      if ((pos.getY(i) - bb.min.y) / H > 0.88) { headZ += pos.getZ(i); headN++; }
    }
    headZ = headN ? headZ / headN : 0;
    const index = geo.getIndex();
    const triCount = index ? index.count / 3 : pos.count / 3;
    const zm = document.createElement('canvas');
    zm.width = w;
    zm.height = h;
    const zctx = zm.getContext('2d', { willReadFrequently: true })!;
    zctx.imageSmoothingEnabled = false;
    zctx.lineWidth = 1;
    for (let t = 0; t < triCount; t++) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(t * 3 + k) : t * 3 + k));
      let cy = 0;
      let cz = 0;
      for (const i of ids) { cy += pos.getY(i); cz += pos.getZ(i); }
      cy = (cy / 3 - bb.min.y) / H;
      cz = (cz / 3 - headZ) / H;
      const col = `rgb(${ZONE_CODE[zoneOf(cy, cz)] * 50},0,0)`;
      zctx.fillStyle = col;
      zctx.strokeStyle = col;
      zctx.beginPath();
      ids.forEach((i, k) => {
        const px = uv.getX(i) * w;
        const py = uv.getY(i) * h;
        if (k === 0) zctx.moveTo(px, py); else zctx.lineTo(px, py);
      });
      zctx.closePath();
      zctx.fill();
      zctx.stroke();
    }
    const zpix = zctx.getImageData(0, 0, w, h).data;

    // Teint de référence : moyenne des texels du visage qui ressemblent à de la peau.
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let sn = 0;
    for (let p = 0; p < w * h; p++) {
      if (Math.round(zpix[p * 4]! / 50) !== ZONE_CODE.visage || zpix[p * 4 + 3]! < 200) continue;
      const r = pix[p * 4]! / 255;
      const g = pix[p * 4 + 1]! / 255;
      const b = pix[p * 4 + 2]! / 255;
      if (r > g && g >= b * 0.9 && r - b > 0.05 && r - b < 0.6 && r > 0.2) { sr += r; sg += g; sb += b; sn++; }
    }
    if (sn < 50) return null;
    const skinRef: Rgb = [sr / sn, sg / sn, sb / sn];

    // Deux masques opaques (pas de canal alpha : le canevas prémultiplie et perdrait les couleurs).
    const outs = [document.createElement('canvas'), document.createElement('canvas')];
    const ctxs = outs.map((c) => { c.width = w; c.height = h; return c.getContext('2d')!; });
    const ods = ctxs.map((c) => c.createImageData(w, h));
    const sums = REGIONS.map(() => 0);
    const cnt = REGIONS.map(() => 0);
    for (let p = 0; p < w * h; p++) {
      const zone = ZONE_NAMES[Math.round(zpix[p * 4]! / 50)] ?? 'fond';
      const c: Rgb = [pix[p * 4]! / 255, pix[p * 4 + 1]! / 255, pix[p * 4 + 2]! / 255];
      const reg = regionOf(zone, c, skinRef);
      if (reg) {
        const i = REGIONS.indexOf(reg);
        ods[i < 3 ? 0 : 1]!.data[p * 4 + (i < 3 ? i : i - 3)] = 255;
        sums[i]! += luminance(c);
        cnt[i]!++;
      }
      ods[0]!.data[p * 4 + 3] = 255;
      ods[1]!.data[p * 4 + 3] = 255;
    }
    const [texture, texture2] = outs.map((c, i) => {
      ctxs[i]!.putImageData(ods[i]!, 0, 0);
      const t = new THREE.CanvasTexture(c);
      t.flipY = false;
      t.colorSpace = THREE.NoColorSpace;
      return t;
    }) as unknown as [THREE.Texture, THREE.Texture];
    const ref = sums.map((sm, i) => Math.max(0.02, cnt[i]! > 0 ? sm / cnt[i]! : 0.3));
    return { texture, texture2, ref, has: cnt.map((n) => n > 200) };
  } catch {
    return null;
  }
}

export interface RecolorHandle {
  set(spec: RecolorSpec | undefined): void;
  dispose(): void;
}

/**
 * Remplace les matériaux du modèle cloné par des copies recolorables. `set` change les teintes
 * à chaud (aperçu du créateur) ; une région absente de `spec` garde les couleurs du modèle.
 */
export function applyRecolor(model: THREE.Object3D, mask: RecolorMask): RecolorHandle {
  const uniforms = {
    uMask: { value: mask.texture },
    uMask2: { value: mask.texture2 },
    uTint: { value: REGIONS.map(() => new THREE.Color()) },
    uOn: { value: REGIONS.map(() => 0) },
    uRef: { value: [...mask.ref] },
  };
  const clones: THREE.Material[] = [];
  model.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh) return;
    const mat = (sm.material as THREE.MeshStandardMaterial).clone();
    mat.onBeforeCompile = (shader): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uMask;\nuniform sampler2D uMask2;\nuniform vec3 uTint[5];\nuniform float uOn[5];\nuniform float uRef[5];')
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 m1 = texture2D(uMask, vMapUv).rgb;
          vec2 m2 = texture2D(uMask2, vMapUv).rg;
          float w[5];
          w[0] = m1.r; w[1] = m1.g; w[2] = m1.b; w[3] = m2.r; w[4] = m2.g;
          float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          for (int i = 0; i < 5; i++) {
            float k = clamp(lum / uRef[i], 0.3, 1.8);
            diffuseColor.rgb = mix(diffuseColor.rgb, uTint[i] * k, w[i] * uOn[i]);
          }
        }`);
    };
    mat.customProgramCacheKey = (): string => 'neurapolis-recolor-5';
    sm.material = mat;
    clones.push(mat);
  });
  return {
    set(spec): void {
      REGIONS.forEach((k, i) => {
        const hx = spec?.[k];
        const on = !!hx && mask.has[i]!;
        if (on) {
          const [r, g, b] = hexToRgb(hx!);
          uniforms.uTint.value[i]!.setRGB(r, g, b, THREE.SRGBColorSpace);
        }
        uniforms.uOn.value[i] = on ? 1 : 0;
      });
    },
    dispose(): void { for (const m of clones) m.dispose(); },
  };
}
