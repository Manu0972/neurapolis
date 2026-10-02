/**
 * NEURAPOLIS — Sprites Évolutifs de Camille (12 ans, 14 ans, 16 ans).
 *
 * Déclinaisons morphologiques et animations frame-par-frame :
 * - 12 ans : 16×22 px (écolier vif, cartable en bandoulière qui oscille, allure sautillante, ~2.2 têtes)
 * - 14 ans : 16×24 px (adolescent investi, veste légère, sacoche cuir & carnet, ~2.5 têtes)
 * - 16 ans : 16×26 px (jeune bâtisseur mature, tablier d'artisan / blouson avec écusson, ~2.8 têtes)
 */
import { OUTLINE, HYGGE_1800K, PALETTE_RAMPS } from '../palette';

export type CamilleAge = '12' | '14' | '16';

export interface CharacterSpriteFrame {
  readonly w: number;
  readonly h: number;
  readonly rows: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
}

const CAMILLE_PALETTE: Record<string, string> = {
  o: OUTLINE,                     // Brun chaud #2a1a14
  h: PALETTE_RAMPS.hairBrown.base, // #6b4a2f
  H: PALETTE_RAMPS.hairBrown.light,// #8a6240
  s: PALETTE_RAMPS.skinLight.base, // #ffc496
  S: PALETTE_RAMPS.skinLight.shadow,// #cf8f74
  t: PALETTE_RAMPS.coral.base,     // Haut corail #f48c5d
  T: PALETTE_RAMPS.coral.shadow,   // Ombre corail #c25a40
  p: PALETTE_RAMPS.denim.base,     // Pantalon bleu denim #4a5a7a
  P: PALETTE_RAMPS.denim.shadow,   // Ombre denim #243250
  b: PALETTE_RAMPS.wood.shadow,    // Chaussures cuir sombre #4a3424
  c: HYGGE_1800K,                  // Cartable / sacoche dorée #ffd98a
  k: '#e8d6b0',                    // Carnet de notes kraft
};

/* ── Camille 12 Ans (16×22 px) ─────────────────────────────────── */

const C12_HEAD = [
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

const C12_BODY = [
  '....otttttto....',
  '...oTtttcttto...', // c = lanière cartable
  '...ottttcttto...',
  '....otttttto....',
];

const C12_LEGS_IDLE = [
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....op...po.....',
  '....bb...bb.....',
  '................',
  '................',
];

const C12_LEGS_W0 = [
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...opp....opp...',
  '...bb.....bb....',
  '................',
  '................',
];

const C12_LEGS_W1 = [
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....bb..bb......',
  '................',
  '................',
];

const C12_LEGS_W2 = [
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....opp...opp...',
  '....bb....bb....',
  '................',
  '................',
];

/* ── Camille 14 Ans (16×24 px) ─────────────────────────────────── */

const C14_HEAD = [
  '.....oooooo.....',
  '....oHHHHHho....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const C14_BODY = [
  '....otttttto....',
  '...oTttttttto...',
  '...otttkkttto...', // k = carnet kraft
  '...otttkkttto...',
  '....otttttto....',
];

const C14_LEGS_IDLE = [
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....op...po.....',
  '....bb...bb.....',
  '................',
];

const C14_LEGS_W0 = [
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...opp....opp...',
  '...bb.....bb....',
  '................',
];

const C14_LEGS_W1 = [
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....bb..bb......',
  '................',
];

const C14_LEGS_W2 = [
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....opp...opp...',
  '....bb....bb....',
  '................',
];

/* ── Camille 16 Ans (16×26 px) ─────────────────────────────────── */

const C16_HEAD = [
  '.....oooooo.....',
  '....oHHHHHho....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const C16_BODY = [
  '...oottkkoo.....', // k = écusson coop
  '..oottttttoo....',
  '..otttttttto....',
  '..otttttttto....',
  '..oTttttttTo....',
  '...otttttto.....',
];

const C16_LEGS_IDLE = [
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....op...po.....',
  '....bb...bb.....',
  '................',
];

const C16_LEGS_W0 = [
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...opp....opp...',
  '...bb.....bb....',
  '................',
];

const C16_LEGS_W1 = [
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....bb..bb......',
  '................',
];

const C16_LEGS_W2 = [
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....opp...opp...',
  '....bb....bb....',
  '................',
];

/* ── Assemblage des Frames ─────────────────────────────────────── */

function buildSprite(head: string[], body: string[], legs: string[], targetH: number): string[] {
  const merged = head.concat(body, legs);
  return merged.slice(0, targetH);
}

export function getCamilleSprite(
  age: CamilleAge,
  walking: boolean,
  animFrame: number,
): CharacterSpriteFrame {
  let rows: string[];
  let h = 24;

  if (age === '12') {
    h = 22;
    if (!walking) {
      rows = buildSprite(C12_HEAD, C12_BODY, C12_LEGS_IDLE, h);
    } else {
      const walkFrames = [
        buildSprite(C12_HEAD, C12_BODY, C12_LEGS_W0, h),
        buildSprite(C12_HEAD, C12_BODY, C12_LEGS_W1, h),
        buildSprite(C12_HEAD, C12_BODY, C12_LEGS_W2, h),
        buildSprite(C12_HEAD, C12_BODY, C12_LEGS_W1, h),
      ];
      rows = walkFrames[animFrame % 4]!;
    }
  } else if (age === '16') {
    h = 26;
    if (!walking) {
      rows = buildSprite(C16_HEAD, C16_BODY, C16_LEGS_IDLE, h);
    } else {
      const walkFrames = [
        buildSprite(C16_HEAD, C16_BODY, C16_LEGS_W0, h),
        buildSprite(C16_HEAD, C16_BODY, C16_LEGS_W1, h),
        buildSprite(C16_HEAD, C16_BODY, C16_LEGS_W2, h),
        buildSprite(C16_HEAD, C16_BODY, C16_LEGS_W1, h),
      ];
      rows = walkFrames[animFrame % 4]!;
    }
  } else {
    // 14 ans (défaut)
    h = 24;
    if (!walking) {
      rows = buildSprite(C14_HEAD, C14_BODY, C14_LEGS_IDLE, h);
    } else {
      const walkFrames = [
        buildSprite(C14_HEAD, C14_BODY, C14_LEGS_W0, h),
        buildSprite(C14_HEAD, C14_BODY, C14_LEGS_W1, h),
        buildSprite(C14_HEAD, C14_BODY, C14_LEGS_W2, h),
        buildSprite(C14_HEAD, C14_BODY, C14_LEGS_W1, h),
      ];
      rows = walkFrames[animFrame % 4]!;
    }
  }

  return {
    w: 16,
    h,
    rows,
    palette: CAMILLE_PALETTE,
  };
}

/**
 * Dessine Camille à l'écran selon son âge et son animation.
 */
export function drawCamille(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  age: CamilleAge,
  t: number,
  walking: boolean,
): void {
  const animFrame = walking ? Math.floor(t * 6) % 4 : 0;
  const sprite = getCamilleSprite(age, walking, animFrame);
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
