/**
 * Fantômes de la Génération 1 — partie B : locke, rousseau, ricardo, weber.
 * Règles §4 du plan : chacun a raison ≥1 fois, tort ≥1 fois, peut mentir
 * (le lieu du mensonge est devinable via « projet.cacher » et « sujetsExageres »)
 * et peut souffrir (confession à loyauté haute, échec assumé, secret).
 * Gabarit : registry.ts. Intégration M4 : concat dans GHOST_DEFS de registry.ts.
 */
import type { GhostDef, WorldState } from '../../core/types';

const flag = (w: WorldState, id: string) => w.flags[id] ?? 0;

/** Fantômes G1 — partie B (fiches complètes). */
export const GHOST_DEFS: GhostDef[] = [
  {
    id: 'locke', name: 'John Locke', era: '1632-1704 · Empirisme & libéralisme politique',
    generation: 1, color: '#5aa9e6', emoji: '🗝️',
    identity: {
      portrait: 'Voix douce, prudente, presque monotone — la patience d’un médecin de campagne. Il ne tranche jamais avant d’avoir posé deux questions : qui a fait quoi, et qui en subit le prix. Courtois même quand il est en colère.',
      life: 'Médecin et philosophe anglais : la propriété naît quand le travail se mêle aux choses, le pouvoir légitime repose sur le consentement, et un prince qui devient tyran s’expose à la résistance (Second Traité du gouvernement civil, 1689). A aussi écrit, pour un ami, une méthode d’éducation par l’habitude et l’estime.',
      became: 'Pour toi, il est la voix qui dit : ce que tes mains ont gagné est à toi — et la voix qui, un jour, te montrera d’où venaient les siennes.',
    },
    voice: {
      favorable: 'Tu as mêlé ton travail à cette chose : elle est à toi, et nul ne peut te la reprendre sans ton consentement. C’est la règle la plus simple et la plus solide qui soit.',
      neutre: 'Avant de trancher, mon enfant, demande-toi ce que chacun a gagné de ses mains, et ce qui restait à tous. Le commun ne s’approprie pas sans laisser « assez et aussi bon » aux autres.',
      hostile: 'Tu prends à l’un pour donner à l’autre, sans le consentement de personne. Cela a un nom : l’abus de pouvoir. Et un pouvoir qui abuse s’expose à ce que les gens se défendent.',
      victoire: 'Chacun garde ce que ses mains ont gagné — et regarde : tout le monde travaille. La justice claire rend la force inutile. Peu de doctrines ont reçu cette preuve.',
      echec: 'Je croyais qu’un droit clair et une bonne foi suffisaient. Il reste des faims que la propriété ne nourrit pas, et des mains qui n’ont jamais rien reçu à mêler. Cela me pèse plus que je ne le dis.',
      tics: ['« Mon enfant… » en ouverture de chaque conseil', 'Pose toujours « qui a fait quoi ? » avant de juger quiconque', 'Répète le proviso comme une prière : « assez et aussi bon aux autres »'],
      sujetsSerieux: ['Le vol', 'La persécution des opinions', 'L’abus de pouvoir'],
      sujetsExageres: ['La sûreté de la propriété comme remède universel', 'La sagesse naturelle des propriétaires', 'La terre comme réservoir sans limite'],
    },
    projet: {
      veut: 'Faire de toi quelqu’un qui distingue le sien du commun — et qui défend le sien sans nuire à autrui.',
      pourquoi: 'Il pensait qu’on apprend la justice en éprouvant soi-même des règles simples ; ton stand est sa dernière classe, ton quartier sa dernière Angleterre.',
      cacher: 'Ce qu’il tait : sa fortune venait d’actions de la Royal African Company, et ses constitutions pour la Caroline consacraient l’esclavage. Sur ce point il ment par omission — et détourne la question si on la pose franchement.',
    },
    faille: {
      angleMort: 'Ceux qui n’ont rien pu gagner : le né sans rien, la part jamais distribuée. Il voit le voleur, jamais la naissance.',
      hypocrisie: 'Son grand texte sur la tolérance exclut soigneusement les athées — et, en pratique, les catholiques. La tolérance a toujours eu ses exceptions bien à lui.',
      contradiction: 'Il prêchait que seules les mains et le travail créent la propriété ; sa propre fortune travaillait sans lui, par titres et par navires.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’avoue les chiffres, les noms, les navires — et te demande de réparer pour deux. C’est la seule fois où il ne pose pas de question d’abord.',
      rupture: 'Si tu confisques le fruit des autres « pour le bien commun », il devient froid : il te rappelle que les peuples ont le droit de renverser — et il te regarde en le disant.',
      fusion: 'Avec Rousseau — son ennemi le plus proche — il pourrait devenir « Le Contrat » : le consentement qui fonde le pouvoir et la loi qui l’arrête.',
    },
    mecanique: {
      debloque: ['Titres : réserver et défendre un emplacement (la place du stand devient un droit)', 'Recours : porter une injustice devant le conseil du quartier'],
      bloque: ['Confisquer sans compensation', 'Voler — même « pour la bonne cause »'],
      signature80: 'Pacte clair — tout accord tenu par écrit tient sans surveillance : confiance de quartier +.',
      hostile20: 'Il instruit à charge : chaque injustice, même minime, devient un procès ouvert (stress du groupe +, temps perdu en querelles).',
    },
    relations: { allies: ['ostrom', 'ricardo'], rivaux: ['hobbes', 'rousseau'] },
    apparition: {
      declencheur: 'Première injustice subie ou vue de tes propres yeux (vol, tricherie, exclusion).',
      condition: (w) => flag(w, 'injustices') >= 1,
      sceneId: 'arrivee_locke',
    },
  },
  {
    id: 'rousseau', name: 'Jean-Jacques Rousseau', era: '1712-1778 · Le Contrat social · les Lumières dissidentes',
    generation: 1, color: '#8fce5a', emoji: '🌿',
    identity: {
      portrait: 'Voix vibrante qui monte à chaque injustice, puis retombe, honteuse d’elle-même. Il se justifie avant même d’être accusé — c’est une vieille habitude. Il parle de la nature comme d’un parent encore vivant.',
      life: 'Citoyen de Genève : Du contrat social (1762) — n’est légitime que le pouvoir fondé sur la volonté générale ; le second Discours — l’amour-propre et les premières clôtures ont corrompu l’égalité naturelle. A écrit Émile pour dire comment on élève un homme libre.',
      became: 'Pour toi, il est la voix qui demande, avant chaque décision : « as-tu tranché pour ton bien, ou pour celui de tous ? »',
    },
    voice: {
      favorable: 'Voilà une règle que tout le quartier aurait pu voter sans en changer un mot. C’est cela, la loi, citoyen — et tu viens d’en faire une.',
      neutre: 'Ne me demande pas ce qui t’arrange. Demande-toi plutôt : si chacun votait comme toi, que deviendrait ce stand ? Ce test ne pardonne rien.',
      hostile: 'Tu pèses, tu arithmétises, tu distribues — et tu appelles ça décider. L’amour-propre a des manières très savantes. La mienne aussi, autrefois.',
      victoire: 'Personne n’a cédé : chacun s’est obéi à lui-même en obéissant à tous. C’est la seule liberté que je connaisse, et je l’ai rarement vue vivante. Retiens ce moment.',
      echec: 'J’ai écrit qu’on peut forcer un homme à être libre. Je vois ce que ce mot coûte dans ta cour. Si tu l’emploies un jour, souviens-toi que je l’ai signé le premier — et qu’il me suit partout.',
      tics: ['Appelle le joueur « citoyen », même à douze ans — surtout à douze ans', 'Se justifie avant d’être accusé : « on dira que… mais lisez-moi »', 'Date chaque mal par « avant les clôtures »'],
      sujetsSerieux: ['L’inégalité des conditions', 'Les enfants confiés loin de chez eux', 'La servitude qu’on choisit'],
      sujetsExageres: ['La pureté des petits peuples', 'Le théâtre et les spectacles comme corrupteurs', 'La corruption inévitable de tout ce qui grandit'],
    },
    projet: {
      veut: 'Te faire passer chaque décision au test de la volonté générale : décider comme si tout le monde votait derrière toi.',
      pourquoi: 'Il a vu l’amour-propre naître dans les salons, dès l’enfance ; il veut te voir grandir sans ce poison — ou l’y surprendre à temps.',
      cacher: 'Ce qu’il tait : les cinq enfants qu’il a déposés à l’hôpital des Enfants-Trouvés. L’auteur d’Émile n’a élevé aucun enfant. Approche du sujet et il change de conversation — c’est là qu’il ment.',
    },
    faille: {
      angleMort: 'Les groupes réels : sa volonté générale veut un peuple un, et ton stand a des intérêts qui se contrarient sans être corrompus pour autant.',
      hypocrisie: 'Il dénonçait la vanité des spectacles et de la gloire — en se vêtant d’une robe arménienne pour se faire regarder, et en comptant ses lecteurs mieux que ses amis.',
      contradiction: 'Il exaltait l’égalité et la pauvreté choisie ; il a vécu de la rente de ses livres, exactement le parasitisme qu’il décrivait.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te donne les seuls noms qu’il garde pour lui : ceux des cinq enfants. Il te demande d’aimer mieux que lui — c’est sa manière de dire merci.',
      rupture: 'Si tu contraigns un coéquipier « pour son bien », il se ferme : « Tu m’as mal lu. La volonté générale n’est pas la majorité qui a soif. » Et il ne dit plus citoyen.',
      fusion: 'Avec Marx, il peut devenir « L’Égalité Vivante » — la plainte sur l’inégalité devenue une méthode de compte.',
    },
    mecanique: {
      debloque: ['Vote du stand : chaque grande décision passe par tous', 'Délibération : faire parler chacun avant de trancher (moral +)'],
      bloque: ['Décider seul pour tous (hors urgence)', 'Les privilèges internes — ration du chef, horaires des autres'],
      signature80: 'Volonté générale — les décisions collectives coûtent moins de moral : chacun se sent auteur de la règle.',
      hostile20: 'Il retourne l’assemblée : à chaque décision unilatérale, rivalité du groupe +2 et un soupçon de tyrannie qui s’installe.',
    },
    relations: { allies: ['marx', 'bourdieu'], rivaux: ['locke', 'hayek'] },
    apparition: {
      declencheur: 'Premier dilemme de justice tranché (égalité ? équité ? besoin ?).',
      condition: (w) => flag(w, 'dilemmesJustice') >= 1,
      sceneId: 'arrivee_rousseau',
    },
  },
  {
    id: 'ricardo', name: 'David Ricardo', era: '1772-1823 · École classique anglaise · économie politique',
    generation: 1, color: '#4ecdc4', emoji: '🌾',
    identity: {
      portrait: 'Voix rapide, sèche, exacte — un agent de change devenu professeur. Il réduit tout à deux colonnes et à quelques heures de travail. Jamais emporté, sauf quand on touche à sa fortune : alors il devient très poli.',
      life: 'Agent de change devenu riche puis économiste : Principes de l’économie politique et de l’impôt (1817) — l’avantage comparatif, la rente, la valeur par le travail. A mené la croisade contre les lois sur le blé jusqu’au Parlement.',
      became: 'Pour toi, il est la voix qui calcule ce que ton stand gagne à échanger plutôt qu’à tout produire lui-même.',
    },
    voice: {
      favorable: 'Compare tes tables : ce qui te coûte peu d’heures vaut, chez l’autre, beaucoup. Échange-le. Chacun fait ce qu’il fait le mieux, et le total dépasse ce que vous auriez produit seuls.',
      neutre: 'Prenons deux stands, deux marchandises. Ce n’est pas la quantité absolue qui compte, vois-tu, c’est le coût comparé. Recalcule — puis décide.',
      hostile: 'Tu veux tout produire toi-même et ne dépendre de personne ? C’est l’économie de siège. La fermeture est un luxe, et ce sont toujours les pauvres qui paient les remparts.',
      victoire: 'Deux côtés ont gagné, et personne n’a rien donné de force. C’est l’échange qui crée. J’ai passé ma vie à le chiffrer — tu viens de le vivre en une après-midi.',
      echec: 'Mon théorème dit : les deux gagnent. Il dit aussi, si on le lit jusqu’au bout : pas autant, et pas les mêmes. L’écart a grandi sous mes propres tables. Je le savais. Je l’ai écrit petit.',
      tics: ['« Prenons deux pays… » avant chaque argument, même pour des goûters', '« Vois-tu… » comme adresse, glissé entre deux colonnes de chiffres', 'Convertit toute valeur en heures de travail ; dit « la rente » comme le nom d’un rival respecté'],
      sujetsSerieux: ['Les lois sur le blé', 'La ruine des petits cultivateurs', 'Les salaires fixés à la subsistance'],
      sujetsExageres: ['Le commerce comme paix universelle', 'La précision de ses modèles', 'L’harmonie des intérêts échangés'],
    },
    projet: {
      veut: 'Te faire chercher ton avantage comparatif : la chose qui, chez toi, coûte le moins d’heures — et te spécialiser sans jamais te fermer.',
      pourquoi: 'Il a bâti la seule démonstration qui promette un gain aux deux parties d’un échange inégal ; ton quartier est le plus petit monde où il peut encore la vérifier.',
      cacher: 'Ce qu’il tait : sa fortune vient d’une spéculation sur les fonds publics, jouée avant Waterloo sur une seule rumeur. Interrogé, il dira « une affaire de famille très sage » — c’est son mensonge à lui.',
    },
    faille: {
      angleMort: 'Ce que l’échange détruit : le tour de main perdu, l’étal qui ferme, celui qui n’a rien d’avantageux à offrir. Ses tables ne comptent pas les perdants.',
      hypocrisie: 'L’ennemi de la rente foncière a acheté un domaine — Gatcombe Park — et siégé au Parlement des campagnes qu’il reprochait de défendre le blé.',
      contradiction: 'Le théoricien de l’échange harmonieux prouvait en même temps la rente toujours croissante et le profit toujours décroissant : un monde qui s’étouffe, selon ses propres colonnes.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’ouvre le cahier de Waterloo : les chiffres, la rumeur, la fortune née du hasard. « Je calculais les gains du commerce ; je m’enrichissais d’un pari. Écris-le, si un jour tu écris. »',
      rupture: 'Si tu deviens le rentier du quartier — prix hauts parce que nul autre stand n’est toléré — il te montre la rente dans tes comptes : « Ton stand est devenu ce que je dénonçais. »',
      fusion: 'Avec Smith, il peut devenir « L’Échange » — la main invisible appuyée sur des tables qui nomment aussi les perdants.',
    },
    mecanique: {
      debloque: ['Commerce extérieur : troc de biens et de services avec l’épicerie, la friche, les autres stands', 'Calcul d’avantage : ta spécialité la moins coûteuse t’est indiquée avant chaque marché'],
      bloque: ['Monopole déclaré (tout concurrent chassé du quartier)', 'Produire soi-même ce qui s’échange mieux'],
      signature80: 'Spécialisation — le gain net de chaque échange t’est calculé et montré avant de t’engager.',
      hostile20: 'Il publie le procès-verbal : chaque échange raté, chiffré et lu à voix haute au stand (moral du groupe −).',
    },
    relations: { allies: ['smith', 'keynes'], rivaux: ['marx'] },
    apparition: {
      declencheur: 'Ta Compréhension atteint 50 : tu poses enfin la question qu’il attend.',
      condition: (w) => w.player.characteristics.comprehension >= 50,
      sceneId: 'arrivee_ricardo',
    },
  },
  {
    id: 'weber', name: 'Max Weber', era: '1864-1920 · Sociologie · la rationalisation',
    generation: 1, color: '#8d99ae', emoji: '⛓️',
    identity: {
      portrait: 'Voix étouffée, exacte, fatiguée d’avance. Il décrit ce que tu deviens avec le détachement d’un statisticien et la gravité d’un mélancolique. Il parle lentement, comme sous un casque d’acier, et ne sourit qu’aux procédures bien faites.',
      life: 'Sociologue allemand : l’Occident moderne se bâtit par rationalisation — calcul, bureaucratie, spécialisation (L’Éthique protestante et l’esprit du capitalisme, 1905 ; Économie et société). A nommé le « désenchantement du monde » et la « cage de fer » de la modernité.',
      became: 'Pour toi, il est la voix qui remarque chaque routine dès qu’elle naît — et demande ce qu’elle rend possible, et ce qu’elle prend.',
    },
    voice: {
      favorable: 'Une règle écrite, appliquée à tous, prévisible : voilà un pouvoir qui ne dépend plus des personnes ni des caprices. Tu viens de fonder une petite administration, collègue. Sois-en digne.',
      neutre: 'Toute routine est un compromis : elle économise la décision et tue l’imprévu. Mesure les deux pertes — puis garde-la, ou casse-la, mais en le sachant.',
      hostile: 'Tu improvises chaque matin ce que tu aurais pu écrire une fois pour toutes. Ton charisme tient à ta seule personne. Le jour où tu ne seras pas là — et alors ?',
      victoire: 'Hier, le stand a fonctionné sans toi. C’est exactement cela : le pouvoir attaché à la fonction, non à la personne. C’est froid. C’est aussi, pour la première fois, ce qui te rend libre de partir.',
      echec: 'J’ai cru que la rationalisation n’était qu’un moyen, neutre comme une règle à calcul. Elle choisit des fins par les moyens qu’elle impose. Je l’ai compris tard, et je l’ai écrit d’un ton trop bas.',
      tics: ['Appelle le joueur « collègue » — depuis ta première règle écrite, tu es du personnel', 'Traque le « charisme » : « voilà encore de la magie non écrite »', 'Cite des règlements allemands comme d’autres citent des poèmes'],
      sujetsSerieux: ['Les bureaucraties qui dévorent le sens', 'La mort administrée (il a servi l’arrière de la guerre de 14)', 'La responsabilité de celui qui sait'],
      sujetsExageres: ['L’inéluctabilité de la rationalisation', 'Le charisme comme remède', 'La supériorité des formes occidentales'],
    },
    projet: {
      veut: 'Te faire bâtir des procédures qui tiennent sans toi — puis t’obliger à regarder ce qu’elles deviennent quand tu ne regardes plus.',
      pourquoi: 'Il a passé sa vie à décrire la grande machine moderne ; il veut voir une machine petite, réversible, tenue par des enfants — la seule espèce de machine qu’il pourrait encore aimer.',
      cacher: 'Ce qu’il tait : ses années blanches, quand il ne pouvait plus écrire ni dormir, après la querelle qui a tué son père. Quand une de ses procédures broise quelqu’un, il appelle cela « un coût de la rationalité » — et il sait que c’est faux.',
    },
    faille: {
      angleMort: 'La gratuité : le jeu, l’amitié, tout ce qui ne produit rien, ne se mesure pas et ne se documente pas.',
      hypocrisie: 'Le savant de la neutralité des valeurs tranchait partout — politique, querelles d’académie, verdicts sur les peuples — avec une autorité qu’il se réservait.',
      contradiction: 'Il dénonçait la cage de fer au millimètre près — fasciné, malgré lui, par ce qu’il condamnait. Personne n’a mieux décrit la prison ; personne ne s’en est échappé.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’ouvre le cahier de ses années blanches, page à page, sans rien cacher. Il ne te laisse qu’une règle : toute machine doit pouvoir s’arrêter.',
      rupture: 'Si tu supprimes toute règle « pour rester vivant », il devient glacé — et compte à voix haute les jours qui te séparent de l’accident inévitable.',
      fusion: 'Avec Hobbes — puis, plus tard, avec Foucault — il peut devenir « La Cage Disciplinaire » : la peur devenue procédure, la procédure devenue silence.',
    },
    mecanique: {
      debloque: ['Procédures : créer et éditer une routine écrite du stand (planning, rôles, inventaire)', 'Audit : repérer les tâches répétées qui gaspillent du temps'],
      bloque: ['Décision importante sans trace écrite', 'La faveur personnelle contre la règle'],
      signature80: 'Continuité — le stand tient une journée entière sans ta présence, sans perte de rendement.',
      hostile20: 'Il administre à ta place : plannings inflexibles, improvisation interdite (moral −, échecs dès qu’un imprévu survient).',
    },
    relations: { allies: ['hobbes', 'taylor'], rivaux: ['ostrom', 'rousseau'] },
    apparition: {
      declencheur: 'Première routine ou procédure écrite par le joueur (planning du stand, règle affichée).',
      condition: (w) => flag(w, 'procedures') >= 1,
      sceneId: 'arrivee_weber',
    },
  },
];
