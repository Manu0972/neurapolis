/**
 * Prompt Matrix Generator for Midjourney v6, SDXL, and Flux.1.
 * Synthesizes fine-grained anatomical, facial, stylistic, and wardrobe parameters
 * into model-optimized generation prompts.
 */

/**
 * Maps style key to prompt tokens.
 */
const STYLE_TOKENS = {
  webtoon_action: {
    name: 'Webtoon Action (Solo Leveling)',
    midjourney: 'high-octane Korean webtoon manhwa aesthetic, Solo Leveling style, crisp dynamic ink lines, dramatic chiaroscuro with electric rim lighting, glowing specular highlights, dynamic aura, artstation trending',
    sdxl: '(korean manhwa style:1.2), (solo leveling aesthetic:1.2), (sharp ink lineart:1.15), dramatic volumetric lighting, glowing rim lights, high contrast shadows',
    flux: 'Rendered in a high-octane Korean action webtoon aesthetic reminiscent of Solo Leveling, with sharp inked outlines, electric edge rim lighting, and dramatic shadow depth.'
  },
  modern_anime: {
    name: 'Modern Anime Key Visual',
    midjourney: 'modern premium anime key visual, crisp refined cel-shading, vibrant digital color grading, smooth gradient shadows, clean detailed linework, ufotable aesthetic',
    sdxl: '(modern anime style:1.2), (clean cel shading:1.2), (vibrant studio lighting:1.1), high production anime visual, immaculate linework',
    flux: 'Illustrated in a top-tier modern Japanese anime key visual style with crisp cel-shading, vibrant cinematic color grading, and pristine character linework.'
  },
  detailed_seinen: {
    name: 'Detailed Seinen Manga',
    midjourney: 'masterpiece detailed seinen manga illustration, intricate cross-hatching, heavy ink contrasts, gritty atmospheric chiaroscuro, high fidelity anatomical rendering',
    sdxl: '(detailed seinen manga:1.25), (intricate ink hatching:1.2), (gritty atmospheric lighting:1.15), mature graphic novel aesthetic, deep noir shadows',
    flux: 'Created in an intricate and mature seinen manga art style, featuring dense micro-hatching, heavy ink contrast, atmospheric chiaroscuro, and textured shading.'
  },
  semi_realistic: {
    name: 'Semi-Realistic Digital Art',
    midjourney: 'semi-realistic digital concept art, ArtStation masterwork, subtle subsurface scattering on glowing skin, painterly volumetric lighting, authentic tactile fabric textures',
    sdxl: '(semi-realistic digital painting:1.2), (subsurface scattering skin:1.15), (artstation concept art:1.2), cinematic rim lighting, 8k octane render detail',
    flux: 'Painted in a refined semi-realistic digital art style with gentle subsurface scattering on the skin, soft ambient occlusion, realistic material textures, and painterly edge control.'
  }
};

/**
 * Maps wardrobe key and mode to detailed garment tokens.
 */
const WARDROBE_TOKENS = {
  k_streetwear: {
    duty: 'custom technical K-fashion uniform, structured utility bomber jacket with patch embroidery, heavy double-knee denim pants, platform combat dunks, utility cross-chest harness',
    private: 'oversized cozy Korean streetwear hoodie, wide-leg parachute cargo pants with draping drawstrings, chunky designer sneakers, layered silver chain necklace, minimalist beanie'
  },
  techwear: {
    duty: 'full tactical techwear rig, waterproof Gore-Tex modular shell jacket, Fidlock magnetic quick-release buckles, MOLLE utility webbing, reinforced combat trousers with holster, steel-toe boots',
    private: 'relaxed stealth techwear lounge pullover, articulated tapered jogger pants, weather-sealed low-profile runners, minimalist wrist comm unit'
  },
  martial: {
    duty: 'traditional martial arts combat tunic, reinforced embroidered waist sash, tightly wrapped forearms and linen vambraces, wide linen training hakama trousers, cloth kung-fu shoes',
    private: 'relaxed unbuttoned linen meditation robe, soft organic hemp pants, woven sandals, wooden prayer bead bracelet'
  },
  classic_tailoring: {
    duty: 'bespoke tailored double-breasted suit jacket with peaked silk lapels, crisp French-cuff dress shirt, tailored pleated trousers, high-shine Italian leather oxfords, tie clip',
    private: 'open-collar fine merino wool sweater draped over silk crepe trousers, unbuttoned tailored trenchcoat, calfskin loafers, minimalist wristwatch'
  }
};

