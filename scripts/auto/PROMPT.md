Tu reprends la refonte de NEURAPOLIS dans le dossier C:\Users\laqui\Documents\glm, en session automatique (sans utilisateur pour répondre).

1. Lis AGENTS.md, docs/VISION.md (fait foi), docs/suivi/PROGRESS.md et la fin de .zcode/coordination/BOARD.md.
2. Prends UNIQUEMENT la première tâche non cochée « - [ ] » de la section « À faire » de docs/suivi/PROGRESS.md.
   Si elle est bloquée (par exemple elle attend un travail d'Antigravity ou de Jules qui n'est pas prêt), écris pourquoi sous la tâche, passe-la en « - [~] » et prends la suivante.
3. Réserve tes chemins au tableau (.zcode/coordination/BOARD.md), avec l'identifiant « E-auto », la date et l'heure. N'écris pas dans un chemin réservé par un autre agent actif.
4. Implémente la tâche proprement, dans le style du code existant, avec des tests Vitest. Respecte les invariants : couches core ← simulation ← presentation, simulation déterministe (aucun Math.random ni Date.now), et pour tout changement de WorldState : version de sauvegarde, migrateur et test aller-retour.
5. Vérifie avec : powershell -ExecutionPolicy Bypass -File scripts/auto/verify.ps1
   Le node_modules du dépôt est illisible : n'essaie pas npm install à la racine, ce script utilise .ci/verif.
6. Si tout passe, publie avec : powershell -ExecutionPolicy Bypass -File scripts/auto/publish.ps1 "type(portée): résumé"
   Si des fichiers d'un autre agent sont en cours et cassent les tests, exclus-les avec -Exclude chemin1,chemin2 et signale-le au tableau.
   Ne pousse jamais sur main, ne force jamais, ne fais jamais git add . dans le dépôt local.
7. Coche la tâche dans docs/suivi/PROGRESS.md (« - [x] », date, hash du commit), poste un handoff au tableau (fichiers touchés, sorties réelles des vérifications, limites) et libère tes chemins.
8. Arrête-toi après cette seule tâche. Ne déclare rien vérifié sans en avoir vu la sortie.
