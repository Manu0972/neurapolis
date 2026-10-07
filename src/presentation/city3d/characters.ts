import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../../core/types';

export interface CharacterSpec {
  appearance?: PlayerAppearance | any;
  gender?: PlayerGender;
  heightM?: number;               // 1.55 par défaut pour un ado de 12 ans, 1.75 pour un adulte
  bodyColor?: string;             // pour les PNJ sans apparence complète
  legColor?: string;              // optionnel pour PNJ
}

export interface Character3D {
  root: THREE.Group;              // pieds à y = 0, regard vers -Z
  update(dtSeconds: number, speedMps: number): void; // 0 = repos, ~1.6 = marche, ~4.5 = course
  setHeading(radians: number): void;
  dispose(): void;
}

// Palettes canoniques du contrat à jetons
const SKIN_TONE_PALETTE: Record<string, string> = {
  claire: '#ffc496',
  chaude: '#b47a56',
  doree: '#e2ad7a',
  ebene: '#724028',
};

const HAIR_COLOR_PALETTE: Record<string, string> = {
  brun: '#4a3220',
  chatain: '#6b4a2f',
  blond: '#ffd98a',
  roux: '#c15f4a',
  noir: '#2c2230',
};

const OUTFIT_COLOR_PALETTE: Record<string, string> = {
  denim: '#4a5a7a',
  coral: '#f48c5d',
  vert: '#38b764',
  ocre: '#8a5a3a',
  indigo: '#303e80',
};

function parseColorHex(colorStr: string | undefined, palette: Record<string, string>, defaultHex: string): number {
  if (!colorStr) return parseInt(defaultHex.replace('#', ''), 16);
  if (colorStr.startsWith('#')) {
    const val = parseInt(colorStr.replace('#', ''), 16);
    return isNaN(val) ? parseInt(defaultHex.replace('#', ''), 16) : val;
  }
  if (palette[colorStr]) {
    return parseInt(palette[colorStr].replace('#', ''), 16);
  }
  if (/^[0-9a-fA-F]{6}$/.test(colorStr)) {
    return parseInt(colorStr, 16);
  }
  return parseInt(defaultHex.replace('#', ''), 16);
}

// Cache global partagé pour optimiser les performances (60 personnages à 60 fps)
const sharedGeometries = new Map<string, THREE.BufferGeometry>();
const sharedMaterials = new Map<number, THREE.Material>();

function getSharedBoxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `box_${w}_${h}_${d}`;
  let geo = sharedGeometries.get(key) as THREE.BoxGeometry;
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d);
    sharedGeometries.set(key, geo);
  }
  return geo;
}

function getSharedCylinderGeometry(rt: number, rb: number, h: number, segs = 8): THREE.CylinderGeometry {
  const key = `cyl_${rt}_${rb}_${h}_${segs}`;
  let geo = sharedGeometries.get(key) as THREE.CylinderGeometry;
  if (!geo) {
    geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    sharedGeometries.set(key, geo);
  }
  return geo;
}

function getSharedSphereGeometry(r: number, segs = 8): THREE.SphereGeometry {
  const key = `sph_${r}_${segs}`;
  let geo = sharedGeometries.get(key) as THREE.SphereGeometry;
  if (!geo) {
    geo = new THREE.SphereGeometry(r, segs, segs);
    sharedGeometries.set(key, geo);
  }
  return geo;
}

function getSharedMaterial(hexColor: number): THREE.MeshLambertMaterial {
  let mat = sharedMaterials.get(hexColor) as THREE.MeshLambertMaterial;
  if (!mat) {
    mat = new THREE.MeshLambertMaterial({ color: hexColor });
    sharedMaterials.set(hexColor, mat);
  }
  return mat;
}

