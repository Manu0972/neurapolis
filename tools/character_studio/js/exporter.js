/**
 * Exporter and Serialization Module for GLM Character Studio.
 * Generates JSON and Markdown outputs, and handles file download / JSON import.
 */

import { evaluateBiometrics } from './biometrics.js';
import { generatePromptMatrix } from './prompt_generator.js';

/**
 * Serializes character data to a structured JSON blueprint.
 * @param {Object} char
 * @param {Object} [biometrics]
 * @param {Object} [prompts]
 * @returns {string} Pretty-printed JSON
 */
export function exportToJSON(char, biometrics = null, prompts = null) {
  const bio = biometrics || evaluateBiometrics(char);
  const pr = prompts || generatePromptMatrix(char, 'turnaround');

  const blueprint = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    generator: 'GLM Hyper Character Studio v1.0',
    character: {
      identity: {
        id: char.id || `char_${Date.now()}`,
        name: char.name,
        alias: char.alias || '',
        role: char.role || '',
        gender: char.gender,
        age: char.age,
        backstory: char.backstory || ''
      },
      morphometrics: {
        heightCm: char.heightCm,
        somatotype: char.somatotype,
        waistToHipRatio: char.whr,
        shoulderToHipRatio: char.vTaper,
        muscularityLevel: char.muscularity,
        galbeCurvature: char.galbe,
        vascularity: char.vascularity,
        bustVolume: char.bustVolume
      },
      facialCanons: {
        canthalTiltDegrees: char.canthalTilt,
        mandibularAngleDegrees: char.mandibularAngle,
        facialSymmetry: char.facialSymmetry,
        cheekboneProminence: char.cheekbones
      },
      styling: {
        artStyle: char.style,
        wardrobe: char.wardrobe,
        wardrobeMode: char.wardrobeMode || 'duty',
        palette: {
          primaryHex: char.colors.primary,
          secondaryHex: char.colors.secondary,
          accentHex: char.colors.accent,
          skinHex: char.colors.skin,
          hairHex: char.colors.hair,
          eyeHex: char.colors.eyes
        }
      },
      biometricEvaluation: {
        phiCompatibilityScore: bio.phiScore,
        dimorphicStrengthScore: bio.dimorphicScore,
        vTaperIndex: bio.vTaperIndex,
        athleticPower: bio.athleticPower,
        facialSharpness: bio.facialSharpness,
        aestheticHarmonyScore: bio.aestheticHarmony,
        radarMetrics: bio.radarMetrics
      },
      promptMatrix: {
        midjourneyV6: pr.midjourney,
        sdxl: {
          positive: pr.sdxl.positive,
          negative: pr.sdxl.negative
        },
        flux1: pr.flux
      }
    }
  };

  return JSON.stringify(blueprint, null, 2);
}

/**
 * Generates an executive Markdown Character Sheet.
 * @param {Object} char
 * @param {Object} [biometrics]
 * @param {Object} [prompts]
 * @returns {string} Markdown text
 */
