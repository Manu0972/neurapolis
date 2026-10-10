/**
 * Nouveaux doubles faces de l'Ascension (Workflow AG-2 Phase 2).
 * Conforme à docs/ASCENSION.md §2, .zcode/coordination/ANTIGRAVITY-WORKFLOW-AG2.md §2
 * et docs/suivi/explorer_survey_1/handoff.md §4.3.
 */
import type { DuelFace, StrategyEffects } from '../ascension/duels';

export interface DuelDraft {
  id: string;
  title: string;
  question: string;
  a: DuelFace;
  b: DuelFace;
  A: Partial<StrategyEffects>;
  B: Partial<StrategyEffects>;
  ownWay: string;
}

/** Penseur Karl Polanyi (nom, emblème, couleur, époque, résumé). */
export const POLANYI_THINKER = {
  id: 'polanyi',
  name: 'Karl Polanyi',
  era: '1886-1964 · Histoire économique et anthropologie · La Grande Transformation',
  emoji: '⚓',
  color: '#2b6cb0',
  summary: 'L’économie doit rester encastrée dans les liens sociaux et politiques, sous peine de détruire la société.',
} as const;

export const EXTRA_DUELS: readonly DuelDraft[] = [
  // 1. Weber ⟷ Graeber : Bureaucratie rassurante vs Chasse aux bullshit jobs
  // Contexte d'équilibre : Weber gagne dans les activités de grand volume nécessitant zéro incident
  // et une fiabilité exemplaire au prix de frais fixes plus élevés.
  // Graeber gagne dans les structures agiles ou fragiles où l'allègement des coûts fixes et l'autonomie évitent l'asphyxie.
  {
    id: 'weber_graeber',
    title: 'La Règle et le Bon Sens',
    question: 'Comment structurer l’organisation interne ?',
    a: {
      thinker: 'weber',
      name: 'Max Weber',
      emoji: '⛓️',
      color: '#8d99ae',
      strategy: 'Formaliser les procédures et contrôles',
      advice: 'Rédige chaque rôle, standardise chaque contrôle. La règle écrite traite chacun avec impartialité et protège l’organisation des caprices individuels.',
      right: 'La procédure a tourné comme une horloge : zéro favoritisme, zéro oubli, et l’entreprise a fonctionné sans dépendre d’un seul individu.',
      wrong: 'La paperasse a étouffé l’initiative : pendant qu’on remplissait les formulaires de validation, les opportunités du marché se sont envolées.',
      concept: 'alea_moral',
    },
    b: {
      thinker: 'graeber',
      name: 'David Graeber',
      emoji: '✊',
      color: '#c22f2f',
      strategy: 'Autonomie d’équipe et chasse aux corvées',
      advice: 'Fais confiance au bon sens de ton équipe : supprime les réunions stériles, les rapports que personne ne lit et les postes de pur contrôle. Ne garde que ce qui a du sens.',
      right: 'En supprimant les tâches bidon, l’énergie est revenue immédiatement : l’équipe s’est concentrée sur le vrai produit avec enthousiasme.',
      wrong: 'Sans cadrage ni mémoire écrite, chacun tirait à hue et à dia : les oublis bêtes et les rancœurs ont désorganisé la production.',
      concept: 'rente',
    },
    A: { fixed: 1.18, qualityDrift: 0.25, volatility: 0.65, incident: 0.01 },
    B: { fixed: 0.84, share: 1.06, qualityDrift: -0.15, incident: 0.05 },
    ownWay: 'Des fiches de poste claires, sans réunions de reporting hebdomadaires.',
  },

  // 2. Schumpeter ⟷ Zuboff : Innovation data vs Capitalisme de surveillance
  // Contexte d'équilibre : Schumpeter gagne sur les marchés de masse concurrentiels où la conquête rapide
  // de part de marché compense les frais fixes technologiques.
  // Zuboff gagne sur les marchés de proximité où la confiance, l'intégrité et les prix premium compensent une audience plus ciblée.
  {
    id: 'schumpeter_zuboff',
    title: 'L’Algorithme et la Vigie',
    question: 'Comment exploiter les données des clients ?',
    a: {
      thinker: 'schumpeter',
      name: 'Joseph Schumpeter',
      emoji: '⚡',
      color: '#f4a261',
      strategy: 'Ciblage algorithmique et monétisation des profils',
      advice: 'Exploite chaque donnée disponible : anticipe les besoins des clients, personnalise les offres et optimise les flux en temps réel. C’est la nouvelle frontière de l’innovation.',
      right: 'L’algorithme a frappé juste : chaque client a trouvé son produit avant même de le chercher. Le chiffre d’affaires s’est envolé.',
      wrong: 'La méfiance s’est installée : les clients se sont sentis pistés et ont fui vers des commerces plus transparents.',
      concept: 'effet_reseau',
    },
    b: {
      thinker: 'zuboff',
      name: 'Shoshana Zuboff',
      emoji: '👁️',
      color: '#9fb3c8',
      strategy: 'Protection absolue de la vie privée et confiance locale',
      advice: 'Refuse de transformer la vie des gens en matière première marchande. Pas de profilage, pas de revente de données : bâtis sur la confiance et le respect du consentement.',
      right: 'La réputation d’intégrité a payé : dans un monde saturé de traqueurs, les gens sont venus chez toi pour respirer en sécurité.',
      wrong: 'Dans le noir complet, tu n’as pas vu venir les ruptures de stock ni les changements de mode : les concurrents mieux informés ont pris l’avantage.',
      concept: 'asymetrie_information',
    },
    A: { market: 1.35, share: 1.15, fixed: 1.22, qualityDrift: -0.3, volatility: 1.3 },
    B: { price: 1.08, qualityDrift: 0.35, market: 0.88, volatility: 0.75 },
    ownWay: 'Un programme de fidélité anonymisé, géré sur un carnet sans traçage numérique.',
  },

  // 3. Polanyi ⟷ Hayek : Marché ré-encastré dans la société vs Marché autorégulé
  // Contexte d'équilibre : Polanyi gagne en période de crise et de turbulences macroéconomiques
  // où les pactes stables et la faible volatilité préservent l'activité.
  // Hayek gagne en période de reprise ou d'opportunités rapides où la réactivité totale des prix maximise la marge instantanée.
  {
    id: 'polanyi_hayek',
    title: 'L’Ancrage et le Signal',
    question: 'Comment réguler les prix et les contrats ?',
    a: {
      thinker: 'polanyi',
      name: 'Karl Polanyi',
      emoji: '⚓',
      color: '#2b6cb0',
      strategy: 'Pactes locaux et prix encastrés',
      advice: 'Le travail, la terre et la monnaie ne sont pas de simples marchandises. Passe des accords à prix stables avec les producteurs et les clients : protège la communauté des soubresauts du marché.',
      right: 'Pendant la tempête des cours, ton réseau est resté debout. Les producteurs protégés sont restés fidèles et les familles ont pu manger à leur faim.',
      wrong: 'Les cours mondiaux se sont effondrés et tu es resté coincé avec des prix garantis trop chers. La solidarité a coûté plus que la caisse ne pouvait payer.',
      concept: 'bien_public',
    },
    b: {
      thinker: 'hayek',
      name: 'Friedrich Hayek',
      emoji: '⏱️',
      color: '#7a6c9e',
      strategy: 'Tarification dynamique et liberté totale des prix',
      advice: 'Laisse les prix flotter librement à chaque minute. Le système des prix est un mécanisme de transmission de l’information que nul planificateur ne peut égaler. Adapte-toi instantanément.',
      right: 'Chaque variation a équilibré l’offre et la demande sans une seconde de retard : zéro pénurie, trésorerie optimisée au centime près.',
      wrong: 'Les clients ont crié à la spéculation quand les prix ont flambé au pire moment : le lien de confiance avec le quartier s’est brisé net.',
      concept: 'signal_prix',
    },
    A: { volatility: 0.5, qualityDrift: 0.3, cycle: 0.4, fixed: 1.1, unitCost: 1.04 },
    B: { unitCost: 0.92, fixed: 0.92, volatility: 1.8, qualityDrift: -0.2, cycle: 2.2 },
    ownWay: 'Une grille tarifaire saisonnière négociée deux fois par an en concertation avec les habitués.',
  },
];
