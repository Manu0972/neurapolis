/**
 * Accessoires des modèles riggés — logique pure (sans Three.js ni DOM, donc testable).
 *
 * Les modèles du studio n'ont ni os d'accessoire ni repère de tête : on mesure le corps une fois
 * par modèle (boîtes des sommets dominés par chaque os, positions des os en pose de liaison), puis
 * on place chaque accessoire dans l'espace du modèle (Y en haut, face vers +Z, gauche du
 * personnage vers +X). La partie Three.js (`gear.ts`) convertit ensuite cette place dans le repère
 * de l'os porteur : l'accessoire suit le squelette sans être déformé.
 */
import type { PlayerGearColorKey } from '../../../core/types';

export type Vec3 = [number, number, number];
export interface Box { min: Vec3; max: Vec3 }

/** Os du squelette UAL utilisés pour mesurer et porter les accessoires. */
export const GEAR_BONES = ['Head', 'neck_01', 'spine_03', 'spine_02', 'pelvis', 'upperarm_l', 'lowerarm_l', 'hand_l'] as const;
export type GearBone = (typeof GEAR_BONES)[number];

/** Mesures brutes d'un modèle (espace de liaison). */
export interface BodySample {
  minY: number;
  maxY: number;
  bones: Partial<Record<GearBone, Vec3>>;
  /** Boîte des sommets dont l'os dominant est celui-ci. */
  boxes: Partial<Record<GearBone, Box>>;
}

/**
 * Mesure un maillage skinné : `positions` (x, y, z par sommet), `skinIndex` / `skinWeight`
 * (4 par sommet), `boneNames[i]` et `bonePos[i]` (position de l'os i en pose de liaison).
 */
export function sampleBody(
  positions: ArrayLike<number>, skinIndex: ArrayLike<number>, skinWeight: ArrayLike<number>,
  boneNames: readonly string[], bonePos: readonly Vec3[],
): BodySample {
  const wanted = new Map<number, GearBone>();
  const bones: Partial<Record<GearBone, Vec3>> = {};
  boneNames.forEach((n, i) => {
    if ((GEAR_BONES as readonly string[]).includes(n)) { wanted.set(i, n as GearBone); bones[n as GearBone] = [...bonePos[i]!] as Vec3; }
  });
  const boxes: Partial<Record<GearBone, Box>> = {};
  let minY = Infinity;
  let maxY = -Infinity;
  const n = Math.floor(positions.length / 3);
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3]!;
    const y = positions[v * 3 + 1]!;
    const z = positions[v * 3 + 2]!;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    let best = -1;
    let bw = -1;
    for (let c = 0; c < 4; c++) {
      const w = skinWeight[v * 4 + c] ?? 0;
      if (w > bw) { bw = w; best = skinIndex[v * 4 + c] ?? -1; }
    }
    const name = wanted.get(best);
    if (!name) continue;
    const b = boxes[name] ?? (boxes[name] = { min: [x, y, z], max: [x, y, z] });
    if (x < b.min[0]) b.min[0] = x; if (x > b.max[0]) b.max[0] = x;
    if (y < b.min[1]) b.min[1] = y; if (y > b.max[1]) b.max[1] = y;
    if (z < b.min[2]) b.min[2] = z; if (z > b.max[2]) b.max[2] = z;
  }
  if (!Number.isFinite(minY)) { minY = 0; maxY = 1.65; }
  return { minY, maxY, bones, boxes };
}

/** Repères du corps déduits des mesures (toujours complets : replis sur les proportions). */
export interface BodyFit {
  /** Hauteur totale. */
  H: number;
  /** Boîte de la tête, cheveux compris. */
  head: Box;
  /** Hauteur des yeux. */
  eyeY: number;
  neck: { pos: Vec3; r: number };
  /** Torse : centre (x, z), dos (z min), poitrine (z max), demi-largeur, haut et bas. */
  torso: { x: number; back: number; front: number; halfW: number; top: number; bottom: number };
  pelvis: Vec3;
  /** Poignet gauche : position, direction coude → main, rayon. */
  wrist: { pos: Vec3; dir: Vec3; r: number };
  /** Cou et tête recalés (rig à grosse tête) : la tête commence au haut du torse. */
  bigHead: boolean;
}

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const union = (a: Box | undefined, b: Box | undefined): Box | undefined => {
  if (!a) return b;
  if (!b) return a;
  return { min: [0, 1, 2].map((i) => Math.min(a.min[i]!, b.min[i]!)) as Vec3, max: [0, 1, 2].map((i) => Math.max(a.max[i]!, b.max[i]!)) as Vec3 };
};

/** Part de la hauteur de la tête (depuis le bas de sa boîte) où se trouvent les yeux. */
export const EYE_LEVEL = 0.47;

