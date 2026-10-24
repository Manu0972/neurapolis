/**
 * Petits événements de quartier saisonniers sur la place du Marché (vague 14) : fête de la
 * rentrée, vide-grenier de la Toussaint, marché de Noël, marché d'été. Leurs dates se déduisent
 * du calendrier (src/simulation/happenings_saison.ts) : aucun hasard, aucun champ d'état.
 */
import type { GhostId } from '../core/types';

export type FeteId = 'rentree' | 'toussaint' | 'noel' | 'marche_ete';

export interface FeteQuartier {
  id: FeteId;
  name: string;
  icon: string;
  /** Quand elle a lieu, en clair (aide et tests). */
  quand: string;
  /** Heures d'ouverture [début, fin) en minutes depuis minuit. */
  hours: readonly [number, number];
  /** Annonce à l'ouverture (une fois par an). */
  annonce: string;
  /** Le joueur passe sur la place pendant la fête (une fois par an). */
  visite: string;
  /** Effet de la visite : on te voit, on te parle. */
  effet: { reputation: number; confiance: number };
  /** Fantôme qui glisse son mot à la visite. */
  ghost: GhostId;
}

export const FETES_QUARTIER: readonly FeteQuartier[] = [
  {
    id: 'rentree', name: 'Fête de la rentrée', icon: '🎒',
    quand: 'le premier samedi de septembre (après le 1er)',
    hours: [10 * 60, 18 * 60],
    annonce: 'Fête de la rentrée sur la place du Marché aujourd’hui (10 h – 18 h) : forum des associations, ateliers et goûter offert par la boulangerie.',
    visite: 'Tu fais le tour des stands de la fête de la rentrée : clubs, syndicats, apprentissages… Chacun cherche des bras, et plusieurs habitants retiennent ton prénom.',
    effet: { reputation: 2, confiance: 1 },
    ghost: 'bourdieu',
  },
  {
    id: 'toussaint', name: 'Vide-grenier de la Toussaint', icon: '🧺',
    quand: 'le dernier samedi d’octobre (vacances de la Toussaint)',
    hours: [8 * 60, 17 * 60],
    annonce: 'Vide-grenier de la Toussaint sur la place du Marché aujourd’hui (8 h – 17 h) : on y vend ce qu’on n’utilise plus, et on y marchande beaucoup.',
    visite: 'Au vide-grenier, chaque objet a deux prix : celui du vendeur et celui de l’acheteur. Tu regardes les marchandages finir au milieu : c’est ça, un prix de marché.',
    effet: { reputation: 1, confiance: 1 },
    ghost: 'smith',
  },
  {
    id: 'noel', name: 'Marché de Noël', icon: '🎄',
    quand: 'du 12 au 23 décembre, chaque jour',
    hours: [10 * 60, 20 * 60],
    annonce: 'Le marché de Noël ouvre sur la place du Marché (chaque jour jusqu’au 23 décembre, 10 h – 20 h) : artisans de la vallée, chocolat chaud et chorale le samedi.',
    visite: 'Au marché de Noël, les artisans de la vallée vendent en direct : bougies, jouets en bois, miel. Sans intermédiaire, ils gardent toute la marge, mais ils tiennent le stand eux-mêmes.',
    effet: { reputation: 1, confiance: 2 },
    ghost: 'marx',
  },
  {
    id: 'marche_ete', name: 'Marché d’été', icon: '🍑',
    quand: 'les vendredis de juillet et d’août, en soirée',
    hours: [17 * 60, 22 * 60],
    annonce: 'Marché d’été ce soir sur la place du Marché (17 h – 22 h) : producteurs des collines, limonade artisanale et musique sous les platanes.',
    visite: 'Au marché d’été, les mirabelles sont moins chères qu’au Drive HyperVal en août, et plus chères en juin : c’est la saison qui fait le prix.',
    effet: { reputation: 1, confiance: 1 },
    ghost: 'raworth',
  },
];

export const FETE_BY_ID: Readonly<Record<FeteId, FeteQuartier>> = Object.fromEntries(
  FETES_QUARTIER.map((f) => [f.id, f]),
) as Record<FeteId, FeteQuartier>;
