/**
 * Quiz du carnet d'économie : premier jeu (Antigravity livre la suite dans
 * src/data/ascension_ext/quiz.ts, workflow AG-2 phase 6). Les questions partent de situations
 * du jeu, jamais de définitions à réciter.
 */
export interface ConceptQuiz {
  conceptId: string;
  questions: { q: string; choices: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explanation: string }[];
}

export const STARTER_QUIZZES: readonly ConceptQuiz[] = [
  {
    conceptId: 'economies_echelle',
    questions: [
      { q: 'Ta fournée de 50 cookies coûte 20 € de four et de gaz, plus 0,30 € de pâte par cookie. Combien coûte chaque cookie si tu en fais 100 au lieu de 50 ?', choices: ['0,70 €', '0,50 €', '0,40 €', '0,30 €'], answer: 1, explanation: 'Les 20 € de four se partagent sur 100 cookies (0,20 €) au lieu de 50 (0,40 €) : 0,20 + 0,30 = 0,50 €.' },
      { q: 'Ford produit en masse. Quand cela devient-il un piège ?', choices: ['Quand la demande baisse et que les invendus s’accumulent', 'Quand le prix de la farine baisse', 'Quand on embauche', 'Jamais'], answer: 0, explanation: 'Les économies d’échelle supposent de vendre tout ce qu’on produit. Sinon, le stock coûte.' },
      { q: 'Quel type d’affaire profite le plus des économies d’échelle ?', choices: ['Une centrale d’achat à faible marge', 'Un cours particulier', 'Une galerie d’art', 'Un salon de coiffure'], answer: 0, explanation: 'Quand la marge est fine, gagner quelques centimes par unité sur de gros volumes change tout.' },
    ],
  },
  {
    conceptId: 'juste_a_temps',
    questions: [
      { q: 'Ton étal jette 12 € de fraises chaque soir. Que conseillerait Ohno ?', choices: ['Commander moins, plus souvent', 'Commander plus pour avoir un meilleur prix', 'Baisser le prix le matin', 'Arrêter les fraises'], answer: 0, explanation: 'Le juste-à-temps réduit le stock dormant : de petites commandes fréquentes collent à la demande.' },
      { q: 'Quel est le risque du juste-à-temps ?', choices: ['La rupture si le fournisseur est en retard', 'Trop d’invendus', 'Des prix trop bas', 'Trop de clients'], answer: 0, explanation: 'Sans stock de sécurité, un retard de livraison vide les rayons.' },
      { q: 'Pendant la grève des routiers, qui souffre le plus ?', choices: ['Celui qui travaille à flux tendu avec un fournisseur lointain', 'Celui qui a un gros stock', 'Celui qui vend en ligne', 'Personne'], answer: 0, explanation: 'Le flux tendu dépend de chaque maillon de la chaîne.' },
    ],
  },
  {
    conceptId: 'marge',
    questions: [
      { q: 'Tu achètes une canette 0,40 € et la vends 1 €. Quelle est ta marge par canette ?', choices: ['0,60 €', '1,40 €', '0,40 €', '60 %'], answer: 0, explanation: 'Marge = prix de vente − coût d’achat = 1 − 0,40 = 0,60 €.' },
      { q: 'Tu baisses ton prix à 0,50 € et vends deux fois plus. Gagnes-tu plus ?', choices: ['Non : 2 × 0,10 € = 0,20 € contre 0,60 €', 'Oui, deux fois plus', 'Oui, un peu', 'Impossible à savoir'], answer: 0, explanation: 'Vendre plus ne suffit pas : à 0,50 € la marge tombe à 0,10 €.' },
      { q: 'Ta boutique est pleine mais ta caisse se vide. Cause probable ?', choices: ['Des prix trop bas pour couvrir les coûts', 'Trop de clients', 'Un mauvais emplacement', 'La météo'], answer: 0, explanation: 'C’est la marge qui paie le loyer et les salaires.' },
    ],
  },
  {
    conceptId: 'cout_fixe_variable',
    questions: [
      { q: 'Lequel est un coût fixe pour ton étal ?', choices: ['La location de l’emplacement', 'Les biscuits vendus', 'Les sacs en papier', 'La commission par vente'], answer: 0, explanation: 'Le loyer tombe même si tu ne vends rien.' },
      { q: 'Un jour de pluie sans clients, qu’as-tu quand même payé ?', choices: ['Les coûts fixes', 'Les coûts variables', 'Rien', 'Tout'], answer: 0, explanation: 'Les coûts variables suivent les ventes ; pas les coûts fixes.' },
      { q: 'Pourquoi un gros loyer rend-il une affaire risquée ?', choices: ['Il faut beaucoup vendre avant de gagner le premier euro', 'Il fait baisser les prix', 'Il attire la police', 'Il fait fuir les fournisseurs'], answer: 0, explanation: 'Plus les coûts fixes sont hauts, plus le seuil de rentabilité est loin.' },
    ],
  },
  {
    conceptId: 'levier',
    questions: [
      { q: 'Tu empruntes 1 000 € à 8 % pour ouvrir plus grand. L’affaire rapporte 5 %. Que se passe-t-il ?', choices: ['Tu perds de l’argent sur la part empruntée', 'Tu gagnes 13 %', 'Rien ne change', 'La banque paie la différence'], answer: 0, explanation: 'Le levier amplifie les pertes quand le rendement est sous le taux d’intérêt.' },
      { q: 'Quand Keynes a-t-il raison d’emprunter ?', choices: ['Quand la demande repart et que l’investissement rapporte plus que les intérêts', 'Toujours', 'Jamais', 'Quand on n’a plus d’argent'], answer: 0, explanation: 'Emprunter pour produire, quand le rendement dépasse le coût du crédit.' },
      { q: 'Hayek se méfie de la dette parce que…', choices: ['les intérêts tombent même les mauvais mois', 'elle est illégale', 'les banques mentent', 'elle fait monter les prix'], answer: 0, explanation: 'La dette est un coût fixe de plus : elle ne s’adapte pas à la conjoncture.' },
    ],
  },
  {
    conceptId: 'effet_reseau',
    questions: [
      { q: 'Pourquoi l’appli des commerçants vaut-elle plus avec 50 boutiques qu’avec 5 ?', choices: ['Chaque boutique de plus la rend utile à plus de clients', 'Elle coûte moins cher', 'Elle est plus jolie', 'Elle va plus vite'], answer: 0, explanation: 'Un service gagne en valeur quand plus de gens l’utilisent.' },
      { q: 'La vidéo de ton stand tourne dans tout le collège. Quel phénomène ?', choices: ['Un effet de réseau : chaque partage en amène d’autres', 'Une économie d’échelle', 'Une inflation', 'Un monopole'], answer: 0, explanation: 'Plus il y a de gens qui en parlent, plus il y en a qui viennent.' },
      { q: 'Quel risque cache un effet de réseau très fort ?', choices: ['Le gagnant rafle tout et devient difficile à concurrencer', 'Les prix baissent trop', 'Personne ne l’utilise', 'Il disparaît tout seul'], answer: 0, explanation: 'Les réseaux tendent vers le monopole : c’est une question pour Zuboff et Polanyi.' },
    ],
  },
];
