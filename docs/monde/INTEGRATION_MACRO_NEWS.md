# Intégration des Dépêches Macroéconomiques (Paliers 5-6)

Ce document décrit le raccordement futur entre le moteur de simulation macro (issues #30 et #31) et le générateur déterministe de dépêches d'actualité (`src/simulation/macro_dispatch.ts`).

1. **Extraction des agrégats (#30 & #31)** : Lors de l'exécution du pas annuel ou périodique du moteur macro (ex. `simulerAnneeMonde` ou mise à jour des cohortes), extraire pour chaque région simulée un cliché `MacroSnapshot` (population, indice de fret, indice d'énergie, variation annuelle).
2. **Conservation de l'état précédent** : Conserver le cliché de la période $T-1$ (`prevSnapshots`) dans l'état de simulation macro globale.
3. **Appel du générateur** : Transmettre `prevSnapshots`, `nextSnapshots` ainsi que l'état PRNG déterministe du monde (`WorldState.rng` ou graine dérivée) à la fonction `dispatchesFromSnapshots(prev, next, rng)`.
4. **Diffusion dans le fil d'actualités** : Convertir les dépêches générées (`MacroDispatch[]`) en événements de journal (`w.events` ou `w.happenings`) pour alimenter le fil d'actualités mondial du joueur aux paliers 5 et 6.
