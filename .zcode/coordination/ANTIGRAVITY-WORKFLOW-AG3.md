# Workflow AG-3 — « Quartiers vivants & rivalités » (Antigravity)

Commandé par Claude Code (session 45d06140), le 2026-10-07, à la demande de l'utilisateur.
Contexte : la grande carte (1 562 × 1 154 m, 10 quartiers ouverts par palier) existe ; les lieux remarquables
(`src/data/city/landmarks.ts`) et les commerçants des quartiers (`src/data/city/district_shops.ts`) aussi.
Claude Code construit en ce moment le **multijoueur en LAN** (Meshnet) : deux joueurs dans la même ville,
qui peuvent **coopérer ou se saboter**. Ton travail : donner une âme aux quartiers et des mots, de la
pédagogie et de la morale à ce multijoueur. **Données seulement** : aucune logique, aucun branchement ;
Claude Code intègre.

## Règles

1. Lis `AGENTS.md`, puis réserve tes chemins dans `.zcode/coordination/BOARD.md` **avant d'écrire**.
2. Chemins réservés pour toi (et seulement ceux-là) :
   `src/data/residents/`, `src/data/districts_ext/`, `src/data/multi/`,
   `src/data/ascension_ext/concepts_multi.ts`, `src/data/ascension_ext/quiz_multi.ts`,
   `docs/lore/QUARTIERS.md`, `tests/content_ag3.test.ts`.
3. N'écris nulle part ailleurs (pas de `game.ts`, pas de registres, pas de `types.ts`).
4. Écriture neutre en genre quand on s'adresse au joueur (« prêt·e », « venu·e », ou tournure neutre).
   Le joueur est appelé `{prenom}` si besoin ; l'autre joueur est appelé `{autre}`.
5. Aucun `Math.random()`, aucune clé d'API, aucune dépendance npm.
6. Vérifications à lancer dans `C:\Users\laqui\Documents\glm\.ci\verif` :
   `node node_modules/typescript/bin/tsc --noEmit -p .` puis `node node_modules/vitest/vitest.mjs run`.
   Rapporte les sorties réelles.
7. Un message court dans le BOARD par phase livrée ; « livré » avec preuves à la fin, puis libère les chemins.

## Phase 1 — Habitants nommés des 9 nouveaux quartiers (`src/data/residents/residents.ts`)

```ts
import type { Sector } from '../../core/happenings_types';

export type ResidentDistrict =
  | 'gare_est' | 'hyperval' | 'industrie' | 'collines' | 'berges'
  | 'faubourg' | 'grand_ensemble' | 'friche_sud' | 'bellevue';

export interface ResidentDef {
  id: string;                 // snake_case, unique
  name: string;
  age: number;
  role: string;               // « cheminot retraité », « livreuse à vélo »…
  district: ResidentDistrict;
  /** Nom EXACT d'une rue de CITY.roads qui traverse ce quartier (lis src/data/city/layout.ts). */
  street: string;
  /** Heures de présence [début, fin) en minutes depuis minuit. */
  hours: [number, number];
  greeting: string;
  lines: string[];            // au moins 5 répliques
  /** Rumeurs : indices vers un secret, une idée de business, ou un secteur qui bouge. */
  rumors: { text: string; secretId?: string; ideaId?: string; sector?: Sector }[]; // au moins 2
  /** Penseur (fantôme) que ce personnage fait réagir, facultatif. */
  ghost?: string;
  /** Lien avec un personnage existant (famille, connexion, commerçant), facultatif. */
  link?: string;
}

export const RESIDENTS: readonly ResidentDef[] = [ /* 4 par quartier = 36 */ ];
```

Les `secretId` doivent exister dans `src/data/secrets_registry.ts`, les `ideaId` dans `src/data/ascension/ideas.ts`.

## Phase 2 — La vie des quartiers dans le fil d'infos (`src/data/districts_ext/happenings.ts`)

```ts
import type { Sector } from '../../core/happenings_types';
import type { ResidentDistrict } from '../residents/residents';

export interface DistrictHappening {
  id: string;
  district: ResidentDistrict;
  minTier: 2 | 3 | 4 | 5 | 6;
  headline: string;
  body: string;
  effects: { sector: Sector; mult: number; days: number }[]; // mult entre 0.6 et 1.5
  reaction: { ghost: string; text: string };
}

export const DISTRICT_HAPPENINGS: readonly DistrictHappening[] = [ /* 5 par quartier = 45 */ ];
```

## Phase 3 — Les mots du multijoueur (`src/data/multi/flavor.ts`)

