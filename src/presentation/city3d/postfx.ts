/**
 * Post-traitement, selon la qualité :
 * - moyenne : rendu direct (anticrénelage natif du canevas) puis une vignette légère en surimpression ;
 * - haute : la scène est rendue dans une cible HDR anticrénelée (MSAA), puis une passe finale unique
 *   applique un étalonnage chaud discret, la vignette, le tonemapping ACES et la conversion sRGB,
 *   avec un petit halo (bloom) très discret sur les sources lumineuses (vitrines, lampadaires) ;
 * - basse : rendu direct, rien de plus (pas d'instance de PostFx).
 */
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { QualityPreset } from './quality';

export interface PostFxParams {
  bloom: number;
  vignette: number;
  warmth: number;
}

// ACES (même ajustement que three : ×1/0.6) et sRGB recopiés sous des noms propres, pour ne pas
// dépendre des morceaux de shader que three ajoute (ou non) selon l'état du moteur.
const FINAL_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform float vignette;
uniform float warmth;
uniform float uExposure;
varying vec2 vUv;
vec3 pfxRrt(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
vec3 pfxAces(vec3 color) {
  const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= uExposure / 0.6;
  color = outM * pfxRrt(inM * color);
  return clamp(color, 0.0, 1.0);
}
vec3 pfxSrgb(vec3 c) {
  return mix(c * 12.92, pow(c, vec3(0.41666)) * 1.055 - 0.055, step(0.0031308, c));
}
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  // Étalonnage : ombres légèrement réchauffées (bois/crème), hautes lumières intactes.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c += vec3(1.0, 0.55, 0.1) * warmth * (1.0 - smoothstep(0.0, 0.6, l)) * 0.25;
  c = pfxAces(c);
  // Vignette douce (coins un peu assombris, centre intact).
  vec2 d = vUv - 0.5;
  c *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
  gl_FragColor = vec4(pfxSrgb(c), 1.0);
}`;

/** Vignette seule, dessinée par-dessus l'image déjà tonemappée (mode léger : une passe très simple). */
const VIGNETTE_FRAG = /* glsl */ `
uniform float vignette;
varying vec2 vUv;
void main() {
  vec2 d = vUv - 0.5;
  float a = vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
  gl_FragColor = vec4(0.07, 0.045, 0.08, a);
}`;

export class PostFx {
  private target?: THREE.WebGLRenderTarget;
  private bloomPass?: UnrealBloomPass;
  private quad: THREE.Mesh;
  private quadScene = new THREE.Scene();
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mat: THREE.ShaderMaterial;
  private size = new THREE.Vector2();
  private readonly full: boolean;

  constructor(private renderer: THREE.WebGLRenderer, preset: QualityPreset) {
    this.full = preset.postfx === 'complet';
    const vertexShader = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    if (this.full) {
      this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: preset.msaa, depthBuffer: true });
      this.mat = new THREE.ShaderMaterial({
        uniforms: {
          tScene: { value: this.target.texture },
          vignette: { value: 0.2 },
          warmth: { value: 0.03 },
          uExposure: { value: 1 },
        },
        vertexShader,
        fragmentShader: FINAL_FRAG,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      if (preset.bloom) this.bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.35, 0.9);
    } else {
      this.mat = new THREE.ShaderMaterial({
        uniforms: { vignette: { value: 0.2 } },
        vertexShader,
        fragmentShader: VIGNETTE_FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
    }
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  /** Rendu en HDR (halo additif plus marqué : les halos de lampadaires sont tempérés). */
  get hdr(): boolean { return this.full; }

  /** Rend `scene` vue par `camera` avec le post-traitement. */
  render(scene: THREE.Scene, camera: THREE.Camera, p: PostFxParams): void {
    const r = this.renderer;
    this.mat.uniforms.vignette!.value = p.vignette;
    if (!this.full || !this.target) {
      // Mode léger : image directe (anticrénelage natif du canevas), puis la vignette par-dessus.
      r.render(scene, camera);
      const auto = r.autoClear;
      r.autoClear = false;
      r.render(this.quadScene, this.quadCam);
      r.autoClear = auto;
      return;
    }
    r.getDrawingBufferSize(this.size);
    if (this.target.width !== this.size.x || this.target.height !== this.size.y) {
      this.target.setSize(this.size.x, this.size.y);
      this.bloomPass?.setSize(this.size.x, this.size.y);
    }
    const prevTone = r.toneMapping;
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    if (this.bloomPass && p.bloom > 0.01) {
      this.bloomPass.strength = p.bloom;
      this.bloomPass.render(r, this.target, this.target, 0, false);
    }
    this.mat.uniforms.warmth!.value = p.warmth;
    this.mat.uniforms.uExposure!.value = r.toneMappingExposure;
    r.setRenderTarget(null);
    r.toneMapping = THREE.NoToneMapping;
    r.render(this.quadScene, this.quadCam);
    r.toneMapping = prevTone;
  }

  dispose(): void {
    this.target?.dispose();
    this.bloomPass?.dispose();
    this.mat.dispose();
    this.quad.geometry.dispose();
  }
}
