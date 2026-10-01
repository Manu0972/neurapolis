/**
 * Journal des événements et des causes — « pourquoi ceci est arrivé ? » (Principe 4).
 * Chaque événement porte ses facteurs, seuils et poids : la chaîne causale est
 * reconstruisible par l'UI.
 */
import type { CauseFactor, EventType, GameEvent, LifeJournalEntry, NpcId, Notification, Rel4, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { applyRelation } from './relations';

export function pushEvent(
  w: WorldState,
  evt: {
    type: EventType;
    title: string;
    text: string;
    causes: CauseFactor[];
    once?: string;
    /** Effets relationnels de l'événement (relations 4D, contrat M3). */
    relations?: Partial<Record<NpcId, Partial<Rel4>>>;
  },
): GameEvent | null {
  const day = dayIndexOf(w.time.tick);
  if (evt.once) {
    if (w.seen[evt.once]) return null;
    w.seen[evt.once] = true;
  }
  const seq = (w.flags.__evtSeq = (w.flags.__evtSeq ?? 0) + 1);
  const gameEvent: GameEvent = {
    id: `e${seq}`,
    day,
    date: dateOf(day).iso,
    type: evt.type,
    title: evt.title,
    text: evt.text,
    causes: evt.causes,
  };
  w.events.unshift(gameEvent);
  if (w.events.length > 250) w.events.length = 250;
  if (evt.relations) {
    for (const [npcId, delta] of Object.entries(evt.relations)) {
      if (delta) applyRelation(w, npcId, delta);
    }
  }
  return gameEvent;
}

export function pushJournal(w: WorldState, title: string, text: string): void {
  const day = dayIndexOf(w.time.tick);
  const entry: LifeJournalEntry = { day, date: dateOf(day).iso, title, text };
  w.lifeJournal.unshift(entry);
  if (w.lifeJournal.length > 100) w.lifeJournal.length = 100;
}

export function notify(kind: Notification['kind'], text: string, ghost?: string): Notification {
  return { kind, text, ghost };
}

export function bump(w: WorldState, flag: string, delta = 1): void {
  w.flags[flag] = (w.flags[flag] ?? 0) + delta;
}
