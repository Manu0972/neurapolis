/**
 * Point d'entrée unique des catalogues économiques : base (Claude) + étendu (Antigravity).
 * Le moteur ne lit les définitions que par ce module.
 */
import type { BusinessTypeDef, FurnitureDef, ProductDef, WholesalerDef } from '../../core/economy_types';
import { BASE_BUSINESS_TYPES, BASE_FURNITURE, BASE_PRODUCTS, BASE_WHOLESALERS } from './base_catalog';

export { PICKUP_BUILDINGS, STALL_IMPLICIT } from './base_catalog';

// Le catalogue étendu d'Antigravity (catalog_extended.ts) sera ajouté ici dès qu'il
// compilera contre le contrat (voir le tableau, message E → C du 2026-10-07 01:15).
export const PRODUCTS: readonly ProductDef[] = [...BASE_PRODUCTS];
export const WHOLESALERS: readonly WholesalerDef[] = [...BASE_WHOLESALERS];
export const FURNITURE: readonly FurnitureDef[] = [...BASE_FURNITURE];
export const BUSINESS_TYPES: readonly BusinessTypeDef[] = [...BASE_BUSINESS_TYPES];

const byId = <T extends { id: string }>(xs: readonly T[]): Readonly<Record<string, T>> =>
  Object.fromEntries(xs.map((x) => [x.id, x]));

export const PRODUCT_BY_ID = byId(PRODUCTS);
export const WHOLESALER_BY_ID = byId(WHOLESALERS);
export const FURNITURE_BY_ID = byId(FURNITURE);
export const BUSINESS_TYPE_BY_ID = byId(BUSINESS_TYPES);
