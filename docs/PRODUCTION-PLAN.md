# NEURAPOLIS — Contrat de production (prototype vertical)

Document vivant, lu par tous les bâtisseurs. Il fait foi : en cas de doute, ce document gagne.

## 1. Vision (une phrase)
Un joueur de 12 ans (septembre 2020, quartier Cité des Roses, Val-Ferrand) vit, apprend, entreprend — et son esprit est peu à peu **habité par des fantômes intellectuels** qui n'apparaissent que lorsque sa vie les fait naître.

## 2. Stack & conventions
- **Vite + TypeScript strict + Canvas 2D + Vitest. Zéro dépendance runtime.** Pas de framework UI (DOM + Canvas).
- Architecture en couches STRICTES : `core` ← `simulation` ← `presentation`. La présentation **lit** l'état, la simulation ne connaît jamais le DOM. Les données (fantômes, PNJ, bâtiments, actions, notions, événements) vivent dans `src/data/`, interprétées par le moteur — jamais codées en dur dans la logique.
- État du monde : un seul objet `WorldState` (`src/core/types.ts` est le contrat). PRNG déterministe mulberry32, état dans `w.rng` — **jamais** `Math.random`, jamais `Date.now` dans la simulation.
- Identifiants stables (`smith`, `noah`, `stand_des_roses`…) : une fois publiés, on ne les renomme plus.
- UI en français ; commentaires rares et utiles ; TS strict sans `any`.
- Chaque valeur simulée a des **conséquences mécaniques** (règle « aucune statistique sans conséquence »).
- Événements (`GameEvent.type`, cf. `src/core/types.ts`) : cinq catégories de base — **vie / opportunité / conflit / découverte / conséquence** — plus conseil / fusion / antagonisme / quartier / système. Tout événement porte des causes (`CauseFactor` : facteur, seuil, poids) : le journal des causes est une règle, pas une option.

## 3. Jalons (critères de sortie : `npm run test` vert, sauf M7 : + `npm run build`)

### M0 — Socle (finir)
Corriger toutes les erreurs TS du socle existant, puis écrire les tests dans `neurapolis/tests/` :
déterminisme RNG ; horloge (3 journées + vacances Toussaint + mercredi après-midi libre) ;
besoins (les 3 conséquences de chacun, cf. §5) ; engine (avancer 3 journées complètes) ;
sauvegarde aller-retour + migration v0→v1 (`src/saves/`). **Cadence figée** : auto-sauvegarde en fin de chaque journée de jeu — appel `saveToSlot` branché dans `engine.ts` par l'Architecte (`src/saves/persist.ts` le prévoit déjà, aucun appel n'existe encore) ; reprise au splash (« Continuer » charge le slot auto).

