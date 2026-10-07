# Jouer à plusieurs à NEURAPOLIS (LAN, NordVPN Meshnet)

Deux joueurs (ou plus, jusqu'à 8) dans la même ville de Val-Ferrand. Chacun vit sa propre vie
(famille, collège, affaires), mais vous voyez l'autre marcher dans les rues, vos commerces se
font concurrence, et vous pouvez **vous associer… ou vous saboter**.

## Mettre en place (une fois)

1. **NordVPN Meshnet** : sur les deux ordinateurs, ouvrez NordVPN → *Meshnet* → activez-le.
   Ajoutez l'appareil de votre ami (même compte : il apparaît tout seul ; comptes différents :
   *Inviter* avec son adresse e-mail). Dans les autorisations de l'appareil de votre ami,
   cochez **« Autoriser les connexions entrantes »** (et « accès au réseau local » si proposé).
2. **Node.js** doit être installé chez l'hôte (https://nodejs.org, version LTS).
3. Chez l'hôte, le jeu doit être construit (dossier `dist/` ou `.ci/verif/dist/`, ou le fichier
   unique `NEURAPOLIS.html`).

## Lancer une partie

1. **L'hôte** double-clique sur `jouer-en-lan.bat` (ou tape `npm run lan`, ou
   `node tools/lan-server.mjs`). Windows peut demander d'autoriser Node.js : acceptez pour les
   réseaux privés. La fenêtre affiche des adresses ; celle de Meshnet commence par `100.`
   (par exemple `http://100.64.12.34:8765`).
2. **L'hôte** ouvre `http://localhost:8765`, charge ou crée sa partie, puis clique sur
   **📡 Multijoueur → Se connecter** et choisit les règles.
3. **L'ami** ouvre l'adresse Meshnet de l'hôte dans son navigateur, charge ou crée sa partie,
   puis **📡 Multijoueur → Se connecter** (adresse laissée vide : c'est celle de la page).
   Avec le fichier unique ouvert en local, il tape l'adresse de l'hôte (ex. `100.64.12.34:8765`).

Le premier connecté est **l'hôte** : c'est son horloge qui fait foi pour tout le monde. Les
autres peuvent demander une autre allure ; seul l'hôte « passe le temps » (journée, semaine,
mois), et tout le monde saute ensemble. En multijoueur, une action longue (bénévolat, buvette…)
ne fait pas sauter le temps des autres : elle t'occupe jusqu'à ce que l'horloge partagée arrive.

## Les règles (choisies par l'hôte)

| Mode | Ce qui est permis |
|---|---|
| 🤝 Coopération | prêts, coentreprise, achats groupés, recommandations, formation, garant |
| ⚖️ Libre | tout : coopérer, s'entendre en douce, se trahir |
| ⚔️ Rivalité | zone grise et sabotage seulement |

## Les 14 mécaniques

**Coopérer**
- **Prêt** : l'argent part tout de suite (séquestre) ; si l'autre refuse, il revient. Remboursé dans 14 jours, avec 0, 5 ou 10 % d'intérêts ; un retard coûte de la confiance.
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

## Technique (pour les curieux)

- Mondes parallèles reliés : chaque joueur garde sa simulation déterministe et sa sauvegarde
  (version 24, champ `multiplayer`). Le réseau échange la présence, l'horloge de l'hôte, les sauts
  de temps et des événements d'interaction appliqués par `src/simulation/multiplayer.ts`.
- Relais : `tools/net-relay.mjs` (WebSocket écrit à la main, sans dépendance), branché sur le
  serveur LAN (`tools/lan-server.mjs`) et sur le serveur de développement Vite (`/net`).
- Client : `src/net/client.ts` (reconnexion automatique), protocole `src/net/protocol.ts`,
  session et panneau `src/presentation/multiplayer.ts`.
