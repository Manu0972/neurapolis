/**
 * Les six lieux du quartier et leurs actions contextuelles (intérieurs simplifiés M2).
 * Chaque action porte des conséquences chiffrées : besoins et/ou argent —
 * règle « aucune statistique sans conséquence ».
 */
import type { Needs, PlaceId, SkillId } from '../core/types';

export interface PlaceAction {
  id: string;
  label: string;
  money?: number;          // coût (<0) ou gain (>0), en €
  needs?: Partial<Needs>;  // deltas de besoins (bornés 0-100 par le moteur)
  skill?: SkillId;         // compétence pratiquée (XP par pratique, M3)
  xp?: number;             // XP gagnés (1 par défaut)
}

export interface PlaceDef {
  id: PlaceId;
  name: string;
  description: string;
  actions: PlaceAction[];
}

export const PLACES: PlaceDef[] = [
  {
    id: 'maison',
    name: 'Chez toi',
    description: 'Ton appartement, rue des Roses. Le frigo, ton lit, et le calme pour réfléchir.',
    actions: [
      { id: 'gouter', label: 'Manger un en-cas', needs: { faim: -20 } },
      { id: 'sieste', label: 'Faire une sieste', needs: { fatigue: -20, faim: 5 } },
      { id: 'telephone', label: 'Trainer sur le téléphone', needs: { moral: 4, fatigue: 2 } },
    ],
  },
  {
    id: 'college',
    name: 'Collège des Roses',
    description: 'Les cours, les récrés, et Mme Moreau qui surveille d’un œil. Toute la bande y passe.',
    actions: [
      { id: 'reviser', label: 'Réviser en salle d’étude', needs: { fatigue: 10, stress: 5, faim: 5 }, skill: 'organisation', xp: 1 },
    ],
  },
  {
    id: 'epicerie',
    name: 'Épicerie Bertin',
    description: 'La petite épicerie de Mme Bertin, assiégée par le drive de la grande surface.',
    actions: [
      { id: 'gouter', label: 'Acheter un goûter (1 €)', money: -1, needs: { faim: -20, moral: 5 }, skill: 'comptabilite', xp: 1 },
    ],
  },
  {
    id: 'friche',
    name: 'Friche Taret',
    description: '38 hectares où l’usine tournait jour et nuit. Aujourd’hui : ronces, murs tagués et projets.',
    actions: [
      { id: 'explorer', label: 'Explorer la friche', needs: { fatigue: 10, moral: 5, stress: 5 }, skill: 'technique', xp: 1 },
    ],
  },
  {
    id: 'parc',
    name: 'Parc des Roses',
    description: 'Les pelouses, le banc des anciens et la rampe où Noah essaie ses nouvelles figures.',
    actions: [
      { id: 'jouer', label: 'Jouer avec les copains', needs: { fatigue: 10, moral: 10, faim: 5 }, skill: 'communication', xp: 1 },
    ],
  },
  {
    id: 'place',
    name: 'Place du marché',
    description: 'Le cœur du quartier. On y croise tout le monde, et tout le monde y sait tout.',
    actions: [
      { id: 'flaner', label: 'Flâner sur la place', needs: { stress: -5, moral: 5 } },
      { id: 'debat', label: 'Participer au grand débat citoyen' },
    ],
  },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<PlaceId, PlaceDef>;

export const NEED_LABELS: Record<keyof Needs, string> = {
  fatigue: 'Fatigue',
  faim: 'Faim',
  stress: 'Stress',
  moral: 'Moral',
};
