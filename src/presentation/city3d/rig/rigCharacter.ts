/**
 * Personnage « maison » sur le squelette libre de la Universal Animation Library (Quaternius, CC0).
 *
 * Le corps est construit par nous, dans le style des planches de référence (low-poly, visage
 * peint en pixels) : chaque volume est accroché à son os, donc toutes les animations de la
 * bibliothèque l'animent (marcher, porter, s'asseoir, téléphoner…). Les proportions suivent
 * l'âge (tête plus grosse, jambes plus courtes chez l'enfant), la silhouette adulte (8 traits)
 * module les volumes, et l'apparence (peau, cheveux, yeux, tenue, accessoires) vient du joueur
 * ou de l'habitant. Même interface que `simpleCharacter.ts` (`Character3D`), plus des gestes.
 */
import * as THREE from 'three';
import type { BodyShapeKey, PlayerAppearance, PlayerHairStyle } from '../../../core/types';
import { DEFAULT_PLAYER_APPEARANCE } from '../../../core/types';
import { EYE_COLOR_INFO, HAIR_COLOR_INFO, OUTFIT_COLOR_INFO, SKIN_TONE_INFO } from '../../../core/player_customization';
import type { Character3D, CharacterSpec } from '../simpleCharacter';
import type { AnimLibrary } from './animLibrary';

/** Taille du squelette source (m) : sommet du crâne. */
const RIG_HEIGHT = 1.75;
/** Longueur de jambe du squelette source (hanche → cheville). */
const LEG_LEN = 0.83;

export interface RigCharacter extends Character3D {
  /** Joue un geste (une fois, ou en boucle jusqu'à `stopGesture`). Renvoie false si inconnu. */
  play(name: string, opts?: { loop?: boolean; fade?: number }): boolean;
  stopGesture(fade?: number): void;
  readonly gesture: string | null;
}

