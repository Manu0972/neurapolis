# Construit NEURAPOLIS en un seul fichier (NEURAPOLIS.html à la racine du projet).
# Usage : powershell -ExecutionPolicy Bypass -File scripts/auto/build-single.ps1
# Le build tourne dans .ci/verif (node_modules réparé), puis la page est copiée à la racine.
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Verif = Join-Path $Root '.ci\verif'
Push-Location $Verif
node node_modules/vite/bin/vite.js build --config tools/vite.single.config.ts
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Output 'Build en échec'; exit 1 }
Pop-Location
Copy-Item (Join-Path $Verif 'dist-single\NEURAPOLIS.html') (Join-Path $Root 'NEURAPOLIS.html') -Force
$size = [math]::Round((Get-Item (Join-Path $Root 'NEURAPOLIS.html')).Length / 1MB, 2)
Write-Output "NEURAPOLIS.html prêt ($size Mo) : double-clic pour jouer, ou jouer-en-lan.bat pour le multijoueur."
