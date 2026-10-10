# NEURAPOLIS — Architecture du Monde et Budgets de Simulation

## 1. Introduction et Vision Systemique

NEURAPOLIS simule la trajectoire complète d'un individu, de son enfance dans un quartier populaire (Palier 1) jusqu'à la direction d'un conglomérat mondial à l'horizon 2045 (Palier 6).

Pour offrir une profondeur systémique réaliste sans sacrifier les performances du navigateur ni saturer la mémoire vive, le monde repose sur une **architecture multi-échelle à 5 niveaux emboîtés (N0 à N4)**. Cette modélisation permet d'allier la précision chirurgicale des interactions locales (PNJ, famille, rivaux) à la puissance de simulation d'une économie mondiale vivante et cohérente.

---

## 2. Les 5 Niveaux de Simulation

```
+-----------------------------------------------------------------+
| N0 — Monde : Macro-économie globale, événements 2025–2045       |
|  +-----------------------------------------------------------+  |
|  | N1 — Pays : Cadre légal, fiscalité, taux banque centrale  |  |
|  |  +-----------------------------------------------------+  |  |
|  |  | N2 — Villes & Cohortes : Agrégats statistiques      |  |  |
|  |  |  +-----------------------------------------------+  |  |  |
|  |  |  | N3 — Agents proches : PNJ nommés & relations |  |  |  |
|  |  |  |  +-----------------------------------------+  |  |  |  |
|  |  |  |  | N4 — Individus générés à la demande     |  |  |  |  |
|  |  |  |  +-----------------------------------------+  |  |  |  |
|  |  |  +-----------------------------------------------+  |  |  |
|  |  +-----------------------------------------------------+  |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

### 2.1 N0 — Monde (Macro-environnement)
* **Périmètre** : Grands indicateurs régionaux, nationaux et internationaux. Tendances macro-économiques mondiales, chocs climatiques, innovations technologiques et événements géopolitiques.
* **Fonctions** :
  - Déroulement de la chronologie historique du projet (2025–2045 : crise climatique, bulle de l'IA, transition énergétique).
  - Évolution des cours mondiaux des matières premières (énergie, céréales, composants électroniques, matériaux de construction).
  - Génération des chocs exogènes (`macro_news` : inflation, pénuries, embargos).
* **Fréquence de mise à jour** : Mensuelle ou sur événement déclencheur.

### 2.2 N1 — Pays (Cadre institutionnel & souverain)
* **Périmètre** : État, cadre législatif, fiscalité et régulation monétaire.
* **Fonctions** :
  - Fixation du taux d'intérêt directeur par la banque centrale.
  - Barèmes d'imposition (impôt sur les sociétés, TVA, cotisations sociales, taxes écologiques).
  - Réglementation du travail et politiques publiques (subventions à la rénovation, aides aux PME, contrats d'apprentissage).
  - Investissements dans les infrastructures nationales (lignes de tramway, réseaux électriques, centres de recherche).
* **Fréquence de mise à jour** : Hebdomadaire / Trimestrielle.

### 2.3 N2 — Villes & Cohortes (Agrégats statistiques)
* **Périmètre** : Les territoires (Néo-Baie, Plateau Blanc, Île Saphir, Delta 9) et la population sous forme de cohortes statistiques.
* **Fonctions** :
  - Modélisation de la population sous forme de groupes homogènes (ex. *« Ouvriers de la Malterie »*, *« Étudiants du Faubourg »*, *« Cadres des Collines »*).
  - Calcul des taux d'emploi, du revenu moyen disponible, du pouvoir d'achat et de l'indice de satisfaction par quartier.
  - Simulation des flux de masse : mouvements de population aux heures de pointe, fréquentation des transports en commun, consommation globale par catégorie de biens.
* **Fréquence de mise à jour** : Quotidienne.

### 2.4 N3 — Agents proches du joueur (PNJ nommés)
* **Périmètre** : Les individus clés en relation directe avec le joueur (famille, amis du collège, coéquipiers, rivaux commercial, mentors, marchands du quartier).
* **Fonctions** :
  - Fiches individuelles complètes et persistantes dans l'état du jeu (`NpcState`).
  - Suivi des besoins (fatigue, moral, stress), de l'opinion sur le joueur et des relations à 4 dimensions (`amitie`, `confiance`, `respect`, `rivalite`).
  - Routines quotidiennes heure par heure avec déplacements sur la carte 3D/2D.
  - Mémoire sélective des événements vécus avec le joueur.
* **Fréquence de mise à jour** : À chaque tick de simulation (10 min in-game).

### 2.5 N4 — Individus générés à la demande (Passants & clients éphémères)
* **Périmètre** : La foule anonyme, la clientèle de passage dans les boutiques et les piétons dans la ville 3D.
* **Fonctions** :
  - Instanciation éphémère et 100 % déterministe grâce au PRNG du projet (Mulberry32) couplé à la graine du monde (`WorldState.rng`) et au contexte de la cohorte N2 locale.
  - Génération des caractéristiques visuelles (apparence, vêtements), du panier d'achat et de l'humeur lors de l'interaction avec le joueur ou lors de l'entrée dans le champ de vision 3D.
  - Recyclage et déchargement mémoire immédiat dès que l'agent quitte la scène, sans saturer le fichier de sauvegarde.
* **Fréquence de mise à jour** : Instanciation à la volée sur événement / rendu visuel.

---

## 3. Invariants de Conservation

La crédibilité systémique de NEURAPOLIS repose sur trois lois de conservation strictes. Aucune valeur ne peut apparaître ou disparaître magiquement dans le moteur de simulation.

### 3.1 Conservation de la Population
La population totale d'une ville ou d'un territoire est strictement égale à la somme des cohortes statistiques (N2), des PNJ nommés (N3) et des passants éphémères matérialisés (N4) :

$$\text{Population}_{\text{Totale}} = \sum \text{Effectifs}_{\text{Cohortes N2}} + \text{Effectifs}_{\text{PNJ Nommés N3}} + \text{Effectifs}_{\text{Instanciés N4}}$$

* **Règles de transition** :
  - Lorsqu'un individu anonyme devient un PNJ nommé (ex. recrutement d'un employé clé au Palier 3), il est déduit de sa cohorte N2 d'origine et instancié en N3.
  - Les naissances, décès et flux migratoires inter-villes sont comptabilisés dans le registre démographique (`PopulationLedger`) lors du bilan quotidien.

### 3.2 Conservation de la Masse Monétaire
L'économie fonctionne en **circuit fermé à comptabilité en partie double**. Chaque flux monétaire correspond à un débit sur un compte et un crédit d'égal montant sur un autre compte :

$$\Delta \text{Masse Monétaire} = \text{Injections Banque Centrale} - \text{Destructions de Crédit / Taxes Souveraines}$$

$$\sum \text{Solde}_{\text{Joueur}} + \sum \text{Solde}_{\text{PNJ N3}} + \sum \text{Trésorerie}_{\text{Entreprises}} + \sum \text{Épargne}_{\text{Cohortes N2}} + \text{Secteur Public} = \text{Constante}_{\text{Période}}$$

* **Règles comptables** :
  - Un achat en boutique transfère l'argent du portefeuille de l'habitant (ou de la réserve de sa cohorte) vers la caisse du commerce.
  - Le versement des salaires transfère la trésorerie de l'entreprise vers les ménages.
  - La création monétaire est exclusivement limitée aux prêts bancaires accordés par les institutions du niveau N1 et dûment enregistrés dans le registre financier (`CurrencyLedger`).

### 3.3 Conservation des Marchandises et Ressources
Chaque bien physique (farine, café, pièces détachées, matériaux de construction, vêtements) suit une équation de bilan de masse stricte :

$$\text{Stock}_{t} = \text{Stock}_{t-1} + \text{Production}_{t} + \text{Importations}_{t} - \text{Consommation}_{t} - \text{Gaspillage/Pertes}_{t} - \text{Exportations}_{t}$$

* **Règles d'approvisionnement** :
  - Une rupture de stock chez un grossiste (ex. zone HyperVal) empêche physiquement la réapprovisionnement des commerces de détail du quartier.
  - Le gaspillage et la péremption d'ingrédients sont journalisés comme destructions de valeur dans le registre des marchandises (`CommodityLedger`).

---

## 4. Budgets Mémoire et Temps d'Exécution dans le Navigateur

Pour garantir une fluidité parfaite à 60 FPS sur un ordinateur portable standard ou un navigateur web mobile, des limites strictes sont imposées au moteur de simulation.

| Indicateur | Cible Visée | Limite Absolue | Stratégie d'Optimisation |
| :--- | :--- | :--- | :--- |
| **Temps simulation par tick (10 min in-game)** | $< 0.8\text{ ms}$ | $< 2.0\text{ ms}$ | Calculs vectorialisés, boucles plates, pas d'allocations d'objets dans la boucle critique |
| **Temps agrégation quotidienne / mensuelle** | $< 8.0\text{ ms}$ | $< 15.0\text{ ms}$ | Exécution échelonnée hors de la frame critique de rendu |
| **Empreinte mémoire Heap JS** | $< 90\text{ Mo}$ | $< 150\text{ Mo}$ | Pooling d'objets pour N4, structures d'état plates, réutilisation des structures |
| **Taille de sauvegarde JSON** | $< 300\text{ Ko}$ | $< 1.0\text{ Mo}$ | Agrégation en cohortes N2, pas de stockage de l'historique brut N4, élagage des journaux (max 250 événements) |

---

## 5. Interface avec le Gameplay aux Paliers 5 et 6

Aux stades avancés du jeu, l'interface du joueur bascule d'une vue locale vers un pilotage stratégique mondial.

```
                    +-------------------------------------+
                    | PALIER 6 : Conglomérat Mondial      |
                    | — Influence N0 & N1 (Lois, Cours)   |
                    +------------------+------------------+
                                       |
                    +------------------v------------------+
                    | PALIER 5 : Holding Régionale        |
                    | — Gestion Multi-Villes, Cohortes N2 |
                    +------------------+------------------+
                                       |
  +------------------------------------+------------------------------------+
  |                                    |                                    |
