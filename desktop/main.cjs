/**
 * NEURAPOLIS — application de bureau (Electron).
 *
 * Ouvre le jeu (NEURAPOLIS.html, le build en un seul fichier) dans sa propre fenêtre, sans
 * navigateur. Peut héberger une partie multijoueur : un petit serveur LAN (relais WebSocket
 * `/net` + la page du jeu, desktop/host.cjs) démarre dans l’application, joignable sur le réseau local.
 * Les sauvegardes restent dans le dossier de données de l'application (%APPDATA%/NEURAPOLIS).
 */
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('node:path');
const { createHost, addresses, hostError } = require('./host.cjs');

const GAME = path.join(__dirname, 'game', 'NEURAPOLIS.html');
const PORT = 8765;
let win = null;
const host = createHost({ game: GAME, relay: path.join(__dirname, 'net-relay.mjs'), port: PORT, log: (m) => console.log(m) });

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
    return { ok: true, ...(await host.start()) };
  } catch (e) {
    return { ok: false, error: hostError(e, PORT) };
  }
});
ipcMain.handle('neurapolis:stopHost', () => { host.stop(); return { ok: true }; });
ipcMain.handle('neurapolis:addresses', () => addresses());

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});
app.on('window-all-closed', () => { host.stop(); app.quit(); });
