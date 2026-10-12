/**
 * NEURAPOLIS — hébergement multijoueur de l'application de bureau (sans Electron : testable).
 *
 * Un petit serveur HTTP joignable sur le réseau local : la page du jeu à la racine (un ami peut
 * jouer dans son navigateur) et le relais WebSocket `/net` (tools/net-relay.mjs, copié à côté).
 */
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function addresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal) out.push({ name, address: a.address, meshnet: a.address.startsWith('100.') });
  }
  // Réseau local d'abord (box, Wi-Fi), puis les autres.
  const rank = (a) => (/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(a.address) ? 0 : a.meshnet ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b));
}

/**
 * Crée l'hôte. `game` : chemin de NEURAPOLIS.html ; `relay` : chemin de net-relay.mjs.
 * `start()` démarre (une seule fois) et renvoie { port, addresses } ; `stop()` arrête.
 */
function createHost({ game, relay, port = 8765, bind = '0.0.0.0', log = () => {} }) {
  let host = null;
  return {
    get running() { return !!host; },
    async start() {
      if (host) return { port: host.port, addresses: addresses() };
      const { attachRelay } = await import(pathToFileURL(relay).href);
      const server = http.createServer((req, res) => {
        const url = (req.url || '/').split('?')[0];
        if (url === '/' || url === '/index.html') {
          if (!fs.existsSync(game)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Jeu introuvable.'); return; }
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
          fs.createReadStream(game).pipe(res);
          return;
        }
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Introuvable');
      });
      const r = attachRelay(server, { log });
      await new Promise((resolve, reject) => {
        server.once('error', (e) => { r.close(); reject(e); });
        server.listen(port, bind, resolve);
      });
      host = { server, relay: r, port: server.address().port };
      return { port: host.port, addresses: addresses() };
    },
    stop() {
      if (!host) return;
      host.relay.close();
      host.server.close();
      host = null;
    },
  };
}

/** Message lisible pour une erreur de démarrage. */
function hostError(e, port) {
  if (e && e.code === 'EADDRINUSE') return `Le port ${port} est déjà utilisé : une partie est peut-être déjà hébergée (jouer-en-lan.bat ou une autre fenêtre de NEURAPOLIS).`;
  if (e && e.code === 'EACCES') return `Windows refuse d’ouvrir le port ${port}.`;
  return `Impossible d’héberger : ${String((e && e.message) || e)}`;
}

module.exports = { createHost, addresses, hostError };
