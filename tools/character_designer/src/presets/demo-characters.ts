/**
 * Curated Demonstration Characters Showcase.
 * Defines 5 diverse, highly detailed character archetypes covering
 * Webtoon Action, Semi-realistic, Seinen, Anime, multiple genders,
 * wardrobes, muscle definitions, and lighting scenarios.
 */

import type { GenerationOptions } from '../compiler/procedural.ts';

export const DEMO_CHARACTERS: Array<{ filenamePrefix: string; options: GenerationOptions }> = [
  {
    filenamePrefix: '01_hunter_webtoon_male',
    options: {
      seed: 'solo-hunter-alpha-77',
      name: 'Sung Kang-Dae',
      gender: 'male',
      archetype: 'hyper_muscular_hero',
      style: 'Webtoon Action',
      clothingStyle: 'techwear',
      attireState: 'duty',
      ethnicity: 'east_asian',
      lightingPreset: 'chiaroscuro_dramatic',
      sliders: {
        muscularityDiscrete: 'ripped',
        muscularitySlider: 0.84,
        vTaperScore: 0.92,
        vascularity: 'prominent_arms',
        canthalTiltDegrees: 4.8,
        gonialAngleDegrees: 114.5,
        bigonialWidthRatio: 0.88,
        eyeShape: 'fox_sharp',
        noseShape: 'high_bridge_narrow',
        lipShape: 'subtle_tapered',
        heightCm: 189,
        headHeightRatio: 8.4,
        waistToHipRatio: 0.84,
        shoulderToHipRatio: 1.58
      }
    }
  },
  {
    filenamePrefix: '02_operative_curvaceous_female',
    options: {
      seed: 'hana-kuroki-k-street-99',
      name: 'Hana Kuroki',
      gender: 'female',
      archetype: 'voluptuous_curvaceous',
      style: 'Semi-realistic',
      clothingStyle: 'streetwear',
      attireState: 'duty',
      ethnicity: 'east_asian',
      lightingPreset: 'hygge_golden_hour',
      sliders: {
        muscularityDiscrete: 'toned',
        muscularitySlider: 0.38,
        bustVolumeSlider: 0.82,
        galbeSlider: 0.84,
        waistToHipRatio: 0.68,
        shoulderToHipRatio: 1.10,
        bustNaturalGravity: true,
        canthalTiltDegrees: 3.8,
        gonialAngleDegrees: 128.0,
        bigonialWidthRatio: 0.72,
        eyeShape: 'double_eyelid',
        noseShape: 'refined_button',
        lipShape: 'full_cushion',
        heightCm: 172,
        headHeightRatio: 7.9
      }
    }
  },
  {
    filenamePrefix: '03_seinen_swordsman_male',
    options: {
      seed: 'ren-takahashi-demonback-42',
      name: 'Ren Takahashi',
      gender: 'male',
      archetype: 'hyper_muscular_hero',
      style: 'Seinen',
      clothingStyle: 'martial',
      attireState: 'duty',
      ethnicity: 'east_asian',
      lightingPreset: 'chiaroscuro_dramatic',
      sliders: {
        muscularityDiscrete: 'shredded',
        muscularitySlider: 0.96,
        vTaperScore: 0.95,
        vascularity: 'extreme_striated',
        canthalTiltDegrees: 3.2,
        gonialAngleDegrees: 112.0,
        bigonialWidthRatio: 0.90,
        eyeShape: 'hooded',
        noseShape: 'aquiline_roman',
        lipShape: 'subtle_tapered',
        heightCm: 186,
        headHeightRatio: 8.3,
        waistToHipRatio: 0.82,
        shoulderToHipRatio: 1.62
      }
    }
  },
  {
    filenamePrefix: '04_matron_tailored_female',
    options: {
      seed: 'dr-valeria-vance-savile-12',
      name: 'Dr. Valeria Vance',
      gender: 'female',
      archetype: 'slender_elegant',
      style: 'Webtoon Action',
      clothingStyle: 'classic_tailoring',
      attireState: 'duty',
      ethnicity: 'caucasian',
      lightingPreset: 'studio_softbox',
      sliders: {
        muscularityDiscrete: 'soft',
        muscularitySlider: 0.22,
        bustVolumeSlider: 0.65,
        galbeSlider: 0.68,
        waistToHipRatio: 0.69,
        shoulderToHipRatio: 1.14,
        canthalTiltDegrees: 4.2,
        gonialAngleDegrees: 126.5,
        bigonialWidthRatio: 0.74,
        cheekboneProminence: 0.88,
        eyeShape: 'almond',
        noseShape: 'straight_greek',
        lipShape: 'pronounced_cupid_bow',
        heightCm: 176,
        headHeightRatio: 8.2
      }
    }
  },
  {
    filenamePrefix: '05_cyber_infiltrator_androgynous',
    options: {
      seed: 'kaelen-zephyr-neon-88',
      name: 'Kaelen Zephyr',
      gender: 'androgynous',
      archetype: 'lean_athletic',
      style: 'Anime',
      clothingStyle: 'techwear',
      attireState: 'hybrid',
      ethnicity: 'fantasy_hybrid',
      lightingPreset: 'cyber_neon_noir',
      sliders: {
        muscularityDiscrete: 'toned',
        muscularitySlider: 0.42,
        bustVolumeSlider: 0.25,
        galbeSlider: 0.45,
        waistToHipRatio: 0.76,
        shoulderToHipRatio: 1.25,
        canthalTiltDegrees: 5.5,
        gonialAngleDegrees: 122.0,
        bigonialWidthRatio: 0.78,
        eyeShape: 'phoenix_eyes',
        noseShape: 'refined_button',
        lipShape: 'gradient_tint_velvet',
        heightCm: 177,
        headHeightRatio: 8.1
      }
    }
  }
];
