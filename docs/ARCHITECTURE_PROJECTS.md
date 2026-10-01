# Architecture des Projets Économiques de NEURAPOLIS

## 1. Cartographie du modèle existant : Stand des Roses
- **Objet** : Commerce B2C récurrent (vente de goûters/boissons).
- **Entrée** : `ProjectState` dans `WorldState.project`.
- **Boucle de jeu** :
  - **Stock** : Achats groupés de stock uniforme (15 € pour 20 unités).
  - **Prix & Demande** : Prix unitaire réglable (0.50 € à 2.00 €), demande calculée selon prix, météo, réputation et parts de marché face aux rivaux.
  - **Sessions de vente** : Sessions de 1 heure sur la place ou au collège (`runSalesSession`).
  - **Équipe** : Recrutement de Noah et Lina (gate : `communication` ≥ 2).
  - **Livre de comptes (Ledger)** : `project.ledger` avec invariant strict `Σ(ledger.amount) === project.balance`.
  - **Répartition hebdomadaire** : Choix de philosophie (Égalité / Équité / Incitation) modifiant les vecteurs relationnels 4D.

## 2. Architecture du second projet : Atelier de Réparation de la Friche
- **Objet** : Service B2C/B2B personnalisé de réparation et reconditionnement d'objets du quotidien.
- **Entrée** : `WorkshopState` dans `WorldState.workshop`.
- **Boucle de jeu distincte** :
  - **Approvisionnement & Double Stock** :
    - Pièces détachées neuves (`partsStock`) achetées auprès de fournisseurs (15 € pour 10 pièces).
    - Matériaux de récupération (`salvageStock`) collectés directement à la Friche (coût en temps et fatigue, boosté par la compétence `technique`).
  - **Carnet de Commandes (Orders Queue)** :
    - Au lieu de sessions de vente de masse instantanées, l'atelier gère un carnet de commandes individualisées émanant des habitants de Val-Ferrand.
    - Chaque commande possède des besoins en pièces, un nombre d'unités de travail (ticks de 20 min), une exigence minimale en compétence `technique`, une récompense en € et une date limite (`deadlineDay`).
  - **Travail & Compétences** :
    - Effectuer des sessions de réparation (`workOnOrder`) consomme des pièces et du matériel, fait avancer le travail requis, augmente la fatigue et fait progresser l'XP en `technique`.
  - **Équipe** :
    - Recrutement de Karim (passionné de mécanique, gate : `technique` ≥ 1) et Yasmine (organisation).
  - **Livre de comptes & Trésorerie** :
    - `workshop.ledger` dédié avec invariant strict `Σ(ledger.amount) === workshop.balance`.
  - **Risques & Impact Territoire** :
    - Dépassement de date limite : pénalité de réputation, annulation ou indemnité.
    - Pénurie de pièces : blocage des réparations jusqu'au réapprovisionnement.
    - Impact quartier : réparer des objets augmente la vitalité et la confiance du quartier tout en développant l'économie circulaire.
