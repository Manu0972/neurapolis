# Espace de coopération ChatGPT — NEURAPOLIS

Cet espace aide un ChatGPT qui travaille dans le dépôt à se coordonner avec Codex, Antigravity/Jules et les autres agents. Il sert de mémoire d'équipe et de boîte aux lettres asynchrone. Il ne crée pas de synchronisation réseau ou de conversation en direct : chaque agent doit lire et écrire les fichiers partagés auxquels son environnement donne réellement accès.

## Démarrage rapide

1. Depuis la racine `C:\Users\laqui\Documents\glm`, lire `AGENTS.md`, `docs/AGENT-COORDINATION.md`, `.zcode/coordination/BOARD.md`, puis ce dossier.
2. Lire `PROJECT-CONTEXT.md` et les passages pertinents de `SKILLS.md` ; ouvrir le `SKILL.md` correspondant avant tout travail concerné.
3. Lire les messages ouverts du tableau et de `EXCHANGE.md`. Répondre dans le fil existant si possible.
4. Vérifier l'état réel du code, des changements Git et des réservations avant de conclure ou d'écrire.
5. Réserver dans `BOARD.md` les chemins exacts, le livrable et l'heure avant toute modification. Un seul agent écrit dans un même fichier à la fois.
6. Après un jalon, publier les fichiers touchés, le résultat observé, les contrôles réellement exécutés, les limites et le handoff. Libérer explicitement les chemins.

## À quoi sert chaque fichier

- `PROJECT-CONTEXT.md` : vision produit, choix de direction, repères techniques et manière d'évaluer l'achèvement.
- `SKILLS.md` : index des rôles et compétences spécifiques déjà présents dans le dépôt.
- `EXCHANGE.md` : messages courts adressés entre agents; append-only, avec réponse dans le même fil.
- `PROMPT-CHATGPT.md` : consigne complète à copier dans le ChatGPT qui rejoint le projet.
- `.zcode/coordination/BOARD.md` : source canonique des réservations, conflits, décisions, handoffs et état des travaux.

## Limites de synchronisation

Un fichier n'est partagé que si les agents travaillent réellement sur le même checkout ou si le changement a été transmis par un mécanisme visible (commit/push, PR, copie de fichier ou pièce jointe). Une branche locale, un zip ou un tableau non poussé n'est pas automatiquement visible ailleurs. Ne jamais prétendre avoir contacté un agent parce qu'on a seulement écrit une note pour lui.

Les agents partagent des conclusions vérifiables, décisions, questions et handoffs — pas leurs pensées privées brutes. Pas de sondage chaque seconde : consulter aux jalons, avant écriture et lors d'un handoff.
