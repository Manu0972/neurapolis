/**
 * NEURAPOLIS — Validateur pur de cartes (paliers 1 à 6).
 * Vérifie l'intégrité de la structure topologique de la carte :
 * - Identifiants de lieux uniques
 * - Noms de lieux non vides
 * - Lieu de départ valide
 * - Liaisons pointant vers deux lieux existants
 * - Interdiction des boucles (liaison d'un lieu vers lui-même)
 * - Interdiction des liaisons en double
 * - Connexité globale du graphe depuis le lieu de départ (BFS)
 */

import type { CarteSpec, LiaisonSpec, LieuSpec } from '../core/map_types';

export type { CarteSpec, LiaisonSpec, LieuSpec };

export function validerCarte(carte: CarteSpec): string[] {
  const erreurs: string[] = [];

  if (!carte) {
    return ['Carte invalide ou absente.'];
  }

  const lieux = carte.lieux ?? [];
  const liaisons = carte.liaisons ?? [];
  const depart = carte.depart;

  // 1. Détection de l'existence du départ
  if (!depart || typeof depart !== 'string') {
    erreurs.push('Aucun lieu de départ valide spécifié.');
  }

  // 2. Vérification des lieux (unicité des IDs + noms non vides)
  const idsLieux = new Set<string>();
  let departExiste = false;

  for (const lieu of lieux) {
    if (!lieu || typeof lieu.id !== 'string') {
      erreurs.push("Un lieu dans la carte n'a pas d'identifiant valide.");
      continue;
    }

    if (idsLieux.has(lieu.id)) {
      erreurs.push(`Identifiant de lieu dupliqué : '${lieu.id}'.`);
    } else {
      idsLieux.add(lieu.id);
    }

    if (!lieu.nom || typeof lieu.nom !== 'string' || lieu.nom.trim() === '') {
      erreurs.push(`Le lieu '${lieu.id}' a un nom vide.`);
    }

    if (lieu.id === depart) {
      departExiste = true;
    }
  }

  if (depart && !departExiste) {
    erreurs.push(`Le lieu de départ '${depart}' n'existe pas parmi les lieux.`);
  }

  // 3. Vérification des liaisons
  const liaisonsVues = new Set<string>();
  const adj = new Map<string, Set<string>>();
  for (const id of idsLieux) {
    adj.set(id, new Set());
  }

  for (const liaison of liaisons) {
    if (!liaison) continue;
    const { de, vers } = liaison;
    const deExiste = idsLieux.has(de);
    const versExiste = idsLieux.has(vers);

    if (!deExiste) {
      erreurs.push(`Liaison depuis un lieu inconnu : 'de' = '${de}'.`);
    }
    if (!versExiste) {
      erreurs.push(`Liaison vers un lieu inconnu : 'vers' = '${vers}'.`);
    }

    // Boucle sur soi-même
    if (de === vers) {
      erreurs.push(`Liaison en boucle sur le lieu '${de}'.`);
    }

    // Doublon (liaison non orientée entre de et vers)
    if (deExiste && versExiste && de !== vers) {
      const key = de < vers ? `${de}---${vers}` : `${vers}---${de}`;
      if (liaisonsVues.has(key)) {
        erreurs.push(`Liaison en double entre '${de}' et '${vers}'.`);
      } else {
        liaisonsVues.add(key);
      }

      // Construit la liste d'adjacence pour le BFS
      adj.get(de)!.add(vers);
      adj.get(vers)!.add(de);
    }
  }

  // 4. Test de connexité depuis le lieu de départ (BFS)
  if (departExiste) {
    const visites = new Set<string>([depart]);
    const file: string[] = [depart];

    while (file.length > 0) {
      const courant = file.shift()!;
      const voisins = adj.get(courant);
      if (voisins) {
        for (const voisin of voisins) {
          if (!visites.has(voisin)) {
            visites.add(voisin);
            file.push(voisin);
          }
        }
      }
    }

    for (const id of idsLieux) {
      if (!visites.has(id)) {
        erreurs.push(`Lieu inaccessible depuis le départ ('${depart}') : '${id}'.`);
      }
    }
  }

  return erreurs;
}

/**
 * Convertit un ensemble de lieux (ex: PlaceDef de src/data/places.ts) et une liste de liaisons en CarteSpec.
 */
export function convertirPlacesEnCarte(
  places: Array<{ id: string; name: string }>,
  liaisons: Array<{ de: string; vers: string }>,
  depart: string
): CarteSpec {
  return {
    lieux: places.map((p) => ({ id: p.id, nom: p.name })),
    liaisons: liaisons.map((l) => ({ de: l.de, vers: l.vers })),
    depart,
  };
}
