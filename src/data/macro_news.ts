/**
 * NEURAPOLIS — Données statiques Actualités Macroéconomiques & Chocs de Marché.
 */
import type { MacroNewsItem, MacroTrend } from '../core/types';

export interface NewsTemplate {
  headline: string;
  summary: string;
  trend: MacroTrend;
  costModifier: number;
  demandModifier: number;
  durationDays: number;
}

export const MACRO_NEWS_TEMPLATES: NewsTemplate[] = [
  {
    headline: 'Hausse des cours des matières premières & emballages',
    summary: 'Les coûts du sucre, de la farine et des cartons d’emballage grimpent de 15% à l’échelle nationale.',
    trend: 'inflation',
    costModifier: 0.18,
    demandModifier: 0.0,
    durationDays: 3,
  },
  {
    headline: 'Récolte maraîchère record dans la plaine de Val-Ferrand',
    summary: 'Les vergers locaux débordent de pommes et poires. Les producteurs bradent leurs caisses aux artisans.',
    trend: 'deflation',
    costModifier: -0.20,
    demandModifier: 0.10,
    durationDays: 4,
  },
  {
    headline: 'Grève générale des chauffeurs de poids-lourds',
    summary: 'Les hypermarchés subissent des retards d’approvisionnement. Les habitants se tournent vers les commerces de quartier.',
    trend: 'greve_transports',
    costModifier: 0.05,
    demandModifier: 0.35,
    durationDays: 3,
  },
  {
    headline: 'Fête de la Création Locale & Marché d’Automne',
    summary: 'La mairie organise le grand rassemblement des artisans et jeunes entrepreneurs sur la place centrale.',
    trend: 'croissance_locale',
    costModifier: -0.05,
    demandModifier: 0.45,
    durationDays: 2,
  },
  {
    headline: 'Pénurie de composants électroniques et puces recyclées',
    summary: 'Les ateliers de réparation s’arrachent les condensateurs et pièces de réemploi. Les prix d’occasion flambent.',
    trend: 'penurie',
    costModifier: 0.25,
    demandModifier: 0.20,
    durationDays: 4,
  },
  {
    headline: 'Stabilité économique et reprise de la consommation',
    summary: 'Le climat des affaires reste serein à Val-Ferrand. Les échanges commerciaux suivent leur cours régulier.',
    trend: 'stabilite',
    costModifier: 0.0,
    demandModifier: 0.05,
    durationDays: 5,
  },
];
