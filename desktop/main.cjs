/**
 * NEURAPOLIS — application de bureau (Electron).
 *
 * Ouvre le jeu (NEURAPOLIS.html, le build en un seul fichier) dans sa propre fenêtre, sans
 * navigateur. Peut héberger une partie multijoueur : un petit serveur LAN (relais WebSocket
 * `/net` + la page du jeu) démarre dans l'application, joignable via NordVPN Meshnet.
 * Les sauvegardes restent dans le dossier de données de l'application (%APPDATA%/NEURAPOLIS).
 */
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const GAME = path.join(__dirname, 'game', 'NEURAPOLIS.html');
const PORT = 8765;
let win = null;
let host = null;

function addresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal) out.push({ name, address: a.address, meshnet: a.address.startsWith('100.') });
  }
  return out.sort((a, b) => Number(b.meshnet) - Number(a.meshnet));
}

async function startHost() {
  if (host) return { port: PORT, addresses: addresses() };
  const { attachRelay } = await import(pathToFileURL(path.join(__dirname, 'net-relay.mjs')).href);
  const server = http.createServer((req, res) => {
    // L'ami peut aussi jouer dans son navigateur : la page du jeu est servie à la racine.
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      fs.createReadStream(GAME).pipe(res);
      return;
    }
    res.writeHead(404).end();
  });
  const relay = attachRelay(server);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '0.0.0.0', resolve);
  });
  host = { server, relay };
  return { port: PORT, addresses: addresses() };
}

function stopHost() {
  if (!host) return;
  host.relay.close();
  host.server.close();
  host = null;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'NEURAPOLIS',
    backgroundColor: '#0a0e17',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(GAME);
  // Liens externes : dans le navigateur, jamais dans la fenêtre du jeu.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F12' && !app.isPackaged) win.webContents.toggleDevTools();
  });
}

ipcMain.handle('neurapolis:host', async () => {
  try {
    return { ok: true, ...(await startHost()) };
  } catch (e) {
    return { ok: false, error: e && e.code === 'EADDRINUSE' ? `Le port ${PORT} est déjà utilisé (une autre partie hébergée ?).` : String(e && e.message || e) };
  }
});
ipcMain.handle('neurapolis:stopHost', () => { stopHost(); return { ok: true }; });
ipcMain.handle('neurapolis:addresses', () => addresses());

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});
app.on('window-all-closed', () => { stopHost(); app.quit(); });
