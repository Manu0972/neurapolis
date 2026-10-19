/**
 * NEURAPOLIS — Définitions des intérieurs détaillés et scènes dédiées.
 * Chaque lieu possède plusieurs pièces avec mobilier interactif,
 * conséquences chiffrées, descriptions narratives et ambiance sonore.
 */
import type { Needs, PlaceId, SkillId } from '../core/types';

export interface InteractiveFurniture {
  id: string;
  name: string;
  icon: string;
  description: string;
  actionLabel: string;
  actionId: string;
  money?: number;
  needs?: Partial<Needs>;
  skill?: SkillId;
  xp?: number;
  sound?: 'footstep' | 'coin' | 'click' | 'ghost';
  surface?: 'parquet' | 'pave' | 'herbe' | 'terre';
  customEffect?: string;
  /** Temps que prend l'action, en minutes de jeu (20 par défaut). */
  minutes?: number;
}

/** Passage vers une autre pièce du même lieu (porte, couloir, escalier). */
export interface RoomLink {
  to: string;
  label: string;
  icon: string;
  /** Un escalier (dessiné dans la pièce) plutôt qu'une simple porte. */
  stairs?: boolean;
}

export interface InteriorRoom {
  id: string;
  name: string;
  description: string;
  ambientSound: 'maison' | 'college' | 'epicerie' | 'atelier' | 'parc' | 'place';
  surfaceType: 'parquet' | 'pave' | 'herbe' | 'terre';
  furniture: InteractiveFurniture[];
  /** Niveau affiché (« en bas », « à l'étage »…). */
  floor?: string;
  /** Pièces reliées. Sans liste, chaque pièce mène à toutes les autres (anciens lieux). */
  links?: RoomLink[];
  /** La porte d'entrée (sortie vers la rue) est dans cette pièce. Vrai par défaut. */
  exit?: boolean;
}

export interface InteriorPlaceDef {
  placeId: PlaceId;
  title: string;
  rooms: InteriorRoom[];
}

