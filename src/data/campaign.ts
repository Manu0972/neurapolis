/**
 * Données de campagne narrative et progression de vie (12 ans → conclusion).
 * Contrat : Le joueur commence à 12 ans à Val-Ferrand et traverse des étapes
 * marquantes aux conséquences différées et à la conclusion satisfaisante.
 */
import type { CampaignStage } from '../core/types';

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
