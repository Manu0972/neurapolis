// src/rendering/WorldRenderer.ts
import type { World3D } from './world3d';

export interface WorldRenderer {
  /** Initialise les ressources graphiques, contextes WebGL et shaders */
  init(container: HTMLElement): void;
  
  /** Met à jour et dessine la scène 3D isométrique */
  render(world: World3D, width: number, height: number, now: number): void;
  
  /** Nettoie proprement la mémoire et les contextes graphiques */
  dispose(): void;
}