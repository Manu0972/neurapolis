# 🛰️ docs/suivi/ROADMAP_TASKS.md — Registre d'Attribution des Tâches

> **RÈGLE :** Ce fichier est le seul détenteur de la vérité sur l'affectation des tâches.
> Jamais deux agents ne doivent avoir le statut `[EN COURS]` sur des fichiers qui se recoupent
> (voir matrice de cloisonnement dans le Master Brief).
> Toute tâche non listée ci-dessous est **verrouillée en lecture seule**.

---

## 🔬 PHASES TERMINÉES (référence uniquement)

| Phase | Intitulé | Agent | Commit / Artefact | Statut |
|:-----:|:--------|:------|:-------------------|:------:|
| J3D-0 | Initialisation des modules de base : `WorldRenderer.ts`, `ThreeIsoRenderer.ts`, `WorldBuilder.ts` | — (Socle historique) | `c32530b` | ✅ **TERMINÉ** |
| **J3D-1** | **Raccordement de `ThreeIsoRenderer` au conteneur web sans altération de la simulation.** Contrat `world3d.ts` créé. Conteneur `#three-root` + boucle rAF branchés. | **Trae — Pôle Rendu 3D** | ✅ **DÉCISION #1 (2026-10-05) VALIDÉE** | ✅ **TERMINÉ** |
| **J3D-2 données** | **Conversion de la grille vers `World3D` vérifiée séparément. Cette livraison ne prouve pas l'intégration dans le renderer du jeu.** | **Trae — Pôle Rendu 3D** | `mapToWorld3d.ts` + `tests/map-to-world3d.test.ts` | ✅ **GATE DONNÉES VALIDÉ** |

### Preuves J3D-1 — exécutées à `2026-10-05 19:47`
| Vérification | Résultat |
|:---|:---|
| `tsc --noEmit` (strict) | **exit 0 · 0 erreur** |
| `vite build` | **exit 0 · 92 modules · 22,13s** |
| `vitest run` (31 fichiers) | **Tests 432 / 432 — 100%** |
| Invariants LOI 1 & LOI 2 | ✅ 0 imports croisés. Grille 48×32 intacte. |

