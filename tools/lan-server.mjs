#!/usr/bin/env node
/**
 * Serveur LAN de NEURAPOLIS (multijoueur via NordVPN Meshnet ou un vrai réseau local).
 *
 * Sert le jeu construit (dossier `dist/`, ou `.ci/verif/dist/`, ou le fichier unique
 * `NEURAPOLIS.html`) et le relais du multijoueur (`/net`) sur toutes les interfaces.
 * Usage : node tools/lan-server.mjs [dossier-ou-fichier] [--port 8765]
 * Puis l'ami ouvre http://<ton-adresse-Meshnet>:8765 dans son navigateur.
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
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    file = join(ROOT, rel || 'index.html');
    if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  }
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
});

attachRelay(server, { log: (m) => console.log(m) });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nNEURAPOLIS — serveur LAN prêt (${singleFile ? 'fichier unique' : 'dossier'} : ${target})`);
  console.log('Adresses à donner à ton ami (Meshnet : celle en 100.x.x.x) :');
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  http://${a.address}:${PORT}   (${name})`);
    }
  }
  console.log(`Toi : http://localhost:${PORT}\nDans le jeu : bouton « 📡 Multijoueur » → Se connecter. Ctrl+C pour arrêter.\n`);
});
