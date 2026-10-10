# NEURAPOLIS — Protocole E2E navigateur (session principale)

> **Rédigé le 2026-09-29 par le rôle QA. NON EXÉCUTÉ au moment de la rédaction** (le rôle QA n'a pas d'outillage navigateur ; cf. `.agents/skills/neurapolis-qa/SKILL.md` §3 : l'exécution se fait en session principale, et un résultat n'est consigné que si l'exécution a réellement eu lieu).
> Toute case de la grille finale (§9) non exécutée se note **« non couvert »**, jamais « vert ».

## 0. Sources de vérité

- `neurapolis/docs/PRODUCTION-PLAN.md` §3 (jalons M0→M7), §5 (besoins), §6 (déclencheurs d'apparition).
- `neurapolis/src/core/types.ts` (schéma `WorldState`, `GhostState`, `GameEvent.causes`, `ProjectState`).
- `.agents/skills/neurapolis-qa/SKILL.md` §3 (chemin nominal), §4 (invariants), §5 (cas limites).

## 1. État du code au moment de la rédaction (2026-09-29) — à lire avant d'exécuter

| Élément du chemin nominal | Jalon | État au 2026-09-29 |
|---|---|---|
| Splash, carte, HUD, dialogues à choix | M2 | Absent. `src/main.ts:9-12` n'affiche que le label d'horloge (« amorce minimale du socle (jalon M0) »). |
| Écrans personnage / relations / journal, bouton « pourquoi ? » | M3 | Absent. `src/data/notions.ts` et `src/data/actions.ts` n'existent pas. |
| Écran Conseil, scènes d'arrivée, loyauté | M4 | Moteur stub : `src/simulation/council.ts:9-19` (`councilTick` renvoie `[]`). |
| Stand, répartition, comptes | M5 | Absent. `src/simulation/project.ts` n'existe pas. |
| Fusion Smith+Ostrom | M6 | Seule la définition est en données : `src/data/ghosts/registry.ts:260-268`. |
| Contrat de Sécurité (Hobbes) | M6 | Champs d'état présents : `types.ts:171`, `types.ts:218`, init `store.ts:72-73`. Aucune implémentation de proposition/effets dans `src/` au 2026-09-29 (grep `contratSecurite` : types.ts et store.ts uniquement). |
| Auto-sauvegarde en fin de journée | M0 | **Non branchée** : `src/simulation/engine.ts` n'importe pas `saveToSlot` (fichier lu intégralement le 2026-09-29 ; `src/saves/persist.ts:18-30` prévoit l'API, aucun appel). |
| Gates test/build | M0/M7 | `neurapolis/tests/` contient 2 fichiers (`clock.test.ts`, `rng.test.ts`). **Non exécutés par le rédacteur** — à exécuter en §2. |

**Conséquence** : chaque étape ci-dessous est balisée par son jalon. Une étape dont l'écran n'existe pas encore = **« BLOQUÉ (jalon non livré) »**, à consigner tel quel dans la grille — jamais un échec du protocole lui-même.

## 2. Préparation (commandes exactes)

Depuis la racine du dépôt (`C:\Users\laqui\Documents\glm`). **Note Windows** : `npm` est un shim `.cmd` ; on passe toujours par `node` + `npm-cli.js` (chemin vérifié présent sur cette machine le 2026-09-29 ; s'il diffère, `where npm` pour le retrouver).

1. **Installation** (si `node_modules` absent) :
   ```
   node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" --prefix neurapolis install
   ```
   (Dépendances attendues : `typescript`, `vite`, `vitest` — `neurapolis/package.json:13-17`.)
2. **Gates, dans cet ordre** (test PUIS build — règle SKILL.md §2) :
   ```
   node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" --prefix neurapolis run test
   node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" --prefix neurapolis run build
   ```
   Gate vert ⇔ code de sortie 0 ET sortie le confirmant. Coller la dernière ligne significative de chaque sortie dans le compte-rendu (ex. `Test Files  2 passed (2)` / `✓ built in …`). Si une sortie est rouge, la coller **in extenso** dans la grille.
3. **Serveur de dev** (session principale, outillage navigateur) :
   ```
   node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" --prefix neurapolis run dev
   ```
   → Vite sur **http://localhost:5173** (`neurapolis/vite.config.ts:5` : `port: 5173, host: true`).
4. **État propre** avant de commencer : DevTools → Console → `localStorage.clear()` puis rechargement dur (Ctrl+Shift+R). Le préfixe des sauvegardes est `neurapolis.save.` (`src/saves/persist.ts:8`).
5. **Lecture de l'état en cours de partie** : l'app n'expose pas encore l'état sur `window` (`src/main.ts:8-12`). La vérification des valeurs se fait via `localStorage.getItem('neurapolis.save.auto')` (sauvegarde auto) ou un hook de debug s'il en existe un à la date d'exécution. À défaut de hook : comparer via la sauvegarde (§7). Consigner dans le rapport si la lecture directe de l'état est impossible.

## 3. Chemin nominal — étapes numérotées

Valeurs de départ (contrat, `src/core/store.ts:39-85`) : seed `20200901`, tick `43` = **mardi 1er septembre 2020, 07:10** (jour 0, école : oui) ; `money` **15 €**, `reputation` **45** ; besoins **fatigue 20 / faim 30 / stress 25 / moral 65** ; position **(23, 17)** ; relations Noah `{amitie 78, confiance 65, respect 48, rivalite 18}` ; tous les fantômes `status: 'inconnu'`, `loyalty: 50`, `fiabilite: 60` ; `district = {vitaliteEpicerie: 45, confianceQuartier: 50, frequentationParc: 55, meteo: 'soleil'}`.

| N° | Étape (jalon) | Critère observable et valeur attendue |
|---|---|---|
| 0 | **Nouvelle partie** (M2) | Splash affiché. Après « Nouvelle partie » : monde créé avec seed 20200901 ; HUD affiche **« mardi 1 septembre 2020 »** et **« 07:10 »**. |
| 1 | **Carte + HUD** (M2) | Carte 48×32 tuiles de 32 px → canvas **1536 × 1024 px** (plan M2:26). HUD : horloge **07:10**, date **mardi 1 septembre 2020**, 4 besoins = **20 / 30 / 25 / 65**. Pastilles de **8 PNJ** visibles (plan M2:30 ; `src/data/npcs.ts:8` définit 8 entrées). |
| 2 | **Déplacement** (M2) | Touche ZQSD/WASD/flèche : `player.pos` change d'**exactement 1 tuile** par impulsion ; contre un mur, `pos` inchangé (collision). Chaque tick = **10 minutes** d'horloge (`types.ts:19`). |
| 3 | **Dialogue à choix avec Noah** (M2) | E près de Noah → dialogue s'ouvre avec **≥ 2 répliques au choix** (topics `accueil` : 2 répliques, `src/data/npcs.ts:20-21`). Choisir une réplique la fait afficher, puis le dialogue se ferme. Fatigue de départ 20 < 70 → **aucun malus d'amitié** attendu (plan §5:77). |
| 4 | **Première vente** (M5) | Action de vente/échange exécutée → `flags.echanges` passe de **0 à 1** (déclencheur Smith : `registry.ts:55`). Un événement « vie »/« opportunite » est journalisé avec **`causes.length ≥ 1`**. *(Note : l'action qui incrémente `echanges` est livrée en M5 ; si aucune action de vente n'est accessible avant le stand, exécuter d'abord l'étape 9 puis revenir ici — la condition ne lit que `flags.echanges ≥ 1`.)* |
| 5 | **Apparition de Smith** (M4) | Au tick suivant `echanges ≥ 1` : **scène d'arrivée de 4 à 6 répliques** (plan M4:45), scène `arrivee_smith` (`registry.ts:56`), puis le choix « l'écouter » / « le repousser ». Après **« l'écouter »** : `council.ghosts.smith.status = 'actif'` (`types.ts:98`), **loyalty 50**, **fiabilite 60**. L'événement d'arrivée porte des causes nommant le facteur `echanges` avec seuil **« 1 »** (ou « ≥ 1 »), poids ∈ {1,2,3} (`types.ts:187`). |
| 6 | **Écran Conseil** (M4) | Ouvert : la **colonne des voix** montre Smith **actif** (couleur `#ffc94a`, emoji 📊 — `registry.ts:14-15`) et les autres fantômes **en silhouette** (tous `'inconnu'` au départ — `store.ts:34`). La **fiche** du sélectionné affiche « Adam Smith », « 1723-1790 · École classique écossaise » et son portrait. L'**historique des conseils** contient au moins 1 enregistrement avec `veracite ∈ {vraie, exageree, mensonge}` et le drapeau `followed` (`types.ts:104-111`). Quand un fantôme parle dans le monde : **bandeau teinté** visible (plan M4:50). |
| 7 | **Bouton « pourquoi ? »** (M3) | Sur l'événement d'arrivée (ou de vente) : le **journal des causes** s'ouvre et montre pour l'événement **au moins 1 `CauseFactor`** `{facteur, seuil?, poids}` ; facteur mentionnant le déclencheur, **poids ∈ {1, 2, 3}**. L'événement porte un id `e1`-style issu de `pushEvent` (`src/simulation/events.ts:20`), le plus récent en tête (`events.unshift`, `events.ts:28`). |
| 8 | **Apprentissage : négociation** (M3) | 4 étapes : découverte (événement vécu) → explication (cours/livre/fantôme) → **3 applications réussies** → maîtrise. Attendu : `player.skills.negociation.level ≥ 1` et `xp > 0` sur l'écran personnage ; la notion passe au **stage 4** avec `applications ≥ 3` ; le gate **« proposer un partage » est débloqué** (plan M3:36). *(Note : le mapping notion → caractéristique bonus est figé par `src/data/notions.ts`, absent au 2026-09-29 — relever à l'exécution quelle caractéristique augmente et de combien.)* |
| 9 | **Lancer le stand** (M5) | Écran projet : achat du stock → `player.money` baisse d'**exactement 15 €** (plan M5:54) ; prix fixé dans **[0,5 ; 2]** €. Attendu : `project.id = 'stand_des_roses'`, `active = true`, `stock > 0`, `price ∈ [0.5, 2]` (`types.ts:165-176`). L'écran projet affiche **stock et prix**. Rappel : +5 € d'argent de poche une fois par semaine, jamais plus (`engine.ts:42-45`) — si l'achat a lieu après le jour 7, `money` partait de 20 et tombe à **5**. |
| 10 | **Stand collectif → Ostrom apparaît** (M4) | Monter `communication` au niveau ≥ 2 (gate « convaincre un PNJ de rejoindre le projet », plan M3:36), recruter **Noah et Lina** (`project.members.length = 2`, plan M5:54), puis adopter des **règles collectives écrites ensemble** (`project.rules.collectif = true`, `types.ts:171`). Déclencheur : `project.members.length ≥ 2` ET `project.rules.collectif` (`registry.ts:147`). Attendu : scène d'arrivée de 4 à 6 répliques (plan M4:45), scène `arrivee_ostrom` (`registry.ts:148`), puis le choix « l'écouter » / « le repousser ». Après **« l'écouter »** : `council.ghosts.ostrom.status = 'actif'` (`types.ts:98`), **loyalty 50**, **fiabilite 60**. L'événement d'arrivée porte des causes nommant `project.members` (seuil « ≥ 2 », poids 2) et `project.rules.collectif` (seuil « vrai », poids 2). |
| 11 | **Répartition des gains** (M5) | Fin de semaine : choisir un mode (égalité / équité / incitation). Attendu : `project.lastRepartition = <mode choisi>` ; **invariant Σ(entrées − sorties du ledger) = solde** vérifié sur l'écran des comptes (`types.ts:161` : entrée = amount > 0, sortie = amount < 0) ; **au moins un compteur** de `council.decisions.{marche, communs, solidarite}` incrémenté ; les relations 4D de Noah/Lina diffèrent du relevé d'avant répartition (`types.ts:213-215`). *(Le mapping exact mode → compteurs/relations n'est pas figé dans le plan — relever les deltas réels à l'exécution, les consigner, et signaler tout effet nul comme anomalie.)* |
| 12 | **Marx apparaît** (M4) | Provoquer un **conflit de répartition** (mode « incitation », ou répéter les répartitions) jusqu'à `flags.conflitsRepartition ≥ 1` (déclencheur : `registry.ts:101`). Attendu : scène `arrivee_marx` (`registry.ts:102`) ; après « l'écouter » : `council.ghosts.marx.status = 'actif'`, loyalty 50. **Variante exigée ici au moins une fois** (SKILL.md §3) : choisir « le repousser » sur une arrivée → `status = 'refuse'`, aucune voix active ajoutée, loyalty reste 50 (détails §4). |
| 13 | **Hobbes apparaît** (M4) | Provoquer un **incident de discipline** au stand (bagarre ou vol — ex. laisser la rivalité d'un coéquipier s'envenimer jusqu'à la dispute, ou l'action « incident » livrée avec le projet M5/M6) jusqu'à `flags.incidents ≥ 1` (déclencheur : `registry.ts:193`). Attendu : scène d'arrivée de 4 à 6 répliques (plan M4:45), scène `arrivee_hobbes` (`registry.ts:194`), puis le choix « l'écouter » / « le repousser ». Après **« l'écouter »** : `council.ghosts.hobbes.status = 'actif'`, **loyalty 50**, **fiabilite 60**. L'événement d'arrivée porte des causes nommant le facteur `incidents` avec seuil **« 1 »** (ou « ≥ 1 »), poids ∈ {1,2,3} (`types.ts:187`). |
| 14 | **Taylor apparaît** (M4) | Exécuter une **optimisation du rendement** (réorganiser l'étal, chronométrer un trajet — action livrée avec le projet M5/M6) jusqu'à `flags.optimisations ≥ 1` (déclencheur : `registry.ts:239`). Attendu : scène d'arrivée de 4 à 6 répliques, scène `arrivee_taylor` (`registry.ts:240`), puis le choix « l'écouter » / « le repousser ». **Plafond de 4 voix actives** (plan M4:46) : si les étapes 5, 10, 12 et 13 ont toutes été « écoutées », les quatre places sont prises — **endormir d'abord une voix** manuellement (ex. hobbes → `status = 'endormi'`, loyauté −1/jour, plan M4:46) ; si une voix a été repoussée à l'étape 12 (variante §4), une place est libre et l'endormissement n'est pas nécessaire. Puis « l'écouter » : `council.ghosts.taylor.status = 'actif'`, **loyalty 50**, **fiabilite 60**. L'événement d'arrivée porte des causes nommant le facteur `optimisations` avec seuil **« 1 »** (ou « ≥ 1 »), poids ∈ {1,2,3}. |
| 15 | **Contrat de Sécurité (Hobbes)** (M6) | Après un incident (`flags.incidents ≥ 1`, rempli à l'étape 13), Hobbes — actif — **propose le Contrat de Sécurité** (plan M6:66). **Accepter** : `council.contratSecurite = { active: true, sinceDay: <jour courant> }` (`types.ts:218`) et `project.rules.contratSecurite = true` (`types.ts:171`). Observer les **deux effets chiffrés** du contrat (plan M6:66) : **rendement +20 %** (comparer une session de vente à prix, météo et jour identiques avant/après l'acceptation — attendu ×1,2) et **amitié du groupe −2/semaine** (après une semaine : `player.relations.noah.amitie` et `player.relations.lina.amitie` chacune −2). La **sortie** du contrat se teste en variante (§4), pas ici. |
| 16 | **Fusion Smith + Ostrom** (M6) | Préalables : Ostrom actif (vérifié à l'étape 10), puis accumuler **`decisions.marche ≥ 3` ET `decisions.communs ≥ 3`** (`registry.ts:264`) avec les deux voix actives et **affinité Smith–Ostrom ≥ 6** (plan M6:65). Attendu : scène `fusion_marche_des_communs` ; `smith.status = 'fusionne'` et `ostrom.status = 'fusionne'` (`types.ts:102`) ; `council.fusionsDone` contient **`'marche_des_communs'`** (`types.ts:217`) ; la voix composite apparaît dans la colonne (voix alternées) et le déblocage « coopérative pérenne — ventes du week-end sans présence » est annoncé (`registry.ts:266`). |
| 17 | **Auto-sauvegarde** (M0) | Laisser se produire une bascule de jour (144 ticks). Attendu : localStorage possède la clé **`neurapolis.save.auto`** ; son JSON parse en `WorldState` avec `version = 1` et `dayIndexOf(time.tick)` = **le jour qui vient de s'achever**. *(Rappel §1 : l'appel n'est pas branché dans `engine.ts` au 2026-09-29 — si la clé est absente, c'est « BLOQUÉ (branchement M0 manquant) ».)* |
| 18 | **Rechargement + « Continuer »** (M0) | Recharger la page → splash propose « Continuer » → il charge le slot auto. Attendu : état **profondément égal** au relevé d'avant rechargement, sur les champs listés en §7. Toute différence de valeur = ÉCHEC, avec le champ fautif nommé. |

## 4. Variantes à exercer

| Variante | Procédure | Valeur attendue |
|---|---|---|
| **Le repousser** (`refuse`) | À une scène d'arrivée (min. une fois, conseillé sur Marx en étape 12), choisir « le repousser ». | `ghosts[id].status = 'refuse'` (`types.ts:97`) ; pas de voix active ajoutée ; loyalty inchangée à **50**. Plus tard, l'apparition revient **à condition majorée** (plan M4:45) — relever le nouveau seuil affiché dans les causes et vérifier qu'il est strictement supérieur au seuil d'origine (ex. `echanges ≥ 1` → seuil majoré). |
| **Un fantôme endormi** | Activer un fantôme puis l'endormir manuellement. | `status = 'endormi'` ; **loyauté −1 par jour** (plan M4:46) : 50 → **49** après une journée ; aucun nouveau conseil dans `history` pendant le sommeil. Avec **4 voix actives**, tenter d'activer une 5e : refusé (plafond, plan M4:46 et `docs/suivi/DECISIONS.md:9`). |
| **Pluie (météo)** | Attendre un jour où `district.meteo = 'pluie'` (tirage chaque matin via `w.rng`, `src/simulation/district.ts:18`), puis vendre à prix identique un même jour de semaine. | Demande du stand **−40 %** vs nuages ; soleil **+20 %** (plan M5:59). Attendu sur une session de 1 h : unités vendues ≈ **0,6×** le nombre vendu sous nuages à prix égal. *(Note : au 2026-09-29 le tirage est plat 45/36/18 (`district.ts:18`) au lieu du saisonnier 60/30/10 de fin d'été (plan M5:59) — consigner lequel est en vigueur.)* |
| **Nuit** | Laisser l'horloge atteindre 22:00 (ou avancer). | À 22:00, `player.asleep = true` forcé (`engine.ts:27`) : déplacement et interactions bloqués, HUD en phase nuit. À 07:00 le lendemain : `asleep = false`. Si fatigue > 85 : **microsommeil forcé** (plan §5:77). |
| **Stock à zéro** | Vendre jusqu'à `project.stock = 0`, puis retenter une vente. | Vente refusée avec message ; **stock jamais < 0** (`types.ts:168`) ; aucun mouvement ajouté au ledger par la tentative (l'invariant Σ entrées − sorties = solde tient, `types.ts:161`) ; `reputation` inchangée par la tentative ratée. |
| **Quartier réactif (M5)** | `district.vitaliteEpicerie` part de **45** (`store.ts:75`). Laisser filer les jours (drive **−0,2/jour**, plan M5:57) sans rendre de course jusqu'à **< 35** : événement « Mme Bertin envisage de fermer ». Rendre ensuite des courses (**+1** chacune, plan M5:57) jusqu'à **> 60** : embauche + `confianceQuartier` en hausse. Monter `player.reputation` à **≥ 70** (vente +2, course +1, arbitrage +3 — plan M5:58) : **Samir propose un stage** (teaser). | Seuils **35/60** (plan M5:61) : < 35 → événement type `quartier` avec `causes.length ≥ 1` ; > 60 → embauche + confiance quartier en hausse ; réputation ≥ 70 → teaser du stage Samir affiché. *(Note : de 45, le drive seul met ≈ 55 jours pour passer sous 35 — vitesse maximale autorisée, durée réelle à consigner ; tout levier de debug utilisé doit être noté.)* |
| **Sortie du Contrat de Sécurité** (M6) | Contrat actif (étape 15). Tenter la sortie dans les deux branches (plan M6:66) : (a) **vote unanime ET amitié ≥ 60** → sortie autorisée ; (b) amitié < 60 → sortie refusée. | (a) `council.contratSecurite = null` et `project.rules.contratSecurite = false` ; (b) contrat toujours `active`, message de refus affiché, aucune valeur modifiée. *(Test plan M6:68 « sortie du contrat ».)* |
| **Sabotage de Taylor** (M6) | Amener `council.ghosts.taylor.loyalty` **< 20** (conseil ignoré −3, décision contraire à sa doctrine −10 — plan M4:47) → `status = 'hostile'` (`types.ts:100`). Laisser le sabotage agir (plan M6:67). | `status = 'hostile'` ; **rendement −15 %** sur une session comparable (prix/météo/jour identiques — attendu ×0,85) ; **stress des PNJ en hausse** (chronométrage, `registry.ts:234` : relever `npcs.noah.stress` / `npcs.lina.stress` avant/après). *(Test plan M6:68 « sabotage ».)* |

Cas limites complémentaires du contrat à couvrir en session si le temps le permet (SKILL.md §5) : loyauté 0 pendant 3 jours → adieu + statut `mort` définitif ; hostile (< 20) ; mensonge révélé 3-7 jours plus tard → `fiabilite` **−20 permanent** ; rivalité > 60 → départ d'un membre du stand ; joueur affamé (faim > 70) → XP d'apprentissage −50 %.

## 5. Écrans UI à exercer par jalon (minimum exigé : 1 par jalon — SKILL.md §3)

| Jalon | Écran(s) | Ce qu'on doit y voir (critères) |
|---|---|---|
| M2 | Carte (Canvas 48×32, tuiles colorées par type, PNJ en pastilles de leur couleur `src/data/npcs.ts`) ; HUD (horloge, date, 4 besoins) ; dialogue à choix multiples (≥ 2 options sur Noah/Lina/Mme Bertin) | Carte 1536×1024 px ; HUD cohérent avec l'état (07:10 / mardi 1 septembre 2020 / 20-30-25-65 au départ) ; ≥ 3 PNJ ouvrent un dialogue à choix (`topics` : `npcs.ts:19-25`, `37-43`, `114-119`). |
| M3 | Personnage (6 caractéristiques, 6 compétences niveau+XP) ; relations (4D par PNJ) ; journal (vie + causes, bouton « pourquoi ? ») | Caractéristiques = 42/65/35/48/58/44 au départ (`store.ts:47`) ; relations Noah = 78/65/48/18 (`store.ts:54`) ; chaque événement journalisé a `causes.length ≥ 1` avec poids 1-3. |
| M4 | Conseil : colonne des voix (actives/endormies/hostiles/mortes + silhouettes des inconnues), fiche du fantôme sélectionné, historique des conseils, bandeau teinté in-world | Voir étapes 5-7 : Smith actif (couleur #ffc94a), fiche avec nom/époque/portrait, ≥ 1 conseil dans l'historique avec `veracite`, bandeau visible quand un fantôme parle. |
| M5 | Projet : stock, prix, équipe, comptes (livre + solde), répartition (3 modes) | `stand_des_roses` avec stock/prix affichés ; Σ entrées − sorties = solde ; choix égalité/équité/incitation → `lastRepartition` mémorisé. |

## 6. Écrans et jalons non encore livrés (contrôle de présence, pas de « ça marche »)

Chaque écran ci-dessus est balisé par son jalon dans le plan : M2 carte/HUD/dialogue (`PRODUCTION-PLAN.md:25-32`), M3 personnage/relations/journal (`PRODUCTION-PLAN.md:34-40`), M4 Conseil (`PRODUCTION-PLAN.md:42-51`), M5 projet (`PRODUCTION-PLAN.md:53-61`). À l'exécution, un écran attendu absent = « BLOQUÉ (jalon non livré) » dans la grille — pas un échec silencieux.

## 7. Procédure de vérification de la sauvegarde (aller-retour)

1. **Avant rechargement** : capture de l'état — `localStorage.getItem('neurapolis.save.auto')` (ou export) → le coller / le stocker comme référence `avant.json`.
2. Recharger la page, « Continuer ».
3. **Après chargement, sans aucune action et sans laisser filer de tick** (pause si possible), recapturer l'état → `apres.json`.
4. Comparer **en égalité profonde** les champs suivants, tous et chacun :
   - `version`, `seed`, `rng` (l'état du PRNG fait partie de l'état — `types.ts:226`) ;
   - `time.tick` ;
   - `player` : `money`, `reputation`, `needs` (4 valeurs), `skills` (6 × {level, xp}), `notions`, `relations.noah` (4 valeurs), `pos`, `asleep` ;
   - `council` : pour chaque id de fantôme : `status`, `loyalty`, `fiabilite`, `loyaltyZeroDays` ; `decisions` (marche/communs/autorite/solidarite), `fusionProgress`, `fusionsDone`, `allianceDesOmbres` ;
   - `project` : `active`, `stock`, `price`, `members`, `rules`, `sessionsDone`, `coursesDone`, `ledger` (longueur + Σ des amounts), `lastRepartition` ;
   - `district` : `vitaliteEpicerie`, `confianceQuartier`, `frequentationParc`, `meteo` ;
   - `events` : longueur + id du dernier événement ; `lifeJournal` : longueur ;
   - `flags` (dont `echanges`, `conflitsRepartition`) et `seen`.
5. Résultat : égalité stricte = OK ; toute différence = ÉCHEC (nommer le champ, coller avant/après). La règle « sauvegarde aller-retour identique » est un invariant (SKILL.md §4), y compris **après fusion et antagonisme** : la vérification doit aussi être refaite une fois Smith+Ostrom fusionnés (après l'étape 16).

## 8. Grille de compte-rendu finale

À remplir uniquement avec des valeurs réellement observées ; coller les sorties de commandes en annexe.

| N° | Étape | Exécutée ? | Valeur attendue | Valeur observée | Statut (OK / ÉCHEC / BLOQUÉ / non couvert) | Capture |
|---|---|---|---|---|---|---|
| 0 | Nouvelle partie | | Splash → HUD « mardi 1 septembre 2020 » · « 07:10 » | | | splash.png |
| 1 | Carte + HUD | | 1536×1024 px ; besoins 20/30/25/65 ; 8 PNJ | | | carte-hud.png |
| 2 | Déplacement | | pos ± 1 tuile ; bloqué aux murs | | | deplacement.png |
| 3 | Dialogue Noah | | ≥ 2 choix ; réplique sélectionnée affichée | | | dialogue-noah.png |
| 4 | Première vente | | `flags.echanges` 0 → 1 ; événement avec causes ≥ 1 | | | vente.png |
| 5 | Arrivée Smith | | scène 4-6 répliques ; après « l'écouter » : status actif, loyalty 50, fiabilite 60 | | | arrivee-smith.png |
| 6 | Écran Conseil | | Smith actif (#ffc94a), silhouettes, fiche, historique ≥ 1 conseil, bandeau teinté | | | conseil.png |
| 7 | « pourquoi ? » | | ≥ 1 CauseFactor {facteur, seuil « 1 », poids 1-3} | | | causes.png |
| 8 | Apprentissage négociation | | negociation level ≥ 1, xp > 0 ; notion stage 4, applications ≥ 3 | | | personnage.png |
| 9 | Stand | | money −15 € ; stock > 0 ; prix ∈ [0,5 ; 2] | | | projet.png |
| 10 | Stand collectif → Ostrom | | members ≥ 2 + rules.collectif ; scène arrivee_ostrom ; « l'écouter » → ostrom actif, loyalty 50 | | | arrivee-ostrom.png |
| 11 | Répartition | | lastRepartition = mode ; Σ ledger = solde ; ≥ 1 compteur decisions incrémenté | | | repartition.png |
| 12 | Marx (dont « le repousser » au moins une fois) | | conflitsRepartition ≥ 1 ; actif OU refuse selon le choix | | | arrivee-marx.png / refuse.png |
| 13 | Hobbes (incidents ≥ 1) | | scène arrivee_hobbes ; « l'écouter » → hobbes actif, loyalty 50 ; causes nommant incidents | | | arrivee-hobbes.png |
| 14 | Taylor (optimisations ≥ 1) | | scène arrivee_taylor ; voix endormie pour libérer une place (plafond 4) ; taylor actif, loyalty 50 | | | arrivee-taylor.png |
| 15 | Contrat de Sécurité | | contratSecurite actif (sinceDay) ; rendement +20 % ; amitié −2/semaine | | | contrat.png |
| 16 | Fusion Smith+Ostrom | | smith+ostrom `fusionne` ; fusionsDone contient `marche_des_communs` | | | fusion.png |
| 17 | Auto-sauvegarde | | clé `neurapolis.save.auto` ; version 1 ; jour = jour écoulé | | | localstorage.png |
| 18 | Rechargement | | état profondément égal sur tous les champs du §7 | | | apres-rechargement.png |

**Variantes** : le repousser / fantôme endormi / pluie / nuit / stock à zéro / quartier réactif / sortie du contrat / sabotage taylor — une ligne chacune, même format, avec la valeur attendue du tableau §4.

**Captures obligatoires** (hors grille) : sorties brutes des deux gates (§2, commandes exactes + dernière ligne) ; `avant.json` et `apres.json` (§7).

## 9. Règles de rapport

- Statut « OK » uniquement si la valeur observée est collée et conforme ; sinon ÉCHEC avec les deux valeurs.
- Étape non tentée = « non couvert » ; écran absent car jalon non livré = « BLOQUÉ (jalon non livré) ».
- Aucun euphémisme : un gate rouge est collé tel quel et remonté aux rôles concernés (`neurapolis-architecte`, `neurapolis-systemiste`), jamais contourné (SKILL.md §7).
