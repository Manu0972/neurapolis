/**
 * Fonctionnalités à débloquer (docs/ASCENSION.md §3.2, lot ASC-3) : le téléphone s'étoffe à
 * mesure que le joueur prouve qu'il comprend. Chaque ouverture est présentée par un fantôme en
 * trois étapes (mini-tutoriel désactivable, src/data/tutorials.ts). Le mode bac à sable ouvre tout.
 * État : drapeaux `appli:<id>` (jour d'ouverture + 1) — pas de champ de sauvegarde ajouté.
 */
import type { Notification, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { notify } from './events';
import { provenProfit } from './ascension';
import { APP_TUTORIALS } from '../data/tutorials';

export type AppId = 'ascension' | 'infos' | 'commandes' | 'immobilier' | 'commerces' | 'emploi' | 'banque';

export interface AppUnlock {
  id: AppId;
  /** Comment l'obtenir (affiché sur l'icône verrouillée). */
  how: string;
  /** Fantôme qui la présente (mini-tutoriel : src/data/tutorials.ts, APP_TUTORIALS). */
  ghost: string;
  met: (w: WorldState) => boolean;
}

/** Ouvertes dès le début. */
export const STARTING_APPS: readonly AppId[] = ['ascension', 'infos', 'commandes'];

const leases = (w: WorldState): number => Object.keys(w.economy?.leases ?? {}).length;
const shops = (w: WorldState): number => Object.keys(w.economy?.businesses ?? {}).length;

/** « Première semaine de ventes » : une affaire qui vend depuis sept jours, un commerce qui a sept jours de caisse, ou 20 € gagnés. */
export function firstSalesWeek(w: WorldState): boolean {
  const day = dayIndexOf(w.time.tick);
  const ventureWeek = Object.values(w.ascension?.ventures ?? {}).some((r) => r.revenueTotal > 0 && day - r.launchedDay >= 7);
  const shopWeek = Object.values(w.economy?.businesses ?? {}).some((b) => b.history.filter((h) => h.revenue > 0).length >= 7);
  return ventureWeek || shopWeek || provenProfit(w) >= 20;
}

/** Une file d'attente a coûté des clients (10 perdus en un jour), ou une affaire a manqué des ventes faute de bras. */
export function queueCostCustomers(w: WorldState): boolean {
  const lostShop = Object.values(w.economy?.businesses ?? {}).some((b) => b.history.some((h) => h.lost >= 10));
  const missed = (w.ascension?.tier ?? 1) >= 2 && Object.values(w.ascension?.ventures ?? {})
    .some((r) => !r.closed && !!r.last && r.last.missed > 0.2 * Math.max(1, r.last.demand));
  return lostShop || missed;
}

export const APP_UNLOCKS: readonly AppUnlock[] = [
  {
    id: 'immobilier', ghost: 'smith',
    how: 'Une première semaine de ventes (une idée de l’Ascension qui tourne depuis 7 jours, ou 20 € gagnés).',
    met: (w) => firstSalesWeek(w) || leases(w) > 0,
  },
  {
    id: 'commerces', ghost: 'ohno',
    how: 'Signer ton premier bail (étal ou local), depuis l’application Immobilier.',
    met: (w) => leases(w) > 0 || shops(w) > 0,
  },
  {
    id: 'emploi', ghost: 'marx',
    how: 'Perdre des clients faute de bras (10 en un jour dans un commerce, ou des ventes manquées au Quartier), ou atteindre la Ville.',
    met: (w) => (w.ascension?.tier ?? 1) >= 3 || queueCostCustomers(w),
  },
  {
    id: 'banque', ghost: 'keynes',
    how: 'Découvrir le coût d’opportunité (dépenser, c’est renoncer), apprendre deux concepts, ou avoir 16 ans.',
    met: (w) => (w.player.notions['cout_opportunite']?.stage ?? 0) >= 1 || Object.keys(w.ascension?.concepts ?? {}).length >= 2 || w.player.age >= 16,
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
    const t = APP_TUTORIALS[a.id];
    // Le fantôme la présente en trois étapes (présentation : ghost-tutor.ts) ; ici, une ligne pour le journal.
    out.push(notify('info', `📱 Nouvelle application : ${t ? `${t.icon} ${t.label}` : a.id}. ${t ? 'Une voix te la présente.' : ''}`.trim(), a.ghost));
  }
  return out;
}
