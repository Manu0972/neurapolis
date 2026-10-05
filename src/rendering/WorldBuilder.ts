// src/rendering/WorldBuilder.ts
import * as THREE from 'three';
import type { World3D } from './world3d';

export class WorldBuilder {
  /**
   * Reconstruit ou met à jour les meshs 3D dans la scène Three.js
   * en fonction des données logiques du monde.
   */
  public static buildWorld(scene: THREE.Scene, world: World3D): void {
    // Nettoyage des anciens éléments de décors s'ils existent déjà
    const existingGroup = scene.getObjectByName('WorldGroup');
    if (existingGroup) {
      scene.remove(existingGroup);
    }

    const worldGroup = new THREE.Group();
    worldGroup.name = 'WorldGroup';

    // Matériaux de base respectant la palette DA (Brun chaud #2a1a14 pour les contours, teintes ambrées/terre)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3e2723 }); // Terre/Sol de base
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a78 });   // Ombres froides / Murs
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });   // Toits clairs

    // 1. Instanciation du Sol (basé sur la grille 48x32)
    if (world.ground && world.ground.length > 0) {
      const tileSize = 1;
      const geom = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
      
      for (const tile of world.ground) {
        const mesh = new THREE.Mesh(geom, groundMaterial);
        // Positionnement isométrique sur le plan XZ
        mesh.position.set(tile.x + 0.5, -0.05, tile.z + 0.5);
        worldGroup.add(mesh);
      }
    }

    // 2. Instanciation des Blocs / Bâtiments 3D
    if (world.blocks && world.blocks.length > 0) {
      for (const block of world.blocks) {
        const geom = new THREE.BoxGeometry(block.w, block.h, block.d);
        
        // Choix du matériau selon le rôle du bloc
        let mat = wallMaterial;
        if (block.role === 'toit') {
          mat = roofMaterial;
        }

        const mesh = new THREE.Mesh(geom, mat);
        // Positionnement (centré sur le bloc en 3D)
        mesh.position.set(
          block.x + block.w / 2,
          block.y + block.h / 2,
          block.z + block.d / 2
        );
        worldGroup.add(mesh);
      }
    }

    scene.add(worldGroup);
  }
}