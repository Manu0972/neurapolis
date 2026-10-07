# BIBLE DES QUARTIERS DE VAL-FERRAND (NEURAPOLIS)
## Encyclopédie Urbaine, Mémoire Ouvrière et Écosystèmes Économiques des Neuf Territoires

> **Document canonique de référence géographique, socio-économique et narrative**  
> Workflow AG-3 — Phase 5 : Bible et lore des 9 quartiers d'extension de Val-Ferrand.  
> Correspondance directe avec `CITY_AREAS` et `CITY.roads` (`src/data/city/layout.ts`), `DISTRICT_SHOPS` (`src/data/city/district_shops.ts`), `RESIDENTS` (`src/data/residents/residents.ts`), et les dépêches de quartier (`src/data/districts_ext/happenings.ts`).  
> Cadre temporel : Septembre 2020 – 2032+ (de l'entrée en cinquième aux horizons du conglomérat citoyen).

---

## Sommaire

1. [Introduction générale : La grande toile urbaine de Val-Ferrand](#1-introduction-générale--la-grande-toile-urbaine-de-val-ferrand)
2. [Gare Est (`gare_est`) — Le carrefour du rail et du triage ouvrier](#2-gare-est-gare_est--le-carrefour-du-rail-et-du-triage-ouvrier)
3. [Zone HyperVal (`hyperval`) — La forteresse logistique et les cadences froides](#3-zone-hyperval-hyperval--la-forteresse-logistique-et-les-cadences-froides)
4. [Bassin Industriel du Taret (`industrie`) — L'antre des fondeurs et des machines lourdes](#4-bassin-industriel-du-taret-industrie--lantre-des-fondeurs-et-des-machines-lourdes)
5. [Les Hauts du Taret (`collines`) — Le belvédère feutré et les haies bourgeoises](#5-les-hauts-du-taret-collines--le-belvédère-feutré-et-les-haies-bourgeoises)
6. [Les Berges de la Malterie (`berges`) — Le canal, les péniches et la mémoire de l'eau](#6-les-berges-de-la-malterie-berges--le-canal-les-péniches-et-la-mémoire-de-leau)
7. [Le Faubourg Saint-Éloi (`faubourg`) — L'artère commerçante et le chantier du tramway](#7-le-faubourg-saint-éloi-faubourg--lartère-commerçante-et-le-chantier-du-tramway)
8. [Grand Ensemble des Roses Sud (`grand_ensemble`) — Les barres solidaires et la cité hospitalière](#8-grand-ensemble-des-roses-sud-grand_ensemble--les-barres-solidaires-et-la-cité-hospitalière)
9. [Friche Taret Sud (`friche_sud`) — Les cathédrales d'acier blessées et la terre à reconquérir](#9-friche-taret-sud-friche_sud--les-cathédrales-dacier-blessées-et-la-terre-à-reconquérir)
10. [Le Plateau de Bellevue (`bellevue`) — L'horizon civique, le lycée et le repos des aînés](#10-le-plateau-de-bellevue-bellevue--lhorizon-civique-le-lycée-et-le-repos-des-aînés)
11. [Matrice synthétique de cohérence systémique](#11-matrice-synthétique-de-cohérence-systémique)

---

## 1. Introduction générale : La grande toile urbaine de Val-Ferrand

À l'échelle métrique de la grande carte (1 562 × 1 154 mètres), Val-Ferrand ne se résume plus au périmètre rassurant de la Cité des Roses ou au pavé historique de la place du Marché (le cœur initial de 414 × 266 m). La cité est une entité vivante, fragmentée, blessée par la désindustrialisation mais portée par un souffle collectif tenace. C'est un bassin de 45 000 habitantes et habitants, coincé au creux d'une vallée encaissée où s'entremêlent la rivière le Taret, un canal de dérivation creusé pour la malterie à la fin du XIXe siècle, et les embranchements ferroviaires reliant jadis le charbon des mines aux convertisseurs d'acier.

Dans NEURAPOLIS, l'espace est politique, économique et moral :
- **Une géographie de strates ouvrières** : Chaque rue témoigne d'un compromis social, d'un coup de force patronal ou d'une conquête syndicale. Les barres HLM des Roses racontent le confort moderne apporté aux fondeurs en 1965 ; les sheds déchiquetés de la friche rappellent la trahison financière du 14 avril 2014 ; les entrepôts aseptisés d'HyperVal matérialisent la capture de la valeur par les algorithmes de la grande distribution contemporaine.
- **Le rôle de la progression par paliers d'Ascension** : L'enfant de Nora et Thierry ne découvre pas la ville d'un trait. À douze ans, l'horizon est borné par les grilles du collège et l'étal de bonbons de Mme Bertin. À mesure que les concepts économiques s'éclairent sous l'impulsion des conseillers intérieurs (Smith, Marx, Keynes, Ostrom, Polanyi, Taylor...) et que la confiance des quartiers est conquise, les barrières de police municipale tombent, les ponts réparés s'ouvrent, et la ville déploie son immensité.
- **Une neutralité de genre intransigeante** : Quel que soit le cheminement identitaire choisi par le joueur, le récit de Val-Ferrand s'adresse à son courage, à sa sagacité économique et à son humanité sans jamais l'enfermer dans un carcan binaire.

---

## 2. Gare Est (`gare_est`) — Le carrefour du rail et du triage ouvrier

### 2.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'gare_est'` | Nom de carte : `Gare Est` | District logique : `'gare'` | Palier d'ouverture : `Tier 2` (13-14 ans).
* **Emprise géométrique** : $x \in [417, 581]$, $y \in [0, 253]$ ($w = 164$ m, $h = 253$ m).
* **Limites spatiales** : Bordé à l'ouest par le centre historique (Boulevard de l'Est), au sud par le lit du canal de la Malterie ($y = 250$), et à l'est par la zone logistique d'HyperVal.
* **Rues principales du réseau `CITY.roads`** : `Rue de la Gare`, `Avenue des Grossistes`, `Avenue Jean-Jaurès`, `Rue des Forges`, `Quai de la Malterie`, `Rue de la Mine`.
* **Architecture dominante** : Bâtiments monumentaux en pierre de taille pour le hall des voyageurs (style civique néo-classique de 1892), briques rouges industrielles des cités cheminotes adjacentes, verrières à armature rivetée et marquises en fonte.
* **Ambiance sensorielle** :
  - *Visuelle* : L'éclairage Hygge 1800K des réverbères à sodium découpe les voies ferrées dans la brume matinale. Les feux de signalisation ferroviaire clignotent en rouge et blanc sur les aiguillages.
  - *Sonore* : Le grincement métallique des essieux sur les aiguillages, le chuintement des freins pneumatiques des TER de 6 h 12, les annonces nasillardes du haut-parleur de quai, et les pas cadencés des navetteurs marchant vers l'avenue Jean-Jaurès.
  - *Olfactive* : Odeur âcre de créosote imprégnant les traverses de bois, café brûlé émanant du comptoir de la gare, vapeur d'eau et relents de charbon froid du laminoir voisin.

### 2.2 Histoire & Racines ouvrières
La Gare de Val-Ferrand-Est a été inaugurée en 1892 pour acheminer les trains entiers de minerai lorrain et de houille du bassin vers les forges du Taret. Pendant un siècle, elle a été la citadelle des cheminots et des syndicats de traction. C'est d'ici que partaient les convois d'acier massif vers les chantiers navals de l'Atlantique. Lors des grandes grèves de l'hiver 1974 et de 1995, la gare était le verrou stratégique de toute la région : bloquer le triage Est revenait à couper l'alimentation métallique de dix usines partenaires.
Le quartier conserve également la dernière installation sidérurgique lourde encore active en 2020 : le **Laminoir Taret** (`Laminoir Taret`, îlot `east[1]`), qui emploie encore 1 300 métallurgistes en sursis (dont la fermeture programmée à l'horizon 2032 plane comme une épée de Damoclès sur les familles de la cité ouvrière adjacente).

### 2.3 Sociologie & Habitants
La population de Gare Est se partage entre cheminots retraités vivant dans les petites maisons de brique de la cité ouvrière du Laminoir, navetteurs précaires contraints de prendre le train quotidien vers la métropole régionale pour de petits emplois tertiaires, et jeunes travailleuses et travailleurs saisonniers en transit. Les anciens du rail tiennent le pavé avec une solidarité ombrageuse : on s'entraide pour décharger le charbon ou surveiller les enfants le long des voies de garage, mais on observe avec méfiance les promoteurs immobiliers qui lorgnent sur les entrepôts désaffectés pour y implanter des lofts sans âme.

### 2.4 Commerces & Économie locale
L'économie vit au rythme des départs et des arrivées, de 4 heures du matin à minuit.
- **Acteurs marchands de référence (`DISTRICT_SHOPS`)** :
  - *Le Relais des Quais* (tenu par Mireille Castan) : Le café-comptoir incontournable où les cheminots croisent les voyageurs du premier train dès 5h30 du matin autour d'un expresso serré.
  - *Presse & Billets* (tenu par Hamid Rezki) : Kiosque indispensable où se vendent quotidiens nationaux, billets de train, tabac et confiseries, véritable vigie des humeurs politiques locales.
  - *Cordonnerie de la Gare* (tenue par Ange Peretti) : L'atelier artisanal des semelles de sécurité, réparations de courroies et clés minutes, résistant à l'obsolescence programmée.
  - *Fournil du Cheminot* (tenu par Odette Lambrecht) : Boulangerie d'aurore dont le pain de campagne pétri au levain nourrit les équipes du laminoir dès 4 heures du matin.
- **Zone grise et flux invisibles** : Sous la marquise et près des casiers de consigne, un troc informel de journaux, de tickets de transport non compostés et de pièces d'outillage usagées s'organise avant l'arrivée de la patrouille de sécurité.

### 2.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Rénovation du quartier de la gare : ouverture prochaine."`
* **Explication diégétique profonde** : Au démarrage de la partie (septembre 2020), la municipalité a posé des barrières de chantier en tôle ondulée sur l'avenue Jean-Jaurès et la rue de la Gare. Officiellement, la SNCF et la communauté de communes engagent un programme de modernisation des passages sous-voies et de sécurisation du parvis. En réalité, le chantier est enlisé par des désaccords financiers entre la région et la ville, transformant le secteur en goulot d'étranglement surveillé par des vigiles municipaux. Tant que le joueur n'a pas atteint le **Palier 2** et démontré sa légitimité marchande, la police municipale interdit le passage aux collégiens, prétextant les engins de terrassement.

### 2.6 Ouverture & Métamorphose
Dès le franchissement du Palier 2, le parvis rénové est rendu aux piétons. Pour le joueur, c'est l'ouverture d'un marché de flux colossal : des centaines de navetteurs matinaux prêts à acheter des viennoiseries fraîches, des cafés à emporter ou des journaux. Le joueur peut y implanter son premier point de vente mobile (triporteur de livraison), nouer des accords avec Odette pour les invendus de boulangerie, ou louer un local commercial d'angle pour capter la clientèle du TER.

### 2.7 Scène du Multijoueur & Dynamiques de rivalité
Gare Est est le théâtre privilégié de la **guerre des prix matinale**. Deux joueurs rivaux peuvent s'affronter férocement sur la marge du café ou du croissant à emporter : vendre à perte dès 6h30 pour siphonner la clientèle du concurrent avant qu'il n'ouvre, ou sceller un **accord tacite de cartel** (`entente_prix`) sur les tarifs des snacks de voyage. C'est aussi le lieu des coups bas de type `debauchage` (dérober le meilleur vendeur de comptoir) ou de `signalement` d'hygiène sur un chariot de restauration ambulant.

---

## 3. Zone HyperVal (`hyperval`) — La forteresse logistique et les cadences froides

### 3.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'hyperval'` | Nom de carte : `Zone HyperVal` | District logique : `'hyperval'` | Palier d'ouverture : `Tier 3` (15 ans).
* **Emprise géométrique** : $x \in [581, 827]$, $y \in [0, 253]$ ($w = 246$ m, $h = 253$ m).
* **Limites spatiales** : Enchâssé au nord-est de la ville historique, délimité à l'ouest par Gare Est, au sud par le canal de la Malterie, et à l'est par le bassin industriel.
* **Rues principales du réseau `CITY.roads`** : `Rue Henri-Barbusse`, `Rue des Entrepôts`, `Boulevard Taret`, `Avenue Jean-Jaurès`, `Rue des Forges`, `Quai de la Malterie`, `Avenue des Grossistes`.
* **Architecture dominante** : Bardage métallique ondulé gris anthracite et bleu commercial, toitures terrasses plates recevant des groupes frigorifiques géants, bitume lourd découpé en zones de giration pour semi-remorques, clôtures rigides en acier galvanisé de 2,50 m de hauteur.
* **Ambiance sensorielle** :
  - *Visuelle* : L'éclairage cru et stroboscopique des néons blancs de 4000K écrase les parkings. Les quais de déchargement sont balayés par les gyrophares orange des chariots élévateurs.
  - *Sonore* : Le bip de recul strident et continu des poids lourds de 38 tonnes, le claquement sourd des hayons hydrauliques, le ronronnement sourd des compresseurs de chambres froides, et le crépitement des talkies-walkies des chefs de quai.
  - *Olfactive* : Gaz d'échappement diesel mal brûlé, plastique thermoformé des palettes de suremballage, odeur de carton humide et désinfectant industriel.

### 3.2 Histoire & Racines ouvrières
La zone HyperVal est le symbole le plus violent de la transition post-industrielle de Val-Ferrand. Aménagée au début des années 2000 sur les anciens terrains de stockage de minerai brut, elle a été vendue pour une bouchée de pain par une municipalité aux abois, séduite par la promesse de « 800 emplois de service ». 
Très vite, la réalité s'est imposée : les emplois créés étaient des contrats précaires, des temps partiels imposés et des postes de cariste chronométrés à la seconde. C'est ici que Thierry, le père du joueur, a été contraint d'embaucher après le licenciement collectif de 2014, troquant sa fierté de fondeur d'élite contre le volant d'un chariot élévateur guidé par synthèse vocale. L'enseigne rivale, le **Drive HyperVal** (piloté par le cynique Hervé de Saint-Amand), est devenue le prédateur commercial qui assèche les petits commerces de centre-ville par des baisses de prix prédatrices.

### 3.3 Sociologie & Habitants
Presque personne n'habite à même la zone, hormis quelques gardiens de dépôts logés dans des pavillons préfabriqués d'angle. En revanche, le quartier voit converger chaque jour des centaines de manutentionnaires en bleu de travail floqué, de chauffeurs routiers venus d'Espagne, de Pologne ou des Pays-Bas stationnant sur le parking des grossistes, et de jeunes intérimaires usés par les cadences du travail posté (les « 3×8 »). C'est un monde d'invisibles, où la solidarité ouvrière peine à s'organiser sous la surveillance constante des caméras de sécurité et des primes individuelles de productivité.

### 3.4 Commerces & Économie locale
HyperVal est le cœur battant de l'approvisionnement en gros de toute la vallée.
- **Les Grossistes de l'Allée (`PICKUP_BUILDINGS`)** :
  - *Grossiste Malterie Boissons* (`e102`) : Fûts de bière, sodas, palettes d'eau minérale et jus en gros conditionnement.
  - *Cash Fruits du Taret* (`e102`) : Cagettes maraîchères de gros, agrumes d'importation et primeurs à rotation rapide.
  - *Allée des Grossistes — Frais* (`e103`) : Produits laitiers, viandes et denrées réfrigérées destinées aux restaurateurs et snacks.
  - *Dépôt Papeterie Vallée* (`e103`) : Fournitures scolaires, carton d'emballage, papier kraft et palettes de ramettes.
- **Grandes surfaces spécialisées** : En bordure de boulevard s'alignent *Brico Taret*, *Meubles Val-Ferrand* et *Hyper Discount*, drainant les familles du samedi après-midi avec leurs remorques.
- **Zone grise et couloirs secrets** : Derrière les quais de l'allée des Grossistes s'échangent des palettes déclassées (« dates courtes »), du carburant siphonné ou des cartons tombés du camion, rachetés au quart du prix par des épiciers de nuit sans scrupules.

### 3.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Zone commerciale réservée aux professionnels : carte de grossiste exigée."`
* **Explication diégétique profonde** : À l'entrée de la rue des Entrepôts et de l'avenue des Grossistes, une barrière levante automatique et un poste de sécurité privé barrent le passage. L'accès est strictement réservé aux transporteurs munis d'un numéro SIRET et de la carte d'acheteur professionnel délivrée par le syndicat des grossistes. À douze ou treize ans, un adolescent à pied n'a rien à y faire : les gardiens de sécurité refoulent impitoyablement les badauds pour « des raisons élémentaires de responsabilité civile liée au trafic de chariots élévateurs ».

### 3.6 Ouverture & Métamorphose
L'accès s'ouvre au **Palier 3** (15 ans), lorsque le joueur, épaulé par la co-signature de ses parents et fort d'un premier registre de commerce formel, obtient sa carte officielle d'acheteur de gros. Dès lors, le modèle économique de l'entreprise change d'échelle : au lieu d'acheter ses marchandises au détail chez Mme Bertin avec une marge réduite, le joueur a accès direct aux palettes des grossistes à des tarifs dégressifs divisés par deux ou trois, ouvrant la voie à la vraie logistique physique (camionnettes utilitaires, gestion de stocks d'entrepôt).

### 3.7 Scène du Multijoueur & Dynamiques de rivalité
HyperVal est le terrain de prédilection de la mécanique de **`rachat_fournisseur`** : un joueur disposant d'une trésorerie solide peut préempter l'intégralité du stock de café ou de farine chez un grossiste pour provoquer une rupture immédiate dans les boutiques de ses concurrents. C'est également là que se nouent les accords d'**`achats_groupes`** : deux joueurs s'allient pour commander conjointement dix palettes de boissons et débloquer une remise de volume de 25 %, avant de se partager les caisses sur le trottoir.

---

## 4. Bassin Industriel du Taret (`industrie`) — L'antre des fondeurs et des machines lourdes

### 4.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'industrie'` | Nom de carte : `Zone industrielle du Taret` | District logique : `'industrie'` | Palier d'ouverture : `Tier 4` (16 ans).
* **Emprise géométrique** : $x \in [827, 1155]$, $y \in [0, 253]$ ($w = 328$ m, $h = 253$ m).
* **Limites spatiales** : Partie nord-est de la carte, coincé entre la zone HyperVal à l'ouest et le relief montant des Collines à l'est, bordé au sud par le canal et la friche sud.
* **Rues principales du réseau `CITY.roads`** : `Rue de la Coulée`, `Rue des Fondeurs`, `Rue du Haut-Fourneau`, `Chemin des Collines`, `Avenue Jean-Jaurès`, `Rue des Forges`, `Boulevard Taret`.
* **Architecture dominante** : Hangars à sheds à redans vitrés noircis par la fumée, cheminées en brique réfractaire s'élevant à 30 mètres, portiques métalliques rouillés, cuves de trempe à l'air libre et canalisations aériennes calorifugées.
* **Ambiance sensorielle** :
  - *Visuelle* : L'horizon est saturé de silhouettes géométriques sombres. Au crépuscule, des lueurs ambrées et rougeoyantes s'échappent des verrières des ateliers encore en chauffe.
  - *Sonore* : Le pilonnage rythmique des marteaux-pilons hydrauliques faisant trembler le sol sous les pieds, le crissement strident des scies à ruban tranchant les profilés d'acier, et les sirènes de fin de quart qui hurlent à 13h00 et 21h00.
  - *Olfactive* : Odeur prenante d'huile d'usinage surchauffée, de limaille de fer calcinée, d'ozone émis par les postes de soudure à l'arc, et relent de coke mouillé.

### 4.2 Histoire & Racines ouvrières
Ce quartier est le berceau historique de la métallurgie du bassin, là où la famille Taret installa les premiers martinets hydrauliques le long de la rivière au milieu du XIXe siècle. Contrairement aux hauts-fourneaux de masse fermés en 2014, le bassin industriel Nord regroupe un tissu d'ateliers de sous-traitance mécanique, de chaudronnerie lourde et de mécanique de précision qui ont résisté grâce à des savoir-faire d'exception.
C'est le quartier de **Samir Ould-Ali**, l'ancien métallo délégué qui garde la mémoire des luttes de 1982 pour la dignité des ouvriers immigrés. Les ateliers ont connu des semaines d'occupation héroïques où les ouvriers gardaient les machines jour et nuit pour empêcher les huissiers de démanteler les bancs d'usinage.

### 4.3 Sociologie & Habitants
Une population de maîtres-ouvriers hautement qualifiés, de tourneurs-fraiseurs d'expérience aux doigts calleux, d'ingénieurs méthodes attachés au territoire et d'apprentis chaudronniers. Malgré la rudesse des conditions de travail, la solidarité de métier y est proverbiale : on se salue d'un hochement de tête respectueux entre gens qui savent ce que pèse une barre d'acier ou ce que coûte une seconde d'inattention face à une cisaille hydraulique. Les familles habitent de petits pavillons modestes construits au pied des ateliers, dont les jardins potagers sont protégés des suies par des rideaux de noisetiers.

### 4.4 Commerces & Économie locale
Ici, on ne vend pas de bricoles : on transforme la matière brute en machines.
- **Activités de fabrication et sous-traitance** :
  - Ateliers d'usinage de pièces pour les turbines hydroélectriques et les bogies de train.
  - Dépôts de métaux ferreux et non-ferreux : cuivre, bronze d'art, aluminium de récupération.
  - Garages de rectification moteur et ateliers de réparation d'engins agricoles du Plateau Blanc.
- **Petits commerces de soutien** : Cantines d'ateliers, marchands de vêtements de protection renforcés (chaussures de sécurité coquées, gants de croûte de cuir, lunettes meuleuses), et le café syndical où l'on consulte les fiches de paie et les conventions collectives.
- **Zone grise et troc de métaux** : Un important marché informel de revente de chutes d'inox, de cuivre dénudé et d'aciers spéciaux s'opère en fin de semaine entre les cours d'ateliers, permettant aux artisans de se dépanner mutuellement sans paperasse bureaucratique.

### 4.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Site industriel : accès réservé aux entreprises partenaires."`
* **Explication diégétique profonde** : Le préfet a placé les accès de la rue de la Coulée et de la rue du Haut-Fourneau sous un arrêté de sécurité industrielle renforcée (réglementation Seveso seuil bas), motivé par la présence de cuves de solvants et la circulation incessante de fardiers transportant des poutrelles incandescentes. Les barrières gardées par des agents assermentés bloquent quiconque ne dispose pas d'un bon de livraison industriel visé par un contremaître ou d'un ordre de mission d'artisan partenaire.

### 4.6 Ouverture & Métamorphose
L'accès est déverrouillé au **Palier 4** (16 ans), quand le joueur commence à fabriquer des biens durables (triporteurs de transport, mobilier de magasin en acier recyclé, modules d'ateliers modulaires). C'est le passage de la petite distribution à la **production industrielle souveraine**. Le joueur peut sous-traiter la fabrication de ses propres châssis chez les fondeurs locaux, récupérer des métaux rares au prix de la ferraille et s'adjoindre les conseils techniques inestimables de Samir pour optimiser la résistance de ses outils logistiques.

### 4.7 Scène du Multijoueur & Dynamiques de rivalité
Le Bassin Industriel est l'arène des rivalités technologiques et du **`bail_coupe`** : les joueurs se disputent les rares ateliers équipés d'un pont-roulant opérationnel ou d'un raccordement triphasé haute puissance. C'est également le lieu où peuvent se tramer des opérations d'**`espionnage`** industriel (copier les plans de fabrication d'un rival) ou, au contraire, la création d'une **`coentreprise`** pour mutualiser une machine-outil coûteuse que ni l'un ni l'autre ne pourrait financer seul.

---

## 5. Les Hauts du Taret (`collines`) — Le belvédère feutré et les haies bourgeoises

### 5.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'collines'` | Nom de carte : `Les Hauts du Taret` | District logique : `'collines'` | Palier d'ouverture : `Tier 3` (15 ans).
* **Emprise géométrique** : $x \in [1155, 1562]$, $y \in [0, 253]$ ($w = 407$ m, $h = 253$ m).
* **Limites spatiales** : Flanc nord-est de la vallée, surplombant le bassin industriel et la ville basse.
* **Rues principales du réseau `CITY.roads`** : `Chemin des Collines`, `Rue de Bellevue`, `Rue des Vergers`, `Allée des Hauts-Tilleuls`, `Rue du Belvédère`, `Route de Néo-Baie`.
* **Architecture dominante** : Pavillons cossus en crépi enduit crème ou pierre meulière avec toitures en ardoise naturelle à deux pans, villas d'architectes des années 1980 protégées par de hautes haies de lauriers et des portails en fer forgé motorisés, allées privatives gravillonnées.
* **Ambiance sensorielle** :
  - *Visuelle* : Une lumière dorée et limpide, préservée des brumes de fond de vallée. Les pelouses au vert manucuré contrastent violemment avec la poussière d'acier des quartiers bas.
  - *Sonore* : Silence étouffé, troublé seulement par le vrombissement feutré des tondeuses à gazon le samedi matin, les aboiements lointains de chiens de garde derrière les clôtures, et le tintement cristallin de carillons éoliens.
  - *Olfactive* : Parfum délicat de lavande, d'herbe coupée, de résine de pin et de cire pour meubles anciens, sans la moindre trace d'hydrocarbures.

### 5.2 Histoire & Racines ouvrières
Les Collines ont été conquises à la fin du XIXe siècle par les maîtres de forges et les directeurs des houillères, soucieux d'échapper aux fumées corrosives et aux épidémies ouvrières de la cuvette. Ils y construisirent leurs manoirs victoriens entourés de parcs clos. Dans les années 1970 et 1980, le plateau a été morcelé en lotissements résidentiels haut de gamme pour les cadres supérieurs, les médecins et les notables de province.
La mémoire ouvrière n'y existe que sous la forme de l'exclusion : pendant les grèves de 1974, les cortèges de mineurs défilaient au pied des collines en scandant des slogans sous les fenêtres des directeurs terrés derrière leurs volets clos.

### 5.3 Sociologie & Habitants
Une bourgeoisie provinciale patrimoniale composée de directeurs de filiales d'HyperVal, de chirurgiens de l'hôpital de Val-Ferrand, d'avocats d'affaires et de rentiers. L'entre-soi y est farouchement défendu sous le prétexte de la « tranquillité résidentielle ». On y pratique la surveillance de voisinage (« Voisins Vigilants »), on scrute les immatriculations des véhicules inconnus et l'on regarde d'un œil condescendant ou inquiet la jeunesse venue des cités HLM d'en bas.

### 5.4 Commerces & Économie locale
Aucune boutique bruyante ni atelier polluant n'a le droit de cité sur les hauteurs : le plan local d'urbanisme y interdit les devantures commerciales ostentatoires.
- **Économie de services exclusifs** :
  - Paysagistes et jardiniers indépendants taillant les haies au cordeau.
  - Professeurs particuliers et coachs de préparation aux grandes écoles.
  - Livraisons à domicile haut de gamme : traiteurs de réception, caisses de vin de grands crus, conciergeries privées.
- **Zone grise feutrée** : Le travail domestique non déclaré (femmes de ménage payées de la main à la main, gardes d'enfants au noir) et les arrangements fiscaux de courtiers en patrimoine discutés discrètement au fond des vérandas.

### 5.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Lotissement privé : on n’y entre qu’invité·e."`
* **Explication diégétique profonde** : À l'embranchement du chemin des Collines et de l'allée des Hauts-Tilleuls, une barrière privative flanquée d'un panonceau d'interdiction et d'une caméra de vidéosurveillance barre la route. Les habitants ont privatisé la voirie par arrêté municipal de copropriété : un vigile privé patrouille en scooter pour refouler quiconque ne justifie pas d'un badge de riverain ou d'une invitation formelle.

### 5.6 Ouverture & Métamorphose
L'accès se débloque au **Palier 3** (15 ans), lorsque la réputation de l'entreprise du joueur et la qualité de ses services (livraisons de paniers bio haut de gamme, réparations de vélos électriques à domicile) incitent des familles bourgeoises des Collines à passer commande. Le quartier devient un débouché commercial à très haute marge : les résidents paient le double ou le triple du prix pour des produits artisanaux étiquetés « terroir », finançant ainsi la trésorerie nécessaire à l'expansion des projets solidaires de la ville basse.

### 5.7 Scène du Multijoueur & Dynamiques de rivalité
Les Collines sont le lieu de la **guerre d'image et de `rumeur`** : un joueur peut discréditer son rival auprès de l'association des riverains en colportant des rumeurs sur le bruit de ses livraisons ou l'absence de certification écologique de ses produits. Inversement, décrocher un contrat d'exclusivité auprès d'un notable des Collines offre un levier financier redoutable pour asseoir sa domination commerciale sur toute la vallée.

---

## 6. Les Berges de la Malterie (`berges`) — Le canal, les péniches et la mémoire de l'eau

### 6.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'berges'` | Nom de carte : `Berges de la Malterie` | District logique : `'berges'` | Palier d'ouverture : `Tier 2` (13-14 ans).
* **Emprise géométrique** : $x \in [0, 581]$, $y \in [253, 517]$ ($w = 581$ m, $h = 264$ m).
* **Limites spatiales** : Rive sud du canal de la Malterie, s'étendant de la bordure ouest de la ville jusqu'à l'axe de la gare à l'est, face au centre historique.
* **Rues principales du réseau `CITY.roads`** : `Quai Sud de la Malterie`, `Rue de la Brasserie`, `Avenue Salvador-Allende`, `Rue Ambroise-Paré`, `Rue de la Gare`, `Rue du Laminoir`, `Rue des Écluses`.
* **Architecture dominante** : Pavage moussus en grès, parapets de pierre de taille le long de l'eau, façades d'ateliers fluviaux en briques patinées, passerelles piétonnes métalliques à arche rivetée (style Eiffel), péniches Freycinet amarrées transformées en habitats légers.
* **Ambiance sensorielle** :
  - *Visuelle* : L'eau sombre et calme du canal reflète les briques des façades sous la lumière dorée de 1800K. Des nénuphars et des roseaux colonisent les berges en aval de l'écluse n°4.
  - *Sonore* : Le clapotis apaisant de l'eau contre la coque des péniches, le coassement des grenouilles au crépuscule, les accords d'accordéon échappés de la guinguette le dimanche après-midi, et le sifflet des bateliers manœuvrant les écluses.
  - *Olfactive* : Odeur d'eau douce, de vase fertile, de houblon fermenté émanant de l'ancienne brasserie, et parfum de friture de goujons au grand air.

### 6.2 Histoire & Racines ouvrières
Le canal a été percé en 1878 pour détourner les eaux tumultueuses du Taret et créer un bassin navigable de déchargement pour la **Brasserie de la Malterie** (`Brasserie de la Malterie`, îlot `s0002`). Pendant des décennies, des mariniers et des débardeurs ont manipulé des sacs d'orge de 80 kilos à dos d'homme.
Le quartier a été profondément meurtri par la **crue centennale d'octobre 2019** : après trois semaines de pluies torrentielles sur le massif du Morvan, le Taret a submergé les digues, fissuré les piliers métalliques du grand pont reliant le centre aux berges et inondé des centaines de caves ouvrières. Mais cette épreuve a réveillé une entraide formidable : les bateliers ont sauvé des familles entières en barque, et les jardins ouvriers de la rive sud ont partagé leurs récoltes épargnées.

### 6.3 Sociologie & Habitants
Une communauté hybride et poétique : vieux pêcheurs à la ligne passant leurs journées sur un pliant en toile, bateliers à la retraite refusant de quitter leur péniche, maraîchers des jardins familiaux de la rive sud, artisans réparateurs de vélos et jeunes artistes bohèmes ayant aménagé des péniches-ateliers. Le rythme y est plus lent, plus contemplatif que dans le reste de la ville : on prend le temps d'observer le niveau de l'eau et de discuter autour d'un verre au bord du chemin de halage.

### 6.4 Commerces & Économie locale
L'économie des Berges est vivante, populaire et ancrée dans le terroir.
- **Acteurs marchands de référence (`DISTRICT_SHOPS`)** :
  - *La Guinguette de l’Écluse* (tenue par Paulo Ferreira) : Bal musette le dimanche, vente de glaces artisanales, de limonades fraîches et de goujons frits, lieu de fête intergénérationnelle depuis 1952.
  - *Pêche & Canal* (tenu par Gérard Lefebvre) : Fournitures de pêche, asticots, bottes en caoutchouc et récits de prises de sandres depuis que la brasserie filtre ses effluents.
  - *Les Jardins de la Malterie* (tenus par Aïcha Bouzid) : Primeur associatif distribuant les légumes frais cueillis à l'aube dans les parcelles ouvrières de la rive sud.
  - *Cycles du Halage* (tenu par Yann Le Goff) : Réparation de vélos de randonnée, location de remorques et vente de sacoches étanches pour les 40 km de chemin de halage.
  - *Bouquins au fil de l’eau* (tenu par Rosa Mendès) : Péniche-librairie d'occasion où l'on déniche des classiques de la philosophie et des romans sociaux pour quelques euros.
- **Zone grise et circuits parallèles** : Déchargement nocturne de caisses de café équitable acheminées par péniche depuis Néo-Baie, échappant aux radars logistiques des autoroutes, et troc de poisson d'eau douce contre des réparations mécaniques.

### 6.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Pont en travaux depuis la crue de 2019."`
* **Explication diégétique profonde** : À la fin de la rue des Forges et du boulevard de l'Est, le pont carrossable franchissant le canal est barré par des plots de béton et des barrières de sécurité de voirie. Le tablier en fonte a été fragilisé par la crue de 2019 et la municipalité traîne à voter le budget de consolidation des culées. Seule une passerelle piétonne étroite reste accessible sous la surveillance d'un garde-champêtre qui interdit le passage des deux-roues et des convois de marchandises.

### 6.6 Ouverture & Métamorphose
Le pont consolidé rouvre au **Palier 2** (13-14 ans). Pour le joueur, c'est une révolution logistique : l'accès direct aux 40 kilomètres sans voiture du chemin de halage pour ses tournées de livraison en vélo-cargo, la possibilité d'acheter les légumes ultra-frais d'Aïcha Bouzid pour achalander son étal de marché, et l'accès aux dépôts fluviaux pour acheminer des marchandises pondéreuses à très faible coût carbone.

### 6.7 Scène du Multijoueur & Dynamiques de rivalité
Les Berges sont le lieu de la **coopération et de la régulation des communs** (chère à Elinor Ostrom). Les joueurs peuvent y négocier des chartes d'usage partagé du quai de déchargement pour éviter l'encombrement des péniches, ou s'affronter dans une **guerre de réputation** autour des labels de fraîcheur bio. Le sabotage typique y est la détérioration de bicyclettes de livraison (`sabotage_velo`) ou le signalement fallacieux de non-conformité sanitaire sur la terrasse de la guinguette.

---

## 7. Le Faubourg Saint-Éloi (`faubourg`) — L'artère commerçante et le chantier du tramway

### 7.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'faubourg'` | Nom de carte : `Faubourg Saint-Éloi` | District logique : `'faubourg'` | Palier d'ouverture : `Tier 3` (15 ans).
* **Emprise géométrique** : $x \in [581, 1562]$, $y \in [253, 517]$ ($w = 981$ m, $h = 264$ m).
* **Limites spatiales** : Large bande intermédiaire au sud du canal, s'étendant sous la zone HyperVal et l'industrie jusqu'aux contreforts est des Collines.
* **Rues principales du réseau `CITY.roads`** : `Avenue Salvador-Allende`, `Rue de la Brasserie`, `Rue Ambroise-Paré`, `Rue des Écluses`, `Avenue des Grossistes`, `Rue Henri-Barbusse`, `Rue des Entrepôts`, `Boulevard Taret`, `Rue de la Coulée`, `Rue des Fondeurs`, `Rue du Haut-Fourneau`, `Chemin des Collines`.
* **Architecture dominante** : Immeubles de rapport continus de 3 à 5 étages (enduits crème, ocre et rose, parements de briques vernissées), rez-de-chaussée marchands continus sous auvents de toile, cours intérieures d'artisans pavées desservies par des porches cochers.
* **Ambiance sensorielle** :
  - *Visuelle* : Une profusion de couleurs d'enseignes peintes, d'étalages débordant sur les trottoirs, tranchée par les palissades jaunes de chantier et les tranchées de ballast du tramway en travaux.
  - *Sonore* : Le marteau-piqueur des ouvriers posant les rails de tramway, les apostrophes joyeuses des commerçants sur le seuil de leur boutique, le tintement des sonnettes de portes en laiton, et les klaxons des camionnettes de livraison se frayant un passage dans les ruelles étroites.
  - *Olfactive* : Odeur entêtante de pain chaud et de gâteaux au beurre, parfum d'épices d'Orient étalées sur les étals, relents de poussière de plâtre soulevée par les pelleteuses, et café fraîchement moulu.

### 7.2 Histoire & Racines ouvrières
Le Faubourg Saint-Éloi est le quartier des artisans forgerons et des commerçants indépendants depuis le XVIIIe siècle, bien avant l'essor de la grande industrie. Nommé en hommage au saint patron des métallurgistes et des orfèvres, le quartier s'est développé le long de l'ancienne route de poste reliant la vallée à la capitale régionale.
Les artisans du Faubourg ont toujours entretenu un esprit d'indépendance frondeuse : ils ont fondé dès 1902 la première coopérative d'achats boulangère et soutenu toutes les luttes ouvrières en accordant des ardoises de crédit gratuites aux familles des grévistes.

### 7.3 Sociologie & Habitants
Le quartier le plus dense, le plus métissé et le plus commerçant de Val-Ferrand. On y croise des familles d'artisans implantées depuis trois générations, des boutiquiers issus de l'immigration méditerranéenne et moyen-orientale qui ouvrent sept jours sur sept jusqu'à minuit, des couturières de quartier récupérant les bleus de travail pour les transformer en vêtements vintage, et des étudiants en colocation. La solidarité y est rugueuse mais bien vivante : on se dispute sur le prix du stationnement, mais on veille sur la boutique du voisin dès qu'il s'absente.

### 7.4 Commerces & Économie locale
Le cœur battant du commerce indépendant de proximité.
- **Acteurs marchands de référence (`DISTRICT_SHOPS`)** :
  - *Épicerie Saint-Éloi* (tenue par Mehmet Yildiz) : Ouverte 7j/7 jusqu'à minuit, l'épicerie qui ne dort jamais, vendant fruits secs, conserves, boissons fraîches et dépannant tout le quartier.
  - *Pâtisserie Delorme* (tenue par Brigitte Delorme) : Le mille-feuille légendaire et les tartes aux fruits de saison transmis de mère en fille depuis trois générations.
  - *Atelier Saint-Éloi* (tenu par Nadia Haddad) : Friperie et confection textile upcyclée, recousant les vestes de Taret-Acier pour les revendre avec une belle plus-value.
  - *Café des Fondeurs* (tenu par Jo Marchetti) : Le QG politique où les anciens métallos refont le monde au comptoir autour d'un quart de vin ou d'un café noir.
  - *Fleurs de Saint-Éloi* (tenu par Lucie Vannier) : Bouquets champêtres et plantes vertes ornant les appartements du faubourg.
  - *Répar’Tout* (tenu par Kofi Mensah) : L'atelier de réparation électronique et électroménager où rien ne se jette, du grille-pain des années 70 au smartphone à écran brisé.
  - *Papeterie du Faubourg* (tenue par Denise Arnaud) : Fournitures scolaires, carteries et registres de compte tenus au cordeau.
  - *Snack Saint-Éloi* (tenu par Ryad Benamar) : Kebabs et sandwichs chauds nourrissant les ouvriers du chantier et les noctambules.
- **Zone grise** : Travail de retouche textile à domicile non déclaré, ateliers de déblocage de téléphones d'occasion en arrière-boutique, et accords de caisse solidaire sans banque.

### 7.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Quartier en travaux : le tram n’y passe pas encore."`
* **Explication diégétique profonde** : La métropole a lancé un pharaonique chantier de prolongement de la ligne de tramway T1 devant traverser tout le faubourg d'est en ouest. Les chaussées de l'avenue Salvador-Allende et du boulevard Taret sont éventrées par des tranchées de deux mètres de profondeur pour poser les rails et dévier les conduites de gaz. La circulation générale est interdite par arrêté préfectoral, et des déviations réservées aux seuls riverains munis d'un macaron rendent le secteur impénétrable au commerce ambulant extérieur.

### 7.6 Ouverture & Métamorphose
Le quartier s'ouvre au **Palier 3** (15 ans), à l'achèvement de la première phase de pose des voies : les trottoirs élargis et pavés deviennent le couloir piétonnier le plus passant de la cité. Pour le joueur, c'est l'eldorado de l'implantation commerciale : des locaux de 30 à 80 m² disponibles à la location, un flux continu de milliers de passants quotidiens, et la possibilité d'ouvrir une boutique fixe concurrençant directement le Drive HyperVal par la chaleur du service et la proximité.

### 7.7 Scène du Multijoueur & Dynamiques de rivalité
Le Faubourg est l'arène de la **bataille de baux commerciaux (`bail_coupe`)** et de la **guerre des prix sur les produits frais**. Deux joueurs voulant ouvrir une épicerie fine ou un snack peuvent surenchérir sur le pas-de-porte d'un local vacant, débaucher le pâtissier vedette de leur rival (`debauchage`), ou nouer une alliance de recommandation croisée (`recommandation`) pour s'échanger leurs clientèles respectives.

---

## 8. Grand Ensemble des Roses Sud (`grand_ensemble`) — Les barres solidaires et la cité hospitalière

### 8.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'grand_ensemble'` | Nom de carte : `Grand Ensemble des Roses Sud` | District logique : `'grand_ensemble'` | Palier d'ouverture : `Tier 2` (13-14 ans).
* **Emprise géométrique** : $x \in [0, 827]$, $y \in [517, 837]$ ($w = 827$ m, $h = 320$ m).
* **Limites spatiales** : Sud-ouest de la ville, au sud des Berges de la Malterie, longeant la friche industrielle à l'est.
* **Rues principales du réseau `CITY.roads`** : `Boulevard du Grand Ensemble`, `Rue Pierre-Mendès-France`, `Avenue de l’Hôpital`, `Rue des Écluses`, `Rue Ambroise-Croizat`, `Rue Louise-Michel`.
* **Architecture dominante** : Grandes barres HLM longitudinales en béton préfabriqué teinté de 5 à 6 étages et tours de 10 à 14 étages (années 1968-1975), larges esplanades engazonnées ponctuées d'allées bitumées, complexes hospitaliers modernes en enduit crème à toits terrasses (`hopital`, îlot `s0803`).
* **Ambiance sensorielle** :
  - *Visuelle* : Les façades massives en damier beige et ocre s'illuminent de milliers de fenêtres dorées à la tombée de la nuit. L'esplanade des urgences de l'hôpital est balayée par les gyrophares bleus des ambulances.
  - *Sonore* : Le hurlement strident des sirènes du SAMU sur l'avenue de l'Hôpital, les rires et cris d'enfants jouant au ballon sur les dalles de jeux, le bruit des moteurs de scooters sur le boulevard, et les discussions sur les bancs publics au pied des cages d'escalier.
  - *Olfactive* : Odeurs de cuisine familiale mélangées (tajine, pot-au-feu, beignets), pelouse tondue en été, relents de bitume chaud et senteur d'antiseptique aux abords de l'hôpital.

### 8.2 Histoire & Racines ouvrières
Construit au tournant des années 1970 pour loger le flot d'ouvriers recrutés par Taret-Acier et le personnel du nouvel hôpital municipal, le Grand Ensemble était à son inauguration un modèle d'urbanisme hygiéniste et de dignité prolétarienne : eau chaude à tous les étages, vide-ordures, ascenseurs et espaces verts aérés.
Après le choc de 2014, le quartier a encaissé de plein fouet la montée de la précarité et du chômage. Mais loin des clichés sensationnalistes, les Roses Sud ont développé une culture d'auto-organisation remarquable : comités de locataires gérant les pannes d'ascenseurs, fêtes de voisins monstres sur les pelouses, et soutien sans faille aux soignants de l'hôpital municipal pendant les crises sanitaires. C'est ici que **Nora**, la mère du joueur, fait ses gardes de nuit épuisantes comme aide-soignante.

### 8.3 Sociologie & Habitants
Le cœur battant de la classe laborieuse de Val-Ferrand : soignantes, brancardiers, aides à domicile, chauffeurs de bus, livreurs, mais aussi les veuves des anciens métallos et une jeunesse vibrante qui cherche sa voie entre débrouille et études. L'entraide entre paliers y est la règle d'or : on dépose un plat chez la voisine âgée, on prête une perceuse, on garde les enfants pendant la garde de nuit d'une mère célibataire.

### 8.4 Commerces & Économie locale
Une économie de proximité axée sur les besoins essentiels et les petits budgets.
- **Tissu commercial de dalle** :
  - Épiceries solidaires et boucheries halal de quartier vendant en vrac et accordant le carnet de crédit gratuit en fin de mois.
  - Pharmacies d'officine desservant les urgences de l'hôpital 24h/24.
  - Salons de coiffure de quartier et ongleries devenus de véritables salons de discussion politique féminine.
  - Kiosques à journaux vendant papeterie, tickets de bus et confiseries aux écoliers.
- **Zone grise et solidarités informelles** : Marchés de vêtements d'enfants d'occasion sur les pelouses le samedi matin, préparation et vente informelle de plats cuisinés de famille pour les soignants pressés, et dépannage mécanique de voitures d'occasion sur les parkings au pied des barres.

### 8.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Réhabilitation des barres : chantier en cours."`
* **Explication diégétique profonde** : L'Agence Nationale pour la Rénovation Urbaine (ANRU) a engagé un vaste chantier d'isolation thermique par l'extérieur des barres de logements et de réaménagement des réseaux d'assainissement sur le boulevard du Grand Ensemble et la rue Mendès-France. Des échafaudages monumentaux recouvrent les façades, des bennes à gravats encombrent les allées, et la police municipale a bouclé les accès routiers pour des motifs de sécurité liés aux chutes de matériaux, interdisant le passage des véhicules non autorisés.

### 8.6 Ouverture & Métamorphose
L'accès est libéré au **Palier 2** (13-14 ans), quand les premiers échafaudages sont retirés. Pour le joueur, c'est l'entrée dans le bassin de population le plus dense de la ville : des milliers de clients potentiels pour des livraisons de goûters, de pain frais ou de services d'aide aux personnes âgées. C'est aussi l'opportunité de nouer des liens avec le personnel hospitalier pour fournir des paniers-repas équilibrés aux soignants de nuit comme Nora.

### 8.7 Scène du Multijoueur & Dynamiques de rivalité
Le Grand Ensemble est le terrain de la **solidarité populaire et du micro-crédit**. Les joueurs peuvent y coopérer via des mécaniques de **`garant_mutuel`** ou de **`formation`** (partage de compétences entre pairs). Mais un joueur prédateur peut tenter une **`guerre_des_prix`** agressive sur les produits de première nécessité (lait, farine, sucre) pour asphyxier les épiceries solidaires gérées par son concurrent, au risque de voir sa réputation citoyenne s'effondrer auprès des comités de locataires.

---

## 9. Friche Taret Sud (`friche_sud`) — Les cathédrales d'acier blessées et la terre à reconquérir

### 9.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'friche_sud'` | Nom de carte : `Friche Taret Sud` | District logique : `'friche_sud'` | Palier d'ouverture : `Tier 4` (16 ans).
* **Emprise géométrique** : $x \in [827, 1562]$, $y \in [517, 837]$ ($w = 735$ m, $h = 320$ m).
* **Limites spatiales** : Flanc sud-est de la ville, délimité à l'ouest par le Grand Ensemble, au nord par le faubourg et le canal, s'étendant jusqu'aux voies ferrées terminales.
* **Rues principales du réseau `CITY.roads`** : `Rue de la Coulée`, `Rue des Fondeurs`, `Rue du Haut-Fourneau`, `Boulevard Taret`, `Boulevard du Grand Ensemble`, `Rue des Écluses`, halle de coulée, anciens embranchements ferroviaires.
* **Architecture dominante** : Cathédrales industrielles géantes en acier riveté et briques décharnées, haut-fourneau géant n°2 désaffecté culminant à 45 mètres avec ses tuyères éventrées (`halle_taret`, îlot `B(2,1)`), crassier de scories, hangars ferroviaires abandonnés envahis par les herbes folles et les bouleaux pionniers.
* **Ambiance sensorielle** :
  - *Visuelle* : L'acier corrodé rouge-orange des tuyauteries contraste avec le ciel gris ardoise. La végétation spontanée pousse à travers les dalles de béton éclatées. Des fresques de street-art monumentales couvrent les pans de murs aveugles.
  - *Sonore* : Le grincement lugubre des tôles ondulées battues par le vent, le croassement des corbeaux nichant dans les poutrelles du haut-fourneau, le ruissellement de l'eau dans les caniveaux éventrés, et le silence pesant d'un monstre industriel endormi.
  - *Olfactive* : Odeur de rouille mouillée, de mâchefer, de terre végétale humide reconquérant le sol, et trace minérale de suie ancienne.

### 9.2 Histoire & Racines ouvrières
Ce lieu est le cœur de la blessure fondatrice de NEURAPOLIS : les 38 hectares du complexe sidérurgique intégré de Taret-Acier. C'est ici que le **14 avril 2014**, la direction financière londonienne a éteint pour toujours les feux des hauts-fourneaux, détruisant 2 900 emplois directs d'un trait de plume. Les ouvriers ont occupé le site pendant des mois, bravant les forces de l'ordre pour préserver les registres techniques et empêcher le pillage des métaux précieux.
C'est ici que repose l'héritage de **Lucien**, qui avait réuni dans les locaux du comité d'entreprise sa bibliothèque mythique de penseurs économiques pour armer intellectuellement ses camarades métallos.

### 9.3 Sociologie & Habitants
Officiellement, personne ne réside sur la friche, classée zone interdite. En réalité, le site abrite tout un écosystème d'artisans pionniers, de mécaniciens solidaires (comme **Karim** et son atelier vélo installé dans une halle réhabilitée), de ferrailleurs d'occasion, d'artistes plasticiens et de collectifs maraîchers qui testent la phytoremédiation des sols par les tournesols et les champignons.

### 9.4 Commerces & Économie locale
Une économie circulaire pionnière, fondée sur le réemploi et la réappropriation des moyens de production.
- **Activités de reconversion** :
  - *L'Atelier Populaire du Taret* : Réparation de cycles, fabrication de triporteurs et recyclage de pièces mécaniques.
  - *La Ressourcerie citoyenne* : Récupération de poutres métalliques, moteurs électriques d'époque et bois de charpente pour l'éco-construction.
  - Hangars de stockage géants pouvant être loués à très bas coût comme premiers dépôts logistiques de l'entreprise.
- **Zone grise** : Récupération clandestine de câbles de cuivre dans les gaines souterraines désaffectées, ateliers de mécanique sauvage nocturnes, et stockage discret de matériaux de construction sans taxe.

### 9.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Site Taret-Acier : dépollution en cours depuis 2014."`
* **Explication diégétique profonde** : Des grilles de chantier hérissées de barbelés et des panneaux préfectoraux menaçants (« Danger — Risque d'effondrement et pollution aux métaux lourds — Entrée interdite sous peine de poursuites pénales ») barrent la rue du Haut-Fourneau et le boulevard Taret. Une procédure judiciaire interminable oppose la métropole à l'ancien propriétaire pour financer la dépollution des sols saturés d'hydrocarbures et d'amiante, maintenant le site sous séquestre judiciaire gardé par une société de vigiles cynophiles.

### 9.6 Ouverture & Métamorphose
Le site s'ouvre au **Palier 4** (16 ans), lorsque le vote citoyen de la ville (Chapitre 4 de la campagne) arbitre enfin le destin de la friche entre le projet spéculatif d'HyperVal (centre commercial géant) et le projet de coopérative productive soutenu par le joueur. À l'ouverture, la friche devient le grand laboratoire de la réindustrialisation citoyenne : des milliers de mètres carrés couverts pour installer des fablabs, des ateliers de métallurgie décarbonée et des serres urbaines expérimentales.

### 9.7 Scène du Multijoueur & Dynamiques de rivalité
La Friche est le champ de bataille emblématique du jeu : qui contrôlera les halles de stockage à bas coût ? Les joueurs peuvent s'y livrer une guerre de **`signalement`** réglementaire (alerter la préfecture sur une non-conformité de sécurité chez le rival pour bloquer son entrepôt) ou y sceller le plus puissant des cartels de transformation productive en fondant une **`coentreprise`** coopérative capable de rivaliser avec les multinationales de la logistique.

---

## 10. Le Plateau de Bellevue (`bellevue`) — L'horizon civique, le lycée et le repos des aînés

### 10.1 Identité & Vue d'ensemble
* **Données cadastrales** : `id: 'bellevue'` | Nom de carte : `Bellevue` | District logique : `'bellevue'` | Palier d'ouverture : `Tier 3` (accès général à 15 ans) à `Tier 6` (grandes propriétés du sommet).
* **Emprise géométrique** : $x \in [0, 1562]$, $y \in [837, 1154]$ ($w = 1562$ m, $h = 317$ m).
* **Limites spatiales** : Toute la frange sud de la grande carte, dominant la cuvette industrielle depuis le plateau calcaire.
* **Rues principales du réseau `CITY.roads`** : `Chemin du Cimetière`, `Route du Plateau Blanc`, `Rue des Glycines`, `Rue du Lycée`, `Avenue de l’Hôpital`, `Allée des Hauts-Tilleuls`, `Chemin des Collines`, `Route de Néo-Baie`, `Rue de Bellevue`, `Rue des Vergers`, `Rue du Belvédère`.
* **Architecture dominante** : Bâtiments civiques modernes en pierre blanche et verre pour le Lycée Louise-Michel (`lycee`, îlot `s0806`), tribune en béton et gradins du Stade Marcel-Cerdan (`tribune`, îlot `s0809`), chapelle sobre en pierre de taille du Cimetière du Taret (`chapelle`, îlot `s1001`), et manoirs de villégiature entourés de parcs d'arbres centenaires.
* **Ambiance sensorielle** :
  - *Visuelle* : Une vue panoramique vertigineuse sur toute la vallée du Taret. Par temps clair, on distingue les toits de la ville historique, les méandres du canal et, au loin vers l'ouest, les eaux scintillantes de l'estuaire de Néo-Baie.
  - *Sonore* : Le son d'une cloche de lycée annonçant la fin des cours, les encouragements des supporters et le claquement des crampons sur la pelouse du stade de football le samedi, le vent soufflant dans les cyprès du cimetière, et le silence majestueux du belvédère.
  - *Olfactive* : Air pur et vif des hauteurs, parfum de glycine en fleur, odeur de papier neuf des manuels scolaires et senteur de buis taillé.

### 10.2 Histoire & Racines ouvrières
Le Plateau de Bellevue a d'abord été une terre agricole d'estive et de culture de seigle avant de devenir le pôle civique et éducatif d'altitude de Val-Ferrand dans les années 1960. La municipalité progressiste de l'époque avait voulu installer le grand lycée public et le stade sur les hauteurs pour offrir aux enfants d'ouvriers la lumière, le sport et la culture loin des suies des usines.
C'est également sur ce plateau que se trouve le **Cimetière communal du Taret**, où repose **Lucien** dans le carré des fondeurs, sous une sobre stèle d'acier brut coulée par ses camarades de Taret-Acier (secret `tombe_lucien`).

### 10.3 Sociologie & Habitants
Une société contrastée où se côtoient deux mondes : d'un côté, les élèves du lycée Louise-Michel (où le joueur poursuit ses études secondaires à 15 ans, aux côtés de Noah, Lina et des jeunes de tous les quartiers), les sportifs du club de foot ouvrier ; de l'autre, les propriétaires de villas cossues profitant de la vue imprenable sur la vallée et les aînés venus fleurir les tombes des disparus au cimetière.

### 10.4 Commerces & Économie locale
Le commerce de Bellevue est haut de gamme, exigeant et intellectuel.
- **Acteurs marchands de référence (`DISTRICT_SHOPS`)** :
  - *Maison Vasseur* (tenue par Charles Vasseur) : Épicerie fine d'importation (huiles d'olive grecques, cafés d'altitude colombiens, chocolats rares), fréquentée par la bourgeoisie de plateau qui ne regarde pas à la dépense.
  - *Le Pain de Bellevue* (tenu par Sophie Garnier) : Boulangerie artisanale au levain naturel utilisant les farines complètes du Plateau Blanc, pratiquant des tarifs élevés justifiés par une qualité irréprochable.
  - *Comptoir Bellevue* (tenu par Thomas Leclerc) : Concept-store branché associant café de spécialité, plantes d'intérieur et mode éthique, vendant avant tout une esthétique contemporaine.
  - *Librairie des Glycines* (tenue par Anne-Marie Roux) : Librairie littéraire et d'essais politiques où les enseignants et lycéens débattent autour des nouveautés éditoriales.
  - *Primeur des Hauts* (tenu par Moussa Saidi) : Fruits et légumes 100% bio et de saison, sourcés auprès des petits producteurs de la vallée.
- **Zone grise** : Rachat spéculatif de parcelles de terrain constructibles autour du belvédère et transactions discrètes sur des œuvres d'art et antiquités de famille.

### 10.5 Raison de fermeture initiale
* **Verrou textuel de `CITY_AREAS`** : `"Quartier résidentiel éloigné : il faudra le bus ou le vélo… et une raison d’y aller."`
* **Explication diégétique profonde** : Situé à plus de deux kilomètres de la Cité des Roses avec un dénivelé positif abrupt de plus de cent mètres, le Plateau de Bellevue est physiquement inaccessible aux jeunes collégiens de douze ou treize ans cantonnés aux cours de Jean-Moulin. La ligne de bus municipal n'y monte que deux fois par jour et les parents interdisent formellement aux enfants de s'aventurer sur la route départementale étroite et dépourvue de piste cyclable. Tant que le joueur n'a pas atteint l'âge du lycée (15 ans) ou acquis un moyen de locomotion adéquat (vélo révisé par Karim ou abonnement de transport scolaire), il n'y a aucune raison diégétique d'y grimper.

### 10.6 Ouverture & Métamorphose
L'accès s'ouvre naturellement au **Palier 3** (15 ans), lors de la rentrée solennelle en classe de seconde au Lycée Louise-Michel. Pour le joueur, Bellevue est la passerelle vers l'âge adulte : découverte des grands débats intellectuels, fréquentation d'une clientèle aisée capable d'acheter des produits à très forte marge pour financer les activités de groupe, et recueillement sur la tombe de Lucien pour renouveler la promesse de bâtir une économie juste. Aux paliers 5 et 6, le sommet du belvédère accueille les sièges sociaux des fondations et les assemblées générales du conglomérat.

### 10.7 Scène du Multijoueur & Dynamiques de rivalité
Bellevue est le sanctuaire de l'influence de prestige et de la **lutte de monopole (`monopole`)**. C'est le lieu idéal pour implanter un fleuron commercial vitrine (concept-store ou salon de thé d'élite) générant une rentabilité insolente, ou pour tenter un **`bail_coupe`** sur les emplacements rarissimes de la place de l'Église. Les joueurs s'y affrontent également sur le terrain de la réputation intellectuelle et du sponsoring du club de sport municipal pour remporter les votes du Conseil civique.

---

## 11. Matrice synthétique de cohérence systémique

Le tableau ci-dessous récapitule l'alignement absolu entre la bible narrative, les verrous du moteur (`layout.ts`) et les données marchandes (`district_shops.ts`) :

| Quartier (`id`) | Nom affiché | District | Palier | Coordonnées ($x, y, w, h$) | Chaîne de verrouillage (`lock`) verbatim | Commerçants résidents (`DISTRICT_SHOPS`) |
|---|---|---|---|---|---|---|
| `gare_est` | Gare Est | `gare` | Tier 2 | [417, 0, 164, 253] | `"Rénovation du quartier de la gare : ouverture prochaine."` | Mireille Castan, Hamid Rezki, Ange Peretti, Odette Lambrecht |
| `hyperval` | Zone HyperVal | `hyperval` | Tier 3 | [581, 0, 246, 253] | `"Zone commerciale réservée aux professionnels : carte de grossiste exigée."` | Grossistes `e102`, `e103` (Boissons, Fruits, Frais, Papeterie), grandes surfaces |
| `industrie` | Zone industrielle du Taret | `industrie` | Tier 4 | [827, 0, 328, 253] | `"Site industriel : accès réservé aux entreprises partenaires."` | Sous-traitance métallique, chaudronneries, ateliers de trempe |
| `collines` | Les Hauts du Taret | `collines` | Tier 3 | [1155, 0, 407, 253] | `"Lotissement privé : on n’y entre qu’invité·e."` | Services à domicile, traiteurs, paysagistes d'élite |
| `berges` | Berges de la Malterie | `berges` | Tier 2 | [0, 253, 581, 264] | `"Pont en travaux depuis la crue de 2019."` | Paulo Ferreira, Gérard Lefebvre, Aïcha Bouzid, Yann Le Goff, Rosa Mendès |
| `faubourg` | Faubourg Saint-Éloi | `faubourg` | Tier 3 | [581, 253, 981, 264] | `"Quartier en travaux : le tram n’y passe pas encore."` | Mehmet Yildiz, Brigitte Delorme, Nadia Haddad, Jo Marchetti, Lucie Vannier, Kofi Mensah, Denise Arnaud, Ryad Benamar |
| `grand_ensemble` | Grand Ensemble des Roses Sud | `grand_ensemble` | Tier 2 | [0, 517, 827, 320] | `"Réhabilitation des barres : chantier en cours."` | Épiceries solidaires, pharmacies d'urgences, commerces de dalle hospitalière |
| `friche_sud` | Friche Taret Sud | `friche_sud` | Tier 4 | [827, 517, 735, 320] | `"Site Taret-Acier : dépollution en cours depuis 2014."` | Atelier de Karim, ressourceries, hangars de stockage réhabilitables |
| `bellevue` | Bellevue | `bellevue` | Tier 3 | [0, 837, 1562, 317] | `"Quartier résidentiel éloigné : il faudra le bus ou le vélo… et une raison d’y aller."` | Charles Vasseur, Sophie Garnier, Thomas Leclerc, Anne-Marie Roux, Moussa Saidi |

---
*Fin du document canonique — docs/lore/QUARTIERS.md*
