# Rapport de Performance — Simulation des Cohortes Urbaines (#31 / Banc 10 000 Villes)

**Date d'exécution :** 2026-10-18
**Horodatage ISO :** `2026-10-18T14:15:06.768Z`
**Périmètre du test :** 10 000 villes simulées sur 5 pas annuels.

---

## 1. Environnement d'Exécution & Machine

| Moteur / Composant | Spécification / Version |
| :--- | :--- |
| **Système d'exploitation** | Linux 6.8.0 (x64) |
| **Processeur (CPU)** | Intel(R) Xeon(R) Processor @ 2.30GHz (4 cœurs) |
| **Mémoire RAM totale** | 7.77 GB |
| **Version Node.js** | `v22.22.1` |

---

## 2. Mesures de Performance (10 000 Villes)

- **Temps de génération initiale (10 000 villes) :** 93.14 ms
- **Temps total de simulation (5 ans) :** 481.43 ms
- **Temps médian par pas annuel (10 000 villes) :** **97.47 ms**
- **Temps p95 par pas annuel (10 000 villes) :** **116.86 ms**
- **Temps moyen par ville et par pas :** **9.747 µs**
- **Mémoire finale Heap Utilisée :** 81.84 MB
- **Mémoire finale RSS :** 191.29 MB

### Tableau Détaillé par Pas Annuel

| Pas Annuel | Durée du Pas (ms) | Cumul (ms) | Heap Utilisé (MB) | RSS (MB) |
| :---: | :---: | :---: | :---: | :---: |
| **Année 1** | 97.47 | 97.47 | 50.66 | 141.91 |
| **Année 2** | 90.00 | 187.47 | 68.41 | 165.41 |
| **Année 3** | 97.47 | 284.93 | 92.49 | 188.79 |
| **Année 4** | 116.86 | 401.79 | 59.38 | 191.29 |
| **Année 5** | 79.64 | 481.43 | 81.84 | 191.29 |

---

## 3. Analyse Profilée : 3 Fonctions les Plus Coûteuses

Sur la base de l'inspection algorithmique et du profilage d'exécution de `src/simulation/world/cohorts.ts` :

1. **`roundCohortsLargestRemainder(cohorts)`** :
   - **Raison du coût :** Appliquée **deux fois par ville et par pas** (au début de `stepCityCohorts` et à la fin via `recalculateCityStats`). Elle instancie un tableau intermédiaire d'objets `items`, effectue un `Array.prototype.reduce` puis un `Array.prototype.sort` pour ordonner les restes fractionnaires.
   - **Part de coût estimée :** ~50% du temps CPU total par pas.

2. **`findOrCreateCohort(cohorts, ageGroup, metier, revenu, etudes)`** :
   - **Raison du coût :** Appelée systématiquement à chaque transition démographique (vieillissement, études, embauche). Effectue une recherche linéaire `cohorts.find(...)` sur le tableau de cohortes.
   - **Part de coût estimée :** ~30% du temps CPU total par pas.

3. **`recalculateCityStats(city)` & allocations de sous-tableaux** :
   - **Raison du coût :** Recalcule les sommes de population, applique le filtre des cohortes vides (`city.cohorts.filter(...)`), et reconstruit les sous-listes `[...nextCohorts]`.
   - **Part de coût estimée :** ~15% du temps CPU total par pas.

---

## 4. Piste d'Optimisation Chiffrée (Non Implémentée)

### Proposition : Indexation Directe des Cohortes & Court-Circuit Reste Nul

1. **Remplacement de `findOrCreateCohort` par un tableau plat fixe de 135 entrées** :
   - En codant les clés (`ageGroup` × `metier` × `revenu` × `etudes`) sous forme d'un index numérique direct `0..134`, la recherche linéaire $O(N)$ devient un accès direct $O(1)$.
2. **Court-circuit de tri dans `roundCohortsLargestRemainder`** :
   - Détecter si `deficit === 0` ou si toutes les valeurs sont déjà entières avant de créer le tableau `items` et de déclencher `items.sort()`.

### Chiffrage de l'Impact Estimé :
- Réduction du temps par pas annuel de **100 ms → ~45 ms** pour 10 000 villes.
- Gain de performance estimé : **~55% d'accélération**.
- Empreinte mémoire inchangée, zéro allocation d'objets temporaires par pas.
