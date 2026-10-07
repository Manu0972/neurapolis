/**
 * Bibliothèque d'animations des personnages : squelette et mouvements de la Universal Animation
 * Library (Quaternius, CC0), réduits à 35 animations par `tools/assets/prune_glb.py`.
 * Chargée une fois ; tant qu'elle n'est pas prête, les personnages restent ceux de
 * `simpleCharacter.ts`. Build « un seul fichier » : le .glb est embarqué en data URI.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const ANIM_PATH = 'anim/neurapolis_anims.glb';

export interface AnimLibrary {
  /** Hiérarchie des os au repos (T-pose), à cloner pour chaque personnage. */
  template: THREE.Object3D;
  clips: Map<string, THREE.AnimationClip>;
}

let lib: AnimLibrary | null = null;
let loading: Promise<AnimLibrary | null> | null = null;

export function animLibrary(): AnimLibrary | null {
  return lib;
}

export function loadAnimLibrary(): Promise<AnimLibrary | null> {
  if (lib) return Promise.resolve(lib);
  if (loading) return loading;
  const embedded = (globalThis as { __NEURAPOLIS_ASSETS__?: Record<string, string> }).__NEURAPOLIS_ASSETS__;
  const url = embedded?.[ANIM_PATH] ?? `./assets/${ANIM_PATH}`;
  loading = new GLTFLoader().loadAsync(url).then(
    (gltf) => {
      const clips = new Map<string, THREE.AnimationClip>();
      for (const c of gltf.animations) clips.set(c.name, c);
      lib = { template: gltf.scene, clips };
      return lib;
    },
    () => null, // fichier absent ou illisible : on garde les personnages simples
  );
  return loading;
}
