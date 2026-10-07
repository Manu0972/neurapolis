/**
 * Rythme du temps (préférence du joueur, pas l'état du monde) :
 *  - une allure d'écoulement continu, du temps réel (1 minute de jeu = 1 minute) à ×20 ;
 *  - « les actions prennent du temps » : parler, acheter, travailler, décharger font avancer
 *    l'horloge de leur durée, en accéléré (une courte ellipse), même à l'arrêt.
 * Par défaut : allure lente et actions qui comptent — le temps passe un peu tout seul, et
 * surtout quand on fait quelque chose. Le sommeil, les cours, le bus et les voyages gardent
 * leurs propres ellipses (src/presentation/game.ts).
 * Stocké dans le navigateur (confort de joueur) ; tout est lu avec une valeur de repli.
 */

export interface PaceDef {
  id: PaceId;
  label: string;
  title: string;
  /** Multiplicateur de la vitesse de base (×1 : 1 minute de jeu = 1 seconde). 0 : pause. */
  scale: number;
}

export type PaceId = 'pause' | 'reel' | 'lent' | 'normal' | 'rapide' | 'tres_rapide';

export const PACES: readonly PaceDef[] = [
  { id: 'pause', label: '⏸', title: 'Pause : le temps s’arrête (tes actions le font quand même avancer)', scale: 0 },
  { id: 'reel', label: '🕰', title: 'Temps réel : 1 minute de jeu = 1 vraie minute', scale: 1 / 60 },
  { id: 'lent', label: '▷', title: 'Lent : 1 minute de jeu = 4 secondes', scale: 0.25 },
  { id: 'normal', label: '▶', title: 'Normal : 1 minute de jeu = 1 seconde', scale: 1 },
  { id: 'rapide', label: '▶▶', title: 'Rapide : ×5', scale: 5 },
  { id: 'tres_rapide', label: '▶▶▶', title: 'Très rapide : ×20', scale: 20 },
];

export const PACE_BY_ID: Readonly<Record<PaceId, PaceDef>> = Object.fromEntries(PACES.map((p) => [p.id, p])) as Record<PaceId, PaceDef>;

export interface PacePrefs {
  pace: PaceId;
  /** Les actions font avancer l'horloge de leur durée. */
  tasksTakeTime: boolean;
}

export const DEFAULT_PACE_PREFS: PacePrefs = { pace: 'lent', tasksTakeTime: true };

/** Durée (minutes de jeu) des actions courantes quand « les actions prennent du temps ». */
export const TASK_MINUTES = {
  /** Une conversation (une réplique choisie). */
  parler: 10,
  /** Utiliser un meuble ou un service (manger, acheter, réviser…). */
  meuble: 20,
  /** Une action de compétence (négocier, démarcher, enquêter…). */
  competence: 30,
  /** Une action économique sur place (décharger, retirer des cartons, signer…). */
  economie: 20,
} as const;

/** Vitesse de l'ellipse d'une action : 10 minutes de jeu en ~0,15 s. */
export const TASK_SPEED = 70;

const KEY = 'neurapolis_rythme';

export function parsePacePrefs(raw: string | null | undefined): PacePrefs {
  if (!raw) return { ...DEFAULT_PACE_PREFS };
  try {
    const o = JSON.parse(raw) as Partial<PacePrefs>;
    const pace = o.pace && o.pace in PACE_BY_ID ? o.pace : DEFAULT_PACE_PREFS.pace;
    return { pace, tasksTakeTime: typeof o.tasksTakeTime === 'boolean' ? o.tasksTakeTime : DEFAULT_PACE_PREFS.tasksTakeTime };
  } catch {
    return { ...DEFAULT_PACE_PREFS };
  }
}

export function loadPacePrefs(): PacePrefs {
  try {
    return parsePacePrefs(globalThis.localStorage?.getItem(KEY));
  } catch {
    return { ...DEFAULT_PACE_PREFS };
  }
}

export function savePacePrefs(p: PacePrefs): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(p));
  } catch {
    /* stockage indisponible : la préférence vaut pour la session */
  }
}

/** Minutes de jeu → ticks de 10 minutes (au moins un). */
export function taskTicks(minutes: number): number {
  return Math.max(1, Math.round(minutes / 10));
}

/** Minutes écoulées dans le tick en cours (horloge à la minute), entre 0 et 9. */
export function subMinutes(acc: number, tickMs: number): number {
  if (!(tickMs > 0)) return 0;
  return Math.max(0, Math.min(9, Math.floor((acc / tickMs) * 10)));
}
