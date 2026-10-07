/**
 * Registre des objets de la chambre : le premier jeu de Claude Code et le grand lot
 * d'Antigravity (src/data/room/items.ts, branché le 2026-10-07). Le texte `how` d'Antigravity
 * dit l'histoire ; la condition d'arrivée (`UNLOCKS`) la traduit en faits du jeu.
 * Les doublons de sens avec le premier jeu sont écartés.
 */
import type { WorldState } from '../core/types';
import { STARTER_ITEMS, type StarterItem } from './room_starter';
import { ROOM_ITEMS as AG_ITEMS } from './room/items';

const tier = (w: WorldState): number => w.ascension?.tier ?? 1;
const contact = (w: WorldState, id: string): boolean => w.ascension?.contacts[id] !== undefined;
const concepts = (w: WorldState): number => Object.keys(w.ascension?.concepts ?? {}).length;
const ventures = (w: WorldState): number => Object.keys(w.ascension?.ventures ?? {}).length;
const venture = (w: WorldState, id: string): boolean => !!w.ascension?.ventures[id];
const flag = (w: WorldState, id: string): number => w.flags[id] ?? 0;
const stories = (w: WorldState): number => Object.keys(w.story?.seen ?? {}).length;
const shops = (w: WorldState): number => Object.keys(w.economy?.businesses ?? {}).length;
const leases = (w: WorldState): number => Object.keys(w.economy?.leases ?? {}).length;
/** Personnes réellement embauchées (le marché de l'emploi contient aussi des candidats). */
const employees = (w: WorldState): number => Object.values(w.economy?.businesses ?? {}).reduce((n, b) => n + b.employeeIds.length, 0);
const right = (w: WorldState, g: string): number => w.ascension?.trust[g]?.right ?? 0;

/** Conditions d'arrivée des objets d'Antigravity (absentes = doublon écarté). */
const UNLOCKS: Record<string, (w: WorldState) => boolean> = {
  room_classeur_cartes_holographiques: (w) => venture(w, 'cartes_collection'),
  room_boite_biscuits_vintage_bertin: (w) => contact(w, 'bertin'),
  room_boussole_scout_cuivre: (w) => concepts(w) >= 2,
  room_poste_radio_transistor: (w) => contact(w, 'karim'),
  room_enseigne_miniature_bois: (w) => shops(w) >= 1,
  room_calculatrice_ruban_comptable: (w) => tier(w) >= 2 && concepts(w) >= 4,
  room_tampon_encreur_commercial: (w) => leases(w) >= 1,
  room_caisse_monnayeur_acier: (w) => flag(w, 'busTrajets') >= 10,
  room_carte_murale_valferrand_1970: (w) => tier(w) >= 2 && stories(w) >= 2,
  room_lampe_architecte_articulee: (w) => flag(w, 'plansFaits') >= 3,
  room_bocal_echantillons_graines: (w) => contact(w, 'odile'),
  room_tableau_liege_organigramme: (w) => employees(w) >= 1,
  room_telecom_sans_fil_pro: (w) => tier(w) >= 3 && ventures(w) + shops(w) >= 3,
  room_lingot_acier_grave_souvenir: (w) => contact(w, 'samir') && w.player.age >= 15,
  room_trophee_jeune_artisan_agglomeration: (w) => tier(w) >= 3 && w.player.reputation >= 70,
  room_barometre_marine_laiton: (w) => tier(w) >= 3 && (w.ascension?.verdicts.length ?? 0) >= 3,
  room_cadenas_blinde_caisse_forte: (w) => tier(w) >= 3 && (leases(w) >= 2 || Object.keys(w.economy?.owned ?? {}).length >= 1),
  room_maquette_cargo_neo_baie: (w) => contact(w, 'leila'),
  room_carte_lumineuse_reseau_vallee: (w) => tier(w) >= 4,
  room_registre_cuir_grands_livres: (w) => tier(w) >= 4 && concepts(w) >= 8,
  room_medaille_merite_cooperatif: (w) => flag(w, 'laminoirChoix') === 1 || right(w, 'ostrom') >= 2,
  room_micro_studio_podcast_economie: (w) => contact(w, 'yasmine') && tier(w) >= 4,
  room_casque_antibruit_chantier_pro: (w) => contact(w, 'ingrid'),
  room_coffret_echantillons_metaux_rares: (w) => contact(w, 'taretcoop'),
  room_double_ecran_trader_bloomberg: (w) => tier(w) >= 5,
  room_fauteuil_cuir_direction_ergonomique: (w) => tier(w) >= 5 && concepts(w) >= 10,
  room_maquette_usine_zero_carbone: (w) => tier(w) >= 5 && right(w, 'raworth') >= 1,
  room_titre_actionnaire_fondateur_cadre: (w) => tier(w) >= 5 && ventures(w) >= 5,
  room_stylo_plume_or_accords_nationaux: (w) => tier(w) >= 5 && w.player.reputation >= 85,
  room_globe_terrestre_physique_retro_eclaire: (w) => tier(w) >= 5 && w.player.age >= 18,
  room_dictionnaire_philosophie_economique: (w) => stories(w) >= 10,
  room_terminal_maritime_satellite: (w) => tier(w) >= 6 && venture(w, 'import_export'),
  room_horloge_mondiale_quatre_fuseaux: (w) => tier(w) >= 6,
  room_sceau_cire_conglomerat_valferrand: (w) => tier(w) >= 6 && concepts(w) >= 15,
  room_legion_honneur_citoyenne: (w) => tier(w) >= 6 && w.player.reputation >= 95,
  room_maquette_fusee_materiaux_circulaires: (w) => tier(w) >= 6 && ventures(w) >= 8,
  room_arbre_genealogique_fondateurs_acier: (w) => tier(w) >= 6 && stories(w) >= 14,
  room_carnet_noir_notes_propres_joueur: (w) => w.player.age >= 18 && concepts(w) >= 12,
};

const fromAntigravity: StarterItem[] = AG_ITEMS.filter((i) => UNLOCKS[i.id]).map((i) => ({ ...i, unlock: UNLOCKS[i.id]! }));

export const ROOM_ITEMS: readonly StarterItem[] = [...STARTER_ITEMS, ...fromAntigravity];
export const ROOM_ITEM_BY_ID: Readonly<Record<string, StarterItem>> = Object.fromEntries(ROOM_ITEMS.map((i) => [i.id, i]));
