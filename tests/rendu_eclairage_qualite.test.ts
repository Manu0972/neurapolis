/**
 * Vague 8 — rendu : paramètres purs du cycle jour/nuit (sky.ts) et choix de la qualité graphique
 * (quality.ts). Aucune carte graphique nécessaire.
 */
import { describe, expect, it } from 'vitest';
import { SUNRISE, SUNSET, dayPhase, skyAt } from '../src/presentation/city3d/sky';
import { QUALITY_PRESETS, chooseQuality, isQualityPref, resolveQuality } from '../src/presentation/city3d/quality';

const lum = (c: { r: number; g: number; b: number }): number => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

describe('cycle jour / nuit', () => {
  it('midi : plein jour, soleil haut, lampes éteintes, pas d’heure dorée', () => {
    const p = dayPhase(13.5);
    expect(p.above).toBe(true);
    expect(p.elev).toBeGreaterThan(0.95);
    expect(p.night).toBe(0);
    expect(p.lamps).toBe(0);
    expect(p.golden).toBe(0);
  });

  it('heure dorée avant le coucher, crépuscule juste après, nuit noire plus tard', () => {
    expect(dayPhase(SUNSET - 0.4).golden).toBeGreaterThan(0.6);
    const after = dayPhase(SUNSET + 0.3);
    expect(after.above).toBe(false);
    expect(after.twilight).toBeGreaterThan(0.7);
    expect(dayPhase(23).night).toBe(1);
    expect(dayPhase(23).twilight).toBe(0);
    expect(dayPhase(3).night).toBe(1);
  });

  it('les lampadaires et vitrines s’allument avant la nuit noire et s’éteignent après l’aube', () => {
    const h = SUNSET - 0.2;
    expect(dayPhase(h).lamps).toBeGreaterThan(dayPhase(h).night);
    expect(dayPhase(SUNSET + 0.5).lamps).toBe(1);
    expect(dayPhase(SUNRISE + 1).lamps).toBe(0);
  });

  it('l’heure accepte un tour de cadran (24 h = 0 h)', () => {
    expect(dayPhase(25).night).toBeCloseTo(dayPhase(1).night, 6);
  });

  it('palette chaude : rebond du sol plus chaud que froid le jour, nuit jamais noire', () => {
    const day = skyAt(12, 'soleil');
    expect(day.hemiGround.r).toBeGreaterThan(day.hemiGround.b);
    const night = skyAt(2, 'soleil');
    expect(lum(night.skyTop)).toBeGreaterThan(0.002);
    expect(night.skyTop.b).toBeGreaterThan(night.skyTop.r); // bleu profond, pas de noir
    // Heure dorée : soleil orangé (rouge > bleu nettement).
    const gold = skyAt(SUNSET - 0.3, 'soleil');
    expect(gold.sunColor.r - gold.sunColor.b).toBeGreaterThan(0.4);
  });

  it('pluie : sol mouillé, brouillard plus proche, soleil plus faible', () => {
    const sun = skyAt(15, 'soleil');
    const rain = skyAt(15, 'pluie');
    expect(rain.wet).toBe(1);
    expect(sun.wet).toBe(0);
    expect(rain.fogFar).toBeLessThan(sun.fogFar);
    expect(rain.sunIntensity).toBeLessThan(sun.sunIntensity * 0.5);
  });

  it('post-traitement : halo plus marqué la nuit, vignette légère, exposition relevée la nuit', () => {
    const day = skyAt(12, 'soleil');
    const night = skyAt(23, 'soleil');
    expect(night.bloom).toBeGreaterThan(day.bloom);
    expect(day.vignette).toBeLessThanOrEqual(0.35);
    expect(night.exposure).toBeGreaterThan(day.exposure);
    expect(night.contactShadow).toBeLessThan(day.contactShadow);
  });
});

describe('qualité graphique', () => {
  it('rendu logiciel, petite mémoire ou WebGL 1 → bas', () => {
    expect(chooseQuality({ renderer: 'Google SwiftShader' })).toBe('bas');
    expect(chooseQuality({ renderer: 'llvmpipe (LLVM 15.0.7, 256 bits)' })).toBe('bas');
    expect(chooseQuality({ renderer: 'NVIDIA GeForce RTX 3060', memoryGb: 2 })).toBe('bas');
    expect(chooseQuality({ renderer: 'NVIDIA GeForce RTX 3060', webgl2: false })).toBe('bas');
  });

  it('graphique intégré → moyen ; carte dédiée → haut', () => {
    expect(chooseQuality({ renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11)', cores: 8 })).toBe('moyen');
    expect(chooseQuality({ renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)', cores: 12, memoryGb: 16 })).toBe('haut');
  });

  it('téléphone : moyen sur puce récente, bas sinon', () => {
    expect(chooseQuality({ renderer: 'Apple GPU', mobile: true })).toBe('moyen');
    expect(chooseQuality({ renderer: 'Mali-G52', mobile: true })).toBe('bas');
  });

  it('la préférence du joueur prime sur la détection, « auto » suit la détection', () => {
    const caps = { renderer: 'Google SwiftShader' };
    expect(resolveQuality('haut', caps)).toBe('haut');
    expect(resolveQuality('auto', caps)).toBe('bas');
    expect(isQualityPref('moyen')).toBe(true);
    expect(isQualityPref('ultra')).toBe(false);
  });

  it('les préréglages montent en gamme sans sauter d’étape', () => {
    const { bas, moyen, haut } = QUALITY_PRESETS;
    expect(bas.postfx).toBe('aucun');
    expect(moyen.postfx).toBe('leger');
    expect(haut.postfx).toBe('complet');
    expect(haut.bloom).toBe(true);
    expect(bas.shadowMap).toBeLessThanOrEqual(moyen.shadowMap);
    expect(moyen.maxPixelRatio).toBeLessThanOrEqual(haut.maxPixelRatio);
    expect(bas.lampLights).toBeLessThan(haut.lampLights);
  });
});
