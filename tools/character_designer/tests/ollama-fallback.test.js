/**
 * Test Suite: Local Ollama Adapter & Transparent Fallback Resilience.
 * Tests offline graceful timeout/fallback as well as mock-response enrichment.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { OllamaProvider } from '../dist/index.js';

test('Ollama Adapter: Unreachable endpoint triggers graceful fallback within timeout', async () => {
  // Point to a guaranteed inactive local port with a tight timeout
  const provider = new OllamaProvider({
    endpoint: 'http://127.0.0.1:54321',
    timeoutMs: 800,
    fallbackToProcedural: true
  });

  const startTime = Date.now();
  const available = await provider.isAvailable(800);
  assert.equal(available, false, 'Inactive port must report unavailable');

  // Generate character: should gracefully fall back to procedural engine
  const spec = {
    name: 'Fallback Operative',
    gender: 'female',
    seed: 42
  };

  const result = await provider.generateCharacter(spec);
  const elapsed = Date.now() - startTime;

  assert.ok(result.blueprint, 'Blueprint must be successfully produced');
  assert.equal(result.blueprint.bio.name, 'Fallback Operative');
  assert.ok(result.promptMatrix, 'Prompt matrix must be compiled');
  assert.ok(result.metadata, 'Metadata must be present');
  assert.equal(result.metadata.engine, 'procedural_fallback');
  assert.equal(result.metadata.fallbackTriggered, true);
  assert.ok(result.metadata.fallbackReason?.includes('offline') || result.metadata.fallbackReason?.includes('procedural'));
});

test('Ollama Adapter: Successful mock daemon response enriches character lore', async () => {
  // Simulate active Ollama daemon via custom fetcher
  const mockFetcher = async (url, init) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/version')) {
      return new Response(JSON.stringify({ version: '0.3.12' }), { status: 200 });
    }
    if (urlStr.includes('/api/tags')) {
      return new Response(JSON.stringify({ models: [{ name: 'mistral-nemo:latest' }] }), { status: 200 });
    }
    if (urlStr.includes('/api/generate')) {
      const mockPayload = {
        bio: {
          name: 'Vance Enriched',
          alias: 'The Solar Vanguard',
          backstorySummary: 'Forged in the glowing stellar foundry of Neo-Seoul.',
          personalityKeywords: ['uncompromising', 'radiant', 'tactical']
        }
      };
      return new Response(JSON.stringify({
        model: 'mistral-nemo:latest',
        response: JSON.stringify(mockPayload),
        done: true
      }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const provider = new OllamaProvider({
    endpoint: 'http://localhost:11434',
    model: 'mistral-nemo:latest',
    fetcher: mockFetcher
  });

  const isAvail = await provider.isAvailable();
  assert.equal(isAvail, true);

  const tags = await provider.listModels();
  assert.deepEqual(tags, ['mistral-nemo:latest']);

  const result = await provider.generateCharacter({
    name: 'Initial Name',
    gender: 'male',
    seed: 777
  });

  assert.equal(result.metadata.engine, 'ollama');
  assert.equal(result.metadata.fallbackTriggered, false);
  assert.equal(result.metadata.modelUsed, 'mistral-nemo:latest');
  assert.ok(result.blueprint.bio.backstorySummary.includes('Neo-Seoul') || result.blueprint.bio.alias.includes('Solar'));
});
