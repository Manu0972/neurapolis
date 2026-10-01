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
import { notify } from './events';
import { saveToSlot } from '../saves/persist';

export interface TickOutput { notifications: Notification[] }

export function tickWorld(w: WorldState): TickOutput {
  const out: Notification[] = [];
  const prevDay = dayIndexOf(w.time.tick);
  const prevWeek = weekIndexOf(prevDay);

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

  if (day !== prevDay) {
    out.push(...rivalDay(w));
    districtDay(w);
    out.push(...councilDay(w));
    projectDay(w);
    out.push(...workshopDay(w));
    out.push(...campaignTick(w));

    // Hebdomadaire : argent de poche + répartition des gains du stand (M5)
    if (weekIndexOf(day) !== prevWeek) {
      w.player.money += 5;
      out.push(notify('info', 'Argent de poche de la semaine : +5 €.'));
      out.push(...projectWeek(w));
      out.push(...workshopWeek(w));
    }

    // Cadence figée (contrat M0) : auto-sauvegarde en fin de journée de jeu.
    try {
      saveToSlot('auto', w);
    } catch {
      // Pas de stockage disponible (tests Node, navigateur restreint) : on continue sans état.
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
