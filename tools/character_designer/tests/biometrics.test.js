/**
 * Test Suite: Scientific Biometrics & Neoclassical Canons Evaluation.
 * Verifies Golden Ratio (Phi), Neoclassical Thirds, Canthal Tilt,
 * Mandibular Angle, WHR / SHR Dimorphism, and Natural Tissue Drape.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  evaluateFacialCanons, 
  evaluateBodyMorphometrics,
  createProceduralCharacterDesign 
} from '../dist/index.js';

test('Biometrics: Neoclassical Facial Thirds & Canthal Tilt Evaluation', () => {
  const balancedCanons = {
    facialThirdsRatio: [1.0, 1.0, 1.0],
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: 4.5, // positive alert gaze
    gonialAngleDegrees: 116,
    cheekboneToJawRatio: 1.25,
    bigonialWidthRatio: 0.85,
    philtrumToChinRatio: 0.5,
    nasolabialAngleDegrees: 93,
    cheekboneProminence: 0.80,
    eyeDetails: 'sharp almond eyes with catchlights',
    noseDetails: 'straight greek bridge',
    lipDetails: 'sculpted vermilion contour',
    jawlineDescription: 'chiseled masculine frame'
  };

  const evalMale = evaluateFacialCanons(balancedCanons, 'male');
  assert.ok(evalMale.score >= 90, 'Balanced thirds and positive tilt should yield high aesthetic score');
  assert.ok(evalMale.findings.some(f => f.includes('tilt')), 'Findings should document canthal tilt effect');
  assert.ok(evalMale.findings.some(f => f.includes('thirds') || f.includes('balance')));

  // Test negative canthal tilt deduction
  const melancholicCanons = { ...balancedCanons, canthalTiltDegrees: -4.0 };
  const evalMelancholic = evaluateFacialCanons(melancholicCanons, 'male');
  assert.ok(evalMelancholic.score < evalMale.score, 'Negative canthal tilt should reflect weary score adjustment');
});

test('Biometrics: Sexual Dimorphism in Jaw & Mandibular Angle', () => {
  const maleJaw = {
    facialThirdsRatio: [1.0, 1.0, 1.0],
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: 3.0,
    gonialAngleDegrees: 115, // ideal male athletic angle
    cheekboneToJawRatio: 1.20,
    bigonialWidthRatio: 0.88,
    philtrumToChinRatio: 0.5,
    nasolabialAngleDegrees: 92,
    cheekboneProminence: 0.75,
    eyeDetails: 'intense hooded',
    noseDetails: 'strong bridge',
    lipDetails: 'subtle',
    jawlineDescription: 'square athletic'
  };

  const femaleJaw = {
    ...maleJaw,
    gonialAngleDegrees: 128, // ideal female graceful V-line
    bigonialWidthRatio: 0.72
  };

  const maleEval = evaluateFacialCanons(maleJaw, 'male');
  const femaleEval = evaluateFacialCanons(femaleJaw, 'female');

  assert.ok(maleEval.findings.some(f => f.includes('masculine') || f.includes('115')));
  assert.ok(femaleEval.findings.some(f => f.includes('V-line') || f.includes('128')));
});

test('Biometrics: Evolutionary WHR Gynoid Curve & Natural Gravity Drape', () => {
  const { blueprint } = createProceduralCharacterDesign({
    gender: 'female',
    archetype: 'voluptuous_curvaceous',
    granularSliders: {
      waistToHipRatio: 0.68,
      bustVolumeSlider: 0.82,
      galbeSlider: 0.85
    }
  });

  const report = evaluateBodyMorphometrics(blueprint.morphometrics, 'female', blueprint.archetype);

  assert.ok(report.scorePhiCompatibility >= 80);
  assert.ok(report.dimorphicStrengthScore >= 85);
  assert.ok(report.anatomicalIntegrityScore >= 85);

  // Check evolutionary gynoid note
  assert.ok(report.notes.some(n => n.includes('Singh') || n.includes('0.68') || n.includes('gynoid')));
  assert.ok(report.notes.some(n => n.includes('teardrop') || n.includes('gravitational') || n.includes('drape')));
});
