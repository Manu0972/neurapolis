/**
 * La chambre, quartier général (vision du 2026-10-07) : des objets gagnés en avançant, qui
 * changent la pièce et apportent un petit avantage ; un tableau de plans pour préparer ses
 * prochains business (objectif → besoins → manques → exécution). Save v21.
 * `RoomItem` reprend l'interface confiée à Antigravity (src/data/room/items.ts).
 */

export interface RoomItem {
  id: string;
  name: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  how: string;
  lore: string;
  bonus?: { kind: 'stress' | 'negociation' | 'organisation' | 'recherche' | 'chance' | 'plan'; value: number };
}

export interface Plan {
  id: string;
  /** Idée de l'Ascension visée. */
  ideaId: string;
  createdDay: number;
}

export interface RoomState {
  /** Objet → jour où il est arrivé dans la chambre. */
  owned: Record<string, number>;
  plans: Plan[];
  seq: number;
}

export function createRoomState(): RoomState {
  return { owned: { photo_lucien: 0 }, plans: [], seq: 0 };
}
