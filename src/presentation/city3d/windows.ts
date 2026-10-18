/**
 * Fenêtres allumées des modèles Kenney : uniformes partagés et morceaux de shader.
 *
 * Aucun appel de dessin ni lumière en plus : tout passe par le matériau partagé de chaque kit
 * (assetsKenney.ts). Le sommet porte `aWin` (0 = mur, > 0 = vitre individuelle, −1 = panneau vitré
 * découpé en cellules par le shader) ; la graine du lot vient de la position de l'instance, donc
 * chaque maison et chaque immeuble a ses propres fenêtres allumées, identiques à chaque session.
 * Le hachage entier est le miroir exact de `hashU` de windowsPlan.ts (testé).
 *
 * Jour : vitres sombres et bleutées. Soir : `uWinFrac` (windowLitFraction) monte avec les
 * lampadaires ; chaque vitre s'allume quand la part allumée dépasse son seuil (couleur ambre,
 * jaune, orangé ou bleutée selon le logement). Les toits reçoivent le détail des tuiles Poly Haven
 * (comme les toits pixel art), les murs une teinte d'enduit par logement et une ombre au pied.
 */
import * as THREE from 'three';
type Shader = Parameters<NonNullable<THREE.Material['onBeforeCompile']>>[0];
import { PLASTER_TINTS } from './windowsPlan';
import { FACADE_PHOTO_METERS } from './materials';

/** Uniformes partagés par les matériaux Kenney (une seule valeur mise à jour par image). */
export const WINDOW_UNIFORMS = {
  /** Part des fenêtres allumées, 0 → 1 (windowLitFraction). */
  uWinFrac: { value: 0 },
  /** Détail des tuiles Poly Haven sur les toits (couleur, moyenne, interrupteur). */
  uRoofMap: { value: null as THREE.Texture | null },
  uRoofMean: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
  uRoofOn: { value: 0 },
};

/** Branche la photo de tuiles sur les toits Kenney (à son arrivée). */
export function setRoofPhoto(map: THREE.Texture, mean: THREE.Color): void {
  WINDOW_UNIFORMS.uRoofMap.value = map;
  WINDOW_UNIFORMS.uRoofMean.value.set(mean.r, mean.g, mean.b);
  WINDOW_UNIFORMS.uRoofOn.value = 1;
}

const f3 = (v: readonly [number, number, number]): string => `vec3(${v.map((x) => x.toFixed(3)).join(', ')})`;

const HASH = /* glsl */ `
uint hashU(uint a, uint b, uint c) {
  uint x = a * 747796405u + b * 2891336453u + c * 277803737u;
  x ^= x >> 16u; x *= 2246822519u; x ^= x >> 13u; x *= 3266489917u; x ^= x >> 16u;
  return x;
}
float rand24(uint h) { return float(h >> 8u) / 16777216.0; }`;

/**
 * Déclarations et attributs (sommet). Le coût est gardé au minimum côté sommets (le rendu en traite
 * des millions) : tout ce qui dépend du lot vient de la couleur d'instance, calculée une fois sur le CPU
 * (rouge = graine du lot sur 24 bits, vert/bleu = échelle horizontale/verticale de l'instance).
 * `aWin` : x = identifiant de fenêtre (0 mur, > 0 vitre, −1 panneau), y = hauteur relative de la porte (−1 sinon).
 */
const COMMON = /* glsl */ `
attribute vec2 aWin;
flat varying float vWinId;
flat varying uint vWinSeed;
varying float vDoor;
varying vec3 vWinPos;`;

/** Fin de `begin_vertex` : graine du lot et position en mètres (échelle de l'instance). */
const VERT = /* glsl */ `
vWinId = aWin.x;
vDoor = aWin.y;
#ifdef USE_INSTANCING_COLOR
vWinSeed = uint(instanceColor.r + 0.5);
vWinPos = position * vec3(instanceColor.g, instanceColor.b, instanceColor.g);
#else
vWinSeed = 1u;
vWinPos = position;
#endif`;

const FRAG_PARS = /* glsl */ `
uniform float uWinFrac;
uniform sampler2D uRoofMap;
uniform vec3 uRoofMean;
uniform float uRoofOn;
flat varying float vWinId;
flat varying uint vWinSeed;
varying float vDoor;
varying vec3 vWinPos;
${HASH}
const vec3 PLASTER[${PLASTER_TINTS.length}] = vec3[${PLASTER_TINTS.length}](${PLASTER_TINTS.map(f3).join(', ')});`;

