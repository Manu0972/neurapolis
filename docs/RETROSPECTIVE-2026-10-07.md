# Rétrospective pessimiste : 2026-10-07

> Demandée par l'utilisateur : « vraiment pessimiste, noter tout ce qui est bien et tout ce qui ne l'est pas, surtout ce qui est moche ».
> Faite par Claude Code à partir de captures du vrai jeu (rue, vue haute, personnage de près), du code et des tests. Pas de complaisance.

## 1. Le verdict en une phrase

Le jeu a **beaucoup de systèmes et pas assez de jeu**. On a empilé en une journée une vingtaine de mécaniques justes sur le papier. Mais personne n'a joué une année complète, la ville est petite et vide par endroits, et le personnage est franchement laid. C'est un prototype riche, pas encore un jeu « triple A ».

## 2. Ce qui est vraiment bien (à garder)

- **Le fond pédagogique et le lore.**
  - Doubles faces, verdict à trois univers parallèles, carnet de 20 concepts, quiz tirés de situations, Carnets de Lucien, Nora et Thierry, Taret-Acier 2014/2032.
  - C'est original, cohérent et sert vraiment l'idée d'« apprendre l'économie en jouant ».
- **La rigueur technique de la simulation.**
  - Simulation déterministe, sans `Math.random`, séparée de l'affichage.
  - 23 versions de sauvegarde avec migrateur et test d'aller-retour pour chacune.
  - 690 tests verts ; build sans erreur.
- **L'économie « Big Ambitions ».**
  - Baux, logistique physique, clients heure par heure, concurrence, employés, prêts, habitués, propriété.
  - C'est solide et testé.
- **Les fantômes en barre et en pop-up.**
  - Lisibles, mignons, ils lisent les vrais chiffres.
  - C'est la bonne direction pour l'identité du jeu.

## 3. Ce qui ne va pas (du plus grave au moins grave)

### 3.1 C'est moche (priorité absolue)

1. **Le personnage est laid.** C'est le pire défaut visuel (capture `r_perso`).
   - Une poupée de capsules, sans visage lisible ni mains.
   - Les bras flottent à côté du torse, les cheveux forment un bol.
   - Le sac est un pavé bleu plaqué dans le dos.
   - De près, il casse toute l'ambiance.
2. **Les bâtiments sont des boîtes.**
   - Façades plates aux fenêtres identiques répétées, toits plats gris, pas de rez-de-chaussée commerçant crédible sur la plupart.
   - Pas de corniches, de balcons, de gouttières, de portes d'immeuble visibles, ni de variation de hauteur d'étage.
   - Vue de haut, c'est propre ; à hauteur d'homme, c'est un décor de maquette.
3. **La place du Marché est un désert pavé** (capture `r_haut`).
   - Six étals perdus dans 80 m de pavés.
   - La « fontaine » est un disque gris plat, et les bancs sont minuscules.
   - Aucun arbre d'alignement, ni marquage, ni foule à la hauteur d'un centre-ville.
4. **La lumière est sans nuance.**
   - Ombres dures uniformes, ciel bleu plat, pas de brume de chaleur ni de reflets.
   - Le crépuscule « 1800 K » de la vision n'est pas vérifié en capture depuis le début de la journée.
5. **L'interface est disparate.**
   - Les fenêtres de l'économie, du téléphone, des fantômes et du récit ont chacune leur style.
   - Beaucoup de texte et peu d'illustrations ; les icônes sont des emojis.
   - La barre des fantômes, les notifications d'infos, la pastille de plan et la mini-carte peuvent se chevaucher sur petit écran (non testé sur mobile).

### 3.2 Ce n'est pas assez fluide

- **Déplacement.** Le personnage pivote vite et sans élan.
  - L'animation de marche est procédurale et raide : jambes en ciseaux, pas de déroulé du pied, pas de balancier des hanches, épaules fixes, aucune transition marche → course.
- **Caméra.** Elle suit sans amortissement réglé, et rien n'a été mesuré depuis l'ajout des systèmes.
- **Accélérations du temps.** Elles sont brutales (fondu noir « Tu dors… ») : nuit, train, bus, cours, voyage, chacune a son voile.
- **Mesure.** Aucun relevé de fluidité depuis le premier (7,5 ms par image). Avec la barre des fantômes, les notifications et les ambiances, c'est à remesurer.

### 3.3 Trop de systèmes, pas assez joués

- **Doublons.** Plusieurs systèmes se chevauchent sans fusion :
  - `multi_ventures` (ancien) et l'Ascension ;
  - `macro_news` (ancien) et le fil d'infos ;
  - `school_life` et la famille (synchronisée de force) ;
  - le Conseil des fantômes et la barre ;
  - la campagne 12-16 ans et l'Ascension.

  Le joueur reçoit des messages de systèmes qui ne se connaissent pas.
