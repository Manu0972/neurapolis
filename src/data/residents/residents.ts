/**
 * NEURAPOLIS — Habitants nommés des 9 quartiers d'extension (Workflow AG-3 Phase 1)
 *
 * Trente-six habitants uniques (exactement 4 par quartier), ancrés dans la géographie
 * réelle de Val-Ferrand (rues exactes de CITY.roads), avec leur rôle social, leurs
 * répliques caractéristiques et leurs rumeurs pointant vers des secrets, des idées
 * d'Ascension et des secteurs économiques.
 *
 * Invariants stricts :
 * - Données pures typées et déterministes (aucun Math.random, aucun Date.now).
 * - Neutralité de genre absolue : aucun vocatif genré adressé au joueur ({prenom} utilisé).
 * - Intégrité référentielle : rues, secretId, ideaId, ghost et sector valides.
 */
import type { Sector } from '../../core/happenings_types';

export type ResidentDistrict =
  | 'gare_est'
  | 'hyperval'
  | 'industrie'
  | 'collines'
  | 'berges'
  | 'faubourg'
  | 'grand_ensemble'
  | 'friche_sud'
  | 'bellevue';

export interface ResidentDef {
  /** Identifiant unique en snake_case sans accent. */
  id: string;
  /** Nom complet du personnage (Prénom Nom). */
  name: string;
  /** Âge réaliste du personnage (14 à 85 ans). */
  age: number;
  /** Métier ou rôle social à Val-Ferrand. */
  role: string;
  /** Quartier de résidence parmi les 9 districts. */
  district: ResidentDistrict;
  /** Nom EXACT d'une rue issue de CITY.roads qui traverse ce quartier. */
  street: string;
  /** Plage horaire de présence [début, fin) en minutes depuis minuit (0 à 1440). */
  hours: [number, number];
  /** Première réplique d'accueil au joueur (non genrée). */
  greeting: string;
  /** Au moins 5 répliques immersives (lines.length >= 5). */
  lines: string[];
  /** Au moins 2 rumeurs pointant vers un secret, une idée ou un secteur. */
  rumors: {
    text: string;
    secretId?: string;
    ideaId?: string;
    sector?: Sector;
  }[];
  /** Penseur canonique que ce personnage évoque ou interpelle (facultatif). */
  ghost?: string;
  /** Personnage existant lié (famille, commerçant, ami, contact - facultatif). */
  link?: string;
}

