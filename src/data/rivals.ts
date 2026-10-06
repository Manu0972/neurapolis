/**
 * Données statiques des rivaux économiques et des contre-stratégies joueur.
 * Référence : Big Ambitions (concurrence réactive, prix, parts de marché)
 * adapté à l'univers de Val-Ferrand et au cadre de NEURAPOLIS.
 */
import type { CounterStrategyDef, RivalId, RivalState } from '../core/types';

export const INITIAL_RIVALS: Record<RivalId, RivalState> = {
  drive_hyper: {
    id: 'drive_hyper',
    name: 'Drive HyperVal',
    place: 'place',
    marketShare: 65,
    price: 1.10,
    quality: 45,
    aggressiveness: 60,
    strategy: 'prix_casse',
    activeCounterActions: [],
    reactionCooldown: 0,
    marketObservation: { day: 0, playerUnitsSold: 0, rivalUnitsServed: 0, sessions: 0, lastClosed: null },
  },
  distributeur_college: {
    id: 'distributeur_college',
    name: 'Distributeur Automatique Selecta Collège',
    place: 'college',
    marketShare: 55,
    price: 1.50,
    quality: 35,
    aggressiveness: 30,
    strategy: 'standard',
    activeCounterActions: [],
    reactionCooldown: 0,
    marketObservation: { day: 0, playerUnitsSold: 0, rivalUnitsServed: 0, sessions: 0, lastClosed: null },
  },
};

export const COUNTER_STRATEGIES: CounterStrategyDef[] = [
  {
    id: 'circuit_court',
    rivalId: 'drive_hyper',
    label: 'Approvisionnement local & circuit court',
    description: 'Négocier des produits frais auprès de producteurs du Val pour surclasser la qualité industrielle du Drive.',
    costMoney: 12,
    costTimeMinutes: 60,
    durationDays: 5,
    playerShareBonus: 15,
    rivalSharePenalty: 12,
    reputationBonus: 4,
  },
  {
    id: 'degustation',
    rivalId: 'drive_hyper',
    label: 'Dégustation conviviale sur la place',
    description: 'Offrir des échantillons et échanger avec les passants pour créer du lien que le drive ne peut pas offrir.',
    costMoney: 6,
    costTimeMinutes: 40,
    durationDays: 3,
    playerShareBonus: 10,
    rivalSharePenalty: 8,
    reputationBonus: 3,
  },
  {
    id: 'formule_recre',
    rivalId: 'distributeur_college',
    label: 'Formule goûter chaud à la récré',
    description: 'Proposer un goûter préparé et convivial aux collégiens, bien plus appétissant que les barres chocolatées dures du distributeur.',
    costMoney: 5,
    costTimeMinutes: 30,
    durationDays: 4,
    playerShareBonus: 18,
    rivalSharePenalty: 15,
    reputationBonus: 2,
  },
  {
    id: 'fidelite_quartier',
    rivalId: 'drive_hyper',
    label: 'Carte de fidélité solidaire',
    description: 'Fidéliser les habitués du quartier avec un 10e goûter offert ou reversé à l’épicerie.',
    costMoney: 8,
    costTimeMinutes: 40,
    durationDays: 6,
    playerShareBonus: 12,
    rivalSharePenalty: 10,
    reputationBonus: 5,
  },
];
