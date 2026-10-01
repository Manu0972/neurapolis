/**
 * Données du Stand des Roses (contrat M5 §3) — le moteur (src/simulation/project.ts)
 * interprète ces chiffres, jamais l'inverse.
 * Économie : stock 15 € (20 unités), prix 0,5-2 €, demande = f(prix, réputation,
 * jour de semaine, météo), sessions d'1 h, courses 2 € (20 min), équipe Noah + Lina
 * (communication ≥ 2), répartition égalité / équité / incitation.
 */
import type { DoctrineKey, Meteo, RepartitionMode } from '../core/types';

export const STAND_CONFIG = {
  id: 'stand_des_roses',
  stockCost: 15,         // € par achat de stock
  stockUnits: 20,        // unités livrées par achat
  priceMin: 0.5,         // €/unité
  priceMax: 2,
  defaultPrice: 1,
  sessionMinutes: 60,    // session de vente : 1 h (récré ou place)
  courseFee: 2,          // € par course rendue à l'épicerie
  courseMinutes: 20,
  sessionPlaces: ['college', 'place'] as const, // récré ou place du marché
  recruitSkill: 'communication' as const,       // contrat M3 : convaincre = communication ≥ 2
  recruitMinLevel: 2,
  recruitables: ['noah', 'lina'] as const,      // l'équipe du contrat
} as const;

/** Demande par session : base (acheteurs à prix nul) − pente × prix, modulée. */
export const DEMAND_CONFIG = {
  baseAtZero: 26,        // acheteurs théoriques si le prix était nul
  slope: 12,             // −12 acheteurs par euro de plus
  reputationDivisor: 100, // facteur réputation = réputation / 100
  weekdayFactor: { 0: 1.3, 1: 1, 2: 1, 3: 1.15, 4: 1, 5: 1, 6: 1.3 } as Record<number, number>, // week-end +30 %, mercredi après-midi +15 %
  weatherFactor: { soleil: 1.2, nuages: 1, pluie: 0.6 } as Record<Meteo, number>, // contrat : +20 % / 0 / −40 %
} as const;

/** Les trois modes de répartition de fin de semaine et leurs conséquences. */
export const REPARTITION_CONFIG = {
  councilKey: { egalite: 'solidarite', equite: 'communs', incitation: 'marche' } as Record<RepartitionMode, DoctrineKey>,
  conflictChance: { egalite: 0.15, equite: 0.05, incitation: 0.35 } as Record<RepartitionMode, number>,
} as const;

/** Événements déclenchés par les sessions (déclencheurs G1/G2 du contrat §6). */
export const STAND_EVENTS = {
  distinctionWhenSoldOut: true, // tout vendu → distinction remarquée (bourdieu)
  corveeEveryNSessions: 3,      // toute 3e session réussie → corvée absurde (graeber)
} as const;

/** Incident de discipline au stand (hobbes + locke, §6) : vol/bagarre aléatoire. */
export const INCIDENT_CONFIG = {
  dailyChance: 0.04,      // par jour, équipe ≥ 2 membres
  stressJoueur: 10,
  stressMembres: 5,
  rivalite: 1,
} as const;

/** Règle imposée d'en haut : peut être contournée (hayek, §6). */
export const REGLE_IMPOSE = { failChance: 0.35 } as const;

/** Tentative d'optimisation du rendement (taylor, §6) — échec : illich (§6). */
export const OPTIMIZE = { failChance: 0.3, fatigue: 5, fatigueEchec: 8 } as const;

/** Vente du fichier clients (zuboff, §6). */
export const DATA_SALE = { gain: 10, reputationPenalty: 5 } as const;

/** Choix écologique coûteux (raworth, §6). */
export const ECO_CHOICE = { cost: 5, reputation: 2 } as const;

/** Contrat de Sécurité de Hobbes (M6 §3). */
export const SECURITY_CONFIG = {
  yieldBonus: 0.2,         // rendement +20 %
  weeklyAmitieCost: 2,     // amitié du groupe −2/semaine
  exitAmitieMin: 60,       // sortie : vote unanime ET amitié ≥ 60
} as const;

/** Taylor hostile (M6 §3) : sabotage du rendement et chronométrage des PNJ. */
export const TAYLOR_SABOTAGE = {
  yieldFactor: 0.85,       // rendement −15 %
  chronoStressPerDay: 2,   // stress des coéquipiers +2/jour
} as const;

/** Semaine > 40 h d'activités cumulées (rosa, §6). */
export const WEEK_HOURS_LIMIT = 40;
