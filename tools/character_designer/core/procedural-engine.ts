/**
 * Procedural Deterministic Engine for Character Aesthetic Synthesis.
 * Pure TypeScript, zero external dependencies, 100% PRNG-capable fallback.
 * Generates comprehensive CharacterDesignBlueprints and compiles multi-generator
 * prompt matrices based on scientific morphometrics, granular sliders, and
 * visual corpus standards.
 */

import {
  CharacterDesignBlueprint,
  CharacterBio,
  PromptMatrixOutput,
  ArtStylePreset,
  BodyArchetype,
  GenderIdentity,
  ClothingStyleCategory,
  EthnicityCategory,
  GranularSlidersInput
} from './types.js';

import {
  buildFacialCanons,
  buildMorphometrics,
  buildWardrobeForStyle,
  CLOTHING_MATRICES,
  ETHNICITY_PRESETS
} from './granular-controls.js';

export interface ProceduralGenerationSpec {
  name?: string;
  alias?: string;
  age?: number | string;
  gender?: GenderIdentity;
  ethnicity?: EthnicityCategory;
  archetype?: BodyArchetype;
  artStyle?: ArtStylePreset;
  clothingStyle?: ClothingStyleCategory;
  occupationOrRole?: string;
  personalityKeywords?: string[];
  granularSliders?: GranularSlidersInput;
  seed?: number;
}

/** Simple linear congruential PRNG for reproducible deterministic generations */
class SimplePrng {
  private state: number;

  constructor(seed: number = 42) {
    this.state = Math.abs(seed) % 2147483647;
    if (this.state === 0) this.state = 1;
  }

  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  pick<T>(items: T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const idx = Math.floor(this.next() * items.length);
    return items[idx]!;
  }
}

