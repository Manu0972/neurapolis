# NEURAPOLIS — Spécification & Architecture du Budget Participatif Citoyen et de la Rénovation Urbaine (Axe 3)

**Auteur** : Urban Governance & City Systems Engineer (Axis 3)  
**Date** : 2026-10-02  
**Statut** : Approuvé & Intégré  
**Modules sources** :  
- Contrat de types : `neurapolis/src/core/governance_types.ts`  
- Système de gouvernance : `neurapolis/src/simulation/governance.ts`  
- Système de rénovation & déverrouillage : `neurapolis/src/simulation/renovation.ts`  
- Suite de tests unitaires : `neurapolis/tests/city_governance.test.ts`  

---

## 1. Vision et Principes Fondamentaux

Dans **NEURAPOLIS**, la ville de **Val-Ferrand** n'est pas un décor statique ou un simple fond de scène : c'est un écosystème vivant, façonné par les luttes d'idées, le travail artisanal, les choix budgétaires et la délibération de ses habitants.

Face à la standardisation agressive du **Drive HyperVal**, qui cherche à transformer le quartier en zone de transit commercial impersonnelle, la communauté citoyenne dispose d'une arme démocratique majeure : le **Scrutin Annuel du Budget Participatif**. 

Ce système réconcilie quatre grandes traditions de la pensée économique et philosophique, incarnées par les **Fantômes Conseillers** qui hantent les pensées du jeune Camille :
1. **Adam Smith (Libérale / Marché)** : La prospérité collective émerge de la vitalité des étals ouverts, du commerce de proximité florissant et de la libre émulation des artisans.
2. **Karl Marx (Socialiste / Commune)** : L'espace urbain est un bien collectif qui doit servir en priorité aux besoins vitaux des classes travailleuses (cantines populaires, foyers partagés, gratuité d'accès, abolition des péages urbains).
3. **Elinor Ostrom (Communs & Autogestion)** : La cité est un réseau polycentrique de ressources partagées (toits maraîchers, vergers de quartier, berges du canal, chartes de voisinage) gérées durablement sans recours forcé à la bureaucratie d'État ni à la privatisation lucrative.
4. **Frederick Winslow Taylor (Productiviste / Organisation Rationnelle)** : L'espace doit être fluide, lisible et ergonomique ; la réduction des temps de parcours et l'aménagement rationnel des corridors logistiques éliminent le gaspillage d'énergie humaine.

---

## 2. Formule Déterministe de Scrutin Annuel Pondéré

Le scrutin annuel du Budget Participatif repose sur un modèle mathématique rigoureusement déterministe, sans tirage aléatoire incontrôlé.

### 2.1 Équation Centrale
Pour chaque projet citoyen $p$ en compétition et chaque cohorte votante $c$ :

$$\text{Score}_p = \sum_{c \in \text{Cohortes}} \text{Soutien}_{c, p} - \text{PénalitéCoût}_p$$

### 2.2 Calcul du Soutien de Cohorte ($\text{Soutien}_{c, p}$)
Le soutien exprimé par une cohorte dépend de sa taille démographique, de son taux de mobilisation électorale, de son affinité avec la doctrine du projet et de l'effort de campagne/plaidoyer accumulé :

$$W_c = \text{size}_c \times \text{mobilizationRate}_c$$

$$\text{AffinitéBrute}_{c, p} = \text{preferences}_c[\text{doctrine}_p] + \text{BonusAuteur}_{c, p}$$
*(où $\text{BonusAuteur} = +0.20$ si le projet émane directement de la cohorte $c$, borné dans $[-1.0, +1.0]$)*

$$\text{PréférenceNormalisée}_{c, p} = \frac{1 + \text{AffinitéBrute}_{c, p}}{2} \in [0.0, 1.0]$$

$$\text{FacteurPlaidoyer}_{c, p} = 1 + \frac{\text{advocacyBonus}_{c, p}}{100} \in [1.0, 2.0]$$

$$\text{Soutien}_{c, p} = \text{Arrondi}\left(W_c \times \text{PréférenceNormalisée}_{c, p} \times \text{FacteurPlaidoyer}_{c, p}, 1\right)$$

### 2.3 Pénalité de Coût ($\text{PénalitéCoût}_p$)
Pour éviter que les projets pharaoniques ne captent tous les suffrages au détriment des aménagements modestes et concrets, une pénalité déterministe est soustraite :

