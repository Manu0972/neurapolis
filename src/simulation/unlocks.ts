/**
 * Fonctionnalités à débloquer (docs/ASCENSION.md §3.2, lot ASC-3) : le téléphone s'étoffe à
 * mesure que le joueur prouve qu'il comprend. Chaque ouverture est présentée par un fantôme en
 * trois points (mini-tutoriel). Le mode bac à sable ouvre tout.
 * État : drapeaux `appli:<id>` (jour d'ouverture + 1) — pas de champ de sauvegarde ajouté.
 */
import type { Notification, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { notify } from './events';
import { provenProfit } from './ascension';

export type AppId = 'ascension' | 'infos' | 'commandes' | 'immobilier' | 'commerces' | 'emploi' | 'banque';

export interface AppUnlock {
  id: AppId;
  /** Comment l'obtenir (affiché sur l'icône verrouillée). */
  how: string;
  ghost: string;
  /** Mini-tutoriel en trois points, dit par le fantôme. */
  tips: [string, string, string];
  met: (w: WorldState) => boolean;
}

/** Ouvertes dès le début. */
export const STARTING_APPS: readonly AppId[] = ['ascension', 'infos', 'commandes'];

const leases = (w: WorldState): number => Object.keys(w.economy?.leases ?? {}).length;
const shops = (w: WorldState): number => Object.keys(w.economy?.businesses ?? {}).length;

export const APP_UNLOCKS: readonly AppUnlock[] = [
  {
    id: 'immobilier', ghost: 'smith',
    how: 'Gagner tes 20 premiers euros (une affaire de l’Ascension, le stand ou un petit boulot).',
    tips: [
      'Mon ami, chaque local a son loyer et son passage : un étal du marché coûte quelques euros par jour, une vitrine avenue Jean-Jaurès bien davantage.',
      'Avant 18 ans, tes parents se portent garants. Leur confiance est ta signature.',
      'Le meilleur emplacement est celui où passent tes clients, pas celui qui te plaît.',
    ],
    met: (w) => provenProfit(w) >= 20 || leases(w) > 0,
  },
  {
    id: 'commerces', ghost: 'ohno',
    how: 'Signer ton premier bail (étal ou local).',
    tips: [
      'Un commerce, c’est un flux : la marchandise entre, attend le moins possible, et sort.',
      'Ouvre seulement quand les rayons sont pleins et la caisse installée.',
      'Regarde chaque soir les clients perdus : ils te disent ce qui manque.',
    ],
    met: (w) => leases(w) > 0 || shops(w) > 0,
  },
  {
    id: 'emploi', ghost: 'marx',
    how: 'Perdre des clients faute de bras (10 clients perdus en un jour), ou atteindre le palier de la Ville.',
    tips: [
      'Camarade, un employé n’est pas un coût : c’est celui qui produit la valeur que tu vends.',
      'Un salaire sous le marché fait fuir les meilleurs ; une équipe à bout démissionne.',
      'Embauche quand la file d’attente te coûte plus cher qu’un salaire.',
    ],
    met: (w) => (w.ascension?.tier ?? 1) >= 3 || Object.values(w.economy?.businesses ?? {}).some((b) => b.history.some((h) => h.lost >= 10)),
  },
  {
    id: 'banque', ghost: 'keynes',
    how: 'Apprendre deux concepts d’économie, ou avoir 16 ans.',
    tips: [
      'Mon cher, un prêt achète du temps : ce que tu gagneras demain, tu peux l’utiliser aujourd’hui.',
      'Mais les intérêts tombent chaque nuit, que les clients viennent ou non.',
      'Emprunte pour produire, jamais pour boucher un trou.',
    ],
    met: (w) => Object.keys(w.ascension?.concepts ?? {}).length >= 2 || w.player.age >= 16,
  },
];

/** Ouverte si méritée (tout de suite) ; le fantôme la présente à la clôture du jour. */
export function isAppOpen(w: WorldState, id: AppId): boolean {
  if (w.economy?.sandbox || STARTING_APPS.includes(id)) return true;
  if ((w.flags[`appli:${id}`] ?? 0) > 0) return true;
  return !!unlockOf(id)?.met(w);
}

export function unlockOf(id: AppId): AppUnlock | undefined {
  return APP_UNLOCKS.find((a) => a.id === id);
}

/** Clôture du jour : les applications méritées s'ouvrent, chacune présentée par un fantôme. */
export function unlocksDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  for (const a of APP_UNLOCKS) {
    if (w.economy?.sandbox || (w.flags[`appli:${a.id}`] ?? 0) > 0 || !a.met(w)) continue;
    w.flags[`appli:${a.id}`] = day + 1;
    out.push(notify('fantome', `📱 Nouvelle application : ${a.id[0]!.toUpperCase()}${a.id.slice(1)}. ${a.tips.join(' ')}`, a.ghost));
  }
  return out;
}
