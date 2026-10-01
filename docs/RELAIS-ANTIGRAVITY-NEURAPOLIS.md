# Relais de travail — NEURAPOLIS

Document de continuité pour l’utilisateur, Codex, Antigravity/Jules, Claude et tout agent qui rejoint le dépôt. Il résume le cap et le protocole; les détails de simulation, d’art et d’architecture restent dans les documents sources liés ci-dessous. Il doit permettre de reprendre le projet après une pause ou une limite de quota sans refaire l’historique.

## Ce que l’utilisateur veut vraiment

Faire **un vrai jeu complet**, profond et jouable du début à la fin, pas une page web, un tableau de bord, un concept, une image isolée ou une démo statique. L’objectif est une simulation de vie et de ville dans laquelle le joueur habite Val-Ferrand, grandit, apprend, noue des relations, monte des projets économiques, affronte une concurrence crédible et voit ses décisions transformer le quartier. La profondeur recherchée est comparable en ambition à un jeu de gestion commercial comme *Big Ambitions*, avec une identité, des systèmes et des assets originaux propres à NEURAPOLIS.

Le joueur commence à 12 ans en septembre 2020 dans la Cité des Roses. Le monde doit être chaleureux et vivant; les habitants ont des horaires, des besoins, des souvenirs, des relations et des réactions. Les voix du Conseil sont des penseurs qui apparaissent après des expériences vécues, conseillent avec des biais et des conflits, et influencent des choix concrets. Les activités, les commerces, le quartier, les institutions et la campagne se répondent causalement.

L’utilisateur préfère une direction artistique riche en personnages, lieux et ambiances — 2D/2.5D pixel art cozy, lumière chaude, ombres froides, profondeur et animations lisibles. Le jeu doit rester un jeu Canvas avec le monde jouable au premier plan, et non l’interface visuelle d’un site. La voie actuelle est Canvas 2D/2.5D; une refonte 3D ne se décide qu’après comparaison visuelle et technique concrète, jamais par glissement de périmètre.

## Sources de vérité à lire avant toute reprise

Lis les règles et l’état courant, dans cet ordre :

1. `AGENTS.md` — architecture et pratiques du dépôt.
2. `.zcode/coordination/BOARD.md` — propriétaires, réservations, handoffs et état partagé le plus récent.
3. `docs/PRODUCTION-PLAN.md` — contrat du jeu, systèmes, roster, critères des jalons.
4. `art/DIRECTION-ARTISTIQUE.md`, `art/DESIGN-PHILOSOPHY.md`, `docs/DIRECTIVE-VISUELLE-URGENTE.md` — qualité graphique attendue.
5. `docs/COORDINATION-JULES-CLAUDE.md` — briefs d’assets et tâches séquencées déjà préparés.
6. `docs/rival_economy_design.md`, `docs/DECISIONS.md`, `README.md` — conception de la concurrence, décisions et démarrage.
7. Le code et les tests réellement présents; les plans ne prouvent pas qu’une fonction existe.

`docs/AGENT-COORDINATION.md` contient d’anciennes réservations et un ancien protocole. En cas de contradiction, vérifier les dates et les changements Git; le tableau `.zcode/coordination/BOARD.md` est le registre courant, et l’état du dépôt est la preuve finale. Le fichier `art/REFERENCES-BIG-AMBITION(S).md` est mentionné dans des échanges antérieurs, mais son existence doit être vérifiée dans ce checkout avant de s’y fier.

## État vérifié à la rédaction — 2026-10-01

