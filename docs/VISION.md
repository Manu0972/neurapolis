# NEURAPOLIS — Vision et canon (document de référence)

> **Statut : fait foi.** Rédigé le 2026-10-07 par la session E (Claude Code), sur instruction directe de l'utilisateur :
> « un jeu explorable, avec autant de complexité que Big Ambitions, cadré de A à Z ; refaire graphismes et systèmes ; partir sur de nouvelles bases graphiques si besoin ».
> Ce document remplace, là où ils se contredisent, `README.md`, `PROJECT_PLAN.md`, `GUIDE-DA.md`, `art/DIRECTION-ARTISTIQUE.md`, `docs/guide-style-da-2.5d.md` et `.zcode/coordination/CHATGPT-COOP/PROJECT-CONTEXT.md`.
> Les sources de lore lues pour l'écrire : `1.pdf` (Bible de game design v0.2 → Document de conception v1.0), `2.pdf` (prototype « Édition Savoirs », chronologie 2025-2045, fiches de territoires, leçons), `neurapolis-feuille-de-route v.3.md`, `docs/*.md`, le code de `src/`.

---

## 1. En une phrase

**NEURAPOLIS est une simulation de vie et d'entreprise en 3D, dans une ville explorable : tu grandis à Val-Ferrand à partir de 12 ans, tu apprends comment le monde fonctionne, tu montes des activités de plus en plus ambitieuses, et tes choix transforment la ville.**

Devise (Bible §17) : *Une vie pour comprendre le monde. Un monde pour construire une civilisation.*

