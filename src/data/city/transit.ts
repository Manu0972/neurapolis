/**
 * Bus du Taret (TVT, Transports de la Vallée du Taret) : trois lignes en boucle.
 *  - Ligne 1 « Centre » : centre, avenue Jean-Jaurès, Gare, rue des Forges (la ligne historique).
 *  - Ligne 2 « Rive Sud » : passe le pont de la Malterie, Berges, Grand Ensemble, Hôpital,
 *    Lycée, Stade, et revient par le pont des Écluses.
 *  - Ligne 3 « Vallée » : Gare Est, Grossistes, HyperVal, zone industrielle, Hauts du Taret,
 *    Belvédère, pont de Néo-Baie, Faubourg, Friche Sud, Bellevue.
 * Correspondances aux arrêts partagés (Gare, Laminoir, Forges – Louise-Michel).
 * Les arrêts sont posés sur le trottoir à l'angle d'un carrefour de la trame (`layout.ts`).
 */
import { isWalkable, surfaceAt } from '../map';

export interface BusStop {
  id: string;
  name: string;
  /** Tuile du trottoir où l'on attend le bus. */
  x: number;
  y: number;
  /** Lignes qui desservent l'arrêt. */
  lines: string[];
}

export interface BusLine {
  id: string;
  name: string;
  /** Couleur de la livrée et de la pastille. */
  color: string;
  /** Arrêts dans l'ordre de la boucle. */
  stops: string[];
  /** Tracé : carrefours (coin nord-ouest de l'intersection, en mètres) dans l'ordre, boucle fermée. */
  path: { x: number; y: number }[];
}

const ROAD = 8;

interface StopDef { id: string; name: string; vx: number; hy: number; corner?: 'se' | 'sw' }

const STOP_DEFS: StopDef[] = [
  // Ligne 1 (inchangée).
  { id: 'jaures_croizat', name: 'Jaurès – Croizat', vx: 82, hy: 80 },
  { id: 'marche', name: 'Place du Marché', vx: 164, hy: 80 },
  { id: 'jaures_michel', name: 'Jaurès – Louise-Michel', vx: 246, hy: 80 },
  { id: 'boulevard_est', name: 'Boulevard de l’Est', vx: 322, hy: 80 },
  { id: 'gare', name: 'Gare de Val-Ferrand', vx: 406, hy: 80, corner: 'sw' },
  { id: 'laminoir', name: 'Laminoir – Forges', vx: 406, hy: 160, corner: 'sw' },
  { id: 'forges_michel', name: 'Forges – Louise-Michel', vx: 246, hy: 160 },
  { id: 'forges_croizat', name: 'Forges – Croizat', vx: 82, hy: 160 },
  // Ligne 2.
  { id: 'quai_malterie', name: 'Quai Sud – Brasserie', vx: 164, hy: 266 },
  { id: 'allende', name: 'Salvador-Allende', vx: 164, hy: 426 },
  { id: 'roses_sud', name: 'Grand Ensemble des Roses Sud', vx: 322, hy: 586 },
  { id: 'hopital', name: 'Hôpital de Val-Ferrand', vx: 322, hy: 906 },
  { id: 'lycee', name: 'Lycée Louise-Michel', vx: 488, hy: 906 },
  { id: 'stade', name: 'Stade Marcel-Cerdan', vx: 734, hy: 906 },
  { id: 'ecluses', name: 'Rue des Écluses', vx: 734, hy: 586 },
  // Ligne 3.
  { id: 'gare_est', name: 'Gare Est', vx: 488, hy: 80 },
  { id: 'grossistes', name: 'Allée des Grossistes', vx: 652, hy: 80 },
  { id: 'hyperval', name: 'HyperVal', vx: 734, hy: 80 },
  { id: 'taret_industrie', name: 'Zone industrielle du Taret', vx: 898, hy: 80 },
  { id: 'hauts_taret', name: 'Les Hauts du Taret', vx: 1226, hy: 80 },
  { id: 'belvedere', name: 'Belvédère', vx: 1472, hy: 160 },
  { id: 'pont_neobaie', name: 'Pont de Néo-Baie', vx: 1554, hy: 266, corner: 'sw' },
  { id: 'saint_eloi', name: 'Faubourg Saint-Éloi', vx: 1226, hy: 426 },
  { id: 'friche_sud', name: 'Friche Taret Sud', vx: 980, hy: 666 },
  { id: 'bellevue', name: 'Bellevue – Glycines', vx: 980, hy: 986 },
];

