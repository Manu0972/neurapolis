/**
 * NEURAPOLIS — Spécifications Spatiales & Territoriales des Quartiers Étendus
 * Conforme à PROJECT.md §1 & Survey 2 §3.
 */
import type { GhostId, NpcId } from '../../core/types';

export type ExtendedDistrictId = 'roses' | 'docks' | 'hauts' | 'bassin' | 'caves' | 'tramway';

export interface PoiDef {
  id: string;
  name: string;
  description: string;
  atmosphere: string;
  systemicRole: string;
  suggestedActivities: string[];
}

export interface ExtendedDistrictDef {
  id: ExtendedDistrictId;
  name: string;
  description: string;
  ambientKelvin: number; // hygge 1800K
  pois: string[];
  poiDetails?: PoiDef[];
  keyNpcs: string[];
  dominantGhosts: GhostId[];
  economicRole: string;
  paletteDescription?: string;
  transitions: Record<string, { targetDistrict: ExtendedDistrictId; targetPoi: string }>;
}
