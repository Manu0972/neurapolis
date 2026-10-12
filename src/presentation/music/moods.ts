/**
 * Musique adaptative — les quatre états musicaux et leurs couleurs (quartier, moment du jour).
 *
 * Données et fonctions pures : aucune dépendance au DOM ni à Web Audio (testables sous Node).
 * Gammes, tempos et densités reprennent le prototype `studio/audio/ambiances.html`
 * (exploration 92 BPM, tension 118, climax 140, résonance 66), notes converties en MIDI.
 */

export type MusicMood = 'exploration' | 'tension' | 'climax' | 'resonance';
export const MUSIC_MOODS: readonly MusicMood[] = ['exploration', 'tension', 'climax', 'resonance'];

/** Mixage cible par piste (0-1), atteint en fondu lors d'un changement d'état. */
export interface TrackMix { melody: number; pad: number; bass: number; perc: number }

export interface MoodDef {
  label: string;
  bpm: number;
  /** Notes de la corde pincée (MIDI), de la plus grave à la plus aiguë. */
  scale: readonly number[];
  /** Note de basse (MIDI), jouée une fois par mesure. */
  bass: number;
  /** Accord de nappe (MIDI), renouvelé toutes les deux mesures. */
  pad: readonly number[];
  /** Probabilité d'une note de corde par croche. */
  density: number;
  /** Probabilité d'un charleston par croche (0 = aucune percussion). */
  hat: number;
  /** Grosse caisse sur chaque demi-mesure. */
  kick: boolean;
  mix: TrackMix;
  /** Coupure du filtre de sortie (Hz) : clair en climax, feutré en résonance. */
  brightness: number;
}

export const MOODS: Readonly<Record<MusicMood, MoodDef>> = {
  // La majeur, corde pincée et nappe douce.
  exploration: {
    label: 'Exploration', bpm: 92,
    scale: [57, 59, 61, 64, 66, 69, 71], bass: 33, pad: [57, 61, 64],
    density: 0.55, hat: 0.25, kick: true,
    mix: { melody: 0.8, pad: 0.5, bass: 0.6, perc: 0.35 }, brightness: 5200,
  },
  // Ré mineur, basse pulsée.
  tension: {
    label: 'Tension', bpm: 118,
    scale: [50, 52, 53, 57, 58, 60, 62], bass: 26, pad: [50, 53, 57],
    density: 0.7, hat: 0.6, kick: true,
    mix: { melody: 0.7, pad: 0.55, bass: 0.85, perc: 0.55 }, brightness: 3600,
  },
  // Mi majeur héroïque, plein.
  climax: {
    label: 'Climax', bpm: 140,
    scale: [52, 56, 59, 61, 64, 66, 68, 71], bass: 28, pad: [52, 59, 68],
    density: 0.85, hat: 0.85, kick: true,
    mix: { melody: 0.85, pad: 0.6, bass: 0.8, perc: 0.7 }, brightness: 9000,
  },
  // Do majeur 7, lent et feutré, sans percussions.
  resonance: {
    label: 'Résonance', bpm: 66,
    scale: [48, 52, 55, 59, 62, 64, 67], bass: 24, pad: [48, 55, 64],
    density: 0.35, hat: 0, kick: false,
    mix: { melody: 0.75, pad: 0.65, bass: 0.4, perc: 0 }, brightness: 2400,
  },
};

// ---------- Couleurs : moment de la journée et quartier ----------

export type DayPart = 'matin' | 'jour' | 'soir' | 'nuit';

/** Découpage de la journée de jeu (heure décimale 0-24). */
export function dayPartOf(hour: number): DayPart {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 11) return 'matin';
  if (h >= 11 && h < 17) return 'jour';
  if (h >= 17 && h < 21) return 'soir';
  return 'nuit';
}

interface DayPartColor { tempo: number; density: number; brightness: number }
const DAYPART_COLOR: Readonly<Record<DayPart, DayPartColor>> = {
  matin: { tempo: 1.0, density: 0.9, brightness: 1.1 },
  jour: { tempo: 1.0, density: 1.0, brightness: 1.0 },
  soir: { tempo: 0.95, density: 0.9, brightness: 0.8 },
  nuit: { tempo: 0.9, density: 0.75, brightness: 0.6 },
};

/**
 * Chaque quartier a sa tonalité (transposition en demi-tons) et son allure :
 * on entend qu'on a changé de quartier sans que la musique change de caractère.
 */
const DISTRICT_COLOR: Readonly<Record<string, { transpose: number; tempo: number }>> = {
  centre: { transpose: 0, tempo: 1.0 },
  gare: { transpose: 2, tempo: 1.04 },
  hyperval: { transpose: 3, tempo: 1.06 },
  industrie: { transpose: -5, tempo: 0.97 },
  collines: { transpose: 5, tempo: 0.94 },
  berges: { transpose: -3, tempo: 0.96 },
  faubourg: { transpose: -2, tempo: 1.0 },
  grand_ensemble: { transpose: -1, tempo: 1.02 },
  friche_sud: { transpose: -4, tempo: 0.97 },
  bellevue: { transpose: 4, tempo: 0.96 },
};

export function districtColor(district: string | undefined): { transpose: number; tempo: number } {
  return (district && DISTRICT_COLOR[district]) || { transpose: 0, tempo: 1 };
}

/** État musical prêt à jouer : gamme transposée, tempo et densités ajustés. */
export interface ResolvedMood {
  mood: MusicMood;
  bpm: number;
  scale: number[];
  bass: number;
  pad: number[];
  density: number;
  hat: number;
  kick: boolean;
  mix: TrackMix;
  brightness: number;
}

/** Basse jamais sous Mi 1 (41 Hz) : inaudible sur des haut-parleurs d'ordinateur portable. */
const LOWEST_BASS = 28;

/** Applique les couleurs du quartier et du moment de la journée à un état musical. */
export function resolveMood(mood: MusicMood, district: string | undefined, hour: number): ResolvedMood {
  const def = MOODS[mood];
  const day = DAYPART_COLOR[dayPartOf(hour)];
  const dist = districtColor(district);
  // Le climax garde son élan : la nuit ne le ralentit pas.
  const tempoK = mood === 'climax' ? dist.tempo : dist.tempo * day.tempo;
  let bass = def.bass + dist.transpose;
  while (bass < LOWEST_BASS) bass += 12;
  return {
    mood,
    bpm: Math.round(def.bpm * tempoK),
    scale: def.scale.map((n) => n + dist.transpose),
    bass,
    pad: def.pad.map((n) => n + dist.transpose),
    density: Math.min(1, def.density * (mood === 'climax' ? 1 : day.density)),
    hat: def.hat,
    kick: def.kick,
    mix: { ...def.mix },
    brightness: Math.round(def.brightness * (mood === 'climax' ? 1 : day.brightness)),
  };
}

/** Fréquence (Hz) d'une note MIDI (La 4 = 69 = 440 Hz). */
export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
