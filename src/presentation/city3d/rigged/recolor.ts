/**
 * Recolorage des modèles riggés (partie Three.js). Voir `recolorLogic.ts` pour la méthode et ses
 * limites : masque reconstruit zone + couleur (un seul matériau texturé), teinte appliquée dans le
 * shader en gardant le relief de lumière de la texture peinte.
 */
import * as THREE from 'three';
import { hexToRgb, labelTexel, luminance, zoneOf, ZONE_CODE, type RecolorSpec, type RigZone, type Rgb } from './recolorLogic';

export interface RecolorMask {
  texture: THREE.Texture;
  /** Luminance moyenne des texels peau / cheveux / tenue (pour garder les ombres peintes). */
  ref: [number, number, number];
  /** Quelles régions existent vraiment (évite de teinter du vide). */
  has: [boolean, boolean, boolean];
}

const MAX_SIDE = 1024;
const ZONE_NAMES: RigZone[] = ['fond', 'cheveux', 'visage', 'torse', 'reste'];

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

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const octx = out.getContext('2d')!;
    const od = octx.createImageData(w, h);
    const sums = [0, 0, 0];
    const cnt = [0, 0, 0];
    for (let p = 0; p < w * h; p++) {
      const zone = ZONE_NAMES[Math.round(zpix[p * 4]! / 50)] ?? 'fond';
      const c: Rgb = [pix[p * 4]! / 255, pix[p * 4 + 1]! / 255, pix[p * 4 + 2]! / 255];
      const lab = labelTexel(zone, c, skinRef);
      const lum = luminance(c);
      if (lab.skin) { od.data[p * 4] = 255; sums[0]! += lum; cnt[0]!++; }
      if (lab.hair) { od.data[p * 4 + 1] = 255; sums[1]! += lum; cnt[1]!++; }
      if (lab.outfit) { od.data[p * 4 + 2] = 255; sums[2]! += lum; cnt[2]!++; }
      od.data[p * 4 + 3] = 255;
    }
    octx.putImageData(od, 0, 0);
    const texture = new THREE.CanvasTexture(out);
    texture.flipY = false;
    texture.colorSpace = THREE.NoColorSpace;
    const ref = sums.map((s, i) => Math.max(0.02, cnt[i]! > 0 ? s / cnt[i]! : 0.3)) as [number, number, number];
    return { texture, ref, has: [cnt[0]! > 200, cnt[1]! > 200, cnt[2]! > 200] };
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
    uTint: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
    uOn: { value: new THREE.Vector3(0, 0, 0) },
    uRef: { value: new THREE.Vector3(mask.ref[0], mask.ref[1], mask.ref[2]) },
  };
  const clones: THREE.Material[] = [];
  model.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh) return;
    const mat = (sm.material as THREE.MeshStandardMaterial).clone();
    mat.onBeforeCompile = (shader): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uMask;\nuniform vec3 uTint[3];\nuniform vec3 uOn;\nuniform vec3 uRef;')
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 rm = texture2D(uMask, vMapUv).rgb;
          float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          vec3 k = clamp(vec3(lum) / uRef, vec3(0.3), vec3(1.8));
          diffuseColor.rgb = mix(diffuseColor.rgb, uTint[0] * k.x, rm.r * uOn.x);
          diffuseColor.rgb = mix(diffuseColor.rgb, uTint[1] * k.y, rm.g * uOn.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, uTint[2] * k.z, rm.b * uOn.z);
        }`);
    };
    mat.customProgramCacheKey = (): string => 'neurapolis-recolor';
    sm.material = mat;
    clones.push(mat);
  });
  return {
    set(spec): void {
      [spec?.skin, spec?.hair, spec?.outfit].forEach((hx, i) => {
        const on = !!hx && mask.has[i]!;
        if (on) {
          const [r, g, b] = hexToRgb(hx!);
          uniforms.uTint.value[i]!.setRGB(r, g, b, THREE.SRGBColorSpace);
        }
        uniforms.uOn.value.setComponent(i, on ? 1 : 0);
      });
    },
    dispose(): void { for (const m of clones) m.dispose(); },
  };
}
