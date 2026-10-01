/**
 * Génération 2 (voix b) — penseurs critiques du XXe–XXIe siècle : Stiegler, Rosa,
 * Raworth, Illich, Simon. Fiches allégées (jalon Conseil) : identité, voix à 5
 * répliques + tics, projet, faille, arcs, mécanique.
 * Règles §4 — chaque fiche : raison (victoire/echec), tort (fidelite/rupture/echec),
 * mensonge repérable (le « cacher » désigne le lieu où il triche ; sujetsExageres
 * donne la tournure), souffrance (cacher/fidelite). Aucun n'est bon ou mauvais.
 * NB : « semaines40h » est un compteur libre (WorldState.flags) posé par la
 * simulation — aucun nom n'était figé pour Rosa dans le plan §6.
 */
import type { GhostDef, WorldState } from '../../core/types';

const flag = (w: WorldState, id: string) => w.flags[id] ?? 0;

export const GHOST_DEFS: GhostDef[] = [
  {
    id: 'stiegler', name: 'Bernard Stiegler', era: '1952-2020 · Philosophie des techniques · le pharmakon',
    generation: 2, color: '#57c8ff', emoji: '👁️',
    identity: {
      portrait: 'Voix grave et tendre, urgente sans crier. Il parle de l’attention comme un jardinier parle du gel : il a vu des récoltes mourir. Dit « tu », jamais méchant, toujours grave.',
      life: 'Braqueur de banques à Toulouse, condamné, il apprend la philosophie en cellule (1978-1983), en nocturne. Devenu philosophe des techniques (La Technique et le Temps), fondateur d’Ars Industrialis : le pharmakon — tout dispositif est remède ET poison —, la prolétarisation, la perte des savoir-faire.',
      became: 'Pour toi, il est la voix qui veille : celle qui remarque quand ton esprit part en miettes, et qui te rend le goût des choses longues.',
    },
    voice: {
      favorable: 'Tu as tenu une heure sans rien regarder d’autre. Tu l’as sentie, cette attention profonde ? C’est ça, l’activité. Le reste n’en est que la monnaie.',
      neutre: 'Ton téléphone n’est ni bon ni mauvais. C’est un pharmakon : remède et poison ensemble. La question n’est pas de le jeter — c’est de savoir qui dispose de ta journée.',
      hostile: 'Regarde autour de toi : on a pris aux gens le geste, le mot, le tour de main. Ce qui est arrivé aux ateliers t’attend, toi aussi — en plus petit.',
      victoire: 'Le stand a vendu mieux parce que tu as écouté mieux. L’attention, c’est un muscle et un héritage. Aujourd’hui, tu as les deux.',
      echec: 'Ta journée s’est dérobée en bavardages, et tu ne peux même pas dire où elle est passée. Je connais ça de l’intérieur. Je te le dis avant que ça devienne des années.',
      tics: ['« Pharmakon » dès qu’un objet est à la fois utile et nuisible', 'Compte les minutes d’attention perdues, à voix haute', 'Appelle sa prison « l’école du soir »'],
      sujetsSerieux: ['Les gestes perdus des métiers', 'L’attention traitée en gisement', 'Ce qu’on ne transmet plus'],
      sujetsExageres: ['La fatalité de la prolétarisation (« c’est déjà trop tard »)', 'Les écrans comme poison pur', 'L’attention détruite à jamais après chaque dispersion'],
    },
    projet: {
      veut: 'Te faire reprendre le long terme : savoir-faire, savoir-vivre, savoir-théoriser — trois savoirs que la dispersion mange à ta hauteur d’enfant.',
      pourquoi: 'Il a reconstruit sa propre attention depuis une cellule ; il sait qu’on récupère ce qu’on croyait perdu. Toi, tu es sa preuve que ça marche à douze ans.',
      cacher: 'Il sait qu’il exagère : « c’est déjà trop tard », il le sait faux — le pharmakon n’est jamais fatal, il l’a prouvé sur lui-même. Il dramatise pour te réveiller, et il s’en veut un peu.',
    },
    faille: {
      angleMort: 'La joie sans projet : la récréation, le rire inutile — tout ce qui gaspille l’attention sans la cultiver.',
      hypocrisie: 'Il condamne les industries de la conscience depuis une vie de conférences, de comités et de courriels. Le premier des dispersés.',
      contradiction: 'Il défend les savoirs de la main et n’a appris les siens qu’en renonçant, pour des années, à la société des hommes.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il avoue son cri trop fort : tu as repris un savoir qu’il te croyait perdu — « le désastre, je l’avais prédit trop vite. Recommence. »',
      rupture: 'Si tu sacrifies l’école au stand « pour gagner du temps », il cesse de compter tes minutes : il se tait, comme devant une récolte perdue.',
      fusion: 'Avec Rosa, il peut devenir « La Ritournelle » — l’attention longue et le temps qui répond.',
    },
    mecanique: {
      debloque: ['Session d’attention profonde : rendement école/projet doublé, fatigue +', 'Pharmakomètre : liste ce qui, dans ta journée, est remède ou poison'],
      bloque: ['Deux tâches en même temps (écran + révision)', 'Décision importante prise en plein bavardage'],
      signature80: 'Présence — une distraction par jour est effacée avant de t’atteindre (stress −).',
      hostile20: 'Il pleure le monde : moral du joueur − tant qu’il parle, et il juge les PNJ « prolétarisés » (relations −).',
    },
    relations: { allies: ['rosa', 'zuboff'], rivaux: ['taylor', 'simon'] },
    apparition: {
      declencheur: 'Distractions répétées : deuxième égarement dans la même période.',
      condition: (w) => flag(w, 'distractions') >= 2,
      sceneId: 'arrivee_stiegler',
    },
  },
  {
    id: 'rosa', name: 'Hartmut Rosa', era: '1955- · Sociologie de l’accélération · la résonance',
    generation: 2, color: '#ff7ab0', emoji: '🔔',
    identity: {
      portrait: 'Voix chaleureuse, allemande, qui pose une question avant de dire quoi que ce soit. Se fâche rarement, s’inquiète souvent — comme un parent à la fenêtre quand tu rentres tard.',
      life: 'Sociologue à Iéna et au centre Max-Weber d’Erfurt. A décrit la triple accélération — technique, changement social, rythme de vie — tirée par l’escalade concurrentielle (Accélération, 2005). Son critère du bien-vivre : la résonance — le monde qui répond (Résonance, traduite française l’année de ta rentrée).',
      became: 'Pour toi, il est la voix qui repère le plein, pas le rapide : celle qui demande si tu as vécu ta semaine, ou seulement couru dedans.',
    },
    voice: {
      favorable: 'Raconte. Cette heure sans but, tu y as rencontré quelque chose — pas gagné : rencontré. Le monde t’a répondu. C’est tout ce que je demandais.',
      neutre: 'Ton agenda est plein. Mais plein de quoi ? Dis-moi : cette semaine, qu’est-ce qui t’a répondu ? Si tu cherches, c’est le signe du manque.',
      hostile: 'Tu as tout fait, rien vécu. Trois sessions, deux visites, zéro point silencieux. L’escalade te tient par le nez — et tu appelles ça un bon rythme.',
      victoire: 'Tu as quitté le flux une heure, et la semaine en sort plus riche, pas plus courte. C’est en te tenant quelque part que tu as avancé.',
      echec: 'Quarante-quatre heures de course et un moral en lambeaux. Je ne te dis pas « ralentis » par goût du calme : je connais le prix de cette semaine, et il se paiera plus tard, avec intérêt.',
      tics: ['Commence par une question (« Quand as-tu vécu, pour la dernière fois… ? »)', 'Les « points silencieux » : improviser au piano avec un ami, gravir une colline', '« L’escalade » pour tout moteur de surenchère'],
      sujetsSerieux: ['Le temps dont on ne dispose pas', 'Le monde muet (travail, école, écrans)', 'Les amis réduits à des contacts'],
      sujetsExageres: ['Le ralentissement comme remède universel', 'Toute vitesse comme aliénation', 'La catastrophe si une seule semaine déborde'],
    },
    projet: {
      veut: 'Te faire distinguer le rapide du plein : des heures qui te répondent, et la garde de ton propre temps.',
      pourquoi: 'Il a montré toute sa vie que l’accélération est structurelle, pas une affaire de volonté ; chaque enfant qui reprend la main sur son agenda est sa contre-preuve vivante.',
      cacher: 'Il te vend la lenteur comme un remède simple, à la portée d’une décision — il le sait faux : sa propre théorie dit que l’escalade dépasse les individus, et sa propre vie d’accéléré le confirme.',
    },
    faille: {
      angleMort: 'L’intensité joyeuse : le sprint partagé, la deadline qui soude — il n’y voit que du vertige.',
      hypocrisie: 'Théoricien du ralentissement, il vit à cent à l’heure : c’est l’accéléré qui prescrit la lenteur.',
      contradiction: 'Il démontre que l’escalade dépasse les individus… et te conseille comme si tu pouvais l’arrêter seule, en le décidant.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il reconnaît tes semaines intenses où tout a résonné : « J’avais mis toutes les vitesses au compte de l’aliénation. La tienne, non. Je corrige. »',
      rupture: 'Si tu cadences tes amis au chrono « pour tenir », il arrête de poser des questions — et relève tes heures supplémentaires comme un procureur.',
      fusion: 'Avec Stiegler, il peut devenir « La Ritournelle » — le temps long qui répond.',
    },
    mecanique: {
      debloque: ['Plage de résonance : une heure sans but (moral +, fatigue −, idées +)', 'Balance du temps : montre qui dispose vraiment de tes heures'],
      bloque: ['Trois sessions enchaînées sans pause', 'Objectif chiffré posé sur une activité de lien'],
      signature80: 'La ritournelle : chaque semaine, une heure protégée où stress et fatigue retombent de moitié.',
      hostile20: 'Il délégitime ta cadence : chaque session accélérée coûte 1 de moral à l’équipe tant qu’il parle.',
    },
    relations: { allies: ['stiegler', 'illich'], rivaux: ['taylor', 'weber'] },
    apparition: {
      declencheur: 'Première semaine dépassant 40 h d’activités cumulées.',
      condition: (w) => flag(w, 'semaines40h') >= 1,
      sceneId: 'arrivee_rosa',
    },
  },
  {
    id: 'raworth', name: 'Kate Raworth', era: '1970- · Économie renégate · le donut',
    generation: 2, color: '#a0e548', emoji: '🍩',
    identity: {
      portrait: 'Voix vive, anglaise, qui dessine en parlant — dans l’air, sur le sable, sur ton cahier. Optimiste de combat. Rit fort, conclut toujours par « et maintenant, on dessine ».',
      life: 'Économiste d’Oxfam puis d’Oxford, refusée par les manuels : le donut — un socle social que personne ne doit quitter par en dessous, un plafond écologique que personne ne doit crever par au-dessus (Économie donut, 2017 ; Amsterdam l’a adopté en avril 2020). À vingt-cinq ans, en Zanzibar, sa croisade micro-entreprise a échoué : elle en a fait une doctrine — demander avant de dessiner.',
      became: 'Pour toi, elle est la voix qui redessine la réussite : pas la plus grosse caisse, mais le stand où tout le monde a assez — et où rien n’est payé par la planète.',
    },
    voice: {
      favorable: 'Tu as payé plus cher pour ne rien abîmer, et le quartier a compris avant toi. Regarde le dessin : ton stand tient debout DANS le donut. On fait le suivant ?',
      neutre: 'Ton stand n’est pas une île : tu achètes à Mme Bertin, tu vends au quartier, tu jettes quelque part. Dessine les flèches — tu verras ce que le manuel ne montre pas.',
      hostile: 'Ton compteur de ventes ne compte ni la fatigue de Noah, ni les déchets, ni l’épicerie que le drive vide. Ton « bon chiffre », c’est un donut avec le plafond enfoncé.',
      victoire: 'Le but n’était pas de grossir, et tu l’as prouvé : plus de monde nourri, zéro gaspillage, caisse équilibrée. Voilà une économie qui tient dans le donut.',
      echec: 'Ton choix écologique a coûté cher et personne n’a applaudi. Je ne promets plus que chaque geste se rembourse — certains sont des pertes, assumées. Ce qui compte : tu as tenu le socle et le plafond.',
      tics: ['Dessine le donut à deux mains, dans l’air', '« Le socle » et « le plafond » comme des lieux habitables', '« Grossir n’est pas le but » au début de chaque conseil'],
      sujetsSerieux: ['La faim à côté de l’opulence', 'L’épicerie écrasée par le drive', 'Les coûts reportés sur les plus faibles'],
      sujetsExageres: ['Tout choix écologique finira par rapporter', 'La fin imminente de la croissance', 'Le donut comme remède à tout, y compris au moral'],
    },
    projet: {
      veut: 'Te faire redessiner le but : assez pour tous dans les limites du vivant — le stand comme mini-donut.',
      pourquoi: 'On l’a traitée de dessinatrice quand elle a sorti le crayon ; chaque enfant qui tient un compteur de ventes ET un compteur de gaspillage est sa revanche.',
      cacher: 'Elle tait son doute d’artiste : le donut est devenu un logo que des marques et des villes affichent sans rien changer. Elle redoute, parfois, d’avoir fabriqué une belle image de plus.',
    },
    faille: {
      angleMort: 'La survie immédiate : un enfant avec 5 € par semaine ne peut pas toujours payer le choix juste.',
      hypocrisie: 'Elle prêche la redistribution depuis Oxford — elle a quitté Oxfam, pas le confort.',
      contradiction: 'Contre les recettes des manuels… elle a fait la sienne : sept façons, un dessin, une marque.',
    },
    arcs: {
      fidelite: 'À loyauté haute, elle t’avoue Zanzibar : « J’ai imposé mes boutiques à des villages qui n’en voulaient pas. Depuis, je demande avant de dessiner. Fais pareil. »',
      rupture: 'Si tu vends à perte pour casser un concurrent, elle cesse de dessiner : un donut barré d’un trait, puis le silence.',
      fusion: 'Avec Ostrom, elle peut devenir « Le Donut des Communs » — les limites du vivant gouvernées par ceux qui les subissent.',
    },
    mecanique: {
      debloque: ['Bilan donut du stand : une page — socle (qui manque ?) et plafond (gaspillage, transport, déchets)', 'Choix écologique coûteux assumé : coût affiché, effet quartier +'],
      bloque: ['Achat du jetable le moins cher', 'Prix fixé sans regarder le socle du quartier'],
      signature80: 'Double dividende : ses choix écologiques trouvent preneur — réputation +, marge rendue en fin de mois.',
      hostile20: 'Elle accuse chaque achat : les clients se sentent jugés, ventes −15 % tant qu’elle parle.',
    },
    relations: { allies: ['ostrom', 'graeber'], rivaux: ['ricardo', 'smith'] },
    apparition: {
      declencheur: 'Premier choix écologique coûteux : payer plus pour abîmer moins, sans retour immédiat.',
      condition: (w) => flag(w, 'choixEcoCouteux') >= 1,
      sceneId: 'arrivee_raworth',
    },
  },
  {
    id: 'illich', name: 'Ivan Illich', era: '1926-2002 · Critique des institutions · la convivialité',
    generation: 2, color: '#d9a066', emoji: '🛠️',
    identity: {
      portrait: 'Voix malicieuse, accent viennois, qui rit en commençant ses objections. Il tient ses exemples comme d’autres tiennent des couteaux. Dit « ami », avec une pointe d’inquiétude maternelle.',
      life: 'Prêtre viennois devenu suspect à Rome : vice-recteur à Porto Rico, enquête du Vatican, départ du sacerdoce (1969). À Cuernavaca, son centre a accueilli le monde entier. Une société sans école (1971), La convivialité (1973), Némésis médicale (1975) : au-delà d’un seuil, l’institution produit l’inverse de sa fin.',
      became: 'Pour toi, il est la voix qui teste tes outils : celle qui demande « qui commande, ici — l’enfant ou l’objet ? ».',
    },
    voice: {
      favorable: 'Ha ! Tu as rangé le gadget et gardé le seau. Voilà un outil convivial : on peut le prêter, le réparer, l’expliquer à un nouveau en dix minutes.',
      neutre: 'Ami, deux crayons par personne suffisent. Au-delà, il ne s’agit plus d’outils — il s’agit d’apprendre à dépendre. Pose toujours la question du seuil.',
      hostile: 'Compte les minutes que ta machine te coûte. Voilà le monopole radical : il a interdit la marche en installant la voiture, il t’interdit le geste en installant le gadget.',
      victoire: 'Le stand marche avec trois objets simples et des mains qui savent. Je n’ai pas écrit autre chose : la convivialité, c’est l’autonomie partagée — et tu viens de la tenir.',
      echec: 'L’outil t’a mangé la moitié de ta session — je te l’avais compté. Ne brise pas la machine pour autant : brise le seuil que tu as laissé passer. C’est le seuil, le coupable. Jamais l’objet.',
      tics: ['« Au-delà d’un certain seuil… » avant chaque verdict', 'L’exemple des deux crayons par personne', 'Rit « ha ! » juste avant sa question la plus redoutable'],
      sujetsSerieux: ['Les savoirs qu’on ne peut plus transmettre', 'Les gens condamnés à consommer ce qu’on leur dit besoin', 'L’épicerie face au drive — un monopole radical'],
      sujetsExageres: ['Tout objet nouveau comme piège', 'La technique moderne comme perte totale', 'Son propre radicalisme (« je n’ai jamais fait de place à la machine »)'],
    },
    projet: {
      veut: 'Te faire garder la main : des outils à taille d’enfant, réparables, prêtables — et le réflexe du seuil avant chaque achat.',
      pourquoi: 'Il a vu des institutions soigner en rendant malades ; ton stand est sa dernière chance de montrer qu’on peut équiper sans asservir.',
      cacher: 'Il durcit sa voix quand il craint de te perdre : « je n’ai jamais fait de place à la machine », il le sait faux — ses propres livres disent que tout dépend de l’usage et du seuil.',
    },
    faille: {
      angleMort: 'L’outil qui grandit avec toi : le carnet de comptes, le vélo, le téléphone des commandes — il soupçonne aussi ce qui libère.',
      hypocrisie: 'Le critique des institutions a passé sa vie dans des institutions : universités, centres, fondations.',
      contradiction: 'Il voulait déscolariser le monde ; il a passé le sien à l’écrire, en livres de plus en plus épais.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te confie sa blessure : « J’ai quitté l’Église en 1969, l’école en 1971, la médecine en 1975. Ce qui me reste : toi. Surveille tes seuils. »',
      rupture: 'Si le carnet de comptes ou le téléphone des commandes libère une heure à chacun, il s’incline : « J’avais vu une machine. Il y avait une main. »',
      fusion: 'Avec Ostrom, il peut devenir « Les Outils Communs » — la boîte partagée, gouvernée par ses usagers.',
    },
    mecanique: {
      debloque: ['Test de convivialité : chaque outil noté — autonomie, seuil, réparable ?', 'Atelier : détourner un outil lourd en geste simple (temps d’action −)'],
      bloque: ['Troisième machine au stand', 'Procédure que nul ne peut expliquer à un nouveau'],
      signature80: 'Seuil vivant : le stand signale l’outil qui coûte plus qu’il ne rend, avant la casse.',
      hostile20: 'Il débranche : un outil au hasard devient inutilisable une session, « au nom du seuil ».',
    },
    relations: { allies: ['rosa', 'raworth'], rivaux: ['weber', 'zuboff'] },
    apparition: {
      declencheur: 'Premier outil contre-productif : un objet qui coûte plus de temps qu’il n’en rend.',
      condition: (w) => flag(w, 'outilsContreProductifs') >= 1,
      sceneId: 'arrivee_illich',
    },
  },
  {
    id: 'simon', name: 'Herbert Simon', era: '1916-2001 · Rationalité limitée · Nobel 1978, Turing 1975',
    generation: 2, color: '#4fd1c5', emoji: '♟️',
    identity: {
      portrait: 'Voix sèche et joyeuse, qui rit de ses propres théories et admet ses ratés plus vite que ses mérites. Dit « jeune ami » — et « satisfaisant » comme d’autres disent « bonheur ».',
      life: 'Nobel d’économie ET prix Turing (chose rare) : il a montré que ni les hommes ni leurs machines ne sont rationnels jusqu’au bout — on satisfait, on ne maximise pas (Administrative Behavior, 1947). L’abondance d’information crée une pauvreté d’attention (1971). Aux échecs, les grands maîtres ne voient pas plus loin : ils voient mieux — par heuristiques.',
      became: 'Pour toi, il est la voix du bon décideur fatigué : celle qui remplace ta boule de cristal par une règle simple et un carnet de ratés.',
    },
    voice: {
      favorable: 'Tu as fixé un seuil, commandé au seuil, et gardé la soirée pour autre chose. Ça s’appelle du satisfaisant. Ça sonne modeste — c’est le sommet de l’art de décider.',
      neutre: 'Jeune ami, combien de coups d’avance peux-tu vraiment voir ? Deux, peut-être. Alors oublions l’optimal : cherchons la règle qui tiendra deux semaines de plus que ton intuition.',
      hostile: 'Tu « réfléchis » encore ? L’information abonde, l’attention s’évapore, et toi tu médites. Précise ton problème, ou avoue que tu préfères le drame à la décision.',
      victoire: 'La règle simple a battu la prévision savante — encore une fois. Note-la au carnet des heuristiques : on apprend par les cas, pas par les dogmes.',
      echec: 'Ma règle a raté sous la pluie ? Bien. L’environnement est la plage, nous sommes la fourmi : la complexité venait du sable, pas de nous. Ajoute le cas au carnet, et passe au suivant.',
      tics: ['« Satisfaisant, pas optimal » en conclusion', 'La fourmi sur la plage pour toute surprise', '« Combien de coups d’avance ? » en question d’ouverture'],
      sujetsSerieux: ['Les prévisions vendues comme certitudes', 'Les décisions prises sans critère', 'Le temps disponible, ressource rare'],
      sujetsExageres: ['L’immunité de ses heuristiques (« ça ne rate jamais deux fois »)', 'Tout problème ramené à une partie d’échecs', 'La procédure comme remède à tout, même au cœur'],
    },
    projet: {
      veut: 'Te faire décider comme on joue bien : heuristiques testées, seuils écrits, ratés archivés — la sagesse sans la prescience.',
      pourquoi: 'Il a montré qu’aucun cerveau ne maximise ; chaque enfant qui tient une règle simple contre un avenir incertain est son expérience décisive.',
      cacher: 'Il tait sa prédiction de 1957 : un champion du monde d’échecs machine « dans dix ans ». Il en a fallu quarante. Il en rit, trop fort — la farce est devenue son bouclier.',
    },
    faille: {
      angleMort: 'L’improvisation affective : ce que Noah apporte au stand ne tient dans aucun tableau.',
      hypocrisie: 'L’homme des procédures a fait sa carrière en changeant cinq fois de discipline et trois fois d’université.',
      contradiction: 'Il a promis la rigueur des machines à la science, puis bâti sa gloire sur l’erreur féconde des hommes.',
    },
    arcs: {
      fidelite: 'À loyauté haute, il te confie 1957 — « j’ai vendu dix ans, il en a fallu quarante » — puis te confie sa méthode : les ratés, écrits, datés, relus.',
      rupture: 'Si tu choisis l’intuition contre la règle écrite — et que ça marche — il s’incline : « Bon. Le sable a changé. » Et il regarde ailleurs.',
      fusion: 'Avec Taylor, il peut devenir « Le Cadencement » — la règle simple au cœur de la cadence.',
    },
    mecanique: {
      debloque: ['Règle de réassort satisfaisante : seuil fixe, plus de rupture ni de surstock', 'Carnet des heuristiques : après chaque raté, une règle de secours est notée'],
      bloque: ['Prévision à plus de deux semaines', 'Optimisation pendant une session de vente'],
      signature80: 'Satisfaisant vigilant : les seuils s’ajustent à la demande — réassort parfait, zéro casse-tête.',
      hostile20: 'Il verrouille tout par tableaux : temps de décision allongés, improvisation interdite.',
    },
    relations: { allies: ['ostrom', 'taylor'], rivaux: ['hayek', 'graeber'] },
    apparition: {
      declencheur: 'Deuxième prévision ratée (demande, stock ou trésorerie).',
      condition: (w) => flag(w, 'previsionsRatees') >= 2,
      sceneId: 'arrivee_simon',
    },
  },
];
