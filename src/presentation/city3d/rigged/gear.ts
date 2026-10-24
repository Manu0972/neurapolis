/**
 * Accessoires des modèles riggés (partie Three.js). Voir `gearLogic.ts` pour la mesure du corps et
 * le placement. Géométries à l'échelle 1 et matériaux par couleur sont PARTAGÉS (jamais un clone par
 * personnage) ; chaque pièce est un petit maillage rigide enfant de l'os qui la porte.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PlayerGearColorKey } from '../../../core/types';
import { fitBody, placeGear, sampleBody, type BodyFit, type GearPiece, type Vec3 } from './gearLogic';

/** Ce que porte un personnage riggé : pièces, couleurs (hex) et verres teintés. */
export interface GearSpec {
  items: PlayerGearColorKey[];
  colors: Partial<Record<PlayerGearColorKey, string>>;
  sunglasses?: boolean;
}

export function gearKey(g: GearSpec | undefined): string {
  return g ? `${g.items.join(',')}|${g.items.map((k) => g.colors[k] ?? '').join(',')}|${g.sunglasses ? 1 : 0}` : '';
}

// ---------- Mesure du corps (une fois par modèle) ----------

/** Mesure le premier maillage skinné du modèle ; `null` s'il n'a ni squelette ni poids. */
export function computeBodyFit(template: THREE.Object3D): BodyFit | null {
  let sm: THREE.SkinnedMesh | null = null;
  template.traverse((o) => { if (!sm && (o as THREE.SkinnedMesh).isSkinnedMesh) sm = o as THREE.SkinnedMesh; });
  const m = sm as THREE.SkinnedMesh | null;
  const geo = m?.geometry;
  const pos = geo?.getAttribute('position');
  const si = geo?.getAttribute('skinIndex');
  const sw = geo?.getAttribute('skinWeight');
  if (!m || !pos || !si || !sw || !m.skeleton) return null;
  // Espace de liaison : sommets × bindMatrix ; os = inverse de leur matrice inverse de liaison.
  const p = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m.bindMatrix);
    p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
  }
  const idx = new Float32Array(si.count * 4);
  const wt = new Float32Array(sw.count * 4);
  for (let i = 0; i < si.count; i++) for (let c = 0; c < 4; c++) { idx[i * 4 + c] = si.getComponent(i, c); wt[i * 4 + c] = sw.getComponent(i, c); }
  const names = m.skeleton.bones.map((b) => b.name);
  const bonePos = m.skeleton.boneInverses.map((inv) => new THREE.Vector3().setFromMatrixPosition(inv.clone().invert()).toArray() as Vec3);
  return fitBody(sampleBody(p, idx, wt, names, bonePos));
}

// ---------- Géométries partagées (échelle 1) ----------

const geos = new Map<GearPiece, THREE.BufferGeometry>();
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.BufferGeometry => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const merge = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(flat, false) ?? flat[0]!;
  for (const g of [...parts, ...flat]) if (g !== out) g.dispose();
  return out;
};
const dome = (): THREE.BufferGeometry => new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);

