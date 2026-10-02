/**
 * Tokens visuels cozy NEURAPOLIS — palette pixel-art chaleureuse.
 * Remplacement drop-in harmonisé avec la palette officielle 28 couleurs.
 * Conforme au contrat : hygge 1800K (#ffd98a), contour (#2a1a14), ombres froides (#2c2540), kraft (#e8d6b0), bois (#8a5a3a).
 */
import {
  OUTLINE,
  HYGGE_1800K,
  SHADOW_COOL,
  KRAFT_BG,
  WOOD_WARM,
  INK_WARM,
  AUXILIARY_COLORS,
} from './assets/palette';

export const TOKENS = {
  bg: OUTLINE,            // brun chaud profond (#2a1a14) — jamais de noir pur
  panel: '#4a3220',       // panneaux bois foncé
  panel2: '#6b4a2f',      // second niveau / boutons bois moyen
  ink: INK_WARM,          // texte ivoire chaud (#f9ecd0)
  inkDim: AUXILIARY_COLORS.inkDim, // texte secondaire (#c8b9a0)
  or: HYGGE_1800K,        // accent chaleureux ~1800K (#ffd98a)
  vert: '#6fb06a',        // vert parc & végétation
  rouge: '#c25a40',       // corail / terracotta (#c25a40)
  bleu: '#7f9bd0',        // denim / bleu ardoise
  violet: '#8e8a9a',      // gris-violet des ombres froides
  cyan: '#73eff7',        // étincelle d'eau claire
  kraft: KRAFT_BG,        // papier kraft naturel (#e8d6b0)
  bois: WOOD_WARM,        // bois d'artisan (#8a5a3a)
  shadow: SHADOW_COOL,    // teinte des ombres (#2c2540)
} as const;

export type TokenId = keyof typeof TOKENS;

export { OUTLINE, HYGGE_1800K, SHADOW_COOL, KRAFT_BG, WOOD_WARM, INK_WARM };
