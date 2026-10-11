/**
 * Multi-Model Prompt Compiler Module.
 * Synthesizes prompt matrices tailored for Midjourney v6, Stable Diffusion XL, and Flux.1.
 * Embeds granular facial canons, uncensored physical curves, wardrobe physics, and lighting.
 */

import type { CharacterDesignBlueprint, PromptMatrixOutput } from '../types.ts';
import { getStylePreset } from '../styles/presets.ts';

export class PromptCompiler {
  public static compile(blueprint: CharacterDesignBlueprint): PromptMatrixOutput {
    const { bio, facialCanons, morphometrics, wardrobe, lighting, artStyleCategory } = blueprint;
    const stylePreset = getStylePreset(artStyleCategory);

    // Build common descriptor tokens
    const genderTag = bio.gender === 'female' ? 'heroine, adult woman' : (bio.gender === 'male' ? 'protagonist, adult man' : 'character, adult');
    const facialTokens = [
      `${facialCanons.eyeShape.replace('_', ' ')} eyes with canthal tilt (${facialCanons.canthalTiltDegrees > 0 ? '+' : ''}${facialCanons.canthalTiltDegrees}°)`,
      facialCanons.jawlineDescription,
      facialCanons.noseDetails,
      facialCanons.lipDetails
    ].join(', ');

    const bodyTokens = bio.gender === 'male'
      ? `${morphometrics.heightCm}cm tall, ${morphometrics.muscleDefinition} build (${(morphometrics.muscularityLevel * 10).toFixed(1)}/10), V-taper (${morphometrics.shoulderToHipRatio} SHR), ${morphometrics.anatomicalFeatures.bustChestDescription}, ${morphometrics.anatomicalFeatures.waistAbdomenDescription}, ${morphometrics.vascularity} vascular forearms`
      : `${morphometrics.heightCm}cm tall, authentic natural curves, WHR ${morphometrics.waistToHipRatio}, ${morphometrics.anatomicalFeatures.bustChestDescription}, ${morphometrics.anatomicalFeatures.hipGluteDescription}, ${morphometrics.anatomicalFeatures.waistAbdomenDescription}`;

    const outfitSummary = wardrobe.map(l => `${l.layerName}: ${l.description} (${l.fabricType})`).join(', ');

    // 1. Model Sheet Turnaround Prompt
    const modelSheetTurnaroundPrompt = [
      `master character model sheet, production turnaround reference of ${bio.name}`,
      `${genderTag}, ${bio.age} years old`,
      stylePreset.promptTokens.join(', '),
      'full turnaround views including orthographic front view, rear back view, profile side view, and 3/4 standing pose',
      facialTokens,
      bodyTokens,
      `wearing ${outfitSummary}`,
      lighting.primaryLightSource,
      lighting.rimLightingColor,
      'neutral clean studio backdrop with subtle ground reflection and scale ruler, tack sharp focus, 8k masterwork'
    ].join(', ');

    // 2. Expression Matrix Prompt
    const expressionMatrixPrompt = [
      `character facial expression reference grid for ${bio.name}`,
      `${genderTag}`,
      stylePreset.promptTokens.join(', '),
      '12-panel expression sheet showing diverse emotional states: neutral stoic, confident grin, intense glare, ferocious battle roar, surprised vigilance, subtle blush, cold menacing smirk, gentle warm smile, analytical focus, tear of resolve, exhausted grit, and predatory focus',
      facialTokens,
      'consistent facial geometry, identical eye shape and jawline structure across all 12 portraits, studio lighting, crisp high definition linework'
    ].join(', ');

    // 3. Dynamic Pose Sheet Prompt
    const dynamicPoseSheetPrompt = [
      `action pose study and turnaround lineup of ${bio.name}`,
      `${genderTag}`,
      stylePreset.promptTokens.join(', '),
      'lineup of 5 dynamic combat and lifestyle poses: low-center martial readiness stance, rapid mid-air dash with billowing fabric, casual stride with hands in pockets, commanding seated throne repose, and precision weapon inspection',
      bodyTokens,
      `wearing ${outfitSummary}`,
      'kinetic motion lines, dynamic fabric tension and realistic folds, chiaroscuro lighting, master concept art'
    ].join(', ');

    // 4. Macro Details Prompt
    const macroDetailsPrompt = [
      `macro close-up material and anatomical callout sheet for ${bio.name}`,
      'detailed composite quadrants showcasing: close-up iris structure with limbal ring and glowing catchlights, forearm vascularity and epidermal striations, fabric weave textures on denim and ballistic nylon, and handcrafted accessories',
      'extreme macro focus, tactile photorealistic surface fidelity, ambient occlusion'
    ].join(', ');

    // 5. Single Hero Portrait Prompt
    const singleHeroPortraitPrompt = [
      `intimate cinematic hero portrait of ${bio.name}`,
      `${genderTag}, ${bio.age} years old`,
      stylePreset.promptTokens.join(', '),
      facialTokens,
      `eyes glowing with subtle ${bio.signatureColors.secondary} power embers`,
      lighting.primaryLightSource,
      lighting.rimLightingColor,
      lighting.colorGrading,
      lighting.depthOfField,
      '85mm portrait lens, masterpiece composition, artstation award winning digital illustration'
    ].join(', ');

    // 6. Full Body Action Prompt
    const fullBodyActionPrompt = [
      `full-body dynamic combat illustration of ${bio.name}`,
      `${genderTag}`,
      stylePreset.promptTokens.join(', '),
      bodyTokens,
      `wearing complete operational gear: ${outfitSummary}`,
      'executing high-velocity acrobatic maneuver, sparks and energy particles crackling in atmosphere',
      lighting.primaryLightSource,
      lighting.rimLightingColor,
      'volumetric smoke, low camera angle looking up heroically, 35mm cinematic lens, blockbuster action manhwa still'
    ].join(', ');

    // 7. Negative Prompts
    const negativePrompts = {
      general: 'low quality, blurry, deformed, bad anatomy, bad hands, missing fingers, extra digits, cropped, watermark, signature, username, jpeg artifacts, poorly drawn face, poorly drawn eyes, mutation, grotesque',
      anatomicalCorrection: 'extra limbs, disembodied limbs, fused fingers, too many fingers, missing arm, mutated hands, stiff plastic anatomy, rigid spherical breasts, uncanny valley, crossed eyes, misaligned pupils, warped spine',
      stylePreservation: '3d render uncanny plastic, Western comic hyper-stylization, muddy colors, flat lighting without ambient occlusion, chaotic messy sketch lines, oversaturated neon bleed'
    };

    // 8. Generator-Specific Prompts
    // Midjourney v6
    const midjourneyV6 = [
      `master character turnaround sheet, ${bio.name}, ${genderTag}`,
      stylePreset.promptTokens.slice(0, 4).join(', '),
      `front back and 3/4 views`,
      facialTokens,
      bodyTokens,
      `wearing ${blueprint.clothingStyle} attire (${blueprint.attireState} mode)`,
      `${lighting.presetName}, ${lighting.rimLightingColor}`,
      'clean gray background --ar 16:9 --style raw --v 6.1 --q 2'
    ].join(', ');

    // Stable Diffusion XL (SDXL)
    const stableDiffusionXL = [
      `score_9, score_8_up, masterpiece, best quality, highly detailed character model sheet of ${bio.name}`,
      `${genderTag}`,
      stylePreset.promptTokens.join(', '),
      'turnaround sheet, orthographic front view, side view, back view',
      facialTokens,
      bodyTokens,
      outfitSummary,
      `${lighting.shadowQuality}, dramatic rim light, volumetric lighting`,
      'clean background, sharp focus, 8k resolution'
    ].join(', ');

    // Flux.1 (Natural language paragraph syntax for T5-XXL text encoder)
    const flux1 = `A master production character model sheet depicting ${bio.name}, a ${bio.age}-year-old ${genderTag} presented in four distinct turnaround perspectives (front, back, profile, and dynamic three-quarter view) on a clean neutral studio backdrop. Rendered in a high-caliber ${stylePreset.displayName} style with crisp ink linework and sophisticated cel-shading. The character possesses ${facialTokens}. The physique is sculpted with ${bodyTokens}. Dressed in a ${blueprint.clothingStyle} wardrobe configured in ${blueprint.attireState} state: ${outfitSummary}. The scene is illuminated by ${lighting.primaryLightSource}, complemented by a striking ${lighting.rimLightingColor} that carves out the anatomical contours. Every textile fold and muscle boundary is rendered with exceptional clarity and material authenticity.`;

    return {
      characterId: blueprint.id,
      characterName: blueprint.name,
      modelSheetTurnaroundPrompt,
      expressionMatrixPrompt,
      dynamicPoseSheetPrompt,
      macroDetailsPrompt,
      singleHeroPortraitPrompt,
      fullBodyActionPrompt,
      negativePrompts,
      generatorSpecificPrompts: {
        midjourneyV6,
        stableDiffusionXL,
        flux1
      }
    };
  }
}