### M2 — Quartier jouable
Carte tuilée 48×32 (tuile 32 px, data dans `src/data/map.ts` : murs, sols, entrées) ; renderer Canvas
(couleurs par type de tuile, PNJ = pastilles de leur couleur) ; input clavier ZQSD/WASD/flèches,
E = interagir, tactile (joystick virtuel + bouton d'action) ; collisions murs/hors-carte ;
intérieurs simplifiés (maison, collège, épicerie) ; HUD : horloge + date + 4 besoins ;
8 PNJ avec leurs routines (déjà définies) affichés en temps réel ; **dialogues à choix multiples**
(≥3 PNJ : Noah, Lina, Mme Bertin — les `topics` existent dans `src/data/npcs.ts`).
Tests : routines horaires respectées (matin 8h = collège), collisions, journée complète simulée.

### M3 — Vie & progression
- Caractéristiques (6, valeurs initiales figées) : progression par maîtrise de notions.
- **Compétences + gates** (`src/data/actions.ts`) : négociation ≥1 → « proposer un partage », ≥2 → « arbitrer un conflit » ; comptabilité ≥1 → livre de comptes détaillé, ≥2 → prévision de demande ; communication ≥2 → convaincre un PNJ de rejoindre le projet ; organisation ≥1 → 2 activités simultanées ; technique ≥1 → réparer/deviser ; recherche ≥2 → autodidacte. Niveau 0-3, XP par pratique.
- **Apprentissage 4 étapes** par notion (`src/data/notions.ts` : intérêts divergents ; égalité vs équité vs incitation ; coût d'opportunité ; prix et rareté ; confiance et incitations) : découverte (événement vécu) → explication (cours / livre / fantôme, au choix) → application (3 réussies) → maîtrise (+caractéristique associée).
- **Relations 4D** (amitié/confiance/respect/rivalité) — jamais une jauge unique.
- Argent de poche +5 €/semaine (fait) ; journal de vie + **journal des causes** (bouton « pourquoi ? » : facteurs/seuils/poids de chaque événement).
- UI : écrans personnage, relations, journal.

### M4 — Le Conseil (cœur du jeu)
- **Fiches G2 restantes** : le `neurapolis-ghostwriter` crée `gen2-a.ts` (ohno, dejours, graeber, zuboff) **avant M4** — le contrat l'exige, personne d'autre ne le produit. Intégrer ensuite les fiches `gen1-b.ts`, `gen1-c.ts`, `gen2-a.ts`, `gen2-b.ts` dans `registry.ts` (import alias, concat dans `GHOST_DEFS`, vider `GEN1_RESTANTS`/`GEN2_IDS`).
- Moteur `src/simulation/council.ts` complet :
  - **Apparitions progressives** : aucune voix au départ ; à condition remplie → scène d'arrivée (4-6 répliques) + choix « l'écouter » (→ actif) / « le repousser » (→ `refuse`, reviendra plus tard à condition majorée).
  - **Plafond 4 voix actives** (l'utilisateur active/endort manuellement ; endormi = loyauté −1/jour, silence).
  - **Loyauté** 0-100 (départ 50) : +5 conseil suivi, −3 ignoré, +8 décision alignée en moment clé, −10 contraire à sa doctrine. **>80** = capacité signature, **<20** = hostile.
  - **Mort symbolique** : loyauté 0 pendant 3 jours → adieu + legs (citation, +1 notion) → `mort` définitif.
  - **Véracité secrète** : chaque conseil marqué {vraie | exagérée | mensonge} ; 3-7 jours plus tard, rétrospection révèle le mensonge → fiabilité perçue −20 permanent.
- Écran Conseil (colonne voix actives/endormies/hostiles/mortes/**inconnues en silhouette** ; fiche du sélectionné ; historique des conseils) ; bandeau in-world teinté quand un fantôme parle.
- Tests : les 5 déclencheurs (smith/echanges≥1, marx/conflitsRepartition≥1, ostrom/membres≥2+collectif, hobbes/incidents≥1, taylor/optimisations≥1), refus/différé, seuils 80/20, mort après 3 jours, révélation de mensonge.

### M5 — Premier projet & quartier réactif
- **Stand des Roses** (`src/simulation/project.ts`) : achat stock 15 €, prix 0,5-2 €, demande = f(prix, réputation, jour de semaine, météo), sessions de vente 1 h (récré/place) ; **service de courses** épicerie (2 €/course, 20 min) ; équipe Noah + Lina (recruter exige communication ≥2) ; échec possible (stock invendu ; rivalité >60 → départ d'un membre).
- **Livre de comptes** : invariant Σ(entrées − sorties) = solde, toujours ; trésorerie ≠ résultat hebdo.
- **Répartition des gains** (fin de semaine) : égalité / équité (selon travail fourni) / incitation — effets relations 4D distincts + compteurs Conseil `marche`/`communs`/`solidarite` ; conflit de répartition possible (stress, rivalité).
- **Quartier** : vitalitéEpicerie (départ 45, drive −0,2/jour déjà en place) ; +1 par course rendue ; <35 → événement « Mme Bertin envisage de fermer » ; >60 → embauche + confiance quartier ; réputation ≥70 → Samir propose un stage (teaser).
- **Réputation** (`player.reputation`, bornes 0-100, départ 45 — valeur déjà dans `src/core/store.ts`) : +2 par vente réussie du stand, +1 par course rendue, +3 par arbitrage réussi, −5 par incident ou arnaque constatée dans le quartier ; confiance du quartier ≥60 l'entretient (+1/jour). Seuil du prototype : ≥70 → Samir propose un stage (teaser).
- **Météo** (`district.meteo` : `soleil | nuages | pluie`, champ déjà dans types.ts) : tirée chaque matin au PRNG (`w.rng`), jamais dans la présentation. Probabilités par saison — fin d'été (septembre) : soleil 60 / nuages 30 / pluie 10 ; automne : 30 / 40 / 30 ; hiver : 20 / 30 / 50. Effet sur la demande du stand : soleil +20 %, nuages 0, pluie −40 %. (À aligner : `src/simulation/district.ts` tire aujourd'hui des probabilités plates 45/36/18 — le systémiste met le tirage saisonnier en conformité.)
- UI : écran projet (stock, prix, équipe, comptes, répartition).
- Tests : scénario bout-en-bout automatisé (succès + échec), invariant comptes, effets des 3 modes, seuils 35/60.

### M6 — Fusions & antagonistes (+ corrections de la revue)
- **Affinités** par paire : +1 quand deux fantômes actifs approuvent la même décision.
- **Fusion smith+ostrom** : conditions exactes (≥3 décisions « marche » ET ≥3 « communs » avec les deux actifs, affinité ≥6) → scène → composite `marche_des_communs` (voix alternées ; déblocage : coopérative pérenne — ventes du week-end sans présence) ; smith et ostrom → `fusionne` ; réactions : Marx jaloux, Weber curieux.
- **Contrat de Sécurité (Hobbes)** : après incident (flags `incidents`≥1) il le propose — accepter : rendement +20 %, amitié du groupe −2/semaine, sortie uniquement si vote unanime ET amitié ≥60.
- **Taylor hostile** (<20) : sabotage rendement −15 % + chronométrage des PNJ (stress +) ; refus répétés → jauge `allianceDesOmbres`.
- Tests : conditions de fusion exactes, sortie du contrat, sabotage.

### M7 — Finalisation
README (pitch, contrôles, lancement), équilibrage (un chemin rapide : Smith → 1re vente → répartition ≈ 30 min de jeu), avatars SVG procéduraux par seed, dernière passe UI, tests et build verts.

## 4. Fantômes — règles absolues (§6.1 du prompt maître)
Aucun fantôme n'est simplement bon ou mauvais. **Chacun doit avoir raison ≥1 fois, tort ≥1 fois, pouvoir mentir (véracité secrète) et pouvoir souffrir.** Gabarit de fiche : `src/data/ghosts/registry.ts` (type `GhostDef` dans `src/core/types.ts`). Voix distinctes : tics, sujets sérieux, sujets exagérés, nom d'adresse du joueur.

## 5. Besoins — les 3 conséquences de chacun (figées)
- fatigue >70 : vitesse −30 % ; échec d'action +20 % ; irritabilité (amitié −1 sur les dialogues). >85 : rendement école/projet −50 %, microsommeil forcé.
- faim >70 : XP d'apprentissage −50 % ; moral −0,05/tick ; >90 : malaise (journée interrompue).
- stress >70 : dialogues « de haut niveau » verrouillés ; probabilité de conflit + ; nuit moins réparatrice.
- moral <30 : actions sociales coûtent 2× le temps ; propositions refusées plus souvent ; rendement −.

## 6. Déclencheurs d'apparition (roster complet)
**G1** : smith — premier échange/revente (`echanges`≥1) · marx — premier conflit de répartition (`conflitsRepartition`≥1) · ostrom — stand collectif (membres≥2 ET `rules.collectif`) · hobbes — incident (`incidents`≥1) · locke — première injustice subie/témoin (`injustices`≥1) · rousseau — premier dilemme de justice tranché (`dilemmesJustice`≥1) · ricardo — Compréhension≥50 · weber — première routine/procédure créée (`procedures`≥1) · keynes — première semaine de perte (`semainesPerte`≥1) · hayek — première règle imposée qui échoue (`reglesEchouees`≥1) · bourdieu — première distinction sociale remarquée (`distinctions`≥1) · machiavel — Influence≥55.
**G2** : taylor — optimisation tentée (`optimisations`≥1) · ohno — 3 sessions de vente réussies · dejours — coéquipier stress>70 · graeber — corvée absurde (`corveesAbsurdes`≥1) · zuboff — données du stand exploitées (`donneesExploitees`≥1) · stiegler — distraction répétée (`distractions`≥2) · rosa — semaine >40 h d'activités · raworth — choix écologique coûteux (`choixEcoCouteux`≥1) · illich — outil contre-productif (`outilsContreProductifs`≥1) · simon — 2 prévisions ratées (`previsionsRatees`≥2).
**G3** (composites) : marche_des_communs (smith+ostrom) · travail_vivant (marx+dejours) · instabilite (keynes+Minsky) · cage_disciplinaire (weber+foucault) · ordre_sans_maitre (hayek+ostrom) · le_flux (ohno+smith) · fantôme-miroir.

## 7. Lore réutilisable (PDF 2)
Val-Ferrand, Cité des Roses, friche Taret (38 ha), TaretCoop (Samir), épicerie Bertin assaillie par le drive, Noah Martin (Bible §7 : Amitié 78/Confiance 65/Respect 48/Rivalité 18), Karim/Monique/Samir (arcs d'attente). Ton : réel, chaleureux, sans science-fiction.
