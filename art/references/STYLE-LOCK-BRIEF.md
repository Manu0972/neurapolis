# Verrouillage du style NEURAPOLIS — brief (2026-10-08)

> Réponse au point « avant de coder quoi que ce soit en 3D, verrouiller le style ». Ce brief rassemble
> ce que l'utilisateur a **dit ou montré** (citations et images du dépôt).
>
> **VERROUILLÉ le 2026-10-08 par l'utilisateur** — version machine : `art/references/style_lock_neurapolis.json`.
> - **Style** : 3D dessin/anime (cel-shading, aplats, trait, têtes anime, corps variés), critère « harmonieux ».
> - **Ambiance** : cozy chaud + coloré vif + pastel doux, mêlés selon les lieux ; un quartier (ou une ville) plus sombre plus tard.
> - **Qualité** : fusion « PC indé » + « AAA stylisé » : un modèle détaillé (gros plans, création de personnage) décliné en niveaux de détail légers pour la ville et la foule.
>
> Les documents pixel art 2D (`art/DIRECTION-ARTISTIQUE.md`, `art/claude-assets-v1/`) et la piste low-poly à textures pixel (V1.1 §11.2) sont **remplacés** pour les personnages et la 3D.

## 0. Constat : trois directions contradictoires coexistent dans le dépôt

| Date | Document | Direction |
|---|---|---|
| 01–02/10 | `art/DIRECTION-ARTISTIQUE.md`, `art/claude-assets-v1/GUIDE-DA.md` | **Pixel art 2D cozy** (chibi 16×24, palette 32 couleurs, lumière ~1800 K) |
| 07/10 | `docs/conception/V1.1.md` §11.2, `art/references/ANALYSE-PLANCHES-2026-10-08.md` | **3D low-poly + textures peintes en pixels** (« Convenience Kid ») |
| 08/10 | `art/references/ETUDE-STYLE-ANIME-3D.md` §4, `art/rendus/2026-10-08/6-hybride-harmonieux.jpg` | **3D stylisée « un peu dessin, un peu 3D »**, cel-shading, têtes anime, critère « harmonieux » |

Le jeu actuel est en 3D (Three.js, `src/presentation/city3d/`). Le kit pixel 2D date d'avant ce choix.

## 1. Images de référence (dans le dépôt)

1. `art/02e96ecf9acd2645d3cd056f35fa1e79.jpg` — « Convenience Kid » : fiche de production 3D stylisée (face/profil/dos, ~7 850 triangles). Cible de proportions pour l'enfant de 12 ans.
2. `art/eda022ced8f3ebdecd6ec644e10f0987.jpg` — fiche personnage complète (5 vues, 12 expressions, poses, mains) : le modèle de **cohérence du visage**.
3. `art/references/cible-style-lowpoly-texture-pixel.webp` — personnage low-poly à textures pixel (cible notée en V1.1 §11.2).
4. `art/5f78d123e30df1758e5ebf15399d96e5.jpg` — square low-poly 3D : le même style appliqué à la **ville** (formes rondes, couleurs chaudes, éclairage doux).
5. `art/d60a30da01d9b9ead9a3cd8fb1b3040e.jpg` + `art/téléchargé.png` — planches streetwear : la **garde-robe**.
6. Dernier essai validable : `art/rendus/2026-10-08/6-hybride-harmonieux.jpg` (cel-shading, têtes anime, coiffures variées).

Jeux cités par l'utilisateur : **Big Ambitions** (interface de création de personnage, vie quotidienne en ville). Études DA : Minami Lane, Eastward, Spiritfarer (chaleur, vie partout).

## 2. Le style en mots (paroles de l'utilisateur)

- « **Un peu du dessin, un peu de la 3D** » ; anatomie réelle **légèrement simplifiée**, « comme les dessins ».
- « **Harmonieux**, c'est le mot qu'il faut suivre surtout ».
- Corps **affirmés** et très variés ; **très nombreuses** peaux et coiffures (locks, locks papillon, tresses, afro, buzz cut).
- Vêtements **du quotidien** ; jamais d'uniformes d'école anime ni de fantasy.
- **Jamais** de rendu réaliste brut (MakeHuman tel quel : « plus jamais »).
- Ambiance (décidée) : **cozy chaud** (lumière chaude, ombres froides, contour brun chaud, jamais de noir pur) + **coloré vif** + **pastel doux**, mêlés selon les lieux ; **plus sombre** réservé à un quartier ou une ville ajoutés plus tard.

## 3. Niveau de qualité — décidé : fusion « PC indé » + « AAA stylisé »

Contrainte technique : jeu web/Electron (Three.js), ville pleine de PNJ simultanés.

| Niveau | Budget | Compatible avec une foule de PNJ ? |
|---|---|---|
| Mobile indé | ≤ 5 k triangles | oui, sans effort ; visages et coiffures pauvres |
| **PC indé** (recommandé) | joueur ~15–20 k, PNJ proches ~8 k, PNJ lointains ~2–3 k (niveaux de détail) | oui, avec niveaux de détail et instanciation |
| AAA stylisé (Genshin) | 50 k+ | non pour une foule dans un navigateur ; seulement en gros plan (création de personnage) |

**Décision** : un seul modèle source par personnage, en chaîne de niveaux de détail —
LOD0 ~50 k (écran de création, gros plans, cinématiques), LOD1 ~18 k (joueur en jeu),
LOD2 ~8 k (PNJ proches), LOD3 ~2,5 k (PNJ lointains, foule). Même dessin à tous les niveaux.

## 4. Règles fixes quel que soit le choix

- Mineurs : corps de leur âge, toujours habillés, aucun trait adulte avant 18 ans.
- Famille du joueur cohérente avec lui, sans handicap.
- Ressources externes : licence vérifiée (CC0, CC-BY, MIT, Apache 2.0) ; Hunyuan3D exclu (UE).
- Planche de validation (face, profil, dos, visage) **avant** toute intégration.
