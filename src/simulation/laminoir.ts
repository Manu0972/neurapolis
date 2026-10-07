/**
 * Après la fermeture du laminoir Taret (2032, chronologie du monde), Karim et TaretCoop
 * proposent trois avenirs. Le choix du joueur transforme le quartier (VISION §3.2).
 * État : `w.flags.laminoirFerme` (1 = fermé), `w.flags.laminoirChoix` (1, 2 ou 3).
 */
import type { WorldState } from '../core/types';
import { pushEvent } from './events';

export type LaminoirFuture = 'cooperative' | 'logistique' | 'tiers_lieu';

export interface LaminoirOption {
  id: LaminoirFuture;
  title: string;
  text: string;
  cost: number;
  /** Conditions de soutien du quartier. */
  minReputation: number;
}

export const LAMINOIR_OPTIONS: readonly LaminoirOption[] = [
  {
    id: 'cooperative', title: 'Reprise ouvrière en coopérative (TaretCoop)',
    text: 'Les anciens salariés rachètent l’outil avec Karim. Tu apportes une mise de départ et ta crédibilité. Moins de profits rapides, des emplois qui restent ici.',
    cost: 2000, minReputation: 60,
  },
  {
    id: 'logistique', title: 'Rachat par HyperVal (entrepôt logistique)',
    text: 'Le Drive rachète le site pour en faire un entrepôt. Quelques emplois reviennent vite, mais la décision se prend ailleurs et le Drive se renforce.',
    cost: 0, minReputation: 0,
  },
  {
    id: 'tiers_lieu', title: 'Reconversion en tiers-lieu (ateliers, culture, marché couvert)',
    text: 'La halle devient un lieu partagé : ateliers d’artisans, salle de concert, marché du samedi. Peu d’emplois industriels, beaucoup de vie.',
    cost: 500, minReputation: 45,
  },
];

export function laminoirDecisionPending(w: WorldState): boolean {
  return (w.flags['laminoirFerme'] ?? 0) === 1 && !(w.flags['laminoirChoix'] ?? 0);
}

export function chooseLaminoirFuture(w: WorldState, id: LaminoirFuture): { ok: boolean; message: string } {
  if (!laminoirDecisionPending(w)) return { ok: false, message: 'Aucune décision en attente sur le laminoir.' };
  const opt = LAMINOIR_OPTIONS.find((o) => o.id === id);
  if (!opt) return { ok: false, message: 'Option inconnue.' };
  if (w.player.reputation < opt.minReputation) return { ok: false, message: `Il faut une réputation de ${opt.minReputation} pour porter ce projet (tu es à ${w.player.reputation}).` };
  if (w.player.money < opt.cost) return { ok: false, message: `Il faut apporter ${opt.cost} € (tu as ${w.player.money.toFixed(2)} €).` };
  w.player.money = Math.round((w.player.money - opt.cost) * 100) / 100;
  const d = w.district;
  const clamp = (v: number): number => Math.max(0, Math.min(100, v));
  if (id === 'cooperative') {
    d.confianceQuartier = clamp(d.confianceQuartier + 12);
    d.vitaliteEpicerie = clamp(d.vitaliteEpicerie + 8);
    w.player.reputation = clamp(w.player.reputation + 5);
  } else if (id === 'logistique') {
    d.vitaliteEpicerie = clamp(d.vitaliteEpicerie + 3);
    d.confianceQuartier = clamp(d.confianceQuartier - 5);
    const rival = w.rivals?.drive_hyper;
    if (rival) rival.marketShare = clamp(rival.marketShare + 5);
  } else {
    d.confianceQuartier = clamp(d.confianceQuartier + 6);
    d.frequentationParc = clamp(d.frequentationParc + 5);
    w.player.needs.moral = clamp(w.player.needs.moral + 5);
  }
  w.flags['laminoirChoix'] = LAMINOIR_OPTIONS.indexOf(opt) + 1;
  pushEvent(w, {
    type: 'quartier',
    title: `Laminoir Taret : ${opt.title}`,
    text: opt.text,
    causes: [
      { facteur: 'fermeture du laminoir (2032)', poids: 3 },
      { facteur: 'choix du joueur', seuil: opt.cost > 0 ? `${opt.cost} € apportés` : 'sans apport', poids: 3 },
      { facteur: 'réputation dans le quartier', seuil: `${w.player.reputation}/100`, poids: 1 },
    ],
  });
  return { ok: true, message: opt.title };
}

/**
 * Effet durable du choix sur la fréquentation des commerces (simulateHour).
 * La Gare jouxte la halle : c'est là que le choix se sent le plus.
 */
export function laminoirDemand(w: WorldState, unitId: string): number {
  const choix = w.flags['laminoirChoix'] ?? 0;
  if (!choix) return 1;
  const gare = unitId.startsWith('gare_');
  if (choix === 1) return gare ? 1.15 : 1.05;  // coopérative : salaires qui restent au quartier
  if (choix === 2) return gare ? 1.05 : 1;     // entrepôt : un peu de passage, rien de plus
  return gare ? 1.2 : 1.03;                     // tiers-lieu : marché du samedi, concerts
}
