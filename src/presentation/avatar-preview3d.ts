/**
 * Aperçu 3D du personnage (création, armoire) : le vrai modèle du jeu, qui tourne lentement
 * sur un socle ; on peut le faire pivoter en glissant. Repli : renvoie null sans WebGL.
 */
import { playerRigModel } from './city3d/rigged/playerModel';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { PlayerAppearance, PlayerGender } from '../core/types';
import { createCharacter, type Character3D } from './city3d/simpleCharacter';
import { loadRigAsset } from './city3d/rigged/library';
import type { RigModelEntry } from './city3d/rigged/manifest';
import { frameAvatar } from './avatar-framing';

export interface AvatarPreview {
  canvas: HTMLCanvasElement;
  setAppearance(a: PlayerAppearance, gender?: PlayerGender, heightM?: number): void;
  dispose(): void;
}

/** Petite tache de sol douce (dégradé radial) : remplace le socle en cylindre qui faisait un « fond jaune ». */
function groundBlob(): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(120, 88, 56, 0.34)');
    grad.addColorStop(0.55, 'rgba(120, 88, 56, 0.14)');
    grad.addColorStop(1, 'rgba(120, 88, 56, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.8, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  return m;
}

/** Style du cadre de l'aperçu (injecté ici : créateur, armoire et tout autre appelant l'obtiennent). */
function ensurePreviewStyles(): void {
  if (document.getElementById('avatar-preview-css')) return;
  const css = document.createElement('style');
  css.id = 'avatar-preview-css';
  css.textContent = `
  .avatar-preview-canvas { box-sizing: border-box; width: 100%; max-width: 240px; height: auto; display: block; margin: 0 auto; cursor: grab; touch-action: none; user-select: none; border-radius: 16px; border: 2px solid #3c2a20; overflow: hidden; background: radial-gradient(ellipse at 50% 38%, #fff7e6 0%, #efe0c2 55%, #d9c29a 100%); box-shadow: 0 3px 8px rgba(60, 42, 32, 0.18); }
  .avatar-preview-canvas:active { cursor: grabbing; }
  `;
  document.head.appendChild(css);
}

