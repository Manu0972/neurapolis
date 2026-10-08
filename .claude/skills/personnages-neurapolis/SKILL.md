---
name: personnages-neurapolis
description: Fabriquer, varier et valider les personnages 3D de NEURAPOLIS dans le style voulu par l'utilisateur (« un peu dessin, un peu 3D », anatomie juste mais simplifiée). À charger avant tout travail sur l'apparence, les corps, les visages, les coiffures, les vêtements ou les animations des personnages.
---

# Personnages NEURAPOLIS

## À lire d'abord
- `art/references/ETUDE-STYLE-ANIME-3D.md` : l'étude (techniques des studios, recherche, anatomie, ressources libres) et surtout **§4, les exigences de l'utilisateur**, qui priment sur tout.
- `art/references/ANALYSE-PLANCHES-2026-10-08.md` et les images de `art/` : toutes les planches comptent au même titre.

## Règles non négociables
1. Style hybride dessin / 3D : ombres en aplats nettes et colorées, trait de contour, visages dessinés et expressifs ; **jamais** de rendu réaliste brut (MakeHuman tel quel a été refusé).
2. Corps **affirmés** et **très variés**, selon des fréquences réalistes ; nombreuses peaux, nombreuses coiffures ; vêtements du quotidien, pas d'uniformes d'école anime ni de fantasy.
3. Moins de 18 ans : corps de leur âge, toujours habillés, aucun trait adulte ; la silhouette adulte n'apparaît qu'à 18 ans (`visibleAppearance`). Famille du joueur : cohérente avec lui, sans handicap.
4. **Planche de validation avant toute intégration** : face, profil, dos, gros plan du visage, au repos et en mouvement ; envoyée à l'utilisateur ; on n'intègre qu'après son accord.
5. Toute ressource externe : licence vérifiée (CC0, CC-BY avec crédit, MIT), notée dans `art/sources/LICENCES.md`.

## Outils
- **Blender 4.2 + MPFB (MakeHuman)** : anatomie variée, vêtements et coiffures CC0. Installation et scripts : `tools/characters/README.md`.
- **Modèles VRoid CC0** (visages et cheveux anime, MToon) : https://opengameart.org/content/vroid-studio-cc0-models. À télécharger dans `public/_vroid_tmp/` (ignoré par git) pour les essais.
- **Labo de rendu** (navigateur, `npx vite` puis) :
  - `/tools/rig-lab/vrm.html?files=a.vrm,b.vrm` (`&zoom=1` pour les visages) : modèles VRM avec MToon ;
  - `/tools/rig-lab/index.html` : squelette et 35 animations libres (`public/assets/anim/neurapolis_anims.glb`).
- Captures sans écran : Playwright + Chromium (`--use-gl=angle --use-angle=swiftshader`).
- **Logique humaine du jeu** : `src/core/human_variety.ts` (croissance, famille, habitants, silhouette adulte).

## Méthode
1. Partir des exigences (§4 de l'étude) et des planches ; écrire en une phrase ce que la planche doit prouver.
2. Fabriquer (Blender/MPFB, VRoid, shader), puis rendre la planche de validation dans le labo.
3. Se relire comme l'utilisateur : corps assez affirmés ? assez de variété (peaux, coiffures, morphologies) ? vêtements du quotidien ? style dessin + 3D ? mineurs habillés et à leur âge ?
4. Envoyer la planche, attendre l'accord, puis seulement intégrer dans le jeu (avec tests et vérification en jeu).
