/**
 * NEURAPOLIS — Mobilier Urbain & Micro-Détails de Vie 2.5D ("Street Life").
 *
 * Sprites pixel-art et animations pour insuffler la vie de quartier (Minami Lane / Eastward) :
 * - Mobilier urbain : boîtes aux lettres vintage PTT, bancs, lampadaires 1800K, bacs fleuris, fontaine.
 * - Faune & micro-détails : chats somnolant sur murets, moineaux picorant, pigeon chapardeur, flaques d'eau.
 */
import {
  OUTLINE,
  HYGGE_1800K,
  WOOD_WARM,
  PALETTE_RAMPS,
} from '../palette';

export type StreetPropKind =
  | 'banc'
  | 'lampadaire'
  | 'fontaine'
  | 'jardiniere'
  | 'arbre'
  | 'boite_lettres'
  | 'chat_muret'
  | 'moineau'
  | 'pigeon'
  | 'flaque';

export interface PixelSpriteData {
  readonly rows: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
}

/* ── 1. Boîte aux Lettres d'Époque PTT ──────────────────────────── */

export const LETTERBOX_SPRITE: PixelSpriteData = {
  rows: [
    '....YYYY....',
    '...YYYYYY...',
    '..YoYYYYoY..',
    '..YooooooY..',
    '..YYYYYYYY..',
    '..YYBBBYYY..',
    '..YYYYYYYY..',
    '....oooo....',
    '....oooo....',
    '....oooo....',
    '...oooooo...',
  ],
  palette: {
    Y: '#ffd98a', // Jaune doré PTT
    o: OUTLINE,   // Brun chaud
    B: '#8a5a3a', // Serrure bronze
  },
};

/* ── 2. Chat Somnolent sur Muret (3 frames) ─────────────────────── */

export const CAT_FRAMES: readonly PixelSpriteData[] = [
  // Frame 0 : En boule, endormi (respiration basse)
  {
    rows: [
      '....hh..hh......',
      '...hhhhhhhh.....',
      '..hhhhhhhhhh....',
      '..hoohhoohhh....',
      '.hhhhhhhhhhhh...',
      '.hhhhhhhhhhhhh..',
      '..hhhhhhhhhhh...',
    ],
    palette: { h: '#f48c5d', o: '#c25a40' }, // Chat roux tigré
  },
  // Frame 1 : Respiration haute (+1px d'ampleur au flanc)
  {
    rows: [
      '....hh..hh......',
      '...hhhhhhhh.....',
      '..hhhhhhhhhh....',
      '..hoohhoohhh....',
      '.hhhhhhhhhhhhh..',
      '.hhhhhhhhhhhhh..',
      '..hhhhhhhhhhh...',
    ],
    palette: { h: '#f48c5d', o: '#c25a40' },
  },
  // Frame 2 : Étirement des pattes avant & bâillement
  {
    rows: [
      '....hh..hh......',
      '...hhhhhhhh.....',
      '..hoohhoohhh....',
      '..hhhsshhhhh....', // s = langue rose
      '.hhhhhhhhhhhhhh.',
      '.hhhh...hhhhhh..',
      '..hh.....hhhh...',
    ],
    palette: { h: '#f48c5d', o: '#c25a40', s: '#ffb08a' },
  },
];

/* ── 3. Moineau Picorant (3 frames) ────────────────────────────── */

export const SPARROW_FRAMES: readonly PixelSpriteData[] = [
  // Frame 0 : Guet debout
  {
    rows: [
      '..bb....',
      '.bbbbe..', // e = bec doré
      '.bbb....',
      '..bb....',
      '..o.o...', // pattes
    ],
    palette: { b: '#6b4a2f', e: '#ffd98a', o: OUTLINE },
  },
  // Frame 1 : Tête baissée, picore le pavé
  {
    rows: [
      '....bb..',
      '..bbbb..',
      '.bbbbe..',
      '..bb....',
      '..o.o...',
    ],
    palette: { b: '#6b4a2f', e: '#ffd98a', o: OUTLINE },
  },
  // Frame 2 : Sautillement pattes décollées
  {
    rows: [
      '..bb....',
      '.bbbbe..',
      '.bbb....',
      '..bb....',
      '..o.....',
    ],
    palette: { b: '#6b4a2f', e: '#ffd98a', o: OUTLINE },
  },
];

