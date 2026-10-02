# PROMPT MAÎTRE 1000X : SPECIFICATION ET FEUILLE DE ROUTE GIGANTESQUE POUR NEURAPOLIS

> **Ce document constitue le cahier des charges ultime pour NEURAPOLIS.**
> La version actuelle (moteur 2.5D, 22 fantômes, 8 PNJ, stand de goûters, 190+ tests) représente exactement **1/1000e** de la vision finale décrite ci-dessous.

---

## 🌌 VUE D'ENSEMBLE DU PROJET (ÉCHELLE 1000X)

NEURAPOLIS est une simulation de vie systémique, économique, philosophique et politique à grande échelle se déroulant dans la métropole fictive de Val-Ferrand (12 quartiers interconnectés). Le joueur incarne Camille, de ses 12 ans à ses 80 ans (68 années simulées tick par tick), influençant la ville de la cour de récréation jusqu'à la mairie et la présidence de coopératives internationales.

---

## 🏛️ LES 5 PILIERS SYSTÉMIQUES MAJEURS (1000X)

### PILIER 1 : MOTEUR 3D HYBRIDE & GÉNÉRATEUR URBAIN PROCÉDURAL
1. **Rendu 3D Volumétrique WebGL/WebGPU** :
   - Remplacement progressif du Canvas 2D par une scène 3D complète (bâtiments modulaires, routes, véhicules, foule, cycle jour/nuit dynamique, saisons, météo volumétrique).
   - 12 Quartiers entièrement modélisés : Cité des Roses, Friche Taret, Centre-Ville, Zone Industrielle, Quartier Financier, Campus Universitaire, Port Fluvial, etc.
   - Intérieurs de bâtiments entièrement explorables sans écran de chargement (1000+ lieux interactifs : boutiques, appartements, usines, mairie, écoles).

2. **Physique et Climatologie Systémique** :
   - Simulation de température, pluviométrie, qualité de l'air, consommation énergétique des bâtiments et empreinte carbone.

---

### PILIER 2 : SIMULATION DE POPULATION BDI (1000 PNJ AUTONOMES)
1. **Moteur BDI (Belief-Desire-Intention)** :
   - 1 000 citoyens uniques dotés d'une mémoire épisodique, de réseaux sociaux (arbre généalogique, amis, rivaux, collègues) et de routines journalières 24h/24.
   - Modèle de santé complète (fatigue, faim, stress, maladie, vieillissement 12→80 ans, retraite, décès et transmission d'héritage).

2. **Économie des Ménages et Emploi** :
   - Chaque PNJ perçoit un salaire, paie un loyer, fait ses courses, investit ou tombe au chômage selon la conjoncture macroéconomique.

---

### PILIER 3 : MOTEUR ÉCONOMIQUE & RIVALITÉ CORPORATIVE COMPLÈTE
1. **Graphe Économique et Chaînes de Valeur** :
   - Simulation micro et macro-économique en temps réel : matières premières → transformation industrielle → logistique → distribution de détail.
   - Système bancaire, taux d'intérêt, marchés financiers, bourses locales, inflation et monnaies complémentaires locales.

2. **Concurrence & Cartels Réactifs** :
   - 50 entreprises rivales contrôlées par des IA d'entrepreneurs (guerre des prix, OPA, rachats, campagnes marketing, lobbying municipal).
   - Possibilité pour le joueur d'ouvrir n'importe quel type de commerce (épicerie, coopérative textile, banque éthique, journal indépendant, ferme urbaine).

---

### PILIER 4 : CONSEIL COGNITIF & DIALECTIQUE DES 100 FANTÔMES
1. **Roster Étendu de 100 Penseurs et Philosophes** :
   - Penseurs économiques, politiques, écologiques et sociologiques (de Platon, Aristote, Spinoza à Piketty, Graeber, Fraser).
   - Système de dialogue dynamique propulsé par matrice d'affinité, loyauté, trahison, et fusions composites (plus de 500 fusions d'idées possibles).

2. **Superposition Probabiliste Avancée** :
   - Prise de décision des fantômes influencée par la physique quantique de l'opinion (superposition de tempéraments, états émotionnels complexes, hystérésis de loyauté).

---

### PILIER 5 : DYNAMIQUE POLITIQUE, LOIS ET LÉGISLATION MUNICIPALE
1. **Gouvernance et Élections** :
   - Conseils de quartier, assemblées citoyennes, élections municipales et référendums d'initiative citoyenne.
   - Rédaction et vote de lois locales (tarification de l'eau, zonage commercial, salaire minimum municipal, interdiction des pesticides, régie publique).

2. **Génération d'Héritage et Conclusion de Vie** :
   - Transmission du patrimoine, formation des générations futures, impact du joueur sur la mémoire historique de Val-Ferrand.

---

## 📊 COMPARATIF : ÉTAT ACTUEL vs VISION 1000X

| Élément | État Actuel (1/1000) | Vision 1000X Finale |
|---|---|---|
| **Rendu** | Canvas 2D/2.5D + Bac à Sable 3D | Moteur 3D WebGPU temps réel, 12 quartiers |
| **PNJ** | 8 PNJ fixes | 1 000 citoyens autonomes BDI avec mémoire |
| **Fantômes** | 22 fantômes, 1 fusion | 100 fantômes, 500+ fusions de doctrines |
| **Projets** | Stand des Roses (boissons/goûters) | Tout secteur économique, banque, journal, ferme |
| **Économie** | Parts de marché Drive / Collège | Graphe macroéconomique complet + Bourse |
| **Campagne** | Chapitre 1 à 3 (12 à 14 ans) | 68 années de vie complète (12 à 80 ans) |
| **Politique** | Décisions de conseil local | Référendums, lois municipales, budget de la ville |

---

## 🏁 INSTRUCTIONS POUR LES AGENTS ET SUITE DES TRAVAUX
Toute session de développement travaillant sur ce projet doit piocher un sous-système dans ce document, respecter les règles d'architecture (`core` ← `simulation` ← `presentation`), écrire des tests unitaires déterministes, et mettre à jour le registre `.zcode/coordination/BOARD.md`.
