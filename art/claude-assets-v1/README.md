# art/claude-assets-v1 — kit graphique NEURAPOLIS

Scène reconnaissable de **Val-Ferrand, Cité des Roses** (rue de l'épicerie) : décor en couches, façades 2.5D, pavés, enseigne, végétation, mobilier, éclairage chaud du soir + ombres froides, 3 personnages jouables/PNJ.
Direction : `GUIDE-DA.md` (1 page). Aperçu : `preview/scene_soir_x2.png` (principal), `preview/styleboard.png` (tout le kit).

## Contenu

| Dossier / fichier | Contenu | Dimensions | Grille / ancre |
|---|---|---|---|
| `palette/palette.json`, `neurapolis-core.gpl`, `palette-swatch.png` | **32 couleurs core**, rampes ombre/base/lumière, +6 teintes de peau (swaps, hors core) | — | — |
| `tiles/tiles.png` + `tiles.json` | 20 tuiles : pavé ×5, herbe ×4, terre ×2, haie ×2, plancher ×2, damier, **bords d'herbe ×4 (surcouches)** | 256×96 (8 col. × 3 lignes) | 32×32, raccord sans couture |
| `characters/{joueur,camarade,adulte}.png` + `characters.json` | idle ×2 + marche ×4, directions bas / haut / gauche (droite = miroir) | 96×72 par feuille | cellule 16×24, ancre pieds (8,23) |
| `buildings/{epicerie,maison,immeuble}_{jour,allume}.png` | 3 façades × 2 états (vitres reflétantes / fenêtres ambrées) | 160×128 ou 112×128 | ancre bas-gauche = ligne de sol |
| `props/*.png` + `props.json` | lampadaire (off/on), banc, jardinière, cageots, poubelle, chat ×2, arbre, cerisier, rosiers, ardoise « PAIN », clôture, fumée ×3, feuilles ×2 | 4×4 à 44×60 | ancre bas-centre |
| `backdrop/` | ciel jour / soir (tramés), nuages, skyline avec cheminées de l'usine Taret | 480×128, 200×40, 480×80 | parallaxe : voir `backdrop.json` |
| `light/` | halos chauds, flaque au sol, halo de fenêtre, vignette (**hors palette**, alpha tramé) + `grading.json` | 96², 128×48, 64², 480×270 | à composer en `screen`/`lighter` |
| `preview/` | scènes jour / soir / nuit (natif + ×2), styleboard | 480×270, 960×540, 1560×764 | — |
| `manifest.json` | index machine (chemins, tailles) pour l'intégration | — | — |
| `ui/` | **propositions** `tokens-cozy.ts` et `ui-cozy.css` (non appliquées) | — | — |
| `source/` | générateur Python (source de vérité) + `verify_kit.py` + `verify_report.txt` | — | — |

## Palette et règles de pixel

- 32 couleurs, contour brun chaud `#2a1a14`, ombres froides (bleu/violet), lumières ambrées, bases crème / sauge / terracotta.
- **Transparence** : alpha binaire (0 ou 255) sur tous les sprites, tuiles, façades ; aucun alpha partiel, aucun anti-aliasing. Seules les surcouches de `light/` ont de l'alpha et une teinte hors palette (documenté).
- Pixel net : n'afficher qu'à l'échelle **entière**, sans lissage.
- Vérification exécutée (`python3 source/verify_kit.py`) : tous les PNG de `tiles/ characters/ buildings/ props/ backdrop/` n'utilisent que la palette core, sans alpha partiel ; JSON valides. Rapport : `source/verify_report.txt`.

## Régénérer / éditer

`python3 source/build_kit.py` (Pillow + numpy). Les PNG sont directement éditables dans Aseprite/GIMP (la palette `.gpl` est fournie) ; **le code est la source de vérité** (aucun format `.aseprite` : non disponible dans cet environnement — compromis assumé : paramétrable et reproductible, mais moins « dessiné à la main »).
L'aperçu est calculé par `source/scene.py` ; l'éclairage est une réimplémentation numpy de ce que le renderer devra faire (multiplication d'heure, halos `screen`, vignette).

## Origine et licence

Tout est **original**, produit par code pour NEURAPOLIS : aucun asset, personnage, logo ni palette copié d'un autre jeu. Les références (Minami Lane, Eastward, Stardew…) ne sont citées que comme intentions d'ambiance, comme dans `art/DIRECTION-ARTISTIQUE.md`. Licence : à fixer par le propriétaire du dépôt (non précisée ici).

## Divergences et points ouverts

- `art/REFERENCES-BIG-AMBITIONS.md` (cité par le tableau de coordination) **n'est pas dans le checkout** `neurapolis/art/` ; des copies `REFERENCES-BIG-AMBITION(S).md` existent dans l'archive `.probe/v2-big/`. Elles n'ont **pas** été utilisées ici : seules les références présentes dans `neurapolis/` l'ont été.
- Aucun fichier de `src/**` n'a été touché. L'intégration (renderer, sprite, caméra à échelle entière) revient à la tâche J1.
- Rendu **non testé dans le jeu** : les aperçus viennent de `source/scene.py`, pas du renderer Canvas.
- Largeurs de façades vs empreintes de la carte : voir `GUIDE-DA.md §5`.