- Le dépôt se trouve dans `neurapolis/`, branche `main`, quatre commits locaux en avance sur `origin/main` au dernier relevé. GitHub ne voit pas automatiquement les changements du dossier local.
- Le répertoire de travail n’est pas propre. Au dernier `git status`, les changements partagés touchaient notamment la campagne et ses interactions (`src/data/campaign.ts`, `src/simulation/campaign.ts`, `src/simulation/council.ts`, `src/presentation/game.ts`, `src/presentation/renderer.ts`, `src/presentation/ui.ts`, `src/data/places.ts`, `src/simulation/places.ts`, `tests/campaign.test.ts`), ainsi que la mémoire des PNJ (`src/simulation/npc.ts`, `src/simulation/dialogue.ts`, nouveaux `src/data/npc-events.ts`, `tests/npc-life.test.ts`) et le tableau de coordination. Le présent fichier de relais est également nouveau. **Inspecter `git status` et les diffs à nouveau avant d’agir. Ne jamais les annuler, stasher, déplacer de branche ou les attribuer à soi sans handoff.**
- Jules/Antigravity a déclaré dans le tableau le jalon « chapitre 4 jouable : décision sur la place » et réservé `src/data/campaign.ts`, `src/simulation/campaign.ts`, `src/presentation/game.ts`, `src/presentation/ui.ts`, `tests/campaign.test.ts`. Les modifications visibles de campagne/lieux dans le workspace doivent être rapprochées de ce handoff et validées par leur propriétaire avant intégration.
- La tranche Codex « mémoire réactive des PNJ » est implémentée sur `src/simulation/npc.ts`, `src/simulation/dialogue.ts`, `src/data/npc-events.ts`, `tests/npc-life.test.ts`. Les habitants retiennent jusqu’à 50 événements pertinents sans doublons et réagissent dans les sujets de dialogue concernés; aucune nouvelle jauge ni migration de sauvegarde n’a été ajoutée. Validation avec accès autorisé : `npm run test` — 14 fichiers, 211 tests passés; `npm run build` — 58 modules compilés. Cette validation porte sur le snapshot local partagé du 1 octobre, pas sur une PR fusionnée ni un test visuel en jeu. La réservation Codex de ces chemins a été libérée dans le tableau.
- Le tableau avait indiqué que l’accueil/sauvegarde a passé 201 tests et le build sous Jules. Ce résultat historique n’est pas la validation des changements actuels.
- La branche locale et les commits non poussés doivent être examinés et publiés proprement avant que Jules/Claude, travaillant sur GitHub, puissent les recevoir. Aucun agent ne doit dire que l’autre voit les changements en direct sans l’avoir vérifié.
- La capture fournie par l’utilisateur indique que Claude a temporairement atteint sa limite de messages jusqu’à 22 h 50. Cela n’empêche pas Antigravity de travailler sur une tâche autonome; le kit Claude sera une dépendance seulement après sa livraison réelle.

## Critères de complétude — ne pas réduire le cap

Le jeu ne sera déclaré terminé que lorsque les parcours suivants sont vrais dans le code et observables dans une partie réelle :

### Jeu jouable et progression

- Une partie neuve démarre sans manipulations de développeur; déplacement, interaction, temps, besoins, lieux et reprise sont compréhensibles.
- Les chapitres annoncés sont accessibles dans une partie réelle jusqu’à la conclusion vers 16 ans. Chaque étape demande des actions du joueur, montre ses conditions, ses coûts, ses conséquences et sa progression. Pas de fin automatique déclenchée par l’âge seul.
- Les choix structurants ont des issues distinctes, légitimes et répercutées plus tard dans le quartier, les projets, les habitants et l’épilogue. Une fin ne bloque pas le chargement ni l’exploration après l’histoire.
- Les événements importants expliquent leurs causes; le journal permet de relier action, conséquence et changement d’état.

### Vie, relations et économie

- Les systèmes décrits dans `docs/PRODUCTION-PLAN.md` existent en mécaniques accessibles, pas seulement en data, promesses ou indicateurs.
- Les projets couvrent une boucle complète (obtenir ressources, produire/vendre ou livrer, payer les coûts, répartir, gérer les membres, apprendre et récupérer). Le grand livre respecte toujours `entrées − sorties = solde`.
- Les concurrents suivent des parts de marché et agissent en conséquence : signaux/avertissements compréhensibles, ripostes mesurables, contre-stratégies au choix du joueur, conséquences réversibles ou assumées, et comportements différents. Vérifier ce qui est déjà dans `src/simulation/rival.ts` avant d’ajouter un second moteur concurrent.
- Les habitants réagissent à des événements réellement survenus; leurs souvenirs ne se dupliquent pas, sont conservés au chargement et affectent des dialogues, relations, activités ou décisions de façon explicable.
- Chaque statistique nouvellement ajoutée a une source, des effets de jeu réels et un contre-jeu. Ne pas gonfler les jauges pour donner une impression de profondeur.
- Le second projet économique envisagé autour de la Friche Taret doit être différent du Stand des Roses et entrer dans la campagne par des ressources, des personnages et des dilemmes dédiés. Le concevoir après l’achèvement du chapitre en cours et réutiliser les systèmes communs plutôt que dupliquer le stand.

### Présentation et qualité

