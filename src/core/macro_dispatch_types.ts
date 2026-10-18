/**
 * NEURAPOLIS — Paliers 5-6 : Contrats de types pour les dépêches macroéconomiques mondiales.
 * Couche : core/ (100% sérialisable, sans dépendance DOM/Canvas, non branché sur WorldState).
 */

/** Gravité d'une dépêche d'actualité macroéconomique (1: Info, 2: Modérée, 3: Critique). */
export type DispatchGravity = 1 | 2 | 3;

/** Métrique ayant déclenché une dépêche d'actualité. */
export type MacroMetric = 'fret' | 'energie' | 'population' | 'conjoncture';

/**
 * Cliché instantané agrégé de la situation macroéconomique d'une région.
 * Non branché directement sur WorldState.
 */
export interface MacroSnapshot {
  /** Nom ou identifiant de la région inventée (ex: 'Novos-Boréal', 'Arc-Sud'). */
  region: string;
  /** Population totale de la région. */
  population: number;
  /** Indice de fret (base 100). */
  fretIndex: number;
  /** Indice d'énergie (base 100). */
  energyIndex: number;
  /** Variation annuelle globale (ex: 0.05 pour +5%, -0.12 pour -12%). */
  annualVariation: number;
}

/**
 * Dépêche d'actualité mondialisée produite de manière déterministe.
 */
export interface MacroDispatch {
  /** Titre synthétique de la dépêche. */
  title: string;
  /** Texte détaillé décrivant l'événement macroéconomique. */
  text: string;
  /** Gravité de l'événement (1 = info, 2 = alerte/modéré, 3 = critique/urgence). */
  gravity: DispatchGravity;
  /** Nom de la région inventée concernée. */
  region: string;
  /** Métrique sous-jacente perturbée. */
  metric: MacroMetric;
  /** Variation observée (ex: -0.25 pour une chute de 25%). */
  variation: number;
}
