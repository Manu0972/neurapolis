/**
 * Ligne 1 des bus du Taret : une boucle qui relie le centre, l'avenue Jean-Jaurès et la Gare.
 * Les arrêts sont posés sur le trottoir à l'angle des grands carrefours (trame `layout.ts`).
 */
import { isWalkable, surfaceAt } from '../map';

export interface BusStop {
  id: string;
  name: string;
  /** Tuile du trottoir où l'on attend le bus. */
  x: number;
  y: number;
}

const VX = [0, 82, 164, 246, 322, 406] as const;
const HY = [0, 80, 160, 242] as const;
const ROAD = 8;

/** Ordre de la boucle : indices (colonne, rangée) de la trame. */
const ROUTE: { id: string; name: string; c: number; r: number }[] = [
  { id: 'jaures_croizat', name: 'Jaurès – Croizat', c: 1, r: 1 },
  { id: 'marche', name: 'Place du Marché', c: 2, r: 1 },
  { id: 'jaures_michel', name: 'Jaurès – Louise-Michel', c: 3, r: 1 },
  { id: 'boulevard_est', name: 'Boulevard de l’Est', c: 4, r: 1 },
  { id: 'gare', name: 'Gare de Val-Ferrand', c: 5, r: 1 },
  { id: 'laminoir', name: 'Laminoir – Forges', c: 5, r: 2 },
  { id: 'forges_michel', name: 'Forges – Louise-Michel', c: 3, r: 2 },
  { id: 'forges_croizat', name: 'Forges – Croizat', c: 1, r: 2 },
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

export const BUS_STOPS: readonly BusStop[] = ROUTE.map((s) => {
  // Angle sud-est du carrefour (sud-ouest pour la dernière colonne, collée au bord est).
  const x = s.c === VX.length - 1 ? VX[s.c]! - 1 : VX[s.c]! + ROAD;
  const y = HY[s.r]! + ROAD;
  return { id: s.id, name: s.name, ...sidewalkNear(x, y) };
});

export const BUS_STOP_BY_ID: Readonly<Record<string, BusStop>> = Object.fromEntries(BUS_STOPS.map((s) => [s.id, s]));