export function fitBody(s: BodySample): BodyFit {
  const H = Math.max(0.3, s.maxY - s.minY);
  const at = (f: number): number => s.minY + f * H;
  let headBone = s.bones.Head ?? [0, at(0.84), 0];
  let neckBone = s.bones.neck_01 ?? [headBone[0], headBone[1] - 0.055 * H, headBone[2]];
  // Certains rigs automatiques (grosse tête de style chibi) placent cou et tête bien trop haut. Sur
  // les modèles du studio, le cou est ~0,09 H au-dessus des épaules (os du bras en pose en T) : au-delà
  // de 0,15 H, on le ramène là, et la tête juste au-dessus.
  const arm = s.bones.upperarm_l;
  const neckFixed = !!arm && neckBone[1] > arm[1] + 0.15 * H;
  if (neckFixed) neckBone = [neckBone[0], arm[1] + 0.09 * H, neckBone[2]];
  if (neckFixed || headBone[1] > s.maxY - 0.03 * H) headBone = [headBone[0], neckBone[1] + 0.06 * H, headBone[2]];
  // Tête : boîte mesurée si elle est plausible, sinon proportions d'un modèle UAL de 1,65 m.
  let head = s.boxes.Head;
  if (neckFixed || !head || head.max[1] - head.min[1] < 0.08 * H || head.max[0] - head.min[0] < 0.06 * H) {
    head = { min: [headBone[0] - 0.085 * H, headBone[1] - 0.04 * H, headBone[2] - 0.11 * H], max: [headBone[0] + 0.085 * H, s.maxY, headBone[2] + 0.07 * H] };
  }
  const hh = head.max[1] - head.min[1];
  const hw = (head.max[0] - head.min[0]) / 2;
  const neckR = clamp(hw * 0.42, 0.03 * H, 0.06 * H);
  // Torse : sommets du haut du dos ; on écarte les bras (T-pose) en bornant la largeur.
  const tb = union(s.boxes.spine_03, s.boxes.spine_02);
  const sp3 = s.bones.spine_03 ?? [neckBone[0], at(0.69), neckBone[2]];
  const pelvis = s.bones.pelvis ?? [neckBone[0], at(0.5), neckBone[2]];
  // Profondeur bornée : sur un rig approximatif, des mèches ou un objet tenu comptent pour le torse.
  const tz = tb ? (tb.min[2] + tb.max[2]) / 2 : 0;
  const tDepth = tb ? Math.min(tb.max[2] - tb.min[2], 0.2 * H) / 2 : 0;
  const torso = tb
    ? { x: (tb.min[0] + tb.max[0]) / 2, back: tz - tDepth, front: tz + tDepth, halfW: clamp((tb.max[0] - tb.min[0]) / 2, 0.05 * H, 0.11 * H), top: neckBone[1], bottom: pelvis[1] }
    : { x: sp3[0], back: sp3[2] - 0.07 * H, front: sp3[2] + 0.07 * H, halfW: 0.075 * H, top: neckBone[1], bottom: pelvis[1] };
  // Poignet : un peu avant l'articulation de la main, sur l'avant-bras.
  const hand = s.bones.hand_l ?? [0.42 * H, at(0.68), 0];
  const elbow = s.bones.lowerarm_l ?? [0.27 * H, at(0.68), 0];
  let dir: Vec3 = [hand[0] - elbow[0], hand[1] - elbow[1], hand[2] - elbow[2]];
  const len = Math.hypot(...dir);
  dir = len > 1e-6 ? (dir.map((v) => v / len) as Vec3) : [1, 0, 0];
  const back = 0.022 * H;
  const fa = s.boxes.lowerarm_l;
  const faR = fa ? Math.min(fa.max[1] - fa.min[1], fa.max[2] - fa.min[2]) / 2 * 0.8 : 0.02 * H;
  // Poignet mesuré : bout de l'avant-bras (sommets de l'os de l'avant-bras), sur l'axe de sa boîte. L'os
  // de la main d'un rig automatique peut se trouver au-delà de la main dessinée.
  let wristPos: Vec3 = [hand[0] - dir[0] * back, hand[1] - dir[1] * back, hand[2] - dir[2] * back];
  if (fa) {
    const c: Vec3 = [(fa.min[0] + fa.max[0]) / 2, (fa.min[1] + fa.max[1]) / 2, (fa.min[2] + fa.max[2]) / 2];
    const half = (Math.abs(dir[0]) * (fa.max[0] - fa.min[0]) + Math.abs(dir[1]) * (fa.max[1] - fa.min[1]) + Math.abs(dir[2]) * (fa.max[2] - fa.min[2])) / 2;
    const t = Math.max(0, half - 0.6 * back);
    wristPos = [c[0] + dir[0] * t, c[1] + dir[1] * t, c[2] + dir[2] * t];
  }
  return {
    H,
    head,
    eyeY: head.min[1] + EYE_LEVEL * hh,
    // Écharpe à la base du cou : les rigs du studio placent l'os du cou vers le menton des grosses têtes
    // d'enfants ; entre épaules et cou, elle ne cache plus la bouche.
    neck: { pos: [neckBone[0], arm ? Math.max(arm[1] + 0.04 * H, neckBone[1] - 0.035 * H) : neckBone[1] + 0.012 * H, neckBone[2]], r: neckR },
    torso,
    pelvis,
    wrist: { pos: wristPos, dir, r: clamp(faR, 0.014 * H, 0.03 * H) },
    bigHead: neckFixed,
  };
}

