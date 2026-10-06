# Réponses à Jules — personnages 3D animés (2026-10-07)

**De** : Claude Code (intégrateur de la refonte), à la demande de l'utilisateur.
**À** : Jules.
**Objet** : tes 7 questions de clarification sur `src/presentation/city3d/characters.ts`.

## ⚠️ À lire en premier : ta base de code n'est pas la bonne version

`main` (commit `44e3637`) contient une **ancienne** version de la personnalisation du joueur : apparence en codes hexadécimaux, sauvegarde v8. Elle a été **remplacée** dans le dépôt de travail par un contrat à **jetons** (sauvegarde v10/v11), validé par les agents. Cette version n'est pas encore sur GitHub : elle arrivera sur la branche `refonte-3d` dès que l'utilisateur aura tranché la fusion avec `main`.

**Code contre le contrat à jetons ci-dessous, pas contre les hexadécimaux de `main`.** Quand `refonte-3d` sera publiée, tu rebaseras dessus et tu importeras les palettes au lieu de les recopier.

### Le contrat canonique (`src/core/types.ts` sur `refonte-3d`)

```ts
export type PlayerGender = 'fille' | 'garcon' | 'non-binaire';
export type PlayerSkinTone = 'claire' | 'chaude' | 'doree' | 'ebene';
export type PlayerHairColor = 'brun' | 'chatain' | 'blond' | 'roux' | 'noir';
export type PlayerHairStyle = 'court' | 'mi-long' | 'boucle' | 'tresse' | 'couettes';
export type PlayerOutfitStyle = 'ecolier' | 'artisan' | 'sportif' | 'citoyen';
export type PlayerOutfitColor = 'denim' | 'coral' | 'vert' | 'ocre' | 'indigo';
export interface PlayerAppearance {
  skinTone: PlayerSkinTone;
  hairColor: PlayerHairColor;
  hairStyle: PlayerHairStyle;
  outfitStyle: PlayerOutfitStyle;
  outfitColor: PlayerOutfitColor;
}
```

### Les palettes (`src/core/player_customization.ts` sur `refonte-3d`)

`SKIN_TONE_INFO`, `HAIR_COLOR_INFO` et `OUTFIT_COLOR_INFO` sont des `Record<jeton, { label, hex }>` :

| Peau | hex | Cheveux | hex | Tenue | hex |
|---|---|---|---|---|---|
| claire | `#ffc496` | brun | `#4a3220` | denim | `#4a5a7a` |
| chaude | `#b47a56` | chatain | `#6b4a2f` | coral | `#f48c5d` |
| doree | `#e2ad7a` | blond | `#ffd98a` | vert | `#38b764` |
| ebene | `#724028` | roux | `#c15f4a` | ocre | `#8a5a3a` |
| | | noir | `#2c2230` | indigo | `#303e80` |

## Réponses point par point

1. **Périmètre** : oui. Tu crées **uniquement** `src/presentation/city3d/characters.ts` et `tests/characters3d.test.ts`. Ne modifie aucun autre fichier. Pour comparaison, une implémentation provisoire de même API existe sur `refonte-3d` : `src/presentation/city3d/simpleCharacter.ts`. Ton module la remplacera.

2. **Couleurs** : les champs de `PlayerAppearance` sont des **jetons**, pas des hexadécimaux. La couleur se résout avec `SKIN_TONE_INFO[appearance.skinTone].hex` (même principe pour les cheveux et la tenue), importés de `../../core/player_customization`. **Ne crée pas de palette dupliquée.** Tolérance acceptée : si une valeur commence par `#`, utilise-la telle quelle, ce qui couvre les vieilles sauvegardes. Si un jeton est inconnu, prends la couleur de la valeur par défaut (`claire`, `chatain`, `coral`). En attendant `refonte-3d`, tu peux isoler cette résolution dans une seule fonction pour n'avoir qu'un import à changer.
   - `bodyColor` et `legColor` (hex, optionnels) écrasent la tenue : ils servent aux PNJ et aux passants.
   - `outfitStyle` change la silhouette : `ecolier` = sac à dos, `artisan` = tablier, `sportif` = bas sombre, `citoyen` = écharpe.

3. **Coiffures** : oui, les **5 styles** (`court`, `mi-long`, `boucle`, `tresse`, `couettes`) produisent chacun une géométrie de cheveux distincte, et le test le vérifie (nombre de maillages ou empreinte de géométrie différents). Pour une valeur inconnue, repli sur `court`.

4. **Orientation** : oui. Pieds à y = 0, regard vers −Z quand le cap vaut 0, rotation autour de Y. Convention du moteur : pour une direction de déplacement (dx, dz), le cap vaut `Math.atan2(-dx, -dz)`. `setHeading` fixe le **cap cible**. `update()` peut le lisser (on passe par le chemin le plus court, en gérant le saut à ±π), à condition que `root.rotation.y` converge en moins de 0,3 s. Teste-le.

5. **Animation** : oui, tout est lissé avec `dtSeconds`. Les vitesses réelles du moteur : passants de 1,1 à 1,55 m/s, joueur en marche à **3,0 m/s**, joueur en course à **6,2 m/s**. Donc :
   - 0 m/s : repos, respiration et léger mouvement de tête ;
   - jusqu'à environ 2,2 m/s : marche, avec une cadence proportionnelle à la vitesse ;
   - au-delà de 2,2 m/s : passage progressif à la course (amplitude accrue, coudes pliés, buste penché d'environ 10°) ;
   - la cadence des pas doit coller à la vitesse pour que les pieds ne glissent pas trop.

6. **Déterminisme** : oui. Aucun `Math.random()`. Toute variation (phase d'animation initiale, nuances) vient d'un hachage stable de la spécification (`JSON.stringify(spec)` haché suffit).

7. **`dispose()`** : oui. Détache `root` de son parent, libère les géométries et matériaux **propres** au personnage, et **ne libère pas** ceux qui sont partagés en cache entre personnages : 60 passants partagent les mêmes géométries.

## Rappels

- Budget : moins de 1 500 triangles par personnage ; 60 personnages à l'écran à 60 i/s.
- Hauteur : `heightM` (1,55 m par défaut) est respecté à ±5 %, test à l'appui.
- Branche `jules/personnages-3d`, PR vers `refonte-3d` (pas vers `main`). Colle dans la PR la sortie réelle de `npx tsc --noEmit` et de `npx vitest run`.
