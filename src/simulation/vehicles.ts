/**
 * Véhicules du joueur. Pour l'instant : le vélo, accessible dès 12 ans (Vision §4.2).
 * Il fait gagner du temps en ville et augmente ce qu'on peut transporter (panier, sacoches).
 * État : `w.flags.velo` (1 = possédé) — pas de champ de sauvegarde supplémentaire ; la capacité
 * de transport vit déjà dans `economy.carryCapacity`.
 */
import type { WorldState } from '../core/types';
import { ensureEconomy } from './economy';
import { pushEvent } from './events';

export const BIKE = {
  name: 'Vélo de ville d’occasion (Cycles du Taret)',
  price: 85,
  /** Multiplicateur de vitesse en ville. */
  speedScale: 2.5,
  /** Unités transportables en plus (panier + sacoches). */
  extraCarry: 30,
} as const;

export function ownsBike(w: WorldState): boolean {
  return (w.flags['velo'] ?? 0) > 0;
}

/** Nouvelle partie : le vélo de la famille attend déjà dans le garage (gratuit). */
export function giveStarterBike(w: WorldState): void {
  if (ownsBike(w)) return;
  w.flags['velo'] = 1;
  ensureEconomy(w).carryCapacity += BIKE.extraCarry;
  pushEvent(w, {
    type: 'vie',
    title: 'Le vélo du garage',
    text: `Il dort au garage depuis l’été : un vieux vélo de ville, un peu grinçant mais solide. Appuie sur B pour monter ou descendre ; tu portes ${BIKE.extraCarry} unités de plus.`,
    causes: [{ facteur: 'famille', seuil: 'cadeau', poids: 1 }],
  });
}

export function buyBike(w: WorldState): { ok: boolean; message: string } {
  if (ownsBike(w)) return { ok: false, message: 'Tu as déjà un vélo.' };
  if (w.player.money < BIKE.price) return { ok: false, message: `Il faut ${BIKE.price} € (tu as ${w.player.money.toFixed(2)} €).` };
  w.player.money = Math.round((w.player.money - BIKE.price) * 100) / 100;
  w.flags['velo'] = 1;
  const e = ensureEconomy(w);
  e.carryCapacity += BIKE.extraCarry;
  pushEvent(w, {
    type: 'vie',
    title: 'Un vélo à toi',
    text: `Karim l’a remis en état aux Cycles du Taret. Tu traverses la ville bien plus vite et tu portes ${BIKE.extraCarry} unités de plus.`,
    causes: [{ facteur: 'achat', seuil: `${BIKE.price} €`, poids: 2 }],
  });
  return { ok: true, message: `Vélo acheté (${BIKE.price} €). Appuie sur B pour monter ou descendre.` };
}
