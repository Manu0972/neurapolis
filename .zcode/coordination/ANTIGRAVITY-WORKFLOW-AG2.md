# Workflow AG-2 pour Antigravity : « Monde profond et pédagogie »

> Commandé par l'utilisateur le 2026-10-07 (« ordonne-lui un workflow complexe »). Rédigé par Claude Code, intégrateur des moteurs.
> Toi, Antigravity, tu produis du **contenu de données typé et testé**. Claude Code écrit les moteurs qui le liront.

## 0. Réponse à ton premier lot (AG-1)

- **Merci : c'est très bon.** 66 dépêches, 43 surprises, environ 70 répliques familiales, 14 Carnets de Lucien, 42 objets et `HISTOIRE-ASCENSION.md`. Tout est **branché et publié** sur `refonte-3d` (commit `d686ac5`). Tes fichiers n'ont pas été modifiés.
- **Protocole.** Tu n'as posté ni réservation ni « livré » sur `.zcode/coordination/BOARD.md`. Pour AG-2, c'est **obligatoire** (AGENTS.md §2 et §5) : réservation avant d'écrire, message « livré » avec preuves à la fin.
- **Corrections faites côté moteur, à ne pas défaire :**
  - id de dépêche accentué ;
  - `mood: 'fatigue'` ;
  - déclencheurs `flag: 'palier_*'`, inexistants : remplacés par `tier` dans `src/data/story_registry.ts` ;
  - doublons d'objets de chambre écartés (photo, réveil, tirelire, ordinateur) ;
  - conditions d'arrivée de tes 38 autres objets écrites dans `src/data/room_registry.ts`. Relis-les et propose des corrections par message si une condition trahit ton `how`.
- **Genre.** Le joueur peut être une fille ou non-binaire. Ta scène d'origine écrit « le jeune garçon », « il rouvrit les yeux, étourdi », et tes répliques écrivent « mon grand », « fiston ». J'ai gardé mon origine neutre et j'adapte quelques expressions, mais pas les accords. **Phase 1 ci-dessous.**

## Chemins réservés pour toi (et seulement ceux-là)

- `src/data/story/family.ts`, `src/data/story/lucien.ts` (correction de genre) ;
- `src/data/ascension_ext/` (nouveau) ;
- `src/data/secrets/` (nouveau) ;
- `src/data/school/` (nouveau) ;
- `tests/content_ext.test.ts` (nouveau) ;
- `docs/lore/SECRETS.md`, `docs/lore/HISTOIRE-ASCENSION.md`.

Interdit : `src/core`, `src/simulation`, `src/presentation`, les registres `src/data/*_registry.ts`, les sauvegardes. Pas de `Math.random` ni de `Date.now`. Pas de push sur `main`, pas de force-push.

## Phases (dans l'ordre ; un message court sur BOARD.md à la fin de chaque phase)

### Phase 1 : genre et cohérence
- **Textes neutres.** Rends neutres tous les textes adressés au joueur dans `story/family.ts` et `story/lucien.ts`. Utilise `{prenom}` (remplacé par le moteur) ou des tournures neutres (« mon enfant », « mon cœur », « la petite tête de la famille »). Aucun accord masculin ni féminin pour le joueur.
- **Origine.** Réécris `ORIGIN_SCENE` en version neutre, en gardant ta qualité d'écriture : je la reprendrai à la place de la mienne si elle est meilleure.
- **Déclencheurs.** Ils ne doivent utiliser que `tier`, `concepts`, `day` et les drapeaux existants (`laminoirChoix`, `voyagesFaits`, `fournisseurNeoBaie`, `circuitCourtPlateau`, `conservationSaphir`, `retoursEnArriere`, `plansFaits`, `busTrajets`, `jobShiftsDone`).
- **Test.** Ajoute à `tests/content_ext.test.ts` un test qui échoue si l'un de ces fichiers contient `garçon`, `petit-fils`, `fiston` ou `mon grand`.

### Phase 2 : trois nouveaux doubles faces (`src/data/ascension_ext/duels.ts`)

```ts
import type { DuelFace, StrategyEffects } from '../ascension/duels';
export interface DuelDraft { id: string; title: string; question: string; a: DuelFace; b: DuelFace; A: Partial<StrategyEffects>; B: Partial<StrategyEffects>; ownWay: string }
export const EXTRA_DUELS: readonly DuelDraft[];
```

- **Les trois doubles faces :**
  - **Weber ⟷ Graeber** : la bureaucratie qui rend fiable, contre les « boulots à la con » ;
  - **Schumpeter ⟷ Zuboff** : innover avec les données, contre le capitalisme de surveillance ;
  - **Polanyi ⟷ Hayek** : encastrer le marché dans la société, contre le marché autorégulé. Ajoute Polanyi comme penseur : nom, emblème, couleur.
- **Équilibre.** Les effets A et B doivent rester équilibrés : chacun gagne dans un contexte différent (voir docs/ASCENSION.md §6). Explique ce contexte en commentaire.
- **Concepts.** Pour chaque face, une phrase `right` et une phrase `wrong`, et un concept de carnet (existant, ou nouveau dans la phase 3).

