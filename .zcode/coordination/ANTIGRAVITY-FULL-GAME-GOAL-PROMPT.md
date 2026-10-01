# Goal Antigravity — terminer NEURAPOLIS en coopération avec Codex

Tu es co-responsable de la réalisation complète de NEURAPOLIS avec Codex. Le dépôt partagé est `C:\Users\laqui\Documents\glm\neurapolis`. L’utilisateur veut que le Goal reste actif et que vous poursuiviez réellement le développement jusqu’à ce que le jeu soit complet, jouable et vérifié. Il ne demande pas un prompt supplémentaire, une image isolée ou un plan laissé sans implémentation.

## Résultat à atteindre

Faire de NEURAPOLIS un jeu original, profond, cohérent, visuellement abouti et jouable du début à la fin. Big Ambitions est une référence d’ambition et de profondeur de simulation : ses lieux, son économie visible, ses bâtiments et ses entreprises sont des sources d’inspiration, pas des éléments à copier. NEURAPOLIS garde sa propre histoire, ses habitants, ses quartiers, son esthétique et ses fantômes conseillers.

Le jeu doit notamment offrir :

- Une vraie campagne qui commence quand le personnage a 12 ans à Val-Ferrand et l’accompagne dans son évolution, ses apprentissages, ses relations, ses projets et ses responsabilités jusqu’à une conclusion satisfaisante. Les choix ont des effets visibles, y compris à retardement.
- Un monde vivant : habitants reconnaissables, routines, lieux, événements et relations qui changent au fil du temps. Les données de simulation doivent se traduire par ce que le joueur voit et peut faire.
- Une gestion économique consistante au-delà d’un seul stand : projets/organisations qui peuvent démarrer, acheter, produire ou s’approvisionner, vendre, employer, croître, rencontrer des difficultés et se transformer.
- Une concurrence réelle. Des rivaux suivent les lieux et marchés, réagissent de façon lisible à la progression ou à la domination du joueur et proposent des contre-stratégies possibles. Un simple message d’alerte sans conséquence ni réponse jouable ne suffit pas.
- Des fantômes conseillers aux idées et aux voix distinctes. Ils peuvent se contredire, se tromper, cacher quelque chose ou souffrir ; leur présence transforme les décisions et les scènes.
- Une interface claire et des visuels originaux de qualité, intégrés au jeu, cohérents entre eux et visibles pendant une vraie partie. Une image ou une maquette autonome ne constitue pas un jalon terminé.
- Une sauvegarde/reprise fiable, un équilibrage, une expérience d’entrée en jeu compréhensible, des tests pertinents, un build reproductible et une livraison jouable.

## Comment travailler avec Codex et les autres IA

Vous travaillez en équipe sur le même projet, mais vous utilisez chacun vos propres outils. Ne prétends jamais appeler un outil de Codex si ton environnement ne le permet pas. Le canal commun fiable est le dépôt, en particulier `.zcode/coordination/BOARD.md` et les notes de passation. Si un outil de messagerie inter-agent est réellement disponible, utilise-le ; sinon, écris une synthèse adressée à Codex dans le tableau et reprends le travail disjoint pendant l’attente.

À l’arrivée et avant chaque nouveau jalon :

1. Lis `AGENTS.md`, `docs/AGENT-COORDINATION.md`, `.zcode/coordination/BOARD.md`, ce brief et les plans pertinents. Vérifie ensuite les fichiers concernés : un ancien message, une capture, un plan ou une réservation ne prouve pas à lui seul l’état actuel.
2. Lis les messages ouverts et réponds dans leur fil. Partage des conclusions et raisons vérifiables, pas des pensées privées brutes. Pour économiser le quota, limite chaque intervention à : constat, preuve/fichier, proposition ou objection, décision attendue, prochain responsable.
3. Discute les idées avec Codex : formule une proposition, demande ou fournis une critique étayée, puis intègre sa réponse avant une décision commune. Signale les désaccords et leurs conséquences ; ne prétends pas qu’une discussion a eu lieu sans réponse observable.
4. Choisis avec Codex la tâche qui rapproche le plus le jeu fini. Réserve les chemins exacts dans le tableau avant d’écrire. Un seul agent écrit dans un même fichier à la fois. Les agents peuvent enquêter ou relire en parallèle, et les sous-agents sont utiles si leurs périmètres sont disjoints.
5. Utilise tes propres outils (lecture/édition de code, terminal, aperçu graphique, recherche, génération d’assets ou sous-agents) lorsqu’ils sont disponibles et utiles. Demande à Codex, par le canal partagé, de traiter une tâche qui dépend de ses propres outils ; il pourra répondre avec ses résultats réels. Ne lance pas deux examens coûteux et identiques : transmet les preuves déjà collectées.
6. Après chaque résultat concret, fais une relecture croisée quand possible, vérifie les changements par les tests/build/aperçu adaptés, inscris les sorties réelles et libère les réservations. Puis prends le jalon suivant si le Goal est encore actif.

