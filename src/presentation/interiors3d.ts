/**
 * NEURAPOLIS — Scènes 3D d'Intérieur Détaillées (Dioramas Three.js).
 * Constructeur de scènes isométriques en coupe (cutaway dioramas) avec mobilier low-poly,
 * éclairage chaleureux Hygge 1800K, parquet/pierre/terre et accent lights pour chaque pièce.
 */
import * as THREE from 'three';
import type { PlaceId } from '../core/types';
import { INTERIOR_PLACES } from '../data/interiors';

export interface InteriorDiorama {
  roomGroup: THREE.Group;
  furnitureMeshes: Map<string, THREE.Object3D>;
  ambientLight: THREE.AmbientLight;
  warmAccentLights: THREE.PointLight[];
  dispose: () => void;
}

// Palette Hygge & Matériaux chauds (évitement du noir pur 0x2a1a14)
const COLOR_HYGGE_1800K = 0xffd98a;
const COLOR_WOOD = 0x8a5a3a;
const COLOR_WOOD_DARK = 0x5a3e28;
const COLOR_OUTLINE_METAL = 0x2a1a14;
const COLOR_IVORY = 0xf9ecd0;
const COLOR_BRICK = 0xc25a40;
const COLOR_MOSS_GREEN = 0x6fb06a;
const COLOR_SLATE_BLUE = 0x486b7a;
const COLOR_STONE = 0x9a8f82;
const COLOR_WALL_CREAM = 0xe8d6b0;

/**
 * Construit un diorama 3D low-poly stylisé pour la pièce d'un lieu donné.
 */
export function createInteriorDiorama(placeId: PlaceId, roomId: string): InteriorDiorama {
  const roomGroup = new THREE.Group();
  roomGroup.name = `diorama_${placeId}_${roomId}`;

  const furnitureMeshes = new Map<string, THREE.Object3D>();
  const warmAccentLights: THREE.PointLight[] = [];

  // 1. Éclairage d'ambiance Hygge 1800K
  const ambientLight = new THREE.AmbientLight(COLOR_HYGGE_1800K, 0.75);
  roomGroup.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffecd0, 0x5a3e28, 0.4);
  roomGroup.add(hemiLight);

  // 2. Détermination du type de sol et des dimensions
  const placeDef = INTERIOR_PLACES[placeId];
  const roomDef = placeDef?.rooms.find((r) => r.id === roomId) || placeDef?.rooms[0];
  const surfaceType = roomDef?.surfaceType ?? 'parquet';

  let floorColor = COLOR_WOOD;
  if (surfaceType === 'pave') {
    floorColor = 0xd6c4a8;
  } else if (surfaceType === 'herbe') {
    floorColor = COLOR_MOSS_GREEN;
  } else if (surfaceType === 'terre') {
    floorColor = 0x7a5234;
  }

  // Couleurs de murs spécifiques
  let wallColor = COLOR_WALL_CREAM;
  if (placeId === 'friche') {
    wallColor = 0x8a3a2a; // Brique industrielle
  } else if (placeId === 'college') {
    wallColor = 0xd4cdb8; // Salle de classe beige doux
  } else if (placeId === 'epicerie') {
    wallColor = 0xdfcbaf; // Épicerie chaleureuse
  }

  // 3. Structure de la pièce (Sol + Murs d'angle coupés style diorama)
  const roomW = 8;
  const roomD = 8;
  const wallH = 3.2;

  // Socle du plancher
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floorGeo = new THREE.BoxGeometry(roomW, 0.3, roomD);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, -0.15, 0);
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Socle inférieur contrasté (ombre diorama)
  const baseMat = new THREE.MeshLambertMaterial({ color: COLOR_OUTLINE_METAL });
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.2, 0.2, roomD + 0.2), baseMat);
  baseMesh.position.set(0, -0.35, 0);
  roomGroup.add(baseMesh);

  // Mur du fond (Z = -roomD / 2)
  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
  const backWallGeo = new THREE.BoxGeometry(roomW, wallH, 0.3);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, wallH / 2, -roomD / 2 + 0.15);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  // Mur de gauche (X = -roomW / 2)
  const leftWallGeo = new THREE.BoxGeometry(0.3, wallH, roomD);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-roomW / 2 + 0.15, wallH / 2, 0);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  // Plinthes en bois sombre
  const plintheMat = new THREE.MeshLambertMaterial({ color: COLOR_WOOD_DARK });
  const plintheBack = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.2, 0.08), plintheMat);
  plintheBack.position.set(0, 0.1, -roomD / 2 + 0.34);
  const plintheLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, roomD), plintheMat);
  plintheLeft.position.set(-roomW / 2 + 0.34, 0.1, 0);
  roomGroup.add(plintheBack, plintheLeft);

  // Fenêtre avec lumière dorée hygge sur le mur du fond
  const windowFrameMat = new THREE.MeshLambertMaterial({ color: COLOR_WOOD_DARK });
  const windowGlassMat = new THREE.MeshBasicMaterial({ color: COLOR_HYGGE_1800K });
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.06), windowFrameMat);
  windowFrame.position.set(1.5, 2.0, -roomD / 2 + 0.32);
  const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.08), windowGlassMat);
  windowGlass.position.set(1.5, 2.0, -roomD / 2 + 0.33);
  roomGroup.add(windowFrame, windowGlass);

  // 4. Génération du Mobilier Thématique
  buildThematicFurniture(placeId, roomId, roomGroup, furnitureMeshes, warmAccentLights);

  // 5. Nettoyage mémoire
  const dispose = (): void => {
    roomGroup.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      }
    });
    for (const light of warmAccentLights) {
      roomGroup.remove(light);
      light.dispose();
    }
    roomGroup.clear();
    furnitureMeshes.clear();
    warmAccentLights.length = 0;
  };

  return {
    roomGroup,
    furnitureMeshes,
    ambientLight,
    warmAccentLights,
    dispose,
  };
}

