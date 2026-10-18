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
