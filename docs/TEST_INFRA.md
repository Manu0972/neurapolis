# NEURAPOLIS — Infrastructure & Méthodologie des Tests E2E

> **Document de référence pour l'infrastructure de test du projet NEURAPOLIS**  
> **Auteur** : E2E Test Suite Architect (`test_writer_e2e_3`)  
> **Date** : Octobre 2026  
> **Cible de validation** : `neurapolis/tests/extended_world_e2e.test.ts` & Suite complète Vitest  
> **Conformité** : Couches strictes (`core` ← `simulation` ← `presentation`), PRNG déterministe `mulberry32`, simulation sans écran.

---

## 1. Philosophie & Principes Directeurs

Le moteur de simulation et le rendu de NEURAPOLIS reposent sur une rigueur d'ingénierie absolue inspirée des principes de `neurapolis-architecte` :

1. **Le noyau tourne sans écran (Headless First)** :
   Toute la logique économique, spatiale, sociale et politique s'exécute et se teste sous Node.js via Vitest sans nécessiter de DOM lourd ni d'accélération matérielle Canvas.
2. **Déterminisme strict** :
   Le PRNG `mulberry32` (`src/core/rng.ts`) stocké dans `w.rng` garantit que deux parties démarrées avec la même graine (`seed`) produisent exactement la même séquence d'événements, de météo et de réactions concurrentielles.
3. **Tests opaques et intègres (Anti-Facade)** :
   Aucun test « vitrine » qui passe artificiellement sans exercer de logique réelle. Les formules mathématiques, les transitions d'état et les invariants de conservation sont audités à chaque exécution.
4. **Conservation comptable stricte** :
   L'invariant fondamental du livre de comptes ($\sum \text{amount} \equiv \text{balance}$) est vérifié avant et après chaque session commerciale et chaque cycle hebdomadaire.

---

## 2. Organisation de la Suite de Tests en 4 Tiers

La suite de tests E2E étendue (`tests/extended_world_e2e.test.ts`) est structurée selon un modèle en 4 Tiers progressifs :

```
┌────────────────────────────────────────────────────────────────────────┐
│  Tier 4 : Scénarios Réels Multi-Jours & Transformations Systémiques   │
│  (Cycles 7 jours, blackout collectif, budget participatif complet)    │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 3 : Interactions Croisées (Pairwise Cross-Feature)               │
│  (Budget x Radio, Ateliers x Logistique, Événements x Quartiers...)   │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 2 : Cas Limites & Conditions Extrêmes (Boundary & Corner Cases)  │
│  (Zéros, fatigue 100%, outillage brisé, risque CSA max, météo hostile)│
├────────────────────────────────────────────────────────────────────────┤
│  Tier 1 : Couverture Fonctionnelle des 4 Axes Majeurs (>=5 tests/axe)  │
│  (DA 2.5D, Quartiers & Lore, Budget Citoyen, Arrière-Plan Complexe)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Matrice de Couverture par Axe

### Axe 1 : Direction Artistique Pixel-Art 2.5D
- **Palette 28 couleurs hue-shiftées** : Vérification de l'exclusion absolue du noir pur (`#000000`) et du blanc pur (`#ffffff`), présence du contour universel brun chaud `#2a1a14`.
- **Ambiance Hygge 1800K** : Validation des contrastes thermiques (lumière ambrée dorée `#ffd98a` vs ombres violettes `#8e8a9a` / indigo `#1c2a4a`).
- **Morphologie et progression de Camille** : Respect des gabarits chibi par tranche d'âge :
  - 12 ans : $16 \times 22$ px (ratio 2.2 têtes)
  - 14 ans : $16 \times 24$ px (ratio 2.5 têtes)
  - 16 ans : $17 \times 26$ px (ratio 2.8 têtes).
- **Cycle de marche 8 frames déterministe** : Séquence des 4 poses clés et de leurs miroirs (contact, descente, passage, montée) avec bob de tête triangulaire.
- **Tri de profondeur Y (Occlusion naturelle)** : Tri ascendant par coordonnée Y garantissant que les entités situées au nord sont masquées par les props/entités situés au sud.
- **Silhouettes spectrales des fantômes** : Attributs iconiques des 5 penseurs (Smith, Marx, Ostrom, Keynes, Taylor).

