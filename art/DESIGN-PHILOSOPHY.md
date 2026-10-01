# NEURAPOLIS — Philosophie visuelle (v2, refondue)

*Refonte motivée par l'analyse des jeux les plus aimés du genre : Minami Lane, WorldBox, News Tower, Keeper's Toll (1998: The Toll Keeper Story), et la théorie du « cozy game » (Hygge, Harvest Moon, Stardew Valley, Firewatch, Journey).*

## Le constat qui a tué la v1

La v1 dessinait des **formes plates** : une zone = une couleur. Le résultat est mort, « dégueulasse », parce que le pixel art ne vit pas par la forme mais par la **lumière**. Ce qui rend WorldBox « exquis malgré la basse résolution » et Minami Lane « charmant », c'est que chaque objet est bâti de **plusieurs tons avec ombre et lumière**, et que l'œil sent une température.

## Les 5 lois (non négociables)

1. **Palette limitée, chaude, harmonieuse.** 24-32 couleurs maximum, dominance chaude, désaturée-pastel. La gamme « cosy » réelle est ≈ 1800 K (bougie, coucher de soleil) : crème, sauge, terracotta, bois chaud, azur doux. Jamais de contraste agressif, jamais de noir pur.

2. **Hue shifting systématique.** Chaque matière a une rampe de 3 tons : **ombre → froid** (vers bleu/violet), **base**, **lumière → chaud** (vers jaune/orange). L'ombre d'un toit terracotta n'est pas « terracotta plus foncé » : elle vire au brun-violet. C'est LA signature qui rend l'art « vivant ». Aucun aplat.

3. **Sillhouettes lisibles et proportions mignonnes.** Gros crâne, corps rond, contours **brun chaud** (jamais noir). Un bâtiment se lit d'un coup d'œil ; un personnage s'identifie à sa tête et sa couleur.

4. **La lumière raconte l'heure.** Jour = azur et pastels ; soir = oranges et violets ; nuit = ombres froides **trouées de fenêtres chaudes** (~1900 K). Un halos chaud contre un fond froid est le contraste qui crée l'atmosphère (Keeper's Toll le prouve : « même un fond sombre devient cosy avec des accents chauds »).

5. **La vie partout, en petit.** Nuages qui dérivent, cheminées qui fument, fleurs, chat, reflets d'eau qui tremblent, personnages qui se balancent en marchant. Le charme est dans ces micro-détails, pas dans la grande forme.

## Ce qu'on évite (v1, à enterrer)

- Aplats sans ombre ni lumière.
- Contours noirs (`#000`).
- Couleurs « par défaut » (vert pur, rouge pur).
- Vue de face raide sans profondeur ni ciel.
- Rien qui bouge à part le joueur.

## Références de palettes (présets reconnus)

- PICO-8 (16 couleurs), Sweetie 16, DawnBringer DB16/DB32 — bases de gammes limitées cohérentes.
- Minami Lane : pastel chaud + azur, rue flottant dans un ciel bleu avec nuages.
- WorldBox : blocs pixels multi-tons (volume par ombre/lumière), créatures mignonnes.
- News Tower : sépia/brun 1930, chaleur des lampes.
- Keeper's Toll : ombres froides + accents chauds (fenêtres), atmosphère par l'éclairage.

## Application dans le code

`art/pixelart.js` implémente ces lois : palettes à rampes (3 tons hue-shifted) × 3 heures (jour/soir/nuit), personnages à tête ronde ombrée, bâtiments à 2 faces (lumière/ombre) avec fenêtres chaudes, cheminée qui fume, fleurs, ciel en dégradé avec nuages dérivants, vignette chaude. Chaque objet = base + ombre froide + lumière chaude.