function hashSpec(spec: CharacterSpec): number {
  const str = JSON.stringify(spec);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function createCharacter(spec: CharacterSpec): Character3D {
  const targetHeight = spec.heightM ?? 1.55;
  const baseHeight = 1.55; // Hauteur de référence exacte de la hiérarchie
  const scale = targetHeight / baseHeight;

  const app = spec.appearance || {};
  const skinHex = parseColorHex(app.skinTone, SKIN_TONE_PALETTE, '#ffc496');
  const hairHex = parseColorHex(app.hairColor, HAIR_COLOR_PALETTE, '#6b4a2f');

  let topHex = parseColorHex(app.outfitColor, OUTFIT_COLOR_PALETTE, '#f48c5d');
  if (spec.bodyColor) {
    topHex = parseColorHex(spec.bodyColor, {}, '#3a6ca8');
  }

  let bottomHex = parseColorHex(app.outfitStyle === 'sportif' ? 'indigo' : 'denim', OUTFIT_COLOR_PALETTE, '#4a5a7a');
  if (spec.legColor) {
    bottomHex = parseColorHex(spec.legColor, {}, '#2a3a5a');
  }

  const matSkin = getSharedMaterial(skinHex);
  const matHair = getSharedMaterial(hairHex);
  const matTop = getSharedMaterial(topHex);
  const matBottom = getSharedMaterial(bottomHex);
  const matShoe = getSharedMaterial(0x222222);

  const root = new THREE.Group();
  root.name = 'character_root';

  const modelGroup = new THREE.Group();
  modelGroup.name = 'model_group';
  modelGroup.scale.set(scale, scale, scale);
  root.add(modelGroup);

  // --- REPERE REEL POUR baseHeight = 1.55m ---
  // Pieds (semelle) : y = 0.00
  // Hanches (pivot jambes & pelvis) : y = 0.70
  // Torso : y_relatif = 0.00 -> 0.48 (hauteur 0.48, centre à 0.24 -> y_abs = 0.70 à 1.18)
  // Tête : y_relatif_torso = 0.48 -> y_abs = 1.18. Tête de hauteur 0.24 (centre à 0.12 -> y_abs = 1.18 à 1.42)
  // Cheveux : y_relatif_tête = 0.24 -> y_abs = 1.42. Coiffure hauteur 0.13 (y_abs = 1.42 à 1.55)

  // --- JAMBES (Gauche & Droite) ---
  const legLGroup = new THREE.Group();
  legLGroup.name = 'jambeG';
  legLGroup.position.set(0.12, 0.70, 0);

  const upperLegL = new THREE.Mesh(getSharedBoxGeometry(0.12, 0.35, 0.12), matBottom);
  upperLegL.position.y = -0.175;
  legLGroup.add(upperLegL);

  const lowerLegLGroup = new THREE.Group();
  lowerLegLGroup.name = 'lowerLegLGroup';
  lowerLegLGroup.position.set(0, -0.35, 0);

  const lowerLegL = new THREE.Mesh(getSharedBoxGeometry(0.10, 0.27, 0.10), matSkin);
  lowerLegL.position.y = -0.135;
  lowerLegLGroup.add(lowerLegL);

  const shoeL = new THREE.Mesh(getSharedBoxGeometry(0.11, 0.08, 0.16), matShoe);
  shoeL.position.set(0, -0.31, -0.02);
  lowerLegLGroup.add(shoeL);

  legLGroup.add(lowerLegLGroup);
  modelGroup.add(legLGroup);

  const legRGroup = new THREE.Group();
  legRGroup.name = 'jambeD';
  legRGroup.position.set(-0.12, 0.70, 0);

  const upperLegR = new THREE.Mesh(getSharedBoxGeometry(0.12, 0.35, 0.12), matBottom);
  upperLegR.position.y = -0.175;
  legRGroup.add(upperLegR);

  const lowerLegRGroup = new THREE.Group();
  lowerLegRGroup.name = 'lowerLegRGroup';
  lowerLegRGroup.position.set(0, -0.35, 0);

  const lowerLegR = new THREE.Mesh(getSharedBoxGeometry(0.10, 0.27, 0.10), matSkin);
  lowerLegR.position.y = -0.135;
  lowerLegRGroup.add(lowerLegR);

  const shoeR = new THREE.Mesh(getSharedBoxGeometry(0.11, 0.08, 0.16), matShoe);
  shoeR.position.set(0, -0.31, -0.02);
  lowerLegRGroup.add(shoeR);

  legRGroup.add(lowerLegRGroup);
  modelGroup.add(legRGroup);

  // --- BUSTE & BASSIN ---
  const pelvis = new THREE.Group();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 0.70, 0);

  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torsoGroup';
  torsoGroup.position.set(0, 0, 0);
  pelvis.add(torsoGroup);

  const torso = new THREE.Mesh(getSharedBoxGeometry(0.36, 0.48, 0.22), matTop);
  torso.name = 'torso';
  torso.position.y = 0.24; // centre à 0.24 -> couvre de 0 à 0.48 dans torsoGroup
  torsoGroup.add(torso);

  // Accessoires d'outfitStyle
  const outfitStyle = app.outfitStyle;
  if (outfitStyle === 'ecolier') {
    const backpack = new THREE.Mesh(getSharedBoxGeometry(0.26, 0.32, 0.12), getSharedMaterial(0x8a5a3a));
    backpack.position.set(0, 0.24, 0.16);
    torsoGroup.add(backpack);
  } else if (outfitStyle === 'artisan') {
    const apron = new THREE.Mesh(getSharedBoxGeometry(0.30, 0.40, 0.02), getSharedMaterial(0xd2b48c));
    apron.position.set(0, 0.18, -0.12);
    torsoGroup.add(apron);
  } else if (outfitStyle === 'citoyen') {
    const scarf = new THREE.Mesh(getSharedBoxGeometry(0.28, 0.08, 0.24), getSharedMaterial(0xc15f4a));
    scarf.position.set(0, 0.46, 0);
    torsoGroup.add(scarf);
  }

  // --- BRAS (Gauche & Droit) ---
  const armLGroup = new THREE.Group();
  armLGroup.name = 'armLGroup';
  armLGroup.position.set(0.23, 0.42, 0);

  const upperArmL = new THREE.Mesh(getSharedBoxGeometry(0.10, 0.22, 0.10), matTop);
  upperArmL.position.y = -0.11;
  armLGroup.add(upperArmL);

  const lowerArmLGroup = new THREE.Group();
  lowerArmLGroup.name = 'lowerArmLGroup';
  lowerArmLGroup.position.set(0, -0.22, 0);

  const lowerArmL = new THREE.Mesh(getSharedBoxGeometry(0.09, 0.20, 0.09), matSkin);
  lowerArmL.position.y = -0.10;
  lowerArmLGroup.add(lowerArmL);
  armLGroup.add(lowerArmLGroup);
  torsoGroup.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.name = 'armRGroup';
  armRGroup.position.set(-0.23, 0.42, 0);

  const upperArmR = new THREE.Mesh(getSharedBoxGeometry(0.10, 0.22, 0.10), matTop);
  upperArmR.position.y = -0.11;
  armRGroup.add(upperArmR);

  const lowerArmRGroup = new THREE.Group();
  lowerArmRGroup.name = 'lowerArmRGroup';
  lowerArmRGroup.position.set(0, -0.22, 0);

  const lowerArmR = new THREE.Mesh(getSharedBoxGeometry(0.09, 0.20, 0.09), matSkin);
  lowerArmR.position.y = -0.10;
  lowerArmRGroup.add(lowerArmR);
  armRGroup.add(lowerArmRGroup);
  torsoGroup.add(armRGroup);

  // --- TÊTE & COIFFURE ---
  const headGroup = new THREE.Group();
  headGroup.name = 'head';
  headGroup.position.set(0, 0.48, 0); // sommet du torso

  const headMesh = new THREE.Mesh(getSharedBoxGeometry(0.24, 0.24, 0.22), matSkin);
  headMesh.position.y = 0.12; // centre à 0.12 -> couvre de 0 à 0.24 dans headGroup (y_abs = 1.18 à 1.42)
  headGroup.add(headMesh);

  // Coiffures selon hairStyle (posées à y = 0.24 dans headGroup, haut à y = 0.37 -> y_abs = 1.55m)
  const hairGroup = new THREE.Group();
  hairGroup.name = 'hair';
  hairGroup.position.set(0, 0.24, 0);

  const style = app.hairStyle || 'court';
  if (style === 'mi-long') {
    const topCap = new THREE.Mesh(getSharedBoxGeometry(0.26, 0.09, 0.24), matHair);
    topCap.position.y = 0.045; // couvre de 0 à 0.09 -> y_abs = 1.42 à 1.51
    const sideL = new THREE.Mesh(getSharedBoxGeometry(0.04, 0.22, 0.22), matHair);
    sideL.position.set(0.12, -0.11, 0);
    const sideR = new THREE.Mesh(getSharedBoxGeometry(0.04, 0.22, 0.22), matHair);
    sideR.position.set(-0.12, -0.11, 0);
    hairGroup.add(topCap, sideL, sideR);
  } else if (style === 'boucle') {
    const topCap = new THREE.Mesh(getSharedBoxGeometry(0.28, 0.09, 0.26), matHair);
    topCap.position.y = 0.045;
    const puff1 = new THREE.Mesh(getSharedSphereGeometry(0.045), matHair);
    puff1.position.set(0.11, 0.045, 0.05);
    const puff2 = new THREE.Mesh(getSharedSphereGeometry(0.045), matHair);
    puff2.position.set(-0.11, 0.045, 0.05);
    const puff3 = new THREE.Mesh(getSharedSphereGeometry(0.045), matHair);
    puff3.position.set(0, 0.045, -0.05);
    hairGroup.add(topCap, puff1, puff2, puff3);
  } else if (style === 'tresse') {
    const topCap = new THREE.Mesh(getSharedBoxGeometry(0.26, 0.09, 0.24), matHair);
    topCap.position.y = 0.045;
    const braid = new THREE.Mesh(getSharedCylinderGeometry(0.04, 0.02, 0.25), matHair);
    braid.position.set(0, -0.12, 0.13);
    braid.rotation.x = 0.2;
    hairGroup.add(topCap, braid);
  } else if (style === 'couettes') {
    const topCap = new THREE.Mesh(getSharedBoxGeometry(0.26, 0.09, 0.24), matHair);
    topCap.position.y = 0.045;
    const pigtailL = new THREE.Mesh(getSharedCylinderGeometry(0.03, 0.02, 0.18), matHair);
    pigtailL.position.set(0.15, 0.02, 0);
    pigtailL.rotation.z = -0.6;
    const pigtailR = new THREE.Mesh(getSharedCylinderGeometry(0.03, 0.02, 0.18), matHair);
    pigtailR.position.set(-0.15, 0.02, 0);
    pigtailR.rotation.z = 0.6;
    hairGroup.add(topCap, pigtailL, pigtailR);
  } else {
    // 'court' (par défaut)
    const topCap = new THREE.Mesh(getSharedBoxGeometry(0.26, 0.09, 0.24), matHair);
    topCap.position.y = 0.045;
    const fringe = new THREE.Mesh(getSharedBoxGeometry(0.24, 0.04, 0.05), matHair);
    fringe.position.set(0, 0.01, -0.11);
    hairGroup.add(topCap, fringe);
  }

  headGroup.add(hairGroup);
  torsoGroup.add(headGroup);
  modelGroup.add(pelvis);

  // Configuration de l'état interne de l'animation
  const seed = hashSpec(spec);
  let animTime = (seed % 1000) / 1000 * Math.PI * 2;
  let targetHeading = 0;
  let currentHeading = 0;
  let currentSpeed = 0;

  return {
    root,

    setHeading(radians: number): void {
      if (isNaN(radians)) return;
      targetHeading = radians;
    },

    update(dtSeconds: number, speedMps: number): void {
      if (isNaN(dtSeconds) || dtSeconds <= 0) return;
      const speed = isNaN(speedMps) || speedMps < 0 ? 0 : speedMps;

      // Lissage du cap
      let diff = (targetHeading - currentHeading) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      currentHeading += diff * Math.min(1, dtSeconds * 12);
      root.rotation.y = currentHeading;

      // Lissage de la vitesse
      currentSpeed += (speed - currentSpeed) * Math.min(1, dtSeconds * 8);

      // Mise à jour du temps d'animation
      if (currentSpeed < 0.05) {
        animTime += dtSeconds * 2.5; // fréquence de respiration au repos
      } else {
        animTime += dtSeconds * currentSpeed * 4.2; // cadence proportionnelle à la vitesse
      }

      const isWalking = currentSpeed >= 0.05 && currentSpeed <= 2.2;
      const isRunning = currentSpeed > 2.2;

      if (isRunning) {
        const runFactor = Math.min(1, (currentSpeed - 2.2) / 3.0);
        const swingAmp = 0.8 + runFactor * 0.35;

        // Buste penché vers l'avant en course
        torsoGroup.rotation.x = 0.15 + runFactor * 0.10;

        // Mouvements des jambes
        legLGroup.rotation.x = Math.sin(animTime) * swingAmp;
        legRGroup.rotation.x = -Math.sin(animTime) * swingAmp;

        lowerLegLGroup.rotation.x = Math.max(0, -Math.sin(animTime)) * 0.6;
        lowerLegRGroup.rotation.x = Math.max(0, Math.sin(animTime)) * 0.6;

        // Mouvements des bras (en opposition)
        armLGroup.rotation.x = -Math.sin(animTime) * swingAmp * 0.9;
        armRGroup.rotation.x = Math.sin(animTime) * swingAmp * 0.9;

        lowerArmLGroup.rotation.x = -0.8 - runFactor * 0.4;
        lowerArmRGroup.rotation.x = -0.8 - runFactor * 0.4;

        // Rebond vertical
        pelvis.position.y = 0.70 + Math.abs(Math.sin(animTime * 2)) * 0.06;

      } else if (isWalking) {
        const swingAmp = Math.min(0.75, currentSpeed * 0.4);

        torsoGroup.rotation.x = 0;

        // Mouvements des jambes
        legLGroup.rotation.x = Math.sin(animTime) * swingAmp;
        legRGroup.rotation.x = -Math.sin(animTime) * swingAmp;

        lowerLegLGroup.rotation.x = Math.max(0, -Math.sin(animTime)) * 0.3;
        lowerLegRGroup.rotation.x = Math.max(0, Math.sin(animTime)) * 0.3;

        // Mouvements des bras
        armLGroup.rotation.x = -Math.sin(animTime) * swingAmp * 0.7;
        armRGroup.rotation.x = Math.sin(animTime) * swingAmp * 0.7;

        lowerArmLGroup.rotation.x = -0.2;
        lowerArmRGroup.rotation.x = -0.2;

        // Rebond léger
        pelvis.position.y = 0.70 + Math.abs(Math.sin(animTime * 2)) * 0.03;

      } else {
        // Repos
        torsoGroup.rotation.x = 0;

        legLGroup.rotation.x = 0;
        legRGroup.rotation.x = 0;

        lowerLegLGroup.rotation.x = 0;
        lowerLegRGroup.rotation.x = 0;

        armLGroup.rotation.x = 0;
        armRGroup.rotation.x = 0;

        lowerArmLGroup.rotation.x = 0;
        lowerArmRGroup.rotation.x = 0;

        // Respiration subtile au repos
        pelvis.position.y = 0.70 + Math.sin(animTime) * 0.01;
        headGroup.rotation.x = Math.cos(animTime * 0.5) * 0.02;
      }
    },

    dispose(): void {
      if (root.parent) {
        root.parent.remove(root);
      }
      root.clear();
    },
  };
}
