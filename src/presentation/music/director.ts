/**
 * Musique adaptative — le « chef d'orchestre » : quel état musical pour quelle situation.
 *
 * Fonctions pures (aucun DOM, aucun Web Audio, aucune horloge globale : le temps réel est
 * passé en argument). Les signaux sont lus dans l'état du monde par `signals.ts`.
 *
 * Anti va-et-vient (hystérésis) à trois niveaux :
 *  1. seuils d'entrée et de sortie différents (on entre en tension à 0,6, on n'en sort qu'à 0,35) ;
 *  2. un état voulu doit le rester quelques secondes avant d'être adopté (confirmation) ;
 *  3. un état adopté dure un minimum (séjour minimal), sauf moment fort (fenêtre, fin de chapitre…).
 */
import type { MusicMood } from './moods';

/** Ce que la musique sait de la situation (tout est déjà extrait du monde). */
export interface MusicSignals {
  /** Heure de jeu décimale (0-24). */
  hour: number;
  asleep: boolean;
  /** Dans le logement familial (intérieur). */
  insideHome: boolean;
  /** Dans sa chambre. */
  inBedroom: boolean;
  /** Lieu le plus proche à portée (place, collège, parc…), s'il y en a un. */
  nearPlace: string | null;
  /** Quartier (zone de la grande carte). */
  district: string;
  stress: number;
  moral: number;
  money: number;
  /** Capital restant dû sur les prêts. */
  debt: number;
  /** Rival en pleine offensive (0-1) : agressivité, proximité de son terrain. */
  rival: number;
  /** Événement grave (0-1) : surprise catastrophique en attente, très grosse erreur récente. */
  grave: number;
  /** Convocation chez la principale (0-1) : 0,7 le jour même, moins ensuite. */
  convocation: number;
  /** Une entreprise est dans le rouge depuis plusieurs jours (0-1). */
  redVenture: number;
  /** Compteurs servant à repérer les moments forts. */
  chapters: number;
  tier: number;
  rewinds: number;
  sales: number;
  /** Une fenêtre de la présentation impose un état (débat, épilogue, convocation…). */
  scene: MusicMood | null;
}

export const TENSION_ENTER = 0.6;
export const TENSION_EXIT = 0.35;
export const CALM_ENTER = 0.6;
export const CALM_EXIT = 0.4;
/** Temps pendant lequel un nouvel état doit rester voulu avant d'être adopté (ms). */
export const CONFIRM_MS = 3000;
/** Confirmation raccourcie pour les moments forts (fenêtre ouverte, fin de chapitre…). */
export const URGENT_CONFIRM_MS = 400;
/** Séjour minimal dans un état avant d'en sortir (ms), hors moments forts. */
export const MIN_DWELL_MS: Readonly<Record<MusicMood, number>> = {
  exploration: 8000, tension: 15000, climax: 12000, resonance: 12000,
};
/** Durée des moments forts (ms). */
export const PULSE_MS = { chapter: 40_000, tier: 40_000, rewind: 45_000, bigSale: 20_000 } as const;
/** Une grande vente ne relance pas le climax plus d'une fois toutes les 3 minutes. */
export const BIG_SALE_COOLDOWN_MS = 180_000;

const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/** Poids de la dette (0-1) : nul sans prêt, plein si la caisse est négative ou la dette écrasante. */
export function debtFactor(money: number, debt: number): number {
  if (money < 0) return 1;
  if (debt <= 0) return 0;
  const ratio = debt / (money + debt);
  return clamp01((ratio - 0.5) / 0.4);
}

/** Score de tension (0-1) : le facteur le plus fort, plus un bonus quand plusieurs s'additionnent. */
export function tensionScore(s: MusicSignals): number {
  const factors = [
    clamp01((s.stress - 60) / 25),
    debtFactor(s.money, s.debt),
    clamp01(s.rival),
    clamp01(s.grave),
    clamp01(s.convocation),
    clamp01(s.redVenture),
  ];
  const max = Math.max(...factors);
  const strong = factors.filter((f) => f >= 0.5).length;
  return clamp01(max + 0.1 * Math.max(0, strong - 1));
}

export function isNightHour(hour: number): boolean {
  const h = ((hour % 24) + 24) % 24;
  return h >= 22 || h < 6;
}

/** Score de calme (0-1) : sommeil, chambre, nuit, soirée à la maison, parc paisible. */
export function calmScore(s: MusicSignals): number {
  if (s.asleep) return 1;
  let c = 0;
  if (s.inBedroom) c = Math.max(c, 0.85);
  if (isNightHour(s.hour)) c = Math.max(c, 0.75);
  if (s.insideHome) c = Math.max(c, s.hour >= 20 ? 0.7 : s.stress < 35 ? 0.62 : 0.45);
  if (s.nearPlace === 'parc' && s.stress < 40 && s.moral >= 50) c = Math.max(c, 0.6);
  return c;
}

/**
 * État voulu, sans la temporisation : fenêtre imposée > moment fort > sommeil > tension > calme
 * > exploration. Les seuils dépendent de l'état courant (hystérésis).
 */
export function desiredMood(s: MusicSignals, current: MusicMood, pulse: MusicMood | null = null): MusicMood {
  if (s.scene) return s.scene;
  if (pulse) return pulse;
  if (s.asleep) return 'resonance';
  if (tensionScore(s) >= (current === 'tension' ? TENSION_EXIT : TENSION_ENTER)) return 'tension';
  if (calmScore(s) >= (current === 'resonance' ? CALM_EXIT : CALM_ENTER)) return 'resonance';
  return 'exploration';
}