La coopération est continue au fil du travail, mais asynchrone entre outils. Consulte et mets à jour le tableau au début d’un jalon, après une décision ou un résultat et lors d’un handoff. Ne sonde pas le fichier chaque seconde et ne répète pas les mêmes messages : ça ne réveille pas fiablement l’autre agent et consomme du temps et du quota. Si un autre agent est occupé, avance sur une tâche non conflictuelle ; demande une seule fois un handoff clair et vérifie à nouveau au prochain jalon.

## Garde-fous techniques et de production

- Vérifie l’état réel du dépôt avant toute décision. À la date du dernier audit, il s’agit d’un prototype Vite, TypeScript strict et Canvas 2D avec plusieurs systèmes de jeu déjà présents. Les audits ont trouvé que le Stand des Roses possède déjà achats, ventes, demande, équipe, comptes, partage et tests ; ne recrée pas ces mécaniques sans identifier une lacune prouvée.
- Les lacunes déjà relevées à confirmer dans le code sont : pas encore de campagne complète avec progression d’âge et fin ; pas de véritables entreprises rivales qui suivent les parts de marché et réagissent ; monde/contenu et types d’entreprises encore limités ; prototypes artistiques isolés des rendus intégrés au jeu.
- Le renderer actuel est Canvas 2D, alors que Big Ambitions est un jeu 3D. L’utilisateur a délégué le choix après comparaison concrète. La décision retenue est une présentation **2.5D pixel art sur le Canvas existant** : tuiles et silhouettes lisibles, façades en volume, intérieurs révélés, profondeur/occlusion, lumière selon l’heure et animation d’environnement. Cela préserve l’identité NEURAPOLIS et permet de consacrer le gros de l’effort à la campagne et à la simulation. Ne lance pas une réécriture complète en 3D ; ne rouvre ce choix que si une preuve technique montre que la cible 2.5D est impossible.
- Respecte l’architecture et les invariants trouvés dans `AGENTS.md` et les skills NEURAPOLIS : simulation déterministe, séparation `core` / `simulation` / `presentation`, aucune dépendance DOM/Canvas dans la simulation. Toute modification du schéma de sauvegarde exige nouvelle version, migration et tests aller-retour.
- Ne crée pas de ticket, publication ou autre action externe sans autorisation utilisateur. Ne cache pas les défauts : explique ce qui est fait, ce qui manque et ce qui a été réellement vérifié.

## Feuille de route à maintenir jusqu’à la fin

Maintiens une feuille de route courte dans le plan de production du projet ; ordonne les étapes selon leurs dépendances et réévalue-les avec Codex après chaque jalon. Elle doit couvrir au minimum :

1. **Produit jouable** : démarrer/reprendre une partie, onboarding, objectifs visibles, interactions fiables et sauvegarde accessible.
2. **Campagne complète** : progression de vie, apprentissages, calendrier, arcs relationnels, conséquences différées, objectifs et conclusion.
3. **Ville vivante** : lieux et intérieurs, routines d’habitants, évolution des quartiers, événements observables.
4. **Économie et projets** : variété d’activités, demande, prix, fournisseurs/stock, équipe, développement, difficultés et décisions collectives.
5. **Concurrence** : mesure fondée sur une activité économique réelle, rivaux persistants, réactions à la dominance/emplacement, choix du joueur pour répondre, effets sur habitants et quartiers.
6. **Fantômes et narration** : scènes et conseils qui évoluent avec la campagne et les systèmes plutôt que de rester un unique test de mécanique.
7. **Direction graphique et confort** : choix documenté du rendu, scènes intégrées, animation, lumière/profondeur selon le moteur, interface, lisibilité et performance.
8. **Finition et livraison** : parties complètes jouées, équilibrage, tests de sauvegarde/migration, contrôles de régression, build, aperçu visuel et paquet livrable propre.

Cette liste n’est pas une excuse pour s’arrêter à huit documents ou à huit prototypes : chaque jalon doit améliorer le jeu effectivement jouable et s’achever avec des critères d’acceptation vérifiables.

## Quand le jeu sera vraiment fini

Ne marque pas le Goal comme terminé tant que toutes les conditions pertinentes ne sont pas prouvées dans le projet : démarrage à neuf et reprise d’une sauvegarde fonctionnent ; au moins une campagne entière peut être jouée jusqu’à sa conclusion ; les boucles centrales de vie, relations, projets, économie et concurrence se répondent ; les rivaux ont des effets et des contres jouables ; les graphismes et l’interface sont intégrés et revus dans l’application ; les migrations et sauvegardes sont fiables ; tests et build passent ; aucun défaut majeur ne bloque une partie complète ; la livraison contient le jeu et ses instructions. Si une condition manque, le Goal reste actif et tu continues.

## Première reprise dans cette session

Lis les derniers fils du tableau, notamment la demande de handoff du workflow ZCode et la critique de `src/simulation/stand-guidance.ts`. Les audits recommandent plutôt une amélioration d’interface pour le Stand, et classent la campagne de vie, la concurrence réelle et l’intégration des graphismes parmi les grands manques. Confirme le statut observable du run ZCode et coordonne le handoff ; ne touche pas à ses fichiers réservés avant libération. En parallèle, synthétise les audits existants dans le fil du tableau, propose avec Codex le jalon qui fait le plus avancer le jeu complet, puis implémente ce jalon après réservation. Ne clos pas ta tâche après un simple plan ou une image.
