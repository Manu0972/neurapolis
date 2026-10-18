/**
 * Cadrage de l'aperçu du personnage (fonction pure, testable) : la caméra s'éloigne selon la taille
 * pour que le personnage entier (tête et pieds) tienne dans le cadre avec une marge, centré.
 */
export interface AvatarFraming {
  /** Hauteur de la caméra et du point visé (regard horizontal : pas de déformation de perspective). */
  camY: number;
  lookY: number;
  /** Distance de la caméra au personnage. */
  camZ: number;
}

/** `margin` : part de hauteur libre au-dessus de la tête et sous les pieds (0.16 = 16 % de la taille). */
export function frameAvatar(heightM: number, aspect: number, fovDeg = 30, margin = 0.16): AvatarFraming {
  const h = Math.max(0.5, heightM);
  const fov = (fovDeg * Math.PI) / 180;
  // Hauteur à faire entrer dans le cadre : le personnage + marge + un peu de sol sous les pieds.
  const needed = h * (1 + 2 * margin);
  // Largeur utile : ~0.55 × la taille (bras écartés légèrement) ; sur un cadre étroit, c'est elle qui limite.
  const neededW = h * 0.55 * (1 + margin);
  const dH = needed / 2 / Math.tan(fov / 2);
  const dW = neededW / 2 / (Math.tan(fov / 2) * Math.max(0.2, aspect));
  const camZ = Math.max(dH, dW);
  const lookY = h * 0.47; // un peu sous le milieu : le sol et son ombre comptent dans le cadre
  return { camY: lookY + h * 0.04, lookY, camZ };
}
