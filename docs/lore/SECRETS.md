# NEURAPOLIS — Les Secrets de Val-Ferrand
## Guide canonique du lore, de l'histoire ouvrière et des mémoires enfouies

> **Document de référence lore et conception narrative**  
> Workflow AG-2 — Phase 4 : Secrets du monde & Lore associé.  
> Correspondance directe avec l'implémentation de données `src/data/secrets/secrets.ts`.  
> Ancrage historique : 1890 – 2020, Bassin sidérurgique et minier du Taret.

---

## 1. Introduction : La mémoire sous les pavés de Val-Ferrand

À Val-Ferrand, le sol n'est pas un simple décor géométrique : c'est un palimpseste industriel où se superposent plus d'un siècle de luttes ouvrières, d'innovations techniques clandestines, de solidarités discrètes et de mémoires refoulées. Des terrils de schiste de la rue des Houillères aux berges moussues du quai de la Malterie, chaque recoin de la cité recèle les vestiges d'une civilisation du travail que la fermeture des hauts-fourneaux de 2014 a tenté d'effacer.

Dans NEURAPOLIS, le système de secrets ne repose pas sur de simples coffres au trésor arbitraires : chaque secret est une **archive vivante**. Il relie un lieu géographique réel de la trame urbaine (`CITY.roads` ou ancres de quartier) à un moment charnière de l'histoire locale (la grève générale de 1974, les bulletins clandestins de 1936, les radios libres de 1983, l'ultime coulée de 2014). Découvrir un secret récompense le joueur par un objet de mémoire pour sa chambre d'ascension (`ROOM_ITEMS`), une notion économique fondamentale apprise sur le vif (`ECON_CONCEPTS`), ou une ressource d'entraide concrète.

Toutes les adresses au joueur et récits de découverte respectent une stricte **neutralité de genre**, permettant à chaque profil d'adolescent de s'approprier cette transmission patrimoniale.

---

## 2. Table synthétique des 16 secrets explorables

| ID | Titre | Localisation exacte | Fenêtre / Conditions | Récompense |
|---|---|---|---|---|
| `tombe_lucien` | La sépulture de Lucien au cimetière ouvrier | Rue des Houillères | 17h–21h, Soleil (Tier 2, Concepts 3) | Notion `communs` |
| `salle_muree_peuple` | La salle murée de la Maison du Peuple | Avenue Jean-Jaurès | 18h–21h, Semaine (Tier 3, Concepts 4) | `room_tampon_encreur_commercial` |
| `fournisseur_clandestin_pont` | Le troc nocturne sous le viaduc ferroviaire | Rue du Laminoir | 6h–8h, Samedi (Tier 2) | Notion `asymetrie_information` |
| `archives_verrerie` | Les registres secrets des maîtres-verriers | Rue de la Verrerie | 14h–18h (Concepts 3, Contact Samir) | `room_coffret_echantillons_metaux_rares` |
| `passage_souterrain_canal` | Le boyau d’évacuation de la Malterie | Quai de la Malterie | 20h–23h, Pluie (Tier 3, Contact Leïla) | 80 € d'argent liquide |
| `frequence_radio_secours` | L’émetteur de secours de Radio-Taret | Friche (Atelier) | 19h–22h (Concepts 2, Contact Karim) | `room_poste_radio_transistor` |
| `caisse_solidarite_mineurs` | La caisse de secours mutuel de la Mine | Rue de la Mine | 12h–14h (Tier 2) | 50 € d'argent liquide |
| `boussole_arpenteur_terril` | La boussole oubliée des géomètres du Taret | Rue Ambroise-Croizat | 10h–16h (Concepts 2) | `room_boussole_scout_cuivre` |
| `recette_tisane_bertin` | Le cahier secret d’infusions de Mme Bertin | Épicerie (Réserve) | 14h–18h, Mercredi (Tier 2, Contact Bertin) | Notion `souffrance_travail` |
| `tampon_imprimerie_clandestine` | La matrice d’imprimerie de Louise-Michel | Rue Louise-Michel | 16h–20h (Concepts 5) | Notion `capture_reglementaire` |
| `wagon_postal_gare` | Le wagon postal abandonné de l’Est | Boulevard de l'Est | 18h–22h (Tier 3) | Notion `effet_reseau` |
| `lingot_derniere_coulee` | Le lingot commémoratif de la dernière coulée | Rue des Forges | 11h–15h (Tier 3, Contact Samir) | `room_lingot_acier_grave_souvenir` |
| `herbier_abandonne_parc` | La grainothèque sauvage du Parc des Roses | Parc des Roses | 8h–12h, Soleil (Concepts 3) | `room_bocal_echantillons_graines` |
| `boite_vintage_bertin_archives` | La boîte à bonbons de la première épicerie | Rue Ambroise-Croizat | 14h–17h (Contact Bertin) | `room_boite_biscuits_vintage_bertin` |
| `lampe_etudes_laminoir` | La lampe d’ingénieur de l’Atelier | Friche (Mezzanine) | 15h–19h (Tier 2, Contact Karim) | `room_lampe_architecte_articulee` |
| `carte_vallee_dessin_inedit` | Le calque d’urbanisme d’époque | Collège (Géographie) | 12h–14h, Lun/Mar/Jeu/Ven (Concepts 4) | `room_carte_murale_valferrand_1970` |