$$\text{PénalitéCoût}_p = \text{Arrondi}\left(\text{costEuros}_p \times \gamma_{\text{coût}}, 1\right)$$
*(valeur par défaut : $\gamma_{\text{coût}} = 0.20$)*

### 2.4 Algorithme d'Allocation Budgétaire (Knapsack Glouton)
1. Les projets sont triés par **$\text{Score}_p$ décroissant**. En cas d'égalité, le projet au coût le plus faible est prioritaire.
2. L'enveloppe budgétaire disponible (ex. 500 € annuels) est allouée de manière séquentielle :
   - Si $\text{Score}_p > 0$ et $\text{BudgetRestant} \ge \text{costEuros}_p$, le projet est déclaré **Lauréat** (`status = 'laureat'`) et financé.
   - Dès que le budget ne permet plus de financer un projet, l'algorithme poursuit la liste pour vérifier si des projets de moindre envergure peuvent encore être soutenus avec le reliquat.
   - Les projets non financés sont marqués comme **Rejetés** (`status = 'rejete'`).

---

## 3. Les 4 Doctrines d'Aménagement Urbain

| Doctrine | Penseur Tutélaire | Thématique Centrale | Style Visuel Pixel-Art 2.5D | Bonus Systémiques Majeurs |
|---|---|---|---|---|
| **`liberale_marche`** | **Adam Smith** | Émulation commerciale & initiative privée | Boutiques ouvertes, étals modulaires en bois verni, vitrines chaleureuses 1800K | +Vitalité de l'épicerie et des commerces, afflux de chalands |
| **`socialiste_commune`** | **Karl Marx** | Propriété collective & cantines populaires | Briques industrielles, grandes tables de banquet partagées, lampions solidaires | +Cohésion sociale, bien-être ouvrier, réduction du stress |
| **`communs_ostrom`** | **Elinor Ostrom** | Autogestion & toitures maraîchères | Végétalisation foisonnante, tonnelles en bois de réemploi, composteurs | +Transition écologique, confiance citoyenne, vergers urbains |
| **`productiviste_taylor`** | **Frederick Taylor** | Rationalisation des flux & corridors doux | Signalétique au sol cannelée, quais de transbordement vélo-cargo ergonomiques | +Vitesse des triporteurs, réduction des temps de parcours |

### Matrice d'Affinité Doctrinale Initiale par Cohorte

| Cohorte Citoyenne | Population ($\text{size}$) | Mobilisation Initiale | Libérale / Marché | Socialiste / Commune | Communs / Ostrom | Productiviste / Taylor |
|---|---|---|---|---|---|---|
| **Jeunesse & Collégiens** (`jeunes`) | 120 | 45 % | $+0.15$ | $+0.70$ | $+0.60$ | $-0.35$ |
| **Commerçants & Artisans** (`commercants`) | 85 | 65 % | $+0.85$ | $-0.45$ | $+0.10$ | $+0.50$ |
| **Retraités & Aînés** (`retraites`) | 140 | 75 % | $+0.15$ | $+0.35$ | $+0.45$ | $+0.30$ |
| **Écologistes & Maraîchers** (`ecologistes`) | 95 | 55 % | $-0.55$ | $+0.40$ | $+0.95$ | $-0.65$ |

---

## 4. Cycle de Gouvernance en 4 Phases

Un cycle complet de budget participatif s'étend sur **30 jours de jeu** (soit un mois complet ou une saison) :

```
┌─────────────────┐      ┌─────────────┐      ┌───────────────┐      ┌─────────────────┐
│  Délibération   │ ───> │    Vote     │ ───> │  Allocation   │ ───> │   Réalisation   │
│   (10 jours)    │      │  (3 jours)  │      │   (2 jours)   │      │   (15 jours)    │
└─────────────────┘      └─────────────┘      └───────────────┘      └─────────────────┘
         ▲                                                                     │
         └─────────────────────────────────────────────────────────────────────┘
                                  (Cycle suivant +1)
```

