/**
 * Personnage articulé (V2 « arrondie », rétrospective du 2026-10-07) : formes douces et
 * proportionnées, visage expressif (yeux, paupières, sourcils, nez, bouche, oreilles), mains,
 * et toute la personnalisation v23 (peau, 14 coupes, morphologies, taille, yeux, lunettes,
 * taches de rousseur, barbe, 8 tenues, accessoires).
 *
 * Animation procédurale fluide : vitesse lissée, foulée à déroulé du pied, balancier du bassin
 * et contre-rotation des épaules, bras en opposition, transition marche → course, inclinaison
 * dans les virages, respiration et clignement au repos, tête stabilisée.
 * Même API que le module promis à Jules (`characters.ts`). Pieds à y = 0, regard vers −Z.
 */
import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../../core/types';
import { DEFAULT_PLAYER_APPEARANCE } from '../../core/types';
import { EYE_COLOR_INFO, HAIR_COLOR_INFO, OUTFIT_COLOR_INFO, SKIN_TONE_INFO } from '../../core/player_customization';

export interface CharacterSpec {
  appearance: PlayerAppearance;
  gender?: PlayerGender;
  heightM?: number;
  /** Couleur de haut pour les PNJ (remplace la couleur de tenue). */
  bodyColor?: string;
  /** Couleur du bas (pantalon/jupe). */
  legColor?: string;
  /** « low » pour la foule d'ambiance : silhouette complète, petits détails du visage omis, une seule ombre. */
  detail?: 'full' | 'low';
}

export interface Character3D {
  root: THREE.Group;
  update(dtSeconds: number, speedMps: number): void;
  setHeading(radians: number): void;
  dispose(): void;
}

// ---------- Caches partagés (géométries et matériaux) ----------

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.8, metal = 0): THREE.MeshStandardMaterial {
  const k = `${color}_${rough}_${metal}`;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }); matCache.set(k, m); }
  return m;
}

const matDoubleCache = new Map<string, THREE.MeshStandardMaterial>();
/** Matériau double face partagé (vestes ouvertes) : jamais un clone par personnage. */
function matDouble(color: string, rough: number): THREE.MeshStandardMaterial {
  const k = `${color}_${rough}`;
  let m = matDoubleCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, side: THREE.DoubleSide }); matDoubleCache.set(k, m); }
  return m;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function shade(hex: string, f: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}

const smooth = (cur: number, target: number, rate: number, dt: number): number => cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** Ouverture des paupières selon la forme des yeux (radians autour de X : 0 = dôme vers le haut). */
const LID_OPEN: Record<NonNullable<PlayerAppearance['eyes']>, number> = { ronds: 0.45, amande: 0.2, tombants: -0.15, rieurs: 0.05 };

// ---------- Tenues : couleurs du haut, du bas, manches longues ----------

interface OutfitLook { top: string; legs: string; longSleeves: boolean; jacket?: string; tie?: string; shoes: string }

function outfitLook(a: PlayerAppearance, override?: string, legOverride?: string): OutfitLook {
  const main = override ?? OUTFIT_COLOR_INFO[a.outfitColor]?.hex ?? '#f48c5d';
  const base = { top: main, legs: legOverride ?? '#3b4a66', longSleeves: false, shoes: '#2a2220' };
  switch (a.outfitStyle) {
    case 'sportif': return { ...base, legs: legOverride ?? '#2c2f3a', shoes: '#f2f2f2' };
    case 'artisan': return { ...base, legs: legOverride ?? '#5a4a3a', longSleeves: true, shoes: '#4a3424' };
    case 'citoyen': return { ...base, longSleeves: true };
    case 'streetwear': return { ...base, legs: legOverride ?? '#2f3440', longSleeves: true, shoes: '#e9e3d8' };
    case 'entrepreneur': return { ...base, top: '#f3efe6', jacket: main, legs: legOverride ?? shade(main, 0.6), longSleeves: true, shoes: '#3a2a20' };
    case 'dirigeant': return { ...base, top: '#f6f4ee', jacket: main, legs: legOverride ?? main, longSleeves: true, tie: '#7a2436', shoes: '#151515' };
    case 'magnat': return { ...base, top: '#f6f4ee', jacket: main, legs: legOverride ?? '#1d1d24', longSleeves: true, tie: '#d9a521', shoes: '#0f0f0f' };
    default: return base;
  }
}

// ---------- Construction ----------

