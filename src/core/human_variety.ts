/**
 * Logique humaine (V1.1) : croissance, hérédité familiale et variété des habitants.
 *
 * - La taille choisie à la création est la taille **adulte visée** ; à 12 ans on n'en a qu'une
 *   partie, selon des courbes de croissance moyennes (pic de croissance plus tôt chez les filles).
 * - La famille suit le personnage : teintes de peau voisines (familles métissées comprises),
 *   cheveux et yeux plausibles, tailles des parents cohérentes avec la taille visée
 *   (formule de la taille cible parentale, ±13 cm entre pères et mères).
 * - Les habitants sont tirés du même système, avec des fréquences réalistes : toutes les teintes
 *   de peau, couleurs de cheveux naturelles le plus souvent, toutes les corpulences, lunettes,
 *   barbes, cheveux gris avec l'âge.
 *
 * Pur et déterministe : chaque tirage vient d'un hachage de sa graine (aucun PRNG du monde n'est
 * consommé, pas de Math.random()).
 */
import type {
  BodyShape, PlayerAppearance, PlayerBeard, PlayerBody, PlayerEyeColor, PlayerGender, PlayerHairColor, PlayerHairStyle,
  PlayerOutfitStyle,
} from './types';
import {
  BODY_SHAPE_KEYS, VALID_ACCESSORIES, VALID_EYES, VALID_GLASSES, VALID_OUTFIT_COLORS, VALID_SKIN_TONES,
} from './types';

// ---------- Croissance ----------

export const ADULT_HEIGHT_MIN_CM = 145;
export const ADULT_HEIGHT_MAX_CM = 205;

/** Taille adulte moyenne par défaut. */
export function defaultAdultHeightCm(gender: PlayerGender | undefined): number {
  return gender === 'garcon' ? 176 : gender === 'fille' ? 164 : 170;
}

/** Part de la taille adulte atteinte à chaque âge (courbes moyennes). */
const GROWTH_BOY: Record<number, number> = { 8: 0.72, 9: 0.75, 10: 0.78, 11: 0.81, 12: 0.84, 13: 0.88, 14: 0.93, 15: 0.96, 16: 0.98, 17: 0.99, 18: 1 };
const GROWTH_GIRL: Record<number, number> = { 8: 0.78, 9: 0.81, 10: 0.84, 11: 0.88, 12: 0.92, 13: 0.96, 14: 0.98, 15: 0.99, 16: 1, 17: 1, 18: 1 };

export function growthFraction(age: number, gender: PlayerGender | undefined): number {
  const a = Math.max(8, Math.min(18, Math.floor(age)));
  const boy = GROWTH_BOY[a]!, girl = GROWTH_GIRL[a]!;
  return gender === 'garcon' ? boy : gender === 'fille' ? girl : (boy + girl) / 2;
}

/** Taille réelle (mètres) à un âge donné pour une taille adulte visée. */
export function heightAtAge(age: number, adultCm: number, gender: PlayerGender | undefined): number {
  return Math.round(adultCm * growthFraction(age, gender)) / 100;
}

/** Taille adulte visée d'une apparence (ancienne échelle −2…+2 convertie si besoin). */
export function adultHeightOf(a: PlayerAppearance, gender: PlayerGender | undefined): number {
  if (typeof a.adultHeightCm === 'number') return clampHeight(a.adultHeightCm);
  return clampHeight(defaultAdultHeightCm(gender) + (a.heightAdj ?? 0) * 6);
}

export function clampHeight(cm: number): number {
  return Math.max(ADULT_HEIGHT_MIN_CM, Math.min(ADULT_HEIGHT_MAX_CM, Math.round(cm)));
}

export function formatHeight(m: number): string {
  const cm = Math.round(m * 100);
  return `${Math.floor(cm / 100)} m ${String(cm % 100).padStart(2, '0')}`;
}

/** Taille réelle du joueur aujourd'hui. */
export function playerHeightM(p: { age: number; gender?: PlayerGender; appearance: PlayerAppearance }): number {
  return heightAtAge(p.age, adultHeightOf(p.appearance, p.gender), p.gender);
}