Référence de **profondeur et de forme** : *Big Ambitions* (ville parcourable à pied, immobilier commercial, commerces aménagés, stocks, fournisseurs, employés, marketing, finance, concurrence). Référence de **sens** : la Bible (une vie, l'apprentissage en spirale, les conseillers intérieurs qui peuvent se tromper, la mémoire et les conséquences). On ne copie ni les marques, ni les personnages, ni les assets, ni l'identité de *Big Ambitions*.

## 2. Les sept piliers (Bible §2, conservés)

| Pilier | Ce que le joueur vit concrètement |
|---|---|
| **Vie vécue** | Un personnage créé par le joueur, avec une famille, une chambre, l'école, des besoins et un emploi du temps. |
| **Apprentissage réel** | Les notions (égalité, équité, incitation, marge, trésorerie, partie prenante…) s'apprennent en 4 étapes et changent ce qu'on peut faire. |
| **Autonomie** | Les habitants, les commerces et les rivaux ont leurs routines et leurs objectifs ; la ville vit sans le joueur. |
| **Progression organique** | Pas de niveaux : on passe du stand de goûters à la boutique, puis à plusieurs commerces, puis aux décisions de quartier. |
| **Conséquences** | Chaque décision laisse une trace (journal des causes, mémoire des PNJ, effets différés). |
| **Exploration** | **On marche dans une vraie ville 3D** : rues, commerces, intérieurs, quartiers qui s'ouvrent. |
| **Émergence** | Le directeur d'événements, les rivaux et le marché produisent des histoires non écrites. |

Les dix règles de qualité de la Bible (Partie XV) s'appliquent à toute livraison. La première : **aucune statistique sans conséquence**.

## 3. Canon du lore (tranché ici)

### 3.1 Lieu et époque

- **Val-Ferrand**, 45 000 habitants, chef-lieu de la **Vallée du Taret**. Ville fondée sur le charbon au XIXᵉ siècle, puis la métallurgie au XXᵉ.
- **La partie commence le mardi 1ᵉʳ septembre 2020**, jour de la rentrée. Le joueur a **12 ans** et entre en 5ᵉ au collège. L'âge augmente d'un an chaque 1ᵉʳ septembre (décision du 2026-10-01, conservée).
- Le **prologue** (2014-2020, de 6 à 11 ans) n'est pas jouable pour l'instant ; il existe comme souvenirs (journal, dialogues, création de personnage).

### 3.2 Taret-Acier : la contradiction 2014 / 2032 résolue

Les sources se contredisaient : la Bible situe l'enfance en 2014 et la friche existe déjà en 2020, alors que le prototype de 2045 dit « Taret-Acier a fermé en 2032 ». **Les deux sont vrais, en deux temps :**

1. **2014 — fermeture des hauts-fourneaux** au cœur de la ville : 2 900 emplois perdus. Il en reste la **Friche Taret** (38 ha), couverte de fresques revendicatives. C'est la friche du jeu, déjà là en 2020.
2. **2032 — fermeture programmée du laminoir Taret** en périphérie : 1 300 emplois, soit **4 200 emplois perdus au total**, le chiffre du prototype. C'est un **événement futur** que le joueur adulte pourra anticiper, accompagner ou empêcher (reprise en coopérative, reconversion, rachat).

### 3.3 Les lieux canoniques de Val-Ferrand

| Lieu | Rôle dans le jeu |
|---|---|
| **La Cité des Roses** | Logements sociaux de 1965, où vit le joueur. Quartier de départ. |
| **Le collège** | École, emploi du temps, Mme Moreau, camarades. |
| **L'épicerie Bertin** | Premier fournisseur et premier allié commercial (Mme Bertin). |
| **La place** (place du Marché) | Cœur commercial, marché, fontaine, assemblées en plein air. |
| **Le parc** | Détente, rencontres, sport. |
| **La Friche Taret** | Atelier, Karim (ancien ouvrier), projets de reconversion. |
| **Le Canal de la Malterie** | Promenade, péniche-marché, ambiance, événements météo. |
| **La Maison du Peuple** | Bibliothèque et salle d'assemblée : conseil de quartier, vote du chapitre 4. |
| **La rue Commerçante** (avenue Jean-Jaurès) | Locaux commerciaux à louer : le terrain de jeu « Big Ambitions ». |
| **La zone commerciale HyperVal** | Le Drive HyperVal, rival principal, et des entrepôts de gros. |

### 3.4 Les habitants (canon existant, conservé)

Noah Martin (ami proche), Lina, Samir, Yasmine, Mme Bertin (épicière), Monique (voisine, mémoire du quartier), Karim (ancien de Taret-Acier), Mme Moreau (professeure). Le maire **Jean-Bernard Pujol** est élu en mars 2020, à 43 ans (il en aura 68 en 2045, comme dans la fiche du prototype). La préfète **Awa Diallo** n'arrive qu'en 2037.

### 3.5 Les conseillers intérieurs (« fantômes »)

Ils représentent les idées que le personnage a assimilées : 22 voix (économistes, sociologues, théoriciens de l'organisation : Smith, Keynes, Taylor, Mintzberg, Ostrom…). Ils **apparaissent progressivement**, déclenchés par ce que le joueur vit. Ils **conseillent, se contredisent et peuvent se tromper** (mécanique « Conseil ou piège ? » : chaque conseil a des hypothèses, des limites et une vérité révélée plus tard). Au plus 4 voix actives.

### 3.6 L'horizon du monde (2025 → 2045)

La chronologie du prototype (accord de Paris 2.0 en 2025, krach de la bulle IA en 2029, IA souveraine en 2032, canicule de l'Étang en 2034…) devient **l'histoire future du monde**. Elle se déroulera pendant que le joueur vieillit et alimentera les chocs macroéconomiques (`macro_news`). Les autres territoires (Néo-Baie, Plateau Blanc, Île Saphir, Delta 9) sont des **destinations futures** : voyages, expansion.

## 4. Ce que le joueur fait : la boucle « Big Ambitions » adaptée

```
Explorer la ville ─▶ repérer un besoin, un local, une opportunité
      ▲                                │
      │                                ▼
S'adapter ◀── Conséquences ◀── Monter l'activité : local, aménagement, stock, équipe, prix, horaires
 (journal, conseillers,             │
  rivaux, quartier)                 ▼
                       Clients (trafic de la rue, prix, qualité, réputation, marketing)
                                    │
                                    ▼
                       Comptes du jour/semaine : CA, coûts, loyer, salaires, trésorerie, dette
```

### 4.1 Les systèmes de la cible (et leur état actuel)

| Système | Cible | État au 2026-10-07 |
|---|---|---|
| **Ville 3D explorable** | Rues nommées, trottoirs, voitures, piétons, commerces, intérieurs, jour/nuit, météo | **À refaire** (blocs iso sur grille) : chantier E-1 |
| **Déplacement** | Marche fluide en troisième personne, caméra orbitale, course, plus tard vélo et bus | Pas de tuile, rigide : chantier E-1 |
| **Immobilier commercial** | Annonces de locaux (adresse, m², loyer, trafic piéton), bail, caution | Absent : chantier E-3 |
| **Commerces** | Types (épicerie, café, boutique, atelier…), aménagement, capacité, horaires | Stand unique : chantier E-3 |
| **Stocks et fournisseurs** | Catalogue produits, grossistes, livraisons, péremption | Partiel (`vendors`, `logistics`) : E-3 + Antigravity |
| **Employés** | Marché de l'emploi, compétences, salaires, satisfaction, plannings | Partiel (rôles de `multi_ventures`) : E-4 |
| **Clients** | Flux par rue et par heure, choix prix/qualité/attente, fidélité | Demande agrégée simple : E-3 |
| **Marketing** | Affiches, réseaux, bouche-à-oreille | Embryonnaire (`media`) : E-4 |
| **Finance** | Banque, prêts, intérêts, trésorerie vs bénéfice | Crédit fournisseur seulement : E-4 |
| **Concurrence** | Rivaux par emplacement, prix, réactions | Bon socle (`rival`) |
| **Vie** | Besoins, école, famille, sommeil | Bon socle |
| **Relations et mémoire** | Relations 4D, mémoire des PNJ, arcs | Bon socle |
| **Conseillers** | 22 voix, crédibilité | Bon socle |
| **Campagne 12 → 16 ans** | 5 chapitres, épilogue | Jouable (selon les rapports), à revalider en 3D |

### 4.2 Accès selon l'âge (cohérence lore + Big Ambitions)

Le jeu commence à 12 ans. *Big Ambitions* met un adulte aux commandes ; NEURAPOLIS fait **grandir** l'accès, c'est la « progression en spirale » de la Bible :

| Âge | Ce qui est possible | Garde-fou narratif |
|---|---|---|
| 12-13 | Stand, petits services, vente au marché | Argent de poche, accord des parents |
| 14-15 | Coopérative, atelier de la Friche, location d'un emplacement de marché | Karim ou Mme Bertin servent de garant |
| 16-17 | **Premier local commercial** (bail co-signé par un parent ou un mentor), premiers salariés à temps partiel | Le co-signataire peut refuser si la trésorerie est mauvaise |
| 18+ | Tout : plusieurs commerces, prêts bancaires, immobilier, chaînes | — |

Pour le **développement et les tests**, un mode « bac à sable » (option de création de partie) débloque tout dès le départ, comme *Big Ambitions*.

## 5. Direction visuelle (nouvelle base)

**La présentation 2.5D pixel art est abandonnée comme cible principale.** Décision de l'utilisateur le 2026-10-07 : « les graphismes sont nuls… faire comme si on était dans Big Ambitions ». Voir `docs/DECISIONS.md`.

- **Rendu** : 3D temps réel (Three.js / WebGL2), **troisième personne**, caméra orbitale qui suit le joueur (molette = zoom, clic droit glissé = rotation), vue haute possible pour la gestion.
- **Style** : « cosy réaliste » stylisé. Volumes propres, matériaux lisibles, **lumière chaude ~1800 K le soir**, ciel et brouillard atmosphériques, ombres douces. Lisible avant d'être chargé.
- **Échelle** : **1 tuile = 1 mètre**. Personnage d'environ 1,6 m, chaussée de 7 m, trottoirs de 3 m, immeubles de 3 à 6 étages (3 m par étage).
- **Ville vivante** : piétons, voitures et bus qui circulent sur la chaussée, lampadaires qui s'allument au crépuscule, fenêtres éclairées la nuit, enseignes, mobilier urbain.
- **Personnages** : modèles procéduraux articulés (tête, torse, bras, jambes) **animés** (marche, course, repos), construits à partir de l'apparence choisie à la création.
- **Interface** : HUD sobre façon « téléphone / application de gestion », panneaux de gestion clairs ; la palette chaude actuelle (crème, terracotta, sauge) est conservée pour l'UI.
- **Barre de qualité** : capture du **vrai jeu** à chaque jalon (jour, soir, nuit, pluie) ; 60 i/s visés sur PC de bureau moyen ; jamais « intégré » sans capture.

## 6. Échelle de la ville et du temps

- **Ville initiale** : centre de Val-Ferrand, environ 320 m × 240 m, organisé en îlots autour d'un réseau de rues nommées. Les quartiers au-delà s'ouvrent plus tard (zone HyperVal, laminoir, gare).
- **Temps** : la simulation garde un tick de 10 minutes. En exploration à vitesse ×1, **1 minute de jeu = 1 seconde réelle** (une journée éveillée dure environ 16 minutes réelles). Les vitesses ×5 et ×20 accélèrent ; le sommeil et les trajets longs avancent le temps.

## 7. Architecture (invariants conservés)

- `core` ← `simulation` ← `presentation`. La simulation reste **déterministe** (PRNG du projet) et ignore WebGL et le DOM.
- **La ville est une donnée** : `src/data/city/` décrit les rues, îlots, parcelles et bâtiments ; elle produit la grille de tuiles (`src/data/map.ts`, même API qu'avant : `tileAt`, `isWalkable`, `entranceAt`, `PLACE_ANCHORS`). Le moteur 3D (`src/presentation/city3d/`) **lit** ces données ; il ne décide de rien.
- **Position du joueur** : la simulation garde la tuile entière (`player.pos`). La présentation interpole une position continue et ne valide un pas que si `isWalkable` l'accepte.
- Les éléments purement visuels (voitures, foule d'ambiance) vivent dans la présentation, avec un hasard **non issu** du PRNG du monde.
- Tout changement de `WorldState` : version de sauvegarde, migrateur, test aller-retour.

## 8. Jalons de production (session E et Antigravity)

| Jalon | Contenu | Critère de réception |
|---|---|---|
| **E-0** | Ce document, la décision 3D, le brief Antigravity | Fichiers publiés, tableau à jour |
| **E-1** | Ville 3D explorable : nouvelle carte à l'échelle 1 m, moteur `city3d`, marche fluide en troisième personne, caméra orbitale, jour/nuit, lampadaires, voitures et piétons d'ambiance | Capture du vrai jeu ; tests verts ; on entre dans les 6 lieux existants |
| **E-2** | Personnages articulés animés (joueur selon son apparence, PNJ selon leur fiche), PNJ qui marchent d'un lieu à l'autre | Capture ; un PNJ qui se déplace joue la marche |
| **E-3** | Immobilier et commerces : annonces de locaux, bail, choix du type de commerce, stock, clients par trafic, comptes du jour | Tests de simulation ; parcours jouable « louer, ouvrir, vendre, payer le loyer » |
| **E-4** | Employés, banque et prêts, marketing | Tests ; parcours « embaucher, emprunter, faire de la publicité » |
| **E-5** | Intérieurs praticables (on entre et on marche dans le commerce) | Capture |
| **A-x** | Délégués à Antigravity (voir `docs/ANTIGRAVITY-BRIEF-2026-10-07.md`) | Selon le brief |

## 9. Ce qui reste à confirmer par l'utilisateur

Ces points ont une valeur par défaut (indiquée) et ne bloquent pas le travail :

1. Accès selon l'âge (§4.2) ou bac à sable total par défaut ? **Par défaut : accès selon l'âge, bac à sable en option.**
2. Le joueur adulte (17+) fait-il partie de cette version ? **Par défaut : la campagne 12-16 ans reste le cœur ; la vie adulte se prépare dans les données mais n'est pas encore jouable.**
3. Garde-t-on un rendu 2D de secours ? **Par défaut : oui, minimal, uniquement si WebGL est indisponible.**
