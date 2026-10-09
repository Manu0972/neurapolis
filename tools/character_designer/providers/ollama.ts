/**
 * Native Ollama Provider for the Character Designer Engine.
 * Dialogues directly with Ollama daemon at http://localhost:11434 via
 * /api/generate or /v1/chat/completions (models: mistral-nemo, mistral, qwen2.5).
 * Guarantees zero-failure resilience via automatic fallback to the deterministic
 * procedural engine when Ollama is offline or encounters errors.
 */

import {
  CharacterDesignBlueprint,
  PromptMatrixOutput,
  CharacterGenerationResult,
  OllamaConfig,
  GenerationMetadata
} from '../core/types.js';

import {
  ProceduralEngine,
  ProceduralGenerationSpec
} from '../core/procedural-engine.js';

import {
  buildMorphometrics
} from '../core/granular-controls.js';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
export const DEFAULT_MODELS = ['mistral-nemo', 'mistral', 'qwen2.5'];

export type FetchFunction = (url: string | URL, init?: RequestInit) => Promise<Response>;

/**
 * Robustly extracts and parses JSON from raw LLM text,
 * stripping markdown code fences (```json ... ```) or finding outer object boundaries.
 */
export function extractJsonFromText(rawText: string): any {
  const trimmed = rawText.trim();
  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Markdown code fences: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Find outer JSON object boundaries { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch {}
  }

  throw new Error(`Failed to extract valid JSON from response: ${trimmed.slice(0, 120)}...`);
}

export interface OllamaProviderOptions extends OllamaConfig {
  /** Optional custom fetch implementation (useful for testing and sandboxing) */
  fetcher?: FetchFunction;
}

export class OllamaProvider {
  private endpoint: string;
  private model: string;
  private timeoutMs: number;
  private temperature: number;
  private protocol: 'api_generate' | 'v1_chat_completions';
  private fallbackToProcedural: boolean;
  private fetcher: FetchFunction;
  constructor(options: OllamaProviderOptions = {}) {
    const envHost = typeof (globalThis as any).process !== 'undefined' ? (globalThis as any).process.env?.OLLAMA_HOST : undefined;
    this.endpoint = (options.endpoint ?? envHost ?? DEFAULT_OLLAMA_ENDPOINT).replace(/\/+$/, '');
    this.model = options.model ?? 'mistral-nemo';
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.temperature = options.temperature ?? 0.7;
    this.protocol = options.protocol ?? 'api_generate';
    this.fallbackToProcedural = options.fallbackToProcedural ?? true;
    this.fetcher = options.fetcher ?? ((url, init) => fetch(url, init));
  }

