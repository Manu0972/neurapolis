/**
 * Ciel, soleil et ambiance lumineuse selon l'heure et la météo (lecture seule du monde).
 * Lever ~7 h, coucher ~20 h (septembre). Palette de la DA : jour crème et bleu doux, heure dorée
 * pêche/ambre (~1800 K), crépuscule mauve rosé, nuit bleu profond et violette (jamais de noir),
 * ombres un peu froides, lumière rebondie du sol chaude (bois, brun, crème). Pas de néon.
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
  /** Brouillard linéaire : début et fin (m). */
  fogNear: number;
  fogFar: number;
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  /** 0 = plein jour, 1 = nuit noire : pilote le ciel et l'exposition. */
  night: number;
  /** 0 → 1 : lampadaires, vitrines et fenêtres allumés (s'allument avant la nuit noire). */
  lamps: number;
  /** 0 → 1 : soleil bas sur l'horizon (heure dorée). */
  golden: number;
  /** 0 → 1 : lueur du crépuscule (soleil juste sous l'horizon). */
  twilight: number;
  /** Lumière de contour chaude (contre-jour) sur les silhouettes. */
  rimColor: THREE.Color;
  rimIntensity: number;
  /** Post-traitement : intensité du halo lumineux et de la vignette, chaleur de l'étalonnage. */
  bloom: number;
  vignette: number;
  warmth: number;
  /** 0 → 1 : sol mouillé (flaques, reflets). */
  wet: number;
  /** Opacité des ombres de contact sous les personnages. */
  contactShadow: number;
  exposure: number;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const lerpC = (a: string, b: string, t: number): THREE.Color => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(t));
const smooth = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp01(t);

export const SUNRISE = 6.9;
export const SUNSET = 20.1;

/** Phases de la journée (nombres purs, testables) pour une heure décimale 0-24. */
export function dayPhase(hour: number): { elev: number; above: boolean; golden: number; twilight: number; night: number; lamps: number; t: number } {
  const h = ((hour % 24) + 24) % 24;
  const t = (h - SUNRISE) / (SUNSET - SUNRISE); // 0 au lever, 1 au coucher
  const above = t > 0 && t < 1;
  const elev = above ? Math.sin(Math.PI * t) : 0;
  const golden = above ? 1 - smooth(0.0, 0.38, elev) : 0;
  // Crépuscule : l'heure qui suit le coucher (et celle qui précède le lever).
  let twilight = 0;
  if (!above) twilight = h >= SUNSET ? 1 - smooth(0, 1.3, h - SUNSET) : 1 - smooth(0, 1.3, SUNRISE - h);
  const night = Math.max(1 - smooth(SUNRISE - 1.4, SUNRISE + 0.3, h), smooth(SUNSET - 0.3, SUNSET + 1.4, h));
  const lamps = Math.max(1 - smooth(SUNRISE - 0.2, SUNRISE + 0.6, h), smooth(SUNSET - 0.9, SUNSET + 0.2, h));
  return { elev, above, golden, twilight, night, lamps, t };
}

