/**
 * Personnage articulé provisoire (low-poly), même API que le module promis à Jules
 * (`src/presentation/city3d/characters.ts`, voir le prompt Jules). Quand ce module arrivera,
 * `CityRenderer` basculera dessus sans autre changement.
 * Pieds à y = 0, regard vers -Z, animation procédurale (respiration, marche, course).
 */
import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../../core/types';
import { HAIR_COLOR_INFO, OUTFIT_COLOR_INFO, SKIN_TONE_INFO } from '../../core/player_customization';

export interface CharacterSpec {
  appearance: PlayerAppearance;
  gender?: PlayerGender;
  heightM?: number;
  /** Couleur de haut pour les PNJ (remplace la couleur de tenue). */
  bodyColor?: string;
  /** Couleur du bas (pantalon/jupe). */
  legColor?: string;
}

export interface Character3D {
  root: THREE.Group;
  update(dtSeconds: number, speedMps: number): void;
  setHeading(radians: number): void;
  dispose(): void;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.8): THREE.MeshStandardMaterial {
  const k = `${color}_${rough}`;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough }); matCache.set(k, m); }
  return m;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function createCharacter(spec: CharacterSpec): Character3D {
  const a = spec.appearance;
  const H = spec.heightM ?? 1.55;
  const k = H / 1.7; // échelle relative à un adulte de 1,70 m
  const skin = SKIN_TONE_INFO[a.skinTone]?.hex ?? '#e2ad7a';
  const hair = HAIR_COLOR_INFO[a.hairColor]?.hex ?? '#6b4a2f';
  const top = spec.bodyColor ?? OUTFIT_COLOR_INFO[a.outfitColor]?.hex ?? '#f48c5d';
  const legs = spec.legColor ?? (a.outfitStyle === 'sportif' ? '#2c2f3a' : a.outfitStyle === 'artisan' ? '#5a4a3a' : '#3b4a66');
  const variation = hashStr(JSON.stringify(a) + (spec.bodyColor ?? ''));

  const root = new THREE.Group();
  const body = new THREE.Group(); // pivot du buste (penché en course)
  root.add(body);

  const mk = (g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    return mesh;
  };

  // Jambes (deux segments) : hanche → genou → cheville.
  const thighG = geo('thigh', () => new THREE.CapsuleGeometry(0.075, 0.32, 3, 8).translate(0, -0.2, 0));
  const shinG = geo('shin', () => new THREE.CapsuleGeometry(0.065, 0.32, 3, 8).translate(0, -0.2, 0));
  const shoeG = geo('shoe', () => new THREE.BoxGeometry(0.12, 0.08, 0.24).translate(0, -0.03, -0.04));
  const makeLeg = (side: number): { hip: THREE.Group; knee: THREE.Group } => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1 * k, 0.86 * k, 0);
    const thigh = mk(thighG, mat(legs));
    thigh.scale.setScalar(k);
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.set(0, -0.42 * k, 0);
    const shin = mk(shinG, mat(legs));
    shin.scale.setScalar(k);
    knee.add(shin);
    const shoe = mk(shoeG, mat('#2a2220', 0.6));
    shoe.position.y = -0.42 * k;
    shoe.scale.setScalar(k);
    knee.add(shoe);
    hip.add(knee);
    root.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // Bassin et torse.
  const pelvis = mk(geo('pelvis', () => new THREE.BoxGeometry(0.3, 0.16, 0.18)), mat(legs));
  pelvis.position.y = 0.9 * k;
  pelvis.scale.setScalar(k);
  body.add(pelvis);
  const torsoG = geo('torso', () => new THREE.CapsuleGeometry(0.16, 0.34, 4, 10).scale(1.15, 1, 0.75));
  const torso = mk(torsoG, mat(top, 0.85));
  torso.position.y = 1.2 * k;
  torso.scale.setScalar(k);
  body.add(torso);
  if (a.outfitStyle === 'artisan') {
    const apron = mk(geo('apron', () => new THREE.BoxGeometry(0.3, 0.42, 0.02)), mat('#8a5a3a'));
    apron.position.set(0, 1.08 * k, -0.13 * k);
    apron.scale.setScalar(k);
    body.add(apron);
  }
  if (a.outfitStyle === 'citoyen') {
    const scarf = mk(geo('scarf', () => new THREE.TorusGeometry(0.11, 0.035, 6, 12).rotateX(Math.PI / 2)), mat('#c25a40'));
    scarf.position.y = 1.43 * k;
    scarf.scale.setScalar(k);
    body.add(scarf);
  }
  if (a.outfitStyle === 'ecolier') {
    const bag = mk(geo('bag', () => new THREE.BoxGeometry(0.26, 0.32, 0.12)), mat('#4f6a8a'));
    bag.position.set(0, 1.2 * k, 0.17 * k);
    bag.scale.setScalar(k);
    body.add(bag);
  }

  // Bras (épaule → coude).
  const upperG = geo('upperArm', () => new THREE.CapsuleGeometry(0.055, 0.24, 3, 8).translate(0, -0.15, 0));
  const lowerG = geo('lowerArm', () => new THREE.CapsuleGeometry(0.048, 0.22, 3, 8).translate(0, -0.14, 0));
  const makeArm = (side: number): { shoulder: THREE.Group; elbow: THREE.Group } => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.24 * k, 1.38 * k, 0);
    const up = mk(upperG, mat(top, 0.85));
    up.scale.setScalar(k);
    shoulder.add(up);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3 * k;
    const low = mk(lowerG, mat(skin, 0.7));
    low.scale.setScalar(k);
    elbow.add(low);
    shoulder.add(elbow);
    body.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Tête, cou, cheveux.
  const neck = mk(geo('neck', () => new THREE.CylinderGeometry(0.05, 0.055, 0.08, 8)), mat(skin, 0.7));
  neck.position.y = 1.5 * k;
  neck.scale.setScalar(k);
  body.add(neck);
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.62 * k;
  body.add(headPivot);
  const head = mk(geo('head', () => new THREE.SphereGeometry(0.115, 14, 12).scale(0.95, 1.08, 1)), mat(skin, 0.65));
  head.scale.setScalar(k);
  headPivot.add(head);
  const eyeG = geo('eye', () => new THREE.SphereGeometry(0.014, 6, 6));
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeG, mat('#1e1612', 0.3));
    eye.position.set(side * 0.04 * k, 0.015 * k, -0.105 * k);
    headPivot.add(eye);
  }
  const hairMat = mat(hair, 0.9);
  const cap = mk(geo('hairCap', () => new THREE.SphereGeometry(0.125, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(0.98, 1.05, 1.02)), hairMat);
  cap.position.y = 0.012 * k;
  cap.scale.setScalar(k);
  headPivot.add(cap);
  const style = a.hairStyle;
  if (style === 'mi-long' || style === 'tresse') {
    const back = mk(geo('hairBack', () => new THREE.CapsuleGeometry(0.1, 0.12, 3, 8).scale(1.1, 1, 0.6)), hairMat);
    back.position.set(0, -0.07 * k, 0.07 * k);
    back.scale.setScalar(k);
    headPivot.add(back);
  }
  if (style === 'tresse') {
    const braid = mk(geo('braid', () => new THREE.CapsuleGeometry(0.03, 0.22, 3, 6)), hairMat);
    braid.position.set(0, -0.24 * k, 0.11 * k);
    braid.scale.setScalar(k);
    headPivot.add(braid);
  }
  if (style === 'couettes') {
    for (const side of [-1, 1]) {
      const tail = mk(geo('tail', () => new THREE.CapsuleGeometry(0.035, 0.12, 3, 6)), hairMat);
      tail.position.set(side * 0.13 * k, -0.06 * k, 0.03 * k);
      tail.rotation.z = side * 0.4;
      tail.scale.setScalar(k);
      headPivot.add(tail);
    }
  }
  if (style === 'boucle') {
    const curlG = geo('curl', () => new THREE.IcosahedronGeometry(0.045, 0));
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const curl = mk(curlG, hairMat);
      curl.position.set(Math.cos(ang) * 0.1 * k, (0.06 + (i % 2) * 0.03) * k, Math.sin(ang) * 0.1 * k);
      curl.scale.setScalar(k);
      headPivot.add(curl);
    }
  }

  // Animation.
  let phase = variation * Math.PI * 2;
  let blend = 0; // 0 repos → 1 locomotion
  let heading = 0;
  let shownHeading = 0;
  return {
    root,
    setHeading(r: number): void { heading = r; },
    update(dt: number, speed: number): void {
      const target = Math.min(1, speed / 1.4);
      blend += (target - blend) * Math.min(1, dt * 8);
      const run = Math.max(0, Math.min(1, (speed - 2.2) / 2.5));
      const cadence = 1.6 + speed * 0.95; // pas par seconde
      phase += dt * cadence * Math.PI;
      const swing = Math.sin(phase) * (0.55 + run * 0.35) * blend;
      legL.hip.rotation.x = swing;
      legR.hip.rotation.x = -swing;
      legL.knee.rotation.x = Math.max(0, -Math.sin(phase)) * (0.7 + run * 0.6) * blend;
      legR.knee.rotation.x = Math.max(0, Math.sin(phase)) * (0.7 + run * 0.6) * blend;
      armL.shoulder.rotation.x = -swing * 0.8;
      armR.shoulder.rotation.x = swing * 0.8;
      armL.elbow.rotation.x = -(0.25 + run * 0.9) * blend - 0.08;
      armR.elbow.rotation.x = -(0.25 + run * 0.9) * blend - 0.08;
      body.rotation.x = -run * 0.18 * blend;
      // Rebond vertical et respiration.
      const bob = Math.abs(Math.cos(phase)) * 0.035 * blend * k;
      const breath = Math.sin(phase * 0.35) * 0.006 * (1 - blend);
      body.position.y = bob + breath;
      headPivot.rotation.y = Math.sin(phase * 0.13) * 0.15 * (1 - blend);
      // Rotation lissée vers le cap.
      let dh = heading - shownHeading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      shownHeading += dh * Math.min(1, dt * 12);
      root.rotation.y = shownHeading;
    },
    dispose(): void {
      root.removeFromParent();
    },
  };
}
