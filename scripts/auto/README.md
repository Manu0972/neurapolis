# Reprise automatique de la refonte (Claude Code sans interface)

La boucle `run_auto.ps1` enchaîne des sessions `claude -p`. Chacune lit `docs/suivi/PROGRESS.md`, traite **une**
tâche, la vérifie, la publie sur la branche `refonte-3d` et la coche. Si une session échoue (limite
d'usage de l'abonnement atteinte, coupure réseau), la boucle attend 30 minutes et réessaie, jusqu'à
ce que toutes les tâches soient cochées.

## Une seule fois

1. Installer la CLI Claude Code si la commande `claude` n'existe pas dans un terminal :
   ```
   npm install -g @anthropic-ai/claude-code
   ```
   puis lancer `claude` une fois pour se connecter avec son compte.
2. Préparer l'environnement de vérification (node_modules sain, clone de publication) :
   ```
   powershell -ExecutionPolicy Bypass -File scripts/auto/setup-ci.ps1
   ```

## Lancer la boucle

Depuis la racine du dépôt, **quand aucune autre session Claude ne travaille sur le dépôt** :
```
powershell -ExecutionPolicy Bypass -File scripts/auto/run_auto.ps1
```
Options : `-MaxRuns 20`, `-PauseOnErrorMinutes 30`, `-PauseOkSeconds 15`. Les journaux de chaque
session sont dans `.ci/auto-logs/`. Ctrl+C arrête la boucle (le verrou `.ci/auto.lock` est retiré).

## Fichiers

| Fichier | Rôle |
|---|---|
| `PROMPT.md` | Consigne donnée à chaque session (une tâche, vérifier, publier, cocher). |
| `setup-ci.ps1` | Crée `.ci/verif` (copie avec node_modules sain et jonctions) et `.ci/pushclone`. |
| `verify.ps1` | tsc + vitest + build ; code de sortie 0 seulement si tout passe. |
| `publish.ps1 "message" [-Exclude a,b]` | Vérifie dans le clone puis pousse sur `origin/refonte-3d`. |
| `run_auto.ps1` / `run_auto.sh` | La boucle de reprise (PowerShell / Git Bash). |

## Limites

- Les sessions automatiques travaillent avec `--permission-mode acceptEdits` et une liste d'outils
  autorisés : elles modifient des fichiers et lancent des commandes sans confirmation. Relis le
  tableau `.zcode/coordination/BOARD.md` et les commits de `refonte-3d` régulièrement.
- La fusion de `refonte-3d` dans `main` reste une décision humaine (les deux branches divergent :
  voir le tableau).
- Une clé API (`ANTHROPIC_API_KEY`) contournerait la limite de 5 heures en facturant au jeton :
  c'est un choix de facturation à faire soi-même ; ces scripts n'en utilisent pas.