/** Mémoire du chef d'orchestre entre deux mises à jour. */
export interface DirectorState {
  mood: MusicMood;
  /** Instant (ms) d'entrée dans l'état courant. */
  since: number;
  candidate: MusicMood | null;
  candidateSince: number;
  /** Moment fort en cours (climax de fin de chapitre, résonance après un retour en arrière…). */
  pulse: { mood: MusicMood; until: number; why: string } | null;
  /** Derniers compteurs vus (null avant la première mise à jour : pas de faux moment fort au chargement). */
  last: { chapters: number; tier: number; rewinds: number; sales: number; money: number; debt: number } | null;
  lastBigSale: number;
  /** Raison lisible du dernier changement (affichée dans le panneau Son). */
  reason: string;
}

export function createDirector(now = 0, mood: MusicMood = 'exploration'): DirectorState {
  return { mood, since: now, candidate: null, candidateSince: now, pulse: null, last: null, lastBigSale: -Infinity, reason: 'début' };
}

/** Repère les moments forts en comparant les compteurs à la mise à jour précédente. */
function detectPulse(st: DirectorState, s: MusicSignals, now: number): DirectorState['pulse'] {
  const prev = st.last;
  if (!prev) return st.pulse;
  if (s.rewinds > prev.rewinds) return { mood: 'resonance', until: now + PULSE_MS.rewind, why: 'retour en arrière' };
  if (s.chapters > prev.chapters) return { mood: 'climax', until: now + PULSE_MS.chapter, why: 'fin de chapitre' };
  if (s.tier > prev.tier) return { mood: 'climax', until: now + PULSE_MS.tier, why: 'nouveau palier' };
  if (!s.asleep && now - st.lastBigSale >= BIG_SALE_COOLDOWN_MS) {
    const gain = s.money - prev.money;
    const borrowed = s.debt - prev.debt;
    const bigMoney = gain >= Math.max(100, prev.money * 0.35) && borrowed <= 0;
    const bigCount = s.sales - prev.sales >= 12;
    if (bigMoney || bigCount) return { mood: 'climax', until: now + PULSE_MS.bigSale, why: 'grande vente' };
  }
  return st.pulse;
}

/** Une mise à jour du chef d'orchestre (pure : renvoie un nouvel état). */
export function stepDirector(st: DirectorState, s: MusicSignals, now: number): DirectorState {
  let pulse = detectPulse(st, s, now);
  const lastBigSale = pulse && pulse !== st.pulse && pulse.why === 'grande vente' ? now : st.lastBigSale;
  if (pulse && now >= pulse.until) pulse = null;
  const next: DirectorState = {
    ...st,
    pulse,
    lastBigSale,
    last: { chapters: s.chapters, tier: s.tier, rewinds: s.rewinds, sales: s.sales, money: s.money, debt: s.debt },
  };
  const want = desiredMood(s, st.mood, pulse?.mood ?? null);
  if (want === st.mood) return { ...next, candidate: null };
  if (next.candidate !== want) {
    next.candidate = want;
    next.candidateSince = now;
  }
  const urgent = s.scene === want || pulse?.mood === want;
  const confirm = urgent ? URGENT_CONFIRM_MS : CONFIRM_MS;
  const dwell = urgent ? 0 : MIN_DWELL_MS[st.mood];
  if (now - next.candidateSince >= confirm && now - st.since >= dwell) {
    return { ...next, mood: want, since: now, candidate: null, reason: reasonFor(s, want, pulse) };
  }
  return next;
}

function reasonFor(s: MusicSignals, mood: MusicMood, pulse: DirectorState['pulse']): string {
  if (s.scene === mood) return 'scène en cours';
  if (pulse?.mood === mood) return pulse.why;
  if (mood === 'tension') {
    const parts: string[] = [];
    if (s.stress >= 75) parts.push('stress');
    if (debtFactor(s.money, s.debt) >= 0.5) parts.push('dette');
    if (s.rival >= 0.5) parts.push('rival');
    if (s.grave >= 0.5) parts.push('coup dur');
    if (s.convocation >= 0.5) parts.push('convocation');
    if (s.redVenture >= 0.5) parts.push('entreprise dans le rouge');
    return parts.join(', ') || 'tension';
  }
  if (mood === 'resonance') {
    if (s.asleep) return 'sommeil';
    if (s.inBedroom) return 'chambre';
    if (isNightHour(s.hour)) return 'nuit';
    if (s.insideHome) return 'à la maison';
    return 'moment calme';
  }
  return 'situation ordinaire';
}

/**
 * Fenêtres de la présentation qui imposent un état musical, reconnues à leur titre.
 * Les autres fenêtres laissent l'état du monde décider.
 */
export function moodForModal(title: string | null | undefined): MusicMood | null {
  if (!title) return null;
  const t = title.toLowerCase();
  // Climax : grands moments (débat et vote du quartier, épilogue, fusion de deux voix).
  if (t.includes('grand débat') || t.includes('héritage') || t.startsWith('fusion')) return 'climax';
  // Tension : convocation, coup dur (💥) ou mauvaise surprise (⚡).
  if (t.includes('convocation') || t.startsWith('💥') || t.startsWith('⚡')) return 'tension';
  // Résonance : retour en arrière, dîner en famille, chambre, carnets, voix qui s'éveille.
  if (t.includes('remonter le temps') || t.includes('le dîner') || t.includes('ta chambre')
    || t.includes('carnets de lucien') || t.startsWith('📖') || t.includes('une voix s’éveille')) return 'resonance';
  return null;
}
