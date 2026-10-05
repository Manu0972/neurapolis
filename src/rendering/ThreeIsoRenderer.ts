// src/rendering/ThreeIsoRenderer.ts
import * as THREE from 'three';
import type { WorldRenderer } from './WorldRenderer';
import type { World3D } from './world3d';

export class ThreeIsoRenderer implements WorldRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private container!: HTMLElement;

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
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

    // Ici sera injectée l'instanciation des blocs 3D issus de world3d.ts
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}