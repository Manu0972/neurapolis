/**
 * Core type definitions for the Hyper Character Designer engine.
 * Covers scientific morphometrics, webtoon/manhwa stylization,
 * anatomical proportions, expression matrices, granular sliders,
 * clothing & ethnicity matrices, and Ollama integration.
 */

export type GenderIdentity = 'male' | 'female' | 'androgynous' | 'non-binary';

export type BodyArchetype =
  | 'lean_athletic'
  | 'hyper_muscular_hero'
  | 'voluptuous_curvaceous'
  | 'soft_athletic'
  | 'slender_elegant'
  | 'stocky_powerhouse'
  | 'casual_average'
  | 'stylized_lowpoly';

export type ArtStylePreset =
  | 'korean_webtoon_cinematic'     // Solo Leveling, Dubu/Redice style: high contrast, rim lighting, glowing auras
  | 'modern_webtoon_romance'       // True Beauty, clean lines, soft skin tones, high-fashion styling
  | 'tactical_semi_realistic'      // Concept art, military/special ops, layered fabric tension
  | 'painterly_digital_manhwa'     // Rich gouache/digital oils, subsurface scattering
  | 'anime_cel_shaded_premium'    // Crisp line art, vibrant highlights, subtle ambient occlusion
  | 'stylized_3d_render'           // Blender/Octane toy or character model sheet style
  | 'retro_pixel_concept';         // High-res pixel portrait + isometric sprite sheet

/** Discrete muscularity levels for fast archetype selection */
export type MuscularityLevelDiscrete =
  | 'lean_subtle'       // Slender, toned, minimal mass, subtle contours (slider ~0.1 - 0.25)
  | 'athletic_toned'    // Swimmer/dancer build, clear abdominal outlines (slider ~0.3 - 0.45)
  | 'chiseled_ripped'   // Manhwa action hero, 8-pack abs, serratus cuts, defined V-taper (slider ~0.5 - 0.7)
  | 'bodybuilder_dense' // Heavy muscle mass, thick deltoids, striated chest (slider ~0.75 - 0.85)
  | 'hyper_mass_demon' // Demon back Christmas-tree lats, extreme vascularity, superhuman bulk (slider ~0.9 - 1.0)
  | 'lean' | 'athletic' | 'chiseled' | 'bodybuilder' | 'hyper_mass' | 'hyper-mass';

/** Discrete bust fullness levels with natural gravity modeling */
export type BustFullnessDiscrete =
  | 'subtle_petite'      // Flat or modest athletic chest (slider ~0.0 - 0.2)
  | 'athletic_firm'      // Compact, firm pectoral/breast balance (slider ~0.25 - 0.4)
  | 'medium_classic'     // Proportional natural teardrop drape (slider ~0.45 - 0.6)
  | 'voluptuous_full'    // Generous, natural weight distribution and soft drape (slider ~0.65 - 0.85)
  | 'monumental_heavy'  // Prominent hourglass fullness with deep natural cleavage (slider ~0.9 - 1.0)
  | 'petite' | 'athletic' | 'medium' | 'voluptuous' | 'monumental';

/** Discrete galbe / glute curvature levels */
export type GalbeCurvatureDiscrete =
  | 'lean_straight'        // Slender minimal curvature (slider ~0.0 - 0.2)
  | 'firm_athletic'        // High firm shelf, toned gluteus medius/maximus (slider ~0.25 - 0.45)
  | 'full_rounded'         // Distinct feminine or powerful athletic galbe (slider ~0.5 - 0.7)
  | 'deep_hourglass_shelf' // Marked lateral flare, deep lumbar-sacral lordosis curve (slider ~0.75 - 0.9)
  | 'hyper_curvaceous'    // Exaggerated manhwa voluptuous pelvic curve (slider ~0.95 - 1.0)
  | 'lean' | 'firm' | 'athletic' | 'full' | 'hourglass' | 'shelf' | 'hyper';

/** Clothing style categories supported in wardrobe matrices */
export type ClothingStyleCategory =
  | 'streetwear'             // K-fashion, baggy cargos, oversized hoodies, sneakers, layered chains
  | 'techwear'               // Waterproof membranes, Fidlock buckles, tactical harnesses, cyber trims
  | 'modern_hanbok_kimono'   // Deconstructed traditional robes, haori crossover, silk lapels, hybrid hakama
  | 'light_armor'            // Ballistic cuirass, segmented pauldrons, reinforced vambraces, combat mesh
  | 'elegant';               // Tailored Italian suit, haute couture evening gown, silk lapels, structured lines

