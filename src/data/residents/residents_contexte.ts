/**
 * Répliques et rumeurs contextuelles des 36 habitants (vague 14).
 *
 * Elles complètent `RESIDENTS` (5 répliques et 2 rumeurs chacun) : chaque habitant atteint au
 * moins 12 répliques et 5 rumeurs. Une réplique peut dépendre du moment de la journée, de la
 * météo, de la saison, du chapitre, de la réputation du joueur, d'une fête de la place
 * (src/data/happenings_saison.ts) ou d'un fait récent du journal. La simulation
 * (src/simulation/residents.ts) préfère une réplique de circonstance et ne répète rien tant que
 * le reste n'a pas été dit.
 *
 * Accords : « {prenom} » et « {e} » passent par `personalize` (simulation/story.ts) ; aucun mot
 * genré adressé au joueur (garçon, fiston, mon grand…).
 */
import type { Meteo } from '../../core/types';
import type { Sector } from '../../core/happenings_types';
import type { SeasonKey } from '../district';

export type MomentJournee = 'matin' | 'midi' | 'apresmidi' | 'soir' | 'nuit';

/** Circonstances d'une réplique : toutes celles indiquées doivent être réunies. */
export interface QuandReplique {
  moment?: readonly MomentJournee[];
  meteo?: readonly Meteo[];
  saison?: readonly SeasonKey[];
  /** Chapitre de la campagne, bornes comprises. */
  chapitre?: readonly [number, number];
  /** Réputation du joueur dans le quartier : haute (≥ 65) ou basse (≤ 30). */
  reputation?: 'haute' | 'basse';
  /** Fête de la place ce jour-là (identifiant de src/data/happenings_saison.ts). */
  fete?: string;
  /** Début du titre d'un fait du journal de moins de 21 jours. */
  recent?: string;
}

export interface RepliqueHabitant {
  text: string;
  quand?: QuandReplique;
}

export interface RumeurHabitant {
  text: string;
  secretId?: string;
  ideaId?: string;
  sector?: Sector;
  quand?: QuandReplique;
}

export interface ContexteHabitant {
  lines: readonly RepliqueHabitant[];
  rumors: readonly RumeurHabitant[];
}

const PLUIE: QuandReplique = { meteo: ['pluie'] };
const SOLEIL: QuandReplique = { meteo: ['soleil'] };
const HIVER: QuandReplique = { saison: ['hiver'] };
const ETE: QuandReplique = { saison: ['ete'] };
const AUTOMNE: QuandReplique = { saison: ['automne'] };
const PRINTEMPS: QuandReplique = { saison: ['printemps'] };
const MATIN: QuandReplique = { moment: ['matin'] };
const SOIR: QuandReplique = { moment: ['soir', 'nuit'] };
const CH3: QuandReplique = { chapitre: [3, 9] };
const CH4: QuandReplique = { chapitre: [4, 9] };
const CH5: QuandReplique = { chapitre: [5, 9] };
const CONNU: QuandReplique = { reputation: 'haute' };
const DISCRET: QuandReplique = { reputation: 'basse' };
const VENTE: QuandReplique = { recent: 'Vente au stand' };
const RENTREE: QuandReplique = { fete: 'rentree' };
const TOUSSAINT: QuandReplique = { fete: 'toussaint' };
const NOEL: QuandReplique = { fete: 'noel' };
const MARCHE_ETE: QuandReplique = { fete: 'marche_ete' };

const r = (text: string, quand?: QuandReplique): RepliqueHabitant => (quand ? { text, quand } : { text });

