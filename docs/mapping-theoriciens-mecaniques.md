# NEURAPOLIS — Mapping théoriciens ↔ mécaniques

Document vivant du **Documentaliste**. Règle unique : **chaque entrée nomme une conséquence JOYABLE** — une mécanique qui change une partie, pas un résumé de doctrine.

Contrat de référence : `PRODUCTION-PLAN.md` §4 et §6 · Fiches : `src/data/ghosts/` (`registry.ts`, `gen1-b.ts`, `gen1-c.ts`, `gen2-a.ts`, `gen2-b.ts`) · Type `GhostDef` : `src/core/types.ts`.

## Légende

- **Fantôme** : la voix qui incarne la tradition (id stable, dates exactes).
- **Mécanique fondatrice** : la mécanique que la pensée fonde EN JEU — la conséquence jouable est en fin de cellule.
- **Dilemme** : le choix du joueur que la pensée rend plus tranchant.
- **Critique interne** : le fantôme du roster qui porte la contradiction de la tradition.
- **Ancrage** : `fiche` = issue des fiches du registre ; `§6` = déclencheur du contrat, mécanique en proposition à valider par `neurapolis-ghostwriter` (voix) et `neurapolis-systemiste` (chiffres) ; `fusion` = composite du contrat.

> **Signalement de fidélité (Documentaliste)** : les fantômes cohabitent dans l'esprit du joueur hors du temps historique. Les « critiques internes » sont des oppositions doctrinales jouées ; certaines sont anachroniques (ex. Marx critiquant Hayek, né après sa mort). C'est un choix de design assumé et signalé ici — jamais présenté comme un fait historique.

## Génération 1 (12 fantômes)