function makePiece(p: GearPiece): THREE.BufferGeometry {
  switch (p) {
    case 'casquette': return merge([
      dome(),
      // Visière : demi-disque à l'avant (+Z), un peu penché.
      new THREE.CylinderGeometry(0.78, 0.78, 0.05, 18, 1, false, -Math.PI / 2, Math.PI).translate(0, 0.02, 0.5).rotateX(0.1),
      new THREE.SphereGeometry(0.08, 8, 6).translate(0, 1, 0),
    ]);
    case 'bonnet': return merge([
      dome().scale(1, 1.08, 1),
      new THREE.CylinderGeometry(1.05, 1.05, 0.3, 24, 1, true).translate(0, 0.1, 0),
      new THREE.SphereGeometry(0.2, 10, 8).translate(0, 1.1, 0),
    ]);
    case 'ecouteurs': return merge([
      new THREE.TorusGeometry(1, 0.05, 6, 24, Math.PI),
      new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16).rotateZ(Math.PI / 2).translate(1, 0, 0),
      new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16).rotateZ(Math.PI / 2).translate(-1, 0, 0),
    ]);
    case 'lunettes': return merge([
      new THREE.TorusGeometry(0.34, 0.05, 6, 20).translate(0.46, 0, 0),
      new THREE.TorusGeometry(0.34, 0.05, 6, 20).translate(-0.46, 0, 0),
      box(0.16, 0.05, 0.05, 0, 0.08, 0),
      box(0.05, 0.05, 1.1, 0.8, 0.06, -0.55),
      box(0.05, 0.05, 1.1, -0.8, 0.06, -0.55),
    ]);
    case 'verres': return merge([
      new THREE.CircleGeometry(0.32, 20).translate(0.46, 0, 0.004),
      new THREE.CircleGeometry(0.32, 20).translate(-0.46, 0, 0.004),
    ]);
    case 'echarpe': return merge([
      new THREE.TorusGeometry(1, 0.42, 8, 22).rotateX(Math.PI / 2),
      box(0.55, 1.5, 0.24, 0.42, -0.85, 1.02).rotateZ(-0.05),
    ]);
    case 'montre': return merge([
      new THREE.TorusGeometry(1.08, 0.24, 6, 18).rotateY(Math.PI / 2),
      new THREE.CylinderGeometry(0.55, 0.55, 0.3, 14).translate(0, 1.2, 0),
    ]);
    case 'sac_dos': return merge([
      box(1, 1, 1),
      box(0.72, 0.42, 0.32, 0, -0.2, -0.6),
      box(0.5, 0.08, 0.2, 0, 0.55, 0.1),
    ]);
    case 'bretelles': return merge([box(0.2, 1, 0.012, 0.55, 0, 0), box(0.2, 1, 0.012, -0.55, 0, 0)]);
    case 'sacoche': return merge([box(1, 1, 1), box(1.06, 0.48, 1.06, 0, 0.28, 0)]);
    case 'bandouliere': return box(2.2, 0.13, 0.012).rotateZ(Math.atan2(1, 1.1));
  }
}

function pieceGeometry(p: GearPiece): THREE.BufferGeometry {
  let g = geos.get(p);
  if (!g) { g = makePiece(p); geos.set(p, g); }
  return g;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();
function gearMaterial(hex: string): THREE.MeshStandardMaterial {
  let m = mats.get(hex);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.72 }); mats.set(hex, m); }
  return m;
}

/** QA / tests : nombre de géométries et de matériaux partagés créés. */
export function gearCacheSizes(): { geometries: number; materials: number } {
  return { geometries: geos.size, materials: mats.size };
}

// ---------- Pose sur le squelette ----------

export interface GearHandle { dispose(): void; readonly meshes: readonly THREE.Mesh[] }

/** Accroche les accessoires aux os du modèle cloné (pose indépendante de l'animation en cours). */
export function attachGear(model: THREE.Object3D, fit: BodyFit, spec: GearSpec): GearHandle {
  let sm: THREE.SkinnedMesh | null = null;
  model.traverse((o) => { if (!sm && (o as THREE.SkinnedMesh).isSkinnedMesh) sm = o as THREE.SkinnedMesh; });
  const skel = (sm as THREE.SkinnedMesh | null)?.skeleton;
  const meshes: THREE.Mesh[] = [];
  if (!skel) return { meshes, dispose: () => undefined };
  const local = new THREE.Matrix4();
  const place = new THREE.Matrix4();
  for (const kind of spec.items) {
    for (const pl of placeGear(kind, fit, { sunglasses: spec.sunglasses })) {
      const i = skel.bones.findIndex((b) => b.name === pl.bone);
      const bone = skel.bones[i];
      const inv = skel.boneInverses[i];
      if (!bone || !inv) continue;
      const hex = pl.color.startsWith('#') ? pl.color : spec.colors[pl.color as PlayerGearColorKey] ?? '#555555';
      const mesh = new THREE.Mesh(pieceGeometry(pl.piece), gearMaterial(hex));
      mesh.name = `accessoire_${pl.piece}`;
      const q = pl.quat ? new THREE.Quaternion(...pl.quat) : new THREE.Quaternion();
      place.compose(new THREE.Vector3(...pl.pos), q, new THREE.Vector3(...pl.scale));
      // Place (espace de liaison) → repère de l'os en pose de liaison.
      local.multiplyMatrices(inv, place);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(local);
      mesh.castShadow = true;
      bone.add(mesh);
      meshes.push(mesh);
    }
  }
  return { meshes, dispose: () => { for (const m of meshes) m.removeFromParent(); } };
}
