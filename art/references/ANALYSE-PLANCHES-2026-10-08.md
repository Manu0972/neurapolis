# Analyse des 25 planches de référence (`art/`, poussées le 2026-10-08)

> Lu et étudié image par image par Claude Code (session cloud) le 2026-10-08. Ce sont des **références** : on en tire des règles, on ne copie ni personnages, ni logos, ni dessins (plusieurs sont l'œuvre d'artistes identifiés : Patreon, signatures, filigranes).
> Demande de l'utilisateur : **pas de personnages tout faits** ; un personnage **entièrement personnalisable**, une **grande variété de corpulences**, et une vraie **cohérence du visage** (expressions, proportions).

## 1. Ce que dit chaque planche

| Fichier | Ce que c'est | Ce qu'on en retient |
|---|---|---|
| `02e96ecf…` | « Convenience Kid », fiche de production 3D stylisée (Blender) : vues face / profil / dos, filaire, détails, 7 matériaux, textures 2048, ~7 850 triangles | **La meilleure cible pour un enfant de 12 ans** : grosse tête ronde, petits yeux en gélule, bouche en trait, corps simple, couleurs franches, détails choisis (boucles d'oreilles, manches rayées, semelles). Notre personnage de base doit ressembler à ça en proportions. |
| `1774926c…` | Personnage low-poly à textures pixel (Gemini) | Style cible déjà retenu (§11.2 de `V1.1.md`) ; doublon de `cible-style-lowpoly-texture-pixel.webp`. |
| `f31bc5e4…` | Personnage low-poly « facetté » (aplats, sans texture) | Variante encore plus simple et très lisible ; bon repère pour les **PNJ lointains** (niveau de détail réduit). |
| `a75306fb…` | Visages low-poly (inspirés d'un film) | **Visages expressifs avec très peu de faces** : nez marqué par 2-3 plans, sourcils peints, barbe de 3 jours en texture, frange en blocs. La cohérence du visage vient de la **texture peinte**, pas du maillage. |
| `a4f82d55…` | Figurines « designer toys » | Têtes très grosses, yeux géants : trop caricatural pour nos humains, mais **parfait pour les fantômes** en 3D (lien avec les petits sprites des fantômes). |
| `0b4da334…`, `28768ed7…`, `a77bd4bf…`, `ba95c9e8…` | Maillages filaires (corps homme, torse, corps femme, construction d'une main) | Règles de topologie : boucles d'arêtes autour des articulations (épaules, coudes, genoux) pour que le corps se plie sans s'écraser ; **main construite par étapes** (bloc → doigts → arrondi). Utile pour qui modélise les corps de base. |
| `45c2e85f…` | « Make shoes » : botte en 9 étapes | **Accessoires modulaires** : chaussures fabriquées à part, posées sur le pied ; même méthode pour sacs, casquettes, lunettes. |
| `074afe22…`, `b95e6953…`, `ed06bf21…`, `2a8990c6…`, `f818e801…` | Fiches anatomiques d'adultes (face / profil / dos, notes de morphologie) | **Variété des corps adultes** : épaules, taille, hanches, cuisses, musculature, chacune réglable indépendamment ; notes « proportions naturelles, non exagérées ». À appliquer aux **PNJ adultes** et au joueur **devenu adulte** seulement (§3). |
| `eda022ce…` | Fiche personnage complète : 5 vues, **12 expressions**, 7 poses, mains | **Le modèle à suivre pour la cohérence** : neutre, content, sourire, rire, colère, triste, pleurs, choc, gêne, détermination, confusion, sourire en coin ; poses debout, marche, assis, bras croisés, pointer, courir, regarder par-dessus l'épaule ; mains (poing, pointer, tenir un téléphone). |
| `e346c51a…` | Fiche personnage (illustration) : vues, notes de caractère, **8 expressions**, palette | Un personnage = une **palette de 5 couleurs** + des détails de caractère (badge, montre, sac, dos un peu voûté à force d'être assis). La posture raconte la vie du personnage. |
| `5766563c…` | Fiche d'expressions d'un personnage adulte (illustration) | Le même visage reste reconnaissable sous tous les angles et toutes les émotions : mêmes yeux, mêmes lunettes, même mèche. |
| `2739eae2…` | Pixel art : même personne en uniforme puis « en civil » | **Une tenue change toute l'attitude** : posture droite en uniforme, épaules rentrées en civil. La garde-robe doit aussi changer la **pose de repos**. |
| `2226958d…`, `3ff2cb7e…` | Sprites pixel « Remain on Earth » : marche dans 8 directions, **clignement des yeux** | Animation minimale mais vivante : 8 directions, cycle de marche court, clignement. **Référence directe pour les petits fantômes 2D** qui apparaissent en pop-up. |
| `1d9eb06a…` | Rue commerçante en pixel art vue de dessus (pizzeria, glacier, boulangerie, abribus, parking, panneaux) | **Densité de détails de rue** : enseignes illustrées, linge aux fenêtres, climatiseurs, poubelles, potelets, abribus, marquages au sol, panneaux publicitaires. C'est ce qui manque à notre ville. |
| `5f78d123…` | Square low-poly 3D (quatre parterres, haies, bancs, lampadaires, piliers de briques) | **Même style que nos personnages cibles, appliqué à la ville** : formes simples et arrondies, couleurs chaudes, éclairage doux. Notre place du marché et nos squares doivent viser ça. |
| `d60a30da…`, `téléchargé.png` | 12 + 15 tenues « streetwear » décontractées d'ados / jeunes adultes | **Catalogue de garde-robe** : sweat oversize, cargo large, jean large, veste en jean, gilet sans manches, polo, chemise ouverte, trench, veste en cuir, bob, casquette, sac à dos, sacoche, banane, écouteurs, gobelet ; poses mains dans les poches, téléphone, main dans les cheveux. |

## 2. Règles retenues pour NEURAPOLIS

1. **Style** : 3D low-poly (formes simples, volumes nets) + **textures peintes en pixels** pour le visage et les tissus. Silhouette d'enfant à la « Convenience Kid » à 12 ans, qui s'affine en grandissant.
2. **Cohérence du visage** : un visage = un maillage simple + une **texture de visage en couches** (peau, yeux, sourcils, bouche, taches de rousseur, barbe…). Les **12 expressions** de la fiche `eda022ce` deviennent 12 jeux de couches yeux/sourcils/bouche, plus le clignement. Même visage reconnaissable sous tous les angles.
3. **Personnalisation complète, pas de personnage tout fait** : tout se règle par curseurs et catalogues (§3). Les PNJ sont **générés par le même système** (tirés au sort par le PRNG du projet), donc aucun habitant n'est un clone.
4. **Accessoires modulaires** : chaussures, sacs, chapeaux, lunettes, bijoux sont des pièces séparées, ajustées au corps.
5. **Posture = caractère** : chaque personnage a une pose de repos (droite, voûtée, mains dans les poches, bras croisés…) liée à son tempérament et à sa tenue.
6. **Ville** : enseignes illustrées, objets de rue, linge, climatiseurs, abribus ; squares au style des planches `5f78d123` et `1d9eb06a`.
7. **Fantômes** : petits sprites pixel animés (8 directions, clignement, apparition) pour les pop-up ; option 3D façon figurine pour plus tard.

## 3. Personnalisation du personnage (à construire dans la refonte, étape 2)

**Corps** (curseurs continus, pas de types figés) : taille, corpulence (mince → forte), musculature, largeur d'épaules, largeur de hanches, longueur des jambes, ventre, posture (droite → voûtée), teint (palette large et continue), pilosité des bras.
**Visage** : forme (ronde, ovale, carrée, longue), mâchoire, joues, menton, nez (taille, largeur, arête), yeux (forme, écart, taille, couleur), sourcils (épaisseur, forme), bouche (largeur, lèvres), oreilles, grains de beauté, taches de rousseur, cicatrices, lunettes, appareil dentaire.
**Cheveux** : le catalogue de `V1.1.md` §7.3 (buzz cut, dégradés, afro, twists, locks, locks papillon, tresses plaquées, box braids, nattes…), avec couleur, mèches de couleur, longueur, contours rasés (line-up).
**Tenue** : catalogue en couches (haut, veste, bas, chaussures, couvre-chef, sac, bijoux) avec couleurs réglables, inspiré des planches de streetwear.
**Interface** : celle de Big Ambitions (V1.1 §11.1) : personnage 3D en grand, icônes de catégories, vignettes générées, nuancier, zoom / rotation / aléatoire.

**Règle d'âge, non négociable** : le joueur a **12 ans** au début. Les curseurs de morphologie adulte (poitrine, hanches marquées, musculature prononcée) n'existent **pas** pour les personnages de moins de 18 ans. Le corps d'enfant n'a que des réglages neutres (taille, corpulence, posture), et le corps **grandit tout seul** avec l'âge à partir des choix faits. Les fiches anatomiques adultes servent uniquement aux PNJ adultes et au joueur devenu adulte, avec des proportions naturelles et non sexualisées.

## 4. Ce qui n'est pas retenu

- Les rendus très réalistes (filaires haute densité, textures 2048) : trop lourds pour une ville pleine de PNJ.
- Les poses et tenues sexualisées de certaines planches : hors du ton du jeu.
- Toute reprise d'un personnage, d'un logo ou d'un dessin existant.
