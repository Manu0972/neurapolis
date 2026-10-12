/**
 * Matériau unique des bâtiments : l'atlas de façades en pixel art (facadeAtlas.ts) en texture,
 * pixels nets de près (NearestFilter), mipmaps au loin.
 *
 * Chaque sommet porte `aTile` = rectangle d'un carreau dans l'atlas ; ses UV comptent en
 * « carreaux » (1 = un carreau entier) et le nuanceur replie fract(uv) dans le rectangle :
 * un mur entier reste un seul quadrilatère, même si sa planche se répète vingt fois.
 * Le canal alpha de l'atlas est le masque des fenêtres allumées : l'émission de la nuit
 * (emissiveIntensity, pilotée par CityRenderer) n'éclaire que ces pixels.
 */
import * as THREE from 'three';
import { facadeAtlas, type AtlasTile } from './facadeAtlas';

let texture: THREE.DataTexture | null = null;

/** Texture de l'atlas, partagée par toutes les scènes (écran titre puis partie). */
export function facadeAtlasTexture(): THREE.DataTexture {
  if (texture) return texture;
  const a = facadeAtlas();
  const t = new THREE.DataTexture(a.data, a.width, a.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.flipY = false;
  t.needsUpdate = true;
  texture = t;
  return t;
}

export function atlasTile(key: string): AtlasTile {
  const t = facadeAtlas().tiles[key];
  if (!t) throw new Error(`Atlas de façades : carreau inconnu « ${key} ».`);
  return t;
}

/** Matériau des bâtiments (une instance par scène ; la texture est partagée). */
export function createFacadeMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map: facadeAtlasTexture(),
    roughness: 0.9,
    metalness: 0,
    vertexColors: true,
    emissive: new THREE.Color('#ffd98a'),
    emissiveIntensity: 0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aTile;\nvarying vec4 vTile;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvTile = aTile;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vTile;\nfloat atlasLit = 0.0;')
      .replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec2 atlasUv = vTile.xy + fract(vMapUv) * vTile.zw;
  vec4 atlasTexel = textureGrad(map, atlasUv, dFdx(vMapUv) * vTile.zw, dFdy(vMapUv) * vTile.zw);
  diffuseColor.rgb *= atlasTexel.rgb;
  atlasLit = 1.0 - atlasTexel.a;
#endif`)
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= atlasLit;');
  };
  // Un seul programme pour toutes les scènes de façades.
  mat.customProgramCacheKey = () => 'facade-atlas-v1';
  return mat;
}