export function createCharacter(spec: CharacterSpec): Character3D {
  const a: PlayerAppearance = { ...DEFAULT_PLAYER_APPEARANCE, ...spec.appearance };
  const baseH = spec.heightM ?? 1.55;
  const H = baseH * (1 + (a.heightAdj ?? 0) * 0.035);
  const k = H / 1.7; // échelle relative à un adulte de 1,70 m
  const build = { fine: 0.86, moyenne: 1, sportive: 1.08, ronde: 1.22 }[a.body ?? 'moyenne'];
  const limb = { fine: 0.88, moyenne: 1, sportive: 1.1, ronde: 1.14 }[a.body ?? 'moyenne'];
  const skin = SKIN_TONE_INFO[a.skinTone]?.hex ?? '#e2ad7a';
  const hair = HAIR_COLOR_INFO[a.hairColor]?.hex ?? '#6b4a2f';
  const look = outfitLook(a, spec.bodyColor, spec.legColor);
  const variation = hashStr(JSON.stringify(a) + (spec.bodyColor ?? ''));
  const full = spec.detail !== 'low';

  const root = new THREE.Group();
  const hips = new THREE.Group(); // bassin : rebond, balancier
  root.add(hips);
  const chest = new THREE.Group(); // buste : contre-rotation, inclinaison
  hips.add(chest);

  // Foule : géométries à facettes réduites (clé distincte dans le cache).
  const gq = (key: string, make: () => THREE.BufferGeometry, makeLow: () => THREE.BufferGeometry): THREE.BufferGeometry =>
    full ? geo(key, make) : geo(`${key}Low`, makeLow);
  const mk = (g: THREE.BufferGeometry, m: THREE.Material, shadow = true): THREE.Mesh => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = shadow && full;
    return mesh;
  };
  const skinM = mat(skin, 0.62);
  const hairM = mat(hair, 0.85);
  const topM = mat(look.top, 0.85);
  const legM = mat(look.legs, 0.8);
  const jacketM = look.jacket ? mat(look.jacket, 0.75) : undefined;

  // --- Jambes : hanche → genou → cheville (pied qui déroule) ---
  const thighG = gq('v2thigh', () => new THREE.CapsuleGeometry(0.072, 0.3, 4, 10).translate(0, -0.2, 0), () => new THREE.CapsuleGeometry(0.072, 0.3, 2, 6).translate(0, -0.2, 0));
  const shinG = gq('v2shin', () => new THREE.CapsuleGeometry(0.06, 0.3, 4, 10).translate(0, -0.2, 0), () => new THREE.CapsuleGeometry(0.06, 0.3, 2, 6).translate(0, -0.2, 0));
  const shoeG = geo('v2shoe', () => new THREE.CapsuleGeometry(0.055, 0.13, 4, 8).rotateX(Math.PI / 2).scale(1.05, 0.75, 1).translate(0, -0.02, -0.05));
  const makeLeg = (side: number): { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group } => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.095 * k * build, 0.86 * k, 0);
    const thigh = mk(thighG, legM);
    thigh.scale.set(k * limb * build, k, k * limb * build);
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.41 * k;
    const shin = mk(shinG, legM);
    shin.scale.set(k * limb, k, k * limb);
    knee.add(shin);
    const ankle = new THREE.Group();
    ankle.position.y = -0.41 * k;
    const shoe = mk(shoeG, mat(look.shoes, 0.55));
    shoe.scale.setScalar(k);
    ankle.add(shoe);
    knee.add(ankle);
    hip.add(knee);
    hips.add(hip);
    return { hip, knee, ankle };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // --- Bassin et torse arrondis ---
  const pelvis = mk(geo('v2pelvis', () => new THREE.SphereGeometry(0.135, 14, 10).scale(1.05, 0.5, 0.72)), legM);
  pelvis.position.y = 0.9 * k;
  pelvis.scale.set(k * build, k, k * build);
  hips.add(pelvis);
  chest.position.y = 0.92 * k;
  // Torse sculpté : taille fine, poitrine pleine, épaules arrondies (profil tourné).
  const torso = mk(geo('v2torsoLathe', () => new THREE.LatheGeometry([
    new THREE.Vector2(0.001, -0.02), new THREE.Vector2(0.118, -0.01), new THREE.Vector2(0.125, 0.08), new THREE.Vector2(0.135, 0.2),
    new THREE.Vector2(0.15, 0.32), new THREE.Vector2(0.152, 0.42), new THREE.Vector2(0.13, 0.5), new THREE.Vector2(0.08, 0.56),
    new THREE.Vector2(0.045, 0.58), new THREE.Vector2(0.001, 0.585),
  ], 18).scale(1.18, 1, 0.72)), topM);
  torso.position.y = 0.02 * k;
  torso.scale.set(k * build, k, k * build);
  chest.add(torso);
  torso.castShadow = true;
  if (jacketM) {
    // Veste : coque qui épouse le torse, ouverte devant (la chemise et la cravate restent visibles).
    // Lathe : phi = 0 vers +Z (dos) ; le devant (−Z) est à phi = π.
    const gap = 0.55;
    const coatLong = a.outfitStyle === 'magnat';
    const profile = [
      ...(coatLong ? [new THREE.Vector2(0.17, -0.42), new THREE.Vector2(0.15, -0.2)] : [new THREE.Vector2(0.13, -0.04)]),
      new THREE.Vector2(0.135, 0.06), new THREE.Vector2(0.145, 0.2), new THREE.Vector2(0.16, 0.32),
      new THREE.Vector2(0.162, 0.42), new THREE.Vector2(0.14, 0.5), new THREE.Vector2(0.09, 0.56), new THREE.Vector2(0.06, 0.585),
    ];
    const jm = matDouble(look.jacket ?? '#333333', 0.75);
    const shell = mk(geo(coatLong ? 'v2coatShell' : 'v2jacketShell', () => new THREE.LatheGeometry(profile, 20, Math.PI + gap / 2, Math.PI * 2 - gap).scale(1.18, 1, 0.74)), jm);
    shell.position.y = 0.02 * k;
    shell.scale.set(k * build, k, k * build);
    chest.add(shell);
    // Revers du col.
    for (const side of [-1, 1]) {
      const lapel = mk(geo('v2lapel', () => new THREE.BoxGeometry(0.04, 0.16, 0.012)), jacketM, false);
      lapel.position.set(side * 0.045 * k * build, 0.44 * k, -0.112 * k * build);
      lapel.rotation.z = side * 0.35;
      lapel.scale.setScalar(k);
      chest.add(lapel);
    }
  }
  if (look.tie) {
    const tie = mk(geo('v2tie', () => new THREE.BoxGeometry(0.035, 0.24, 0.012)), mat(look.tie, 0.5), false);
    tie.position.set(0, 0.36 * k, -0.118 * k * build);
    tie.scale.setScalar(k);
    chest.add(tie);
  }
  if (a.outfitStyle === 'artisan') {
    const apron = mk(geo('v2apron', () => new THREE.CapsuleGeometry(0.12, 0.34, 3, 8).scale(1.1, 1, 0.12)), mat('#8a5a3a', 0.9));
    apron.position.set(0, 0.16 * k, -0.115 * k * build);
    apron.scale.setScalar(k);
    chest.add(apron);
  }
  if (a.outfitStyle === 'sportif') {
    const stripeM = mat('#f2f2f2', 0.7);
    for (const side of [-1, 1]) {
      const s = mk(geo('v2stripe', () => new THREE.BoxGeometry(0.018, 0.34, 0.012)), stripeM, false);
      s.position.set(side * 0.07 * k * build, 0.3 * k, -0.118 * k * build);
      s.scale.setScalar(k);
      chest.add(s);
    }
  }
  if (a.outfitStyle === 'streetwear') {
    // Capuche rabattue dans le dos.
    const hood = mk(geo('v2hoodBack', () => new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6).scale(1.1, 0.7, 0.75).rotateX(-0.6)), topM);
    hood.position.set(0, 0.52 * k, 0.085 * k);
    hood.scale.setScalar(k * build);
    chest.add(hood);
    const pocket = mk(geo('v2pocket', () => new THREE.BoxGeometry(0.16, 0.07, 0.01)), mat(shade(look.top, 0.85), 0.85), false);
    pocket.position.set(0, 0.16 * k, -0.105 * k * build);
    pocket.scale.setScalar(k);
    chest.add(pocket);
  }
  if (a.outfitStyle === 'citoyen' || a.accessory === 'echarpe') {
    const scarf = mk(geo('v2scarf', () => new THREE.TorusGeometry(0.1, 0.038, 8, 16).rotateX(Math.PI / 2)), mat(a.accessory === 'echarpe' ? '#c25a40' : shade(look.top, 0.7), 0.95));
    scarf.position.y = 0.55 * k;
    scarf.scale.set(k * build, k, k * build);
    chest.add(scarf);
  }
  if (a.outfitStyle === 'ecolier' || a.accessory === 'sac_dos') {
    const bag = mk(geo('v2bag', () => new THREE.CapsuleGeometry(0.1, 0.16, 4, 10).scale(1.15, 1, 0.55)), mat('#4f6a8a', 0.75));
    bag.position.set(0, 0.3 * k, 0.15 * k * build);
    bag.scale.setScalar(k);
    chest.add(bag);
    const strapG = geo('v2strap', () => new THREE.TorusGeometry(0.1, 0.012, 4, 12, Math.PI).rotateY(Math.PI / 2));
    for (const side of [-1, 1]) {
      const strap = mk(strapG, mat('#2f3d52', 0.8), false);
      strap.position.set(side * 0.09 * k * build, 0.42 * k, 0.02 * k);
      strap.scale.set(k, k * 1.3, k * build);
      chest.add(strap);
    }
  }
  if (a.accessory === 'sacoche') {
    const bag = mk(geo('v2satchel', () => new THREE.BoxGeometry(0.2, 0.15, 0.06)), mat('#6b4a2f', 0.7));
    bag.position.set(0.17 * k * build, 0.02 * k, -0.02 * k);
    bag.scale.setScalar(k);
    chest.add(bag);
    const strap = mk(geo('v2satStrap', () => new THREE.TorusGeometry(0.22, 0.01, 4, 20).scale(1, 1.2, 0.6).rotateZ(0.5)), mat('#4a3220', 0.8), false);
    strap.position.set(0.02 * k, 0.28 * k, 0);
    strap.scale.set(k * build, k, k * build);
    chest.add(strap);
  }

  // --- Bras attachés aux épaules : épaule → coude → poignet (main) ---
  const shoulderG = geo('v2shoulder', () => new THREE.SphereGeometry(0.058, 12, 10));
  const upperG = gq('v2upper', () => new THREE.CapsuleGeometry(0.052, 0.22, 4, 10).translate(0, -0.14, 0), () => new THREE.CapsuleGeometry(0.052, 0.22, 2, 6).translate(0, -0.14, 0));
  const lowerG = gq('v2lower', () => new THREE.CapsuleGeometry(0.045, 0.2, 4, 10).translate(0, -0.13, 0), () => new THREE.CapsuleGeometry(0.045, 0.2, 2, 6).translate(0, -0.13, 0));
  const handG = geo('v2hand', () => new THREE.SphereGeometry(0.048, 10, 8).scale(0.85, 1.15, 0.6));
  const sleeveM = jacketM ?? topM;
  const makeArm = (side: number): { shoulder: THREE.Group; elbow: THREE.Group } => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.158 * k * build, 0.49 * k, 0.005 * k);
    if (full) {
      const cap = mk(shoulderG, sleeveM);
      cap.scale.setScalar(k * limb);
      shoulder.add(cap);
    }
    const up = mk(upperG, sleeveM);
    up.scale.set(k * limb, k, k * limb);
    shoulder.add(up);
    const elbow = new THREE.Group();
    elbow.position.y = -0.28 * k;
    const low = mk(lowerG, look.longSleeves ? sleeveM : skinM);
    low.scale.set(k * limb, k, k * limb);
    elbow.add(low);
    const hand = mk(handG, skinM);
    hand.position.y = -0.27 * k;
    hand.scale.setScalar(k * limb);
    elbow.add(hand);
    if (a.accessory === 'montre' && side < 0) {
      const watch = mk(geo('v2watch', () => new THREE.TorusGeometry(0.045, 0.012, 6, 14).rotateX(Math.PI / 2)), mat('#c9c9cf', 0.3, 0.8), false);
      watch.position.y = -0.22 * k;
      watch.scale.setScalar(k * limb);
      elbow.add(watch);
    }
    shoulder.add(elbow);
    shoulder.rotation.z = side * 0.035;
    chest.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // --- Cou et tête ---
  const neck = mk(geo('v2neck', () => new THREE.CylinderGeometry(0.048, 0.055, 0.09, 10)), skinM);
  neck.position.y = 0.6 * k;
  neck.scale.setScalar(k);
  chest.add(neck);
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.72 * k;
  chest.add(headPivot);
  // Proportions d'enfant : la tête pèse plus dans la silhouette (≈ 1/6,5 de la taille à 12 ans
  // contre 1/7,5 adulte). +14 % à 1,52 m, puis s'efface jusqu'à 1,72 m.
  const hk = k * (1 + Math.max(0, 1.72 - H) * 0.7);
  const head = mk(gq('v2head', () => new THREE.SphereGeometry(0.112, 20, 16).scale(0.94, 1.06, 0.98), () => new THREE.SphereGeometry(0.112, 10, 8).scale(0.94, 1.06, 0.98)), skinM);
  head.scale.setScalar(hk);
  headPivot.add(head);
  const lids: THREE.Mesh[] = [];
  const shape = a.eyes ?? 'ronds';
  if (full) {
    const earG = geo('v2ear', () => new THREE.SphereGeometry(0.026, 8, 6).scale(0.5, 1, 0.8));
    for (const side of [-1, 1]) {
      const ear = mk(earG, skinM, false);
      ear.position.set(side * 0.104 * hk, 0.0, 0.0);
      headPivot.add(ear);
    }
    const nose = mk(geo('v2nose', () => new THREE.SphereGeometry(0.02, 8, 6).scale(0.8, 1, 1.1)), mat(shade(skin, 0.94), 0.6), false);
    nose.position.set(0, -0.012 * hk, -0.108 * hk);
    headPivot.add(nose);

    // Yeux : blanc, iris coloré, pupille, paupière (pour cligner), forme selon le choix.
    const eyeWhiteG = geo('v2eyeW', () => new THREE.SphereGeometry(0.019, 10, 8));
    const irisG = geo('v2iris', () => new THREE.CircleGeometry(0.012, 14));
    const pupilG = geo('v2pupil', () => new THREE.CircleGeometry(0.0055, 10));
    const lidG = geo('v2lid', () => new THREE.SphereGeometry(0.0205, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2));
    const iris = mat(EYE_COLOR_INFO[a.eyeColor ?? 'brun']?.hex ?? '#4a2e1c', 0.4);
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.04 * hk, 0.018 * hk, -0.095 * hk);
      if (shape === 'amande') eye.scale.set(1.15, 0.78, 1);
      if (shape === 'tombants') eye.rotation.z = side * -0.25;
      if (shape === 'rieurs') eye.rotation.z = side * 0.22;
      eye.scale.multiplyScalar(hk);
      const white = new THREE.Mesh(eyeWhiteG, mat('#fbf6ee', 0.3));
      eye.add(white);
      const ir = new THREE.Mesh(irisG, iris);
      ir.position.z = -0.0185;
      ir.rotation.y = Math.PI;
      eye.add(ir);
      const pu = new THREE.Mesh(pupilG, mat('#0e0a08', 0.2));
      pu.position.z = -0.019;
      pu.rotation.y = Math.PI;
      eye.add(pu);
      // Paupière : demi-sphère relevée vers l'arrière quand l'œil est ouvert, rabattue devant pour cligner.
      const lid = new THREE.Mesh(lidG, skinM);
      lid.rotation.x = LID_OPEN[shape];
      eye.add(lid);
      lids.push(lid);
      headPivot.add(eye);
      // Sourcil.
      const brow = mk(geo('v2brow', () => new THREE.CapsuleGeometry(0.006, 0.026, 3, 6).rotateZ(Math.PI / 2)), mat(shade(hair, 0.8), 0.9), false);
      brow.position.set(side * 0.04 * hk, 0.05 * hk, -0.102 * hk);
      brow.rotation.z = side * (shape === 'tombants' ? 0.18 : -0.08);
      headPivot.add(brow);
    }
    // Bouche : un léger sourire.
    const mouth = mk(geo('v2mouth', () => new THREE.TorusGeometry(0.022, 0.005, 6, 12, Math.PI * 0.8).rotateZ(Math.PI * 1.1)), mat('#8a3b34', 0.5), false);
    mouth.position.set(0, -0.045 * hk, -0.103 * hk);
    headPivot.add(mouth);
    // Joues et taches de rousseur.
    const cheekM = mat('#ff8f8f', 0.7);
    cheekM.transparent = true;
    cheekM.opacity = 0.25;
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(geo('v2cheek', () => new THREE.CircleGeometry(0.016, 12)), cheekM);
      cheek.position.set(side * 0.065 * hk, -0.02 * hk, -0.088 * hk);
      cheek.rotation.y = Math.PI + side * 0.6;
      headPivot.add(cheek);
    }
    if (a.freckles) {
      const dotM = mat(shade(skin, 0.68), 0.7);
      const dotG = geo('v2freckle', () => new THREE.CircleGeometry(0.0032, 6));
      for (let i = 0; i < 12; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const r = hashStr(`fr${i}${variation}`);
        const d = new THREE.Mesh(dotG, dotM);
        d.position.set(side * (0.018 + r * 0.05) * hk, (-0.005 + ((i * 7) % 5) * 0.006) * hk, (-0.104 + r * 0.012) * hk);
        d.rotation.y = Math.PI + side * (0.2 + r * 0.4);
        headPivot.add(d);
      }
    }
    // Lunettes.
    if (a.glasses && a.glasses !== 'aucune') {
      const frameM = mat(a.glasses === 'ecaille' ? '#6b3f22' : a.glasses === 'fines' ? '#b9b3a6' : '#1c1a1f', 0.4, a.glasses === 'fines' ? 0.6 : 0);
      const square = a.glasses === 'carrees' || a.glasses === 'soleil';
      const rimG = geo(`v2rim${square ? 's' : 'r'}`, () => (square ? new THREE.TorusGeometry(0.026, 0.004, 4, 4).rotateZ(Math.PI / 4).scale(1.15, 0.85, 1) : new THREE.TorusGeometry(0.024, 0.0035, 6, 18)));
      for (const side of [-1, 1]) {
        const rim = new THREE.Mesh(rimG, frameM);
        rim.position.set(side * 0.04 * hk, 0.018 * hk, -0.112 * hk);
        rim.scale.setScalar(hk);
        headPivot.add(rim);
        if (a.glasses === 'soleil') {
          const lensM = mat('#15171c', 0.15, 0.3);
          const lens = new THREE.Mesh(geo('v2lens', () => new THREE.CircleGeometry(0.025, 16)), lensM);
          lens.position.set(side * 0.04 * hk, 0.018 * hk, -0.113 * hk);
          lens.rotation.y = Math.PI;
          headPivot.add(lens);
        }
      }
      const bridge = new THREE.Mesh(geo('v2bridge', () => new THREE.BoxGeometry(0.03, 0.004, 0.004)), frameM);
      bridge.position.set(0, 0.022 * hk, -0.114 * hk);
      headPivot.add(bridge);
    }
  } else {
    // Foule : deux yeux simples suffisent à distance.
    const dotG = geo('v2eyeLow', () => new THREE.SphereGeometry(0.014, 6, 5));
    for (const side of [-1, 1]) {
      const e = new THREE.Mesh(dotG, mat('#1e1612', 0.3));
      e.position.set(side * 0.04 * hk, 0.018 * hk, -0.104 * hk);
      headPivot.add(e);
    }
  }
  // Barbe.
  if (a.beard && a.beard !== 'aucune') {
    const beardM = mat(shade(hair, a.beard === 'duvet' ? 1.15 : 1), 0.95);
    if (a.beard === 'moustache' || a.beard === 'courte' || a.beard === 'pleine') {
      const mous = mk(geo('v2mous', () => new THREE.CapsuleGeometry(0.009, 0.04, 3, 6).rotateZ(Math.PI / 2)), beardM, false);
      mous.position.set(0, -0.03 * hk, -0.108 * hk);
      headPivot.add(mous);
    }
    if (a.beard !== 'moustache') {
      const chin = mk(geo(`v2beard${a.beard}`, () => new THREE.SphereGeometry(0.1, 14, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.35).rotateY(Math.PI)), beardM, false);
      chin.position.set(0, (a.beard === 'pleine' ? -0.005 : 0.005) * hk, -0.004 * hk);
      chin.scale.setScalar(hk * (a.beard === 'pleine' ? 1.12 : a.beard === 'duvet' ? 1.01 : 1.05));
      headPivot.add(chin);
    }
  }

  // --- Cheveux : 14 coupes ---
  const style = a.hairStyle;
  const addHair = (key: string, make: () => THREE.BufferGeometry, x: number, y: number, z: number, s = 1, rot?: [number, number, number]): THREE.Mesh => {
    const m = mk(geo(key, make), hairM, true);
    m.position.set(x * hk, y * hk, z * hk);
    m.scale.setScalar(hk * s);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    headPivot.add(m);
    return m;
  };
  const capFull = (): THREE.BufferGeometry => new THREE.SphereGeometry(0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52).scale(0.99, 1.05, 1.03);
  if (style === 'rase') {
    addHair('v2capShave', () => new THREE.SphereGeometry(0.1145, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.95, 1.07, 0.99), 0, 0.002, 0.002);
  } else if (style === 'afro') {
    addHair('v2afro', () => new THREE.IcosahedronGeometry(0.15, 2).scale(1.05, 0.92, 1), 0, 0.08, 0.035);
  } else if (style === 'crete') {
    addHair('v2capShave', () => new THREE.SphereGeometry(0.1145, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.95, 1.07, 0.99), 0, 0.002, 0.002);
    for (let i = 0; i < 5; i++) addHair('v2spike', () => new THREE.ConeGeometry(0.022, 0.07, 6), 0, 0.12 - Math.abs(i - 2) * 0.01, -0.06 + i * 0.03, 1, [-0.3 + i * 0.15, 0, 0]);
  } else {
    if (style === 'degrade') addHair('v2capShave', () => new THREE.SphereGeometry(0.1145, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.95, 1.07, 0.99), 0, 0.002, 0.002);
    else addHair('v2cap', capFull, 0, 0.012, 0.004);
    if (style === 'degrade') addHair('v2fadeTop', () => new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.4).scale(1, 1.25, 1.1), 0, 0.04, -0.005);
    if (style === 'frange' || style === 'long' || style === 'mi-long') addHair('v2fringe', () => new THREE.CapsuleGeometry(0.03, 0.12, 4, 8).rotateZ(Math.PI / 2).scale(1, 1, 0.5), 0, 0.075, -0.098);
    if (style === 'mi-long') addHair('v2bob', () => new THREE.CylinderGeometry(0.125, 0.13, 0.12, 18, 1, true), 0, 0.0, 0.01);
    if (style === 'long') {
      addHair('v2long', () => new THREE.CapsuleGeometry(0.1, 0.2, 4, 12).scale(1.18, 1, 0.55), 0, -0.1, 0.075);
      for (const side of [-1, 1]) addHair('v2longSide', () => new THREE.CapsuleGeometry(0.03, 0.18, 3, 8), side * 0.105, -0.07, -0.01);
    }
    if (style === 'tresse') {
      addHair('v2back', () => new THREE.CapsuleGeometry(0.1, 0.1, 3, 10).scale(1.1, 1, 0.6), 0, -0.05, 0.07);
      for (let i = 0; i < 4; i++) addHair('v2braidSeg', () => new THREE.SphereGeometry(0.03, 8, 6), 0, -0.13 - i * 0.05, 0.11 + i * 0.006);
    }
    if (style === 'couettes') for (const side of [-1, 1]) addHair('v2tail', () => new THREE.CapsuleGeometry(0.035, 0.12, 3, 8), side * 0.13, -0.05, 0.03, 1, [0, 0, side * 0.4]);
    if (style === 'queue') addHair('v2pony', () => new THREE.CapsuleGeometry(0.035, 0.16, 3, 8), 0, -0.05, 0.13, 1, [0.5, 0, 0]);
    if (style === 'chignon') addHair('v2bun', () => new THREE.SphereGeometry(0.055, 12, 10), 0, 0.09, 0.08);
    if (style === 'boucle') for (let i = 0; i < (full ? 11 : 5); i++) {
      const ang = (i / 11) * Math.PI * 2;
      addHair('v2curl', () => new THREE.IcosahedronGeometry(0.042, 1), Math.cos(ang) * 0.1, 0.055 + (i % 2) * 0.03, Math.sin(ang) * 0.1);
    }
    if (style === 'locks') for (let i = 0; i < (full ? 9 : 4); i++) {
      const ang = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7;
      addHair('v2lock', () => new THREE.CapsuleGeometry(0.016, 0.16, 3, 6), Math.cos(ang) * 0.11, -0.06, Math.sin(ang) * 0.1);
    }
  }
  // Couvre-chefs et écouteurs.
  if (a.accessory === 'casquette') {
    const capM = mat(shade(look.top, 0.85), 0.7);
    const crown = mk(geo('v2capCrown', () => new THREE.SphereGeometry(0.124, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5)), capM);
    crown.position.y = 0.02 * hk;
    crown.scale.setScalar(hk);
    headPivot.add(crown);
    const brim = mk(geo('v2brim', () => new THREE.CylinderGeometry(0.09, 0.09, 0.008, 16, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, 0.9)), capM);
    brim.position.set(0, 0.035 * hk, -0.1 * hk);
    brim.scale.setScalar(hk);
    headPivot.add(brim);
  }
  if (a.accessory === 'bonnet') {
    const b = mk(geo('v2beanie', () => new THREE.SphereGeometry(0.127, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1, 1.15, 1)), mat(shade(look.top, 0.9), 0.95));
    b.position.y = 0.02 * hk;
    b.scale.setScalar(hk);
    headPivot.add(b);
    const pom = mk(geo('v2pom', () => new THREE.IcosahedronGeometry(0.03, 1)), mat('#f2ece0', 0.95));
    pom.position.y = 0.16 * hk;
    headPivot.add(pom);
  }
  if (a.accessory === 'ecouteurs') {
    const band = mk(geo('v2band', () => new THREE.TorusGeometry(0.122, 0.009, 6, 20, Math.PI)), mat('#22252c', 0.4), false);
    band.position.y = 0.02 * hk;
    band.scale.setScalar(hk);
    headPivot.add(band);
    for (const side of [-1, 1]) {
      const cup = mk(geo('v2cup', () => new THREE.CylinderGeometry(0.035, 0.035, 0.025, 14).rotateZ(Math.PI / 2)), mat('#22252c', 0.4), false);
      cup.position.set(side * 0.118 * hk, 0, 0);
      headPivot.add(cup);
    }
  }

  // ---------- Animation ----------
  let phase = variation * Math.PI * 2;
  let speedS = 0; // vitesse lissée (pas d'à-coups)
  let heading = 0;
  let shownHeading = 0;
  let turnRate = 0;
  let t = variation * 10;
  let blinkIn = 1.5 + variation * 3;
  let blink = 0;

  return {
    root,
    setHeading(r: number): void { heading = r; },
    update(dt: number, speed: number): void {
      dt = Math.min(dt, 0.1);
      t += dt;
      speedS = smooth(speedS, speed, 9, dt);
      const walk = Math.min(1, speedS / 1.3);
      const run = Math.max(0, Math.min(1, (speedS - 2.2) / 2.4));
      // Foulée : la cadence suit la vitesse, avec une amplitude qui croît puis plafonne.
      const cadence = 1.7 + speedS * 0.85;
      phase += dt * cadence * Math.PI;
      const s = Math.sin(phase);
      const c = Math.cos(phase);
      const stride = (0.5 + run * 0.35) * walk;
      legL.hip.rotation.x = s * stride;
      legR.hip.rotation.x = -s * stride;
      // Genou : flexion quand la jambe passe à l'arrière (phase de balancement).
      legL.knee.rotation.x = Math.max(0, -s + 0.15) * (0.75 + run * 0.7) * walk;
      legR.knee.rotation.x = Math.max(0, s + 0.15) * (0.75 + run * 0.7) * walk;
      // Cheville : déroulé du pied (talon puis pointe).
      legL.ankle.rotation.x = (-s * 0.25 - Math.max(0, -c) * 0.2) * walk;
      legR.ankle.rotation.x = (s * 0.25 - Math.max(0, c) * 0.2) * walk;
      // Bassin : rebond deux fois par foulée, balancier et rotation.
      const bounce = Math.abs(c) * (0.028 + run * 0.03) * walk * k;
      const breath = Math.sin(t * 1.6) * 0.004 * (1 - walk);
      hips.position.y = bounce + breath;
      hips.rotation.y = s * 0.12 * walk;
      hips.rotation.z = c * 0.035 * walk;
      // Épaules : contre-rotation, inclinaison en course.
      chest.rotation.y = -s * 0.16 * walk;
      chest.rotation.x = -(run * 0.2 + walk * 0.03);
      // Bras en opposition, coudes plus fléchis en course ; au repos, léger balancement.
      const idle = Math.sin(t * 1.1) * 0.03 * (1 - walk);
      armL.shoulder.rotation.x = -s * (0.55 + run * 0.4) * walk + idle;
      armR.shoulder.rotation.x = s * (0.55 + run * 0.4) * walk - idle;
      armL.elbow.rotation.x = -(0.15 + walk * 0.25 + run * 0.9) - Math.max(0, s) * 0.2 * walk;
      armR.elbow.rotation.x = -(0.15 + walk * 0.25 + run * 0.9) - Math.max(0, -s) * 0.2 * walk;
      // Virage : inclinaison vers l'intérieur selon la vitesse de rotation.
      let dh = heading - shownHeading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const step = dh * (1 - Math.exp(-(8 + walk * 4) * dt));
      shownHeading += step;
      turnRate = smooth(turnRate, step / Math.max(dt, 1e-3), 10, dt);
      root.rotation.y = shownHeading;
      root.rotation.z = Math.max(-0.12, Math.min(0.12, -turnRate * 0.03 * walk));
      // Tête : stabilisée contre le buste, regard qui flâne au repos.
      headPivot.rotation.y = -chest.rotation.y * 0.8 + Math.sin(t * 0.37) * 0.22 * (1 - walk);
      headPivot.rotation.x = -chest.rotation.x * 0.6 + Math.sin(t * 0.23) * 0.05 * (1 - walk);
      // Clignement.
      blinkIn -= dt;
      if (blinkIn <= 0) { blink = 1; blinkIn = 2.5 + hashStr(`${t.toFixed(1)}${variation}`) * 3.5; }
      blink = Math.max(0, blink - dt * 9);
      const lid = blink > 0.5 ? 1 - (blink - 0.5) * 2 : blink * 2;
      const open = LID_OPEN[shape];
      for (const l of lids) l.rotation.x = open - lid * (open + Math.PI / 2);
    },
    dispose(): void {
      root.removeFromParent();
    },
  };
}
