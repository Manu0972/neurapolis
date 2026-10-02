# NEURAPOLIS — Guide de Style Officiel : Direction Artistique 2.5D & Pixel-Art

> **Auteur** : Direction Artistique NEURAPOLIS (Axis 1)  
> **Statut** : Document de référence technique, esthétique et architectural  
> **Inspirations majeures** : *Eastward* (Pixpil), *Minami Lane* (Blibloop), *Spiritfarer* (Thunder Lotus)  
> **Cible** : `neurapolis/src/presentation/` & `neurapolis/docs/`  
> **Dernière mise à jour** : Octobre 2026  

---

## 1. Philosophie Esthétique & Les 5 Lois Fondamentales

NEURAPOLIS n'est ni un jeu de gestion froid ni un univers de science-fiction néon. C'est une fable citoyenne, chaleureuse et lumineuse, vécue à hauteur d'adolescent dans une ville populaire du bassin houiller et textile français en pleine métamorphose solidaire.

L'émotion visuelle repose sur la théorie du **« cozy game »** et le concept scandinave du **« hygge »** :

### Les 5 Lois Non Négociables :
1. **Loi du Zéro Noir Pur (`#000000`) et Zéro Blanc Pur (`#ffffff`)** :
   - Tous les contours, traits de coupe et encrages utilisent le **brun chaud torréfié `OUTLINE = '#2a1a14'`**.
   - Tous les blancs sont teintés d'ivoire chaud (`INK_WARM = '#f9ecd0'`) ou d'ambre.
