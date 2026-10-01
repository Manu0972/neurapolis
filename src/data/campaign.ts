/**
 * Données de campagne narrative et progression de vie (12 ans → conclusion).
 * Contrat : Le joueur commence à 12 ans à Val-Ferrand et traverse des étapes
 * marquantes aux conséquences différées et à la conclusion satisfaisante.
 */
import type { CampaignStage, DoctrineKey, NpcId } from '../core/types';

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


export type LastingEconomicModelId =
  | 'communs_cooperatifs'
  | 'marche_equitable'
  | 'planification_solidaire'
  | 'synergie_hybride';

export interface LastingEconomicModelDef {
  id: LastingEconomicModelId;
  title: string;
  subtitle: string;
  doctrine: 'communs' | 'marche' | 'autorite' | 'solidarite';
  ghostAlliance: string;
  description: string;
  legacyTitle: string;
}

export const LASTING_ECONOMIC_MODELS: Record<LastingEconomicModelId, LastingEconomicModelDef> = {
  communs_cooperatifs: {
    id: 'communs_cooperatifs',
    title: 'Les Communs & Coopératives Autogérées',
    subtitle: 'Alliance Friche Taret & Ateliers Partagés',
    doctrine: 'communs',
    ghostAlliance: 'Elinor Ostrom & Karl Marx',
    description: 'La Friche Taret devient le cœur battant de la production locale. Les outils et les bénéfices sont gouvernés selon la règle d’une personne = une voix, sans patron ni spéculation.',
    legacyTitle: 'Bâtisseur des Communs',
  },
  marche_equitable: {
    id: 'marche_equitable',
    title: 'Le Marché Éthique & Circuits Courts',
    subtitle: 'Transparence, Qualité & Commerce de Proximité',
    doctrine: 'marche',
    ghostAlliance: 'Adam Smith & David Ricardo',
    description: 'En protégeant l’épicerie Bertin et les producteurs indépendants, tu instaures une concurrence loyale et saine où la juste valeur du travail et des produits prime sur les monopoles du Drive.',
    legacyTitle: 'Pionnier du Commerce Équitable',
  },
  planification_solidaire: {
    id: 'planification_solidaire',
    title: 'Le Pôle Public & Sécurité Économique',
    subtitle: 'Services d’Intérêt Général & Soutien Municipal',
    doctrine: 'autorite',
    ghostAlliance: 'John Maynard Keynes & Thomas Hobbes',
    description: 'La mairie et la collectivité sanctuarisent le Stand et les initiatives du quartier comme des services d’utilité publique, garantissant salaires décents et sécurité face aux crises.',
    legacyTitle: 'Guide Républicain de la Cité',
  },
  synergie_hybride: {
    id: 'synergie_hybride',
    title: 'La Synergie Plurielle de Val-Ferrand',
    subtitle: 'Équilibre Écosystémique Marché, Communs et Solidarité',
    doctrine: 'solidarite',
    ghostAlliance: 'Le Marché des Communs & Tout le Conseil',
    description: 'Val-Ferrand devient la référence vivante d’une économie mixte équilibrée : initiative personnelle, souveraineté citoyenne sur les biens communs et filet de solidarité collective.',
    legacyTitle: 'Harmonisateur de NEURAPOLIS',
  },
};

export type UrbanChoiceId = 'marche_paysan' | 'agora_verte' | 'foyer_cooperatif';

export interface UrbanChoiceDef {
  id: UrbanChoiceId;
  title: string;
  subtitle: string;
  doctrine: 'marche' | 'communs' | 'solidarite';
  cost: number;
  description: string;
  effects: {
    vitaliteEpicerie: number;
    frequentationParc: number;
    confianceQuartier: number;
    reputation: number;
  };
  epilogueSummary: string;
}

export const URBAN_CHOICES: Record<UrbanChoiceId, UrbanChoiceDef> = {
  marche_paysan: {
    id: 'marche_paysan',
    title: 'Marché Solidaire des Producteurs',
    subtitle: 'Étals paysans, circuits courts et parvis commerçant',
    doctrine: 'marche',
    cost: 30,
    description: 'Relier directement les producteurs locaux et artisans aux habitants sur la place, dynamisant le commerce de proximité face aux monopoles industriels.',
    effects: { vitaliteEpicerie: 12, frequentationParc: -12, confianceQuartier: 8, reputation: 5 },
    epilogueSummary: 'Le marché paysan a renforcé les commerces de proximité, au prix d’une place plus animée et moins disponible pour le repos.',
  },
  agora_verte: {
    id: 'agora_verte',
    title: 'Agora Verte & Jardins Partagés',
    subtitle: 'Potagers communs, bancs ombragés et gestion citoyenne',
    doctrine: 'communs',
    cost: 25,
    description: 'Transformer le parvis minéral en un bien commun géré par les riverains, propice aux rencontres, à la fraîcheur et à l’entraide de quartier.',
    effects: { vitaliteEpicerie: 3, frequentationParc: 14, confianceQuartier: 12, reputation: 2 },
    epilogueSummary: 'L’agora verte a rendu la place plus accueillante et renforcé la capacité des habitants à gérer les communs.',
  },
  foyer_cooperatif: {
    id: 'foyer_cooperatif',
    title: 'Maison Commune & Atelier Solidaire',
    subtitle: 'Tiers-lieu d’entraide, outillothèque et ateliers populaires',
    doctrine: 'solidarite',
    cost: 35,
    description: 'Offrir un toit partagé pour les réparations, la formation des jeunes et l’organisation collective contre la précarité urbaine.',
    effects: { vitaliteEpicerie: 7, frequentationParc: 5, confianceQuartier: 9, reputation: 7 },
    epilogueSummary: 'Le foyer coopératif a créé un lieu durable d’entraide et d’apprentissage, avec un investissement initial plus lourd.',
  },
};
