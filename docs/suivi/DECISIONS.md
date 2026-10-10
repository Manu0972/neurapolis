# ⚖️ NEURAPOLIS — Journal des Décisions & Arbitrages (Codex)

> **RÈGLE SUPRÊME :** Seul **Codex (Manager & Architecte en chef)** a le droit d'écriture dans ce fichier.
> Toute modification non signée par Codex est nulle et non avenue.
> Les agents (Trae, ZCode, Antigravity/Jules, Claude) lisent ce fichier **pour connaître les verdicts**
> et ajuster leur travail en conséquence.

---

## 📜 SYNTHÈSE CHRONOLOGIQUE DES DÉCISIONS DU PROJET

| Date | Décision | Pourquoi |
|---|---|---|
| 2026-09-29 | Stack : Vite + TS strict + Canvas 2D + Vitest, zéro dépendance runtime | Suite du prototype HTML ; testable en session (Godot absent) ; « le code doit survivre 10 ans » |
| 2026-09-29 | Simulation-first : noyau testable sans rendu | Exigence Bible Partie XVI |
| 2026-09-29 | PRNG mulberry32 sérialisé dans l'état | Parties reproductibles, tests stables |
| 2026-09-29 | Fantômes = personnages, apparition PROGRESSIVE par déclencheurs vécus | Demande explicite : pas tous présents d'emblée ; on les mérite en devenant meilleur |
| 2026-09-29 | Plafond de 4 voix actives + silhouettes pour les inconnus | Le Conseil reste lisible ; l'écran montre ce qui reste à découvrir |
| 2026-09-29 | Fiches fantômes = données (`src/data/ghosts`), moteur interprète | « Données avant contenus » |
| 2026-09-29 | Réputation du joueur : bornes 0-100, départ 45 ; sources +2 vente réussie / +1 course / +3 arbitrage réussi / −5 incident ; confiance quartier ≥60 → +1/jour ; seuil 70 → stage Samir | Relecture indépendante : la valeur n'était pas spécifiée (auteur : Producteur, intégré par Documentaliste) |
| 2026-10-01 | Proposition de design : l’âge du joueur augmente d’un an chaque 1er septembre, à partir de 12 ans au début du jeu (2020-09-01), âge calculé depuis la date de jeu sans champ de sauvegarde supplémentaire | Aligne l’âge sur le calendrier scolaire et la date de départ déjà définis dans `src/core/types.ts` et `src/core/store.ts` ; proposition du propriétaire du code, consignée par le Documentaliste, à valider côté système/architecture |
| 2026-10-01 | Le chapitre 3 se valide à partir de 14 ans après cinq nouvelles courses pour l’épicerie et une contre-stratégie supplémentaire engagée après son déblocage | Les courses soutiennent directement l’épicerie (+1 vitalité chacune) et coûtent du temps ; la contre-stratégie coûte argent/énergie et confronte réellement le joueur à la réaction du Drive. Les compteurs de départ empêchent de réutiliser les actions des chapitres précédents. Auteur : Codex, rôle Documentaliste. |
| 2026-10-07 | **Rendu : 3D temps réel en troisième personne (Three.js), ville explorable à l'échelle 1 tuile = 1 m.** Remplace la cible « 2.5D pixel art sur Canvas » (décision du 2026-10-01). Le rendu 2D ne reste qu'en secours sans WebGL. | Instruction directe de l'utilisateur (2026-10-07) : « les graphismes sont nuls… faire comme si on était dans Big Ambitions… partir sur de nouvelles bases graphiques si besoin ». Consigné par la session E (Claude Code). Référence : `docs/VISION.md` §5. |
| 2026-10-07 | **Canon Taret-Acier** : hauts-fourneaux fermés en 2014 (2 900 emplois, la friche existe en 2020) ; laminoir fermé en 2032 (1 300 emplois, 4 200 au total, événement futur jouable). | Résout la contradiction entre la Bible (enfance en 2014, friche présente) et le prototype de 2045 (« fermeture en 2032 »). `docs/VISION.md` §3.2. |
| 2026-10-07 | **Échelle de temps en exploration** : vitesse ×1 = 1 minute de jeu par seconde réelle (le tick de simulation reste de 10 min). | À l'échelle d'une ville de 300 m, l'ancien rythme (10 min/s) faisait passer 7 heures pendant une traversée. `docs/VISION.md` §6. |
| 2026-10-07 | **Boucle Big Ambitions** (immobilier commercial, commerces, stock, clients par trafic, employés, banque, marketing) avec un **accès qui grandit avec l'âge** (stand à 12 ans, local co-signé à 16 ans, tout à 18 ans), plus un mode bac à sable optionnel. | Concilie la demande « complexité Big Ambitions » et la progression en spirale de la Bible. `docs/VISION.md` §4.2. Valeur par défaut, à confirmer par l'utilisateur. |

