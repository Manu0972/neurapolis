# Glossaire du monde (Niveaux N0 à N4)

Ce glossaire fixe le vocabulaire commun et canonique utilisé à travers l'architecture multi-échelle de la simulation du monde (issues #25 et #28 à #33).

| Terme | Définition en une phrase | Fichier ou issue de référence |
| --- | --- | --- |
| **N0 Monde** | Niveau macroscopique global régissant la simulation démographique globale, les échanges internationaux et les événements planétaires. | Issue #28 |
| **N1 Pays** | Niveau intermédiaire agrégeant les indicateurs économiques, politiques et démographiques par nation. | Issue #28, Issue #29 |
| **N2 Villes / Cohortes** | Niveau méso-simulé représentant les métriques locales, les cohortes de population et le tissu économique urbain. | Issue #28, Issue #30 |
| **N3 Agents proches** | Niveau micro-simulé gérant en temps réel les PNJ physiquement proches du joueur avec emploi du temps et trajets. | Issue #28, Issue #31 |
| **N4 Individus à la demande** | Niveau éphémère générant la biographie et les caractéristiques d'un PNJ uniquement lorsqu'il est consulté ou qu'il interagit. | Issue #28, Issue #32 |
| **Graine hiérarchique** | Valeur numérique dérivée de manière déterministe depuis la graine racine pour garantir la reproductibilité des entités à tous les niveaux. | `src/core/rng.ts`, Issue #28 |
| **Pas annuel** | Fréquence d'exécution de la boucle de simulation macroscopique mettant à jour les données des niveaux N0, N1 et N2. | Issue #28, Issue #29 |
| **Cohorte** | Groupe d'habitants regroupés par tranches d'âge et critères socio-économiques au niveau N2 sans instancier d'agents individuels. | Issue #30 |
| **Invariant de conservation** | Invariant garantissant la stricte conservation des grandeurs globales comme la population totale et la masse monétaire lors des transitions d'échelle. | Issue #28, Issue #29 |
| **Budget mémoire** | Plafond maximal de ressources mémoire allouées à la simulation pour garantir l'exécution sans fuite ni surconsommation de RAM. | Issue #28, Issue #33 |
| **Biographie** | Historique individuel complet généré de manière procédurale et déterministe lors de la consultation d'un agent N4. | Issue #32 |
| **Niveau de détail (LOD)** | Niveau de précision de la simulation et de la représentation graphique adapté à la distance physique ou à l'importance pour le joueur. | Issue #28, Issue #33 |
| **PRNG déterministe** | Algorithme de génération pseudo-aléatoire basé sur Mulberry32 produisant des séquences strictement identiques pour une graine donnée. | `src/core/rng.ts` |
| **Transition d'échelle** | Processus de passage d'une donnée ou d'une entité d'un niveau d'abstraction à un autre tout en préservant la cohérence des invariants. | Issue #28, Issue #33 |
| **Matrice commerciale** | Représentation synthétique des flux d'import-export bilatéraux équilibrés à l'échelle des nations N1. | Issue #29 |
| **Rencontre réciproque** | Interaction bilatérale calculée de manière déterministe entre deux PNJ sans stockage persistant d'un graphe global de relations. | Issue #32 |
| **Routine journalière** | Séquence d'activités et de déplacements horaire suivie par les agents N3 au cours d'une journée de jeu. | Issue #31 |
| **Réconciliation démographique** | Processus assurant la cohérence entre les événements individuels de bas niveau et les agrégats macro-démographiques. | Issue #29, Issue #30 |
