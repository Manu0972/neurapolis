# Usine à personnages (Blender + MakeHuman/MPFB)

Fabrique les personnages du jeu à partir de MakeHuman : corps anatomiques réglables (âge, genre,
taille, corpulence, musculature, origines, traits de silhouette), peaux, yeux, sourcils, cheveux,
vêtements. Les personnages produits sont libres (CC0) ; MPFB (GPL) n'est qu'un outil, il n'est pas
embarqué dans le jeu.

## Installation (une fois, hors du dépôt)

1. Blender 4.2 LTS (Linux : `blender-4.2.x-linux-x64.tar.xz` sur download.blender.org).
2. Extension MPFB 2.0.17 : https://extensions.blender.org/add-ons/mpfb/ puis
   `blender -b --command extension install-file -r user_default -e add-on-mpfb-v2.0.17.zip`.
3. Assets MakeHuman (CC0) : `makehuman_system_assets_cc0.zip`
   (https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/) décompressé dans le
   dossier « user data » de MPFB (`~/.config/blender/4.2/extensions/.user/user_default/mpfb/data`),
   plus les packs voulus avec `mh_packs.sh hair01 shirts01 …`.

## Scripts

- `render_test.py` : trois personnages habillés, rendu Cycles (`STYLE=facettes` pour le low-poly,
  `PORTRAIT=1` pour les visages). `blender -b --python render_test.py -- sortie.png`.
- `mh_packs.sh` : télécharge des packs d'assets MakeHuman (CC0).

Rendus de validation : `art/rendus/`.
