/**
 * NEURAPOLIS — P-PERSO : Système de Personnalisation Complète du Joueur
 * Définit les types stricts, tokens d'apparence, règles d'allocation des caractéristiques,
 * constructeur de monde personnalisé et logique de migration de sauvegarde vers v10.
 */
import { BODY_SHAPE_KEYS, type BodyShape, type BodyShapeKey } from './types';
import { ADULT_HEIGHT_MAX_CM, ADULT_HEIGHT_MIN_CM, adultHeightOf } from './human_variety';
import {
  DEFAULT_PLAYER_APPEARANCE,
  VALID_GENDERS,
  VALID_HAIR_COLORS,
  VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS,
  VALID_OUTFIT_STYLES,
  VALID_SKIN_TONES,
  VALID_ACCESSORIES,
  VALID_BEARDS,
  VALID_BODIES,
  VALID_EYE_COLORS,
  VALID_EYES,
  VALID_GLASSES,
  type Characteristics,
  type Player,
  type PlayerAccessory,
  type PlayerAppearance,
  type PlayerBeard,
  type PlayerBody,
  type PlayerEyeColor,
  type PlayerEyes,
  type PlayerGender,
  type PlayerGlasses,
  type PlayerHairColor,
  type PlayerHairStyle,
  type PlayerOutfitColor,
  type PlayerOutfitStyle,
  type PlayerSkinTone,
  type WorldState,
} from './types';

// Types et valeurs canoniques définis dans core/types.ts, réexportés pour l'UI de création.
export {
  DEFAULT_PLAYER_APPEARANCE,
  VALID_GENDERS,
  VALID_HAIR_COLORS,
  VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS,
  VALID_OUTFIT_STYLES,
  VALID_SKIN_TONES,
  VALID_ACCESSORIES,
  VALID_BEARDS,
  VALID_BODIES,
  VALID_EYE_COLORS,
  VALID_EYES,
  VALID_GLASSES,
  type Characteristics,
  type Player,
  type PlayerAppearance,
  type PlayerGender,
  type WorldState,
};
import { createWorld } from './store';
import { migrateSave } from '../saves/migrations';

export type RawSaveData = Record<string, unknown>;

// ============================================================================
// 1. Types & Tokens
// ============================================================================

export type SkinTone = PlayerSkinTone;
export type HairColor = PlayerHairColor;
export type HairStyle = PlayerHairStyle;
export type OutfitStyle = PlayerOutfitStyle;
export type OutfitColor = PlayerOutfitColor;

export interface PlayerCustomization {
  firstName: string;
  lastName: string;
  gender: PlayerGender;
  characteristics: Characteristics;
  appearance: PlayerAppearance;
}

/** Extension de Player avec les champs de personnalisation P-PERSO (déjà présents dans Player v10) */
export type CustomPlayer = Player;

/** WorldState courant (P-PERSO fait partie du contrat canonique depuis v10) */
export type CustomWorldState = WorldState;

// ============================================================================
// 2. Constantes Canoniques & Ensembles de Valeurs
// ============================================================================

/** Version de sauvegarde qui a introduit P-PERSO (la version courante est SAVE_VERSION). */
export const SAVE_VERSION_V10 = 10;

export const CHARACTERISTIC_KEYS: readonly (keyof Characteristics)[] = [
  'comprehension',
  'creativite',
  'influence',
  'discipline',
  'adaptabilite',
  'confiance',
] as const;

export const TOTAL_BONUS_POINTS = 18;
export const CHARACTERISTIC_MIN = 10;
export const CHARACTERISTIC_MAX = 100;

export const BASE_CHARACTERISTICS: Characteristics = {
  comprehension: 42,
  creativite: 65,
  influence: 35,
  discipline: 48,
  adaptabilite: 58,
  confiance: 44,
};

export const DEFAULT_PLAYER_CUSTOMIZATION: PlayerCustomization = {
  firstName: 'Camille',
  lastName: 'Dupont',
  gender: 'non-binaire',
  characteristics: { ...BASE_CHARACTERISTICS },
  appearance: { ...DEFAULT_PLAYER_APPEARANCE },
};

