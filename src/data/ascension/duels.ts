/**
 * Les fantômes « double face » (docs/ASCENSION.md §2.2) : deux penseurs opposés dans une
 * seule silhouette. À chaque décision, chaque moitié défend une stratégie qui change
 * réellement la simulation ; le verdict dira qui avait raison, ici et maintenant.
 */
import { EXTRA_DUELS } from '../ascension_ext/duels';
import type { StrategyKey } from '../../core/ascension_types';

export interface DuelFace {
  /** Identifiant de penseur (fantôme du Conseil quand il existe). */
  thinker: string;
  name: string;
  emoji: string;
  color: string;
  /** Titre de la stratégie défendue. */
  strategy: string;
  /** Le conseil, dit par le fantôme. */
  advice: string;
  /** Réplique quand le verdict lui donne raison / tort. */
  right: string;
  wrong: string;
  /** Concept du carnet appris au verdict quand cette face gagne. */
  concept: string;
}

/**
 * Effets d'une stratégie sur la simulation d'une entreprise (src/simulation/ascension.ts).
 * Toutes les valeurs sont des multiplicateurs (1 = neutre) ou des écarts.
 */
export interface StrategyEffects {
  /** Coût des marchandises vendues. */
  unitCost: number;
  /** Coûts fixes du jour. */
  fixed: number;
  /** Part de marché visée. */
  share: number;
  /** Prix de vente (prime ou rabais). */
  price: number;
  /** Taille du marché atteignable. */
  market: number;
  /** Dérive quotidienne de la qualité (points). */
  qualityDrift: number;
  /** Amplification des aléas de demande. */
  volatility: number;
  /** Sensibilité au cycle économique (1 = normale) : voir grand paie en haut du cycle, coûte en bas. */
  cycle?: number;
  /** Production : « masse » (capacité fixe, invendus), « flux » (au plus juste, ruptures) ou libre. */
  stock?: 'masse' | 'flux';
  /** Part du coût de lancement empruntée (stratégie d'endettement). */
  borrow?: number;
  /** Niveau d'investissement de départ. */
  startLevel?: number;
  /** Risque quotidien d'incident (arrêts, conflits) qui coûte une journée de ventes. */
  incident?: number;
}

export interface DuelDef {
  id: string;
  title: string;
  /** Ce sur quoi porte la décision. */
  question: string;
  a: DuelFace;
  b: DuelFace;
  effects: Record<StrategyKey, StrategyEffects>;
  /** Troisième voie proposée au joueur. */
  ownWay: string;
}

const NEUTRAL: StrategyEffects = { unitCost: 1, fixed: 1, share: 1, price: 1, market: 1, qualityDrift: 0, volatility: 1 };

/** « À ma façon » : le juste milieu entre les deux moitiés. */
function blend(a: StrategyEffects, b: StrategyEffects): StrategyEffects {
  const m = (x: number, y: number): number => (x + y) / 2;
  return {
    unitCost: m(a.unitCost, b.unitCost), fixed: m(a.fixed, b.fixed), share: m(a.share, b.share), price: m(a.price, b.price),
    market: m(a.market, b.market), qualityDrift: m(a.qualityDrift, b.qualityDrift), volatility: m(a.volatility, b.volatility),
    cycle: a.cycle || b.cycle ? m(a.cycle ?? 1, b.cycle ?? 1) : undefined,
    borrow: a.borrow || b.borrow ? m(a.borrow ?? 0, b.borrow ?? 0) : undefined,
    incident: a.incident || b.incident ? m(a.incident ?? 0, b.incident ?? 0) : undefined,
  };
}

function duel(d: Omit<DuelDef, 'effects'> & { A: Partial<StrategyEffects>; B: Partial<StrategyEffects> }): DuelDef {
  const A = { ...NEUTRAL, ...d.A };
  const B = { ...NEUTRAL, ...d.B };
  const { A: _a, B: _b, ...rest } = d;
  return { ...rest, effects: { A, B, C: blend(A, B) } };
}

