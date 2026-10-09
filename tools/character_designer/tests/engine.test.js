/**
 * Test Suite for GLM Character Designer Engine
 * Verifies biometrics, deterministic generation, prompt matrix, and Ollama fallback.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ProceduralEngine,
  createProceduralCharacterDesign,
  evaluateFacialCanons,
  OllamaProvider,
  CLOTHING_MATRICES,
  ETHNICITY_PRESETS,
} from '../dist/index.js';

test('1. Deterministic PRNG Reproducibility with Seed', () => {
  const specA = {
    name: 'Test Character',
    gender: 'male',
    seed: 12345,
    granularSliders: { muscularitySlider: 0.75, waistToHipRatio: 0.82 }
  };
  const specB = {
    name: 'Test Character',
    gender: 'male',
    seed: 12345,
    granularSliders: { muscularitySlider: 0.75, waistToHipRatio: 0.82 }
  };

  const resA = createProceduralCharacterDesign(specA);
  const resB = createProceduralCharacterDesign(specB);

  assert.equal(resA.blueprint.bio.name, resB.blueprint.bio.name);
  assert.equal(resA.blueprint.morphometrics.heightCm, resB.blueprint.morphometrics.heightCm);
  assert.equal(resA.blueprint.morphometrics.waistToHipRatio, resB.blueprint.morphometrics.waistToHipRatio);
  assert.equal(resA.promptMatrix.generatorSpecificPrompts.midjourneyV6, resB.promptMatrix.generatorSpecificPrompts.midjourneyV6);
});

test('2. Granular Sliders (Muscles, WHR, Bust Gravity, Galbe, Canthal Tilt)', () => {
  const spec = {
    name: 'Elena Rostova',
    gender: 'female',
    archetype: 'voluptuous_curvaceous',
    clothingStyle: 'streetwear',
    ethnicity: 'nordic',
    granularSliders: {
      muscularitySlider: 0.35,
      waistToHipRatio: 0.68,
      bustVolumeSlider: 0.78,
      galbeSlider: 0.82,
      canthalTiltDegrees: 4.8,
      gonialAngleDegrees: 126
    }
  };

  const { blueprint } = createProceduralCharacterDesign(spec);
  assert.equal(blueprint.morphometrics.waistToHipRatio, 0.68);
  assert.equal(blueprint.facialCanons.canthalTiltDegrees, 4.8);
  assert.equal(blueprint.facialCanons.gonialAngleDegrees, 126);
  assert.ok(blueprint.morphometrics.muscularityLevel > 0);
  assert.ok(blueprint.morphometrics.bustVolume > 0.7);
  assert.ok(blueprint.morphometrics.galbeCurvature > 0.8);
});

test('3. Scientific Facial Evaluation & Neoclassical Canons', () => {
  const canons = {
    facialThirdsRatio: [1.0, 1.0, 1.0],
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: 4.5,
    gonialAngleDegrees: 116,
    cheekboneToJawRatio: 1.25,
    bigonialWidthRatio: 0.85,
    philtrumToChinRatio: 0.5,
    nasolabialAngleDegrees: 93,
    cheekboneProminence: 0.75,
    eyeDetails: 'sharp almond',
    noseDetails: 'straight bridge',
    lipDetails: 'contoured',
    jawlineDescription: 'chiseled'
  };

  const evaluation = evaluateFacialCanons(canons, 'male');
  assert.ok(evaluation.score >= 85, `Expected score >= 85, got ${evaluation.score}`);
  assert.ok(evaluation.findings.length > 0);
});

test('4. Wardrobe & Ethnicity Preset Integrity', () => {
  const wardrobeKeys = Object.keys(CLOTHING_MATRICES);
  assert.ok(wardrobeKeys.includes('streetwear'));
  assert.ok(wardrobeKeys.includes('techwear'));
  assert.ok(wardrobeKeys.includes('modern_hanbok_kimono'));
  assert.ok(wardrobeKeys.includes('light_armor'));
  assert.ok(wardrobeKeys.includes('elegant'));

  const ethnicityKeys = Object.keys(ETHNICITY_PRESETS);
  assert.ok(ethnicityKeys.includes('east_asian'));
  assert.ok(ethnicityKeys.includes('african'));
  assert.ok(ethnicityKeys.includes('caucasian'));
  assert.ok(ethnicityKeys.includes('middle_eastern'));
  assert.ok(ethnicityKeys.includes('south_asian'));
  assert.ok(ethnicityKeys.includes('nordic'));
});

test('5. Multi-Model Prompt Matrix Compilation', () => {
  const spec = {
    name: 'Raiden Kross',
    gender: 'male',
    archetype: 'hyper_muscular_hero',
    artStyle: 'korean_webtoon_cinematic',
    clothingStyle: 'techwear'
  };

  const { promptMatrix } = createProceduralCharacterDesign(spec);
  assert.ok(promptMatrix.generatorSpecificPrompts.midjourneyV6.includes('--v 6.0'));
  assert.ok(promptMatrix.generatorSpecificPrompts.midjourneyV6.includes('Solo Leveling'));
  assert.ok(promptMatrix.generatorSpecificPrompts.flux1.length > 50);
  assert.ok(promptMatrix.generatorSpecificPrompts.stableDiffusionXL.includes('masterpiece'));
  assert.ok(promptMatrix.negativePrompts.general.includes('deformed anatomy'));
  assert.ok(promptMatrix.modelSheetTurnaroundPrompt.includes('turnaround'));
});

test('6. Ollama Provider Health & Fallback Resilience', async () => {
  // Test local Ollama or graceful offline fallback
  const provider = new OllamaProvider({ timeoutMs: 2000 });
  const isAvailable = await provider.isAvailable();
  
  // Regardless of whether daemon is running or not, the engine should never throw
  const spec = { name: 'Resilience Test', gender: 'male' };
  const res = await provider.generateCharacter(spec);
  assert.ok(res.blueprint);
  assert.ok(res.promptMatrix);
  assert.ok(res.metadata);
  assert.ok(['ollama', 'procedural_fallback'].includes(res.metadata.engine));
});
