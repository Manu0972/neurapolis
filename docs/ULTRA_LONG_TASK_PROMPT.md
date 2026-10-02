# PROMPT DE TÂCHE ULTRA-LONGUE ET COMPLEXE : NEURAPOLIS

Ce document définit la feuille de route et le prompt de supervision d'ingénierie continue pour faire progresser **NEURAPOLIS** de son état de prototype vertical jusqu'à un jeu systémique complet, profond et multi-jouable.

---

## 🎯 OBJECTIF GLOBAL ET VISION DU JEU

NEURAPOLIS est un jeu de simulation de vie systémique à Val-Ferrand (Cité des Roses) débutant à l'âge de 12 ans (septembre 2020) et s'étendant sur plusieurs années. Le joueur incarne Camille et interagit avec un quartier vivant, des PNJ dotés de routines et de mémoires, des rivaux commerciaux réactifs, et un Conseil de Fantômes Intellectuels (Smith, Marx, Keynes, Schumpeter, Ostrom, etc.).

---

## 🏗️ INVARIANTS ET ARCHITECTURE TECH
1. **Couches strictes** : `core` (types, temps, PRNG) ← `simulation` (moteur pur, déterministe) ← `presentation` (Canvas 2D/2.5D, DOM, 3D Sandbox). La simulation ne dépend JAMAIS du DOM ou du Canvas.
2. **Déterminisme absolu** : Toute aléatoire passe par `world.rng` (`mulberry32`). Aucune utilisation de `Math.random()` ou `Date.now()` dans la simulation.
3. **Persistance & Migrations** : Toute évolution du schéma `WorldState` exige une incrémentation de `SAVE_VERSION`, une migration rétrocompatible vN→vN+1, et des tests aller-retour dans `tests/saves.test.ts`.

---

## 🚀 ROADMAP DES PHASES DE DÉVELOPPEMENT CONTINU

### Phase 1 : Système de Tempéraments & Humeurs Dynamiques
- **Axe 1** : Attribuer un `CharacterTemperament` fondamental (`pragmatique`, `militant`, `audacieux`, `analytique`, `pessimiste`, `empathique`) à chaque Fantôme et PNJ.
- **Axe 2** : Calculer l'humeur dynamique (`DynamicMood` : `serein`, `enthousiaste`, `tendu`, `inspire`, `indigne`) via superposition probabiliste combinant tempérament, météo, santé financière, part de marché et tirage PRNG (`src/simulation/mood.ts`).
- **Axe 3** : Refléter l'humeur dans les interfaces de dialogue et du Conseil (badging d'humeur et répliques contextuelles).

### Phase 2 : Rendu Graphique Amélioré & Intégration 3D
- **Axe 1 (2.5D Canvas)** : Améliorer le renderer Canvas 2D/2.5D principal (`src/presentation/renderer.ts`) avec relief de tuiles, occlusions, réflexions de lumière et parallaxe de profondeur.
- **Axe 2 (Bac à Sable 3D)** : Maintenir le prototype 3D autonome (`3d-sandbox.html` & `src/presentation/sandbox3d.ts`) pour intégrer ultérieurement des kits 3D (Three.js/WebGL) sans perturber le moteur Canvas.

### Phase 3 : Concurrence Commerciale & Système de Rivaux
- **Axe 1** : Moteur de parts de marché dynamique (`src/simulation/rival.ts`) opposant le Stand des Roses aux rivaux du quartier (`drive_hyper`, `distributeur_college`).
- **Axe 2** : Contre-stratégies jouables (`circuit_court`, `degustation`, `fidelite_quartier`, `formule_recre`) avec durée de validité réelle et coût en temps/argent.

### Phase 4 : Progression Narrative & Campagne Multi-Années
- **Axe 1** : Déroulement des chapitres de la campagne de 12 ans à 16 ans+ (`src/simulation/campaign.ts` & `src/data/campaign.ts`).
- **Axe 2** : Anniversaires déterministes au 1er septembre, vieillissement du personnage et déclenchement d'arcs narratifs complexes (Friche Taret, TaretCoop, coopérative, concurrence).

---

## 📋 CONSIGNES DE VALIDATION ET QUALITÉ (PRE-COMMIT)
- **Tests unitaires** : `npm run test` (Vitest) doit passer à 100% (200+ tests verts requis).
- **TypeScript & Build** : `npm run build` (`tsc --noEmit && vite build`) doit s'exécuter sans aucune erreur.
- **Coordination multi-agents** : Consulter et réserver les chemins stricts dans `.zcode/coordination/BOARD.md` avant toute modification.
