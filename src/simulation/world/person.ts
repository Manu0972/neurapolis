/**
 * src/simulation/world/person.ts
 * Générateur déterministe de biographies d'individus à la demande.
 * Basé sur le PRNG du projet (mulberry32 dans src/core/rng.ts).
 */

import { mulberry32, rngInt, rngPick, rngChance } from '../../core/rng';

export interface Naissance {
  annee: number;
  jour: number; // 1-365
  ville: string;
  pays: string;
}

export interface Famille {
  nomMere: string;
  nomPere: string;
  fratrie: number;
  statutFamilial: string;
  enfants: number;
}

export interface Etudes {
  diplome: string;
  domaine: string;
  anneeDebut: number;
  anneeFin: number;
  etablissement: string;
  ville: string;
}

export interface Metier {
  titre: string;
  secteur: string;
  anneeDebut: number;
  anneeFin?: number;
  lieu: string;
}

export interface Rencontre {
  annee: number;
  nomPartenaire: string;
  cheminPartenaire: string;
  type: 'amitié' | 'professionnel' | 'mentorat' | 'collaboration' | 'associatif';
  lieu: string;
}

export interface Voyage {
  annee: number;
  destination: string;
  pays: string;
  motif: 'études' | 'travail' | 'découverte' | 'humanitaire' | 'résidence artistique';
}

export interface Creation {
  annee: number;
  titre: string;
  domaine: 'art' | 'technologie' | 'littérature' | 'artisanat' | 'recherche' | 'communs';
  description: string;
}

export interface Deces {
  annee: number;
  age: number;
  cause: string;
  lieu: string;
}

export interface Biographie {
  chemin: string;
  nom: string;
  prenom: string;
  genre: 'féminin' | 'masculin' | 'non-binaire';
  cohorte: 'Jeunes' | 'Actifs' | 'Séniors' | 'Anciens';
  naissance: Naissance;
  famille: Famille;
  etudes: Etudes[];
  metiers: Metier[];
  rencontres: Rencontre[];
  voyages: Voyage[];
  creations: Creation[];
  deces: Deces | null;
  estVivant: boolean;
}

// Banque de données inventées
const VILLES_INVENTEES = [
  'Val-Ferrand', 'Hauts-de-Taret', 'Port-Lumière', 'Clairval',
  'Rochebrune', 'Sainte-Soline', 'Pont-des-Ombres', 'Mirefleurs',
  'Castelneuve', 'Grand-Bassin', 'Rives-du-Taret', 'Mont-Serein',
];

const PAYS_INVENTES = [
  'République de Solaria', 'Fédération d\'Auria', 'Archipel des Brumes',
  'Union d\'Alverne', 'Royaume de Vandea', 'Confédération de Norval',
  'Territoires de Silves', 'Principauté de Val-Douce',
];

const PRENOMS_FEMININS = [
  'Amara', 'Zélie', 'Iris', 'Élinor', 'Orane', 'Luce',
  'Alma', 'Soline', 'Yara', 'Maëlis', 'Celeste', 'Adèle',
];

const PRENOMS_MASCULINS = [
  'Maël', 'Soren', 'Naël', 'Léandre', 'Solal', 'Caspian',
  'Zephyr', 'Théodore', 'Gabin', 'Silas', 'Milo', 'Elias',
];

const PRENOMS_NON_BINAIRES = [
  'Camille', 'Eden', 'Charlie', 'Sacha', 'Noa', 'Lou',
  'Alex', 'Alix', 'Morgan', 'Dominique', 'Anis', 'Claude',
];

const NOMS_INVENTES = [
  'Valtier', 'Lecourbe', 'Grandjean', 'Rochefort', 'Peltier',
  'Dumont', 'Vaneau', 'Tisserand', 'Fontaine', 'Mercier',
  'Chastain', 'Avenel', 'Delorme', 'Lombard', 'Varenne',
];

const ETABLISSEMENTS = [
  'Collège Val-Taret', 'Lycée des Roses', 'Université Populaire de Val-Ferrand',
  'Institut des Arts et Métiers', 'École d\'Éco-Ingénierie', 'Académie de Clairval',
];

