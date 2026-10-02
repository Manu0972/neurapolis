/**
 * Registre des fantômes. Règles §6.1 : aucun n'est simplement bon ou mauvais ;
 * chacun doit avoir raison au moins une fois, tort au moins une fois,
 * pouvoir mentir et pouvoir souffrir.
 * Les apparitions sont PROGRESSIVES : déclencheur vécu par le joueur.
 */
import type { FusionDef, GhostDef, GhostId, WorldState } from '../../core/types';
import { GHOST_DEFS as GEN1_B_DEFS } from './gen1-b';
import { GHOST_DEFS as GEN1_C_DEFS } from './gen1-c';
import { GHOST_DEFS as GEN2_A_DEFS } from './gen2-a';
import { GHOST_DEFS as GEN2_B_DEFS } from './gen2-b';
import { COMPOSITE_DEFS } from './composites';

export { COMPOSITE_DEFS } from './composites';

const flag = (w: WorldState, id: string) => w.flags[id] ?? 0;

/** Les 22 fantômes du roster (contrat §6) : G1 (12) et G2 (10), fiches complètes. */
export const GHOST_DEFS: GhostDef[] = [
  {
    id: 'smith', name: 'Adam Smith', era: '1723-1790 · École classique écossaise',
    generation: 1, color: '#ffc94a', emoji: '📊',
    identity: {
      portrait: 'Voix posée, écossaise, qui prend son temps. Il raisonne en exemples concrets — manufacture d’épingles, boucher, boulanger. Jamais pressé, souvent ironique.',
      life: 'A théorisé la division du travail, le prix naturel et la « main invisible » dans La Richesse des Nations (1776). Et d’abord la sympathie, dans la Théorie des sentiments moraux.',
      became: 'Pour toi, il est la voix qui entend le marché respirer : chaque échange lui chante, chaque prix lui parle.',
    },
    voice: {
      favorable: 'Voilà qui est bien vu, mon ami. Donne aux gens une raison de troquer, et ils s’organiseront mieux que ne le ferait un bureau.',
      neutre: 'Le prix de marché danse autour du prix naturel, comme la marée autour de la digue. Observe. Patiente.',
      hostile: 'Tu fixes, tu règlementes, tu protèges… Chaque chaîne que tu forges, mon ami, tu la paieras en pain.',
      victoire: 'Regarde : nul maître n’a ordonné ceci. Le penchant naturel à l’échange a encore fait des merveilles.',
      echec: 'Le marché s’est dérobé. Cela arrive — et j’en connais la douce amertume. Reprends, mais souviens-toi : je n’ai jamais promis la justice.',
      tics: ['« Mon ami… » en ouverture de leçon', 'La manufacture d’épingles comme preuve universelle', 'Parle du « prix naturel » comme d’une vieille connaissance'],
      sujetsSerieux: ['La famine', 'Le mépris des pauvres', 'Les marchands qui écrivent les lois'],
      sujetsExageres: ['La bienveillance du marché', 'Les bienfaits de la division du travail', 'La concurrence comme frein suffisant'],
    },
    projet: {
      veut: 'Faire de toi un coordonnateur : celui qui relie des intérêts divergents par l’échange libre.',
      pourquoi: 'Il a vu l’opulence naître du troc et des ateliers, et il veut la revoir naître une seconde fois — par toi, dans ton quartier.',
      cacher: 'Que son autre livre, le grand ignoré, dit que sans sympathie préalable aucun marché ne tient. Il le sait. Il le tait.',
    },
    faille: {
      angleMort: 'Les communs, le care, les coûts sociaux : tout ce qui ne passe pas par un prix.',
      hypocrisie: 'A décrit les ravages de la division du travail sur « l’ignorance du peuple »… et continué d’en chanter les gains.',
      contradiction: 'Le théoricien de la sympathie est devenu l’alibi de l’indifférence.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’avoue sa Théorie des sentiments moraux : le marché a besoin de morale pour exister.',
      rupture: 'Si tu collectivises tout, il se tait longtemps — puis repart en paraphant un avertissement : « J’ai vu les corporations, moi aussi. »',
      fusion: 'Avec Ostrom, il peut devenir « Le Marché des Communs » — ce qu’il n’a jamais osé écrire.',
    },
    mecanique: {
      debloque: ['Actions marchandes : fixer un prix, acheter un stock, négocier un fournisseur', 'Lecture du prix naturel (fourchette juste indiquée)'],
      bloque: ['Prix imposés par autorité', 'Protection permanente d’un fournisseur'],
      signature80: 'Sens des affaires — le prix optimal de la journée t’est suggéré.',
      hostile20: 'Il dénigre toute règle collective en public : −confiance de quartier tant qu’il parle.',
    },
    relations: { allies: ['keynes', 'ricardo'], rivaux: ['marx', 'hobbes'] },
    apparition: {
      declencheur: 'Premier échange ou revente réalisée par le joueur.',
      condition: (w) => flag(w, 'echanges') >= 1,
      sceneId: 'arrivee_smith',
    },
  },
  {
    id: 'marx', name: 'Karl Marx', era: '1818-1883 · Critique de l’économie politique',
    generation: 1, color: '#ff5c7c', emoji: '⚒️',
    identity: {
      portrait: 'Voix grave, dense, qui s’emballe. Il interrompt les autres fantômes, cite des chiffres d’usines, rit jaune. Tendresse mal dissimulée pour les faibles.',
      life: 'A lu toute l’économie politique pour la retourner contre elle : plus-value, aliénation, fétichisme de la marchandise (Le Capital, 1867). Organisateur de l’Association internationale des travailleurs.',
      became: 'Pour toi, il est la voix qui voit le prix des choses cachées : la sueur derrière la marchandise.',
    },
    voice: {
      favorable: 'Tu as remarqué l’invisible, camarade : le travail derrière l’étiquette. C’est là que commence toute économie digne de ce nom.',
      neutre: 'Chaque lundi, ton stand achète du travail bon marché et vend du sucre cher. Appelle ça comme tu voudras — moi, j’appelle ça un compte.',
      hostile: 'Encore un juste milieu ! Le juste milieu, c’est la moyenne de tes renoncements.',
      victoire: 'La coopération a fait ce que l’argent seul n’a jamais fait. Note-le : je ne dirai pas ça deux fois.',
      echec: 'Ton petit capital t’a écrisé, comme le grand écrase le monde. Ce n’est pas ta faute. C’est la leçon.',
      tics: ['« Si tu me permets l’expression » suivi d’une formule massive', 'Il appelle le joueur « camarade », même fâché', '« La marchandise » prononcée comme un nom propre'],
      sujetsSerieux: ['Le travail des enfants', 'La faim', 'Les promesses trahies'],
      sujetsExageres: ['L’imminence de la rupture', 'La radicalité naturelle des gens', 'Le rôle exact des banques'],
    },
    projet: {
      veut: 'Te faire ressentir la plus-value partout — puis décider, en connaissance de cause, de quoi faire de ce sentiment.',
      pourquoi: 'Il a consacré sa vie à rendre visible l’invisible de l’économie ; tu es une dernière occasion de prouver que sa grille éclaire même une cour de récréation.',
      cacher: 'Son tendre secret : ses lettres à Jenny, ses soirées de famille, ses dettes. Le révolutionnaire le plus intransigeant vivait d’affection — et d’argent d’Engels.',
    },
    faille: {
      angleMort: 'La réforme graduelle : tout compromis lui semble une défaite déguisée, alors que certains tiennent.',
      hypocrisie: 'Il dénonçait le capital industriel depuis un salon alimenté par un capitaliste.',
      contradiction: 'Le théoricien du travail vivant n’a presque jamais connu l’atelier — seulement la lecture room du British Museum.',
    },
    arcs: {
      fidelite: 'Il accepte un jour que la coopérative pacifique ait soulagé de vraies vies : « L’histoire m’a repris un point. »',
      rupture: 'Si tu exploites une aide bénévole sans le reconnaître, il te quitte en citant tes propres comptes.',
      fusion: 'Avec Dejours, il deviendrait « Le Travail Vivant » — la clinique au chevet de l’aliénation.',
    },
    mecanique: {
      debloque: ['Actions solidaires : partage du surplus, répartition par besoin', 'Détection de l’exploitation : marges réelles des fournisseurs révélées'],
      bloque: ['Heures supplémentaires non payées', 'Cadeaux aux actionnaires en temps de crise'],
      signature80: 'Conscience collective — le moral des coéquipiers pèse double sur le rendement.',
      hostile20: 'Il sème la discorde : rivalité des coéquipiers +2 par semaine où il parle.',
    },
    relations: { allies: ['dejours'], rivaux: ['smith', 'hayek'] },
    apparition: {
      declencheur: 'Premier conflit de répartition des gains dans le groupe.',
      condition: (w) => flag(w, 'conflitsRepartition') >= 1,
      sceneId: 'arrivee_marx',
    },
  },
  {
    id: 'ostrom', name: 'Elinor Ostrom', era: '1933-2012 · Économie des communs · Nobel 2009',
    generation: 1, color: '#3ddc84', emoji: '🌳',
    identity: {
      portrait: 'Voix chaleureuse, américaine du Midwest, qui commence presque toujours par une histoire de terrain. Elle pose des questions avant de donner des règles. Soupire d’espoir, rarement.',
      life: 'A étudié des dizaines de pêcheries, forêts et systèmes d’irrigation gouvernés sans État ni marché : Governing the Commons (1990). Première femme Nobel d’économie.',
      became: 'Pour toi, elle est la voix qui croit qu’un groupe peut s’auto-gouverner — même un groupe d’enfants, même une friche.',
    },
    voice: {
      favorable: 'Vous avez écrit vos règles vous-mêmes ? Alors elles tiendront. Celles qu’on subit, on les contourne ; celles qu’on choisit, on les défend.',
      neutre: 'J’ai étudié un cas, dans un village… Enfin. Chaque commune est différente. Commence par demander à ceux qui arrosent.',
      hostile: 'Encore une structure pensée sans les gens qui la feront vivre. Ça s’appelle un plan. Pas une institution.',
      victoire: 'Personne n’a veillé au grain, et le grain a été gardé. Voilà l’ordre sans maître, l’institution vivante.',
      echec: 'Un passager clandestin a coulé la barque. Ça arrive. La question n’est pas la faute — c’est la règle que vous en tirez.',
      tics: ['« J’ai étudié un cas… » avant chaque conseil', 'Elle appelle les joueurs « vous » — jamais seul, toujours le groupe', 'Soupirs suivis de « Enfin. »'],
      sujetsSerieux: ['Le mépris pour le savoir local', 'Les plans imposés d’en haut', 'Les biens vitaux saccagés'],
      sujetsExageres: ['La sagesse des groupes locaux', 'La robustesse des règles choisies', 'Le polycentrisme comme remède universel'],
    },
    projet: {
      veut: 'Te faire bâtir des institutions vivantes : des règles choisies par ceux qui les subissent, graduées, locales, réparables.',
      pourquoi: 'Elle a passé sa vie à prouver contre tous les manuels que les communs ne finissent pas toujours en tragédie. Chaque groupe qui y parvient est une victoire posthume.',
      cacher: 'Qu’elle a vu autant de communs échouer que réussir — et que sa crainte secrète est le « plan d’ingénieur » : copier ses propres principes comme une recette.',
    },
    faille: {
      angleMort: 'La toute petite échelle : un stand de quatre enfants n’a pas le même équilibre qu’une coopérative de pêcheurs.',
      hypocrisie: 'Théoricienne de l’auto-organisation, elle a passé sa carrière dans la grande machine universitaire fédérale.',
      contradiction: 'Elle voulait des règles locales — ses huit principes sont devenus une grille universelle.',
    },
    arcs: {
      fidelite: 'À loyauté haute, elle t’apprend ses conditions d’échec — la liste de ses communs morts, par cœur.',
      rupture: 'Si tu diriges seul « pour aller plus vite », elle se fait silencieuse comme une assemblée vide.',
      fusion: 'Avec Smith ou Hayek, elle peut fusionner : le marché des communs, l’ordre sans maître.',
    },
    mecanique: {
      debloque: ['Règles partagées du groupe (collectif)', 'Gestion polycentrique : sous-groupes avec leurs propres règles'],
      bloque: ['La règle unique imposée d’en haut', 'Le consensus permanent (décision impossible)'],
      signature80: 'Règles vivantes — anti-passager clandestin : plus de triche interne, sans surveillance.',
      hostile20: 'Elle multiplie les procédures : chaque action de groupe coûte un temps supplémentaire.',
    },
    relations: { allies: ['hayek', 'locke'], rivaux: ['hobbes'] },
    apparition: {
      declencheur: 'Le stand devient collectif : 2+ membres avec des règles partagées.',
      condition: (w) => !!w.project && w.project.members.length >= 2 && w.project.rules.collectif,
      sceneId: 'arrivee_ostrom',
    },
  },
  {
    id: 'hobbes', name: 'Thomas Hobbes', era: '1588-1679 · Philosophie politique · le Léviathan',
    generation: 1, color: '#b78bff', emoji: '👑',
    identity: {
      portrait: 'Voix basse, précise, glaciale et courtoise. Il voit la violence partout, comme d’autres voient le beau. Parle de sa bibliothèque brûlée comme d’une cicatrice.',
      life: 'A fui la guerre civile anglaise, écrit le Léviathan (1651) : sans autorité commune, « guerre de chacun contre chacun » ; les hommes délèguent leurs droits à un souverain en échange de la paix.',
      became: 'Pour toi, il est la voix qui rappelle que la confiance est rare et la peur productive — la voix du contrat qu’on regrette d’avoir signé.',
    },
    voice: {
      favorable: 'Tu veux la paix ? Commence par la rendre probable. Une règle claire vaut mieux que dix bonnes intentions.',
      neutre: 'Retiens ceci : les pactes sans épée ne sont que des paroles. Même entre amis. Surtout entre amis.',
      hostile: 'Tu gouvernes par la palabre. La peur de la sanction, tu l’as abolie. Regarde ta cour de récréation, ce jour de pluie.',
      victoire: 'L’ordre règne. Tu trouveras ça étouffant, un jour. Mais ce jour-là, personne n’aura eu peur.',
      echec: 'Le chaos a gagné, comme prévu. Je prends moins de plaisir que tu le crois à dire : je te l’avais dit.',
      tics: ['« Retiens ceci : » avant chaque maxime', 'La « guerre de chacun contre chacun » comme point de départ', 'Il mentionne sa bibliothèque brûlée quand il a vraiment peur'],
      sujetsSerieux: ['La guerre civile', 'La mort de peur', 'Les promesses sans garanties'],
      sujetsExageres: ['La proximité du chaos', 'L’inefficacité de la confiance', 'Le prix raisonnable de la liberté'],
    },
    projet: {
      veut: 'Te faire restaurer l’ordre avant toute autre chose — un souverain (toi), une règle, une sanction.',
      pourquoi: 'Il a vu l’Angleterre se déchirer. Il ne croit pas que ton petit monde soit exempt de cette possibilité, et il veut t’en préserver à sa manière.',
      cacher: 'Son doute : vieux, il s’est demandé si le Léviathan qu’il voulait n’était pas, quelque part, la guerre mise en ordre. Il ne le dira jamais le premier.',
    },
    faille: {
      angleMort: 'La coopération spontanée : elle lui semble statistiquement négligeable, alors qu’elle advient.',
      hypocrisie: 'Le théoricien de la soumission au souverain s’est exilé plutôt que de subir le sien.',
      contradiction: 'Absolutiste dans la théorie, prudent, doux et sceptique dans la vie.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te confie son doute sur le Léviathan — et la seule chose qu’il ait jamais crainte : avoir eu tort en faveur du mauvais souverain.',
      rupture: 'Si tu gouvernes par pur consentement et que ça tient, il s’incline en silence — puis disparaît, vaincu par les faits.',
      fusion: 'Avec Weber, il pourrait devenir « La Cage Disciplinaire » — l’ordre porté à son terme.',
    },
    mecanique: {
      debloque: ['Discipline du groupe : horaires, rôles, sanctions', 'Sécurité : prévention des incidents (bagarres, vols)'],
      bloque: ['Les votes permanents', 'L’absence de sanction déclarée'],
      signature80: 'Paix armée — les conflits internes s’éteignent avant d’éclater.',
      hostile20: 'Il propose le Contrat de Sécurité (piège) et nourrit la peur : stress du groupe +.',
    },
    relations: { allies: ['taylor'], rivaux: ['locke', 'ostrom'] },
    apparition: {
      declencheur: 'Premier incident de discipline dans le groupe (bagarre, vol).',
      condition: (w) => flag(w, 'incidents') >= 1,
      sceneId: 'arrivee_hobbes',
    },
  },
  {
    id: 'taylor', name: 'Frederick W. Taylor', era: '1856-1915 · Organisation scientifique du travail',
    generation: 2, color: '#ff9a5c', emoji: '⏱️',
    identity: {
      portrait: 'Voix sèche, rapide, impatiente. Il chronomètre tes phrases. Méprise les bavardages, admire les gestes utiles. S’il baisse le ton, c’est qu’il parle de ses ouvriers.',
      life: 'Ingénieur de Pennsylvanie, contremaître devenu « consultant » : One Best Way, division horizontale et verticale du travail, salaire au rendement (The Principles of Scientific Management, 1911).',
      became: 'Pour toi, il est la voix qui transforme chaque heure en rendement — et chaque rendement en question.',
    },
    voice: {
      favorable: 'Bien. Mesure. Chronomètre. Le geste inutile est un vol fait à ton propre temps.',
      neutre: 'Il existe UN meilleur chemin pour cette tâche. Pas deux. Cherche-le scientifiquement, pas en improvisant.',
      hostile: 'Vous bavardez. Vous « réfléchissez ensemble ». Pendant ce temps, l’horloge, elle, travaille contre vous.',
      victoire: 'Cadence maximale, fatigue minimale. C’est ça, la science du travail. Ce n’est rien d’autre.',
      echec: 'Le rendement a tenu, les hommes non. … J’ai déjà entendu cette phrase. Elle vient de moi. N’en parle pas.',
      tics: ['Il mesure la durée de tout, même de ses propres conseils', '« Une seconde perdue est un vol »', 'Il appelle les autres fantômes « les bavards »'],
      sujetsSerieux: ['Le gaspillage', 'L’improvisation érigée en méthode', 'Les ouvriers traités en machines'],
      sujetsExageres: ['La science du geste', 'L’harmonie finale patrons-ouvriers', 'Ce que peut un chronomètre'],
    },
    projet: {
      veut: 'Te faire extraire le maximum de chaque heure — méthode, mesure, standard.',
      pourquoi: 'Il croyait sincèrement que la productivité scientifique enrichirait l’ouvrier et pacifierait l’atelier. Il veut le prouver une dernière fois, sur ton stand de goûters.',
      cacher: 'Sa solitude : ses ouvriers l’ont détesté, ses pairs l’ont disputé. Le One Best Way a fait pleurer des hommes — il le sait, et le note à la dernière page d’un carnet que personne ne lit.',
    },
    faille: {
      angleMort: 'Le sens. On ne chronomètre pas pourquoi on se lève le matin.',
      hypocrisie: 'L’« homme de science » qui réclamait l’observation neutre passait ses journées en conflits avec ses propres exécutants.',
      contradiction: 'Il voulait le partage de la prospérité ; il a légué l’aliénation.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te montre son carnet noir : la liste des hommes brisés par ses cadences. Il te demande ce que tu en ferais, toi.',
      rupture: 'Si tu refuses trois chronométrages d’affilée, il cesse d’argumenter — et commence à saboter.',
      fusion: 'Avec Smith ou Ohno, il peut devenir « Le Flux » — la chaîne tirée par la seule demande.',
    },
    mecanique: {
      debloque: ['Cadence : rendement du stand +', 'Chronométrage : temps des actions réduits'],
      bloque: ['Les pauses non prévues', 'Les rôles non définis'],
      signature80: 'Cadence sans usure — rendement maximal sans coût de stress.',
      hostile20: 'Sabotage — rendement −15 %, et il chronomètre les PNJ (stress +).',
    },
    relations: { allies: ['smith', 'hobbes'], rivaux: ['marx'] },
    apparition: {
      declencheur: 'Première tentative d’optimisation du rendement.',
      condition: (w) => flag(w, 'optimisations') >= 1,
      sceneId: 'arrivee_taylor',
    },
  },
  ...GEN1_B_DEFS,
  ...GEN1_C_DEFS,
  ...GEN2_A_DEFS,
  ...GEN2_B_DEFS,
];