- Le joueur reste dans un monde Canvas vivant, avec une vraie scène, des silhouettes distinctes, un décor qui a du volume, une palette cohérente, une lumière qui marque l’heure et des animations reliées aux activités.
- La direction s’appuie sur les contrats d’art existants : pixels nets, palette limitée aux rampes chaudes/froides, contour brun, profondeur en couches, expressions et variations de personnages, détails de quartier animés. Pas de primitifs plats comme rendu final, pas de pastilles, pas d’interface de site.
- Les menus/HUD/Conseil/projet doivent appartenir visuellement au jeu et rester lisibles. Souris/clavier et tactile annoncés fonctionnent; les panneaux ne masquent pas les actions principales.
- Les assets fournis par Claude doivent être originaux, réellement intégrables et accompagnés de dimensions, palette, grille, transparence, sources/licence et aperçu. Une image de stand seule ou un moodboard n’est pas une livraison graphique intégrée.
- Les sauvegardes sont versionnées et migrent sans perte; tester une ancienne partie, une sauvegarde au milieu de campagne, un retour après fermeture et les données des systèmes ajoutés.
- Exécuter la suite complète `npm run test` et `npm run build` après intégration. Jouer un scénario bout-en-bout de nouvelle partie à une fin, ouvrir le rendu réel et fournir des captures. Rapporter honnêtement tout cas non exécuté.

## Innovations à développer en gardant une cause et un contre-jeu

Ce sont des pistes pour enrichir la vision, pas des tâches à empiler sans mesure. Chaque piste passe d’abord par une tranche jouable et un test.

1. **Pression concurrentielle lisible** : un rival constate la progression du joueur sur un secteur, choisit une riposte cohérente (prix, horaires, exclusivité, réputation ou recrutement), la rend visible et laisse une fenêtre où répondre. Le joueur peut négocier, changer d’offre, investir ailleurs ou accepter une perte. Chaque rival a ses forces et angles morts.
2. **Mémoire sociale et rumeurs** : un événement local est connu par des témoins définis, se transmet éventuellement au fil des jours, se déforme sans devenir omniscient, puis influence les conversations, la confiance ou les opportunités. L’historique doit montrer qui a vu quoi et quand.
3. **Boucle de décision publique** : préparer une assemblée, rassembler des voix, présenter un compromis, voter et voir les effets différés sur des groupes différents. Aucune option ne maximise toutes les valeurs.
4. **Après-coup systémique** : décisions économiques et politiques peuvent produire des effets différés qui reviennent sous forme d’événements compréhensibles, avec choix de réparation ou d’adaptation.
5. **Ville lisible à plusieurs échelles** : rues et intérieurs donnent le quotidien; quartier et réseau de commerces exposent les choix de marché. Ajouter l’échelle seulement si elle fournit au joueur de nouvelles décisions jouables, pas une carte décorative.
6. **Économie reliée aux habitants** : les prix, services, horaires et fournisseurs changent qui peut se permettre un achat, qui travaille, ce qui se vend et les liens de confiance. Le détail de simulation doit rester adapté à la taille de chaque système.

Une innovation est acceptée si le joueur peut répondre à ces questions en jeu : « Qu’est-ce qui a changé ? Pourquoi ? Qu’est-ce que je peux faire ? Quel compromis ai-je choisi ? »

## Ordre de travail conseillé

Respecter les dépendances et le tableau des réservations; réordonner uniquement avec une raison inscrite dans le tableau.

### A. Stabiliser les handoffs déjà en cours

1. Ne pas toucher aux chemins du chapitre 4 que Jules a réservés. Lui demander dans le tableau un point de livraison précis : fichiers, tests, build, état du rendu, fichiers encore modifiés et chemins libérés.
2. Terminer et vérifier la tranche PNJ réservée par Codex (mémoire d’événements, réactions bornées, répliques contextuelles, tests de non-duplication/déterminisme). Puis enregistrer son handoff pour libérer ces chemins.
3. Comparer les changements réellement présents dans le workspace à ceux de la branche/PR Jules avant tout merge. Résoudre les conflits par propriétaire des chemins et exécuter les gates sur l’intégration résultante.

### B. Boucler la campagne

