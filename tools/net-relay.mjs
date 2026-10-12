/**
 * Relais WebSocket du multijoueur NEURAPOLIS, sans dépendance (Node ≥ 18).
 *
 * Branché sur n'importe quel serveur HTTP (serveur LAN `tools/lan-server.mjs`, serveur Vite,
 * application de bureau) : les navigateurs se connectent sur `ws://<adresse>/net?room=<salon>`.
 * Le relais ne connaît pas le jeu : il numérote les connexions, désigne un hôte (le plus ancien
 * du salon) et fait suivre chaque message aux autres, enveloppé : { t: 'relay', conn, msg }.
 * Un message qui porte `to` (numéro de connexion) n'est remis qu'à ce joueur.
 * Messages du relais : welcome { you, host, peers, addresses, port, max }, join { conn },
 * leave { conn }, host { conn }, error { code, text } (suivi de la fermeture).
 *
 * Garde-fous : 4 joueurs par salon (réglable), taille des messages bornée, débit borné par
 * connexion (au-delà : messages ignorés, puis déconnexion), trames client masquées exigées,
 * connexions mortes détectées par ping/pong.
 * Protocole WebSocket (RFC 6455) écrit à la main : trames texte, ping/pong, fermeture.
 */
import { createHash } from 'node:crypto';
import { networkInterfaces } from 'node:os';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MESSAGE = 256 * 1024;
/** Débit par connexion : réserve de messages et recharge par seconde. */
const RATE_BURST = 200;
const RATE_PER_SEC = 60;
/** Messages refusés pour débit avant déconnexion. */
const RATE_KICK = 600;
const PING_MS = 10000;

/** Codes de fermeture propres au relais (le client ne retente pas). */
export const CLOSE = { plein: 4001, salons: 4003, debit: 4008 };

/** Adresses IPv4 du serveur sur le réseau local (celles à donner aux amis). */
export function lanAddresses() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  return out;
}

/** Encode une trame serveur (jamais masquée). */
function frame(opcode, payload) {
  const len = payload.length;
  let head;
  if (len < 126) {
    head = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode;
    head[1] = 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode;
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([head, payload]);
}

class Conn {
  constructor(socket, id, room, onText, onClose) {
    this.socket = socket;
    this.id = id;
    this.room = room;
    this.alive = true;
    this.buf = Buffer.alloc(0);
    this.parts = [];
    this.partsLen = 0;
    this.closed = false;
    this.tokens = RATE_BURST;
    this.at = Date.now();
    this.dropped = 0;
    socket.setNoDelay?.(true);
    socket.on('data', (d) => {
      this.buf = Buffer.concat([this.buf, d]);
      if (this.buf.length > MAX_MESSAGE * 2) { this.close(1009); return; }
      this.parse(onText);
    });
    const end = () => { if (!this.closed) { this.closed = true; onClose(this); } };
    socket.on('close', end);
    socket.on('error', end);
  }

  parse(onText) {
    while (!this.closed) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const opcode = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > MAX_MESSAGE) { this.close(1009); return; }
      // RFC 6455 : un client masque toujours ses trames.
      if (!masked) { this.close(1002); return; }
      if (b.length < off + 4 + len) return;
      const mask = b.subarray(off, off + 4);
      const payload = Buffer.alloc(len);
      const src = b.subarray(off + 4, off + 4 + len);
      for (let i = 0; i < len; i++) payload[i] = src[i] ^ mask[i & 3];
      this.buf = b.subarray(off + 4 + len);
      if (opcode === 0x8) { this.close(1000); return; }
      if (opcode === 0x9) { this.raw(frame(0xa, payload)); continue; }
      if (opcode === 0xa) { this.alive = true; continue; }
      if (opcode === 0x1 || opcode === 0x0) {
        this.parts.push(payload);
        this.partsLen += len;
        if (this.partsLen > MAX_MESSAGE) { this.close(1009); return; }
        if (fin) {
          const text = Buffer.concat(this.parts).toString('utf8');
          this.parts = [];
          this.partsLen = 0;
          this.alive = true;
          onText(this, text);
        }
      } else {
        this.close(1003); // trame binaire ou inconnue : le jeu ne parle qu'en texte
        return;
      }
    }
  }

  /** Débit : vrai si le message peut passer. */
  take() {
    const now = Date.now();
    this.tokens = Math.min(RATE_BURST, this.tokens + ((now - this.at) / 1000) * RATE_PER_SEC);
    this.at = now;
    if (this.tokens >= 1) { this.tokens -= 1; return true; }
    this.dropped += 1;
    return false;
  }

  raw(buf) {
    if (!this.closed && this.socket.writable) this.socket.write(buf);
  }

  send(obj) {
    this.raw(frame(0x1, Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj), 'utf8')));
  }

  ping() {
    this.raw(frame(0x9, Buffer.alloc(0)));
  }

  close(code = 1000) {
    if (this.closed) return;
    const p = Buffer.alloc(2);
    p.writeUInt16BE(code, 0);
    this.raw(frame(0x8, p));
    this.socket.end();
    // Sans réponse du client, la connexion est coupée net.
    setTimeout(() => this.socket.destroy(), 2000).unref?.();
  }
}

