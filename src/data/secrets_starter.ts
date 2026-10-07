/**
 * Secrets du monde : premier jeu (Antigravity livrera les siens dans src/data/secrets/).
 * Chaque secret a un lieu, parfois une heure, un jour ou une météo, un indice et une récompense.
 */
import type { SecretDef } from '../core/secret_types';

export const STARTER_SECRETS: readonly SecretDef[] = [
  {
    id: 'cave_malterie', title: 'La cave de la Malterie',
    where: { street: 'Quai de la Malterie', hint: 'une grille rouillée au ras du quai' },
    when: { hour: [19, 22] },
    clue: 'Dans la marge d’un cahier de Lucien : « Quai de la Malterie, la grille du bas. Le soir, quand les péniches sont amarrées. »',
    reward: { kind: 'concept', value: 'cout_stock' },
    lore: 'Derrière la grille, des caisses de bouteilles de 1974 jamais livrées : la brasserie a fermé avant la tournée. Des milliers de francs de marchandise, morts dans le noir. Un stock qui dort, c’est de l’argent qui meurt.',
  },
  {
    id: 'radio_pirate', title: 'La radio pirate du 108.4',
    where: { place: 'friche', hint: 'derrière l’atelier de Karim, un câble qui monte vers le château d’eau' },
    when: { hour: [19, 22] },
    requires: { concepts: 2 },
    clue: 'Le soir, sur la radio de la cuisine, une voix grésillante parle de la friche « sur le 108.4 ». Thierry hausse les épaules : « Des gamins de la friche, sûrement. »',
    reward: { kind: 'argent', value: 40 },
    lore: 'Un vieil émetteur bricolé, une cassette de 1983 : « Radio Taret Libre ». Les ouvriers y annonçaient les grèves et les prix de l’épicerie Bertin. Karim te laisse vendre de la pub dans l’émission du samedi.',
  },
  {
    id: 'carnet_1974', title: 'Le carnet de l’ouvrier de 1974',
    where: { place: 'place', hint: 'sous le banc de pierre, face à la fontaine' },
    requires: { tier: 2 },
    clue: 'Mme Bertin raconte qu’un fondeur cachait ses notes « sous le vieux banc de la place, pour que le contremaître ne les trouve pas ».',
    reward: { kind: 'concept', value: 'plus_value' },
    lore: 'Une boîte en fer, un carnet trempé puis séché : les heures travaillées, les tonnes coulées, le salaire, page après page. En bas, une soustraction rageuse : ce que l’acier vendu rapporte, moins ce qu’on lui paie.',
  },
  {
    id: 'fournisseur_pont', title: 'Le fournisseur du pont',
    where: { street: 'Rue du Laminoir', hint: 'sous le pont de la voie ferrée, une camionnette sans plaque' },
    when: { hour: [7, 9], weekday: [6] },
    requires: { tier: 2 },
    clue: 'Une dépêche locale parle de « marchandise à prix cassés vendue le samedi matin sous le pont du laminoir ». Personne ne sait d’où elle vient.',
    reward: { kind: 'concept', value: 'signal_prix' },
    lore: 'Des cartons de biscuits à moitié prix, sans facture. Le vendeur sourit trop. Tu repars sans rien acheter : un prix trop beau est une information, pas une affaire.',
  },
  {
    id: 'fenetre_college', title: 'La salle murée du collège',
    where: { place: 'college', hint: 'au fond du couloir du deuxième étage, une porte peinte de la couleur du mur' },
    when: { weekday: [1, 2, 3, 4, 5] },
    requires: { concepts: 4 },
    clue: 'Yasmine jure qu’il y a une « salle fantôme » au collège Jean-Moulin, fermée depuis la fusion avec l’école de l’usine en 1992.',
    reward: { kind: 'objet', value: 'carte_vallee' },
    lore: 'L’ancienne salle de classe de l’école d’apprentis de Taret-Acier. Au mur, une carte de la vallée de 1970 avec les puits, les hauts-fourneaux et les cités. Tu la décroches avec l’accord du CPE.',
  },
  {
    id: 'pluie_parc', title: 'L’abri du parc sous la pluie',
    where: { place: 'parc', hint: 'le kiosque à musique, quand il pleut' },
    when: { weather: 'pluie' },
    requires: { concepts: 6 },
    clue: 'Dans le dernier cahier trouvé, Lucien note : « Les jours de pluie, au kiosque, les gens parlent vrai. »',
    reward: { kind: 'concept', value: 'capital_social' },
    lore: 'Sous le kiosque, des retraités du laminoir, une infirmière collègue de Nora, un livreur trempé. Une heure de conversation, trois contacts, et l’idée qu’un réseau se tisse d’abord sous la pluie.',
  },
];