4. Jouer le chapitre 4 de bout en bout : âge/prérequis, mobiliser Conseil et habitants, débat/place, trois visions aux coûts et conséquences contrastés, événement/journal, carte de progression mise à jour, chargement de sauvegarde.
5. Auditer chapitre 5 et épilogue dans le code actuel. S’assurer que les modèles proposés se fondent sur les choix antérieurs, ont des coûts et avantages réels, créent une fin claire et permettent de continuer sans répétition. Le résumé de campagne ne suffit pas comme fin jouable.
6. Ajouter un scénario de campagne scripté démarrant depuis un monde neuf, passant chaque jalon avec les actions publiques du joueur, et atteignant chaque variante de fin.

### C. Rendre le monde et l’économie profonds

7. Vérifier l’intégrité et la jouabilité de la concurrence existante. Tester un rival qui réagit à une croissance du joueur et une riposte du joueur qui modifie effectivement des résultats. Ajouter l’UI seulement après une API de simulation testée et libérée par le propriétaire.
8. Connecter les arcs de Noah, Lina, Mme Bertin, Samir, Karim, Monique et Yasmine aux événements de campagne et d’économie. Chaque arc doit avoir un état observable, une réaction et une conséquence; pas de lore en silo.
9. Concevoir puis livrer le second projet autour de la Friche comme tranche verticale complète, avec une boucle propre, un risque, des membres, un lien à la campagne et une migration testée seulement si l’état sauvegardé change.
10. Vérifier les déclencheurs des fantômes dans une vraie partie. L’audit du 1 octobre a trouvé une source d’incrément pour les 22 triggers flag-based; il reste à vérifier leur accessibilité, leur lisibilité et le coût réaliste des triggers d’état (Dejours, Rosa, Simon). Ne pas réécrire le registre sur la seule base d’une ancienne alerte disant « 15 fantômes bloqués ».

### D. Finir la présentation et la livraison

11. Recevoir ou produire un vrai kit d’assets cohérent; l’intégrer au renderer après handoff du propriétaire. Une fois l’intégration faite, vérifier la scène dans le jeu à plusieurs heures et lieux avec captures.
12. Harmoniser palette, HUD, menu, cartes d’événement, dialogues, Conseil, carte et panneaux de projet. Faire une passe lisibilité/ergonomie clavier et tactile.
13. Exécuter migration/sauvegarde, tests complets, build, scénario complet, captures et revue indépendante; corriger les problèmes bloquants avant de livrer.
14. Préparer `README.md` pour jouer immédiatement. Créer un paquet de livraison propre depuis un état Git vérifié; exclure `.env`, secrets, caches, `node_modules` et artefacts accidentels. Vérifier l’archive après création.

## Protocole de collaboration durable

- **Une seule vérité de travail** : le dépôt partagé et le tableau font office de carnet commun; les agents ne voient pas automatiquement les modifications non poussées dans un autre produit ou une autre branche.
- **Réserver avant d’écrire** : inscrire agent, état, liste exacte des fichiers, objectif et condition de libération dans `.zcode/coordination/BOARD.md`. Les audits de lecture seule peuvent se faire en parallèle; deux agents n’écrivent jamais le même fichier en même temps.
- **Séquencer l’intégration** : une branche et une PR par tâche; attendre que la dépendance soit intégrée avant le travail qui en dépend. Ne pas basculer de branche, rafraîchir ou rebaser avec des modifications d’un autre agent non sauvegardées.
- **Travailler en tranches complètes** : choisir un résultat visible et jouable, l’implémenter avec ses tests, exécuter tests + build, relire le diff, donner le résultat et libérer les chemins. Aucun « TODO » présenté comme fonctionnalité livrée.
- **Pas de `git add .`**, de reset, de suppression, de force push ou de commit groupé d’un autre agent. Vérifier `git status`, `git diff --stat`, puis les diffs de chaque fichier; ajouter seulement les chemins possédés.
- **Conserver les preuves** : inscrire les sorties réelles, captures réellement vues, migrations testées et limites. Un test ou build ancien ne valide pas le code présent aujourd’hui.
- **Communiquer peu mais utilement** : un message lors de la réservation, un lors d’une décision/dépendance réelle, et un handoff concis. Ne pas envoyer de heartbeat chaque seconde, ne pas relire le tableau en boucle, ne pas demander l’autorisation pour un détail réversible. Faire remonter uniquement les arbitrages qui changent la direction, le modèle de sauvegarde ou une conséquence durable importante.
- **Quota** : préparer une seule passe de travail compacte, limiter les comptes rendus/redondances, faire lire les sources au lieu de recopier le projet dans le prompt, et faire avancer les tâches indépendantes quand un outil IA externe est temporairement indisponible. Le travail n’est pas « H24 » lorsque l’application est arrêtée; laisser un handoff précis pour la reprise.
- **Rôle des outils** : Claude peut produire un kit d’art original; Antigravity/Jules peut intégrer le code et les systèmes; Codex peut auditer, concevoir et implémenter des chemins non réservés. Personne ne doit prétendre avoir parlé à un autre outil sans message ou artefact visible. Pas de partage de pensées privées : partager décisions, hypothèses, résultats et questions ouvertes.

