import type { TierId } from '../../core/ascension_types';

export type StrategicMapTier = 4 | 5 | 6;

export type LocationType = 'gare' | 'port' | 'ville' | 'marche' | 'usine' | 'hub' | 'centre' | 'finance' | 'medias';

export interface StrategicLocationDef {
  id: string;
  name: string;
  type: LocationType;
  region: string;
  description: string;
  icon: string;
  /** Position relative (0-100) pour le panneau 2D. */
  x: number;
  y: number;
  /** Idées de business associées à ce lieu (ID dans src/data/ascension/ideas.ts). */
  ideas?: string[];
  /** Nécessite au moins une entreprise lancée parmi ces IDs (optionnel). */
  requiresVenture?: string[];
  /** Nécessite un contact débloqué (optionnel). */
  requiresContact?: string[];
}

export interface StrategicConnectionDef {
  from: string;
  to: string;
  kind: 'ferroviaire' | 'maritime' | 'routier' | 'fluvial' | 'aerien';
  label?: string;
}

export interface StrategicRegionDef {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface StrategicMapDef {
  tier: StrategicMapTier;
  id: string;
  name: string;
  subtitle: string;
  scaleLabel: string;
  lore: string;
  regions: readonly StrategicRegionDef[];
  locations: readonly StrategicLocationDef[];
  connections: readonly StrategicConnectionDef[];
}
