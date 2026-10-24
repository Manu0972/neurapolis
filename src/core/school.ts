/**
 * Établissement scolaire : constantes et textes purs (sans état), partagés par les données et la
 * simulation. Collège jusqu'en 3e ; lycée dès la rentrée de la 2de (15 ans), dans la même cité
 * scolaire Jean-Moulin (entrée du lycée rue Louise-Michel).
 */

/** Âge de la rentrée en 2de : à partir de là, le joueur va au lycée (jusqu'à la fin de la campagne, à 16 ans). */
export const AGE_LYCEE = 15;

/**
 * Adapte un texte écrit « pour le collège » au lycée quand le joueur y est (collège → lycée ; la cité
 * scolaire garde son nom, Jean-Moulin). Le pluriel « collèges » (le brevet des collèges) reste intact.
 */
export function adapterTexteEcole(text: string, lyceen: boolean): string {
  if (!lyceen) return text;
  return text
    .replace(/collégiens/g, 'lycéens').replace(/collégien(ne)?/g, 'lycéen$1')
    .replace(/collège(?!s)/g, 'lycée').replace(/Collège(?!s)/g, 'Lycée');
}