/** Phenotype / Ethnicity presets for authentic representation */
export type EthnicityCategory =
  | 'east_asian'           // Korean, Japanese, Chinese features, epicanthic fold nuance, refined nasal bridge
  | 'south_asian'          // Rich melanin tones, almond eyes, strong nasal bridge, lustrous hair
  | 'african'              // Deep melanin tones, defined facial bone structure, full lips, textured/coiled hair
  | 'caucasian'            // Fair to olive tones, prominent brow ridge, diverse ocular pigmentation
  | 'latin_american'      // Warm olive/golden undertones, expressive bone structure, versatile textures
  | 'middle_eastern'       // Warm olive-tan skin, striking dark eyes, arched brows, strong mandibular profile
  | 'southeast_asian'      // Golden undertones, warm eye angles, soft-yet-defined facial thirds
  | 'nordic'               // Pale translucent skin, high cheekbones, icy or light hair and eyes
  | 'indigenous_american'  // High cheekbones, rich bronze tones, strong aquiline nose, thick straight hair
  | 'polynesian'           // Sturdy athletic bone structure, golden-brown skin, wavy voluminous hair
  | 'fantasy_hybrid';      // Ethereal hybrid markings, luminescent freckles, subtle pointed helix ears

export interface FacialCanons {
  /** Facial thirds ratio (forehead : midface : lower face), ideal classical = 1.0 : 1.0 : 1.0 */
  facialThirdsRatio: [number, number, number];
  /** Facial fifths symmetry (intercanthal distance relative to eye width), ideal = 1.0 */
  facialFifthsEyeRatio: number;
  /** Canthal tilt in degrees: positive (+2° to +5°) indicates alert/youthful/intense gaze */
  canthalTiltDegrees: number;
  /** Mandibular gonial angle in degrees (male ~110°-125°, female ~125°-135°) */
  gonialAngleDegrees: number;
  /** Bizygomatic to bigonial width ratio */
  cheekboneToJawRatio: number;
  /** Bigonial width relative to bizygomatic width (0.60 to 0.95) */
  bigonialWidthRatio: number;
  /** Philtrum-to-chin ratio (ideal ~1:2, i.e. 0.5) */
  philtrumToChinRatio: number;
  /** Nasolabial angle in degrees (male ~90°-95°, female ~95°-105°) */
  nasolabialAngleDegrees: number;
  /** Cheekbone prominence scale 0.0 (soft/flat) to 1.0 (high sculpted malar bones) */
  cheekboneProminence: number;
  /** Eye description: shape, iris color, highlights, limbal ring definition */
  eyeDetails: string;
  /** Nose description: bridge height, tip projection, nostril definition */
  noseDetails: string;
  /** Lips and mouth description: fullness, cupid's bow, contour */
  lipDetails: string;
  /** Jawline, chin, and cheekbone prominence */
  jawlineDescription: string;
}

export interface BodyMorphometrics {
  /** Height in centimeters */
  heightCm: number;
  /** Approximate weight in kg or descriptive mass */
  weightKg?: number;
  /** Head-to-height ratio (7.5 classical realistic, 8.0-8.5 heroic webtoon) */
  headHeightRatio: number;
  /** Waist-to-Hip Ratio (WHR): female aesthetic curve ~0.65-0.72, male ~0.82-0.90 */
  waistToHipRatio: number;
  /** Shoulder-to-Hip Ratio (SHR): male V-taper ~1.40-1.65, female ~1.00-1.15 */
  shoulderToHipRatio: number;
  /** Chest-to-Waist Ratio (CWR) / Thoracic definition */
  chestToWaistRatio: number;
  /** Muscular definition continuous scale 0.0 (slender) to 1.0 (chiseled demon back) */
  muscularityLevel: number;
  /** Bust / chest volume continuous scale 0.0 (subtle) to 1.0 (voluptuous) */
  bustVolume: number;
  /** Galbe / glute curvature continuous scale 0.0 (lean) to 1.0 (pronounced hourglass shelf) */
  galbeCurvature: number;
  /** Body fat / adiposity appearance */
  bodyFatCategory: 'ultra_lean' | 'athletic_toned' | 'soft_athletic' | 'full_figured';
  /** Uncensored anatomical curves, bust gravity drape, hip shelves, glute curvature */
  anatomicalFeatures: {
    bustChestDescription: string;
    waistAbdomenDescription: string;
    hipGluteDescription: string;
    legsCalvesDescription: string;
    backShouldersDescription: string;
    handsFeetDescription: string;
  };
}

/** Granular continuous and discrete parameter inputs for Claude Code and Antigravity */
export interface GranularSlidersInput {
  // Muscle controls
  muscularitySlider?: number;             // 0.0 to 1.0 (continuous)
  muscularityDiscrete?: MuscularityLevelDiscrete;

  // Waist-to-Hip & Torso
  waistToHipRatio?: number;               // 0.55 to 1.05 (continuous)
  shoulderToHipRatio?: number;            // 0.95 to 1.75 (continuous)
  chestToWaistRatio?: number;             // 1.05 to 1.65 (continuous)

  // Bust / Chest controls
  bustVolumeSlider?: number;              // 0.0 to 1.0 (continuous)
  bustDiscrete?: BustFullnessDiscrete;
  bustNaturalGravity?: boolean;           // true enforces realistic downward teardrop drape

