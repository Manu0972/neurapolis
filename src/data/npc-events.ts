/** Réactions des habitants aux faits de quartier qu’ils peuvent apprendre. */
import type { NpcId } from '../core/types';

export interface NpcEventReaction {
  npcId: NpcId;
  eventTitlePrefix: string;
  topic: string;
  line: string;
}

/**
 * Les répliques ne sont proposées qu’après mémorisation de l’événement. Cette
 * couche de récit ne modifie pas des jauges de stress/moral qui n'ont pas encore
 * de conséquences de jeu définies pour ces habitants.
 */
export const NPC_EVENT_REACTIONS: readonly NpcEventReaction[] = [
  { npcId: 'bertin', eventTitlePrefix: 'Mme Bertin envisage de fermer', topic: 'quartier', line: 'Je pensais vraiment baisser le rideau… Les courses du quartier m’ont fait tenir.' },
  { npcId: 'monique', eventTitlePrefix: 'Mme Bertin envisage de fermer', topic: 'epicerie', line: 'J’ai eu peur de perdre l’épicerie. Pour certains, c’est le dernier commerce à portée de pas.' },
  { npcId: 'bertin', eventTitlePrefix: 'L’épicerie embauche', topic: 'quartier', line: 'J’ai pu embaucher quelqu’un. Ça faisait longtemps que je ne pouvais plus le dire.' },
  { npcId: 'noah', eventTitlePrefix: 'L’épicerie embauche', topic: 'projet', line: 'Mme Bertin a embauché ! Les courses ont vraiment aidé, on devrait continuer.' },
  { npcId: 'noah', eventTitlePrefix: 'Vente au stand —', topic: 'projet', line: 'Notre stand a vendu pour de vrai. On pourrait trouver une idée pour la prochaine fois.' },
  { npcId: 'yasmine', eventTitlePrefix: 'Vente au stand —', topic: 'quartier', line: 'Tout le monde parle de votre vente. Maintenant, il faut voir ce que vous faites des gains.' },
  { npcId: 'noah', eventTitlePrefix: 'Chapitre 3 accompli : Le quartier fait front', topic: 'projet', line: 'On l’a fait ensemble. Le quartier a vu qu’on pouvait s’organiser pour de vrai.' },
  { npcId: 'samir', eventTitlePrefix: 'Chapitre 3 accompli : Le quartier fait front', topic: 'coop', line: 'Vous avez soutenu le quartier par des actes. C’est comme ça qu’une coopération commence.' },
  { npcId: 'yasmine', eventTitlePrefix: 'Chapitre 3 accompli : Le quartier fait front', topic: 'quartier', line: 'Cette fois, ce n’était pas une rumeur : les habitants ont vraiment fait front ensemble.' },
];
