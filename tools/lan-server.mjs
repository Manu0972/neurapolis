#!/usr/bin/env node
/**
 * Serveur LAN de NEURAPOLIS (multijoueur sur le réseau local : même box, même Wi-Fi).
 *
 * Sert le jeu construit (dossier `dist/`, ou `.ci/verif/dist/`, ou le fichier unique
 * `NEURAPOLIS.html`) et le relais du multijoueur (`/net`) sur toutes les interfaces.
 * Usage : node tools/lan-server.mjs [dossier-ou-fichier] [--port 8765]
 * Puis l’ami ouvre http://<adresse-locale>:8765 (affichée au démarrage) dans son navigateur.
 * Aucune dépendance.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { attachRelay } from './net-relay.mjs';

const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const PORT = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 8765);
const explicit = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--port');
const candidates = explicit ? [explicit] : ['dist', '.ci/verif/dist', 'NEURAPOLIS.html', 'dist/NEURAPOLIS.html'];
const target = candidates.map((c) => resolve(c)).find((c) => existsSync(c));
if (!target) {
  console.error('Aucun jeu construit trouvé (dist/, .ci/verif/dist/ ou NEURAPOLIS.html). Construis le jeu d’abord.');
  process.exit(1);
}
const singleFile = statSync(target).isFile();
const ROOT = singleFile ? resolve(target, '..') : target;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let file;
  if (singleFile && (url.pathname === '/' || url.pathname === '/index.html')) {
    file = target;
  } else {
    let rel;
    try { rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, ''); } catch { res.writeHead(400).end(); return; }
    if (rel.includes('\0')) { res.writeHead(400).end(); return; }
    file = join(ROOT, rel || 'index.html');
    const rootWithSep = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
    if (!file.startsWith(rootWithSep) && file !== ROOT) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  }
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
  res.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
  });
  createReadStream(file).pipe(res);
});

attachRelay(server, { log: (m) => console.log(m) });

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`\nLe port ${PORT} est déjà utilisé : une partie est peut-être déjà hébergée sur cet ordinateur.\nFerme l’autre fenêtre, ou choisis un autre port : node tools/lan-server.mjs --port 8766\n`);
  else console.error(`\nImpossible de démarrer le serveur : ${e.message}\n`);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nNEURAPOLIS — serveur LAN prêt (${singleFile ? 'fichier unique' : 'dossier'} : ${target})`);
  console.log('Adresse à donner à tes amis (même réseau : même box ou même Wi-Fi) :');
  const list = Object.entries(networkInterfaces()).flatMap(([name, l]) => (l ?? []).filter((a) => a.family === 'IPv4' && !a.internal).map((a) => ({ name, address: a.address })));
  // Réseau local d'abord (192.168…, 10…, 172.16-31…), puis les autres (VPN, Meshnet…).
  const rank = (a) => (/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(a.address) ? 0 : 1);
  for (const a of list.sort((x, y) => rank(x) - rank(y))) console.log(`  http://${a.address}:${PORT}   (${a.name})`);
  if (!list.length) console.log('  (aucune carte réseau active : connecte-toi au Wi-Fi ou à la box)');
  console.log(`Toi : http://localhost:${PORT}   (2e fenêtre sur ce même PC : http://127.0.0.1:${PORT})`);
  console.log('Dans le jeu : bouton « 📡 Multijoueur » → « Ouvrir la partie sur ce serveur ». Ctrl+C pour arrêter.\n');
});
