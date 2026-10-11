/**
 * Procedural Character Blueprint Builder & Slider Engine.
 * Converts continuous and discrete parameters from AI agents (Claude, Antigravity)
 * into mathematically sound, biologically grounded character specifications.
 */

import {
  CharacterDesignBlueprint,
  GranularSlidersInput,
  CharacterBio,
  BodyMorphometrics,
  FacialCanons,
  ClothingLayer,
  ArtStylePreset,
  BodyArchetype,
  ClothingStyleCategory,
  EthnicityCategory,
  LightingAndCameraProfile,
  EthnicityPreset,
  ClothingMatrixPreset,
} from './types.js';

export const ETHNICITY_PRESETS: Record<EthnicityCategory, EthnicityPreset> = {
  east_asian: {
    category: 'east_asian',
    name: 'Est-Asiatique (Coréen / Japonais / Mandchou)',
    skinMelaninTone: 'Fair porcelain to warm peach ivory, translucent glass-skin texture',
    skinHexDefault: '#ffc496',
    undertone: 'fair_peachy',
    facialTraitsDescription: 'Refined cheekbones, elegant straight nasal bridge, delicate jawline, slight epicanthic fold',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Silky straight 1A with angel-ring highlights', 'Textured two-block with soft wave 2A', 'Airy curtain fringe comma hair'],
    eyeHueDefaults: ['Deep obsidian black', 'Warm chocolate brown', 'Luminescent amber with golden flecks'],
  },
  african: {
    category: 'african',
    name: 'Afro-descendant (Afrique subsaharienne / Diaspora)',
    skinMelaninTone: 'Deep rich espresso to radiant warm copper-bronze, high melanin radiance',
    skinHexDefault: '#4a2a1a',
    undertone: 'deep_espresso_warm',
    facialTraitsDescription: 'Prominent sculpted cheekbones, broad noble nasal bridge, full contoured lips with defined vermilion border',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['4C tight coily micro-spirals', 'Geometric scalp-parted cornrows', 'Sculpted fade with crisp hairline', 'Long box braids with metallic clasps'],
    eyeHueDefaults: ['Rich deep dark brown', 'Warm hazel-gold', 'Dark espresso with striking amber flecks'],
  },
  caucasian: {
    category: 'caucasian',
    name: 'Caucasien / Européen continental',
    skinMelaninTone: 'Fair to light olive, subtle pink or peach undertones',
    skinHexDefault: '#fcdbb8',
    undertone: 'cool_pink',
    facialTraitsDescription: 'Defined brow ridge, narrow straight nasal profile, angular jawline',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Fine straight 1B', 'Soft natural waves 2B', 'Tousled textured layers'],
    eyeHueDefaults: ['Steel blue', 'Emerald green', 'Cool slate grey', 'Chestnut brown'],
  },
  middle_eastern: {
    category: 'middle_eastern',
    name: 'Moyen-Oriental & Méditerranéen',
    skinMelaninTone: 'Warm golden olive to sun-warmed amber bronze',
    skinHexDefault: '#c9a06c',
    undertone: 'neutral_olive',
    facialTraitsDescription: 'Sculpted aquiline nasal bridge, deep-set intense eyes with dense lash lines, strong defined mandibular profile',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Thick voluminous waves 2C', 'Dense dark curls 3A', 'Crisply groomed textured fade'],
    eyeHueDefaults: ['Deep piercing onyx black', 'Warm dark amber', 'Golden hazel'],
  },
  south_asian: {
    category: 'south_asian',
    name: 'Sud-Asiatique (Indo-Pakistanais)',
    skinMelaninTone: 'Warm honey bronze to deep rich cinnamon',
    skinHexDefault: '#a06a40',
    undertone: 'warm_golden',
    facialTraitsDescription: 'High malar prominence, striking almond eyes with natural kohl-like lash density, expressive arched brows',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Lustrous thick black waves 2B', 'Silky dark straight layers 1B', 'Voluminous coils 3B'],
    eyeHueDefaults: ['Deep dark honey brown', 'Golden brown', 'Warm black'],
  },
  latin_american: {
    category: 'latin_american',
    name: 'Latino-Américain & Métis',
    skinMelaninTone: 'Warm golden-caramel to radiant sun-kissed tan',
    skinHexDefault: '#d59b63',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Harmonious cheekbones, warm almond eye contours, sculpted smiling lips',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Bouncy energetic curls 3B', 'Wavy layered cut 2B', 'Tapered fade with textured top'],
    eyeHueDefaults: ['Warm chestnut brown', 'Amber honey', 'Dark expressive brown'],
  },
  nordic: {
    category: 'nordic',
    name: 'Nordique / Scandinave',
    skinMelaninTone: 'Translucent alabaster porcelain with light natural shoulder freckles',
    skinHexDefault: '#ffe0cc',
    undertone: 'cool_pink',
    facialTraitsDescription: 'High sculpted malar cheekbones, sharp jawline, high forehead, delicate nose',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Platinum blonde fine straight 1A', 'Ash blonde wavy strands 2A', 'Icy white layers'],
    eyeHueDefaults: ['Glacier ice blue', 'Pale silver grey', 'Translucent sea green'],
  },
  southeast_asian: {
    category: 'southeast_asian',
    name: 'Sud-Est Asiatique (Thaï / Vietnamien / Philippin)',
    skinMelaninTone: 'Warm golden ochre to sunlit bronze',
    skinHexDefault: '#e2ad7a',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Gentle almond eyes, soft yet defined jawline, full expressive lips',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Glossy black straight 1A', 'Textured wavy crop 2A'],
    eyeHueDefaults: ['Warm dark espresso', 'Golden brown'],
  },
  indigenous_american: {
    category: 'indigenous_american',
    name: 'Autochtone Américain',
    skinMelaninTone: 'Rich bronze to warm terra-cotta earth tone',
    skinHexDefault: '#b47a56',
    undertone: 'warm_golden',
    facialTraitsDescription: 'High prominent cheekbones, strong noble nose, firm jawline',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Heavy lustrous straight black 1A', 'Braided dark lengths'],
    eyeHueDefaults: ['Deep dark brown'],
  },
  polynesian: {
    category: 'polynesian',
    name: 'Polynésien / Insulaire Pacifique',
    skinMelaninTone: 'Warm golden-brown with rich copper undertones',
    skinHexDefault: '#8c5634',
    undertone: 'warm_golden',
    facialTraitsDescription: 'Broad athletic facial bones, kind yet piercing eyes, full lips',
    epicanthicFold: 'absent',
    hairTextureDefaults: ['Voluminous wavy textured 2C', 'Lustrous thick curls 3A'],
    eyeHueDefaults: ['Warm dark brown', 'Deep hazel'],
  },
  fantasy_hybrid: {
    category: 'fantasy_hybrid',
    name: 'Hybride Fantastique / Éthéré',
    skinMelaninTone: 'Opalescent skin with subtle bioluminescent sheen',
    skinHexDefault: '#f3ead8',
    undertone: 'cool_pink',
    facialTraitsDescription: 'Delicate pointed ear tips, ethereal micro-freckles, otherworldly symmetry',
    epicanthicFold: 'slight_subtle',
    hairTextureDefaults: ['Prismatic silver threads', 'Spectral midnight blue waves'],
    eyeHueDefaults: ['Luminescent violet', 'Cyan glow', 'Pure gold'],
  },
};

