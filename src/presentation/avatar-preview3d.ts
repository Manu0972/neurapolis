/**
 * Aperçu 3D du personnage (création, armoire) : le vrai modèle du jeu, qui tourne lentement
 * sur un socle ; on peut le faire pivoter en glissant. Repli : renvoie null sans WebGL.
 */
import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../core/types';
import { createCharacter, type Character3D } from './city3d/simpleCharacter';

export interface AvatarPreview {
  canvas: HTMLCanvasElement;
  setAppearance(a: PlayerAppearance, gender?: PlayerGender, heightM?: number): void;
  dispose(): void;
}

export function createAvatarPreview(width = 240, height = 300): AvatarPreview | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'avatar-preview-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Aperçu 3D de ton personnage');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
  camera.position.set(0, 1.15, 3.6);
  camera.lookAt(0, 0.9, 0);
  scene.add(new THREE.HemisphereLight('#fff4e0', '#5a4636', 1.4));
  const key = new THREE.DirectionalLight('#fff1d8', 2.2);
  key.position.set(1.5, 3, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9fc3dc', 0.9);
  rim.position.set(-2, 2, -2);
  scene.add(rim);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.06, 32), new THREE.MeshStandardMaterial({ color: '#e8d6b0', roughness: 0.9 }));
  plinth.position.y = -0.03;
  plinth.receiveShadow = true;
  scene.add(plinth);

  let ch: Character3D | undefined;
  // Face au joueur, avec une légère oscillation ; le glisser fait pivoter librement.
  let yaw = 0;
  let t = 0;
  let sway = 1;
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; yaw += (e.clientX - lastX) * 0.012; lastX = e.clientX; sway = 0; });
  canvas.addEventListener('pointerup', () => { dragging = false; });

  let last = performance.now();
  let raf = 0;
  let shown = false;
  const loop = (now: number): void => {
    // Fenêtre fermée (croix, Échap) : l'aperçu s'arrête et libère la carte graphique.
    if (canvas.isConnected) shown = true;
    else if (shown) { cancelAnimationFrame(raf); ch?.dispose(); renderer.dispose(); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (ch) {
      ch.setHeading(Math.PI + yaw + Math.sin(t * 0.6) * 0.45 * sway);
      ch.update(dt, 0);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    canvas,
    setAppearance(a, gender, heightM = 1.52): void {
      ch?.dispose();
      ch = createCharacter({ appearance: a, gender, heightM });
      ch.root.traverse((o) => { o.castShadow = true; });
      // Face au joueur tout de suite (sans attendre l'animation).
      ch.setHeading(Math.PI + yaw);
      for (let i = 0; i < 40; i++) ch.update(0.05, 0);
      scene.add(ch.root);
      // Cadrage : la caméra suit la taille du personnage.
      camera.position.set(0, heightM * 0.68, 3.4 * (heightM / 1.6));
      camera.lookAt(0, heightM * 0.56, 0);
      renderer.render(scene, camera);
    },
    dispose(): void {
      cancelAnimationFrame(raf);
      ch?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