const BASE_DUELS: readonly DuelDef[] = [
  duel({
    id: 'ford_ohno', title: 'La Chaîne et le Kanban',
    question: 'Comment produire ?',
    a: {
      thinker: 'ford', name: 'Henry Ford', emoji: '🏭', color: '#3d5a80',
      strategy: 'Produire en masse',
      advice: 'Une grosse fournée, toujours la même, tous les jours. Plus tu en fais, moins chacune te coûte. Le client viendra : il vient toujours chercher ce qui est bon marché.',
      right: 'Tu vois ? La chaîne ne ment pas. Chaque pièce t’a coûté moins cher que la veille.',
      wrong: 'Des invendus… La chaîne n’aime pas qu’on lui demande moins. J’aurais dû mieux regarder la demande.',
      concept: 'economies_echelle',
    },
    b: {
      thinker: 'ohno', name: 'Taiichi Ohno', emoji: '🗂️', color: '#c44536',
      strategy: 'Juste-à-temps',
      advice: 'Ne produis que ce qu’on te demande, au moment où on te le demande. Le stock cache les problèmes comme l’eau cache les rochers.',
      right: 'L’eau a baissé, les rochers sont apparus, et tu les as contournés. Zéro gâchis.',
      wrong: 'Le jour de foule, tes étagères étaient vides. Le flux tendu demande des fournisseurs proches.',
      concept: 'juste_a_temps',
    },
    A: { unitCost: 0.74, fixed: 1.12, stock: 'masse' },
    B: { unitCost: 0.97, fixed: 0.95, stock: 'flux' },
    ownWay: 'Un stock de sécurité raisonnable, ajusté chaque semaine.',
  }),
  duel({
    id: 'smith_marx', title: 'La Main et le Poing',
    question: 'Comment partager la valeur ?',
    a: {
      thinker: 'smith', name: 'Adam Smith', emoji: '📊', color: '#ffc94a',
      strategy: 'Prix et salaires du marché',
      advice: 'Mon ami, paie ce que paie le marché et vends au prix du marché. Chacun y trouvera son compte, sans que tu aies à le décider.',
      right: 'Nul maître n’a ordonné ceci, et pourtant tout a fonctionné. La main invisible, mon ami.',
      wrong: 'Ton équipe est partie au premier concurrent venu… Je n’ai jamais promis la loyauté, seulement l’échange.',
      concept: 'main_invisible',
    },
    b: {
      thinker: 'marx', name: 'Karl Marx', emoji: '⚒️', color: '#ff5c7c',
      strategy: 'Partager les bénéfices',
      advice: 'Camarade, ceux qui font tourner l’affaire produisent plus que leur salaire. Rends-leur une part : ils travailleront pour eux, donc pour toi.',
      right: 'La valeur est restée chez ceux qui la créent, et ils l’ont fait fructifier. Je ne le dirai pas deux fois.',
      wrong: 'Ta marge a fondu avant que la motivation ne paie. Le temps manquait, pas la justice.',
      concept: 'plus_value',
    },
    A: { unitCost: 1, fixed: 1, qualityDrift: -0.12 },
    B: { unitCost: 1, fixed: 1.09, qualityDrift: 0.42, share: 1.03 },
    ownWay: 'Une prime aux meilleurs mois, rien de plus.',
  }),
  duel({
    id: 'keynes_hayek', title: 'Le Robinet et l’Horloge',
    question: 'Comment financer le lancement ?',
    a: {
      thinker: 'keynes', name: 'John Maynard Keynes', emoji: '🏦', color: '#5b8a72',
      strategy: 'Emprunter et voir grand',
      advice: 'Empruntez, mon cher, et ouvrez plus grand dès le départ. À long terme nous serons tous morts : la demande, c’est maintenant qu’il faut la servir.',
      right: 'Le robinet ouvert à temps a rempli la baignoire. L’argent dormant ne sert personne.',
      wrong: 'La demande n’a pas suivi, et les intérêts, eux, n’ont jamais dormi. Il faut savoir lire le cycle.',
      concept: 'demande_effective',
    },
    b: {
      thinker: 'hayek', name: 'Friedrich Hayek', emoji: '⏱️', color: '#7a6c9e',
      strategy: 'Grandir sur ses propres fonds',
      advice: 'Ne pariez pas l’argent que vous n’avez pas. Commencez petit, laissez les prix vous dire si vous avez raison, puis grandissez.',
      right: 'Pas de dette, pas de panique. L’horloge des prix a donné l’heure juste.',
      wrong: 'Trop prudent : d’autres ont pris la place pendant que vous comptiez vos sous.',
      concept: 'signal_prix',
    },
    A: { borrow: 0.8, startLevel: 2, fixed: 1.2, share: 0.9, cycle: 3.2 },
    B: { fixed: 0.92, share: 0.97, cycle: 0.5 },
    ownWay: 'Un petit prêt, remboursé vite.',
  }),
  duel({
    id: 'taylor_dejours', title: 'Le Chronomètre et le Cœur',
    question: 'Comment organiser le travail ?',
    a: {
      thinker: 'taylor', name: 'Frederick W. Taylor', emoji: '⏲️', color: '#6b7a8f',
      strategy: 'Chronométrer chaque geste',
      advice: 'Il y a une seule meilleure façon de faire chaque tâche. Trouve-la, écris-la, impose-la. Chaque seconde gagnée est de l’argent.',
      right: 'Les gestes standard ont fait tomber les coûts. La méthode, toujours la méthode.',
      wrong: 'Les arrêts maladie et les erreurs ont mangé tes secondes gagnées. Je n’avais pas chronométré la fatigue.',
      concept: 'organisation_scientifique',
    },
    b: {
      thinker: 'dejours', name: 'Christophe Dejours', emoji: '🫀', color: '#d1495b',
      strategy: 'Écouter le travail réel',
      advice: 'Ceux qui travaillent savent ce que la consigne ignore. Écoute-les, laisse-leur de la marge : la qualité vient de là.',
      right: 'Ton équipe a trouvé des solutions que personne n’avait écrites. C’est cela, travailler.',
      wrong: 'Plus lent et plus cher, oui. La reconnaissance paie, mais pas toujours avant la fin du mois.',
      concept: 'souffrance_travail',
    },
    A: { unitCost: 0.88, qualityDrift: -0.35, incident: 0.04 },
    B: { unitCost: 1.04, qualityDrift: 0.35 },
    ownWay: 'Des process clairs, discutés chaque mois avec l’équipe.',
  }),
  duel({
    id: 'ricardo_raworth', title: 'La Balance et le Donut',
    question: 'Jusqu’où grandir ?',
    a: {
      thinker: 'ricardo', name: 'David Ricardo', emoji: '⚖️', color: '#2a9d8f',
      strategy: 'Se spécialiser et vendre loin',
      advice: 'Fais ce que tu fais relativement le mieux, et vends-le partout où on l’achète. Le marché lointain est plus grand que ta rue.',
      right: 'Spécialisation et échange : ton marché a triplé. Les chiffres ne mentent pas.',
      wrong: 'Le transport, les aléas lointains… L’échange a ses frictions, et tu les as toutes payées.',
      concept: 'avantage_comparatif',
    },
    b: {
      thinker: 'raworth', name: 'Kate Raworth', emoji: '🍩', color: '#e9a03b',
      strategy: 'Prospérer dans les limites',
      advice: 'Pas besoin de grandir à tout prix. Reste ancré ici, paie bien, abîme peu : on te le rendra en fidélité.',
      right: 'Dans le donut, on tient. Tes clients restent, tes prix aussi.',
      wrong: 'Le plafond était trop bas pour cette idée-là. Prospérer, c’est aussi oser.',
      concept: 'donut',
    },
    A: { market: 1.45, fixed: 1.3, unitCost: 1.06, volatility: 1.9 },
    B: { price: 1.06, qualityDrift: 0.2, volatility: 0.7 },
    ownWay: 'Grandir dans la région d’abord, le reste plus tard.',
  }),
  duel({
    id: 'schumpeter_ostrom', title: 'L’Éclair et la Clairière',
    question: 'Innover seul ou s’associer ?',
    a: {
      thinker: 'schumpeter', name: 'Joseph Schumpeter', emoji: '⚡', color: '#f4a261',
      strategy: 'Disrupter le marché',
      advice: 'Arrive avec quelque chose que personne n’a. Les vieux acteurs tomberont ; c’est le prix du progrès. Va vite.',
      right: 'L’éclair a frappé : le marché est à toi. Les anciens apprendront ou disparaîtront.',
      wrong: 'Trop tôt, trop cher. Même les orages ont leur saison.',
      concept: 'destruction_creatrice',
    },
    b: {
      thinker: 'ostrom', name: 'Elinor Ostrom', emoji: '🌳', color: '#4f772d',
      strategy: 'Mutualiser avec les autres',
      advice: 'Partage les outils et les coûts avec ceux qui font le même métier. Écrivez vos règles ensemble ; personne n’aura à porter seul les mauvais jours.',
      right: 'La clairière a tenu. Les règles choisies ensemble ont fait mieux que la course.',
      wrong: 'À plusieurs, on va loin… mais pas vite. Ici, la vitesse comptait.',
      concept: 'communs',
    },
    A: { share: 1.45, fixed: 1.3, qualityDrift: -0.1, volatility: 1.4 },
    B: { share: 0.9, fixed: 0.7, qualityDrift: 0.1, volatility: 0.8 },
    ownWay: 'Une nouveauté, lancée avec deux partenaires de confiance.',
  }),
];

/** Doubles faces d'Antigravity (workflow AG-2) : Weber ⟷ Graeber, Schumpeter ⟷ Zuboff, Polanyi ⟷ Hayek. */
export const DUELS: readonly DuelDef[] = [...BASE_DUELS, ...EXTRA_DUELS.filter((x) => !BASE_DUELS.some((b) => b.id === x.id)).map((d) => duel(d))];

export const DUEL_BY_ID: Readonly<Record<string, DuelDef>> = Object.fromEntries(DUELS.map((d) => [d.id, d]));
