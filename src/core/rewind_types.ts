/**
 * Retour en arrière (vision du 2026-10-07) : après une très grosse erreur, un fantôme peut
 * se sacrifier pour ramener le joueur quelques jours plus tôt. Ce qui a été appris reste.
 * Cet état traverse les retours en arrière (il est recopié dans le monde restauré). Save v19.
 */

export type CatastropheKind = 'faillite' | 'catastrophe' | 'chute';

export interface Catastrophe {
  day: number;
  kind: CatastropheKind;
  /** Ce qui s'est passé, en une phrase. */
  text: string;
  /** Entreprise concernée (pour reconnaître la même erreur plus tard). */
  ideaId?: string;
}

export interface Lesson {
  day: number;
  kind: CatastropheKind;
  text: string;
  /** Fantôme qui s'est sacrifié pour cette leçon : c'est lui qui préviendra. */
  ghost: string;
}

export interface Sacrifice {
  ghost: string;
  /** Jour (dans la ligne de temps restaurée) où sa voix s'est tue. */
  day: number;
  /** Jour où elle revient. */
  untilDay: number;
  returned: boolean;
}

export interface RewindState {
  count: number;
  lessons: Lesson[];
  sacrifices: Sacrifice[];
  /** Dernière très grosse erreur, tant qu'un retour en arrière est possible. */
  last?: Catastrophe;
  /** Valeur nette de la veille (détection des chutes brutales). */
  worthYesterday?: number;
}

export function createRewindState(): RewindState {
  return { count: 0, lessons: [], sacrifices: [] };
}
