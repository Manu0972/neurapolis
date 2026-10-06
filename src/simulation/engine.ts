/**
 * Moteur : boucle de simulation. Ordre garanti par tick :
 * temps → sommeil → besoins → PNJ → vie (événements, notions) → (bascule jour) quartier/conseil.
 * La présentation n’appelle que tickWorld/runTicks — jamais l’inverse.
 */
import type { Notification, WorldState } from '../core/types';
import { dateOf, dayIndexOf, isSchoolDay, minutesOfDay, weekIndexOf } from '../core/clock';
import { needsTick } from './needs';
import { npcTick } from './npc';
import { districtDay } from './district';
import { councilDay, councilTick } from './council';
import { lifeTick } from './life';
import { projectDay, projectWeek } from './project';
import { workshopDay, workshopWeek } from './workshop';
import { rivalDay } from './rival';
import { campaignTick } from './campaign';
import { macroNewsDayTick } from './macro_news';
import { multiVenturesDayTick } from './multi_ventures';
import { schoolDayTick } from './school_life';
import { checkStreetSynergiesAndEncounters } from './street_synergies';
import { notify } from './events';
import { economyTick } from './economy';
import { saveToSlot } from '../saves/persist';

// L'échec du stockage ne fait pas partie de WorldState : retenir l'alerte par monde évite le spam quotidien.
const worldsWithAutoSaveFailure = new WeakSet<WorldState>();

export interface TickOutput { notifications: Notification[] }

export function tickWorld(w: WorldState): TickOutput {
  const out: Notification[] = [];
  const prevDay = dayIndexOf(w.time.tick);
  const prevWeek = weekIndexOf(prevDay);

  const prevTick = w.time.tick;
  w.time.tick += 1;

  const day = dayIndexOf(w.time.tick);
  const minutes = minutesOfDay(w.time.tick);

  // Sommeil automatique 22:00 → 07:00 (les actions « coucher/tâter » arrivent en J3)
  w.player.asleep = minutes < 7 * 60 || minutes >= 22 * 60;

  if (!w.player.asleep) {
    needsTick(w);
  } else {
    needsTick(w);
  }
  npcTick(w);
  lifeTick(w);
  out.push(...councilTick(w));
  out.push(...checkStreetSynergiesAndEncounters(w));
  out.push(...economyTick(w, prevTick));

  if (day !== prevDay) {
    out.push(...rivalDay(w));
    districtDay(w);
    out.push(...councilDay(w));
    projectDay(w);
    out.push(...workshopDay(w));
    out.push(...campaignTick(w));
    out.push(...macroNewsDayTick(w));
    out.push(...multiVenturesDayTick(w));
    out.push(...schoolDayTick(w));

    // Hebdomadaire : argent de poche + répartition des gains du stand (M5) + atelier (J5)
    if (weekIndexOf(day) !== prevWeek) {
      w.player.money += 5;
      out.push(notify('info', 'Argent de poche de la semaine : +5 €.'));
      out.push(...projectWeek(w));
      out.push(...workshopWeek(w));
    }

    // Cadence figée (contrat M0) : auto-sauvegarde en fin de journée de jeu.
    try {
      saveToSlot('auto', w);
      if (worldsWithAutoSaveFailure.delete(w)) {
        out.push(notify('info', 'La sauvegarde automatique fonctionne de nouveau.'));
      }
    } catch {
      if (!worldsWithAutoSaveFailure.has(w)) {
        worldsWithAutoSaveFailure.add(w);
        out.push(notify('alerte', 'La sauvegarde automatique a échoué. Ta progression peut ne pas être conservée.'));
      }
    }
  }

  return { notifications: out };
}

export function runTicks(w: WorldState, n: number): Notification[] {
  const out: Notification[] = [];
  for (let i = 0; i < n; i++) out.push(...tickWorld(w).notifications);
  return out;
}

/** Label lisible courant (pratique UI + debug). */
export function worldClockLabel(w: WorldState): string {
  const day = dayIndexOf(w.time.tick);
  return `${dateOf(day).label} · ${String(Math.floor(minutesOfDay(w.time.tick) / 60)).padStart(2, '0')}:${String(minutesOfDay(w.time.tick) % 60).padStart(2, '0')} · école: ${isSchoolDay(day) ? 'oui' : 'non'}`;
}
