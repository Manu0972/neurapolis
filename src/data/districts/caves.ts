/**
 * NEURAPOLIS — Quartier : Les Souterrains & Caves Voûtées
 * Spécification détaillée (Survey 2 §3.4, ORIGINAL_REQUEST.md R1).
 */
import type { ExtendedDistrictDef } from './types';

export const CAVES_DISTRICT: ExtendedDistrictDef = {
  id: 'caves',
  name: 'Les Souterrains & Caves Voûtées',
  description:
    'Réseau séculaire de carrières de calcaire blanc, caves de garde à vin et galeries de refuge creusées sous la cité. Reliant secrètement école, épicerie, friche et quais, ce monde de l’ombre abrite marché nocturne, champignonnière et fresques visionnaires.',
  ambientKelvin: 1800,
  pois: [
    'Galerie des Échanges Clandestins',
    'Champignonnière du Puits',
    'Carrefour des Quatre-Vents',
    'Fresque des Prophéties',
  ],
  poiDetails: [
    {
      id: 'galerie_echanges',
      name: 'Galerie des Échanges Clandestins',
      description: 'Longue voûte romane de 40 mètres où s’organise à la tombée de la nuit un marché d’entraide échappant aux radars fiscaux et aux caméras : troc de semences, livres de seconde main, conserves et outillage ancien.',
      atmosphere: 'Lumière tremblotante des lanternes à bougie posées dans les anfractuosités du calcaire, voix chuchotées, salpêtre étincelant comme de la poussière d’étoiles.',
      systemicRole: 'Marché nocturne alternatif permettant de vendre des produits hors-taxe et d’acheter des denrées rares.',
      suggestedActivities: ['troquer_des_semences', 'vendre_des_douceurs_la_nuit', 'trouver_un_outil_rare'],
    },
    {
      id: 'champignonniere_puits',
      name: 'Champignonnière du Puits',
      description: 'Ancienne glacière voûtée où poussent des grappes denses de pleurotes gris et de shiitakés charnus sur des sacs de toile remplis de marc de café récupéré à l’épicerie Bertin.',
      atmosphere: 'Odeur d’humus forestier frais, fraîcheur constante à 13°C, humidité bienfaisante et perles d’eau suintant du plafond rocheux.',
      systemicRole: 'Production alimentaire d’obscurité en circuit ultra-court : nourriture fraîche nutritive indépendante des saisons.',
      suggestedActivities: ['recolter_pleurotes', 'apporter_du_marc_de_cafe', 'humidifier_les_balles'],
    },
    {
      id: 'carrefour_quatre_vents',
      name: 'Carrefour des Quatre-Vents',
      description: 'Salle circulaire voûtée dotée de quatre lourdes portes en chêne ferré ouvrant respectivement sur les sous-sols du Collège, la réserve de Mme Bertin, la Friche Taret et le Canal.',
      atmosphere: 'Courants d’air croisés sifflant doucement, pavés usés patinés par deux siècles de passages clandestins, serrures en bronze ciselé.',
      systemicRole: 'Nœud de circulation furtif : franchissement de la ville à l’abri de la pluie, de la fatigue et des patrouilles.',
      suggestedActivities: ['choisir_une_galerie', 's_abriter_de_la_tempete', 'ecouter_les_pas_en_surface'],
    },
    {
      id: 'fresque_propheties',
      name: 'Fresque des Prophéties',
      description: 'Pan de calcaire blanc de 15 mètres de long où Louison peint à la cire d’abeille et aux pigments d’argile des allégories énigmatiques qui préfigurent les crises et opportunités économiques de la ville.',
      atmosphere: 'Pénombre mystique, effluves d’huile de lin et de térébenthine, pigments ocre et indigo vibrant sous la lueur d’une lampe frontale jaune.',
      systemicRole: 'Oracle économique diégétique : consulter la fresque permet d’anticiper les variations de prix et événements à venir.',
      suggestedActivities: ['decoder_les_symboles', 'apporter_des_pigments', 'dialoguer_avec_louison'],
    },
  ],
  keyNpcs: ['silvio_taupe', 'louison_zephir'],
  dominantGhosts: ['zuboff', 'hobbes', 'locke'],
  economicRole: 'Transit furtif tout-temps, réserve de sécurité et anticipation des chocs économiques.',
  paletteDescription: 'Pénombre minérale calcaire blanc-ivoire, ombres violettes profondes, bougies chaleureuses 1800K et salpêtre scintillant.',
  transitions: {
    vers_roses: { targetDistrict: 'roses', targetPoi: 'Sous-sol Épicerie Bertin' },
    vers_docks: { targetDistrict: 'docks', targetPoi: 'Quai aux Épices' },
    vers_bassin: { targetDistrict: 'bassin', targetPoi: 'Fosse de Coulée' },
  },
};
