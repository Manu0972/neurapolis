/**
 * Données de l'Atelier de la Friche (J5) — projet économique avec Karim Bensalah.
 * Respecte les lois de l'architecture : données pures interprétées par le moteur.
 * Modèle : pièces de récupération, usure des outils, grille tarifaire (solidaire / standard / soutien),
 * comptabilité en partie double et fonds solidaire.
 */
import type { NpcId, RepairOrder, SolidarityTariff } from '../core/types';
export type { RepairOrder };

export const WORKSHOP_CONFIG = {
  id: 'atelier_friche' as const,
  partner: 'karim' as const,
  initialPartsStock: 4,          // pièces de départ trouvées dans la friche
  initialToolCondition: 100,      // outils neufs / révisés (100 %)
  defaultSolidarityRate: 0.20,    // 20 % des revenus bruts réservés au fonds solidaire
  partsBatchUnits: 6,            // unités achetées par lot de récupération
  partsBatchCost: 12,            // 12 € pour 6 pièces (2 €/pièce)
  maintenanceCost: 8,            // 8 € pour réviser et affûter les outils
  minToolConditionForRepair: 20, // en dessous de 20 %, les outils sont trop usés
  scavengeDurationMinutes: 60,   // 1 h de fouille dans les décombres de la friche
  repairDurationMinutes: 60,     // 1 h par réparation
  minRelationKarim: 20,          // relation requise avec Karim pour ouvrir l'atelier
} as const;

export interface TariffDetail {
  id: SolidarityTariff;
  label: string;
  multiplier: number;
  description: string;
  reputationBonus: number;
  clientRelBonus: number;
  solidarityContributionFactor: number;
}

export const TARIFF_GRID: Record<SolidarityTariff, TariffDetail> = {
  solidaire: {
    id: 'solidaire',
    label: 'Solidaire (−30 %)',
    multiplier: 0.70,
    description: 'Rabais destiné aux habitants précaires. Renforce la cohésion et l’amitié.',
    reputationBonus: 2,
    clientRelBonus: 6,
    solidarityContributionFactor: 0.10,
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    multiplier: 1.00,
    description: 'Tarif d’équilibre pour le travail et les pièces.',
    reputationBonus: 1,
    clientRelBonus: 3,
    solidarityContributionFactor: 0.20,
  },
  soutien: {
    id: 'soutien',
    label: 'Soutien (+35 %)',
    multiplier: 1.35,
    description: 'Tarif majoré pour les commerces et institutions, finançant la caisse solidaire.',
    reputationBonus: 1,
    clientRelBonus: 1,
    solidarityContributionFactor: 0.35,
  },
};

export interface CatalogOrderTemplate {
  templateId: string;
  clientNpc: NpcId;
  clientName: string;
  item: string;
  description: string;
  difficulty: 1 | 2 | 3;
  partsRequired: number;
  basePrice: number;
}

export const CATALOG_ORDERS: readonly CatalogOrderTemplate[] = [
  {
    templateId: 'order_bertin_toaster',
    clientNpc: 'bertin',
    clientName: 'Mme Bertin',
    item: 'Grille-pain du comptoir',
    description: 'Résistance coupée et levier bloqué. Indispensable pour ses tartines du matin.',
    difficulty: 1,
    partsRequired: 1,
    basePrice: 10,
  },
  {
    templateId: 'order_noah_velo',
    clientNpc: 'noah',
    clientName: 'Noah',
    item: 'Vélo de course Mercier',
    description: 'Dérailleur tordu et chaîne sautée après un saut sur la rampe.',
    difficulty: 2,
    partsRequired: 2,
    basePrice: 18,
  },
  {
    templateId: 'order_monique_radio',
    clientNpc: 'monique',
    clientName: 'Monique',
    item: 'Poste de radio vintage à lampes',
    description: 'Le son grésille et le potentiomètre de fréquence tourne dans le vide.',
    difficulty: 2,
    partsRequired: 2,
    basePrice: 20,
  },
  {
    templateId: 'order_moreau_projecteur',
    clientNpc: 'moreau',
    clientName: 'M. Moreau',
    item: 'Rétroprojecteur du collège',
    description: 'Ventilateur encrassé et miroir décalé. Le collège n’a pas le budget pour du neuf.',
    difficulty: 3,
    partsRequired: 3,
    basePrice: 32,
  },
  {
    templateId: 'order_yasmine_singer',
    clientNpc: 'yasmine',
    clientName: 'Yasmine',
    item: 'Machine à coudre Singer',
    description: 'La canette bloque et la courroie patine. Elle en a besoin pour ses retouches.',
    difficulty: 2,
    partsRequired: 2,
    basePrice: 22,
  },
  {
    templateId: 'order_samir_perceuse',
    clientNpc: 'samir',
    clientName: 'Samir',
    item: 'Perceuse à colonne Taret',
    description: 'Moteur triphasé déséquilibré récupéré de l’ancienne ligne de production.',
    difficulty: 3,
    partsRequired: 3,
    basePrice: 30,
  },
  {
    templateId: 'order_lina_lampe',
    clientNpc: 'lina',
    clientName: 'Lina',
    item: 'Lampe d’architecte articulée',
    description: 'Ressort détendu et douille court-circuitée. Elle dessine dans le noir.',
    difficulty: 1,
    partsRequired: 1,
    basePrice: 12,
  },
  {
    templateId: 'order_karim_compresseur',
    clientNpc: 'karim',
    clientName: 'Karim',
    item: 'Compresseur d’établi',
    description: 'Joint de culasse fuyard et soupape encrassée. Outil clé pour l’atelier.',
    difficulty: 3,
    partsRequired: 3,
    basePrice: 34,
  },
  {
    templateId: 'order_bertin_balance',
    clientNpc: 'bertin',
    clientName: 'Mme Bertin',
    item: 'Balance mécanique Roberval',
    description: 'Couteaux émoussés et fléau faussé. Les clients se plaignent du poids.',
    difficulty: 2,
    partsRequired: 2,
    basePrice: 24,
  },
  {
    templateId: 'order_noah_trottinette',
    clientNpc: 'noah',
    clientName: 'Noah',
    item: 'Trottinette freestyle',
    description: 'Roulements à billes pleins de gravier et guidon avec du jeu.',
    difficulty: 1,
    partsRequired: 1,
    basePrice: 14,
  },
];
