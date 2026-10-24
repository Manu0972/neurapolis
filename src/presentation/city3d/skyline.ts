/**
 * Enrichissement de la ville avec les modèles Kenney (CC0), chargés en asynchrone :
 * - décor lointain : seconde ceinture d'immeubles simplifiés derrière la ceinture de boîtes pixel art,
 *   et tours à l'horizon (la ville voisine) ;
 * - lotissements : les pavillons génériques (sans enseigne, ni lieu, ni local) deviennent des
 *   maisons de banlieue, instanciées par modèle pour toute la ville ;
 * - niveaux de détail (lodScene.ts) : modèle complet près de la caméra, maquette simplifiée au loin
 *   (lodSimplify.ts), rien au-delà du brouillard ni derrière la caméra.
 * Repli : tant que rien n'est chargé (ou si un fichier manque), le décor d'origine reste affiché.
 */
import * as THREE from 'three';
import type { CityBuilding, Face } from '../../data/city/layout';
import { fitScale, pickModel, skylinePlan, SKYLINE_TOWERS, LOW_DETAIL_BUILDINGS, SUBURBAN_HOUSES, type Placement } from './assetsPlan';
import { kenneyMaterial, loadKenneyModels, type KenneyModel } from './assetsKenney';
import { chunkAt, type CityChunk } from './chunks';
import { lotSeed } from './windowsPlan';
import { buildProxyGeometry } from './lodSimplify';
import { InstancedLod } from './lodScene';
import type { LodView } from './lod';

export interface KenneyDecor {
  /** Résolu quand tout ce qui pouvait l'être est en place (QA). */
  ready: Promise<{ skyline: number; houses: number; models: number }>;
  /**
   * Niveaux de détail : maisons à moins de `houseNear` m de la caméra en modèle complet, au-delà en
   * maquette simplifiée (lodSimplify.ts), rien au-delà de `far` ni derrière la caméra. Le décor
   * lointain garde ses modèles (silhouettes de tours) : seul le tri par le champ s'y applique.
   */
  updateLod(view: LodView, houseNear: number, far: number): void;
  /** Instances dessinées en version complète / simplifiée (QA). */
  lodCounts(): { full: number; proxy: number };
  dispose(): void;
}

/** Maquettes simplifiées des maisons, une par modèle. */
const proxies = new Map<string, THREE.BufferGeometry>();
function proxyFor(model: KenneyModel): THREE.BufferGeometry {
  let g = proxies.get(model.name);
  if (!g) { g = buildProxyGeometry(model.geometry, 'discrete'); proxies.set(model.name, g); }
  return g;
}

/** Cap d'un modèle Kenney (porte vers +Z) pour qu'il regarde la façade `front`. */
export function headingFor(front: Face): number {
  return front === 'n' ? Math.PI : front === 'e' ? Math.PI / 2 : front === 'w' ? -Math.PI / 2 : 0;
}

function instancedFrom(model: KenneyModel, mat: THREE.Material, mats: THREE.Matrix4[], colors: THREE.Color[], shadow: boolean): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(model.geometry, mat, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  colors.forEach((c, i) => im.setColorAt(i, c));
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = shadow;
  im.receiveShadow = true;
  im.computeBoundingSphere();
  im.name = `kenney ${model.name}`;
  return im;
}

/**
 * Données du lot portées par la couleur d'instance (windows.ts) : rouge = graine du lot (24 bits),
 * vert = échelle horizontale, bleu = échelle verticale (pour des fenêtres en mètres et déterministes).
 */
