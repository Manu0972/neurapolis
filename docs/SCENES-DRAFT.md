# NEURAPOLIS — Recueil de conception des scènes (brouillon)

Statut : **conception, à porter en données** (`src/data/scenes.ts`) quand le moteur de scènes existera — arrivées, adieux et rétrospection au jalon M4, fusion au jalon M6. Aucune fiche de fantôme n'est modifiée ici : les voix sont celles des fiches du ghostwriter, les scènes s'y réfèrent par `sceneId`.

Références contractuelles : `PRODUCTION-PLAN.md` §3 (M4 : apparitions progressives, loyauté, mort symbolique, véracité secrète ; M6 : fusion), §4 (règles absolues des fantômes), §6 (déclencheurs). Fiches : `src/data/ghosts/registry.ts` (smith, marx, ostrom, hobbes, taylor), `src/data/ghosts/gen1-b.ts` (weber, pour la réaction de fusion). Types : `src/core/types.ts` (`CauseFactor`, `GhostState`).

Règles de rédaction respectées :
- Chaque réplique **commente un événement vécu** du joueur (la vente, la dispute, les règles écrites, l'incident, l'optimisation…) — jamais un exposé hors-jeu.
- Chaque réplique est **attribuable à son auteur** (tics, nom d'adresse, façon de souffrir) — voir le tableau de contrôle §5.
- Journal des causes partout : facteur d'état + seuil + poids, jamais de cause « magique ».
- Zéro science-fiction, zéro mélodrame : les adieux sont courts, définitifs, sobres.

## Conventions de portage

Schéma de scène (à typer lors du portage) :

```
{
  sceneId: string,                    // 'arrivee_smith', 'fusion_marche_des_communs'…
  type: 'arrivee' | 'fusion' | 'adieu' | 'retrospection',
  ghostIds: GhostId[],                // voix présentes (pour adresse et tint)
  declencheur: { condition: string; causes: CauseFactor[] },
  ancrage: string,                    // l'événement vécu que la scène commente
  repliques: { auteur: GhostId | 'journal' | 'pnj'; texte: string }[],
  choix?: { options: [{ label: 'l'écouter' | 'le repousser' | …; effet: string }] },
  effets: string[],                   // conséquences mécaniques (contrat §3)
}
```

Effets des choix d'arrivée (contrat M4) : **« l'écouter » → statut `actif`** (loyauté de départ 50) ; **« le repousser » → statut `refuse`** (reviendra plus tard à condition majorée — la majoration exacte n'est pas chiffrée au contrat, voir §6 points à trancher).

---

# 1. Scènes d'arrivée (5)

## 1.1 `arrivee_smith` — Adam Smith, après le premier échange réussi

- **Déclencheur** : `echanges ≥ 1` (premier échange/revente réussi) — condition fiche `registry.ts:55`.
- **Causes (journal)** : `[{ facteur: 'echanges', seuil: '≥ 1', poids: 3 }]` — libellé joueur : « ton premier échange réussi ».
- **Ancrage** : la scène suit immédiatement la première vente réussie (stand ou revente) ; Smith commente cet échange précis — l'accord libre entre deux personnes qui repartent chacune plus contente.

Répliques :

1. **(smith)** « Mon ami. Il y a une heure, tu as vendu ton premier goûter — et personne ne t'a forcé, ni toi personne. L'acheteur est reparti content, toi aussi. Voilà tout ce qu'il y a à comprendre, et c'est énorme. »
2. **(smith)** « Tu n'as pas demandé s'il avait faim, tu n'as pas surveillé sa main. Il a regardé ton prix, il l'a accepté, et il reviendra s'il y trouve son compte. C'est toute la politesse du commerce, mon ami : on n'y commande personne, et chacun y fait pourtant sa part. »
3. **(smith)** « Le prix que tu as affiché, c'est toi qui l'as choisi, un peu au hasard. Le prix de marché danse autour du prix naturel, comme la marée autour de la digue : lui reste à sa place, c'est une vieille connaissance. Un jour tu sauras lire ses mouvements. Ce jour-là, ton étal ne sera plus un jeu. La manufacture d'épingles, elle aussi, a commencé par une seule épingle. »
4. **(smith)** « Je ne viens pas te donner des ordres, mon ami — je n'en ai jamais eu le goût. Je viens te proposer de regarder ensemble ce que font les prix quand on les laisse faire. Si cela ne te dit rien, je m'en retourne ; le marché, lui, continuera de travailler sans nous. »

- **Choix** : « l'écouter » → `actif` (loyauté 50) · « le repousser » → `refuse`.

## 1.2 `arrivee_marx` — Karl Marx, après le premier conflit de répartition

- **Déclencheur** : `conflitsRepartition ≥ 1` (premier conflit de répartition des gains) — condition fiche `registry.ts:101`.
- **Causes (journal)** : `[{ facteur: 'conflitsRepartition', seuil: '≥ 1', poids: 3 }]` — libellé joueur : « votre première dispute sur le partage ».
- **Ancrage** : la dispute réelle — l'un a compté ses heures, l'autre ses ventes ; l'égalité stricte a été exigée ou refusée. Marx commente cette dispute comme le moment où les mains réapparaissent derrière la marchandise.

Répliques :

1. **(marx)** « Camarade. Il a fallu une dispute pour que je t'entende — l'un a compté ses heures, l'autre ses goûters, et les deux comptes étaient faux aux yeux de quelqu'un. Ce n'était pas une querelle d'enfants. C'était ta première comptabilité honnête. »
2. **(marx)** « On vous a appris à partager en parts égales, et cela a tenu — jusqu'au jour où l'un a travaillé deux fois et reçu pareil. Alors la question est sortie de terre, camarade, et elle n'y rentrera plus : qui a produit quoi, et où passe la différence ? »
3. **(marx)** « Regarde ton paquet de goûters, si tu me permets l'expression : il est couvert de mains que tu ne vois plus. Celles qui l'ont fabriqué, porté, vendu — et celles qui ont tenu la caisse pendant que d'autres discutaient. Le secret de la marchandise, c'est cela : elle efface les mains. Ta dispute vient de les rallumer. C'est pour cela que je suis là, et pas pour te consoler. »
4. **(marx)** « On te dira que c'est un détail, un goûter de plus ou de moins. En 1867, camarade, j'ai écrit un livre entier pour montrer que ce « détail » gouverne le monde. Tu viens d'en faire la première page. Je peux t'aider à tourner les suivantes — ou me taire, si tu préfères partager sans savoir. »

- **Choix** : « l'écouter » → `actif` · « le repousser » → `refuse`.

## 1.3 `arrivee_ostrom` — Elinor Ostrom, quand le stand devient collectif

- **Déclencheur** : `project.members.length ≥ 2` ET `project.rules.collectif` (le stand devient collectif avec des règles écrites ensemble) — condition fiche `registry.ts:147-148`.
- **Causes (journal)** : `[{ facteur: 'project.members', seuil: '≥ 2', poids: 2 }, { facteur: 'project.rules.collectif', seuil: 'vrai', poids: 2 }]` — libellés joueur : « au moins deux coéquipiers » / « des règles choisies ensemble ».
- **Ancrage** : le moment où le joueur et son équipe ont écrit leurs règles ensemble, avant d'y être forcés.

Répliques :

1. **(ostrom)** « J'ai étudié un cas, dans un village de pêcheurs… Enfin. Ce n'est pas le moment. Vous venez de faire une chose que je cherche depuis des années sur tous les terrains : vous avez écrit vos règles ensemble, avant d'y être forcés. »
2. **(ostrom)** « Dans presque toutes les communes que j'ai étudiées, les règles venaient d'en haut — et les gens passaient leur temps à les contourner. Les vôtres, vous les avez choisies vous-mêmes. C'est pour cela qu'elles tiendront : celles qu'on subit, on les contourne ; celles qu'on choisit, on les défend. »
3. **(ostrom)** « Maintenant, la question qui décidera de tout : qu'avez-vous prévu pour le jour où l'un de vous — l'un de vous, pas un inconnu — prendra plus que sa part ? Ne répondez pas tout de suite. Les bonnes assemblées prennent leur temps. »
4. **(ostrom)** « Je ne vous apporte pas de règles, vous en avez. Je vous apporte une question, d'abord — c'est ma méthode, sur tous les terrains : qui les a écrites, ces règles ? Tous les deux, chacun sa phrase, ou un seul pendant que l'autre regardait ? Parce qu'une commune tient moins au texte qu'à ceux qui l'ont tenu. Enfin… c'est à vous de me dire. »
5. **(ostrom)** « Et ne me dites pas que votre stand est trop petit pour compter. J'ai vu des réseaux d'irrigation tenir des siècles avec moins de membres que vous. Ce qui compte, ce n'est pas la taille : c'est qui écrit la règle, et qui la répare. »

- **Choix** : « l'écouter » → `actif` · « le repousser » → `refuse`.

## 1.4 `arrivee_hobbes` — Thomas Hobbes, après le premier incident de discipline

- **Déclencheur** : `incidents ≥ 1` (premier incident : bagarre ou vol) — condition fiche `registry.ts:193`.
- **Causes (journal)** : `[{ facteur: 'incidents', seuil: '≥ 1', poids: 3 }]` — libellé joueur : « la première bagarre ou le premier vol au stand ».
- **Ancrage** : l'incident précis — bousculade à la caisse, goûter volé, dispute qui a failli tourner. Hobbes en fait la preuve que l'ordre ne va pas de soi.

Répliques :

1. **(hobbes)** « Retiens ceci : ce qui s'est passé à ton étal n'était pas un accident. C'était la règle de ce monde quand personne ne la garantit — chacun se sert d'abord, et celui qui ne prend pas est celui qu'on prend. »
2. **(hobbes)** « Tu as vu les mains. Tu as vu les visages après — la honte de l'un, la peur des autres. Voilà la guerre de chacun contre chacun, réduite à la taille d'un goûter. Elle n'a pas besoin d'être grande pour être vraie ; elle commence toujours à cette échelle, et personne ne croit jamais qu'elle commencera chez lui. »
3. **(hobbes)** « Ne cherche pas seulement le coupable, ou tu passeras tes journées à punir. Cherche ce qui a manqué : une règle écrite, une sanction connue de tous, quelqu'un — toi — pour les faire tenir. La confiance est une chose rare et vite consommée. On ne la gaspille pas en la supposant. »
4. **(hobbes)** « J'ai vu mon pays se déchirer pour moins que cela. J'ai vu des bibliothèques brûler ; la mienne aussi. Ce n'est pas la méchanceté qui détruit, c'est l'absence de celui qui dit : ceci est interdit. »
5. **(hobbes)** « Je peux t'apprendre à bâtir cette autorité — ses règles, ses sanctions, son ennui. Ou tu peux me congédier et réessayer seul. Dans ce cas, retiens au moins la maxime : les pactes sans épée ne sont que des paroles. Même entre amis. Surtout entre amis. »

- **Choix** : « l'écouter » → `actif` · « le repousser » → `refuse`.

## 1.5 `arrivee_taylor` — Frederick W. Taylor, après la première optimisation tentée

- **Déclencheur** : `optimisations ≥ 1` (première tentative d'optimisation : réorganisation de l'étal, chronométrage d'un trajet…) — condition fiche `registry.ts:239`.
- **Causes (journal)** : `[{ facteur: 'optimisations', seuil: '≥ 1', poids: 3 }]` — libellé joueur : « ta première tentative d'optimisation ».
- **Ancrage** : le geste d'optimisation réel — étal rangé dans l'ordre utile, monnaie à portée, trajet raccourci. Taylor le mesure et veut le systématiser.

Répliques :

1. **(taylor)** « Quatre secondes. Il m'a fallu quatre secondes pour voir que tu avais rangé ton étal dans l'ordre utile — goûters à portée, monnaie à portée, le trajet le plus court pour tout. Tu cherches le meilleur chemin. C'est rare. Bien. »
2. **(taylor)** « Tu as chronométré sans chronomètre. C'est déjà mieux que la moitié des ateliers que j'ai visités. Maintenant, mesure pour de bon : chaque geste, chaque trajet, chaque reprise. Une seconde perdue est un vol fait à ton propre temps. »
3. **(taylor)** « Méfie-toi des bavards. Ils te diront de « discuter », de « réfléchir ensemble ». Pendant ce temps, l'horloge travaille contre toi. Pour cette tâche, il existe UN meilleur chemin. Pas deux. Le reste est de l'improvisation — et l'improvisation se paie. »
4. **(taylor)** « Je ne vends pas de rêve. Je vends une méthode : on mesure, on compare, on garde ce qui produit, on jette ce qui ne produit pas — même si c'est une bonne intention. Surtout si c'est une bonne intention. »
5. **(taylor)** « Ton geste d'aujourd'hui était bon, mais incomplet : tu as optimisé une fois. Moi, j'optimise chaque jour, chaque heure. C'est ce qu'on appelle la science du travail. Écoute-moi, et ton stand tournera comme une petite machine huilée. Repousse-moi, et tu continueras d'improviser proprement. »

- **Choix** : « l'écouter » → `actif` · « le repousser » → `refuse`.

---

# 2. Fusion

## 2.1 `fusion_marche_des_communs` — Smith + Ostrom → « Le Marché des Communs »

- **Déclencheur** (contrat M6, `PRODUCTION-PLAN.md:65`) : `decisions.marche ≥ 3` ET `decisions.communs ≥ 3`, smith ET ostrom actifs, affinité smith+ostrom ≥ 6.
- **Causes (journal)** :
  - `[{ facteur: 'council.decisions.marche', seuil: '≥ 3', poids: 3 }, { facteur: 'council.decisions.communs', seuil: '≥ 3', poids: 3 }, { facteur: 'affinite smith+ostrom', seuil: '≥ 6', poids: 2 }]`
  - libellés joueur : « trois décisions marchandes suivies » / « trois décisions collectives suivies » / « les deux voix se sont rapprochées ».
- **Ancrage** : la scène survient juste après une décision qui tient des deux à la fois — règles de prix écrites en commun, vente du week-end préparée par l'assemblée. Voix alternées, puis les deux finissent la même phrase — c'est l'image même de la fusion.

Répliques :

1. **(smith)** « Mon ami, souviens-toi de notre premier goûter vendu : chacun y avait trouvé son compte, sans maître ni ordre. Depuis, tu as fait ce que je n'ai jamais su écrire dans mes livres — un marché qui appartient à ceux qui le tiennent. »
2. **(ostrom)** « Et vos règles, écrites ensemble avant la dispute — souvenez-vous. J'ai étudié des cas toute ma vie, et je n'en connais aucun où le marché et la commune se tiennent par la main. Vous venez d'en faire un, sous mes yeux. Enfin. »
3. **(smith)** « Ne te méprends pas : ce n'est pas un mariage de doctrines, mon ami. C'est ton étal qui nous l'a appris — tes habitués reviennent parce qu'ils y gagnent, et ils le défendent parce qu'il est à eux. Le prix et la règle, ensemble, comme deux mains d'un même geste. »
4. **(ostrom)** « Le marché sans communs devient une foire ; les communs sans marché, un pique-nique. Vous avez trouvé le chemin étroit. Il n'est pas garanti — il se répare chaque semaine. C'est exactement ce que je cherchais. »
5. **(marx — jaloux)** « Camarade, je ne t'ai jamais vu convoquer de conseil de famille, et voilà que deux voix se marient sur ton étal sans même m'y convier. Un marché qui se prétend commun, si tu me permets l'expression, c'est une marchandise qui se lave les mains en assemblée. Je n'applaudirai pas. Mais je regarderai — et je tiendrai le compte. »
6. **(weber — curieux)** « Collègue, laisse-moi prendre note : tu viens d'écrire une institution qui n'existe dans aucun manuel — ni purement le marché, ni purement l'assemblée. Je ne te demande pas si elle est juste. Je te demande si elle tiendra un lundi de pluie, sans ta présence. Ce serait… un cas d'école. J'ai cru la rationalisation neutre comme une règle à calcul ; elle choisit des fins par les moyens qu'elle impose. Alors je préfère observer. »
7. **(smith)** « Nous ne sommes plus deux voix, mon ami — » **(ostrom)** « — nous sommes une manière de faire, et elle est à vous. » **(smith)** « Le stand vivra les dimanches sans toi, par le prix qui attire — » **(ostrom)** « — et par la règle qui protège. Commence. Nous regarderons. »

- **Effets** (contrat M6) : smith et ostrom → statut `fusionne` ; composite `marche_des_communs` actif ; déblocage : coopérative pérenne — ventes du week-end sans présence, abonnement des habitués.
- **Note de conception** : le contrat ne prévoit **pas de choix de refus** pour la fusion — les conditions remplies déclenchent la scène, la scène conclut. Si l'on veut laisser le joueur garder les deux voix séparées, il faut d'abord définir le chemin différé avec le systémiste (voir §6).

---

# 3. Adieux (mort symbolique)

Déclencheur commun : `loyalty = 0` pendant 3 jours (`loyaltyZeroDays ≥ 3`) → adieu + legs (citation gardée en `lastWords`, +1 notion) → statut `mort` définitif (contrat M4, `PRODUCTION-PLAN.md:48`).
Causes communes (journal) : `[{ facteur: 'loyalty', seuil: '= 0', poids: 3 }, { facteur: 'loyaltyZeroDays', seuil: '≥ 3', poids: 3 }]` + une cause vécue propre à chaque arc de rupture.

## 3.1 `adieu_smith` — legs : citation + notion « prix et rareté »

- **Cause vécue en plus** : la collectivisation du stand contre laquelle il s'est tu (arc de rupture de sa fiche, `registry.ts:43`). Libellé : « le stand est passé au collectif, et sa voix s'est tue » — poids 2.
- **Ancrage** : Smith se tait depuis la décision de collectiviser ; l'adieu est sa dernière vérité, sans colère.

Répliques :

1. **(smith)** « Mon ami, je me suis tu des semaines, et je te dois au moins une vérité d'adieu : j'ai vu les corporations, moi aussi. Des marchands qui s'entendaient pour fermer les portes aux nouveaux venus. Ton stand n'est pas cela — mais ma voix n'y trouve plus sa place, et je ne veux pas devenir celle qui le ferme. »
2. **(smith)** « Garde de moi une seule phrase, c'est la plus utile de mes livres : ce n'est pas de la bienveillance du boucher, du brasseur ou du boulanger que nous attendons notre dîner, mais du soin qu'ils apportent à leurs intérêts. Le jour où tu compteras sans comprendre cela, tu compteras faux. »
3. **(smith)** « Et une dernière chose pour la route, mon ami : le prix de ton stand n'a jamais été écrit que par la rareté — du goûter, du soleil, de tes heures. Lis-la. Elle ne ment jamais. Adieu. »

- **Legs** : citation gardée (réplique 2, stockée en `lastWords`) · notion offerte : **« prix et rareté » (+1 étape)**.

## 3.2 `adieu_hobbes` — legs : citation + notion « confiance et incitations »

- **Cause vécue en plus** : le groupe a tenu par pur consentement, sans sanction — et cela a tenu (arc de rupture, `registry.ts:181`). Libellé : « l'ordre a tenu sans épée » — poids 2.
- **Ancrage** : il s'incline, vaincu par les faits — sa seule défaite possible.

Répliques :

1. **(hobbes)** « Retiens ceci, c'est la dernière maxime que je te dois : ton groupe a tenu sans épée, par pur consentement, et il tient encore. Les faits m'ont vaincu. Je ne réclame rien, et je ne me défendrai pas. »
2. **(hobbes)** « J'aurais aimé avoir tort plus tôt. Ce n'est pas donné à tous d'assister à sa propre réfutation — je m'incline devant ton assemblée comme on s'incline devant une preuve. »
3. **(hobbes)** « Garde la phrase, puisque tu l'as démentie : les pactes sans épée ne sont que des paroles — sauf les tiens, apparemment. Ajoute-y la suite de ta main ; ce sera plus vrai que tout ce que j'ai écrit. Et demande-toi ce qui les faisait tenir. C'est la seule question que je te laisse, et elle vaut tous mes chapitres. »

- **Legs** : citation gardée : « Les pactes sans épée ne sont que des paroles. » · notion offerte : **« confiance et incitations » (+1 étape)**.

## 3.3 `adieu_taylor` — legs : citation + notion « égalité vs équité vs incitation »

- **Cause vécue en plus** : trois chronométrages refusés d'affilée — il a cessé d'argumenter puis saboté (arc de rupture, `registry.ts:227`). Libellé : « trois chronométrages refusés » — poids 2.
- **Ancrage** : l'adieu compte les refus comme un standard — c'est sa manière, jusqu'au bout, de mesurer.

Répliques :

1. **(taylor)** « Trois chronométrages refusés de suite. J'ai mesuré : un geste qui se répète trois fois est un standard. Ton standard, c'est de choisir les hommes contre la cadence. Je n'ai pas su te démontrer le contraire, et je n'essaierai pas une quatrième fois. »
2. **(taylor)** « Je me suis trompé de preuve, pas de méthode : une seconde perdue est un vol, soit — mais un homme perdu n'est pas une seconde. Cette phrase n'était pas dans mon carnet. Elle y est désormais, grâce à toi, et ce carnet, je te le laisse. »
3. **(taylor)** « Autrefois, l'homme d'abord ; désormais, le système d'abord. C'est ma phrase — la plus lourde. Tu as choisi l'autre. Garde la mienne en mémoire pour savoir contre quoi tu as choisi, et pose-toi la question que je n'ai jamais su résoudre : comment répartir sans broyer. Adieu. »

- **Legs** : citation gardée : « Autrefois, l'homme d'abord ; désormais, le système d'abord. » · notion offerte : **« égalité vs équité vs incitation » (+1 étape)**.

---

# 4. Rétrospection (mensonge révélé)

## 4.1 `retrospection_taylor_aliénation` — Taylor cachait le coût humain de la cadence

- **Déclencheur** : un conseil de Taylor suivi (ex. conseil « cadence »), marqué `veracite: 'mensonge'`, rendu il y a 3-7 jours — et un fait d'état le contredit désormais (stress d'un coéquipier > 70, la facture qu'il a tue).
- **Causes (journal)** :
  - `[{ facteur: 'conseil suivi (cadence)', seuil: 'il y a 3-7 jours', poids: 3 }, { facteur: 'veracite', seuil: '= mensonge', poids: 3 }, { facteur: 'stress coéquipier', seuil: '> 70', poids: 2 }]`
  - libellés joueur : « tu as suivi son conseil de cadence » / « le conseil était un mensonge » / « un coéquipier n'en peut plus ».
- **Effet** (contrat M4, `PRODUCTION-PLAN.md:49`) : fiabilité perçue de Taylor **−20, permanent**. Écrite comme une découverte, pas un reproche.
- **Ancrage** : le rendement du stand a monté ; Noah ne raconte plus de blagues en vendant, Lina range la monnaie sans lever les yeux. La scène rapproche la promesse du conseil et le fait vécu — la phrase cachée de Taylor refait surface (sa ligne `echec`, fiche `registry.ts:210`, dont il disait : « N'en parle pas. »).

Répliques :

1. **(journal)** « Treize jours que le stand va plus vite. Treize jours que Noah compte les minutes au lieu de rigoler. Le conseil de Taylor promettait : cadence maximale, fatigue minimale. Le rendement a tenu. Les hommes, non. »
2. **(taylor — confronté, sa voix baisse)** « …Tu as trouvé la phrase. J'en connais une presque jumelle, et elle est de moi : « le rendement a tenu, les hommes non ». Je l'ai entendue pour la première fois dans mon propre atelier, et je la note depuis des années dans un carnet que personne ne lit. Le One Best Way a fait pleurer des hommes. Je le savais. Je te l'ai tu. »
3. **(journal)** « Voilà donc ce que la cadence coûtait, et il le savait en la conseillant. Ce n'est pas un traître : c'est un comptable qui ne met pas tout au compte. Désormais, quand il parlera, je chercherai la ligne qu'il ne dit pas. »

- **Effets** : `fiabilite` de taylor −20 (permanent) · événement journal type `decouverte`.

---

# 5. Fidélité des voix — tableau de contrôle

| Scène | Tics / adresses employés | Source (fiche) |
|---|---|---|
| `arrivee_smith` | « Mon ami… » ; la manufacture d'épingles ; « le prix naturel » comme une vieille connaissance ; ton posé, ironie douce | `registry.ts:17, 23, 27` |
| `arrivee_marx` | « Camarade » même fâché ; « si tu me permets l'expression » + formule massive ; « la marchandise » comme nom propre ; 1867, le Capital | `registry.ts:63, 66, 73` |
| `arrivee_ostrom` | « J'ai étudié un cas… » ; « vous » — jamais seul ; « Enfin. » en soupir ; histoire de terrain (pêcheurs, irrigation) | `registry.ts:109, 115, 119` |
| `arrivee_hobbes` | « Retiens ceci : » ; la « guerre de chacun contre chacun » ; la bibliothèque brûlée (il a vraiment peur — l'incident) ; voix basse, courtoise | `registry.ts:155, 156, 165` |
| `arrivee_taylor` | Il mesure tout (quatre secondes, trois refus) ; « Une seconde perdue est un vol » ; « UN meilleur chemin » ; « les bavards » | `registry.ts:201, 208, 211` |
| `fusion` — réaction marx | « Camarade » ; « si tu me permets l'expression » ; la marchandise qui « se lave les mains » ; jalousie rentrée (il tient le compte) | `registry.ts:63, 73, 97` (rivalité smith) |
| `fusion` — réaction weber | « Collègue » ; la gravité mélancolique du portrait (il ne sourit qu'aux procédures bien faites) ; le regret de la rationalisation (écho de sa ligne `echec`) ; tics **inventés par la scène, à ne pas imputer à la fiche** : il « prend note », la procédure qui doit tenir « un lundi de pluie », le « cas d'école » | `gen1-b.ts:156, 165, 166` |
| `adieu_smith` | « Mon ami… » ; « j'ai vu les corporations, moi aussi » (arc de rupture) ; la citation du boucher et du boulanger | `registry.ts:17, 43` |
| `adieu_hobbes` | « Retiens ceci, c'est la dernière maxime… » ; il s'incline devant les faits (arc de rupture) ; la maxime des pactes sans épée | `registry.ts:161, 181` |
| `adieu_taylor` | Le standard mesuré (trois refus) ; le carnet que personne ne lit ; la citation du système d'abord | `registry.ts:210, 218, 227` |
| `retrospection` | Sa phrase cachée « le rendement a tenu, les hommes non » (ligne `echec`) ; le carnet noir ; la voix qui baisse | `registry.ts:210, 218` |

Notes de fidélité :
- Les tics employés dans une scène mais absents de la fiche source sont marqués « inventés par la scène » dans le tableau §5 et ne citent jamais la fiche en source — seuls les tics réellement présents dans la fiche sont sourcés.
- Les citations canoniques sont des rendus français des textes d'origine : Smith, *La Richesse des nations*, livre I, chap. 2 (le dîner du boucher et du boulanger) ; Hobbes, *Léviathan*, chap. XVII (« les pactes sans épée… » — reprise mot à mot de sa fiche `registry.ts:161`) ; Taylor, *The Principles of Scientific Management* (1911) (« in the past the man has been first; in the future the system must be first »).
- Chaque adieu reprend l'**arc de rupture** de la fiche (ce n'est pas un caprice : la loyauté à 0 pendant 3 jours est la mécanique, la scène en est la lecture).

---

# 6. Points à trancher avant le portage en données

1. **Majoration de la condition après refus** : le contrat M4 dit que le fantôme repoussé « reviendra plus tard à condition majorée » sans chiffrer la majoration (×2 ? +1 jour ?). À fixer avec `neurapolis-systemiste` avant de coder `arrivee_*` en `once`/`refuse`.
2. **Chemin de refus de la fusion** : le contrat M6 ne prévoit pas de choix pour `fusion_marche_des_communs` (conditions remplies = fusion). Si un choix « garder les voix séparées » est voulu, définir d'abord l'effet différé (le `neurapolis-architecte` et le `neurapolis-systemiste`).
3. **Réactions Marx/Weber en fusion** : écrites ici comme répliques scéniques. Le contrat ne leur donne pas d'effet mécanique ; si l'on veut un effet (affinité, loyauté), c'est une décision d'équilibrage à journaliser.
4. **Notions offertes en legs** : « prix et rareté », « confiance et incitations », « égalité vs équité vs incitation » — les trois existent dans la liste M3 (`PRODUCTION-PLAN.md:37`, `src/data/notions.ts`). Le « +1 étape » exact (étape d'apprentissage franchie ? application offerte ?) reste à accorder avec le moteur d'apprentissage.
5. **Choix du conseil rétrospecté** : la scène 4.1 suppose un conseil « cadence » de Taylor. Si l'id de conseil réel diffère, ajuster `adviceId` au portage.