| Fantôme | Tradition | Mécanique fondatrice | Dilemme | Critique interne | Ancrage |
|---|---|---|---|---|---|
| smith — Adam Smith (1723-1790) | École classique écossaise | Actions marchandes — fixer un prix, acheter un stock, fourchette du « prix naturel » lisible. Conséquence : la caisse se remplit au bon prix, la demande suit `f(prix, réputation, jour, météo)` (M5) | Prix qui maximise vs prix qui protège : vendre cher à l'acheteur pressé ou garder un prix juste pour les habitués | **marx** — « le travail derrière l'étiquette » (rivalité fiche, registry.ts) | fiche |
| marx — Karl Marx (1818-1883) | Critique de l'économie politique | Partage du surplus, répartition par besoin, marges des fournisseurs révélées. Conséquence : compteur `solidarite` (M5) +, relations 4D rééquilibrées | Tout partager (la solidarité qui assèche la caisse) vs retenir pour réinvestir — son propre angle mort : la réforme graduelle | **hayek** — sans prix libre, pas de calcul : la répartition par besoin est aveugle (rivalité fiche ; anachronisme signalé) | fiche |
| ostrom — Elinor Ostrom (1933-2012, Nobel 2009) | École des communs (Bloomington) | Règles du collectif écrites par le groupe (rules.collectif). Conséquence : anti-passager clandestin — la triche interne baisse sans surveillance (signature 80) | Règle choisie par tous vs décision rapide : le consensus permanent paralyse (blocage fiche) | **hobbes** — « les pactes sans épée ne sont que des paroles » (rivalité fiche) | fiche |
| hobbes — Thomas Hobbes (1588-1679) | Contractualisme absolutiste | Discipline, rôles, sanctions ; Contrat de Sécurité (M6). Conséquence : conflits internes éteints avant d'éclater (signature 80) ; contrat : rendement +20 % | Paix vs liberté : signer le Contrat (+20 % rendement, mais amitié −2/semaine, sortie quasi impossible) | **locke** — la liberté avant la peur ; nul pouvoir sans consentement (rivalité fiche) | fiche |
| locke — John Locke (1632-1704) | Libéralisme classique, droit naturel | Répartition « équité » — chacun gagne selon son travail fourni (M5). Conséquence : respect + pour les gros vendeurs, rivalité si perçue comme injuste | « C'est à moi, j'ai travaillé » : le fruit revient-il au producteur seul, ou à qui a tenu la caisse ? | **rousseau** — la propriété est l'origine de l'inégalité (Discours de 1755) | §6 (proposition) |
| rousseau — Jean-Jacques Rousseau (1712-1778) | Contractualisme démocratique, volonté générale | Arbitrer un conflit (gate négociation≥2, M3) et délibération du groupe. Conséquence : conflit résolu sans stress, justice perçue | Volonté générale vs volonté de tous : suivre le vote qui lèse un membre loyal, ou protéger la minorité | **machiavel** — le peuple n'a pas de volonté générale, il a des intérêts à organiser | §6 (proposition) |
| ricardo — David Ricardo (1772-1823) | École classique anglaise, avantage comparatif | Spécialisation des rôles dans l'équipe du stand. Conséquence : rendement + quand chacun fait ce où il excelle, polyvalence − | Spécialiser Noah à la vente (il excelle) vs le laisser apprendre de tout (il grandit) | **marx** — Ricardo a vu le travail comme valeur et s'est arrêté avant de demander qui garde la différence | §6 (proposition) |
| weber — Max Weber (1864-1920) | Sociologie compréhensive, organisations | Procédures écrites du stand (routines, rôles formalisés). Conséquence : erreurs −, chaque tâche a un mode d'emploi — coût : temps de paperasse | La procédure qui protège devient la cage qui écrase : tout formaliser vs faire confiance aux gens | **graeber** — la règle absurde que plus personne ne peut justifier (The Utopia of Rules) | §6 (proposition) |
| keynes — John Maynard Keynes (1883-1946) | Keynésianisme | Relance de la demande : investir en période creuse (publicité, stock promo). Conséquence : une semaine de perte se rattrape — mais la caisse est mise à sec d'abord | Semaine de perte : investir le dernier argent pour relancer, ou épargner et espérer | **hayek** — la relance artificielle fausse les prix et la rechute est pire (le grand débat du XXe siècle) | §6 (proposition) |
| hayek — Friedrich Hayek (1899-1992, Nobel 1974) | École autrichienne, ordre spontané | Prix libres : le joueur laisse le marché découvrir le prix par essais. Conséquence : le prix d'équilibre émerge ; une règle imposée échoue et le lui apprend (`reglesEchouees`) | Laisser le prix monter (les gens paient) vs plafonner pour protéger les habitués | **marx** — l'« ordre spontané » est l'anarchie du marché qui broie les plus faibles (rivalité fiche ; anachronisme signalé) | §6 (proposition) |
| bourdieu — Pierre Bourdieu (1930-2002) | Sociologie critique, capital culturel | Réputation sociale et codes du quartier. Conséquence : réputation≥70 ouvre le stage de Samir (M5) ; un mot mal placé face à un PNJ ferme des portes | Adopter les codes (bien parler aux adultes) pour ouvrir des portes vs rester soi-même au risque de stagner | **locke** — on ne naît pas classé : le travail et le mérite font la place | §6 (proposition) |
| machiavel — Nicolas Machiavel (1469-1527) | Réalisme politique | Influence et persuasion : convaincre un PNJ de rejoindre le projet, garder l'apparence, alliances opportunistes. Conséquence : Influence + — mais rivalité sourde si la trahison se découvre | Mentir pour décrocher un accord important vs dire la vérité et perdre l'accord | **rousseau** — un prince qui manipule gouverne des sujets, pas des citoyens | §6 (proposition) |

## Génération 2 (10 fantômes)