/** Pièces d'accessoire (une géométrie partagée chacune, à l'échelle 1). */
export type GearPiece =
  | 'casquette' | 'bonnet' | 'ecouteurs' | 'lunettes' | 'verres' | 'echarpe' | 'montre'
  | 'sac_dos' | 'bretelles' | 'sacoche' | 'bandouliere';

/** Place d'une pièce dans l'espace du modèle (avant conversion dans le repère de l'os). */
export interface GearPlacement {
  piece: GearPiece;
  /** Couleur : celle de l'accessoire (clé) ou une teinte fixe (`#rrggbb`). */
  color: PlayerGearColorKey | `#${string}`;
  bone: GearBone;
  pos: Vec3;
  scale: Vec3;
  /** Rotation (quaternion x, y, z, w) ; absente = identité. */
  quat?: [number, number, number, number];
}

/** Quaternion qui amène l'axe +X sur `d` (unitaire). */
export function quatFromX(d: Vec3): [number, number, number, number] {
  const [x, y, z] = d;
  const dot = x;
  if (dot < -0.9999) return [0, 0, 1, 0];
  // Axe = X × d = (0, −z, y) ; q = (axe, 1 + dot) normalisé.
  const q: [number, number, number, number] = [0, -z, y, 1 + dot];
  const n = Math.hypot(...q);
  return q.map((v) => v / n) as [number, number, number, number];
}

/** Pièces et places d'un accessoire (ou des lunettes) sur un corps mesuré. */
export function placeGear(kind: PlayerGearColorKey, f: BodyFit, opts: { sunglasses?: boolean } = {}): GearPlacement[] {
  const h = f.head;
  const cx = (h.min[0] + h.max[0]) / 2;
  const cz = (h.min[2] + h.max[2]) / 2;
  const hw = (h.max[0] - h.min[0]) / 2;
  const hd = (h.max[2] - h.min[2]) / 2;
  const hh = h.max[1] - h.min[1];
  const top = h.max[1];
  const t = f.torso;
  switch (kind) {
    case 'casquette': {
      const y0 = top - 0.4 * hh;
      return [{ piece: 'casquette', color: 'casquette', bone: 'Head', pos: [cx, y0, cz], scale: [hw * 1.07, (top - y0) * 1.1, hd * 1.07] }];
    }
    case 'bonnet': {
      const y0 = top - 0.5 * hh;
      return [{ piece: 'bonnet', color: 'bonnet', bone: 'Head', pos: [cx, y0, cz], scale: [hw * 1.08, (top - y0) * 1.12, hd * 1.08] }];
    }
    case 'ecouteurs': {
      const y0 = f.eyeY - 0.06 * hh;
      return [{ piece: 'ecouteurs', color: 'ecouteurs', bone: 'Head', pos: [cx, y0, cz + 0.12 * hd], scale: [hw * 1.06, (top - y0) * 1.04, hw * 1.06] }];
    }
    case 'lunettes': {
      const s = hw * 0.78;
      const z = h.max[2] - 0.006 * f.H;
      const out: GearPlacement[] = [{ piece: 'lunettes', color: 'lunettes', bone: 'Head', pos: [cx, f.eyeY, z], scale: [s, s, s] }];
      if (opts.sunglasses) out.push({ piece: 'verres', color: '#1c1f26', bone: 'Head', pos: [cx, f.eyeY, z], scale: [s, s, s] });
      return out;
    }
    case 'echarpe': {
      const r = f.neck.r;
      return [{ piece: 'echarpe', color: 'echarpe', bone: 'neck_01', pos: f.neck.pos, scale: [r * 1.25, r, r * 1.25] }];
    }
    case 'montre': {
      const r = f.wrist.r;
      return [{ piece: 'montre', color: 'montre', bone: 'lowerarm_l', pos: f.wrist.pos, scale: [r, r, r], quat: quatFromX(f.wrist.dir) }];
    }
    case 'sac_dos': {
      const hgt = (t.top - t.bottom) * 0.78;
      const w = t.halfW * 1.5;
      const d = 0.085 * f.H;
      const y = t.bottom + (t.top - t.bottom) * 0.56;
      return [
        { piece: 'sac_dos', color: 'sac_dos', bone: 'spine_03', pos: [t.x, y, t.back - d * 0.42], scale: [w, hgt, d] },
        { piece: 'bretelles', color: 'sac_dos', bone: 'spine_03', pos: [t.x, y, t.front + 0.004 * f.H], scale: [t.halfW, hgt, 1] },
      ];
    }
    case 'sacoche': {
      const w = 0.17 * f.H;
      return [
        { piece: 'sacoche', color: 'sacoche', bone: 'pelvis', pos: [t.x - t.halfW * 1.05, f.pelvis[1] - 0.01 * f.H, (t.back + t.front) / 2], scale: [w * 0.35, w * 0.7, w] },
        { piece: 'bandouliere', color: 'sacoche', bone: 'spine_03', pos: [t.x, (t.top + t.bottom) / 2, t.front + 0.004 * f.H], scale: [t.halfW * 1.1, (t.top - t.bottom) * 0.62, 1] },
      ];
    }
  }
}
