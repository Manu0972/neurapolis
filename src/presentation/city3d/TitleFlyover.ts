/**
 * Survol de Val-Ferrand derrière l'écran titre : la caméra tourne lentement autour de la place
 * du Marché à l'heure dorée, voitures et passants en mouvement. Aucune dépendance au monde de
 * jeu (pas de partie chargée) ; libéré dès que la partie commence.
 */
import * as THREE from 'three';
import { CITY } from '../../data/city/layout';
import { buildCityScene, type CityScene } from './cityScene';
import { createSkyDome, skyAt } from './sky';
import { createAmbient, type Ambient } from './ambient';

export class TitleFlyover {
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.5, 1500);
  private city?: CityScene;
  private ambient?: Ambient;
  private raf = 0;
  private last = performance.now();
  private angle = 0.6;
  private readonly center: THREE.Vector3;

  constructor(private canvas: HTMLCanvasElement) {
    const place = CITY.blocks.find((b) => b.name === 'Place du Marché') ?? CITY.blocks[0]!;
    this.center = new THREE.Vector3(place.x + place.w / 2, 0, place.y + place.h / 2);
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = true;
    } catch {
      this.renderer = undefined;
      return;
    }
    this.city = buildCityScene();
    this.scene.add(this.city.group);
    // Heure dorée : 18 h 20, beau temps.
    const s = skyAt(18.33, 'soleil');
    const sky = createSkyDome();
    sky.update(s);
    this.scene.add(sky.mesh);
    const hemi = new THREE.HemisphereLight(s.hemiSky, s.hemiGround, s.hemiIntensity);
    const sun = new THREE.DirectionalLight(s.sunColor, s.sunIntensity);
    sun.position.copy(this.center).addScaledVector(s.sunDir, 200);
    sun.target.position.copy(this.center);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -120; sc.right = 120; sc.top = 120; sc.bottom = -120; sc.far = 500;
    this.scene.add(hemi, sun, sun.target);
    this.scene.fog = new THREE.Fog(s.fogColor, 120, 520);
    for (const { mat, strength } of this.city.nightMaterials) mat.emissiveIntensity = Math.max(0.15, s.night) * strength;
    this.ambient = createAmbient({ cars: 22, pedestrians: 26 });
    this.scene.add(this.ambient.group);
    sky.mesh.position.copy(this.center);
    this.loop();
  }

  get available(): boolean { return !!this.renderer; }

  private loop = (): void => {
    if (!this.renderer) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.angle += dt * 0.04;
    const r = 95;
    this.camera.position.set(this.center.x + Math.cos(this.angle) * r, 42, this.center.z + Math.sin(this.angle) * r);
    this.camera.lookAt(this.center.x, 4, this.center.z);
    this.ambient?.update(dt, { x: -999, z: -999 }, 0.1);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.ambient?.dispose();
    this.city?.dispose();
    this.renderer?.dispose();
    this.renderer = undefined;
  }
}
