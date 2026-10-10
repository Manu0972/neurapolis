# Rapport d'Analyse de Cohérence des Trajets PNJ

**Date d'exécution :** 2026-10-10
**Périmètre de test :** 200 graines, 60 jours de jeu (1,728,000 ticks simulés)
**Durée totale d'exécution :** 113.37 s (566.8 ms / graine)

## Synthèse du contrôle spatio-temporel

- **Bloquantes :** 0
- **Gênantes :** 0
- **Cosmétiques :** 0
- **Total anomalies détectées :** 0

---

## Tableau détaillé des incohérences détectées

| Gravité | Graine | Jour / Heure | PNJ | Lieu | Description du problème | Commande de reproduction |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| Aucune | - | - | Aucun | - | Aucun problème spatio-temporel détecté ! | - |

---

## Recommandations & Analyse des causes

1. **Collège des Roses & Mercredi après-midi / Week-ends :**
   - Ajuster la sélection des créneaux dans `slotFor()` (`src/simulation/npc.ts`) pour libérer les élèves et enseignants après 13h30 le mercredi.
   - Supprimer le drapeau `weekends: true` sur le créneau de travail de Mme Moreau au collège.

2. **Accès aux lieux fermés :**
   - L'ouverture des lieux est centralisée dans `src/simulation/places.ts` (`isPlaceOpen`).