function lotData(x: number, z: number, sx: number, sy: number): THREE.Color {
  return new THREE.Color(lotSeed(x, z), sx, sy);
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
  const houseLods: InstancedLod[] = [];
  const skyLods: InstancedLod[] = [];
  let disposed = false;
  // Dernière caméra connue : un modèle chargé après coup est réparti tout de suite.
  let lastView: LodView = { x: 0, z: 0, dirX: 0, dirZ: -1, cosHalf: -1, keep: Infinity };
  let lastNear = { house: Infinity, far: Infinity };
  /** Fige la matrice d'un maillage ajouté au décor statique (voir lodScene.freezeStatic). */
  const addStatic = (parent: THREE.Object3D, o: THREE.Object3D): void => {
    parent.add(o);
    o.updateMatrixWorld(true);
    o.matrixAutoUpdate = false;
  };

  // Décor lointain chargé après les maisons (le voisinage du joueur d'abord).
  const loadSkyline = (): Promise<number> => loadKenneyModels('commercial', [...LOW_DETAIL_BUILDINGS, ...SKYLINE_TOWERS]).then((models) => {
    if (disposed || models.size === 0) return 0;
    const avail = new Set(models.keys());
    const per = new Map<string, { mats: THREE.Matrix4[]; cols: THREE.Color[] }>();
    let n = 0;
    for (const p of skylinePlan(opts.cityW, opts.cityH)) {
      const family = (LOW_DETAIL_BUILDINGS as readonly string[]).includes(p.model) ? LOW_DETAIL_BUILDINGS : SKYLINE_TOWERS;
      const name = avail.has(p.model) ? p.model : pickModel(3, p.x, p.z, family, avail);
      if (!name) continue;
      const m = models.get(name)!;
      const e = per.get(name) ?? per.set(name, { mats: [], cols: [] }).get(name)!;
      const mat4 = farMatrix(p, m);
      e.mats.push(mat4);
      const sc = new THREE.Vector3().setFromMatrixScale(mat4);
      e.cols.push(lotData(p.x, p.z, sc.x, sc.y));
      n++;
    }
    const mat = kenneyMaterial('commercial');
    for (const [name, e] of per) {
      const model = models.get(name)!;
      const im = instancedFrom(model, mat, e.mats, e.cols, false);
      im.receiveShadow = false;
      addStatic(opts.skylineGroup, im);
      created.push(im);
      const lod = new InstancedLod(im, null);
      skyLods.push(lod);
      lod.update(lastView, Infinity, Infinity);
    }
    return n;
  });

  const houses = opts.houses.length === 0 ? Promise.resolve(0) : loadKenneyModels('suburban', SUBURBAN_HOUSES).then((models) => {
    if (disposed || models.size === 0) return 0;
    const avail = new Set(models.keys());
    // Un groupe d'instances par modèle pour toute la ville (niveaux de détail instance par instance).
    const per = new Map<string, { mats: THREE.Matrix4[]; cols: THREE.Color[] }>();
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
      // Données du lot (graine des fenêtres, échelle) ; la teinte d'enduit vient du shader.
      const col = lotData(cx, cz, s, s);
      let e = per.get(name);
      if (!e) { e = { mats: [], cols: [] }; per.set(name, e); }
      e.mats.push(mat4);
      e.cols.push(col);
      n++;
    }
    if (n < opts.houses.length) {
      // Une maison n'a pas pu être placée : on garde les pavillons pixel art (repli complet).
      return 0;
    }
    const mat = kenneyMaterial('suburban');
    for (const [name, e] of per) {
      const model = models.get(name)!;
      const im = instancedFrom(model, mat, e.mats, e.cols, true);
      addStatic(opts.skylineGroup, im);
      created.push(im);
      const lod = new InstancedLod(im, proxyFor(model));
      if (lod.proxy) addStatic(opts.skylineGroup, lod.proxy);
      houseLods.push(lod);
      lod.update(lastView, lastNear.house, lastNear.far);
    }
    for (const o of opts.houseMeshes) { o.visible = false; o.parent?.remove(o); }
    return n;
  });

  const skyline = houses.catch(() => 0).then(() => (disposed ? 0 : loadSkyline()));

  return {
    ready: Promise.all([skyline, houses]).then(([s, h]) => ({ skyline: s, houses: h, models: created.length })),
    updateLod(view: LodView, houseNear: number, far: number): void {
      lastView = view;
      lastNear = { house: houseNear, far };
      for (const l of houseLods) l.update(view, houseNear, far);
      // Décor lointain : jamais coupé par la distance (il fait l'horizon), seulement hors champ.
      for (const l of skyLods) l.update(view, Infinity, Infinity);
    },
    lodCounts(): { full: number; proxy: number } {
      let full = 0;
      let proxy = 0;
      for (const l of [...houseLods, ...skyLods]) { full += l.counts.full; proxy += l.counts.proxy; }
      return { full, proxy };
    },
    dispose(): void {
      disposed = true;
      for (const l of [...houseLods, ...skyLods]) l.dispose();
      houseLods.length = 0;
      skyLods.length = 0;
      for (const im of created) { im.parent?.remove(im); im.dispose(); }
      created.length = 0;
    },
  };
}