---

## 3. Monographies détaillées des 16 secrets

### 1. `tombe_lucien` — La sépulture de Lucien au cimetière ouvrier

* **Emplacement** : `Rue des Houillères`, contre le muret de schiste noir du vieux carré des fondeurs.
* **Conditions de fouille** : Entre 17h00 et 21h00, par temps ensoleillé. Exige d'avoir atteint le Palier 2 et assimilé au moins 3 concepts économiques.
* **Indice diégétique** : Noté sur une coupure glissée dans les papiers de famille de Nora : *« Papy Lucien repose là où les terrils projettent leur ombre le soir, rue des Houillères. »*
* **Récompense** : Débloque la notion économique de carnet `communs` (Elinor Ostrom).
* **Histoire et mémoire ouvrière** :
  Lucien est mort en 2019, quelques mois avant l'orage initiatique du 31 août 2020. Délégué syndical respecté chez Taret-Acier, il avait refusé d'être inhumé dans le caveau familial des notables sur les hauteurs verdoyantes de la colline. Ses camarades métallurgistes ont fondu une sobre dalle d'acier brut, frappée d'une rose et de la devise : *« Ce que nous laissons appartient à ceux qui bâtissent »*.
* **Analyse socio-économique** :
  La tombe de Lucien incarne la philosophie des **communs** théorisée par Elinor Ostrom : les ressources partagées — qu'il s'agisse des machines d'un atelier, de la terre maraîchère ou du savoir technique — prospèrent durablement lorsqu'elles sont gouvernées par des règles collectives d'usage plutôt que par l'appropriation exclusive privée ou étatique.
* **Récit de découverte** :
  À la tombée du jour, les terrils étirent leurs silhouettes pointues sur la rue des Houillères. Derrière une grille entrouverte, au ras du muret de schiste moussu, la stèle de fonte capte les ultimes rayons dorés du soleil. En s'inclinant devant l'acier patiné où une rose sauvage a trouvé racine, le joueur recueille la certitude que bâtir une entreprise à Val-Ferrand n'a de sens que si l'œuvre accomplie enrichit le bien commun de la communauté.

---

### 2. `salle_muree_peuple` — La salle murée de la Maison du Peuple

* **Emplacement** : `Avenue Jean-Jaurès`, dissimulée derrière la grande boiserie de chêne du foyer civique.
* **Conditions de fouille** : En semaine (lundi au vendredi), entre 18h00 et 21h00. Exige le Palier 3 et 4 concepts.
* **Indice diégétique** : Une note des archives syndicales mentionne une pièce aveugle condamnée après la grève générale de l'hiver 1974, avenue Jean-Jaurès.
* **Récompense** : Objet de chambre `room_tampon_encreur_commercial` (bonus négociation +3).
* **Histoire et mémoire ouvrière** :
  Durant l'hiver 1974, face au lock-out patronal, les comités de grève occupent la Maison du Peuple. Pour protéger l'imprimerie clandestine et le stock de papier journal des perquisitions de la police préfectorale, les ouvriers maçonnent une double cloison derrière les lambris de la salle des fêtes. La pièce a été oubliée pendant près de cinquante ans.
* **Analyse socio-économique** :
  L'authentification et la formalisation contractuelle sont au cœur de l'échange marchand. Le tampon encreur retrouvé dans la cachette servait jadis à certifier les bons de rationnement et les certificats de solidarité intersyndicale. Il rappelle que la confiance institutionnelle se matérialise d'abord par des instruments tangibles de certification.
