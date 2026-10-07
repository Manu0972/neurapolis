/**
 * Labo des personnages (outil de développement, `npx vite` puis /tools/rig-lab/) : une rangée de
 * personnages « maison » de tous âges et toutes silhouettes, et des boutons pour jouer chaque
 * animation. Sert à vérifier le rendu et à mettre au point de nouveaux gestes.
 */
import * as THREE from 'three';
import { generateLook, heightAtAge } from '../../src/core/human_variety';
import type { PlayerAppearance } from '../../src/core/types';
import { loadAnimLibrary } from '../../src/presentation/city3d/rig/animLibrary';
import { createRigCharacter, type RigCharacter } from '../../src/presentation/city3d/rig/rigCharacter';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d9cbb4');
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(0, 1.3, 7.5);
camera.lookAt(0, 0.95, 0);
scene.add(new THREE.HemisphereLight('#fff4e0', '#5a4636', 1.5));
const sun = new THREE.DirectionalLight('#fff1d8', 2.2);
sun.position.set(2, 4, 3);
sun.castShadow = true;
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#b9a98c' }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const params = new URLSearchParams(location.search);
const chars: RigCharacter[] = [];
// Le labo n'est pas à la racine du site : chemin absolu vers le fichier d'animations.
(globalThis as { __NEURAPOLIS_ASSETS__?: Record<string, string> }).__NEURAPOLIS_ASSETS__ = { 'anim/neurapolis_anims.glb': '/assets/anim/neurapolis_anims.glb' };
const lib = await loadAnimLibrary();
if (!lib) throw new Error('Bibliothèque d’animations introuvable.');

// Une rangée : enfant de 12 ans, ados, adultes variés, personne âgée.
const cast: { seed: string; age: number; over?: Partial<PlayerAppearance> }[] = [
  { seed: 'kid', age: 12, over: { hairStyle: 'court', skinTone: 'claire' } },
  { seed: 'kid2', age: 12, over: { hairStyle: 'locks', skinTone: 'ebene', hairColor: 'noir' } },
  { seed: 'ado', age: 15, over: { hairStyle: 'queue' } },
  { seed: 'a1', age: 30 }, { seed: 'a2', age: 34 }, { seed: 'a3', age: 45 }, { seed: 'a4', age: 70 },
];
const only = params.get('only');
if (only) cast.splice(0, cast.length, cast[Number(only)]!);
if (params.get('zoom')) { camera.position.set(0, 1.0, 3.2); camera.lookAt(0, 0.8, 0); }
cast.forEach((c, i) => {
  const look = generateLook(c.seed, { age: c.age, gender: i % 2 ? 'fille' : 'garcon' });
  const appearance = { ...look.appearance, ...c.over };
  const ch = createRigCharacter({ appearance, heightM: c.over ? heightAtAge(c.age, appearance.adultHeightCm ?? 170, i % 2 ? 'fille' : 'garcon') : look.heightM }, lib);
  ch.root.position.x = (i - (cast.length - 1) / 2) * 0.85;
  ch.setHeading(Math.PI + (Number(params.get('yaw')) || 0));
  if (params.get('rest')) ch.root.rotation.y = Math.PI + (Number(params.get('yaw')) || 0);
  ch.root.traverse((o) => { o.castShadow = true; });
  scene.add(ch.root);
  chars.push(ch);
});

const bar = document.getElementById('bar')!;
for (const name of ['(marche)', '(course)', ...lib.clips.keys()]) {
  const b = document.createElement('button');
  b.textContent = name;
  b.onclick = () => {
    speed = name === '(marche)' ? 1.3 : name === '(course)' ? 4.5 : 0;
    for (const c of chars) if (!name.startsWith('(')) c.play(name, { loop: true }); else c.stopGesture();
  };
  bar.appendChild(b);
}
let speed = Number(params.get('speed')) || 0;
const anim = params.get('anim');
if (anim) for (const c of chars) c.play(anim, { loop: true });

let last = performance.now();
(window as unknown as { labReady: boolean }).labReady = true;
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!params.get('rest')) for (const c of chars) c.update(dt, speed);
  else if (params.get('rest') === 'idle0') for (const c of chars) { c.update(0, 0); }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
