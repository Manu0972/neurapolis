/**
 * Ciel, soleil et ambiance lumineuse selon l'heure et la météo (lecture seule du monde).
 * Lever ~7 h, coucher ~20 h (septembre) ; la nuit est bleu profond et violette (palette de la DA,
 * jamais de noir), le soir pêche/ambre (~1800 K), l'horizon de jour crème plutôt que gris.
 */
import * as THREE from 'three';
import type { Meteo } from '../../core/types';

export interface SkyState {
  /** Direction du soleil (vecteur unitaire, y = hauteur). */
  sunDir: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  fogColor: THREE.Color;
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  /** 0 = plein jour, 1 = nuit noire : pilote lampadaires et fenêtres. */
  night: number;
  exposure: number;
}

const lerpC = (a: string, b: string, t: number): THREE.Color => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));
const smooth = (e0: number, e1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Paramètres d'éclairage pour une heure (en heures décimales, 0-24) et une météo. */
export function skyAt(hour: number, meteo: Meteo): SkyState {
  const SUNRISE = 6.9;
  const SUNSET = 20.1;
  const dayLen = SUNSET - SUNRISE;
  const t = (hour - SUNRISE) / dayLen; // 0 au lever, 1 au coucher
  const elev = Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
  const above = t > 0 && t < 1;
  // Azimut : est le matin → sud à midi → ouest le soir.
  const az = Math.PI * (0.5 + Math.max(0, Math.min(1, t)));
  const height = above ? 0.08 + elev * 0.92 : 0.25;
  const sunDir = new THREE.Vector3(Math.cos(az), height, Math.sin(az) * 0.6 + 0.4).normalize();

  // Crépuscule : 1 près de l'horizon.
  const golden = above ? 1 - smooth(0.0, 0.35, elev) : 0;
  const dusk = smooth(SUNSET - 0.6, SUNSET + 1.2, hour) * (1 - smooth(SUNRISE + 1.0, SUNRISE + 2.0, hour < 12 ? hour + 24 : hour));
  const dawnNight = 1 - smooth(SUNRISE - 1.4, SUNRISE + 0.3, hour);
  const night = Math.max(dawnNight, smooth(SUNSET - 0.3, SUNSET + 1.4, hour));

  const overcast = meteo === 'pluie' ? 1 : meteo === 'nuages' ? 0.5 : 0;

  const sunColor = lerpC('#fff4e0', '#ffb36b', golden);
  if (!above) sunColor.set('#7d93c9'); // lune
  const sunIntensity = above ? (0.5 + elev * 2.6) * (1 - overcast * 0.6) : 0.35;

  const skyTop = lerpC('#5d97d8', '#4a4a7a', golden * 0.6).lerp(new THREE.Color('#1a2244'), night);
  const skyHorizon = lerpC('#e4e6dc', '#ffb27a', golden).lerp(new THREE.Color('#2c2540'), night);
  if (overcast > 0) {
    skyTop.lerp(new THREE.Color(night > 0.5 ? '#151a24' : '#8a929c'), overcast * 0.8);
    skyHorizon.lerp(new THREE.Color(night > 0.5 ? '#1d222c' : '#a7adb3'), overcast * 0.8);
  }
  const hemiSky = skyTop.clone().lerp(new THREE.Color('#ffffff'), 0.25);
  // Ombres : violet ardoise le soir et la nuit (guide DA : ombres froides, jamais de noir).
  const hemiGround = lerpC('#8a7a62', '#4a3f5e', Math.max(night, golden * 0.5));
  const hemiIntensity = 0.55 + (1 - night) * 0.5;
  const fogColor = skyHorizon.clone();
  void dusk;
  return {
    sunDir, sunColor, sunIntensity, hemiSky, hemiGround, hemiIntensity, fogColor,
    skyTop, skyHorizon, night, exposure: 1.0 + night * 0.15,
  };
}

/** Dôme de ciel en dégradé (une sphère inversée, mise à jour chaque image). */
export function createSkyDome(): { mesh: THREE.Mesh; update(s: SkyState): void } {
  const geo = new THREE.SphereGeometry(900, 24, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#5d97d8') },
      horizon: { value: new THREE.Color('#cfe2f0') },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vPos;
      void main(){ float h = clamp(vPos.y*1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.7)), 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -1;
  return {
    mesh,
    update(s: SkyState): void {
      (mat.uniforms.top!.value as THREE.Color).copy(s.skyTop);
      (mat.uniforms.horizon!.value as THREE.Color).copy(s.skyHorizon);
    },
  };
}
