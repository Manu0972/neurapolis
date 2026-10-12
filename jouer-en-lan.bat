@echo off
rem NEURAPOLIS - serveur pour jouer a plusieurs en reseau local (meme box ou meme Wi-Fi).
rem Garde cette fenetre ouverte pendant la partie. Ctrl+C pour arreter.
rem Option : jouer-en-lan.bat --port 8766
title NEURAPOLIS - partie en reseau local
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js est necessaire : https://nodejs.org & pause & exit /b 1)
if exist "dist\index.html" goto lancer
if exist ".ci\verif\dist\index.html" goto lancer
if exist "NEURAPOLIS.html" goto lancer
if not exist "node_modules\vite\bin\vite.js" (echo Le jeu n est pas construit : lance d abord npm ci puis npm run build. & pause & exit /b 1)
echo Premiere fois : construction du jeu, patiente une minute...
node node_modules\vite\bin\vite.js build || (echo La construction a echoue. & pause & exit /b 1)
:lancer
node tools\lan-server.mjs %*
pause
