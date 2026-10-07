/**
 * Lieux remarquables des nouveaux quartiers (grande carte, 2026-10-07) : on y entre, on y
 * rencontre du monde, on y fait quelque chose qui compte. Chaque activité a des horaires, une
 * durée (l'horloge avance d'autant) et des effets ; certaines apprennent un concept du carnet.
 * Les bâtiments sont posés par `layout.ts` (ids de bâtiment ci-dessous).
 */
import type { NeedId, SkillId } from '../../core/types';

export interface LandmarkEffects {
  money?: number;
  /** Gain d'argent qui grandit avec la réputation (€ par point). */
  moneyPerRep?: number;
  needs?: Partial<Record<NeedId, number>>;
  xp?: [SkillId, number][];
  reputation?: number;
  /** Confiance des deux parents. */
  trust?: number;
  /** Concept du carnet appris (une fois). */
  concept?: string;
  /** Moyenne scolaire. */
  average?: number;
}

export interface LandmarkActivity {
  id: string;
  icon: string;
  title: string;
  host: string;
  /** Durée (minutes de jeu). */
  minutes: number;
  /** Plage horaire [début, fin) en minutes depuis minuit. */
  hours: [number, number];
  /** Jours de la semaine (0 = dimanche … 6 = samedi) ; tous par défaut. */
  weekdays?: number[];
  /** Seulement les jours d'école. */
  schoolDays?: boolean;
  /** Âge « économique » minimal (un prête-nom compte). */
  minEconAge?: number;
  /** Une fois par jour (par défaut) ou par semaine. */
  per?: 'jour' | 'semaine';
  /** Ce qui se passe (affiché à la fin). */
  text: string;
  effects: LandmarkEffects;
}

export interface LandmarkDef {
  id: string;
  /** Bâtiment de `layout.ts` dont la porte devient une entrée. */
  buildingId: string;
  name: string;
  lore: string;
  /** Intérieur : sol, murs, plein air. */
  floor: 'parquet' | 'carrelage' | 'beton' | 'lino' | 'paves' | 'herbe';
  wall: string;
  outdoor?: string;
  activities: LandmarkActivity[];
}

const H = (h: number, m = 0): number => h * 60 + m;