export const CLOTHING_PRESETS: Record<ClothingStyleCategory, ClothingMatrixPreset> = {
  streetwear: {
    style: 'streetwear',
    name: 'K-Streetwear Contemporain (Séoul / Hongdae)',
    description: 'Silhouettes déstructurées oversize, layering lourd, pantalons cargo parachute et sneakers rétro.',
    defaultLayers: [
      { layerName: 'inner', description: 'Longline heavyweight cotton t-shirt with straight hem', fabricType: 'Cotton jersey 280gsm', tensionFoldsAndDrapes: 'Relaxed horizontal drape hanging past waist', colorHexOrTone: '#f8f9fa' },
      { layerName: 'outer', description: 'Oversized boxy zip-up hoodie with drop shoulders and stiff structured hood', fabricType: 'Loopback fleece 450gsm', tensionFoldsAndDrapes: 'Deep elbow tension folds, bulky shoulder drape', colorHexOrTone: '#1e1e24' },
      { layerName: 'bottom', description: 'Wide-leg tactical cargo trousers with 6 pleated bellow pockets and drawstring cuffs', fabricType: 'Matte cotton ripstop', tensionFoldsAndDrapes: 'Stacked horizontal folds bunching over footwear', colorHexOrTone: '#2b2d42' },
      { layerName: 'footwear', description: 'Two-tone retro basketball high-top sneakers with sculpted platform soles', fabricType: 'Leather & mesh', tensionFoldsAndDrapes: 'Sturdy structured profile', colorHexOrTone: '#edf2f4' },
      { layerName: 'accessories', description: 'Cuban link silver chain necklace, matte black crossbody chest pouch, wireless over-ear headphones rested around neck', fabricType: 'Stainless steel & ballistic nylon', tensionFoldsAndDrapes: 'Snug ergonomic contouring', colorHexOrTone: '#adb5bd' },
    ],
    fabricTextures: ['Heavyweight fleece', 'Matte cotton ripstop', 'Raw selvedge denim', 'Tumbled leather'],
    characteristicSilhouettes: ['Boxy top over stacked wide bottoms', 'Drop shoulder volume', 'Layered hem contrast'],
    recommendedAccessories: ['Over-ear headphones on neck', 'Crossbody sling bag', 'Silver chain necklace', 'Beanie or low-profile cap'],
  },
  techwear: {
    style: 'techwear',
    name: 'Techwear Tactique Urbain (Cyber Hunter)',
    description: 'Matières techniques imperméables laminées, fermetures étanches thermocollées, sangles avec boucles magnétiques Fidlock.',
    defaultLayers: [
      { layerName: 'base', description: 'Ergonomic moisture-wicking compression base layer shirt with thumbhole cuffs', fabricType: 'Spandex-poly technical mesh', tensionFoldsAndDrapes: 'Skin-tight tension mapping athletic muscular cuts', colorHexOrTone: '#121212' },
      { layerName: 'outer', description: 'Modular stormproof shell jacket with asymmetric storm flap, laser-cut vents, and magnetic Fidlock buckles', fabricType: '3-layer Gore-Tex Pro matte membrane', tensionFoldsAndDrapes: 'Angular crisp creasing with water-repellent surface tension', colorHexOrTone: '#0a0a0c' },
      { layerName: 'bottom', description: 'Articulated motorized cargo pants with ergonomic knee gussets and reinforced seat', fabricType: 'Cordura 500D nylon', tensionFoldsAndDrapes: 'Directional kinetic pleats along quadriceps', colorHexOrTone: '#17171c' },
      { layerName: 'footwear', description: 'Waterproof tactical combat boots with speed-lacing and deep-lug Vibram outsole', fabricType: 'Rubberized leather and ballistic mesh', tensionFoldsAndDrapes: 'Rugged structured ankle support', colorHexOrTone: '#050505' },
      { layerName: 'accessories', description: 'Tactical chest rig harness with MOLLE webbings, fingerless composite knuckle gloves, utility leg strap holster', fabricType: 'Nylon webbing & matte anodized aluminum', tensionFoldsAndDrapes: 'Firm taut tension strapping body lines', colorHexOrTone: '#212529' },
    ],
    fabricTextures: ['3-layer waterproof membrane', 'Ballistic Cordura', 'Coated YKK Aquaguard zips', 'Thermal neoprene'],
    characteristicSilhouettes: ['Aggressive tapered silhouette', 'Segmented modular panels', 'Fitted athletic core beneath structured shell'],
    recommendedAccessories: ['Fidlock magnetic utility belt', 'Chest rig harness', 'Fingerless composite gloves', 'Weatherproof sling'],
  },
  modern_hanbok_kimono: {
    style: 'modern_hanbok_kimono',
    name: 'Modern Neo-Hanbok & Martial Gi',
    description: 'Veste croisée asymétrique à revers traditionnel, col rigide revisité, pans fluides sur pantalon contemporain.',
    defaultLayers: [
      { layerName: 'inner', description: 'Sleeveless high-neck cotton martial base top', fabricType: 'Breathable bamboo cotton', tensionFoldsAndDrapes: 'Fitted across thoracic frame', colorHexOrTone: '#ffffff' },
      { layerName: 'outer', description: 'Deconstructed modern Jeogori / Haori hybrid jacket with crisp standing collar and magnetic ribbon wrap closure', fabricType: 'Raw textured linen-silk blend', tensionFoldsAndDrapes: 'Fluid sweeping drape reacting to martial stance', colorHexOrTone: '#1a1d20' },
      { layerName: 'bottom', description: 'Modified wide pleated Baji trousers tapered sharply at calves with traditional tie ribbons', fabricType: 'Medium-weight cotton twill', tensionFoldsAndDrapes: 'Voluminous thigh billowing into snug calf binds', colorHexOrTone: '#24282c' },
      { layerName: 'footwear', description: 'Minimalist low-top tabi boots or sleek modern leather martial slip-ons', fabricType: 'Soft calfskin leather', tensionFoldsAndDrapes: 'Second-skin foot articulation', colorHexOrTone: '#0f0f11' },
      { layerName: 'accessories', description: 'Modern embroidered Otgoreum knot waist sash with brass suspension rings, jade minimalist talisman pendant', fabricType: 'Silk cord & carved nephrite', tensionFoldsAndDrapes: 'Free-hanging pendulum drape', colorHexOrTone: '#2d6a4f' },
    ],
    fabricTextures: ['Raw linen-silk', 'Sashiko grain weave cotton', 'Flowing organza', 'Supple calfskin'],
    characteristicSilhouettes: ['Sweeping asymmetrical wrap', 'High-contrast volume between billowing pants and snug calves', 'Graceful motion lines'],
    recommendedAccessories: ['Traditional Otgoreum waist cord', 'Jade talisman', 'Gauze wrist wraps'],
  },
  light_armor: {
    style: 'light_armor',
    name: 'Armure Légère & Tactique de Chasseur',
    description: 'Plastron en titane mat ou polymère balistique sur combinaison souple, épaulières articulées profilées.',
    defaultLayers: [
      { layerName: 'base', description: 'Reinforced kevlar-weave combat skinsuit with breathable joint articulations', fabricType: 'Kevlar stretch mesh', tensionFoldsAndDrapes: 'Skin-tight ergonomic sculpting', colorHexOrTone: '#1b1b1e' },
      { layerName: 'outer', description: 'Segmented lightweight ballistic chest cuirass with contoured clavicular plates', fabricType: 'Matte carbon-composite plates', tensionFoldsAndDrapes: 'Rigid protective shell contours', colorHexOrTone: '#2b2d30' },
      { layerName: 'bottom', description: 'Armored combat pants with modular thigh plating and reinforced shin guards', fabricType: 'Heavy Cordura & composite knee cups', tensionFoldsAndDrapes: 'Sturdy articulation creases', colorHexOrTone: '#1f2022' },
      { layerName: 'footwear', description: 'Reinforced steel-toe combat greave boots with shock-absorbing heels', fabricType: 'Treated combat leather & steel', tensionFoldsAndDrapes: 'Heavy solid stance grounding', colorHexOrTone: '#121214' },
      { layerName: 'accessories', description: 'Utility equipment harness, glowing energetic power cell clip, bracers with integrated holo-interface', fabricType: 'Anodized titanium & illuminated crystal', tensionFoldsAndDrapes: 'Flush armor mounting', colorHexOrTone: '#00b4d8' },
    ],
    fabricTextures: ['Carbon fiber weave', 'Matte ballistic ceramic', 'Kevlar mesh', 'Brushed dark alloy'],
    characteristicSilhouettes: ['Broad athletic armored chest', 'Segmented joint breaks', 'Lethal functional agility'],
    recommendedAccessories: ['Arm bracer with interface', 'Energy battery core', 'Tactical knife sheath'],
  },
  elegant: {
    style: 'elegant',
    name: 'Haute Couture & Power Suit Dirigeant',
    description: 'Costume croisé sur-mesure aux revers acérés, manteau d arpenteur en cachemire, allure imposante et charismatique.',
    defaultLayers: [
      { layerName: 'inner', description: 'Tailored crisp poplin shirt with rigid Italian cutaway collar and mother-of-pearl buttons', fabricType: 'Egyptian cotton 120s', tensionFoldsAndDrapes: 'Sharp architectural press folds across chest', colorHexOrTone: '#fcfcfc' },
      { layerName: 'outer', description: 'Double-breasted tailored power blazer with sharp peak lapels and structured roped shoulders', fabricType: 'Super 150s worsted wool', tensionFoldsAndDrapes: 'Impeccable clean hourglass drape cinching natural waist', colorHexOrTone: '#141416' },
      { layerName: 'bottom', description: 'High-waisted tailored trousers with forward pleats and clean break hem', fabricType: 'Matching worsted wool', tensionFoldsAndDrapes: 'Razor-sharp front creases flowing straight down', colorHexOrTone: '#141416' },
      { layerName: 'footwear', description: 'Polished calfskin wholecut oxford shoes with mirror-shine toe caps', fabricType: 'Full-grain calfskin', tensionFoldsAndDrapes: 'Sculpted sculptural silhouette', colorHexOrTone: '#08080a' },
      { layerName: 'accessories', description: 'Luxury stainless steel automatic chronograph watch, silk pocket square, minimalist platinum signet ring', fabricType: 'Brushed steel & mulberry silk', tensionFoldsAndDrapes: 'Subtle high-status accents', colorHexOrTone: '#c0c0c0' },
    ],
    fabricTextures: ['Worsted wool 150s', 'Mulberry silk', 'Crisp cotton poplin', 'Mirror-polished leather'],
    characteristicSilhouettes: ['Hourglass V-cut tailored silhouette', 'Imposing structured shoulders', 'Razor-sharp linear discipline'],
    recommendedAccessories: ['Steel chronograph watch', 'Silk pocket square', 'Platinum signet ring', 'Wool trench overcoat'],
  },
};

