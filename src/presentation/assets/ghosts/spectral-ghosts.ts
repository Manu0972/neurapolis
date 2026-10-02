/**
 * NEURAPOLIS — Silhouettes Spectrales des Fantômes Conseillers.
 *
 * Rendu poétique et vaporeux des 5 penseurs majeurs de la cité :
 * - Adam Smith : Perruque poudrée XVIIIe siècle, redingote, balance d'or en lévitation.
 * - Karl Marx : Crinière léonine, barbe en volutes de fumée, pardessus, rouage spectral & manuscrit.
 * - Elinor Ostrom : Silhouette bienveillante, aura d'eau claire, carnet de terrain & pousses végétales.
 * - John Maynard Keynes : Complet veston tweed, pipe de Cambridge traçant des courbes d'offre/demande.
 * - Frederick Taylor : Silhouette géométrique raide, chronomètre de précision à trotteuse tournoyante.
 */
import {
  HYGGE_1800K,
  OUTLINE,
} from '../palette';

export type SpectralGhostId = 'smith' | 'marx' | 'ostrom' | 'keynes' | 'taylor';

export interface SpectralGhostDef {
  readonly id: SpectralGhostId;
  readonly name: string;
  readonly era: string;
  readonly signatureColor: string;
  readonly auraColor: string;
  readonly floatingProp: string;
}

export const SPECTRAL_GHOST_DEFS: Record<SpectralGhostId, SpectralGhostDef> = {
  smith: {
    id: 'smith',
    name: 'Adam Smith',
    era: '1723–1790 (Lumières écossaises)',
    signatureColor: '#ffd98a', // Or ambré 1800K
    auraColor: 'rgba(255, 217, 138, 0.45)',
    floatingProp: 'Balance dorée & pomme invisible',
  },
  marx: {
    id: 'marx',
    name: 'Karl Marx',
    era: '1818–1883 (Critique de l\'économie politique)',
    signatureColor: '#ff5c7c', // Rouge rubis braise
    auraColor: 'rgba(255, 92, 124, 0.45)',
    floatingProp: 'Feuillets de manuscrit & rouage spectral',
  },
  ostrom: {
    id: 'ostrom',
    name: 'Elinor Ostrom',
    era: '1933–2012 (Gouvernance des Communs)',
    signatureColor: '#3ddc84', // Vert menthe d'eau claire
    auraColor: 'rgba(61, 220, 132, 0.45)',
    floatingProp: 'Onde aquatique, carnet & pousses végétales',
  },
  keynes: {
    id: 'keynes',
    name: 'John Maynard Keynes',
    era: '1883–1946 (Théorie générale & macroéconomie)',
    signatureColor: '#4ab8ff', // Bleu azur électrique
    auraColor: 'rgba(74, 184, 255, 0.45)',
    floatingProp: 'Pipe fumante dessinant des cycles',
  },
  taylor: {
    id: 'taylor',
    name: 'Frederick W. Taylor',
    era: '1856–1915 (Organisation scientifique du travail)',
    signatureColor: '#ff9a5c', // Cuivre mécanique orangé
    auraColor: 'rgba(255, 154, 92, 0.45)',
    floatingProp: 'Chronomètre de précision & grille d\'observation',
  },
};

/**
 * Dessine la silhouette spectrale d'un fantôme avec ses auras, ses attributs d'époque et accessoires.
 */
