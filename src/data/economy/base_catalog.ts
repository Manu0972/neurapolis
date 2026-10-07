/**
 * Catalogue économique de base (indispensable au jeu dès 12 ans) : goûters et épicerie,
 * fournisseurs du quartier, mobilier simple, étal de marché et épicerie de quartier.
 * Le catalogue étendu d'Antigravity (catalog_extended.ts) s'y ajoute via index.ts.
 * Préfixes réservés ici : p_ (produits), g_ (grossistes), f_ (meubles), t_ (types).
 */
import type { BusinessTypeDef, FurnitureDef, ProductDef, WholesalerDef } from '../../core/economy_types';

const S = (summer: number, winter: number): number[] =>
  // Janvier → décembre : pic d'été `summer`, creux/pic d'hiver `winter`.
  [winter, winter, 1, 1, 1.05, summer, summer, summer, 1, 1, winter, winter];

export const BASE_PRODUCTS: readonly ProductDef[] = [
  { id: 'p_gouter_biscuits', name: 'Biscuits maison (sachet)', category: 'snack', unit: 'sachet', wholesaleBase: 0.6, retailRef: 1.5, shelfLifeDays: 10, storage: 'ambiant' },
  { id: 'p_crepe', name: 'Crêpe au sucre', category: 'snack', unit: 'pièce', wholesaleBase: 0.35, retailRef: 1.2, shelfLifeDays: 1, storage: 'ambiant', seasonality: S(0.9, 1.25) },
  { id: 'p_gaufre', name: 'Gaufre de Val-Ferrand', category: 'snack', unit: 'pièce', wholesaleBase: 0.45, retailRef: 1.6, shelfLifeDays: 2, storage: 'ambiant', seasonality: S(0.95, 1.2) },
  { id: 'p_bonbons', name: 'Sachet de bonbons', category: 'snack', unit: 'sachet', wholesaleBase: 0.4, retailRef: 1.0, shelfLifeDays: 180, storage: 'ambiant' },
  { id: 'p_chips', name: 'Chips (petit paquet)', category: 'snack', unit: 'paquet', wholesaleBase: 0.35, retailRef: 0.9, shelfLifeDays: 120, storage: 'ambiant' },
  { id: 'p_jus_pomme', name: 'Jus de pomme (25 cl)', category: 'boisson', unit: 'bouteille', wholesaleBase: 0.45, retailRef: 1.2, shelfLifeDays: 90, storage: 'froid', seasonality: S(1.35, 0.85) },
  { id: 'p_limonade', name: 'Limonade de la vallée (33 cl)', category: 'boisson', unit: 'canette', wholesaleBase: 0.5, retailRef: 1.4, shelfLifeDays: 180, storage: 'froid', seasonality: S(1.5, 0.75) },
  { id: 'p_eau', name: 'Eau minérale (50 cl)', category: 'boisson', unit: 'bouteille', wholesaleBase: 0.2, retailRef: 0.7, shelfLifeDays: 365, storage: 'ambiant', seasonality: S(1.6, 0.8) },
  { id: 'p_pomme', name: 'Pomme du Taret', category: 'frais', unit: 'pièce', wholesaleBase: 0.18, retailRef: 0.45, shelfLifeDays: 12, storage: 'ambiant', seasonality: [1, 1, 0.9, 0.8, 0.7, 0.7, 0.8, 1, 1.3, 1.3, 1.2, 1.1] },
  { id: 'p_banane', name: 'Banane', category: 'frais', unit: 'pièce', wholesaleBase: 0.15, retailRef: 0.4, shelfLifeDays: 6, storage: 'ambiant' },
  { id: 'p_lait', name: 'Lait demi-écrémé (1 L)', category: 'frais', unit: 'bouteille', wholesaleBase: 0.62, retailRef: 1.1, shelfLifeDays: 8, storage: 'froid' },
  { id: 'p_yaourt', name: 'Yaourts nature (×4)', category: 'frais', unit: 'pack', wholesaleBase: 0.85, retailRef: 1.6, shelfLifeDays: 14, storage: 'froid' },
  { id: 'p_pain', name: 'Pain de mie', category: 'boulangerie', unit: 'paquet', wholesaleBase: 0.75, retailRef: 1.5, shelfLifeDays: 6, storage: 'ambiant' },
  { id: 'p_pates', name: 'Pâtes (500 g)', category: 'epicerie', unit: 'paquet', wholesaleBase: 0.55, retailRef: 1.1, shelfLifeDays: 540, storage: 'ambiant' },
  { id: 'p_riz', name: 'Riz long (1 kg)', category: 'epicerie', unit: 'paquet', wholesaleBase: 0.95, retailRef: 1.9, shelfLifeDays: 540, storage: 'ambiant' },
  { id: 'p_conserve', name: 'Haricots verts (conserve)', category: 'epicerie', unit: 'boîte', wholesaleBase: 0.6, retailRef: 1.3, shelfLifeDays: 720, storage: 'ambiant' },
  { id: 'p_cafe_moulu', name: 'Café moulu (250 g)', category: 'epicerie', unit: 'paquet', wholesaleBase: 1.6, retailRef: 3.2, shelfLifeDays: 365, storage: 'ambiant' },
  { id: 'p_cafe_tasse', name: 'Café noir', category: 'cafe', unit: 'tasse', wholesaleBase: 0.25, retailRef: 1.4, shelfLifeDays: null, storage: 'ambiant' },
];

