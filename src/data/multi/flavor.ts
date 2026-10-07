/**
 * NEURAPOLIS — Workflow AG-3 (« Quartiers vivants & rivalités »)
 * Phase 3 : Textes, habillages narratifs et moments philosophiques du Multijoueur.
 *
 * Définit l'ensemble des 14 mécaniques multijoueur (6 coopération, 1 zone grise, 7 sabotage),
 * leurs textes bilatéraux (initiateur {autre} / cible), révélations en cas de découverte,
 * duels de fantômes doctrinaux (pour / contre) et ancrages conceptuels économiques.
 *
 * Contient également les moments relationnels (MULTI_MOMENTS) réagissant aux dynamiques
 * de long terme entre les deux joueurs (alliance longue, trahison, réconciliation, rivalité ouverte).
 */

export type MultiMechanicId =
  // Coopération (6)
  | 'pret'
  | 'coentreprise'
  | 'achats_groupes'
  | 'recommandation'
  | 'formation'
  | 'garant_mutuel'
  // Zone grise (1)
  | 'entente_prix'
  // Sabotage (7)
  | 'guerre_des_prix'
  | 'rumeur'
  | 'debauchage'
  | 'signalement'
  | 'rachat_fournisseur'
  | 'espionnage'
  | 'bail_coupe';

export interface MultiFlavor {
  id: MultiMechanicId;
  kind: 'coop' | 'zone_grise' | 'sabotage';
  label: string;          // texte du bouton
  pitch: string;          // une phrase qui explique ce que ça fait
  toActor: string;        // ce que lit celui qui agit ({autre} = nom de l'autre joueur)
  toTarget: string;       // ce que lit celui qui subit (ou reçoit)
  discovered: string;     // ce que lit la cible si elle découvre l'auteur (sabotage)
  ghostFor: { ghost: string; text: string };     // un penseur qui approuve
  ghostAgainst: { ghost: string; text: string }; // un penseur qui désapprouve
  concept: string;        // id d'un concept économique valide (ex: dilemme_prisonnier, cartel, etc.)
  lesson: string;         // 1 à 2 phrases de pédagogie économique
}

