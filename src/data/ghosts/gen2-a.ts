/**
 * Génération 2 (a) — penseurs modernes critiques. Fiches compactes (même contrat
 * GhostDef, gabarit registry.ts). Règles §4 : chacun a raison ≥ 1 fois, tort ≥ 1 fois,
 * peut mentir (où le trouver : sujetsExageres + projet.cacher) et peut souffrir.
 * Ohno : le flux, le juste-à-temps, les gaspillages. Dejours : la souffrance au travail.
 * Graeber : les boulots de con, la dette. Zuboff : le capitalisme de surveillance.
 */
import type { GhostDef, WorldState } from '../../core/types';

const flag = (w: WorldState, id: string) => w.flags[id] ?? 0;

/** G2 (a) : ohno, dejours, graeber, zuboff. */
export const GHOST_DEFS: GhostDef[] = [
  {
    id: 'ohno', name: 'Taiichi Ohno', era: '1912-1990 · Système de production Toyota',
    generation: 2, color: '#2fb8c6', emoji: '🔄',
    identity: {
      portrait: 'Voix sèche, rapide, qui ne pose que des questions. Il regarde tes mains, pas ton visage. Satisfait ou silencieux — jamais flatteur.',
      life: 'Ingénieur chez Toyota après la guerre : kanban, juste-à-temps, chasse aux gaspillages (Le Système de Production Toyota, 1978). Inspiré par les supermarchés américains : produire ce qui est tiré par la demande, jamais ce qui est poussé.',
      became: 'Pour toi, il est la voix qui voit ton stand comme un flux : chaque attente, chaque stock mort lui saute aux yeux.',
    },
    voice: {
      favorable: 'Bien. Montre-moi ta file. Trois clients ont attendu, deux gestes ne servent à rien. Tu supprimes une attente avant la prochaine session. Vas-y.',
      neutre: 'Pourquoi ? Pourquoi ? Encore pourquoi ? Voilà — la vraie cause nest jamais la première réponse. Retourne au stand. Regarde.',
      hostile: 'Tu confonds occupé et utile. Tu produis sans commande, tu entasses des cartons « au cas où », tu te croies indispensable. Chez moi, on avait un mot pour tout ça : gaspillage.',
      victoire: 'Un seul réappro sur la demande réelle, et plus rien ne dort sur les étagères. Tu as gagné du temps sans courir plus vite. Cest tout le système. Rien dautre.',
      echec: 'Flux tendu, zéro réserve… et une file denfants devant un stand vide, sous la pluie. Jai fait sécher des usines entières avec cette idée. Retiens le coût.',
      tics: ['« Va voir » — jamais de rapport, toujours le terrain (genchi genbutsu)', 'Les cinq pourquoi de suite, même pour une bagatelle', 'Il ne dit jamais ton nom : « toi », et il regarde tes mains'],
      sujetsSerieux: ['Le geste de celui qui porte les caisses', 'Les systèmes copiés sans leur esprit', 'La faute davoir voulu sauver lusine à tout prix'],
      sujetsExageres: ['La douceur du flux tendu (« na jamais fait souffrir personne »)', 'Le kanban comme recette universelle', 'Ce que voit vraiment le cercle à la craie'],
    },
    projet: {
      veut: 'Te faire voir le stand comme un flux tiré par la demande : supprimer les gaspillages, tirer, jamais pousser.',
      pourquoi: 'Toyota naissait ruinée, dans un Japon sans capital : il a fallu produire sans rien gâcher. Il veut prouver une dernière fois que la rareté force lintelligence.',
      cacher: 'Que le système est né dun déchirement : en 1950, pour que Toyota vive, près de deux mille ouvriers sont partis après deux mois de grève. Il appelle ça une « réorganisation ». Il nen dort pas mieux.',
    },
    faille: {
      angleMort: 'La marge dimprévu : le juste-à-temps suppose un monde fiable — une pluie, une livraison ratée, et le flux casse net.',
      hypocrisie: 'Lapôtre du respect de lopérateur faisait tenir ses cadres des heures debout dans un cercle tracé à la craie.',
      contradiction: 'Il voulait des ateliers où chacun pense ; il a légué des usines où chacun compte des cartes.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il tavoue le cercle à la craie — et les hommes qui lont détesté. Puis il te demande si ton stand laisse encore penser ceux qui y travaillent.',
      rupture: 'Si tu réduis léquipe à des mains qui comptent des cartons, il se lève : « Tu as pris ma cadence et jeté mon respect. Il ny a plus rien à te dire. »',
      fusion: 'Avec Taylor ou Smith, il peut devenir « Le Flux » — la chaîne tirée par la seule demande.',
    },
    mecanique: {
      debloque: ['Kanban du stand : réapprovisionner sur la demande réelle (fin des achats à laveuglette)', 'Andon : nimporte quel coéquipier peut arrêter la session sans sanction (incident, file tendue)', 'Chasse aux gaspillages : attentes, stocks morts, gestes inutiles — marqués puis supprimés'],
      bloque: ['Produire sans commande (surproduction)', 'Le stock dormant « au cas où »'],
      signature80: 'Kaizen vivant — à chaque fin de session, lamélioration choisie par léquipe sapplique sans coût ni fatigue.',
      hostile20: 'Flux tendu jusquà la casse : ruptures en pleine file, réappro en kanban subi, stress des coéquipiers +.',
    },
    relations: { allies: ['taylor', 'smith'], rivaux: ['marx', 'dejours'] },
    apparition: {
      declencheur: 'Troisième session de vente réussie (compteur `sessionsReussies`).',
      condition: (w) => flag(w, 'sessionsReussies') >= 3,
      sceneId: 'arrivee_ohno',
    },
  },
  {
    id: 'dejours', name: 'Christophe Dejours', era: 'né en 1949 · Psychodynamique du travail · CNAM',
    generation: 2, color: '#5b8fd9', emoji: '🩺',
    identity: {
      portrait: 'Voix basse, lente, dune douceur clinique. Il écoute vraiment, ce qui déstabilise. Jamais de conseil avant davoir fait raconter une journée en détail.',
      life: 'Psychiatre et psychanalyste, professeur au CNAM, fondateur de la psychodynamique du travail : le travail prescrit contre le travail réel, la souffrance du travail empêché. Quarante ans découte des collectifs — et des suicides quand plus personne nécoute.',
      became: 'Pour toi, il est la voix qui demande ce quun coéquipier na pas pu faire bien, plutôt que ce quil na pas fait assez.',
    },
    voice: {
      favorable: 'Tu lui as rendu sa fierté, pas son temps. Le jugement des autres sur le travail bien fait, voilà ce qui remet quelquun debout. Continue — et dis-le devant tout le monde.',
      neutre: 'Raconte-moi sa journée. Pas son moral : sa journée. Ce quil a fait qui nétait pas prévu. Cest là, dans le travail réel, que vit ce que tu cherches.',
      hostile: 'Tu as mis des chiffres à sa place. Un stress mesuré, un moral noté, une phrase de prévention. Tu gères sa souffrance comme une rupture de stock. Cest pire que de lignorer.',
      victoire: 'Espace de discussion, une fois par semaine, sur ce qui empêche de bien travailler : le moral remonte sans un euro dépensé. La parole, parfois, produit plus que la cadence.',
      echec: 'Vous avez parlé, certains ont pleuré, rien na changé lundi. La parole sans pouvoir corrige peu. Jai mis des années à admettre combien peu.',
      tics: ['« Le travail prescrit, le travail réel » — la distinction sort à chaque phrase', 'Il demande « raconte » avant tout avis', 'Jamais « le coéquipier » : toujours le prénom'],
      sujetsSerieux: ['Le suicide au travail', 'Le mépris du travail bien fait', 'Les défenses collectives qui rient pour ne pas voir'],
      sujetsExageres: ['La souffrance comme seule clef de lecture du travail', 'Lefficacité des cercles de parole (« le temps fera le reste »)', 'Lunité des collectifs face à la hiérarchie'],
    },
    projet: {
      veut: 'Te faire distinguer le prescrit du réel — et bâtir la reconnaissance (utilité, beauté) qui transforme la souffrance en fierté.',
      pourquoi: 'Il a compris que la souffrance vient du travail empêché, pas du poids : vouloir bien faire et ne pas pouvoir. Ton stand est sa dernière chance de le prouver avant la casse, pas après.',
      cacher: 'Que son écoute sert aussi le rendement : un collectif qui parle se relance plus vite, et les directions la compris avant lui. Il le sait — et il continue quand même.',
    },
    faille: {
      angleMort: 'Le corps : faim, sommeil, pluie. Il cherche une histoire derrière une fatigue qui nest parfois quune fatigue.',
      hypocrisie: 'Le critique du management écoute au CNAM, temple national de la formation des managers.',
      contradiction: 'Il veut rendre le travail aux premiers rangs ; sa clinique se paie en heures de bureau, loin de la caisse.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te confie les dossiers de suicide quil a portés sans pouvoir rien — et sa hantise : servir de décor humain à des directions qui veulent faire tenir debout plus longtemps.',
      rupture: 'Si tu reprends sa parole pour meubler un affichage « bien-être » sans rien changer au travail, il rend son tablier : « Je ne serai pas le psy de façade de ton stand. »',
      fusion: 'Avec Marx, il devient « Le Travail Vivant » — la clinique au chevet de laliénation.',
    },
    mecanique: {
      debloque: ['Espace de discussion du collectif : ce qui empêche le travail bien fait (moral +, conflits −)', 'Lecture du travail réel : lécart entre prescrit et réel révélé sur chaque tâche', 'Reconnaissance donnée devant tous : jugement dutilité et de beauté'],
      bloque: ['Les recadrages publics', 'Lévaluation des coéquipiers par la seule cadence'],
      signature80: 'Prévention clinique — une décompensation est annoncée avant de frapper : le stress dun coéquipier est signalé dès 60.',
      hostile20: 'Séance interminable : chaque incident rouvre une discussion, le rendement senglue, et tout le monde finit en victime.',
    },
    relations: { allies: ['marx'], rivaux: ['taylor', 'ohno'] },
    apparition: {
      declencheur: 'Un coéquipier du stand dépasse 70 de stress.',
      condition: (w) => !!w.project && w.project.members.some((id) => (w.npcs[id]?.stress ?? 0) > 70),
      sceneId: 'arrivee_dejours',
    },
  },
  {
    id: 'graeber', name: 'David Graeber', era: '1961-2020 · Anthropologie · anarchisme',
    generation: 2, color: '#c22f2f', emoji: '✊',
    identity: {
      portrait: 'Voix chaleureuse et expansive, qui rit fort, jure doucement et doute de toute hiérarchie, y compris la sienne. Un anarchiste qui fait la vaisselle.',
      life: 'Anthropologue (Yale, puis LSE). La Dette (2011) : aucune société na commencé au troc — la dette morale fait tenir les mondes. Boulots de con (2018) : une part immense du travail ne fait rien dautre que se perpétuer. Slogan des Indignés : « We are the 99 %. »',
      became: 'Pour toi, il est la voix qui repère la corvée à rien du premier coup — et qui rappelle que le quartier tourne à la dette damitié, pas au livre de comptes.',
    },
    voice: {
      favorable: 'Vous avez supprimé la feuille ? Personne ne la lisait, personne ne la remplissait pour de vrai. Voilà une heure de vie rendue à des gens qui aiment ce stand. Compagnon, ça se fête.',
      neutre: 'Question simple : si cette tâche disparaissait cette nuit, qui sen apercevrait ? Personne ? Alors pourquoi la paies-tu en heures réelles ?',
      hostile: 'Tu viens dinventer un grand chef : quelquun payé pour vérifier que les autres travaillent. Le boulot de con le plus classique du monde. Bravo. Demain, un poste pour remplir la feuille du poste.',
      victoire: 'Un service rendu sans compteur, et le quartier entier vous le rend — en clients, en gardes, en silence. La dette damitié fait tenir plus de monde quun abonnement.',
      echec: 'Sans livre de comptes, chacun se souvient de qui devait quoi : trois disputes en deux jours. La trace écrite, cest la paix. Jécrivais contre la paperasse, pas contre la mémoire. Mea culpa, compagnon.',
      tics: ['« Compagnon » — adresse anarchiste, même en plein clash', 'Sa question-test : « si cette tâche disparaissait cette nuit, qui sen apercevrait ? »', 'Il jure « espèce de bureaucrate ! » avant de rire'],
      sujetsSerieux: ['Les vies usées par des emplois sans objet', 'La paperasse qui tient les pauvres loin de leurs droits', 'Le vrai travail fait par les invisibles pendant que dautres en parlent'],
      sujetsExageres: ['Tout papier serait du vide (même la comptabilité — il sen reprend)', 'Les assemblées de consensus harmonieuses (il ny criait aussi)', 'La dette qui disparaîtrait entre gens qui saimentent'],
    },
    projet: {
      veut: 'Te faire distinguer ce qui fait vivre le stand de ce qui fait seulement tourner la réunion — et traiter le quartier en réseau de dettes damitié, pas en marché.',
      pourquoi: 'Il a consacré sa vie à rendre visibles les boulots qui nexistaient pas pour être faits, et les dettes qui ne sannulent jamais. Ton stand est son plus petit terrain — et peut-être le seul où il gagne.',
      cacher: 'Que Yale lui a refusé sa chaire, et que léconomie académique quil dénonce (postes pour remplir des feuilles, comités pour lire des rapports) la quand même employé vingt ans — où il a bien ri avec ses amis.',
    },
    faille: {
      angleMort: 'La structure : sans règles écrites ni rôles fixes, ce sont toujours les mêmes qui se lèvent. Il la vu dans ses propres assemblées, et il sen veut.',
      hypocrisie: 'Lanarchiste anti-hiérarchie a passé sa vie dans la hiérarchie — prof, chaires, comités — en jurant chaque année que cétait la dernière.',
      contradiction: 'Il croyait la dette une chaîne douce ; sa propre histoire la blessée là où la chaîne serrait.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te raconte sa mère : ouvrière à domicile, sommée par un contrôle social de prouver quelle travaillait vraiment. Le boulot de con nest pas une blague pour lui, jamais.',
      rupture: 'Si tu deviens le grand chef qui délègue tout et ne touche plus au stand, il sen va : « Je ne reste pas décorer ta hiérarchie, compagnon. »',
      fusion: 'Avec Ostrom, il rêve tout haut dune « Commune sans chef » — fusion jamais inscrite au registre, et il le sait : « On verra si le monde la veut. »',
    },
    mecanique: {
      debloque: ['Détecteur de boulots de con : les tâches sans effet réel du stand sont repérées et supprimables', 'Économie du don : rendre service sans compteur (dette damitié du quartier, réputation +)', 'Assemblée de consensus : les décisions collectives se prennent à la Graeber'],
      bloque: ['Les postes de surveillance (vérificateurs sans tâche)', 'Les feuilles remplies pour la feuille'],
      signature80: 'Chasse au vide — chaque jour, il désigne une tâche sans effet réel : la supprimer ne coûte rien.',
      hostile20: 'Bûcher du livre : il prêche de jeter les comptes « parce que personne ne sen souviendra » (mensonge repérable — les disputes de dette reviennent), rivalité des coéquipiers +.',
    },
    relations: { allies: ['ostrom', 'illich'], rivaux: ['weber', 'hobbes'] },
    apparition: {
      declencheur: 'Première corvée absurde inventée ou infligée (compteur `corveesAbsurdes`).',
      condition: (w) => flag(w, 'corveesAbsurdes') >= 1,
      sceneId: 'arrivee_graeber',
    },
  },
  {
    id: 'zuboff', name: 'Shoshana Zuboff', era: 'née en 1951 · Le capitalisme de surveillance',
    generation: 2, color: '#9fb3c8', emoji: '👁️',
    identity: {
      portrait: 'Voix ferme, précise, professeure jusquau bout des ongles. Elle nomme les choses par leurs concepts, comme des accusations. Poliment enragée — toujours.',
      life: 'Professeure émérite de la Harvard Business School. En 1988, elle voit dans lusine informatisée lemancipation et la surveillance se partager le même écran. Trente ans plus tard, Le Capitalisme de surveillance (2019) nomme la machine : lexpérience humaine comme matière première gratuite.',
      became: 'Pour toi, elle est la voix qui demande avant chaque décision : « ces données, où vont-elles, et qui en tire le rendement ? »',
    },
    voice: {
      favorable: 'Tu as refusé de livrer la liste des achats. Regarde ce qui arrive : on vous fait confiance, et la confiance ne se revend pas. Le droit à ton avenir reste le tien. Note-le.',
      neutre: 'La connaissance de tes clients nest pas encore un marché. Mais chaque chiffre conservé sans but est un capital que quelquun dautre veut. Qui ? Voilà la seule question utile.',
      hostile: 'Tu appelles ça « simplifier la vie du quartier ». En 2001, chez les premiers géants, on appelait ça pareil : ils ont trouvé lor dans les poubelles de lintention. Toi, tu leur donnes la poubelle avec un nœud.',
      victoire: 'La fuite a eu lieu chez dautres, pas chez toi. Charte affichée, consentement demandé, fichiers gardés au stand : le quartier a appris que vous savez dire non. La confiance a monté sans un euro dépensé.',
      echec: 'Tu as refusé tout partage, par principe — même à lépicerie, qui commandait juste. Elle a acheté à laveuglette et perdu de largent ; vous avez perdu une alliée. Toute extraction nest pas un pillage. Moi, parfois, je criais trop tôt.',
      tics: ['Elle renomme chaque cas en concept (« du surplus comportemental », « le Grand Autre »)', 'Elle tappelle « jeune entrepreneur » sans ironie — cest ce qui rend ses reproches terribles', 'Elle date tout : « 1988 », « 2001 », « 2019 » comme des pièces à procès'],
      sujetsSerieux: ['Lexpérience humaine vendue sans consentement', 'Le droit à son propre avenir', 'Les gens qui donnent leurs habitudes sans savoir à qui'],
      sujetsExageres: ['Limminence du Grand Autre dès la première feuille de comptage', 'La pureté du temps davant la donnée', 'Lunité du front des victimes (personne ne voudrait jamais rien partager)'],
    },
    projet: {
      veut: 'Te faire voir la donnée comme un capital extorqué — et décider en connaissance de cause de ce qui sort du stand : rien qui ne soit librement consenti et affiché.',
      pourquoi: 'Elle a vu la machine naître deux fois : en 1988 dans lusine, en 2001 dans les poubelles de données des géants. Ton stand est son dernier laboratoire — là où le consentement est encore possible, parce que tout le monde se connaît.',
      cacher: 'Quelle a formé trente ans de gestionnaires à Harvard — lécole des gens qui ont bâti la machine — et que sa conscience la rattrapée tard. Elle nen parle jamais la première.',
    },
    faille: {
      angleMort: 'La petite échelle : six clients quil connaît par leur prénom ne sont pas un profil. Elle voit un marché de lexpérience là où il y a une amitié.',
      hypocrisie: 'Elle dénonce les gestionnaires de lextraction depuis la chaire qui les a formés.',
      contradiction: 'Elle veut interrompre lextraction ; sa critique, elle, a prospéré en best-seller mondial (2019) dans léconomie quelle accuse.',
    },
    arcs: {
      fidelite: 'À loyauté haute, elle te confie 1988 : « Jai vu lécran faire les deux — émanciper et surveiller — et on ma prise pour une inquiète. Trente ans à répéter la même chose. »',
      rupture: 'Si tu revends une seconde fois des données de clients, elle sen va en prophète : « Je ne resterai pas assister à la naissance dun marché de ton avenir. »',
      fusion: 'Avec Illich, elle rêve dune « Convivialité sans capteur » — jamais inscrite au registre, et elle ny tient pas : « Une fusion, cest encore une plateforme. »',
    },
    mecanique: {
      debloque: ['Charte des données du stand : ce qui est collecté, ce qui ne sort jamais — affichée et signée', 'Détection dextraction : toute demande de données (épicerie, drive, collège) annotée de sa destination réelle', 'Préférences des habitués : servis mieux, sans que rien ne quitte le stand'],
      bloque: ['La vente du fichier clients', 'Le ciblage des habitudes sans consentement affiché'],
      signature80: 'Blindage — les données du stand deviennent inviolables (aucune fuite possible) et la confiance du quartier monte.',
      hostile20: 'Prophétie paralysante : elle bloque toute action impliquant une donnée, même utile, et sème la défiance (−confiance du quartier tant quelle parle).',
    },
    relations: { allies: ['illich', 'stiegler'], rivaux: ['smith', 'taylor'] },
    apparition: {
      declencheur: 'Première exploitation des données du stand (compteur `donneesExploitees`).',
      condition: (w) => flag(w, 'donneesExploitees') >= 1,
      sceneId: 'arrivee_zuboff',
    },
  },
];
