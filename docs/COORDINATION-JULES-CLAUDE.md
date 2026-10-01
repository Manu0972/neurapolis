# Briefs prêts à donner à Jules et Claude

État relevé le 1 octobre 2026 : `main` local contient les commits `24a46bb`, `6aa2baa` et `2d0ef00`, absents de `origin/main` (`origin/main` est à `5fa11e5`). Jules ne verra pas les derniers changements avant leur publication sur GitHub. Aucun outil Jules/Claude n’est connecté à cette session Codex ; ces briefs sont à copier dans leurs tâches respectives.

## Règles communes de synchronisation

- Lis `AGENTS.md`, `docs/AGENT-COORDINATION.md` et `.zcode/coordination/BOARD.md`, puis inspecte le code concerné. Vérifie la branche et les commits avant d’écrire ; si le dépôt est plus ancien que le brief, n’implémente rien et signale le décalage.
- Une tâche = une branche dédiée = une PR distincte. Ne travaille jamais directement sur `main`, ne force-push jamais, ne mélange pas les livrables de deux tâches et n’utilise pas `git add .`.
- Ne commence la tâche suivante qu’après intégration de la PR précédente à `main`; repars alors de cette version mise à jour. Pas de refresh/rebase pendant des modifications locales non commitées.
- Réserve dans le tableau les chemins exacts avant d’écrire. Si un chemin est déjà réservé ou si son propriétaire n’a pas libéré son travail, arrête cette partie et passe à une tâche indépendante.
- Ne modifie pas `src/main.ts`, `src/presentation/game.ts`, `src/presentation/style.css`, `src/presentation/start-screen.ts`, `src/saves/persist.ts` ou `tests/saves.test.ts` sans handoff explicite : le menu et la reprise de partie viennent d’être intégrés, mais la propriété fonctionnelle de ces fichiers reste à confirmer.
- Pour chaque tâche, livre les chemins touchés, décisions, résultats réels de `npm run test` puis `npm run build`, limites et prochain handoff. Ne dis pas qu’un rendu est vérifié sans capture ou aperçu réellement observé.
- Les messages de coordination sont des synthèses utiles, pas des pensées privées ni des sondages répétés. Les échanges entre outils sont asynchrones.

---

## Prompt pour Claude — créer un kit graphique original et intégrable

