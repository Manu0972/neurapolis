/**
 * Voyages depuis la gare de Val-Ferrand (Bible §10 : découvertes culturelle, économique,
 * intellectuelle et relationnelle). Pendant le séjour, le temps passe (ellipse côté
 * présentation) ; les commerces continuent de tourner avec leurs employés.
 *
 * État : `w.flags.voyageRetour` (tick de retour, 0 = à Val-Ferrand), `w.flags.voyagesFaits`,
 * et `w.flags['voyage:<id>']` (séjours effectués par destination) — pas de champ de sauvegarde ajouté.
 */
import type { Notification, SkillId, WorldState } from '../core/types';
import { TICKS_PER_DAY } from '../core/types';
import { dayIndexOf, isVacances } from '../core/clock';
import { addXp } from './skills';
import { discoverNotion } from './notions';
import { notify, pushEvent } from './events';

export interface DestinationDef {
  id: string;
  name: string;
  subtitle: string;
  days: number;
  cost: number;
  /** Ce qu'on y découvre (Bible §10). */
  discovery: string;
  skill: SkillId;
  xp: number;
  notion?: string;
}

/** Territoires du lore (2.pdf, fiches de territoires) devenus destinations de voyage. */
export const DESTINATIONS: readonly DestinationDef[] = [
  {
    id: 'neobaie', name: 'Néo-Baie', subtitle: 'la métropole à deux vitesses', days: 3, cost: 45,
    discovery: 'Le port, la tour Vertex, les Trois Cimes : une ville où la tech enrichit le centre pendant que les livreurs des plateformes courent pour quelques euros. Tu observes comment les commerces de quartier y survivent… ou pas.',
    skill: 'negociation', xp: 2, notion: 'prix_rarete',
  },
  {
    id: 'plateaublanc', name: 'Plateau Blanc', subtitle: 'ceux qui restent', days: 4, cost: 30,
    discovery: 'Trois hameaux soudés, une école de 42 élèves, un maire qui est aussi le facteur. Ici, chaque service compte double : tu comprends ce que veut dire « coopérer pour tenir ».',
    skill: 'organisation', xp: 2, notion: 'alliances_durables',
  },
  {
    id: 'ilesaphir', name: 'Île Saphir', subtitle: 'autonomie sous tension', days: 5, cost: 120,
    discovery: 'Une île autonome en énergie mais suspendue à un câble sous-marin vétuste. Tu mesures ce que coûte une dépendance… et ce que vaut une décision prise à temps.',
    skill: 'recherche', xp: 3, notion: 'prevision_incertaine',
  },
];

export const DESTINATION_BY_ID: Readonly<Record<string, DestinationDef>> = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));

export function isTraveling(w: WorldState): boolean {
  return (w.flags['voyageRetour'] ?? 0) > w.time.tick;
}

/**
 * Sur place : le train est arrivé et aucune ellipse n'est en cours. Le joueur explore la
 * destination ; le temps n'avance que quand il agit (une activité = une demi-journée).
 * `w.flags.voyageAvance` = tick jusqu'auquel le temps file en accéléré ;
 * `w.flags.voyageSlots` = demi-journées restantes ; `w.flags['voyageAct:<id>']` = n° du séjour.
 */
export function isOnSite(w: WorldState): boolean {
  return isTraveling(w) && w.time.tick >= (w.flags['voyageAvance'] ?? 0);
}

export function currentDestination(w: WorldState): DestinationDef | undefined {
  return isTraveling(w) ? DESTINATIONS[(w.flags['voyageEnCours'] ?? 0) - 1] : undefined;
}

/** Demi-journée sur place, en ticks. */
export const HALF_DAY_TICKS = TICKS_PER_DAY / 2;
/** Trajet en train, en ticks (3 h). */
export const TRAIN_TICKS = 18;

