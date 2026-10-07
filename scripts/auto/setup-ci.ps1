# Prépare l'environnement durable de vérification et de publication dans .ci/ (ignoré par git).
#  - .ci/verif     : copie avec un node_modules sain ; src, tests, public, tools sont des jonctions
#                    vers le dépôt (le node_modules racine est illisible, ACL cassée).
#  - .ci/pushclone : clone GitHub sur la branche refonte-3d, pour committer et pousser (certains
#                    dossiers de .git/objects du dépôt local sont aussi illisibles).
# Idempotent : on peut le relancer sans risque.
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Ci = Join-Path $Root '.ci'
$Verif = Join-Path $Ci 'verif'
$Clone = Join-Path $Ci 'pushclone'
New-Item -ItemType Directory -Force $Verif | Out-Null

foreach ($f in 'package.json', 'package-lock.json', 'tsconfig.json', 'index.html') {
  Copy-Item (Join-Path $Root $f) $Verif -Force
}
$ViteConfig = @'
import { defineConfig } from 'vitest/config';
// Copie de vérification : src/tests sont des jonctions ; on garde le chemin du lien pour que
// les imports nus se résolvent dans le node_modules de cette copie.
export default defineConfig({
  base: './',
  resolve: { preserveSymlinks: true },
  server: { port: 5180, host: true, fs: { strict: false } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
'@
Set-Content -Path (Join-Path $Verif 'vite.config.ts') -Value $ViteConfig -Encoding utf8

foreach ($d in 'src', 'tests', 'public', 'tools') {
  $link = Join-Path $Verif $d
  $target = Join-Path $Root $d
  if ((Test-Path $target) -and -not (Test-Path $link)) {
    cmd /c mklink /J "$link" "$target" | Out-Null
  }
}
if (-not (Test-Path (Join-Path $Verif 'node_modules\vitest'))) {
  Push-Location $Verif
  npm ci --no-audit --no-fund
  Pop-Location
}

if (-not (Test-Path (Join-Path $Clone '.git'))) {
  git clone https://github.com/Manu0972/neurapolis.git "$Clone"
}
Push-Location $Clone
git fetch -q origin
git checkout -q refonte-3d
git pull -q --ff-only origin refonte-3d
Pop-Location
if (-not (Test-Path (Join-Path $Clone 'node_modules'))) {
  cmd /c mklink /J "$(Join-Path $Clone 'node_modules')" "$(Join-Path $Verif 'node_modules')" | Out-Null
}
Write-Output 'Environnement .ci prêt.'
