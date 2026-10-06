/**
 * Économie « Big Ambitions » de NEURAPOLIS — contrats de données et d'état.
 * Voir docs/VISION.md §4. Les définitions (Def) sont des données pures dans src/data/economy/ ;
 * l'état (State) vit dans WorldState.economy et se sauvegarde (save v12+).
 *
 * Unités : argent en euros (2 décimales), surfaces en m², temps en jours de jeu (dayIndexOf)
 * et en heures (0-24). Aucune fonction dans les données : le moteur interprète.
 */
import type { LedgerEntry, NpcId } from './types';

// ---------- Définitions (données) ----------

export type ProductCategory =
  | 'epicerie'      // conserves, pâtes, riz, biscuits
  | 'frais'         // fruits, légumes, produits laitiers
  | 'boisson'
  | 'boulangerie'
  | 'snack'
  | 'cafe'          // boissons préparées sur place
  | 'livre'
  | 'papeterie'
  | 'vetement'
  | 'fleur'
  | 'velo'          // pièces et accessoires
  | 'service';      // réparation, prestation (pas de stock physique)

export type StorageKind = 'ambiant' | 'froid';

export interface ProductDef {
  id: string;
  name: string;
  category: ProductCategory;
  /** Unité de vente affichée (« pièce », « kg », « tasse »). */
  unit: string;
  /** Prix d'achat de gros de référence, par unité. */
  wholesaleBase: number;
  /** Prix de vente « juste » perçu par les clients du quartier. */
  retailRef: number;
  /** Durée de conservation en jours ; null = ne périme pas. */
  shelfLifeDays: number | null;
  storage: StorageKind;
  /** 12 multiplicateurs de demande (janvier → décembre), 1 = normal. Optionnel. */
  seasonality?: readonly number[];
}

export interface WholesalerDef {
  id: string;
  name: string;
  /** Adresse dans le monde (texte) — le lieu physique est dans src/data/city/. */
  address: string;
  productIds: readonly string[];
  /** Multiplicateur appliqué à wholesaleBase (0.85 = 15 % moins cher que la référence). */
  priceMult: number;
  /** Commande minimale en euros. */
  minOrder: number;
  /** Délai de livraison en jours (0 = le jour même, à retirer soi-même). */
  deliveryDays: number;
  deliveryFee: number;
  /** Probabilité qu'une livraison arrive à l'heure (0-1). */
  reliability: number;
  /** Âge minimal pour ouvrir un compte (12 = accessible dès le début). */
  minAge: number;
}

export type FurnitureCategory =
  | 'rayonnage' | 'frigo' | 'caisse' | 'comptoir' | 'table' | 'machine' | 'deco' | 'stockage';

export interface FurnitureDef {
  id: string;
  name: string;
  category: FurnitureCategory;
  cost: number;
  /** Surface au sol occupée. */
  footprintM2: number;
  /** Unités de produit stockables/exposables. */
  capacityUnits?: number;
  /** Type de conservation offert par ce meuble (rayonnage = ambiant, frigo = froid). */
  storage?: StorageKind;
  /** Catégories de produits que ce meuble peut exposer. */
  productCategories?: readonly ProductCategory[];
  /** Clients servis par heure (caisses, comptoirs, machines à café). */
  servicePerHour?: number;
  /** Places assises (cafés). */
  seats?: number;
  /** Bonus d'attractivité de la boutique (0-10). */
  appeal?: number;
}

export interface BusinessTypeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Âge minimal (avant co-signature). Le mode bac à sable ignore cette contrainte. */
  minAge: number;
  productCategories: readonly ProductCategory[];
  /** Au moins un meuble de chaque catégorie listée est requis pour ouvrir. */
  requiredFurniture: readonly FurnitureCategory[];
  /** Part des passants qui entrent quand tout est « juste » (0-1). */
  baseConversion: number;
  /** Nombre moyen d'articles par client. */
  basketSize: number;
  /** Horaires par défaut [ouverture, fermeture] en heures. */
  defaultHours: readonly [number, number];
}