export interface TravelActivity {
  id: string;
  dest: string;
  icon: string;
  title: string;
  text: string;
  /** Coût (négatif = gain). */
  cost: number;
  skill?: SkillId;
  xp?: number;
  stress?: number;
  moral?: number;
  reputation?: number;
  /** Effet durable acquis la première fois (drapeau du monde). */
  flag?: string;
  flagText?: string;
  /** Personne rencontrée sur place. */
  host: string;
}

export const TRAVEL_ACTIVITIES: readonly TravelActivity[] = [
  {
    id: 'nb_marche_port', dest: 'neobaie', icon: '🐟', host: 'Leïla, criée du port',
    title: 'Négocier à la criée du port',
    text: 'Tu suis Leïla à la criée de 5 h. Les prix tombent en quelques secondes : tu repères un grossiste qui livre aussi les petits commerces de province.',
    cost: 0, skill: 'negociation', xp: 2, flag: 'fournisseurNeoBaie', flagText: 'Grossiste du port : −5 % sur toutes tes commandes.',
  },
  {
    id: 'nb_livraison', dest: 'neobaie', icon: '🛵', host: 'Yanis, livreur de plateforme',
    title: 'Faire une demi-journée de livraison',
    text: 'Sac isotherme, application qui note chaque minute de retard. Tu gagnes un peu d’argent et tu comprends pourquoi les livreurs parlent de « courir pour l’algorithme ».',
    cost: -32, skill: 'organisation', xp: 1, stress: 12, moral: -4,
  },
  {
    id: 'nb_vertex', dest: 'neobaie', icon: '🏙️', host: 'Mme Okafor, réseau des indépendants',
    title: 'Salon des indépendants (tour Vertex)',
    text: 'Badge à 15 €, café tiède, mais trois conversations utiles sur la façon dont les petites enseignes résistent aux plateformes.',
    cost: 15, skill: 'negociation', xp: 1, reputation: 2, moral: 4,
  },
  {
    id: 'pb_ferme', dest: 'plateaublanc', icon: '🧀', host: 'Odile, fromagère',
    title: 'Aider à la fromagerie coopérative',
    text: 'Traite, moulage, livraison au hameau voisin. Odile accepte de vendre ses tommes en circuit court à Val-Ferrand.',
    cost: 0, skill: 'organisation', xp: 2, stress: 4, moral: 6, flag: 'circuitCourtPlateau', flagText: 'Circuit court avec Plateau Blanc : réputation +4, confiance du quartier +3.',
  },
  {
    id: 'pb_ecole', dest: 'plateaublanc', icon: '📚', host: 'M. Aubrac, maire et facteur',
    title: 'Tenir la bibliothèque de l’école',
    text: 'Quarante-deux élèves, une classe unique. Tu lis aux petits et tu ranges les dons. On te remercie avec une soupe et une histoire du plateau.',
    cost: 0, skill: 'recherche', xp: 1, moral: 10, stress: -8,
  },
  {
    id: 'pb_marche', dest: 'plateaublanc', icon: '🧺', host: 'les trois hameaux',
    title: 'Tenir un stand au marché des hameaux',
    text: 'Tu vends confitures et œufs pour la coopérative. Peu de clients, mais chacun reste discuter.',
    cost: -18, skill: 'negociation', xp: 1, reputation: 1,
  },
  {
    id: 'is_centrale', dest: 'ilesaphir', icon: '🔋', host: 'Ingrid, technicienne réseau',
    title: 'Visiter la centrale et la conserverie',
    text: 'Batteries, éoliennes, et une conserverie qui fait durer chaque récolte. Ingrid t’explique comment l’île vit sans gaspiller, suspendue à un câble vieux de quarante ans.',
    cost: 0, skill: 'recherche', xp: 2, flag: 'conservationSaphir', flagText: 'Méthodes de conservation de l’île : tes produits frais se gardent un jour de plus.',
  },
  {
    id: 'is_peche', dest: 'ilesaphir', icon: '⛵', host: 'Tomas, pêcheur',
    title: 'Sortir en mer avec Tomas',
    text: 'Départ à l’aube, retour au vent. Tu rentres épuisé, salé, et étrangement calme.',
    cost: 10, moral: 12, stress: -15,
  },
  {
    id: 'is_conseil', dest: 'ilesaphir', icon: '🗳️', host: 'le conseil insulaire',
    title: 'Assister au conseil de l’île',
    text: 'Faut-il s’endetter pour un nouveau câble ou parier sur l’autonomie ? Le vote se joue à trois voix. Tu notes chaque argument.',
    cost: 0, skill: 'organisation', xp: 2, reputation: 1,
  },
];

