/**
 * Cadence des fenêtres automatiques (arrivée d'un fantôme, dilemme surprise, vie du collège).
 *
 * Avant : une fenêtre fermée par ✕ restait « en attente » et se rouvrait une heure de jeu plus
 * tard (le Forum des métiers revenait toute la soirée). Désormais une fenêtre fermée sans choisir
 * se repose : une journée (une demi-journée pour un dilemme). Fermée une deuxième fois, la vie du
 * collège ou le dilemme est abandonné sans effet (le joueur a refusé) ; une voix du Conseil, elle,
 * reste accessible depuis le Conseil et ne revient d'elle-même que trois jours plus tard.
 *
 * État : drapeaux `fenetre:<type>:<id>:repos` (tick de fin de repos) et `fenetre:<type>:<id>:fermee`
 * (nombre de fermetures) — pas de changement de schéma. Déterministe : seul l'horloge du monde compte.
 */
import { TICKS_PER_DAY, type GhostId, type WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { councilPendingArrivals } from './council';
import { ensureHappenings, pendingSurprise } from './happenings';
import { pendingSchoolEvent } from './school_events';

export type FenetreAuto =
  | { kind: 'arrivee'; id: GhostId }
  | { kind: 'surprise'; id: string }
  | { kind: 'ecole'; id: string };

/** Repos après une fermeture sans choix (en ticks de 10 minutes). */
export const REPOS_APRES_FERMETURE: Record<FenetreAuto['kind'], number> = {
  arrivee: TICKS_PER_DAY,
  surprise: TICKS_PER_DAY / 2,
  ecole: TICKS_PER_DAY,
};
/** Une voix fermée deux fois de suite attend trois jours avant de se représenter seule. */
export const REPOS_ARRIVEE_INSISTANTE = 3 * TICKS_PER_DAY;
/** Vie du collège et dilemmes : la deuxième fermeture vaut refus (abandon sans effet). */
export const FERMETURES_AVANT_ABANDON = 2;

const cle = (f: FenetreAuto): string => `fenetre:${f.kind}:${f.id}`;

/** La fenêtre se repose-t-elle encore après une fermeture ? */
export function fenetreEnRepos(w: WorldState, f: FenetreAuto): boolean {
  return w.time.tick < (w.flags[`${cle(f)}:repos`] ?? 0);
}

/** Voix du Conseil dont la scène d'arrivée peut s'ouvrir maintenant. */
export function arriveesAProposer(w: WorldState): GhostId[] {
  return councilPendingArrivals(w).filter((id) => !fenetreEnRepos(w, { kind: 'arrivee', id }));
}

/** Dilemme surprise à proposer maintenant (identifiant stable : surprise + jour). */
export function surpriseAProposer(w: WorldState): FenetreAuto | null {
  const p = w.happenings?.pending;
  if (!p || !pendingSurprise(w)) return null;
  const f: FenetreAuto = { kind: 'surprise', id: `${p.surpriseId}@${p.day}` };
  return fenetreEnRepos(w, f) ? null : f;
}

/** Événement du collège à proposer maintenant. */
export function ecoleAProposer(w: WorldState): FenetreAuto | null {
  const e = pendingSchoolEvent(w);
  if (!e) return null;
  const f: FenetreAuto = { kind: 'ecole', id: e.id };
  return fenetreEnRepos(w, f) ? null : f;
}

/** La décision attend-elle toujours le joueur (sinon il a choisi) ? */
export function fenetreEncoreEnAttente(w: WorldState, f: FenetreAuto): boolean {
  if (f.kind === 'arrivee') return w.council.ghosts[f.id]?.arrivalPending === true;
  if (f.kind === 'ecole') return pendingSchoolEvent(w)?.id === f.id;
  const p = w.happenings?.pending;
  return !!p && `${p.surpriseId}@${p.day}` === f.id;
}

/**
 * Le joueur ferme la fenêtre (✕) sans choisir. Retourne ce qui arrive : `reportee` (elle
 * reviendra après son repos) ou `abandonnee` (refus : elle ne reviendra plus).
 */
export function fermerSansChoisir(w: WorldState, f: FenetreAuto): 'reportee' | 'abandonnee' {
  const n = (w.flags[`${cle(f)}:fermee`] ?? 0) + 1;
  w.flags[`${cle(f)}:fermee`] = n;
  if (f.kind === 'arrivee') {
    w.flags[`${cle(f)}:repos`] = w.time.tick + (n >= 2 ? REPOS_ARRIVEE_INSISTANTE : REPOS_APRES_FERMETURE.arrivee);
    return 'reportee';
  }
  if (n < FERMETURES_AVANT_ABANDON) {
    w.flags[`${cle(f)}:repos`] = w.time.tick + REPOS_APRES_FERMETURE[f.kind];
    return 'reportee';
  }
  // Refus : on retire la décision, sans effet. Le drapeau de repos n'est plus utile.
  delete w.flags[`${cle(f)}:repos`];
  if (f.kind === 'ecole') {
    w.flags[`ecole:${f.id}`] = dayIndexOf(w.time.tick) + 1; // vu : ne sera plus tiré
    w.flags['ecoleEnAttente'] = 0;
  } else {
    ensureHappenings(w).pending = undefined;
  }
  return 'abandonnee';
}

/**
 * Prise en main (vague 5) : pendant tout le chapitre 1, aucune fenêtre non scénarisée (arrivée
 * d'un fantôme, dilemme, vie du collège, rencontre, dîner) ne s'ouvre seule. Elles attendent :
 * la simulation continue, seule leur présentation est différée.
 */
export function fenetresCalmes(w: WorldState): boolean {
  return w.campaign.currentChapter === 1 && !w.campaign.completedChapters.includes(1);
}

/** Écart minimal (ticks) entre deux fenêtres automatiques. */
export const ECART_FENETRES = 6;
/** Au chapitre 2, elles reviennent une par demi-journée de jeu au plus (dévoilement progressif). */
export const ECART_FENETRES_CHAPITRE2 = TICKS_PER_DAY / 2;

export function ecartFenetres(w: WorldState): number {
  return w.campaign.currentChapter === 2 ? ECART_FENETRES_CHAPITRE2 : ECART_FENETRES;
}
