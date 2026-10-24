/**
 * Outils de rendu pour les niveaux de détail (Three.js) :
 * - `freezeStatic` : un décor qui ne bouge plus n'a pas à recalculer ses matrices à chaque image
 *   (la ville en compte ~5 000 : c'était le premier poste du processeur) ;
 * - `setAttached` : un groupe masqué est retiré du graphe de scène (Three.js parcourt aussi les
 *   objets invisibles pour leurs matrices) puis remis tel quel ;
 * - `InstancedLod` : toutes les instances d'un modèle en deux versions (complet près de la caméra,
 *   maquette simplifiée au loin, voir lodSimplify.ts), réparties instance par instance ; celles
 *   hors de portée ou derrière la caméra ne sont pas dessinées. Un modèle = deux appels de dessin
 *   pour toute la ville (au lieu d'un par bloc de 128 m).
 */
import * as THREE from 'three';
import { partitionLod, type LodView } from './lod';

/** Calcule une dernière fois les matrices de `root` et de ses descendants, puis les fige. */
export function freezeStatic(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  root.traverse((o) => { o.matrixAutoUpdate = false; });
}

/** Rattache (`on`) ou détache `obj` de `parent`, sans rien recréer. */
export function setAttached(obj: THREE.Object3D, parent: THREE.Object3D, on: boolean): void {
  if (on && obj.parent !== parent) parent.add(obj);
  else if (!on && obj.parent === parent) parent.remove(obj);
}

/**
 * Deux InstancedMesh (complet, simplifié) qui se partagent les mêmes instances : à chaque mise à
 * jour, les instances proches sont écrites dans le premier, les lointaines dans le second.
 * Les tampons ne sont réécrits que si une instance change de niveau.
 */
export class InstancedLod {
  readonly full: THREE.InstancedMesh;
  /** Maquette au loin ; null : pas de maquette (seul le tri par distance et par champ s'applique). */
  readonly proxy: THREE.InstancedMesh | null;
  private readonly mats: Float32Array;
  private readonly cols: Float32Array | null;
  private readonly xz: Float32Array;
  private readonly levels: Uint8Array;
  private readonly radius: number;
  private first = true;

  constructor(full: THREE.InstancedMesh, proxyGeometry: THREE.BufferGeometry | null) {
    this.full = full;
    const n = full.count;
    this.mats = Float32Array.from(full.instanceMatrix.array as Float32Array);
    this.cols = full.instanceColor ? Float32Array.from(full.instanceColor.array as Float32Array) : null;
    this.xz = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { this.xz[i * 2] = this.mats[i * 16 + 12]!; this.xz[i * 2 + 1] = this.mats[i * 16 + 14]!; }
    this.levels = new Uint8Array(n).fill(0);
    // Demi-diagonale d'une instance (échelle de la première) : la distance se prend au bord.
    if (!full.geometry.boundingSphere) full.geometry.computeBoundingSphere();
    const sx = Math.hypot(this.mats[0]!, this.mats[1]!, this.mats[2]!);
    this.radius = (full.geometry.boundingSphere?.radius ?? 0) * sx;
    // Instances réparties sur toute la ville : le tri par le champ se fait instance par instance.
    full.frustumCulled = false;
    if (!full.boundingSphere) full.computeBoundingSphere();
    if (!full.boundingBox) full.computeBoundingBox();
    this.proxy = null;
    if (!proxyGeometry) return;
    const p = new THREE.InstancedMesh(proxyGeometry, full.material, n);
    p.name = `${full.name} (loin)`;
    p.castShadow = false; // au loin, hors du cadre d'ombre du soleil
    p.frustumCulled = false;
    p.receiveShadow = full.receiveShadow;
    if (this.cols) p.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.cols.length), 3);
    p.boundingSphere = full.boundingSphere!.clone();
    p.boundingBox = full.boundingBox!.clone();
    p.count = 0;
    p.matrixAutoUpdate = full.matrixAutoUpdate;
    p.matrix.copy(full.matrix);
    p.matrixWorld.copy(full.matrixWorld);
    this.proxy = p;
  }

  /** Nombre d'instances dessinées en version complète / simplifiée (QA). */
  get counts(): { full: number; proxy: number } { return { full: this.full.count, proxy: this.proxy?.count ?? 0 }; }

  /**
   * Répartit les instances selon la caméra : complètes à moins de `near` m, maquettes jusqu'à
   * `far` m, rien au-delà ni hors du cône de vue.
   */
  update(view: LodView, near: number, far: number): void {
    // Sans maquette, tout ce qui est dessiné l'est en version complète.
    const { full, proxy, changed } = partitionLod(this.xz, this.levels, view, this.proxy ? near : Infinity, far, this.radius);
    if (!changed && !this.first) return;
    this.first = false;
    const fm = this.full.instanceMatrix.array as Float32Array;
    const pm = (this.proxy?.instanceMatrix.array ?? fm) as Float32Array;
    const fc = this.full.instanceColor?.array as Float32Array | undefined;
    const pc = this.proxy?.instanceColor?.array as Float32Array | undefined;
    let a = 0;
    let b = 0;
    for (let i = 0; i < this.levels.length; i++) {
      if (this.levels[i] === 2) continue;
      const near0 = this.levels[i] === 0;
      const dst = near0 ? fm : pm;
      const k = near0 ? a : b;
      dst.set(this.mats.subarray(i * 16, i * 16 + 16), k * 16);
      if (this.cols) (near0 ? fc : pc)?.set(this.cols.subarray(i * 3, i * 3 + 3), k * 3);
      if (near0) a++; else b++;
    }
    this.full.count = full;
    // Un groupe vide n'est pas parcouru par le moteur (ni programme ni uniformes à poser).
    this.full.visible = full > 0;
    this.full.instanceMatrix.needsUpdate = true;
    if (this.full.instanceColor) this.full.instanceColor.needsUpdate = true;
    if (this.proxy) {
      this.proxy.count = proxy;
      this.proxy.visible = proxy > 0;
      this.proxy.instanceMatrix.needsUpdate = true;
      if (this.proxy.instanceColor) this.proxy.instanceColor.needsUpdate = true;
    }
  }

  /** Le maillage simplifié est propre à ce groupe ; la géométrie simplifiée est partagée (non libérée). */
  dispose(): void {
    this.proxy?.removeFromParent();
    this.proxy?.dispose();
  }
}