export const RESIDENTS: readonly ResidentDef[] = [
  // =========================================================================
  // 1. GARE EST (4 habitants)
  // Rues valides : Rue de la Gare, Avenue des Grossistes, Rue de la Mine, Rue des Forges
  // =========================================================================
  {
    id: 'res_hamid_cheminot',
    name: 'Hamid Belkacem',
    age: 58,
    role: 'Aiguilleur retraité du triage Est',
    district: 'gare_est',
    street: 'Rue de la Gare',
    hours: [360, 780],
    greeting: "Salut {prenom}. Le premier train de fret arrive toujours avant l'aube.",
    lines: [
      "Quarante ans à surveiller les aiguilles du triage Est. Le fer ne ment jamais.",
      "Quand un train déraille, ce n'est pas le hasard, c'est l'usure qu'on n'a pas voulu chiffrer.",
      "On voit défiler toute la production de la vallée ici : l'acier de Taret, les caisses de l'épicerie, les bobines de cuivre.",
      "Les nouveaux wagons sont automatisés, mais ils ne savent pas sentir l'odeur d'un essieu qui chauffe.",
      "Si tu cherches du travail solide, regarde d'abord comment circulent les marchandises.",
    ],
    rumors: [
      {
        text: "Il paraît qu'un vieux wagon postal est resté sur une voie de garage depuis 1996, plein d'archives non distribuées.",
        secretId: 'wagon_postal_gare',
      },
      {
        text: "Le trafic de fret sur la vallée pourrait doubler si les camionnettes électriques se branchaient aux quais.",
        ideaId: 'transport_vallee',
        sector: 'logistique',
      },
    ],
    ghost: 'taylor',
    link: 'karim',
  },
  {
    id: 'res_solange_grossiste',
    name: 'Solange Vasseur',
    age: 46,
    role: "Répartitrice en centrale d'achat",
    district: 'gare_est',
    street: 'Avenue des Grossistes',
    hours: [450, 1050],
    greeting: "Bonjour {prenom}. Tu viens négocier un arrivage ou regarder les palettes ?",
    lines: [
      "Ici, on ne vend pas au kilo, on vend à la palette. Chaque centime sur le volume fait la marge du mois.",
      "Les petits commerçants du centre devraient s'unir : seuls, ils se font écraser par les remises des géants.",
      "J'ai vu passer trois camions frigorifiques ce matin. Tout part vers HyperVal si on ne retient pas la marchandise.",
      "Un bon carnet d'adresses vaut plus qu'un coffre-fort dans ce métier.",
      "Tiens tes comptes au centime près, {prenom}, sinon le fret te mangera tout ton bénéfice.",
    ],
    rumors: [
      {
        text: "Si plusieurs épiceries indépendantes montaient une vraie centrale d'achat commune, elles tiendraient tête au Drive.",
        ideaId: 'centrale_achat',
        sector: 'commerce',
      },
      {
        text: "Un gars du pont vend du stock déclassé à l'aube, mais personne ne sait d'où viennent ses cartons.",
        secretId: 'fournisseur_pont',
      },
    ],
    ghost: 'ford',
    link: 'bertin',
  },
  {
    id: 'res_claire_guichetiere',
    name: 'Claire Delaunay',
    age: 31,
    role: 'Guichetière et syndicaliste ferroviaire',
    district: 'gare_est',
    street: 'Rue de la Mine',
    hours: [480, 1020],
    greeting: "Bienvenue à la Gare Est, {prenom}. Prends garde aux quais glissants ce matin.",
    lines: [
      "La ligne vers Néo-Baie n'a que trois trains par jour. C'est trop peu pour désenclaver les ouvriers.",
      "Dans les vieux registres de la mine, on voit qu'une caisse de solidarité payait les billets des familles en détresse.",
      "Les gens viennent au guichet pour acheter un billet, mais souvent ils restent dix minutes juste pour parler.",
      "La rentabilité d'un service public ne se mesure pas au profit du guichet, mais au temps gagné par la ville entière.",
      "Observe le flux des voyageurs à 17 heures : c'est le pouls de Val-Ferrand.",
    ],
    rumors: [
      {
        text: "On dit qu'une caisse de secours mutuel des mineurs de fond est encore scellée derrière une borne d'amarrage.",
        secretId: 'caisse_solidarite_mineurs',
      },
      {
        text: "La billetterie connectée et les cartes locales pourraient relier tous les commerces de la gare.",
        ideaId: 'appli_commercants',
        sector: 'tech',
      },
    ],
    ghost: 'keynes',
  },
  {
    id: 'res_igor_ferrailleur',
    name: 'Igor Stankovic',
    age: 52,
    role: 'Récupérateur de métaux et ferrailleur de quai',
    district: 'gare_est',
    street: 'Rue des Forges',
    hours: [540, 1140],
    greeting: "Salut {prenom}. Rien ne se jette, tout se pèse et tout se revend.",
    lines: [
      "Le laiton a pris dix pour cent cette semaine sur les cours internationaux. Mes bennes valent de l'or.",
      "Les forges ont fermé, mais la ferraille continue de couler comme un fleuve sous la ville.",
      "Donne-moi une tonne de vieilles ferrures et un poste à souder, je te monte un hangar complet.",
      "Beaucoup croient que c'est un métier sale. En réalité, c'est le cœur de l'économie circulaire.",
      "Garde l'œil ouvert sur les cours des métaux : quand le cuivre baisse, l'industrie ralentit le mois suivant.",
    ],
    rumors: [
      {
        text: "Il paraît qu'un lingot commémoratif de la dernière coulée de 2014 est caché dans un muret de forge.",
        secretId: 'lingot_derniere_coulee',
      },
      {
        text: "Un atelier coopératif d'usinage pourrait faire revivre les machines du laminoir pour fabriquer des pièces de vélo.",
        ideaId: 'cooperative_laminoir',
        sector: 'industrie',
      },
    ],
    ghost: 'ricardo',
  },

  // =========================================================================
  // 2. HYPERVAL (4 habitants)
  // Rues valides : Rue des Entrepôts, Boulevard Taret, Rue Henri-Barbusse, Avenue Jean-Jaurès
  // =========================================================================
  {
    id: 'res_yassine_cariste',
    name: 'Yassine Mansouri',
    age: 26,
    role: "Cariste d'entrepôt logistique",
    district: 'hyperval',
    street: 'Rue des Entrepôts',
    hours: [360, 960],
    greeting: "Attention au fenwick, {prenom} ! Range-toi sur le marquage jaune.",
    lines: [
      "On décharge douze semi-remorques par matinée. Si tu ralentis d'une minute, les palettes s'empilent jusqu'au toit.",
      "Le système nous chronomètre à la seconde près. Un bip rouge si le scan prend plus de quarante secondes.",
      "La logistique moderne, c'est l'art de faire voyager des cartons vides pour faire baisser les stocks virtuels.",
      "Mes collègues ont le dos en compote à trente ans. L'optimisation ne compte jamais les vertèbres.",
      "Si tu montes un jour ta boîte, {prenom}, choisis des cadences où les gens peuvent respirer.",
    ],
    rumors: [
      {
        text: "Le discounter rival au carrefour cherche à vendre discrètement avant le bilan de fin d'année.",
        ideaId: 'rachat_rival_local',
        sector: 'commerce',
      },
      {
        text: "Un carnet d'heures de 1974 sous la place montre comment les anciens comptaient chaque minute de sueur.",
        secretId: 'carnet_1974',
      },
    ],
    ghost: 'dejours',
  },
  {
    id: 'res_patricia_gerante',
    name: 'Patricia Morvan',
    age: 49,
    role: 'Directrice de grande surface franchisée',
    district: 'hyperval',
    street: 'Boulevard Taret',
    hours: [480, 1140],
    greeting: "Bonjour {prenom}. Bienvenue chez les pros du grand format.",
    lines: [
      "Les clients veulent du choix infini et des prix bas, alors on remplit six mille mètres carrés de rayons.",
      "Le petit commerce de centre-ville est charmant, mais il ne résiste pas à la puissance d'une tête de gondole nationale.",
      "Mes marges sont microscopiques, tout se joue sur la rotation du stock. Deux jours sans vente, c'est une perte.",
      "La guerre des prix ne fait pas de prisonniers dans la grande distribution.",
      "Pour gagner ici, il faut anticiper la météo, la rentrée scolaire et les vacances au jour le jour.",
    ],
    rumors: [
      {
        text: "La centrale d'achat nationale impose des quotas impitoyables qui étouffent les petits producteurs.",
        ideaId: 'centrale_achat',
        sector: 'commerce',
      },
      {
        text: "Le boyau souterrain sous la brasserie servait autrefois à contourner les taxes d'octroi de la ville.",
        secretId: 'passage_souterrain_canal',
      },
    ],
    ghost: 'smith',
  },
  {
    id: 'res_maxime_developpeur',
    name: 'Maxime Leroux',
    age: 29,
    role: "Concepteur d'applications pour le commerce de gros",
    district: 'hyperval',
    street: 'Rue Henri-Barbusse',
    hours: [540, 1140],
    greeting: "Salut {prenom}. Attends deux secondes, je compile l'inventaire en temps réel.",
    lines: [
      "Je code des algorithmes pour prédire les ruptures de stock d'eau minérale et de farine.",
      "Tout le monde veut des applications sur smartphone, mais personne ne sécurise les serveurs des petits artisans.",
      "Si les commerçants du centre se regroupaient sur un réseau de fibre indépendant, ils ne dépendraient plus des géants du cloud.",
      "La data, c'est le charbon du vingt-et-unième siècle, sauf qu'elle ne s'épuise jamais.",
      "Une bonne interface doit être comprise par un apprenti de seize ans sans mode d'emploi.",
    ],
    rumors: [
      {
        text: "Un réseau de serveurs locaux pourrait héberger les données de tous les artisans de la vallée sans pistage.",
        ideaId: 'reseau_fibre_vallee',
        sector: 'tech',
      },
      {
        text: "Des cassettes audio d'une radio pirate de 1983 sont cachées dans le vieux château d'eau de la friche.",
        secretId: 'radio_pirate',
      },
    ],
    ghost: 'zuboff',
  },
  {
    id: 'res_fatou_livreuse',
    name: 'Fatou Diop',
    age: 23,
    role: 'Chauffeuse-livreuse express en utilitaire',
    district: 'hyperval',
    street: 'Avenue Jean-Jaurès',
    hours: [420, 1080],
    greeting: "Salut {prenom} ! Cinquante colis à livrer avant midi, faut que ça roule !",
    lines: [
      "Je connais chaque feu rouge et chaque dos-d'âne entre HyperVal et la gare.",
      "Les gens commandent un paquet de piles sur Internet et veulent l'avoir dans l'heure. C'est absurde mais c'est mon gagne-pain.",
      "Le carburant monte encore cette semaine. Mon patron parle de nous équiper en camionnettes électriques mutualisées.",
      "Parfois je livre des personnes âgées au cinquième étage sans ascenseur. Je prends deux minutes pour discuter, même si le GPS râle.",
      "La ville est un labyrinthe : le meilleur itinéraire n'est pas le plus court, c'est celui qui évite les travaux.",
    ],
    rumors: [
      {
        text: "Des navettes de camionnettes électriques coordonnées entre la gare et le canal désengorgeraient tout le quartier.",
        ideaId: 'transport_vallee',
        sector: 'logistique',
      },
      {
        text: "Sous les pavés de la Maison du Peuple, une pièce murée abrite un vieux tampon de validation commerciale.",
        secretId: 'salle_muree_peuple',
      },
    ],
    ghost: 'rosa',
  },

  // =========================================================================
  // 3. INDUSTRIE (4 habitants)
  // Rues valides : Rue des Fondeurs, Rue de la Coulée, Rue du Haut-Fourneau, Chemin des Collines
  // =========================================================================
  {
    id: 'res_marcel_fondeur',
    name: 'Marcel Gauthier',
    age: 61,
    role: "Maître-fondeur et formateur d'apprentis",
    district: 'industrie',
    street: 'Rue des Fondeurs',
    hours: [360, 900],
    greeting: "Bonjour {prenom}. Approche mais ne touche à rien : la fonte est à mille quatre cents degrés.",
    lines: [
      "À la couleur du métal liquide, je sais si la pièce tiendra cinquante ans ou si elle cassera au premier gel.",
      "L'industrie ici a fait vivre trois générations. Mon aïeul est entré à l'usine le lendemain de ses quatorze ans.",
      "On dit que l'industrie est morte en France, mais regarde autour : la vallée a encore des mains en or.",
      "Le secret d'un bon moule, c'est la patience. Si tu démoules trop tôt, tout se déforme.",
      "Respecte les outils, {prenom}. Un bon tourneur entretient sa machine comme son propre corps.",
    ],
    rumors: [
      {
        text: "Une coopérative d'usinage au laminoir pourrait sauver les machines-outils historiques et relancer l'activité.",
        ideaId: 'cooperative_laminoir',
        sector: 'industrie',
      },
      {
        text: "Le lingot commémoratif de la dernière coulée de 2014 attend toujours qu'on lui rende hommage.",
        secretId: 'lingot_derniere_coulee',
      },
    ],
    ghost: 'marx',
    link: 'karim',
  },
  {
    id: 'res_aurelie_chaudronniere',
    name: 'Aurélie Blanchard',
    age: 34,
    role: 'Chaudronnière industrielle et soudeuse TIG',
    district: 'industrie',
    street: 'Rue de la Coulée',
    hours: [420, 1020],
    greeting: "Salut {prenom}. Mets tes lunettes de protection si tu restes dans l'atelier.",
    lines: [
      "La soudure TIG, c'est comme de la calligraphie sur inox : le geste doit être régulier au millimètre.",
      "On fabrique des cuves sur mesure pour les brasseries et les conserveries de la vallée.",
      "Les pièces importées à bas coût lâchent au bout de deux saisons. La qualité locale, elle, ne bouge pas.",
      "Il n'y a pas beaucoup de femmes dans la chaudronnerie lourde, mais une fois le masque baissé, seul le cordon de soudure compte.",
      "Si tu as un projet de fabrication mécanique, {prenom}, viens me montrer tes plans avant de commander les tôles.",
    ],
    rumors: [
      {
        text: "Un chantier de modernisation et d'électrification des péniches fluviales permettrait de relier le canal à Néo-Baie.",
        ideaId: 'chantier_fluvial',
        sector: 'industrie',
      },
      {
        text: "Dans la réserve de l'épicerie Bertin, un carnet répertorie des tisanes aux herbes sauvages pour la fatigue ouvrière.",
        secretId: 'recette_tisane_bertin',
      },
    ],
    ghost: 'locke',
  },
  {
    id: 'res_lucien_metrologue',
    name: 'Lucien Valette',
    age: 55,
    role: 'Métrologue et contrôleur qualité pièces usinées',
    district: 'industrie',
    street: 'Rue du Haut-Fourneau',
    hours: [480, 1020],
    greeting: "Bonjour {prenom}. Mes jauges sont étalonnées au micron près.",
    lines: [
      "La précision n'est pas un luxe, c'est ce qui sépare un train qui roule d'un déraillement.",
      "Je contrôle chaque axe qui sort des ateliers. Si un diamètre dévie de cinq microns, la pièce part au rebut.",
      "Les normes industrielles protègent les usagers, même si la direction râle sur le coût des contrôles.",
      "Un atelier bien tenu est un atelier silencieux où chaque outil a sa place attitrée.",
      "Mesure deux fois, usine une seule fois : c'est la première leçon de tout métier technique.",
    ],
    rumors: [
      {
        text: "Une manufacture locale de vélos cargo décarbonés nécessiterait un contrôle géométrique rigoureux des cadres.",
        ideaId: 'usine_velos',
        sector: 'industrie',
      },
      {
        text: "Une boussole de géomètre oubliée sous un transformateur permettait de mesurer l'affaissement des galeries.",
        secretId: 'boussole_arpenteur_terril',
      },
    ],
    ghost: 'ohno',
  },
  {
    id: 'res_rachid_agent_securite',
    name: 'Rachid Khelif',
    age: 41,
    role: 'Agent de sécurité et prévention des risques industriels',
    district: 'industrie',
    street: 'Chemin des Collines',
    hours: [840, 1440],
    greeting: "Bonsoir {prenom}. Casque obligatoire dès que tu franchis la grille.",
    lines: [
      "La sécurité sur un site industriel ne tolère aucun compromis. Un oubli de gants, c'est une brûlure au troisième degré.",
      "La nuit, l'usine s'endort mais les fours continuent de ronronner à température de veille.",
      "Mon métier, c'est de veiller à ce que chaque ouvrier rentre entier chez lui le soir.",
      "On a installé des capteurs d'émanations de monoxyde partout dans les allées des fondeurs.",
      "N'hésite pas à me signaler toute odeur suspecte ou tout câble dénudé près des transformateurs.",
    ],
    rumors: [
      {
        text: "Des rumeurs parlent d'un émetteur de secours à quartz caché près des gaines haute tension de la friche.",
        secretId: 'frequence_radio_secours',
      },
      {
        text: "Un conglomérat industriel intégrant sidérurgie verte et transport propre pourrait voir le jour dans la vallée.",
        ideaId: 'conglomerat_chaebol_industriel',
        sector: 'industrie',
      },
    ],
    ghost: 'hobbes',
  },

  // =========================================================================
  // 4. COLLINES (4 habitants)
  // Rues valides : Rue des Vergers, Chemin des Collines, Rue du Belvédère, Allée des Hauts-Tilleuls
  // =========================================================================
  {
    id: 'res_elise_arboricultrice',
    name: 'Élise Chanteur',
    age: 43,
    role: 'Arboricultrice et productrice de mirabelles',
    district: 'collines',
    street: 'Rue des Vergers',
    hours: [360, 960],
    greeting: "Bonjour {prenom}. Goûte cette pomme, elle a pris le soleil de la côte tout l'été.",
    lines: [
      "Sur les terrasses des collines, la terre est légère et les arbres profitent de la brise du plateau.",
      "Chaque printemps, les gelées tardives nous font trembler. Une nuit glacée peut détruire six mois de travail.",
      "La vallée en bas fabrique du fer, mais c'est notre colline qui lui apporte ses confitures et ses jus.",
      "Un verger ne se conduit pas comme une usine : la nature a son tempo et ne connaît pas les trimestres fiscaux.",
      "Si tu apprends à greffer un arbre fruitier, tu sauras attendre que les projets mûrissent.",
    ],
    rumors: [
      {
        text: "Une conserverie artisanale dans la vallée mettrait en bocaux tous les surplus de fruits de la colline.",
        ideaId: 'conserverie_vallee',
        sector: 'alimentation',
      },
      {
        text: "Dans le vieux saule du Parc des Roses, des enfants ont caché une boîte de graines potagères rustiques.",
        secretId: 'herbier_abandonne_parc',
      },
    ],
    ghost: 'raworth',
  },
  {
    id: 'res_bertrand_apiculteur',
    name: 'Bertrand Morin',
    age: 67,
    role: 'Apiculteur et botaniste amateur',
    district: 'collines',
    street: 'Allée des Hauts-Tilleuls',
    hours: [480, 1020],
    greeting: "Prends garde aux ruches, {prenom}, les abeilles n'aiment pas les mouvements brusques.",
    lines: [
      "Les abeilles des collines butinent les tilleuls centenaires et les ronces du talus.",
      "La ruche est le modèle parfait de coopération : chaque individu contribue au stock sans chercher à spéculer.",
      "Si les usines d'en bas polluent trop l'air, les abeilles désertent les hausses dans la semaine.",
      "Le miel de Val-Ferrand a un petit goût sauvage de menthe et de fleur d'aubépine.",
      "Prendre soin du vivant demande de la régularité, pas des coups d'éclat.",
    ],
    rumors: [
      {
        text: "La gestion en biens communs des bois communaux sur les hauts protégerait durablement les essaims sauvages.",
        ideaId: 'fondation_communs',
        sector: 'services',
      },
      {
        text: "Sous le banc de pierre face à la fontaine du centre, un carnet ouvrier de 1974 attend d'être lu.",
        secretId: 'carnet_1974',
      },
    ],
    ghost: 'ostrom',
  },
  {
    id: 'res_helene_astronome',
    name: 'Hélène Dupuis',
    age: 38,
    role: "Animatrice scientifique à l'observatoire populaire",
    district: 'collines',
    street: 'Rue du Belvédère',
    hours: [840, 1440],
    greeting: "Bonsoir {prenom}. Monte à l'oculaire, Saturne est parfaitement dégagée ce soir.",
    lines: [
      "D'ici, on voit toute la vallée illuminée la nuit. C'est magnifique, mais quelle pollution lumineuse !",
      "Les anciens disaient qu'on peut lire l'avenir dans le ciel, moi je regarde surtout la course des satellites.",
      "La science doit rester ouverte à tout le monde, pas enfermée dans des labos privés.",
      "Regarder la Voie lactée remet les querelles de boutique à leur juste échelle microscopique.",
      "Si tu veux monter un projet durable, pense à la trace qu'il laissera dans cinquante ans.",
    ],
    rumors: [
      {
        text: "Une université populaire des métiers et des sciences techniques sur les hauteurs ferait dialoguer ouvriers et étudiants.",
        ideaId: 'universite_privee_metiers',
        sector: 'culture',
      },
      {
        text: "Un dessin d'urbanisme de 1970 au collège montrait des ceintures maraîchères autour de tous les coteaux.",
        secretId: 'carte_vallee_dessin_inedit',
      },
    ],
    ghost: 'illich',
  },
  {
    id: 'res_antoine_cycliste',
    name: 'Antoine Mercier',
    age: 25,
    role: 'Mécanicien cycles et guide des sentiers de crête',
    district: 'collines',
    street: 'Allée des Hauts-Tilleuls',
    hours: [480, 1140],
    greeting: "Salut {prenom} ! Tu as monté la côte à pied ou en pédalant ?",
    lines: [
      "La montée des Tilleuls a du quatorze pour cent de pente. Ça muscle les mollets ou ça vide la batterie !",
      "Un vélo bien réglé, c'est le moyen de transport le plus efficace inventé par l'humanité.",
      "Je règle les dérailleurs au quart de tour. Rien ne m'énerve plus qu'une chaîne qui saute dans une côte.",
      "Les gens de la ville viennent rouler sur les crêtes le week-end pour échapper à la fumée des fonderies.",
      "Un bon outillage vélo coûte trois fois rien et te rend autonome pour dix ans.",
    ],
    rumors: [
      {
        text: "Un réseau de coursiers urbains à vélo cargo pourrait relier les collines et la gare en vingt minutes.",
        ideaId: 'coursiers_ville',
        sector: 'logistique',
      },
      {
        text: "Au collège, une porte peinte au deuxième étage cacherait une ancienne salle de cours d'apprentis murée.",
        secretId: 'fenetre_college',
      },
    ],
    ghost: 'illich',
    link: 'noah',
  },

  // =========================================================================
  // 5. BERGES (4 habitants)
  // Rues valides : Quai Sud de la Malterie, Rue de la Brasserie, Avenue Salvador-Allende, Rue Ambroise-Paré
  // =========================================================================
  {
    id: 'res_baptiste_batelier',
    name: 'Baptiste Vaneck',
    age: 63,
    role: 'Batelier de péniche fluviale et transporteur de grains',
    district: 'berges',
    street: 'Quai Sud de la Malterie',
    hours: [360, 960],
    greeting: "Bonjour {prenom}. Attention aux amarres, le courant tire fort après la pluie.",
    lines: [
      "Une péniche de trois cents tonnes consomme quatre fois moins de carburant que dix camions sur la route.",
      "Le canal traverse toute la vallée, du confluent jusqu'aux écluses de Néo-Baie.",
      "J'ai transporté du malt, de l'orge, des bobines d'acier et même du sable pour les fonderies.",
      "L'eau t'apprend la patience : impossible de doubler sur un canal étroit, il faut respecter le sas.",
      "Ne sous-estime jamais le transport fluvial, c'est l'artère silencieuse de notre région.",
    ],
    rumors: [
      {
        text: "Dans la cave inondée de la Malterie dorment encore des caisses d'un brassin de 1974 jamais livrées.",
        secretId: 'cave_malterie',
      },
      {
        text: "Moderniser le chantier fluvial permettrait de convertir les vieilles péniches en bateaux électriques.",
        ideaId: 'chantier_fluvial',
        sector: 'industrie',
      },
    ],
    ghost: 'ricardo',
  },
  {
    id: 'res_monique_brasseuse',
    name: 'Monique Caron',
    age: 47,
    role: 'Maîtresse-brasseuse artisanale',
    district: 'berges',
    street: 'Rue de la Brasserie',
    hours: [450, 1110],
    greeting: "Salut {prenom}. Ça sent bon le houblon et le grain torréfié aujourd'hui !",
    lines: [
      "L'eau de notre canal est trop calcaire pour la bière blonde, alors on filtre sur lit de quartz comme en 1920.",
      "La fermentation ne se commande pas avec un bouton : il faut surveiller les levures jour et nuit.",
      "On distribue nos fûts dans les cafés ouvriers et les cantines solidaires du bassin.",
      "Le secret d'une bière de garde, c'est une cave fraîche et des fûts en chêne bien étanches.",
      "Travailler les produits de la terre locale, c'est la seule façon de garder une âme dans son verre.",
    ],
    rumors: [
      {
        text: "Un boyau d'évacuation souterrain reliait directement la brasserie au canal pour échapper aux taxes en 1962.",
        secretId: 'passage_souterrain_canal',
      },
      {
        text: "Une cantine solidaire à prix libre pourrait servir les repas des ouvriers avec des produits de proximité.",
        ideaId: 'cantine_solidaire',
        sector: 'alimentation',
      },
    ],
    ghost: 'marx',
  },
  {
    id: 'res_salim_pecheur',
    name: 'Salim Boudiaf',
    age: 59,
    role: "Pêcheur à la ligne et président de l'AAPPMA du Taret",
    district: 'berges',
    street: 'Avenue Salvador-Allende',
    hours: [360, 720],
    greeting: "Chut, {prenom} ! Tu vas faire fuir les gardons avec tes grands pas.",
    lines: [
      "Les perches sont revenues dans le canal depuis qu'on a fermé les rejets acides de l'aciérie.",
      "La pêche en rivière m'a appris que tout ce qu'on jette en amont finit toujours par empoisonner l'aval.",
      "Je nettoie les berges chaque samedi matin avec les gosses du quartier. On trouve de tout dans la vase.",
      "Un fleuve est un bien commun : personne ne peut se l'approprier pour en faire son égout privé.",
      "Si tu as une décision difficile à prendre, viens t'asseoir une heure au bord de l'eau.",
    ],
    rumors: [
      {
        text: "Sous le kiosque du parc lors des jours de pluie, les anciens ouvriers partagent des confidences précieuses.",
        secretId: 'pluie_parc',
      },
      {
        text: "Une fondation dédiée aux biens communs permettrait de financer la dépollution citoyenne du canal.",
        ideaId: 'fondation_communs',
        sector: 'services',
      },
    ],
    ghost: 'ostrom',
  },
  {
    id: 'res_nadege_kinesitherapeute',
    name: 'Nadège Lefebvre',
    age: 36,
    role: 'Kinésithérapeute en cabinet de santé de quartier',
    district: 'berges',
    street: 'Rue Ambroise-Paré',
    hours: [480, 1140],
    greeting: "Bonjour {prenom}. Fais attention à ta posture quand tu portes des caisses lourdes !",
    lines: [
      "Je vois passer tous les ouvriers de la coulée et les livreurs d'HyperVal. Leurs épaules sont en miettes.",
      "On répare les corps abîmés par le travail, mais si les cadences ne changent pas, ils reviennent le trimestre suivant.",
      "La santé au travail n'est pas un coût pour l'entreprise, c'est sa première condition d'existence.",
      "Deux étirements bien faits le matin évitent une hernie discale à quarante ans.",
      "Prends soin de ton dos, {prenom}, tu n'en auras pas d'autre pour toute ta carrière.",
    ],
    rumors: [
      {
        text: "Le cahier d'infusions secret de Mme Bertin propose des remèdes à base de mélisse pour calmer les nerfs épuisés.",
        secretId: 'recette_tisane_bertin',
      },
      {
        text: "Un cabinet de conseil solidaire pourrait aider les ateliers locaux à restructurer le travail sans broyer le personnel.",
        ideaId: 'cabinet_conseil_territoires',
        sector: 'services',
      },
    ],
    ghost: 'dejours',
  },

  // =========================================================================
  // 6. FAUBOURG (4 habitants)
  // Rues valides : Rue de la Brasserie, Avenue Salvador-Allende, Boulevard Taret, Rue Henri-Barbusse
  // =========================================================================
  {
    id: 'res_lucas_boulanger',
    name: 'Lucas Guérin',
    age: 33,
    role: 'Boulanger artisan au levain naturel',
    district: 'faubourg',
    street: 'Rue de la Brasserie',
    hours: [240, 780],
    greeting: "Bonjour {prenom}. Le pain chaud sort du fournil, sers-toi une miche croustillante.",
    lines: [
      "Farine de meule locale, eau de source, sel et levain sauvage : pas un gramme d'additif chimique dans mon pétrin.",
      "Je me lève à trois heures du matin, mais quand les premiers ouvriers viennent chercher leur casse-croûte, ça vaut le coup.",
      "Si le prix du blé s'envole à Chicago, je refuse d'augmenter la baguette des familles du faubourg.",
      "Le levain est un être vivant : il sent l'humidité de l'air et le froid de l'hiver.",
      "Un bon artisan fait vivre toute sa rue simplement en allumant sa vitrine à l'aube.",
    ],
    rumors: [
      {
        text: "Un réseau coopératif de fournils artisanaux au levain pourrait nourrir tout le bassin ouvrier.",
        ideaId: 'chaine_boulangeries',
        sector: 'alimentation',
      },
      {
        text: "Des roulements d'usine déclassés sont troqués à l'aube sous la troisième travée du viaduc en fonte.",
        secretId: 'fournisseur_clandestin_pont',
      },
    ],
    ghost: 'polanyi',
  },
  {
    id: 'res_fatima_couturiere',
    name: 'Fatima Benali',
    age: 50,
    role: "Couturière et gérante d'atelier de retouche",
    district: 'faubourg',
    street: 'Avenue Salvador-Allende',
    hours: [510, 1110],
    greeting: "Entre donc {prenom}. Pose ta veste sur la chaise, je vais te recoudre cette poche.",
    lines: [
      "Les gens jettent leurs pantalons dès qu'un bouton saute. Moi, je renforce les coutures pour dix ans.",
      "On récupère les vieilles vestes en toile bleue des usines pour en faire des sacs indestructibles.",
      "La fast-fashion détruit la planète et exploite des enfants au bout du monde. La retouche locale, c'est de la résistance.",
      "Une belle surpiqûre demande un fil solide et un pied-de-biche bien calé.",
      "Quand un vêtement a une histoire, on le répare avec respect.",
    ],
    rumors: [
      {
        text: "Créer une friperie coopérative avec atelier de retouche dans le quartier sauverait des tonnes de tissu.",
        ideaId: 'friperie_quartier',
        sector: 'mode',
      },
      {
        text: "La matrice d'imprimerie clandestine de 1936 est cachée dans un conduit aveugle de la rue Louise-Michel.",
        secretId: 'tampon_imprimerie_clandestine',
      },
    ],
    ghost: 'raworth',
  },
  {
    id: 'res_etienne_menuisier',
    name: 'Étienne Renard',
    age: 44,
    role: 'Menuisier agenceur en réemploi de bois',
    district: 'faubourg',
    street: 'Boulevard Taret',
    hours: [450, 1050],
    greeting: "Salut {prenom}. Sens cette odeur de copeaux de chêne et de cire d'abeille !",
    lines: [
      "Je récupère les madriers des anciennes charpentes d'usines démolies. Ce vieux chêne a deux cents ans et ne bougera plus jamais.",
      "Fabriquer des meubles solides pour les gens du quartier, c'est ma façon de faire honneur au métier.",
      "Un établi en bois massif est le centre de tout atelier digne de ce nom.",
      "Aujourd'hui, tout est en contreplaqué jetable aggloméré à la colle toxique. C'est un désastre.",
      "Prends ton temps pour raboter une face : la précipitation laisse des marques dans le fil du bois.",
    ],
    rumors: [
      {
        text: "Lancer une marque locale de vêtements et d'objets en matériaux recyclés valoriserait nos rebuts d'ateliers.",
        ideaId: 'marque_vetements',
        sector: 'mode',
      },
      {
        text: "Les maîtres-verriers de l'époque cachaient leurs formules de trempe dans un regard technique sous les pavés.",
        secretId: 'archives_verrerie',
      },
    ],
    ghost: 'locke',
  },
  {
    id: 'res_julie_libraire',
    name: 'Julie Maréchal',
    age: 37,
    role: 'Libraire indépendante et animatrice de club de lecture',
    district: 'faubourg',
    street: 'Rue Henri-Barbusse',
    hours: [540, 1140],
    greeting: "Bonjour {prenom}. Viens voir, j'ai reçu le dernier essai sur l'histoire des luttes ouvrières.",
    lines: [
      "Une librairie dans un quartier populaire, c'est une fenêtre ouverte sur le monde et un refuge contre le bruit.",
      "Les plateformes en ligne vendent des livres comme des boîtes de conserve. Ici, on prend le temps de conseiller chaque lecteur.",
      "J'organise des séances de lecture pour les enfants des écoles le mercredi après-midi.",
      "Les idées économiques ne sont pas réservées aux experts en costume : elles concernent la vie de chacun.",
      "Un livre prêté tisse plus de liens dans un quartier qu'un million de likes sur un écran.",
    ],
    rumors: [
      {
        text: "Un journal local indépendant d'investigation pourrait fédérer tous les quartiers contre la désinformation.",
        ideaId: 'media_national',
        sector: 'medias',
      },
      {
        text: "La lampe d'ingénieur à ressorts de l'Atelier du Laminoir dort encore sur la mezzanine de la halle sud.",
        secretId: 'lampe_etudes_laminoir',
      },
    ],
    ghost: 'bourdieu',
    link: 'lina',
  },

  // =========================================================================
  // 7. GRAND ENSEMBLE (4 habitants)
  // Rues valides : Boulevard du Grand Ensemble, Rue Pierre-Mendès-France, Avenue de l’Hôpital, Rue des Écluses
  // =========================================================================
  {
    id: 'res_kader_gardien',
    name: 'Kader Mansour',
    age: 54,
    role: "Gardien d'immeuble et médiateur social",
    district: 'grand_ensemble',
    street: 'Boulevard du Grand Ensemble',
    hours: [420, 1140],
    greeting: "Salut {prenom}. Essuie tes semelles avant d'entrer dans le hall, je viens de passer la serpillère.",
    lines: [
      "Je connais les huit cents familles des tours par leur nom. Je sais qui est malade et qui cherche un stage.",
      "Mon trousseau de clés pèse deux kilos, mais c'est le trousseau de la confiance qui pèse le plus lourd.",
      "Quand un ascenseur tombe en panne, c'est moi qui monte les packs d'eau au dixième étage pour les anciens.",
      "La vie en grand ensemble, c'est une solidarité qu'on ne voit nulle part ailleurs quand on sait écouter.",
      "Si tu as un différend avec un voisin, {prenom}, parle-lui avant que la rancœur ne monte.",
    ],
    rumors: [
      {
        text: "Une conciergerie solidaire de quartier pour gérer colis et petits dépannages soulagerait des centaines de familles.",
        ideaId: 'conciergerie',
        sector: 'services',
      },
      {
        text: "Une stèle en fonte de 1984 dédiée à papy Lucien rappelle que les bâtisseurs laissent des biens communs.",
        secretId: 'tombe_lucien',
      },
    ],
    ghost: 'bourdieu',
    link: 'lucien',
  },
  {
    id: 'res_soraya_animatrice',
    name: 'Soraya Hadj',
    age: 27,
    role: 'Animatrice socioculturelle et coach de soutien scolaire',
    district: 'grand_ensemble',
    street: 'Rue Pierre-Mendès-France',
    hours: [540, 1200],
    greeting: "Bonjour {prenom} ! Tu viens aider les sixièmes sur leurs devoirs de maths ?",
    lines: [
      "Le soutien scolaire ici, ce n'est pas juste réviser les fractions, c'est redonner confiance à des gosses formidables.",
      "On monte une troupe de théâtre d'improvisation pour apprendre à s'exprimer sans bafouiller devant un jury.",
      "L'égalité des chances commence par une table calme, une lampe qui marche et un adulte bienveillant.",
      "Beaucoup d'élèves brillants s'autocensurent parce qu'ils viennent d'un quartier classé prioritaire.",
      "Chaque heure investie dans l'éducation d'un enfant rapporte au centuple pour la collectivité.",
    ],
    rumors: [
      {
        text: "Un réseau de soutien scolaire coopératif entre élèves sous le préau pourrait essaimer dans tous les collèges.",
        ideaId: 'soutien_scolaire',
        sector: 'services',
      },
      {
        text: "Les premiers tickets de caisse de Mme Bertin sont gardés dans une boîte à biscuits vintage sous une grille.",
        secretId: 'boite_vintage_bertin_archives',
      },
    ],
    ghost: 'bourdieu',
    link: 'lina',
  },
  {
    id: 'res_marc_ambulancier',
    name: 'Marc Chauvin',
    age: 42,
    role: 'Ambulancier urgentiste et délégué syndical',
    district: 'grand_ensemble',
    street: 'Avenue de l’Hôpital',
    hours: [360, 1080],
    greeting: "Salut {prenom}. Sirène coupée pour l'instant, on souffle cinq minutes.",
    lines: [
      "L'avenue de l'Hôpital est l'axe le plus direct pour rejoindre les urgences depuis les cités du sud.",
      "On passe nos journées à transporter la misère humaine et les accidents de travail évitables.",
      "Le personnel soignant est épuisé, mais on tient par pure solidarité avec les patients.",
      "Un service de secours n'est pas une entreprise rentable, c'est le filet de survie de la société.",
      "Regarde toujours des deux côtés même quand le feu est vert : les urgences n'attendent pas.",
    ],
    rumors: [
      {
        text: "Une banque coopérative citoyenne permettrait d'investir directement dans le matériel soignant et les crèches locales.",
        ideaId: 'banque_cooperative',
        sector: 'finance',
      },
      {
        text: "Une vieille boîte en fer avec le carnet de notes de 1974 est cachée sous la place du marché.",
        secretId: 'carnet_1974',
      },
    ],
    ghost: 'keynes',
  },
  {
    id: 'res_ines_etudiante',
    name: 'Inès Belhadj',
    age: 20,
    role: 'Étudiante en gestion et livreuse de courses à pied',
    district: 'grand_ensemble',
    street: 'Rue des Écluses',
    hours: [480, 1140],
    greeting: "Salut {prenom} ! Je révise mes cours d'économie en montant les étages avec mes sacs de courses.",
    lines: [
      "Je livre les courses pour les personnes âgées de la tour B. Ça me paie mes livres de droit et mes inscriptions.",
      "Mon prof de fac parle de concurrence parfaite, mais sur le terrain, c'est le monopole des plateformes qui prend trente pour cent.",
      "Avec d'autres jeunes du quartier, on voudrait monter une coopérative de portage solidaire sans commission d'appli.",
      "On sous-estime la force de calcul d'une génération qui a grandi avec un écran et une envie de tout changer.",
      "Ne laisse personne te dire que tu es trop jeune pour comprendre les rouages de la finance, {prenom}.",
    ],
    rumors: [
      {
        text: "Un service de portage de courses à domicile pour les anciens des Roses créerait des emplois locaux non délocalisables.",
        ideaId: 'livraison_courses',
        sector: 'logistique',
      },
      {
        text: "Il paraît qu'un émetteur de radio pirate au 108.4 FM diffusait les prix réels des denrées pendant les grèves.",
        secretId: 'radio_pirate',
      },
    ],
    ghost: 'schumpeter',
    link: 'bertin',
  },

  // =========================================================================
  // 8. FRICHE SUD (4 habitants)
  // Rues valides : Rue de la Coulée, Rue des Écluses, Boulevard Taret, Rue des Fondeurs
  // =========================================================================
  {
    id: 'res_driss_sculpteur',
    name: 'Driss Rahmani',
    age: 39,
    role: 'Sculpteur sur métal et artiste de réemploi',
    district: 'friche_sud',
    street: 'Rue de la Coulée',
    hours: [600, 1320],
    greeting: "Salut {prenom} ! Regarde cette bielle de locomotive, je vais en faire un oiseau géant.",
    lines: [
      "La friche n'est pas un cimetière de ferraille, c'est un gisement d'imagination à ciel ouvert.",
      "Je redonne vie aux morceaux d'acier abandonnés par les faillites industrielles des années quatre-vingt-dix.",
      "Les gens de la mairie voulaient tout raser pour faire un parking, mais les artistes ont occupé les halles à temps.",
      "L'art doit être forgé dans la matière brute du territoire, pas dans des salons climatisés pour milliardaires.",
      "Quand tu regardes une ruine, demande-toi ce qu'on peut y faire renaître.",
    ],
    rumors: [
      {
        text: "Reconvertir la grande halle du laminoir en tiers-lieu culturel et salle de concert attirerait toute la jeunesse.",
        ideaId: 'salle_halle',
        sector: 'culture',
      },
      {
        text: "Une lampe d'ingénieur historique est encore fixée sur la mezzanine de la halle sud de la friche.",
        secretId: 'lampe_etudes_laminoir',
      },
    ],
    ghost: 'marx',
  },
  {
    id: 'res_valerie_ecologue',
    name: 'Valérie Dumas',
    age: 45,
    role: 'Écologue de terrain et coordinatrice de phytoremédiation',
    district: 'friche_sud',
    street: 'Rue des Écluses',
    hours: [480, 1080],
    greeting: "Bonjour {prenom}. Regarde ces saules : leurs racines pompent le plomb et le cadmium du sol.",
    lines: [
      "La terre de la friche a bu des hydrocarbures pendant un siècle. Il faudra des décennies de plantes pour la nettoyer.",
      "La dépollution naturelle par les champignons et les arbres est dix fois moins chère que d'évacuer des milliers de bennes de terre.",
      "La biodiversité revient toujours : j'ai vu des renards chasser les mulots au milieu des rails rouillés.",
      "On ne peut pas reconstruire une ville saine sur un sol empoisonné sans assainir d'abord le sous-sol.",
      "La patience écologique est la véritable alliée de l'économie circulaire.",
    ],
    rumors: [
      {
        text: "Un projet d'énergies renouvelables citoyennes et de fermes solaires sur les sols dépollués de la friche est à l'étude.",
        ideaId: 'centrale_energies_renouvelables',
        sector: 'energie',
      },
      {
        text: "Un quartz d'émission 108.4 MHz de secours était dissimulé près des transformateurs pour contourner le brouillage.",
        secretId: 'frequence_radio_secours',
      },
    ],
    ghost: 'raworth',
  },
  {
    id: 'res_tanguy_reparateur',
    name: 'Tanguy Moreau',
    age: 28,
    role: "Médiateur fablab et réparateur d'électroménager",
    district: 'friche_sud',
    street: 'Rue de la Coulée',
    hours: [540, 1200],
    greeting: "Salut {prenom}. Apporte ton grille-pain en panne, on va l'ouvrir au lieu de le jeter.",
    lines: [
      "L'obsolescence programmée est une arnaque : quatre pannes sur cinq viennent d'un simple fusible à cinquante centimes.",
      "Avec nos imprimantes 3D et notre stock de récupération, on recrée des engrenages introuvables sur le marché.",
      "Le droit de réparer ses propres objets devrait être garanti par la constitution.",
      "Quand quelqu'un repart d'ici avec son lave-linge réparé par ses propres mains, il repart avec sa dignité.",
      "Apprends à te servir d'un fer à souder, {prenom}, c'est le passeport de l'autonomie technique.",
    ],
    rumors: [
      {
        text: "Un atelier de réparation de vélos et trottinettes devant les collèges financerait des pièces de rechange pour tous.",
        ideaId: 'reparation_velos_cour',
        sector: 'services',
      },
      {
        text: "Un émetteur de radio pirate artisanal est resté perché dans la charpente du château d'eau.",
        secretId: 'radio_pirate',
      },
    ],
    ghost: 'illich',
    link: 'samir',
  },
  {
    id: 'res_chantal_archiviste',
    name: 'Chantal Boivin',
    age: 66,
    role: 'Ancienne secrétaire de direction et gardienne de la mémoire ouvrière',
    district: 'friche_sud',
    street: 'Rue des Fondeurs',
    hours: [540, 1020],
    greeting: "Bonjour {prenom}. J'ai encore tous les plans d'usine classés dans mes classeurs en carton.",
    lines: [
      "J'ai tapé à la machine les procès-verbaux de toutes les négociations syndicales entre 1978 et la fermeture.",
      "Les patrons venaient de Paris en train de première classe, ils ne comprenaient rien à la vie d'ici.",
      "Les archives ne sont pas de vieux papiers morts, c'est la preuve de ce que les ouvriers ont conquis de haute lutte.",
      "Quand l'usine a coulé sa dernière tonne d'acier, tout le monde pleurait dans les ateliers, même les contremaîtres.",
      "Garde toujours un double écrit de chaque contrat, {prenom}, les paroles s'envolent dès que l'argent entre en jeu.",
    ],
    rumors: [
      {
        text: "Une holding patrimoniale familiale pourrait regrouper les ateliers historiques pour éviter le dépeçage par des fonds rapaces.",
        ideaId: 'holding_familiale',
        sector: 'finance',
      },
      {
        text: "La matrice en plomb d'une imprimerie clandestine de 1936 attend toujours dans un conduit de cheminée.",
        secretId: 'tampon_imprimerie_clandestine',
      },
    ],
    ghost: 'weber',
  },

  // =========================================================================
  // 9. BELLEVUE (4 habitants)
  // Rues valides : Rue de Bellevue, Rue du Lycée, Route du Plateau Blanc, Rue des Glycines
  // =========================================================================
  {
    id: 'res_edouard_notaire',
    name: 'Édouard de Montmirail',
    age: 62,
    role: 'Notaire honoraire et spécialiste du droit des successions',
    district: 'bellevue',
    street: 'Rue de Bellevue',
    hours: [540, 1080],
    greeting: "Bonjour {prenom}. La propriété immobilière exige une rigueur scrupuleuse dans les actes.",
    lines: [
      "Bellevue a toujours été le quartier des professions libérales et des cadres dirigeants de la vallée.",
      "J'ai vu passer toutes les transactions foncières depuis quarante ans. La terre prend de la valeur quand le travail des autres s'y investit.",
      "Les baux commerciaux doivent être rédigés avec minutie pour protéger le bailleur comme le commerçant.",
      "La transmission d'une entreprise familiale est une épreuve juridique délicate où beaucoup trébuchent.",
      "Un bon accord négocié chez le notaire vaut toujours mieux qu'un mauvais procès devant les tribunaux.",
    ],
    rumors: [
      {
        text: "Une agence immobilière citoyenne pourrait racheter les baux des vitrines vides pour les louer à prix modéré aux artisans.",
        ideaId: 'agence_immobiliere',
        sector: 'immobilier',
      },
      {
        text: "Le carré des fondeurs au cimetière abrite la tombe de papy Lucien gravée d'une maxime sur les bâtisseurs.",
        secretId: 'tombe_lucien',
      },
    ],
    ghost: 'locke',
    link: 'lucien',
  },
  {
    id: 'res_catherine_professeure',
    name: 'Catherine Veyrat',
    age: 53,
    role: 'Professeure de sciences économiques et sociales au lycée',
    district: 'bellevue',
    street: 'Rue du Lycée',
    hours: [480, 1020],
    greeting: "Bonjour {prenom}. Tu as lu le chapitre sur les mécanismes de marché pour aujourd'hui ?",
    lines: [
      "J'enseigne à mes élèves que l'économie n'est pas une loi divine, mais une construction sociale et historique.",
      "Les théories de Keynes et de Hayek se complètent souvent bien mieux que les manuels ne veulent l'admettre.",
      "Au lycée de Bellevue, les élèves ont la chance d'avoir des bibliothèques bien fournies, mais ils manquent souvent d'ancrage réel.",
      "Comprendre les taux d'intérêt et l'inflation est indispensable pour ne pas subir les crises en aveugle.",
      "Exerce ton esprit critique sur chaque chiffre qu'on te présente, {prenom}.",
    ],
    rumors: [
      {
        text: "La salle murée du collège Taret conserve une immense carte murale de 1970 avec les anciens puits de mine.",
        secretId: 'fenetre_college',
      },
      {
        text: "Créer un journal lycéen vendu sous le préau apprendrait aux élèves la gestion d'un budget réel et le débat public.",
        ideaId: 'journal_college',
        sector: 'medias',
      },
    ],
    ghost: 'keynes',
  },
  {
    id: 'res_laurent_banquier',
    name: 'Laurent Chassagne',
    age: 47,
    role: "Conseiller en crédit d'investissement aux PME",
    district: 'bellevue',
    street: 'Route du Plateau Blanc',
    hours: [510, 1050],
    greeting: "Bonjour {prenom}. Parlons bilan comptable, trésorerie et capacité d'emprunt.",
    lines: [
      "Une entreprise ne meurt pas de ses pertes immédiates, elle meurt de son manque de liquidités au mauvais moment.",
      "Les banques traditionnelles demandent des garanties excessives aux jeunes créateurs de projets alternatifs.",
      "Si le taux directeur de la banque centrale augmente, chaque nouvel investissement devient plus coûteux à financer.",
      "Un business plan solide doit présenter un scénario pessimiste tout aussi rigoureux que le scénario idéal.",
      "Garde toujours trois mois de trésorerie de sécurité d'avance, {prenom}, c'est ta marge de manœuvre.",
    ],
    rumors: [
      {
        text: "Créer une banque d'affaires citoyenne permettrait d'émettre des obligations solidaires pour réindustrialiser la région.",
        ideaId: 'banque_affaires_citoyenne',
        sector: 'finance',
      },
      {
        text: "Le wagon postal abandonné sur les voies de garage recèle un réseau d'archives de plis reliant Plateau Blanc.",
        secretId: 'wagon_postal_gare',
      },
    ],
    ghost: 'hayek',
  },
  {
    id: 'res_genevieve_horticultrice',
    name: 'Geneviève Berthier',
    age: 71,
    role: 'Pépiniériste retraitée et passionnée de glycines séculaires',
    district: 'bellevue',
    street: 'Rue des Glycines',
    hours: [540, 1080],
    greeting: "Bonjour {prenom}. Admire la floraison de ces glycines, elles ont été plantées en 1935.",
    lines: [
      "Les jardins de Bellevue profitent de la terre alluvionnaire haute et d'un microclimat très doux.",
      "J'ai fourni des plants d'arbres et de fleurs à toutes les cours d'école et tous les squares de la ville.",
      "La terre ne demande qu'un peu d'amour et beaucoup de paillage pour résister aux canicules de l'été.",
      "À mon âge, on plante des chênes en sachant pertinemment qu'on ne s'assiéra jamais sous leur ombre adulte.",
      "La vraie richesse, c'est de laisser un monde plus vert et plus accueillant que celui qu'on a trouvé.",
    ],
    rumors: [
      {
        text: "Un calque d'urbanisme inédit de 1970 au collège montrait des ceintures maraîchères reliant Bellevue aux coteaux.",
        secretId: 'carte_vallee_dessin_inedit',
      },
      {
        text: "Une bourse aux cartes de collection sous le préau avec carnet de cotes apprend la valeur d'échange aux élèves.",
        ideaId: 'cartes_collection',
        sector: 'commerce',
      },
    ],
    ghost: 'raworth',
  },
];