| Fantôme | Tradition | Mécanique fondatrice | Dilemme | Critique interne | Ancrage |
|---|---|---|---|---|---|
| taylor — Frederick W. Taylor (1856-1915) | Organisation scientifique du travail | Cadence et chronométrage. Conséquence : rendement +, temps des actions − ; poussée trop loin, stress de l'équipe + | Rendement vs sens : jusqu'où pousser l'équipe avant qu'elle ne tienne plus (l'angle mort de sa fiche) | **marx** — le chronomètre ne paie pas la sueur (rivalité fiche) ; **dejours** double la critique s'il est actif | fiche |
| ohno — Taiichi Ohno (1912-1990) | Système de production Toyota (lean) | Juste-à-temps : acheter le stock au plus juste avant chaque session. Conséquence : invendus − (échec « stock invendu », M5), trésorerie fluide | Stock minimal (zéro invendu) vs stock de sécurité (jamais de rupture quand la demande explose) | **dejours** — le flux tendu presse les hommes autant que les stocks | §6 (proposition) |
| dejours — Christophe Dejours (né 1949) | Psychodynamique du travail | Écoute de l'équipe : pauses, reconnaissance, lecture du stress des coéquipiers. Conséquence : stress −, départs évités (rivalité>60 = départ d'un membre, M5) | La pause pour l'équipe vs la session de vente perdue : le soin coûte du chiffre | **taylor** — à force d'écouter la souffrance, on ne vend plus rien | §6 (proposition) |
| graeber — David Graeber (1961-2020) | Anthropologie anarchiste | Contester la règle absurde : action « questionner la corvée ». Conséquence : certaines corvées sautent — risque de sanction encouru | Accomplir la corvée absurde (moral −) vs la contester (sanction possible) | **weber** — la règle a une fonction que tu ne vois pas encore | §6 (proposition) |
| zuboff — Shoshana Zuboff (née 1951) | Capitalisme de surveillance | Données du stand : livre de comptes et prévision de demande (comptabilité≥2, M3) ; choix de protéger ou monnayer les données. Conséquence : prévisions précises vs risque d'exploitation (`donneesExploitees`) | Vendre les données du stand (argent immédiat) vs protéger ses habitués | **ostrom** — les données sont un commun à gouverner, pas un butin à extraire | §6 (proposition) |
| stiegler — Bernard Stiegler (1952-2020) | Philosophie de la technique, pharmacologie | Économie de l'attention : chaque action coûte du temps ; se déconnecter des distractions. Conséquence : temps récupéré, actions réussies + | Le téléphone : outil de gestion (alertes de stock) vs source de distraction (temps perdu) — le pharmakon | **simon** — l'attention est une ressource bornée : gère-la, ne la moralise pas | §6 (proposition) |
| rosa — Hartmut Rosa (né 1965) | Théorie de l'accélération, résonance | Rythme de la semaine : refuser des activités, préserver le mercredi après-midi. Conséquence : stress −, relations profondes + | Semaine pleine (plus de gains) vs semaine allégée (sommeil, amitiés) | **keynes** — la productivité devait acheter du temps libre (« 15 heures par semaine », essai de 1930) | §6 (proposition) |
| raworth — Kate Raworth (née 1970) | Économie écologique (donut) | Choix écologiques : stock durable plus cher vs standard. Conséquence : réputation du quartier +, marge − ; le stand a un plancher social et un plafond écologique | Stock durable cher vs stock standard pas cher — l'écologie qui coûte | **smith** — sans prix, la vertu verte est un luxe de riches | §6 (proposition) |
| illich — Ivan Illich (1926-2002) | Critique du développement industriel, convivialité | Outils conviviaux : fabriquer soi-même ses outils simples (présentoir, caisse, affiche). Conséquence : autonomie, coûts −, temps + | L'outil simple que tu contrôles vs l'outil puissant qui te contrôle | **ohno** — l'outil standard est la base de toute amélioration ; l'outil « convivial » est du gaspillage | §6 (proposition) |
| simon — Herbert Simon (1916-2001, Nobel 1978) | Rationalité limitée | Prévision bornée : prévoir la demande avec une marge d'erreur assumée, décider avec l'information qu'on a. Conséquence : surstock − ; une prévision ratée devient une leçon, pas une honte | Agir avec l'information qu'on a vs attendre d'en savoir plus (et rater la session) | **taylor** — « bornée » = paresse déguisée : cherche le meilleur, pas le suffisant | §6 (proposition) |

## Génération 3 — composites (1 fusion signée du contrat)

| Fantôme | Tradition | Mécanique fondatrice | Dilemme | Critique interne | Ancrage |
|---|---|---|---|---|---|
| marche_des_communs — Le Marché des Communs (smith + ostrom) | Composite : marché + communs | Coopérative pérenne. Conséquence : ventes du week-end sans présence, abonnement des habitués (registry.ts FUSIONS) | Que perd-on en fusionnant : les règles du commun survivent-elles à la pression des prix ? | **hobbes** — l'ordre sans garantie finira mal (rival des deux voix, fiches) | fusion |

### Autres composites du §6 (fiches non livrées — cartographiés à leur livraison)

`travail_vivant` (marx+dejours) · `instabilite` (keynes+Minsky) · `cage_disciplinaire` (weber+foucault) · `ordre_sans_maitre` (hayek+ostrom) · `le_flux` (ohno+smith) · `fantome-miroir`.

## Points en suspens (signalés à l'équipe)

1. **Minsky et Foucault** apparaissent dans les composites G3 du §6 mais ne figurent pas aux rosters G1/G2 — décision à journaliser dans `docs/DECISIONS.md` avant toute fiche.
2. `registry.ts` : le commentaire de `GEN1_RESTANTS` dit « les 7 autres » mais liste 8 ids — coquille à corriger (ghostwriter/architecte).
3. Les 8 entrées G1 et 9 entrées G2 en ancrage « §6 (proposition) » attendent : fiches complètes par le ghostwriter (voix, failles, arcs) et chiffrage des conséquences par le systémiste (règle « aucune statistique sans conséquence »).