/**
 * Tracés : un arrêt par son id, ou un carrefour de passage [vx, hy]. Deux points consécutifs
 * sont toujours sur la même rue (même x ou même y) ; le canal ne se franchit que sur un pont.
 */
type Step = string | [number, number];
const LINE_DEFS: { id: string; name: string; color: string; route: Step[] }[] = [
  {
    id: '1', name: 'Ligne 1 · Centre', color: '#d9533b',
    route: ['jaures_croizat', 'marche', 'jaures_michel', 'boulevard_est', 'gare', 'laminoir', 'forges_michel', 'forges_croizat'],
  },
  {
    id: '2', name: 'Ligne 2 · Rive Sud', color: '#2f7fb5',
    route: [
      'forges_michel', [164, 160], 'quai_malterie', 'allende', [322, 426], 'roses_sud', 'hopital', 'lycee', 'stade', 'ecluses',
      [734, 266], [734, 160], 'laminoir',
    ],
  },
  {
    id: '3', name: 'Ligne 3 · Vallée', color: '#3f9a52',
    route: [
      'gare', 'gare_est', 'grossistes', 'hyperval', 'taret_industrie', 'hauts_taret', [1472, 80], 'belvedere', [1554, 160],
      'pont_neobaie', [1226, 266], 'saint_eloi', [980, 426], 'friche_sud', 'bellevue', [980, 160], 'laminoir',
    ],
  },
];

function sidewalkNear(x0: number, y0: number): { x: number; y: number } {
  for (let r = 0; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = x0 + dx;
        const y = y0 + dy;
        if (isWalkable(x, y) && surfaceAt(x, y) === 'trottoir') return { x, y };
      }
    }
  }
  throw new Error(`Bus : aucun trottoir près de (${x0}, ${y0}).`);
}

const DEF_BY_ID = Object.fromEntries(STOP_DEFS.map((d) => [d.id, d]));

export const BUS_LINES: readonly BusLine[] = LINE_DEFS.map((l) => ({
  id: l.id,
  name: l.name,
  color: l.color,
  stops: l.route.filter((s): s is string => typeof s === 'string'),
  path: l.route.map((s) => (typeof s === 'string' ? { x: DEF_BY_ID[s]!.vx, y: DEF_BY_ID[s]!.hy } : { x: s[0], y: s[1] })),
}));

export const BUS_LINE_BY_ID: Readonly<Record<string, BusLine>> = Object.fromEntries(BUS_LINES.map((l) => [l.id, l]));

export const BUS_STOPS: readonly BusStop[] = STOP_DEFS.map((s) => {
  // Angle sud-est du carrefour (sud-ouest le long d'une rue sans trottoir à l'est).
  const x = s.corner === 'sw' ? s.vx - 1 : s.vx + ROAD;
  const y = s.hy + ROAD;
  return { id: s.id, name: s.name, ...sidewalkNear(x, y), lines: BUS_LINES.filter((l) => l.stops.includes(s.id)).map((l) => l.id) };
});

export const BUS_STOP_BY_ID: Readonly<Record<string, BusStop>> = Object.fromEntries(BUS_STOPS.map((s) => [s.id, s]));

/** Longueur (m) d'un tronçon de boucle, du point `i` au point `j` du tracé, dans le sens de la ligne. */
export function linePathMeters(line: BusLine, i: number, j: number): number {
  const n = line.path.length;
  let m = 0;
  for (let k = i; k !== j; k = (k + 1) % n) {
    const a = line.path[k]!;
    const b = line.path[(k + 1) % n]!;
    m += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  return m;
}

/** Indice d'un arrêt dans le tracé d'une ligne (‑1 s'il n'y est pas). */
export function pathIndexOf(line: BusLine, stopId: string): number {
  const d = DEF_BY_ID[stopId];
  if (!d || !line.stops.includes(stopId)) return -1;
  return line.path.findIndex((p) => p.x === d.vx && p.y === d.hy);
}
