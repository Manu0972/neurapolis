/**
 * Famille et collège (vision du 2026-10-07) : de vrais parents, Nora et Thierry, inquiets,
 * fiers, parfois fâchés ; des cours où il faut aller ; des absences qui se paient ; des
 * arrangements possibles avec le principal. Save v20.
 * Les répliques reprennent l'interface confiée à Antigravity (src/data/story/family.ts).
 */

export type ParentId = 'nora' | 'thierry';
export type FamilyMoment =
  | 'diner' | 'absence' | 'convocation' | 'bonne_note' | 'mauvaise_note' | 'reussite_business'
  | 'echec_business' | 'fatigue' | 'nuit_blanche' | 'anniversaire';

export interface FamilyLine {
  id: string;
  speaker: ParentId | 'les_deux';
  when: FamilyMoment;
  mood: 'fier' | 'inquiet' | 'fache' | 'tendre' | 'espoir';
  text: string;
  replies: { label: string; effect: { trust: number; worry: number; pride: number }; answer: string }[];
}

export interface ParentState {
  /** Confiance qu'il ou elle te fait (0-100). */
  trust: number;
  /** Inquiétude (0-100). */
  worry: number;
  /** Fierté (0-100). */
  pride: number;
}

export type SessionId = 'matin' | 'apres';

export interface Absence {
  day: number;
  session: SessionId;
  excused: boolean;
}

export interface Grade {
  day: number;
  subject: string;
  note: number;
}

export interface Convocation {
  day: number;
  reason: string;
}

export interface Arrangement {
  /** Personne avec qui l'arrangement a été conclu. */
  with: string;
  untilDay: number;
  /** Demi-journées excusées par semaine. */
  perWeek: number;
  /** Moyenne à tenir pour que l'arrangement vaille. */
  minAverage: number;
}

export interface FamilyState {
  parents: Record<ParentId, ParentState>;
  absences: Absence[];
  grades: Grade[];
  /** Cours en cours : séance et tick de sortie. */
  inClass?: { session: SessionId; day: number; untilTick: number; moment: string };
  /** Séances suivies : `${jour}:${séance}`. */
  attended: string[];
  convocation?: Convocation;
  arrangement?: Arrangement;
  /** Promesse faite au principal ou aux parents : la prochaine absence coûtera cher. */
  promised: boolean;
  /** Puni : rentrer avant 18 h jusqu'à ce jour. */
  groundedUntil: number;
  /** Dîner qui attend le joueur (id de réplique). */
  pendingDinner?: string;
  lastDinnerDay: number;
  /** Ce qui s'est passé depuis le dernier dîner (pour choisir la réplique). */
  topics: FamilyMoment[];
}

export function createFamilyState(): FamilyState {
  return {
    parents: { nora: { trust: 62, worry: 35, pride: 55 }, thierry: { trust: 55, worry: 45, pride: 50 } },
    absences: [], grades: [], attended: [], promised: false, groundedUntil: -1, lastDinnerDay: -1, topics: [],
  };
}
