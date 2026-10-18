/**
 * Modèles Kenney (City Kit Commercial / Suburban, CC0) : chargement asynchrone des GLB de
 * public/assets/libre/, une géométrie par modèle (déjà à plat : un maillage, un matériau
 * « colormap » par kit) et un matériau partagé par kit, recoloré vers la palette de la DA
 * (couleurs moins saturées, teinte crème/brun). Un modèle qui manque renvoie `null` :
 * l'appelant garde son repli (pavillons pixel art, boîtes lointaines).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetUrl } from '../asset-loader';
import type { Size3 } from './assetsPlan';

export type KenneyKit = 'commercial' | 'suburban';

export interface KenneyModel {
  name: string;
  geometry: THREE.BufferGeometry;
  /** Taille de la boîte englobante (unités du modèle ; le pied est en y = 0). */
  size: Size3;
}

const models = new Map<string, Promise<KenneyModel | null>>();
const kitMaps = new Map<KenneyKit, THREE.Texture>();
const kitMaterials = new Map<KenneyKit, THREE.MeshStandardMaterial>();
let loader: GLTFLoader | null = null;

/** Matériau partagé d'un kit (sa texture arrive avec le premier modèle chargé). */
export function kenneyMaterial(kit: KenneyKit): THREE.MeshStandardMaterial {
  let m = kitMaterials.get(kit);
  if (m) return m;
  m = new THREE.MeshStandardMaterial({
    color: kit === 'suburban' ? '#ecd8ba' : '#e4d6c0',
    roughness: 0.88,
    metalness: 0,
  });
  m.onBeforeCompile = (shader) => {
    // Palette de la DA : couleurs du kit désaturées d'un quart, réchauffées par `color`.
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
{
  vec3 kc = diffuseColor.rgb;
  float kl = dot(kc, vec3(0.299, 0.587, 0.114));
  // Toits verts → tuiles de terre cuite ; aplats bleus clairs → ardoise (vitres sombres gardées).
  float kg = smoothstep(0.015, 0.06, kc.g - max(kc.r, kc.b));
  float kb = smoothstep(0.015, 0.06, kc.b - max(kc.r, kc.g)) * smoothstep(0.06, 0.14, kl);
  kc = mix(kc, vec3(0.42, 0.11, 0.05) * (0.55 + 2.2 * kl), kg);
  kc = mix(kc, vec3(0.13, 0.15, 0.18) * (0.6 + 1.6 * kl), kb);
  kl = dot(kc, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(vec3(kl), kc, 0.75);
}`);
  };
  m.customProgramCacheKey = () => 'kenney-palette-v2';
  const map = kitMaps.get(kit);
  if (map) m.map = map;
  kitMaterials.set(kit, m);
  return m;
}

/** Charge un modèle (mis en cache) ; `null` si le fichier manque ou n'est pas lisible. */
export function loadKenneyModel(kit: KenneyKit, name: string): Promise<KenneyModel | null> {
  const key = `${kit}/${name}`;
  let p = models.get(key);
  if (p) return p;
  loader ??= new GLTFLoader();
  p = loader.loadAsync(assetUrl(`libre/kenney-${kit}/glb/${name}.glb`)).then((gltf) => {
    gltf.scene.updateMatrixWorld(true);
    const parts: THREE.BufferGeometry[] = [];
    let map: THREE.Texture | null = null;
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
      parts.push(g);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      map ??= mat.map ?? null;
    });
    if (parts.length !== 1) {
      // Les kits utilisés n'ont qu'un maillage par modèle ; au-delà, on ignore le modèle.
      for (const g of parts) g.dispose();
      return null;
    }
    const geometry = parts[0]!;
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    geometry.translate(0, -bb.min.y, 0);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    if (map && !kitMaps.has(kit)) {
      const t = map as THREE.Texture;
      t.colorSpace = THREE.SRGBColorSpace;
      kitMaps.set(kit, t);
      const m = kitMaterials.get(kit);
      if (m && !m.map) { m.map = t; m.needsUpdate = true; }
    }
    const s = new THREE.Vector3();
    geometry.boundingBox!.getSize(s);
    return { name, geometry, size: { x: s.x, y: s.y, z: s.z } };
  }).catch((err: unknown) => {
    console.warn(`[ville] modèle Kenney indisponible : ${key}`, err);
    return null;
  });
  models.set(key, p);
  return p;
}

/** Charge une liste de modèles ; renvoie ceux qui sont disponibles (par nom). */
export async function loadKenneyModels(kit: KenneyKit, names: readonly string[]): Promise<Map<string, KenneyModel>> {
  const list = await Promise.all(names.map((n) => loadKenneyModel(kit, n)));
  const out = new Map<string, KenneyModel>();
  for (const m of list) if (m) out.set(m.name, m);
  // La texture du kit doit être là pour dessiner : sans elle, aucun modèle n'est utilisable.
  if (!kitMaps.has(kit)) out.clear();
  else kenneyMaterial(kit);
  return out;
}