  /**
   * Pings the Ollama server to check whether it is alive and responsive.
   */
  async isAvailable(timeoutMs: number = 2500): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let res = await this.fetcher(`${this.endpoint}/api/version`, {
        method: 'GET',
        signal: controller.signal
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await this.fetcher(`${this.endpoint}/`, {
          method: 'GET',
          signal: controller.signal
        }).catch(() => null);
      }

      clearTimeout(timer);
      return !!(res && res.ok);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the list of available models installed in Ollama with timeout.
   */
  async listModels(timeoutMs: number = 2500): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await this.fetcher(`${this.endpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timer);
      if (!res.ok) return [];
      const data = await res.json() as { models?: Array<{ name: string }> };
      return data.models?.map(m => m.name) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Generates character specifications via Ollama native /api/generate.
   */
  async callApiGenerate(prompt: string, modelToUse: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetcher(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: this.temperature
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Ollama /api/generate responded with HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json() as { response?: string };
      if (!data.response) {
        throw new Error('Ollama returned empty response body');
      }

      return data.response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Generates character specifications via OpenAI-compatible /v1/chat/completions.
   */
  async callV1ChatCompletions(systemPrompt: string, userPrompt: string, modelToUse: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetcher(`${this.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          response_format: { type: 'json_object' },
          temperature: this.temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Ollama /v1/chat/completions responded with HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Ollama /v1/chat/completions returned empty message content');
      }

      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Master generation entry point:
   * Queries Ollama with mistral-nemo / mistral / qwen2.5.
   * If Ollama is offline or fails, smoothly falls back to ProceduralEngine.
   */
  async generateCharacter(spec: ProceduralGenerationSpec = {}): Promise<CharacterGenerationResult> {
    const startTime = Date.now();
    let blueprint: CharacterDesignBlueprint | null = null;
    let fallbackTriggered = false;
    let fallbackReason: string | undefined;
    let modelUsed: string | undefined;

    // Check if Ollama is available
    const available = await this.isAvailable();

    if (available) {
      try {
        // Attempt generation with configured model or fallbacks
        const availableModels = await this.listModels();
        const candidateModels = [
          this.model,
          ...DEFAULT_MODELS.filter(m => m !== this.model)
        ];

        // Pick best matching model or first available
        const selectedModel = candidateModels.find(m => availableModels.some(am => am.startsWith(m))) 
          || (availableModels.length > 0 ? availableModels[0]! : this.model);

        modelUsed = selectedModel;

        const systemPrompt = `You are an elite Character Design and Biometrics Director for high-tier Korean webtoons and cinematic anime.
Output ONLY valid JSON representing a character blueprint with bio, physical traits, and detailed wardrobe.`;

        const userPrompt = `Create a character design blueprint in JSON with:
Name: ${spec.name ?? 'Random unique name'}
Gender: ${spec.gender ?? 'male/female'}
Ethnicity: ${spec.ethnicity ?? 'east_asian'}
Archetype: ${spec.archetype ?? 'heroic'}
Clothing Style: ${spec.clothingStyle ?? 'streetwear'}
Art Style: ${spec.artStyle ?? 'korean_webtoon_cinematic'}
Include detailed facialCanons, morphometrics (with muscularity 0.0-1.0, bust volume, galbe curve), wardrobe layers, and lighting profile.`;

        let rawResponse: string;

        if (this.protocol === 'v1_chat_completions') {
          rawResponse = await this.callV1ChatCompletions(systemPrompt, userPrompt, selectedModel);
        } else {
          rawResponse = await this.callApiGenerate(`${systemPrompt}\n\n${userPrompt}`, selectedModel);
        }

        let parsed = extractJsonFromText(rawResponse);
        if (parsed && typeof parsed === 'object') {
          // Unwrap top-level envelopes if present
          if (parsed.blueprint && typeof parsed.blueprint === 'object') {
            parsed = parsed.blueprint;
          } else if (parsed.character && typeof parsed.character === 'object') {
            parsed = parsed.character;
          } else if (parsed.data && typeof parsed.data === 'object') {
            parsed = parsed.data;
          }

          // Merge with procedural defaults to guarantee 100% field completeness and type safety
          const base = ProceduralEngine.generateBlueprint(spec);
          const mergedMorpho = { ...base.morphometrics, ...(parsed.morphometrics || {}) };
          const mergedCanons = { ...base.facialCanons, ...(parsed.facialCanons || {}) };

          // Re-sync textual anatomical features if Ollama updated numeric morphometrics
          if (parsed.morphometrics && !parsed.morphometrics.anatomicalFeatures) {
            const recomputed = buildMorphometrics({
              ...spec.granularSliders,
              muscularitySlider: mergedMorpho.muscularityLevel,
              bustVolumeSlider: mergedMorpho.bustVolume,
              galbeSlider: mergedMorpho.galbeCurvature,
              waistToHipRatio: mergedMorpho.waistToHipRatio,
              shoulderToHipRatio: mergedMorpho.shoulderToHipRatio,
              chestToWaistRatio: mergedMorpho.chestToWaistRatio,
              heightCm: mergedMorpho.heightCm,
              headHeightRatio: mergedMorpho.headHeightRatio,
              bodyFatCategory: mergedMorpho.bodyFatCategory
            }, base.bio.gender, base.archetype);
            mergedMorpho.anatomicalFeatures = recomputed.anatomicalFeatures;
          }

          blueprint = {
            ...base,
            bio: { ...base.bio, ...(parsed.bio || {}) },
            facialCanons: mergedCanons,
            morphometrics: mergedMorpho,
            wardrobe: Array.isArray(parsed.wardrobe) && parsed.wardrobe.length > 0 ? parsed.wardrobe : base.wardrobe,
            lighting: { ...base.lighting, ...(parsed.lighting || {}) }
          };
        }
      } catch (err: any) {
        fallbackTriggered = true;
        fallbackReason = `Ollama generation error: ${err?.message ?? String(err)}`;
      }
    } else {
      fallbackTriggered = true;
      fallbackReason = `Ollama daemon not reachable at ${this.endpoint} (server offline)`;
    }

    // Procedural Fallback
    if (!blueprint) {
      if (!this.fallbackToProcedural) {
        throw new Error(fallbackReason ?? 'Ollama generation failed and fallback is disabled');
      }
      fallbackTriggered = true;
      blueprint = ProceduralEngine.generateBlueprint(spec);
    }

    // Compile prompts
    const promptMatrix = ProceduralEngine.compilePrompts(blueprint);
    const durationMs = Date.now() - startTime;

    const metadata: GenerationMetadata = {
      engine: fallbackTriggered ? 'procedural_fallback' : 'ollama',
      modelUsed: fallbackTriggered ? undefined : modelUsed,
      endpointUsed: fallbackTriggered ? undefined : this.endpoint,
      durationMs,
      fallbackTriggered,
      fallbackReason,
      timestamp: new Date().toISOString()
    };

    return {
      blueprint,
      promptMatrix,
      metadata
    };
  }
}
