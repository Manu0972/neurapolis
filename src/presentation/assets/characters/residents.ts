/**
 * NEURAPOLIS — Silhouettes et Sprites Différenciés des Habitants de Val-Ferrand.
 *
 * Évite les clones génériques en fournissant des morphologies, accessoires et postures uniques :
 * - Noah : Casquette vissée de travers, sacoche d'écolier, allure espiègle et déhanchée (16×23 px).
 * - Lina : Lunettes rondes, carnet de comptes sous le bras, couettes soignées, allure vive (16×23 px).
 * - Mme Bertin : Silhouette rondelette, châle tricoté écru, lunettes sur le nez, tablier d'épicière (18×23 px).
 * - Samir : Carrure solide, bleu de travail retroussé, mètre ruban à la ceinture, peau chaude (17×25 px).
 * - Karim : Salopette d'artisan mécanicien, clé à molette apparente, casquette plate d'ouvrier (18×25 px).
 */
import { OUTLINE, HYGGE_1800K, PALETTE_RAMPS } from '../palette';
import type { CharacterSpriteFrame } from './camille';

export type ResidentId = 'noah' | 'lina' | 'bertin' | 'samir' | 'karim' | 'yasmine' | 'monique';

/* ── 1. Noah Martin (Casquette & Allure Espiègle) ───────────────── */

const NOAH_PAL: Record<string, string> = {
  o: OUTLINE,
  h: '#5b3a29', // Cheveux châtain
  H: '#785139',
  s: PALETTE_RAMPS.skinLight.base,
  S: PALETTE_RAMPS.skinLight.shadow,
  c: '#3d6cb4', // Casquette bleue
  t: '#4ea1ff', // Haut bleu vif
  T: '#34406a',
  p: '#2f3545', // Jean sombre
  b: '#4a3424', // Baskets
};

const NOAH_HEAD = [
  '....cccccccc....', // Casquette en biais
  '...ccccccccho...',
  '..oHHHHHhhooo...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const NOAH_BODY = [
  '....otttttto....',
  '...oTttttttto...',
  '...otttttttto...',
  '....otttttto....',
];

const NOAH_LEGS_IDLE = [
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....op...po.....',
  '....bb...bb.....',
  '................',
];

const NOAH_LEGS_W0 = [
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...opp....opp...',
  '...bb.....bb....',
  '................',
  '................',
];

const NOAH_LEGS_W1 = [
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....bb..bb......',
  '................',
  '................',
];

/* ── 2. Lina Kessler (Lunettes & Carnet de Notes) ──────────────── */

const LINA_PAL: Record<string, string> = {
  o: OUTLINE,
  h: '#3a2c22', // Cheveux bruns au carré
  H: '#5a4234',
  s: PALETTE_RAMPS.skinLight.base,
  S: PALETTE_RAMPS.skinLight.shadow,
  g: '#ffd98a', // Lunettes rondes dorées
  t: '#5cd6e8', // Haut turquoise vif
  T: '#257179',
  k: '#e8d6b0', // Carnet serré sous le bras
  p: '#6b4a2f', // Jupe ou pantalon brun
  b: '#3a2a20',
};

