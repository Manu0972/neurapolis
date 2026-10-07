/**
 * Parents et vie scolaire (docs/ASCENSION.md & docs/VISION.md).
 * Nora (aide-soignante de nuit à l’hôpital de Val-Ferrand) et Thierry (ancien fondeur,
 * cariste au Drive HyperVal). Les répliques du foyer et la galerie de personnages du collège.
 */

export interface FamilyLine {
  id: string;
  speaker: 'nora' | 'thierry' | 'les_deux';
  when:
    | 'diner'
    | 'absence'
    | 'convocation'
    | 'bonne_note'
    | 'mauvaise_note'
    | 'reussite_business'
    | 'echec_business'
    | 'fatigue'
    | 'nuit_blanche'
    | 'anniversaire';
  mood: 'fier' | 'inquiet' | 'fache' | 'tendre' | 'espoir';
  text: string;
  replies: {
    label: string;
    effect: { trust: number; worry: number; pride: number };
    answer: string;
  }[];
}

export interface SchoolCharacter {
  id: string;
  name: string;
  role: string;
  traits: string[];
  bio: string;
  dealPossible?: string;
}

export const FAMILY_LINES: readonly FamilyLine[] = [
  // ---------- DÎNER (Repas du soir dans la Cité des Roses) ----------
  {
    id: 'fam_diner_nora_soupe_etudes',
    speaker: 'nora',
    when: 'diner',
    mood: 'inquiet',
    text: 'Mange ta soupe pendant qu’elle est chaude. J’ai croisé la mère de Lina à la pharmacie : elle m’a dit que vous avez un gros devoir commun d’histoire demain. Tu as révisé, ou tu étais encore à compter tes sous avec Noah ?',
    replies: [
      {
        label: 'J’ai révisé deux heures au CDI, maman, tout est calé.',
        effect: { trust: 2, worry: -2, pride: 1 },
        answer: 'Bien. Je préfère ça. Le bac, chez les {nom}, ça ne sera pas une option mais un passeport.',
      },
      {
        label: 'On a révisé tout en faisant l’inventaire du stand.',
        effect: { trust: 1, worry: 1, pride: 1 },
        answer: 'Tu mélanges toujours tout. J’espère que tes chiffres ne te feront pas oublier tes dates de cours.',
      },
      {
        label: 'Le commerce m’apprend plus sur l’économie que les manuels.',
        effect: { trust: -1, worry: 3, pride: 0 },
        answer: 'Ne commence pas à faire ton grand. Sans diplôme, dans cette vallée, on finit brisé en trois-huit.',
      },
    ],
  },
  {
    id: 'fam_diner_thierry_hyperval_palette',
    speaker: 'thierry',
    when: 'diner',
    mood: 'inquiet',
    text: 'Aujourd’hui au Drive HyperVal, on a déchargé quarante-deux palettes de biscuits premier prix venus de Pologne. Des cartons à trois euros. Je me demande comment tes petits sachets de gâteaux peuvent tenir le coup face à des mastodontes pareils.',
    replies: [
      {
        label: 'Parce que nos gâteaux sont frais et viennent de chez Bertin, papa.',
        effect: { trust: 2, worry: -1, pride: 2 },
        answer: 'C’est vrai que leur carton de supermarché a un goût de plâtre. Les gens du quartier le savent encore, heureusement.',
      },
      {
        label: 'On va grandir nous aussi et acheter en gros pour baisser les coûts.',
        effect: { trust: 0, worry: 2, pride: 1 },
        answer: 'Attention aux illusions de grandeur. J’ai vu des contremaîtres se casser les dents à vouloir singer les Américains.',
      },
    ],
  },
  {
    id: 'fam_diner_les_deux_bulletin_approche',
    speaker: 'les_deux',
    when: 'diner',
    mood: 'espoir',
    text: 'Le conseil de classe du premier trimestre approche. Nora te regarde par-dessus ses lunettes de lecture, pendant que Thierry étale du beurre sur son pain de mie.',
    replies: [
      {
        label: 'Mes notes sont stables, je suis dans le premier tiers de classe.',
        effect: { trust: 3, worry: -2, pride: 2 },
        answer: 'Nora sourit doucement : « Voilà ce que je voulais entendre. Ton grand-père Lucien en aurait été fier. »',
      },
      {
        label: 'C’est un peu juste en maths, mais je compense en géo et en français.',
        effect: { trust: 1, worry: 1, pride: 0 },
        answer: 'Thierry hoche la tête : « Demande à Lina de t’aider pour les fractions. Il faut savoir compter vite et juste. »',
      },
    ],
  },
  {
    id: 'fam_diner_nora_garde_de_nuit',
    speaker: 'nora',
    when: 'diner',
    mood: 'tendre',
    text: 'Je prends mon service de nuit aux urgences à 21h30. Tu me promets que tu seras couché à 22h et que tu n’auras pas ton nez collé sur ton calepin de commandes ?',
    replies: [
      {
        label: 'Promis maman, je dors tôt pour être en forme au collège.',
        effect: { trust: 2, worry: -2, pride: 1 },
        answer: 'Merci mon grand. Prends soin de ton père, il a le dos en compote après sa journée au chariot élévateur.',
      },
      {
        label: 'J’ai juste un bon de livraison à signer avant de dormir.',
        effect: { trust: -1, worry: 2, pride: 0 },
        answer: 'Tu es têtu comme ton grand-père. À douze ans, on signe des devoirs, pas des bons de livraison !',
      },
    ],
  },
  {
    id: 'fam_diner_thierry_souvenir_usine',
    speaker: 'thierry',
    when: 'diner',
    mood: 'tendre',
    text: 'En passant devant la Friche ce soir, j’ai vu de la lumière dans l’atelier de Karim. Ça m’a rappelé l’odeur de la fonte en fusion quand les coulées du soir démarraient.',
    replies: [
      {
        label: 'Karim m’aide beaucoup pour réparer mon matériel de transport.',
        effect: { trust: 2, worry: -1, pride: 2 },
        answer: 'C’est un chic type, Karim. Son père travaillait à la maintenance des ponts roulants avec moi.',
      },
      {
        label: 'Un jour, on réouvrira les hangars pour fabriquer des choses modernes.',
        effect: { trust: 1, worry: 0, pride: 3 },
        answer: 'Thierry te regarde avec une lueur fière : « Si quelqu’un dans cette famille peut le faire, c’est bien toi. »',
      },
    ],
  },

  // ---------- ABSENCE & RETARDS (Sécher les cours pour le business) ----------
  {
    id: 'fam_absence_mot_cpe_injustifiee',
    speaker: 'nora',
    when: 'absence',
    mood: 'fache',
    text: 'J’ai reçu un appel de Mme Benali pendant mon quart à l’hôpital ! Deux heures d’absence injustifiée mardi matin ! Où étais-tu ? Tu as intérêt à me donner une bonne raison !',
    replies: [
      {
        label: 'J’ai dû réceptionner une livraison urgente chez Bertin avant qu’elle ne reparte.',
        effect: { trust: -2, worry: 3, pride: -1 },
        answer: 'Tu as séché les maths pour des cartons de jus de pomme ?! Tu perds complètement la tête ! Tu es puni de sortie ce week-end !',
      },
      {
        label: 'J’étais avec Noah qui avait fait un malaise, on est allés à l’infirmerie.',
        effect: { trust: -3, worry: 2, pride: -2 },
        answer: 'Menteur ! Mme Benali a vérifié le registre de l’infirmerie. Ne me mens plus jamais en face, {nom} !',
      },
      {
        label: 'Pardon maman... J’ai mal calculé mon temps. Je rattraperai les cours sur le cahier de Lina.',
        effect: { trust: 1, worry: 1, pride: 0 },
        answer: 'Tu as intérêt. Une seule autre absence non justifiée, et je confisque tout ton matériel de vente.',
      },
    ],
  },
  {
    id: 'fam_absence_thierry_decouverte_marche',
    speaker: 'thierry',
    when: 'absence',
    mood: 'inquiet',
    text: 'Mon collègue de l’entrepôt t’a aperçu sur la place du Marché jeudi à dix heures, en train de négocier des cagettes. Tu devais être en cours de SVT. Qu’est-ce qui te prend ?',
    replies: [
      {
        label: 'C’était le seul créneau pour obtenir le rabais de la coopérative.',
        effect: { trust: -1, worry: 2, pride: 1 },
        answer: 'L’argent ne vaut rien si tu finis sans diplôme. Je me tue le dos au Drive pour que tu aies le choix que je n’ai jamais eu.',
      },
      {
        label: 'J’ai terminé mon devoir en avance avec la bénédiction du prof.',
        effect: { trust: 0, worry: 1, pride: 0 },
        answer: 'Je vérifierai avec le carnet de correspondance. Ne joue pas avec le feu.',
      },
    ],
  },
  {
    id: 'fam_absence_retard_repetitif_matin',
    speaker: 'nora',
    when: 'absence',
    mood: 'fache',
    text: 'Trois retards de vingt minutes en dix jours au collège. Tu as des cernes sous les yeux comme si tu faisais les trois-huit avec moi !',
    replies: [
      {
        label: 'Je prépare les commandes tôt le matin pour les livrer avant la première sonnerie.',
        effect: { trust: -1, worry: 3, pride: 0 },
        answer: 'Ton travail à ton âge, c’est d’arriver à l’heure en classe et de lever la main pour poser des questions !',
      },
      {
        label: 'Je vais décaler la préparation des colis au soir après mes devoirs.',
        effect: { trust: 2, worry: -1, pride: 1 },
        answer: 'C’est ça ou tu arrêtes tout. Je ne rigole pas avec ta santé.',
      },
    ],
  },

  // ---------- CONVOCATION AU COLLÈGE ----------
  {
    id: 'fam_convocation_principal_bureau',
    speaker: 'les_deux',
    when: 'convocation',
    mood: 'fache',
    text: 'Nora et Thierry sont assis dans le salon, une lettre à en-tête officiel du collège Jean-Moulin posée sur la nappe en toile cirée.',
    replies: [
      {
        label: 'Je vous promets que je n’ai rien fait de mal, j’ai juste vendu des goûters dans les règles.',
        effect: { trust: 1, worry: 2, pride: 0 },
        answer: 'Thierry tape du poing sur la table : « Le principal écrit qu’il y a un trafic commercial non autorisé dans l’enceinte scolaire ! »',
      },
      {
        label: 'M. Vasseur veut me voir parce qu’il s’inquiète de la concurrence avec la cantine.',
        effect: { trust: 2, worry: 1, pride: 1 },
        answer: 'Nora soupire : « Alors on ira ensemble demain matin. Et tu le laisseras parler en premier. »',
      },
    ],
  },
  {
    id: 'fam_convocation_cpe_sanction_evitee',
    speaker: 'nora',
    when: 'convocation',
    mood: 'inquiet',
    text: 'Mme Benali m’a dit que tu étais intelligent mais que tu défiais l’autorité de l’établissement avec tes affaires de grand. Elle ne veut pas te sanctionner mais elle exige un engagement.',
    replies: [
      {
        label: 'Je déplacerai toutes mes activités hors du collège, sur la place des Roses.',
        effect: { trust: 3, worry: -2, pride: 2 },
        answer: 'Sage décision. Le collège doit rester le sanctuaire de tes études.',
      },
      {
        label: 'On va demander l’autorisation de créer un foyer coopératif légal.',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Si c’est cadré avec les professeurs et les parents d’élèves, je te soutiendrai.',
      },
    ],
  },

  // ---------- BONNES NOTES & SUCCÈS SCOLAIRE ----------
  {
    id: 'fam_bonne_note_maths_moreau',
    speaker: 'nora',
    when: 'bonne_note',
    mood: 'fier',
    text: '18/20 en contrôle de mathématiques avec Mme Moreau ! Avec le commentaire : "Raisonnement logique remarquable et calculs de pourcentages d’une rapidité exceptionnelle." !',
    replies: [
      {
        label: 'À force de calculer des pourcentages de marge et de TVA, c’est devenu facile !',
        effect: { trust: 3, worry: -2, pride: 3 },
        answer: 'Nora t’embrasse sur le front avec émotion : « Tu vois que ton esprit est brillant ! Continue comme ça mon trésor. »',
      },
      {
        label: 'C’est grâce aux fiches de révision qu’on s’est partagées avec Lina.',
        effect: { trust: 2, worry: -2, pride: 2 },
        answer: 'Cette petite Lina a une excellente influence sur toi. Garde-la précieusement comme amie.',
      },
    ],
  },
  {
    id: 'fam_bonne_note_histoire_taret',
    speaker: 'thierry',
    when: 'bonne_note',
    mood: 'fier',
    text: 'Tu as eu 17 en exposé d’histoire sur la Révolution Industrielle dans le bassin du Taret. Le prof a écrit que ton devoir méritait d’être lu en salle des professeurs.',
    replies: [
      {
        label: 'J’ai juste recopié les notes que papy Lucien avait écrites dans ses livres.',
        effect: { trust: 3, worry: -1, pride: 3 },
        answer: 'Thierry a les larmes aux yeux : « Ton grand-père... il savait tout de cette ville. Tu portes sa mémoire haut et fort. »',
      },
      {
        label: 'J’ai interviewé Samir et Karim à l’atelier pour avoir des témoignages vivants.',
        effect: { trust: 2, worry: -1, pride: 2 },
        answer: 'Les vrais ouvriers racontent mieux l’Histoire que tous les dictionnaires parisiens.',
      },
    ],
  },
  {
    id: 'fam_bonne_note_felicitations_trimestre',
    speaker: 'les_deux',
    when: 'bonne_note',
    mood: 'espoir',
    text: 'Le bulletin du trimestre est arrivé : Félicitations du conseil de classe avec 15,8 de moyenne générale. Nora pose un gâteau au chocolat sur la table.',
    replies: [
      {
        label: 'Merci papa, merci maman. C’est pour vous que je réussis.',
        effect: { trust: 4, worry: -3, pride: 4 },
        answer: 'Thierry sourit à pleines dents : « Ce soir, la fête est pour le futur patron de la maison ! »',
      },
      {
        label: 'Ça prouve qu’on peut gérer ses affaires et être premier de la classe !',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Nora tempère en souriant : « Ne te repose pas sur tes lauriers, monsieur le jeune prodige ! »',
      },
    ],
  },

  // ---------- MAUVAISES NOTES & ALERTES SCOLAIRES ----------
  {
    id: 'fam_mauvaise_note_anglais_catastrophe',
    speaker: 'nora',
    when: 'mauvaise_note',
    mood: 'fache',
    text: 'Un 06/20 en anglais ! La prof a noté : "Élève endormi sur sa table, vocabulaire commercial inadapté au cours de grammaire" !',
    replies: [
      {
        label: 'J’ai confondu le vocabulaire du cours avec les termes de facturation...',
        effect: { trust: -1, worry: 3, pride: -1 },
        answer: 'Comment tu veux faire du commerce si tu ne parles même pas la langue du monde entier ? Au travail !',
      },
      {
        label: 'Je vais demander à Lina de m’interroger tous les soirs pendant quinze jours.',
        effect: { trust: 2, worry: 0, pride: 0 },
        answer: 'C’est une promesse. Si au prochain devoir tu n’as pas la moyenne, je coupe l’accès à tes comptes.',
      },
    ],
  },
  {
    id: 'fam_mauvaise_note_oubli_devoir_maison',
    speaker: 'thierry',
    when: 'mauvaise_note',
    mood: 'inquiet',
    text: 'Zéro pour devoir non rendu en technologie. Qu’est-ce qui s’est passé, tu as perdu ton classeur ?',
    replies: [
      {
        label: 'J’avais passé la soirée à compter la caisse de la semaine et j’ai oublié l’heure.',
        effect: { trust: -2, worry: 3, pride: -1 },
        answer: 'L’argent t’aveugle mon petit. Un devoir non rendu, c’est un manque de parole. Ne fais plus jamais ça.',
      },
      {
        label: 'J’ai fait le devoir mais je l’ai laissé sur l’établi de Karim.',
        effect: { trust: 1, worry: 1, pride: 0 },
        answer: 'Passe le chercher demain dès potron-minet et montre-le au professeur avant le début des cours.',
      },
    ],
  },

  // ---------- RÉUSSITE BUSINESS (Bénéfices, nouveaux locaux, réputation) ----------
  {
    id: 'fam_reussite_premier_gros_bilan',
    speaker: 'thierry',
    when: 'reussite_business',
    mood: 'fier',
    text: 'Thierry regarde le livret de caisse que tu as laissé ouvert sur le buffet : « 450 euros de bénéfice net ce mois-ci ? À douze ans et demi ? Tu gagnes plus que mes heures supplémentaires de nuit ! »',
    replies: [
      {
        label: 'C’est pour aider à payer les réparations de la voiture de maman.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Thierry te serre contre son gilet avec une fierté immense : « Garde-le pour ton avenir, trésor. Tu as un cœur d’or. »',
      },
      {
        label: 'Je vais tout réinvestir pour louer un vrai étal sur la place du Marché.',
        effect: { trust: 2, worry: 1, pride: 3 },
        answer: 'L’esprit d’entreprise jusqu’au bout des ongles. Mais mets au moins un tiers sur un livret A.',
      },
    ],
  },
  {
    id: 'fam_reussite_bail_officiel_jaures',
    speaker: 'les_deux',
    when: 'reussite_business',
    mood: 'espoir',
    text: 'Nora tient le contrat de bail commercial avec la mairie de Val-Ferrand. Elle doit le cosigner parce que tu es encore mineur.',
    replies: [
      {
        label: 'Faites-moi confiance, les comptes prévisionnels sont validés par Mme Bertin.',
        effect: { trust: 3, worry: 1, pride: 3 },
        answer: 'Nora prend son stylo d’une main tremblante : « Que Dieu protège tes pas, mon enfant. Je signe. »',
      },
      {
        label: 'Si ça échoue, je rembourserai chaque centime avec mes petits boulots.',
        effect: { trust: 2, worry: 2, pride: 2 },
        answer: 'Thierry pose sa grosse main de fondeur sur ton épaule : « On ne va pas échouer. Les {nom} tiennent bon la barre. »',
      },
    ],
  },
  {
    id: 'fam_reussite_article_presse_regionale',
    speaker: 'nora',
    when: 'reussite_business',
    mood: 'fier',
    text: 'Le journal régional titre : "À Val-Ferrand, la jeunesse réinvente le commerce de proximité". Nora a découpé l’article et l’a aimanté sur le réfrigérateur.',
    replies: [
      {
        label: 'C’est grâce à tout ce que vous m’avez appris sur le travail et l’honnêteté.',
        effect: { trust: 3, worry: -2, pride: 4 },
        answer: 'Tous mes collègues de l’hôpital m’en parlent ce matin. Je n’ai jamais été aussi fière de porter le nom des {nom}.',
      },
      {
        label: 'Ce n’est que la première étape : on va ouvrir dans toute la vallée !',
        effect: { trust: 1, worry: 2, pride: 2 },
        answer: 'Ne t’emballe pas trop vite, garde les pieds sur terre et la tête froide.',
      },
    ],
  },

  // ---------- ÉCHEC BUSINESS (Pertes, pannes, vols) ----------
  {
    id: 'fam_echec_perte_stock_avarie',
    speaker: 'thierry',
    when: 'echec_business',
    mood: 'tendre',
    text: 'Tu as les yeux rouges en rentrant après avoir jeté trois cartons de denrées avariées. Thierry s’assoit en face de toi et te sert un verre de grenadine.',
    replies: [
      {
        label: 'J’ai tout perdu... deux semaines de travail réduites à néant.',
        effect: { trust: 3, worry: -1, pride: 1 },
        answer: 'Un ouvrier casse des pièces avant de savoir forger droit. Perdre fait partie du métier. Ce qui compte, c’est ce que tu as appris.',
      },
      {
        label: 'C’est la faute du fournisseur qui m’a livré en retard !',
        effect: { trust: 0, worry: 2, pride: 0 },
        answer: 'Ne rejette pas la faute sur les autres. Tu aurais dû prévoir un délai de sécurité. Analyse et recommence.',
      },
    ],
  },
  {
    id: 'fam_echec_vol_caisse_tristesse',
    speaker: 'nora',
    when: 'echec_business',
    mood: 'tendre',
    text: 'Après le vol de ta caisse, tu n’arrives pas à avaler ton dîner. Nora te prend dans ses bras comme quand tu avais six ans.',
    replies: [
      {
        label: 'Je voulais tout abandonner... c’est trop dur face aux gens malhonnêtes.',
        effect: { trust: 3, worry: -2, pride: 2 },
        answer: 'Les lâches volent dans l’obscurité, mais toi tu travailles en pleine lumière. Tu vas te relever, et on t’aidera.',
      },
      {
        label: 'Dès demain, j’installe un cadenas blindé et un coffre scellé.',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Voilà l’énergie que j’aime voir chez toi ! Ton grand-père ne baissait jamais les bras.',
      },
    ],
  },

  // ---------- FATIGUE & NUIT BLANCHE ----------
  {
    id: 'fam_fatigue_yeux_cernes_matin',
    speaker: 'nora',
    when: 'fatigue',
    mood: 'inquiet',
    text: 'Tu t’es endormi la tête sur ton bol de céréales ce matin. Ton front est chaud. Tu as besoin d’une vraie nuit de sommeil, pas de quatre heures entre deux calculs d’amortissement.',
    replies: [
      {
        label: 'Je vais dormir dix heures d’affilée ce soir, promis maman.',
        effect: { trust: 2, worry: -3, pride: 1 },
        answer: 'Ce soir, extinction des feux à 20h30. Et je garde ton téléphone dans ma poche de blouse.',
      },
      {
        label: 'Le corps s’habitue aux cadences, c’est le rythme des affaires.',
        effect: { trust: -2, worry: 4, pride: 0 },
        answer: 'Tu as douze ans, ton corps est en train de grandir ! Si tu t’épuises maintenant, tu n’auras plus de forces à vingt ans !',
      },
    ],
  },
  {
    id: 'fam_nuit_blanche_lumiere_sous_la_porte',
    speaker: 'thierry',
    when: 'nuit_blanche',
    mood: 'inquiet',
    text: 'Il est trois heures du matin. Thierry ouvre doucement la porte de ta chambre en caleçon et débardeur, voyant le halo de ta lampe de bureau.',
    replies: [
      {
        label: 'J’ai enfin trouvé comment équilibrer mon budget de trésorerie pour le mois prochain !',
        effect: { trust: 2, worry: 1, pride: 2 },
        answer: 'Thierry éteint doucement l’interrupteur de ta lampe : « Ton budget attendra le soleil. Au lit, champion. »',
      },
      {
        label: 'Je n’arrive pas à dormir, les voix des livres n’arrêtent pas de débattre dans ma tête...',
        effect: { trust: 1, worry: 3, pride: 0 },
        answer: 'Thierry te regarde avec tendresse et inquiétude : « Tu lis trop, mon grand. Laisse reposer ton esprit. »',
      },
    ],
  },

  // ---------- ANNIVERSAIRE (Grandissement de 12 à 16 ans) ----------
  {
    id: 'fam_anniversaire_13_ans_velo',
    speaker: 'les_deux',
    when: 'anniversaire',
    mood: 'fier',
    text: 'Treize ans aujourd’hui ! Dans l’entrée, un vieux vélo d’occasion entièrement retapé, avec des sacoches étanches de livraison fixées au porte-bagages par Karim et Thierry.',
    replies: [
      {
        label: 'C’est le plus beau cadeau de ma vie ! Je vais pouvoir livrer dans tout le quartier !',
        effect: { trust: 4, worry: -1, pride: 4 },
        answer: 'Thierry sourit fièrement : « Mets toujours ton casque, et fais attention aux camions d’HyperVal au carrefour. »',
      },
      {
        label: 'Merci papa, merci maman. Je vous rembourserai le prix des pièces.',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Nora rit : « On ne rembourse pas un cadeau d’anniversaire, petit banquier ! Mange ton gâteau ! »',
      },
    ],
  },
  {
    id: 'fam_anniversaire_14_ans_scooter',
    speaker: 'thierry',
    when: 'anniversaire',
    mood: 'espoir',
    text: 'Quatorze ans. Tu as passé ton BSR. Thierry te tend les clés d’un petit scooter utilitaire d’occasion repeint aux couleurs de tes premières activités.',
    replies: [
      {
        label: 'Avec ça, la vallée entière est à notre portée !',
        effect: { trust: 3, worry: 1, pride: 4 },
        answer: 'Prudence sur la route mouillée le long du canal. Ta vie vaut plus que toutes tes livraisons réunies.',
      },
      {
        label: 'Je promets de rouler calmement et de ne jamais transporter d’amis sans casque.',
        effect: { trust: 4, worry: -2, pride: 3 },
        answer: 'C’est un contrat d’honneur entre nous. Tu deviens un homme digne de ce nom.',
      },
    ],
  },
  {
    id: 'fam_anniversaire_15_ans_bilan_debat',
    speaker: 'nora',
    when: 'anniversaire',
    mood: 'tendre',
    text: 'Quinze ans. Tu entres en classe de seconde. Nora regarde ta taille qui a dépassé la sienne d’un demi-pouce : « Tu as l’âge où ton grand-père est entré à l’usine comme apprenti tourneur. »',
    replies: [
      {
        label: 'Je continuerai ses combats, mais avec les armes du savoir économique moderne.',
        effect: { trust: 4, worry: -2, pride: 5 },
        answer: 'Elle essuie une larme discrète : « Tu es la fierté de notre famille, {nom}. Ne l’oublie jamais. »',
      },
      {
        label: 'Le monde a changé, maman. On va bâtir quelque chose de neuf.',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Bâtis grand, mais n’oublie jamais d’où tu viens ni ceux qui t’ont tendu la main quand tu n’avais rien.',
      },
    ],
  },
  {
    id: 'fam_anniversaire_16_ans_majorite_morale',
    speaker: 'les_deux',
    when: 'anniversaire',
    mood: 'fier',
    text: 'Seize ans. La fête réunit la famille, Noah, Lina, Samir, Karim et Mme Bertin dans la cour des Roses. Thierry lève son verre de cidre en portant un toast.',
    replies: [
      {
        label: 'Ce succès appartient à toute la Cité des Roses et à ceux qui ont cru en moi dès le premier jour.',
        effect: { trust: 5, worry: -3, pride: 5 },
        answer: 'Tous les invités applaudissent à tout rompre sous les lampions du quartier illuminé.',
      },
      {
        label: 'À papy Lucien, qui veille sur nous depuis là-haut.',
        effect: { trust: 5, worry: -2, pride: 5 },
        answer: 'Un grand silence ému traverse l’assemblée, avant que Thierry n’entonne le chant des métallos.',
      },
    ],
  },
  // ---------- DÎNER COMPLÉMENTAIRES ----------
  {
    id: 'fam_diner_nora_fatigue_hopital',
    speaker: 'nora',
    when: 'diner',
    mood: 'tendre',
    text: 'Encore trois admissions d’urgence ce matin à cause du froid dans les barres HLM. La précarité use les gens plus vite que l’âge. Ne crois pas que l’argent protège de tout, mon chéri.',
    replies: [
      {
        label: 'C’est pour ça qu’on doit créer des emplois stables dans la vallée.',
        effect: { trust: 3, worry: -1, pride: 3 },
        answer: 'Si tu y parviens un jour, tu auras sauvé plus de vies que moi aux urgences.',
      },
      {
        label: 'On isolera les appartements de la Cité quand on aura les moyens.',
        effect: { trust: 2, worry: 0, pride: 2 },
        answer: 'Garde ce cœur généreux. Ne le laisse jamais durcir avec les bénéfices.',
      },
    ],
  },
  {
    id: 'fam_diner_thierry_syndicat_crainte',
    speaker: 'thierry',
    when: 'diner',
    mood: 'inquiet',
    text: 'J’ai vu des tracts syndicaux collés sur les portes du dépôt HyperVal. La direction menace de licencier les meneurs. Fais attention à qui tu t’associes dans tes affaires.',
    replies: [
      {
        label: 'Nos contrats sont clairs et nos équipiers sont payés au juste prix.',
        effect: { trust: 3, worry: -2, pride: 2 },
        answer: 'La justice envers ceux qui travaillent pour toi sera toujours ton meilleur bouclier.',
      },
      {
        label: 'Je ne fais pas de politique, je fais tourner des commerces.',
        effect: { trust: -1, worry: 2, pride: 0 },
        answer: 'Tout est politique quand il s’agit de pain et de dignité ouvrière, petit.',
      },
    ],
  },
  {
    id: 'fam_diner_les_deux_voisins_parlent',
    speaker: 'les_deux',
    when: 'diner',
    mood: 'fier',
    text: 'M. Mercier du troisième étage a dit à Nora dans la cage d’escalier que tes livraisons de fruits et légumes avaient changé la vie des personnes âgées de la tour.',
    replies: [
      {
        label: 'Monter les courses au cinquième sans ascenseur, c’est normal pour les voisins.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Thierry sourit : « Ça, c’est l’esprit des {nom}. La serviabilité sans arrogance. »',
      },
      {
        label: 'C’est aussi un modèle de fidélisation très efficace.',
        effect: { trust: 1, worry: 1, pride: 1 },
        answer: 'Nora soupire en souriant : « Tu ne peux pas t’empêcher de tout rationaliser ! »',
      },
    ],
  },
  {
    id: 'fam_diner_thierry_voiture_panne',
    speaker: 'thierry',
    when: 'diner',
    mood: 'inquiet',
    text: 'La vieille Clio a encore calé au feu rouge de la gare. Le garagiste réclame 600 euros pour l’alternateur. Ça va être très serré sur le compte ce mois-ci.',
    replies: [
      {
        label: 'Prends sur la caisse de mes ventes, papa. L’argent est là pour ça.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Thierry refuse d’abord, puis baisse la tête avec pudeur : « Je te le rendrai dès ma prime d’ancienneté. Tu nous sauves. »',
      },
      {
        label: 'Je peux demander à Karim de jeter un œil au moteur gratuitement.',
        effect: { trust: 3, worry: -1, pride: 2 },
        answer: 'Karim s’y connaît mieux que tous les concessionnaires du centre. Bonne idée.',
      },
    ],
  },
  {
    id: 'fam_diner_nora_promesse_reussite',
    speaker: 'nora',
    when: 'diner',
    mood: 'espoir',
    text: 'Tu as rangé tes classeurs d’économie à côté de tes livres de classe sur ton étagère. Tu crois vraiment que Val-Ferrand peut renaître de ses cendres ?',
    replies: [
      {
        label: 'J’en suis certain maman. Et on en sera les artisans.',
        effect: { trust: 3, worry: -2, pride: 4 },
        answer: 'Elle te caresse les cheveux : « Tant que la jeunesse y croit, rien n’est perdu. »',
      },
      {
        label: 'Si ce n’est pas nous, personne d’autre ne viendra le faire à notre place.',
        effect: { trust: 4, worry: -1, pride: 3 },
        answer: 'C’est exactement ce que disait Lucien lors de sa dernière assemblée.',
      },
    ],
  },

  // ---------- ABSENCES COMPLÉMENTAIRES ----------
  {
    id: 'fam_absence_rendez_vous_banque',
    speaker: 'thierry',
    when: 'absence',
    mood: 'fache',
    text: 'Tu as manqué le cours d’arts plastiques pour aller au guichet du Crédit Agricole avec un dossier sous le bras ? À ton âge, on ne négocie pas avec des banquiers !',
    replies: [
      {
        label: 'J’avais besoin d’un relevé d’identité bancaire pour le terminal de carte.',
        effect: { trust: -1, worry: 2, pride: 1 },
        answer: 'Tu iras le samedi matin la prochaine fois. L’école ne passe après rien.',
      },
      {
        label: 'Pardon papa. Je promets de ne plus jamais caler de rendez-vous sur mes heures de classe.',
        effect: { trust: 2, worry: -1, pride: 0 },
        answer: 'C’est noté. Ne me déçois pas une deuxième fois.',
      },
    ],
  },
  {
    id: 'fam_absence_greve_bus_excuse',
    speaker: 'nora',
    when: 'absence',
    mood: 'inquiet',
    text: 'La vie scolaire m’a envoyé un SMS pour une absence en première heure. Tu étais coincé par la grève des transports ou tu préparais des étalages ?',
    replies: [
      {
        label: 'La ligne 4 ne passait pas, j’ai fini le trajet à pied sous la pluie.',
        effect: { trust: 2, worry: 0, pride: 1 },
        answer: 'Mets tes chaussettes sur le radiateur et bois un thé chaud avant de retourner en cours.',
      },
      {
        label: 'J’ai aidé un commerçant dont la camionnette était bloquée.',
        effect: { trust: 1, worry: 1, pride: 2 },
        answer: 'Ta serviabilité t’honore, mais un mot de retard était obligatoire.',
      },
    ],
  },
  {
    id: 'fam_absence_thierry_remontrance_usine',
    speaker: 'thierry',
    when: 'absence',
    mood: 'fache',
    text: 'À l’usine, trois retards sans motif, c’était la mise à pied conservatoire. La rigueur commence sur les bancs de l’école, {nom} !',
    replies: [
      {
        label: 'Tu as raison papa. Je me réveillerai une demi-heure plus tôt.',
        effect: { trust: 3, worry: -2, pride: 1 },
        answer: 'La ponctualité, c’est le premier respect qu’on doit à ses camarades et à soi-même.',
      },
      {
        label: 'Mes horaires de livraison sont parfois imprévisibles.',
        effect: { trust: -2, worry: 3, pride: 0 },
        answer: 'Alors réduis tes livraisons ! L’école est ta priorité absolue.',
      },
    ],
  },
  {
    id: 'fam_absence_nora_menace_punition',
    speaker: 'nora',
    when: 'absence',
    mood: 'fache',
    text: 'Encore une heure manquée en physique-chimie. La CPE m’a prévenue : la prochaine fois, c’est l’avertissement au dossier scolaire officiel !',
    replies: [
      {
        label: 'Je présente mes excuses à la CPE demain dès 8h.',
        effect: { trust: 2, worry: -1, pride: 0 },
        answer: 'Et tu me montreras ton carnet signé chaque soir sans exception.',
      },
      {
        label: 'Le prof passe son temps à raconter sa vie, je ne perds rien.',
        effect: { trust: -3, worry: 3, pride: -2 },
        answer: 'Silence ! Tu respectes tes enseignants ou je coupe tout contact avec le marché !',
      },
    ],
  },

  // ---------- CONVOCATIONS COMPLÉMENTAIRES ----------
  {
    id: 'fam_convocation_moreau_calculatrice',
    speaker: 'nora',
    when: 'convocation',
    mood: 'inquiet',
    text: 'Mme Moreau nous a convoqués parce qu’elle a trouvé un carnet de bordereaux comptables dans ta copie d’algèbre.',
    replies: [
      {
        label: 'Elle m’a félicité pour la précision de mes tableaux à double entrée !',
        effect: { trust: 2, worry: -1, pride: 2 },
        answer: 'Elle veut quand même qu’on cadre ça pour que ça n’empiète pas sur la géométrie.',
      },
      {
        label: 'J’avais besoin de papier brouillon pendant le contrôle...',
        effect: { trust: 0, worry: 1, pride: 0 },
        answer: 'Ne mélange pas tes copies d’école avec tes comptes de boutique.',
      },
    ],
  },
  {
    id: 'fam_convocation_girard_exposition',
    speaker: 'thierry',
    when: 'convocation',
    mood: 'fier',
    text: 'M. Girard veut te voir non pas pour te punir, mais pour te demander d’animer un atelier sur les coopératives lors de la semaine citoyenne.',
    replies: [
      {
        label: 'Je serais honoré d’expliquer comment fonctionne une coopérative ouvrière.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Thierry gonfle la poitrine : « Lucien aurait été le premier assis au premier rang. »',
      },
      {
        label: 'Je préparerai des graphiques clairs pour les sixièmes.',
        effect: { trust: 3, worry: -1, pride: 3 },
        answer: 'C’est une superbe initiative qui honore notre famille.',
      },
    ],
  },
  {
    id: 'fam_convocation_dylan_bagarre_aide',
    speaker: 'les_deux',
    when: 'convocation',
    mood: 'inquiet',
    text: 'Mme Benali nous convoque parce que tu as défendu Dylan Kaci lors d’une altercation avec Alexis Rameau derrière le gymnase.',
    replies: [
      {
        label: 'Alexis insultait Dylan sur ses vêtements rapiécés. Je ne pouvais pas laisser faire.',
        effect: { trust: 4, worry: -1, pride: 4 },
        answer: 'Nora hoche la tête : « Tu as eu raison d’intervenir, mais utilise les mots plutôt que les poings. »',
      },
      {
        label: 'Dylan travaille avec moi, la solidarité entre collègues n’est pas négociable.',
        effect: { trust: 3, worry: 0, pride: 3 },
        answer: 'Thierry acquiesce : « Ne jamais laisser tomber un camarade face à un petit nanti. »',
      },
    ],
  },
  {
    id: 'fam_convocation_bulletin_alerte',
    speaker: 'nora',
    when: 'convocation',
    mood: 'fache',
    text: 'Le professeur principal demande un rendez-vous tripartite pour faire le point sur la dispersion de ton attention en classe.',
    replies: [
      {
        label: 'Je vais recentrer mes priorités scolaires pendant le mois qui vient.',
        effect: { trust: 2, worry: -2, pride: 1 },
        answer: 'Nous serons là pour t’accompagner et poser des limites claires.',
      },
      {
        label: 'Mes résultats restent au-dessus de la moyenne de classe !',
        effect: { trust: -1, worry: 2, pride: 0 },
        answer: 'La moyenne ne suffit pas quand on a ton potentiel ! Exige le meilleur de toi-même.',
      },
    ],
  },

  // ---------- BONNES NOTES COMPLÉMENTAIRES ----------
  {
    id: 'fam_bonne_note_redaction_fontaine',
    speaker: 'nora',
    when: 'bonne_note',
    mood: 'fier',
    text: '19/20 en rédaction française ! Mme Fontaine a lu ton texte sur "La dignité du travailleur manuel" à voix haute devant toute la classe.',
    replies: [
      {
        label: 'J’ai décrit les mains de papa en rentrant de l’usine.',
        effect: { trust: 4, worry: -2, pride: 5 },
        answer: 'Thierry regarde ses paumes calleuses et s’essuie discrètement un œil : « Merci mon enfant. »',
      },
      {
        label: 'La littérature permet de donner une voix à ceux qu’on n’écoute jamais.',
        effect: { trust: 3, worry: -2, pride: 4 },
        answer: 'Nora sourit : « Tu écris avec le cœur, c’est le plus beau des talents. »',
      },
    ],
  },
  {
    id: 'fam_bonne_note_techno_robotique',
    speaker: 'thierry',
    when: 'bonne_note',
    mood: 'fier',
    text: 'Un 18 en technologie pour la programmation d’un convoyeur à bande miniature avec M. Lambert.',
    replies: [
      {
        label: 'J’ai automatisé le tri par taille de colis pour optimiser les flux.',
        effect: { trust: 3, worry: -1, pride: 3 },
        answer: 'Tu as la tête d’un vrai ingénieur métallurgiste. Les machines te comprennent.',
      },
      {
        label: 'On pourrait construire la même chose à l’atelier de Karim pour les vélos.',
        effect: { trust: 2, worry: 0, pride: 2 },
        answer: 'Tant que ça sert au quartier et que ça soulage les bras, c’est parfait.',
      },
    ],
  },
  {
    id: 'fam_bonne_note_brevet_blanc',
    speaker: 'les_deux',
    when: 'bonne_note',
    mood: 'espoir',
    text: 'Mention Très Bien au brevet blanc avec 16,5 de moyenne générale ! Nora et Thierry ouvrent une boîte de biscuits fins de chez Bertin pour fêter ça.',
    replies: [
      {
        label: 'Le brevet réel ne sera qu’une formalité si je garde cette rigueur.',
        effect: { trust: 4, worry: -3, pride: 4 },
        answer: 'Thierry lève son verre : « Les {nom} entrent au lycée par la grande porte ! »',
      },
      {
        label: 'Merci pour votre soutien quand j’étais fatigué le soir.',
        effect: { trust: 4, worry: -2, pride: 3 },
        answer: 'Nora te serre dans ses bras : « On est une équipe tous les trois. »',
      },
    ],
  },
  {
    id: 'fam_bonne_note_anglais_redressement',
    speaker: 'nora',
    when: 'bonne_note',
    mood: 'fier',
    text: 'Tu es passé de 06 à 14/20 en anglais ! La prof a souligné tes progrès spectaculaires à l’oral.',
    replies: [
      {
        label: 'Lina m’a fait réviser le vocabulaire commercial tous les mercredis.',
        effect: { trust: 3, worry: -2, pride: 3 },
        answer: 'L’effort paie toujours. C’est la plus belle leçon de travail.',
      },
      {
        label: 'I am ready for international trade now, mum !',
        effect: { trust: 2, worry: -1, pride: 3 },
        answer: 'Nora éclate de rire : « Écoutez-le qui me parle déjà comme à la City de Londres ! »',
      },
    ],
  },

  // ---------- MAUVAISES NOTES COMPLÉMENTAIRES ----------
  {
    id: 'fam_mauvaise_note_eps_endurance',
    speaker: 'thierry',
    when: 'mauvaise_note',
    mood: 'inquiet',
    text: '08/20 au test de demi-fond en EPS. M. Sanchez note : "Élève essoufflé au deuxième tour, manque d’endurance évident". Tu ne fais pas assez de sport !',
    replies: [
      {
        label: 'Je cours déjà toute la journée pour livrer mes cartons !',
        effect: { trust: 0, worry: 2, pride: 0 },
        answer: 'Ce n’est pas le même souffle. Dimanche matin, footing de cinq kilomètres avec moi le long du canal.',
      },
      {
        label: 'Je vais m’entraîner au vélo avec Karim pour travailler le cardio.',
        effect: { trust: 2, worry: -1, pride: 1 },
        answer: 'Voilà qui est plus sage. Un bon entrepreneur doit avoir un corps d’athlète.',
      },
    ],
  },
  {
    id: 'fam_mauvaise_note_svt_tp',
    speaker: 'nora',
    when: 'mauvaise_note',
    mood: 'inquiet',
    text: '07/20 en travaux pratiques de biologie. La prof note que tu as confondu les cellules végétales avec un organigramme de distribution.',
    replies: [
      {
        label: 'La structure cellulaire ressemble étrangement à un réseau logistique décentralisé...',
        effect: { trust: -1, worry: 2, pride: 1 },
        answer: 'Garde tes analogies pour le marché ! En cours de SVT, la cellule est une cellule, point final !',
      },
      {
        label: 'Je referai le dessin d’observation ce soir proprement.',
        effect: { trust: 2, worry: -1, pride: 0 },
        answer: 'Applique-toi sur les légendes. La rigueur commence dans le détail.',
      },
    ],
  },
  {
    id: 'fam_mauvaise_note_physique_chimie',
    speaker: 'thierry',
    when: 'mauvaise_note',
    mood: 'inquiet',
    text: 'Un 09 en physique sur les circuits électriques. Avec tout le matériel que tu manipules, tu devrais maîtriser les lois d’Ohm.',
    replies: [
      {
        label: 'Je confonds toujours les calculs de résistance en série et en parallèle.',
        effect: { trust: 1, worry: 1, pride: 0 },
        answer: 'On regardera ça avec le fer à souder samedi après-midi. La pratique éclaire la théorie.',
      },
      {
        label: 'J’étais fatigué le jour de l’évaluation.',
        effect: { trust: -1, worry: 2, pride: -1 },
        answer: 'La fatigue n’excuse pas l’approximation. Révise tes formules.',
      },
    ],
  },
  {
    id: 'fam_mauvaise_note_espagnol_vocabulaire',
    speaker: 'nora',
    when: 'mauvaise_note',
    mood: 'inquiet',
    text: 'Contrôle d’espagnol raté : 05/20 sur les verbes irréguliers. Nora soupire en rangeant la vaisselle.',
    replies: [
      {
        label: 'Je vais me faire des cartes mémoire et les réciter en faisant mes tournées.',
        effect: { trust: 2, worry: -1, pride: 1 },
        answer: 'Bonne idée. Utilise ton temps de marche pour faire travailler ta mémoire.',
      },
      {
        label: 'L’espagnol ne me servira à rien à Val-Ferrand...',
        effect: { trust: -2, worry: 3, pride: -1 },
        answer: 'Et si tu exportes plus tard en Amérique du Sud ? Ne sois pas borné !',
      },
    ],
  },

  // ---------- RÉUSSITE BUSINESS COMPLÉMENTAIRES ----------
  {
    id: 'fam_reussite_premier_salarie_noah',
    speaker: 'les_deux',
    when: 'reussite_business',
    mood: 'fier',
    text: 'Tu as signé le premier contrat rémunéré de Noah comme équipier officiel. Les parents Martin sont venus boire un café pour vous féliciter.',
    replies: [
      {
        label: 'On partage la valeur de manière équitable : Noah a un salaire juste.',
        effect: { trust: 4, worry: -2, pride: 5 },
        answer: 'Nora a les larmes aux yeux : « Tu crées du travail digne pour tes camarades. C’est magnifique. »',
      },
      {
        label: 'À deux, notre capacité de livraison est multipliée par trois.',
        effect: { trust: 3, worry: 0, pride: 3 },
        answer: 'Thierry hoche la tête : « L’union fait la force ouvrière. »',
      },
    ],
  },
  {
    id: 'fam_reussite_camionnette_livraison',
    speaker: 'thierry',
    when: 'reussite_business',
    mood: 'fier',
    text: 'Un premier fourgon utilitaire d’occasion aux couleurs de ton entreprise stationné en bas de la barre des Roses. Thierry tourne autour avec émerveillement.',
    replies: [
      {
        label: 'C’est toi qui m’as appris à aimer les moteurs robustes, papa.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Il tapote le capot avec affection : « Elle ronronne comme une horloge. Prends-en soin. »',
      },
      {
        label: 'On va pouvoir livrer jusqu’au port de Néo-Baie maintenant !',
        effect: { trust: 2, worry: 1, pride: 3 },
        answer: 'Doucement sur la quatre-voies. La prudence reste mère de sûreté.',
      },
    ],
  },
  {
    id: 'fam_reussite_remboursement_pret_famille',
    speaker: 'nora',
    when: 'reussite_business',
    mood: 'tendre',
    text: 'Tu poses sur la table les 300 euros que Nora t’avait avancés au tout début pour acheter tes premières cagettes.',
    replies: [
      {
        label: 'Dette remboursée au centime près, avec tous mes remerciements.',
        effect: { trust: 5, worry: -3, pride: 4 },
        answer: 'Nora refuse l’argent : « Garde-le pour ouvrir ta prochaine boutique. Ta parole tenue vaut tout l’or du monde. »',
      },
      {
        label: 'J’ai ajouté une petite boîte de marrons glacés pour fêter ça.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Elle t’embrasse tendrement : « Tu es un enfant merveilleux. »',
      },
    ],
  },
  {
    id: 'fam_reussite_boutique_deuxieme_annee',
    speaker: 'les_deux',
    when: 'reussite_business',
    mood: 'espoir',
    text: 'Deuxième année d’activité : le chiffre d’affaires dépasse les prévisions les plus optimistes. L’épicerie Bertin te considère désormais comme son plus gros client.',
    replies: [
      {
        label: 'Mme Bertin m’a appris tout ce que je sais sur les relations humaines dans le commerce.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Nora sourit : « Elle t’a vu grandir dans sa boutique. C’est une belle transmission. »',
      },
      {
        label: 'Notre réputation s’étend désormais à toute l’agglomération.',
        effect: { trust: 3, worry: 0, pride: 3 },
        answer: 'Thierry lève son verre : « Val-Ferrand a retrouvé son énergie ! »',
      },
    ],
  },

  // ---------- ÉCHEC BUSINESS COMPLÉMENTAIRES ----------
  {
    id: 'fam_echec_concurrent_agressif_prix',
    speaker: 'thierry',
    when: 'echec_business',
    mood: 'inquiet',
    text: 'HyperVal a baissé ses prix de 30 % juste en face de ton point de livraison. Tes ventes ont chuté de moitié cette semaine.',
    replies: [
      {
        label: 'Ils vendent à perte pour nous étouffer, mais ils ne tiendront pas éternellement.',
        effect: { trust: 3, worry: 1, pride: 2 },
        answer: 'C’est leur méthode habituelle de requin. Reste campé sur ta qualité artisanale.',
      },
      {
        label: 'On va répliquer en proposant des services personnalisés qu’ils ne peuvent pas offrir.',
        effect: { trust: 3, worry: -1, pride: 3 },
        answer: 'Exactement. Le robot de caisse ne remplacera jamais un sourire et une écoute.',
      },
    ],
  },
  {
    id: 'fam_echec_amende_stationnement_livraison',
    speaker: 'nora',
    when: 'echec_business',
    mood: 'fache',
    text: 'Une amende de 135 euros pour stationnement gênant sur le trottoir pendant une livraison avenue Jaurès !',
    replies: [
      {
        label: 'La zone de livraison était squattée par une berline de luxe, je n’avais pas le choix...',
        effect: { trust: 1, worry: 1, pride: 0 },
        answer: 'Va contester l’amende en mairie avec une attestation des commerçants.',
      },
      {
        label: 'Je la paierai sur mes bénéfices personnels pour ne pas toucher au compte.',
        effect: { trust: 3, worry: -1, pride: 2 },
        answer: 'C’est courageux d’assumer. Fais plus attention où tu te gares.',
      },
    ],
  },
  {
    id: 'fam_echec_panne_scooter_hiver',
    speaker: 'thierry',
    when: 'echec_business',
    mood: 'tendre',
    text: 'Tu es rentré en poussant le scooter sous la neige, le moteur serré par le gel. Thierry sort sa caisse à outils.',
    replies: [
      {
        label: 'J’ai oublié de vérifier le niveau d’huile avant la tournée...',
        effect: { trust: 2, worry: 0, pride: 0 },
        answer: 'L’entretien préventif évite les grosses pannes. On va vidanger ensemble ce soir.',
      },
      {
        label: 'Toutes les livraisons de l’après-midi ont été retardées...',
        effect: { trust: 2, worry: 1, pride: 1 },
        answer: 'Passe un coup de fil aux clients pour t’excuser. L’honnêteté désamorce la colère.',
      },
    ],
  },
  {
    id: 'fam_echec_rupture_stock_fete_meres',
    speaker: 'nora',
    when: 'echec_business',
    mood: 'inquiet',
    text: 'Rupture de stock le jour de la fête des mères : cinquante clients sont repartis les mains vides devant ta vitrine.',
    replies: [
      {
        label: 'J’avais sous-estimé la demande par peur des invendus.',
        effect: { trust: 2, worry: 0, pride: 1 },
        answer: 'C’est le métier qui rentre. Pour Noël, tu prévoiras des stocks tampon.',
      },
      {
        label: 'J’ai offert un bon de réduction à chaque client déçu pour leur prochaine visite.',
        effect: { trust: 4, worry: -2, pride: 3 },
        answer: 'Réflexe brillant. Tu as transformé une déconvenue en preuve de sérieux.',
      },
    ],
  },

  // ---------- FATIGUE COMPLÉMENTAIRES ----------
  {
    id: 'fam_fatigue_week_end_recuperation',
    speaker: 'nora',
    when: 'fatigue',
    mood: 'tendre',
    text: 'Ce samedi, interdiction de mettre un pied dehors avant midi. Je t’ai préparé des crêpes et un grand bol de chocolat chaud.',
    replies: [
      {
        label: 'Merci maman, mon corps avait vraiment besoin de souffler.',
        effect: { trust: 3, worry: -3, pride: 1 },
        answer: 'Repose-toi. Le monde continuera de tourner sans toi pendant quelques heures.',
      },
      {
        label: 'Je peux quand même relire mes fiches d’histoire au lit ?',
        effect: { trust: 2, worry: -1, pride: 2 },
        answer: 'Seulement après avoir mangé trois crêpes !',
      },
    ],
  },
  {
    id: 'fam_fatigue_thierry_massage_epaules',
    speaker: 'thierry',
    when: 'fatigue',
    mood: 'tendre',
    text: 'Thierry pose ses mains lourdes sur tes trapèzes noués après une journée de manutention : « Tu as le dos aussi dur qu’une barre d’acier laminée. »',
    replies: [
      {
        label: 'Le métier de cariste et de livreur n’épargne pas les muscles...',
        effect: { trust: 3, worry: -1, pride: 2 },
        answer: 'Plie les genoux quand tu soulèves un carton. Ne force jamais sur les reins.',
      },
      {
        label: 'Ça me fait penser à tout ce que tu as porté pendant trente ans à l’usine.',
        effect: { trust: 4, worry: -2, pride: 3 },
        answer: 'Thierry sourit avec émotion : « Tu me comprends mieux que quiconque, fiston. »',
      },
    ],
  },
  {
    id: 'fam_fatigue_nora_tisane_nuit',
    speaker: 'nora',
    when: 'fatigue',
    mood: 'tendre',
    text: 'Nora te tend une tasse fumante de tilleul et camomille : « Bois ça. Ça détend les nerfs et ça chasse les voix qui tournent dans ta tête. »',
    replies: [
      {
        label: 'Merci maman. Les fantômes d’Adam Smith et de Marx se taisent enfin.',
        effect: { trust: 3, worry: -2, pride: 2 },
        answer: 'Elle rit doucement : « Dis-leur d’aller dormir eux aussi ! »',
      },
      {
        label: 'Tu es la meilleure infirmière de tout le département.',
        effect: { trust: 4, worry: -2, pride: 3 },
        answer: 'Elle t’embrasse tendrement : « Dors bien mon grand. »',
      },
    ],
  },
  {
    id: 'fam_fatigue_dimanche_sieste_obligatoire',
    speaker: 'les_deux',
    when: 'fatigue',
    mood: 'tendre',
    text: 'Dimanche après-midi pluvieux. Le silence règne dans l’appartement des Roses, berçant le salon au rythme de la pluie sur les carreaux.',
    replies: [
      {
        label: 'Faire une sieste en famille est le plus doux des luxes.',
        effect: { trust: 4, worry: -3, pride: 2 },
        answer: 'Thierry ronfle doucement dans son fauteuil en souriant.',
      },
      {
        label: 'Demain, la semaine repartira sur les chapeaux de roue !',
        effect: { trust: 2, worry: 0, pride: 2 },
        answer: 'Nora chuchote : « Chaque chose en son temps. Savoure le calme. »',
      },
    ],
  },

  // ---------- NUIT BLANCHE COMPLÉMENTAIRES ----------
  {
    id: 'fam_nuit_blanche_inventaire_annuel',
    speaker: 'thierry',
    when: 'nuit_blanche',
    mood: 'inquiet',
    text: 'Il est quatre heures du matin. Tu es assis par terre au milieu de trois classeurs de factures pour boucler l’inventaire de fin d’exercice.',
    replies: [
      {
        label: 'Je dois être rigoureux au centime près pour la clôture comptable.',
        effect: { trust: 3, worry: 1, pride: 3 },
        answer: 'C’est tout à ton honneur, mais un comptable endormi fait plus d’erreurs qu’un comptable reposé. Dors deux heures.',
      },
      {
        label: 'J’ai presque fini, la balance est équilibrée !',
        effect: { trust: 2, worry: 0, pride: 3 },
        answer: 'Bravo. Mais éteins la lumière avant que ta mère ne se lève pour son service.',
      },
    ],
  },
  {
    id: 'fam_nuit_blanche_crise_fournisseur_aube',
    speaker: 'nora',
    when: 'nuit_blanche',
    mood: 'inquiet',
    text: 'Nora rentre de sa garde d’hôpital à 6h30 et te trouve déjà habillé, en train de négocier au téléphone avec un maraîcher.',
    replies: [
      {
        label: 'Son camion est tombé en panne, je lui organise un déchargement de secours.',
        effect: { trust: 3, worry: 1, pride: 3 },
        answer: 'Tu es déjà sur le pont avant le lever du jour... Bois un café avec moi d’abord.',
      },
      {
        label: 'La journée commence tôt pour ceux qui approvisionnent la ville.',
        effect: { trust: 2, worry: 1, pride: 2 },
        answer: 'Tu me rappelles ton grand-père quand il partait prendre son quart du matin à la cokerie.',
      },
    ],
  },
  {
    id: 'fam_nuit_blanche_angoisse_loyer_demain',
    speaker: 'thierry',
    when: 'nuit_blanche',
    mood: 'tendre',
    text: 'Tu n’as pas fermé l’œil parce que le prélèvement du loyer commercial tombe demain matin.',
    replies: [
      {
        label: 'J’ai peur que la caisse soit trop courte de cinquante euros...',
        effect: { trust: 3, worry: 0, pride: 1 },
        answer: 'Thierry sort un billet de cinquante de son portefeuille : « Prends-le. Tu me le rendras vendredi. Ne perds pas le sommeil pour ça. »',
      },
      {
        label: 'Les ventes de ce matin couvriront largement l’échéance si j’ouvre à 7h.',
        effect: { trust: 3, worry: 1, pride: 3 },
        answer: 'Courage. Les premières années d’installation sont toujours les plus rudes.',
      },
    ],
  },
  {
    id: 'fam_nuit_blanche_redaction_plan_action',
    speaker: 'nora',
    when: 'nuit_blanche',
    mood: 'espoir',
    text: 'Tu as passé la nuit à dessiner la carte de développement de tes futurs ateliers sur du papier millimétré.',
    replies: [
      {
        label: 'Regarde maman : tout est pensé pour relier les artisans de la friche à la gare.',
        effect: { trust: 4, worry: -1, pride: 4 },
        answer: 'Nora regarde le plan avec admiration : « Tu as la vision d’un grand bâtisseur. »',
      },
      {
        label: 'Je voulais fixer mes idées avant qu’elles ne s’envolent.',
        effect: { trust: 2, worry: 0, pride: 2 },
        answer: 'Maintenant que c’est écrit, repose tes yeux au moins une heure.',
      },
    ],
  },

  // ---------- ANNIVERSAIRE COMPLÉMENTAIRES ----------
  {
    id: 'fam_anniversaire_12_ans_rentree',
    speaker: 'les_deux',
    when: 'anniversaire',
    mood: 'tendre',
    text: '1er septembre 2020 : douze ans tout rond et premier jour au collège Jean-Moulin. Nora noue ton foulard et Thierry te tend un stylo en métal gravé des forges.',
    replies: [
      {
        label: 'Je promets de vous rendre fiers à chaque jour de cette nouvelle aventure.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Thierry te sourit avec émotion : « Bonne rentrée mon grand. La vie t’appartient. »',
      },
      {
        label: 'C’est aujourd’hui que tout commence !',
        effect: { trust: 3, worry: 0, pride: 3 },
        answer: 'Nora t’embrasse fort : « File avant la première sonnerie de la grille ! »',
      },
    ],
  },
  {
    id: 'fam_anniversaire_13_ans_fete_famille',
    speaker: 'les_deux',
    when: 'anniversaire',
    mood: 'espoir',
    text: 'Treize ans : le goûter d’anniversaire dans le petit salon avec un fraisier préparé par Nora et les encouragements chaleureux de toute la famille.',
    replies: [
      {
        label: 'Merci d’être toujours là pour moi, quoi qu’il arrive.',
        effect: { trust: 4, worry: -3, pride: 4 },
        answer: 'Nora a les larmes aux yeux : « Tu es notre plus belle réussite. »',
      },
      {
        label: 'L’année qui vient sera celle de notre grande expansion dans le quartier !',
        effect: { trust: 2, worry: 1, pride: 3 },
        answer: 'Thierry rit de bon cœur : « Ne t’arrête jamais de rêver en grand ! »',
      },
    ],
  },
  {
    id: 'fam_anniversaire_14_ans_promesse_majorite',
    speaker: 'thierry',
    when: 'anniversaire',
    mood: 'fier',
    text: 'Quatorze ans : Thierry pose sur la table la montre à gousset que Lucien portait lors des négociations syndicales de 1982.',
    replies: [
      {
        label: 'Elle ne quittera plus jamais ma poche lors des grandes décisions.',
        effect: { trust: 5, worry: -2, pride: 5 },
        answer: 'Elle a battu au rythme des grandes victoires de la vallée. Qu’elle te porte chance.',
      },
      {
        label: 'Je serai digne de la mémoire de papy Lucien.',
        effect: { trust: 4, worry: -2, pride: 4 },
        answer: 'Tu l’es déjà, chaque jour que le ciel fait.',
      },
    ],
  },
];