2. **Loi du Hue Shifting Triadique Systématique** :
   - Aucun matériau n'est éclairé ou assombri par une simple variation de luminosité (HSV/HSL monotone).
   - Les **ombres virent systématiquement au froid** (bleu nuit, violet sourd `#2c2540`, vert canard).
   - Les **lumières virent systématiquement au chaud** (jaune d'or, ambre 1800K `#ffd98a`, pêche cuite).
3. **Loi de la Température Lumineuse Hygge (~1800K)** :
   - Évocation réconfortante de la flamme d'une bougie, des filaments de tungstène de réverbères et de la « Golden Hour » de fin d'après-midi.
4. **Loi du Contraste Chaud / Froid** :
   - C'est la confrontation entre des façades enveloppées de lumière d'or et de cuivre et des ombres douces et profondes bleutées/violettes qui crée la vibration « réconfortante ».
5. **Loi des Matières Naturelles & Diégétiques** :
   - L'interface et les décors privilégient le papier kraft recyclé (`#e8d6b0`), le chêne patiné (`#8a5a3a`), la brique rouge cuite et le lin doux plutôt que les verres fumés et les plastiques lisses.

---

## 2. Table Canonique des 28 Couleurs Hue-Shiftées

La palette officielle est structurée en rampes à 3 tons : **Ombre Froide $\rightarrow$ Base Neutre $\rightarrow$ Lumière Chaude (1800K)**.

| N° | Matériau / Usage | Ombre Froide | Base Médiane | Lumière Chaude | Rôle Chromatique & Notes |
|---|---|---|---|---|---|
| **01** | **Contour Universel** | — | **`#2a1a14`** | — | Brun chaud torréfié, ligne de force sans noir |
| **02–04** | **Peau Claire (Camille, Noah, Lina)** | `#cf8f74` | `#ffc496` | `#ffd9b0` | Carnation pêche, ombre cuite, lumière ivoire |
| **05–07** | **Peau Chaude (Samir, Karim)** | `#8a5238` | `#b47a56` | `#d19a72` | Carnation cuivrée, ombre terre de Sienne |
| **08–10** | **Cheveux & Cuirs Bruns** | `#4a3220` | `#6b4a2f` | `#8a6240` | Châtain chaud, reflets dorés |
| **11–13** | **Tissu Corail / Terracotta** | `#c25a40` | `#f48c5d` | `#ffb08a` | Vêtements Camille, store banne Bertin, accents |
| **14–16** | **Denim & Bleu Ouvrier** | `#243250` | `#4a5a7a` | `#6b7fa0` | Pantalons ouvriers, vestes collège, ciel nocturne |
| **17–19** | **Végétation & Parcs** | `#257179` | `#38b764` | `#a7f070` | Vert canard froid en ombre, herbe tendre dorée |
| **20–22** | **Bois Chêne & Menuiserie** | `#4a3424` | `#8a5a3a` | `#d8a878` | Établis friche, menuiseries, bancs publics |
| **23–25** | **Eau du Canal & Ciel Azur** | `#223852` | `#41a6f6` | `#73eff7` | Bleu profond en sous-face, azur, étincelles d'onde |
| **26–27** | **Crépi Calcaire & Façades** | `#cfa97f` | `#efd9ac` | `#f9ecd0` | Calcaire de Val-Ferrand, sable froid en ombre |
| **28** | **Lumière Hygge 1800K** | — | **`#ffd98a`** | **`#ffe2a8`** | Fenêtres allumées, halos de réverbères, torches |

### Teintes Auxiliaires Harmonisées :
- **Ombre Froide Nocturne** : `#2c2540` (violet ardoise pour ombres portées et ciel de nuit)
- **Papier Kraft UI** : `#b79f76` (ombre) / `#d8c49a` (base) / `#e8d6b0` (fond de panneau)
- **Brique Rouge Industrielle** : `#8f3a34` (ombre) / `#c15f4a` (base) / `#d97a5f` (lumière)
- **Métal & Ferraille** : `#454a59` (ombre) / `#7b8499` (base) / `#b8c3d9` (lumière)

---

## 3. Standards de Projection 2.5D & Grille Pixel

### 3.1 Métrique et Axonométrie
- **Tuile logique du monde** : $32 \times 32$ pixels.
- **Résolution native Canvas (Offscreen)** : $480 \times 270$ pixels (ratio 16:9, zoom entier $\times 2, \times 3, \times 4$ vers l'écran visible selon la taille de fenêtre).
- **Format de personnage (Golden Size)** : Largeur de 16 px, Hauteur de 22 à 26 px selon la tranche d'âge.
- **Règle du Pixel Entier** : Toutes les coordonnées de rendu sont arrondies à l'entier (`Math.round`), éliminant tout sautillement sous-pixel (*shimmering*).
- **Lissage Désactivé** : `ctx.imageSmoothingEnabled = false` sur l'ensemble de la chaîne Canvas.

### 3.2 Ordre des Couches et Tri par Profondeur Y
La simulation 2.5D impose une superposition stricte des éléments de la scène :
```
1. Ciel & Nuages dérivants (parallaxe horizontale subtile)
2. Skyline urbaine lointaine
3. Sol texturé & Terrains (pavés inégaux, herbe oscillante, terre battue)
4. Murs de fond & Façades architecturales (crépi, briques, verrières)
5. Entités & Mobilier triés par profondeur Y croissant :
   - Bancs publics, boîtes aux lettres, bacs à fleurs
   - Arbres et réverbères
   - PNJ et Animaux (chats, moineaux)
   - Joueur (Camille)
   - Fantômes conseillers en sustentation
6. Éclairage circadien (matin rosée, crépuscule 1800K, nuit indigo)
7. Météo dynamique (pluie fine avec ondelettes d'impact, brume du canal)
8. Vignette d'ambiance douce (bords assombris au brun chaud #2a1a14)
```

---

## 4. Morphologie des Personnages & Évolution de Camille

### 4.1 Camille — Progression Morphologique (12 $\rightarrow$ 16 ans)
Le protagoniste grandit physiquement au fil de l'histoire et de la rénovation de Val-Ferrand :

1. **Camille à 12 ans (Rentrée Collège)** :
   - Taille : $16 \times 22$ pixels (chibi 2,2 têtes de haut).
   - Silhouette : Ecolier vif et dynamique, cartable d'écolier en bandoulière qui oscille au rythme des pas, casquette légère et mèches ébouriffées, baskets claires.
   - Démarche : Pas rapides et sautillants (cadence vive, bob de tête 2px).
2. **Camille à 14 ans (Adolescent Investi & Friche)** :
   - Taille : $16 \times 24$ pixels (chibi 2,5 têtes de haut).
   - Silhouette : Manches de chemise corail retroussées, carnet de comptes à la ceinture, sacoche en cuir en bandoulière.
   - Démarche : Foulée régulière et assurée.
3. **Camille à 16 ans (Jeune Bâtisseur de la Cité)** :
   - Taille : $16 \times 26$ pixels (chibi 2,8 têtes de haut).
   - Silhouette : Stature adulte affirmée, blouson de travail solide en toile avec écusson du Stand ou de la coopérative citoyenne.
   - Démarche : Démarche posée et regard franc.

### 4.2 Silhouettes Singulières des Habitants
Fini les clones recolorés ! Chaque habitant possède une silhouette dessinée :
- **Noah Martin** : $16 \times 23$ px, casquette bleue vissée de travers, sacoche d'écolier ou skate sous le bras, allure espiègle déhanchée.
- **Lina Kessler** : $16 \times 23$ px, lunettes rondes dorées (`#ffd98a`), carnet de comptes kraft serré sous le bras, couettes soignées et haut turquoise vif.
- **Mme Bertin** : $18 \times 23$ px, silhouette rondelette et trapue, châle en laine tricoté écru (`#f9ecd0`) sur les épaules, lunettes sur le nez, tablier d'épicière et chignon bas.
- **Samir Ould-Ali** : $17 \times 25$ px, carrure solide aux épaules larges, bleu de travail vert retroussé, mètre ruban en laiton à la ceinture, lunettes d'acier.
- **Karim Bensalah** : $18 \times 25$ px, carrure d'artisan un peu voûté, salopette de mécanicien jaune moutarde (`#ffc94a`) avec clé à molette apparente, casquette plate en drap de laine.

---

## 5. Galerie de Portraits d'Émotions (48×48 px)

Pour les dialogues et bulles narratives, 5 expressions pixel-art encadrées de bois tendre et fond kraft sont produites :
1. **`joie`** : Yeux plissés rieurs en arcs (`^ ^`), grand sourire radieux découvrant les dents, pommettes chaudes et petites étincelles dorées.
2. **`surprise`** : Yeux grands ronds écarquillés avec pupilles dilatées, sourcils hauts, bouche en petit "O" d'étonnement, sursaut miniature.
3. **`reflexion`** : Regard tourné vers le haut et la droite, sourcil concentré, main sous le menton, petite étincelle d'idée.
4. **`scepticisme`** : Un sourcil haussé, l'autre bas, bouche pincée en biais, regard en coin dubitatif et comique.
5. **`colere_comique`** : Sourcils en "V" sévère, joues gonflées boudeuses, petite croix comique de colère façon BD.

---

## 6. Silhouettes Spectrales des 5 Fantômes Conseillers

Chaque fantôme intellectuel se matérialise avec une aura semi-transparente, une lévitation ondulante et des accessoires symboliques flottants :

1. **Adam Smith (Lumière Dorée Ambrée `#ffd98a`)** :
   - Silhouette géorgienne XVIIIe siècle, perruque poudrée blanche bouclée à catogan, redingote cintrée et jabot de dentelle vaporeux.
   - Accessoire spectral : Balance dorée miniature en équilibre flottant dans la paume.
2. **Karl Marx (Lumière Rouge Rubis Braise `#ff5c7c`)** :
   - Silhouette massive et vigoureuse XIXe siècle, crinière léonine et abondante barbe touffue en volutes de fumée, pardessus croisé épais.
   - Accessoire spectral : Rouage d'usine lumineux en rotation lente et feuillets de manuscrit flottants.
3. **Elinor Ostrom (Lumière Vert Menthe d'Eau Claire `#3ddc84`)** :
   - Silhouette bienveillante contemporaine, cheveux courts ondulés argentés, lunettes rondes rayonnantes, veste de terrain et écharpe fluide qui ondule.
   - Accessoire spectral : Onde d'eau limpide et jeune pousse végétale lumineuse.
4. **John Maynard Keynes (Lumière Bleu Azur Électrique `#4ab8ff`)** :
   - Silhouette élancée de Cambridge, complet veston trois-pièces chic en tweed, cravate sombre.
   - Accessoire spectral : Pipe de bruyère au coin des lèvres dont les volutes de fumée tracent des sinusoïdes de cycles économiques.
5. **Frederick W. Taylor (Lumière Cuivre Mécanique `#ff9a5c`)** :
   - Silhouette raide et géométrique, veston strict boutonné jusqu'au col, lunettes d'acier et moustaches nettes.
   - Accessoire spectral : Chronomètre de précision à trotteuse nerveuse tournoyante.

---

## 7. Façades Architecturales & Spécifications des 4 Nouveaux Quartiers

### 7.1 Lieux Emblématiques Existants
- **Place des Roses** : Façade crépi chaud (`#efd9ac`), auvent bordeaux, guirlandes de lampions de fête dorés et corail, fontaine octogonale en pierre avec clapotis d'eau.
- **Épicerie Bertin** : Store banne rayé corail/crème festonné, caisses maraîchères en bois avec carottes et poireaux, vitrine éclairée le soir à 1800K projetant un halo chaud sur les pavés.
- **La Friche Taret & Ateliers** : Briques rouges industrielles patinées, grandes verrières à croisillons métalliques d'atelier, enseigne peinte murale « TARET & FILS COOP », établi en chêne avec étau métallique et vélo appuyé.
- **Quais du Canal de Val-Ferrand** : Berges en blocs de granit moussus avec perré incliné, bollards et anneaux d'amarrage en fonte, eau scintillante avec miroitement animé, péniche associative amarrée « L'Égalité Flottante » avec hublot allumé et cheminée fumante.

### 7.2 Concepts & Spécifications des 4 Nouveaux Quartiers
1. **Le Canal & Docks Désaffectés** (`docks`) :
   - *Ambiance* : Port fluvial d'entrepôts reconvertis en fablabs nautiques et café équitable.
   - *Matériaux* : Palplanches en bois goudronné, bardage métallique patiné, anneaux de fonte, pontons flottants.
   - *Props* : Grues manuelles à engrenages, sacs de café en toile de jute, péniches amarrées.
2. **Les Hauts de Val-Ferrand** (`hauts`) :
   - *Ambiance* : Cité résidentielle étagée sur les collines, tournée vers le ciel et l'autonomie.
   - *Matériaux* : Briques claires, balcons suspendus en treillis, terreau maraîcher de terrasse.
   - *Props* : Serres maraîchères sur les toits, mâts d'antennes pirates de la radio 108.4 FM, lignes de linge séchant au vent.
3. **Le Bassin Industriel Nord** (`bassin`) :
   - *Ambiance* : Cœur métallurgique historique reconverti en artisanat lourd et énergies renouvelables citoyennes.
   - *Matériaux* : Sheds industriels en briques sombres à toits en dents de scie, profilés IPN acier riveté, verre armé.
   - *Props* : Grande cheminée d'usine monumentale, rails de wagonnets incrustés dans le pavé, panneaux photovoltaïques citoyens.
4. **Les Souterrains & Caves Voûtées** (`souterrains`) :
   - *Ambiance* : Réseau séculaire de galeries de carriers et caves voûtées abritant réunions secrètes et marchés nocturnes.
   - *Matériaux* : Calcaire rustique brut taillé, mortier de chaux, poutres de chêne noirci.
   - *Props* : Voûtes en plein cintre massives, niches creusées accueillant des bougies cireuses allumées, fûts de bois empilés.

---

## 8. Éclairage Circadien Hygge 1800K & Météo Dynamique

### 8.1 Courbe Circadienne d'Éclairage
La lumière évolue en continu selon l'heure du jour simulée :
- **Aube & Matin Rosée (5h00 – 7h30)** : Voile rose-pêche délicat (`rgba(255, 175, 130, 0.16)`), ombres fraîches bleutées, lumière douce et vivifiante.
- **Plein Jour (7h30 – 17h00)** : Lumière naturelle franche, ombres compactes au sol.
- **Crépuscule Doré 1800K / Golden Hour (17h00 – 20h30)** : Lumière ambrée chaude 1800K (`#ffd98a`, `rgba(255, 196, 120, 0.22)`), ombres portées douces s'étirant au sol virant au violet profond (`#2c2540`).
- **Nuit Indigo Chaleureuse (21h00 – 5h00)** : Ciel bleu nuit profond (`rgba(12, 20, 40, 0.44)`), parsemé d'étoiles scintillantes par temps clair, halos radiaux chauds 1800K autour des lanternes de réverbères et des fenêtres de maisons illuminées en jaune d'or.

### 8.2 Effets Météo Dynamiques
- **Pluie fine** : Gouttes obliques dessinées au trait fin (`rgba(205, 228, 250, 0.32)`), impacts au sol générant de petites ondulations concentriques elliptiques.
- **Brume matinale fluviale** : Volutes vaporeuses douces (`rgba(240, 248, 255, 0.22)`) dérivant lentement en surface du canal entre 5h00 et 9h30.
- **Temps ensoleillé** : Particules dorées de pollen dérivant au vent sur fond de ciel pur.

---

## 9. Mobilier Urbain & Gags Visuels de Fond

- **Boîte aux lettres d'époque PTT** : Forme bombée rétro, jaune d'or `#ffd98a` et serrure en bronze, fente d'insertion marquée.
- **Chat somnolent de muret** : Cycle à 3 frames (dort en boule, respire avec léger bob de flanc, s'étire en bâillant puis dresse les oreilles).
- **Moineaux de pavé** : Cycle à 3 frames (picore les miettes, redresse vivement la tête, sautille).
- **Pigeon chapardeur** : Traverse furtivement le parvis de l'épicerie avec un papier de bonbon violet dans le bec.
- **Fontaine de place** : Ondulations d'eau concentriques et gerbe centrale scintillante animée.
