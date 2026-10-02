/**
 * NEURAPOLIS — Quartier : Le Canal & Les Docks Désaffectés
 * Spécification détaillée (Survey 2 §3.1, ORIGINAL_REQUEST.md R1).
 */
import type { ExtendedDistrictDef } from './types';

export const DOCKS_DISTRICT: ExtendedDistrictDef = {
  id: 'docks',
  name: 'Le Canal & Les Docks Désaffectés',
  description:
    'Ancien port fluvial sur le défluent du Val jadis voué au déchargement du charbon de l’usine Taret. Réoccupé spontanément par une communauté flottante de péniches associatives, de torréfacteurs insoumis et de pêcheurs contemplatifs.',
  ambientKelvin: 1800,
  pois: [
    'Péniche L’Égalité Flottante',
    'Hangar 4 & Quai aux Épices',
    'Pont Tournant & Banc des Pêcheurs',
    'Écluse des Écureuils',
  ],
  poiDetails: [
    {
      id: 'peniche_egalite',
      name: 'Péniche L’Égalité Flottante',
      description: 'Chaland automoteur de 38 mètres en acier riveté, reconverti en café associatif, bibliothèque de prêt libre et agora flottante au ras de l’eau.',
      atmosphere: 'Bois ciré, clapotis continu de l’eau contre la tôle, vapeur de café filtre et effluves d’encre de journaux polycopiés.',
      systemicRole: 'Point de ralliement associatif, débats de quartier, repos à fatigue modérée.',
      suggestedActivities: ['boire_un_cafe', 'emprunter_un_livre', 'debattre_du_fleuve'],
    },
    {
      id: 'hangar_4',
      name: 'Hangar 4 & Quai aux Épices',
      description: 'Ancien entrepôt douanier à verrière patinée où le Capitaine Yannick entrepose et torréfie des sacs de café en grains bio et d’agrumes acheminés sans traceurs numériques.',
      atmosphere: 'Parfum envoûtant de grains de café torréfiés au feu de bois, sacs de jute empilés, poussière dorée dans les rais de lumière ambrée.',
      systemicRole: 'Hub d’approvisionnement en gros (matières premières alimentaires à bas coût logistique).',
      suggestedActivities: ['acheter_cafe_gros', 'aider_au_dechargement', 'negocier_fret'],
    },
    {
      id: 'pont_tournant',
      name: 'Pont Tournant & Banc des Pêcheurs',
      description: 'Ouvrage ferroviaire du XIXe siècle figé à demi-ouvert au-dessus des eaux calmes, devenu le repaire de Barnabé et de ses lignes à friture.',
      atmosphere: 'Rouille protectrice cuivrée, grincement doux au vent du nord, silence contemplatif troué par les ronds dans l’eau.',
      systemicRole: 'Zone de détente mentale, dialogue philosophique avec les aînés du fleuve.',
      suggestedActivities: ['pecher_a_la_ligne', 'ecouter_barnabe', 'contempler_le_courant'],
    },
    {
      id: 'ecluse_ecureuils',
      name: 'Écluse des Écureuils',
      description: 'Double sas de maçonnerie en calcaire moussue régulant le niveau du bief, entouré de roseaux denses où niche une colonie bruyante de canards colverts.',
      atmosphere: 'Mousse fraîche, clapotis des vannes de décharge, fraîcheur humide constante à 16°C.',
      systemicRole: 'Régulation hydraulique, point de passage vers les sentiers de halage et les caves voûtées.',
      suggestedActivities: ['nourrir_les_canards', 'actionner_le_sas', 'observer_la_faune'],
    },
  ],
  keyNpcs: ['capitaine_yannick', 'barnabe_pecheur'],
  dominantGhosts: ['ostrom', 'smith', 'ricardo'],
  economicRole: 'Approvisionnement fluvial en vrac, café équitable et gestion des communs d’eau.',
  paletteDescription: 'Reflets ambrés 1800K sur eau moirée, ombres bleutées froides sous les coques, vert mousse et rouille orangée.',
  transitions: {
    vers_roses: { targetDistrict: 'roses', targetPoi: 'Place du Marché' },
    vers_caves: { targetDistrict: 'caves', targetPoi: 'Galerie Basse du Bief' },
  },
};
