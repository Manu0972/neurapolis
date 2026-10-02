/**
 * NEURAPOLIS — Joutes Philosophiques Déchaînées des Fantômes dans le Quotidien
 * 8 joutes verbales percutantes, comiques et profondes (Survey 2 §5, ORIGINAL_REQUEST.md R2).
 */
import type { DoctrineKey, GhostId } from '../../core/types';

export interface GhostJoustOption {
  label: string;
  philosophicalAlignment: DoctrineKey;
  impactOnTeam: {
    fatigueDelta: number;
    stressDelta: number;
    moraleDelta: number;
  };
  impactOnBusiness: {
    speedMultiplier: number;
    marginDelta: number;
    customerTrustDelta: number;
  };
  narrativeOutcome?: string;
}

export interface GhostJoustDef {
  id: string;
  title: string;
  dailyTrigger: string;
  thinkers: GhostId[];
  dialogueExchanges: Array<{
    ghost: GhostId;
    quote: string;
  }>;
  options: GhostJoustOption[];
}

export const GHOST_JOUST_DEFS: GhostJoustDef[] = [
  // --------------------------------------------------------------------------
  // Joute 1 : La Pause-Café chez Bertin (Taylor vs Marx vs Dejours)
  // --------------------------------------------------------------------------
  {
    id: 'joute_pause_cafe',
    title: 'La Pause-Café chez Bertin',
    dailyTrigger: 'Mme Bertin met 12 minutes pour faire bouillir son vieux percolateur.',
    thinkers: ['taylor', 'marx', 'dejours'],
    dialogueExchanges: [
      {
        ghost: 'taylor',
        quote:
          'Sept cent vingt secondes ! Sept cent vingt secondes pour transférer cinquante millilitres d’eau chaude à travers cinq grammes de mouture ! J’ai observé quatorze gestes purement parasitaires : elle a retourné son torchon trois fois, commenté la météo et hésité sur le sucrier. Avec un mouvement pendulaire standardisé, cette tâche tombe à quarante-trois secondes. C’est un vol de temps caractérisé !',
      },
      {
        ghost: 'marx',
        quote:
          'Regardez l’ingénieur en chef du capitalisme de caserne ! Il voit une vieille dame qui offre de la chaleur humaine à un travailleur fatigué, et son cerveau d’automate ne calcule qu’une soustraction de secondes ! Ce que tu appelles gestes parasites, Taylor, c’est le seul moment de la journée où Mme Bertin n’est pas une machine à rendre la monnaie ! Tu veux chronométrer son âme pour que le profit s’accélère !',
      },
      {
        ghost: 'dejours',
        quote:
          'Camille, écoute-les s’écharper, mais regarde ce qui se passe vraiment sous tes yeux. Si Mme Bertin servait son café en quarante secondes sans un mot, Samir retournerait à son tour mécanique avec la boule au ventre. Ces douze minutes ne sont pas du temps perdu : ce sont un espace de décompression psychique indispensable. Sans ce bavardage sur la pluie, le collectif explose avant midi.',
      },
      {
        ghost: 'taylor',
        quote:
          'Et quand le Drive vendra son café lyophilisé à cinquante centimes en borne automatique, votre santé psychique ira pointer au chômage !',
      },
      {
        ghost: 'marx',
        quote:
          'Qu’il vienne, leur automate ! Le quartier lui jettera du marc de café brûlant dans ses circuits imprimés !',
      },
    ],
    options: [
      {
        label: 'Optimiser le stand à la Taylor (service à la chaîne)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: 15, stressDelta: 10, moraleDelta: -10 },
        impactOnBusiness: { speedMultiplier: 1.25, marginDelta: 0, customerTrustDelta: -5 },
        narrativeOutcome:
          'Le service s’accélère vigoureusement, mais Noah grogne sous la cadence et Lina peste contre l’ambiance d’usine.',
      },
      {
        label: 'Ritualiser la pause conviviale avec Dejours',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: -10, stressDelta: -20, moraleDelta: 15 },
        impactOnBusiness: { speedMultiplier: 0.9, marginDelta: 0, customerTrustDelta: 10 },
        narrativeOutcome:
          'L’équipe partage gâteaux et sourires pendant quinze minutes. Les clients patientent avec bienveillance.',
      },
      {
        label: 'Arbitrage Smith : laisser chaque client choisir entre express et bavardage',
        philosophicalAlignment: 'marche',
        impactOnTeam: { fatigueDelta: 0, stressDelta: 0, moraleDelta: 5 },
        impactOnBusiness: { speedMultiplier: 1.05, marginDelta: 2, customerTrustDelta: 5 },
        narrativeOutcome:
          'Une double file naturelle se crée d’elle-même sans heurt.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 2 : Le Croissant à 1,40 € (Marx vs Smith vs Hayek)
  // --------------------------------------------------------------------------
  {
    id: 'joute_croissant_beurre',
    title: 'Le Croissant à 1,40 €',
    dailyTrigger: 'Le boulanger augmente le croissant de 20 centimes suite à la hausse du cours du beurre.',
    thinkers: ['marx', 'smith', 'hayek'],
    dialogueExchanges: [
      {
        ghost: 'marx',
        quote:
          'Vingt centimes de plus ! Regarde ça, camarade ! Vingt centimes extorqués sur la poche d’un gamin qui part à l’école le ventre creux ! Le boulanger paie-t-il son apprenti vingt centimes de plus pour cuire la pâte à quatre heures du matin ? Non ! La marchandise masque le rapport de force ! C’est le cartel meunier qui étrille la table du pauvre !',
      },
      {
        ghost: 'smith',
        quote:
          'Allons, mon ami Karl, rangez vos piques dans votre redingote. Le boulanger n’a pas augmenté son pain par cruauté ni par complot : il a regardé le prix du quintal de beurre sur le marché de gros. S’il vend à perte par pure charité chrétienne, demain son four s’éteint, son mitron dort dans la rue et personne n’a de croissant du tout. Le prix naturel n’est pas une punition, c’est le thermomètre de la dépense réelle !',
      },
      {
        ghost: 'hayek',
        quote:
          'Mieux que cela, mon cher Smith : un télégramme divin ! Ce croissant à un euro quarante transporte une vérité condensée que nul commissaire au plan ne saurait calculer dans son bureau de préfecture ! Il dit : la sécheresse a frappé les pâturages, économisez le beurre ! Ceux qui peuvent payer paient, les autres mangent du pain bis, et l’équilibre renaît sans qu’aucun tyran n’ait eu à dicter les rations !',
      },
      {
        ghost: 'marx',
        quote:
          'Et celui qui n’a pas les quarante centimes, Hayek, ton télégramme lui conseille de lécher la vitrine sous la pluie ?',
      },
      {
        ghost: 'smith',
        quote:
          'Il a raison sur ce point, Friedrich… Le marché sans sympathie devient un jeu cruel. Un souverain éclairé devrait veiller à ce que le pain de base reste accessible.',
      },
    ],
    options: [
      {
        label: 'Ajuster le prix du stand au marché (Smith & Hayek)',
        philosophicalAlignment: 'marche',
        impactOnTeam: { fatigueDelta: 0, stressDelta: 0, moraleDelta: 0 },
        impactOnBusiness: { speedMultiplier: 1.0, marginDelta: 15, customerTrustDelta: -3 },
        narrativeOutcome:
          'La marge unitaire est préservée face à la hausse des coûts, mais deux élèves réguliers boudent le stand.',
      },
      {
        label: 'Maintenir le prix coûtant solidaire (Marx)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: 5, stressDelta: 5, moraleDelta: 10 },
        impactOnBusiness: { speedMultiplier: 1.0, marginDelta: -10, customerTrustDelta: 15 },
        narrativeOutcome:
          'Les élèves applaudissent la résistance du stand ; la popularité de Camille atteint des sommets.',
      },
      {
        label: 'Créer un tarif solidaire suspendu (Ostrom)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: 2, stressDelta: -5, moraleDelta: 8 },
        impactOnBusiness: { speedMultiplier: 0.95, marginDelta: 0, customerTrustDelta: 12 },
        narrativeOutcome:
          'Ceux qui ont de la monnaie paient 10 centimes de plus pour offrir un goûter suspendu aux camarades sans argent.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 3 : La Prise Électrique du Stand (Ostrom vs Hobbes vs Locke)
  // --------------------------------------------------------------------------
  {
    id: 'joute_prise_electrique',
    title: 'La Prise Électrique du Stand',
    dailyTrigger: 'Une unique prise 220V extérieure disputée entre la sono de Noah, la meuleuse de Karim et la balance du stand.',
    thinkers: ['ostrom', 'hobbes', 'locke'],
    dialogueExchanges: [
      {
        ghost: 'hobbes',
        quote:
          'Regardez-les. Trois volontés jalouses, un seul fil de cuivre. Dans dix secondes, les insultes pleuvent ; dans deux minutes, Karim lève sa clé de vingt-quatre ! Voilà l’état de nature miniature : la guerre de chacun contre chacun pour un kilowatt-heure ! Camille, prends un cadenas, verrouille le boîtier et décrète qui a le droit d’approcher ! Les pactes sans disjoncteur ne sont que des mots !',
      },
      {
        ghost: 'locke',
        quote:
          'Un instant, Thomas. Pas de tyrannie préventive. Le droit naturel est limpide : qui a tiré la rallonge depuis l’atelier ce matin sous la pluie ? C’est Karim. Par son travail physique, il a mêlé sa sueur à cette source d’énergie. Elle est son extension légitime jusqu’à ce qu’il ait achevé son ouvrage. Noah n’a qu’à chanter a cappella et Camille utiliser une balance romaine à poids ! On ne confisque pas le fruit de l’effort pour le caprice de la foule !',
      },
      {
        ghost: 'ostrom',
        quote:
          'Vous êtes insupportables, tous les deux. L’un veut un dictateur avec un cadenas, l’autre une guerre de propriétaires au centimètre carré ! J’ai étudié des systèmes d’irrigation à Valence où dix mille paysans se partagent trois canaux depuis le Moyen Âge sans s’égorger ! Regardez ce qu’on fait : on pose une multiprise trois plots, on établit un tour de rôle : Karim meule vingt minutes, puis silence pendant la vente, et Noah met sa musique en fond sonore modéré. Une règle claire, graduée, surveillée par les usagers eux-mêmes !',
      },
      {
        ghost: 'hobbes',
        quote:
          'Et quand Noah poussera les basses à fond dès que vous aurez le dos tourné, Elinor ? Qui aura l’épée pour débrancher ?',
      },
      {
        ghost: 'ostrom',
        quote:
          'Personne n’aura d’épée, Thomas. Mme Bertin lui jettera un torchon mouillé depuis sa fenêtre, et la honte suffira amplement.',
      },
    ],
    options: [
      {
        label: 'Charte d’usage partagé et multiprise (Ostrom)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: -5, stressDelta: -15, moraleDelta: 12 },
        impactOnBusiness: { speedMultiplier: 1.1, marginDelta: 0, customerTrustDelta: 8 },
        narrativeOutcome:
          'La multiprise fonctionne à merveille : Karim ébavure à l’heure, Noah met de la musique douce et la balance ne saute plus.',
      },
      {
        label: 'Verrouillage d’autorité par Camille (Hobbes)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: 5, stressDelta: 10, moraleDelta: -8 },
        impactOnBusiness: { speedMultiplier: 1.15, marginDelta: 0, customerTrustDelta: -2 },
        narrativeOutcome:
          'Camille confisque la prise pour le stand. Zéro panne, mais Noah boude dans son coin pendant deux jours.',
      },
      {
        label: 'Priorité absolue au premier arrivant (Locke)',
        philosophicalAlignment: 'marche',
        impactOnTeam: { fatigueDelta: 0, stressDelta: 5, moraleDelta: -3 },
        impactOnBusiness: { speedMultiplier: 0.95, marginDelta: 0, customerTrustDelta: 0 },
        narrativeOutcome:
          'Karim utilise toute l’électricité pour sa meuleuse ; le stand pèse ses biscuits au jugé.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 4 : Le Lot de Pommes Flétries (Keynes vs Ricardo vs Simon)
  // --------------------------------------------------------------------------
  {
    id: 'joute_pommes_fletries',
    title: 'Le Lot de Pommes Flétries',
    dailyTrigger: 'Trois cageots de pommes flétries invendables au prix fort chez Mme Bertin menacent d’être jetés.',
    thinkers: ['keynes', 'ricardo', 'simon'],
    dialogueExchanges: [
      {
        ghost: 'ricardo',
        quote:
          'Jeter de la nourriture ? C’est une hérésie contre la valeur-travail ! Appliquons immédiatement l’avantage comparatif : le Stand excelle dans la transformation légère, Mme Bertin possède les bocaux et le sucre. Transformons ces fruits en compote vanillée en pots consignés, troquons deux tiers contre de la farine à la boulangerie et vendons le reste ! Les deux commerces augmentent leur richesse globale sans injecter un seul centime liquide !',
      },
      {
        ghost: 'keynes',
        quote:
          'Trop lent, mon cher David ! Vos compotes mettront trois jours à cuire et le quartier aura oublié d’avoir faim ! Ce qu’il faut ici, c’est amorcer la pompe de la demande ! Camille, achète immédiatement ces trois cageots à Mme Bertin avec la trésorerie du stand, même à perte ! Offre une pomme gratuite pour chaque paquet de sablés acheté cet après-midi ! Le bruit va courir, les collégiens vont affluer, l’argent va circuler, et ce soir la caisse de Bertin est pleine et la tienne aussi ! Dépenser d’abord, compter après : c’est le multiplicateur en action !',
      },
      {
        ghost: 'simon',
        quote:
          'Admirez nos deux docteurs ès calculs infinis ! L’un bâtit une usine de confiture pour trois cageots, l’autre veut faire du déficit public avec l’argent de poche d’un gamin de douze ans ! Combien de temps de cerveau avez-vous à perdre ? Posez un carton sur le trottoir : "Pommes à tarte, 50 centimes le sachet, servez-vous". Dans une heure, le trottoir est propre, Mme Bertin a récupéré six euros, et Camille a ses devoirs de géométrie à faire. Le satisfaisant bat l’optimal sept jours sur sept !',
      },
      {
        ghost: 'keynes',
        quote:
          'Mais Herbert, où est le panache de la relance ?',
      },
      {
        ghost: 'simon',
        quote:
          'Le panache, mon cher Maynard, c’est pour ceux qui n’ont pas de contrôle de fractions à huit heures demain matin.',
      },
    ],
    options: [
      {
        label: 'Appliquer l’heuristique satisfaisante (Simon)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: -5, stressDelta: -10, moraleDelta: 5 },
        impactOnBusiness: { speedMultiplier: 1.05, marginDelta: 5, customerTrustDelta: 4 },
        narrativeOutcome:
          'En 40 minutes, le carton est vide, six euros sont remis à Bertin sans complication inutile.',
      },
      {
        label: 'Relance par la gratuité promotionnelle (Keynes)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: 10, stressDelta: 5, moraleDelta: 10 },
        impactOnBusiness: { speedMultiplier: 1.3, marginDelta: -5, customerTrustDelta: 15 },
        narrativeOutcome:
          'La foule des collégiens se rue sur le stand ; tous les biscuits partent en vingt minutes.',
      },
      {
        label: 'Transformation en compote et troc croisé (Ricardo)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: 15, stressDelta: 0, moraleDelta: 8 },
        impactOnBusiness: { speedMultiplier: 0.85, marginDelta: 20, customerTrustDelta: 10 },
        narrativeOutcome:
          'Une après-midi de cuisine collective donne 18 pots de compote ambrée très prisés.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 5 : La Balayeuse Mécanique ou le Balai de Paille (Illich vs Taylor vs Ohno)
  // --------------------------------------------------------------------------
  {
    id: 'joute_balai_atelier',
    title: 'La Balayeuse Mécanique ou le Balai de Paille',
    dailyTrigger: 'Nettoyer 200 m² de graviers et de pavés devant les ateliers de la Friche Taret.',
    thinkers: ['illich', 'taylor', 'ohno'],
    dialogueExchanges: [
      {
        ghost: 'illich',
        quote:
          'Regardez ce monstre pétaradant à essence ! Si vous louez cet engin, vous franchissez le seuil de contre-productivité ! Il consomme du carburant qu’il faut payer en heures de travail forcé ; il fait un vacarme qui brise la parole entre voisins ; il tombera en panne dans trois jours et exigera un réparateur agréé ! Le balai de paille est un outil convivial : n’importe qui peut le réparer, le manier en chantant et le transmettre sans notice de quarante pages !',
      },
      {
        ghost: 'taylor',
        quote:
          'Balayer à la main deux cents mètres carrés ! Mais c’est le Moyen Âge ! Vous voulez épuiser les bras de l’équipe avant même qu’ils n’aient commencé à produire ! Avec la balayeuse mécanique, un seul opérateur couvre la surface en huit minutes chrono, libérant sept heures d’ouvrier pour des tâches à réelle valeur ajoutée ! Votre convivialité, Illich, c’est l’éloge de la courbature !',
      },
      {
        ghost: 'ohno',
        quote:
          'Vous vous disputez sur la manière de ramasser la poussière… Vous n’avez rien compris. Pourquoi y a-t-il autant de gravier sur cette place ? Regardez : la goulotte du toit est percée, et à chaque averse, l’eau ravine la butte de terre et étale les cailloux devant la porte. Appliquez les Cinq Pourquoi ! Pourquoi balayer chaque matin une saleté qu’on peut empêcher de couler en posant deux briques et un tuyau ? Supprimez le gaspillage à la source (Muda), et vous n’aurez besoin ni du monstre de Taylor, ni de vos balais de sorcier, Illich !',
      },
      {
        ghost: 'illich',
        quote:
          'Ha ! Voilà un homme qui sait regarder le seuil. Réparer la gouttière est un geste convivial. Je vote pour les briques d’Ohno.',
      },
      {
        ghost: 'taylor',
        quote:
          'Si on chronométrait la pose des briques, ce serait parfait…',
      },
    ],
    options: [
      {
        label: 'Kaizen : réparer la gouttière à la racine (Ohno)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: 5, stressDelta: -10, moraleDelta: 15 },
        impactOnBusiness: { speedMultiplier: 1.1, marginDelta: 10, customerTrustDelta: 8 },
        narrativeOutcome:
          'Deux briques et un tuyau de zinc scellés : la place reste propre pour toujours sans balayage quotidien.',
      },
      {
        label: 'Balayeuse mécanique rapide (Taylor)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: -5, stressDelta: 10, moraleDelta: -5 },
        impactOnBusiness: { speedMultiplier: 1.25, marginDelta: -15, customerTrustDelta: -3 },
        narrativeOutcome:
          'Nettoyé en huit minutes, mais l’odeur d’essence et le bruit indisposent les riverains.',
      },
      {
        label: 'Nettoyage collectif aux balais de paille (Illich)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: 15, stressDelta: -15, moraleDelta: 12 },
        impactOnBusiness: { speedMultiplier: 0.9, marginDelta: 0, customerTrustDelta: 12 },
        narrativeOutcome:
          'Le balayage se transforme en veillée joyeuse avec chansons et rires partagés.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 6 : Le Cadenas sur la Boîte de Recettes (Hobbes vs Graeber vs Machiavel)
  // --------------------------------------------------------------------------
  {
    id: 'joute_cadenas_recettes',
    title: 'Le Cadenas sur la Boîte de Recettes',
    dailyTrigger: 'Lina veut acheter un cadenas à chiffres pour la boîte de recettes contenant 42 euros.',
    thinkers: ['hobbes', 'graeber', 'machiavel'],
    dialogueExchanges: [
      {
        ghost: 'hobbes',
        quote:
          'Achetez ce cadenas sur-le-champ ! Et changez la combinaison chaque soir ! L’occasion fait le larron, ce n’est pas un proverbe de curé, c’est la physique fondamentale des sociétés humaines ! Si vous laissez cette boîte entrouverte, vous invitez la tentation à détruire votre amitié. La paix sociale exige que le vol soit techniquement impossible avant d’être moralement condamné !',
      },
      {
        ghost: 'graeber',
        quote:
          'Thomas, mon pauvre vieux, tu as passé trop de temps terrifié dans les salons de la noblesse anglaise ! Un cadenas entre trois gosses de douze ans qui montent un stand ? C’est le poison absolu ! Dès que tu poses une serrure, tu déclares que le groupe est une bande de voleurs en sursis ! Laissez la boîte ouverte au milieu de la table ! L’économie humaine repose sur la dette morale et le don mutuel : personne ne vole quand tout le monde a vu qu’on lui faisait confiance !',
      },
      {
        ghost: 'machiavel',
        quote:
          'Comme vous êtes extrêmes… L’un veut transformer une boîte à biscuits en forteresse, l’autre veut faire vœu de pauvreté franciscaine. Camille, écoute l’art de gouverner : achète le cadenas, pose-le ostensiblement sur la boîte, mais ne le verrouille pas ! Que tout le monde voie le cadenas : ils penseront que tu es vigilant et qu’on ne te trompe pas impunément. Mais ne l’enclenche pas : ainsi, Lina est rassurée par l’apparence de la rigueur, Noah n’est pas vexé, et toi, tu gardes l’œil ouvert. Paraître fort évite d’avoir à punir.',
      },
      {
        ghost: 'graeber',
        quote:
          'C’est tordu, Nicolas. Génial, mais affreusement tordu.',
      },
      {
        ghost: 'hobbes',
        quote:
          'Le jour où la boîte disparaît, Machiavel, votre cadenas ouvert fera beaucoup rire le voleur.',
      },
    ],
    options: [
      {
        label: 'Confiance absolue : boîte ouverte et transparente (Graeber)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: 0, stressDelta: -10, moraleDelta: 15 },
        impactOnBusiness: { speedMultiplier: 1.0, marginDelta: 0, customerTrustDelta: 10 },
        narrativeOutcome:
          'La confiance renforce les liens de l’équipe ; Noah compte les pièces avec fierté et honnêteté.',
      },
      {
        label: 'Dissuasion symbolique : le cadenas posé non verrouillé (Machiavel)',
        philosophicalAlignment: 'marche',
        impactOnTeam: { fatigueDelta: 0, stressDelta: 0, moraleDelta: 5 },
        impactOnBusiness: { speedMultiplier: 1.0, marginDelta: -2, customerTrustDelta: 5 },
        narrativeOutcome:
          'Chacun sourit devant l’astuce ; Lina note les totaux sans anxiété.',
      },
      {
        label: 'Sécurité stricte : code secret à double clé (Hobbes)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: 5, stressDelta: 10, moraleDelta: -8 },
        impactOnBusiness: { speedMultiplier: 0.95, marginDelta: -5, customerTrustDelta: -2 },
        narrativeOutcome:
          'Zéro risque de vol, mais une atmosphère de méfiance s’installe pour la journée.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 7 : L’Affiche Dessinée par Noah (Bourdieu vs Smith vs Stiegler)
  // --------------------------------------------------------------------------
  {
    id: 'joute_affiche_dessinee',
    title: 'L’Affiche Dessinée par Noah',
    dailyTrigger: 'Noah a dessiné une grande affiche fluorescente truffée de monstres et de fautes volontaires ("Les Krépes Atomik").',
    thinkers: ['bourdieu', 'smith', 'stiegler'],
    dialogueExchanges: [
      {
        ghost: 'smith',
        quote:
          'Voyons le signal économique… Les couleurs vives attirent le regard à trente pas, c’est indéniable. L’information essentielle est là : le produit, l’heure, le lieu. Mais l’orthographe est fantaisiste, mon ami Noah ! Les ménagères respectables risquent de croire que vos crêpes sont préparées avec la même négligence que votre grammaire ! Un commerce doit inspirer la confiance dans la régularité du produit. Un panneau propre en lettres d’imprimerie vendrait davantage auprès de la clientèle solvable.',
      },
      {
        ghost: 'bourdieu',
        quote:
          'Justement, Smith ! C’est exactement là que se joue la violence symbolique ! Vous voulez imposer à ce gamin les codes graphiques de la bourgeoisie commerçante ! Si Noah écrit "Crêpes" avec un K et dessine des monstres, il émet un signal de reconnaissance tribal destiné aux collégiens de sa classe ! Pour les élèves de 5e B, cette affiche est un mot de passe ; pour les notables, c’est du vandalisme ! La question n’est pas de savoir si c’est bien dessiné, mais quel capital culturel ce dessin mobilise, et qui il exclut en prétendant rassembler !',
      },
      {
        ghost: 'stiegler',
        quote:
          'Arrêtez de réduire ce dessin à un panneau publicitaire ou à un marqueur de classe ! Regardez ce qu’a fait cet enfant : il a pris des feutres, il a passé deux heures concentré sur une feuille, il a mobilisé son imagination et son savoir-faire manuel contre les images standardisées que les écrans lui vomissent dessus toute la journée ! Ce dessin est une victoire contre la prolétarisation de l’esprit ! Même avec des fautes d’orthographe, cette feuille a mille fois plus d’âme que les prospectus glacés du Drive !',
      },
      {
        ghost: 'bourdieu',
        quote:
          'N’empêche que Mme Bertin ne la collera jamais sur sa devanture en crépi…',
      },
      {
        ghost: 'stiegler',
        quote:
          'Alors qu’elle la colle sur un réverbère ! La rue appartient à ceux qui y tracent encore leurs propres lignes !',
      },
    ],
    options: [
      {
        label: 'Afficher fièrement le dessin de Noah (Stiegler & Bourdieu)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: -5, stressDelta: -10, moraleDelta: 20 },
        impactOnBusiness: { speedMultiplier: 1.15, marginDelta: 0, customerTrustDelta: 5 },
        narrativeOutcome:
          'Noah saute de joie ; les collégiens s’attroupent en riant autour du dinosaure fluorescent.',
      },
      {
        label: 'Affiche commerciale sobre et corrigée (Smith)',
        philosophicalAlignment: 'marche',
        impactOnTeam: { fatigueDelta: 5, stressDelta: 5, moraleDelta: -10 },
        impactOnBusiness: { speedMultiplier: 1.05, marginDelta: 5, customerTrustDelta: 10 },
        narrativeOutcome:
          'Les grands-parents du quartier apprécient la clarté des prix ; Noah est un peu dépité.',
      },
      {
        label: 'Co-création : monstres de Noah + calligraphie soignée de Lina (Communs)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: 5, stressDelta: -5, moraleDelta: 15 },
        impactOnBusiness: { speedMultiplier: 1.2, marginDelta: 5, customerTrustDelta: 15 },
        narrativeOutcome:
          'Le compromis parfait fait l’admiration générale de la place et de Mme Bertin.',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Joute 8 : Le Réseau Wi-Fi Ouvert des Hauts (Zuboff vs Rousseau vs Ostrom)
  // --------------------------------------------------------------------------
  {
    id: 'joute_wifi_ouvert',
    title: 'Le Réseau Wi-Fi Ouvert des Hauts',
    dailyTrigger: 'L’antenne Wi-Fi libre des Hauts est saturée par des téléchargements massifs d’un passager clandestin.',
    thinkers: ['zuboff', 'rousseau', 'ostrom'],
    dialogueExchanges: [
      {
        ghost: 'zuboff',
        quote:
          'Vous avez ouvert une bergerie sans clôture au milieu des loups ! Vous croyez offrir de la liberté, et vous offrez un banquet gratuit aux extracteurs de surveillance ! Tout le trafic qui passe par ce routeur non chiffré est interceptable par la première camionnette connectée qui stationne en bas ! Leurs requêtes de santé, leurs conversations privées : vous livrez l’expérience brute du quartier aux courtiers en données ! La gratuité sans souveraineté technique est le piège le plus ancien du capitalisme de surveillance !',
      },
      {
        ghost: 'rousseau',
        quote:
          'La liberté n’est pas le problème, Shoshana, c’est l’absence de volonté générale ! Le citoyen qui accapare toute la bande passante pour des futilités fait prévaloir son amour-propre et son intérêt particulier sur le bien commun ! Il faut réunir l’assemblée des usagers du réseau ! Celui qui refuse de limiter son débit pour permettre aux enfants d’étudier et aux aînés de téléphoner doit y être contraint par le vote de tous ! On doit le forcer à être un internaute libre et civique !',
      },
      {
        ghost: 'ostrom',
        quote:
          'Jean-Jacques, tu vas encore organiser une assemblée de trois heures pour voter une loi qui sera obsolète dès qu’un nouvel habitant emménagera ! J’ai étudié la gestion des forêts communales au Japon et des alpages suisses : quand une ressource commune est saturée, on n’invoque ni la terreur algorithmique ni la vertu civique universelle. On applique des règles graduées : un bridage de débit automatique aux heures de pointe pour les téléchargements lourds, et une surveillance par les pairs ! Tu télécharges un film ? Très bien, mais tu le fais la nuit entre deux et six heures quand le réseau dort !',
      },
      {
        ghost: 'zuboff',
        quote:
          'Et qui contrôle le firmware du routeur qui applique le bridage, Elinor ?',
      },
      {
        ghost: 'ostrom',
        quote:
          'Les jeunes du fablab de Djamila, avec un logiciel libre audité par leurs soins. Ni Google, ni ton souverain imaginaire, Jean-Jacques.',
      },
    ],
    options: [
      {
        label: 'Gouvernance par quotas horaires négociés (Ostrom)',
        philosophicalAlignment: 'communs',
        impactOnTeam: { fatigueDelta: -5, stressDelta: -10, moraleDelta: 12 },
        impactOnBusiness: { speedMultiplier: 1.05, marginDelta: 0, customerTrustDelta: 12 },
        narrativeOutcome:
          'Le bridage nocturne rétablit un débit fluide pour tous ; le réseau redevient stable et partagé.',
      },
      {
        label: 'Chiffrement strict et charte civique votée (Rousseau)',
        philosophicalAlignment: 'solidarite',
        impactOnTeam: { fatigueDelta: 10, stressDelta: 5, moraleDelta: 8 },
        impactOnBusiness: { speedMultiplier: 1.0, marginDelta: 0, customerTrustDelta: 10 },
        narrativeOutcome:
          'Une assemblée citoyenne houleuse mais victorieuse vote la charte déontologique du réseau.',
      },
      {
        label: 'Coupure préventive et sécurisation par mots de passe individuels (Zuboff)',
        philosophicalAlignment: 'autorite',
        impactOnTeam: { fatigueDelta: 5, stressDelta: 10, moraleDelta: -5 },
        impactOnBusiness: { speedMultiplier: 0.95, marginDelta: -5, customerTrustDelta: 0 },
        narrativeOutcome:
          'Le réseau est hyper-sécurisé, mais plusieurs familles modestes perdent leur accès internet.',
      },
    ],
  },
];

export const GHOST_JOUST_BY_ID: Record<string, GhostJoustDef> = Object.fromEntries(
  GHOST_JOUST_DEFS.map((j) => [j.id, j])
);
