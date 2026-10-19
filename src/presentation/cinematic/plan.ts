/**
 * Cinématiques : une liste de plans déterministe (logique pure, sans DOM ni Three.js, testable).
 * Chaque plan dure un temps fixe, déplace la caméra d'une pose à l'autre (fondu en douceur),
 * porte un sous-titre et peut déclencher des « repères » (lampe, éclair, carnet, voix…) qui
 * restent actifs ensuite. Le lecteur (player.ts) et les décors (sets.ts) lisent ce plan.
 */
import { CHAPTER1_END_OUTRO, CHAPTER1_END_SUBTITLES, CHAPTER_END_TEXTS, ORIGIN_OUTRO, ORIGIN_SUBTITLES } from '../../data/story_cinematics';
import { INITIAL_CAMPAIGN_STAGES } from '../../data/campaign';

export interface Vec3 { x: number; y: number; z: number }
export interface CamPose { pos: Vec3; look: Vec3 }

/** Repères de mise en scène (ce que le décor doit montrer à partir de ce plan). */
export type Cue = 'orage' | 'poussiere' | 'eclair' | 'chute' | 'carnet' | 'lueur' | 'voix' | 'smith' | 'crepuscule' | 'amis';

export interface Shot {
  id: string;
  /** Durée en secondes. */
  duration: number;
  from: CamPose;
  to: CamPose;
  subtitle?: string;
  /** Repères qui commencent avec ce plan (et restent actifs ensuite). */
  cues?: Cue[];
  /** Fantôme qui parle pendant ce plan (sa bouche suit le sous-titre). */
  speaker?: string;
}

export type SetId = 'bibliotheque' | 'toits';

export interface CinematicPlan {
  id: string;
  set: SetId;
  shots: Shot[];
  /** Carton affiché pendant le fondu de sortie. */
  outro: string;
  /** Fantômes présents dans le décor (dans l'ordre d'apparition). */
  ghosts: string[];
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const pose = (pos: Vec3, look: Vec3): CamPose => ({ pos, look });

/** Durée totale d'un plan de cinématique (s). */
export function planDuration(p: CinematicPlan): number {
  return p.shots.reduce((s, sh) => s + sh.duration, 0);
}

/** Plan en cours à l'instant t (s) et avancement u ∈ [0, 1] ; null une fois la cinématique finie. */
export function shotAt(p: CinematicPlan, t: number): { index: number; shot: Shot; u: number; start: number } | null {
  if (t < 0) t = 0;
  let start = 0;
  for (let i = 0; i < p.shots.length; i += 1) {
    const sh = p.shots[i]!;
    if (t < start + sh.duration) return { index: i, shot: sh, u: (t - start) / sh.duration, start };
    start += sh.duration;
  }
  return null;
}

/** Fondu doux (départ et arrivée sans à-coup). */
export function ease(u: number): number {
  const c = Math.max(0, Math.min(1, u));
  return c * c * (3 - 2 * c);
}

const lerp = (a: Vec3, b: Vec3, u: number): Vec3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });

/** Pose de la caméra à l'instant t (la dernière pose une fois fini). */
export function cameraAt(p: CinematicPlan, t: number): CamPose {
  const s = shotAt(p, t);
  if (!s) { const last = p.shots[p.shots.length - 1]!; return last.to; }
  const u = ease(s.u);
  return { pos: lerp(s.shot.from.pos, s.shot.to.pos, u), look: lerp(s.shot.from.look, s.shot.to.look, u) };
}

/** Instant (s) où un repère commence, ou null s'il n'apparaît jamais. */
export function cueStart(p: CinematicPlan, cue: Cue): number | null {
  let start = 0;
  for (const sh of p.shots) {
    if (sh.cues?.includes(cue)) return start;
    start += sh.duration;
  }
  return null;
}

/** Depuis combien de secondes un repère est actif (négatif ou null : pas encore). */
export function cueAge(p: CinematicPlan, cue: Cue, t: number): number | null {
  const s = cueStart(p, cue);
  return s === null ? null : t - s;
}

/** Sous-titre affiché à l'instant t. */
export function subtitleAt(p: CinematicPlan, t: number): string | null {
  return shotAt(p, t)?.shot.subtitle ?? null;
}

/** Le plan suivant le plan courant commence à… (pour « passer le plan » au clic). */
export function nextShotStart(p: CinematicPlan, t: number): number {
  const s = shotAt(p, t);
  return s ? s.start + s.shot.duration : planDuration(p);
}

function withSubtitles(shots: Omit<Shot, 'subtitle'>[], subs: readonly string[]): Shot[] {
  return shots.map((s, i) => ({ ...s, subtitle: subs[i] }));
}

