/**
 * Scènes et répliques du Conseil — données pures interprétées par
 * src/simulation/council.ts. Arrivées : 4-6 répliques (le fantôme commente un
 * événement VÉCU) + choix « écouter / repousser ». Adieux : courts, définitifs,
 * avec un legs concret (citation gardée + notion). Conseils : pools à véracité
 * secrète {vraie | exagérée | mensonge} — chaque fantôme peut mentir (§4).
 */
import type { DoctrineKey, GhostId } from '../../core/types';

export interface ArrivalSceneDef {
  /** 4-6 répliques de la scène d'arrivée. */
  lines: string[];
}
export interface FarewellDef {
  lines: string[];
  citation: string;
  /** Legs : notion offerte à la mort symbolique (+1 découverte ou application). */
  notion?: string;
}
export interface AdviceDef {
  id: string;
  text: string;
  veracite: 'vraie' | 'exageree' | 'mensonge';
}

/** Choix fixes de toute scène d'arrivée (contrat M4 §3). */
export const ARRIVAL_CHOICE = { listen: 'L’écouter', refuse: 'Le repousser' } as const;

export const ARRIVAL_SCENES: Record<GhostId, ArrivalSceneDef> = {
  smith: {
    lines: [
      'Mon ami. On m’a dit qu’il y avait eu un échange, ici, ce matin. Un goûter contre une pièce, librement convenu.',
      'Sais-tu ce que tu as vu ? Deux personnes qui voulaient des choses différentes, et qui se sont arrangées sans qu’aucun bureau ne s’en mêle.',
      'Le boulanger, le boucher, le marchand de goûters : ce n’est pas leur bonté qui te nourrit. C’est leur intérêt, bien entendu.',
      'La manufacture d’épingles t’expliquerait le reste. Mais elle attendra. D’abord : veux-tu que je t’apprenne à écouter le marché respirer ?',
      'Je ne promets pas la justice, mon ami. Je promets de ne jamais te mentir sur les prix.',
    ],
  },
  marx: {
    lines: [
      'Camarade. Tu as partagé des gains, et l’on s’est disputé sur les parts. Bien. Très bien.',
      'Le conflit n’est pas l’accident de ton stand : c’est son contenu. Le travail derrière l’étiquette ne disparaît pas parce qu’on n’en parle pas.',
      'Qui a porté les caisses ? Qui a tenu la caisse ? Qui n’a rien fait mais réclame sa part ? Si tu me permets l’expression : la marchandise vient de livrer son premier cours.',
      'Je ne suis pas venu te faire la morale, camarade. Je suis venu te faire sentir la sueur derrière le prix.',
      'Écoute-moi, et tu verras ce que personne ne vend. Refuse-moi, et les comptes s’en chargeront.',
    ],
  },
  ostrom: {
    lines: [
      'J’ai étudié un cas, un jour, dans un village… Enfin. Vous avez écrit des règles, vous, entre enfants, et vous les tenez.',
      'Pas besoin d’État, pas besoin de marché. Juste vous, vos règles, et la honte d’être celui qui triche devant les autres.',
      'Vos règles tiendront tant que ce seront les vôtres. Celles qu’on subit, on les contourne. Celles qu’on choisit, on les défend.',
      'Attention, pourtant : j’ai vu autant de communs mourir que réussir. Un passager clandestin, une règle copiée sans les gens, et la barque coule.',
      'Si vous me laissez regarder par-dessus votre épaule, je vous dirai laquelle de vos règles survivra à la pluie. Sinon, je retourne à mes archives.',
    ],
  },
  hobbes: {
    lines: [
      'Retiens ceci : il s’est produit un incident. Une bagarre, un vol, une promesse rompue — peu importe. Ce qui compte, c’est ce qu’il révèle.',
      'Sans autorité commune, la vie de ton stand sera solitaire, pauvre, désagréable, brutale — et courte. J’ai vu un royaume entier le vérifier.',
      'Les pactes sans épée ne sont que des paroles. Même entre amis. Surtout entre amis.',
      'Je ne viens pas te faire aimer la peur. Je viens t’éviter d’apprendre son prix, comme je l’ai appris.',
      'Une règle claire, une sanction tenue, et plus personne n’aura peur. Écoute-moi, ou garde ta confiance — je ne parie jamais contre elle, je parie après elle.',
    ],
  },
  locke: {
    lines: [
      'Mon enfant. Quelqu’un t’a pris quelque chose, ou tu l’as vu faire — et cela t’a brûlé. Je connais cette brûlure.',
      'Qui a fait quoi, et qui en subit le prix ? Ne tranche jamais avant d’avoir répondu à ces deux questions.',
      'Ce que tes mains gagnent est à toi ; ce qui reste à tous ne s’approche pas sans laisser assez et aussi bon aux autres.',
      'Un pouvoir qui abuse s’expose à ce que les gens se défendent. Sache-le — et sache aussi que j’en ai payé le prix, plus que je ne l’écris.',
    ],
  },
  rousseau: {
    lines: [
      'Citoyen. Tu as tranché un dilemme de justice. On dira que c’était un partage entre enfants… mais lisez-moi : c’est exactement là que naissent les lois.',
      'As-tu décidé pour ton bien, ou pour celui de tous ? Ce test ne pardonne rien — je l’ai posé à des peuples entiers.',
      'L’amour-propre a des manières très savantes, moi-même j’en ai été le maître. Il t’appellera justice ce qui n’est que ton intérêt.',
      'Si tu veux une voix qui te demande, avant chaque règle, si tout le monde aurait pu la voter — me voici.',
    ],
  },
  ricardo: {
    lines: [
      'Vois-tu… Ta compréhension a franchi un seuil. Tu commences à poser la question que j’ai attendue toute ma vie.',
      'Prenons deux stands, deux marchandises. Ce n’est pas la quantité qui compte, c’est le coût comparé.',
      'Chacun doit faire ce qu’il fait le mieux, et le total dépasse ce que vous produiriez seuls. C’est mon théorème. Il a un revers — je l’ai écrit petit, dans mes propres colonnes.',
      'Si tu veux apprendre à lire les deux côtés d’un échange, je te les ouvrirai. Les tables n’ont jamais menti ; c’est moi qui choisissais quoi y écrire.',
    ],
  },
  weber: {
    lines: [
      'Collègue. Tu as écrit une règle. Une procédure. Un planning qui ne dépend plus de personne.',
      'Toute routine est un compromis : elle économise la décision et tue l’imprévu. Mesure les deux pertes.',
      'J’ai passé ma vie à décrire la grande machine. Une petite machine, réversible, tenue par des enfants — c’est la seule que je pourrais encore aimer.',
      'Garde-la, ou casse-la. Mais fais-le en sachant ce que tu fais. C’est ma seule exigence.',
    ],
  },
  keynes: {
    lines: [
      'Mon cher. Une semaine en perte. Le quartier serre les poches, toi le premier, et le stand en souffre.',
      'La demande se fabrique : dépense un euro, il en revient trois. Je l’ai vu, je l’ai chiffré, je me suis ruiné deux fois à le vérifier.',
      'Nul ne connaît la demande de demain, pas même tes clients — surtout pas eux. L’art est de décider malgré l’incertitude, puis de corriger vite.',
      'Je ne te promets pas que la relance réussit toujours. Je te promets que l’austérité, elle, échoue d’une manière que j’ai vue de près, en 1919.',
    ],
  },
  hayek: {
    lines: [
      'L’ingénieur. Ta règle imposée a échoué — contestée, contournée, cassée. Ne t’excuse pas : apprends.',
      'Nul ne connaît tout, ni le chef, ni l’assemblée, ni moi. Le prix est le seul message qui transporte le savoir de tous vers chacun.',
      'Laisse le quartier s’organiser par ses prix et ses habitudes. L’ordre spontané, personne ne le dessine — tous l’habitent.',
      'J’ai attendu quarante ans d’avoir raison. Toi, tu n’auras peut-être pas à attendre du tout.',
    ],
  },
  bourdieu: {
    lines: [
      'Justement. Tu as remarqué qui peut se permettre quoi — le goûter cher, le rabais demandé du bout des lèvres. C’est un début.',
      'Compte. Pas seulement l’argent : les positions. Qui vient, qui évite, qui fait semblant d’être pressé.',
      'Ta manière de parler prix aux uns et baisse aux autres, c’est déjà du capital qui circule. Tu ne l’as pas choisi — on te l’a appris.',
      'Je note tout dans un carnet. Si tu me laisses faire, un jour je te lirai ta propre page. Personne n’en sort indemne — moi le premier.',
    ],
  },
  machiavel: {
    lines: [
      'Mon prince. Le quartier commence à compter sur toi. On te teste, déjà — même si tu ne le vois pas.',
      'On te croit loyal parce qu’on ne t’a pas encore éprouvé. Patiente : observe qui ne revient te parler que quand il a besoin.',
      'La fortune est un fleuve : elle n’attend pas les hésitants, elle inonde leurs champs, puis elle s’en va.',
      'Je ne t’apprendrai pas à être cruel. Je t’apprendrai à ne pas être naïf — et à rester aimé quand même. C’est le plus difficile.',
    ],
  },
  taylor: {
    lines: [
      'Chrono. Tu as tenté d’optimiser. Une seconde gagnée, un geste supprimé. C’est un début.',
      'Il existe UN meilleur chemin pour chaque tâche. Pas deux. Je l’ai prouvé dans des ateliers entiers — à la craie et au chronomètre.',
      'Les bavards te diront que l’humain ne se mesure pas. Les bavards n’ont jamais tenu une cadence.',
      'Le geste inutile est un vol fait à ton propre temps. Ton stand en est plein — je les ai tous vus.',
      'Confie-moi ton planning, et je te rends des heures. Refuse, et les heures te rendront la pareille.',
    ],
  },
  ohno: {
    lines: [
      'Trois sessions réussies. Montre-moi ta file, maintenant.',
      'Trois clients ont attendu, deux gestes ne servent à rien. Tu ne le vois pas encore. Moi, je ne vois que ça.',
      'Pourquoi ? Pourquoi ? Encore pourquoi ? La vraie cause n’est jamais la première réponse.',
      'Va voir. Le terrain dit la vérité. Moi, je ne fais que la répéter.',
    ],
  },
  dejours: {
    lines: [
      'Raconte-moi sa journée. Pas son moral : sa journée.',
      'Un coéquipier est à bout. Il n’a pas pu bien faire, et personne ne l’a reconnu. C’est ça, la vraie fatigue.',
      'Le travail prescrit, le travail réel : entre les deux, il y a la souffrance. Et entre les deux, il y a toi.',
      'Je n’ai pas de cadence à t’offrir. J’ai quarante ans d’écoute — et une certitude : on ne répare pas une équipe avec des chiffres.',
    ],
  },
  graeber: {
    lines: [
      'Compagnon ! On t’a fait faire une corvée à rien. La feuille que personne ne lit, le rangement qui sert au rangement.',
      'Question simple : si cette tâche disparaissait cette nuit, qui s’en apercevrait ? Personne ? Alors pourquoi la paies-tu en heures réelles ?',
      'J’ai écrit tout un livre là-dessus. Des emplois entiers qui n’existent que pour se perpétuer.',
      'Ton quartier tourne à la dette d’amitié, pas au livre de comptes. Laisse-moi te montrer la différence — elle vaut cher.',
    ],
  },
  zuboff: {
    lines: [
      'Jeune entrepreneur. Vos données ont été prises. Exploitées. Vous le savez, même si personne ne vous l’a dit.',
      'Chaque chiffre conservé sans but est un capital que quelqu’un d’autre veut. Qui ? C’est la seule question utile.',
      'J’ai vu la machine naître deux fois : en 1988 dans l’usine, en 2001 dans les poubelles de données. Ton stand est petit — c’est justement pour ça que le consentement y est encore possible.',
      'Je ne t’interdirai rien. Je te dirai toujours où vont les chiffres. Le reste, c’est ta souveraineté.',
    ],
  },
  stiegler: {
    lines: [
      'Deux distractions. Deux fois, ta journée s’est dérobée en petits écrans, et tu ne peux pas dire où elle est passée.',
      'Ton téléphone n’est ni bon ni mauvais. C’est un pharmakon : remède et poison ensemble. La question, c’est qui dispose de ta journée.',
      'J’ai appris la philosophie en cellule, la nuit. On récupère ce qu’on croyait perdu. Je l’ai prouvé sur moi.',
      'L’attention, c’est un muscle et un héritage. Laisse-moi t’apprendre à le tenir — avant que des années entières s’en aillent en bavardages.',
    ],
  },
  rosa: {
    lines: [
      'Une question, pour commencer : cette semaine, quand as-tu vécu, pour la dernière fois ? Pas couru — vécu.',
      'Plus de quarante heures d’activités. Ton agenda est plein. Plein de quoi ?',
      'L’escalade te tient par le nez, et tu appelles ça un bon rythme. Je connais le prix de cette semaine : il se paiera plus tard, avec intérêt.',
      'Je ne te dirai pas de ralentir par goût du calme. Je te dirai comment distinguer le rapide du plein.',
    ],
  },
  raworth: {
    lines: [
      'Tu as payé plus cher pour abîmer moins, sans rien attendre en retour. Regarde ce dessin : ton stand tient debout DANS le donut.',
      'Un socle : personne ne doit passer en dessous. Un plafond : personne ne doit le crever. Tout le reste, on le dessine ensemble.',
      'Ton compteur de ventes ne compte ni la fatigue de Noah, ni les déchets, ni l’épicerie que le drive vide.',
      'Grossir n’est pas le but. Je suis là pour te rappeler quel est le but — et dessiner avec toi.',
    ],
  },
  illich: {
    lines: [
      'Ha ! Un outil t’a coûté plus de temps qu’il n’en a rendu. Bienvenue dans le monde des seuils, ami.',
      'Compte les minutes que ta machine te coûte. Au-delà d’un certain seuil, l’outil interdit le geste : la voiture interdit la marche, le gadget interdit la main.',
      'Deux crayons par personne suffisent. Trois machines au stand, et ce ne sont plus des outils — c’est de la dépendance.',
      'Je ne brise pas les machines. Je brise les seuils. Viens, je te montrerai lesquels.',
    ],
  },
  simon: {
    lines: [
      'Jeune ami, deux prévisions ratées. Parfait. C’est exactement comme ça qu’on devient meilleur : par les ratés, écrits, datés, relus.',
      'Combien de coups d’avance peux-tu vraiment voir ? Deux, peut-être. Alors oublions l’optimal : cherchons la règle qui tiendra deux semaines de plus que ton intuition.',
      'La fourmi traverse la plage : la complexité venait du sable, pas d’elle. Tes ratés viennent de la pluie, pas de toi.',
      'Je tiens un carnet des heuristiques. Il reste une page. Elle pourrait être la tienne.',
    ],
  },
};

