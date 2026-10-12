/**
 * NEURAPOLIS — Mini-tutoriels contextuels et désactivables pour une prise en main fluide.
 * Règle d'écriture : deux phrases au plus, un geste concret (où aller, quelle touche).
 */
import type { TutorialItem } from '../core/types';

/**
 * Mini-tutoriel d'une application du téléphone (docs/ASCENSION.md §3.2, lot ASC-3) : un fantôme
 * la présente en trois étapes courtes, à son ouverture. État « vu » : `tutorials['tuto_app_<id>']`.
 */
export interface AppTutorial {
  app: string;
  ghost: string;
  icon: string;
  label: string;
  steps: readonly [string, string, string];
}

export const APP_TUTORIALS: Readonly<Record<string, AppTutorial>> = {
  ascension: {
    app: 'ascension', ghost: 'smith', icon: '🚀', label: 'Ascension',
    steps: [
      'Mon ami, chaque carte est une idée de business : regarde la mise, puis ce qu’elle peut rapporter par jour.',
      '« Lancer », et deux voix se disputent la méthode. Suis l’une, l’autre, ou fais à ta façon.',
      'Chaque nuit, la caisse bouge. Reviens « Retirer la caisse » : ces bénéfices ouvrent le palier suivant.',
    ],
  },
  infos: {
    app: 'infos', ghost: 'keynes', icon: '📰', label: 'Infos',
    steps: [
      'Trois fois par jour, une dépêche secoue un secteur : alimentation, mode, logistique…',
      'Bonne nouvelle pour ton secteur ? On t’achètera plus pendant quelques jours. Mauvaise ? Prudence.',
      'Les voix réagissent à chaque nouvelle. Écoute celle qui parle de ton affaire.',
    ],
  },
  commandes: {
    app: 'commandes', ghost: 'ohno', icon: '📦', label: 'Commandes',
    steps: [
      'Chez Mme Bertin, tu portes les cartons toi-même ; les grossistes livrent en quelques jours.',
      'Verse d’abord de l’argent dans la caisse du commerce : c’est elle qui paie la marchandise.',
      'Commande ce qui part, pas plus. Le stock qui dort, c’est de l’argent qui ne travaille pas.',
    ],
  },
  immobilier: {
    app: 'immobilier', ghost: 'smith', icon: '🏢', label: 'Immobilier',
    steps: [
      'Une semaine de ventes, déjà ! Chaque local a son loyer et ses passants : un étal du marché coûte quelques euros par jour.',
      'Avant 18 ans, tes parents signent avec toi. Leur confiance est ta signature.',
      'Le bon emplacement, c’est là où passent tes clients. Devant une porte « À LOUER », appuie sur E.',
    ],
  },
  commerces: {
    app: 'commerces', ghost: 'ohno', icon: '🏪', label: 'Commerces',
    steps: [
      'Ton premier bail ! Un commerce est un flux : la marchandise entre, attend le moins possible, et sort.',
      'Remplis les rayons (application Commandes), puis appuie sur « Ouvrir ».',
      'Chaque soir, regarde les clients perdus : ils te disent ce qui manque.',
    ],
  },
  emploi: {
    app: 'emploi', ghost: 'marx', icon: '👥', label: 'Emploi',
    steps: [
      'Camarade, des clients sont repartis faute de bras. Un employé n’est pas un coût : il produit la valeur que tu vends.',
      'Un salaire sous le marché fait fuir les meilleurs ; une équipe à bout démissionne.',
      'Embauche quand la file d’attente te coûte plus cher qu’un salaire.',
    ],
  },
  banque: {
    app: 'banque', ghost: 'keynes', icon: '🏦', label: 'Banque',
    steps: [
      'Mon cher, choisir c’est renoncer, et l’argent aussi a un prix. Un prêt achète du temps : ce que tu gagneras demain, tu l’utilises aujourd’hui.',
      'Mais les intérêts tombent chaque nuit, que les clients viennent ou non.',
      'Emprunte pour produire, jamais pour boucher un trou.',
    ],
  },
};

export const appTutorialId = (app: string): string => `tuto_app_${app}`;

