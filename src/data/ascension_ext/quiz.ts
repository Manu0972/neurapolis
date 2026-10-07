/**
 * NEURAPOLIS — Ascension & Pédagogie économique (AG-2 Phase 6)
 * Quiz du Carnet d'Économie : situations concrètes vécues à Val-Ferrand.
 * 32 concepts (20 de base + 12 avancés), 3 questions à 4 choix par concept (96 questions au total).
 * Chaque question part d'une situation vécue dans le jeu (étal, atelier, coursiers, docks, école),
 * jamais d'une récitation abstraite de manuel.
 */

export interface ConceptQuiz {
  conceptId: string;
  questions: {
    q: string;
    choices: [string, string, string, string];
    answer: 0 | 1 | 2 | 3;
    explanation: string;
  }[];
}

export const QUIZZES: readonly ConceptQuiz[] = [
  // =========================================================================
  // LES 20 CONCEPTS DE BASE (src/data/ascension/concepts.ts)
  // =========================================================================

  {
    conceptId: 'economies_echelle',
    questions: [
      {
        q: 'Ta fournée de 50 cookies coûte 20 € d’énergie au four et 0,30 € de pâte par biscuit. Combien revient chaque cookie si tu en cuis 100 dans la même fournée au lieu de 50 ?',
        choices: ['0,70 €', '0,50 €', '0,40 €', '0,30 €'],
        answer: 1,
        explanation: 'Les 20 € d’énergie fixes se divisent sur 100 cookies (0,20 €) au lieu de 50 (0,40 €) : 0,20 € fixe + 0,30 € variable = 0,50 € par pièce.',
      },
      {
        q: 'Ford a démontré l’intérêt de produire en masse. Quand cette logique devient-elle un piège mortel pour ton atelier ?',
        choices: [
          'Quand la demande locale ralentit et que les stocks d’invendus s’empilent à perte',
          'Quand le prix d’achat au kilo de la farine baisse de 10 %',
          'Dès que tu embauches une personne supplémentaire pour aider',
          'Lorsque la météo annonce une semaine de pluie continue',
        ],
        answer: 0,
        explanation: 'Les économies d’échelle exigent d’écouler tous les volumes produits. Si la demande cale, les coûts fixes continuent de tourner et les invendus étouffent la trésorerie.',
      },
      {
        q: 'Parmi ces initiatives démarrées à Val-Ferrand, laquelle profite le plus directement d’économies d’échelle massives ?',
        choices: [
          'Un cours de soutien scolaire individuel dispensé chez un habitant',
          'Une sculpture sur bois unique taillée sur commande à la Friche',
          'Une centrale d’achat groupé de fournitures pour tous les commerçants du quartier',
          'Une course de livraison express sur mesure effectuée à pied',
        ],
        answer: 2,
        explanation: 'Acheter et distribuer d’immenses volumes permet d’obtenir des remises de gros inaccessibles sur du travail artisanal ou du service individuel.',
      },
    ],
  },

  {
    conceptId: 'juste_a_temps',
    questions: [
      {
        q: 'Ton étal jette 12 € de fraises fraîches invendues chaque soir d’été. Que conseillerait Taiichi Ohno pour stopper ce gâchis ?',
        choices: [
          'Commander de plus petits lots quotidiens calés sur les ventes réelles de la veille',
          'Doubler la commande du lundi pour négocier un prix de gros au cageot',
          'Brader tous les fruits à moitié prix dès l’ouverture à 8 heures',
          'Remplacer définitivement les fruits frais par des conserves en boîte',
        ],
        answer: 0,
        explanation: 'Le juste-à-temps combat le gaspillage en synchronisant les réassorts sur le flux réel de la demande, évitant les invendus périssables.',
      },
      {
        q: 'En adoptant le juste-à-temps sans stock de réserve pour ton atelier de vélos, à quel risque direct t’exposes-tu ?',
        choices: [
          'Une accumulation excessive de pièces détachées encombrant l’établi',
          'Une rupture immédiate si le fournisseur de câbles subit un retard de livraison',
          'Une flambée incontrôlée des heures supplémentaires de ton équipe',
          'Une baisse subite de la qualité technique des réparations',
        ],
        answer: 1,
        explanation: 'Le flux tendu supprime les matelas de sécurité : le moindre retard logistique bloque immédiatement les réparations des clients.',
      },
      {
        q: 'Pendant une grève des transporteurs bloquant la route nationale, qui souffre le plus rapidement dans la ville ?',
        choices: [
          'L’épicerie qui dispose de trois semaines de conserves en réserve',
          'Le réparateur qui réutilise de vieilles pièces récupérées à la Friche',
          'Le commerçant qui travaille à flux tendu avec un fournisseur distant',
          'Le cabinet comptable qui traite des dossiers d’archives papier',
        ],
        answer: 2,
        explanation: 'Travailler à flux tendu sans réserve locale rend extrêmement dépendant de la fluidité permanente de chaque maillon de transport.',
      },
    ],
  },

  {
    conceptId: 'cout_stock',
    questions: [
      {
        q: 'Tu as stocké 500 cartons de jus de pomme dans l’arrière-boutique pour 1 000 €. Pourquoi Samir affirme-t-il que ce stock te coûte chaque jour ?',
        choices: [
          'Cet argent immobilisé ne peut pas financer d’autres achats urgents et encombre le local',
          'La valeur marchande du jus baisse automatiquement chaque nuit sur le marché',
          'La mairie prélève une taxe sur chaque bouteille conservée plus de vingt-quatre heures',
          'Les cartons consomment du courant électrique même sans réfrigération',
        ],
        answer: 0,
        explanation: 'Le coût du stock englobe l’argent immobilisé (coût d’opportunité), la surface louée, ainsi que les risques de casse, de vol ou de péremption.',
      },
      {
        q: 'Deux palettes de farine dorment depuis six mois dans la cave humide de la Friche. Quel coût de stock imprévu découvres-tu à l’ouverture ?',
        choices: [
          'Une amende administrative pour stockage prolongé d’aliments',
          'Des sacs moisis et inutilisables qui doivent être jetés à perte sèche',
          'Une augmentation subite de la taxe sur la valeur ajoutée',
          'Une hausse de la valeur nutritionnelle de la farine',
        ],
        answer: 1,
        explanation: 'La dépréciation physique et les avaries constituent une composante majeure et sournoise du coût réel d’un stock dormant.',
      },
      {
        q: 'Pour réduire le coût de stock de ton stand de fournitures scolaires sans risquer la rupture, quelle stratégie adopter ?',
        choices: [
          'Remplir le hangar au maximum dès le mois de mai pour ne plus y penser',
          'Vendre à l’aveugle sans jamais tenir de registre des quantités restantes',
          'Négocier des livraisons hebdomadaires rapides avec un grossiste proche',
          'Emprunter pour louer un second local de stockage à l’autre bout de la ville',
        ],
        answer: 2,
        explanation: 'Accélérer la rotation des stocks réduit les capitaux immobilisés et les surfaces nécessaires tout en garantissant la disponibilité.',
      },
    ],
  },

  {
    conceptId: 'main_invisible',
    questions: [
      {
        q: 'Sur la place des Roses, tu vends du pain frais à un tarif raisonnable sans consigne municipale. Selon Adam Smith, pourquoi la ville est-elle bien nourrie ?',
        choices: [
          'En cherchant ton propre profit, tu es conduit à satisfaire spontanément les besoins réels des habitants',
          'La municipalité régule et impose les quantités précises à chaque artisan chaque matin',
          'Les clients achètent par pure bienveillance solidaire envers ton nouveau commerce',
          'Les fantômes de la Maison du Peuple guident mystérieusement les paniers des passants',
        ],
        answer: 0,
        explanation: 'La « main invisible » illustre comment la recherche de l’intérêt personnel dans un cadre concurrentiel contribue à satisfaire les besoins collectifs.',
      },
      {
        q: 'Lorsque la concurrence pousse les commerçants du quartier à soigner l’accueil et modérer leurs prix, qui en bénéficie d’abord ?',
        choices: [
          'Uniquement les banques qui prêtent aux boutiquiers',
          'Les consommateurs du quartier, qui profitent d’un meilleur service au juste prix',
          'Les transporteurs routiers qui livrent les matières premières',
          'Les inspecteurs fiscaux chargés du contrôle des balances',
        ],
        answer: 1,
        explanation: 'La rivalité pacifique entre vendeurs profite directement aux acheteurs, qui obtiennent des produits de meilleure qualité à des prix maîtrisés.',
      },
      {
        q: 'Dans quelle situation concrète la métaphore de la main invisible échoue-t-elle à organiser harmonieusement le quartier ?',
        choices: [
          'Quand deux maraîchers se disputent les faveurs des clients sur le trottoir',
          'Quand un atelier rejette ses fumées de vernis sur l’école voisine sans payer de dépollution',
          'Quand un épicier décide de baisser le prix de ses bananes mûres en fin d’après-midi',
          'Quand un coursier pédale deux fois plus vite pour livrer davantage de colis',
        ],
        answer: 1,
        explanation: 'Smith reconnaissait que le marché ne résout pas spontanément les pollutions et nuisances (externalités) qui nécessitent des règles collectives.',
      },
    ],
  },

  {
    conceptId: 'plus_value',
    questions: [
      {
        q: 'Ton équipe prépare des paniers gourmands : les ingrédients coûtent 40 € et le lot est vendu 100 €. Selon Marx, d’où viennent les 60 € créés ?',
        choices: [
          'De la valeur ajoutée produite par le travail concret de l’équipe transformant la matière',
          'Du talent naturel du gérant pour la persuasion commerciale et la publicité',
          'De l’intérêt légitime perçu par la banque ayant prêté le fonds de caisse',
          'De la beauté du ruban décoratif imprimé sur l’emballage en carton',
        ],
        answer: 0,
        explanation: 'Pour Marx, la valeur nouvelle provient de la force de travail dépensée par les travailleurs pour métamorphoser des matières en biens finis.',
      },
      {
        q: 'Si tu verses 20 € au total à l’équipe pour confectionner le lot et gardes 40 € de bénéfice net, quelle analyse marxienne s’applique ?',
        choices: [
          'Tu as trop généreusement rémunéré tes équipiers par rapport aux cours du marché',
          'Tu t’appropries la plus-value issue du surtravail accompli par les salariés',
          'Le bénéfice dégagé est insuffisant pour renouveler les tabliers de cuisine',
          'La transaction est nulle car aucun contrat notarié n’a été signé au préalable',
        ],
        answer: 1,
        explanation: 'La plus-value représente la différence entre la valeur créée par le travail et le montant effectif des salaires reversés.',
      },
      {
        q: 'Pour dépasser cette contradiction au sein de ton entreprise à la Friche, quel choix organisationnel privilégier ?',
        choices: [
          'Rallonger la journée de travail de deux heures sans modifier la rémunération',
          'Remplacer les salariés par des machines entièrement automatisées importées',
          'Associer l’équipe aux décisions et redistribuer les excédents sous forme de parts coopératives',
          'Vendre à prix coûtant pour annuler définitivement toute marge comptable',
        ],
        answer: 2,
        explanation: 'Le modèle coopératif démocratise la gouvernance et redistribue la richesse créée à ceux qui réalisent concrètement le travail.',
      },
    ],
  },

  {
    conceptId: 'demande_effective',
    questions: [
      {
        q: 'L’aciérie tourne au ralenti car les habitants redoutent l’avenir et gardent leur argent. Quel diagnostic poserait Keynes ?',
        choices: [
          'Un déficit de demande effective : ménages et entreprises retiennent leurs dépenses par précaution',
          'Une pénurie physique irrémédiable de minerai de fer sous les collines de Val-Ferrand',
          'Un niveau de salaires ouvriers excessif qui étouffe la compétitivité de l’usine',
          'Un excès de zèle des artisans locaux qui fabriquent trop de mobilier d’occasion',
        ],
        answer: 0,
        explanation: 'Keynes montre que l’activité dépend du niveau anticipé des commandes : quand la confiance s’effondre, la thésaurisation paralyse l’économie.',
      },
      {
        q: 'En période de morosité générale à Val-Ferrand, comment la mairie peut-elle enclencher une relance de l’activité locale ?',
        choices: [
          'En augmentant la taxe foncière pour inciter les ménages à travailler davantage',
          'En lançant un grand programme de rénovation thermique des écoles et logements communaux',
          'En ordonnant la fermeture prématurée des marchés pour économiser le courant',
          'En conseillant aux commerçants de licencier pour restaurer leur trésorerie',
        ],
        answer: 1,
        explanation: 'L’investissement public injecte directement des revenus dans le circuit économique, remplissant les carnets de commandes et relançant la machine.',
      },
      {
        q: 'Pourquoi un commerçant hésite-t-il à embaucher un apprenti même si le salaire proposé est très bas ?',
        choices: [
          'Parce qu’il n’observe pas assez de clients franchir le pas de sa porte pour justifier un renfort',
          'Parce que le code du travail interdit de former des apprentis durant les années paires',
          'Parce que les banques bloquent systématiquement les virements bancaires des jeunes',
          'Parce que les apprentis refusent toujours de travailler en atelier le samedi',
        ],
        answer: 0,
        explanation: 'Ce n’est pas le faible coût du travail qui déclenche l’embauche, mais la perspective réelle de débouchés et de ventes en magasin.',
      },
    ],
  },

  {
    conceptId: 'signal_prix',
    questions: [
      {
        q: 'Après un coup de gel dans les vergers de la vallée, le kilo de prunes triple chez Mme Bertin. Quel signal ce prix adresse-t-il aux clients ?',
        choices: [
          'L’épicière cherche à s’enrichir aux dépens des familles du quartier',
          'La prune est devenue rare : il convient de modérer ses achats ou de choisir un autre fruit',
          'La municipalité encourage tout le monde à confectionner des confitures d’urgence',
          'Le climat va subitement se réchauffer au cours des prochains jours',
        ],
        answer: 1,
        explanation: 'Pour Hayek, le système de prix transmet une information condensée sur la rareté relative et incite chacun à ajuster son comportement sans plan central.',
      },
      {
        q: 'En constatant que le tarif des réparations de sacoches en cuir s’envole en ville, quelle initiative prend Karim ?',
        choices: [
          'Il réoriente une partie de son atelier pour répondre à cette demande solvable et utile',
          'Il ferme son garage pour protester contre la hausse du coût de la vie',
          'Il demande au commissariat de bloquer le prix des aiguilles et du fil de couture',
          'Il abandonne ses machines pour se lancer dans la culture maraîchère',
        ],
        answer: 0,
        explanation: 'La hausse d’un prix indique aux producteurs où leurs compétences et leurs efforts sont les plus demandés et valorisés par la société.',
      },
      {
        q: 'Que se passe-t-il si la mairie bloque autoritairement le prix du stère de bois à 1 € en plein hiver rigoureux ?',
        choices: [
          'Les stocks sont dévalisés en une matinée, provoquant pénuries, files d’attente et marché noir',
          'Les exploitants forestiers coupent immédiatement deux fois plus d’arbres avec joie',
          'Les propriétaires isolent spontanément leurs combles sans aucune subvention',
          'Le bois devient soudainement une ressource inépuisable et gratuite pour tous',
        ],
        answer: 0,
        explanation: 'Bloquer artificiellement les prix brouille le signal de rareté : la demande explose tandis que l’offre se décourage, menant tout droit à la pénurie.',
      },
    ],
  },

  {
    conceptId: 'levier',
    questions: [
      {
        q: 'Tu empruntes 1 000 € à 8 % d’intérêt annuel pour agrandir ton stand. L’activité dégage 5 % de rentabilité. Que constates-tu sur tes comptes ?',
        choices: [
          'Tu perds de l’argent sur la partie financée à crédit car le coût du prêt dépasse le rendement de l’affaire',
          'Tu réalises un profit spectaculaire de 13 % en combinant les deux pourcentages',
          'La rentabilité reste parfaitement neutre puisque l’argent a été dépensé dans du matériel',
          'L’agence bancaire prend en charge les 3 % d’écart sur ses fonds propres',
        ],
        answer: 0,
        explanation: 'L’effet de levier joue à l’envers : s’endetter à un taux supérieur à la rentabilité opérationnelle détruit la valeur et creuse les pertes.',
      },
      {
        q: 'Dans quelle configuration l’effet de levier bancaire devient-il un formidable propulseur pour ton entreprise de livraison ?',
        choices: [
          'Quand les dettes représentent dix fois le chiffre d’affaires annuel prévisionnel',
          'Quand l’emprunt finance un triporteur dégageant 18 % de rentabilité face à un crédit contracté à 4 %',
          'Quand les taux d’intérêt bancaires grimpent plus rapidement que les recettes journalières',
          'Lorsque l’activité fonctionne à perte mais que la banque accepte de refinancer le découvert',
        ],
        answer: 1,
        explanation: 'Le levier est positif lorsque le rendement de l’investissement surpasse le coût du crédit, démultipliant le gain net pour l’entreprise.',
      },
    {
      q: 'Pourquoi Friedrich Hayek invite-t-il les jeunes entrepreneurs à la prudence face à un endettement excessif ?',
      choices: [
        'Parce que le crédit bancaire est formellement interdit aux structures de moins de cinq salariés',
        'Parce que les banquiers disposent du droit de fixer les prix de vente affichés dans la boutique',
        'Parce que les remboursements d’emprunt tombent chaque mois avec certitude, même si les clients désertent',
        'Parce que la dette fait baisser la réputation de l’atelier auprès du voisinage',
      ],
      answer: 2,
      explanation: 'La dette est une charge fixe impitoyable : elle exige d’être remboursée quoi qu’il arrive, sans s’adapter aux fluctuations de l’activité.',
    },
    ],
  },

  {
    conceptId: 'organisation_scientifique',
    questions: [
      {
        q: 'Pour emballer les barquettes de fruits, tu chronomètres chaque geste de l’équipe et supprimes tout déplacement inutile. Quelle méthode appliques-tu ?',
        choices: [
          'L’organisation scientifique du travail (taylorisme), visant à maximiser la productivité gestuelle',
          'L’autogestion ouvrière libre de l’atelier de conditionnement',
          'La théorie des conventions appliquée au tri sélectif des cageots',
          'Le management bienveillant par objectifs concertés et horaires libres',
        ],
        answer: 0,
        explanation: 'Taylor préconisait l’analyse, la décomposition et le chronométrage précis de chaque geste pour éradiquer les temps morts.',
      },
      {
        q: 'Après trois semaines de cadences intensives au chronomètre à la plonge du café associatif, quel contrecoup découvres-tu ?',
        choices: [
          'Une hausse spectaculaire de la créativité et de la bonne humeur de l’équipe',
          'Une fatigue extrême, une démotivation palpable et une multiplication des verres brisés',
          'Une disparition totale de l’usure des torchons et des produits nettoyants',
          'Une réduction miraculeuse de la facture d’eau chaude du local associatif',
        ],
        answer: 1,
        explanation: 'Pousser le taylorisme à l’excès provoque usure physique, lassitude morale et dégradation de la qualité du travail rendu.',
      },
      {
        q: 'Quelle rupture fondamentale distingue l’atelier taylorien de l’atelier artisanal traditionnel de la Friche ?',
        choices: [
          'L’interdiction formelle d’utiliser des tournevis et des clés à molette métalliques',
          'La gratuité obligatoire des prestations pour tous les habitants de la commune',
          'La séparation stricte entre ceux qui conçoivent les gestes et ceux qui les exécutent docilement',
          'L’obligation de travailler exclusivement en extérieur sans aucun abri couvert',
        ],
        answer: 2,
        explanation: 'Le taylorisme dépossède l’artisan de son autonomie technique au profit du bureau des méthodes qui prescrit la cadence.',
      },
    ],
  },

  {
    conceptId: 'souffrance_travail',
    questions: [
      {
        q: 'Un coursier rentre épuisé et taciturne chaque soir car l’application de tournée lui impose des temps intenables. Que rappelle Christophe Dejours ?',
        choices: [
          'Que le travail réel déborde toujours la consigne et que nier l’effort psychique use gravement la santé',
          'Que le coursier a simplement besoin d’une bicyclette équipée d’un dérailleur plus moderne',
          'Que les algorithmes de tournée connaissent parfaitement les limites du corps humain',
          'Que la pluie et le vent sont les uniques responsables de la lassitude des coursiers',
        ],
        answer: 0,
        explanation: 'Dejours montre que la souffrance naît de l’écart entre le travail prescrit et les épreuves réelles du terrain, surtout quand l’effort n’est pas reconnu.',
      },
      {
        q: 'Pour désamorcer la souffrance naissante dans ton atelier de réparation de vélos, quelle démarche managériale s’avère la plus constructive ?',
        choices: [
          'Installer des caméras de contrôle au-dessus de chaque établi pour vérifier les temps d’arrêt',
          'Ouvrir un espace de dialogue régulier où l’équipe peut débattre des pannes réelles et ajuster les cadences',
          'Accélérer la cadence quotidienne pour éviter que les ouvriers ne s’interrogent sur leur métier',
          'Supprimer les temps de pause pour terminer la journée une demi-heure plus tôt',
        ],
        answer: 1,
        explanation: 'Offrir un espace collectif pour parler du travail réel restaure le sens du métier, la coopération et la reconnaissance mutuelle.',
      },
      {
        q: 'Quel coût invisible une entreprise supporte-t-elle quand elle ignore le surmenage et le mal-être de ses salariés ?',
        choices: [
          'Une baisse automatique des cotisations sociales versées aux organismes publics',
          'Une hausse inattendue de la fidélité de ses clients les plus exigeants',
          'Des arrêts maladie fréquents, un turn-over coûteux et la perte d’un précieux savoir-faire',
          'La gratuité complète des fournitures d’atelier livrées par les grossistes',
        ],
        answer: 2,
        explanation: 'La souffrance au travail engendre inévitablement absentéisme, démissions et dégradation du savoir-faire accumulé.',
      },
    ],
  },

  {
    conceptId: 'avantage_comparatif',
    questions: [
      {
        q: 'Noah répare un vélo en 1h et cuit 10 gâteaux en 1h. Toi, tu répares un vélo en 2h et cuis 40 gâteaux en 1h. Que préconise David Ricardo ?',
        choices: [
          'Noah se focalise sur les vélos et toi sur les gâteaux, puis vous échangez vos productions',
          'Noah doit tout faire tout seul puisqu’il est deux fois plus rapide sur la mécanique',
          'Vous arrêtez complètement la confection de gâteaux pour ne réparer que des bicyclettes',
          'Vous travaillez chacun dans votre coin sans jamais échanger ni coopérer',
        ],
        answer: 0,
        explanation: 'Même si Noah est meilleur en vélo dans l’absolu, tu as un avantage comparatif immense en pâtisserie : vous gagnez tous les deux à vous spécialiser.',
      },
      {
        q: 'Pourquoi la ville de Val-Ferrand gagne-t-elle à commercer avec le plateau agricole voisin plutôt que de vouloir cultiver tout son blé sur les trottoirs ?',
        choices: [
          'Parce que le plateau dispose d’un avantage comparatif sur les céréales, laissant la ville valoriser son industrie et ses services',
          'Parce que les lois régionales interdisent de posséder des graines de blé dans les limites urbaines',
          'Parce que le commerce avec l’extérieur appauvrit systématiquement les deux partenaires économiques',
          'Parce que les habitants de la ville refusent par principe de consommer du pain fabriqué localement',
        ],
        answer: 0,
        explanation: 'L’échange fondé sur les coûts d’opportunité respectifs accroît la disponibilité globale des biens pour chaque collectivité.',
      },
      {
        q: 'Quel écueil guette une région qui pousse la logique des avantages comparatifs jusqu’à une monoculture intégrale ?',
        choices: [
          'Une vulnérabilité extrême au moindre choc de marché ou retournement climatique sur son produit unique',
          'Une abondance excessive de métiers variés enrichissant le savoir-faire local',
          'L’obligation légale de fermer ses frontières à toute marchandise étrangère',
          'Une disparition totale de la monnaie au profit d’un troc obligatoire',
        ],
        answer: 0,
        explanation: 'Une hyperspécialisation détruit la résilience : si le marché s’effondre, toute la région se retrouve sans alternative économique.',
      },
    ],
  },

  {
    conceptId: 'donut',
    questions: [
      {
        q: 'Kate Raworth compare une économie prospère à un « donut ». Quels sont les deux cercles définissant cet espace équilibré ?',
        choices: [
          'Le cours de l’action en bourse et le montant moyen des salaires des cadres dirigeants',
          'Un plancher social pour les besoins humains fondamentaux et un plafond écologique à ne pas dépasser',
          'Le total des impôts perçus par l’État et le volume d’emprunt souscrit sur les marchés',
          'Le coût du transport par péniche et le prix de gros du sac de farine au moulin',
        ],
        answer: 1,
        explanation: 'La boussole du Donut vise à satisfaire les droits sociaux élémentaires de chacun sans détruire les limites biophysiques de la planète.',
      },
      {
        q: 'En voulant doubler la production de jus de pomme de ton étal, tu assèches la nappe phréatique du verger municipal. Quel seuil franchis-tu ?',
        choices: [
          'Le plancher social de rémunération décente des cueilleurs de fruits',
          'Le plafond écologique : ton exploitation dépasse la capacité de régénération de la ressource en eau',
          'Le seuil de rentabilité bancaire exigé par les organismes prêteurs',
          'L’équilibre des comptes publics du conseil départemental',
        ],
        answer: 1,
        explanation: 'Transgresser le plafond écologique signifie dégrader l’eau, le sol ou le climat au nom d’une croissance aveugle et insoutenable.',
      },
      {
        q: 'Comment ton atelier de mécanique à la Friche applique-t-il concrètement la pensée du Donut au quotidien ?',
        choices: [
          'En important des pièces détachées jetables produites à bas coût à l’autre bout du monde',
          'En rejetant les huiles de vidange usagées dans les égouts pluviaux de la rue',
          'En garantissant un revenu digne à ses mécaniciens tout en recyclant de vieux composants sauvés de la benne',
          'En refusant d’accueillir les clients qui ne possèdent pas de véhicule motorisé',
        ],
        answer: 2,
        explanation: 'Assurer la dignité sociale des travailleurs tout en préservant les ressources matérielles par l’économie circulaire concrétise l’espace du Donut.',
      },
    ],
  },

  {
    conceptId: 'destruction_creatrice',
    questions: [
      {
        q: 'L’essor des triporteurs électriques à Val-Ferrand précipite le déclin des vieux livreurs en fourgon diesel polluant. Quel concept schumpétérien s’illustre ?',
        choices: [
          'Une cartellisation illégale du transport de marchandises dans l’agglomération',
          'La destruction créatrice : une vague d’innovation remplace les procédés devenus obsolètes',
          'Une faillite généralisée et irréversible de l’ensemble du secteur marchand',
          'Une nationalisation autoritaire des flottes de livraison par les services de l’État',
        ],
        answer: 1,
        explanation: 'Schumpeter explique que l’innovation industrielle révolutionne sans cesse les structures économiques de l’intérieur en éliminant les anciennes.',
      },
      {
        q: 'Qui subit de plein fouet les conséquences négatives d’une phase de destruction créatrice dans un quartier industriel ?',
        choices: [
          'Les firmes traditionnelles incapables d’évoluer et leurs salariés dont les compétences ne sont plus adaptées',
          'Uniquement les jeunes entrepreneurs qui viennent de breveter de nouvelles solutions',
          'Les consommateurs qui profitent d’équipements plus modernes et moins polluants',
          'Les banques qui prêtent aux entreprises les plus novatrices du territoire',
        ],
        answer: 0,
        explanation: 'Le progrès technique crée de nouveaux débouchés mais détruit des emplois et des entreprises avant que la transition ne s’opère.',
      },
      {
        q: 'Pour surmonter une vague de destruction créatrice menée par une grande enseigne en ligne, comment le commerce de proximité doit-il réagir ?',
        choices: [
          'Continuer à l’identique en espérant que le concurrent numérique ferme spontanément',
          'Réclamer l’interdiction formelle de l’électricité et des tablettes dans toute la commune',
          'Innover sur le lien humain, le conseil sur mesure et la vente de produits locaux introuvables sur le web',
          'Baisser la qualité de ses produits tout en augmentant ses tarifs de vente',
        ],
        answer: 2,
        explanation: 'Pour survivre aux mutations technologiques, les acteurs en place doivent se repositionner sur des propositions de valeur uniques et incarnées.',
      },
    ],
  },

  {
    conceptId: 'communs',
    questions: [
      {
        q: 'Les maraîchers de la Cité des Roses partagent une pompe d’arrosage commune. Que préconise Elinor Ostrom pour éviter que l’eau ne tarisse ?',
        choices: [
          'Vendre la pompe à une multinationale privée qui installera un monnayeur payant',
          'Des règles d’accès co-construites, adaptées au terrain et surveillées par les usagers eux-mêmes',
          'Confier la gestion exclusive de l’arrosage à un haut fonctionnaire siégeant à la capitale',
          'Laisser chacun pomper à volonté jour et nuit jusqu’à épuisement complet de la nappe',
        ],
        answer: 1,
        explanation: 'Ostrom a prouvé que les communautés d’usagers peuvent gérer durablement une ressource partagée grâce à des institutions locales efficaces.',
      },
      {
        q: 'Quelle condition clé mise en lumière par Ostrom empêche la boîte à outils partagée de la Friche d’être vidée par des resquilleurs ?',
        choices: [
          'Des règles claires d’adhésion, une surveillance mutuelle et des sanctions graduées pour les abus',
          'L’installation de caméras à reconnaissance faciale reliées au commissariat central',
          'L’interdiction absolue d’emprunter des outils plus de cinq minutes d’affilée',
          'L’attente passive que des bienfaiteurs anonymes rachètent les tournevis disparus',
        ],
        answer: 0,
        explanation: 'La clarté des limites du groupe, le contrôle par les pairs et des sanctions proportionnées protègent la ressource sans bureaucratie écrasante.',
      },
      {
        q: 'Pourquoi les recherches d’Elinor Ostrom réfutent-elles la fatalité de la « tragédie des communs » formulée par Garrett Hardin ?',
        choices: [
          'Parce que les ressources terrestres sont en réalité inépuisables et sans limites',
          'Parce que les humains sont toujours naturellement généreux et désintéressés en affaires',
          'Parce qu’avec de la communication et des normes réciproques, les gens coopèrent plutôt que de piller',
          'Parce que le système des prix marchands résout automatiquement toutes les pénuries',
        ],
        answer: 2,
        explanation: 'Hardin postulait des individus isolés sans dialogue ; Ostrom a démontré empiriquement la capacité humaine à s’auto-organiser avec succès.',
      },
    ],
  },

  {
    conceptId: 'cout_fixe_variable',
    questions: [
      {
        q: 'Lequel de ces postes représente un coût fixe pour ton stand de crêpes sur la place du marché ?',
        choices: [
          'La redevance mensuelle d’emplacement versée à la mairie pour occuper le pavé',
          'La quantité de farine et de lait achetée le matin même pour la pâte',
          'Le sucre et la pâte à tartiner étalés au fur et à mesure des commandes',
          'Les serviettes en papier distribuées aux clients gourmands',
        ],
        answer: 0,
        explanation: 'Le coût fixe d’occupation du sol doit être payé intégralement, même si une averse empêche de vendre la moindre crêpe.',
      },
      {
        q: 'Un samedi d’orage glacial vide la place et aucun client ne se présente à ton stand. Quels coûts as-tu tout de même supportés ?',
        choices: [
          'Uniquement tes coûts variables de matières premières consommées',
          'Tes coûts fixes engagés pour la journée (location de stand, assurance, abonnement électrique)',
          'Strictement aucune dépense grâce au mauvais temps constaté par huissier',
          'Le double de tes dépenses habituelles d’ingrédients de cuisine',
        ],
        answer: 1,
        explanation: 'Les coûts variables s’annulent en l’absence de production, mais les coûts fixes continuent d’être prélevés sans répit.',
      },
      {
        q: 'Pourquoi un loyer d’atelier disproportionné fragilise-t-il dangereusement une entreprise qui démarre ?',
        choices: [
          'Il repousse très loin le seuil de rentabilité : il faut réaliser un volume de ventes immense avant de dégager un bénéfice',
          'Il incite les fournisseurs de confiance à refuser de livrer des pièces mécaniques',
          'Il oblige le gérant à embaucher immédiatement trois stagiaires supplémentaires',
          'Il fait baisser la réputation des produits auprès des clients réguliers',
        ],
        answer: 0,
        explanation: 'Des coûts fixes écrasants augmentent le point mort : l’entreprise doit vendre des volumes colossaux simplement pour ne pas perdre d’argent.',
      },
    ],
  },

  {
    conceptId: 'marge',
    questions: [
      {
        q: 'Tu achètes une canette de jus bio 0,40 € au grossiste des docks et la vends 1,00 € au stand. Quelle est ta marge commerciale unitaire ?',
        choices: ['0,60 €', '1,40 €', '0,40 €', '0,10 €'],
        answer: 0,
        explanation: 'Marge brute unitaire = prix de vente (1,00 €) − coût d’achat (0,40 €) = 0,60 €.',
      },
      {
        q: 'Tu baisses ton prix à 0,50 € la canette pour attirer du monde et en vends deux fois plus qu’avant. Que devient ton gain total ?',
        choices: [
          'Tu gagnes deux fois plus d’argent grâce à l’affluence record',
          'Tu gagnes beaucoup moins : 2 ventes à 0,10 € de marge = 0,20 €, contre 0,60 € pour une seule canette vendue à 1,00 €',
          'Ton gain reste parfaitement identique puisque le volume compense la remise',
          'Ta trésorerie triple car les pièces de monnaie circulent plus vite',
        ],
        answer: 1,
        explanation: 'Multiplier le volume ne suffit pas si la marge est laminée : vendre deux fois plus à 0,10 € de marge rapporte trois fois moins qu’une seule vente à 0,60 €.',
      },
      {
        q: 'L’atelier de vélos ne désemplit pas de la semaine, pourtant le solde bancaire plonge dans le rouge. Quelle en est la raison la plus probable ?',
        choices: [
          'Des tarifs horaires de réparation trop bas qui ne dégagent pas une marge suffisante pour couvrir les charges fixes',
          'Les mécaniciens passent trop de temps à écouter la radio locale pendant le travail',
          'Le local est situé trop près du canal et subit l’humidité automnale',
          'Les clients paient trop souvent par carte bancaire au lieu de liquide',
        ],
        answer: 0,
        explanation: 'L’activité apparente ne garantit pas la viabilité : sans marge suffisante sur chaque intervention, le chiffre d’affaires ne couvre pas les coûts de structure.',
      },
    ],
  },

  {
    conceptId: 'effet_reseau',
    questions: [
      {
        q: 'Pourquoi la plateforme locale de prêt d’outils entre voisins devient-elle bien plus précieuse avec 500 membres qu’avec 15 ?',
        choices: [
          'Chaque nouvel inscrit apporte son matériel et augmente les chances de trouver l’outil rare pour tous les autres',
          'Les serveurs informatiques fonctionnent plus rapidement quand ils reçoivent beaucoup de connexions',
          'L’abonnement à l’électricité de l’hébergeur baisse automatiquement à chaque palier de cent membres',
          'Le maire accorde une médaille civique dès que le cap des cinquante profils est franchi',
        ],
        answer: 0,
        explanation: 'L’effet de réseau signifie que l’utilité d’un service grandit avec le nombre d’utilisateurs qui s’y connectent et l’enrichissent.',
      },
      {
        q: 'Une publication présentant ton stand de goûters fait le tour de tous les groupes d’élèves du collège. Quel phénomène observes-tu ?',
        choices: [
          'Une sélection adverse sur les biscuits au chocolat vendus à la récréation',
          'Un effet de réseau viral : chaque partage expose de nouveaux contacts qui amplifient à leur tour la fréquentation',
          'Une capture réglementaire orchestrée par les délégués de classe du collège',
          'Une baisse automatique des coûts de cuisson des gâteaux à la maison',
        ],
        answer: 1,
        explanation: 'La valeur d’une information et la portée d’un réseau croissent de façon exponentielle lorsque chaque participant devient relais.',
      },
      {
        q: 'Quel piège de marché redoutable découle d’un effet de réseau hégémonique sur une application numérique dominante ?',
        choices: [
          'L’émergence du gagnant qui rafle tout (winner-takes-all), créant un monopole presque impossible à concurrencer',
          'La gratuité obligatoire de tous les biens physiques échangés sur le territoire',
          'Une fuite immédiate de tous les utilisateurs vers les services postaux traditionnels',
          'L’interdiction définitive de créer de nouveaux comptes d’utilisateurs en ville',
        ],
        answer: 0,
        explanation: 'Les réseaux très puissants enferment les utilisateurs dans leur écosystème, dressant des barrières d’entrée quasi infranchissables pour les rivaux.',
      },
    ],
  },

  {
    conceptId: 'franchise',
    questions: [
      {
        q: 'Ton concept de triporteur à gaufres cartonne à Val-Ferrand. Deux amis de Néo-Baie veulent ouvrir le même en payant une redevance. Quel contrat signer ?',
        choices: [
          'Un contrat de franchise : tu transmets ton enseigne, tes recettes et ta méthode contre un pourcentage sur leur chiffre d’affaires',
          'Un contrat d’intérim classique en les rémunérant au pourboire',
          'Une donation bénévole sans aucun engagement contractuel ni réciprocité',
          'Une sous-traitance industrielle de farine sans aucun contrôle de marque',
        ],
        answer: 0,
        explanation: 'La franchise permet à un réseau de s’étendre rapidement en dupliquant un concept éprouvé tout en déléguant le financement des points de vente.',
      },
      {
        q: 'En devenant franchisé d’une grande marque de torréfaction de café, quel compromis fondamental dois-tu accepter au quotidien ?',
        choices: [
          'Profiter d’une marque reconnue dès le premier jour mais renoncer à choisir librement tes mélanges et ta décoration',
          'Fixer les prix de vente en toute indépendance sans rendre aucun compte à la maison mère',
          'Ne verser aucune commission sur les ventes réalisées dans la boutique',
          'Changer de nom d’enseigne chaque trimestre selon ton humeur',
        ],
        answer: 0,
        explanation: 'Le franchisé bénéficie de la notoriété et de la logistique du réseau, mais doit se plier aux normes strictes du franchiseur.',
      },
      {
        q: 'Quel risque collectif menace l’ensemble d’un réseau de franchise si un membre peu rigoureux sert des produits avariés ?',
        choices: [
          'L’image de marque globale est entachée dans l’esprit du public, pénalisant tous les autres commerçants du réseau',
          'Le franchiseur est contraint de doubler le prix de vente de tous ses articles',
          'La municipalité saisit immédiatement le compte bancaire des concurrents',
          'Les clients affluent deux fois plus nombreux pour soutenir le point de vente défaillant',
        ],
        answer: 0,
        explanation: 'La réputation d’une franchise est partagée : la défaillance d’un seul point de vente dégrade la confiance des clients envers tous les autres.',
      },
    ],
  },

  {
    conceptId: 'faillite',
    questions: [
      {
        q: 'L’ancienne fabrique de bobines en plastique perd de l’argent depuis des mois et dépose son bilan. Quelle fonction Hayek attribue-t-il à la faillite ?',
        choices: [
          'Elle sanctionne une activité non viable pour libérer locaux, machines et travail au profit d’usages utiles et demandés',
          'Elle détruit pour toujours toute forme de richesse dans le quartier de la gare',
          'Elle permet aux créanciers de confisquer gratuitement les maisons des ouvriers',
          'Elle prouve que l’industrie manufacturière ne peut jamais être rentable',
        ],
        answer: 0,
        explanation: 'Pour Hayek, la faillite est le mécanisme d’assainissement qui réoriente les capitaux et compétences loin des projets mal adaptés aux besoins réels.',
      },
      {
        q: 'Si la commune renfloue indéfiniment à grands frais un atelier obsolète qui n’a plus aucun client, quel dysfonctionnement entretient-elle ?',
        choices: [
          'Une société « zombie » qui draine l’argent public au détriment des entreprises innovantes et d’avenir',
          'Une amélioration fulgurante de la balance commerciale de la ville',
          'Une hausse spontanée de la productivité de tous les autres artisans du quartier',
          'Une baisse générale des impôts locaux pour l’ensemble des contribuables',
        ],
        answer: 0,
        explanation: 'Maintenir en perfusion des structures condamnées stérilise les ressources publiques et empêche l’émergence de nouvelles activités dynamiques.',
      },
      {
        q: 'Pour un jeune créateur de Val-Ferrand dont le premier projet d’étal a périclité, quel enseignement économique tirer de l’épreuve ?',
        choices: [
          'Identifier les causes de l’échec, assainir la dette et réinvestir les compétences acquises dans un projet plus solide',
          'Quitter clandestinement la région pour ne plus jamais parler à ses voisins',
          'Accuser l’ensemble des habitants d’ingratitude commerciale systématique',
          'Attendre sans rien entreprendre qu’une subvention miraculeuse règle le passé',
        ],
        answer: 0,
        explanation: 'L’échec est une étape d’apprentissage précieuse : il forge l’expérience indispensable pour réussir les initiatives suivantes.',
      },
    ],
  },

  {
    conceptId: 'capital_social',
    questions: [
      {
        q: 'Grâce aux amitiés ouvrières de son grand-père Lucien, Camille trouve un local d’atelier à loyer modéré à la Friche. Quel capital mobilise-t-elle ?',
        choices: [
          'Le capital financier emprunté sur les marchés obligataires internationaux',
          'Le capital social : un réseau de relations de confiance qui ouvre des portes inaccessibles par le seul argent',
          'Le capital technologique constitué de brevets déposés à l’INPI',
          'Une aide européenne d’urgence allouée aux zones portuaires',
        ],
        answer: 1,
        explanation: 'Bourdieu définit le capital social comme l’ensemble des ressources réelles liées à la possession d’un réseau durable de connaissances et d’interconnaissances.',
      },
      {
        q: 'Alexis Rameau obtient un stage de direction chez HyperVal grâce aux relations de golf de son père. Quelle réalité sociologique cela illustre-t-il ?',
        choices: [
          'La reproduction sociale par le jeu des réseaux d’influence et des privilèges relationnels fermés',
          'Le triomphe du mérite républicain fondé sur les seules notes obtenues au collège',
          'L’avantage comparatif naturel du stagiaire sur les logiciels de tableur',
          'L’application transparente des règles de concurrence pure et parfaite',
        ],
        answer: 0,
        explanation: 'Le capital social des classes favorisées fonctionne comme un multiplicateur d’opportunités qui entretient les hiérarchies existantes.',
      },
      {
        q: 'Comment les habitants des quartiers populaires de Val-Ferrand bâtissent-ils leur propre capital social d’émancipation ?',
        choices: [
          'En achetant des actions dans des fonds d’investissement spéculatifs',
          'En refusant systématiquement de dire bonjour à leurs voisins de palier',
          'En tissant des réseaux d’entraide, des coopératives de quartier et des banques de temps solidaire',
          'En déléguant toute leur vie relationnelle à des algorithmes de rencontres payants',
        ],
        answer: 2,
        explanation: 'La solidarité collective, les caisses de secours mutuel et la vie associative constituent le puissant capital social des classes laborieuses.',
      },
    ],
  },

  // =========================================================================
  // LES 12 CONCEPTS AVANCÉS DU SOMMET (AG-2 Phase 3)
  // =========================================================================

  {
    conceptId: 'monopole',
    questions: [
      {
        q: 'Le Drive HyperVal a absorbé tous les petits commerces de nuit et reste le seul à pouvoir livrer le soir. Que peut-il faire de ses tarifs ?',
        choices: [
          'Il doit obligatoirement diviser ses prix par deux pour attirer de nouveaux clients',
          'Il se trouve en situation de monopole et peut relever ses prix sans craindre la désertion des clients captifs',
          'Il ne peut rien changer car les clients iront immédiatement acheter ailleurs dans la rue',
          'Il doit redistribuer la totalité de ses profits aux associations du quartier',
        ],
        answer: 1,
        explanation: 'Un vendeur en situation de monopole contrôle l’offre et peut fixer ses prix au-dessus du niveau concurrentiel sans craindre de rivaux.',
      },
      {
        q: 'Pourquoi Adam Smith fustigeait-il le monopole comme « le grand ennemi de la bonne gestion » ?',
        choices: [
          'Parce que le monopoleur travaille trop d’heures d’affilée et s’épuise à la tâche',
          'Parce que sans la piqûre de la concurrence, le monopoleur devient inefficace, dégrade le service et taxe le public',
          'Parce que les monopoles sont contraints par la coutume de faire des dons anonymes',
          'Parce que les salariés des monopoles refusent systématiquement de toucher un salaire',
        ],
        answer: 1,
        explanation: 'À l’abri de la concurrence, le monopoleur n’est plus incité à innover ni à surveiller ses coûts, ce qui pénalise toute l’économie.',
      },
      {
        q: 'Quel instrument juridique permet d’empêcher une grande plateforme d’écraser tous les indépendants de Val-Ferrand ?',
        choices: [
          'Le droit de la concurrence et les lois antitrust interdisant les abus de position dominante et les rachats prédateurs',
          'L’interdiction formelle de créer la moindre entreprise commerciale en ville',
          'Une exemption d’impôts accordée exclusivement à l’acteur le plus puissant',
          'La suppression immédiate du tribunal de commerce de l’agglomération',
        ],
        answer: 0,
        explanation: 'Les lois antitrust et les autorités de régulation protègent la concurrence en sanctionnant les abus de position dominante.',
      },
    ],
  },

  {
    conceptId: 'oligopole',
    questions: [
      {
        q: 'Trois meuniers régionaux fournissent toute la farine de la vallée et affichent le même tarif au centime près. Dans quelle structure de marché évoluent les boulangers ?',
        choices: [
          'Une concurrence pure et parfaite réunissant des milliers de petits moulins indépendants',
          'Un monopole public administré directement par les agents de la préfecture',
          'Un oligopole : une poignée de gros acteurs dominent l’offre et surveillent leurs comportements mutuels',
          'Une économie villageoise de troc sans monnaie ni fixation de prix',
        ],
        answer: 2,
        explanation: 'En situation d’oligopole, quelques acteurs majeurs dominent le marché ; leurs décisions de prix et de quantités sont fortement interdépendantes.',
      },
      {
        q: 'Pourquoi les deux grands transporteurs fluviaux de la vallée hésitent-ils à déclencher une guerre des prix agressive ?',
        choices: [
          'Parce qu’une guerre des prix détruirait leurs marges respectives, alors qu’un statu quo tacite garantit des bénéfices confortables',
          'Parce que la loi fluviale leur interdit formellement de transporter du grain la semaine',
          'Parce que les mariniers ne savent pas calculer le montant de leurs remises commerciales',
          'Parce que les clients refusent par principe les baisses de tarifs sur les péniches',
        ],
        answer: 0,
        explanation: 'Le dilemme de l’oligopole incite souvent à la retenue ou à l’entente tacite : casser les prix déclenche des représailles ruineuses pour tous.',
      },
      {
        q: 'Quel apport théorique majeur Antoine-Augustin Cournot a-t-il apporté à la compréhension de l’oligopole ?',
        choices: [
          'Il a démontré que les entreprises ajustent leurs volumes en anticipant la réaction de leurs rivales, fixant un équilibre stable',
          'Il a prouvé que tous les prix finissent par tomber à zéro sur les marchés ouverts',
          'Il a affirmé que les transports par voie d’eau étaient obsolètes face au chemin de fer',
          'Il a recommandé de confier la gestion des banques uniquement aux artisans du bois',
        ],
        answer: 0,
        explanation: 'Le modèle de Cournot montre comment les firmes oligopolistiques déterminent leurs quantités en tenant compte des stratégies probables de leurs rivales.',
      },
    ],
  },

  {
    conceptId: 'concurrence_deloyale',
    questions: [
      {
        q: 'Un rival du centre distribue des tracts anonymes prétendant que tes gâteaux contiennent des produits périmés. Comment qualifier cette manœuvre ?',
        choices: [
          'Une campagne de marketing particulièrement habile et autorisée par la coutume',
          'Un acte de concurrence déloyale par dénigrement caractérisé visant à capter ta clientèle par la calomnie',
          'Un exercice légitime de la critique gastronomique protégée par la liberté de parole',
          'Une saine stimulation de l’esprit d’entreprise approuvée par les chambres consulaires',
        ],
        answer: 1,
        explanation: 'Le dénigrement commercial constitue une faute de concurrence déloyale punie par la loi pour protéger la loyauté des échanges.',
      },
      {
        q: 'Une boutique copie fidèlement la devanture, les couleurs, le logo et les emballages de ton atelier de réparation. Quelle faute commet-elle ?',
        choices: [
          'Le parasitisme et la création d’une confusion frauduleuse dans l’esprit des clients du quartier',
          'Un bel hommage rendu à la qualité de tes créations graphiques',
          'Une mesure d’économie d’échelle sur les frais d’impression publicitaire',
          'Une innovation incrémentale encouragée par les théoriciens de la Friche',
        ],
        answer: 0,
        explanation: 'Imiter les signes distinctifs d’un concurrent pour entretenir la confusion constitue un comportement déloyal et parasitaire.',
      },
      {
        q: 'Pourquoi Karl Polanyi insistait-il sur la nécessité de ré-encastrer le marché dans des normes juridiques et morales strictes ?',
        choices: [
          'Parce que sans régulation morale, la déloyauté et la tromperie détruisent le tissu de confiance indispensable aux affaires',
          'Parce que les tribunaux municipaux ont besoin de procès réguliers pour payer leurs greffiers',
          'Parce que les commerçants refusent par principe de payer leurs impôts sans gendarmes',
          'Parce que les clients ne savent pas lire les étiquettes de composition des produits',
        ],
        answer: 0,
        explanation: 'Pour Polanyi, l’économie ne peut être disjointe de la société : des règles éthiques doivent brider la cupidité pour préserver le lien social.',
      },
    ],
  },

  {
    conceptId: 'capture_reglementaire',
    questions: [
      {
        q: 'Les gros transporteurs routiers obtiennent de la préfecture un certificat payant complexe imposé aux triporteurs à vélo. Quel phénomène George Stigler décrit-il ?',
        choices: [
          'Une mesure désintéressée et purement bienveillante pour la santé des cyclistes',
          'La capture réglementaire : les acteurs en place influencent la règle pour ériger des barrières et bloquer les nouveaux entrants',
          'Une application rigoureuse de la doctrine coopérative de la Maison du Peuple',
          'Une décision démocratique adoptée à l’unanimité par les usagers des pistes cyclables',
        ],
        answer: 1,
        explanation: 'La capture réglementaire se produit lorsqu’une agence publique censée agir pour le bien commun est instrumentalisée par le lobby qu’elle devait réguler.',
      },
      {
        q: 'Pourquoi les jeunes créateurs d’entreprise de Val-Ferrand ont-ils du mal à riposter face aux manœuvres de capture réglementaire ?',
        choices: [
          'Parce qu’ils manquent de juristes et de moyens de lobbying face aux fédérations industrielles bien implantées',
          'Parce que le code de commerce leur interdit d’adresser des courriers aux élus locaux',
          'Parce qu’ils ne paient aucune taxe locale dans les communes de l’agglomération',
          'Parce que leurs outils de travail sont tous récupérés dans des déchetteries',
        ],
        answer: 0,
        explanation: 'L’asymétrie d’influence permet aux groupes établis de façonner les normes techniques et administratives à leur avantage exclusif.',
      },
      {
        q: 'Quel rempart démocratique permet de déjouer la capture des commissions d’aménagement commercial par les grandes surfaces ?',
        choices: [
          'Confier tous les permis de construire à un promoteur unique sans aucune enquête publique',
          'La transparence totale des réunions, l’accès public aux dossiers et la consultation des collectifs d’artisans et d’habitants',
          'Supprimer définitivement toute règle d’urbanisme sur l’ensemble du territoire municipal',
          'Interdire aux citoyens d’assister aux délibérations du conseil municipal de Val-Ferrand',
        ],
        answer: 1,
        explanation: 'La publicité des débats et la mobilisation des contre-pouvoirs citoyens limitent l’influence occulte des intérêts privés sur la réglementation.',
      },
    ],
  },

  {
    conceptId: 'conglomerat_chaebol',
    questions: [
      {
        q: 'Le groupe Taret regroupe sous une même holding la fonderie, un chantier naval, une flotte de péniches et une supérette. Quel type de structure forme-t-il ?',
        choices: [
          'Une micro-entreprise individuelle gérée sans salarié ni statut juridique',
          'Une petite association de quartier dédiée aux loisirs sportifs',
          'Un conglomérat (ou chaebol), diversifié dans des secteurs multiples sous une direction stratégique unifiée',
          'Un syndicat de défense professionnelle réservé aux bateliers du canal',
        ],
        answer: 2,
        explanation: 'Un conglomérat réunit des entreprises d’activités diverses pour mutualiser les ressources financières et consolider son pouvoir de marché.',
      },
      {
        q: 'Quel atout de taille un groupe congloméral possède-t-il quand l’une de ses filières traverse une passe difficile ?',
        choices: [
          'La certitude absolue que tous les secteurs économiques progressent au même rythme chaque année',
          'La compensation interne : les bénéfices de sa flotte maritime peuvent renflouer les premiers mois de son journal d’investigation',
          'L’autorisation préfectorale de ne jamais payer de salaires en période d’intempéries',
          'Le droit de réquisitionner gratuitement les terrains maraîchers de la commune',
        ],
        answer: 1,
        explanation: 'La diversification conglomérale permet d’absorber les chocs sectoriels grâce aux profits issus d’autres branches florissantes du groupe.',
      },
      {
        q: 'Quel risque bureaucratique majeur guette les conglomérats géants selon les analyses sociologiques de Max Weber ?',
        choices: [
          'La multiplication des strates hiérarchiques, la lenteur des décisions et la déconnexion par rapport aux réalités de l’atelier',
          'Une disparition instantanée de toutes les machines lors de chaque inventaire annuel',
          'L’interdiction légale de recruter des ouvriers ayant suivi une formation professionnelle',
          'La baisse automatique du chiffre d’affaires de l’ensemble des filiales le premier jour du mois',
        ],
        answer: 0,
        explanation: 'L’hypertrophie bureaucratique des méga-structures étouffe l’agilité, multiplie les formulaires stériles et éloigne les décideurs du terrain.',
      },
    ],
  },

  {
    conceptId: 'alea_moral',
    questions: [
      {
        q: 'Ton atelier souscrit une assurance tous risques sans franchise qui rembourse les triporteurs volés à neuf. Deux mois plus tard, que constates-tu ?',
        choices: [
          'Les coursiers ont acheté à leurs frais de lourdes chaînes antivol en acier trempé',
          'Les coursiers négligent d’attacher leurs vélos pour les livraisons rapides, sachant l’assurance acquise',
          'Le nombre de vols de bicyclettes tombe à zéro dans l’ensemble de l’agglomération',
          'La compagnie d’assurance diminue spontanément le tarif de la prime mensuelle',
        ],
        answer: 1,
        explanation: 'L’aléa moral désigne la baisse de vigilance d’un individu ou d’une entreprise lorsqu’il se sait totalement protégé des conséquences d’un sinistre.',
      },
      {
        q: 'Pourquoi les banques centrales surveillent-elles étroitement les établissements réputés « trop grands pour faire faillite » ?',
        choices: [
          'Pour contrer l’aléa moral qui les pousserait à prendre des risques inconsidérés en comptant sur un sauvetage par les contribuables',
          'Pour interdire aux banquiers de financer les projets des artisans de Val-Ferrand',
          'Pour contraindre les banques à fermer leurs agences physiques les jours de marché',
          'Pour réduire le salaire des guichetiers et agents d’accueil de quartier',
        ],
        answer: 0,
        explanation: 'La certitude d’être secouru par l’État incite les grandes institutions à maximiser leurs profits spéculatifs en reportant les pertes sur la société.',
      },
      {
        q: 'Quelle disposition contractuelle permet à une coopérative de coursiers de juguler l’aléa moral sur sa flotte de vélos ?',
        choices: [
          'Interdire formellement aux livreurs d’utiliser leurs vélos les jours où le ciel est gris',
          'Laisser une franchise financière raisonnable à la charge du coursier en cas de perte par négligence manifeste',
          'Supprimer complètement l’assurance et faire porter la responsabilité pénale aux clients livrés',
          'Demander à chaque livreur de jurer sur l’honneur de ne jamais égarer sa bicyclette',
        ],
        answer: 1,
        explanation: 'L’instauration d’une franchise responsabilise le conducteur en lui laissant assumer une fraction du coût en cas de négligence.',
      },
    ],
  },

  {
    conceptId: 'asymetrie_information',
    questions: [
      {
        q: 'Sous le pont du laminoir, des vendeurs proposent des pièces mécaniques d’occasion sans garantie. Que prédit le modèle des « tacots » d’Akerlof ?',
        choices: [
          'Les acheteurs méfiants refusent de payer le juste prix : les pièces de qualité disparaissent et il ne reste que des épaves douteuses',
          'Toutes les pièces s’écoulent en quelques minutes au prix du matériel neuf sorti d’usine',
          'Les acheteurs devinent instantanément l’historique d’usure des roulements sans rien démonter',
          'Le marché devient spontanément un modèle d’équilibre et d’honnêteté partagée',
        ],
        answer: 0,
        explanation: 'L’asymétrie d’information provoque une sélection adverse : le doute généralisé tire les prix vers le bas et chasse les bons vendeurs du marché.',
      },
      {
        q: 'Pour dissiper la méfiance des clients lors de la revente de matériel informatique réparé, quelle solution Karim met-il en place ?',
        choices: [
          'Fournir une fiche de test détaillée, un label d’atelier et une garantie de six mois pièces et main-d’œuvre',
          'Baisser les prix jusqu’à vendre à perte pour que les clients cessent de poser des questions',
          'Affirmer verbalement que les ordinateurs n’ont jamais servi avant leur arrivée à l’atelier',
          'Interdire formellement aux acheteurs d’allumer les écrans avant d’avoir réglé la facture',
        ],
        answer: 0,
        explanation: 'Les labels, garanties et diagnostics indépendants réduisent l’asymétrie d’information et rétablissent la confiance nécessaire à la transaction.',
      },
      {
        q: 'Dans le crédit bancaire, quelle asymétrie d’information pénalise les jeunes artisans sans patrimoine qui sollicitent un premier prêt ?',
        choices: [
          'L’artisan connaît mieux les secrets comptables de la banque que son propre conseiller de clientèle',
          'La banque ne peut pas mesurer parfaitement la compétence et la sincérité du jeune porteur de projet, et exige de lourdes garanties',
          'Le directeur de l’agence bancaire ignore comment calculer le montant d’une mensualité d’emprunt',
          'Les ordinateurs de la banque refusent d’enregistrer les demandes de financement des moins de 30 ans',
        ],
        answer: 1,
        explanation: 'Faute de pouvoir observer directement l’effort et le sérieux futur de l’emprunteur, le prêteur réclame des gages matériels pour se prémunir.',
      },
    ],
  },

  {
    conceptId: 'externalite',
    questions: [
      {
        q: 'Les camions géants du centre logistique défoncent les pavés des Roses et enfument le quartier sans réparer la chaussée. Quel concept s’applique ?',
        choices: [
          'Un bien public offert généreusement par le transporteur routier à la commune',
          'Une externalité négative : un coût imposé au voisinage et aux finances publiques sans contrepartie financière',
          'Une concurrence déloyale envers les compagnies de batellerie du canal',
          'Une saine contribution privée à la modernisation des revêtements urbains',
        ],
        answer: 1,
        explanation: 'Une externalité négative survient lorsqu’une activité engendre des désagréments ou des coûts pour autrui sans compensation marchande.',
      },
      {
        q: 'En fleurissant le trottoir et en réparant les bancs devant ton salon de thé solidaire, tu embellis toute la rue. Que constates-tu ?',
        choices: [
          'Une perte d’exploitation que tu dois immédiatement facturer à la police municipale',
          'Une infraction grave aux arrêtés préfectoraux d’alignement des voiries',
          'Une externalité positive : ton action procure un avantage gratuit aux commerces voisins et aux promeneurs',
          'Une manœuvre d’entente illicite avec les jardiniers du parc public',
        ],
        answer: 2,
        explanation: 'Une externalité positive enrichit la collectivité ou les voisins sans que l’initiateur ne perçoive de paiement direct pour cet embellissement.',
      },
      {
        q: 'Quelle solution proposée par Arthur Cecil Pigou permet de responsabiliser une usine dont les fumées noircissent les façades du quartier ?',
        choices: [
          'Verser une prime municipale d’encouragement à l’usine chaque fois qu’une cheminée fume',
          'Instaurer une taxe pigouvienne calculée sur les rejets polluants pour inciter l’industriel à investir dans des filtres',
          'Interdire aux riverains de mesurer le taux de particules fines dans l’air ambiant',
          'Offrir gratuitement le fioul lourd nécessaire à la combustion des chaudières',
        ],
        answer: 1,
        explanation: 'La taxe pigouvienne internalise l’externalité : en faisant payer au pollueur le coût réel infligé à la collectivité, elle l’incite à dépolluer.',
      },
    ],
  },

  {
    conceptId: 'bien_public',
    questions: [
      {
        q: 'L’éclairage public installé le long du quai de la Malterie sécurise les trajets de nuit de tous les habitants. Quelles propriétés Samuelson y associe-t-il ?',
        choices: [
          'Une exclusion tarifaire stricte et une consommation fortement rivale à chaque lampadaire',
          'La non-rivalité (la clarté pour l’un ne diminue pas celle de l’autre) et la non-exclusion (impossible d’en priver un passant)',
          'Un bien purement privé dont l’accès doit être verrouillé par un digicode payant',
          'Une marchandise marchande dont le prix varie en fonction du nombre de piétons sous le réverbère',
        ],
        answer: 1,
        explanation: 'Un bien public pur est non-rival et non-excluable : chacun peut en profiter sans léser autrui et sans qu’on puisse en restreindre l’accès.',
      },
      {
        q: 'Pourquoi une société privée refuserait-elle d’ériger et d’alimenter une balise lumineuse à l’entrée brumeuse du canal ?',
        choices: [
          'En raison du passager clandestin : tous les bateaux profiteraient de la lumière sans qu’on puisse les contraindre à payer',
          'Parce que le code de la navigation fluviale interdit d’utiliser des lanternes la nuit',
          'Parce que les capitaines de péniche refusent de regarder les signaux lumineux par principe',
          'Parce qu’une balise lumineuse coûte moins cher à fabriquer qu’un sifflet de manœuvre',
        ],
        answer: 0,
        explanation: 'L’impossibilité de faire payer individuellement les bénéficiaires décourage l’initiative marchande privée, justifiant l’intervention publique.',
      },
      {
        q: 'Lequel de ces aménagements de Val-Ferrand illustre le plus fidèlement la nature d’un bien public pur ?',
        choices: [
          'La digue fluviale qui protège l’ensemble de la basse-ville contre les crues de la rivière',
          'Le sandwich chaud vendu au comptoir de la buvette de la gare',
          'Le vélo cargo loué à la journée auprès de l’atelier de Karim',
          'La boîte de thé importée disponible sur les étagères de Mme Bertin',
        ],
        answer: 0,
        explanation: 'La digue protège indistinctement chaque foyer sans rivalité d’usage ni exclusion possible, préservant la sécurité collective.',
      },
    ],
  },

  {
    conceptId: 'rente',
    questions: [
      {
        q: 'Un propriétaire majore brutalement le loyer d’un local de l’avenue Jaurès uniquement parce qu’un arrêt de tramway vient d’ouvrir devant sa porte. Comment Ricardo qualifie-t-il ce revenu ?',
        choices: [
          'Un salaire récompensant un labeur physique exténuant sur le chantier du tramway',
          'Une rente de situation : un gain tiré de la possession exclusive d’un lieu rare, sans apport d’effort ni de travail neuf',
          'Un profit d’innovation couronnant un brevet technologique déposé par le bailleur',
          'Une perte d’exploitation liée à l’usure causée par les passagers du tramway',
        ],
        answer: 1,
        explanation: 'La rente foncière est un prélèvement opéré par le propriétaire sur une valeur créée par la collectivité (ici l’arrivée du tramway public).',
      },
      {
        q: 'Quelle ligne de partage fondamentale sépare le profit d’un artisan audacieux et la rente d’un détenteur d’emplacement ?',
        choices: [
          'Le profit rémunère l’initiative, la prise de risque et le travail réel ; la rente est captée passivement par la détention d’un titre ou d’une position',
          'La rente exige de travailler soixante heures par semaine sur un établi poussiéreux',
          'Le profit est strictement illégal dans toutes les démocraties industrielles modernes',
          'La rente s’annule automatiquement dès que le niveau des salaires progresse',
        ],
        answer: 0,
        explanation: 'Tandis que l’artisan enrichit l’économie en créant de la valeur par son travail, le rentier s’approprie une fraction de la valeur produite par d’autres.',
      },
      {
        q: 'Comment la ville de Val-Ferrand peut-elle protéger ses jeunes ateliers contre l’étranglement des rentes immobilières spéculatives ?',
        choices: [
          'En expulsant systématiquement les artisans qui prolongent leurs horaires en soirée',
          'En créant un foncier solidaire avec des baux associatifs à loyers modérés plafonnés pour les métiers productifs',
          'En interdisant l’ouverture de tout nouvel atelier artisanal dans le centre urbain',
          'En supprimant l’ensemble des transports collectifs qui desservent les quartiers populaires',
        ],
        answer: 1,
        explanation: 'La maîtrise collective du foncier et les baux solidaires neutralisent la spéculation rentière pour sauvegarder l’activité artisanale.',
      },
    ],
  },

  {
    conceptId: 'effet_eviction',
    questions: [
      {
        q: 'La mairie émet un emprunt géant rémunéré à taux élevé pour financer un palais des congrès, absorbant toute l’épargne locale. Que découvrent les petites entreprises ?',
        choices: [
          'Une abondance miraculeuse de crédits bancaires sans intérêt pour leurs ateliers',
          'Un effet d’éviction : les banques ont prêté tous leurs fonds à la ville et n’ont plus de crédit disponible pour les commerçants',
          'Une chute automatique de tous les taux d’intérêt demandés aux créateurs du quartier',
          'Une subvention européenne versée à chaque atelier pour compenser les emprunts de la ville',
        ],
        answer: 1,
        explanation: 'L’effet d’éviction se manifeste quand l’emprunt public siphonne l’épargne disponible, privant le secteur productif privé de financements d’essor.',
      },
      {
        q: 'Sur le marché du travail de la vallée, comment un méga-chantier public sous perfusion peut-il évincer les artisans indépendants ?',
        choices: [
          'En embauchant tous les électriciens et maçons à des tarifs financés par l’impôt qu’aucun petit atelier ne peut égaler',
          'En formant trop d’apprentis pour les besoins de rénovation de l’agglomération',
          'En interdisant aux artisans indépendants de manipuler des truelles et des marteaux',
          'En provoquant une baisse brutale des rémunérations ouvrières sur l’ensemble du département',
        ],
        answer: 0,
        explanation: 'L’accaparement des compétences rares par un projet public démesuré prive les entreprises locales des bras nécessaires à leur survie.',
      },
      {
        q: 'Pour moderniser ses infrastructures sans provoquer d’effet d’éviction financier destructeur, que doit calibrer la municipalité ?',
        choices: [
          'Interdire aux établissements bancaires de prêter de l’argent aux collectivités territoriales',
          'Doubler la dette communale chaque année sans consulter les prévisions de rentrées fiscales',
          'Échelonner ses investissements avec prudence et mobiliser l’épargne citoyenne participative sans assécher le crédit aux PME',
          'Arrêter définitivement toute dépense d’entretien des voies publiques pendant trente ans',
        ],
        answer: 2,
        explanation: 'Un étalement raisonné de la dépense publique préserve les liquidités bancaires nécessaires au dynamisme des entreprises du territoire.',
      },
    ],
  },

  {
    conceptId: 'dumping',
    questions: [
      {
        q: 'Une grande chaîne de supermarchés brade la baguette à 0,20 € à perte pendant six mois à Val-Ferrand. Quelle stratégie agressive poursuit-elle ?',
        choices: [
          'Une œuvre purement caritative financée par un donateur anonyme désintéressé',
          'Une baisse naturelle de prix liée à une moisson locale particulièrement généreuse',
          'Une pratique de dumping par prix prédateurs pour étouffer les boulangers artisanaux avant de remonter ses tarifs en situation de monopole',
          'Une obligation légale imposée par les services vétérinaires de la préfecture',
        ],
        answer: 2,
        explanation: 'Le dumping prédateur consiste à vendre délibérément à perte le temps d’asphyxier la concurrence pour régner ensuite sans rivaux.',
      },
      {
        q: 'Comment nomme-t-on la pratique d’une usine étrangère qui méprise les normes sociales et écologiques pour exporter des biens bradés ?',
        choices: [
          'Le dumping social et environnemental, créant une concurrence biaisée contre les producteurs qui respectent les droits humains et la planète',
          'Une brillante application de la théorie des avantages comparatifs loyaux',
          'Une labellisation de commerce équitable garantie par les ONG internationales',
          'Une simplification bienvenue des formalités administratives superflues',
        ],
        answer: 0,
        explanation: 'Le dumping social ou environnemental exploite l’absence de régulation pour casser les prix au détriment de la santé et des salaires.',
      },
      {
        q: 'Quel bouclier juridique protège les artisans de Val-Ferrand contre un concurrent milliardaire vendant délibérément à perte ?',
        choices: [
          'L’interdiction légale de la revente à perte et les sanctions pour pratiques commerciales déloyales et abus de domination',
          'L’obligation faite aux artisans de baisser leurs prix jusqu’à déposer le bilan',
          'L’interdiction aux clients de faire leurs courses alimentaires les jours de marché',
          'La suppression complète des tribunaux de commerce sur l’ensemble du territoire',
        ],
        answer: 0,
        explanation: 'Le droit réprime fermement la revente à perte et les prix prédateurs afin d’assurer des conditions équitables de survie pour les commerces.',
      },
    ],
  },
];

export const QUIZ_BY_CONCEPT: Readonly<Record<string, ConceptQuiz>> = Object.fromEntries(
  QUIZZES.map((q) => [q.conceptId, q]),
);