+-v----------------------------------+-v----------------------------------+-v----------------------------------+
| PALIER 4 : Entreprise Inter-Quartier| PALIER 3 : Boutiques & Ateliers   | PALIERS 1-2 : Stand & Ventes Rue   |
| — N3 Avancé & Réseau Fournisseurs  | — N3 Proche & Employés Nommés      | — N3 Proche & Relations directes   |
+------------------------------------+------------------------------------+------------------------------------+
```

### 5.1 Gameplay du Palier 5 — Holding Régionale & Multi-Villes
* **Changement d'échelle** : Le joueur ne gère plus les commandes au carton près, mais supervise un portefeuille de filiales réparties sur plusieurs territoires (Néo-Baie, Plateau Blanc, Île Saphir, Delta 9).
* **Interactions avec N2** :
  - Lancement de campagnes marketing ciblées sur des cohortes spécifiques (ex. *« Offre spéciale étudiants »*).
  - Négociation de concessions d'exploitation et de baux commerciaux avec les municipalités.
  - Analyse des matrices d'attractivité des quartiers et ajustement des politiques de prix à l'échelle de la ville.

### 5.2 Gameplay du Palier 6 — Conglomérat Mondial & Action Macro-Économique
* **Changement d'échelle** : Le joueur contrôle une holding transnationale et participe aux orientations économiques majeures.
* **Interactions avec N1** :
  - Activités de lobbying institutionnel pour influencer les taux d'imposition ou les normes environnementales.
  - Partenariats public-privé pour financer des grandes infrastructures nationales (lignes de ferroutage, centrales de transition).
* **Interactions avec N0** :
  - Prises de participation dans des fournisseurs mondiaux de matières premières pour sécuriser les chaînes d'approvisionnement.
  - Duels doctrinaux au plus haut niveau (ex. *Polanyi ⟷ Hayek*, *Schumpeter ⟷ Zuboff*) influençant le modèle de société et les règles du marché global.
