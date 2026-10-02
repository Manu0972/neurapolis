/**
 * PROPOSITION (non appliquée) — remplacement drop-in de src/presentation/tokens.ts.
 * Mêmes clés que l'existant (bg, panel, panel2, ink, inkDim, or, vert, rouge, bleu, violet, cyan) : aucun appelant à changer.
 * Toutes les valeurs viennent de la palette core 32 (palette/palette.json). Plus de fond néon sombre #0a0e17.
 * Fichier propriété de la session « présentation » : à intégrer par Jules (J1), pas par ce kit.
 */
export const TOKENS = {
  bg: '#2a1a14',      // brun chaud profond (contour) — remplace #0a0e17
  panel: '#4a3220',   // panneaux
  panel2: '#6b4a2f',  // second niveau / boutons
  ink: '#f9ecd0',     // texte (crème)
  inkDim: '#c8b9a0',  // texte secondaire
  or: '#ffd98a',      // accent ~1900 K (fenêtre allumée)
  vert: '#6fb06a',
  rouge: '#c25a40',   // terracotta, jamais de rouge pur
  bleu: '#7f9bd0',
  violet: '#8e8a9a',  // gris-violet des ombres froides
  cyan: '#7fa8c4',
} as const;
export type TokenId = keyof typeof TOKENS;
