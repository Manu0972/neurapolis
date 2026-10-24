/**
 * Client WebSocket du multijoueur : connexion au relais, reconnexion automatique (1 s → 10 s),
 * envoi de messages de jeu, réception validée. Aucun accès au DOM ni à la simulation : la
 * session (`src/net/session.ts`) s'en sert, la présentation affiche son état.
 *
 * Les événements de jeu ne sont pas mis en file ici : la session les garde dans la boîte d'envoi
 * du monde (sauvegardée) jusqu'à l'accusé de réception, et les renvoie après une coupure.
 */
import { parseRelayMsg, type GameMsg, type RelayMsg } from './protocol';

export type NetStatus = 'deconnecte' | 'connexion' | 'connecte';

export interface NetClient {
  readonly status: NetStatus;
  send(msg: GameMsg): boolean;
  close(): void;
}

/** Codes de fermeture du relais (4000-4999) : refus définitif, pas de nouvel essai. */
export const RELAY_CLOSE = { plein: 4001, debit: 4008, salons: 4003 } as const;

const REFUS: Record<number, string> = {
  [RELAY_CLOSE.plein]: 'La partie est complète (4 joueurs au maximum).',
  [RELAY_CLOSE.debit]: 'Le serveur a coupé la connexion : trop de messages envoyés.',
  [RELAY_CLOSE.salons]: 'Le serveur héberge déjà trop de parties.',
};

export function connectRelay(url: string, handlers: {
  onMessage(msg: RelayMsg): void;
  onStatus(s: NetStatus, detail?: string): void;
}): NetClient {
  let ws: WebSocket | null = null;
  let status: NetStatus = 'deconnecte';
  let closed = false;
  let everOpen = false;
  let refusal = '';
  let delay = 1000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let where = url;
  try { where = new URL(url).host; } catch { /* adresse brute */ }

  const set = (s: NetStatus, detail?: string): void => {
    status = s;
    handlers.onStatus(s, detail);
  };

  const open = (): void => {
    if (closed) return;
    set('connexion', everOpen ? `Reconnexion à ${where}…` : `Connexion à ${where}…`);
    try {
      ws = new WebSocket(url);
    } catch {
      closed = true;
      set('deconnecte', `Adresse invalide : ${where}.`);
      return;
    }
    const sock = ws;
    sock.onopen = () => {
      everOpen = true;
      delay = 1000;
      set('connecte');
    };
    sock.onmessage = (e) => {
      let raw: unknown;
      try { raw = JSON.parse(String(e.data)); } catch { return; /* message illisible : ignoré */ }
      const msg = parseRelayMsg(raw);
      if (!msg) return;
      if (msg.t === 'error') refusal = msg.text || refusal;
      handlers.onMessage(msg);
    };
    sock.onclose = (e) => {
      if (ws === sock) ws = null;
      if (closed) { set('deconnecte'); return; }
      const why = REFUS[e.code] ?? (e.code >= 4000 && e.code < 5000 ? refusal || 'Le serveur a refusé la connexion.' : '');
      if (why) {
        closed = true;
        set('deconnecte', why);
        return;
      }
      const s = Math.round(delay / 1000);
      set('deconnecte', everOpen
        ? `Connexion perdue avec ${where}. Nouvel essai dans ${s} s…`
        : `Impossible de joindre ${where} : vérifie l’adresse, que la partie est bien hébergée et que le pare-feu autorise la connexion. Nouvel essai dans ${s} s…`);
      timer = setTimeout(open, delay);
      delay = Math.min(10000, delay * 2);
    };
    sock.onerror = () => { /* onclose suit */ };
  };
  open();
  // Onglet fermé ou rechargé : on ferme proprement, et le relais prévient les autres tout de suite
  // (sinon ils ne l'apprennent qu'au ping suivant, 10 à 20 s plus tard). Revenu de l'historique,
  // l'onglet se reconnecte tout seul (fermeture non demandée = nouvel essai).
  const bye = (): void => { if (ws && ws.readyState <= WebSocket.OPEN) ws.close(1000); };
  globalThis.addEventListener?.('pagehide', bye);

  return {
    get status() { return status; },
    send(msg: GameMsg): boolean {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(msg));
      return true;
    },
    close(): void {
      closed = true;
      globalThis.removeEventListener?.('pagehide', bye);
      if (timer) clearTimeout(timer);
      const sock = ws;
      ws = null;
      if (sock && sock.readyState <= WebSocket.OPEN) sock.close(1000);
      set('deconnecte');
    },
  };
}
