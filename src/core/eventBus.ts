/**
 * Bus d'événements minimal et typé — découple la simulation de la présentation.
 * La simulation émet ; l'UI s'abonne. Aucune dépendance inverse.
 */
import type { GameEvent, Notification } from './types';

export interface SimSignal {
  worldChanged: void;
  event: GameEvent;
  notification: Notification;
  ghostSpoke: { ghost: string; text: string };
}

type Handler<K extends keyof SimSignal> = (payload: SimSignal[K]) => void;

/** Stockage interne : un seul type de handler (paramètre never — tout lui est assignable). */
type StoredHandler = (payload: never) => void;

export class EventBus {
  private handlers = new Map<keyof SimSignal, StoredHandler[]>();

  on<K extends keyof SimSignal>(key: K, fn: Handler<K>): () => void {
    const list = this.handlers.get(key) ?? [];
    list.push(fn);
    this.handlers.set(key, list);
    return () => {
      const l = this.handlers.get(key);
      if (!l) return;
      const i = l.indexOf(fn);
      if (i >= 0) l.splice(i, 1);
    };
  }

  emit<K extends keyof SimSignal>(key: K, payload: SimSignal[K]): void {
    const list = this.handlers.get(key);
    if (!list) return;
    // Le typage public garantit la cohérence clé/payload ; le stockage interne, lui, est effacé.
    for (const fn of [...list]) fn(payload as never);
  }
}

export const bus = new EventBus();