const DIPLOMES_DOMAINES = [
  { diplome: 'CAP Ébénisterie et Valorisation', domaine: 'Artisanat du Bois' },
  { diplome: 'Licence de Sociologie des Communs', domaine: 'Sciences Sociales' },
  { diplome: 'Diplôme d\'Ingénieur Éco-Conception', domaine: 'Ingénierie' },
  { diplome: 'BTS Agroécologie Territoriale', domaine: 'Agronomie' },
  { diplome: 'Master en Gestion Urbaine', domaine: 'Urbanisme' },
  { diplome: 'Doctorat en Hydrogéologie', domaine: 'Environnement' },
  { diplome: 'Brevet d\'Éco-Construction', domaine: 'Bâtiment' },
  { diplome: 'Diplôme de Médiation Sociale', domaine: 'Santé et Droit' },
];

const SECTEURS_METIERS = [
  { titre: 'Maraîcher(ère) urbain(e)', secteur: 'Agroécologie' },
  { titre: 'Technicien(ne) compostage', secteur: 'Valorisation des déchets' },
  { titre: 'Architecte bioclimatique', secteur: 'Éco-construction' },
  { titre: 'Mécanicien(ne) cycle', secteur: 'Mobilité douce' },
  { titre: 'Gestionnaire de réseau solaire', secteur: 'Énergies renouvelables' },
  { titre: 'Médiateur(trice) citoyen(ne)', secteur: 'Vie associative' },
  { titre: 'Bibliothécaire de quartier', secteur: 'Culture et Éducation' },
  { titre: 'Infirmier(ère) communautaire', secteur: 'Santé publique' },
  { titre: 'Artisan(e) ferronnier(ère)', secteur: 'Métallurgie d\'art' },
];

const MOTIFS_VOYAGE: Array<'études' | 'travail' | 'découverte' | 'humanitaire' | 'résidence artistique'> = [
  'études', 'travail', 'découverte', 'humanitaire', 'résidence artistique',
];

const CREATIONS_CATALOGUE = [
  { titre: 'Fresque murale participative', domaine: 'art' as const, description: 'Œuvre collective peinte sur la façade de l\'ancienne friche industrielle.' },
  { titre: 'Capteur de qualité de l\'eau open-hardware', domaine: 'technologie' as const, description: 'Dispositif de mesure citoyenne des effluents du Taret.' },
  { titre: 'Recueil des contes de la vallée', domaine: 'littérature' as const, description: 'Recueil illustré retraçant la mémoire orale des artisans locaux.' },
  { titre: 'Mobilier urbain en bois de réemploi', domaine: 'artisanat' as const, description: 'Bancs et tables conçus pour la place du marché populaire.' },
  { titre: 'Cartographie des sources de montagne', domaine: 'recherche' as const, description: 'Relevé hydrogéologique complet du bassin versant de la région.' },
  { titre: 'Charte de la matériauthèque solidaire', domaine: 'communs' as const, description: 'Règlement d\'usage partagé des outillages lourds de la commune.' },
];

const CAUSES_DECES = [
  'Vieillesse paisible', 'Arrêt cardiaque', 'Complications respiratoires',
  'Défaillance multiorganique', 'Fin de vie entourée des siens',
];

/** Hash 32-bit FNV-1a déterministe depuis une chaîne de caractères. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Extrait le prénom, le nom et le genre de manière déterministe depuis un chemin. */
export function prenomNomFromChemin(chemin: string): { prenom: string; nom: string; genre: 'féminin' | 'masculin' | 'non-binaire' } {
  const seed = hashString(chemin);
  const state = mulberry32(seed);
  const genre = rngPick(state, ['féminin', 'masculin', 'non-binaire'] as const);
  let prenom: string;
  if (genre === 'féminin') prenom = rngPick(state, PRENOMS_FEMININS);
  else if (genre === 'masculin') prenom = rngPick(state, PRENOMS_MASCULINS);
  else prenom = rngPick(state, PRENOMS_NON_BINAIRES);
  const nom = rngPick(state, NOMS_INVENTES);
  return { prenom, nom, genre };
}

