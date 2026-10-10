/**
 * Test Suite: Deterministic Procedural Generation & PRNG Integrity.
 * Verifies 100% reproducibility across runs with seeds and parameter controls.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProceduralCharacterDesign,
  ProceduralEngine
} from '../dist/index.js';

test('Deterministic Generation: Identical seed produces identical character blueprint', () => {
  const seed = 987654321;
  const specA = { name: 'Jin-Woo Test', gender: 'male', seed };
  const specB = { name: 'Jin-Woo Test', gender: 'male', seed };

  const resA = createProceduralCharacterDesign(specA);
  const resB = createProceduralCharacterDesign(specB);

  // Assert identical biometrics
  assert.equal(resA.blueprint.bio.name, resB.blueprint.bio.name);
  assert.equal(resA.blueprint.bio.age, resB.blueprint.bio.age);
  assert.equal(resA.blueprint.morphometrics.heightCm, resB.blueprint.morphometrics.heightCm);
  assert.equal(resA.blueprint.morphometrics.waistToHipRatio, resB.blueprint.morphometrics.waistToHipRatio);
  assert.equal(resA.blueprint.morphometrics.shoulderToHipRatio, resB.blueprint.morphometrics.shoulderToHipRatio);
  assert.equal(resA.blueprint.morphometrics.muscularityLevel, resB.blueprint.morphometrics.muscularityLevel);
  assert.equal(resA.blueprint.morphometrics.bustVolume, resB.blueprint.morphometrics.bustVolume);
  assert.equal(resA.blueprint.morphometrics.galbeCurvature, resB.blueprint.morphometrics.galbeCurvature);

  // Assert identical facial canons
  assert.equal(resA.blueprint.facialCanons.canthalTiltDegrees, resB.blueprint.facialCanons.canthalTiltDegrees);
  assert.equal(resA.blueprint.facialCanons.gonialAngleDegrees, resB.blueprint.facialCanons.gonialAngleDegrees);
  assert.equal(resA.blueprint.facialCanons.bigonialWidthRatio, resB.blueprint.facialCanons.bigonialWidthRatio);
  assert.equal(resA.blueprint.facialCanons.eyeDetails, resB.blueprint.facialCanons.eyeDetails);

  // Assert identical prompt matrices
  assert.equal(resA.promptMatrix.generatorSpecificPrompts.midjourneyV6, resB.promptMatrix.generatorSpecificPrompts.midjourneyV6);
  assert.equal(resA.promptMatrix.generatorSpecificPrompts.flux1, resB.promptMatrix.generatorSpecificPrompts.flux1);
  assert.equal(resA.promptMatrix.generatorSpecificPrompts.stableDiffusionXL, resB.promptMatrix.generatorSpecificPrompts.stableDiffusionXL);
  assert.equal(resA.promptMatrix.modelSheetTurnaroundPrompt, resB.promptMatrix.modelSheetTurnaroundPrompt);
});

test('Deterministic Variance: Different seeds produce distinct, varied character traits', () => {
  const res1 = createProceduralCharacterDesign({ seed: 11111 });
  const res2 = createProceduralCharacterDesign({ seed: 99999 });

  // Different seeds should produce variations
  const isDistinct = (
    res1.blueprint.bio.name !== res2.blueprint.bio.name ||
    res1.blueprint.morphometrics.heightCm !== res2.blueprint.morphometrics.heightCm ||
    res1.blueprint.facialCanons.canthalTiltDegrees !== res2.blueprint.facialCanons.canthalTiltDegrees ||
    res1.blueprint.morphometrics.waistToHipRatio !== res2.blueprint.morphometrics.waistToHipRatio
  );

  assert.ok(isDistinct, 'Different seeds must produce varied procedural attributes');
});

test('Deterministic Sliders: Precise user overrides are strictly respected', () => {
  const customSliders = {
    muscularitySlider: 0.95,
    waistToHipRatio: 0.64,
    canthalTiltDegrees: 7.5,
    gonialAngleDegrees: 112,
    bustVolumeSlider: 0.88,
    galbeSlider: 0.91
  };

  const res = createProceduralCharacterDesign({
    gender: 'female',
    seed: 5555,
    granularSliders: customSliders
  });

  assert.equal(res.blueprint.morphometrics.muscularityLevel, 0.95);
  assert.equal(res.blueprint.morphometrics.waistToHipRatio, 0.64);
  assert.equal(res.blueprint.facialCanons.canthalTiltDegrees, 7.5);
  assert.equal(res.blueprint.facialCanons.gonialAngleDegrees, 112);
  assert.equal(res.blueprint.morphometrics.bustVolume, 0.88);
  assert.equal(res.blueprint.morphometrics.galbeCurvature, 0.91);
});
