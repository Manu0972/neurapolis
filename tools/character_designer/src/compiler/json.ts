/**
 * JSON Exporter and Schema Validator Module.
 */

import type { CharacterGenerationResult } from '../types.ts';

export class JsonExporter {
  public static export(result: CharacterGenerationResult, pretty: boolean = true): string {
    return JSON.stringify(result, null, pretty ? 2 : 0);
  }

  public static validate(result: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!result || typeof result !== 'object') {
      return { valid: false, errors: ['Input must be a non-null object'] };
    }

    const res = result as Partial<CharacterGenerationResult>;

    if (!res.blueprint) {
      errors.push('Missing required property: blueprint');
    } else {
      if (!res.blueprint.id) errors.push('Missing blueprint.id');
      if (!res.blueprint.bio?.name) errors.push('Missing blueprint.bio.name');
      if (!res.blueprint.facialCanons) errors.push('Missing blueprint.facialCanons');
      if (!res.blueprint.morphometrics) errors.push('Missing blueprint.morphometrics');
      if (!res.blueprint.wardrobe || !Array.isArray(res.blueprint.wardrobe)) errors.push('Missing or invalid blueprint.wardrobe');
      if (!res.blueprint.lighting) errors.push('Missing blueprint.lighting');
    }

    if (!res.promptMatrix) {
      errors.push('Missing required property: promptMatrix');
    } else {
      if (!res.promptMatrix.modelSheetTurnaroundPrompt) errors.push('Missing promptMatrix.modelSheetTurnaroundPrompt');
      if (!res.promptMatrix.generatorSpecificPrompts?.midjourneyV6) errors.push('Missing midjourneyV6 prompt');
      if (!res.promptMatrix.generatorSpecificPrompts?.stableDiffusionXL) errors.push('Missing stableDiffusionXL prompt');
      if (!res.promptMatrix.generatorSpecificPrompts?.flux1) errors.push('Missing flux1 prompt');
    }

    if (!res.metadata) {
      errors.push('Missing required property: metadata');
    } else {
      if (!res.metadata.engine) errors.push('Missing metadata.engine');
      if (typeof res.metadata.fallbackTriggered !== 'boolean') errors.push('Missing metadata.fallbackTriggered');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