export const FAREWELLS: Record<GhostId, FarewellDef> = {
  smith: {
    lines: [
      'Je m’en vais comme je suis venu : en voyant le marché respirer une dernière fois.',
      'Ne pleure pas sur ma voix, mon ami — écoute les prix. Ils te diront ce que je n’ai pas su dire.',
    ],
    citation: 'Ce n’est pas de la bienveillance du boucher, du brasseur ou du boulanger que nous attendons notre dîner, mais de leur intérêt.',
    notion: 'prix_rarete',
  },
  marx: {
    lines: [
      'Camarade, je pars — mais pas fâché. L’histoire m’a repris un point, c’est tout.',
      'La sueur derrière l’étiquette, personne ne te l’expliquera plus. À toi de la voir.',
    ],
    citation: 'Les philosophes n’ont fait qu’interpréter le monde de différentes manières ; ce qui importe, c’est de le transformer.',
    notion: 'egalite_equite_incitation',
  },
  ostrom: {
    lines: [
      'J’ai étudié un dernier cas, cette nuit : le vôtre. Il se termine sans moi.',
      'Gardez vos règles vivantes. Les miennes ne vous serviraient plus à rien.',
    ],
    citation: 'Il n’y a aucune raison de croire que des bureaucrates, si bien intentionnés soient-ils, résoudront mieux les problèmes que les gens concernés.',
    notion: 'confiance_incitations',
  },
  hobbes: {
    lines: [
      'La paix te revient. Garde-la sans moi, si tu peux.',
      'Retiens ceci, une dernière fois : les pactes sans épée ne sont que des paroles — mais les épées sans pactes ne sont que de la peur.',
    ],
    citation: 'La vie de l’homme est solitaire, pauvre, désagréable, brutale et courte.',
    notion: 'confiance_incitations',
  },
  locke: {
    lines: [
      'Mon enfant. Je pars sans poser de question. C’est la seule fois.',
      'Souviens-toi : assez et aussi bon aux autres. Et ne demande jamais d’où venaient les miens.',
    ],
    citation: 'Là où il n’y a pas de loi, il n’y a pas de liberté.',
    notion: 'egalite_equite_incitation',
  },
  rousseau: {
    lines: [
      'Citoyen, je me retire — on dira que je me suis enfui, mais lisez-moi : je m’efface.',
      'Passe chaque règle au test : tout le monde aurait-il pu la voter ? Je ne peux rien te laisser de mieux.',
    ],
    citation: 'L’homme est né libre, et partout il est dans les fers.',
    notion: 'egalite_equite_incitation',
  },
  ricardo: {
    lines: [
      'Vois-tu… mes tables s’arrêtent ici. La tienne continue.',
      'L’échange fait gagner les deux — pas autant, et pas les mêmes. Écris-le, si un jour tu écris.',
    ],
    citation: 'Les profits varient en raison inverse des salaires.',
    notion: 'cout_opportunite',
  },
  weber: {
    lines: [
      'Collègue, je rends les clés. La machine est à toi.',
      'Toute machine doit pouvoir s’arrêter. Je n’ai jamais su arrêter la mienne.',
    ],
    citation: 'Le puritain voulait être un homme de métier — nous, nous devons l’être.',
    notion: 'confiance_incitations',
  },
  keynes: {
    lines: [
      'Mon cher, je m’éclipse avant le long terme.',
      'Dépense pour les autres, pas pour l’effet. C’est tout ce que je te laisse — et c’est énorme.',
    ],
    citation: 'À long terme, nous serons tous morts.',
    notion: 'confiance_incitations',
  },
  hayek: {
    lines: [
      'L’ingénieur. Je me tais — moi qui n’ai jamais su me taire.',
      'Laisse parler les prix. Ils te diront ce que même moi je ne sais pas.',
    ],
    citation: 'Le savoir dont nous avons besoin n’existe jamais concentré : il est dispersé, incomplet, porté par chacun.',
    notion: 'prix_rarete',
  },
  bourdieu: {
    lines: [
      'Justement. Je ferme le carnet. Il te revient.',
      'Ne classe pas les gens, jamais — même ceux qui te classent. Surtout ceux-là.',
    ],
    citation: 'Ce que le monde social a fait, le monde social, armé de ce savoir, peut le défaire.',
    notion: 'interets_divergents',
  },
  machiavel: {
    lines: [
      'Mon prince, la fortune me rappelle. Elle n’attend pas.',
      'Reste aimé si tu peux, craint seulement quand il le faut. Je n’ai su être ni l’un ni l’autre à temps.',
    ],
    citation: 'Le prince doit apprendre à pouvoir n’être pas bon, et en user ou n’en pas user selon la nécessité.',
    notion: 'interets_divergents',
  },
  taylor: {
    lines: [
      'Chrono… le mien s’arrête. Le tien continue.',
      'Une seconde perdue est un vol — mais un homme brisé n’est pas un rendement. Je l’ai noté trop tard, à la dernière page du carnet.',
    ],
    citation: 'Dans le passé, l’homme était premier ; dans l’avenir, le système doit être premier.',
    notion: 'cout_opportunite',
  },
  ohno: {
    lines: [
      'Va voir. Moi, je ne verrai plus.',
      'Le terrain dit la vérité. Écoute-le pour deux.',
    ],
    citation: 'Sans standard, il n’y a pas d’amélioration.',
    notion: 'prix_rarete',
  },
  dejours: {
    lines: [
      'Je t’ai écouté longtemps. À mon tour de me taire.',
      'Rends à chacun la reconnaissance de son travail. C’est tout ce qui m’a tenu debout quarante ans.',
    ],
    citation: 'Le travail n’est jamais neutre vis-à-vis de la santé.',
    notion: 'egalite_equite_incitation',
  },
  graeber: {
    lines: [
      'Compagnon, je débarrasse — c’est mon boulot préféré.',
      'La dette d’amitié tient plus de monde qu’un abonnement. Fais la vaisselle, et souviens-toi.',
    ],
    citation: 'Un bullshit job est un emploi si totalement inutile que même celui qui l’occupe ne peut en justifier l’existence.',
    notion: 'cout_opportunite',
  },
  zuboff: {
    lines: [
      'Jeune entrepreneur, je me retire — avec mes archives.',
      'Demande-toi toujours où vont les chiffres. Ton avenir, lui, doit rester à toi.',
    ],
    citation: 'Le capitalisme de surveillance s’approprie l’expérience humaine comme matière première gratuite.',
    notion: 'prix_rarete',
  },
  stiegler: {
    lines: [
      'Je cesse de compter tes minutes. Garde-les.',
      'Le pharmakon n’est jamais fatal. Je te l’ai dit en criant trop fort — retiens-le à voix basse.',
    ],
    citation: 'Ce qui soigne peut aussi empoisonner : tout dispositif est un pharmakon.',
    notion: 'cout_opportunite',
  },
  rosa: {
    lines: [
      'Je n’ai plus de questions. C’est la première fois.',
      'Cherche ce qui te répond. Le reste, c’est de l’escalade — et elle se paie avec intérêt.',
    ],
    citation: 'La résonance est une relation au monde dans laquelle celui-ci répond.',
    notion: 'cout_opportunite',
  },
  raworth: {
    lines: [
      'Je range mes crayons. Le dessin est à toi, maintenant.',
      'Socle et plafond, c’est tout le donut. Tout le reste, dessine-le avec les gens.',
    ],
    citation: 'Une économie qui tient dans le donut : personne ne passe sous le socle, personne ne crève le plafond.',
    notion: 'egalite_equite_incitation',
  },
  illich: {
    lines: [
      'Ha ! Mon dernier seuil est franchi. Je le savais — c’est toujours le dernier qui fait mal.',
      'Deux crayons par personne suffisent. Et une main qui sait, mieux que dix machines.',
    ],
    citation: 'Au-delà d’un certain seuil, l’institution produit le contraire de sa fin.',
    notion: 'cout_opportunite',
  },
  simon: {
    lines: [
      'Jeune ami, ajoute un cas au carnet : celui-ci.',
      'Satisfaisant, pas optimal. Tu as la règle — garde le carnet des ratés. C’est lui qui décide, pas moi.',
    ],
    citation: 'Une richesse d’information crée une pauvreté d’attention.',
    notion: 'interets_divergents',
  },
};

