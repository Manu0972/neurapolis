/**
 * NEURAPOLIS — Données statiques des marchands et progression relationnelle.
 */
import type { VendorId, VendorRelationship, VendorTier } from '../core/types';

declare module '../core/types' {
  interface VendorRelationship {
    creditLineLimit: number;
    creditBalance: number;
  }
}

export interface VendorDef {
  id: VendorId;
  name: string;
  npcId?: string;
  role: string;
  location: string;
  description: string;
  tierRequirements: Record<VendorTier, { spent: number; trades: number }>;
  tierBenefits: Record<VendorTier, {
    discountRate: number;
    creditLine?: number;
    title: string;
    description: string;
    perk: string;
  }>;
  specialGoods: Array<{
    id: string;
    name: string;
    cost: number;
    description: string;
    requiredTier: VendorTier;
  }>;
}

export const VENDOR_DEFS: Record<VendorId, VendorDef> = {
  bertin: {
    id: 'bertin',
    name: 'Mme Bertin (Épicerie des Roses)',
    npcId: 'bertin',
    role: 'Épicière historique du quartier',
    location: 'epicerie',
    description: 'Boutique de quartier au cœur des Roses. Madame Bertin soutient les initiatives locales si on lui prouve son sérieux.',
    tierRequirements: {
      0: { spent: 0, trades: 0 },
      1: { spent: 40, trades: 4 },
      2: { spent: 120, trades: 10 },
      3: { spent: 280, trades: 22 },
    },
    tierBenefits: {
      0: {
        discountRate: 0,
        creditLine: 0,
        title: 'Client de passage',
        description: 'Tarif standard sur les confiseries, biscuits et boissons.',
        perk: 'Accès au rayon standard.',
      },
      1: {
        discountRate: 0.05,
        creditLine: 25,
        title: 'Habitué apprécié',
        description: '−5 % sur tous les achats et réservations de lots de goûters. Ligne de crédit de 25 € ouverte.',
        perk: 'Remise 5%, petit réassort prioritaire & crédit 25 €.',
      },
      2: {
        discountRate: 0.12,
        creditLine: 50,
        title: 'Partenaire de confiance',
        description: '−12 % de remise, alerte précoce sur les pénuries. Ligne de crédit étendue à 50 €.',
        perk: 'Remise 12%, approvisionnement en gros & crédit 50 €.',
      },
      3: {
        discountRate: 0.20,
        creditLine: 100,
        title: 'Alliée indéfectible',
        description: '−20 % de remise, circuit court direct et soutien financier solidaire jusqu’à 100 €.',
        perk: 'Remise 20%, avance solidaire & crédit 100 €.',
      },
    },
    specialGoods: [
      { id: 'lot_artisanal_bertin', name: 'Lot Confitures & Biscuits Bio', cost: 18, description: 'Goûters artisanaux haut de gamme avec marge x2.', requiredTier: 1 },
      { id: 'reserve_grossiste_bertin', name: 'Caisse de Réserve Direct Producteur', cost: 45, description: 'Stock massif de 30 portions à coût unitaire imbattable.', requiredTier: 2 },
      { id: 'concession_rayon_bertin', name: 'Corner Dédié dans l’Épicerie', cost: 90, description: 'Point de vente permanent autonome dans la boutique de Mme Bertin.', requiredTier: 3 },
    ],
  },
  karim: {
    id: 'karim',
    name: 'Karim (Récup & Atelier Friche)',
    npcId: 'karim',
    role: 'Bricoleur et recycleur de génie',
    location: 'friche',
    description: 'Atelier partagé de la friche industrielle. Spécialiste de la réparation et du réemploi.',
    tierRequirements: {
      0: { spent: 0, trades: 0 },
      1: { spent: 30, trades: 3 },
      2: { spent: 90, trades: 8 },
      3: { spent: 220, trades: 18 },
    },
    tierBenefits: {
      0: {
        discountRate: 0,
        title: 'Curieux de passage',
        description: 'Tarif standard sur les pièces de récupération.',
        perk: 'Pièces détachées au détail.',
      },
      1: {
        discountRate: 0.06,
        title: 'Compagnon d’établi',
        description: '−6 % sur les pièces détachées et prêt d’outillage spécialisé.',
        perk: 'Remise 6% & outillage renforcé.',
      },
      2: {
        discountRate: 0.14,
        title: 'Artisan associé',
        description: '−14 % de remise, diagnostic rapide sans surcoût et pièces rares.',
        perk: 'Remise 14% & réduction usure outils de 30%.',
      },
      3: {
        discountRate: 0.22,
        title: 'Maître des Communs',
        description: '−22 % de remise, fabrication de pièces sur mesure et automatisation partielle.',
        perk: 'Remise 22% & zéro panne sur la flotte logistique.',
      },
    },
    specialGoods: [
      { id: 'kit_outils_pro', name: 'Coffret Outillage Pro Révisé', cost: 25, description: 'Améliore la vitesse de réparation de 25%.', requiredTier: 1 },
      { id: 'batterie_reconditionnee', name: 'Pack Batteries Reconditionnées', cost: 50, description: 'Double l’autonomie des triporteurs de livraison.', requiredTier: 2 },
      { id: 'etabli_cnc_citoyen', name: 'Établi Numérique Communautaire', cost: 120, description: 'Permet de produire des pièces neuves à partir de plastique recyclé.', requiredTier: 3 },
    ],
  },
  friche_scrap: {
    id: 'friche_scrap',
    name: 'La Recyclerie Industrielle',
    role: 'Collectif de ferrailleurs et réemploi',
    location: 'friche',
    description: 'Dépôt solidaire de matières premières de réemploi (bois, métaux, composants).',
    tierRequirements: {
      0: { spent: 0, trades: 0 },
      1: { spent: 35, trades: 3 },
      2: { spent: 100, trades: 8 },
      3: { spent: 250, trades: 18 },
    },
    tierBenefits: {
      0: { discountRate: 0, title: 'Chineur', description: 'Accès aux bennes tout-venant.', perk: 'Achat de vrac.' },
      1: { discountRate: 0.05, title: 'Trieur averti', description: 'Tri sélectif de qualité supérieure.', perk: 'Matériaux nobles.' },
      2: { discountRate: 0.12, title: 'Fournisseur régulier', description: 'Accès aux arrivages réservés.', perk: 'Lots bradés.' },
      3: { discountRate: 0.20, title: 'Partenaire circulaire', description: 'Matières premières au tarif solidaire minimal.', perk: 'Approvisionnement prioritaire.' },
    },
    specialGoods: [
      { id: 'lot_bois_chene', name: 'Lot Palettes & Chêne Massif', cost: 20, description: 'Matériaux parfaits pour fabriquer étagères et présentoirs.', requiredTier: 1 },
      { id: 'lot_cartes_meres', name: 'Lot Composants Électroniques Triés', cost: 40, description: 'Composants haute fiabilité pour réparations avancées.', requiredTier: 2 },
    ],
  },
  docks_grossiste: {
    id: 'docks_grossiste',
    name: 'Grossiste Fluvial des Docks',
    role: 'Centrale d’importation et logistique lourde',
    location: 'docks',
    description: 'Péniches et entrepôts connectant la métropole régionale. Idéal pour passer à l’échelle.',
    tierRequirements: {
      0: { spent: 0, trades: 0 },
      1: { spent: 60, trades: 4 },
      2: { spent: 180, trades: 12 },
      3: { spent: 450, trades: 25 },
    },
    tierBenefits: {
      0: { discountRate: 0, title: 'Acheteur occasionnel', description: 'Volume standard minimum requis.', perk: 'Tarif de gros standard.' },
      1: { discountRate: 0.08, title: 'Compte commercial', description: 'Pas de minimum de commande.', perk: 'Livraison au port sans frais.' },
      2: { discountRate: 0.15, title: 'Client privilégié', description: 'Tarifs réservés aux centrales d’achat.', perk: 'Accès au fret fluvial régulier.' },
      3: { discountRate: 0.25, title: 'Armateur associé', description: 'Tarif usine bord à quai et crédit à 30 jours.', perk: 'Capacité d’exportation régionale.' },
    },
    specialGoods: [
      { id: 'palette_boissons_locales', name: 'Palette Jus & Sirops Artisanaux (100 unités)', cost: 75, description: 'Stock pour alimenter toute la ville avec une marge de 70%.', requiredTier: 1 },
      { id: 'contrat_fret_peniche', name: 'Liaison Fluviale Hebdomadaire', cost: 150, description: 'Réduit les coûts de transport de toutes les entreprises de 40%.', requiredTier: 2 },
    ],
  },
  tramway_express: {
    id: 'tramway_express',
    name: 'Comptoir Logistique Tramway',
    role: 'Hub de correspondances rapides',
    location: 'tramway',
    description: 'Gare marchande et relais de fret léger reliant tous les quartiers de la ville.',
    tierRequirements: {
      0: { spent: 0, trades: 0 },
      1: { spent: 40, trades: 3 },
      2: { spent: 110, trades: 9 },
      3: { spent: 300, trades: 20 },
    },
    tierBenefits: {
      0: { discountRate: 0, title: 'Usager', description: 'Tickets fret unitaires.', perk: 'Transport ponctuel.' },
      1: { discountRate: 0.06, title: 'Abonné Express', description: 'Priorité d’embarquement des colis.', perk: 'Livraison 2x plus rapide.' },
      2: { discountRate: 0.12, title: 'Partenaire Ligne Centrale', description: 'Casiers relais automatiques dans chaque station.', perk: 'Relais 24/7.' },
      3: { discountRate: 0.20, title: 'Réseau Maillé Ville-Entière', description: 'Intégration directe aux rames de tram.', perk: 'Couverture totale métropolitaine.' },
    },
    specialGoods: [
      { id: 'pass_fret_illimite', name: 'Pass Fret Tramway Mensuel', cost: 35, description: 'Zéro frais de déplacement en transport en commun pour Camille et l’équipe.', requiredTier: 1 },
      { id: 'casier_consigne_connectee', name: 'Hub de Casiers Connectés', cost: 80, description: 'Permet les retraits de commandes 24h/24 sans présence humaine.', requiredTier: 2 },
    ],
  },
};

export function createInitialVendorsState(): Record<VendorId, VendorRelationship> {
  const res: Partial<Record<VendorId, VendorRelationship>> = {};
  for (const id of Object.keys(VENDOR_DEFS) as VendorId[]) {
    const def = VENDOR_DEFS[id];
    res[id] = {
      vendorId: id,
      name: def.name,
      location: def.location,
      tier: 0,
      spentTotal: 0,
      tradeCount: 0,
      discountRate: 0,
      unlockedPerks: [def.tierBenefits[0].perk],
      friendshipDialogueUnlocked: false,
      specialStockAvailable: false,
      creditLineLimit: 0,
      creditBalance: 0,
    };
  }
  return res as Record<VendorId, VendorRelationship>;
}