/**
 * Construit les pièces de mobilier détaillées adaptées au lieu et à la pièce active.
 */
function buildThematicFurniture(
  placeId: PlaceId,
  roomId: string,
  roomGroup: THREE.Group,
  furnitureMeshes: Map<string, THREE.Object3D>,
  warmAccentLights: THREE.PointLight[],
): void {
  // Matériaux partagés réutilisables
  const matWood = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
  const matWoodDark = new THREE.MeshLambertMaterial({ color: COLOR_WOOD_DARK });
  const matMetal = new THREE.MeshLambertMaterial({ color: COLOR_OUTLINE_METAL });
  const matIvory = new THREE.MeshLambertMaterial({ color: COLOR_IVORY });
  const matBrick = new THREE.MeshLambertMaterial({ color: COLOR_BRICK });
  const matStone = new THREE.MeshLambertMaterial({ color: COLOR_STONE });
  const matLampGlow = new THREE.MeshBasicMaterial({ color: COLOR_HYGGE_1800K });

  // ─────────────────────────────────────────────────────────────
  // MAISON
  // ─────────────────────────────────────────────────────────────
  if (placeId === 'maison') {
    if (roomId === 'chambre') {
      // 1. Lit douillet (id: 'lit')
      const lit = new THREE.Group();
      lit.position.set(-2.4, 0, -2.4);
      // Cadre bois
      const litCadre = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.2), matWoodDark);
      litCadre.position.set(0, 0.2, 0);
      litCadre.castShadow = true;
      lit.add(litCadre);
      // Tête de lit
      const teteLit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.15), matWoodDark);
      teteLit.position.set(0, 0.55, -1.05);
      lit.add(teteLit);
      // Matelas & couette cosy
      const couette = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 1.7), new THREE.MeshLambertMaterial({ color: COLOR_SLATE_BLUE }));
      couette.position.set(0, 0.45, 0.15);
      lit.add(couette);
      // Oreiller ivoire
      const oreiller = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.45), matIvory);
      oreiller.position.set(0, 0.48, -0.65);
      lit.add(oreiller);
      // Lampe de chevet + PointLight
      const chevet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matWood);
      chevet.position.set(1.1, 0.25, -0.8);
      const abatJour = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.3, 8), matLampGlow);
      abatJour.position.set(1.1, 0.65, -0.8);
      lit.add(chevet, abatJour);
      const pLight = new THREE.PointLight(COLOR_HYGGE_1800K, 0.85, 4.5, 1.5);
      pLight.position.set(-1.3, 0.9, -3.2);
      roomGroup.add(pLight);
      warmAccentLights.push(pLight);

      roomGroup.add(lit);
      furnitureMeshes.set('lit', lit);

      // 2. Bureau d'études (id: 'bureau')
      const bureau = new THREE.Group();
      bureau.position.set(2.2, 0, -2.5);
      const plateau = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.0), matWood);
      plateau.position.set(0, 0.8, 0);
      const pied1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), matMetal);
      pied1.position.set(-0.9, 0.4, 0);
      const pied2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), matMetal);
      pied2.position.set(0.9, 0.4, 0);
      bureau.add(plateau, pied1, pied2);
      // Cahiers & notes
      const cahier = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.35), matIvory);
      cahier.position.set(-0.3, 0.84, 0);
      const lampeBureau = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 6), matLampGlow);
      lampeBureau.position.set(0.65, 0.95, -0.2);
      bureau.add(cahier, lampeBureau);
      // Chaise d'étude
      const chaise = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), matWoodDark);
      chaise.position.set(0, 0.25, 0.7);
      bureau.add(chaise);

      roomGroup.add(bureau);
      furnitureMeshes.set('bureau', bureau);

      // 3. Bibliothèque des penseurs (id: 'bibliotheque')
      const biblio = new THREE.Group();
      biblio.position.set(-3.2, 0, 1.2);
      const corpsBiblio = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 1.8), matWoodDark);
      corpsBiblio.position.set(0, 1.25, 0);
      biblio.add(corpsBiblio);
      // Livres colorés
      const livres = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 1.5), matBrick);
      livres.position.set(0.1, 1.2, 0);
      biblio.add(livres);

      roomGroup.add(biblio);
      furnitureMeshes.set('bibliotheque', biblio);

      // 4. Fenêtre sur le quartier (id: 'fenetre')
      const fenetreDeco = new THREE.Group();
      fenetreDeco.position.set(1.5, 2.0, -3.7);
      const tablette = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.3), matWood);
      fenetreDeco.add(tablette);
      roomGroup.add(fenetreDeco);
      furnitureMeshes.set('fenetre', fenetreDeco);
    } else {
      // Salon & Cuisine
      // 1. Frigo (id: 'frigo')
      const frigo = new THREE.Group();
      frigo.position.set(-3.2, 0, -2.6);
      const corpsFrigo = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.9), new THREE.MeshLambertMaterial({ color: 0xdedede }));
      corpsFrigo.position.set(0, 1.0, 0);
      const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), matMetal);
      poignee.position.set(0.45, 1.1, 0.48);
      frigo.add(corpsFrigo, poignee);
      roomGroup.add(frigo);
      furnitureMeshes.set('frigo', frigo);

      // 2. Canapé cosy (id: 'canape')
      const canape = new THREE.Group();
      canape.position.set(1.8, 0, 1.0);
      const canapeAssise = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 2.4), new THREE.MeshLambertMaterial({ color: 0x9e5238 }));
      canapeAssise.position.set(0, 0.35, 0);
      const canapeDossier = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 2.4), new THREE.MeshLambertMaterial({ color: 0x8a452e }));
      canapeDossier.position.set(0.45, 0.7, 0);
      canape.add(canapeAssise, canapeDossier);
      roomGroup.add(canape);
      furnitureMeshes.set('canape', canape);

      // 3. Table familiale (id: 'table')
      const table = new THREE.Group();
      table.position.set(-1.0, 0, 0.5);
      const plateauT = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.3), matWood);
      plateauT.position.set(0, 0.75, 0);
      const piedT = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 6), matWoodDark);
      piedT.position.set(0, 0.37, 0);
      table.add(plateauT, piedT);
      roomGroup.add(table);
      furnitureMeshes.set('table', table);

      // 4. Poste Radio Vintage (id: 'radio')
      const radio = new THREE.Group();
      radio.position.set(-2.2, 0, -3.2);
      const meubleR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.6), matWoodDark);
      meubleR.position.set(0, 0.4, 0);
      const radioPoste = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.35), new THREE.MeshLambertMaterial({ color: 0xc27a40 }));
      radioPoste.position.set(0, 0.95, 0);
      const cadran = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), matLampGlow);
      cadran.position.set(0, 0.95, 0.18);
      radio.add(meubleR, radioPoste, cadran);
      const radioLight = new THREE.PointLight(COLOR_HYGGE_1800K, 0.8, 3.5);
      radioLight.position.set(-2.2, 1.1, -3.0);
      roomGroup.add(radioLight);
      warmAccentLights.push(radioLight);
      roomGroup.add(radio);
      furnitureMeshes.set('radio', radio);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // COLLÈGE
  // ─────────────────────────────────────────────────────────────
  else if (placeId === 'college') {
    if (roomId === 'classe') {
      // 1. Pupitre d'élève (id: 'pupitre')
      const pupitre = new THREE.Group();
      pupitre.position.set(0, 0, 1.0);
      const deskTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), matWood);
      deskTable.position.set(0, 0.75, 0);
      const deskPieds = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.7), matMetal);
      deskPieds.position.set(0, 0.37, 0);
      const bancEleve = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.35), matWoodDark);
      bancEleve.position.set(0, 0.25, 0.7);
      pupitre.add(deskTable, deskPieds, bancEleve);
      roomGroup.add(pupitre);
      furnitureMeshes.set('pupitre', pupitre);

      // 2. Grand Tableau de cours (id: 'tableau')
      const tableau = new THREE.Group();
      tableau.position.set(0, 1.8, -3.7);
      const surfaceNoire = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 0.08), new THREE.MeshLambertMaterial({ color: 0x243328 }));
      const cadreTab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 0.06), matWoodDark);
      cadreTab.position.z = -0.02;
      tableau.add(surfaceNoire, cadreTab);
      roomGroup.add(tableau);
      furnitureMeshes.set('tableau', tableau);

      // 3. Bureau de Mme Moreau (id: 'bureau_prof')
      const prof = new THREE.Group();
      prof.position.set(-2.0, 0, -2.0);
      const bureauProf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 1.1), matWoodDark);
      bureauProf.position.set(0, 0.42, 0);
      const lampeProf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.25, 6), matLampGlow);
      lampeProf.position.set(0.5, 0.98, -0.2);
      prof.add(bureauProf, lampeProf);
      const lightProf = new THREE.PointLight(COLOR_HYGGE_1800K, 0.9, 4.0);
      lightProf.position.set(-1.5, 1.2, -2.2);
      roomGroup.add(lightProf);
      warmAccentLights.push(lightProf);
      roomGroup.add(prof);
      furnitureMeshes.set('bureau_prof', prof);
    } else {
      // Cour & Préau
      // 1. Banc de la cour (id: 'banc_cour')
      const bancCour = new THREE.Group();
      bancCour.position.set(-2.0, 0, -2.0);
      const assise = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), matWood);
      assise.position.set(0, 0.45, 0);
      const pieds = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.5), matMetal);
      pieds.position.set(0, 0.22, 0);
      bancCour.add(assise, pieds);
      roomGroup.add(bancCour);
      furnitureMeshes.set('banc_cour', bancCour);

      // 2. Marelle & jeux (id: 'marelle')
      const marelle = new THREE.Group();
      marelle.position.set(1.0, 0.02, 0.5);
      const trace = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
      trace.rotation.x = -Math.PI / 2;
      marelle.add(trace);
      roomGroup.add(marelle);
      furnitureMeshes.set('marelle', marelle);

      // 3. Panneau du Préau (id: 'preau')
      const preau = new THREE.Group();
      preau.position.set(2.4, 0, -3.2);
      const panneauP = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.15), matWoodDark);
      panneauP.position.set(0, 1.6, 0);
      const piliers = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.1), matMetal);
      piliers.position.set(0, 0.9, 0);
      preau.add(panneauP, piliers);
      roomGroup.add(preau);
      furnitureMeshes.set('preau', preau);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ÉPICERIE
  // ─────────────────────────────────────────────────────────────
  else if (placeId === 'epicerie') {
    if (roomId === 'magasin') {
      // 1. Caisse Enregistreuse Rétro (id: 'caisse')
      const caisse = new THREE.Group();
      caisse.position.set(-2.0, 0, -1.8);
      const comptoir = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.0), matWoodDark);
      comptoir.position.set(0, 0.45, 0);
      const caisseMachine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0xd4af37 }));
      caisseMachine.position.set(0, 1.1, 0.2);
      caisse.add(comptoir, caisseMachine);
      const lightCaisse = new THREE.PointLight(COLOR_HYGGE_1800K, 0.9, 4.0);
      lightCaisse.position.set(-2.0, 1.4, -1.6);
      roomGroup.add(lightCaisse);
      warmAccentLights.push(lightCaisse);
      roomGroup.add(caisse);
      furnitureMeshes.set('caisse', caisse);

      // 2. Rayon Maraîcher Frais (id: 'rayonnage_frais')
      const rayon = new THREE.Group();
      rayon.position.set(2.0, 0, -2.4);
      const etal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.2), matWood);
      etal.position.set(0, 0.4, 0);
      const caissesLegumes = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.0), new THREE.MeshLambertMaterial({ color: COLOR_MOSS_GREEN }));
      caissesLegumes.position.set(0, 0.9, 0);
      rayon.add(etal, caissesLegumes);
      roomGroup.add(rayon);
      furnitureMeshes.set('rayonnage_frais', rayon);

      // 3. Meuble Vente en Vrac (id: 'bocal_vrac')
      const vrac = new THREE.Group();
      vrac.position.set(2.2, 0, 1.5);
      const etagereVrac = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 2.2), matWoodDark);
      etagereVrac.position.set(0, 1.1, 0);
      const bocaux = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.8), new THREE.MeshBasicMaterial({ color: 0x73eff7, transparent: true, opacity: 0.7 }));
      bocaux.position.set(0, 1.2, 0);
      vrac.add(etagereVrac, bocaux);
      roomGroup.add(vrac);
      furnitureMeshes.set('bocal_vrac', vrac);
    } else {
      // Réserve & Stock
      // 1. Palettes d'Arrivage (id: 'palette_stock')
      const palette = new THREE.Group();
      palette.position.set(-1.8, 0, -1.8);
      const boisPalette = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 2.0), new THREE.MeshLambertMaterial({ color: 0xb58a5c }));
      boisPalette.position.set(0, 0.12, 0);
      const cartons = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 1.7), new THREE.MeshLambertMaterial({ color: 0xc89e6c }));
      cartons.position.set(0, 0.85, 0);
      palette.add(boisPalette, cartons);
      roomGroup.add(palette);
      furnitureMeshes.set('palette_stock', palette);

      // 2. Livre de Comptes Fournisseurs (id: 'registre_fournisseurs')
      const registre = new THREE.Group();
      registre.position.set(2.0, 0, -2.0);
      const pupitreMetal = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.8), matMetal);
      pupitreMetal.position.set(0, 0.55, 0);
      const livre = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.5), matIvory);
      livre.position.set(0, 1.15, 0);
      registre.add(pupitreMetal, livre);
      const lightReg = new THREE.PointLight(COLOR_HYGGE_1800K, 0.75, 3.5);
      lightReg.position.set(2.0, 1.4, -2.0);
      roomGroup.add(lightReg);
      warmAccentLights.push(lightReg);
      roomGroup.add(registre);
      furnitureMeshes.set('registre_fournisseurs', registre);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FRICHE
  // ─────────────────────────────────────────────────────────────
  else if (placeId === 'friche') {
    if (roomId === 'atelier_principal') {
      // 1. Établi de Réparation (id: 'etabli')
      const etabli = new THREE.Group();
      etabli.position.set(-2.0, 0, -2.2);
      const plateauE = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.2), matWoodDark);
      plateauE.position.set(0, 0.8, 0);
      const etau = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), matMetal);
      etau.position.set(-1.0, 1.0, 0.4);
      const piedsE = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.0), matMetal);
      piedsE.position.set(0, 0.4, 0);
      etabli.add(plateauE, etau, piedsE);
      const lightEtabli = new THREE.PointLight(COLOR_HYGGE_1800K, 1.1, 5.0);
      lightEtabli.position.set(-2.0, 1.4, -2.0);
      roomGroup.add(lightEtabli);
      warmAccentLights.push(lightEtabli);
      roomGroup.add(etabli);
      furnitureMeshes.set('etabli', etabli);

      // 2. Tour & Machine d'usinage (id: 'tour_mecanique')
      const tour = new THREE.Group();
      tour.position.set(2.0, 0, -2.0);
      const corpsTour = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.0), new THREE.MeshLambertMaterial({ color: 0x3a3d40 }));
      corpsTour.position.set(0, 0.5, 0);
      const mandrin = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8), matMetal);
      mandrin.rotation.z = Math.PI / 2;
      mandrin.position.set(-0.4, 1.1, 0);
      tour.add(corpsTour, mandrin);
      roomGroup.add(tour);
      furnitureMeshes.set('tour_mecanique', tour);

      // 3. Panneau d'Outils (id: 'panneau_outils')
      const outils = new THREE.Group();
      outils.position.set(0, 1.8, -3.7);
      const panneauO = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 0.1), matWoodDark);
      const cles = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.08), matMetal);
      cles.position.z = 0.05;
      outils.add(panneauO, cles);
      roomGroup.add(outils);
      furnitureMeshes.set('panneau_outils', outils);
    } else {
      // Hangar de Récupération
      // 1. Bacs de Ferraille & Composants (id: 'tas_ferraille')
      const ferraille = new THREE.Group();
      ferraille.position.set(-2.0, 0, -2.0);
      const bac1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.4), matMetal);
      bac1.position.set(0, 0.35, 0);
      const bobines = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xd47535 }));
      bobines.position.set(0.2, 0.8, 0);
      ferraille.add(bac1, bobines);
      roomGroup.add(ferraille);
      furnitureMeshes.set('tas_ferraille', ferraille);

      // 2. Banc de Diagnostic (id: 'banc_diagnostic')
      const diag = new THREE.Group();
      diag.position.set(2.0, 0, -2.0);
      const tableDiag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 1.0), matWoodDark);
      tableDiag.position.set(0, 0.42, 0);
      const oscillo = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), matMetal);
      oscillo.position.set(0, 1.05, 0);
      const ecranVert = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ color: 0x55ff66 }));
      ecranVert.position.set(0, 1.05, 0.21);
      diag.add(tableDiag, oscillo, ecranVert);
      const lightDiag = new THREE.PointLight(0x55ff66, 0.8, 3.5);
      lightDiag.position.set(2.0, 1.2, -1.8);
      roomGroup.add(lightDiag);
      warmAccentLights.push(lightDiag);
      roomGroup.add(diag);
      furnitureMeshes.set('banc_diagnostic', diag);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PARC
  // ─────────────────────────────────────────────────────────────
  else if (placeId === 'parc') {
    if (roomId === 'allees') {
      const banc = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.6), matWood);
      banc.position.set(-2.0, 0.25, -2.0);
      const fontaine = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.6, 8), matStone);
      fontaine.position.set(1.5, 0.3, 0);
      roomGroup.add(banc, fontaine);
      furnitureMeshes.set('banc_anciens', banc);
      furnitureMeshes.set('fontaine_parc', fontaine);
    } else {
      const rampe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.5), matWood);
      rampe.position.set(-1.8, 0.4, -1.8);
      const kiosque = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 6), matWoodDark);
      kiosque.position.set(1.8, 0.6, 0);
      roomGroup.add(rampe, kiosque);
      furnitureMeshes.set('rampe_skate', rampe);
      furnitureMeshes.set('estrade_kiosque', kiosque);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PLACE DU MARCHÉ
  // ─────────────────────────────────────────────────────────────
  else if (placeId === 'place') {
    if (roomId === 'halle') {
      const etal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.4), matWood);
      etal.position.set(-1.8, 0.4, -1.8);
      const panneau = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.15), matWoodDark);
      panneau.position.set(2.0, 1.2, -3.2);
      roomGroup.add(etal, panneau);
      furnitureMeshes.set('etal_marche', etal);
      furnitureMeshes.set('panneau_annonces', panneau);
    } else {
      const estrade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.0), matWoodDark);
      estrade.position.set(-1.5, 0.2, -1.5);
      const urne = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), matIvory);
      urne.position.set(2.0, 0.4, -2.0);
      roomGroup.add(estrade, urne);
      furnitureMeshes.set('estrade_debat', estrade);
      furnitureMeshes.set('urne_citoyenne', urne);
    }
  }

  // Repli générique si d'autres meubles sont déclarés dans INTERIOR_PLACES
  const currentRoomDef = INTERIOR_PLACES[placeId]?.rooms.find((r) => r.id === roomId);
  if (currentRoomDef) {
    let offsetIdx = 0;
    for (const furn of currentRoomDef.furniture) {
      if (!furnitureMeshes.has(furn.id)) {
        const genericProp = new THREE.Group();
        genericProp.position.set((offsetIdx % 3) * 1.8 - 1.8, 0, Math.floor(offsetIdx / 3) * 1.8 - 1.8);
        const propMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), matWood);
        propMesh.position.y = 0.4;
        genericProp.add(propMesh);
        roomGroup.add(genericProp);
        furnitureMeshes.set(furn.id, genericProp);
        offsetIdx++;
      }
    }
  }
}