export const INTERIOR_PLACES: Record<PlaceId, InteriorPlaceDef> = {
  maison: {
    placeId: 'maison',
    // Un duplex au dernier étage du bâtiment A (Cité des Roses, 1965) : en bas l'entrée, le salon
    // et la cuisine ; l'escalier intérieur monte à ta chambre et à la salle de bain ; une échelle
    // de meunier mène au grenier, sous le toit à deux pans.
    title: 'Chez toi',
    rooms: [
      {
        id: 'salon',
        name: 'Entrée et salon',
        floor: 'en bas',
        description: 'On entre directement dans la pièce à vivre : le canapé, la télé, la radio de papa. L’escalier monte à ta chambre.',
        ambientSound: 'maison',
        surfaceType: 'parquet',
        exit: true,
        links: [
          { to: 'cuisine', label: 'Aller dans la cuisine', icon: '🍳' },
          { to: 'chambre', label: 'Monter l’escalier : ta chambre (à l’étage)', icon: '⬆️', stairs: true },
        ],
        furniture: [
          {
            id: 'canape', name: 'Canapé', icon: '🛋️',
            description: 'Le vieux canapé du salon, parfait pour souffler cinq minutes.',
            actionLabel: 'Souffler un moment sur le canapé (20 min)', actionId: 'pause_canape',
            needs: { fatigue: -8, stress: -5, moral: 2 }, minutes: 20, surface: 'parquet', sound: 'click',
          },
          {
            id: 'tele', name: 'Télé', icon: '📺',
            description: 'La télé du salon : un dessin animé, un match, ou le journal régional.',
            actionLabel: 'Regarder la télé (45 min)', actionId: 'tele',
            needs: { moral: 8, stress: -6, fatigue: 2 }, minutes: 45, surface: 'parquet', sound: 'click',
          },
          {
            id: 'radio', name: 'Radio de papa', icon: '📻',
            description: 'Thierry l’allume tous les matins : les infos de la vallée et les prix au marché.',
            actionLabel: 'Écouter les infos de la vallée (15 min)', actionId: 'ecouter_radio',
            needs: { fatigue: 2, moral: 3 }, minutes: 15, surface: 'parquet', sound: 'click',
          },
        ],
      },
      {
        id: 'cuisine',
        name: 'Cuisine',
        floor: 'en bas',
        description: 'Petite cuisine équipée : le frigo, les plaques, la table où l’on dîne en famille.',
        ambientSound: 'maison',
        surfaceType: 'parquet',
        exit: false,
        links: [{ to: 'salon', label: 'Retourner au salon', icon: '⬅️' }],
        furniture: [
          {
            id: 'frigo', name: 'Frigo', icon: '🍎',
            description: 'Des yaourts, du fromage, des restes d’hier : de quoi tenir jusqu’au dîner.',
            actionLabel: 'Manger quelque chose (15 min)', actionId: 'manger',
            needs: { faim: -30, moral: 3 }, minutes: 15, surface: 'parquet', sound: 'click',
          },
          {
            id: 'cuisiniere', name: 'Plaques de cuisson', icon: '🍳',
            description: 'Des pâtes, une omelette : tu sais te débrouiller.',
            actionLabel: 'Te cuisiner un vrai repas (40 min)', actionId: 'cuisiner',
            needs: { faim: -55, moral: 5, fatigue: 3 }, skill: 'organisation', xp: 1, minutes: 40, surface: 'parquet', sound: 'click',
          },
          {
            id: 'table', name: 'Table familiale', icon: '🪑',
            description: 'Les factures du mois sont rangées dans la boîte à biscuits.',
            actionLabel: 'Faire le point sur le budget familial (20 min)', actionId: 'point_famille',
            needs: { moral: 4, stress: -3 }, skill: 'comptabilite', xp: 1, minutes: 20, surface: 'parquet', sound: 'coin',
          },
        ],
      },
      {
        id: 'chambre',
        name: 'Ta chambre',
        floor: 'à l’étage',
        description: 'Ton refuge : ton lit, ton bureau pour les devoirs, tes livres et ton armoire.',
        ambientSound: 'maison',
        surfaceType: 'parquet',
        exit: false,
        links: [
          { to: 'salon', label: 'Descendre l’escalier : le salon', icon: '⬇️' },
          { to: 'salle_de_bain', label: 'Aller dans la salle de bain', icon: '🚿' },
          { to: 'grenier', label: 'Monter au grenier (échelle)', icon: '🪜' },
        ],
        furniture: [
          {
            id: 'lit', name: 'Ton lit', icon: '🛏️',
            description: 'Le soir, tu te couches pour la nuit ; dans la journée, une sieste d’une heure.',
            actionLabel: 'Dormir ou faire une sieste', actionId: 'dormir',
            surface: 'parquet', sound: 'click',
          },
          {
            id: 'bureau', name: 'Ton bureau', icon: '✍️',
            description: 'Tes cahiers, ta trousse et tes schémas pour le quartier.',
            actionLabel: 'Faire tes devoirs (1 h)', actionId: 'devoirs',
            surface: 'parquet', sound: 'click',
          },
          {
            id: 'bibliotheque', name: 'Étagère à livres', icon: '📚',
            description: 'Des BD, des romans et deux livres d’économie trouvés au vide-grenier.',
            actionLabel: 'Lire un moment (30 min)', actionId: 'lire',
            needs: { fatigue: 4, stress: -6, moral: 4 }, skill: 'communication', xp: 1, minutes: 30, surface: 'parquet', sound: 'ghost',
          },
        ],
      },
      {
        id: 'salle_de_bain',
        name: 'Salle de bain',
        floor: 'à l’étage',
        description: 'Douche, lavabo et le miroir où tu t’entraînes à parler devant les autres.',
        ambientSound: 'maison',
        surfaceType: 'parquet',
        exit: false,
        links: [{ to: 'chambre', label: 'Retourner dans ta chambre', icon: '⬅️' }],
        furniture: [
          {
            id: 'douche', name: 'Douche', icon: '🚿',
            description: 'Dix minutes d’eau chaude, et la journée repart.',
            actionLabel: 'Prendre une douche (15 min)', actionId: 'douche',
            needs: { stress: -8, moral: 6, fatigue: -4 }, minutes: 15, surface: 'parquet', sound: 'click',
          },
          {
            id: 'lavabo', name: 'Lavabo et miroir', icon: '🪥',
            description: 'Brosse à dents, peigne, et un dernier regard avant de sortir.',
            actionLabel: 'Te préparer devant le miroir (10 min)', actionId: 'miroir',
            needs: { moral: 3, stress: -2 }, minutes: 10, surface: 'parquet', sound: 'click',
          },
        ],
      },
      {
        id: 'grenier',
        name: 'Grenier',
        floor: 'sous le toit',
        description: 'Sous les poutres : des cartons, une lucarne sur la vallée et la vieille malle de papy Lucien.',
        ambientSound: 'maison',
        surfaceType: 'parquet',
        exit: false,
        links: [{ to: 'chambre', label: 'Redescendre dans ta chambre', icon: '⬇️' }],
        furniture: [
          {
            id: 'malle', name: 'Malle de papy Lucien', icon: '🧳',
            description: 'Sa veste de Taret-Acier, ses fiches de paie de 1974 et des photos de la grève.',
            actionLabel: 'Ouvrir la malle de papy Lucien (20 min)', actionId: 'malle_lucien',
            needs: { moral: 6, stress: -4 }, minutes: 20, surface: 'parquet', sound: 'ghost',
          },
          {
            id: 'fenetre', name: 'Lucarne', icon: '🪟',
            description: 'D’ici, on voit la cheminée de la Friche et les toits jusqu’au canal.',
            actionLabel: 'Regarder la vallée par la lucarne (10 min)', actionId: 'contempler',
            needs: { stress: -8, moral: 4 }, minutes: 10, surface: 'parquet', sound: 'click',
          },
        ],
      },
    ],
  },
  college: {
    placeId: 'college',
    title: 'Collège Jean-Moulin',
    rooms: [
      {
        id: 'hall',
        name: 'Hall d’entrée',
        floor: 'rez-de-chaussée',
        description: 'Le hall carrelé : les casiers, le panneau d’affichage, la loge de la vie scolaire. L’escalier monte aux salles de classe.',
        ambientSound: 'college',
        surfaceType: 'parquet',
        exit: true,
        links: [
          { to: 'cantine', label: 'Aller à la cantine', icon: '🍽️' },
          { to: 'classe', label: 'Monter l’escalier : salle de classe 204 (2ᵉ étage)', icon: '⬆️', stairs: true },
        ],
        furniture: [
          {
            id: 'panneau_hall', name: 'Panneau d’affichage', icon: '📌',
            description: 'L’emploi du temps de ta classe, les menus de la cantine et les clubs du mercredi.',
            actionLabel: 'Lire l’emploi du temps et les annonces (5 min)', actionId: 'annonces',
            needs: { stress: -2, moral: 1 }, minutes: 5, surface: 'parquet', sound: 'click',
          },
          {
            id: 'casier', name: 'Ton casier', icon: '🔐',
            description: 'Le n° 112 : tes affaires de sport et les cahiers que tu ne veux pas porter.',
            actionLabel: 'Ranger tes affaires dans ton casier (5 min)', actionId: 'casier',
            needs: { stress: -3 }, minutes: 5, surface: 'parquet', sound: 'click',
          },
          {
            id: 'bureau_vie_scolaire', name: 'Vie scolaire', icon: '🧑‍💼',
            description: 'Le bureau du CPE : retards, mots des parents, et parfois un bon conseil.',
            actionLabel: 'Passer voir la vie scolaire (10 min)', actionId: 'vie_scolaire',
            needs: { stress: -4, moral: 2 }, skill: 'communication', xp: 1, minutes: 10, surface: 'parquet', sound: 'click',
          },
        ],
      },
      {
        id: 'classe',
        name: 'Salle de classe 204',
        floor: '2ᵉ étage',
        description: 'Rangées de tables, grand tableau vert et le bureau de Mme Moreau.',
        ambientSound: 'college',
        surfaceType: 'parquet',
        exit: false,
        links: [{ to: 'hall', label: 'Redescendre dans le hall', icon: '⬇️' }],
        furniture: [
          {
            id: 'pupitre', name: 'Ta table', icon: '📝',
            description: 'Ta table gravée au compas, au deuxième rang.',
            actionLabel: 'Réviser à ta table (30 min)', actionId: 'reviser',
            needs: { fatigue: 10, stress: 5, faim: 5 }, skill: 'organisation', xp: 2, minutes: 30, surface: 'parquet', sound: 'click',
          },
          {
            id: 'tableau', name: 'Tableau', icon: '📋',
            description: 'Le schéma de l’offre et de la demande n’a pas été effacé.',
            actionLabel: 'Recopier le schéma du tableau (15 min)', actionId: 'analyser_cours',
            needs: { fatigue: 6, moral: 3 }, skill: 'comptabilite', xp: 1, minutes: 15, surface: 'parquet', sound: 'ghost',
          },
          {
            id: 'bureau_prof', name: 'Bureau de Mme Moreau', icon: '👩‍🏫',
            description: 'Des copies corrigées et une tasse de café froid.',
            actionLabel: 'Demander un conseil de méthode (10 min)', actionId: 'conseil_prof',
            needs: { stress: -4, moral: 5, fatigue: 4 }, skill: 'communication', xp: 1, minutes: 10, surface: 'parquet', sound: 'click',
          },
        ],
      },
      {
        id: 'cantine',
        name: 'Cantine',
        floor: 'rez-de-chaussée',
        description: 'Le self, les plateaux orange et le brouhaha de midi.',
        ambientSound: 'college',
        surfaceType: 'parquet',
        exit: false,
        links: [{ to: 'hall', label: 'Retourner dans le hall', icon: '⬅️' }],
        furniture: [
          {
            id: 'comptoir_self', name: 'Le self', icon: '🍽️',
            description: 'Entrée, plat, dessert : la cantine est payée par tes parents au trimestre.',
            actionLabel: 'Déjeuner au self (30 min)', actionId: 'dejeuner_cantine',
            needs: { faim: -45, moral: 3 }, minutes: 30, surface: 'parquet', sound: 'click',
          },
          {
            id: 'table_cantine', name: 'Table de la bande', icon: '👥',
            description: 'Toujours la même table, près de la fenêtre.',
            actionLabel: 'Discuter avec la bande (20 min)', actionId: 'discuter_cantine',
            needs: { moral: 6, stress: -4 }, skill: 'communication', xp: 1, minutes: 20, surface: 'parquet', sound: 'click',
          },
        ],
      },
      {
        id: 'cour',
        name: 'Cour de récréation et préau',
        description: 'Le cœur des récrés : les marronniers, la marelle peinte et les discussions animées.',
        ambientSound: 'college',
        surfaceType: 'pave',
        furniture: [
          {
            id: 'banc_cour', name: 'Banc des copains', icon: '👥',
            description: 'On s’y retrouve pour refaire le monde et échanger des tuyaux.',
            actionLabel: 'Discuter avec le groupe', actionId: 'discuter_cour',
            needs: { moral: 8, stress: -6, fatigue: 3 }, skill: 'communication', xp: 1, surface: 'pave', sound: 'click',
          },
          {
            id: 'marelle', name: 'Marelle et jeux', icon: '🎯',
            description: 'Un tracé coloré au sol pour se dépenser entre deux sonneries.',
            actionLabel: 'Participer au jeu collectif', actionId: 'jeu_cour',
            needs: { stress: -8, moral: 6, fatigue: 5, faim: 5 }, surface: 'pave', sound: 'footstep',
          },
          {
            id: 'preau', name: 'Panneau sous le préau', icon: '📢',
            description: 'Affiches des clubs, concours d’inventions et bourses de troc.',
            actionLabel: 'Consulter les annonces du collège', actionId: 'consulter_preau',
            needs: { moral: 3, stress: -2 }, surface: 'pave', sound: 'click',
          },
        ],
      },
    ],
  },
  epicerie: {
    placeId: 'epicerie',
    title: 'Épicerie Bertin',
    rooms: [
      {
        id: 'magasin',
        name: 'Espace de vente et étalages',
        description: 'Rayons chaleureux bordés de cagettes en bois, bocaux artisanaux et senteurs d’épices.',
        ambientSound: 'epicerie',
        surfaceType: 'parquet',
        furniture: [
          {
            id: 'caisse',
            name: 'Caisse enregistreuse rétro',
            icon: '🪙',
            description: 'Mme Bertin y tient scrupuleusement le journal de caisse.',
            actionLabel: 'Acheter un goûter vitaminé (1.00 €)',
            actionId: 'gouter',
            money: -1,
            needs: { faim: -20, moral: 6 },
            skill: 'comptabilite',
            xp: 1,
            surface: 'parquet',
            sound: 'coin',
          },
          {
            id: 'rayonnage_frais',
            name: 'Rayon maraîcher frais',
            icon: '🥬',
            description: 'Fruits et légumes de saison approvisionnés auprès des producteurs de la région.',
            actionLabel: 'Acheter des pommes fraîches (0.80 €)',
            actionId: 'pommes_fraiches',
            money: -0.8,
            needs: { faim: -15, moral: 4 },
            surface: 'parquet',
            sound: 'coin',
          },
          {
            id: 'bocal_vrac',
            name: 'Meuble de vente en vrac',
            icon: '🫙',
            description: 'Silos de graines, légumineuses et fruits secs sans emballage superflu.',
            actionLabel: 'Prendre un sachet de fruits secs (1.20 €)',
            actionId: 'fruits_secs',
            money: -1.2,
            needs: { faim: -22, fatigue: -5, moral: 5 },
            surface: 'parquet',
            sound: 'coin',
          },
        ],
      },
      {
        id: 'reserve',
        name: 'Réserve et gestion des stocks',
        description: 'Palettes étiquetées, étagères métalliques et registre des fournisseurs locaux.',
        ambientSound: 'epicerie',
        surfaceType: 'pave',
        furniture: [
          {
            id: 'palette_stock',
            name: 'Palettes d’arrivage',
            icon: '📦',
            description: 'Cartons de produits en attente d’inventaire et de mise en rayon.',
            actionLabel: 'Aider Mme Bertin à inventorier le stock',
            actionId: 'inventaire_stock',
            money: 2.0,
            needs: { fatigue: 8, stress: 3, faim: 4 },
            skill: 'organisation',
            xp: 2,
            surface: 'pave',
            sound: 'coin',
          },
          {
            id: 'registre_fournisseurs',
            name: 'Livre de comptes fournisseurs',
            icon: '📖',
            description: 'Factures, bons de livraison et calcul des marges de solidarité.',
            actionLabel: 'Étudier la structure des coûts d’achat',
            actionId: 'etude_couts',
            needs: { fatigue: 5, stress: 2 },
            skill: 'comptabilite',
            xp: 2,
            surface: 'pave',
            sound: 'click',
          },
        ],
      },
    ],
  },
  friche: {
    placeId: 'friche',
    title: 'Friche Taret',
    rooms: [
      {
        id: 'atelier_principal',
        name: 'Atelier de réparation et prototypage',
        description: 'Établis en chêne massif, fers à souder chauds, étaux et outillage partagé sous verrière.',
        ambientSound: 'atelier',
        surfaceType: 'parquet',
        furniture: [
          {
            id: 'etabli',
            name: 'Établi de réparation (Karim)',
            icon: '🛠️',
            description: 'L’établi central où Karim redonne vie à l’électronique et aux appareils mécaniques.',
            actionLabel: 'Ouvrir l’atelier de réparation',
            actionId: 'atelier',
            surface: 'parquet',
            sound: 'click',
            customEffect: 'open_workshop',
          },
          {
            id: 'tour_mecanique',
            name: 'Tour et machine d’usinage',
            icon: '⚙️',
            description: 'Machine robuste pour rectifier et façonner les pièces de rechange introuvables.',
            actionLabel: 'Usiner une pièce de rechange',
            actionId: 'usiner_piece',
            needs: { fatigue: 10, stress: 4 },
            skill: 'technique',
            xp: 2,
            surface: 'parquet',
            sound: 'click',
          },
          {
            id: 'panneau_outils',
            name: 'Panneau d’outils communs',
            icon: '🔧',
            description: 'Tournevis isolés, clés plates, pinces et multimètres classés avec méthode.',
            actionLabel: 'Entretenir et calibrer l’outillage',
            actionId: 'entretenir_outils',
            needs: { fatigue: 6, stress: -3 },
            skill: 'organisation',
            xp: 1,
            surface: 'parquet',
            sound: 'click',
          },
        ],
      },
      {
        id: 'hangar_recup',
        name: 'Hangar de récupération et recyclage',
        description: 'Grands bacs de tri de composants, moteurs récupérés et bobines de câblage.',
        ambientSound: 'atelier',
        surfaceType: 'terre',
        furniture: [
          {
            id: 'tas_ferraille',
            name: 'Bacs de composants sauvés',
            icon: '🧲',
            description: 'Circuits imprimés, condensateurs et engrenages prêts pour une seconde vie.',
            actionLabel: 'Fouiller et récupérer des composants utiles',
            actionId: 'explorer',
            needs: { fatigue: 10, moral: 6, stress: 4 },
            skill: 'technique',
            xp: 2,
            surface: 'terre',
            sound: 'click',
          },
          {
            id: 'banc_diagnostic',
            name: 'Banc de test et diagnostic',
            icon: '🔬',
            description: 'Oscilloscope et alimentations régulées pour détecter les pannes complexes.',
            actionLabel: 'Tester un circuit défaillant',
            actionId: 'diagnostiquer',
            needs: { fatigue: 7, stress: 2, moral: 4 },
            skill: 'technique',
            xp: 2,
            surface: 'terre',
            sound: 'ghost',
          },
        ],
      },
    ],
  },
  parc: {
    placeId: 'parc',
    title: 'Parc des Roses',
    rooms: [
      {
        id: 'allees',
        name: 'Allées ombragées et pelouses',
        description: 'Vieux platanes, pelouses vertes accueillantes et le murmure apaisant de la fontaine.',
        ambientSound: 'parc',
        surfaceType: 'herbe',
        furniture: [
          {
            id: 'banc_anciens',
            name: 'Banc des anciens',
            icon: '🌳',
            description: 'Sous les platanes centenaires, les retraités partagent la mémoire du quartier.',
            actionLabel: 'Écouter les récits des anciens',
            actionId: 'jouer',
            needs: { fatigue: -8, moral: 10, stress: -10, faim: 4 },
            skill: 'communication',
            xp: 1,
            surface: 'herbe',
            sound: 'click',
          },
          {
            id: 'fontaine_parc',
            name: 'Fontaine en pierre',
            icon: '⛲',
            description: 'Eau claire et rafraîchissante, prisée des passants et des oiseaux.',
            actionLabel: 'Se rafraîchir à la fontaine',
            actionId: 'rafraichir',
            needs: { stress: -8, moral: 5 },
            surface: 'herbe',
            sound: 'footstep',
          },
        ],
      },
      {
        id: 'kiosque',
        name: 'Kiosque à musique et rampe',
        description: 'Structure en fer forgé où les jeunes s’entraînent au skate et à la musique de rue.',
        ambientSound: 'parc',
        surfaceType: 'pave',
        furniture: [
          {
            id: 'rampe_skate',
            name: 'Rampe de skate de Noah',
            icon: '🛹',
            description: 'Module de glisse auto-construit avec des planches de récupération de la friche.',
            actionLabel: 'Tenter une figure avec Noah',
            actionId: 'skate_noah',
            needs: { fatigue: 12, moral: 12, stress: -6, faim: 8 },
            skill: 'technique',
            xp: 1,
            surface: 'pave',
            sound: 'footstep',
          },
          {
            id: 'estrade_kiosque',
            name: 'Estrade du kiosque',
            icon: '🎸',
            description: 'Scène ouverte aux concerts associatifs et réunions de quartier sous les étoiles.',
            actionLabel: 'Jouer quelques accords',
            actionId: 'musique_kiosque',
            needs: { moral: 8, stress: -8, fatigue: 4 },
            skill: 'communication',
            xp: 1,
            surface: 'pave',
            sound: 'ghost',
          },
        ],
      },
    ],
  },
  place: {
    placeId: 'place',
    title: 'Place du Marché',
    rooms: [
      {
        id: 'halle',
        name: 'Halle couverte et marché',
        description: 'Grands étals sous charpente métallique, effervescence des échanges et senteurs de terroir.',
        ambientSound: 'place',
        surfaceType: 'pave',
        furniture: [
          {
            id: 'etal_marche',
            name: 'Étal des producteurs',
            icon: '🧺',
            description: 'Fromages, pains au levain et miels artisanaux vendus en direct.',
            actionLabel: 'Flâner entre les étals',
            actionId: 'flaner',
            needs: { stress: -6, moral: 6, faim: 2 },
            surface: 'pave',
            sound: 'coin',
          },
          {
            id: 'panneau_annonces',
            name: 'Panneau d’affichage citoyen',
            icon: '📌',
            description: 'Offres d’entraide, troc de services et ordres du jour des assemblées.',
            actionLabel: 'Lire les initiatives du quartier',
            actionId: 'lire_annonces',
            needs: { moral: 4, stress: -3 },
            skill: 'organisation',
            xp: 1,
            surface: 'pave',
            sound: 'click',
          },
        ],
      },
      {
        id: 'tribune',
        name: 'Tribune et assemblée populaire',
        description: 'L’espace du débat démocratique : micro ouvert, bancs en hémicycle et urnes transparentes.',
        ambientSound: 'place',
        surfaceType: 'pave',
        furniture: [
          {
            id: 'estrade_debat',
            name: 'Estrade de prise de parole',
            icon: '🏛️',
            description: 'L’estrade où les citoyens confrontent leurs visions du futur urbain.',
            actionLabel: 'Participer au grand débat citoyen',
            actionId: 'debat',
            surface: 'pave',
            sound: 'ghost',
            customEffect: 'open_debate',
          },
          {
            id: 'urne_citoyenne',
            name: 'Urne des vœux et budgets participatifs',
            icon: '🗳️',
            description: 'Dépôt des votes citoyens pour les aménagements durables.',
            actionLabel: 'Consulter les votes en cours',
            actionId: 'consulter_votes',
            needs: { moral: 5, stress: -4 },
            skill: 'communication',
            xp: 1,
            surface: 'pave',
            sound: 'click',
          },
        ],
      },
    ],
  },
};
