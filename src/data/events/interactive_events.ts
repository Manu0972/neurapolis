/**
 * NEURAPOLIS — Catalogue des 32 Événements Émergents Interactifs
 * Spécification complète et déterministe (Survey 3 §4, ORIGINAL_REQUEST.md R3).
 */
import type { CauseFactor, GhostId, WorldState } from '../../core/types';

export type EventCategory =
  | 'canal_faune'
  | 'glitch_urbain'
  | 'guerre_commerciale'
  | 'rivalites_locales'
  | 'joutes_fantomes'
  | 'economie_emergente';

export interface InteractiveChoice {
  text: string;
  cost?: {
    money?: number;
    fatigue?: number;
    timeMinutes?: number;
    moneyCents?: number;
    energy?: number;
  };
  consequences: {
    reputationDelta?: number;
    vitaliteEpicerieDelta?: number;
    confianceQuartierDelta?: number;
    moneyDelta?: number;
    causes: CauseFactor[];
    statDeltas?: Partial<Record<string, number>>;
    addFlags?: string[];
    removeFlags?: string[];
    triggerEventId?: string;
  };
  ghostQuotes?: Partial<Record<GhostId, string>>;
  dialogueResponse?: string;
}

export interface InteractiveEventDef {
  id: string;
  category: EventCategory;
  title: string;
  prompt: string;
  narrativeText?: string;
  condition: (w: WorldState) => boolean;
  triggerCondition?: (w: WorldState) => boolean;
  choices: InteractiveChoice[];
  once?: boolean;
}