export const BASE_WHOLESALERS: readonly WholesalerDef[] = [
  {
    id: 'g_bertin_depannage', name: 'Épicerie Bertin (dépannage)', address: 'Avenue Jean-Jaurès',
    productIds: ['p_gouter_biscuits', 'p_bonbons', 'p_chips', 'p_jus_pomme', 'p_eau', 'p_pomme', 'p_banane', 'p_lait', 'p_pain'],
    priceMult: 1.15, minOrder: 0, deliveryDays: 0, deliveryFee: 0, reliability: 1, minAge: 12,
  },
  {
    id: 'g_cash_hyperval', name: 'Cash HyperVal (libre-service de gros)', address: 'Zone HyperVal',
    productIds: ['p_gouter_biscuits', 'p_bonbons', 'p_chips', 'p_jus_pomme', 'p_limonade', 'p_eau', 'p_lait', 'p_yaourt', 'p_pain', 'p_pates', 'p_riz', 'p_conserve', 'p_cafe_moulu', 'p_banane'],
    priceMult: 0.86, minOrder: 60, deliveryDays: 0, deliveryFee: 0, reliability: 1, minAge: 12,
  },
  {
    id: 'g_docks_canal', name: 'Docks du canal — grossiste alimentaire', address: 'Quai de la Malterie',
    productIds: ['p_pates', 'p_riz', 'p_conserve', 'p_cafe_moulu', 'p_eau', 'p_limonade', 'p_jus_pomme', 'p_chips', 'p_bonbons', 'p_cafe_tasse'],
    priceMult: 0.78, minOrder: 150, deliveryDays: 2, deliveryFee: 18, reliability: 0.92, minAge: 16,
  },
  {
    id: 'g_coop_vallee', name: 'Coopérative paysanne de la Vallée du Taret', address: 'Route du Taret',
    productIds: ['p_pomme', 'p_lait', 'p_yaourt', 'p_crepe', 'p_gaufre', 'p_pain'],
    priceMult: 0.9, minOrder: 30, deliveryDays: 1, deliveryFee: 6, reliability: 0.88, minAge: 12,
  },
];

/** Où retirer physiquement les commandes « à retirer » : bâtiment dont on rejoint la porte. */
export const PICKUP_BUILDINGS: Readonly<Record<string, string>> = {
  g_bertin_depannage: 'epicerie',
  g_cash_hyperval: 'drive_hyperval',
};

export const BASE_FURNITURE: readonly FurnitureDef[] = [
  { id: 'f_rayonnage', name: 'Rayonnage métallique', category: 'rayonnage', cost: 180, footprintM2: 2, capacityUnits: 120, storage: 'ambiant', productCategories: ['epicerie', 'snack', 'boisson', 'boulangerie', 'frais', 'papeterie', 'livre'], appeal: 1 },
  { id: 'f_cagettes', name: 'Présentoir à cagettes', category: 'rayonnage', cost: 90, footprintM2: 2, capacityUnits: 70, storage: 'ambiant', productCategories: ['frais', 'fleur'], appeal: 2 },
  { id: 'f_frigo', name: 'Réfrigérateur vitré', category: 'frigo', cost: 450, footprintM2: 1.5, capacityUnits: 80, storage: 'froid', productCategories: ['boisson', 'frais'], appeal: 1 },
  { id: 'f_caisse', name: 'Caisse enregistreuse', category: 'caisse', cost: 150, footprintM2: 1.5, servicePerHour: 30 },
  { id: 'f_comptoir', name: 'Comptoir en bois', category: 'comptoir', cost: 240, footprintM2: 3, servicePerHour: 22, appeal: 1 },
  { id: 'f_table', name: 'Table et quatre chaises', category: 'table', cost: 140, footprintM2: 3, seats: 4, appeal: 1 },
  { id: 'f_machine_cafe', name: 'Machine à café professionnelle', category: 'machine', cost: 950, footprintM2: 1, servicePerHour: 30, productCategories: ['cafe'] },
  { id: 'f_plante', name: 'Grande plante verte', category: 'deco', cost: 45, footprintM2: 0.5, appeal: 2 },
  { id: 'f_ardoise', name: 'Ardoise des prix', category: 'deco', cost: 25, footprintM2: 0.2, appeal: 1 },
  { id: 'f_reserve', name: 'Étagères de réserve', category: 'stockage', cost: 120, footprintM2: 3, capacityUnits: 220, storage: 'ambiant' },
];

export const BASE_BUSINESS_TYPES: readonly BusinessTypeDef[] = [
  {
    id: 't_etal_marche', name: 'Étal de marché', icon: '🧺',
    description: 'Un emplacement loué à la journée sur la place du Marché. Équipé d’origine : il suffit d’apporter la marchandise et d’être là pour vendre.',
    minAge: 12, productCategories: ['snack', 'boisson', 'frais', 'boulangerie', 'epicerie'], requiredFurniture: [],
    baseConversion: 0.07, basketSize: 1.6, defaultHours: [8, 13],
  },
  {
    id: 't_epicerie_quartier', name: 'Épicerie de quartier', icon: '🛒',
    description: 'Le commerce de proximité : produits du quotidien, frais et boissons. Il faut des rayonnages, un frigo pour le frais et une caisse.',
    minAge: 16, productCategories: ['epicerie', 'frais', 'boisson', 'snack', 'boulangerie'], requiredFurniture: ['rayonnage', 'caisse'],
    baseConversion: 0.09, basketSize: 3.4, defaultHours: [8, 20],
  },
  {
    id: 't_comptoir_gouter', name: 'Comptoir à goûters', icon: '🧇',
    description: 'Crêpes, gaufres et boissons à emporter, à la sortie du collège.',
    minAge: 14, productCategories: ['snack', 'boisson'], requiredFurniture: ['comptoir'],
    baseConversion: 0.08, basketSize: 1.8, defaultHours: [10, 19],
  },
];

/** L'étal du marché est équipé d'office : capacité et service implicites. */
export const STALL_IMPLICIT = { capacityUnits: 90, servicePerHour: 26, appeal: 1 } as const;
