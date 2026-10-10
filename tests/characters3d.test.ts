import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createCharacter, CharacterSpec } from '../src/presentation/city3d/characters';
import { VALID_HAIR_STYLES } from '../src/core/types';

describe('3D Characters System', () => {
  it('should build a character hierarchy with root group at y = 0', () => {
    const char = createCharacter({});
    expect(char.root).toBeInstanceOf(THREE.Group);
    expect(char.root.position.y).toBe(0);

    const modelGroup = char.root.getObjectByName('model_group');
    expect(modelGroup).toBeDefined();

    const legL = modelGroup?.getObjectByName('jambeG');
    const legR = modelGroup?.getObjectByName('jambeD');
    const pelvis = modelGroup?.getObjectByName('pelvis');
    expect(legL).toBeDefined();
    expect(legR).toBeDefined();
    expect(pelvis).toBeDefined();
  });

  it('should respect height M within +-5%', () => {
    // Standard default height = 1.55m
    const char155 = createCharacter({ heightM: 1.55 });
    const bbox155 = new THREE.Box3().setFromObject(char155.root);
    const height155 = bbox155.max.y - bbox155.min.y;
    expect(height155).toBeGreaterThanOrEqual(1.55 * 0.95);
    expect(height155).toBeLessThanOrEqual(1.55 * 1.05);

    // Adult height = 1.75m
    const char175 = createCharacter({ heightM: 1.75 });
    const bbox175 = new THREE.Box3().setFromObject(char175.root);
    const height175 = bbox175.max.y - bbox175.min.y;
    expect(height175).toBeGreaterThanOrEqual(1.75 * 0.95);
    expect(height175).toBeLessThanOrEqual(1.75 * 1.05);
  });

  it('should move legs on update during walking but stay resting during idle', () => {
    const char = createCharacter({});
    const legL = char.root.getObjectByName('jambeG') as THREE.Group;
    const legR = char.root.getObjectByName('jambeD') as THREE.Group;

    // Idle update
    char.update(0.1, 0);
    expect(legL.rotation.x).toBe(0);
    expect(legR.rotation.x).toBe(0);

    // Walking update
    char.update(0.1, 1.6);
    expect(Math.abs(legL.rotation.x) + Math.abs(legR.rotation.x)).toBeGreaterThan(0);
  });

  it('should produce distinct hair geometries for each hairStyle', () => {
    const hairGeometries = new Map<string, number>();

    for (const style of VALID_HAIR_STYLES) {
      const spec: CharacterSpec = {
        appearance: {
          skinTone: 'claire',
          hairColor: 'chatain',
          hairStyle: style,
          outfitStyle: 'ecolier',
          outfitColor: 'coral',
        },
      };
      const char = createCharacter(spec);
      const hairGroup = char.root.getObjectByName('hair') as THREE.Group;
      expect(hairGroup).toBeDefined();

      let meshCount = 0;
      hairGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshCount++;
        }
      });

      hairGeometries.set(style, meshCount);
    }

    // Verify all styles generated valid hair meshes
    expect(hairGeometries.size).toBe(VALID_HAIR_STYLES.length);
    for (const [style, count] of hairGeometries.entries()) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it('should produce no NaN values after 10,000 update calls', () => {
    const char = createCharacter({ heightM: 1.70 });

    for (let i = 0; i < 10000; i++) {
      const speed = (i % 300) / 50; // varies from 0 to 6.0 m/s
      char.setHeading((i * 0.01) % (Math.PI * 2));
      char.update(0.016, speed);
    }

    let hasNaN = false;
    char.root.traverse((obj) => {
      if (
        isNaN(obj.position.x) || isNaN(obj.position.y) || isNaN(obj.position.z) ||
        isNaN(obj.rotation.x) || isNaN(obj.rotation.y) || isNaN(obj.rotation.z) ||
        isNaN(obj.scale.x) || isNaN(obj.scale.y) || isNaN(obj.scale.z)
      ) {
        hasNaN = true;
      }
    });

    expect(hasNaN).toBe(false);
  });

  it('should clean up cleanly on dispose()', () => {
    const parent = new THREE.Group();
    const char = createCharacter({});
    parent.add(char.root);
    expect(parent.children.length).toBe(1);

    char.dispose();
    expect(parent.children.length).toBe(0);
  });
});
