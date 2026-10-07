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
  tuto_eco_bail: {
    id: 'tuto_eco_bail',
    title: '🧺 Louer un étal ou un local',
    body: 'Chaque porte « À LOUER » est un local : appuie sur E pour voir le loyer, la surface et les passants. À 12 ans, tes parents signent pour un étal du marché (quelques euros par jour). Pour une vraie boutique, il faudra faire tes preuves : tenir un étal, vendre et être apprécié du quartier.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_commande: {
    id: 'tuto_eco_commande',
    title: '📦 Approvisionner ton commerce',
    body: 'Rien ne tombe du ciel : dans le téléphone (P), application Commandes, choisis un fournisseur. Chez Mme Bertin ou au Cash HyperVal, tu vas chercher les cartons toi-même ; les grossistes livrent en quelques jours. Verse d’abord de l’argent dans la caisse du commerce.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_retrait: {
    id: 'tuto_eco_retrait',
    title: '🚶 Aller chercher les cartons',
    body: 'Une colonne jaune marque le fournisseur, et la mini-carte aussi. Va devant sa porte et appuie sur E pour charger ; tu portes 40 unités au plus. Une colonne verte marque ensuite ta boutique : appuie sur E devant pour décharger en rayon.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_ouverture: {
    id: 'tuto_eco_ouverture',
    title: '🔓 Ouvrir et vendre',
    body: 'Ouvre ton commerce depuis le téléphone. Les passants entrent selon la rue, la météo, tes prix et ta réputation. Sur un étal, c’est toi qui sers : reste derrière pendant les heures d’ouverture, ou embauche quelqu’un. Le bilan du soir détaille les causes dans le journal.',
    unlocked: true,
    seen: false,
  },
  tuto_interieur: {
    id: 'tuto_interieur',
    title: '🏠 Les intérieurs',
    body: 'Tu peux marcher dans les lieux couverts. Les icônes flottantes signalent les objets utiles : approche-toi et appuie sur E. La porte (🚪) te ramène dans la rue.',
    unlocked: true,
    seen: false,
  },
  tuto_boulot: {
    id: 'tuto_boulot',
    title: '🧺 Un petit boulot chez Mme Bertin',
    body: 'Après les cours (16 h – 19 h) ou le samedi, propose ton aide à Mme Bertin : 4,50 € de l’heure, un peu de fatigue, et sa confiance. Au bout de trois services, elle te fera un prix sur sa marchandise.',
    unlocked: true,
    seen: false,
  },
};
