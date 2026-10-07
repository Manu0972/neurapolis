# Vérifie le dépôt de travail : typage, tests, build. Code de sortie 0 seulement si tout passe.
# Usage : powershell -ExecutionPolicy Bypass -File scripts/auto/verify.ps1
$ErrorActionPreference = 'Continue'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Verif = Join-Path $Root '.ci\verif'
if (-not (Test-Path (Join-Path $Verif 'node_modules\vitest'))) {
  & (Join-Path $PSScriptRoot 'setup-ci.ps1')
}
Push-Location $Verif
$failed = $false

Write-Output '== tsc --noEmit'
node node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) { $failed = $true }

Write-Output '== vitest run'
$out = node node_modules/vitest/vitest.mjs run 2>&1 | Out-String
$clean = $out -replace "$([char]27)\[[0-9;]*m", ''
$clean -split "`n" | Where-Object { $_ -cmatch 'Test Files|Tests |FAIL|×' } | ForEach-Object { Write-Output $_ }
# -cmatch : sensible à la casse (« faillite » n'est pas un échec).
if ($clean -cmatch 'FAIL') { $failed = $true }

Write-Output '== vite build'
$build = node node_modules/vite/bin/vite.js build 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { $failed = $true }
($build -replace "$([char]27)\[[0-9;]*m", '') -split "`n" | Select-Object -Last 2 | ForEach-Object { Write-Output $_ }
Remove-Item -Recurse -Force (Join-Path $Verif 'dist') -ErrorAction SilentlyContinue

Pop-Location
if ($failed) { Write-Output 'VÉRIFICATION EN ÉCHEC'; exit 1 }
Write-Output 'VÉRIFICATION OK'
exit 0
