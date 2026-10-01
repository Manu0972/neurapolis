# Correctifs d'après-production — à appliquer APRÈS la fin du run principal

Fichier écrit par la session d'aide pendant que le run principal (M0→M7) travaille.
Ne PAS éditer `src/simulation/` tant que le run tourne (les bâtisseurs y écrivent).
Appliquer ces correctifs une fois le run principal terminé, puis relancer `npm run test` et `npm run build`.

## 1. Auto-sauvegarde en fin de journée (manquante — règle ajoutée au contrat après le passage du bâtisseur M0)

Le contrat (§3 M0) exige : auto-sauvegarde en fin de chaque journée de jeu, reprise au splash.
Personne dans le run actuel ne la branche. Approche recommandée (propre, testable en node sans localStorage) :

**a) Signal de fin de journée dans le moteur** — dans `src/simulation/engine.ts`, dans le bloc `if (day !== prevDay)`, après `districtDay(w)` :

```ts
// fin de journée : la présentation (seule propriétaire de localStorage) sauvegarde
bus.emit('dayEnded', undefined);
```

Il faut étendre `SimSignal` dans `src/core/eventBus.ts` : ajouter `dayEnded: void;` à l'interface `SimSignal`, et importer `bus` dans `engine.ts`.

**b) La présentation sauvegarde** — dans `src/presentation/app.ts` (ou le module HUD qui tourne) :

```ts
bus.on('dayEnded', () => {
  try { saveToSlot('auto', game.world); } catch (e) { /* localStorage indisponible : ignorer (tests, mode privé) */ }
});
```

**c) Reprise au splash** — bouton « Continuer » : `loadFromSlot('auto')` si le slot existe (`listSlots()`), sinon caché.

**d) Test** (dans `tests/saves.test.ts` ou un nouveau `tests/autosave.test.ts`) :
- `runTicks` sur 2 journées ⇒ `bus` a émis au moins 2 `dayEnded` (compter les émissions via un abonnement de test) ;
- aller-retour `exportSave`/`importSave` après une journée ⇒ état identique (déjà couvert, conserver).

## 2. Météo saisonnière (à vérifier — le bâtisseur M5 doit l'avoir faite ; si non, appliquer)

Le contrat (§3 M5) a figé : septembre 60/30/10, automne 30/40/30, hiver 20/30/50 ; effet sur la demande du stand soleil +20 %, nuages 0, pluie −40 %.
`src/simulation/district.ts` tire encore des probabilités plates. Si après le run la ligne est toujours :

```ts
d.meteo = rngChance(w, 0.45) ? 'soleil' : rngPick(w, ['nuages', 'pluie', 'nuages'] as const);
```

la remplacer par un tirage saisonnier déterministe :

```ts
const m = dateOf(day).m; // importer dateOf depuis src/core/clock
const p = m === 9 ? [60, 30, 10] : m >= 10 && m <= 11 ? [30, 40, 30] : [20, 30, 50];
const r = rngNext(w) * 100; // PRNG du monde, jamais Math.random
d.meteo = r < p[0] ? 'soleil' : r < p[0] + p[1] ? 'nuages' : 'pluie';
```

**Test** : avec une seed figée, la météo du même jour est identique après rechargement ; sur 1000 jours simulés, septembre ne sort jamais hors des 3 valeurs et la proportion de « pluie » reste entre 5 % et 20 % (garde-fou large, pas un test statistique fragile).

## 3. Points à contrôler après le run (checklist, sans modification de code)

- [ ] `npm run test` ET `npm run build` verts (à exécuter réellement).
- [ ] Le run final du E2E navigateur selon `docs/E2E-PROTOCOL.md` (chemin nominal + variantes « repousser », pluie, nuit, stock zéro).
- [ ] La sauvegarde contient l'état du Conseil complet (fantômes, loyautés, fusions, antagonismes) après une fusion — recharger et comparer.
- [ ] `registry.ts` intègre bien les 22 fantômes (plus `marche_des_communs`) et les ids `GEN1_RESTANTS`/`GEN2_IDS` sont vidés.
- [ ] Les scènes de `docs/SCENES-DRAFT.md` sont portées en données (ou au minimum les 5 arrivées + la fusion jouables).
- [ ] Juge visuel sur les captures des écrans clés (splash, Conseil, projet) avant livraison.
- [ ] Équilibrage : le chemin rapide (Smith → 1re vente → 1re répartition) reste ≈ 30 min de jeu simulé.

## Statut vérifié au moment de l'écriture (lecture seule)

- Tests : 60 verts (6 fichiers) au milieu du jalon M3.
- `saveToSlot` : défini dans `src/saves/persist.ts`, aucun appel dans `engine.ts`.
- Météo : tirage plat dans `district.ts`, correctif ci-dessus prêt.
- Fiches de fantômes : 22 + composite, ids uniques, déclencheurs conformes au §6.
