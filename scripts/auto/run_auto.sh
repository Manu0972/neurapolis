#!/usr/bin/env bash
# Variante Git Bash de run_auto.ps1 (même logique). Lancement depuis la racine du dépôt :
#   bash scripts/auto/run_auto.sh
# La vérification et la publication restent faites par les scripts PowerShell (appelés par Claude).
cd "$(dirname "$0")/../.."
mkdir -p .ci/auto-logs
PROMPT="$(cat scripts/auto/PROMPT.md)"
for run in $(seq 1 "${MAX_RUNS:-40}"); do
  if ! grep -q '^- \[ \]' docs/suivi/PROGRESS.md; then
    echo "Toutes les tâches de docs/suivi/PROGRESS.md sont cochées. Fin."
    break
  fi
  stamp=$(date +%Y-%m-%d_%H-%M-%S)
  echo "[$stamp] Session $run — prochaine tâche : $(grep -m1 '^- \[ \]' docs/suivi/PROGRESS.md)"
  claude -p "$PROMPT" --permission-mode acceptEdits --allowedTools 'Bash,PowerShell,Read,Edit,Write,Glob,Grep' 2>&1 | tee ".ci/auto-logs/run_$stamp.log"
  code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then
    echo "Session interrompue (code $code : limite d'usage ou erreur). Nouvelle tentative dans 30 min."
    sleep 1800
  else
    sleep 15
  fi
done
