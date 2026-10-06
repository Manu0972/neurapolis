export interface GroundTile {
  readonly x: number;
  readonly z: number;
}

export type BlockRole = 'mur' | 'toit' | 'sol' | 'entree';

export interface Block3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  readonly h: number;
  readonly d: number;
  readonly role?: BlockRole;
}

export interface World3D {
  readonly ground: readonly GroundTile[];
  readonly blocks: readonly Block3D[];
}
