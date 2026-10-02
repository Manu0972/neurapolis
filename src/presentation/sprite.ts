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

/**
 * Silhouette translucide d'un fantôme conseiller (Smith, Marx, Ostrom...)
 * flottant en lévitation lorsqu'il murmure à l'oreille du joueur ou débat sur la place.
 */
export function drawGhostSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  ghost: { id: string; name: string; color: string; emoji?: string },
  t: number,
  mode: 'murmure' | 'debat' = 'murmure',
): void {
  ctx.save();

  // Flottement éthéré & pulsation spectrale
  const floatY = Math.sin(t * 2.8) * (scale * 3);
  const alpha = 0.55 + 0.15 * Math.sin(t * 3.5);
  ctx.globalAlpha = Math.max(0.3, Math.min(0.85, alpha));

  const gy = y - scale * 6 + floatY;

  // Halo spectral doux autour du penseur
  const aura = ctx.createRadialGradient(x, gy - scale * 10, 2, x, gy - scale * 10, SPRITE_W * scale * 1.5);
  aura.addColorStop(0, `${ghost.color}88`);
  aura.addColorStop(0.5, `${ghost.color}33`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, gy - scale * 10, SPRITE_W * scale * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Dessin du corps fantomatique (palette translucide spectrale)
  drawCharacter(
    ctx,
    x,
    gy,
    scale,
    {
      hair: ghost.color,
      shirt: ghost.color,
      skin: '#e8f4fc',
      pants: '#2f3545',
      shoes: '#1e2230',
    },
    t,
    false,
  );

  // Bulle / onde de pensée au-dessus de la tête
  ctx.font = `bold ${Math.max(7, Math.floor(scale * 4.2))}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = ghost.color;
  const badge = mode === 'debat' ? `⚡ ${ghost.name}` : `« ${ghost.name} »`;
  ctx.fillText(badge, x, gy - scale * 26);

  ctx.restore();
}