export const MULTI_FLAVOR: readonly MultiFlavor[] = [
  // =========================================================================
  // 1. COOPÉRATION (6 mécaniques)
  // =========================================================================
  {
    id: 'pret',
    kind: 'coop',
    label: 'Prêter des fonds',
    pitch: 'Avancer des liquidités à {autre} pour soutenir sa trésorerie ou financer ses investissements.',
    toActor: 'Tu accordes une avance de trésorerie à {autre} pour stimuler son développement commercial.',
    toTarget: '{autre} te propose un prêt solidaire pour consolider ta trésorerie et accélérer tes projets.',
    discovered: '{autre} a officialisé cette avance de soutien devant l’assemblée des commerçants du quartier.',
    ghostFor: {
      ghost: 'keynes',
      text: 'La monnaie qui circule fertilise l’activité locale. Un prêt opportun préserve la demande globale.',
    },
    ghostAgainst: {
      ghost: 'smith',
      text: 'Tout crédit distend la vigilance financière : l’emprunteur risque de vivre au-dessus de ses moyens réels.',
    },
    concept: 'levier',
    lesson: 'Le crédit bancaire ou inter-entreprises actionne un levier financier pour financer la croissance, mais transfère le risque d’insolvabilité sur le créancier.',
  },
  {
    id: 'coentreprise',
    kind: 'coop',
    label: 'Fonder une coentreprise',
    pitch: 'Mettre en commun des ressources avec {autre} pour partager les coûts et élargir la clientèle des deux commerces.',
    toActor: 'Tu t’associes avec {autre} dans une coentreprise pour mutualiser les investissements et les bénéfices.',
    toTarget: '{autre} te propose de créer une coentreprise afin de partager les risques et les gains d’un projet commun.',
    discovered: '{autre} et toi annoncez publiquement la création de votre alliance commerciale dans la vallée.',
    ghostFor: {
      ghost: 'ostrom',
      text: 'Partager des ressources et des règles communes permet de bâtir une résilience bien supérieure à l’effort solitaire.',
    },
    ghostAgainst: {
      ghost: 'hobbes',
      text: 'Une alliance marchande sans arbitrage souverain vacille dès que le partage des gains devient asymétrique.',
    },
    concept: 'coentreprise',
    lesson: 'Une coentreprise réunit deux entreprises distinctes pour porter un projet stratégique commun, réduisant les barrières financières tout en exigeant une gouvernance équilibrée.',
  },
  {
    id: 'achats_groupes',
    kind: 'coop',
    label: 'Grouper les commandes',
    pitch: 'Passer une commande commune avec {autre} auprès des grossistes pour obtenir des remises de volume.',
    toActor: 'Tu regroupes tes achats avec {autre} pour négocier de meilleurs tarifs auprès des fournisseurs.',
    toTarget: '{autre} te propose de regrouper vos commandes pour faire baisser le coût unitaire des marchandises.',
    discovered: '{autre} et toi signez un bon de commande commun qui force le respect des grossistes du bassin.',
    ghostFor: {
      ghost: 'ford',
      text: 'Acheter en volume compresse les coûts unitaires. La logistique de masse fait chuter le prix de revient.',
    },
    ghostAgainst: {
      ghost: 'ohno',
      text: 'Accumuler des volumes pour obtenir un rabais crée du stockage inutile et immobilise du capital précieux.',
    },
    concept: 'economies_echelle',
    lesson: 'Les économies d’échelle permettent de réduire le coût moyen par unité en répartissant les frais de négociation et de transport sur de plus gros volumes.',
  },
  {
    id: 'recommandation',
    kind: 'coop',
    label: 'Recommander la clientèle',
    pitch: 'Orienter ta clientèle vers le commerce de {autre} pour stimuler sa fréquentation sans nuire à la tienne.',
    toActor: 'Tu invites ta clientèle à découvrir la boutique de {autre}, renforçant l’attractivité de tout le quartier.',
    toTarget: '{autre} oriente une partie de sa clientèle vers ton enseigne, provoquant un afflux spontané de visites.',
    discovered: '{autre} vante les mérites de ton commerce auprès de l’association des marchands de Val-Ferrand.',
    ghostFor: {
      ghost: 'bourdieu',
      text: 'Le capital social grandit quand on le partage : une recommandation sincère crée une dette symbolique durable.',
    },
    ghostAgainst: {
      ghost: 'machiavel',
      text: 'Donner ses clients à un autre commerçant, c’est nourrir aujourd’hui qui pourrait te supplanter demain.',
    },
    concept: 'capital_social',
    lesson: 'Le capital social transforme les relations de confiance en avantage économique tangible en fluidifiant l’accès à de nouveaux marchés.',
  },
  {
    id: 'formation',
    kind: 'coop',
    label: 'Transmettre un savoir',
    pitch: 'Partager un concept économique ou une méthode de gestion avec {autre} pour accroître ses compétences.',
    toActor: 'Tu transmets une notion économique précieuse à {autre} pour fortifier sa compréhension des marchés.',
    toTarget: '{autre} t’enseigne une nouvelle clé d’analyse économique, enrichissant ton carnet de bord et ton savoir-faire.',
    discovered: '{autre} partage publiquement ses méthodes lors d’un atelier participatif à la Friche Taret.',
    ghostFor: {
      ghost: 'ostrom',
      text: 'La connaissance est un bien commun non rival : la transmettre ne l’appauvrit pas, elle l’enracine.',
    },
    ghostAgainst: {
      ghost: 'schumpeter',
      text: 'Ton avantage comparatif repose sur l’innovation exclusive ; dévoiler tes secrets dissipe ta rente de pionnier.',
    },
    concept: 'communs',
    lesson: 'La diffusion du savoir technique et économique augmente la productivité collective et constitue un bien public dont l’usage n’épuise pas la disponibilité.',
  },
  {
    id: 'garant_mutuel',
    kind: 'coop',
    label: 'Se porter caution solidaire',
    pitch: 'Apporter ta signature comme caution pour débloquer les démarches commerciales et légales de {autre}.',
    toActor: 'Tu engages ta responsabilité pour servir de caution solidaire à {autre} et lever ses blocages administratifs.',
    toTarget: '{autre} propose de se porter caution solidaire pour garantir tes engagements auprès des tiers.',
    discovered: '{autre} valide son engagement de caution devant le registre du tribunal de commerce de la vallée.',
    ghostFor: {
      ghost: 'smith',
      text: 'La réputation personnelle engage le patrimoine et cimente le socle indispensable des échanges commerciaux.',
    },
    ghostAgainst: {
      ghost: 'hayek',
      text: 'Garantir un tiers déresponsabilise : c’est introduire un aléa moral en assumant les pertes potentielles d’un autre.',
    },
    concept: 'alea_moral',
    lesson: 'Le cautionnement solidaire réduit la contrainte financière immédiate mais engendre un aléa moral si la partie garantie prend des risques excessifs.',
  },

  // =========================================================================
  // 2. ZONE GRISE (1 mécanique)
  // =========================================================================
  {
    id: 'entente_prix',
    kind: 'zone_grise',
    label: 'Pacter sur les tarifs',
    pitch: 'Conclure un accord secret avec {autre} pour aligner vos prix à la hausse et neutraliser la concurrence locale.',
    toActor: 'Tu proposes à {autre} d’harmoniser secrètement vos tarifs pour capter une marge confortable sur le quartier.',
    toTarget: '{autre} te propose un pacte discret pour fixer des prix communs et éviter toute guerre tarifaire.',
    discovered: '{autre} et toi faites l’objet d’une enquête officielle après la découverte de votre accord illicite sur les tarifs.',
    ghostFor: {
      ghost: 'machiavel',
      text: 'Mieux vaut se partager pacifiquement le marché que s’épuiser dans une guerre d’usure stérile.',
    },
    ghostAgainst: {
      ghost: 'smith',
      text: 'Quand les marchands se réunissent, la conversation se termine toujours par une conspiration contre le public.',
    },
    concept: 'cartel',
    lesson: 'Une entente illicite ou cartel fausse le jeu du marché en spoliant la clientèle par des prix artificiellement élevés au mépris des lois anti-trust.',
  },

  // =========================================================================
  // 3. SABOTAGE (7 mécaniques)
  // =========================================================================
  {
    id: 'guerre_des_prix',
    kind: 'sabotage',
    label: 'Casser les prix',
    pitch: 'Pratiquer des rabais agressifs sur le quartier de {autre} pour détourner sa clientèle et asphyxier ses marges.',
    toActor: 'Tu déclenches une offensive tarifaire brutale pour siphonner la clientèle de {autre} et tester sa résistance financière.',
    toTarget: 'Des baisses de prix agressives éclatent dans ton secteur : la clientèle déserte tes rayons pour profiter de ces soldes sauvages.',
    discovered: 'L’auteur de ce dumping agressif est démasqué : c’est {autre} qui brade ses articles pour assécher tes ventes.',
    ghostFor: {
      ghost: 'schumpeter',
      text: 'La concurrence par les prix élimine les positions rentières et redistribue les cartes économiques.',
    },
    ghostAgainst: {
      ghost: 'marx',
      text: 'Vendre à perte pour écraser le rival prépare le terrain au monopole privé et à l’exploitation future.',
    },
    concept: 'guerre_des_prix',
    lesson: 'La guerre des prix use la trésorerie des concurrents jusqu’à capitulation, transformant une rivalité saine en stratégie prédatrice de dumping.',
  },
  {
    id: 'rumeur',
    kind: 'sabotage',
    label: 'Diffuser une rumeur',
    pitch: 'Propager des insinuations sur la qualité ou l’éthique de {autre} pour entamer sa réputation auprès des habitants.',
    toActor: 'Tu fais circuler des bruits désobligeants sur les pratiques de {autre} afin d’ébranler la confiance du quartier.',
    toTarget: 'Une vilaine rumeur s’est répandue sur la place : les passants regardent ta vitrine d’un œil soupçonneux et hésitent à entrer.',
    discovered: 'L’origine du ragot a été formellement identifiée : c’est {autre} qui a colporté ces calomnies pour salir ton image.',
    ghostFor: {
      ghost: 'machiavel',
      text: 'Dans l’arène publique, l’opinion est une force motrice : abîmer l’image du rival affaiblit son pouvoir.',
    },
    ghostAgainst: {
      ghost: 'bourdieu',
      text: 'Détruire le capital symbolique par le mensonge empoisonne tout le milieu social et se retourne contre l’instigateur.',
    },
    concept: 'asymetrie_information',
    lesson: 'L’asymétrie d’information amplifiée par des rumeurs infondées détériore la confiance des consommateurs et perturbe l’évaluation juste de la qualité.',
  },
  {
    id: 'debauchage',
    kind: 'sabotage',
    label: 'Débaucher du personnel',
    pitch: 'Courtiser un membre de l’équipe de {autre} en offrant de meilleures conditions pour désorganiser son service.',
    toActor: 'Tu formules une proposition alléchante au personnel clé de {autre} pour l’attirer dans ton entreprise.',
    toTarget: 'Une personne de confiance au sein de ton équipe annonce son départ après avoir reçu une offre concurrente inattendue.',
    discovered: 'La manœuvre de recrutement déloyal est mise au jour : c’est {autre} qui a démarché tes effectifs pour te déstabiliser.',
    ghostFor: {
      ghost: 'smith',
      text: 'Le marché du travail doit être fluide : chacun est libre d’aller là où son labeur est le mieux rémunéré.',
    },
    ghostAgainst: {
      ghost: 'dejours',
      text: 'Démanteler un collectif de travail en subtilisant des compétences fragilise la santé mentale et le sens du métier.',
    },
    concept: 'concurrence_deloyale',
    lesson: 'Le débauchage ciblé exploite la mobilité des salariés pour priver un concurrent de compétences clés, frôlant la concurrence déloyale s’il vise la désorganisation.',
  },
  {
    id: 'signalement',
    kind: 'sabotage',
    label: 'Déclencher un contrôle',
    pitch: 'Déposer un recours administratif anonyme pour provoquer une inspection tatillonne des locaux de {autre}.',
    toActor: 'Tu transmets un dossier circonstancié aux services de contrôle pour déclencher une vérification rigoureuse chez {autre}.',
    toTarget: 'Des agents de contrôle se présentent à l’improviste dans ton établissement, exigeant l’examen minutieux de toutes les normes.',
    discovered: 'La provenance de la dénonciation administrative a fuité : c’est {autre} qui a sollicité ce contrôle pour paralyser ton activité.',
    ghostFor: {
      ghost: 'hobbes',
      text: 'Les règlements étatiques ne sont pas des suggestions : faire respecter la norme garantit l’ordre public.',
    },
    ghostAgainst: {
      ghost: 'ostrom',
      text: 'Dévoyer les institutions publiques au profit de rancunes privées détruit la légitimité des règles collectives.',
    },
    concept: 'capture_reglementaire',
    lesson: 'L’instrumentalisation des normes sanitaires ou fiscales à des fins concurrentielles constitue une forme de capture réglementaire préjudiciable à l’activité économique.',
  },
  {
    id: 'rachat_fournisseur',
    kind: 'sabotage',
    label: 'Préempter les approvisionnements',
    pitch: 'Acheter l’intégralité des stocks disponibles chez un grossiste pour provoquer une rupture chez {autre}.',
    toActor: 'Tu ravis les stocks critiques des grossistes afin de priver {autre} des marchandises indispensables à son activité.',
    toTarget: 'Tes grossistes habituels annoncent une rupture totale de stock : un acheteur a préempté tous les arrivages de la semaine.',
    discovered: 'Le grossiste a vendu la mèche : c’est {autre} qui a délibérément racheté les approvisionnements pour te mettre à sec.',
    ghostFor: {
      ghost: 'ricardo',
      text: 'Le contrôle d’une ressource rare et limitée confère une rente indiscutable à celui qui s’en assure le monopole.',
    },
    ghostAgainst: {
      ghost: 'raworth',
      text: 'Créer une pénurie artificielle pour nuire à autrui met en péril l’équilibre de subsistance de toute la filière.',
    },
    concept: 'barriere_entree',
    lesson: 'L’accaparement des intrants érige une barrière à l’entrée artificielle qui verrouille le marché et renchérit les coûts pour tous les concurrents.',
  },
  {
    id: 'espionnage',
    kind: 'sabotage',
    label: 'Infiltrer les bilans',
    pitch: 'Obtenir les registres financiers et données stratégiques de {autre} pour anticiper chacun de ses mouvements.',
    toActor: 'Tu consultes discrètement les comptes détaillés et marges de {autre} pour découvrir ses forces et faiblesses.',
    toTarget: 'Une fuite d’informations sensibles est constatée : tes marges, stocks et soldes de trésorerie ont été consultés sans ton accord.',
    discovered: 'L’audit de sécurité a tracé l’intrusion : c’est {autre} qui a accédé clandestinement à tes données comptables.',
    ghostFor: {
      ghost: 'hayek',
      text: 'Dans une économie décentralisée, capter l’information avant les autres est le levier le plus puissant de coordination.',
    },
    ghostAgainst: {
      ghost: 'smith',
      text: 'Sans respect de la confidentialité et du secret des affaires, la loyauté du marché s’effondre dans la paranoïa.',
    },
    concept: 'asymetrie_information',
    lesson: 'La collecte occulte de données financières crée une asymétrie d’information stratégique qui rompt l’équité concurrentielle et décourage l’effort productif.',
  },
  {
    id: 'bail_coupe',
    kind: 'sabotage',
    label: 'Subtiliser un emplacement',
    pitch: 'Prendre de vitesse {autre} en signant immédiatement le bail du local convoité sur la grande carte.',
    toActor: 'Tu signes sans attendre le bail convoité par {autre}, lui barrant la route vers cet axe très passant.',
    toTarget: 'L’emplacement commercial que tu convoitais dans le quartier vient d’être loué sous tes yeux par un autre entrepreneur.',
    discovered: 'Le bailleur a confirmé l’identité du nouveau locataire : c’est {autre} qui a signé le bail pour te couper l’accès à cette artère.',
    ghostFor: {
      ghost: 'ricardo',
      text: 'La rente foncière appartient au premier exploitant capable de valoriser le meilleur emplacement urbain.',
    },
    ghostAgainst: {
      ghost: 'marx',
      text: 'S’approprier l’espace par l’argent sans projet d’utilité réelle n’est qu’une spéculation stérile sur la terre.',
    },
    concept: 'rente',
    lesson: 'La captation d’un emplacement stratégique confère une rente de situation géographique, fermant l’accès à la zone d’achalandage aux acteurs concurrents.',
  },
];

