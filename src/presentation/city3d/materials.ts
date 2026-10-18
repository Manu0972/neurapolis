/**
 * Finition des matériaux de la ville, entièrement procédurale (aucun fichier externe) :
 * - façades : relief tiré de l'atlas pixel art (briques, joints, cadres de fenêtres en creux),
 *   occlusion au pied des murs, ombre sous chaque corniche/balcon, coulures et salissures,
 *   légère variation de teinte d'un bâtiment à l'autre ;
 * - sols : relief (bump) des pavés, dalles et asphalte, sol mouillé et flaques sous la pluie,
 *   variation lente de l'herbe ;
 * Les réglages communs (pluie, relief selon la qualité) passent par des uniformes partagés :
 * un seul programme par matériau, rien à recompiler quand la météo ou la qualité change.
 */
import * as THREE from 'three';
import { FLOOR_H } from '../../data/city/layout';
import { FACADE_VARIANTS, facadeAtlas, type AtlasTile } from './facadeAtlas';

/** Uniformes partagés par tous les matériaux enrichis. */
export const CITY_UNIFORMS = {
  uWet: { value: 0 },
  uWetTint: { value: new THREE.Color('#9fb2c4') },
  uRelief: { value: 1 },
};

/** Bruit de valeur 2D lissé (GLSL), utilisé pour les salissures et les flaques. */
export const NOISE_GLSL = /* glsl */ `
float nHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(nHash(i), nHash(i + vec2(1.0, 0.0)), u.x), mix(nHash(i + vec2(0.0, 1.0)), nHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 nPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = normalize(dFdx(surfPos)); vec3 sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm); vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

/** Ajoute vWPos (position monde), vWN (normale monde) et vWNy (sa composante verticale) au vertex shader. */
function addWorldVaryings(shader: { vertexShader: string; fragmentShader: string }): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nvarying float vWNy;')
    .replace('#include <project_vertex>', `#include <project_vertex>
{
  vec4 nWp = vec4(transformed, 1.0);
  vec3 nWn = objectNormal;
#ifdef USE_INSTANCING
  nWp = instanceMatrix * nWp;
  nWn = mat3(instanceMatrix) * nWn;
#endif
  vWPos = (modelMatrix * nWp).xyz;
  vWN = normalize(mat3(modelMatrix) * nWn);
  vWNy = vWN.y;
}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nvarying float vWNy;\n${NOISE_GLSL}`);
}

// ---------- Textures photo (Poly Haven) sur les murs aveugles, pignons et toits ----------

/** Matière photo d'un carreau de l'atlas : 1 = tuiles, 2 = brique, 3 = enduit. */
const PHOTO_KIND = { tuiles: 1, brique: 2, enduit: 3 } as const;
/** Mètres couverts par une répétition de chaque photo (tuiles, brique, enduit). */
export const FACADE_PHOTO_METERS = { tuiles: 2.4, brique: 1.8, enduit: 3 } as const;

/**
 * Carreaux de l'atlas qui reçoivent une photo : murs sans fenêtres (`wall:*`, pignons, souches)
 * selon la matière de la variante, et toits en tuiles ou en ardoise. La couleur moyenne du
 * carreau pixel art garde la teinte de la DA : la photo n'apporte que le détail et le relief.
 */
function facadePhotoEntries(): { rect: THREE.Vector4; info: THREE.Vector4 }[] {
  const a = facadeAtlas();
  const mean = (t: AtlasTile): THREE.Color => {
    const x0 = Math.floor(t.u * a.width), x1 = Math.ceil((t.u + t.du) * a.width);
    const y0 = Math.floor(t.v * a.height), y1 = Math.ceil((t.v + t.dv) * a.height);
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const i = (y * a.width + x) * 4;
      r += a.data[i]!; g += a.data[i + 1]!; b += a.data[i + 2]!; n++;
    }
    return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
  };
  const out: { rect: THREE.Vector4; info: THREE.Vector4 }[] = [];
  const push = (key: string, kind: number): void => {
    const t = a.tiles[key];
    if (!t) return;
    const c = mean(t);
    out.push({ rect: new THREE.Vector4(t.u, t.v, t.du, t.dv), info: new THREE.Vector4(c.r, c.g, c.b, kind) });
  };
  for (const v of FACADE_VARIANTS) {
    if (v.tex === 'bardage') continue; // bardage métallique : pas d'enduit
    push(`wall:${v.id}`, v.tex === 'brique' ? PHOTO_KIND.brique : PHOTO_KIND.enduit);
  }
  for (const r of ['tuile', 'tuile2', 'ardoise']) push(`roof:${r}`, PHOTO_KIND.tuiles);
  return out;
}

const blankTexture = (): THREE.DataTexture => {
  const t = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
};

/** Uniformes des photos de façade, partagés par tous les matériaux de façade (titre, partie). */
export const FACADE_PHOTO_UNIFORMS = {
  uPhOn: { value: 0 },
  uPhTuile: { value: blankTexture() as THREE.Texture },
  uPhTuileN: { value: blankTexture() as THREE.Texture },
  uPhBrique: { value: blankTexture() as THREE.Texture },
  uPhBriqueN: { value: blankTexture() as THREE.Texture },
  uPhEnduit: { value: blankTexture() as THREE.Texture },
  uPhEnduitN: { value: blankTexture() as THREE.Texture },
  /** Couleur moyenne de chaque photo (tuiles, brique, enduit), pour n'en garder que le détail. */
  uPhMean: { value: [new THREE.Color(0.5, 0.5, 0.5), new THREE.Color(0.5, 0.5, 0.5), new THREE.Color(0.5, 0.5, 0.5)] },
};

/** Branche une photo sur les façades (appelé à l'arrivée de chaque texture). */
export function setFacadePhoto(kind: keyof typeof PHOTO_KIND, map: THREE.Texture, normal: THREE.Texture, mean: THREE.Color): void {
  const U = FACADE_PHOTO_UNIFORMS;
  const i = PHOTO_KIND[kind] - 1;
  if (kind === 'tuiles') { U.uPhTuile.value = map; U.uPhTuileN.value = normal; }
  else if (kind === 'brique') { U.uPhBrique.value = map; U.uPhBriqueN.value = normal; }
  else { U.uPhEnduit.value = map; U.uPhEnduitN.value = normal; }
  U.uPhMean.value[i] = mean.clone();
  U.uPhOn.value = 1;
}

/** Enchaîne un onBeforeCompile après celui qui existe déjà sur le matériau. */
function chain(mat: THREE.Material, extra: (shader: THREE.WebGLProgramParametersWithUniforms) => void, key: string): void {
  const prev = mat.onBeforeCompile.bind(mat);
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev(shader, renderer);
    extra(shader);
  };
  mat.customProgramCacheKey = () => `${prevKey()}|${key}`;
}

/**
 * Façades (matériau atlas de cityBuildings) : relief, occlusion au pied des murs et sous les
 * corniches, salissures, variation par bâtiment. À appeler une fois, avant la première image.
 */
export function enhanceFacadeMaterial(mat: THREE.MeshStandardMaterial): void {
  const entries = facadePhotoEntries();
  const N = Math.max(1, entries.length);
  const rects = entries.map((e) => e.rect);
  const infos = entries.map((e) => e.info);
  if (!rects.length) { rects.push(new THREE.Vector4(-1, -1, 0, 0)); infos.push(new THREE.Vector4()); }
  const M = FACADE_PHOTO_METERS;
  chain(mat, (shader) => {
    shader.uniforms.uRelief = CITY_UNIFORMS.uRelief;
    Object.assign(shader.uniforms, FACADE_PHOTO_UNIFORMS);
    shader.uniforms.uPhRect = { value: rects };
    shader.uniforms.uPhInfo = { value: infos };
    addWorldVaryings(shader);
    // Sommet : le carreau d'atlas (aTile) dit si la face reçoit une photo, et laquelle.
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform vec4 uPhRect[${N}];\nuniform vec4 uPhInfo[${N}];\nvarying vec4 vPhoto;`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
vPhoto = vec4(0.0);
for (int i = 0; i < ${N}; i++) {
  if (abs(aTile.x - uPhRect[i].x) + abs(aTile.y - uPhRect[i].y) < 1e-5) vPhoto = uPhInfo[i];
}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uRelief;
uniform float uPhOn;
uniform sampler2D uPhTuile; uniform sampler2D uPhTuileN;
uniform sampler2D uPhBrique; uniform sampler2D uPhBriqueN;
uniform sampler2D uPhEnduit; uniform sampler2D uPhEnduitN;
uniform vec3 uPhMean[3];
varying vec4 vPhoto;
float phOn = 0.0;
vec3 phN = vec3(0.0, 0.0, 1.0);
vec3 phR = vec3(1.0, 0.0, 0.0);
vec3 phS = vec3(0.0, 1.0, 0.0);`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  // Photo (Poly Haven) projetée dans le plan de la face : u le long du mur ou du faîtage,
  // v vers le haut ou le long de la pente. La teinte reste celle du carreau pixel art.
  vec3 pN = normalize(vWN);
  phR = abs(pN.y) > 0.999 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), pN));
  phS = cross(pN, phR);
  vec2 puv = vec2(dot(vWPos, phR), dot(vWPos, phS));
  vec2 pdx = dFdx(puv); vec2 pdy = dFdy(puv);
  if (uPhOn > 0.5 && vPhoto.w > 0.5) {
    int kind = int(vPhoto.w + 0.5);
    vec3 tc; vec3 mean;
    if (kind == 1) {
      float s = 1.0 / ${M.tuiles.toFixed(2)};
      tc = textureGrad(uPhTuile, puv * s, pdx * s, pdy * s).rgb; phN = textureGrad(uPhTuileN, puv * s, pdx * s, pdy * s).xyz; mean = uPhMean[0];
    } else if (kind == 2) {
      float s = 1.0 / ${M.brique.toFixed(2)};
      tc = textureGrad(uPhBrique, puv * s, pdx * s, pdy * s).rgb; phN = textureGrad(uPhBriqueN, puv * s, pdx * s, pdy * s).xyz; mean = uPhMean[1];
    } else {
      float s = 1.0 / ${M.enduit.toFixed(2)};
      tc = textureGrad(uPhEnduit, puv * s, pdx * s, pdy * s).rgb; phN = textureGrad(uPhEnduitN, puv * s, pdx * s, pdy * s).xyz; mean = uPhMean[2];
    }
    vec3 detail = clamp(tc / max(mean, vec3(0.03)), 0.0, 2.5);
    diffuseColor.rgb = vColor.rgb * vPhoto.rgb * mix(vec3(1.0), detail, 0.9);
    phN = phN * 2.0 - 1.0;
    phOn = 1.0;
  }
}
{
  float wy = vWPos.y;
  float wall = 1.0 - smoothstep(0.35, 0.65, abs(vWNy));
  // Occlusion au pied des murs et ombre douce sous chaque corniche / balcon.
  float foot = mix(0.62, 1.0, smoothstep(0.15, 1.5, wy));
  float storey = fract((wy - 0.15) / ${FLOOR_H.toFixed(3)});
  float cornice = 1.0 - 0.24 * smoothstep(0.82, 1.0, storey) - 0.07 * (1.0 - smoothstep(0.0, 0.08, storey));
  // Coulures verticales (lentes en hauteur, rapides le long du mur) et taches d'usure.
  float along = vWPos.x + vWPos.z;
  float streak = vnoise(vec2(along * 1.7, wy * 0.11));
  float blotch = vnoise(vWPos.xz * 0.045 + wy * 0.015);
  float grime = (0.84 + 0.16 * streak) * (0.9 + 0.16 * blotch);
  float dirtFoot = 1.0 - 0.14 * (1.0 - smoothstep(0.15, 1.0, wy)) * (0.5 + streak);
  diffuseColor.rgb *= mix(vec3(0.94 + 0.1 * blotch), vec3(foot * cornice * grime * dirtFoot), wall);
  // Variation de teinte d'un bâtiment à l'autre : un peu plus chaud ou plus pâle.
  diffuseColor.rgb *= mix(vec3(1.0), vec3(1.04, 1.0, 0.94), smoothstep(0.35, 0.8, blotch));
}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
#ifdef USE_MAP
{
  float fade = uRelief * (1.0 - smoothstep(25.0, 70.0, length(vViewPosition)));
  if (phOn > 0.5) {
    // Relief de la photo (normales OpenGL) dans le repère monde de la face.
    float k = uRelief * (1.0 - smoothstep(30.0, 90.0, length(vViewPosition)));
    vec3 nW = normalize(phR * phN.x * k + phS * phN.y * k + normalize(vWN) * max(phN.z, 0.2));
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
  } else if (fade > 0.001) {
    vec2 gx = dFdx(vMapUv); vec2 gy = dFdy(vMapUv);
    vec3 lw = vec3(0.299, 0.587, 0.114);
    float h0 = dot(atlasTexel.rgb, lw);
    float hx = dot(textureGrad(map, vTile.xy + fract(vMapUv + gx) * vTile.zw, gx * vTile.zw, gy * vTile.zw).rgb, lw);
    float hy = dot(textureGrad(map, vTile.xy + fract(vMapUv + gy) * vTile.zw, gx * vTile.zw, gy * vTile.zw).rgb, lw);
    normal = nPerturb(-vViewPosition, normal, vec2(hx - h0, hy - h0) * 0.9 * fade, faceDirection);
  }
}
#endif`);
  }, `relief-v2-photo${N}`);
}