export const INTERACTIVE_EVENTS: InteractiveEventDef[] = [
  // ==========================================================================
  // CATÉGORIE A : FAUNE, CANAL & MYSTÈRES PORTUAIRES (5 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_CANARDS_CANAL',
    category: 'canal_faune',
    title: 'L’Invasion Pacifique mais Encombrante des Canards',
    prompt:
      'Une cinquantaine de canards colverts du canal ont débarqué sur la place du marché, bloquant les étals et caquetant joyeusement sur les pavés.',
    narrativeText:
      'Une cinquantaine de canards colverts du canal ont débarqué sur la place du marché, bloquant les étals et caquetant joyeusement sur les pavés.',
    condition: (w) => w.district.vitaliteEpicerie >= 40,
    triggerCondition: (w) => w.district.vitaliteEpicerie >= 40,
    choices: [
      {
        text: 'Vendre des sachets de graines aux passants (Smith)',
        cost: { timeMinutes: 30 },
        consequences: {
          moneyDelta: 8,
          reputationDelta: 3,
          vitaliteEpicerieDelta: 4,
          causes: [{ facteur: 'initiative marchande sur flux de passants', poids: 2 }],
        },
        ghostQuotes: {
          smith: 'Une opportunité spontanée ! La sympathie des chalands pour les oiseaux crée de la richesse !',
          marx: 'Monétiser le spectacle de la nature… Toujours prompt à transformer la vie en marchandise !',
        },
        dialogueResponse: 'Les sachets s’arrachent en vingt minutes ; les enfants nourrissent les canards émerveillés.',
      },
      {
        text: 'Mobiliser les enfants pour guider pacifiquement le troupeau vers le parc (Ostrom)',
        cost: { fatigue: 10, timeMinutes: 45 },
        consequences: {
          confianceQuartierDelta: 5,
          reputationDelta: 4,
          causes: [{ facteur: 'gestion douce et collective des communs vivants', poids: 3 }],
        },
        ghostQuotes: {
          ostrom: 'Remarquable ! L’action concertée sans violence résout le conflit d’usage de la place.',
        },
        dialogueResponse: 'Noah et les copains forment une haie d’honneur amusée ; les canards rejoignent le bassin.',
      },
      {
        text: 'Dresser un périmètre rigide avec des cageots et chronométrer l’évacuation (Taylor)',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: -2,
          causes: [{ facteur: 'bureaucratie autoritaire inadaptée à la faune', poids: 1 }],
        },
        ghostQuotes: {
          taylor: 'Huit minutes et douze secondes pour canaliser le flux aviaire ! Méthode impeccable !',
        },
        dialogueResponse: 'Deux canards s’envolent au-dessus des cageots en renversant une caisse de poireaux.',
      },
    ],
  },
  {
    id: 'EVT_PIGEON_KLEPTOMANE',
    category: 'canal_faune',
    title: 'Le Pigeon Pickpocket de Bonbons',
    prompt:
      'Un pigeon borgne et effronté s’est infiltré dans l’épicerie Bertin et détrousse méthodiquement le bocal de bonbons à la violette.',
    condition: (w) => w.time.tick >= 144 * 2,
    triggerCondition: (w) => w.time.tick >= 144 * 2,
    once: true,
    choices: [
      {
        text: 'Ruser avec un piège en carton doux et miettes de pain',
        cost: { timeMinutes: 20 },
        consequences: {
          reputationDelta: 5,
          confianceQuartierDelta: 3,
          causes: [{ facteur: 'ingéniosité bienveillante envers les animaux', poids: 2 }],
        },
        dialogueResponse: 'Le pigeon est capturé sans une plume froissée puis relâché sur le toit du collège.',
      },
      {
        text: 'Racheter le bocal de bonbons pour dédommager Mme Bertin',
        cost: { money: 3, timeMinutes: 5 },
        consequences: {
          moneyDelta: -3,
          vitaliteEpicerieDelta: 4,
          reputationDelta: 6,
          causes: [{ facteur: 'solidarité financière avec le commerce assiégé', poids: 3 }],
        },
        dialogueResponse: 'Mme Bertin t’offre une accolade émue et un paquet de caramels faits maison.',
      },
      {
        text: 'Faire du pigeon la mascotte officielle du Stand des Roses',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 4,
          causes: [{ facteur: 'humour de rue et esprit de dérision populaire', poids: 1 }],
        },
        dialogueResponse: 'Noah dessine un logo hilarant avec le pigeon borgne tenant un biscuit dans son bec.',
      },
    ],
  },
  {
    id: 'EVT_BRUME_PHILOSOPHIQUE',
    category: 'canal_faune',
    title: 'La Brume Fluviale des Pêcheurs',
    prompt:
      'Une brume d’or et d’argent s’élève du canal au petit matin. Les pêcheurs posent leurs cannes et débattent du sens du temps et du travail.',
    condition: (w) => w.district.meteo !== 'pluie',
    triggerCondition: (w) => w.district.meteo !== 'pluie',
    choices: [
      {
        text: 'S’asseoir et écouter leurs théories sur l’utilité et la rareté',
        cost: { timeMinutes: 40 },
        consequences: {
          confianceQuartierDelta: 4,
          reputationDelta: 3,
          causes: [{ facteur: 'écoute intergénérationnelle et transmission des savoirs', poids: 2 }],
        },
        dialogueResponse: 'Barnabé t’explique pourquoi un poisson qu’on ne vend pas a plus de valeur qu’une action boursière.',
      },
      {
        text: 'Leur servir du thé fumant de chez Mme Bertin',
        cost: { money: 2, timeMinutes: 20 },
        consequences: {
          moneyDelta: -2,
          vitaliteEpicerieDelta: 3,
          confianceQuartierDelta: 6,
          causes: [{ facteur: 'chaleur humaine et convivialité portuaire', poids: 3 }],
        },
        dialogueResponse: 'Les visages burinés des bateliers s’illuminent sous les vapeurs de thé ambré.',
      },
      {
        text: 'Tenter de leur vendre des hameçons de récupération façonnés à la friche',
        cost: { timeMinutes: 20 },
        consequences: {
          moneyDelta: 5,
          causes: [{ facteur: 'opportunisme artisanal de proximité', poids: 2 }],
        },
        dialogueResponse: 'Deux pêcheurs t’achètent tes plombs avec admiration pour le travail manuel.',
      },
    ],
  },
  {
    id: 'EVT_RELIQUE_SOVIETIQUE',
    category: 'canal_faune',
    title: 'La Pêche à l’Aimant Miraculeuse',
    prompt:
      'Samir et Karim repêchent avec un électroaimant artisanal un carter d’embrayage de tracteur industriel des années 1960 au fond du bief.',
    condition: (w) => (w.flags['friche_visitee'] ?? 0) >= 1,
    triggerCondition: (w) => (w.flags['friche_visitee'] ?? 0) >= 1,
    choices: [
      {
        text: 'L’exposer à la friche comme totem d’art ouvrier populaire',
        cost: { timeMinutes: 30, fatigue: 10 },
        consequences: {
          confianceQuartierDelta: 5,
          reputationDelta: 4,
          causes: [{ facteur: 'mémoire industrielle et fierté collective', poids: 3 }],
        },
        ghostQuotes: {
          marx: 'L’acier forgé par les mains ouvrières refait surface contre l’oubli bourgeois ! Magnifique !',
        },
        dialogueResponse: 'Le carter brossé trône désormais à l’entrée des ateliers comme un symbole de résistance.',
      },
      {
        text: 'L’usiner au fablab pour en faire des roulements de triporteur',
        cost: { timeMinutes: 45, fatigue: 15 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'surcyclage technique pour la logistique douce', poids: 2 }],
        },
        dialogueResponse: 'Karim ajuste les portées au tour avec un sourire jusqu’aux oreilles : du solide indestructible.',
      },
      {
        text: 'Le nettoyer et le vendre à un brocanteur vintage pour la trésorerie',
        cost: { timeMinutes: 30 },
        consequences: {
          moneyDelta: 15,
          reputationDelta: -2,
          causes: [{ facteur: 'monétisation rapide d’un vestige collectif', poids: 1 }],
        },
        dialogueResponse: 'Le brocanteur donne quinze euros rubis sur l’ongle, mais Karim jette un regard déçu.',
      },
    ],
  },
  {
    id: 'EVT_CHAT_SYNDICALISTE',
    category: 'canal_faune',
    title: 'Le Chat Perché sur la Cloche du Collège',
    prompt:
      'Moustache, le gros chat tigré de l’école, dort profondément enroulé autour du battant de la cloche, empêchant la sonnerie de 8h.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Déclarer une grève féline légitime et improviser un débat dans la cour',
        cost: { timeMinutes: 20 },
        consequences: {
          confianceQuartierDelta: 4,
          reputationDelta: 3,
          causes: [{ facteur: 'expression démocratique spontanée des élèves', poids: 2 }],
        },
        dialogueResponse: 'Les collégiens applaudissent et discutent joyeusement du temps scolaire.',
      },
      {
        text: 'Escalader prudemment avec une sardine de l’épicerie pour le déloger en douceur',
        cost: { money: 1, timeMinutes: 10 },
        consequences: {
          moneyDelta: -1,
          reputationDelta: 4,
          vitaliteEpicerieDelta: 2,
          causes: [{ facteur: 'sauvetage diplomatique par la friandise', poids: 2 }],
        },
        dialogueResponse: 'Moustache descend en ronronnant pour engloutir la sardine ; la cloche retentit enfin.',
      },
      {
        text: 'Utiliser un sifflet d’usine pour respecter le planning à la seconde (Taylor)',
        cost: { timeMinutes: 5 },
        consequences: {
          reputationDelta: -3,
          causes: [{ facteur: 'discipline brutale perturbant la sérénité animale', poids: 1 }],
        },
        dialogueResponse: 'Le chat sursaute et griffe le rebord ; les élèves protestent contre le tintamarre.',
      },
    ],
  },

  // ==========================================================================
  // CATÉGORIE B : PANNES, GLITCHES URBAINS & RUMEURS LOCALES (6 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_PANNE_GEANTE_BANQUET',
    category: 'glitch_urbain',
    title: 'La Panne d’Électricité & le Banquet aux Chandelles',
    prompt:
      'Le transformateur vétuste du quartier lâche à 19h. Toutes les lumières s’éteignent d’un coup sous un ciel étoilé.',
    condition: (w) => w.time.tick >= 144 * 3,
    triggerCondition: (w) => w.time.tick >= 144 * 3,
    choices: [
      {
        text: 'Organiser un grand buffet partagé sur la place avec les invendus',
        cost: { timeMinutes: 60 },
        consequences: {
          vitaliteEpicerieDelta: 8,
          confianceQuartierDelta: 15,
          reputationDelta: 10,
          causes: [{ facteur: 'solidarité festive face à la défaillance des réseaux', poids: 3 }],
        },
        dialogueResponse: 'Des dizaines de bougies éclairent les tablées improvisées ; personne ne veut rentrer se coucher.',
      },
      {
        text: 'Sortir accordéons et guitares pour une veillée musicale acoustique',
        cost: { timeMinutes: 45 },
        consequences: {
          confianceQuartierDelta: 10,
          reputationDelta: 6,
          causes: [{ facteur: 'résilience culturelle et joie partagée', poids: 2 }],
        },
        dialogueResponse: 'Les chants d’autrefois résonnent contre les façades de brique dans une ambiance féerique.',
      },
      {
        text: 'Hobbes conseille d’organiser des rondes citoyennes avec lampes torches',
        cost: { timeMinutes: 45, fatigue: 15 },
        consequences: {
          reputationDelta: 2,
          causes: [{ facteur: 'maintien de l’ordre préventif contre les larcins', poids: 1 }],
        },
        dialogueResponse: 'La ronde est calme ; le seul rôdeur croisé était un hérisson explorant un carton de navets.',
      },
    ],
  },
  {
    id: 'EVT_TRESOR_CANALISATIONS',
    category: 'glitch_urbain',
    title: 'La Rumeur Folle du Trésor des Roses',
    prompt:
      'Noah brandit un plan manuscrit jauni de 1954 indiquant une cassette de pièces d’or sous la chaufferie de la Cité.',
    condition: (w) => w.npcs['noah'] !== undefined,
    triggerCondition: (w) => w.npcs['noah'] !== undefined,
    choices: [
      {
        text: 'Partir en expédition spéléo dans les caves voûtées avec Noah',
        cost: { timeMinutes: 60, fatigue: 20 },
        consequences: {
          confianceQuartierDelta: 4,
          reputationDelta: 5,
          causes: [{ facteur: 'aventure juvénile et complicité d’équipe', poids: 2 }],
        },
        dialogueResponse: 'Pas de lingots, mais six bocaux de cerises à l’eau-de-vie scellés à la cire depuis 1978 !',
      },
      {
        text: 'Analyser rationnellement le plan avec Lina pour en vérifier l’origine',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'esprit critique et rigueur d’analyse archivistique', poids: 2 }],
        },
        dialogueResponse: 'Le plan était un vieux schéma de drainage d’eaux de pluie ! Noah rigole de sa bévue.',
      },
      {
        text: 'Vendre des kits de chercheurs de trésor aux collégiens crédules',
        cost: { timeMinutes: 20 },
        consequences: {
          moneyDelta: 8,
          reputationDelta: -4,
          causes: [{ facteur: 'mercantilisme sur les rêves des plus jeunes', poids: 1 }],
        },
        dialogueResponse: 'Huit euros en poche, mais Mme Moreau te lance un regard désapprobateur lors de la récré.',
      },
    ],
  },
  {
    id: 'EVT_FONTAINE_MOUSSE',
    category: 'glitch_urbain',
    title: 'La Fontaine aux Mille Bulles',
    prompt:
      'Un plaisantin anonyme a vidé deux bidons de savon noir bio dans la fontaine de la place. Des vagues de mousse envahissent le parvis.',
    condition: (w) => w.district.meteo === 'soleil',
    triggerCondition: (w) => w.district.meteo === 'soleil',
    choices: [
      {
        text: 'Lancer une gigantesque bataille de bulles de mousse avec les passants',
        cost: { timeMinutes: 30, fatigue: 10 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'fantaisie spontanée désamorçant le stress urbain', poids: 2 }],
        },
        dialogueResponse: 'Même Mme Bertin sourit en recevant un chapeau de mousse sur son tablier rayé.',
      },
      {
        text: 'Aider les agents municipaux à couper la pompe et rincer le bassin',
        cost: { timeMinutes: 40, fatigue: 15 },
        consequences: {
          confianceQuartierDelta: 5,
          reputationDelta: 6,
          causes: [{ facteur: 'civisme pratique et entraide avec les services publics', poids: 3 }],
        },
        dialogueResponse: 'L’eau redevient claire ; les cantonniers t’offrent une limonade fraîche.',
      },
      {
        text: 'Proposer un service éphémère de lavage écologique de vélos et triporteurs',
        cost: { timeMinutes: 30 },
        consequences: {
          moneyDelta: 6,
          reputationDelta: 3,
          causes: [{ facteur: 'conversion d’un désordre en utilité marchande', poids: 2 }],
        },
        dialogueResponse: 'Cinq vélos étincelants et six euros de pourboire récoltés pour la caisse.',
      },
    ],
  },
  {
    id: 'EVT_HORLOGE_13H',
    category: 'glitch_urbain',
    title: 'L’Heure Treize de Val-Ferrand',
    prompt:
      'Le mécanisme centenaire de l’horloge municipale saute un cran et sonne treize coups à midi pile sous un ciel radieux.',
    condition: (w) => w.time.tick % 144 >= 60,
    triggerCondition: (w) => w.time.tick % 144 >= 60,
    choices: [
      {
        text: 'Expliquer doctement la défaillance de la roue d’échappement avec Karim',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 4,
          causes: [{ facteur: 'pédagogie mécanique et respect du patrimoine horloger', poids: 2 }],
        },
        dialogueResponse: 'Les anciens écoutent la leçon avec respect ; Karim règle le balancier au millimètre.',
      },
      {
        text: 'Proclamer que la 13e heure est l’heure gratuite où la rentabilité s’arrête',
        cost: { timeMinutes: 15 },
        consequences: {
          confianceQuartierDelta: 8,
          reputationDelta: 5,
          causes: [{ facteur: 'poésie politique ouvrant un temps hors du calcul', poids: 3 }],
        },
        dialogueResponse: 'Marx applaudit à tout rompre ; les passants s’assoient pour savourer ce temps volé au capital.',
      },
      {
        text: 'Ignorer la cloche et croquer paisiblement dans son sablé au beurre',
        cost: { timeMinutes: 10 },
        consequences: {
          reputationDelta: 1,
          causes: [{ facteur: 'tranquillité d’esprit devant les bizarreries du monde', poids: 1 }],
        },
        dialogueResponse: 'Le beurre est frais, le sablé croustillant : treize coups ou douze, le goût reste parfait.',
      },
    ],
  },
  {
    id: 'EVT_HAMMAM_DE_RUE',
    category: 'glitch_urbain',
    title: 'Le Geyser d’Eau Chaude Urbain',
    prompt:
      'Une canalisation du réseau de chauffage urbain fuit sur le trottoir des Hauts, créant une épaisse colonne de vapeur bienfaisante.',
    condition: (w) => w.district.meteo !== 'soleil',
    triggerCondition: (w) => w.district.meteo !== 'soleil',
    choices: [
      {
        text: 'Poser des palettes en bois autour et improviser une cure thermale de rue',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 4,
          causes: [{ facteur: 'détournement réconfortant du mobilier urbain', poids: 2 }],
        },
        dialogueResponse: 'Trois voisins viennent respirer la vapeur chaude en papotant enroulés dans leurs plaids.',
      },
      {
        text: 'Baliser le trottoir avec du ruban rouge et blanc pour éviter tout risque de brûlure',
        cost: { timeMinutes: 20 },
        consequences: {
          reputationDelta: 5,
          causes: [{ facteur: 'sécurité préventive et sens des responsabilités', poids: 2 }],
        },
        dialogueResponse: 'Gaspard te salue militairement de sa fenêtre : la sécurité des résidents est sauve.',
      },
      {
        text: 'Faire infuser des branches d’eucalyptus de Bertin dans la vapeur',
        cost: { money: 1, timeMinutes: 20 },
        consequences: {
          moneyDelta: -1,
          vitaliteEpicerieDelta: 3,
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'aromathérapie collective de quartier', poids: 2 }],
        },
        dialogueResponse: 'Toute la rue sent bon la forêt d’altitude ; les nez bouchés du quartier sont débouchés.',
      },
    ],
  },
  {
    id: 'EVT_LAMPADAIRE_MORSE',
    category: 'glitch_urbain',
    title: 'Le Lampadaire Mélancolique',
    prompt:
      'Un réverbère devant la friche clignote à un rythme saccadé. Noah jure qu’il transmet un code morse des anciens forgerons.',
    condition: (w) => w.flags['friche_active'] !== undefined || w.time.tick >= 0,
    triggerCondition: (w) => w.flags['friche_active'] !== undefined || w.time.tick >= 0,
    choices: [
      {
        text: 'Décoder patiemment le signal avec Noah et son carnet de notes',
        cost: { timeMinutes: 45 },
        consequences: {
          confianceQuartierDelta: 3,
          reputationDelta: 4,
          causes: [{ facteur: 'écoute des légendes urbaines et complicité enfantine', poids: 2 }],
        },
        dialogueResponse: 'Le message décodé dit : "V-E-R-I-F-I-E-Z L-E C-O-N-D-E-N-S-A-T-E-U-R". Éclat de rire complice.',
      },
      {
        text: 'Réparer le ballast et resserrer la cosse électrique avec Karim',
        cost: { timeMinutes: 30, fatigue: 10 },
        consequences: {
          reputationDelta: 5,
          causes: [{ facteur: 'réparation technique utile à la collectivité nocturne', poids: 2 }],
        },
        dialogueResponse: 'La lumière se stabilise en un halo doré chaleureux éclairant le trottoir pour les rentrants tardifs.',
      },
      {
        text: 'Raconter aux petits de la rue que le réverbère dialogue avec la lune',
        cost: { timeMinutes: 15 },
        consequences: {
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'imaginaire poétique adoucissant la nuit', poids: 1 }],
        },
        dialogueResponse: 'Les yeux des enfants brillent ; ils murmurent de doux vœux vers l’ampoule jaune.',
      },
    ],
  },

  // ==========================================================================
  // CATÉGORIE C : GUERRE COMMERCIALE & TURBULENCES DU DRIVE (5 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_DRONES_LANCE_PIERRES',
    category: 'guerre_commerciale',
    title: 'L’Interception des Drones du Drive',
    prompt:
      'Le Drive HyperVal teste des drones livreurs vrombissants au-dessus des cours. Les enfants des Roses ripostent au lance-pierres avec des marrons.',
    condition: (w) => Boolean(w.rivals.drive_hyper?.marketObservation.lastClosed)
      && (w.rivals.drive_hyper?.marketShare ?? 0) >= 30,
    triggerCondition: (w) => Boolean(w.rivals.drive_hyper?.marketObservation.lastClosed)
      && (w.rivals.drive_hyper?.marketShare ?? 0) >= 30,
    choices: [
      {
        text: 'Calmer les enfants et récupérer le drone crashé intact pour pièces',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 6,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'récupération technologique et désescalade pacifique', poids: 2 }],
        },
        dialogueResponse: 'Les moteurs brushless et la caméra sont confiés au fablab pour monter un robot d’arrosage.',
      },
      {
        text: 'Distribuer les paquets de chips tombés du ciel aux anciens du banc',
        cost: { timeMinutes: 20 },
        consequences: {
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'butin redistributeur spontané', poids: 2 }],
        },
        dialogueResponse: 'Monique croque une chips au paprika en riant : "Le ciel nous nourrit comme aux temps bibliques !"',
      },
      {
        text: 'Rédiger une pétition citoyenne contre le survol des habitations',
        cost: { timeMinutes: 45 },
        consequences: {
          reputationDelta: 8,
          confianceQuartierDelta: 8,
          causes: [{ facteur: 'mobilisation juridique et politique locale', poids: 3 }],
        },
        dialogueResponse: 'Cent quarante signatures en deux heures : la mairie somme le Drive d’interrompre ses vols d’essai.',
      },
    ],
  },
  {
    id: 'EVT_COUPONS_PIRATES',
    category: 'guerre_commerciale',
    title: 'Les Bons de Réduction Impossibles',
    prompt:
      'De faux tracts promettent un pot de confiture Bertin gratuit pour tout achat de 100€ au Drive. L’épicerie est assaillie de demandes furieuses.',
    condition: (w) => w.district.vitaliteEpicerie <= 60,
    triggerCondition: (w) => w.district.vitaliteEpicerie <= 60,
    choices: [
      {
        text: 'Enquêter pour démonter l’arnaque et afficher un démenti plein d’esprit en vitrine',
        cost: { timeMinutes: 30 },
        consequences: {
          vitaliteEpicerieDelta: 6,
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'défense loyale de l’épicerie contre la désinformation', poids: 3 }],
        },
        dialogueResponse: 'L’affiche humoristique fait rire la rue ; les voisins viennent par sympathie acheter leurs légumes chez Bertin.',
      },
      {
        text: 'Offrir une dégustation gratuite aux clients déçus pour leur faire goûter la différence',
        cost: { money: 2, timeMinutes: 40 },
        consequences: {
          moneyDelta: -2,
          vitaliteEpicerieDelta: 8,
          reputationDelta: 6,
          causes: [{ facteur: 'triomphe de la qualité artisanale sur la fausse promesse', poids: 3 }],
        },
        dialogueResponse: 'Trois habitués du Drive avouent que la confiture de Bertin est dix fois meilleure et changent de camp.',
      },
      {
        text: 'Aller placarder des prospectus parodiques sur les caddies du Drive',
        cost: { timeMinutes: 45, fatigue: 15 },
        consequences: {
          reputationDelta: -3,
          causes: [{ facteur: 'guérilla militante à la limite de la provocation', poids: 1 }],
        },
        dialogueResponse: 'Poursuivi par le vigile, Noah perd sa casquette mais le Drive doit nettoyer cent chariots.',
      },
    ],
  },
  {
    id: 'EVT_CLIENT_MYSTERE_ROBOT',
    category: 'guerre_commerciale',
    title: 'L’Inspecteur en Plastique',
    prompt:
      'Un inconnu en costume beige photographie les étals du stand et les prix de Bertin avec un smartphone fixé sur une perche.',
    condition: (w) => (w.player.money ?? 0) >= 15,
    triggerCondition: (w) => (w.player.money ?? 0) >= 15,
    choices: [
      {
        text: 'L’inviter poliment à boire une tisane et lui présenter notre livre de comptes ouvert',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 7,
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'désarmement par la transparence radicale', poids: 3 }],
        },
        dialogueResponse: 'L’espion est troublé par tant de franchise ; il finit par révéler la marge exorbitante du Drive sur les sodas.',
      },
      {
        text: 'Taylor conseille de lui donner des grilles d’horaires fictives pour brouiller leurs modèles',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'contre-espionnage algorithmique facétieux', poids: 2 }],
        },
        dialogueResponse: 'L’algorithme du Drive envoie un camion de livraison à 4 heures du matin un dimanche devant une place vide.',
      },
      {
        text: 'Le chasser avec fermeté et courtoisie hors de la place marchande',
        cost: { timeMinutes: 10 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'défense du sanctuaire marchand de quartier', poids: 1 }],
        },
        dialogueResponse: 'L’inconnu replie sa perche en maugréant et s’engouffre dans sa berline de location.',
      },
    ],
  },
  {
    id: 'EVT_CAMION_BLOQUE',
    category: 'guerre_commerciale',
    title: 'L’Échouage du Semi-Remorque',
    prompt:
      'Un énorme camion articulé du Drive s’encastre dans l’étroite venelle médiévale des Roses, bloquant totalement la rue.',
    condition: (w) => w.district.vitaliteEpicerie >= 20,
    triggerCondition: (w) => w.district.vitaliteEpicerie >= 20,
    choices: [
      {
        text: 'Guider le chauffeur au millimètre avec Samir et Karim pour le dégager sans accroc',
        cost: { timeMinutes: 40, fatigue: 10 },
        consequences: {
          reputationDelta: 7,
          confianceQuartierDelta: 6,
          causes: [{ facteur: 'solidarité ouvrière et sang-froid technique', poids: 3 }],
        },
        dialogueResponse: 'Le chauffeur transpirant verse une larme de soulagement et remercie chaleureusement les artisans.',
      },
      {
        text: 'Proposer de transborder les colis urgents sur nos triporteurs pour libérer la rue',
        cost: { timeMinutes: 50, fatigue: 15 },
        consequences: {
          confianceQuartierDelta: 10,
          reputationDelta: 8,
          causes: [{ facteur: 'démonstration magistrale de la logistique douce', poids: 3 }],
        },
        dialogueResponse: 'Tout le quartier constate que trois vélos-cargos font le travail d’un monstre diesel sans paralyser la ville.',
      },
      {
        text: 'Installer des chaises sur le trottoir pour regarder la manœuvre en mangeant des biscuits',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 1,
          causes: [{ facteur: 'spectacle de rue gratuit et ironie quotidienne', poids: 1 }],
        },
        dialogueResponse: 'Les riverains rigolent ; le camion met trois heures et quatorze marches arrière pour sortir.',
      },
    ],
  },
  {
    id: 'EVT_SODA_FLUO',
    category: 'guerre_commerciale',
    title: 'L’Offensive des Canettes Chimiques Gratuites',
    prompt:
      'Une camionnette publicitaire distribue des canettes d’une boisson bleue fluo à la sortie du collège, ruinant les ventes du stand.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Organiser un duel d’aveugles : Tisane glacée de Bertin contre Soda fluorescent',
        cost: { timeMinutes: 45, money: 2 },
        consequences: {
          moneyDelta: -2,
          vitaliteEpicerieDelta: 8,
          reputationDelta: 8,
          confianceQuartierDelta: 6,
          causes: [{ facteur: 'victoire éclatante du goût naturel sur le marketing chimique', poids: 3 }],
        },
        dialogueResponse: 'Quarante-deux élèves sur cinquante votent pour l’infusion menthe-cassis fraîche de Monique Bertin !',
      },
      {
        text: 'Brader temporairement les biscuits à prix coûtant pour conserver la clientèle',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'résistance tarifaire défensive', poids: 1 }],
        },
        dialogueResponse: 'Les collégiens prennent un sablé et une canette ; les ventes se maintiennent mais la marge est nulle.',
      },
      {
        text: 'Laisser le crash glycémique de 17h faire son œuvre chez les élèves',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 2,
          causes: [{ facteur: 'leçon biologique par l’expérience vécue', poids: 1 }],
        },
        ghostQuotes: {
          dejours: 'Regardez ces visages cernés : le sucre industriel est un anesthésiant de courte durée.',
        },
        dialogueResponse: 'À 17h15, les collégiens épuisés supplient pour un vrai goûter roboratif au stand.',
      },
    ],
  },

  // ==========================================================================
  // CATÉGORIE D : PASSIONS CITOYENNES, SECRETS & RIVALITÉS (5 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_TOURNOI_ECHECS_NAVETS',
    category: 'rivalites_locales',
    title: 'Le Tournoi d’Échecs sur Caisses Maraîchères',
    prompt:
      'Deux anciens de la Cité s’affrontent dans une partie d’échecs acharnée sur des caisses de navets retournées. Une foule de parieurs s’amasse.',
    condition: (w) => w.district.meteo === 'soleil',
    triggerCondition: (w) => w.district.meteo === 'soleil',
    choices: [
      {
        text: 'Participer au tournoi en appliquant la stratégie économique apprise des fantômes',
        cost: { timeMinutes: 45 },
        consequences: {
          moneyDelta: 5,
          reputationDelta: 7,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'brillance tactique et respect des aînés', poids: 3 }],
        },
        dialogueResponse: 'Un mat du cavalier magistral salué par les applaudissements des retraités !',
      },
      {
        text: 'Arbitrer le litige houleux sur une prise en passant contestée',
        cost: { timeMinutes: 20 },
        consequences: {
          reputationDelta: 5,
          causes: [{ facteur: 'sens de l’équité et diplomatie de cour de récré', poids: 2 }],
        },
        dialogueResponse: 'La règle historique est confirmée ; les deux vétérans se serrent la main en riant.',
      },
      {
        text: 'Vendre des parts de gâteau et des cafés aux spectateurs captivés',
        cost: { timeMinutes: 30 },
        consequences: {
          moneyDelta: 7,
          reputationDelta: 2,
          causes: [{ facteur: 'service de restauration d’événement local', poids: 2 }],
        },
        dialogueResponse: 'Sept euros dans la boîte du stand ; tout le monde a le ventre plein.',
      },
    ],
  },
  {
    id: 'EVT_TISANE_DE_VERITE',
    category: 'rivalites_locales',
    title: 'La Tisane Légendaire de Mme Bertin',
    prompt:
      'Mme Bertin a préparé une décoction aux herbes des berges. Quiconque en boit une gorgée exprime ses pensées secrètes sans filtre.',
    condition: (w) => w.district.vitaliteEpicerie >= 30,
    triggerCondition: (w) => w.district.vitaliteEpicerie >= 30,
    choices: [
      {
        text: 'En boire une tasse avec Noah pour vider les non-dits',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 5,
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'franchise libératrice consolidant l’amitié', poids: 3 }],
        },
        dialogueResponse: 'Tu lui dis que ses blagues sont parfois assommantes ; il t’avoue qu’il t’admire infiniment.',
      },
      {
        text: 'En offrir une tasse au commercial du Drive venu inspecter les étals',
        cost: { timeMinutes: 20 },
        consequences: {
          confianceQuartierDelta: 8,
          reputationDelta: 6,
          causes: [{ facteur: 'révélation involontaire des faiblesses adverses', poids: 3 }],
        },
        dialogueResponse: 'Le commercial fond en larmes : "On perd 10 000 euros par mois sur cette zone, mon patron est fou !"',
      },
      {
        text: 'Noter précieusement la recette dans le carnet de l’atelier de conserverie',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 4,
          causes: [{ facteur: 'archivage d’un patrimoine immatériel précieux', poids: 2 }],
        },
        dialogueResponse: 'La formule est consignée sous le titre "Décoction de Franchise Absolue".',
      },
    ],
  },
  {
    id: 'EVT_DUEL_VIS_BOULONS',
    category: 'rivalites_locales',
    title: 'Le Grand Schisme Métrique de Samir et Karim',
    prompt:
      'Samir et Karim s’engueulent violemment devant l’établi : pas métrique français ISO contre filetage Whitworth anglais pour la bétonnière.',
    condition: (w) => w.flags['friche_visitee'] !== undefined || w.time.tick >= 0,
    triggerCondition: (w) => w.flags['friche_visitee'] !== undefined || w.time.tick >= 0,
    choices: [
      {
        text: 'Usiner une bague d’adaptation hybride au tour pour réconcilier les deux écoles',
        cost: { timeMinutes: 45, fatigue: 15 },
        consequences: {
          reputationDelta: 8,
          confianceQuartierDelta: 6,
          causes: [{ facteur: 'synthèse technique géniale dépassant la querelle', poids: 3 }],
        },
        dialogueResponse: 'La pièce s’emboîte impeccablement ; les deux compères s’enlacent en rigolant aux larmes.',
      },
      {
        text: 'Leur apporter deux cafés chauds et les écouter débattre pendant deux heures',
        cost: { timeMinutes: 60, money: 1 },
        consequences: {
          moneyDelta: -1,
          confianceQuartierDelta: 5,
          reputationDelta: 4,
          causes: [{ facteur: 'patience fraternelle laissant la dispute s’éteindre d’elle-même', poids: 2 }],
        },
        dialogueResponse: 'Épuisés par leurs propres arguments, ils finissent par monter un boulon standard en souriant.',
      },
      {
        text: 'Proposer un vote démocratique à main levée des apprentis (Ostrom)',
        cost: { timeMinutes: 20 },
        consequences: {
          confianceQuartierDelta: 4,
          reputationDelta: 3,
          causes: [{ facteur: 'démocratie d’atelier appliquée aux détails matériels', poids: 2 }],
        },
        dialogueResponse: 'Le pas métrique l’emporte à 6 voix contre 3 ; Karim s’incline dignement.',
      },
    ],
  },
  {
    id: 'EVT_FRESQUE_PREMONITOIRE',
    category: 'rivalites_locales',
    title: 'L’Artiste des Murs et l’Oracle Urbain',
    prompt:
      'Une fresque apparue cette nuit sur le pignon de la friche semble peindre les événements de la semaine prochaine avec une exactitude troublante.',
    condition: (w) => w.time.tick >= 144 * 2,
    triggerCondition: (w) => w.time.tick >= 144 * 2,
    choices: [
      {
        text: 'Protéger la fresque avec un vernis végétal transparent contre les intempéries',
        cost: { timeMinutes: 40, money: 2 },
        consequences: {
          moneyDelta: -2,
          reputationDelta: 6,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'sauvegarde du patrimoine artistique populaire', poids: 2 }],
        },
        dialogueResponse: 'Les couleurs résistent à la bruine ; Louison te salue d’un hochement de tête silencieux depuis l’ombre.',
      },
      {
        text: 'Décrypter les symboles muraux pour anticiper la demande commerciale du week-end',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 4,
          causes: [{ facteur: 'intelligence stratégique basée sur la sensibilité artistique', poids: 2 }],
        },
        dialogueResponse: 'La fresque montre des grappes de raisin : le stock de jus de fruits se vendra en quelques heures !',
      },
      {
        text: 'Inviter Louison à dessiner l’identité visuelle de la radio pirate locale',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'mise en commun des talents créatifs locaux', poids: 3 }],
        },
        dialogueResponse: 'Le logo Radio Val-Libre devient un chef-d’œuvre d’art mural reproduit sur tous les sacs de toile.',
      },
    ],
  },
  {
    id: 'EVT_COURGE_DES_HAUTS',
    category: 'rivalites_locales',
    title: 'La Compétition de la Courge Géante',
    prompt:
      'Le concours du légume le plus lourd oppose les balcons des Hauts. Une courge de 48 kg menace d’arracher le garde-corps du 4e étage.',
    condition: (w) => w.district.meteo !== 'pluie',
    triggerCondition: (w) => w.district.meteo !== 'pluie',
    choices: [
      {
        text: 'Calculer la résistance des matériaux et poser un haubanage avec Karim',
        cost: { timeMinutes: 45, fatigue: 15 },
        consequences: {
          reputationDelta: 7,
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'ingénierie citoyenne sauvant la structure', poids: 3 }],
        },
        dialogueResponse: 'Le balcon est sécurisé par deux câbles d’acier ; la courge bat le record du département !',
      },
      {
        text: 'Proposer de cuisiner le monstre végétal en soupe populaire géante pour tout le quartier',
        cost: { timeMinutes: 60, fatigue: 15 },
        consequences: {
          confianceQuartierDelta: 12,
          reputationDelta: 8,
          causes: [{ facteur: 'partage du surcroît maraîcher en festin fraternel', poids: 3 }],
        },
        dialogueResponse: 'Quatre-vingts bols de velouté de courge fumant distribués aux habitants sous les lampions !',
      },
      {
        text: 'Parier 2€ sur la courge du voisin du 3e étage',
        cost: { money: 2, timeMinutes: 10 },
        consequences: {
          moneyDelta: 4,
          reputationDelta: 1,
          causes: [{ facteur: 'spéculation bon enfant sur le concours de légumes', poids: 1 }],
        },
        dialogueResponse: 'La courge du 3e gagne d’une livre ; tu empoches quatre euros sous les rires.',
      },
    ],
  },

  // ==========================================================================
  // CATÉGORIE E : JOUTES DU QUOTIDIEN (5 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_TAYLOR_PAUSE_CAFE',
    category: 'joutes_fantomes',
    title: 'Taylor Chronomètre la Pause Café de Bertin',
    prompt:
      'Le spectre de Frederick Taylor s’agite furieusement dans l’épicerie, prétendant que 12 minutes pour un café sont un scandale productif.',
    condition: (w) => w.district.vitaliteEpicerie >= 25,
    triggerCondition: (w) => w.district.vitaliteEpicerie >= 25,
    choices: [
      {
        text: 'Lui expliquer que la lenteur de Bertin est le ciment social de la communauté',
        cost: { timeMinutes: 20 },
        consequences: {
          vitaliteEpicerieDelta: 4,
          confianceQuartierDelta: 5,
          reputationDelta: 4,
          causes: [{ facteur: 'défense du lien humain contre la cadenciation forcenée', poids: 3 }],
        },
        ghostQuotes: {
          dejours: 'Parfaitement répondu ! Sans cette parole lente, le travail détruit ceux qui l’accomplissent.',
          taylor: 'Hérésie sentimentale… Le progrès finira par balayer ces bavardages improductifs !',
        },
        dialogueResponse: 'Mme Bertin sourit et te sert une tasse bien chaude sans se presser.',
      },
      {
        text: 'Réorganiser les étagères pour qu’elle n’ait plus à se baisser pour le sucre (compromis)',
        cost: { timeMinutes: 30, fatigue: 10 },
        consequences: {
          vitaliteEpicerieDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'ergonomie bienveillante au service de la santé ouvrière', poids: 2 }],
        },
        ghostQuotes: {
          taylor: 'Voilà au moins un gain gestuel appréciable ! Moins de fatigue vertébrale !',
        },
        dialogueResponse: 'Mme Bertin a moins mal au dos en fin de journée et te remercie d’une boîte de biscuits.',
      },
      {
        text: 'Chronométrer Taylor pendant qu’il débite ses reproches pour pointer sa perte de temps',
        cost: { timeMinutes: 10 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'ironie socratique retournant l’outil contre son maître', poids: 2 }],
        },
        ghostQuotes: {
          marx: 'Hahaha ! L’arroseur arrosé par sa propre montre à gousset ! Bravo petit !',
        },
        dialogueResponse: 'Taylor reste muet de stupéfaction et range son chronomètre avec humeur.',
      },
    ],
  },
  {
    id: 'EVT_MARX_PAIN_CHOCOLAT',
    category: 'joutes_fantomes',
    title: 'Marx s’Indigne du Prix de la Viennoiserie',
    prompt:
      'Karl Marx fulmine devant le tableau de la boulangerie : 1,40€ la viennoiserie, alors que le paysan ne perçoit que des miettes sur le blé.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Décomposer publiquement la chaîne de valeur devant les collégiens ébahis',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 6,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'éducation populaire à la formation des prix et à la plus-value', poids: 3 }],
        },
        ghostQuotes: {
          marx: 'Voilà ! Rendre visible le travail vivant enfermé dans la marchandise ! C’est cela, penser !',
        },
        dialogueResponse: 'Les élèves comprennent enfin pourquoi le pain artisanal soutient le meunier local.',
      },
      {
        text: 'Soutenir la boulangerie artisanale contre les surgelés industriels du Drive',
        cost: { money: 1, timeMinutes: 10 },
        consequences: {
          moneyDelta: -1,
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'solidarité active avec les métiers d’artisanat de bouche', poids: 2 }],
        },
        dialogueResponse: 'Le boulanger t’offre deux croissants chauds : la fidélité de quartier se nourrit d’égards.',
      },
      {
        text: 'Lancer un atelier de fabrication collective de brioches à la friche',
        cost: { timeMinutes: 60, fatigue: 15 },
        consequences: {
          confianceQuartierDelta: 8,
          reputationDelta: 7,
          causes: [{ facteur: 'autonomie alimentaire festive et réappropriation des savoir-faire', poids: 3 }],
        },
        dialogueResponse: 'Une fournée dorée de vingt brioches partagée au goûter dans la joie générale.',
      },
    ],
  },
  {
    id: 'EVT_OSTROM_MULTIPRISE',
    category: 'joutes_fantomes',
    title: 'La Tragédie de la Multiprise du Marché',
    prompt:
      'Tous les camelots veulent brancher leurs machines sur l’unique prise étanche de la place. Le disjoncteur saute toutes les dix minutes.',
    condition: (w) => w.district.vitaliteEpicerie >= 20,
    triggerCondition: (w) => w.district.vitaliteEpicerie >= 20,
    choices: [
      {
        text: 'Établir une charte d’usage avec créneaux horaires tournants et auto-surveillance (Ostrom)',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 10,
          reputationDelta: 8,
          causes: [{ facteur: 'application rigoureuse des principes de gestion des communs', poids: 3 }],
        },
        ghostQuotes: {
          ostrom: 'Huitième principe appliqué : la règle est comprise, acceptée et surveillée par les pairs !',
        },
        dialogueResponse: 'Plus une seule coupure d’électricité de la journée ; les commerçants s’auto-régulent avec le sourire.',
      },
      {
        text: 'Smith propose de mettre les heures de branchement aux enchères au plus offrant',
        cost: { timeMinutes: 20 },
        consequences: {
          moneyDelta: 8,
          confianceQuartierDelta: -4,
          reputationDelta: -2,
          causes: [{ facteur: 'marchandisation d’une ressource vitale excluant les petits étals', poids: 1 }],
        },
        dialogueResponse: 'La rôtisserie monopolise la prise ; les petits producteurs de salades sont furieux.',
      },
      {
        text: 'Tirer une deuxième ligne électrique sécurisée depuis l’atelier avec Samir',
        cost: { money: 5, timeMinutes: 45, fatigue: 10 },
        consequences: {
          moneyDelta: -5,
          confianceQuartierDelta: 8,
          reputationDelta: 6,
          causes: [{ facteur: 'investissement matériel solidaire augmentant la capacité commune', poids: 2 }],
        },
        dialogueResponse: 'Le câble protégé sous gaine double la puissance disponible pour tous les forains.',
      },
    ],
  },
  {
    id: 'EVT_SMITH_BOUSCULADE_BUS',
    category: 'joutes_fantomes',
    title: 'La Main Invisible du Bus Scolaire',
    prompt:
      'À 17h05, les élèves se ruent en masse sur la porte unique du bus scolaire dans un désordre complet où personne n’avance.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Laisser faire pour tester l’hypothèse de la main invisible d’Adam Smith',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: -2,
          causes: [{ facteur: 'croyance naïve dans l’autorégulation sans cadre moral', poids: 1 }],
        },
        ghostQuotes: {
          smith: 'Hum… Mes excuses mon ami. Il manquait des institutions morales préalables et de la sympathie.',
        },
        dialogueResponse: 'Trois cartables piétinés et le bus part avec dix minutes de retard.',
      },
      {
        text: 'Organiser une file alternée par classe avec Solange et Mme Moreau',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 5,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'organisation civique pacifique fluidifiant le flux', poids: 2 }],
        },
        dialogueResponse: 'Le bus est chargé en trois minutes chrono dans le calme et la bonne humeur.',
      },
      {
        text: 'Former un groupe de marcheurs pour rentrer à pied en bande jusqu’au quartier',
        cost: { timeMinutes: 25, fatigue: 5 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 4,
          causes: [{ facteur: 'mobilité douce collective renforçant les amitiés', poids: 2 }],
        },
        dialogueResponse: 'La balade au soleil couchant est tellement agréable que tout le monde oublie le bus.',
      },
    ],
  },
  {
    id: 'EVT_KEYNES_TROUS_PARC',
    category: 'joutes_fantomes',
    title: 'Keynes Veut Creuser des Trous dans le Parc',
    prompt:
      'Devant le désœuvrement de collégiens le mercredi après-midi, John Maynard Keynes suggère sérieusement de leur verser 5€ pour creuser des trous puis les reboucher.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Transformer l’idée de Keynes en chantier utile : creuser des noues pour le potager partagé',
        cost: { timeMinutes: 60, fatigue: 15 },
        consequences: {
          confianceQuartierDelta: 10,
          reputationDelta: 8,
          causes: [{ facteur: 'relance keynésienne orientée vers l’infrastructure écologique utile', poids: 3 }],
        },
        ghostQuotes: {
          keynes: 'Brillant compromis ! La demande est stimulée et le capital réel de la communauté est augmenté !',
          ostrom: 'Voilà une saine utilisation de l’énergie collective !',
        },
        dialogueResponse: 'Les tranchées irriguent désormais les framboisiers municipaux ; les ados sont fiers de leurs bras.',
      },
      {
        text: 'Expliquer doctement à Keynes que le travail humain n’est pas un simple agrégat macro-économique',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 4,
          causes: [{ facteur: 'critique philosophique du productivisme abstrait', poids: 2 }],
        },
        dialogueResponse: 'Keynes allume une cigarette imaginaire en souriant : "Vous avez du cran, jeune homme !"',
      },
      {
        text: 'Embaucher les ados pour distribuer la gazette d’investigation de Yasmine',
        cost: { money: 4, timeMinutes: 30 },
        consequences: {
          moneyDelta: -4,
          reputationDelta: 6,
          confianceQuartierDelta: 6,
          causes: [{ facteur: 'rémunération équitable pour la diffusion de l’information locale', poids: 2 }],
        },
        dialogueResponse: 'Deux cents gazettes distribuées dans les boîtes aux lettres ; l’esprit critique grandit.',
      },
    ],
  },

  // ==========================================================================
  // CATÉGORIE F : ÉCONOMIE ÉMERGENTE & DÉBROUILLE POPULAIRE (6 ÉVÉNEMENTS)
  // ==========================================================================
  {
    id: 'EVT_BOULON_ROSE',
    category: 'economie_emergente',
    title: 'La Monnaie Clandestine du Quartier',
    prompt:
      'Face à la pénurie chronique de pièces de centimes, Samir et les commerçants utilisent de vrais écrous en laiton marqués d’un point rose pour 0,50€.',
    condition: (w) => w.time.tick >= 144 * 2,
    triggerCondition: (w) => w.time.tick >= 144 * 2,
    choices: [
      {
        text: 'Accepter officiellement les "Boulons-Roses" sur le Stand pour les goûters',
        cost: { timeMinutes: 15 },
        consequences: {
          confianceQuartierDelta: 8,
          reputationDelta: 6,
          causes: [{ facteur: 'soutien enthousiaste à une monnaie complémentaire d’entraide', poids: 3 }],
        },
        ghostQuotes: {
          hayek: 'La dénationalisation de la monnaie en pleine pratique ! L’échange choisit sa propre mesure !',
        },
        dialogueResponse: 'Les ventes explosent ; les élèves adorent faire tinter les boulons dans leurs poches.',
      },
      {
        text: 'Établir un registre de compensation affiché chez Bertin pour garantir la valeur',
        cost: { timeMinutes: 30 },
        consequences: {
          vitaliteEpicerieDelta: 4,
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'institutionnalisation prudente d’une devise de confiance', poids: 2 }],
        },
        dialogueResponse: 'La monnaie locale s’ancre sur des règles transparentes et stables.',
      },
      {
        text: 'Refuser les boulons par crainte d’une contrefaçon industrielle (Hobbes)',
        cost: { timeMinutes: 10 },
        consequences: {
          reputationDelta: -3,
          causes: [{ facteur: 'frilosité légaliste rejetant l’initiative populaire', poids: 1 }],
        },
        dialogueResponse: 'Les clients sont déçus et vont acheter leurs caramels ailleurs.',
      },
    ],
  },
  {
    id: 'EVT_TRIPORTEUR_VOILE',
    category: 'economie_emergente',
    title: 'Le Bolide Éolien de Noah',
    prompt:
      'Noah a fixé un vieux drap de lit et un mât de bambou sur le triporteur de livraison. Poussé par un coup de vent, il dévale la pente des Hauts sans freins.',
    condition: (w) => w.district.meteo !== 'pluie',
    triggerCondition: (w) => w.district.meteo !== 'pluie',
    choices: [
      {
        text: 'Intercepter héroïquement l’engin avec un rempart de cartons vides devant la friche',
        cost: { timeMinutes: 30, fatigue: 15 },
        consequences: {
          reputationDelta: 7,
          confianceQuartierDelta: 5,
          causes: [{ facteur: 'sang-froid et sauvetage spectaculaire d’un coéquipier', poids: 3 }],
        },
        dialogueResponse: 'Noah atterrit dans les cartons en hurlant de joie : "T’as vu cette vitesse de pointe ?!"',
      },
      {
        text: 'Crier à tous les passants de s’écarter en agitant les bras',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 2,
          causes: [{ facteur: 'évitement des dégâts humains au dernier instant', poids: 1 }],
        },
        dialogueResponse: 'Le bolide finit sa course dans un buisson de ronces sans blesser personne.',
      },
      {
        text: 'Monter de vrais freins à disque hydrauliques de récupération au fablab avec Karim',
        cost: { timeMinutes: 45, money: 3, fatigue: 10 },
        consequences: {
          moneyDelta: -3,
          reputationDelta: 6,
          causes: [{ facteur: 'perfectionnement technique tirant les leçons du danger', poids: 2 }],
        },
        dialogueResponse: 'Le triporteur s’arrête désormais net sur trois mètres en toute sécurité.',
      },
    ],
  },
  {
    id: 'EVT_RADIO_METEO_POETIQUE',
    category: 'economie_emergente',
    title: 'Le Bulletin Météo Clandestin',
    prompt:
      'Une voix envoûtante pirate la fréquence de la radio pirate pour déclamer : "Averses d’esprit critique et éclaircies de solidarité sur Val-Ferrand !"',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Diffuser un flash info sur les légumes frais de Bertin dans la foulée du poème',
        cost: { timeMinutes: 20 },
        consequences: {
          vitaliteEpicerieDelta: 6,
          confianceQuartierDelta: 5,
          reputationDelta: 4,
          causes: [{ facteur: 'alliance vertueuse entre création poétique et commerce éthique', poids: 2 }],
        },
        dialogueResponse: 'Les auditeurs affluent à l’épicerie en fredonnant les vers entendus.',
      },
      {
        text: 'Identifier l’auteur : c’est Solange, la contrôleuse de tramway poète !',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'reconnaissance des voix citoyennes singulières', poids: 2 }],
        },
        dialogueResponse: 'Solange rejoint officiellement l’équipe de la radio pour une chronique hebdomadaire.',
      },
      {
        text: 'Enregistrer l’émission sur cassette magnétique pour la mémoire du quartier',
        cost: { timeMinutes: 15 },
        consequences: {
          reputationDelta: 3,
          causes: [{ facteur: 'préservation des archives sonores clandestines', poids: 1 }],
        },
        dialogueResponse: 'La bande est classée dans la malle aux trésors de la friche sous le label "Ondes Vives".',
      },
    ],
  },
  {
    id: 'EVT_BOURSE_STICKERS_PUCES',
    category: 'economie_emergente',
    title: 'La Bourse Informelle de la Récréation',
    prompt:
      'Les collégiens ont inventé un marché financier sous le préau : stickers rares contre puces électroniques pour réparer leurs consoles.',
    condition: (w) => w.time.tick >= 0,
    triggerCondition: (w) => w.time.tick >= 0,
    choices: [
      {
        text: 'Donner un cours informel sur les bulles spéculatives et la valeur d’usage',
        cost: { timeMinutes: 30 },
        consequences: {
          reputationDelta: 6,
          causes: [{ facteur: 'initiation des plus jeunes aux rouages de la finance réelle', poids: 3 }],
        },
        dialogueResponse: 'Les élèves comprennent pourquoi un sticker brillant ne vaut pas un condensateur fonctionnel.',
      },
      {
        text: 'Fournir des composants électroniques récupérés à la friche pour stabiliser les cours',
        cost: { timeMinutes: 20 },
        consequences: {
          reputationDelta: 5,
          confianceQuartierDelta: 4,
          causes: [{ facteur: 'régulation par l’abondance de matériel de réemploi', poids: 2 }],
        },
        dialogueResponse: 'La spéculation retombe ; les réparations de manettes vont bon train dans la cour.',
      },
      {
        text: 'Négocier avec le surveillant général pour créer un atelier électronique officiel',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'légalisation institutionnelle d’un besoin pratique', poids: 2 }],
        },
        dialogueResponse: 'Le club Repair-Collège ouvre tous les jeudis avec l’approbation de Mme Moreau.',
      },
    ],
  },
  {
    id: 'EVT_TROC_CONFITURE_GRILLE_PAIN',
    category: 'economie_emergente',
    title: 'Le Grand Troc du Dimanche Matin',
    prompt:
      'Devant la friche, une dame offre trois pots de confiture de châtaignes maison en échange de la réparation du cordon de son grille-pain.',
    condition: (w) => w.flags['friche_visitee'] !== undefined || w.time.tick >= 0,
    triggerCondition: (w) => w.flags['friche_visitee'] !== undefined || w.time.tick >= 0,
    choices: [
      {
        text: 'Réparer le cordon immédiatement et partager la confiture avec l’équipe',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'échange non monétaire de travail vivant et saveurs locales', poids: 3 }],
        },
        dialogueResponse: 'La confiture sur du pain grillé croustillant régale Karim, Noah et Samir à l’atelier.',
      },
      {
        text: 'Officialiser un barème d’heures dans le cadre d’une banque du temps de quartier',
        cost: { timeMinutes: 30 },
        consequences: {
          confianceQuartierDelta: 8,
          reputationDelta: 5,
          causes: [{ facteur: 'structuration pérenne de l’entraide réciproque', poids: 2 }],
        },
        dialogueResponse: 'Le carnet d’échanges de temps compte déjà vingt-trois adhérents fidèles.',
      },
      {
        text: 'Refuser le troc et exiger un paiement de 5 euros sonnants et trébuchants (Smith)',
        cost: { timeMinutes: 15 },
        consequences: {
          moneyDelta: 5,
          confianceQuartierDelta: -4,
          reputationDelta: -2,
          causes: [{ facteur: 'monétarisme rigide blessant la solidarité de voisinage', poids: 1 }],
        },
        dialogueResponse: 'La dame paie en soupirant et reprend ses pots de confiture ; l’ambiance se refroidit.',
      },
    ],
  },
  {
    id: 'EVT_BANQUET_DES_HERBES_FOLLES',
    category: 'economie_emergente',
    title: 'Le Festin Botanique des Friches',
    prompt:
      'Lina découvre que les herbes sauvages qui poussent le long des voies de chemin de fer sont du pourpier, de la roquette et des pissenlits comestibles.',
    condition: (w) => w.district.meteo !== 'pluie',
    triggerCondition: (w) => w.district.meteo !== 'pluie',
    choices: [
      {
        text: 'Cueillir les herbes et préparer de grandes salades sauvages à prix libre au Stand',
        cost: { timeMinutes: 45, fatigue: 10 },
        consequences: {
          moneyDelta: 8,
          reputationDelta: 6,
          vitaliteEpicerieDelta: 4,
          causes: [{ facteur: 'économie régénérative valorisant la flore spontanée', poids: 3 }],
        },
        dialogueResponse: 'Les clients sont ravis de cette fraîcheur croquante parfumée aux fleurs de moutarde.',
      },
      {
        text: 'Créer un herbier pédagogique en sérigraphie distribué dans les boîtes aux lettres',
        cost: { timeMinutes: 40 },
        consequences: {
          confianceQuartierDelta: 6,
          reputationDelta: 5,
          causes: [{ facteur: 'partage libre des savoirs botaniques urbains', poids: 2 }],
        },
        dialogueResponse: 'Les familles du quartier apprennent à reconnaître la flore médicinale sur leurs trottoirs.',
      },
      {
        text: 'Faire analyser un échantillon de terre au lycée technique pour garantir l’absence de polluants',
        cost: { timeMinutes: 30, money: 2 },
        consequences: {
          moneyDelta: -2,
          reputationDelta: 6,
          causes: [{ facteur: 'responsabilité sanitaire exemplaire et démarche scientifique', poids: 2 }],
        },
        dialogueResponse: 'Résultats parfaits : le talus est certifié indemne de métaux lourds, feu vert pour la récolte !',
      },
    ],
  },
];

export const INTERACTIVE_EVENTS_BY_ID: Record<string, InteractiveEventDef> = Object.fromEntries(
  INTERACTIVE_EVENTS.map((evt) => [evt.id, evt])
);
