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
  return { ok: true, message: `En route pour ${d.name} (${d.days} jours). Tes commerces tournent avec tes employés.` };
}

/** À chaque tick : au retour, le voyage laisse ses traces (savoir-faire, notion, journal). */
export function travelTick(w: WorldState): Notification[] {
  const back = w.flags['voyageRetour'] ?? 0;
  if (back === 0 || w.time.tick < back) return [];
  const d = DESTINATIONS[(w.flags['voyageEnCours'] ?? 0) - 1];
  w.flags['voyageRetour'] = 0;
  w.flags['voyageEnCours'] = 0;
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