// Métadonnées d'affichage et de design pour les sélecteurs
export const GENDER_INFO: Record<PlayerGender, { label: string; icon: string }> = {
  fille: { label: 'Fille', icon: '👧' },
  garcon: { label: 'Garçon', icon: '👦' },
  'non-binaire': { label: 'Non-binaire', icon: '✨' },
};

export const SKIN_TONE_INFO: Record<SkinTone, { label: string; hex: string }> = {
  porcelaine: { label: 'Porcelaine', hex: '#ffe0cc' },
  claire: { label: 'Claire', hex: '#ffc496' },
  rosee: { label: 'Rosée', hex: '#f2b39a' },
  doree: { label: 'Dorée', hex: '#e2ad7a' },
  olive: { label: 'Olive', hex: '#c9a06c' },
  chaude: { label: 'Chaude', hex: '#b47a56' },
  ambree: { label: 'Ambrée', hex: '#a06a40' },
  cuivree: { label: 'Cuivrée', hex: '#8c5634' },
  brune: { label: 'Brune', hex: '#6e4128' },
  ebene: { label: 'Ébène', hex: '#4a2a1a' },
};

export const HAIR_COLOR_INFO: Record<HairColor, { label: string; hex: string }> = {
  brun: { label: 'Brun', hex: '#4a3220' },
  chatain: { label: 'Châtain', hex: '#6b4a2f' },
  blond: { label: 'Blond', hex: '#ffd98a' },
  roux: { label: 'Roux', hex: '#c15f4a' },
  noir: { label: 'Noir', hex: '#2c2230' },
  platine: { label: 'Platine', hex: '#f3ead8' },
  gris: { label: 'Gris argent', hex: '#a9a9b3' },
  bleu: { label: 'Bleu électrique', hex: '#3d6fd8' },
  rose: { label: 'Rose', hex: '#e86fa6' },
  vert: { label: 'Vert menthe', hex: '#5cc8a0' },
};

export const HAIR_STYLE_INFO: Record<HairStyle, { label: string; icon: string }> = {
  court: { label: 'Court', icon: '✂️' },
  'mi-long': { label: 'Mi-long', icon: '💇' },
  boucle: { label: 'Bouclé', icon: '🌀' },
  tresse: { label: 'Tressé', icon: '🪢' },
  couettes: { label: 'Couettes', icon: '🎀' },
  rase: { label: 'Rasé', icon: '🪒' },
  degrade: { label: 'Dégradé', icon: '💈' },
  long: { label: 'Long lisse', icon: '🌊' },
  afro: { label: 'Afro', icon: '☁️' },
  locks: { label: 'Locks', icon: '🧶' },
  chignon: { label: 'Chignon', icon: '🍙' },
  queue: { label: 'Queue de cheval', icon: '🐎' },
  frange: { label: 'Frange', icon: '🪮' },
  crete: { label: 'Crête', icon: '🦔' },
};

export const OUTFIT_STYLE_INFO: Record<OutfitStyle, { label: string; icon: string }> = {
  ecolier: { label: 'Écolier', icon: '🎒' },
  artisan: { label: 'Artisan', icon: '🛠️' },
  sportif: { label: 'Sportif', icon: '👟' },
  citoyen: { label: 'Citoyen', icon: '🧣' },
  streetwear: { label: 'Streetwear', icon: '🧢' },
  entrepreneur: { label: 'Entrepreneur·e', icon: '🧥' },
  dirigeant: { label: 'Dirigeant·e', icon: '👔' },
  magnat: { label: 'Magnat·e', icon: '🎩' },
};

/** Palier de l'Ascension à atteindre pour porter une tenue (1 = dès le début). */
export const OUTFIT_TIER: Record<OutfitStyle, number> = {
  ecolier: 1, artisan: 1, sportif: 1, citoyen: 1, streetwear: 1, entrepreneur: 3, dirigeant: 4, magnat: 6,
};

export function outfitAllowed(style: OutfitStyle, tier: number): boolean {
  return (OUTFIT_TIER[style] ?? 1) <= tier;
}