/* ── 4. Pigeon Chapardeur (3 frames) ────────────────────────────── */

export const PIGEON_FRAMES: readonly PixelSpriteData[] = [
  // Frame 0 : Debout, œil malicieux
  {
    rows: [
      '...gg....',
      '..ggggo..',
      '..vvgg...', // v = jabot violet doux
      '.ggggg...',
      '.ggggg...',
      '..o.o....',
    ],
    palette: { g: '#7b8499', v: '#8e8a9a', o: OUTLINE },
  },
  // Frame 1 : Picore un papier de bonbon violet
  {
    rows: [
      '.....gg..',
      '...gggg..',
      '..vvggo..',
      '.ggggggp.', // p = papier de bonbon
      '.ggggg...',
      '..o.o....',
    ],
    palette: { g: '#7b8499', v: '#8e8a9a', o: OUTLINE, p: '#c25a40' },
  },
  // Frame 2 : Envol furtif
  {
    rows: [
      '.gg.gg...',
      'ggggggg..',
      '..vvggo..',
      '...ggg...',
      '..o......',
    ],
    palette: { g: '#7b8499', v: '#8e8a9a', o: OUTLINE },
  },
];

/* ── Fonction de Tracé Pixel ────────────────────────────────────── */

function drawPixelData(
  ctx: CanvasRenderingContext2D,
  data: PixelSpriteData,
  x: number,
  y: number,
  scale: number,
): void {
  const rows = data.rows;
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  const px = Math.round(x - (w * scale) / 2);
  const py = Math.round(y - h * scale);

  for (let r = 0; r < h; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row.charAt(c);
      if (ch === '.') continue;
      const col = data.palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(px + c * scale), Math.round(py + r * scale), Math.ceil(scale), Math.ceil(scale));
    }
  }
}

/**
 * Dessine un élément de mobilier urbain ou un animal animé.
 */
