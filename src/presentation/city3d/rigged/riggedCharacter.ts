/**
 * Personnage riggé (modèle du studio sur le squelette UAL) avec repli procédural.
 *
 * Même interface que `simpleCharacter.ts` (`Character3D`) : pieds à y = 0, regard vers −Z, cap en
 * radians. Tant que le manifeste ou le modèle se charge — ou s'ils sont absents ou illisibles —
 * le personnage procédural est affiché ; il est remplacé par le modèle riggé dès qu'il est prêt.
 *
 * Animation : un `AnimationMixer` par personnage, des clips partagés par modèle, des poids lissés
 * entre repos / marche / petite course / course (cadence calée sur la vitesse), et les activités
 * à l'arrêt (assis, parler). Niveau de détail : au loin, l'animation est mise à jour moins
 * souvent ; un personnage masqué (chez lui, endormi) n'est plus animé du tout.
 */
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Character3D } from '../simpleCharacter';
import { animInterval, chooseClip, gaitRate, nextGait, type CharacterActivity, type Gait, type RigClip } from './animState';
import { hash32, modelFor, type RigRequest } from './manifest';
import { loadRigAsset, lodDistance, rigAssetIfLoaded, rigCounters, riggedManifest, riggedState, startRiggedCharacters, type RigAsset } from './library';

const LOCOMOTION: ReadonlySet<RigClip> = new Set(['walk', 'jog', 'run']);

/** Squelette cloné, mixeur et poids des clips d'un personnage. */
class RigInstance {
  readonly pivot = new THREE.Group();
  private readonly model: THREE.Object3D;
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<RigClip, THREE.AnimationAction>();
  private readonly weights = new Map<RigClip, number>();
  private gait: Gait = 'idle';
  private current: RigClip = 'idle';
  private acc = 0;
  /** Foulée relative au mannequin UAL, à la taille affichée. */
  readonly legScale: number;

  constructor(asset: RigAsset, heightM: number, seed: number) {
    this.model = cloneSkinned(asset.template);
    const s = heightM / asset.height;
    // Le studio exporte face à +Z ; le jeu attend un personnage tourné vers −Z.
    this.pivot.rotation.y = Math.PI;
    this.pivot.scale.setScalar(s);
    this.pivot.position.y = -asset.minY * s;
    this.pivot.add(this.model);
    this.legScale = asset.legScale * s;
    this.mixer = new THREE.AnimationMixer(this.model);
    for (const [name, clip] of asset.clips) {
      const a = this.mixer.clipAction(clip);
      a.play();
      // Phase propre à chacun : une foule n'ondule pas à l'unisson.
      a.time = ((seed % 997) / 997) * clip.duration;
      a.setEffectiveWeight(name === 'idle' ? 1 : 0);
      this.actions.set(name, a);
      this.weights.set(name, name === 'idle' ? 1 : 0);
    }
    this.mixer.update(0);
  }

  get clip(): RigClip { return this.current; }

  update(dt: number, speed: number, activity: CharacterActivity, visible: boolean, distance: number): void {
    // Assis (à vélo, sur un siège) : on reste assis même si le support avance.
    const gait = activity === 'sit' ? 'idle' : nextGait(this.gait, speed, this.legScale);
    let target = chooseClip(gait, activity);
    if (!this.actions.has(target)) target = 'idle';
    if (target !== this.current) {
      // Changement d'allure : la nouvelle reprend la foulée au même point du cycle.
      const from = this.actions.get(this.current);
      const to = this.actions.get(target);
      if (from && to && LOCOMOTION.has(this.current) && LOCOMOTION.has(target)) {
        const d0 = from.getClip().duration || 1;
        to.time = ((from.time % d0) / d0) * to.getClip().duration;
      }
      this.current = target;
    }
    this.gait = gait;
    const act = this.actions.get(this.current);
    if (act && LOCOMOTION.has(this.current)) act.timeScale = gaitRate(gait, speed, this.legScale);
    // Fondus enchaînés : plus lents pour s'asseoir.
    const fade = this.current === 'sit' ? 0.45 : 0.22;
    const step = dt / fade;
    for (const [name, a] of this.actions) {
      const w = this.weights.get(name) ?? 0;
      const want = name === this.current ? 1 : 0;
      const nw = w + Math.max(-step, Math.min(step, want - w));
      if (nw !== w) { this.weights.set(name, nw); a.setEffectiveWeight(nw); }
    }
    if (!visible) { rigCounters.skippedUpdates++; return; }
    this.acc += dt;
    if (this.acc >= animInterval(distance)) {
      this.mixer.update(Math.min(this.acc, 0.5));
      this.acc = 0;
      rigCounters.mixerUpdates++;
    } else rigCounters.skippedUpdates++;
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    this.model.traverse((o) => { (o as THREE.SkinnedMesh).skeleton?.dispose(); });
    this.pivot.removeFromParent();
  }
}

export interface RiggedSpec {
  rig: RigRequest;
  heightM?: number;
}

