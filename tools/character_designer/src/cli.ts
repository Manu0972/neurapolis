#!/usr/bin/env node
/**
 * Character Designer CLI Implementation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  OllamaCharacterAdapter,
  MarkdownExporter,
  JsonExporter,
  DEMO_CHARACTERS
} from './index.ts';
import type {
  GenderIdentity,
  BodyArchetype,
  ArtStyleCategory,
  ClothingStyleCategory,
  AttireState,
  MuscleDefinitionDiscrete
} from './index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0] || 'help';

  if (command === 'help' || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (command === 'test-ollama') {
    await handleTestOllama(args);
    return;
  }

  if (command === 'demo') {
    await handleDemo(args);
    return;
  }

  if (command === 'generate' || !command.startsWith('-')) {
    await handleGenerate(args.filter(a => a !== 'generate'));
    return;
  }

  printHelp();
}

function printHelp(): void {
  console.log(`
================================================================================
  HYPER CHARACTER DESIGNER CLI - Manhwa / Webtoon & Biometric Generator
================================================================================

Commands:
  generate          Generate a character sheet and prompt matrix
  demo              Generate all 5 master demonstration sheets into examples/
  test-ollama       Test local Ollama daemon connection (http://localhost:11434)
  help              Show this help menu

Options for 'generate':
  --seed <str>              Deterministic seed (e.g. 'hunter-alpha-42')
  --name <str>              Character full name
  --gender <m|f|andro>      male | female | androgynous
  --style <category>        "Webtoon Action" | "Anime" | "Seinen" | "Semi-realistic"
  --archetype <type>        hyper_muscular_hero | voluptuous_curvaceous | lean_athletic |
                            slender_elegant | soft_athletic | stocky_powerhouse
  --muscle <level>          soft | toned | athletic | ripped | shredded
  --wardrobe <style>        streetwear | techwear | fantasy | martial | classic_tailoring
  --attire <state>          duty | private | hybrid (default: duty)
  --lighting <preset>       chiaroscuro_dramatic | hygge_golden_hour | studio_softbox |
                            cyber_neon_noir | ethereal_sunlight
  --ollama                  Attempt local Ollama background enrichment (Option B)
  --ollama-model <name>     Ollama model to target (default: mistral-nemo / llama3)
  --ollama-url <url>        Ollama endpoint (default: http://localhost:11434)
  --format <json|md|all>    Output format (default: all)
  --out <dir>               Target output directory (default: current working dir)

Examples:
  node bin/cli.js generate --seed "jinwoo-1" --style "Webtoon Action" --muscle ripped
  node bin/cli.js generate --gender female --style "Semi-realistic" --wardrobe streetwear
  node bin/cli.js demo --out ./examples
  node bin/cli.js test-ollama
`);
}

async function handleTestOllama(args: string[]): Promise<void> {
  const urlArg = getArg(args, '--ollama-url') || 'http://localhost:11434';
  console.log(`[Ollama Adapter] Testing connection to ${urlArg}...`);
  const adapter = new OllamaCharacterAdapter({ endpoint: urlArg });
  const status = await adapter.checkHealth();

  if (status.online) {
    console.log(`✅ SUCCESS: Local Ollama daemon is ONLINE at ${status.endpoint}`);
    console.log(`   Available local models (${status.models.length}):`);
    for (const m of status.models) {
      console.log(`   - ${m}`);
    }
  } else {
    console.log(`⚠️ OFFLINE: Ollama daemon not reachable at ${status.endpoint}`);
    console.log(`   Deterministic procedural offline engine will operate autonomously with 0 errors.`);
  }
}

async function handleDemo(args: string[]): Promise<void> {
  const outDir = getArg(args, '--out') || path.resolve(__dirname, '../examples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`[Demo Generator] Compiling 5 demonstration character sheets into ${outDir}...`);

  const adapter = new OllamaCharacterAdapter();

  for (let i = 0; i < DEMO_CHARACTERS.length; i++) {
    const demo = DEMO_CHARACTERS[i];
    console.log(`  -> [${i + 1}/5] Generating ${demo.filenamePrefix} (${demo.options.name})...`);
    
    const result = await adapter.generateCharacter(demo.options);

    const jsonContent = JsonExporter.export(result);
    const mdContent = MarkdownExporter.export(result);

    const jsonPath = path.join(outDir, `${demo.filenamePrefix}.json`);
    const mdPath = path.join(outDir, `${demo.filenamePrefix}.md`);

    fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
    fs.writeFileSync(mdPath, mdContent, 'utf-8');

    console.log(`     Saved: ${path.basename(jsonPath)} & ${path.basename(mdPath)}`);
  }

  console.log(`✅ All 5 demonstration character sheets successfully generated in ${outDir}!`);
}

async function handleGenerate(args: string[]): Promise<void> {
  const seed = getArg(args, '--seed') || `cli-seed-${Date.now()}`;
  const name = getArg(args, '--name');
  const gender = getArg(args, '--gender') as GenderIdentity | undefined;
  const style = getArg(args, '--style') as ArtStyleCategory | undefined;
  const archetype = getArg(args, '--archetype') as BodyArchetype | undefined;
  const muscle = getArg(args, '--muscle') as MuscleDefinitionDiscrete | undefined;
  const wardrobe = getArg(args, '--wardrobe') as ClothingStyleCategory | undefined;
  const attire = getArg(args, '--attire') as AttireState | undefined;
  const lighting = getArg(args, '--lighting');
  const outDir = getArg(args, '--out') || process.cwd();
  const format = getArg(args, '--format') || 'all';
  const useOllama = args.includes('--ollama');
  const ollamaUrl = getArg(args, '--ollama-url') || 'http://localhost:11434';
  const ollamaModel = getArg(args, '--ollama-model');

  const adapter = new OllamaCharacterAdapter({
    endpoint: ollamaUrl,
    model: ollamaModel,
    fallbackToProcedural: true
  });

  console.log(`[Character Designer] Compiling character with seed: "${seed}"...`);
  if (useOllama) {
    console.log(`[Character Designer] Local Ollama enrichment enabled (${ollamaUrl})...`);
  }

  const result = await adapter.generateCharacter({
    seed,
    name,
    gender,
    style,
    archetype,
    clothingStyle: wardrobe,
    attireState: attire,
    lightingPreset: lighting,
    sliders: {
      muscularityDiscrete: muscle
    }
  });

  const slug = result.blueprint.bio.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const jsonFilename = `${slug}_${result.blueprint.id}.json`;
  const mdFilename = `${slug}_${result.blueprint.id}.md`;

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (format === 'json' || format === 'all') {
    const jsonPath = path.join(outDir, jsonFilename);
    fs.writeFileSync(jsonPath, JsonExporter.export(result), 'utf-8');
    console.log(`  📄 Exported JSON: ${jsonPath}`);
  }

  if (format === 'md' || format === 'markdown' || format === 'all') {
    const mdPath = path.join(outDir, mdFilename);
    fs.writeFileSync(mdPath, MarkdownExporter.export(result), 'utf-8');
    console.log(`  📝 Exported Markdown: ${mdPath}`);
  }

  console.log('');
  console.log(`✅ Character "${result.blueprint.bio.name}" successfully compiled!`);
  console.log(`   Engine: ${result.metadata.engine} (Fallback: ${result.metadata.fallbackTriggered})`);
  console.log(`   Phi Score: ${result.biometricReport?.scorePhiCompatibility}% | Facial Harmonic: ${result.biometricReport?.facialHarmonicScore}%`);
  console.log(`   Midjourney Prompt: ${result.promptMatrix.generatorSpecificPrompts.midjourneyV6.slice(0, 110)}...`);
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch(err => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}
