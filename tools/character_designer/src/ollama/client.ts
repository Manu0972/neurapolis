/**
 * Native Local Ollama HTTP Client.
 * Communicates with local Ollama daemon at http://localhost:11434.
 * Uses native fetch with strict timeout abort controller and zero external dependencies.
 */

import type { OllamaConfig } from '../types.ts';

export interface OllamaModelTag {
  name: string;
  modified_at?: string;
  size?: number;
}

export interface OllamaTagsResponse {
  models?: OllamaModelTag[];
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
}

export class OllamaHttpClient {
  private endpoint: string;
  private timeoutMs: number;

  constructor(config: OllamaConfig = {}) {
    this.endpoint = (config.endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs ?? 4000;
  }

  /**
   * Pings the Ollama instance to check liveness.
   * Resolves to true if responsive within timeout, false otherwise.
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(2000, this.timeoutMs));
      
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Lists models installed on the local Ollama daemon.
   */
  public async listModels(): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) return [];
      const data = await response.json() as OllamaTagsResponse;
      return (data.models || []).map(m => m.name);
    } catch {
      return [];
    }
  }

  /**
   * Generates a completion from Ollama using /api/generate.
   */
  public async generate(
    model: string,
    prompt: string,
    options: { system?: string; jsonFormat?: boolean; temperature?: number } = {}
  ): Promise<{ text: string; model: string; durationMs: number }> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const body: Record<string, unknown> = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7
        }
      };

      if (options.system) {
        body.system = options.system;
      }
      if (options.jsonFormat) {
        body.format = 'json';
      }

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaGenerateResponse;
      return {
        text: data.response || '',
        model: data.model || model,
        durationMs: Date.now() - startTime
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Ollama request failed: ${message}`);
    }
  }
}
