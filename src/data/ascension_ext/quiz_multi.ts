/**
 * NEURAPOLIS — Ascension & Pédagogie économique (AG-3 Phase 4)
 * Quiz du Carnet d'Économie pour les 7 concepts multijoueur.
 * Exactement 21 questions (3 questions par concept à 4 choix distincts).
 * Situations concrètes ancrées dans la vie économique et les rivalités de Val-Ferrand.
 * Neutralité de genre stricte garantie.
 */

/**
 * Interface unifiée pour une question de quiz multijoueur.
 * Fournit à la fois les propriétés modernes (question, options, correctIndex)
 * et les alias historiques (q, choices, answer) pour une compatibilité totale.
 */
export interface ConceptQuiz {
  id: string;
  conceptId: string;
  question: string;
  options: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  // Alias de compatibilité ascendante avec src/data/ascension_ext/quiz.ts
  q: string;
  choices: readonly [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
}

/**
 * Interface groupée par concept (strictement conforme au format de src/data/ascension_ext/quiz.ts).
 */
export interface GroupedConceptQuiz {
  conceptId: string;
  questions: readonly {
    id: string;
    q: string;
    choices: readonly [string, string, string, string];
    answer: 0 | 1 | 2 | 3;
    explanation: string;
  }[];
}

function createQuiz(
  id: string,
  conceptId: string,
  question: string,
  options: readonly [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string
): ConceptQuiz {
  return {
    id,
    conceptId,
    question,
    options,
    correctIndex,
    explanation,
    q: question,
    choices: options,
    answer: correctIndex,
  };
}

export const MULTI_QUIZZES: readonly ConceptQuiz[] = [
  // =========================================================================
  // 1. DILEMME DU PRISONNIER (dilemme_prisonnier)
  // =========================================================================
  createQuiz(
    'quiz_dilemme_prisonnier_1',
    'dilemme_prisonnier',
    'Sur le marché de la place, ton étal et celui d’un rival vendez les mêmes paniers de légumes. Si vous maintenez vos prix à 15 €, vous gagnez 100 € chacun. Si l’un casse ses prix à 10 € en douce pendant que l’autre reste à 15 €, le tricheur rafle 180 € et l’autre fait 0 €. Si vous cassez tous deux vos prix, vous gagnez 30 € chacun. Que prédit le dilemme du prisonnier en un coup unique sans concertation ?',
    [
      'Chacun craint la trahison de l’autre et casse ses prix, aboutissant au pire résultat collectif (30 € chacun)',
      'Vous coopérez spontanément et gagnez 100 € chacun',
      'Le rival abandonne le marché pour te laisser seul avec tes paniers',
      'Les clients refusent d’acheter tant que les prix ne sont pas à 0 €',
    ],
    0,
    'Sans communication préalable ni perspective de représailles futures, casser ses prix est la stratégie dominante pour chaque individu, mais leur défection mutuelle les conduit à un équilibre sous-optimal de 30 € chacun.'
  ),
  createQuiz(
    'quiz_dilemme_prisonnier_2',
    'dilemme_prisonnier',
    'Dans la théorie des jeux formulée par John Nash et Albert Tucker, pourquoi l’issue du dilemme du prisonnier en un seul coup est-elle qualifiée d’« inefficace au sens de Pareto » ?',
    [
      'Parce qu’elle enrichit l’État par des taxes imprévues',
      'Parce qu’un des deux joueurs finit toujours en faillite immédiate',
      'Parce qu’il existe une autre issue (la coopération mutuelle) où la situation des deux acteurs serait meilleure sans léser personne',
      'Parce que le marché manque de monnaie fiduciaire pour payer les marchandises',
    ],
    2,
    'Une issue est Pareto-optimale s’il n’est pas possible d’améliorer le sort d’un acteur sans détériorer celui d’un autre. La coopération mutuelle (100 € chacun) est strictement supérieure à la défection mutuelle (30 € chacun).'
  ),
  createQuiz(
    'quiz_dilemme_prisonnier_3',
    'dilemme_prisonnier',
    'Pour répondre à un appel d’offres de livraison pour la mairie de Val-Ferrand, deux coursiers indépendants hésitent entre déposer une offre concertée équitable ou casser secrètement leur devis. Quel levier permet de transformer ce dilemme en coopération durable ?',
    [
      'Multiplier les offres anonymes sans jamais rencontrer l’autre coursier',
      'Interdire formellement aux vélos de circuler dans les rues du Faubourg',
      'Réduire la flotte de coursiers à une seule personne tirée au sort',
      'Savoir que d’autres appels d’offres auront lieu chaque mois et que toute trahison sera immédiatement sanctionnée au tour suivant',
    ],
    3,
    'La répétition du jeu dans le temps (« l’ombre du futur ») introduit le coût des représailles futures, ce qui rend la coopération rationnellement supérieure à la trahison ponctuelle.'
  ),

  // =========================================================================
  // 2. LE CARTEL (cartel)
  // =========================================================================
  createQuiz(
    'quiz_cartel_1',
    'cartel',
    'Trois grossistes en matériaux du Bassin Industriel conviennent lors d’un repas secret de fixer le sac de ciment à 40 € au lieu de 25 € et de s’abstenir de démarcher les chantiers des autres. Comment qualifie-t-on cette organisation sur le plan économique ?',
    [
      'Une coopérative ouvrière d’intérêt collectif',
      'Un cartel (ou entente illicite sur les prix et les volumes)',
      'Un monopole naturel garanti par la loi',
      'Une fusion d’entreprises validée par l’autorité de la concurrence',
    ],
    1,
    'Un cartel est une entente formelle ou tacite entre producteurs rivaux qui s’accordent sur les tarifs et les quotas de production pour éliminer la concurrence et capter une rente sur le dos des acheteurs.'
  ),
  createQuiz(
    'quiz_cartel_2',
    'cartel',
    'Pourquoi les cartels de commerçants ont-ils une forte tendance à se fissurer d’eux-mêmes avec le temps, même sans intervention des autorités ?',
    [
      'Parce que les clients finissent par fabriquer tous leurs produits eux-mêmes à la maison',
      'Parce que le coût de location de la salle de réunion devient trop cher',
      'Parce que chaque membre a une incitation secrète à baisser légèrement son prix pour rafler toute la clientèle des autres',
      'Parce que la monnaie locale perd toute sa valeur chaque début de mois',
    ],
    2,
    'Chaque membre du cartel est confronté au dilemme de la défection : en accordant une ristourne secrète aux gros clients, il peut capter un profit immense tant que ses complices maintiennent leurs prix élevés.'
  ),
  createQuiz(
    'quiz_cartel_3',
    'cartel',
    'Adam Smith écrivait déjà en 1776 que les gens d’un même métier ne se réunissent jamais sans comploter contre le public. Quelle est la conséquence directe d’un cartel sur l’économie locale de Val-Ferrand ?',
    [
      'Une hausse artificielle des prix, une baisse de la quantité offerte et une perte sèche pour le pouvoir d’achat des habitants',
      'Une augmentation de la qualité des produits et une baisse générale du chômage',
      'Une distribution gratuite de surplus alimentaires dans les écoles',
      'Une accélération des innovations technologiques dans tous les ateliers',
    ],
    0,
    'En éliminant la concurrence, le cartel raréfie l’offre et gonfle les prix, ce qui réduit le surplus du consommateur et crée une perte sèche pour l’économie générale du territoire.'
  ),

  // =========================================================================
  // 3. LA COENTREPRISE (coentreprise)
  // =========================================================================
  createQuiz(
    'quiz_coentreprise_1',
    'coentreprise',
    'Ton atelier de métallerie à la Friche et une entreprise d’électricité du Faubourg créent ensemble une entité tierce pour remporter la rénovation des verrières de la Gare Est. Comment s’appelle cette forme d’association ?',
    [
      'Une liquidation judiciaire conjointe',
      'Un bail commercial précaire',
      'Une franchise commerciale unilatérale',
      'Une coentreprise (ou joint-venture)',
    ],
    3,
    'Une coentreprise est une alliance contractuelle ou sociétaire où deux entités distinctes créent un véhicule commun pour réaliser un projet spécifique en partageant les capitaux, les compétences et les risques.'
  ),
  createQuiz(
    'quiz_coentreprise_2',
    'coentreprise',
    'Quel est le principal avantage d’une coentreprise par rapport à une fusion complète pour deux structures indépendantes de Val-Ferrand ?',
    [
      'Elle permet de ne payer aucune taxe sur les bénéfices pendant dix ans',
      'Elle permet de mutualiser des forces sur un objectif précis tout en préservant son indépendance juridique et financière',
      'Elle oblige les deux équipes à partager le même atelier physique au mètre près',
      'Elle supprime automatiquement toutes les dettes antérieures des deux entreprises',
    ],
    1,
    'Contrairement à la fusion où l’une des structures disparaît dans l’autre, la coentreprise préserve l’autonomie et l’identité des partenaires tout en leur offrant une puissance de frappe commune sur un marché cible.'
  ),
  createQuiz(
    'quiz_coentreprise_3',
    'coentreprise',
    'Dans la gouvernance d’une coentreprise inspirée des travaux d’Elinor Ostrom, quelle condition est indispensable pour éviter que le partenariat ne s’effondre face aux premiers imprévus ?',
    [
      'Laisser l’un des deux associés décider de tout sans jamais consulter l’autre',
      'Ne jamais rédiger de convention écrite pour préserver une liberté totale',
      'Définir des règles claires de contribution, de partage des gains et un mécanisme transparent de résolution des litiges',
      'Confier la totalité de la trésorerie commune à un intermédiaire étranger au quartier',
    ],
    2,
    'Ostrom a démontré que la pérennité d’une action collective partagée repose sur des frontières claires, des règles de contribution proportionnées et des instances de médiation des désaccords accessibles à tous.'
  ),

  // =========================================================================
  // 4. LA CONFIANCE RÉPÉTÉE (confiance_repetee)
  // =========================================================================
  createQuiz(
    'quiz_confiance_repetee_1',
    'confiance_repetee',
    'Pourquoi le maraîcher du Taret accepte-t-il de te livrer des cagettes à crédit le mardi matin alors qu’il refuse catégoriquement ce délai à un acheteur de passage venu de la métropole ?',
    [
      'Parce qu’il ne sait pas compter ses stocks d’invendus',
      'Parce que votre relation commerciale est répétée et que ton intérêt à revenir chaque semaine garantit ta solvabilité',
      'Parce que la loi municipale interdit de refuser du crédit aux personnes inconnues',
      'Parce que les légumes frais s’abîment plus vite quand on les règle comptant',
    ],
    1,
    'Dans une relation économique répétée, la valeur des transactions futures surpasse le gain immédiat d’une défaillance : la réputation et la confiance deviennent un capital économique tangible.'
  ),
  createQuiz(
    'quiz_confiance_repetee_2',
    'confiance_repetee',
    'Dans les tournois de théorie des jeux menés par Robert Axelrod, quelle stratégie s’est révélée la plus robuste et gagnante pour entretenir une coopération profitable au fil du temps ?',
    [
      'Toujours trahir dès le premier tour pour imposer son autorité',
      'Changer de décision au hasard avec un dé à chaque manche',
      'Pardonner systématiquement même après dix trahisons consécutives du partenaire',
      'Donnant-donnant (Tit-for-Tat) : coopérer au premier tour, puis imiter exactement le choix précédent de son partenaire',
    ],
    3,
    'La stratégie « Donnant-donnant » réussit parce qu’elle est bienveillante (commence par coopérer), réactive (punit immédiatement toute trahison) et indulgente (pardonne dès que l’autre revient à la coopération).'
  ),
  createQuiz(
    'quiz_confiance_repetee_3',
    'confiance_repetee',
    'Dans le tissu économique ouvrier de Val-Ferrand, comment la confiance répétée entre artisans contribue-t-elle à abaisser les coûts de transaction ?',
    [
      'En supprimant le besoin d’avocats, de cautions exorbitantes et de contrôles tatillons à chaque livraison',
      'En obligeant chaque commerçant à doubler ses marges bénéficiaires pour couvrir les risques',
      'En interdisant aux artisans de prêter leurs outils de travail à leurs confrères',
      'En remplaçant les factures comptables par des poèmes manuscrits',
    ],
    0,
    'Quand la confiance mutuelle est établie par des années d’interactions fiables, les coûts de surveillance, de rédaction de contrats complexes et de garanties contentieuses diminuent drastiquement.'
  ),

  // =========================================================================
  // 5. LA BARRIÈRE À L'ENTRÉE (barriere_entree)
  // =========================================================================
  createQuiz(
    'quiz_barriere_entree_1',
    'barriere_entree',
    'Pour ouvrir une boulangerie artisanale au centre de Val-Ferrand, il faut un four à sole de 40 000 €, un diplôme professionnel reconnu et respecter les normes de sécurité. Que représentent ces obligations pour un candidat sans capital ?',
    [
      'Des subventions publiques automatiques accordées aux nouveaux arrivants',
      'Des économies d’échelle immédiates sur la première fournée',
      'Des barrières à l’entrée qui protègent les boulangers déjà installés contre la concurrence',
      'Une politique de dumping préfectoral destinée à faire chuter les prix',
    ],
    2,
    'Les barrières à l’entrée (financières, techniques ou réglementaires) constituent des obstacles qui limitent l’arrivée de nouveaux concurrents sur un marché, préservant ainsi les marges des acteurs en place.'
  ),
  createQuiz(
    'quiz_barriere_entree_2',
    'barriere_entree',
    'L’économiste Joe Bain a classé les barrières à l’entrée en plusieurs familles. Laquelle des situations suivantes relève d’une barrière structurelle liée aux économies d’échelle ?',
    [
      'Une licence administrative payante délivrée par la mairie pour chaque stand',
      'La nécessité d’atteindre immédiatement un volume massif de production pour obtenir un coût unitaire compétitif face au leader',
      'Une campagne de dénigrement anonyme menée dans les cafés du port',
      'L’obligation légale de fermer la boutique le dimanche après-midi',
    ],
    1,
    'Si un nouvel entrant doit immédiatement produire des volumes immenses pour égaler les coûts unitaires de l’acteur établi, le risque d’investir ce capital constitue une puissante barrière d’échelle.'
  ),
  createQuiz(
    'quiz_barriere_entree_3',
    'barriere_entree',
    'Le Drive HyperVal a verrouillé l’accès aux trois grands entrepôts frigorifiques situés près de la rocade. Quel effet cette barrière à l’entrée produit-elle sur les petits commerces d’alimentation de quartier ?',
    [
      'Elle permet aux épiceries indépendantes d’augmenter sans effort leurs marges de gros',
      'Elle supprime tous les frais de logistique urbaine dans la ville',
      'Elle incite le Drive à baisser ses prix pour soutenir le commerce local',
      'Elle force les petits commerçants à s’approvisionner plus loin ou plus cher, renforçant la position dominante du géant',
    ],
    3,
    'Le contrôle exclusif d’une infrastructure essentielle (ici la chaîne du froid logistique) permet à l’acteur dominant de maintenir une barrière stratégique qui pénalise les structures plus modestes.'
  ),

  // =========================================================================
  // 6. LA GUERRE DES PRIX (guerre_des_prix)
  // =========================================================================
  createQuiz(
    'quiz_guerre_des_prix_1',
    'guerre_des_prix',
    'Deux cafés voisins sur la place des Roses baissent successivement le prix de l’expresso de 1,50 € à 1,20 €, puis 1,00 €, jusqu’à 0,50 €, soit en-dessous du coût des grains et de l’électricité. Quel est l’objectif stratégique poursuivi par l’initiateur de cette guerre ?',
    [
      'Augmenter immédiatement la rentabilité financière nette de son établissement',
      'Asphyxier la trésorerie de son concurrent pour le contraindre à fermer ou à capituler',
      'Faire plaisir au receveur municipal des impôts en réduisant son chiffre d’affaires',
      'Diminuer volontairement la consommation de café des habitants du quartier',
    ],
    1,
    'Dans une guerre des prix agressive (ou prix prédateurs), un acteur utilise sa réserve financière pour vendre à perte afin d’éliminer son rival avant de remonter ses tarifs une fois seul sur le marché.'
  ),
  createQuiz(
    'quiz_guerre_des_prix_2',
    'guerre_des_prix',
    'Dans le modèle d’oligopole de Bertrand, que se produit-il si deux entreprises vendant des produits parfaitement substituables se livrent une concurrence uniquement par les prix ?',
    [
      'Le prix tombe jusqu’au coût marginal et le profit économique devient nul pour les deux entreprises',
      'Les deux entreprises quadruplent leurs bénéfices en quelques jours grâce aux volumes',
      'L’une des deux entreprises rachète obligatoirement l’autre pour 1 euro symbolique',
      'Les consommateurs cessent d’acheter le produit par méfiance devant les tarifs bas',
    ],
    0,
    'Le paradoxe de Bertrand démontre que si les biens sont homogènes et la concurrence menée exclusivement par les prix, deux firmes suffisent pour pousser les tarifs au niveau du coût de production, annulant tout profit économique.'
  ),
  createQuiz(
    'quiz_guerre_des_prix_3',
    'guerre_des_prix',
    'Pourquoi déclencher une guerre des prix contre un concurrent doté de réserves financières colossales (comme le Drive HyperVal) est-il une stratégie suicidaire pour une petite boutique locale ?',
    [
      'Parce que la météo devient systématiquement mauvaise pour les petits étals de rue',
      'Parce que les clients de quartier détestent payer moins cher leurs articles de base',
      'Parce que le rival dispose de réserves financières bien plus profondes et peut tenir à perte beaucoup plus longtemps que toi',
      'Parce que la loi interdit formellement de baisser ses prix de plus de 5 centimes par article',
    ],
    2,
    'La guerre d’usure financière tourne toujours à l’avantage de l’acteur aux reins financiers les plus solides. Le petit commerce épuise sa trésorerie avant d’avoir pu faire plier le grand groupe.'
  ),

  // =========================================================================
  // 7. LE PASSAGER CLANDESTIN (passager_clandestin)
  // =========================================================================
  createQuiz(
    'quiz_passager_clandestin_1',
    'passager_clandestin',
    'Les commerçants d’une rue piétonne cotisent tous à une caisse commune de 100 € par mois pour financer la propreté et la décoration florale. Un commerçant refuse de payer mais ses clients profitent de la beauté et de la propreté de la rue. Quel concept économique décrit son attitude ?',
    [
      'Le passager clandestin (free rider)',
      'L’aléa moral d’assurance',
      'La rente de situation ricardienne',
      'L’effet de réseau schumpétérien',
    ],
    0,
    'Le passager clandestin (théorisé par Mancur Olson) bénéficie des retombées positives d’une action collective ou d’un bien public sans contribuer à son financement ou à son entretien.'
  ),
  createQuiz(
    'quiz_passager_clandestin_2',
    'passager_clandestin',
    'Que se passe-t-il inévitablement dans une communauté d’artisans si le comportement de passager clandestin n’est ni régulé ni sanctionné par le groupe ?',
    [
      'Les cotisations volontaires augmentent spontanément par esprit de générosité',
      'La qualité du service commun s’améliore de façon totalement automatique',
      'La mairie verse une prime de remerciement aux passagers clandestins pour leur gestion',
      'Les cotisants de bonne foi se découragent d’être dupés, cessent de payer et le bien commun finit par disparaître',
    ],
    3,
    'Si la tricherie reste impunie, le sentiment d’injustice pousse les contributeurs vertueux à déserter la caisse commune, conduisant à la ruine ou à la disparition du service partagé.'
  ),
  createQuiz(
    'quiz_passager_clandestin_3',
    'passager_clandestin',
    'Selon les travaux d’Elinor Ostrom sur la gouvernance des biens communs, quel dispositif empêche efficacement le problème du passager clandestin dans un quartier ?',
    [
      'Confier la surveillance à des caméras gérées depuis un autre pays',
      'Mettre en place des règles décidées collectivement, une surveillance par les pairs et des sanctions graduées',
      'Interdire à quiconque d’utiliser la ressource sous peine de prison immédiate',
      'Ignorer totalement le problème en espérant que la bonté humaine suffise',
    ],
    1,
    'Ostrom a démontré que les communautés réussissent à préserver leurs ressources communes quand elles appliquent des règles d’usage définies par les usagers eux-mêmes, assorties de sanctions progressives contre les resquilleurs.'
  ),
];

/**
 * Version groupée par concept (conforme à l'organisation de src/data/ascension_ext/quiz.ts).
 * Exactement 7 entrées, 3 questions chacune.
 */
export const MULTI_QUIZZES_GROUPED: readonly GroupedConceptQuiz[] = [
  'dilemme_prisonnier',
  'cartel',
  'coentreprise',
  'confiance_repetee',
  'barriere_entree',
  'guerre_des_prix',
  'passager_clandestin',
].map((conceptId) => ({
  conceptId,
  questions: MULTI_QUIZZES.filter((q) => q.conceptId === conceptId).map((q) => ({
    id: q.id,
    q: q.q,
    choices: q.choices,
    answer: q.answer,
    explanation: q.explanation,
  })),
}));

export const QUIZ_BY_ID: Readonly<Record<string, ConceptQuiz>> = Object.fromEntries(
  MULTI_QUIZZES.map((q) => [q.id, q])
);
