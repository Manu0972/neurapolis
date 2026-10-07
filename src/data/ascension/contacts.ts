/**
 * Connexions (docs/ASCENSION.md §3.1) : les gens rencontrés tôt reviennent plus tard.
 * Une connexion se gagne par ce que le joueur a vraiment vécu (relations, petits boulots,
 * voyages, choix du laminoir) ; elle ouvre des idées ou les rend moins chères.
 */
import type { WorldState } from '../../core/types';

export interface ContactDef {
  id: string;
  name: string;
  /** Ce qu'elle est devenue, et ce qu'elle apporte. */
  role: string;
  /** Comment on l'a gagnée (affiché tant qu'elle manque). */
  how: string;
  met: (w: WorldState) => boolean;
}

const rel = (w: WorldState, id: string): number => {
  const r = w.player.relations[id];
  return r ? Math.max(r.amitie, r.confiance, r.respect) : 0;
};
/** Meilleure relation au départ (src/core/store.ts) : une connexion se gagne en jouant, pas d'office. */
const START: Record<string, number> = { noah: 78, lina: 55, yasmine: 45, karim: 35, samir: 40 };
const grew = (w: WorldState, id: string): boolean => rel(w, id) >= (START[id] ?? 0) + 15;
const flag = (w: WorldState, id: string): number => w.flags[id] ?? 0;

export const CONTACTS: readonly ContactDef[] = [
  { id: 'noah', name: 'Noah Martin', role: 'le copain qui connaît tout le monde ; plus tard, chef de ta logistique', how: 'Approfondir ton amitié avec Noah.', met: (w) => grew(w, 'noah') },
  { id: 'lina', name: 'Lina Kessler', role: 'la première de la classe ; plus tard, avocate d’affaires (franchises, contrats, international)', how: 'Gagner davantage la confiance de Lina.', met: (w) => grew(w, 'lina') },
  { id: 'yasmine', name: 'Yasmine Diallo', role: 'la curieuse du collège ; plus tard, journaliste qui fait ou défait une marque', how: 'Te rapprocher de Yasmine.', met: (w) => grew(w, 'yasmine') },
  { id: 'karim', name: 'Karim Bensalah', role: 'l’atelier vélo de la friche ; plus tard, ton partenaire industriel', how: 'Gagner le respect de Karim à la friche.', met: (w) => grew(w, 'karim') },
  { id: 'bertin', name: 'Mme Bertin', role: 'l’épicière ; son neveu tient un grossiste à Néo-Baie', how: 'Faire trois services à l’épicerie Bertin.', met: (w) => flag(w, 'jobShiftsDone') >= 3 },
  { id: 'samir', name: 'Samir Ould-Ali', role: 'l’ancien du laminoir ; il connaît chaque machine et chaque syndicaliste de la vallée', how: 'Gagner la confiance de Samir.', met: (w) => grew(w, 'samir') },
  { id: 'leila', name: 'Leïla, criée de Néo-Baie', role: 'négociante du port ; ta porte vers l’import-export', how: 'Négocier à la criée du port de Néo-Baie.', met: (w) => flag(w, 'fournisseurNeoBaie') > 0 },
  { id: 'odile', name: 'Odile, fromagère du Plateau Blanc', role: 'la coopérative des hameaux ; produits fermiers et circuits courts', how: 'Aider à la fromagerie de Plateau Blanc.', met: (w) => flag(w, 'circuitCourtPlateau') > 0 },
  { id: 'ingrid', name: 'Ingrid, technicienne d’Île Saphir', role: 'énergie, conserverie, autonomie : l’ingénieure qui voit loin', how: 'Visiter la centrale d’Île Saphir.', met: (w) => flag(w, 'conservationSaphir') > 0 },
  { id: 'okafor', name: 'Mme Okafor, réseau des indépendants', role: 'le carnet d’adresses des petites enseignes de Néo-Baie', how: 'Aller au salon des indépendants de la tour Vertex.', met: (w) => (flag(w, 'voyageAct:nb_vertex') > 0) },
  { id: 'taretcoop', name: 'TaretCoop', role: 'la coopérative ouvrière du laminoir ; des machines et des bras', how: 'Soutenir la reprise du laminoir en coopérative (2032).', met: (w) => flag(w, 'laminoirChoix') === 1 },
];

export const CONTACT_BY_ID: Readonly<Record<string, ContactDef>> = Object.fromEntries(CONTACTS.map((c) => [c.id, c]));