export class ProceduralEngine {
  /**
   * Generates a complete, consistent CharacterDesignBlueprint deterministically.
   */
  static generateBlueprint(spec: ProceduralGenerationSpec = {}): CharacterDesignBlueprint {
    const prng = new SimplePrng(spec.seed ?? 1337);

    const gender: GenderIdentity = spec.gender ?? (prng.next() > 0.5 ? 'male' : 'female');
    const ethnicity: EthnicityCategory = spec.ethnicity ?? (spec.granularSliders?.ethnicity ?? 'east_asian');
    const ethPreset = ETHNICITY_PRESETS[ethnicity] ?? ETHNICITY_PRESETS.east_asian;

    const archetype: BodyArchetype = spec.archetype ?? (
      gender === 'female'
        ? (prng.next() > 0.5 ? 'voluptuous_curvaceous' : 'lean_athletic')
        : (gender === 'male'
            ? (prng.next() > 0.5 ? 'hyper_muscular_hero' : 'lean_athletic')
            : (prng.next() > 0.5 ? 'slender_elegant' : 'lean_athletic'))
    );

    const artStyle: ArtStylePreset = spec.artStyle ?? 'korean_webtoon_cinematic';
    const clothingStyle: ClothingStyleCategory = spec.clothingStyle ?? (spec.granularSliders?.clothingStyle ?? 'streetwear');

    const defaultNamesMale = ['Kang Jin-Woo', 'Ryu Min-Seok', 'Leo Vance', 'Dante Silva', 'Malik Al-Sayed', 'Soren Thorne'];
    const defaultNamesFemale = ['Kang Ye-Rin', 'Han Seo-Yun', 'Elena Rostova', 'Aria Chen', 'Nadia Benali', 'Chloe Dubois'];
    const defaultNamesAndro = ['Kaelen Zephyr', 'Ren Morgan', 'Sora Vance', 'Alex Quinn', 'Robin Cross', 'Valen Thorne'];

    const name = spec.name ?? (
      gender === 'female'
        ? prng.pick(defaultNamesFemale)
        : (gender === 'male' ? prng.pick(defaultNamesMale) : prng.pick(defaultNamesAndro))
    );
    const age = spec.age ?? Math.floor(20 + prng.next() * 12);
    const role = spec.occupationOrRole ?? (archetype === 'hyper_muscular_hero' ? 'S-Rank Vanguard Hunter' : 'Creative Director & Strategist');

    const personality = spec.personalityKeywords ?? [
      'calculateur', 'magnétique', 'impitoyable sous pression', 'résilient', 'visionnaire'
    ];

    // Colors
    const primaryColors = ['#0F172A', '#1E3A8A', '#312E81', '#111827', '#4C1D95', '#064E3B'];
    const accentColors = ['#38BDF8', '#F59E0B', '#EF4444', '#10B981', '#A855F7', '#EC4899'];
    const primary = prng.pick(primaryColors);
    const accent = prng.pick(accentColors);

    const bio: CharacterBio = {
      name,
      alias: spec.alias ?? (role.includes('Hunter') ? 'The Shadow Sovereign' : undefined),
      age,
      gender,
      ethnicityOrOrigin: ethPreset.name,
      ethnicityCategory: ethnicity,
      occupationOrRole: role,
      personalityKeywords: personality,
      signatureColors: {
        primary,
        secondary: '#1E293B',
        accent,
        skinHex: ethPreset.skinHexDefault,
        hairHex: '#171717',
        eyeHex: ethPreset.eyeHueDefaults[0] ?? '#2D3748'
      },
      backstorySummary: `Évoluant dans un univers urbain contemporain aux tensions aiguës, ${name} combine une maîtrise corporelle d'exception avec un sens aigu de la stratégie. Sa silhouette impose le respect instantanément.`
    };

    // Granular morphometrics & canons
    const sliderInput: GranularSlidersInput = spec.granularSliders ?? {};
    sliderInput.clothingStyle = clothingStyle;
    sliderInput.ethnicity = ethnicity;

    const facialCanons = buildFacialCanons(sliderInput, gender);
    const morphometrics = buildMorphometrics(sliderInput, gender, archetype);
    const wardrobe = buildWardrobeForStyle(clothingStyle, {
      primary: bio.signatureColors.primary,
      secondary: bio.signatureColors.secondary,
      accent: bio.signatureColors.accent
    });

    const lighting = {
      primaryLightSource: 'Lumière clé directionnelle 45° douce (Studio Softbox 5600K)',
      rimLightingColor: `${accent} rasante froide (Edge Rim Light)`,
      shadowQuality: 'sharp_cel_shaded' as const,
      colorGrading: 'Contraste cinématographique manhwa, ombres bleu-nuit profondes, tons chair saturés à diffusion sous-cutanée',
      subsurfaceScattering: true,
      cameraFocalLength: '85mm f/1.4 portrait cinématographique',
      cameraAngles: ['Frontal eye-level', 'Profil 90° gauche', 'Vue 3/4 plongeante héroïque', 'Contre-plongée dramatique dos']
    };

    const expressionsList = [
      'Neutre souverain au regard perçant',
      'Sourire en coin narquois (subtle smirk)',
      'Regard de combat foudroyant avec pupilles dilatées',
      'Surprise et dilatation des iris',
      'Gêne feutrée avec rougeur subtile des pommettes',
      'Rire éclatant découvrant des dents nettes',
      'Regard déterminé sous sourcils froncés',
      'Concentration froide et sourcils détendus',
      'Mélancolie retenue avec regard dans le vide',
      'Clin d’œil complice dynamique',
      'Rictus d’effort intense avec veines temporales',
      'Sérénité méditative les yeux mi-clos'
    ];

    const posesList = [
      'Garde de combat neutre pieds ancrés et poings serrés',
      'Marche urbaine dynamique en mouvement avec pardessus flottant',
      'Assis sur un siège haut, une jambe croisée avec assurance',
      'Bras croisés sur le torse valorisant les deltoïdes',
      'Regard jeté par-dessus l’épaule en contre-plongée',
      'Préparation de frappe avec torsion du buste et tension musculaire',
      'Pose de repos décontractée, mains glissées dans les poches de cargo'
    ];

    const macroDetailsList = [
      'Gros plan macro sur l’iris avec double reflet spéculaire et anneau limbique foncé',
      'Détail anatomique de la main avec relief des veines céphaliques et articulations',
      'Tombé de tissu avec plis de tension horizontaux sur la taille et le torse',
      'Texture des chaussures avec semelle crantée et laçage précis',
      'Boucles métalliques, fermetures et coutures de vêtement au millimètre'
    ];

    return {
      id: `char_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${spec.seed ?? 1}`,
      bio,
      archetype,
      artStyle,
      facialCanons,
      morphometrics,
      wardrobe,
      clothingStyle,
      lighting,
      expressionsList,
      posesList,
      macroDetailsList
    };
  }

