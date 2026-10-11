/**
 * Ollama Local AI Adapter with Transparent Deterministic Fallback.
 * Attempts to contact local Ollama on http://localhost:11434 to enrich
 * character lore, psychological depth, and prompt phrasing.
 * If offline or timed out, gracefully falls back to the deterministic procedural engine.
 */

import type {
  CharacterDesignBlueprint,
  CharacterGenerationResult,
  OllamaConfig,
  GenerationMetadata
} from '../types.ts';
import { OllamaHttpClient } from './client.ts';
import { ProceduralCharacterGenerator } from '../compiler/procedural.ts';
import type { GenerationOptions } from '../compiler/procedural.ts';
import { PromptCompiler } from '../compiler/prompts.ts';
import { evaluateBodyMorphometrics, evaluateFacialCanons } from '../anatomy/scientific.ts';

export class OllamaCharacterAdapter {
  private client: OllamaHttpClient;
  private config: OllamaConfig;

  constructor(config: OllamaConfig = {}) {
    this.config = {
      endpoint: config.endpoint || 'http://localhost:11434',
      model: config.model || 'mistral-nemo',
      timeoutMs: config.timeoutMs ?? 3000,
      temperature: config.temperature ?? 0.7,
      fallbackToProcedural: config.fallbackToProcedural ?? true
    };
    this.client = new OllamaHttpClient(this.config);
  }

  /**
   * Health check for CLI and diagnostics.
   */
  public async checkHealth(): Promise<{ online: boolean; endpoint: string; models: string[] }> {
    const online = await this.client.isAvailable();
    const models = online ? await this.client.listModels() : [];
    return {
      online,
      endpoint: this.config.endpoint || 'http://localhost:11434',
      models
    };
  }

  /**
   * Generates a complete character sheet with transparent Ollama enrichment and offline fallback.
   */
  public async generateCharacter(options: GenerationOptions = {}): Promise<CharacterGenerationResult> {
    const startTime = Date.now();
    const blueprint = ProceduralCharacterGenerator.generate(options);

    let metadata: GenerationMetadata = {
      engine: 'procedural_fallback',
      durationMs: 0,
      fallbackTriggered: false,
      timestamp: new Date().toISOString(),
      seed: blueprint.seed
    };

    // Attempt Ollama enrichment if requested or enabled
    const isOnline = await this.client.isAvailable();
    if (isOnline) {
      try {
        const availableModels = await this.client.listModels();
        const targetModel = (availableModels.length > 0 && availableModels.includes(this.config.model!))
          ? this.config.model!
          : (availableModels[0] || this.config.model || 'llama3');

        const enrichmentPrompt = `You are a master character designer for high-end webtoon and seinen manga.
Given this character summary:
Name: ${blueprint.bio.name}
Role: ${blueprint.bio.occupationOrRole}
Style: ${blueprint.artStyleCategory}
Archetype: ${blueprint.archetype}

Provide a 2-sentence intense backstory summary and 3 unique psychological traits. Return JSON format:
{"backstory": "...", "traits": ["...", "...", "..."]}`;

        const response = await this.client.generate(targetModel, enrichmentPrompt, {
          jsonFormat: true,
          temperature: this.config.temperature
        });

        // Parse response
        try {
          const parsed = JSON.parse(response.text) as { backstory?: string; traits?: string[] };
          if (parsed.backstory) {
            blueprint.bio.backstorySummary = parsed.backstory;
          }
          if (Array.isArray(parsed.traits) && parsed.traits.length > 0) {
            blueprint.bio.personalityKeywords = parsed.traits;
          }
        } catch {
          // If non-JSON returned, use raw text if plausible
          if (response.text.length > 20) {
            blueprint.bio.backstorySummary = response.text.slice(0, 300).trim();
          }
        }

        metadata = {
          engine: 'ollama',
          modelUsed: targetModel,
          endpointUsed: this.config.endpoint,
          durationMs: Date.now() - startTime,
          fallbackTriggered: false,
          timestamp: new Date().toISOString(),
          seed: blueprint.seed
        };
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : String(err);
        metadata = {
          engine: 'procedural_fallback',
          durationMs: Date.now() - startTime,
          fallbackTriggered: true,
          fallbackReason: `Ollama query encountered error (${reason}) - safely reverted to deterministic procedural engine.`,
          timestamp: new Date().toISOString(),
          seed: blueprint.seed
        };
      }
    } else {
      // Ollama daemon offline
      metadata = {
        engine: 'procedural_fallback',
        durationMs: Date.now() - startTime,
        fallbackTriggered: true,
        fallbackReason: `Ollama daemon offline at ${this.config.endpoint} - 100% autonomous procedural engine generated sheet offline.`,
        timestamp: new Date().toISOString(),
        seed: blueprint.seed
      };
    }

    // Compile prompts
    const promptMatrix = PromptCompiler.compile(blueprint);

    // Evaluate biometrics
    const bodyReport = evaluateBodyMorphometrics(blueprint.morphometrics, blueprint.bio.gender, blueprint.archetype);
    const facialReport = evaluateFacialCanons(blueprint.facialCanons, blueprint.bio.gender);

    const biometricReport = {
      scorePhiCompatibility: bodyReport.scorePhiCompatibility,
      facialHarmonicScore: facialReport.score,
      dimorphicStrengthScore: bodyReport.dimorphicStrengthScore,
      anatomicalIntegrityScore: bodyReport.anatomicalIntegrityScore,
      notes: [...facialReport.findings, ...bodyReport.notes],
      recommendations: bodyReport.recommendations
    };

    return {
      blueprint,
      promptMatrix,
      metadata,
      biometricReport
    };
  }
}
