# Contexte de projet partagé — NEURAPOLIS

## Vision utilisateur

Construire et terminer un vrai jeu de gestion original, profond, cohérent et jouable du début à la fin. L'ambition systémique peut évoquer *Big Ambitions* — ville parcourable, lieux et intérieurs, économie lisible, activités qui grandissent, concurrents qui réagissent — sans copier ses personnages, ses marques, ses assets ou son identité. NEURAPOLIS garde son univers, ses habitants, ses quartiers et sa narration.

Le joueur commence à 12 ans à Val-Ferrand et traverse une vie qui évolue : besoins et apprentissages, école, relations, projets, responsabilités, décisions collectives et conséquences visibles parfois retardées. Les habitants ont des routines et des mémoires. Les systèmes doivent se répondre dans le jeu, pas seulement produire des menus, rapports ou notifications. Les fantômes/conseillers ont des idées et des voix distinctes, peuvent se contredire et se tromper. Le journal doit rendre les causes et effets compréhensibles.

L'économie doit dépasser une unique activité : projets distincts, approvisionnement, demande, ventes, équipe, croissance et difficultés. Les concurrents doivent suivre des marchés et des emplacements, réagir à la progression du joueur et ouvrir des contre-stratégies jouables qui affectent aussi le quartier. Les choix doivent transformer le monde et l'épilogue.

Le résultat attendu est un jeu vidéo, pas un tableau de bord ou un prototype d'image. Les graphismes originaux doivent être intégrés au runtime et vérifiés dans une vraie partie. La cible décidée par l'utilisateur est une présentation **pixel art 2.5D sur le Canvas existant** : volumes, profondeur, occlusion, intérieurs, éclairage et animation sans migration générale vers la 3D.

## Source de vérité et état à revalider

- Le checkout canonique visé par l'utilisateur est `C:\Users\laqui\Documents\glm`. Vérifier `git status`, branche et commit avant de travailler : d'autres worktrees et copies locales existent.
- `AGENTS.md` et `.zcode/coordination/BOARD.md` gouvernent les réservations et l'intégration. `docs/AGENT-COORDINATION.md` garde aussi des messages historiques du run `dwfrun-ccb08c38`; les dates, tâches et statuts qui y figurent ne sont pas automatiquement l'état actuel.
- `.zcode/coordination/ANTIGRAVITY-FULL-GAME-GOAL-PROMPT.md` contient un brief de production plus développé. Le consulter pour reprendre les critères de campagne et de finition ; vérifier ses constats dans le code avant de les traiter comme actuels.
- Des échanges du tableau mentionnent des chapitres, des tests et un build antérieurs. Ce sont des preuves datées, pas une garantie de l'état actuel ni de l'intégration dans la branche active.
- Les audits antérieurs ont signalé des divergences entre documents, code et tableaux de coordination, ainsi que des chemins non suivis et plusieurs worktrees. N'écraser, supprimer, nettoyer, déplacer ou intégrer aucun changement sans inspection et réservation.

## Invariants techniques

- Architecture : `core` ← `simulation` ← `presentation`. La simulation ne dépend ni du DOM ni du Canvas ; la présentation lit l'état du monde.
- Simulation déterministe : utiliser le PRNG du projet ; pas de `Math.random()` ni de `Date.now()` dans la simulation.
- Modifier le schéma `WorldState` exige une version de sauvegarde, un migrateur et un test aller-retour.
- Lire `AGENTS.md` et les skills applicables. Inspecter les systèmes existants avant d'ajouter un doublon.
- Un changement ne peut être déclaré vérifié que si le contrôle a été exécuté et sa sortie observée. Une preuve de test ancienne ou provenant d'une autre branche ne suffit pas.

## Façon de collaborer

Le tableau est le registre des propriétaires, chemins réservés, décisions et handoffs. `EXCHANGE.md` sert aux messages brefs du second ChatGPT. Pour chaque échange, indiquer : identifiant/agent, destinataire, sujet, constat et preuve, proposition ou demande, état et prochain responsable. Répondre dans le même fil.

Les agents peuvent analyser ou relire en parallèle, mais doivent réserver avant toute écriture. Ne pas écrire sur des chemins détenus par autrui. Un intégrateur unique prend les fichiers qui se chevauchent ; les autres livrent une proposition ou attendent un handoff. Ne jamais faire `git add .`, de reset, de stash ou de nettoyage global dans ce dépôt partagé. N'ajouter au commit que ses propres chemins réservés.

Continuer par jalons réellement livrables jusqu'à la fin du jeu ; ne pas s'arrêter à un prompt, une image, une liste d'idées ou une démo partielle. Solliciter l'utilisateur uniquement pour une décision de produit importante qui ne se déduit ni de ses demandes ni des décisions consignées. Laisser le travail reprendre facilement si une session ou un quota s'arrête.

## Définition de fin à prouver

Ne déclarer le jeu fini qu'après avoir démontré : démarrage neuf et reprise; onboarding et interactions compréhensibles; campagne entière jusqu'à une conclusion; boucles de vie, relations, projets, économie, quartiers, concurrence et narration reliées; rivaux persistants avec effets et réponses jouables; présentation 2.5D intégrée et relue en application; sauvegarde/migrations fiables; contrôles automatisés et build actuels réussis; partie complète sans blocage majeur; livraison propre avec instructions. Sinon, inscrire le manque concret et le prochain pas exécutable.
