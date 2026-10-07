/**
 * Petits boulots (avant d'entreprendre) : aider Mme Bertin à l'épicerie après les cours
 * ou le samedi matin. Le temps passe pendant le service (ellipse côté présentation), le joueur
 * est payé à l'heure, se fatigue, gagne la confiance de Mme Bertin et apprend à s'organiser.
 * Au bout de trois services, Mme Bertin consent un tarif « dépannage » plus doux.
 *
 * État : deux compteurs dans `w.flags` (pas de champ de sauvegarde supplémentaire) :
 *  - `jobShiftEnd` : tick de fin du service en cours (0 = pas de service) ;
 *  - `jobShiftsDone` : services terminés.
 */
import type { Notification, WorldState } from '../core/types';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay } from '../core/clock';
import { addXp } from './skills';
import { notify, pushEvent } from './events';

export const JOB = {
  employer: 'bertin',
  title: 'Coup de main à l’épicerie Bertin',
  /** Paie horaire (argent de poche d'un collégien, pas un salaire d'adulte). */
  payPerHour: 4.5,
  /** Durée d'un service en ticks de 10 minutes. */
  shiftTicks: 12,
  /** Seuil de services pour obtenir le tarif « dépannage » réduit. */
  loyaltyShifts: 3,
} as const;

export interface JobCheck { ok: boolean; message: string }

/** Créneaux : 16 h – 19 h les jours d'école, 9 h – 12 h et 14 h – 18 h le samedi et pendant les vacances. Fermé le dimanche. */
export function shiftWindowOpen(w: WorldState): JobCheck {
  const day = dayIndexOf(w.time.tick);
  const wd = dateOf(day).weekday;
  const min = minutesOfDay(w.time.tick);
  if (wd === 0) return { ok: false, message: 'L’épicerie est fermée le dimanche.' };
  if (isSchoolDay(day)) {
    return min >= 16 * 60 && min < 19 * 60
      ? { ok: true, message: '' }
      : { ok: false, message: 'Les jours de cours, Mme Bertin a besoin d’aide entre 16 h et 19 h.' };
  }
  const ok = (min >= 9 * 60 && min < 12 * 60) || (min >= 14 * 60 && min < 18 * 60);
  return ok ? { ok: true, message: '' } : { ok: false, message: 'Mme Bertin prend de l’aide de 9 h à 12 h et de 14 h à 18 h.' };
}

export function inShift(w: WorldState): boolean {
  return (w.flags['jobShiftEnd'] ?? 0) > w.time.tick;
}

export function canStartShift(w: WorldState): JobCheck {
  if (inShift(w)) return { ok: false, message: 'Tu es déjà en service.' };
  if (w.player.asleep) return { ok: false, message: 'Tu dors.' };
  if (w.npcs['bertin']?.place !== 'epicerie') return { ok: false, message: 'Mme Bertin n’est pas à l’épicerie en ce moment.' };
  if (w.player.needs.fatigue >= 80) return { ok: false, message: 'Tu es trop fatigué pour travailler : repose-toi d’abord.' };
  return shiftWindowOpen(w);
}

export function startShift(w: WorldState): JobCheck {
  const c = canStartShift(w);
  if (!c.ok) return c;
  w.flags['jobShiftEnd'] = w.time.tick + JOB.shiftTicks;
  return { ok: true, message: `Tu enfiles le tablier : deux heures de mise en rayon et de caisse avec Mme Bertin.` };
}

/** À chaque tick : paie, fatigue ; à la fin du service, bilan et effets relationnels. */
export function jobTick(w: WorldState): Notification[] {
  const end = w.flags['jobShiftEnd'] ?? 0;
  if (end === 0) return [];
  const out: Notification[] = [];
  if (w.time.tick <= end) {
    const pay = Math.round((JOB.payPerHour / 6) * 100) / 100;
    w.player.money = Math.round((w.player.money + pay) * 100) / 100;
    w.flags['gainsBoulot'] = Math.round(((w.flags['gainsBoulot'] ?? 0) + pay) * 100) / 100;
    w.player.needs.fatigue = Math.min(100, w.player.needs.fatigue + 1);
    w.player.needs.stress = Math.min(100, w.player.needs.stress + 0.3);
  }
  if (w.time.tick >= end) {
    w.flags['jobShiftEnd'] = 0;
    w.flags['jobShiftsDone'] = (w.flags['jobShiftsDone'] ?? 0) + 1;
    const rel = w.player.relations['bertin'];
    if (rel) {
      rel.confiance = Math.min(100, rel.confiance + 3);
      rel.respect = Math.min(100, rel.respect + 2);
    }
    addXp(w, 'organisation', 1);
    const done = w.flags['jobShiftsDone'];
    const total = JOB.payPerHour * (JOB.shiftTicks / 6);
    out.push(notify('info', `Fin du service : ${total.toFixed(2)} € gagnés. Mme Bertin te fait de plus en plus confiance.`));
    if (done === JOB.loyaltyShifts) {
      pushEvent(w, {
        type: 'opportunite',
        title: 'Mme Bertin te fait un prix',
        text: '« Tu as été sérieux. Si un jour tu veux revendre au marché, je te laisse la marchandise à prix coûtant, ou presque. »',
        causes: [
          { facteur: 'services rendus à l’épicerie', seuil: `${done}`, poids: 3 },
          { facteur: 'confiance de Mme Bertin', seuil: `${rel?.confiance ?? 0}/100`, poids: 2 },
        ],
        relations: { bertin: { amitie: 3 } },
      });
    }
  }
  return out;
}

/** Remise du dépannage Bertin pour un jeune qui a fait ses preuves à l'épicerie. */
export function bertinLoyaltyDiscount(w: WorldState): number {
  return (w.flags['jobShiftsDone'] ?? 0) >= JOB.loyaltyShifts ? 0.1 : 0;
}