export const RESIDENT_CONTEXT: Readonly<Record<string, ContexteHabitant>> = {
  // ------------------------------------------------------------------ Gare Est
  res_hamid_cheminot: {
    lines: [
      r('Sous la pluie, les rails chantent plus aigu. J’entends encore si un convoi est trop chargé.', PLUIE),
      r('En hiver, on sablait les aiguillages à la main. Aujourd’hui, une résistance électrique fait le travail : moins de monde, plus d’énergie.', HIVER),
      r('Le matin, je compte les wagons qui partent pleins et ceux qui reviennent vides. Les vides, c’est de l’argent qui roule pour rien.', MATIN),
      r('On parle de toi jusqu’au triage, {prenom}. Paraît que tu tiens parole : garde ça, ça vaut plus qu’un salaire.', CONNU),
      r('Le marché de Noël sur la place, c’est le seul jour où je vois les gens de la Gare et ceux des Roses rire ensemble.', NOEL),
      r('Ton stand a bien vendu, à ce qu’on dit ? Pense au transport de ta marchandise : c’est souvent là que fuit la marge.', VENTE),
      r('Ton quartier s’organise, je l’ai lu dans le bulletin. Un réseau, c’est comme une voie ferrée : il faut l’entretenir chaque jour.', CH3),
    ],
    rumors: [
      { text: 'Les cheminots disent que la SNCF songe à fermer la gare de marchandises le dimanche. Les grossistes s’inquiètent pour leurs livraisons du lundi.', sector: 'logistique' },
      { text: 'Un ancien du dépôt garde chez lui les registres de fret des années 80 : on y voit chaque tonne d’acier qui quittait la vallée.', sector: 'industrie' },
      { text: 'Il se dit qu’une coopérative de transport cherche des chauffeurs dans la vallée. Les salaires seraient discutés en assemblée.', sector: 'logistique', quand: CH3 },
    ],
  },
  res_solange_grossiste: {
    lines: [
      r('Quand il pleut, les commandes de soupe doublent. On ne vend pas la même chose selon le ciel.', PLUIE),
      r('En septembre, tout le monde achète des cahiers et des goûters. La rentrée, c’est notre deuxième Noël.', { saison: ['finEte'] }),
      r('Décembre, c’est la folie : chocolats, clémentines, papillotes. On fait un tiers de l’année en trois semaines.', HIVER),
      r('Tu as vendu pas mal au stand, non ? Si tu achètes plus gros, négocie un prix par carton plutôt qu’à l’unité.', VENTE),
      r('Ton nom circule chez les commerçants, {prenom}. On te fera crédit plus facilement : ne le gâche pas.', CONNU),
      r('Le marché d’été de ce soir, c’est mes petits producteurs qui tiennent les étals. Moi, je leur prête la chambre froide.', MARCHE_ETE),
      r('Tu sais ce qu’est une marge arrière ? Le fournisseur reverse une prime au magasin qui vend beaucoup. Les petits n’y ont jamais droit.'),
    ],
    rumors: [
      { text: 'Les clémentines de cet hiver arrivent avec deux semaines de retard : un port est engorgé en Espagne. Les prix vont grimper avant Noël.', sector: 'alimentation', quand: HIVER },
      { text: 'Le Drive HyperVal négocie un contrat d’exclusivité avec le plus gros fabricant de biscuits. Les épiceries risquent de manquer de stock.', sector: 'commerce' },
      { text: 'On dit que Mme Bertin a refusé de vendre son fonds à une chaîne, malgré une offre généreuse. Elle aurait répondu : « Pas tant que le quartier vient. »', sector: 'commerce' },
    ],
  },
  res_claire_guichetiere: {
    lines: [
      r('Les jours de pluie, la salle d’attente déborde : ceux qui marchent d’habitude prennent le train.', PLUIE),
      r('La rentrée sur la place, c’est aussi le stand des syndicats. Viens poser des questions, ça ne mord pas.', RENTREE),
      r('Un abonnement, c’est un pari : tu paies d’avance parce que tu crois que tu vas t’en servir. Comme une assurance.'),
      r('Entre Noël et le jour de l’an, on vend des billets aux familles qui se retrouvent. Le guichet, c’est le cœur de la ville.', HIVER),
      r('On dit que tu aides l’épicerie des Roses. C’est exactement ça, la solidarité : rendre service avant d’en avoir besoin.', CH3),
      r('Tu te fais rare, ces temps-ci. Personne ne te connaît encore vraiment : montre ce que tu sais faire.', DISCRET),
      r('Au débat de la place, prends la parole. Les décisions se prennent souvent avec ceux qui viennent.', CH4),
    ],
    rumors: [
      { text: 'La région parle d’un tarif solidaire pour les lycéens de la vallée. Le vote serait serré au conseil régional.', sector: 'services' },
      { text: 'Il paraît que le guichet de la gare pourrait fermer l’après-midi, remplacé par des bornes. Les anciens ne savent pas s’en servir.', sector: 'tech' },
      { text: 'On raconte que la caisse de grève de 1995 n’a jamais été entièrement dépensée. Le reste dormirait sur un livret au nom du syndicat.', sector: 'finance' },
    ],
  },
  res_igor_ferrailleur: {
    lines: [
      r('La pluie fait rouiller, et la rouille fait baisser le prix du kilo. Je bâche tout avant l’averse.', PLUIE),
      r('Le cuivre a pris dix pour cent ce mois-ci. Quand le monde construit, le métal vaut de l’or.'),
      r('L’hiver, les gens vident leurs caves. Vieux radiateurs, vélos cassés : tout ça repart à la fonderie.', HIVER),
      r('Le vide-grenier de la Toussaint ? Je fais le tour à six heures, avant tout le monde. Les vraies affaires partent tôt.', TOUSSAINT),
      r('Le matin, je trie : fer, alu, laiton. Un tas bien trié se vend deux fois plus cher qu’un tas mélangé.', MATIN),
      r('Tu as une réputation, {prenom}. Dans la récup, c’est tout : les gens te confient leurs objets parce qu’ils te font confiance.', CONNU),
      r('Ce que l’un jette, l’autre le revend. L’économie circulaire, c’est mon métier depuis bien avant qu’on lui donne un nom.'),
    ],
    rumors: [
      { text: 'Des voleurs de câbles ont visité les voies de garage la semaine dernière. La police surveille les ferrailleurs qui paient en liquide.', sector: 'industrie' },
      { text: 'Un fondeur de la vallée chercherait de l’aluminium propre pour fabriquer des cadres de vélos. Il paierait bien.', sector: 'industrie' },
      { text: 'Les dernières machines de Taret-Acier seraient rachetées par un ferrailleur étranger. Karim voudrait les garder pour l’atelier de la Friche.', sector: 'industrie', quand: { chapitre: [2, 9] } },
    ],
  },

  // ------------------------------------------------------------------ HyperVal
  res_yassine_cariste: {
    lines: [
      r('Le matin, on charge les camions avant six heures. Quand tu vois la ville se réveiller, tout est déjà dans les rayons.', MATIN),
      r('Quand il pleut, les clients commandent au drive au lieu de venir. On fait des heures en plus, payées pareil.', PLUIE),
      r('En décembre, l’entrepôt tourne jour et nuit. Les intérimaires arrivent en novembre et repartent après les fêtes.', HIVER),
      r('Ton stand fait parler jusqu’ici, tu sais. Le chef de rayon a demandé qui vendait des goûters moins chers que nous.', VENTE),
      r('Moi aussi j’ai commencé petit, {prenom}. Ce qui compte, c’est d’apprendre un métier qu’on ne pourra pas te prendre.'),
      r('Le marché de Noël sur la place, j’y emmène ma fille. Là-bas, au moins, on connaît le nom de celui qui vend.', NOEL),
      r('Le quartier s’est mobilisé contre le drive ? Franchement, ça m’a fait plaisir. Même si c’est mon patron.', CH4),
    ],
    rumors: [
      { text: 'L’entrepôt va installer des robots de préparation de commandes. Une vingtaine de postes de nuit pourraient disparaître.', sector: 'logistique' },
      { text: 'Il paraît que les caristes veulent élire un délégué. La direction aurait promis une prime pour calmer le jeu.', sector: 'services' },
      { text: 'Les invendus du drive partent à la benne tous les mardis. Une association voudrait les récupérer pour une épicerie solidaire.', sector: 'alimentation' },
    ],
  },
  res_patricia_gerante: {
    lines: [
      r('Les jours de soleil, les clients flânent et achètent plus. Les jours de pluie, ils viennent pour la liste et repartent.', SOLEIL),
      r('La rentrée, c’est la bataille des fournitures. Celui qui affiche le cahier le moins cher gagne le caddie entier.', { saison: ['finEte'] }),
      r('Un produit d’appel, tu connais ? On le vend à perte pour te faire entrer. Le reste du caddie paie la différence.'),
      r('J’ai vu les chiffres de ton stand. Tu vends moins que nous, mais tes clients reviennent. Ça, c’est précieux.', VENTE),
      r('Mon siège me demande des résultats chaque lundi. Toi, tu as la chance de choisir tes règles.'),
      r('En hiver, je mets les chocolats en tête de gondole dès la Toussaint. On dit que c’est trop tôt ; les ventes disent le contraire.', AUTOMNE),
      r('Votre débat sur la place a fait du bruit au siège. Ils ont peur que d’autres villes s’en inspirent.', CH4),
    ],
    rumors: [
      { text: 'Le magasin HyperVal pourrait passer en franchise indépendante. La gérante deviendrait propriétaire, avec les risques qui vont avec.', sector: 'commerce' },
      { text: 'On dit qu’une caisse automatique sur deux sera remplacée par une application. Les caissières seraient reclassées en préparatrices.', sector: 'tech' },
      { text: 'Le siège aurait demandé une étude sur les épiceries de la Cité des Roses : combien de clients, quels horaires, quels prix.', sector: 'commerce', quand: CH3 },
    ],
  },
  res_maxime_developpeur: {
    lines: [
      r('Une appli, c’est simple à faire et difficile à faire adopter. Le plus dur, c’est que les gens la gardent.'),
      r('Quand il pleut, les commandes en ligne explosent. Mon serveur souffre, mes livreurs aussi.', PLUIE),
      r('Les données, c’est le nouveau charbon de la vallée. Sauf que ceux qui les extraient ne vivent pas ici.'),
      r('J’ai vu passer ton stand sur le groupe du quartier, {prenom}. Une photo bien prise vaut une affiche.', VENTE),
      r('En été, je code depuis la terrasse du canal. Le wifi est mauvais, mais les idées viennent mieux.', ETE),
      r('Le marché de Noël devrait accepter le paiement par téléphone. Je l’ai proposé, la mairie a dit « l’an prochain ».', NOEL),
      r('Un tableur bien tenu vaut mieux que la plus belle appli. Commence par noter chaque vente.'),
    ],
    rumors: [
      { text: 'Une start-up parisienne veut lancer une appli de livraison en vingt minutes dans la vallée. Les livreurs seraient payés à la course.', sector: 'tech' },
      { text: 'La fibre arriverait enfin à la Cité des Roses au printemps. Les commerçants pourraient enfin prendre la carte bancaire partout.', sector: 'tech' },
      { text: 'Il paraît que le Drive HyperVal achète les données de fidélité de ses clients pour prévoir les ruptures de stock.', sector: 'commerce' },
    ],
  },
  res_fatou_livreuse: {
    lines: [
      r('Sous la pluie, chaque colis pèse le double. Et les clients ne descendent jamais l’ouvrir dans le hall.', PLUIE),
      r('Avant Noël, je fais cent quarante livraisons par jour. Je mange au volant, entre deux portes.', HIVER),
      r('Le matin, je charge mon utilitaire dans l’ordre inverse de la tournée. Le premier livré, c’est le dernier chargé.', MATIN),
      r('Tu livres pour l’épicerie Bertin ? Bienvenue dans le métier ! Fais toujours la tournée la plus courte d’abord.', CH3),
      r('On m’a dit que tu aidais les anciens, {prenom}. C’est le genre de chose qui se sait dans un quartier.', CONNU),
      r('Payé{e} à la course ou payé{e} à l’heure ? Demande toujours, avant de dire oui à un boulot.'),
      r('Le marché d’été ce soir ? Je finis à dix-huit heures, j’y passe en sortant. Il y a un stand de bissap à tomber.', MARCHE_ETE),
    ],
    rumors: [
      { text: 'Les livreurs indépendants de la vallée parlent de monter leur propre coopérative, avec leur appli et leurs tarifs.', sector: 'logistique' },
      { text: 'Une plateforme baisse encore la rémunération par colis cet automne. Certains livreurs disent qu’ils ne couvrent plus l’essence.', sector: 'logistique', quand: AUTOMNE },
      { text: 'Il se dit que la mairie va créer des places de livraison réservées sur l’avenue Jean-Jaurès. Les commerçants les réclamaient depuis dix ans.', sector: 'commerce' },
    ],
  },

  // ------------------------------------------------------------------ Industrie
  res_marcel_fondeur: {
    lines: [
      r('Le matin, la fonderie sent le sable chaud. Mes apprentis arrivent avec des yeux de lune, et repartent avec des mains d’ouvriers.', MATIN),
      r('En hiver, l’atelier est le seul endroit chaud de la rue. Avant, toute la ville vivait au rythme des coulées.', HIVER),
      r('Un métier, ça s’apprend lentement. Dix ans pour être bon fondeur. Aucune appli ne raccourcit ça.'),
      r('On dit que tu montes des projets avec Karim, {prenom}. Il était le meilleur régleur de la ligne trois.', { chapitre: [2, 9] }),
      r('La Toussaint, je vais au carré des fondeurs, au cimetière. On était quatre cents ; on n’est plus qu’une trentaine.', TOUSSAINT),
      r('Quand il pleut, les anciens viennent à l’atelier boire un café et regarder les jeunes travailler.', PLUIE),
      r('Votre quartier qui décide de sa place, ça me rappelle les assemblées de 2014. On avait perdu ; vous, vous pouvez gagner.', CH4),
    ],
    rumors: [
      { text: 'Le lycée professionnel cherche des maîtres d’apprentissage en fonderie. Il n’y a plus que deux candidats par an.', sector: 'industrie' },
      { text: 'Une entreprise d’éoliennes voudrait commander des pièces moulées dans la vallée. Il faudrait rouvrir un four.', sector: 'energie' },
      { text: 'On raconte que les anciens de Taret ont gardé les moules de la dernière série de 2014, au cas où.', sector: 'industrie' },
    ],
  },
  res_aurelie_chaudronniere: {
    lines: [
      r('Souder sous la pluie, c’est interdit. Alors les jours d’averse, je fais les plans et les devis.', PLUIE),
      r('Une soudure TIG, c’est de la patience. Comme un budget : tu ne rattrapes pas un mauvais départ.'),
      r('L’été, l’atelier dépasse les quarante degrés. On commence à six heures et on finit à midi.', ETE),
      r('On m’a dit que ton stand a bien tourné. Tu veux un présentoir en métal ? Je te fais un prix si tu fournis la tôle.', VENTE),
      r('Je suis la seule femme de l’atelier. Les premiers mois, on me tendait le balai. Maintenant, on me tend les plans.'),
      r('La fête de la rentrée sur la place, j’y tiens un stand pour les apprentissages. Viens voir, ça ouvre des portes.', RENTREE),
      r('Ta réputation te précède, {prenom}. Dans l’industrie, un nom fiable, c’est la moitié des contrats.', CONNU),
    ],
    rumors: [
      { text: 'Un chantier naval du Rhône chercherait des chaudronniers pour rénover des péniches. Le carnet de commandes est plein pour trois ans.', sector: 'industrie' },
      { text: 'Il paraît que l’atelier de la rue de la Coulée va investir dans une découpe laser. Deux postes de plus, peut-être.', sector: 'industrie' },
      { text: 'Les ferrailleurs disent que le prix de l’inox va grimper cet hiver. Ceux qui ont du stock vont en profiter.', sector: 'industrie', quand: { saison: ['automne', 'hiver'] } },
    ],
  },
  res_lucien_metrologue: {
    lines: [
      r('Un centième de millimètre, c’est la différence entre une pièce bonne et une pièce au rebut. La précision, c’est de l’argent.'),
      r('Quand il fait froid, le métal se rétracte. Je mesure toujours à vingt degrés, sinon je mens sans le vouloir.', HIVER),
      r('Le matin, je calibre mes instruments. Un outil mal réglé, c’est une erreur répétée mille fois.', MATIN),
      r('Ton stand, tu comptes tes ventes ? Mesure d’abord, décide ensuite. Sinon tu devines.'),
      r('Les jours de pluie, l’humidité fausse certaines mesures. Alors je vérifie deux fois.', PLUIE),
      r('On dit que ton équipe a adopté des règles écrites. Une règle claire, c’est comme une tolérance : tout le monde sait où est la limite.', { recent: 'Règles partagées adoptées' }),
      r('Le contrôle qualité, ce n’est pas punir. C’est comprendre pourquoi ça rate, pour que ça ne rate plus.'),
    ],
    rumors: [
      { text: 'Un constructeur automobile aurait renvoyé tout un lot de pièces à un sous-traitant de la vallée. Une erreur de calibrage, dit-on.', sector: 'industrie' },
      { text: 'Il paraît que l’atelier cherche un apprenti en métrologie. Personne ne sait ce que ça veut dire, alors personne ne postule.', sector: 'industrie' },
      { text: 'Le laboratoire d’essais de Taret pourrait rouvrir pour certifier des vélos cargo fabriqués dans la vallée.', sector: 'industrie', quand: CH4 },
    ],
  },
  res_rachid_agent_securite: {
    lines: [
      r('La nuit, la zone industrielle est un autre monde. On entend les renards et les compresseurs.', SOIR),
      r('Quand il pleut, les alarmes se déclenchent pour rien. Je fais trois fois le tour pour des gouttes.', PLUIE),
      r('L’hiver, je fais ma ronde à la lampe dès dix-sept heures. On voit mieux les fenêtres allumées des ateliers qui tiennent encore.', HIVER),
      r('La sécurité, ça coûte cher tant qu’il ne se passe rien. Le jour où il se passe quelque chose, ça ne coûte plus rien du tout.'),
      r('Tu traînes tard, {prenom}. Rentre par la grande avenue, c’est mieux éclairé.', { moment: ['nuit'] }),
      r('On dit que tu es quelqu’un de fiable. Dans mon métier, la confiance, c’est la première protection.', CONNU),
      r('Le marché de Noël, je fais la sécurité du soir. Le vin chaud sent jusqu’au parking.', NOEL),
    ],
    rumors: [
      { text: 'Des intrus seraient entrés dans le vieux laminoir la nuit dernière. Rien n’a été volé, mais quelqu’un a pris des photos.', sector: 'immobilier' },
      { text: 'L’assureur des ateliers augmente ses tarifs de trente pour cent. Certains patrons pensent à fermer plutôt qu’à payer.', sector: 'finance' },
      { text: 'Il paraît qu’un promoteur rôde autour de la Friche Taret, avec un plan sous le bras et un photographe.', sector: 'immobilier', quand: { chapitre: [2, 9] } },
    ],
  },

  // ------------------------------------------------------------------ Collines
  res_elise_arboricultrice: {
    lines: [
      r('Une gelée en avril, et toute la récolte de mirabelles part avec. L’agriculture, c’est un pari avec le ciel.', PRINTEMPS),
      r('En août, je cueille à l’aube. À midi, les fruits sont trop chauds pour voyager.', ETE),
      r('La pluie ? Bénie en juin, maudite en août. Le même nuage peut faire ou défaire une année.', PLUIE),
      r('Au marché d’été de ce soir, mes confitures partent avant vingt heures. Viens tôt si tu en veux.', MARCHE_ETE),
      r('Tu vends des goûters, {prenom} ? Essaie une tarte aux mirabelles un jour. Les fruits locaux, ça se raconte.', VENTE),
      r('En automne, je taille et je plante. Un arbre planté aujourd’hui donnera dans sept ans : ça, c’est investir.', AUTOMNE),
      r('Les circuits courts, c’est moins d’intermédiaires. Le producteur gagne plus, le client paie moins. Sur le papier.'),
    ],
    rumors: [
      { text: 'La grande distribution achèterait les mirabelles de la vallée à prix cassé cette année. Les producteurs veulent vendre en direct.', sector: 'alimentation' },
      { text: 'Il paraît qu’un verger abandonné des hauts va être vendu par la commune. Les apiculteurs voudraient le reprendre ensemble.', sector: 'immobilier' },
      { text: 'Une cantine de collège voudrait servir des fruits de la vallée. Il faudrait une légumerie pour tout préparer.', sector: 'alimentation', quand: CH3 },
    ],
  },
  res_bertrand_apiculteur: {
    lines: [
      r('Au printemps, mes abeilles sortent dès dix degrés. Elles savent la saison avant le calendrier.', PRINTEMPS),
      r('Quand il pleut, les ruches restent fermées. Les abeilles mangent leurs réserves : une mauvaise semaine coûte du miel.', PLUIE),
      r('Une ruche, c’est une coopérative. Personne ne commande, et pourtant tout le monde sait quoi faire.'),
      r('En hiver, je fabrique des bougies de cire. Le marché de Noël les achète toutes en deux week-ends.', HIVER),
      r('Le marché de Noël ouvre sur la place : mes bougies sont sur la table du fond, à côté du vin chaud.', NOEL),
      r('Un bien commun, {prenom}, ça tient si chacun prend sa part et pas plus. Elinor Ostrom l’a démontré mieux que moi.'),
      r('On dit que tu sais écouter. C’est rare à ton âge. C’est rare à tout âge.', CONNU),
    ],
    rumors: [
      { text: 'Un pesticide interdit aurait été repéré sur un champ des hauts. Trois ruches sont mortes en une semaine.', sector: 'alimentation' },
      { text: 'La commune songe à louer les bois communaux à une entreprise de biomasse. Les promeneurs ont lancé une pétition.', sector: 'energie' },
      { text: 'Il paraît que le miel de la vallée pourrait obtenir un label. Le prix du pot doublerait, mais il faudrait s’organiser à plusieurs.', sector: 'alimentation' },
    ],
  },
  res_helene_astronome: {
    lines: [
      r('Ce soir, si le ciel est clair, on ouvre la coupole. Viens voir Saturne : ça remet les soucis à leur place.', SOIR),
      r('Quand il pleut, je fais des ateliers sur la lumière. Un prisme et une lampe, et les enfants s’émerveillent.', PLUIE),
      r('L’hiver, la nuit tombe à dix-sept heures. C’est la meilleure saison pour les étoiles, la pire pour les visiteurs.', HIVER),
      r('L’observatoire vit de dons et d’une petite subvention. Chaque année, on se demande si on rouvrira.'),
      r('La science, c’est d’abord douter. Les gens qui sont sûrs de tout n’ont jamais regardé dans un télescope.'),
      r('Tu as l’air bien occupé{e}, {prenom}. N’oublie pas de lever les yeux de temps en temps.'),
      r('Les étoiles filantes d’août, tu les as vues ? Les Perséides passent chaque année, fidèles comme un rendez-vous.', ETE),
    ],
    rumors: [
      { text: 'La mairie voudrait éteindre l’éclairage public après minuit pour économiser. Les astronomes sont ravis ; les commerçants, moins.', sector: 'energie' },
      { text: 'Un mécène anonyme aurait offert un nouveau télescope à l’observatoire. Personne ne sait qui c’est.', sector: 'culture' },
      { text: 'Il paraît qu’une université voudrait installer une antenne de recherche sur les hauts. Des emplois de techniciens, peut-être.', sector: 'culture', quand: CH4 },
    ],
  },
  res_antoine_cycliste: {
    lines: [
      r('Sous la pluie, je fais des chambres à air à la chaîne. Les nids-de-poule se remplissent, les pneus crèvent.', PLUIE),
      r('Au printemps, tout le monde ressort son vélo en même temps. J’ai trois semaines d’attente.', PRINTEMPS),
      r('Grand soleil ce matin : les crêtes vont être pleines de randonneurs. Ma location de vélos va tourner.', SOLEIL),
      r('Réparer plutôt que racheter : le client économise, moi je gagne ma vie, et la planète respire.'),
      r('À la fête de la rentrée, je fais un atelier de réparation gratuit. Viens avec ton vélo, je t’apprends.', RENTREE),
      r('Noah passe souvent à l’atelier. Il dessine des cadres de vélos incroyables. Vous devriez bosser ensemble.'),
      r('On parle de toi sur les sentiers, {prenom}. Les nouvelles montent vite, même à pied.', CONNU),
    ],
    rumors: [
      { text: 'La région financerait des vélos électriques pour les apprentis qui vivent loin de leur entreprise.', sector: 'logistique' },
      { text: 'Il paraît qu’une piste cyclable va enfin relier les collines au centre-ville. Les travaux commenceraient au printemps.', sector: 'immobilier' },
      { text: 'Un fabricant de vélos cargo chercherait un atelier de montage dans la vallée. La Friche Taret serait sur la liste.', sector: 'industrie', quand: CH3 },
    ],
  },

  // ------------------------------------------------------------------ Berges
  res_baptiste_batelier: {
    lines: [
      r('Le matin, la brume colle au canal. On navigue à l’oreille, en écoutant les écluses.', MATIN),
      r('Quand il pleut beaucoup, le Taret monte et les écluses ferment. Une péniche à quai, c’est de l’argent qui dort.', PLUIE),
      r('En été, l’eau baisse. Je charge moins pour ne pas toucher le fond : moins de grain, moins de recette.', ETE),
      r('Une péniche transporte autant que quarante camions. Mais il faut accepter d’aller lentement.'),
      r('Au marché de Noël, je vends le cidre d’un cousin normand. Ce qui voyage par l’eau garde le goût du voyage.', NOEL),
      r('Ton stand a bien marché ? Bravo. Le commerce, c’est comme la navigation : il faut lire le courant.', VENTE),
      r('On dit que ton quartier a choisi sa place lui-même. Ici, sur l’eau, on vote aussi pour l’ordre des écluses.', CH5),
    ],
    rumors: [
      { text: 'La voie navigable pourrait fermer deux mois pour travaux. Les bateliers parlent de faire grève sur l’eau.', sector: 'logistique' },
      { text: 'Une coopérative de céréaliers voudrait affréter une péniche à l’année. Ce serait la fin des petits contrats incertains.', sector: 'alimentation' },
      { text: 'Il paraît qu’une péniche-marché pourrait s’amarrer chaque samedi au canal de la Malterie, avec des producteurs à bord.', sector: 'commerce', quand: CH3 },
    ],
  },
  res_monique_brasseuse: {
    lines: [
      r('Le matin, je brasse avant que la chaleur monte. Une fermentation trop chaude, et tout le lot est perdu.', MATIN),
      r('En été, je vends trois fois plus. En hiver, je brasse des bières de garde pour tenir jusqu’au printemps.', ETE),
      r('Quand il pleut, le café de la brasserie se remplit. On joue aux cartes et on refait la vallée.', PLUIE),
      r('Une petite brasserie, c’est une épicerie avec des cuves. On vit de clients fidèles, pas de coups de pub.'),
      r('Le marché d’été de ce soir, je sers de la limonade artisanale aux enfants. Viens goûter, c’est offert.', MARCHE_ETE),
      r('On dit que tu as monté un vrai stand, {prenom}. Garde une caisse séparée : c’est la première leçon.', VENTE),
      r('Votre débat sur la place, j’y étais. Ça m’a donné envie de proposer une coopérative de brasseurs.', CH5),
    ],
    rumors: [
      { text: 'Le prix de l’orge brassicole a pris vingt pour cent cette année. Les petites brasseries devront augmenter leurs prix.', sector: 'alimentation' },
      { text: 'Il paraît qu’une grande marque voudrait racheter les brasseries artisanales de la région. Certains ont déjà reçu une offre.', sector: 'commerce' },
      { text: 'La drêche de la brasserie pourrait nourrir les poules d’une ferme des hauts. Les déchets de l’un font la richesse de l’autre.', sector: 'alimentation' },
    ],
  },
  res_salim_pecheur: {
    lines: [
      r('À l’aube, le canal est à moi. Les poissons mordent avant que la ville se réveille.', MATIN),
      r('Après la pluie, l’eau est trouble et les sandres chassent. C’est le meilleur moment, si on accepte d’être trempé.', PLUIE),
      r('L’été, la mairie interdit la pêche dans certains bras. L’eau trop chaude manque d’oxygène.', ETE),
      r('Une rivière, c’est un bien commun. Si chacun pêche trop, personne ne pêche plus. On a des règles, et on les respecte.'),
      r('En automne, on nettoie les berges avec l’association. On remplit une benne entière de déchets chaque année.', AUTOMNE),
      r('Le vide-grenier de la Toussaint, j’y vends mes vieilles cannes. Les jeunes en veulent, ça me fait plaisir.', TOUSSAINT),
      r('On dit que tu es quelqu’un de bien, {prenom}. Ici, on le dit rarement, alors savoure.', CONNU),
    ],
    rumors: [
      { text: 'Une usine en amont aurait rejeté de l’eau tiède la nuit. Les pêcheurs ont trouvé des poissons morts au barrage.', sector: 'industrie' },
      { text: 'L’association des pêcheurs voudrait racheter un étang privé pour y faire un lieu d’initiation pour les enfants.', sector: 'services' },
      { text: 'Il paraît que le canal va être curé l’an prochain. Les anciens disent qu’on retrouvera des objets de l’usine au fond.', sector: 'industrie' },
    ],
  },
  res_nadege_kinesitherapeute: {
    lines: [
      r('L’hiver, j’ai des patients qui ont glissé sur le verglas. Le trottoir non salé coûte cher à la Sécurité sociale.', HIVER),
      r('Les jours de pluie, les anciens annulent leurs rendez-vous. Ils ont peur de tomber en chemin.', PLUIE),
      r('Mes patients du laminoir ont tous mal au dos. Le travail laisse des traces que le salaire ne paie pas.'),
      r('Tu portes des cartons pour l’épicerie, {prenom} ? Plie les genoux, pas le dos. Je te le dis gratuitement.', CH3),
      r('Un cabinet de quartier, c’est fragile : si un médecin part, tout le monde se reporte sur nous.'),
      r('À la fête de la rentrée, je fais un stand prévention. Les cartables trop lourds, c’est mon combat.', RENTREE),
      r('On dit que tu fais attention aux autres. Moi aussi, c’est mon métier. Toi, tu le fais gratuitement.', CONNU),
    ],
    rumors: [
      { text: 'Le dernier médecin généraliste des berges partirait à la retraite en juin. Personne ne reprend le cabinet.', sector: 'services' },
      { text: 'La mairie voudrait ouvrir une maison de santé dans l’ancienne poste. Les loyers seraient bas pour attirer des soignants.', sector: 'immobilier' },
      { text: 'Il paraît qu’une mutuelle de quartier pourrait voir le jour, gérée par les habitants eux-mêmes.', sector: 'finance', quand: CH4 },
    ],
  },

  // ------------------------------------------------------------------ Faubourg
  res_lucas_boulanger: {
    lines: [
      r('Le matin à quatre heures, le faubourg dort et le four chante. C’est mon heure préférée.', MATIN),
      r('Quand il pleut, je vends plus de pain de mie et moins de baguettes. Les gens restent chez eux.', PLUIE),
      r('En hiver, je fais des galettes dès la fin décembre. En janvier, elles paient mon chauffage.', HIVER),
      r('Le prix de la farine a encore pris. Si j’augmente la baguette de dix centimes, les clients le sentent tout de suite.'),
      r('Tu vends des goûters, {prenom} ? Fais-les toi-même un jour : la marge est meilleure, et la fierté aussi.', VENTE),
      r('À la fête de la rentrée, je donne des pains au chocolat aux élèves. Ils reviendront toute l’année.', RENTREE),
      r('Le levain, il faut le nourrir chaque jour. Un commerce aussi : pas un jour sans prendre soin des clients.'),
    ],
    rumors: [
      { text: 'Une chaîne de boulangeries industrielles voudrait s’installer à côté du Drive HyperVal. Baguette à trente centimes, dit-on.', sector: 'alimentation' },
      { text: 'Les boulangers de la vallée parlent d’acheter leur farine ensemble, directement au moulin. Ils économiseraient le transport.', sector: 'alimentation' },
      { text: 'Il paraît que la cantine du collège voudrait du pain de la vallée. Il faudrait livrer quatre cents pains avant huit heures.', sector: 'alimentation', quand: CH3 },
    ],
  },
  res_fatima_couturiere: {
    lines: [
      r('À la rentrée, j’ourle des pantalons d’écoliers par dizaines. Les enfants grandissent plus vite que les budgets.', { saison: ['finEte'] }),
      r('Quand il pleut, on m’apporte des parapluies cassés et des manteaux décousus. Je répare tout ce qu’on jette ailleurs.', PLUIE),
      r('Avant Noël, je fais des robes de fête. Les mamans du faubourg veulent briller une fois dans l’année.', HIVER),
      r('Un vêtement réparé, c’est un vêtement qu’on n’achète pas. Les grandes marques n’aiment pas mon métier.'),
      r('Au vide-grenier de la Toussaint, je trouve des tissus magnifiques pour trois fois rien.', TOUSSAINT),
      r('On parle de toi au faubourg, {prenom}. Les gens disent que tu es quelqu’un de sérieux, sans te prendre au sérieux. C’est le bon dosage.', CONNU),
      r('Mon atelier tient avec deux machines et beaucoup de patience. Le jour où l’une casse, c’est un mois de recette.'),
    ],
    rumors: [
      { text: 'Une friperie en ligne rachète les vêtements au kilo dans la vallée. Les couturières perdent leurs plus beaux tissus.', sector: 'mode' },
      { text: 'Il paraît qu’un atelier de confection fermé depuis vingt ans pourrait rouvrir avec des couturières du faubourg.', sector: 'mode' },
      { text: 'La mairie voudrait aider les commerces de réparation avec un bonus pour les clients. Les cordonniers en parlent déjà.', sector: 'services' },
    ],
  },
  res_etienne_menuisier: {
    lines: [
      r('Le bois travaille avec l’humidité. Quand il pleut, je ne pose jamais de parquet : il gonflerait la semaine suivante.', PLUIE),
      r('En hiver, je récupère les palettes des grossistes. Une palette bien démontée devient une étagère.', HIVER),
      r('Un meuble en réemploi coûte plus d’heures et moins de matière. Le prix, c’est surtout mon temps.'),
      r('Le matin, j’affûte mes outils. Un outil émoussé, c’est un travail bâclé et un doigt en danger.', MATIN),
      r('Tu veux un vrai comptoir pour ton stand, {prenom} ? Apporte-moi des planches, je te montre comment faire.', VENTE),
      r('Au marché de Noël, je vends des jouets en bois. Les parents les achètent, les grands-parents les reconnaissent.', NOEL),
      r('On dit que ton équipe tient bien. Une bonne équipe, c’est comme un assemblage : chaque pièce porte les autres.', CH3),
    ],
    rumors: [
      { text: 'Une recyclerie voudrait ouvrir dans le faubourg et cherche un menuisier pour remettre les meubles en état.', sector: 'commerce' },
      { text: 'Le prix du bois neuf a doublé en deux ans. Les menuisiers se battent pour les chutes des scieries.', sector: 'industrie' },
      { text: 'Il paraît que l’école de la Cité des Roses va changer tout son mobilier. Les vieux bureaux finiraient à la benne.', sector: 'services' },
    ],
  },
  res_julie_libraire: {
    lines: [
      r('Les jours de pluie, la librairie se remplit de gens qui ne savaient pas qu’ils voulaient un livre.', PLUIE),
      r('À la rentrée, je vends des livres scolaires d’occasion. Moitié prix, et ils ont déjà été soulignés au bon endroit.', { saison: ['finEte'] }),
      r('En décembre, je fais la moitié de mon année. Le reste du temps, je tiens grâce aux fidèles.', HIVER),
      r('Le prix du livre est le même partout en France. C’est la loi : sinon, les géants auraient mangé les libraires depuis longtemps.'),
      r('Lina vient lire ici le mercredi. Elle prend des notes sur tout, même sur les romans.'),
      r('À la fête de la rentrée, je tiens une table de livres pour les collégiens. Un livre offert, un lecteur gagné.', RENTREE),
      r('On dit que tu poses des questions à tout le monde, {prenom}. C’est le meilleur début pour un lecteur.', CONNU),
    ],
    rumors: [
      { text: 'Un grand site de vente en ligne livrerait gratuitement les livres dans la vallée. Les libraires indépendants ont peur.', sector: 'commerce' },
      { text: 'La bibliothèque de la Maison du Peuple voudrait ouvrir le dimanche. Il faudrait des bénévoles.', sector: 'culture' },
      { text: 'Il paraît que la librairie pourrait devenir une coopérative de lecteurs : chacun achèterait une part.', sector: 'culture', quand: CH4 },
    ],
  },

  // ------------------------------------------------------------------ Grand Ensemble
  res_kader_gardien: {
    lines: [
      r('Le matin, je sors les poubelles des six cages d’escalier. Je sais qui a fait la fête rien qu’à leur poids.', MATIN),
      r('Quand il pleut, l’ascenseur de la tour C tombe en panne. Je ne sais pas pourquoi, mais c’est à chaque fois.', PLUIE),
      r('En hiver, je vérifie que les anciens ont du chauffage. Une facture impayée, ça peut devenir un drame.', HIVER),
      r('Un gardien, c’est un médiateur. Je règle plus de disputes que de fuites d’eau.'),
      r('Papy Lucien disait toujours : « Un immeuble, c’est un village debout. » Il avait raison.'),
      r('On parle de toi dans les halls, {prenom}. En bien, rassure-toi. Ici, ça fait toute la différence.', CONNU),
      r('Pour la Toussaint, des familles partent au pays voir leurs morts. Je garde leurs clés et j’arrose leurs plantes.', TOUSSAINT),
    ],
    rumors: [
      { text: 'Le bailleur voudrait remplacer les gardiens par une entreprise de nettoyage. Les locataires préparent une pétition.', sector: 'immobilier' },
      { text: 'Une salle commune vide au rez-de-chaussée pourrait devenir une épicerie solidaire. Il faut juste quelqu’un pour la tenir.', sector: 'commerce' },
      { text: 'Il paraît que la tour C va être rénovée : isolation, fenêtres, chaudière. Les loyers augmenteraient un peu, les factures baisseraient beaucoup.', sector: 'energie' },
    ],
  },
  res_soraya_animatrice: {
    lines: [
      r('Le soir, je fais l’aide aux devoirs à la salle commune. Viens si tu bloques en maths.', SOIR),
      r('Quand il pleut, les jeunes du quartier viennent tous à la salle. Je n’ai jamais assez de chaises.', PLUIE),
      r('Pendant les vacances d’été, j’organise des sorties à la base de loisirs. Pour certains, c’est les seules vacances.', ETE),
      r('Une subvention, ça se demande, ça se justifie, ça se renouvelle. La moitié de mon temps, c’est de la paperasse.'),
      r('À la fête de la rentrée, je recrute des bénévoles pour le soutien scolaire. Tu veux aider les petits ?', RENTREE),
      r('Lina m’a parlé de ton stand. Elle dit que tu sais motiver les gens. C’est un vrai talent, {prenom}.', VENTE),
      r('Tu sembles un peu seul{e} ces temps-ci. Viens à la salle commune, il y a toujours quelqu’un pour parler.', DISCRET),
    ],
    rumors: [
      { text: 'La subvention du centre social serait réduite de moitié l’an prochain. Les activités du mercredi pourraient disparaître.', sector: 'services' },
      { text: 'Il paraît qu’une fondation d’entreprise financerait des stages pour les jeunes du Grand Ensemble.', sector: 'services' },
      { text: 'Les jeunes du quartier voudraient monter une web-radio. Il leur manque un micro et une pièce insonorisée.', sector: 'medias', quand: CH3 },
    ],
  },
  res_marc_ambulancier: {
    lines: [
      r('Le matin, on enchaîne les transports vers les dialyses. On connaît nos patients par leur prénom.', MATIN),
      r('Quand il pleut, les accidents doublent. Les gens roulent pareil, mais la route ne pardonne plus.', PLUIE),
      r('En hiver, avec la grippe, les urgences débordent. On attend parfois deux heures avec un patient sur le brancard.', HIVER),
      r('L’hôpital public, c’est un service, pas une entreprise. Mais quelqu’un doit quand même payer les ambulances.'),
      r('On dit que tu aides les anciens du quartier. Ce sont eux que je transporte. Merci pour eux, {prenom}.', CH3),
      r('Le marché de Noël, on y tient un poste de secours. Les gens ne savent pas combien de chutes il y a sur les pavés.', NOEL),
      r('Votre quartier qui choisit sa place, c’est bien. Pensez à laisser passer les ambulances, hein.', CH4),
    ],
    rumors: [
      { text: 'Les urgences de nuit de l’hôpital pourraient fermer deux nuits par semaine faute de médecins. Le syndicat proteste.', sector: 'services' },
      { text: 'Il paraît qu’une entreprise privée voudrait racheter le service d’ambulances. Les tarifs augmenteraient pour les patients.', sector: 'services' },
      { text: 'La mairie voudrait installer des défibrillateurs dans chaque commerce. Elle cherche des commerçants volontaires.', sector: 'commerce' },
    ],
  },
  res_ines_etudiante: {
    lines: [
      r('En cours de gestion, on apprend le seuil de rentabilité. En vrai, je le calcule chaque soir avec mes courses livrées.'),
      r('Quand il pleut, je livre deux fois plus. Les anciens ne sortent pas, et ils m’attendent derrière la porte.', PLUIE),
      r('En période d’examens, je réduis les livraisons. Mes clients comprennent, mais mon compte en banque moins.', PRINTEMPS),
      r('Tu livres aussi pour Mme Bertin ? Alors on est collègues ! Elle paie à l’heure et ajoute toujours un fruit.', CH3),
      r('On dit que ton stand fonctionne bien, {prenom}. Tu as pensé à ce que tu fais de tes bénéfices ?', VENTE),
      r('Schumpeter disait qu’on innove en détruisant l’ancien. Moi, j’aimerais innover sans détruire Mme Bertin.'),
      r('À la fête de la rentrée, je cherche des colocs. Le loyer, c’est le premier poste de mon budget.', RENTREE),
    ],
    rumors: [
      { text: 'Une plateforme voudrait embaucher des étudiants pour livrer les courses du Drive HyperVal. Payés à la minute.', sector: 'logistique' },
      { text: 'Il paraît que la fac ouvre un diplôme en économie sociale et solidaire. Les premiers stages seraient dans la vallée.', sector: 'services' },
      { text: 'Les anciens de la Cité des Roses voudraient une tournée de livraison fixe, deux fois par semaine, payée ensemble.', sector: 'logistique', quand: CH3 },
    ],
  },

  // ------------------------------------------------------------------ Friche Sud
  res_driss_sculpteur: {
    lines: [
      r('Le soir, je soude à la lueur de l’arc. La friche devient une cathédrale de métal.', SOIR),
      r('Quand il pleut, j’entends la tôle chanter sur le toit de la halle. Je l’enregistre pour une installation sonore.', PLUIE),
      r('Une œuvre d’art, ça n’a pas de prix… jusqu’à ce qu’on doive payer le loyer de l’atelier.'),
      r('En été, j’expose dehors, sur le parvis. Les gens touchent les sculptures. C’est fait pour ça.', ETE),
      r('Au marché d’été, j’ai une table de petites sculptures en boulons. Les enfants adorent.', MARCHE_ETE),
      r('Tu viens à la friche, {prenom} ? Les fresques de 2014 sont toujours là. Elles racontent la fermeture mieux qu’un livre.'),
      r('On dit que ton quartier a fait front. L’art aussi, c’est faire front : montrer ce qu’on ne veut pas oublier.', CH4),
    ],
    rumors: [
      { text: 'Un promoteur voudrait raser la halle aux sculptures pour faire des lofts. Les artistes de la friche s’organisent.', sector: 'immobilier' },
      { text: 'Il paraît qu’un festival de street-art pourrait se tenir à la Friche Taret l’été prochain. Des artistes de toute l’Europe.', sector: 'culture' },
      { text: 'La mairie voudrait commander une sculpture pour la nouvelle place. Elle hésite entre un artiste local et un grand nom.', sector: 'culture', quand: CH5 },
    ],
  },
  res_valerie_ecologue: {
    lines: [
      r('Les saules et les peupliers que j’ai plantés absorbent les métaux du sol. Dans vingt ans, on pourra peut-être y cultiver.'),
      r('Après la pluie, je prélève des échantillons d’eau. C’est là qu’on voit ce que le sol relâche.', PLUIE),
      r('Au printemps, la friche fleurit. Personne ne l’a semée : la nature reprend ce qu’on lui a pris.', PRINTEMPS),
      r('Dépolluer coûte cher. Mais ne rien faire coûte plus cher encore, simplement plus tard et à d’autres.'),
      r('En automne, on compte les oiseaux migrateurs sur la friche. Quarante espèces l’an dernier.', AUTOMNE),
      r('Tu veux un projet utile, {prenom} ? Les jardins partagés manquent de bras le samedi matin.'),
      r('On dit que vous avez débattu de la place. Pensez aux arbres : une place sans ombre est vide en été.', CH4),
    ],
    rumors: [
      { text: 'Une analyse aurait trouvé du plomb dans le potager d’une école près de la friche. La mairie n’a encore rien dit.', sector: 'services' },
      { text: 'Il paraît qu’un fonds européen pourrait financer la dépollution de la Friche Taret. Il faudrait un projet solide d’ici l’été.', sector: 'energie' },
      { text: 'Des panneaux solaires sur les toits de la halle ? Une coopérative citoyenne en parle, avec des parts à cinquante euros.', sector: 'energie', quand: CH3 },
    ],
  },
  res_tanguy_reparateur: {
    lines: [
      r('Un lave-linge sur deux qu’on m’apporte a juste un joint à changer. Trois euros, et on le jetait.'),
      r('Quand il pleut, le repair café se remplit. Les gens réparent ensemble et finissent par discuter.', PLUIE),
      r('En hiver, ce sont les radiateurs électriques. Un thermostat cassé, et la facture s’envole.', HIVER),
      r('Le samedi, le fablab ouvre aux jeunes. Samir y passe souvent, il bricole des machines pour sa coop.'),
      r('Au vide-grenier de la Toussaint, j’achète des appareils en panne pour les remettre en vente. Une deuxième vie.', TOUSSAINT),
      r('Tu sais souder, {prenom} ? Non ? Viens samedi, je t’apprends. Réparer, ça rend libre.'),
      r('On dit que tu sais t’y prendre avec les gens. Au fablab, c’est aussi important que de savoir tenir un tournevis.', CONNU),
    ],
    rumors: [
      { text: 'Une loi obligerait bientôt les fabricants à vendre leurs pièces détachées plus longtemps. Les réparateurs attendent ça depuis des années.', sector: 'industrie' },
      { text: 'Il paraît que le fablab pourrait perdre son local. Le propriétaire voudrait le louer plus cher à une entreprise.', sector: 'immobilier' },
      { text: 'Un groupe de lycéens voudrait monter un atelier de réparation de téléphones. Il leur manque des outils et un local.', sector: 'tech', quand: CH4 },
    ],
  },
  res_chantal_archiviste: {
    lines: [
      r('J’ai tapé à la machine toutes les lettres de licenciement de 2014. Je n’ai jamais pu jeter les doubles.'),
      r('Quand il pleut, j’ouvre les cartons d’archives. L’humidité, c’est l’ennemi des papiers, alors je vérifie.', PLUIE),
      r('À la Toussaint, je dépose des fleurs au carré des fondeurs. Je connais chaque nom gravé.', TOUSSAINT),
      r('Une entreprise qui ferme, ce n’est pas qu’une ligne dans le journal. Ce sont des familles, des maisons, des écoles.'),
      r('En hiver, l’usine organisait l’arbre de Noël des enfants du personnel. Mille cadeaux, chaque année.', HIVER),
      r('Tu poses de bonnes questions, {prenom}. Reviens me voir : j’ai des photos de l’usine que personne n’a jamais vues.', CONNU),
      r('Votre quartier qui décide de son avenir, c’est ce que les ouvriers voulaient en 2014. On ne les avait pas écoutés.', CH4),
    ],
    rumors: [
      { text: 'Les archives de Taret-Acier seraient vendues à un collectionneur. La Maison du Peuple voudrait les racheter.', sector: 'culture' },
      { text: 'Il paraît que des anciens de l’usine préparent un livre de témoignages. Ils cherchent quelqu’un pour l’éditer.', sector: 'medias' },
      { text: 'On raconte que l’ancien directeur de Taret serait revenu en ville, discrètement, pour voir la friche une dernière fois.', sector: 'industrie' },
    ],
  },

  // ------------------------------------------------------------------ Bellevue
  res_edouard_notaire: {
    lines: [
      r('Une succession mal préparée, et des frères deviennent ennemis pour un buffet Henri II. J’en ai vu des dizaines.'),
      r('Quand il pleut, je relis mes vieux actes. On y lit toute l’histoire de la vallée, maison après maison.', PLUIE),
      r('Un bail commercial dure neuf ans. Si tu loues un local un jour, lis chaque ligne. Surtout les petites.'),
      r('La Toussaint, c’est la saison des héritages. Les familles se retrouvent et parlent enfin de ce qu’elles évitaient.', TOUSSAINT),
      r('Papy Lucien est passé dans mon étude, il y a bien longtemps. Il voulait léguer quelque chose au quartier… mais c’est une histoire de famille.'),
      r('Ta réputation monte, {prenom}. Dans mon métier, on dit qu’un nom propre vaut mieux qu’un compte plein.', CONNU),
      r('Le modèle économique que choisira le quartier aura des effets juridiques. Une coopérative, ça se rédige avec soin.', CH5),
    ],
    rumors: [
      { text: 'Plusieurs propriétaires de l’avenue Jean-Jaurès voudraient vendre leurs locaux commerciaux en même temps. Un investisseur rôde.', sector: 'immobilier' },
      { text: 'Il paraît que la mairie pourrait préempter un immeuble du centre pour y installer des commerces à loyer modéré.', sector: 'immobilier' },
      { text: 'Une vieille famille de Bellevue aurait légué son parc à la commune, à condition qu’il reste ouvert à tous.', sector: 'immobilier' },
    ],
  },
  res_catherine_professeure: {
    lines: [
      r('Les jours de pluie, je fais un débat en classe au lieu du cours magistral. Les élèves sont plus calmes et plus curieux.', PLUIE),
      r('À la rentrée, je demande à mes élèves ce que coûte un sandwich. Puis on remonte toute la chaîne de valeur.', { saison: ['finEte'] }),
      r('L’inflation, c’est quand ton argent de poche achète moins que l’an dernier. Pas besoin de formule pour le sentir.'),
      r('Tu viendras au lycée bientôt, {prenom}. En sciences économiques et sociales, tu verras que tu fais déjà de l’économie.', { chapitre: [1, 3] }),
      r('Votre débat sur la place, je l’utilise en cours comme exemple de démocratie locale.', CH5),
      r('À la fête de la rentrée, je tiens le stand du lycée. Les parents demandent les options, les élèves la cantine.', RENTREE),
      r('Ton stand, c’est un vrai cas d’étude. Offre, demande, prix, concurrence : tout y est.', VENTE),
    ],
    rumors: [
      { text: 'Le lycée pourrait ouvrir une mini-entreprise d’élèves. Ils vendraient vraiment, avec un vrai compte.', sector: 'services' },
      { text: 'Il paraît que la réforme supprimerait des heures de sciences économiques et sociales. Les professeurs sont inquiets.', sector: 'services' },
      { text: 'Un ancien élève devenu entrepreneur voudrait financer une bourse pour les jeunes de la Cité des Roses.', sector: 'finance', quand: CH4 },
    ],
  },
  res_laurent_banquier: {
    lines: [
      r('Un crédit, c’est de l’argent du futur que tu dépenses aujourd’hui. Il faut être sûr que le futur sera là.'),
      r('Quand il pleut, mes clients annulent leurs rendez-vous. Bizarrement, les mauvaises nouvelles attendent le soleil.', PLUIE),
      r('En fin d’année, tout le monde veut boucler son budget. Décembre, c’est la saison des bilans et des mauvaises surprises.', HIVER),
      r('Le taux d’intérêt, c’est le prix du temps. Plus tu attends pour rembourser, plus tu paies.'),
      r('On dit que ton stand dégage des bénéfices, {prenom}. Un conseil : garde une réserve. Les imprévus arrivent toujours.', VENTE),
      r('Hayek pensait que les prix transmettent l’information mieux que n’importe quel planificateur. Je ne suis pas toujours d’accord.'),
      r('Ta réputation te servira plus tard. Une banque prête d’abord à quelqu’un en qui elle a confiance.', CONNU),
    ],
    rumors: [
      { text: 'La banque durcirait ses conditions de prêt aux commerçants de la vallée. Les petits projets auront du mal à démarrer.', sector: 'finance' },
      { text: 'Il paraît qu’une plateforme de financement participatif cible les projets de la Friche Taret.', sector: 'finance' },
      { text: 'Une banque coopérative voudrait ouvrir une agence dans le centre. Elle prêterait aux projets que les autres refusent.', sector: 'finance', quand: CH4 },
    ],
  },
  res_genevieve_horticultrice: {
    lines: [
      r('Au printemps, les glycines de Bellevue fleurissent toutes la même semaine. Toute la ville vient les voir.', PRINTEMPS),
      r('Quand il pleut, les jardins respirent. Moi aussi : je n’ai pas à arroser.', PLUIE),
      r('En automne, je divise les vivaces et je les donne aux voisins. Un jardin qui se partage ne meurt jamais.', AUTOMNE),
      r('À la Toussaint, je vends des chrysanthèmes sur la place. Toute ma pépinière y passait autrefois.', TOUSSAINT),
      r('Une glycine met dix ans à fleurir. Il faut planter pour ceux qui viennent après soi.'),
      r('Tu as l’air pressé{e}, {prenom}. Assieds-toi un instant : les fleurs ne se regardent pas en courant.'),
      r('On dit que vous voulez des jardins sur la place. Je donnerai des boutures, si ça se fait.', CH4),
    ],
    rumors: [
      { text: 'La pépinière municipale pourrait fermer. Les jardiniers de la ville voudraient la reprendre en association.', sector: 'services' },
      { text: 'Il paraît qu’un concours des balcons fleuris sera relancé au printemps, avec un prix pour chaque quartier.', sector: 'culture' },
      { text: 'Une grande jardinerie voudrait s’installer à côté du Drive HyperVal. Les petits horticulteurs s’inquiètent.', sector: 'commerce' },
    ],
  },
};
