#!/usr/bin/env node

/**
 * GLM Character Designer CLI
 * Executable command-line engine for procedural & Ollama character design.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import compiled engine components
import {
  ProceduralEngine,
  createCharacterDesign,
  createProceduralCharacterDesign,
  OllamaProvider,
  evaluateFacialCanons,
  CLOTHING_MATRICES,
  ETHNICITY_PRESETS,
} from '../dist/index.js';

function parseArgs(args) {
  const options = {
    command: args[0] || 'help',
    name: 'Kaelen Vance',
    gender: 'male',
    archetype: 'lean_athletic',
    style: 'korean_webtoon_cinematic',
    wardrobe: 'streetwear',
    ethnicity: 'east_asian',
    muscle: 0.65,
    whr: 0.85,
    bust: 0.40,
    galbe: 0.50,
    canthal: 4.5,
    mandibular: 116,
    format: 'stdout',
    outDir: (args[0] === 'demo')
      ? path.resolve(__dirname, '../examples')
      : path.resolve(process.cwd(), 'output/characters'),
    useOllama: false,
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'mistral-nemo',
    seed: undefined,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && args[i + 1]) options.name = args[++i];
    else if (arg === '--gender' && args[i + 1]) options.gender = args[++i];
    else if (arg === '--archetype' && args[i + 1]) options.archetype = args[++i];
    else if (arg === '--style' && args[i + 1]) options.style = args[++i];
    else if (arg === '--wardrobe' && args[i + 1]) options.wardrobe = args[++i];
    else if (arg === '--ethnicity' && args[i + 1]) options.ethnicity = args[++i];
    else if (arg === '--muscle' && args[i + 1]) options.muscle = parseFloat(args[++i]);
    else if (arg === '--whr' && args[i + 1]) options.whr = parseFloat(args[++i]);
    else if (arg === '--bust' && args[i + 1]) options.bust = parseFloat(args[++i]);
    else if (arg === '--galbe' && args[i + 1]) options.galbe = parseFloat(args[++i]);
    else if (arg === '--canthal' && args[i + 1]) options.canthal = parseFloat(args[++i]);
    else if (arg === '--mandibular' && args[i + 1]) options.mandibular = parseFloat(args[++i]);
    else if (arg === '--format' && args[i + 1]) options.format = args[++i];
    else if (arg === '--outDir' && args[i + 1]) options.outDir = path.resolve(process.cwd(), args[++i]);
    else if (arg === '--ollama') options.useOllama = true;
    else if (arg === '--ollama-model' && args[i + 1]) options.ollamaModel = args[++i];
    else if (arg === '--ollama-endpoint' && args[i + 1]) options.ollamaEndpoint = args[++i];
    else if (arg === '--seed' && args[i + 1]) options.seed = parseInt(args[++i], 10);
  }

  return options;
}

function printHelp() {
  console.log(`
⚡ GLM CHARACTER DESIGNER CLI ⚡
Autonomous Character Architecture, Biometrics & Multi-Model Prompt Engine

USAGE:
  node bin/cli.js <command> [options]

COMMANDS:
  generate          Generate a complete character blueprint and prompt matrix
  demo              Generate 5 master demonstration characters in examples/
  presets           List available styles, wardrobes, and archetypes
  test-ollama       Test local Ollama daemon connection and models
  help              Show this help message

OPTIONS for 'generate':
  --name <str>             Character name (default: "Kaelen Vance")
  --gender <gender>        male | female | androgynous
  --archetype <arch>       lean_athletic | hyper_muscular_hero | voluptuous_curvaceous | etc.
  --style <style>          korean_webtoon_cinematic | anime_cel_shaded_premium | etc.
  --wardrobe <style>       streetwear | techwear | modern_hanbok_kimono | light_armor | elegant
  --ethnicity <cat>        east_asian | african | caucasian | middle_eastern | south_asian | nordic
  --muscle <0.0-1.0>       Continuous muscular definition slider
  --whr <0.58-1.00>        Waist-to-Hip Ratio (e.g. 0.68 female hourglass, 0.85 male V-taper)
  --bust <0.0-1.0>         Bust/chest volume with natural gravity drape
  --galbe <0.0-1.0>        Gluteal shelf & thigh curve fullness
  --canthal <-5 to +10>    Canthal tilt in degrees (default: +4.5° for sharp manhwa gaze)
  --mandibular <105-135>   Gonial angle in degrees (110°-120° chiseled male, 125°-135° delicate female)
  --format <fmt>           stdout | json | markdown | both | all (default: stdout)
  --outDir <path>          Output directory for generated files (default: output/characters)
  --ollama                 Enable local Ollama AI enhancement (http://localhost:11434)
  --ollama-model <name>    Ollama model (default: mistral-nemo, fallback: mistral, qwen2.5)
  --seed <number>          Deterministic PRNG seed for reproducible generation
`);
}

async function runTestOllama(endpoint, model) {
  console.log(`\n🔍 Probing Ollama at ${endpoint}...`);
  const provider = new OllamaProvider({ endpoint, model, timeoutMs: 3000 });
  const isHealthy = await provider.isAvailable();

  if (isHealthy) {
    console.log(`✅ Ollama is ONLINE and reachable!`);
    const tags = await provider.listModels();
    console.log(`📦 Installed models (${tags.length}):`, tags.join(', ') || 'none');
    const hasRec = tags.some(m => m.includes('mistral-nemo') || m.includes('mistral') || m.includes('qwen2.5'));
    if (hasRec) {
      console.log(`✨ Recommended character design model detected!`);
    } else {
      console.log(`ℹ️ Tip: run 'ollama run mistral-nemo' for optimal character generation.`);
    }
  } else {
    console.log(`⚠️ Ollama is OFFLINE or unreachable at ${endpoint}.`);
    console.log(`ℹ️ The CLI will automatically use its internal deterministic procedural engine (0 failure).`);
    console.log(`ℹ️ To enable Ollama: download from https://ollama.com and run 'ollama run mistral-nemo'.`);
  }
}

function printPresets() {
  console.log('\n👗 GARDES-ROBES :');
  Object.keys(CLOTHING_MATRICES).forEach(k => {
    console.log(`  • ${k.padEnd(25)} : ${CLOTHING_MATRICES[k].name}`);
  });

  console.log('\n🌍 PHÉNOTYPES & ETHNICITÉS :');
  Object.keys(ETHNICITY_PRESETS).forEach(k => {
    console.log(`  • ${k.padEnd(25)} : ${ETHNICITY_PRESETS[k].name}`);
  });
}

function formatMarkdown(blueprint, promptMatrix) {
  return `# Fiche de Character Design : ${blueprint.bio.name}
**Alias / Titre** : ${blueprint.bio.alias || 'N/A'}
**Rôle** : ${blueprint.bio.occupationOrRole}
**Genre & Âge** : ${blueprint.bio.gender} (${blueprint.bio.age} ans)
**Origine** : ${blueprint.bio.ethnicityOrOrigin}
**Archétype** : \`${blueprint.archetype}\`
**Style Graphique** : \`${blueprint.artStyle}\`

---

## 1. Biométrie & Morphologie Corporelle
- **Stature** : ${blueprint.morphometrics.heightCm} cm (~${blueprint.morphometrics.headHeightRatio} têtes)
- **Ratio Taille/Hanches (WHR)** : **${blueprint.morphometrics.waistToHipRatio.toFixed(2)}**
- **V-Taper Épaules/Hanches (SHR)** : **${blueprint.morphometrics.shoulderToHipRatio.toFixed(2)}**
- **Définition Musculaire** : ${Math.round(blueprint.morphometrics.muscularityLevel * 100)}%
- **Poitrine / Buste** : ${blueprint.morphometrics.anatomicalFeatures.bustChestDescription}
- **Ventre & Taille** : ${blueprint.morphometrics.anatomicalFeatures.waistAbdomenDescription}
- **Hanches & Fessiers** : ${blueprint.morphometrics.anatomicalFeatures.hipGluteDescription}

---

## 2. Architecture Faciale & Canons
- **Canthal Tilt** : ${blueprint.facialCanons.canthalTiltDegrees >= 0 ? '+' : ''}${blueprint.facialCanons.canthalTiltDegrees}° (Regard acéré Manhwa)
- **Angle Mandibulaire (Gonial)** : ${blueprint.facialCanons.gonialAngleDegrees}°
- **Yeux** : ${blueprint.facialCanons.eyeDetails}
- **Mâchoire & Menton** : ${blueprint.facialCanons.jawlineDescription}

---

## 3. Garde-Robe & Layering (${blueprint.clothingStyle})
${blueprint.wardrobe.map(l => `- **${l.layerName.toUpperCase()}** : ${l.description} (*${l.fabricType}*) — ${l.tensionFoldsAndDrapes}`).join('\n')}

---

## 4. Matrice de Prompts pour Générateurs d'Images

### 🌟 Midjourney v6
\`\`\`text
${promptMatrix.generatorSpecificPrompts.midjourneyV6}
\`\`\`

### ✨ FLUX.1 (Dev / Schnell)
\`\`\`text
${promptMatrix.generatorSpecificPrompts.flux1}
\`\`\`

### 🛡️ Stable Diffusion XL (SDXL)
**Prompt Positif** :
\`\`\`text
${promptMatrix.generatorSpecificPrompts.stableDiffusionXL}
\`\`\`

**Prompt Négatif** :
\`\`\`text
${promptMatrix.negativePrompts.general}
\`\`\`

### 📐 Master Turnaround Model Sheet
\`\`\`text
${promptMatrix.modelSheetTurnaroundPrompt}
\`\`\`
`;
}

async function runGenerate(opts) {
  console.log(`\n⚡ Generating character design: "${opts.name}" (${opts.gender})...`);

  const spec = {
    name: opts.name,
    gender: opts.gender,
    archetype: opts.archetype,
    artStyle: opts.style,
    clothingStyle: opts.wardrobe,
    ethnicity: opts.ethnicity,
    seed: opts.seed,
    granularSliders: {
      muscularitySlider: opts.muscle,
      waistToHipRatio: opts.whr,
      bustVolumeSlider: opts.bust,
      galbeSlider: opts.galbe,
      canthalTiltDegrees: opts.canthal,
      gonialAngleDegrees: opts.mandibular,
    },
  };

  let result;
  if (opts.useOllama) {
    console.log(`🤖 Consulting local Ollama daemon (${opts.ollamaModel})...`);
    result = await createCharacterDesign(spec, {
      endpoint: opts.ollamaEndpoint,
      model: opts.ollamaModel,
      timeoutMs: 8000,
      fallbackToProcedural: true,
    });
  } else {
    result = createProceduralCharacterDesign(spec);
  }

  const { blueprint, promptMatrix, metadata } = result;
  const facialEval = evaluateFacialCanons(blueprint.facialCanons, blueprint.bio.gender);

  if (opts.format === 'stdout' || opts.format === 'both') {
    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`👤 IDENTITÉ : ${blueprint.bio.name} (${blueprint.bio.alias || blueprint.bio.occupationOrRole})`);
    console.log(`📐 MORPHOLOGIE : ${blueprint.morphometrics.heightCm}cm | WHR ${blueprint.morphometrics.waistToHipRatio.toFixed(2)} | SHR ${blueprint.morphometrics.shoulderToHipRatio.toFixed(2)} | Muscle ${Math.round(blueprint.morphometrics.muscularityLevel * 100)}%`);
    console.log(`👁️ VISAGE : Canthal Tilt ${blueprint.facialCanons.canthalTiltDegrees >= 0 ? '+' : ''}${blueprint.facialCanons.canthalTiltDegrees}° | Mâchoire ${blueprint.facialCanons.gonialAngleDegrees}° | Pommettes ${Math.round(blueprint.facialCanons.cheekboneProminence * 100)}%`);
    console.log(`👗 TENUE : ${blueprint.clothingStyle} (${blueprint.wardrobe.length} couches)`);
    console.log(`⚡ MOTEUR : ${metadata.engine} (${metadata.durationMs}ms)`);
    console.log(`══════════════════════════════════════════════════════════════\n`);

    console.log(`🎨 [MIDJOURNEY V6 PROMPT] :\n${promptMatrix.generatorSpecificPrompts.midjourneyV6}\n`);
    console.log(`✨ [FLUX.1 PROMPT] :\n${promptMatrix.generatorSpecificPrompts.flux1}\n`);
    console.log(`🛡️ [SDXL POSITIVE PROMPT] :\n${promptMatrix.generatorSpecificPrompts.stableDiffusionXL}\n`);
    console.log(`🚫 [SDXL NEGATIVE PROMPT] :\n${promptMatrix.negativePrompts.general}\n`);
  }

  if (opts.format === 'json' || opts.format === 'both') {
    fs.mkdirSync(opts.outDir, { recursive: true });
    const filename = `${blueprint.bio.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_blueprint.json`;
    const fullPath = path.join(opts.outDir, filename);
    const jsonStr = JSON.stringify({ blueprint, promptMatrix, metadata }, null, 2);
    fs.writeFileSync(fullPath, jsonStr, 'utf-8');
    console.log(`💾 JSON Blueprint saved to: ${fullPath}`);
  }

  if (opts.format === 'markdown' || opts.format === 'both') {
    fs.mkdirSync(opts.outDir, { recursive: true });
    const filename = `${blueprint.bio.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_sheet.md`;
    const fullPath = path.join(opts.outDir, filename);
    const mdStr = formatMarkdown(blueprint, promptMatrix);
    fs.writeFileSync(fullPath, mdStr, 'utf-8');
    console.log(`📄 Markdown Sheet saved to: ${fullPath}`);
  }
}

async function runDemo(opts) {
  console.log(`\n🌟 Generating 5 Master Reference Demonstration Characters in ${opts.outDir}...`);
  fs.mkdirSync(opts.outDir, { recursive: true });

  const demoSpecs = [
    {
      name: 'Sung Kang',
      alias: 'Monarch of Shadows',
      gender: 'male',
      archetype: 'hyper_muscular_hero',
      artStyle: 'korean_webtoon_cinematic',
      clothingStyle: 'streetwear',
      ethnicity: 'east_asian',
      granularSliders: { muscularitySlider: 0.88, waistToHipRatio: 0.84, canthalTiltDegrees: 5.5, gonialAngleDegrees: 115 },
    },
    {
      name: 'Aurelia Vance',
      alias: 'Valkyrie Sovereign',
      gender: 'female',
      archetype: 'voluptuous_curvaceous',
      artStyle: 'korean_webtoon_cinematic',
      clothingStyle: 'modern_hanbok_kimono',
      ethnicity: 'east_asian',
      granularSliders: { muscularitySlider: 0.35, waistToHipRatio: 0.67, bustVolumeSlider: 0.80, galbeSlider: 0.82, canthalTiltDegrees: 4.0 },
    },
    {
      name: 'Malik Thorne',
      alias: 'Iron Sentinel',
      gender: 'male',
      archetype: 'stocky_powerhouse',
      artStyle: 'tactical_semi_realistic',
      clothingStyle: 'techwear',
      ethnicity: 'african',
      granularSliders: { muscularitySlider: 0.92, waistToHipRatio: 0.88, canthalTiltDegrees: 3.0, gonialAngleDegrees: 112 },
    },
    {
      name: 'Elysia Frost',
      alias: 'Cyber Duchess',
      gender: 'female',
      archetype: 'slender_elegant',
      artStyle: 'anime_cel_shaded_premium',
      clothingStyle: 'elegant',
      ethnicity: 'nordic',
      granularSliders: { muscularitySlider: 0.20, waistToHipRatio: 0.69, bustVolumeSlider: 0.50, galbeSlider: 0.60, canthalTiltDegrees: 4.5 },
    },
    {
      name: 'Kaelen Zephyr',
      alias: 'Neon Phantom Courier',
      gender: 'androgynous',
      archetype: 'lean_athletic',
      artStyle: 'anime_cel_shaded_premium',
      clothingStyle: 'techwear',
      ethnicity: 'east_asian',
      granularSliders: { muscularitySlider: 0.45, waistToHipRatio: 0.76, canthalTiltDegrees: 5.0, gonialAngleDegrees: 122 },
    },
  ];

  for (const spec of demoSpecs) {
    console.log(`  ▶ Generating ${spec.name} (${spec.alias})...`);
    const result = createProceduralCharacterDesign(spec);
    const { blueprint, promptMatrix, metadata } = result;

    const baseName = spec.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const jsonPath = path.join(opts.outDir, `${baseName}.json`);
    const mdPath = path.join(opts.outDir, `${baseName}.md`);

    fs.writeFileSync(jsonPath, JSON.stringify({ blueprint, promptMatrix, metadata }, null, 2), 'utf-8');
    fs.writeFileSync(mdPath, formatMarkdown(blueprint, promptMatrix), 'utf-8');
  }

  console.log(`\n✅ All 5 demo characters generated successfully in: ${opts.outDir}`);
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  switch (opts.command) {
    case 'generate':
      await runGenerate(opts);
      break;
    case 'demo':
      await runDemo(opts);
      break;
    case 'presets':
      printPresets();
      break;
    case 'test-ollama':
      await runTestOllama(opts.ollamaEndpoint, opts.ollamaModel);
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch(err => {
  console.error('\n❌ Execution Error:', err);
  process.exit(1);
});
