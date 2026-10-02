/**
 * NEURAPOLIS — Galerie de Portraits d'Émotions 48×48 en Pixel-Art.
 *
 * Visages expressifs pour les boîtes de dialogue et bulles narratives :
 * - Joie : Yeux en arcs plissés, grand sourire radieux, pommettes chaudes, étincelles.
 * - Surprise : Yeux ronds écarquillés, sourcils hauts, bouche en "O", sursaut.
 * - Réflexion : Regard en coin songeur, sourcil concentré, main sous le menton.
 * - Scepticisme : Un sourcil haussé, bouche pincée en biais, regard dubitatif comique.
 * - Colère comique : Joues gonflées boudeuses, yeux plissés vifs, volute de vapeur.
 */
import {
  OUTLINE,
  HYGGE_1800K,
  HYGGE_LIGHT,
  SHADOW_COOL,
  WOOD_WARM,
  INK_WARM,
  PALETTE_RAMPS,
} from '../palette';

export type EmotionId = 'joie' | 'surprise' | 'reflexion' | 'scepticisme' | 'colere_comique';

export const EMOTIONS: readonly EmotionId[] = [
  'joie',
  'surprise',
  'reflexion',
  'scepticisme',
  'colere_comique',
] as const;

/**
 * Dessine un portrait d'émotion en pixel-art net dans la zone spécifiée (taille nominale 48×48 px).
 */
