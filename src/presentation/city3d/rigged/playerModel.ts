/**
 * Choix du modèle 3D du joueur. Depuis la save v26, il est enregistré dans l'apparence (`model`) ;
 * la préférence de l'appareil ci-dessous ne sert plus que de repli aux parties plus anciennes.
 * `null` = personnage dessiné par le jeu (toutes les options du créateur) ; sinon id d'un modèle
 * riggé du manifeste (peau, cheveux et couleur de tenue recolorés d'après le créateur).
 */
import { AGE_FALLBACK, ageClassOf, type AgeClass } from './manifest';

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

/** Silhouettes proposées pour un âge : la tranche d'âge, ou la plus proche qui a des modèles (jamais un enfant en adulte). */
export function silhouetteChoices<T extends { ageClass: AgeClass }>(models: readonly T[], age: number): T[] {
  for (const c of AGE_FALLBACK[ageClassOf(age)]) {
    const list = models.filter((m) => m.ageClass === c);
    if (list.length > 0) return list;
  }
  return [];
}
