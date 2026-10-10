/**
 * NEURAPOLIS — Module de rencontres réciproques entre biographies sans graphe global.
 *
 * Utilise un schéma de dérivation symétrique basé sur la paire triée
 * (min(A, B), max(A, B)) et le PRNG déterministe du projet.
 */

import { mulberry32, rngInt, rngPick, rngChance } from '../../core/rng';
import { deriverGraine } from './seed';

export type TypeRencontre =
  | 'amitié'
  | 'professionnel'
  | 'mentorat'
  | 'collaboration'
  | 'associatif'
  | 'école'
  | 'club'
  | 'voisinage'
  | 'famille';

export interface Rencontre {
  annee: number;
  nomPartenaire: string;
  cheminPartenaire: string;
  type: TypeRencontre;
  lieu: string;
}

export interface ProfilDeBase {
  chemin: string;
  prenom: string;
  nom: string;
  genre: 'féminin' | 'masculin' | 'non-binaire';
  anneeNaissance: number;
  anneeMortProbable: number;
  anneeFinVie: number;
  villeNaissance: string;
}

export const VILLES_INVENTEES = [
  'Val-Ferrand', 'Hauts-de-Taret', 'Port-Lumière', 'Clairval',
  'Rochebrune', 'Sainte-Soline', 'Pont-des-Ombres', 'Mirefleurs',
  'Castelneuve', 'Grand-Bassin', 'Rives-du-Taret', 'Mont-Serein',
];

export const PRENOMS_FEMININS = [
  'Aria', 'Camille', 'Léa', 'Inès', 'Chloé', 'Solen', 'Yara', 'Maya',
  'Éléonore', 'Nora', 'Céleste', 'Ambre', 'Iris', 'Astrid', 'Romane',
];

export const PRENOMS_MASCULINS = [
  'Léo', 'Gabriel', 'Hugo', 'Arthur', 'Sacha', 'Soren', 'Naël', 'Liam',
  'Émile', 'Julien', 'Mael', 'Gabin', 'Augustin', 'Félix', 'Antoine',
];

export const PRENOMS_NON_BINAIRES = [
  'Eden', 'Charlie', 'Sacha', 'Noa', 'Camille', 'Loris', 'Alix', 'Lou',
  'Mika', 'Andrea', 'Soren', 'Esmé', 'Elden', 'Zephyr', 'Orion',
];

export const NOMS_INVENTES = [
  'Vane', 'Roche', 'Mercier', 'Lumière', 'Duval', 'Serrano', 'Castel',
  'Lefèvre', 'Taret', 'Soline', 'Montclar', 'Mireval', 'Serein', 'Fontaine',
];

const REF_YEAR = 2020;

/** Hash 32-bit FNV-1a déterministe depuis une chaîne de caractères. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Extrait le profil de base (identité + dates clés) d'un individu
 * de façon ultra-rapide sans générer la biographie complète.
 */
export function profilDeBase(chemin: string): ProfilDeBase {
  const seed = hashString(chemin);
  const state = mulberry32(seed);

  const genre = rngPick(state, ['féminin', 'masculin', 'non-binaire'] as const);
  let prenom: string;
  if (genre === 'féminin') prenom = rngPick(state, PRENOMS_FEMININS);
  else if (genre === 'masculin') prenom = rngPick(state, PRENOMS_MASCULINS);
  else prenom = rngPick(state, PRENOMS_NON_BINAIRES);
  const nom = rngPick(state, NOMS_INVENTES);

  let anneeNaissance: number;
  const rencontreMatch = chemin.match(/\/r\/(\d{4})_/);
  if (rencontreMatch && rencontreMatch[1]) {
    const targetYear = parseInt(rencontreMatch[1], 10);
    const ageAtMeet = rngInt(state, 16, 45);
    anneeNaissance = targetYear - ageAtMeet;
  } else {
    anneeNaissance = rngInt(state, 1935, 2012);
  }

  rngInt(state, 1, 365); // jourNaissance
  const villeNaissance = rngPick(state, VILLES_INVENTEES);
  rngPick(state, VILLES_INVENTEES); // paysNaissance

  const maxAge = rngInt(state, 72, 96);
  const anneeMortProbable = anneeNaissance + maxAge;
  let anneeFinVie = REF_YEAR;

  if (anneeMortProbable <= REF_YEAR) {
    anneeFinVie = anneeMortProbable;
  }

  return {
    chemin,
    prenom,
    nom,
    genre,
    anneeNaissance,
    anneeMortProbable,
    anneeFinVie,
    villeNaissance,
  };
}

/**
 * Génère la liste des voisins candidats pour un chemin donné de façon déterministe et symétrique.
 * Garantit que B est dans Voisinage(A) ssi A est dans Voisinage(B).
 */
