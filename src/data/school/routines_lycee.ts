/**
 * Routines des camarades quand le joueur est lycéen (vague 14). Au collège, la bande suit
 * `NPCS[].routine` (8 h 20 – 16 h 40). Au lycée Jean-Moulin, l'emploi du temps change :
 * cours de 8 h à 12 h et de 14 h à 17 h, self entre les deux, mercredi matin seulement
 * (src/simulation/family.ts, SESSIONS_LYCEE). Le reste de la journée garde les habitudes de
 * chacun, décalées d'autant.
 *
 * `semaine` : créneaux d'un jour ordinaire (ceux marqués `weekends` valent aussi le week-end).
 * `mercredi` : l'après-midi du mercredi en période scolaire (à partir de 12 h).
 * Les créneaux au lycée sont ignorés pendant les vacances, les jours fériés et le week-end.
 */
import type { NpcId, RoutineSlot } from '../../core/types';

export interface RoutineLycee {
  semaine: readonly RoutineSlot[];
  mercredi: readonly RoutineSlot[];
}

/** Début et fin des deux séances du lycée (minutes depuis minuit), mercredi matin seulement. */
export const LYCEE_COURS = { matin: [8 * 60, 12 * 60], apres: [14 * 60, 17 * 60] } as const;
/** Le mercredi, le lycée ferme à midi pour les élèves. */
export const LYCEE_MERCREDI_FIN = 12 * 60;

export const ROUTINES_LYCEE: Readonly<Record<NpcId, RoutineLycee>> = {
  noah: {
    semaine: [
      { from: '06:50', to: '08:00', place: 'maison', activity: 'avale son petit-déjeuner, le lycée commence tôt' },
      { from: '08:00', to: '12:00', place: 'lycee', activity: 'en cours de 2de' },
      { from: '12:00', to: '14:00', place: 'lycee', activity: 'self, puis croquis dans la cour' },
      { from: '14:00', to: '17:00', place: 'lycee', activity: 'en cours (arts plastiques le jeudi)' },
      { from: '17:00', to: '18:30', place: 'parc', activity: 'skate avec les copains' },
      { from: '18:30', to: '21:30', place: 'maison', activity: 'dessine chez lui', weekends: true },
    ],
    mercredi: [
      { from: '12:00', to: '13:30', place: 'maison', activity: 'déjeune chez lui' },
      { from: '13:30', to: '18:00', place: 'parc', activity: 'tourne une vidéo de skate' },
      { from: '18:00', to: '21:30', place: 'maison', activity: 'dessine chez lui' },
    ],
  },
  lina: {
    semaine: [
      { from: '06:45', to: '08:00', place: 'maison', activity: 'relit ses fiches au petit-déjeuner' },
      { from: '08:00', to: '12:00', place: 'lycee', activity: 'en cours (premier rang)' },
      { from: '12:00', to: '14:00', place: 'lycee', activity: 'self, puis CDI' },
      { from: '14:00', to: '17:00', place: 'lycee', activity: 'en cours' },
      { from: '17:00', to: '17:45', place: 'lycee', activity: 'étude et devoirs' },
      { from: '17:45', to: '19:30', place: 'epicerie', activity: 'aide sa mère', weekends: true },
    ],
    mercredi: [
      { from: '12:00', to: '13:30', place: 'maison', activity: 'déjeune en famille' },
      { from: '13:30', to: '16:00', place: 'epicerie', activity: 'tient les comptes de l’épicerie' },
      { from: '16:00', to: '18:00', place: 'parc', activity: 'révise sur un banc' },
    ],
  },
  yasmine: {
    semaine: [
      { from: '07:00', to: '08:00', place: 'maison', activity: 'réveil difficile' },
      { from: '08:00', to: '12:00', place: 'lycee', activity: 'en cours' },
      { from: '12:00', to: '14:00', place: 'lycee', activity: 'self, puis conseil de la vie lycéenne' },
      { from: '14:00', to: '17:00', place: 'lycee', activity: 'en cours' },
      { from: '17:00', to: '19:30', place: 'place', activity: 'discute avec tout le monde', weekends: true },
    ],
    mercredi: [
      { from: '12:00', to: '13:30', place: 'maison', activity: 'déjeune chez elle' },
      { from: '13:30', to: '19:00', place: 'place', activity: 'organise une collecte avec les délégués' },
    ],
  },
  moreau: {
    semaine: [
      { from: '07:45', to: '12:00', place: 'lycee', activity: 'enseigne en 2de' },
      { from: '12:00', to: '14:00', place: 'lycee', activity: 'déjeune en salle des profs' },
      { from: '14:00', to: '17:00', place: 'lycee', activity: 'enseigne' },
      { from: '17:00', to: '18:00', place: 'lycee', activity: 'corrige et reçoit les parents' },
    ],
    mercredi: [
      { from: '12:00', to: '12:30', place: 'lycee', activity: 'conseil pédagogique' },
    ],
  },
};