export type GroundKind = 'dur' | 'herbe' | 'meuble';

/**
 * Sols : relief (bumpMap fourni), sol mouillé et flaques sous la pluie pour les sols durs,
 * variation lente de teinte pour l'herbe et la terre.
 */
export function enhanceGroundMaterial(mat: THREE.MeshStandardMaterial, kind: GroundKind, bump?: THREE.Texture, bumpScale = 1): void {
  if (bump) {
    mat.bumpMap = bump;
    mat.bumpScale = bumpScale;
  }
  const photoSat = { value: 0.7 };
  mat.userData.photoSat = photoSat;
  chain(mat, (shader) => {
    shader.uniforms.uWet = CITY_UNIFORMS.uWet;
    shader.uniforms.uWetTint = CITY_UNIFORMS.uWetTint;
    shader.uniforms.uRelief = CITY_UNIFORMS.uRelief;
    shader.uniforms.uPhotoSat = photoSat;
    addWorldVaryings(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uWet;\nuniform vec3 uWetTint;\nuniform float uRelief;\nuniform float uPhotoSat;\nfloat nPuddle = 0.0;')
      .replace('#include <color_fragment>', `#include <color_fragment>
#if defined(USE_MAP) && defined(USE_NORMALMAP)
{
  // Sol photo (Poly Haven) : un second tirage tourné et agrandi, mêlé par un bruit lent,
  // casse la répétition ; couleurs ramenées vers la palette (désaturées, teintées par color).
  float bw = smoothstep(0.3, 0.75, vnoise(vWPos.xz * 0.06 + 7.0));
  vec2 ruv = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.73 + vec2(0.37, 0.61);
  vec3 alt = texture2D(map, ruv).rgb * diffuse;
  diffuseColor.rgb = mix(diffuseColor.rgb, alt, bw * 0.55);
  float pl = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(vec3(pl), diffuseColor.rgb, uPhotoSat);
}
#endif
{
  float big = vnoise(vWPos.xz * 0.11);
  ${kind === 'herbe'
    ? 'diffuseColor.rgb *= mix(vec3(0.86, 0.9, 0.82), vec3(1.08, 1.06, 0.9), big) * (0.94 + 0.12 * vnoise(vWPos.xz * 0.9));'
    : kind === 'meuble'
      ? 'diffuseColor.rgb *= 0.9 + 0.18 * big;'
      : 'diffuseColor.rgb *= 0.95 + 0.09 * big;'}
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
${kind === 'dur' ? `
if (uWet > 0.0) {
  float pn = vnoise(vWPos.xz * 0.32) * 0.7 + vnoise(vWPos.xz * 1.4 + 3.1) * 0.3;
  nPuddle = smoothstep(0.6, 0.68, pn) * uWet;
  roughnessFactor = mix(roughnessFactor, 0.32, uWet * 0.65);
  roughnessFactor = mix(roughnessFactor, 0.05, nPuddle);
  diffuseColor.rgb *= mix(1.0, 0.68, uWet);
  diffuseColor.rgb = mix(diffuseColor.rgb, uWetTint * 0.32, nPuddle * 0.7);
}` : kind === 'herbe' ? 'diffuseColor.rgb *= mix(1.0, 0.85, uWet);' : 'diffuseColor.rgb *= mix(1.0, 0.75, uWet);'}`)
      .replace('#include <normal_fragment_maps>', `
#if defined(USE_NORMALMAP)
  {
    vec3 nGeo = normal;
    #include <normal_fragment_maps>
    normal = normalize(mix(nGeo, normal, uRelief * (1.0 - smoothstep(25.0, 80.0, length(vViewPosition)))));
  }
#elif defined(USE_BUMPMAP)
  normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd() * uRelief * (1.0 - smoothstep(20.0, 60.0, length(vViewPosition))), faceDirection);
#endif
  normal = normalize(mix(normal, normalize(vNormal) * faceDirection, nPuddle));`);
  }, `sol-${kind}-v2`);
}

/**
 * Bascule un sol sur une photo Poly Haven (couleur + normales) : `repeat` = répétitions par
 * mètre, `color` = teinte moyenne visée (palette de la DA : la photo est ramenée à cette
 * moyenne, canal par canal), `sat` = saturation gardée (0 = gris, 1 = photo ramenée).
 */
export function applyGroundPhoto(mat: THREE.MeshStandardMaterial, p: { map: THREE.Texture; normal: THREE.Texture; mean: THREE.Color }, repeat: number, color: string, sat: number, normalScale = 1): void {
  const { map, normal } = p;
  const m = map.clone();
  m.repeat.set(repeat, repeat);
  const n = normal.clone();
  n.repeat.set(repeat, repeat);
  mat.map = m;
  mat.normalMap = n;
  mat.normalScale.set(normalScale, normalScale);
  mat.bumpMap = null;
  const t = new THREE.Color(color);
  const k = (a: number, b: number): number => Math.min(4, a / Math.max(0.02, b));
  mat.color.setRGB(k(t.r, p.mean.r), k(t.g, p.mean.g), k(t.b, p.mean.b));
  const ps = mat.userData.photoSat as { value: number } | undefined;
  if (ps) ps.value = sat;
  mat.needsUpdate = true;
}

/** Couronnes d'arbres moins plates : sommets légèrement déformés et occlusion vers le bas. */
export function shapeCrownGeometry(geo: THREE.BufferGeometry, seed = 1): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  // Déformation déterministe par position (les sommets partagés restent soudés).
  const h = (x: number, y: number, z: number): number => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 0.88 + h(Math.round(v.x * 100), Math.round(v.y * 100), Math.round(v.z * 100)) * 0.24;
    v.multiplyScalar(k);
    v.y *= 0.92;
    pos.setXYZ(i, v.x, v.y, v.z);
    // Bas de la couronne plus sombre (occlusion), sommet plus clair (lumière du ciel).
    const ao = 0.62 + 0.5 * THREE.MathUtils.smoothstep(v.y, -0.9, 0.9);
    col[i * 3] = ao * 0.98;
    col[i * 3 + 1] = ao;
    col[i * 3 + 2] = ao * 0.92;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
