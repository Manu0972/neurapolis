# Archive — pont 3D « J3D » (Trae, octobre 2026)

Déplacé ici le 2026-10-07 par la session E (Claude Code) lors de la refonte 3D (`docs/VISION.md`, `docs/DECISIONS.md` du 2026-10-07).

- `ThreeIsoRenderer.ts`, `WorldBuilder.ts`, `WorldRenderer.ts`, `world3d.ts`, `mapToWorld3d.ts` : ancien pont grille → Three.js, écrit pour la carte 48×32. Il n'était importé par aucun module du jeu, seulement par son test.
- `grid_3d_integration.test.ts` : son test, qui figeait les dimensions et les hauteurs de l'ancienne carte.

Le moteur qui le remplace est `src/presentation/city3d/`. Ce dossier est hors de `tsconfig.json` (`include: ["src", "tests"]`) : il n'est plus compilé ni testé. On peut le supprimer quand plus personne n'en a besoin.
