/**
 * NEURAPOLIS — Registre Central des 5 Nouveaux Quartiers et de la Cité des Roses
 */
export * from './types';
export { ROSES_DISTRICT } from './roses';
export { DOCKS_DISTRICT } from './docks';
export { HAUTS_DISTRICT } from './hauts';
export { BASSIN_DISTRICT } from './bassin';
export { CAVES_DISTRICT } from './caves';
export { TRAMWAY_DISTRICT } from './tramway';

import type { ExtendedDistrictId, ExtendedDistrictDef } from './types';
import { ROSES_DISTRICT } from './roses';
import { DOCKS_DISTRICT } from './docks';
import { HAUTS_DISTRICT } from './hauts';
import { BASSIN_DISTRICT } from './bassin';
import { CAVES_DISTRICT } from './caves';
import { TRAMWAY_DISTRICT } from './tramway';

export const DISTRICTS: ExtendedDistrictDef[] = [
  ROSES_DISTRICT,
  DOCKS_DISTRICT,
  HAUTS_DISTRICT,
  BASSIN_DISTRICT,
  CAVES_DISTRICT,
  TRAMWAY_DISTRICT,
];

export const DISTRICT_BY_ID: Record<ExtendedDistrictId, ExtendedDistrictDef> = {
  roses: ROSES_DISTRICT,
  docks: DOCKS_DISTRICT,
  hauts: HAUTS_DISTRICT,
  bassin: BASSIN_DISTRICT,
  caves: CAVES_DISTRICT,
  tramway: TRAMWAY_DISTRICT,
};

/** Alias canonique pour interopérabilité directe avec les suites de tests */
export const CANONICAL_DISTRICTS = DISTRICT_BY_ID;
