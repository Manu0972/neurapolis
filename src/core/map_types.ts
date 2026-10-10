/**
 * NEURAPOLIS — Types minimalistes pour la validation et la structure des cartes (paliers 1 à 6).
 */

export interface LieuSpec {
  id: string;
  nom: string;
}

export interface LiaisonSpec {
  de: string;
  vers: string;
}

export interface CarteSpec {
  lieux: LieuSpec[];
  liaisons: LiaisonSpec[];
  depart: string;
}
