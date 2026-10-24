/**
 * Allure des coéquipiers dans la cinématique des toits (fin du chapitre 1), sans Three.js pour
 * rester testable. Les amis partent de l'apparence du joueur (couleur de tenue, morphologie…),
 * mais tout ce qui fait sa personnalisation V13 (silhouette, accessoires, couleurs du bas, des
 * chaussures et des accessoires) est remis à zéro avant d'appliquer leur propre look.
 */
import type { PlayerAppearance, PlayerGender } from '../../core/types';

export interface FriendLook {
  gender: PlayerGender;
  look: Partial<PlayerAppearance>;
  color: string;
}

/** Allure des coéquipiers sur les toits (distincte du joueur). */
export const FRIEND_LOOKS: Record<string, FriendLook> = {
  noah: { gender: 'garcon', look: { hairStyle: 'degrade', hairColor: 'noir', skinTone: 'ambree', outfitStyle: 'streetwear', glasses: 'aucune', accessory: 'casquette', gear: ['casquette'] }, color: '#4ea1ff' },
  lina: { gender: 'fille', look: { hairStyle: 'queue', hairColor: 'roux', skinTone: 'rosee', outfitStyle: 'ecolier', glasses: 'rondes', accessory: 'aucun', gear: [] }, color: '#5cd6e8' },
};

/** Apparence d'un ami : base du joueur sans ses choix personnels, puis le look de l'ami. */
export function friendAppearance(player: PlayerAppearance, look: Partial<PlayerAppearance>): PlayerAppearance {
  return {
    ...player,
    model: undefined,
    gear: undefined,
    gearColors: undefined,
    bottomColor: undefined,
    shoesColor: undefined,
    ...look,
  };
}