/** Paramètres d'éclairage pour une heure (en heures décimales, 0-24) et une météo. */
export function skyAt(hour: number, meteo: Meteo): SkyState {
  const { elev, above, golden, twilight, night, lamps, t } = dayPhase(hour);
  // Azimut : est le matin → sud à midi → ouest le soir.
  const az = Math.PI * (0.5 + clamp01(t));
  const height = above ? 0.08 + elev * 0.92 : 0.25;
  const sunDir = new THREE.Vector3(Math.cos(az), height, Math.sin(az) * 0.6 + 0.4).normalize();

  const overcast = meteo === 'pluie' ? 1 : meteo === 'nuages' ? 0.5 : 0;

  const sunColor = lerpC('#fff1dc', '#ffa95c', golden);
  if (!above) sunColor.set('#8fa3d6'); // lune
  const sunIntensity = above ? (0.7 + elev * 2.3) * (1 - overcast * 0.8) * (1 - golden * 0.15) : 0.32;

  // Ciel : crème à l'horizon le jour, pêche à l'heure dorée, mauve rosé au crépuscule.
  const skyTop = lerpC('#5b94d6', '#5a5a8e', golden * 0.7).lerp(new THREE.Color('#141c3d'), night);
  const skyHorizon = lerpC('#efe4cc', '#ffa968', golden).lerp(new THREE.Color('#2e2848'), night);
  if (twilight > 0) {
    skyHorizon.lerp(new THREE.Color('#c9786a'), twilight * 0.75);
    skyTop.lerp(new THREE.Color('#2a2f5e'), twilight * 0.5);
  }
  if (overcast > 0) {
    skyTop.lerp(new THREE.Color(night > 0.5 ? '#151a24' : '#8f969e'), overcast * 0.8);
    skyHorizon.lerp(new THREE.Color(night > 0.5 ? '#1d222c' : '#b3b1ab'), overcast * 0.8);
  }
  // Ciel de l'hémisphère : bleu doux le jour (ombres légèrement froides), pêche le soir.
  const hemiSky = lerpC('#d0d6e0', '#f0c49a', golden * 0.8).lerp(new THREE.Color('#3a4170'), night);
  if (overcast > 0) hemiSky.lerp(new THREE.Color('#c9ccd0'), overcast * 0.5 * (1 - night));
  // Rebond du sol : bois et brun chauds le jour, violet ardoise la nuit (jamais de noir).
  const hemiGround = lerpC('#aa8d68', '#8a5e46', golden).lerp(new THREE.Color('#3b3352'), night);
  const hemiIntensity = lerp(1.0, 0.55, night) + overcast * 0.25 * (1 - night);

  // Brouillard léger coloré : brume chaude le soir, voile bleu-violet la nuit, plus dense sous la pluie.
  const fogColor = skyHorizon.clone().lerp(new THREE.Color('#d9c7a8'), (1 - night) * 0.25);
  const rainy = meteo === 'pluie';
  const fogNear = rainy ? 25 : lerp(lerp(70, 45, golden), 35, night);
  const fogFar = rainy ? 230 : lerp(lerp(460, 420, golden), 400, night);

  const rimColor = lerpC('#ffdcae', '#ffb070', golden).lerp(new THREE.Color('#ffc890'), night);
  const rimIntensity = lerp(lerp(0.45, 0.9, golden), 0.35, night) * (1 - overcast * 0.5);

  return {
    sunDir, sunColor, sunIntensity, hemiSky, hemiGround, hemiIntensity, fogColor, fogNear, fogFar,
    skyTop, skyHorizon, night, lamps, golden, twilight, rimColor, rimIntensity,
    bloom: lerp(0.08, 0.22, Math.max(lamps * 0.8, night)),
    vignette: lerp(0.2, 0.32, night),
    warmth: lerp(0.02, 0.07, golden) * (1 - night * 0.5),
    wet: rainy ? 1 : 0,
    contactShadow: lerp(0.5 + overcast * 0.15, 0.35, night),
    exposure: 1.0 + golden * 0.05 + night * 0.2,
  };
}

/** Dôme de ciel en dégradé : halo du soleil à l'heure dorée et quelques étoiles la nuit. */
export function createSkyDome(): { mesh: THREE.Mesh; update(s: SkyState): void } {
  const geo = new THREE.SphereGeometry(900, 24, 12);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#5d97d8') },
      horizon: { value: new THREE.Color('#cfe2f0') },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunGlow: { value: new THREE.Color('#ffb070') },
      glow: { value: 0 },
      stars: { value: 0 },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunGlow; uniform float glow; uniform float stars; varying vec3 vPos;
      float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main(){
        float h = clamp(vPos.y*1.6, 0.0, 1.0);
        vec3 col = mix(horizon, top, pow(h, 0.7));
        float d = max(0.0, dot(normalize(vPos), normalize(sunDir)));
        col += sunGlow * glow * (pow(d, 8.0) * 0.45 + pow(d, 64.0) * 0.6) * (1.0 - h * 0.6);
        if (stars > 0.0 && vPos.y > 0.05) {
          vec3 cell = floor(vPos * 260.0);
          float s = step(0.9975, hash3(cell));
          col += vec3(0.95, 0.9, 1.0) * s * stars * smoothstep(0.05, 0.35, vPos.y) * (0.5 + 0.5 * hash3(cell + 7.0));
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -1;
  return {
    mesh,
    update(s: SkyState): void {
      (mat.uniforms.top!.value as THREE.Color).copy(s.skyTop);
      (mat.uniforms.horizon!.value as THREE.Color).copy(s.skyHorizon);
      (mat.uniforms.sunDir!.value as THREE.Vector3).copy(s.sunDir);
      (mat.uniforms.sunGlow!.value as THREE.Color).copy(s.sunColor);
      mat.uniforms.glow!.value = Math.max(s.golden, s.twilight * 0.6) * (1 - s.wet * 0.8);
      mat.uniforms.stars!.value = Math.max(0, s.night - 0.5) * 2 * (1 - s.wet);
    },
  };
}