  // Galbe / Glutes controls
  galbeSlider?: number;                   // 0.0 to 1.0 (continuous)
  galbeDiscrete?: GalbeCurvatureDiscrete;

  // Facial morphometrics
  facialThirdsRatio?: [number, number, number]; // [forehead, midface, lowerface]
  canthalTiltDegrees?: number;            // -5° to +12° (continuous)
  bigonialWidthRatio?: number;            // 0.60 to 0.95 (continuous)
  gonialAngleDegrees?: number;            // 105° to 135° (continuous)
  cheekboneProminence?: number;           // 0.0 to 1.0 (continuous)
  philtrumToChinRatio?: number;           // 0.35 to 0.65 (continuous)
  nasolabialAngleDegrees?: number;        // 85° to 110° (continuous)

  // Height and build
  heightCm?: number;                      // 145 to 215 cm
  headHeightRatio?: number;               // 6.5 to 9.0 heads tall
  bodyFatCategory?: 'ultra_lean' | 'athletic_toned' | 'soft_athletic' | 'full_figured';

  // Clothing style & Ethnicity
  clothingStyle?: ClothingStyleCategory;
  ethnicity?: EthnicityCategory;
}

export interface CharacterBio {
  name: string;
  alias?: string;
  age: number | string;
  gender: GenderIdentity;
  ethnicityOrOrigin: string;
  ethnicityCategory?: EthnicityCategory;
  occupationOrRole: string;
  personalityKeywords: string[];
  signatureColors: {
    primary: string;
    secondary: string;
    accent: string;
    skinHex: string;
    hairHex: string;
    eyeHex: string;
  };
  backstorySummary: string;
}

export interface ClothingLayer {
  layerName: 'base' | 'inner' | 'outer' | 'bottom' | 'footwear' | 'accessories';
  description: string;
  fabricType: string;
  tensionFoldsAndDrapes: string;
  colorHexOrTone: string;
}

export interface ClothingMatrixPreset {
  style: ClothingStyleCategory;
  name: string;
  description: string;
  defaultLayers: ClothingLayer[];
  fabricTextures: string[];
  characteristicSilhouettes: string[];
  recommendedAccessories: string[];
}

export interface EthnicityPreset {
  category: EthnicityCategory;
  name: string;
  skinMelaninTone: string;
  skinHexDefault: string;
  undertone: 'warm_golden' | 'cool_pink' | 'neutral_olive' | 'deep_espresso_warm' | 'fair_peachy';
  facialTraitsDescription: string;
  epicanthicFold: 'prominent' | 'slight_subtle' | 'absent';
  hairTextureDefaults: string[];
  eyeHueDefaults: string[];
}

export interface LightingAndCameraProfile {
  primaryLightSource: string;
  rimLightingColor: string;
  shadowQuality: 'sharp_cel_shaded' | 'soft_ambient_occlusion' | 'chiaroscuro_dramatic';
  colorGrading: string;
  subsurfaceScattering: boolean;
  cameraFocalLength: string;
  cameraAngles: string[];
}

export interface CharacterDesignBlueprint {
  id: string;
  bio: CharacterBio;
  archetype: BodyArchetype;
  artStyle: ArtStylePreset;
  facialCanons: FacialCanons;
  morphometrics: BodyMorphometrics;
  wardrobe: ClothingLayer[];
  clothingStyle: ClothingStyleCategory;
  lighting: LightingAndCameraProfile;
  expressionsList: string[];
  posesList: string[];
  macroDetailsList: string[];
}

export interface PromptMatrixOutput {
  characterId: string;
  characterName: string;
  modelSheetTurnaroundPrompt: string;
  expressionMatrixPrompt: string;
  dynamicPoseSheetPrompt: string;
  macroDetailsPrompt: string;
  singleHeroPortraitPrompt: string;
  fullBodyActionPrompt: string;
  negativePrompts: {
    general: string;
    anatomicalCorrection: string;
    stylePreservation: string;
  };
  generatorSpecificPrompts: {
    midjourneyV6: string;
    stableDiffusionXL: string;
    flux1: string;
    geminiImagen3: string;
    dallE3?: string;
  };
}

/** Ollama Provider configuration and generation options */
export interface OllamaConfig {
  endpoint?: string;              // default: 'http://localhost:11434'
  model?: string;                 // default: 'mistral-nemo' (with fallbacks: 'mistral', 'qwen2.5')
  timeoutMs?: number;             // default: 12000 ms
  temperature?: number;           // default: 0.7
  protocol?: 'api_generate' | 'v1_chat_completions'; // default: 'api_generate'
  fallbackToProcedural?: boolean; // default: true
}

export interface GenerationMetadata {
  engine: 'ollama' | 'procedural_fallback';
  modelUsed?: string;
  endpointUsed?: string;
  durationMs: number;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  timestamp: string;
}

export interface CharacterGenerationResult {
  blueprint: CharacterDesignBlueprint;
  promptMatrix: PromptMatrixOutput;
  metadata: GenerationMetadata;
}