/** Dans le bloc de palette (après le calcul de kc, kl, kg) : enduit, pied de mur, tuiles, vitres. */
const FRAG_BLOCK = /* glsl */ `
  bool wIsWin = abs(vWinId) > 0.5;
  // Normale de la face (plate) d'après la position en mètres : pas de varying de plus.
  vec3 wN = normalize(cross(dFdx(vWinPos), dFdy(vWinPos)));
  float wm = smoothstep(0.42, 0.56, kl) * (wIsWin ? 0.0 : 1.0);
  // Enduit : une teinte par logement ; ombre douce au pied du mur.
  if (wm > 0.01) {
    diffuseColor.rgb *= mix(vec3(1.0), PLASTER[hashU(vWinSeed, 0u, 13u) % ${PLASTER_TINTS.length}u], wm);
    diffuseColor.rgb *= mix(1.0, mix(0.7, 1.0, smoothstep(0.0, 1.1, vWinPos.y)), wm);
  }
  // Toits : détail des tuiles Poly Haven projeté dans le plan de la face (rangs parallèles au faîtage).
  if (kg > 0.02 && uRoofOn > 0.5) {
    vec3 rn = wN;
    vec3 rt = vec3(rn.z, 0.0, -rn.x);
    float rl = length(rt);
    rt = rl > 0.05 ? rt / rl : vec3(1.0, 0.0, 0.0);
    vec3 rb = cross(rn, rt);
    vec3 rp = texture2D(uRoofMap, vec2(dot(vWinPos, rt), dot(vWinPos, rb)) / ${FACADE_PHOTO_METERS.tuiles.toFixed(2)}).rgb;
    vec3 detail = clamp(rp / max(uRoofMean, vec3(0.02)), 0.45, 1.7);
    diffuseColor.rgb *= mix(vec3(1.0), detail, 0.6 * kg);
  }
  // Fenêtres : vitres sombres et bleutées le jour ; allumées (ambre, jaune, orangé) selon l'heure.
  if (wIsWin) {
    uint wid;
    float inner = 1.0;
    if (vWinId > 0.0) {
      wid = uint(vWinId + 0.5);
    } else {
      bool onX = abs(wN.x) > abs(wN.z);
      vec2 cell = vec2(onX ? vWinPos.z : vWinPos.x, vWinPos.y) / vec2(2.6, 3.1);
      vec2 cf = fract(cell);
      wid = hashU(uint(int(floor(cell.x)) + 4096), uint(int(floor(cell.y)) + 4096), onX ? 1u : 2u);
      inner = step(0.14, cf.x) * step(cf.x, 0.86) * step(0.2, cf.y) * step(cf.y, 0.8);
    }
    float hr = rand24(hashU(vWinSeed, 0u, 11u));
    float wr = rand24(hashU(vWinSeed, wid, 3u));
    float th = wr + (hr - wr) * 0.4;
    float on = smoothstep(th, th + 0.12, uWinFrac * 1.12) * inner;
    float cr = rand24(hashU(vWinSeed, wid, 5u));
    vec3 tint = cr < 0.5 ? vec3(1.0, 0.76, 0.4) : cr < 0.8 ? vec3(1.0, 0.64, 0.3) : cr < 0.92 ? vec3(1.0, 0.5, 0.2) : vec3(0.62, 0.76, 1.0);
    float gain = 0.6 + 0.4 * rand24(hashU(vWinSeed, wid, 9u));
    vec3 glass = vec3(0.075, 0.115, 0.19) * (0.7 + 0.9 * kl);
    diffuseColor.rgb = mix(diffuseColor.rgb, glass, inner * (1.0 - 0.6 * on));
    wOn = on;
    wCol = tint * gain;
  }
  // Imposte allumée au-dessus de la porte (certains logements seulement, dès le crépuscule).
  if (vDoor >= 0.0) {
    float lantern = step(rand24(hashU(vWinSeed, 0u, 17u)), 0.45) * smoothstep(0.05, 0.3, uWinFrac) * smoothstep(0.62, 0.7, vDoor);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.36, 0.18), lantern);
    wOn = max(wOn, lantern);
    wCol = vec3(1.0, 0.74, 0.38) * 0.8;
  }`;

/** Branche les fenêtres sur le shader d'un matériau Kenney (appelé depuis onBeforeCompile). */
export function patchKenneyWindows(shader: Shader, paletteBlock: (extra: string) => string): void {
  Object.assign(shader.uniforms, WINDOW_UNIFORMS);
  // La couleur d'instance porte les données du lot : elle ne teinte plus le matériau.
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
${COMMON}`)
    .replace('#include <color_vertex>', '')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
${VERT}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
${FRAG_PARS}`)
    .replace('#include <color_fragment>', '')
    .replace('#include <map_fragment>', `#include <map_fragment>
float wOn = 0.0;
vec3 wCol = vec3(0.0);
${paletteBlock(FRAG_BLOCK)}`)
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += wCol * wOn;');
}