export function drawEmotionPortrait(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  emotion: EmotionId,
  size = 48,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const s = size / 48; // facteur d'échelle unitaire (1 pour 48px)
  const u = (n: number) => Math.round(n * s);

  // 1. Cadre diégétique en bois chaleureux & fond kraft
  ctx.fillStyle = WOOD_WARM; // #8a5a3a
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(x, y, size, size);

  // Fond intérieur papier kraft doux
  const innerPad = u(3);
  ctx.fillStyle = '#e8d6b0';
  ctx.fillRect(x + innerPad, y + innerPad, size - innerPad * 2, size - innerPad * 2);

  // 2. Base de la tête (peau claire pêche)
  const faceX = x + u(10);
  const faceY = y + u(12);
  const faceW = u(28);
  const faceH = u(26);

  ctx.fillStyle = PALETTE_RAMPS.skinLight.shadow; // ombre base
  ctx.fillRect(faceX, faceY + faceH - u(4), faceW, u(4));
  ctx.fillStyle = PALETTE_RAMPS.skinLight.base; // #ffc496
  ctx.fillRect(faceX, faceY, faceW, faceH - u(3));
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(faceX, faceY, faceW, faceH);

  // 3. Chevelure châtain protectrice au sommet
  const hairY = y + u(6);
  ctx.fillStyle = PALETTE_RAMPS.hairBrown.base; // #6b4a2f
  ctx.fillRect(faceX - u(2), hairY, faceW + u(4), u(10));
  // Mèches rebelles
  ctx.fillRect(faceX + u(4), hairY + u(8), u(6), u(4));
  ctx.fillRect(faceX + u(18), hairY + u(8), u(5), u(3));
  ctx.fillStyle = PALETTE_RAMPS.hairBrown.light;
  ctx.fillRect(faceX + u(2), hairY + u(2), faceW - u(4), u(2));

  // 4. Éléments spécifiques par émotion
  switch (emotion) {
    case 'joie': {
      // Yeux plissés rieurs en arcs (yeux fermés heureux ^ ^)
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1, u(2));
      // Œil gauche
      ctx.beginPath();
      ctx.arc(faceX + u(7), faceY + u(11), u(3), Math.PI, 0);
      ctx.stroke();
      // Œil droit
      ctx.beginPath();
      ctx.arc(faceX + u(21), faceY + u(11), u(3), Math.PI, 0);
      ctx.stroke();

      // Pommettes rosées
      ctx.fillStyle = PALETTE_RAMPS.coral.light;
      ctx.fillRect(faceX + u(4), faceY + u(14), u(4), u(2));
      ctx.fillRect(faceX + u(20), faceY + u(14), u(4), u(2));

      // Grand sourire ouvert découvrant les dents
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(faceX + u(14), faceY + u(16), u(6), 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = INK_WARM; // dents
      ctx.fillRect(faceX + u(11), faceY + u(16), u(6), u(2));

      // Petites étincelles dorées d'allégresse au coin
      ctx.fillStyle = HYGGE_1800K;
      ctx.fillRect(x + u(4), y + u(10), u(2), u(2));
      ctx.fillRect(x + u(40), y + u(8), u(3), u(3));
      break;
    }

    case 'surprise': {
      // Sourcils relevés très haut
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(faceX + u(5), faceY + u(4), u(6), u(2));
      ctx.fillRect(faceX + u(17), faceY + u(4), u(6), u(2));

      // Grands yeux écarquillés ronds avec pupilles dilatées
      ctx.fillStyle = INK_WARM;
      ctx.fillRect(faceX + u(5), faceY + u(8), u(7), u(7));
      ctx.fillRect(faceX + u(16), faceY + u(8), u(7), u(7));
      ctx.fillStyle = OUTLINE;
      ctx.strokeRect(faceX + u(5), faceY + u(8), u(7), u(7));
      ctx.strokeRect(faceX + u(16), faceY + u(8), u(7), u(7));
      // Pupilles centrées
      ctx.fillRect(faceX + u(7), faceY + u(10), u(3), u(3));
      ctx.fillRect(faceX + u(18), faceY + u(10), u(3), u(3));

      // Bouche ronde en 'O' d'étonnement
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(faceX + u(14), faceY + u(19), u(3.5), 0, Math.PI * 2);
      ctx.fill();

      // Point d'exclamation miniature stylisé à droite
      ctx.fillStyle = HYGGE_1800K;
      ctx.fillRect(x + u(41), y + u(14), u(2), u(6));
      ctx.fillRect(x + u(41), y + u(22), u(2), u(2));
      break;
    }

    case 'reflexion': {
      // Regard tourné vers le haut et la droite (songeur)
      ctx.fillStyle = OUTLINE;
      // Sourcil gauche légèrement froncé
      ctx.fillRect(faceX + u(6), faceY + u(7), u(6), u(2));
      // Sourcil droit interrogatif
      ctx.fillRect(faceX + u(16), faceY + u(6), u(6), u(2));

      // Yeux tournés en haut à droite
      ctx.fillStyle = INK_WARM;
      ctx.fillRect(faceX + u(6), faceY + u(10), u(6), u(5));
      ctx.fillRect(faceX + u(16), faceY + u(10), u(6), u(5));
      ctx.fillStyle = OUTLINE;
      ctx.strokeRect(faceX + u(6), faceY + u(10), u(6), u(5));
      ctx.strokeRect(faceX + u(16), faceY + u(10), u(6), u(5));
      ctx.fillRect(faceX + u(9), faceY + u(10), u(3), u(3));
      ctx.fillRect(faceX + u(19), faceY + u(10), u(3), u(3));

      // Bouche en petite ligne pensive
      ctx.fillRect(faceX + u(12), faceY + u(19), u(5), u(2));

      // Main sous le menton
      ctx.fillStyle = PALETTE_RAMPS.skinLight.base;
      ctx.fillRect(faceX + u(15), faceY + u(22), u(6), u(4));
      ctx.strokeStyle = OUTLINE;
      ctx.strokeRect(faceX + u(15), faceY + u(22), u(6), u(4));

      // Petite bulle d'interrogation / engrenage doré
      ctx.fillStyle = HYGGE_1800K;
      ctx.fillRect(x + u(5), y + u(12), u(3), u(3));
      break;
    }

    case 'scepticisme': {
      // Un sourcil haussé, l'autre sévère
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(faceX + u(5), faceY + u(5), u(7), u(2)); // sourcil gauche haut
      ctx.fillRect(faceX + u(16), faceY + u(8), u(7), u(2)); // sourcil droit bas

      // Yeux en coin dubitatifs
      ctx.fillStyle = INK_WARM;
      ctx.fillRect(faceX + u(6), faceY + u(9), u(6), u(5));
      ctx.fillRect(faceX + u(16), faceY + u(10), u(6), u(4)); // un œil plus plissé
      ctx.fillStyle = OUTLINE;
      ctx.strokeRect(faceX + u(6), faceY + u(9), u(6), u(5));
      ctx.strokeRect(faceX + u(16), faceY + u(10), u(6), u(4));
      ctx.fillRect(faceX + u(7), faceY + u(10), u(3), u(3));
      ctx.fillRect(faceX + u(17), faceY + u(11), u(3), u(2));

      // Bouche en biais pincée ironique
      ctx.beginPath();
      ctx.moveTo(faceX + u(10), faceY + u(20));
      ctx.lineTo(faceX + u(18), faceY + u(17));
      ctx.lineWidth = Math.max(1, u(2));
      ctx.stroke();
      break;
    }

    case 'colere_comique': {
      // Sourcils en "V" sévère et combatif
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.moveTo(faceX + u(5), faceY + u(7));
      ctx.lineTo(faceX + u(12), faceY + u(10));
      ctx.lineTo(faceX + u(16), faceY + u(10));
      ctx.lineTo(faceX + u(23), faceY + u(7));
      ctx.lineWidth = Math.max(1, u(2));
      ctx.stroke();

      // Yeux déterminés plissés
      ctx.fillStyle = INK_WARM;
      ctx.fillRect(faceX + u(6), faceY + u(11), u(6), u(4));
      ctx.fillRect(faceX + u(16), faceY + u(11), u(6), u(4));
      ctx.fillStyle = OUTLINE;
      ctx.strokeRect(faceX + u(6), faceY + u(11), u(6), u(4));
      ctx.strokeRect(faceX + u(16), faceY + u(11), u(6), u(4));
      ctx.fillRect(faceX + u(9), faceY + u(12), u(3), u(2));
      ctx.fillRect(faceX + u(16), faceY + u(12), u(3), u(2));

      // Joues légèrement empourprées d'indignation comique
      ctx.fillStyle = PALETTE_RAMPS.coral.base;
      ctx.fillRect(faceX + u(3), faceY + u(15), u(5), u(3));
      ctx.fillRect(faceX + u(20), faceY + u(15), u(5), u(3));

      // Bouche en petite vague boudeuse
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(faceX + u(11), faceY + u(18), u(6), u(2));

      // Volute de vapeur / petite croix comique de colère façon BD
      ctx.strokeStyle = PALETTE_RAMPS.coral.shadow;
      ctx.lineWidth = Math.max(1, u(1.5));
      const crossX = x + u(37);
      const crossY = y + u(8);
      ctx.beginPath();
      ctx.moveTo(crossX, crossY);
      ctx.lineTo(crossX + u(4), crossY + u(4));
      ctx.moveTo(crossX + u(4), crossY);
      ctx.lineTo(crossX, crossY + u(4));
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}