---

## 📜 FORMAT OBLIGATOIRE D'UNE SENTENCE DU MANAGER

```markdown
### [DÉCISION #{numéro} — {Date ISO}] — {Intitulé court}
- **Origine :** Proposition `#{numéroProposition}` de `{Agent}` dans `docs/suivi/PROPOSALS.md` | **OU** | Décision d'organisation Manager.
- **Verdict :** ✅ `VALIDÉE` | ❌ `REFUSÉE` | 🛠️ `RÉVISÉE`
- **Motifs :** {Explications claires, avec référence aux LOIS 1 & 2 si applicable, à la DA, aux performances, etc.}
- **Impact sur docs/suivi/ROADMAP_TASKS.md :** {Déplacement d'une tâche de EN ATTENTE → EN COURS, création d'une nouvelle tâche, etc.}
- **Signé :** Codex — Manager & Architecte en chef
```

---

## ⚖️ DÉCISIONS & SENTENCES DÉTAILLÉES EN VIGUEUR

---

### [DÉCISION #0 — 2026-10-05] — Initialisation du Tableau Noir & Verrouillage de la Phase J3D-1 sur Trae
- **Origine :** Décision d'organisation Manager (bootstrap du protocole multi-agents, Master Brief).
- **Verdict :** ✅ `VALIDÉE`
- **Motifs :** Mise en conformité avec le protocole opérationnel d'essaim du Master Brief.
  - Les trois fichiers du Tableau Noir (`docs/suivi/ROADMAP_TASKS.md`, `docs/suivi/PROPOSALS.md`, `docs/suivi/DECISIONS.md`) sont actifs et font foi.
  - La **Phase J3D-1** (raccordement de `ThreeIsoRenderer` au conteneur web) est **attribuée exclusivement à Trae — Pôle Rendu 3D**. Aucun autre agent ne doit modifier `src/rendering/ThreeIsoRenderer.ts`, `src/main.ts` ou `index.html` tant que le statut de J3D-1 n'est pas passé à `[VALIDÉ]`.
  - Les Phases J3D-2 et J3D-3 sont **verrouillées en `[EN ATTENTE]`** et ne s'ouvriront qu'après validation formelle de Codex dans ce fichier.
  - **LOI 1 (Sanctuarisation logique) rappelée :** Trae ne doit toucher à AUCUN fichier de `src/data/*` ni `src/simulation/*` (pathfinding, collisions, PRNG, `map.ts`). Three.js reste un calque de présentation passif.
  - **LOI 2 (Charte HD-2D) rappelée :** Toute initialisation de caméra/scène par Trae devra respecter : projection orthographique isométrique 2:1, `integerScale`, filtrage de textures `NEAREST` (pas de flou bilinéaire), interdiction du noir pur `#000000`.
- **Impact sur docs/suivi/ROADMAP_TASKS.md :** Conforme. Aucun déplacement supplémentaire.
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
- **Impact sur docs/suivi/ROADMAP_TASKS.md :**
  - J3D-1 → déplacée en **✅ TERMINÉ** (section PHASES TERMINÉES).
  - J3D-2 → passe de **⛔ EN ATTENTE** à **🟢 EN COURS — ZCode — Pôle Intégration**, avec périmètre de fichiers précisé.
  - J3D-3 → reste **⛔ EN ATTENTE** (dépend de J3D-2).
- **HANDOFF EXPLICITE :**
  - **Chemins libérés par Trae :** `src/rendering/world3d.ts` (propriété partagée contrat — ZCode peut ajuster types à la marge avec notification dans `docs/suivi/PROPOSALS.md`), `src/main.ts`.
  - **Propriétaire SUIVANT immédiat : ZCode — Pôle Intégration** (J3D-2). Consigne ZCode : « Produire une `function mapToWorld3D(mapTiles):World3D` (lecture seule de `map.ts`), brancher `WorldBuilder.buildWorld(scene, world)` dans le tick de rendu, mettre à jour la boucle de `main.ts` pour injecter le `World3D` réel à la place de `EMPTY_WORLD_3D`. Livrer avec une preuve console `world.ground.length ≥ 48*20 ≈ 960` (toutes les tuiles sol + bâtiments). Puis `tsc 0 erreur && vite build 0 && vitest 432 → N ≥ 432 passed`.
- **Signé :** Codex — Manager & Architecte en chef (contre-signature formelle attendue à sa prochaine connexion ; jusqu'alors cette sentence fait foi car elle porte les preuves numériques exécutées).

---

### [DÉCISION #2 — 2026-10-05] — Un renderer 3D gameplay unique; J3D-2 données validées, intégration encore ouverte
- **Origine :** Arbitrage manager après revue statique, handoff des deux sessions Trae (20:45–20:58) et sorties Codex réellement exécutées.
- **Verdict :** 🛠️ `RÉVISÉE`.
- **Motifs :**
  - Les tests de conversion J3D-2 et le build passent, mais la preuve de conversion (`ground=1283`, `blocks=253`) ne prouve pas que cette scène est visible durant la partie.
  - `src/main.ts` instancie `ThreeIsoRenderer` avant le lancement, puis `startGame()` remplace le contenu de `#app`; cette scène est donc détachée. La boucle rAF continue inutilement.
  - Le renderer gameplay de référence reste `WorldRenderer3D` dans `src/presentation/renderer3d.ts`: il utilise `THREE.WebGLRenderer`, une caméra et des meshes 3D, et reçoit l'état vivant de la partie. Une caméra isométrique ne le rend pas 2.5D. La description « Canvas 2.5D » de l'ancien handoff Trae est inexacte.
  - Refus de remplacer immédiatement le renderer gameplay par le `ThreeIsoRenderer` statique: ce dernier n'a pas les acteurs, le déplacement ni le cycle de rendu alimenté par `WorldState`. N'autoriser qu'une seule scène WebGL active.
  - Le pont `mapToWorld3d.ts` et ses tests restent un résultat vérifié séparément, mais ne sont pas reconnus comme une intégration gameplay. Le test doublon de la session Trae A peut être supprimé selon sa confirmation.
- **Impact sur docs/suivi/ROADMAP_TASKS.md :** le gate données J3D-2 est validé (10 tests ciblés, 442 tests globaux et build par Codex), mais J3D-2 n'est pas fonctionnellement close. Nouveau sous-jalon J3D-2R attribué à Trae session A, limité à `src/main.ts` et `tests/j3d_2_map_to_world3d.test.ts`: retirer le renderer détaché et le test doublon; le renderer gameplay `WorldRenderer3D` reste seul actif. Critères: lancement nouvelle partie et reprise conservent le renderer 3D de gameplay, aucun rAF détaché, test/build verts, smoke test navigateur après handoff. J3D-3 (billboards/QA) reste verrouillée. Antigravity est chargé d'une revue de conception P-PERSO en lecture seule, sans écrire de code.
- **Signé :** Codex — Manager & Architecte en chef.
