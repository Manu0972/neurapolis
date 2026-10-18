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

/** Ajoute vWPos (position monde) et vWNy (normale monde, composante verticale) au vertex shader. */
function addWorldVaryings(shader: { vertexShader: string; fragmentShader: string }): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying float vWNy;')
    .replace('#include <project_vertex>', `#include <project_vertex>
{
  vec4 nWp = vec4(transformed, 1.0);
  vec3 nWn = objectNormal;
#ifdef USE_INSTANCING
  nWp = instanceMatrix * nWp;
  nWn = mat3(instanceMatrix) * nWn;
#endif
  vWPos = (modelMatrix * nWp).xyz;
  vWNy = normalize(mat3(modelMatrix) * nWn).y;
}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;\nvarying float vWNy;\n${NOISE_GLSL}`);
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
  chain(mat, (shader) => {
    shader.uniforms.uRelief = CITY_UNIFORMS.uRelief;
    addWorldVaryings(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRelief;')
      .replace('#include <color_fragment>', `#include <color_fragment>
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
  if (fade > 0.001) {
    vec2 gx = dFdx(vMapUv); vec2 gy = dFdy(vMapUv);
    vec3 lw = vec3(0.299, 0.587, 0.114);
    float h0 = dot(atlasTexel.rgb, lw);
    float hx = dot(textureGrad(map, vTile.xy + fract(vMapUv + gx) * vTile.zw, gx * vTile.zw, gy * vTile.zw).rgb, lw);
    float hy = dot(textureGrad(map, vTile.xy + fract(vMapUv + gy) * vTile.zw, gx * vTile.zw, gy * vTile.zw).rgb, lw);
    normal = nPerturb(-vViewPosition, normal, vec2(hx - h0, hy - h0) * 0.9 * fade, faceDirection);
  }
}
#endif`);
  }, 'relief-v1');
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
  chain(mat, (shader) => {
    shader.uniforms.uWet = CITY_UNIFORMS.uWet;
    shader.uniforms.uWetTint = CITY_UNIFORMS.uWetTint;
    shader.uniforms.uRelief = CITY_UNIFORMS.uRelief;
    addWorldVaryings(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uWet;\nuniform vec3 uWetTint;\nuniform float uRelief;\nfloat nPuddle = 0.0;')
      .replace('#include <color_fragment>', `#include <color_fragment>
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
#ifdef USE_BUMPMAP
  normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd() * uRelief * (1.0 - smoothstep(20.0, 60.0, length(vViewPosition))), faceDirection);
#endif
  normal = normalize(mix(normal, normalize(vNormal) * faceDirection, nPuddle));`);
  }, `sol-${kind}-v1`);
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