export const OUTFIT_COLOR_INFO: Record<OutfitColor, { label: string; hex: string }> = {
  denim: { label: 'Denim', hex: '#4a5a7a' },
  coral: { label: 'Corail', hex: '#f48c5d' },
  vert: { label: 'Vert', hex: '#38b764' },
  ocre: { label: 'Ocre', hex: '#8a5a3a' },
  indigo: { label: 'Indigo', hex: '#303e80' },
  noir: { label: 'Noir', hex: '#24222a' },
  blanc: { label: 'Blanc cassé', hex: '#ece6da' },
  bordeaux: { label: 'Bordeaux', hex: '#7a2436' },
  moutarde: { label: 'Moutarde', hex: '#d9a521' },
  ciel: { label: 'Bleu ciel', hex: '#8cc4e8' },
};

export const BODY_INFO: Record<PlayerBody, { label: string; icon: string }> = {
  fine: { label: 'Fine', icon: '🌿' },
  moyenne: { label: 'Moyenne', icon: '🧍' },
  sportive: { label: 'Sportive', icon: '💪' },
  ronde: { label: 'Ronde', icon: '🫧' },
};
export const EYES_INFO: Record<PlayerEyes, { label: string; icon: string }> = {
  ronds: { label: 'Ronds', icon: '👀' },
  amande: { label: 'En amande', icon: '🌰' },
  tombants: { label: 'Tombants', icon: '😌' },
  rieurs: { label: 'Rieurs', icon: '😊' },
};
export const EYE_COLOR_INFO: Record<PlayerEyeColor, { label: string; hex: string }> = {
  brun: { label: 'Brun', hex: '#4a2e1c' },
  noisette: { label: 'Noisette', hex: '#8a6234' },
  vert: { label: 'Vert', hex: '#4f7f4a' },
  bleu: { label: 'Bleu', hex: '#4a78b0' },
  gris: { label: 'Gris', hex: '#7d8590' },
};
export const GLASSES_INFO: Record<PlayerGlasses, { label: string; icon: string }> = {
  aucune: { label: 'Sans', icon: '🚫' },
  rondes: { label: 'Rondes', icon: '👓' },
  carrees: { label: 'Carrées', icon: '🔲' },
  ecaille: { label: 'Écaille', icon: '🐢' },
  fines: { label: 'Fines', icon: '➖' },
  soleil: { label: 'Soleil', icon: '🕶️' },
};
export const BEARD_INFO: Record<PlayerBeard, { label: string; icon: string }> = {
  aucune: { label: 'Sans', icon: '🚫' },
  duvet: { label: 'Duvet', icon: '🌱' },
  moustache: { label: 'Moustache', icon: '〰️' },
  courte: { label: 'Barbe courte', icon: '🧔' },
  pleine: { label: 'Barbe pleine', icon: '🧙' },
};
/** Âge à partir duquel la barbe est proposée. */
export const BEARD_MIN_AGE = 16;
export const ACCESSORY_INFO: Record<PlayerAccessory, { label: string; icon: string }> = {
  aucun: { label: 'Aucun', icon: '🚫' },
  casquette: { label: 'Casquette', icon: '🧢' },
  bonnet: { label: 'Bonnet', icon: '🧶' },
  ecouteurs: { label: 'Écouteurs', icon: '🎧' },
  montre: { label: 'Montre', icon: '⌚' },
  echarpe: { label: 'Écharpe', icon: '🧣' },
  sac_dos: { label: 'Sac à dos', icon: '🎒' },
  sacoche: { label: 'Sacoche', icon: '💼' },
};

export const CHARACTERISTIC_LABELS: Record<
  keyof Characteristics,
  { label: string; icon: string; description: string }
> = {
  comprehension: {
    label: 'Compréhension',
    icon: '🧠',
    description: 'Capacité à analyser, lire les bilans et apprendre.',
  },
  creativite: {
    label: 'Créativité',
    icon: '💡',
    description: 'Imagination de solutions et conception de projets.',
  },
  influence: {
    label: 'Influence',
    icon: '🗣️',
    description: 'Aptitude à convaincre, négocier et rassembler.',
  },
  discipline: {
    label: 'Discipline',
    icon: '⏳',
    description: 'Régularité, assiduité et respect des engagements.',
  },
  adaptabilite: {
    label: 'Adaptabilité',
    icon: '🔄',
    description: 'Réactivité face aux aléas et aux crises.',
  },
  confiance: {
    label: 'Confiance',
    icon: '⭐',
    description: 'Assurance personnelle, sérénité et moral.',
  },
};