const LINA_HEAD = [
  '.....oooooo.....',
  '....oHHHHHho....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osgggssggo...', // Lunettes g
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const LINA_BODY = [
  '....otttttto....',
  '...oTtttkktto...', // k = carnet de notes
  '...ottttkktto...',
  '....otttttto....',
];

/* ── 3. Mme Bertin (Châle Tricoté & Tablier d'Épicière) ────────── */

const BERTIN_PAL: Record<string, string> = {
  o: OUTLINE,
  h: '#8e8a9a', // Cheveux gris/argent en chignon
  H: '#c8b9a0',
  s: PALETTE_RAMPS.skinLight.base,
  S: PALETTE_RAMPS.skinLight.shadow,
  w: '#f9ecd0', // Châle en laine écru tricoté
  t: '#c15f4a', // Robe terracotta
  a: '#efd9ac', // Tablier d'épicière
  p: '#8f3a34', // Bas de jupe
  b: '#4a3424',
};

const BERTIN_HEAD = [
  '......oooooo......',
  '.....oHHHHHho.....',
  '....ohhhhhhhho....',
  '...ohhhhhhhhhho...',
  '...ohhhhhhhhhho...',
  '....oSSSSSSSSo....',
  '....osesssseso....',
  '....osssmmssso....',
  '....osssssssso....',
  '......oooooo......',
];

const BERTIN_BODY = [
  '....owwwwwwwwo....', // Châle de laine w
  '...owwaaaaaawwo...', // Tablier a
  '...owwaaaaaawwo...',
  '....oaaaaaaaa....',
];

const BERTIN_LEGS = [
  '....opppppppo....',
  '....opppppppo....',
  '....opppppppo....',
  '....opppppppo....',
  '.....bb...bb.....',
  '................',
];

/* ── 4. Samir Ould-Ali (Bleu de Travail & Mètre Ruban) ──────────── */

const SAMIR_PAL: Record<string, string> = {
  o: OUTLINE,
  h: '#2c2230', // Cheveux noirs courts
  H: '#4a3220',
  s: PALETTE_RAMPS.skinWarm.base,   // #b47a56 Peau chaude
  S: PALETTE_RAMPS.skinWarm.shadow, // #8a5238
  t: '#3ddc84', // Bleu de travail vert ouvrier
  T: '#257179',
  y: '#ffd98a', // Mètre ruban laiton
  p: '#243250', // Pantalon épais ouvrier
  b: '#1e2230', // Chaussures de sécurité
};

const SAMIR_HEAD = [
  '.....oooooo.....',
  '....oHHHHHho....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const SAMIR_BODY = [
  '...oottttttoo...', // Épaules carrées plus larges
  '..oottttttttoo..',
  '..oTttttttttyo..', // y = mètre ruban
  '..otttttttttto..',
  '...oottttttoo...',
];

const SAMIR_LEGS = [
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...opp....ppo...',
  '...bbb....bbb...',
  '................',
];

/* ── 5. Karim Bensalah (Salopette d'Artisan Mécanicien) ────────── */

const KARIM_PAL: Record<string, string> = {
  o: OUTLINE,
  h: '#2c2230', // Cheveux noirs bouclés
  H: '#4a3220',
  s: PALETTE_RAMPS.skinWarm.base,
  S: PALETTE_RAMPS.skinWarm.shadow,
  c: '#8a5a3a', // Casquette plate en drap de laine
  t: '#ffc94a', // Salopette jaune moutarde d'artisan
  T: '#bc7e4d',
  w: '#7b8499', // Clé à molette acier
  p: '#ffc94a', // Jambes salopette
  b: '#4a3424',
};

const KARIM_HEAD = [
  '....cccccccc....',
  '...ccccccccco...',
  '..oHHHHHhhooo...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const KARIM_BODY = [
  '...oottttttoo...',
  '..oottttttttoo..',
  '..ottttwwtttto..', // w = clé à molette
  '..ottttwwtttto..',
  '...oottttttoo...',
];

const KARIM_LEGS = [
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...oppp..pppo...',
  '...opp....ppo...',
  '...bbb....bbb...',
  '................',
];

/* ── Assemblage des Sprites PNJ ────────────────────────────────── */

export function getResidentSprite(
  npcId: string,
  walking: boolean,
  animFrame: number,
): CharacterSpriteFrame {
  switch (npcId) {
    case 'bertin': {
      const rows = BERTIN_HEAD.concat(BERTIN_BODY, BERTIN_LEGS).slice(0, 23);
      return { w: 18, h: 23, rows, palette: BERTIN_PAL };
    }
    case 'samir': {
      const rows = SAMIR_HEAD.concat(SAMIR_BODY, SAMIR_LEGS).slice(0, 25);
      return { w: 17, h: 25, rows, palette: SAMIR_PAL };
    }
    case 'karim': {
      const rows = KARIM_HEAD.concat(KARIM_BODY, KARIM_LEGS).slice(0, 25);
      return { w: 18, h: 25, rows, palette: KARIM_PAL };
    }
    case 'noah': {
      const legs = walking
        ? (animFrame % 2 === 0 ? NOAH_LEGS_W0 : NOAH_LEGS_W1)
        : NOAH_LEGS_IDLE;
      const rows = NOAH_HEAD.concat(NOAH_BODY, legs).slice(0, 23);
      return { w: 16, h: 23, rows, palette: NOAH_PAL };
    }
    case 'lina':
    default: {
      const legs = walking
        ? (animFrame % 2 === 0 ? NOAH_LEGS_W0 : NOAH_LEGS_W1)
        : NOAH_LEGS_IDLE;
      const rows = LINA_HEAD.concat(LINA_BODY, legs).slice(0, 23);
      return { w: 16, h: 23, rows, palette: LINA_PAL };
    }
  }
}

/**
 * Dessine un habitant avec sa silhouette personnalisée.
 */
export function drawResident(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  npcId: string,
  t: number,
  walking: boolean,
): void {
  const animFrame = walking ? Math.floor(t * 6) % 4 : 0;
  const sprite = getResidentSprite(npcId, walking, animFrame);
  const bob = walking ? 0 : Math.floor(t * 1.5) % 2;

  const px = Math.round(x - (sprite.w * scale) / 2);
  const py = Math.round(y - sprite.h * scale + bob * scale);

  for (let r = 0; r < sprite.h; r++) {
    const row = sprite.rows[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const ch = row.charAt(c);
      if (ch === '.') continue;
      const col = sprite.palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(px + c * scale), Math.round(py + r * scale), Math.ceil(scale), Math.ceil(scale));
    }
  }
}
