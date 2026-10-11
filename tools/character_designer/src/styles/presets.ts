/**
 * Art Style Presets Module.
 * Implements 4 foundational pillars: Webtoon Action, Anime, Seinen, Semi-realistic.
 */

import type { ArtStyleCategory, ArtStylePreset } from '../types.ts';

export interface StylePresetDefinition {
  category: ArtStyleCategory;
  preset: ArtStylePreset;
  displayName: string;
  description: string;
  promptTokens: string[];
  renderingTechniques: string[];
  colorPaletteDescription: string;
}

export const STYLE_PRESETS: Record<ArtStyleCategory, StylePresetDefinition> = {
  'Webtoon Action': {
    category: 'Webtoon Action',
    preset: 'korean_webtoon_cinematic',
    displayName: 'Korean Webtoon Action (Solo Leveling Aesthetic)',
    description: 'Dynamic manhwa masterwork with razor-sharp digital lineart, high-contrast cel-shading, glowing cyan/purple power auras, and dramatic rim lighting.',
    promptTokens: [
      'master character model sheet',
      'clean manhwa digital line art',
      'sharp cel-shading with deep ambient occlusion',
      'intense glowing iris catchlights',
      'dramatic volumetric rim lighting',
      'korean action webtoon aesthetic',
      'solo leveling art style'
    ],
    renderingTechniques: [
      'Two-tone crisp cel-shading with gradient transitions',
      'Electric or ethereal rim lighting contouring the silhouette',
      'Subtle subsurface scattering on skin folds and cartilage',
      'High contrast deep obsidian shadows with saturated highlight edges'
    ],
    colorPaletteDescription: 'Cool deep slate, obsidian black, vibrant cyan/azure accents, incandescent purple eye glows, and warm porcelain-toned skin.'
  },
  'Anime': {
    category: 'Anime',
    preset: 'anime_cel_shaded_premium',
    displayName: 'Modern Premium Anime (Kyoto / Ufotable Standard)',
    description: 'Crisp anime illustration with vibrant specular highlights, fluid line weight modulation, subtle bloom, and cinematic composition.',
    promptTokens: [
      'premium modern anime character design',
      'flawless clean vector-quality lineart',
      'luminous eyes with complex multi-layered iris reflections',
      'soft atmospheric bloom',
      'studio anime visual masterpiece',
      'clean colorful cel-shading'
    ],
    renderingTechniques: [
      'Weighted variable contour linework',
      'Smooth three-step shadow grading',
      'Luminous multi-tiered specular highlights on hair and eyes',
      'Soft environmental bounce lighting'
    ],
    colorPaletteDescription: 'Rich saturated primaries, luminous golden hair catchlights, deep sapphire shadows, and radiant peach skin.'
  },
  'Seinen': {
    category: 'Seinen',
    preset: 'seinen_dark_fantasy',
    displayName: 'Seinen Manga / Dark Fantasy (Berserk & Tokyo Ghoul Texture)',
    description: 'Gritty, mature aesthetic featuring intricate cross-hatching, heavy calligraphic ink strokes, dramatic chiaroscuro, and textured visceral realism.',
    promptTokens: [
      'mature seinen manga character sheet',
      'intricate ink cross-hatching',
      'gritty dark fantasy aesthetic',
      'dramatic chiaroscuro lighting',
      'heavily textured shadows and deep blacks',
      'intense psychological presence'
    ],
    renderingTechniques: [
      'Dense manual cross-hatch shading alongside wash gradients',
      'Heavy brush-pen contour accents defining muscle tension',
      'Extreme value contrast with stark silhouettes',
      'Visceral surface textures on leather, steel, and battle scars'
    ],
    colorPaletteDescription: 'Monochromatic ink depth with muted sepia, bone white, dried crimson accents, and steel grey.'
  },
  'Semi-realistic': {
    category: 'Semi-realistic',
    preset: 'tactical_semi_realistic',
    displayName: 'Semi-Realistic Painterly Concept Art (ArtStation Master)',
    description: 'High-end digital concept art balancing stylized heroic proportions with realistic subsurface scattering, tactile fabric physics, and PBR lighting fidelity.',
    promptTokens: [
      'semi-realistic character concept art',
      'painterly digital gouache and oil technique',
      'realistic subsurface scattering on skin',
      'physically accurate fabric tension and weave',
      'subtle skin pores and micro-surface specularities',
      'trending on artstation'
    ],
    renderingTechniques: [
      'Soft painterly edge blending without harsh vector outlines',
      'Physically grounded specular and roughness maps simulation',
      'Rich multi-bounce chromatic ambient occlusion',
      'Complex skin subsurface scattering (epidermal warm glow)'
    ],
    colorPaletteDescription: 'Naturalistic cinematic grading, warm amber key lighting (1800K-3000K), cool periwinkle fill shadows, and rich textile hues.'
  }
};

export function getStylePreset(category: ArtStyleCategory): StylePresetDefinition {
  return STYLE_PRESETS[category] ?? STYLE_PRESETS['Webtoon Action'];
}
