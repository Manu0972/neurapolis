/**
 * Pont entre le jeu et l'application de bureau : seulement l'hébergement multijoueur.
 * Le jeu teste `window.neurapolisApp` pour proposer « Héberger une partie ».
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('neurapolisApp', {
  desktop: true,
  host: () => ipcRenderer.invoke('neurapolis:host'),
  stopHost: () => ipcRenderer.invoke('neurapolis:stopHost'),
  addresses: () => ipcRenderer.invoke('neurapolis:addresses'),
});
