# Jouer à plusieurs à NEURAPOLIS (réseau local)

De 2 à 4 joueurs dans la même ville de Val-Ferrand. Chacun vit sa propre vie (famille, collège,
affaires), mais vous vous croisez dans les rues (avatar et nom au-dessus de la tête), vos commerces
se font concurrence, et vous pouvez **vous associer… ou vous saboter**.

Il suffit d'être sur **le même réseau** (même box, même Wi-Fi). Aucun compte, aucun VPN, aucun
service extérieur. (Un VPN maillé du type Meshnet marche aussi, mais il n'est pas nécessaire.)

## Lancer une partie

**L'hôte** (un seul ordinateur fait serveur), au choix :

- **Application NEURAPOLIS** : 📡 Multijoueur → **Héberger sur cet ordinateur**. L'adresse à donner
  s'affiche (par exemple `192.168.1.20:8765`).
- **Navigateur** : double-clic sur `jouer-en-lan.bat` (ou `npm run lan`). La première fois, il
  construit le jeu s'il ne l'est pas. La fenêtre affiche l'adresse à donner
  (`http://192.168.1.20:8765`). Ouvre `http://localhost:8765`, crée ou charge ta partie, puis
  📡 Multijoueur → choisis les règles → **Ouvrir la partie sur ce serveur**.
- Windows peut demander d'autoriser Node.js (ou NEURAPOLIS) : accepte pour les **réseaux privés**.

**Les amis** ouvrent l'adresse de l'hôte dans leur navigateur (`http://192.168.1.20:8765`), créent
ou chargent leur partie, puis 📡 Multijoueur → **Rejoindre** (adresse vide : c'est ce serveur).
Depuis l'application ou le fichier `NEURAPOLIS.html`, ils tapent l'adresse `192.168.1.20:8765`.

Le premier connecté est **l'hôte** : son horloge fait foi. Les autres peuvent demander une autre
allure ; seul l'hôte « passe le temps », et tout le monde saute ensemble. Une partie en avance sur
celle de l'hôte attend que son horloge la rejoigne (le panneau l'indique).

**Si l'hôte part**, le joueur suivant devient l'hôte automatiquement. **Si un joueur perd la
connexion**, sa partie continue en solo et se reconnecte toute seule (essais toutes les 1 à 10 s) ;
ce qui lui était destiné (prêt, remboursement, sabotage…) lui arrive à son retour.

**Ce que tu vois de l'autre** : son personnage, habillé comme il s'est habillé (silhouette, tenue,
accessoires), avec « 🎮 son prénom » au-dessus de la tête, visible même derrière un immeuble.
Son mouvement est lissé (affiché avec 0,15 s de retard, entre deux positions reçues) : il marche,
il ne sautille pas. **💬** à côté de son nom : il est dans une fenêtre, un dialogue ou une
cinématique. Ça ne te bloque pas : si c'est l'hôte, ton horloge continue d'avancer à ton allure
(une heure de jeu d'avance au plus), puis attend qu'il revienne.

**Sauvegarde et reprise** : chaque joueur sauvegarde sa partie comme d'habitude (prêts, dettes,
alliances, propositions en attente compris). En rechargeant une sauvegarde de partie à plusieurs,
le jeu se reconnecte au même hôte ; « Quitter la partie à plusieurs » arrête cette reprise.

## Procédure de test pas à pas

### A. Deux fenêtres sur le même PC (5 minutes)

1. Dans le dossier du jeu : `npm ci` (une fois), puis double-clic sur `jouer-en-lan.bat`.
2. Fenêtre 1 : `http://localhost:8765` → nouvelle partie (prénom « Alex ») → 📡 Multijoueur →
   règles « Libre » → **Ouvrir la partie sur ce serveur**. Le panneau dit « 🟢 Tu es l'hôte ».
3. Fenêtre 2 : `http://127.0.0.1:8765` (adresse différente = sauvegarde séparée ; sinon une fenêtre
   privée) → nouvelle partie (« Bilal ») → 📡 Multijoueur → **Rejoindre** (adresse vide).
4. Vérifier : chaque fenêtre affiche « Bilal est dans la partie » / « Alex… » ; le bouton du haut
   indique « 📡 2 joueurs » ; dehors, on voit l'autre avatar avec « 🎮 Alex » au-dessus de la tête.
5. Alex : 📡 → Bilal → **Prêter** 100 €. Bilal : 📡 → Propositions reçues → **Accepter**. Bilal
   reçoit 100 €, Alex voit « On te doit 110 € ».
6. Fermer la fenêtre 2 : Alex voit « Bilal a quitté la partie ». La rouvrir sur `127.0.0.1:8765`,
   recharger la partie : elle se reconnecte seule.
7. Fermer la fenêtre 1 (l'hôte) : Bilal devient l'hôte (« c'est toi l'hôte maintenant »).

### A bis. Depuis le serveur de développement

`npm run dev` branche le relais sur le serveur Vite (`/net`). Ouvre `http://localhost:5173` et
`http://127.0.0.1:5173` (deux origines = deux sauvegardes), puis mêmes étapes que A.2 à A.7.
À vérifier en plus : l'autre marche sans à-coups ; ouvrir un panneau chez l'un fait apparaître 💬
chez l'autre ; un prêt de 100 € accepté arrive tout de suite (« Prêt d'Alex reçu : +100 € ») et
survit à un rechargement des deux onglets.

### B. Deux PC sur la même box

1. PC hôte : `jouer-en-lan.bat` (ou l'application → Héberger). Noter l'adresse affichée
   (`http://192.168.x.x:8765`).
2. PC ami : ouvrir cette adresse dans un navigateur → nouvelle partie → 📡 → Rejoindre.
3. Mêmes vérifications que A.4 à A.7. Couper le Wi-Fi de l'ami 20 s puis le remettre : il se
   reconnecte, la partie n'a pas planté.
4. Si « Impossible de joindre… » : même réseau ? Windows a-t-il autorisé Node.js sur les réseaux
   privés (Pare-feu Windows → Autoriser une application) ? Wi-Fi « invité » isolé ?

## Les règles (choisies par l'hôte)

| Mode | Ce qui est permis |
|---|---|
| 🤝 Coopération | prêts, coentreprise, achats groupés, recommandations, formation, garant |
| ⚖️ Libre | tout : coopérer, s'entendre en douce, se trahir |
| ⚔️ Rivalité | zone grise et sabotage seulement |

Les règles sont vérifiées des deux côtés : un coup interdit par le mode est ignoré à l'arrivée.

## Les 14 mécaniques

**Coopérer**
- **Prêt** (10 € à 50 000 €) : l'argent part tout de suite en séquestre ; il arrive chez l'autre quand le prêteur confirme son acceptation, et revient si l'autre refuse ou ne répond pas sous 5 jours. Remboursé dans 14 jours, avec 0, 5 ou 10 % d'intérêts ; un retard coûte de la confiance.
- **Coentreprise** (14 jours) : 15 % des bénéfices nouveaux de chacun vont à l'autre, +6 % de demande pour les deux.
- **Achats groupés** (7 jours) : −8 % chez tous les grossistes, pour les deux.
- **Recommandation** (5 jours) : +15 % de demande chez l'autre ; ta réputation gagne 2 points.
- **Formation** : l'autre apprend un concept de ton carnet (+ de l'expérience).
- **Garant mutuel** (30 jours) : si tu peux signer en adulte (18 ans, prête-nom ou bac à sable), tu signes pour l'autre : ses limites d'âge des affaires tombent.

**Zone grise**
- **Entente sur les prix** (10 jours) : +12 % de demande chacun… mais chaque jour, 8 % de risque que l'Autorité de la concurrence tombe dessus : 300 € (ou 10 % de ton argent) d'amende et −10 de réputation, pour les deux le même jour.

**Saboter** (un seul sabotage par jour ; une réputation de 70 ou plus divise les coups par deux)
- **Casser les prix** (120 €) : −15 % de demande chez l'autre pendant 7 jours. Il ou elle sait que c'est toi.
- **Rumeur** (gratuit) : −6 de réputation et −8 % de demande pendant 4 jours ; 35 % de chances d'être démasqué·e (et −4 de réputation pour toi).
- **Débauchage** (80 €) : l'employé·e le ou la moins bien payé·e de l'autre part s'il ou elle gagne moins de 12 €/h.
- **Signalement à l'inspection** : ses commerces ferment le reste de la journée (sauf réputation ≥ 70) ; 50 % de chances d'être démasqué·e.
- **Rafler les stocks** (200 €) : l'autre paie ses marchandises 12 % plus cher pendant 5 jours.
- **Espionnage** (30 €) : tu reçois ses chiffres ; 25 % de chances qu'il ou elle s'en aperçoive.
- **Bail coupé** (automatique) : un local loué par l'un n'est plus à louer pour l'autre. Premier arrivé, premier servi.

Chaque mécanique illustre un concept du carnet (levier, capital social, économies d'échelle,
oligopole, dumping, asymétrie d'information…), et deux fantômes donnent leur avis : un pour,
un contre. La relation entre joueurs (−100 à +100) garde la mémoire des coups et des services.

## Technique

- **Mondes parallèles reliés** : chaque joueur garde sa simulation déterministe et sa sauvegarde
  (version 25, champ `multiplayer`). Le réseau échange la présence, l'horloge de l'hôte, les sauts
  de temps et des événements appliqués par `src/simulation/multiplayer.ts`.
- **Méfiance par défaut** (`src/simulation/multiplayer.ts`) : une réponse n'est appliquée que si
  elle correspond à un envoi réel (`sent`, save v25) ; un remboursement ne dépasse jamais la dette
  due ; une part de coentreprise exige un accord en cours ; délais et mode vérifiés à l'arrivée ;
  au plus 3 propositions en attente par joueur. Un autre joueur ne peut ni créer ni prendre
  d'argent, ni imposer un accord.
- **Fiabilité** (`src/net/session.ts`, sans DOM) : une connexion = un joueur (usurpation ignorée) ;
  les événements restent dans la boîte d'envoi sauvegardée jusqu'à l'accusé de réception (renvoi
  après coupure, dédoublonnage à l'arrivée) ; débit borné par joueur (sourdine au-delà) ; même
  sauvegarde ouverte deux fois → nouvel identifiant pour le second. Un joueur qu'on entend sans le
  connaître (présentation perdue pendant un chargement) est redemandé ; les rappels d'un ancien
  client qui finit de se fermer sont ignorés. Après un événement reçu ou un accusé, la partie est
  sauvegardée aussitôt (un rechargement ne perd pas un prêt d'un côté seulement).
- **Affichage des autres** : `src/net/interp.ts` (lissage sans DOM : interpolation, courte
  extrapolation, téléportation au-delà de 12 m) et `src/presentation/city3d/remotePlayers.ts`
  (personnage, étiquette, 💬). La pose envoyée porte `busy` (fenêtre ou cinématique) ; l'horloge
  d'un invité suit `guestClockSpeed` (rattrapage, attente, ou 1 h d'avance si l'hôte est occupé).
- **Protocole** (`src/net/protocol.ts`, version 2) : tout message reçu est validé (`parseGameMsg`) ;
  textes nettoyés et bornés, toujours affichés comme du texte (jamais du HTML), apparence prise dans
  les valeurs permises, nombres finis et bornés.
- **Relais** (`tools/net-relay.mjs`, sans dépendance) : 4 joueurs par salon (refus lisible au 5e),
  messages ≤ 256 Ko, débit borné par connexion, trames masquées exigées, ping/pong toutes les 10 s,
  routage d'un message vers un seul joueur (`to`). Branché sur `tools/lan-server.mjs`, sur le
  serveur Vite (`/net`) et sur l'application de bureau (`desktop/host.cjs`).
- **Tests** : `tests/net_session.test.ts` (relais réel, 2 à 4 sessions, coupure, départ de l'hôte,
  client hostile), `tests/net_rencontre.test.ts` (lissage, tenue transmise, état occupé, prêt
  sauvegardé, présentation perdue), `tests/multiplayer_hostile.test.ts`, `tests/multiplayer.test.ts`,
  `tests/net_relay.test.ts`, `tests/desktop_host.test.ts`.
