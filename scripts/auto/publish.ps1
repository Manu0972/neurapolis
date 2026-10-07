# Publie l'état du dépôt de travail sur origin/refonte-3d après vérification complète.
# Usage : powershell -ExecutionPolicy Bypass -File scripts/auto/publish.ps1 "message" [-Exclude chemin1,chemin2]
# Ne pousse jamais sur main, ne force jamais. Chemins publiés : src, tests, docs, tools,
# archive, .zcode/coordination, AGENTS.md, PROGRESS.md, scripts, .gitignore, index.html.
param(
  [Parameter(Mandatory = $true)][string]$Message,
  [string[]]$Exclude = @()
)
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Clone = Join-Path $Root '.ci\pushclone'
if (-not (Test-Path (Join-Path $Clone '.git'))) { & (Join-Path $PSScriptRoot 'setup-ci.ps1') }

Push-Location $Clone
git checkout -q refonte-3d
git pull -q --ff-only origin refonte-3d
foreach ($d in 'src', 'tests', 'docs', 'archive', 'tools', 'scripts') {
  if (Test-Path $d) { Remove-Item -Recurse -Force $d }
  $src = Join-Path $Root $d
  if (Test-Path $src) { Copy-Item -Recurse $src $d }
}
if (Test-Path '.zcode\coordination') { Remove-Item -Recurse -Force '.zcode\coordination' }
New-Item -ItemType Directory -Force '.zcode' | Out-Null
Copy-Item -Recurse (Join-Path $Root '.zcode\coordination') '.zcode\coordination'
foreach ($f in 'AGENTS.md', 'PROGRESS.md', '.gitignore', 'index.html', 'vite.config.ts', 'package.json', 'package-lock.json') { Copy-Item (Join-Path $Root $f) . -Force }
# Avec -File, "a,b" arrive en une seule chaîne : on découpe.
$Exclude = @($Exclude | ForEach-Object { $_ -split "," } | Where-Object { $_ })
foreach ($x in $Exclude) { if (Test-Path $x) { Remove-Item -Recurse -Force $x } }

$ErrorActionPreference = 'Continue'
node node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Output 'tsc en échec : publication annulée'; exit 1 }
$out = (node node_modules/vitest/vitest.mjs run 2>&1 | Out-String) -replace "$([char]27)\[[0-9;]*m", ''
$out -split "`n" | Where-Object { $_ -cmatch 'Test Files|Tests |FAIL' } | ForEach-Object { Write-Output $_ }
if ($out -cmatch 'FAIL') { Pop-Location; Write-Output 'Tests en échec : publication annulée'; exit 1 }
node node_modules/vite/bin/vite.js build | Out-Null
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Output 'Build en échec : publication annulée'; exit 1 }
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

git add -A -- src tests docs archive tools scripts .zcode/coordination AGENTS.md PROGRESS.md .gitignore index.html vite.config.ts package.json package-lock.json
git commit -q -m "$Message" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q origin refonte-3d
git log --oneline -1
Pop-Location
