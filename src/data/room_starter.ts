/**
 * Objets de la chambre : premier jeu, avec leur condition d'arrivée (le grand lot
 * d'Antigravity, src/data/room/items.ts, se branchera dans src/data/room_registry.ts).
 * Chaque objet raconte une étape ; certains aident un peu.
 */
import type { RoomItem } from '../core/room_types';
import type { WorldState } from '../core/types';

export interface StarterItem extends RoomItem {
  unlock: (w: WorldState) => boolean;
}

const a = (w: WorldState) => w.ascension;
const flag = (w: WorldState, id: string): number => w.flags[id] ?? 0;

export const STARTER_ITEMS: readonly StarterItem[] = [
  { id: 'photo_lucien', name: 'Photo de papy Lucien', icon: '🖼️', tier: 1, how: 'Là depuis toujours, sur la table de nuit.', lore: 'Lucien devant le haut-fourneau n° 2, en 1984. Au dos, au crayon : « Ceux qui lisent ensemble ne sont jamais seuls. »', unlock: () => true },
  { id: 'reveil', name: 'Vieux réveil à aiguilles', icon: '⏰', tier: 1, how: 'Aller en cours cinq fois.', lore: 'Il retarde de quatre minutes depuis 2009. Personne n’a jamais pensé à le régler.', bonus: { kind: 'organisation', value: 1 }, unlock: (w) => (w.family?.attended.length ?? 0) >= 5 },
  { id: 'tirelire', name: 'Tirelire en fonte', icon: '🐖', tier: 1, how: 'Lancer ta première affaire de l’Ascension.', lore: 'Un cochon en fonte trouvé à la ressourcerie. Il pèse plus lourd vide que plein.', unlock: (w) => Object.keys(a(w)?.ventures ?? {}).length >= 1 },
  { id: 'carnet_cuir', name: 'Carnet de comptes en cuir', icon: '📒', tier: 1, how: 'Apprendre trois concepts d’économie.', lore: 'Celui de Lucien, à moitié rempli de comptes de la bibliothèque du CE. Tu continues sur la page suivante.', bonus: { kind: 'recherche', value: 1 }, unlock: (w) => Object.keys(a(w)?.concepts ?? {}).length >= 3 },
  { id: 'tableau_liege', name: 'Tableau de liège', icon: '📌', tier: 1, how: 'Faire ton premier plan.', lore: 'Des punaises, des fils rouges, des post-it. Ta mère dit que ça ressemble à une série policière.', bonus: { kind: 'plan', value: 1 }, unlock: (w) => flag(w, 'plansFaits') >= 1 },
  { id: 'casque', name: 'Casque audio rafistolé', icon: '🎧', tier: 1, how: 'Tenir une semaine sans dépasser 60 de stress.', lore: 'Scotché deux fois. Le son ne passe que dans l’oreille gauche, celle qui écoute les voix le moins.', bonus: { kind: 'stress', value: 2 }, unlock: (w) => flag(w, 'joursCalmes') >= 7 },
  { id: 'carte_vallee', name: 'Carte de la vallée du Taret', icon: '🗺️', tier: 2, how: 'Atteindre le palier du Quartier.', lore: 'Une carte IGN de 1998, annotée de tes prospects. La friche y est encore marquée « Taret-Acier ».', unlock: (w) => (a(w)?.tier ?? 1) >= 2 },
  { id: 'souvenir_voyage', name: 'Souvenir de voyage', icon: '🧳', tier: 2, how: 'Revenir d’un voyage.', lore: 'Un galet de la criée, une tomme sèche ou un bout de câble : chaque voyage laisse sa trace sur l’étagère.', unlock: (w) => flag(w, 'voyagesFaits') >= 1 },
  { id: 'calculatrice', name: 'Calculatrice de Thierry', icon: '🧮', tier: 2, how: 'Avoir des parents fiers (fierté 70).', lore: 'Thierry s’en servait pour calculer ses heures sup à l’aciérie. Il te l’a donnée sans un mot.', bonus: { kind: 'negociation', value: 1 }, unlock: (w) => ((w.family?.parents.thierry.pride ?? 0) + (w.family?.parents.nora.pride ?? 0)) / 2 >= 70 },
  { id: 'ordinateur', name: 'Vieil ordinateur portable', icon: '💻', tier: 3, how: 'Atteindre le palier de la Ville.', lore: 'Racheté 80 € à un prof de techno. Il chauffe, il souffle, mais il fait tourner tes tableurs.', bonus: { kind: 'plan', value: 1 }, unlock: (w) => (a(w)?.tier ?? 1) >= 3 },
  { id: 'coupure_gazette', name: 'Coupure de La Gazette des Roses', icon: '📰', tier: 3, how: 'Atteindre 80 de réputation.', lore: '« Le petit génie des Roses » : l’article est punaisé au-dessus du lit, un peu jauni déjà.', unlock: (w) => w.player.reputation >= 80 },
  { id: 'maquette_usine', name: 'Maquette d’usine en carton', icon: '🏭', tier: 4, how: 'Atteindre le palier de la Vallée.', lore: 'La halle du laminoir, reconstituée en carton et en allumettes. Ton père la regarde parfois longtemps.', unlock: (w) => (a(w)?.tier ?? 1) >= 4 },
  { id: 'ecran_marches', name: 'Écran des marchés', icon: '📈', tier: 5, how: 'Atteindre le palier du Pays.', lore: 'Les cours défilent jour et nuit. Nora l’éteint quand tu dors.', bonus: { kind: 'recherche', value: 2 }, unlock: (w) => (a(w)?.tier ?? 1) >= 5 },
  { id: 'globe', name: 'Globe terrestre annoté', icon: '🌍', tier: 6, how: 'Atteindre le palier du Monde.', lore: 'Des punaises dans quarante pays. Une seule dans la vallée du Taret, plus grosse que les autres.', unlock: (w) => (a(w)?.tier ?? 1) >= 6 },
];
