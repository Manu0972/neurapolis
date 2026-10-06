// src/rendering/ThreeIsoRenderer.ts
import * as THREE from 'three';
import { WorldBuilder } from './WorldBuilder';
import type { WorldRenderer } from './WorldRenderer';
import type { Block3D, GroundTile, World3D } from './world3d';

const WORLD_GROUP_NAME = 'WorldGroup';

/**
 * Calcule un identifiant déterministe d'un monde 3D à partir de ses tuiles de sol
 * et de ses blocs. On l'utilise en dirty-check : tant que le monde ne change pas,
 * on ne reconstruit pas la scène (LOI 2 — pas de travail GPU inutile par frame).
 */
function hashWorld(world: World3D): string {
  let h = world.ground.length.toString(36) + '|' + world.blocks.length.toString(36);
  // Petit échantillon borné pour tracer un changement réel (grille 48×32 → coût borné).
  const groundStep = Math.max(1, Math.floor(world.ground.length / 128));
  for (let i = 0; i < world.ground.length; i += groundStep) {
    const t: GroundTile | undefined = world.ground[i];
    if (t) h += ';' + t.x.toString(36) + ',' + t.z.toString(36);
  }
  const blockStep = Math.max(1, Math.floor(world.blocks.length / 128));
  for (let i = 0; i < world.blocks.length; i += blockStep) {
    const b: Block3D | undefined = world.blocks[i];
    if (b) {
      h += '#' + b.x.toString(36) + ',' + b.y.toString(36) + ',' + b.z.toString(36) +
        ',' + b.w.toString(36) + ',' + b.h.toString(36) + ',' + b.d.toString(36) +
        ':' + (b.role ?? '');
    }
  }
  return h;
}

export class ThreeIsoRenderer implements WorldRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private container!: HTMLElement;
  private lastWorldHash = '';
  private hasBuiltWorld = false;

  public init(container: HTMLElement): void {
    this.container = container;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scène principale
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1a1016'); // Fond teinté chaud conforme à la DA

    // 2. Caméra Orthographique Isométrique 2:1
    const aspect = width / height;
    const d = 10; // Facteur d'échelle / zoom initial de la vue
    this.camera = new THREE.OrthographicCamera(
      -d * aspect, d * aspect,
      d, -d,
      0.1, 1000
    );

    // Orientation isométrique standard (Angle 2:1)
    // Rotation X d'environ 35.264° (ou atan(1/sqrt(2))) et Y de 45°
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.order = 'YXZ';

    // 3. WebGL Renderer avec gestion du pixel-perfect
    this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Désactivé pour préserver le pixel art
    this.renderer.setSize(width, height);
    // LOI 2 — integerScale strict : pixelRatio doit être un entier (1 ou 2)
    // afin d'éviter tout flou bilinéaire / sous-échantillonnage non entier
    const rawDpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(rawDpr >= 1.5 ? 2 : 1);
    
    // Ajout du canvas au DOM
    container.appendChild(this.renderer.domElement);

    // Éclairage de base (Ambiance ambrée + ombres violettes)
    const ambientLight = new THREE.AmbientLight(0xffd98a, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x5a4a78, 1.2);
    directionalLight.position.set(20, 40, 20);
    this.scene.add(directionalLight);
  }

  public render(world: World3D, width: number, height: number, now: number): void {
    // Redimensionnement dynamique si le conteneur change
    if (this.renderer.domElement.clientWidth !== width || this.renderer.domElement.clientHeight !== height) {
      this.renderer.setSize(width, height);
      const aspect = width / height;
      const d = 10;
      this.camera.left = -d * aspect;
      this.camera.right = d * aspect;
      this.camera.top = d;
      this.camera.bottom = -d;
      this.camera.updateProjectionMatrix();
    }

    // Dirty-check World3D : on ne reconstruit la scène que si les données varient.
    // buildWorld appartient au pipeline de ZCode (J3D-2) ; on le consomme ici en
    // calque passif (LOI 1 — aucune réécriture de la simulation).
    const hash = hashWorld(world);
    if (!this.hasBuiltWorld || hash !== this.lastWorldHash) {
      WorldBuilder.buildWorld(this.scene, world);
      this.lastWorldHash = hash;
      this.hasBuiltWorld = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}