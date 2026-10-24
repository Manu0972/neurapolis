# ÉCHELLES ET DISTANCES DE NEURAPOLIS (PALIERS 1 À 6)

> **Document canonique de cohérence cartographique et spatio-temporelle**
> Ce document établit l'échelle commune, la métrique spatiale, les durées de déplacement et la correspondance avec le lore (`docs/lore/QUARTIERS.md`, `docs/lore/HISTOIRE-ASCENSION.md` et `docs/VISION.md`).

---

## 1. Tableau synthétique des Paliers et Échelles

| Palier / Tier | Nom du Palier | Échelle Spatiale | Unité / Grille | Vitesse de Déplacement | Distance Max / Portée |
|---|---|---|---|---|---|
| **Palier 1 à 3** | Cité & Ville (`centre`, `gare_est`, `hyperval`, `faubourg`, etc.) | Ville de Val-Ferrand (1 562 × 1 154 m) | 1 tuile = 1 mètre | Marche (~1,2 m/s, ~72 m/min) / Bus / Vélo | ~1,9 km en diagonale traversante (~25 min à pied) |
| **Palier 4** | La Vallée du Taret | Bassin Régional (Néo-Baie, Plateau Blanc, Île Saphir) | Kilomètres (carte de réseau) | Train (3 h de trajet = 18 ticks) / Péniche / Camion | 25 km à 120 km (séjours de 3 à 5 jours) |
| **Palier 5** | Le Pays | Échelle Nationale (Réseau de 40 pays/régions macro) | Territoires & Cohortes | Flux logistiques, fret routier & ferroviaire | 500 km à 1 000 km (macro-simulation annuelle) |
| **Palier 6** | Le Monde | Échelle Internationale (~10 milliards d'individus) | Matrice globale (N0 Monde) | Fret maritime & échanges transfrontaliers | Échelle planétaire (équilibres commerciaux au centime) |

---

## 2. Découpage et Métriques du Palier 1-3 (Val-Ferrand)

### 2.1 Dimensions de la Grille et des Quartiers
La carte de Val-Ferrand fait **1 562 mètres de large par 1 154 mètres de haut** (1 802 548 tuiles au total).
Chaque tuile représente exactement **1 mètre × 1 mètre**.

Les 10 quartiers de la ville pavent intégralement la grande carte sans chevauchement ni lacune :

| Quartier (`id`) | Nom affiché | Palier (`tier`) | Emprise X ($m$) | Emprise Y ($m$) | Largeur ($w$) | Hauteur ($h$) | Envergure Max Intra-Quartier |
|---|---|---|---|---|---|---|---|
| `centre` | Centre de Val-Ferrand | Palier 1 | $0 \le x < 417$ | $0 \le y < 253$ | 417 m | 253 m | ~487 m |
| `gare_est` | Gare Est | Palier 2 | $417 \le x < 581$ | $0 \le y < 253$ | 164 m | 253 m | ~301 m |
| `hyperval` | Zone HyperVal | Palier 3 | $581 \le x < 827$ | $0 \le y < 253$ | 246 m | 253 m | ~352 m |
| `industrie` | Zone industrielle du Taret | Palier 4 | $827 \le x < 1155$ | $0 \le y < 253$ | 328 m | 253 m | ~414 m |
| `collines` | Les Hauts du Taret | Palier 3 | $1155 \le x < 1562$ | $0 \le y < 253$ | 407 m | 253 m | ~479 m |
| `berges` | Berges de la Malterie | Palier 2 | $0 \le x < 581$ | $253 \le y < 517$ | 581 m | 264 m | ~638 m |
| `faubourg` | Faubourg Saint-Éloi | Palier 3 | $581 \le x < 1562$ | $253 \le y < 517$ | 981 m | 264 m | ~1 015 m |
| `grand_ensemble` | Grand Ensemble des Roses Sud | Palier 2 | $0 \le x < 827$ | $517 \le y < 837$ | 827 m | 320 m | ~886 m |
| `friche_sud` | Friche Taret Sud | Palier 4 | $827 \le x < 1562$ | $517 \le y < 837$ | 735 m | 320 m | ~801 m |
| `bellevue` | Bellevue | Palier 3 | $0 \le x < 1562$ | $837 \le y < 1154$ | 1 562 m | 317 m | ~1 593 m |

### 2.2 Durées de Trajet et Modes de Transport (Paliers 1-3)

- **Marche à pied** :
  - Vitesse à pied : ~1,2 m/s dans la simulation (un tick de 10 minutes permet de parcourir jusqu'à 720 mètres).
  - Trajet Maison → Collège Jean-Moulin (~270 m) : ~3 à 4 minutes à pied.
  - Trajet Maison → Gare Est (~500 m) : ~7 minutes à pied.
  - Trajet Maison → Bellevue / Sommet (~1 100 m avec dénivelé) : ~15 à 18 minutes à pied.
  - Traversée complète Ouest-Est (1 562 m) : ~22 minutes à pied.

- **Transport en commun (Réseau de Bus du Taret)** :
  - Horaire de service : 06h00 à 22h00 (144 ticks/jour).
  - Lignes actives : L1 (Ligne du Rail), L2 (Ligne du Canal), L3 (Ligne des Hauteurs).
  - Temps de bus typique : 2 à 8 minutes selon les arrêts, permettant d'éviter la fatigue des longs déplacements à pied vers les plateaux.

---

## 3. Échelle de la Vallée du Taret (Palier 4)

Au Palier 4, l'horizon du joueur s'étend à la vallée et aux territoires régionaux accessibles depuis la Gare Est :

| Destination | Distance Approximative | Mode de Transport | Durée de Trajet | Durée du Séjour sur Place | Notions & Découvertes |
|---|---|---|---|---|---|
| **Néo-Baie** | ~40 km | TER Express / Fret | 3 heures (18 ticks) | 3 jours (6 demi-journées) | Prix & Rareté, Négociation de gros à la criée |
| **Plateau Blanc** | ~25 km | Autocar / Utilitaire | 3 hours (18 ticks) | 4 jours (8 demi-journées) | Alliances durables, Circuit court & Fromagerie coopérative |
| **Île Saphir** | ~120 km | Train + Navette maritime | 3 hours (18 ticks) | 5 jours (10 demi-journées) | Prévision en incertitude, Autonomie énergétique & Conserverie |

---

## 4. Échelle Nationale et Internationale (Paliers 5 et 6)

Aux Paliers 5 (Le Pays) et 6 (Le Monde), la simulation passe à l'échelle macroscopique (`src/simulation/world/macro.ts`) :

- **N1 Pays / N2 Villes & Cohortes** : 40 pays fictifs équilibrés, démographie simulée sur 50 à 100 ans.
- **N0 Monde** : Matrice commerciale mondiale où les transactions sont équilibrées à l'exact centime près, conservant les populations et les flux migratoires sans dérive statistique.

---

## 5. Recoupement avec le Lore (`QUARTIERS.md` & `HISTOIRE-ASCENSION.md`)

Chaque lieu nommé dans `docs/lore/QUARTIERS.md` possède une correspondance physique rigoureuse dans les structures de données du jeu :
- **Bâtiments majeurs (`CITY.buildings` & `LANDMARKS`)** : `maison` (Barre A), `college` (Collège Jean-Moulin), `epicerie` (Épicerie Bertin), `friche` (Atelier Friche), `parc` (Parc des Roses), `place` (Kiosque du Marché), `gare` (Gare Est), `hopital` (Hôpital), `lycee` (Lycée Louise-Michel), `tribune` (Stade Marcel-Cerdan), `chapelle` (Cimetière du Taret), `brasserie_malterie` (Brasserie de la Malterie), `laminoir` (Taret Laminage).
- **Commerces de quartier (`DISTRICT_SHOPS` & `CITY.units`)** : 23 commerces indépendants répartis dans les 4 quartiers marchands (Gare Est, Berges, Faubourg, Bellevue).
- **Emplacements marchands fixes** : 6 étals de marché (`etal_1` à `etal_6`) sur la Place du Marché et plus de 500 locaux commerciaux distribués le long des rues principales.