export type CityDistrict = 'roses' | 'centre' | 'canal' | 'friche' | 'gare' | 'hyperval';

/** Un local commercial vacant ou occupé — un « lot » de Big Ambitions. Données de la ville. */
export interface CommercialUnitDef {
  id: string;
  /** « 12 avenue Jean-Jaurès » */
  address: string;
  street: string;
  district: CityDistrict;
  sizeM2: number;
  /** Loyer journalier de référence (avant ajustement de marché). */
  baseRentPerDay: number;
  /** Passants par heure à l'heure de pointe devant la vitrine. */
  footTraffic: number;
  /** Tuile d'entrée (porte) dans la grille de la ville. */
  door: { x: number; y: number };
  /** Bâtiment hôte (identifiant de src/data/city). */
  buildingId: string;
}

// ---------- État (sauvegardé) ----------

export interface StockLot {
  qty: number;
  /** Jour d'arrivée — sert au calcul de la péremption. */
  receivedDay: number;
  unitCost: number;
}

export interface DayStats {
  day: number;
  passersby: number;
  visitors: number;
  customers: number;
  /** Clients repartis sans acheter (rupture, prix, attente). */
  lost: number;
  unitsSold: number;
  revenue: number;
  costOfGoods: number;
  wages: number;
  rent: number;
  other: number;
}

export interface BusinessState {
  id: string;
  name: string;
  typeId: string;
  unitId: string;
  openedDay: number;
  /** Le joueur peut fermer temporairement (vacances, travaux). */
  open: boolean;
  hours: [number, number];
  /** Prix de vente choisis par le joueur, par produit. */
  prices: Record<string, number>;
  stock: Record<string, StockLot[]>;
  /** Identifiants de FurnitureDef installés (un par exemplaire). */
  furniture: string[];
  employeeIds: string[];
  /** Caisse de l'entreprise (séparée de l'argent personnel). */
  cash: number;
  ledger: LedgerEntry[];
  today: DayStats;
  history: DayStats[];
  /** Réputation de la boutique (0-100), nourrie par la satisfaction des clients. */
  reputation: number;
  /** Jours restants de campagnes marketing actives, par canal. */
  marketing: Record<string, number>;
}

export interface LeaseState {
  unitId: string;
  startDay: number;
  rentPerDay: number;
  deposit: number;
  /** Co-signataire du bail quand le joueur est mineur (Vision §4.2). */
  coSigner: NpcId | 'parent' | null;
  /** Jours de loyer impayés consécutifs (3 = expulsion). */
  arrears: number;
}

export type EmployeeRole = 'vendeur' | 'caissier' | 'barista' | 'gerant' | 'livreur';

export interface EmployeeState {
  id: string;
  name: string;
  age: number;
  role: EmployeeRole;
  /** Compétence 0-100 : vitesse de service et qualité. */
  skill: number;
  /** Salaire horaire brut demandé. */
  wage: number;
  /** 0-100 : en dessous de 25, démission probable. */
  satisfaction: number;
  businessId: string | null;
  hiredDay: number | null;
}

export interface LoanState {
  id: string;
  principal: number;
  remaining: number;
  /** Taux annuel en pourcentage. */
  ratePct: number;
  dailyPayment: number;
  startDay: number;
  termDays: number;
}

export interface PendingOrder {
  id: string;
  businessId: string;
  wholesalerId: string;
  lines: { productId: string; qty: number; unitCost: number }[];
  orderDay: number;
  arrivalDay: number;
  total: number;
}

export interface EconomyState {
  /** Mode bac à sable : ignore les âges minimaux (option de création de partie). */
  sandbox: boolean;
  leases: Record<string, LeaseState>;
  businesses: Record<string, BusinessState>;
  employees: Record<string, EmployeeState>;
  /** Candidats visibles sur le site d'emploi, renouvelés chaque lundi. */
  jobMarket: { refreshedDay: number; candidateIds: string[] };
  loans: LoanState[];
  orders: PendingOrder[];
  /** Compteur monotone pour fabriquer des identifiants stables. */
  nextId: number;
}
