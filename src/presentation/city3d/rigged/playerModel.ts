/**
 * Choix du modèle 3D du joueur (préférence d'affichage, hors sauvegarde de partie).
 * `null` = personnage dessiné par le jeu (toutes les options du créateur) ; sinon id d'un modèle
 * riggé du manifeste (peau, cheveux et couleur de tenue recolorés d'après le créateur).
 */
const KEY = 'neurapolis.joueur.modele';

export function playerRigModel(): string | undefined {
  try {
    const v = localStorage.getItem(KEY);
    return v && v !== 'dessin' ? v : undefined;
  } catch {
    return undefined;
  }
}

export function setPlayerRigModel(id: string | undefined): void {
  try {
    if (id) localStorage.setItem(KEY, id); else localStorage.setItem(KEY, 'dessin');
  } catch { /* stockage indisponible : le choix vaut pour cette session seulement */ }
}

/** Le joueur a-t-il déjà un choix enregistré (modèle ou personnage dessiné) ? */
export function hasPlayerRigPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Modèle proposé par défaut au créateur : une silhouette détaillée de la tranche d'âge, de préférence
 * libre (sans PNJ attitré, pour ne pas ressembler à un habitant). `undefined` : personnage dessiné.
 */
export function defaultPlayerRig<T extends { id: string; pnj: readonly string[] }>(choices: readonly T[]): string | undefined {
  return (choices.find((c) => c.pnj.length === 0) ?? choices[0])?.id;
}
