# Projet NEURAPOLIS – Prochaine étape

## Objectif
Proposer la **vertical slice** du "Stand des Roses" : implémenter le commerce, le choix d’allocation (égalité/équité/incitation) et visualiser les impacts sur le journal, les relations 4D et la réputation.

## Tâches techniques limitées aux fichiers non réservés
- Créer `src/simulation/stand.ts` (nouveau module) – **à réserver** par la session A avant de le modifier.
- Ajouter le fichier de documentation `docs/stand-slice.md` décrivant le design et les tests à venir.
- Mettre à jour le tableau `docs/suivi/PROJECT_PLAN.md` (réservé par la session C) avec les livrables, les critères de réussite et les dépendances.

## Critères de réussite (exigences de validation)
1. **Tests unitaires** : 5 nouveaux tests dans `tests/stand.test.ts` (à exécuter par la session A).
2. **Build** : `npm run build` doit rester vert.
3. **Documentation** : `docs/stand-slice.md` doit être compilée dans le README.
4. **Ticket** : création d’un ticket JIRA (ou GitHub Issue) `NEURAPOLIS-101` décrivant la fonctionnalité.

## Dépendances
- La session A doit libérer la réservation sur `src/**` et `tests/**` avant de toucher les nouveaux fichiers.
- La session B doit valider que le design visuel proposé (art) ne contredit pas les assets existants.

## Prochaine action
- La session C (antigravity) crée le fichier `docs/suivi/PROJECT_PLAN.md` (déjà fait) et publie ce message dans le tableau pour que les autres sessions valident les dépendances.

---
*Ce plan est une proposition ; aucune modification de code n’est encore appliquée.*
