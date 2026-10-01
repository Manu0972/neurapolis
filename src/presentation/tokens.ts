/**
 * Tokens visuels du prototype — source unique pour le Canvas et le DOM.
 * Les mêmes valeurs sont exposées en CSS (variables de style.css, qui ne peut
 * pas importer TS) : toute évolution se fait ici d'abord, puis dans style.css.
 */
export const TOKENS = {
  bg: '#0a0e17',        // fond
  panel: '#131b2b',     // panneaux
  panel2: '#19243a',    // panneaux de second niveau / boutons
  ink: '#eaf2ff',       // texte
  inkDim: '#8a9bb8',    // texte secondaire
  or: '#ffc94a',        // accent or
  vert: '#3ddc84',
  rouge: '#ff5c7c',
  bleu: '#4ea1ff',
  violet: '#b78bff',
  cyan: '#5cd6e8',
} as const;

export type TokenId = keyof typeof TOKENS;
