# Design du système de rivalité économique

## Objectif
Créer une dynamique de concurrence où des **rivaux** (entreprises ou organisations) réagissent aux actions du joueur sur le marché du Stand des Roses. Le système doit :
- Suivre la part de marché de chaque rival.
- Influencer les prix du Stand en fonction de la concurrence.
- Générer des événements de contre‑stratégie (baisse de prix, sabotage, campagne marketing).
- Être persistant : les rivaux sont sauvegardés et migrés avec le reste du `WorldState`.

## Architecture proposée

1. **Entité `Rival`** (`src/simulation/rival.ts`)
   ```ts
   export interface Rival {
     id: string;               // identifiant unique
     name: string;            // nom affiché
     marketShare: number;     // proportion de la demande capturée (0‑1)
     priceMultiplier: number; // facteur appliqué au prix du Stand
     strategy: 'aggressive' | 'defensive' | 'neutral';
   }
   ```
2. **Extension du `WorldState`** (`src/core/types.ts`)
   ```ts
   export interface WorldState {
     // …existant
     rivals: Record<string, Rival>;
   }
   ```
3. **Mécanique d’influence du marché** (`src/simulation/market.ts`)
   - Calcul de la part de marché du Stand via `WorldState.project.sales` vs `rivals.marketShare`.
   - Ajustement du prix du Stand : `standPrice *= (1 - totalRivalShare * rivalryFactor)`.
   - `rivalityFactor` est un paramètre configurable (ex. 0.2).
4. **Événements de contre‑stratégie** (`src/simulation/events.ts`)
   - `RivalPriceWar`, `RivalSabotage`, `RivalMarketingPush`.
   - Chaque événement crée une `UIEvent` visible par le joueur.
5. **Persistabilité** (`src/saves/migrations.ts`)
   - Ajouter un migration v4 qui introduit `WorldState.rivals` et convertit les sauvegardes v3.
   - Tests de migration dans `tests/saves.test.ts`.

## Tests unitaires (plan)
- **Création et mise à jour d’un rival** : vérifier que `marketShare` et `priceMultiplier` sont correctement stockés.
- **Application de l’influence du marché** : simuler une journée avec un rival actif et valider le nouveau prix du Stand.
- **Génération d’événement UI** : s’assurer que chaque contre‑stratégie pousse un `pushEvent`.
- **Invariant du ledger** : après chaque mise à jour, `ledgerInvariantHolds` doit rester vrai.

## Interaction UI (présentation)
- Ajout d’un tableau « Rivals » dans l’interface du Stand (`src/presentation/game.ts`).
- Boutons permettant au joueur de déclencher des réponses (ex. contre‑marketing).

## Impact sur le reste du projet
- Aucun changement dans la logique existante du Stand ; le module se branche comme un *wrapper* autour de `buyStock`, `recruitMember`, etc.
- Le design reste compatible avec les trois options de rendu (2D, 2.5D, 3D) car il agit uniquement sur la couche simulation.

---
*Ce document est placé dans `docs/` afin d’être consultable sans réserver de fichiers de code.*
