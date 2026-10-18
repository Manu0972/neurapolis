/**
 * NEURAPOLIS — Galerie Approfondie des 15 Habitants de Val-Ferrand
 * Spécification narrative complète (Survey 2 §4, ORIGINAL_REQUEST.md R2).
 */
import type { NpcDef, RoutineSlot } from '../core/types';
import type { ExtendedDistrictId } from './districts/types';

export interface CharacterSheet {
  id: string;
  name: string;
  age: number;
  role: string;
  district: ExtendedDistrictId;
  traits: string[];
  intimateSecret: string;
  humorAndTics: string;
  systemicHook: string;
}

export interface ExpandedNpcDef extends CharacterSheet {
  color: string;
  routine: RoutineSlot[];
  dialoguePharesi: {
    accueil: string[];
    secretRevele?: string[];
    conflit?: string[];
    victoire?: string[];
  };
  specialAbility?: {
    id: string;
    label: string;
    description: string;
    effectDescription: string;
  };
}

export const NPCS_EXPANDED: ExpandedNpcDef[] = [
  {
    id: 'noah',
    name: 'Noah Martin',
    age: 12,
    role: 'Ami proche & inventeur impulsif',
    district: 'roses',
    color: '#4ea1ff',
    traits: ['Créatif', 'Sociable', 'Impulsif', 'Sensible'],
    intimateSecret:
      'Dessine en cachette la BD satirique "Les Échappés du Val" où les profs et le patron du Drive sont des monstres mécaniques vaincus par des enfants en rollers, et a fait sauter la cafetière familiale en voulant y brancher un moteur de ventilateur.',
    humorAndTics:
      'Remet sa casquette à l’envers dès qu’une idée jaillit ; invente des noms délirants ("Goûters Laser 3000", "L’Attaque du Sablé Atomique") ; incapable de rester immobile plus de 20 secondes.',
    systemicHook:
      'Stand des Roses : dynamise les ventes de rue (+25% volume) mais génère un risque d’incident loufoque si son stress dépasse 70.',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'cherche sa deuxième chaussette' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'en cours (distrait)' },
      { from: '16:40', to: '18:00', place: 'parc', activity: 'skate et figures acrobatiques' },
      { from: '18:00', to: '21:30', place: 'maison', activity: 'dessine sa BD secrète', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Yo Camille ! T’as vu mon croquis pour le triporteur à turbo-fusées ? On colle deux ventilos et on bat le TGV !',
        'Lina veut qu’on classe les cookies par ordre alphabétique… Tu te rends compte du calvaire ? Viens on teste plutôt le lance-crêpes.',
      ],
      secretRevele: [
        'Bon… promets que tu rigoles pas. Si la cafetière de mon père a explosé, c’était pas un court-circuit. Je voulais extraire le marc de café pour faire du carburant solide. Voilà.',
      ],
      conflit: [
        'C’est toujours Lina qui décide parce qu’elle a des tableaux Excel ! Mais l’imagination, ça se met pas en colonnes !',
      ],
      victoire: [
        'On a vendu tout le stock ! Je savais que mon panneau géant avec le dinosaure mangeur de madeleines allait faire un carton !',
      ],
    },
    specialAbility: {
      id: 'trouvaille_express',
      label: 'Trouvaille Express',
      description: 'Noah bricole un présentoir flashy à partir de cartons recyclés.',
      effectDescription: '+20% d’affluence clients pendant 2 heures au Stand des Roses.',
    },
  },
  {
    id: 'lina',
    name: 'Lina Kessler',
    age: 12,
    role: 'Camarade rigoureuse & gestionnaire',
    district: 'roses',
    color: '#5cd6e8',
    traits: ['Organisée', 'Prudente', 'Loyale', 'Équitable'],
    intimateSecret:
      'Écrit des poèmes d’amour au quartier sous son matelas et a renfloué en douce la caisse du stand avec trois euros de sa propre tirelire pour éviter à Noah la panique d’un déficit.',
    humorAndTics:
      'Dégaine son stylo 4-couleurs en 0.3s digne d’un tireur d’élite ; utilise des acronymes administratifs absurdes ("Opération RBT : Ranger la Boîte à Thon") ; fronce les sourcils au millimètre.',
    systemicHook:
      'Stand des Roses : garantit la tenue des livres de comptes et l’invariant mathématique strict de trésorerie.',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'vérifie son planning de la journée' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'en cours (premier rang)' },
      { from: '16:40', to: '17:30', place: 'college', activity: 'permanence et devoirs' },
      { from: '17:30', to: '19:00', place: 'epicerie', activity: 'aide aux écritures comptables', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Bonjour Camille. J’ai réévalué les marges nettes sur les sablés. Si nous intégrons la farine bio de Mme Bertin, le point mort est atteint à quatorze unités.',
        'Noah a encore écrit nos recettes sur un coin de nappe en papier… Je l’ai recopié en double exemplaire avec horodatage.',
      ],
      secretRevele: [
        'Si les comptes tombaient juste le premier vendredi, ce n’était pas un miracle statistique… C’était trois euros de ma tirelire d’anniversaire. Ne lui dis jamais, il serait mortifié.',
      ],
      conflit: [
        'On ne peut pas distribuer les bénéfices avant d’avoir provisionné la farine de lundi ! Ce n’est pas du rabat-joie, c’est de la survie collective !',
      ],
      victoire: [
        'Invariant de caisse vérifié au centime près. Zéro écart, zéro perte. C’est la plus belle chose que j’aie vue de la semaine.',
      ],
    },
    specialAbility: {
      id: 'rigueur_comptable',
      label: 'Rigueur Comptable',
      description: 'Lina audite scrupuleusement les entrées et sorties du stand.',
      effectDescription: 'Annule tout risque d’erreur de caisse ou de perte de monnaie divisionnaire.',
    },
  },
  {
    id: 'bertin',
    name: 'Monique Bertin',
    age: 58,
    role: 'Épicière historique vigilante',
    district: 'roses',
    color: '#ff9a5c',
    traits: ['Bourrue', 'Bienveillante', 'Vigie', 'Infatigable'],
    intimateSecret:
      'Détient le carnet des tisanes médicinales prodigieuses transmises par sa grand-mère du Jura et conserve sous le plancher de sa réserve un vieux fusil démonté avec lequel elle promet de descendre les drones du Drive s’ils rasent son auvent.',
    humorAndTics:
      'Parle à son vieux réfrigérateur à compresseur asthmatique en l’appelant "Léon" ; distribue des caramels mous pour clore les débats stériles ; repère à 40 mètres un gamin touchant un fruit.',
    systemicHook:
      'Approvisionnement de base et jauge vitaliteEpicerie ; débloque les tisanes régénératrices annulant le stress et la fatigue.',
    routine: [
      { from: '07:30', to: '13:00', place: 'epicerie', activity: 'tient la boutique et accueille les habitués', weekends: true },
      { from: '14:30', to: '19:30', place: 'epicerie', activity: 'inventaire, conserves et tisanes', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Prends un caramel et assieds-toi deux minutes. Le Drive a encore baissé le prix des chips de douze centimes. Ils perdent de l’argent pour me tuer, mais Léon et moi on est plus solides que leurs algorithmes.',
        'Touche pas à cette pêche, petit ! Elle respire encore, regarde avec les yeux ! Qu’est-ce qu’il te faut ? De la levure ?',
      ],
      secretRevele: [
        'Tu as vu ce carnet à reliure de cuir ? Ma grand-mère y notait l’art de marier la reine-des-prés et la menthe poivrée. Bois cette tasse : dans dix minutes, ta fatigue s’est envolée comme la buée sur Léon.',
      ],
      conflit: [
        'Tant que je serai debout derrière ce comptoir, personne dans cette cité n’ira se coucher le ventre vide faute de pièces jaunes ! Vous m’entendez ?',
      ],
      victoire: [
        'Vingt-quatre pots de confiture vendus en deux heures ! Le grand magasin peut remballer ses camions en plastique : le goût des mûres du canal gagne toujours à la fin.',
      ],
    },
    specialAbility: {
      id: 'tisane_du_regain',
      label: 'Tisane du Regain',
      description: 'Mme Bertin sert une décoction secrète d’herbes sauvages des berges.',
      effectDescription: 'Réduit instantanément la fatigue de Camille de 30 points et le stress de 20 points.',
    },
  },
  {
    id: 'samir',
    name: 'Samir Ould-Ali',
    age: 41,
    role: 'Leader pragmatique de TaretCoop',
    district: 'bassin',
    color: '#3ddc84',
    traits: ['Visionnaire', 'Tenace', 'Protecteur', 'Stressé'],
    intimateSecret:
      'Règle les premières factures d’électricité de la coopérative sur ses propres indemnités de chômage pour préserver le moral des neuf associés fondateurs de la Friche.',
    humorAndTics:
      'Ajuste ses lunettes rondes avec deux doigts en citant les articles de la loi de 1901 ; soupire profondément avant de débloquer une situation bloquée.',
    systemicHook:
      'Ateliers coopératifs modulaires, arbitrage démocratique et médiation des conflits d’artisans.',
    routine: [
      { from: '08:30', to: '12:30', place: 'friche', activity: 'coordonne les ateliers et négocie les statuts', weekends: true },
      { from: '13:30', to: '17:30', place: 'place', activity: 'démarche la mairie et les partenaires', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Une coopérative, Camille, ce n’est pas une utopie pour poètes du dimanche : c’est une entreprise où les femmes et les hommes ne sont pas des variables d’ajustement sur une feuille de calcul.',
        'Karim veut encore monter des écrous au pas impérial sur la bétonnière… Va lui apporter un café avant qu’il ne prenne sa masse.',
      ],
      secretRevele: [
        'Si la facture Enedis a été soldée mardi, ne demande pas d’où venaient les 400 euros. Ce qui compte, c’est que les machines tournent et que les ouvriers aient la tête haute.',
      ],
      conflit: [
        'Si on commence à payer certains au rendement individuel et d’autres au lance-pierre, on recrée l’usine Taret dans nos propres murs ! La règle d’Ostrom, c’est l’équité délibérée !',
      ],
      victoire: [
        'La mairie a signé la convention d’occupation temporaire ! Dix-huit mois d’autogestion garantis devant notaire ! Venez trinquer au jus de pomme chaud !',
      ],
    },
    specialAbility: {
      id: 'mediation_citoyenne',
      label: 'Médiation Citoyenne',
      description: 'Samir convoque une table ronde apaisée entre parties divergentes.',
      effectDescription: 'Désamorce instantanément tout conflit interne entre coéquipiers.',
    },
  },
  {
    id: 'karim',
    name: 'Karim Bensalah',
    age: 34,
    role: 'Maître mécanicien de l’acier',
    district: 'bassin',
    color: '#ffc94a',
    traits: ['Fier', 'Ouvrier d’or', 'Têtu', 'Généreux'],
    intimateSecret:
      'Restaure en secret au fond du hangar 7 la mythique Citroën DS 19 de son grand-père en y installant un moteur à hydrogène fait de tuyaux de chaudière et de batteries de récupération.',
    humorAndTics:
      'Frappe sur le métal avec sa clé à molette de 24 pour ponctuer ses arguments politiques (CLANG !) ; refuse catégoriquement d’utiliser des vis à tête plastique.',
    systemicHook:
      'Réparation lourde de machines, usinage au tour et rétrofit mécanique de la flotte de triporteurs.',
    routine: [
      { from: '08:00', to: '12:00', place: 'place', activity: 'discute mécanique et cherche des métaux' },
      { from: '12:00', to: '14:00', place: 'maison', activity: 'déjeuner' },
      { from: '14:00', to: '18:30', place: 'friche', activity: 'forge, usinage et soudure dans la friche', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'La lutte des classes, mon p’tit gars, ça commence quand le roulement à billes n’est plus graissé ! (CLANG ! sur l’établi) Si tu négliges l’outil, l’outil te rejette !',
        'Regarde ce châssis de triporteur : de l’acier français des années 70. Tu peux monter un éléphant dessus, ça bronche pas.',
      ],
      secretRevele: [
        'Viens sous la bâche… Regarde cette carrosserie aérospatiale. C’est la DS de mon grand-père. Il a passé 35 ans chez Taret. Avec cette pile à hydrogène, elle roulera sans polluer un brin d’herbe.',
      ],
      conflit: [
        'Samir avec ses normes européennes ! Un pas métrique ISO de 1.5 sur une meuleuse d’angle, ça vibre et ça casse en deux mois ! Écoute les mains qui savent !',
      ],
      victoire: [
        'Le moteur ronronne comme un gros chat nourri à la crème ! Plus un grincement, zéro jeu ! Ça, c’est du travail d’artisan !',
      ],
    },
    specialAbility: {
      id: 'tour_de_main',
      label: 'Tour de Main de l’Acier',
      description: 'Karim répare un outil récalcitrant en quelques coups de lime précis.',
      effectDescription: 'Restaure l’état d’un équipement à 100% sans dépenser un euro de pièces neuves.',
    },
  },
  {
    id: 'monique_p',
    name: 'Monique Petitjean',
    age: 71,
    role: 'Mémoire ouvrière du quartier',
    district: 'roses',
    color: '#b78bff',
    traits: ['Observatrice', 'Vigilante', 'Conteuse', 'Piquante'],
    intimateSecret:
      'Ancienne agente de liaison syndicale clandestine en mai 68, elle a sauvé du pilon et dissimulé dans son grenier les registres manuscrits de solidarité de l’usine Taret.',
    humorAndTics:
      'Tricote des écharpes démesurées de trois mètres de long sans jamais regarder ses aiguilles, les yeux rivés sur les allées et venues du trottoir.',
    systemicHook:
      'Indice d’humeur des aînés, préservation de l’histoire locale et mobilisation des voix pour le budget participatif.',
    routine: [
      { from: '09:00', to: '11:00', place: 'epicerie', activity: 'fait ses courses en discutant avec Monique Bertin', weekends: true },
      { from: '14:00', to: '17:30', place: 'parc', activity: 'surveille le quartier sur le banc des anciens', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Je suis née au numéro 14 de cette rue, mon petit. Les promesses des maires, j’en ai vu passer sept mandats. Ce qui reste, c’est les gens qui se saluent le matin.',
        'Tiens, mange ce pruneau. Tu es pâle comme une feuille de papier calque. Tu travailles trop avec tes fantômes dans la tête.',
      ],
      secretRevele: [
        'En juin 68, quand la direction a voulu évacuer les caisses noires, c’est dans ma poussette d’enfant qu’on a passé les carnets d’entraide. La vraie solidarité ne s’écrit pas sur les affiches, elle se vit dans les corridors.',
      ],
      conflit: [
        'Les jeunes d’aujourd’hui croient avoir inventé le partage parce qu’ils ont des téléphones portables ! On partageait nos gamelles quand vos grands-pères avaient froid aux fonderies !',
      ],
      victoire: [
        'Le banc des anciens a voté d’une seule voix ! Cent douze bulletins pour le verger partagé ! Quand les vieux se lèvent, la ville écoute !',
      ],
    },
    specialAbility: {
      id: 'memoire_ouvriere',
      label: 'Mémoire Ouvrière',
      description: 'Monique raconte une anecdote d’autrefois galvanisant les citoyens.',
      effectDescription: '+15 points de confiance de quartier auprès de la cohorte des anciens.',
    },
  },
  {
    id: 'yasmine',
    name: 'Yasmine Diallo',
    age: 13,
    role: 'Déléguée & journaliste d’investigation',
    district: 'roses',
    color: '#ff8fc0',
    traits: ['Curieuse', 'Éloquente', 'Impétueuse', 'Engagée'],
    intimateSecret:
      'Rédige et imprime clandestinement "La Gazette du Préau", révélant les marges abusives du distributeur automatique Selecta et les dessous des conseils de classe.',
    humorAndTics:
      'Ponctue ses phrases par "Source vérifiée à 94 % !" en enregistrant des mémos vocaux frénétiques sur son dictaphone rose bonbon.',
    systemicHook:
      'Dissémination rapide des événements émergents, création de dynamiques d’opinion et mobilisation de la jeunesse.',
    routine: [
      { from: '07:00', to: '08:20', place: 'maison', activity: 'lit les flux d’actualités' },
      { from: '08:20', to: '16:40', place: 'college', activity: 'cours et interviews à la récré' },
      { from: '16:40', to: '19:00', place: 'place', activity: 'mène l’enquête sur la place du marché', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Camille ! Déclaration exclusive pour la Gazette : est-il vrai que le Stand des Roses prépare une alliance avec les producteurs de café des docks ? Les collégiens veulent savoir !',
        'Source vérifiée à 94 % : le Drive HyperVal teste des capteurs de fréquentation thermique sur les bancs publics. Je prépare un dossier brûlant !',
      ],
      secretRevele: [
        'C’est moi qui ai collé les stickers sur le distributeur de barres chocolatées. Ils vendent de l’huile de palme à 20 euros le kilo aux élèves de 6e ! Il fallait que quelqu’un documente le scandale.',
      ],
      conflit: [
        'La liberté de la presse s’arrête là où commence le secret commercial des grandes enseignes ! Mais mon bloc-notes n’a pas peur des avocats !',
      ],
      victoire: [
        'L’article a fait le tour du collège en vingt minutes ! Le principal a promis de remplacer les sodas par des jus de pommes artisanaux !',
      ],
    },
    specialAbility: {
      id: 'scoop_revigorant',
      label: 'Scoop Revigorant',
      description: 'Yasmine publie un article élogieux sur l’initiative locale.',
      effectDescription: '+10 de réputation et +20% d’affluence de collégiens pour le stand.',
    },
  },
  {
    id: 'moreau',
    name: 'Mme Hélène Moreau',
    age: 39,
    role: 'Professeure de lettres & citoyenneté',
    district: 'roses',
    color: '#8a9bb8',
    traits: ['Pédagogue', 'Exigeante', 'Lucide', 'Humaniste'],
    intimateSecret:
      'Rêvait de monter une école libre et autogérée dans les Cévennes d’après Célestin Freinet et Jean-Jacques Rousseau, avant de choisir de se battre au cœur de l’école publique républicaine.',
    humorAndTics:
      'Range sa boîte de craies d’un claquement sec et pose des questions socratiques redoutables qui obligent les élèves à repenser leurs préjugés.',
    systemicHook:
      'Validation académique des notions philosophiques et économiques découvertes par Camille ; arbitrage moral des décisions.',
    routine: [
      { from: '08:00', to: '12:00', place: 'college', activity: 'donne cours de lettres et éducation civique' },
      { from: '13:00', to: '17:00', place: 'college', activity: 'corrige les copies et reçoit les parents' },
    ],
    dialoguePharesi: {
      accueil: [
        'Bonjour Camille. J’observe votre projet de stand avec beaucoup d’intérêt. L’économie n’est pas une technique froide : c’est la manière dont une cité choisit de répartir le pain et l’honneur.',
        'Quand vous fixez un prix, vous écrivez un poème moral. Veillez à ce que vos rimes soient équitables pour ceux qui n’ont que peu de monnaie.',
      ],
      secretRevele: [
        'À vingt ans, je voulais tout quitter pour élever des chèvres et enseigner aux enfants sans cloche ni notes dans les Cévennes. Mais c’est ici, entre ces murs de béton, que l’égalité républicaine a besoin de serviteurs.',
      ],
      conflit: [
        'Tricher sur la marge pour financer une bonne cause reste une tricherie. On ne bâtit pas une république vertueuse sur des petits arrangements comptables.',
      ],
      victoire: [
        'Votre exposé sur les Communs et la pensée d’Elinor Ostrom était lumineux. Même le proviseur a pris des notes. Félicitations, jeune bâtisseur.',
      ],
    },
    specialAbility: {
      id: 'eclairage_socratique',
      label: 'Éclairage Socratique',
      description: 'Mme Moreau pose une question clé clarifiant un dilemme complexe.',
      effectDescription: '+10 points de Compréhension et débloque le niveau suivant d’une notion économique.',
    },
  },
  {
    id: 'gaspard_vaneck',
    name: 'Gaspard Vaneck',
    age: 62,
    role: 'Concierge en chef des Belvédères',
    district: 'hauts',
    color: '#a47854',
    traits: ['Soupçonneux', 'Dévoué', 'Maniaque', 'Félinophile'],
    intimateSecret:
      'Persuadé que les chats de gouttière du quartier transmettent des ordres municipaux codés par la fréquence de leurs clignements d’yeux ; nourrit 14 félins dans l’ancien vide-ordures condamné.',
    humorAndTics:
      'Porte une ceinture avec 74 clés qui tintent à chaque pas ; parle à voix basse en surveillant les toits d’un regard circulaire.',
    systemicHook:
      'Détient le passe-partout des toits végétalisés et prévient Camille 24h avant l’apparition d’un drone du Drive HyperVal.',
    routine: [
      { from: '06:00', to: '11:30', place: 'maison', activity: 'ronde des coursives et nourrissage des chats' },
      { from: '14:00', to: '19:00', place: 'parc', activity: 'surveillance des toits et belvédères des Hauts', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Chut ! Pas si fort, petit. Tu as vu le noir et blanc sur le muret ? Il a cligné deux fois de l’œil gauche. Ça veut dire que le ramassage des bennes est décalé à jeudi. Note-le.',
        'Les gens croient que le Drive envoie des drones pour livrer des chips… Quelle candeur ! Ces engins scannent la couleur des rideaux pour réévaluer le cadastre !',
      ],
      secretRevele: [
        'Dans le local vide-ordures du bloc C, le Sergent Moustache et le Lieutenant Gouttière décodent les miaulements des chats du centre-ville. Rien ne m’échappe. Absolument rien.',
      ],
      conflit: [
        'Pas question de poser des bacs de terre sur la terrasse nord sans mon aval signé ! Vous allez déséquilibrer la portance des dalles et affoler les pigeons veilleurs !',
      ],
      victoire: [
        'Le drone est tombé net dans mes géraniums ! Le filet de pêche de la terrasse l’a cueilli à six mètres de haut ! Pas un paquet de chips n’a atterri sans contrôle !',
      ],
    },
    specialAbility: {
      id: 'vigie_des_toits',
      label: 'Vigie des Toits',
      description: 'Gaspard active son réseau félin et prévient d’une incursion commerciale.',
      effectDescription: 'Permet d’intercepter à 100% le prochain événement de drone ou espionnage du Drive.',
    },
  },
  {
    id: 'dj_mirabelle',
    name: 'Mireille "DJ Mirabelle" Bisset',
    age: 26,
    role: 'Animatrice de Radio Val-Libre',
    district: 'hauts',
    color: '#e88065',
    traits: ['Énergique', 'Mélomane', 'Frondeuse', 'Noctambule'],
    intimateSecret:
      'Fille cachée du premier adjoint au maire en charge de l’urbanisme commercial, elle démonte chaque semaine à l’antenne les projets de bétonnisation de son propre père.',
    humorAndTics:
      'Bruite ses jingles à la bouche ("Tchiki-tchiki-Val ! La fréquence qui décape les tympans !") avant chaque prise d’antenne impromptue.',
    systemicHook:
      'Gestion des programmes radio, modélisation de l’audience et érosion directe de la part de marché du Drive HyperVal.',
    routine: [
      { from: '11:00', to: '15:00', place: 'maison', activity: 'sommeil et écoute de vinyles' },
      { from: '16:00', to: '23:00', place: 'parc', activity: 'studio radio pirate et montage sonore', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Tchiki-tchiki-Val ! 107.4 sur votre bande FM ! Ici Mirabelle en direct du nichoir des Hauts ! Aujourd’hui, spécial cookies artisanaux et résistance poétique !',
        'Hey Camille ! Prends le casque et installe-toi. J’ai dix minutes d’antenne libre avant le passage du camion de mesure des ondes. Tu nous dis quoi sur les prix du marché ?',
      ],
      secretRevele: [
        'Mon père, c’est l’adjoint aux finances qui a signé le permis de construire de la zone commerciale… Chaque fois que je balance un rap ouvrier à l’antenne, je lui rappelle qu’on n’achète pas notre silence avec un rond-point.',
      ],
      conflit: [
        'Ne me demandez pas de diffuser des spots publicitaires pour vos confitures ! La radio est un bien commun, pas un panneau d’affichage pour commerçants, même sympas !',
      ],
      victoire: [
        'Pic d’audience historique ! Quarante-deux pour cent des postes allumés sur le quartier ! Le Drive a dû fermer deux caisses faute de clients !',
      ],
    },
    specialAbility: {
      id: 'tribune_libre',
      label: 'Tribune Libre Pirate',
      description: 'Mirabelle ouvre le micro aux enfants et artisans du quartier.',
      effectDescription: '+25 points d’audience radio et +5 de confiance de quartier.',
    },
  },
  {
    id: 'louison_zephir',
    name: 'Louison / Zéphir',
    age: 22,
    role: 'Fresquiste prophétique des ombres',
    district: 'caves',
    color: '#6a84a8',
    traits: ['Mystique', 'Silencieux', 'Visionnaire', 'Sensible'],
    intimateSecret:
      'A peint sur un pilier du viaduc ferroviaire en 2019 une balance brisée et des masques blancs six mois avant la crise sanitaire ; vit dans la terreur que ses œuvres ne soient pas seulement des reflets mais les déclencheurs des tempêtes.',
    humorAndTics:
      'Sent la térébenthine à dix pas ; ne répond jamais directement aux questions posées mais désigne du doigt une fissure ou un détail allégorique sur la pierre.',
    systemicHook:
      'Oracle économique diégétique : consulter ses fresques dans les caves donne un bonus d’anticipation de 48h sur les événements de marché.',
    routine: [
      { from: '02:00', to: '07:00', place: 'friche', activity: 'peinture clandestine sur les pignons' },
      { from: '10:00', to: '18:00', place: 'maison', activity: 'méditation et broyage de pigments naturels', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Regarde la chaux qui sèche. Elle boit l’humidité de la roche comme le quartier boit l’angoisse des fins de mois. Ne parle pas : regarde la couleur qui s’installe.',
        'Trois corbeaux sur la branche de sureau… Ce n’est pas un mauvais présage, c’est le signe que le blé va manquer sur les marchés de gros. Préparez la farine d’avoine.',
      ],
      secretRevele: [
        'En 2019, j’ai peint les visages bandés et le grand silence… Six mois plus tard, les rues étaient vides. J’ai juré de ne plus jamais peindre la colère, seulement les ponts et les ruches.',
      ],
      conflit: [
        'La pierre n’appartient pas à ceux qui la possèdent sur un acte notarié. Elle appartient à la mémoire de la sueur qui l’a taillée.',
      ],
      victoire: [
        'L’ocre jaune a tenu bon contre la pluie. La fresque respire. Demain, le soleil se lèvera sur une place apaisée.',
      ],
    },
    specialAbility: {
      id: 'oracle_mural',
      label: 'Oracle Mural',
      description: 'Louison dévoile une fresque fraîchement peinte dans la voûte calcaire.',
      effectDescription: 'Révèle à l’avance l’événement émergent économique des deux prochains jours.',
    },
  },
  {
    id: 'silvio_taupe',
    name: 'Silvio "La Taupe"',
    age: 73,
    role: 'Gardien spéléologue des caves',
    district: 'caves',
    color: '#7b8499',
    traits: ['Ermite', 'Bienveillant', 'Archiviste', 'Agile'],
    intimateSecret:
      'A sauvé de la benne à ordures lors de la liquidation judiciaire de 1994 l’intégralité des registres matricules ouvriers de l’usine Taret depuis 1888, conservés dans des malles étanches.',
    humorAndTics:
      'S’allume le visage avec une vieille lampe frontale jaune d’époque spéléo et propose toujours des pleurotes crues tout juste cueillies sur son marc de café.',
    systemicHook:
      'Détient les clés des grilles blindées souterraines reliant les quartiers ; débloque le transit furtif sans malus météo de pluie.',
    routine: [
      { from: '08:00', to: '13:00', place: 'maison', activity: 'arrosage de la champignonnière' },
      { from: '14:00', to: '20:00', place: 'friche', activity: 'maintenance des galeries et graissage des gonds', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Tiens, goûte ce chapeau de pleurote. Croquant comme de la noisette fraîche, non ? Le marc de café de Mme Bertin donne un goût incomparable. La surface court, mais ici, tout prend son temps.',
        'La pluie tambourine sur les trottoirs ? Prends la galerie des carriers. Dans six minutes tu es à la friche sans une goutte sur ton cartable.',
      ],
      secretRevele: [
        'Ces malles en fer blanc… C’est l’âme de Val-Ferrand. Mille deux cents noms d’ouvriers, de tisseurs, de contremaîtres. La direction voulait les brûler pour effacer les maladies professionnelles. Je les ai portées sur mon dos, marche par marche.',
      ],
      conflit: [
        'On ne court pas dans mes galeries ! La roche calcaire a deux millions d’années, elle n’a que faire de vos urgences d’enfants pressés ! Respectez le silence.',
      ],
      victoire: [
        'La porte de fer est débloquée. Les verrous graissés au suif glissent comme sur de la soie. Le passage entre l’école et les quais est ouvert pour les vélos !',
      ],
    },
    specialAbility: {
      id: 'cle_des_carriers',
      label: 'Clé des Carriers',
      description: 'Silvio ouvre un raccourci secret sous les voûtes.',
      effectDescription: 'Permet un déplacement instantané entre quartiers sans dépense de fatigue ni effet de pluie.',
    },
  },
  {
    id: 'capitaine_yannick',
    name: 'Capitaine Yannick "Le Gabier"',
    age: 64,
    role: 'Batelier torréfacteur insoumis',
    district: 'docks',
    color: '#396e94',
    traits: ['Bon vivant', 'Hâbleur', 'Solidaire', 'Brave'],
    intimateSecret:
      'Achemine du café d’altitude bio et des fèves de cacao par péniche depuis le port fluvial sans acquitter les redevances spéculatives des terminaux privés du grand groupe logistique.',
    humorAndTics:
      'Fume une pipe en bruyère perpétuellement éteinte et ponctue ses récits de tempêtes sur le Rhône par un retentissant "Mille sabords d’eau douce !".',
    systemicHook:
      'Approvisionnement fluvial régulier de café, cacao et farines à bas prix unitaire (transport doux par péniche).',
    routine: [
      { from: '06:00', to: '12:00', place: 'maison', activity: 'torréfaction sur la péniche et amarrage' },
      { from: '14:00', to: '19:00', place: 'place', activity: 'négociation de fret et contes au bord de l’eau', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Mille sabords d’eau douce ! Monte à bord, moussaillon ! Sens-moi cet arôme de Moka torréfié au feu de bois flotté ! Ça, mon garçon, ça réveillerait un douanier endormi depuis 1830 !',
        'Le fret routier vous étrangle avec ses péages et son pétrole cher ? Ma péniche avale cinquante tonnes avec deux litres de gasoil et le courant du fleuve. L’eau est le plus vieux chemin du monde.',
      ],
      secretRevele: [
        'Les gardes-côtes du port m’ont cherché trois fois le mois dernier. Mais sur les canaux désaffectés, quand tu connais les bras morts et les herbiers, personne n’attrape le Gabier. Le café arrive à bon port, et les coopérateurs le boivent au prix juste.',
      ],
      conflit: [
        'Payer un intermédiaire pour coller un code-barres sur mon grain de café ? Jamais de la vie ! De la main du planteur colombien à la tasse de Mme Bertin, il n’y a que de la confiance et une corde d’amarrage !',
      ],
      victoire: [
        'Le chaland est à quai ! Quinze sacs de café déchargés au Hangar 4 ! De quoi alimenter les pauses de Val-Ferrand pendant six mois !',
      ],
    },
    specialAbility: {
      id: 'fret_fluvial_solidaire',
      label: 'Fret Fluvial Solidaire',
      description: 'Le Capitaine Yannick débarque une cargaison de café ou de cacao équitable.',
      effectDescription: 'Permet d’acheter des matières premières gourmandes à -40% du prix du marché de gros.',
    },
  },
  {
    id: 'solange_vasseur',
    name: 'Solange Vasseur',
    age: 48,
    role: 'Contrôleuse de tramway poétesse',
    district: 'tramway',
    color: '#86cc68',
    traits: ['Empathique', 'Rêveuse', 'Incorruptible', 'Chaleureuse'],
    intimateSecret:
      'A caché pendant trois mois dans une motrice de réserve désaffectée un jeune apprenti mécanicien sans-papiers, le temps que la TaretCoop et le comité des Roses lui obtiennent un contrat régulier.',
    humorAndTics:
      'Composte les tickets de transport en marquant une cadence ternaire de valse et récite des alexandrins de sa composition pour détendre les passagers crispés.',
    systemicHook:
      'Régule le stress pendulaire de Camille (-15 fatigue, +10 moral) et gère la navette fret express vers la métropole.',
    routine: [
      { from: '06:30', to: '14:00', place: 'place', activity: 'tournée de contrôle et poésie sur la ligne de tram' },
      { from: '15:30', to: '19:00', place: 'maison', activity: 'halte ferroviaire et coordination logistique', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Billets, sourires, espoirs ou regrets ! Compostez votre matin, voyageur du destin ! Bonjour Camille, le rail est calme aujourd’hui, l’acier chante sous la rosée.',
        'La grande ville là-bas s’agite dans ses tours de verre. Mais chaque soir, le tramway vous ramène ici, où l’on sait encore le nom des fleurs qui poussent entre les rails.',
      ],
      secretRevele: [
        'Le petit Amine qui répare les dynamos à la friche… Quand il est arrivé sans un papier ni un sou, c’est sous la banquette de velours de la motrice 4 qu’il dormait au chaud. Un train sert à relier les humains, pas à les trier.',
      ],
      conflit: [
        'Le règlement municipal veut que j’expulse ceux qui n’ont pas un ticket à 1 euro 80 ? Ma pince à poinçonner ne sert pas à blesser les démunis. Je leur donne un poème et je note "Correspondance poétique".',
      ],
      victoire: [
        'La rame de 17h12 est entrée en gare avec deux wagons réservés aux paniers maraîchers ! La métropole va enfin goûter aux poires de Val-Ferrand !',
      ],
    },
    specialAbility: {
      id: 'vers_du_cheminot',
      label: 'Les Vers du Cheminot',
      description: 'Solange récite un sonnet réconfortant sur le quai de la gare.',
      effectDescription: 'Annule 15 points de fatigue et confère +10 de moral immédiat au joueur.',
    },
  },
  {
    id: 'maxime_chen',
    name: 'Maxime "Max" Chen',
    age: 31,
    role: 'Logisticien des circuits courts métropolitains',
    district: 'tramway',
    color: '#72b6d6',
    traits: ['Méthodique', 'Dynamique', 'Plein d’humour', 'Écologiste'],
    intimateSecret:
      'Ancien cadre logistique d’une plateforme multinationale d’e-commerce, il a démissionné avec éclat en publiant un manifeste sur l’absurdité des livraisons en dix minutes par camionnettes diesel.',
    humorAndTics:
      'Consulte sa montre connectée en calculant le bilan carbone évité de chaque colis ; utilise un sifflet d’arbitre pour lancer le départ des triporteurs.',
    systemicHook:
      'Optimisation de la logistique douce métropolitaine : augmente la vitesse et la fiabilité des tournées de livraison de 30%.',
    routine: [
      { from: '07:00', to: '12:30', place: 'place', activity: 'réception des rames fret et chargement des vélos' },
      { from: '14:00', to: '18:30', place: 'friche', activity: 'optimisation des itinéraires et maintenance des remorques', weekends: true },
    ],
    dialoguePharesi: {
      accueil: [
        'Salut Camille ! Dix-huit livraisons prévues ce matin, zéro gramme de CO2 fossile ! Chaque tour de roue de triporteur, c’est une gifle élégante à l’empire des camions diesel !',
        'On a chronométré la traversée des venelles avec Solange : à vélo-cargo, on bat la camionnette du Drive de quatorze minutes sur le centre historique ! La géométrie est de notre côté !',
      ],
      secretRevele: [
        'Quand je gérais l’entrepôt géant de la métropole, on jetait chaque semaine trois tonnes de retours clients neufs pour ne pas payer les frais de stockage… J’en faisais des cauchemars. Ici, chaque vis a une deuxième vie.',
      ],
      conflit: [
        'Non, on ne surcharge pas un triporteur à cent vingt kilos sur des pavés humides ! Respecter l’écologie, c’est aussi respecter les genoux du livreur !',
      ],
      victoire: [
        'Taux de ponctualité de 99,4 % sur la semaine ! Même les médecins du dispensaire ont adopté notre service de coursiers à vélo !',
      ],
    },
    specialAbility: {
      id: 'tournee_optimale',
      label: 'Tournée Optimale',
      description: 'Maxime calcule l’itinéraire parfait évitant montées et feux rouges.',
      effectDescription: '+30% de vitesse de livraison pour tous les triporteurs pendant 24h.',
    },
  },
];

export const CANONICAL_CHARACTERS_15: CharacterSheet[] = NPCS_EXPANDED.map((n) => ({
  id: n.id,
  name: n.name,
  age: n.age,
  role: n.role,
  district: n.district,
  traits: n.traits,
  intimateSecret: n.intimateSecret,
  humorAndTics: n.humorAndTics,
  systemicHook: n.systemicHook,
}));

/** Rétrocompatibilité exacte avec le sous-ensemble de 14 fiches de référence */
export const CANONICAL_CHARACTERS_14: CharacterSheet[] = CANONICAL_CHARACTERS_15.slice(0, 14);

export const EXPANDED_NPC_BY_ID: Record<string, ExpandedNpcDef> = Object.fromEntries(
  NPCS_EXPANDED.map((npc) => [npc.id, npc])
);
