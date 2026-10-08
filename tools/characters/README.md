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

## Usine hybride « dessinée » (en service)

Corps MakeHuman affirmés + tête anime VRoid (CC0) greffée + coiffures procédurales, rendu en
aplats avec trait (Eevee). Têtes VRoid à mettre dans `public/_vroid_tmp/` (ignoré par git ; ou
variable `VROID_DIR`) ; extension VRM pour Blender (MIT/GPL, outil seulement) installée et activée.

- `toonlib.py` : `person(...)` fabrique un personnage (macros MakeHuman, réglages fins, vêtements,
  couleurs, tête VRoid, iris, pose) ; `toon`, `outline`, `soften_normals`, `setup_scene`.
- `graft.py` : greffe de la tête (géométrie figée, échelle sur la vraie hauteur de tête, crâne coupé
  à sa base, iris recolorés).
- `hair.py` : `locks`, `locks(butterfly=True)`, `box_braids`, `cornrows`, `afro`, sur l'ellipsoïde
  de la tête (`Head`).
- `planche.py` : planche de validation (10 adultes, face, dos, gros plans).
  `xvfb-run -a -s "-screen 0 1280x1024x24" blender -b --python planche.py -- planche.png`

Pièges rencontrés (ne pas les réintroduire) :
- mesurer la tête MakeHuman avec les morphs (shape keys), sinon échelle négative et tête renversée ;
- figer la tête VRoid telle qu'affichée (`new_from_object` sur l'objet évalué) au lieu de retirer
  le modificateur d'armature ;
- déplacer le rig, pas le corps (MPFB parente le corps au rig) ; traiter `rig.children_recursive` ;
- soleil sans ombres portées : la coque du trait projette sinon des zébrures sur la peau ;
- masquer la peau sous les vêtements (`ClothesService.update_delete_group`) ;
- réactiver MPFB et VRM en tête de script (`addon_utils.enable`) ; matériau du trait créé à la
  demande (MPFB purge les matériaux orphelins).

Rendus de validation : `art/rendus/`.