### Axe 2 : Extension de l’Histoire, Quartiers, Personnages & Événements
- **Les 5 nouveaux quartiers cartographiés** :
  - *Le Canal & Les Docks Désaffectés* (4 POIs, Péniche L'Égalité Flottante, Capitaine Yannick, Barnabé le pêcheur).
  - *Les Hauts de Val-Ferrand* (4 POIs, toits végétalisés, studio Radio Val-Libre 107.4, Gaspard Vaneck).
  - *Le Bassin Industriel Nord* (4 POIs, La Forge Commune, chaufferie citoyenne, Djamila & Karim).
  - *Les Souterrains & Caves Voûtées* (4 POIs, galeries secrètes, Silvio la Taupe, Louison le fresquiste).
  - *La Ligne de Tramway / TER* (4 POIs, hub multimodal, Solange Vasseur, régulation du stress pendulaire).
- **14 fiches de personnages complètes** : Traits, secrets inavouables, tics humoristiques et raccords mécaniques jouables.
- **4 Garanties de Ghostwriter** : Tout fantôme doit pouvoir avoir raison, avoir tort, mentir (véracité secrète) et souffrir (mort symbolique).
- **5 Joutes verbales quotidiennes** : Confrontations philosophiques dans le quotidien (pause-café, croissant à 1,40 €, multiprise du stand, cageots de pommes flétries, balai vs balayeuse).
- **Catalogue des 32 événements émergents** : Répartition équilibrée dans les 6 catégories avec choix multiples et causes traçables.

### Axe 3 : Modification Dynamique de la Ville
- **Scrutin annuel de budget participatif** : Modèle d'enveloppe collective (500 €) et scoring par cohorte selon la doctrine.
- **Formule de pondération des cohortes** :
  $$S_{k, c} = \text{size}_c \times \text{mobilization}_c \times \left(0.5 + 0.5 \times \text{pref}_{c, d}\right) \times \left(1 + \frac{\text{campagneJoueur}}{50}\right)$$
- **Délibération et mobilisation civique** : Capacité du joueur à inverser un scrutin par le débat et la communication.
- **Métamorphose physique du monde** : Victoire d'un projet mutant directement la grille de tuiles (kiosque de la place, piste verte).
- **Chantiers déverrouillables** : Conditions d'accès par réputation et complétion de projets antérieurs.

### Axe 4 : Paramètres Complexes de Simulation en Arrière-Plan
- **Ateliers coopératifs modulaires** : Production hebdomadaire déterministe pour menuiserie, électronique et conserverie :
  $$\text{Production} = \left\lfloor \text{heures} \times \max(0.2, \text{condition}/100) \times \left(1 + 0.25 \times (\text{niveau}-1)\right) \times \gamma_{\text{gouvernance}} \right\rfloor$$
- **Gouvernance et usure d'outils** : Autogestion Ostromienne vs Comité d'artisans vs Direction taylorienne (haut débit mais usure et stress).
- **Radio Pirate 108.4 FM** : Modélisation d'audience bornée à 95 %, impact de la grille des programmes et érosion directe de la concurrence du Drive HyperVal.
- **Risque réglementaire CSA** : Dérive du risque de saisie selon la puissance d'antenne (5W à 50W) atténuée par la diplomatie.
- **Logistique douce multimodale** : Matrice comparative pied (10 kg) vs triporteur (60 kg, pénalité pluie -30%) vs péniche (500 kg, fluvial).
- **Réseau social et diffusion d'opinion PNJ** : Convergence progressive des opinions par proximité relationnelle.

---

## 4. Guide d'Exécution des Tests

### 4.1 Environnement Windows & PowerShell
Sur Windows, l'exécution directe de `npm test` sous PowerShell peut déclencher une restriction de sécurité `PSSecurityException`. Pour garantir une exécution stable et sans blocage :

```powershell
# Commande recommandée via l'interpréteur de commandes Windows :
cmd /c npm test

# Ou exécution ciblée de la suite étendue :
cmd /c npx vitest run tests/extended_world_e2e.test.ts

# Ou en utilisant directement l'exécutable npm.cmd :
npm.cmd test
```

### 4.2 Exécution en Mode Watch (Développement Continu)
```powershell
cmd /c npm run test:watch
```

---

## 5. Invariants et Audit Forensic

Chaque test de la suite valide la conformité aux invariants stricts suivants :
1. **Invariant de caisse** : Le solde de la trésorerie est égal à la somme algébrique des entrées et sorties du grand livre.
2. **Invariant de bornage des besoins** : Fatigue, faim, stress et moral restent toujours dans l'intervalle $[0, 100]$.
3. **Invariant de part de marché** : La somme des parts de marché du joueur et du rival est égale à 100 % sur un secteur donné.
4. **Invariant de sérialisation** : Tout état du monde sérialisé en JSON (`JSON.stringify`) puis rechargé (`JSON.parse`) restitue un état identique bit-à-bit sans perte de référence.
