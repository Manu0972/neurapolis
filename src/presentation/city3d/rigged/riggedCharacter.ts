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
import { animInterval, chooseClip, locoBlend, LOCO_SPEC, movingAmount, nextGait, RIG_CLIPS, smoothSpeed, type CharacterActivity, type Gait, type RigClip } from './animState';
import { hash32, modelFor, type RigRequest } from './manifest';
import { applyRecolor, type RecolorHandle } from './recolor';
import type { RecolorSpec } from './recolorLogic';
import { attachGear, type GearHandle, type GearSpec } from './gear';
import { fitOf, maskOf, loadRigAsset, lodDistance, rigAssetIfLoaded, rigCounters, riggedManifest, riggedState, startRiggedCharacters, type RigAsset } from './library';

const LOCO_NAMES = ['walk', 'jog', 'run'] as const;

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
  /** Phase du pas (0 à 1), partagée par marche / petite course / course. */
  private phase: number;
  /** Foulée relative au mannequin UAL, à la taille affichée. */
  readonly legScale: number;

  private recolor: RecolorHandle | null = null;
  private gear: GearHandle | null = null;

  constructor(asset: RigAsset, heightM: number, seed: number, recolor?: RecolorSpec, gear?: GearSpec) {
    this.model = cloneSkinned(asset.template);
    if (recolor) {
      const mask = maskOf(asset);
      if (mask) { this.recolor = applyRecolor(this.model, mask); this.recolor.set(recolor); }
    }
    // Accessoires (joueur seulement) : posés en pose de liaison, avant toute animation.
    if (gear && gear.items.length > 0) {
      const fit = fitOf(asset);
      if (fit) this.gear = attachGear(this.model, fit, gear);
    }
    const s = heightM / asset.height;
    // Le studio exporte face à +Z ; le jeu attend un personnage tourné vers −Z.
    this.pivot.rotation.y = Math.PI;
    this.pivot.scale.setScalar(s);
    this.pivot.position.y = -asset.minY * s;
    this.pivot.add(this.model);
    this.legScale = asset.legScale * s;
    this.phase = (seed % 997) / 997;
    this.mixer = new THREE.AnimationMixer(this.model);
    for (const [name, clip] of asset.clips) {
      const a = this.mixer.clipAction(clip);
      a.play();
      // Phase propre à chacun : une foule n'ondule pas à l'unisson.
      a.time = ((seed % 997) / 997) * clip.duration;
      // Marche / courses : le temps est posé à la main (phase commune), pas avancé par le mixeur.
      if ((LOCO_NAMES as readonly string[]).includes(name)) a.timeScale = 0;
      a.setEffectiveWeight(name === 'idle' ? 1 : 0);
      this.actions.set(name, a);
      this.weights.set(name, name === 'idle' ? 1 : 0);
    }
    this.mixer.update(0);
  }

  get clip(): RigClip { return this.current; }

  update(dt: number, speed: number, activity: CharacterActivity, visible: boolean, distance: number): void {
    // Assis (à vélo, sur un siège) : on reste assis même si le support avance.
    const sitting = activity === 'sit';
    const m = sitting ? 0 : movingAmount(speed);
    const blend = locoBlend(sitting ? 0 : speed, this.legScale);
    this.gait = nextGait(this.gait, sitting ? 0 : speed, this.legScale);
    // Cible de poids : repos (ou activité) × (1 − marche) ; marche / petite course / course fondues.
    const rest = chooseClip('idle', sitting ? 'sit' : activity);
    const target = new Map<RigClip, number>();
    for (const n of RIG_CLIPS) target.set(n, 0);
    target.set(this.actions.has(rest) ? rest : 'idle', 1 - m);
    for (const n of LOCO_NAMES) if (this.actions.has(n)) target.set(n, (target.get(n) ?? 0) + m * blend[n]);
    // Clip « affiché » (QA) : le plus lourd.
    let best: RigClip = 'idle';
    let bw = -1;
    for (const [n, w] of target) if (w > bw) { bw = w; best = n; }
    this.current = best;
    // Fondus : plus lents pour s'asseoir, rapides pour partir ou s'arrêter.
    const fade = best === 'sit' ? 0.45 : 0.16;
    const step = dt / fade;
    let sum = 0;
    for (const [name, a] of this.actions) {
      const w = this.weights.get(name) ?? 0;
      const want = target.get(name) ?? 0;
      const nw = w + Math.max(-step, Math.min(step, want - w));
      if (nw !== w) { this.weights.set(name, nw); a.setEffectiveWeight(nw); }
      sum += nw;
    }
    // Les poids restent normalisés (somme 1) : pas de pose « à moitié » pendant un fondu.
    if (sum > 1e-4 && Math.abs(sum - 1) > 0.02) for (const [name, a] of this.actions) a.setEffectiveWeight((this.weights.get(name) ?? 0) / sum);
    if (!visible) { rigCounters.skippedUpdates++; return; }
    this.acc += dt;
    if (this.acc >= animInterval(distance)) {
      const el = Math.min(this.acc, 0.5);
      // Phase de pas commune : avance à la cadence qui colle le pied d'appui au sol.
      if (m > 0.01) this.phase = (this.phase + blend.cadence * el) % 1;
      for (const n of LOCO_NAMES) {
        const a = this.actions.get(n);
        if (!a) continue;
        const spec = LOCO_SPEC[n];
        a.time = (((this.phase + spec.phase) % 1) + 1) % 1 * a.getClip().duration;
      }
      this.mixer.update(el);
      this.acc = 0;
      rigCounters.mixerUpdates++;
    } else rigCounters.skippedUpdates++;
  }

  setRecolor(spec: RecolorSpec | undefined): void { this.recolor?.set(spec); }

  dispose(): void {
    this.recolor?.dispose();
    this.gear?.dispose();
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    this.model.traverse((o) => { (o as THREE.SkinnedMesh).skeleton?.dispose(); });
    this.pivot.removeFromParent();
  }
}

export interface RiggedSpec {
  rig: RigRequest;
  heightM?: number;
  /** Teintes peau / cheveux / tenue (modèles recolorables uniquement). */
  recolor?: RecolorSpec;
  /** Teintes appliquées seulement si le modèle est tiré au sort (pas attitré à ce personnage). */
  recolorWhenAuto?: RecolorSpec;
  /** Accessoires portés (joueur). */
  gear?: GearSpec;
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
  private recolor: RecolorSpec | undefined;

  constructor(private readonly spec: RiggedSpec, private readonly fallback: () => Character3D) {
    this.root.name = 'personnage_rigge';
    live.add(this);
    this.heightM = spec.heightM ?? 1.7;
    this.recolor = spec.recolor;
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
    const rc = this.recolor ?? (asset.entry.auto ? this.spec.recolorWhenAuto : undefined);
    this.rig = new RigInstance(asset, this.heightM, hash32(this.req.key), rc, this.spec.gear);
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

  setRecolor(spec: RecolorSpec | undefined): void {
    this.recolor = spec;
    this.rig?.setRecolor(spec);
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
    this.speedS = smoothSpeed(this.speedS, v, dt);
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
