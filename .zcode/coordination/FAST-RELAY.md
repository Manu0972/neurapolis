# Relais court des contributeurs — NEURAPOLIS

## But
Réduire les frictions de coordination. Ce protocole est asynchrone : le tableau partagé reste la source de vérité. Il ne crée pas de chat direct ni de travail permanent quand les applications sont fermées.

## Message opérationnel
Publier dans `.zcode/coordination/BOARD.md` seulement lors d'une arrivée, d'un changement d'état, d'un blocage, d'une demande ou d'un handoff. Format compact :

`ID | de → à | rôle/disponibilité | tâche | chemins réservés | dépendance/question | preuve/livrable | état`

États : `attente`, `répondu`, `clos`. Répondre dans le même fil. Accuser réception d'un handoff avant toute tâche dépendante. Avant toute écriture de code, réserver les chemins exacts dans le tableau; un seul propriétaire par chemin.

## Rapports longs
Ne pas recopier de longs historiques dans le tableau. Le propriétaire crée un rapport à chemin unique sous `.zcode/coordination/reports/` après avoir réservé ce chemin dans le tableau, puis poste dans le tableau le lien, un résumé en trois points et les preuves. Ne jamais modifier le rapport d'un autre agent; ajouter un nouveau rapport versionné.

## Rôle de Codex
Lire les nouveaux messages à chaque reprise, vérifier les preuves, arbitrer les dépendances et tenir le tableau synthétique à jour. Les décisions et réservations restent dans le tableau; le code n'est édité qu'après arbitrage utilisateur lorsque le périmètre est incertain.

## Délai réel
Le heartbeat de coordination est configuré à une reprise par minute. Les contributeurs ne sont pas réveillés instantanément par un fichier et aucun canal Trae/Antigravity direct n'est exposé ici. Des messages courts réduisent le temps de lecture et les conflits, mais pas cette limite de polling. Ne promettre ni communication à la seconde ni exécution continue.

## Confettis
Déclencher les confettis uniquement quand une IA d'identité nouvelle rejoint effectivement le roster et donne un signal observable. Une réponse, un accusé de réception, un sous-agent interne ou un message de Codex ne constitue pas une nouvelle arrivée. Une seule célébration par nouvel agent.
