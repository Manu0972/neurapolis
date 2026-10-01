/**
 * Événements de vie quotidiens — seuils franchis une fois (once) et découvertes
 * de notions. Chaque événement porte facteurs/seuils/poids (journal des causes)
 * et peut modifier les relations 4D.
 */
import type { WorldState } from '../core/types';
import { pushEvent } from './events';
import { bestFriendId } from './relations';
import { notionTick } from './notions';
import { NPC_BY_ID } from '../data/npcs';

export function lifeTick(w: WorldState): void {
  // Irritabilité (§5) : la première fois que la fatigue dépasse 70,
  // l'amitié avec le meilleur ami en paie le prix.
  if (w.player.needs.fatigue > 70) {
    const friend = bestFriendId(w);
    const name = friend ? (NPC_BY_ID[friend]?.name ?? 'tes amis') : 'tout le monde';
    pushEvent(w, {
      type: 'consequence',
      title: 'À bout de nerfs',
      text: `La fatigue te rend irritable : tu t’es agacé contre ${name}, et ça s’est senti.`,
      causes: [{ facteur: 'fatigue', seuil: '70', poids: 3 }],
      once: 'fatigue70',
      relations: friend ? { [friend]: { amitie: -1 } } : undefined,
    });
  }
  notionTick(w);
}
