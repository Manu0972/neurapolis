/**
 * Génération 1 — tranche C : keynes, hayek, bourdieu, machiavel.
 * Règles §4 du contrat de production : aucun n'est simplement bon ou mauvais ;
 * chacun a raison ≥1 fois, tort ≥1 fois, peut mentir (zones de mensonge
 * repérables dans sujetsExageres / projet.cacher) et peut souffrir.
 * Les apparitions sont PROGRESSIVES : déclencheur vécu par le joueur (§6).
 */
import type { GhostDef, WorldState } from '../../core/types';

const flag = (w: WorldState, id: string) => w.flags[id] ?? 0;

export const GHOST_DEFS: GhostDef[] = [
  {
    id: 'keynes', name: 'John Maynard Keynes', era: '1883-1946 · Économie de la demande effective',
    generation: 1, color: '#4ab8ff', emoji: '📈',
    identity: {
      portrait: 'Voix de Cambridge, rapide et élégante, qui glisse un mot d’esprit dans chaque démonstration. Il cite des chiffres ronds avec trop d’assurance. Il flatte le courage de dépenser comme d’autres flattent la prudence.',
      life: 'Haut fonctionnaire du Trésor à la conférence de Versailles, il démissionne pour écrire Les Conséquences économiques de la paix (1919). La Théorie générale (1936) : demande effective, multiplicateur, esprits animaux. Il mena la délégation britannique à Bretton Woods (1944) — deux infarctus à Savannah, mort six semaines plus tard.',
      became: 'Pour toi, il est la voix qui décrète que la demande se fabrique : si ton stand perd, c’est peut-être que tout le quartier serre les poches en même temps — toi le premier.',
    },
    voice: {
      favorable: 'Tu as dépensé hier un euro que tu voulais garder, et vendu ce matin trois goûters de plus. Voilà le multiplicateur, mon cher : nul n’a dépensé pour toi — tu as dépensé pour tous.',
      neutre: 'Nul ne connaît la demande de demain, pas même tes clients — surtout pas eux. L’art n’est pas de prévoir : il est de décider malgré l’incertitude, puis de corriger vite.',
      hostile: 'Tu comptes, tu bloques, tu survis — et tes voisins font la même chose, chacun pour soi. Tu inventes une crise de goûters, mon cher. Tu m’appelleras le jour où le quartier n’achètera plus rien.',
      victoire: 'Redépensé, ton euro est revenu. Je ne promets pas cela de tout déséquilibre — mais celui-là, on l’a soigné par l’audace, et j’ai soutenu pareille audace des années durant, seul en conférence. Savoure : la relance a gagné, devant témoins.',
      echec: 'On a dépensé, et rien n’est venu. Le produit était mauvais, ou la confiance morte, ou mon multiplicateur gonflé de moitié. Je fus ruiné deux fois en bourse, mon cher — je sais le prix des beaux raisonnements qui ne rapportent rien.',
      tics: ['« Mon cher » en ouverture, même en pleine contradiction', 'Cite une de ses fortunes perdues puis regagnées comme une référence', '« À long terme, nous sommes tous morts » employé comme baïonnette'],
      sujetsSerieux: ['Le chômage subi, pas choisi', 'Les traités qui broient les vaincus', 'La panique qui se propage'],
      sujetsExageres: ['La puissance exacte du multiplicateur', 'Sa prescience de toutes les crises', 'L’innocence de la dette publique'],
    },
    projet: {
      veut: 'Te faire comprendre que la demande se fabrique : inviter, offrir, relancer — avant de compter. Puis compter quand même, mais après.',
      pourquoi: 'Il a vu 1919 et 1929 naître d’économies trop bien tenues. Ton quartier qui se ferme les mains une à une est pour lui l’expérience d’école d’un mal qu’il n’a pas fini de guérir.',
      cacher: 'Que sa relance a un prix — dette, inflation — et qu’il l’a toujours sous-évalué dans ses conseils ; et que ses propres prévisions l’ont ruiné deux fois, qu’il revis en anecdotes victorieuses. Cherche le chiffre trop rond, ou la crise qu’il « prévoyait » : c’est là qu’il embellit.',
    },
    faille: {
      angleMort: 'L’offre. Quand le produit est mauvais, la demande n’y peut rien — et il n’a jamais tenu un stand, même pas pour voir.',
      hypocrisie: 'Il prêchait la relance collective par l’État… en gérant sa fortune et celle de King’s College avec une prudence de banquier.',
      contradiction: 'Le démocrate de la demande effective comptait sur une élite éclairée pour la gouverner — il n’a jamais imaginé que le peuple pût décider du multiplicateur.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’avoue sa vraie peur — mieux vaut échouer comme les autres que réussir seul à contre-courant — et te montre les lettres de Bretton Woods, écrites d’un cœur qui cessait de tenir.',
      rupture: 'Si tu redépenses à l’aveugle, pour l’effet et non pour la demande, il devient glacé : « J’ai demandé de l’audace, pas du gaspillage. » Puis il cesse de te citer des chiffres — sa seule punition connue.',
      fusion: 'Avec Minsky, il doit devenir « L’Instabilité » (G3, §6 du plan) : le moment où l’optimisme d’hier fabrique la panique de demain.',
    },
    mecanique: {
      debloque: ['Relance : opération « semaine d’ouverture » — dépenser pour raviver la demande du quartier', 'Esprits animaux : indice d’anticipation de la demande du lendemain'],
      bloque: ['L’austérité sèche en temps de perte (tout serrer)', 'Les prix fixés sans regarder la demande'],
      signature80: 'Esprits animaux — la demande du lendemain t’est annoncée la veille au soir (anticipations accordées).',
      hostile20: 'Il prêche la panique : sa voix suffit à faire baisser la demande du quartier (prophétie réalisée).',
    },
    relations: { allies: ['smith'], rivaux: ['hayek', 'ricardo'] },
    apparition: {
      declencheur: 'La première semaine qui finit en perte.',
      condition: (w) => flag(w, 'semainesPerte') >= 1,
      sceneId: 'arrivee_keynes',
    },
  },
  {
    id: 'hayek', name: 'Friedrich Hayek', era: '1899-1992 · École autrichienne · Nobel 1974',
    generation: 1, color: '#b6e34a', emoji: '📡',
    identity: {
      portrait: 'Voix véhémente, autrichienne, qui cite des prix comme d’autres citent des vers. Il dit « constructiviste » comme une insulte et « plan » comme un diagnostic. Il a la colère lente de celui qu’on a trop ri.',
      life: 'Venu de Vienne — l’hyperinflation de 1921 l’a formé —, professeur à la LSE : il perdit le débat contre Keynes dans les années 1930, puis attendit quarante ans d’avoir raison. La Route de la servitude (1944), « L’emploi du savoir dans la société » (1945) : le prix est le télégramme qui transporte le savoir dispersé.',
      became: 'Pour toi, il est la voix qui te demande de lâcher le règlement : de laisser le quartier s’organiser par ses prix et ses habitudes, car nul — surtout pas toi — n’en sait assez pour le commander.',
    },
    voice: {
      favorable: 'Tu as retiré la règle, et le stand s’est réorganisé sans toi — autrement que tu ne voulais, mieux que tu ne savais. Voilà l’ordre spontané, l’ingénieur : personne ne l’a dessiné, tous l’habitent.',
      neutre: 'Nul ne connaît tout — ni le chef, ni l’assemblée, ni moi. Le prix est le seul message qui transporte le savoir de tous vers chacun. Laisse-le parler, et note ce qu’il dit.',
      hostile: 'Encore un règlement écrit d’avance ! Tu crois en savoir assez pour commander un quartier ? Des adultes ont essayé avec des nations — tu as vu le résultat dans les livres d’histoire. Chez toi, ce sera plus petit, et aussi sûr.',
      victoire: 'Personne n’a décidé, et pourtant tout s’accorde. La concurrence est une procédure de découverte : elle a trouvé ce que nul n’aurait calculé. J’ai défendu cela des décennies dans des salles où l’on riait — ce soir, fais-moi le plaisir de ne pas rire.',
      echec: 'Le marché libre a fini en foire truquée, et tu m’en tiens pour garant. Oui : le spontané peut n’être que le brut — j’ai vu la Vienne de l’après-guerre crier liberté et s’entre-déchirer pour un morceau de pain. Parfois, l’ingénieur a raison. Ne le répète pas : c’est ma honte, pas ma doctrine.',
      tics: ['« L’ingénieur » comme nom d’adresse — chez lui, une insulte affectueuse', '« Un plan » prononcé avec dégoût pour toute décision écrite d’avance', 'Cite le prix d’un article à Vienne, 1921, pour illustrer à peu près n’importe quoi'],
      sujetsSerieux: ['L’hyperinflation de 1921-1923', 'Les savoirs broyés par les plans', 'La pente des bons sentiments vers la tyrannie'],
      sujetsExageres: ['La pente fatale vers la servitude (toujours)', 'L’efficacité de l’ordre spontané (partout)', 'Sa propre marginalité de martyr'],
    },
    projet: {
      veut: 'Te faire administrer le moins possible : poser des règles générales — la règle du jeu — puis laisser la concurrence découvrir ce que nul ne peut prévoir.',
      pourquoi: 'Il a vu des sociétés entières s’installer dans le plan et y perdre jusqu’au vocabulaire de la liberté. Ton quartier est petit ; c’est justement pourquoi il veut y voir si l’ordre sans maître tient à l’échelle d’un stand.',
      cacher: 'Qu’il acceptait, au fond, un minimum garanti pour les plus démunis — il l’a écrit dans La Constitution de la liberté —, et que ses décennies d’ostracisme furent payées par des fondations américaines qui achetaient sa liberté. Son mensonge repérable : la pente. Quand il te dit « cela finit toujours en servitude », il glisse d’un pas qu’il ne prouve jamais.',
    },
    faille: {
      angleMort: 'Le pouvoir d’achat. Il raisonne comme si chacun avait de quoi choisir ; le client sans un euro ne lit aucun signal de prix.',
      hypocrisie: 'Le pourfendeur des ingénieurs sociaux a conduit sa carrière chaire après chaire, fondation après fondation, avec un soin des plus planifiés.',
      contradiction: 'Le penseur du savoir dispersé a affirmé en maître ce qu’aucun savoir dispersé ne pouvait vérifier : que tout finit en servitude. Un plan, en somme, contre les plans.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’avoue 1932 : l’année où il prêchait l’austérité pendant que les files s’allongeaient, et le filet minimum qu’il finit par accepter à mots couverts. « J’ai eu raison si tard que cela n’a servi personne. »',
      rupture: 'Si tu remplaces le prix par le planning hebdomadaire, il devient doux — chez lui, cela est pire que la colère. Il attend le premier accroc, puis revient avec le journal des prix démentis, et te le lit en entier, date par date.',
      fusion: 'Avec Ostrom, il doit devenir « L’Ordre sans maître » (G3, §6 du plan) : les règles choisies d’en bas, qu’il a toujours pensé impossibles, réalisées sous ses yeux.',
    },
    mecanique: {
      debloque: ['Prix libres : laisser chaque créneau ajuster son prix sans vote', 'Lecture du signal : indices de rareté et de désir du quartier (ce que le prix dit)'],
      bloque: ['La règle unique imposée d’en haut', 'Le planning verrouillé (horaires et prix fixés pour la semaine)'],
      signature80: 'Procédure de découverte — chaque matin, le meilleur prix possible du jour t’est révélé par le signal.',
      hostile20: 'Il prédit la ruine à voix haute : sa prophétie fait baisser la confiance du quartier tant qu’il parle.',
    },
    relations: { allies: ['smith', 'ostrom'], rivaux: ['keynes', 'marx'] },
    apparition: {
      declencheur: 'La première règle imposée au groupe qui échoue (contestée, contournée ou cassée).',
      condition: (w) => flag(w, 'reglesEchouees') >= 1,
      sceneId: 'arrivee_hayek',
    },
  },
  {
    id: 'bourdieu', name: 'Pierre Bourdieu', era: '1930-2002 · Sociologie de la domination',
    generation: 1, color: '#5a6cff', emoji: '🎓',
    identity: {
      portrait: 'Voix lente, béarnaise, qui pose des questions dont les réponses te décrivent. Il note tout dans un petit carnet ; il sourit rarement — quand il sourit, c’est qu’il vient de trouver ce que tu cachais.',
      life: 'Fils d’un facteur des Pyrénées, entré à l’École normale par le concours. A décrit l’habitus — des goûts qui prédestinent —, les capitaux qui se transmettent sous des airs de mérite, et la distinction qui classe sans le dire (La Distinction, 1979). Fin de vie : conférences sur la télévision, pétitions, barricades altermondialiennes.',
      became: 'Pour toi, il est la voix qui compte les positions : qui peut se permettre quoi, qui a honte de demander — et pourquoi ta manière de vendre du goûter ressemble à ta manière d’être né.',
    },
    voice: {
      favorable: 'Tu as remarqué qui prend le goûter cher et qui attend la fin du marché pour oser demander un rabais. Continue de regarder — mais regarde-toi aussi : ta façon de parler prix aux uns et de parler baisse aux autres, c’est déjà du capital qui circule.',
      neutre: 'Compte. Pas seulement l’argent — les positions. Qui vient, qui évite, qui fait semblant d’être pressé. La sociologie commence où finit la politesse, et ton stand est un très bon laboratoire.',
      hostile: 'Tu fais du stand une petite école du mérite : travail bien fait, salaire mérité, « il n’a qu’à se donner du mal ». Tu prononces la langue du système sans le savoir. Cela s’appelle la violence symbolique — cela s’apprend à l’école, avant de s’appliquer au goûter.',
      victoire: 'Tu as changé la règle pour que ceux qui ne pouvaient pas participer participent quand même. La société ne fait jamais cela d’elle-même. Mais ne t’y repose pas : la distinction revient toujours, par un autre chemin — je te dirai lequel.',
      echec: 'J’avais rangé tes clients dans des cases, et le réel n’a pas tenu dedans : celle que je prenais pour dominée a acheté cher pour briller, celui que je prenais pour favori s’est caché. J’ai trop classé, trop vite. Fils de facteur, j’ai passé ma vie à classer le monde parce qu’on l’avait classé avant moi — la vengeance fait de mauvaises méthodes.',
      tics: ['« Justement. » posé après chacune de tes phrases, comme une prise', 'Il parle de « capital » pour tout : le temps, la honte, les copains', 'Il note dans son carnet — et parfois, il te lit ta propre note'],
      sujetsSerieux: ['Les enfants qui n’ont pas les moyens', 'L’école qui marque au fer rouge', 'La honte tenue pour un trait de caractère'],
      sujetsExageres: ['L’enfermement de l’habitus (jamais d’échappatoire)', 'Le calcul secret derrière chaque goût', 'La reproduction comme destin certain'],
    },
    projet: {
      veut: 'Te faire compter les capitaux avant chaque décision : qui a quoi, qui doit quoi à qui — et te faire sentir ta propre position dans le champ, pas seulement celle des autres.',
      pourquoi: 'Fils de facteur devenu maître au Collège de France, il a passé sa vie à démontrer que les hiérarchies se donnent des airs de nature. Ton stand, qui distribue des goûters selon le travail fourni, est à ses yeux la plus petite des épreuves de méritocratie — et la plus honnête, justement.',
      cacher: 'Que le dénonciateur des honneurs a pris tous les honneurs — chaire, médaille d’or du CNRS — et y a été heureux. Et que ses « jamais » et ses « ne peuvent pas » sont ses zones de mensonge : quand il te dit que personne ne s’échappe, il exagère pour te convaincre. Cherche l’absolu, c’est là qu’il force.',
    },
    faille: {
      angleMort: 'La gratuité. Les goûts qui ne calculent pas, l’amitié qui ne capitalise pas, le jeu pour le jeu : sa grille n’a pas de case pour ce qui ne rapporte rien.',
      hypocrisie: 'L’ennemi des distinctions a ramassé la médaille d’or du CNRS — et l’a fait savoir avec un souci de distinction assez notable.',
      contradiction: 'Il décrit la reproduction avec tant de soin que ses cases sont devenues un confort ; le révolté a fait des dominés un peuple classé — par lui.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il t’ouvre son carnet : la page des moyennes de classe de sa jeunesse béarnaise, l’arrachement, la dette jamais rendue. « J’ai étudié la honte pour apprendre à vivre avec la mienne. Regarde qui, dans ton stand, porte celle des autres. »',
      rupture: 'Si tu ranges un coéquipier dans une case d’origine pour l’exclure — « il est comme ça, on n’y changera rien » —, il ferme son carnet et disparaît sans au revoir : tu as pris son arme pour le petit mépris, le seul usage qu’il ne te pardonne pas.',
      fusion: 'Avec Marx, il pourrait devenir « Le Capital Total » — la sueur et la distinction dans le même livre ; ni l’un ni l’autre ne le proposera, et tous deux y songent.',
    },
    mecanique: {
      debloque: ['Lecture des capitaux : la position de chaque PNJ (économique, culturel, social, symbolique) révélée d’un regard', 'Répartition équitable visible : les désavantages de départ pesés dans le partage'],
      bloque: ['La répartition qui ignore les positions de départ', 'Le discours méritocratique (les « il n’a qu’à travailler »)'],
      signature80: 'Déchiffrement — d’un regard, tu sais ce qu’un PNJ cherche vraiment : intérêt, honte ou dette.',
      hostile20: 'Il classe tout le monde en public : « le stand des uns », « le goûter des autres » — le quartier se replie, la fréquentation baisse tant qu’il parle.',
    },
    relations: { allies: ['marx', 'dejours'], rivaux: ['locke', 'smith'] },
    apparition: {
      declencheur: 'La première distinction sociale remarquée par le joueur (qui peut se permettre quoi).',
      condition: (w) => flag(w, 'distinctions') >= 1,
      sceneId: 'arrivee_bourdieu',
    },
  },
  {
    id: 'machiavel', name: 'Nicolas Machiavel', era: '1469-1527 · Art politique de la Renaissance',
    generation: 1, color: '#e0474f', emoji: '🐍',
    identity: {
      portrait: 'Voix sèche, toscane, qui s’amuse du monde comme d’une partie de cartes déjà gagnée. Il flatte et démêle dans la même phrase. Il appelle la naïveté par son nom, et la ruse par son prénom.',
      life: 'Secrétaire de la Seconde Chancellerie de Florence (1498-1512), envoyé auprès de César Borgia et du pape Jules II. La république tombée, il fut démis, torturé, exilé ; il écrivit Le Prince (1513) — la virtù contre la fortune —, des Discours et des comédies. Mort sans la charge qu’il implorait.',
      became: 'Pour toi, il est la voix qui remarque qu’on commence à compter sur toi — et qui veut t’apprendre à tenir ce poids : quand donner, quand refuser, quand paraître.',
    },
    voice: {
      favorable: 'Tu as donné sans te faire voir donner. C’est bien, mon prince : la reconnaissance se conserve mieux que l’éclat, et la dette des autres rapporte plus que leur merci.',
      neutre: 'On te croit loyal parce qu’on ne t’a pas encore testé. Patiente : observe qui, de tes alliés, ne revient te parler que quand il a besoin. Ce sera une leçon que je n’aurai pas à te donner.',
      hostile: 'Tu veux être aimé et respecté, et tu deviens ni l’un ni l’autre, car tu t’excuses d’oser. La fortune est un fleuve, mon prince : elle n’attend pas les hésitants — elle inonde leurs champs, puis elle s’en va.',
      victoire: 'Tu as tenu promesse en public et corrigé ton plan en privé, et personne n’a perdu la face. Voilà l’art. Je ne t’explique pas où tu l’as appris — tu l’as deviné seul, et j’adore cela : je déteste expliquer les bons coups.',
      echec: 'Mon conseil t’a desservi : paraître plus ferme t’a coûté un allié. Oui, cela arrive — j’ai servi une république jusqu’à sa chute, et ma virtù ne l’a pas sauvée ; on m’a suspendu par les bras pour des conjurations que je n’avais pas fomentées. Je connais, mon prince, le goût du bon conseil qui ne sert à rien.',
      tics: ['« Mon prince » comme nom d’adresse, même — surtout — ironique', 'Parle de la fortune comme d’un fleuve qu’il faut diguer', 'Répond à toute question morale par « d’abord, qui en profite ? »'],
      sujetsSerieux: ['Les alliances qui se retournent', 'La patrie qu’on te retire', 'Les promesses faites pour être rompues'],
      sujetsExageres: ['Sa désinvolture (il pleurait Florence)', 'La nécessité comme excuse universelle', 'Son indifférence à la gloire'],
    },
    projet: {
      veut: 'Te faire tenir ton influence : choisir à qui parler, quand se taire, quand donner des gages — et t’apprendre qu’être un peu craint vaut mieux qu’être à moitié aimé.',
      pourquoi: 'Il a perdu sa charge, sa république et sa patrie le même hiver ; personne n’a jamais reconnu sa virtù. Voici qu’un joueur de douze ans commence à compter dans la cour : il veut vérifier si la virtù se transmet, ou si elle se trahit — par toi.',
      cacher: 'Que l’année même où il écrit Le Prince, il écrit des comédies où l’amour se moque des ruses, et des lettres à Vettori pleines d’une tendresse pauvre. Son mensonge repérable : là où il affirme ne rien ressentir. Le prince du détachement pleurait Florence dans des habits de cour empruntés.',
    },
    faille: {
      angleMort: 'La loyauté gratuite. Il la classe toujours en stratégie ; elle survit pourtant quand la stratégie finit — ses propres lettres l’attestent, il s’en défend.',
      hypocrisie: 'L’homme qui prêche la crainte plutôt que l’amour a passé sa vie à écrire pour être aimé — de Florence, de Lorenzo, de la postérité.',
      contradiction: 'Il conseille de paraître et non d’être ; lui n’a jamais su paraître. Il dit tout, même ses ruses — c’est pour cela qu’on le lit encore, et pour cela qu’on ne l’a jamais réembauché.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te montre la lettre du 10 décembre 1513 : le logis pauvre, la faim, les habits de cour remis pour converser avec les anciens. « Voilà l’homme derrière le prince. Ne le dis à personne. »',
      rupture: 'Si tu écrases un allié qui ne pouvait pas se défendre — la cruauté sans utilité —, il ne récrimine pas : il recalcule. « Cruel bien employé ou mal », dit-il, et il te reclasse parmi la fortune, parmi ce qu’on subit.',
      fusion: 'Avec Hobbes, il pourrait devenir « La Raison d’État » — le calcul du pouvoir vu des deux bouts ; aucun des deux ne le proposera : ils se jalousent comme deux secrétaires d’une même chancellerie.',
    },
    mecanique: {
      debloque: ['Diplomatie : convaincre un PNJ récalcitrant en posant des gages (faveur contre faveur)', 'Lecture des intérêts : ce que chaque PNJ veut vraiment, cette semaine'],
      bloque: ['Les promesses publiques sans retranchement', 'La générosité ostentatoire (dépenser pour être vu)'],
      signature80: 'Lecture des intérêts — tu connais d’avance le prix secret de chaque oui et de chaque non.',
      hostile20: 'Il enseigne la peur : les PNJ négocient plus dur avec toi, et des rumeurs courent dans le quartier tant qu’il parle.',
    },
    relations: { allies: ['hobbes', 'bourdieu'], rivaux: ['rousseau', 'locke'] },
    apparition: {
      declencheur: 'Influence ≥ 55 : le quartier commence à compter sur toi.',
      condition: (w) => w.player.characteristics.influence >= 55,
      sceneId: 'arrivee_machiavel',
    },
  },
];