### Phase 1 : Délibération Citoyenne (Jours 1 à 10)
Les citoyens débattent des projets soumis. Le joueur et les collectifs peuvent accomplir des actions d'influence :
- **Assemblée publique de quartier (`holdTownHallMeeting`)** : Hausse du consensus (+5 pts) et de la mobilisation électorale générale (+5%).
- **Distribution de tracts citoyens (`distributeCitizenPamphlets`)** : Cible une cohorte pour un projet donné (+25 pts de facteur plaidoyer, glissement doctrinal positif).
- **Débat sur Radio Val-Ferrand 108.4 FM (`broadcastPirateRadioDebate`)** : Débat thématique orientant l'ensemble de la population vers une doctrine (+0.08 à +0.10).
- **Plaidoirie des Fantômes Conseillers (`invokeGhostAdvocacy`)** :
  - *Adam Smith* : Galvanise les commerçants (+10% mobilisation, +30 plaidoyer sur les projets marchands).
  - *Karl Marx* : Harangue la jeunesse (+12% mobilisation, +35 plaidoyer sur les projets solidaires).
  - *Elinor Ostrom* : Rallie écologistes et retraités (+12% mobilisation écolos, +30 plaidoyer communs).
  - *Frederick Taylor* : Analyse technique des flux réduisant de 15% le temps de chantier requis.
  - *John Maynard Keynes* : Injecte un multiplicateur d'investissement (+50 € d'enveloppe budgétaire supplémentaire).

### Phase 2 : Vote Déterministe (Jours 11 à 13)
Exécution de la formule de scrutin pondéré, dépouillement transparent et classement des projets.

### Phase 3 : Allocation & Proclamation (Jours 14 à 15)
- Sélection des lauréats sous contrainte d'enveloppe.
- Proclamation officielle : notification systémique dans le journal d'événements (`GameEvent`).
- Réaction des cohortes : satisfaction $+15$ si leur projet gagne, déception $-8$ s'il est rejeté.
- Détermination de la doctrine triomphante gouvernant l'orientation urbaine de l'année.

### Phase 4 : Réalisation Physique (Jours 16 à 30)
Transformation des projets lauréats en chantiers de rénovation concrets (`WorksiteState`), progression des travaux sur le terrain et déblocage de nouveaux aménagements.

---

## 5. Système de Rénovation et Transformation de la Ville

### 5.1 Les 5 Typologies de Chantiers Citoyens
1. **Façades (`facades`)** : Rénovation du crépi chaud, moulures en calcaire, rejointoiement à la chaux et fresques murales mémorielles.
2. **Toits Végétalisés (`toits_vegetalises`)** : Aménagement de terrasses maraîchères suspendues, bacs potagers en bois de réemploi et ruches urbaines.
3. **Friches Industrielles (`friches`)** : Remplacement des verrières d'atelier, sécurisation des machines, installation de fablabs et cantines solidaires.
4. **Voies Piétonnes (`voies_pietonnes`)** : Remplacement des ornières par des pavés doux en granit, dépose des bordures dangereuses, rampes vélos-cargos et triporteurs.
5. **Aménagement Fluvial (`canal`)** : Consolidation des berges en pierre moussue, pontons associatifs en bois et anneaux d'amarrage des péniches.

### 5.2 Modèle Déterministe d'Avancement Quotidien
L'avancement quotidien d'un chantier dépend de l'efficacité d'approvisionnement en matériaux, du nombre de bénévoles et des compétences artisanales appliquées :

$$\eta_{\text{matériaux}} = \max\left(0.20, \min\left(1.0, \frac{\text{materialsSupplied}}{\text{materialsNeeded}}\right)\right)$$

$$\text{BoniArtisanat} = \sum_{\text{compétence}} (\text{niveau} \times 3.0)$$

$$\text{HeuresBénévoles} = \text{volunteersActive} \times 4.0 \times \left(1.0 + \frac{\text{district.civicEngagement}}{200.0}\right)$$

$$\text{HeuresUtilesJour} = \left(\text{HeuresBénévoles} + \text{BoniArtisanat}\right) \times \eta_{\text{matériaux}}$$

$$\Delta \text{ProgressPct} = \frac{\text{HeuresUtilesJour}}{\text{workHoursNeeded}} \times 100$$

### 5.3 Propriétés Remarquables de l'Équation
- **Résilience citoyenne** : Même en rupture totale de matériaux approvisionnés, les citoyens parviennent à avancer à 20% de vitesse grâce au réemploi et à la débrouille locale ($\eta_{\text{matériaux}} \ge 0.20$).
- **Synergie civique** : Plus l'engagement civique du quartier est élevé, plus le travail des bénévoles est productif (+50% d'efficacité à 100 d'engagement civique).
- **Rôle des artisans** : Un artisan qualifié (niveau 2 en Technique ou Organisation) équivaut à près de deux bénévoles supplémentaires à plein temps.