* **Récit de découverte** :
  En appuyant sur une moulure disjointe de la boiserie au fond de l'avenue Jean-Jaurès, un panneau pivote sur des gonds rouillés. Une odeur tenace d'encre typographique, d'huile de lin et de papier cellulosique jaillit de l'obscurité. Sur une table d'atelier poussiéreuse repose le lourd tampon de cuivre sculpté aux armoiries de la solidarité du Taret. Nettoyé et posé sur le bureau de la chambre, il devient le sceau officiel marquant les premiers contrats de l'entreprise.

---

### 3. `fournisseur_clandestin_pont` — Le troc nocturne sous le viaduc ferroviaire

* **Emplacement** : `Rue du Laminoir`, sous la troisième travée du pont en fonte de la voie ferrée.
* **Conditions de fouille** : Le samedi matin à l'aube, entre 6h00 et 8h00. Exige le Palier 2.
* **Indice diégétique** : Karim murmure à l'atelier qu'un ancien mécanicien à la retraite échange des roulements d'usine le samedi à l'aube, rue du Laminoir.
* **Récompense** : Notion économique de carnet `asymetrie_information` (George Akerlof).
* **Histoire et mémoire ouvrière** :
  Depuis le démantèlement des ateliers de maintenance en 2014, le marché des pièces détachées d'époque s'est replié sous le pont ferroviaire. Chaque samedi avant le lever du jour, des retraités ouvrent les coffres de leurs breaks pour échanger roulements à billes, courroies renforcées et pignons introuvables sur catalogue commercial.
* **Analyse socio-économique** :
  Ce troc illustre le modèle des « lemons » d'Akerlof sur l'**asymétrie d'information** : le vendeur connaît l'historique d'usure de la pièce alors que l'acheteur doit juger sur pièces à la lampe torche. En l'absence de garantie légale ou de label certifié, les prix s'effondrent ou la méfiance bloque les échanges équitables.
* **Récit de découverte** :
  La vapeur d'eau monte du sol humide de la rue du Laminoir tandis qu'un train de marchandises traverse le viaduc dans un fracas métallique. Sous l'arche de briques noircies, un vieil artisan en salopette de velours dévoile une caisse de roulements graissés. La négociation se fait à voix basse. En observant l'échange sans garantie formelle, le joueur saisit pourquoi la transparence sur la qualité est le premier capital d'un commerçant loyal.

---

### 4. `archives_verrerie` — Les registres secrets des maîtres-verriers

* **Emplacement** : `Rue de la Verrerie`, dans un regard technique dissimulé sous les pavés de l'ancien atelier.
* **Conditions de fouille** : Entre 14h00 et 18h00. Exige 3 concepts et d'avoir débloqué le contact de Samir Ould-Ali.
* **Indice diégétique** : Samir se rappelle que les formules de trempe thermique de 1960 avaient été scellées sous le trottoir de la rue de la Verrerie pour éviter l'espionnage industriel.
* **Récompense** : Objet de chambre `room_coffret_echantillons_metaux_rares` (bonus recherche +4).
* **Histoire et mémoire ouvrière** :
  Avant de céder la place à la grande sidérurgie, Val-Ferrand abritait une verrerie de haute précision fabriquant les optiques des phares de locomotives et les éprouvettes de laboratoire. Les maîtres-verriers gardaient jalousement leurs cahiers de charges de silice, de plomb et de manganèse.
* **Analyse socio-économique** :
  Le capital immatériel et la propriété intellectuelle informelle sont souvent le trésor caché des bassins manufacturiers. La maîtrise des matériaux spéciaux constitue un avantage comparatif déterminant pour toute reconversion vers les technologies vertes et les mobilités douces.
* **Récit de découverte** :
  Guidé par les souvenirs précis de Samir, le joueur descellé une dalle de granit usée par les pas des ouvriers rue de la Verrerie. Sous la plaque, une cassette de plomb scellée à la poix protège des éprouvettes scellées et des lingotins d'alliages fins. Ce nuancier d'échantillons rares rejoint la chambre d'études pour inspirer de futurs prototypes industriels.

---

### 5. `passage_souterrain_canal` — Le boyau d’évacuation de la Malterie

