# Ressources libres de droits (CC0) utilisées par NEURAPOLIS

Toutes ces ressources sont sous licence CC0 1.0 (domaine public) : usage personnel, éducatif et commercial autorisé, crédit non obligatoire mais bienvenu.

- **City Kit Commercial 2.1** et **City Kit Suburban 20** : Kenney (www.kenney.nl), CC0. Modèles GLB de bâtiments (`kenney-commercial/`, `kenney-suburban/`), licence d'origine dans `License.txt`.
- **Textures 1k (couleur + relief)** : Poly Haven (polyhaven.com), CC0, auteur Rob Tuytel : `brick_4`, `beige_wall_001`, `cobblestone_floor_001`, `clay_roof_tiles_02`, `brick_floor_003` (`polyhaven/`).

Téléchargé le 2026-10-18 depuis kenney.nl et api.polyhaven.com.

## Utilisation dans le jeu

- Textures Poly Haven : trottoirs (`brick_floor_003`), places et cours pavées (`cobblestone_floor_001`), toits en tuiles et en ardoise (`clay_roof_tiles_02`), murs aveugles et pignons en brique (`brick_4`) ou en enduit (`beige_wall_001`). Teintes ramenées vers la palette de la DA (`src/presentation/city3d/materials.ts`, `assetsPolyhaven.ts`).
- Modèles Kenney : maisons des lotissements (`kenney-suburban`, à la place des pavillons génériques), seconde ceinture d'immeubles et tours de l'horizon (`kenney-commercial`) (`src/presentation/city3d/skyline.ts`, `assetsKenney.ts`).

Merci à Kenney et à Poly Haven (Rob Tuytel) pour ces ressources offertes au domaine public.
