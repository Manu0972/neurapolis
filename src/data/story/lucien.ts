/**
 * Les Carnets de Lucien (docs/ASCENSION.md & docs/VISION.md).
 * Récit principal reliant l'histoire de Val-Ferrand, la mémoire ouvrière de Taret-Acier,
 * les voix des grands penseurs et la trajectoire du joueur.
 */

export interface StoryBeat {
  id: string;
  trigger: {
    tier?: number;
    flag?: string;
    concepts?: number;
    day?: number;
  };
  title: string;
  /** 3 à 6 paragraphes courts. */
  pages: string[];
  /** Note manuscrite de Lucien dans la marge. */
  note?: string;
  /** Fantôme qui commente le souvenir ou la note. */
  ghost?: string;
}

/**
 * Scène inaugurale : la nuit du 31 août 2020.
 * L'orage sur la vallée, la bibliothèque du CE Taret-Acier,
 * l'effondrement de l'étagère et l'éveil de la première voix.
 */
export const ORIGIN_SCENE: StoryBeat = {
  id: 'beat_origin_31_aout_2020',
  trigger: { day: 0 },
  title: 'L’Étagère de la Maison du Peuple (31 août 2020)',
  pages: [
    'Le tonnerre grondait au-dessus de la vallée du Taret comme les anciens coups de pilon des forges. Dehors, la pluie d’août fouettait les baies vitrées de la Maison du Peuple. Le lendemain, c’était la rentrée en cinquième au collège Jean-Moulin, mais ce soir-là, il fallait vider les cartons.',
    'Depuis la mort de papy Lucien à l’automne 2019, la mairie avait décidé de liquider définitivement l’ancienne bibliothèque du comité d’entreprise de Taret-Acier. Six mille volumes accumulés depuis les années soixante : romans ouvriers, traités de métallurgie, fiches syndicales, et deux travées entières d’économie et de philosophie sociale dont Lucien avait été le gardien bénévole pendant quarante ans.',
    'Soudain, un claquement sec déchira la pénombre : le disjoncteur général venait de sauter dans toute la rue des Rosiers. Dans le noir absolu, avec la seule lueur tremblotante d’une lampe de poche, {prenom} grimpait sur l’escabeau en chêne pour décrocher une dernière pile d’épais volumes reliés en percaline rouge.',
    'Le bois vermoulu poussa un gémissement sourd. Sous le poids des décennies d’humidité, la crémaillère céda d’un coup net. L’étagère entière bascula dans un fracas de tonnerre. Des centaines de pages, de reliures et de fiches cartonnées s’abattirent dans une avalanche de suie, de cuir et d’encre séchée. Puis, le silence noir.',
    'Au réveil sur le lino froid, l’odeur de poussière et d’ozone emplissait la pièce. Autour gisaient des dizaines d’ouvrages dont les marges étaient couvertes de l’écriture penchée de Lucien à l’encre bleue. Chose étrange : Lucien avait fait relier ensemble, sous une même couverture cousue de fil de fer, des livres aux thèses radicalement ennemies. Ford contre Ohno. Smith contre Marx. Keynes contre Hayek.',
    'En serrant contre sa poitrine un volume abîmé de La Richesse des Nations, un murmure posé et poli, empreint d’une douce cadence écossaise du XVIIIe siècle, résonna distinctement à l’oreille : « Mon enfant… ne t’effraie point. Ce n’est pas de la bienveillance du boucher que nous attendons notre dîner, mais de son intérêt propre. Relève-toi, regarde cette ville : tout ce qui vit ici n’est que travail, valeur et division du labeur. Je serai là pour te montrer les rouages. »',
  ],
  note: 'Annotation de Lucien sur la première page de garde : « À mon petit-enfant. Si la fumée des usines s’éteint un jour, ne laisse personne te faire croire que l’économie est une météo venue du ciel qu’on doit subir en baissant la tête. C’est une machine construite par des hommes. Démonte-la pièce par pièce, comprends ses engrenages, et remonte-la pour ceux qui n’ont que leurs bras. »',
  ghost: 'smith',
};

/**
 * Les 14 étapes du carnet de Lucien, égrainées au fil des paliers et des découvertes.
 */
