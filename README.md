# NEURAPOLIS

> À douze ans, dans la Cité des Roses (Val-Ferrand, septembre 2020), tu vis, tu apprends, tu entreprends — et ton esprit se peuple peu à peu de **fantômes intellectuels** qui n'apparaissent que lorsque ta vie les fait naître.

Prototype vertical — Vite + TypeScript strict + Canvas 2D + Vitest, **zéro dépendance runtime**.

## Lancement

```bash
npm install
npm run dev     # serveur de développement (Vite)
npm run test    # suite de tests (Vitest)
npm run build   # tsc --noEmit + vite build
```

## Contrôles

- **Se déplacer** : ZQSD, WASD ou flèches (tactile : joystick virtuel, en bas à gauche).
- **Interagir** : `E` (tactile : bouton rond, en bas à droite).
- **Écrans** : boutons en haut à droite — Personnage · Relations · Journal · Projet · Conseil.
- **Conseil** : quand une voix s'éveille, choisis de l'écouter ou de la repousser.

## Architecture

| Couche | Dossier | Rôle |
|---|---|---|
| État | `src/core` | Le contrat du monde (`types.ts`), le temps, le PRNG déterministe mulberry32 — ne connaît rien au-dessus. |
| Données | `src/data` | Fantômes, PNJ, lieux, actions, notions, textes — interprétés par le moteur, jamais codés en dur. |
| Moteur | `src/simulation` | Besoins, quartier, stand, Conseil, fusions — pur, sans DOM, testable. |
| Persistance | `src/saves` | Sauvegardes JSON versionnées (migrations v0→v3), auto-sauvegarde de fin de journée. |
| Interface | `src/presentation` | Canvas 2D (monde) + DOM (écrans) — lit l'état, ne le modifie jamais. |
