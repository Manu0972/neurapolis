# NEURAPOLIS — suivi de la refonte (fichier de reprise)

> **À lire par toute session qui reprend le travail**, y compris les sessions automatiques
> lancées par `scripts/auto/run_auto.ps1`. Règles :
> 1. Lis `AGENTS.md`, `docs/VISION.md` (fait foi) et `.zcode/coordination/BOARD.md`.
> 2. Prends **la première tâche non cochée** `[ ]` de la section « À faire », dans l'ordre.
> 3. Réserve ses chemins au tableau, implémente-la, ajoute des tests.
> 4. Vérifie avec `scripts/auto/verify.ps1` (le `node_modules` du dépôt est illisible : ce script
>    utilise l'environnement sain de `.ci/verif`).
> 5. Publie avec `scripts/auto/publish.ps1 "message"` : branche `refonte-3d`, jamais `main`.
> 6. **Coche la tâche** `[x]` ici, avec la date et le commit, puis libère tes chemins au tableau.
> 7. Une seule tâche par session. Si une tâche est trop grosse, découpe-la ici en sous-tâches.
> Ne coche jamais une tâche dont les vérifications n'ont pas réellement été exécutées.

## Fait

- [x] Vision, canon du lore, décisions du 2026-10-07 (`docs/VISION.md`, `docs/DECISIONS.md`) — 2026-10-07
- [x] Brief et questions pour Antigravity ; réponses reçues — 2026-10-07
- [x] Sauvegarde v11 (`pendingDeliveries`), dédoublonnage P-PERSO — 2026-10-07
- [x] E-1 Ville de Val-Ferrand à l'échelle 1 m, moteur 3D `city3d`, marche à la troisième personne — `cc354bc`
- [x] E-3 Économie Big Ambitions : baux, étals, logistique physique, ventes horaires, employés, banque, téléphone — `def7092`
- [x] HUD épuré, mini-carte, plan de la ville — `125f40c`
- [x] E-5 Intérieurs praticables (lieux et commerces) — `a99246e`
- [x] Reprise automatique : `PROGRESS.md`, `scripts/auto/` — 2026-10-07

## À faire (dans l'ordre)

- [~] **Catalogue étendu** (bloqué : `tests/catalog_extended.test.ts` échoue encore côté Antigravity, marge de 5,6×) : quand `tests/catalog_extended.test.ts` passe (travail d'Antigravity), câbler `src/data/economy/catalog_extended.ts` dans `src/data/economy/index.ts` ; vérifier qu'aucun identifiant ne collisionne ; ajouter les points de retrait des grossistes « à retirer ».
- [x] **Vision à jour** (2026-10-07, session E) : intégrer à `docs/VISION.md` les réponses d'Antigravity (fantômes compagnons kawaii, logistique physique, expansion vers d'autres villes, mini-tutos, ellipses de temps) et la progression stand → étal → kiosque → boutique.
- [x] **Repères 3D** (2026-10-07) : flèche/colonne lumineuse au-dessus des points de retrait et de la boutique de destination quand on porte des cartons ; repère sur la mini-carte (déjà fait) et au sol.
- [x] **Dormir et passer le temps** (2026-10-07 ; nuit en ellipse ×120, fondu ; « Attendre 1 h » reste à faire) : lit de la chambre → « Dormir jusqu'à 7 h » (avance la simulation tick par tick, sans sauter la clôture économique) ; option « Attendre 1 h » ; écran de transition.
- [x] **Petit boulot** (2026-10-07 ; `src/simulation/jobs.ts`, remise Bertin après 3 services) : travailler chez Mme Bertin (mise en rayon, livraisons à pied) pour gagner ses premiers euros ; créneaux horaires, paie, effet sur la relation.
- [x] **Campagne × économie** (2026-10-07 ; ch. 1 : ventes de l'étal et employés ; ch. 3 : services chez Mme Bertin) : les objectifs des chapitres 1 et 2 utilisent l'étal (ventes réelles, équipe), sans casser les tests de campagne existants.
- [x] **Mini-tutos désactivables** (2026-10-07 ; carte non bloquante, 6 nouvelles fiches, « ne plus afficher ») : une fiche courte à la première utilisation de chaque mécanique (bail, commande, retrait, ouverture, embauche, prêt), option « ne plus afficher ».
- [x] **Concurrents en ville** (2026-10-07 ; 12 commerçants du lore, `src/data/city/competitors.ts`, pression par proximité ; fermetures/ouvertures dynamiques à faire plus tard) : des commerces tenus par les commerçants du lore (`src/data/lore/shopkeepers.ts`) occupent certains locaux ; ils prennent une part de la clientèle par rue ; enseignes visibles.
- [x] **Clients visibles à l'étal** (2026-10-07 ; seulement si quelqu'un sert et qu'il y a du stock ; étal avec montants et cagettes) : files de clients devant l'étal ouvert du joueur, proportionnelles aux ventes de l'heure.
- [x] **Aménagement manuel** (2026-10-07 ; clavier : Tab, flèches, R, Entrée, Échap ; save v14 ; glisser-déposer à la souris à faire plus tard) : placer les meubles achetés sur une grille dans l'intérieur du commerce (glisser-déposer), collisions mises à jour.
- [~] **Personnages de Jules** (module intégré 2026-10-07, 7 tests verts ; le moteur garde `simpleCharacter.ts` en attendant la V2 arrondie demandée dans `docs/jules/RETOUR-PERSONNAGES-3D.md`) : quand la PR `jules/personnages-3d` est fusionnée dans `refonte-3d`, remplacer `simpleCharacter.ts` par `characters.ts` dans `CityRenderer`, `ambient.ts` et les intérieurs.
- [x] **Sons de ville** (2026-10-07 ; sonnette, rumeur selon la voiture la plus proche, pas par revêtement et en intérieur) : brancher `audio.playDoorBell()` (entrée en boutique), `audio.setTrafficLevel()` (distance aux voitures), `audio.playFootstep()` par revêtement (asphalte, pavé, herbe, parquet).
- [x] **Vélo** (2026-10-07 ; 85 € dans le téléphone, B, ×2,5, +30 unités ; `src/simulation/vehicles.ts`) : acheter un vélo (dès 12 ans), monter/descendre, vitesse ×2,5, capacité de transport +30.
- [x] **Performance** (2026-10-07 ; mesuré dans le navigateur : 7,5 ms/image en rue, 11,5 ms en plongée maximale ; bundle séparé : three 137 Ko gzip + jeu 224 Ko gzip ; instanciation des passants jugée inutile à ce stade) : instanciation des passants, découpage du bundle (Three.js à part), mesure des images/seconde ; viser 60 i/s.
- [ ] **Sauvegardes multiples** : trois emplacements nommés + auto-sauvegarde, depuis le menu ☰.
- [ ] **Écran titre 3D** : vue animée de Val-Ferrand derrière le menu.
- [ ] **Test de bout en bout en navigateur** : script qui démarre une partie, loue un étal, commande, retire, décharge, ouvre et vend (via `window.__NEURAPOLIS__.qa`).
- [ ] **Expansion (âge adulte)** : préparer un deuxième quartier (gare, laminoir) et la fermeture du laminoir en 2032 comme événement jouable.
