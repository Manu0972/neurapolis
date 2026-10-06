import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createCharacter, type CharacterSpec } from '../src/presentation/city3d/characters';

describe('Character3D Engine', () => {
  it('crée un personnage avec la hiérarchie Three.js attendue et les pieds à y = 0', () => {
    const spec: CharacterSpec = { heightM: 1.55 };
    const char = createCharacter(spec);

    expect(char.root).toBeInstanceOf(THREE.Group);
    expect(char.root.children.length).toBeGreaterThan(0);

    // Bounding Box
    const bbox = new THREE.Box3().setFromObject(char.root);
    expect(bbox.min.y).toBeCloseTo(0, 1);

    char.dispose();
  });

  it('respecte la hauteur demandée (heightM) à ±5 %', () => {
    const targetHeights = [1.55, 1.75, 1.20];

    for (const h of targetHeights) {
      const char = createCharacter({ heightM: h });
      const bbox = new THREE.Box3().setFromObject(char.root);
      const measuredHeight = bbox.max.y - bbox.min.y;

      const deltaRatio = Math.abs(measuredHeight - h) / h;
      expect(deltaRatio).toBeLessThanOrEqual(0.05);

      char.dispose();
    }
  });

  it('fait bouger les jambes lors de update() en marche mais pas au repos', () => {
    const char = createCharacter({ heightM: 1.55 });

    const modelGroup = char.root.getObjectByName('model_group') as THREE.Group;
    const jambeG = modelGroup.getObjectByName('jambeG') as THREE.Group;
    const jambeD = modelGroup.getObjectByName('jambeD') as THREE.Group;

    expect(jambeG).toBeDefined();
    expect(jambeD).toBeDefined();

    // Au repos (speed = 0)
    char.update(0.1, 0);
    const initialRotG = jambeG.rotation.x;
    const initialRotD = jambeD.rotation.x;

    char.update(0.1, 0);
    expect(jambeG.rotation.x).toBeCloseTo(initialRotG, 4);
    expect(jambeD.rotation.x).toBeCloseTo(initialRotD, 4);

    // En marche (speed = 1.6 m/s)
    let moved = false;
    for (let i = 0; i < 5; i++) {
      char.update(0.1, 1.6);
      if (Math.abs(jambeG.rotation.x - initialRotG) > 0.05) {
        moved = true;
        break;
      }
    }
    expect(moved).toBe(true);

    char.dispose();
  });

  it('génère des géométries de cheveux différentes pour chaque hairStyle', () => {
    const styles = ['court', 'mi-long', 'boucle', 'tresse', 'couettes'] as const;
    const hairFingerprints = new Set<string>();

    for (const hairStyle of styles) {
      const char = createCharacter({
        appearance: {
          skinTone: 'claire',
          hairColor: 'brun',
          hairStyle,
          outfitStyle: 'ecolier',
          outfitColor: 'denim',
        },
      });

      const hairGroup = char.root.getObjectByName('hair') as THREE.Group;
      expect(hairGroup).toBeDefined();

      // Empreinte basée sur le nombre d'enfants et le type de leurs géométries/positions
      let fingerprint = `${hairGroup.children.length}:`;
      hairGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          fingerprint += `${child.geometry.type}_${child.position.x.toFixed(2)}_${child.position.y.toFixed(2)};`;
        }
      });

      hairFingerprints.add(fingerprint);
      char.dispose();
    }

    // Chaque style parmi les 5 doit produire une structure/empreinte unique
    expect(hairFingerprints.size).toBe(5);
  });

  it('ne produit aucun NaN après 10 000 appels à update() à des vitesses variées', () => {
    const char = createCharacter({ heightM: 1.60 });

    for (let i = 0; i < 10000; i++) {
      const dt = 0.016; // ~60fps
      const speed = (i % 300) / 50; // vitesses de 0 à 6 m/s
      char.update(dt, speed);

      if (i % 500 === 0) {
        char.setHeading((i * 0.01) % (Math.PI * 2));
      }
    }

    // Vérifier l'absence de NaN dans les rotations/positions principales
    expect(isNaN(char.root.rotation.y)).toBe(false);
    expect(isNaN(char.root.position.x)).toBe(false);

    const modelGroup = char.root.getObjectByName('model_group') as THREE.Group;
    const jambeG = modelGroup.getObjectByName('jambeG') as THREE.Group;
    expect(isNaN(jambeG.rotation.x)).toBe(false);

    char.dispose();
  });

  it('converge l’orientation avec setHeading() de manière fluide', () => {
    const char = createCharacter({ heightM: 1.55 });
    char.setHeading(Math.PI / 2);

    // Plusieurs updates pour lisser le cap
    for (let i = 0; i < 20; i++) {
      char.update(0.016, 1.0);
    }

    expect(char.root.rotation.y).toBeCloseTo(Math.PI / 2, 1);
    char.dispose();
  });

  it('dispose() retire proprement le personnage sans lever d’erreur', () => {
    const parent = new THREE.Group();
    const char = createCharacter({ heightM: 1.55 });
    parent.add(char.root);

    expect(parent.children.length).toBe(1);
    char.dispose();
    expect(parent.children.length).toBe(0);
  });
});