/** La nuit de la Maison du Peuple (≈ 50 s) : bibliothèque, lampe, chute, carnet, voix. */
export const ORIGIN_CINEMATIC: CinematicPlan = {
  id: 'origine',
  set: 'bibliotheque',
  outro: ORIGIN_OUTRO,
  ghosts: ['smith', 'marx', 'keynes', 'ostrom'],
  shots: withSubtitles([
    { id: 'orage', duration: 6.5, cues: ['orage'], from: pose(v(0, 3.4, -9.2), v(0, 1.4, 4)), to: pose(v(0, 2.5, -5.5), v(0, 1.1, 4)) },
    { id: 'etageres', duration: 6.5, from: pose(v(-1.2, 1.2, -6), v(-2.6, 1.5, -3.4)), to: pose(v(-1.1, 1.35, -1.2), v(-2.6, 1.6, 1.6)) },
    { id: 'lampe', duration: 6.5, cues: ['poussiere'], from: pose(v(1.9, 2.0, 2.4), v(0.4, 1.2, 5.4)), to: pose(v(1.0, 1.55, 3.8), v(0.2, 1.0, 5.6)) },
    { id: 'chute', duration: 5.5, cues: ['eclair', 'chute'], from: pose(v(0.2, 1.7, -1.8), v(0, 1.2, 1.3)), to: pose(v(0.1, 1.45, -0.8), v(0, 0.7, 1.3)) },
    { id: 'carnet', duration: 6.5, cues: ['carnet'], from: pose(v(1.3, 1.0, -0.1), v(0.42, 0.1, 0.78)), to: pose(v(0.8, 0.62, 0.2), v(0.42, 0.04, 0.78)) },
    { id: 'lueur', duration: 6, cues: ['lueur'], from: pose(v(0.8, 0.62, 0.2), v(0.4, 0.2, 0.85)), to: pose(v(1.7, 1.3, -0.6), v(0.1, 0.8, 1.3)) },
    { id: 'voix', duration: 7.5, cues: ['voix'], from: pose(v(1.7, 1.3, -0.6), v(0.1, 0.9, 1.3)), to: pose(v(0, 1.6, -2.6), v(0, 1.15, 1.4)) },
    { id: 'smith', duration: 8.5, cues: ['smith'], speaker: 'smith', from: pose(v(0, 1.6, -2.6), v(0.1, 1.3, 1.4)), to: pose(v(0.45, 1.55, 0.25), v(0.6, 1.5, 1.5)) },
  ], ORIGIN_SUBTITLES),
};

/** Fin du chapitre 1 (≈ 15 s) : sur les toits de la Cité des Roses au crépuscule. */
export const CHAPTER1_END_CINEMATIC: CinematicPlan = {
  id: 'fin_c1',
  set: 'toits',
  outro: CHAPTER1_END_OUTRO,
  ghosts: ['smith', 'keynes', 'ostrom'],
  shots: withSubtitles([
    { id: 'toits', duration: 5, cues: ['crepuscule'], from: pose(v(-6, 3.2, -6), v(0, 1.2, 0)), to: pose(v(-3.5, 2.2, -4.5), v(0, 1.1, 0)) },
    { id: 'amis', duration: 5, cues: ['amis', 'voix'], from: pose(v(-3.5, 2.2, -4.5), v(0, 1.1, 0)), to: pose(v(2.5, 1.7, -3.5), v(0, 1.2, 0.5)) },
    { id: 'horizon', duration: 5.5, speaker: 'smith', from: pose(v(2.5, 1.7, -3.5), v(0, 1.3, 2)), to: pose(v(0.6, 1.9, -2.2), v(0, 2.2, 30)) },
  ], CHAPTER1_END_SUBTITLES),
};

/** Fin du chapitre `ch` : celle du chapitre 1, ou le même décor avec les textes du chapitre. */
export function chapterEndCinematic(ch: number): CinematicPlan | null {
  if (ch === 1) return CHAPTER1_END_CINEMATIC;
  const t = CHAPTER_END_TEXTS[ch];
  if (!t) return null;
  const title = INITIAL_CAMPAIGN_STAGES[ch - 1]?.title ?? '';
  return {
    ...CHAPTER1_END_CINEMATIC,
    id: `fin_c${ch}`,
    outro: `Fin du chapitre ${ch}${title ? ` — ${title}` : ''}`,
    shots: CHAPTER1_END_CINEMATIC.shots.map((sh, i) => ({
      ...sh,
      subtitle: t.subtitles[i],
      speaker: sh.speaker ? t.speaker : undefined,
    })),
  };
}

export const CINEMATICS: Readonly<Record<string, CinematicPlan>> = {
  [ORIGIN_CINEMATIC.id]: ORIGIN_CINEMATIC,
  [CHAPTER1_END_CINEMATIC.id]: CHAPTER1_END_CINEMATIC,
};
