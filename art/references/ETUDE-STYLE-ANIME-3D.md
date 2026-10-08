# Étude : personnages « anime 3D » (entre dessin et 3D)

> Recherche du 2026-10-08 (Claude Code, session cloud). Demande de l'utilisateur : des personnages
> détaillés, fidèles à la vraie anatomie mais simplifiés comme ses planches dessinées ; « un peu
> dessin, un peu 3D », jamais le rendu réaliste brut de MakeHuman (jugé très laid).

## 1. Ce que disent les études et les studios

### Guilty Gear Xrd — Arc System Works (GDC 2015, J. C. Motomura)
- Le cel-shading est difficile parce qu'il est **binaire** : une surface est éclairée ou dans l'ombre, sans demi-teinte. Un dessinateur choisit la meilleure répartition des ombres ; un shader applique un seuil, et le moindre défaut de surface se voit.
- La solution : **contrôler la lumière à la main**, en stockant des données sur les sommets (normales retouchées, couleurs de sommet, UV) plutôt que dans des textures, pour rester net même en très gros plan.
- Les **normales sont éditées** : on oriente les normales du visage pour que les ombres tombent comme dans un dessin (zones groupées sur chaque joue, le menton, sous les yeux), pas comme sur un vrai crâne.
- Les **contours** viennent de la coque inversée (« inverted hull »), avec une épaisseur peinte par sommet ; les lignes intérieures sont dessinées dans la texture.
- Sources : [présentation GDC](https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The), [annonce Arc System Works](https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/), [compte rendu BlenderNation](https://www.blendernation.com/2015/07/26/junya-c-motomura-behind-the-scenes-of-guilty-gear-xrd/), [contrôle des lignes Guilty Gear (ASW Academy)](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng).

### Genshin Impact — analyses publiques (shaders reconstitués par la communauté)
- **Rampe d'ombre** : la couleur de l'ombre vient d'un dégradé peint (chaude, jamais grise), avec une version nuit.
- **Ombre du visage par carte SDF** : une texture dit, pour chaque angle de lumière, quelle partie du visage est dans l'ombre ; l'ombre du nez et des joues reste « dessinée » quel que soit l'éclairage.
- **Pas d'ombres portées sur soi** (un bras ne fait pas de tache sur le torse) ; lumière de contour d'épaisseur constante, plus proche d'un trait que d'un vrai reflet.
- Sources : [shaders URP Genshin](https://github.com/NoiRC256/URPSimpleGenshinShaders), [HoyoToon](https://github.com/Melioli/HoyoToon/wiki/Using-the-Genshin-Shader), [Blender NPR, recréation du shader](https://bjayers.artstation.com/blog/category/5), [shader Godot inspiré de Genshin](https://godotshaders.com/shader/toon-shader-inspired-of-genshin-impact/).

### Contours par coque inversée
- Le modèle est dessiné deux fois ; la seconde fois gonflé le long de ses normales, faces arrière seulement. Méthode utilisée depuis Jet Set Radio (2000).
- Il faut des **normales lissées** stockées à part (sinon le trait se casse sur les arêtes vives) et une **épaisseur par sommet** ; corriger la perspective (épaisseur en espace écran).
- Sources : [URP Toon Shader, contours](https://github.com/Delt06/urp-toon-shader/wiki/Outline), [coque inversée améliorée (Godot)](https://godotshaders.com/shader/improved-inverted-hull-simplest-outline-shader-improved/).

### Normales stylisées du visage
- Transférer sur le visage les normales d'une forme simple (sphère ou volume sculpté) : l'ombre devient celle d'un dessin, stable pendant les expressions.
- Sources : [étude sur la stylisation de l'éclairage (Université polytechnique de Lviv)](https://ena.lpnu.ua/handle/ntb/100530), [discussion Blender NPR](https://lists.blender.org/pipermail/bf-blender-npr/2015-April/000092.html).

### Recherche académique (rendu non photoréaliste)
- Gooch et al., *A Non-Photorealistic Lighting Model For Automatic Technical Illustration* (SIGGRAPH 1998) : ombres « froid → chaud » dans les demi-teintes, pour garder lisibles les contours et les reflets. [PDF](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/gooch98.pdf)
- Praun, Hoppe, Webb, Finkelstein, *Real-Time Hatching* (SIGGRAPH 2001) : hachures cohérentes en temps réel (« tonal art maps »). [Projet](https://gfx.cs.princeton.edu/proj/hatching)
- Sayeed & Howard, *State of the Art NPR Techniques* (2006) ; Isenberg (2008) ; Anjyo, *The Toon Shader for Anime and Beyond* (IEICE 2024). [Sayeed](https://www.cs.princeton.edu/courses/archive/spr15/cos426/papers/Sayeed06.pdf), [Isenberg](https://tobias.isenberg.cc/personal/papers/Isenberg_2008_SIM.pdf), [OLM / IEICE](https://olm.co.jp/rd/journal-of-ieice-202402/?lang=en)

### MToon (format VRM) et three-vrm
- Le shader anime standard du format VRM : « Shading Toony » (netteté de la frontière d'ombre), « Shading Shift » (taille de la zone d'ombre), couleur d'ombre, contour de lumière (Fresnel), contour en coque inversée avec épaisseur en pixels écran. three-vrm (Pixiv, licence MIT) l'affiche dans Three.js.
- Sources : [référence MToon](https://wiki.virtualcast.jp/wiki/en/unity/shader/mtoonreference), [VRM 1.0 MToon](https://vrm.dev/en/vrm1/mtoon), [three-vrm](https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.5.5/README.md).

## 2. Anatomie et proportions

- **Hauteur en têtes** (guides de dessin manga, valeurs indicatives) : adultes 6,5 à 8 têtes (hommes 7–8, femmes 6,5–7,5), adolescents 6 à 7, enfants 4 à 5 ; les yeux sont plus grands chez l'enfant. L'âge se lit surtout à la taille de la tête et des yeux, pas seulement au nombre de têtes. [Proportions anime](https://easydrawingguides.com/how-to-draw-anime-body-proportions/)
- **Pour un 12 ans** dans un style semi-réaliste : environ 6 têtes, visage plus rond, épaules étroites, membres fins, pas de formes adultes.
- **Morphotypes** : Sheldon (1940, ectomorphe / mésomorphe / endomorphe) ; Douty (1968). Chez les femmes, le rapport taille/hanches distingue poire et sablier (≈ 0,75), rectangle (0,80) et pomme (0,82) (Thoma et al., 2012). En scan 3D, le **rectangle** est le plus fréquent (≈ 52 %), puis la « cuillère » (≈ 40 %) ; le sablier est rare (≈ 6 %). Les catégories bougent beaucoup selon l'endroit de la mesure. [Thoma 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3466911), [morphotypes 3D, 2020](https://www.emerald.com/insight/content/doi/10.1108/IJCST-06-2020-0089/full/html), [Loughborough 2021](https://www.lboro.ac.uk/media-centre/press-releases/2021/may/you-might-not-be-the-body-shape-you-think/)
- **Conséquence pour le jeu** : tirer les habitants selon ces fréquences réelles (beaucoup de silhouettes droites, peu de sabliers parfaits), avec toute la palette des planches de l'utilisateur (« zodiaque » : frêle, colosse, athlète, élancé, âgé, tout en courbes, musclée…).

## 3. Ressources libres trouvées

| Ressource | Ce qu'elle apporte | Licence |
|---|---|---|
| Modèles VRoid Studio (10 : 2 corps de base, 2 coiffures, 6 personnages), [OpenGameArt](https://opengameart.org/content/vroid-studio-cc0-models) | Visages anime (grands yeux dessinés, nez et bouche simplifiés, expressions), mèches de cheveux anime, tenues, shader MToon | CC0 |
| MakeHuman / MPFB (Blender) et ses 47 packs | Anatomie juste et variée (âge, poids, muscles, origines, 8 traits), vêtements, coiffures, peaux, 102 expressions | outil GPL ; modèles et packs CC0, certains CC-BY |
| Universal Animation Library 1 et 2 (Quaternius) | 35 animations retenues sur un squelette humain standard | CC0 |
| three-vrm (Pixiv) | Affichage VRM et MToon dans Three.js | MIT |

## 4. Exigences de l'utilisateur (2026-10-08) — elles priment sur l'étude

- **Toutes les références comptent au même titre** : la femme low-poly en chemise blanche, les planches d'anatomie (Elle, homme en triangle inversé, les douze corps « zodiaque », les silhouettes en courbes, le torse en topologie), la fiche de Nate (vues, 12 expressions, poses, mains), le Convenience Kid, Big Ambitions, les planches streetwear, les sprites pixel des fantômes. Genshin et VRoid ne sont qu'**une** source technique, pas le modèle à copier.
- **Vêtements** : jamais d'uniformes d'école anime ni de tenues fantasy. Vêtements du quotidien : t-shirts, sweats, hoodies, jeans larges, cargos, vestes, chemises, chaussures de ville et baskets (planches streetwear) ; uniformes de métier réalistes pour les professions.
- **Corps plus affirmés** : silhouettes franches et lisibles (épaules, taille, hanches, fessier, poitrine, ventre, musculature nettement marqués selon la personne), pas de corps anime filiformes tous pareils.
- **Très nombreuses couleurs de peau et teintes** (sous-tons chauds, froids, olivâtres ; du très clair au très foncé), **très nombreuses coiffures** (y compris locks, locks papillon, tresses, afro, buzz cut, dégradés).
- **Style** : un peu dessin, un peu 3D. Plus jamais le rendu réaliste brut.

## 5. Recette retenue pour NEURAPOLIS

1. **Tête et cheveux anime** : partir des têtes VRoid (yeux dessinés, expressions par formes du visage), recolorées et variées (forme des yeux, iris, sourcils, bouche, peau).
2. **Corps** : anatomie juste et variée issue de MakeHuman, transférée sur le corps VRoid sous forme de **formes réglables** (morph targets) : taille, poids, musculature, épaules, poitrine, taille, hanches, fessier, ventre, cuisses, âge. Les moins de 18 ans ne reçoivent que les formes de leur âge.
3. **Rendu** : MToon (ombre en aplat, frontière nette, ombre colorée et chaude, lumière de contour, trait en coque inversée), normales du visage adoucies, pas d'ombre portée sur soi.
4. **Animations** : les 35 animations libres, appliquées par le squelette humanoïde standard du VRM.
5. **Toujours** : planche de validation (face, profil, dos, visage) soumise à l'utilisateur avant d'intégrer.
