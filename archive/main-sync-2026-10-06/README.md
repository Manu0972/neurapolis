# Archive — instantané « sync » de main du 2026-10-06

Fusion de `main` (commit 44e3637, « sauvegarde complète de toutes les branches et tags ») dans
`refonte-3d`, le 2026-10-08, à la demande de l'utilisateur (« unifie et fusionne »).

- Le code source de `refonte-3d` fait foi : il contient déjà, en plus récent et testé, l'écran de
  création, les sauvegardes et le rendu que ce vieil instantané modifiait.
- Les documents ajoutés par `main` sont gardés tels quels (`DECISIONS.md`, `PROPOSALS.md`,
  `ROADMAP_TASKS.md`, `.zcode/coordination/FAST-RELAY.md`, rapport j3d2).
- `character-creator.test.ts` testait l'ancienne API de création (budget de 292 points) : archivé ici.
  La création actuelle est couverte par `tests/character_creation.test.ts`.
- `map-to-world3d.test.ts` testait l'ancien moteur `src/rendering/` : archivé avec lui dans
  `archive/j3d-trae-2026-10/`.