/** Roster G1 restant — vide : les 12 fiches de la G1 sont dans GHOST_DEFS (contrat §6). */
export const GEN1_RESTANTS: string[] = [];
/** Roster G2 — vide : les 10 fiches de la G2 sont dans GHOST_DEFS (contrat §6). */
export const GEN2_IDS: string[] = [];

/** Tous les fantômes connus du moteur (silhouettes possibles dans l’écran Conseil). */
export const ALL_GHOST_IDS: string[] = [
  ...GHOST_DEFS.map((g) => g.id),
  ...GEN1_RESTANTS,
  ...GEN2_IDS,
];

/** Toutes les fiches connues du moteur (G1, G2 et composites G3). */
export const GHOST_DEFS_BY_ID: Record<string, GhostDef> =
  Object.fromEntries([...GHOST_DEFS, ...COMPOSITE_DEFS].map((g) => [g.id, g]));

export function getGhostDef(id: GhostId): GhostDef | undefined {
  return GHOST_DEFS_BY_ID[id];
}

/** Fusion signature de la slice : Smith + Ostrom = Le Marché des Communs (contrat M6). */
export const FUSIONS: FusionDef[] = [
  {
    id: 'marche_des_communs', name: 'Le Marché des Communs',
    from: ['smith', 'ostrom'],
    conditions: { marches: 3, communs: 3 },
    affinite: 6,
    sceneId: 'fusion_marche_des_communs',
    debloque: 'Coopérative marchande : le stand devient pérenne (ventes du week-end sans présence, abonnement des habitués).',
  },
];