// ---------- Matériaux et géométries partagés ----------

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.85, flat = false): THREE.MeshStandardMaterial {
  const k = `${color}_${rough}_${flat}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: flat });
    matCache.set(k, m);
  }
  return m;
}
const geoCache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const SPHERE = (): THREE.BufferGeometry => geo('sphere', () => new THREE.SphereGeometry(1, 12, 10));
const SPHERE_HI = (): THREE.BufferGeometry => geo('sphereHi', () => new THREE.SphereGeometry(1, 14, 11));
const CYL = (): THREE.BufferGeometry => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 10, 1));
const BOX = (): THREE.BufferGeometry => geo('box', () => new THREE.BoxGeometry(1, 1, 1));
const HALF = (): THREE.BufferGeometry => geo('half', () => new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2));

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

// ---------- Tenues ----------

interface Look { top: string; legs: string; longSleeves: boolean; jacket?: string; tie?: string; shoes: string; sole: string }

function outfitLook(a: PlayerAppearance, override?: string, legOverride?: string): Look {
  const main = override ?? OUTFIT_COLOR_INFO[a.outfitColor]?.hex ?? '#f48c5d';
  const base: Look = { top: main, legs: legOverride ?? '#3b4a66', longSleeves: false, shoes: '#2a2220', sole: '#e9e3d8' };
  switch (a.outfitStyle) {
    case 'sportif': return { ...base, legs: legOverride ?? '#2c2f3a', shoes: '#f2f2f2', sole: '#c94a3a' };
    case 'artisan': return { ...base, legs: legOverride ?? '#5a4a3a', longSleeves: true, shoes: '#4a3424', sole: '#2a1e16' };
    case 'citoyen': return { ...base, longSleeves: true };
    case 'streetwear': return { ...base, legs: legOverride ?? '#2f3440', longSleeves: true, shoes: '#e9e3d8', sole: '#f6f2ea' };
    case 'entrepreneur': return { ...base, top: '#f3efe6', jacket: main, legs: legOverride ?? shade(main, 0.6), longSleeves: true, shoes: '#3a2a20', sole: '#2a1e16' };
    case 'dirigeant': return { ...base, top: '#f6f4ee', jacket: main, legs: legOverride ?? main, longSleeves: true, tie: '#7a2436', shoes: '#151515', sole: '#0f0f0f' };
    case 'magnat': return { ...base, top: '#f6f4ee', jacket: main, legs: legOverride ?? '#1d1d24', longSleeves: true, tie: '#d9a521', shoes: '#0f0f0f', sole: '#0f0f0f' };
    default: return base;
  }
}

// ---------- Visage peint (pixel art 32×32) ----------

function faceTexture(a: PlayerAppearance, skin: string, hair: string, child: number, closed: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, col: string): void => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const iris = EYE_COLOR_INFO[a.eyeColor ?? 'brun']?.hex ?? '#4a2e1c';
  const dark = shade(skin, 0.72);
  const eyeY = 13;
  const shape = a.eyes ?? 'ronds';
  for (const ex of [9, 19]) {
    if (closed) {
      px(ex, eyeY + 2, 4, 1, '#2a1a14');
    } else {
      const h = shape === 'amande' ? 2 : shape === 'tombants' ? 3 : 4;
      const top = eyeY + (4 - h);
      px(ex, top, 4, h, '#fbf7ef');
      px(ex + 1, top, 2, h, iris);
      px(ex + 1, top + Math.floor(h / 2), 2, 1, '#14100c');
      px(ex + 1, top, 1, 1, '#ffffff');
      px(ex, top - 1, 4, 1, shape === 'rieurs' ? dark : '#2a1a14');
      if (shape === 'tombants') px(ex + (ex < 16 ? 3 : 0), top + h, 1, 1, dark);
    }
    // Sourcils (couleur des cheveux), un peu plus épais chez l'adulte.
    px(ex - (ex < 16 ? 1 : 0), eyeY - 3, 5, child > 0.5 ? 1 : 2, shade(hair, 0.85));
  }
  // Nez : une ombre de deux pixels ; bouche : un trait, petit sourire.
  px(15, 18, 2, 2, dark);
  px(13, 22, 6, 1, shade(skin, 0.55));
  px(12, 21, 1, 1, shade(skin, 0.6));
  px(19, 21, 1, 1, shade(skin, 0.6));
  if (child > 0.3) {
    px(7, 18, 3, 2, 'rgba(232,120,110,0.35)');
    px(22, 18, 3, 2, 'rgba(232,120,110,0.35)');
  }
  if (a.freckles) for (const [x, y] of [[8, 17], [10, 18], [9, 19], [21, 17], [23, 18], [22, 19], [14, 17], [17, 17]] as const) px(x, y, 1, 1, shade(skin, 0.68));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Construction ----------

export function createRigCharacter(spec: CharacterSpec, lib: AnimLibrary): RigCharacter {
  const a: PlayerAppearance = { ...DEFAULT_PLAYER_APPEARANCE, ...spec.appearance };
  const H = spec.heightM ?? 1.55;
  // Enfance : 1 à 1,40 m, 0 à partir de ~1,65 m (proportions adultes).
  const child = Math.max(0, Math.min(1, (1.65 - H) / 0.25));
  const s = H / RIG_HEIGHT;
  const physique = spec.physique ?? a.physique;
  const ph = (k: BodyShapeKey): number => physique?.[k] ?? 0;
  const build = ({ fine: 0.88, moyenne: 1, sportive: 1.06, ronde: 1.2 } as const)[a.body ?? 'moyenne'] * (1 - 0.08 * child);
  const limb = ({ fine: 0.88, moyenne: 1, sportive: 1.1, ronde: 1.16 } as const)[a.body ?? 'moyenne'] * (1 + 0.18 * ph('muscles'));
  const shoulderW = (1 + 0.12 * ph('epaules')) * (1 - 0.1 * child);
  const hipW = 1 + 0.2 * ph('hanches');
  const thighW = 1 + 0.25 * ph('cuisses');
  const legF = 1 - 0.07 * child;
  const headScale = 1 + 0.2 * child;

  const skin = SKIN_TONE_INFO[a.skinTone]?.hex ?? '#e2ad7a';
  const hair = HAIR_COLOR_INFO[a.hairColor]?.hex ?? '#6b4a2f';
  const look = outfitLook(a, spec.bodyColor, spec.legColor);
  const skinM = mat(skin, 0.7);
  const hairM = mat(hair, 0.9);
  const topM = mat(look.top);
  const legM = mat(look.legs);
  const shoeM = mat(look.shoes, 0.6);
  const soleM = mat(look.sole, 0.7);
  const jacketM = look.jacket ? mat(look.jacket, 0.75) : undefined;
  const full = spec.detail !== 'low';

  const root = new THREE.Group();
  const turn = new THREE.Group();
  root.add(turn);
  const body = lib.template.clone(true);
  turn.add(body);
  const bones = new Map<string, THREE.Object3D>();
  body.traverse((o) => { if (o.name) bones.set(o.name, o); });
  const B = (n: string): THREE.Object3D => bones.get(n) ?? body;

  // Proportions : jambes plus courtes et épaules plus étroites chez l'enfant.
  for (const side of ['l', 'r']) {
    B(`calf_${side}`).position.multiplyScalar(legF);
    B(`foot_${side}`).position.multiplyScalar(legF);
    B(`upperarm_${side}`).position.multiplyScalar(shoulderW);
  }
  body.scale.setScalar(s);
  body.position.y = -(1 - legF) * LEG_LEN * s;
  root.updateMatrixWorld(true);

  // Outils : volumes posés en coordonnées « monde au repos », puis accrochés à leur os.
  const W = (n: string): THREE.Vector3 => B(n).getWorldPosition(new THREE.Vector3());
  const meshes: THREE.Mesh[] = [];
  const attach = (bone: string, m: THREE.Mesh, shadow = true): THREE.Mesh => {
    m.castShadow = shadow && full;
    // Un pivot sans échelle porte la position et l'orientation ; le volume garde son échelle
    // propre dedans (un os tourné ne doit pas cisailler un volume étiré).
    const pivot = new THREE.Group();
    pivot.position.copy(m.position);
    pivot.quaternion.copy(m.quaternion);
    m.position.set(0, 0, 0);
    m.quaternion.identity();
    pivot.add(m);
    root.add(pivot);
    pivot.updateMatrixWorld(true);
    B(bone).attach(pivot);
    meshes.push(m);
    return m;
  };
  const blob = (bone: string, c: THREE.Vector3, size: [number, number, number], m: THREE.Material, hi = false): THREE.Mesh => {
    const mesh = new THREE.Mesh(hi ? SPHERE_HI() : SPHERE(), m);
    mesh.position.copy(c);
    mesh.scale.set(size[0] * s, size[1] * s, size[2] * s);
    return attach(bone, mesh);
  };
  const UP = new THREE.Vector3(0, 1, 0);
  const seg = (bone: string, from: THREE.Vector3, to: THREE.Vector3, r: number, m: THREE.Material): THREE.Mesh => {
    const dir = to.clone().sub(from);
    const len = dir.length();
    const mesh = new THREE.Mesh(CYL(), m);
    mesh.position.copy(from).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    mesh.scale.set(r * s, len, r * s);
    return attach(bone, mesh);
  };
  const joint = (bone: string, r: number, m: THREE.Material): THREE.Mesh => blob(bone, W(bone), [r, r, r], m);
  const off = (v: THREE.Vector3, x: number, y: number, z: number): THREE.Vector3 => v.clone().add(new THREE.Vector3(x * s, y * s, z * s));

  // --- Jambes ---
  for (const side of ['l', 'r'] as const) {
    const sx = side === 'l' ? 1 : -1;
    const hip = off(W(`thigh_${side}`), sx * 0.012 * (hipW - 1), 0, 0);
    const knee = W(`calf_${side}`);
    const ankle = W(`foot_${side}`);
    const ball = W(`ball_${side}`);
    seg(`thigh_${side}`, hip, knee, 0.075 * limb * thighW * build, legM);
    joint(`calf_${side}`, 0.062 * limb * build, legM);
    seg(`calf_${side}`, knee, off(ankle, 0, 0.03, 0), 0.058 * limb * build, legM);
    // Chaussure : de la cheville à la pointe, semelle claire.
    const mid = ankle.clone().lerp(ball, 0.55);
    const shoe = new THREE.Mesh(BOX(), shoeM);
    shoe.position.set(mid.x, 0.045 * s, mid.z + 0.02 * s);
    shoe.scale.set(0.1 * s, 0.085 * s, ball.z - ankle.z + 0.15 * s);
    attach(`foot_${side}`, shoe);
    const sole = new THREE.Mesh(BOX(), soleM);
    sole.position.set(mid.x, 0.008 * s, mid.z + 0.02 * s);
    sole.scale.set(0.106 * s, 0.018 * s, ball.z - ankle.z + 0.16 * s);
    attach(`foot_${side}`, sole, false);
  }

  // --- Bassin et torse ---
  const pelvis = W('pelvis');
  blob('pelvis', off(pelvis, 0, -0.02, 0.0), [0.17 * hipW * build, 0.11, 0.115 * build], legM);
  const g = ph('fessier');
  if (physique && g > -0.7) {
    const r = 0.78 + 0.42 * g;
    for (const sx of [1, -1]) blob('pelvis', off(pelvis, sx * 0.06 * hipW * build, -0.04, -(0.07 + 0.025 * g) * build), [0.075 * r * build, 0.075 * r, 0.07 * r * build], legM);
  }
  const sp1 = W('spine_01'), sp2 = W('spine_02'), sp3 = W('spine_03'), neck = W('neck_01'), headB = W('Head');
  const waist = 1 + 0.08 * ph('taille');
  const torsoM = jacketM ?? topM;
  blob('spine_01', sp1.clone().lerp(sp2, 0.45), [0.152 * build * waist, 0.15, 0.105 * build * waist], torsoM, true);
  blob('spine_02', sp2.clone().lerp(sp3, 0.55), [0.165 * build * shoulderW, 0.16, 0.112 * build], torsoM, true);
  blob('spine_03', sp3.clone().lerp(neck, 0.4), [0.18 * build * shoulderW, 0.12, 0.105 * build], torsoM, true);
  if (jacketM) {
    // Veste ouverte : le haut clair et la cravate se voient devant.
    blob('spine_02', off(sp2.clone().lerp(sp3, 0.6), 0, 0, 0.085 * build), [0.05, 0.12, 0.03], topM);
    if (look.tie) blob('spine_02', off(sp2.clone().lerp(sp3, 0.5), 0, 0, 0.11 * build), [0.018, 0.1, 0.012], mat(look.tie, 0.5));
  }
  if (physique) {
    const b = ph('poitrine');
    if (b > -0.6) {
      const r = 0.55 + 0.55 * (b + 0.6) / 1.6;
      for (const sx of [1, -1]) blob('spine_03', off(sp3, sx * 0.06 * build * shoulderW, -0.04, (0.085 + 0.02 * r) * build), [0.06 * r * build, 0.055 * r, 0.05 * r * (0.6 + 0.4 * Math.max(0, b)) * build], torsoM);
    }
    const v = ph('ventre');
    if (v > 0) blob('spine_01', off(sp1.clone().lerp(sp2, 0.4), 0, 0, (0.06 + 0.035 * v) * build), [0.12 * (0.85 + 0.3 * v) * build, 0.09 * (0.85 + 0.2 * v), 0.07 * (0.6 + 0.6 * v) * build], torsoM);
  }
  if (a.outfitStyle === 'ecolier' || a.accessory === 'sac_dos') {
    blob('spine_03', off(sp2.clone().lerp(sp3, 0.5), 0, -0.02, -0.14 * build), [0.12, 0.15, 0.06], mat('#4f6a8a', 0.75));
  }

  // --- Bras ---
  for (const side of ['l', 'r'] as const) {
    const sh = W(`upperarm_${side}`), el = W(`lowerarm_${side}`), wr = W(`hand_${side}`);
    const sleeve = jacketM ?? topM;
    blob(`clavicle_${side}`, sh.clone().lerp(W(`clavicle_${side}`), 0.15), [0.07 * limb * build, 0.065, 0.07 * limb], sleeve);
    seg(`upperarm_${side}`, sh, el, 0.05 * limb, sleeve);
    joint(`lowerarm_${side}`, 0.045 * limb, look.longSleeves ? sleeve : skinM);
    seg(`lowerarm_${side}`, el, wr, 0.043 * limb, look.longSleeves ? sleeve : skinM);
    const dir = wr.clone().sub(el).normalize();
    blob(`hand_${side}`, wr.clone().addScaledVector(dir, 0.055 * s), [0.06, 0.03, 0.045], skinM);
  }

  // --- Cou et tête ---
  seg('neck_01', neck, off(headB, 0, 0.02, 0), 0.048, skinM);
  const R = 0.118; // rayon de la tête (adulte, avant mise à l'échelle de l'enfant)
  const hc = off(headB, 0, 0.1, 0.012); // centre de la tête
  blob('Head', hc, [R * 0.93, R * 1.04, R], skinM, true);
  for (const sx of [1, -1]) blob('Head', off(hc, sx * R * 0.93, -0.005, -0.005), [0.022, 0.035, 0.018], skinM);
  // Visage peint : une plaque légèrement en avant du crâne.
  const faceOpen = faceTexture(a, skin, hair, child, false);
  const faceClosed = faceTexture(a, skin, hair, child, true);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceOpen, transparent: true, depthWrite: false });
  const face = new THREE.Mesh(geo('facePlane', () => new THREE.PlaneGeometry(1, 1)), faceMat);
  face.position.copy(off(hc, 0, -0.005, R * 0.985));
  face.scale.set(0.235 * s, 0.235 * s, 1);
  attach('Head', face, false);
  face.renderOrder = 3;

  // Coiffure, barbe, lunettes, couvre-chef.
  buildHair(a.hairStyle, hc, R, s, hairM, (m, bone = 'Head') => attach(bone, m), hashStr(JSON.stringify(a)));
  if (a.beard && a.beard !== 'aucune' && child < 0.5) {
    const bm = mat(shade(hair, 0.95), 0.95);
    if (a.beard === 'moustache' || a.beard === 'pleine' || a.beard === 'courte') blob('Head', off(hc, 0, -0.045, R * 0.96), [0.035, 0.009, 0.012], bm);
    if (a.beard === 'courte' || a.beard === 'pleine' || a.beard === 'duvet') {
      const k = a.beard === 'pleine' ? 1.1 : a.beard === 'duvet' ? 0.95 : 1;
      blob('Head', off(hc, 0, -0.065, R * 0.55), [R * 0.82 * k, R * 0.42 * k, R * 0.55 * k], a.beard === 'duvet' ? mat(shade(hair, 1.2), 0.95) : bm);
    }
  }
  if (a.glasses && a.glasses !== 'aucune') {
    const gm = mat(a.glasses === 'ecaille' ? '#6b3a1e' : a.glasses === 'soleil' ? '#141414' : '#2a2a2a', 0.4);
    for (const sx of [1, -1]) {
      const rim = new THREE.Mesh(geo(a.glasses === 'carrees' ? 'rimSq' : 'rimRound', () => (a.glasses === 'carrees' ? new THREE.TorusGeometry(1, 0.16, 4, 4).rotateZ(Math.PI / 4) : new THREE.TorusGeometry(1, 0.14, 4, 10))), gm);
      rim.position.copy(off(hc, sx * 0.04, 0.012, R * 1.0));
      rim.scale.setScalar(0.024 * s);
      attach('Head', rim, false);
      if (a.glasses === 'soleil') blob('Head', off(hc, sx * 0.04, 0.012, R * 0.99), [0.024, 0.022, 0.004], gm);
    }
  }
  if (a.accessory === 'casquette') {
    const cm = mat(shade(look.top, 0.8), 0.7);
    const cap = new THREE.Mesh(HALF(), cm);
    cap.position.copy(off(hc, 0, 0.02, 0));
    cap.scale.set(R * 1.04 * s, R * 0.82 * s, R * 1.06 * s);
    attach('Head', cap);
    blob('Head', off(hc, 0, 0.03, R * 1.05), [R * 0.75, 0.008, R * 0.5], cm);
  } else if (a.accessory === 'bonnet') {
    const bm = mat('#3d5a73', 0.95);
    const cap = new THREE.Mesh(HALF(), bm);
    cap.position.copy(off(hc, 0, 0.01, 0));
    cap.scale.set(R * 1.06 * s, R * 1.08 * s, R * 1.06 * s);
    attach('Head', cap);
  } else if (a.accessory === 'ecouteurs') {
    for (const sx of [1, -1]) blob('Head', off(hc, sx * R * 0.98, 0, 0), [0.03, 0.04, 0.035], mat('#202020', 0.4));
  }

  // Enfant : la tête grossit autour de la base du crâne (les volumes accrochés suivent).
  B('Head').scale.setScalar(headScale);
  // Construit face à +Z (sens du squelette) ; le jeu attend un personnage tourné vers −Z.
  turn.rotation.y = Math.PI;

  // ---------- Animations ----------
  const mixer = new THREE.AnimationMixer(body);
  const act = (name: string): THREE.AnimationAction | null => {
    const clip = lib.clips.get(name);
    return clip ? mixer.clipAction(clip) : null;
  };
  const loco = { idle: act('idle'), walk: act('walk'), jog: act('jog'), run: act('run') };
  for (const x of Object.values(loco)) if (x) { x.play(); x.setEffectiveWeight(0); }
  if (loco.idle) loco.idle.setEffectiveWeight(1);
  const variation = hashStr(JSON.stringify(a) + (spec.bodyColor ?? ''));
  if (loco.idle) loco.idle.time = variation * (loco.idle.getClip().duration || 1);

  let gesture: THREE.AnimationAction | null = null;
  let gestureName: string | null = null;
  let gestureW = 0;
  let gestureTarget = 0;
  let gestureFade = 0.25;
  mixer.addEventListener('finished', (e) => {
    if ((e as unknown as { action: THREE.AnimationAction }).action === gesture) gestureTarget = 0;
  });

  let speedS = 0;
  let heading = 0;
  let shownHeading = 0;
  let blinkIn = 1.5 + variation * 3;
  let blinkT = 0;

  const tri = (x: number, a0: number, peak: number, a1: number): number => (x <= a0 || x >= a1 ? 0 : x < peak ? (x - a0) / (peak - a0) : (a1 - x) / (a1 - peak));

  return {
    root,
    get gesture(): string | null { return gestureName; },
    setHeading(r: number): void { heading = r; },
    play(name: string, opts: { loop?: boolean; fade?: number } = {}): boolean {
      const next = act(name);
      if (!next) return false;
      if (gesture && gesture !== next) gesture.fadeOut(opts.fade ?? 0.2);
      next.reset();
      next.setLoop(opts.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      next.clampWhenFinished = true;
      next.setEffectiveWeight(1);
      next.play();
      gesture = next;
      gestureName = name;
      gestureTarget = 1;
      gestureFade = opts.fade ?? 0.25;
      return true;
    },
    stopGesture(fade = 0.25): void {
      gestureTarget = 0;
      gestureFade = fade;
    },
    update(dt: number, speed: number): void {
      dt = Math.min(dt, 0.1);
      speedS += (speed - speedS) * (1 - Math.exp(-9 * dt));
      // Vitesse ramenée à l'échelle du squelette source (un enfant fait des pas plus courts).
      const v = speedS / Math.max(0.5, s);
      const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
      const wIdle = clamp01(1 - v / 0.6);
      const wWalk = v <= 1.3 ? clamp01(v / 0.6) : clamp01((3.0 - v) / 1.7);
      const wJog = tri(v, 1.3, 3.0, 4.8);
      const wRun = clamp01((v - 3.6) / 1.4);
      const sum = wIdle + wWalk + wJog + wRun || 1;
      // Geste en cours : il prend le dessus sur la marche.
      const rate = gestureFade > 0 ? dt / gestureFade : 1;
      gestureW += Math.max(-rate, Math.min(rate, gestureTarget - gestureW));
      if (gesture) {
        gesture.setEffectiveWeight(gestureW);
        if (gestureW <= 0.001 && gestureTarget === 0) { gesture.stop(); gesture = null; gestureName = null; }
      }
      const lw = 1 - gestureW;
      loco.idle?.setEffectiveWeight((wIdle / sum) * lw);
      loco.walk?.setEffectiveWeight((wWalk / sum) * lw);
      loco.jog?.setEffectiveWeight((wJog / sum) * lw);
      loco.run?.setEffectiveWeight((wRun / sum) * lw);
      if (loco.walk) loco.walk.timeScale = Math.max(0.6, Math.min(1.6, v / 1.25));
      if (loco.jog) loco.jog.timeScale = Math.max(0.7, Math.min(1.4, v / 3.0));
      if (loco.run) loco.run.timeScale = Math.max(0.8, Math.min(1.3, v / 5.2));
      mixer.update(dt);
      // Cap : virage progressif.
      let dh = heading - shownHeading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      shownHeading += dh * (1 - Math.exp(-10 * dt));
      root.rotation.y = shownHeading;
      // Clignement des yeux.
      blinkIn -= dt;
      if (blinkIn <= 0) { blinkT = 0.12; blinkIn = 2.4 + hashStr(`${shownHeading.toFixed(2)}${variation}`) * 3.6; }
      if (blinkT > 0) blinkT -= dt;
      const want = blinkT > 0 ? faceClosed : faceOpen;
      if (faceMat.map !== want) { faceMat.map = want; faceMat.needsUpdate = true; }
    },
    dispose(): void {
      mixer.stopAllAction();
      mixer.uncacheRoot(body);
      faceOpen.dispose();
      faceClosed.dispose();
      faceMat.dispose();
      root.removeFromParent();
    },
  };
}

// ---------- Coiffures (low-poly, accrochées à la tête) ----------

function buildHair(style: PlayerHairStyle, hc: THREE.Vector3, R: number, s: number, m: THREE.Material, add: (m: THREE.Mesh, bone?: string) => void, seed: number): void {
  const at = (x: number, y: number, z: number): THREE.Vector3 => hc.clone().add(new THREE.Vector3(x * s, y * s, z * s));
  const ball = (p: THREE.Vector3, sx: number, sy: number, sz: number, geoKind: 'sphere' | 'half' = 'sphere', rotX = 0): void => {
    const mesh = new THREE.Mesh(geoKind === 'half' ? HALF() : SPHERE(), m);
    mesh.position.copy(p);
    mesh.scale.set(sx * s, sy * s, sz * s);
    mesh.rotation.x = rotX;
    add(mesh);
  };
  const box = (p: THREE.Vector3, sx: number, sy: number, sz: number, rx = 0, rz = 0): void => {
    const mesh = new THREE.Mesh(BOX(), m);
    mesh.position.copy(p);
    mesh.scale.set(sx * s, sy * s, sz * s);
    mesh.rotation.set(rx, 0, rz);
    add(mesh);
  };
  const cap = (k = 1.06, lift = 0.005, back = 1.0): void => {
    ball(at(0, lift, -0.006), R * k, R * k * 0.98, R * k * back, 'half');
    // Nuque et tempes : la calotte descend un peu derrière et sur les côtés.
    ball(at(0, -0.02, -R * 0.35), R * 0.98 * k, R * 0.62, R * 0.72 * k);
  };
  switch (style) {
    case 'rase':
      ball(at(0, 0.004, -0.004), R * 1.005, R * 0.96, R * 1.005, 'half');
      break;
    case 'degrade':
      ball(at(0, 0.03, 0), R * 0.98, R * 0.9, R * 1.0, 'half');
      ball(at(0, -0.01, -R * 0.3), R * 0.99, R * 0.55, R * 0.75);
      break;
    case 'crete':
      ball(at(0, 0.004, -0.004), R * 1.0, R * 0.95, R * 1.0, 'half');
      for (let i = 0; i < 5; i++) box(at(0, R * 0.95 + 0.012, R * 0.6 - i * R * 0.38), 0.025, 0.06 - i * 0.004, 0.05, -0.25 + i * 0.12);
      break;
    case 'court':
      cap(1.07);
      break;
    case 'frange':
      cap(1.07);
      box(at(0, R * 0.55, R * 0.86), R * 1.5, R * 0.32, R * 0.25, 0.25);
      break;
    case 'mi-long':
      cap(1.08);
      ball(at(0, -R * 0.55, -R * 0.35), R * 1.08, R * 0.7, R * 0.75);
      for (const sx of [1, -1]) box(at(sx * R * 0.95, -R * 0.45, 0), R * 0.2, R * 1.0, R * 0.9);
      break;
    case 'long':
      cap(1.08);
      box(at(0, -R * 1.5, -R * 0.62), R * 1.75, R * 2.4, R * 0.32, 0.08);
      for (const sx of [1, -1]) box(at(sx * R * 0.96, -R * 0.75, -R * 0.05), R * 0.2, R * 1.5, R * 0.85);
      break;
    case 'queue':
      cap(1.06);
      ball(at(0, R * 0.2, -R * 1.05), R * 0.28, R * 0.28, R * 0.28);
      box(at(0, -R * 0.55, -R * 1.25), R * 0.36, R * 1.4, R * 0.32, 0.25);
      break;
    case 'chignon':
      cap(1.05);
      ball(at(0, R * 0.75, -R * 0.75), R * 0.48, R * 0.44, R * 0.48);
      break;
    case 'couettes':
      cap(1.06);
      for (const sx of [1, -1]) {
        ball(at(sx * R * 1.08, R * 0.05, -R * 0.25), R * 0.22, R * 0.22, R * 0.22);
        box(at(sx * R * 1.2, -R * 0.7, -R * 0.3), R * 0.3, R * 1.3, R * 0.3, 0, sx * 0.15);
      }
      break;
    case 'boucle': {
      cap(1.1);
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * Math.PI * 2 + seed;
        ball(at(Math.cos(t) * R * 0.98, R * (0.25 + 0.35 * ((i * 7) % 3) / 2), Math.sin(t) * R * 0.98 - R * 0.05), R * 0.3, R * 0.3, R * 0.3);
      }
      break;
    }
    case 'afro':
      ball(at(0, R * 0.32, -R * 0.12), R * 1.55, R * 1.4, R * 1.5);
      break;
    case 'locks': {
      cap(1.08);
      // Mèches de locks qui tombent tout autour, sauf devant le visage.
      const n = 14;
      for (let i = 0; i < n; i++) {
        const t = Math.PI * 0.35 + (i / (n - 1)) * Math.PI * 1.3;
        const len = R * (1.5 + 0.5 * (((i * 5 + Math.floor(seed * 10)) % 4) / 3));
        const x = Math.sin(t) * R * 1.0;
        const z = -Math.cos(t) * R * 1.0;
        const mesh = new THREE.Mesh(CYL(), m);
        mesh.position.copy(at(x, -len / 2 + R * 0.3, z));
        mesh.scale.set(R * 0.11 * s, len * s, R * 0.11 * s);
        mesh.rotation.set(-z * 0.6, 0, x * 0.6);
        add(mesh);
      }
      break;
    }
    case 'tresse': {
      // Tresses plaquées sur le crâne, puis une natte dans le dos.
      ball(at(0, 0.004, -0.004), R * 1.02, R * 0.97, R * 1.02, 'half');
      for (let i = -2; i <= 2; i++) box(at(i * R * 0.32, R * 0.8, -R * 0.05), R * 0.1, R * 0.08, R * 1.9, 0.2);
      for (let i = 0; i < 6; i++) ball(at(0, -R * (0.15 + i * 0.32), -R * (1.0 + i * 0.05)), R * 0.2, R * 0.2, R * 0.2);
      break;
    }
    default:
      cap(1.07);
  }
}