### Phase 3 : idées et concepts du sommet (`src/data/ascension_ext/ideas.ts`, `concepts.ts`)

```ts
import type { IdeaDef } from '../ascension/ideas';            // sector, duel, eases, needs, minAge, flag…
import type { EconConcept } from '../ascension/concepts';
export const EXTRA_IDEAS: readonly IdeaDef[];
export const EXTRA_CONCEPTS: readonly EconConcept[];
```

- **Idées.** 15 idées pour les paliers 4 à 6, qui préparent l'horizon « conglomérat » : holding familiale, rachat d'un concurrent, chantier naval, banque d'affaires, média, université privée, fondation, lobbying, etc. Pour chacune :
  - un dilemme moral net ;
  - des chiffres cohérents avec les idées existantes du même palier (marché, marge, `startCost` ; ne fixe pas `fixed`, le moteur le recalcule) ;
  - des `duel` qui pointent vers un id existant ou l'un de tes trois nouveaux.
- **Concepts.** 12 nouveaux concepts : monopole, oligopole, concurrence déloyale, capture réglementaire, conglomérat et chaebol, aléa moral, asymétrie d'information, externalité, bien public, rente, effet d'éviction, dumping. Chacun avec `thinker`, `summary` sans jargon et `example` tiré de la vie du joueur.

### Phase 4 : secrets du monde (`src/data/secrets/secrets.ts` + `docs/lore/SECRETS.md`)

```ts
import type { PlaceId } from '../../core/types';
export interface SecretDef {
  id: string; title: string;
  where: { place?: PlaceId; street?: string; hint: string };     // street = nom exact d'une rue de src/data/city/layout.ts
  when?: { hour?: [number, number]; weekday?: number[]; weather?: 'pluie' | 'soleil' | 'nuages' };
  requires?: { tier?: number; concepts?: number; contact?: string; flag?: string };
  clue: string;                    // indice laissé dans un carnet, une dépêche ou une réplique
  reward: { kind: 'concept' | 'contact' | 'objet' | 'argent' | 'idee'; value: string | number };
  lore: string;                    // 3-5 phrases
}
export const SECRETS: readonly SecretDef[];
```

Au moins 15 secrets : la cave de la Malterie, le carnet d'un ouvrier de 1974, le fournisseur clandestin sous le pont, la fréquence de la radio pirate (108.4 FM), la tombe de Lucien, une salle murée de la Maison du Peuple… Les récompenses `objet` pointent vers tes ids de `room/items.ts` ; les `idee` vers des ids d'idées.

### Phase 5 : la vie au collège (`src/data/school/events.ts`)

```ts
export interface SchoolEvent {
  id: string; title: string; text: string;            // {prenom} autorisé ; jamais genré
  characters: string[];                                // ids de SCHOOL_CHARACTERS ou noah, lina, yasmine
  minAge?: number; tier?: number;
  options: { label: string; ghost: string; advice: string; outcome: string;
             effects: { relations?: Record<string, number>; average?: number; stress?: number; moral?: number; reputation?: number; pride?: number } }[]; // 2 ou 3 options
}
export const SCHOOL_EVENTS: readonly SchoolEvent[];
export const CLASS_MOMENTS_EXT: readonly { text: string; comprehension: number; mood: number }[];
```

- **Événements.** Au moins 25 événements de collège avec des arcs qui se suivent : rivalité, élection de délégué, voyage scolaire, harcèlement à défendre, premier amour (sobre), conseil de classe, brevet à 15 ans.
- **Moments de classe.** 30 moments de classe de plus.

### Phase 6 : pédagogie, quiz du carnet (`src/data/ascension_ext/quiz.ts`)

```ts
export interface ConceptQuiz { conceptId: string; questions: { q: string; choices: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explanation: string }[] }
export const QUIZZES: readonly ConceptQuiz[];
```

- **Quiz.** 3 questions par concept, pour les 20 existants et tes 12 nouveaux. Les questions partent de situations du jeu (« Ton étal jette 12 € de fraises le soir… »), jamais de définitions récitées.

### Fin : vérification et passation

- **Tests.** `tests/content_ext.test.ts` doit vérifier :
  - l'unicité des ids et les bornes des nombres ;
  - les références (penseurs, concepts, rues, ids d'objets, d'idées, de contacts) ;
  - la présence de 2 ou 3 options ;
  - l'absence de mots genrés.
- **Commandes, avec leur sortie réelle**, depuis `.ci/verif` :
  - `node node_modules/typescript/bin/tsc --noEmit` ;
  - `node node_modules/vitest/vitest.mjs run`.
- **Passation.** Sur BOARD.md, le message « Antigravity · AG-2 · `livré / chemins libérés` » avec les fichiers, le résumé, les preuves et les limites.
- **Suite côté Claude Code.** Je brancherai ensuite les doubles faces et les idées dans l'Ascension, les secrets dans la ville (point d'interaction et indices), les événements de collège dans la boucle famille, et les quiz dans le carnet.
