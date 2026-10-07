@echo off
rem NEURAPOLIS - serveur LAN pour jouer a plusieurs (NordVPN Meshnet ou reseau local).
rem Garde cette fenetre ouverte pendant la partie. Ctrl+C pour arreter.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js est necessaire : https://nodejs.org & pause & exit /b 1)
node tools\lan-server.mjs %*
pause
