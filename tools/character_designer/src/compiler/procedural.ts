/**
 * Deterministic Procedural Character Generator Engine.
 * 100% autonomous procedural engine generating reproducible character sheets.
 * Runs completely offline with zero external runtime dependencies.
 */

import type {
  CharacterDesignBlueprint,
  CharacterBio,
  BodyArchetype,
  GenderIdentity,
  ArtStyleCategory,
  ClothingStyleCategory,
  AttireState,
  GranularSlidersInput,
  EthnicityCategory,
  ClothingLayer
} from '../types.ts';
import { DeterministicPRNG } from './prng.ts';
import { generateFacialCanons } from '../anatomy/facial.ts';
import { generateBodyMorphometrics } from '../anatomy/body.ts';
import { getStylePreset } from '../styles/presets.ts';
import { getWardrobeLayers } from '../styles/wardrobes.ts';
import { getLightingProfile } from '../styles/lighting.ts';

const MALE_NAMES = [
  'Jin-Woo Kang', 'Min-Soo Park', 'Doh-Yun Lee', 'Tae-Hyun Choi',
  'Ren Takahashi', 'Kenzo Tanaka', 'Alexander Cross', 'Marcus Vance',
  'Damian Thorne', 'Gabriel O\'Connor', 'Ilya Volkov', 'Zayn Al-Mansoor'
];

const FEMALE_NAMES = [
  'Hana Kuroki', 'Ji-Woo Song', 'Eun-Ha Kim', 'So-Yeon Bae',
  'Aoi Shindo', 'Elena Rostova', 'Dr. Valeria Vance', 'Morgan LeClair',
  'Seraphina Ward', 'Amina Idris', 'Carmen Delgado', 'Sora Han'
];

const ANDROGYNOUS_NAMES = [
  'Kaelen Zephyr', 'Ren Shimizu', 'Yuuki Arai', 'Rowan Sterling',
  'Sasha Chen', 'Morgan Reyes', 'Eden Frost', 'Alexis Vane'
];

const OCCUPATIONS_HEROIC = [
  'S-Rank Shadow Hunter & Guildmaster',
  'Tactical Field Operative & Cyber-Breacher',
  'Neo-Seoul Special Task Force Captain',
  'Arcane Swordsman & Wandering Ronin',
  'Chief Biomechanical Research Scientist',
  'Underground Shadow Courier & Infiltrator',
  'High-Society Venture Strategist & Shadow Syndicate Lead',
  'Celestial Guardian & Aether Weaver'
];

const PERSONALITY_TRAITS = [
  'calculated', 'unflinching', 'protective', 'enigmatic',
  'commanding', 'relentless', 'sardonic', 'introspective',
  'hyper-perceptive', 'unyielding', 'magnetic', 'ferocious'
];

const CANONICAL_EXPRESSIONS = [
  'Neutral Stoic Default (calm baseline, level gaze)',
  'Confident Smirk (asymmetrical lip curl, sharp catchlight)',
  'Intense Glare (hooded eyes, flared nostrils, micro-scowl)',
  'Fierce Battle Roar (bared teeth, contracted masseter muscles)',
  'Surprised Vigilance (widened palpebral fissure, raised brows)',
  'Subtle Embarrassed Blush (averted gaze, peach cheek flush)',
  'Menacing Cold Gaze (narrowed pupils, shadowy lower lid)',
  'Gentle Warm Smile (softened crinkled eye corners, relaxed lips)',
  'Analytical Calculation (half-lidded focus, tilted head)',
  'Tears of Resolve (clenched jaw, glistening lower eyelid)',
  'Exhausted Determination (heaving chest, sweat bead on temple)',
  'Predatory Focus (acute canthal slant, dilating pupils)'
];

const CANONICAL_POSES = [
  'Turnaround Master View: Strict orthographic front, back, profile, and 3/4 standing stance',
  'Signature Action Stance: Low-center combat readiness with weighted back foot and raised guard',
  'Casual Stride: Hands resting in cargo pockets with flowing coat hem dynamic movement',
  'Dynamic Airborne Strike: Mid-air slash posture with cape billowing and extended limbs',
  'Commanding Seated Posture: Slumped throne / armchair repose with crossed legs and resting chin',
  'Intimate Weapon Inspection: Close inspection of blade/firearm with focused downward gaze'
];

const CANONICAL_MACRO_DETAILS = [
  'Micro-Structure of Iris: Multi-tiered radial striae, dark limbal ring, and crisp pinpoint catchlights',
  'Forearm Vascularity & Striations: Raised cephalic veins running along brachioradialis to knuckles',
  'Textile Tension & Stitching: Double-needle reinforced seams on denim and ballistic nylon webbing',
  'Epidermal Subsurface Scattering: Warm orange diffusion across nose bridge, ears, and finger knuckles',
  'Accessory Craftsmanship: Brushed steel buckles, engraved runic rings, and sapphire crystal watch face'
];

