/**
 * NEURAPOLIS — Événements narratifs scolaires & Vie au collège Jean-Moulin (Workflow AG-2 Phase 5).
 * Textes strictement neutres en genre ; {prenom} autorisé ; aucune formule genrée.
 */

export interface SchoolEvent {
  id: string;
  title: string;
  text: string;
  characters: string[];
  minAge?: number;
  tier?: number;
  options: {
    label: string;
    ghost: string;
    advice: string;
    outcome: string;
    effects: {
      relations?: Record<string, number>;
      average?: number;
      stress?: number;
      moral?: number;
      reputation?: number;
      pride?: number;
    };
  }[];
}

export const SCHOOL_EVENTS: readonly SchoolEvent[] = [
  // =========================================================================
  // ARC 1 : Élection des délégués (candidature, discours, débat, prise de fonction)
  // =========================================================================
  {
    id: 'sch_delegue_candidature',
    title: 'Candidature aux élections de classe',
    minAge: 12,
    tier: 1,
    characters: ['char_prof_histoire_girard', 'char_eleve_rival_alexis', 'lina'],
    text: 'M. Girard annonce le scrutin des délégués. Alexis Rameau lève la main aussitôt, promettant déjà des canettes gratuites offertes par le Drive de son père. Lina te murmure : « Si personne d’autre ne se présente, il décidera de tout pour la classe. »',
    options: [
      {
        label: 'Déposer ta candidature sans attendre pour contrer Alexis',
        ghost: 'machiavel',
        advice: 'Le pouvoir laissé vacant par les timides revient toujours aux audacieux. Occupe l’espace avant lui.',
        outcome: 'M. Girard inscrit ton nom au tableau aux côtés d’Alexis. La classe murmure d’excitation devant le duel à venir.',
        effects: { relations: { char_eleve_rival_alexis: -8, lina: 4 }, reputation: 4, stress: 3, moral: 2 },
      },
      {
        label: 'Proposer un binôme paritaire et collectif avec Lina',
        ghost: 'ostrom',
        advice: 'Une charge partagée pèse deux fois moins. Bâtissez un mandat collégial fondé sur des règles claires.',
        outcome: 'Lina sourit et valide la proposition. Vous déposez une liste commune portée par l’entraide scolaire.',
        effects: { relations: { lina: 8, char_eleve_rival_alexis: -4 }, reputation: 3, stress: 1, moral: 4 },
      },
      {
        label: 'Demander d’abord le détail précis du règlement électoral',
        ghost: 'weber',
        advice: 'L’autorité légitime ne s’improvise pas : elle repose sur la stricte conformité aux procédures écrites.',
        outcome: 'M. Girard détaille le calendrier officiel du scrutin. Tes questions précises impressionnent la classe.',
        effects: { average: 0.2, reputation: 2, pride: 2 },
      },
    ],
  },
  {
    id: 'sch_delegue_discours',
    title: 'Discours de campagne sous le préau',
    minAge: 12,
    tier: 1,
    characters: ['char_prof_francais_fontaine', 'char_eleve_rival_alexis', 'yasmine'],
    text: 'Dans la salle de Mme Fontaine, les candidats disposent de trois minutes d’expression libre. Alexis distribue des stylos publicitaires du Drive. Yasmine prépare le carnet de notes de la presse collégienne au premier rang.',
    options: [
      {
        label: 'Parler de l’intérêt commun et du refus des privilèges',
        ghost: 'rousseau',
        advice: 'Rappelle à chacun que la volonté générale vise le bien de tous, non la satisfaction de quelques appétits particuliers.',
        outcome: 'Ton plaidoyer pour une classe soudée résonne fort. Plusieurs camarades applaudissent spontanément.',
        effects: { relations: { yasmine: 6, char_eleve_rival_alexis: -6 }, moral: 4, reputation: 4 },
      },
      {
        label: 'Proposer des services concrets : bourses aux devoirs et troc de fournitures',
        ghost: 'smith',
        advice: 'Montre l’utilité directe de ton projet. Chacun coopère plus volontiers quand il y trouve son compte.',
        outcome: 'L’assemblée retient l’aspect pratique de tes propositions. Même les camarades du fond de la salle approuvent.',
        effects: { reputation: 5, average: 0.1, pride: 3 },
      },
    ],
  },
  {
    id: 'sch_delegue_debat',
    title: 'Le débat contradictoire de la récréation',
    minAge: 12,
    tier: 1,
    characters: ['char_eleve_rival_alexis', 'char_eleve_delegue_sacha', 'noah'],
    text: 'Pendant la pause de midi, un débat impromptu s’improvise. Alexis ricane en pointant ton modeste stand du quartier : « On ne gère pas les doléances du collège comme des paquets de gâteaux ! » Sacha appelle au calme.',
    options: [
      {
        label: 'Démystifier son arrogance par l’expérience du travail réel',
        ghost: 'bourdieu',
        advice: 'Révèle l’illusion de sa supériorité : son aplomb ne vient que du capital paternel, non d’un mérite personnel.',
        outcome: 'Tu rappelles calmement que le travail enseigne le respect des autres. Alexis rougit et perd le fil de son discours.',
        effects: { relations: { char_eleve_rival_alexis: -10, noah: 6, char_eleve_delegue_sacha: 6 }, reputation: 6, moral: 4 },
      },
      {
        label: 'Détailler un plan de relance pour les projets scolaires',
        ghost: 'keynes',
        advice: 'L’optimisme pragmatique rassemble : projette tes camarades dans des réalisations stimulantes.',
        outcome: 'Tu chiffres les sorties possibles et le réaménagement du préau. L’enthousiasme gagne les indécis.',
        effects: { relations: { char_eleve_delegue_sacha: 4, noah: 4 }, reputation: 4, moral: 3 },
      },
    ],
  },
  {
    id: 'sch_delegue_prise_fonction',
    title: 'Première réunion avec la direction',
    minAge: 12,
    tier: 1,
    characters: ['char_principal_vasseur', 'char_cpe_benali', 'char_eleve_delegue_sacha'],
    text: 'Les votes sont dépouillés : te voilà à la charge de délégué aux côtés de Sacha. M. Vasseur et Mme Benali vous reçoivent dans le bureau de direction pour signer la charte d’engagement et définir les priorités du trimestre.',
    options: [
      {
        label: 'Consigner méthodiquement les règles et les comptes rendus',
        ghost: 'weber',
        advice: 'La continuité administrative garantit la justice. Écris chaque décision pour la rendre incontestable.',
        outcome: 'Mme Benali salue ton sens des responsabilités. Le registre des délégués est tenu de façon exemplaire.',
        effects: { relations: { char_cpe_benali: 8 }, pride: 4, average: 0.3 },
      },
      {
        label: 'Revendiquer la fin des sanctions collectives et des frais d’ateliers',
        ghost: 'marx',
        advice: 'Ne sois pas la courroie de transmission de l’autorité : porte sans faiblir les doléances des plus vulnérables.',
        outcome: 'M. Vasseur fronce les sourcils mais concède un groupe de travail sur la gratuité des fournitures de dessin.',
        effects: { relations: { char_principal_vasseur: -4, char_eleve_delegue_sacha: 6 }, reputation: 5, stress: 3 },
      },
    ],
  },

  // =========================================================================
  // ARC 2 : Voyage scolaire (financement coopératif, trajet, visite industrielle, imprévu auberge)
  // =========================================================================
  {
    id: 'sch_voyage_financement',
    title: 'Financement solidaire du voyage scolaire',
    minAge: 13,
    tier: 1,
    characters: ['char_prof_histoire_girard', 'char_eleve_artiste_zoe', 'noah'],
    text: 'M. Girard annonce un voyage pédagogique de deux jours pour découvrir l’histoire du bassin minier et textile. Problème : le coût du car excède le budget alloué de 450 €. Sans solution solidaire, plusieurs camarades resteront à quai.',
    options: [
      {
        label: 'Organiser une tombola coopérative avec les dessins de Zoé',
        ghost: 'ostrom',
        advice: 'La solidarité s’auto-organise quand les ressources créatives de la communauté sont mises en commun.',
        outcome: 'Zoé crée de magnifiques affiches linogravées. La tombola rapporte 520 € et finance tous les billets.',
        effects: { relations: { char_eleve_artiste_zoe: 8, char_prof_histoire_girard: 6 }, moral: 6, pride: 4 },
      },
      {
        label: 'Négocier un mécénat avec les commerçants de la place',
        ghost: 'smith',
        advice: 'Un petit échange mutuel : une mention sur le carnet de voyage en échange d’un coup de pouce financier.',
        outcome: 'L’épicerie Bertin et le garage Samir abondent au fonds. La somme est bouclée en quarante-huit heures.',
        effects: { relations: { noah: 4 }, reputation: 5, pride: 3 },
      },
      {
        label: 'Mutualiser les frais de transport avec le collège voisin',
        ghost: 'ricardo',
        advice: 'L’avantage mutuel naît de la réduction des coûts fixes partagés entre deux groupes aux besoins similaires.',
        outcome: 'Un car de soixante places est partagé avec le collège Jean-Jaurès. Le tarif par personne diminue de moitié.',
        effects: { average: 0.2, pride: 3, stress: -2 },
      },
    ],
  },
  {
    id: 'sch_voyage_trajet',
    title: 'Sur la départementale des terrils',
    minAge: 13,
    tier: 1,
    characters: ['char_prof_francais_fontaine', 'char_eleve_decrocheur_dylan', 'lina'],
    text: 'Le car roule sous la pluie vers la région des terrils. Au fond, Dylan écoute sa musique trop fort et Mme Fontaine s’agace des éclats de voix. Lina révise ses fiches de géographie sur le siège voisin.',
    options: [
      {
        label: 'Aller discuter calmement avec Dylan pour désamorcer la tension',
        ghost: 'dejours',
        advice: 'L’isolement et la provocation cachent souvent la peur du jugement. Écoute avant de chercher à corriger.',
        outcome: 'Dylan baisse le volume et commence à raconter ses souvenirs de vélo. Le trajet redevient paisible.',
        effects: { relations: { char_eleve_decrocheur_dylan: 8, char_prof_francais_fontaine: 4 }, moral: 4, stress: -2 },
      },
      {
        label: 'Proposer un quiz chronométré pour canaliser l’énergie du car',
        ghost: 'taylor',
        advice: 'L’ordre s’obtient par une occupation structurée du temps. Canalise l’agitation vers un objectif précis.',
        outcome: 'Le concours de culture générale captive la moitié du car. Même le chauffeur s’amuse des devinettes.',
        effects: { relations: { lina: 5 }, average: 0.2, reputation: 3 },
      },
    ],
  },
  {
    id: 'sch_voyage_visite_industrielle',
    title: 'Au pied des hauts-fourneaux éteints',
    minAge: 13,
    tier: 1,
    characters: ['char_prof_histoire_girard', 'char_documentaliste_aubert', 'char_eleve_artiste_zoe'],
    text: 'Le groupe pénètre dans l’immense halle de laminage conservée en écomusée. Les hauts-fourneaux éteints imposent un silence poignant. Un guide, ancien ajusteur, raconte les grandes grèves de 1974 pour la dignité salariale.',
    options: [
      {
        label: 'Poser des questions sur l’organisation ouvrière et la caisse de grève',
        ghost: 'marx',
        advice: 'La mémoire des luttes n’est pas une relique : elle enseigne la force de la conscience collective.',
        outcome: 'Le vieux guide s’illumine devant ta curiosité. M. Girard note tes interventions pertinentes au dossier.',
        effects: { relations: { char_prof_histoire_girard: 8 }, average: 0.4, moral: 4 },
      },
      {
        label: 'Interroger le guide sur la transition technologique et les nouvelles machines',
        ghost: 'schumpeter',
        advice: 'Comprends ce qui est mort pour bâtir ce qui vient. L’acier d’hier prépare les structures de demain.',
        outcome: 'L’échange sur la reconversion des friches industrielles passionne le groupe. Zoé croque la scène.',
        effects: { relations: { char_eleve_artiste_zoe: 4 }, average: 0.3, reputation: 3 },
      },
    ],
  },
  {
    id: 'sch_voyage_imprevu_auberge',
    title: 'Fuite d’eau à l’auberge de jeunesse',
    minAge: 13,
    tier: 1,
    characters: ['char_cpe_benali', 'char_prof_maths_moreau', 'noah'],
    text: 'Arrivés à l’auberge municipale le soir, mauvaise surprise : une canalisation a sauté, inondant trois dortoirs. L’intendante est désemparée et Mme Benali cherche une solution d’urgence sans renvoyer le groupe.',
    options: [
      {
        label: 'Organiser la réaffectation solidaire des lits et des matelas au sec',
        ghost: 'ostrom',
        advice: 'Les crises locales se résolvent par la gestion directe et l’entraide de ceux qui partagent l’espace.',
        outcome: 'Tout le monde met la main à la pâte. En quarante minutes, un campement chaleureux est dressé.',
        effects: { relations: { char_cpe_benali: 8, noah: 4 }, moral: 6, reputation: 5, pride: 4 },
      },
      {
        label: 'Établir une chaîne logistique méthodique pour éponger et stocker les bagages',
        ghost: 'taylor',
        advice: 'Divise les tâches : une équipe au seau, une au transport, une au séchage. Zéro geste perdu.',
        outcome: 'La réactivité impressionne Mme Moreau. Les sacs sont sauvés de l’eau et rangés au réfectoire.',
        effects: { relations: { char_prof_maths_moreau: 6 }, stress: 2, reputation: 4, pride: 3 },
      },
    ],
  },

  // =========================================================================
  // ARC 3 : Harcèlement et solidarité (casiers, cantine, défense de Dylan, médiation)
  // =========================================================================
  {
    id: 'sch_harcelement_casiers',
    title: 'Intimidation près des casiers',
    minAge: 13,
    tier: 1,
    characters: ['char_eleve_decrocheur_dylan', 'char_eleve_rival_alexis', 'yasmine'],
    text: 'Près de l’escalier B, deux grands menés par un ami d’Alexis bloquent Dylan contre son casier, lui réclamant son blouson et riant de ses baskets usées. Dylan serre les poings, au bord des larmes et de l’explosion.',
    options: [
      {
        label: 'T’interposer fermement et faire bloc aux côtés de Dylan',
        ghost: 'dejours',
        advice: 'Tolérer l’humiliation sous ses yeux détruit celui qui la subit et dégrade celui qui la regarde. Agis.',
        outcome: 'Ta présence déterminée attire les regards. Les intimidateurs reculent et s’éloignent en pestant.',
        effects: { relations: { char_eleve_decrocheur_dylan: 10, char_eleve_rival_alexis: -6, yasmine: 6 }, moral: 5, reputation: 5, stress: 4 },
      },
      {
        label: 'Alerter immédiatement les surveillants sans faire d’esclandre',
        ghost: 'weber',
        advice: 'La force publique légitime de l’établissement doit intervenir pour faire cesser le désordre.',
        outcome: 'Un surveillant déboule dans le couloir et sépare le groupe. Dylan récupère ses affaires intactes.',
        effects: { relations: { char_eleve_decrocheur_dylan: 4, yasmine: 3 }, stress: 1, moral: 2 },
      },
    ],
  },
  {
    id: 'sch_harcelement_cantine',
    title: 'Le plateau renversé au réfectoire',
    minAge: 13,
    tier: 1,
    characters: ['char_eleve_decrocheur_dylan', 'char_eleve_rival_alexis', 'lina'],
    text: 'À la cantine, Alexis et sa bande occupent une grande table et lancent des morceaux de pain sur un camarade de sixième isolé qui pleure en silence. Plusieurs élèves détournent le regard pour éviter les ennuis.',
    options: [
      {
        label: 'Prendre ton plateau et aller t’asseoir à côté du nouvel élève',
        ghost: 'rousseau',
        advice: 'La pitié naturelle est le premier sentiment moral. Montre que personne n’est abandonné ici.',
        outcome: 'Lina et Dylan te rejoignent aussitôt. La table devient la plus animée et les moqueries cessent net.',
        effects: { relations: { char_eleve_decrocheur_dylan: 6, lina: 6, char_eleve_rival_alexis: -6 }, moral: 6, reputation: 4 },
      },
      {
        label: 'Pointer tout haut la lâcheté d’Alexis devant toute la file',
        ghost: 'machiavel',
        advice: 'Retourne la honte contre l’agresseur : fais de son spectacle son propre ridicule public.',
        outcome: 'Des rires éclatent dans la file d’attente aux dépens d’Alexis, qui s’empourpre et quitte le réfectoire.',
        effects: { relations: { char_eleve_rival_alexis: -8 }, reputation: 6, stress: 3 },
      },
    ],
  },
  {
    id: 'sch_harcelement_defense_dylan',
    title: 'Plaidoyer pour Dylan en conseil de discipline',
    minAge: 13,
    tier: 1,
    characters: ['char_principal_vasseur', 'char_cpe_benali', 'char_eleve_decrocheur_dylan'],
    text: 'Après une altercation dans la cour où Dylan s’est défendu, M. Vasseur envisage une exclusion temporaire de trois jours. Mme Benali sait que cela compromettrait son année scolaire mais les rapports sont accablants.',
    options: [
      {
        label: 'Témoigner de la réalité des provocations subies par Dylan',
        ghost: 'bourdieu',
        advice: 'Rétablis la chaîne causale des violences symboliques : la réaction visible découle d’un mépris invisible.',
        outcome: 'Ton témoignage calme et précis renverse la perspective. M. Vasseur convertit la sanction en travail d’intérêt général.',
        effects: { relations: { char_eleve_decrocheur_dylan: 12, char_cpe_benali: 6 }, reputation: 5, moral: 5, pride: 3 },
      },
      {
        label: 'Proposer d’accompagner Dylan dans un contrat de tutorat solidaire',
        ghost: 'ostrom',
        advice: 'Remplace la punition stérile par un engagement réciproque appuyé par un membre de confiance.',
        outcome: 'La direction valide le contrat d’entraide. Dylan accepte de venir réviser avec toi chaque mardi.',
        effects: { relations: { char_eleve_decrocheur_dylan: 10, char_cpe_benali: 8 }, average: 0.2, moral: 6, pride: 4 },
      },
    ],
  },
  {
    id: 'sch_harcelement_mediation',
    title: 'Médiation par les pairs dans la salle polyvalente',
    minAge: 13,
    tier: 1,
    characters: ['char_cpe_benali', 'char_eleve_delegue_sacha', 'char_eleve_rival_alexis'],
    text: 'Mme Benali convoque une séance de médiation par les pairs dans la salle polyvalente pour apaiser les rancœurs entre les groupes de la Cité des Roses et les proches d’Alexis. Elle te demande de co-animer l’échange avec Sacha.',
    options: [
      {
        label: 'Faire exprimer à chacun ce qu’il ressent sans accusation directe',
        ghost: 'rousseau',
        advice: 'Quand la parole sincère remplace le masque des apparences, les rancœurs perdent leur carburant.',
        outcome: 'Le dialogue dénoue les malentendus. Un pacte tacite de non-agression est signé devant Mme Benali.',
        effects: { relations: { char_cpe_benali: 8, char_eleve_delegue_sacha: 6 }, moral: 5, reputation: 6 },
      },
      {
        label: 'Poser un barème clair et dissuasif de sanctions automatiques',
        ghost: 'hobbes',
        advice: 'Les pactes sans épée ne sont que des mots. Fonde l’accord sur la certitude d’une perte commune.',
        outcome: 'Les limites sont clairement tracées. Alexis comprend qu’un prochain débordement lui coûtera cher.',
        effects: { relations: { char_eleve_rival_alexis: -2, char_cpe_benali: 5 }, stress: -2, reputation: 4 },
      },
    ],
  },

  // =========================================================================
  // ARC 4 : Premier amour sobre (regards CDI, devoirs partagés, carnet prêté, fête fin d'année)
  // =========================================================================
  {
    id: 'sch_amour_regards_cdi',
    title: 'Regards discrets entre les rayonnages du CDI',
    minAge: 14,
    tier: 1,
    characters: ['char_documentaliste_aubert', 'char_eleve_artiste_zoe'],
    text: 'L’après-midi décline au CDI. Mme Aubert classe des revues en silence. À la table du fond, Zoé esquisse des croquis de Val-Ferrand dans son carnet à spirale. Chaque fois que tu lèves les yeux de ton manuel d’histoire, son regard croise le tien avant de se replonger dans ses crayons.',
    options: [
      {
        label: 'Lui proposer un échange : une explication d’exercice contre un croquis',
        ghost: 'smith',
        advice: 'La sympathie mutuelle s’épanouit dans les petits échanges bienveillants où chacun apporte ce qu’il sait faire.',
        outcome: 'Zoé sourit doucement et glisse son dessin d’une façade de la place sur ton cahier. Vos cœurs battent un peu plus vite.',
        effects: { relations: { char_eleve_artiste_zoe: 8 }, moral: 6, stress: -3 },
      },
      {
        label: 'Laisser un silence complice et savourer l’instant partagé',
        ghost: 'rousseau',
        advice: 'Les sentiments les plus purs n’ont pas besoin de grands discours : la présence paisible suffit.',
        outcome: 'La lumière dorée traverse les vitres du CDI. Le calme partagé vous rapproche plus que de longues paroles.',
        effects: { relations: { char_eleve_artiste_zoe: 6 }, moral: 5, stress: -4 },
      },
    ],
  },
  {
    id: 'sch_amour_devoirs_partages',
    title: 'Sur le banc de pierre après les cours',
    minAge: 14,
    tier: 1,
    characters: ['char_eleve_artiste_zoe', 'char_prof_maths_moreau'],
    text: 'Sur le banc de pierre près du marronnier, après la fin des cours, vous étalez vos classeurs de mathématiques. Les démonstrations de géométrie de Mme Moreau vous donnent du fil à retordre, mais vos épaules se frôlent en calculant les angles.',
    options: [
      {
        label: 'Inventer ensemble une méthode mnémotechnique imagée',
        ghost: 'schumpeter',
        advice: 'Associer la rigueur logique et l’imagination visuelle transforme une corvée en invention stimulante.',
        outcome: 'Zoé dessine les théorèmes sous forme de ponts industriels. Les devoirs sont bouclés dans les rires.',
        effects: { relations: { char_eleve_artiste_zoe: 7 }, average: 0.3, moral: 5 },
      },
      {
        label: 'Partager équitablement la recherche des théorèmes et la relecture',
        ghost: 'ostrom',
        advice: 'L’harmonie naît de la coopération sans rivalité où chacun valorise le travail de l’autre.',
        outcome: 'Un travail soigné et rigoureux. Vos deux copies obtiendront la note maximale le lendemain.',
        effects: { relations: { char_eleve_artiste_zoe: 6, char_prof_maths_moreau: 4 }, average: 0.4, moral: 4, pride: 2 },
      },
    ],
  },
  {
    id: 'sch_amour_carnet_prete',
    title: 'Le mot plié dans le carnet d’économie',
    minAge: 14,
    tier: 1,
    characters: ['char_eleve_artiste_zoe', 'lina'],
    text: 'En te rendant ton carnet d’économie prêté le week-end, Zoé a laissé un marque-page en papier kraft illustré d’un oiseau survolant les toits de Taret-Acier, avec ces mots : « Pour tes projets, garde toujours un œil haut. » Lina remarque ton sourire rêveur.',
    options: [
      {
        label: 'Glisser en retour un mot sincère pour la remercier',
        ghost: 'rousseau',
        advice: 'La délicatesse reçue appelle une réponse du cœur, sans fard ni faux-semblant.',
        outcome: 'Le lendemain au vestiaire, son regard lumineux te confirme que le mot a été lu et chéri.',
        effects: { relations: { char_eleve_artiste_zoe: 8 }, moral: 6, pride: 2 },
      },
      {
        label: 'Garder le secret pour préserver votre complicité discrète',
        ghost: 'machiavel',
        advice: 'Ce qui est précieux doit rester à l’abri des commérages du collège. Le mystère protège les liens naissants.',
        outcome: 'Tu ranges le marque-page dans ta poche de poitrine. Votre secret partagé crée un lien indéfectible.',
        effects: { relations: { char_eleve_artiste_zoe: 6, lina: 2 }, moral: 4, stress: -2 },
      },
    ],
  },
  {
    id: 'sch_amour_fete_fin_annee',
    title: 'La danse sous les guirlandes du préau',
    minAge: 14,
    tier: 2,
    characters: ['char_eleve_artiste_zoe', 'noah', 'char_prof_eps_sanchez'],
    text: 'C’est la fête de fin d’année sous le préau décoré de guirlandes. M. Sanchez gère la sonorisation et Noah distribue des gobelets. Alors qu’une musique lente résonne, Zoé s’approche timidement en froissant le bas de sa veste.',
    options: [
      {
        label: 'L’inviter à danser simplement au milieu des camarades',
        ghost: 'rousseau',
        advice: 'Laisse de côté l’embarras : la jeunesse est faite pour ces instants de confiance partagée.',
        outcome: 'Vous dansez au milieu du préau. Un moment suspendu et doux qui reste gravé dans vos mémoires.',
        effects: { relations: { char_eleve_artiste_zoe: 10, noah: 3 }, moral: 8, reputation: 4, pride: 3 },
      },
      {
        label: 'L’inviter à marcher au calme le long des grilles pour discuter d’avenir',
        ghost: 'smith',
        advice: 'La vraie intimité se forge dans la confidence tranquille, loin du tumulte et des regards.',
        outcome: 'Vous parlez de ses rêves d’école d’art et de tes projets d’atelier. La complicité est totale.',
        effects: { relations: { char_eleve_artiste_zoe: 9 }, moral: 7, stress: -4 },
      },
    ],
  },

  // =========================================================================
  // ARC 5 : Conseil de classe (bulletin, convocation, négociation, félicitations)
  // =========================================================================
  {
    id: 'sch_conseil_bulletin',
    title: 'Réception du bulletin trimestriel',
    minAge: 14,
    tier: 1,
    characters: ['char_prof_maths_moreau', 'char_prof_francais_fontaine', 'char_prof_histoire_girard'],
    text: 'Le relevé de notes trimestriel est imprimé. En histoire et en calcul appliqué, tes résultats impressionnent. En français, Mme Fontaine note : « Esprit vif mais écriture parfois hâtive ; attention à soigner la rigueur littéraire. »',
    options: [
      {
        label: 'Analyser chaque appréciation pour bâtir un plan de révisions ciblées',
        ghost: 'weber',
        advice: 'Ne discute pas le diagnostic : utilise l’évaluation comme un levier méthodique d’amélioration.',
        outcome: 'Tu planifies deux heures de révision ciblée par semaine. Tes professeurs saluent ta lucidité.',
        effects: { average: 0.5, relations: { char_prof_francais_fontaine: 6 }, pride: 4 },
      },
      {
        label: 'Mettre en avant l’innovation de tes projets pour contextualiser tes résultats',
        ghost: 'schumpeter',
        advice: 'Défends ta trajectoire : les esprits entreprenants s’expriment au-delà du cadre scolaire standard.',
        outcome: 'M. Girard prend ta défense lors des délibérations en valorisant ta curiosité économique.',
        effects: { relations: { char_prof_histoire_girard: 6 }, reputation: 3, moral: 3 },
      },
    ],
  },
  {
    id: 'sch_conseil_convocation',
    title: 'Rendez-vous tripartite avec les parents',
    minAge: 14,
    tier: 1,
    characters: ['char_principal_vasseur', 'char_cpe_benali'],
    text: 'Tes parents sont reçus par M. Vasseur pour un point d’étape. Nora a pris sur ses heures de repos d’aide-soignante et Thierry a garé son break du Drive devant le collège, soucieux d’un éventuel reproche.',
    options: [
      {
        label: 'Prendre la parole devant le principal pour rassurer tes parents avec sincérité',
        ghost: 'rousseau',
        advice: 'La clarté du cœur désamorce la gravité institutionnelle. Assume tes choix avec dignité.',
        outcome: 'Tes explications structurées touchent M. Vasseur. Thierry sourit discrètement et Nora respire enfin.',
        effects: { relations: { char_cpe_benali: 6, char_principal_vasseur: 4 }, pride: 6, moral: 5, stress: -3 },
      },
      {
        label: 'Présenter un bilan équilibré de ton temps entre cours et activités locales',
        ghost: 'smith',
        advice: 'Montre que la gestion du temps est un art maîtrisé : prouve que le travail scolaire reste prioritaire.',
        outcome: 'Mme Benali valide ton sérieux. Tes parents repartent fiers et rassurés sur ton avenir.',
        effects: { pride: 5, reputation: 4, average: 0.2 },
      },
    ],
  },
  {
    id: 'sch_conseil_negociation',
    title: 'Explication de note avec le professeur de technologie',
    minAge: 14,
    tier: 1,
    characters: ['char_prof_techno_lambert', 'char_prof_maths_moreau'],
    text: 'En technologie, une mauvaise note d’évaluation collective pénalise ton trimestre à cause du désistement d’un binôme. Tu as pourtant réalisé en autonomie la maquette 3D et le schéma de montage du circuit.',
    options: [
      {
        label: 'Démontrer point par point ta contribution réelle au projet',
        ghost: 'ricardo',
        advice: 'La rétribution du travail doit correspondre à la valeur effectivement produite par chacun.',
        outcome: 'M. Lambert inspecte tes plans annotés et réévalue ta note à 17/20 en louant ton autonomie.',
        effects: { average: 0.4, relations: { char_prof_techno_lambert: 6 }, pride: 4 },
      },
      {
        label: 'Proposer de refaire une session d’atelier pour aider ton binôme en difficulté',
        ghost: 'ostrom',
        advice: 'Ne laisse personne derrière : la réussite partagée renforce le groupe et rétablit la justice.',
        outcome: 'Votre binôme présente une version finalisée le vendredi suivant. Le professeur salue cet esprit d’équipe.',
        effects: { average: 0.3, moral: 4, reputation: 4 },
      },
    ],
  },
  {
    id: 'sch_conseil_felicitations',
    title: 'Félicitations officielles du conseil de classe',
    minAge: 14,
    tier: 2,
    characters: ['char_principal_vasseur', 'char_cpe_benali', 'char_eleve_delegue_sacha'],
    text: 'Lors du conseil de classe du troisième trimestre, M. Vasseur proclame les Félicitations officielles pour ton investissement exceptionnel dans la vie de l’établissement et tes résultats remarquables.',
    options: [
      {
        label: 'Dédier cette réussite au soutien de tes camarades et de ta famille',
        ghost: 'bourdieu',
        advice: 'Rappelle que le succès individuel s’enracine dans les solidarités populaires qui l’ont rendu possible.',
        outcome: 'Sacha et tes camarades t’ovationnent. À la maison, Nora verse une larme de bonheur sur le bulletin.',
        effects: { pride: 8, moral: 7, reputation: 6, relations: { char_cpe_benali: 6 } },
      },
      {
        label: 'Remercier le corps enseignant pour la rigueur de leur transmission',
        ghost: 'weber',
        advice: 'L’institution mérite le respect quand elle récompense l’effort sans céder au favoritisme.',
        outcome: 'M. Vasseur note ton comportement exemplaire au dossier scolaire pour l’entrée au lycée.',
        effects: { pride: 6, average: 0.2, reputation: 5, relations: { char_principal_vasseur: 8 } },
      },
    ],
  },

  // =========================================================================
  // ARC 6 : Brevet des collèges à 15 ans (épreuves blanches, révisions ouvrières, matin examen, résultats)
  // =========================================================================
  {
    id: 'sch_brevet_epreuves_blanches',
    title: 'La grande répétition des épreuves blanches',
    minAge: 15,
    tier: 2,
    characters: ['char_prof_maths_moreau', 'char_prof_francais_fontaine', 'lina'],
    text: 'Semaine de brevet blanc. Deux heures d’épreuve de mathématiques suivies de trois heures de français. La pendule tourne sur le mur de la salle polyvalente, le silence n’est troublé que par le froissement des copies d’examen.',
    options: [
      {
        label: 'Gérer ton temps à la minute près : quarante minutes par exercice et relecture stricte',
        ghost: 'taylor',
        advice: 'L’épreuve est une course d’optimisation. Ne perds pas une seconde sur un blocage temporaire.',
        outcome: 'Tu termines l’intégralité du sujet avec dix minutes d’avance pour vérifier les calculs.',
        effects: { average: 0.5, stress: 3, pride: 4 },
      },
      {
        label: 'Prendre le temps de soigner le fond et l’élégance de la rédaction',
        ghost: 'rousseau',
        advice: 'La pensée claire trouve ses mots naturellement : ne sacrifie jamais le sens à la vitesse.',
        outcome: 'Mme Fontaine attribue la note maximale à ta dissertation sur le travail et la liberté.',
        effects: { average: 0.4, moral: 4, relations: { char_prof_francais_fontaine: 6 } },
      },
    ],
  },
  {
    id: 'sch_brevet_revisions_ouvrieres',
    title: 'Révisions d’histoire sur la table de cuisine',
    minAge: 15,
    tier: 2,
    characters: ['char_prof_histoire_girard', 'char_eleve_decrocheur_dylan', 'lina'],
    text: 'À la veille de l’épreuve d’histoire-géographie, vous vous réunissez autour de la table de cuisine familiale. Lina a préparé des chronologies sur l’Europe industrielle et Dylan tente de mémoriser les grandes dates des réformes sociales.',
    options: [
      {
        label: 'Expliquer les leçons à travers l’histoire concrète des usines de Val-Ferrand',
        ghost: 'marx',
        advice: 'L’histoire prend vie quand on l’incarne dans les luttes réelles de ceux qui ont bâti la cité.',
        outcome: 'Dylan retient tout grâce aux anecdotes locales de la vallée. Le groupe se sent prêt et confiant.',
        effects: { relations: { char_eleve_decrocheur_dylan: 8, lina: 6 }, average: 0.3, moral: 6, pride: 4 },
      },
      {
        label: 'Interroger chacun à tour de rôle sur les définitions constitutionnelles',
        ghost: 'weber',
        advice: 'La maîtrise du droit et des institutions démocratiques est la clé de voûte de l’examen civique.',
        outcome: 'Les concepts républicains sont parfaitement assimilés. Vos révisions portent leurs fruits.',
        effects: { average: 0.4, moral: 4, stress: -2 },
      },
    ],
  },
  {
    id: 'sch_brevet_matin_examen',
    title: 'Le matin décisif devant les grilles closes',
    minAge: 15,
    tier: 2,
    characters: ['char_cpe_benali', 'noah', 'char_eleve_artiste_zoe'],
    text: 'C’est le grand matin du brevet officiel. Le ciel est gris et lourd au-dessus de Jean-Moulin. Une foule anxieuse piétine devant les grilles en vérifiant convocations et pièces d’identité. Noah a les mains moites et Zoé respire calmement.',
    options: [
      {
        label: 'Partager des paroles réconfortantes pour dissiper l’anxiété ambiante',
        ghost: 'dejours',
        advice: 'Le collectif apaise la détresse de l’épreuve : un mot chaleureux redonne la confiance perdue.',
        outcome: 'Tes encouragements calment Noah et plusieurs camarades stressés. Vous entrez d’un pas assuré.',
        effects: { relations: { noah: 6, char_eleve_artiste_zoe: 6 }, stress: -4, moral: 6, reputation: 4 },
      },
      {
        label: 'Te concentrer intérieurement en visualisant ta réussite à venir',
        ghost: 'schumpeter',
        advice: 'L’esprit d’initiative se forge dans le calme avant l’effort. Focalise toute ton énergie.',
        outcome: 'Une concentration sans faille t’accompagne dès l’ouverture des enveloppes scellées.',
        effects: { average: 0.3, stress: -2, pride: 4 },
      },
    ],
  },
  {
    id: 'sch_brevet_resultats',
    title: 'Affichage des résultats sous les acclamations',
    minAge: 15,
    tier: 2,
    characters: ['char_principal_vasseur', 'char_prof_histoire_girard', 'lina', 'noah'],
    text: 'Dix heures : les grandes grilles s’ouvrent et les listes officielles sont placardées sur les vitres du hall. Les cris de joie et les sourires éclatent. Ton nom figure en tête avec la mention Très Bien, tandis que Lina, Noah et Dylan sont également admis.',
    options: [
      {
        label: 'Fêter cette victoire collective avec tous tes camarades réunis',
        ghost: 'bourdieu',
        advice: 'Savoure ce moment où la barrière scolaire s’incline devant la ténacité des enfants de la vallée.',
        outcome: 'Accolades et chants sous le préau. Thierry et Nora klaxonnent en arrivant pour t’embrasser avec fierté.',
        effects: { pride: 10, moral: 8, reputation: 8, average: 0.5, relations: { lina: 8, noah: 8 } },
      },
      {
        label: 'Penser déjà aux étapes suivantes : l’orientation et le choix du lycée',
        ghost: 'smith',
        advice: 'Un palier franchi n’est qu’un point de départ pour une entreprise plus vaste. Regarde au loin.',
        outcome: 'M. Girard te remet ta fiche d’orientation avec des éloges appuyés. La route vers l’émancipation est ouverte.',
        effects: { pride: 8, reputation: 6, average: 0.4, moral: 5 },
      },
    ],
  },

  // =========================================================================
  // ARC 7 : Vie collégienne & initiatives (foyer coopératif, cross solidaire, stand goûters, journal collège)
  // =========================================================================
  {
    id: 'sch_vie_foyer_cooperatif',
    title: 'Aménagement coopératif du foyer des élèves',
    minAge: 13,
    tier: 1,
    characters: ['char_cpe_benali', 'char_prof_techno_lambert', 'char_eleve_artiste_zoe'],
    text: 'L’ancien foyer des élèves n’est plus qu’une pièce grise aux chaises cassées. Avec Mme Benali et M. Lambert, vous proposez de le rénover entièrement en atelier coopératif grâce à des matériaux récupérés à la Friche Taret.',
    options: [
      {
        label: 'Organiser un chantier participatif où chacun fabrique un meuble',
        ghost: 'ostrom',
        advice: 'On respecte ce qu’on a bâti soi-même : l’appropriation collective garantit la longévité du lieu.',
        outcome: 'Pendant deux samedis, les camarades poncent et peignent. Zoé réalise une fresque magnifique.',
        effects: { relations: { char_cpe_benali: 8, char_prof_techno_lambert: 8, char_eleve_artiste_zoe: 6 }, moral: 7, reputation: 6, pride: 5 },
      },
      {
        label: 'Standardiser les plans d’étagères et de banquettes pour aller vite',
        ghost: 'taylor',
        advice: 'Un plan modulaire reproductible économise les découpes et optimise l’espace disponible.',
        outcome: 'L’atelier de techno produit vingt banquettes robustes en un temps record.',
        effects: { relations: { char_prof_techno_lambert: 8 }, reputation: 4, pride: 4 },
      },
    ],
  },
  {
    id: 'sch_vie_cross_solidaire',
    title: 'Logistique du cross solidaire au parc des Berges',
    minAge: 13,
    tier: 1,
    characters: ['char_prof_eps_sanchez', 'char_eleve_decrocheur_dylan', 'noah'],
    text: 'Le cross annuel du collège au parc des Berges approche. M. Sanchez cherche une équipe d’élèves responsables pour baliser le parcours, tenir le chronomètre et approvisionner le ravitaillement pour quatre cents coureurs.',
    options: [
      {
        label: 'Mettre en place un stand de ravitaillement fluide et continu',
        ghost: 'ford',
        advice: 'Aucun coureur ne doit s’arrêter : distribue gobelets et quartiers d’orange à la chaîne.',
        outcome: 'La logistique tourne sans le moindre encombrement. M. Sanchez te félicite chaleureusement.',
        effects: { relations: { char_prof_eps_sanchez: 8, noah: 4 }, reputation: 5, pride: 4 },
      },
      {
        label: 'Courir en serre-file pour encourager les camarades à la traîne',
        ghost: 'dejours',
        advice: 'La vraie grandeur d’un groupe se mesure au soin apporté à ceux qui peinent en queue de peloton.',
        outcome: 'Avec Dylan, vous accompagnez les derniers jusqu’à la ligne d’arrivée sous les vivats généraux.',
        effects: { relations: { char_eleve_decrocheur_dylan: 8, char_prof_eps_sanchez: 6 }, moral: 6, reputation: 4 },
      },
    ],
  },
  {
    id: 'sch_vie_stand_gouters',
    title: 'Le stand de goûters devant les grilles de 16h30',
    minAge: 12,
    tier: 1,
    characters: ['char_principal_vasseur', 'char_eleve_rival_alexis', 'noah'],
    text: 'À la sortie de 16h30 devant les grilles, la file pour ton stand de goûters s’allonge sur le trottoir. Alexis s’arrête avec son vélo et interpelle M. Vasseur en prétendant que ton commerce bloque le passage des piétons.',
    options: [
      {
        label: 'Montrer l’autorisation municipale d’occupation temporaire du domaine public',
        ghost: 'weber',
        advice: 'Face aux dénonciations, seule la légalité documentaire protège : brandis le tampon officiel.',
        outcome: 'Le principal examine le document signé par la mairie. Alexis repart bredouille et déconfit.',
        effects: { relations: { char_principal_vasseur: 6, char_eleve_rival_alexis: -6 }, reputation: 6, pride: 4 },
      },
      {
        label: 'Accélérer le service et organiser une file fluide avec Noah',
        ghost: 'smith',
        advice: 'Désamorce la critique par l’efficacité : une clientèle bien ordonnée ne gêne personne.',
        outcome: 'En cinq minutes, tous les goûters sont servis dans l’ordre. Les clients remercient ton efficacité.',
        effects: { relations: { noah: 6 }, reputation: 5, stress: 2 },
      },
    ],
  },
  {
    id: 'sch_vie_journal_college',
    title: 'Tribune d’ouverture dans le journal L’Étincelle',
    minAge: 13,
    tier: 1,
    characters: ['char_documentaliste_aubert', 'yasmine', 'char_prof_francais_fontaine'],
    text: 'Au CDI, Yasmine relance le journal du collège « L’Étincelle » et souhaite publier une grande enquête sur la vie économique de Val-Ferrand et les initiatives des jeunes. Elle te propose d’écrire la tribune d’ouverture.',
    options: [
      {
        label: 'Rédiger un article sur la dignité du travail ouvrier et l’avenir de la jeunesse',
        ghost: 'marx',
        advice: 'Fais entendre la voix de ceux que les discours officiels ignorent : écris pour éclairer les esprits.',
        outcome: 'Le journal s’arrache à trois cents exemplaires. Mme Fontaine et M. Girard félicitent ta plume engagée.',
        effects: { relations: { yasmine: 8, char_documentaliste_aubert: 6 }, average: 0.3, reputation: 6, moral: 5, pride: 4 },
      },
      {
        label: 'Partager ton expérience de la création d’activité et des circuits courts',
        ghost: 'schumpeter',
        advice: 'Inspire tes camarades en montrant que l’esprit d’initiative commence au coin de la rue.',
        outcome: 'L’article donne envie à plusieurs camarades de lancer leurs propres projets coopératifs.',
        effects: { relations: { yasmine: 6 }, reputation: 5, average: 0.2, moral: 4, pride: 4 },
      },
    ],
  },
];