/** Génère la biographie complète d'un individu à partir de son chemin unique. */
export function biographie(chemin: string): Biographie {
  const seed = hashString(chemin);
  const state = mulberry32(seed);

  // Année de référence du monde simulé
  const REF_YEAR = 2020;

  // Extraction déterministe de l'identité
  const genre = rngPick(state, ['féminin', 'masculin', 'non-binaire'] as const);
  let prenom: string;
  if (genre === 'féminin') prenom = rngPick(state, PRENOMS_FEMININS);
  else if (genre === 'masculin') prenom = rngPick(state, PRENOMS_MASCULINS);
  else prenom = rngPick(state, PRENOMS_NON_BINAIRES);
  const nom = rngPick(state, NOMS_INVENTES);

  // Année de naissance (cohorte)
  let anneeNaissance: number;
  const rencontreMatch = chemin.match(/\/r\/(\d{4})_/);
  if (rencontreMatch && rencontreMatch[1]) {
    const targetYear = parseInt(rencontreMatch[1], 10);
    // Pour une rencontre en targetYear, la personne a entre 16 et 45 ans
    const ageAtMeet = rngInt(state, 16, 45);
    anneeNaissance = targetYear - ageAtMeet;
  } else {
    anneeNaissance = rngInt(state, 1935, 2012);
  }

  const ageEn2020 = REF_YEAR - anneeNaissance;

  // Détermination de la cohorte
  let cohorte: 'Jeunes' | 'Actifs' | 'Séniors' | 'Anciens';
  if (ageEn2020 < 18) cohorte = 'Jeunes';
  else if (ageEn2020 < 50) cohorte = 'Actifs';
  else if (ageEn2020 < 70) cohorte = 'Séniors';
  else cohorte = 'Anciens';

  // Naissance
  const jourNaissance = rngInt(state, 1, 365);
  const villeNaissance = rngPick(state, VILLES_INVENTEES);
  const paysNaissance = rngPick(state, PAYS_INVENTES);
  const naissance: Naissance = {
    annee: anneeNaissance,
    jour: jourNaissance,
    ville: villeNaissance,
    pays: paysNaissance,
  };

  // Espérance de vie et décès
  const maxAge = rngInt(state, 72, 96);
  const anneeMortProbable = anneeNaissance + maxAge;
  let estVivant = true;
  let deces: Deces | null = null;
  let anneeFinVie = REF_YEAR;

  if (anneeMortProbable <= REF_YEAR) {
    estVivant = false;
    anneeFinVie = anneeMortProbable;
    deces = {
      annee: anneeMortProbable,
      age: maxAge,
      cause: rngPick(state, CAUSES_DECES),
      lieu: rngPick(state, VILLES_INVENTEES),
    };
  }

  // Famille
  const nomMere = rngPick(state, NOMS_INVENTES);
  const nomPere = rngPick(state, NOMS_INVENTES);
  const fratrie = rngInt(state, 0, 4);
  let statutFamilial: string;
  let enfants = 0;

  if (ageEn2020 < 18 || maxAge < 18) {
    statutFamilial = 'célibataire';
    enfants = 0;
  } else {
    statutFamilial = rngPick(state, ['célibataire', 'marié(e)', 'pacsé(e)', 'union libre', 'divorcé(e)', 'veuf/veuve']);
    if (statutFamilial !== 'célibataire') {
      enfants = rngInt(state, 0, 4);
    }
  }

  const famille: Famille = {
    nomMere,
    nomPere,
    fratrie,
    statutFamilial,
    enfants,
  };

  // Études
  const etudes: Etudes[] = [];
  if (ageEn2020 >= 6) {
    const debutEcole = anneeNaissance + 6;
    const finEcole = Math.min(anneeNaissance + 18, anneeFinVie);
    if (debutEcole < finEcole) {
      etudes.push({
        diplome: ageEn2020 < 18 ? 'Scolarité secondaire' : 'Baccalauréat Général & Technologique',
        domaine: 'Formation générale',
        anneeDebut: debutEcole,
        anneeFin: finEcole,
        etablissement: rngPick(state, ETABLISSEMENTS),
        ville: villeNaissance,
      });
    }

    if (ageEn2020 >= 18 && anneeNaissance + 18 < anneeFinVie && rngChance(state, 0.75)) {
      const sup = rngPick(state, DIPLOMES_DOMAINES);
      const debutSup = anneeNaissance + 18;
      const dureeSup = rngInt(state, 2, 5);
      const finSup = Math.min(debutSup + dureeSup, anneeFinVie);
      if (debutSup < finSup) {
        etudes.push({
          diplome: sup.diplome,
          domaine: sup.domaine,
          anneeDebut: debutSup,
          anneeFin: finSup,
          etablissement: rngPick(state, ETABLISSEMENTS),
          ville: rngPick(state, VILLES_INVENTEES),
        });
      }
    }
  }

  // Métiers
  const metiers: Metier[] = [];
  const startCareerYear = etudes.length > 0 ? etudes[etudes.length - 1]!.anneeFin : anneeNaissance + 18;

  if (startCareerYear < anneeFinVie && ageEn2020 >= 18) {
    const numJobs = rngInt(state, 1, 3);
    let currYear = startCareerYear;

    for (let j = 0; j < numJobs && currYear < anneeFinVie; j++) {
      const jobDef = rngPick(state, SECTEURS_METIERS);
      const duration = rngInt(state, 3, 12);
      const jobEnd = Math.min(currYear + duration, anneeFinVie);

      const isCurrentJob = jobEnd >= REF_YEAR && estVivant && j === numJobs - 1;
      metiers.push({
        titre: jobDef.titre,
        secteur: jobDef.secteur,
        anneeDebut: currYear,
        anneeFin: isCurrentJob ? undefined : jobEnd,
        lieu: rngPick(state, VILLES_INVENTEES),
      });

      currYear = jobEnd;
    }
  }

  // Rencontres
  const rencontres: Rencontre[] = [];
  const minAgeMeet = 14;
  const startMeetYear = anneeNaissance + minAgeMeet;

  if (startMeetYear < anneeFinVie) {
    const numRencontres = rngInt(state, 1, 4);
    const meetTypes: Array<'amitié' | 'professionnel' | 'mentorat' | 'collaboration' | 'associatif'> = [
      'amitié', 'professionnel', 'mentorat', 'collaboration', 'associatif',
    ];

    for (let i = 0; i < numRencontres; i++) {
      const meetYear = rngInt(state, startMeetYear, anneeFinVie);
      const cheminPartenaire = `${chemin}/r/${meetYear}_${i}`;
      const partnerIdentity = prenomNomFromChemin(cheminPartenaire);

      rencontres.push({
        annee: meetYear,
        nomPartenaire: `${partnerIdentity.prenom} ${partnerIdentity.nom}`,
        cheminPartenaire,
        type: rngPick(state, meetTypes),
        lieu: rngPick(state, VILLES_INVENTEES),
      });
    }

    rencontres.sort((a, b) => a.annee - b.annee);
  }

  // Voyages
  const voyages: Voyage[] = [];
  const startVoyageYear = anneeNaissance + 10;

  if (startVoyageYear < anneeFinVie) {
    const numVoyages = rngInt(state, 0, 3);

    for (let i = 0; i < numVoyages; i++) {
      const vYear = rngInt(state, startVoyageYear, anneeFinVie);
      voyages.push({
        annee: vYear,
        destination: rngPick(state, VILLES_INVENTEES),
        pays: rngPick(state, PAYS_INVENTES),
        motif: rngPick(state, MOTIFS_VOYAGE),
      });
    }

    voyages.sort((a, b) => a.annee - b.annee);
  }

  // Créations
  const creations: Creation[] = [];
  const startCreationYear = anneeNaissance + 12;

  if (startCreationYear < anneeFinVie) {
    const numCreations = rngInt(state, 0, 3);

    for (let i = 0; i < numCreations; i++) {
      const cYear = rngInt(state, startCreationYear, anneeFinVie);
      const cItem = rngPick(state, CREATIONS_CATALOGUE);

      creations.push({
        annee: cYear,
        titre: cItem.titre,
        domaine: cItem.domaine,
        description: cItem.description,
      });
    }

    creations.sort((a, b) => a.annee - b.annee);
  }

  return {
    chemin,
    nom,
    prenom,
    genre,
    cohorte,
    naissance,
    famille,
    etudes,
    metiers,
    rencontres,
    voyages,
    creations,
    deces,
    estVivant,
  };
}
