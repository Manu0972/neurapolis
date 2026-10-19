/**
 * Feuillages qui masquent le joueur (QA vague 11 : devant l'épicerie Bertin, un arbre cachait
 * tout le personnage). Les houppiers situés entre la caméra et le joueur s'effacent en trame
 * (dither) dans un cylindre autour du segment caméra → joueur. L'ombre portée reste intacte.
 */
import * as THREE from 'three';

export const FOLIAGE_OCCLUSION = {
  uOccCam: { value: new THREE.Vector3() },
  uOccTarget: { value: new THREE.Vector3() },
  /** Rayon du cylindre dégagé (m) ; 0 = désactivé (intérieurs, vue de dessus). */
  uOccRadius: { value: 0 },
};

/** Met à jour le segment à dégager (appelé à chaque image par le moteur de rendu). */
export function setFoliageOcclusion(cam: THREE.Vector3, target: THREE.Vector3, radius: number): void {
  FOLIAGE_OCCLUSION.uOccCam.value.copy(cam);
  FOLIAGE_OCCLUSION.uOccTarget.value.copy(target);
  FOLIAGE_OCCLUSION.uOccRadius.value = radius;
}

/** Branche l'effacement sur le matériau des feuillages (instancié). */
export function makeFoliageOccludable(mat: THREE.Material): void {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, FOLIAGE_OCCLUSION);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOccWorld;')
      .replace('#include <project_vertex>', `#include <project_vertex>
  {
    vec4 occP = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      occP = instanceMatrix * occP;
    #endif
    vOccWorld = (modelMatrix * occP).xyz;
  }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vOccWorld;
uniform vec3 uOccCam;
uniform vec3 uOccTarget;
uniform float uOccRadius;`)
      .replace('void main() {', `void main() {
  if (uOccRadius > 0.0) {
    vec3 seg = uOccTarget - uOccCam;
    float len2 = max(dot(seg, seg), 1e-4);
    float t = clamp(dot(vOccWorld - uOccCam, seg) / len2, 0.0, 1.0);
    // Seulement entre la caméra et le joueur (pas derrière lui).
    if (t < 0.97) {
      float d = length(vOccWorld - (uOccCam + seg * t));
      float fade = 1.0 - smoothstep(uOccRadius * 0.55, uOccRadius, d);
      float dither = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
      if (fade > dither * 0.9 + 0.05) discard;
    }
  }`);
  };
  mat.customProgramCacheKey = () => 'feuillage-occlusion';
}