/**
 * Branche le relais sur un serveur HTTP. Renvoie un objet pour l'arrêter et compter les salons.
 * Options : `path` (défaut `/net`), `log`, `maxPlayers` (défaut 4), `maxRooms` (défaut 50).
 */
export function attachRelay(server, { path = '/net', log = () => {}, maxPlayers = 4, maxRooms = 50 } = {}) {
  /** @type {Map<string, Conn[]>} */
  const rooms = new Map();
  let nextId = 1;

  const broadcast = (room, obj, except) => {
    const text = JSON.stringify(obj);
    for (const c of rooms.get(room) ?? []) if (c !== except) c.send(text);
  };

  const onText = (conn, text) => {
    if (!conn.take()) {
      if (conn.dropped >= RATE_KICK) {
        conn.send({ t: 'error', code: 'debit', text: 'Trop de messages envoyés : connexion coupée par le serveur.' });
        conn.close(CLOSE.debit);
      }
      return;
    }
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (typeof msg !== 'object' || msg === null || Array.isArray(msg) || typeof msg.t !== 'string' || msg.t.length > 32) return;
    const out = { t: 'relay', conn: conn.id, msg };
    if (Number.isInteger(msg.to)) {
      const target = (rooms.get(conn.room) ?? []).find((c) => c.id === msg.to && c !== conn);
      target?.send(out);
      return;
    }
    broadcast(conn.room, out, conn);
  };

  const onClose = (conn) => {
    const list = rooms.get(conn.room) ?? [];
    if (!list.includes(conn)) return;
    const wasHost = list[0] === conn;
    const next = list.filter((c) => c !== conn);
    if (next.length) rooms.set(conn.room, next); else rooms.delete(conn.room);
    broadcast(conn.room, { t: 'leave', conn: conn.id });
    if (wasHost && next[0]) broadcast(conn.room, { t: 'host', conn: next[0].id });
    log(`[relais] ${conn.id} a quitté « ${conn.room} » (${next.length} restant·s)`);
  };

  /** Accepte la connexion WebSocket, puis la refuse proprement avec un message lisible. */
  const refuse = (socket, code, key, text) => {
    const c = new Conn(socket, 0, '', () => {}, () => {});
    c.send({ t: 'error', code: key, text });
    c.close(code);
  };

  const onUpgrade = (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname !== path) return; // un autre service (ex. HMR de Vite) s'en occupe
    const key = req.headers['sec-websocket-key'];
    if (typeof key !== 'string' || (req.headers.upgrade ?? '').toLowerCase() !== 'websocket') {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
    const room = (url.searchParams.get('room') || 'neurapolis').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'neurapolis';
    const accept = createHash('sha1').update(key + GUID).digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const list = rooms.get(room) ?? [];
    if (list.length >= maxPlayers) {
      refuse(socket, CLOSE.plein, 'plein', `La partie est complète (${maxPlayers} joueurs au maximum).`);
      log(`[relais] connexion refusée : « ${room} » est plein`);
      return;
    }
    if (!rooms.has(room) && rooms.size >= maxRooms) {
      refuse(socket, CLOSE.salons, 'salons', 'Le serveur héberge déjà trop de parties.');
      return;
    }
    const conn = new Conn(socket, nextId++, room, onText, onClose);
    list.push(conn);
    rooms.set(room, list);
    const port = server.address?.()?.port;
    conn.send({ t: 'welcome', you: conn.id, host: list[0].id, peers: list.filter((c) => c !== conn).map((c) => c.id), addresses: lanAddresses(), port, max: maxPlayers });
    broadcast(room, { t: 'join', conn: conn.id }, conn);
    if (head && head.length) { conn.buf = Buffer.from(head); conn.parse(onText); }
    log(`[relais] ${conn.id} a rejoint « ${room} » (${list.length} joueur·s)`);
  };

  server.on('upgrade', onUpgrade);
  const timer = setInterval(() => {
    for (const list of [...rooms.values()]) {
      for (const c of [...list]) {
        if (!c.alive) { c.close(1001); c.socket.destroy(); continue; }
        c.alive = false;
        c.ping();
      }
    }
  }, PING_MS);
  timer.unref?.();

  return {
    rooms: () => [...rooms.entries()].map(([room, list]) => ({ room, players: list.length })),
    close: () => {
      clearInterval(timer);
      server.off('upgrade', onUpgrade);
      for (const list of rooms.values()) for (const c of list) c.close(1001);
      rooms.clear();
    },
  };
}