/**
 * Builds Midjourney v6 prompt.
 */
export function generateMidjourneyPrompt(char, mode = 'turnaround') {
  const style = STYLE_TOKENS[char.style] || STYLE_TOKENS.webtoon_action;
  const wardrobe = (WARDROBE_TOKENS[char.wardrobe] || WARDROBE_TOKENS.techwear)[char.wardrobeMode || 'duty'];

  let layoutPrefix = '';
  let layoutSuffix = '--ar 9:16 --v 6.1 --stylize 250 --chaos 10';

  if (mode === 'turnaround') {
    layoutPrefix = 'master character model sheet, full body turnaround reference (front view, 3/4 perspective, side profile, back view), neutral standing pose, clean studio background';
  } else if (mode === 'portrait') {
    layoutPrefix = 'cinematic hero portrait, close-up shot focusing on face and upper chest, intense eye contact';
    layoutSuffix = '--ar 4:5 --v 6.1 --stylize 300';
  } else {
    layoutPrefix = 'dynamic full-body action keyframe, high-speed combat pose, foreshortened perspective, motion-blurred energy FX';
    layoutSuffix = '--ar 16:9 --v 6.1 --stylize 280';
  }

  // Anatomy descriptors
  const anatomyTokens = [
    `${char.heightCm}cm tall`,
    `${char.gender} anatomy`,
    `V-taper shoulder-to-hip ratio ${char.vTaper.toFixed(2)} with broad sculpted clavicles`,
    `waist-to-hip ratio ${char.whr.toFixed(2)}`,
    char.muscularity >= 0.70 ? 'chiseled 8-pack abs, defined serratus anterior, striated deltoids' : 'toned athletic physique',
    char.vascularity >= 0.50 ? `vascular forearms (${Math.round(char.vascularity * 100)}% vascularity)` : 'smooth epidermal finish',
    char.bustVolume >= 0.50 ? `natural teardrop drape chest contour (volume ${Math.round(char.bustVolume * 100)}%)` : 'firm athletic chest contour',
    char.galbe >= 0.60 ? `sculpted gluteal curvature (galbe ${Math.round(char.galbe * 100)}%)` : 'athletic pelvic curve'
  ].join(', ');

  // Facial descriptors
  const faceTokens = [
    `+${char.canthalTilt.toFixed(1)}° positive canthal tilt eyes with razor-sharp gaze`,
    `detailed iris reflections with catchlights in ${char.colors.eyes} hue`,
    `sculpted mandibular gonial angle of ${char.mandibularAngle}°`,
    `high prominent cheekbones (${Math.round(char.cheekbones * 100)}%)`,
    `flawless facial symmetry (${Math.round(char.facialSymmetry * 100)}%)`
  ].join(', ');

  // Color tokens
  const colorTokens = `palette tones: primary ${char.colors.primary}, secondary ${char.colors.secondary}, glowing accent ${char.colors.accent}, skin tone ${char.colors.skin}, hair tone ${char.colors.hair}`;

  return `${layoutPrefix}, ${char.name} (${char.alias || char.role}), ${style.midjourney}, ${anatomyTokens}, ${faceTokens}, wearing ${wardrobe}, ${colorTokens}, crisp 8k resolution, artstation character design masterwork ${layoutSuffix}`;
}

/**
 * Builds Stable Diffusion XL (SDXL) prompt with positive and negative prompts.
 */
