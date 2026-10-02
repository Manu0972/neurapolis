/**
 * NEURAPOLIS — Quartier : La Ligne de Tramway / TER & Le Hub Métropolitain
 * Spécification détaillée (Survey 2 §3.5, ORIGINAL_REQUEST.md R1).
 */
import type { ExtendedDistrictDef } from './types';

export const TRAMWAY_DISTRICT: ExtendedDistrictDef = {
  id: 'tramway',
  name: 'La Ligne de Tramway / TER',
  description:
    'Hub multimodal reliant la commune autonome au grand bassin métropolitain régional. Quai d’embarquement des pendulaires du matin, gare de triporteurs et sas d’exportation pour les surplus d’artisanat et de conserverie locale.',
  ambientKelvin: 1800,
  pois: [
    'Halte Val-Ferrand & Salle des Pas Perdus',
    'Hub Logistique Douce & Relais Vélo-Cargo',
    'Buffet « Le Terminus Heureux »',
    'Passerelle du Viaduc',
  ],
  poiDetails: [
    {
      id: 'halte_val_ferrand',
      name: 'Halte Val-Ferrand & Salle des Pas Perdus',
      description: 'Gare ferroviaire historique de style Art Déco avec son horloge monumentale à balancier de cuivre, ses bancs de chêne patiné et ses grandes baies vitrées donnant sur les voies ferrées étincelantes.',
      atmosphere: 'Crissement feutré des rails, carillon mélodieux annonçant les départs vers la métropole, parfum de papier journal et d’espresso chaud.',
      systemicRole: 'Porte d’entrée des flux humains et des débouchés commerciaux extérieurs.',
      suggestedActivities: ['attendre_la_rame', 'vendre_des_encas_aux_voyageurs', 'lire_les_horaires'],
    },
    {
      id: 'hub_logistique_douce',
      name: 'Hub Logistique Douce & Relais Vélo-Cargo',
      description: 'Quai de transbordement couvert où les caisses débarquées des rames TER sont immédiatement dispatchées vers des triporteurs électriques et livreurs à pied pour irriguer les cinq quartiers.',
      atmosphere: 'Ronronnement des chaînes de vélos, scanneurs manuels bipant en cadence, bannières en toile frappées du logo de la logistique citoyenne.',
      systemicRole: 'Plateforme centrale de distribution : booste l’efficacité de toutes les livraisons douces du jeu.',
      suggestedActivities: ['charger_un_triporteur', 'trier_les_colis', 'planifier_une_tournee'],
    },
    {
      id: 'buffet_terminus',
      name: 'Buffet « Le Terminus Heureux »',
      description: 'Bistrot de gare tenu par d’anciens cheminots syndiqués, où se croisent étudiants pressés, contrôleuses poètes et artisans en transit autour d’un zinc rutilant.',
      atmosphere: 'Brouhaha convivial, tintement des cuillères dans les tasses en faïence épaisse, odeur de croissants chauds et de café torréfié.',
      systemicRole: 'Restauration rapide, détente anti-stress pour le joueur et récolte d’informations économiques métropolitaines.',
      suggestedActivities: ['prendre_un_chocolat_chaud', 'discuter_avec_solange', 'recueillir_des_nouvelles'],
    },
    {
      id: 'passerelle_viaduc',
      name: 'Passerelle du Viaduc',
      description: 'Ouvrage métallique surplombant les six voies ferrées et l’échangeur du tramway, offrant un panorama cinétique saisissant sur le balai des rames et des convois de fret.',
      atmosphere: 'Vibration rythmique du passage des trains sous les pieds, vent d’est vivifiant, éclairage ambré chaleureux des lanternes ferroviaires à la tombée du jour.',
      systemicRole: 'Point de contemplation contemplative permettant d’analyser les flux macro-économiques et le rythme de la ville.',
      suggestedActivities: ['observer_les_trains', 'sentir_le_rythme_de_la_ville', 'rever_a_la_metropole'],
    },
  ],
  keyNpcs: ['solange_vasseur', 'maxime_chen'],
  dominantGhosts: ['ricardo', 'rosa', 'keynes'],
  economicRole: 'Exportation métropole, régulation du stress pendulaire et transbordement de marchandises.',
  paletteDescription: 'Acier brossé, ballast gris ardoise, verrières rétro-éclairées 1800K jaune d’or et phares ambrés perçant la brume matinale.',
  transitions: {
    vers_roses: { targetDistrict: 'roses', targetPoi: 'Parvis de la Gare' },
    vers_hauts: { targetDistrict: 'hauts', targetPoi: 'Belvédère des Éoliennes' },
  },
};