export const LUCIEN_BEATS: readonly StoryBeat[] = [
  // ---------- Palier 1 : La Cour ----------
  {
    id: 'beat_lucien_1_le_premier_cahier',
    trigger: { tier: 1, concepts: 1 },
    title: 'Cahier n°1 : Le troc des billes et le temps de travail',
    pages: [
      'Glissé dans la doublure d’un vieux classeur d’apprentissage, un petit carnet à spirale quadrillé porte la date de septembre 1958. Lucien y tenait la comptabilité de ses échanges dans la cour de récréation de l’école primaire des Rosiers.',
      'Il y notait la valeur relative des billes en terre cuite, des toupies en buis et des morceaux de craie. Une phrase soulignée au crayon rouge attire l’œil : « Une bille œil-de-chat vaut trois agates non parce qu’elle brille plus fort, mais parce qu’il a fallu trois heures de polissage à l’artisan pour arrondir le verre sans faire de bulle. »',
      '{prenom} comprend que sous le préau de 2020, avec les cartes à collectionner et les paquets de gâteaux, la règle n’a pas changé : derrière chaque objet désiré se cache la sueur de quelqu’un.',
    ],
    note: '« Karl avait raison là-dessus : ce que nous échangeons vraiment sous les préaux ou sur les marchés, ce n’est pas de la matière, c’est du temps de vie cristallisé. »',
    ghost: 'marx',
  },
  {
    id: 'beat_lucien_2_les_reliures_doubles',
    trigger: { tier: 1, concepts: 3 },
    title: 'Cahier n°2 : Pourquoi relier les ennemis ensemble ?',
    pages: [
      'Sur une feuille volante jaunie, Lucien explique pourquoi il s’enfermait à l’atelier de reliure du CE pour assembler Karl Marx et Adam Smith sous la même peau de chagrin marron.',
      '« Les militants de la section voulaient jeter les livres des économistes bourgeois dans la benne à ferraille. Je leur ai dit : vous êtes fous. Comment voulez-vous négocier face à la direction si vous ne connaissez pas par cœur le bréviaire de ceux qui calculent vos primes ? »',
      '« Pour comprendre le monde, il faut toujours mettre deux regards ennemis face à face. L’un éclaire ce que l’autre cache. La vérité ne dort jamais dans un seul camp. »',
    ],
    note: '« Friedrich et John se querellaient déjà dans les couloirs de Cambridge en 1930. Écoute-les tous les deux : le premier te préservera de la ruine, le second t’évitera la timidité. »',
    ghost: 'hayek',
  },

  // ---------- Palier 2 : Le Quartier ----------
  {
    id: 'beat_lucien_3_la_greve_de_1982',
    trigger: { tier: 2, day: 15 },
    title: 'Cahier n°3 : L’hiver 1982 et les feux de palettes',
    pages: [
      'Dans ce chapitre, Lucien raconte les quarante-trois jours de grève générale de l’hiver 1982 autour du haut-fourneau n°3. Les ouvriers bloquaient les portes pour empêcher le démantèlement anticipé de la cokerie.',
      '« Ce qui m’a le plus marqué pendant ces six semaines de gel, ce n’était pas les discours à la sono. C’était le réseau de ravitaillement que les femmes du quartier avaient monté avec les fermes du plateau et l’épicerie Bertin. Personne n’est mort de faim parce que le quartier formait un seul corps. »',
      '« Une entreprise n’est pas une forteresse isolée sur une île déserte. Si le quartier autour s’effondre, elle finira par mourir étouffée dans ses propres décombres. »',
    ],
    note: '« Henry croyait qu’un salaire élevé suffisait à faire taire les hommes. Mais les hommes ne réclament pas seulement du pain : ils exigent d’avoir voix au chapitre sur la destination de leur peine. »',
    ghost: 'ford',
  },
  {
    id: 'beat_lucien_4_le_boulanger_et_le_credit',
    trigger: { tier: 2, concepts: 5 },
    title: 'Cahier n°4 : Le fournil de Manuel et le premier emprunt',
    pages: [
      'Lucien consacre six pages au boulanger Manuel, qui avait voulu doubler la taille de son fournil en 1978 en empruntant auprès d’une banque privée au lieu de la caisse mutuelle ouvrière.',
      '« Les trois premières années, Manuel roulait en berline neuve. Il nous expliquait que l’argent emprunté était un carburant magique qui multipliait ses forces. Puis les taux d’intérêt ont bondi, la crise de la sidérurgie a vidé la ville, et la banque a saisi les pétrins un matin de novembre à six heures. »',
      '« L’emprunt est comme le feu des hauts-fourneaux : indispensable pour couler l’acier, mortel si la température échappe à ton contrôle. Ne signe jamais une ligne de crédit sans savoir exactement quel travail réel paiera chaque centime d’intérêt. »',
    ],
    note: '« Maynard me disait : l’emprunt relance l’activité quand l’économie s’assoupit. Je lui répondais : oui, tant que le banquier n’a pas la clé de ta chambre à coucher. »',
    ghost: 'keynes',
  },
  {
    id: 'beat_lucien_5_le_chronometre_du_docteur_taylor',
    trigger: { tier: 2, concepts: 7 },
    title: 'Cahier n°5 : Les blouses blanches et les chronomètres de 1988',
    pages: [
      'En 1988, des consultants parisiens en organisation scientifique du travail débarquent à l’usine de Val-Ferrand pour traquer les « temps morts » et les gestes superflus sur les ponts roulants.',
      '« Ils marchaient avec des calepins et des chronomètres à aiguille. Ils comptaient combien de secondes il fallait à Thierry et à ses collègues pour accrocher une lingotière. En six mois, ils ont gagné douze pour cent de cadence. En douze mois, les accidents du travail ont triplé. »',
      '« L’ingénieur qui ne regarde que la cadence oublie le corps qui porte l’effort. Quand on transforme un être humain en rouage mécanique, le rouage finit par casser net sans prévenir. »',
    ],
    note: '« Christophe me l’a soufflé un soir de réunion CHSCT : la souffrance commence à la minute exacte où l’on interdit au travailleur de penser son propre geste. »',
    ghost: 'dejours',
  },

  // ---------- Palier 3 : La Ville ----------
  {
    id: 'beat_lucien_6_la_nuit_du_verre_casse_2014',
    trigger: { tier: 3 },
    title: 'Cahier n°6 : Le 14 avril 2014, le jour où la flamme s’est éteinte',
    pages: [
      'Cette page est froissée, marquée de cernes de café noir. Lucien y retrace la nuit où la direction générale a annoncé depuis Londres la fermeture irrévocable des hauts-fourneaux de Val-Ferrand.',
      '« Deux mille neuf cents familles qui se réveillent avec un gouffre sous les pieds. Les camions de CRS devant les grilles, la sirène qui hurle pour la dernière fois à quatorze heures. J’ai vu des géants de cent kilos pleurer sur le capot de leur voiture. »',
      '« La ville croyait que le fer coulerait toujours. Nous avions oublié qu’un groupe financier n’a ni patrie, ni mémoire, ni attachement à un clocher. Si tu bâtis un commerce à Val-Ferrand, ne dépends jamais d’un seul maître lointain. »',
    ],
    note: '« Joseph appelait cela la destruction créatrice avec un détachement de philosophe. Vu d’en bas, mon vieux Joseph, c’est surtout de la destruction : la création tarde souvent vingt ans à pointer le bout de son nez. »',
    ghost: 'schumpeter',
  },
  {
    id: 'beat_lucien_7_la_renaissance_sous_les_ronces',
    trigger: { tier: 3, concepts: 9 },
    title: 'Cahier n°7 : La friche n’est pas un cimetière, c’est un terreau',
    pages: [
      'Quelques années après le désastre, Lucien s’était mis à arpenter les 38 hectares abandonnés de la friche industrielle, armé d’un sécateur et d’un carnet de croquis.',
      '« Partout où l’homme s’est retiré, les bouleaux percent le macadam et les hirondelles nichent sous les toits en shed des ateliers d’usinage. C’est là que Karim a posé son premier établi de vélo, là que les jeunes ont peint leurs fresques. »',
      '« Une friche n’est pas une ruine : c’est une page blanche immense offerte à ceux qui savent inventer avec leurs dix doigts. Ce que le grand capital a jeté, la communauté peut le ramasser et le faire refleurir. »',
    ],
    note: '« Elinor avait vu juste dans ses études sur les forêts suisses : les espaces délaissés par les géants redeviennent des biens communs dès que les riverains se parlent et fixent leurs règles de gestion. »',
    ghost: 'ostrom',
  },

  // ---------- Palier 4 : La Vallée ----------
  {
    id: 'beat_lucien_8_le_canal_et_la_voie_deau',
    trigger: { tier: 4, day: 60 },
    title: 'Cahier n°8 : La lenteur féconde du canal de la Malterie',
    pages: [
      'Lucien évoque les mariniers qui descendaient le Taret jusqu’à Néo-Baie avec leurs péniches chargées de cinquante tonnes de fonte dans les années soixante-dix.',
      '« Une péniche mettait trois jours pour rallier l’estuaire, là où un camion moderne met deux heures d’autoroute. Mais la péniche brûlait un dixième du fioul et glissait sur l’eau sans défoncer les routes communales. »',
      '« Dans l’économie moderne, la vitesse est devenue une névrose. On paie des fortunes pour livrer en trente minutes des colifichets dont personne n’a besoin. Réapprends la valeur de la lenteur : c’est souvent là que dort la véritable efficacité écologique. »',
    ],
    note: '« David parlait d’avantage comparatif en regardant les navires de commerce anglais. S’il avait vu nos canaux, il aurait compris que le premier avantage comparatif d’une région, c’est sa géographie naturelle. »',
    ghost: 'ricardo',
  },
  {
    id: 'beat_lucien_9_thierry_et_le_drive',
    trigger: { tier: 4, concepts: 11 },
    title: 'Cahier n°9 : Thierry, mon fils, et le hangar sans fenêtres',
    pages: [
      'C’est la page la plus intime du carnet. Lucien y parle de son fils Thierry — le père du joueur — après son embauche comme cariste chez le rival HyperVal.',
      '« Thierry m’a dit : "Piste au chaud, papa, un CDI, et puis j’ai un fenwick avec un écran tactile." Mais quand je regarde ses yeux le dimanche midi, je vois la tristesse de l’artisan dépossédé. À l’aciérie, il voyait le métal rougeoyer sous ses mains ; au Drive, il ne voit que des codes-barres qui bippent toutes les quarante secondes. »',
      '« L’ironie de cette ville, c’est que l’enseigne qui a profité de la ruine de nos forges est celle qui emploie aujourd’hui nos enfants à charger les coffres de ses bagnoles. Promets-moi de ne jamais humilier les gens que tu feras travailler. »',
    ],
    note: '« Christophe Dejours l’a écrit noir sur blanc : la pire des blessures n’est pas la fatigue du muscle, c’est de ne pas pouvoir être fier de ce que l’on produit le soir en rentrant chez soi. »',
    ghost: 'dejours',
  },

  // ---------- Palier 5 : Le Pays ----------
  {
    id: 'beat_lucien_10_le_vertige_des_grands_nombres',
    trigger: { tier: 5, day: 120 },
    title: 'Cahier n°10 : Quand les chiffres dépassent la taille d’une vie',
    pages: [
      'Lucien médite sur les bilans financiers des grandes sociétés anonymes qu’il épluchait au comité central d’entreprise à Paris.',
      '« Quand un bilan compte six zéros, l’esprit humain s’égare. On ne voit plus la transpiration du livreur dans l’escalier du quatrième étage, on ne voit plus le meunier debout à quatre heures du matin. On ne voit que des pourcentages de marge nette qui montent ou qui descendent d’un quart de point. »',
      '« Si ton entreprise grandit jusqu’à couvrir le pays entier, fais ce vœu : passe au moins une journée par mois derrière le comptoir le plus modeste ou au volant de la plus vieille camionnette. C’est le seul antidote contre la folie des grandeurs. »',
    ],
    note: '« Pierre Bourdieu m’avait prévenu lors d’un débat à la Sorbonne en 1993 : le plus grand piège pour un enfant du peuple qui réussit, c’est d’adopter sans s’en rendre compte le mépris de classe de ceux qu’il a combattus. »',
    ghost: 'bourdieu',
  },
  {
    id: 'beat_lucien_11_le_pouvoir_et_les_lois',
    trigger: { tier: 5, concepts: 14 },
    title: 'Cahier n°11 : La frontière entre le commerce et la domination',
    pages: [
      'À l’époque où Taret-Acier finançait les campagnes électorales des députés locaux, Lucien avait rédigé un rapport cinglant sur les liaisons dangereuses entre argent et politique.',
      '« Tant qu’une entreprise vend des gâteaux, des vélos ou des chemises, elle participe au bien-être de la cité. Mais dès qu’elle devient assez grosse pour dicter le tracé des autoroutes, rédiger elle-même les décrets ministériels ou menacer un maire de délocalisation, elle cesse d’être un commerce : elle devient un pouvoir despotique. »',
      '« Ne confonds jamais ta réussite d’entrepreneur avec un droit divin de commander aux citoyens. La démocratie commence précisément là où la puissance de ton chéquier s’arrête. »',
    ],
    note: '« Max Weber l’a formulé avec une rigueur implacable : l’État revendique le monopole de la violence légitime. Quand un cartel économique tente de lui voler ce monopole par la corruption, la liberté commune agonise. »',
    ghost: 'weber',
  },

  // ---------- Palier 6 : Le Monde ----------
  {
    id: 'beat_lucien_12_les_routes_de_la_soie_et_du_fer',
    trigger: { tier: 6, day: 200 },
    title: 'Cahier n°12 : Des conteneurs sur tous les océans',
    pages: [
      'Dans les derniers feuillets noircis quelques mois avant sa disparition, Lucien analyse la mondialisation des chaînes de valeur avec une lucidité prophétique.',
      '« Ils ont découpé le monde en morceaux : l’extraction du minerai en Afrique, le laminage en Asie, l’assemblage en Europe de l’Est, le siège social aux Bermudes et la livraison au consommateur de Val-Ferrand par des livreurs sous-payés. Cette chaîne de dix mille kilomètres ne tient que par le pétrole bon marché et le silence des exploités. »',
      '« Si ton réseau s’étend par-delà les mers, fais-le sur d’autres bases : tisse des liens de respect mutuel entre travailleurs d’ici et d’ailleurs, sans jamais dresser l’ouvrier de Val-Ferrand contre celui de Shanghai ou de Dakar. »',
    ],
    note: '« Rosa Luxemburg l’avait prédit il y a plus d’un siècle : le capitalisme mondialisé doit sans cesse dévorer de nouveaux territoires pour survivre à ses propres crises, jusqu’au jour où il n’y a plus rien à piller sur cette terre finie. »',
    ghost: 'rosa',
  },
  {
    id: 'beat_lucien_13_le_testament_secret_du_haut_fourneau',
    trigger: { tier: 6, concepts: 17 },
    title: 'Cahier n°13 : Le trésor enfoui sous la dalle de coulée',
    pages: [
      'Ce texte n’était pas dans le carnet principal : il était dissimulé dans une enveloppe scellée à la cire rouge, cachée dans le double fond de la boîte à outils de Lucien.',
      '« Si tu lis ces lignes, mon enfant, c’est que tu as franchi toutes les étapes que j’avais esquissées dans mes rêves les plus fous. Tu as bâti ce que notre génération n’a jamais su concevoir : un géant qui a grandi sans écraser ses voisins, une force productive qui appartient aux siens. »',
      '« Va sous l’ancienne halle de coulée du haut-fourneau n°2, sous la quatrième traverse de rail. J’y ai enterré en 2014 le registre des fondateurs de 1952 et la clé en laiton de la caisse mutuelle. Ce n’est pas de l’or : c’est le symbole de notre pacte. »',
    ],
    note: '« Kate me disait souvent : la véritable richesse d’un arbre ne se mesure pas à la hauteur de son tronc, mais à la profondeur de ses racines et à l’ombre bienfaisante qu’il offre à ceux qui marchent sous le soleil. »',
    ghost: 'raworth',
  },
  {
    id: 'beat_lucien_14_la_revelation_finale',
    trigger: { tier: 6, concepts: 20 },
    title: 'Cahier n°14 : Ce que j’espérais de toi',
    pages: [
      'La toute dernière page du testament de Lucien, écrite d’une main tremblante mais décidée, quelques jours avant son dernier souffle à l’hôpital de Val-Ferrand.',
      '« Tu te demandes pourquoi ces voix habitent ton esprit. Tu croyais que c’était l’étagère qui était tombée sur ta tête. Mais les livres ne parlent qu’à ceux qui sont prêts à les écouter. Pendant douze ans, avant que tu n’apprennes à lire, je te berçais en te racontant l’histoire des tisserands de Silésie, des coopérateurs de Rochdale et des fondeurs du Taret. »',
      '« Tu es l’enfant de cette vallée. Tu portes en toi notre colère, notre savoir-faire et notre soif de justice. Maintenant que tu possèdes un empire, le plus dur commence : le transformer en bien commun. Choisis ton chemin, mon enfant. La vallée te regarde. »',
      'Dans le silence de la nuit, les vingt-deux voix des penseurs se taisent enfin un instant, unies dans un respect fraternel, attendant ta décision suprême.',
    ],
    note: '« Adam et Karl sourient ensemble pour la première fois. Mon enfant, la table est dressée. À toi d’écrire la suite de l’Histoire. »',
    ghost: 'smith',
  },
];