```text
Tu contribues aux graphismes de NEURAPOLIS, un jeu de simulation de vie urbaine, dans le dépôt GitHub déjà relié à ce projet. L’utilisateur aime particulièrement la qualité visuelle de tes designs de personnages, environnements 2D et 3D. Transforme cette préférence en une direction cohérente et en assets originaux directement utilisables dans le jeu.

Commence par lire AGENTS.md, le tableau .zcode/coordination/BOARD.md, art/DIRECTION-ARTISTIQUE.md, art/DESIGN-PHILOSOPHY.md, docs/DIRECTIVE-VISUELLE-URGENTE.md, art/NEURAPOLIS-vivant.html, art/livingworld.js, art/pixelart.js, src/presentation/renderer.ts et src/presentation/sprite.ts. Le dépôt cible une présentation Canvas 2D/2.5D pixel art. La décision est de garder ce moteur : ne propose pas de refonte 3D silencieuse.

Note : le tableau mentionne parfois art/REFERENCES-BIG-AMBITIONS.md, mais ce fichier n’est pas présent dans le checkout actuel. N’invente pas son contenu; utilise les références réellement présentes et signale cette divergence dans ta PR.

LIVRABLE — une tranche graphique courte, soignée et intégrable, pas une image isolée ni une maquette de site :
1. Crée un kit original pour une scène reconnaissable de Val-Ferrand (rue de l’épicerie / place de la Cité des Roses) : couches de fond, façades et volumes, sol/pavés, une enseigne, végétation ou mobilier, éclairage chaud du soir et ombres froides.
2. Ajoute des sprites de personnages pixel-art lisibles et distincts (au minimum jeune joueur, camarade, adulte du quartier), avec transparence, dimensions de cellules et poses documentées. Préserve de vraies silhouettes et des détails de visage/vêtements, pas seulement des recolorations identiques.
3. Garde une palette limitée et cohérente : environ 24–32 couleurs, contours brun chaud, bases crème/sauge/terracotta, ombres bleues ou violettes, lumières ambrées. Pixel net à l’échelle entière, sans flou ni redimensionnement lissé.
4. Examine les prototypes déjà présents, mais sélectionne et améliore uniquement ce qui sert cette scène. N’importe pas un prototype IIFE en bloc. Ne copie pas les personnages, logos ou assets d’un autre jeu.
5. Enregistre le kit sous art/claude-assets-v1/ avec README décrivant chaque fichier, dimensions, palette, grille, transparence, licence/source et méthode d’aperçu. Si ton environnement sait créer des PNG, fournis des PNG originaux prêts pour Canvas et leurs sources éditables; sinon, choisis un format source réellement exploitable et explique le compromis. Ne touche pas au code d’intégration `src/presentation/**` dans cette tâche.
6. Fournis un aperçu réel du kit (rendu/capture si possible) et vérifie que les fichiers ouvrent correctement. Si la génération d’images n’est pas disponible, produis des assets vectoriels/code natifs de qualité et un aperçu, pas un simple moodboard.

COORDINATION : crée une branche dédiée et une PR limitée à art/claude-assets-v1/**. N’ajoute pas dist, node_modules ni des fichiers étrangers. Dans la PR, indique les choix faits et les limites. Jules intégrera ensuite ces assets dans le renderer sur une branche distincte. Ne prétends pas lui avoir parlé : dépose une note courte dans le tableau si l’outil de coordination est disponible.
```

---

## Tâches Jules — les lancer une par une, dans cet ordre

Chaque tâche ci-dessous est un prompt séparé. Attends l’intégration de la PR précédente et pars du `main` mis à jour avant de lancer la suivante.

### J1 — Intégrer le kit Claude dans le rendu jouable

```text
Implémente la première amélioration visuelle intégrée de NEURAPOLIS à partir du kit art/claude-assets-v1 déjà intégré à main. Inspecte d’abord le renderer, les dimensions/aperçus et la DA. Si le kit manque ou si main n’inclut pas sa PR, ne fabrique pas de substitut et signale la dépendance.

Objectif : faire apparaître réellement dans le jeu Canvas une scène de rue de Val-Ferrand avec profondeur 2.5D, façades/volumes, détails de sol, végétation/objets, éclairage chaud/froid et personnages différenciés. Le monde jouable reste l’écran principal : pas de dashboard, chrome web, maquette ou scène statique sans joueur.

Réserve seulement `src/presentation/renderer.ts`, `src/presentation/sprite.ts` et les nouveaux modules nécessaires sous `src/presentation/assets/`. Ne touche pas à `src/presentation/game.ts`, `src/main.ts`, `style.css`, au menu/sauvegarde ou à la simulation. Garde Canvas 2D, TypeScript strict, rendu net en pixels entiers et aucune dépendance runtime. Préserve les entrées de carte, collisions, caméra et lisibilité.

Vérifie le rendu dans l’application avec capture si ton environnement le permet, puis exécute `npm run test` et `npm run build`. Livre cette seule étape dans une branche/PR, avec les fichiers d’assets utilisés et preuves visuelles. Ne démarre pas J2 dans cette branche.
```

### J2 — Rendre les habitants mémoriels et réactifs

```text
Sur le main à jour après J1, enrichis la vie des habitants. L’audit a constaté que `NpcState.memory`, `opinion`, `stress` et `moral` existent déjà, mais sont très peu exploités; vérifie cet état avant de coder.

Fais en sorte que quelques habitants clés (Noah, Mme Bertin, Samir) se souviennent d’événements concrets de la partie et que leur comportement/réplique reflète ces événements : par exemple épicerie en difficulté ou qui embauche, réussite collective du stand, soutien réellement apporté au quartier. Les souvenirs doivent être uniques, bornés, sauvegardés avec les champs existants et dépendre d’événements observables. Toute évolution relationnelle/morale doit avoir une cause explicable et un effet perceptible dans les dialogues ou l’activité déjà affichée.

Réutilise les champs existants sans changer `WorldState` si possible. Chemins réservés : `src/simulation/npc.ts`, `src/simulation/dialogue.ts`, `src/data/npcs.ts`, tests dédiés (`tests/npc-life.test.ts`). Ne touche pas à `src/presentation/game.ts`, aux saves, au renderer, au projet économique ou à la campagne. Si rendre une conséquence visible nécessite un de ces chemins, documente la dépendance et arrête-toi avant ce chemin.

Ajoute des tests déterministes : mémoire non dupliquée, réactions bornées, conséquences observables, même seed → même trace. Exécute tests puis build; livre une PR séparée et ne démarre pas J3.
```

### J3 — Rendre le chapitre 4 jouable : décision sur la place

```text
Implémente le chapitre 4 de NEURAPOLIS comme une vraie tranche jouable, pas comme un simple seuil automatique. Lis d’abord l’état actuel : `src/data/campaign.ts`, `src/simulation/campaign.ts`, `src/simulation/council.ts`, les états district et l’écran campagne/Conseil.

Concept à réaliser : à 15 ans, le joueur mobilise des habitants et des voix du Conseil, convoque une décision de quartier sur le réaménagement de la place, puis choisit entre plusieurs usages légitimes (par exemple marché solidaire / jardin commun / circulation et accès). Chaque option a un coût et des effets distincts et mesurables sur des variables existantes telles que `district.frequentationParc`, `confianceQuartier`, vitalité, réputation ou relations. Les causes du résultat sont consignées dans l’événement et le journal. Pas d’option moralement parfaite qui domine tous les autres choix.

Précondition absolue : `src/presentation/game.ts` a été réservé dans BOARD comme appartenant encore au chantier menu/reprise, sans handoff explicite. Ne touche pas ce fichier et ne démarre pas le code UI tant que son propriétaire n’a pas écrit le handoff. En attendant, tu peux livrer une analyse de lecture seule et travailler à une tâche disjointe; ne prétends pas avoir livré le chapitre jouable.

Après handoff, réutilise `council.decisions`, relations et état du district; n’ajoute un champ sauvegardé que si indispensable. Si le schéma WorldState change : incrémente sa version, écris la migration v5→v6 et un aller-retour de sauvegarde. Chemins prévus après handoff : `src/simulation/campaign.ts`, `src/data/campaign.ts`, `src/presentation/game.ts`, `tests/campaign.test.ts`. Ajoute tests des préconditions, des coûts/effets de chaque choix, de l’idempotence et de la sauvegarde si applicable. Tests puis build; PR seule.
```

### J4 — Écrire et jouer une vraie conclusion au chapitre 5

```text
À lancer seulement après intégration de J3. Termine l’arc de NEURAPOLIS par une décision de fin jouable à 16 ans, préparée par les conséquences des chapitres 2–4. Le joueur tranche le modèle durable de Val-Ferrand; les issues doivent produire des conséquences lisibles sur les habitants, les projets et le quartier. Écris une scène de conclusion qui reconnaît ce qui a été construit et ce qui a été sacrifié. Enregistre une fin unique et stable; continuer après la fin doit permettre de revisiter les lieux sans dupliquer la scène ni réinitialiser la partie.

Avant de coder, vérifie le système de campagne et propose des critères satisfaisables dans une partie réelle. N’ajoute pas d’épilogue automatique dès l’âge 16 sans action du joueur. Toute branche doit être atteignable et testée. Réutilise l’état existant; si nouveau champ sauvegardé, migration + aller-retour obligatoires.

Chemins prévus, après réservation et vérification du tableau : `src/simulation/campaign.ts`, `src/data/campaign.ts`, `src/presentation/game.ts`, tests de campagne, et éventuellement fichiers de scène narratifs. `game.ts` exige toujours son handoff. Ajoute tests de chaque fin et du chargement après la fin. Tests puis build; livre une PR unique et décris ce qui reste pour le jeu complet.
```

### J5 — Ajouter un second projet économique distinct du stand

```text
Après J4, approfondis l’économie au-delà du Stand des Roses. Conçois et implémente un second projet jouable lié à Val-Ferrand (par exemple atelier de réparation dans la Friche avec Karim), qui a sa propre boucle de fournisseurs/stock, travail/compétences, commandes, revenus, membres et risques. Il doit être réellement différent du stand, relié aux habitants et au quartier, équilibré face au temps, aux besoins et à la concurrence. Un nouvel habillage du stand ou une liste de fonctionnalités sans décisions n’est pas suffisant.

Commence par cartographier le modèle actuel et présenter dans la PR une architecture courte avant l’implémentation. Limite ensuite les chemins et réalise une étape verticale complète. Toute modification de `WorldState` ou du format de projet exige une migration depuis la version courante et des tests de sauvegarde aller-retour; préserve la déterminisme et l’invariant du ledger. N’écrase aucun projet sauvegardé existant.

L’écran actuel peut nécessiter `src/presentation/game.ts`; son propriétaire doit libérer ce chemin avant toute écriture. Ne contourne pas ce verrou en laissant la nouvelle mécanique inaccessible. Tests du succès/échec/invariants et build obligatoires; PR séparée.
```

### J6 — Équilibrage et vérification bout en bout

```text
Quand J1–J5 ont été intégrés, mène la passe d’équilibrage et de qualité finale. Joue des scénarios scriptés déterministes du nouveau départ jusqu’aux deux fins, en incluant besoins, choix relationnels, succès et difficultés économiques, réactions de concurrents, événements du quartier, sauvegardes et chargement au milieu de la campagne puis après une fin.

Établis des critères reproductibles, ajoute les tests de régression manquants, corrige les défauts découverts dans les chemins explicitement réservés. Vérifie qu’aucun fantôme, objectif ou option de fin annoncés ne sont inatteignables; aucun choix n’est un piège sans contre-jeu; aucun ledger ne diverge; aucun événement important n’est sans cause; les sauvegardes anciennes migrent correctement. Exécute la suite complète puis le build, et fournis les sorties exactes.

Pour l’acceptation visuelle, fournis des captures réelles du démarrage, du jeu en journée/soirée, d’un intérieur/lieu et d’un écran de décision. Ne déclare pas le jeu complet si l’une de ces vérifications échoue ou n’a pas été exécutée. Livre un rapport de vérification et la dernière PR uniquement après résolution des régressions bloquantes.
```

## Note de lancement

Jules travaille sur le snapshot GitHub, pas sur les modifications locales en direct. À l’état vérifié, `origin/main` ne contient pas encore les trois commits locaux ci-dessus. Une fois le contenu relu, `git push origin main` publiera les commits déjà créés (il n’y a pas besoin de `git add .` ni de nouveau commit pour eux). Ne poussez pas une branche ou un contenu supplémentaire sans l’avoir relu.

Claude et Jules ne peuvent pas échanger instantanément leurs pensées. Le handoff concret est : assets/PR Claude → merge sur GitHub → nouvelle tâche Jules depuis `main` → PR d’intégration → revue et merge → tâche suivante. Le tableau sert à noter ce qui a réellement été livré.
