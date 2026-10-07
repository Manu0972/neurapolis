// src/rendering/world3d.ts
/**
 * Contrat de données pur pour l'interopérabilité 3D (J3D-1 & J3D-2).
 * Ne dépend ni de Three.js, ni du DOM, ni de la simulation.
 */

export interface GroundTile {
  readonly x: number;
  readonly z: number;
  readonly kind?: string;
}

export interface Block3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  readonly h: number;
  readonly d: number;
  readonly role?: 'mur' | 'toit' | 'sol' | 'entree' | 'linteau';
  readonly placeId?: string;
}

export interface World3D {
  readonly ground: readonly GroundTile[];
  readonly blocks: readonly Block3D[];
}