export const MULTI_FLAVOR_BY_ID: Readonly<Record<MultiMechanicId, MultiFlavor>> = Object.fromEntries(
  MULTI_FLAVOR.map((flavor) => [flavor.id, flavor]),
) as Record<MultiMechanicId, MultiFlavor>;

export interface MultiMoment {
  id: string;
  when: 'alliance_longue' | 'trahison' | 'reconciliation' | 'rivalite_ouverte';
  ghost: string;
  text: string;
}

export const MULTI_MOMENTS: readonly MultiMoment[] = [
  // =========================================================================
  // 1. ALLIANCE LONGUE (4 moments)
  // =========================================================================
  {
    id: 'moment_alliance_ostrom_communs',
    when: 'alliance_longue',
    ghost: 'ostrom',
    text: 'La répétition de la confiance transforme deux marchands rivaux en gardiens solidaires d’un bien commun.',
  },
  {
    id: 'moment_alliance_smith_sympathie',
    when: 'alliance_longue',
    ghost: 'smith',
    text: 'Quand le commerce s’enracine dans la durée, la sympathie réciproque adoucit l’égoïsme calculateur.',
  },
  {
    id: 'moment_alliance_bourdieu_capital',
    when: 'alliance_longue',
    ghost: 'bourdieu',
    text: 'Votre pacte continu accumule un capital symbolique inestimable aux yeux des habitants de Val-Ferrand.',
  },
  {
    id: 'moment_alliance_keynes_stabilite',
    when: 'alliance_longue',
    ghost: 'keynes',
    text: 'La stabilité des engagements bilatéraux réduit l’incertitude radicale et favorise l’investissement patient.',
  },

  // =========================================================================
  // 2. TRAHISON (4 moments)
  // =========================================================================
  {
    id: 'moment_trahison_machiavel_pragmatisme',
    when: 'trahison',
    ghost: 'machiavel',
    text: 'Une promesse n’engageait que la naïveté de celui qui y croyait. Le coup d’audace était brutal mais efficace.',
  },
  {
    id: 'moment_trahison_hobbes_etat_nature',
    when: 'trahison',
    ghost: 'hobbes',
    text: 'Sans force souveraine pour contraindre les conventions, l’état de nature resurgit au premier profit immédiat.',
  },
  {
    id: 'moment_trahison_ostrom_rupture',
    when: 'trahison',
    ghost: 'ostrom',
    text: 'Rompre la parole donnée pour un gain éphémère détruit en un instant des mois de confiance laborieuse.',
  },
  {
    id: 'moment_trahison_dejours_blessure',
    when: 'trahison',
    ghost: 'dejours',
    text: 'La félonie commerciale ne brise pas seulement un contrat d’affaires, elle blesse la dignité de ceux qui s’étaient investis.',
  },

  // =========================================================================
  // 3. RÉCONCILIATION (4 moments)
  // =========================================================================
  {
    id: 'moment_reconciliation_smith_interet',
    when: 'reconciliation',
    ghost: 'smith',
    text: 'Les rancunes s’effacent devant le calcul lucide : commercer ensemble rapporte davantage que se détruire.',
  },
  {
    id: 'moment_reconciliation_marx_treve',
    when: 'reconciliation',
    ghost: 'marx',
    text: 'Une trêve temporaire entre entrepreneurs n’annule pas les contradictions objectives de la concurrence capitaliste.',
  },
  {
    id: 'moment_reconciliation_graeber_dette',
    when: 'reconciliation',
    ghost: 'graeber',
    text: 'Pardonner une dette morale rétablit le lien humain au-delà de la stricte comptabilité marchande.',
  },
  {
    id: 'moment_reconciliation_weber_contrat',
    when: 'reconciliation',
    ghost: 'weber',
    text: 'Une réconciliation durable repose sur des protocoles transparents et des garanties formelles, non sur de simples promesses.',
  },

  // =========================================================================
  // 4. RIVALITÉ OUVERTE (4 moments)
  // =========================================================================
  {
    id: 'moment_rivalite_schumpeter_orage',
    when: 'rivalite_ouverte',
    ghost: 'schumpeter',
    text: 'Que le meilleur l’emporte : le choc frontal de deux visions est le moteur le plus puissant de la transformation urbaine.',
  },
  {
    id: 'moment_rivalite_marx_antagonisme',
    when: 'rivalite_ouverte',
    ghost: 'marx',
    text: 'La concurrence acharnée transforme des collègues en prédateurs contraints d’accumuler sans trêve ou de succomber.',
  },
  {
    id: 'moment_rivalite_hayek_duel',
    when: 'rivalite_ouverte',
    ghost: 'hayek',
    text: 'La confrontation libre des offres sur le marché demeure la seule procédure impartiale de découverte.',
  },
  {
    id: 'moment_rivalite_raworth_degats',
    when: 'rivalite_ouverte',
    ghost: 'raworth',
    text: 'À trop vouloir terrasser le rival, vous épuisez les ressources du quartier sans créer la moindre valeur humaine.',
  },
];
