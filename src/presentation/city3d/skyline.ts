/**
 * Enrichissement de la ville avec les modèles Kenney (CC0), chargés en asynchrone :
 * - décor lointain : seconde ceinture d'immeubles simplifiés derrière la ceinture de boîtes pixel art,
 *   et tours à l'horizon (la ville voisine) ;
 * - lotissements : les pavillons génériques (sans enseigne, ni lieu, ni local) deviennent des
 *   maisons de banlieue, instanciées par modèle et par bloc de 128 m.
 * Repli : tant que rien n'est chargé (ou si un fichier manque), le décor d'origine reste affiché.
 */
import * as THREE from 'three';
import type { CityBuilding, Face } from '../../data/city/layout';
import { fitScale, hash01, pickModel, skylinePlan, SKYLINE_TOWERS, LOW_DETAIL_BUILDINGS, SUBURBAN_HOUSES, type Placement } from './assetsPlan';
import { kenneyMaterial, loadKenneyModels, type KenneyModel } from './assetsKenney';
import { chunkAt, type CityChunk } from './chunks';

export interface KenneyDecor {
  /** Résolu quand tout ce qui pouvait l'être est en place (QA). */
  ready: Promise<{ skyline: number; houses: number; models: number }>;
  dispose(): void;
}

/** Cap d'un modèle Kenney (porte vers +Z) pour qu'il regarde la façade `front`. */
export function headingFor(front: Face): number {
  return front === 'n' ? Math.PI : front === 'e' ? Math.PI / 2 : front === 'w' ? -Math.PI / 2 : 0;
}

function instancedFrom(model: KenneyModel, mat: THREE.Material, mats: THREE.Matrix4[], colors: THREE.Color[] | null, shadow: boolean): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(model.geometry, mat, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => im.setColorAt(i, c));
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = shadow;
  im.receiveShadow = true;
  im.computeBoundingSphere();
  im.name = `kenney ${model.name}`;
  return im;
}

/** Matrice d'un placement lointain : largeur visée, hauteur visée dans des proportions sûres. */
function farMatrix(p: Placement, m: KenneyModel): THREE.Matrix4 {
  const s = p.w / Math.max(m.size.x, m.size.z);
  const sy = THREE.MathUtils.clamp(p.h / m.size.y, s * 0.7, s * 1.4);
  return new THREE.Matrix4().compose(
    new THREE.Vector3(p.x, -0.5, p.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry),
    new THREE.Vector3(s, sy, s),
  );
}

/**
 * Lance le chargement et la mise en place. `skylineGroup` : groupe non découpé (décor lointain) ;
 * `houses` : pavillons génériques
 * et `houseMeshes` leurs maillages pixel art (masqués quand les maisons Kenney sont posées).
 */
export function buildKenneyDecor(opts: {
  skylineGroup: THREE.Group;
  chunks: readonly CityChunk[];
  houses: readonly CityBuilding[];
  houseMeshes: THREE.Object3D[];
  groundAt: (x: number, z: number) => number;
  cityW: number;
  cityH: number;
}): KenneyDecor {
  const created: THREE.InstancedMesh[] = [];
  let disposed = false;

  const skyline = loadKenneyModels('commercial', [...LOW_DETAIL_BUILDINGS, ...SKYLINE_TOWERS]).then((models) => {
    if (disposed || models.size === 0) return 0;
    const avail = new Set(models.keys());
    const per = new Map<string, THREE.Matrix4[]>();
    let n = 0;
    for (const p of skylinePlan(opts.cityW, opts.cityH)) {
      const family = (LOW_DETAIL_BUILDINGS as readonly string[]).includes(p.model) ? LOW_DETAIL_BUILDINGS : SKYLINE_TOWERS;
      const name = avail.has(p.model) ? p.model : pickModel(3, p.x, p.z, family, avail);
      if (!name) continue;
      (per.get(name) ?? per.set(name, []).get(name)!).push(farMatrix(p, models.get(name)!));
      n++;
    }
    const mat = kenneyMaterial('commercial');
    for (const [name, list] of per) {
      const im = instancedFrom(models.get(name)!, mat, list, null, false);
      im.receiveShadow = false;
      opts.skylineGroup.add(im);
      created.push(im);
    }
    return n;
  });

  const houses = opts.houses.length === 0 ? Promise.resolve(0) : loadKenneyModels('suburban', SUBURBAN_HOUSES).then((models) => {
    if (disposed || models.size === 0) return 0;
    const avail = new Set(models.keys());
    // Par bloc de 128 m puis par modèle : un InstancedMesh par (bloc, modèle).
    const per = new Map<CityChunk, Map<string, { mats: THREE.Matrix4[]; cols: THREE.Color[] }>>();
    let n = 0;
    for (const b of opts.houses) {
      const name = pickModel(11, b.x, b.y, SUBURBAN_HOUSES, avail);
      if (!name) continue;
      const m = models.get(name)!;
      const cx = b.x + b.w / 2;
      const cz = b.y + b.d / 2;
      const chunk = chunkAt(opts.chunks, cx, cz);
      if (!chunk) continue;
      const quarter = b.front === 'e' || b.front === 'w';
      const s = fitScale(m.size, b.w, b.d, 0.04, quarter);
      const mat4 = new THREE.Matrix4().compose(
        new THREE.Vector3(cx, opts.groundAt(cx, cz), cz),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), headingFor(b.front)),
        new THREE.Vector3(s, s, s),
      );
      // Légère variation de teinte d'une maison à l'autre (plus chaude ou plus pâle).
      const k = 0.9 + hash01(5, b.x, b.y) * 0.16;
      const col = new THREE.Color(k, k * (0.97 + hash01(6, b.x, b.y) * 0.04), k * (0.92 + hash01(7, b.x, b.y) * 0.06));
      let byModel = per.get(chunk);
      if (!byModel) { byModel = new Map(); per.set(chunk, byModel); }
      let e = byModel.get(name);
      if (!e) { e = { mats: [], cols: [] }; byModel.set(name, e); }
      e.mats.push(mat4);
      e.cols.push(col);
      n++;
    }
    if (n < opts.houses.length) {
      // Une maison n'a pas pu être placée : on garde les pavillons pixel art (repli complet).
      return 0;
    }
    const mat = kenneyMaterial('suburban');
    for (const [chunk, byModel] of per) {
      for (const [name, e] of byModel) {
        const im = instancedFrom(models.get(name)!, mat, e.mats, e.cols, true);
        chunk.group.add(im);
        created.push(im);
      }
    }
    for (const o of opts.houseMeshes) { o.visible = false; o.parent?.remove(o); }
    return n;
  });

  return {
    ready: Promise.all([skyline, houses]).then(([s, h]) => ({ skyline: s, houses: h, models: created.length })),
    dispose(): void {
      disposed = true;
      for (const im of created) { im.parent?.remove(im); im.dispose(); }
      created.length = 0;
    },
  };
}
