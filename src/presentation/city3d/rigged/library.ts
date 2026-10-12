/**
 * Bibliothèque des personnages riggés : manifeste, modèles (.glb du studio) et clips UAL.
 *
 * - Le manifeste `personnages/index.json` est lu une fois. Absent (CI, clone neuf, build
 *   « un seul fichier ») ou illisible : état `absent`, et le jeu garde ses personnages procéduraux.
 * - Les clips de la Universal Animation Library (Quaternius, CC0) sont chargés une fois, puis
 *   reciblés une fois PAR MODÈLE (seule la translation du bassin dépend des proportions) : toutes
 *   les instances d'un même modèle partagent les mêmes clips.
 * - Chaque modèle est chargé une fois ; les instances sont des clones de squelette
 *   (`SkeletonUtils.clone`) qui partagent géométrie, matériau et texture.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { NPC_BY_ID } from '../../../data/npcs';
import { assetUrl } from '../../asset-loader';
import { RIG_CLIPS, type RigClip } from './animState';
import { MANIFEST_URL, parseManifest, type RigManifest, type RigModelEntry } from './manifest';

/** Clips UAL (35 animations, sans doigts ni maillage) suivis par Git : licence CC0. */
export const ANIM_LIBRARY_PATH = 'anim/neurapolis_anims.glb';

export type RigLibraryState = 'idle' | 'pending' | 'absent' | 'ready';

/** Sous-ensemble de `fetch` utilisé (remplaçable dans les tests). */
export type FetchLike = (url: string) => Promise<{ ok: boolean; text(): Promise<string> }>;

let state: RigLibraryState = 'idle';
let manifest: RigManifest | null = null;
let manifestPromise: Promise<RigManifest | null> | null = null;