---

## 6. Déverrouillage Progressif des 6 Quartiers de Val-Ferrand

```
                     ┌───────────────────────────────┐
                     │ 1. Place des Roses & Centre   │  (Départ : Déverrouillé)
                     └───────────────┬───────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│ 2. Le Canal &    │       │ 3. Les Hauts de  │        │ 4. Bassin        │
│    Les Docks     │       │    Val-Ferrand   │        │    Industriel    │
│  (Rép: 50, €: 80)│       │  (Rép: 55, €:100)│        │  (Tech 2, €:140) │
└────────┬─────────┘       └──────────────────┘        └────────┬─────────┘
         │                                                      │
         └───────────────────────────┬──────────────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │ 5. Souterrains & Caves        │  (Recherche 2, Rép: 60)
                     └───────────────┬───────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │ 6. Ligne de Tramway / TER     │  (Rép: 75, Confiance: 70)
                     └───────────────────────────────┘
```

### Table des Exigences de Déverrouillage

| Quartier | Identifiant | Description | Exigences Civiques & Métriques | Coût Municipal |
|---|---|---|---|---|
| **Place des Roses** | `roses` | Cœur historique, école, épicerie Bertin | Aucune (Ouvert dès le Jour 1) | 0 € |
| **Le Canal & Docks** | `docks` | Port fluvial, péniches, contrebande café | Réputation $\ge 50$, Confiance $\ge 55$, Vitalité $\ge 45$ | 80 € |
| **Les Hauts** | `hauts` | Cité en terrasse, radio pirate, panoramas | Réputation $\ge 55$, Confiance $\ge 60$, Vitalité $\ge 50$ | 100 € |
| **Bassin Industriel** | `bassin` | Usines de briques, fablab Taret, forge | Réputation $\ge 65$, Confiance $\ge 60$, Technique niveau 2 | 140 € |
| **Souterrains & Caves** | `caves` | Passages secrets, marché clandestin | Réputation $\ge 60$, Confiance $\ge 65$, Recherche niveau 2 | 90 € |
| **Ligne de Tramway** | `tramway` | Connexion métropole, navetteurs, fret doux | Réputation $\ge 75$, Confiance $\ge 70$, Vitalité $\ge 60$ | 180 € |

---

## 7. Contrat Architectural & Fonctions de Consultation Pures

Conformément à la charte `neurapolis-architecte` :
1. **Couche Core (`src/core/governance_types.ts`)** : 100% sérialisable en JSON, zéro dépendance DOM/Canvas, zéro fonction stockée dans l'état.
2. **Couche Simulation (`src/simulation/`)** : Fonctions pures déterministes, mutateurs d'état explicites, notifications d'événements documentant les causes (`CauseFactor`).
3. **Couche Présentation (Lecture Seule)** : L'UI Canvas et DOM interroge la simulation via les fonctions de requêtes pures sans jamais modifier l'état interne :
   - `getCityAestheticOverview(state)` : Retourne la palette dominante, les drapeaux graphiques actifs, le nombre de quartiers ouverts et la synthèse architecturale.
   - `getDistrictRenovationStatus(state, districtId)` : Synthèse d'avancement d'un quartier donné.
   - `getPendingAndActiveWorksites(state)` & `getCompletedRenovations(state)` : Filtrage des chantiers.
   - `getCohortOpinions(state)` : Rapports de satisfaction et aspirations des 4 cohortes citoyennes.
   - `getGovernanceBudgetSummary(state)` : Synthèse du cycle budgétaire courant et taux de participation électorale.
   - `getCityGlobalMetrics(state)` : Indicateurs globaux (moral collectif, cohésion sociale, transition écologique, attractivité).

---

## 8. Validation et Couverture des Tests

La suite de tests unitaires `neurapolis/tests/city_governance.test.ts` garantit :
- **Sérialisation JSON sans perte** de l'état complet.
- **Déterminisme strict du PRNG Mulberry32** (graine reproductible à 100%).
- **Respect strict des contraintes budgétaires** (algorithme Knapsack).
- **Comportement nominal, goulots d'étranglement et cas limites** (pénurie de matériaux, zéro bénévole, sur-mobilisation).
- **Invariants mathématiques stricts** : toutes les jauges de satisfaction et métriques restent bornées dans $[0, 100]$, et les taux de mobilisation dans $[0.0, 1.0]$.
