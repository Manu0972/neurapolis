/**
 * Sprite pixel-art du personnage (chibi 16×23, frame par frame) — le rendu RÉEL.
 * Remplace les anciennes pastilles de couleur. Palette chaude (direction artistique
 * §3.1 : contour brun, ombres froides, lumières chaudes). Couleurs surchargées par
 * NPC (cheveux, haut, pantalon, peau) pour éviter les clones. Aucune donnée de
 * simulation ici : la présentation ne fait que dessiner.
 */

const BASE_PAL: Record<string, string> = {
  o: '#2a1a14', h: '#6b4a2f', H: '#8a6240', s: '#ffc496', S: '#cf8f74', e: '#2a1a14', m: '#b76a55',
  t: '#f48c5d', T: '#c25a40', p: '#4a5a7a', b: '#3a2a20',
};

const HEAD = [
  '.....oooooo.....',
  '....oHHHHHho....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...ohhhhhhho....',
  '...oSSSSSSSSo...',
  '...osesssseso...',
  '...osssmmssso...',
  '...osssssssso...',
  '.....oooooo.....',
];

const BODY = [
  '....otttttto....',
  '...oTttttttto...',
  '...otttttttto...',
  '....otttttto....',
  '....opppppo.....',
];

const L_IDLE = [
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....opp..ppo....',
  '....op...po.....',
  '....bb...bb.....',
];

const L_W0 = [
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...op.....op....',
  '...opp....opp...',
  '...bb.....bb....',
];

const L_PASS = [
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....oppppo......',
  '....bb..bb......',
];

const L_W2 = [
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....op....op....',
  '....opp...opp...',
  '....bb....bb....',
];

function frame(legs: string[]): string[] {
  return HEAD.concat(BODY, legs);
}

const IDLE = frame(L_IDLE);
const WALK = [frame(L_W0), frame(L_PASS), frame(L_W2), frame(L_PASS)];

/** Surcharges de couleur par personnage (évite les clones). */
export interface SpriteColors {
  hair?: string;
  skin?: string;
  shirt?: string;
  pants?: string;
  shoes?: string;
}

export const SPRITE_W = 16;
export const SPRITE_H = 23;

/**
 * Dessine le personnage. `x`,`y` = centre des pieds (base). `walking` choisit la
 * marche (4 poses) ou l'idle (respiration). `t` = temps pour la cadence.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  colors: SpriteColors,
  t: number,
  walking: boolean,
): void {
  const pal: Record<string, string> = { ...BASE_PAL };
  if (colors.hair) { pal.h = colors.hair; pal.H = colors.hair; }
  if (colors.skin) pal.s = colors.skin;
  if (colors.shirt) pal.t = colors.shirt;
  if (colors.pants) pal.p = colors.pants;
  if (colors.shoes) pal.b = colors.shoes;

  const rows = walking ? WALK[Math.floor(t * 6) % 4]! : IDLE;
  const bob = walking ? 0 : Math.floor(t * 1.6) % 2;
  const px = Math.round(x - (SPRITE_W / 2) * scale);
  const py = Math.round(y - SPRITE_H * scale + bob * scale);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row.charAt(c);
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch] ?? '#f0f';
      ctx.fillRect(px + c * scale, py + r * scale, scale, scale);
    }
  }
}

/** Ombre portée sous le personnage (l'intègre au sol). */
export function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.fillStyle = 'rgba(30,20,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, SPRITE_W * 0.4 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}