export interface GenerationOptions {
  seed?: string | number;
  gender?: GenderIdentity;
  name?: string;
  archetype?: BodyArchetype;
  style?: ArtStyleCategory;
  clothingStyle?: ClothingStyleCategory;
  attireState?: AttireState;
  ethnicity?: EthnicityCategory;
  lightingPreset?: string;
  sliders?: GranularSlidersInput;
}

export class ProceduralCharacterGenerator {
  public static generate(options: GenerationOptions = {}): CharacterDesignBlueprint {
    const seed = options.seed ?? `seed-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const prng = new DeterministicPRNG(seed);

    // 1. Gender & Bio
    const gender: GenderIdentity = options.gender ?? options.sliders?.gender ?? prng.pick(['male', 'female'] as const);

    let name = options.name;
    if (!name) {
      if (gender === 'male') name = prng.pick(MALE_NAMES);
      else if (gender === 'female') name = prng.pick(FEMALE_NAMES);
      else name = prng.pick(ANDROGYNOUS_NAMES);
    }

    const ethnicity: EthnicityCategory = options.ethnicity ?? options.sliders?.ethnicity ?? 'east_asian';
    const occupation = prng.pick(OCCUPATIONS_HEROIC);
    const personalities = prng.pickMultiple(PERSONALITY_TRAITS, 4);

    const bio: CharacterBio = {
      name,
      alias: `${name.split(' ')[0]} the Shadowbreaker`,
      age: prng.intInRange(21, 32),
      gender,
      ethnicityOrOrigin: ethnicity.replace('_', ' ').toUpperCase(),
      ethnicityCategory: ethnicity,
      occupationOrRole: occupation,
      personalityKeywords: personalities,
      signatureColors: {
        primary: prng.pick(['#0F172A (Obsidian Navy)', '#18181B (Pitch Black)', '#3F2E23 (Deep Walnut)', '#020617 (Midnight)']),
        secondary: prng.pick(['#38BDF8 (Electric Cyan)', '#F59E0B (Amber Gold)', '#DC2626 (Crimson Flare)', '#A855F7 (Amethyst Glow)']),
        accent: '#F8FAFC (Pure Light)',
        skinHex: gender === 'female' ? '#F7E7DE (Warm Ivory Porcelain)' : '#EBD5C3 (Natural Tanned Peach)',
        hairHex: prng.pick(['#09090B (Jet Raven)', '#1E293B (Midnight Blue)', '#78350F (Chestnut)', '#E2E8F0 (Platinum Silver)']),
        eyeHex: prng.pick(['#0284C7 (Luminescent Blue)', '#7C3AED (Violet Amethyst)', '#B45309 (Topaz Amber)', '#1E293B (Deep Obsidian)'])
      },
      backstorySummary: `A formidable operative forged in the trials of the subterranean catacombs. Renowned across sectors for unmatched biometric discipline, lethal spatial instincts, and unwavering tactical presence.`
    };

    // 2. Archetype & Style
    let archetype: BodyArchetype = options.archetype ?? options.sliders?.archetype ?? (
      gender === 'male' ? 'hyper_muscular_hero' : 'voluptuous_curvaceous'
    );

    const artStyleCategory: ArtStyleCategory = options.style ?? options.sliders?.artStyleCategory ?? 'Webtoon Action';
    const styleDef = getStylePreset(artStyleCategory);

    const clothingStyle: ClothingStyleCategory = options.clothingStyle ?? options.sliders?.clothingStyle ?? 'streetwear';
    const attireState: AttireState = options.attireState ?? options.sliders?.attireState ?? 'duty';

    // 3. Facial Canons
    const facialCanons = generateFacialCanons(gender, prng, options.sliders);

    // 4. Body Morphometrics
    const morphometrics = generateBodyMorphometrics(gender, archetype, prng, options.sliders);

    // 5. Wardrobe Layers
    const wardrobe = getWardrobeLayers(clothingStyle, attireState);

    // 6. Lighting Profile
    const lightingPresetName = options.lightingPreset ?? (
      artStyleCategory === 'Webtoon Action' ? 'chiaroscuro_dramatic' :
      (artStyleCategory === 'Anime' ? 'cyber_neon_noir' :
      (artStyleCategory === 'Seinen' ? 'chiaroscuro_dramatic' : 'hygge_golden_hour'))
    );
    const lighting = getLightingProfile(lightingPresetName);

    return {
      id: `char-${DeterministicPRNG.hashString(prng.seedString).toString(16)}`,
      seed: prng.seedString,
      bio,
      archetype,
      artStyleCategory,
      artStylePreset: styleDef.preset,
      facialCanons,
      morphometrics,
      wardrobe,
      attireState,
      clothingStyle,
      lighting,
      expressionsList: CANONICAL_EXPRESSIONS,
      posesList: CANONICAL_POSES,
      macroDetailsList: CANONICAL_MACRO_DETAILS
    };
  }
}