// ============================================================================
// 3. Fonctions de Validation & de Calcul
// ============================================================================

export interface IdentityValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: {
    firstName: string;
    lastName: string;
    gender: PlayerGender;
    fullName: string;
  };
}

export function validateIdentity(
  rawFirstName: unknown,
  rawLastName: unknown,
  rawGender: unknown
): IdentityValidationResult {
  const errors: string[] = [];
  const firstName = typeof rawFirstName === 'string' ? rawFirstName.trim() : '';
  const lastName = typeof rawLastName === 'string' ? rawLastName.trim() : '';

  if (!firstName) {
    errors.push('Le prénom ne peut pas être vide.');
  } else if (firstName.length > 30) {
    errors.push('Le prénom ne doit pas dépasser 30 caractères.');
  }

  if (lastName.length > 30) {
    errors.push('Le Nom de famille ne doit pas dépasser 30 caractères.');
  }

  const genderStr = typeof rawGender === 'string' ? rawGender : '';
  const gender: PlayerGender = VALID_GENDERS.includes(genderStr as PlayerGender)
    ? (genderStr as PlayerGender)
    : 'non-binaire';

  if (!VALID_GENDERS.includes(genderStr as PlayerGender)) {
    errors.push(`Genre invalide : « ${genderStr} ». Valeurs permises : ${VALID_GENDERS.join(', ')}.`);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Camille';

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      firstName: firstName || 'Camille',
      lastName,
      gender,
      fullName,
    },
  };
}

export interface AppearanceValidationResult {
  valid: boolean;
  errors: string[];
  appearance: PlayerAppearance;
}

