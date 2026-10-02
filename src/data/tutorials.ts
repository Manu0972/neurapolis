/**
 * NEURAPOLIS — Mini-Tutoriels contextuels et skippables pour une prise en main fluide.
 */
import type { TutorialItem } from '../core/types';

export const INITIAL_TUTORIALS: Record<string, TutorialItem> = {
  tuto_plan_action: {
    id: 'tuto_plan_action',
    title: '🗺 Plans d’Action & Cartographie',
    body: 'Quand une opportunité ou un conseil de fantôme se présente, consulte l’onglet Stratégie / Carte. Tu peux y formuler des plans en plusieurs étapes (approvisionnement, flotte logistique, diplomatie) pour franchir des caps majeurs et étendre ton influence.',
    unlocked: true,
    seen: false,
  },
  tuto_marchands_tiers: {
    id: 'tuto_marchands_tiers',
    title: '🤝 Niveaux de Relation avec les Marchands',
    body: 'Plus tu commerces avec Mme Bertin ou Karim, plus votre niveau de fidélité grimpe (Tier 1 Habitué → Tier 2 Partenaire → Tier 3 Allié). Chaque rang débloque des remises permanentes, des alertes de marché et du stock exclusif.',
    unlocked: true,
    seen: false,
  },
  tuto_multi_entreprises: {
    id: 'tuto_multi_entreprises',
    title: '🏢 Multi-Activités & Attribution des Rôles',
    body: 'Tu n’es pas limité à une seule activité ! Gère en parallèle ton Stand, l’Atelier de la Friche et les Coursiers doux. Assigne des rôles clés à tes camarades (Direction, Logistique, Négociation, Trésorerie, Qualité) pour débloquer de puissantes synergies.',
    unlocked: true,
    seen: false,
  },
  tuto_chocs_macro: {
    id: 'tuto_chocs_macro',
    title: '📰 Actualités & Chocs Économiques',
    body: 'L’économie bouge autour de toi : inflation, pénuries ou grèves de transport affectent les coûts et la demande. Consulte régulièrement le fil d’actualités pour adapter tes prix et saisir les meilleures opportunités.',
    unlocked: true,
    seen: false,
  },
  tuto_etudes_famille: {
    id: 'tuto_etudes_famille',
    title: '🎓 Études, École & Équilibre de Vie',
    body: 'Tu as 12 ans et tu vas au collège. Tu peux choisir d’assister consciencieusement aux cours pour rassurer tes parents et tes professeurs, ou sécher pour une grosse opportunité d’affaires — au risque de susciter de l’inquiétude ! Trouve le bon équilibre.',
    unlocked: true,
    seen: false,
  },
  tuto_compagnon_kawaii: {
    id: 'tuto_compagnon_kawaii',
    title: '👻 Ton Compagnon Fantôme Interactif',
    body: 'Le petit widget fantôme en haut à droite réagit à tes actions en direct. Clique dessus à tout moment pour lui demander un conseil tactique spontané sur ta situation !',
    unlocked: true,
    seen: false,
  },
};