- **Avalanche de fenêtres.** Dîner, convocation, surprise, événement de collège, laminoir, cahier de Lucien, origine, rappels de cours, verdicts, nouvelles applications : rien ne garantit qu'un soir ordinaire ne déclenche pas quatre fenêtres d'affilée.
- **Équilibrage théorique.** Il est mesuré par sondes automatiques, jamais sur une partie réelle d'une année : ni rythme de progression, ni ennui, ni difficulté ressentie.
- **Temps figé en voyage.** Sur place, le temps ne bouge que si l'on agit : c'est un choix étrange qu'aucun joueur n'a validé.
- **Contenu de départ mince à certains endroits.** 6 secrets, 6 événements de collège, 6 quiz. Antigravity doit en livrer plus (workflow AG-2), mais ce n'est pas fait.
- **La campagne historique (chapitres 1 à 5) n'a jamais été rejouée en 3D** depuis la refonte.

### 3.4 Dette technique

- **Fichiers géants.** `src/presentation/game.ts` fait 2 900 lignes : tout y est branché « à la main ». C'est le premier risque de régression.
- **Stockage de la carte.** Une `Map` JavaScript a une entrée par tuile de bâtiment. Ça passe à 414 × 268 m, pas à une carte dix fois plus grande.
- **Vérification faite à moitié.** Les captures n'ont été possibles que par un relais local, et le panneau masqué a empêché de rejouer le test de bout en bout visible (11/13 avec ce panneau).
- **Permissions cassées** sur `node_modules` et `.git` : toute la vérification passe par une copie dans `.ci/`. C'est fragile.
- **Coordination.** Antigravity ne poste pas sur le tableau, et Jules n'a rien livré depuis le 6 octobre.

## 4. La carte : où on en est, et comment elle doit grandir

### Aujourd'hui

- **Taille.** La ville fait **414 m × 268 m**, soit environ 11 hectares de rues, à l'échelle 1 tuile = 1 m. C'est **petit** : environ 5 îlots d'est en ouest et 3 du nord au sud, plus le canal. Il faut 2 minutes pour la traverser à pied.
- **Quartiers.** Les Roses, le Centre et la place du Marché, la Friche, le Canal, la Gare (ajoutée à l'est).
- **Ailleurs.** Les voyages (Néo-Baie, Plateau Blanc, Île Saphir) sont de **petites places de 18 × 14 m**, pas des villes.
- **Limite technique.** Le stockage de la grille (une `Map` par tuile de bâtiment) et la scène 3D, qui construit toute la ville d'un bloc, empêchent de grossir sans refonte.

### Proposition : une grande carte dès le début, des zones qui s'ouvrent

1. **Val-Ferrand complet, environ 1,6 km × 1,2 km.** Seize fois la surface actuelle, générée dès le début et **visible au loin**, avec 8 quartiers :
   - le centre actuel ;
   - la Cité des Roses étendue ;
   - la Friche Taret entière (38 ha, comme dans la Bible) ;
   - les berges du Canal ;
   - la Gare et le laminoir ;
   - la zone HyperVal (Drive, Allée des Grossistes) ;
   - les collines résidentielles ;
   - la zone industrielle nord.
2. **Des zones qui s'ouvrent avec l'Ascension.**
   - Palier 1 : le centre.
   - Palier 2 : les Roses et le Canal.
   - Palier 3 : la Friche entière et HyperVal.
   - Palier 4 : le laminoir et la zone nord.

   Une zone fermée n'est pas un mur invisible : on y voit des **chantiers, des grilles, des bus qui n'y vont pas encore**, et une raison du lore (« quartier en travaux après la fermeture de 2014 »).
3. **La vallée en cartes reliées.** Plateau Blanc, Néo-Baie et Île Saphir deviennent de **vraies petites villes** (environ 400 × 300 m chacune), chargées quand on prend le train, au lieu des places actuelles.
4. **Ce que ça demande techniquement :**
   - une grille en tableaux typés, un octet par tuile, sans `Map` par tuile ;
   - une scène 3D **par blocs de 128 m** chargés et déchargés autour du joueur ;
   - des immeubles lointains simplifiés ;
   - un générateur de quartiers paramétré par le lore.

   C'est un chantier de plusieurs jours, à faire **avant** d'ajouter encore des systèmes.

## 5. Ce que je corrige maintenant, dans cet ordre

1. **Le personnage (le plus moche, le plus visible).**
   - Un nouveau modèle arrondi et proportionné : visage (yeux, sourcils, bouche, nez), mains, bras attachés aux épaules.
   - Il rend toute la personnalisation v23 : peau, 14 coupes, morphologies, taille, lunettes, taches de rousseur, barbe, accessoires, 8 tenues.
2. **Le mouvement.**
   - Accélération et freinage progressifs, rotation avec élan.
   - Marche avec déroulé du pied, balancier des hanches et des épaules, bras en opposition.
   - Transition douce marche → course, respiration au repos, regard qui suit la direction.
3. **La caméra.** Un amortissement critique (sans à-coups) et un léger décalage dans le sens de la marche.
4. **La place du Marché et la fontaine.** Une vraie fontaine, des arbres d'alignement, plus d'étals et de mobilier.
5. **Les fenêtres.** Une file d'attente pour ne jamais en ouvrir plus d'une par heure de jeu, sauf urgence.
6. **Ensuite :** la refonte de la carte (§4) et des façades.