export const INITIAL_TUTORIALS: Record<string, TutorialItem> = {
  tuto_plan_action: {
    id: 'tuto_plan_action',
    title: '🗺 Plans d’action',
    body: 'Ici, un grand objectif se découpe en étapes : approvisionnement, logistique, alliés. Choisis une branche, puis avance étape par étape.',
    unlocked: true,
    seen: false,
  },
  tuto_marchands_tiers: {
    id: 'tuto_marchands_tiers',
    title: '🤝 Fidélité des marchands',
    body: 'Plus tu commerces avec Mme Bertin ou Karim, plus ils te font confiance : Habitué, puis Partenaire, puis Allié. Chaque rang donne une remise.',
    unlocked: true,
    seen: false,
  },
  tuto_multi_entreprises: {
    id: 'tuto_multi_entreprises',
    title: '🏢 Plusieurs activités',
    body: 'Le stand, l’atelier, les coursiers : tu peux tout mener de front. Donne un rôle à chaque camarade (direction, logistique, caisse…) pour qu’ils s’entraident.',
    unlocked: true,
    seen: false,
  },
  tuto_chocs_macro: {
    id: 'tuto_chocs_macro',
    title: '📰 Actualités et chocs',
    body: 'Inflation, pénurie, grève : l’économie bouge autour de toi. Lis les dépêches et ajuste tes prix.',
    unlocked: true,
    seen: false,
  },
  tuto_etudes_famille: {
    id: 'tuto_etudes_famille',
    title: '🎓 Collège et famille',
    body: 'Tu as 12 ans : les cours d’abord rassurent tes parents. Sécher pour une affaire, c’est possible, mais ils le sauront.',
    unlocked: true,
    seen: false,
  },
  tuto_compagnon_kawaii: {
    id: 'tuto_compagnon_kawaii',
    title: '👻 Tes fantômes',
    body: 'Leurs têtes flottent en haut de l’écran. Quand l’une bouge, elle a quelque chose à te dire : clique dessus, ou demande-lui son avis.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_bail: {
    id: 'tuto_eco_bail',
    title: '🧺 Louer un étal ou un local',
    body: 'Devant une porte « À LOUER », appuie sur E pour voir le loyer et les passants. À 12 ans, tes parents signent pour un étal du marché.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_commande: {
    id: 'tuto_eco_commande',
    title: '📦 Remplir les rayons',
    body: 'Téléphone (P) → Commandes : choisis un fournisseur. Verse d’abord de l’argent dans la caisse du commerce.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_retrait: {
    id: 'tuto_eco_retrait',
    title: '🚶 Aller chercher les cartons',
    body: 'La colonne jaune marque le fournisseur : E devant sa porte pour charger (40 unités au plus). La colonne verte marque ta boutique : E pour décharger.',
    unlocked: true,
    seen: false,
  },
  tuto_eco_ouverture: {
    id: 'tuto_eco_ouverture',
    title: '🔓 Ouvrir et vendre',
    body: 'Ouvre ton commerce depuis le téléphone. Sur un étal, c’est toi qui sers : reste derrière pendant les heures d’ouverture.',
    unlocked: true,
    seen: false,
  },
  tuto_interieur: {
    id: 'tuto_interieur',
    title: '🏠 Les intérieurs',
    body: 'Les icônes flottantes signalent les objets utiles : approche-toi et appuie sur E. La porte (🚪) te ramène dans la rue.',
    unlocked: true,
    seen: false,
  },
  tuto_boulot: {
    id: 'tuto_boulot',
    title: '🧺 Un petit boulot chez Mme Bertin',
    body: 'Après les cours (16 h – 19 h) ou le samedi : 4,50 € de l’heure. Au bout de trois services, elle devient une connexion.',
    unlocked: true,
    seen: false,
  },
  ...Object.fromEntries(Object.values(APP_TUTORIALS).map((t): [string, TutorialItem] => [appTutorialId(t.app), {
    id: appTutorialId(t.app),
    title: `${t.icon} ${t.label}`,
    body: t.steps.join(' '),
    unlocked: true,
    seen: false,
  }])),
};
