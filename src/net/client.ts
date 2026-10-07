/**
 * Client WebSocket du multijoueur : connexion au relais, reconnexion automatique (1 s → 10 s),
 * envoi de messages de jeu, réception typée. Présentation seulement (jamais importé par la
 * simulation).
 */
import type { GameMsg, RelayMsg } from './protocol';

export type NetStatus = 'deconnecte' | 'connexion' | 'connecte';

export interface NetClient {
  readonly status: NetStatus;
  send(msg: GameMsg): void;
  close(): void;
}

export function connectRelay(url: string, handlers: {
  onMessage(msg: RelayMsg): void;
  onStatus(s: NetStatus, detail?: string): void;
}): NetClient {
  let ws: WebSocket | null = null;
  let status: NetStatus = 'deconnecte';
  let closed = false;
  let delay = 1000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const queue: string[] = [];

  const set = (s: NetStatus, detail?: string): void => {
    status = s;
    handlers.onStatus(s, detail);
  };

  const open = (): void => {
    if (closed) return;
    set('connexion');
    try {
      ws = new WebSocket(url);
    } catch (e) {
      set('deconnecte', e instanceof Error ? e.message : 'adresse invalide');
      return;
    }
    ws.onopen = () => {
      delay = 1000;
      set('connecte');
      for (const m of queue.splice(0)) ws?.send(m);
    };
    ws.onmessage = (e) => {
      try {
        handlers.onMessage(JSON.parse(String(e.data)) as RelayMsg);
      } catch {
        /* message illisible : ignoré */
      }
    };
    ws.onclose = () => {
      ws = null;
      if (closed) { set('deconnecte'); return; }
      set('deconnecte', 'connexion perdue, nouvel essai…');
      timer = setTimeout(open, delay);
      delay = Math.min(10000, delay * 2);
    };
    ws.onerror = () => { /* onclose suit */ };
  };
  open();

  return {
    get status() { return status; },
    send(msg: GameMsg): void {
      const text = JSON.stringify(msg);
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(text);
      else if (msg.t === 'event' || msg.t === 'chat') queue.push(text); // l'essentiel attend la reconnexion
    },
    close(): void {
      closed = true;
      if (timer) clearTimeout(timer);
      ws?.close();
    },
  };
}
