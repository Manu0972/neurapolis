/**
 * NEURAPOLIS — Quartier : Les Hauts de Val-Ferrand
 * Spécification détaillée (Survey 2 §3.2, ORIGINAL_REQUEST.md R1).
 */
import type { ExtendedDistrictDef } from './types';

export const HAUTS_DISTRICT: ExtendedDistrictDef = {
  id: 'hauts',
  name: 'Les Hauts de Val-Ferrand',
  description:
    'Plateau calcaire surplombant la cuvette industrielle. Ancienne cité-dortoir des années 1960 dont les toits-terrasses ont été conquis par les résidents pour implanter serres citoyennes, ruches, micro-éoliennes et l’antenne de la radio pirate locale.',
  ambientKelvin: 1800,
  pois: [
    'Toits Panoramiques & Serres',
    'Studio Radio Val-Libre 107.4',
    'Passerelle des Alizés',
    'Belvédère des Éoliennes',
  ],
  poiDetails: [
    {
      id: 'toits_panoramiques',
      name: 'Toits Panoramiques & Serres',
      description: 'Labyrinthe suspendu de toitures végétalisées reliées par des caillebotis de bois, abritant 200 m² de bacs de menthe, tomates anciennes et ruches urbaines.',
      atmosphere: 'Vent vif de crête, bourdonnement des abeilles industrieuses, odeur de terreau tiède et de thym sauvage sous le plein soleil.',
      systemicRole: 'Production maraîchère perchée, cueillette d’aromates pour infusions et tisanes de Bertin.',
      suggestedActivities: ['recolter_aromates', 'visiter_les_ruches', 'admirer_la_vallee'],
    },
    {
      id: 'radio_val_libre',
      name: 'Studio Radio Val-Libre 107.4',
      description: 'Ancien local technique d’ascenseur capitonné de boîtes d’œufs et de rideaux de velours élimé, émettant musique libre, tribunes syndicales et alertes de quartier.',
      atmosphere: 'Chaleur feutrée des lampes d’amplificateur à tubes, odeur de vinyle chaud et de café noir, voyant rouge ON AIR brillant doucement.',
      systemicRole: 'Plateforme médiatique citoyenne : influence directe sur l’opinion publique et la confiance de quartier.',
      suggestedActivities: ['prendre_le_micro', 'diffuser_un_jingle', 'proposer_une_chronique'],
    },
    {
      id: 'passerelle_alizes',
      name: 'Passerelle des Alizés',
      description: 'Pont piétonnier suspendu en poutrelles d’acier galvanisé franchissant la gorge rocheuse pour relier les Hauts au cœur des Roses en dix minutes de marche.',
      atmosphere: 'Légère oscillation sous les pas, vue plongeante vertigineuse sur les toits d’ardoise de la vieille ville, sifflement des haubans dans les rafales.',
      systemicRole: 'Axe de transit rapide entre la colline et la vallée évitant le détour par la route nationale.',
      suggestedActivities: ['traverser_la_passerelle', 'sentir_le_vent', 'observer_la_circulation'],
    },
    {
      id: 'belvedere_eoliennes',
      name: 'Belvédère des Éoliennes',
      description: 'Esplanade de béton sablé où tourbillonnent trois éoliennes à axe vertical Savonius artisanales fabriquées dans les fablabs du Bassin Nord.',
      atmosphere: 'Bruissement feutré des pales d’aluminium brossé, bancs de bois face au couchant doré, ciel immense teinté d’ocre et de pourpre.',
      systemicRole: 'Station de recharge pour batteries de triporteurs et outillage électroportatif.',
      suggestedActivities: ['recharger_batterie', 'regarder_le_coucher_de_soleil', 'noter_la_meteo'],
    },
  ],
  keyNpcs: ['dj_mirabelle', 'gaspard_vaneck'],
  dominantGhosts: ['rosa', 'graeber', 'illich'],
  economicRole: 'Diffusion de l’information citoyenne, micro-énergie éolienne et vigie de quartier.',
  paletteDescription: 'Ciels d’altitude cobalt, brique claire chauffée par la lumière rasante 1800K, feuillage vert sauge et reflets métalliques d’antennes.',
  transitions: {
    vers_roses: { targetDistrict: 'roses', targetPoi: 'Parc des Roses' },
    vers_bassin: { targetDistrict: 'bassin', targetPoi: 'Escalier Industriel' },
  },
};
