# NEURAPOLIS — Guide DA du kit `claude-assets-v1`

*Une page pour décider vite. Le détail des fichiers est dans `README.md`.*

## 1. Pourquoi le rendu actuel est « abominable » (constaté sur `docs/captures/` et `renderer.ts`)

| Constat | Cause dans le code / les captures | Correctif du kit |
|---|---|---|
| Un écran = un mur de dalles quasi identiques, sans relief | `renderer.ts` remplit chaque tuile d'un aplat + 1 liseré ; `pave` n'existe pas | `tiles/` : pavé, herbe, terre à 4 variantes qui se raccordent, + bords d'herbe qui mordent le pavé |
| Bâtiments = bandeaux rognés, sans toit ni enseigne | façades dessinées à la tuile (rect + fenêtres) | `buildings/` : toit, enseigne, auvent, vitrine, plinthe, rosiers ; version jour **et** allumée |
| Pixels de tailles différentes, scintillement | `computeCamera` : `ts` flottant (20→48), sprite à `ts/16` → échelle **non entière** | rendre en natif (tuile 32 px) dans un canvas hors-écran, agrandir par facteur **entier** |
| La nuit = filtre gris | pas de source de lumière, seulement un assombrissement | `light/` : halos tramés + `grading.json` (ombres froides, fenêtres ~1900 K) |
| Entrées = anneaux ovales, étiquettes = pastilles noires | `ENTRY_COLORS` + `fillText` sur fond translucide | l'entrée **est** la porte/enseigne ; étiquette = plaque crème bordée de brun (`ui/ui-cozy.css`) |
| PNJ = même silhouette recolorée | un seul gabarit 16×23 face | `characters/` : 3 silhouettes réellement différentes, 3 directions, marche 4 poses |
| UI néon sombre contre monde chaud | `tokens.ts` : `#0a0e17` + néons | `ui/tokens-cozy.ts` : mêmes clés, valeurs de la palette |

## 2. Les 8 règles (non négociables)

1. **32 couleurs**, rampes 3 tons : ombre **froide** / base / lumière **chaude**. Contour `#2a1a14`. Jamais `#000`, jamais de vert/rouge purs.
2. **Pixel net à l'échelle entière.** Natif 1× → agrandissement ×2/×3/×4, `imageSmoothingEnabled = false`. Jamais de redimensionnement lissé, jamais de position sub-pixel.
3. **Aucune surface plate** : texture + variation stable (hash de tuile) + transitions.
4. **Un bâtiment se lit en une image** : toit → enseigne → auvent → vitrine → plinthe. Une identité par bâtiment (épicerie = auvent rayé, maison = rosiers, immeuble = linge + balcons).
5. **La lumière raconte l'heure** : jour = ciel azur ; soir = pêche/ambre + ombres violettes longues ; nuit = bleu profond **troué** de fenêtres chaudes. Halos tramés (Bayer), pas de dégradé flou.
6. **Silhouettes lisibles** : le joueur = capuche moutarde, la camarade = queue-de-cheval, l'adulte = tablier + chignon. Ils se reconnaissent flous.
7. **Vie partout, en petit** : fumée de cheminée, feuilles, chat, linge, reflets de vitre.
8. **L'UI est dans le monde** : bois + crème + brun, biseau 1 px. Aucune pastille noire, aucun néon.

## 3. Recette d'intégration Canvas (pour J1)

```ts
const NATIVE_W = 480, NATIVE_H = 270;                // 15 tuiles de large ; zoom = entier
const off = new OffscreenCanvas(NATIVE_W, NATIVE_H); const g = off.getContext('2d')!;
g.imageSmoothingEnabled = false;
// 1. ciel -> nuages (parallaxe 0.05) -> skyline (0.15) -> haie
// 2. sol : tuiles 32 px (variante = hash2(x,y) % n) + surcouches bord_herbe_*
// 3. façades : ancre bas-gauche sur la ligne de sol (y1 du BuildingRect), variante jour/allumée selon l'heure
// 4. ombres portées : polygone violet (grading.json) puis ellipse sous chaque sprite
// 5. props + personnages triés par y des pieds ; personnage = cellule 16×24, ancre (8,23) ; droite = miroir de left
// 6. étalonnage : g.globalCompositeOperation='multiply'; g.fillStyle=rgb(mul) à alpha k
// 7. lumières : 'screen' (ou 'lighter') avec light/halo_*.png ; puis light/vignette_480x270.png
const k = Math.max(1, Math.floor(Math.min(cw / NATIVE_W, ch / NATIVE_H)));   // facteur ENTIER
ctx.imageSmoothingEnabled = false; ctx.drawImage(off, (cw - NATIVE_W * k) / 2 | 0, (ch - NATIVE_H * k) / 2 | 0, NATIVE_W * k, NATIVE_H * k);
```

Cadence : idle 2 frames à ~1,6 Hz ; marche `walk0..walk3` à 6 Hz, pose choisie par le **déplacement réel** (`npcPosition`), direction = axe dominant.

## 4. Test « beau à l'arrêt » (à passer avant tout nouvel écran)

- [ ] Capture à ×1 : on distingue toit / mur / sol / personnage sans lire un seul texte.
- [ ] Aucun aplat > 3 tuiles sans variation. Aucun pixel hors palette (`source/verify_kit.py`).
- [ ] À la nuit, ≥ 2 sources chaudes visibles et l'ombre est bleue/violette, pas grise.
- [ ] Zoom ×2 puis ×3 : bords nets, aucun scintillement en marchant.
- [ ] Trois PNJ côte à côte : trois silhouettes différentes (pas seulement trois couleurs).

## 5. Limites connues (honnêtes)

- **Largeurs de façades** : épicerie 160 px (5 tuiles), maisons/immeuble 112 px (3,5 tuiles). La carte actuelle fait l'épicerie sur 7 tuiles (`data/map.ts`) → soit on adapte les empreintes, soit on ajoute un module central répétable. Décision à prendre à l'intégration.
- **Pas d'intérieurs** (salle de classe, chambre) ni de pluie animée : hors périmètre de cette tranche.
- **PNJ supplémentaires** (Noah, Yasmine, Karim, Monique, Samir, Mme Moreau) : à décliner depuis les 3 gabarits via `palette.json › swaps_peau_hors_core` (+6 couleurs de peau, hors core) et des variantes de rampes vêtements/cheveux.
- **Marche de côté** : 4 poses simples (pas de cycle 8 frames) ; suffisante à 6 Hz, à raffiner si besoin.
- Le texte de l'enseigne utilise une police 3×5 maison (sans accents autres que É, ni lettres rares) — à étendre si d'autres enseignes arrivent.
