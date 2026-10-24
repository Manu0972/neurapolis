# Fiche de complexité des fonctions simplifiées (Issue #24)

Ce document répertorie la mesure de complexité (nombre de lignes et nombre de branches décisionnelles) pour les fonctions les plus longues des fichiers de simulation ciblés par les travaux de simplification (#24) :
- `src/simulation/engine.ts`
- `src/simulation/life.ts`
- `src/simulation/economy.ts`

L'objectif est d'offrir un suivi chiffré et vérifiable lors des revues de code, afin d'attester de la simplification effective des structures sans s'appuyer sur de simples impressions.

---

## Tableau de complexité avant / après

*Note : Cette fiche établit l'état de référence (baseline) mesuré sur la branche `refonte-3d`. Aucun refactoring n'a été appliqué dans cette tâche initiale, les valeurs « avant » et « après » sont donc identiques.*

| Fichier | Fonction | Lignes (avant) | Lignes (après) | Branches (avant) | Branches (après) |
| --- | --- | --- | --- | --- | --- |
| `src/simulation/engine.ts` | `tickWorld` | 73 | 73 | 6 | 6 |
| `src/simulation/engine.ts` | `runTicks` | 5 | 5 | 1 | 1 |
| `src/simulation/engine.ts` | `worldClockLabel` | 4 | 4 | 1 | 1 |
| `src/simulation/life.ts` | `lifeTick` | 17 | 17 | 3 | 3 |
| `src/simulation/economy.ts` | `economyDay` | 143 | 143 | 34 | 34 |
| `src/simulation/economy.ts` | `simulateHour` | 58 | 58 | 11 | 11 |
| `src/simulation/economy.ts` | `economyTick` | 47 | 47 | 15 | 15 |

---

## Commande pour relancer la mesure

La mesure est automatisée par le script en lecture seule `scripts/complexity-report.mjs` (sans aucune nouvelle dépendance).

Pour réexécuter l'analyse à tout moment depuis la racine du projet :

```bash
node scripts/complexity-report.mjs
```

---

## Interprétation des écarts et règles de relecture

1. **Règles de comptage** :
   - **Lignes** : Nombre total de lignes entre le début de la déclaration de la fonction et sa fermeture.
   - **Branches** : Nombre de points de bifurcation décisionnels internes dans l'AST TypeScript (`if`, `switch case`, `?:` ternaires, ainsi que les structures de boucle `for`, `for...in`, `for...of`, `while`, `do...while`).

2. **Lecture des écarts lors d'un refactoring (#24)** :
   - **Lignes (`Lignes (après)` < `Lignes (avant)`)** : Traduit une réduction de la verbosité ou l'extraction de sous-fonctions utilitaires pures.
   - **Branches (`Branches (après)` < `Branches (avant)`)** : Traduit une baisse de la complexité cyclomatique (simplification des conditions imbriquées, élimination des branches redondantes, etc.).
   - Toute hausse injustifiée du nombre de branches ou de lignes sur une fonction retouchée lors d'une simplification doit être signalée en revue de code.
