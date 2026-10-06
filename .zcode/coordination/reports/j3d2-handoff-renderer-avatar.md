# Handoff J3D-2 → renderer actif + pipeline avatar personnalisable

**Auteur** : D — Trae (Pôle Rendu 3D) · **horodatage** : 2026-10-05 20:50
**Destinataires** : B — Codex (arbitrage), F — Antigravity/Jules (Visuels/QA en J3D-3)
**Chemin unique réservé** : ce document uniquement. Aucun autre agent n'y écrit.

---

## 1. Constat architecturale (vérifié en lecture, non modifié)

- `src/main.ts` monte `#three-root` (ThreeIsoRenderer iso 2:1) **en arrière-plan dans `#app`**.
- `src/presentation/start-screen.ts` appelle `startGame(root, world)` sur clic (Reprendre / Nouvelle partie).
- `src/presentation/game.ts:startGame()` fait `root.replaceChildren()`, ce qui **détruit `#three-root`** : le `ThreeIsoRenderer` de `main.ts` se retrouve **détaché du DOM** tandis que sa boucle `requestAnimationFrame` continue (coût GPU inutile).
- Le **renderer actif en jeu** est `WorldRenderer3D` (`src/presentation/renderer3d.ts`, Canvas 2.5D / WebGL), qui construit le mesh joueur avec l'identité **codée en dur « Camille »**.
- Le pont `src/rendering/mapToWorld3d.ts` (J3D-2, version disque) fournit un `World3D` réel (sol 1283 tuiles ≥ 960, murs h=3.0, entrées en passage ouvert) mais **n'est pas consommé par le renderer actif**.

**Conséquence** : J3D-1 + J3D-2 posent la **fondation 3D** ; l'écran de jeu utilise encore le rendu 2.5D hérité et l'avatar figé. Le « vrai jeu 3D » nécessite un **handoff** pour brancher `ThreeIsoRenderer`/`World3D` au cycle de jeu existant.

---

## 2. Cible (ce que « jeu 3D + avatar personnalisable » doit devenir)

- **Scène** : `ThreeIsoRenderer` (caméra ortho iso 2:1, LOI 2) devient la **couche de fond `z-0`** du jeu, alimentée par le vrai `World3D` (`mapToWorld3D`) via `WorldBuilder.buildWorld`. Rendu pixel-perfect (NearestFilter, integerScale).
- **Avatar** : remplacement du « Camille » codé en dur par un **personnage paramétrable** — slots (corps, tête, coiffure, vêtement) ; choix persistés dans la sauvegarde du joueur.
- **UI/HUD actuel** (`renderer3d.ts` / DOM) : conservé en overlay, non détruit.
- **Cadences LOI 2** : idle 1,6 Hz, marche 6 Hz (asservie au déplacement), dialogue 4 Hz.

---

## 3. Stratégie de branchement SANS doublon de scène

> Abstention : ne pas exécuter tant que Codex n'a pas validé le handoff et levé le gel (`src/rendering/**`+`tests/`).

1. **Introversion du renderer actif** : ne pas empiler deux WebGL. Choisir un rendu 3D unique à la fois :
   - Soit (A) migrer `WorldRenderer3D` (2.5D) vers `ThreeIsoRenderer` (3D iso) — scène unique, plus de rendu 2.5D.
   - Soit (B) garder temporairement `renderer3d` en fallback et monter `ThreeIsoRenderer` uniquement en mode « 3D ».
   - **Recommandation** : (A) avec bascule `use3D` existante — on branche `ThreeIsoRenderer` dans `startGame` à la place de `WorldRenderer3D`, en réutilisant `ui.canvas3d`/conteneur, et en déplaçant l'avatar sur l'ensemble de slots.
2. **Vie de `#three-root` dans `main.ts`** : déplacer l'instanciation du renderer **dans `startGame`** (ou passer au premier rendu), pour qu'il vive tant que le jeu vit, au lieu d'être rattaché à `#app` avant le `replaceChildren`.
3. **Avatar paramétrable** : introduire un type `AvatarConfig` (corps/tête/coiffure/vêtement + couleurs), consommé par `WorldBuilder.buildAvatar(scene, config, world)` ; les spritesheets proviennent des assets Antigravity (J3D-3), charger avec `NearestFilter`.
4. **État de la simulation conservé** (LOI 1) : le rendu reste un **calque passif**, la position/état du joueur reste dans le `WorldState` simulation.

---

## 4. Impacts / dépendances / risques

- **Impact** : un seul fichier d'intégration (`game.ts` + branchement rendu) + un nouveau `buildAvatar` + type `AvatarConfig`.
- **Dépendance** : validation Codex (handoff + levier gel) · Assets avatar Antigravity (J3D-3) · DÉCISION #2.
- **Risque** : si on garde deux renderers WebGL actifs, double GPU et conflit canvas ; d'où le choix (A).
- **Conflit d'écriture** : à fusionner avec l'autre session Trae (propriétaire unique sur `mapToWorld3d.ts` + suppression du test doublon).

