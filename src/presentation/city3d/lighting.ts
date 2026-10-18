/**
 * Éclairage d'appoint de la ville : ombre du soleil cadrée sur le joueur (sans scintillement),
 * lumière de contour chaude en contre-jour, ombres de contact douces sous les personnages.
 */
import * as THREE from 'three';
import { contactShadowTexture } from './textures';

/**
 * Cadre l'ombre du soleil autour de `focus` en alignant le centre sur la grille des texels de la
 * carte d'ombre : l'ombre ne « grésille » plus quand le joueur se déplace.
 */
export function frameSunShadow(sun: THREE.DirectionalLight, focus: THREE.Vector3, sunDir: THREE.Vector3, distance = 150): void {
  const cam = sun.shadow.camera;
  const texel = (cam.right - cam.left) / sun.shadow.mapSize.x;
  // Repère de la lumière : on arrondit le centre dans ce repère, puis on revient au monde.
  const z = sunDir.clone().normalize();
  const x = new THREE.Vector3(0, 1, 0).cross(z);
  if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
  x.normalize();
  const y = z.clone().cross(x);
  const px = Math.round(focus.dot(x) / texel) * texel;
  const py = Math.round(focus.dot(y) / texel) * texel;
  const pz = focus.dot(z);
  const snapped = new THREE.Vector3().addScaledVector(x, px).addScaledVector(y, py).addScaledVector(z, pz);
  sun.target.position.copy(snapped);
  sun.position.copy(snapped).addScaledVector(z, distance);
  sun.target.updateMatrixWorld();
}

/** Règle la taille et la douceur de l'ombre du soleil (qualité). */
export function configureSunShadow(sun: THREE.DirectionalLight, mapSize: number, extent: number, soft: boolean): void {
  if (sun.shadow.mapSize.x !== mapSize) {
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  const c = sun.shadow.camera;
  c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent;
  c.near = 1; c.far = 400;
  c.updateProjectionMatrix();
  // PCF de three : le rayon élargit le filtrage (pénombre douce) sans passe supplémentaire.
  sun.shadow.radius = soft ? 2.5 : 1;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
}

/**
 * Contre-jour chaud : une lumière directionnelle sans ombre, horizontale et légèrement plongeante,
 * placée face à la caméra. Elle n'éclaire presque que les bords des silhouettes (personnages,
 * arbres, angles de murs) — le sol et les façades vues de face ne la reçoivent pas.
 */
export function createRimLight(): { light: THREE.DirectionalLight; update(camera: THREE.Camera, focus: THREE.Vector3, color: THREE.Color, intensity: number): void } {
  const light = new THREE.DirectionalLight('#ffd6a0', 0.5);
  light.castShadow = false;
  const dir = new THREE.Vector3();
  return {
    light,
    update(camera, focus, color, intensity): void {
      camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
      dir.normalize();
      // La lumière vient de derrière le sujet (vers la caméra), un peu d'en dessous de l'horizon.
      light.position.copy(focus).addScaledVector(dir, 30);
      light.position.y = focus.y - 3;
      light.target.position.copy(focus);
      light.target.updateMatrixWorld();
      light.color.copy(color);
      light.intensity = intensity;
    },
  };
}

/** Ombres de contact : disques sombres et doux posés au sol sous les pieds (une seule instance). */
export function createContactShadows(max = 48): { mesh: THREE.InstancedMesh; update(points: readonly { x: number; y: number; z: number; r: number }[], opacity: number): void; dispose(): void } {
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: '#1e1626',
    alphaMap: contactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    fog: true,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.name = 'ombres-contact';
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;
  mesh.count = 0;
  const m = new THREE.Matrix4();
  return {
    mesh,
    update(points, opacity): void {
      const n = Math.min(max, points.length);
      for (let i = 0; i < n; i++) {
        const p = points[i]!;
        m.makeScale(p.r * 2, 1, p.r * 2).setPosition(p.x, p.y + 0.02, p.z);
        mesh.setMatrixAt(i, m);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      mat.opacity = opacity;
    },
    dispose(): void { geo.dispose(); mat.dispose(); },
  };
}
