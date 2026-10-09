/**
 * Automated Verification Test Suite for GLM Character Studio.
 * Executable directly via Node.js: `node --test tools/character_studio/tests/studio.test.js`
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  evaluateBiometrics, 
  interpretWHR, 
  interpretSHR, 
  interpretGonialAngle, 
  interpretCanthalTilt,
  interpretMuscularity,
  interpretGalbe,
  PHI 
} from '../js/biometrics.js';

import { 
  PRESETS, 
  getPreset, 
  getAllPresets 
} from '../js/presets.js';

import { 
  generatePromptMatrix, 
  generateMidjourneyPrompt, 
  generateSDXLPrompt, 
  generateFluxPrompt 
} from '../js/prompt_generator.js';

import { 
  exportToJSON, 
  exportToMarkdown, 
  parseImportJSON 
} from '../js/exporter.js';

import { 
  renderBodyMannequin, 
  renderFaceArchitecture, 
  renderRadarChart 
} from '../js/anatomy_renderer.js';

import { store } from '../js/state.js';

test('1. Biometrics Engine & Mathematical Calculations', () => {
  assert.equal(typeof PHI, 'number');
  assert.ok(Math.abs(PHI - 1.618) < 0.001);

  // WHR tests
  const femaleOpt = interpretWHR(0.68, 'female');
  assert.equal(femaleOpt.optimal, true);
  assert.match(femaleOpt.label, /0.65 - 0.72/);

  const maleOpt = interpretWHR(0.83, 'male');
  assert.equal(maleOpt.optimal, true);

  // SHR (V-Taper) tests
  const heroicTaper = interpretSHR(1.62, 'male');
  assert.equal(heroicTaper.optimal, true);
  assert.match(heroicTaper.category, /Heroic V-Taper/);

  // Gonial Angle tests
  const maleGonial = interpretGonialAngle(114, 'male');
  assert.equal(maleGonial.category, 'Classic Masculine');

  const femaleGonial = interpretGonialAngle(128, 'female');
  assert.equal(femaleGonial.category, 'Feminine V-Line');

  // Canthal Tilt tests
  const hunterGaze = interpretCanthalTilt(6.5);
  assert.equal(hunterGaze.category, 'Feline / Hunter');

  // Muscularity & Galbe tests
  assert.equal(interpretMuscularity(0.88).badge, 'SHREDDED');
  assert.equal(interpretMuscularity(0.45).badge, 'ATHLETIC');
  assert.equal(interpretGalbe(0.85).badge, 'DEEP SHELF');

  // Full Biometric evaluation
  const hunter = getPreset('hunter_protagonist');
  const bio = evaluateBiometrics(hunter);
  
  assert.ok(bio.phiScore >= 50 && bio.phiScore <= 100);
  assert.ok(bio.dimorphicScore >= 50 && bio.dimorphicScore <= 100);
  assert.ok(bio.vTaperIndex >= 50 && bio.vTaperIndex <= 100);
  assert.ok(bio.aestheticHarmony >= 50 && bio.aestheticHarmony <= 100);
  assert.equal(bio.radarMetrics.length, 6);
});

test('2. Preset Library Integrity & Completeness', () => {
  const presets = getAllPresets();
  assert.equal(presets.length, 5, 'Must contain exactly the 5 iconic presets');

  const requiredIds = [
    'hunter_protagonist',
    'k_streetwear_heroine',
    'techwear_operative',
    'martial_artist',
    'matron_scientist'
  ];

  requiredIds.forEach(id => {
    const p = getPreset(id);
    assert.ok(p, `Preset ${id} must exist`);
    assert.ok(p.name && p.name.length > 0);
    assert.ok(p.heightCm >= 150 && p.heightCm <= 210);
    assert.ok(p.whr >= 0.60 && p.whr <= 1.0);
    assert.ok(p.vTaper >= 1.0 && p.vTaper <= 1.75);
    assert.ok(p.canthalTilt >= -5 && p.canthalTilt <= 10);
    assert.ok(p.mandibularAngle >= 105 && p.mandibularAngle <= 135);
    assert.ok(p.colors.primary.startsWith('#'));
    assert.ok(p.colors.accent.startsWith('#'));
    assert.ok(p.colors.skin.startsWith('#'));
  });
});

test('3. Prompt Matrix Generator for Midjourney v6, SDXL, and Flux.1', () => {
  const heroine = getPreset('k_streetwear_heroine');

  // Midjourney v6
  const mjPrompt = generateMidjourneyPrompt(heroine, 'turnaround');
  assert.match(mjPrompt, /master character model sheet/i);
  assert.match(mjPrompt, /Min Sora/);
  assert.match(mjPrompt, /--v 6.1/);
  assert.match(mjPrompt, /--ar 9:16/);
  assert.match(mjPrompt, /--stylize 250/);
  assert.match(mjPrompt, /canthal tilt/i);

  // SDXL
  const sdxl = generateSDXLPrompt(heroine, 'turnaround');
  assert.ok(sdxl.positive && sdxl.positive.length > 50);
  assert.ok(sdxl.negative && sdxl.negative.length > 50);
  assert.match(sdxl.positive, /\(masterpiece, best quality/);
  assert.match(sdxl.negative, /\(worst quality, low quality/);

  // Flux.1
  const fluxPrompt = generateFluxPrompt(heroine, 'turnaround');
  assert.ok(fluxPrompt.length > 100);
  assert.match(fluxPrompt, /Min Sora/);
  assert.match(fluxPrompt, /waist-to-hip ratio/i);

  // Multi-mode check
  const matrix = generatePromptMatrix(heroine, 'portrait');
  assert.equal(matrix.mode, 'portrait');
  assert.match(matrix.midjourney, /hero portrait/i);
});

test('4. Exporter & Serialization (JSON & Markdown)', () => {
  const operative = getPreset('techwear_operative');

  // JSON export
  const jsonStr = exportToJSON(operative);
  assert.ok(jsonStr.length > 0);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.schemaVersion, '1.0.0');
  assert.equal(parsed.character.identity.name, operative.name);
  assert.equal(parsed.character.morphometrics.heightCm, operative.heightCm);
  assert.ok(parsed.character.promptMatrix.midjourneyV6);

  // Markdown export
  const mdStr = exportToMarkdown(operative);
  assert.ok(mdStr.includes('# Character Model Sheet — Alexei Vance'));
  assert.ok(mdStr.includes('## 1. Identity & Style Summary'));
  assert.ok(mdStr.includes('## 6. Prompt Matrix'));

  // Round-trip import
  const restored = parseImportJSON(jsonStr);
  assert.equal(restored.name, operative.name);
  assert.equal(restored.heightCm, operative.heightCm);
  assert.equal(restored.colors.primary, operative.colors.primary);
});

test('5. Parametric SVG Anatomy & Facial Architecture Renderer', () => {
  const hunter = getPreset('hunter_protagonist');

  // Front View Mannequin
  const frontSvg = renderBodyMannequin(hunter, 'front');
  assert.match(frontSvg, /<svg viewBox="0 0 400 700"/);
  assert.match(frontSvg, /V-TAPER 1.62/);
  assert.match(frontSvg, /WHR 0.83/);
  assert.match(frontSvg, /188 CM/);
  assert.match(frontSvg, /rect/); // Rectus abdominis pack

  // Profile View Mannequin
  const profileSvg = renderBodyMannequin(hunter, 'profile');
  assert.match(profileSvg, /<svg viewBox="0 0 400 700"/);
  assert.match(profileSvg, /GALBE/);
  assert.match(profileSvg, /BUST/);

  // Face Architecture
  const faceSvg = renderFaceArchitecture(hunter);
  assert.match(faceSvg, /<svg viewBox="0 0 400 400"/);
  assert.match(faceSvg, /TILT: \+6.5°/);
  assert.match(faceSvg, /113°/);
  assert.match(faceSvg, /UPPER 1\/3/);

  // Radar Chart
  const radarSvg = renderRadarChart([
    { axis: 'V-Taper', value: 85 },
    { axis: 'Muscle', value: 90 },
    { axis: 'Golden Ratio', value: 95 }
  ], '#00e5ff');
  assert.match(radarSvg, /<svg viewBox="0 0 300 300"/);
  assert.match(radarSvg, /<polygon/);
});

test('6. Reactive State Store', () => {
  let callCount = 0;
  const unsubscribe = store.subscribe((state) => {
    callCount++;
    assert.ok(state.character);
    assert.ok(state.ui);
  });

  assert.ok(callCount >= 1, 'Initial notification must have fired');

  // Update
  store.updateCharacter({ name: 'Test Operator', heightCm: 192 });
  assert.equal(store.getState().character.name, 'Test Operator');
  assert.equal(store.getState().character.heightCm, 192);

  // Load Preset
  store.loadPreset('matron_scientist');
  assert.equal(store.getState().character.id, 'matron_scientist');
  assert.equal(store.getState().character.name, 'Dr. Elena Rostova');

  // Randomize
  store.randomize();
  const randChar = store.getState().character;
  assert.ok(randChar.heightCm >= 150 && randChar.heightCm <= 210);
  assert.ok(randChar.whr >= 0.50 && randChar.whr <= 1.0);

  unsubscribe();
});
