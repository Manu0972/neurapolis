/**
 * NEURAPOLIS — Quartier : La Cité des Roses (Quartier Central Historique)
 * Spécification canonique (Survey 2 §2.1, PROJECT.md).
 */
import type { ExtendedDistrictDef } from './types';

export const ROSES_DISTRICT: ExtendedDistrictDef = {
  id: 'roses',
  name: 'La Cité des Roses',
  description:
    'Cœur historique battant de Val-Ferrand, regroupant la place marchande pavée, l’épicerie traditionnelle de Mme Bertin, le Collège des Roses et le parc public. Point de départ de la résistance citoyenne face à l’expansion du Drive HyperVal.',
  ambientKelvin: 1800,
  pois: [
    'Place du Marché',
    'Épicerie Bertin',
    'Collège des Roses',
    'Parc des Roses',
  ],
  poiDetails: [
    {
      id: 'place_marche',
      name: 'Place du Marché',
      description: 'Place pavée bordée de platanes centenaires, où s’installent les étals des producteurs, le Stand des Roses et le kiosque citoyen.',
      atmosphere: 'Pavés inégaux, feuillage doré à l’automne, cliquetis des cageots de légumes frais et discussions animées des chalands.',
      systemicRole: 'Lieu d’implantation principal du stand de vente, grands débats citoyens et délibérations.',
      suggestedActivities: ['tenir_le_stand', 'participer_au_debat', 'discuter_avec_les_anciens'],
    },
    {
      id: 'epicerie_bertin',
      name: 'Épicerie Bertin',
      description: 'Commerce de proximité de Mme Bertin, garni de conserves traditionnelles, de bocaux de bonbons à la violette et de caisses maraîchères.',
      atmosphere: 'Store banne en toile rayée, odeur de café fraîchement moulu, parquet en chêne qui craque et chaleur du vieux poêle en fonte.',
      systemicRole: 'Fournisseur de base, jauge de vitalité commerciale du quartier et accès aux tisanes réconfortantes.',
      suggestedActivities: ['acheter_des_fournitures', 'rendre_service_a_bertin', 'deguster_une_tisane'],
    },
    {
      id: 'college_roses',
      name: 'Collège des Roses',
      description: 'Établissement scolaire public où Camille, Noah et Lina suivent leurs cours et animent les récréations sous l’œil attentif de Mme Moreau.',
      atmosphere: 'Cour de récréation goudronnée bordée de marronniers, sonnerie stridente de la cloche, odeur de craie et rires d’élèves.',
      systemicRole: 'Apprentissage des compétences, déblocage des notions économiques et lieu de rendez-vous de la bande.',
      suggestedActivities: ['suivre_les_cours', 'partager_le_gouter', 'discuter_avec_mme_moreau'],
    },
    {
      id: 'parc_roses',
      name: 'Parc des Roses',
      description: 'Poumon vert de la cité avec ses pelouses arborées, son skatepark improvisé et le banc ombragé où Monique et les aînés veillent sur le quartier.',
      atmosphere: 'Ombrage bienfaisant des tilleuls, bruissement des feuilles, roulement des skates sur le béton poli et chants d’oiseaux.',
      systemicRole: 'Lieu de récupération physique et de cohésion sociale avec la cohorte des anciens.',
      suggestedActivities: ['se_reposer_sur_le_banc', 'faire_du_skate_avec_noah', 'ecouter_les_anecdotes_de_monique'],
    },
  ],
  keyNpcs: ['noah', 'lina', 'bertin', 'yasmine'],
  dominantGhosts: ['smith', 'marx'],
  economicRole: 'Commerce de proximité et point de ralliement des habitants.',
  paletteDescription: 'Crépi chaud vanille, brique terracotta, feuillage vert tilleul et éclairage hygge 1800K des devantures.',
  transitions: {
    vers_docks: { targetDistrict: 'docks', targetPoi: 'Écluse des Écureuils' },
    vers_hauts: { targetDistrict: 'hauts', targetPoi: 'Passerelle des Alizés' },
    vers_bassin: { targetDistrict: 'bassin', targetPoi: 'La Forge Commune' },
    vers_caves: { targetDistrict: 'caves', targetPoi: 'Carrefour des Quatre-Vents' },
    vers_tram: { targetDistrict: 'tramway', targetPoi: 'Parvis de la Gare' },
  },
};
