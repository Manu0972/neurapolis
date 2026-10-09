# Étude Approfondie des Canons Esthétiques : Webtoon, Anime Moderne, Seinen Manga, Semi-Réalisme Digital & Garde-Robes Modulaires

**Auteur** : Explorer 2 (Webtoon Aesthetic Specialist Gen2)  
**Date** : 2026-10-08  
**Référence Projet** : GLM Character Aesthetic Suite — Milestone M1 (Generation 2)  
**Emplacement cible** : `C:\Users\laqui\Documents\glm\docs\character_aesthetic\webtoon_aesthetic_research.md`  
**Documents associés** : `C:\Users\laqui\Documents\glm\docs\character_aesthetic\corpus_analysis.md`, `ORIGINAL_REQUEST.md`

---

## Sommaire Exécutif

Cette étude fournit le socle théorique, anatomique et technique de référence pour concevoir des personnages de niveau professionnel dans les registres graphiques contemporains : **Webtoon Action coréen (Manhwa)**, **Anime Japonais Moderne**, **Seinen Manga Détaillé**, et **Semi-Réalisme Digital (ArtStation / Pinterest)**. 

Elle synthétise les règles de composition graphique, les proportions biométriques masculines et féminines sans censure artificielle des morphologies réelles, l'architecture des garde-robes modulaires (K-streetwear, techwear, fantasy épurée, arts martiaux, tailoring classique, et la dualité *duty vs off-duty*), ainsi qu'une matrice complète de **prompt engineering** calibrée pour Midjourney v6, Stable Diffusion XL (SDXL) et Flux.1.

---

## 1. Fondations Théoriques des Canons Visuels Contemporains