export function exportToMarkdown(char, biometrics = null, prompts = null) {
  const bio = biometrics || evaluateBiometrics(char);
  const pr = prompts || generatePromptMatrix(char, 'turnaround');

  return `# Character Model Sheet — ${char.name}
*${char.alias ? `"${char.alias}" — ` : ''}${char.role}*

---

## 1. Identity & Style Summary
- **Gender**: \`${char.gender}\`
- **Age**: ${char.age}
- **Art Style**: \`${char.style}\`
- **Wardrobe**: \`${char.wardrobe}\` (Mode: \`${char.wardrobeMode || 'duty'}\`)
- **Lore**: ${char.backstory || 'N/A'}

## 2. Anatomical & Morphometric Dimensions
| Parameter | Value | Interpretation |
|---|---|---|
| **Height** | \`${char.heightCm} cm\` | ~${bio.headRatio} heads tall (Heroic proportion) |
| **Somatotype** | \`${char.somatotype}\` | Athletic foundation |
| **Waist-to-Hip Ratio (WHR)** | \`${char.whr.toFixed(2)}\` | Morphological curvature |
| **V-Taper (SHR)** | \`${char.vTaper.toFixed(2)}\` | Upper body clavicle flare |
| **Muscle Definition** | \`${(char.muscularity * 100).toFixed(0)}%\` | Sculpted striations & rectus abdominis |
| **Galbe / Glute Curvature** | \`${(char.galbe * 100).toFixed(0)}%\` | Posterior curvature & lordosis shelf |
| **Vascularity** | \`${(char.vascularity * 100).toFixed(0)}%\` | Forearm & deltoid vein network |
| **Bust / Chest Volume** | \`${(char.bustVolume * 100).toFixed(0)}%\` | Thoracic volume & natural teardrop drape |

## 3. Craniofacial Canons
| Canon | Value | Biometric Note |
|---|---|---|
| **Canthal Tilt** | \`${char.canthalTilt >= 0 ? '+' : ''}${char.canthalTilt.toFixed(1)}°\` | Eye aperture slant & intense magnetic gaze |
| **Mandibular Gonial Angle** | \`${char.mandibularAngle}°\` | Jawline contour and ramus definition |
| **Facial Symmetry** | \`${(char.facialSymmetry * 100).toFixed(0)}%\` | Neoclassical bilateral balance |
| **Cheekbone Prominence** | \`${(char.cheekbones * 100).toFixed(0)}%\` | Malar projection & high-fashion light reflection |

## 4. Chromatic Palette
- **Primary**: \`${char.colors.primary}\`
- **Secondary**: \`${char.colors.secondary}\`
- **Electric Accent**: \`${char.colors.accent}\`
- **Skin Undertone**: \`${char.colors.skin}\`
- **Hair**: \`${char.colors.hair}\`
- **Eye Glow**: \`${char.colors.eyes}\`

## 5. Biometric Evaluation Scores
- **Golden Ratio (Phi) Score**: \`${bio.phiScore} / 100\`
- **Dimorphic Strength**: \`${bio.dimorphicScore} / 100\`
- **V-Taper Dominance Index**: \`${bio.vTaperIndex} / 100\`
- **Athletic Power Index**: \`${bio.athleticPower} / 100\`
- **Craniofacial Sharpness**: \`${bio.facialSharpness} / 100\`
- **Overall Aesthetic Harmony**: \`${bio.aestheticHarmony} / 100\`

---

## 6. Prompt Matrix

### A. Midjourney v6.1 Prompt
\`\`\`text
${pr.midjourney}
\`\`\`

### B. Stable Diffusion XL (SDXL) Prompt
**Positive**:
\`\`\`text
${pr.sdxl.positive}
\`\`\`

**Negative**:
\`\`\`text
${pr.sdxl.negative}
\`\`\`

### C. Flux.1 Natural Language Prompt
\`\`\`text
${pr.flux}
\`\`\`

---
*Exported from GLM Character Studio on ${new Date().toLocaleDateString()}*
`;
}

/**
 * Triggers a client-side file download.
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 */
export function triggerFileDownload(filename, content, mimeType = 'text/plain') {
  if (typeof window === 'undefined' || !window.document) return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Parses and restores character state from uploaded JSON text.
 * @param {string} jsonText
 * @returns {Object} character state
 */
export function parseImportJSON(jsonText) {
  const data = JSON.parse(jsonText);
  const root = data.character || data;

  const char = {
    id: root.identity?.id || root.id || `char_${Date.now()}`,
    name: root.identity?.name || root.name || 'Imported Character',
    alias: root.identity?.alias || root.alias || '',
    role: root.identity?.role || root.role || 'Operative',
    gender: root.identity?.gender || root.gender || 'male',
    age: Number(root.identity?.age || root.age || 24),
    heightCm: Number(root.morphometrics?.heightCm || root.heightCm || 180),
    somatotype: root.morphometrics?.somatotype || root.somatotype || 'mesomorph',
    whr: Number(root.morphometrics?.waistToHipRatio || root.whr || 0.75),
    vTaper: Number(root.morphometrics?.shoulderToHipRatio || root.vTaper || 1.45),
    muscularity: Number(root.morphometrics?.muscularityLevel || root.muscularity || 0.65),
    galbe: Number(root.morphometrics?.galbeCurvature || root.galbe || 0.50),
    vascularity: Number(root.morphometrics?.vascularity || root.vascularity || 0.30),
    bustVolume: Number(root.morphometrics?.bustVolume || root.bustVolume || 0.40),
    canthalTilt: Number(root.facialCanons?.canthalTiltDegrees || root.canthalTilt || 4.0),
    mandibularAngle: Number(root.facialCanons?.mandibularAngleDegrees || root.mandibularAngle || 118),
    facialSymmetry: Number(root.facialCanons?.facialSymmetry || root.facialSymmetry || 0.96),
    cheekbones: Number(root.facialCanons?.cheekboneProminence || root.cheekbones || 0.70),
    style: root.styling?.artStyle || root.style || 'webtoon_action',
    wardrobe: root.styling?.wardrobe || root.wardrobe || 'techwear',
    wardrobeMode: root.styling?.wardrobeMode || root.wardrobeMode || 'duty',
    colors: {
      primary: root.styling?.palette?.primaryHex || root.colors?.primary || '#0f111a',
      secondary: root.styling?.palette?.secondaryHex || root.colors?.secondary || '#1e1b4b',
      accent: root.styling?.palette?.accentHex || root.colors?.accent || '#00e5ff',
      skin: root.styling?.palette?.skinHex || root.colors?.skin || '#fbebe0',
      hair: root.styling?.palette?.hairHex || root.colors?.hair || '#09090b',
      eyes: root.styling?.palette?.eyeHex || root.colors?.eyes || '#00f0ff'
    },
    backstory: root.identity?.backstory || root.backstory || ''
  };

  return char;
}
