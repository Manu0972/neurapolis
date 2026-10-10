# BIBLE VISUELLE DU CHARACTER DESIGN — NEURAPOLIS / GLM
**Version** : 1.0.0 — Production Ready
**Auteurs** : Visual Research & Aesthetic Engineering Unit
**Statut** : Document Fondateur & Référentiel de Prompting

---

## Sommaire Exécutif
1. **Manifeste & Vision Artistique**
2. **Benchmark & Généalogie Visuelle** (Pinterest, ArtStation, Webtoons, Anime Moderne, Seinen Manga)
3. **Le Template de Production Master : Character Model Sheet** (Normes d'ingénierie visuelle)
4. **Anatomie Humaine & Canons Corporels Sans Filtre** (Masculin ciselé, Féminin voluptueux et naturel, Biomécanique)
5. **Génétique, Origines & Diversité Phénotypique** (Structures faciales, Textures capillaires, Carnations et Subsurface Scattering)
6. **Bibliothèque Textile & Lookbook de Styles** (K-Streetwear, Techwear, Tradition Réinterprétée, Business & Haute Couture)
7. **Spécification Typée TypeScript & Schemas JSON** (Contrat de Données pour le Moteur)
8. **Matrice de Prompt Engineering pour Générateurs IA** (Midjourney v6, FLUX.1, SDXL, Imagen 3)

---

## 1. Manifeste & Vision Artistique

Le design de personnages pour l'univers GLM / NEURAPOLIS repose sur une alliance exigeante entre :
- **L'intensité dramatique et graphique du Manhwa moderne** : Clarté du trait, encrage numérique précis, éclairages à fort contraste cinématique, charisme magnétique des regards.
- **L'authenticité anatomique sans concession ni censure édulcorée** : Respect scrupuleux des masses musculaires réelles, de la vascularisation sous tension, des proportions naturelles de la féminité (chute des tissus adipeux, ratios taille-hanches réalistes, courbes fonctionnelles) et de la gravité.
- **Une culture contemporaine de la mode** : Les vêtements ne sont pas des textures plaquées, mais des volumes textiles obéissant à des grammages réels (denim selvedge rigide, jersey de coton tombant, ripstop technique tendu, soie glissante).
- **Une diversité génétique et culturelle riche** : Traduction fidèle des carnations, des types capillaires du monde entier (de la spirale afro 4C au cheveu asiatique 1A ultra-lisse) et des typologies faciales singulières.

Ce document fait foi pour l'ensemble des agents concepteurs, artistes 2D/3D et pipelines de génération automatique d'images.

---

## 2. Benchmark & Généalogie Visuelle

### 2.1. Le Standard Webtoon & Manhwa d'Action (Corée du Sud)
- **Solo Leveling (Chugong / DUBU †, REDICE Studio)** :
  - *Codes identitaires* : Proportions élancées héroïques (8,5 à 9 têtes), épaules larges, silhouette en V tranchée (V-Taper), yeux brillants d'une incandescence intérieure (`glowing blue iris / neon slit`), ombres dures complétées de dégradés légers au cel-shading, postures en contre-plongée accentuant la domination physique.
- **Lookism & Viral Hit (Park Tae-jun Company)** :
  - *Codes identitaires* : K-Beauty masculine et féminine poussée au paroxysme du réalisme stylisé ; coiffures emblématiques (*Two-Block Cut*, *Comma Hair*) aux reflets soignés ; garde-robe streetwear authentique calquée sur les marques réelles de Séoul (Ader Error, Andersson Bell, Off-White).
- **Omniscient Reader's Viewpoint (Sing Shong / Sleepy-C)** :
  - *Codes identitaires* : Esthétique du manteau long flottant (*Trench Coat Flow*), élégance mélancolique, visages aux mâchoires fines et mentons sculptés, contrastes monochrome et accents magiques dorés/bleus.

### 2.2. L'Excellence Anime Contemporaine
- **Studio MAPPA (Jujutsu Kaisen, Chainsaw Man, Hell's Paradise)** :
  - *Codes identitaires* : Encrage vivant avec épaisseur de trait variable (ligne de contour nerveuse), occlusion ambiante sale et texturée sous les vêtements et dans les creux musculaires, expressions faciales brutes trahissant la douleur, la rage ou l'exaltation.
- **Studio Ufotable (Demon Slayer, Fate/stay night Heaven's Feel)** :
  - *Codes identitaires* : Rendu volumétrique 2.5D, éclairages composites riches, yeux multi-couches aux pupilles translucides avec catchlights spéculaires complexes, drapés soyeux aux transitions lumineuses dégradées à l'aérographe numérique.

### 2.3. Les Maîtres du Seinen Manga
- **Yusuke Murata (One-Punch Man)** :
  - *Codes identitaires* : Maîtrise inégalée du raccourci en perspective (*extreme foreshortening*), volumes musculaires imbriqués (deltoïdes, trapèzes et grand dorsal formant une armure vivante), drapés de tissus soumis à une tension cinétique extrême.
- **Kentaro Miura (Berserk)** :
  - *Codes identitaires* : Hachures manuelles denses, pesanteur physique terrifiante, cicatrices corporelles intégrées à l'anatomie, usure des cuirs, cottes de mailles et acier bosselé.
- **Yuto Suzuki (Sakamoto Days)** :
  - *Codes identitaires* : Fluidité organique du corps en action, silhouettes urbaines décontractées dissimulant une létalité féline, plissements dynamiques des vêtements oversize lors des rotations rapides.

### 2.4. Plateformes Digitales : ArtStation & Pinterest Pro
- **ArtStation (Trending Character Concept Design)** : Découpage systématique en planches de production propres sur fond gris neutre (#2b2b2b à #e0e0e0), callouts macro, textures PBR et rendus 3D Marmoset Toolbag / ZBrush sculpt.
- **Pinterest Aesthetic Boards** : Moodboards de style vestimentaire combinant coupes de cheveux, accessoires fétiches, tombé de tissu et poses spontanées "candid snapshot" du quotidien urbain.

---

## 3. Le Template de Production Master : Character Model Sheet

Tout personnage conçu pour le projet doit pouvoir être décliné selon une planche de référence complète (Master Model Sheet), indispensable aux modeleurs 3D et aux générateurs de sprites 2D/2.5D.

### 3.1. Structure Canonique de la Planche
Une feuille de référence complète de personnage comprend 5 zones obligatoires :

1. **Le Turnaround Corporel (Orthographique & Neutre)** :
   - **Vue de Face (Front View)** : Pose A détendue (bras à 45° du corps, pieds écartés largeur d'épaules, paumes orientées légèrement vers l'intérieur). Alignement horizontal parfait des repères anatomiques : voûte crânienne, ligne des yeux, menton, clavicules, mamelons, nombril, crête iliaque, pli de l'aine, rotules, malléoles.
   - **Vue de Profil (Side Profile)** : Posture rachidienne authentique (lordose cervicale, cyphose dorsale, lordose lombaire). Révèle la saillie du nez, le dessin des lèvres, l'angle mandibulaire, la projection de la cage thoracique et le galbe des fessiers.
   - **Vue de Dos (Back View)** : Analyse de la musculature postérieure (trapèzes, rhomboïdes, grand dorsal, érecteurs du rachis, grand fessier) et tombé arrière de la coiffure et des vêtements.
   - **Vue Trois-Quarts (3/4 Front View)** : Pose semi-dynamique validant le volume tridimensionnel, la superposition des formes et l'attitude générale.

2. **La Grille des 12 Expressions Émotionnelles (Expression Grid)** :
   - *Rangée 1 — États Neutres & Positifs* :
     1. Neutre calme (regard droit, bouche détendue).
     2. Léger sourire confiant (coin des lèvres relevé, yeux plissés avec douceur).
     3. Rire franc (bouche ouverte, pommettes relevées, ridules d'expression).
     4. Rictus narquois / ironique (un sourcil haussé, sourire asymétrique).
   - *Rangée 2 — Tensions & Intensités* :
     5. Regard de braise / Détermination froide (sourcils froncés, mâchoire serrée, iris perçant).
     6. Colère explosive / Cri (dents serrées ou bouche grande ouverte, narines dilatées, sourcils plongeants).
     7. Choc / Stupeur (pupilles rétractées, bouche entrouverte, sourcils haussés).
     8. Méfiance / Suspicieux (yeux plissés, tête légèrement penchée).
   - *Rangée 3 — Vulnérabilité & Émotions Complexes* :
     9. Gêne / Rougissement (rougeur diffuse sur les pommettes et les oreilles, regard fuyant vers le bas).
     10. Tristesse contenue (lèvres pincées tremblantes, regard embué, sourcils relevés au centre).
     11. Épuisement / Résignation (paupières lourdes, tête baissée, épaules affaissées).
     12. Douleur physique / Souffrance (dents grinçantes, yeux clos ou mi-clos larmoyants).

3. **Le Répertoire des Mains & Micro-Postures (Hand Library)** :
   - Poing serré de face et de profil (tension des tendons extenseurs).
   - Main détendue au repos (arche palmaire naturelle, doigts étagés).
   - Main tenant un objet (poignée d'arme, canette de boisson, smartphone, outil).
   - Geste expressif (pointage du doigt, main passant dans les cheveux, main ouverte paume vers le haut).

4. **Les Zooms Détails & Accessoires (Macro Callouts)** :
   - Gros plan de l'œil : dégradé d'iris, éclats spéculaires (*catchlights*), détails de l'anneau limbique, ligne de cils.
   - Accessoire signature : montre, bague, cicatrice distinctive, tatouage, boucle d'oreille, badge professionnel.
   - Semelle et profil des chaussures : sculpture des crampons, texture des coutures de la basket/botte.

5. **Palette Colorimétrique & Échantillons (Color Swatches)** :
   - Aplat de base, ombre médiane, ombre d'occlusion, lumière spéculaire pour : la peau, les cheveux, la tenue principale, les pièces secondaires, les métaux.

---

## 4. Anatomie Humaine & Canons Corporels Sans Filtre

Le moteur graphique et les modèles d'IA doivent respecter une anatomie humaine crue, organique et crédible, exempte de censure moralisatrice ou de simplifications réductrices.

### 4.1. Morphologies Masculines
1. **L'Athlète Écorché / Hunter (V-Taper & Définition Sèche)** :
   - *Canon de proportion* : 8,5 têtes.
   - *Torse & Épaules* : Deltoïdes striés et proéminents (« boulets de canon »), clavicules horizontales imposantes, fosse sous-clavière visible. Pectoraux denses et carrés avec séparation sternale nette.
   - *Ceinture Abdominale & Dorsaux* : Grand dorsal déployé en ailes depuis les aisselles, créant un angle aigu vers la taille. Dentelé antérieur (*serratus anterior*) clairement découpé en dents de scie au-dessus des côtes. Abdominaux à 8 plaquettes asymétriques naturelles (non tracés à la règle), ligne blanche profonde. Sillon iliaque proéminent (ceinture d'Adonis) descendant vers le pubis.
   - *Dos Héroïque ("Demon Back")* : Arbre de Noël des érecteurs du rachis, trapèzes en diamant reliant la base du cou aux dorsaux, grand rond et sous-épineux ciselés.
   - *Membres & Vascularisation* : Biceps galbés avec séparation du brachial antérieur, veines céphaliques saillantes courant le long des avant-bras jusqu'au dos de la main. Quadriceps découpés avec vaste interne en goutte d'eau surplombant la rotule.

2. **Le Colosse / Heavy Bruiser (Force Brute & Épaisseur)** :
   - *Canon de proportion* : 7,5 à 8 têtes, carrure massive.
   - *Caractéristiques* : Cou puissant presque aussi large que la mâchoire, trapèzes massifs montant jusqu'aux oreilles, cage thoracique en tonneau très épaisse, obliques larges apportant une solidité rocheuse au tronc. Mains larges, articulations noueuses, jambes massives et stables.

3. **Le Citadin Élancé / Slim K-Idol** :
   - *Canon de proportion* : 8 à 8,5 têtes.
   - *Caractéristiques* : Lignes pures, silhouette élancée et longiligne, clavicules visibles, musculature fine et nerveuse sans hypertrophie, hanches étroites, jambes fuselées, port de tête aristocratique.

### 4.2. Morphologies Féminines
1. **La Silhouette Sablier Authentique (Curvaceous Athletic & Ratios WHR)** :
   - *Ratio Taille/Hanches (Waist-to-Hip Ratio)* : 0.68 à 0.72.
   - *Masse Mammaire & Gravité Réelle* : Poitrine naturelle en goutte d'eau (départ progressif sous la clavicule, projection vers le bas et l'avant, léger aplatissement sous la pesanteur). Jamais de sphères rigides siliconées artificielles. Mamelons orientés naturellement.
   - *Hanches & Bassin* : Hanches généreuses avec transition douce du pli de la taille à la crête iliaque, légère courbe au niveau du grand trochanter, pli sous-fessier net et arrondi.
   - *Ventre & Taille* : Ventre plat mais doux (légère rondeur sous-ombilicale anatomique), ligne blanche subtilement ombrée, taille marquée sans exagération anatomiquement impossible.

2. **L'Amazone / Athlète Musclée & Puissante** :
   - *Caractéristiques* : Épaules dessinées avec galbe du deltoïde visible, bras toniques aux triceps définis. Abdominaux fermes avec séparation médiane visible et obliques affûtés. Dos athlétique sculpté avec rhomboïdes visibles. Fessiers galbés et puissants, cuisses fermes aux quadriceps actifs, mollets fuselés.

3. **La Femme Voluptueuse & Mûre (Plump / Voluptuous Matron)** :
   - *Caractéristiques* : Formes pleines et généreuses, gorge épanouie, bras aux galbes doux, hanches larges, cuisses épaisses se frôlant naturellement à la marche, cambrure lombaire affirmée, présence physique imposante et rassurante.

### 4.3. Règles Biomécaniques Universelles
- **Contre-balancement & Déhanchement (Contrapposto)** : Lorsque le poids repose sur une jambe, la crête iliaque s'élève de ce côté tandis que la ligne des épaules s'incline en sens inverse pour maintenir l'équilibre du centre de gravité.
- **Tension et Relâchement Musculaire** : Un muscle ne se contracte jamais simultanément avec son antagoniste (biceps contracté = triceps détendu étiré).
- **Compression des Tissus Mous** : Tout contact corporel (bras croisés sur la poitrine, cuisses comprimées sur une chaise, vêtement serré sur les hanches) entraîne une déformation élastique visible des masses adipeuses et musculaires.

---

## 5. Génétique, Origines & Diversité Phénotypique

### 5.1. Typologies Faciales & Morphologie Crânienne
- **Est-Asiatique (Corée, Japon, Chine du Nord/Sud)** :
  - Pommettes hautes et douces (*zygomatic arch* harmonieux), arête nasale élégante et fine, bout du nez délicatement défini.
  - Pli palpébral : de la paupière simple (*monolid*) au pli épicanthique raffiné ou à la paupière dédoublée (*double eyelid*). Yeux en amande horizontaux ou légèrement ascendants.
  - Lèvres sculptées avec arc de Cupidon dessiné, menton gracieux en V ou ovale fin.
- **Afro-Descendant & Afrique Subsaharienne** :
  - Structure faciale puissante et harmonieuse, pommettes hautes et saillantes, arcade sourcilière noble.
  - Nez large avec ailes narinaires bien définies et base de l'arête solide.
  - Lèvres généreuses, charnues et pulpeuses avec contour net et transition labiale pigmentée.
  - Mâchoire bien articulée, profil orthognathe ou prognathe léger naturel.
- **Méditerranéen & Moyen-Orient** :
  - Arcade sourcilière prononcée, yeux profonds avec cils très denses et paupières bien marquées.
  - Profil d'arête nasale droit ou aquilin noble, menton affirmé avec possible fossette.
  - Pilosité faciale dense et barbe taillée aux contours géométriques francs.
- **Nordique, Slave & Caucasien** :
  - Traits anguleux, arête nasale étroite et haute, mâchoire carrée aux angles mandibulaires marqués, lèvres plus fines avec philtrum prononcé.
- **Latino-Américain & Métissages Polynésiens/Autochtones** :
  - Hybridation des volumes osseux, pont nasal équilibré, yeux chauds et expressifs, pommettes arrondies conférant jeunesse et expressivité.

### 5.2. Classification des Textures Capillaires (Échelle d'André Walker)
- **Type 1 (Lisse - 1A à 1C)** :
  - Cheveux ultra-droits, lourds, glissants, à brillance miroir (*angel ring reflection*). Coupes : *Two-Block Cut* coréenne, *Curtain Bangs*, carré droit franc, longue chevelure fluide.
- **Type 2 (Ondulé - 2A à 2C)** :
  - Ondulations souples en "S", volume naturel autour des oreilles et de la nuque. Mèches désordonnées vivantes (*messy textured fringe*, *comma hair wavy*).
- **Type 3 (Bouclé - 3A à 3C)** :
  - Boucles en tire-bouchon bien dessinées, ressort dynamique, rebond à la marche, reflets de lumière discontinus sur les anneaux.
- **Type 4 (Crépu / Frisé serré - 4A à 4C)** :
  - Micro-spirales en "Z" très denses, texture cotonneuse en nuage compact, texture mate absorbant la lumière avec micro-éclats en surface.
  - Styles : Afro sculptée, Fade dégradé aux tempes, Tresses collées (*Cornrows*), *Box Braids* ornées de bagues dorées, *Locks* matures, *Bantu Knots*.

### 5.3. Nuancier des Carnations & Rendu de la Peau
- **Nuances de Carnation** :
  1. *Porcelaine Diaphane* (`#ffe0cc` à `#fff1e8`) : Peau laiteuse, sous-ton froid bleuté/rosé.
  2. *Pêche Coréenne / Ivoire* (`#ffc496` à `#fcdbb8`) : Peau lumineuse uniforme, sous-ton chaud pêche/abricot (*glass skin*).
  3. *Dorée / Miel* (`#e2ad7a` à `#d59b63`) : Teint halé éclatant, reflets ambrés sous lumière directe.
  4. *Olive Méditerranéenne* (`#c9a06c` à `#af8654`) : Sous-ton verdâtre/terreux neutre.
  5. *Caramel / Ambrée Chaude* (`#a06a40` à `#8e5932`) : Carnation riche et lumineuse, reflets cuivrés chaleureux.
  6. *Brune Ébène Profonde* (`#4a2a1a` à `#2b170e`) : Pigmentation riche en mélanine, sous-ton chocolat froid ou pourpre profond.
- **Physique du Subsurface Scattering (SSS)** :
  - La lumière pénètre l'épiderme et diffuse dans le derme vascularisé : lisières d'ombres rougeoyantes/oranges autour des doigts, du nez, des oreilles et sous les paupières.

---

## 6. Bibliothèque Textile & Lookbook de Styles

### 6.1. Le K-Streetwear Contemporain (Oversize & Silhouette Déstructurée)
- Veste universitaire bicolore (*varsity jacket*) en laine bouillie et cuir aux manches bouffantes.
- Sweat à capuche oversize (*heavyweight cotton hoodie* 450 gsm) à capuche rigide retombant sur les épaules.
- T-shirt blanc long dépassant de 5 à 10 cm sous le sweat (*layering hem*).
- Pantalon cargo parachute bouffant aux multiples poches à rabats, cordons élastiques aux chevilles.
- Wide-leg denim brut selvedge avec plis lourds (*stacking folds*) sur sneakers rétro bicolores.
- Accessoires : Sacoche bandoulière sur la poitrine, chaîne cubaine argentée, casque supra-auriculaire autour du cou.

### 6.2. Le Techwear Urbain & Tactique (Fonctionnalité & Cyber-Minimalisme)
- Tissus laminés 3 couches imperméables mats (Gore-Tex Pro), nylon balistique Cordura, toile ripstop.
- Zips étanches thermocollés YKK Aquaguard noir mat, sangles de compression avec boucles magnétiques rapides (*Fidlock* / *Cobra*).
- Pantalons articulés avec soufflets aux genoux, bottes tactiques légères Vibram, mitaines techniques.

### 6.3. Tenues Traditionnelles Réinterprétées (Neo-Hanbok & Martial Gi)
- Veste courte *Jeogori* avec col croisé asymétrique rigide *Dongjeong*, rubans modernes ou boucle minimale.
- Pantalon *Baji* ample noir/indigo fluide à la cuisse et noué serré à la cheville.
- Manteau d'extérieur *Dopo* en organza noir transparent flottant au vent par-dessus une tenue streetwear.
- Veste de kimono croisée en coton grain de riz lourd sans manches, ceinture obi détournée avec broderies d'or.

### 6.4. Fantasy Urbaine, Business & Haute Couture
- Costume croisé 6 boutons en laine froide stretch à revers en pointe tranchants (*peak lapels*).
- Pardessus en gabardine ou cuir souple fendu à l'arrière pour le combat et la course (*Urban Hunter Overcoat*).
- Robe de soirée en satin lourd à dos nu et fente latérale haute révélant le galbe de la cuisse.

---

## 7. Les 4 Super-Templates de Prompting Prêts à l'Emploi

#### Gabarit A : Master Character Design Turnaround (Action Webtoon / Manhwa Protagonist)
```text
master character model sheet of [NOM_OU_ARCHETYPE], full body turnaround featuring front view, back view, side profile, and 3/4 perspective, standing in a grounded confident pose. [MALE / FEMALE], [AGE] years old, [ETHNICITE]. [DESCRIPTION_CORPORELLE_ANATOMIQUE : e.g., chiseled athletic V-taper build with sculpted abs / naturally curvaceous hourglass silhouette with authentic gravity drape]. Detailed facial features: [YEUX, NEZ, LEVRES], intense gaze with sharp catchlights. Hair: [STYLE_ET_TEXTURE_CAPILLAIRE]. Wearing [DESCRIPTION_TENUE_AVEC_LAYERING : e.g., layered K-streetwear with oversized hoodie, multi-pocket cargo pants, and chunky sneakers]. Expression grid at the top showing 8 distinct emotional portraits (neutral, confident smirk, fierce battle shout, embarrassed blush, focused glare, shock, genuine smile, melancholic gaze). Micro callout zooms for eye detail and hands. Clean line art with refined cel-shading, subsurface scattering on skin, subtle rim lighting outlining the silhouette. Professional reference sheet layout on clean neutral background, 8k resolution, artstation masterwork.
```

#### Gabarit B : Focus Anatomique & Biomécanique (Nu Athlétique / Sans Censure)
```text
anatomical character study model sheet, [MALE / FEMALE], [ETHNICITE], athletic natural physique. Orthographic turnaround displaying front view, profile view, and muscular back view. [For Male: chiseled 8-pack abs, serratus anterior interlocked with external obliques, vascular forearm detailing, wide latissimus dorsi, demon back musculature / For Female: natural teardrop breasts reacting to gravity, smooth waist-to-hip ratio 0.70, toned obliques, natural soft hip curves, defined shoulder caps]. Anatomically precise muscle insertions, realistic skin folds under tension, subtle subsurface scattering along earlobes and contour edges. Studio chiaroscuro lighting with dramatic cool rim light carving the silhouette against a warm key light. Clean Korean manhwa art style, sharp ink lineart with soft tonal gradients, master anatomy reference, neutral grey background.
```

#### Gabarit C : Lookbook Streetwear & Mode Urbaine (K-Fashion & Techwear)
```text
fashion character concept lookbook, full-length standing pose, modern Korean streetwear aesthetic. Character: [NOM / ARCHETYPE], [GENRE], [ETHNICITE], [COIFFURE : e.g., textured two-block comma hairstyle]. Outfit breakdown: wearing an oversized [COULEUR] heavyweight boxy hoodie layered over a longer white t-shirt, paired with relaxed wide-leg [COULEUR] cargo pants with tactical utility pockets and drawstrings, accessorized with high-top retro basketball sneakers, a matte black crossbody sling bag across the chest, and a silver chain necklace. Realistic fabric physics showing heavy drape, crinkles, and seam tensions. High detail digital watercolor and cel-shade illustration, vibrant stylish color palette, clean vector lines, urban editorial photography composition, white background.
```

#### Gabarit D : Fantasy Urbaine & Haute Couture Dirigeante (Executive Power & Hunter)
```text
high-end concept art character sheet, urban fantasy executive, [MALE / FEMALE], imposing charismatic aura. Wearing a tailored charcoal-black double-breasted power suit with peak lapels, draped with a calf-length tailored cashmere trench coat with billowing hem. Striking sharp eyes with glowing [COULEUR] energy highlights, chiseled jawline, refined hairstyle. Accessorized with a luxury stainless steel chronograph watch and minimalist signet ring. Full-body turnaround with action pose drawing a glowing translucent spectral blade. Dramatic volumetric lighting, subtle glowing particle embers, deep ambient occlusion, cinematic manhwa key visual, Solo Leveling and Omniscient Reader high-production aesthetic, 8k masterpiece.
```

---
*Fin du document officiel — Validé et intégré.*
