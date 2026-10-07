#!/bin/bash
# Télécharge les packs d'assets MakeHuman (CC0) listés en arguments dans le dossier courant.
for p in "$@"; do
  z=$(curl -sL -m 30 "https://files2.makehumancommunity.org/asset_packs/$p/" | grep -oE 'href="[^"/?]+\.zip"' | head -1 | sed 's/href="//;s/"//')
  if [ -z "$z" ]; then echo "AUCUN ZIP $p"; continue; fi
  curl -sL -m 3600 -o "$z" "https://files2.makehumancommunity.org/asset_packs/$p/$z" && echo "OK $z $(stat -c %s "$z")" || echo "ECHEC $p"
done
