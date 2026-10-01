const NeurArt = require('./pixelart.js');
const noop = () => {};
const grad = { addColorStop: noop };
function fakeCtx() {
  return new Proxy({}, { get(t, k) {
    if (k === 'createRadialGradient') return () => grad;
    return noop;
  }});
}
const canvas = { width: 960, height: 576, getContext: () => fakeCtx() };
for (const name of Object.keys(NeurArt.PALETTES)) {
  NeurArt.renderScene(canvas, name, 0);
  NeurArt.renderScene(canvas, name, 7);
}
const ctx = fakeCtx();
NeurArt.drawPerson(ctx, 0, 0, 3, { hair: '#000', skin: '#fff', shirt: '#f00', pants: '#00f', shoes: '#000' }, 0, NeurArt.PALETTES.jour);
NeurArt.drawPerson(ctx, 0, 0, 3, { hair: '#000', skin: '#fff', shirt: '#f00', pants: '#00f', shoes: '#000' }, 1, NeurArt.PALETTES.nuit);
for (const k of ['maison','college','epicerie','arbre','friche','lampadaire']) NeurArt.drawBuilding(ctx, k, 0, 0, 48, NeurArt.PALETTES.jour, 0);
for (const k of ['grass','path','water','park','dirt']) NeurArt.drawTile(ctx, 0, 0, 48, k, NeurArt.PALETTES.jour, NeurArt.mulberry(1), 0);
console.log('SMOKE OK — rendu exécuté sans exception (3 palettes, 5 tuiles, 6 bâtiments, 2 trames personnage)');
