/**
 * Dialogues des coéquipiers (QA vague 11) : une fois Noah ou Lina recrutés, « Et si on le montait
 * ensemble ? » n'a plus de sens. Sur les sujets du stand, ils parlent du stand en équipe.
 */
import type { DialogueTone } from './dialogue';

/** Répliques du coéquipier, par sujet (tirées au PRNG du monde). */
export const TEAM_LINES: Record<string, Record<string, readonly string[]>> = {
  noah: {
    projet: [
      'Hier j’ai redessiné notre logo. Tu crois qu’on peut l’imprimer en autocollants ?',
      'Le stand marche bien, mais on se marche dessus derrière la table. Faut s’organiser.',
      'J’ai vu des gens repartir sans rien acheter. On pourrait leur faire goûter, non ?',
    ],
    argent: [
      'Ma part de la caisse, je la garde pour un skate… ou je la remets dans le stand ?',
      'On a combien dans la caisse, là ? Je compte jamais pareil que Lina.',
      'Si on vend plus, on pourra acheter en plus gros chez Mme Bertin, non ?',
    ],
  },
  lina: {
    projet: [
      'J’ai fait le point sur la caisse : on est dans le vert, mais tout juste.',
      'Il nous faudrait un planning : qui tient le stand, qui va chercher le stock.',
      'Les clients aiment qu’on rende la monnaie vite. Je propose une boîte à pièces triée.',
    ],
    argent: [
      'On devrait garder une réserve dans la caisse, au cas où un carton serait abîmé.',
      'Je note chaque vente dans le cahier. Comme ça, personne ne se dispute sur les parts.',
    ],
  },
};

type TeamReply = { tone: DialogueTone; label: string };

/** Réponses du joueur à un coéquipier (mêmes tons que les sujets ordinaires). */
export const TEAM_REPLIES: Record<string, readonly TeamReply[]> = {
  projet: [
    { tone: 'motive', label: '« On vise quoi pour la prochaine vente ? »' },
    { tone: 'curieux', label: '« Qu’est-ce qui coince, d’après toi ? »' },
    { tone: 'taquin', label: '« Le meilleur vendeur de la semaine a droit aux chouquettes. »' },
  ],
  argent: [
    { tone: 'motive', label: '« On remet une part de la caisse dans le stock ? »' },
    { tone: 'curieux', label: '« Tu trouves le partage juste ? »' },
    { tone: 'chaleureux', label: '« Sans toi, la caisse serait vide, tu sais. »' },
  ],
};

/** Réactions du coéquipier selon le ton. */
export const TEAM_REACTIONS: Record<string, Partial<Record<DialogueTone, string>>> = {
  noah: {
    motive: '« Ok chef ! Je refais l’affiche, en plus gros cette fois. »',
    curieux: '« Franchement ? Les gens passent trop vite. Faut un truc qui se voit de loin. »',
    taquin: '« Pari tenu. Prépare tes chouquettes. »',
    chaleureux: '« Arrête, tu vas me faire rougir… Mais merci. »',
  },
  lina: {
    motive: '« D’accord. Je le note dans le cahier de caisse, chiffres à l’appui. »',
    curieux: '« Les marges sur les compotes sont trop faibles. Je t’ai fait un tableau. »',
    taquin: '« Pari tenu. Mais c’est moi qui compte les ventes. »',
    chaleureux: '« Merci. C’est agréable de travailler avec quelqu’un qui écoute. »',
  },
};
