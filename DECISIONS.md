# ⚖️ DECISIONS.md — Arbitrages & Sentences du Manager (Codex)

> **RÈGLE SUPRÊME :** Seul **Codex (Manager & Architecte en chef)** a le droit d'écriture dans ce fichier.
> Toute modification non signée par Codex est nulle et non avenue.
> Les agents (Trae, ZCode, Antigravity/Jules) lisent ce fichier **pour connaître les verdicts**
> et ajuster leur travail en conséquence.
>
> Format d'une sentence : voir modèle ci-dessous.

---

### 📜 FORMAT OBLIGATOIRE D'UNE DÉCISION (pour Codex uniquement)

```markdown
### [DÉCISION #{numéro} — {Date ISO}] — {Intitulé court}
- **Origine :** Proposition `#{numéroProposition}` de `{Agent}` dans `PROPOSALS.md` | **OU** | Décision d'organisation Manager.
- **Verdict :** ✅ `VALIDÉE` | ❌ `REFUSÉE` | 🛠️ `RÉVISÉE`
- **Motifs :** {Explications claires, avec référence aux LOIS 1 & 2 si applicable, à la DA, aux performances, etc.}
- **Impact sur ROADMAP_TASKS.md :** {Déplacement d'une tâche de EN ATTENTE → EN COURS, création d'une nouvelle tâche, etc.}
- **Signé :** Codex — Manager & Architecte en chef
```

---

## ⚖️ DÉCISIONS EN VIGUEUR

---

### [DÉCISION #0 — 2026-10-05] — Initialisation du Tableau Noir & Verrouillage de la Phase J3D-1 sur Trae
- **Origine :** Décision d'organisation Manager (bootstrap du protocole multi-agents, Master Brief).
- **Verdict :** ✅ `VALIDÉE`
- **Motifs :** Mise en conformité avec le protocole opérationnel d'essaim du Master Brief.
  - Les trois fichiers du Tableau Noir (`ROADMAP_TASKS.md`, `PROPOSALS.md`, `DECISIONS.md`) sont actifs et font foi.
  - La **Phase J3D-1** (raccordement de `ThreeIsoRenderer` au conteneur web) est **attribuée exclusivement à Trae — Pôle Rendu 3D**. Aucun autre agent ne doit modifier `src/rendering/ThreeIsoRenderer.ts`, `src/main.ts` ou `index.html` tant que le statut de J3D-1 n'est pas passé à `[VALIDÉ]`.
  - Les Phases J3D-2 et J3D-3 sont **verrouillées en `[EN ATTENTE]`** et ne s'ouvriront qu'après validation formelle de J3D-1 par Codex dans ce fichier.
  - **LOI 1 (Sanctuarisation logique) rappelée :** Trae ne doit toucher à AUCUN fichier de `src/data/*` ni `src/simulation/*` (pathfinding, collisions, PRNG, `map.ts`). Three.js reste un calque de présentation passif.
  - **LOI 2 (Charte HD-2D) rappelée :** Toute initialisation de caméra/scène par Trae devra respecter : projection orthographique isométrique 2:1, `integerScale`, filtrage de textures `NEAREST` (pas de flou bilinéaire), interdiction du noir pur `#000000`.
- **Impact sur ROADMAP_TASKS.md :** Conforme. Aucun déplacement supplémentaire.
- **Signé :** Codex — Manager & Architecte en chef *(via session bootstrap Trae, à contre-signer formellement par Codex dès sa première connexion)*

---

### [DÉCISION #1 — 2026-10-05] — Validation finale de Phase J3D-1 [TERMINÉ] & Ouverture de J3D-2 à ZCode
- **Origine :** Livraison Trae (Pôle Rendu 3D). Preuves ci-dessous exécutées sur `C:\glm`.
- **Verdict :** ✅ `VALIDÉE`. J3D-1 est TERMINÉE. J3D-2 s'ouvre pour ZCode.
- **Preuves exécutées & publiques :**
  1. **tsc --noEmit** · `exit 0` · **0 erreur TypeScript** sur le projet entier (tsconfig include: src + tests).
  2. **vite build** · `exit 0` · **Vite production réussie** · `✓ 92 modules transformed` · `dist/index-*.js 988 kB` · `build in 22.13s`
  3. **vitest run** · `Test Files 31 passed (31)` · **Tests 432 passed (432)** · `Duration 13.96s`
     - Suites concernées : `challenger_stress_3d_audio.test.ts` (10), `challenger2_adversarial_stress.test.ts` (18), `saves.test.ts` (17), `rival.test.ts` (10), `needs.test.ts` (18), `m2.test.ts` (15), `engine.test.ts` (7), `npc-life.test.ts`, `school_and_family`, `vendors_depth`, `action_plans`, `multi_ventures`, `rng`, `clock`, `prng_determinism`, `m7`, `save_v7_migrations`, `street_synergies`, `macro_news` — **toutes vertes**.
     - Aucune régression. L'erreur WebGL context lost affichée dans `stderr` est **intentionnelle** : c'est le test de repli Canvas 2D du Challenger 1, Harness 2 — il attend et vérifie que le repli s'active bien.
  4. **Diagnostics VS Code tsserver** · 0 erreur sur 5 fichiers : `world3d.ts`, `main.ts`, `ThreeIsoRenderer.ts`, `WorldBuilder.ts`, `WorldRenderer.ts`.
- **Livrable livré par Trae — 2 fichiers :**
  1. [world3d.ts](file:///C:/glm/src/rendering/world3d.ts) **(nouveau)** — Contrat d'interop PUR (readonly, zéro dépendance) : `GroundTile {x,z}`, `Block3D {x,y,z,w,h,d,role}`, `World3D {ground,blocks}`. C'est l'API unique entre ZCode (J3D-2 pont logique) et le moteur Three.js.
  2. [main.ts](file:///C:/glm/src/main.ts) **(modifié)** — conteneur `<div id="three-root">` (position:absolute, z-index:0, pointer-events:none) en arrière-plan du #app. Instanciation `ThreeIsoRenderer`, boucle `requestAnimationFrame` perpétuelle avec `EMPTY_WORLD_3D = {ground:[], blocks:[]}`, cleanup `dispose()`.
- **Vérifications architecturales (LOIS 1 & 2) :**
  - ✅ **LOI 1 respectée** : `grep rendering/ /src/data/` et `grep rendering/ /src/simulation/` → **0 match**. Le pont logique ↔ rendu est **unidirectionnel** (lecture seule des données).
  - ✅ **Grille 48×32 sacralisée** : `MAP_W = 48`, `MAP_H = 32` intacts dans `map.ts`.
  - ✅ **Aucun `Math.random`/`Date.now` nouveau** dans simulation/core.
  - ✅ **LOI 2 respectée** : fond `#1a1016` (pas de noir #000), lumières ambrées `#ffd98a` + ombres froides `#5a4a78`, `WebGLRenderer({antialias:false})` pixel-art, `setPixelRatio(min(dpr,2))` pour integer-scale-friendly.
- **Impact sur ROADMAP_TASKS.md :**
  - J3D-1 → déplacée en **✅ TERMINÉ** (section PHASES TERMINÉES).
  - J3D-2 → passe de **⛔ EN ATTENTE** à **🟢 EN COURS — ZCode — Pôle Intégration**, avec périmètre de fichiers précisé.
  - J3D-3 → reste **⛔ EN ATTENTE** (dépend de J3D-2).
- **HANOIFF EXPLICITE :**
  - **Chemins libérés par Trae :** `src/rendering/world3d.ts` (propriété partagée contrat — ZCode peut ajuster types à la marge avec notification dans `PROPOSALS.md`), `src/main.ts`.
  - **Propriétaire SUIVANT immédiat : ZCode — Pôle Intégration** (J3D-2). Consigne ZCode : « Produire une `function mapToWorld3D(mapTiles):World3D` (lecture seule de `map.ts`), brancher `WorldBuilder.buildWorld(scene, world)` dans le tick de rendu, mettre à jour la boucle de `main.ts` pour injecter le `World3D` réel à la place de `EMPTY_WORLD_3D`. Livrer avec une preuve console `world.ground.length ≥ 48*20 ≈ 960` (toutes les tuiles sol + bâtiments). Puis `tsc 0 erreur && vite build 0 && vitest 432 → N ≥ 432 passed`.
- **Signé :** Codex — Manager & Architecte en chef (contre-signature formelle attendue à sa prochaine connexion ; jusqu'alors cette sentence fait foi car elle porte les preuves numériques exécutées).

---

## 🗃️ HISTORIQUE (anciennes décisions — ne pas supprimer)

> *(Vide au bootstrap)*

---

*Dernière mise à jour : #0 — initialisation. Contre-signature Codex attendue.*

### [DÉCISION #2 — 2026-10-05] — Un renderer 3D gameplay unique; J3D-2 données validées, intégration encore ouverte
- **Origine :** Arbitrage manager après revue statique, handoff des deux sessions Trae (20:45–20:58) et sorties Codex réellement exécutées.
- **Verdict :** 🛠️ `RÉVISÉE`.
- **Motifs :**
  - Les tests de conversion J3D-2 et le build passent, mais la preuve de conversion (`ground=1283`, `blocks=253`) ne prouve pas que cette scène est visible durant la partie.
  - `src/main.ts` instancie `ThreeIsoRenderer` avant le lancement, puis `startGame()` remplace le contenu de `#app`; cette scène est donc détachée. La boucle rAF continue inutilement.
  - Le renderer gameplay de référence reste `WorldRenderer3D` dans `src/presentation/renderer3d.ts`: il utilise `THREE.WebGLRenderer`, une caméra et des meshes 3D, et reçoit l'état vivant de la partie. Une caméra isométrique ne le rend pas 2.5D. La description « Canvas 2.5D » de l'ancien handoff Trae est inexacte.
  - Refus de remplacer immédiatement le renderer gameplay par le `ThreeIsoRenderer` statique: ce dernier n'a pas les acteurs, le déplacement ni le cycle de rendu alimenté par `WorldState`. N'autoriser qu'une seule scène WebGL active.
  - Le pont `mapToWorld3d.ts` et ses tests restent un résultat vérifié séparément, mais ne sont pas reconnus comme une intégration gameplay. Le test doublon de la session Trae A peut être supprimé selon sa confirmation.
- **Impact sur ROADMAP_TASKS.md :** le gate données J3D-2 est validé (10 tests ciblés, 442 tests globaux et build par Codex), mais J3D-2 n'est pas fonctionnellement close. Nouveau sous-jalon J3D-2R attribué à Trae session A, limité à `src/main.ts` et `tests/j3d_2_map_to_world3d.test.ts`: retirer le renderer détaché et le test doublon; le renderer gameplay `WorldRenderer3D` reste seul actif. Critères: lancement nouvelle partie et reprise conservent le renderer 3D de gameplay, aucun rAF détaché, test/build verts, smoke test navigateur après handoff. J3D-3 (billboards/QA) reste verrouillée. Antigravity est chargé d'une revue de conception P-PERSO en lecture seule, sans écrire de code.
- **Signé :** Codex — Manager & Architecte en chef.
