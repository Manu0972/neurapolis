/**
 * Point d'entrée unique des catalogues économiques : base (Claude) + étendu (Antigravity).
 * Le moteur ne lit les définitions que par ce module.
 */
import type { BusinessTypeDef, FurnitureDef, ProductDef, WholesalerDef } from '../../core/economy_types';
import { BASE_BUSINESS_TYPES, BASE_FURNITURE, BASE_PRODUCTS, BASE_WHOLESALERS, PICKUP_BUILDINGS as BASE_PICKUPS } from './base_catalog';
import { EXTENDED_BUSINESS_TYPES, EXTENDED_FURNITURE, EXTENDED_PRODUCTS, EXTENDED_WHOLESALERS } from './catalog_extended';

export { STALL_IMPLICIT } from './base_catalog';

export const PRODUCTS: readonly ProductDef[] = [...BASE_PRODUCTS, ...EXTENDED_PRODUCTS];
export const WHOLESALERS: readonly WholesalerDef[] = [...BASE_WHOLESALERS, ...EXTENDED_WHOLESALERS];
export const FURNITURE: readonly FurnitureDef[] = [...BASE_FURNITURE, ...EXTENDED_FURNITURE];
export const BUSINESS_TYPES: readonly BusinessTypeDef[] = [...BASE_BUSINESS_TYPES, ...EXTENDED_BUSINESS_TYPES];

/**
 * Où retirer physiquement les commandes « à retirer » (livraison en 0 jour) : bâtiment dont on
 * rejoint la porte. Les pièces de vélo de Karim se retirent à l'atelier de la Friche.
 */
export const PICKUP_BUILDINGS: Readonly<Record<string, string>> = {
  ...BASE_PICKUPS,
  grossiste_cycles_karim_pieces: 'atelier_friche',
};

const byId = <T extends { id: string }>(xs: readonly T[]): Readonly<Record<string, T>> =>
  Object.fromEntries(xs.map((x) => [x.id, x]));

export const PRODUCT_BY_ID = byId(PRODUCTS);
export const WHOLESALER_BY_ID = byId(WHOLESALERS);
export const FURNITURE_BY_ID = byId(FURNITURE);
export const BUSINESS_TYPE_BY_ID = byId(BUSINESS_TYPES);
