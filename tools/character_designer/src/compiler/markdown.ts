/**
 * Markdown Exporter Module.
 * Compiles a master production character dossier in GitHub-flavored Markdown.
 */

import type { CharacterGenerationResult } from '../types.ts';

export class MarkdownExporter {
  public static export(result: CharacterGenerationResult): string {
    const { blueprint, promptMatrix, metadata, biometricReport } = result;
    const { bio, facialCanons, morphometrics, wardrobe, lighting, artStyleCategory } = blueprint;

    const lines: string[] = [];

    lines.push(`# Master Character Dossier: ${bio.name} (${bio.alias ?? 'Subject'})`);
    lines.push(`**Engine**: ${metadata.engine} | **Seed**: \`${metadata.seed}\` | **Generated**: ${metadata.timestamp}`);
    if (metadata.fallbackTriggered) {
      lines.push(`> ⚠️ **Fallback Note**: ${metadata.fallbackReason}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // 1. Executive Summary
    lines.push('## 1. Executive Profile & Biometrics');
    lines.push(`- **Full Name**: ${bio.name}`);
    lines.push(`- **Archetype**: \`${blueprint.archetype}\``);
    lines.push(`- **Gender**: ${bio.gender} | **Age**: ${bio.age} years`);
    lines.push(`- **Ethnicity / Phenotype**: ${bio.ethnicityOrOrigin}`);
    lines.push(`- **Occupation / Role**: ${bio.occupationOrRole}`);
    lines.push(`- **Art Style Target**: ${artStyleCategory} (\`${blueprint.artStylePreset}\`)`);
    lines.push(`- **Personality Signature**: ${bio.personalityKeywords.join(', ')}`);
    lines.push(`- **Signature Palette**: Primary \`${bio.signatureColors.primary}\`, Secondary \`${bio.signatureColors.secondary}\`, Skin \`${bio.signatureColors.skinHex}\`, Hair \`${bio.signatureColors.hairHex}\`, Eyes \`${bio.signatureColors.eyeHex}\``);
    lines.push(`- **Backstory Synopsis**: ${bio.backstorySummary}`);
    lines.push('');

    // 2. Scientific Biometric Evaluation
    if (biometricReport) {
      lines.push('## 2. Scientific Biometric & Neoclassical Canons');
      lines.push('| Metric | Score | Clinical Standard & Target |');
      lines.push('|---|---|---|');
      lines.push(`| **Phi (Golden Ratio) Compatibility** | **${biometricReport.scorePhiCompatibility}%** | 1:1.618 neoclassical harmonic proportional standard |`);
      lines.push(`| **Facial Harmonic Score** | **${biometricReport.facialHarmonicScore}%** | Neoclassical thirds (1:1:1) & bilateral symmetry |`);
      lines.push(`| **Sexual Dimorphism Index** | **${biometricReport.dimorphicStrengthScore}%** | Mandibular gonial angle & Devendra Singh WHR / SHR optimums |`);
      lines.push(`| **Anatomical Integrity & Drape** | **${biometricReport.anatomicalIntegrityScore}%** | Uncensored natural tissue drape, gravity & muscular striation |`);
      lines.push('');
      lines.push('### Biometric Findings:');
      for (const note of biometricReport.notes) {
        lines.push(`- ✅ ${note}`);
      }
      if (biometricReport.recommendations.length > 0) {
        lines.push('');
        lines.push('### Aesthetic Recommendations:');
        for (const rec of biometricReport.recommendations) {
          lines.push(`- 💡 ${rec}`);
        }
      }
      lines.push('');
    }

    // 3. Granular Facial Anatomy Table
    lines.push('## 3. Granular Facial Morphometry');
    lines.push('| Parameter | Value | Anatomical Impact & Stylistic Significance |');
    lines.push('|---|---|---|');
    lines.push(`| **Canthal Tilt** | **${facialCanons.canthalTiltDegrees > 0 ? '+' : ''}${facialCanons.canthalTiltDegrees}°** | ${facialCanons.canthalTiltDegrees > 0 ? 'Youthful, magnetic, alert hunter gaze' : 'Contemplative, heavy gaze'} |`);
    lines.push(`| **Mandibular Gonial Angle** | **${facialCanons.gonialAngleDegrees}°** | ${bio.gender === 'male' ? 'Masculine athletic jawline' : 'Graceful feminine V-line contour'} |`);
    lines.push(`| **Bigonial Width Ratio** | **${facialCanons.bigonialWidthRatio}** | Width across gonial angles relative to bizygomatic cheekbones |`);
    lines.push(`| **Facial Thirds Ratio** | **${facialCanons.facialThirdsRatio.join(' : ')}** | Classical upper : mid : lower facial division |`);
    lines.push(`| **Bilateral Symmetry** | **${(facialCanons.facialSymmetryScore * 100).toFixed(1)}%** | Neoclassical balance preserving authentic micro-variations |`);
    lines.push(`| **Eye Shape & Orbit** | **${facialCanons.eyeShape}** | ${facialCanons.eyeDetails} |`);
    lines.push(`| **Nose Structure** | **${facialCanons.noseShape}** | ${facialCanons.noseDetails} |`);
    lines.push(`| **Lips & Philtrum** | **${facialCanons.lipShape}** | ${facialCanons.lipDetails} |`);
    lines.push(`| **Jaw & Malar Bones** | Prominence: **${facialCanons.cheekboneProminence}** | ${facialCanons.jawlineDescription} |`);
    lines.push('');

    // 4. Granular Body Anatomy & Muscle Sculpting Table
    lines.push('## 4. Body Anatomy, Muscle Sculpting & Natural Curves');
    lines.push('| Metric | Value | Reference Standard |');
    lines.push('|---|---|---|');
    lines.push(`| **Height & Weight** | **${morphometrics.heightCm} cm** (${(morphometrics.heightCm / 30.48).toFixed(1)} ft) / **${morphometrics.weightKg} kg** | Somatotype: \`${morphometrics.somatotype}\` |`);
    lines.push(`| **Proportion Scale** | **${morphometrics.headHeightRatio} heads tall** | Heroic Lysippian manhwa proportion |`);
    lines.push(`| **Waist-to-Hip Ratio (WHR)** | **${morphometrics.waistToHipRatio}** | Chest: ${morphometrics.chestCircumferenceCm}cm \| Waist: ${morphometrics.waistCircumferenceCm}cm \| Hips: ${morphometrics.hipCircumferenceCm}cm |`);
    lines.push(`| **Shoulder-to-Hip Ratio (SHR)** | **${morphometrics.shoulderToHipRatio}** | V-Taper Flare Score: **${(morphometrics.vTaperScore * 10).toFixed(1)}/10** |`);
    lines.push(`| **Muscle Definition** | **${morphometrics.muscleDefinition.toUpperCase()}** (${(morphometrics.muscularityLevel * 10).toFixed(1)}/10) | Vascularity: \`${morphometrics.vascularity}\` |`);
    lines.push(`| **Adiposity & Body Fat** | **~${morphometrics.bodyFatPercentage}%** (\`${morphometrics.bodyFatCategory}\`) | Functional athletic conditioning |`);
    lines.push(`| **Bust / Pectoral Volume** | Index: **${(morphometrics.bustVolume * 10).toFixed(1)}/10** | Natural gravity teardrop modeling |`);
    lines.push(`| **Gluteal Galbe Curvature** | Index: **${(morphometrics.galbeCurvature * 10).toFixed(1)}/10** | Uncensored lordosis sagittal curvature |`);
    lines.push('');
    lines.push('### Uncensored Anatomical Profiles:');
    lines.push(`- **Thorax & Chest**: ${morphometrics.anatomicalFeatures.bustChestDescription}`);
    lines.push(`- **Waist & Abdomen**: ${morphometrics.anatomicalFeatures.waistAbdomenDescription}`);
    lines.push(`- **Hips & Glutes**: ${morphometrics.anatomicalFeatures.hipGluteDescription}`);
    lines.push(`- **Lower Limbs**: ${morphometrics.anatomicalFeatures.legsCalvesDescription}`);
    lines.push(`- **Shoulders & Back**: ${morphometrics.anatomicalFeatures.backShouldersDescription}`);
    lines.push(`- **Hands & Feet**: ${morphometrics.anatomicalFeatures.handsFeetDescription}`);
    lines.push('');

    // 5. Wardrobe & State
    lines.push(`## 5. Wardrobe Architecture (\`${blueprint.clothingStyle}\` - Mode: \`${blueprint.attireState}\`)`);
    lines.push('| Layer | Garment Description | Textile & Weight | Dynamic Folds & Physics | Tone / Palette |');
    lines.push('|---|---|---|---|---|');
    for (const layer of wardrobe) {
      lines.push(`| **${layer.layerName.toUpperCase()}** | ${layer.description} | ${layer.fabricType} | ${layer.tensionFoldsAndDrapes} | \`${layer.colorHexOrTone}\` |`);
    }
    lines.push('');

    // 6. Lighting & Camera
    lines.push('## 6. Lighting & Cinematic Optics');
    lines.push(`- **Preset**: ${lighting.presetName}`);
    lines.push(`- **Key Illumination**: ${lighting.primaryLightSource}`);
    lines.push(`- **Rim Contours**: ${lighting.rimLightingColor}`);
    lines.push(`- **Shadow Quality**: \`${lighting.shadowQuality}\` with Subsurface Scattering: **${lighting.subsurfaceScattering ? 'Enabled' : 'Disabled'}**`);
    lines.push(`- **Color Temperature**: ${lighting.colorTemperatureK}K (${lighting.colorGrading})`);
    lines.push(`- **Optics**: ${lighting.cameraFocalLength} lens at ${lighting.depthOfField}`);
    lines.push(`- **Composition**: ${lighting.shotComposition}`);
    lines.push('');

    // 7. Prompt Matrices
    lines.push('## 7. Multi-Model Diffusion Prompt Matrices');
    lines.push('');
    lines.push('### A. Midjourney v6.1');
    lines.push('```text');
    lines.push(promptMatrix.generatorSpecificPrompts.midjourneyV6);
    lines.push('```');
    lines.push('');
    lines.push('### B. Stable Diffusion XL (SDXL)');
    lines.push('```text');
    lines.push(promptMatrix.generatorSpecificPrompts.stableDiffusionXL);
    lines.push('```');
    lines.push('');
    lines.push('### C. Flux.1 (T5-XXL Narrative Prose)');
    lines.push('```text');
    lines.push(promptMatrix.generatorSpecificPrompts.flux1);
    lines.push('```');
    lines.push('');
    lines.push('### D. Master Model Sheet Turnaround Prompt');
    lines.push('```text');
    lines.push(promptMatrix.modelSheetTurnaroundPrompt);
    lines.push('```');
    lines.push('');
    lines.push('### E. Negative Prompt Matrix');
    lines.push('```text');
    lines.push(`General: ${promptMatrix.negativePrompts.general}`);
    lines.push(`Anatomical: ${promptMatrix.negativePrompts.anatomicalCorrection}`);
    lines.push(`Style: ${promptMatrix.negativePrompts.stylePreservation}`);
    lines.push('```');

    return lines.join('\n');
  }
}