export function validateAppearance(raw: unknown): AppearanceValidationResult {
  const errors: string[] = [];
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const skinTone = VALID_SKIN_TONES.includes(obj.skinTone as SkinTone)
    ? (obj.skinTone as SkinTone)
    : DEFAULT_PLAYER_APPEARANCE.skinTone;
  if (!VALID_SKIN_TONES.includes(obj.skinTone as SkinTone)) {
    errors.push(`Teinte de peau invalide ou manquante : « ${String(obj.skinTone)} ».`);
  }

  const hairColor = VALID_HAIR_COLORS.includes(obj.hairColor as HairColor)
    ? (obj.hairColor as HairColor)
    : DEFAULT_PLAYER_APPEARANCE.hairColor;
  if (!VALID_HAIR_COLORS.includes(obj.hairColor as HairColor)) {
    errors.push(`Couleur de cheveux invalide ou manquante : « ${String(obj.hairColor)} ».`);
  }

  const hairStyle = VALID_HAIR_STYLES.includes(obj.hairStyle as HairStyle)
    ? (obj.hairStyle as HairStyle)
    : DEFAULT_PLAYER_APPEARANCE.hairStyle;
  if (!VALID_HAIR_STYLES.includes(obj.hairStyle as HairStyle)) {
    errors.push(`Coupe de cheveux invalide ou manquante : « ${String(obj.hairStyle)} ».`);
  }

  const outfitStyle = VALID_OUTFIT_STYLES.includes(obj.outfitStyle as OutfitStyle)
    ? (obj.outfitStyle as OutfitStyle)
    : DEFAULT_PLAYER_APPEARANCE.outfitStyle;
  if (!VALID_OUTFIT_STYLES.includes(obj.outfitStyle as OutfitStyle)) {
    errors.push(`Style de tenue invalide ou manquant : « ${String(obj.outfitStyle)} ».`);
  }

  const outfitColor = VALID_OUTFIT_COLORS.includes(obj.outfitColor as OutfitColor)
    ? (obj.outfitColor as OutfitColor)
    : DEFAULT_PLAYER_APPEARANCE.outfitColor;
  if (!VALID_OUTFIT_COLORS.includes(obj.outfitColor as OutfitColor)) {
    errors.push(`Couleur de tenue invalide ou manquante : « ${String(obj.outfitColor)} ».`);
  }

  // Personnalisation approfondie (v23) : absente = valeur par défaut ; présente mais invalide = erreur.
  const pick = <T,>(key: keyof PlayerAppearance, list: readonly T[], label: string): T => {
    const v = obj[key];
    const fallback = DEFAULT_PLAYER_APPEARANCE[key] as T;
    if (v === undefined) return fallback;
    if (list.includes(v as T)) return v as T;
    errors.push(`${label} invalide : « ${String(v)} ».`);
    return fallback;
  };
  const body = pick<PlayerBody>('body', VALID_BODIES, 'Morphologie');
  const eyes = pick<PlayerEyes>('eyes', VALID_EYES, 'Forme des yeux');
  const eyeColor = pick<PlayerEyeColor>('eyeColor', VALID_EYE_COLORS, 'Couleur des yeux');
  const glasses = pick<PlayerGlasses>('glasses', VALID_GLASSES, 'Lunettes');
  const beard = pick<PlayerBeard>('beard', VALID_BEARDS, 'Barbe');
  const accessory = pick<PlayerAccessory>('accessory', VALID_ACCESSORIES, 'Accessoire');
  let heightAdj = 0;
  if (obj.heightAdj !== undefined) {
    if (typeof obj.heightAdj === 'number' && Number.isInteger(obj.heightAdj) && obj.heightAdj >= -2 && obj.heightAdj <= 2) heightAdj = obj.heightAdj;
    else errors.push(`Taille invalide : « ${String(obj.heightAdj)} ».`);
  }
  let adultHeightCm: number | undefined;
  if (obj.adultHeightCm !== undefined) {
    if (typeof obj.adultHeightCm === 'number' && Number.isFinite(obj.adultHeightCm) && obj.adultHeightCm >= ADULT_HEIGHT_MIN_CM && obj.adultHeightCm <= ADULT_HEIGHT_MAX_CM) adultHeightCm = Math.round(obj.adultHeightCm);
    else errors.push(`Taille adulte invalide : « ${String(obj.adultHeightCm)} » (de ${ADULT_HEIGHT_MIN_CM} à ${ADULT_HEIGHT_MAX_CM} cm).`);
  }
  let physique: BodyShape | undefined;
  if (obj.physique !== undefined) {
    if (typeof obj.physique === 'object' && obj.physique !== null) {
      physique = {};
      for (const [k, v] of Object.entries(obj.physique as Record<string, unknown>)) {
        if (BODY_SHAPE_KEYS.includes(k as BodyShapeKey) && typeof v === 'number' && Number.isFinite(v) && v >= -1 && v <= 1) physique[k as BodyShapeKey] = v;
        else errors.push(`Silhouette invalide : « ${k} = ${String(v)} » (de −1 à +1).`);
      }
    } else errors.push('Silhouette invalide.');
  }
  let freckles = false;
  if (obj.freckles !== undefined) {
    if (typeof obj.freckles === 'boolean') freckles = obj.freckles;
    else errors.push(`Taches de rousseur invalides : « ${String(obj.freckles)} ».`);
  }

  return {
    valid: errors.length === 0,
    errors,
    appearance: {
      skinTone,
      hairColor,
      hairStyle,
      outfitStyle,
      outfitColor,
      body, heightAdj, eyes, eyeColor, glasses, freckles, beard, accessory,
      ...(adultHeightCm !== undefined ? { adultHeightCm } : {}),
      ...(physique !== undefined ? { physique } : {}),
    },
  };
}

export interface CharacteristicsAllocationResult {
  valid: boolean;
  totalAllocated: number;
  remainingPoints: number;
  errors: string[];
  bonusPoints: Record<keyof Characteristics, number>;
  finalCharacteristics: Characteristics;
}

