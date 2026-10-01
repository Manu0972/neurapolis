/**
 * Données de campagne narrative et progression de vie (12 ans → conclusion).
 * Contrat : Le joueur commence à 12 ans à Val-Ferrand et traverse des étapes
 * marquantes aux conséquences différées et à la conclusion satisfaisante.
 */
import type { CampaignStage, EndingModelId } from '../core/types';

export interface EndingModelOption {
  id: EndingModelId;
  title: string;
  subtitle: string;
  description: string;
  philosophy: string;
}

export const ENDING_MODELS: EndingModelOption[] = [
  {
    id: 'coop_citoyenne',
    title: 'La Coopérative Citoyenne Autonome',
    subtitle: 'Modèle fondé sur les communs et la gouvernance partagée',
    description: 'Val-Ferrand devient un réseau de coopératives autogérées par les habitants et commerçants. Le capital reste local, réinvesti dans le quartier.',
    philosophy: 'Favorise la cohésion sociale et la résilience, au prix d’une croissance commerciale plus modérée et de débats fréquents.',
  },
  {
    id: 'marche_equitable',
    title: 'Le Marché Équitable Régulé',
    subtitle: 'Modèle fondé sur la libre initiative sous charte sociale strict',
    description: 'Commerces indépendants et entreprises locales collaborent sous une charte de prix et de rémunération équitable, canalisant l’agressivité des rivaux.',
    philosophy: 'Offre dynamisme économique et liberté d’entreprise, tout en encadrant les abus et en maintenant la vitalité des petits commerces.',
  },
  {
    id: 'planification_communs',
    title: 'La Planification des Communs Urbains',
    subtitle: 'Modèle de solidarité municipale et d’allocation concertée',
    description: 'Les infrastructures et services essentiels sont gérés en biens communs municipaux. Les bénéfices financent la solidarité et la gratuité des besoins de base.',
    philosophy: 'Garantit la sécurité et l’égalité d’accès pour tous les habitants, exigeant une discipline collective forte.',
  },
];

export const INITIAL_CAMPAIGN_STAGES: CampaignStage[] = [
  {
    id: 'chapitre_1_stand',
    chapter: 1,
    title: 'Les Goûters de Val-Ferrand (12 ans)',
    targetAge: 12,
    objective: 'Ouvrir le Stand des Roses, constituer une équipe et réaliser vos premières ventes face au distributeur.',
    completed: false,
  },
  {
    id: 'chapitre_2_friche',
    chapter: 2,
    title: 'L’Appel de la Friche Taret (13 ans)',
    targetAge: 13,
    objective: 'À 13 ans, retrouver Samir à la Friche, écrire des règles avec l’équipe puis réussir une vente collective.',
    completed: false,
  },
  {
    id: 'chapitre_3_reseau',
    chapter: 3,
    title: 'Le Réseau Solidaire (14 ans)',
    targetAge: 14,
    objective: 'Aider l’épicerie de Mme Bertin avec cinq livraisons, puis lancer une nouvelle contre-offensive face au Drive.',
    completed: false,
  },
  {
    id: 'chapitre_4_conseil_urbain',
    chapter: 4,
    title: 'La Voix du Quartier (15 ans)',
    targetAge: 15,
    objective: 'Mobiliser les habitants et les fantômes conseillers lors du réaménagement de la place de Val-Ferrand.',
    completed: false,
  },
  {
    id: 'chapitre_5_conclusion',
    chapter: 5,
    title: 'L’Héritage de Val-Ferrand (16 ans)',
    targetAge: 16,
    objective: 'Fonder un modèle économique durable pour la ville et trancher la destinée finale de NEURAPOLIS.',
    completed: false,
  },
];