export function createAvatarPreview(width = 240, height = 300): AvatarPreview | null {
  let renderer: THREE.WebGLRenderer;
  try {
    // Fond transparent : le dégradé crème/bois est dans le CSS (rayon de bordure net, aucun halo).
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  } catch {
    return null;
  }
  // Net en 1x comme en 2x : on rend au moins en 2x (suréchantillonnage) et au plus en 2x.
  renderer.setPixelRatio(Math.min(2, Math.max(2, window.devicePixelRatio || 1)));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft est retiré de three r18x (avertissement en console)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  ensurePreviewStyles();
  const canvas = renderer.domElement;
  canvas.className = 'avatar-preview-canvas';
  canvas.style.aspectRatio = `${width} / ${height}`;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Aperçu 3D de ton personnage');

  const aspect = width / height;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 20);
  const fr0 = frameAvatar(1.52, aspect);
  camera.position.set(0, fr0.camY, fr0.camZ);
  camera.lookAt(0, fr0.lookY, 0);
  // Lumière chaude et douce, sans lumière de contour colorée (pas d'anneau parasite).
  scene.add(new THREE.HemisphereLight('#fff4e0', '#8a7058', 1.5));
  const key = new THREE.DirectionalLight('#fff1d8', 1.9);
  key.position.set(1.5, 3, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.2; key.shadow.camera.right = 1.2;
  key.shadow.camera.top = 2.4; key.shadow.camera.bottom = -0.6;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#f3e2c4', 0.5);
  fill.position.set(-2, 1.5, 2);
  scene.add(fill);
  scene.add(groundBlob());
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.22 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.receiveShadow = true;
  scene.add(catcher);

  let ch: Character3D | undefined;
  // Face au joueur, avec une légère oscillation ; le glisser fait pivoter librement.
  let yaw = 0;
  let yawShown = 0; // yaw lissé : rotation fluide, avec inertie après le glisser
  let t = 0;
  let sway = 1;
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; yaw += (e.clientX - lastX) * 0.012; lastX = e.clientX; sway = 0; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
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
      yawShown += (yaw - yawShown) * (1 - Math.exp(-dt * 10));
      ch.setHeading(Math.PI + yawShown + Math.sin(t * 0.6) * 0.45 * sway);
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
      // Silhouette : celle de l'apparence (v26), sinon la préférence de l'appareil, sinon le dessin.
      ch = createCharacter({ appearance: a, gender, heightM, rig: { key: 'joueur', role: 'joueur', age: 12, model: playerRigModel() }, rigRecolor: 'joueur' });
      ch.root.traverse((o) => { o.castShadow = true; o.receiveShadow = false; });
      // Face au joueur tout de suite (sans attendre l'animation).
      ch.setHeading(Math.PI + yaw);
      for (let i = 0; i < 40; i++) ch.update(0.05, 0);
      scene.add(ch.root);
      // Cadrage : personnage entier (tête et pieds), centré ; la caméra suit la taille.
      const fr = frameAvatar(heightM, aspect);
      camera.position.set(0, fr.camY, fr.camZ);
      camera.lookAt(0, fr.lookY, 0);
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

// ---------- Vignettes des silhouettes (sélecteur du créateur et de l'armoire) ----------

const thumbs = new Map<string, Promise<string | null>>();
let thumbRenderer: THREE.WebGLRenderer | null = null;
let thumbUsers = 0;

/**
 * Vignette d'une silhouette (couleurs d'origine, pose de repos, de face) en image `data:`.
 * Mise en cache par modèle ; un seul petit moteur de rendu partagé, libéré après la dernière vignette.
 * `null` sans WebGL ou si le modèle ne se charge pas.
 */
export function rigThumbnail(entry: RigModelEntry, width = 84, height = 112): Promise<string | null> {
  const k = `${entry.id}@${width}x${height}`;
  let p = thumbs.get(k);
  if (!p) {
    p = renderThumb(entry, width, height);
    thumbs.set(k, p);
  }
  return p;
}

async function renderThumb(entry: RigModelEntry, width: number, height: number): Promise<string | null> {
  const asset = await loadRigAsset(entry);
  if (!asset) return null;
  thumbUsers++;
  try {
    if (!thumbRenderer) {
      thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
      thumbRenderer.setClearColor(0x000000, 0);
    }
    const r = thumbRenderer;
    r.setPixelRatio(2);
    r.setSize(width, height, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4e0', '#8a7058', 1.6));
    const key = new THREE.DirectionalLight('#fff1d8', 1.8);
    key.position.set(1.2, 2.5, 3);
    scene.add(key);
    const model = cloneSkinned(asset.template);
    const pivot = new THREE.Group();
    pivot.position.y = -asset.minY;
    pivot.add(model);
    scene.add(pivot);
    // Pose de repos (bras le long du corps) plutôt que la pose en T du fichier.
    const idle = asset.clips.get('idle');
    const mixer = idle ? new THREE.AnimationMixer(model) : null;
    if (mixer && idle) { mixer.clipAction(idle).play(); mixer.update(0.4); }
    const aspect = width / height;
    const fr = frameAvatar(asset.height, aspect, 30, 0.06);
    const cam = new THREE.PerspectiveCamera(30, aspect, 0.05, 20);
    cam.position.set(0, fr.camY, fr.camZ);
    cam.lookAt(0, fr.lookY, 0);
    r.render(scene, cam);
    const url = r.domElement.toDataURL('image/png');
    mixer?.stopAllAction();
    model.traverse((o) => { (o as THREE.SkinnedMesh).skeleton?.dispose(); });
    return url;
  } catch {
    return null;
  } finally {
    thumbUsers--;
    // Plus aucune vignette en cours : on rend le contexte WebGL (ils sont limités par page).
    if (thumbUsers === 0) setTimeout(() => {
      if (thumbUsers === 0 && thumbRenderer) { thumbRenderer.dispose(); thumbRenderer.forceContextLoss(); thumbRenderer = null; }
    }, 1500);
  }
}