/** Lance (une seule fois) la lecture du manifeste. Sans DOM ni `fetch` : état `absent` immédiat. */
export function startRiggedCharacters(fetchImpl?: FetchLike): Promise<RigManifest | null> {
  if (manifestPromise) return manifestPromise;
  const f: FetchLike | null = fetchImpl
    ?? (typeof fetch === 'function' && typeof document !== 'undefined' ? (u) => fetch(u, { cache: 'no-cache' }) : null);
  if (!f) {
    state = 'absent';
    manifestPromise = Promise.resolve(null);
    return manifestPromise;
  }
  state = 'pending';
  manifestPromise = (async (): Promise<RigManifest | null> => {
    try {
      const res = await f(MANIFEST_URL);
      if (!res.ok) return null;
      const text = await res.text();
      // Serveur de dev Vite : un fichier absent renvoie la page d'accueil (HTML) au lieu d'une 404.
      if (!/^\s*[[{]/.test(text)) return null;
      return parseManifest(JSON.parse(text), Object.keys(NPC_BY_ID));
    } catch {
      return null;
    }
  })().then((m) => {
    manifest = m && m.models.length > 0 ? m : null;
    state = manifest ? 'ready' : 'absent';
    if (manifest) console.info(`[personnages] ${manifest.models.length} modèle(s) riggé(s) : ${manifest.models.map((x) => x.id).join(', ')}`);
    return manifest;
  });
  return manifestPromise;
}

export function riggedState(): RigLibraryState { return state; }
export function riggedManifest(): RigManifest | null { return manifest; }

// ---------- Clips UAL et reciblage ----------

interface ClipLibrary { clips: Map<string, THREE.AnimationClip>; restPelvis: THREE.Vector3 }
let clipLib: Promise<ClipLibrary | null> | null = null;

function loadClipLibrary(): Promise<ClipLibrary | null> {
  clipLib ??= new GLTFLoader().loadAsync(assetUrl(ANIM_LIBRARY_PATH)).then(
    (g) => {
      const pelvis = g.scene.getObjectByName('pelvis');
      if (!pelvis) return null;
      return { clips: new Map(g.animations.map((c) => [c.name, c])), restPelvis: pelvis.position.clone() };
    },
    (err) => {
      console.warn('[personnages] bibliothèque d’animations illisible : personnages procéduraux.', err);
      return null;
    },
  );
  return clipLib;
}

/**
 * Recible un clip UAL sur un modèle au même squelette (mêmes noms d'os, même pose de repos en T) :
 * rotations telles quelles ; translation du bassin = repos du modèle + écart du clip au repos UAL,
 * remis à l'échelle des jambes du modèle ; les autres translations (déplacement de la racine,
 * longueurs d'os) et les échelles sont ignorées.
 */
export function retargetClip(clip: THREE.AnimationClip, ualRestPelvis: THREE.Vector3, modelRestPelvis: THREE.Vector3): THREE.AnimationClip {
  const ref = ualRestPelvis.length();
  const k = ref > 1e-6 ? modelRestPelvis.length() / ref : 1;
  const tracks: THREE.KeyframeTrack[] = [];
  for (const t of clip.tracks) {
    if (t.name.endsWith('.quaternion')) tracks.push(t);
    else if (t.name === 'pelvis.position') {
      const src = t.values;
      const v = new Float32Array(src.length);
      for (let i = 0; i + 2 < src.length; i += 3) {
        v[i] = modelRestPelvis.x + (src[i]! - ualRestPelvis.x) * k;
        v[i + 1] = modelRestPelvis.y + (src[i + 1]! - ualRestPelvis.y) * k;
        v[i + 2] = modelRestPelvis.z + (src[i + 2]! - ualRestPelvis.z) * k;
      }
      tracks.push(new THREE.VectorKeyframeTrack(t.name, t.times as unknown as number[], v as unknown as number[]));
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

/** Repli si un clip manque dans la bibliothèque. */
const CLIP_FALLBACK: Record<RigClip, RigClip[]> = {
  idle: [], walk: ['idle'], jog: ['walk', 'run'], run: ['jog', 'walk'], sit: ['idle'], talk: ['idle'],
};

// ---------- Modèles ----------

export interface RigAsset {
  entry: RigModelEntry;
  /** Scène du .glb, jamais affichée : on en clone le squelette pour chaque personnage. */
  template: THREE.Object3D;
  clips: Map<RigClip, THREE.AnimationClip>;
  /** Hauteur et bas du maillage en pose de repos (unités du fichier). */
  height: number;
  minY: number;
  /** Bassin du modèle / bassin du mannequin UAL : longueur relative des foulées. */
  legScale: number;
}

const assets = new Map<string, RigAsset | null>();
const assetPromises = new Map<string, Promise<RigAsset | null>>();

/** Modèle déjà chargé (`null` : échec), ou `undefined` s'il n'est pas encore là. */
export function rigAssetIfLoaded(id: string): RigAsset | null | undefined {
  return assets.has(id) ? assets.get(id)! : undefined;
}

/** Charge un modèle (une fois) et prépare ses clips reciblés. `null` en cas d'échec. */
export function loadRigAsset(entry: RigModelEntry): Promise<RigAsset | null> {
  let p = assetPromises.get(entry.id);
  if (p) return p;
  p = Promise.all([new GLTFLoader().loadAsync(entry.url), loadClipLibrary()]).then(
    ([g, lib]) => {
      const asset = lib ? prepareAsset(entry, g.scene, lib) : null;
      if (!asset && lib) console.warn(`[personnages] ${entry.id} : pas de squelette UAL exploitable, personnage procédural.`);
      assets.set(entry.id, asset);
      return asset;
    },
    (err) => {
      console.warn(`[personnages] ${entry.id} : modèle illisible (${entry.url}), personnage procédural.`, err);
      assets.set(entry.id, null);
      return null;
    },
  );
  assetPromises.set(entry.id, p);
  return p;
}

function prepareAsset(entry: RigModelEntry, template: THREE.Object3D, lib: ClipLibrary): RigAsset | null {
  const pelvis = template.getObjectByName('pelvis');
  const meshes: THREE.SkinnedMesh[] = [];
  template.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh); });
  if (!pelvis || meshes.length === 0) return null;
  template.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const m of meshes) {
    m.geometry.computeBoundingBox();
    box.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld));
    // Sphère de visibilité large (bras en T, foulées, position assise) : calculée une fois, héritée
    // par les clones, sans recalcul coûteux sommet par sommet.
    const gb = m.geometry.boundingBox!;
    m.boundingSphere = new THREE.Sphere(gb.getCenter(new THREE.Vector3()), gb.getSize(new THREE.Vector3()).length() * 0.65);
    m.castShadow = true;
    m.receiveShadow = false;
  }
  const clips = new Map<RigClip, THREE.AnimationClip>();
  for (const name of RIG_CLIPS) {
    const src = [name, ...CLIP_FALLBACK[name]].map((n) => lib.clips.get(n)).find((c) => !!c);
    if (src) clips.set(name, retargetClip(src, lib.restPelvis, pelvis.position));
  }
  if (!clips.has('idle')) return null;
  const height = Math.max(0.1, box.max.y - box.min.y);
  const ref = lib.restPelvis.length();
  return { entry, template, clips, height, minY: box.min.y, legScale: ref > 1e-6 ? pelvis.position.length() / ref : 1 };
}

// ---------- Point de vue (niveau de détail) et mesures ----------

const focus = { x: 0, z: 0, set: false };

/** Point de vue courant (le joueur) : les personnages lointains animent moins souvent. */
export function setRiggedLodFocus(x: number, z: number): void {
  focus.x = x;
  focus.z = z;
  focus.set = true;
}

export function lodDistance(x: number, z: number): number {
  return focus.set ? Math.hypot(x - focus.x, z - focus.z) : 0;
}

/** Compteurs pour la QA (console : `(await import('/src/presentation/city3d/rigged/library.ts')).riggedStats()`). */
export const rigCounters = { instances: 0, mixerUpdates: 0, skippedUpdates: 0 };

export function riggedStats(): { state: RigLibraryState; models: string[]; loaded: string[]; instances: number; mixerUpdates: number; skippedUpdates: number } {
  return {
    state,
    models: manifest?.models.map((m) => m.id) ?? [],
    loaded: [...assets.entries()].filter(([, a]) => !!a).map(([id]) => id),
    ...rigCounters,
  };
}

/** Tests : remet la bibliothèque dans son état initial. */
export function resetRiggedLibraryForTests(): void {
  state = 'idle';
  manifest = null;
  manifestPromise = null;
  focus.set = false;
}