## Prompt de reprise à donner à Antigravity/Jules

```text
Nous poursuivons NEURAPOLIS jusqu’à obtenir un vrai jeu de gestion complet, cohérent et jouable de bout en bout. L’utilisateur a peu de quota ChatGPT disponible; avance de façon autonome sur des tâches concrètes et évite les allers-retours de statut. Ce document est notre relais : lis-le, puis lis AGENTS.md, .zcode/coordination/BOARD.md, docs/PRODUCTION-PLAN.md, les documents visuels et les fichiers cités par la tâche.

L’utilisateur vise une profondeur comparable à un grand jeu de gestion comme Big Ambitions, avec une identité originale. Il veut une simulation vivante de Val-Ferrand : vie quotidienne, progression de 12 à 16 ans, habitants mémoriels, relations, économie, commerces, concurrence qui réagit à la croissance et aux stratégies du joueur, décisions publiques, fantômes-conseillers contradictoires, campagne avec conséquences et fins rejouables. Il veut un vrai monde Canvas 2D/2.5D avec personnages, quartiers et lumière soignés; aucune sortie de type dashboard/site web ni image isolée ne suffit.

Ne résume pas le but en un prototype. À chaque reprise, inspecte l’état Git courant, les modifications non commitées, les branches/PR et les réservations. Le snapshot de ce document mentionnait main en avance de quatre commits et du travail non commité; revalide avant toute action. Le tableau est plus récent que certains messages de docs/AGENT-COORDINATION.md. Jules a réservé la campagne chapitre 4 dans campaign.ts, game.ts, ui.ts et campaign.test.ts; n’écris pas ces chemins avant son handoff. Le registre décrit aussi la tranche PNJ Codex; vérifie si elle est toujours active.

Choisis ensuite le prochain jalon nécessaire selon l’ordre de ce document. Écris dans le tableau les chemins exacts et un objectif observable avant de coder. N’écrase, ne stashe et ne déplace jamais les changements d’un autre agent. Une tâche par branche/PR, stage uniquement les chemins que tu possèdes, jamais `git add .`, jamais de force push. Fais des revues/audits lecture seule en parallèle si utile; séquence les écritures et intègre chaque dépendance avant la suivante.

Pour chaque jalon, livre une tranche jouable : code intégré à une vraie partie, causes et conséquences visibles, tests des préconditions/branches/invariants/sauvegardes, `npm run test`, `npm run build`, et preuve visuelle réelle si l’interface change. Mets à jour le tableau avec chemins, sorties exactes, limites et handoff. Ne proclame pas « terminé » sur la base du plan ou d’un test étroit; les critères de complétude de ce document s’appliquent au jeu entier.

Continue tant qu’un jalon concret peut avancer sans décision structurante de l’utilisateur. Décide toi-même des choix réversibles et expose seulement les arbitrages durables, coûteux ou contradictoires avec les décisions écrites. En cas de blocage d’un outil (ex. quota Claude), continue une tâche indépendante et laisse un message de reprise exploitable. Ne prétends pas travailler quand l’agent ne tourne plus; ce dépôt et son handoff assurent la continuité entre sessions.
```

## Format du prochain handoff

À la fin d’une passe, compléter cette fiche dans le tableau partagé :

```text
Agent / tâche :
État : terminé, en cours, ou bloqué par un fait vérifié
Branche / commit / PR :
Chemins modifiés et réservations libérées :
Fonctionnalité réellement jouable :
Tests (commande + sortie) :
Build (commande + sortie) :
Capture/rendu vérifié :
Risques ou limites encore présents :
Prochain propriétaire et prochaine tâche disjointe :
```

**Le projet reste en cours jusqu’à ce que les critères de complétude ci-dessus soient prouvés sur l’état livré.**
