# NEURAPOLIS — Journal des décisions

| Date | Décision | Pourquoi |
|---|---|---|
| 2026-09-29 | Stack : Vite + TS strict + Canvas 2D + Vitest, zéro dépendance runtime | Suite du prototype HTML ; testable en session (Godot absent) ; « le code doit survivre 10 ans » |
| 2026-09-29 | Simulation-first : noyau testable sans rendu | Exigence Bible Partie XVI |
| 2026-09-29 | PRNG mulberry32 sérialisé dans l'état | Parties reproductibles, tests stables |
| 2026-09-29 | Fantômes = personnages, apparition PROGRESSIVE par déclencheurs vécus | Demande explicite : pas tous présents d'emblée ; on les mérite en devenant meilleur |
| 2026-09-29 | Plafond de 4 voix actives + silhouettes pour les inconnus | Le Conseil reste lisible ; l'écran montre ce qui reste à découvrir |
| 2026-09-29 | Fiches fantômes = données (`src/data/ghosts`), moteur interprète | « Données avant contenus » |
| 2026-09-29 | Réputation du joueur : bornes 0-100, départ 45 ; sources +2 vente réussie / +1 course / +3 arbitrage réussi / −5 incident ; confiance quartier ≥60 → +1/jour ; seuil 70 → stage Samir | Relecture indépendante : la valeur n'était pas spécifiée (auteur : Producteur, intégré par Documentaliste) |
| 2026-10-01 | Proposition de design : l’âge du joueur augmente d’un an chaque 1er septembre, à partir de 12 ans au début du jeu (2020-09-01), âge calculé depuis la date de jeu sans champ de sauvegarde supplémentaire | Aligne l’âge sur le calendrier scolaire et la date de départ déjà définis dans `src/core/types.ts` et `src/core/store.ts` ; proposition du propriétaire du code, consignée par le Documentaliste, à valider côté système/architecture |