// ---------- Tirages déterministes ----------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Suite pseudo-aléatoire locale (mulberry32) : jamais le PRNG du monde. */
function rngOf(seed: string): () => number {
  let a = hashString(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(r: () => number, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of items) {
    if ((x -= w) < 0) return v;
  }
  return items[items.length - 1]![0];
}

/** Courbe en cloche approchée (somme de trois tirages). */
function bell(r: () => number, mean: number, spread: number): number {
  return mean + ((r() + r() + r()) / 3 - 0.5) * 2 * spread;
}

const SKIN = VALID_SKIN_TONES;
const skinIndex = (a: PlayerAppearance): number => Math.max(0, SKIN.indexOf(a.skinTone));
const NATURAL_HAIR: readonly PlayerHairColor[] = ['noir', 'brun', 'chatain', 'blond', 'roux'];
const DYED_HAIR: readonly PlayerHairColor[] = ['platine', 'bleu', 'rose', 'vert'];
/** Coiffures qui vont avec des cheveux crépus ou très frisés. */
const COILY_STYLES: readonly PlayerHairStyle[] = ['afro', 'locks', 'tresse', 'boucle', 'rase', 'degrade', 'chignon', 'court'];
const STYLES_MASC: readonly PlayerHairStyle[] = ['court', 'rase', 'degrade', 'boucle', 'mi-long', 'frange', 'crete', 'queue'];
const STYLES_FEM: readonly PlayerHairStyle[] = ['long', 'mi-long', 'chignon', 'queue', 'boucle', 'frange', 'court', 'tresse'];

/** Couleur de cheveux naturelle, plausible pour une teinte de peau. */
function naturalHair(r: () => number, skin: number): PlayerHairColor {
  if (skin >= 6) return weighted(r, [['noir', 7], ['brun', 3], ['chatain', 0.3]]);
  if (skin >= 3) return weighted(r, [['noir', 4], ['brun', 5], ['chatain', 2], ['blond', 0.4], ['roux', 0.2]]);
  return weighted(r, [['brun', 3], ['chatain', 4], ['blond', 3], ['roux', 1], ['noir', 1]]);
}

function eyeColorFor(r: () => number, skin: number): PlayerEyeColor {
  if (skin >= 6) return weighted(r, [['brun', 9], ['noisette', 1]]);
  if (skin >= 3) return weighted(r, [['brun', 6], ['noisette', 3], ['vert', 1], ['gris', 0.3]]);
  return weighted(r, [['brun', 3], ['noisette', 2], ['vert', 2], ['bleu', 3], ['gris', 1]]);
}

function hairStyleFor(r: () => number, gender: PlayerGender | undefined, coily: boolean): PlayerHairStyle {
  const base = gender === 'garcon' ? STYLES_MASC : gender === 'fille' ? STYLES_FEM : [...STYLES_MASC, ...STYLES_FEM];
  if (coily && r() < 0.75) {
    const textured = COILY_STYLES.filter((s) => gender !== 'garcon' || s !== 'chignon');
    return textured[Math.floor(r() * textured.length)]!;
  }
  return base[Math.floor(r() * base.length)]!;
}

function bodyFor(r: () => number, age: number): PlayerBody {
  if (age < 18) return weighted(r, [['fine', 3], ['moyenne', 5], ['sportive', 2], ['ronde', 2]]);
  return weighted(r, [['fine', 2.5], ['moyenne', 4], ['sportive', 1.5], ['ronde', 2.5]]);
}

/** Âge à partir duquel la silhouette adulte s'applique. */
export const ADULT_SHAPE_AGE = 18;

/** Apparence telle qu'on la voit à cet âge : la silhouette adulte n'apparaît qu'à 18 ans. */
export function visibleAppearance(a: PlayerAppearance, age: number): PlayerAppearance {
  if (age >= ADULT_SHAPE_AGE || !a.physique) return a;
  const { physique: _hidden, ...rest } = a;
  return rest;
}

/** Silhouette visible à cet âge : aucune avant 18 ans (le corps suit l'âge). */
export function physiqueAtAge(a: PlayerAppearance, age: number): BodyShape | undefined {
  return age >= ADULT_SHAPE_AGE ? a.physique : undefined;
}

const clamp1 = (v: number): number => Math.max(-1, Math.min(1, Math.round(v * 100) / 100));

/**
 * Silhouette d'un adulte : tendances selon la corpulence et le genre, mais chaque trait garde
 * une large part de hasard (des épaules larges et des hanches larges, un ventre rond et des bras
 * musclés…) pour une vraie variété, ni tout sculpté ni tout rond.
 */
function physiqueFor(r: () => number, body: PlayerBody, gender: PlayerGender | undefined): BodyShape {
  const lean: Record<PlayerBody, Partial<BodyShape>> = {
    fine: { epaules: -0.3, poitrine: -0.3, hanches: -0.3, fessier: -0.3, ventre: -0.5, muscles: -0.3, cuisses: -0.4, taille: -0.3 },
    moyenne: {},
    sportive: { epaules: 0.4, muscles: 0.6, ventre: -0.4, cuisses: 0.3, fessier: 0.2, taille: -0.2 },
    ronde: { ventre: 0.6, hanches: 0.4, cuisses: 0.5, fessier: 0.4, poitrine: 0.4, taille: 0.5, epaules: 0.2 },
  };
  const g: Partial<BodyShape> = gender === 'garcon' ? { epaules: 0.25, muscles: 0.15, hanches: -0.25, fessier: -0.1, poitrine: -0.2 }
    : gender === 'fille' ? { hanches: 0.3, fessier: 0.25, poitrine: 0.3, epaules: -0.2, taille: -0.15 } : {};
  const out: BodyShape = {};
  for (const k of BODY_SHAPE_KEYS) out[k] = clamp1((lean[body][k] ?? 0) + (g[k] ?? 0) + bell(r, 0, 0.75));
  return out;
}

function outfitFor(r: () => number, age: number): PlayerOutfitStyle {
  if (age < 15) return weighted(r, [['ecolier', 5], ['streetwear', 3], ['sportif', 2]]);
  if (age < 20) return weighted(r, [['streetwear', 5], ['sportif', 3], ['ecolier', 1], ['citoyen', 1]]);
  return weighted(r, [['citoyen', 4], ['artisan', 3], ['streetwear', 2], ['sportif', 2], ['entrepreneur', 1.5], ['dirigeant', 0.5]]);
}

function beardFor(r: () => number, age: number, gender: PlayerGender | undefined): PlayerBeard {
  if (gender !== 'garcon' || age < 16) return 'aucune';
  if (age < 19) return r() < 0.3 ? 'duvet' : 'aucune';
  return weighted(r, [['aucune', 5], ['courte', 2], ['pleine', 1.5], ['moustache', 1]]);
}

// ---------- Habitants ----------

export interface HumanLook {
  appearance: PlayerAppearance;
  gender: PlayerGender;
  /** Taille réelle à l'âge donné, en mètres. */
  heightM: number;
}

/**
 * Un habitant tiré de sa graine. `gender` connu (personnage nommé) ou tiré ; `age` décide de la
 * taille atteinte, de la barbe, des cheveux gris et du style des tenues.
 */
export function generateLook(seed: string, opts: { age?: number; gender?: PlayerGender; unknownGender?: boolean } = {}): HumanLook {
  const r = rngOf(seed);
  const age = opts.age ?? Math.max(8, Math.round(bell(r, 38, 32)));
  // Personnage nommé dont le genre n'est pas décrit : silhouette mixte, jamais de barbe imposée.
  const gender = opts.unknownGender ? 'non-binaire' : opts.gender ?? weighted<PlayerGender>(r, [['garcon', 48], ['fille', 48], ['non-binaire', 4]]);
  const skin = Math.floor(r() * SKIN.length);
  const coily = skin >= 6 ? r() < 0.85 : skin >= 4 ? r() < 0.25 : r() < 0.05;
  let hairColor: PlayerHairColor = r() < 0.06 ? DYED_HAIR[Math.floor(r() * DYED_HAIR.length)]! : naturalHair(r, skin);
  if (age > 50 && r() < Math.min(0.85, (age - 45) / 30)) hairColor = 'gris';
  const adultCm = clampHeight(bell(r, gender === 'garcon' ? 176 : gender === 'fille' ? 163 : 170, 17));
  const body = bodyFor(r, age);
  const appearance: PlayerAppearance = {
    skinTone: SKIN[skin]!,
    hairColor,
    hairStyle: age > 60 && gender === 'garcon' && r() < 0.3 ? 'rase' : hairStyleFor(r, gender, coily),
    outfitStyle: outfitFor(r, age),
    outfitColor: VALID_OUTFIT_COLORS[Math.floor(r() * VALID_OUTFIT_COLORS.length)]!,
    body,
    adultHeightCm: adultCm,
    ...(age >= ADULT_SHAPE_AGE ? { physique: physiqueFor(r, body, gender) } : {}),
    eyes: VALID_EYES[Math.floor(r() * VALID_EYES.length)]!,
    eyeColor: eyeColorFor(r, skin),
    glasses: r() < (age > 45 ? 0.5 : 0.22) ? VALID_GLASSES[1 + Math.floor(r() * (VALID_GLASSES.length - 1))]! : 'aucune',
    freckles: skin <= 3 && r() < 0.2,
    beard: beardFor(r, age, gender),
    accessory: r() < 0.35 ? VALID_ACCESSORIES[1 + Math.floor(r() * (VALID_ACCESSORIES.length - 1))]! : 'aucun',
  };
  return { appearance, gender, heightM: heightAtAge(age, adultCm, gender) };
}

// ---------- Famille ----------

export interface FamilyMemberLook extends HumanLook {
  id: 'nora' | 'thierry';
  name: string;
  role: string;
  age: number;
}

/**
 * Les parents du personnage, cohérents avec lui : teintes de peau encadrant la sienne (parfois
 * très différentes : familles métissées), un parent qui partage ses cheveux et ses yeux, et des
 * tailles telles que la taille visée de l'enfant soit leur taille cible parentale.
 */
export function familyLooks(child: PlayerAppearance, childGender: PlayerGender | undefined, seed = 'famille'): FamilyMemberLook[] {
  const r = rngOf(`${seed}:${child.skinTone}:${child.hairColor}:${child.adultHeightCm ?? child.heightAdj ?? 0}`);
  const s = skinIndex(child);
  // Écart de teinte entre les deux parents : souvent proche, parfois très marqué.
  const spread = weighted(r, [[0, 3], [1, 4], [2, 2], [3, 1]]);
  let lo = s - spread, hi = s + spread;
  if (lo < 0) { hi -= lo; lo = 0; }
  if (hi > SKIN.length - 1) { lo -= hi - (SKIN.length - 1); hi = SKIN.length - 1; }
  lo = Math.max(0, lo);
  const motherDarker = r() < 0.5;
  const motherSkin = motherDarker ? hi : lo, fatherSkin = motherDarker ? lo : hi;

  const childNatural = NATURAL_HAIR.includes(child.hairColor);
  const childCoily = COILY_STYLES.slice(0, 4).includes(child.hairStyle) || s >= 6;
  // Le parent dont la teinte est la plus proche partage les cheveux de l'enfant.
  const motherShares = Math.abs(motherSkin - s) <= Math.abs(fatherSkin - s);

  // Taille cible parentale : enfant = (père + mère ± 13) / 2.
  const target = adultHeightOf(child, childGender);
  const mid = childGender === 'garcon' ? target - 6.5 : childGender === 'fille' ? target + 6.5 : target;
  const jitter = (r() - 0.5) * 8;
  const fatherCm = clampHeight(mid + 6.5 + jitter);
  const motherCm = clampHeight(mid - 6.5 - jitter);

  const parent = (id: 'nora' | 'thierry', skin: number, shares: boolean, gender: PlayerGender, cm: number, age: number): FamilyMemberLook => {
    const coily = childCoily ? skin >= 4 || shares : skin >= 6 && r() < 0.8;
    // Le parent ne transmet sa couleur que si elle est plausible pour sa propre teinte.
    const plausible = skin >= 6 ? ['noir', 'brun'].includes(child.hairColor) : skin >= 3 ? child.hairColor !== 'blond' || skin < 5 : true;
    let hairColor: PlayerHairColor = shares && childNatural && plausible ? child.hairColor : naturalHair(r, skin);
    if (age > 44 && r() < 0.25) hairColor = 'gris';
    const body = bodyFor(r, age);
    // Règle de l'utilisateur : la famille n'a pas de handicap (les habitants, eux, couvrent toute la variété).
    const appearance: PlayerAppearance = {
      skinTone: SKIN[skin]!,
      hairColor,
      hairStyle: hairStyleFor(r, gender, coily),
      outfitStyle: id === 'nora' ? 'citoyen' : 'artisan',
      outfitColor: VALID_OUTFIT_COLORS[Math.floor(r() * VALID_OUTFIT_COLORS.length)]!,
      body,
      adultHeightCm: cm,
      physique: physiqueFor(r, body, gender),
      eyes: shares && child.eyes ? child.eyes : VALID_EYES[Math.floor(r() * VALID_EYES.length)]!,
      eyeColor: shares && child.eyeColor ? child.eyeColor : eyeColorFor(r, skin),
      glasses: r() < 0.35 ? VALID_GLASSES[1 + Math.floor(r() * (VALID_GLASSES.length - 1))]! : 'aucune',
      freckles: skin <= 3 && (shares ? !!child.freckles : r() < 0.2),
      beard: beardFor(r, age, gender),
      accessory: 'aucun',
    };
    return { id, name: id === 'nora' ? 'Nora' : 'Thierry', role: id === 'nora' ? 'ta mère' : 'ton père', age, gender, appearance, heightM: cm / 100 };
  };
  return [
    parent('nora', motherSkin, motherShares, 'fille', motherCm, 41),
    parent('thierry', fatherSkin, !motherShares, 'garcon', fatherCm, 44),
  ];
}