/** Personnage riggé si le manifeste en prévoit un pour lui (ou s'il se charge encore) ; sinon `null`. */
export function createRiggedCharacter(spec: RiggedSpec, fallback: () => Character3D): Character3D | null {
  if (riggedState() === 'idle') void startRiggedCharacters();
  const st = riggedState();
  if (st === 'absent') return null;
  if (st === 'ready') {
    const entry = modelFor(riggedManifest(), { ...spec.rig, heightM: spec.rig.heightM ?? spec.heightM });
    if (!entry || rigAssetIfLoaded(entry.id) === null) return null;
  }
  return new HybridCharacter(spec, fallback);
}

/** Personnages riggés vivants (QA : `riggedInstances()` depuis la console). */
const live = new Set<HybridCharacter>();

/** État des personnages riggés affichés : clé, modèle chargé, clip joué, position, visibilité. */
export function riggedInstances(): { key: string; rigged: boolean; clip: RigClip | null; x: number; z: number; visible: boolean }[] {
  return [...live].map((h) => h.debugInfo());
}

/** QA : objet racine du personnage de clé `key` (mesures de performance depuis la console). */
export function riggedRootOf(key: string): THREE.Object3D | null {
  for (const h of live) if (h.debugInfo().key === key) return h.root;
  return null;
}

const smooth = (cur: number, target: number, rate: number, dt: number): number => cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** Enveloppe : procédural d'attente, puis modèle riggé dès qu'il est prêt. */
class HybridCharacter implements Character3D {
  readonly root = new THREE.Group();
  private proc: Character3D | null = null;
  private rig: RigInstance | null = null;
  private disposed = false;
  private heading = 0;
  private shown = 0;
  private turnRate = 0;
  private speedS = 0;
  private activity: CharacterActivity = 'auto';
  private readonly req: RigRequest;
  private readonly heightM: number;

  constructor(spec: RiggedSpec, private readonly fallback: () => Character3D) {
    this.root.name = 'personnage_rigge';
    live.add(this);
    this.heightM = spec.heightM ?? 1.7;
    this.req = { ...spec.rig, heightM: spec.rig.heightM ?? this.heightM };
    const entry = riggedState() === 'ready' ? modelFor(riggedManifest(), this.req) : null;
    const asset = entry ? rigAssetIfLoaded(entry.id) : undefined;
    if (asset) this.attach(asset);
    else {
      this.proc = this.fallback();
      this.root.add(this.proc.root);
      void this.resolve();
    }
  }

  debugInfo(): { key: string; rigged: boolean; clip: RigClip | null; x: number; z: number; visible: boolean } {
    const p = this.root.position;
    return { key: this.req.key, rigged: !!this.rig, clip: this.rig?.clip ?? null, x: +p.x.toFixed(2), z: +p.z.toFixed(2), visible: this.root.visible };
  }

  private async resolve(): Promise<void> {
    const m = await startRiggedCharacters();
    const entry = modelFor(m, this.req);
    if (!entry || this.disposed) return;
    const asset = await loadRigAsset(entry);
    if (asset && !this.disposed && !this.rig) this.attach(asset);
  }

  private attach(asset: RigAsset): void {
    this.rig = new RigInstance(asset, this.heightM, hash32(this.req.key));
    this.root.add(this.rig.pivot);
    rigCounters.instances++;
    if (this.proc) {
      this.proc.dispose();
      this.proc.root.removeFromParent();
      this.proc = null;
    }
  }

  setHeading(r: number): void {
    if (!Number.isFinite(r)) return;
    this.heading = r;
    this.proc?.setHeading(r);
  }

  setActivity(activity: CharacterActivity): void {
    this.activity = activity;
  }

  update(dt: number, speed: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    const v = Number.isFinite(speed) && speed > 0 ? speed : 0;
    if (this.proc) {
      // Le procédural tourne sur lui-même ; on reporte son cap sur l'enveloppe (le vélo s'y aligne).
      this.proc.update(dt, v);
      this.root.rotation.y = this.proc.root.rotation.y;
      this.proc.root.rotation.y = 0;
      this.shown = this.root.rotation.y;
      return;
    }
    if (!this.rig) return;
    this.speedS = smooth(this.speedS, v, 9, dt);
    const walk = Math.min(1, this.speedS / 1.3);
    let dh = this.heading - this.shown;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const step = dh * (1 - Math.exp(-(8 + walk * 4) * dt));
    this.shown += step;
    this.turnRate = smooth(this.turnRate, step / Math.max(dt, 1e-3), 10, dt);
    this.root.rotation.y = this.shown;
    // Légère inclinaison vers l'intérieur des virages.
    this.root.rotation.z = Math.max(-0.1, Math.min(0.1, -this.turnRate * 0.025 * walk));
    const d = lodDistance(this.root.position.x, this.root.position.z);
    this.rig.update(dt, this.speedS, this.activity, this.root.visible, d);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    live.delete(this);
    if (this.rig) { this.rig.dispose(); rigCounters.instances--; this.rig = null; }
    if (this.proc) { this.proc.dispose(); this.proc = null; }
    this.root.removeFromParent();
  }
}
