/**
 * Hyper Character Designer & Aesthetic Engineering Suite
 * Main Entry Point.
 */

export * from './core/types.js';
export * from './core/scientific-anatomy.js';
export * from './core/granular-controls.js';
export * from './core/procedural-engine.js';
export * from './providers/ollama.js';

import { CharacterGenerationResult, OllamaConfig } from './core/types.js';
import { ProceduralGenerationSpec, ProceduralEngine } from './core/procedural-engine.js';
import { OllamaProvider } from './providers/ollama.js';

/**
 * Convenient master function to design and generate a character with prompt matrix.
 * Will attempt Ollama first if configured/available, otherwise seamlessly
 * uses the procedural engine.
 */
export async function createCharacterDesign(
  spec: ProceduralGenerationSpec = {},
  ollamaOptions?: OllamaConfig
): Promise<CharacterGenerationResult> {
  const provider = new OllamaProvider(ollamaOptions);
  return provider.generateCharacter(spec);
}

/**
 * Generates a character purely with the deterministic procedural engine (offline, instant).
 */
export function createProceduralCharacterDesign(
  spec: ProceduralGenerationSpec = {}
): CharacterGenerationResult {
  const startTime = Date.now();
  const blueprint = ProceduralEngine.generateBlueprint(spec);
  const promptMatrix = ProceduralEngine.compilePrompts(blueprint);

  return {
    blueprint,
    promptMatrix,
    metadata: {
      engine: 'procedural_fallback',
      durationMs: Date.now() - startTime,
      fallbackTriggered: false,
      timestamp: new Date().toISOString()
    }
  };
}
