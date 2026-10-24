/**
 * Sensations de jeu — logique pure (sans Web Audio ni DOM, testable sous Vitest).
 * Choix du son de pas selon le sol et la vitesse, cadence des pas, limiteur de voix,
 * niveaux d'ambiance selon la météo et le lieu, et détection des déclencheurs
 * (entrée dans un intérieur, ouverture d'une fenêtre, vente, arrivée sur la balise).
 */
import { RUN_SPEED, WALK_SPEED } from '../city3d/locomotion';

/** Sols qui ont un bruit de pas propre (même liste que `SurfaceType` de audio.ts). */
export type FootSurface = 'pave' | 'brique' | 'parquet' | 'herbe' | 'terre' | 'asphalte' | 'sol';

/** Sol d'une tuile de la ville (voir `Surface` dans src/data/map.ts). */
export function surfaceOfTile(surface: string | undefined): FootSurface {
  switch (surface) {
    case 'herbe': case 'aire_jeux': return 'herbe';
    case 'terre': case 'gravier': return 'terre';
    case 'chaussee': case 'parking': case 'passage': return 'asphalte';
    case 'trottoir': return 'brique';
    case 'batiment': return 'sol';
    default: return 'pave'; // pavé, cour, entrées
  }
}

/** Sol d'un intérieur (voir `InteriorSpec.floor`). */
export function surfaceOfFloor(floor: string | undefined): FootSurface {
  switch (floor) {
    case 'parquet': return 'parquet';
    case 'herbe': return 'herbe';
    case 'paves': return 'pave';
    default: return 'sol'; // carrelage, lino, béton
  }
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** 0 en marchant, 1 en pleine course. */
export function runFactor(speed: number): number {
  return clamp((speed - WALK_SPEED) / (RUN_SPEED - WALK_SPEED), 0, 1);
}

/** Secondes entre deux pas pour une vitesse (m/s) : la cadence suit l'allure. */
export function stepInterval(speed: number): number {
  return clamp(0.66 - 0.052 * clamp(speed, 0.5, 8), 0.27, 0.62);
}

/** Horloge des pas : émet un pas au rythme de la vitesse ; le premier vient vite au démarrage. */
export class FootstepClock {
  private phase = 0.6;
  /** Avance de `dt` secondes ; vrai si un pas tombe maintenant. */
  update(dt: number, speed: number): boolean {
    if (speed < 0.45) { this.phase = 0.6; return false; }
    this.phase += dt / stepInterval(speed);
    if (this.phase < 1) return false;
    this.phase = this.phase >= 2 ? 0 : this.phase - 1;
    return true;
  }
}

/* ─────────────── Limiteur de voix ─────────────── */

/** Familles de bruitages, chacune avec sa limite. */
export type SfxKind = 'pas' | 'ui' | 'fenetre' | 'porte' | 'caisse' | 'piece' | 'jingle' | 'lointain' | 'alerte';

export interface VoiceRule {
  /** Voix simultanées au plus pour la famille. */
  max: number;
  /** Écart minimal entre deux départs (s) : deux déclenchements rapprochés n'en font qu'un. */
  gap: number;
  /** Prioritaire : passe même quand le total est atteint. */
  vip?: boolean;
}

export const VOICE_RULES: Record<SfxKind, VoiceRule> = {
  pas: { max: 2, gap: 0.12 },
  ui: { max: 2, gap: 0.05 },
  fenetre: { max: 1, gap: 0.12 },
  porte: { max: 2, gap: 0.2 },
  caisse: { max: 1, gap: 0.45, vip: true },
  piece: { max: 3, gap: 0.06 },
  jingle: { max: 1, gap: 0.8, vip: true },
  lointain: { max: 1, gap: 4 },
  alerte: { max: 1, gap: 0.3 },
};

/**
 * Pool de voix : borne le nombre de bruitages joués en même temps (total et par famille)
 * et écarte les doublons trop rapprochés. Le temps est fourni (secondes) : logique pure.
 */
export class VoiceLimiter {
  private active: { kind: SfxKind; end: number }[] = [];
  private lastStart = new Map<SfxKind, number>();
  public started = 0;
  public refused = 0;

  constructor(public readonly maxTotal = 12, private readonly rules: Record<SfxKind, VoiceRule> = VOICE_RULES) {}

  /** Réserve une voix de `duration` s à l'instant `now` ; faux si elle est refusée. */
  tryStart(kind: SfxKind, now: number, duration: number): boolean {
    this.active = this.active.filter((v) => v.end > now);
    const rule = this.rules[kind];
    const last = this.lastStart.get(kind);
    const ok = (last === undefined || now - last >= rule.gap)
      && this.active.filter((v) => v.kind === kind).length < rule.max
      && (this.active.length < this.maxTotal || !!rule.vip);
    if (!ok) { this.refused++; return false; }
    this.active.push({ kind, end: now + Math.max(0.01, duration) });
    this.lastStart.set(kind, now);
    this.started++;
    return true;
  }

  /** Voix encore actives à l'instant `now`. */
  count(now: number): number {
    return this.active.filter((v) => v.end > now).length;
  }
}

/* ─────────────── Ambiances ─────────────── */

export interface AmbienceInput {
  meteo: string | undefined;
  inside: boolean;
  hour: number;
  /** Lieu d'ambiance (`ville`, `parc`, `maison`…). */
  location: string;
}

/** Niveaux visés (0-1) des nappes : pluie, vent, rue lointaine, intérieur calme. */
export interface AmbienceLevels { rain: number; wind: number; street: number; room: number; muffled: boolean }

export function ambienceLevels(a: AmbienceInput): AmbienceLevels {
  const night = a.hour < 6 || a.hour >= 22;
  const rainy = a.meteo === 'pluie';
  const cloudy = a.meteo === 'nuages';
  if (a.inside) {
    return { rain: rainy ? 0.3 : 0, wind: rainy ? 0.12 : cloudy ? 0.06 : 0, street: night ? 0.04 : 0.12, room: 1, muffled: true };
  }
  const park = a.location === 'parc';
  return {
    rain: rainy ? 0.6 : 0, // grain fin ; la nappe de pluie principale est dans audio.ts
    wind: rainy ? 0.6 : cloudy ? 0.42 : 0.16,
    street: (park ? 0.35 : 0.75) * (night ? 0.4 : 1),
    room: 0,
    muffled: false,
  };
}

/* ─────────────── Déclencheurs ─────────────── */

/** Front d'un booléen : 'on' quand il devient vrai, 'off' quand il redevient faux. */
export function edge(prev: boolean, next: boolean): 'on' | 'off' | null {
  if (prev === next) return null;
  return next ? 'on' : 'off';
}

/** Son d'une fenêtre d'interface qui s'ouvre ou se ferme (téléphone à part). */
export type PanelCue = 'phone-open' | 'phone-close' | 'panel-open' | 'panel-close';

export function panelCue(wasOpen: boolean, isOpen: boolean, phone: boolean): PanelCue | null {
  const e = edge(wasOpen, isOpen);
  if (!e) return null;
  return phone ? (e === 'on' ? 'phone-open' : 'phone-close') : (e === 'on' ? 'panel-open' : 'panel-close');
}

/** Sens d'un changement d'argent (centimes près) pour animer le compteur. */
export function moneyTrend(prev: number, next: number): 'up' | 'down' | null {
  if (!Number.isFinite(prev) || !Number.isFinite(next) || Math.abs(next - prev) < 0.005) return null;
  return next > prev ? 'up' : 'down';
}

/** Nombre de pièces qui jaillissent pour une recette (3 à 12, croît avec le montant). */
export function coinCount(amount: number): number {
  if (!(amount > 0)) return 0;
  return Math.round(clamp(3 + Math.log2(1 + amount) * 1.4, 3, 12));
}

/**
 * Ventes : compare le compteur cumulé de clients (ou de ventes) d'une image à l'autre.
 * Un saut négatif (nouvelle journée, compteur remis à zéro) n'est pas une vente.
 */
export function newSales(prev: number, next: number): number {
  return next > prev ? next - prev : 0;
}

/** Arrivée sur la cible de mission : vraie une seule fois par étape. */
export class ArrivalWatch {
  private stepId = '';
  private reached = true;
  update(stepId: string, reached: boolean): boolean {
    if (stepId !== this.stepId) { this.stepId = stepId; this.reached = reached; return false; }
    const hit = !this.reached && reached;
    this.reached = reached;
    return hit;
  }
}