// =========================================================================
// 30 Moments de classe immersifs et variés (CLASS_MOMENTS_EXT)
// =========================================================================
export const CLASS_MOMENTS_EXT: readonly { text: string; comprehension: number; mood: number }[] = [
  {
    text: 'En cours de mathématiques, Mme Moreau trace des courbes de probabilité au tableau. Tu visualises instantanément tes flux de vente de la semaine.',
    comprehension: 2,
    mood: 2,
  },
  {
    text: 'M. Girard projette une carte de la vallée du Taret en 1910. Tu repères la rue où se trouve l’atelier avant même qu’il ne la nomme.',
    comprehension: 1,
    mood: 3,
  },
  {
    text: 'Un exercice d’accord grammatical épineux en français. Mme Fontaine sourit en voyant ta copie sans la moindre rature.',
    comprehension: 2,
    mood: 1,
  },
  {
    text: 'En technologie, le fer à souder fume doucement. M. Lambert t’apprend à réparer un interrupteur plutôt qu’à en racheter un neuf.',
    comprehension: 2,
    mood: 2,
  },
  {
    text: 'Interrogation surprise de vocabulaire anglais. Les faux amis te tendent des pièges, mais tu t’en sors avec les honneurs.',
    comprehension: 1,
    mood: 0,
  },
  {
    text: 'Séance d’endurance sous la bruine avec M. Sanchez. Tu cales ton souffle sur celui de Dylan pour l’aider à tenir les six tours de piste.',
    comprehension: 0,
    mood: 3,
  },
  {
    text: 'En physique-chimie, l’expérience sur la tension électrique échoue dans un petit nuage blanc inoffensif. Rires complices sur la paillasse.',
    comprehension: 1,
    mood: 2,
  },
  {
    text: 'Au CDI, Mme Aubert te réserve discrètement un ouvrage rare sur les coopératives de production du dix-neuvième siècle.',
    comprehension: 2,
    mood: 3,
  },
  {
    text: 'Pendant le cours d’arts plastiques, Zoé te montre comment donner du relief aux briques industrielles avec un simple lavis d’encre.',
    comprehension: 1,
    mood: 4,
  },
  {
    text: 'En éducation musicale, l’écoute d’un chant traditionnel des mineurs gallois donne des frissons à toute la rangée.',
    comprehension: 1,
    mood: 1,
  },
  {
    text: 'Noah fait tomber sa trousse en plein milieu d’une démonstration géométrique silencieuse. Mme Moreau soupire sans sévérité.',
    comprehension: 0,
    mood: 1,
  },
  {
    text: 'En SVT, l’observation des micro-organismes du canal au microscope révèle un monde foisonnant insoupçonné.',
    comprehension: 2,
    mood: 2,
  },
  {
    text: 'Le soleil de mai tape contre les rideaux orange de la salle 104. La classe lutte contre la somnolence du début d’après-midi.',
    comprehension: 0,
    mood: -1,
  },
  {
    text: 'Débat animé en éducation morale et civique sur la répartition du budget municipal. Tes arguments économiques font mouche.',
    comprehension: 2,
    mood: 4,
  },
  {
    text: 'Une dictée difficile d’un texte classique. Tu prends le temps de peser chaque terminaison pour éviter les pièges.',
    comprehension: 1,
    mood: 1,
  },
  {
    text: 'En technologie, l’imprimante 3D termine une pièce de rechange conçue par tes soins. M. Lambert hoche la tête avec approbation.',
    comprehension: 2,
    mood: 3,
  },
  {
    text: 'Un contrôle de géographie économique sur les corridors de fret européens. Les trajets de camions de ton père t’aident à tout retenir.',
    comprehension: 2,
    mood: 2,
  },
  {
    text: 'Dylan te glisse un schéma de fixation de porte-bagages dessiné pendant le cours d’histoire. Pas très scolaire, mais très ingénieux.',
    comprehension: 1,
    mood: 2,
  },
  {
    text: 'Mme Moreau explique le calcul des intérêts composés. Dans ton esprit, la formule s’illumine comme une évidence marchande.',
    comprehension: 2,
    mood: 3,
  },
  {
    text: 'Lina t’emprunte un stylo en te laissant sur le coin de table un résumé manuscrit parfait du chapitre précédent.',
    comprehension: 1,
    mood: 2,
  },
  {
    text: 'Une heure de permanence studieuse au réfectoire. Le silence permet d’avancer les devoirs avant la tournée du soir.',
    comprehension: 1,
    mood: 1,
  },
  {
    text: 'En EPS, tournoi de badminton par équipes. Vous remportez la finale de classe après un échange acharné au filet.',
    comprehension: 0,
    mood: 4,
  },
  {
    text: 'Exposé de Yasmine sur les lanceurs d’alerte environnementaux. Les échanges se poursuivent bien après la sonnerie de fin de cours.',
    comprehension: 2,
    mood: 3,
  },
  {
    text: 'Tu retrouves un brouillon de calcul de marge griffonné au dos d’une feuille de physique. Heureusement, la prof ne l’a pas vu.',
    comprehension: 0,
    mood: 1,
  },
  {
    text: 'Le chauffage de la salle de français tombe en panne un matin de janvier. On garde les écharpes et on lit Zola emmitouflés.',
    comprehension: 1,
    mood: -1,
  },
  {
    text: 'En arts plastiques, ton affiche pour le recyclage des métaux est affichée dans le hall d’entrée par Mme Pinto.',
    comprehension: 1,
    mood: 4,
  },
  {
    text: 'Mme Benali passe dans les rangs pour distribuer les fiches d’orientation. Un frisson d’anticipation parcourt les tables.',
    comprehension: 1,
    mood: 2,
  },
  {
    text: 'En cours de chimie, tu comprends le principe de conservation de la matière : « rien ne se perd, tout se transforme ». Cela vaut aussi pour l’artisanat.',
    comprehension: 2,
    mood: 2,
  },
  {
    text: 'La sirène d’exercice d’évacuation retentit en plein milieu d’une équation. Rassemblement ordonné dans la cour sous les ordres de M. Sanchez.',
    comprehension: 0,
    mood: 1,
  },
  {
    text: 'Dernière heure du vendredi avant le week-end. Les sacs sont déjà bouclés, l’esprit est tourné vers les projets de la place.',
    comprehension: 0,
    mood: 3,
  },
];