// ==========================================
// PERSONNAGES DU COLLÈGE JEAN-MOULIN
// ==========================================
export const SCHOOL_CHARACTERS: readonly SchoolCharacter[] = [
  {
    id: 'char_principal_vasseur',
    name: 'M. Vasseur',
    role: 'Principal du collège Jean-Moulin',
    traits: ['institutionnel', 'pointilleux', 'légaliste', 'sensible aux résultats'],
    bio: 'Ancien professeur de lettres classiques, M. Vasseur veille scrupuleusement au respect du règlement intérieur et à l’image républicaine de l’établissement. Il craint par-dessus tout les accidents, les incidents sanitaires et les scandales administratifs.',
    dealPossible: 'Tolère une tolérance de retard de 10 min si tu maintiens une moyenne générale supérieure à 15/20 et fournis des fiches de lecture d’économie au CDI.',
  },
  {
    id: 'char_cpe_benali',
    name: 'Mme Benali',
    role: 'Conseillère Principale d’Éducation (CPE)',
    traits: ['ferme', 'bienveillante', 'protectrice', 'intuitive'],
    bio: 'Fille de mineur du bassin, Mme Benali connaît par cœur les difficultés sociales des familles de la Cité des Roses. Derrière une sévérité affichée sur les retards et les absences, elle protège les élèves travailleurs et repère immédiatement les détresses silencieuses.',
    dealPossible: 'Justifie une absence ponctuelle pour rendez-vous professionnel si tu aides Dylan ou les sixièmes aux devoirs du soir deux fois par semaine.',
  },
  {
    id: 'char_prof_maths_moreau',
    name: 'Mme Moreau',
    role: 'Professeur de mathématiques',
    traits: ['rigoureuse', 'passionnée d’algèbre', 'intransigeante sur la méthode'],
    bio: 'Figure historique du collège, redoutée pour ses interrogations surprises sur les fractions et les pourcentages. Elle admire secrètement la vivacité de calcul du joueur mais refuse catégoriquement qu’il saute les étapes de démonstration géométrique.',
    dealPossible: 'Donne carte blanche pour utiliser des calculatrices programmables et sauter les exercices redondants si tu obtiens plus de 18/20 au devoir trimestriel.',
  },
  {
    id: 'char_prof_histoire_girard',
    name: 'M. Girard',
    role: 'Professeur d’histoire-géographie',
    traits: ['militant de la mémoire', 'érudit', 'passionné de géopolitique'],
    bio: 'Historien local bénévole, auteur d’une monographie sur les grèves métallurgiques de 1936 et 1982 dans la vallée du Taret. Il a personnellement connu Lucien et s’illumine dès qu’un élève pose une question sur les mutations industrielles européennes.',
    dealPossible: 'Fournit des accès réservés aux archives municipales et autorise des exposés libres sur l’économie en échange de documents originaux de Lucien.',
  },
  {
    id: 'char_prof_francais_fontaine',
    name: 'Mme Fontaine',
    role: 'Professeur de français et lettres',
    traits: ['sensible', 'exigeante sur la syntaxe', 'admiratrice d’Émile Zola'],
    bio: 'Amoureuse de la littérature réaliste et engagée (Zola, Hugo, George Sand). Elle traque impitoyablement le jargon d’école de commerce et exige que le joueur sache exprimer ses idées avec élégance, clarté et vocabulaire riche.',
    dealPossible: 'Pardonne un devoir maison rendu en retard si tu rédiges une critique littéraire argumentée pour le journal du collège.',
  },
  {
    id: 'char_prof_techno_lambert',
    name: 'M. Lambert',
    role: 'Professeur de technologie',
    traits: ['bricoleur de génie', 'adepte de l’open-source', 'pratique'],
    bio: 'Ancien technicien de maintenance chez Taret-Acier reconverti dans l’enseignement. Sa salle ressemble à un fablab avec imprimantes 3D, fers à souder et vélos désossés. Il soutient l’esprit maker et l’économie de la réparation.',
    dealPossible: 'Autorise l’utilisation des machines de l’atelier de techno pour fabriquer des présentoirs ou réparer des caisses contre un coup de main au rangement.',
  },
  {
    id: 'char_prof_eps_sanchez',
    name: 'M. Sanchez',
    role: 'Professeur d’éducation physique et sportive (EPS)',
    traits: ['énergique', 'esprit d’équipe', 'amateur d’effort collectif'],
    bio: 'Ancien demi-de-mêlée du club de rugby de Val-Ferrand. Il ne tolère pas les tire-au-flanc mais respecte profondément les élèves qui mouillent le maillot pour leurs camarades. Pour lui, le sport forge le caractère indispensable aux meneurs d’hommes.',
    dealPossible: 'Aménage les créneaux d’évaluation physique si tu organises les ravitaillements en eau et collations du cross du collège.',
  },
  {
    id: 'char_documentaliste_aubert',
    name: 'Mme Aubert',
    role: 'Documentaliste responsable du CDI',
    traits: ['calme', 'protectrice des livres', 'complice discrète'],
    bio: 'Gardienne du temple du CDI. C’est elle qui a récupéré en cachette deux cartons de livres de sociologie avant la fermeture de la bibliothèque du CE en 2014. Elle laisse le joueur s’installer au fond de la travée d’économie pour étudier au calme.',
    dealPossible: 'Garde les colis ou le stock sous clé dans la réserve du CDI pendant les heures de cours en échange de deux heures d’aide au classement par semaine.',
  },
  {
    id: 'char_eleve_rival_alexis',
    name: 'Alexis Rameau',
    role: 'Élève rival (fils du directeur de zone HyperVal)',
    traits: ['hautain', 'compétitif', 'arrogant', 'matérialiste'],
    bio: 'Fils d’Hervé de Saint-Amand (directeur du Drive HyperVal). Il roule avec les derniers smartphones, méprise les quartiers populaires et tente régulièrement de dénigrer les activités du joueur auprès du principal ou sur les réseaux sociaux.',
    dealPossible: 'Aucun arrangement direct : son arrogance ne se plie que face à une victoire commerciale éclatante ou une humiliation publique lors d’un débat économique.',
  },
  {
    id: 'char_eleve_artiste_zoe',
    name: 'Zoé Laroche',
    role: 'Élève artiste et graphiste en herbe',
    traits: ['créative', 'discrète', 'talentueuse', 'observatrice'],
    bio: 'Toujours un carnet de croquis à la main. Elle dessine des portraits saisissants des professeurs et imagine des logos percutants. Elle rêve d’entrer dans une école d’art à Lyon mais manque de moyens financiers pour son matériel de peinture.',
    dealPossible: 'Dessine gratuitement les affiches, étiquettes et logos de tes entreprises en échange de fournitures de beaux-arts ou d’une commission sur les ventes.',
  },
  {
    id: 'char_eleve_decrocheur_dylan',
    name: 'Dylan Kaci',
    role: 'Élève en difficulté et futur coursier loyal',
    traits: ['bagarreur au grand cœur', 'loyal', 'débrouillard', 'costaud'],
    bio: 'Renvoyé de deux collèges pour indiscipline, Dylan vit chez sa grand-mère aux Roses. Il n’aime pas l’école mais adore conduire son vélo et travailler de ses bras. Il cherche désespérément à prouver sa valeur en dehors des salles de classe.',
    dealPossible: 'Assure les livraisons les plus rudes sous la pluie ou surveille le stand pendant tes heures d’interrogation en échange d’un salaire honnête et de respect.',
  },
  {
    id: 'char_eleve_delegue_sacha',
    name: 'Sacha Mercier',
    role: 'Délégué de classe et médiateur',
    traits: ['diplomate', 'écoute active', 'fédérateur', 'rigoureux'],
    bio: 'Élu délégué à l’unanimité. Sacha désamorce les disputes entre bandes de quartier et sait parler aussi bien aux professeurs qu’aux élèves les plus turbulents. Il défend les droits des collégiens avec une maturité impressionnante.',
    dealPossible: 'Plaide ta cause auprès des professeurs lors des conseils de classe si tes affaires ne nuisent pas à l’ambiance d’entraide générale.',
  },
];