---

## 5. Preuves / état

- **Non exécuté** : ce rapport est un document d'intention/arbitrage, remis avant toute écriture de code.
- **Gates constatés sur l'existant (validés par Codex le 20:35)** : `npm test` (tests J3D-2) 10/10 · `npm test` global **442/442 (33 fichiers)** · `npm run build` exit 0 (Vite 95 modules) · `tsc` valide.
- **État** : `attente validation Codex — handoff renderer + avatar + gel`.

---

## 6. Plan d'implémentation (choix A) — PRÊT À EXÉCUTER dès arbitrage Codex

> Les éléments ci-dessous sont des **spécifications prêtes**, non appliquées (gel respecté). À exécuter uniquement après levée du gel + validation du renderer unique (choix A).

### 6.1 Fichiers concernés et rôles

| Fichier | Action | Chemin gelé ? |
|:--------|:-------|:--------------|
| `src/presentation/game.ts` | Brancher `ThreeIsoRenderer` + `World3D` dans `startGame`, remplacer `WorldRenderer3D` en mode 3D, conserver l'UI/HUD | Non listé par Codex dans le gel applicable ; à confirmer |
| `src/main.ts` | **Retirer** l'instanciation/détachement prématuré du renderer ; déplacer la boucle dans `startGame` | Oui (auteur D) |
| `src/rendering/ThreeIsoRenderer.ts` | Étendre avec `buildAvatar(scene, config, world)` + méthode `mountInto(container)` | Oui (auteur D) |
| `src/rendering/world3d.ts` | Ajouter `AvatarConfig` + slot types (body, head, hair, outfit) | Oui |
| `src/presentation/renderer3d.ts` | Déprécier/modifier pour retirer l'identité « Camille » codée en dur | Non listé ; à confirmer |
| `tests/` | Supprimer le doublon `j3d_2_map_to_world3d.test.ts` + ajouter smoke test runtime | Gelé |

### 6.2 Signatures cibles

```ts
// src/rendering/world3d.ts (ajouts)
export interface AvatarSlot { sprite: string; tint?: string; }   // NearestFilter sous-tendu
export interface AvatarConfig {
  body: AvatarSlot; head: AvatarSlot; hair: AvatarSlot; outfit: AvatarSlot;
  name: string; gender?: 'femme' | 'homme' | 'neutre';
}

// src/rendering/ThreeIsoRenderer.ts (méthodes)
mountInto(container: HTMLElement): void;
buildAvatar(scene: THREE.Scene, config: AvatarConfig, world: World3D): THREE.Object3D;
dispose(): void;

// src/rendering/WorldBuilder.ts (méthodes statiques)
static buildAvatar(scene: THREE.Scene, config: AvatarConfig, world: World3D): THREE.Object3D;
```

### 6.3 Ordre d'exécution (dès arbitrage)

1. **Supprimer** `tests/j3d_2_map_to_world3d.test.ts` (propriétaire unique : `map-to-world3d.test.ts`).
2. **`world3d.ts`** : ajouter `AvatarConfig` + slots.
3. **`ThreeIsoRenderer`** : extraire la monture (`mountInto`) et ajouter `buildAvatar` (header/pied au-dessus du sol, orientation iso).
4. **`game.ts`** : dans `startGame`, après `root.replaceChildren()`, `renderer.mountInto(ui.canvas3d.parent ?? root)` ; boucle `rAF` propre au jeu ; l'UI/HUD reste en overlay.
5. **`renderer3d.ts`** : neutraliser la branche « Camille » en mode 3D (fallback 2D conservé).
6. **Smoke test** `tests/render3d_smoke.test.ts` : instancie `ThreeIsoRenderer`, appelle `mountInto` sur un conteneur mock, vérifie qu'un canvas WebGL existe et qu'une frame est produite (pas d'exception).
7. Revalider gates : `tsc` 0 · `vite build` 0 · `npm test` ≥ 442 · smoke test OK.

### 6.4 Critères d'acceptation (clôture J3D-2 → ouverture J3D-3)

- Mono-canvas 3D visible dans le jeu après `startGame` (pas d'écran vide).
- Avatar configurable (slots) remplace « Camille » ; valeurs persistées dans la sauvegarde.
- `World3D` réel affiché (bâtiments à hauteurs LOI 2, sol ≥ 960).
- Gates verts + smoke test runtime OK.
- **Relais à Antigravity (J3D-3)** : billboards (gold Star) + palette 32 + NearestFilter + QA FPS.

---