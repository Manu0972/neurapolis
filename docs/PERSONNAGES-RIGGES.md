# Personnages riggés du studio dans le jeu

Code : `src/presentation/city3d/rigged/` (manifeste, choix du clip, chargeur, personnage hybride).

## Ajouter un personnage prêt
1. Copier `studio/sorties/personnages/<id>/rig.glb` dans `public/personnages/<id>/rig.glb`
   et `studio/sorties/personnages/index.json` dans `public/personnages/index.json` (tel quel).
2. Relancer le jeu. Un modèle `bertin_1` va au PNJ `bertin` (convention `<pnj>_<n>`).
3. Options (format objet) :
   `{ "personnages": [{ "id": "passant_1", "auto": true, "categorie": "adulte" }],
      "attributions": { "karim": "passant_1", "samir": null }, "joueur": "camille_1", "repartition": 0.5 }`
   — `auto` : modèle distribué aux habitants/PNJ sans modèle (tirage déterministe par id, même tranche d'âge) ;
   `null` force le personnage procédural ; `joueur` habille le joueur.

`public/personnages/` est ignoré par Git (modèles dérivés de LoRA privés) : sans lui, le jeu reste procédural.
Attention : un `vite build` local copie ce dossier dans `dist/` — ne pas publier ce `dist/`.

## Licence des animations
`public/assets/anim/neurapolis_anims.glb` : 35 clips de la Universal Animation Library 1 et 2 (version Standard),
Quaternius, https://quaternius.com/packs/universalanimationlibrary.html — **CC0 1.0** (domaine public).
Squelette seul, sans maillage ni doigts (élagué par `tools/assets/prune_glb.py`, branche `claude/intelligent-cray-8z6iz9`).
