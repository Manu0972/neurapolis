import type { StrategicMapDef, StrategicMapTier } from './types';
import { VALLEE_MAP } from './vallee';
import { PAYS_MAP } from './pays';
import { MONDE_MAP } from './monde';

export * from './types';
export { VALLEE_MAP } from './vallee';
export { PAYS_MAP } from './pays';
export { MONDE_MAP } from './monde';

export const STRATEGIC_MAPS: readonly StrategicMapDef[] = [
  VALLEE_MAP,
  PAYS_MAP,
  MONDE_MAP,
];

export const STRATEGIC_MAP_BY_TIER: Readonly<Record<StrategicMapTier, StrategicMapDef>> = {
  4: VALLEE_MAP,
  5: PAYS_MAP,
  6: MONDE_MAP,
};