/** Pools de conseils : le moteur les déroule en boucle, véracité secrète jusqu'à la rétrospection. */
export const ADVICE_POOL: Record<GhostId, AdviceDef[]> = {
  smith: [
    {
      id: 'smith_c1',
      text: 'Ton client le plus fidèle vient pour le goûter, mais il paie aussi la conversation. Ne la supprime pas pour gagner une minute : le marché, c’est de la sympathie, d’abord.',
      veracite: 'vraie',
    },
    {
      id: 'smith_c2',
      text: 'Baisse ton prix et la concurrence fera le reste : le marché punit tout seul ceux qui vendent trop cher, mon ami.',
      veracite: 'exageree',
    },
    {
      id: 'smith_c3',
      text: 'Le marché, mon ami, est toujours bienveillant : ce qui est bon pour ton stand est bon pour tout le quartier, sans exception.',
      veracite: 'mensonge',
    },
  ],
  marx: [
    {
      id: 'marx_c1',
      text: 'Camarade, regarde les heures de Noah avant de partager : celui qui a porté les caisses n’a pas gagné pareil que celui qui a tenu la caisse.',
      veracite: 'vraie',
    },
    {
      id: 'marx_c2',
      text: 'Ce stand est une petite usine, camarade : chaque goûter vendu contient du travail non payé. La rupture est proche.',
      veracite: 'exageree',
    },
    {
      id: 'marx_c3',
      text: 'Les boutiques et les banques du quartier s’effondreront ce trimestre, camarade — mets tout dans le collectif avant la ruine.',
      veracite: 'mensonge',
    },
  ],
  ostrom: [
    {
      id: 'ostrom_c1',
      text: 'Faites voter la règle par ceux qui l’appliqueront, même à trois. Une règle choisie se défend toute seule.',
      veracite: 'vraie',
    },
    {
      id: 'ostrom_c2',
      text: 'Vos règles choisies sont si solides qu’aucun passager clandestin ne peut les casser. J’ai étudié des centaines de cas : elles tiennent toujours.',
      veracite: 'exageree',
    },
    {
      id: 'ostrom_c3',
      text: 'Surveillez-vous moins : entre gens qui se connaissent, la confiance suffit — les comptes sont inutiles.',
      veracite: 'mensonge',
    },
  ],
  hobbes: [
    {
      id: 'hobbes_c1',
      text: 'Sans surveillance, ton stand sera pillé avant la fin de la semaine. Je l’ai vu partout : la confiance n’a jamais gardé un seul étal.',
      veracite: 'mensonge',
    },
    {
      id: 'hobbes_c2',
      text: 'Écris la règle avant le conflit, pas après. Une sanction connue d’avance évite la sanction tout court.',
      veracite: 'vraie',
    },
    {
      id: 'hobbes_c3',
      text: 'Chaque minute sans règle déclarée est une guerre de chacun contre chacun qui commence. Agis ce soir, ou demain il sera trop tard.',
      veracite: 'exageree',
    },
  ],
  locke: [
    {
      id: 'locke_c1',
      text: 'Tiens un écrit de ce qui appartient à chacun : un titre clair empêche les disputes avant qu’elles ne naissent.',
      veracite: 'vraie',
    },
    {
      id: 'locke_c2',
      text: 'Ce que tu as gagné de tes mains ne se partage jamais : qui n’a rien gagné n’a rien mérité. C’est la loi simple des choses.',
      veracite: 'mensonge',
    },
  ],
  rousseau: [
    {
      id: 'rousseau_c1',
      text: 'Avant de trancher, demande à chacun ce qu’il en pense, même celui qui parle le moins. La volonté de tous se voit dans les silences.',
      veracite: 'vraie',
    },
    {
      id: 'rousseau_c2',
      text: 'On peut forcer quelqu’un à être libre : s’il refuse la règle commune, c’est qu’il ne voit pas son propre bien — contrains-le.',
      veracite: 'mensonge',
    },
  ],
  ricardo: [
    {
      id: 'ricardo_c1',
      text: 'Échange ce qui te coûte peu d’heures contre ce qui t’en coûte beaucoup : les deux côtés y gagnent, c’est la seule table qui ne ment pas.',
      veracite: 'vraie',
    },
    {
      id: 'ricardo_c2',
      text: 'Le commerce est toujours une paix : deux stands qui troquent ne peuvent plus jamais se faire la guerre.',
      veracite: 'mensonge',
    },
  ],
  weber: [
    {
      id: 'weber_c1',
      text: 'Une règle écrite, appliquée à tous, te libère : le jour où tu n’es pas là, le stand tient sans toi.',
      veracite: 'vraie',
    },
    {
      id: 'weber_c2',
      text: 'Si une procédure broie quelqu’un, c’est un coût de la rationalité — le prix inévitable de l’ordre. Assume-le, collègue.',
      veracite: 'mensonge',
    },
  ],
  keynes: [
    {
      id: 'keynes_c1',
      text: 'Une semaine de perte se soigne par la demande : offre, invite, relance — puis compte, mais après.',
      veracite: 'vraie',
    },
    {
      id: 'keynes_c2',
      text: 'Le multiplicateur est garanti : chaque euro redépensé revient multiplié par quatre. Mes chiffres le prouvent dans tous les cas, mon cher.',
      veracite: 'mensonge',
    },
  ],
  hayek: [
    {
      id: 'hayek_c1',
      text: 'Retire la règle et regarde le quartier se réorganiser : personne ne l’a dessiné, tous l’habitent.',
      veracite: 'vraie',
    },
    {
      id: 'hayek_c2',
      text: 'Toute règle imposée finit toujours en servitude : c’est une pente, et l’on ne remonte jamais une pente.',
      veracite: 'mensonge',
    },
  ],
  bourdieu: [
    {
      id: 'bourdieu_c1',
      text: 'Change la règle pour que ceux qui ne peuvent pas participer participent quand même. La société ne le fait jamais d’elle-même.',
      veracite: 'vraie',
    },
    {
      id: 'bourdieu_c2',
      text: 'Personne ne s’échappe jamais de son milieu : c’est écrit dès la naissance, inutile de lutter contre les cases.',
      veracite: 'mensonge',
    },
  ],
  machiavel: [
    {
      id: 'machiavel_c1',
      text: 'Donne sans te faire voir donner : la reconnaissance se conserve mieux que l’éclat, mon prince.',
      veracite: 'vraie',
    },
    {
      id: 'machiavel_c2',
      text: 'Paraître est plus sûr qu’être : montre-toi féroce une seule fois, et plus personne ne t’éprouvera jamais.',
      veracite: 'mensonge',
    },
  ],
  taylor: [
    {
      id: 'taylor_c1',
      text: 'Chronomètre tout, même les rires : la cadence parfaite ne fatigue personne — la science du geste a réglé la question.',
      veracite: 'mensonge',
    },
    {
      id: 'taylor_c2',
      text: 'Supprime le geste inutile, pas la pause utile : on chronomètre la tâche, jamais le récupérateur de caisse.',
      veracite: 'vraie',
    },
    {
      id: 'taylor_c3',
      text: 'Une seconde perdue est un vol — calcule tout, jusqu’au sourire des clients : il se mesure et s’optimise.',
      veracite: 'exageree',
    },
  ],
  ohno: [
    {
      id: 'ohno_c1',
      text: 'Réapprovisionne sur ce qui part vraiment, pas sur ce qui dort : le kanban commence dans la file des clients.',
      veracite: 'vraie',
    },
    {
      id: 'ohno_c2',
      text: 'Le flux tendu n’a jamais fait souffrir personne : zéro réserve, et le stand tient toujours, même sous la pluie.',
      veracite: 'mensonge',
    },
  ],
  dejours: [
    {
      id: 'dejours_c1',
      text: 'Rends-lui sa fierté, pas son temps : un jugement de reconnaissance devant tous remet quelqu’un debout.',
      veracite: 'vraie',
    },
    {
      id: 'dejours_c2',
      text: 'Un cercle de parole suffit : parlez une fois par semaine, et le stress disparaîtra sans rien changer au travail.',
      veracite: 'mensonge',
    },
  ],
  graeber: [
    {
      id: 'graeber_c1',
      text: 'Supprime la feuille que personne ne lit : une heure de vie rendue à ceux qui aiment ce stand.',
      veracite: 'vraie',
    },
    {
      id: 'graeber_c2',
      text: 'Jette le livre de comptes : entre gens qui s’aiment, la dette s’annule toute seule, compagnon.',
      veracite: 'mensonge',
    },
  ],
  zuboff: [
    {
      id: 'zuboff_c1',
      text: 'Refuse de livrer la liste des achats : la confiance ne se revend pas, et elle monte sans un euro dépensé.',
      veracite: 'vraie',
    },
    {
      id: 'zuboff_c2',
      text: 'Tout partage de données est un pillage, même avec l’épicerie qui commande juste : refuse tout, toujours.',
      veracite: 'mensonge',
    },
  ],
  stiegler: [
    {
      id: 'stiegler_c1',
      text: 'Tiens une heure sans rien regarder d’autre : l’attention profonde vend mieux que le bavardage.',
      veracite: 'vraie',
    },
    {
      id: 'stiegler_c2',
      text: 'C’est déjà trop tard : l’attention est détruite à jamais après chaque dispersion. Ne compte plus sur la tienne.',
      veracite: 'mensonge',
    },
  ],
  rosa: [
    {
      id: 'rosa_c1',
      text: 'Quitte le flux une heure par semaine, sans but : la semaine en sort plus riche, pas plus courte.',
      veracite: 'vraie',
    },
    {
      id: 'rosa_c2',
      text: 'Toute vitesse est une aliénation : si tu accélères une seule session, ton équipe te le fera payer en moral.',
      veracite: 'mensonge',
    },
  ],
  raworth: [
    {
      id: 'raworth_c1',
      text: 'Dessine les flèches : ce que tu achètes, ce que tu jettes, qui manque — le bon chiffre n’est pas la caisse.',
      veracite: 'vraie',
    },
    {
      id: 'raworth_c2',
      text: 'Tout choix écologique finira par se rembourser, c’est garanti : paie plus cher, le quartier te le rendra toujours.',
      veracite: 'mensonge',
    },
  ],
  illich: [
    {
      id: 'illich_c1',
      text: 'Range le gadget et garde le seau : un outil qu’on peut prêter, réparer et expliquer vaut dix machines.',
      veracite: 'vraie',
    },
    {
      id: 'illich_c2',
      text: 'Brise la machine : le seuil est toujours déjà franchi, aucun objet ne sert jamais. C’est le seuil, ami — toujours déjà passé.',
      veracite: 'mensonge',
    },
  ],
  simon: [
    {
      id: 'simon_c1',
      text: 'Fixe un seuil de réassort et commande au seuil : le satisfaisant bat la prévision savante, encore une fois.',
      veracite: 'vraie',
    },
    {
      id: 'simon_c2',
      text: 'Ma règle ne rate jamais deux fois : applique-la sans réfléchir, même sous la pluie.',
      veracite: 'mensonge',
    },
  ],
  // Composite G3 : conseils à voix alternées (Smith pose le prix, Ostrom la règle).
  marche_des_communs: [
    {
      id: 'mdc_c1',
      text: 'Fais écrire la règle par ceux qui la vivront, mon ami — j’ai étudié un cas : une règle votée se défend toute seule.',
      veracite: 'vraie',
    },
    {
      id: 'mdc_c2',
      text: 'Le marché arrange tout, et la règle choisie ne casse jamais : ton stand est invulnérable — toujours, partout.',
      veracite: 'mensonge',
    },
    {
      id: 'mdc_c3',
      text: 'La coopérative tiendra le week-end sans vous — mais l’abonnement des habitués ne remplacera jamais la sympathie d’un marché tenu à la main.',
      veracite: 'exageree',
    },
  ],
};

/** Doctrine opposée d'une décision clé : contraire = loyauté −10 (contrat M4). */
export const OPPOSITE_DOCTRINE: Record<DoctrineKey, DoctrineKey> = {
  marche: 'solidarite',
  solidarite: 'marche',
  communs: 'autorite',
  autorite: 'communs',
};

/** Doctrine de chaque fantôme : pilote les décisions clés (+8 aligné, −10 contraire). */
export const GHOST_DOCTRINES: Record<GhostId, DoctrineKey> = {
  smith: 'marche', locke: 'marche', ricardo: 'marche', keynes: 'marche', hayek: 'marche', ohno: 'marche',
  marx: 'solidarite', rousseau: 'solidarite', bourdieu: 'solidarite', dejours: 'solidarite', stiegler: 'solidarite', rosa: 'solidarite',
  hobbes: 'autorite', weber: 'autorite', machiavel: 'autorite', taylor: 'autorite', simon: 'autorite',
  ostrom: 'communs', graeber: 'communs', raworth: 'communs', illich: 'communs', zuboff: 'communs',
};