/**
 * Builds a complete, production-ready CharacterDesignBlueprint from sliders and options.
 */
export function buildCharacterBlueprint(options: {
  id?: string;
  bio?: Partial<CharacterBio>;
  sliders?: GranularSlidersInput;
  artStyle?: ArtStylePreset;
  archetype?: BodyArchetype;
  clothingStyle?: ClothingStyleCategory;
  ethnicity?: EthnicityCategory;
}): CharacterDesignBlueprint {
  const s = options.sliders || {};
  const ethnicityKey = options.ethnicity || s.ethnicity || 'east_asian';
  const clothingStyleKey = options.clothingStyle || s.clothingStyle || 'streetwear';
  const artStyleKey = options.artStyle || 'korean_webtoon_cinematic';

  const ethnicityPreset = ETHNICITY_PRESETS[ethnicityKey] || ETHNICITY_PRESETS.east_asian;
  const clothingPreset = CLOTHING_PRESETS[clothingStyleKey] || CLOTHING_PRESETS.streetwear;

  const gender = options.bio?.gender || 'male';
  const archetype = options.archetype || (gender === 'male' ? 'lean_athletic' : 'voluptuous_curvaceous');

  // Compute muscularity continuous value (0.0 to 1.0)
  let muscleVal = s.muscularitySlider !== undefined ? s.muscularitySlider : 0.65;
  if (s.muscularityDiscrete) {
    const discMap = {
      lean_subtle: 0.2,
      athletic_toned: 0.4,
      chiseled_ripped: 0.65,
      bodybuilder_dense: 0.82,
      hyper_mass_demon: 0.95,
    };
    muscleVal = discMap[s.muscularityDiscrete];
  }

  // Compute Waist-to-Hip Ratio
  const defaultWHR = gender === 'female' ? 0.68 : 0.85;
  const whrVal = s.waistToHipRatio !== undefined ? s.waistToHipRatio : defaultWHR;

  // Compute Bust fullness continuous (0.0 to 1.0)
  let bustVal = s.bustVolumeSlider !== undefined ? s.bustVolumeSlider : (gender === 'female' ? 0.65 : 0.4);
  if (s.bustDiscrete) {
    const bustMap = {
      subtle_petite: 0.15,
      athletic_firm: 0.35,
      medium_classic: 0.55,
      voluptuous_full: 0.75,
      monumental_heavy: 0.95,
    };
    bustVal = bustMap[s.bustDiscrete];
  }

  // Compute Galbe / Glute continuous (0.0 to 1.0)
  let galbeVal = s.galbeSlider !== undefined ? s.galbeSlider : (gender === 'female' ? 0.72 : 0.5);
  if (s.galbeDiscrete) {
    const galbeMap = {
      lean_straight: 0.15,
      firm_athletic: 0.35,
      full_rounded: 0.6,
      deep_hourglass_shelf: 0.8,
      hyper_curvaceous: 0.95,
    };
    galbeVal = galbeMap[s.galbeDiscrete];
  }

  // Compute facial canons
  const canthalTilt = s.canthalTiltDegrees !== undefined ? s.canthalTiltDegrees : 4.5; // default sharp manhwa gaze
  const gonialAngle = s.gonialAngleDegrees !== undefined ? s.gonialAngleDegrees : (gender === 'male' ? 116 : 128);
  const bigonialWidth = s.bigonialWidthRatio !== undefined ? s.bigonialWidthRatio : (gender === 'male' ? 0.84 : 0.74);
  const cheekboneProm = s.cheekboneProminence !== undefined ? s.cheekboneProminence : 0.75;
  const thirds = s.facialThirdsRatio || [1.0, 1.0, 0.95];

  // Muscular anatomical descriptions
  let muscleDesc = '';
  if (muscleVal >= 0.85) {
    muscleDesc = 'Monumental hyper-mass muscularity, deeply striated cannonball deltoids, carved 8-pack abs, diamond-shaped demon back Christmas tree lats, prominent vascularity tracing forearms and shoulders.';
  } else if (muscleVal >= 0.6) {
    muscleDesc = 'Chiseled athletic manhwa hero physique, razor-sharp serratus anterior interlocking external obliques, prominent V-taper latissimus, sculpted chest separation, vascular forearm mapping.';
  } else if (muscleVal >= 0.35) {
    muscleDesc = 'Lean athletic swimmer build, toned abdominal midline, firm deltoid caps, natural muscular definition under movement.';
  } else {
    muscleDesc = 'Slender lithe frame, subtle muscle tone, pronounced clavicular collarbones, graceful lithe posture.';
  }

  // Feminine curves and bust gravity descriptions
  let bustDesc = '';
  if (gender === 'female') {
    if (bustVal >= 0.75) {
      bustDesc = `Voluptuous natural bust with authentic gravitational teardrop drape (no artificial spherical rigidity), soft pectoral foundation, graceful natural cleavage depth, realistic mass displacement.`;
    } else if (bustVal >= 0.45) {
      bustDesc = `Harmonious proportional feminine bust, gentle natural slope from clavicles into rounded teardrop contour, realistic movement physics.`;
    } else {
      bustDesc = `Subtle athletic petite bust, firm pectoral integration, elegant youthful contour.`;
    }
  } else {
    bustDesc = `Broad athletic thoracic cage, dense square pectoral plates with clean sternal separation line.`;
  }

  // Galbe and hip descriptions
  let hipGluteDesc = '';
  if (gender === 'female') {
    hipGluteDesc = `Pronounced feminine hourglass waist-to-hip ratio (${whrVal.toFixed(2)}), curvaceous gluteal shelf with firm athletic tone, sweeping lateral hip flare, sculpted vastus lateralis thighs tapering into slim ankles.`;
  } else {
    hipGluteDesc = `Powerful athletic V-taper tapering into a lean waist (${whrVal.toFixed(2)} WHR), deep Apollo belt iliac furrows, powerful compact glutes, defined quad sweeps.`;
  }

  const bio: CharacterBio = {
    name: options.bio?.name || 'Kaelen Vance',
    alias: options.bio?.alias || 'Shadow Weaver',
    age: options.bio?.age || 23,
    gender,
    ethnicityOrOrigin: ethnicityPreset.name,
    ethnicityCategory: ethnicityKey,
    occupationOrRole: options.bio?.occupationOrRole || 'Urban Hunter & Vanguard Strategist',
    personalityKeywords: options.bio?.personalityKeywords || ['Charismatic', 'Calculated', 'Fierce', 'Unyielding'],
    signatureColors: {
      primary: '#111216',
      secondary: '#2b2d42',
      accent: '#00b4d8',
      skinHex: ethnicityPreset.skinHexDefault,
      hairHex: '#141414',
      eyeHex: '#00b4d8',
      ...(options.bio?.signatureColors || {}),
    },
    backstorySummary: options.bio?.backstorySummary || 'Un leader émergent des quartiers contemporains, alliant précision martiale et maîtrise tactique.',
  };

  const facialCanons: FacialCanons = {
    facialThirdsRatio: thirds,
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: canthalTilt,
    gonialAngleDegrees: gonialAngle,
    cheekboneToJawRatio: 1.25,
    bigonialWidthRatio: bigonialWidth,
    philtrumToChinRatio: 0.5,
    nasolabialAngleDegrees: gender === 'male' ? 93 : 98,
    cheekboneProminence: cheekboneProm,
    eyeDetails: `Almond-shaped eyes with positive ${canthalTilt.toFixed(1)}° canthal tilt, piercing gaze, detailed iris with glowing luminescent flecks, fine defined upper lid line`,
    noseDetails: `${ethnicityPreset.facialTraitsDescription}, straight clean nasal bridge with delicate tip definition`,
    lipDetails: `Contoured lips with defined cupid's bow, subtle natural gradient tint, natural vermilion margin`,
    jawlineDescription: `Chiseled mandibular line with ${gonialAngle}° gonial angle and ${bigonialWidth.toFixed(2)} bigonial width ratio, sculpted chin projection`,
  };

  const morphometrics: BodyMorphometrics = {
    heightCm: s.heightCm || (gender === 'male' ? 186 : 173),
    weightKg: gender === 'male' ? 82 : 62,
    headHeightRatio: s.headHeightRatio || (artStyleKey.includes('webtoon') ? 8.4 : 7.6),
    waistToHipRatio: whrVal,
    shoulderToHipRatio: s.shoulderToHipRatio || (gender === 'male' ? 1.55 : 1.08),
    chestToWaistRatio: s.chestToWaistRatio || (gender === 'male' ? 1.45 : 1.28),
    muscularityLevel: muscleVal,
    bustVolume: bustVal,
    galbeCurvature: galbeVal,
    bodyFatCategory: s.bodyFatCategory || (muscleVal > 0.7 ? 'ultra_lean' : 'athletic_toned'),
    anatomicalFeatures: {
      bustChestDescription: bustDesc,
      waistAbdomenDescription: `Lean tight midriff, ${whrVal.toFixed(2)} WHR, ${muscleDesc}`,
      hipGluteDescription: hipGluteDesc,
      legsCalvesDescription: 'Long proportioned legs, sculpted quad definition, streamlined knees, elegant calves',
      backShouldersDescription: 'Wide cannonball deltoids, elegant scapular articulation, high muscular density',
      handsFeetDescription: 'Sculpted hands with long defined fingers, visible tendon mechanics, well-proportioned feet',
    },
  };

  const lighting: LightingAndCameraProfile = {
    primaryLightSource: 'Neutral studio key light from upper 45° angle with warm fill',
    rimLightingColor: 'Saturated electric cyan and subtle violet back edge light (Solo Leveling signature)',
    shadowQuality: artStyleKey.includes('webtoon') ? 'sharp_cel_shaded' : 'soft_ambient_occlusion',
    colorGrading: 'Cinematic cool shadow tones balanced by warm subsurface scattering skin highlights',
    subsurfaceScattering: true,
    cameraFocalLength: '85mm portrait telephoto lens with minimal lens distortion',
    cameraAngles: ['Front orthographic', 'Left profile', 'Right profile', 'Back orthographic', 'Dynamic 3/4 hero view'],
  };

  return {
    id: options.id || `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bio,
    archetype,
    artStyle: artStyleKey,
    facialCanons,
    morphometrics,
    wardrobe: clothingPreset.defaultLayers,
    clothingStyle: clothingStyleKey,
    lighting,
    expressionsList: [
      'Neutral stoic stare with focused catchlights',
      'Confident asymmetric smirk with raised brow',
      'Fierce battle shout with bared teeth and intense furrowed brow',
      'Piercing cold glare with glowing luminous pupils',
      'Genuine warm smile with crinkled eyes',
      'Subtle melancholic gaze looking downward',
      'Shocked alertness with constricted irises',
      'Exhausted panting with sweat beads and heavy eyelids',
    ],
    posesList: [
      'Neutral standing A-pose with relaxed palms for turnaround modeling',
      'Dynamic low-center contrapposto ready stance with clenched fist',
      'Mid-stride sprint with trailing jacket fabric folds',
      'Over-the-shoulder look with intense backward gaze',
    ],
    macroDetailsList: [
      'Extreme closeup of eye showing iris gradient and limbal ring',
      'Closeup of hand articulation and jewelry rings',
      'Closeup of jacket zipper, Fidlock buckle, and fabric texture',
      'Closeup of footwear tread and sole sculpting',
    ],
  };
}
