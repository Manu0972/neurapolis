# NEURAPOLIS — Direction artistique v3 (fondée sur l'étude)

Étude croisée : Minami Lane (Blibloop), WorldBox, News Tower, 1998/Keeper's Toll, Eastward,
Spiritfarer, Animal Well, Stardew Valley + théorie du « cozy game » (HAW Hamburg, hygge 1800K)
et analyse de la viralité TikTok des jeux cozy.

## 1. Pourquoi ces jeux sont aimés (le cœur émotionnel)

Pas pour leurs mécaniques. Pour leur **vibration** :
- **Chaleur + calme** : palette pastel, lumière chaude ≈ 1800K (bougie/coucher de soleil),
  « une couverture lestée en pastel ». Les commentaires disent « ça m'a guéri ».
- **Vie partout** : Blibloop — « un petit monde qui déborde de vie, agréable à regarder ».
  Les chats de Minami Lane sont là « parce que c'est une rue, et c'est mignon ».
- **Nostalgie pixel** : Game Boy, Harvest Moon, Animal Crossing. L'« imperfection » du pixel
  invite le joueur à projeter — et contraste avec le lisse généré par IA.
- **Boucles satisfaisantes** : observer un monde qui continue de vivre sans le joueur.

Ce qu'on retient : **la qualité perçue, c'est de la chaleur + de la vie + de la lumière.**
Pas du détail technique.

## 2. Ce que chaque référence nous apprend (et les corrections)

| Référence | Style réel | Ce qu'on retient |
|---|---|---|
| **Minami Lane** | isométrique, dessin Ghibli, palette simple | « simple palette + simple style + plein de vie » ; dessiner les poses clés, échouer, recommencer |
| **WorldBox** | pixel dieu-sim | « exquis malgré la basse résolution » = volume par **plusieurs tons + ombres** |
| **News Tower** | PAS pixel : 2D Art déco années 30, sépia + couleurs vives | la vue « fourmilière » de côté ; le sépia comme base |
| **1998 / Keeper's Toll** | pixel sombre, gothique | l'atmosphère par la **lumière** : accents chauds sur fond froid |
| **Eastward** | pixel + **vrai éclairage dynamique** | la référence : lumières temps réel, profondeur en couches, 50k frames dessinées à la main, ambiance « animé 90s » |
| **Spiritfarer** | dessin animé émotionnel | la lumière raconte l'émotion |
| **Animal Well** | « pixel poétique » | le pixel comme langage, pas comme limitation |

**Correction majeure** : News Tower et Spiritfarer ne sont pas du pixel art. Si on veut le
niveau de finition de 1998 **et** la viralité cozy, la voie est : **pixel art cozy + vrai
éclairage chaud + profondeur** (l'approche d'Eastward, simplifiée).

## 3. La direction NEURAPOLIS

**Style : pixel art cozy, chaud, hygge.** Lumière directionnelle chaude (~1800K), ombres
froides (bleu/violet) — le contraste chaud/froid qui crée le « cozy ». Personnages chibi,
animation **frame par frame** (pas de marionnette, pas d'IK visible). Monde qui respire.

### 3.1 Palette (limitée, ~28 couleurs, à rampes hue-shiftées)

Base = tons cozy de Minami Lane + structure Sweetie 16. Chaque matière = 3 tons (ombre froide / base / lumière chaude).

| Matière | Ombre (froid) | Base | Lumière (chaud) |
|---|---|---|---|
| Peau | `#d99a78` | `#ffc496` | `#ffd9b0` |
| Cheveux brun | `#4a3220` | `#6b4a2f` | `#8a6240` |
| Haut corail | `#c25a40` | `#f48c5d` | `#ffb08a` |
| Herbe | `#257179` | `#38b764` | `#a7f070` |
| Bois | `#6b4a2f` | `#bc7e4d` | `#d8a878` |
| Eau | `#3b5dc9` | `#41a6f6` | `#73eff7` |
| Ciel | `#3b5dc9` | `#41a6f6` | `#73eff7` |
| Contour | `#2a1a14` (brun chaud — **jamais de noir pur**) | | |
| Fenêtre allumée | — | `#ffd98a` | `#ffe2a8` |
| Mur crépi | `#cfa97f` | `#efd9ac` | `#f9ecd0` |
| Toit | `#8f3a34` | `#c15f4a` | `#d97a5f` |

Règle : **contour brun chaud**, ombres qui virent au froid, lumières qui virent au jaune/ambre.

### 3.2 Personnage (proportions + animation)

- **Canvas** : 16×24 (le « golden size » pour l'animation de personnage), chibi **2–3 têtes de haut**.
- **Idle** : 2–4 frames (respiration = montée/descente d'1px, transfert de poids).
- **Marche** : 6–8 frames = **contact / descente / passage / montée**, ×2 en miroir.
  On ne dessine que 4 poses clés, on miroite pour les 4 autres.
- **Bob de la tête** : onde **triangulaire** (pas une sinusoïde — sinon artificiel).
- **Bras et jambes en phase** ; les pieds se posent (pas de glissement, mais **cuit dans les frames**, pas en IK visible).
- **Sub-pixel** : tout calé sur des pixels entiers (éviter le « shimmer »).
- **Variation** : silhouettes différentes (grand/petit/âgé/jeune), pas seulement des couleurs.

### 3.3 Environnement + profondeur

Couches : **ciel → ville lointaine → architecture → rue → mobilier → végétation → personnages → premier plan → particules/lumière**. Parallaxe subtile.
Bâtiments avec identité : façades variées, fenêtres à cadre, enseignes, balcons, gouttières, usure, végétation. Fenêtres chaudes qui s'allument le soir.

### 3.4 Lumière (le liant)

- Lumière chaude directionnelle (coucher de soleil / bougie), ombres froides — le contraste « hygge ».
- Les personnages sont **teintés par la lumière de la scène** (chaud près d'une lampe, froid dans l'ombre).
- Ombre portée orientée, vignette douce, halos.

### 3.5 Vie / micro-détails

Chats, fleurs, fumée de cheminée, feuilles qui dérivent, eau qui miroite, lampes qui vacillent, regard des personnages. « Agréable à regarder » même sans rien faire.

## 4. Ce qu'on évite (à enterrer)

- Primitives géométriques comme rendu final (traits, ronds, rectangles).
- Personnage « paper doll » (morceaux assemblés qui tournent).
- Contours noirs purs (`#000`).
- Aplats sans ombre ni lumière ; clones identiques.
- Écran de jeu entouré de chrome web (header/footer/boutons/debug).

## 5. Plan d'exécution (art d'abord)

1. **Un seul personnage**, 16×24, chibi, frame par frame (idle 2 + marche 4 poses clés), palette §3.1.
2. On le travaille **jusqu'à ce qu'il soit beau à l'arrêt** (test §10 de la réf précédente).
3. Puis une petite rue travaillée (2-3 bâtiments, 1 lampe, 1 arbre, 1 chat).
4. Puis lumière/soir/nuit, puis variations, puis on connecte à la simulation.

**Règle** : on ne passe à l'étape suivante que quand l'écran est beau. Qualité perçue > échelle.

## Sources

- [They Make Games — Blibloop (Minami Lane)](https://www.theymakegames.com/doriane-randria/)
- Slynyrd Pixelblog 50 — « Human Walk Cycle » (cycle de marche 8 frames)
- Sweetie 16 / TIC-80 palette (hex officiels)
- HAW Hamburg — « Zwischen Hygge und Harvest Moon » (lumière 1800K)
- Eastward (Pixpil) — éclairage dynamique sur pixel art
