/** Petits sprites pixel-art du quartier, dessinés sur la grille logique. */
import type { PlaceId } from '../core/types';
import type { WorldPropId } from '../data/map';
import { drawStreetLifeProp, type StreetPropKind } from './assets/environments/street-life';

type Pixel = '.' | 'o' | 'd' | 'b' | 'B' | 'g' | 'G' | 'l' | 'L' | 't' | 'w' | 'W' | 'r' | 'R' | 'y' | 'Y' | 'p';
interface PixelSprite { rows: readonly string[]; palette: Partial<Record<Pixel, string>> }

const TREE: PixelSprite = {
  rows: [
    '.......GGG........', '.....gGGGGGg......', '....gGGGGGGGg.....',
    '...gGGGGGGGGGg....', '..gGGGGGGGGGGGg...', '..gGGGGGGGGGGGGg..',
    '.gGGGGGGGGGGGGGGg.', '.gGGGGGGGGGGGGGGg.', '..gGGGGGGGGGGGGGg.',
    '...gGGGGGGGGGGGg..', '....gGGGGGGGGGg....', '......gGGGGGg......',
    '........tt.........', '........tt.........', '.......tdt.........',
  ],
  palette: { G: '#397652', g: '#5d9b61', L: '#a8c976', t: '#785139', d: '#533c31' },
};
const BENCH: PixelSprite = {
  rows: [
    '................', '...oooooooooo...', '..oRRRRRRRRRRo..',
    '..oRrRrRrRrRRo..', '..oooooooooooo..', '....o......o.....',
    '....o......o.....', '....o......o.....', '..oooooooooooo..',
    '..oYYYYYYYYYYo..', '..oooooooooooo..', '................',
  ],
  palette: { o: '#543b32', R: '#b7684c', r: '#d58d60', Y: '#c89c63' },
};
const LAMP: PixelSprite = {
  rows: [
    '.......YYYY......', '......YyyyyY.....', '......YyYYyY.....',
    '.......YYYY......', '........oo........', '........oo........',
    '........oo........', '........oo........', '........oo........',
    '........oo........', '.......oGGGo.......', '......oooooooo....',
    '................',
  ],
  palette: { Y: '#ffe0a0', y: '#ffbd5d', o: '#60463a', G: '#8a6240' },
};
const LAMP_OFF: PixelSprite = {
  rows: [
    '.......YYYY......', '......YyyyyY.....', '......YyYYyY.....',
    '.......YYYY......', '........oo........', '........oo........',
    '........oo........', '........oo........', '........oo........',
    '........oo........', '.......oGGGo.......', '......oooooooo....',
    '................',
  ],
  palette: { Y: '#7c7c88', y: '#60606a', o: '#60463a', G: '#8a6240' },
};
const FOUNTAIN: PixelSprite = {
  rows: [
    '.....oooooooo.....', '....oWWWWWWWWo....', '...oWwwWwwWwwWo...',
    '..oooooooooooooo..', '..oBBBBBBBBBBBBo..', '..oBbbbbbbbbbbBo..',
    '..oooooooooooooo..', '.oGGGGGGGGGGGGGGo.', '.oGggggggggggggGo.',
    '.oooooooooooooooo.', '....oooooooooo....', '................',
  ],
  palette: { o: '#735542', W: '#9be5d6', w: '#55b8b4', B: '#557d91', b: '#75a8aa', G: '#d7bd91', g: '#ead8ae' },
};
const PLANTER: PixelSprite = {
  rows: [
    '..o............o.', '.oGGGGGGGGGGGGGGo.', '.oGgGgGgGgGgGgGGo.',
    '..oooooooooooooo..', '...oBBBBBBBBBBo...', '...oBbbbbbbbbBo...',
    '....oooooooooo....',
  ],
  palette: { o: '#75503c', G: '#d4aa72', g: '#a9ce77', B: '#ad6c4f', b: '#cb8d67' },
};

const PLACE_PALETTE: Record<PlaceId, { wall: string; roof: string; light: string; sign: string }> = {
  maison: { wall: '#f0d4a4', roof: '#a74f46', light: '#f9e6bd', sign: 'FOYER' },
  college: { wall: '#d9c9aa', roof: '#59728a', light: '#e9d5a6', sign: 'ÉCOLE' },
  epicerie: { wall: '#edcf91', roof: '#9a5143', light: '#f7e4b1', sign: 'BERTIN' },
  friche: { wall: '#a99a7c', roof: '#62616a', light: '#d2b17e', sign: 'ATELIER' },
  parc: { wall: '#bfd09a', roof: '#557d54', light: '#f1df9d', sign: 'PARC' },
  place: { wall: '#e8d4ad', roof: '#a96c48', light: '#f9e6bd', sign: 'MARCHÉ' },
};

/** Dessine un sprite à l'échelle de la tuile, aligné sur des pixels entiers. */
function drawPixels(ctx: CanvasRenderingContext2D, sprite: PixelSprite, x: number, y: number, scale: number): void {
  const rows = sprite.rows;
  const width = Math.max(...rows.map((row) => row.length));
  const px = Math.round(x - width * scale / 2);
  const py = Math.round(y - rows.length * scale);
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row]!.length; col++) {
      const code = rows[row]![col] as Pixel;
      const color = sprite.palette[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(px + col * scale), Math.round(py + row * scale), Math.ceil(scale), Math.ceil(scale));
    }
  }
}