export function validateCharacteristicsAllocation(
  rawBonus: Partial<Record<keyof Characteristics, number>>
): CharacteristicsAllocationResult {
  const errors: string[] = [];
  let totalAllocated = 0;
  const bonusPoints: Record<keyof Characteristics, number> = {
    comprehension: 0,
    creativite: 0,
    influence: 0,
    discipline: 0,
    adaptabilite: 0,
    confiance: 0,
  };

  for (const key of CHARACTERISTIC_KEYS) {
    const val = rawBonus[key] ?? 0;
    if (!Number.isInteger(val)) {
      errors.push(`Les points bonus pour ${String(key)} doivent être un entier.`);
    } else if (val < 0) {
      errors.push(`Les points bonus pour ${String(key)} ne peuvent pas être négatifs (${val}).`);
    } else {
      bonusPoints[key] = val;
      totalAllocated += val;
      const finalVal = BASE_CHARACTERISTICS[key] + val;
      if (finalVal > CHARACTERISTIC_MAX) {
        errors.push(`La caractéristique ${String(key)} dépasse le maximum autorisé (${finalVal} > ${CHARACTERISTIC_MAX}).`);
      }
    }
  }

  const remainingPoints = TOTAL_BONUS_POINTS - totalAllocated;
  if (remainingPoints < 0) {
    errors.push(`Dépassement du pool de bonus : ${totalAllocated} alloués sur ${TOTAL_BONUS_POINTS} autorisés.`);
  }

  const finalCharacteristics: Characteristics = {
    comprehension: BASE_CHARACTERISTICS.comprehension + bonusPoints.comprehension,
    creativite: BASE_CHARACTERISTICS.creativite + bonusPoints.creativite,
    influence: BASE_CHARACTERISTICS.influence + bonusPoints.influence,
    discipline: BASE_CHARACTERISTICS.discipline + bonusPoints.discipline,
    adaptabilite: BASE_CHARACTERISTICS.adaptabilite + bonusPoints.adaptabilite,
    confiance: BASE_CHARACTERISTICS.confiance + bonusPoints.confiance,
  };

  return {
    valid: errors.length === 0 && remainingPoints === 0,
    totalAllocated,
    remainingPoints,
    errors,
    bonusPoints,
    finalCharacteristics,
  };
}

export function computeFinalCharacteristics(
  base: Characteristics,
  bonus: Partial<Record<keyof Characteristics, number>>
): Characteristics {
  return {
    comprehension: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.comprehension + (bonus.comprehension ?? 0))),
    creativite: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.creativite + (bonus.creativite ?? 0))),
    influence: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.influence + (bonus.influence ?? 0))),
    discipline: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.discipline + (bonus.discipline ?? 0))),
    adaptabilite: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.adaptabilite + (bonus.adaptabilite ?? 0))),
    confiance: Math.min(CHARACTERISTIC_MAX, Math.max(CHARACTERISTIC_MIN, base.confiance + (bonus.confiance ?? 0))),
  };
}

// ============================================================================
// 4. Création du Monde Personnalisé & Initialisation
// ============================================================================

export interface CreateCustomWorldOptions {
  seed?: number;
  customization?: Partial<PlayerCustomization> & {
    bonusPoints?: Partial<Record<keyof Characteristics, number>>;
  };
}

/**
 * Crée un état du monde initialisé avec la personnalisation P-PERSO complète.
 * Si customization est omis ou partiel, applique les valeurs canoniques (Camille).
 */
export function createCustomWorld(opts: CreateCustomWorldOptions = {}): CustomWorldState {
  const seed = opts.seed ?? 20200901;
  const custom = opts.customization ?? {};
  const rawFirstName = custom.firstName !== undefined ? custom.firstName : DEFAULT_PLAYER_CUSTOMIZATION.firstName;
  const rawLastName = custom.lastName !== undefined ? custom.lastName : DEFAULT_PLAYER_CUSTOMIZATION.lastName;
  const rawGender = custom.gender !== undefined ? custom.gender : DEFAULT_PLAYER_CUSTOMIZATION.gender;

  const identity = validateIdentity(rawFirstName, rawLastName, rawGender);
  const firstName = identity.sanitized.firstName;
  const lastName = identity.sanitized.lastName;
  const gender = identity.sanitized.gender;
  const fullName = identity.sanitized.fullName;

  const appearanceRes = validateAppearance(custom.appearance);
  // La taille adulte visée est toujours enregistrée : la taille réelle en découle selon l'âge.
  const appearance = { ...appearanceRes.appearance, adultHeightCm: adultHeightOf(appearanceRes.appearance, gender) };

  let characteristics: Characteristics;
  if (custom.characteristics) {
    characteristics = {
      comprehension: custom.characteristics.comprehension ?? BASE_CHARACTERISTICS.comprehension,
      creativite: custom.characteristics.creativite ?? BASE_CHARACTERISTICS.creativite,
      influence: custom.characteristics.influence ?? BASE_CHARACTERISTICS.influence,
      discipline: custom.characteristics.discipline ?? BASE_CHARACTERISTICS.discipline,
      adaptabilite: custom.characteristics.adaptabilite ?? BASE_CHARACTERISTICS.adaptabilite,
      confiance: custom.characteristics.confiance ?? BASE_CHARACTERISTICS.confiance,
    };
  } else if (custom.bonusPoints) {
    characteristics = computeFinalCharacteristics(BASE_CHARACTERISTICS, custom.bonusPoints);
  } else {
    characteristics = { ...BASE_CHARACTERISTICS };
  }

  // Création du monde de base via createWorld existant
  const baseWorld = createWorld({ seed, playerName: fullName });

  const customPlayer: CustomPlayer = {
    ...baseWorld.player,
    name: fullName,
    firstName,
    lastName,
    gender,
    appearance,
    characteristics,
  };

  const worldState: CustomWorldState = {
    ...baseWorld,
    player: customPlayer,
  };

  return worldState;
}