  /**
   * Compiles complete, high-impact prompt matrices from a CharacterDesignBlueprint.
   */
  static compilePrompts(blueprint: CharacterDesignBlueprint): PromptMatrixOutput {
    const { bio, facialCanons, morphometrics, wardrobe, clothingStyle, archetype, artStyle, lighting } = blueprint;

    const styleMatrix = CLOTHING_MATRICES[clothingStyle] ?? CLOTHING_MATRICES.streetwear;
    const isFemale = bio.gender === 'female';

    // Style token
    let styleDescriptor = 'master character model sheet, authentic Korean manhwa webtoon style, Solo Leveling and Redice aesthetic, crisp digital line art, vibrant cel shading with smooth gradient transitions, artstation trending';
    if (artStyle === 'modern_webtoon_romance') {
      styleDescriptor = 'high fashion romance webtoon model sheet, clean refined linework, soft glowing porcelain skin, pastel and vibrant accents, True Beauty aesthetic, ultra detailed';
    } else if (artStyle === 'tactical_semi_realistic') {
      styleDescriptor = 'tactical semi-realistic character sheet, military concept art, matte textures, layered fabric tension, sharp rim lighting';
    } else if (artStyle === 'anime_cel_shaded_premium') {
      styleDescriptor = 'premium anime character turnaround sheet, razor sharp ink lines, vivid cel shading, high production anime movie aesthetic';
    } else if (artStyle === 'painterly_digital_manhwa') {
      styleDescriptor = 'painterly digital manhwa character sheet, rich digital oil and gouache brushwork, layered painterly textures, deep atmospheric lighting, subsurface scattering';
    } else if (artStyle === 'stylized_3d_render') {
      styleDescriptor = 'stylized 3D character sculpt sheet, Octane render 3D character model sheet, raymarched subsurface scattering, PBR material definition, studio lighting';
    } else if (artStyle === 'retro_pixel_concept') {
      styleDescriptor = 'high resolution retro pixel art character sheet, clean 16-bit and 32-bit pixel cluster rendering, sharp pixel linework, orthographic turnaround sprite sheet';
    }

    // Anatomy tokens
    let anatomyTokens: string;
    if (isFemale) {
      anatomyTokens = `authentic natural female anatomy, bust volume ${(morphometrics.bustVolume * 10).toFixed(1)}/10 with realistic teardrop gravity drape, waist-to-hip ratio WHR ${morphometrics.waistToHipRatio.toFixed(2)}, pronounced galbe shelf ${(morphometrics.galbeCurvature * 10).toFixed(1)}/10, athletic feminine curves without artificial censorship, ${morphometrics.headHeightRatio} heads tall statuesque build`;
    } else if (bio.gender === 'male') {
      anatomyTokens = `imposing athletic male physique, muscularity ${(morphometrics.muscularityLevel * 10).toFixed(1)}/10, chiseled 8-pack abdominals, serratus anterior cuts, vascular forearms, wide V-taper latissimus dorsi with shoulder-to-hip ratio SHR ${morphometrics.shoulderToHipRatio.toFixed(2)}, demon back muscularity, ${morphometrics.headHeightRatio} heads tall heroic silhouette`;
    } else {
      anatomyTokens = `sleek androgynous silhouette, toned athletic conditioning ${(morphometrics.muscularityLevel * 10).toFixed(1)}/10, balanced thoracic contour ${(morphometrics.bustVolume * 10).toFixed(1)}/10, slender waist-to-hip ratio WHR ${morphometrics.waistToHipRatio.toFixed(2)}, graceful galbe shelf ${(morphometrics.galbeCurvature * 10).toFixed(1)}/10, ${morphometrics.headHeightRatio} heads tall statuesque build`;
    }

    // Facial tokens
    const facialTokens = `facial thirds ${facialCanons.facialThirdsRatio.join(':')}, canthal tilt +${facialCanons.canthalTiltDegrees} degrees, gonial angle ${facialCanons.gonialAngleDegrees} degrees, bigonial width ratio ${facialCanons.bigonialWidthRatio.toFixed(2)}, cheekbone prominence ${(facialCanons.cheekboneProminence * 10).toFixed(1)}/10, ${facialCanons.eyeDetails}, ${facialCanons.noseDetails}, ${facialCanons.lipDetails}, ${facialCanons.jawlineDescription}`;

    // Wardrobe tokens
    const wardrobeTokens = wardrobe.map(l => `${l.layerName}: ${l.description} (${l.fabricType}, ${l.tensionFoldsAndDrapes})`).join('; ');

    // 1. Model sheet turnaround
    const modelSheetTurnaroundPrompt = [
      styleDescriptor,
      `character: ${bio.name}, ${bio.age} years old, ${bio.ethnicityOrOrigin}, ${bio.occupationOrRole}`,
      `five-view turnaround: front view, back view, left profile, right profile, 3/4 dynamic perspective`,
      anatomyTokens,
      facialTokens,
      `outfit style: ${styleMatrix.name}, wearing ${wardrobeTokens}`,
      `signature colors: primary ${bio.signatureColors.primary}, secondary ${bio.signatureColors.secondary}, accent ${bio.signatureColors.accent}`,
      `lighting: ${lighting.primaryLightSource}, ${lighting.rimLightingColor}, subsurface scattering skin effect`,
      `clean reference sheet layout on neutral grey background, high resolution 8k, crisp orthographic character blueprint`
    ].join(', ');

    // 2. Expression matrix
    const expressionMatrixPrompt = [
      styleDescriptor,
      `expression grid of ${bio.name}, 12 facial emotion studies arranged in clean 4x3 matrix`,
      `emotions: neutral confident, subtle smirk, intense combat glare, surprised shock, embarrassed blush, roaring laughter, deep sorrow, cold focus, mischievous wink, exasperated sigh, determined scowl, serene bliss`,
      `capturing precise micro-expressions, facial thirds balance, detailed iris reflections with sharp catchlights, authentic mouth and lip shapes`,
      `consistent character identity across all 12 frames, white studio background, high definition facial study`
    ].join(', ');

    // 3. Dynamic pose sheet
    const dynamicPoseSheetPrompt = [
      styleDescriptor,
      `dynamic action pose sheet for ${bio.name}`,
      `seven distinct poses: neutral combat stance, high-speed sprint with trailing motion, seated on high stool with relaxed posture, dominant crossed arms, looking back over shoulder in dramatic low angle, preparing strike with torso twist and muscle tension, casual relaxed pose with hands in pockets`,
      anatomyTokens,
      `accurate biomechanical weight shift, dramatic foreshortening, clothing folds reacting to kinetic movement`,
      `character concept art, white background, masterpiece`
    ].join(', ');

    // 4. Macro details prompt
    const macroDetailsPrompt = [
      styleDescriptor,
      `macro detail sheet for ${bio.name}`,
      `close-up callouts: extreme close-up of eye showing iris limbal ring and reflections; hand anatomy showing defined knuckles and vascular lines; fabric tension folds across the torso; footwear tread and sole construction; metallic buckle and accessories with crisp specular highlights`,
      `artstation character design master sheet, forensic anatomical precision`
    ].join(', ');

    // 5. Single hero portrait
    const singleHeroPortraitPrompt = [
      styleDescriptor,
      `heroic character portrait of ${bio.name}, ${bio.occupationOrRole}`,
      `bust and shoulder close-up shot, intense magnetic eye contact, ${facialTokens}`,
      `dramatic chiaroscuro lighting, strong ${bio.signatureColors.accent} rim light carving jawline and hair strands, glowing skin with realistic subsurface scattering`,
      `wearing ${wardrobe[1]?.description ?? wardrobe[0]?.description}, subtle atmospheric dust particles, 85mm f/1.4 lens bokeh, ultra high definition masterpiece`
    ].join(', ');

    // 6. Full body action prompt
    const fullBodyActionPrompt = [
      styleDescriptor,
      `full body cinematic action shot of ${bio.name} unleashing power in modern urban environment`,
      anatomyTokens,
      `wearing ${styleMatrix.name} outfit with dramatic cloth flutter and wind physics`,
      `dramatic low-angle perspective, dynamic combat pose, ${lighting.rimLightingColor}, cinematic depth of field, blockbuster manhwa key visual`
    ].join(', ');

    // Negatives
    const negativePrompts = {
      general: 'blurry, low resolution, deformed anatomy, extra limbs, missing fingers, extra fingers, mutated hands, poorly drawn face, disfigured, bad eyes, fused fingers, watermark, signature, username, cropped, low quality',
      anatomicalCorrection: 'plastic skin, barbie doll anatomy, artificial blur, disproportioned head, missing neck muscles, flat ribcage, impossible spine contortion, amputated limbs, asymmetrical pupils, crossed eyes',
      stylePreservation: 'western comic book style, 3d clay render, chibi, rough sketch, scribbles, muddy colors, washed out contrast, monochrome, low poly artifacts'
    };

    // Generator-specific prompts
    const generatorSpecificPrompts = {
      midjourneyV6: `${modelSheetTurnaroundPrompt} --ar 16:9 --style raw --v 6.0`,
      stableDiffusionXL: `masterpiece, best quality, highly detailed, ${modelSheetTurnaroundPrompt}`,
      flux1: `Professional character design model turnaround sheet. A striking ${bio.gender} named ${bio.name}, age ${bio.age}, with ${bio.ethnicityOrOrigin} features. ${anatomyTokens}. Wearing ${styleMatrix.name} fashion with ${wardrobeTokens}. 5 turnaround angles against a neutral background. Rendered in ${styleDescriptor} with sharp cel-shading and vivid lighting.`,
      geminiImagen3: `A comprehensive character model sheet of ${bio.name}, an S-tier protagonist in a modern manhwa aesthetic. Full 5-angle turnaround including front, back, profile, and three-quarter views. The character features ${anatomyTokens}, with ${bio.signatureColors.primary} and ${bio.signatureColors.accent} color motifs. Studio lighting with prominent rim light emphasizing the silhouette. Neutral gray background, 8k resolution, razor-sharp digital illustration.`,
      dallE3: `Professional character design model turnaround sheet. A striking ${bio.gender} named ${bio.name}, ${bio.age} years old, with ${bio.ethnicityOrOrigin} features. ${anatomyTokens}. Fashion: ${styleMatrix.name} (${wardrobeTokens}). Five view turnaround showing front, back, profile, and dynamic 3/4 perspective against a neutral grey studio background. Style: ${styleDescriptor}.`
    };

    return {
      characterId: blueprint.id,
      characterName: bio.name,
      modelSheetTurnaroundPrompt,
      expressionMatrixPrompt,
      dynamicPoseSheetPrompt,
      macroDetailsPrompt,
      singleHeroPortraitPrompt,
      fullBodyActionPrompt,
      negativePrompts,
      generatorSpecificPrompts
    };
  }
}
