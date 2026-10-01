# DIRECTIVE VISUELLE — URGENTE (à lire avant toute nouvelle étape de rendu)

> Écrite le 29/09/2026 après constat sur le rendu réel du prototype vertical.
> **Le rendu actuel ne correspond pas à la barre visuelle attendue.** Ce document
> fait foi jusqu'à ce que la direction artistique soit atteinte.

## 1. Constat (fait, vérifié dans le code)

Le renderer du jeu (`src/presentation/renderer.ts`) dessinait :
- les PNJ et le joueur comme des **cercles colorés** (« pastilles ») ;
- les tuiles comme des **carrés plats** ;
- sur un **fond néon sombre** (`#0a0e17` + accents néon, cf. `tokens.ts`).

C'est un **prototype technique**, pas un monde 2D illustré. Inacceptable en l'état.

## 2. Ce qui vient d'être corrigé

- `src/presentation/sprite.ts` : personnage **pixel-art chibi 16×23**, dessiné
  **frame par frame** (idle respiration + marche 4 poses), palette chaude (contour
  brun `#2a1a14`, peau pêche `#ffc496`, corail `#f48c5d`), ombre portée.
- `src/presentation/renderer.ts` : les pastilles sont remplacées par ces personnages,
  teintés par la couleur de chaque PNJ (cheveux variés → pas de clones).
- Build + 180 tests : **verts** (aucune régression).

## 3. La barre visuelle cible

Tout est défini dans **`art/DIRECTION-ARTISTIQUE.md`** (à lire). En une phrase :
**pixel art cozy, chaud (~1800K), chibi, frame par frame, lumière qui relie tout,
profondeur en couches, vie partout.** Référence de finition : 1998 / Eastward ;
référence de vibe : Minami Lane / Stardew (ce qui viralise).

## 4. Ce qui reste à faire (dans cet ordre)

1. **Palette chaude globale** : remplacer les tokens néon sombre (`tokens.ts` +
   `style.css`) par la palette cozy (crème, sauge, terracotta, ciel ambré). Le jeu
   ne doit plus être « sombre + néon ».
2. **Tuiles & lieux illustrés** : herbe/pavé/terre texturés, entrées de lieux dessinées
   (maison, collège, épicerie, parc, friche) au lieu de carrés.
3. **Marche liée au déplacement** : brancher la pose « marche » sur le mouvement réel
   des PNJ (déjà calculé par `npcPosition`) au lieu de l'idle fixe.
4. **Variations de silhouettes** : morphologies (grand/petit/âgé/jeune), pas seulement
   des couleurs.
5. **Écrans UI dans la même DA** : les avatars SVG existants sont corrects pour les
   panneaux, mais l'ensemble (menu, Conseil, HUD) doit partager la palette chaude.
6. **Atmosphère** : jour/soir/nuit, fenêtres chaudes, halos, vignette.

**Règle** : on ne passe pas à l'étape suivante tant que l'écran n'est pas beau.
Qualité perçue > échelle > systèmes.

## 5. À corriger en parallèle (cohérence de simulation, déjà signalé)

La revue de cohérence du run a trouvé des **déclencheurs de fantômes inatteignables**
(flags jamais incrémentés : incidents, injustices, procédures, règles échouées,
distinctions, sessionsReussies, etc. — 15+ fantômes ne peuvent pas apparaître en jeu).
À traiter côté simulation, indépendamment du visuel.