* **Emplacement** : `Quai de la Malterie`, un conduit maçonné à fleur d'eau caché derrière la coque d'une péniche amarrée.
* **Conditions de fouille** : Entre 20h00 et 23h00, par temps de pluie. Exige le Palier 3 et le contact de Leïla.
* **Indice diégétique** : Un vieux batelier raconte sur le quai qu'un tunnel reliait jadis la brasserie au canal pour charger de nuit sans payer la taxe d'octroi municipal.
* **Récompense** : 80 € en espèces (fond de caisse d'époque réutilisable).
* **Histoire et mémoire ouvrière** :
  L'ancienne Malterie de Val-Ferrand produisait des milliers d'hectolitres de bière de garde. Pour contourner les lourdes taxes d'octroi prélevées aux barrières de la ville avant les réformes de 1948, les brasseurs avaient fait creuser une galerie voûtée débouchant directement dans les cales des péniches de transport.
* **Analyse socio-économique** :
  L'histoire fiscale enseigne que des barrières tarifaires locales excessives incitent inévitablement au développement d'une économie souterraine. Les gains de productivité logistique exigent la levée des rentes de passage indues et une tarification transparente.
* **Récit de découverte** :
  Sous une pluie battante qui fait clapoter les eaux sombres du canal de la Malterie, le joueur se faufile le long de la coque de fer riveté d'une péniche. Une arche de briques basses s'ouvre au niveau du clapotis. Au creux d'une niche étanche, une boîte en fer-blanc garde intacte une poignée de coupures et de pièces de monnaie préservées des crues : un coup de pouce bienvenu pour la trésorerie de la jeune entreprise.

---

### 6. `frequence_radio_secours` — L’émetteur de secours de Radio-Taret

* **Emplacement** : `friche` (Atelier Populaire), dans la gaine technique de l'ancien transformateur haute tension.
* **Conditions de fouille** : En soirée de 19h00 à 22h00. Exige 2 concepts et le contact de Karim.
* **Indice diégétique** : Une note griffonnée au dos du schéma électrique de Karim mentionne une fréquence de relais FM cachée dans la friche.
* **Récompense** : Objet de chambre `room_poste_radio_transistor` (bonus recherche +2).
* **Histoire et mémoire ouvrière** :
  Pendant les rudes grèves de l'hiver 1983, la préfecture avait déployé des camions de brouillage goniométrique pour faire taire « Radio-Taret Libre », la voix pirate des ateliers. Les techniciens grévistes avaient installé un émetteur de secours automatique à quartz commutables dans un ancien transformateur désaffecté de la friche.
* **Analyse socio-économique** :
  La diffusion de l'information et le pluralisme des médias conditionnent l'équilibre des forces sur le marché du travail. Sans canaux de communication autonomes, l'opinion publique est captive des récits produits par les monopoles industriels.
* **Récit de découverte** :
  Au fond de la halle sud de la friche, derrière un panneau métallique orné d'un éclair triangulaire, Karim montre du doigt une gaine coupe-feu. À l'intérieur, un boîtier d'émission à lampes et transistors relié à une antenne dipôle artisanale capte encore le souffle des ondes courtes. Nettoyé, le transistor vintage trône désormais sur l'étagère de la chambre, diffusant chaque matin les nouvelles économiques de la région.

---

### 7. `caisse_solidarite_mineurs` — La caisse de secours mutuel de la Mine

* **Emplacement** : `Rue de la Mine`, dans une niche derrière une borne d'amarrage en fonte scellée au trottoir.
* **Conditions de fouille** : Entre 12h00 et 14h00. Exige le Palier 2.
* **Indice diégétique** : Une dépêche historique dans un vieux numéro de La Gazette évoque la tirelire des mineurs de fond, dissimulée rue de la Mine pour secourir les familles des blessés.
* **Récompense** : 50 € en espèces.
* **Histoire et mémoire ouvrière** :
  Avant la création du régime général de sécurité sociale en 1945 sous l'impulsion d'Ambroise Croizat, les mineurs du puits n°4 finançaient eux-mêmes leur caisse de secours. Chaque fin de quinzaine, une fraction de paye était déposée dans une urne secrète pour indemniser les veuves de la silicose et les blessés de grisou.
* **Analyse socio-économique** :
  La mutualisation solidaire du risque est l'ancêtre direct de la protection sociale moderne. Elle démontre que la coopération volontaire et l'assurance mutuelle naissent des besoins concrets d'une communauté exposée à l'aléa industriel.
* **Récit de découverte** :
  À midi, sous le soleil qui blanchit le pavé de la rue de la Mine, le joueur inspecte la lourde borne en fonte autrefois destinée à l'attelage des wagonnets à chevaux. Derrière une trappe dérobée fermée par un ergot à ressort, une tirelire en tôle peinte livre un trésor d'époque. L'argent récupéré témoigne de l'abnégation d'une génération qui savait que personne ne survit seul face au risque.

---

### 8. `boussole_arpenteur_terril` — La boussole oubliée des géomètres du Taret

* **Emplacement** : `Rue Ambroise-Croizat`, au pied du transformateur électrique d'angle.
* **Conditions de fouille** : Entre 10h00 et 16h00. Exige 2 concepts.
* **Indice diégétique** : Un vieux plan d'arpentage de la cité mentionne un repère de nivellement géodésique rue Ambroise-Croizat.
* **Récompense** : Objet de chambre `room_boussole_scout_cuivre` (bonus plan +2).
* **Histoire et mémoire ouvrière** :
  L'extraction massive de la houille sous la ville provoquait des affaissements miniers lents mais réguliers menaçant les fondations des barres d'habitation. Les géomètres de la Compagnie des Mines utilisaient des boussoles d'arpenteur à visée optique pour mesurer millimètre par millimètre les mouvements de terrain.
* **Analyse socio-économique** :
  L'anticipation des risques d'infrastructure et l'aménagement territorial rationnel évitent les coûts externes imprévus qui ruinent les villes mono-industrielles. L'arpentage rigoureux symbolise la planification éclairée contre l'improvisation aveugle.
* **Récit de découverte** :
  Rue Ambroise-Croizat, contre le socle de béton d'un transformateur, un regard technique en fonte dissimule un étui en cuir bouilli. À l'intérieur, l'instrument de visée en laiton lourd tourne encore avec une fluidité parfaite sur son pivot de saphir. Posée sur le bureau du joueur, cette boussole guide désormais la structuration spatiale des tournées commerciales.

---

### 9. `recette_tisane_bertin` — Le cahier secret d’infusions de Mme Bertin

* **Emplacement** : `epicerie` (réserve Bertin), sous le tiroir à double fond de l'armoire aux épices.
* **Conditions de fouille** : Le mercredi après-midi entre 14h00 et 18h00. Exige le Palier 2 et le contact de Mme Bertin.
* **Indice diégétique** : Mme Bertin confie un jour : *« Mon mélange secret pour calmer les nerfs après les inventaires est noté au fond de mon meuble d'apothicaire. »*
* **Récompense** : Notion économique de carnet `souffrance_travail` (Christophe Dejours).
* **Histoire et mémoire ouvrière** :
  Mme Bertin tient son épicerie depuis plus de cinquante ans. Observatrice attentive des drames intimes du quartier, elle voyait défiler les ouvriers aux membres meurtris et les mères de famille exténuées par les cadences. Faute de psychologues ou de médecine préventive, elle cueillait tilleul, reine-des-prés et mélisse sur les coteaux pour préparer des infusions apaisantes offertes avec une oreille bienveillante.
* **Analyse socio-économique** :
  La pensée de Christophe Dejours met en lumière la **souffrance au travail** et la dissociation entre travail prescrit et travail réel. L'économie ne repose pas uniquement sur des bilans comptables, mais sur la santé psychique et physique de celles et ceux qui produisent la richesse au quotidien.
* **Récit de découverte** :
  Un mercredi d'inventaire, profitant de la confiance accordée par l'épicière, le joueur glisse la main sous la lourde armoire d'apothicaire de la réserve. Trois cahiers d'écolier à couverture marbrée révèlent les recettes d'herboristerie de Mme Bertin, accompagnées de notes émouvantes sur les détresses des habitants du quartier. Cette découverte enseigne que la première responsabilité d'une entreprise réside dans le soin apporté à ses équipes.

---

### 10. `tampon_imprimerie_clandestine` — La matrice d’imprimerie de Louise-Michel

* **Emplacement** : `Rue Louise-Michel`, dans le conduit de cheminée aveugle du grand porche d'entrée en briques.
* **Conditions de fouille** : Entre 16h00 et 20h00. Exige 5 concepts économiques.
* **Indice diégétique** : La Gazette des Roses cite une cachette sous le porche de la rue Louise-Michel où les premiers bulletins ouvriers étaient composés dans les années 1930.
* **Récompense** : Notion économique de carnet `capture_reglementaire` (George Stigler).
* **Histoire et mémoire ouvrière** :
  En 1936, lors des grèves du Front populaire, les magnats de la sidérurgie locale avaient fait voter des arrêtés préfectoraux interdisant l'affichage municipal et réquisitionnant les imprimeries commerciales. Les militants du quartier avaient alors caché des casses typographiques et une presse à bras sous le porche de la rue Louise-Michel pour publier leurs propres feuilles d'information.
* **Analyse socio-économique** :
  La **capture réglementaire**, conceptualisée par George Stigler, décrit la façon dont les acteurs économiques dominants instrumentalisent la puissance publique et les normes légales pour ériger des barrières à l'entrée et neutraliser toute émergence concurrente ou critique.
* **Récit de découverte** :
  Sous le porche monumental de briques rouges de la rue Louise-Michel, un regard attentif révèle un conduit de cheminée condamné par une plaque de tôle peinte. En retirant la tôle, le joueur extrait une matrice typographique en plomb gravée de la formule : *« Pain, Paix, Liberté »*. Une leçon magistrale sur la vigilance démocratique face aux dérives de la connivence économique.

---

### 11. `wagon_postal_gare` — Le wagon postal abandonné de l’Est

* **Emplacement** : `Boulevard de l'Est`, derrière le grillage rouillé du faisceau de voies de triage de la gare.
* **Conditions de fouille** : En soirée de 18h00 à 22h00. Exige d'avoir atteint le Palier 3.
* **Indice diégétique** : Un cheminot retraité raconte qu'un wagon postal dort sur les voies de garage du Boulevard de l'Est depuis le dernier tri nocturne de l'hiver 1996.
* **Récompense** : Notion économique de carnet `effet_reseau` (Joseph Schumpeter).
* **Histoire et mémoire ouvrière** :
  Avant la généralisation d'Internet et la centralisation des plateformes de messagerie, les trains postaux assuraient le tri ambulant du courrier durant les trajets nocturnes. Des centaines de postiers parcouraient la vallée chaque nuit pour acheminer lettres, mandats et catalogues commerciaux vers la moindre bourgade isolée.
* **Analyse socio-économique** :
  Le maillage ferroviaire et postal est l'archétype de l'**effet de réseau** : chaque nouvelle commune raccordée à la ligne augmentait la valeur du réseau tout entier pour l'ensemble des usagers déjà connectés. Ce principe gouverne aujourd'hui les plateformes numériques et les réseaux de distribution modernes.
* **Récit de découverte** :
  En longeant le faisceau de voies désaffectées du Boulevard de l'Est sous les lueurs orangées des lampadaires sodium, le joueur découvre la carcasse bordeaux d'un wagon postal ambulant. Les casiers de tri en bois de hêtre portent encore les plaques émaillées de toutes les gares de la vallée : Néo-Baie, Plateau Blanc, La Houillère. En observant cette ruine logistique, le joueur saisit toute la puissance d'une infrastructure interconnectée.

---

### 12. `lingot_derniere_coulee` — Le lingot commémoratif de la dernière coulée

* **Emplacement** : `Rue des Forges`, scellé dans la maçonnerie du muret d'enceinte de l'ancienne forge.
* **Conditions de fouille** : Entre 11h00 et 15h00. Exige le Palier 3 et le contact de Samir.
* **Indice diégétique** : Samir évoque avec une vive émotion un morceau d'acier frappé du sceau de 2014, caché dans un mur de la rue des Forges.
* **Récompense** : Objet de chambre `room_lingot_acier_grave_souvenir` (bonus stress -6).
* **Histoire et mémoire ouvrière** :
  Le 14 avril 2014, les ouvriers de Taret-Acier apprennent l'extinction définitive du haut-fourneau n°1. Avant que le convertisseur ne refroidisse pour toujours, Samir et une poignée de fondeurs prélèvent en cachette quelques kilos de fonte liquide dans une lingotière artisanale pour fabriquer des lingots commémoratifs gravés du millésime de leur sacrifice.
* **Analyse socio-économique** :
  La désindustrialisation ne détruit pas seulement des capacités de production : elle brise des identités professionnelles séculaires. Le lingot symbolise la résistance de la fierté ouvrière contre la logique financière court-termiste des délocalisations.
* **Récit de découverte** :
  Sous le soleil zénithal de la rue des Forges, Samir guide la main du joueur vers une brique creuse scellée au mortier de chaux. Au fond de la cavité repose le lourd lingot d'acier de cinq kilos, froid, dense et poli au grain fin. L'inscription gravée *« 2014 — Résiste et bâtis »* inspire un profond respect. Posé sur le meuble de la chambre, il devient un rappel permanent de l'obligation morale de reconstruire un avenir digne pour la cité.

---

### 13. `herbier_abandonne_parc` — La grainothèque sauvage du Parc des Roses

* **Emplacement** : `parc` (Parc des Roses), au cœur du tronc creux du vieux saule pleureur au bord du bassin d'eau.
* **Conditions de fouille** : Le matin entre 8h00 et 12h00, par temps ensoleillé. Exige 3 concepts.
* **Indice diégétique** : Lucien notait dans ses carnets : *« Les enfants du quartier ont caché leurs graines de tournesol dans le tronc du saule du parc. »*
* **Récompense** : Objet de chambre `room_bocal_echantillons_graines` (bonus chance +2).
* **Histoire et mémoire ouvrière** :
  Dans les années 1980, les cités ouvrières disposaient de jardins familiaux gérés en commun. Face aux risques de pollution par les poussières de métaux lourds et aux menaces de sélection génétique par l'agro-industrie, les familles échangeaient des semences paysannes rustiques adaptées aux sols locaux et les mettaient à l'abri dans le tronc du saule centenaire.
* **Analyse socio-économique** :
  La préservation des semences paysannes hors des circuits brevetés des multinationales de l'agrochimie est un exemple éclatant de résistance écologique et d'autonomie alimentaire. C'est l'illustration concrète de la théorie du « Donut » de Kate Raworth, alliant sécurité sociale et respect des limites biosphériques.
* **Récit de découverte** :
  La rosée matinale scintille sur l'herbe du Parc des Roses. En s'approchant du grand saule pleureur dont les branches trempent dans l'eau calme du bassin, le joueur découvre au creux de l'écorce rugueuse un bocal de verre épais rempli de sachets en papier kraft. Les graines de blé ancien et de tournesol rustique y ont survécu intactes, prêtes à réensemencer les toitures végétalisées et les jardins coopératifs de demain.

---

### 14. `boite_vintage_bertin_archives` — La boîte à bonbons de la première épicerie

* **Emplacement** : `Rue Ambroise-Croizat`, derrière la grille de ventilation basse d'une cave d'immeuble.
* **Conditions de fouille** : L'après-midi de 14h00 à 17h00. Exige le contact de Mme Bertin.
* **Indice diégétique** : Mme Bertin se souvient avec nostalgie avoir égaré une boîte en fer-blanc de 1968 lors de son premier emménagement rue Croizat.
* **Récompense** : Objet de chambre `room_boite_biscuits_vintage_bertin` (bonus chance +2).
* **Histoire et mémoire ouvrière** :
  Arrivée à Val-Ferrand au printemps 1968, la jeune épicière Bertin ouvre sa première boutique au rez-de-chaussée d'une barre HLM flambant neuve. Elle y conserve ses tout premiers carnets de crédit gratuit : à l'époque, les ouvriers payaient leurs courses à la fin du mois, après la paye de l'usine.
* **Analyse socio-économique** :
  Le crédit interpersonnel fondé sur l'interconnaissance et l'estime réciproque est le fondement du capital social dans les économies populaires. Sans ce crédit informel sans intérêt, les familles ouvrières n'auraient pu surmonter les accidents de la vie et les retards de salaires.
* **Récit de découverte** :
  En inspectant le soupirail d'aération d'une cave rue Ambroise-Croizat, le joueur dégage un parallélépipède de métal rouillé à l'extérieur mais scellé par un joint de cire. Le couvercle en tôle lithographiée représente un marché des années 1960 aux couleurs pastel. À l'intérieur reposent les premiers registres de caisse manuscrits de Mme Bertin et trois médailles du travail. Nettoyée, cette boîte vintage trouve sa place dans la chambre pour garder les premiers bénéfices d'ascension.

---

### 15. `lampe_etudes_laminoir` — La lampe d’ingénieur de l’Atelier

* **Emplacement** : `friche` (mezzanine sud), derrière une armoire électrique éventrée de l'ancien bureau des méthodes.
* **Conditions de fouille** : Entre 15h00 et 19h00. Exige le Palier 2 et le contact de Karim.
* **Indice diégétique** : Karim indique qu'une lampe d'architecte intacte est restée abandonnée sur la mezzanine poussiéreuse de la halle du laminoir.
* **Récompense** : Objet de chambre `room_lampe_architecte_articulee` (bonus recherche +2).
* **Histoire et mémoire ouvrière** :
  Dans les années 1970, le bureau d'études du laminoir employait une vingtaine de dessinateurs industriels chargés de concevoir les poutrelles géantes destinées aux viaducs et aux charpentes de Néo-Baie. Sur chaque table à dessin trônait une lampe articulée d'ingénieur en acier laqué vert.
* **Analyse socio-économique** :
  L'organisation scientifique du travail (Taylor) s'est longtemps appuyée sur ces bureaux des méthodes pour standardiser les gestes de fabrication. Récupérer cet instrument d'ingénierie, c'est se réapproprier les outils de la rigueur technique au profit de projets choisis librement.
* **Récit de découverte** :
  Gravissant l'escalier en caillebotis métallique de la friche industrielle, le joueur atteint la mezzanine baignée de poussière suspendue dans les rais de lumière. Derrière l'armoire électrique déclassée, la lampe articulée d'architecte n'a rien perdu de sa grâce mécanique : ses ressorts en acier trempé répondent au doigt et à l'œil. Installée sur l'établi de travail, elle offre un halo précis et chaleureux pour dessiner les plans d'entreprise.

---

### 16. `carte_vallee_dessin_inedit` — Le calque d’urbanisme d’époque

* **Emplacement** : `college` (Collège Jean-Moulin), au dos d'un panneau d'affichage de la salle de géographie.
* **Conditions de fouille** : Les jours d'école (lundi, mardi, jeudi, vendredi) entre 12h00 et 14h00. Exige 4 concepts économiques.
* **Indice diégétique** : Yasmine a remarqué un rouleau de papier calque punaisé derrière les vieilles cartes scolaires du collège Jean-Moulin.
* **Récompense** : Objet de chambre `room_carte_murale_valferrand_1970` (bonus plan +3).
* **Histoire et mémoire ouvrière** :
  En 1970, des urbanistes progressistes et des délégués ouvriers avaient rédigé un contre-projet d'aménagement face aux premiers plans de zonage ségrégatifs des promoteurs. Ils avaient dessiné sur calque une cité-jardin idéale combinant lignes de tramway électrique, cités arborées, ceintures maraîchères et ateliers d'apprentissage intégrés.
* **Analyse socio-économique** :
  L'aménagement urbain n'est jamais neutre : il reflète les rapports de force entre capital immobilier et bien-être des populations. Retrouver ce plan d'urbanisme pionnier, c'est reconnecter le projet économique du joueur aux idéaux d'émancipation spatiale de Val-Ferrand.
* **Récit de découverte** :
  Pendant la pause méridienne au collège, le joueur inspecte discrètement l'arrière des cartes de France suspendues en salle de géographie. Un rouleau de papier calque jauni se détache : le tracé minutieux à l'encre de Chine et au lavis d'aquarelle dévoile une métropole du Taret harmonieuse, humaine et solidaire. Punaisée au mur de la chambre d'adolescent, cette carte monumentale devient le plan directeur guidant l'expansion des futures activités.

---

## 4. Cohérence systémique et intégration technique

Chaque secret documenté ci-dessus est strictement articulé avec les moteurs du jeu :
1. **Lieux et coordonnées** : Les entrées `where.street` correspondent rigoureusement aux 10 voies du tableau `CITY.roads` (`src/data/city/layout.ts`), tandis que les entrées `where.place` s'ancrent dans `PLACE_ANCHORS` (`maison`, `college`, `epicerie`, `friche`, `parc`, `place`).
2. **Récompenses d'objets** : Tous les identifiants d'objets `room_*` existent dans le registre certifié `ROOM_ITEMS` (`src/data/room/items.ts`), conférant des bonus de statistiques cohérents avec leur rôle narratif.
3. **Récompenses conceptuelles** : Les concepts débloqués (`communs`, `asymetrie_information`, `souffrance_travail`, `capture_reglementaire`, `effet_reseau`) s'intègrent dans le Carnet d'économie du joueur (`src/data/ascension/concepts.ts` et `src/data/ascension_ext/concepts.ts`).
4. **Validation continue** : L'ensemble des 16 secrets est validé sans anomalie par les suites de tests unitaires et la compilation stricte TypeScript.