export function obtenirCandidatsVoisinage(chemin: string): string[] {
  const candidats: string[] = [];

  const vMatch = chemin.match(/^(.*?)_v(\d+)$/);
  if (vMatch && vMatch[1] && vMatch[2]) {
    const base = vMatch[1];
    const idx = parseInt(vMatch[2], 10);

    candidats.push(base);

    for (let j = 1; j <= 3; j++) {
      if (j !== idx) {
        candidats.push(`${base}_v${j}`);
      }
    }
    return candidats;
  }

  const numMatch = chemin.match(/^(.*?)(\d+)$/);
  if (numMatch && numMatch[1] !== undefined && numMatch[2] !== undefined) {
    const prefix = numMatch[1];
    const idx = parseInt(numMatch[2], 10);

    for (let delta = -2; delta <= 2; delta++) {
      if (delta !== 0) {
        const target = idx + delta;
        if (target >= 0) {
          candidats.push(`${prefix}${target}`);
        }
      }
    }

    for (let j = 1; j <= 2; j++) {
      candidats.push(`${chemin}_v${j}`);
    }

    return candidats;
  }

  for (let j = 1; j <= 3; j++) {
    candidats.push(`${chemin}_v${j}`);
  }

  return candidats;
}

/**
 * Calcule l'ensemble complet des rencontres entre A et un candidat B
 * de façon strictement symétrique et autonome.
 */
export function rencontresEntrePaire(cheminA: string, cheminB: string): Rencontre[] {
  if (cheminA === cheminB) return [];

  const profilA = profilDeBase(cheminA);
  const profilB = profilDeBase(cheminB);

  // Plage d'années vivantes chevauchantes (au moins 3 ans)
  const startYear = Math.max(profilA.anneeNaissance + 3, profilB.anneeNaissance + 3);
  const endYear = Math.min(profilA.anneeFinVie, profilB.anneeFinVie);

  if (startYear > endYear) {
    return [];
  }

  // Clé de paire triée et profils ordonnés
  const minKey = cheminA < cheminB ? cheminA : cheminB;
  const maxKey = cheminA < cheminB ? cheminB : cheminA;
  const profilMin = minKey === cheminA ? profilA : profilB;
  const profilMax = minKey === cheminA ? profilB : profilA;

  const pairKey = `${minKey}|${maxKey}`;

  const seedPair = deriverGraine(pairKey);
  const state = mulberry32(seedPair);

  const rencontres: Rencontre[] = [];

  // Probabilité que la paire ait eu des rencontres dans sa vie (65%)
  if (rngChance(state, 0.65)) {
    const numEncounters = rngInt(state, 1, 2);

    for (let i = 0; i < numEncounters; i++) {
      const annee = rngInt(state, startYear, endYear);

      const ageA = annee - profilA.anneeNaissance;
      const ageB = annee - profilB.anneeNaissance;

      const isAMinor = ageA < 18;
      const isBMinor = ageB < 18;

      let type: TypeRencontre;
      if (isAMinor || isBMinor) {
        // Pour les mineurs : école, club, voisinage, famille ; rien d'autre
        type = rngPick(state, ['école', 'club', 'voisinage', 'famille'] as const);
      } else {
        type = rngPick(state, ['amitié', 'professionnel', 'mentorat', 'collaboration', 'associatif'] as const);
      }

      // Ordre strictement canonique des lieux pour garantie de symétrie 100%
      const lieuxDisponibles = [profilMin.villeNaissance, profilMax.villeNaissance, ...VILLES_INVENTEES];
      const lieu = rngPick(state, lieuxDisponibles);

      const nomPartenaire = `${profilB.prenom} ${profilB.nom}`;

      rencontres.push({
        annee,
        nomPartenaire,
        cheminPartenaire: cheminB,
        type,
        lieu,
      });
    }
  }

  return rencontres;
}

/**
 * Calcule les rencontres potentielles pour un individu pour une année donnée.
 */
export function rencontresPotentielles(chemin: string, annee: number): Rencontre[] {
  const toutes = rencontresToutesAnnees(chemin, 1900, 2020);
  return toutes.filter((r) => r.annee === annee);
}

/**
 * Génère toutes les rencontres d'un individu pour l'ensemble de son espérance de vie.
 */
export function rencontresToutesAnnees(chemin: string, _anneeNaissance: number, _anneeFinVie: number): Rencontre[] {
  const candidats = obtenirCandidatsVoisinage(chemin);
  const toutesRencontres: Rencontre[] = [];

  for (const cheminB of candidats) {
    const rPaire = rencontresEntrePaire(chemin, cheminB);
    toutesRencontres.push(...rPaire);
  }

  toutesRencontres.sort((a, b) => a.annee - b.annee || a.cheminPartenaire.localeCompare(b.cheminPartenaire));
  return toutesRencontres;
}