### 1.1 L'Émergence du Standard Manhwa / Webtoon Vertical
Le webtoon coréen a redéfini les codes de la narration séquentielle mondiale au cours de la dernière décennie :
- **Format vertical (Infinite Scroll)** : La lecture sur smartphone impose une composition axiale centrée, des silhouettes élancées lisibles en défilement rapide et des ruptures d'échelle dramatiques (très gros plans d'yeux suivis de pleines pages de silhouettes en pied).
- **Hybridation technique** : Le webtoon haut de gamme (ex. studios *Redice Studio*, *YLab*) fusionne trois traditions artistiques distinctes :
  1. *L'encrage dynamique du manga* (lignes expressives, vitesse, hachures directionnelles).
  2. *La colorisation numérique occidentale* (dégradés souples, masques d'écrêtage, occlusion ambiante).
  3. *Le post-traitement de l'animation et du jeu vidéo* (particules lumineuses, bloom optique, lentilles anamorphiques, aberrations chromatiques légères, profondeur de champ cinématographique).

### 1.2 La Convergence Pinterest & ArtStation
Sur les plateformes d'art contemporain (Pinterest, ArtStation, Cara), les créateurs de concept art et de character design ont développé un consensus esthétique fondé sur :
- **La lisibilité de silhouette (Shape Language)** : Des contours extérieurs immédiatement identifiables même réduits à une vignette de 64x64 pixels.
- **La hiérarchie des niveaux de détail (Rule of Thirds of Detail)** : 70% de surfaces calmes et reposantes (aplats de tissu, peau lisse), 20% de détails secondaires (plis, poches, mèches), 10% de micro-détails ultra-focalisés (iris ciselés, surpiqûres, reflets métalliques, vascularité).
- **L'expressivité des carnations et des matières** : Refus de la peau plate monocolore au profit de la translucidité sous-cutanée (*Subsurface Scattering*) et d'un étalonnage lumineux riche.

### 1.3 L'Impératif Anatomique Réel et Sans Censure
Les univers de fiction matures contemporains rejettent la stylisation édulcorée ou aseptisée :
- **Morphologies masculines affirmées** : Respect scrupuleux des insertions musculaires, de la structure squelettique (clavicules, arcades sourcilières, reliefs de la mâchoire, crêtes iliaques), et des variations de masse corporelle (de l'athlète sec au colosse de puissance).
- **Morphologies féminines naturelles et puissantes** : Représentation sans compromis de la biomécanique réelle, refus des silhouettes tubulaires sans relief, valorisation des courbures naturelles (bassin féminin, galbe fessier, retombée gravitationnelle de la poitrine en goutte d'eau plutôt qu'en sphères rigides, musculature abdominale et cuisses galbées).

---

## 2. Analyse Approfondie des 4 Grands Styles Majeurs

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LES 4 GRANDS AXES VISUELS DU PROJET                  │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ 1. WEBTOON       │ 2. ANIME         │ 3. SEINEN        │ 4. SEMI-      │
│    ACTION        │    MODERNE       │    MANGA         │    RÉALISME   │
│ (Solo Leveling)  │ (Ufotable/MAPPA) │ (Miura / Boichi) │ (ArtStation)  │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

---

### 2.1 Style 1 : Webtoon Action / High-Fantasy
*Références phares : Solo Leveling (DUBU / Redice Studio), Omniscient Reader's Viewpoint, The Boxer, Doom Breaker, Return of the Disaster-Class Hero.*

#### A. Traitement du Trait et de la Silhouette
- **Lineart vectoriel incisif** : Tracé noir franc d'épaisseur variable (`line weight modulation`). Les contours extérieurs de la silhouette sont renforcés (2 à 3 pixels d'épaisseur), tandis que les détails internes du visage et des tissus restent fins et effilés.
- **Angles acérés** : Les pointes de cheveux, les revers de col, les pointes de dagues et les mâchoires se terminent par des angles aigus prononcés pour conférer une impression de vélocité et de danger.
- **Échelle corporelle héroïque** : Proportions de 8,5 à 9 têtes. Jambes délibérément allongées (représentant environ 55 à 60% de la hauteur totale du corps).

#### B. Ombrage, Lumière et Post-Processing
- **Cel-shading à 2-3 tons enrichi de gradients** : Une base de couleur locale (`flat color`), une ombre dure franche découpant le volume, adoucie par un aérographe subtil le long du terminateur d'ombre.
- **Occlusion Ambiante d'Encre Noire** : Les creux anatomiques (aisselles, sillon intermammaire, nombril, jonction cou/clavicule, plis profonds des vêtements) sont scellés par des aplats de noir pur (#000000).
- **Émissions de Lumière Diégétique (Eye-Glow & Auras)** :
  - *Eye-Glow* : Traînée lumineuse partant des pupilles (cyan électrique `#00f0ff`, pourpre néon `#bd00ff`, ou or ambré `#ffb700`), traitée avec un mode de fusion *Color Dodge* ou *Add (Glow)*.
  - *Particules magiques flottantes* : Braises d'énergie, éclairs d'arc électrique condensés autour des armes et des poings.
  - *Rim lighting violent* : Contre-jour intense et rasant blanc bleuté découpant les épaules et la chevelure sur un fond sombre.

#### C. Expressions et Regard
- Regard perçant en coin (*glare*), sourcils froncés en V net, ombre projetée par la frange descendant jusqu'au milieu des yeux pour accentuer l'obscurité du regard.
- Rictus confiant asymétrique (*subtle smirk*), lèvre inférieure discrètement marquée par un point de rehaut blanc et une ombre sous-labiale profonde.

---

### 2.2 Style 2 : Anime Japonais Moderne
*Références phares : Ufotable (Demon Slayer, Fate/stay night Heaven's Feel), MAPPA (Jujutsu Kaisen, Chainsaw Man, Hell's Paradise), Kyoto Animation (Violet Evergarden, Hyouka), CloverWorks.*

#### A. Traitement du Trait et Décomposition Studio
- **Ligne ultra-propre et tempérée** : Tracé net, souvent coloré en brun très sombre ou gris anthracite plutôt qu'en noir brut, permettant une intégration plus douce avec la palette de couleurs.
- **Chevelure géométrique à mèches articulées** : Cheveux découpés en rubans géométriques distincts (racines larges, effilement fluide, reflets horizontaux en halo en forme d'anneau angulaire dit "ange ring").
- **Double paupière et contours de cils géométriques** : Ligne supérieure des cils stylisée en trapèze arrondi, double pli de paupière tracé avec une finesse chirurgicale.

#### B. Les Yeux Multicouches (L'Œil Anime Contemporain)
L'iris anime moderne est une œuvre d'art composite à 6 strates superposées :
1. *Base Color* : Teinte locale saturée (ex. améthyste, rubis, émeraude).
2. *Top Dark Gradient* : Dégradé descendant sombre occupant la moitié supérieure de l'iris.
3. *Pupille géométrique* : Pupille noire nette, souvent entourée d'une corolle stellaire ou d'anneaux concentriques.
4. *Inner Caustic / Crescent Glow* : Croissant lumineux dans le tiers inférieur de l'iris (mode *Screen* / *Overlay*).
5. *Catchlights spéculaires* : 1 à 3 perles de lumière blanche pure (#ffffff), l'une dominante vers la source lumineuse, les autres plus petites en reflet d'ambiance.
6. *Ombre cornéenne* : Ombre projetée de la paupière supérieure sur le globe oculaire (sclérotique bleutée/gris doux, jamais blanche pure).

#### C. Post-traitement et Nuances des Studios
- **Ufotable** : Éclairages volumétriques digitaux intenses, particules d'étincelles 3D parfaitement intégrées, bloom diffus sur les reflets d'acier et les yeux, contrastes colorimétriques chauds/froids exacerbés.
- **MAPPA** : Rendu plus brut et tactile, présence de fines hachures d'angoisse ou d'effort sur les joues et le nez, cernes expressifs, mouvements d'animation caméra à l'épaule traduits graphiquement par des déformations de perspective dynamiques.
- **Kyoto Animation** : Éclairage d'ambiance doux et vaporeux (*soft focus*), tons pastel lumineux, micro-expressions oculaires et labiales d'une infinie subtilité émotionnelle.

---

### 2.3 Style 3 : Seinen Manga Poussé (Encre, Hachures & Matière)
*Références phares : Kentaro Miura (Berserk), Takehiko Inoue (Vagabond, Real), Boichi (Sun-Ken Rock, Origin), Hiroaki Samura (L'Habitant de l'infini), Shin-ichi Sakamoto (Innocent).*

#### A. Traitement à l'Encre de Chine et Hachures Denses
- **Le Cross-Hatching comme modelé tridimensionnel** : Pas de dégradé mou numérique. Le volume est sculpté exclusivement par la densité, la direction et le croisement des traits de plume (G-Pen, Maru-Pen) ou les coups de pinceau (*fude pen*).
- **Lignes de tension musculaire** : Chaque faisceau musculaire (sterno-cléido-mastoïdien, faisceaux claviculaires des pectoraux, triceps, quadriceps) est strié de lignes parallèles suivant le sens de la contraction.
- **Rendu tactile de la matière** :
  - *Cuir* : Craquelures blanches réservées sur fond noir, usure abrasive sur les coudes et genoux.
  - *Acier forgé* : Ébréchures, impacts, reflets hachurés droits, patine d'huile et de sang séché.
  - *Chair blessée ou éprouvée* : Veines saillantes, cicatrices en relief, perles de sueur texturées.

#### B. Intensité Psychologique et Vérité Anatomique
- **Proportions réalistes et pesantes** : 7,5 à 8 têtes. Le centre de gravité est bas, l'ancrage au sol est massif.
- **Expressions faciales viscérales** : Rides d'expression plissées (glabelle plissée, sillon naso-génien creusé par la colère ou l'épuisement), lèvres entrouvertes révélant la denture avec précision, veines temporales palpitantes sous la peau du front.
- **Drapé lourd et réaliste** : Les tissus ne flottent pas arbitrairement ; ils retombent avec leur poids réel en formant des plis en accordéon, des plis tubulaires aux coudes et des tensions aux articulations.

---

### 2.4 Style 4 : Semi-Réalisme Digital & Concept Art Haut de Gamme
*Références phares : ArtStation Master artists, Pinterest concept feeds, Riot Games (Splash Arts League of Legends, Cinematic Design Arcane), WLOP (Ghostblade), Guweiz, Ruan Jia, Jeremy Mann.*

#### A. L'Approche "Painterly" et le Contrôle des Bords (Edge Control)
- Disparition de la ligne d'encrage noire fermée. Le sujet existe par les transitions de valeurs lumineuses et de teintes.
- **La trinité des bords** :
  1. *Hard Edges* (Bords durs) : Silhouettes contrastées sur fond clair, contours des yeux, reflets spéculaires d'armures métalliques.
  2. *Soft Edges* (Bords doux) : Dégradés des joues, rondeur des épaules, plis doux de tissus en soie ou jersey.
  3. *Lost Edges* (Bords fondus) : Zones d'ombre se fondant complètement dans l'obscurité de l'arrière-plan sans délimitation visible.

#### B. La Diffusion Sous-Cutanée (Subsurface Scattering - SSS)
La peau humaine est un matériau semi-translucide :
- Lorsque la lumière frappe l'épiderme, elle pénètre, se disperse dans le derme vascularisé et ressort avec une teinte rouge/orangée saturée le long du **terminateur d'ombre** (la ligne de démarcation entre la zone éclairée et la zone d'ombre).
- *Zones clés de SSS* : Pavillons des oreilles rétro-éclairés (rouge carmin éclatant), arête et ailes du nez, pulpe des doigts, jonction des paupières, renflements des lèvres.

#### C. Schéma d'Éclairage Cinématographique 3 Points
1. **Key Light (Lumière Principale)** : Source directionnelle dominante (ex. soleil couchant 2500K ou projecteur chaud), définissant les volumes et projetant des ombres portées nettes.
2. **Fill Light (Lumière de Remplissage)** : Source diffuse secondaire à 90° de la principale, souvent froide (bleutée ou cyan du ciel, 6500K-8000K), débouchant les ombres pour préserver la lisibilité sans détruire le relief.
3. **Rim Light / Kicker (Lumière de Détachement)** : Lumière rasante arrière très vive découpant la silhouette, créant une ligne brillante continue sur les cheveux, les épaules et le profil.

---

## 3. Matrice Comparative des 4 Styles Majeurs

| Caractéristique | 1. Webtoon Action | 2. Anime Moderne | 3. Seinen Manga | 4. Semi-Réalisme Digital |
|---|---|---|---|---|
| **Ligne / Lineart** | Vectoriel noir franc, bords acérés, modulation d'épaisseur | Fin, coloré (brun/anthracite), épuré, courbes parfaites | Encre de Chine, hachures denses croisées, plume & pinceau | Quasiment invisible, bords peints modulés (Hard/Soft/Lost) |
| **Ombrage dominant** | Cel-shading 2-3 tons + gradients + occlusion noire | Cel-shading 2 tons net + highlights nets | Hachures directionnelles manuelles + trames de points | Pinceau texturé (painterly), dégradés continus, occlusion douce |
| **Peau & Chair** | Pêche/ivoire éclatant, ombres douces, reflets blancs | Aplats parfaits, légère teinte d'ombre violette/rosée | Trame de gris, hachures musculaires, tension veineuse | Subsurface scattering (SSS) rouge/orangé au terminateur |
| **Rendu des Yeux** | Amande acérée, pupille brillante, halo lumineux magique | Très grand iris multicouches, caustiques, 3 catchlights | Pupille intense, iris détaillé réaliste, cernes d'angoisse | Iris photoréaliste, diffraction lumineuse, humidité cornéenne |
| **Cheveux** | Mèches effilées triangulaires, reflets en aplats nets | Rubans géométriques, halo horizontal régulier | Cheveux mèche à mèche, texture réaliste encrée | Touffes peintes en masse volumique + micro-mèches fines |
| **Post-processing** | Bloom néon, particules flottantes, lentilles anamorphiques | Composition numérique, soft focus, flares d'anime | Pur monochrome noir & blanc, pas de flou numérique | Grain argentique cinématographique, aberration chromatique |
| **Proportions** | 8.5 à 9 têtes (héroïque, jambes très longues) | 7 à 8 têtes (stylisé harmonieux) | 7.5 à 8 têtes (lourd, anatomie biomédicale) | 7.5 à 8.5 têtes (photoréaliste stylisé haut de gamme) |

---

## 4. Templates de Character Design (Masculins & Féminins)

```
        CANONS DES RATIOS CORPORELS (ÉCHELLE EN TÊTES)
  
   [8.5 - 9 TÊTES]                    [7.8 - 8 TÊTES]
      (Masculin Hunter)                 (Féminin Athlétique / Matrone)
   ┌───┐ 1. Sommet crâne             ┌───┐ 1. Sommet crâne
   │   │                             │   │
   └───┘ 2. Menton                   └───┘ 2. Menton
     │                                 │
   ──┴── 3. Mamelons / Pectoraux     ──┴── 3. Ligne de poitrine
     │                                 │
   ──┴── 4. Nombril / Crêtes iliaques──┴── 4. Taille marquée
     │                                 │
   ──┴── 5. Entrejambe / Pubis       ──┴── 5. Bassin large / Pubis
     │                                 │
   ──┴── 6. Mi-cuisses               ──┴── 6. Mi-cuisses galbées
     │                                 │
   ──┴── 7. Genoux                   ──┴── 7. Genoux
     │                                 │
   ──┴── 8. Mi-mollets               ──┴── 8. Mi-mollets
     │                                 │
   ──┴── 9. Sol                      ──┴── Sol
```

---

### 4.1 Biométrie et Paramètres Faciaux Communs
Pour piloter précisément la création par les agents et générateurs, chaque visage est défini par des descripteurs biométriques rigoureux :
- **Canthal Tilt (Inclinaison de l'œil)** :
  - *Positif (+3° à +8°)* : Coin externe de l'œil plus haut que le coin interne. Donne un regard félin, prédateur, séduisant et confiant (idéal protagoniste webtoon, assassin, duelliste).
  - *Neutre (0°)* : Regard franc, calme, analytique (idéal détective, sage, médecin).
  - *Négatif (-3° à -5°)* : Coin externe plus bas. Donne un air mélancolique, doux ou fatigué (personnages slice-of-life, vétérans).
- **Ligne Mandibulaire (Jawline)** :
  - *Masculin héroïque* : Angle gonien marqué (110°-120°), menton carré ou biseauté avec dépression mentonnière discrète.
  - *Masculin androgyne/K-Idol* : Mâchoire en V doux (*V-line jaw*), menton fin et délicat.
  - *Féminin* : Ovale régulier, ramus mandibulaire effilé, menton délicat mais avec une structure osseuse suffisante pour soutenir les expressions.
- **Arête Nasale & Philtrum** :
  - Profil rectiligne ou très légèrement busqué chez l'homme d'action.
  - Arête fine, nez légèrement retroussé ou droit avec pointe arrondie subtile chez la femme.
  - Philtrum (gouttière sous-nasale) bien défini créant l'ancrage de la lèvre supérieure.

---

### 4.2 Les 4 Archétypes Masculins Majeurs

#### Archétype M1 : Le Hunter / Duelliste Élancé (The Shadow Monarch Type)
- **Biométrie** : 20-26 ans | 186 cm | 82 kg | Proportions : 8.8 têtes.
- **Silhouette & Musculature** :
  - *V-Taper acéré* : Rapport largeur d'épaules sur taille de 1.618 (nombre d'or).
  - Taux de masse grasse faible (8-10%) : abdominaux 8-pack sculptés, dentelés antérieurs engrenés dans les obliques, sillon d'Adonis profond.
  - Bras déliés et musclés : deltoïdes striés, triceps en fer à cheval, avant-bras vascularisés (veine céphalique apparente).
- **Visage & Chevelure** :
  - Pommettes hautes, canthal tilt positif prononcé, iris cyan/pourpre lumineux à pupille étroite.
  - Coupe *Two-Block* coréenne ou mèches déstructurées ondulées (*comma hair*) retombant sur les yeux.
- **Postures signatures** :
  - Mains dans les poches avec manteau claquant au vent, regard oblique plongeant vers le spectateur.
  - Dégainage éclair d'une main, silhouette en torsion dynamique.

#### Archétype M2 : Le Tank / Colosse Imposant (The Juggernaut Type)
- **Biométrie** : 28-38 ans | 198 cm | 120 kg | Proportions : 8.0 têtes (tête plus massive pour équilibrer la corpulence).
- **Silhouette & Musculature** :
  - Carrure titanesque : Largeur d'épaules équivalente à 3 fois la largeur de la tête.
  - Trapèzes surélevés rejoignant la nuque sans transition douce, grand dorsal colossal élargissant le torse en baril.
  - Épaisse couche musculaire fonctionnelle (15-18% masse grasse) : pectoraux épais comme des boucliers, abdominaux massifs en bloc ("powerlifter core"), cuisses piliers.
- **Visage & Caractère** :
  - Mâchoire lourde carrée, barbe taillée de 3 jours ou barbe pleine dense, cicatrice discrète sur l'arcade sourcilière ou la tempe.
  - Regard calme, inébranlable, sourcils épais horizontaux dénotant une autorité protectrice.
- **Postures signatures** :
  - Bras croisés sur un torse immense, pieds fermement écartés à largeur d'épaules.
  - Épaule en avant prête à encaisser un choc d'armure, arme lourde posée au sol à deux mains.

#### Archétype M3 : Le Détective / Spécialiste Urbain (The Analytical Investigator)
- **Biométrie** : 25-34 ans | 180 cm | 74 kg | Proportions : 7.8 têtes (ancré dans le réalisme).
- **Silhouette & Musculature** :
  - Athlétisme fonctionnel et sec (12-14% masse grasse), silhouette élancée adaptée à la dissimulation sous des vêtements de ville.
  - Légère asymétrie posturale humaine (légère flexion de tête au travail, posture relâchée mais vigilante).
  - Mains aux doigts longs et agiles, veinées, révélant la précision manuelle et l'usage d'outils.
- **Visage & Caractère** :
  - Traits fins, regard intelligent et perçant derrière des lunettes à monture métallique ronde ou octogonale.
  - Cernes légers traduisant le travail nocturne, demi-sourire narquois au coin des lèvres.
- **Postures signatures** :
  - Ajustement des lunettes de l'index avec cigarette ou café fumant dans l'autre main.
  - Feuilletage d'un carnet de notes ou manipulation d'un badge électronique avec regard en biais.

#### Archétype M4 : L'Artiste Martial / Moine Urbain (The Striker)
- **Biométrie** : 19-27 ans | 175 cm | 70 kg | Proportions : 8.2 têtes.
- **Silhouette & Musculature** :
  - Musculature hyper-dense, sans un gramme de graisse superflu (6-8% masse grasse), corps comme une corde d'arc tendue.
  - "Demon back" sculpté : dos en sapin de Noël avec rhomboïdes, grands ronds et érecteurs du rachis hypertrophiés par les tractions et frappes.
  - Articulations et extrémités endurcies : phalanges épaissies par la frappe, tendons d'Achille vigoureux, mollets hauts et nerveux.
- **Visage & Caractère** :
  - Concentration zen impassible, regard félin focalisé, pommettes saillantes, cheveux courts en brosse ou rasés sur les côtés avec couette de guerrier (*top knot*).
- **Postures signatures** :
  - Garde basse de boxe pieds-poings, poids du corps sur l'arrière prêt à pivoter.
  - Méditation en tailleur, dos droit comme un sabre, respiration ventrale visible.

---

### 4.3 Les 4 Archétypes Féminins Majeurs

#### Archétype F1 : L'Héroïne Athlétique / Chasseresse (The Valkyrie Hunter)
- **Biométrie** : 20-27 ans | 175 cm | 65 kg | Proportions : 8.2 têtes.
- **Silhouette & Musculature (Sans Censure)** :
  - Morphologie athlétique vigoureuse : épaules rondes et musclées, clavicules saillantes, abdominaux toniques (ligne blanche centrale et sillon vertical visible sans sécheresse morbide).
  - Galbe naturel : poitrine tonique respectant la biomécanique en mouvement, taille marquée (ratio taille/hanches 0.70), fessiers et quadriceps puissants forgés par le sprint et le saut.
- **Visage & Chevelure** :
  - Regard félin à canthal tilt positif, mâchoire nette et féminine, pommettes hautes subtilement rehaussées d'un fard chaud.
  - Queue de cheval haute dynamique laissant s'échapper quelques mèches rebelles, ou tresse de combat asymétrique.
- **Postures signatures** :
  - Réajustement des gants de cuir avec une expression de défi assuré.
  - Silhouette en contre-plongée, arc ou fusil de précision en bandoulière, cheveux balayés par le vent.

#### Archétype F2 : La Spécialiste Tactique / Sniper (The Black Ops Phantom)
- **Biométrie** : 22-29 ans | 170 cm | 58 kg | Proportions : 7.8 têtes.
- **Silhouette & Musculature** :
  - Corps affûté, souple et agile d'acrobate militaire (14-16% masse grasse), grande aisance de reptation et d'escalade.
  - Membres longs et précis, maintien dorsal droit, silhouette fine et aérodynamique.
- **Visage & Caractère** :
  - Yeux froids métalliques (gris acier ou vert émeraude), regard imperturbable, masque tactique ou micro-oreillette.
  - Carré court asymétrique effilé ou cheveux rasés sur une tempe (*undercut*).
- **Postures signatures** :
  - Accroupie en appui sur un genou (*crouch stance*), index le long du pontet de l'arme, respiration retenue.
  - Regard en coin au-dessus de l'épaule alors qu'elle referme le col de sa veste tactique.

#### Archétype F3 : La Matrone / Scientifique / Cadre Supérieure Mature (The Sovereign Matron)
- **Biométrie** : 32-45 ans | 172 cm | 68 kg | Proportions : 7.8 têtes.
- **Silhouette & Musculature (Sans Censure)** :
  - Morphologie en sablier affirmée et voluptueuse : poitrine généreuse naturelle à la retombée douce en goutte d'eau, taille cintrée, hanches larges et pleines (ratio taille/hanches 0.68) avec cuisses épanouies.
  - Port de tête majestueux, épaules dégagées, posture respirant l'autorité intellectuelle, hiérarchique ou scientifique.
- **Visage & Caractère** :
  - Beauté mûre sophistiquée, regard pénétrant empreint de sagesse et de discernement, grain de beauté sous l'œil ou à la lèvre.
  - Lunettes de vue fines sans monture ou à monture écaille, chignon bas élégant (*chignon flou*) avec longues boucles encadrant le cou.
- **Postures signatures** :
  - Debout, tenant une tablette de données ou un dossier, toisant son interlocuteur d'un air d'analyse clinique.
  - Assise sur un fauteuil en cuir, jambes croisées avec élégance, tasse de thé ou stylo plume en main.

#### Archétype F4 : La Duelliste Agile / Lame Rapide (The Swift Blade)
- **Biométrie** : 18-24 ans | 165 cm | 52 kg | Proportions : 8.0 têtes.
- **Silhouette & Musculature** :
  - Morphologie fine, déliée et aérienne de danseuse ou d'escrimeuse d'élite.
  - Taille très fine, souplesse vertébrale maximale, jambes fuselées aux chevilles fines et nerveuses.
- **Visage & Caractère** :
  - Visage gracieux aux grands yeux vifs et expressifs, lueur d'espièglerie ou de concentration mortelle.
  - Cheveux longs soyeux flottant librement ou retenus par un ruban de soie/épingle traditionnelle.
- **Postures signatures** :
  - En appui sur la pointe des pieds, rapière ou sabre court pointé vers l'avant, fente prête à jaillir.
  - Révérence souple et provocatrice avant le duel.

---

## 5. Garde-Robes Modulaires & Richesse des Matières

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE GARDE-ROBES MODULAIRES                    │
├────────────────────┬────────────────────┬───────────────────────────────┤
│ 1. K-STREETWEAR    │ 2. TECHWEAR        │ 3. FANTASY ÉPURÉE             │
│    (Oversize/Chic) │    (Cyber-tactique)│    (Noblesse & Aventure)      │
├────────────────────┼────────────────────┼───────────────────────────────┤
│ 4. ARTS MARTIAUX   │ 5. TAILORING       │ 6. DUALITÉ IDENTITAIRE        │
│    (Fusion Hanbok) │    (Sartorialisme) │    (Duty vs Off-Duty)         │
└────────────────────┴────────────────────┴───────────────────────────────┘
```

---

### 5.1 K-Streetwear Contemporain (L'Esthétique Séoul / Hongdae)
Directement issu des meilleures planches de référence de notre corpus (ex. `d60a30da01d9b9ead9a3cd8fb1b3040e.jpg`, `téléchargé.png`) :
- **Silhouettes & Volumes** :
  - *Haut* : Hoodies ultra-lourds (450+ gsm) tombant en cloche, vestes universitaires (*varsity jackets*) bi-matières laine bouillie et manches cuir, t-shirts boxy à col serré dépassant sous des pulls col V sans manches.
  - *Bas* : Pantalons parachute en nylon mat, jeans wide-leg délavés aux genoux retombant avec de multiples plis d'accordéon sur les chaussures, pantalons cargo amples à poches soufflet décalées.
  - *Chaussures* : Baskets chunky de designer (semelles crantées sculpturales type Balenciaga Triple S, Salomon XT-6, ou Nike Dunk Low rétro bicolores).
- **Accessoires Clés** :
  - Casquettes de baseball à visière courbée brodées d'un logo discret, bonnets dockers courts laissant les oreilles découvertes.
  - Écouteurs supra-auriculaires métalliques portés en permanence autour du cou, sacoche bandoulière en cuir souple (*cross-body bag*), gobelet d'Iced Americano avec paille en main.
- **Textures & Rendu** : Toile de coton brute, denim épais texturé, molleton lourd, cuir mat patiné, œillets et zips argentés étincelants.

---

### 5.2 Techwear Urbain & Cyber-Tactique (Acronym / Guerrilla Group)
- **Silhouettes & Fonctionnalité** :
  - *Haut* : Vestes hardshell laminées 3 couches à cols cheminée hauts et capuches tempête, fermetures éclair étanches asymétriques YKK Aquaguard, gilets tactiques allégés portés sur sous-pulls techniques en mérinos stretch.
  - *Bas* : Pantalons cargo tactiques fuselés (*tapered fit*) avec sangles d'ajustement MOLLE à boucles magnétiques Fidlock, genoux articulés à pinces préformées.
  - *Chaussures* : Bottes de combat modernes zippées étanches en Cordura ou sneakers montantes gore-tex tout-terrain.
- **Palette & Finitions** :
  - Monochrome rigoureux : Noir mat (`carbon black`), gris anthracite (`slate gray`), vert sauge militaire (`olive drab`), blanc polaire.
  - Accents graphiques : Patchs d'identification velcro, sangles amovibles orange d'urgence ou cyan néon, mousquetons en titane noir.
- **Rendu des Tissus** : Surfaces déperlantes présentant des gouttelettes d'eau perlées, reflets satinés du nylon ripstop, robustesse mate du Kevlar.

---

### 5.3 Fantasy Épurée & Néo-Médiévale (Webtoon Noble / Dark Fantasy)
- **Élégance Aristocratique et Fonctionnelle** :
  - Pas d'armures baroques disproportionnées et importables. Le canon webtoon moderne privilégie les silhouettes d'escrimeur et de noblesse raffinée.
  - *Haut* : Justaucorps en cuir bouilli sur mesure épousant le torse, surcot brodé de fil d'argent, chemises en lin brut à col officier et manches bouffantes retenues par des manchettes en cuir sanglées.
  - *Bas* : Pantalons de cuir souple ou culottes d'équitation ajustées rentrées dans des bottes de cavalier en cuir fauve patiné montant sous le genou.
  - *Protections ciblées* : Plastron d'acier noir gravé, spalières asymétriques à une seule épaule pour préserver la mobilité du bras d'arme, cape courte fixée par une fibule héraldique.
- **Textures Clés** : Velours de soie aux reflets profonds, cotte de mailles fine rivetée brillant sous la tunique, cuir vieilli aux bords brunis par le voyage.

---

### 5.4 Arts Martiaux Traditionnels & Modernes (Fusion Hanbok / Gi)
- **Héritage Coréen & Asiatique Sublimé** :
  - *Jeogori Modernisé* : Veste croisée fermée par des rubans (*otgoreum*), revisitée dans des étoffes contemporaines (coton ripstop lourd ou lin mélangé).
  - *Baji & Wraps* : Pantalons bouffants traditionnels amples aux cuisses, solidement serrés des chevilles aux mollets par des bandes de tissu de lin ou des sangles de contention élastiques.
  - *Bandages & Mains* : Bandes de chanvre brut ou bandes de boxe protégeant les métacarpes et les poignets, laissant les doigts libres pour la saisie.
  - *Chaussures* : Chaussettes traditionnelles rembourrées (*beoseon*) renforcées d'une semelle en cuir souple ou sandales de corde tressée à la semelle de caoutchouc moderne.

---

### 5.5 Tailoring Classique & Sartorialisme Puissant
- **La Coupe Impériale / Bespoke Haute Couture** :
  - *Veste* : Veste croisée 6 boutons à revers de col en pointe ultra-larges (*peak lapels*), structurant les épaules par un rembourrage léger (*roped shoulders*), cintrée à la perfection sur le V-taper du torse sans aucun faux pli.
  - *Gilet* : Gilet d'homme d'affaires 5 boutons en laine peignée, dégageant une cravate en soie grenadine ou un col ouvert décontracté.
  - *Pardessus (The Overcoat)* : Manteau long en cachemire lourd descendant à mi-mollet, fendu dans le dos pour accompagner la marche à grande enjambée (élément signature de *Solo Leveling* et des webtoons urbains).
  - *Souliers & Horlogerie* : Souliers Richelieu en cuir glacé à bout fleuri, montre chronographe mécanique à cadran saphir et bracelet cuir.

---

### 5.6 La Dualité Vestimentaire : Duty vs Off-Duty
Observée comme un invariant majeur du corpus visuel (notamment dans la planche `2739eae297538531458ec3a191999736.jpg`) :

| Composante | Tenue de Service / Combat (**Duty**) | Tenue Privée / Repos (**Off-Duty**) |
|---|---|---|
| **Intention psychologique** | Rigueur, armure mentale, danger, hiérarchie, autorité | Vulnérabilité assumée, intimité, confort, authenticité |
| **Silhouette corporelle** | Corsetée, sanglée, élargie par les protections et étuis | Révélée dans sa souplesse naturelle, drapés épousant la peau |
| **Pièces du haut** | Uniforme blindé, gilet pare-balles, col rigide, sangles | T-shirt oversize col détendu, pull tricoté doux, débardeur |
| **Pièces du bas** | Pantalon tactique épais renforcé aux genoux, bottes lacées | Short de sport en molleton, bas de pyjama souple, pieds nus |
| **Chevelure & Visage** | Coiffure stricte attachée ou sous casquette, regard froid | Cheveux défaits ébouriffés, lunettes de repos, regard doux |
| **Palette de couleurs** | Noir mat, gris acier, vert olive, marine réglementaire | Crème, beige sable, pastel doux, blanc cassé, gris chiné |

---

## 6. Matrices de Prompt Engineering pour Modèles d'Images IA

Pour garantir un contrôle total aux agents d'orchestration (Claude Code, Antigravity) et aux pipelines de génération, voici les matrices de prompts et paramètres validés.

---

### 6.1 Matrice des Tokens par Style et Composante

| Bloc de Prompt | Webtoon Action | Anime Moderne | Seinen Manga | Semi-Réalisme Digital |
|---|---|---|---|---|
| **Pôle Style** | `korean webtoon action style, solo leveling aesthetic, dynamic colored manhwa art, crisp digital ink, redice studio quality` | `modern anime studio art, ufotable aesthetic, mappa animation style, high-end cel shading, clean lineart` | `detailed seinen manga style, kentaro miura ink style, boichi cross-hatching, fine pen lines, dark chiaroscuro ink` | `semi-realistic digital painting, artstation trending character design, painterly rendering, riot games splash art style` |
| **Rendu Lumière** | `glowing eye trail, neon aura particles, deep ambient occlusion, strong volumetric rim light, color dodge bloom` | `cinematic lighting, crisp cast shadows, vibrant caustics, soft atmospheric bloom, 3-point anime lighting` | `stark black ink shadows, dense cross-hatching shade, high contrast monochrome, directional harsh sunlight` | `subsurface scattering skin glow, 3-point cinematic lighting, soft key light, blue rim kicker, authentic PBR materials` |
| **Visage & Yeux** | `sharp jawline, glowing iris, double eyelid, piercing glare, subtle confident smirk, comma haircut` | `multi-layered expressive eyes, intricate catchlights in iris, detailed eyelashes, geometric hair strands` | `intense realistic eyes, grim expression, furrowed brow, sweat droplets, detailed lip creases, lifelike gaze` | `lifelike facial anatomy, moisture on lips and eyes, authentic skin pores without noise, soft blush, natural gaze` |
| **Anatomie Homme** | `chiseled athletic build, V-taper waist, 8-pack abs, defined serratus anterior, vascular forearms, 8.8 heads tall` | `toned athletic physique, slender muscular arms, proportional anatomy, clean collarbone definition` | `hyper-defined striated muscle fibers, powerlifter massive frame, sculpted demon back, bulging veins` | `authentic muscular anatomy, realistic fat distribution, natural clavicles and ribcage, healthy athletic physique` |
| **Anatomie Femme** | `athletic feminine curves, toned core, natural bust gravity drape, sculpted hips, strong shapely legs, unconstrained natural shape` | `slender curvy silhouette, elegant neckline, soft waist curve, graceful posture, stylish proportions` | `statuesque feminine build, defined athletic back, authentic realistic curves, grounded powerful stance` | `unconstrained voluptuous natural curves, authentic biomechanics, realistic hip-to-waist ratio, lifelike weight and drape` |

---

### 6.2 Paramètres Techniques par Moteur

#### A. Midjourney v6 / v6.1
- **Aspect Ratios recommandés** :
  - `--ar 2:3` ou `--ar 9:16` : Turnarounds, corps entier en pied, fiches de personnages verticales.
  - `--ar 16:9` : Scènes d'action panoramiques et environnements.
  - `--ar 1:1` : Planches de portraits et feuilles d'expressions 3x3.
- **Paramètres de style** :
  - Webtoon / Anime : `--stylize 250 --v 6.1` (conserve le tracé stylisé sans virer au photoréalisme excessif).
  - Semi-Réalisme : `--stylize 400 --v 6.1`.
  - Seinen Manga : `--stylize 150 --no color, saturation, 3d render` (force le noir et blanc à l'encre pure).

#### B. Stable Diffusion XL (SDXL) & Flux.1
- **Flux.1 (Dev / Schnell)** :
  - Résolution native : `896 x 1152` ou `832 x 1216` pour les portraits verticaux.
  - Guidance Scale : `3.5` pour Flux.1 Dev.
  - Scheduler : Euler, 28 à 35 steps.
- **SDXL 1.0 Base + Refiner** :
  - Résolution : `1024 x 1024` ou `832 x 1248`.
  - CFG Scale : `7.0` à `8.5`.
  - Sampler : DPM++ 2M Karras, 30 steps.
  - Negative Prompts obligatoires : `blurry, bad anatomy, deformed limbs, extra fingers, censored, lowres, flat 2d, watermark, amateur, bad hands, plastic skin, distorted face`.

---

### 6.3 Les 4 Prompts "Master" Prêts à l'Emploi

#### Prompt Master 1 : Webtoon Action Protagoniste (Hunter Solo Leveling)
```text
master character model sheet, young male hunter protagonist, 22 years old, 8.8 heads tall heroic proportions, turnaround multi-view showing front view, side profile, and back view, accompanied by an expression grid showing 6 emotions (calm neutral, fierce glare, dangerous smirk, focused battle, surprised, breathing hard), athletic V-taper build, chiseled 8-pack abs and vascular forearms visible, wearing a dark matte techwear trenchcoat with high collar over an unbuttoned compression shirt, tapered cargo pants with straps, chunky black combat boots, dark messy comma hairstyle with bangs parting over forehead, glowing cyan electric eye trail emitting from sharp eyes, dynamic korean webtoon action style, crisp vector lineart, deep ambient occlusion shadows with clean cel-shading gradients, vibrant rim lighting outlining the silhouette, white clean reference sheet background, ultra detailed 8k resolution, artstation trending masterpiece --ar 2:3 --stylize 250 --v 6.1
```

#### Prompt Master 2 : Anime Moderne Héroïne Tactique (Studio Ufotable / MAPPA)
```text
full body character turnaround sheet, female tactical specialist, 24 years old, athletic natural feminine proportions, front view, back view, and 3/4 dynamic action pose, detailed close-up of face and eye layers, wearing sleek urban tactical techwear, form-fitting durable vest with molle webbing, utility belt, fingerless leather gloves, high-waisted cargo pants tucked into tactical boots, asymmetric braided ponytail with wisps of hair framing jawline, striking expressive amethyst purple eyes with multi-layered crystal highlights, soft facial blushing, modern anime aesthetic, ufotable studio quality, clean dark brown lineart, high-grade dual-tone cel shading, volumetric soft lighting, crisp rim light on hair strands, neutral studio grey background, high definition, masterpiece --ar 2:3 --stylize 220 --v 6.1
```

#### Prompt Master 3 : Seinen Manga Sombre et Épique (Canon Kentaro Miura / Boichi)
```text
seinen manga character design page, weathered male veteran swordsman, 32 years old, imposing muscular physique, standing in heavy armor with realistic battle damage, turnaround views showing front and back, hyper-detailed anatomical muscle striations, vascular arms, demon back musculature, intense grim facial expression, jaw clenched, scar across cheekbone, windblown textured hair, wearing worn leather straps, fur mantle, scarred steel plate armor, massive greatsword strapped to back, masterwork pen and ink illustration style, kentaro miura cross-hatching, boichi dense ink lines, heavy chiaroscuro contrast, pure black and white monochrome, no color, traditional manga screentone textures, clean presentation on white page, museum grade linework --ar 2:3 --stylize 180 --no color, 3d, digital render --v 6.1
```

#### Prompt Master 4 : Semi-Réalisme Digital Concept Art (ArtStation / Riot Games)
```text
cinematic character concept art, mature female sovereign executive and scientist, 35 years old, statuesque voluptuous natural silhouette, authentic realistic curves with elegant poise, turnaround sheet with front view, 3/4 view, and detailed facial portrait, wearing an impeccably tailored navy double-breasted power suit with peak lapels, silk blouse unbuttoned at neck, gold minimalist geometric jewelry, fine rimless glasses, sophisticated low chignon hairstyle with wavy strands framing neck, warm olive skin tone with realistic subsurface scattering glow at light terminators, soft painterly rendering with controlled hard and soft edges, no black outlines, 3-point cinematic lighting with warm key light and cool cyan fill, high-end artstation digital painting, riot games splash art character quality, 8k resolution --ar 2:3 --stylize 400 --v 6.1
```

---

## 7. Structure de Données JSON Standardisée pour les Fiches Personnages

Pour permettre au moteur CLI (`tools/character_generator`) et au studio web d'instancier ces profils de manière déterministe et interopérable, voici le schéma de données TypeScript / JSON validé :

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GLMCharacterVisualProfile",
  "type": "object",
  "required": [
    "id",
    "identity",
    "biometrics",
    "anatomy",
    "wardrobe",
    "style_rendering",
    "prompts"
  ],
  "properties": {
    "id": { "type": "string", "example": "char_jin_woo_prototype" },
    "identity": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "example": "Kang Min-Hyuk" },
        "archetype": { "type": "string", "enum": ["M1_HUNTER", "M2_TANK", "M3_INVESTIGATOR", "M4_STRIKER", "F1_VALKYRIE", "F2_SNIPER", "F3_MATRON", "F4_BLADE"] },
        "age": { "type": "integer", "example": 24 },
        "role": { "type": "string", "example": "Shadow Infiltrator / Hunter" }
      }
    },
    "biometrics": {
      "type": "object",
      "properties": {
        "height_cm": { "type": "integer", "example": 186 },
        "weight_kg": { "type": "integer", "example": 82 },
        "head_ratio": { "type": "number", "example": 8.8 },
        "body_fat_pct": { "type": "number", "example": 9.5 },
        "fitzpatrick_scale": { "type": "string", "example": "Type III - Golden Beige" },
        "facial_features": {
          "canthal_tilt": { "type": "string", "example": "+6 deg positive" },
          "jaw_type": { "type": "string", "example": "Sharp V-line with distinct gonial angle" },
          "eye_color": { "type": "string", "example": "Electric Cyan glowing" },
          "hair_style": { "type": "string", "example": "Two-block comma cut with dynamic bangs" }
        }
      }
    },
    "anatomy": {
      "type": "object",
      "properties": {
        "v_taper_ratio": { "type": "number", "example": 1.62 },
        "abdominal_definition": { "type": "string", "example": "Chiseled 8-pack with deep Adonis belt" },
        "vascularity_grade": { "type": "integer", "minimum": 1, "maximum": 4, "example": 3 },
        "natural_curves_uncensored": { "type": "boolean", "example": true },
        "posture_stance": { "type": "string", "example": "Confident relaxed forward stance with weight on rear leg" }
      }
    },
    "wardrobe": {
      "type": "object",
      "properties": {
        "primary_category": { "type": "string", "enum": ["K_STREETWEAR", "TECHWEAR", "FANTASY", "MARTIAL", "TAILORING"] },
        "duty_outfit": {
          "top": "Matte black technical trenchcoat with reinforced kevlar shoulders",
          "bottom": "Multi-pocket tapered cargo trousers with magnetic fidlock straps",
          "footwear": "High-top combat boots with vibram treads",
          "accessories": ["Fingerless leather gloves", "Harness holster", "Ear communicator"]
        },
        "off_duty_outfit": {
          "top": "Oversized heather grey cotton hoodie (450gsm) over white crewneck tee",
          "bottom": "Relaxed wide-leg dark indigo selvedge denim with hem drape",
          "footwear": "Vintage chunky leather sneakers",
          "accessories": ["Over-ear silver headphones around neck", "Minimalist signet ring"]
        }
      }
    },
    "style_rendering": {
      "type": "object",
      "properties": {
        "primary_style": { "type": "string", "enum": ["WEBTOON_ACTION", "MODERN_ANIME", "SEINEN_MANGA", "SEMI_REALISTIC"] },
        "lineart": "Crisp dynamic vector lineart with line weight modulation",
        "shading": "2-tone cel-shading with smooth soft gradients at terminators",
        "lighting": "Volumetric chiaroscuro with strong cyan rim lighting and eye bloom"
      }
    },
    "prompts": {
      "type": "object",
      "properties": {
        "midjourney_master": { "type": "string" },
        "flux_dev": { "type": "string" },
        "sdxl_prompt": { "type": "string" },
        "sdxl_negative": { "type": "string" }
      }
    }
  }
}
```

---

## 8. Synthèse et Recommandations Opérationnelles pour GLM

1. **Intégration dans le Skill IA (`.agents/skills/neurapolis-character-aesthetic` ou équivalent)** :
   - Fournir les 4 styles sous forme de modes commutables (`--style=webtoon`, `--style=anime`, `--style=seinen`, `--style=semi_realistic`).
   - Imposer la génération systématique de la **dualité vestimentaire** (*Duty vs Off-Duty*) pour tous les personnages principaux de NEURAPOLIS / GLM, décuplant l'attachement narratif des joueurs.
2. **Implémentation dans le Moteur Logiciel CLI (`tools/character_generator`)** :
   - Compiler les templates biométriques (M1-M4, F1-F4) dans des modules de composition déterministe (TypeScript).
   - Intégrer l'adaptateur Ollama local (`http://localhost:11434`) pour générer automatiquement les descriptions narratives en français et compiler les prompts d'images en anglais selon les matrices de la Section 6.
3. **Exploitation dans le Studio Web Interactif** :
   - Proposer une interface à onglets : sélecteur de style (les 4 piliers), morphologie granulaire avec sliders biométriques, garde-robe modulaire avec bascule instantanée *Duty / Off-Duty*, et bouton de copie en 1 clic des prompts prêts pour Midjourney/Flux.1.

---
*Fin du document de recherche — Rédigé et certifié par Explorer 2 (Webtoon Aesthetic Specialist Gen2)*
