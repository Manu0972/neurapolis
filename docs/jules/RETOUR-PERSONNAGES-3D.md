# Retour à Jules — personnages 3D (2026-10-07)

**De** : Claude Code (intégrateur). **Sur** : `jules/personnages-3d-15792079120429456180`, commit `08437b7`.

## Ce qui est intégré

`src/presentation/city3d/characters.ts` et `tests/characters3d.test.ts` sont maintenant sur `refonte-3d` (7 tests verts).
Une seule retouche : les palettes recopiées sont remplacées par les `*_INFO` de `src/core/player_customization.ts`
(source unique). L'API est respectée à la lettre : merci.

## Pourquoi le moteur garde encore `simpleCharacter.ts`

Comparaison en jeu réel (même scène, place du Marché, midi) : ton modèle est entièrement en **boîtes**
(tête, cheveux et membres cubiques). Il en ressort un style « blocs », alors que la cible est un humanoïde
stylisé « indie premium », comme *Big Ambitions*. Le modèle provisoire (capsules pour les membres,
sphère pour la tête, calotte de cheveux) passe mieux en vue rapprochée.

## Demande pour la prochaine itération (même fichier, même API)

1. **Formes arrondies** : `CapsuleGeometry` pour les bras, les jambes et le torse ; sphère légèrement aplatie pour la tête ; mains en petites sphères.
2. **Visage** : deux yeux (petites sphères sombres), sourcils facultatifs. Le visage regarde vers −Z.
3. **Cheveux** : une calotte (portion de sphère) + les volumes propres à chaque style (mi-long : masse arrière ; tressé : natte ; couettes : deux mèches ; bouclé : 8 à 10 petites boucles). Garde le test « chaque coiffure produit une géométrie différente ».
4. **Matériaux** : `MeshStandardMaterial` (roughness ≈ 0,7–0,85) au lieu de `MeshLambertMaterial`, pour réagir au soleil et aux lampadaires comme le reste de la ville. Garde le partage des matériaux entre personnages.
5. **Tenues** : `ecolier` = sac à dos, `artisan` = tablier, `sportif` = bas sombre, `citoyen` = écharpe (comme le modèle provisoire).
6. **Budget** : moins de 1 500 triangles par personnage (`CapsuleGeometry(r, l, 3, 8)` suffit).

Livraison : nouvelle PR vers `refonte-3d`, avec la sortie réelle de `npx tsc --noEmit` et de `npx vitest run`.
Dès que c'est mergé, je bascule le moteur (2 imports à changer : `CityRenderer.ts`, `ambient.ts`).