export function drawSpectralGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ghostId: SpectralGhostId,
  t: number,
  scale = 2,
  mode: 'murmure' | 'debat' = 'murmure',
): void {
  const def = SPECTRAL_GHOST_DEFS[ghostId];
  if (!def) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Lévitation éthérée oscillante
  const floatY = Math.sin(t * 2.6) * (scale * 3);
  const breathAlpha = 0.65 + 0.18 * Math.sin(t * 3.2);
  ctx.globalAlpha = Math.max(0.35, Math.min(0.9, breathAlpha));

  const gy = y - scale * 6 + floatY;
  const col = def.signatureColor;

  // 1. Aura lumineuse radiale diffuse
  const auraR = scale * 26;
  const aura = ctx.createRadialGradient(x, gy - scale * 10, 2, x, gy - scale * 10, auraR);
  aura.addColorStop(0, def.auraColor);
  aura.addColorStop(0.5, `${col}22`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, gy - scale * 10, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Particules ascendantes vaporeuses
  ctx.fillStyle = col;
  for (let i = 0; i < 4; i++) {
    const pPhase = (t * 0.8 + i * 1.5) % 4;
    const px = x + Math.sin(t * 1.2 + i * 2) * (scale * 8);
    const py = gy - scale * 4 - pPhase * (scale * 6);
    ctx.fillRect(px, py, scale, scale);
  }

  // 2. Silhouette corporelle du fantôme
  drawGhostBody(ctx, x, gy, scale, ghostId, col, t);

  // 3. Accessoires et attributs signatures
  drawGhostAccessory(ctx, x, gy, scale, ghostId, col, t);

  // 4. Badge nominatif poétique
  ctx.font = `bold ${Math.max(7, Math.floor(scale * 4.2))}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = col;
  const badge = mode === 'debat' ? `⚡ ${def.name}` : `« ${def.name} »`;
  ctx.fillText(badge, x, gy - scale * 26);

  ctx.restore();
}

/**
 * Dessine la morphologie propre au fantôme (XVIIIe, XIXe, contemporain, complet veston, contremaître).
 */
function drawGhostBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  ghostId: SpectralGhostId,
  color: string,
  t: number,
): void {
  const headY = y - s * 18;

  // Corps / Manteau éthéré
  ctx.fillStyle = color;

  switch (ghostId) {
    case 'smith': {
      // Redingote à basques XVIIIe siècle
      ctx.fillRect(x - s * 5, y - s * 11, s * 10, s * 9);
      // Basques flottantes
      ctx.beginPath();
      ctx.moveTo(x - s * 5, y - s * 2);
      ctx.lineTo(x - s * 7, y + s * 4);
      ctx.lineTo(x + s * 7, y + s * 4);
      ctx.lineTo(x + s * 5, y - s * 2);
      ctx.closePath();
      ctx.fill();
      // Jabot de dentelle vaporeux blanc
      ctx.fillStyle = '#f9ecd0';
      ctx.fillRect(x - s * 2, y - s * 10, s * 4, s * 4);
      // Tête & perruque poudrée blanche bouclée à catogan
      ctx.beginPath();
      ctx.arc(x, headY + s * 3, s * 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Rouleaux de perruque sur les côtés
      ctx.fillRect(x - s * 6, headY + s * 1, s * 2.5, s * 5);
      ctx.fillRect(x + s * 3.5, headY + s * 1, s * 2.5, s * 5);
      break;
    }

    case 'marx': {
      // Épais pardessus croisé XIXe siècle
      ctx.fillRect(x - s * 6, y - s * 12, s * 12, s * 14);
      // Tête et crinière léonine grise touffue
      ctx.fillStyle = '#d8d4dc';
      ctx.beginPath();
      ctx.arc(x, headY + s * 2, s * 6, 0, Math.PI * 2);
      ctx.fill();
      // Barbe légendaire touffue descendant sur le torse
      ctx.beginPath();
      ctx.moveTo(x - s * 5, headY + s * 5);
      ctx.lineTo(x + s * 5, headY + s * 5);
      ctx.lineTo(x + s * 4, y - s * 4);
      ctx.lineTo(x, y - s * 2);
      ctx.lineTo(x - s * 4, y - s * 4);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'ostrom': {
      // Veste de terrain pratique contemporaine
      ctx.fillRect(x - s * 5, y - s * 11, s * 10, s * 10);
      // Écharpe fluide qui ondule
      ctx.fillStyle = '#73eff7';
      const wave = Math.sin(t * 3) * s;
      ctx.fillRect(x - s * 3, y - s * 10, s * 6, s * 3);
      ctx.fillRect(x + s * 3, y - s * 7, s * 2, s * 6 + wave);

      // Tête bienveillante & cheveux courts argentés
      ctx.fillStyle = '#e8ecf4';
      ctx.beginPath();
      ctx.arc(x, headY + s * 3, s * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Lunettes rondes rayonnantes
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = Math.max(1, s * 0.7);
      ctx.strokeRect(x - s * 3.5, headY + s * 2, s * 3, s * 2.5);
      ctx.strokeRect(x + s * 0.5, headY + s * 2, s * 3, s * 2.5);
      break;
    }

    case 'keynes': {
      // Complet veston trois-pièces chic de Cambridge
      ctx.fillRect(x - s * 5, y - s * 11, s * 10, s * 12);
      // Cravate soignée
      ctx.fillStyle = '#243250';
      ctx.fillRect(x - s, y - s * 10, s * 2, s * 5);

      // Tête élancée & cheveux plaqués
      ctx.fillStyle = '#6b4a2f';
      ctx.beginPath();
      ctx.arc(x, headY + s * 2.5, s * 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'taylor': {
      // Veston strict géométrique de contremaître
      ctx.fillRect(x - s * 5, y - s * 12, s * 10, s * 13);
      // Col blanc rigide
      ctx.fillStyle = '#f9ecd0';
      ctx.fillRect(x - s * 2, y - s * 12, s * 4, s * 2);

      // Tête géométrique, menton carré, moustaches nettes
      ctx.fillStyle = color;
      ctx.fillRect(x - s * 3.5, headY + s * 1, s * 7, s * 6);
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x - s * 2, headY + s * 5, s * 4, s); // moustache
      break;
    }
  }
}

/**
 * Dessine les accessoires flottants distinctifs de chaque penseur.
 */
function drawGhostAccessory(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  ghostId: SpectralGhostId,
  color: string,
  t: number,
): void {
  switch (ghostId) {
    case 'smith': {
      // Balance miniature en équilibre flottant
      const balX = x + s * 9;
      const balY = y - s * 7 + Math.sin(t * 2) * s;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, s * 0.8);
      // Fléau
      ctx.beginPath();
      ctx.moveTo(balX - s * 4, balY);
      ctx.lineTo(balX + s * 4, balY);
      ctx.stroke();
      // Plateaux
      ctx.fillStyle = color;
      ctx.fillRect(balX - s * 5, balY + s * 3, s * 3, s);
      ctx.fillRect(balX + s * 2, balY + s * 3, s * 3, s);
      break;
    }

    case 'marx': {
      // Rouage spectral en rotation
      const gearX = x + s * 9;
      const gearY = y - s * 8;
      const angle = t * 1.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, s * 0.8);
      ctx.save();
      ctx.translate(gearX, gearY);
      ctx.rotate(angle);
      ctx.strokeRect(-s * 3, -s * 3, s * 6, s * 6);
      ctx.strokeRect(-s * 1.5, -s * 1.5, s * 3, s * 3);
      ctx.restore();
      break;
    }

    case 'ostrom': {
      // Gouttelettes d'eau claire et jeune pousse végétale
      const plantX = x - s * 9;
      const plantY = y - s * 6 + Math.sin(t * 2.2) * s;
      ctx.fillStyle = '#3ddc84';
      ctx.fillRect(plantX, plantY, s, s * 4); // tige
      // Feuilles
      ctx.beginPath();
      ctx.arc(plantX - s * 2, plantY - s, s * 2, 0, Math.PI * 2);
      ctx.arc(plantX + s * 2, plantY - s, s * 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'keynes': {
      // Pipe au coin des lèvres et volutes traçant des courbes
      const pipeX = x + s * 4;
      const pipeY = y - s * 14;
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(pipeX, pipeY, s * 3, s);
      ctx.fillRect(pipeX + s * 2.5, pipeY - s * 1.5, s * 1.5, s * 2);

      // Volutes de fumée dessinant une sinusoïde de cycle
      ctx.strokeStyle = 'rgba(74, 184, 255, 0.7)';
      ctx.lineWidth = Math.max(1, s * 0.8);
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const sx = pipeX + s * 3 + i * s * 0.8;
        const sy = pipeY - s * 2 - Math.sin((t * 2) + i * 0.6) * (s * 2);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      break;
    }

    case 'taylor': {
      // Chronomètre de précision à trotteuse tournoyante
      const chronoX = x + s * 9;
      const chronoY = y - s * 7;
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.arc(chronoX, chronoY, s * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();

      // Trotteuse nerveuse
      const handAngle = t * 10;
      ctx.strokeStyle = '#c25a40';
      ctx.lineWidth = Math.max(1, s * 0.7);
      ctx.beginPath();
      ctx.moveTo(chronoX, chronoY);
      ctx.lineTo(chronoX + Math.cos(handAngle) * (s * 2.5), chronoY + Math.sin(handAngle) * (s * 2.5));
      ctx.stroke();
      break;
    }
  }
}