export const LANDMARKS: readonly LandmarkDef[] = [
  {
    id: 'hopital', buildingId: 'hopital', name: 'Hôpital de Val-Ferrand',
    lore: 'Construit en 1962 avec l’argent de Taret-Acier, pour soigner les brûlés du haut-fourneau. Nora y fait ses gardes de nuit.',
    floor: 'lino', wall: '#dfe7e4',
    activities: [
      {
        id: 'h_nora', icon: '🍲', title: 'Apporter un repas à Nora pendant sa garde', host: 'Nora', minutes: 40, hours: [H(18), H(21, 30)],
        text: 'Nora sourit en voyant la boîte. « Tu n’étais pas obligé·e. » Elle mange debout entre deux bips, et te raconte la nuit d’avant sans les détails qui font peur.',
        effects: { money: -6, trust: 4, needs: { moral: 6 } },
      },
      {
        id: 'h_benevolat', icon: '🤝', title: 'Bénévolat à l’accueil', host: 'Josiane, cadre de santé', minutes: 120, hours: [H(9), H(18)],
        text: 'Tu orientes les familles perdues dans les couloirs. Josiane note ton nom : « Revenez quand vous voulez. Ici, la gentillesse ne se facture pas. »',
        effects: { reputation: 2, needs: { moral: 3, fatigue: 8 }, xp: [['communication', 15]] },
      },
      {
        id: 'h_urgences', icon: '🩺', title: 'Comprendre le tableau des urgences', host: 'Dr Benali', minutes: 25, hours: [H(8), H(22)], per: 'semaine',
        text: 'Le docteur Benali montre la file : « Ici, on ne soigne pas celui qui paie le plus, mais celui qui en a le plus besoin. Un hôpital n’est pas un marché comme les autres. »',
        effects: { concept: 'bien_public', xp: [['recherche', 10]] },
      },
      {
        id: 'h_cafeteria', icon: '🥪', title: 'Un sandwich à la cafétéria', host: 'la cafétéria', minutes: 15, hours: [H(7), H(20)],
        text: 'Le sandwich est triste, le café pire, mais tu as moins faim.',
        effects: { money: -4, needs: { faim: -40 } },
      },
    ],
  },
  {
    id: 'lycee', buildingId: 'lycee', name: 'Lycée Louise-Michel',
    lore: 'Le lycée de la vallée, baptisé en 1981 d’après l’institutrice communarde. Après le collège Jean-Moulin, c’est ici que tout le monde finit par se croiser.',
    floor: 'parquet', wall: '#e8dcc4',
    activities: [
      {
        id: 'l_cdi', icon: '📚', title: 'Réviser au CDI', host: 'Mme Ferrand, documentaliste', minutes: 60, hours: [H(8), H(18)], schoolDays: true,
        text: 'Le CDI sent le papier et le radiateur. Mme Ferrand te sort un vieux manuel d’économie : « Les lycéens ne l’ouvrent jamais. Toi, peut-être. »',
        effects: { average: 0.2, xp: [['recherche', 15]], needs: { stress: 2 } },
      },
      {
        id: 'l_club_eco', icon: '📊', title: 'Club d’économie du mercredi', host: 'M. Diop, professeur de SES', minutes: 90, hours: [H(13, 30), H(17)], weekdays: [3], per: 'semaine',
        text: 'M. Diop pose deux pommes sur la table : « Vous savez que celle-ci est pourrie, pas l’acheteur. Qui fixe le prix ? » Le club s’enflamme pendant une heure.',
        effects: { concept: 'asymetrie_information', xp: [['comptabilite', 20]] },
      },
      {
        id: 'l_sortie', icon: '🧃', title: 'Vendre tes goûters à la sortie du lycée', host: 'les lycéens', minutes: 60, hours: [H(16), H(18, 30)], schoolDays: true,
        text: 'Les lycéens ont plus d’argent de poche que les collégiens, et moins de patience. Tu vends vite, et plus cher.',
        effects: { money: 14, moneyPerRep: 0.3, reputation: 1, xp: [['negociation', 10]] },
      },
    ],
  },
  {
    id: 'stade', buildingId: 'tribune', name: 'Stade Marcel-Cerdan',
    lore: 'Le stade des ouvriers de Taret-Acier. Le FC Taret y joue le samedi devant trois cents fidèles et autant de souvenirs.',
    floor: 'herbe', wall: '#b9b2a0', outdoor: '#bcd6e8',
    activities: [
      {
        id: 's_piste', icon: '🏃', title: 'Courir sur la piste', host: 'personne', minutes: 45, hours: [H(7), H(21)],
        text: 'Quatre tours de piste. Tes pensées se rangent toutes seules.',
        effects: { needs: { stress: -12, fatigue: 10, moral: 4 } },
      },
      {
        id: 's_buvette', icon: '🌭', title: 'Tenir la buvette du match', host: 'Roger, président du FC Taret', minutes: 180, hours: [H(13), H(18)], weekdays: [6],
        text: 'Trois cents supporters, une mi-temps de dix minutes : tout se joue là. Roger compte la caisse et te tend ta part. « Reviens samedi prochain. »',
        effects: { money: 35, moneyPerRep: 0.6, reputation: 1, xp: [['organisation', 15]], needs: { fatigue: 12 } },
      },
      {
        id: 's_entrainement', icon: '⚽', title: 'Regarder l’entraînement', host: 'les joueurs du FC Taret', minutes: 60, hours: [H(17), H(20)], weekdays: [2, 4],
        text: 'L’entraîneur hurle « Collectif ! » toutes les trente secondes. Tu comprends ce qu’il veut dire.',
        effects: { needs: { moral: 6, stress: -4 } },
      },
    ],
  },
  {
    id: 'cimetiere', buildingId: 'chapelle', name: 'Cimetière du Taret',
    lore: 'Les ouvriers de Taret-Acier reposent face à la vallée qu’ils ont bâtie. Lucien est au fond, sous le tilleul.',
    floor: 'herbe', wall: '#a8a294', outdoor: '#c9d3dc',
    activities: [
      {
        id: 'c_lucien', icon: '🕯️', title: 'Se recueillir sur la tombe de Lucien', host: 'Lucien', minutes: 20, hours: [H(8), H(19)], per: 'semaine',
        text: 'Le nom est presque effacé. Tu racontes à voix basse ce que tu as fait cette semaine. Quelque part, une voix dans ta tête se tait pour écouter.',
        effects: { needs: { moral: 10, stress: -8 } },
      },
      {
        id: 'c_gardien', icon: '🌿', title: 'Aider le gardien à désherber', host: 'M. Fabre, gardien', minutes: 60, hours: [H(8), H(17)],
        text: 'M. Fabre connaît chaque tombe. Il te paie en monnaie et en histoires de grèves.',
        effects: { money: 8, xp: [['technique', 5]], needs: { fatigue: 6 } },
      },
    ],
  },
  {
    id: 'brasserie', buildingId: 'brasserie_malterie', name: 'Brasserie de la Malterie',
    lore: 'La malterie qui a donné son nom au canal, en 1888. On y brasse encore, et on y jette chaque jour des tonnes de drêches.',
    floor: 'beton', wall: '#8a5a44',
    activities: [
      {
        id: 'b_visite', icon: '🏭', title: 'Visite de la brasserie', host: 'Hélène, maître brasseuse', minutes: 60, hours: [H(10), H(17)], weekdays: [1, 2, 3, 4, 5], per: 'semaine',
        text: 'Une cuve de 10 000 litres coûte à peine plus cher à chauffer qu’une de 5 000. Hélène sourit : « Voilà pourquoi les petits brasseurs souffrent. »',
        effects: { concept: 'economies_echelle', xp: [['technique', 10]] },
      },
      {
        id: 'b_dreches', icon: '🌾', title: 'Négocier les drêches pour les boulangers', host: 'Hélène, maître brasseuse', minutes: 45, hours: [H(8), H(17)], weekdays: [1, 2, 3, 4, 5], minEconAge: 16,
        text: 'Ce qu’elle jette, les boulangers l’achètent pour leur pain aux céréales. Tu fais l’intermédiaire et tu prends ta marge sur un déchet.',
        effects: { money: 22, moneyPerRep: 0.2, xp: [['negociation', 15]] },
      },
    ],
  },
];

export const LANDMARK_BY_ID: Readonly<Record<string, LandmarkDef>> = Object.fromEntries(LANDMARKS.map((l) => [l.id, l]));
export const LANDMARK_BY_BUILDING: Readonly<Record<string, LandmarkDef>> = Object.fromEntries(LANDMARKS.map((l) => [l.buildingId, l]));