export const ACTIVITY_BY_ID: Readonly<Record<string, TravelActivity>> = Object.fromEntries(TRAVEL_ACTIVITIES.map((a) => [a.id, a]));

export function activitiesAt(destId: string): TravelActivity[] {
  return TRAVEL_ACTIVITIES.filter((a) => a.dest === destId);
}

function tripNumber(w: WorldState): number {
  return (w.flags['voyagesFaits'] ?? 0) + 1;
}

export function activityDoneThisTrip(w: WorldState, id: string): boolean {
  return (w.flags[`voyageAct:${id}`] ?? 0) === tripNumber(w);
}

export function travelSlotsLeft(w: WorldState): number {
  return w.flags['voyageSlots'] ?? 0;
}

export function doTravelActivity(w: WorldState, id: string): { ok: boolean; message: string } {
  const a = ACTIVITY_BY_ID[id];
  const d = currentDestination(w);
  if (!a || !d || a.dest !== d.id) return { ok: false, message: 'Activité indisponible ici.' };
  if (!isOnSite(w)) return { ok: false, message: 'Le temps file : attends d’être sur place.' };
  if (travelSlotsLeft(w) <= 0) return { ok: false, message: 'Ton séjour touche à sa fin : il est temps de reprendre le train.' };
  if (activityDoneThisTrip(w, id)) return { ok: false, message: 'Déjà fait pendant ce séjour.' };
  if (a.cost > 0 && w.player.money < a.cost) return { ok: false, message: `Il faut ${a.cost} € (tu as ${w.player.money.toFixed(2)} €).` };
  const clamp = (v: number): number => Math.max(0, Math.min(100, v));
  w.player.money = Math.round((w.player.money - a.cost) * 100) / 100;
  if (a.skill && a.xp) addXp(w, a.skill, a.xp);
  if (a.stress) w.player.needs.stress = clamp(w.player.needs.stress + a.stress);
  if (a.moral) w.player.needs.moral = clamp(w.player.needs.moral + a.moral);
  if (a.reputation) w.player.reputation = clamp(w.player.reputation + a.reputation);
  let extra = '';
  if (a.flag && !(w.flags[a.flag] ?? 0)) {
    w.flags[a.flag] = 1;
    extra = ` ${a.flagText ?? ''}`;
    if (a.flag === 'circuitCourtPlateau') {
      w.player.reputation = clamp(w.player.reputation + 4);
      w.district.confianceQuartier = clamp(w.district.confianceQuartier + 3);
    }
    pushEvent(w, {
      type: 'opportunite',
      title: `${d.name} : ${a.title}`,
      text: `${a.text} ${a.flagText ?? ''}`,
      causes: [
        { facteur: `séjour à ${d.name}`, poids: 2 },
        { facteur: `rencontre : ${a.host}`, poids: 3 },
      ],
    });
  }
  w.flags[`voyageAct:${id}`] = tripNumber(w);
  const slots = travelSlotsLeft(w) - 1;
  w.flags['voyageSlots'] = slots;
  const back = w.flags['voyageRetour'] ?? w.time.tick;
  w.flags['voyageAvance'] = slots <= 0 ? back : Math.min(back, w.time.tick + HALF_DAY_TICKS);
  const money = a.cost < 0 ? ` +${-a.cost} €.` : a.cost > 0 ? ` −${a.cost} €.` : '';
  return { ok: true, message: `${a.title}.${money}${extra}` };
}