export function generateSDXLPrompt(char, mode = 'turnaround') {
  const style = STYLE_TOKENS[char.style] || STYLE_TOKENS.webtoon_action;
  const wardrobe = (WARDROBE_TOKENS[char.wardrobe] || WARDROBE_TOKENS.techwear)[char.wardrobeMode || 'duty'];

  const modeToken = mode === 'turnaround'
    ? '(character model sheet:1.25), (turnaround reference:1.2), front view and back view, clean grey studio background'
    : mode === 'portrait'
    ? '(close-up portrait:1.25), head and shoulders, cinematic lighting, catchlights in eyes'
    : '(dynamic action pose:1.25), full body battle stance, dynamic foreshortening, kinetic energy FX';

  const positive = [
    '(masterpiece, best quality, ultra-detailed:1.2)',
    modeToken,
    style.sdxl,
    `(${char.name}:1.1), ${char.role}`,
    `(${char.gender} physique:1.15), (${char.heightCm}cm:1.0)`,
    `(${char.vTaper.toFixed(2)} V-taper, wide shoulders, narrow waist:1.15)`,
    char.muscularity >= 0.70 ? '(chiseled 8-pack abs, serratus anterior, striated muscles:1.2)' : '(toned athletic build:1.1)',
    char.vascularity >= 0.50 ? '(vascular forearms:1.1)' : '',
    `(+${char.canthalTilt.toFixed(1)} canthal tilt:1.15), (intense captivating eyes:1.2)`,
    `(${char.mandibularAngle} degree sharp jawline:1.15)`,
    `(wearing ${wardrobe}:1.15)`,
    `palette: ${char.colors.primary}, accent ${char.colors.accent}, hair ${char.colors.hair}, eyes ${char.colors.eyes}`,
    'subsurface scattering skin, 8k resolution, photorealistic rendering, sharp focus'
  ].filter(Boolean).join(', ');

  const negative = [
    '(worst quality, low quality:1.4)',
    '(deformed, distorted, disfigured:1.35)',
    'bad anatomy, bad hands, missing fingers, extra digits, extra limbs, fused fingers',
    'blurry, mutation, morbid, mutilated, poorly drawn face, poorly drawn eyes',
    'gross proportions, cloned face, unnatural plastic skin, watermark, signature, username, text, error'
  ].join(', ');

  return { positive, negative };
}

/**
 * Builds Flux.1 natural language prompt.
 */
export function generateFluxPrompt(char, mode = 'turnaround') {
  const style = STYLE_TOKENS[char.style] || STYLE_TOKENS.webtoon_action;
  const wardrobe = (WARDROBE_TOKENS[char.wardrobe] || WARDROBE_TOKENS.techwear)[char.wardrobeMode || 'duty'];

  let shotType = '';
  if (mode === 'turnaround') {
    shotType = 'A comprehensive professional full-body character turnaround model sheet showcasing front, back, and profile views against a clean studio backdrop.';
  } else if (mode === 'portrait') {
    shotType = 'A high-impact cinematic portrait photograph with a 85mm prime lens, focusing closely on the character\'s striking facial features and gaze.';
  } else {
    shotType = 'A dynamic, high-energy full-body action scene capturing the character mid-motion in an athletic combat stance.';
  }

  const anatomyNarrative = `${char.name} (${char.role}) stands at ${char.heightCm} cm with an imposing statuesque build. Their silhouette is sculpted with an athletic V-taper (ratio ${char.vTaper.toFixed(2)}) having broad clavicles that narrow toward a ${char.whr.toFixed(2)} waist-to-hip ratio. ${
    char.muscularity >= 0.70
      ? 'Their core reveals chiseled eight-pack abdominals and distinct serratus anterior striations with pronounced forearm vascularity.'
      : 'Their build is gracefully athletic with supple muscle tone and elegant posture.'
  } ${char.bustVolume >= 0.50 ? 'The chest features natural teardrop gravity drape.' : ''} ${char.galbe >= 0.60 ? 'The gluteal and pelvic contours display an athletic curved shelf.' : ''}`;

  const faceNarrative = `Their face exhibits ${Math.round(char.facialSymmetry * 100)}% symmetry, defined by high prominent cheekbones, an alert +${char.canthalTilt.toFixed(1)}° positive canthal tilt that imparts a magnetic predatory gaze, and a sculpted ${char.mandibularAngle}° mandibular jawline. Their eyes gleam with a luminous ${char.colors.eyes} hue.`;

  const clothingNarrative = `They are dressed in ${wardrobe}. The visual palette is harmonized around dark primary shades (${char.colors.primary}), deep secondary tones (${char.colors.secondary}), and vibrant glowing accents (${char.colors.accent}), with textured ${char.colors.hair} hair.`;

  return `${shotType} ${style.flux} ${anatomyNarrative} ${faceNarrative} ${clothingNarrative} Rendered with volumetric edge illumination, rich ambient occlusion, and pristine 8K clarity.`;
}

/**
 * Generates all prompt variants for the given character.
 * @param {Object} character
 * @param {'turnaround'|'portrait'|'action'} mode
 */
export function generatePromptMatrix(character, mode = 'turnaround') {
  const midjourney = generateMidjourneyPrompt(character, mode);
  const sdxl = generateSDXLPrompt(character, mode);
  const flux = generateFluxPrompt(character, mode);

  return {
    mode,
    midjourney,
    sdxl,
    flux
  };
}