// ============================================================================
// 5. Migration Sauvegarde v9 → v10
// ============================================================================

/**
 * Applique l'étape de migration 9 → 10 sur un objet de sauvegarde brute.
 * Rétrocompatible et non destructif : garantit la présence de firstName, lastName,
 * gender, et appearance tout en préservant l'intégralité des données antérieures.
 */
export function applyMigrationV10(rawSave: RawSaveData): RawSaveData {
  const s = structuredClone(rawSave);
  const player = (s.player ?? {}) as RawSaveData;

  const existingName =
    typeof player.name === 'string' && player.name.trim().length > 0
      ? player.name.trim()
      : 'Camille';

  // Conservation de firstName si présent, sinon dérivation depuis name ou repli canonique
  player.firstName =
    typeof player.firstName === 'string' && player.firstName.trim().length > 0
      ? player.firstName.trim()
      : existingName;

  player.lastName = typeof player.lastName === 'string' ? player.lastName.trim() : '';

  // Genre avec repli canonique inclusif 'non-binaire'
  player.gender = VALID_GENDERS.includes(player.gender as PlayerGender)
    ? (player.gender as PlayerGender)
    : 'non-binaire';

  // Apparence avec repli token par token
  const rawApp =
    typeof player.appearance === 'object' && player.appearance !== null
      ? (player.appearance as RawSaveData)
      : {};

  player.appearance = {
    skinTone: VALID_SKIN_TONES.includes(rawApp.skinTone as SkinTone)
      ? rawApp.skinTone
      : DEFAULT_PLAYER_APPEARANCE.skinTone,
    hairColor: VALID_HAIR_COLORS.includes(rawApp.hairColor as HairColor)
      ? rawApp.hairColor
      : DEFAULT_PLAYER_APPEARANCE.hairColor,
    hairStyle: VALID_HAIR_STYLES.includes(rawApp.hairStyle as HairStyle)
      ? rawApp.hairStyle
      : DEFAULT_PLAYER_APPEARANCE.hairStyle,
    outfitStyle: VALID_OUTFIT_STYLES.includes(rawApp.outfitStyle as OutfitStyle)
      ? rawApp.outfitStyle
      : DEFAULT_PLAYER_APPEARANCE.outfitStyle,
    outfitColor: VALID_OUTFIT_COLORS.includes(rawApp.outfitColor as OutfitColor)
      ? rawApp.outfitColor
      : DEFAULT_PLAYER_APPEARANCE.outfitColor,
  };

  // Mise à jour de la version
  s.player = player;
  s.version = SAVE_VERSION_V10;

  return s;
}

/**
 * Fait migrer n'importe quelle sauvegarde ancienne vers la version courante (SAVE_VERSION).
 * Délègue directement à migrateSave() qui applique la chaîne complète.
 */
export function migrateSaveToV10(raw: unknown): CustomWorldState {
  return migrateSave(raw);
}

/**
 * Restaure un monde personnalisé depuis une chaîne JSON versionnée (v0 à SAVE_VERSION).
 */
export function importCustomSave(rawJson: string): CustomWorldState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`JSON de sauvegarde invalide : ${err instanceof Error ? err.message : String(err)}`);
  }
  return migrateSave(parsed);
}