/** Reprendre le train : le reste du séjour passe en accéléré jusqu'au retour. */
export function leaveDestination(w: WorldState): { ok: boolean; message: string } {
  if (!isTraveling(w)) return { ok: false, message: 'Tu n’es pas en voyage.' };
  w.flags['voyageAvance'] = w.flags['voyageRetour'] ?? w.time.tick;
  w.flags['voyageSlots'] = 0;
  return { ok: true, message: 'Tu reprends le train pour Val-Ferrand.' };
}

/** Remise des fournisseurs (grossiste du port de Néo-Baie). */
export function travelSupplierDiscount(w: WorldState): number {
  return (w.flags['fournisseurNeoBaie'] ?? 0) > 0 ? 0.05 : 0;
}

/** Jours de conservation en plus (méthodes de l'Île Saphir). */
export function travelShelfBonus(w: WorldState): number {
  return (w.flags['conservationSaphir'] ?? 0) > 0 ? 1 : 0;
}


export function canTravel(w: WorldState, id: string): { ok: boolean; message: string } {
  const d = DESTINATION_BY_ID[id];
  if (!d) return { ok: false, message: 'Destination inconnue.' };
  if (isTraveling(w)) return { ok: false, message: 'Tu es déjà en voyage.' };
  const day = dayIndexOf(w.time.tick);
  if (w.player.age < 18 && !isVacances(day)) return { ok: false, message: 'Avant 18 ans, on part pendant les vacances scolaires.' };
  if (w.player.money < d.cost) return { ok: false, message: `Le voyage coûte ${d.cost} € (tu as ${w.player.money.toFixed(2)} €).` };
  return { ok: true, message: '' };
}

export function startTravel(w: WorldState, id: string): { ok: boolean; message: string } {
  const c = canTravel(w, id);
  if (!c.ok) return c;
  const d = DESTINATION_BY_ID[id]!;
  w.player.money = Math.round((w.player.money - d.cost) * 100) / 100;
  w.flags['voyageRetour'] = w.time.tick + d.days * TICKS_PER_DAY;
  w.flags['voyageEnCours'] = DESTINATIONS.indexOf(d) + 1;
  w.flags['voyageAvance'] = w.time.tick + TRAIN_TICKS;
  w.flags['voyageSlots'] = d.days * 2;
  return { ok: true, message: `En route pour ${d.name} (${d.days} jours). Tes commerces tournent avec tes employés.` };
}

/** À chaque tick : au retour, le voyage laisse ses traces (savoir-faire, notion, journal). */
export function travelTick(w: WorldState): Notification[] {
  const back = w.flags['voyageRetour'] ?? 0;
  if (back === 0 || w.time.tick < back) return [];
  const d = DESTINATIONS[(w.flags['voyageEnCours'] ?? 0) - 1];
  w.flags['voyageRetour'] = 0;
  w.flags['voyageEnCours'] = 0;
  w.flags['voyageAvance'] = 0;
  w.flags['voyageSlots'] = 0;
  if (!d) return [];
  w.flags['voyagesFaits'] = (w.flags['voyagesFaits'] ?? 0) + 1;
  w.flags[`voyage:${d.id}`] = (w.flags[`voyage:${d.id}`] ?? 0) + 1;
  addXp(w, d.skill, d.xp);
  if (d.notion && !w.player.notions[d.notion]) discoverNotion(w, d.notion);
  w.player.needs.stress = Math.max(0, w.player.needs.stress - 15);
  w.player.needs.moral = Math.min(100, w.player.needs.moral + 10);
  pushEvent(w, {
    type: 'decouverte',
    title: `Retour de ${d.name}`,
    text: d.discovery,
    causes: [
      { facteur: `voyage à ${d.name} (${d.subtitle})`, seuil: `${d.days} jours`, poids: 3 },
      { facteur: `savoir-faire : ${d.skill}`, seuil: `+${d.xp}`, poids: 2 },
    ],
  });
  return [notify('journal', `🧳 De retour de ${d.name}.`)];
}
