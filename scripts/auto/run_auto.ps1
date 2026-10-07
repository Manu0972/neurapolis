# Boucle de reprise automatique de la refonte NEURAPOLIS par Claude Code (mode sans interface).
# Chaque passage lance une session « claude -p » qui traite UNE tâche de PROGRESS.md, la vérifie,
# la publie sur refonte-3d et la coche. En cas d'erreur (limite d'usage atteinte, coupure),
# la boucle attend puis réessaie, jusqu'à ce que toutes les tâches soient cochées.
#
# Lancement (depuis la racine du dépôt, dans un terminal PowerShell) :
#   powershell -ExecutionPolicy Bypass -File scripts/auto/run_auto.ps1
# Options : -MaxRuns 20 -PauseOnErrorMinutes 30 -PauseOkSeconds 15
#
# Ne pas lancer pendant qu'une session interactive travaille déjà sur le dépôt : un verrou
# (.ci/auto.lock) empêche seulement deux boucles simultanées.
param(
  [int]$MaxRuns = 40,
  [int]$PauseOnErrorMinutes = 30,
  [int]$PauseOkSeconds = 15
)
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root
$Ci = Join-Path $Root '.ci'
New-Item -ItemType Directory -Force (Join-Path $Ci 'auto-logs') | Out-Null
$Lock = Join-Path $Ci 'auto.lock'
if (Test-Path $Lock) {
  $other = Get-Content $Lock -ErrorAction SilentlyContinue
  if ($other -and (Get-Process -Id ([int]$other) -ErrorAction SilentlyContinue)) {
    Write-Output "Une boucle tourne déjà (PID $other). Arrêt."
    exit 1
  }
}
Set-Content -Path $Lock -Value $PID

& (Join-Path $PSScriptRoot 'setup-ci.ps1')
$Prompt = Get-Content (Join-Path $PSScriptRoot 'PROMPT.md') -Raw -Encoding UTF8

try {
  for ($run = 1; $run -le $MaxRuns; $run++) {
    $todo = Select-String -Path (Join-Path $Root 'PROGRESS.md') -Pattern '^- \[ \]' -SimpleMatch:$false
    if (-not $todo) {
      Write-Output 'Toutes les tâches de PROGRESS.md sont cochées. Fin.'
      break
    }
    $stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $log = Join-Path $Ci "auto-logs\run_$stamp.log"
    Write-Output "[$stamp] Session $run/$MaxRuns — prochaine tâche : $($todo[0].Line)"
    claude -p $Prompt --permission-mode acceptEdits --allowedTools 'Bash,PowerShell,Read,Edit,Write,Glob,Grep' 2>&1 | Tee-Object -FilePath $log
    $code = $LASTEXITCODE
    if ($code -ne 0) {
      Write-Output "Session interrompue (code $code : limite d'usage ou erreur). Nouvelle tentative dans $PauseOnErrorMinutes min."
      Start-Sleep -Seconds ($PauseOnErrorMinutes * 60)
    } else {
      Write-Output "Session terminée. Pause de $PauseOkSeconds s."
      Start-Sleep -Seconds $PauseOkSeconds
    }
  }
} finally {
  Remove-Item $Lock -ErrorAction SilentlyContinue
}
