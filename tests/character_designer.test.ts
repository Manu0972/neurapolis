import { describe, it, expect } from 'vitest';
import {
  ProceduralEngine,
  OllamaProvider,
  createCharacterDesign,
  createProceduralCharacterDesign,
  evaluateFacialCanons,
  evaluateBodyMorphometrics,
  buildFacialCanons,
  buildMorphometrics,
  buildWardrobeForStyle,
  resolveMuscularity,
  resolveBust,
  resolveGalbe,
  clamp,
  CLOTHING_MATRICES,
  ETHNICITY_PRESETS,
  DEFAULT_OLLAMA_ENDPOINT,
  DEFAULT_MODELS
} from '../tools/character_designer/index.js';

describe('Character Designer Engine & Aesthetic Engineering Suite', () => {

  // ==========================================
  // 1. GRANULAR SLIDERS & MORPHOLOGICAL RESOLUTION
  // ==========================================
  describe('Granular Controls & Sliders', () => {
    it('clamps values correctly within numeric boundaries', () => {
      expect(clamp(1.5, 0.0, 1.0)).toBe(1.0);
      expect(clamp(-0.5, 0.0, 1.0)).toBe(0.0);
      expect(clamp(0.65, 0.0, 1.0)).toBe(0.65);
    });

    it('resolves continuous and discrete muscularity levels with V-Taper and abdominal cuts', () => {
      // Discrete mappings
      const lean = resolveMuscularity(undefined, 'lean_subtle', 'male');
      expect(lean.level).toBe(0.20);
      expect(lean.discreteName).toBe('lean_subtle');
      expect(lean.vascularity).toBe(0.0);

      const chiseled = resolveMuscularity(undefined, 'chiseled_ripped', 'male');
      expect(chiseled.level).toBe(0.65);
      expect(chiseled.abdominalDefinition).toContain('8 plaquettes');
      expect(chiseled.abdominalDefinition).toContain('serratus');
      expect(chiseled.latissimusSpreading).toContain('V-taper');

      const demon = resolveMuscularity(0.95, undefined, 'male');
      expect(demon.discreteName).toBe('hyper_mass_demon');
      expect(demon.description).toContain('Demon Back');
      expect(demon.vascularity).toBeGreaterThan(0.8);
    });

    it('resolves bust fullness with natural teardrop gravity drape without artificial censorship', () => {
      const naturalFull = resolveBust(0.75, undefined, 'female', true);
      expect(naturalFull.discreteName).toBe('voluptuous_full');
      expect(naturalFull.gravityDrape).toContain('goutte d’eau');
      expect(naturalFull.gravityDrape).toContain('pli sous-mammaire');
      expect(naturalFull.cleavageContour).toContain('Décolleté profond');

      const firmAthletic = resolveBust(undefined, 'athletic_firm', 'female', true);
      expect(firmAthletic.discreteName).toBe('athletic_firm');
      expect(firmAthletic.volume).toBe(0.35);

      const malePecs = resolveBust(0.8, undefined, 'male');
      expect(malePecs.description).toContain('Pectoraux masculins sculptés');
      expect(malePecs.cleavageContour).toContain('Fente sternale');
    });

    it('resolves galbe curvature and gluteal shelves across the full spectrum', () => {
      const shelf = resolveGalbe(0.85, undefined, 'female');
      expect(shelf.discreteName).toBe('deep_hourglass_shelf');
      expect(shelf.shelfDefinition).toContain('lordose esthétique');
      expect(shelf.hipThighTransition).toContain('Évasement latéral');

      const athleticGalbe = resolveGalbe(undefined, 'firm_athletic', 'female');
      expect(athleticGalbe.discreteName).toBe('firm_athletic');
      expect(athleticGalbe.hipThighTransition).toContain('gluteus medius');
    });

    it('constructs complete facial canons with thirds, canthal tilt and bigonial width', () => {
      const maleCanons = buildFacialCanons({
        facialThirdsRatio: [1.0, 1.0, 1.0],
        canthalTiltDegrees: 4.0,
        bigonialWidthRatio: 0.88,
        gonialAngleDegrees: 118,
        cheekboneProminence: 0.75
      }, 'male');

      expect(maleCanons.facialThirdsRatio).toEqual([1.0, 1.0, 1.0]);
      expect(maleCanons.canthalTiltDegrees).toBe(4.0);
      expect(maleCanons.bigonialWidthRatio).toBe(0.88);
      expect(maleCanons.gonialAngleDegrees).toBe(118);
      expect(maleCanons.eyeDetails).toContain('canthal tilt positif (+4°)');
      expect(maleCanons.jawlineDescription).toContain('largeur bigoniale robuste');
    });

    it('constructs uncensored body morphometrics preserving realistic tissue dynamics', () => {
      const morpho = buildMorphometrics({
        muscularitySlider: 0.70,
        bustVolumeSlider: 0.80,
        bustNaturalGravity: true,
        galbeSlider: 0.75,
        waistToHipRatio: 0.68,
        shoulderToHipRatio: 1.12,
        heightCm: 174,
        headHeightRatio: 8.2
      }, 'female', 'voluptuous_curvaceous');

      expect(morpho.heightCm).toBe(174);
      expect(morpho.waistToHipRatio).toBe(0.68);
      expect(morpho.bustVolume).toBe(0.80);
      expect(morpho.galbeCurvature).toBe(0.75);
      expect(morpho.anatomicalFeatures.bustChestDescription).toContain('goutte d’eau');
      expect(morpho.anatomicalFeatures.waistAbdomenDescription).toContain('WHR exceptionnel de 0.68');
      expect(morpho.anatomicalFeatures.hipGluteDescription).toContain('lordose');
    });
  });

  // ==========================================
  // 2. SCIENTIFIC ANATOMY & BIOMETRIC EVALUATION
  // ==========================================
  describe('Scientific Anatomy Evaluation', () => {
    it('evaluates facial canons and identifies harmonic balance', () => {
      const canons = buildFacialCanons({
        facialThirdsRatio: [1.0, 1.0, 1.0],
        canthalTiltDegrees: 3.5,
        bigonialWidthRatio: 0.85,
        gonialAngleDegrees: 120
      }, 'male');

      const evaluation = evaluateFacialCanons(canons, 'male');
      expect(evaluation.score).toBeGreaterThanOrEqual(90);
      expect(evaluation.findings.some(f => f.includes('Facial thirds harmonic balance'))).toBe(true);
      expect(evaluation.findings.some(f => f.includes('Positive canthal tilt'))).toBe(true);
      expect(evaluation.findings.some(f => f.includes('bigonial-to-bizygomatic'))).toBe(true);
    });

    it('penalizes negative canthal tilt and thirds asymmetry in facial beauty scoring', () => {
      const asymmetricCanons = buildFacialCanons({
        facialThirdsRatio: [0.7, 1.4, 0.9],
        canthalTiltDegrees: -3.0
      }, 'male');

      const evalResult = evaluateFacialCanons(asymmetricCanons, 'male');
      expect(evalResult.score).toBeLessThan(90);
      expect(evalResult.findings.some(f => f.includes('Negative canthal tilt'))).toBe(true);
      expect(evalResult.findings.some(f => f.includes('Facial thirds show notable asymmetry'))).toBe(true);
    });

    it('evaluates body morphometrics against evolutionary gynoid WHR optimum', () => {
      const morpho = buildMorphometrics({
        waistToHipRatio: 0.68,
        headHeightRatio: 8.3,
        bustVolumeSlider: 0.75,
        galbeSlider: 0.70
      }, 'female');

      const report = evaluateBodyMorphometrics(morpho, 'female', 'voluptuous_curvaceous');
      expect(report.dimorphicStrengthScore).toBeGreaterThanOrEqual(95);
      expect(report.anatomicalIntegrityScore).toBeGreaterThanOrEqual(90);
      expect(report.notes.some(n => n.includes('Devendra Singh'))).toBe(true);
      expect(report.notes.some(n => n.includes('Heroic/Webtoon proportion verified'))).toBe(true);
      expect(report.notes.some(n => n.includes('Authentic morphological modeling enabled'))).toBe(true);
    });
  });

  // ==========================================
  // 3. WARDROBE & ETHNICITY MATRICES
  // ==========================================
  describe('Clothing and Ethnicity Matrices', () => {
    it('covers all 5 mandatory clothing matrices with 6-layer architecture', () => {
      const styles = ['streetwear', 'techwear', 'modern_hanbok_kimono', 'light_armor', 'elegant'] as const;

      for (const style of styles) {
        const matrix = CLOTHING_MATRICES[style];
        expect(matrix).toBeDefined();
        expect(matrix.defaultLayers.length).toBe(6);

        const layerNames = matrix.defaultLayers.map(l => l.layerName);
        expect(layerNames).toEqual(['base', 'inner', 'outer', 'bottom', 'footwear', 'accessories']);

        const builtWardrobe = buildWardrobeForStyle(style, {
          primary: '#0F172A',
          secondary: '#1E293B',
          accent: '#38BDF8'
        });
        expect(builtWardrobe[1]?.colorHexOrTone).toBe('#0F172A');
        expect(builtWardrobe[2]?.colorHexOrTone).toBe('#1E293B');
        expect(builtWardrobe[5]?.colorHexOrTone).toBe('#38BDF8');
      }
    });

    it('covers all 11 ethnicity presets with dermatological precision', () => {
      const expectedEthnicities = [
        'east_asian', 'south_asian', 'african', 'caucasian', 'latin_american',
        'middle_eastern', 'southeast_asian', 'nordic', 'indigenous_american',
        'polynesian', 'fantasy_hybrid'
      ] as const;

      for (const eth of expectedEthnicities) {
        const preset = ETHNICITY_PRESETS[eth];
        expect(preset).toBeDefined();
        expect(preset.skinMelaninTone.length).toBeGreaterThan(10);
        expect(preset.facialTraitsDescription.length).toBeGreaterThan(10);
        expect(preset.hairTextureDefaults.length).toBeGreaterThanOrEqual(2);
        expect(preset.eyeHueDefaults.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ==========================================
  // 4. PROCEDURAL DETERMINISTIC ENGINE
  // ==========================================
  describe('Procedural Engine (Offline Fallback)', () => {
    it('generates fully deterministic blueprints with reproducible seed', () => {
      const bp1 = ProceduralEngine.generateBlueprint({
        name: 'Kang Jin-Woo',
        gender: 'male',
        clothingStyle: 'streetwear',
        seed: 1337
      });

      const bp2 = ProceduralEngine.generateBlueprint({
        name: 'Kang Jin-Woo',
        gender: 'male',
        clothingStyle: 'streetwear',
        seed: 1337
      });

      expect(bp1.bio.name).toBe(bp2.bio.name);
      expect(bp1.bio.signatureColors).toEqual(bp2.bio.signatureColors);
      expect(bp1.morphometrics.heightCm).toBe(bp2.morphometrics.heightCm);
      expect(bp1.wardrobe).toEqual(bp2.wardrobe);
    });

    it('compiles multi-generator prompt matrices including turnarounds, 12 expressions, and actions', () => {
      const blueprint = ProceduralEngine.generateBlueprint({
        name: 'Aria Vance',
        gender: 'female',
        clothingStyle: 'techwear',
        seed: 42
      });

      const prompts = ProceduralEngine.compilePrompts(blueprint);

      // Model sheet turnaround 5-views
      expect(prompts.modelSheetTurnaroundPrompt).toContain('five-view turnaround');
      expect(prompts.modelSheetTurnaroundPrompt).toContain('front view, back view, left profile, right profile, 3/4');

      // 12-expression grid
      expect(prompts.expressionMatrixPrompt).toContain('12 facial emotion studies');
      expect(prompts.expressionMatrixPrompt).toContain('4x3 matrix');

      // Dynamic action poses
      expect(prompts.dynamicPoseSheetPrompt).toContain('seven distinct poses');

      // Macro details callouts
      expect(prompts.macroDetailsPrompt).toContain('extreme close-up of eye');
      expect(prompts.macroDetailsPrompt).toContain('hand anatomy');

      // Generator specific outputs
      expect(prompts.generatorSpecificPrompts.midjourneyV6).toContain('--ar 16:9 --style raw --v 6.0');
      expect(prompts.generatorSpecificPrompts.stableDiffusionXL).toContain('masterpiece, best quality');
      expect(prompts.generatorSpecificPrompts.flux1).toContain('Professional character design model turnaround sheet');
      expect(prompts.generatorSpecificPrompts.geminiImagen3).toContain('A comprehensive character model sheet of');

      // Negative prompts
      expect(prompts.negativePrompts.general).toContain('deformed anatomy');
      expect(prompts.negativePrompts.anatomicalCorrection).toContain('plastic skin');
    });

    it('createProceduralCharacterDesign provides instant offline execution', () => {
      const res = createProceduralCharacterDesign({
        name: 'Valentin Cross',
        gender: 'male',
        clothingStyle: 'elegant'
      });

      expect(res.metadata.engine).toBe('procedural_fallback');
      expect(res.metadata.fallbackTriggered).toBe(false);
      expect(res.blueprint.bio.name).toBe('Valentin Cross');
      expect(res.promptMatrix.singleHeroPortraitPrompt).toContain('Valentin Cross');
    });
  });

  // ==========================================
  // 5. NATIVE OLLAMA INTEGRATION & FALLBACK
  // ==========================================
  describe('Ollama Provider & Graceful Fallback', () => {
    it('uses correct default endpoint and supported models', () => {
      expect(DEFAULT_OLLAMA_ENDPOINT).toBe('http://localhost:11434');
      expect(DEFAULT_MODELS).toContain('mistral-nemo');
      expect(DEFAULT_MODELS).toContain('mistral');
      expect(DEFAULT_MODELS).toContain('qwen2.5');
    });

    it('falls back gracefully to procedural engine when Ollama daemon is offline', async () => {
      // Mock fetcher that rejects connection (simulating offline Ollama server)
      const offlineFetcher = async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:11434');
      };

      const provider = new OllamaProvider({
        endpoint: 'http://localhost:11434',
        model: 'mistral-nemo',
        fetcher: offlineFetcher as any
      });

      const isLive = await provider.isAvailable(100);
      expect(isLive).toBe(false);

      const result = await provider.generateCharacter({
        name: 'Offline Hero',
        gender: 'male',
        clothingStyle: 'streetwear'
      });

      expect(result.metadata.engine).toBe('procedural_fallback');
      expect(result.metadata.fallbackTriggered).toBe(true);
      expect(result.metadata.fallbackReason).toContain('Ollama daemon not reachable');
      expect(result.blueprint.bio.name).toBe('Offline Hero');
      expect(result.promptMatrix.modelSheetTurnaroundPrompt).toBeDefined();
    });

    it('processes valid Ollama /api/generate JSON response when server is online', async () => {
      const mockApiResponse = {
        response: JSON.stringify({
          bio: {
            name: 'Kaelen Shadow',
            occupationOrRole: 'Phantom Assassin'
          },
          morphometrics: {
            muscularityLevel: 0.82
          }
        })
      };

      const onlineFetcher = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.endsWith('/api/version')) {
          return new Response(JSON.stringify({ version: '0.4.1' }), { status: 200 });
        }
        if (urlStr.endsWith('/api/tags')) {
          return new Response(JSON.stringify({ models: [{ name: 'mistral-nemo:latest' }] }), { status: 200 });
        }
        if (urlStr.endsWith('/api/generate')) {
          return new Response(JSON.stringify(mockApiResponse), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      };

      const provider = new OllamaProvider({
        endpoint: 'http://localhost:11434',
        model: 'mistral-nemo',
        fetcher: onlineFetcher as any
      });

      const isLive = await provider.isAvailable();
      expect(isLive).toBe(true);

      const result = await provider.generateCharacter({
        name: 'Kaelen Shadow',
        gender: 'male',
        clothingStyle: 'light_armor'
      });

      expect(result.metadata.engine).toBe('ollama');
      expect(result.metadata.fallbackTriggered).toBe(false);
      expect(result.metadata.modelUsed).toContain('mistral-nemo');
      expect(result.blueprint.bio.name).toBe('Kaelen Shadow');
      expect(result.blueprint.morphometrics.muscularityLevel).toBe(0.82);
    });

    it('processes valid /v1/chat/completions response when protocol is set to OpenAI-compatible', async () => {
      const mockChatResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                bio: {
                  name: 'Sora Kim',
                  occupationOrRole: 'Techwear Hacker'
                }
              })
            }
          }
        ]
      };

      const chatFetcher = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.endsWith('/api/version')) {
          return new Response(JSON.stringify({ version: '0.4.1' }), { status: 200 });
        }
        if (urlStr.endsWith('/api/tags')) {
          return new Response(JSON.stringify({ models: [{ name: 'qwen2.5:latest' }] }), { status: 200 });
        }
        if (urlStr.endsWith('/v1/chat/completions')) {
          return new Response(JSON.stringify(mockChatResponse), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      };

      const provider = new OllamaProvider({
        endpoint: 'http://localhost:11434',
        model: 'qwen2.5',
        protocol: 'v1_chat_completions',
        fetcher: chatFetcher as any
      });

      const result = await provider.generateCharacter({
        name: 'Sora Kim',
        clothingStyle: 'techwear'
      });

      expect(result.metadata.engine).toBe('ollama');
      expect(result.metadata.fallbackTriggered).toBe(false);
      expect(result.blueprint.bio.name).toBe('Sora Kim');
    });

    it('falls back to procedural engine if Ollama returns corrupted or unparseable JSON', async () => {
      const badJsonFetcher = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.endsWith('/api/version')) return new Response('{}', { status: 200 });
        if (urlStr.endsWith('/api/tags')) return new Response(JSON.stringify({ models: [{ name: 'mistral' }] }), { status: 200 });
        if (urlStr.endsWith('/api/generate')) {
          return new Response(JSON.stringify({ response: 'SORRY I CANNOT OUTPUT JSON {broken}' }), { status: 200 });
        }
        return new Response('Error', { status: 500 });
      };

      const provider = new OllamaProvider({
        fetcher: badJsonFetcher as any
      });

      const result = await provider.generateCharacter({
        name: 'Resilient Hero'
      });

      expect(result.metadata.engine).toBe('procedural_fallback');
      expect(result.metadata.fallbackTriggered).toBe(true);
      expect(result.metadata.fallbackReason).toContain('Ollama generation error');
      expect(result.blueprint.bio.name).toBe('Resilient Hero');
    });
  });
});