export function drawStreetLifeProp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  prop: StreetPropKind,
  scale: number,
  now: number,
  isDark = false,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  switch (prop) {
    case 'boite_lettres': {
      // Ombre
      ctx.fillStyle = 'rgba(42, 26, 20, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y, 6 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      drawPixelData(ctx, LETTERBOX_SPRITE, x, y, scale);
      break;
    }
    case 'chat_muret': {
      // Muret en brique
      const wallW = 20 * scale;
      const wallH = 6 * scale;
      ctx.fillStyle = PALETTE_RAMPS.brickRoof.shadow;
      ctx.fillRect(x - wallW / 2, y - wallH, wallW, wallH);
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(x - wallW / 2, y - wallH, wallW, wallH);

      // Cycle du chat : 12s sommeil calme, 2s étirement
      const cycleSec = (now / 1000) % 14;
      const frameIdx = cycleSec > 12 ? 2 : Math.floor((now / 1200) % 2);
      const catData = CAT_FRAMES[frameIdx]!;
      drawPixelData(ctx, catData, x, y - wallH, scale);
      break;
    }
    case 'moineau': {
      // Animation picorage
      const fIdx = Math.floor((now / 220) % 3);
      const sparrowData = SPARROW_FRAMES[fIdx]!;
      drawPixelData(ctx, sparrowData, x, y, scale);
      break;
    }
    case 'pigeon': {
      // Animation pigeon chapardeur
      const pIdx = Math.floor((now / 350) % 3);
      const pigeonData = PIGEON_FRAMES[pIdx]!;
      drawPixelData(ctx, pigeonData, x, y, scale);
      break;
    }
    case 'flaque': {
      // Flaque au sol avec ondelettes de pluie
      ctx.fillStyle = 'rgba(65, 166, 246, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y, 10 * scale, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(115, 239, 247, 0.5)';
      ctx.lineWidth = 1;
      const rippleR = ((now * 0.02) % (8 * scale)) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y, rippleR, rippleR * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'fontaine': {
      // Fontaine octogonale avec clapotis d'eau
      const baseR = 14 * scale;
      ctx.fillStyle = 'rgba(42, 26, 20, 0.28)';
      ctx.beginPath();
      ctx.ellipse(x, y, baseR + 2 * scale, (baseR + 2 * scale) * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bassin pierre
      ctx.fillStyle = PALETTE_RAMPS.wallPlaster.base;
      ctx.fillRect(x - baseR, y - 8 * scale, baseR * 2, 8 * scale);
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(x - baseR, y - 8 * scale, baseR * 2, 8 * scale);

      // Eau clapotante
      ctx.fillStyle = PALETTE_RAMPS.water.base;
      ctx.fillRect(x - baseR + 2 * scale, y - 6 * scale, (baseR - 2 * scale) * 2, 5 * scale);

      // Gerbe d'eau centrale animée
      const jetH = 6 * scale + Math.sin(now * 0.006) * (2 * scale);
      ctx.fillStyle = PALETTE_RAMPS.water.light;
      ctx.fillRect(x - scale, y - 8 * scale - jetH, 2 * scale, jetH);
      break;
    }
    case 'lampadaire': {
      // Réverbère en fonte
      const lampH = 26 * scale;
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x - scale, y - lampH, 2 * scale, lampH);
      // Base
      ctx.fillRect(x - 3 * scale, y - 2 * scale, 6 * scale, 2 * scale);
      // Lanterne
      const lanternY = y - lampH - 6 * scale;
      ctx.fillRect(x - 4 * scale, lanternY, 8 * scale, 6 * scale);
      ctx.fillStyle = isDark ? HYGGE_1800K : '#4a5a7a';
      ctx.fillRect(x - 3 * scale, lanternY + scale, 6 * scale, 4 * scale);

      if (isDark) {
        // Halo radial 1800K
        const glow = ctx.createRadialGradient(x, lanternY + 3 * scale, 2, x, lanternY + 3 * scale, 24 * scale);
        glow.addColorStop(0, 'rgba(255, 217, 138, 0.45)');
        glow.addColorStop(0.5, 'rgba(255, 217, 138, 0.15)');
        glow.addColorStop(1, 'rgba(255, 217, 138, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, lanternY + 3 * scale, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'banc': {
      // Banc en bois et fonte
      const bW = 20 * scale;
      const bH = 10 * scale;
      ctx.fillStyle = WOOD_WARM;
      ctx.fillRect(x - bW / 2, y - bH, bW, 3 * scale); // dossier
      ctx.fillRect(x - bW / 2, y - 5 * scale, bW, 3 * scale); // assise
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x - bW / 2 + scale, y - 5 * scale, 2 * scale, 5 * scale); // pied G
      ctx.fillRect(x + bW / 2 - 3 * scale, y - 5 * scale, 2 * scale, 5 * scale); // pied D
      break;
    }
    case 'jardiniere': {
      // Bac à fleurs avec pensées et soucis colorés
      const jW = 16 * scale;
      const jH = 6 * scale;
      ctx.fillStyle = PALETTE_RAMPS.wood.shadow;
      ctx.fillRect(x - jW / 2, y - jH, jW, jH);
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(x - jW / 2, y - jH, jW, jH);

      // Végétation
      ctx.fillStyle = PALETTE_RAMPS.foliage.base;
      ctx.fillRect(x - jW / 2 + scale, y - jH - 3 * scale, jW - 2 * scale, 3 * scale);

      // Fleurs
      ctx.fillStyle = HYGGE_1800K;
      ctx.fillRect(x - 4 * scale, y - jH - 4 * scale, 2 * scale, 2 * scale);
      ctx.fillStyle = PALETTE_RAMPS.coral.base;
      ctx.fillRect(x + 2 * scale, y - jH - 4 * scale, 2 * scale, 2 * scale);
      break;
    }
    case 'arbre': {
      // Tronc en chêne
      const trunkW = 4 * scale;
      const trunkH = 14 * scale;
      ctx.fillStyle = PALETTE_RAMPS.wood.base;
      ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

      // Frondaison ronde en dégradé
      const crownR = 14 * scale;
      ctx.fillStyle = PALETTE_RAMPS.foliage.shadow;
      ctx.beginPath();
      ctx.arc(x, y - trunkH - crownR * 0.7, crownR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE_RAMPS.foliage.base;
      ctx.beginPath();
      ctx.arc(x - 2 * scale, y - trunkH - crownR * 0.8, crownR * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE_RAMPS.foliage.light;
      ctx.beginPath();
      ctx.arc(x - 4 * scale, y - trunkH - crownR * 0.9, crownR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
