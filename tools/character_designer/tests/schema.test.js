/**
 * Test Suite: Schema Validity & Granular Parameters Coverage.
 * Verifies rich typing and full attribute population:
 * Facial, Body, Style, Wardrobe, Lighting, and Multi-Model Prompts.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  createProceduralCharacterDesign, 
  CLOTHING_MATRICES, 
  ETHNICITY_PRESETS 
} from '../dist/index.js';

test('Schema Validity: Complete Facial Anatomy & Neoclassical Canons', () => {
  const res = createProceduralCharacterDesign({
    gender: 'female',
    granularSliders: {
      canthalTiltDegrees: 4.2,
      gonialAngleDegrees: 128,
      bigonialWidthRatio: 0.74,
      facialThirdsRatio: [1.0, 1.0, 1.0]
    }
  });
  const { facialCanons } = res.blueprint;

  assert.equal(typeof facialCanons.canthalTiltDegrees, 'number');
  assert.equal(typeof facialCanons.gonialAngleDegrees, 'number');
  assert.equal(typeof facialCanons.bigonialWidthRatio, 'number');
  assert.ok(Array.isArray(facialCanons.facialThirdsRatio));
  assert.equal(facialCanons.facialThirdsRatio.length, 3);
  assert.ok(typeof facialCanons.eyeDetails === 'string' && facialCanons.eyeDetails.length > 10);
  assert.ok(typeof facialCanons.noseDetails === 'string' && facialCanons.noseDetails.length > 10);
  assert.ok(typeof facialCanons.lipDetails === 'string' && facialCanons.lipDetails.length > 10);
  assert.ok(typeof facialCanons.jawlineDescription === 'string' && facialCanons.jawlineDescription.length > 10);
});

test('Schema Validity: Body Anatomy, Muscle Sculpting & Uncensored Natural Curves', () => {
  const res = createProceduralCharacterDesign({
    gender: 'female',
    archetype: 'voluptuous_curvaceous',
    granularSliders: {
      muscularitySlider: 0.40,
      waistToHipRatio: 0.67,
      shoulderToHipRatio: 1.08,
      bustVolumeSlider: 0.85,
      galbeSlider: 0.88
    }
  });
  const { morphometrics } = res.blueprint;

  assert.ok(morphometrics.heightCm >= 140 && morphometrics.heightCm <= 220);
  assert.ok(morphometrics.headHeightRatio >= 6.5 && morphometrics.headHeightRatio <= 9.0);
  assert.ok(morphometrics.waistToHipRatio > 0.55 && morphometrics.waistToHipRatio < 1.10);
  assert.ok(morphometrics.shoulderToHipRatio >= 0.90 && morphometrics.shoulderToHipRatio <= 1.80);
  assert.ok(morphometrics.muscularityLevel >= 0.0 && morphometrics.muscularityLevel <= 1.0);
  assert.ok(morphometrics.bustVolume >= 0.0 && morphometrics.bustVolume <= 1.0);
  assert.ok(morphometrics.galbeCurvature >= 0.0 && morphometrics.galbeCurvature <= 1.0);

  // Uncensored natural curve anatomical descriptions
  const curves = morphometrics.anatomicalFeatures;
  assert.ok(curves.bustChestDescription.length > 20, 'Bust/chest description must be detailed and unconstrained');
  assert.ok(curves.waistAbdomenDescription.length > 20, 'Waist/abdomen description must be detailed');
  assert.ok(curves.hipGluteDescription.length > 20, 'Hip/glute curvature must be anatomically modeled');
  assert.ok(curves.legsCalvesDescription.length > 15, 'Legs and calves description present');
  assert.ok(curves.backShouldersDescription.length > 15, 'Back and shoulder description present');
  assert.ok(curves.handsFeetDescription.length > 15, 'Hands and feet description present');
});

test('Schema Validity: Wardrobe Layering & Textures', () => {
  const styles = ['streetwear', 'techwear', 'modern_hanbok_kimono', 'light_armor', 'elegant'];
  for (const st of styles) {
    const res = createProceduralCharacterDesign({ clothingStyle: st });
    const { wardrobe } = res.blueprint;
    assert.ok(wardrobe.length >= 4, `Wardrobe for ${st} must contain at least 4 layers`);
    for (const layer of wardrobe) {
      assert.ok(['base', 'inner', 'outer', 'bottom', 'footwear', 'accessories'].includes(layer.layerName));
      assert.ok(layer.description.length > 5);
      assert.ok(layer.fabricType.length > 3);
      assert.ok(layer.tensionFoldsAndDrapes.length > 5);
    }
  }
});

test('Schema Validity: Multi-Model Prompt Matrices Generation', () => {
  const res = createProceduralCharacterDesign({
    name: 'Schema Hero',
    gender: 'male',
    archetype: 'hyper_muscular_hero',
    artStyle: 'korean_webtoon_cinematic'
  });
  const { promptMatrix } = res;

  // Midjourney v6
  assert.ok(promptMatrix.generatorSpecificPrompts.midjourneyV6.includes('--ar 16:9'));
  assert.ok(promptMatrix.generatorSpecificPrompts.midjourneyV6.includes('--style raw'));
  assert.ok(promptMatrix.generatorSpecificPrompts.midjourneyV6.includes('--v 6.0'));

  // SDXL
  assert.ok(promptMatrix.generatorSpecificPrompts.stableDiffusionXL.includes('masterpiece'));
  assert.ok(promptMatrix.negativePrompts.general.length > 20);

  // Flux.1
  assert.ok(promptMatrix.generatorSpecificPrompts.flux1.length > 100);

  // Turnaround and Details
  assert.ok(promptMatrix.modelSheetTurnaroundPrompt.includes('turnaround'));
  assert.ok(promptMatrix.macroDetailsPrompt.length > 20);
});