Identifiants **fixes** (Claude Code code les mécaniques avec ces ids) :

```ts
export type MultiMechanicId =
  // Coopération
  | 'pret'              // prêter de l'argent à l'autre joueur, avec intérêt ou non
  | 'coentreprise'      // lancer une idée d'Ascension à deux, bénéfices partagés
  | 'achats_groupes'    // commander ensemble chez un grossiste : remise de volume
  | 'recommandation'    // envoyer ses clients chez l'autre (catégories différentes)
  | 'formation'         // apprendre un concept ou de l'XP à l'autre
  | 'garant_mutuel'     // l'un se porte garant / prête-nom de l'autre
  // Zone grise (la morale et la loi s'en mêlent)
  | 'entente_prix'      // s'entendre sur les prix : rentable… et illégal (cartel)
  // Sabotage
  | 'guerre_des_prix'   // casser les prix dans le quartier de l'autre
  | 'rumeur'            // faire courir une rumeur sur son commerce
  | 'debauchage'        // débaucher un de ses employés
  | 'signalement'       // signaler son commerce à l'inspection
  | 'rachat_fournisseur'// rafler le stock de son grossiste
  | 'espionnage'        // lire ses comptes (asymétrie d'information)
  | 'bail_coupe';       // louer le local qu'il visait juste avant lui

export interface MultiFlavor {
  id: MultiMechanicId;
  kind: 'coop' | 'zone_grise' | 'sabotage';
  label: string;          // texte du bouton
  pitch: string;          // une phrase qui explique ce que ça fait
  toActor: string;        // ce que lit celui qui agit ({autre} = nom de l'autre joueur)
  toTarget: string;       // ce que lit celui qui subit (ou reçoit)
  discovered: string;     // ce que lit la cible si elle découvre que c'était l'autre (sabotage)
  ghostFor: { ghost: string; text: string };     // un penseur qui approuve
  ghostAgainst: { ghost: string; text: string }; // un penseur qui désapprouve
  concept: string;        // id d'un concept existant ou de la phase 4
  lesson: string;         // 1 à 2 phrases de pédagogie économique
}

export const MULTI_FLAVOR: readonly MultiFlavor[] = [ /* les 14, un par id */ ];

/** Répliques des fantômes quand les deux joueurs coopèrent longtemps, ou se trahissent. */
export const MULTI_MOMENTS: readonly { id: string; when: 'alliance_longue' | 'trahison' | 'reconciliation' | 'rivalite_ouverte'; ghost: string; text: string }[] = [ /* au moins 12 */ ];
```

## Phase 4 — Concepts et quiz du multijoueur

`src/data/ascension_ext/concepts_multi.ts` exporte `MULTI_CONCEPTS: readonly EconConcept[]` (type de
`src/data/ascension/concepts.ts`) : **7 concepts** — `dilemme_prisonnier`, `cartel`, `coentreprise`,
`confiance_repetee`, `barriere_entree`, `guerre_des_prix`, `passager_clandestin`.
Vérifie qu'aucun id ne recouvre les 32 concepts existants.

`src/data/ascension_ext/quiz_multi.ts` exporte `MULTI_QUIZZES: readonly ConceptQuiz[]` (type de
`src/data/ascension_ext/quiz.ts`) : 3 questions par nouveau concept (21 questions), explications
concrètes situées à Val-Ferrand.

## Phase 5 — Lore des quartiers (`docs/lore/QUARTIERS.md`)

Pour chacun des 9 quartiers : histoire (dates, Taret-Acier, le canal, la crue de 2019…), ambiance,
qui y vit, ce qu'on y vend, pourquoi il est fermé au début (cohérent avec les textes `lock` de
`CITY_AREAS` dans `src/data/city/layout.ts`) et ce qui change quand il s'ouvre.

## Phase 6 — Tests (`tests/content_ag3.test.ts`)

Unicité et snake_case des ids ; rues existantes (`CITY.roads`) ; `secretId`, `ideaId`, `ghost` et
`concept` existants ; 14 mécaniques présentes une fois chacune ; 7 concepts sans collision ; 21
questions à 4 choix ; neutralité de genre (mêmes contrôles que `tests/content_ext.test.ts`) ;
multiplicateurs dans les bornes.

## Livraison

Message « livré » dans le BOARD : fichiers créés, nombres (36 habitants, 45 événements, 14 mécaniques,
12+ moments, 7 concepts, 21 questions), sorties réelles de tsc et vitest, chemins libérés.
