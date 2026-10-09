# Fabrique NEURAPOLIS.exe (application de bureau Electron, portable : un seul .exe, double-clic).
# Usage : powershell -ExecutionPolicy Bypass -File scripts/auto/build-desktop.ps1
# 1. build du jeu en un seul fichier ; 2. préparation de l'application ; 3. electron-builder.
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Verif = Join-Path $Root '.ci\verif'
$Toolchain = Join-Path $Root 'desktop\toolchain'
$ToolchainLock = Get-Content (Join-Path $Toolchain 'package.json') -Raw | ConvertFrom-Json
$ToolModules = Join-Path $Verif 'node_modules'
$Electron = Join-Path $ToolModules 'electron'
$Builder = Join-Path $ToolModules 'electron-builder\cli.js'
$InstalledElectron = Join-Path $Electron 'package.json'
$InstalledBuilder = Join-Path $ToolModules 'electron-builder\package.json'
$UseVerifToolchain = (Test-Path $InstalledElectron) -and (Test-Path $InstalledBuilder) -and (Test-Path $Builder)
if ($UseVerifToolchain) {
  $UseVerifToolchain = ((Get-Content $InstalledElectron -Raw | ConvertFrom-Json).version -eq $ToolchainLock.devDependencies.electron) -and
    ((Get-Content $InstalledBuilder -Raw | ConvertFrom-Json).version -eq $ToolchainLock.devDependencies.'electron-builder')
}
if (-not $UseVerifToolchain) {
  $ToolModules = Join-Path $Toolchain 'node_modules'
  $Electron = Join-Path $ToolModules 'electron'
  $Builder = Join-Path $ToolModules 'electron-builder\cli.js'
  if (-not (Test-Path (Join-Path $Electron 'dist\electron.exe')) -or -not (Test-Path $Builder)) {
    Push-Location $Toolchain
    npm ci --no-audit --no-fund
    $installCode = $LASTEXITCODE
    Pop-Location
    if ($installCode -ne 0) { Write-Output 'Installation du toolchain Electron en échec'; exit 1 }
  }
}
& (Join-Path $PSScriptRoot 'build-single.ps1')
$Stage = Join-Path $Verif 'desktop-build'
if (-not (Test-Path $Verif)) { throw "Environnement de vérification absent : $Verif" }
$VerifFull = [System.IO.Path]::GetFullPath($Verif).TrimEnd('\')
$StageFull = [System.IO.Path]::GetFullPath($Stage)
if (-not $StageFull.StartsWith($VerifFull + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refus de nettoyer un chemin hors de .ci/verif : $StageFull"
}
if (Test-Path $StageFull) { Remove-Item -LiteralPath $StageFull -Recurse -Force }
New-Item -ItemType Directory -Force (Join-Path $Stage 'game') | Out-Null
foreach ($file in 'main.cjs', 'preload.cjs', 'package.json', 'icon.png', 'icon.ico') {
  Copy-Item (Join-Path $Root "desktop\$file") $Stage -Force
}
Copy-Item (Join-Path $Root 'tools\net-relay.mjs') $Stage -Force
Copy-Item (Join-Path $Root 'NEURAPOLIS.html') (Join-Path $Stage 'game\NEURAPOLIS.html') -Force
$Version = (Get-Content (Join-Path $Electron 'package.json') -Raw | ConvertFrom-Json).version
Push-Location $Verif
node $Builder --win portable --x64 --projectDir $Stage "--config.electronVersion=$Version" "--config.electronDist=$(Join-Path $Electron 'dist')"
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Write-Output 'Construction de l’application en échec'; exit 1 }
Copy-Item (Join-Path $Stage 'release\NEURAPOLIS.exe') (Join-Path $Root 'NEURAPOLIS.exe') -Force
$size = [math]::Round((Get-Item (Join-Path $Root 'NEURAPOLIS.exe')).Length / 1MB, 1)
Write-Output "NEURAPOLIS.exe prêt ($size Mo) : double-clic pour jouer."