**Livrables J3D-1 :**
1. **Nouveau** · [world3d.ts](file:///C:/glm/src/rendering/world3d.ts) — contrat d'interop PUR.
2. **Modifié** · [main.ts](file:///C:/glm/src/main.ts) — conteneur `#three-root`, boucle rAF.

### Preuves J3D-2 — exécutées à `2026-10-05 20:33`
| Vérification | Résultat |
|:---|:---|
| `tsc --noEmit` (heap 4096) | **exit 0 · 0 erreur** |
| `vite build` | **exit 0 · 95 modules · 6.24s** |
| `vitest run` | **Test Files 33 · Tests 442 passed (432 + 10)** |
| Preuve console J3D-2 | **`ground.length = 1283` (≥960)** · **`blocks.length = 253` (>0)** |

**Livrables J3D-2 :**
1. **Nouveau** · [mapToWorld3d.ts](file:///C:/glm/src/rendering/mapToWorld3d.ts) — pont `map.ts → World3D` (lecture seule, LOI 1).
2. **Nouveau** · [tests/map-to-world3d.test.ts](file:///C:/glm/tests/map-to-world3d.test.ts) — 5 tests dédiés.
3. **Modifié** · [main.ts](file:///C:/glm/src/main.ts) — injecte `REEL_WORLD_3D = mapToWorld3D()`.

---

## ⚡ PHASES EN COURS / EN ATTENTE D'ARBITRAGE

| Phase | Intitulé | Agent assigné | Fichiers ciblés | Statut | Débloquée par |
|:-----:|:--------|:--------------|:----------------|:------:|:--------------|
| **J3D-2R** | Retirer de `main.ts` la scène `ThreeIsoRenderer` détachée et sa boucle rAF, en gardant l'écran d'accueil; remettre un handoff avec gates runtime. | **Trae — session A** | `src/main.ts` uniquement (`tests/j3d_2_map_to_world3d.test.ts` est déjà absent) | 🟢 **EN COURS — handoff attendu** | Handoff Trae A, `npm test`, build et smoke nouvelle partie/reprise |
| **J3D-3** | Billboards face-caméra, palette 32 teintes, filtrage pixel-perfect et QA FPS; une seule scène WebGL. | **Antigravity — Visuels & QA** | À réserver après ouverture formelle | ⛔ **VERROUILLÉE** | Clôture vérifiée de J3D-2R et arbitrage explicite Codex |

---

### 📡 [NOTE — ROSTER] — J3D-2 transférée à Trae; statut actuel de ZCode à reconfirmer

La réservation initiale de ZCode sur J3D-2 a été annulée; le pont de données a ensuite été livré par Trae. L'objectif utilisateur courant nomme de nouveau ZCode parmi les contributeurs : sa participation et sa disponibilité sont à confirmer dans `BOARD.md`. Cette clarification de roster ne réouvre pas son ancienne réservation J3D-2 et ne lui attribue aucun fichier. Le gate d'intégration gameplay reste ouvert en J3D-2R. Toute nouvelle tâche exige une réservation explicite.

#### Prérequis J3D-2 (pour relecture Codex — déjà consommés par Trae)
| Dépendance | Valeur |
|:---|:---|
| Contrat | `World3D` = `{ground, blocks}` · `BlockRole = mur|toit|sol|entree` |
| Légende `map.ts` | `#` mur · `.` trottoir · `g` herbe · `d` terre · `m/c/e/f/p/q` entrées |
| Méthode Three.js | `WorldBuilder.buildWorld(scene, world)` — consommée par `ThreeIsoRenderer` (hash dirty-check) |
| Preuve | `ground.length = 1283` (≥960) · `blocks.length = 253` (>0) · tsc 0 · build 0 · vitest 442/442 |

---

## ⏳ PROCHAINES PHASES

- **J3D-2R — Trae session A** : retirer le montage détaché dans `main.ts`, fournir handoff et preuves runtime; test doublon déjà absent.
- **J3D-3 — Antigravity** : reste verrouillée jusqu'à la clôture vérifiée de J3D-2R et une réservation propre.

---

## 🚦 LÉGENDE DES STATUTS
- ✅ **TERMINÉ** — Tâche close, preuves tsc/build/vitest fournies, décision Manager publiée, handoff fait.
- 🟢 **EN COURS** — Agent actif. Périmètre verrouillé aux autres agents.
- ⛔ **EN ATTENTE** — Tâche gelée. Fichiers cibles en lecture seule POUR TOUS.
- 🔍 **REVUE MANAGER** — Terminé côté agent. Attend validation formelle Manager dans `docs/suivi/DECISIONS.md`.

---

*Dernière mise à jour : 2026-10-05 · Le gate de conversion J3D-2 est validé; J3D-2R reste ouvert et J3D-3 verrouillée selon DÉCISION #2.*

## ⚖️ ARBITRAGE MANAGER ACTUEL — DÉCISION #2 (2026-10-05)

Cette section prévaut sur les statuts antérieurs de ce registre :

- **J3D-2 données** : gate validé séparément (pont `mapToWorld3d.ts`, 1 283 tuiles de sol, 253 blocs, tests/build réels consignés dans `BOARD.md`). Cela ne signifie pas que le monde est branché au jeu.
- **Renderer gameplay unique** : conserver `WorldRenderer3D` dans `src/presentation/renderer3d.ts`, renderer Three.js/WebGL piloté par l'état du jeu. Ne pas le qualifier de 2.5D ni le remplacer par la scène statique `ThreeIsoRenderer`.
- **J3D-2R — en cours, Trae session A** : chemins exclusifs `src/main.ts` et `tests/j3d_2_map_to_world3d.test.ts`. Retirer le montage de la scène détachée `ThreeIsoRenderer`/sa boucle rAF de `main.ts`, conserver l'écran d'accueil et le renderer gameplay existant, supprimer le test de pont doublon. Ne pas toucher aux chemins de Trae session B ni à `src/presentation/renderer3d.ts` dans ce jalon. Fin après handoff, tests/build et smoke test navigateur constatant une scène 3D active après nouvelle partie et reprise.
- **Trae session B** : propriétaire inchangé, lecture seule jusqu'à handoff, sur `src/rendering/mapToWorld3d.ts` et `tests/map-to-world3d.test.ts`; le convertisseur demeure un outil de données non intégré.
- **J3D-3** : verrouillée jusqu'à clôture J3D-2R; elle ne doit pas introduire une seconde scène WebGL.
- **P-PERSO-1 — modèle et sauvegarde v8** : livré par Codex sur `src/core/types.ts`, `src/core/store.ts`, `src/saves/migrations.ts`, `tests/saves.test.ts`. Contrat de genre/apparence et migration v7→v8 sont en place; les six caractéristiques existantes sont conservées. Preuves de tests/build et limites consignées dans `BOARD.md`.
- **P-PERSO-2 — création joueur** : 🔍 **REVUE MANAGER INCOMPLÈTE**. Le module `character-creator.ts` et ses validateurs sont livrés par Codex; le branchement visible du dépôt complète le parcours en smoke navigateur (nouveau profil, partie, sauvegarde, reprise, bascule 3D/2D). Gates dépôt non verts : `npm test` = 455/458, 3 échecs DOM sans environnement; `npm run build` échoue sur erreurs TS dans `avatar.ts` et `tests/character_creation.test.ts`. Modifications `start-screen.ts`, `style.css`, `avatar.ts`, `game.ts`, `renderer3d.ts`, `tests/character_creation.test.ts` toujours sans propriétaire/handoff déclaré; aucune attribution externe n'est validée. Voir détails dans `BOARD.md`. Le canvas n'a pas pu être capturé; le mesh avatar personnalisé reste à revoir visuellement. `renderer3d.ts` reste sous réserve de l'arbitrage J3D-2R.
- **P-PERSO-3 — rendu avatar** : verrouillée jusqu'à P-PERSO-2 et J3D-2R; attribuer un propriétaire unique après confirmation des interfaces. Le mesh gameplay consommera les données sauvegardées; garder une scène Three.js unique et ne pas modifier les chemins réservés de J3D-2R.
- **Antigravity** : revue P-PERSO demandée en lecture seule (contrat, règles/budget des six traits, assets, interfaces, dépendances et critères d'acceptation). Ne pas lui attribuer de fichiers de production avant sa réponse et une réservation explicite.

*Mise à jour Codex — 2026-10-05 : P-PERSO-1 livré; P-PERSO-2 en revue avec gates dépôt incomplets; P-PERSO-3 reste verrouillée jusqu'à la clôture J3D-2R et l'identification du propriétaire renderer.*
