# Cartes de la Vallée, du Pays et du Monde (paliers 4 à 6)

> **Statut : proposition, à valider par l'utilisateur.** Aucun code n'est écrit. Ce document répond au point 8 de `docs/STATUS-2026-10-07.md` (« une représentation au-delà de la ville et l'horizon conglomérat ») et suit le récit de `docs/lore/HISTOIRE-ASCENSION.md`.
> Rédigé le 2026-10-08 par Claude Code (session cloud), à partir du code de la branche `claude/intelligent-cray-8z6iz9`.

## 1. Le problème

Aujourd'hui, l'ascension monte jusqu'au palier 6 (`TIERS` dans `src/data/ascension/ideas.ts`), mais tout se joue dans la ville 3D :

- les 33 idées des paliers 4 à 6 (12 + 11 + 10) ne sont que des lignes de chiffres (marché, marge, part) ;
- la Vallée, Néo-Baie, le Plateau Blanc et l'Île Saphir existent seulement comme **voyages** (`src/simulation/travel.ts`) ;
- franchir le palier 5 ou 6 ne change rien à ce que le joueur voit.

Résultat : le joueur ne *sent* pas que son entreprise sort de la ville.

## 2. L'idée en une phrase

Un nouvel écran **🗺️ Carte** avec trois niveaux de zoom (Vallée → Pays → Monde) qui s'ouvrent avec les paliers 4, 5 et 6. On y **implante** son entreprise sur des lieux, on les **relie** par des routes, et les crises de chaque échelle y apparaissent.

La ville 3D reste le cœur du jeu : la carte est l'endroit où l'on décide ce qui se passe *loin*.

## 3. Ce que voit le joueur

| Niveau | S'ouvre à | Lieux (nœuds) | Routes | Crises propres |
|---|---|---|---|---|
| **La Vallée** | palier 4 (16 ans) | Val-Ferrand, la Gare, le Plateau Blanc (3 hameaux), le port de Néo-Baie, l'Île Saphir, 2 ou 3 villages du Taret | camionnette, péniche sur le canal, train régional | crue du canal, grève des chauffeurs, mauvaise saison du fromage |
| **Le Pays** | palier 5 (17-18 ans) | 6 à 8 grandes villes inventées, la capitale (ministères, régulateur), le siège social, une plateforme logistique nationale | autoroute, fret ferroviaire | OPA hostile d'un fonds, enquête de Yasmine, contrôle du régulateur, conflit social au siège |
| **Le Monde** | palier 6 | 8 à 10 ports et capitales inventés (Europe, partenaires Sud-Sud), un sommet international | routes maritimes (navires décarbonés), lignes aériennes de fret | blocage d'un détroit, sanction commerciale, sommet sur le contrôle citoyen des grands groupes |

**Style :** une carte 2D illustrée (SVG), dans l'esprit des cartes de jeu de société, jour et nuit selon l'heure du jeu. Elle est légère, fonctionne dans le fichier unique `NEURAPOLIS.html` et dans l'application Electron, et ne charge pas une deuxième scène 3D. Les camionnettes, péniches et navires y sont de petites icônes qui se déplacent le long des routes.

**Ce qu'on y fait :**
1. **Implanter** sur un lieu : comptoir (Vallée), franchise ou agence (Pays), filiale (Monde). Chaque implantation coûte une mise de départ et des frais fixes quotidiens.
2. **Relier** deux lieux par une route. Elle a une capacité, un coût par jour, un délai et un bilan carbone.
3. **Affecter** une entreprise d'ascension existante (ses `ventures`) à des lieux. Son marché grandit avec les lieux couverts **et reliés**.
4. **Répondre aux crises** : elles s'affichent sur le lieu touché et se règlent par une décision tranchée entre deux penseurs, comme aujourd'hui (Keynes / Hayek pour la crue, Bourdieu / Dejours pour le siège…).

## 4. Comment ça s'intègre au code (respect des couches)

```
core          ← territory_types.ts (types seuls)
simulation    ← territory.ts (règles pures, déterministes, PRNG du projet)
data          ← data/territory/{valley,country,world}.ts (lieux, routes, crises)
presentation  ← presentation/territory-map.ts (SVG, lecture seule de l'état)
```

### 4.1 État sauvegardé : changement de schéma → save v25

Nouveau champ dans `AscensionState` (`src/core/ascension_types.ts`) :

```ts
territory?: {
  /** lieu → implantation (type, niveau, jour d'ouverture) */
  sites: Record<string, { kind: 'comptoir' | 'franchise' | 'filiale'; level: number; since: number }>;
  /** routes ouvertes : "a>b" → mode et jour d'ouverture */
  links: Record<string, { mode: RouteMode; since: number }>;
  /** entreprise → lieux qu'elle dessert */
  coverage: Record<string, string[]>;
  /** crise en cours par lieu (id de crise, jour de début) */
  crises: Record<string, { id: string; since: number }>;
};
```

Comme l'exige `AGENTS.md`, il faut : `SAVE_VERSION = 25` (`src/core/store.ts`), un migrateur v24 → v25 dans `src/saves/migrations.ts` (le champ est créé vide), et un test aller-retour.

### 4.2 Règles (simulation/territory.ts, fonctions pures)

- **Débouché d'une entreprise** = `market × (1 + Σ poids des lieux couverts ET reliés à Val-Ferrand)`. Un lieu non relié ne rapporte rien : c'est ce qui rend les routes utiles.
- **Délai et coût des routes** : on reprend la formule de `src/simulation/logistics.ts` (`ceil(distance / vitesse × facteur météo)`) à l'échelle de la carte, pour que la météo du jeu compte aussi ici.
- **Crises** : tirées une fois par jour dans la clôture quotidienne (`ascension.ts`, « Clôture du jour »), avec le PRNG du projet et une probabilité propre à chaque lieu. Une crise non réglée réduit le poids du lieu, ou coupe la route.
- **Palier** : les lieux d'un niveau ne s'implantent qu'à partir du palier correspondant. `TIER_REQUIREMENTS` ne change pas, mais on peut ajouter une condition « 3 lieux de la Vallée reliés » pour le palier 5 (à décider, §7).
- **Lien avec les voyages** : visiter Néo-Baie, le Plateau Blanc ou l'Île Saphir via `travel.ts` donne un contact local qui réduit de 25 % la mise du premier comptoir (même logique que `eases` dans les idées).
- **Multijoueur** : les implantations de l'autre joueur apparaissent sur la carte comme des concurrents. Aucune règle réseau nouvelle : on réutilise la synchronisation de présence existante.

### 4.3 La fin : l'horizon conglomérat

Au palier 6, la question du récit (« un tel empire a-t-il le droit d'exister sans contrôle citoyen ? ») devient un **choix final** présenté au sommet international. Il est branché sur `src/simulation/governance.ts` :

- **Conglomérat** : on garde tout, puissance maximale ; les penseurs critiques se retournent contre le joueur.
- **Coopérative** : les salariés et les lieux implantés deviennent copropriétaires.
- **Fondation / entreprise à mission** : les bénéfices financent la Vallée.
- **Démantèlement volontaire** : on rend les filiales aux territoires.

Chacun mène à un épilogue (texte et carte finale), sans « bonne » réponse imposée, dans l'esprit des duels de penseurs.

## 5. Découpage proposé (chaque phase livrable seule, tests verts à chaque fois)

| Phase | Contenu | Fichiers | Tests |
|---|---|---|---|
| **1. Socle** | types, save v25, migrateur, données de la Vallée, règles d'implantation et de route | `core/territory_types.ts`, `core/ascension_types.ts`, `core/store.ts`, `saves/migrations.ts`, `data/territory/valley.ts`, `simulation/territory.ts` | `tests/territory.test.ts`, test aller-retour v24 → v25 |
| **2. Carte de la Vallée** | écran 🗺️ Carte, bouton dans l'interface, icônes mobiles, crises de la Vallée | `presentation/territory-map.ts`, `presentation/ui.ts`, `presentation/game.ts`, `presentation/style.css` | test des crises déterministes (même graine → mêmes crises) |
| **3. Le Pays** | lieux, OPA, enquête de Yasmine, régulateur | `data/territory/country.ts` | idem |
| **4. Le Monde + fin** | routes maritimes, sommet, choix final, épilogues | `data/territory/world.ts`, `simulation/governance.ts` | test de chaque fin |
| **5. Contenu Antigravity** (en parallèle des phases 3-4) | noms des villes et ports, textes des crises, épilogues, 6 concepts et questions de quiz (finance de marché, OPA, chaînes de valeur mondiales…) | `src/data/territory_ext/` (réservé pour Antigravity) | `tests/content_ag4.test.ts` |

Vérification à chaque phase : `verify.ps1` (tests + build), régénération de `NEURAPOLIS.html`, et un essai réel dans le navigateur avec une partie poussée au palier 4 (hameçon `qa` : prévoir `qa.territory()` et `qa.setTier(n)`).

## 6. Ce qu'on ne fait pas (volontairement)

- Pas de carte 3D du monde : trop lourde pour le fichier unique et les petites machines (point 10 de la liste).
- Pas de déplacement du personnage sur la carte : il reste à Val-Ferrand (les voyages existants suffisent pour « y aller »).
- Pas de vrais pays ni de vraies entreprises : tout est inventé, comme Val-Ferrand.

## 7. Décisions à prendre par l'utilisateur

1. **Style de carte** : 2D illustrée (proposé) ou vue 3D dézoomée de la ville qui s'éloigne ?
2. **Palier 5** : faut-il exiger « 3 lieux de la Vallée reliés » en plus des conditions actuelles ?
3. **Fin** : les quatre fins du §4.3 te conviennent-elles ? En ajouter ou en retirer ?
4. **Antigravity** : lui confier le contenu de la phase 5 (comme AG-2 et AG-3) ?
