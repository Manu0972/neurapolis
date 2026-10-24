/**
 * Événements de quartier saisonniers sur la place du Marché (vague 14) : leurs dates viennent
 * du calendrier, sans hasard. À l'ouverture, une annonce (une fois par an) ; si le joueur passe
 * sur la place pendant la fête, un petit effet (réputation, confiance du quartier) une fois par an.
 *
 * État : un drapeau `fete:<id>:<année>` (bit 1 = annoncée, bit 2 = visitée). Pas de champ ajouté.
 */
import type { Notification, WorldState } from '../core/types';
import { dateOf, dayIndexOf, minutesOfDay } from '../core/clock';
import { PLACE_ANCHORS } from '../data/map';
import { FETES_QUARTIER, FETE_BY_ID, type FeteQuartier } from '../data/happenings_saison';
import { notify, pushEvent } from './events';
import { isSilenced } from './rewind';

/** Distance (tuiles) autour de l'ancre de la place où l'on est « à la fête ». */
export const FETE_RAYON = 10;

const ANNONCEE = 1;
const VISITEE = 2;

/** La fête de la place ce jour-là, quelle que soit l'heure (null sinon). */
export function feteDuJour(day: number): FeteQuartier | null {
  const { m, d, weekday } = dateOf(day);
  // Premier samedi après la rentrée du 1er septembre (2020 : samedi 5).
  if (m === 9 && weekday === 6 && d >= 2 && d <= 8) return FETE_BY_ID.rentree;
  // Dernier samedi d'octobre : pendant les vacances de la Toussaint.
  if (m === 10 && weekday === 6 && d >= 25) return FETE_BY_ID.toussaint;
  if (m === 12 && d >= 12 && d <= 23) return FETE_BY_ID.noel;
  if ((m === 7 || m === 8) && weekday === 5) return FETE_BY_ID.marche_ete;
  return null;
}

/** La fête en cours maintenant (jour et heures d'ouverture). */
export function feteEnCours(w: WorldState): FeteQuartier | null {
  const f = feteDuJour(dayIndexOf(w.time.tick));
  if (!f) return null;
  const min = minutesOfDay(w.time.tick);
  return min >= f.hours[0] && min < f.hours[1] ? f : null;
}

/** Prochaine fête à partir de ce jour (inclus), dans l'année qui vient. */
export function prochaineFete(day: number): { fete: FeteQuartier; day: number } | null {
  for (let k = day; k < day + 370; k++) {
    const fete = feteDuJour(k);
    if (fete) return { fete, day: k };
  }
  return null;
}

const cle = (w: WorldState, f: FeteQuartier): string => `fete:${f.id}:${dateOf(dayIndexOf(w.time.tick)).y}`;

/** Le joueur est-il sur la place (dehors, éveillé) ? */
function surLaPlace(w: WorldState): boolean {
  const a = PLACE_ANCHORS.place;
  return !w.player.asleep && Math.abs(w.player.pos.x - a.x) <= FETE_RAYON && Math.abs(w.player.pos.y - a.y) <= FETE_RAYON;
}

/**
 * Voix qui peut parler maintenant : déjà rencontrée (conseil actif ou penseur débloqué), ni
 * endormie ni tue par un retour en arrière. La voix préférée d'abord, sinon la première présente.
 */
export function voixPresente(w: WorldState, preferee?: string): string | undefined {
  const ghosts = w.council.ghosts as Record<string, { status: string; loyalty: number } | undefined>;
  const conseil = Object.entries(ghosts)
    .filter(([, g]) => g?.status === 'actif')
    .sort(([, a], [, b]) => (b?.loyalty ?? 0) - (a?.loyalty ?? 0))
    .map(([id]) => id);
  const premieres = w.ghostCompanion?.unlockedThinkers ?? ['smith'];
  const peutParler = (id: string): boolean => ghosts[id]?.status !== 'endormi' && !isSilenced(w, id);
  const presentes = [...new Set([...conseil, ...premieres])].filter(peutParler);
  if (preferee && presentes.includes(preferee)) return preferee;
  return presentes[0];
}

/** À chaque pas de temps : annonce à l'ouverture, puis visite si le joueur passe sur la place. */
export function fetesTick(w: WorldState): Notification[] {
  const f = feteEnCours(w);
  if (!f) return [];
  const key = cle(w, f);
  const state = w.flags[key] ?? 0;
  const out: Notification[] = [];
  let next = state;
  if ((state & ANNONCEE) === 0) {
    next |= ANNONCEE;
    // Comme les dépêches : une voix présente la glisse ; sans voix, le bandeau l'affiche.
    const voix = voixPresente(w);
    out.push(voix ? notify('info', `${f.icon} ${f.annonce}`, voix) : notify('journal', `${f.icon} ${f.annonce}`));
  }
  if ((state & VISITEE) === 0 && surLaPlace(w)) {
    next |= VISITEE;
    w.player.reputation = Math.min(100, w.player.reputation + f.effet.reputation);
    w.district.confianceQuartier = Math.min(100, w.district.confianceQuartier + f.effet.confiance);
    pushEvent(w, {
      type: 'quartier', title: `${f.name} sur la place`, text: f.visite,
      causes: [{ facteur: 'fête de quartier', poids: 1 }],
    });
    // Le fantôme de la fête seulement s'il est déjà là ; sinon une voix présente, ou le bandeau.
    const voix = voixPresente(w, f.ghost);
    out.push(voix ? notify('fantome', `${f.icon} ${f.visite}`, voix) : notify('journal', `${f.icon} ${f.visite}`));
  }
  if (next !== state) w.flags[key] = next;
  return out;
}

/** Toutes les fêtes (aide, tests). */
export { FETES_QUARTIER };
