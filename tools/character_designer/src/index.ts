/**
 * Character Designer Engine - Main API Entry Point.
 */

export type * from './types.ts';

// Compiler
export { DeterministicPRNG } from './compiler/prng.ts';
export { ProceduralCharacterGenerator } from './compiler/procedural.ts';
export type { GenerationOptions } from './compiler/procedural.ts';
export { PromptCompiler } from './compiler/prompts.ts';
export { MarkdownExporter } from './compiler/markdown.ts';
export { JsonExporter } from './compiler/json.ts';

// Ollama Integration
export { OllamaHttpClient } from './ollama/client.ts';
export { OllamaCharacterAdapter } from './ollama/adapter.ts';

// Anatomy & Biometrics
export { generateFacialCanons } from './anatomy/facial.ts';
export { generateBodyMorphometrics } from './anatomy/body.ts';
export { evaluateFacialCanons, evaluateBodyMorphometrics } from './anatomy/scientific.ts';

// Styles, Wardrobe & Optics
export { getStylePreset, STYLE_PRESETS } from './styles/presets.ts';
export { getWardrobeLayers, WARDROBE_PRESETS } from './styles/wardrobes.ts';
export { getLightingProfile, LIGHTING_PRESETS } from './styles/lighting.ts';

// Showcase Presets
export { DEMO_CHARACTERS } from './presets/demo-characters.ts';
