/**
 * Relais WebSocket du multijoueur NEURAPOLIS, sans dépendance (Node ≥ 18).
 *
 * Branché sur n'importe quel serveur HTTP (serveur LAN `tools/lan-server.mjs`, serveur Vite) :
 * les navigateurs se connectent sur `ws://<adresse>/net?room=<salon>`. Le relais ne connaît pas
 * le jeu : il numérote les connexions, désigne un hôte (le plus ancien du salon) et fait suivre
 * chaque message aux autres, enveloppé : { t: 'relay', conn, msg }.
 * Messages du relais : welcome { you, host, peers }, join { conn }, leave { conn }, host { conn }.
 * Protocole WebSocket (RFC 6455) écrit à la main : trames texte, ping/pong, fermeture.
 */
import { createHash } from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MESSAGE = 256 * 1024;
const MAX_PER_ROOM = 8;

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
    this.closed = false;
    socket.setNoDelay(true);
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
    for (;;) {
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
      const maskLen = masked ? 4 : 0;
      if (b.length < off + maskLen + len) return;
      let payload = b.subarray(off + maskLen, off + maskLen + len);
      if (masked) {
        const mask = b.subarray(off, off + 4);
        const out = Buffer.alloc(len);
        for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
        payload = out;
      }
      this.buf = b.subarray(off + maskLen + len);
      if (opcode === 0x8) { this.close(1000); return; }
      if (opcode === 0x9) { this.raw(frame(0xa, payload)); continue; }
      if (opcode === 0xa) { this.alive = true; continue; }
      if (opcode === 0x1 || opcode === 0x0) {
        this.parts.push(Buffer.from(payload));
        if (fin) {
          const text = Buffer.concat(this.parts).toString('utf8');
          this.parts = [];
          onText(this, text);
        }
      }
    }
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
  }
}

/**
 * Branche le relais sur un serveur HTTP. Renvoie un objet pour l'arrêter et compter les salons.
 * `path` : chemin d'écoute (par défaut `/net`).
 */
export function attachRelay(server, { path = '/net', log = () => {} } = {}) {
  /** @type {Map<string, Conn[]>} */
  const rooms = new Map();
  let nextId = 1;

  const broadcast = (room, obj, except) => {
    for (const c of rooms.get(room) ?? []) if (c !== except) c.send(obj);
  };

  const onText = (conn, text) => {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    broadcast(conn.room, { t: 'relay', conn: conn.id, msg }, conn);
  };

  const onClose = (conn) => {
    const list = rooms.get(conn.room) ?? [];
    const wasHost = list[0] === conn;
    const next = list.filter((c) => c !== conn);
    if (next.length) rooms.set(conn.room, next); else rooms.delete(conn.room);
    broadcast(conn.room, { t: 'leave', conn: conn.id });
    if (wasHost && next[0]) broadcast(conn.room, { t: 'host', conn: next[0].id });
    log(`[relais] ${conn.id} a quitté « ${conn.room} » (${next.length} restant·s)`);
  };

  const onUpgrade = (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname !== path) return; // un autre service (ex. HMR de Vite) s'en occupe
    const key = req.headers['sec-websocket-key'];
    if (typeof key !== 'string' || (req.headers.upgrade ?? '').toLowerCase() !== 'websocket') {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
    const room = (url.searchParams.get('room') || 'neurapolis').slice(0, 40);
    const list = rooms.get(room) ?? [];
    if (list.length >= MAX_PER_ROOM) {
      socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      return;
    }
    const accept = createHash('sha1').update(key + GUID).digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    const conn = new Conn(socket, nextId++, room, onText, onClose);
    if (head && head.length) { conn.buf = Buffer.from(head); conn.parse(onText); }
    list.push(conn);
    rooms.set(room, list);
    conn.send({ t: 'welcome', you: conn.id, host: list[0].id, peers: list.filter((c) => c !== conn).map((c) => c.id) });
    broadcast(room, { t: 'join', conn: conn.id }, conn);
    log(`[relais] ${conn.id} a rejoint « ${room} » (${list.length} joueur·s)`);
  };

  server.on('upgrade', onUpgrade);
  const timer = setInterval(() => {
    for (const list of rooms.values()) {
      for (const c of list) {
        if (!c.alive) { c.close(1001); c.socket.destroy(); continue; }
        c.alive = false;
        c.ping();
      }
    }
  }, 20000);
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
