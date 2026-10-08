/**
 * Labo VRM (outil de développement) : affiche des modèles VRM (style anime, shader MToon) en
 * rangée, bras le long du corps. `?files=a.vrm,b.vrm&dir=/_vroid_tmp/` ; `?zoom=1` pour les visages.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';

const params = new URLSearchParams(location.search);
const dir = params.get('dir') ?? '/_vroid_tmp/';
const files = (params.get('files') ?? '').split(',').filter(Boolean);
const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#efe9df');
const camera = new THREE.PerspectiveCamera(params.get('zoom') ? 14 : 24, W / H, 0.1, 50);
const light = new THREE.DirectionalLight('#ffffff', Math.PI);
light.position.set(1, 1.5, 2);
scene.add(light, new THREE.AmbientLight('#ffffff', 0.6));

const loader = new GLTFLoader();
loader.register((p) => new VRMLoaderPlugin(p));
const vrms: VRM[] = [];
const gap = 0.75;
for (const [i, f] of files.entries()) {
  const gltf = await loader.loadAsync(dir + f);
  const vrm = gltf.userData.vrm as VRM;
  VRMUtils.rotateVRM0(vrm);
  vrm.scene.position.x = (i - (files.length - 1) / 2) * gap;
  // Bras le long du corps (pose de repos plus naturelle que le T).
  const h = vrm.humanoid;
  h.getNormalizedBoneNode('leftUpperArm')?.rotation.set(0, 0, 1.2);
  h.getNormalizedBoneNode('rightUpperArm')?.rotation.set(0, 0, -1.2);
  h.getNormalizedBoneNode('leftLowerArm')?.rotation.set(0, -0.15, 0);
  h.getNormalizedBoneNode('rightLowerArm')?.rotation.set(0, 0.15, 0);
  scene.add(vrm.scene);
  vrms.push(vrm);
}
const span = Math.max(1.2, files.length * gap);
if (params.get('zoom')) { camera.position.set(0, 1.42, span * 2.6); camera.lookAt(0, 1.42, 0); }
else { camera.position.set(0, 0.9, span * 1.75); camera.lookAt(0, 0.82, 0); }
for (const v of vrms) v.update(0.016);
renderer.render(scene, camera);
(window as unknown as { labReady: boolean }).labReady = true;
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (const v of vrms) v.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