export function drawWorldProp(
  ctx: CanvasRenderingContext2D,
  prop: WorldPropId | StreetPropKind,
  tileX: number,
  tileY: number,
  tileSize: number,
  now: number,
  isDark = false,
): void {
  const x = tileX + tileSize / 2;
  const base = tileY + tileSize * 0.88;
  const scale = tileSize / 16;

  if (
    prop === 'boite_lettres' ||
    prop === 'chat_muret' ||
    prop === 'moineau' ||
    prop === 'pigeon' ||
    prop === 'flaque'
  ) {
    drawStreetLifeProp(ctx, x, base, prop, scale, now, isDark);
    return;
  }

  // Lueur chaude du lampadaire allumé en soirée / nuit
  if (prop === 'lampadaire' && isDark) {
    const glow = ctx.createRadialGradient(x, base - scale * 10, 2, x, base - scale * 10, tileSize * 1.35);
    glow.addColorStop(0, 'rgba(255,220,130,0.5)');
    glow.addColorStop(0.5, 'rgba(255,180,80,0.18)');
    glow.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, base - scale * 10, tileSize * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(54,42,35,0.24)';
  ctx.beginPath();
  ctx.ellipse(x, base, tileSize * 0.34, tileSize * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprite = prop === 'arbre'
    ? TREE
    : prop === 'banc'
      ? BENCH
      : prop === 'lampadaire'
        ? (isDark ? LAMP : LAMP_OFF)
        : prop === 'fontaine'
          ? FOUNTAIN
          : PLANTER;
  drawPixels(ctx, sprite, x, base, scale);

  if (prop === 'fontaine') {
    const ripple = Math.floor(now / 460) % 2;
    ctx.fillStyle = ripple ? 'rgba(240,255,230,0.8)' : 'rgba(169,235,221,0.8)';
    ctx.fillRect(Math.round(x - scale * 2), Math.round(base - scale * 9), Math.max(1, Math.round(scale * 3)), Math.max(1, Math.round(scale * 0.65)));
  }
}

/** Petite façade par lieu : seuil en profondeur, toiture, vitrine et enseigne lisible. */
export function drawPlaceLandmark(
  ctx: CanvasRenderingContext2D,
  place: PlaceId,
  tileX: number,
  tileY: number,
  tileSize: number,
  isDark: boolean,
): void {
  const palette = PLACE_PALETTE[place];
  const unit = Math.max(1, Math.round(tileSize / 32));
  const x = Math.round(tileX + tileSize * 0.1);
  const width = Math.round(tileSize * 0.8);
  const roofY = Math.round(tileY + tileSize * 0.08);
  const wallY = Math.round(tileY + tileSize * 0.24);
  const wallH = Math.round(tileSize * 0.65);

  ctx.fillStyle = 'rgba(54,38,30,0.32)';
  ctx.fillRect(x - unit * 2, wallY + wallH, width + unit * 4, unit * 3);
  ctx.fillStyle = '#60463a';
  ctx.fillRect(x - unit, roofY + unit * 2, width + unit * 2, unit * 5);
  ctx.fillStyle = palette.roof;
  ctx.fillRect(x, roofY, width, unit * 7);
  ctx.fillStyle = 'rgba(255,232,185,0.42)';
  ctx.fillRect(x + unit, roofY, Math.round(width * 0.42), unit);
  ctx.fillStyle = palette.wall;
  ctx.fillRect(x + unit, wallY, width - unit * 2, wallH);
  ctx.fillStyle = 'rgba(104,65,45,0.22)';
  ctx.fillRect(x + unit, wallY + wallH - unit * 2, width - unit * 2, unit * 2);

  const signX = x + Math.round(width * 0.16);
  const signY = wallY + unit * 2;
  const signW = Math.round(width * 0.68);
  ctx.fillStyle = '#624337';
  ctx.fillRect(signX - unit, signY - unit, signW + unit * 2, unit * 5);
  ctx.fillStyle = palette.roof;
  ctx.fillRect(signX, signY, signW, unit * 3);
  ctx.fillStyle = palette.light;
  ctx.font = `bold ${Math.max(4, Math.floor(tileSize * 0.105))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(palette.sign, signX + signW / 2, signY + unit * 1.5, signW - unit * 2);

  const glassY = wallY + unit * 8;
  ctx.fillStyle = '#63483c';
  ctx.fillRect(x + unit * 2, glassY, Math.round(width * 0.32), Math.round(wallH * 0.3));
  ctx.fillStyle = isDark ? '#f2c879' : '#8eb7ae';
  ctx.fillRect(x + unit * 3, glassY + unit, Math.round(width * 0.32) - unit * 2, Math.round(wallH * 0.3) - unit * 2);
  ctx.fillStyle = '#674638';
  ctx.fillRect(x + Math.round(width * 0.62), wallY + Math.round(wallH * 0.42), Math.round(width * 0.22), Math.round(wallH * 0.58));
  ctx.fillStyle = '#dbb16e';
  ctx.fillRect(x + Math.round(width * 0.78), wallY + Math.round(wallH * 0.68), unit, unit);
}
